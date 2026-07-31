/* ════════════════════════════════════════════════════════════════════
 * Olivia Work Platform · 静态部署适配层 (static-fallback.js)
 * v10.6.1 — 让工作台在纯静态平台（Cloudflare Pages 等）上完整运行
 *
 * 原理：拦截所有 /api/* 请求，优先尝试调用后端；
 * 如果后端不存在（纯静态部署），自动生成 TRAE 桥接提示返回。
 * 这样用户零配置即可使用所有功能，AI 结果以可复制指令形式呈现。
 * ════════════════════════════════════════════════════════════════════ */

(function setupStaticFallback() {
  const originalFetch = window.fetch;

  // 判断是否在静态部署环境（非 localhost）
  const isStaticDeploy = (() => {
    const h = window.location.hostname;
    return h && h !== "localhost" && h !== "127.0.0.1" && h !== "0.0.0.0";
  })();

  // 标记是否已检测到后端可用
  let backendAvailable = null; // null=未检测, true=可用, false=不可用

  // ═══ 本地 TRAE 桥接提示生成器 ═══

  function buildChatPrompt(body) {
    const messages = body.messages || [];
    const lastMsg = messages[messages.length - 1] || {};
    const topic = String(lastMsg.content || body.topic || body.message || "").trim();
    const context = messages.slice(0, -1).map(m => `${m.role === "user" ? "用户" : "助手"}: ${m.content}`).join("\n");
    return [
      `# AI 对话任务`,
      ``,
      `请帮我完成以下对话：`,
      topic,
      context ? `\n背景上下文：\n${context.slice(0, 2000)}` : ``,
      ``,
      `要求：`,
      `- 使用中文回答`,
      `- 回答应专业、简洁、可操作`,
      `- 如有不确定的信息请标注`
    ].filter(Boolean).join("\n");
  }

  function buildResearchPrompt(body) {
    const topic = String(body.topic || "").trim();
    const depth = String(body.depth || "概览");
    return [
      `# 资料搜集任务`,
      ``,
      `研究主题：${topic}`,
      `研究深度：${depth}`,
      ``,
      `请执行以下步骤：`,
      `1. 搜索该主题的最新信息（2024-2026年）`,
      `2. 整理关键要点（${depth === "详细" ? "8-12条" : "5-8条"}）`,
      `3. 列出信息来源（标题+链接+简介）`,
      `4. 给出可执行的建议`,
      ``,
      `输出格式：结构化文本，包含摘要、要点、来源、建议四部分。`
    ].join("\n");
  }

  function buildWritePrompt(body) {
    const draft = body.draft || {};
    const platform = String(draft.platform || body.platform || "小红书");
    const topic = String(draft.title || body.topic || "").trim();
    const content = String(draft.body || body.draft || "").trim();
    const audience = String(draft.audience || "").trim();
    return [
      `# 写作任务`,
      ``,
      `平台：${platform}`,
      topic ? `主题/标题：${topic}` : ``,
      audience ? `目标人群：${audience}` : ``,
      content ? `\n已有草稿：\n${content.slice(0, 2000)}` : ``,
      ``,
      `请完成以下写作：`,
      `1. 生成 3 个吸引点击的标题候选`,
      `2. 起草完整正文（开头钩子+主体结构+结尾互动引导）`,
      `3. 生成封面文案（标题+副标题）`,
      `4. 推荐 8-10 个平台标签`,
      platform === "小红书" ? `\n注意：小红书风格，多用 emoji、短句、口语化` : ``
    ].filter(Boolean).join("\n");
  }

  function buildAnalyzePrompt(body) {
    const sourceType = String(body.sourceType || "产品/功能");
    const target = String(body.link || body.text || body.target || body.name || "").trim();
    return [
      `# 分析任务`,
      ``,
      `分析对象：${target || "待分析"}`,
      `分析类型：${sourceType}`,
      ``,
      `请从以下维度进行分析：`,
      `1. 目标用户与核心场景`,
      `2. 关键能力与交互亮点`,
      `3. 商业价值与盈利模式`,
      `4. 风险限制与潜在问题`,
      `5. 我可以迁移借鉴的启发（至少3条）`,
      ``,
      `输出要求：`,
      `- 使用中文`,
      `- 观点要有具体依据`,
      `- 启发部分要结合个人工作场景`
    ].join("\n");
  }

  function buildDailyLogPrompt(body) {
    const log = body.log || {};
    const summary = String(log.summary || "").trim();
    return [
      `# 日报分析任务`,
      ``,
      `今日记录：`,
      summary,
      ``,
      `请从以下维度分析：`,
      `1. 今日完成情况评估（完成度、效率）`,
      `2. 关键产出和进展`,
      `3. 存在的问题和风险`,
      `4. 改进建议`,
      `5. 明日重点建议（1-3条）`,
      ``,
      `输出要求：简洁、具体、可执行。`
    ].join("\n");
  }

  function buildHealthPrompt(body) {
    const scene = String(body.scene || "meal");
    const sceneMap = {
      meal: "减脂餐食谱推荐",
      daily: "一日三餐搭配",
      content: "健康推文推荐"
    };
    return [
      `# 健康推荐任务`,
      ``,
      `推荐类型：${sceneMap[scene] || scene}`,
      body.preference ? `个人偏好：${body.preference}` : ``,
      ``,
      scene === "meal" ? `请推荐 3-5 道减脂餐食谱，包含食材、做法、热量估算。` : ``,
      scene === "daily" ? `请推荐一周减脂一日三餐搭配方案，兼顾营养和口味。` : ``,
      scene === "content" ? `请推荐 3-5 条健康减脂相关推文内容，风格参考"一只白""邪修减肥"等博主。` : ``,
      ``,
      `输出要求：实用、具体、可操作。`
    ].filter(Boolean).join("\n");
  }

  function buildPmPrompt(body) {
    const type = String(body.type || "prd");
    const topic = String(body.topic || body.title || "").trim();
    const typeMap = {
      prd: "产品需求文档(PRD)",
      competitor: "竞品分析",
      userstory: "用户故事",
      review: "评审Checklist",
      roadmap: "产品路线图"
    };
    return [
      `# PM 知识生成任务`,
      ``,
      `生成类型：${typeMap[type] || type}`,
      topic ? `主题：${topic}` : ``,
      ``,
      `请生成完整的${typeMap[type] || type}，要求：`,
      `- 结构清晰，包含核心章节`,
      `- 内容具体、可落地`,
      `- 使用中文`,
      `- 结合当前行业最佳实践`
    ].filter(Boolean).join("\n");
  }

  function buildNotesPrompt(body) {
    const action = String(body.action || "summary");
    const content = String(body.content || body.text || "").trim();
    const actionMap = {
      summary: "摘要总结",
      classify: "PARA 分类",
      tags: "标签推荐",
      refine: "内容润色"
    };
    return [
      `# 笔记 AI 助手`,
      ``,
      `操作类型：${actionMap[action] || action}`,
      content ? `\n笔记内容：\n${content.slice(0, 2000)}` : ``,
      ``,
      `请对以上笔记内容进行${actionMap[action] || action}处理，输出结果要求简洁、准确。`
    ].filter(Boolean).join("\n");
  }

  function buildOkrPrompt(body) {
    const action = String(body.action || "breakdown");
    const goal = body.goal || {};
    const title = String(goal.title || body.title || "").trim();
    return [
      `# OKR AI 助手`,
      ``,
      `操作类型：${action === "breakdown" ? "目标拆解" : "进度分析"}`,
      title ? `目标：${title}` : ``,
      ``,
      action === "breakdown"
        ? `请将此目标拆解为 3-5 个关键结果(KR)，每个 KR 需要可量化、有时限。`
        : `请分析当前 OKR 进度，给出评估和调整建议。`,
      ``,
      `输出要求：具体、可执行、使用中文。`
    ].filter(Boolean).join("\n");
  }

  function buildEnglishPrompt(body) {
    const word = String(body.word || "").trim();
    return [
      `# 英语学习辅助`,
      ``,
      word ? `单词：${word}` : `请根据上下文辅助英语学习`,
      ``,
      `请提供：`,
      `1. 词义解释（中文）`,
      `2. 常见搭配和例句（2-3个）`,
      `3. 同义词/反义词`,
      `4. 记忆技巧`
    ].join("\n");
  }

  function buildFoodPrompt(body) {
    return [
      `# 食物识别`,
      ``,
      `请根据上传的图片识别食物，并提供：`,
      `1. 食物名称`,
      `2. 估计热量（千卡）`,
      `3. 主要营养成分`,
      `4. 健康建议`,
      ``,
      `注意：请在 TRAE 中上传图片后执行此指令。`
    ].join("\n");
  }

  function buildGeneratePrompt(body) {
    const prompt = String(body.prompt || body.message || "").trim();
    const moduleTitle = String(body.moduleTitle || "").trim();
    return [
      `# AI 生成任务`,
      moduleTitle ? `（模块：${moduleTitle}）` : ``,
      ``,
      `需求：`,
      prompt,
      ``,
      `要求：`,
      `- 使用中文回答`,
      `- 内容专业、结构清晰`,
      `- 如有不确定的信息请标注`
    ].filter(Boolean).join("\n");
  }

  // ═══ 路由匹配 → 生成对应桥接响应 ═══

  function generateBridgeResponse(apiPath, body) {
    const fallbackReason = "当前为静态部署模式，AI 已自动生成可复制指令，请复制到 TRAE 中执行";

    // /api/providers
    if (apiPath === "/api/providers") {
      return [{
        id: "trae",
        name: "TRAE桥接",
        configured: true,
        source: "bridge",
        model: "trae-bridge",
        strengths: ["零配置", "永远可用", "平台兜底"]
      }];
    }

    // /api/settings/info
    if (apiPath === "/api/settings/info") {
      return {
        ok: true,
        version: "10.6",
        serverTime: new Date().toISOString(),
        providersConfigured: 0,
        traeBridgeAvailable: true
      };
    }

    // /api/skills/search
    if (apiPath === "/api/skills/search") {
      return { results: [], total: 0 };
    }

    // 所有 AI 生成类接口 → 返回 trae-bridge 模式
    let prompt = "";
    let type = "chat";

    if (apiPath === "/api/ai/chat") {
      prompt = buildChatPrompt(body);
      type = "chat";
    } else if (apiPath === "/api/ai/generate") {
      prompt = buildGeneratePrompt(body);
      type = "generate";
    } else if (apiPath === "/api/ai/research") {
      prompt = buildResearchPrompt(body);
      type = "research";
    } else if (apiPath === "/api/inspiration/analyze") {
      prompt = buildAnalyzePrompt(body);
      type = "analyze";
    } else if (apiPath === "/api/daily-log/analyze") {
      prompt = buildDailyLogPrompt(body);
      type = "analyze";
    } else if (apiPath === "/api/content/draft") {
      prompt = buildWritePrompt(body);
      type = "write";
    } else if (apiPath === "/api/health/recommend") {
      prompt = buildHealthPrompt(body);
      type = "write";
    } else if (apiPath === "/api/health/food-recognize") {
      prompt = buildFoodPrompt(body);
      type = "analyze";
    } else if (apiPath === "/api/pm/generate") {
      prompt = buildPmPrompt(body);
      type = "write";
    } else if (apiPath === "/api/notes/ai") {
      prompt = buildNotesPrompt(body);
      type = "write";
    } else if (apiPath === "/api/okr/ai") {
      prompt = buildOkrPrompt(body);
      type = "write";
    } else if (apiPath === "/api/english/word-helper") {
      prompt = buildEnglishPrompt(body);
      type = "chat";
    } else if (apiPath === "/api/trae/bridge") {
      // 直接桥接接口
      const t = String(body.type || "chat");
      const payload = body.payload || {};
      if (t === "chat") prompt = buildChatPrompt(payload);
      else if (t === "research") prompt = buildResearchPrompt(payload);
      else if (t === "write") prompt = buildWritePrompt(payload);
      else if (t === "analyze") prompt = buildAnalyzePrompt(payload);
      else prompt = buildChatPrompt(payload);
    } else {
      // 未知接口，通用提示
      prompt = `# AI 任务\n\n请帮我处理以下需求：\n${JSON.stringify(body).slice(0, 1000)}\n\n请使用中文回答。`;
    }

    return {
      ok: true,
      mode: "trae-bridge",
      traePrompt: prompt,
      provider: "TRAE",
      model: "桥接模式",
      fallbackReason
    };
  }

  // ═══ 拦截 fetch ═══

  window.fetch = async function (url, options) {
    const urlStr = String(url);

    // 只拦截 /api/ 开头的请求
    if (!urlStr.startsWith("/api/")) {
      return originalFetch(url, options);
    }

    // 如果后端已确认可用，直接走原始 fetch
    if (backendAvailable === true) {
      return originalFetch(url, options);
    }

    // 尝试调用后端
    try {
      const res = await originalFetch(url, options);
      if (res.ok) {
        backendAvailable = true; // 后端可用，后续直接走后端
        return res;
      }
      // 非 200 响应，可能后端有问题
      if (res.status === 404) {
        backendAvailable = false;
      }
    } catch (e) {
      // 网络错误，后端不可用
      backendAvailable = false;
    }

    // 后端不可用 → 生成本地 TRAE 桥接响应
    let body = {};
    if (options && options.body) {
      try {
        body = JSON.parse(options.body);
      } catch (e) {
        try {
          body = JSON.parse(await options.body.text());
        } catch (e2) {
          body = {};
        }
      }
    }

    const bridgeResult = generateBridgeResponse(urlStr, body);

    // /api/providers 和 /api/skills/search 返回数组或对象（非 trae-bridge 格式）
    if (urlStr === "/api/providers" || urlStr === "/api/skills/search" || urlStr === "/api/settings/info") {
      return new Response(JSON.stringify(bridgeResult), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 其他接口返回 trae-bridge 模式响应
    return new Response(JSON.stringify(bridgeResult), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  // 控制台提示
  if (isStaticDeploy) {
    console.log("%c🚀 Olivia Work Platform · 静态部署模式已激活", "color: #667eea; font-weight: bold;");
    console.log("%cAI 功能将使用 TRAE 桥接模式（无需后端服务器）", "color: #888;");
  }
})();
