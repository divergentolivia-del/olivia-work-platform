const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);

loadEnv();

// ========== v9.0 AI平台代理架构 ==========
// 三层优先级：平台内置Key(PLATFORM_*) > 用户自配Key > TRA桥接
// 平台运营方通过环境变量注入Key后，终端用户零配置开箱即用

const providers = {
  deepseek: {
    name: "DeepSeek",
    type: "openai",
    key: process.env.PLATFORM_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY,
    model: process.env.PLATFORM_DEEPSEEK_MODEL || process.env.DEEPSEEK_MODEL || "deepseek-chat",
    url: process.env.PLATFORM_DEEPSEEK_BASE_URL || process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1/chat/completions",
    strengths: ["中文写作", "内容生成", "分析", "性价比"]
  },
  doubao: {
    name: "豆包",
    type: "openai",
    key: process.env.PLATFORM_ARK_API_KEY || process.env.ARK_API_KEY,
    model: process.env.PLATFORM_ARK_MODEL || process.env.ARK_MODEL || "doubao-pro-32k",
    url: process.env.PLATFORM_ARK_BASE_URL || process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    strengths: ["中文内容", "短视频", "小红书", "本土表达"]
  },
  qwen: {
    name: "通义千问",
    type: "openai",
    key: process.env.PLATFORM_DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY,
    model: process.env.PLATFORM_QWEN_MODEL || process.env.QWEN_MODEL || "qwen-plus",
    url: process.env.PLATFORM_QWEN_BASE_URL || process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    strengths: ["中文办公", "材料整理", "知识问答"]
  },
  kimi: {
    name: "Kimi",
    type: "openai",
    key: process.env.PLATFORM_MOONSHOT_API_KEY || process.env.MOONSHOT_API_KEY,
    model: process.env.PLATFORM_KIMI_MODEL || process.env.KIMI_MODEL || "moonshot-v1-8k",
    url: process.env.PLATFORM_KIMI_BASE_URL || process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1/chat/completions",
    strengths: ["长文阅读", "中文总结", "资料整理"]
  },
  claude: {
    name: "Claude",
    type: "anthropic",
    key: process.env.PLATFORM_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    model: process.env.PLATFORM_CLAUDE_MODEL || process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
    url: process.env.PLATFORM_CLAUDE_BASE_URL || process.env.CLAUDE_BASE_URL || "https://api.anthropic.com/v1/messages",
    strengths: ["长文", "产品分析", "文档润色", "复杂表达"]
  },
  openai: {
    name: "OpenAI",
    type: "openai",
    key: process.env.PLATFORM_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    model: process.env.PLATFORM_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
    url: process.env.PLATFORM_OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
    strengths: ["通用能力", "复杂推理", "英文资料"]
  },
  trae: {
    name: "TRAE桥接",
    type: "bridge",
    key: "",
    model: "trae-bridge",
    url: "",
    strengths: ["零配置", "永远可用", "平台兜底"]
  }
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (req.method === "GET" && url.pathname === "/api/providers") {
      return sendJson(res, listProviders());
    }

    if (req.method === "POST" && url.pathname === "/api/ai/generate") {
      const body = await readJson(req);
      const result = await generate(body);
      return sendJson(res, result);
    }

    if (req.method === "POST" && url.pathname === "/api/inspiration/analyze") {
      const body = await readJson(req);
      const result = await analyzeInspiration(body);
      return sendJson(res, result);
    }

    if (req.method === "POST" && url.pathname === "/api/daily-log/analyze") {
      const body = await readJson(req);
      const result = await analyzeDailyLog(body);
      return sendJson(res, result);
    }

    if (req.method === "POST" && url.pathname === "/api/content/draft") {
      const body = await readJson(req);
      const result = await generateContentDraft(body);
      return sendJson(res, result);
    }

    // v8.0 新增接口：AI 多轮对话
    if (req.method === "POST" && url.pathname === "/api/ai/chat") {
      const body = await readJson(req);
      const result = await aiChat(body);
      return sendJson(res, result);
    }

    // v8.0 新增接口：AI 资料搜集（联网搜索+结构化输出）
    if (req.method === "POST" && url.pathname === "/api/ai/research") {
      const body = await readJson(req);
      const result = await aiResearch(body);
      return sendJson(res, result);
    }

    // v8.0 新增接口：单词学习辅助
    if (req.method === "POST" && url.pathname === "/api/english/word-helper") {
      const body = await readJson(req);
      const result = await englishWordHelper(body);
      return sendJson(res, result);
    }

    // v8.0 新增接口：食物识别（图片→卡路里）
    if (req.method === "POST" && url.pathname === "/api/health/food-recognize") {
      const body = await readJson(req);
      const result = await foodRecognize(body);
      return sendJson(res, result);
    }

    // v10.1 新增接口：健康推荐（减脂食谱/一日三餐/推文推荐）
    if (req.method === "POST" && url.pathname === "/api/health/recommend") {
      const body = await readJson(req);
      const result = await healthRecommend(body);
      return sendJson(res, result);
    }

    // v10.2 新增接口：PM 快速生成（PRD/竞品分析/用户故事/评审Checklist/路线图）
    if (req.method === "POST" && url.pathname === "/api/pm/generate") {
      const body = await readJson(req);
      const result = await pmGenerate(body);
      return sendJson(res, result);
    }

    // v10.3 新增接口：知识笔记 AI 助手（归类/标签/摘要/整理）
    if (req.method === "POST" && url.pathname === "/api/notes/ai") {
      const body = await readJson(req);
      const result = await notesAi(body);
      return sendJson(res, result);
    }

    // v10.4 新增接口：OKR AI 智能拆解
    if (req.method === "POST" && url.pathname === "/api/okr/ai") {
      const body = await readJson(req);
      const result = await okrAi(body);
      return sendJson(res, result);
    }

    // v10.6 新增接口：设置 - 清除服务器端缓存状态
    if (req.method === "GET" && url.pathname === "/api/settings/info") {
      return sendJson(res, {
        ok: true,
        version: "10.6",
        serverTime: new Date().toISOString(),
        providersConfigured: Object.entries(providers).filter(([id, p]) => id !== "trae" && p.key).length,
        traeBridgeAvailable: true
      });
    }

    // v8.0 新增接口：TRAE 桥接增强
    if (req.method === "POST" && url.pathname === "/api/trae/bridge") {
      const body = await readJson(req);
      const result = traeBridge(body);
      return sendJson(res, result);
    }

    if (req.method === "POST" && url.pathname === "/api/skills/import") {
      const body = await readJson(req);
      return sendJson(res, { ok: true, received: true, title: body.title });
    }

    if (req.method === "GET" && url.pathname === "/api/skills/search") {
      const query = url.searchParams.get("q") || "";
      const result = await searchGithubSkills(query);
      return sendJson(res, result);
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    // TRAE桥接模式：将特殊错误转换为正常响应
    if (error.traeBridge) {
      return sendJson(res, {
        ok: true,
        mode: "trae-bridge",
        traePrompt: error.traePrompt,
        provider: "TRAE",
        model: "桥接模式",
        fallbackReason: "未配置API Key，已自动切换为TRAE桥接模式"
      });
    }
    return sendJson(res, { ok: false, error: error.message || "服务异常" }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`Olivia Work Platform v10.6 已启动：http://localhost:${PORT}`);
});

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const index = trimmed.indexOf("=");
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

function listProviders() {
  return Object.entries(providers).map(([id, provider]) => {
    const configured = isProviderConfigured(id, provider);
    const isPlatform = Boolean(
      id !== "trae" && configured &&
      (process.env.PLATFORM_DEEPSEEK_API_KEY || process.env.PLATFORM_ARK_API_KEY ||
       process.env.PLATFORM_DASHSCOPE_API_KEY || process.env.PLATFORM_MOONSHOT_API_KEY ||
       process.env.PLATFORM_ANTHROPIC_API_KEY || process.env.PLATFORM_OPENAI_API_KEY)
    );
    return {
      id,
      name: provider.name,
      configured,
      source: id === "trae" ? "bridge" : (isPlatform ? "platform" : (configured ? "user" : "none")),
      model: provider.model,
      strengths: provider.strengths
    };
  });
}

function isProviderConfigured(id, provider) {
  if (id === "trae") return true; // TRAE桥接永远可用
  if (!provider.key) return false;
  if (!provider.model) return false;
  return true;
}

async function generate(body) {
  const prompt = String(body.prompt || "").trim();
  if (!prompt) throw new Error("请先输入需求");

  const matchedSkills = matchLocalSkills(prompt, body.localSkills || []);
  const taskType = classifyTask(prompt);
  const provider = chooseProvider(body.provider || "auto", taskType);
  if (!provider) {
    throw new Error("还没有可用模型。请先在 .env 中配置至少一个 API Key");
  }

  const system = buildSystemPrompt(taskType, matchedSkills, body.moduleTitle);
  const answer = await callProvider(provider, system, prompt);

  return {
    ok: true,
    provider: provider.name,
    model: provider.model,
    taskType,
    matchedSkills,
    answer
  };
}

async function analyzeInspiration(body) {
  const sourceType = String(body.sourceType || "网页");
  const link = String(body.link || "").trim();
  const text = String(body.text || "").trim();
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];

  if (!link && !text && !attachments.length) {
    throw new Error("请先粘贴链接、文本，或上传图片/文件");
  }

  const provider = chooseProvider(body.provider || "auto", "office");
  if (!provider) {
    throw new Error("还没有可用模型。请先在 .env 中配置至少一个 API Key");
  }

  const prompt = buildInspirationPrompt({ sourceType, link, text, attachments });
  const answer = await callProvider(provider, prompt.system, prompt.user, attachments);
  const parsed = parseInspirationResult(answer);

  return {
    ok: true,
    provider: provider.name,
    model: provider.model,
    answer,
    parsed
  };
}

async function analyzeDailyLog(body) {
  const log = body.log || {};
  const summary = String(log.summary || "").trim();
  const logDate = String(log.date || "").trim();

  if (!summary) {
    throw new Error("今日记录为空，请先填写后再让 AI 分析");
  }

  const provider = chooseProvider(body.provider || "auto", "office");
  if (!provider) {
    throw new Error("还没有可用模型。请先在 .env 中配置至少一个 API Key");
  }

  const prompt = buildDailyAnalysisPrompt(log);
  const answer = await callProvider(provider, prompt.system, prompt.user);
  const parsed = parseDailyAnalysisResult(answer);

  return {
    ok: true,
    provider: provider.name,
    model: provider.model,
    logDate,
    answer,
    parsed
  };
}

async function generateContentDraft(body) {
  const action = String(body.action || "draft");
  const draft = normalizeDraftInput(body.draft || {});
  if (!draft.title && !draft.body && action !== "draft") {
    throw new Error("请先填写标题或正文，再调用写作室 AI");
  }

  const provider = chooseProvider(body.provider || "auto", "content");
  if (!provider) {
    throw new Error("还没有可用模型。请先在 .env 中配置至少一个 API Key");
  }

  const prompt = buildContentDraftPrompt(action, draft);
  const answer = await callProvider(provider, prompt.system, prompt.user);
  const parsed = parseContentDraftResult(answer, action, draft);

  return {
    ok: true,
    provider: provider.name,
    model: provider.model,
    action,
    answer,
    parsed
  };
}

function normalizeDraftInput(draft) {
  return {
    platform: String(draft.platform || "小红书"),
    collection: String(draft.collection || "").trim(),
    type: String(draft.type || "图文笔记"),
    audience: String(draft.audience || "").trim(),
    status: String(draft.status || "草稿"),
    title: String(draft.title || "").trim(),
    altTitles: Array.isArray(draft.altTitles) ? draft.altTitles.map(String).filter(Boolean) : [],
    body: String(draft.body || "").trim(),
    coverTitle: String(draft.coverTitle || "").trim(),
    coverSubtitle: String(draft.coverSubtitle || "").trim(),
    tags: Array.isArray(draft.tags) ? draft.tags.map(String).filter(Boolean) : [],
    publishTime: String(draft.publishTime || "").trim()
  };
}

function buildContentDraftPrompt(action, draft) {
  const actionGuide = {
    title: "优化主标题并给出 8 个备选标题，强调点击动机、场景、结果和平台语感。",
    draft: "基于已有信息起草完整正文，包含开头钩子、主体结构、结尾互动引导。",
    expand: "在不跑题的前提下扩写正文，补充案例、步骤、情绪价值和行动建议。",
    polish: "润色正文，让表达更自然、更适合目标平台，保留用户原意。",
    cover: "生成封面标题和封面副标题，短、有冲击力、适合截图封面。",
    tags: "生成 8-12 个适合平台分发的标签，兼顾垂类、人群、场景和长尾词。",
    check: "做发布前检查，指出标题、封面、正文、标签、风险表达和发布节奏的问题，并给出修改建议。"
  }[action] || "补全并优化这篇内容草稿。";

  return {
    system: [
      "你是 Olivia Work Platform 内容运营中心「写作室」的专用 AI 编辑器。",
      "你擅长小红书、抖音、视频号、公众号、B站、知乎等平台内容策划、起草、扩写、润色、封面和发布检查。",
      "请严格输出 JSON，不要输出 Markdown 代码块。",
      "JSON 字段：title, altTitles, body, coverTitle, coverSubtitle, tags, checkList。",
      "altTitles 和 tags 必须是数组；body 可以使用 Markdown；checkList 是发布检查建议数组。",
      "只返回与本次动作相关且可直接覆盖到编辑器的内容，不要编造发布时间。"
    ].join("\n"),
    user: [
      `本次动作：${action}（${actionGuide}）`,
      "",
      `平台：${draft.platform}`,
      `合集：${draft.collection || "未填写"}`,
      `类型：${draft.type}`,
      `人群：${draft.audience || "未填写"}`,
      `状态：${draft.status}`,
      `标题：${draft.title || "未填写"}`,
      `备选标题：${draft.altTitles.join(" / ") || "未填写"}`,
      `正文：\n${draft.body || "未填写"}`,
      `封面标题：${draft.coverTitle || "未填写"}`,
      `封面副标题：${draft.coverSubtitle || "未填写"}`,
      `标签：${draft.tags.join(", ") || "未填写"}`,
      `发布时间：${draft.publishTime || "未定"}`,
      "",
      "请输出严格 JSON。"
    ].join("\n")
  };
}

function parseContentDraftResult(answer, action, draft) {
  try {
    const match = String(answer).match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no json");
    return normalizeContentDraftParsed(JSON.parse(match[0]), draft);
  } catch {
    const text = String(answer || "").trim();
    if (action === "title") return { title: draft.title, altTitles: text.split(/\r?\n/).map((line) => line.replace(/^[-\d.、\s]+/, "").trim()).filter(Boolean).slice(0, 8) };
    if (action === "cover") return { coverTitle: draft.coverTitle || text.slice(0, 24), coverSubtitle: draft.coverSubtitle || text.slice(24, 64) };
    if (action === "tags") return { tags: text.split(/[#，,\s]+/).map((tag) => tag.trim()).filter(Boolean).slice(0, 12) };
    if (action === "check") return { checkList: text.split(/\r?\n/).filter(Boolean), body: draft.body };
    return { body: text || draft.body };
  }
}

function normalizeContentDraftParsed(parsed, draft) {
  const arr = (value) => Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : String(value || "").split(/\r?\n|[,，]/).map((item) => item.trim()).filter(Boolean);
  return {
    title: String(parsed.title || draft.title || "").trim(),
    altTitles: arr(parsed.altTitles || parsed.alternativeTitles || parsed.titles).slice(0, 10),
    body: String(parsed.body || parsed.content || draft.body || "").trim(),
    coverTitle: String(parsed.coverTitle || parsed.cover_title || draft.coverTitle || "").trim(),
    coverSubtitle: String(parsed.coverSubtitle || parsed.cover_subtitle || draft.coverSubtitle || "").trim(),
    tags: arr(parsed.tags).slice(0, 12),
    checkList: arr(parsed.checkList || parsed.check_list || parsed.checks).slice(0, 12)
  };
}

function buildDailyAnalysisPrompt(log) {
  const system = [
    "你是 Olivia Work Platform 今日工作记录的 AI 分析师。",
    "用户每天填写结构化工作记录，你的任务不是简单复述，而是像产品经理/复盘教练一样：",
    "1. 拆解出真正可执行的待办（不是流水账里的一句话，要具体到动作）。",
    "2. 识别用户记录里的问题/风险/阻碍，给出可落地的解决思路或建议（不要空话）。",
    "3. 从「学习/灵感/观察」里提炼能长期沉淀的灵感/方法论，并推荐归档到合适的模块。",
    "4. 把「今日复盘」提炼成可复用的复盘资产/经验卡。",
    "5. 识别哪些事可以交给 AI 直接做（材料整理、文案初稿、信息检索、复盘草稿、整理对话结论等），给出可派 AI 的任务。",
    "请严格输出 JSON，不要输出 Markdown，不要包裹代码块。",
    "JSON 字段：summary, todos, problems, inspirations, review_assets, ai_tasks。",
    "summary 是今日一句话总结（30-80字）。",
    "todos 是数组，每项包含 title（具体行动）、reason（为什么）、moduleId、ai_delegatable（true/false）。",
    "problems 是数组，每项包含 problem、suggestion、moduleId。",
    "inspirations 是数组，每项包含 title、content、moduleId、source_field（来自哪个字段：outputs/progress/blocks/learnings/review/tomorrow）。",
    "review_assets 是数组，每项包含 title、content、moduleId。",
    "ai_tasks 是数组，每项包含 title、reason、action_type（如 文案生成/信息检索/材料整理/复盘草稿/总结对话）、prompt_hint（给 AI 的执行提示词）、moduleId。",
    "moduleId 只能从以下选择：today, project, materials, ai-growth, code-lab, skills, content, review。",
    "moduleTitle 对应：今日工作台、项目管理、材料与汇报、AI产品经理成长室、工具代码实验室、Skills管理、内容运营中心、复盘中心。",
    "每类最多 6 条，优先质量，宁缺毋滥。"
  ].join("\n");

  const user = [
    `日期：${log.date || "未填写"}`,
    `今日主题：${log.theme || "未填写"}`,
    `今日能量：${log.energy || "未填写"}`,
    "",
    "【今日关键产出】",
    log.outputs || "未填写",
    "",
    "【项目 / 协作推进】",
    log.progress || "未填写",
    "",
    "【问题 / 阻碍 / 风险】",
    log.blocks || "未填写",
    "",
    "【学习 / 灵感 / 观察】",
    log.learnings || "未填写",
    "",
    "【明日重点】",
    log.tomorrow || "未填写",
    "",
    "【今日复盘】",
    log.review || "未填写",
    "",
    "请基于以上记录输出结构化分析 JSON。"
  ].join("\n");

  return { system, user };
}

function parseDailyAnalysisResult(answer) {
  try {
    const match = String(answer).match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no json");
    const parsed = JSON.parse(match[0]);
    return normalizeDailyAnalysis(parsed);
  } catch {
    return normalizeDailyAnalysis({
      summary: String(answer || "").slice(0, 200),
      todos: [],
      problems: [],
      inspirations: [],
      review_assets: [],
      ai_tasks: []
    });
  }
}

function normalizeDailyAnalysis(parsed) {
  const moduleTitles = {
    today: "今日工作台",
    project: "项目管理",
    materials: "材料与汇报",
    "ai-growth": "AI产品经理成长室",
    "code-lab": "工具代码实验室",
    skills: "Skills管理",
    content: "内容运营中心",
    review: "复盘中心"
  };

  const validModuleId = (id) => (moduleTitles[id] ? id : "today");

  const pick = (arr, max) => (Array.isArray(arr) ? arr.slice(0, max) : []);

  return {
    summary: String(parsed.summary || "").slice(0, 300),
    todos: pick(parsed.todos, 6).map((item) => ({
      title: String(item.title || "待办").slice(0, 100),
      reason: String(item.reason || "").slice(0, 300),
      moduleId: validModuleId(item.moduleId),
      ai_delegatable: Boolean(item.ai_delegatable)
    })),
    problems: pick(parsed.problems, 6).map((item) => ({
      problem: String(item.problem || "").slice(0, 300),
      suggestion: String(item.suggestion || "").slice(0, 500),
      moduleId: validModuleId(item.moduleId)
    })),
    inspirations: pick(parsed.inspirations, 6).map((item) => ({
      title: String(item.title || "灵感沉淀").slice(0, 100),
      content: String(item.content || "").slice(0, 600),
      moduleId: validModuleId(item.moduleId),
      source_field: String(item.source_field || "learnings").slice(0, 30)
    })),
    review_assets: pick(parsed.review_assets, 6).map((item) => ({
      title: String(item.title || "复盘资产").slice(0, 100),
      content: String(item.content || "").slice(0, 600),
      moduleId: validModuleId(item.moduleId)
    })),
    ai_tasks: pick(parsed.ai_tasks, 6).map((item) => ({
      title: String(item.title || "AI 可代办").slice(0, 100),
      reason: String(item.reason || "").slice(0, 300),
      action_type: String(item.action_type || "材料整理").slice(0, 30),
      prompt_hint: String(item.prompt_hint || "").slice(0, 600),
      moduleId: validModuleId(item.moduleId)
    }))
  };
}

function buildInspirationPrompt({ sourceType, link, text, attachments }) {
  const attachmentText = attachments.map((file, index) => {
    const lines = [
      `附件 ${index + 1}: ${file.name || "未命名"}`,
      `类型: ${file.type || "未知"}`,
      `大小: ${file.size || 0} bytes`
    ];
    if (file.text) lines.push(`可读取文本:\n${String(file.text).slice(0, 6000)}`);
    if (file.kind === "image") lines.push("这是图片/截图附件。如果当前模型支持视觉，请结合图片内容分析；如果不支持，请基于用户备注和文件名给出保守拆解。");
    if (!file.text && file.kind !== "image") lines.push("当前无法直接解析该文件正文，请基于文件名、类型和用户备注给出保守拆解。");
    return lines.join("\n");
  }).join("\n\n");

  return {
    system: [
      "你是 Olivia Work Platform 的灵感收件箱 AI。",
      "你的任务是把用户日常看到的信息拆解成个人工作台资产。",
      "请严格输出 JSON，不要输出 Markdown，不要包裹代码块。",
      "JSON 字段必须包含：title, source_digest, summary, personal_value, reusable_points, recommended_archives, next_actions, tags。",
      "recommended_archives 是数组，每项包含 moduleId, moduleTitle, category, reason, score。",
      "moduleId 只能从以下选择：today, project, materials, ai-growth, code-lab, skills, content, review。",
      "moduleTitle 对应：今日工作台、项目管理、材料与汇报、AI产品经理成长室、工具代码实验室、Skills管理、内容运营中心、复盘中心。",
      "next_actions 是数组，每项包含 title, reason, moduleId。",
      "请优先考虑用户的日常工作、职业规划、AI产品经理成长、内容运营、项目管理和个人习惯沉淀。"
    ].join("\n"),
    user: [
      `内容来源：${sourceType}`,
      link ? `链接：${link}` : "链接：无",
      text ? `用户粘贴文本/备注：\n${text.slice(0, 10000)}` : "用户粘贴文本/备注：无",
      attachmentText ? `附件信息：\n${attachmentText}` : "附件信息：无",
      "请生成拆解结果，并推荐 1-3 个最适合归档的位置。"
    ].join("\n\n")
  };
}

function parseInspirationResult(answer) {
  try {
    const match = String(answer).match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no json");
    const parsed = JSON.parse(match[0]);
    return normalizeInspirationParsed(parsed);
  } catch {
    return normalizeInspirationParsed({
      title: "灵感拆解结果",
      source_digest: "",
      summary: String(answer || "").slice(0, 500),
      personal_value: "AI 已完成初步拆解，但未返回标准结构。",
      reusable_points: [],
      recommended_archives: [{ moduleId: "today", moduleTitle: "今日工作台", category: "灵感速记", reason: "需要人工二次判断归档位置", score: 60 }],
      next_actions: [],
      tags: ["灵感收集"]
    });
  }
}

function normalizeInspirationParsed(parsed) {
  const moduleTitles = {
    today: "今日工作台",
    project: "项目管理",
    materials: "材料与汇报",
    "ai-growth": "AI产品经理成长室",
    "code-lab": "工具代码实验室",
    skills: "Skills管理",
    content: "内容运营中心",
    review: "复盘中心"
  };
  const safeArchives = Array.isArray(parsed.recommended_archives) ? parsed.recommended_archives : [];
  const recommended_archives = safeArchives
    .filter((item) => moduleTitles[item.moduleId])
    .slice(0, 3)
    .map((item) => ({
      moduleId: item.moduleId,
      moduleTitle: moduleTitles[item.moduleId],
      category: item.category || "灵感归档",
      reason: item.reason || "AI 推荐归档",
      score: Number(item.score || 70)
    }));

  return {
    title: parsed.title || "灵感拆解结果",
    source_digest: parsed.source_digest || "",
    summary: parsed.summary || "",
    personal_value: parsed.personal_value || "",
    reusable_points: Array.isArray(parsed.reusable_points) ? parsed.reusable_points.slice(0, 6) : [],
    recommended_archives: recommended_archives.length ? recommended_archives : [{ moduleId: "today", moduleTitle: "今日工作台", category: "灵感速记", reason: "默认存入灵感速记", score: 60 }],
    next_actions: Array.isArray(parsed.next_actions) ? parsed.next_actions.slice(0, 5) : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : ["灵感收集"]
  };
}

function classifyTask(prompt) {
  const text = prompt.toLowerCase();
  if (/小红书|抖音|推文|文案|标题|脚本|种草|内容/.test(text)) return "content";
  if (/prd|需求|产品|竞品|用户故事|原型/.test(text)) return "product";
  if (/代码|脚本|工具|debug|接口|开发/.test(text)) return "code";
  if (/材料|表格|汇报|周报|总结|纪要/.test(text)) return "office";
  if (/复盘|经验|反思|原则/.test(text)) return "review";
  return "general";
}

function chooseProvider(requested, taskType) {
  if (requested !== "auto") {
    const provider = providers[requested];
    if (provider && isProviderConfigured(requested, provider)) {
      return { ...provider, id: requested };
    }
    return null;
  }

  // v9.0 模型场景映射：豆包/DeepSeek/Kimi/千问 优先，TRA桥接保底
  const preference = {
    content: ["doubao", "deepseek", "kimi", "qwen", "openai", "claude", "trae"],
    product: ["doubao", "deepseek", "qwen", "kimi", "openai", "claude", "trae"],
    code: ["deepseek", "qwen", "kimi", "doubao", "openai", "claude", "trae"],
    office: ["qwen", "doubao", "deepseek", "kimi", "openai", "claude", "trae"],
    review: ["deepseek", "doubao", "qwen", "kimi", "openai", "claude", "trae"],
    general: ["doubao", "deepseek", "qwen", "kimi", "openai", "claude", "trae"]
  }[taskType] || ["doubao", "deepseek", "trae"];

  const found = preference
    .map((id) => [id, providers[id]])
    .find(([id, provider]) => provider && isProviderConfigured(id, provider));
  return found ? { ...found[1], id: found[0] } : null;
}

function matchLocalSkills(prompt, localSkills) {
  const text = prompt.toLowerCase();
  const seen = new Set();
  return localSkills
    .map((skill) => {
      const haystack = `${skill.title} ${skill.summary} ${(skill.tags || []).join(" ")}`.toLowerCase();
      const score = text.split(/\s+|，|。|、/).filter(Boolean).reduce((sum, word) => sum + (haystack.includes(word) ? 1 : 0), 0);
      const bonus = /小红书|内容|推文|文案/.test(text) && /小红书|内容|写作|选题/.test(haystack) ? 3 : 0;
      return { ...skill, score: score + bonus };
    })
    .filter((skill) => skill.score > 0)
    .sort((a, b) => b.score - a.score)
    .filter((skill) => {
      const key = normalizeSkillKey(skill);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function normalizeSkillKey(skill) {
  return String(skill.title || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function buildSystemPrompt(taskType, skills, moduleTitle) {
  return [
    "你是 Olivia Work Platform 的工作台 AI 助手。",
    "请使用中文回答，输出应直接可保存到工作台。",
    `当前模块：${moduleTitle || "未指定"}`,
    `任务类型：${taskType}`,
    skills.length ? `可参考 Skill：${skills.map((s) => `${s.title}：${s.summary}`).join("；")}` : "没有匹配到本地 Skill，请用通用专业方法完成。",
    "如果是小红书/抖音内容，请输出：标题候选、开头钩子、正文、封面文案、标签、评论区引导。",
    "如果是项目/产品/复盘/材料任务，请按对应场景输出结构化结果。"
  ].join("\n");
}

async function callProvider(provider, system, prompt, attachments = []) {
  // TRAE桥接模式：不调用外部API，生成结构化指令供用户复制给TRAE
  if (provider.id === "trae") {
    const payload = { topic: prompt, context: system };
    const result = traeBridge({ type: "chat", payload });
    if (result.ok) {
      const err = new Error("TRAE桥接模式");
      err.traeBridge = true;
      err.traePrompt = result.prompt;
      throw err;
    }
    throw new Error("TRAE桥接生成指令失败");
  }

  const images = getVisionImages(provider, attachments);
  if (provider.type === "anthropic") {
    const content = images.length
      ? [
          { type: "text", text: prompt },
          ...images.map((image) => ({
            type: "image",
            source: {
              type: "base64",
              media_type: image.mediaType,
              data: image.base64
            }
          }))
        ]
      : prompt;
    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": provider.key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content }]
      })
    });
    const json = await response.json();
    if (!response.ok) {
      const msg = explainProviderError(provider, json.error?.message || `${provider.name} 调用失败 (${response.status})`);
      throw new Error(msg);
    }
    return (json.content || []).map((part) => part.text).join("\n");
  }

  if (!provider.url) throw new Error(`${provider.name} 尚未配置 API 地址`);
  const userContent = images.length
    ? [
        { type: "text", text: prompt },
        ...images.map((image) => ({
          type: "image_url",
          image_url: { url: image.dataUrl }
        }))
      ]
    : prompt;
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.key}`
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent }
      ],
      temperature: 0.7
    })
  });
  const json = await response.json();
  if (!response.ok) {
    const msg = explainProviderError(provider, json.error?.message || `${provider.name} 调用失败 (${response.status})`);
    throw new Error(msg);
  }
  return json.choices?.[0]?.message?.content || "模型没有返回内容";
}

function getVisionImages(provider, attachments) {
  if (!supportsVision(provider)) return [];
  return (attachments || [])
    .filter((file) => file.kind === "image" && file.dataUrl)
    .slice(0, 4)
    .map((file) => {
      const match = String(file.dataUrl).match(/^data:(.+?);base64,(.+)$/);
      if (!match) return null;
      return {
        dataUrl: file.dataUrl,
        mediaType: match[1],
        base64: match[2]
      };
    })
    .filter(Boolean);
}

function supportsVision(provider) {
  const model = String(provider.model || "").toLowerCase();
  const name = String(provider.name || "").toLowerCase();
  return /gpt-4o|vision|vl|qwen-vl|claude/.test(model) || /claude/.test(name);
}

function explainProviderError(provider, message) {
  const raw = String(message || "");

  if (/insufficient balance|suspended due to insufficient balance/i.test(raw)) {
    return `${provider.name} 调用失败：账户余额不足或欠费停用。请到对应平台充值/开通计费后再试。原始信息：${raw}`;
  }

  if (/does not exist|do not have access|endpoint/i.test(raw) && /豆包|火山/.test(provider.name)) {
    return `${provider.name} 调用失败：当前 ARK_MODEL 不存在或账号无权限。火山方舟通常需要把控制台里的“推理接入点 ID（ep-xxxx）”或你有权限的 Model ID 填到 ARK_MODEL。原始信息：${raw}`;
  }

  if (/request not allowed|not allowed/i.test(raw) && /Claude/i.test(provider.name)) {
    return `${provider.name} 调用失败：当前网络环境、地区、账号权限或模型权限不允许调用。建议先用通义千问/Kimi/DeepSeek，Claude 等确认账号与网络可用后再启用。原始信息：${raw}`;
  }

  return raw;
}

async function searchGithubSkills(query) {
  if (!query.trim()) return { ok: true, items: [] };

  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "Olivia-Work-Platform"
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const q = encodeURIComponent(`${query} prompt skill agent workflow`);
  const response = await fetch(
    `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=8`,
    { headers }
  );
  const json = await response.json();

  if (!response.ok) {
    if (response.status === 403 || (json.message && /rate limit/i.test(json.message))) {
      return {
        ok: true,
        items: [],
        rateLimited: true,
        message: "GitHub 请求频率受限。请在 .env 中配置 GITHUB_TOKEN 以提高搜索额度（去 github.com → Settings → Developer settings → Personal access tokens 生成）。"
      };
    }
    throw new Error(json.message || "GitHub Skill 搜索失败");
  }

  return {
    ok: true,
    items: (json.items || []).map((repo) => ({
      title: repo.full_name,
      summary: repo.description || "暂无描述",
      url: repo.html_url,
      stars: repo.stargazers_count,
      source: "GitHub"
    }))
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => raw += chunk);
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("请求 JSON 格式错误"));
      }
    });
  });
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function serveStatic(pathname, res) {
  const safePath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = path.normalize(path.join(ROOT, safePath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    return res.end("Not Found");
  }
  const ext = path.extname(filePath);
  const type = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml"
  }[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  fs.createReadStream(filePath).pipe(res);
}

// ========== v8.0 新增处理函数 ==========

// AI 多轮对话：支持 history 拼接成多轮对话格式
async function aiChat(body) {
  try {
    const message = String(body.message || "").trim();
    if (!message) return { ok: false, error: "请输入消息内容" };

    const history = Array.isArray(body.history) ? body.history : [];
    const provider = chooseProvider(body.provider || "auto", "general");
    if (!provider) {
      return { ok: false, error: "还没有可用模型。请先在 .env 中配置至少一个 API Key" };
    }

    // 构建 system prompt
    const system = [
      "你是 Olivia Work Platform v8.0 的 AI 对话助手。",
      "请使用中文回答，语气专业且友好。",
      "你可以回答工作、学习、项目、AI产品、英语学习等各类问题。",
      "如果用户需要联网搜索最新信息，建议对方使用「资料搜集」功能。",
      "请保持对话连贯性，引用上文上下文。"
    ].join("\n");

    // 拼接 history 为多轮消息数组
    const messages = [{ role: "system", content: system }];
    for (const msg of history) {
      const role = String(msg.role || "").trim();
      const content = String(msg.content || "").trim();
      if ((role === "user" || role === "assistant") && content) {
        messages.push({ role, content });
      }
    }
    messages.push({ role: "user", content: message });

    const answer = await callProviderMultiTurn(provider, messages);

    return {
      ok: true,
      answer,
      provider: provider.name,
      model: provider.model
    };
  } catch (error) {
    if (error.traeBridge) {
      return {
        ok: true,
        mode: "trae-bridge",
        traePrompt: error.traePrompt,
        provider: "TRAE",
        model: "桥接模式",
        fallbackReason: "未配置API Key，已自动切换为TRAE桥接模式"
      };
    }
    return { ok: false, error: error.message || "AI 对话服务异常" };
  }
}

// 多轮对话专用：直接传 messages 数组给模型
async function callProviderMultiTurn(provider, messages) {
  // TRAE桥接模式：不调用外部API，生成结构化指令供用户复制给TRAE
  if (provider.id === "trae") {
    const userMsg = messages.filter((m) => m.role === "user").pop();
    const systemMsg = messages.find((m) => m.role === "system");
    const payload = { topic: userMsg?.content || "", context: systemMsg?.content || "" };
    const result = traeBridge({ type: "chat", payload });
    if (result.ok) {
      const err = new Error("TRAE桥接模式");
      err.traeBridge = true;
      err.traePrompt = result.prompt;
      throw err;
    }
    throw new Error("TRAE桥接生成指令失败");
  }

  if (provider.type === "anthropic") {
    // Claude 格式：system 单独传，messages 不含 system
    const system = messages.find((m) => m.role === "system")?.content || "";
    const claudeMessages = messages.filter((m) => m.role !== "system");
    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": provider.key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 4096,
        system,
        messages: claudeMessages
      })
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(explainProviderError(provider, json.error?.message || `${provider.name} 调用失败 (${response.status})`));
    }
    return (json.content || []).map((part) => part.text).join("\n");
  }

  // OpenAI 兼容格式
  if (!provider.url) throw new Error(`${provider.name} 尚未配置 API 地址`);
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.key}`
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: 0.7
    })
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(explainProviderError(provider, json.error?.message || `${provider.name} 调用失败 (${response.status})`));
  }
  return json.choices?.[0]?.message?.content || "模型没有返回内容";
}

// AI 资料搜集：联网搜索+结构化输出
async function aiResearch(body) {
  try {
    const topic = String(body.topic || "").trim();
    if (!topic) return { ok: false, error: "请输入研究主题" };

    const depth = String(body.depth || "概览");
    const provider = chooseProvider(body.provider || "auto", "general");
    if (!provider) {
      return { ok: false, error: "还没有可用模型。请先在 .env 中配置至少一个 API Key" };
    }

    const depthGuide = depth === "详细"
      ? "请进行深度研究，输出详细的关键要点（8-12条）、多个权威信息来源、具体的行动建议。"
      : "请进行概览式研究，输出核心要点（5-8条）、主要信息来源、概括性建议。";

    const system = [
      "你是 Olivia Work Platform v8.0 的资料搜集助手。",
      "你的能力是联网搜索最新信息并结构化输出研究结论。",
      `当前研究深度：${depth}`,
      depthGuide,
      "请严格输出 JSON，不要输出 Markdown 代码块。",
      "JSON 字段：summary（200字以内的摘要）, key_points（关键要点数组，每项包含 point 和 detail）, sources（信息来源数组，每项包含 title, url, description）, recommendations（行动建议数组，每项包含 suggestion 和 reason）。",
      "如果不确定某个信息，请标注「待核实」。"
    ].join("\n");

    const user = [
      `研究主题：${topic}`,
      "",
      "请基于最新信息进行搜索研究，输出结构化结果。"
    ].join("\n");

    const answer = await callProvider(provider, system, user);

    // 解析 JSON 结果
    let result;
    try {
      const match = String(answer).match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        result = {
          summary: String(parsed.summary || "").slice(0, 500),
          key_points: Array.isArray(parsed.key_points) ? parsed.key_points.slice(0, 12).map((item) => ({
            point: String(item.point || "").slice(0, 200),
            detail: String(item.detail || "").slice(0, 500)
          })) : [],
          sources: Array.isArray(parsed.sources) ? parsed.sources.slice(0, 8).map((item) => ({
            title: String(item.title || "").slice(0, 200),
            url: String(item.url || ""),
            description: String(item.description || "").slice(0, 300)
          })) : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 8).map((item) => ({
            suggestion: String(item.suggestion || "").slice(0, 200),
            reason: String(item.reason || "").slice(0, 300)
          })) : []
        };
      } else {
        throw new Error("no json");
      }
    } catch {
      result = {
        summary: String(answer || "").slice(0, 500),
        key_points: [],
        sources: [],
        recommendations: []
      };
    }

    return {
      ok: true,
      result,
      provider: provider.name,
      model: provider.model
    };
  } catch (error) {
    if (error.traeBridge) {
      return {
        ok: true,
        mode: "trae-bridge",
        traePrompt: error.traePrompt,
        provider: "TRAE",
        model: "桥接模式",
        fallbackReason: "未配置API Key，已自动切换为TRAE桥接模式"
      };
    }
    return { ok: false, error: error.message || "资料搜集服务异常" };
  }
}

// 单词学习辅助：根据 action 生成不同内容
async function englishWordHelper(body) {
  try {
    const word = String(body.word || "").trim();
    if (!word) return { ok: false, error: "请输入要查询的单词" };

    const action = String(body.action || "example");
    const validActions = ["example", "etymology", "usage"];
    const finalAction = validActions.includes(action) ? action : "example";

    const provider = chooseProvider(body.provider || "auto", "general");
    if (!provider) {
      return { ok: false, error: "还没有可用模型。请先在 .env 中配置至少一个 API Key" };
    }

    const actionGuide = {
      example: [
        `请为单词「${word}」生成 5 个实用例句，涵盖不同场景（日常/职场/学术/社交等）。`,
        "每个例句包含：英文原句、中文翻译、使用场景说明。",
        "按难度从易到难排列。"
      ].join("\n"),
      etymology: [
        `请解析单词「${word}」的词根词缀构成和词源。`,
        "输出：词根（root）、前缀（prefix）、后缀（suffix）、同源词（至少3个）、词源故事（50-100字）。"
      ].join("\n"),
      usage: [
        `请详细说明单词「${word}」的用法。`,
        "输出：词性及释义、常见搭配（至少5个）、易混淆词辨析、语法注意事项、使用频率评级。"
      ].join("\n")
    };

    const system = [
      "你是 Olivia Work Platform v8.0 的英语学习助手。",
      "请使用中文解释，英文例句保持英文原文。",
      "请严格输出 JSON，不要输出 Markdown 代码块。",
      "根据用户指定的 action 类型输出对应内容。"
    ].join("\n");

    const user = actionGuide[finalAction];

    const answer = await callProvider(provider, system, user);

    // 解析结果
    let result;
    try {
      const match = String(answer).match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        throw new Error("no json");
      }
    } catch {
      result = {
        word,
        action: finalAction,
        content: String(answer || "").slice(0, 2000)
      };
    }

    return {
      ok: true,
      result,
      provider: provider.name
    };
  } catch (error) {
    if (error.traeBridge) {
      return {
        ok: true,
        mode: "trae-bridge",
        traePrompt: error.traePrompt,
        provider: "TRAE",
        model: "桥接模式",
        fallbackReason: "未配置API Key，已自动切换为TRAE桥接模式"
      };
    }
    return { ok: false, error: error.message || "单词查询服务异常" };
  }
}

// 食物识别：图片 base64 → 卡路里和营养成分
async function foodRecognize(body) {
  try {
    const image = String(body.image || "").trim();
    if (!image) return { ok: false, error: "请上传食物图片" };

    const provider = chooseProvider(body.provider || "auto", "general");
    if (!provider) {
      return { ok: false, error: "还没有可用模型。请先在 .env 中配置至少一个 API Key" };
    }

    // 检查模型是否支持视觉
    if (!supportsVision(provider)) {
      return { ok: false, error: `当前选定的模型「${provider.name}」不支持图片识别，请切换到支持视觉的模型（如 GPT-4o、Claude、Qwen-VL 等）。` };
    }

    const system = [
      "你是 Olivia Work Platform v8.0 健康生活中心的 AI 食物识别助手。",
      "用户会上传食物照片，请识别图片中的食物并估算营养成分。",
      "请严格输出 JSON，不要输出 Markdown 代码块。",
      "JSON 格式：foods 数组，每项包含：",
      "  name（食物名称）",
      "  calories（估算卡路里，单位 kcal）",
      "  nutrition（对象，包含 protein 蛋白质g, fat 脂肪g, carbs 碳水化合物g, fiber 膳食纤维g）",
      "  portion（估算份量，如「一碗」「一份200g」）",
      "如果图片中有多道菜/多种食物，请分别识别。"
    ].join("\n");

    const user = "请识别这张图片中的食物，输出每种食物的卡路里和营养成分估算。";

    // 构建 image 附件格式传给 callProvider
    const dataUrl = image.startsWith("data:")
      ? image
      : `data:image/jpeg;base64,${image}`;
    const attachments = [{ kind: "image", dataUrl }];

    const answer = await callProvider(provider, system, user, attachments);

    // 解析结果
    let foods;
    try {
      const match = String(answer).match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        foods = Array.isArray(parsed.foods) ? parsed.foods : [parsed];
      } else {
        throw new Error("no json");
      }
    } catch {
      foods = [{ name: "识别结果", calories: 0, nutrition: {}, portion: "未知", raw: String(answer || "").slice(0, 500) }];
    }

    return {
      ok: true,
      foods: foods.map((f) => ({
        name: String(f.name || "未知食物").slice(0, 100),
        calories: Number(f.calories) || 0,
        nutrition: {
          protein: Number(f.nutrition?.protein) || 0,
          fat: Number(f.nutrition?.fat) || 0,
          carbs: Number(f.nutrition?.carbs) || 0,
          fiber: Number(f.nutrition?.fiber) || 0
        },
        portion: String(f.portion || "").slice(0, 50)
      })),
      provider: provider.name
    };
  } catch (error) {
    if (error.traeBridge) {
      return {
        ok: true,
        mode: "trae-bridge",
        traePrompt: error.traePrompt,
        provider: "TRAE",
        model: "桥接模式",
        fallbackReason: "未配置API Key，已自动切换为TRAE桥接模式"
      };
    }
    return { ok: false, error: error.message || "食物识别服务异常" };
  }
}

// v10.1 健康推荐：AI 减脂食谱 / 一日三餐 / 推文推荐
async function healthRecommend(body) {
  try {
    const prompt = String(body.prompt || "").trim();
    if (!prompt) return { ok: false, error: "请先选择推荐场景和参数" };

    const scene = body.scene || "meal-plan";
    const taskType = scene === "content" ? "content" : "general";
    const provider = chooseProvider(body.provider || "auto", taskType);

    if (!provider) {
      return { ok: false, error: "还没有可用模型。请先在 .env 中配置至少一个 API Key" };
    }

    const system = [
      "你是 Olivia Work Platform v10.1 健康生活中心的 AI 健康推荐助手。",
      scene === "content"
        ? "你是减脂健康类小红书/公众号爆款文案作者，风格参考「一只白」「邪修减肥」等热门减脂博主。请用口语化、有网感、真实接地气的中文输出，不要AI味。"
        : "你是专业的减脂营养师和健康餐搭配师。请用中文输出，风格亲切、专业，像「一只白」那种减脂博主的口吻。",
      "请直接输出内容，不要额外解释。"
    ].join("\n");

    const answer = await callProvider(provider, system, prompt);

    return {
      ok: true,
      provider: provider.name,
      model: provider.model,
      scene,
      answer
    };
  } catch (error) {
    if (error.traeBridge) {
      return {
        ok: true,
        mode: "trae-bridge",
        traePrompt: error.traePrompt,
        provider: "TRAE",
        model: "桥接模式",
        fallbackReason: "未配置API Key，已自动切换为TRAE桥接模式"
      };
    }
    return { ok: false, error: error.message || "健康推荐服务异常" };
  }
}

// v10.2 PM 快速生成：PRD / 竞品分析 / 用户故事 / 评审Checklist / 路线图
async function pmGenerate(body) {
  try {
    const prompt = String(body.prompt || "").trim();
    if (!prompt) return { ok: false, error: "请先填写产品信息和场景" };

    const scene = body.scene || "prd";
    const provider = chooseProvider(body.provider || "auto", "product");

    if (!provider) {
      return { ok: false, error: "还没有可用模型。请先在 .env 中配置至少一个 API Key" };
    }

    const system = [
      "你是 Olivia Work Platform v10.2 AI产品经理知识库的 PM 文档生成助手。",
      "你是一位资深 AI 产品经理，擅长撰写 PRD、竞品分析报告、用户故事、需求评审 Checklist 和产品路线图。",
      "请用专业、结构化、可落地的中文输出，使用 Markdown 格式（## 二级标题），不要额外解释。",
      "输出内容要具体、可执行，不要泛泛而谈。"
    ].join("\n");

    const answer = await callProvider(provider, system, prompt);

    return {
      ok: true,
      provider: provider.name,
      model: provider.model,
      scene,
      answer
    };
  } catch (error) {
    if (error.traeBridge) {
      return {
        ok: true,
        mode: "trae-bridge",
        traePrompt: error.traePrompt,
        provider: "TRAE",
        model: "桥接模式",
        fallbackReason: "未配置API Key，已自动切换为TRAE桥接模式"
      };
    }
    return { ok: false, error: error.message || "PM文档生成服务异常" };
  }
}

// v10.3 知识笔记 AI 助手：归类/标签/摘要/整理
async function notesAi(body) {
  try {
    const prompt = String(body.prompt || "").trim();
    if (!prompt) return { ok: false, error: "请先输入笔记内容" };

    const action = body.action || "classify";
    const provider = chooseProvider(body.provider || "auto", "office");

    if (!provider) {
      return { ok: false, error: "还没有可用模型。请先在 .env 中配置至少一个 API Key" };
    }

    const system = [
      "你是 Olivia Work Platform v10.3 知识笔记 PARA 体系的 AI 助手。",
      "你精通 PARA 知识管理法（Projects/Areas/Resources/Archives），",
      "擅长笔记归类、标签推荐、内容摘要和知识结构整理。",
      "请用中文输出，专业、简洁、可执行。"
    ].join("\n");

    const answer = await callProvider(provider, system, prompt);

    return {
      ok: true,
      provider: provider.name,
      model: provider.model,
      action,
      answer
    };
  } catch (error) {
    if (error.traeBridge) {
      return {
        ok: true,
        mode: "trae-bridge",
        traePrompt: error.traePrompt,
        provider: "TRAE",
        model: "桥接模式",
        fallbackReason: "未配置API Key，已自动切换为TRAE桥接模式"
      };
    }
    return { ok: false, error: error.message || "笔记AI服务异常" };
  }
}

// v10.4 OKR AI 智能拆解：将用户的大目标拆解为 Objective + Key Results
async function okrAi(body) {
  try {
    const goal = String(body.goal || "").trim();
    if (!goal) return { ok: false, error: "请先输入你的目标" };

    const provider = chooseProvider(body.provider || "auto", "general");
    if (!provider) {
      return { ok: false, error: "还没有可用模型。请先在 .env 中配置至少一个 API Key" };
    }

    const system = [
      "你是 Olivia Work Platform v10.4 的 OKR 目标管理 AI 助手。",
      "你精通 OKR（Objectives and Key Results）目标管理方法，擅长将用户的大目标拆解为清晰可执行的 O（目标）和 KR（关键结果）。",
      "请严格按以下格式输出：",
      "目标（Objective）：[一句话描述鼓舞人心的目标]",
      "关键结果 1：[可量化、可验证的结果描述]",
      "关键结果 2：[可量化、可验证的结果描述]",
      "关键结果 3：[可量化、可验证的结果描述]",
      "",
      "原则：",
      "- 目标要有挑战性且鼓舞人心",
      "- 关键结果必须具体、可衡量、可验证（SMART 原则）",
      "- 每个目标拆解 3-5 个关键结果",
      "- 使用中文输出"
    ].join("\n");

    const answer = await callProvider(provider, system, `请帮我把以下目标拆解为 OKR：\n\n${goal}`);

    return {
      ok: true,
      provider: provider.name,
      model: provider.model,
      answer
    };
  } catch (error) {
    if (error.traeBridge) {
      return {
        ok: true,
        mode: "trae-bridge",
        traePrompt: error.traePrompt,
        provider: "TRAE",
        model: "桥接模式",
        fallbackReason: "未配置API Key，已自动切换为TRAE桥接模式"
      };
    }
    return { ok: false, error: error.message || "OKR AI 拆解服务异常" };
  }
}

// TRAE 桥接增强：根据 type 生成结构化指令供复制给 TRAE
function traeBridge(body) {
  try {
    const type = String(body.type || "chat");
    const payload = body.payload || {};
    const validTypes = ["chat", "research", "write", "analyze"];
    const finalType = validTypes.includes(type) ? type : "chat";

    let prompt = "";

    switch (finalType) {
      case "chat": {
        const topic = String(payload.topic || payload.message || "").trim();
        const context = String(payload.context || "").trim();
        prompt = [
          `# AI 对话任务`,
          "",
          `请帮我完成以下对话：`,
          topic,
          context ? `\n背景上下文：${context}` : "",
          "",
          `要求：`,
          `- 使用中文回答`,
          `- 回答应专业、简洁、可操作`,
          `- 如有不确定的信息请标注`
        ].join("\n");
        break;
      }
      case "research": {
        const topic = String(payload.topic || "").trim();
        const depth = String(payload.depth || "概览");
        prompt = [
          `# 资料搜集任务`,
          "",
          `研究主题：${topic}`,
          `研究深度：${depth}`,
          "",
          `请执行以下步骤：`,
          `1. 搜索该主题的最新信息（2024-2026年）`,
          `2. 整理关键要点（${depth === "详细" ? "8-12条" : "5-8条"}）`,
          `3. 列出信息来源（标题+链接+简介）`,
          `4. 给出可执行的建议`,
          "",
          `输出格式：结构化文本，包含摘要、要点、来源、建议四部分。`
        ].join("\n");
        break;
      }
      case "write": {
        const platform = String(payload.platform || "小红书");
        const topic = String(payload.topic || payload.title || "").trim();
        const draft = String(payload.draft || payload.body || "").trim();
        const audience = String(payload.audience || "").trim();
        prompt = [
          `# 写作任务`,
          "",
          `平台：${platform}`,
          topic ? `主题/标题：${topic}` : "",
          audience ? `目标人群：${audience}` : "",
          draft ? `\n已有草稿：\n${draft.slice(0, 2000)}` : "",
          "",
          `请完成以下写作：`,
          `1. 生成 3 个吸引点击的标题候选`,
          `2. 起草完整正文（开头钩子+主体结构+结尾互动引导）`,
          `3. 生成封面文案（标题+副标题）`,
          `4. 推荐 8-10 个平台标签`,
          platform === "小红书" ? `\n注意：小红书风格，多用 emoji、短句、口语化` : ""
        ].join("\n");
        break;
      }
      case "analyze": {
        const targetType = String(payload.targetType || payload.type || "产品/功能");
        const target = String(payload.target || payload.name || "").trim();
        const context = String(payload.context || "").trim();
        prompt = [
          `# 分析任务`,
          "",
          `分析对象：${target || "待分析"}`,
          `分析类型：${targetType}`,
          context ? `\n背景信息：${context}` : "",
          "",
          `请从以下维度进行分析：`,
          `1. 目标用户与核心场景`,
          `2. 关键能力与交互亮点`,
          `3. 商业价值与盈利模式`,
          `4. 风险限制与潜在问题`,
          `5. 我可以迁移借鉴的启发（至少3条）`,
          "",
          `输出要求：`,
          `- 使用中文`,
          `- 观点要有具体依据`,
          `- 启发部分要结合我的工作台场景`
        ].join("\n");
        break;
      }
    }

    return {
      ok: true,
      type: finalType,
      prompt
    };
  } catch (error) {
    return { ok: false, error: error.message || "TRAE 桥接服务异常" };
  }
}
