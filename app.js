/* ════════════════════════════════════════════════════════════════════
 * Olivia Work Platform v9.0 — app.js
 * AI全能助手独立入口 · 零配置多模型切换 · 移动端底部导航 · PWA支持
 * 核心模块：首页 · AI助手 · 项目 · 学习 · 英语 · 读书 · 内容创作 · 健康 · 材料 · 复盘
 * ════════════════════════════════════════════════════════════════════ */

const data = window.WORKBENCH_DATA;

/* ─── 全局状态 ─── */
const state = {
  moduleId: "dashboard",
  tab: "今日概览",
  tabGroup: "",
  status: "全部",
  category: "全部",
  audience: "全部",
  view: "cards",
  search: "",
  sort: "default"
};

/* ─── localStorage keys（统一前缀） ─── */
const K = {
  userItems: "olivia-work-platform-user-items",
  dailyLogs: "olivia-work-platform-daily-logs",
  chatHistory: "olivia-work-platform-chat-history",
  pomodoroSessions: "olivia-work-platform-pomodoro-sessions",
  notes: "olivia-work-platform-notes",
  okrs: "olivia-work-platform-okrs",
  vocab: "olivia-work-platform-vocab",
  books: "olivia-work-platform-books",
  water: "olivia-work-platform-water",
  diet: "olivia-work-platform-diet",
  exercise: "olivia-work-platform-exercise",
  sleep: "olivia-work-platform-sleep",
  habits: "olivia-work-platform-habits",
  studyPlan: "olivia-work-platform-study-plan",
  mistakes: "olivia-work-platform-mistakes",
  speaking: "olivia-work-platform-speaking"
};

const userItemsKey = K.userItems;
const dailyLogsKey = K.dailyLogs;

/* ─── 运行时数据 ─── */
const userItems = readUserItems();
const dailyLogs = readDailyLogs();
let chatHistory = readLS(K.chatHistory, []);
let notes = readLS(K.notes, []);
let okrs = readLS(K.okrs, []);
let vocabStore = readLS(K.vocab, { words: [], review: { known: 0, unknown: 0, fuzzy: 0 } });
let books = readLS(K.books, []);
let waterStore = readLS(K.water, {});
let dietStore = readLS(K.diet, { records: [] });
let exerciseStore = readLS(K.exercise, { records: [] });
let sleepStore = readLS(K.sleep, { records: [] });
let habitStore = readLS(K.habits, { habits: [], checkins: {} });
let studyPlanStore = readLS(K.studyPlan, { goals: { vocab: 20, shadow: 5, listen: 15 }, tasks: [], weeklyPlan: {}, generatedDate: "" });
let mistakeStore = readLS(K.mistakes, { items: [], filter: "全部" });
let speakingStore = readLS(K.speaking, { records: [], mode: "topic" });

let lastMatchedSkills = [];
let lastAiAnswer = "";
let lastInspiration = null;
let inspirationAttachments = [];
let lastDailyAnalysis = null;
let editingItemIndex = -1;
let editingItemModuleId = "";
let editingNoteId = null;
let editingOkrId = null;
let editingBookId = null;
let editingVocabId = null;

/* ─── 番茄钟状态 ─── */
const pomodoroState = {
  running: false,
  mode: "25+5",
  workMin: 25,
  breakMin: 5,
  phase: "work", // "work" | "break"
  remaining: 25 * 60,
  taskId: "",
  timer: null
};

/* ─── 单词状态 ─── */
const vocabState = {
  currentWordIndex: 0,
  scene: "parenting",
  flipped: false
};

/* ─── 影子跟读状态 ─── */
const shadowingState = {
  speed: "normal",
  currentSentence: "",
  recording: false,
  currentIndex: 0,
  difficulty: "全部",
  sentenceOrder: [] // 当前句子播放顺序索引列表
};

/* ─── 听力状态 ─── */
const listeningState = {
  mode: "intensive",
  currentIndex: 0,
  sceneFilter: "全部"
};

/* ─── 场景词库状态 ─── */
const sceneVocabState = {
  scene: "parenting",
  currentIndex: 0,
  flipped: false,
  learnedIds: []
};

/* ─── 语法练习状态 ─── */
const grammarState = {
  currentTopic: null,
  currentIndex: 0,
  score: 0,
  total: 0
};

/* ─── 口语测评状态 ─── */
const speakingState = {
  mode: "topic",
  recording: false,
  currentPrompt: null
};

let editingMistakeId = null;

/* ─── 预置示例单词数据（每个场景18个单词） ─── */
const DEFAULT_VOCAB = {
  parenting: [
    { id: "p1", word: "pacifier", phonetic: "/ˈpæsɪfaɪər/", meaning: "n. 安抚奶嘴", example: "The baby dropped his pacifier on the floor.", root: "pacify（安抚）+ -ier（物品）", scene: "parenting" },
    { id: "p2", word: "stroller", phonetic: "/ˈstroʊlər/", meaning: "n. 婴儿推车", example: "She pushed the stroller through the park.", root: "stroll（散步）+ -er（物品）", scene: "parenting" },
    { id: "p3", word: "toddler", phonetic: "/ˈtɒdlər/", meaning: "n. 蹒跚学步的幼儿", example: "The toddler tried to feed himself with a spoon.", root: "toddle（蹒跚行走）+ -er（人）", scene: "parenting" },
    { id: "p4", word: "diaper", phonetic: "/ˈdaɪpər/", meaning: "n. 尿布", example: "The baby needs a diaper change.", root: "diaper（源自希腊 diapeiros，穿过的布料）", scene: "parenting" },
    { id: "p5", word: "bib", phonetic: "/bɪb/", meaning: "n. 围嘴；围兜", example: "Put a bib on the baby before feeding.", root: "bib（短词，中古英语 bibben 喝水溅出）", scene: "parenting" },
    { id: "p6", word: "onesie", phonetic: "/ˈwʌnzi/", meaning: "n. 连体婴儿服", example: "The onesie has cute animal prints.", root: "one + -sie（名词后缀，表示小物件）", scene: "parenting" },
    { id: "p7", word: "crib", phonetic: "/krɪb/", meaning: "n. 婴儿床", example: "The baby is sleeping peacefully in the crib.", root: "crib（古英语 cribb，围栏/畜舍）", scene: "parenting" },
    { id: "p8", word: "highchair", phonetic: "/ˈhaɪtʃer/", meaning: "n. 婴儿高脚椅", example: "She strapped the toddler into the highchair.", root: "high（高的）+ chair（椅子）", scene: "parenting" },
    { id: "p9", word: "teether", phonetic: "/ˈtiːðər/", meaning: "n. 出牙嚼器；磨牙棒", example: "The baby is chewing on a teether.", root: "teeth（牙齿）+ -er（物品）", scene: "parenting" },
    { id: "p10", word: "lullaby", phonetic: "/ˈlʌləbaɪ/", meaning: "n. 摇篮曲", example: "She sang a lullaby to help the baby fall asleep.", root: "lulla（安静）+ by（接近于 bye-bye）", scene: "parenting" },
    { id: "p11", word: "naptime", phonetic: "/ˈnæptaɪm/", meaning: "n. 午睡时间", example: "It's naptime, let's put the kids to bed.", root: "nap（小睡）+ time（时间）", scene: "parenting" },
    { id: "p12", word: "playdate", phonetic: "/ˈpleɪdeɪt/", meaning: "n. （儿童）玩耍约会", example: "We arranged a playdate at the playground.", root: "play（玩耍）+ date（约定）", scene: "parenting" },
    { id: "p13", word: "preschool", phonetic: "/ˈpriːskuːl/", meaning: "n. 幼儿园；学前班", example: "My son starts preschool next month.", root: "pre-（之前）+ school（学校）", scene: "parenting" },
    { id: "p14", word: "babysitter", phonetic: "/ˈbeɪbiˌsɪtər/", meaning: "n. 临时保姆", example: "We hired a babysitter for Saturday night.", root: "baby（婴儿）+ sitter（照看者）", scene: "parenting" },
    { id: "p15", word: "pediatrician", phonetic: "/ˌpiːdiəˈtrɪʃən/", meaning: "n. 儿科医生", example: "The pediatrician said the baby is healthy.", root: "ped-（儿童）+ iatr（医疗）+ -ician（专家）", scene: "parenting" },
    { id: "p16", word: "vaccination", phonetic: "/ˌvæksɪˈneɪʃən/", meaning: "n. 接种疫苗", example: "The vaccination appointment is next Thursday.", root: "vaccin（牛痘/疫苗）+ -ation（名词后缀）", scene: "parenting" },
    { id: "p17", word: "colic", phonetic: "/ˈkɒlɪk/", meaning: "n. （婴儿）肠绞痛", example: "The baby has been crying for hours due to colic.", root: "colic（源自希腊 kolikos，与结肠有关）", scene: "parenting" },
    { id: "p18", word: "weaning", phonetic: "/ˈwiːnɪŋ/", meaning: "n. 断奶", example: "Weaning should be a gradual process.", root: "wean（使断奶）+ -ing（名词后缀）", scene: "parenting" }
  ],
  business: [
    { id: "b1", word: "deliverable", phonetic: "/dɪˈlɪvərəbl/", meaning: "n. 交付物；可交付成果", example: "The deliverable is due by the end of this quarter.", root: "deliver（交付）+ -able（可...的）", scene: "business" },
    { id: "b2", word: "stakeholder", phonetic: "/ˈsteɪkˌhoʊldər/", meaning: "n. 利益相关者", example: "All stakeholders must be informed of the change.", root: "stake（股份/利益）+ holder（持有者）", scene: "business" },
    { id: "b3", word: "leverage", phonetic: "/ˈlevərɪdʒ/", meaning: "v. 利用；n. 杠杆作用", example: "We can leverage our existing technology to enter the market.", root: "lever（杠杆）+ -age（名词后缀）", scene: "business" },
    { id: "b4", word: "synergy", phonetic: "/ˈsɪnərdʒi/", meaning: "n. 协同效应", example: "The merger will create synergy between the two companies.", root: "syn-（共同）+ erg（工作）+ -y（名词后缀）", scene: "business" },
    { id: "b5", word: "scalable", phonetic: "/ˈskeɪləbl/", meaning: "adj. 可扩展的", example: "We need a scalable solution for our growing user base.", root: "scale（规模）+ -able（可...的）", scene: "business" },
    { id: "b6", word: "paradigm", phonetic: "/ˈpærədaɪm/", meaning: "n. 范式；典范", example: "This is a paradigm shift in how we approach marketing.", root: "para-（旁边）+ deigma（展示），源自希腊语", scene: "business" },
    { id: "b7", word: "benchmark", phonetic: "/ˈbentʃmɑːrk/", meaning: "n. 基准；标杆", example: "We use industry benchmarks to measure our performance.", root: "bench（长凳）+ mark（标记）", scene: "business" },
    { id: "b8", word: "milestone", phonetic: "/ˈmaɪlstoʊn/", meaning: "n. 里程碑", example: "Reaching one million users is a major milestone.", root: "mile（英里）+ stone（石头）", scene: "business" },
    { id: "b9", word: "procurement", phonetic: "/prəˈkjʊərmənt/", meaning: "n. 采购", example: "The procurement process takes about two weeks.", root: "pro-（向前）+ cure（关心/获取）+ -ment", scene: "business" },
    { id: "b10", word: "vendor", phonetic: "/ˈvɛndər/", meaning: "n. 供应商", example: "We need to evaluate potential vendors for the project.", root: "vend（出售）+ -or（人/物）", scene: "business" },
    { id: "b11", word: "requisition", phonetic: "/ˌrɛkwɪˈzɪʃən/", meaning: "n. 采购申请；需求单", example: "Submit a requisition form to the finance department.", root: "re-（反复）+ quis（寻求）+ -ition", scene: "business" },
    { id: "b12", word: "allocation", phonetic: "/ˌæləˈkeɪʃən/", meaning: "n. 分配；拨付", example: "The budget allocation for Q3 has been approved.", root: "al-（向）+ loc（位置）+ -ation", scene: "business" },
    { id: "b13", word: "amortization", phonetic: "/ˌæmərtaɪˈzeɪʃən/", meaning: "n. 摊销", example: "The amortization schedule spreads the cost over five years.", root: "a-（向）+ mort（死亡）+ -ization（过程）", scene: "business" },
    { id: "b14", word: "depreciation", phonetic: "/dɪˌpriːʃiˈeɪʃən/", meaning: "n. 折旧；贬值", example: "The depreciation of equipment is recorded annually.", root: "de-（向下）+ preci（价格）+ -ation", scene: "business" },
    { id: "b15", word: "audit", phonetic: "/ˈɔːdɪt/", meaning: "n./v. 审计", example: "The external audit found no major discrepancies.", root: "audit（源自拉丁 audire，听觉→听审）", scene: "business" },
    { id: "b16", word: "compliance", phonetic: "/kəmˈplaɪəns/", meaning: "n. 合规；遵从", example: "Regulatory compliance is mandatory for all employees.", root: "comply（遵守）+ -ance（名词后缀）", scene: "business" },
    { id: "b17", word: "facilitation", phonetic: "/fəˌsɪlɪˈteɪʃən/", meaning: "n. 促进； facilitation 协助", example: "The facilitation of the workshop improved team communication.", root: "facil（容易）+ -ate（动词后缀）+ -ion", scene: "business" },
    { id: "b18", word: "throughput", phonetic: "/ˈθruːpʊt/", meaning: "n. 吞吐量；处理能力", example: "We need to increase the throughput of our processing system.", root: "through（通过）+ put（放置）", scene: "business" }
  ],
  toeic: [
    { id: "t1", word: "invoice", phonetic: "/ˈɪnvɔɪs/", meaning: "n. 发票；v. 开发票", example: "Please submit the invoice to the accounting department.", root: "in-（入）+ voice（源自拉丁 vocare 呼叫）", scene: "toeic" },
    { id: "t2", word: "reimburse", phonetic: "/ˌriːɪmˈbɜːrs/", meaning: "v. 报销；偿还", example: "The company will reimburse your travel expenses.", root: "re-（回）+ imburse（放入钱袋）", scene: "toeic" },
    { id: "t3", word: "consignment", phonetic: "/kənˈsaɪnmənt/", meaning: "n. 托运；一批货物", example: "The consignment arrived at the warehouse this morning.", root: "con-（共同）+ sign（签署）+ -ment", scene: "toeic" },
    { id: "t4", word: "quota", phonetic: "/ˈkwoʊtə/", meaning: "n. 配额；定额", example: "Our sales team exceeded the quarterly quota.", root: "quota（源自拉丁 quota，多少）", scene: "toeic" },
    { id: "t5", word: "subsidiary", phonetic: "/səbˈsɪdiɛri/", meaning: "n. 子公司", example: "The subsidiary operates independently in Europe.", root: "sub-（下面）+ sid（坐）+ -iary", scene: "toeic" },
    { id: "t6", word: "merger", phonetic: "/ˈmɜːrdʒər/", meaning: "n. 合并", example: "The merger between the two firms was approved by regulators.", root: "merge（合并）+ -er（名词后缀）", scene: "toeic" },
    { id: "t7", word: "acquisition", phonetic: "/ˌækwɪˈzɪʃən/", meaning: "n. 收购；取得", example: "The acquisition of the startup cost fifty million dollars.", root: "ac-（向）+ quis（获取）+ -ition", scene: "toeic" },
    { id: "t8", word: "ledger", phonetic: "/ˈlɛdʒər/", meaning: "n. 账簿；分类账", example: "All transactions are recorded in the general ledger.", root: "ledger（源自荷兰 legger， laying down 记录）", scene: "toeic" },
    { id: "t9", word: "inventory", phonetic: "/ˈɪnvəntɔːri/", meaning: "n. 库存；清单", example: "We need to conduct an inventory check at the end of the month.", root: "in-（入）+ vent（来）+ -ory（场所/物品）", scene: "toeic" },
    { id: "t10", word: "logistics", phonetic: "/ləˈdʒɪstɪks/", meaning: "n. 物流", example: "Our logistics team handles shipping and warehousing.", root: "log-（计算）+ -istics（学科后缀）", scene: "toeic" },
    { id: "t11", word: "shipment", phonetic: "/ˈʃɪpmənt/", meaning: "n. 装运；发货", example: "The shipment was delayed due to bad weather.", root: "ship（船运）+ -ment（名词后缀）", scene: "toeic" },
    { id: "t12", word: "freight", phonetic: "/freɪt/", meaning: "n. 货运；运费", example: "The freight charges are included in the total cost.", root: "freight（源自中古荷兰 vracht，货物）", scene: "toeic" },
    { id: "t13", word: "tariff", phonetic: "/ˈtærɪf/", meaning: "n. 关税；税率", example: "The new tariff policy affects our export business.", root: "tariff（源自阿拉伯 ta'rif，通知/信息）", scene: "toeic" },
    { id: "t14", word: "customs", phonetic: "/ˈkʌstəmz/", meaning: "n. 海关", example: "The goods cleared customs without any issues.", root: "custom（习俗）+ -s（复数，引申为海关查验）", scene: "toeic" },
    { id: "t15", word: "certificate", phonetic: "/sərˈtɪfɪkət/", meaning: "n. 证书；证明", example: "You need a certificate of origin for this shipment.", root: "cert（确定）+ -ific + -ate", scene: "toeic" },
    { id: "t16", word: "license", phonetic: "/ˈlaɪsəns/", meaning: "n. 许可证；执照", example: "The restaurant has a valid business license.", root: "licen（允许）+ -se（名词后缀）", scene: "toeic" },
    { id: "t17", word: "franchise", phonetic: "/ˈfræntʃaɪz/", meaning: "n. 特许经营权；加盟", example: "She bought a fast-food franchise and opened three locations.", root: "franch（自由）+ -ise（名词后缀）", scene: "toeic" },
    { id: "t18", word: "arbitration", phonetic: "/ˌɑːrbɪˈtreɪʃən/", meaning: "n. 仲裁", example: "The dispute was resolved through arbitration.", root: "arbitr（判断）+ -ation（名词后缀）", scene: "toeic" }
  ],
  daily: [
    { id: "d1", word: "groceries", phonetic: "/ˈɡroʊsəriz/", meaning: "n. 食品杂货", example: "I need to buy groceries for the week.", root: "grocer（杂货商）+ -ies（复数）", scene: "daily" },
    { id: "d2", word: "commute", phonetic: "/kəˈmjuːt/", meaning: "n./v. 通勤", example: "My daily commute takes about 40 minutes.", root: "com-（共同）+ mute（交换）", scene: "daily" },
    { id: "d3", word: "laundry", phonetic: "/ˈlɔːndri/", meaning: "n. 洗衣；待洗衣物", example: "I do laundry every Sunday morning.", root: "launder（洗涤）+ -y（名词后缀）", scene: "daily" },
    { id: "d4", word: "errand", phonetic: "/ˈerənd/", meaning: "n. 差事；跑腿", example: "I have to run some errands after work.", root: "errand（古英语 ærende，使命/差事）", scene: "daily" },
    { id: "d5", word: "leftovers", phonetic: "/ˈleftoʊvərz/", meaning: "n. 剩菜剩饭", example: "We had leftovers for lunch today.", root: "left（剩下）+ over（多余的）+ -s", scene: "daily" },
    { id: "d6", word: "appointment", phonetic: "/əˈpɔɪntmənt/", meaning: "n. 预约；约定", example: "I have a dentist appointment at 3 PM.", root: "ap-（向）+ point（指定）+ -ment", scene: "daily" },
    { id: "d7", word: "subscribe", phonetic: "/səbˈskraɪb/", meaning: "v. 订阅", example: "I subscribe to several streaming services.", root: "sub-（在下面）+ scribe（写）", scene: "daily" },
    { id: "d8", word: "reminder", phonetic: "/rɪˈmaɪndər/", meaning: "n. 提醒", example: "Set a reminder for the meeting at 10.", root: "re-（再）+ mind（心智）+ -er", scene: "daily" },
    { id: "d9", word: "chore", phonetic: "/tʃɔːr/", meaning: "n. 家务杂事", example: "Doing household chores takes up my weekends.", root: "chore（中古英语 char，零工）", scene: "daily" },
    { id: "d10", word: "utility", phonetic: "/juːˈtɪləti/", meaning: "n. 公共事业费（水电气等）", example: "I need to pay the utility bills this week.", root: "util（使用）+ -ity（名词后缀）", scene: "daily" },
    { id: "d11", word: "recipe", phonetic: "/ˈresəpi/", meaning: "n. 食谱", example: "This recipe has been in my family for generations.", root: "re-（再）+ cipe（取），源自拉丁 recipere", scene: "daily" },
    { id: "d12", word: "neighborhood", phonetic: "/ˈneɪbərhʊd/", meaning: "n. 社区；街坊", example: "Our neighborhood is very quiet and friendly.", root: "neighbor（邻居）+ -hood（状态/领域）", scene: "daily" },
    { id: "d13", word: "schedule", phonetic: "/ˈskedʒuːl/", meaning: "n./v. 日程；安排", example: "Let me check my schedule before confirming.", root: "schedul（源自拉丁 schedula，小纸条）", scene: "daily" },
    { id: "d14", word: "maintenance", phonetic: "/ˈmeɪntənəns/", meaning: "n. 维护；保养", example: "The car needs regular maintenance.", root: "main（手）+ ten（持有）+ -ance", scene: "daily" },
    { id: "d15", word: "subscription", phonetic: "/səbˈskrɪpʃən/", meaning: "n. 订阅费", example: "Cancel the subscriptions you don't use.", root: "sub-（在下面）+ script（写）+ -ion", scene: "daily" },
    { id: "d16", word: "budget", phonetic: "/ˈbʌdʒɪt/", meaning: "n. 预算", example: "We need to stick to our monthly budget.", root: "budget（源自拉丁 bulga，皮包/钱袋）", scene: "daily" },
    { id: "d17", word: "trash", phonetic: "/træʃ/", meaning: "n. 垃圾", example: "Don't forget to take out the trash.", root: "trash（源自斯堪的纳维亚，碎片/废物）", scene: "daily" },
    { id: "d18", word: "thermostat", phonetic: "/ˈθɜːrməstæt/", meaning: "n. 恒温器", example: "I set the thermostat to 22 degrees.", root: "thermo（热）+ stat（站立/固定）", scene: "daily" }
  ],
  travel: [
    { id: "tr1", word: "itinerary", phonetic: "/aɪˈtɪnəreri/", meaning: "n. 行程表；旅行计划", example: "Here's the itinerary for our trip to Japan.", root: "itiner（旅程）+ -ary（形容词→名词）", scene: "travel" },
    { id: "tr2", word: "souvenir", phonetic: "/ˌsuːvəˈnɪr/", meaning: "n. 纪念品", example: "I bought a souvenir for my mom.", root: "sub-（在下面）+ venir（来），记忆", scene: "travel" },
    { id: "tr3", word: "boarding pass", phonetic: "/ˈbɔːrdɪŋ pæs/", meaning: "n. 登机牌", example: "Please show your boarding pass at the gate.", root: "board（上船/机）+ pass（通行证）", scene: "travel" },
    { id: "tr4", word: "check-in", phonetic: "/ˈtʃɛkˌɪn/", meaning: "n./v. 办理登机/入住手续", example: "Check-in starts two hours before the flight.", root: "check（核对）+ in（进入）", scene: "travel" },
    { id: "tr5", word: "layover", phonetic: "/ˈleɪoʊvər/", meaning: "n. 中途停留", example: "We have a three-hour layover in Dubai.", root: "lay（停留）+ over（在上方/期间）", scene: "travel" },
    { id: "tr6", word: "destination", phonetic: "/ˌdɛstɪˈneɪʃən/", meaning: "n. 目的地", example: "Paris is our final destination.", root: "destin（注定/指定）+ -ation", scene: "travel" },
    { id: "tr7", word: "excursion", phonetic: "/ɪkˈskɜːrʒən/", meaning: "n. 短途游览", example: "We booked a boat excursion to the islands.", root: "ex-（向外）+ curs（跑）+ -ion", scene: "travel" },
    { id: "tr8", word: "accommodation", phonetic: "/əˌkɑːməˈdeɪʃən/", meaning: "n. 住宿", example: "The accommodation includes breakfast.", root: "ac-（向）+ commod（合适）+ -ation", scene: "travel" },
    { id: "tr9", word: "customs", phonetic: "/ˈkʌstəmz/", meaning: "n. 海关", example: "We passed through customs quickly.", root: "custom（习俗）+ -s（引申为海关）", scene: "travel" },
    { id: "tr10", word: "currency", phonetic: "/ˈkɜːrənsi/", meaning: "n. 货币", example: "I need to exchange some currency.", root: "curr（流通）+ -ency（名词后缀）", scene: "travel" },
    { id: "tr11", word: "visa", phonetic: "/ˈviːzə/", meaning: "n. 签证", example: "Do I need a visa to travel there?", root: "visa（拉丁 videre，已看见→已查验）", scene: "travel" },
    { id: "tr12", word: "luggage", phonetic: "/ˈlʌɡɪdʒ/", meaning: "n. 行李", example: "Keep your luggage with you at all times.", root: "lug（拖拽）+ -age（集合名词）", scene: "travel" },
    { id: "tr13", word: "departure", phonetic: "/dɪˈpɑːrtʃər/", meaning: "n. 出发；起飞", example: "The departure time has been changed.", root: "de-（离开）+ part（分开）+ -ure", scene: "travel" },
    { id: "tr14", word: "reservation", phonetic: "/ˌrɛzərˈveɪʃən/", meaning: "n. 预订", example: "I have a reservation under the name Smith.", root: "re-（向后）+ serv（保留）+ -ation", scene: "travel" },
    { id: "tr15", word: "jet lag", phonetic: "/ˈdʒɛt læɡ/", meaning: "n. 时差反应", example: "I'm suffering from jet lag after the long flight.", root: "jet（喷气式飞机）+ lag（滞后）", scene: "travel" },
    { id: "tr16", word: "hostel", phonetic: "/ˈhɑːstəl/", meaning: "n. 青年旅舍", example: "We stayed at a budget hostel in Berlin.", root: "host（主人）+ -el（场所）", scene: "travel" },
    { id: "tr17", word: "tourist attraction", phonetic: "/ˈtʊrɪst əˈtrækʃən/", meaning: "n. 旅游景点", example: "The museum is a popular tourist attraction.", root: "tour（巡回）+ -ist（人）+ attract（吸引）+ -ion", scene: "travel" },
    { id: "tr18", word: "passport", phonetic: "/ˈpæspɔːrt/", meaning: "n. 护照", example: "Don't forget to bring your passport.", root: "pass（通过）+ port（港口）", scene: "travel" }
  ],
  tech: [
    { id: "tech1", word: "algorithm", phonetic: "/ˈælɡərɪðəm/", meaning: "n. 算法", example: "The search algorithm returns results in milliseconds.", root: "algor（阿拉伯数学家名字）+ -ism", scene: "tech" },
    { id: "tech2", word: "API", phonetic: "/ˌeɪ piː ˈaɪ/", meaning: "n. 应用程序编程接口", example: "We use the REST API to communicate with the server.", root: "Application Programming Interface 首字母缩写", scene: "tech" },
    { id: "tech3", word: "bandwidth", phonetic: "/ˈbændwɪdθ/", meaning: "n. 带宽", example: "Higher bandwidth allows faster data transfer.", root: "band（频带）+ width（宽度）", scene: "tech" },
    { id: "tech4", word: "blockchain", phonetic: "/ˈblɑːktʃeɪn/", meaning: "n. 区块链", example: "Blockchain ensures transparency in transactions.", root: "block（区块）+ chain（链）", scene: "tech" },
    { id: "tech5", word: "cache", phonetic: "/kæʃ/", meaning: "n./v. 缓存", example: "Clear the browser cache to fix loading issues.", root: "cache（法语，隐藏/储存）", scene: "tech" },
    { id: "tech6", word: "cloud computing", phonetic: "/klaʊd kəmˈpjuːtɪŋ/", meaning: "n. 云计算", example: "Our company migrated to cloud computing last year.", root: "cloud（云）+ computing（计算）", scene: "tech" },
    { id: "tech7", word: "cybersecurity", phonetic: "/ˌsaɪbərsɪˈkjʊrəti/", meaning: "n. 网络安全", example: "Cybersecurity is a top priority for financial institutions.", root: "cyber（网络）+ security（安全）", scene: "tech" },
    { id: "tech8", word: "database", phonetic: "/ˈdeɪtəbeɪs/", meaning: "n. 数据库", example: "All customer records are stored in the database.", root: "data（数据）+ base（基地）", scene: "tech" },
    { id: "tech9", word: "debugging", phonetic: "/ˈdiːbʌɡɪŋ/", meaning: "n. 调试", example: "Debugging takes up most of the development time.", root: "de-（消除）+ bug（缺陷）+ -ing", scene: "tech" },
    { id: "tech10", word: "deployment", phonetic: "/dɪˈplɔɪmənt/", meaning: "n. 部署", example: "The new software deployment went smoothly.", root: "deploy（部署）+ -ment", scene: "tech" },
    { id: "tech11", word: "encryption", phonetic: "/ɪnˈkrɪpʃən/", meaning: "n. 加密", example: "End-to-end encryption protects your messages.", root: "en-（使）+ crypt（隐藏）+ -ion", scene: "tech" },
    { id: "tech12", word: "firewall", phonetic: "/ˈfaɪərwɔːl/", meaning: "n. 防火墙", example: "A firewall blocks unauthorized access to the network.", root: "fire（火）+ wall（墙）", scene: "tech" },
    { id: "tech13", word: "framework", phonetic: "/ˈfreɪmwɜːrk/", meaning: "n. 框架", example: "React is a popular JavaScript framework.", root: "frame（框架）+ work（工作）", scene: "tech" },
    { id: "tech14", word: "interface", phonetic: "/ˈɪntərfeɪs/", meaning: "n. 接口；界面", example: "The user interface should be intuitive and clean.", root: "inter-（之间）+ face（面）", scene: "tech" },
    { id: "tech15", word: "machine learning", phonetic: "/məˈʃiːn ˈlɜːrnɪŋ/", meaning: "n. 机器学习", example: "Machine learning models improve with more data.", root: "machine（机器）+ learning（学习）", scene: "tech" },
    { id: "tech16", word: "neural network", phonetic: "/ˈnʊrəl ˈnetwɜːrk/", meaning: "n. 神经网络", example: "Neural networks power most modern AI systems.", root: "neural（神经的）+ network（网络）", scene: "tech" },
    { id: "tech17", word: "open source", phonetic: "/ˌoʊpən ˈsɔːrs/", meaning: "n./adj. 开源", example: "Linux is the most famous open source operating system.", root: "open（开放）+ source（源代码）", scene: "tech" },
    { id: "tech18", word: "protocol", phonetic: "/ˈproʊtəkɑːl/", meaning: "n. 协议", example: "HTTPS is a secure protocol for web browsing.", root: "proto（第一）+ col（粘合），原义为粘合规则→协议", scene: "tech" },
    { id: "tech19", word: "repository", phonetic: "/rɪˈpɑːzɪtɔːri/", meaning: "n. 仓库；代码库", example: "You can clone the repository from GitHub.", root: "re-（向后）+ posit（放置）+ -ory（场所）", scene: "tech" },
    { id: "tech20", word: "scalability", phonetic: "/ˌskeɪləˈbɪləti/", meaning: "n. 可扩展性", example: "Scalability is essential for growing businesses.", root: "scale（规模）+ -abil（能力）+ -ity", scene: "tech" }
  ],
  academic: [
    { id: "academic1", word: "abstract", phonetic: "/ˈæbstrækt/", meaning: "n./adj. 摘要；抽象的", example: "Please read the abstract before the full paper.", root: "abs-（离开）+ tract（拉）→ 提取出要点", scene: "academic" },
    { id: "academic2", word: "citation", phonetic: "/saɪˈteɪʃən/", meaning: "n. 引用；引文", example: "Proper citation gives credit to original authors.", root: "cit（引用/召唤）+ -ation", scene: "academic" },
    { id: "academic3", word: "hypothesis", phonetic: "/haɪˈpɑːθəsɪs/", meaning: "n. 假设；假说", example: "The hypothesis was supported by experimental data.", root: "hypo-（在下面）+ thesis（论点）", scene: "academic" },
    { id: "academic4", word: "methodology", phonetic: "/ˌmeθəˈdɑːlədʒi/", meaning: "n. 方法论", example: "The methodology section describes the research design.", root: "method（方法）+ -ology（学科）", scene: "academic" },
    { id: "academic5", word: "peer review", phonetic: "/ˌpɪr rɪˈvjuː/", meaning: "n. 同行评审", example: "The paper passed the peer review process.", root: "peer（同行）+ review（评审）", scene: "academic" },
    { id: "academic6", word: "plagiarism", phonetic: "/ˈpleɪdʒərɪzəm/", meaning: "n. 抄袭；剽窃", example: "Plagiarism is a serious academic offense.", root: "plagi（绑架/偷窃）+ -ar + -ism", scene: "academic" },
    { id: "academic7", word: "qualitative", phonetic: "/ˈkwɑːlɪteɪtɪv/", meaning: "adj. 定性的", example: "The study uses qualitative interviews for data collection.", root: "qual（性质/品质）+ -itative", scene: "academic" },
    { id: "academic8", word: "quantitative", phonetic: "/ˈkwɑːntɪteɪtɪv/", meaning: "adj. 定量的", example: "Quantitative analysis reveals clear statistical patterns.", root: "quant（数量）+ -itative", scene: "academic" },
    { id: "academic9", word: "regression", phonetic: "/rɪˈɡreʃən/", meaning: "n. 回归；退步", example: "Linear regression is a fundamental statistical method.", root: "re-（向后）+ gress（走）+ -ion", scene: "academic" },
    { id: "academic10", word: "significance", phonetic: "/sɪɡˈnɪfɪkəns/", meaning: "n. 显著性；重要性", example: "The results reached statistical significance.", root: "sign（标记）+ -ific + -ance", scene: "academic" },
    { id: "academic11", word: "theorem", phonetic: "/ˈθiːərəm/", meaning: "n. 定理", example: "Pythagoras' theorem is fundamental in geometry.", root: "theo（神/看）+ rem（事物）", scene: "academic" },
    { id: "academic12", word: "variable", phonetic: "/ˈveriəbl/", meaning: "n./adj. 变量；可变的", example: "Income level is the independent variable in this study.", root: "vari（变化）+ -able", scene: "academic" },
    { id: "academic13", word: "correlation", phonetic: "/ˌkɔːrəˈleɪʃən/", meaning: "n. 相关性", example: "There is a strong correlation between exercise and health.", root: "cor-（共同）+ relate（关联）+ -ion", scene: "academic" },
    { id: "academic14", word: "empirical", phonetic: "/ɪmˈpɪrɪkəl/", meaning: "adj. 经验主义的；实证的", example: "Empirical evidence supports this theoretical model.", root: "em-（进入）+ pir（试验）+ -ical", scene: "academic" },
    { id: "academic15", word: "literature review", phonetic: "/ˈlɪtrətʃər rɪˈvjuː/", meaning: "n. 文献综述", example: "The literature review summarizes prior research.", root: "literature（文献）+ review（综述）", scene: "academic" },
    { id: "academic16", word: "paradigm", phonetic: "/ˈpærədaɪm/", meaning: "n. 范式；典范", example: "This discovery shifts the current scientific paradigm.", root: "para-（旁边）+ deigma（展示/示例）", scene: "academic" },
    { id: "academic17", word: "proposition", phonetic: "/ˌprɑːpəˈzɪʃən/", meaning: "n. 命题；提议", example: "The proposition was tested through a series of experiments.", root: "pro-（向前）+ posit（放置）+ -ion", scene: "academic" },
    { id: "academic18", word: "solicited", phonetic: "/səˈlɪsɪtɪd/", meaning: "adj. 请求的；征求的", example: "The journal only publishes solicited submissions.", root: "solicit（请求/征求）+ -ed", scene: "academic" },
    { id: "academic19", word: "synthesis", phonetic: "/ˈsɪnθəsɪs/", meaning: "n. 综合；合成", example: "The thesis provides a synthesis of existing theories.", root: "syn-（共同）+ thes（放置）+ -is", scene: "academic" },
    { id: "academic20", word: "theoretical", phonetic: "/ˌθiːəˈretɪkəl/", meaning: "adj. 理论的", example: "The study offers a theoretical framework for analysis.", root: "theory（理论）+ -etical", scene: "academic" }
  ],
  cet4: [
    { id: "cet4_1", word: "abandon", phonetic: "/əˈbændən/", meaning: "v. 放弃；抛弃", example: "They had to abandon the project due to lack of funds.", root: "a-（离开）+ bandon（控制）→ 放弃控制", scene: "cet4" },
    { id: "cet4_2", word: "benefit", phonetic: "/ˈbenɪfɪt/", meaning: "n./v. 利益；受益", example: "Regular exercise benefits both body and mind.", root: "bene-（好）+ fit（做）", scene: "cet4" },
    { id: "cet4_3", word: "compete", phonetic: "/kəmˈpiːt/", meaning: "v. 竞争；比赛", example: "Students compete for scholarships every year.", root: "com-（共同）+ pete（追求）", scene: "cet4" },
    { id: "cet4_4", word: "demonstrate", phonetic: "/ˈdemənstreɪt/", meaning: "v. 证明；示范", example: "The experiment demonstrates the effects of pollution.", root: "de-（完全）+ monstr（展示）+ -ate", scene: "cet4" },
    { id: "cet4_5", word: "eliminate", phonetic: "/ɪˈlɪmɪneɪt/", meaning: "v. 消除；淘汰", example: "We need to eliminate all sources of error.", root: "e-（出去）+ limin（门槛）+ -ate", scene: "cet4" },
    { id: "cet4_6", word: "fundamental", phonetic: "/ˌfʌndəˈmentəl/", meaning: "adj. 基本的；根本的", example: "Clean water is a fundamental human right.", root: "fund（基础）+ -ment + -al", scene: "cet4" },
    { id: "cet4_7", word: "generate", phonetic: "/ˈdʒenəreɪt/", meaning: "v. 产生；发电", example: "Solar panels generate clean electricity.", root: "gen（产生）+ -er + -ate", scene: "cet4" },
    { id: "cet4_8", word: "inevitable", phonetic: "/ɪnˈevɪtəbl/", meaning: "adj. 不可避免的", example: "Change is inevitable in a fast-moving world.", root: "in-（不）+ evit（避免）+ -able", scene: "cet4" },
    { id: "cet4_9", word: "maintain", phonetic: "/meɪnˈteɪn/", meaning: "v. 维持；保养", example: "It is important to maintain a healthy lifestyle.", root: "main（手）+ tain（持有）", scene: "cet4" },
    { id: "cet4_10", word: "negotiate", phonetic: "/nɪˈɡoʊʃieɪt/", meaning: "v. 谈判；协商", example: "The two sides agreed to negotiate a ceasefire.", root: "neg-（否定）+ ot（休闲）+ -iate → 无暇休息→忙于商议", scene: "cet4" },
    { id: "cet4_11", word: "obstacle", phonetic: "/ˈɑːbstəkl/", meaning: "n. 障碍；阻碍", example: "Lack of funding is a major obstacle for researchers.", root: "ob-（对面）+ st（站）+ -acle", scene: "cet4" },
    { id: "cet4_12", word: "phenomenon", phonetic: "/fɪˈnɑːmɪnɑːn/", meaning: "n. 现象", example: "Global warming is a well-documented phenomenon.", root: "phenom（显现）+ -en + -on", scene: "cet4" },
    { id: "cet4_13", word: "relevant", phonetic: "/ˈreləvənt/", meaning: "adj. 相关的", example: "Please include all relevant details in your report.", root: "re-（再次）+ lev（举）+ -ant", scene: "cet4" },
    { id: "cet4_14", word: "substitute", phonetic: "/ˈsʌbstɪtjuːt/", meaning: "n./v. 替代品；替代", example: "There is no substitute for hard work.", root: "sub-（在下面）+ stitut（站立/放置）", scene: "cet4" },
    { id: "cet4_15", word: "tendency", phonetic: "/ˈtendənsi/", meaning: "n. 趋势；倾向", example: "There is a tendency for prices to rise in summer.", root: "tend（倾向）+ -ency", scene: "cet4" },
    { id: "cet4_16", word: "ultimately", phonetic: "/ˈʌltɪmətli/", meaning: "adv. 最终；根本上", example: "Ultimately, the decision is yours to make.", root: "ultim（最后）+ -ate + -ly", scene: "cet4" },
    { id: "cet4_17", word: "vulnerable", phonetic: "/ˈvʌlnərəbl/", meaning: "adj. 脆弱的；易受伤的", example: "Children are especially vulnerable to air pollution.", root: "vulner（伤）+ -able", scene: "cet4" },
    { id: "cet4_18", word: "widespread", phonetic: "/ˈwaɪdspred/", meaning: "adj. 普遍的；广泛的", example: "The internet has led to widespread access to information.", root: "wide（广泛）+ spread（传播）", scene: "cet4" },
    { id: "cet4_19", word: "yield", phonetic: "/jiːld/", meaning: "v./n. 产出；屈服", example: "These apple trees yield fruit every autumn.", root: "yield（古英语，生产/给予）", scene: "cet4" },
    { id: "cet4_20", word: "anticipate", phonetic: "/ænˈtɪsɪpeɪt/", meaning: "v. 预期；期望", example: "We anticipate strong growth in the next quarter.", root: "ante-（之前）+ cip（抓/取）+ -ate", scene: "cet4" }
  ],
  cet6: [
    { id: "cet6_1", word: "accommodate", phonetic: "/əˈkɑːmədeɪt/", meaning: "v. 容纳；适应", example: "The hotel can accommodate up to 500 guests.", root: "ac-（向）+ commod（合适）+ -ate", scene: "cet6" },
    { id: "cet6_2", word: "bulk", phonetic: "/bʌlk/", meaning: "n. 大部分；体积", example: "The bulk of the work was completed by the team.", root: "bulk（古诺斯语，货物堆）", scene: "cet6" },
    { id: "cet6_3", word: "coherent", phonetic: "/koʊˈhɪrənt/", meaning: "adj. 连贯的；一致的", example: "She presented a coherent argument in the debate.", root: "co-（共同）+ her（粘合）+ -ent", scene: "cet6" },
    { id: "cet6_4", word: "deteriorate", phonetic: "/dɪˈtɪriəreɪt/", meaning: "v. 恶化；变坏", example: "Air quality continues to deteriorate in urban areas.", root: "de-（向下）+terior（更差）+ -ate", scene: "cet6" },
    { id: "cet6_5", word: "elaborate", phonetic: "/ɪˈlæbərət/", meaning: "adj./v. 精心制作的；详述", example: "Could you elaborate on your main point?", root: "e-（出）+ labor（劳动）+ -ate", scene: "cet6" },
    { id: "cet6_6", word: "fluctuate", phonetic: "/ˈflʌktʃueɪt/", meaning: "v. 波动；起伏", example: "Oil prices fluctuate due to global demand.", root: "fluctu（流动）+ -ate", scene: "cet6" },
    { id: "cet6_7", word: "indigenous", phonetic: "/ɪnˈdɪdʒənəs/", meaning: "adj. 本土的；土著的", example: "The region is home to several indigenous tribes.", root: "indu（在内部）+ gen（产生）+ -ous", scene: "cet6" },
    { id: "cet6_8", word: "legitimate", phonetic: "/lɪˈdʒɪtɪmət/", meaning: "adj. 合法的；正当的", example: "He has a legitimate claim to the property.", root: "leg（法律）+ -itim + -ate", scene: "cet6" },
    { id: "cet6_9", word: "manifest", phonetic: "/ˈmænɪfest/", meaning: "v./adj. 表明；明显的", example: "The symptoms usually manifest within 48 hours.", root: "mani（手）+ fest（敲打）→ 手势→表明", scene: "cet6" },
    { id: "cet6_10", word: "notorious", phonetic: "/noʊˈtɔːriəs/", meaning: "adj. 臭名昭著的", example: "The city is notorious for its traffic congestion.", root: "not（知道）+ -ori + -ous", scene: "cet6" },
    { id: "cet6_11", word: "persistent", phonetic: "/pərˈsɪstənt/", meaning: "adj. 持续的；坚持不懈的", example: "Persistent effort is the key to success.", root: "per-（始终）+ sist（站立）+ -ent", scene: "cet6" },
    { id: "cet6_12", word: "refine", phonetic: "/rɪˈfaɪn/", meaning: "v. 提炼；改进", example: "We need to refine our testing procedures.", root: "re-（再次）+ fine（好/精美）", scene: "cet6" },
    { id: "cet6_13", word: "spontaneous", phonetic: "/spɑːnˈteɪniəs/", meaning: "adj. 自发的；即兴的", example: "The audience broke into spontaneous applause.", root: "spont（自愿）+ -ane + -ous", scene: "cet6" },
    { id: "cet6_14", word: "trigger", phonetic: "/ˈtrɪɡər/", meaning: "v./n. 触发；引发", example: "The earthquake triggered a massive tsunami.", root: "trigger（中古荷兰语，扳机）", scene: "cet6" },
    { id: "cet6_15", word: "unprecedented", phonetic: "/ʌnˈpresɪdentɪd/", meaning: "adj. 史无前例的", example: "The pandemic caused unprecedented economic disruption.", root: "un-（无）+ pre-（前）+ ced（走）+ -ent + -ed", scene: "cet6" },
    { id: "cet6_16", word: "versatile", phonetic: "/ˈvɜːrsətl/", meaning: "adj. 多才多艺的；通用的", example: "She is a versatile musician who plays five instruments.", root: "vers（转）+ -at + -ile", scene: "cet6" },
    { id: "cet6_17", word: "ambiguous", phonetic: "/æmˈbɪɡjuəs/", meaning: "adj. 模棱两可的", example: "The contract language is ambiguous and needs revision.", root: "ambi-（两边）+ ig（走）+ -uous", scene: "cet6" },
    { id: "cet6_18", word: "consensus", phonetic: "/kənˈsensəs/", meaning: "n. 共识；一致意见", example: "The committee reached a consensus on the new policy.", root: "con-（共同）+ sens（感觉）+ -us", scene: "cet6" },
    { id: "cet6_19", word: "depict", phonetic: "/dɪˈpɪkt/", meaning: "v. 描绘；描述", example: "The novel depicts rural life in 19th-century England.", root: "de-（加强）+ pict（画/描绘）", scene: "cet6" },
    { id: "cet6_20", word: "exaggerate", phonetic: "/ɪɡˈzædʒəreɪt/", meaning: "v. 夸张；夸大", example: "Don't exaggerate the risks of the procedure.", root: "ex-（向外）+ aggreg（堆积）+ -ate", scene: "cet6" }
  ]
};

/* ─── 影子跟读示例句子（20句，分难度） ─── */
const SHADOWING_SENTENCES = [
  // 简单（日常）5句
  { id: "s1", text: "The early bird catches the worm, but the second mouse gets the cheese.", level: "简单" },
  { id: "s2", text: "Could you please pass me the salt and pepper?", level: "简单" },
  { id: "s3", text: "I usually have coffee and toast for breakfast.", level: "简单" },
  { id: "s4", text: "The weather is really nice today, let's go for a walk.", level: "简单" },
  { id: "s5", text: "Excuse me, where is the nearest subway station?", level: "简单" },
  // 中等（职场）8句
  { id: "s6", text: "Innovation distinguishes between a leader and a follower.", level: "中等" },
  { id: "s7", text: "We need to finalize the proposal before the board meeting next week.", level: "中等" },
  { id: "s8", text: "The quarterly report shows a significant increase in revenue.", level: "中等" },
  { id: "s9", text: "Could you schedule a follow-up meeting to discuss the project timeline?", level: "中等" },
  { id: "s10", text: "Our team has been working hard to meet the deadline.", level: "中等" },
  { id: "s11", text: "Please review the attached document and share your feedback.", level: "中等" },
  { id: "s12", text: "The client requested some modifications to the original design.", level: "中等" },
  { id: "s13", text: "We should prioritize tasks based on urgency and importance.", level: "中等" },
  // 困难（演讲/名言）7句
  { id: "s14", text: "The best way to predict the future is to create it.", level: "困难" },
  { id: "s15", text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", level: "困难" },
  { id: "s16", text: "Whether you think you can or you think you can't, you're right.", level: "困难" },
  { id: "s17", text: "In the middle of difficulty lies opportunity, and those who persevere will ultimately prevail.", level: "困难" },
  { id: "s18", text: "The only thing we have to fear is fear itself, and the refusal to act in the face of uncertainty.", level: "困难" },
  { id: "s19", text: "Education is the most powerful weapon which you can use to change the world.", level: "困难" },
  { id: "s20", text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", level: "困难" },
  // 简单（日常扩展）5句
  { id: "s21", text: "I'm looking forward to the weekend because I really need some rest.", level: "简单" },
  { id: "s22", text: "Could you tell me how to get to the nearest convenience store?", level: "简单" },
  { id: "s23", text: "The soup tastes a bit salty, could you add some water?", level: "简单" },
  { id: "s24", text: "I usually go for a run in the park every morning.", level: "简单" },
  { id: "s25", text: "Remember to lock the door before you leave the house.", level: "简单" },
  // 中等（职场扩展）7句
  { id: "s26", text: "Let's circle back to this issue after we gather more data from the user research.", level: "中等" },
  { id: "s27", text: "I think we should leverage our existing resources to minimize the development cost.", level: "中等" },
  { id: "s28", text: "The stakeholder meeting has been rescheduled to next Thursday afternoon.", level: "中等" },
  { id: "s29", text: "We're seeing a significant improvement in user retention after the latest update.", level: "中等" },
  { id: "s30", text: "Please make sure to cc me on all communications regarding this project.", level: "中等" },
  { id: "s31", text: "The marketing campaign generated a higher conversion rate than we initially expected.", level: "中等" },
  { id: "s32", text: "I'd like to propose a new approach that could potentially save us a lot of time.", level: "中等" },
  // 困难（演讲/名言扩展）5句
  { id: "s33", text: "Be the change that you wish to see in the world, for transformation begins within.", level: "困难" },
  { id: "s34", text: "It is during our darkest moments that we must focus to see the light and find our way forward.", level: "困难" },
  { id: "s35", text: "The future belongs to those who believe in the beauty of their dreams and pursue them relentlessly.", level: "困难" },
  { id: "s36", text: "Innovation is the calling card of the future, and only those who embrace change will thrive.", level: "困难" },
  { id: "s37", text: "Do not go where the path may lead; go instead where there is no path and leave a trail behind.", level: "困难" },
  // 简单（日常扩展2）6句
  { id: "s38", text: "I think I'll order a salad and a glass of lemonade for lunch today.", level: "简单" },
  { id: "s39", text: "Don't forget to water the plants before you leave for work tomorrow morning.", level: "简单" },
  { id: "s40", text: "The library is just around the corner, next to the post office.", level: "简单" },
  { id: "s41", text: "I usually listen to podcasts while commuting to work every day.", level: "简单" },
  { id: "s42", text: "Could you help me carry these bags upstairs to the third floor?", level: "简单" },
  { id: "s43", text: "Let's meet at the cafe near the park at around ten o'clock.", level: "简单" },
  // 中等（职场扩展2）6句
  { id: "s44", text: "We need to align our strategy with the new market trends and customer demands.", level: "中等" },
  { id: "s45", text: "The project scope has been revised, so please update the timeline accordingly.", level: "中等" },
  { id: "s46", text: "I'll prepare a detailed analysis and present the findings during tomorrow's stand-up.", level: "中等" },
  { id: "s47", text: "Let's touch base after the client call to discuss the next steps and action items.", level: "中等" },
  { id: "s48", text: "The budget allocation for Q3 needs to be approved by the finance department.", level: "中等" },
  { id: "s49", text: "We should conduct a thorough risk assessment before moving forward with the implementation.", level: "中等" },
  // 困难（演讲/名言扩展2）6句
  { id: "s50", text: "The only limit to our realization of tomorrow will be our doubts of today.", level: "困难" },
  { id: "s51", text: "Injustice anywhere is a threat to justice everywhere, and we cannot remain silent in the face of oppression.", level: "困难" },
  { id: "s52", text: "The mind is everything. What you think, you become, and what you believe, you can achieve.", level: "困难" },
  { id: "s53", text: "Freedom is never voluntarily given by the oppressor; it must be demanded by the oppressed.", level: "困难" },
  { id: "s54", text: "The time is always right to do what is right, and justice delayed is justice denied.", level: "困难" },
  { id: "s55", text: "Those who cannot remember the past are condemned to repeat it, and history teaches us the cost of indifference.", level: "困难" }
];

/* ─── 听力训练示例句子（20句，分场景） ─── */
const LISTENING_SENTENCES = [
  // 办公场景 5句
  { id: "l1", text: "Could you please clarify the main objective of this project?", scene: "办公", difficulty: "中等" },
  { id: "l2", text: "We need to finalize the budget before the end of the month.", scene: "办公", difficulty: "中等" },
  { id: "l3", text: "The presentation will be held in the main conference room at three.", scene: "办公", difficulty: "简单" },
  { id: "l4", text: "I'd like to schedule a follow-up meeting to discuss the results.", scene: "办公", difficulty: "中等" },
  { id: "l5", text: "Please make sure all the documents are submitted by Friday.", scene: "办公", difficulty: "简单" },
  // 电话沟通 5句
  { id: "l6", text: "Hello, this is Sarah from the marketing department. May I speak with Mr. Johnson?", scene: "电话", difficulty: "中等" },
  { id: "l7", text: "I'm calling regarding the proposal we sent last week. Have you had a chance to review it?", scene: "电话", difficulty: "困难" },
  { id: "l8", text: "I'm sorry, he's currently in a meeting. Would you like to leave a message?", scene: "电话", difficulty: "简单" },
  { id: "l9", text: "Could you transfer me to the customer service department, please?", scene: "电话", difficulty: "简单" },
  { id: "l10", text: "Let me put you on hold for just a moment while I check that information.", scene: "电话", difficulty: "中等" },
  // 会议讨论 5句
  { id: "l11", text: "Let's get started by reviewing the action items from last week's meeting.", scene: "会议", difficulty: "中等" },
  { id: "l12", text: "Does anyone have concerns about the proposed timeline for the product launch?", scene: "会议", difficulty: "困难" },
  { id: "l13", text: "I'd like to hear everyone's input before we make a final decision.", scene: "会议", difficulty: "中等" },
  { id: "l14", text: "The key takeaway from the data is that user engagement has increased by thirty percent.", scene: "会议", difficulty: "困难" },
  { id: "l15", text: "We'll wrap up the meeting here and circulate the minutes by email.", scene: "会议", difficulty: "中等" },
  // 日常社交 5句
  { id: "l16", text: "It's been a while since we last met. How have you been?", scene: "社交", difficulty: "简单" },
  { id: "l17", text: "Would you like to grab a cup of coffee after work sometime?", scene: "社交", difficulty: "简单" },
  { id: "l18", text: "I really enjoyed the movie we watched last night. The plot was quite unexpected.", scene: "社交", difficulty: "中等" },
  { id: "l19", text: "Do you have any plans for the upcoming holiday weekend?", scene: "社交", difficulty: "简单" },
  { id: "l20", text: "Thanks for inviting me to dinner. The food was absolutely delicious.", scene: "社交", difficulty: "简单" },
  // 机场旅行 5句
  { id: "l21", text: "Please have your boarding pass and passport ready for inspection.", scene: "旅行", difficulty: "简单" },
  { id: "l22", text: "The flight to Tokyo has been delayed by approximately two hours due to weather conditions.", scene: "旅行", difficulty: "中等" },
  { id: "l23", text: "Would you prefer a window seat or an aisle seat for this flight?", scene: "旅行", difficulty: "简单" },
  { id: "l24", text: "Please proceed to gate twenty-three for boarding, which will begin in approximately fifteen minutes.", scene: "旅行", difficulty: "困难" },
  { id: "l25", text: "I'd like to declare these items for customs inspection.", scene: "旅行", difficulty: "中等" },
  // 购物消费 5句
  { id: "l26", text: "Excuse me, could you tell me where I can find the electronics department?", scene: "购物", difficulty: "简单" },
  { id: "l27", text: "This item is currently on sale for twenty percent off the original price.", scene: "购物", difficulty: "中等" },
  { id: "l28", text: "Would you like to pay with cash, credit card, or mobile payment?", scene: "购物", difficulty: "简单" },
  { id: "l29", text: "I'm sorry, but we don't accept returns on clearance items without a valid receipt.", scene: "购物", difficulty: "困难" },
  { id: "l30", text: "The warranty covers manufacturing defects for a period of one year from the date of purchase.", scene: "购物", difficulty: "困难" },
  // 新闻场景 10句（简单3句、中等4句、困难3句）
  { id: "l31", text: "The president will visit three countries in Asia next month.", scene: "新闻", difficulty: "简单" },
  { id: "l32", text: "A new park will be built in the center of the city next year.", scene: "新闻", difficulty: "简单" },
  { id: "l33", text: "The weather forecast says it will rain heavily this weekend.", scene: "新闻", difficulty: "简单" },
  { id: "l34", text: "The stock market experienced a significant decline due to rising inflation concerns.", scene: "新闻", difficulty: "中等" },
  { id: "l35", text: "The government announced a new policy to promote renewable energy development.", scene: "新闻", difficulty: "中等" },
  { id: "l36", text: "Scientists have discovered a potential breakthrough in cancer treatment research.", scene: "新闻", difficulty: "中等" },
  { id: "l37", text: "The international trade agreement is expected to boost economic growth in both regions.", scene: "新闻", difficulty: "中等" },
  { id: "l38", text: "The United Nations Security Council convened an emergency session to address escalating tensions in the region.", scene: "新闻", difficulty: "困难" },
  { id: "l39", text: "Despite ongoing diplomatic efforts, negotiations between the two nations have reached a stalemate over territorial disputes.", scene: "新闻", difficulty: "困难" },
  { id: "l40", text: "The central bank's unprecedented intervention in the currency market has raised concerns among economists about long-term stability.", scene: "新闻", difficulty: "困难" },
  // 面试场景 10句（简单3句、中等4句、困难3句）
  { id: "l41", text: "My name is Li Ming and I graduated from Beijing University.", scene: "面试", difficulty: "简单" },
  { id: "l42", text: "I have three years of experience in software development.", scene: "面试", difficulty: "简单" },
  { id: "l43", text: "I enjoy working in a team and I'm a fast learner.", scene: "面试", difficulty: "简单" },
  { id: "l44", text: "Could you describe a challenging situation you faced at work and how you resolved it?", scene: "面试", difficulty: "中等" },
  { id: "l45", text: "In my previous role, I was responsible for managing a team of ten people and overseeing multiple projects simultaneously.", scene: "面试", difficulty: "中等" },
  { id: "l46", text: "What interests you most about this position and why do you think you are a good fit for our company?", scene: "面试", difficulty: "中等" },
  { id: "l47", text: "I'm particularly drawn to your company's innovative culture and the opportunity to contribute to meaningful projects that make a difference.", scene: "面试", difficulty: "中等" },
  { id: "l48", text: "How would you approach a situation where you have conflicting priorities from two different stakeholders?", scene: "面试", difficulty: "困难" },
  { id: "l49", text: "Describe a time when you had to make a critical decision with incomplete information under significant time pressure.", scene: "面试", difficulty: "困难" },
  { id: "l50", text: "If you were tasked with restructuring the department to improve efficiency, what framework would you use and how would you mitigate resistance to change?", scene: "面试", difficulty: "困难" }
];

/* ════════════════════════════════════════════════════════════════════
 * localStorage 读写辅助
 * ════════════════════════════════════════════════════════════════════ */

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("localStorage 写入失败", key, e);
  }
}

function readUserItems() {
  return readLS(userItemsKey, {});
}

function saveUserItems() {
  saveLS(userItemsKey, userItems);
}

function readDailyLogs() {
  return readLS(dailyLogsKey, []);
}

function saveDailyLogs() {
  saveLS(dailyLogsKey, dailyLogs);
}

function saveChatHistory() {
  // 对话历史最多保留 50 条
  if (chatHistory.length > 50) chatHistory = chatHistory.slice(-50);
  saveLS(K.chatHistory, chatHistory);
}

function saveNotes() { saveLS(K.notes, notes); }
function saveOkrs() { saveLS(K.okrs, okrs); }
function saveVocab() { saveLS(K.vocab, vocabStore); }
function saveBooks() { saveLS(K.books, books); }
function saveWater() { saveLS(K.water, waterStore); }
function saveDiet() { saveLS(K.diet, dietStore); }
function saveExercise() { saveLS(K.exercise, exerciseStore); }
function saveSleep() { saveLS(K.sleep, sleepStore); }
function saveHabits() { saveLS(K.habits, habitStore); }
function saveStudyPlan() { saveLS(K.studyPlan, studyPlanStore); }
function saveMistakes() { saveLS(K.mistakes, mistakeStore); }
function saveSpeaking() { saveLS(K.speaking, speakingStore); }

/* ════════════════════════════════════════════════════════════════════
 * DOM 元素绑定（els）
 * 绑定 index.html 中所有带 ID 的元素，统一安全检查
 * ════════════════════════════════════════════════════════════════════ */

const els = {
  // 侧边栏
  nav: document.querySelector("#sidebarNav"),
  recycleBadge: document.querySelector("#recycleBadge"),

  // 顶部栏
  moduleTitle: document.querySelector("#moduleTitle"),
  moduleIntro: document.querySelector("#moduleIntro"),
  collectInspirationBtn: document.querySelector("#collectInspirationBtn"),
  aiAssistantBtn: document.querySelector("#aiAssistantBtn"),
  copyPromptBtn: document.querySelector("#copyPromptBtn"),
  exportDataBtn: document.querySelector("#exportDataBtn"),
  importDataBtn: document.querySelector("#importDataBtn"),
  importDataInput: document.querySelector("#importDataInput"),
  newItemBtn: document.querySelector("#newItemBtn"),

  // 指标行
  totalCount: document.querySelector("#totalCount"),
  activeCount: document.querySelector("#activeCount"),
  aiCount: document.querySelector("#aiCount"),

  // 工具栏
  subTabs: document.querySelector("#subTabs"),
  newContentDraftBtn: document.querySelector("#newContentDraftBtn"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  statusFilters: document.querySelector("#statusFilters"),
  categoryFilters: document.querySelector("#categoryFilters"),
  audienceFilters: document.querySelector("#audienceFilters"),

  // 专用面板
  dashboardPanel: document.querySelector("#dashboardPanel"),
  kanbanView: document.querySelector("#kanbanView"),
  aiChatPanel: document.querySelector("#aiChatPanel"),
  pomodoroPanel: document.querySelector("#pomodoroPanel"),
  notesPanel: document.querySelector("#notesPanel"),
  okrPanel: document.querySelector("#okrPanel"),
  vocabPanel: document.querySelector("#vocabPanel"),
  shadowingPanel: document.querySelector("#shadowingPanel"),
  listeningPanel: document.querySelector("#listeningPanel"),
  bookshelfPanel: document.querySelector("#bookshelfPanel"),
  waterPanel: document.querySelector("#waterPanel"),
  dietPanel: document.querySelector("#dietPanel"),
  healthDashboardPanel: document.querySelector("#healthDashboardPanel"),
  exercisePanel: document.querySelector("#exercisePanel"),
  sleepPanel: document.querySelector("#sleepPanel"),
  habitPanel: document.querySelector("#habitPanel"),
  healthRecommendPanel: document.querySelector("#healthRecommendPanel"),
  pmGeneratePanel: document.querySelector("#pmGeneratePanel"),
  dailyLogPanel: document.querySelector("#dailyLogPanel"),
  studyPlanPanel: document.querySelector("#studyPlanPanel"),
  mistakeBookPanel: document.querySelector("#mistakeBookPanel"),
  grammarPanel: document.querySelector("#grammarPanel"),
  speakingPanel: document.querySelector("#speakingPanel"),
  contentArea: document.querySelector("#contentArea"),
  filterPanel: document.querySelector("#filterPanel"),
  skillsPanel: document.querySelector("#skillsPanel"),
  aiModelsPanel: document.querySelector("#aiModelsPanel"),

  // 仪表盘元素
  dashTodoCount: document.querySelector("#dashTodoCount"),
  dashStudyHours: document.querySelector("#dashStudyHours"),
  dashWaterCount: document.querySelector("#dashWaterCount"),
  dashAiCount: document.querySelector("#dashAiCount"),
  dashPomodoroCount: document.querySelector("#dashPomodoroCount"),
  dashGoalRing: document.querySelector("#dashGoalRing"),
  dashGoalPercent: document.querySelector("#dashGoalPercent"),
  dashTimeline: document.querySelector("#dashTimeline"),

  // 看板元素
  kanbanTodo: document.querySelector("#kanbanTodo"),
  kanbanDoing: document.querySelector("#kanbanDoing"),
  kanbanDone: document.querySelector("#kanbanDone"),
  kanbanArchived: document.querySelector("#kanbanArchived"),
  kanbanTodoCount: document.querySelector("#kanbanTodoCount"),
  kanbanDoingCount: document.querySelector("#kanbanDoingCount"),
  kanbanDoneCount: document.querySelector("#kanbanDoneCount"),
  kanbanArchivedCount: document.querySelector("#kanbanArchivedCount"),

  // AI 对话元素
  newChatBtn: document.querySelector("#newChatBtn"),
  chatHistoryList: document.querySelector("#chatHistoryList"),
  chatMessages: document.querySelector("#chatMessages"),
  chatModelSelect: document.querySelector("#chatModelSelect"),
  chatInput: document.querySelector("#chatInput"),
  chatSendBtn: document.querySelector("#chatSendBtn"),

  // 番茄钟元素
  pomodoroRing: document.querySelector("#pomodoroRing"),
  pomodoroDisplay: document.querySelector("#pomodoroDisplay"),
  pomodoroPhaseLabel: document.querySelector("#pomodoroPhaseLabel"),
  pomodoroStartBtn: document.querySelector("#pomodoroStartBtn"),
  pomodoroPauseBtn: document.querySelector("#pomodoroPauseBtn"),
  pomodoroResetBtn: document.querySelector("#pomodoroResetBtn"),
  pomodoroTaskSelect: document.querySelector("#pomodoroTaskSelect"),
  pomodoroSessionCount: document.querySelector("#pomodoroSessionCount"),
  pomodoroTotalMinutes: document.querySelector("#pomodoroTotalMinutes"),
  pomodoroNoiseBtn: document.querySelector("#pomodoroNoiseBtn"),

  // 笔记元素
  notesList: document.querySelector("#notesList"),
  noteEditor: document.querySelector("#noteEditor"),
  noteEditorTitle: document.querySelector("#noteEditorTitle"),
  noteEditorTags: document.querySelector("#noteEditorTags"),
  noteEditorBody: document.querySelector("#noteEditorBody"),
  noteEditorPara: document.querySelector("#noteEditorPara"),
  notePreviewPane: document.querySelector("#notePreviewPane"),
  saveNoteBtn: document.querySelector("#saveNoteBtn"),
  previewNoteBtn: document.querySelector("#previewNoteBtn"),
  // v10.3 PARA 增强
  notesSearchInput: document.querySelector("#notesSearchInput"),
  newNoteBtn: document.querySelector("#newNoteBtn"),
  aiNoteBtn: document.querySelector("#aiNoteBtn"),
  aiClassifyBtn: document.querySelector("#aiClassifyBtn"),
  aiSummarizeBtn: document.querySelector("#aiSummarizeBtn"),
  deleteNoteBtn: document.querySelector("#deleteNoteBtn"),
  notesAiResult: document.querySelector("#notesAiResult"),
  notesAiContent: document.querySelector("#notesAiContent"),
  notesAiCloseBtn: document.querySelector("#notesAiCloseBtn"),
  notesTraeBridge: document.querySelector("#notesTraeBridge"),
  notesTraePrompt: document.querySelector("#notesTraePrompt"),
  notesTraeCopyBtn: document.querySelector("#notesTraeCopyBtn"),
  notesTraeImport: document.querySelector("#notesTraeImport"),
  notesTraeImportBtn: document.querySelector("#notesTraeImportBtn"),
  paraInfoText: document.querySelector("#paraInfoText"),
  paraStats: document.querySelector("#paraStats"),

  // OKR 元素
  newOkrBtn: document.querySelector("#newOkrBtn"),
  okrList: document.querySelector("#okrList"),
  badgeGrid: document.querySelector("#badgeGrid"),
  okrStatsBoard: document.querySelector("#okrStatsBoard"),
  okrStatTotal: document.querySelector("#okrStatTotal"),
  okrStatActive: document.querySelector("#okrStatActive"),
  okrStatDone: document.querySelector("#okrStatDone"),
  okrStatAvg: document.querySelector("#okrStatAvg"),
  okrAiBreakdownBtn: document.querySelector("#okrAiBreakdownBtn"),
  okrAiPanel: document.querySelector("#okrAiPanel"),
  okrAiInput: document.querySelector("#okrAiInput"),
  okrAiGenerateBtn: document.querySelector("#okrAiGenerateBtn"),
  okrAiResult: document.querySelector("#okrAiResult"),

  // 背单词元素
  vocabCard: document.querySelector("#vocabCard"),
  vocabWord: document.querySelector("#vocabWord"),
  vocabPhonetic: document.querySelector("#vocabPhonetic"),
  vocabWordBack: document.querySelector("#vocabWordBack"),
  vocabPhoneticBack: document.querySelector("#vocabPhoneticBack"),
  vocabMeaning: document.querySelector("#vocabMeaning"),
  vocabExample: document.querySelector("#vocabExample"),
  vocabRoot: document.querySelector("#vocabRoot"),
  vocabFlipBtn: document.querySelector("#vocabFlipBtn"),
  vocabPlayBtn: document.querySelector("#vocabPlayBtn"),
  vocabNewCount: document.querySelector("#vocabNewCount"),
  vocabReviewCount: document.querySelector("#vocabReviewCount"),
  vocabTotalCount: document.querySelector("#vocabTotalCount"),

  // 影子跟读元素
  shadowingSentence: document.querySelector("#shadowingSentence"),
  shadowingPlayBtn: document.querySelector("#shadowingPlayBtn"),
  shadowingRecordBtn: document.querySelector("#shadowingRecordBtn"),
  scoreAccuracy: document.querySelector("#scoreAccuracy"),
  scoreFluency: document.querySelector("#scoreFluency"),
  scoreRhythm: document.querySelector("#scoreRhythm"),
  scoreAccuracyVal: document.querySelector("#scoreAccuracyVal"),
  scoreFluencyVal: document.querySelector("#scoreFluencyVal"),
  scoreRhythmVal: document.querySelector("#scoreRhythmVal"),

  // 听力元素
  listeningSearchInput: document.querySelector("#listeningSearchInput"),
  dictationSentence: document.querySelector("#dictationSentence"),
  dictationInput: document.querySelector("#dictationInput"),
  dictationPlayBtn: document.querySelector("#dictationPlayBtn"),
  dictationCheckBtn: document.querySelector("#dictationCheckBtn"),
  dictationNextBtn: document.querySelector("#dictationNextBtn"),
  dictationResult: document.querySelector("#dictationResult"),

  // 场景词库元素
  sceneVocabPanel: document.querySelector("#sceneVocabPanel"),
  sceneVocabCardArea: document.querySelector("#sceneVocabCardArea"),
  sceneVocabTitle: document.querySelector("#sceneVocabTitle"),
  sceneVocabDesc: document.querySelector("#sceneVocabDesc"),
  sceneVocabStats: document.querySelector("#sceneVocabStats"),
  sceneVocabCounter: document.querySelector("#sceneVocabCounter"),
  sceneVocabProgress: document.querySelector("#sceneVocabProgress"),

  // 学习计划元素
  planOverview: document.querySelector("#planOverview"),
  planTodayList: document.querySelector("#planTodayList"),
  planWeekGrid: document.querySelector("#planWeekGrid"),

  // 错题本元素
  mistakeStats: document.querySelector("#mistakeStats"),
  mistakeList: document.querySelector("#mistakeList"),
  mistakeCounter: document.querySelector("#mistakeCounter"),
  mistakeDialog: document.querySelector("#mistakeDialog"),
  mistakeDialogTitle: document.querySelector("#mistakeDialogTitle"),
  mistakeType: document.querySelector("#mistakeType"),
  mistakeQuestion: document.querySelector("#mistakeQuestion"),
  mistakeAnswer: document.querySelector("#mistakeAnswer"),
  mistakeNote: document.querySelector("#mistakeNote"),
  mistakeTag: document.querySelector("#mistakeTag"),

  // 语法练习元素
  grammarTopics: document.querySelector("#grammarTopics"),
  grammarExercise: document.querySelector("#grammarExercise"),

  // 口语测评元素
  speakingPrompt: document.querySelector("#speakingPrompt"),
  speakingResult: document.querySelector("#speakingResult"),
  speakingHistoryList: document.querySelector("#speakingHistoryList"),

  // 书架元素
  bookshelfContent: document.querySelector("#bookshelfContent"),
  bookshelfStatsBar: document.querySelector("#bookshelfStatsBar"),
  readingGoalBar: document.querySelector("#readingGoalBar"),
  bookNoteDialog: document.querySelector("#bookNoteDialog"),
  bookNoteTitle: document.querySelector("#bookNoteTitle"),
  bookNoteInfo: document.querySelector("#bookNoteInfo"),
  bookNoteType: document.querySelector("#bookNoteType"),
  bookNotePage: document.querySelector("#bookNotePage"),
  bookNoteContent: document.querySelector("#bookNoteContent"),
  bookEditRating: document.querySelector("#bookEditRating"),
  bookEditTags: document.querySelector("#bookEditTags"),
  bookshelfTagFilter: document.querySelector("#bookshelfTagFilter"),
  bookshelfSortBy: document.querySelector("#bookshelfSortBy"),
  bookDetailDialog: document.querySelector("#bookDetailDialog"),
  bookDetailTitle: document.querySelector("#bookDetailTitle"),
  bookDetailBody: document.querySelector("#bookDetailBody"),
  bookReviewDialog: document.querySelector("#bookReviewDialog"),
  bookReviewTitle: document.querySelector("#bookReviewTitle"),
  bookReviewInfo: document.querySelector("#bookReviewInfo"),
  bookReviewRating: document.querySelector("#bookReviewRating"),
  bookReviewSummary: document.querySelector("#bookReviewSummary"),
  bookReviewContent: document.querySelector("#bookReviewContent"),
  readingTimerDialog: document.querySelector("#readingTimerDialog"),
  readingTimerInfo: document.querySelector("#readingTimerInfo"),
  readingTimerDisplay: document.querySelector("#readingTimerDisplay"),
  readingTimerPage: document.querySelector("#readingTimerPage"),
  readingTimerStartBtn: document.querySelector("#readingTimerStartBtn"),
  readingTimerPauseBtn: document.querySelector("#readingTimerPauseBtn"),
  readingTimerStopBtn: document.querySelector("#readingTimerStopBtn"),

  // 饮水元素
  waterRing: document.querySelector("#waterRing"),
  waterCurrent: document.querySelector("#waterCurrent"),
  waterGoalText: document.querySelector("#waterGoalText"),
  waterRecord: document.querySelector("#waterRecord"),
  waterGoalInput: document.querySelector("#waterGoalInput"),
  waterGoalSaveBtn: document.querySelector("#waterGoalSaveBtn"),

  // 饮食元素
  dietUploadBtn: document.querySelector("#dietUploadBtn"),
  dietFileInput: document.querySelector("#dietFileInput"),
  dietResult: document.querySelector("#dietResult"),
  dietRecord: document.querySelector("#dietRecord"),
  calorieTotal: document.querySelector("#calorieTotal"),
  calorieProtein: document.querySelector("#calorieProtein"),
  calorieCarbs: document.querySelector("#calorieCarbs"),
  calorieFat: document.querySelector("#calorieFat"),

  // Toast
  toast: document.querySelector("#toast"),

  // 新建卡片对话框
  dialog: document.querySelector("#newItemDialog"),
  saveNewItem: document.querySelector("#saveNewItem"),
  newTitle: document.querySelector("#newTitle"),
  newSummary: document.querySelector("#newSummary"),

  // 编辑卡片对话框
  editDialog: document.querySelector("#editItemDialog"),
  editTitle: document.querySelector("#editTitle"),
  editSummary: document.querySelector("#editSummary"),
  editStatus: document.querySelector("#editStatus"),
  editCategory: document.querySelector("#editCategory"),
  editAudience: document.querySelector("#editAudience"),
  editTags: document.querySelector("#editTags"),
  saveEditItem: document.querySelector("#saveEditItem"),

  // 今日工作记录对话框
  dailyLogDialog: document.querySelector("#dailyLogDialog"),
  dailyLogHistoryDialog: document.querySelector("#dailyLogHistoryDialog"),
  dailyLogDate: document.querySelector("#dailyLogDate"),
  dailyLogTheme: document.querySelector("#dailyLogTheme"),
  dailyLogEnergy: document.querySelector("#dailyLogEnergy"),
  dailyLogOutputs: document.querySelector("#dailyLogOutputs"),
  dailyLogProgress: document.querySelector("#dailyLogProgress"),
  dailyLogBlocks: document.querySelector("#dailyLogBlocks"),
  dailyLogLearnings: document.querySelector("#dailyLogLearnings"),
  dailyLogTomorrow: document.querySelector("#dailyLogTomorrow"),
  dailyLogReview: document.querySelector("#dailyLogReview"),
  saveDailyLogBtn: document.querySelector("#saveDailyLogBtn"),
  dailyLogHistoryList: document.querySelector("#dailyLogHistoryList"),

  // 今日记录分析对话框
  dailyAnalysisDialog: document.querySelector("#dailyAnalysisDialog"),
  dailyAnalysisProvider: document.querySelector("#dailyAnalysisProvider"),
  analyzeDailyLogBtn: document.querySelector("#analyzeDailyLogBtn"),
  copyDailyAnalysisToTraeBtn: document.querySelector("#copyDailyAnalysisToTraeBtn"),
  closeDailyAnalysisBtn: document.querySelector("#closeDailyAnalysisBtn"),
  dailyAnalysisStatus: document.querySelector("#dailyAnalysisStatus"),
  dailyAnalysisResult: document.querySelector("#dailyAnalysisResult"),
  traeDailyAnalysisInput: document.querySelector("#traeDailyAnalysisInput"),
  importTraeDailyAnalysisBtn: document.querySelector("#importTraeDailyAnalysisBtn"),

  // 写作室对话框
  contentDraftDialog: document.querySelector("#contentDraftDialog"),
  closeContentDraftBtn: document.querySelector("#closeContentDraftBtn"),
  draftPlatform: document.querySelector("#draftPlatform"),
  draftCollection: document.querySelector("#draftCollection"),
  draftType: document.querySelector("#draftType"),
  draftAudience: document.querySelector("#draftAudience"),
  draftStatus: document.querySelector("#draftStatus"),
  draftPublishTime: document.querySelector("#draftPublishTime"),
  draftTitle: document.querySelector("#draftTitle"),
  draftAltTitles: document.querySelector("#draftAltTitles"),
  draftBody: document.querySelector("#draftBody"),
  draftCoverTitle: document.querySelector("#draftCoverTitle"),
  draftCoverSubtitle: document.querySelector("#draftCoverSubtitle"),
  draftTags: document.querySelector("#draftTags"),
  draftWordCount: document.querySelector("#draftWordCount"),
  draftPlatformAdvice: document.querySelector("#draftPlatformAdvice"),
  draftProviderSelect: document.querySelector("#draftProviderSelect"),
  draftAiStatus: document.querySelector("#draftAiStatus"),
  draftMarkdownPreview: document.querySelector("#draftMarkdownPreview"),
  copyDraftToTraeBtn: document.querySelector("#copyDraftToTraeBtn"),
  traeDraftInput: document.querySelector("#traeDraftInput"),
  importDraftFromTraeBtn: document.querySelector("#importDraftFromTraeBtn"),
  resetContentDraftBtn: document.querySelector("#resetContentDraftBtn"),
  saveContentDraftBtn: document.querySelector("#saveContentDraftBtn"),

  // 灵感收件箱抽屉
  inspirationDrawer: document.querySelector("#inspirationDrawer"),
  inspirationBackdrop: document.querySelector("#inspirationBackdrop"),
  closeInspirationDrawerBtn: document.querySelector("#closeInspirationDrawerBtn"),
  inspirationSourceType: document.querySelector("#inspirationSourceType"),
  inspirationProviderSelect: document.querySelector("#inspirationProviderSelect"),
  inspirationLinkInput: document.querySelector("#inspirationLinkInput"),
  inspirationTextInput: document.querySelector("#inspirationTextInput"),
  inspirationFileInput: document.querySelector("#inspirationFileInput"),
  inspirationFileList: document.querySelector("#inspirationFileList"),
  analyzeInspirationBtn: document.querySelector("#analyzeInspirationBtn"),
  copyInspirationToTraeBtn: document.querySelector("#copyInspirationToTraeBtn"),
  clearInspirationBtn: document.querySelector("#clearInspirationBtn"),
  inspirationStatus: document.querySelector("#inspirationStatus"),
  inspirationResult: document.querySelector("#inspirationResult"),
  archiveRecommendations: document.querySelector("#archiveRecommendations"),
  nextActionList: document.querySelector("#nextActionList"),
  traeInspirationInput: document.querySelector("#traeInspirationInput"),
  importTraeInspirationBtn: document.querySelector("#importTraeInspirationBtn"),

  // AI 助手抽屉
  aiDrawer: document.querySelector("#aiDrawer"),
  aiBackdrop: document.querySelector("#aiBackdrop"),
  closeAiDrawerBtn: document.querySelector("#closeAiDrawerBtn"),
  aiInput: document.querySelector("#aiPromptInput"),
  runAiBtn: document.querySelector("#runAiBtn"),
  aiProviderSelect: document.querySelector("#aiProviderSelect"),
  aiSaveModuleSelect: document.querySelector("#aiSaveModuleSelect"),
  aiStatus: document.querySelector("#aiStatus"),
  matchedSkills: document.querySelector("#matchedSkills"),
  aiResult: document.querySelector("#aiResult"),
  saveAiResultBtn: document.querySelector("#saveAiResultBtn"),
  copyAiResultBtn: document.querySelector("#copyAiResultBtn"),
  copyAiToTraeBtn: document.querySelector("#copyAiToTraeBtn"),
  traeAiInput: document.querySelector("#traeAiInput"),
  importTraeAiBtn: document.querySelector("#importTraeAiBtn"),
  searchSkillBtn: document.querySelector("#searchSkillBtn"),
  communitySkills: document.querySelector("#communitySkills"),

  // 番茄钟设置对话框
  pomodoroDialog: document.querySelector("#pomodoroDialog"),
  pomodoroSetFocus: document.querySelector("#pomodoroSetFocus"),
  pomodoroSetBreak: document.querySelector("#pomodoroSetBreak"),
  pomodoroSetTask: document.querySelector("#pomodoroSetTask"),
  savePomodoroSettings: document.querySelector("#savePomodoroSettings"),

  // 单词编辑对话框
  vocabDialog: document.querySelector("#vocabDialog"),
  vocabEditWord: document.querySelector("#vocabEditWord"),
  vocabEditPhonetic: document.querySelector("#vocabEditPhonetic"),
  vocabEditMeaning: document.querySelector("#vocabEditMeaning"),
  vocabEditExample: document.querySelector("#vocabEditExample"),
  vocabEditRoot: document.querySelector("#vocabEditRoot"),
  vocabEditScene: document.querySelector("#vocabEditScene"),
  saveVocabEdit: document.querySelector("#saveVocabEdit"),

  // 书籍对话框
  bookDialog: document.querySelector("#bookDialog"),
  bookEditTitle: document.querySelector("#bookEditTitle"),
  bookEditAuthor: document.querySelector("#bookEditAuthor"),
  bookEditStatus: document.querySelector("#bookEditStatus"),
  bookEditTotalPages: document.querySelector("#bookEditTotalPages"),
  bookEditCurrentPage: document.querySelector("#bookEditCurrentPage"),
  saveBookEdit: document.querySelector("#saveBookEdit"),

  // OKR 对话框
  okrDialog: document.querySelector("#okrDialog"),
  okrEditObjective: document.querySelector("#okrEditObjective"),
  okrEditKr1: document.querySelector("#okrEditKr1"),
  okrEditKr2: document.querySelector("#okrEditKr2"),
  okrEditKr3: document.querySelector("#okrEditKr3"),
  okrEditConfidence: document.querySelector("#okrEditConfidence"),
  okrEditCycle: document.querySelector("#okrEditCycle"),
  saveOkrEdit: document.querySelector("#saveOkrEdit"),

  // 笔记对话框
  noteDialog: document.querySelector("#noteDialog"),
  noteDialogTitle: document.querySelector("#noteDialogTitle"),
  noteDialogPara: document.querySelector("#noteDialogPara"),
  noteDialogTags: document.querySelector("#noteDialogTags"),
  noteDialogBody: document.querySelector("#noteDialogBody"),
  saveNoteDialog: document.querySelector("#saveNoteDialog"),

  // 对话历史管理对话框
  aiChatHistoryDialog: document.querySelector("#aiChatHistoryDialog"),
  chatHistoryManageList: document.querySelector("#chatHistoryManageList"),
  clearAllChatHistoryBtn: document.querySelector("#clearAllChatHistoryBtn")
};

/* ════════════════════════════════════════════════════════════════════
 * 通用工具函数
 * ════════════════════════════════════════════════════════════════════ */

function safeBind(element, eventName, handler) {
  if (!element) return;
  element.addEventListener(eventName, handler);
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function uid(prefix) {
  return (prefix || "id") + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  if (!ok) throw new Error("复制失败");
}

function showToast(msg) {
  if (!els.toast) return;
  els.toast.textContent = msg;
  els.toast.style.zIndex = "9999";
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 1800);
  setAiStatus(msg);
}

function setAiStatus(msg) {
  if (els.aiStatus) els.aiStatus.textContent = msg;
}

function getModule(moduleId) {
  const id = moduleId || state.moduleId;
  return data.modules.find((m) => m.id === id) || data.modules[0];
}

function getModuleItems(module) {
  if (!module) module = getModule();
  if (module.id === "all") {
    return data.modules
      .filter((m) => m.id !== "all")
      .flatMap((m) => [...(m.items || []), ...(userItems[m.id] || [])]);
  }
  return [...(module.items || []), ...(userItems[module.id] || [])];
}

function parseTraeJson(text) {
  const match = String(text).match(/\{[\s\S]*\}/);
  if (!match) throw new Error("未找到 JSON");
  return JSON.parse(match[0]);
}

function splitTags(value) {
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean);
  return String(value || "").split(/[,，#\s]+/).map((tag) => tag.trim()).filter(Boolean);
}

/* ════════════════════════════════════════════════════════════════════
 * 初始化与事件绑定
 * ════════════════════════════════════════════════════════════════════ */

function init() {
  cleanupUserItems();
  ensureVocabDefaults();
  renderNav();
  bindEvents();
  bindGlobalButtonFallback();
  render();
  loadProviders();
  renderChatMessages();
  renderPomodoro();
  initPwa();
}

/* ─── PWA 安装与离线检测 ─── */
let pwaInstallPrompt = null;
function initPwa() {
  // 监听 beforeinstallprompt 事件
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    pwaInstallPrompt = e;
    const banner = document.getElementById("pwaInstallBanner");
    if (banner && !localStorage.getItem("olivia-pwa-dismissed")) {
      banner.style.display = "flex";
    }
  });

  // 安装按钮
  const installBtn = document.getElementById("pwaInstallBtn");
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!pwaInstallPrompt) return;
      pwaInstallPrompt.prompt();
      const { outcome } = await pwaInstallPrompt.userChoice;
      if (outcome === "accepted") {
        showToast("已添加到主屏幕");
        document.getElementById("pwaInstallBanner").style.display = "none";
      }
      pwaInstallPrompt = null;
    });
  }

  // 稍后按钮
  const dismissBtn = document.getElementById("pwaInstallDismiss");
  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      document.getElementById("pwaInstallBanner").style.display = "none";
      localStorage.setItem("olivia-pwa-dismissed", Date.now().toString());
    });
  }

  // 离线/在线检测
  const offlineBadge = document.createElement("div");
  offlineBadge.className = "offline-badge";
  offlineBadge.textContent = "📡 离线模式";
  document.body.appendChild(offlineBadge);

  function updateOnlineStatus() {
    if (!navigator.onLine) {
      offlineBadge.classList.add("show");
      showToast("当前处于离线模式，部分功能可能受限");
    } else {
      offlineBadge.classList.remove("show");
    }
  }
  window.addEventListener("online", () => { updateOnlineStatus(); showToast("已恢复网络连接"); });
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();

  // 恢复外观偏好
  applyAppearancePrefs();
}

/* ════════════════════════════════════════════════════════════════════
 * v10.6 设置模块
 * ════════════════════════════════════════════════════════════════════ */

const SETTINGS_KEY = "olivia-work-platform-settings";

function getSettings() {
  return readLS(SETTINGS_KEY, {
    theme: "light",
    fontSize: "normal",
    compactMode: false,
    defaultModel: "auto"
  });
}

function saveSettings(settings) {
  saveLS(SETTINGS_KEY, settings);
}

function openSettings() {
  const dialog = document.getElementById("settingsDialog");
  if (!dialog) return;
  dialog.showModal();
  loadSettingsModels();
  loadSettingsAppearance();
  loadSettingsCache();
  bindSettingsEvents();
}

function bindSettingsEvents() {
  // Tab 切换
  document.querySelectorAll(".settings-tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".settings-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.settingsTab;
      document.querySelectorAll(".settings-panel").forEach((p) => { p.style.display = "none"; });
      const panel = document.getElementById("settings" + target.charAt(0).toUpperCase() + target.slice(1));
      if (panel) panel.style.display = "block";
    };
  });

  // 默认模型偏好
  const defaultModelSelect = document.getElementById("settingsDefaultModel");
  if (defaultModelSelect) {
    defaultModelSelect.onchange = () => {
      const s = getSettings();
      s.defaultModel = defaultModelSelect.value;
      saveSettings(s);
      state.aiProvider = s.defaultModel;
      showToast("默认模型已更新");
    };
  }

  // 主题切换
  document.querySelectorAll(".settings-theme-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".settings-theme-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const theme = btn.dataset.theme;
      const s = getSettings();
      s.theme = theme;
      saveSettings(s);
      applyAppearancePrefs();
      showToast(theme === "dark" ? "已切换深色模式" : "已切换浅色模式");
    };
  });

  // 字号
  const fontSizeSelect = document.getElementById("settingsFontSize");
  if (fontSizeSelect) {
    fontSizeSelect.onchange = () => {
      const s = getSettings();
      s.fontSize = fontSizeSelect.value;
      saveSettings(s);
      applyAppearancePrefs();
      showToast("字号已更新");
    };
  }

  // 紧凑模式
  const compactToggle = document.getElementById("settingsCompactMode");
  if (compactToggle) {
    compactToggle.onchange = () => {
      const s = getSettings();
      s.compactMode = compactToggle.checked;
      saveSettings(s);
      applyAppearancePrefs();
      showToast(compactToggle.checked ? "已开启紧凑模式" : "已关闭紧凑模式");
    };
  }

  // 导出数据
  const exportBtn = document.getElementById("settingsExportBtn");
  if (exportBtn) {
    exportBtn.onclick = () => {
      const allData = exportAllData();
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `olivia-work-backup-${todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("数据已导出");
    };
  }

  // 导入数据
  const importBtn = document.getElementById("settingsImportBtn");
  const importInput = document.getElementById("settingsImportInput");
  const importStatus = document.getElementById("settingsImportStatus");
  if (importBtn && importInput) {
    importBtn.onclick = () => importInput.click();
    importInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (importStatus) importStatus.textContent = "导入中...";
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          importAllData(imported);
          if (importStatus) importStatus.textContent = "✅ 导入成功";
          showToast("数据导入成功");
          render();
        } catch (err) {
          if (importStatus) importStatus.textContent = "❌ 导入失败：" + err.message;
          showToast("导入失败：文件格式错误");
        }
      };
      reader.readAsText(file);
    };
  }

  // 清空数据
  const clearBtn = document.getElementById("settingsClearBtn");
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (!window.confirm("⚠️ 确认清空所有本地数据？此操作不可恢复！\n\n建议先导出备份。")) return;
      if (!window.confirm("再次确认：真的要清空所有数据吗？")) return;
      Object.keys(K).forEach((key) => {
        localStorage.removeItem(K[key]);
      });
      localStorage.removeItem(SETTINGS_KEY);
      showToast("所有数据已清空，即将刷新...");
      setTimeout(() => location.reload(), 1500);
    };
  }

  // 清除缓存
  const clearCacheBtn = document.getElementById("settingsClearCacheBtn");
  if (clearCacheBtn) {
    clearCacheBtn.onclick = async () => {
      if (!window.confirm("确认清除离线缓存？下次访问时会重新缓存。")) return;
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      showToast("离线缓存已清除，即将刷新...");
      setTimeout(() => location.reload(), 1500);
    };
  }
}

async function loadSettingsModels() {
  const listDiv = document.getElementById("settingsModelList");
  if (!listDiv) return;
  try {
    const res = await fetch("/api/providers");
    const providers = await res.json();
    if (!Array.isArray(providers) || !providers.length) {
      listDiv.innerHTML = '<div class="empty"><p>无法获取模型列表</p></div>';
      return;
    }
    const sourceLabel = { platform: "平台级", user: "用户级", bridge: "桥接", none: "未配置" };
    listDiv.innerHTML = providers.map((p) => `
      <div class="settings-model-item">
        <div class="settings-model-info">
          <span class="settings-model-name">${esc(p.name)}</span>
          <span class="settings-model-model">${esc(p.model)}</span>
        </div>
        <span class="settings-model-badge ${p.source}">${sourceLabel[p.source] || p.source}</span>
      </div>
    `).join("");
  } catch (err) {
    listDiv.innerHTML = `<div class="empty"><p>加载失败：${esc(err.message)}</p></div>`;
  }

  // 恢复默认模型选择
  const s = getSettings();
  const select = document.getElementById("settingsDefaultModel");
  if (select) select.value = s.defaultModel || "auto";
}

function loadSettingsAppearance() {
  const s = getSettings();
  // 主题
  document.querySelectorAll(".settings-theme-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === s.theme);
  });
  // 字号
  const fontSizeSelect = document.getElementById("settingsFontSize");
  if (fontSizeSelect) fontSizeSelect.value = s.fontSize || "normal";
  // 紧凑模式
  const compactToggle = document.getElementById("settingsCompactMode");
  if (compactToggle) compactToggle.checked = !!s.compactMode;
}

function applyAppearancePrefs() {
  const s = getSettings();
  // 主题
  document.body.classList.toggle("theme-dark", s.theme === "dark");
  // 字号
  document.body.classList.remove("font-small", "font-normal", "font-large");
  document.body.classList.add("font-" + (s.fontSize || "normal"));
  // 紧凑模式
  document.body.classList.toggle("compact-mode", !!s.compactMode);
}

async function loadSettingsCache() {
  // SW 缓存状态
  const cacheStatus = document.getElementById("settingsCacheStatus");
  if (cacheStatus) {
    if ("serviceWorker" in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        cacheStatus.textContent = regs.length > 0 ? "✅ 已启用" : "❌ 未启用";
        cacheStatus.style.color = regs.length > 0 ? "var(--green-dark)" : "var(--pink)";
      } catch {
        cacheStatus.textContent = "❓ 未知";
      }
    } else {
      cacheStatus.textContent = "❌ 浏览器不支持";
      cacheStatus.style.color = "var(--pink)";
    }
  }

  // localStorage 大小
  const lsSize = document.getElementById("settingsLsSize");
  if (lsSize) {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length;
      }
    }
    const kb = (total / 1024).toFixed(1);
    lsSize.textContent = kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(2)} MB`;
  }
}

function exportAllData() {
  return {
    version: "10.6",
    exportDate: new Date().toISOString(),
    userItems,
    dailyLogs,
    chatHistory,
    notes,
    okrs,
    vocabStore,
    books,
    waterStore,
    dietStore,
    exerciseStore,
    sleepStore,
    habitStore,
    studyPlanStore,
    mistakeStore,
    speakingStore,
    settings: getSettings()
  };
}

function importAllData(imported) {
  if (imported.userItems) {
    Object.keys(imported.userItems).forEach((modId) => {
      if (!userItems[modId]) userItems[modId] = [];
      imported.userItems[modId].forEach((item) => {
        if (!userItems[modId].some((i) => i.id === item.id)) {
          userItems[modId].push(item);
        }
      });
    });
    saveUserItems();
  }
  if (imported.dailyLogs) { Object.assign(dailyLogs, imported.dailyLogs); saveDailyLogs(); }
  if (imported.chatHistory) { chatHistory = [...imported.chatHistory, ...chatHistory]; saveLS(K.chatHistory, chatHistory); }
  if (imported.notes) { notes = [...imported.notes, ...notes]; saveLS(K.notes, notes); }
  if (imported.okrs) { okrs = [...imported.okrs, ...okrs]; saveLS(K.okrs, okrs); }
  if (imported.books) { books = [...imported.books, ...books]; saveLS(K.books, books); }
  if (imported.vocabStore) { vocabStore = { ...vocabStore, ...imported.vocabStore }; saveVocab(); }
  if (imported.waterStore) { waterStore = { ...waterStore, ...imported.waterStore }; saveLS(K.water, waterStore); }
  if (imported.dietStore) { dietStore = { ...dietStore, ...imported.dietStore }; saveLS(K.diet, dietStore); }
  if (imported.exerciseStore) { exerciseStore = { ...exerciseStore, ...imported.exerciseStore }; saveLS(K.exercise, exerciseStore); }
  if (imported.sleepStore) { sleepStore = { ...sleepStore, ...imported.sleepStore }; saveLS(K.sleep, sleepStore); }
  if (imported.habitStore) { habitStore = { ...habitStore, ...imported.habitStore }; saveLS(K.habits, habitStore); }
  if (imported.settings) { saveSettings(imported.settings); applyAppearancePrefs(); }
}

function ensureVocabDefaults() {
  if (!vocabStore.words) vocabStore.words = [];
  if (!vocabStore.review) vocabStore.review = { known: 0, unknown: 0, fuzzy: 0 };
  // 把预置单词合并进去（去重）
  Object.keys(DEFAULT_VOCAB).forEach((scene) => {
    DEFAULT_VOCAB[scene].forEach((word) => {
      if (!vocabStore.words.some((w) => w.word === word.word && w.scene === word.scene)) {
        vocabStore.words.push({ ...word });
      }
    });
  });
  saveVocab();
}

function bindEvents() {
  // 搜索与排序
  safeBind(els.searchInput, "input", (e) => {
    state.search = e.target.value.trim().toLowerCase();
    renderContent();
  });
  safeBind(els.sortSelect, "change", (e) => {
    state.sort = e.target.value;
    renderContent();
  });

  // 视图切换
  document.querySelectorAll(".view-switch button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-switch button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.view = btn.dataset.view;
      renderContent();
    });
  });

  // 底部导航（移动端）
  document.querySelectorAll("#bottomNav .bottom-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modId = btn.dataset.module;
      if (!modId) return;
      state.moduleId = modId;
      const mod = getModule(modId);
      state.tab = (mod.tabs && mod.tabs[0]) || "全部";
      state.view = "cards";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // 顶部按钮
  safeBind(els.copyPromptBtn, "click", async () => {
    const mod = getModule();
    const text = `${mod.prompt}\n\n当前模块：${mod.title}\n当前筛选：${state.tab} / ${state.status} / ${state.category} / ${state.audience}`;
    try { await copyText(text); showToast("同步指令已复制"); } catch { showToast("复制失败"); }
  });

  safeBind(els.newItemBtn, "click", () => {
    if (els.dialog) { els.dialog.showModal(); els.newTitle.focus(); }
  });

  safeBind(els.saveNewItem, "click", (e) => {
    e.preventDefault();
    const title = els.newTitle.value.trim();
    if (!title) { showToast("请先填写标题"); return; }
    const mod = getModule();
    if (!userItems[mod.id]) userItems[mod.id] = [];
    userItems[mod.id].unshift({
      title,
      summary: els.newSummary.value.trim() || "",
      status: "待办",
      category: (state.tab === "总览" || state.tab === "全部" || state.tab === "今日概览") ? "快速新增" : state.tab,
      audience: "自己",
      tags: ["手动新增", mod.title],
      date: "刚刚",
      heat: 60,
      ai: true,
      icon: "✨",
      color: "blue"
    });
    saveUserItems();
    els.newTitle.value = "";
    els.newSummary.value = "";
    els.dialog.close();
    showToast("已加入当前模块");
    render();
  });

  safeBind(els.saveEditItem, "click", (e) => { e.preventDefault(); saveEdit(); });
  safeBind(els.saveDailyLogBtn, "click", (e) => { e.preventDefault(); saveDailyLog(); });

  // 今日记录 AI 分析
  safeBind(els.analyzeDailyLogBtn, "click", analyzeDailyLog);
  safeBind(els.copyDailyAnalysisToTraeBtn, "click", copyDailyAnalysisToTrae);
  safeBind(els.importTraeDailyAnalysisBtn, "click", importTraeDailyAnalysisResult);
  safeBind(els.closeDailyAnalysisBtn, "click", closeDailyAnalysisDialog);

  // AI 助手抽屉
  safeBind(els.aiAssistantBtn, "click", openAiDrawer);
  safeBind(els.closeAiDrawerBtn, "click", closeAiDrawer);
  safeBind(els.aiBackdrop, "click", closeAiDrawer);
  safeBind(els.runAiBtn, "click", handleAiGenerate);
  safeBind(els.copyAiToTraeBtn, "click", copyAiPromptToTrae);
  safeBind(els.importTraeAiBtn, "click", importTraeAiResult);

  // 灵感收件箱
  safeBind(els.collectInspirationBtn, "click", openInspirationDrawer);
  safeBind(els.closeInspirationDrawerBtn, "click", closeInspirationDrawer);
  safeBind(els.inspirationBackdrop, "click", closeInspirationDrawer);
  safeBind(els.inspirationFileInput, "change", handleInspirationFiles);
  safeBind(els.analyzeInspirationBtn, "click", analyzeInspiration);
  safeBind(els.copyInspirationToTraeBtn, "click", copyInspirationPromptToTrae);
  safeBind(els.importTraeInspirationBtn, "click", importTraeInspirationResult);
  safeBind(els.clearInspirationBtn, "click", clearInspiration);

  // 写作室
  safeBind(els.newContentDraftBtn, "click", openContentDraftDialog);
  safeBind(els.closeContentDraftBtn, "click", closeContentDraftDialog);
  safeBind(els.copyDraftToTraeBtn, "click", copyContentDraftToTrae);
  safeBind(els.importDraftFromTraeBtn, "click", importContentDraftFromTrae);
  safeBind(els.resetContentDraftBtn, "click", resetContentDraftForm);
  safeBind(els.saveContentDraftBtn, "click", saveContentDraft);
  safeBind(els.draftPlatform, "change", updateDraftAssist);
  [els.draftTitle, els.draftAltTitles, els.draftBody, els.draftCoverTitle, els.draftCoverSubtitle, els.draftTags].forEach((input) => {
    safeBind(input, "input", updateDraftAssist);
  });

  // 导入导出
  safeBind(els.exportDataBtn, "click", handleExport);
  safeBind(els.importDataBtn, "click", handleImport);

  // AI 对话
  safeBind(els.chatSendBtn, "click", sendMessage);
  safeBind(els.chatInput, "keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  safeBind(els.newChatBtn, "click", clearChat);

  // 番茄钟
  safeBind(els.pomodoroStartBtn, "click", startPomodoro);
  safeBind(els.pomodoroPauseBtn, "click", pausePomodoro);
  safeBind(els.pomodoroResetBtn, "click", resetPomodoro);
  safeBind(els.pomodoroNoiseBtn, "click", togglePomodoroNoise);

  // 笔记
  safeBind(els.saveNoteBtn, "click", saveNoteFromEditor);
  safeBind(els.previewNoteBtn, "click", previewNote);
  safeBind(els.saveNoteDialog, "click", (e) => { e.preventDefault(); saveNoteFromDialog(); });
  // v10.3 PARA 增强
  safeBind(els.newNoteBtn, "click", () => openNoteDialog());
  safeBind(els.aiNoteBtn, "click", () => aiOrganizeNotes());
  safeBind(els.aiClassifyBtn, "click", () => aiClassifyNote());
  safeBind(els.aiSummarizeBtn, "click", () => aiSummarizeNote());
  safeBind(els.deleteNoteBtn, "click", () => { if (editingNoteId) deleteNote(editingNoteId); });
  safeBind(els.notesAiCloseBtn, "click", () => { if (els.notesAiResult) els.notesAiResult.style.display = "none"; });
  safeBind(els.notesTraeCopyBtn, "click", () => {
    if (els.notesTraePrompt) { navigatorClipboard(els.notesTraePrompt.textContent); showToast("指令已复制，粘贴到TRAE执行"); }
  });
  safeBind(els.notesTraeImportBtn, "click", () => {
    if (els.notesTraeImport && els.notesTraeImport.value.trim()) {
      renderNotesAiResult(els.notesTraeImport.value.trim());
      showToast("结果已导入");
    }
  });
  safeBind(els.notesSearchInput, "input", () => { notesSearch = els.notesSearchInput.value.trim(); renderNotes(); });
  document.querySelectorAll(".note-editor-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchNoteEditorTab(btn.dataset.noteTab));
  });

  // OKR
  safeBind(els.newOkrBtn, "click", () => openOkrDialog());
  safeBind(els.saveOkrEdit, "click", (e) => { e.preventDefault(); saveOkrFromDialog(); });
  safeBind(els.okrAiBreakdownBtn, "click", () => toggleOkrAiPanel());
  safeBind(els.okrAiGenerateBtn, "click", () => generateOkrByAi());
  if (els.okrAiInput) {
    els.okrAiInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") generateOkrByAi();
    });
  }

  // 书籍
  safeBind(els.saveBookEdit, "click", (e) => { e.preventDefault(); saveBookFromDialog(); });
  safeBind(document.querySelector("#saveBookNote"), "click", (e) => { e.preventDefault(); saveBookNoteFromDialog(); });
  safeBind(document.querySelector("#saveBookReview"), "click", (e) => { e.preventDefault(); saveBookReviewFromDialog(); });
  // 阅读计时器按钮
  safeBind(document.querySelector("#readingTimerStartBtn"), "click", (e) => { e.preventDefault(); startReadingTimer(); });
  safeBind(document.querySelector("#readingTimerPauseBtn"), "click", (e) => { e.preventDefault(); pauseReadingTimer(); });
  safeBind(document.querySelector("#readingTimerStopBtn"), "click", (e) => { e.preventDefault(); stopReadingTimer(); });
  // 书架筛选与排序
  safeBind(els.bookshelfTagFilter, "change", () => {
    bookshelfFilterState.tag = els.bookshelfTagFilter.value;
    renderBookshelf();
  });
  safeBind(els.bookshelfSortBy, "change", () => {
    bookshelfFilterState.sortBy = els.bookshelfSortBy.value;
    renderBookshelf();
  });
  // 书籍状态快捷切换（事件委托）
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.classList && target.classList.contains("book-status-select") && target.dataset.bookStatus) {
      const book = books.find((b) => b.id === target.dataset.bookStatus);
      if (book) {
        book.status = target.value;
        if (target.value === "done" && !book.finishDate) book.finishDate = todayKey();
        if (target.value === "reading" && !book.startDate) book.startDate = todayKey();
        saveBooks();
        showToast("状态已更新为「" + (target.value === "reading" ? "在读" : target.value === "wishlist" ? "想读" : "已读") + "」");
        renderBookshelf();
      }
    }
  });

  // Skills 技能库
  safeBind(document.querySelector("#createSkillBtn"), "click", () => openSkillEditDialog(null));
  safeBind(document.querySelector("#saveSkillEdit"), "click", (e) => { e.preventDefault(); saveSkillFromDialog(); });
  // 技能分类筛选
  document.querySelectorAll(".skill-cat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".skill-cat-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      skillsFilterCat = btn.dataset.skillCat;
      renderSkillsPanel();
    });
  });

  // 单词
  safeBind(els.vocabFlipBtn, "click", flipVocabCard);
  safeBind(els.vocabPlayBtn, "click", () => {
    const words = getVocabWords();
    const word = words[vocabState.currentWordIndex];
    if (word && word.word) playSceneVocabPronunciation(word.word);
  });
  safeBind(els.saveVocabEdit, "click", (e) => { e.preventDefault(); saveVocabFromDialog(); });

  // 饮水
  safeBind(els.waterGoalSaveBtn, "click", saveWaterGoal);

  // 饮食
  safeBind(els.dietUploadBtn, "click", () => { if (els.dietFileInput) els.dietFileInput.click(); });
  safeBind(els.dietFileInput, "change", handleDietUpload);

  // v10.0 运动记录
  safeBind(document.querySelector("#exerciseAddBtn"), "click", addExerciseRecord);
  // v10.0 睡眠管理
  safeBind(document.querySelector("#sleepAddBtn"), "click", addSleepRecord);
  // v10.0 习惯打卡
  safeBind(document.querySelector("#habitAddBtn"), "click", addHabit);

  // v10.1 健康推荐
  safeBind(document.querySelector("#recommendGenerateBtn"), "click", () => generateHealthRecommend());
  safeBind(document.querySelector("#recommendTraeCopyBtn"), "click", () => {
    const pre = document.querySelector("#recommendTraePrompt");
    if (pre) { navigatorClipboard(pre.textContent); showToast("指令已复制，粘贴到TRAE执行"); }
  });
  safeBind(document.querySelector("#recommendTraeImportBtn"), "click", () => {
    const textarea = document.querySelector("#recommendTraeImport");
    if (textarea && textarea.value.trim()) {
      renderRecommendResult(textarea.value.trim());
      showToast("结果已导入");
    }
  });

  // v10.2 PM 快速生成
  safeBind(document.querySelector("#pmGenerateBtn"), "click", () => generatePmDoc());
  safeBind(document.querySelector("#pmGenerateTraeCopyBtn"), "click", () => {
    const pre = document.querySelector("#pmGenerateTraePrompt");
    if (pre) { navigatorClipboard(pre.textContent); showToast("指令已复制，粘贴到TRAE执行"); }
  });
  safeBind(document.querySelector("#pmGenerateTraeImportBtn"), "click", () => {
    const textarea = document.querySelector("#pmGenerateTraeImport");
    if (textarea && textarea.value.trim()) {
      renderPmGenerateResult(textarea.value.trim());
      showToast("结果已导入");
    }
  });

  // 听力
  safeBind(els.dictationPlayBtn, "click", playDictation);
  safeBind(els.dictationCheckBtn, "click", checkDictation);
  safeBind(els.dictationNextBtn, "click", nextDictation);
  document.querySelectorAll(".listening-scene-filter .speed-btn").forEach((btn) => {
    btn.addEventListener("click", () => filterListeningByScene(btn.dataset.lscene));
  });

  // 场景词库
  safeBind(document.querySelector("#sceneVocabPrevBtn"), "click", prevSceneVocab);
  safeBind(document.querySelector("#sceneVocabNextBtn"), "click", nextSceneVocab);
  safeBind(document.querySelector("#sceneVocabShuffleBtn"), "click", shuffleSceneVocab);

  // 学习计划
  safeBind(document.querySelector("#generatePlanBtn"), "click", generateStudyPlan);
  safeBind(document.querySelector("#savePlanGoalsBtn"), "click", savePlanGoals);

  // 错题本
  safeBind(document.querySelector("#addMistakeBtn"), "click", openMistakeDialog);
  safeBind(document.querySelector("#saveMistake"), "click", (e) => { e.preventDefault(); saveMistakeFromDialog(); });
  document.querySelectorAll("[data-mfilter]").forEach((btn) => {
    btn.addEventListener("click", () => filterMistakes(btn.dataset.mfilter));
  });

  // 口语测评
  safeBind(document.querySelector("#speakingRecordBtn"), "click", toggleSpeakingRecord);
  document.querySelectorAll("[data-speak-mode]").forEach((btn) => {
    btn.addEventListener("click", () => switchSpeakingMode(btn.dataset.speakMode));
  });

  // 影子跟读
  safeBind(els.shadowingPlayBtn, "click", playShadowing);
  safeBind(els.shadowingRecordBtn, "click", toggleShadowingRecord);
  safeBind(document.querySelector("#shadowingPrevBtn"), "click", prevShadowingSentence);
  safeBind(document.querySelector("#shadowingNextBtn"), "click", nextShadowingSentence);
  safeBind(document.querySelector("#shadowingShuffleBtn"), "click", shuffleShadowing);
  document.querySelectorAll(".shadowing-difficulty-filter .speed-btn").forEach((btn) => {
    btn.addEventListener("click", () => filterShadowingByDifficulty(btn.dataset.diff));
  });

  // 对话历史管理
  safeBind(els.clearAllChatHistoryBtn, "click", clearAllChatHistory);
}

/* ── 全局事件委托兜底 ── */
function bindGlobalButtonFallback() {
  document.addEventListener("click", async (event) => {
    const target = event.target.closest("button, a");
    if (!target) return;

    // 导航项
    if (target.dataset.module) {
      event.preventDefault();
      state.moduleId = target.dataset.module;
      state.tabGroup = "";
      state.status = "全部";
      state.category = "全部";
      state.audience = "全部";
      state.search = "";
      if (els.searchInput) els.searchInput.value = "";
      const mod = getModule();
      state.tab = mod.tabs && mod.tabs[0];
      render();
      return;
    }

    // tab
    if (target.dataset.tab) {
      event.preventDefault();
      state.tab = target.dataset.tab;
      render();
      return;
    }
    if (target.dataset.tabGroup) {
      event.preventDefault();
      state.tabGroup = target.dataset.tabGroup;
      const mod = getModule();
      if (mod.tabGroups) {
        const group = mod.tabGroups.find((g) => g.name === state.tabGroup);
        if (group && group.tabs && group.tabs[0]) state.tab = group.tabs[0];
      }
      render();
      return;
    }

    // 筛选 chip
    if (target.dataset.value && target.dataset.filterType) {
      event.preventDefault();
      const key = target.dataset.filterType;
      if (key && state[key] !== undefined) {
        state[key] = target.dataset.value;
        renderContent();
        renderFilters(getModule());
      }
      return;
    }

    // 仪表盘快捷入口
    if (target.dataset.quick) {
      event.preventDefault();
      handleQuickAction(target.dataset.quick);
      return;
    }

    // 看板卡片移动
    if (target.dataset.kanbanMove) {
      event.preventDefault();
      moveKanbanCard(target.dataset.kanbanMove, target.dataset.kanbanId);
      return;
    }

    // 单词复习按钮
    if (target.dataset.review) {
      event.preventDefault();
      reviewVocab(target.dataset.review);
      return;
    }

    // 单词场景切换
    if (target.dataset.scene && target.classList.contains("vocab-scene-btn")) {
      event.preventDefault();
      switchVocabScene(target.dataset.scene);
      return;
    }

    // 番茄钟模式切换
    if (target.dataset.mode && target.classList.contains("pomodoro-mode")) {
      event.preventDefault();
      setPomodoroMode(parseInt(target.dataset.mode, 10), parseInt(target.dataset.break, 10));
      return;
    }

    // PARA 切换
    if (target.dataset.para) {
      event.preventDefault();
      switchPara(target.dataset.para);
      return;
    }

    // OKR 周期切换
    if (target.dataset.cycle && target.classList.contains("okr-cycle-btn")) {
      event.preventDefault();
      state.okrCycle = target.dataset.cycle;
      renderOkrList();
      return;
    }

    // 书架切换
    if (target.dataset.shelf) {
      event.preventDefault();
      state.bookshelf = target.dataset.shelf;
      renderBookshelf();
      return;
    }

    // 听力模式切换
    if (target.dataset.mode && target.classList.contains("listening-mode-btn")) {
      event.preventDefault();
      listeningState.mode = target.dataset.mode;
      document.querySelectorAll(".listening-mode-btn").forEach((b) => b.classList.remove("active"));
      target.classList.add("active");
      return;
    }

    // 影子跟读速度
    if (target.dataset.speed && target.classList.contains("speed-btn")) {
      event.preventDefault();
      shadowingState.speed = target.dataset.speed;
      document.querySelectorAll(".speed-btn").forEach((b) => b.classList.remove("active"));
      target.classList.add("active");
      return;
    }

    // AI 对话快捷指令
    if (target.dataset.cmd) {
      event.preventDefault();
      handleChatQuickCmd(target.dataset.cmd);
      return;
    }

    // ── 保留的已有功能委托 ──

    if (target.id === "saveAiResultBtn") { event.preventDefault(); handleAiSave(); return; }
    if (target.id === "copyAiResultBtn") { event.preventDefault(); await handleAiCopy(); return; }
    if (target.id === "searchSkillBtn") { event.preventDefault(); await handleSkillSearch(); return; }

    if (target.dataset.importMatched !== undefined) { event.preventDefault(); importMatchedSkill(target); return; }
    if (target.dataset.importGithub !== undefined) { event.preventDefault(); importGithubSkill(target); return; }
    if (target.dataset.deleteIndex !== undefined) { event.preventDefault(); deleteUserCard(target); return; }
    if (target.dataset.archiveIndex !== undefined) { event.preventDefault(); saveInspirationArchive(target); return; }
    if (target.dataset.actionIndex !== undefined) { event.preventDefault(); saveNextAction(target); return; }
    if (target.dataset.dailyAction) { event.preventDefault(); handleDailyLogAction(target.dataset.dailyAction); return; }

    if (target.dataset.analysisTodo !== undefined) { event.preventDefault(); saveAnalysisTodo(target); return; }
    if (target.dataset.analysisProblem !== undefined) { event.preventDefault(); saveAnalysisProblem(target); return; }
    if (target.dataset.analysisInspiration !== undefined) { event.preventDefault(); saveAnalysisInspiration(target); return; }
    if (target.dataset.analysisReview !== undefined) { event.preventDefault(); saveAnalysisReview(target); return; }
    if (target.dataset.analysisAiTask !== undefined) {
      event.preventDefault();
      const action = target.dataset.analysisAiTask;
      if (action === "save") saveAnalysisAiTask(target);
      else if (action === "trae") copyAnalysisAiTaskToTrae(target);
      return;
    }
    if (target.dataset.draftAi) { event.preventDefault(); await runContentDraftAi(target.dataset.draftAi); return; }

    // 笔记操作
    if (target.dataset.noteEdit) { event.preventDefault(); editNote(target.dataset.noteEdit); return; }
    if (target.dataset.noteDelete) { event.preventDefault(); deleteNote(target.dataset.noteDelete); return; }
    if (target.dataset.noteNew) { event.preventDefault(); openNoteDialog(); return; }

    // OKR 操作
    if (target.dataset.okrEdit) { event.preventDefault(); openOkrDialog(target.dataset.okrEdit); return; }
    if (target.dataset.okrDelete) { event.preventDefault(); deleteOkr(target.dataset.okrDelete); return; }
    if (target.dataset.okrSlider) {
      event.preventDefault();
      updateKrProgress(target.dataset.okrSlider, parseInt(target.dataset.krIndex, 10), target.value);
      return;
    }

    // 书籍操作
    if (target.dataset.bookEdit) { event.preventDefault(); openBookDialog(target.dataset.bookEdit); return; }
    if (target.dataset.bookDelete) { event.preventDefault(); deleteBook(target.dataset.bookDelete); return; }
    if (target.dataset.bookNew) { event.preventDefault(); openBookDialog(); return; }
    if (target.dataset.bookProgress) { event.preventDefault(); updateBookProgress(target.dataset.bookProgress); return; }
    if (target.dataset.bookNote) { event.preventDefault(); openBookNoteDialog(target.dataset.bookNote); return; }
    if (target.dataset.bookNoteDelete) { event.preventDefault(); deleteBookNote(target.dataset.bookNoteDelete, target.dataset.bookNoteIdx); return; }
    // 加入推荐书籍到书架
    if (target.dataset.bookAddRecommend !== undefined) { event.preventDefault(); addRecommendBook(parseInt(target.dataset.bookAddRecommend, 10)); return; }
    // 推荐书籍 - 直接开始阅读
    if (target.dataset.bookReadNow !== undefined) { event.preventDefault(); addRecommendBookAndRead(parseInt(target.dataset.bookReadNow, 10)); return; }
    // 推荐书籍 - 加入想读
    if (target.dataset.bookAddWishlist !== undefined) { event.preventDefault(); addRecommendBookToWishlist(parseInt(target.dataset.bookAddWishlist, 10)); return; }
    // AI 推荐书籍按钮
    if (target.id === "aiRecommendBooksBtn") { event.preventDefault(); aiRecommendBooks(); return; }
    // 加入 AI 推荐书籍到书架
    if (target.dataset.bookAddAi !== undefined) { event.preventDefault(); addAiRecommendBook(parseInt(target.dataset.bookAddAi, 10)); return; }
    // 阅读打卡
    if (target.id === "markReadTodayBtn") { event.preventDefault(); markReadToday(); return; }
    // 设置阅读目标
    if (target.id === "setReadingGoalBtn") { event.preventDefault(); setReadingGoal(); return; }
    // 书籍详情
    if (target.dataset.bookDetail) { event.preventDefault(); openBookDetailDialog(target.dataset.bookDetail); return; }
    // 书评
    if (target.dataset.bookReview) { event.preventDefault(); openBookReviewDialog(target.dataset.bookReview); return; }
    // 阅读计时器
    if (target.dataset.bookTimer) { event.preventDefault(); openReadingTimerDialog(target.dataset.bookTimer); return; }
    // 导出笔记
    if (target.dataset.bookExportNotes) { event.preventDefault(); exportBookNotes(target.dataset.bookExportNotes); return; }

    // Skills 技能操作
    if (target.dataset.skillUse) { event.preventDefault(); useSkill(target.dataset.skillUse); return; }
    if (target.dataset.skillEdit) { event.preventDefault(); openSkillEditDialog(target.dataset.skillEdit); return; }
    if (target.dataset.skillCopy) { event.preventDefault(); copySkillPrompt(target.dataset.skillCopy); return; }
    if (target.dataset.skillDelete) { event.preventDefault(); deleteSkill(target.dataset.skillDelete); return; }

    // 单词操作
    if (target.dataset.vocabNew) { event.preventDefault(); openVocabDialog(); return; }
    if (target.dataset.vocabAi) { event.preventDefault(); vocabAiHelp(target.dataset.vocabAi); return; }

    // 学习计划任务勾选
    if (target.dataset.planToggle) { event.preventDefault(); togglePlanTask(target.dataset.planToggle); return; }

    // 错题本操作
    if (target.dataset.mistakeReview) { event.preventDefault(); reviewMistake(target.dataset.mistakeReview, true); return; }
    if (target.dataset.mistakeUnreview) { event.preventDefault(); reviewMistake(target.dataset.mistakeUnreview, false); return; }
    if (target.dataset.mistakeDelete) { event.preventDefault(); deleteMistake(target.dataset.mistakeDelete); return; }
    if (target.dataset.mistakeAi) { event.preventDefault(); aiExplainMistake(target.dataset.mistakeAi); return; }

    // 语法练习操作
    if (target.dataset.grammarTopic) { event.preventDefault(); selectGrammarTopic(target.dataset.grammarTopic); return; }
    if (target.dataset.grammarAnswer !== undefined) { event.preventDefault(); answerGrammar(parseInt(target.dataset.grammarAnswer, 10)); return; }
    if (target.id === "grammarNextBtn") { event.preventDefault(); nextGrammarExercise(); return; }
    if (target.id === "grammarPrevBtn") { event.preventDefault(); prevGrammarExercise(); return; }

    // 口语测评操作
    if (target.id === "speakNextPromptBtn") { event.preventDefault(); nextSpeakingPrompt(); return; }
    if (target.id === "speakPlayTextBtn") { event.preventDefault(); playSpeakingText(); return; }

    // 饮水快速记录
    if (target.dataset.ml) { event.preventDefault(); addWater(parseInt(target.dataset.ml, 10)); return; }

    // v10.0 习惯打卡
    if (target.dataset.habitCheck) { event.preventDefault(); toggleHabitCheckin(target.dataset.habitCheck); return; }
    if (target.dataset.habitDel) { event.preventDefault(); deleteHabit(target.dataset.habitDel); return; }
    // v10.0 运动记录删除
    if (target.dataset.exerciseDel) { event.preventDefault(); deleteExerciseRecord(target.dataset.exerciseDel); return; }

    // v10.1 健康推荐场景切换
    if (target.dataset.recommendScene) { event.preventDefault(); switchRecommendScene(target.dataset.recommendScene); return; }

    // v10.2 PM快速生成场景切换
    if (target.dataset.pmScene) { event.preventDefault(); switchPmScene(target.dataset.pmScene); return; }

    // 卡片复制/派AI/存为我的
    if (target.dataset.copy) {
      event.preventDefault();
      event.stopPropagation();
      const card = target.closest(".content-card");
      if (!card) return;
      const title = card.querySelector("h3")?.textContent || "";
      const summary = card.querySelector("p")?.textContent || "";
      const text = "标题：" + title + "\n说明：" + summary;
      if (target.dataset.copy === "ai") {
        openAiDrawer();
        els.aiInput.value = "请基于这张工作台卡片帮我继续处理：\n\n" + text;
        showToast("已带入 AI 助手");
        return;
      }
      try { await copyText(text); showToast("卡片内容已复制"); } catch { showToast("复制失败，请手动选中文字复制"); }
      return;
    }
    if (target.dataset.savePreset !== undefined) {
      event.preventDefault();
      const mod = getModule();
      const items = getModuleItems(mod);
      savePresetAsMine(items[parseInt(target.dataset.savePreset, 10)], mod.id);
      return;
    }
  });
}

/* ════════════════════════════════════════════════════════════════════
 * 渲染主流程
 * ════════════════════════════════════════════════════════════════════ */

function render() {
  const mod = getModule();
  document.title = `${mod.title} · Olivia Work Platform`;
  if (els.moduleTitle) els.moduleTitle.textContent = mod.title;
  if (els.moduleIntro) els.moduleIntro.textContent = mod.intro;

  // 初始化 tab
  if (!mod.tabs || !mod.tabs.includes(state.tab)) {
    state.tab = mod.tabs && mod.tabs[0];
  }

  if (els.newContentDraftBtn) {
    els.newContentDraftBtn.hidden = !(mod.id === "content" && state.tab === "工作材料");
  }

  // 对于使用专用面板的模块/Tab，隐藏全局筛选栏
  const specializedModules = ["dashboard", "english", "reading", "health"];
  const specializedTabs = ["通用对话", "专注计时", "知识笔记", "目标管理", "行业调研", "公文材料", "自媒体文案", "图片解析", "英语辅助"];
  const isSpecialized = specializedModules.includes(mod.id) || specializedTabs.includes(state.tab);
  if (els.filterPanel) {
    els.filterPanel.style.display = isSpecialized ? "none" : "";
  }

  renderNav();
  renderTabs(mod);
  if (!isSpecialized) renderFilters(mod);
  renderPanels(mod);
  renderDailyLogPanel();
  renderContent();

  // 同步底部导航激活状态
  document.querySelectorAll("#bottomNav .bottom-nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.module === state.moduleId);
  });
}

/* ── 面板切换逻辑 ── */
function renderPanels(mod) {
  // 先隐藏所有专用面板
  const panels = [
    els.dashboardPanel, els.kanbanView, els.aiChatPanel, els.aiModelsPanel, els.skillsPanel, els.pomodoroPanel,
    els.notesPanel, els.okrPanel, els.vocabPanel, els.shadowingPanel,
    els.listeningPanel, els.sceneVocabPanel, els.bookshelfPanel, els.waterPanel, els.dietPanel,
    els.healthDashboardPanel, els.exercisePanel, els.sleepPanel, els.habitPanel, els.healthRecommendPanel,
    els.studyPlanPanel, els.mistakeBookPanel, els.grammarPanel, els.speakingPanel, els.pmGeneratePanel
  ];
  panels.forEach((p) => { if (p) p.classList.remove("show"); });
  if (els.contentArea) els.contentArea.style.display = "";
  if (els.dailyLogPanel) els.dailyLogPanel.classList.remove("show");

  // 首页仪表盘 — 根据 state.tab 显示/隐藏对应子区域
  if (mod.id === "dashboard") {
    if (els.dashboardPanel) els.dashboardPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    // 默认先渲染仪表盘数据（指标卡 + 时间线）
    renderDashboard();
    // 根据当前 tab 切换可见子区域
    renderDashboardTabView(state.tab);
    return;
  }

  // 项目管理 - 任务看板
  if (mod.id === "project" && state.tab === "任务看板" && state.view === "kanban") {
    if (els.kanbanView) els.kanbanView.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderKanban();
    return;
  }

  // AI 全能助手 - 通用对话面板（所有AI相关tab都复用对话面板，通过快捷指令区分场景）
  if (mod.id === "ai-center" && state.tab === "通用对话") {
    if (els.aiChatPanel) els.aiChatPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderChatHistoryList();
    return;
  }

  // AI 全能助手 - 行业调研/公文材料/自媒体文案/图片解析/英语辅助
  // 这些tab暂时复用对话面板，并自动加载对应的场景prompt
  if (mod.id === "ai-center" && ["行业调研", "公文材料", "自媒体文案", "图片解析", "英语辅助"].includes(state.tab)) {
    if (els.aiChatPanel) els.aiChatPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderChatHistoryList();
    // 根据tab设置对话场景提示
    const scenePrompts = {
      "行业调研": "我是你的行业调研助手，擅长搜集和分析 AI 产品动态、新能源行业资讯、PM 行业干货。请告诉我你想调研什么主题？",
      "公文材料": "我是你的公文写作助手，擅长生成周报、项目复盘、会议纪要、汇报材料。请告诉我你需要写什么？",
      "自媒体文案": "我是你的自媒体文案助手，擅长小红书、公众号、抖音文案撰写。请告诉我你的产品/场景/卖点？",
      "图片解析": "我是你的图片解析助手，可以识别饮食热量、解析截图需求、分析图片内容。请上传图片或描述图片内容。",
      "英语辅助": "我是你的英语学习助手，可以提供翻译、作文批改、托业答题解析、词汇讲解。请告诉我你需要什么帮助？"
    };
    const welcomeMsg = scenePrompts[state.tab];
    if (welcomeMsg && els.chatMessages) {
      const hasWelcome = Array.from(els.chatMessages.children).some((el) => el.textContent.includes(welcomeMsg));
      if (!hasWelcome) {
        appendChatMessage("assistant", welcomeMsg, false);
      }
    }
    return;
  }

  // 学习成长 - 番茄钟
  if (mod.id === "learning" && state.tab === "专注计时") {
    if (els.pomodoroPanel) els.pomodoroPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderPomodoro();
    return;
  }

  // 学习成长 - 知识笔记
  if (mod.id === "learning" && state.tab === "知识笔记") {
    if (els.notesPanel) els.notesPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderNotes();
    return;
  }

  // 学习成长 - OKR 目标管理
  if (mod.id === "learning" && state.tab === "目标管理") {
    if (els.okrPanel) els.okrPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderOkrList();
    renderBadges();
    return;
  }

  // 英语学习 - 背单词
  if (mod.id === "english" && state.tab === "背单词") {
    if (els.vocabPanel) els.vocabPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderVocab();
    return;
  }

  // 英语学习 - 影子跟读
  if (mod.id === "english" && state.tab === "影子跟读") {
    if (els.shadowingPanel) els.shadowingPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderShadowing();
    return;
  }

  // 英语学习 - 听力训练
  if (mod.id === "english" && state.tab === "听力训练") {
    if (els.listeningPanel) els.listeningPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderListening();
    return;
  }

  // 英语学习 - 场景词库（亲子/商务/托业）
  if (mod.id === "english" && ["亲子英语", "商务英语", "托业考试", "日常英语", "旅行英语"].includes(state.tab)) {
    if (els.sceneVocabPanel) els.sceneVocabPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderSceneVocabPanel(state.tab);
    return;
  }

  // 英语学习 - 学习计划
  if (mod.id === "english" && state.tab === "学习计划") {
    if (els.studyPlanPanel) els.studyPlanPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderStudyPlan();
    return;
  }

  // 英语学习 - 错题本
  if (mod.id === "english" && state.tab === "错题本") {
    if (els.mistakeBookPanel) els.mistakeBookPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderMistakeBook();
    return;
  }

  // 英语学习 - 语法练习
  if (mod.id === "english" && state.tab === "语法练习") {
    if (els.grammarPanel) els.grammarPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderGrammar();
    return;
  }

  // 英语学习 - 口语测评
  if (mod.id === "english" && state.tab === "口语测评") {
    if (els.speakingPanel) els.speakingPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderSpeaking();
    return;
  }

  // 读书管理
  if (mod.id === "reading") {
    if (els.bookshelfPanel) els.bookshelfPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderBookshelf();
    return;
  }

  // 健康生活 - 饮水追踪
  if (mod.id === "health" && state.tab === "饮水追踪") {
    if (els.waterPanel) els.waterPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderWater();
    return;
  }

  // 健康生活 - 饮食热量
  if (mod.id === "health" && state.tab === "饮食热量") {
    if (els.dietPanel) els.dietPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderDiet();
    return;
  }

  // v10.0 健康生活 - 健康总览
  if (mod.id === "health" && state.tab === "健康总览") {
    if (els.healthDashboardPanel) els.healthDashboardPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderHealthDashboard();
    return;
  }

  // v10.0 健康生活 - 运动记录
  if (mod.id === "health" && state.tab === "运动记录") {
    if (els.exercisePanel) els.exercisePanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderExercise();
    return;
  }

  // v10.0 健康生活 - 睡眠管理
  if (mod.id === "health" && state.tab === "睡眠管理") {
    if (els.sleepPanel) els.sleepPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderSleep();
    return;
  }

  // v10.0 健康生活 - 习惯打卡
  if (mod.id === "health" && state.tab === "习惯打卡") {
    if (els.habitPanel) els.habitPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderHabits();
    return;
  }

  // v10.1 健康生活 - 健康推荐
  if (mod.id === "health" && state.tab === "健康推荐") {
    if (els.healthRecommendPanel) els.healthRecommendPanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderHealthRecommend();
    return;
  }

  // v10.2 AI产品经理知识库 - AI快速生成
  if (mod.id === "pm-knowledge" && state.tab === "AI快速生成") {
    if (els.pmGeneratePanel) els.pmGeneratePanel.classList.add("show");
    if (els.contentArea) els.contentArea.style.display = "none";
    renderPmGenerate();
    return;
  }

  // 其他情况：常规卡片列表
}

/* ── 导航渲染 ── */
function renderNav() {
  if (!els.nav) return;
  // AI 全能助手置顶：dashboard 之后第一个显示
  const orderedModules = [...data.modules];
  const aiIndex = orderedModules.findIndex((m) => m.id === "ai-center");
  const dashIndex = orderedModules.findIndex((m) => m.id === "dashboard");
  if (aiIndex > -1 && dashIndex > -1 && aiIndex !== dashIndex + 1) {
    const [aiMod] = orderedModules.splice(aiIndex, 1);
    orderedModules.splice(dashIndex + 1, 0, aiMod);
  }
  els.nav.innerHTML = orderedModules
    .map((mod) => `<button class="nav-item ${mod.id === state.moduleId ? "active" : ""}" data-module="${mod.id}">
      <span class="nav-icon">${mod.icon}</span>
      <span class="nav-label">${mod.title}</span>
    </button>`)
    .join("");

  document.querySelectorAll("[data-footer]").forEach((btn) => {
    const action = btn.dataset.footer;
    if (action === "recycle") btn.onclick = () => showToast("回收站功能开发中");
    else if (action === "settings") btn.onclick = () => openSettings();
  });
}

/* ── Tabs 渲染（支持 tabGroups 分组） ── */
function renderTabs(mod) {
  if (!els.subTabs) return;
  const groups = mod.tabGroups && mod.tabGroups.length ? mod.tabGroups : null;

  if (!groups) {
    els.subTabs.classList.remove("grouped-tabs");
    els.subTabs.innerHTML = (mod.tabs || [])
      .map((tab) => `<button class="tab ${tab === state.tab ? "active" : ""}" data-tab="${esc(tab)}">${esc(tab)}</button>`)
      .join("");
    return;
  }

  const groupNames = groups.map((g) => g.name);
  let currentGroup = state.tabGroup && groupNames.includes(state.tabGroup)
    ? state.tabGroup
    : (groups.find((g) => g.tabs.includes(state.tab))?.name || groupNames[0]);
  state.tabGroup = currentGroup;
  const currentGroupObj = groups.find((g) => g.name === currentGroup);
  if (currentGroupObj && !currentGroupObj.tabs.includes(state.tab)) {
    state.tab = currentGroupObj.tabs[0];
  }

  els.subTabs.classList.add("grouped-tabs");
  els.subTabs.innerHTML = `
    <div class="tab-group-row">
      ${groupNames.map((name) => `<button class="tab-group ${name === currentGroup ? "active" : ""}" data-tab-group="${esc(name)}">${esc(name)}</button>`).join("")}
    </div>
    <div class="tab-child-row">
      ${currentGroupObj.tabs.map((tab) => `<button class="tab ${tab === state.tab ? "active" : ""}" data-tab="${esc(tab)}">${esc(tab)}</button>`).join("")}
    </div>
  `;
}

/* ── 筛选器渲染 ── */
function renderFilters(mod) {
  const items = getModuleItems(mod);
  renderChipGroup(els.statusFilters, unique(["全部", ...items.map((i) => i.status), ...data.statuses.filter((s) => s !== "全部")]), state.status, "status");
  renderChipGroup(els.categoryFilters, unique(["全部", ...items.map((i) => i.category)]), state.category, "category");
  renderChipGroup(els.audienceFilters, unique(["全部", ...items.map((i) => i.audience), ...data.audiences.filter((a) => a !== "全部")]), state.audience, "audience");
}

function renderChipGroup(container, values, activeValue, filterType) {
  if (!container) return;
  const ft = filterType ? ` data-filter-type="${esc(filterType)}"` : "";
  container.innerHTML = values.slice(0, 12).map((v) =>
    `<button class="chip ${v === activeValue ? "active" : ""}"${ft} data-value="${esc(v)}">${esc(v)}</button>`
  ).join("");
}

/* ── 内容区渲染 ── */
function renderContent() {
  if (!els.contentArea) return;
  const mod = getModule();

  // 如果当前是专用面板模式，不渲染常规卡片
  if (isSpecialPanelActive(mod)) {
    els.contentArea.innerHTML = "";
    return;
  }

  const items = sortItems(filterItems(getModuleItems(mod)));
  const insightPanel = renderContentInsightPanel(mod, items);
  if (els.totalCount) els.totalCount.textContent = items.length;
  if (els.activeCount) els.activeCount.textContent = items.filter((i) => ["进行中", "开发中", "调研中", "持续维护"].includes(i.status)).length;
  if (els.aiCount) els.aiCount.textContent = items.filter((i) => i.ai).length;

  if (!items.length) {
    els.contentArea.className = "content-area";
    els.contentArea.innerHTML = `${insightPanel}<div class="empty"><h3>没有匹配内容</h3><p>换一个关键词或筛选条件，或点击右上角「新建」。</p></div>`;
    return;
  }
  if (state.view === "table") { renderTable(items); return; }
  if (state.view === "timeline") { renderTimeline(items); return; }
  renderCards(items, insightPanel);
}

function isSpecialPanelActive(mod) {
  if (mod.id === "dashboard") return true;
  if (mod.id === "project" && state.tab === "任务看板" && state.view === "kanban") return true;
  if (mod.id === "ai-center" && ["通用对话", "行业调研", "公文材料", "自媒体文案", "图片解析", "英语辅助"].includes(state.tab)) return true;
  if (mod.id === "learning" && ["专注计时", "知识笔记", "目标管理"].includes(state.tab)) return true;
  if (mod.id === "english" && ["背单词", "影子跟读", "听力训练", "亲子英语", "商务英语", "托业考试", "日常英语", "旅行英语", "学习计划", "错题本", "语法练习", "口语测评"].includes(state.tab)) return true;
  if (mod.id === "reading") return true;
  if (mod.id === "health" && ["饮水追踪", "饮食热量"].includes(state.tab)) return true;
  return false;
}

function renderContentInsightPanel(mod, items) {
  if (mod.id !== "content") return "";
  const libraryTabs = ["选题库", "爆款复盘"];
  if (!libraryTabs.includes(state.tab)) return "";

  const allContentItems = getModuleItems(mod);
  const currentItems = items || [];
  const draftCount = allContentItems.filter((item) => item.category === "工作材料" || item.platform).length;
  const labCount = allContentItems.filter((item) => item.category === "爆款复盘" || (item.tags || []).some((tag) => /爆款|对标|拆解/.test(tag))).length;
  const libraryCount = allContentItems.filter((item) => item.category === "选题库" || (item.tags || []).some((tag) => /资料|图书|知识库|阅读/.test(tag))).length;
  const tagStats = {};
  allContentItems.forEach((item) => (item.tags || []).forEach((tag) => { tagStats[tag] = (tagStats[tag] || 0) + 1; }));
  const hotTags = Object.entries(tagStats).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag, count]) => `#${esc(tag)}(${count})`).join(" ");

  const tabCopy = {
    "选题库": { title: "选题库视图", intro: "这里适合按系列管理选题，把一个内容方向拆成选题、草稿、发布、复盘的链路。", action: "下一步可补：合集进度、选题状态、选题一键生成文案。" },
    "爆款复盘": { title: "爆款复盘视图", intro: "这里适合放公域爆款案例、标题结构、封面套路、评论区洞察和可迁移选题。", action: "下一步可补：爆款拆解模板、对标账号库、选题转文案。" }
  }[state.tab] || { title: "", intro: "", action: "" };

  return `<section class="content-insight-panel">
    <div><strong>${esc(tabCopy.title)}</strong><p>${esc(tabCopy.intro)}</p><p>${esc(tabCopy.action)}</p></div>
    <div class="content-insight-stats">
      <span>当前筛选 ${currentItems.length}</span><span>写作草稿 ${draftCount}</span>
      <span>爆款案例 ${labCount}</span><span>知识资料 ${libraryCount}</span>
    </div>
    <div class="content-insight-tags">${hotTags || "暂无高频标签，建议先从灵感收件箱或工作材料沉淀内容。"}</div>
  </section>`;
}

function filterItems(items) {
  return items.filter((i) => {
    const tabMatch = ["总览", "全部", "今日概览"].includes(state.tab) || i.category === state.tab || (i.tags || []).includes(state.tab);
    const statusMatch = state.status === "全部" || i.status === state.status;
    const categoryMatch = state.category === "全部" || i.category === state.category;
    const audienceMatch = state.audience === "全部" || i.audience === state.audience;
    const search = `${i.title} ${i.summary} ${i.status} ${i.category} ${i.audience} ${(i.tags || []).join(" ")}`.toLowerCase();
    const searchMatch = !state.search || search.includes(state.search);
    return tabMatch && statusMatch && categoryMatch && audienceMatch && searchMatch;
  });
}

function sortItems(items) {
  const s = [...items];
  if (state.sort === "priority" || state.sort === "heat") return s.sort((a, b) => b.heat - a.heat);
  if (state.sort === "date") return s.reverse();
  return s;
}

function renderCards(items, beforeHtml = "") {
  const mod = getModule();
  const userModItems = userItems[mod.id] || [];
  els.contentArea.className = "content-area cards";
  els.contentArea.innerHTML = beforeHtml + items.map((item, listIndex) => {
    const c = data.colors[item.color] || data.colors.blue;
    const isUser = userModItems.includes(item);
    const idx = isUser ? userModItems.indexOf(item) : -1;
    return `<article class="content-card ${isUser ? "editable" : "read-only"}" style="--card-color:${c.color};--card-soft:${c.soft}" ${isUser ? `data-edit-index="${idx}"` : ""} data-list-index="${listIndex}">
      <div class="card-head">
        <span class="card-icon">${item.icon}</span>
        <span class="card-status" style="--card-color:${c.color};--card-soft:${c.soft}">${esc(item.status)}</span>
      </div>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.summary)}</p>
      ${renderContentMeta(item)}
      <div class="tag-row">
        <span class="tag">${esc(item.category)}</span>
        <span class="tag">${esc(item.audience)}</span>
        ${(item.tags || []).map((t) => `<span class="tag">#${esc(t)}</span>`).join("")}
      </div>
      <div class="card-foot">
        <span>${esc(item.date)} · 影响 ${item.heat}${isUser ? "" : " · 预设"}</span>
        <div class="mini-actions">
          ${item.ai ? "<button data-copy='ai'>派AI</button>" : ""}
          <button data-copy="card">复制</button>
          ${isUser ? `<button data-delete-index="${idx}" data-delete-module="${mod.id}">删除</button>` : `<button data-save-preset="${listIndex}">存为我的</button>`}
        </div>
      </div>
    </article>`;
  }).join("");

  // 点击卡片 → 编辑
  els.contentArea.querySelectorAll(".content-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      const idx = parseInt(card.dataset.editIndex, 10);
      if (idx >= 0) {
        openEditDialog(userModItems[idx], mod.id, idx);
      } else {
        showToast("预设内容不能编辑，可点「新建」添加自己的版本");
      }
    });
  });
}

function renderContentMeta(item) {
  if (!item.contentDraft) return "";
  const draft = item.contentDraft;
  return `<div class="content-meta-row">
    <span class="content-meta-pill">${esc(draft.platform || "平台未定")}</span>
    <span class="content-meta-pill">${esc(draft.wordCount || countContentWords(draft.body))} 字</span>
    <span class="content-meta-pill">${esc(item.status || draft.status || "草稿")}</span>
    ${draft.publishTime ? `<span class="content-meta-pill">${esc(draft.publishTime.replace("T", " "))}</span>` : ""}
  </div>`;
}

function renderTable(items) {
  els.contentArea.className = "content-area";
  els.contentArea.innerHTML = `<div class="table-wrap"><table><thead><tr>
    <th>标题</th><th>状态</th><th>分类</th><th>对象</th><th>标签</th><th>更新时间</th>
  </tr></thead><tbody>${items.map((i) => `<tr>
    <td><strong>${esc(i.icon)} ${esc(i.title)}</strong><br><span>${esc(i.summary)}</span></td>
    <td>${esc(i.status)}</td><td>${esc(i.category)}</td><td>${esc(i.audience)}</td>
    <td>${(i.tags || []).map((t) => "#" + esc(t)).join(" ")}</td><td>${esc(i.date)}</td>
  </tr>`).join("")}</tbody></table></div>`;
}

function renderTimeline(items) {
  els.contentArea.className = "content-area";
  els.contentArea.innerHTML = `<div class="timeline-list">${items.map((i) => {
    const c = data.colors[i.color] || data.colors.blue;
    return `<div class="timeline-item" style="--card-color:${c.color};--card-soft:${c.soft}">
      <h3>${esc(i.icon)} ${esc(i.title)}</h3>
      <p>${esc(i.summary)}</p>
      <div class="tag-row"><span class="tag">${esc(i.date)}</span><span class="tag">${esc(i.status)}</span></div>
    </div>`;
  }).join("")}</div>`;
}

/* ── 编辑卡片 ── */
function openEditDialog(item, moduleId, index) {
  editingItemIndex = index;
  editingItemModuleId = moduleId;
  if (!els.editDialog) return;
  els.editTitle.value = item.title || "";
  els.editSummary.value = item.summary || "";
  els.editStatus.value = item.status || "待办";
  els.editCategory.value = item.category || "";
  els.editAudience.value = item.audience || "自己";
  els.editTags.value = (item.tags || []).join(", ");
  els.editDialog.showModal();
}

function saveEdit() {
  if (editingItemIndex < 0 || !editingItemModuleId) return;
  const title = els.editTitle.value.trim();
  if (!title) { showToast("标题不能为空"); return; }
  const list = userItems[editingItemModuleId];
  if (!list || !list[editingItemIndex]) { showToast("未找到要编辑的内容"); return; }
  list[editingItemIndex].title = title;
  list[editingItemIndex].summary = els.editSummary.value.trim();
  list[editingItemIndex].status = els.editStatus.value;
  list[editingItemIndex].category = els.editCategory.value.trim();
  list[editingItemIndex].audience = els.editAudience.value.trim();
  list[editingItemIndex].tags = els.editTags.value.split(",").map((s) => s.trim()).filter(Boolean);
  saveUserItems();
  els.editDialog.close();
  showToast("修改已保存");
  render();
}

function savePresetAsMine(item, moduleId) {
  if (!item) { showToast("未找到要保存的预设卡片"); return; }
  if (!userItems[moduleId]) userItems[moduleId] = [];
  const newItem = { ...item, status: "待办", audience: item.audience || "自己", tags: [...(item.tags || [])], date: "刚刚", ai: item.ai !== false, icon: item.icon || "✨", color: item.color || "blue" };
  if (hasDuplicateItem(moduleId, newItem)) { showToast("这张卡片已存为你的个人卡片"); return; }
  userItems[moduleId].unshift(newItem);
  saveUserItems();
  showToast("已存为你的个人卡片，可编辑和删除");
  render();
}

function deleteUserCard(button) {
  const moduleId = button.dataset.deleteModule;
  const index = parseInt(button.dataset.deleteIndex, 10);
  const list = userItems[moduleId] || [];
  const item = list[index];
  if (!item) { showToast("未找到要删除的内容"); return; }
  if (!window.confirm(`确认删除「${item.title}」吗？`)) { showToast("已取消删除"); return; }
  list.splice(index, 1);
  saveUserItems();
  showToast("已删除：" + item.title);
  render();
}

function cleanupUserItems() {
  Object.keys(userItems).forEach((moduleId) => {
    const seen = new Set();
    userItems[moduleId] = (userItems[moduleId] || []).filter((item) => {
      const key = moduleId === "skills" ? skillKey(item) : itemKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });
  saveUserItems();
}

function itemKey(item) {
  return [String(item?.title || "").trim().toLowerCase(), String(item?.summary || "").trim().slice(0, 120).toLowerCase()].join("::");
}

function hasDuplicateItem(moduleId, item) {
  const key = itemKey(item);
  return (userItems[moduleId] || []).some((existing) => itemKey(existing) === key);
}

function hasDuplicateSkill(skill) {
  const key = skillKey(skill);
  return (userItems.skills || []).some((existing) => skillKey(existing) === key);
}

function skillKey(skill) {
  return String(skill?.title || "").trim().toLowerCase().replace(/\s+/g, "");
}

function dedupeSkills(skills) {
  const seen = new Set();
  return (skills || []).filter((skill) => {
    const key = skillKey(skill);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ════════════════════════════════════════════════════════════════════
 * 1. 首页仪表盘
 * ════════════════════════════════════════════════════════════════════ */

/* ─── 仪表盘子区域 tab 切换：根据 state.tab 显示/隐藏 ─── */
function renderDashboardTabView(tab) {
  const panel = els.dashboardPanel;
  if (!panel) return;
  // 四个子区域选择器（与 index.html 中的 class 对应）
  const overviewEl = panel.querySelector(".dashboard-grid");
  const chartsEl = panel.querySelector(".dashboard-charts");
  const quickEl = panel.querySelector(".quick-actions");
  const timelineEl = panel.querySelector(".dashboard-timeline");
  // 先全部隐藏
  [overviewEl, chartsEl, quickEl, timelineEl].forEach((el) => {
    if (el) el.style.display = "none";
  });
  // 再根据 tab 显示对应区域
  if (tab === "今日概览") {
    if (overviewEl) overviewEl.style.display = "";
  } else if (tab === "数据看板") {
    if (chartsEl) chartsEl.style.display = "";
  } else if (tab === "快捷入口") {
    if (quickEl) quickEl.style.display = "";
  } else if (tab === "时间线") {
    if (timelineEl) timelineEl.style.display = "";
  } else {
    // 默认显示今日概览
    if (overviewEl) overviewEl.style.display = "";
  }
}

function renderDashboard() {
  // 待办任务数
  const todoItems = (userItems.project || []).filter((i) => i.status === "待办" || i.status === "进行中");
  if (els.dashTodoCount) els.dashTodoCount.textContent = todoItems.length;

  // 学习时长（从番茄钟会话估算）
  const sessions = readLS(K.pomodoroSessions, []);
  const todaySessions = sessions.filter((s) => s.date === todayKey());
  const studyHours = (todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60).toFixed(1);
  if (els.dashStudyHours) els.dashStudyHours.textContent = studyHours + "h";

  // 饮水量
  const waterToday = waterStore[todayKey()] || { todayML: 0, goalML: 2000, records: [] };
  if (els.dashWaterCount) els.dashWaterCount.textContent = (waterToday.todayML || 0) + "ml";

  // AI 对话次数
  if (els.dashAiCount) els.dashAiCount.textContent = chatHistory.filter((m) => m.role === "user").length;

  // 专注番茄数
  if (els.dashPomodoroCount) els.dashPomodoroCount.textContent = todaySessions.length;

  // 目标进度环形图
  const goalProgress = computeOkrProgress();
  if (els.dashGoalPercent) els.dashGoalPercent.textContent = goalProgress + "%";
  if (els.dashGoalRing) {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference * (goalProgress / 100);
    els.dashGoalRing.setAttribute("stroke-dasharray", `${offset} ${circumference}`);
  }

  // 时间线：今日重要事项
  renderDashboardTimeline();
}

function computeOkrProgress() {
  if (!okrs.length) return 0;
  const totalProgress = okrs.reduce((sum, o) => {
    const krProgress = (o.keyResults || []).reduce((s, kr) => s + (kr.progress || 0), 0);
    const avg = o.keyResults && o.keyResults.length ? krProgress / o.keyResults.length : 0;
    return sum + avg;
  }, 0);
  return Math.round(totalProgress / okrs.length);
}

function renderDashboardTimeline() {
  if (!els.dashTimeline) return;
  const items = [];
  // 今日待办
  (userItems.project || []).filter((i) => i.status === "待办" || i.status === "进行中").slice(0, 3).forEach((i) => {
    items.push({ icon: "📋", title: i.title, desc: i.summary, time: i.date });
  });
  // 今日番茄钟
  const sessions = readLS(K.pomodoroSessions, []);
  sessions.filter((s) => s.date === todayKey()).slice(-2).forEach((s) => {
    items.push({ icon: "🍅", title: `完成 ${s.duration} 分钟专注`, desc: s.taskTitle || "专注会话", time: s.time || "" });
  });
  // 今日工作记录
  const log = getDailyLog();
  if (log && log.outputs) {
    items.push({ icon: "📝", title: log.theme || "今日工作记录", desc: log.outputs.slice(0, 100), time: log.date });
  }

  if (!items.length) {
    els.dashTimeline.innerHTML = '<div class="empty"><p>今天还没有安排事项。</p></div>';
    return;
  }

  els.dashTimeline.innerHTML = items.map((item) => `
    <div class="timeline-item">
      <h3>${item.icon} ${esc(item.title)}</h3>
      <p>${esc(item.desc || "")}</p>
      <div class="tag-row"><span class="tag">${esc(item.time || "今日")}</span></div>
    </div>
  `).join("");
}

function handleQuickAction(action) {
  switch (action) {
    case "newTask":
      state.moduleId = "project";
      state.tab = "任务看板";
      render();
      if (els.dialog) els.dialog.showModal();
      break;
    case "pomodoro":
      state.moduleId = "learning";
      state.tab = "专注计时";
      render();
      break;
    case "vocab":
      state.moduleId = "english";
      state.tab = "背单词";
      render();
      break;
    case "note":
      state.moduleId = "learning";
      state.tab = "知识笔记";
      render();
      openNoteDialog();
      break;
    case "dailyLog":
      openDailyLogDialog();
      break;
    case "aiChat":
      state.moduleId = "ai-center";
      state.tab = "通用对话";
      render();
      break;
    case "water":
      state.moduleId = "health";
      state.tab = "饮水追踪";
      render();
      break;
    case "read":
      state.moduleId = "reading";
      render();
      break;
    default:
      showToast("快捷入口：" + action);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * 3. 项目管理 - 任务看板
 * ════════════════════════════════════════════════════════════════════ */

function renderKanban() {
  const tasks = userItems.project || [];
  const columns = {
    "待办": { el: els.kanbanTodo, countEl: els.kanbanTodoCount },
    "进行中": { el: els.kanbanDoing, countEl: els.kanbanDoingCount },
    "已完成": { el: els.kanbanDone, countEl: els.kanbanDoneCount },
    "已归档": { el: els.kanbanArchived, countEl: els.kanbanArchivedCount }
  };

  Object.keys(columns).forEach((status) => {
    const col = columns[status];
    if (!col.el) return;
    const colTasks = tasks.filter((t) => (t.status || "待办") === status);
    col.el.innerHTML = colTasks.length ? colTasks.map((task) => {
      const c = data.colors[task.color] || data.colors.blue;
      return `<div class="kanban-card" style="--card-color:${c.color};--card-soft:${c.soft}">
        <div class="kanban-card-title">${esc(task.title)}</div>
        <div class="kanban-card-tags">
          ${(task.tags || []).slice(0, 3).map((t) => `<span class="tag">#${esc(t)}</span>`).join("")}
          ${task.ai ? '<span class="tag ai-tag">派AI</span>' : ""}
        </div>
        <div class="kanban-card-actions">
          ${status !== "待办" ? `<button class="mini-btn" data-kanban-move="left" data-kanban-id="${esc(task.id || task.title)}">← 左移</button>` : ""}
          ${status !== "已归档" ? `<button class="mini-btn" data-kanban-move="right" data-kanban-id="${esc(task.id || task.title)}">右移 →</button>` : ""}
        </div>
      </div>`;
    }).join("") : '<div class="empty" style="padding:16px;"><p>暂无任务</p></div>';
    if (col.countEl) col.countEl.textContent = colTasks.length;
  });
}

function moveKanbanCard(direction, taskId) {
  const tasks = userItems.project || [];
  const task = tasks.find((t) => (t.id || t.title) === taskId);
  if (!task) { showToast("未找到任务"); return; }
  const order = ["待办", "进行中", "已完成", "已归档"];
  const currentIdx = order.indexOf(task.status || "待办");
  const newIdx = direction === "right" ? Math.min(currentIdx + 1, order.length - 1) : Math.max(currentIdx - 1, 0);
  task.status = order[newIdx];
  saveUserItems();
  showToast(`已移动到「${order[newIdx]}」`);
  renderKanban();
}

/* ════════════════════════════════════════════════════════════════════
 * 4. AI 能力中心 - 对话面板
 * ════════════════════════════════════════════════════════════════════ */

async function sendMessage() {
  if (!els.chatInput) return;
  const message = els.chatInput.value.trim();
  if (!message) { showToast("请输入消息内容"); return; }

  // 添加用户消息
  chatHistory.push({ role: "user", content: message, time: new Date().toISOString() });
  saveChatHistory();
  els.chatInput.value = "";
  renderChatMessages();

  // 显示等待
  appendChatMessage("assistant", "正在思考中...", true);

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: chatHistory.filter((m) => !m.pending).slice(-20),
        provider: els.chatModelSelect ? els.chatModelSelect.value : "auto"
      })
    });
    const result = await response.json();
    // 移除等待消息
    removePendingMessages();
    if (!result.ok) throw new Error(result.error || "AI 对话失败");

    // TRAE桥接模式
    if (result.mode === "trae-bridge") {
      chatHistory.push({ role: "assistant", content: result.traePrompt, time: new Date().toISOString(), provider: "TRAE", traeBridge: true, fallbackReason: result.fallbackReason });
      saveChatHistory();
      renderChatMessages();
      return;
    }

    chatHistory.push({ role: "assistant", content: result.answer, time: new Date().toISOString(), provider: result.provider });
    saveChatHistory();
    renderChatMessages();
  } catch (error) {
    removePendingMessages();
    chatHistory.push({ role: "assistant", content: `对话失败：${error.message}`, time: new Date().toISOString(), error: true });
    saveChatHistory();
    renderChatMessages();
    showToast("AI 对话失败：" + error.message);
  }
}

function appendChatMessage(role, content, pending) {
  if (!els.chatMessages) return;
  const wrapper = document.createElement("div");
  wrapper.className = `chat-message ${role}${pending ? " pending" : ""}`;
  wrapper.innerHTML = `
    <div class="chat-message-avatar">${role === "user" ? "🧑" : "🤖"}</div>
    <div class="chat-message-bubble"><p>${esc(content)}</p></div>
  `;
  els.chatMessages.appendChild(wrapper);
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

function removePendingMessages() {
  if (!els.chatMessages) return;
  els.chatMessages.querySelectorAll(".chat-message.pending").forEach((el) => el.remove());
}

function renderChatMessages() {
  if (!els.chatMessages) return;
  if (!chatHistory.length) {
    els.chatMessages.innerHTML = `<div class="chat-message assistant">
      <div class="chat-message-avatar">🤖</div>
      <div class="chat-message-bubble"><p>你好，我是你的 AI 助手。你可以让我帮你搜集资料、辅助写作，或者讲解任何知识点。</p></div>
    </div>`;
    return;
  }
  els.chatMessages.innerHTML = chatHistory.map((msg) => {
    if (msg.traeBridge) {
      return `
        <div class="chat-message assistant">
          <div class="chat-message-avatar">🤝</div>
          <div class="chat-message-bubble" style="max-width:100%;">${buildTraeBridgeUI(msg.content, msg.fallbackReason)}</div>
        </div>
      `;
    }
    return `
      <div class="chat-message ${msg.role}${msg.error ? " error" : ""}">
        <div class="chat-message-avatar">${msg.role === "user" ? "🧑" : "🤖"}</div>
        <div class="chat-message-bubble"><p>${esc(msg.content)}</p></div>
      </div>
    `;
  }).join("");
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

function renderChatHistoryList() {
  if (!els.chatHistoryList) return;
  const userMessages = chatHistory.filter((m) => m.role === "user");
  if (!userMessages.length) {
    els.chatHistoryList.innerHTML = '<div class="empty" style="padding:16px;"><p>暂无历史对话。</p></div>';
    return;
  }
  els.chatHistoryList.innerHTML = userMessages.slice(-10).reverse().map((msg, idx) => `
    <div class="chat-history-item">
      <p>${esc(msg.content.slice(0, 50))}${msg.content.length > 50 ? "..." : ""}</p>
      <small>${msg.time ? new Date(msg.time).toLocaleString("zh-CN") : ""}</small>
    </div>
  `).join("");
}

function clearChat() {
  if (!chatHistory.length) { showToast("对话已是空的"); return; }
  if (!window.confirm("确认清空当前对话？")) return;
  chatHistory = [];
  saveChatHistory();
  renderChatMessages();
  renderChatHistoryList();
  showToast("对话已清空");
}

function clearAllChatHistory() {
  if (!window.confirm("确认清空所有对话历史？此操作不可恢复。")) return;
  chatHistory = [];
  saveChatHistory();
  renderChatMessages();
  renderChatHistoryList();
  showToast("所有对话历史已清空");
}

/* ════════════════════════════════════════════════════════════════════
 * AI 能力中心 - 模型总览 & Skills 技能库管理
 * ════════════════════════════════════════════════════════════════════ */

// 预定义模型信息（与 server.js 中 providers 对应）
// availability 类型说明：
// "api"     = 需配置 API Key，已配置时随时可用
// "freetier"= 平台提供免费注册额度，未配置 Key 时注册账号即可获得免费额度
// "trae"    = TRAE 桥接模式，无需任何 Key，在 TRAE 环境内复制指令给 AI 执行
const AI_MODEL_INFO = [
  {
    id: "deepseek", name: "DeepSeek", icon: "🐳", color: "blue",
    desc: "国产高性能开源模型，擅长中文写作与分析",
    strengths: ["中文写作", "内容生成", "分析", "性价比"],
    capabilities: ["对话问答", "内容创作", "代码生成", "数据分析", "翻译润色"],
    best: "日常写作、报告生成、中文内容创作",
    contextLen: "64K",
    pricing: "低",
    availability: "freetier",
    freetierNote: "注册即送 500万 Token 免费额度，用完可绑定支付宝充值或换号续用",
    signupUrl: "https://platform.deepseek.com"
  },
  {
    id: "doubao", name: "豆包 (火山方舟)", icon: "🌋", color: "orange",
    desc: "字节跳动旗下大模型，擅长短视频脚本、小红书文案",
    strengths: ["中文内容", "短视频", "小红书", "本土表达"],
    capabilities: ["对话问答", "内容创作", "营销文案", "短视频脚本"],
    best: "小红书推文、短视频脚本、营销内容",
    contextLen: "32K",
    pricing: "低",
    availability: "freetier",
    freetierNote: "火山方舟新用户送 50万 Token，Doubao-lite 模型长期免费",
    signupUrl: "https://console.volcengine.com/ark"
  },
  {
    id: "qwen", name: "通义千问 (百炼)", icon: "🔮", color: "purple",
    desc: "阿里通义大模型，擅长办公材料整理和知识问答",
    strengths: ["中文办公", "材料整理", "知识问答"],
    capabilities: ["对话问答", "文档摘要", "表格处理", "知识问答", "代码生成"],
    best: "办公文档处理、知识问答、材料整理",
    contextLen: "128K",
    pricing: "中",
    availability: "freetier",
    freetierNote: "DashScope 新用户送 100万 Token，qwen-turbo 长期有免费额度",
    signupUrl: "https://dashscope.console.aliyun.com"
  },
  {
    id: "kimi", name: "Kimi (Moonshot)", icon: "🌙", color: "green",
    desc: "月之暗面出品，超长上下文，擅长长文阅读",
    strengths: ["长文阅读", "中文总结", "资料整理"],
    capabilities: ["长文阅读", "文档总结", "资料整理", "对话问答"],
    best: "长文档分析、论文阅读、资料汇总",
    contextLen: "200K+",
    pricing: "中",
    availability: "freetier",
    freetierNote: "Moonshot 新用户送 15元 额度，约等于 300万 Token",
    signupUrl: "https://platform.moonshot.cn"
  },
  {
    id: "claude", name: "Claude", icon: "🎭", color: "pink",
    desc: "Anthropic 出品，擅长产品分析和复杂文档润色",
    strengths: ["长文", "产品分析", "文档润色", "复杂表达"],
    capabilities: ["对话问答", "产品分析", "文档润色", "代码生成", "深度推理"],
    best: "PRD文档、产品分析、复杂写作、代码审查",
    contextLen: "200K",
    pricing: "高",
    availability: "api",
    freetierNote: "需配置 ANTHROPIC_API_KEY，无免费额度，按量付费",
    signupUrl: "https://console.anthropic.com"
  },
  {
    id: "openai", name: "OpenAI GPT", icon: "⚡", color: "blue",
    desc: "GPT 系列模型，通用能力强，擅长复杂推理",
    strengths: ["通用能力", "复杂推理", "英文资料"],
    capabilities: ["对话问答", "复杂推理", "代码生成", "英文写作", "数据分析"],
    best: "复杂推理、英文内容、代码开发、通用任务",
    contextLen: "128K",
    pricing: "高",
    availability: "api",
    freetierNote: "新用户送 5美元 额度，约可用 1-2 个月轻度使用",
    signupUrl: "https://platform.openai.com"
  },
  {
    id: "trae", name: "TRAE 桥接模式", icon: "🤝", color: "green",
    desc: "无需 API Key，在 TRAE 环境内直接调用 AI 执行",
    strengths: ["零配置", "免API费用", "TRAE环境原生"],
    capabilities: ["代码生成", "文档创作", "数据分析", "任意AI任务"],
    best: "无 API Key 时的兜底方案、复杂编程任务",
    contextLen: "—",
    pricing: "免费",
    availability: "trae",
    freetierNote: "永远可用，无需注册，复制结构化指令给 TRAE 的 AI 即可",
    signupUrl: ""
  }
];

// 预定义能力场景
const AI_CAPABILITY_MATRIX = [
  { icon: "💬", title: "多轮对话", desc: "与AI进行上下文连贯的多轮对话，支持追问、纠正、深入探讨", models: "全部模型" },
  { icon: "🔍", title: "资料搜集", desc: "输入主题，AI联网搜索并输出结构化摘要、要点和来源链接", models: "DeepSeek/千问/Kimi" },
  { icon: "✍️", title: "写作辅助", desc: "汇报材料、邮件、PRD文档、小红书推文一键生成", models: "DeepSeek/豆包/Claude" },
  { icon: "📊", title: "数据分析", desc: "上传数据或描述需求，AI帮你分析趋势、生成洞察", models: "GPT/Claude/千问" },
  { icon: "🌐", title: "翻译润色", desc: "中英互译、学术润色、商务邮件优化", models: "DeepSeek/GPT/Claude" },
  { icon: "💻", title: "代码生成", desc: "描述需求生成代码、代码审查、Bug修复、重构建议", models: "GPT/Claude/DeepSeek" },
  { icon: "📚", title: "长文阅读", desc: "上传长文档，AI帮你快速摘要、提取要点、问答", models: "Kimi/Claude/GPT" },
  { icon: "🎬", title: "内容运营", desc: "短视频脚本、小红书文案、公众号文章批量生成", models: "豆包/DeepSeek" },
  { icon: "🧠", title: "深度推理", desc: "复杂问题分析、多步骤推理、决策建议", models: "GPT/Claude" },
  { icon: "📝", title: "学习辅导", desc: "知识点讲解、错题解析、英语口语评分、语法练习", models: "DeepSeek/千问/GPT" },
  { icon: "🏷️", title: "技能管理", desc: "将常用提示词沉淀为可复用Skill，一键调用", models: "全部模型" },
  { icon: "🔄", title: "TRAE协作", desc: "无API Key时，复制任务给TRAE执行，结果粘贴回来", models: "TRAE模式" }
];

// 场景推荐
const AI_SCENARIO_GUIDE = [
  { scenario: "写周报/日报", recommended: "DeepSeek", reason: "中文表达自然，性价比高", alt: "千问" },
  { scenario: "写小红书推文", recommended: "豆包", reason: "本土化表达，擅长种草文案", alt: "DeepSeek" },
  { scenario: "读长论文/报告", recommended: "Kimi", reason: "200K+超长上下文", alt: "Claude" },
  { scenario: "写PRD/产品分析", recommended: "Claude", reason: "产品分析能力强，表达专业", alt: "GPT" },
  { scenario: "写代码/Bug修复", recommended: "GPT", reason: "代码生成能力最强", alt: "Claude" },
  { scenario: "英文资料处理", recommended: "GPT", reason: "英文能力最佳", alt: "Claude" },
  { scenario: "办公文档整理", recommended: "千问", reason: "擅长中文办公场景", alt: "DeepSeek" },
  { scenario: "无API Key时", recommended: "TRAE", reason: "零配置，复制粘贴即可用", alt: "—" }
];

let aiModelsState = { loaded: false, providers: [] };

async function renderAiModelsOverview() {
  // 获取已配置的模型状态
  let providers = [];
  try {
    const res = await fetch("/api/providers");
    providers = await res.json();
    aiModelsState.providers = providers;
    aiModelsState.loaded = true;
  } catch {
    // 静默处理，可能未启动 server
  }

  // 统计三种可用状态
  let apiConfigured = 0;
  let freetierAvailable = 0;
  let traeAvailable = 0;
  AI_MODEL_INFO.forEach((model) => {
    const providerInfo = providers.find((p) => p.id === model.id);
    const configured = providerInfo ? providerInfo.configured : false;
    if (model.availability === "api" && configured) apiConfigured++;
    if (model.availability === "freetier") freetierAvailable++;
    if (model.availability === "trae") traeAvailable++;
  });

  // 渲染可用状态速览栏
  const bar = document.querySelector("#aiAvailabilityBar");
  if (bar) {
    bar.innerHTML = `
      <div class="ai-availability-item api">
        <strong>${apiConfigured}</strong>
        <span>API直连可用<br><small>已配置Key</small></span>
      </div>
      <div class="ai-availability-item freetier">
        <strong>${freetierAvailable}</strong>
        <span>免费额度可用<br><small>注册即用</small></span>
      </div>
      <div class="ai-availability-item trae">
        <strong>${traeAvailable}</strong>
        <span>TRAE桥接<br><small>永远可用</small></span>
      </div>
      <div class="ai-availability-tip">
        <span style="font-size:13px;color:var(--text-muted);">&#x1F4A1; <strong>提示：</strong>4个国产模型（DeepSeek/豆包/千问/Kimi）注册即送免费额度，Claude/GPT需配置Key。所有模型均可用「TRAE桥接」兜底。</span>
      </div>
    `;
  }

  // 渲染模型卡片
  const grid = document.querySelector("#aiModelGrid");
  if (grid) {
    grid.innerHTML = AI_MODEL_INFO.map((model) => {
      const providerInfo = providers.find((p) => p.id === model.id);
      const configured = providerInfo ? providerInfo.configured : false;

      let statusBadge = "";
      let statusClass = "";
      let statusText = "";

      if (model.availability === "trae") {
        statusClass = "trae";
        statusText = "🤝 TRAE桥接 · 永远可用";
      } else if (model.availability === "freetier") {
        if (configured) {
          statusClass = "configured";
          statusText = "✅ API直连 · 已配置";
        } else {
          statusClass = "freetier";
          statusText = "🎁 免费额度 · 注册即用";
        }
      } else {
        if (configured) {
          statusClass = "configured";
          statusText = "✅ API直连 · 已配置";
        } else {
          statusClass = "unavailable";
          statusText = "⚠️ 需配置Key · 暂不可用";
        }
      }

      const signupBtn = model.signupUrl && !configured
        ? `<a href="${model.signupUrl}" target="_blank" class="ai-model-signup-btn">&#x1F4DD; 去注册领额度</a>`
        : "";

      return `<div class="ai-model-card" style="border-left:3px solid var(--${model.color});">
        <div class="ai-model-card-head">
          <span class="ai-model-icon">${model.icon}</span>
          <div style="flex:1;">
            <h5 style="margin:0;font-size:15px;">${model.name}</h5>
            <span style="font-size:11px;color:var(--text-muted);">${model.desc}</span>
          </div>
          <span class="ai-model-status ${statusClass}">${statusText}</span>
        </div>
        <div class="ai-model-tags">
          ${model.strengths.map((s) => `<span class="tag" style="font-size:11px;background:var(--${model.color}-soft);color:var(--${model.color});">${esc(s)}</span>`).join("")}
        </div>
        <div class="ai-model-freetier" style="font-size:12px;color:var(--text-muted);padding:6px 8px;background:var(--panel-soft);border-radius:6px;margin:8px 0;line-height:1.6;">
          <strong>${model.availability === "trae" ? "TRAE桥接：" : model.availability === "freetier" && !configured ? "免费额度：" : "使用说明："}</strong>${model.freetierNote}
        </div>
        <div class="ai-model-meta">
          <span>&#x1F4C4; 上下文：${model.contextLen}</span>
          <span>&#x1F4B0; 费用：${model.pricing}</span>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">
          <strong>擅长：</strong>${model.best}
        </div>
        ${signupBtn}
      </div>`;
    }).join("");
  }

  // 渲染免费额度 & 续用策略
  const ftGrid = document.querySelector("#aiFreetierGrid");
  if (ftGrid) {
    ftGrid.innerHTML = `
      <div class="ai-freetier-card">
        <h6>&#x1F381; 免费额度获取</h6>
        <p>DeepSeek、豆包、千问、Kimi 四大国产模型均提供新用户免费额度，注册账号后在「设置」中填入 API Key 即可使用。额度用完后可：<br>① 充值续用（费用很低）<br>② 换手机号重新注册领新额度<br>③ 切换到 TRAE 桥接模式继续使用</p>
      </div>
      <div class="ai-freetier-card">
        <h6>&#x1F4B0; 费用参考</h6>
        <p><strong>DeepSeek：</strong>约 1元/百万Token（写文章约0.01元）<br><strong>豆包：</strong>Doubao-lite 长期免费<br><strong>千问：</strong>qwen-turbo 长期有免费额度<br><strong>Kimi：</strong>约 5元/百万Token<br><strong>Claude/GPT：</strong>按量付费，费用较高</p>
      </div>
      <div class="ai-freetier-card">
        <h6>&#x1F504; 续用策略</h6>
        <p><strong>轻度用户：</strong>注册 2-3 个平台轮换使用，基本永久免费<br><strong>重度用户：</strong>优先用 DeepSeek（最便宜）+ 豆包免费版<br><strong>无Key时：</strong>TRAE桥接模式永远兜底，复制指令给 TRAE 的 AI 执行即可</p>
      </div>
      <div class="ai-freetier-card">
        <h6>&#x1F6E0; 配置方式</h6>
        <p>在项目根目录创建 <code>.env</code> 文件，填入对应平台的 API Key：<br><code>DEEPSEEK_API_KEY=sk-xxx</code><br><code>ARK_API_KEY=xxx</code><br><code>DASHSCOPE_API_KEY=sk-xxx</code><br><code>MOONSHOT_API_KEY=sk-xxx</code><br>配置后重启 <code>npm start</code> 即可生效。</p>
      </div>
    `;
  }

  // 渲染能力矩阵
  const capGrid = document.querySelector("#aiCapabilityGrid");
  if (capGrid) {
    capGrid.innerHTML = AI_CAPABILITY_MATRIX.map((cap) => `
      <div class="ai-capability-card">
        <span class="ai-capability-icon">${cap.icon}</span>
        <div>
          <h6 style="margin:0 0 4px;font-size:14px;">${cap.title}</h6>
          <p style="margin:0 0 4px;font-size:12px;color:var(--text-muted);line-height:1.5;">${cap.desc}</p>
          <span style="font-size:11px;color:var(--blue);">&#x1F539; ${cap.models}</span>
        </div>
      </div>
    `).join("");
  }

  // 渲染场景指引
  const scenarioList = document.querySelector("#aiScenarioList");
  if (scenarioList) {
    scenarioList.innerHTML = AI_SCENARIO_GUIDE.map((s) => `
      <div class="ai-scenario-item">
        <span class="ai-scenario-name">${s.scenario}</span>
        <span class="ai-scenario-rec">&#x2B50; ${s.recommended}</span>
        <span style="font-size:12px;color:var(--text-muted);">${s.reason}</span>
        ${s.alt !== "—" ? `<span style="font-size:11px;color:var(--text-muted);">备选：${s.alt}</span>` : ""}
      </div>
    `).join("");
  }
}

/* ─── Skills 技能库管理 ─── */

let skillsStore = readLS("olivia-work-platform-skills", []);
let skillsFilterCat = "全部";
let editingSkillId = null;

function saveSkillsStore() { saveLS("olivia-work-platform-skills", skillsStore); }

// 预置技能模板
const DEFAULT_SKILLS = [
  {
    id: "skill-default-1", name: "周报生成器", category: "工作",
    desc: "输入本周任务、成果、风险，自动生成结构化周报",
    prompt: "请根据以下信息生成一份工作周报，包含【本周完成】【进行中】【风险与阻碍】【下周计划】四个部分：\n\n任务列表：\n{input}\n\n要求：语言简洁专业，重点突出，适合向领导汇报。",
    model: "deepseek", uses: 0, createdAt: new Date().toISOString(),
    tags: ["周报", "汇报", "工作"]
  },
  {
    id: "skill-default-2", name: "小红书文案生成", category: "写作",
    desc: "输入主题和卖点，生成小红书风格种草文案",
    prompt: "请根据以下信息写一篇小红书种草文案：\n\n主题：{input}\n\n要求：\n1. 标题吸引眼球，使用emoji\n2. 正文300-500字，分段清晰\n3. 语气亲切自然，像朋友推荐\n4. 结尾引导互动\n5. 添加3-5个相关话题标签",
    model: "doubao", uses: 0, createdAt: new Date().toISOString(),
    tags: ["小红书", "文案", "营销"]
  },
  {
    id: "skill-default-3", name: "PRD文档生成", category: "工作",
    desc: "输入产品需求描述，生成标准PRD文档框架",
    prompt: "请根据以下需求描述，生成一份标准的产品需求文档（PRD）：\n\n需求描述：{input}\n\nPRD结构：\n1. 需求背景与目标\n2. 用户场景\n3. 功能需求（用表格列出）\n4. 非功能需求\n5. 数据指标\n6. 排期建议",
    model: "claude", uses: 0, createdAt: new Date().toISOString(),
    tags: ["PRD", "产品", "文档"]
  },
  {
    id: "skill-default-4", name: "英语口语评分", category: "学习",
    desc: "输入英语句子，AI评估发音准确度、流利度和语法",
    prompt: "请对以下英语句子进行口语评分分析：\n\n句子：{input}\n\n请从以下维度评分（1-10分）：\n1. 语法正确性\n2. 词汇多样性\n3. 句式复杂度\n4. 表达自然度\n并给出改进建议和优化后的版本。",
    model: "gpt", uses: 0, createdAt: new Date().toISOString(),
    tags: ["英语", "口语", "学习"]
  },
  {
    id: "skill-default-5", name: "竞品分析框架", category: "分析",
    desc: "输入竞品名称，生成六维度竞品分析报告",
    prompt: "请对以下产品进行竞品分析：\n\n竞品：{input}\n\n分析维度：\n1. 产品定位\n2. 目标用户\n3. 核心功能\n4. 交互设计\n5. 商业模式\n6. 可借鉴点\n\n输出结构化分析报告。",
    model: "claude", uses: 0, createdAt: new Date().toISOString(),
    tags: ["竞品", "分析", "产品"]
  },
  {
    id: "skill-default-6", name: "会议纪要整理", category: "工具",
    desc: "输入会议记录，自动提取议题、结论和待办事项",
    prompt: "请将以下会议记录整理为结构化会议纪要：\n\n原始记录：{input}\n\n输出格式：\n## 会议信息\n- 时间/地点/参会人\n## 讨论议题\n## 会议结论\n## 待办事项（负责人/截止日期）",
    model: "qwen", uses: 0, createdAt: new Date().toISOString(),
    tags: ["会议", "纪要", "整理"]
  }
];

// 初始化默认技能
if (!skillsStore.length) {
  skillsStore = DEFAULT_SKILLS.slice();
  saveSkillsStore();
}

function renderSkillsPanel() {
  // 统计栏
  const statsBar = document.querySelector("#skillsStatsBar");
  if (statsBar) {
    const total = skillsStore.length;
    const byCat = {};
    skillsStore.forEach((s) => { byCat[s.category] = (byCat[s.category] || 0) + 1; });
    const totalUses = skillsStore.reduce((sum, s) => sum + (s.uses || 0), 0);
    statsBar.innerHTML = `
      <div class="skill-stat-card"><strong style="color:var(--blue);">${total}</strong><span>总技能数</span></div>
      <div class="skill-stat-card"><strong style="color:var(--green);">${totalUses}</strong><span>累计使用</span></div>
      <div class="skill-stat-card"><strong style="color:var(--orange);">${byCat["写作"] || 0}</strong><span>写作类</span></div>
      <div class="skill-stat-card"><strong style="color:var(--purple);">${byCat["工作"] || 0}</strong><span>工作类</span></div>
      <div class="skill-stat-card"><strong style="color:var(--pink);">${byCat["分析"] || 0}</strong><span>分析类</span></div>
    `;
  }

  // 技能列表
  const list = document.querySelector("#skillsList");
  if (!list) return;

  let filtered = skillsStore;
  if (skillsFilterCat !== "全部") {
    filtered = skillsStore.filter((s) => s.category === skillsFilterCat);
  }

  if (!filtered.length) {
    list.innerHTML = `<div class="empty"><p>该分类下暂无技能，点击「新建技能」创建你的第一个AI技能。</p></div>`;
    return;
  }

  const catColors = { "写作": "blue", "分析": "purple", "工具": "orange", "学习": "green", "工作": "pink" };

  list.innerHTML = filtered.map((skill) => {
    const cc = catColors[skill.category] || "blue";
    return `<div class="skill-card" style="border-left:3px solid var(--${cc});">
      <div class="skill-card-head">
        <div style="flex:1;">
          <h5 style="margin:0 0 4px;font-size:15px;">${esc(skill.name)}</h5>
          <p style="margin:0;font-size:12px;color:var(--text-muted);">${esc(skill.desc)}</p>
        </div>
        <span class="tag" style="background:var(--${cc}-soft);color:var(--${cc});font-size:11px;">${esc(skill.category)}</span>
      </div>
      ${skill.tags && skill.tags.length ? `<div class="tag-row" style="margin:8px 0;">${skill.tags.map((t) => `<span class="tag" style="font-size:11px;">${esc(t)}</span>`).join("")}</div>` : ""}
      <div class="skill-prompt-preview">${esc((skill.prompt || "").substring(0, 120))}${(skill.prompt || "").length > 120 ? "..." : ""}</div>
      <div class="skill-card-meta">
        <span>&#x1F916; 推荐模型：${esc(skill.model || "自动")}</span>
        <span>&#x1F4C4; 使用 ${skill.uses || 0} 次</span>
      </div>
      <div class="skill-card-actions">
        <button class="primary-btn" data-skill-use="${esc(skill.id)}" style="font-size:12px;padding:4px 12px;">&#x25B6; 使用</button>
        <button class="ghost-btn" data-skill-edit="${esc(skill.id)}" style="font-size:12px;padding:4px 12px;">编辑</button>
        <button class="ghost-btn" data-skill-copy="${esc(skill.id)}" style="font-size:12px;padding:4px 12px;">复制Prompt</button>
        <button class="ghost-btn" data-skill-delete="${esc(skill.id)}" style="font-size:12px;padding:4px 12px;color:var(--pink);">删除</button>
      </div>
    </div>`;
  }).join("");
}

function getSkillById(id) {
  return skillsStore.find((s) => s.id === id);
}

function useSkill(id) {
  const skill = getSkillById(id);
  if (!skill) return;
  // 跳转到AI通用对话并预填
  state.tab = "通用对话";
  render();
  const input = els.chatInput;
  if (input) {
    input.value = skill.prompt.replace("{input}", "");
    input.focus();
    showToast("已加载技能「" + skill.name + "」到对话框，输入你的内容后发送");
  }
  skill.uses = (skill.uses || 0) + 1;
  saveSkillsStore();
}

function copySkillPrompt(id) {
  const skill = getSkillById(id);
  if (!skill) return;
  navigator.clipboard.writeText(skill.prompt || "").then(() => {
    showToast("Prompt 已复制到剪贴板");
  }).catch(() => {
    showToast("复制失败，请手动选择文本复制");
  });
}

function deleteSkill(id) {
  if (!window.confirm("确认删除此技能？")) return;
  skillsStore = skillsStore.filter((s) => s.id !== id);
  saveSkillsStore();
  renderSkillsPanel();
  showToast("技能已删除");
}

function openSkillEditDialog(id) {
  editingSkillId = id || null;
  const skill = id ? getSkillById(id) : null;
  const dialog = document.querySelector("#skillEditDialog");
  if (!dialog) return;
  document.querySelector("#skillEditName").value = skill ? skill.name : "";
  document.querySelector("#skillEditDesc").value = skill ? skill.desc : "";
  document.querySelector("#skillEditCategory").value = skill ? skill.category : "工作";
  document.querySelector("#skillEditModel").value = skill ? (skill.model || "auto") : "auto";
  document.querySelector("#skillEditPrompt").value = skill ? (skill.prompt || "") : "";
  document.querySelector("#skillEditTags").value = skill ? (skill.tags || []).join(", ") : "";
  document.querySelector("#skillEditTitle").textContent = skill ? "编辑技能" : "新建技能";
  dialog.showModal();
}

function saveSkillFromDialog() {
  const name = document.querySelector("#skillEditName").value.trim();
  const desc = document.querySelector("#skillEditDesc").value.trim();
  const category = document.querySelector("#skillEditCategory").value;
  const model = document.querySelector("#skillEditModel").value;
  const prompt = document.querySelector("#skillEditPrompt").value.trim();
  const tagsStr = document.querySelector("#skillEditTags").value.trim();
  if (!name) { showToast("请输入技能名称"); return; }
  if (!prompt) { showToast("请输入Prompt内容"); return; }
  const tags = tagsStr ? tagsStr.split(/[,，]/).map((t) => t.trim()).filter(Boolean) : [];

  if (editingSkillId) {
    const skill = getSkillById(editingSkillId);
    if (skill) {
      skill.name = name;
      skill.desc = desc;
      skill.category = category;
      skill.model = model;
      skill.prompt = prompt;
      skill.tags = tags;
      skill.updatedAt = new Date().toISOString();
    }
  } else {
    skillsStore.push({
      id: uid("skill"),
      name, desc, category, model, prompt, tags,
      uses: 0,
      createdAt: new Date().toISOString()
    });
  }
  saveSkillsStore();
  document.querySelector("#skillEditDialog").close();
  renderSkillsPanel();
  showToast(editingSkillId ? "技能已更新" : "技能已创建");
}

function handleChatQuickCmd(cmd) {
  const prompts = {
    research: "请帮我搜集以下主题的资料：",
    writing: "请帮我完成以下写作任务：",
    explain: "请帮我讲解以下知识点："
  };
  if (els.chatInput) {
    els.chatInput.value = prompts[cmd] || "";
    els.chatInput.focus();
  }
  if (cmd === "writing") {
    openAiDrawer();
  }
}

/* ════════════════════════════════════════════════════════════════════
 * 5. 学习成长 - 番茄钟
 * ════════════════════════════════════════════════════════════════════ */

function setPomodoroMode(workMin, breakMin) {
  pomodoroState.workMin = workMin;
  pomodoroState.breakMin = breakMin;
  pomodoroState.mode = `${workMin}+${breakMin}`;
  if (!pomodoroState.running) {
    pomodoroState.phase = "work";
    pomodoroState.remaining = workMin * 60;
    renderPomodoro();
  }
  document.querySelectorAll(".pomodoro-mode").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(`.pomodoro-mode[data-mode="${workMin}"]`).forEach((b) => b.classList.add("active"));
}

function startPomodoro() {
  if (pomodoroState.running) return;
  pomodoroState.running = true;
  if (pomodoroState.timer) clearInterval(pomodoroState.timer);
  pomodoroState.timer = setInterval(() => {
    pomodoroState.remaining -= 1;
    if (pomodoroState.remaining <= 0) {
      // 阶段切换
      if (pomodoroState.phase === "work") {
        recordPomodoroSession();
        pomodoroState.phase = "break";
        pomodoroState.remaining = pomodoroState.breakMin * 60;
        showToast("专注完成！开始休息");
      } else {
        pomodoroState.phase = "work";
        pomodoroState.remaining = pomodoroState.workMin * 60;
        showToast("休息结束，开始下一个专注");
      }
    }
    renderPomodoro();
  }, 1000);
  if (els.pomodoroStartBtn) els.pomodoroStartBtn.textContent = "继续";
  showToast("番茄钟已开始");
}

function pausePomodoro() {
  pomodoroState.running = false;
  if (pomodoroState.timer) { clearInterval(pomodoroState.timer); pomodoroState.timer = null; }
  if (els.pomodoroStartBtn) els.pomodoroStartBtn.textContent = "继续";
  showToast("番茄钟已暂停");
}

function resetPomodoro() {
  pomodoroState.running = false;
  if (pomodoroState.timer) { clearInterval(pomodoroState.timer); pomodoroState.timer = null; }
  pomodoroState.phase = "work";
  pomodoroState.remaining = pomodoroState.workMin * 60;
  if (els.pomodoroStartBtn) els.pomodoroStartBtn.textContent = "开始";
  renderPomodoro();
  showToast("番茄钟已重置");
}

function recordPomodoroSession() {
  const sessions = readLS(K.pomodoroSessions, []);
  const taskTitle = els.pomodoroTaskSelect?.selectedOptions[0]?.textContent || "";
  sessions.push({
    date: todayKey(),
    time: new Date().toLocaleTimeString("zh-CN"),
    duration: pomodoroState.workMin,
    phase: "work",
    taskId: pomodoroState.taskId || "",
    taskTitle
  });
  saveLS(K.pomodoroSessions, sessions);
}

function renderPomodoro() {
  const mins = Math.floor(pomodoroState.remaining / 60);
  const secs = pomodoroState.remaining % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  if (els.pomodoroDisplay) els.pomodoroDisplay.textContent = timeStr;
  if (els.pomodoroPhaseLabel) els.pomodoroPhaseLabel.textContent = pomodoroState.phase === "work" ? "专注时间" : "休息时间";

  // SVG 环形进度
  if (els.pomodoroRing) {
    const total = (pomodoroState.phase === "work" ? pomodoroState.workMin : pomodoroState.breakMin) * 60;
    const progress = 1 - (pomodoroState.remaining / total);
    const circumference = 2 * Math.PI * 88;
    const offset = circumference * progress;
    els.pomodoroRing.setAttribute("stroke-dasharray", `${offset} ${circumference}`);
  }

  // 今日统计
  const sessions = readLS(K.pomodoroSessions, []);
  const todaySessions = sessions.filter((s) => s.date === todayKey());
  if (els.pomodoroSessionCount) els.pomodoroSessionCount.textContent = todaySessions.length;
  if (els.pomodoroTotalMinutes) els.pomodoroTotalMinutes.textContent = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0) + "min";

  // 任务选择
  renderPomodoroTaskSelect();
}

function renderPomodoroTaskSelect() {
  if (!els.pomodoroTaskSelect) return;
  const tasks = userItems.project || [];
  const current = els.pomodoroTaskSelect.value;
  els.pomodoroTaskSelect.innerHTML = '<option value="">选择任务...</option>' +
    tasks.map((t) => `<option value="${esc(t.id || t.title)}">${esc(t.title)}</option>`).join("");
  if (current) els.pomodoroTaskSelect.value = current;
}

let pomodoroNoiseOn = false;
function togglePomodoroNoise() {
  pomodoroNoiseOn = !pomodoroNoiseOn;
  if (els.pomodoroNoiseBtn) {
    els.pomodoroNoiseBtn.innerHTML = `🎵 白噪音：${pomodoroNoiseOn ? "开启" : "关闭"}`;
  }
  showToast(pomodoroNoiseOn ? "白噪音已开启（占位）" : "白噪音已关闭");
}

/* ════════════════════════════════════════════════════════════════════
 * 6. 学习成长 - 知识笔记 PARA
 * ════════════════════════════════════════════════════════════════════ */

let currentPara = "projects";
let notesSearch = "";
let noteEditorTab = "edit";

const PARA_INFO = {
  projects: { label: "Projects", desc: "有明确目标和截止日期的项目", emoji: "📁" },
  areas: { label: "Areas", desc: "需要持续维护的责任领域", emoji: "🎯" },
  resources: { label: "Resources", desc: "感兴趣的主题和参考资料", emoji: "📚" },
  archives: { label: "Archives", desc: "已完成或不再活跃的内容", emoji: "📦" }
};

function switchPara(para) {
  currentPara = para;
  notesSearch = "";
  if (els.notesSearchInput) els.notesSearchInput.value = "";
  document.querySelectorAll(".para-tab").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(`.para-tab[data-para="${para}"]`).forEach((b) => b.classList.add("active"));
  renderNotes();
  updateParaInfo();
}

function updateParaInfo() {
  const info = PARA_INFO[currentPara];
  if (els.paraInfoText) {
    els.paraInfo.innerHTML = `<strong>${info.emoji} ${info.label}</strong> — ${info.desc}`;
  }
  // 更新统计
  const counts = { projects: 0, areas: 0, resources: 0, archives: 0 };
  notes.forEach((n) => { if (counts[n.para] !== undefined) counts[n.para]++; });
  const countEls = { projects: "paraCountProjects", areas: "paraCountAreas", resources: "paraCountResources", archives: "paraCountArchives" };
  Object.keys(counts).forEach((k) => {
    const el = document.querySelector(`#${countEls[k]}`);
    if (el) el.textContent = counts[k];
  });
  if (els.paraStats) {
    els.paraStats.innerHTML = `
      <span>总计 <strong>${notes.length}</strong></span>
      <span>P <strong>${counts.projects}</strong></span>
      <span>A <strong>${counts.areas}</strong></span>
      <span>R <strong>${counts.resources}</strong></span>
      <span>Arch <strong>${counts.archives}</strong></span>
    `;
  }
}

function renderNotes() {
  if (!els.notesList) return;
  let paraNotes = notes.filter((n) => n.para === currentPara);
  // v10.3 搜索过滤
  if (notesSearch) {
    const q = notesSearch.toLowerCase();
    paraNotes = paraNotes.filter((n) =>
      (n.title || "").toLowerCase().includes(q) ||
      (n.content || "").toLowerCase().includes(q) ||
      (n.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }
  // 按日期降序
  paraNotes.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  if (!paraNotes.length) {
    els.notesList.innerHTML = `<div class="empty"><p>${notesSearch ? "没有匹配的笔记" : "这里还没有笔记，点击「新建笔记」开始记录。"}</p></div>`;
    updateParaInfo();
    return;
  }
  els.notesList.innerHTML = paraNotes.map((note) => `
    <div class="note-item ${editingNoteId === note.id ? "active" : ""}" data-note-edit="${esc(note.id)}">
      <strong>${esc(note.title || "无标题")}</strong>
      <p>${esc((note.content || "").slice(0, 80))}${note.content && note.content.length > 80 ? "..." : ""}</p>
      <div class="note-item-tags">${(note.tags || []).map((t) => `<span class="tag">#${esc(t)}</span>`).join("")}</div>
      <small>${esc(note.date || "")}</small>
      <button class="ghost-btn note-delete-btn" data-note-delete="${esc(note.id)}">删除</button>
    </div>
  `).join("");
  updateParaInfo();
}

function editNote(noteId) {
  const note = notes.find((n) => n.id === noteId);
  if (!note) return;
  editingNoteId = noteId;
  if (els.noteEditorTitle) els.noteEditorTitle.value = note.title || "";
  if (els.noteEditorTags) els.noteEditorTags.value = (note.tags || []).join(", ");
  if (els.noteEditorBody) els.noteEditorBody.value = note.content || "";
  if (els.noteEditorPara) els.noteEditorPara.value = note.para || currentPara;
  if (els.deleteNoteBtn) els.deleteNoteBtn.style.display = "";
  switchNoteEditorTab("edit");
  renderNotes();
}

function saveNoteFromEditor() {
  if (!els.noteEditorTitle) return;
  const title = els.noteEditorTitle.value.trim();
  const content = els.noteEditorBody ? els.noteEditorBody.value : "";
  const tags = els.noteEditorTags ? splitTags(els.noteEditorTags.value) : [];
  const para = els.noteEditorPara ? els.noteEditorPara.value : currentPara;
  if (!title && !content) { showToast("请输入笔记标题或内容"); return; }

  if (editingNoteId) {
    const note = notes.find((n) => n.id === editingNoteId);
    if (note) {
      note.title = title;
      note.content = content;
      note.tags = tags;
      note.para = para;
      note.date = todayKey();
    }
  } else {
    const note = { id: uid("note"), title, content, tags, para, date: todayKey() };
    notes.unshift(note);
    editingNoteId = note.id;
    if (els.deleteNoteBtn) els.deleteNoteBtn.style.display = "";
  }
  saveNotes();
  showToast("笔记已保存");
  // 如果笔记移动到了其他 PARA 区，切换过去
  if (para !== currentPara) {
    switchPara(para);
  } else {
    renderNotes();
  }
}

function switchNoteEditorTab(tab) {
  noteEditorTab = tab;
  document.querySelectorAll(".note-editor-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.noteTab === tab);
  });
  if (tab === "preview") {
    if (els.noteEditorBody) els.noteEditorBody.style.display = "none";
    if (els.notePreviewPane) {
      els.notePreviewPane.style.display = "block";
      const content = els.noteEditorBody ? els.noteEditorBody.value : "";
      els.notePreviewPane.innerHTML = content.trim() ? renderMarkdown(content) : '<p style="color:var(--muted);">笔记内容为空</p>';
    }
  } else {
    if (els.noteEditorBody) els.noteEditorBody.style.display = "";
    if (els.notePreviewPane) els.notePreviewPane.style.display = "none";
  }
}

function previewNote() {
  switchNoteEditorTab("preview");
}

function deleteNote(noteId) {
  if (!window.confirm("确认删除这条笔记？")) return;
  notes = notes.filter((n) => n.id !== noteId);
  if (editingNoteId === noteId) {
    editingNoteId = null;
    if (els.noteEditorTitle) els.noteEditorTitle.value = "";
    if (els.noteEditorTags) els.noteEditorTags.value = "";
    if (els.noteEditorBody) els.noteEditorBody.value = "";
    if (els.deleteNoteBtn) els.deleteNoteBtn.style.display = "none";
  }
  saveNotes();
  showToast("笔记已删除");
  renderNotes();
}

/* ════════════════════════════════════════════════════════════════════
 * v10.3 知识笔记 AI 助手（归类/标签/摘要/整理）
 * ════════════════════════════════════════════════════════════════════ */

async function aiClassifyNote() {
  const title = els.noteEditorTitle?.value?.trim() || "";
  const content = els.noteEditorBody?.value?.trim() || "";
  if (!title && !content) { showToast("请先输入笔记内容"); return; }

  const prompt = [
    `你是 PARA 知识管理专家。请分析以下笔记，推荐最合适的 PARA 归类和标签。`,
    ``,
    `笔记标题：${title || "（无标题）"}`,
    `笔记内容：`,
    content || "（无内容）",
    ``,
    `请严格输出 JSON 格式（不要 Markdown 代码块）：`,
    `{`,
    `  "para": "projects|areas|resources|archives",`,
    `  "para_reason": "归类原因（一句话）",`,
    `  "suggested_tags": ["标签1", "标签2", "标签3"],`,
    `  "summary": "一句话摘要（30字以内）"`,
    `}`,
    ``,
    `PARA 定义：`,
    `- projects: 有明确目标和截止日期的项目`,
    `- areas: 需要持续维护的责任领域`,
    `- resources: 感兴趣的主题和参考资料`,
    `- archives: 已完成或不再活跃的内容`
  ].join("\n");

  await callNotesAi(prompt, "classify");
}

async function aiSummarizeNote() {
  const title = els.noteEditorTitle?.value?.trim() || "";
  const content = els.noteEditorBody?.value?.trim() || "";
  if (!content) { showToast("笔记内容为空"); return; }

  const prompt = [
    `请为以下笔记生成结构化摘要。`,
    ``,
    `笔记标题：${title || "（无标题）"}`,
    `笔记内容：`,
    content,
    ``,
    `请输出：`,
    `## 核心摘要（50字以内）`,
    `## 关键要点（3-5条）`,
    `## 行动建议（如有）`,
    `## 推荐标签（3-5个）`
  ].join("\n");

  await callNotesAi(prompt, "summarize");
}

async function aiOrganizeNotes() {
  if (!notes.length) { showToast("还没有笔记可整理"); return; }
  const allNotes = notes.map((n, i) => `[${i + 1}] 标题: ${n.title || "无标题"} | 内容: ${(n.content || "").slice(0, 100)} | 当前PARA: ${n.para}`).join("\n");
  const prompt = [
    `你是 PARA 知识管理专家。请帮我整理以下 ${notes.length} 条笔记，给出归类建议。`,
    ``,
    `笔记列表：`,
    allNotes,
    ``,
    `请输出：`,
    `## 整体分析（笔记分布情况）`,
    `## 归类调整建议（哪些笔记应该移到哪个PARA区，说明原因）`,
    `## 标签优化建议（统一标签命名）`,
    `## 知识结构建议（如何更好地组织这些知识）`
  ].join("\n");

  await callNotesAi(prompt, "organize");
}

async function callNotesAi(prompt, action) {
  if (els.notesAiResult) {
    els.notesAiResult.style.display = "block";
    els.notesAiContent.innerHTML = `<p style="color:var(--muted);">⏳ AI 正在分析中...</p>`;
  }
  if (els.notesTraeBridge) els.notesTraeBridge.style.display = "none";

  try {
    const res = await fetch("/api/notes/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, action })
    });
    const data = await res.json();

    if (data.mode === "trae-bridge") {
      if (els.notesTraeBridge) els.notesTraeBridge.style.display = "block";
      if (els.notesTraePrompt) els.notesTraePrompt.textContent = data.traePrompt || prompt;
      if (els.notesAiContent) els.notesAiContent.innerHTML = `<p style="color:var(--muted);">未配置API Key，请使用下方 TRAE 桥接。</p>`;
    } else if (data.ok) {
      renderNotesAiResult(data.answer, action);
    } else {
      if (els.notesAiContent) els.notesAiContent.innerHTML = `<p style="color:var(--red);">❌ ${esc(data.error || "未知错误")}</p>`;
    }
  } catch (e) {
    if (els.notesAiContent) els.notesAiContent.innerHTML = `<p style="color:var(--red);">❌ 网络错误: ${esc(e.message)}</p>`;
  }
}

function renderNotesAiResult(text, action) {
  if (!els.notesAiContent) return;
  const escaped = esc(String(text || ""));

  // 如果是 classify 且返回 JSON，尝试解析
  if (action === "classify") {
    const jsonMatch = escaped.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const paraLabels = { projects: "📁 Projects", areas: "🎯 Areas", resources: "📚 Resources", archives: "📦 Archives" };
        els.notesAiContent.innerHTML = `
          <div class="ai-section">
            <div class="ai-section-title">推荐归类</div>
            <p><strong>${paraLabels[parsed.para] || parsed.para}</strong> — ${esc(parsed.para_reason || "")}</p>
            ${parsed.para ? `<button class="primary-btn" onclick="applyNotePara('${parsed.para}')" style="margin-top:6px;">✅ 应用此归类</button>` : ""}
          </div>
          <div class="ai-section">
            <div class="ai-section-title">推荐标签</div>
            <div>${(parsed.suggested_tags || []).map((t) => `<span class="ai-suggest-tag" onclick="applyNoteTag('${esc(t)}')">#${esc(t)}</span>`).join("")}</div>
          </div>
          <div class="ai-section">
            <div class="ai-section-title">摘要</div>
            <p>${esc(parsed.summary || "")}</p>
          </div>`;
        return;
      } catch (e) { /* fall through to plain text */ }
    }
  }

  // 默认：按 ## 分段渲染
  const sections = escaped.split(/##\s*/).filter(Boolean);
  if (sections.length > 1) {
    els.notesAiContent.innerHTML = sections.map((s) => {
      const lines = s.split("\n");
      const title = lines[0].trim();
      const body = lines.slice(1).join("\n").trim();
      return `<div class="ai-section"><div class="ai-section-title">${esc(title)}</div><div style="white-space:pre-wrap;">${esc(body)}</div></div>`;
    }).join("");
  } else {
    els.notesAiContent.innerHTML = `<div style="white-space:pre-wrap;">${escaped}</div>`;
  }
}

function applyNotePara(para) {
  if (els.noteEditorPara) els.noteEditorPara.value = para;
  showToast(`已设置归类为 ${PARA_INFO[para]?.label || para}，点击「保存笔记」生效`);
}

function applyNoteTag(tag) {
  const current = els.noteEditorTags?.value?.trim() || "";
  const tags = current ? current.split(/[,，]/).map((t) => t.trim()).filter(Boolean) : [];
  if (!tags.includes(tag)) tags.push(tag);
  if (els.noteEditorTags) els.noteEditorTags.value = tags.join(", ");
  showToast(`已添加标签 #${tag}`);
}

function openNoteDialog() {
  if (!els.noteDialog) return;
  editingNoteId = null;
  if (els.noteDialogTitle) els.noteDialogTitle.value = "";
  if (els.noteDialogPara) els.noteDialogPara.value = currentPara;
  if (els.noteDialogTags) els.noteDialogTags.value = "";
  if (els.noteDialogBody) els.noteDialogBody.value = "";
  els.noteDialog.showModal();
}

function saveNoteFromDialog() {
  if (!els.noteDialogTitle) return;
  const title = els.noteDialogTitle.value.trim();
  const content = els.noteDialogBody ? els.noteDialogBody.value : "";
  const tags = els.noteDialogTags ? splitTags(els.noteDialogTags.value) : [];
  const para = els.noteDialogPara ? els.noteDialogPara.value : "projects";
  if (!title) { showToast("请输入笔记标题"); return; }
  const note = { id: uid("note"), title, content, tags, para, date: todayKey() };
  notes.unshift(note);
  saveNotes();
  if (els.noteDialog) els.noteDialog.close();
  showToast("笔记已创建");
  currentPara = para;
  renderNotes();
}

/* ════════════════════════════════════════════════════════════════════
 * 7. 学习成长 - OKR 目标管理
 * ════════════════════════════════════════════════════════════════════ */

if (!state.okrCycle) state.okrCycle = "quarter";

function renderOkrList() {
  if (!els.okrList) return;
  const cycleOkrs = okrs.filter((o) => (o.cycle || "quarter") === state.okrCycle);

  // 更新统计看板
  renderOkrStats(cycleOkrs);

  if (!cycleOkrs.length) {
    els.okrList.innerHTML = '<div class="empty"><p>还没有设定目标，点击「新建目标」开始，或使用 🤖 AI 拆解。</p></div>';
    return;
  }
  els.okrList.innerHTML = cycleOkrs.map((okr) => {
    const avgProgress = okr.keyResults && okr.keyResults.length
      ? Math.round(okr.keyResults.reduce((s, kr) => s + (kr.progress || 0), 0) / okr.keyResults.length)
      : 0;
    const confidenceColor = { high: "green", mid: "orange", low: "pink" }[okr.confidence] || "blue";
    const c = data.colors[confidenceColor] || data.colors.blue;
    const isDone = avgProgress >= 100;
    return `<div class="okr-card ${isDone ? 'okr-card-done' : ''}" style="--card-color:${c.color};--card-soft:${c.soft}">
      <div class="okr-card-head">
        <h4>${isDone ? '✅ ' : ''}${esc(okr.objective)}</h4>
        <div class="okr-card-actions">
          <button class="ghost-btn" data-okr-edit="${esc(okr.id)}">编辑</button>
          <button class="ghost-btn" data-okr-delete="${esc(okr.id)}">删除</button>
        </div>
      </div>
      <div class="okr-progress-row">
        <div class="okr-progress-bar"><div class="okr-progress-fill" style="width:${avgProgress}%"></div></div>
        <span class="okr-progress-text">${avgProgress}%</span>
        <span class="okr-confidence ${okr.confidence}">${okr.confidence === "high" ? "高" : okr.confidence === "mid" ? "中" : "低"}</span>
      </div>
      <div class="okr-kr-list">
        ${(okr.keyResults || []).map((kr, idx) => `
          <div class="kr-item">
            <span class="kr-text">${esc(kr.text)}</span>
            <div class="kr-progress-slider">
              <input type="range" min="0" max="100" value="${kr.progress || 0}" data-okr-slider="${esc(okr.id)}" data-kr-index="${idx}">
              <span>${kr.progress || 0}%</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>`;
  }).join("");
}

function renderOkrStats(cycleOkrs) {
  if (!els.okrStatTotal) return;
  const total = cycleOkrs.length;
  const done = cycleOkrs.filter((o) => {
    const avg = o.keyResults && o.keyResults.length
      ? o.keyResults.reduce((s, kr) => s + (kr.progress || 0), 0) / o.keyResults.length
      : 0;
    return avg >= 100;
  }).length;
  const active = total - done;
  const avgProgress = total > 0
    ? Math.round(cycleOkrs.reduce((sum, o) => {
        const avg = o.keyResults && o.keyResults.length
          ? o.keyResults.reduce((s, kr) => s + (kr.progress || 0), 0) / o.keyResults.length
          : 0;
        return sum + avg;
      }, 0) / total)
    : 0;
  els.okrStatTotal.textContent = total;
  els.okrStatActive.textContent = active;
  els.okrStatDone.textContent = done;
  els.okrStatAvg.textContent = avgProgress + "%";
}

function openOkrDialog(okrId) {
  if (!els.okrDialog) return;
  editingOkrId = okrId || null;
  if (okrId) {
    const okr = okrs.find((o) => o.id === okrId);
    if (okr) {
      els.okrEditObjective.value = okr.objective || "";
      els.okrEditKr1.value = okr.keyResults?.[0]?.text || "";
      els.okrEditKr2.value = okr.keyResults?.[1]?.text || "";
      els.okrEditKr3.value = okr.keyResults?.[2]?.text || "";
      els.okrEditConfidence.value = okr.confidence || "mid";
      els.okrEditCycle.value = okr.cycle || "quarter";
    }
  } else {
    els.okrEditObjective.value = "";
    els.okrEditKr1.value = "";
    els.okrEditKr2.value = "";
    els.okrEditKr3.value = "";
    els.okrEditConfidence.value = "mid";
    els.okrEditCycle.value = state.okrCycle || "quarter";
  }
  els.okrDialog.showModal();
}

function saveOkrFromDialog() {
  if (!els.okrEditObjective) return;
  const objective = els.okrEditObjective.value.trim();
  if (!objective) { showToast("请输入目标"); return; }
  const keyResults = [
    { text: els.okrEditKr1.value.trim(), confidence: "mid", progress: 0 },
    { text: els.okrEditKr2.value.trim(), confidence: "mid", progress: 0 },
    { text: els.okrEditKr3.value.trim(), confidence: "mid", progress: 0 }
  ].filter((kr) => kr.text);

  if (editingOkrId) {
    const okr = okrs.find((o) => o.id === editingOkrId);
    if (okr) {
      okr.objective = objective;
      // 保留已有进度
      keyResults.forEach((kr, idx) => {
        const existing = okr.keyResults?.[idx];
        if (existing) kr.progress = existing.progress || 0;
      });
      okr.keyResults = keyResults;
      okr.confidence = els.okrEditConfidence.value;
      okr.cycle = els.okrEditCycle.value;
    }
  } else {
    okrs.push({
      id: uid("okr"),
      objective,
      keyResults,
      confidence: els.okrEditConfidence.value,
      cycle: els.okrEditCycle.value,
      period: todayKey()
    });
  }
  saveOkrs();
  els.okrDialog.close();
  showToast("目标已保存");
  renderOkrList();
  renderBadges();
}

function deleteOkr(okrId) {
  if (!window.confirm("确认删除这个目标？")) return;
  okrs = okrs.filter((o) => o.id !== okrId);
  saveOkrs();
  showToast("目标已删除");
  renderOkrList();
  renderBadges();
}

function updateKrProgress(okrId, krIndex, value) {
  const okr = okrs.find((o) => o.id === okrId);
  if (!okr || !okr.keyResults[krIndex]) return;
  okr.keyResults[krIndex].progress = Math.min(Math.max(parseInt(value) || 0, 0), 100);
  saveOkrs();
  renderOkrList();
  renderBadges();
}

function toggleOkrAiPanel() {
  if (!els.okrAiPanel) return;
  const showing = els.okrAiPanel.style.display !== "none";
  els.okrAiPanel.style.display = showing ? "none" : "block";
  if (!showing && els.okrAiInput) els.okrAiInput.focus();
}

async function generateOkrByAi() {
  if (!els.okrAiInput) return;
  const goal = els.okrAiInput.value.trim();
  if (!goal) { showToast("请先输入你的目标"); return; }

  const resultDiv = els.okrAiResult;
  resultDiv.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div><p style="text-align:center;color:var(--muted);font-size:13px;">AI 正在拆解目标...</p>';

  try {
    const res = await fetch("/api/okr/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, provider: state.aiProvider || "auto" })
    });
    const data = await res.json();

    if (!data.ok) {
      resultDiv.innerHTML = `<p style="color:var(--red)">生成失败：${esc(data.error || "未知错误")}</p>`;
      return;
    }

    if (data.mode === "trae-bridge") {
      resultDiv.innerHTML = renderTraeBridgeCard(data.traePrompt || "请使用 TRAE 的 AI 能力帮我拆解以下目标为 OKR：\n\n" + goal, "okr");
      return;
    }

    const parsed = parseOkrAiResult(data.answer);
    if (!parsed.objective || !parsed.keyResults.length) {
      resultDiv.innerHTML = `<p style="color:var(--orange)">AI 返回格式异常，已展示原始内容：</p><pre style="white-space:pre-wrap;font-size:13px;">${esc(data.answer)}</pre>`;
      return;
    }

    // 渲染预览卡片
    resultDiv.innerHTML = `
      <div class="okr-ai-okr-card">
        <h5>🎯 ${esc(parsed.objective)}</h5>
        <ul>
          ${parsed.keyResults.map(kr => `<li>${esc(kr)}</li>`).join("")}
        </ul>
        <div class="okr-ai-actions">
          <button class="primary-btn" id="okrAiUseResult">采用此 OKR</button>
          <button class="ghost-btn" id="okrAiRegenerate">重新生成</button>
        </div>
      </div>
    `;

    // 绑定采用按钮
    const useBtn = resultDiv.querySelector("#okrAiUseResult");
    if (useBtn) {
      useBtn.addEventListener("click", () => {
        okrs.push({
          id: uid("okr"),
          objective: parsed.objective,
          keyResults: parsed.keyResults.map(text => ({ text, confidence: "mid", progress: 0 })),
          confidence: "mid",
          cycle: state.okrCycle || "quarter",
          period: todayKey(),
          source: "ai"
        });
        saveOkrs();
        renderOkrList();
        renderBadges();
        els.okrAiPanel.style.display = "none";
        els.okrAiInput.value = "";
        resultDiv.innerHTML = "";
        showToast("AI 拆解的 OKR 已保存");
      });
    }

    const regenBtn = resultDiv.querySelector("#okrAiRegenerate");
    if (regenBtn) {
      regenBtn.addEventListener("click", generateOkrByAi);
    }

  } catch (err) {
    resultDiv.innerHTML = `<p style="color:var(--red)">请求失败：${esc(err.message)}</p>`;
  }
}

function parseOkrAiResult(answer) {
  const text = String(answer || "");
  // 尝试匹配 Objective / 目标 / O:
  const objectiveMatch = text.match(/(?:Objective|目标|O)[：:]\s*(.+)/i);
  const objective = objectiveMatch ? objectiveMatch[1].trim() : "";

  // 尝试匹配 KR / 关键结果 / K:
  const keyResults = [];
  const krRegex = /(?:KR\d*|关键结果\d*|K\d*)[：:]\s*(.+)/gi;
  let m;
  while ((m = krRegex.exec(text)) !== null) {
    keyResults.push(m[1].trim());
  }

  // 如果没匹配到，退化为行解析
  if (!objective && !keyResults.length) {
    const lines = text.split(/\n/).filter(l => l.trim());
    if (lines.length >= 2) {
      return { objective: lines[0].replace(/^[#\s*-]+/, "").trim(), keyResults: lines.slice(1).map(l => l.replace(/^[#\s*-]+/, "").trim()).filter(Boolean) };
    }
  }

  // 如果没提取到 objective 但有关键结果，用第一行作为 objective
  if (!objective && keyResults.length) {
    const firstLine = text.split(/\n/)[0]?.replace(/^[#\s*-]+/, "").trim();
    return { objective: firstLine || "AI 生成目标", keyResults };
  }

  return { objective: objective || "AI 生成目标", keyResults };
}

function renderBadges() {
  if (!els.badgeGrid) return;
  const completedOkrs = okrs.filter((o) => {
    const avg = o.keyResults && o.keyResults.length
      ? o.keyResults.reduce((s, kr) => s + (kr.progress || 0), 0) / o.keyResults.length
      : 0;
    return avg >= 100;
  }).length;

  const totalKRs = okrs.reduce((sum, o) => sum + (o.keyResults?.length || 0), 0);
  const avgProgress = okrs.length > 0
    ? okrs.reduce((sum, o) => {
        const avg = o.keyResults && o.keyResults.length
          ? o.keyResults.reduce((s, kr) => s + (kr.progress || 0), 0) / o.keyResults.length
          : 0;
        return sum + avg;
      }, 0) / okrs.length
    : 0;

  const badges = [
    { icon: "🏆", name: "初出茅庐", unlocked: okrs.length >= 1, desc: "创建第一个目标" },
    { icon: "🌟", name: "小有所成", unlocked: okrs.length >= 3, desc: "创建 3 个目标" },
    { icon: "🚀", name: "目标达人", unlocked: okrs.length >= 5, desc: "创建 5 个目标" },
    { icon: "💪", name: "完成高手", unlocked: completedOkrs >= 1, desc: "完成一个目标" },
    { icon: "🔥", name: "进度王者", unlocked: avgProgress >= 80, desc: "平均进度达 80%" },
    { icon: "🎯", name: "关键结果", unlocked: totalKRs >= 10, desc: "累计创建 10 个 KR" },
    { icon: "🤖", name: "AI 共创", unlocked: okrs.some(o => o.source === "ai"), desc: "使用 AI 拆解目标" },
    { icon: "🏅", name: "大满贯", unlocked: completedOkrs >= 3, desc: "完成 3 个目标" }
  ];

  els.badgeGrid.innerHTML = badges.map((b) => `
    <div class="badge-item ${b.unlocked ? "" : "empty-badge"}" title="${esc(b.desc)}">
      ${b.icon}
      <small>${esc(b.name)}</small>
    </div>
  `).join("");
}

/* ════════════════════════════════════════════════════════════════════
 * 9. 英语学习 - 背单词
 * ════════════════════════════════════════════════════════════════════ */

function getVocabWords() {
  const sceneWords = vocabStore.words.filter((w) => w.scene === vocabState.scene);
  return sceneWords.length ? sceneWords : (DEFAULT_VOCAB[vocabState.scene] || []);
}

function renderVocab() {
  const words = getVocabWords();
  if (!words.length) {
    if (els.vocabWord) els.vocabWord.textContent = "暂无单词";
    return;
  }
  if (vocabState.currentWordIndex >= words.length) vocabState.currentWordIndex = 0;
  const word = words[vocabState.currentWordIndex];
  if (els.vocabWord) els.vocabWord.textContent = word.word;
  if (els.vocabPhonetic) els.vocabPhonetic.textContent = word.phonetic || "";
  if (els.vocabWordBack) els.vocabWordBack.textContent = word.word;
  if (els.vocabPhoneticBack) els.vocabPhoneticBack.textContent = word.phonetic || "";
  if (els.vocabMeaning) els.vocabMeaning.textContent = word.meaning || "";
  if (els.vocabExample) els.vocabExample.innerHTML = `<strong>例句：</strong>${esc(word.example || "")}`;
  if (els.vocabRoot) els.vocabRoot.innerHTML = `<strong>词根词缀：</strong>${esc(word.root || "")}`;
  vocabState.flipped = false;
  if (els.vocabCard) els.vocabCard.classList.remove("flipped");

  // 每日推荐单词（根据当天日期自动选择）
  renderDailyWord();

  // 增强统计
  renderVocabStats();
}

/* ─── 每日推荐单词 ─── */
function renderDailyWord() {
  const allWords = getVocabWords();
  if (!allWords.length) return;
  // 用当天日期作为种子，从全部单词中选一个
  const today = new Date();
  const daySeed = today.getFullYear() * 1000 + (today.getMonth() + 1) * 50 + today.getDate();
  const dailyIdx = daySeed % allWords.length;
  const dailyWord = allWords[dailyIdx];

  // 查找或创建每日推荐显示区域
  let dailyEl = document.getElementById("vocabDailyWord");
  if (!dailyEl) {
    // 在 vocabCard 上方插入每日推荐区域
    const card = els.vocabCard;
    if (!card || !card.parentNode) return;
    dailyEl = document.createElement("div");
    dailyEl.id = "vocabDailyWord";
    dailyEl.style.cssText = "padding:10px 14px;margin-bottom:12px;background:linear-gradient(135deg,var(--blue),var(--purple));color:#fff;border-radius:12px;font-size:13px;";
    card.parentNode.insertBefore(dailyEl, card);
  }
  dailyEl.innerHTML = `
    <span style="display:inline-block;background:rgba(255,255,255,0.25);padding:2px 8px;border-radius:10px;font-size:11px;margin-right:8px;">🌟 今日推荐</span>
    <strong style="font-size:16px;">${esc(dailyWord.word)}</strong>
    <span style="opacity:0.9;margin-left:8px;">${esc(dailyWord.phonetic || "")}</span>
    <span style="display:block;margin-top:4px;opacity:0.95;">${esc(dailyWord.meaning || "")}</span>
  `;
}

/* ─── 增强复习统计 ─── */
function renderVocabStats() {
  const now = Date.now();
  const todayStr = new Date().toDateString();
  // 今日新学：今日添加的单词数
  const todayNew = vocabStore.words.filter((w) => {
    if (!w.createdAt) return false;
    return new Date(w.createdAt).toDateString() === todayStr;
  }).length;
  // 待复习：nextReview <= now
  const toReview = vocabStore.words.filter((w) => {
    if (!w.nextReview) return false;
    return new Date(w.nextReview).getTime() <= now;
  }).length;
  // 已掌握：reviewCount >= 3 且最后一次 review === "know"
  const mastered = vocabStore.words.filter((w) => {
    return (w.reviewCount || 0) >= 3 && w.lastReviewResult === "know";
  }).length;
  const total = vocabStore.words.length;

  // 更新原有统计元素
  if (els.vocabNewCount) els.vocabNewCount.textContent = todayNew;
  if (els.vocabReviewCount) els.vocabReviewCount.textContent = toReview;
  if (els.vocabTotalCount) els.vocabTotalCount.textContent = total;

  // 动态插入更丰富的统计区域
  let statsEl = document.getElementById("vocabRichStats");
  if (!statsEl) {
    const card = els.vocabCard;
    if (!card || !card.parentNode) return;
    statsEl = document.createElement("div");
    statsEl.id = "vocabRichStats";
    statsEl.style.cssText = "display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0;";
    card.parentNode.insertBefore(statsEl, card.nextSibling);
  }
  statsEl.innerHTML = `
    <div style="text-align:center;padding:8px;background:var(--bg2);border-radius:8px;">
      <div style="font-size:20px;font-weight:700;color:var(--blue);">${todayNew}</div>
      <div style="font-size:11px;color:var(--text2);">今日新学</div>
    </div>
    <div style="text-align:center;padding:8px;background:var(--bg2);border-radius:8px;">
      <div style="font-size:20px;font-weight:700;color:var(--orange);">${toReview}</div>
      <div style="font-size:11px;color:var(--text2);">待复习</div>
    </div>
    <div style="text-align:center;padding:8px;background:var(--bg2);border-radius:8px;">
      <div style="font-size:20px;font-weight:700;color:var(--green);">${mastered}</div>
      <div style="font-size:11px;color:var(--text2);">已掌握</div>
    </div>
    <div style="text-align:center;padding:8px;background:var(--bg2);border-radius:8px;">
      <div style="font-size:20px;font-weight:700;color:var(--purple);">${total}</div>
      <div style="font-size:11px;color:var(--text2);">总词汇量</div>
    </div>
  `;
}

function flipVocabCard() {
  vocabState.flipped = !vocabState.flipped;
  if (els.vocabCard) els.vocabCard.classList.toggle("flipped", vocabState.flipped);
}

function switchVocabScene(scene) {
  vocabState.scene = scene;
  vocabState.currentWordIndex = 0;
  document.querySelectorAll(".vocab-scene-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(`.vocab-scene-btn[data-scene="${scene}"]`).forEach((b) => b.classList.add("active"));
  renderVocab();
}

function reviewVocab(review) {
  const words = getVocabWords();
  const word = words[vocabState.currentWordIndex];
  if (!word) return;
  // 记录复习结果
  if (review === "know") vocabStore.review.known = (vocabStore.review.known || 0) + 1;
  else if (review === "unknown") vocabStore.review.unknown = (vocabStore.review.unknown || 0) + 1;
  else if (review === "fuzzy") vocabStore.review.fuzzy = (vocabStore.review.fuzzy || 0) + 1;

  // 艾宾浩斯复习算法：记录下次复习时间
  const intervals = { know: 7 * 24 * 60 * 60 * 1000, fuzzy: 1 * 24 * 60 * 60 * 1000, unknown: 0 };
  word.lastReview = new Date().toISOString();
  word.nextReview = new Date(Date.now() + intervals[review]).toISOString();
  word.reviewCount = (word.reviewCount || 0) + 1;
  word.lastReviewResult = review; // 记录最后一次复习结果，用于"已掌握"统计

  saveVocab();
  showToast(review === "know" ? "标记为认识" : review === "unknown" ? "标记为不认识" : "标记为模糊");

  // 不认识或模糊的单词自动加入错题本
  if (review === "unknown" || review === "fuzzy") {
    addMistakeAuto("词汇", word.word, word.meaning || "", `音标：${word.phonetic || ""}；例句：${word.example || ""}`, "背单词");
  }

  // 下一个单词
  vocabState.currentWordIndex = (vocabState.currentWordIndex + 1) % words.length;
  renderVocab();
}

function openVocabDialog() {
  if (!els.vocabDialog) return;
  editingVocabId = null;
  els.vocabEditWord.value = "";
  els.vocabEditPhonetic.value = "";
  els.vocabEditMeaning.value = "";
  els.vocabEditExample.value = "";
  els.vocabEditRoot.value = "";
  els.vocabEditScene.value = vocabState.scene;
  els.vocabDialog.showModal();
}

function saveVocabFromDialog() {
  if (!els.vocabEditWord) return;
  const word = els.vocabEditWord.value.trim();
  if (!word) { showToast("请输入单词"); return; }
  const newWord = {
    id: uid("vocab"),
    word,
    phonetic: els.vocabEditPhonetic.value.trim(),
    meaning: els.vocabEditMeaning.value.trim(),
    example: els.vocabEditExample.value.trim(),
    root: els.vocabEditRoot.value.trim(),
    scene: els.vocabEditScene.value,
    createdAt: new Date().toISOString() // 记录添加时间，用于"今日新学"统计
  };
  vocabStore.words.push(newWord);
  saveVocab();
  els.vocabDialog.close();
  showToast("单词已添加");
  renderVocab();
}

async function vocabAiHelp(action) {
  const words = getVocabWords();
  const word = words[vocabState.currentWordIndex];
  if (!word) { showToast("没有当前单词"); return; }
  showToast("AI 正在生成...");
  try {
    const response = await fetch("/api/english/word-helper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: word.word, action })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "AI 辅助失败");

    // TRAE桥接模式
    if (result.mode === "trae-bridge") {
      showVocabAiResult("trae-bridge", "TRAE 桥接模式", result.traePrompt + "\n\n【说明】" + (result.fallbackReason || "请复制上方指令到 TRAE 执行"));
      showToast("已切换为TRAE桥接模式");
      return;
    }

    if (action === "example" && result.result?.examples) {
      // 在词汇卡片下方显示 AI 生成的例句列表
      showVocabAiResult("example", "AI 生成例句", result.result.examples);
      showToast("已生成例句");
    } else if (action === "etymology" && result.result) {
      // 更新词根词缀显示区域
      const etymText = typeof result.result === "string" ? result.result : (result.result.etymology || result.result.explanation || JSON.stringify(result.result));
      if (els.vocabRoot) els.vocabRoot.innerHTML = `<strong>词根词缀：</strong>${esc(etymText)}`;
      // 同时在 AI 结果区域展示
      showVocabAiResult("etymology", "AI 词源解析", etymText);
      showToast("词根词缀已更新");
    } else if (action === "usage" && result.result) {
      // 在词汇卡片下方显示用法说明
      const usageText = typeof result.result === "string" ? result.result : (result.result.usage || result.result.explanation || JSON.stringify(result.result));
      showVocabAiResult("usage", "AI 用法说明", usageText);
      showToast("已生成用法说明");
    } else {
      // 兜底：在 AI 结果区域展示
      const fallbackText = typeof result.result === "string" ? result.result : JSON.stringify(result.result);
      showVocabAiResult("other", "AI 辅助结果", fallbackText);
      showToast("AI 结果已生成");
    }
  } catch (error) {
    showToast("AI 辅助失败：" + error.message);
  }
}

/* ─── 在词汇卡片下方显示 AI 辅助结果 ─── */
function showVocabAiResult(type, title, content) {
  const card = els.vocabCard;
  if (!card || !card.parentNode) {
    console.log("AI 结果（无卡片容器）：", content);
    return;
  }
  // 查找或创建 .vocab-ai-result 区域
  let aiBox = document.querySelector(".vocab-ai-result");
  if (!aiBox) {
    aiBox = document.createElement("div");
    aiBox.className = "vocab-ai-result";
    aiBox.style.cssText = "margin-top:12px;padding:12px;background:var(--bg2);border-left:3px solid var(--blue);border-radius:8px;font-size:13px;";
    card.parentNode.insertBefore(aiBox, card.nextSibling);
  }
  let innerHtml = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
    <strong style="color:var(--blue);">🤖 ${esc(title)}</strong>
    <button onclick="this.parentNode.parentNode.style.display='none'" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:14px;">✕</button>
  </div>`;
  if (Array.isArray(content)) {
    // 例句列表
    innerHtml += "<ol style='margin:0;padding-left:20px;line-height:1.8;'>";
    content.forEach((item) => {
      const text = typeof item === "string" ? item : (item.sentence || item.example || item.text || JSON.stringify(item));
      innerHtml += `<li>${esc(text)}</li>`;
    });
    innerHtml += "</ol>";
  } else {
    innerHtml += `<div style="line-height:1.7;color:var(--text1);">${esc(String(content))}</div>`;
  }
  aiBox.innerHTML = innerHtml;
  aiBox.style.display = "block";
}

/* ════════════════════════════════════════════════════════════════════
 * 10. 英语学习 - 影子跟读
 * ════════════════════════════════════════════════════════════════════ */

/* 获取过滤后的影子跟读句子列表 */
function getFilteredShadowingSentences() {
  if (shadowingState.difficulty === "全部") return SHADOWING_SENTENCES;
  return SHADOWING_SENTENCES.filter((s) => s.level === shadowingState.difficulty);
}

/* 获取影子跟读当前句子文本 */
function getShadowingText() {
  const list = getFilteredShadowingSentences();
  if (!list.length) return "";
  const idx = shadowingState.currentIndex % list.length;
  return list[idx]?.text || "";
}

/* 获取当前影子跟读句子对象 */
function getShadowingItem() {
  const list = getFilteredShadowingSentences();
  if (!list.length) return null;
  const idx = shadowingState.currentIndex % list.length;
  return list[idx];
}

/* 确保影子跟读导航按钮存在 */
function ensureShadowingFeedback() {
  const panel = document.getElementById("shadowingPanel") || els.shadowingPanel;
  if (!panel) return;
  if (!document.getElementById("shadowingFeedback")) {
    const fb = document.createElement("div");
    fb.id = "shadowingFeedback";
    fb.style.cssText = "margin-top:10px;padding:10px;background:var(--bg2);border-radius:10px;font-size:13px;display:none;color:var(--text2);";
    panel.appendChild(fb);
  }
}

function renderShadowing() {
  ensureShadowingFeedback();
  const list = getFilteredShadowingSentences();
  if (!list.length) {
    if (els.shadowingSentence) els.shadowingSentence.textContent = "当前难度暂无句子";
    return;
  }
  if (shadowingState.currentIndex >= list.length) shadowingState.currentIndex = 0;
  const text = getShadowingText();
  shadowingState.currentSentence = text;
  if (els.shadowingSentence) els.shadowingSentence.textContent = text;
  // 更新导航计数
  const counter = document.getElementById("shadowingCounter");
  if (counter) counter.textContent = `${shadowingState.currentIndex + 1}/${list.length}`;
  // 更新难度标签
  const item = getShadowingItem();
  const levelTag = document.getElementById("shadowingLevelTag");
  if (levelTag && item) {
    levelTag.textContent = item.level || "";
    if (item.level === "简单") levelTag.style.background = "var(--green)";
    else if (item.level === "中等") levelTag.style.background = "var(--orange)";
    else if (item.level === "困难") levelTag.style.background = "var(--pink)";
  }
  // 重置评分
  if (els.scoreAccuracyVal) els.scoreAccuracyVal.textContent = "--";
  if (els.scoreFluencyVal) els.scoreFluencyVal.textContent = "--";
  if (els.scoreRhythmVal) els.scoreRhythmVal.textContent = "--";
  if (els.scoreAccuracy) els.scoreAccuracy.setAttribute("stroke-dasharray", "0 214");
  if (els.scoreFluency) els.scoreFluency.setAttribute("stroke-dasharray", "0 214");
  if (els.scoreRhythm) els.scoreRhythm.setAttribute("stroke-dasharray", "0 214");
  // 隐藏 feedback
  const fb = document.getElementById("shadowingFeedback");
  if (fb) fb.style.display = "none";
}

function prevShadowingSentence() {
  const list = getFilteredShadowingSentences();
  const len = list.length || 1;
  shadowingState.currentIndex = (shadowingState.currentIndex - 1 + len) % len;
  renderShadowing();
}

function nextShadowingSentence() {
  const list = getFilteredShadowingSentences();
  const len = list.length || 1;
  shadowingState.currentIndex = (shadowingState.currentIndex + 1) % len;
  renderShadowing();
}

function shuffleShadowing() {
  const list = getFilteredShadowingSentences();
  if (!list.length) return;
  shadowingState.currentIndex = Math.floor(Math.random() * list.length);
  renderShadowing();
  showToast("已随机切换句子");
}

function filterShadowingByDifficulty(diff) {
  shadowingState.difficulty = diff;
  shadowingState.currentIndex = 0;
  // 更新按钮状态
  document.querySelectorAll(".shadowing-difficulty-filter .speed-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.diff === diff);
  });
  renderShadowing();
}

function playShadowing() {
  // 使用 Web Speech API 播放
  if (!("speechSynthesis" in window)) { showToast("浏览器不支持语音播放"); return; }
  const utterance = new SpeechSynthesisUtterance(shadowingState.currentSentence);
  utterance.lang = "en-US";
  utterance.rate = shadowingState.speed === "slow" ? 0.6 : 1.0;
  speechSynthesis.speak(utterance);
  showToast("正在播放原音");
}

function toggleShadowingRecord() {
  shadowingState.recording = !shadowingState.recording;
  if (els.shadowingRecordBtn) {
    els.shadowingRecordBtn.innerHTML = shadowingState.recording ? "⏹ 停止录音" : "🎤 开始录音";
  }
  if (shadowingState.recording) {
    showToast("录音中...（占位）");
  } else {
    showToast("录音结束，正在 AI 评分...");
    simulateShadowingScore();
  }
}

async function simulateShadowingScore() {
  // 调用 /api/ai/chat 让 AI 模拟评分反馈
  let feedbackText = "";
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `请作为英语口语教练，对我跟读以下句子的表现给出三维度评分（准确度、流利度、节奏，0-100 分）和简短反馈：\n\n${shadowingState.currentSentence}\n\n请输出 JSON：{"accuracy": 85, "fluency": 80, "rhythm": 75, "feedback": "..."}`,
        history: [],
        provider: "auto"
      })
    });
    const result = await response.json();
    if (result.ok) {
      // 尝试解析 JSON 评分
      const match = String(result.answer).match(/\{[\s\S]*\}/);
      if (match) {
        const scores = JSON.parse(match[0]);
        feedbackText = scores.feedback || "";
        updateShadowingScore(scores.accuracy || 75, scores.fluency || 75, scores.rhythm || 75, feedbackText);
        showToast("AI 评分完成");
        return;
      }
    }
  } catch (e) {
    // 静默失败
  }
  // 占位评分
  updateShadowingScore(78, 72, 75, "");
  showToast("AI 评分完成（占位数据）");
}

function updateShadowingScore(accuracy, fluency, rhythm, feedback) {
  const circumference = 2 * Math.PI * 34;
  if (els.scoreAccuracyVal) els.scoreAccuracyVal.textContent = accuracy;
  if (els.scoreFluencyVal) els.scoreFluencyVal.textContent = fluency;
  if (els.scoreRhythmVal) els.scoreRhythmVal.textContent = rhythm;
  if (els.scoreAccuracy) els.scoreAccuracy.setAttribute("stroke-dasharray", `${circumference * accuracy / 100} ${circumference}`);
  if (els.scoreFluency) els.scoreFluency.setAttribute("stroke-dasharray", `${circumference * fluency / 100} ${circumference}`);
  if (els.scoreRhythm) els.scoreRhythm.setAttribute("stroke-dasharray", `${circumference * rhythm / 100} ${circumference}`);
  // 显示 AI 反馈文本
  if (feedback) {
    const fb = document.getElementById("shadowingFeedback");
    if (fb) {
      fb.innerHTML = `<strong>💬 AI 反馈：</strong><br>${esc(feedback)}`;
      fb.style.display = "block";
    }
  }
}

/* ════════════════════════════════════════════════════════════════════
 * 10b. 英语学习 - 场景词库（亲子/商务/托业）
 * ════════════════════════════════════════════════════════════════════ */

const SCENE_VOCAB_MAP = {
  "亲子英语": { scene: "parenting", title: "亲子英语词库", desc: "涵盖日常育儿、喂养、出行、健康等场景的高频词汇，适合亲子共学", color: "pink" },
  "商务英语": { scene: "business", title: "商务英语词库", desc: "覆盖会议、邮件、谈判、汇报、财务等职场核心词汇", color: "blue" },
  "托业考试": { scene: "toeic", title: "托业考试词库", desc: "TOEIC 高频商务词汇，涵盖听力Part1-2和阅读核心考点", color: "purple" },
  "日常英语": { scene: "daily", title: "日常英语词库", desc: "涵盖购物、家务、通勤、预约等日常生活高频词汇，实用性强", color: "green" },
  "旅行英语": { scene: "travel", title: "旅行英语词库", desc: "覆盖机场、酒店、海关、景点等旅行全场景核心词汇", color: "orange" },
  "科技英语": { scene: "tech", title: "科技英语词库", desc: "覆盖算法、云计算、网络安全、数据库等IT互联网核心技术词汇", color: "teal" },
  "学术英语": { scene: "academic", title: "学术英语词库", desc: "涵盖论文写作、研究方法、学术引用等学术场景高频词汇", color: "purple" },
  "四级词汇": { scene: "cet4", title: "大学英语四级词库", desc: "CET-4 高频核心词汇，覆盖考试大纲重点词汇", color: "blue" },
  "六级词汇": { scene: "cet6", title: "大学英语六级词库", desc: "CET-6 高频核心词汇，覆盖六级考试难点词汇", color: "pink" }
};

function getSceneVocabWords(sceneKey) {
  const defaults = DEFAULT_VOCAB[sceneKey] || [];
  const userAdded = vocabStore.words.filter((w) => w.scene === sceneKey);
  return [...defaults, ...userAdded];
}

function renderSceneVocabPanel(tabName) {
  const config = SCENE_VOCAB_MAP[tabName];
  if (!config) return;
  sceneVocabState.scene = config.scene;

  // 加载已学记录
  const learnedKey = "olivia_scene_vocab_learned_" + config.scene;
  sceneVocabState.learnedIds = readLS(learnedKey, []);

  const words = getSceneVocabWords(config.scene);
  if (!words.length) {
    if (els.sceneVocabCardArea) {
      els.sceneVocabCardArea.innerHTML = '<div class="empty"><p>暂无词库数据</p></div>';
    }
    return;
  }

  if (sceneVocabState.currentIndex >= words.length) sceneVocabState.currentIndex = 0;
  sceneVocabState.flipped = false;

  // 更新标题和说明
  if (els.sceneVocabTitle) els.sceneVocabTitle.textContent = config.title;
  if (els.sceneVocabDesc) els.sceneVocabDesc.textContent = config.desc;

  // 统计
  const learnedCount = sceneVocabState.learnedIds.length;
  const totalCount = words.length;
  const progress = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;
  if (els.sceneVocabStats) {
    els.sceneVocabStats.innerHTML = `
      <div class="scene-vocab-stat"><strong style="color:var(--blue);">${totalCount}</strong><span>总词汇</span></div>
      <div class="scene-vocab-stat"><strong style="color:var(--green);">${learnedCount}</strong><span>已学习</span></div>
      <div class="scene-vocab-stat"><strong style="color:var(--orange);">${progress}%</strong><span>进度</span></div>
    `;
  }

  // 进度条
  if (els.sceneVocabProgress) {
    els.sceneVocabProgress.innerHTML = `
      <span>学习进度：${learnedCount}/${totalCount}</span>
      <div class="scene-vocab-progress-bar">
        <div class="scene-vocab-progress-fill" style="width:${progress}%;"></div>
      </div>
    `;
  }

  // 计数器
  if (els.sceneVocabCounter) {
    els.sceneVocabCounter.textContent = `${sceneVocabState.currentIndex + 1}/${totalCount}`;
  }

  renderSceneVocabCard(words[sceneVocabState.currentIndex]);
}

function renderSceneVocabCard(word) {
  if (!word || !els.sceneVocabCardArea) return;
  const isLearned = sceneVocabState.learnedIds.includes(word.id);
  els.sceneVocabCardArea.innerHTML = `
    <div class="scene-vocab-card" id="sceneVocabCard" onclick="flipSceneVocabCard()">
      <div class="scene-vocab-card-inner">
        <div class="scene-vocab-card-front">
          ${isLearned ? '<span style="position:absolute;top:12px;right:14px;font-size:12px;color:var(--green);">✓ 已学习</span>' : ''}
          <div class="scene-vocab-word">${esc(word.word)}</div>
          <div class="scene-vocab-phonetic">${esc(word.phonetic || "")}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:8px;">点击卡片翻面查看释义</div>
          <div class="scene-vocab-card-actions">
            <button class="ghost-btn" onclick="event.stopPropagation();playSceneVocabPronunciation('${esc(word.word)}')">&#x1F50A; 播放发音</button>
          </div>
        </div>
        <div class="scene-vocab-card-back">
          <div class="scene-vocab-word">${esc(word.word)}</div>
          <div class="scene-vocab-phonetic">${esc(word.phonetic || "")}</div>
          <div class="scene-vocab-meaning">${esc(word.meaning || "")}</div>
          <div class="scene-vocab-example">${esc(word.example || "")}</div>
          ${word.root ? `<div class="scene-vocab-root">${esc(word.root)}</div>` : ""}
          <div class="scene-vocab-card-actions">
            <button class="ghost-btn" onclick="event.stopPropagation();playSceneVocabPronunciation('${esc(word.word)}')">&#x1F50A; 发音</button>
            <button class="ghost-btn" onclick="event.stopPropagation();sceneVocabAiHelp('${esc(word.word)}')">&#x1F916; AI辅助</button>
            <button class="primary-btn" onclick="event.stopPropagation();markSceneVocabLearned('${esc(word.id)}')">&#x2705; 标记已学</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function flipSceneVocabCard() {
  sceneVocabState.flipped = !sceneVocabState.flipped;
  const card = document.getElementById("sceneVocabCard");
  if (card) card.classList.toggle("flipped", sceneVocabState.flipped);
}

function playSceneVocabPronunciation(word) {
  if (!("speechSynthesis" in window)) { showToast("浏览器不支持语音播放"); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  u.rate = 0.85;
  speechSynthesis.speak(u);
}

function nextSceneVocab() {
  const words = getSceneVocabWords(sceneVocabState.scene);
  if (!words.length) return;
  sceneVocabState.currentIndex = (sceneVocabState.currentIndex + 1) % words.length;
  sceneVocabState.flipped = false;
  if (els.sceneVocabCounter) {
    els.sceneVocabCounter.textContent = `${sceneVocabState.currentIndex + 1}/${words.length}`;
  }
  renderSceneVocabCard(words[sceneVocabState.currentIndex]);
}

function prevSceneVocab() {
  const words = getSceneVocabWords(sceneVocabState.scene);
  if (!words.length) return;
  sceneVocabState.currentIndex = (sceneVocabState.currentIndex - 1 + words.length) % words.length;
  sceneVocabState.flipped = false;
  if (els.sceneVocabCounter) {
    els.sceneVocabCounter.textContent = `${sceneVocabState.currentIndex + 1}/${words.length}`;
  }
  renderSceneVocabCard(words[sceneVocabState.currentIndex]);
}

function shuffleSceneVocab() {
  const words = getSceneVocabWords(sceneVocabState.scene);
  if (!words.length) return;
  sceneVocabState.currentIndex = Math.floor(Math.random() * words.length);
  sceneVocabState.flipped = false;
  if (els.sceneVocabCounter) {
    els.sceneVocabCounter.textContent = `${sceneVocabState.currentIndex + 1}/${words.length}`;
  }
  renderSceneVocabCard(words[sceneVocabState.currentIndex]);
  showToast("已随机切换");
}

function markSceneVocabLearned(wordId) {
  if (!sceneVocabState.learnedIds.includes(wordId)) {
    sceneVocabState.learnedIds.push(wordId);
    const learnedKey = "olivia_scene_vocab_learned_" + sceneVocabState.scene;
    saveLS(learnedKey, sceneVocabState.learnedIds);
    showToast("已标记为学习过");
    // 刷新统计
    const tabName = Object.keys(SCENE_VOCAB_MAP).find((k) => SCENE_VOCAB_MAP[k].scene === sceneVocabState.scene);
    if (tabName) renderSceneVocabPanel(tabName);
  } else {
    showToast("这个词已经学过了");
  }
}

async function sceneVocabAiHelp(word) {
  showToast("AI 正在生成辅助内容...");
  try {
    const response = await fetch("/api/english/word-helper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: word, action: "usage" })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "AI 辅助失败");

    // TRAE桥接模式
    if (result.mode === "trae-bridge") {
      let aiBox = document.querySelector(".scene-vocab-ai-result");
      if (!aiBox) {
        aiBox = document.createElement("div");
        aiBox.className = "scene-vocab-ai-result";
        aiBox.style.cssText = "margin-top:12px;padding:14px;background:var(--panel-soft);border-left:3px solid var(--orange);border-radius:10px;font-size:13px;line-height:1.7;";
        els.sceneVocabCardArea.appendChild(aiBox);
      }
      aiBox.innerHTML = buildTraeBridgeUI(result.traePrompt, result.fallbackReason);
      showToast("已切换为TRAE桥接模式");
      return;
    }

    const usageText = typeof result.result === "string" ? result.result : (result.result.usage || result.result.explanation || JSON.stringify(result.result));
    // 在卡片下方显示 AI 结果
    let aiBox = document.querySelector(".scene-vocab-ai-result");
    if (!aiBox) {
      aiBox = document.createElement("div");
      aiBox.className = "scene-vocab-ai-result";
      aiBox.style.cssText = "margin-top:12px;padding:14px;background:var(--panel-soft);border-left:3px solid var(--blue);border-radius:10px;font-size:13px;line-height:1.7;";
      els.sceneVocabCardArea.appendChild(aiBox);
    }
    aiBox.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="color:var(--blue);">🤖 AI 用法解析：${esc(word)}</strong>
        <button onclick="this.parentNode.parentNode.style.display='none'" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--muted);">✕</button>
      </div>
      <div>${esc(usageText)}</div>
    `;
    aiBox.style.display = "block";
    showToast("AI 解析已生成");
  } catch (error) {
    showToast("AI 辅助失败：" + error.message);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * 11. 英语学习 - 听力训练
 * ════════════════════════════════════════════════════════════════════ */

/* 获取过滤后的听力句子列表 */
function getFilteredListeningSentences() {
  if (listeningState.sceneFilter === "全部") return LISTENING_SENTENCES;
  return LISTENING_SENTENCES.filter((s) => s.scene === listeningState.sceneFilter);
}

/* 获取听力句子文本 */
function getListeningText(index) {
  const list = getFilteredListeningSentences();
  if (!list.length) return "";
  const idx = index !== undefined ? index : listeningState.currentIndex;
  return list[idx % list.length]?.text || "";
}

/* 获取听力句子对象 */
function getListeningItem(index) {
  const list = getFilteredListeningSentences();
  if (!list.length) return null;
  const idx = index !== undefined ? index : listeningState.currentIndex;
  return list[idx % list.length];
}

/* 确保听力导航按钮存在 */
function ensureListeningNav() {
  const panel = document.getElementById("listeningPanel") || els.listeningPanel;
  if (!panel) return;
  if (document.getElementById("listeningNav")) return; // 已存在
  // 在听写区域下方插入导航
  const nav = document.createElement("div");
  nav.id = "listeningNav";
  nav.style.cssText = "display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap;";
  nav.innerHTML = `
    <button class="btn btn-sm" onclick="prevDictationSentence()">◀ 上一句</button>
    <span id="listeningCounter" style="font-size:13px;color:var(--text2);">1/${LISTENING_SENTENCES.length}</span>
    <button class="btn btn-sm" onclick="nextDictationSentence()">下一句 ▶</button>
    <span id="listeningSceneTag" style="font-size:12px;padding:2px 8px;border-radius:10px;background:var(--blue);color:#fff;"></span>
    <span id="listeningDiffTag" style="font-size:12px;padding:2px 8px;border-radius:10px;background:var(--orange);color:#fff;"></span>
    <button class="btn btn-sm" onclick="replayDictation()" style="margin-left:auto;">🔁 重复播放</button>
  `;
  panel.appendChild(nav);
}

function renderListening() {
  ensureListeningNav();
  const list = getFilteredListeningSentences();
  if (!list.length) {
    if (els.dictationSentence) els.dictationSentence.textContent = "当前场景暂无句子";
    return;
  }
  if (listeningState.currentIndex >= list.length) listeningState.currentIndex = 0;
  const item = getListeningItem();
  const text = item ? item.text : "";
  if (els.dictationSentence) els.dictationSentence.textContent = text;
  if (els.dictationInput) els.dictationInput.value = "";
  if (els.dictationResult) els.dictationResult.innerHTML = "";
  // 更新导航计数
  const counter = document.getElementById("listeningCounter");
  if (counter) counter.textContent = `${listeningState.currentIndex + 1}/${list.length}`;
  // 更新场景标签
  const sceneTag = document.getElementById("listeningSceneTag");
  if (sceneTag && item) {
    sceneTag.textContent = item.scene || "";
  }
  // 更新难度标签
  const diffTag = document.getElementById("listeningDiffTag");
  if (diffTag && item) {
    diffTag.textContent = item.difficulty || "";
    if (item.difficulty === "简单") diffTag.style.background = "var(--green)";
    else if (item.difficulty === "中等") diffTag.style.background = "var(--orange)";
    else if (item.difficulty === "困难") diffTag.style.background = "var(--pink)";
  }
}

function filterListeningByScene(scene) {
  listeningState.sceneFilter = scene;
  listeningState.currentIndex = 0;
  document.querySelectorAll(".listening-scene-filter .speed-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.lscene === scene);
  });
  renderListening();
}

function playDictation() {
  const text = getListeningText();
  if (!text) return;
  if (!("speechSynthesis" in window)) { showToast("浏览器不支持语音播放"); return; }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = listeningState.mode === "intensive" ? 0.8 : 1.0;
  speechSynthesis.speak(utterance);
  showToast("正在播放当前句");
}

function replayDictation() {
  // 重复播放当前句子（连播两遍，慢速模式间隔更大）
  const text = getListeningText();
  if (!text) return;
  if (!("speechSynthesis" in window)) { showToast("浏览器不支持语音播放"); return; }
  speechSynthesis.cancel();
  const rate = listeningState.mode === "intensive" ? 0.8 : 1.0;
  const u1 = new SpeechSynthesisUtterance(text);
  u1.lang = "en-US";
  u1.rate = rate;
  const u2 = new SpeechSynthesisUtterance(text);
  u2.lang = "en-US";
  u2.rate = rate;
  u1.onend = () => { setTimeout(() => speechSynthesis.speak(u2), 1500); };
  speechSynthesis.speak(u1);
  showToast("正在重复播放（两遍）");
}

function checkDictation() {
  const item = getListeningItem();
  const sentence = item ? item.text : "";
  const input = els.dictationInput ? els.dictationInput.value.trim() : "";
  if (!input) { showToast("请先输入你听到的内容"); return; }
  const similarity = computeSimilarity(input.toLowerCase(), sentence.toLowerCase());
  const result = els.dictationResult;
  if (!result) return;

  // 高亮差异对比
  let diffHtml = buildDiffHighlight(input, sentence);

  if (similarity > 90) {
    result.innerHTML = `<p style="color:var(--green);">✓ 非常好！准确度 ${similarity}%</p><div class="dictation-diff">${diffHtml}</div>`;
  } else if (similarity > 70) {
    result.innerHTML = `<p style="color:var(--orange);">△ 还不错，准确度 ${similarity}%</p><div class="dictation-diff"><p style="font-size:12px;color:var(--text2);margin-bottom:4px;">差异对比：</p>${diffHtml}</div>`;
  } else {
    result.innerHTML = `<p style="color:var(--pink);">✗ 需要再听几遍，准确度 ${similarity}%</p><div class="dictation-diff"><p style="font-size:12px;color:var(--text2);margin-bottom:4px;">原句对比：</p>${diffHtml}</div>`;
    // 自动加入错题本
    addMistakeAuto("听写", input, sentence, `准确度${similarity}%，场景：${item?.scene || ""}`, "听力训练");
  }
  result.classList.add("show");
}

/* 逐词对比高亮 */
function buildDiffHighlight(input, original) {
  const wordsIn = input.split(/\s+/);
  const wordsOrig = original.split(/\s+/);
  const maxLen = Math.max(wordsIn.length, wordsOrig.length);
  let html = "<p style='line-height:1.8;'>";
  for (let i = 0; i < maxLen; i++) {
    const wIn = (wordsIn[i] || "").toLowerCase();
    const wOrig = (wordsOrig[i] || "").toLowerCase();
    if (wIn === wOrig) {
      html += `<span style="color:var(--green);font-weight:600;">${esc(wordsOrig[i] || "")}</span> `;
    } else if (wordsIn[i]) {
      html += `<span style="color:var(--pink);text-decoration:line-through;">${esc(wordsIn[i])}</span> `;
      html += `<span style="color:var(--green);font-weight:600;">${esc(wordsOrig[i] || "")}</span> `;
    } else {
      html += `<span style="color:var(--green);font-weight:600;">${esc(wordsOrig[i] || "")}</span> `;
    }
  }
  html += "</p>";
  return html;
}

function computeSimilarity(a, b) {
  // 简单的字串相似度计算
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);
  const setB = new Set(wordsB);
  const match = wordsA.filter((w) => setB.has(w)).length;
  return Math.round((match / Math.max(wordsB.length, 1)) * 100);
}

function nextDictationSentence() {
  const list = getFilteredListeningSentences();
  const len = list.length || 1;
  listeningState.currentIndex = (listeningState.currentIndex + 1) % len;
  renderListening();
}

function prevDictationSentence() {
  const list = getFilteredListeningSentences();
  const len = list.length || 1;
  listeningState.currentIndex = (listeningState.currentIndex - 1 + len) % len;
  renderListening();
}

function nextDictation() {
  nextDictationSentence();
  showToast("已切换到下一句");
}

/* ════════════════════════════════════════════════════════════════════
 * 12a. 英语学习 - 学习计划
 * ════════════════════════════════════════════════════════════════════ */

function renderStudyPlan() {
  const g = studyPlanStore.goals || { vocab: 20, shadow: 5, listen: 15 };

  const vocabInput = document.getElementById("planDailyVocab");
  const shadowInput = document.getElementById("planDailyShadow");
  const listenInput = document.getElementById("planDailyListen");
  if (vocabInput) vocabInput.value = g.vocab || 20;
  if (shadowInput) shadowInput.value = g.shadow || 5;
  if (listenInput) listenInput.value = g.listen || 15;

  const todayStr = new Date().toDateString();
  const todayTasks = (studyPlanStore.tasks || []).filter((t) => t.date === todayStr);
  const doneCount = todayTasks.filter((t) => t.done).length;
  const totalCount = todayTasks.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const weekDates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weekDates.push(d.toDateString());
  }
  const activeDays = weekDates.filter((ds) => (studyPlanStore.tasks || []).some((t) => t.date === ds)).length;

  if (els.planOverview) {
    els.planOverview.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;">
        <div class="plan-stat-card"><strong style="color:var(--blue);font-size:24px;">${totalCount}</strong><span>今日任务</span></div>
        <div class="plan-stat-card"><strong style="color:var(--green);font-size:24px;">${doneCount}</strong><span>已完成</span></div>
        <div class="plan-stat-card"><strong style="color:var(--orange);font-size:24px;">${progress}%</strong><span>完成率</span></div>
        <div class="plan-stat-card"><strong style="color:var(--purple);font-size:24px;">${activeDays}/7</strong><span>本周活跃</span></div>
      </div>
    `;
  }

  if (els.planTodayList) {
    if (todayTasks.length === 0) {
      els.planTodayList.innerHTML = `
        <div class="empty" style="padding:20px;">
          <p>今天还没有学习任务。</p>
          <p style="font-size:13px;color:var(--text-muted);">点击右上角「AI 生成计划」自动创建今日任务。</p>
        </div>
      `;
    } else {
      els.planTodayList.innerHTML = todayTasks.map((t) => {
        const colorMap = { "词汇": "blue", "跟读": "pink", "听力": "green", "语法": "purple", "复习": "orange", "阅读": "teal", "写作": "blue", "拓展": "purple" };
        const c = colorMap[t.type] || "blue";
        return `
        <div class="plan-task-item ${t.done ? "done" : ""}">
          <label class="plan-task-check">
            <input type="checkbox" ${t.done ? "checked" : ""} data-plan-toggle="${esc(t.id)}" />
            <span class="plan-task-type tag" style="background:var(--${c}-soft);color:var(--${c});">${esc(t.type)}</span>
            <span class="plan-task-text">${esc(t.title)}</span>
            ${t.target ? `<span style="font-size:12px;color:var(--text-muted);margin-left:auto;">目标：${esc(t.target)}</span>` : ""}
          </label>
        </div>
      `;
      }).join("");
    }
  }

  if (els.planWeekGrid) {
    const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    els.planWeekGrid.innerHTML = weekDates.map((ds) => {
      const d = new Date(ds);
      const dayName = weekDays[d.getDay()];
      const isToday = ds === todayStr;
      const dayTasks = (studyPlanStore.tasks || []).filter((t) => t.date === ds);
      const dayDone = dayTasks.filter((t) => t.done).length;
      const pct = dayTasks.length > 0 ? (dayDone / dayTasks.length) * 100 : 0;
      return `
        <div class="plan-week-cell ${isToday ? "today" : ""}">
          <div class="plan-week-day">${dayName}</div>
          <div class="plan-week-date">${d.getMonth() + 1}/${d.getDate()}</div>
          <div class="plan-week-count">${dayDone}/${dayTasks.length}</div>
          <div class="plan-week-bar" style="width:${pct}%;"></div>
        </div>
      `;
    }).join("");
  }
}

function togglePlanTask(taskId) {
  const task = (studyPlanStore.tasks || []).find((t) => t.id === taskId);
  if (!task) return;
  task.done = !task.done;
  saveStudyPlan();
  renderStudyPlan();
  showToast(task.done ? "任务已完成 ✅" : "任务已取消完成");
}

function savePlanGoals() {
  const vocabInput = document.getElementById("planDailyVocab");
  const shadowInput = document.getElementById("planDailyShadow");
  const listenInput = document.getElementById("planDailyListen");
  studyPlanStore.goals = {
    vocab: parseInt(vocabInput?.value) || 20,
    shadow: parseInt(shadowInput?.value) || 5,
    listen: parseInt(listenInput?.value) || 15
  };
  saveStudyPlan();
  showToast("学习目标已保存");
}

async function generateStudyPlan() {
  showToast("AI 正在生成学习计划...");
  const g = studyPlanStore.goals || { vocab: 20, shadow: 5, listen: 15 };
  const todayStr = new Date().toDateString();
  studyPlanStore.tasks = (studyPlanStore.tasks || []).filter((t) => t.date !== todayStr);

  const baseTasks = [
    { id: uid("plan"), type: "词汇", title: `背 ${g.vocab} 个新单词（含复习）`, target: `${g.vocab}词`, done: false, date: todayStr },
    { id: uid("plan"), type: "跟读", title: `影子跟读练习 ${g.shadow} 句`, target: `${g.shadow}句`, done: false, date: todayStr },
    { id: uid("plan"), type: "听力", title: `听力训练 ${g.listen} 分钟`, target: `${g.listen}分钟`, done: false, date: todayStr },
    { id: uid("plan"), type: "复习", title: "复习昨日错题本", target: "错题本", done: false, date: todayStr },
    { id: uid("plan"), type: "语法", title: "每日一个语法点学习", target: "1个", done: false, date: todayStr }
  ];
  studyPlanStore.tasks = [...(studyPlanStore.tasks || []), ...baseTasks];

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `请作为英语学习教练，根据以下每日目标，生成 2-3 条额外的学习建议任务（JSON数组格式，每条含 type 和 title）：\n每日目标：背词${g.vocab}个、跟读${g.shadow}句、听力${g.listen}分钟。\n输出格式：[{"type":"阅读","title":"..."},{"type":"写作","title":"..."}]`,
        history: [],
        provider: "auto"
      })
    });
    const result = await response.json();
    if (result.ok) {
      const match = String(result.answer).match(/\[[\s\S]*\]/);
      if (match) {
        const extraTasks = JSON.parse(match[0]);
        extraTasks.forEach((t) => {
          studyPlanStore.tasks.push({
            id: uid("plan"),
            type: t.type || "拓展",
            title: t.title || "学习任务",
            target: "",
            done: false,
            date: todayStr
          });
        });
      }
    }
  } catch (e) {
    // 静默失败，使用基础任务
  }

  studyPlanStore.generatedDate = todayStr;
  saveStudyPlan();
  renderStudyPlan();
  showToast("今日学习计划已生成");
}

/* ════════════════════════════════════════════════════════════════════
 * 12b. 英语学习 - 错题本
 * ════════════════════════════════════════════════════════════════════ */

function renderMistakeBook() {
  const items = mistakeStore.items || [];
  const filter = mistakeStore.filter || "全部";
  const filtered = filter === "全部" ? items : items.filter((m) => m.type === filter);

  const typeCounts = {};
  items.forEach((m) => { typeCounts[m.type] = (typeCounts[m.type] || 0) + 1; });
  const reviewedCount = items.filter((m) => m.reviewed).length;
  const needReviewCount = items.filter((m) => !m.reviewed).length;

  if (els.mistakeStats) {
    els.mistakeStats.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:20px;">
        <div class="plan-stat-card"><strong style="color:var(--blue);font-size:24px;">${items.length}</strong><span>总错题</span></div>
        <div class="plan-stat-card"><strong style="color:var(--orange);font-size:24px;">${needReviewCount}</strong><span>待复习</span></div>
        <div class="plan-stat-card"><strong style="color:var(--green);font-size:24px;">${reviewedCount}</strong><span>已复习</span></div>
        <div class="plan-stat-card"><strong style="color:var(--purple);font-size:24px;">${typeCounts["词汇"] || 0}</strong><span>词汇错题</span></div>
        <div class="plan-stat-card"><strong style="color:var(--pink);font-size:24px;">${typeCounts["语法"] || 0}</strong><span>语法错题</span></div>
      </div>
    `;
  }

  if (els.mistakeCounter) {
    els.mistakeCounter.textContent = `共 ${filtered.length} 条`;
  }

  if (els.mistakeList) {
    if (filtered.length === 0) {
      els.mistakeList.innerHTML = `
        <div class="empty" style="padding:20px;">
          <p>错题本还是空的。</p>
          <p style="font-size:13px;color:var(--text-muted);">在背单词、听写练习中答错时会自动收录，也可以手动添加。</p>
        </div>
      `;
    } else {
      els.mistakeList.innerHTML = filtered.map((m) => {
        const colorMap = { "词汇": "blue", "语法": "pink", "听写": "green", "翻译": "purple" };
        const c = colorMap[m.type] || "blue";
        return `
        <div class="mistake-card ${m.reviewed ? "reviewed" : ""}">
          <div class="mistake-card-head">
            <span class="mistake-type-tag" style="background:var(--${c}-soft);color:var(--${c});">${esc(m.type)}</span>
            ${m.reviewed ? '<span style="font-size:12px;color:var(--green);">✓ 已复习</span>' : '<span style="font-size:12px;color:var(--orange);">待复习</span>'}
            ${m.tag ? `<span style="font-size:12px;color:var(--text-muted);margin-left:auto;">${esc(m.tag)}</span>` : ""}
            <span style="font-size:11px;color:var(--text-muted);">${esc(m.createdAt || "")}</span>
          </div>
          <div class="mistake-question">${esc(m.question)}</div>
          <div class="mistake-answer"><strong>正确答案：</strong>${esc(m.answer)}</div>
          ${m.note ? `<div class="mistake-note"><strong>解析：</strong>${esc(m.note)}</div>` : ""}
          <div class="mistake-actions">
            ${!m.reviewed ? `<button class="ghost-btn" data-mistake-review="${esc(m.id)}">标记已复习</button>` : `<button class="ghost-btn" data-mistake-unreview="${esc(m.id)}">标记待复习</button>`}
            <button class="ghost-btn" data-mistake-ai="${esc(m.id)}">AI 解析</button>
            <button class="ghost-btn" data-mistake-delete="${esc(m.id)}" style="color:var(--pink);">删除</button>
          </div>
        </div>
      `;
      }).join("");
    }
  }
}

function filterMistakes(type) {
  mistakeStore.filter = type;
  saveMistakes();
  document.querySelectorAll("[data-mfilter]").forEach((b) => {
    b.classList.toggle("active", b.dataset.mfilter === type);
  });
  renderMistakeBook();
}

function openMistakeDialog() {
  if (!els.mistakeDialog) return;
  editingMistakeId = null;
  if (els.mistakeDialogTitle) els.mistakeDialogTitle.textContent = "添加错题";
  if (els.mistakeType) els.mistakeType.value = "词汇";
  if (els.mistakeQuestion) els.mistakeQuestion.value = "";
  if (els.mistakeAnswer) els.mistakeAnswer.value = "";
  if (els.mistakeNote) els.mistakeNote.value = "";
  if (els.mistakeTag) els.mistakeTag.value = "";
  els.mistakeDialog.showModal();
}

function saveMistakeFromDialog() {
  if (!els.mistakeQuestion) return;
  const question = els.mistakeQuestion.value.trim();
  if (!question) { showToast("请输入题目内容"); return; }
  const mistake = {
    id: editingMistakeId || uid("mistake"),
    type: els.mistakeType.value,
    question: question,
    answer: els.mistakeAnswer.value.trim(),
    note: els.mistakeNote.value.trim(),
    tag: els.mistakeTag.value.trim(),
    reviewed: false,
    createdAt: new Date().toISOString().split("T")[0]
  };
  if (editingMistakeId) {
    const idx = mistakeStore.items.findIndex((m) => m.id === editingMistakeId);
    if (idx >= 0) {
      mistake.reviewed = mistakeStore.items[idx].reviewed;
      mistakeStore.items[idx] = mistake;
    }
  } else {
    mistakeStore.items.unshift(mistake);
  }
  saveMistakes();
  els.mistakeDialog.close();
  showToast(editingMistakeId ? "错题已更新" : "错题已添加");
  renderMistakeBook();
}

function reviewMistake(id, reviewed) {
  const m = mistakeStore.items.find((m) => m.id === id);
  if (!m) return;
  m.reviewed = reviewed;
  saveMistakes();
  renderMistakeBook();
  showToast(reviewed ? "已标记为复习" : "已标记为待复习");
}

function deleteMistake(id) {
  mistakeStore.items = mistakeStore.items.filter((m) => m.id !== id);
  saveMistakes();
  renderMistakeBook();
  showToast("错题已删除");
}

async function aiExplainMistake(id) {
  const m = mistakeStore.items.find((m) => m.id === id);
  if (!m) return;
  showToast("AI 正在解析...");
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `请作为英语老师，解析以下错题并给出学习建议：\n类型：${m.type}\n题目/错误：${m.question}\n正确答案：${m.answer}\n请从"错误原因"、"知识点"、"记忆技巧"、"类似例题"四个方面解析。`,
        history: [],
        provider: "auto"
      })
    });
    const result = await response.json();
    if (result.ok) {
      m.note = String(result.answer).substring(0, 500);
      saveMistakes();
      renderMistakeBook();
      showToast("AI 解析已添加");
    } else {
      showToast("AI 解析失败");
    }
  } catch (e) {
    showToast("AI 解析失败");
  }
}

function addMistakeAuto(type, question, answer, note, tag) {
  const mistake = {
    id: uid("mistake"),
    type: type,
    question: question,
    answer: answer,
    note: note || "",
    tag: tag || "自动收录",
    reviewed: false,
    createdAt: new Date().toISOString().split("T")[0]
  };
  mistakeStore.items.unshift(mistake);
  saveMistakes();
}

/* ════════════════════════════════════════════════════════════════════
 * 12c. 英语学习 - 语法练习
 * ════════════════════════════════════════════════════════════════════ */

const GRAMMAR_TOPICS = [
  {
    id: "tense", name: "时态", icon: "⏰", desc: "现在时、过去时、将来时、完成时",
    exercises: [
      { q: "By the time we arrived, the meeting ___ already started.", options: ["has", "had", "have", "was"], answer: 1, explain: "过去完成时，表示在过去某时间点之前已完成的动作：had + 过去分词。" },
      { q: "She ___ in this company for five years.", options: ["works", "has worked", "is working", "worked"], answer: 1, explain: "现在完成时，表示从过去持续到现在的动作：has/have + 过去分词。" },
      { q: "I will call you when I ___ home.", options: ["will get", "get", "got", "getting"], answer: 1, explain: "时间状语从句中用一般现在时表将来：when I get home。" },
      { q: "The report ___ by the team next week.", options: ["will finish", "will be finished", "finishes", "is finishing"], answer: 1, explain: "将来时被动语态：will be + 过去分词。" },
      { q: "He ___ TV when the phone rang.", options: ["watches", "watched", "was watching", "is watching"], answer: 2, explain: "过去进行时，表示过去某时刻正在进行的动作：was/were + doing。" }
    ]
  },
  {
    id: "passive", name: "被动语态", icon: "🔄", desc: "被动语态的构成与使用",
    exercises: [
      { q: "The new product ___ next month.", options: ["will launch", "will be launched", "launches", "is launching"], answer: 1, explain: "将来时被动：will be + 过去分词。" },
      { q: "This report must ___ by Friday.", options: ["complete", "be completed", "completing", "completed"], answer: 1, explain: "情态动词被动：must be + 过去分词。" },
      { q: "The office ___ every day.", options: ["cleans", "is cleaned", "cleaning", "cleaned"], answer: 1, explain: "一般现在时被动：is/am/are + 过去分词。" },
      { q: "The proposal ___ by the board yesterday.", options: ["approved", "was approved", "approves", "is approved"], answer: 1, explain: "一般过去时被动：was/were + 过去分词。" }
    ]
  },
  {
    id: "clause", name: "从句", icon: "🔗", desc: "定语从句、名词性从句、状语从句",
    exercises: [
      { q: "The man ___ called you yesterday is my boss.", options: ["which", "who", "whose", "where"], answer: 1, explain: "关系代词 who 修饰人，作主语。" },
      { q: "I don't know ___ the meeting will start.", options: ["that", "what", "when", "which"], answer: 2, explain: "名词性从句作宾语，when 表示时间。" },
      { q: "This is the place ___ we met for the first time.", options: ["which", "who", "where", "what"], answer: 2, explain: "关系副词 where 修饰地点名词。" },
      { q: "___ you study harder, you will pass the exam.", options: ["If", "Unless", "Because", "Although"], answer: 0, explain: "条件状语从句，if 表示如果。" }
    ]
  },
  {
    id: "conditional", name: "条件句", icon: "❓", desc: "真实条件句、虚拟条件句",
    exercises: [
      { q: "If I ___ rich, I would travel the world.", options: ["am", "was", "were", "be"], answer: 2, explain: "虚拟条件句（与现在事实相反），if 从句用过去式，be 动词用 were。" },
      { q: "If it ___ tomorrow, we will cancel the picnic.", options: ["rains", "rained", "will rain", "would rain"], answer: 0, explain: "真实条件句，主将从现。" },
      { q: "If I had known earlier, I ___ you.", options: ["will help", "would help", "would have helped", "helped"], answer: 2, explain: "虚拟条件句（与过去事实相反），主句用 would have + 过去分词。" },
      { q: "I wish I ___ more time to study.", options: ["have", "had", "will have", "having"], answer: 1, explain: "wish 后的宾语从句用过去式表示与现在事实相反的愿望。" }
    ]
  },
  {
    id: "article", name: "冠词", icon: "📝", desc: "a/an/the 的用法",
    exercises: [
      { q: "She is ___ honest person.", options: ["a", "an", "the", "—"], answer: 1, explain: "honest 的 h 不发音，以元音音素开头，用 an。" },
      { q: "___ sun rises in the east.", options: ["A", "An", "The", "—"], answer: 2, explain: "世上独一无二的事物前用 the。" },
      { q: "I play ___ piano every day.", options: ["a", "an", "the", "—"], answer: 2, explain: "乐器名称前用 the。" },
      { q: "___ love is the most important thing in life.", options: ["A", "An", "The", "—"], answer: 3, explain: "抽象名词泛指时不用冠词（零冠词）。" }
    ]
  },
  {
    id: "modal", name: "情态动词", icon: "🔑", desc: "can/must/should/may 等用法",
    exercises: [
      { q: "You ___ wear a seatbelt while driving.", options: ["can", "must", "may", "could"], answer: 1, explain: "must 表示必须，法律/安全要求。" },
      { q: "___ I borrow your pen?", options: ["Must", "May", "Should", "Will"], answer: 1, explain: "may 表示请求许可，较礼貌。" },
      { q: "You ___ have seen the movie. It's very popular.", options: ["should", "must", "can", "would"], answer: 1, explain: "must have done 表示对过去的肯定推测。" },
      { q: "You ___ not smoke here.", options: ["need", "must", "may", "would"], answer: 1, explain: "must not 表示禁止。" },
      { q: "She ___ swim when she was only five years old.", options: ["can", "could", "must", "should"], answer: 1, explain: "could 表示过去具备的能力。" },
      { q: "You ___ have told me earlier. I would have helped you.", options: ["should", "can", "will", "may"], answer: 0, explain: "should have done 表示本应该做但没做，带有遗憾或责备。" }
    ]
  },
  {
    id: "gerund", name: "动名词与不定式", icon: "🏃", desc: "doing / to do 的用法区别",
    exercises: [
      { q: "I enjoy ___ to music in my free time.", options: ["listen", "listening", "to listen", "listened"], answer: 1, explain: "enjoy 后接动名词 doing，表示喜欢做某事。" },
      { q: "He decided ___ a new car last month.", options: ["buy", "buying", "to buy", "bought"], answer: 2, explain: "decide 后接不定式 to do，表示决定做某事。" },
      { q: "Would you mind ___ the window? It's a bit cold.", options: ["close", "closing", "to close", "closed"], answer: 1, explain: "Would you mind 后接动名词 doing，表示介意做某事。" },
      { q: "I want ___ you about an important matter.", options: ["tell", "telling", "to tell", "told"], answer: 2, explain: "want 后接不定式 to do，表示想要做某事。" },
      { q: "She finished ___ the report and left the office.", options: ["write", "writing", "to write", "wrote"], answer: 1, explain: "finish 后接动名词 doing，表示完成做某事。" },
      { q: "It's important ___ the instructions carefully before using the device.", options: ["read", "reading", "to read", "read"], answer: 2, explain: "It's important 后接不定式 to do。" }
    ]
  },
  {
    id: "preposition", name: "介词", icon: "📍", desc: "in/on/at/for/by 等介词用法",
    exercises: [
      { q: "The meeting is scheduled ___ 3 PM ___ Monday.", options: ["at, on", "in, at", "on, in", "at, in"], answer: 0, explain: "具体时刻用 at，星期用 on。" },
      { q: "She has been working here ___ five years.", options: ["for", "since", "in", "from"], answer: 0, explain: "for + 时间段，since + 时间点。" },
      { q: "The book is ___ the table ___ the living room.", options: ["on, in", "in, on", "at, in", "on, at"], answer: 0, explain: "在...上面用 on，在...里面用 in。" },
      { q: "We traveled to Paris ___ train.", options: ["by", "with", "on", "in"], answer: 0, explain: "表示交通方式用 by + 交通工具。" },
      { q: "The store is open ___ 9 AM ___ 9 PM.", options: ["from, to", "between, and", "at, to", "in, until"], answer: 0, explain: "from...to... 表示从...到...。" },
      { q: "He is good ___ math but bad ___ spelling.", options: ["at, at", "in, in", "at, in", "in, at"], answer: 0, explain: "be good at / be bad at 均用介词 at。" }
    ]
  },
  {
    id: "comparison", name: "比较级与最高级", icon: "⚖️", desc: "比较级、最高级、同级比较",
    exercises: [
      { q: "This problem is ___ than the one we solved yesterday.", options: ["difficult", "more difficult", "most difficult", "difficulter"], answer: 1, explain: "多音节词比较级前加 more。" },
      { q: "She is the ___ person I have ever met.", options: ["kind", "kinder", "kindest", "most kind"], answer: 2, explain: "单音节词最高级加 -est。" },
      { q: "My phone is not ___ as yours.", options: ["so expensive", "as expensive", "expensive", "more expensive"], answer: 1, explain: "同级比较用 as + 形容词原级 + as。" },
      { q: "The ___ you practice, the ___ you will become.", options: ["more, better", "much, good", "more, good", "much, better"], answer: 0, explain: "the + 比较级, the + 比较级，表示越...越...。" },
      { q: "This is the ___ interesting book I've ever read.", options: ["more", "most", "much", "very"], answer: 1, explain: "多音节词最高级前加 most。" },
      { q: "He runs ___ than his brother.", options: ["fast", "faster", "fastest", "more fast"], answer: 1, explain: "单音节词比较级加 -er。" }
    ]
  }
];

function renderGrammar() {
  if (els.grammarTopics) {
    els.grammarTopics.innerHTML = GRAMMAR_TOPICS.map((t) => `
      <button class="grammar-topic-btn ${grammarState.currentTopic === t.id ? "active" : ""}" data-grammar-topic="${t.id}">
        <span style="font-size:24px;">${t.icon}</span>
        <strong>${esc(t.name)}</strong>
        <span style="font-size:11px;color:var(--text-muted);">${esc(t.desc)}</span>
      </button>
    `).join("");
  }

  if (els.grammarExercise) {
    if (!grammarState.currentTopic) {
      els.grammarExercise.innerHTML = `
        <div class="empty" style="padding:40px;text-align:center;">
          <p style="font-size:16px;">👈 请选择一个语法主题开始练习</p>
          <p style="font-size:13px;color:var(--text-muted);">每个主题包含多道选择题，答错会自动收录到错题本</p>
        </div>
      `;
      return;
    }
    const topic = GRAMMAR_TOPICS.find((t) => t.id === grammarState.currentTopic);
    if (!topic) return;
    const exercises = topic.exercises;
    if (grammarState.currentIndex >= exercises.length) grammarState.currentIndex = 0;
    const ex = exercises[grammarState.currentIndex];

    els.grammarExercise.innerHTML = `
      <div class="grammar-exercise-head">
        <h4 style="margin:0;">${topic.icon} ${esc(topic.name)} - 第 ${grammarState.currentIndex + 1}/${exercises.length} 题</h4>
        <div class="grammar-score">得分：${grammarState.score}/${grammarState.total}</div>
      </div>
      <div class="grammar-question">${esc(ex.q)}</div>
      <div class="grammar-options">
        ${ex.options.map((opt, i) => `
          <button class="grammar-option-btn" data-grammar-answer="${i}">${String.fromCharCode(65 + i)}. ${esc(opt)}</button>
        `).join("")}
      </div>
      <div class="grammar-explain" id="grammarExplain" style="display:none;"></div>
      <div class="grammar-nav">
        <button class="ghost-btn" id="grammarPrevBtn" ${grammarState.currentIndex === 0 ? "disabled" : ""}>上一题</button>
        <button class="primary-btn" id="grammarNextBtn" style="margin-left:auto;">${grammarState.currentIndex + 1 >= exercises.length ? "完成" : "下一题"}</button>
      </div>
    `;
  }
}

function selectGrammarTopic(topicId) {
  grammarState.currentTopic = topicId;
  grammarState.currentIndex = 0;
  grammarState.score = 0;
  grammarState.total = 0;
  renderGrammar();
}

function answerGrammar(optionIndex) {
  if (!grammarState.currentTopic) return;
  const topic = GRAMMAR_TOPICS.find((t) => t.id === grammarState.currentTopic);
  if (!topic) return;
  const ex = topic.exercises[grammarState.currentIndex];
  if (!ex) return;
  grammarState.total++;
  const isCorrect = optionIndex === ex.answer;
  if (isCorrect) grammarState.score++;

  document.querySelectorAll(".grammar-option-btn").forEach((btn, i) => {
    btn.disabled = true;
    if (i === ex.answer) btn.classList.add("correct");
    else if (i === optionIndex) btn.classList.add("wrong");
  });

  const explainEl = document.getElementById("grammarExplain");
  if (explainEl) {
    explainEl.innerHTML = `
      <div class="grammar-explain-${isCorrect ? "correct" : "wrong"}">
        <strong>${isCorrect ? "✅ 回答正确！" : "❌ 回答错误"}</strong>
        <p>${esc(ex.explain)}</p>
      </div>
    `;
    explainEl.style.display = "block";
  }

  if (!isCorrect) {
    addMistakeAuto("语法", ex.q, ex.options[ex.answer], ex.explain, "语法练习");
  }
}

function nextGrammarExercise() {
  if (!grammarState.currentTopic) return;
  const topic = GRAMMAR_TOPICS.find((t) => t.id === grammarState.currentTopic);
  if (!topic) return;
  if (grammarState.currentIndex + 1 >= topic.exercises.length) {
    showToast(`练习完成！得分：${grammarState.score}/${grammarState.total}`);
    grammarState.currentIndex = 0;
  } else {
    grammarState.currentIndex++;
  }
  renderGrammar();
}

function prevGrammarExercise() {
  if (grammarState.currentIndex > 0) {
    grammarState.currentIndex--;
    renderGrammar();
  }
}

/* ════════════════════════════════════════════════════════════════════
 * 12d. 英语学习 - 口语测评
 * ════════════════════════════════════════════════════════════════════ */

const SPEAKING_PROMPTS = {
  topic: [
    { id: "t1", title: "描述你的理想工作", prompt: "Describe your ideal job. What would you do? Why is it your dream job?", time: 90 },
    { id: "t2", title: "介绍你的家乡", prompt: "Introduce your hometown. Talk about its location, culture, food, and what makes it special.", time: 90 },
    { id: "t3", title: "最难忘的旅行", prompt: "Describe the most memorable trip you've ever taken. Where did you go? What happened?", time: 90 },
    { id: "t4", title: "你崇拜的人", prompt: "Describe a person you admire. Who are they? Why do you admire them?", time: 90 },
    { id: "t5", title: "五年后的自己", prompt: "Where do you see yourself in five years? Talk about your career and personal goals.", time: 90 },
    { id: "t6", title: "科技对生活的影响", prompt: "How has technology changed our daily lives? Discuss both positive and negative impacts.", time: 120 },
    { id: "t7", title: "你最喜欢的一本书", prompt: "Describe your favorite book. What is it about? Why do you like it? What did you learn from it?", time: 90 },
    { id: "t8", title: "如何保持工作生活平衡", prompt: "How do you maintain work-life balance? Share your tips and strategies for managing stress.", time: 120 },
    { id: "t9", title: "描述一个难忘的节日", prompt: "Describe a memorable festival or holiday you celebrated. What happened? Who was there?", time: 90 },
    { id: "t10", title: "你认为最重要的技能", prompt: "What skill do you think is most important in today's world? Why? How can one develop it?", time: 120 }
  ],
  picture: [
    { id: "p1", title: "描述一个办公场景", prompt: "Look at a typical office scene. Describe what you see: people, activities, atmosphere. (Use your imagination to visualize)", time: 120 },
    { id: "p2", title: "描述一个城市街景", prompt: "Imagine a busy city street. Describe the buildings, traffic, people, and sounds.", time: 120 },
    { id: "p3", title: "描述一个家庭聚餐", prompt: "Imagine a family dinner scene. Describe who is there, what food is on the table, and the mood.", time: 120 },
    { id: "p4", title: "描述一个公园场景", prompt: "Imagine a park on a sunny weekend. Describe the people, activities, nature, and atmosphere.", time: 120 },
    { id: "p5", title: "描述一个咖啡店", prompt: "Imagine a cozy coffee shop. Describe the interior, customers, smells, and what people are doing.", time: 120 }
  ],
  dialogue: [
    { id: "d1", title: "在餐厅点餐", prompt: "Role play: You are at a restaurant. Order your meal, ask about specials, and make small talk with the waiter.", time: 120 },
    { id: "d2", title: "商务会议自我介绍", prompt: "Role play: Introduce yourself at a business meeting. Talk about your role, experience, and what you hope to achieve.", time: 90 },
    { id: "d3", title: "在机场办理登机", prompt: "Role play: You are at the airport check-in counter. Ask about baggage, seating, and gate information.", time: 90 },
    { id: "d4", title: "电话预约", prompt: "Role play: Make a phone call to schedule a doctor's appointment. Ask about availability and what to bring.", time: 90 },
    { id: "d5", title: "在酒店前台", prompt: "Role play: You are checking into a hotel. Ask about room types, amenities, check-out time, and nearby attractions.", time: 90 },
    { id: "d6", title: "与同事讨论项目", prompt: "Role play: Discuss a project with a colleague. Share progress, raise concerns, and agree on next steps.", time: 120 },
    { id: "d7", title: "在商店退换货", prompt: "Role play: You want to return a defective product. Explain the issue to the store clerk and request a refund or exchange.", time: 90 }
  ],
  read: [
    { id: "r1", title: "朗读：成功格言", prompt: "Read aloud: 'Success is not final, failure is not fatal: it is the courage to continue that counts.' Focus on intonation and pacing.", time: 60, text: "Success is not final, failure is not fatal: it is the courage to continue that counts." },
    { id: "r2", title: "朗读：商业新闻", prompt: "Read aloud: 'The company announced a strategic partnership to expand its market presence in Asia.' Focus on clear pronunciation.", time: 60, text: "The company announced a strategic partnership to expand its market presence in Asia." },
    { id: "r3", title: "朗读：日常对话", prompt: "Read aloud: 'Could you please send me the report by Friday? I need to review it before the meeting on Monday.' Focus on natural rhythm.", time: 60, text: "Could you please send me the report by Friday? I need to review it before the meeting on Monday." },
    { id: "r4", title: "朗读：科技报道", prompt: "Read aloud: 'Artificial intelligence is transforming industries at an unprecedented pace, creating new opportunities and challenges.' Focus on clarity and emphasis.", time: 60, text: "Artificial intelligence is transforming industries at an unprecedented pace, creating new opportunities and challenges." },
    { id: "r5", title: "朗读：励志演讲", prompt: "Read aloud: 'The future belongs to those who believe in the beauty of their dreams and have the courage to pursue them.' Focus on passion and rhythm.", time: 60, text: "The future belongs to those who believe in the beauty of their dreams and have the courage to pursue them." },
    { id: "r6", title: "朗读：旅行见闻", prompt: "Read aloud: 'Traveling opens our minds to new cultures, broadens our perspectives, and creates memories that last a lifetime.' Focus on smooth flow.", time: 60, text: "Traveling opens our minds to new cultures, broadens our perspectives, and creates memories that last a lifetime." }
  ]
};

function renderSpeaking() {
  speakingState.mode = speakingStore.mode || "topic";
  // 更新模式按钮状态
  document.querySelectorAll("[data-speak-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.speakMode === speakingState.mode);
  });

  // 加载题目
  const prompts = SPEAKING_PROMPTS[speakingState.mode] || [];
  if (prompts.length === 0) {
    if (els.speakingPrompt) els.speakingPrompt.innerHTML = '<div class="empty"><p>暂无题目</p></div>';
    return;
  }
  // 随机选一题（或保持当前）
  if (!speakingState.currentPrompt || speakingState.currentPrompt.mode !== speakingState.mode) {
    speakingState.currentPrompt = { mode: speakingState.mode, index: Math.floor(Math.random() * prompts.length) };
  }
  const prompt = prompts[speakingState.currentPrompt.index];

  if (els.speakingPrompt) {
    let html = `
      <div class="speaking-prompt-card">
        <div class="speaking-prompt-head">
          <span class="speaking-prompt-mode">${speakingState.mode === "topic" ? "话题口语" : speakingState.mode === "picture" ? "看图说话" : speakingState.mode === "dialogue" ? "情景对话" : "朗读测评"}</span>
          <span style="font-size:12px;color:var(--text-muted);">建议时长：${prompt.time}秒</span>
        </div>
        <h4 style="margin:8px 0;">${esc(prompt.title)}</h4>
        <p style="color:var(--text-secondary);line-height:1.7;">${esc(prompt.prompt)}</p>
    `;
    if (prompt.text) {
      html += `
        <div class="speaking-read-text">
          <button class="ghost-btn" id="speakPlayTextBtn">&#x1F50A; 听标准朗读</button>
          <p style="font-size:16px;line-height:2;margin:8px 0;">${esc(prompt.text)}</p>
        </div>
      `;
    }
    html += `
        <button class="ghost-btn" id="speakNextPromptBtn" style="margin-top:12px;">&#x1F504; 换一题</button>
      </div>
    `;
    els.speakingPrompt.innerHTML = html;
  }

  // 清空结果区
  if (els.speakingResult) els.speakingResult.innerHTML = "";

  // 渲染历史记录
  renderSpeakingHistory();
}

function renderSpeakingHistory() {
  if (!els.speakingHistoryList) return;
  const records = speakingStore.records || [];
  if (records.length === 0) {
    els.speakingHistoryList.innerHTML = '<div class="empty" style="padding:16px;"><p>暂无测评记录。</p></div>';
    return;
  }
  els.speakingHistoryList.innerHTML = records.slice(0, 10).map((r) => `
    <div class="speaking-record-item">
      <div class="speaking-record-head">
        <span class="tag" style="background:var(--blue-soft);color:var(--blue);">${esc(r.mode)}</span>
        <strong style="font-size:13px;">${esc(r.title)}</strong>
        <span style="margin-left:auto;font-size:12px;color:var(--text-muted);">${esc(r.date)}</span>
      </div>
      <div class="speaking-record-scores">
        <span style="color:var(--green);">发音：${r.pronunciation}</span>
        <span style="color:var(--blue);">流利度：${r.fluency}</span>
        <span style="color:var(--purple);">表达：${r.expression}</span>
        <span style="color:var(--orange);">总分：${r.total}</span>
      </div>
      ${r.feedback ? `<p style="font-size:12px;color:var(--text-muted);margin:4px 0 0;">${esc(r.feedback)}</p>` : ""}
    </div>
  `).join("");
}

function switchSpeakingMode(mode) {
  speakingState.mode = mode;
  speakingStore.mode = mode;
  speakingState.currentPrompt = null;
  saveSpeaking();
  document.querySelectorAll("[data-speak-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.speakMode === mode);
  });
  renderSpeaking();
}

function nextSpeakingPrompt() {
  const prompts = SPEAKING_PROMPTS[speakingState.mode] || [];
  if (!prompts.length) return;
  const currentIdx = speakingState.currentPrompt?.index || 0;
  speakingState.currentPrompt = { mode: speakingState.mode, index: (currentIdx + 1) % prompts.length };
  renderSpeaking();
}

function playSpeakingText() {
  const prompts = SPEAKING_PROMPTS[speakingState.mode] || [];
  const prompt = prompts[speakingState.currentPrompt?.index || 0];
  if (!prompt || !prompt.text) return;
  if (!("speechSynthesis" in window)) { showToast("浏览器不支持语音播放"); return; }
  const u = new SpeechSynthesisUtterance(prompt.text);
  u.lang = "en-US";
  u.rate = 0.85;
  speechSynthesis.speak(u);
  showToast("正在播放标准朗读");
}

function toggleSpeakingRecord() {
  speakingState.recording = !speakingState.recording;
  const btn = document.getElementById("speakingRecordBtn");
  const hint = document.getElementById("speakingRecordHint");
  if (btn) btn.innerHTML = speakingState.recording ? "⏹ 停止录音" : "🎤 开始录音";
  if (hint) hint.textContent = speakingState.recording ? "录音中...完成后将进行AI测评" : "点击按钮开始录音作答";

  if (speakingState.recording) {
    showToast("录音中...（模拟）");
  } else {
    showToast("录音结束，AI 正在测评...");
    simulateSpeakingScore();
  }
}

async function simulateSpeakingScore() {
  const prompts = SPEAKING_PROMPTS[speakingState.mode] || [];
  const prompt = prompts[speakingState.currentPrompt?.index || 0];
  if (!prompt) return;

  let scores = { pronunciation: 75, fluency: 72, expression: 70, feedback: "" };
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `请作为英语口语考官，对以下口语题目作答给出评分（发音、流利度、表达各0-100分）和简短反馈：\n题目：${prompt.title}\n要求：${prompt.prompt}\n请输出JSON：{"pronunciation":85,"fluency":80,"expression":75,"feedback":"..."}`,
        history: [],
        provider: "auto"
      })
    });
    const result = await response.json();
    if (result.ok) {
      const match = String(result.answer).match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        scores = {
          pronunciation: parsed.pronunciation || 75,
          fluency: parsed.fluency || 72,
          expression: parsed.expression || 70,
          feedback: parsed.feedback || ""
        };
      }
    }
  } catch (e) {
    // 静默失败，使用占位分数
  }

  // 渲染结果
  if (els.speakingResult) {
    const total = Math.round((scores.pronunciation + scores.fluency + scores.expression) / 3);
    els.speakingResult.innerHTML = `
      <div class="speaking-result-card">
        <h4 style="margin:0 0 16px;">AI 测评结果</h4>
        <div class="speaking-score-grid">
          <div class="speaking-score-item">
            <div class="score-ring small">
              <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="ring-bg" /><circle cx="40" cy="40" r="34" class="ring-fg" style="stroke-dasharray:${2 * Math.PI * 34 * scores.pronunciation / 100} ${2 * Math.PI * 34};" /></svg>
              <strong>${scores.pronunciation}</strong>
            </div>
            <span>发音</span>
          </div>
          <div class="speaking-score-item">
            <div class="score-ring small">
              <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="ring-bg" /><circle cx="40" cy="40" r="34" class="ring-fg" style="stroke-dasharray:${2 * Math.PI * 34 * scores.fluency / 100} ${2 * Math.PI * 34};" /></svg>
              <strong>${scores.fluency}</strong>
            </div>
            <span>流利度</span>
          </div>
          <div class="speaking-score-item">
            <div class="score-ring small">
              <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="ring-bg" /><circle cx="40" cy="40" r="34" class="ring-fg" style="stroke-dasharray:${2 * Math.PI * 34 * scores.expression / 100} ${2 * Math.PI * 34};" /></svg>
              <strong>${scores.expression}</strong>
            </div>
            <span>表达</span>
          </div>
          <div class="speaking-score-item total">
            <strong style="font-size:32px;color:var(--orange);">${total}</strong>
            <span>总分</span>
          </div>
        </div>
        ${scores.feedback ? `<div class="speaking-feedback"><strong>💬 AI 反馈：</strong><br>${esc(scores.feedback)}</div>` : ""}
      </div>
    `;
  }

  // 保存记录
  speakingStore.records.unshift({
    id: uid("speak"),
    mode: speakingState.mode === "topic" ? "话题口语" : speakingState.mode === "picture" ? "看图说话" : speakingState.mode === "dialogue" ? "情景对话" : "朗读测评",
    title: prompt.title,
    pronunciation: scores.pronunciation,
    fluency: scores.fluency,
    expression: scores.expression,
    total: Math.round((scores.pronunciation + scores.fluency + scores.expression) / 3),
    feedback: scores.feedback,
    date: new Date().toISOString().split("T")[0]
  });
  if (speakingStore.records.length > 50) speakingStore.records = speakingStore.records.slice(0, 50);
  saveSpeaking();
  renderSpeakingHistory();
  showToast("测评完成");
}

/* ════════════════════════════════════════════════════════════════════
 * 13. 读书管理 - 书架
 * ════════════════════════════════════════════════════════════════════ */

if (!state.bookshelf) state.bookshelf = "reading";

let editingBookNoteId = null;
let editingBookNoteBookId = null;
let bookshelfFilterState = { tag: "", sortBy: "recent" };
let readingTimerState = { bookId: null, running: false, paused: false, startTime: 0, elapsed: 0, intervalId: null };
let readingSessionsStore = readLS("olivia-work-platform-reading-sessions", []);
function saveReadingSessions() { saveLS("olivia-work-platform-reading-sessions", readingSessionsStore); }

function renderBookshelf() {
  if (!els.bookshelfContent) return;

  // 更新 tab 激活状态
  document.querySelectorAll(".bookshelf-tab").forEach((btn) => {
    if (btn.dataset.shelf === state.bookshelf) btn.classList.add("active");
    else btn.classList.remove("active");
  });

  // 渲染统计概览栏
  renderBookshelfStatsBar();
  renderReadingGoalBar();

  // 更新筛选标签选项
  updateBookshelfTagFilter();

  // 统计视图
  if (state.bookshelf === "stats") {
    if (els.bookshelfFilterBar) els.bookshelfFilterBar.style.display = "none";
    renderBookshelfStats();
    return;
  }
  if (els.bookshelfFilterBar) els.bookshelfFilterBar.style.display = "flex";

  let shelfBooks = books.filter((b) => b.status === state.bookshelf);

  // 标签筛选
  if (bookshelfFilterState.tag) {
    shelfBooks = shelfBooks.filter((b) => (b.tags || []).includes(bookshelfFilterState.tag));
  }

  // 排序
  const sortBy = bookshelfFilterState.sortBy || "recent";
  shelfBooks = [...shelfBooks].sort((a, b) => {
    if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "progress") {
      const pa = a.totalPages ? (a.currentPage / a.totalPages) : 0;
      const pb = b.totalPages ? (b.currentPage / b.totalPages) : 0;
      return pb - pa;
    }
    return 0; // recent: 保持原序
  });

  // 如果当前分类书架为空，从 template-data 读取推荐书单
  if (!shelfBooks.length && !bookshelfFilterState.tag) {
    const readingModule = (data.modules || []).find((m) => m.id === "reading");
    const recommendedItems = (readingModule && readingModule.items) ? readingModule.items : [];

    let html = '';
    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
      <div>
        <h4 style="margin:0 0 4px;">&#x1F4DA; 推荐书单</h4>
        <p style="margin:0;font-size:13px;color:var(--text-muted);">精选 ${recommendedItems.length} 本好书，点击「开始阅读」直接加入书架并计时，或「加入想读」稍后阅读</p>
      </div>
      <button class="primary-btn" id="aiRecommendBooksBtn">&#x1F916; AI 智能推荐</button>
    </div>`;

    if (recommendedItems.length) {
      // 按分类分组
      const categoryMap = {};
      recommendedItems.forEach((item, idx) => {
        const tags = item.tags || [];
        let cat = "综合推荐";
        if (tags.includes("AI") || tags.includes("产品")) cat = "AI · 产品";
        else if (tags.includes("编程") || tags.includes("架构") || tags.includes("重构")) cat = "技术 · 编程";
        else if (tags.includes("心理学") || tags.includes("沟通") || tags.includes("习惯")) cat = "心理 · 成长";
        else if (tags.includes("管理") || tags.includes("领导力") || tags.includes("OKR")) cat = "管理 · 职场";
        else if (tags.includes("文学") || tags.includes("哲学") || tags.includes("传记")) cat = "文学 · 人文";
        else if (tags.includes("投资") || tags.includes("经济学") || tags.includes("商业")) cat = "经济 · 商业";
        else if (tags.includes("思维") || tags.includes("逻辑") || tags.includes("决策")) cat = "思维 · 认知";
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push({ item, idx });
      });

      // 分类标签
      const cats = Object.keys(categoryMap);
      html += `<div class="recommend-category-tabs" id="recommendCategoryTabs">`;
      cats.forEach((cat, ci) => {
        html += `<button class="recommend-cat-btn ${ci === 0 ? "active" : ""}" data-recommend-cat="${esc(cat)}">${esc(cat)} (${categoryMap[cat].length})</button>`;
      });
      html += `</div>`;

      // 各分类的书籍网格
      cats.forEach((cat, ci) => {
        html += `<div class="recommend-grid ${ci === 0 ? "" : "hidden"}" data-recommend-grid="${esc(cat)}">`;
        categoryMap[cat].forEach(({ item, idx }) => {
          html += `<div class="recommend-book-card" style="border-left:3px solid var(--${item.color || "blue"});">
            <div class="recommend-book-icon">${item.icon || "&#x1F4D6;"}</div>
            <div class="recommend-book-info">
              <h5 style="margin:0 0 4px;font-size:15px;">${esc(item.title)}</h5>
              <p style="margin:0 0 6px;font-size:12px;color:var(--text-muted);line-height:1.5;">${esc(item.summary)}</p>
              <div class="tag-row" style="margin-bottom:8px;">
                ${(item.tags || []).slice(0, 3).map((t) => `<span class="tag" style="font-size:11px;">${esc(t)}</span>`).join("")}
              </div>
              <div class="recommend-book-actions">
                <button class="primary-btn" data-book-read-now="${idx}" style="font-size:12px;padding:4px 12px;">&#x1F4D6; 开始阅读</button>
                <button class="ghost-btn" data-book-add-wishlist="${idx}" style="font-size:12px;padding:4px 12px;">&#x1F4F8; 加入想读</button>
              </div>
            </div>
          </div>`;
        });
        html += `</div>`;
      });
    }

    html += `<div class="empty" style="margin-top:16px;"><p>你的书架空空如也，从上方推荐中添加，或点击手动录入。</p><button class="primary-btn" data-book-new="1">&#x1F4DD; 添加书籍</button></div>`;
    els.bookshelfContent.innerHTML = html;

    // 绑定分类切换
    document.querySelectorAll(".recommend-cat-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".recommend-cat-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const cat = btn.dataset.recommendCat;
        document.querySelectorAll("[data-recommend-grid]").forEach((g) => {
          if (g.dataset.recommendGrid === cat) g.classList.remove("hidden");
          else g.classList.add("hidden");
        });
      });
    });
    return;
  }

  // 筛选后无结果
  if (!shelfBooks.length) {
    let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <span style="color:var(--text-muted);">共 0 本（当前筛选无结果）</span>
      <button class="ghost-btn" id="aiRecommendBooksBtn">AI 推荐书籍</button>
    </div>`;
    html += `<div class="empty"><p>当前筛选条件下没有书籍，试试切换标签或排序方式。</p></div>`;
    els.bookshelfContent.innerHTML = html;
    return;
  }

  // 正常渲染已有书籍
  let html = '';
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <span style="color:var(--text-muted);">共 ${shelfBooks.length} 本${bookshelfFilterState.tag ? ' · 标签：' + esc(bookshelfFilterState.tag) : ''}</span>
    <button class="ghost-btn" id="aiRecommendBooksBtn">AI 推荐书籍</button>
  </div>`;
  html += shelfBooks.map((book) => {
    const progress = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
    const tags = book.tags || [];
    const notes = book.notes || [];
    const review = book.review || null;
    const sessions = (readingSessionsStore || []).filter((s) => s.bookId === book.id);
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0);
    return `<div class="book-card">
      <div class="book-card-head">
        <h4 style="cursor:pointer;" data-book-detail="${esc(book.id)}">${esc(book.title)}</h4>
        <span class="book-author">${esc(book.author || "未知作者")}</span>
      </div>
      <div class="book-progress">
        <div class="book-progress-bar"><div class="book-progress-fill" style="width:${progress}%"></div></div>
        <span>${book.currentPage || 0}/${book.totalPages || 0} 页（${progress}%）</span>
      </div>
      ${totalMinutes > 0 ? `<div style="font-size:12px;color:var(--text-muted);margin:4px 0;">&#x23F1; 累计阅读 ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}min · ${sessions.length} 次</div>` : ""}
      ${book.rating ? `<div class="book-rating">${"★".repeat(book.rating)}${"☆".repeat(5 - book.rating)}</div>` : ""}
      ${review && review.summary ? `<div style="font-size:13px;color:var(--purple);font-style:italic;margin:4px 0;padding:4px 8px;background:var(--purple-soft);border-radius:6px;">"${esc(review.summary)}"</div>` : ""}
      ${tags.length ? `<div class="book-tags">${tags.map((t) => `<span class="book-tag">${esc(t)}</span>`).join("")}</div>` : ""}
      ${notes.length ? `<div class="book-notes-section">
        <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">笔记 ${notes.length} 条</div>
        ${notes.slice(-2).map((n) => `<div class="book-note-item"><span class="note-type ${n.type || "thought"}">${getNoteTypeLabel(n.type)}</span>${n.page ? `<span style="font-size:11px;color:var(--muted);">P${n.page}</span> ` : ""}${esc(n.content)}</div>`).join("")}
      </div>` : ""}
      <div class="book-card-actions">
        <button class="ghost-btn" data-book-detail="${esc(book.id)}">详情</button>
        <button class="ghost-btn" data-book-edit="${esc(book.id)}">编辑</button>
        <button class="ghost-btn" data-book-timer="${esc(book.id)}">&#x23F1; 计时</button>
        <button class="ghost-btn" data-book-progress="${esc(book.id)}">进度+10%</button>
        <button class="ghost-btn" data-book-note="${esc(book.id)}">笔记</button>
        <select class="select book-status-select" data-book-status="${esc(book.id)}" style="width:auto;font-size:12px;padding:2px 8px;height:28px;">
          <option value="reading" ${book.status === "reading" ? "selected" : ""}>在读</option>
          <option value="wishlist" ${book.status === "wishlist" ? "selected" : ""}>想读</option>
          <option value="done" ${book.status === "done" ? "selected" : ""}>已读</option>
        </select>
        ${book.status === "done" ? `<button class="ghost-btn" data-book-review="${esc(book.id)}" style="color:var(--purple);">书评</button>` : ""}
        <button class="ghost-btn" data-book-delete="${esc(book.id)}" style="color:var(--pink);">删除</button>
      </div>
    </div>`;
  }).join("");
  els.bookshelfContent.innerHTML = html;
}

function getNoteTypeLabel(type) {
  const map = { highlight: "摘录", thought: "感悟", question: "疑问", summary: "总结" };
  return map[type] || "笔记";
}

function renderBookshelfStatsBar() {
  if (!els.bookshelfStatsBar) return;
  const reading = books.filter((b) => b.status === "reading").length;
  const wishlist = books.filter((b) => b.status === "wishlist").length;
  const done = books.filter((b) => b.status === "done").length;
  const totalNotes = books.reduce((sum, b) => sum + (b.notes ? b.notes.length : 0), 0);
  const avgRating = done > 0 ? (books.filter((b) => b.status === "done" && b.rating).reduce((s, b) => s + b.rating, 0) / Math.max(done, 1)).toFixed(1) : "—";
  els.bookshelfStatsBar.innerHTML = `
    <div class="bookshelf-stat-card"><strong style="color:var(--blue);">${reading}</strong><span>在读</span></div>
    <div class="bookshelf-stat-card"><strong style="color:var(--orange);">${wishlist}</strong><span>想读</span></div>
    <div class="bookshelf-stat-card"><strong style="color:var(--green);">${done}</strong><span>已读</span></div>
    <div class="bookshelf-stat-card"><strong style="color:var(--purple);">${totalNotes}</strong><span>读书笔记</span></div>
    <div class="bookshelf-stat-card"><strong style="color:var(--pink);">${avgRating}</strong><span>平均评分</span></div>
  `;
}

/* ─── 阅读目标与连续打卡 ─── */
let readingGoalStore = readLS("olivia-work-platform-reading-goal", { yearly: 24, streak: 0, lastReadDate: "", history: [] });
function saveReadingGoal() { saveLS("olivia-work-platform-reading-goal", readingGoalStore); }

function renderReadingGoalBar() {
  if (!els.readingGoalBar) return;
  const year = new Date().getFullYear();
  const doneThisYear = books.filter((b) => b.status === "done" && b.finishDate && b.finishDate.startsWith(String(year))).length;
  const yearlyGoal = readingGoalStore.yearly || 24;
  const goalProgress = Math.min(Math.round((doneThisYear / yearlyGoal) * 100), 100);

  // 连续阅读天数
  const streak = readingGoalStore.streak || 0;
  const today = todayKey();
  const readToday = readingGoalStore.lastReadDate === today;

  els.readingGoalBar.innerHTML = `
    <div class="reading-goal-left">
      <div class="reading-goal-info">
        <span style="font-size:13px;color:var(--text-muted);">${year}年阅读目标</span>
        <strong style="font-size:20px;color:var(--blue);">${doneThisYear} / ${yearlyGoal} 本</strong>
      </div>
      <div class="reading-goal-progress">
        <div class="reading-goal-progress-bar" style="width:${goalProgress}%;"></div>
      </div>
      <span style="font-size:12px;color:var(--text-muted);">${goalProgress}%</span>
    </div>
    <div class="reading-goal-streak ${readToday ? "active" : ""}">
      <span style="font-size:24px;">🔥</span>
      <div>
        <strong style="font-size:18px;color:var(--orange);">${streak}</strong>
        <span style="font-size:11px;color:var(--text-muted);">天连续阅读</span>
      </div>
      ${!readToday ? `<button class="ghost-btn" id="markReadTodayBtn" style="font-size:12px;padding:4px 10px;">今日打卡</button>` : `<span style="font-size:12px;color:var(--green);">✓ 今日已读</span>`}
    </div>
    <button class="ghost-btn" id="setReadingGoalBtn" style="font-size:12px;padding:4px 10px;">设置目标</button>
  `;
}

function markReadToday() {
  const today = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().split("T")[0];

  if (readingGoalStore.lastReadDate === today) {
    showToast("今天已经打卡过了");
    return;
  }

  if (readingGoalStore.lastReadDate === yKey) {
    readingGoalStore.streak = (readingGoalStore.streak || 0) + 1;
  } else {
    readingGoalStore.streak = 1;
  }
  readingGoalStore.lastReadDate = today;
  if (!readingGoalStore.history) readingGoalStore.history = [];
  readingGoalStore.history.push(today);
  saveReadingGoal();
  showToast(`阅读打卡成功！连续${readingGoalStore.streak}天`);
  renderReadingGoalBar();
}

function setReadingGoal() {
  const input = window.prompt("请输入年度阅读目标（本数）：", String(readingGoalStore.yearly || 24));
  if (input === null) return;
  const num = parseInt(input, 10);
  if (isNaN(num) || num < 1 || num > 200) {
    showToast("请输入1-200之间的数字");
    return;
  }
  readingGoalStore.yearly = num;
  saveReadingGoal();
  showToast("阅读目标已更新");
  renderReadingGoalBar();
}

function renderBookshelfStats() {
  if (!els.bookshelfContent) return;
  const done = books.filter((b) => b.status === "done");
  const reading = books.filter((b) => b.status === "reading");
  const totalNotes = books.reduce((sum, b) => sum + (b.notes ? b.notes.length : 0), 0);

  // 按月统计阅读完成量
  const monthMap = {};
  done.forEach((b) => {
    if (b.finishDate) {
      const month = b.finishDate.substring(0, 7);
      monthMap[month] = (monthMap[month] || 0) + 1;
    }
  });
  const months = Object.keys(monthMap).sort().slice(-6);
  const maxCount = Math.max(...months.map((m) => monthMap[m]), 1);

  // 标签统计
  const tagMap = {};
  books.forEach((b) => {
    (b.tags || []).forEach((t) => { tagMap[t] = (tagMap[t] || 0) + 1; });
  });
  const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  let html = '<div class="book-stats-view">';
  html += `<h4 style="margin:0;">阅读统计</h4>`;

  // 概览数据
  html += `<div style="display:flex;gap:12px;flex-wrap:wrap;">
    <div class="bookshelf-stat-card"><strong style="color:var(--green);">${done.length}</strong><span>已读完</span></div>
    <div class="bookshelf-stat-card"><strong style="color:var(--blue);">${reading.length}</strong><span>阅读中</span></div>
    <div class="bookshelf-stat-card"><strong style="color:var(--purple);">${totalNotes}</strong><span>总笔记数</span></div>
    <div class="bookshelf-stat-card"><strong style="color:var(--orange);">${done.filter((b) => b.totalPages).reduce((s, b) => s + b.totalPages, 0)}</strong><span>已读页数</span></div>
  </div>`;

  // 阅读时长统计
  const allSessions = readingSessionsStore || [];
  const totalMinutes = allSessions.reduce((s, sess) => s + (sess.minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const reviewedBooks = done.filter((b) => b.review && b.review.content).length;
  if (allSessions.length > 0 || reviewedBooks > 0) {
    html += `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
      <div class="bookshelf-stat-card"><strong style="color:var(--blue);">${totalHours}h</strong><span>累计阅读时长</span></div>
      <div class="bookshelf-stat-card"><strong style="color:var(--green);">${allSessions.length}</strong><span>阅读次数</span></div>
      <div class="bookshelf-stat-card"><strong style="color:var(--purple);">${reviewedBooks}</strong><span>已写书评</span></div>
    </div>`;
  }

  // 月度阅读柱状图
  if (months.length) {
    html += `<h5 style="margin:0;">近${months.length}月阅读完成量</h5>`;
    html += `<div class="book-stats-chart">`;
    months.forEach((m) => {
      const count = monthMap[m];
      const height = Math.round((count / maxCount) * 100);
      html += `<div class="book-stats-bar-item">
        <div class="book-stats-bar-fill" style="height:${height}px;"></div>
        <div class="book-stats-bar-label">${m.substring(5)}月</div>
      </div>`;
    });
    html += `</div>`;
  }

  // 标签分布
  if (topTags.length) {
    html += `<h5 style="margin:0;">阅读标签分布</h5>`;
    html += `<div style="display:flex;gap:8px;flex-wrap:wrap;">`;
    topTags.forEach(([tag, count]) => {
      html += `<span class="book-tag" style="font-size:13px;padding:4px 12px;">${esc(tag)} × ${count}</span>`;
    });
    html += `</div>`;
  }

  // 已读书单列表
  if (done.length) {
    html += `<h5 style="margin:0;">已读书单（${done.length}本）</h5>`;
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;">`;
    done.forEach((b) => {
      html += `<div class="book-card" style="padding:12px;">
        <div class="book-card-head"><h4 style="font-size:14px;">${esc(b.title)}</h4></div>
        ${b.rating ? `<div class="book-rating">${"★".repeat(b.rating)}${"☆".repeat(5 - b.rating)}</div>` : ""}
        ${b.finishDate ? `<div style="font-size:11px;color:var(--muted);">读完：${esc(b.finishDate)}</div>` : ""}
      </div>`;
    });
    html += `</div>`;
  }

  // 阅读分类统计
  const categoryMap = {};
  books.forEach((b) => {
    (b.tags || []).forEach((t) => {
      if (!categoryMap[t]) categoryMap[t] = { total: 0, done: 0 };
      categoryMap[t].total++;
      if (b.status === "done") categoryMap[t].done++;
    });
  });
  const topCategories = Object.entries(categoryMap).sort((a, b) => b[1].total - a[1].total).slice(0, 10);

  if (topCategories.length) {
    html += `<h5 style="margin:0;">阅读分类统计（按标签）</h5>`;
    html += `<div style="display:flex;flex-direction:column;gap:6px;">`;
    topCategories.forEach(([tag, data]) => {
      const catProgress = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
      html += `<div style="display:flex;align-items:center;gap:8px;">
        <span style="min-width:80px;font-size:13px;">${esc(tag)}</span>
        <div style="flex:1;height:16px;border-radius:8px;background:var(--line);overflow:hidden;">
          <div style="height:100%;width:${catProgress}%;border-radius:8px;background:linear-gradient(90deg,var(--blue),var(--purple));transition:width 0.4s;"></div>
        </div>
        <span style="font-size:12px;color:var(--text-muted);min-width:60px;">${data.done}/${data.total} (${catProgress}%)</span>
      </div>`;
    });
    html += `</div>`;
  }

  // 阅读速度统计（基于已读书的页数和阅读天数）
  const doneWithPages = done.filter((b) => b.totalPages && b.startDate && b.finishDate);
  if (doneWithPages.length) {
    const speeds = doneWithPages.map((b) => {
      const days = Math.max((new Date(b.finishDate) - new Date(b.startDate)) / (24 * 60 * 60 * 1000), 1);
      return { title: b.title, pages: b.totalPages, days: Math.round(days), speed: Math.round(b.totalPages / days) };
    });
    const avgSpeed = Math.round(speeds.reduce((s, r) => s + r.speed, 0) / speeds.length);
    const fastest = speeds.sort((a, b) => b.speed - a.speed)[0];

    html += `<h5 style="margin:0;">阅读速度分析</h5>`;
    html += `<div style="display:flex;gap:12px;flex-wrap:wrap;">
      <div class="bookshelf-stat-card"><strong style="color:var(--blue);">${avgSpeed}</strong><span>日均页数</span></div>
      <div class="bookshelf-stat-card"><strong style="color:var(--green);">${fastest.speed}</strong><span>最快（${esc(fastest.title.substring(0, 8))}...）</span></div>
      <div class="bookshelf-stat-card"><strong style="color:var(--orange);">${done.filter((b) => b.totalPages).reduce((s, b) => s + b.totalPages, 0)}</strong><span>总阅读页数</span></div>
    </div>`;
  }

  // 评分分布
  const ratedBooks = done.filter((b) => b.rating && b.rating > 0);
  if (ratedBooks.length) {
    const ratingMap = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratedBooks.forEach((b) => { if (ratingMap[b.rating] !== undefined) ratingMap[b.rating]++; });
    html += `<h5 style="margin:0;">评分分布</h5>`;
    html += `<div style="display:flex;gap:12px;flex-wrap:wrap;">`;
    [5, 4, 3, 2, 1].forEach((star) => {
      const count = ratingMap[star];
      const pct = ratedBooks.length > 0 ? Math.round((count / ratedBooks.length) * 100) : 0;
      const starColor = star >= 4 ? "var(--green)" : star >= 3 ? "var(--orange)" : "var(--pink)";
      html += `<div style="display:flex;align-items:center;gap:4px;padding:4px 12px;border-radius:8px;background:var(--panel-soft);">
        <span style="color:${starColor};">${"★".repeat(star)}${"☆".repeat(5 - star)}</span>
        <strong>${count}</strong>
        <span style="font-size:11px;color:var(--text-muted);">${pct}%</span>
      </div>`;
    });
    html += `</div>`;
  }

  // 阅读热力图（最近30天打卡记录）
  const readHistory = readingGoalStore.history || [];
  if (readHistory.length) {
    html += `<h5 style="margin:0;">最近30天阅读打卡</h5>`;
    html += `<div style="display:grid;grid-template-columns:repeat(15,1fr);gap:4px;">`;
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dKey = d.toISOString().split("T")[0];
      const hasRead = readHistory.includes(dKey);
      const intensity = hasRead ? 1 : 0;
      html += `<div style="aspect-ratio:1;border-radius:4px;background:${hasRead ? "var(--green)" : "var(--line)"};opacity:${hasRead ? 1 : 0.5};" title="${dKey}"></div>`;
    }
    html += `</div>`;
    html += `<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:4px;">
      <span>30天前</span>
      <span>今天</span>
    </div>`;
  }

  if (!done.length && !reading.length) {
    html += `<div class="empty"><p>暂无阅读数据，添加书籍开始阅读之旅吧。</p><button class="primary-btn" data-book-new="1">添加书籍</button></div>`;
  }

  html += '</div>';
  els.bookshelfContent.innerHTML = html;
}

function openBookDialog(bookId) {
  if (!els.bookDialog) return;
  editingBookId = bookId || null;
  if (bookId) {
    const book = books.find((b) => b.id === bookId);
    if (book) {
      els.bookEditTitle.value = book.title || "";
      els.bookEditAuthor.value = book.author || "";
      els.bookEditStatus.value = book.status || "reading";
      els.bookEditTotalPages.value = book.totalPages || 0;
      els.bookEditCurrentPage.value = book.currentPage || 0;
      if (els.bookEditRating) els.bookEditRating.value = String(book.rating || 0);
      if (els.bookEditTags) els.bookEditTags.value = (book.tags || []).join(", ");
    }
  } else {
    els.bookEditTitle.value = "";
    els.bookEditAuthor.value = "";
    els.bookEditStatus.value = "reading";
    els.bookEditTotalPages.value = "";
    els.bookEditCurrentPage.value = "0";
    if (els.bookEditRating) els.bookEditRating.value = "0";
    if (els.bookEditTags) els.bookEditTags.value = "";
  }
  els.bookDialog.showModal();
}

function saveBookFromDialog() {
  if (!els.bookEditTitle) return;
  const title = els.bookEditTitle.value.trim();
  if (!title) { showToast("请输入书名"); return; }
  const tagStr = els.bookEditTags ? els.bookEditTags.value.trim() : "";
  const tags = tagStr ? tagStr.split(/[,，]/).map((t) => t.trim()).filter(Boolean) : [];
  const bookData = {
    title,
    author: els.bookEditAuthor.value.trim(),
    status: els.bookEditStatus.value,
    totalPages: parseInt(els.bookEditTotalPages.value, 10) || 0,
    currentPage: parseInt(els.bookEditCurrentPage.value, 10) || 0,
    rating: parseInt(els.bookEditRating ? els.bookEditRating.value : "0", 10) || 0,
    tags
  };
  if (editingBookId) {
    const book = books.find((b) => b.id === editingBookId);
    if (book) {
      Object.assign(book, bookData);
      if (bookData.currentPage >= bookData.totalPages && bookData.totalPages > 0) {
        book.status = "done";
        book.finishDate = todayKey();
      }
    }
  } else {
    books.push({
      id: uid("book"),
      ...bookData,
      startDate: todayKey(),
      notes: []
    });
  }
  saveBooks();
  els.bookDialog.close();
  showToast("书籍已保存");
  renderBookshelf();
}

function deleteBook(bookId) {
  if (!window.confirm("确认删除这本书？")) return;
  books = books.filter((b) => b.id !== bookId);
  saveBooks();
  showToast("书籍已删除");
  renderBookshelf();
}

function updateBookProgress(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return;
  if (!book.totalPages) { showToast("请先设置总页数"); return; }
  book.currentPage = Math.min((book.currentPage || 0) + Math.ceil(book.totalPages * 0.1), book.totalPages);
  if (book.currentPage >= book.totalPages) {
    book.status = "done";
    book.finishDate = todayKey();
  }
  saveBooks();
  showToast("进度已更新");
  renderBookshelf();
}

/* ─── 从推荐书单加入书架 ─── */
function addRecommendBook(idx) {
  const readingModule = (data.modules || []).find((m) => m.id === "reading");
  const items = (readingModule && readingModule.items) || [];
  if (idx < 0 || idx >= items.length) { showToast("推荐项不存在"); return; }
  const item = items[idx];
  // 检查是否已在书架中（按标题去重）
  if (books.some((b) => b.title === item.title)) {
    showToast("「" + item.title + "」已在书架中");
    return;
  }
  books.push({
    id: uid("book"),
    title: item.title,
    author: item.audience || "推荐",
    status: "reading",
    totalPages: 0,
    currentPage: 0,
    startDate: todayKey(),
    rating: 0,
    tags: (item.tags || []).slice(),
    notes: []
  });
  saveBooks();
  showToast("「" + item.title + "」已加入书架 · 在读");
  state.bookshelf = "reading";
  renderBookshelf();
}

function addRecommendBookAndRead(idx) {
  const readingModule = (data.modules || []).find((m) => m.id === "reading");
  const items = (readingModule && readingModule.items) || [];
  if (idx < 0 || idx >= items.length) { showToast("推荐项不存在"); return; }
  const item = items[idx];
  // 检查是否已在书架中
  let book = books.find((b) => b.title === item.title);
  if (!book) {
    book = {
      id: uid("book"),
      title: item.title,
      author: item.audience || "推荐",
      status: "reading",
      totalPages: 0,
      currentPage: 0,
      startDate: todayKey(),
      rating: 0,
      tags: (item.tags || []).slice(),
      notes: []
    };
    books.push(book);
    saveBooks();
  } else if (book.status !== "reading") {
    book.status = "reading";
    if (!book.startDate) book.startDate = todayKey();
    saveBooks();
  }
  state.bookshelf = "reading";
  renderBookshelf();
  // 打开阅读计时器
  setTimeout(() => openReadingTimerDialog(book.id), 200);
}

function addRecommendBookToWishlist(idx) {
  const readingModule = (data.modules || []).find((m) => m.id === "reading");
  const items = (readingModule && readingModule.items) || [];
  if (idx < 0 || idx >= items.length) { showToast("推荐项不存在"); return; }
  const item = items[idx];
  if (books.some((b) => b.title === item.title)) {
    showToast("「" + item.title + "」已在书架中");
    return;
  }
  books.push({
    id: uid("book"),
    title: item.title,
    author: item.audience || "推荐",
    status: "wishlist",
    totalPages: 0,
    currentPage: 0,
    rating: 0,
    tags: (item.tags || []).slice(),
    notes: []
  });
  saveBooks();
  showToast("「" + item.title + "」已加入想读列表");
  state.bookshelf = "wishlist";
  renderBookshelf();
}

/* ─── 读书笔记 ─── */
function openBookNoteDialog(bookId) {
  if (!els.bookNoteDialog) return;
  const book = books.find((b) => b.id === bookId);
  if (!book) return;
  editingBookNoteBookId = bookId;
  editingBookNoteId = null;
  if (els.bookNoteTitle) els.bookNoteTitle.textContent = "读书笔记 - " + book.title;
  if (els.bookNoteInfo) {
    const progress = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
    els.bookNoteInfo.innerHTML = `${esc(book.author || "未知作者")} | 进度：${book.currentPage || 0}/${book.totalPages || 0}页（${progress}%）`;
  }
  if (els.bookNoteType) els.bookNoteType.value = "highlight";
  if (els.bookNotePage) els.bookNotePage.value = "";
  if (els.bookNoteContent) els.bookNoteContent.value = "";

  // 如果已有笔记，在 dialog 下方显示列表
  let listEl = document.getElementById("bookNoteList");
  if (!listEl) {
    listEl = document.createElement("div");
    listEl.id = "bookNoteList";
    listEl.style.cssText = "margin-top:12px;max-height:200px;overflow-y:auto;";
    els.bookNoteDialog.querySelector("form").insertBefore(listEl, els.bookNoteDialog.querySelector(".dialog-actions"));
  }
  const notes = book.notes || [];
  if (notes.length) {
    listEl.innerHTML = "<div style='font-size:12px;color:var(--muted);margin-bottom:6px;'>已有笔记 " + notes.length + " 条：</div>" +
      notes.map((n, idx) => `<div class="book-note-item" style="margin-bottom:4px;">
        <span class="note-type ${n.type || "thought"}">${getNoteTypeLabel(n.type)}</span>
        ${n.page ? "<span style='font-size:11px;color:var(--muted);'>P" + n.page + "</span> " : ""}
        ${esc(n.content)}
        <button data-book-note-delete="${bookId}" data-book-note-idx="${idx}" class="ghost-btn" style="font-size:11px;padding:2px 8px;margin-left:4px;">删除</button>
      </div>`).join("");
  } else {
    listEl.innerHTML = "<div style='font-size:12px;color:var(--muted);'>暂无笔记</div>";
  }

  els.bookNoteDialog.showModal();
}

function saveBookNoteFromDialog() {
  if (!editingBookNoteBookId) return;
  const book = books.find((b) => b.id === editingBookNoteBookId);
  if (!book) return;
  const content = els.bookNoteContent ? els.bookNoteContent.value.trim() : "";
  if (!content) { showToast("请输入笔记内容"); return; }
  const note = {
    id: uid("note"),
    type: els.bookNoteType ? els.bookNoteType.value : "highlight",
    page: els.bookNotePage ? parseInt(els.bookNotePage.value, 10) || 0 : 0,
    content: content,
    createdAt: new Date().toISOString()
  };
  if (!book.notes) book.notes = [];
  book.notes.push(note);
  saveBooks();
  showToast("笔记已保存");
  // 刷新对话框中的笔记列表
  openBookNoteDialog(editingBookNoteBookId);
  // 刷新书架
  renderBookshelf();
}

function deleteBookNote(bookId, noteIdx) {
  const book = books.find((b) => b.id === bookId);
  if (!book || !book.notes) return;
  const idx = parseInt(noteIdx, 10);
  if (idx < 0 || idx >= book.notes.length) return;
  book.notes.splice(idx, 1);
  saveBooks();
  showToast("笔记已删除");
  openBookNoteDialog(bookId);
  renderBookshelf();
}

/* ─── AI 推荐书籍：调用 /api/ai/chat 获取推荐 ─── */
function aiRecommendBooks() {
  // 构造提示词：基于用户当前学习目标和兴趣
  const prompt = "请根据一个正在学习AI产品知识、英语和项目管理的职场人，推荐 3-5 本值得阅读的书籍。"
    + "每本书用 JSON 数组返回，每项包含 title（书名）、author（作者）、category（分类，如技术/管理/语言/效率）、"
    + "reason（推荐理由，50字以内）字段。只返回 JSON 数组，不要其他文字。";
  // 直接调用 AI 对话接口
  fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: prompt, stream: false })
  })
  .then((res) => res.json())
  .then((json) => {
    let recommendList = [];
    try {
      // 尝试从回复中提取 JSON 数组
      const text = json.choices && json.choices[0] ? json.choices[0].message.content : (json.content || json.reply || "");
      // 提取 JSON 数组部分
      const match = text.match(/\[[\s\S]*\]/);
      if (match) recommendList = JSON.parse(match[0]);
    } catch (e) {
      console.warn("解析 AI 推荐书籍失败", e);
    }
    if (recommendList.length) {
      // 将 AI 推荐结果临时显示在书架顶部
      let html = `<div style="margin-bottom:16px;">
        <h4 style="margin:0 0 8px;">AI 为你推荐</h4>
        <p style="color:var(--text-muted);margin:0 0 12px;">基于你的学习目标和兴趣精选：</p>`;
      recommendList.forEach((r, i) => {
        html += `<div class="book-card" style="border-left:3px solid var(--purple);">
          <div class="book-card-head">
            <h4>${esc(r.title)}</h4>
            <span class="tag">${esc(r.category || "推荐")}</span>
          </div>
          <p style="margin:4px 0;">${esc(r.author || "")}</p>
          <p style="margin:4px 0 8px;color:var(--text-secondary);">${esc(r.reason || "")}</p>
          <div class="book-card-actions">
            <button class="primary-btn" data-book-add-ai="${i}">加入书架</button>
          </div>
        </div>`;
      });
      html += `</div>`;
      // 保留原有内容
      const shelfBooks = books.filter((b) => b.status === state.bookshelf);
      if (shelfBooks.length) {
        html += shelfBooks.map((book) => {
          const progress = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
          return `<div class="book-card">
            <div class="book-card-head">
              <h4>${esc(book.title)}</h4>
              <span class="book-author">${esc(book.author || "未知作者")}</span>
            </div>
            <div class="book-progress">
              <div class="book-progress-bar"><div class="book-progress-fill" style="width:${progress}%"></div></div>
              <span>${book.currentPage || 0}/${book.totalPages || 0} 页（${progress}%）</span>
            </div>
            ${book.rating ? `<div class="book-rating">${"★".repeat(book.rating)}${"☆".repeat(5 - book.rating)}</div>` : ""}
            <div class="book-card-actions">
              <button class="ghost-btn" data-book-edit="${esc(book.id)}">编辑</button>
              <button class="ghost-btn" data-book-progress="${esc(book.id)}">进度+10%</button>
              <button class="ghost-btn" data-book-delete="${esc(book.id)}">删除</button>
            </div>
          </div>`;
        }).join("");
      }
      // 暂存 AI 推荐列表以便"加入书架"使用
      window._aiRecommendBooks = recommendList;
      els.bookshelfContent.innerHTML = html;
      showToast("AI 推荐已生成");
    } else {
      showToast("AI 推荐暂无结果，请稍后重试");
    }
  })
  .catch((err) => {
    console.warn("AI 推荐书籍请求失败", err);
    showToast("AI 推荐请求失败，请检查网络或服务状态");
  });
}

/* ─── 将 AI 推荐的书籍加入书架 ─── */
function addAiRecommendBook(idx) {
  const list = window._aiRecommendBooks || [];
  if (idx < 0 || idx >= list.length) { showToast("推荐项不存在"); return; }
  const r = list[idx];
  if (books.some((b) => b.title === r.title)) {
    showToast("「" + r.title + "」已在书架中");
    return;
  }
  books.push({
    id: uid("book"),
    title: r.title || "未知书名",
    author: r.author || "AI推荐",
    status: state.bookshelf || "reading",
    totalPages: 0,
    currentPage: 0,
    startDate: todayKey(),
    rating: 0,
    notes: (r.reason || "")
  });
  saveBooks();
  showToast("「" + r.title + "」已加入书架");
  renderBookshelf();
}

/* ════════════════════════════════════════════════════════════════════
 * 读书管理深化 - 书籍详情视图
 * ════════════════════════════════════════════════════════════════════ */

function openBookDetailDialog(bookId) {
  if (!els.bookDetailDialog) return;
  const book = books.find((b) => b.id === bookId);
  if (!book) return;

  if (els.bookDetailTitle) els.bookDetailTitle.textContent = book.title;

  const progress = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
  const notes = book.notes || [];
  const review = book.review || null;
  const tags = book.tags || [];
  const sessions = (readingSessionsStore || []).filter((s) => s.bookId === bookId);
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0);

  // 笔记按类型分组
  const noteTypeMap = { highlight: [], thought: [], question: [], summary: [] };
  notes.forEach((n) => {
    const type = n.type || "thought";
    if (noteTypeMap[type]) noteTypeMap[type].push(n);
    else noteTypeMap.thought.push(n);
  });

  let html = '';

  // 基本信息区
  html += `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;padding:16px;background:var(--panel-soft);border-radius:12px;">
    <div style="flex:1;min-width:200px;">
      <h4 style="margin:0 0 4px;">${esc(book.title)}</h4>
      <p style="margin:0;color:var(--text-muted);font-size:13px;">${esc(book.author || "未知作者")}</p>
      ${tags.length ? `<div style="margin:8px 0;">${tags.map((t) => `<span class="book-tag">${esc(t)}</span>`).join(" ")}</div>` : ""}
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      <div style="width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:conic-gradient(var(--blue) ${progress * 3.6}deg, var(--line) 0deg);">
        <div style="width:64px;height:64px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:var(--blue);">${progress}%</div>
      </div>
      <span style="font-size:12px;color:var(--text-muted);">${book.currentPage || 0}/${book.totalPages || 0}页</span>
    </div>
  </div>`;

  // 状态和时间信息
  const statusMap = { reading: "在读", wishlist: "想读", done: "已读" };
  html += `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
    <div class="bookshelf-stat-card"><strong style="color:var(--blue);">${esc(statusMap[book.status] || "—")}</strong><span>状态</span></div>
    <div class="bookshelf-stat-card"><strong style="color:var(--orange);">${book.rating ? "★".repeat(book.rating) : "—"}</strong><span>评分</span></div>
    <div class="bookshelf-stat-card"><strong style="color:var(--green);">${notes.length}</strong><span>笔记数</span></div>
    <div class="bookshelf-stat-card"><strong style="color:var(--purple);">${sessions.length}</strong><span>阅读次数</span></div>
    <div class="bookshelf-stat-card"><strong style="color:var(--pink);">${totalMinutes > 0 ? Math.floor(totalMinutes / 60) + "h" + (totalMinutes % 60) + "m" : "—"}</strong><span>累计时长</span></div>
  </div>`;

  // 时间线
  html += `<div style="margin-bottom:20px;">
    <h5 style="margin:0 0 8px;">时间线</h5>
    <div style="display:flex;flex-direction:column;gap:4px;font-size:13px;">
      ${book.startDate ? `<div><span style="color:var(--green);">●</span> ${esc(book.startDate)} 开始阅读</div>` : ""}
      ${book.finishDate ? `<div><span style="color:var(--blue);">●</span> ${esc(book.finishDate)} 读完</div>` : ""}
      ${sessions.length ? `<div><span style="color:var(--orange);">●</span> ${sessions.length} 次阅读计时记录</div>` : ""}
    </div>
  </div>`;

  // 书评
  if (review && review.content) {
    html += `<div style="margin-bottom:20px;padding:16px;border:1px solid var(--line);border-radius:12px;background:linear-gradient(135deg,#fff,var(--purple-soft));">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <h5 style="margin:0;">&#x270D; 我的书评</h5>
        <button class="ghost-btn" data-book-review="${esc(bookId)}" style="font-size:12px;padding:2px 8px;">编辑</button>
      </div>
      ${review.summary ? `<p style="font-size:15px;font-weight:600;color:var(--purple);margin:0 0 8px;font-style:italic;">"${esc(review.summary)}"</p>` : ""}
      <p style="margin:0;line-height:1.8;color:var(--text-secondary);white-space:pre-wrap;">${esc(review.content)}</p>
      ${review.rating ? `<div class="book-rating" style="margin-top:8px;">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div>` : ""}
    </div>`;
  }

  // 笔记列表（按类型分组）
  if (notes.length) {
    html += `<div style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <h5 style="margin:0;">&#x1F4DD; 读书笔记（${notes.length}条）</h5>
        <button class="ghost-btn" data-book-export-notes="${esc(bookId)}" style="font-size:12px;padding:2px 8px;">导出Markdown</button>
      </div>`;
    Object.entries(noteTypeMap).forEach(([type, typeNotes]) => {
      if (!typeNotes.length) return;
      const typeLabel = getNoteTypeLabel(type);
      const typeColors = { highlight: "blue", thought: "green", question: "orange", summary: "purple" };
      const tc = typeColors[type] || "blue";
      html += `<div style="margin-bottom:12px;">
        <div style="font-size:12px;color:var(--${tc});font-weight:600;margin-bottom:4px;">${typeLabel}（${typeNotes.length}）</div>`;
      typeNotes.forEach((n) => {
        html += `<div class="book-note-item" style="margin-bottom:4px;padding:8px 12px;border-radius:8px;background:var(--panel-soft);">
          ${n.page ? `<span style="font-size:11px;color:var(--muted);">P${n.page}</span> ` : ""}
          ${esc(n.content)}
          ${n.createdAt ? `<div style="font-size:10px;color:var(--muted);margin-top:2px;">${esc(n.createdAt.substring(0, 10))}</div>` : ""}
        </div>`;
      });
      html += `</div>`;
    });
    html += `</div>`;
  } else {
    html += `<div style="margin-bottom:20px;text-align:center;padding:16px;background:var(--panel-soft);border-radius:12px;">
      <p style="color:var(--text-muted);margin:0;">还没有笔记，点击「笔记」按钮添加第一条读书笔记。</p>
    </div>`;
  }

  // 阅读记录
  if (sessions.length) {
    html += `<div style="margin-bottom:20px;">
      <h5 style="margin:0 0 8px;">&#x23F1; 阅读记录（最近5次）</h5>`;
    sessions.slice(-5).reverse().forEach((s) => {
      const h = Math.floor(s.minutes / 60);
      const m = s.minutes % 60;
      html += `<div style="display:flex;justify-content:space-between;padding:6px 12px;border-radius:8px;background:var(--panel-soft);margin-bottom:4px;font-size:13px;">
        <span>${esc(s.date)}</span>
        <span style="color:var(--blue);">${h > 0 ? h + "h " : ""}${m}min</span>
        ${s.toPage ? `<span style="color:var(--text-muted);">读到第${s.toPage}页</span>` : ""}
      </div>`;
    });
    html += `</div>`;
  }

  if (els.bookDetailBody) els.bookDetailBody.innerHTML = html;
  els.bookDetailDialog.showModal();
}

/* ════════════════════════════════════════════════════════════════════
 * 读书管理深化 - 书评系统
 * ════════════════════════════════════════════════════════════════════ */

let editingReviewBookId = null;

function openBookReviewDialog(bookId) {
  if (!els.bookReviewDialog) return;
  const book = books.find((b) => b.id === bookId);
  if (!book) return;
  editingReviewBookId = bookId;
  if (els.bookReviewTitle) els.bookReviewTitle.textContent = "书评 - " + book.title;
  if (els.bookReviewInfo) {
    const progress = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
    els.bookReviewInfo.innerHTML = `${esc(book.author || "未知作者")} | 进度：${book.currentPage || 0}/${book.totalPages || 0}页（${progress}%）`;
  }
  const review = book.review || {};
  if (els.bookReviewRating) els.bookReviewRating.value = String(review.rating || book.rating || 0);
  if (els.bookReviewSummary) els.bookReviewSummary.value = review.summary || "";
  if (els.bookReviewContent) els.bookReviewContent.value = review.content || "";
  els.bookReviewDialog.showModal();
}

function saveBookReviewFromDialog() {
  if (!editingReviewBookId) return;
  const book = books.find((b) => b.id === editingReviewBookId);
  if (!book) return;
  const rating = parseInt(els.bookReviewRating ? els.bookReviewRating.value : "0", 10) || 0;
  const summary = els.bookReviewSummary ? els.bookReviewSummary.value.trim() : "";
  const content = els.bookReviewContent ? els.bookReviewContent.value.trim() : "";
  if (!content && !summary) { showToast("请输入书评内容"); return; }
  book.review = { rating, summary, content, updatedAt: new Date().toISOString() };
  if (rating > 0) book.rating = rating;
  saveBooks();
  els.bookReviewDialog.close();
  showToast("书评已保存");
  renderBookshelf();
}

/* ════════════════════════════════════════════════════════════════════
 * 读书管理深化 - 阅读计时器
 * ════════════════════════════════════════════════════════════════════ */

function openReadingTimerDialog(bookId) {
  if (!els.readingTimerDialog) return;
  const book = books.find((b) => b.id === bookId);
  if (!book) return;
  readingTimerState.bookId = bookId;
  readingTimerState.running = false;
  readingTimerState.paused = false;
  readingTimerState.startTime = 0;
  readingTimerState.elapsed = 0;
  if (readingTimerState.intervalId) { clearInterval(readingTimerState.intervalId); readingTimerState.intervalId = null; }
  if (els.readingTimerInfo) {
    const progress = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
    els.readingTimerInfo.innerHTML = `《${esc(book.title)}》| 当前进度：${book.currentPage || 0}/${book.totalPages || 0}页（${progress}%）`;
  }
  if (els.readingTimerDisplay) els.readingTimerDisplay.textContent = "00:00:00";
  if (els.readingTimerPage) els.readingTimerPage.value = book.currentPage || "";
  if (els.readingTimerStartBtn) els.readingTimerStartBtn.style.display = "";
  if (els.readingTimerPauseBtn) { els.readingTimerPauseBtn.style.display = "none"; els.readingTimerPauseBtn.textContent = "暂停"; }
  if (els.readingTimerStopBtn) els.readingTimerStopBtn.style.display = "none";
  els.readingTimerDialog.showModal();
}

function startReadingTimer() {
  if (readingTimerState.running && !readingTimerState.paused) return;
  readingTimerState.running = true;
  readingTimerState.paused = false;
  readingTimerState.startTime = Date.now();
  if (els.readingTimerStartBtn) els.readingTimerStartBtn.style.display = "none";
  if (els.readingTimerPauseBtn) { els.readingTimerPauseBtn.style.display = ""; els.readingTimerPauseBtn.textContent = "暂停"; }
  if (els.readingTimerStopBtn) els.readingTimerStopBtn.style.display = "";
  readingTimerState.intervalId = setInterval(updateReadingTimerDisplay, 1000);
}

function pauseReadingTimer() {
  if (!readingTimerState.running) return;
  if (readingTimerState.paused) {
    // 恢复
    readingTimerState.paused = false;
    readingTimerState.startTime = Date.now();
    if (els.readingTimerPauseBtn) els.readingTimerPauseBtn.textContent = "暂停";
    readingTimerState.intervalId = setInterval(updateReadingTimerDisplay, 1000);
  } else {
    // 暂停
    readingTimerState.paused = true;
    readingTimerState.elapsed += Math.floor((Date.now() - readingTimerState.startTime) / 1000);
    if (readingTimerState.intervalId) { clearInterval(readingTimerState.intervalId); readingTimerState.intervalId = null; }
    if (els.readingTimerPauseBtn) els.readingTimerPauseBtn.textContent = "继续";
  }
}

function stopReadingTimer() {
  if (!readingTimerState.running) return;
  if (!readingTimerState.paused) {
    readingTimerState.elapsed += Math.floor((Date.now() - readingTimerState.startTime) / 1000);
  }
  if (readingTimerState.intervalId) { clearInterval(readingTimerState.intervalId); readingTimerState.intervalId = null; }
  readingTimerState.running = false;
  readingTimerState.paused = false;

  const minutes = Math.max(Math.round(readingTimerState.elapsed / 60), 1);
  const bookId = readingTimerState.bookId;
  const book = books.find((b) => b.id === bookId);
  const toPage = els.readingTimerPage ? parseInt(els.readingTimerPage.value, 10) || 0 : 0;

  // 保存阅读会话
  readingSessionsStore.push({
    id: uid("session"),
    bookId: bookId,
    date: todayKey(),
    minutes: minutes,
    toPage: toPage,
    createdAt: new Date().toISOString()
  });
  saveReadingSessions();

  // 更新书籍进度
  if (book && toPage > 0) {
    book.currentPage = toPage;
    if (book.totalPages && toPage >= book.totalPages) {
      book.status = "done";
      book.finishDate = todayKey();
    }
    saveBooks();
  }

  // 更新阅读打卡
  const today = todayKey();
  if (readingGoalStore.lastReadDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().split("T")[0];
    if (readingGoalStore.lastReadDate === yKey) {
      readingGoalStore.streak = (readingGoalStore.streak || 0) + 1;
    } else {
      readingGoalStore.streak = 1;
    }
    readingGoalStore.lastReadDate = today;
    if (!readingGoalStore.history) readingGoalStore.history = [];
    readingGoalStore.history.push(today);
    saveReadingGoal();
  }

  showToast(`阅读结束！本次 ${minutes} 分钟已记录`);
  els.readingTimerDialog.close();
  renderBookshelf();
}

function updateReadingTimerDisplay() {
  let total = readingTimerState.elapsed;
  if (!readingTimerState.paused) {
    total += Math.floor((Date.now() - readingTimerState.startTime) / 1000);
  }
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (els.readingTimerDisplay) {
    els.readingTimerDisplay.textContent =
      String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }
}

/* ════════════════════════════════════════════════════════════════════
 * 读书管理深化 - 筛选标签更新 + 笔记导出
 * ════════════════════════════════════════════════════════════════════ */

function updateBookshelfTagFilter() {
  if (!els.bookshelfTagFilter) return;
  const allTags = new Set();
  books.forEach((b) => { (b.tags || []).forEach((t) => allTags.add(t)); });
  const currentVal = bookshelfFilterState.tag || "";
  let html = '<option value="">全部标签</option>';
  Array.from(allTags).sort().forEach((t) => {
    html += `<option value="${esc(t)}"${t === currentVal ? " selected" : ""}>${esc(t)}</option>`;
  });
  els.bookshelfTagFilter.innerHTML = html;
}

function exportBookNotes(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return;
  const notes = book.notes || [];
  if (!notes.length) { showToast("暂无笔记可导出"); return; }

  let md = `# 《${book.title}》读书笔记\n\n`;
  md += `> 作者：${book.author || "未知"}\n`;
  md += `> 状态：${book.status === "done" ? "已读" : book.status === "reading" ? "在读" : "想读"}\n`;
  if (book.rating) md += `> 评分：${"★".repeat(book.rating)}${"☆".repeat(5 - book.rating)}\n`;
  if (book.totalPages) md += `> 进度：${book.currentPage || 0}/${book.totalPages}页\n`;
  md += `\n`;

  if (book.review && book.review.content) {
    md += `## 书评\n\n`;
    if (book.review.summary) md += `> ${book.review.summary}\n\n`;
    md += `${book.review.content}\n\n---\n\n`;
  }

  const typeLabels = { highlight: "划线摘录", thought: "心得感悟", question: "疑问待解", summary: "章节总结" };
  const typeOrder = ["highlight", "thought", "question", "summary"];
  typeOrder.forEach((type) => {
    const typeNotes = notes.filter((n) => (n.type || "thought") === type);
    if (!typeNotes.length) return;
    md += `## ${typeLabels[type]}（${typeNotes.length}条）\n\n`;
    typeNotes.forEach((n, i) => {
      md += `### ${i + 1}${n.page ? `（P${n.page}）` : ""}\n\n`;
      md += `${n.content}\n\n`;
    });
  });

  // 下载为文件
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${book.title.replace(/[\\/:*?"<>|]/g, "_")}-读书笔记.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("笔记已导出为 Markdown 文件");
}

function getWaterToday() {
  const key = todayKey();
  if (!waterStore[key]) {
    waterStore[key] = { todayML: 0, goalML: 2000, records: [] };
  }
  return waterStore[key];
}

function renderWater() {
  const water = getWaterToday();
  if (els.waterCurrent) els.waterCurrent.textContent = (water.todayML || 0) + "ml";
  if (els.waterGoalText) els.waterGoalText.textContent = "/ " + (water.goalML || 2000) + "ml";
  if (els.waterGoalInput) els.waterGoalInput.value = water.goalML || 2000;

  // 进度环
  if (els.waterRing) {
    const circumference = 2 * Math.PI * 68;
    const progress = Math.min((water.todayML || 0) / (water.goalML || 2000), 1);
    const offset = circumference * progress;
    els.waterRing.setAttribute("stroke-dasharray", `${offset} ${circumference}`);
  }

  // 记录列表
  if (els.waterRecord) {
    if (!water.records || !water.records.length) {
      els.waterRecord.innerHTML = '<div class="empty" style="padding:16px;"><p>今天还没有记录饮水。</p></div>';
    } else {
      els.waterRecord.innerHTML = water.records.map((r) => `
        <div class="water-record-item">
          <span>${esc(r.time || "")}</span>
          <strong>+${r.ml}ml</strong>
        </div>
      `).join("");
    }
  }
}

function addWater(ml) {
  const water = getWaterToday();
  water.todayML = (water.todayML || 0) + ml;
  if (!water.records) water.records = [];
  water.records.push({ time: new Date().toLocaleTimeString("zh-CN"), ml });
  saveWater();
  showToast(`已记录 +${ml}ml`);
  renderWater();
}

function saveWaterGoal() {
  if (!els.waterGoalInput) return;
  const goal = parseInt(els.waterGoalInput.value, 10);
  if (!goal || goal < 500) { showToast("请输入有效的目标（至少 500ml）"); return; }
  const water = getWaterToday();
  water.goalML = goal;
  saveWater();
  showToast("饮水目标已保存");
  renderWater();
}

/* ════════════════════════════════════════════════════════════════════
 * 15. 健康生活 - 饮食热量
 * ════════════════════════════════════════════════════════════════════ */

if (!dietStore.records) dietStore.records = [];

async function handleDietUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { showToast("请上传图片文件"); return; }
  showToast("正在识别食物...");
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    try {
      const response = await fetch("/api/health/food-recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 })
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "识别失败");

      // TRAE桥接模式
      if (result.mode === "trae-bridge") {
        if (els.dietResult) {
          els.dietResult.querySelector(".diet-result-content").innerHTML = buildTraeBridgeUI(result.traePrompt, result.fallbackReason);
        }
        showToast("已切换为TRAE桥接模式");
        return;
      }

      renderDietResult(result.foods, base64);
      // 保存记录
      const today = todayKey();
      dietStore.records.push({
        id: uid("diet"),
        date: today,
        time: new Date().toLocaleTimeString("zh-CN"),
        foods: result.foods,
        image: base64
      });
      saveDiet();
      renderDietRecords();
    } catch (error) {
      showToast("食物识别失败：" + error.message);
      if (els.dietResult) {
        els.dietResult.querySelector(".diet-result-content").innerHTML = `<p style="color:var(--pink);">识别失败：${esc(error.message)}</p>`;
      }
    }
  };
  reader.readAsDataURL(file);
}

function renderDietResult(foods, image) {
  if (!els.dietResult) return;
  const content = els.dietResult.querySelector(".diet-result-content");
  if (!content) return;
  content.innerHTML = `
    ${image ? `<img src="${image}" style="max-width:100%;border-radius:8px;margin-bottom:8px;" />` : ""}
    ${foods.map((f) => `
      <div class="diet-food-item">
        <strong>${esc(f.name)}</strong>
        <span>${f.calories} kcal</span>
        <span>蛋白质 ${f.nutrition?.protein || 0}g · 碳水 ${f.nutrition?.carbs || 0}g · 脂肪 ${f.nutrition?.fat || 0}g</span>
        <small>${esc(f.portion || "")}</small>
      </div>
    `).join("")}
  `;
  updateCalorieStats();
}

function renderDietRecords() {
  if (!els.dietRecord) return;
  const list = els.dietRecord.querySelector(".diet-record-list");
  if (!list) return;
  const today = todayKey();
  const todayRecords = (dietStore.records || []).filter((r) => r.date === today);
  if (!todayRecords.length) {
    list.innerHTML = '<div class="empty" style="padding:16px;"><p>今天还没有记录饮食。</p></div>';
  } else {
    list.innerHTML = todayRecords.map((r) => `
      <div class="diet-record-item">
        <span>${esc(r.time || "")}</span>
        ${(r.foods || []).map((f) => `<strong>${esc(f.name)} ${f.calories}kcal</strong>`).join("")}
      </div>
    `).join("");
  }
  updateCalorieStats();
}

function updateCalorieStats() {
  const today = todayKey();
  const todayRecords = (dietStore.records || []).filter((r) => r.date === today);
  let total = 0, protein = 0, carbs = 0, fat = 0;
  todayRecords.forEach((r) => {
    (r.foods || []).forEach((f) => {
      total += f.calories || 0;
      protein += f.nutrition?.protein || 0;
      carbs += f.nutrition?.carbs || 0;
      fat += f.nutrition?.fat || 0;
    });
  });
  if (els.calorieTotal) els.calorieTotal.textContent = total;
  if (els.calorieProtein) els.calorieProtein.textContent = Math.round(protein) + "g";
  if (els.calorieCarbs) els.calorieCarbs.textContent = Math.round(carbs) + "g";
  if (els.calorieFat) els.calorieFat.textContent = Math.round(fat) + "g";
}

function renderDiet() {
  renderDietRecords();
  updateCalorieStats();
}

/* ════════════════════════════════════════════════════════════════════
 * v10.0 健康生活模块 — 健康总览 / 运动记录 / 睡眠管理 / 习惯打卡
 * ════════════════════════════════════════════════════════════════════ */

/* ── 辅助：获取最近N天的日期数组 ── */
function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/* ── 辅助：运动类型图标 ── */
const exerciseIcons = {
  "跑步": "🏃", "快走": "🚶", "骑行": "🚴", "游泳": "🏊",
  "健身": "💪", "瑜伽": "🧘", "跳绳": "🤸", "篮球": "🏀",
  "羽毛球": "🏸", "其他": "📦"
};

/* ── 辅助：估算运动消耗热量（MET值法） ── */
const exerciseMETs = {
  "跑步": 8.0, "快走": 3.5, "骑行": 6.0, "游泳": 7.0,
  "健身": 5.0, "瑜伽": 2.5, "跳绳": 10.0, "篮球": 6.5,
  "羽毛球": 5.5, "其他": 4.0
};

function calcExerciseCalories(type, duration, intensity) {
  const met = exerciseMETs[type] || 4.0;
  const intensityMul = intensity === "高强度" ? 1.3 : intensity === "中等" ? 1.0 : 0.7;
  return Math.round(met * 60 * (duration / 60) * intensityMul);
}

/* ════════════ 健康总览仪表盘 ════════════ */
function renderHealthDashboard() {
  const el = document.querySelector("#healthDashboard");
  if (!el) return;
  const today = todayKey();
  const last7 = getLastNDays(7);
  const dayLabels = last7.map((d) => new Date(d + "T00:00:00").toLocaleDateString("zh-CN", { weekday: "short" }));

  // 今日数据汇总
  const waterToday = waterStore[today] || { todayML: 0, goalML: 2000 };
  const waterPct = Math.min(100, Math.round((waterToday.todayML / (waterToday.goalML || 2000)) * 100));

  const dietToday = (dietStore.records || []).filter((r) => r.date === today);
  const caloriesToday = dietToday.reduce((sum, r) => sum + (r.foods || []).reduce((s, f) => s + (f.calories || 0), 0), 0);

  const exToday = (exerciseStore.records || []).filter((r) => r.date === today);
  const exMinutes = exToday.reduce((s, r) => s + (r.duration || 0), 0);
  const exCalories = exToday.reduce((s, r) => s + (r.calories || 0), 0);

  const sleepToday = (sleepStore.records || []).filter((r) => r.date === today);
  const sleepHours = sleepToday.length > 0 ? sleepToday[sleepToday.length - 1].duration : 0;

  const activeHabits = (habitStore.habits || []).filter((h) => !h.archived);
  const checkedToday = activeHabits.filter((h) => (habitStore.checkins[h.id] || []).includes(today)).length;
  const habitPct = activeHabits.length > 0 ? Math.round((checkedToday / activeHabits.length) * 100) : 0;

  // 7日趋势数据
  const waterTrend = last7.map((d) => (waterStore[d] || {}).todayML || 0);
  const exTrend = last7.map((d) => (exerciseStore.records || []).filter((r) => r.date === d).reduce((s, r) => s + (r.duration || 0), 0));
  const sleepTrend = last7.map((d) => {
    const recs = (sleepStore.records || []).filter((r) => r.date === d);
    return recs.length > 0 ? recs[recs.length - 1].duration : 0;
  });

  el.innerHTML = `
    <div class="health-dash-metrics">
      <div class="health-dash-metric">
        <div class="health-dash-metric-icon">💧</div>
        <div class="health-dash-metric-value">${waterToday.todayML || 0}ml</div>
        <div class="health-dash-metric-label">今日饮水</div>
        <div class="health-dash-metric-sub ${waterPct >= 100 ? "good" : "warn"}">目标 ${waterPct}%</div>
      </div>
      <div class="health-dash-metric">
        <div class="health-dash-metric-icon">🍽️</div>
        <div class="health-dash-metric-value">${caloriesToday}</div>
        <div class="health-dash-metric-label">摄入热量(kcal)</div>
        <div class="health-dash-metric-sub ${caloriesToday > 0 && caloriesToday < 2000 ? "good" : "warn"}">${caloriesToday > 0 ? "已记录" : "未记录"}</div>
      </div>
      <div class="health-dash-metric">
        <div class="health-dash-metric-icon">🏃</div>
        <div class="health-dash-metric-value">${exMinutes}min</div>
        <div class="health-dash-metric-label">今日运动</div>
        <div class="health-dash-metric-sub ${exMinutes >= 30 ? "good" : "warn"}">消耗 ${exCalories}kcal</div>
      </div>
      <div class="health-dash-metric">
        <div class="health-dash-metric-icon">😴</div>
        <div class="health-dash-metric-value">${sleepHours.toFixed(1)}h</div>
        <div class="health-dash-metric-label">昨晚睡眠</div>
        <div class="health-dash-metric-sub ${sleepHours >= 7 ? "good" : "warn"}">${sleepHours >= 7 ? "充足" : sleepHours > 0 ? "不足" : "未记录"}</div>
      </div>
      <div class="health-dash-metric">
        <div class="health-dash-metric-icon">🔥</div>
        <div class="health-dash-metric-value">${checkedToday}/${activeHabits.length}</div>
        <div class="health-dash-metric-label">习惯打卡</div>
        <div class="health-dash-metric-sub ${habitPct >= 80 ? "good" : "warn"}">完成率 ${habitPct}%</div>
      </div>
    </div>

    <div class="health-dash-trends">
      <div class="health-dash-trend-card">
        <div class="health-dash-trend-title">💧 饮水趋势（7天）</div>
        <div class="health-dash-mini-chart">
          ${waterTrend.map((v) => {
            const h = Math.max(4, Math.min(48, (v / 2000) * 48));
            return `<div class="health-dash-mini-bar" style="height:${h}px;background:#0997d9;" title="${v}ml"></div>`;
          }).join("")}
        </div>
        <div class="health-dash-mini-labels">
          ${dayLabels.map((l) => `<span class="health-dash-mini-label">${l}</span>`).join("")}
        </div>
      </div>
      <div class="health-dash-trend-card">
        <div class="health-dash-trend-title">🏃 运动时长（7天）</div>
        <div class="health-dash-mini-chart">
          ${exTrend.map((v) => {
            const h = Math.max(4, Math.min(48, (v / 60) * 48));
            return `<div class="health-dash-mini-bar" style="height:${h}px;background:#4caf50;" title="${v}min"></div>`;
          }).join("")}
        </div>
        <div class="health-dash-mini-labels">
          ${dayLabels.map((l) => `<span class="health-dash-mini-label">${l}</span>`).join("")}
        </div>
      </div>
      <div class="health-dash-trend-card">
        <div class="health-dash-trend-title">😴 睡眠时长（7天）</div>
        <div class="health-dash-mini-chart">
          ${sleepTrend.map((v) => {
            const h = Math.max(4, Math.min(48, (v / 8) * 48));
            return `<div class="health-dash-mini-bar" style="height:${h}px;background:#9c27b0;" title="${v.toFixed(1)}h"></div>`;
          }).join("")}
        </div>
        <div class="health-dash-mini-labels">
          ${dayLabels.map((l) => `<span class="health-dash-mini-label">${l}</span>`).join("")}
        </div>
      </div>
    </div>

    <div class="health-dash-quick">
      <button class="ghost-btn" onclick="state.moduleId='health';state.tab='饮水追踪';state.view='cards';render();">💧 记录饮水</button>
      <button class="ghost-btn" onclick="state.moduleId='health';state.tab='饮食热量';state.view='cards';render();">🍽️ 记录饮食</button>
      <button class="ghost-btn" onclick="state.moduleId='health';state.tab='运动记录';state.view='cards';render();">🏃 记录运动</button>
      <button class="ghost-btn" onclick="state.moduleId='health';state.tab='睡眠管理';state.view='cards';render();">😴 记录睡眠</button>
      <button class="ghost-btn" onclick="state.moduleId='health';state.tab='习惯打卡';state.view='cards';render();">🔥 习惯打卡</button>
    </div>
  `;
}

/* ════════════ 运动记录 ════════════ */
function renderExercise() {
  const today = todayKey();
  const todayRecords = (exerciseStore.records || []).filter((r) => r.date === today);
  const totalMin = todayRecords.reduce((s, r) => s + (r.duration || 0), 0);
  const totalCal = todayRecords.reduce((s, r) => s + (r.calories || 0), 0);

  // 统计卡片
  const statsEl = document.querySelector("#exerciseStats");
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="exercise-stat-item"><strong>${todayRecords.length}</strong><span>今日次数</span></div>
      <div class="exercise-stat-item"><strong>${totalMin}</strong><span>总时长(min)</span></div>
      <div class="exercise-stat-item"><strong>${totalCal}</strong><span>消耗(kcal)</span></div>
    `;
  }

  // 记录列表
  const listEl = document.querySelector("#exerciseRecordList");
  if (listEl) {
    if (todayRecords.length === 0) {
      listEl.innerHTML = `<div class="empty" style="padding:16px;"><p>今天还没有运动记录。</p></div>`;
    } else {
      listEl.innerHTML = todayRecords.map((r) => `
        <div class="exercise-record-item">
          <span class="exercise-record-icon">${exerciseIcons[r.type] || "📦"}</span>
          <div class="exercise-record-info">
            <div class="exercise-record-type">${esc(r.type)}</div>
            <div class="exercise-record-meta">${r.duration}分钟 · ${esc(r.intensity)} · ${esc(r.time || "")} ${r.note ? "· " + esc(r.note) : ""}</div>
          </div>
          <span class="exercise-record-cal">${r.calories}kcal</span>
          <button class="exercise-record-del" data-exercise-del="${r.id}" title="删除">✕</button>
        </div>
      `).join("");
    }
  }

  // 周趋势
  renderExerciseWeekly();
}

function renderExerciseWeekly() {
  const chartEl = document.querySelector("#exerciseWeeklyChart");
  if (!chartEl) return;
  const last7 = getLastNDays(7);
  const dayLabels = last7.map((d) => new Date(d + "T00:00:00").toLocaleDateString("zh-CN", { weekday: "short" }));
  const data = last7.map((d) => (exerciseStore.records || []).filter((r) => r.date === d).reduce((s, r) => s + (r.duration || 0), 0));
  const maxVal = Math.max(60, ...data);

  chartEl.innerHTML = data.map((v, i) => {
    const h = Math.max(4, (v / maxVal) * 72);
    return `<div class="weekly-chart-bar">
      <span class="weekly-chart-bar-value">${v > 0 ? v : ""}</span>
      <div class="weekly-chart-bar-fill" style="height:${h}px;background:#4caf50;"></div>
      <span class="weekly-chart-bar-label">${dayLabels[i]}</span>
    </div>`;
  }).join("");
}

function addExerciseRecord() {
  const typeEl = document.querySelector("#exerciseType");
  const durEl = document.querySelector("#exerciseDuration");
  const intEl = document.querySelector("#exerciseIntensity");
  const noteEl = document.querySelector("#exerciseNote");
  if (!typeEl || !durEl) return;

  const type = typeEl.value;
  const duration = parseInt(durEl.value, 10);
  const intensity = intEl ? intEl.value : "中等";
  const note = noteEl ? noteEl.value.trim() : "";

  if (!duration || duration < 1) { showToast("请输入有效的运动时长"); return; }

  const calories = calcExerciseCalories(type, duration, intensity);
  const now = new Date();
  const record = {
    id: "ex_" + Date.now(),
    date: todayKey(),
    time: now.toTimeString().slice(0, 8),
    type, duration, intensity, calories, note
  };

  if (!exerciseStore.records) exerciseStore.records = [];
  exerciseStore.records.push(record);
  saveExercise();

  if (noteEl) noteEl.value = "";
  showToast("运动记录已添加，消耗 " + calories + "kcal");
  renderExercise();
}

function deleteExerciseRecord(id) {
  if (!exerciseStore.records) return;
  exerciseStore.records = exerciseStore.records.filter((r) => r.id !== id);
  saveExercise();
  showToast("已删除运动记录");
  renderExercise();
}

/* ════════════ 睡眠管理 ════════════ */
function calcSleepDuration(bedtime, wakeTime) {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  if (wakeMin <= bedMin) wakeMin += 24 * 60; // 跨天
  return Math.round((wakeMin - bedMin) / 60 * 10) / 10;
}

function renderSleep() {
  const today = todayKey();
  const todayRecords = (sleepStore.records || []).filter((r) => r.date === today);
  const latest = todayRecords.length > 0 ? todayRecords[todayRecords.length - 1] : null;

  // 昨晚摘要
  const summaryEl = document.querySelector("#sleepSummary");
  if (summaryEl) {
    if (!latest) {
      summaryEl.innerHTML = `<p style="color:var(--muted);padding:12px 0;">今天还没有睡眠记录，快添加吧！</p>`;
    } else {
      const stars = "⭐".repeat(latest.quality) + "☆".repeat(5 - latest.quality);
      summaryEl.innerHTML = `
        <div class="sleep-summary-grid">
          <div class="sleep-summary-item"><strong>${latest.duration}h</strong><span>睡眠时长</span></div>
          <div class="sleep-summary-item"><strong>${esc(latest.bedtime)}</strong><span>入睡时间</span></div>
          <div class="sleep-summary-item"><strong>${esc(latest.wakeTime)}</strong><span>起床时间</span></div>
          <div class="sleep-summary-item"><strong>${stars}</strong><span>睡眠质量</span></div>
        </div>
        ${latest.note ? `<p style="margin-top:8px;font-size:13px;color:var(--muted);">备注：${esc(latest.note)}</p>` : ""}
      `;
    }
  }

  // 睡眠负债（近7天 vs 目标8小时）
  const debtEl = document.querySelector("#sleepDebt");
  if (debtEl) {
    const last7 = getLastNDays(7);
    const sleepData = last7.map((d) => {
      const recs = (sleepStore.records || []).filter((r) => r.date === d);
      return recs.length > 0 ? recs[recs.length - 1].duration : 0;
    });
    const totalSleep = sleepData.reduce((s, v) => s + v, 0);
    const targetSleep = 8 * 7;
    const debt = targetSleep - totalSleep;
    const debtPct = Math.min(100, Math.max(0, (totalSleep / targetSleep) * 100));

    debtEl.innerHTML = `
      <h4>😴 睡眠负债（近7天）</h4>
      <div class="sleep-debt-bar">
        <div class="sleep-debt-fill" style="width:${debtPct}%;background:${debt > 0 ? "#ff9800" : "#4caf50"};"></div>
      </div>
      <p class="sleep-debt-text">
        已睡 ${totalSleep.toFixed(1)}h / 目标 ${targetSleep}h ·
        ${debt > 0 ? `<span style="color:var(--orange);">负债 ${debt.toFixed(1)}h</span>` : `<span style="color:var(--green);">充足，无负债</span>`}
      </p>
    `;
  }

  // 周趋势
  renderSleepWeekly();
}

function renderSleepWeekly() {
  const chartEl = document.querySelector("#sleepWeeklyChart");
  if (!chartEl) return;
  const last7 = getLastNDays(7);
  const dayLabels = last7.map((d) => new Date(d + "T00:00:00").toLocaleDateString("zh-CN", { weekday: "short" }));
  const data = last7.map((d) => {
    const recs = (sleepStore.records || []).filter((r) => r.date === d);
    return recs.length > 0 ? recs[recs.length - 1].duration : 0;
  });
  const maxVal = 10;

  chartEl.innerHTML = data.map((v, i) => {
    const h = Math.max(4, (v / maxVal) * 72);
    return `<div class="weekly-chart-bar">
      <span class="weekly-chart-bar-value">${v > 0 ? v.toFixed(1) + "h" : ""}</span>
      <div class="weekly-chart-bar-fill" style="height:${h}px;background:${v >= 7 ? "#4caf50" : v > 0 ? "#ff9800" : "#e0e0e0"};"></div>
      <span class="weekly-chart-bar-label">${dayLabels[i]}</span>
    </div>`;
  }).join("");
}

function addSleepRecord() {
  const bedEl = document.querySelector("#sleepBedtime");
  const wakeEl = document.querySelector("#sleepWakeTime");
  const qualEl = document.querySelector("#sleepQuality");
  const noteEl = document.querySelector("#sleepNote");
  if (!bedEl || !wakeEl) return;

  const bedtime = bedEl.value;
  const wakeTime = wakeEl.value;
  const quality = parseInt(qualEl ? qualEl.value : "3", 10);
  const note = noteEl ? noteEl.value.trim() : "";
  const duration = calcSleepDuration(bedtime, wakeTime);

  const record = {
    id: "sl_" + Date.now(),
    date: todayKey(),
    bedtime, wakeTime, quality, duration, note
  };

  if (!sleepStore.records) sleepStore.records = [];
  // 替换今天的记录
  sleepStore.records = sleepStore.records.filter((r) => r.date !== todayKey());
  sleepStore.records.push(record);
  saveSleep();

  if (noteEl) noteEl.value = "";
  showToast("睡眠记录已保存，时长 " + duration + "h");
  renderSleep();
}

/* ════════════ 习惯打卡 ════════════ */
function getHabitStreak(habitId) {
  const checkins = (habitStore.checkins[habitId] || []).sort().reverse();
  if (checkins.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (checkins.includes(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

function renderHabits() {
  const today = todayKey();
  const habits = (habitStore.habits || []).filter((h) => !h.archived);

  // 习惯列表
  const listEl = document.querySelector("#habitList");
  if (listEl) {
    if (habits.length === 0) {
      listEl.innerHTML = `<div class="empty" style="padding:16px;"><p>还没有创建习惯，快添加第一个吧！</p></div>`;
    } else {
      listEl.innerHTML = habits.map((h) => {
        const checked = (habitStore.checkins[h.id] || []).includes(today);
        const streak = getHabitStreak(h.id);
        return `
          <div class="habit-item ${checked ? "checked" : ""}">
            <span class="habit-item-icon">${h.icon || "📋"}</span>
            <div class="habit-item-info">
              <div class="habit-item-name">${esc(h.name)}</div>
              <div class="habit-item-streak ${streak === 0 ? "zero" : ""}">${streak > 0 ? "🔥 连续 " + streak + " 天" : "今天还没打卡"}</div>
            </div>
            <button class="habit-check-btn ${checked ? "checked" : ""}" data-habit-check="${h.id}" title="${checked ? "取消打卡" : "打卡"}">${checked ? "✓" : ""}</button>
            <button class="habit-del-btn" data-habit-del="${h.id}" title="删除习惯">✕</button>
          </div>
        `;
      }).join("");
    }
  }

  // 热力图
  renderHabitHeatmap();

  // 统计
  renderHabitStats();
}

function renderHabitHeatmap() {
  const el = document.querySelector("#habitHeatmap");
  if (!el) return;
  const habits = (habitStore.habits || []).filter((h) => !h.archived);
  const totalHabits = habits.length || 1;

  // 生成近90天数据，按周分行（7天一行）
  const days = 90;
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const checkedCount = habits.filter((h) => (habitStore.checkins[h.id] || []).includes(key)).length;
    const ratio = checkedCount / totalHabits;
    let level = 0;
    if (ratio === 0) level = 0;
    else if (ratio <= 0.25) level = 1;
    else if (ratio <= 0.5) level = 2;
    else if (ratio <= 0.75) level = 3;
    else level = 4;
    cells.push({ key, level, count: checkedCount });
  }

  // 按7天一行分组
  let html = "";
  for (let row = 0; row < Math.ceil(cells.length / 7); row++) {
    const rowCells = cells.slice(row * 7, row * 7 + 7);
    html += `<div class="habit-heatmap-row">` + rowCells.map((c) =>
      `<span class="habit-heatmap-cell level-${c.level}" title="${c.key}: ${c.count}/${habits.length}个习惯"></span>`
    ).join("") + `</div>`;
  }
  el.innerHTML = html;
}

function renderHabitStats() {
  const el = document.querySelector("#habitStatsCard");
  if (!el) return;
  const habits = (habitStore.habits || []).filter((h) => !h.archived);
  const today = todayKey();
  const checkedToday = habits.filter((h) => (habitStore.checkins[h.id] || []).includes(today)).length;
  const avgStreak = habits.length > 0 ? Math.round(habits.reduce((s, h) => s + getHabitStreak(h.id), 0) / habits.length) : 0;
  const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => getHabitStreak(h.id))) : 0;
  const completionRate = habits.length > 0 ? Math.round((checkedToday / habits.length) * 100) : 0;

  el.innerHTML = `
    <h4>📊 习惯统计</h4>
    <div class="habit-stats-grid" style="margin-top:10px;">
      <div class="habit-stat-item"><strong>${checkedToday}/${habits.length}</strong><span>今日完成</span></div>
      <div class="habit-stat-item"><strong>${completionRate}%</strong><span>完成率</span></div>
      <div class="habit-stat-item"><strong>${avgStreak}</strong><span>平均连续(天)</span></div>
      <div class="habit-stat-item"><strong>${maxStreak}</strong><span>最长连续(天)</span></div>
    </div>
  `;
}

function addHabit() {
  const nameEl = document.querySelector("#habitNameInput");
  const iconEl = document.querySelector("#habitIconSelect");
  if (!nameEl) return;
  const name = nameEl.value.trim();
  if (!name) { showToast("请输入习惯名称"); return; }

  const habit = {
    id: "hb_" + Date.now(),
    name,
    icon: iconEl ? iconEl.value : "📋",
    createdAt: todayKey(),
    archived: false
  };

  if (!habitStore.habits) habitStore.habits = [];
  habitStore.habits.push(habit);
  if (!habitStore.checkins) habitStore.checkins = {};
  habitStore.checkins[habit.id] = [];
  saveHabits();

  nameEl.value = "";
  showToast("习惯「" + name + "」已创建");
  renderHabits();
}

function toggleHabitCheckin(habitId) {
  if (!habitStore.checkins) habitStore.checkins = {};
  if (!habitStore.checkins[habitId]) habitStore.checkins[habitId] = [];
  const today = todayKey();
  const idx = habitStore.checkins[habitId].indexOf(today);
  if (idx > -1) {
    habitStore.checkins[habitId].splice(idx, 1);
    showToast("已取消打卡");
  } else {
    habitStore.checkins[habitId].push(today);
    showToast("打卡成功！🔥");
  }
  saveHabits();
  renderHabits();
}

function deleteHabit(habitId) {
  if (!habitStore.habits) return;
  habitStore.habits = habitStore.habits.map((h) => h.id === habitId ? { ...h, archived: true } : h);
  saveHabits();
  showToast("习惯已删除");
  renderHabits();
}

/* ════════════════════════════════════════════════════════════════════
 * v10.1 健康推荐（减脂食谱 / 一日三餐 / 推文推荐）
 * ════════════════════════════════════════════════════════════════════ */

let recommendState = { scene: "meal-plan", lastResult: "", lastPrompt: "" };

function getRecommendSceneName() {
  return { "meal-plan": "减脂食谱", "daily-meals": "一日三餐", "content": "推文推荐" }[recommendState.scene] || "推荐";
}

function switchRecommendScene(scene) {
  recommendState.scene = scene;
  document.querySelectorAll(".recommend-scene-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.recommendScene === scene);
  });
  // 清空结果
  const resultEl = document.querySelector("#recommendResult");
  if (resultEl) {
    resultEl.innerHTML = `<div class="empty" style="padding:24px;"><p style="font-size:36px;">🥗</p><p>已切换到「${getRecommendSceneName()}」模式，点击「AI 生成推荐」获取专属内容。</p></div>`;
  }
}

function renderHealthRecommend() {
  // 首次进入时渲染默认状态
  document.querySelector("#recommendTraeBridge").style.display = "none";
  recommendState.scene = "meal-plan";
  document.querySelectorAll(".recommend-scene-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.recommendScene === "meal-plan");
  });
}

function buildRecommendPrompt() {
  const goal = document.querySelector("#recommendGoal")?.value || "减脂";
  const calorie = document.querySelector("#recommendCalorie")?.value || "1400-1600";
  const avoid = document.querySelector("#recommendAvoid")?.value?.trim() || "";

  const scenePrompts = {
    "meal-plan": [
      `你是一位专业的减脂营养师。请为一位${goal}用户生成一份详细的减脂食谱。`,
      `热量预算：${calorie} kcal/天。`,
      avoid ? `忌口：${avoid}。` : "",
      `请按以下格式输出：`,
      `早餐（约400kcal）：列出2-3种食物，各标注热量`,
      `午餐（约500kcal）：列出3-4种食物，各标注热量`,
      `晚餐（约400kcal）：列出2-3种食物，各标注热量`,
      `加餐（约100kcal）：列出1-2种食物，各标注热量`,
      `最后给出总热量汇总和营养建议。`,
      `请用中文输出，风格亲切、专业，像「一只白」那种减脂博主的口吻。`,
    ].filter(Boolean).join("\n"),
    "daily-meals": [
      `你是减脂餐搭配师。请为一位${goal}用户生成一日三餐完整搭配方案。`,
      `热量预算：${calorie} kcal/天。`,
      avoid ? `忌口：${avoid}。` : "",
      `请按以下格式输出：`,
      `早餐搭配：主食+蛋白质+蔬果，标注热量`,
      `午餐搭配：主食+蛋白质+蔬菜，标注热量`,
      `晚餐搭配：蛋白质+蔬菜为主，标注热量`,
      `加餐建议：1-2个健康零食选项`,
      `总热量汇总 + 营养配比（碳水/蛋白质/脂肪）`,
      `请用中文输出，风格简洁实用，像小红书减脂博主的日常分享。`,
    ].filter(Boolean).join("\n"),
    "content": [
      `你是减脂健康类小红书/公众号爆款文案作者，风格参考「一只白」「邪修减肥」等热门减脂博主。`,
      `请为一位${goal}用户生成3条可直接发布的推文内容。`,
      `热量参考：${calorie} kcal/天。`,
      avoid ? `忌口：${avoid}。` : "",
      `每条推文包含：`,
      `1. 标题（吸睛，有情绪钩子，如"我的邪修减肥法，一周掉3斤"）`,
      `2. 正文（200-300字，有干货+情绪价值+互动引导）`,
      `3. 话题标签（3-5个）`,
      `风格要求：口语化、有网感、真实接地气，不要AI味。`,
      `请用中文输出。`,
    ].filter(Boolean).join("\n")
  };

  return scenePrompts[recommendState.scene] || scenePrompts["meal-plan"];
}

async function generateHealthRecommend() {
  const resultEl = document.querySelector("#recommendResult");
  const bridgeEl = document.querySelector("#recommendTraeBridge");
  const prompt = buildRecommendPrompt();

  if (resultEl) {
    resultEl.innerHTML = `<div class="empty" style="padding:24px;"><p style="font-size:24px;">⏳</p><p>正在生成「${getRecommendSceneName()}」...<br/><span style="font-size:12px;color:var(--muted);">调用 AI 模型中，请稍候</span></p></div>`;
  }

  try {
    const res = await fetch("/api/health/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        scene: recommendState.scene,
        goal: document.querySelector("#recommendGoal")?.value || "减脂",
        calorie: document.querySelector("#recommendCalorie")?.value || "1400-1600",
        avoid: document.querySelector("#recommendAvoid")?.value?.trim() || ""
      })
    });
    const data = await res.json();

    if (data.mode === "trae-bridge") {
      // TRAE 桥接模式
      recommendState.lastPrompt = data.traePrompt || prompt;
      if (bridgeEl) bridgeEl.style.display = "block";
      const preEl = document.querySelector("#recommendTraePrompt");
      if (preEl) preEl.textContent = recommendState.lastPrompt;
      if (resultEl) {
        resultEl.innerHTML = `<div class="empty" style="padding:24px;"><p style="font-size:36px;">🤝</p><p>TRAE 桥接模式</p><p style="font-size:12px;color:var(--muted);">未配置API Key，已将指令填入下方卡片，复制后粘贴到TRAE执行即可。</p></div>`;
      }
    } else if (data.ok) {
      recommendState.lastResult = data.answer || "";
      if (bridgeEl) bridgeEl.style.display = "none";
      renderRecommendResult(data.answer);
    } else {
      if (resultEl) {
        resultEl.innerHTML = `<div class="empty" style="padding:24px;"><p>❌ 生成失败</p><p style="font-size:12px;color:var(--red);">${esc(data.error || "未知错误")}</p></div>`;
      }
    }
  } catch (e) {
    if (resultEl) {
      resultEl.innerHTML = `<div class="empty" style="padding:24px;"><p>❌ 网络错误</p><p style="font-size:12px;color:var(--red);">${esc(e.message)}</p></div>`;
    }
  }
}

function renderRecommendResult(text) {
  const resultEl = document.querySelector("#recommendResult");
  if (!resultEl) return;

  const scene = recommendState.scene;
  const escaped = esc(String(text || ""));

  if (scene === "meal-plan" || scene === "daily-meals") {
    // 食谱/三餐模式：解析结构化内容
    const sections = [
      { key: "早餐", emoji: "🌅", color: "#ff9800" },
      { key: "午餐", emoji: "☀️", color: "#4caf50" },
      { key: "晚餐", emoji: "🌙", color: "#9c27b0" },
      { key: "加餐", emoji: "🍎", color: "#2196f3" },
    ];

    let sectionsHtml = "";
    sections.forEach((s) => {
      const re = new RegExp(`${s.key}[：:]?\\s*([\\s\\S]*?)(?=(${sections.map((x) => x.key).join("|")})[：:]|\\n{2,}|$|总热量|热量汇总|营养建议|营养配比)`, "i");
      const match = escaped.match(re);
      if (match && match[1].trim()) {
        const items = match[1].trim().split(/[，,、\n]/).filter(Boolean);
        sectionsHtml += `
          <div class="recommend-meal-section">
            <div class="recommend-meal-title">${s.emoji} ${s.key}</div>
            <div class="recommend-meal-items">
              ${items.map((item) => `<span class="recommend-meal-tag">${item}</span>`).join("")}
            </div>
          </div>`;
      }
    });

    resultEl.innerHTML = `
      <div class="recommend-result-card">
        <h4>${scene === "meal-plan" ? "🥗" : "🍱"} ${getRecommendSceneName()}</h4>
        ${sectionsHtml || `<div class="recommend-meal-section"><p>${escaped}</p></div>`}
      </div>
      <div class="recommend-action-bar">
        <button class="ghost-btn" onclick="navigatorClipboard(\`${escaped.replace(/`/g, "\\`")}\`);showToast('已复制')">📋 复制全文</button>
        <button class="ghost-btn" onclick="generateHealthRecommend()">🔄 重新生成</button>
      </div>`;
  } else if (scene === "content") {
    // 推文模式：按标题分割
    const contentItems = escaped.split(/\\n{2,}|(?=标题[：:]|\\d+\\.\\s*标题|\\n\\d+\\.)/).filter(Boolean);
    const cardsHtml = contentItems.map((item, i) => {
      const titleMatch = item.match(/^(?:标题[：:]\\s*)?(.+?)(?:\\n|$)/);
      const title = titleMatch ? titleMatch[1].trim() : `推文 ${i + 1}`;
      const body = item.replace(/^(?:标题[：:]\\s*)?(.+?)(?:\\n|$)/, "").trim();
      const tagsMatch = body.match(/#[\\u4e00-\\u9fa5a-zA-Z0-9_]+/g);
      const tags = tagsMatch ? [...new Set(tagsMatch)] : [];
      return `
        <div class="recommend-content-card">
          <h5>📝 ${title}</h5>
          <div class="recommend-content-body">${body}</div>
          ${tags.length > 0 ? `<div class="recommend-content-tags">${tags.map((t) => `<span class="recommend-content-tag">${t}</span>`).join("")}</div>` : ""}
        </div>`;
    }).join("");

    resultEl.innerHTML = `
      ${cardsHtml}
      <div class="recommend-action-bar">
        <button class="ghost-btn" onclick="navigatorClipboard(\`${escaped.replace(/`/g, "\\`")}\`);showToast('已复制')">📋 复制全文</button>
        <button class="ghost-btn" onclick="generateHealthRecommend()">🔄 重新生成</button>
      </div>`;
  }
}

/* ════════════════════════════════════════════════════════════════════
 * v10.2 PM 快速生成（PRD / 竞品分析 / 用户故事 / 评审Checklist / 路线图）
 * ════════════════════════════════════════════════════════════════════ */

let pmGenState = { scene: "prd", lastResult: "", lastPrompt: "" };

function getPmSceneName() {
  return { "prd": "PRD文档", "competitor": "竞品分析", "user-story": "用户故事", "checklist": "评审Checklist", "roadmap": "产品路线图" }[pmGenState.scene] || "PM文档";
}

function switchPmScene(scene) {
  pmGenState.scene = scene;
  document.querySelectorAll(".pm-generate-scene-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.pmScene === scene);
  });
  const resultEl = document.querySelector("#pmGenerateResult");
  if (resultEl) {
    resultEl.innerHTML = `<div class="empty" style="padding:24px;"><p style="font-size:36px;">🧠</p><p>已切换到「${getPmSceneName()}」模式，填写产品信息后点击「AI 生成」。</p></div>`;
  }
}

function renderPmGenerate() {
  document.querySelector("#pmGenerateTraeBridge").style.display = "none";
  pmGenState.scene = "prd";
  document.querySelectorAll(".pm-generate-scene-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.pmScene === "prd");
  });
}

function buildPmPrompt() {
  const product = document.querySelector("#pmGenProduct")?.value?.trim() || "未指定产品";
  const audience = document.querySelector("#pmGenAudience")?.value?.trim() || "未指定用户";
  const goal = document.querySelector("#pmGenGoal")?.value?.trim() || "未指定目标";
  const competitor = document.querySelector("#pmGenCompetitor")?.value?.trim() || "";
  const extra = document.querySelector("#pmGenExtra")?.value?.trim() || "";

  const scenePrompts = {
    "prd": [
      `你是资深AI产品经理。请为产品「${product}」撰写一份专业的PRD（产品需求文档）。`,
      `目标用户：${audience}`,
      `核心目标：${goal}`,
      competitor ? `竞品参考：${competitor}` : "",
      extra ? `额外要求：${extra}` : "",
      `请按以下结构输出：`,
      `## 1. 产品背景与目标`,
      `## 2. 目标用户画像`,
      `## 3. 核心功能需求（按P0/P1/P2优先级排列）`,
      `## 4. 非功能需求（性能、安全、兼容性）`,
      `## 5. 用户故事（As a... I want... So that...）`,
      `## 6. 验收标准`,
      `## 7. 风险与依赖`,
      `请用中文输出，专业、结构化，可落地。`,
    ].filter(Boolean).join("\n"),
    "competitor": [
      `你是资深产品分析师。请对产品「${product}」进行竞品分析。`,
      `目标用户：${audience}`,
      competitor ? `重点分析竞品：${competitor}` : `请自行识别3-5个主要竞品。`,
      extra ? `额外要求：${extra}` : "",
      `请按以下结构输出：`,
      `## 1. 竞品概览（产品定位、目标用户、市场份额）`,
      `## 2. 核心功能对比矩阵`,
      `## 3. 交互与体验对比`,
      `## 4. 商业模式对比`,
      `## 5. 优劣势分析（SWOT）`,
      `## 6. 差异化机会与建议`,
      `请用中文输出，数据驱动，有战略高度。`,
    ].filter(Boolean).join("\n"),
    "user-story": [
      `你是资深产品经理，擅长敏捷开发。请为产品「${product}」撰写用户故事。`,
      `目标用户：${audience}`,
      `核心目标：${goal}`,
      extra ? `额外要求：${extra}` : "",
      `请按以下结构输出：`,
      `## 用户故事列表（按优先级排列）`,
      `每条用户故事格式：`,
      `- 作为<角色>，我想要<功能>，以便<价值>`,
      `- 验收条件：`,
      `  1. ...`,
      `  2. ...`,
      `请生成至少8-12条用户故事，覆盖核心流程和边界场景。用中文输出。`,
    ].filter(Boolean).join("\n"),
    "checklist": [
      `你是资深QA和产品经理。请为产品「${product}」生成需求评审Checklist。`,
      `目标用户：${audience}`,
      `核心目标：${goal}`,
      extra ? `额外要求：${extra}` : "",
      `请按以下结构输出：`,
      `## 1. 功能完整性检查`,
      `## 2. 边界条件与异常处理`,
      `## 3. 性能指标检查`,
      `## 4. 安全与合规检查`,
      `## 5. 用户体验检查`,
      `## 6. 数据与埋点检查`,
      `## 7. 上线与回滚策略检查`,
      `每项用 ☐ 格式，待评审时勾选。用中文输出。`,
    ].filter(Boolean).join("\n"),
    "roadmap": [
      `你是资深产品总监。请为产品「${product}」制定季度产品路线图。`,
      `目标用户：${audience}`,
      `核心目标：${goal}`,
      competitor ? `竞品参考：${competitor}` : "",
      extra ? `额外要求：${extra}` : "",
      `请按以下结构输出：`,
      `## 产品愿景与季度目标`,
      `## Q1 里程碑（按月份拆解）`,
      `## 关键交付物与依赖关系`,
      `## 资源需求估算`,
      `## 风险与应对策略`,
      `## 成功指标（KPI/OKR）`,
      `请用中文输出，可落地执行，有优先级排序。`,
    ].filter(Boolean).join("\n")
  };

  return scenePrompts[pmGenState.scene] || scenePrompts["prd"];
}

async function generatePmDoc() {
  const resultEl = document.querySelector("#pmGenerateResult");
  const bridgeEl = document.querySelector("#pmGenerateTraeBridge");
  const prompt = buildPmPrompt();

  if (resultEl) {
    resultEl.innerHTML = `<div class="empty" style="padding:24px;"><p style="font-size:24px;">⏳</p><p>正在生成「${getPmSceneName()}」...<br/><span style="font-size:12px;color:var(--muted);">调用 AI 模型中，请稍候</span></p></div>`;
  }

  try {
    const res = await fetch("/api/pm/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        scene: pmGenState.scene,
        product: document.querySelector("#pmGenProduct")?.value?.trim() || "",
        audience: document.querySelector("#pmGenAudience")?.value?.trim() || "",
        goal: document.querySelector("#pmGenGoal")?.value?.trim() || ""
      })
    });
    const data = await res.json();

    if (data.mode === "trae-bridge") {
      pmGenState.lastPrompt = data.traePrompt || prompt;
      if (bridgeEl) bridgeEl.style.display = "block";
      const preEl = document.querySelector("#pmGenerateTraePrompt");
      if (preEl) preEl.textContent = pmGenState.lastPrompt;
      if (resultEl) {
        resultEl.innerHTML = `<div class="empty" style="padding:24px;"><p style="font-size:36px;">🤝</p><p>TRAE 桥接模式</p><p style="font-size:12px;color:var(--muted);">未配置API Key，已将指令填入下方卡片，复制后粘贴到TRAE执行即可。</p></div>`;
      }
    } else if (data.ok) {
      pmGenState.lastResult = data.answer || "";
      if (bridgeEl) bridgeEl.style.display = "none";
      renderPmGenerateResult(data.answer);
    } else {
      if (resultEl) {
        resultEl.innerHTML = `<div class="empty" style="padding:24px;"><p>❌ 生成失败</p><p style="font-size:12px;color:var(--red);">${esc(data.error || "未知错误")}</p></div>`;
      }
    }
  } catch (e) {
    if (resultEl) {
      resultEl.innerHTML = `<div class="empty" style="padding:24px;"><p>❌ 网络错误</p><p style="font-size:12px;color:var(--red);">${esc(e.message)}</p></div>`;
    }
  }
}

function renderPmGenerateResult(text) {
  const resultEl = document.querySelector("#pmGenerateResult");
  if (!resultEl) return;

  const escaped = esc(String(text || ""));
  const scene = pmGenState.scene;

  // Parse sections by ## headers
  const sections = [];
  const sectionRe = /##\s*(.+?)(?:\n|$)([\s\S]*?)(?=##\s|$)/g;
  let match;
  while ((match = sectionRe.exec(escaped)) !== null) {
    sections.push({ title: match[1].trim(), body: match[2].trim() });
  }

  if (sections.length === 0) {
    sections.push({ title: getPmSceneName(), body: escaped });
  }

  const sceneIcons = { "prd": "📝", "competitor": "🔍", "user-story": "👤", "checklist": "✅", "roadmap": "🗺️" };
  const icon = sceneIcons[scene] || "📄";

  const sectionsHtml = sections.map((s) => {
    const body = s.body
      .replace(/^- (.+)$/gm, '<span class="pm-generate-list-item">• $1</span>')
      .replace(/☐/g, '<span style="font-size:16px;">☐</span>');
    return `
      <div class="pm-generate-section">
        <div class="pm-generate-section-title">${s.title}</div>
        <div class="pm-generate-section-body">${body}</div>
      </div>`;
  }).join("");

  resultEl.innerHTML = `
    <div class="pm-generate-result-card">
      <h4>${icon} ${getPmSceneName()}</h4>
      ${sectionsHtml}
    </div>
    <div class="pm-generate-action-bar">
      <button class="ghost-btn" onclick="navigatorClipboard(\`${escaped.replace(/`/g, "\\`")}\`);showToast('已复制')">📋 复制全文</button>
      <button class="ghost-btn" onclick="generatePmDoc()">🔄 重新生成</button>
    </div>`;
}

/* ════════════════════════════════════════════════════════════════════
 * 保留的已有功能：今日工作记录
 * ════════════════════════════════════════════════════════════════════ */

function getDailyLog(date) {
  date = date || todayKey();
  return dailyLogs.find((log) => log.date === date);
}

function renderDailyLogPanel() {
  if (!els.dailyLogPanel) return;
  // v10.0: 健康模块不再复用工作记录面板（改用健康总览仪表盘）
  if (state.moduleId !== "dashboard") {
    els.dailyLogPanel.classList.remove("show");
    els.dailyLogPanel.innerHTML = "";
    return;
  }

  const log = getDailyLog();
  const date = todayKey();
  const hasLog = Boolean(log);
  els.dailyLogPanel.classList.add("show");
  els.dailyLogPanel.innerHTML = `
    <div class="daily-log-card">
      <div class="daily-log-card-head">
        <div>
          <h3>今日工作记录</h3>
          <p>${hasLog ? esc(log.theme || "今天的结构化工作记录") : "用主题、产出、推进、问题、学习、明日重点来记录，避免写成流水账。"}</p>
        </div>
        <span class="daily-log-date">${date}</span>
      </div>
      <div class="daily-log-summary">
        <div><strong>今日关键产出</strong><span>${hasLog ? esc(log.outputs || "未填写") : "今天真正完成/形成了什么？"}</span></div>
        <div><strong>问题与风险</strong><span>${hasLog ? esc(log.blocks || "未填写") : "有什么卡点、风险、依赖？"}</span></div>
        <div><strong>明日重点</strong><span>${hasLog ? esc(log.tomorrow || "未填写") : "明天最值得推进的 1-5 件事。"}</span></div>
      </div>
      <div class="daily-log-actions">
        <button class="primary-btn" data-daily-action="edit">${hasLog ? "编辑今日记录" : "开始记录今天"}</button>
        <button class="primary-btn" data-daily-action="analyze">AI 分析今日记录</button>
        <button class="ghost-btn" data-daily-action="history">查看历史</button>
        <button class="ghost-btn" data-daily-action="copy-summary">复制日报摘要</button>
        <button class="ghost-btn" data-daily-action="tomorrow-tasks">生成明日任务</button>
      </div>
    </div>
  `;
}

function handleDailyLogAction(action) {
  if (action === "edit") return openDailyLogDialog();
  if (action === "history") return openDailyLogHistory();
  if (action === "copy-summary") return copyDailySummary();
  if (action === "tomorrow-tasks") return createTomorrowTasks();
  if (action === "analyze") return openDailyAnalysisDialog();
}

function openDailyLogDialog(date) {
  date = date || todayKey();
  if (!els.dailyLogDialog) return;
  const log = getDailyLog(date) || {};
  els.dailyLogDate.value = log.date || date;
  els.dailyLogTheme.value = log.theme || suggestDailyTheme();
  els.dailyLogEnergy.value = log.energy || "稳定推进";
  els.dailyLogOutputs.value = log.outputs || "";
  els.dailyLogProgress.value = log.progress || "";
  els.dailyLogBlocks.value = log.blocks || "";
  els.dailyLogLearnings.value = log.learnings || "";
  els.dailyLogTomorrow.value = log.tomorrow || "";
  els.dailyLogReview.value = log.review || "";
  els.dailyLogDialog.showModal();
}

function suggestDailyTheme() {
  const module = getModule();
  if (module.id !== "dashboard") return `${module.title}推进`;
  return "日常工作推进与复盘";
}

function saveDailyLog() {
  const date = els.dailyLogDate.value || todayKey();
  const log = {
    date,
    theme: els.dailyLogTheme.value.trim(),
    energy: els.dailyLogEnergy.value,
    outputs: els.dailyLogOutputs.value.trim(),
    progress: els.dailyLogProgress.value.trim(),
    blocks: els.dailyLogBlocks.value.trim(),
    learnings: els.dailyLogLearnings.value.trim(),
    tomorrow: els.dailyLogTomorrow.value.trim(),
    review: els.dailyLogReview.value.trim(),
    updatedAt: new Date().toISOString()
  };
  const index = dailyLogs.findIndex((item) => item.date === date);
  if (index >= 0) dailyLogs[index] = log;
  else dailyLogs.unshift(log);
  dailyLogs.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  saveDailyLogs();
  els.dailyLogDialog.close();
  showToast("今日工作记录已保存");
  renderDailyLogPanel();
}

function openDailyLogHistory() {
  if (!els.dailyLogHistoryDialog) return;
  if (!dailyLogs.length) {
    els.dailyLogHistoryList.innerHTML = '<div class="empty"><p>还没有工作记录。</p></div>';
  } else {
    els.dailyLogHistoryList.innerHTML = dailyLogs.slice(0, 30).map((log) => `
      <div class="daily-history-item">
        <strong>${esc(log.date)} · ${esc(log.theme || "未命名主题")}</strong>
        <p><b>产出：</b>${esc(log.outputs || "未填写")}</p>
        <p><b>问题：</b>${esc(log.blocks || "未填写")}</p>
        <p><b>明日：</b>${esc(log.tomorrow || "未填写")}</p>
        <div class="daily-log-actions">
          <button class="ghost-btn" onclick="window.__openDailyLogFromHistory('${esc(log.date)}')">编辑这天</button>
        </div>
      </div>
    `).join("");
  }
  window.__openDailyLogFromHistory = (date) => {
    els.dailyLogHistoryDialog.close();
    openDailyLogDialog(date);
  };
  els.dailyLogHistoryDialog.showModal();
}

async function copyDailySummary() {
  const log = getDailyLog();
  if (!log) return showToast("今天还没有记录");
  const summary = buildDailySummary(log);
  try { await copyText(summary); showToast("日报摘要已复制"); } catch { showToast("复制失败，请手动复制"); }
}

function buildDailySummary(log) {
  return [
    `# ${log.date} 工作记录：${log.theme || "日常工作推进"}`,
    "",
    `今日能量：${log.energy || "未填写"}`,
    "",
    "## 今日关键产出", log.outputs || "未填写", "",
    "## 项目 / 协作推进", log.progress || "未填写", "",
    "## 问题 / 阻碍 / 风险", log.blocks || "未填写", "",
    "## 学习 / 灵感 / 观察", log.learnings || "未填写", "",
    "## 明日重点", log.tomorrow || "未填写", "",
    "## 今日复盘", log.review || "未填写"
  ].join("\n");
}

function createTomorrowTasks() {
  const log = getDailyLog();
  if (!log || !log.tomorrow) return showToast("请先填写明日重点");
  if (!userItems.project) userItems.project = [];
  const lines = log.tomorrow.split(/\n|；|;/).map((line) => line.replace(/^[-*•\d.、\s]+/, "").trim()).filter(Boolean).slice(0, 8);
  if (!lines.length) return showToast("没有识别到可生成的明日任务");
  let count = 0;
  lines.forEach((line) => {
    const item = {
      title: line.slice(0, 60),
      summary: `来自 ${log.date} 今日工作记录的明日重点。\n主题：${log.theme || "未命名主题"}`,
      status: "待办", category: "任务管理", audience: "自己",
      tags: ["明日重点", "工作记录"], date: "明日", heat: 75, ai: true, icon: "✅", color: "green"
    };
    if (!hasDuplicateItem("project", item)) { userItems.project.unshift(item); count += 1; }
  });
  saveUserItems();
  showToast(count ? `已生成 ${count} 条明日任务` : "明日任务已存在，无需重复生成");
  render();
}

/* ── 今日记录 AI 分析 ── */

function openDailyAnalysisDialog() {
  if (!els.dailyAnalysisDialog) return;
  const log = getDailyLog();
  if (!log) { showToast("今天还没有工作记录，请先填写再分析"); openDailyLogDialog(); return; }
  if (!hasDailyLogContent(log)) { showToast("今日记录还是空的，请先填写关键内容"); openDailyLogDialog(); return; }
  syncDailyAnalysisProviders();
  lastDailyAnalysis = null;
  els.dailyAnalysisResult.innerHTML = '<div class="empty"><p>点击「AI 分析今日记录」开始拆解。</p></div>';
  setDailyAnalysisStatus("已就绪。点击「AI 分析今日记录」开始。");
  els.dailyAnalysisDialog.showModal();
}

function closeDailyAnalysisDialog() { if (els.dailyAnalysisDialog) els.dailyAnalysisDialog.close(); }

function hasDailyLogContent(log) {
  return Boolean((log.outputs && log.outputs.trim()) || (log.progress && log.progress.trim()) ||
    (log.blocks && log.blocks.trim()) || (log.learnings && log.learnings.trim()) ||
    (log.tomorrow && log.tomorrow.trim()) || (log.review && log.review.trim()));
}

function buildDailyLogSummary(log) {
  return [log.outputs || "未填写", log.progress || "未填写", log.blocks || "未填写",
    log.learnings || "未填写", log.tomorrow || "未填写", log.review || "未填写"].filter(Boolean).join("\n");
}

function syncDailyAnalysisProviders() {
  if (!els.dailyAnalysisProvider || !els.aiProviderSelect) return;
  els.dailyAnalysisProvider.innerHTML = els.aiProviderSelect.innerHTML || '<option value="auto">自动选择</option>';
}

async function analyzeDailyLog() {
  const log = getDailyLog();
  if (!log) return showToast("今天还没有工作记录");
  if (!hasDailyLogContent(log)) { setDailyAnalysisStatus("今日记录为空，请先填写"); return showToast("今日记录为空，请先填写"); }
  const summary = buildDailyLogSummary(log);
  setDailyAnalysisStatus("AI 正在分析今日记录...");
  els.dailyAnalysisResult.innerHTML = '<div class="empty"><p>正在分析，稍等片刻...</p></div>';
  try {
    const response = await fetch("/api/daily-log/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: els.dailyAnalysisProvider.value, log: { ...log, summary } })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "分析失败");

    // TRAE桥接模式
    if (result.mode === "trae-bridge") {
      els.dailyAnalysisResult.innerHTML = buildTraeBridgeUI(result.traePrompt, result.fallbackReason);
      setDailyAnalysisStatus("TRAE桥接模式 - 请复制指令到TRAE执行");
      return;
    }

    lastDailyAnalysis = { ...result.parsed, rawAnswer: result.answer, logDate: result.logDate, logTheme: log.theme || "今日工作记录", provider: result.provider, model: result.model };
    renderDailyAnalysisResult(lastDailyAnalysis);
    setDailyAnalysisStatus(`分析完成：${result.provider} · ${result.model}`);
    showToast("今日记录分析完成");
  } catch (error) {
    lastDailyAnalysis = null;
    els.dailyAnalysisResult.innerHTML = `<p style="color:#f5a524">分析失败：${esc(error.message)}</p>`;
    setDailyAnalysisStatus("分析失败");
  }
}

function renderDailyAnalysisResult(analysis) {
  const sections = [];
  if (analysis.summary) sections.push(`<div class="analysis-summary"><strong>今日一句话总结</strong><p>${esc(analysis.summary)}</p></div>`);
  if (analysis.todos && analysis.todos.length) sections.push(renderAnalysisSection({ title: "识别到的待办", hint: "AI 从今日记录里拆出的具体行动", items: analysis.todos.map((item, idx) => `<div class="analysis-item"><div class="analysis-item-head"><div class="analysis-item-title">${esc(item.title)}</div>${item.ai_delegatable ? '<span class="analysis-tag ai-tag">可派 AI</span>' : ""}</div>${item.reason ? `<p class="analysis-item-reason">${esc(item.reason)}</p>` : ""}<p class="analysis-module-hint">建议归档：${esc(getModule(item.moduleId).title)}</p><div class="analysis-item-actions"><button data-analysis-todo="${idx}">存为任务</button></div></div>`).join("") }));
  if (analysis.problems && analysis.problems.length) sections.push(renderAnalysisSection({ title: "问题 / 风险与建议", hint: "AI 识别的卡点和解决思路", items: analysis.problems.map((item, idx) => `<div class="analysis-item"><div class="analysis-item-head"><div class="analysis-item-title">${esc(item.problem)}</div></div>${item.suggestion ? `<p class="analysis-item-reason"><b>建议：</b>${esc(item.suggestion)}</p>` : ""}<p class="analysis-module-hint">建议归档：${esc(getModule(item.moduleId).title)}</p><div class="analysis-item-actions"><button data-analysis-problem="${idx}">存到问题库</button></div></div>`).join("") }));
  if (analysis.inspirations && analysis.inspirations.length) sections.push(renderAnalysisSection({ title: "灵感 / 学习沉淀", hint: "来自今日记录的学习和灵感", items: analysis.inspirations.map((item, idx) => `<div class="analysis-item"><div class="analysis-item-head"><div class="analysis-item-title">${esc(item.title)}</div><span class="analysis-tag source-tag">${esc(item.source_field || "learnings")}</span></div>${item.content ? `<p class="analysis-item-reason">${esc(item.content)}</p>` : ""}<p class="analysis-module-hint">建议归档：${esc(getModule(item.moduleId).title)}</p><div class="analysis-item-actions"><button data-analysis-inspiration="${idx}">沉淀为卡片</button></div></div>`).join("") }));
  if (analysis.review_assets && analysis.review_assets.length) sections.push(renderAnalysisSection({ title: "复盘资产", hint: "今日复盘里可长期复用的经验", items: analysis.review_assets.map((item, idx) => `<div class="analysis-item"><div class="analysis-item-head"><div class="analysis-item-title">${esc(item.title)}</div></div>${item.content ? `<p class="analysis-item-reason">${esc(item.content)}</p>` : ""}<p class="analysis-module-hint">建议归档：${esc(getModule(item.moduleId).title)}</p><div class="analysis-item-actions"><button data-analysis-review="${idx}">存到复盘中心</button></div></div>`).join("") }));
  if (analysis.ai_tasks && analysis.ai_tasks.length) sections.push(renderAnalysisSection({ title: "AI 可代办事项", hint: "这些事可以让 AI 直接做，按需派单", items: analysis.ai_tasks.map((item, idx) => `<div class="analysis-item"><div class="analysis-item-head"><div class="analysis-item-title">${esc(item.title)}</div><span class="analysis-tag ai-tag">${esc(item.action_type || "AI代办")}</span></div>${item.reason ? `<p class="analysis-item-reason">${esc(item.reason)}</p>` : ""}<p class="analysis-module-hint">建议归档：${esc(getModule(item.moduleId).title)}</p><div class="analysis-item-actions"><button data-analysis-ai-task="save">存为任务</button><button class="delegatable" data-analysis-ai-task="trae">复制给 TRAE 执行</button></div></div>`).join("") }));
  if (!sections.length) sections.push('<div class="empty"><p>本次分析没有识别到可沉淀的内容，可以补充今日记录后再分析。</p></div>');
  els.dailyAnalysisResult.innerHTML = sections.join("");
}

function renderAnalysisSection({ title, hint, items }) {
  return `<div class="analysis-section"><div class="analysis-section-head"><h4>${esc(title)}</h4>${hint ? `<span class="section-hint">${esc(hint)}</span>` : ""}</div><div class="analysis-section-body">${items}</div></div>`;
}

async function copyDailyAnalysisToTrae() {
  const log = getDailyLog();
  if (!log) return showToast("今天还没有工作记录");
  if (!hasDailyLogContent(log)) return showToast("今日记录为空，无法分析");
  const traePrompt = buildTraeDailyAnalysisPrompt(log);
  await copyText(traePrompt);
  showToast("已复制给 TRAE，请粘贴到 TRAE 对话");
  setDailyAnalysisStatus("已复制给 TRAE；把 TRAE 返回的 JSON 粘贴回来后点「导入 TRAE 分析结果」。");
}

function buildTraeDailyAnalysisPrompt(log) {
  return [
    "请作为 Olivia Work Platform 今日记录的 TRAE 分析助手，帮我分析今日工作记录并输出严格 JSON。",
    "", "请严格输出 JSON，字段：summary, todos, problems, inspirations, review_assets, ai_tasks。",
    "moduleId 只能从以下选择：today, project, materials, ai-growth, code-lab, skills, content, review。",
    "",
    `日期：${log.date || "未填写"}`, `今日主题：${log.theme || "未填写"}`, `今日能量：${log.energy || "未填写"}`,
    "", "【今日关键产出】", log.outputs || "未填写", "", "【项目 / 协作推进】", log.progress || "未填写",
    "", "【问题 / 阻碍 / 风险】", log.blocks || "未填写", "", "【学习 / 灵感 / 观察】", log.learnings || "未填写",
    "", "【明日重点】", log.tomorrow || "未填写", "", "【今日复盘】", log.review || "未填写"
  ].join("\n");
}

function importTraeDailyAnalysisResult() {
  const text = els.traeDailyAnalysisInput.value.trim();
  if (!text) return showToast("请先粘贴 TRAE 返回的分析结果");
  try {
    const parsed = parseTraeJson(text);
    const log = getDailyLog();
    lastDailyAnalysis = { ...normalizeClientDailyAnalysis(parsed), rawAnswer: text, logDate: log ? log.date : "", logTheme: log ? log.theme || "今日工作记录" : "今日工作记录", provider: "TRAE", model: "协作模式" };
    renderDailyAnalysisResult(lastDailyAnalysis);
    setDailyAnalysisStatus("已导入 TRAE 分析结果，可逐条沉淀");
    showToast("已导入 TRAE 分析结果");
  } catch (error) {
    setDailyAnalysisStatus("TRAE 结果格式无法识别");
    showToast("无法识别 TRAE 结果，请确认粘贴的是 JSON");
  }
}

function normalizeClientDailyAnalysis(parsed) {
  const validModuleId = (id) => (id && ["today", "project", "materials", "ai-growth", "code-lab", "skills", "content", "review"].includes(id)) ? id : "today";
  const pick = (arr, max) => (Array.isArray(arr) ? arr.slice(0, max) : []);
  return {
    summary: String(parsed.summary || "").slice(0, 300),
    todos: pick(parsed.todos, 6).map((item) => ({ title: String(item.title || "待办").slice(0, 100), reason: String(item.reason || "").slice(0, 300), moduleId: validModuleId(item.moduleId), ai_delegatable: Boolean(item.ai_delegatable) })),
    problems: pick(parsed.problems, 6).map((item) => ({ problem: String(item.problem || "").slice(0, 300), suggestion: String(item.suggestion || "").slice(0, 500), moduleId: validModuleId(item.moduleId) })),
    inspirations: pick(parsed.inspirations, 6).map((item) => ({ title: String(item.title || "灵感沉淀").slice(0, 100), content: String(item.content || "").slice(0, 600), moduleId: validModuleId(item.moduleId), source_field: String(item.source_field || "learnings").slice(0, 30) })),
    review_assets: pick(parsed.review_assets, 6).map((item) => ({ title: String(item.title || "复盘资产").slice(0, 100), content: String(item.content || "").slice(0, 600), moduleId: validModuleId(item.moduleId) })),
    ai_tasks: pick(parsed.ai_tasks, 6).map((item) => ({ title: String(item.title || "AI 可代办").slice(0, 100), reason: String(item.reason || "").slice(0, 300), action_type: String(item.action_type || "材料整理").slice(0, 30), prompt_hint: String(item.prompt_hint || "").slice(0, 600), moduleId: validModuleId(item.moduleId) }))
  };
}

function setDailyAnalysisStatus(message) { if (els.dailyAnalysisStatus) els.dailyAnalysisStatus.textContent = message; }

function saveAnalysisTodo(button) {
  if (!lastDailyAnalysis) return showToast("还没有可保存的分析结果");
  const idx = parseInt(button.dataset.analysisTodo, 10);
  const todo = lastDailyAnalysis.todos?.[idx];
  if (!todo) return showToast("未找到待办");
  const moduleId = todo.moduleId || "today";
  if (!userItems[moduleId]) userItems[moduleId] = [];
  const newItem = { title: todo.title, summary: `${todo.reason || ""}\n来源：${lastDailyAnalysis.logDate} 今日记录 AI 分析`.trim(), status: "待办", category: "今日任务", audience: "自己", tags: unique(["AI拆解", "今日记录", todo.ai_delegatable ? "可派AI" : ""]).filter(Boolean), date: "刚刚", heat: 75, ai: Boolean(todo.ai_delegatable), icon: "✅", color: "green" };
  if (hasDuplicateItem(moduleId, newItem)) return showToast("这条待办已存在");
  userItems[moduleId].unshift(newItem);
  saveUserItems();
  showToast(`已存为任务：${getModule(moduleId).title}`);
  setDailyAnalysisStatus(`已存为任务：${getModule(moduleId).title}`);
  render();
}

function saveAnalysisProblem(button) {
  if (!lastDailyAnalysis) return showToast("还没有可保存的分析结果");
  const idx = parseInt(button.dataset.analysisProblem, 10);
  const problem = lastDailyAnalysis.problems?.[idx];
  if (!problem) return showToast("未找到问题");
  const moduleId = problem.moduleId || "project";
  if (!userItems[moduleId]) userItems[moduleId] = [];
  const newItem = { title: problem.problem.slice(0, 80), summary: `AI 建议：${problem.suggestion || "暂无建议"}\n来源：${lastDailyAnalysis.logDate} 今日记录`, status: "待处理", category: "风险问题", audience: "自己", tags: ["AI拆解", "问题风险", "今日记录"], date: "刚刚", heat: 80, ai: true, icon: "⚠️", color: "orange" };
  if (hasDuplicateItem(moduleId, newItem)) return showToast("这条问题已存在");
  userItems[moduleId].unshift(newItem);
  saveUserItems();
  showToast(`已存到「${getModule(moduleId).title}」`);
  render();
}

function saveAnalysisInspiration(button) {
  if (!lastDailyAnalysis) return showToast("还没有可保存的分析结果");
  const idx = parseInt(button.dataset.analysisInspiration, 10);
  const inspiration = lastDailyAnalysis.inspirations?.[idx];
  if (!inspiration) return showToast("未找到灵感");
  const moduleId = inspiration.moduleId || "today";
  if (!userItems[moduleId]) userItems[moduleId] = [];
  const newItem = { title: inspiration.title, summary: `${inspiration.content || ""}\n来源字段：${inspiration.source_field || "learnings"}\n来自 ${lastDailyAnalysis.logDate} 今日记录`, status: "待整理", category: moduleId === "today" ? "灵感速记" : "灵感归档", audience: "自己", tags: unique(["AI拆解", "灵感沉淀", "今日记录", inspiration.source_field]).filter(Boolean), date: "刚刚", heat: 70, ai: true, icon: "💡", color: "orange" };
  if (hasDuplicateItem(moduleId, newItem)) return showToast("这条灵感已存在");
  userItems[moduleId].unshift(newItem);
  saveUserItems();
  showToast(`已沉淀到「${getModule(moduleId).title}」`);
  render();
}

function saveAnalysisReview(button) {
  if (!lastDailyAnalysis) return showToast("还没有可保存的分析结果");
  const idx = parseInt(button.dataset.analysisReview, 10);
  const asset = lastDailyAnalysis.review_assets?.[idx];
  if (!asset) return showToast("未找到复盘资产");
  const moduleId = asset.moduleId || "review";
  if (!userItems[moduleId]) userItems[moduleId] = [];
  const newItem = { title: asset.title, summary: `${asset.content || ""}\n来源：${lastDailyAnalysis.logDate} 今日复盘`, status: "可复用", category: "经验复盘", audience: "自己", tags: ["AI拆解", "复盘资产", "今日记录"], date: "刚刚", heat: 85, ai: true, icon: "📝", color: "purple" };
  if (hasDuplicateItem(moduleId, newItem)) return showToast("这条复盘资产已存在");
  userItems[moduleId].unshift(newItem);
  saveUserItems();
  showToast(`已存到「${getModule(moduleId).title}」`);
  render();
}

function saveAnalysisAiTask(button) {
  if (!lastDailyAnalysis) return showToast("还没有可保存的分析结果");
  const sectionBody = button.closest(".analysis-section-body");
  const items = Array.from(sectionBody.querySelectorAll(".analysis-item"));
  const position = items.indexOf(button.closest(".analysis-item"));
  const task = lastDailyAnalysis.ai_tasks?.[position];
  if (!task) return showToast("未找到 AI 可代办任务");
  const moduleId = task.moduleId || "today";
  if (!userItems[moduleId]) userItems[moduleId] = [];
  const newItem = { title: task.title, summary: `类型：${task.action_type || "材料整理"}\n原因：${task.reason || ""}\n执行提示：${task.prompt_hint || ""}\n来源：${lastDailyAnalysis.logDate} 今日记录`, status: "待办", category: "AI代办", audience: "自己", tags: ["AI代办", "今日记录", task.action_type || "材料整理"], date: "刚刚", heat: 80, ai: true, icon: "🤖", color: "blue" };
  if (hasDuplicateItem(moduleId, newItem)) return showToast("这条 AI 任务已存在");
  userItems[moduleId].unshift(newItem);
  saveUserItems();
  showToast(`已存为任务：${getModule(moduleId).title}`);
  render();
}

async function copyAnalysisAiTaskToTrae(button) {
  if (!lastDailyAnalysis) return showToast("还没有可保存的分析结果");
  const card = button.closest(".analysis-section-body");
  const items = Array.from(card.querySelectorAll(".analysis-item"));
  const position = items.indexOf(button.closest(".analysis-item"));
  const task = lastDailyAnalysis.ai_tasks?.[position];
  if (!task) return showToast("未找到 AI 可代办任务");
  const traePrompt = `请帮我执行下面这个任务，直接输出可用的结果。\n\n任务类型：${task.action_type || "材料整理"}\n任务标题：${task.title}\n背景原因：${task.reason || ""}\n执行提示：${task.prompt_hint || ""}`;
  await copyText(traePrompt);
  showToast("已复制给 TRAE，请粘贴到 TRAE 对话");
}

/* ════════════════════════════════════════════════════════════════════
 * 保留的已有功能：AI 助手抽屉
 * ════════════════════════════════════════════════════════════════════ */

function openAiDrawer() {
  if (!els.aiDrawer) return;
  els.aiDrawer.classList.add("open");
  els.aiBackdrop.classList.add("open");
  els.aiDrawer.setAttribute("aria-hidden", "false");
  loadProviders();
}

function closeAiDrawer() {
  if (!els.aiDrawer) return;
  els.aiDrawer.classList.remove("open");
  els.aiBackdrop.classList.remove("open");
  els.aiDrawer.setAttribute("aria-hidden", "true");
}

async function loadProviders() {
  if (!els.aiProviderSelect) return;
  if (window.location.protocol === "file:") {
    els.aiStatus.innerHTML = '<span style="color:#f5a524">⚠️ 当前是 file:// 协议。请通过 http://localhost:3000 访问后使用 AI 助手。</span>';
    return;
  }
  try {
    const res = await fetch("/api/providers");
    const providers = await res.json();
    const html = '<option value="auto">🤖 自动选择（智能推荐模型）</option>' + providers.map((p) => {
      const isTrae = p.id === "trae";
      const sourceIcon = p.source === "platform" ? "🏢" : (p.source === "user" ? "🔑" : "🤝");
      const sourceText = p.source === "platform" ? "平台内置" : (p.source === "user" ? "用户配置" : "零配置");
      if (isTrae) {
        return `<option value="${p.id}">${sourceIcon} ${p.name} · ${sourceText}</option>`;
      }
      if (p.configured) {
        return `<option value="${p.id}">${sourceIcon} ${p.name} · ${p.model} · ${sourceText}</option>`;
      }
      return `<option value="${p.id}" disabled>🔒 ${p.name} · 未接入 · 请联系运营方配置</option>`;
    }).join("");
    els.aiProviderSelect.innerHTML = html;
    if (els.inspirationProviderSelect) els.inspirationProviderSelect.innerHTML = html;
    if (els.draftProviderSelect) els.draftProviderSelect.innerHTML = html;
    if (els.dailyAnalysisProvider) els.dailyAnalysisProvider.innerHTML = html;
    if (els.chatModelSelect) els.chatModelSelect.innerHTML = html;
    const availableCount = providers.filter((p) => p.configured && p.id !== "trae").length;
    const platformCount = providers.filter((p) => p.source === "platform").length;
    if (platformCount > 0) {
      setAiStatus(`✅ 平台内置 ${platformCount} 个模型，开箱即用`);
    } else if (availableCount > 0) {
      setAiStatus(`✅ 已配置 ${availableCount} 个模型，TRA桥接兜底`);
    } else {
      setAiStatus(`🤝 未配置API模型，TRA桥接模式可用`);
    }
  } catch {
    setAiStatus("未检测到本地 AI 服务。请用 npm start 启动后再使用 AI 助手。");
  }
}

async function handleAiGenerate() {
  const prompt = els.aiInput.value.trim();
  if (!prompt) { showToast("请先输入需求"); return; }
  els.aiResult.innerHTML = '<p style="color:var(--muted)">正在生成...</p>';
  setAiStatus("生成中...");
  const skillsModule = data.modules.find((m) => m.id === "skills");
  const localSkills = [...(skillsModule?.items || []), ...(userItems.skills || [])];
  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, provider: els.aiProviderSelect.value, localSkills, moduleTitle: getModule().title })
    });
    const json = await res.json();
    if (!json.ok) { els.aiResult.innerHTML = `<p style="color:#f5a524">错误：${esc(json.error)}</p>`; setAiStatus("生成失败"); lastAiAnswer = ""; return; }

    // TRAE桥接模式：显示可复制指令
    if (json.mode === "trae-bridge") {
      els.aiResult.innerHTML = buildTraeBridgeUI(json.traePrompt, json.fallbackReason);
      setAiStatus("TRAE桥接模式 - 请复制指令到TRAE执行");
      return;
    }

    lastMatchedSkills = dedupeSkills(json.matchedSkills || []);
    renderMatchedSkills(lastMatchedSkills);
    lastAiAnswer = json.answer || "";
    els.aiResult.innerHTML = `<div style="white-space:pre-wrap;line-height:1.7;font-size:14px;">${esc(json.answer)}</div><div style="margin-top:8px;color:var(--muted);font-size:12px;">模型：${esc(json.provider)} · ${esc(json.model)}</div>`;
    setAiStatus("生成完成");
  } catch (err) {
    els.aiResult.innerHTML = `<p style="color:#f5a524">请求失败：${esc(err.message)}</p>`;
    setAiStatus("请求失败");
    lastAiAnswer = "";
  }
}

// TRAE桥接模式UI：生成可复制指令的卡片
function buildTraeBridgeUI(traePrompt, fallbackReason) {
  const promptEsc = esc(traePrompt).replace(/'/g, "&#39;");
  return `
    <div class="trae-bridge-card" style="border:1px dashed var(--orange);border-radius:12px;padding:16px;background:linear-gradient(135deg,var(--orange-soft),transparent);">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="font-size:20px;">🤝</span>
        <div>
          <strong style="color:var(--orange);font-size:14px;">TRAE 桥接模式</strong>
          <p style="margin:2px 0 0;font-size:12px;color:var(--text-muted);">${esc(fallbackReason || "未配置API Key，已自动切换为TRAE桥接模式")}</p>
        </div>
      </div>
      <div style="background:var(--panel);border-radius:8px;padding:12px;margin:10px 0;font-size:13px;line-height:1.7;white-space:pre-wrap;max-height:300px;overflow-y:auto;border:1px solid var(--line);">${promptEsc}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="copyText('${promptEsc.replace(/&#39;/g, "\\'")}')" class="primary-btn" style="font-size:13px;">📋 复制指令</button>
        <span style="font-size:12px;color:var(--text-muted);align-self:center;">复制后粘贴到 TRAE 的 AI 对话中执行</span>
      </div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--line);">
        <p style="font-size:12px;color:var(--text-muted);margin:0 0 6px;">💡 把 TRAE 返回的结果粘贴到下方输入框，点击导入即可保存到工作台：</p>
        <div style="display:flex;gap:8px;">
          <textarea id="traeAiInput" placeholder="粘贴 TRAE 的返回结果..." style="flex:1;min-height:60px;font-size:13px;padding:8px;border-radius:6px;border:1px solid var(--line);resize:vertical;"></textarea>
          <button onclick="importTraeAiResult()" class="ghost-btn" style="align-self:flex-start;white-space:nowrap;">导入结果</button>
        </div>
      </div>
    </div>
  `;
}

async function copyAiPromptToTrae() {
  const prompt = els.aiInput.value.trim();
  if (!prompt) { showToast("请先输入要交给 TRAE 的需求"); return; }
  const module = getModule();
  const localSkills = [...(data.modules.find((m) => m.id === "skills")?.items || []), ...(userItems.skills || [])].slice(0, 12);
  const traePrompt = `请作为 Olivia Work Platform 的 TRAE 协作助手，帮我完成下面任务。\n\n当前模块：${module.title}\n用户需求：${prompt}\n\n可参考的本地 Skills：\n${localSkills.map((s, i) => `${i + 1}. ${s.title}：${s.summary || ""}`).join("\n") || "无"}`;
  await copyText(traePrompt);
  showToast("已复制给 TRAE，请粘贴到 TRAE 对话中");
  setAiStatus("已复制给 TRAE；把 TRAE 结果粘贴回来后点导入。");
}

function importTraeAiResult() {
  const text = els.traeAiInput.value.trim();
  if (!text) { showToast("请先粘贴 TRAE 返回结果"); return; }
  lastAiAnswer = text;
  els.aiResult.innerHTML = `<div style="white-space:pre-wrap;line-height:1.7;font-size:14px;">${esc(text)}</div><div style="margin-top:8px;color:var(--muted);font-size:12px;">来源：TRAE 协作模式</div>`;
  setAiStatus("已导入 TRAE 生成结果，可保存到工作台");
  showToast("已导入 TRAE 生成结果");
}

function renderMatchedSkills(skills) {
  const uniqueSkills = dedupeSkills(skills);
  lastMatchedSkills = uniqueSkills;
  if (!uniqueSkills.length) { els.matchedSkills.innerHTML = '<div class="ai-skill-card"><p>没有匹配到 Skill。</p></div>'; return; }
  els.matchedSkills.innerHTML = uniqueSkills.map((skill, idx) => `<div class="ai-skill-card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;"><div style="flex:1;min-width:0;"><strong>${esc(skill.title)}</strong><p>${esc(skill.summary || "")}</p></div><button data-import-matched="${idx}" class="ghost-btn" style="flex-shrink:0;">存入 Skill 库</button></div></div>`).join("");
}

function importMatchedSkill(button) {
  const idx = parseInt(button.dataset.importMatched, 10);
  const skill = lastMatchedSkills[idx];
  if (!skill) { showToast("未找到要存入的 Skill"); return; }
  if (!userItems.skills) userItems.skills = [];
  if (hasDuplicateSkill(skill)) { showToast("Skill 已存在，无需重复存入"); return; }
  userItems.skills.unshift({ title: skill.title, summary: skill.summary || "", status: "可用", category: "Skills合集", audience: "自己", tags: ["从匹配导入", ...(skill.tags || [])], date: "刚刚", heat: 80, ai: true, icon: "🛠️", color: "purple" });
  saveUserItems();
  showToast("已存入 Skills管理：" + skill.title);
  render();
}

function handleAiSave() {
  const resultText = lastAiAnswer.trim();
  if (!resultText) { showToast("没有可保存的结果"); return; }
  const targetModule = els.aiSaveModuleSelect?.value || "content";
  const target = getModule(targetModule);
  if (!userItems[targetModule]) userItems[targetModule] = [];
  const firstLine = resultText.split("\n")[0].replace(/^[#*：:\s]+/, "").trim().slice(0, 50);
  const newItem = { title: firstLine || "AI 生成内容", summary: resultText.slice(0, 500), status: targetModule === "content" ? "待写" : "待整理", category: targetModule === "content" ? "工作材料" : (target.tabs?.[0] || "AI生成"), audience: "自己", tags: ["AI生成"], date: "刚刚", heat: 70, ai: true, icon: "✍️", color: "blue" };
  if (hasDuplicateItem(targetModule, newItem)) { showToast("这条 AI 结果已保存过"); return; }
  userItems[targetModule].unshift(newItem);
  saveUserItems();
  showToast(`已保存到「${target.title}」`);
  render();
}

async function handleAiCopy() {
  const text = lastAiAnswer.trim();
  if (!text) { showToast("没有可复制的结果"); return; }
  try { await copyText(text); showToast("结果已复制到剪贴板"); } catch { showToast("复制失败"); }
}

async function handleSkillSearch() {
  const query = els.aiInput.value.trim();
  if (!query) { showToast("请输入搜索关键词"); return; }
  els.communitySkills.innerHTML = '<p style="color:var(--muted)">搜索中...</p>';
  try {
    const res = await fetch(`/api/skills/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (json.rateLimited) { els.communitySkills.innerHTML = `<div class="ai-skill-card"><p style="color:#f5a524">${esc(json.message)}</p></div>`; return; }
    if (!json.items || !json.items.length) { els.communitySkills.innerHTML = '<div class="ai-skill-card"><p>没有找到相关 Skill。</p></div>'; return; }
    els.communitySkills.innerHTML = json.items.map((item) => `<div class="ai-skill-card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;"><div style="flex:1;min-width:0;"><strong>${esc(item.title)}</strong><p>${esc(item.summary)}</p><span style="font-size:11px;color:var(--muted);">⭐ ${item.stars} · ${item.source}</span></div><div style="display:flex;gap:4px;flex-shrink:0;"><a href="${item.url}" target="_blank" class="ghost-btn" style="text-decoration:none;">查看</a><button data-import-github="${esc(item.title)}" data-github-summary="${esc(item.summary)}" class="ghost-btn">导入</button></div></div></div>`).join("");
    setAiStatus(`已找到 ${json.items.length} 个社区 Skill`);
  } catch (err) {
    els.communitySkills.innerHTML = `<p style="color:#f5a524">搜索失败：${esc(err.message)}</p>`;
  }
}

function importGithubSkill(button) {
  const title = button.dataset.importGithub;
  const summary = button.dataset.githubSummary;
  if (!title) { showToast("未找到要导入的社区 Skill"); return; }
  if (!userItems.skills) userItems.skills = [];
  if (hasDuplicateSkill({ title })) { showToast("社区 Skill 已存在"); return; }
  userItems.skills.unshift({ title, summary, status: "待研究", category: "自动化实验", audience: "自己", tags: ["社区导入", "GitHub"], date: "刚刚", heat: 60, ai: true, icon: "🌐", color: "green" });
  saveUserItems();
  showToast("已导入 Skills管理：" + title);
  render();
}

/* ════════════════════════════════════════════════════════════════════
 * 保留的已有功能：灵感收件箱
 * ════════════════════════════════════════════════════════════════════ */

function openInspirationDrawer() {
  if (!els.inspirationDrawer) return;
  els.inspirationDrawer.classList.add("open");
  els.inspirationBackdrop.classList.add("open");
  els.inspirationDrawer.setAttribute("aria-hidden", "false");
  loadProviders();
  setInspirationStatus("等待收集内容。");
}

function closeInspirationDrawer() {
  if (!els.inspirationDrawer) return;
  els.inspirationDrawer.classList.remove("open");
  els.inspirationBackdrop.classList.remove("open");
  els.inspirationDrawer.setAttribute("aria-hidden", "true");
}

async function handleInspirationFiles(event) {
  const files = Array.from(event.target.files || []);
  inspirationAttachments = [];
  if (!files.length) { els.inspirationFileList.textContent = "尚未选择文件。"; return; }
  setInspirationStatus("正在读取文件...");
  for (const file of files.slice(0, 6)) {
    inspirationAttachments.push(await readInspirationFile(file));
  }
  els.inspirationFileList.innerHTML = inspirationAttachments.map((file) => `<div>· ${esc(file.name)}（${esc(file.type || "未知类型")}，${Math.round((file.size || 0) / 1024)}KB）</div>`).join("");
  setInspirationStatus(`已读取 ${inspirationAttachments.length} 个文件。`);
}

function readInspirationFile(file) {
  return new Promise((resolve) => {
    const isImage = file.type.startsWith("image/");
    const isText = /text|json|csv|markdown|xml|javascript|plain/.test(file.type) || /\.(txt|md|csv|json)$/i.test(file.name);
    if (isImage && file.size > 3 * 1024 * 1024) { resolve({ name: file.name, type: file.type, size: file.size, kind: "image", text: "图片超过 3MB，已仅保留文件信息。" }); return; }
    const reader = new FileReader();
    reader.onload = () => { resolve({ name: file.name, type: file.type, size: file.size, kind: isImage ? "image" : (isText ? "text" : "file"), dataUrl: isImage ? reader.result : "", text: isText ? String(reader.result || "").slice(0, 12000) : "" }); };
    reader.onerror = () => resolve({ name: file.name, type: file.type, size: file.size, kind: "file", text: "" });
    if (isImage) reader.readAsDataURL(file);
    else if (isText) reader.readAsText(file);
    else resolve({ name: file.name, type: file.type, size: file.size, kind: "file", text: "" });
  });
}

async function analyzeInspiration() {
  const link = els.inspirationLinkInput.value.trim();
  const text = els.inspirationTextInput.value.trim();
  if (!link && !text && !inspirationAttachments.length) { showToast("请先粘贴链接、文本，或上传图片/文件"); return; }
  setInspirationStatus("正在拆解并推荐归档...");
  els.inspirationResult.textContent = "AI 正在拆解内容...";
  els.archiveRecommendations.innerHTML = "";
  els.nextActionList.innerHTML = "";
  try {
    const response = await fetch("/api/inspiration/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceType: els.inspirationSourceType.value, provider: els.inspirationProviderSelect.value, link, text, attachments: inspirationAttachments })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "拆解失败");

    // TRAE桥接模式
    if (result.mode === "trae-bridge") {
      els.inspirationResult.innerHTML = buildTraeBridgeUI(result.traePrompt, result.fallbackReason);
      setInspirationStatus("TRAE桥接模式 - 请复制指令到TRAE执行");
      return;
    }

    lastInspiration = { ...result.parsed, rawAnswer: result.answer, sourceType: els.inspirationSourceType.value, link, originalText: text, attachments: inspirationAttachments.map((f) => ({ name: f.name, type: f.type, size: f.size, kind: f.kind })) };
    renderInspirationResult(lastInspiration, result.provider, result.model);
    setInspirationStatus(`拆解完成：${result.provider} · ${result.model}`);
  } catch (error) {
    lastInspiration = null;
    els.inspirationResult.innerHTML = `<p style="color:#f5a524">拆解失败：${esc(error.message)}</p>`;
    setInspirationStatus("拆解失败");
  }
}

async function copyInspirationPromptToTrae() {
  const link = els.inspirationLinkInput.value.trim();
  const text = els.inspirationTextInput.value.trim();
  if (!link && !text && !inspirationAttachments.length) { showToast("请先粘贴链接、文本，或上传图片/文件"); return; }
  const attachmentInfo = inspirationAttachments.map((f, i) => `${i + 1}. ${f.name}（${f.type || "未知"}，${Math.round((f.size || 0) / 1024)}KB）`).join("\n") || "无";
  const traePrompt = `请作为 TRAE 灵感拆解助手，帮我拆解下面内容并输出严格 JSON。\n\n内容来源：${els.inspirationSourceType.value}\n链接：${link || "无"}\n文本/备注：${text || "无"}\n附件：\n${attachmentInfo}`;
  await copyText(traePrompt);
  showToast("已复制给 TRAE，请粘贴到 TRAE 对话中");
  setInspirationStatus("已复制给 TRAE；把 TRAE 返回 JSON 粘贴回来后点导入。");
}

function importTraeInspirationResult() {
  const text = els.traeInspirationInput.value.trim();
  if (!text) { showToast("请先粘贴 TRAE 返回结果"); return; }
  try {
    const parsed = parseTraeJson(text);
    lastInspiration = { ...normalizeClientInspiration(parsed), rawAnswer: text, sourceType: els.inspirationSourceType.value, link: els.inspirationLinkInput.value.trim(), originalText: els.inspirationTextInput.value.trim() };
    renderInspirationResult(lastInspiration, "TRAE", "协作模式");
    setInspirationStatus("已导入 TRAE 拆解结果");
    showToast("已导入 TRAE 拆解结果");
  } catch (error) {
    setInspirationStatus("TRAE 结果格式无法识别");
    showToast("无法识别 TRAE 结果");
  }
}

function normalizeClientInspiration(parsed) {
  const moduleTitles = { today: "今日工作台", project: "项目管理", materials: "材料与汇报", "ai-growth": "AI产品经理成长室", "code-lab": "工具代码实验室", skills: "Skills管理", content: "内容运营中心", review: "复盘中心" };
  const archives = Array.isArray(parsed.recommended_archives) ? parsed.recommended_archives : [];
  return {
    title: parsed.title || "TRAE 灵感拆解结果", source_digest: parsed.source_digest || "", summary: parsed.summary || "", personal_value: parsed.personal_value || "",
    reusable_points: Array.isArray(parsed.reusable_points) ? parsed.reusable_points.slice(0, 6) : [],
    recommended_archives: archives.filter((item) => moduleTitles[item.moduleId]).slice(0, 3).map((item) => ({ moduleId: item.moduleId, moduleTitle: moduleTitles[item.moduleId], category: item.category || "灵感归档", reason: item.reason || "TRAE 推荐归档", score: Number(item.score || 80) })),
    next_actions: Array.isArray(parsed.next_actions) ? parsed.next_actions.slice(0, 5) : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : ["灵感收集", "TRAE"]
  };
}

function renderInspirationResult(item, provider, model) {
  els.inspirationResult.innerHTML = `<strong>${esc(item.title)}</strong><p><b>来源摘要：</b>${esc(item.source_digest || "未提供")}</p><p><b>内容摘要：</b>${esc(item.summary || "暂无摘要")}</p><p><b>对我的价值：</b>${esc(item.personal_value || "暂无")}</p>${(item.reusable_points || []).length ? `<p><b>可复用点：</b></p><ul>${item.reusable_points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}<p><b>标签：</b>${(item.tags || []).map((t) => `#${esc(t)}`).join(" ")}</p><p style="color:var(--muted);font-size:12px;">模型：${esc(provider || "")} · ${esc(model || "")}</p>`;
  els.archiveRecommendations.innerHTML = (item.recommended_archives || []).map((rec, idx) => `<div class="ai-skill-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;"><div><strong>${esc(rec.moduleTitle)} / ${esc(rec.category)}</strong><p>${esc(rec.reason)}</p><span class="recommendation-score">匹配度 ${esc(rec.score)}</span></div><button data-archive-index="${idx}" class="ghost-btn">存到这里</button></div></div>`).join("");
  els.nextActionList.innerHTML = (item.next_actions || []).length ? item.next_actions.map((action, idx) => `<div class="ai-skill-card"><strong>${esc(action.title || "下一步行动")}</strong><p>${esc(action.reason || "")}</p><button data-action-index="${idx}" class="ghost-btn">转成任务卡片</button></div>`).join("") : '<div class="ai-skill-card"><p>暂无下一步行动。</p></div>';
}

function saveInspirationArchive(button) {
  if (!lastInspiration) return showToast("还没有可归档的拆解结果");
  const rec = lastInspiration.recommended_archives?.[parseInt(button.dataset.archiveIndex, 10)];
  if (!rec) return showToast("未找到推荐归档位置");
  const moduleId = rec.moduleId;
  if (!userItems[moduleId]) userItems[moduleId] = [];
  const newItem = buildInspirationCard(moduleId, rec);
  if (hasDuplicateItem(moduleId, newItem)) return showToast("这条灵感已经归档过");
  userItems[moduleId].unshift(newItem);
  saveUserItems();
  showToast(`已归档到「${rec.moduleTitle} / ${rec.category}」`);
  render();
}

function buildInspirationCard(moduleId, rec) {
  return { title: lastInspiration.title || "灵感拆解结果", summary: [lastInspiration.summary, lastInspiration.personal_value ? `\n对我的价值：${lastInspiration.personal_value}` : "", lastInspiration.link ? `\n原始链接：${lastInspiration.link}` : "", lastInspiration.originalText ? `\n原文摘录：${lastInspiration.originalText.slice(0, 500)}` : ""].join("").slice(0, 1200), status: moduleId === "content" ? "选题中" : "待整理", category: rec.category || "灵感归档", audience: "自己", tags: unique(["灵感收集", lastInspiration.sourceType, ...(lastInspiration.tags || [])]).slice(0, 8), date: "刚刚", heat: rec.score || 70, ai: true, icon: "💡", color: "orange" };
}

function saveNextAction(button) {
  if (!lastInspiration) return showToast("还没有可转成任务的行动");
  const action = lastInspiration.next_actions?.[parseInt(button.dataset.actionIndex, 10)];
  if (!action) return showToast("未找到下一步行动");
  const moduleId = data.modules.some((m) => m.id === action.moduleId) ? action.moduleId : "today";
  if (!userItems[moduleId]) userItems[moduleId] = [];
  const newItem = { title: action.title || "灵感下一步行动", summary: `${action.reason || ""}\n关联灵感：${lastInspiration.title || ""}`.trim(), status: "待办", category: "今日任务", audience: "自己", tags: unique(["下一步行动", ...(lastInspiration.tags || [])]).slice(0, 6), date: "刚刚", heat: 75, ai: true, icon: "✅", color: "green" };
  if (hasDuplicateItem(moduleId, newItem)) return showToast("这条行动已存在");
  userItems[moduleId].unshift(newItem);
  saveUserItems();
  showToast(`已转成任务卡片：${getModule(moduleId).title}`);
  render();
}

function clearInspiration() {
  lastInspiration = null;
  inspirationAttachments = [];
  if (els.inspirationLinkInput) els.inspirationLinkInput.value = "";
  if (els.inspirationTextInput) els.inspirationTextInput.value = "";
  if (els.inspirationFileInput) els.inspirationFileInput.value = "";
  if (els.inspirationFileList) els.inspirationFileList.textContent = "尚未选择文件。";
  if (els.inspirationResult) els.inspirationResult.textContent = "拆解结果会显示在这里。";
  if (els.archiveRecommendations) els.archiveRecommendations.innerHTML = "";
  if (els.nextActionList) els.nextActionList.innerHTML = "";
  setInspirationStatus("已清空，等待收集内容。");
}

function setInspirationStatus(message) { if (els.inspirationStatus) els.inspirationStatus.textContent = message; }

/* ════════════════════════════════════════════════════════════════════
 * 保留的已有功能：写作室编辑器
 * ════════════════════════════════════════════════════════════════════ */

function openContentDraftDialog() {
  if (!els.contentDraftDialog) return;
  state.moduleId = "content";
  state.tab = "工作材料";
  if (!els.draftAudience.value) els.draftAudience.value = "AI学习者";
  updateDraftAssist();
  loadProviders();
  els.contentDraftDialog.showModal();
  els.draftTitle.focus();
  render();
}

function closeContentDraftDialog() { if (els.contentDraftDialog) els.contentDraftDialog.close(); }

function getContentDraftForm() {
  return {
    platform: els.draftPlatform.value, collection: els.draftCollection.value.trim(), type: els.draftType.value,
    audience: els.draftAudience.value.trim(), status: els.draftStatus.value, title: els.draftTitle.value.trim(),
    altTitles: els.draftAltTitles.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
    body: els.draftBody.value.trim(), coverTitle: els.draftCoverTitle.value.trim(),
    coverSubtitle: els.draftCoverSubtitle.value.trim(), tags: splitTags(els.draftTags.value),
    publishTime: els.draftPublishTime.value
  };
}

function fillContentDraftForm(draft) {
  if (!draft) return;
  if (draft.platform) els.draftPlatform.value = draft.platform;
  if (draft.collection !== undefined) els.draftCollection.value = draft.collection || "";
  if (draft.type) els.draftType.value = draft.type;
  if (draft.audience !== undefined) els.draftAudience.value = draft.audience || "";
  if (draft.status) els.draftStatus.value = draft.status;
  if (draft.title !== undefined) els.draftTitle.value = draft.title || "";
  if (draft.altTitles !== undefined) els.draftAltTitles.value = Array.isArray(draft.altTitles) ? draft.altTitles.join("\n") : String(draft.altTitles || "");
  if (draft.body !== undefined) els.draftBody.value = draft.body || "";
  if (draft.coverTitle !== undefined) els.draftCoverTitle.value = draft.coverTitle || "";
  if (draft.coverSubtitle !== undefined) els.draftCoverSubtitle.value = draft.coverSubtitle || "";
  if (draft.tags !== undefined) els.draftTags.value = Array.isArray(draft.tags) ? draft.tags.join(", ") : String(draft.tags || "");
  if (draft.publishTime !== undefined) els.draftPublishTime.value = draft.publishTime || "";
  updateDraftAssist();
}

function resetContentDraftForm(event) {
  event?.preventDefault();
  ["draftCollection", "draftAudience", "draftTitle", "draftAltTitles", "draftBody", "draftCoverTitle", "draftCoverSubtitle", "draftTags", "draftPublishTime", "traeDraftInput"].forEach((key) => { if (els[key]) els[key].value = ""; });
  els.draftPlatform.value = "小红书";
  els.draftType.value = "图文笔记";
  els.draftStatus.value = "草稿";
  setDraftAiStatus("已清空草稿编辑器。");
  updateDraftAssist();
}

function updateDraftAssist() {
  const draft = getContentDraftForm();
  const count = countContentWords(draft.body);
  if (els.draftWordCount) els.draftWordCount.textContent = `${count} 字`;
  if (els.draftPlatformAdvice) els.draftPlatformAdvice.textContent = getPlatformAdvice(draft.platform, count);
  if (els.draftMarkdownPreview) els.draftMarkdownPreview.innerHTML = renderMarkdown(draft.body);
}

function countContentWords(text) {
  const clean = String(text || "").replace(/\s+/g, "");
  const zh = (clean.match(/[\u4e00-\u9fa5]/g) || []).length;
  const words = (String(text || "").match(/[A-Za-z0-9_]+/g) || []).length;
  return zh + words;
}

function getPlatformAdvice(platform, count) {
  const rules = { "小红书": "建议 500-900 字，前 3 行给痛点/结果。", "抖音": "拆成 30-90 秒口播脚本。", "视频号": "偏经验复盘，300-800 字。", "公众号": "1200 字以上长文。", "B站": "脚本大纲+分P结构。", "知乎": "问题导向，先结论后展开。" };
  const base = rules[platform] || "建议先明确平台和发布目的。";
  const level = count < 200 ? "当前偏短，适合继续起草。" : count > 1200 ? "当前偏长，建议压缩。" : "当前字数适中。";
  return `${base} ${level}`;
}

function renderMarkdown(text) {
  const raw = String(text || "").trim();
  if (!raw) return "正文预览会显示在这里。";
  const lines = raw.split(/\r?\n/);
  let inList = false;
  const html = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) { if (inList) { html.push("</ul>"); inList = false; } return; }
    if (/^###\s+/.test(trimmed)) { if (inList) { html.push("</ul>"); inList = false; } html.push(`<h3>${inlineMarkdown(trimmed.replace(/^###\s+/, ""))}</h3>`); }
    else if (/^##\s+/.test(trimmed)) { if (inList) { html.push("</ul>"); inList = false; } html.push(`<h2>${inlineMarkdown(trimmed.replace(/^##\s+/, ""))}</h2>`); }
    else if (/^#\s+/.test(trimmed)) { if (inList) { html.push("</ul>"); inList = false; } html.push(`<h1>${inlineMarkdown(trimmed.replace(/^#\s+/, ""))}</h1>`); }
    else if (/^[-*]\s+/.test(trimmed)) { if (!inList) { html.push("<ul>"); inList = true; } html.push(`<li>${inlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}</li>`); }
    else { if (inList) { html.push("</ul>"); inList = false; } html.push(`<p>${inlineMarkdown(trimmed)}</p>`); }
  });
  if (inList) html.push("</ul>");
  return html.join("");
}

function inlineMarkdown(text) { return esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); }

async function runContentDraftAi(action) {
  const draft = getContentDraftForm();
  if (!draft.title && !draft.body && action !== "draft") { showToast("请先填写标题或正文"); return; }
  setDraftAiStatus("AI 正在处理：" + draftActionName(action));
  try {
    const response = await fetch("/api/content/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, provider: els.draftProviderSelect.value, draft }) });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "生成失败");

    // TRAE桥接模式
    if (result.mode === "trae-bridge") {
      els.draftPlatformAdvice.innerHTML = buildTraeBridgeUI(result.traePrompt, result.fallbackReason);
      setDraftAiStatus("TRAE桥接模式 - 请复制指令到TRAE执行");
      return;
    }

    applyDraftAiResult(action, result.parsed || {}, result.answer || "");
    setDraftAiStatus(`已生成：${draftActionName(action)} · ${result.provider || "AI"}`);
    showToast("AI 已更新草稿");
  } catch (error) {
    setDraftAiStatus("AI 处理失败：" + error.message);
    showToast("AI 处理失败：" + error.message);
  }
}

function applyDraftAiResult(action, parsed, answer) {
  if (parsed.title) els.draftTitle.value = parsed.title;
  if (parsed.altTitles) els.draftAltTitles.value = (Array.isArray(parsed.altTitles) ? parsed.altTitles : [parsed.altTitles]).join("\n");
  if (parsed.body) els.draftBody.value = parsed.body;
  if (parsed.coverTitle) els.draftCoverTitle.value = parsed.coverTitle;
  if (parsed.coverSubtitle) els.draftCoverSubtitle.value = parsed.coverSubtitle;
  if (parsed.tags) els.draftTags.value = (Array.isArray(parsed.tags) ? parsed.tags : splitTags(parsed.tags)).join(", ");
  if (action === "check" && answer) { els.draftBody.value = `${els.draftBody.value}\n\n---\n发布检查：\n${answer}`.trim(); }
  updateDraftAssist();
}

function draftActionName(action) {
  return ({ title: "标题优化", draft: "起草正文", expand: "扩写正文", polish: "润色表达", cover: "封面文案", tags: "标签建议", check: "发布检查" })[action] || "内容处理";
}

async function copyContentDraftToTrae(event) {
  event?.preventDefault();
  const draft = getContentDraftForm();
  const prompt = `请作为 TRAE 内容编辑助手，基于下面草稿补全/优化，并严格输出 JSON。\n\n平台：${draft.platform}\n标题：${draft.title || "未填写"}\n正文：\n${draft.body || "未填写"}\n标签：${draft.tags.join(", ") || "未填写"}`;
  await copyText(prompt);
  setDraftAiStatus("已复制给 TRAE；把 TRAE 返回 JSON 粘贴回来后点击导入。");
  showToast("已复制给 TRAE");
}

function importContentDraftFromTrae(event) {
  event?.preventDefault();
  const text = els.traeDraftInput.value.trim();
  if (!text) return showToast("请先粘贴 TRAE 返回结果");
  try {
    const parsed = parseTraeJson(text);
    fillContentDraftForm(normalizeDraftResult(parsed));
    setDraftAiStatus("已导入 TRAE 结构化草稿。");
    showToast("已导入 TRAE 结果");
  } catch {
    els.draftBody.value = text;
    updateDraftAssist();
    setDraftAiStatus("未识别为 JSON，已作为正文导入。");
    showToast("已作为正文导入");
  }
}

function normalizeDraftResult(parsed) {
  return { platform: parsed.platform, collection: parsed.collection, type: parsed.type, audience: parsed.audience, status: parsed.status, title: parsed.title, altTitles: parsed.altTitles || parsed.alternativeTitles || parsed.titles, body: parsed.body || parsed.content, coverTitle: parsed.coverTitle || parsed.cover_title, coverSubtitle: parsed.coverSubtitle || parsed.cover_subtitle, tags: parsed.tags, publishTime: parsed.publishTime || parsed.publish_time };
}

function saveContentDraft(event) {
  event?.preventDefault();
  const draft = getContentDraftForm();
  if (!draft.title) return showToast("请先填写标题");
  if (!userItems.content) userItems.content = [];
  const wordCount = countContentWords(draft.body);
  const newItem = { title: draft.title, summary: buildDraftSummary(draft, wordCount), status: draft.status || "草稿", category: "工作材料", audience: draft.audience || "自己", tags: unique([draft.platform, draft.type, draft.collection, ...draft.tags]).slice(0, 10), date: draft.publishTime ? `发布：${draft.publishTime.replace("T", " ")}` : "刚刚", heat: 72, ai: true, icon: "✍️", color: "pink", contentDraft: { ...draft, wordCount, savedAt: new Date().toISOString() } };
  if (hasDuplicateItem("content", newItem)) return showToast("这篇内容草稿已保存过");
  userItems.content.unshift(newItem);
  saveUserItems();
  state.moduleId = "content";
  state.tab = "工作材料";
  els.contentDraftDialog.close();
  showToast("已保存为内容运营中心结构化卡片");
  render();
}

function buildDraftSummary(draft, wordCount) {
  return [`平台：${draft.platform}｜类型：${draft.type}｜字数：${wordCount}`, draft.collection ? `合集：${draft.collection}` : "", draft.publishTime ? `发布时间：${draft.publishTime.replace("T", " ")}` : "", draft.coverTitle ? `封面：${draft.coverTitle}${draft.coverSubtitle ? " / " + draft.coverSubtitle : ""}` : "", draft.body ? `正文摘录：${draft.body.slice(0, 260)}` : ""].filter(Boolean).join("\n");
}

function setDraftAiStatus(message) { if (els.draftAiStatus) els.draftAiStatus.textContent = message; }

/* ════════════════════════════════════════════════════════════════════
 * 保留的已有功能：导入导出
 * ════════════════════════════════════════════════════════════════════ */

function handleExport() {
  const allData = { userItems, dailyLogs, chatHistory, notes, okrs, vocabStore, books, waterStore, dietStore, exerciseStore, sleepStore, habitStore };
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `olivia-work-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("数据已导出");
}

function handleImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.userItems) {
          Object.keys(imported.userItems).forEach((key) => {
            if (!userItems[key]) userItems[key] = [];
            userItems[key] = [...imported.userItems[key], ...userItems[key]];
          });
        }
        if (imported.dailyLogs) dailyLogs = [...imported.dailyLogs, ...dailyLogs];
        if (imported.notes) notes = [...imported.notes, ...notes];
        if (imported.okrs) okrs = [...imported.okrs, ...okrs];
        if (imported.books) books = [...imported.books, ...books];
        cleanupUserItems();
        saveUserItems();
        saveDailyLogs();
        saveNotes();
        saveOkrs();
        saveBooks();
        showToast("数据已导入并自动去重");
        render();
      } catch { showToast("文件格式错误"); }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ════════════════════════════════════════════════════════════════════
 * 19. TRAE 桥接
 * ════════════════════════════════════════════════════════════════════ */

async function callTraeBridge(type, payload) {
  try {
    const response = await fetch("/api/trae/bridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "TRAE 桥接失败");
    return result.prompt;
  } catch (error) {
    showToast("TRAE 桥接失败：" + error.message);
    return null;
  }
}

async function copyToTrae(type, payload) {
  const prompt = await callTraeBridge(type, payload);
  if (!prompt) return;
  try {
    await copyText(prompt);
    showToast("已复制 TRAE 指令到剪贴板");
  } catch {
    showToast("复制失败，请手动复制");
  }
}

async function importTraeResult(text, callback) {
  if (!text || !text.trim()) { showToast("请先粘贴 TRAE 返回结果"); return; }
  try {
    const parsed = parseTraeJson(text);
    callback(parsed);
  } catch {
    callback(text);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * 启动
 * ════════════════════════════════════════════════════════════════════ */

init();