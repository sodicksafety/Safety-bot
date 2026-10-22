"use strict";

require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");
const axios = require("axios");

const app = express();
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};
if (!config.channelAccessToken || !config.channelSecret) {
  console.warn("LINE credentials are missing from environment variables.");
}
const client = new line.Client(config);
const PORT = Number(process.env.PORT || 3000);
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || "U4a74c3933c0ecf9d2062768696ba3df8";
// Apps Script เดิมยังใช้ได้ ถ้ารองรับ JSON status จะตรวจบัตรล่าสุด/หมดอายุได้เต็มรูปแบบ
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzM-aH9KjLB0xo5JiJBia09hCdWhCcusS2P4p3J_0swaH4QyZSpTCvpYlEqCTUMBjQi/exec";
const PASS_SCORE = 24;
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const APP_VERSION = "4.12.0-all-matching-line-ids";

const THEME = {
  navy: "#092F55", blue: "#1769AA", sky: "#EAF5FD", gold: "#F2C14E",
  green: "#15966A", greenSoft: "#E9F9F2", red: "#C43D4B", redSoft: "#FFF0F2",
  orange: "#E8892E", orangeSoft: "#FFF5E8", purple: "#7B61A8", ink: "#18364D",
  muted: "#647D90", line: "#D8E5EE", white: "#FFFFFF", canvas: "#F4F8FB"
};

const I18N = {
  th: {
    langName: "ภาษาไทย", selectLanguage: "เลือกภาษาสำหรับทำแบบทดสอบ", selectLanguageSub: "กรุณาเลือกหนึ่งภาษาเพื่อใช้งานจนจบขั้นตอน",
    chooseJob: "เลือกตำแหน่งงาน", chooseJobSub: "แตะตำแหน่งที่ตรงกับหน้าที่ของคุณ", tapSelect: "แตะเพื่อเลือก",
    fullname: "ชื่อ–นามสกุล", phone: "เบอร์โทรศัพท์", identity: "ข้อมูลยืนยันตัวตน", company: "ชื่อบริษัท",
    fullNamePrompt: "กรุณาพิมพ์ชื่อ–นามสกุลของคุณ", phonePrompt: "กรุณาพิมพ์เบอร์โทรศัพท์ 10 หลัก",
    identityPrompt: "กรุณากรอกเลขบัตรประชาชน 13 หลัก หรือ Passport / Work Permit 6–13 ตัวอักษร", companyPrompt: "กรุณาพิมพ์ชื่อบริษัทของคุณ",
    typeAnswer: "พิมพ์คำตอบในช่องแชทด้านล่าง", review: "ตรวจสอบข้อมูลก่อนเริ่มสอบ", reviewSub: "โปรดตรวจสอบความถูกต้องก่อนยืนยัน",
    position: "ตำแหน่ง", confirmStart: "ยืนยันและเริ่มทำแบบทดสอบ", restartForm: "กรอกข้อมูลใหม่",
    examInfo: "แบบทดสอบทั้งหมด 30 ข้อ • เกณฑ์ผ่าน 24 คะแนน", question: "ข้อ", of: "จาก", progress: "ความคืบหน้า",
    remaining: "ข้อที่เหลือ", selectOne: "เลือกคำตอบที่ถูกต้อง 1 ข้อ", passed: "ผ่านการทดสอบ", failed: "ยังไม่ผ่านการทดสอบ",
    passedSub: "บันทึกผลเรียบร้อย", failedSub: "กรุณาทบทวนและทำแบบทดสอบใหม่", score: "คะแนน", passScore: "เกณฑ์ผ่าน",
    percentage: "ผลคะแนน", missing: "ขาดอีก", points: "คะแนน", downloadCard: "ดาวน์โหลดบัตรผู้รับเหมา", retake: "ทำแบบทดสอบใหม่",
    reviewTraining: "ทบทวนสื่ออบรม", invalidPhone: "❌ เบอร์โทรไม่ถูกต้อง กรุณากรอกตัวเลข 10 หลัก เช่น 0812345678",
    invalidId: "❌ หมายเลขไม่ถูกต้อง กรุณาใช้ตัวอักษรภาษาอังกฤษหรือตัวเลข 6–13 ตัว", expired: "⚠️ ขั้นตอนหมดอายุ กรุณาเริ่มทำแบบทดสอบใหม่",
    chooseButton: "กรุณาเลือกจากปุ่มในข้อความล่าสุด", resumeTitle: "พบแบบทดสอบที่ยังทำไม่เสร็จ", resumeSub: "เลือกทำต่อจากเดิมหรือเริ่มใหม่ทั้งหมด",
    continueExam: "ทำต่อจากข้อเดิม", startNew: "เริ่มแบบทดสอบใหม่", completed: "ทำแล้ว", pausedNotice: "พักข้อสอบและบันทึกความคืบหน้าไว้แล้ว"
  },
  en: {
    langName: "English", selectLanguage: "Select Exam Language", selectLanguageSub: "Choose one language for the entire exam process.",
    chooseJob: "Select Job Position", chooseJobSub: "Choose the position that matches your role.", tapSelect: "Tap to select",
    fullname: "Full Name", phone: "Phone Number", identity: "ID / Passport", company: "Company Name",
    fullNamePrompt: "Please type your full name.", phonePrompt: "Please enter your 10-digit phone number.",
    identityPrompt: "Please enter a 13-digit Thai ID or a 6–13 character Passport / Work Permit number.", companyPrompt: "Please type your company name.",
    typeAnswer: "Type your answer in the chat below.", review: "Review Your Information", reviewSub: "Check all information before confirmation.",
    position: "Position", confirmStart: "Confirm and Start Exam", restartForm: "Enter Information Again",
    examInfo: "30 questions • Passing score: 24", question: "Question", of: "of", progress: "Progress",
    remaining: "questions remaining", selectOne: "Select one correct answer", passed: "Passed", failed: "Retake Required",
    passedSub: "Result saved successfully", failedSub: "Please review the training and retake the exam.", score: "Score", passScore: "Passing score",
    percentage: "Percentage", missing: "Need", points: "more points", downloadCard: "Download Contractor Card", retake: "Retake Exam",
    reviewTraining: "Review Training Media", invalidPhone: "❌ Invalid phone number. Please enter 10 digits, for example 0812345678.",
    invalidId: "❌ Invalid number. Use 6–13 English letters or digits.", expired: "⚠️ This session has expired. Please start the exam again.",
    chooseButton: "Please select an option from the latest message.", resumeTitle: "Unfinished Exam Found", resumeSub: "Continue where you stopped or start again.",
    continueExam: "Continue Exam", startNew: "Start New Exam", completed: "completed", pausedNotice: "Your exam has been paused safely."
  },
  ja: {
    langName: "日本語", selectLanguage: "試験言語を選択", selectLanguageSub: "試験終了まで使用する言語を選択してください。",
    chooseJob: "職種を選択", chooseJobSub: "該当する職種を選択してください。", tapSelect: "タップして選択",
    fullname: "氏名", phone: "電話番号", identity: "身分証明書 / パスポート", company: "会社名",
    fullNamePrompt: "氏名を入力してください。", phonePrompt: "10桁の電話番号を入力してください。",
    identityPrompt: "タイ国民ID 13桁、またはパスポート / 労働許可証番号 6～13文字を入力してください。", companyPrompt: "会社名を入力してください。",
    typeAnswer: "下のチャット欄に入力してください。", review: "入力内容の確認", reviewSub: "試験開始前に内容を確認してください。",
    position: "職種", confirmStart: "確認して試験開始", restartForm: "情報を再入力",
    examInfo: "全30問・合格点24点", question: "問題", of: "/", progress: "進捗",
    remaining: "問残り", selectOne: "正しい答えを1つ選択", passed: "合格", failed: "再受験が必要",
    passedSub: "結果を保存しました", failedSub: "研修内容を確認して再受験してください。", score: "得点", passScore: "合格点",
    percentage: "正答率", missing: "あと", points: "点必要", downloadCard: "請負業者カードを取得", retake: "再受験",
    reviewTraining: "研修資料を見る", invalidPhone: "❌ 電話番号が正しくありません。10桁で入力してください。",
    invalidId: "❌ 番号が正しくありません。英字または数字6～13文字で入力してください。", expired: "⚠️ セッションの有効期限が切れました。もう一度開始してください。",
    chooseButton: "最新メッセージのボタンから選択してください。", resumeTitle: "未完了の試験があります", resumeSub: "続きから再開するか、最初から開始できます。",
    continueExam: "続きから再開", startNew: "最初から開始", completed: "完了", pausedNotice: "試験の進捗を一時保存しました。"
  },
  my: {
    langName: "မြန်မာဘာသာ", selectLanguage: "စာမေးပွဲဘာသာစကားရွေးပါ", selectLanguageSub: "စာမေးပွဲပြီးဆုံးသည်အထိ အသုံးပြုမည့်ဘာသာစကားကို ရွေးပါ။",
    chooseJob: "အလုပ်ရာထူးရွေးပါ", chooseJobSub: "သင့်တာဝန်နှင့်ကိုက်ညီသော ရာထူးကိုရွေးပါ။", tapSelect: "ရွေးရန်နှိပ်ပါ",
    fullname: "အမည်အပြည့်အစုံ", phone: "ဖုန်းနံပါတ်", identity: "ID / Passport", company: "ကုမ္ပဏီအမည်",
    fullNamePrompt: "အမည်အပြည့်အစုံကို ရိုက်ထည့်ပါ။", phonePrompt: "ဖုန်းနံပါတ် ၁၀ လုံး ရိုက်ထည့်ပါ။",
    identityPrompt: "ထိုင်း ID ၁၃ လုံး သို့မဟုတ် Passport / Work Permit ၆–၁၃ လုံး ရိုက်ထည့်ပါ။", companyPrompt: "ကုမ္ပဏီအမည်ကို ရိုက်ထည့်ပါ။",
    typeAnswer: "အောက်ရှိ chat box တွင် အဖြေကိုရိုက်ပါ။", review: "အချက်အလက်ပြန်စစ်ပါ", reviewSub: "စာမေးပွဲမစမီ အချက်အလက်မှန်ကန်မှုကို စစ်ပါ။",
    position: "ရာထူး", confirmStart: "အတည်ပြုပြီး စာမေးပွဲစမည်", restartForm: "အချက်အလက်ပြန်ဖြည့်မည်",
    examInfo: "မေးခွန်း ၃၀ • အောင်မှတ် ၂၄", question: "မေးခွန်း", of: "/", progress: "ပြီးစီးမှု",
    remaining: "မေးခွန်းကျန်", selectOne: "အဖြေမှန်တစ်ခုရွေးပါ", passed: "အောင်မြင်သည်", failed: "ပြန်လည်ဖြေဆိုရန်လိုသည်",
    passedSub: "ရလဒ်သိမ်းပြီးပါပြီ", failedSub: "သင်တန်းကိုပြန်လေ့လာပြီး စာမေးပွဲပြန်ဖြေပါ။", score: "ရမှတ်", passScore: "အောင်မှတ်",
    percentage: "ရာခိုင်နှုန်း", missing: "နောက်ထပ်", points: "မှတ်လိုသည်", downloadCard: "ကန်ထရိုက်တာကတ်ရယူမည်", retake: "ပြန်ဖြေမည်",
    reviewTraining: "သင်တန်းပြန်ကြည့်မည်", invalidPhone: "❌ ဖုန်းနံပါတ်မမှန်ပါ။ နံပါတ် ၁၀ လုံးထည့်ပါ။",
    invalidId: "❌ နံပါတ်မမှန်ပါ။ အင်္ဂလိပ်အက္ခရာ သို့မဟုတ် နံပါတ် ၆–၁၃ လုံးသုံးပါ။", expired: "⚠️ အချိန်ကုန်သွားပါပြီ။ စာမေးပွဲကို ပြန်စပါ။",
    chooseButton: "နောက်ဆုံးစာ၏ခလုတ်မှ ရွေးပါ။", resumeTitle: "မပြီးသေးသောစာမေးပွဲရှိသည်", resumeSub: "ရပ်ထားသည့်နေရာမှဆက်လုပ်နိုင်သလို အသစ်စနိုင်သည်။",
    continueExam: "ဆက်လက်ဖြေဆိုမည်", startNew: "အသစ်စမည်", completed: "ပြီးစီး", pausedNotice: "စာမေးပွဲတိုးတက်မှုကို ခေတ္တသိမ်းထားသည်။"
  }  ,zh: {
    langName: "简体中文", selectLanguage: "选择考试语言", selectLanguageSub: "请选择考试全程使用的语言。",
    chooseJob: "选择职位", chooseJobSub: "请选择与您的工作相符的职位。", tapSelect: "点击选择",
    fullname: "姓名", phone: "电话号码", identity: "身份证 / 护照", company: "公司名称",
    fullNamePrompt: "请输入您的姓名。", phonePrompt: "请输入10位电话号码。",
    identityPrompt: "请输入13位泰国身份证号码，或6至13位护照 / 工作许可证号码。", companyPrompt: "请输入公司名称。",
    typeAnswer: "请在下方聊天框输入答案。", review: "确认个人信息", reviewSub: "开始考试前请检查所有信息。",
    position: "职位", confirmStart: "确认并开始考试", restartForm: "重新填写信息",
    examInfo: "共30题 • 24分及格", question: "第", of: "题 / 共", progress: "进度",
    remaining: "题剩余", selectOne: "请选择一个正确答案", passed: "考试通过", failed: "需要重新考试",
    passedSub: "结果已成功保存", failedSub: "请复习培训内容后重新考试。", score: "得分", passScore: "及格分数",
    percentage: "正确率", missing: "还差", points: "分", downloadCard: "下载承包商卡", retake: "重新考试",
    reviewTraining: "查看培训资料", invalidPhone: "❌ 电话号码无效，请输入10位数字。",
    invalidId: "❌ 号码无效，请输入6至13位英文字母或数字。", expired: "⚠️ 会话已过期，请重新开始考试。",
    chooseButton: "请从最新消息中的按钮选择。", resumeTitle: "发现未完成的考试", resumeSub: "您可以继续考试或重新开始。",
    continueExam: "继续考试", startNew: "重新开始", completed: "已完成", pausedNotice: "考试进度已暂时保存。"
  }

};

const JOB_LABELS = {
  Owner: { th: "เจ้าของบริษัท", en: "Owner", ja: "会社経営者", my: "ကုမ္ပဏီပိုင်ရှင်", zh: "公司负责人" },
  Supervisor: { th: "ผู้ควบคุมงาน", en: "Supervisor", ja: "監督者", my: "ကြီးကြပ်သူ", zh: "主管" },
  Engineer: { th: "วิศวกร", en: "Engineer", ja: "エンジニア", my: "အင်ဂျင်နီယာ", zh: "工程师" },
  Foreman: { th: "โฟร์แมน", en: "Foreman", ja: "職長", my: "ဖိုမင်", zh: "领班" },
  Technician: { th: "ช่าง", en: "Technician", ja: "技術者", my: "နည်းပညာရှင်", zh: "技术员" },
  GeneralWorker: { th: "พนักงานทั่วไป", en: "General Worker", ja: "一般作業員", my: "အထွေထွေလုပ်သား", zh: "普通工人" }
};

const userState = new Map();
const userPreferences = new Map();
const pendingMenuActions = new Map();
const pausedSessions = new Map();
const inactivityTimers = new Map();
const latestPassedExams = new Map();
function hasUserLanguage(userId) {
  const lang = userPreferences.get(userId)?.language;
  return Boolean(lang && I18N[lang]);
}
function getUserLanguage(userId) {
  const lang = userPreferences.get(userId)?.language;
  return I18N[lang] ? lang : "th";
}
function setUserLanguage(userId, language) {
  const lang = I18N[language] ? language : "th";
  userPreferences.set(userId, { language: lang });
  return lang;
}
function uiText(lang, key) {
  const selected = GLOBAL_UI[lang] || GLOBAL_UI.th;
  return selected[key] || GLOBAL_UI.th[key] || key;
}
function normalize(v = "") { return String(v).toLowerCase().replace(/\s/g, "").replace(/[–—]/g, "-").trim(); }
function safeText(v, max = 500) { return String(v ?? "").trim().slice(0, max) || "-"; }
function getLanguage(state) {
  return I18N[state?.language] ? state.language : "th";
}
function tr(state, key) {
  const lang = getLanguage(state);
  return I18N[lang]?.[key] || I18N.th[key] || key;
}
function clearUserState(userId) { userState.delete(userId); const timer = inactivityTimers.get(userId); if (timer) clearTimeout(timer); inactivityTimers.delete(userId); }
function touchState(userId) { const old = inactivityTimers.get(userId); if (old) clearTimeout(old); inactivityTimers.set(userId, setTimeout(() => clearUserState(userId), SESSION_TIMEOUT_MS)); }
function reply(event, messages) { return client.replyMessage(event.replyToken, Array.isArray(messages) ? messages : [messages]); }
function textMessage(text) { return { type: "text", text: safeText(text, 5000) }; }

function titleBlock(icon, eyebrow, title, subtitle, color = THEME.navy) {
  return { type: "box", layout: "horizontal", spacing: "md", paddingAll: "20px", background: { type: "linearGradient", angle: "125deg", startColor: color, endColor: "#1769AA" }, contents: [
    { type: "box", layout: "vertical", width: "52px", height: "52px", cornerRadius: "18px", backgroundColor: THEME.white, justifyContent: "center", alignItems: "center", contents: [{ type: "text", text: icon, size: "xl", align: "center" }] },
    { type: "box", layout: "vertical", flex: 1, justifyContent: "center", contents: [
      { type: "text", text: eyebrow, size: "xxs", weight: "bold", color: "#BFD8EA" },
      { type: "text", text: title, size: "xl", weight: "bold", color: THEME.white, wrap: true, margin: "xs", maxLines: 2 },
      { type: "text", text: subtitle, size: "xs", color: "#DCEAF4", wrap: true, margin: "xs", maxLines: 2 }
    ]}
  ]};
}
function actionCard(icon, title, subtitle, action, accent = THEME.blue) {
  return { type: "box", layout: "horizontal", spacing: "md", paddingAll: "15px", margin: "sm", cornerRadius: "16px", backgroundColor: THEME.white, borderColor: THEME.line, borderWidth: "1px", action, contents: [
    { type: "box", layout: "vertical", width: "44px", height: "44px", cornerRadius: "14px", backgroundColor: accent, justifyContent: "center", alignItems: "center", contents: [{ type: "text", text: icon, size: "lg", align: "center" }] },
    { type: "box", layout: "vertical", flex: 1, justifyContent: "center", contents: [
      { type: "text", text: title, size: "sm", weight: "bold", color: THEME.ink, wrap: true, maxLines: 2 },
      { type: "text", text: subtitle, size: "xxs", color: THEME.muted, wrap: true, margin: "xs", maxLines: 2 }
    ]},
    { type: "text", text: "›", size: "xl", weight: "bold", color: accent, flex: 0, gravity: "center" }
  ]};
}
function dataRow(label, value) {
  return { type: "box", layout: "vertical", paddingAll: "12px", margin: "sm", cornerRadius: "12px", backgroundColor: THEME.white, borderColor: THEME.line, borderWidth: "1px", contents: [
    { type: "text", text: label, size: "xxs", weight: "bold", color: THEME.muted },
    { type: "text", text: safeText(value, 180), size: "sm", weight: "bold", color: THEME.ink, wrap: true, margin: "xs", maxLines: 3 }
  ]};
}

const safetyQA = [
  { question: "ที่อยู่", answer: "📍 Sodick (Thailand)\nบริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)\n60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120\nโทร: 02-529-2450-6\nTax ID: 0105531085736" },
  { question: "ขอที่อยู่", answer: "📍 Sodick (Thailand)\nบริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)\n60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120\nโทร: 02-529-2450-6\nTax ID: 0105531085736" },
  { question: "ที่อยู่บริษัท", answer: "📍 Sodick (Thailand)\nบริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)\n60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120\nโทร: 02-529-2450-6\nTax ID: 0105531085736" },
  { question: "ชื่อบริษัท", answer: "บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)\nTax ID: 0105531085736" },
  { question: "ใบกำกับภาษี", answer: "🧾 บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)\n60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120\nTax ID: 0105531085736" },
  { question: "ข้อมูลบริษัท", answer: "🧾 บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)\nโทร: 02-529-2450-6\nTax ID: 0105531085736" },
  { question: "เบอร์ติดต่อ", answer: "📞 โรงงาน 1: 02-529-2450-6 ต่อ 102, 127, 129\nโรงงาน 2: 02-529-3200-6 ต่อ 137\nพี่ไก่: 061-645-5095\nน้องดุจ: 081-695-4474\nน้องพิน: 083-237-4357\nน้องกี้: 094-938-0425" },
  { question: "ขอเบอร์", answer: "📞 โรงงาน 1: 02-529-2450-6 ต่อ 102, 127, 129\nโรงงาน 2: 02-529-3200-6 ต่อ 137" },
  { question: "เบอร์โทร", answer: "📞 โรงงาน 1: 02-529-2450-6 ต่อ 102, 127, 129\nโรงงาน 2: 02-529-3200-6 ต่อ 137" }
];

const examQuestions = [
  { th:["PPE คืออะไร?",["อุปกรณ์ป้องกันอันตรายส่วนบุคคล","รองเท้าธรรมดา","เสื้อผ้าทั่วไป"]], en:["What does PPE mean?",["Personal protective equipment","Ordinary shoes","General clothing"]], ja:["PPEとは何ですか？",["個人用保護具","一般的な靴","一般的な衣服"]], my:["PPE ဆိုတာဘာလဲ။",["ကိုယ်ရေးကာကွယ်ရေးပစ္စည်း","သာမန်ဖိနပ်","သာမန်အဝတ်အစား"]], zh:["PPE是什么意思？",["个人防护装备","普通鞋子","普通衣服"]], answer:0 },
  { th:["หมวกนิรภัยต้องสวมเมื่อไหร่?",["เมื่ออยู่ในพื้นที่ทำงาน","เฉพาะตอนมีผู้จัดการมา","ไม่จำเป็น"]], en:["When must a safety helmet be worn?",["When inside the work area","Only when a manager is present","It is not necessary"]], ja:["安全ヘルメットはいつ着用しますか？",["作業エリア内にいるとき","管理者が来たときだけ","着用不要"]], my:["လုံခြုံရေးဦးထုပ်ကို ဘယ်အချိန်ဝတ်ရမလဲ။",["အလုပ်ဧရိယာထဲရှိချိန်","မန်နေဂျာလာချိန်သာ","မလိုအပ်ပါ"]], zh:["什么时候必须佩戴安全帽？",["进入工作区域时","只有经理到场时","不需要佩戴"]], answer:0 },
  { th:["งานที่สูงคือความสูงตั้งแต่กี่เมตรขึ้นไป?",["1 เมตร","2 เมตร","5 เมตร"]], en:["Work at height starts from what height?",["1 meter","2 meters","5 meters"]], ja:["高所作業は何メートル以上ですか？",["1メートル","2メートル","5メートル"]], my:["အမြင့်တွင်အလုပ်သည် ဘယ်နှမီတာမှစပါသလဲ။",["၁ မီတာ","၂ မီတာ","၅ မီတာ"]], zh:["高处作业从多少米开始？",["1米","2米","5米"]], answer:1 },
  { th:["ถังดับเพลิงสีแดงใช้สำหรับดับอะไร?",["ไฟฟ้า","เชื้อเพลิงของเหลว","ไม้/กระดาษ"]], en:["In this test, what is the red fire extinguisher used for?",["Electrical fire","Flammable liquid","Wood / paper"]], ja:["この試験で赤い消火器は何を消すために使いますか？",["電気火災","液体燃料火災","木材・紙の火災"]], my:["ဤစာမေးပွဲအရ အနီရောင်မီးသတ်ဘူးကို ဘာအတွက်သုံးသလဲ။",["လျှပ်စစ်မီး","အရည်လောင်စာမီး","သစ်သား/စက္ကူမီး"]], zh:["本考试中，红色灭火器用于扑灭什么？",["电气火灾","液体燃料火灾","木材或纸张火灾"]], answer:2 },
  { th:["หากพบอุบัติเหตุควรทำอย่างไร?",["ถ่ายรูปก่อน","แจ้งทีม Safety ทันที","เดินหนี"]], en:["What should you do if you find an accident?",["Take a photo first","Notify the Safety team immediately","Walk away"]], ja:["事故を発見したらどうしますか？",["先に写真を撮る","直ちにSafetyへ連絡","立ち去る"]], my:["မတော်တဆမှုတွေ့လျှင် ဘာလုပ်ရမလဲ။",["ဓာတ်ပုံအရင်ရိုက်မည်","Safety အဖွဲ့ကို ချက်ချင်းအကြောင်းကြားမည်","ထွက်သွားမည်"]], zh:["发现事故时应该怎么做？",["先拍照","立即通知Safety团队","离开现场"]], answer:1 },
  { th:["จะสูบบุหรี่ควรทำอย่างไร?",["สูบตรงไหนก็ได้","สูบในห้องน้ำ","สูบเฉพาะจุดที่กำหนด"]], en:["Where is smoking allowed?",["Anywhere","In the restroom","Only in designated areas"]], ja:["喫煙はどこで可能ですか？",["どこでも","トイレ","指定場所のみ"]], my:["ဆေးလိပ်ကို ဘယ်မှာသောက်ရမလဲ။",["နေရာတိုင်း","အိမ်သာ","သတ်မှတ်နေရာတွင်သာ"]], zh:["应该在哪里吸烟？",["任何地方","洗手间","仅限指定区域"]], answer:2 },
  { th:["การเดินในโรงงานควรเดินตรงไหน?",["เดินในเลนคนเดิน","เดินบนถนนรถยก","เดินตรงไหนก็ได้"]], en:["Where should pedestrians walk in the factory?",["In the pedestrian lane","On the forklift road","Anywhere"]], ja:["工場内ではどこを歩きますか？",["歩行者通路","フォークリフト道路","どこでも"]], my:["စက်ရုံအတွင်း ဘယ်နေရာကလျှောက်ရမလဲ။",["လူသွားလမ်း","ဖော့ကလစ်လမ်း","နေရာတိုင်း"]], zh:["在工厂内应该走哪里？",["人行通道","叉车道路","任何地方"]], answer:0 },
  { th:["ถ้าพบสารเคมีหกควรทำอย่างไร?",["เช็ดเอง","แจ้ง Safety","ปล่อยไว้"]], en:["What should you do if chemicals spill?",["Clean it yourself","Notify Safety","Leave it"]], ja:["化学物質の漏れを発見したら？",["自分で拭く","Safetyへ連絡","放置する"]], my:["ဓာတုပစ္စည်းယိုဖိတ်မှုတွေ့လျှင်။",["ကိုယ်တိုင်သုတ်မည်","Safety ကိုအကြောင်းကြားမည်","ထားခဲ့မည်"]], zh:["发现化学品泄漏时应该怎么做？",["自己擦拭","通知Safety","不处理"]], answer:1 },
  { th:["การยกของหนักควรทำอย่างไร?",["ก้มหลังยก","ใช้แรงเต็มที่","ย่อตัวแล้วยก"]], en:["How should a heavy object be lifted?",["Bend the back","Use maximum force","Squat and lift"]], ja:["重い物を持ち上げる方法は？",["腰を曲げて持つ","力いっぱい持つ","しゃがんで持ち上げる"]], my:["လေးလံသောပစ္စည်းကို မည်သို့မရမလဲ။",["ခါးကုန်း၍မမည်","အားအပြည့်သုံးမည်","ဒူးကွေးပြီးမမည်"]], zh:["应该怎样搬起重物？",["弯腰搬起","用尽全力","下蹲后搬起"]], answer:2 },
  { th:["ป้ายเตือนสีเหลืองหมายถึงอะไร?",["ข้อบังคับ","คำเตือน","ห้ามทำ"]], en:["What does a yellow safety sign mean?",["Mandatory action","Warning","Prohibition"]], ja:["黄色の安全標識の意味は？",["義務","警告","禁止"]], my:["အဝါရောင်လုံခြုံရေးဆိုင်း၏အဓိပ္ပါယ်။",["မဖြစ်မနေလုပ်ရန်","သတိပေးချက်","တားမြစ်ချက်"]], zh:["黄色安全标志表示什么？",["必须执行","警告","禁止"]], answer:1 },
  { th:["ป้ายวงกลมสีแดงมีเส้นทับหมายถึงอะไร?",["ควรทำ","ห้ามทำ","ไม่เกี่ยว"]], en:["What does a red circle with a diagonal line mean?",["Recommended","Prohibited","Not relevant"]], ja:["赤い円に斜線の標識の意味は？",["推奨","禁止","関係なし"]], my:["အနီစက်ဝိုင်းနှင့် မျဉ်းဖြတ်ဆိုင်း၏အဓိပ္ပါယ်။",["လုပ်သင့်သည်","မလုပ်ရ","မသက်ဆိုင်"]], zh:["红色圆圈加斜线表示什么？",["建议执行","禁止","无关"]], answer:1 },
  { th:["ถ้าต้องใช้บันไดควรทำอย่างไร?",["ปีนสองคน","ตรวจสภาพก่อนใช้","ใช้บันไดพัง"]], en:["What should you do before using a ladder?",["Climb with two people","Inspect it before use","Use a damaged ladder"]], ja:["はしご使用前に何をしますか？",["2人で登る","使用前点検","壊れたものを使う"]], my:["လှေကားအသုံးမပြုမီ ဘာလုပ်ရမလဲ။",["နှစ်ယောက်တက်မည်","အသုံးမပြုမီစစ်မည်","ပျက်နေသောလှေကားသုံးမည်"]], zh:["使用梯子前应该做什么？",["两人同时攀爬","使用前检查","使用损坏的梯子"]], answer:1 },
  { th:["ถ้าต้องทำงานเชื่อมต้องมีอุปกรณ์อะไร?",["แว่นเชื่อม","หมวกกันน็อค","รองเท้าแตะ"]], en:["What equipment is required for welding?",["Welding eye protection","Motorcycle helmet","Sandals"]], ja:["溶接作業に必要な保護具は？",["溶接用保護メガネ","バイク用ヘルメット","サンダル"]], my:["ဂဟေဆော်ရာတွင် ဘာလိုအပ်သလဲ။",["ဂဟေဆော်မျက်မှန်","ဆိုင်ကယ်ဦးထုပ်","ဖိနပ်ပါး"]], zh:["焊接作业需要什么防护用品？",["焊接护目镜","摩托车头盔","拖鞋"]], answer:0 },
  { th:["ถ้าต้องทำงานในที่อับอากาศต้องมีอะไร?",["ใบอนุญาต","ไฟฉาย","น้ำดื่ม"]], en:["What is required for confined-space work?",["A work permit","A flashlight","Drinking water"]], ja:["閉所作業に必要なものは？",["作業許可証","懐中電灯","飲料水"]], my:["ပိတ်လှောင်နေရာအလုပ်အတွက် ဘာလိုအပ်သလဲ။",["အလုပ်ခွင့်လက်မှတ်","ဓာတ်မီး","သောက်ရေ"]], zh:["进入受限空间作业需要什么？",["工作许可证","手电筒","饮用水"]], answer:0 },
  { th:["รถยกมีสิทธิ์ในถนนโรงงานมากกว่าคนเดินหรือไม่?",["ใช่","ไม่ใช่","แล้วแต่เวลา"]], en:["Does a forklift always have more right of way than pedestrians?",["Yes","No","It depends on the time"]], ja:["フォークリフトは常に歩行者より優先ですか？",["はい","いいえ","時間による"]], my:["ဖော့ကလစ်သည် လမ်းလျှောက်သူထက်အမြဲဦးစားပေးပါသလား။",["ဟုတ်သည်","မဟုတ်ပါ","အချိန်ပေါ်မူတည်သည်"]], zh:["叉车是否始终比行人拥有优先权？",["是","不是","视时间而定"]], answer:1 },
  { th:["ถ้าพบสายไฟชำรุดควรทำอย่างไร?",["จับดู","แจ้งช่างไฟ","ใช้ต่อ"]], en:["What should you do with a damaged electrical cable?",["Touch it","Notify an electrician","Continue using it"]], ja:["電線の損傷を発見したら？",["触って確認","電気担当へ連絡","そのまま使用"]], my:["ပျက်စီးလျှပ်စစ်ကြိုးတွေ့လျှင်။",["ကိုင်ကြည့်မည်","လျှပ်စစ်ကျွမ်းကျင်သူကိုအကြောင်းကြားမည်","ဆက်သုံးမည်"]], zh:["发现电线损坏时应该怎么做？",["用手触摸检查","通知电工","继续使用"]], answer:1 },
  { th:["ถ้าต้องตัดเหล็กควรใส่อุปกรณ์อะไร?",["แว่นตานิรภัย","หมวกแก๊ป","ไม่มีอะไร"]], en:["What should be worn when cutting metal?",["Safety glasses","A cap","Nothing"]], ja:["金属切断時に着用するものは？",["保護メガネ","帽子","何もなし"]], my:["သံဖြတ်ရာတွင် ဘာဝတ်ရမလဲ။",["လုံခြုံရေးမျက်မှန်","ဦးထုပ်","ဘာမှမဝတ်"]], zh:["切割金属时应该佩戴什么？",["安全眼镜","帽子","不需要"]], answer:0 },
  { th:["ถังดับเพลิงต้องตรวจทุกกี่เดือน?",["1 เดือน","3 เดือน","6 เดือน"]], en:["According to this training, how often is a fire extinguisher inspected?",["Every month","Every 3 months","Every 6 months"]], ja:["この研修では消火器を何か月ごとに点検しますか？",["1か月","3か月","6か月"]], my:["ဤသင်တန်းအရ မီးသတ်ဘူးကို ဘယ်နှလတိုင်းစစ်ရမလဲ။",["၁ လ","၃ လ","၆ လ"]], zh:["根据本培训，灭火器每隔多久检查一次？",["1个月","3个月","6个月"]], answer:2 },
  { th:["ถ้าต้องทำงานบนที่สูงต้องใช้อุปกรณ์อะไร?",["รองเท้าแตะ","เข็มขัดกันตก","หมวกแก๊ป"]], en:["What equipment is required for work at height?",["Sandals","Fall-protection harness","A cap"]], ja:["高所作業に必要なものは？",["サンダル","墜落制止用器具","帽子"]], my:["အမြင့်တွင်အလုပ်အတွက် ဘာလိုအပ်သလဲ။",["ဖိနပ်ပါး","ပြုတ်ကျကာကွယ်ရေးခါးပတ်","ဦးထုပ်"]], zh:["高处作业需要使用什么？",["拖鞋","防坠落安全带","帽子"]], answer:1 },
  { th:["การเดินในพื้นที่การผลิตควรใส่อะไร?",["รองเท้าเซฟตี้","รองเท้าแตะ","รองเท้าผ้าใบ"]], en:["What footwear is required in the production area?",["Safety shoes","Sandals","Training shoes"]], ja:["生産エリアで必要な履物は？",["安全靴","サンダル","運動靴"]], my:["ထုတ်လုပ်ရေးဧရိယာတွင် ဘာဖိနပ်ဝတ်ရမလဲ။",["Safety ဖိနပ်","ဖိနပ်ပါး","အားကစားဖိနပ်"]], zh:["进入生产区域应穿什么鞋？",["安全鞋","拖鞋","运动鞋"]], answer:0 },
  { th:["ถ้าต้องขนของหนักควรทำอย่างไร?",["ใช้รถเข็น","ยกเอง","ลากไปกับพื้น"]], en:["How should heavy materials be transported?",["Use a trolley","Carry them alone","Drag them on the floor"]], ja:["重い荷物を運ぶ方法は？",["台車を使う","一人で持つ","床を引きずる"]], my:["လေးလံပစ္စည်းကို မည်သို့သယ်ရမလဲ။",["တွန်းလှည်းသုံးမည်","တစ်ယောက်တည်းမမည်","မြေပေါ်ဆွဲမည်"]], zh:["搬运重物时应该怎么做？",["使用手推车","独自搬运","在地面拖行"]], answer:0 },
  { th:["ถ้าพบไฟไหม้ควรทำอย่างไร?",["วิ่งหนี","แจ้ง 102/127/129","ถ่ายคลิป"]], en:["What should you do if you find a fire?",["Run away","Call extensions 102 / 127 / 129","Record a video"]], ja:["火災を発見したら？",["逃げる","内線102/127/129へ連絡","動画を撮る"]], my:["မီးလောင်မှုတွေ့လျှင်။",["ထွက်ပြေးမည်","102/127/129 ကိုအကြောင်းကြားမည်","ဗီဒီယိုရိုက်မည်"]], zh:["发现火灾时应该怎么做？",["立即逃跑","拨打分机102/127/129","拍摄视频"]], answer:1 },
  { th:["ถ้าต้องทำงานเสียงดังควรใส่อะไร?",["ที่อุดหู","หมวกแก๊ป","ไม่มีอะไร"]], en:["What should be worn in a noisy work area?",["Hearing protection","A cap","Nothing"]], ja:["騒音作業で着用するものは？",["耳栓","帽子","何もなし"]], my:["ဆူညံသံများသောအလုပ်တွင် ဘာဝတ်ရမလဲ။",["နားပိတ်","ဦးထုပ်","ဘာမှမဝတ်"]], zh:["在高噪声区域工作应佩戴什么？",["听力防护用品","帽子","不需要"]], answer:0 },
  { th:["ถ้าต้องทำงานกับสารเคมีควรใส่อะไร?",["แว่น + ถุงมือ","รองเท้าแตะ","ไม่มีอะไร"]], en:["What should be worn when working with chemicals?",["Safety glasses and gloves","Sandals","Nothing"]], ja:["化学物質を扱うときの保護具は？",["保護メガネと手袋","サンダル","何もなし"]], my:["ဓာတုပစ္စည်းနှင့်အလုပ်တွင် ဘာဝတ်ရမလဲ။",["မျက်မှန်နှင့်လက်အိတ်","ဖိနပ်ပါး","ဘာမှမဝတ်"]], zh:["接触化学品时应佩戴什么？",["护目镜和手套","拖鞋","不需要"]], answer:0 },
  { th:["ถ้าพบคนหมดสติควรทำอย่างไร?",["เขย่าตัวแรง ๆ","แจ้ง Safety","ปล่อยไว้"]], en:["What should you do if a person is unconscious?",["Shake the person strongly","Notify Safety","Leave the person"]], ja:["意識のない人を発見したら？",["強く揺さぶる","Safetyへ連絡","放置する"]], my:["သတိလစ်သူတွေ့လျှင်။",["ပြင်းပြင်းလှုပ်မည်","Safety ကိုအကြောင်းကြားမည်","ထားခဲ့မည်"]], zh:["发现有人失去意识时应该怎么做？",["用力摇晃","通知Safety","不处理"]], answer:1 },
  { th:["ถ้าต้องใช้เครื่องมือไฟฟ้าควรทำอะไร?",["ตรวจสายไฟก่อนใช้","ใช้ทันที","ใช้ตอนเปียกน้ำ"]], en:["What should be done before using an electrical tool?",["Inspect the cable","Use it immediately","Use it while wet"]], ja:["電動工具使用前にすることは？",["電線を点検","すぐ使用","濡れた状態で使用"]], my:["လျှပ်စစ်ကိရိယာအသုံးမပြုမီ။",["ကြိုးကိုစစ်မည်","ချက်ချင်းသုံးမည်","စိုနေချိန်သုံးမည်"]], zh:["使用电动工具前应该做什么？",["检查电线","立即使用","在潮湿环境中使用"]], answer:0 },
  { th:["ถ้าต้องเดินในพื้นที่มืดควรทำอย่างไร?",["ใช้ไฟฉาย","เดินไปเลย","วิ่ง"]], en:["What should you do in a dark area?",["Use a flashlight","Keep walking without light","Run"]], ja:["暗い場所ではどうしますか？",["懐中電灯を使う","そのまま歩く","走る"]], my:["မှောင်သောနေရာတွင်။",["ဓာတ်မီးသုံးမည်","ဒီအတိုင်းလျှောက်မည်","ပြေးမည်"]], zh:["在黑暗区域应该怎么做？",["使用手电筒","直接行走","奔跑"]], answer:0 },
  { th:["ถ้าต้องทำงานใกล้รถยกควรทำอย่างไร?",["เดินตัดหน้า","รักษาระยะห่าง","ยืนข้างรถ"]], en:["What should you do near a forklift?",["Walk in front of it","Keep a safe distance","Stand beside it"]], ja:["フォークリフト付近で作業するときは？",["前を横切る","安全距離を保つ","車両の横に立つ"]], my:["ဖော့ကလစ်အနီးအလုပ်လုပ်ရာတွင်။",["ရှေ့မှဖြတ်မည်","လုံခြုံသောအကွာအဝေးထားမည်","ကားဘေးရပ်မည်"]], zh:["在叉车附近工作时应该怎么做？",["从车前穿过","保持安全距离","站在车辆旁边"]], answer:1 },
  { th:["ถ้าต้องทำงานอากาศร้อนควรทำอย่างไร?",["พักเป็นระยะ","ทำต่อจนเสร็จ","ไม่ต้องพัก"]], en:["What should you do when working in hot conditions?",["Take regular breaks","Continue until finished","Do not take breaks"]], ja:["暑い環境で作業するときは？",["定期的に休憩","終わるまで続ける","休憩しない"]], my:["ပူသောနေရာတွင်အလုပ်လုပ်ရာတွင်။",["ပုံမှန်အနားယူမည်","ပြီးသည်အထိဆက်လုပ်မည်","မနားမည်"]], zh:["在高温环境工作时应该怎么做？",["定时休息","一直工作到完成","无需休息"]], answer:0 },
  { th:["ถ้าพบสิ่งผิดปกติควรทำอย่างไร?",["แจ้ง Safety","ปล่อยไว้","ถ่ายรูปลงโซเชียล"]], en:["What should you do if you notice an abnormal condition?",["Notify Safety","Ignore it","Post a photo on social media"]], ja:["異常を発見したら？",["Safetyへ連絡","放置する","SNSへ投稿"]], my:["မမှန်ကန်သောအခြေအနေတွေ့လျှင်။",["Safety ကိုအကြောင်းကြားမည်","ထားခဲ့မည်","လူမှုကွန်ရက်တင်မည်"]], zh:["发现异常情况时应该怎么做？",["通知Safety","不处理","发布到社交媒体"]], answer:0 }
];

function qText(question, lang) {
  const key = question[lang] ? lang : "th";
  return question[key][0];
}
function qChoices(question, lang) {
  const key = question[lang] ? lang : "th";
  return question[key][1];
}

function languageSelectFlex() {
  const languages = [
    ["🇹🇭", "ภาษาไทย", "Thai", "th", THEME.blue],
    ["🇬🇧", "English", "English", "en", THEME.purple],
    ["🇯🇵", "日本語", "Japanese", "ja", THEME.red],
    ["🇲🇲", "မြန်မာဘာသာ", "Myanmar", "my", THEME.green],
    ["🇨🇳", "简体中文", "Chinese", "zh", THEME.orange]
  ];
  return {
    type: "flex",
    altText: "เลือกภาษา / Select Language",
    contents: {
      type: "bubble", size: "mega",
      styles: { body: { backgroundColor: THEME.canvas } },
      header: titleBlock("🌐", "5 LANGUAGES", "选择语言 / Select Language", "ไทย • English • 日本語 • မြန်မာ • 中文", THEME.navy),
      body: {
        type: "box", layout: "vertical", paddingAll: "18px", spacing: "sm",
        contents: languages.map(([icon,title,subtitle,key,color]) => actionCard(
          icon, title, subtitle,
          { type: "postback", label: title.slice(0,20), data: `language=${key}`, displayText: title },
          color
        ))
      }
    }
  };
}

function pdpaFlex(state) {
  const lang = getLanguage(state);
  const copy = {
    th: {
      title: "นโยบาย PDPA",
      subtitle: "การคุ้มครองข้อมูลส่วนบุคคล",
      text: "บริษัทเก็บข้อมูลเพื่อยืนยันตัวตน ออกบัตร บันทึกผลอบรม และสนับสนุนระบบความปลอดภัย",
      button: "อ่านนโยบายฉบับเต็ม"
    },
    en: {
      title: "Privacy Notice",
      subtitle: "Personal Data Protection",
      text: "The company collects personal data for identity verification, contractor cards, training records, and safety operations.",
      button: "Read Full Policy"
    },
    ja: {
      title: "個人情報保護方針",
      subtitle: "Personal Data Protection",
      text: "会社は、本人確認、請負業者カード発行、研修記録、安全管理のために個人情報を収集します。",
      button: "方針全文を読む"
    },
    my: {
      title: "ကိုယ်ရေးအချက်အလက်မူဝါဒ",
      subtitle: "Personal Data Protection",
      text: "ကုမ္ပဏီသည် အထောက်အထားစစ်ဆေးခြင်း၊ ကန်ထရိုက်တာကတ်ထုတ်ပေးခြင်း၊ သင်တန်းမှတ်တမ်းနှင့် လုံခြုံရေးလုပ်ငန်းများအတွက် ကိုယ်ရေးအချက်အလက်များကို စုဆောင်းပါသည်။",
      button: "မူဝါဒအပြည့်အစုံဖတ်မည်"
    },
    zh: {
      title: "个人信息保护政策",
      subtitle: "Personal Data Protection",
      text: "公司收集个人信息，用于身份验证、承包商卡签发、培训记录和安全管理。",
      button: "阅读完整政策"
    }
  }[lang];
  return {
    type: "flex", altText: copy.title,
    contents: { type: "bubble", size: "mega", styles: { body: { backgroundColor: THEME.canvas } },
      header: titleBlock("🛡️", "PRIVACY NOTICE", copy.title, copy.subtitle, THEME.navy),
      body: { type: "box", layout: "vertical", paddingAll: "20px", spacing: "lg", contents: [
        { type: "text", text: copy.text, wrap: true, color: THEME.ink, size: "sm" },
        { type: "button", style: "primary", color: THEME.blue, action: { type: "uri", label: copy.button.slice(0,20), uri: "https://www.sodick.co.th/Privacy%20Policy/AN-2022-0103-Announcement%20Personal%20Data%20Policy%20(THA).pdf" } }
      ]}
    }
  };
}

function jobPositionFlex(state) {
  const lang = state.language;
  const jobs = [["👔","Owner"],["🧭","Supervisor"],["📐","Engineer"],["📋","Foreman"],["🔧","Technician"],["👷","GeneralWorker"]];
  return { type: "flex", altText: tr(state,"chooseJob"), contents: { type: "bubble", size: "mega", styles: { body: { backgroundColor: THEME.canvas } },
    header: titleBlock("💼", "STEP 1", tr(state,"chooseJob"), tr(state,"chooseJobSub"), THEME.blue),
    body: { type: "box", layout: "vertical", paddingAll: "18px", spacing: "sm", contents: jobs.map(([icon,key]) => actionCard(icon, JOB_LABELS[key][lang], tr(state,"tapSelect"), { type:"postback", label: JOB_LABELS[key][lang].slice(0,20), data:`job=${key}`, displayText:JOB_LABELS[key][lang] }, THEME.blue)) }
  }};
}

const formQuestions = [
  { key:"fullname", titleKey:"fullname", promptKey:"fullNamePrompt", icon:"👤" },
  { key:"phone", titleKey:"phone", promptKey:"phonePrompt", icon:"📱" },
  { key:"idcard", titleKey:"identity", promptKey:"identityPrompt", icon:"🪪" },
  { key:"company", titleKey:"company", promptKey:"companyPrompt", icon:"🏢" }
];
function formQuestionFlex(state) {
  const item = formQuestions[state.step];
  return { type:"flex", altText:tr(state,item.titleKey), contents:{ type:"bubble", size:"mega", styles:{body:{backgroundColor:THEME.canvas}},
    header:titleBlock(item.icon,`STEP ${state.step+1} OF ${formQuestions.length}`,tr(state,item.titleKey),tr(state,"typeAnswer"),THEME.blue),
    body:{type:"box",layout:"vertical",paddingAll:"20px",spacing:"lg",contents:[
      {type:"text",text:tr(state,item.promptKey),wrap:true,size:"sm",color:THEME.ink},
      {type:"box",layout:"vertical",paddingAll:"14px",cornerRadius:"14px",backgroundColor:THEME.sky,contents:[{type:"text",text:`⌨️ ${tr(state,"typeAnswer")}`,size:"xs",weight:"bold",color:THEME.blue,align:"center",wrap:true}]}
    ]}
  }};
}

function reviewFlex(state) {
  const lang = state.language;
  const position = JOB_LABELS[state.formData.position]?.[lang] || state.formData.position;
  return { type:"flex", altText:tr(state,"review"), contents:{type:"bubble",size:"mega",styles:{body:{backgroundColor:THEME.canvas},footer:{backgroundColor:THEME.canvas}},
    header:titleBlock("✅","REVIEW",tr(state,"review"),tr(state,"reviewSub"),THEME.green),
    body:{type:"box",layout:"vertical",paddingAll:"18px",spacing:"xs",contents:[
      dataRow(tr(state,"fullname"),state.formData.fullname), dataRow(tr(state,"position"),position), dataRow(tr(state,"phone"),state.formData.phone), dataRow(tr(state,"identity"),state.formData.idcard), dataRow(tr(state,"company"),state.formData.company),
      {type:"box",layout:"vertical",paddingAll:"13px",margin:"md",cornerRadius:"13px",backgroundColor:"#FFF7DE",contents:[{type:"text",text:tr(state,"examInfo"),size:"xs",weight:"bold",color:"#805A09",align:"center",wrap:true}]}
    ]},
    footer:{type:"box",layout:"vertical",paddingAll:"18px",spacing:"sm",contents:[
      {type:"button",style:"link",color:THEME.blue,action:{type:"postback",label:"ℹ️ Details",data:"detail=exam",displayText:"Exam details"}},
      {type:"button",style:"primary",color:THEME.green,action:{type:"postback",label:tr(state,"confirmStart").slice(0,20),data:"review=confirm",displayText:tr(state,"confirmStart")}},
      {type:"button",style:"secondary",action:{type:"postback",label:tr(state,"restartForm").slice(0,20),data:"review=restart",displayText:tr(state,"restartForm")}}
    ]}
  }};
}

function examFlex(questionObj, number, state) {
  const lang = state.language; const total=examQuestions.length; const progress=Math.round(number/total*100); const remaining=total-number;
  const letters=["A","B","C","D"]; const choices=qChoices(questionObj,lang);
  return {type:"flex",altText:`${tr(state,"question")} ${number} ${tr(state,"of")} ${total}`,contents:{type:"bubble",size:"mega",styles:{body:{backgroundColor:THEME.canvas}},
    header:titleBlock("📝",`SAFETY QUIZ • ${progress}%`,`${tr(state,"question")} ${number} ${tr(state,"of")} ${total}`,`${remaining} ${tr(state,"remaining")}`,THEME.navy),
    body:{type:"box",layout:"vertical",paddingAll:"20px",spacing:"lg",contents:[
      {type:"box",layout:"vertical",paddingAll:"16px",cornerRadius:"16px",backgroundColor:THEME.white,borderColor:THEME.line,borderWidth:"1px",contents:[{type:"text",text:qText(questionObj,lang),wrap:true,size:"md",weight:"bold",color:THEME.ink,maxLines:5}]},
      {type:"box",layout:"vertical",height:"8px",cornerRadius:"4px",backgroundColor:"#DDE8F0",contents:[{type:"box",layout:"vertical",width:`${progress}%`,height:"8px",cornerRadius:"4px",backgroundColor:THEME.gold,contents:[]}]},
      {type:"text",text:`${tr(state,"progress")} ${progress}% • ${tr(state,"selectOne")}`,size:"xxs",color:THEME.muted,align:"center",wrap:true},
      ...choices.map((choice,index)=>actionCard(letters[index],choice,`${tr(state,"question")} ${number}`,{type:"postback",label:safeText(choice,20),data:`answer_${index}`,displayText:safeText(choice,300)},index===0?THEME.blue:index===1?THEME.purple:THEME.orange))
    ]}
  }};
}

function resultFlex(score,total,pass,state) {
  const percent=Math.round(score/total*100); const color=pass?THEME.green:THEME.red; const soft=pass?THEME.greenSoft:THEME.redSoft; const missing=Math.max(0,PASS_SCORE-score);
  const body=[
    {type:"text",text:`${score}/${total}`,size:"3xl",weight:"bold",color,align:"center"},
    {type:"text",text:`${tr(state,"percentage")}: ${percent}%`,size:"md",weight:"bold",color:THEME.ink,align:"center"},
    {type:"text",text:`${tr(state,"passScore")}: ${PASS_SCORE}/${total}`,size:"sm",color:THEME.muted,align:"center"}
  ];
  if(!pass) body.push({type:"text",text:`${tr(state,"missing")} ${missing} ${tr(state,"points")}`,size:"sm",weight:"bold",color:THEME.red,align:"center"});
  return {type:"flex",altText:pass?tr(state,"passed"):tr(state,"failed"),contents:{type:"bubble",size:"mega",styles:{body:{backgroundColor:soft},footer:{backgroundColor:soft}},
    header:titleBlock(pass?"✅":"↻","EXAM RESULT",pass?tr(state,"passed"):tr(state,"failed"),pass?tr(state,"passedSub"):tr(state,"failedSub"),color),
    body:{type:"box",layout:"vertical",paddingAll:"22px",spacing:"lg",alignItems:"center",contents:body},
    footer:{type:"box",layout:"vertical",paddingAll:"18px",spacing:"sm",contents:pass?
      [{type:"button",style:"primary",color:THEME.green,action:{type:"message",label:tr(state,"downloadCard").slice(0,20),text:"ดาวน์โหลดบัตร"}}]:
      [{type:"button",style:"primary",color:THEME.blue,action:{type:"message",label:tr(state,"reviewTraining").slice(0,20),text:"สื่ออบรมผู้รับเหมา"}},{type:"button",style:"primary",color:THEME.red,action:{type:"message",label:tr(state,"retake").slice(0,20),text:"ทำแบบทดสอบ"}}]
    }
  }};
}

const GLOBAL_UI = {
  th: {
    changeLanguage: "เปลี่ยนภาษา", mainTitle: "ระบบบริการผู้รับเหมา", mainSub: "เลือกบริการที่ต้องการ",
    delivery: "ผู้รับ–ส่งสินค้า", deliverySub: "บริการสำหรับผู้มาติดต่อส่งสินค้า", vendor: "ผู้เข้ามาทำงาน–แก้ไขงาน", vendorSub: "ผู้รับเหมาและผู้ขาย",
    training: "สื่ออบรมผู้รับเหมา", trainingSub: "วิดีโอและเอกสารด้านความปลอดภัย", card: "ขอบัตรผู้รับเหมาย้อนหลัง", cardSub: "เปิดและดาวน์โหลดบัตร",
    video: "วิดีโออบรม", exam: "ทำแบบทดสอบ", record: "เอกสารบันทึกการอบรม", workRequest: "ใบขอเข้ามาทำงาน", toolForm: "ใบตรวจสอบเครื่องมือ",
    safetyGeneral: "ความปลอดภัยในการทำงาน", welding: "ความปลอดภัยงานเชื่อม", fireExt: "การใช้ถังดับเพลิง", driving: "ขับขี่ปลอดภัย", waste: "การแยกขยะ",
    contact: "ติดต่อทีม Safety", contactSub: "ติดต่อและขอความช่วยเหลือ", hotline: "Safety Hotline", hotlineSub: "แตะเพื่อโทรหาเจ้าหน้าที่", report: "แจ้งปัญหา", reportSub: "ส่งเรื่องถึงทีม Safety",
    issueTitle: "แจ้งปัญหา", issueHint: "กรุณาพิมพ์รายละเอียดปัญหา / ชื่อ / บริษัท / เบอร์ติดต่อกลับ", issuePrivacy: "ข้อความทั่วไปและคำตอบข้อสอบจะไม่ถูกส่งหา ADMIN", cancel: "ยกเลิกการแจ้ง",
    issueSent: "รับแจ้งเรียบร้อยแล้ว", issueSentSub: "ส่งรายละเอียดให้ทีม Safety แล้ว", helpTitle: "ยังไม่พบคำตอบ", helpSub: "เลือกเมนูที่ต้องการด้านล่าง",
    map: "แผนที่โรงงาน", mapSub: "เลือกโรงงานเพื่อเปิดเส้นทาง", factory1: "โรงงาน 1", factory2: "โรงงาน 2", phone: "เบอร์โทรโรงงาน", phoneSub: "แตะเพื่อโทรออก",
    selectLanguage: "เลือกภาษาของระบบ", selectLanguageSub: "ใช้กับเมนู แผนที่ ติดต่อ และแบบทดสอบ", savedLanguage: "บันทึกภาษาแล้ว"
  },
  en: {
    changeLanguage: "Change Language", mainTitle: "Contractor Services", mainSub: "Select the service you need",
    delivery: "Delivery Visitor", deliverySub: "Services for delivery visitors", vendor: "Contractor / Vendor", vendorSub: "Work and maintenance access",
    training: "Contractor Training", trainingSub: "Safety videos and documents", card: "Previous Contractor Card", cardSub: "Open and download your card",
    video: "Training Video", exam: "Start Safety Exam", record: "Training Record", workRequest: "Work Entry Request", toolForm: "Tool Inspection Form",
    safetyGeneral: "General Workplace Safety", welding: "Welding Safety", fireExt: "Fire Extinguisher", driving: "Safe Driving", waste: "Waste Segregation",
    contact: "Contact Safety Team", contactSub: "Contact and support", hotline: "Safety Hotline", hotlineSub: "Tap to call an officer", report: "Report an Issue", reportSub: "Send an issue to the Safety team",
    issueTitle: "Report an Issue", issueHint: "Type the issue details / name / company / callback number", issuePrivacy: "General messages and exam answers are not sent to ADMIN.", cancel: "Cancel Report",
    issueSent: "Report Received", issueSentSub: "The details were sent to the Safety team.", helpTitle: "Answer Not Found", helpSub: "Select an option below",
    map: "Factory Map", mapSub: "Select a factory to open directions", factory1: "Factory 1", factory2: "Factory 2", phone: "Factory Phone", phoneSub: "Tap to call",
    selectLanguage: "Select System Language", selectLanguageSub: "Used for menus, maps, contacts, and exams", savedLanguage: "Language saved"
  },
  ja: {
    changeLanguage: "言語を変更", mainTitle: "請負業者サービス", mainSub: "必要なサービスを選択してください",
    delivery: "配送訪問者", deliverySub: "納品・配送の訪問者向け", vendor: "請負業者・ベンダー", vendorSub: "作業・修理の入場サービス",
    training: "請負業者向け研修", trainingSub: "安全動画と書類", card: "過去の請負業者カード", cardSub: "カードを開いてダウンロード",
    video: "研修ビデオ", exam: "安全試験を開始", record: "研修記録書", workRequest: "作業入場申請書", toolForm: "工具点検表",
    safetyGeneral: "一般作業安全", welding: "溶接作業安全", fireExt: "消火器の使用", driving: "安全運転", waste: "廃棄物分別",
    contact: "Safetyチームへ連絡", contactSub: "連絡とサポート", hotline: "Safetyホットライン", hotlineSub: "タップして電話", report: "問題を報告", reportSub: "Safetyチームへ送信",
    issueTitle: "問題を報告", issueHint: "問題の詳細 / 氏名 / 会社名 / 電話番号を入力してください", issuePrivacy: "一般メッセージと試験回答はADMINへ送信されません。", cancel: "報告を中止",
    issueSent: "報告を受け付けました", issueSentSub: "Safetyチームへ詳細を送信しました。", helpTitle: "回答が見つかりません", helpSub: "下のメニューを選択してください",
    map: "工場マップ", mapSub: "ルートを表示する工場を選択", factory1: "第1工場", factory2: "第2工場", phone: "工場電話番号", phoneSub: "タップして電話",
    selectLanguage: "システム言語を選択", selectLanguageSub: "メニュー、地図、連絡先、試験に使用", savedLanguage: "言語を保存しました"
  },
  my: {
    changeLanguage: "ဘာသာစကားပြောင်းမည်", mainTitle: "ကန်ထရိုက်တာဝန်ဆောင်မှု", mainSub: "လိုအပ်သောဝန်ဆောင်မှုကိုရွေးပါ",
    delivery: "ကုန်ပစ္စည်းပို့ဆောင်သူ", deliverySub: "ကုန်ပစ္စည်းပို့ဆောင်သူများအတွက်", vendor: "ကန်ထရိုက်တာ / Vendor", vendorSub: "အလုပ်နှင့်ပြုပြင်ရေးဝင်ခွင့်",
    training: "ကန်ထရိုက်တာသင်တန်း", trainingSub: "လုံခြုံရေးဗီဒီယိုနှင့်စာရွက်စာတမ်း", card: "ယခင်ကန်ထရိုက်တာကတ်", cardSub: "ကတ်ကိုဖွင့်ပြီးဒေါင်းလုပ်လုပ်ပါ",
    video: "သင်တန်းဗီဒီယို", exam: "လုံခြုံရေးစာမေးပွဲစမည်", record: "သင်တန်းမှတ်တမ်း", workRequest: "အလုပ်ဝင်ခွင့်တောင်းခံလွှာ", toolForm: "ကိရိယာစစ်ဆေးပုံစံ",
    safetyGeneral: "အထွေထွေလုပ်ငန်းလုံခြုံရေး", welding: "ဂဟေဆော်လုံခြုံရေး", fireExt: "မီးသတ်ဘူးအသုံးပြုခြင်း", driving: "လုံခြုံစွာမောင်းနှင်ခြင်း", waste: "အမှိုက်ခွဲခြားခြင်း",
    contact: "Safety အဖွဲ့ကိုဆက်သွယ်မည်", contactSub: "ဆက်သွယ်ရန်နှင့်အကူအညီ", hotline: "Safety Hotline", hotlineSub: "ဖုန်းခေါ်ရန်နှိပ်ပါ", report: "ပြဿနာတင်ပြမည်", reportSub: "Safety အဖွဲ့သို့ပို့မည်",
    issueTitle: "ပြဿနာတင်ပြမည်", issueHint: "ပြဿနာအသေးစိတ် / အမည် / ကုမ္ပဏီ / ဖုန်းနံပါတ်ကို ရိုက်ပါ", issuePrivacy: "သာမန်စာများနှင့်စာမေးပွဲအဖြေများကို ADMIN သို့မပို့ပါ။", cancel: "တင်ပြမှုဖျက်မည်",
    issueSent: "တင်ပြမှုလက်ခံပြီး", issueSentSub: "အသေးစိတ်ကို Safety အဖွဲ့ထံပို့ပြီးပါပြီ။", helpTitle: "အဖြေမတွေ့ပါ", helpSub: "အောက်ပါမီနူးမှရွေးပါ",
    map: "စက်ရုံမြေပုံ", mapSub: "လမ်းညွှန်ဖွင့်ရန်စက်ရုံရွေးပါ", factory1: "စက်ရုံ ၁", factory2: "စက်ရုံ ၂", phone: "စက်ရုံဖုန်း", phoneSub: "ဖုန်းခေါ်ရန်နှိပ်ပါ",
    selectLanguage: "စနစ်ဘာသာစကားရွေးပါ", selectLanguageSub: "မီနူး၊ မြေပုံ၊ ဆက်သွယ်ရန်နှင့်စာမေးပွဲအတွက်", savedLanguage: "ဘာသာစကားသိမ်းပြီးပါပြီ"
  }  ,zh: {
    changeLanguage: "切换语言", mainTitle: "承包商服务", mainSub: "请选择所需服务",
    delivery: "送货访客", deliverySub: "送货人员服务", vendor: "承包商 / 供应商", vendorSub: "工作和维修入场服务",
    training: "承包商培训", trainingSub: "安全视频和文件", card: "历史承包商卡", cardSub: "打开并下载承包商卡",
    video: "培训视频", exam: "开始安全考试", record: "培训记录", workRequest: "工作入场申请", toolForm: "工具检查表",
    safetyGeneral: "一般工作安全", welding: "焊接安全", fireExt: "灭火器使用", driving: "安全驾驶", waste: "垃圾分类",
    contact: "联系Safety团队", contactSub: "联系与支持", hotline: "Safety热线", hotlineSub: "点击联系工作人员", report: "报告问题", reportSub: "发送给Safety团队",
    issueTitle: "报告问题", issueHint: "请输入问题详情 / 姓名 / 公司 / 联系电话", issuePrivacy: "普通消息和考试答案不会发送给ADMIN。", cancel: "取消报告",
    issueSent: "报告已收到", issueSentSub: "详细信息已发送给Safety团队。", helpTitle: "未找到答案", helpSub: "请选择下方菜单",
    map: "工厂地图", mapSub: "请选择工厂以打开路线", factory1: "第一工厂", factory2: "第二工厂", phone: "工厂电话", phoneSub: "点击拨打电话",
    selectLanguage: "选择系统语言", selectLanguageSub: "用于菜单、地图、联系和考试", savedLanguage: "语言已保存"
  }

};

const RUNTIME_TEXT = {
  th:{noCard:"ยังไม่พบบัตรของคุณ กรุณารอระบบสร้างบัตรหรือติดต่อทีม Safety",cancelIssue:"ยกเลิกการแจ้งปัญหาเรียบร้อยแล้ว",issueMin:"กรุณาพิมพ์รายละเอียดปัญหาอย่างน้อย 10 ตัวอักษร",issueFail:"ไม่สามารถส่งข้อมูลได้ กรุณาติดต่อทีม Safety ทางโทรศัพท์"},
  en:{noCard:"Your card was not found. Please wait or contact Safety.",cancelIssue:"The issue report has been cancelled.",issueMin:"Please enter at least 10 characters.",issueFail:"Unable to send the report. Please contact Safety by phone."},
  ja:{noCard:"カードが見つかりません。Safetyへ連絡してください。",cancelIssue:"問題報告をキャンセルしました。",issueMin:"問題の詳細を10文字以上入力してください。",issueFail:"報告を送信できません。電話でSafetyへ連絡してください。"},
  my:{noCard:"ကတ်မတွေ့သေးပါ။ Safety ကိုဆက်သွယ်ပါ။",cancelIssue:"ပြဿနာတင်ပြမှုကို ဖျက်ပြီးပါပြီ။",issueMin:"အသေးစိတ်ကို အနည်းဆုံး စာလုံး ၁၀ လုံး ရိုက်ပါ။",issueFail:"တင်ပြမှုမပို့နိုင်ပါ။ Safety ကိုဖုန်းဖြင့်ဆက်သွယ်ပါ။"},
  zh:{noCard:"未找到您的承包商卡，请等待系统生成或联系Safety。",cancelIssue:"问题报告已取消。",issueMin:"请输入至少10个字符的问题详情。",issueFail:"无法发送报告，请通过电话联系Safety。"}
};
function runtimeText(userId,key){const lang=getUserLanguage(userId);return RUNTIME_TEXT[lang]?.[key]||RUNTIME_TEXT.th[key];}

function languageFooter(lang) {
  return {
    type: "box", layout: "vertical", paddingAll: "14px", backgroundColor: THEME.canvas,
    contents: [{ type: "button", style: "secondary", action: { type: "postback", label: `🌐 ${uiText(lang,"changeLanguage")}`.slice(0,20), data: "pref_language=select", displayText: uiText(lang,"changeLanguage") } }]
  };
}

function globalLanguageSelectFlex(lang="th") {
  return { type:"flex", altText:uiText(lang,"selectLanguage"), contents:{ type:"bubble", size:"mega", styles:{body:{backgroundColor:THEME.canvas}},
    header:titleBlock("🌐","GLOBAL LANGUAGE",uiText(lang,"selectLanguage"),uiText(lang,"selectLanguageSub"),THEME.navy),
    body:{type:"box",layout:"vertical",paddingAll:"18px",spacing:"sm",contents:[
      actionCard("🇹🇭","ภาษาไทย","Thai",{type:"postback",label:"ภาษาไทย",data:"pref_language=th",displayText:"ภาษาไทย"},THEME.blue),
      actionCard("🇬🇧","English","English",{type:"postback",label:"English",data:"pref_language=en",displayText:"English"},THEME.purple),
      actionCard("🇯🇵","日本語","Japanese",{type:"postback",label:"日本語",data:"pref_language=ja",displayText:"日本語"},THEME.red),
      actionCard("🇲🇲","မြန်မာဘာသာ","Myanmar",{type:"postback",label:"မြန်မာဘာသာ",data:"pref_language=my",displayText:"မြန်မာဘာသာ"},THEME.green),
      actionCard("🇨🇳","简体中文","Chinese",{type:"postback",label:"简体中文",data:"pref_language=zh",displayText:"简体中文"},THEME.orange)
    ]}
  }};
}

function menuFlex(title,subtitle,icon,items,color=THEME.navy,lang="th",showLanguage=true){return{type:"flex",altText:title,contents:{type:"bubble",size:"mega",styles:{body:{backgroundColor:THEME.canvas},footer:{backgroundColor:THEME.canvas}},header:titleBlock(icon,"SODICK SAFETY",title,subtitle,color),body:{type:"box",layout:"vertical",paddingAll:"18px",spacing:"sm",contents:items.map(i=>actionCard(i.icon,i.title,i.subtitle,i.type==="uri"?{type:"uri",label:i.title.slice(0,20),uri:i.value}:{type:"message",label:i.title.slice(0,20),text:i.value},i.color||THEME.blue))},footer:showLanguage?languageFooter(lang):undefined}};}
function menuDelivery(lang="th"){return menuFlex(uiText(lang,"delivery"),uiText(lang,"deliverySub"),"📦",[
  {icon:"▶️",title:uiText(lang,"video"),subtitle:"Safety training video",type:"uri",value:"https://drive.google.com/file/d/1bz2qUynfvSFNuS3FoM1iGcLIn3Z8m0fb/view?usp=sharing",color:THEME.red},
  {icon:"📝",title:uiText(lang,"exam"),subtitle:"Safety exam",type:"message",value:"ทำแบบทดสอบ",color:THEME.blue},
  {icon:"📄",title:uiText(lang,"record"),subtitle:"Training record",type:"uri",value:"https://drive.google.com/file/d/1QWnOr9Cmkdbsmp0byIlocZmmVIjcPqWe/view?usp=drive_link",color:THEME.green}],THEME.blue,lang);}
function menuVendor(lang="th"){return menuFlex(uiText(lang,"vendor"),uiText(lang,"vendorSub"),"🛠️",[
  {icon:"▶️",title:uiText(lang,"video"),subtitle:"Safety training video",type:"uri",value:"https://drive.google.com/file/d/1bz2qUynfvSFNuS3FoM1iGcLIn3Z8m0fb/view?usp=sharing",color:THEME.red},
  {icon:"📝",title:uiText(lang,"exam"),subtitle:"Safety exam",type:"message",value:"ทำแบบทดสอบ",color:THEME.blue},
  {icon:"📄",title:uiText(lang,"record"),subtitle:"Training record",type:"uri",value:"https://drive.google.com/file/d/1QWnOr9Cmkdbsmp0byIlocZmmVIjcPqWe/view?usp=drive_link",color:THEME.green},
  {icon:"📋",title:uiText(lang,"workRequest"),subtitle:"Work entry request",type:"uri",value:"https://drive.google.com/file/d/1m9zT6FEHTFs_GdXIcKrr3WCngONKn4OV/view?usp=drive_link",color:THEME.orange},
  {icon:"🔧",title:uiText(lang,"toolForm"),subtitle:"Tool inspection",type:"uri",value:"https://drive.google.com/file/d/1HJxEXai6--EduOXJTDGtvl0-Sfu5_k7c/view?usp=drive_link",color:THEME.purple}],THEME.purple,lang);}
function trainingMenu(lang="th"){return menuFlex(uiText(lang,"training"),uiText(lang,"trainingSub"),"🎓",[
  {icon:"01",title:uiText(lang,"safetyGeneral"),subtitle:"General workplace safety",type:"uri",value:"https://youtu.be/MGbZGFtQCLQ?si=S7Xg3pxeOqkQCyx5",color:THEME.blue},
  {icon:"02",title:uiText(lang,"welding"),subtitle:"Welding safety",type:"uri",value:"https://youtu.be/gpUlIKyjSQM?si=QctBbVhlth2bbmDt",color:THEME.purple},
  {icon:"03",title:uiText(lang,"fireExt"),subtitle:"Fire extinguisher",type:"uri",value:"https://youtu.be/54FuqMUGlOQ?si=4-9RT_1fmtGnMg0f",color:THEME.red},
  {icon:"04",title:uiText(lang,"driving"),subtitle:"Safe driving",type:"uri",value:"https://youtu.be/jUPDb2aHWSM?si=x2wPrp2DGoluXvuF",color:THEME.orange},
  {icon:"05",title:uiText(lang,"waste"),subtitle:"Waste segregation",type:"uri",value:"https://youtu.be/5HI55e0oL_M?si=Hg5EdfhXNIaeKlP9",color:THEME.green}],THEME.green,lang);}
function contractorMainMenuFlex(lang="th"){return menuFlex(uiText(lang,"mainTitle"),uiText(lang,"mainSub"),"🦺",[
  {icon:"📦",title:uiText(lang,"delivery"),subtitle:uiText(lang,"deliverySub"),type:"message",value:"ผู้รับส่งสินค้า",color:THEME.blue},
  {icon:"🛠️",title:uiText(lang,"vendor"),subtitle:uiText(lang,"vendorSub"),type:"message",value:"ผู้แก้ไขงาน",color:THEME.purple},
  {icon:"🎓",title:uiText(lang,"training"),subtitle:uiText(lang,"trainingSub"),type:"message",value:"สื่ออบรมผู้รับเหมา",color:THEME.green},
  {icon:"🪪",title:uiText(lang,"card"),subtitle:uiText(lang,"cardSub"),type:"message",value:"ดาวน์โหลดบัตร",color:THEME.orange}],THEME.navy,lang);}
function certificateFlex(url){return allCertificatesFlex([{url}], "th");}

function allCertificatesFlex(cards, lang = "th") {
  const copy = {
    th: { alt: "บัตรผู้รับเหมาทั้งหมด", title: "บัตรผู้รับเหมา", card: "บัตรใบที่", open: "เปิด / ดาวน์โหลด", count: "รายการ" },
    en: { alt: "All Contractor Cards", title: "Contractor Cards", card: "Card", open: "Open / Download", count: "cards" },
    ja: { alt: "請負業者カード一覧", title: "請負業者カード", card: "カード", open: "開く / ダウンロード", count: "件" },
    my: { alt: "ကန်ထရိုက်တာကတ်အားလုံး", title: "ကန်ထရိုက်တာကတ်", card: "ကတ်", open: "ဖွင့် / ဒေါင်းလုပ်", count: "ကတ်" },
    zh: { alt: "全部承包商卡", title: "承包商卡", card: "卡片", open: "打开 / 下载", count: "张" }
  }[lang] || null;
  const text = copy || {
    alt: "All Contractor Cards", title: "Contractor Cards", card: "Card", open: "Open / Download", count: "cards"
  };

  const validCards = (Array.isArray(cards) ? cards : [])
    .map((card, index) => ({
      url: String(card?.url || card?.cardUrl || card?.certificateUrl || card?.link || "").trim(),
      issuedAt: String(card?.issuedAt || card?.createdAt || card?.date || "").trim(),
      title: String(card?.title || card?.name || "").trim(),
      originalIndex: index
    }))
    .filter(card => /^https:\/\//i.test(card.url));

  return {
    type: "flex",
    altText: `${text.alt} (${validCards.length})`,
    contents: {
      type: "carousel",
      contents: validCards.map((card, index) => ({
        type: "bubble",
        size: "kilo",
        styles: {
          body: { backgroundColor: THEME.canvas },
          footer: { backgroundColor: THEME.canvas }
        },
        header: titleBlock(
          "🪪",
          `CARD ${index + 1} OF ${validCards.length}`,
          card.title || `${text.card} ${index + 1}`,
          card.issuedAt || `${validCards.length} ${text.count}`,
          index === 0 ? THEME.green : THEME.blue
        ),
        body: {
          type: "box",
          layout: "vertical",
          paddingAll: "18px",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: card.title || text.title,
              size: "md",
              weight: "bold",
              color: THEME.ink,
              align: "center",
              wrap: true
            },
            card.issuedAt
              ? { type: "text", text: card.issuedAt, size: "xs", color: THEME.muted, align: "center", wrap: true }
              : { type: "text", text: `${text.card} ${index + 1}`, size: "xs", color: THEME.muted, align: "center" }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          paddingAll: "18px",
          contents: [{
            type: "button",
            style: "primary",
            color: index === 0 ? THEME.green : THEME.blue,
            action: {
              type: "uri",
              label: text.open.slice(0, 20),
              uri: card.url
            }
          }]
        }
      }))
    }
  };
}
function contactMenuFlex(lang="th"){return menuFlex(uiText(lang,"contact"),uiText(lang,"contactSub"),"☎️",[{icon:"📞",title:uiText(lang,"hotline"),subtitle:uiText(lang,"hotlineSub"),type:"message",value:"Safety Hotline",color:THEME.blue},{icon:"📣",title:uiText(lang,"report"),subtitle:uiText(lang,"reportSub"),type:"message",value:"แจ้งปัญหา",color:THEME.orange}],THEME.navy,lang);}
function hotlineFlex(lang="th"){return menuFlex(uiText(lang,"hotline"),uiText(lang,"hotlineSub"),"📞",[
  {icon:"☎",title:"Safety Manager",subtitle:"081-376-5583",type:"uri",value:"tel:0813765583",color:THEME.red},{icon:"☎",title:"Safety Factory 1",subtitle:"061-645-5095",type:"uri",value:"tel:0616455095",color:THEME.blue},{icon:"☎",title:"Safety Factory 2",subtitle:"083-237-4357",type:"uri",value:"tel:0832374357",color:THEME.purple},{icon:"☎",title:"Safety Factory 1",subtitle:"081-695-4474",type:"uri",value:"tel:0816954474",color:THEME.green},{icon:"☎",title:"Environment",subtitle:"094-938-0425",type:"uri",value:"tel:0949380425",color:THEME.orange}],THEME.red,lang);}
function issueFormFlex(lang="th"){return{type:"flex",altText:uiText(lang,"issueTitle"),contents:{type:"bubble",size:"mega",styles:{footer:{backgroundColor:THEME.canvas}},header:titleBlock("📣","REPORT AN ISSUE",uiText(lang,"issueTitle"),uiText(lang,"reportSub"),THEME.orange),body:{type:"box",layout:"vertical",paddingAll:"20px",spacing:"lg",contents:[{type:"text",text:uiText(lang,"issueHint"),wrap:true,size:"sm",color:THEME.ink},{type:"text",text:uiText(lang,"issuePrivacy"),wrap:true,size:"xs",color:THEME.muted,align:"center"}]},footer:{type:"box",layout:"vertical",paddingAll:"18px",contents:[{type:"button",style:"secondary",action:{type:"message",label:uiText(lang,"cancel").slice(0,20),text:"ยกเลิกการแจ้งปัญหา"}}]}}};}
function issueAdminFlex(reportText,userId){return{type:"flex",altText:"New Safety Issue",contents:{type:"bubble",size:"mega",header:titleBlock("🔔","NEW ISSUE","แจ้งปัญหาใหม่","สถานะ: รอตรวจสอบ",THEME.red),body:{type:"box",layout:"vertical",paddingAll:"20px",spacing:"lg",contents:[dataRow("รายละเอียด",safeText(reportText,1500)),{type:"text",text:`LINE User ID: ${userId}`,size:"xxs",color:THEME.muted,wrap:true}]}}};}
function issueSuccessFlex(lang="th"){return{type:"flex",altText:uiText(lang,"issueSent"),contents:{type:"bubble",size:"mega",body:{type:"box",layout:"vertical",paddingAll:"24px",spacing:"lg",alignItems:"center",backgroundColor:THEME.greenSoft,contents:[{type:"text",text:"✅",size:"3xl"},{type:"text",text:uiText(lang,"issueSent"),size:"xl",weight:"bold",color:THEME.green,align:"center",wrap:true},{type:"text",text:uiText(lang,"issueSentSub"),size:"sm",color:THEME.ink,align:"center",wrap:true}]}}};}
function fallbackFlex(lang="th"){return menuFlex(uiText(lang,"helpTitle"),uiText(lang,"helpSub"),"💬",[{icon:"🦺",title:uiText(lang,"mainTitle"),subtitle:uiText(lang,"mainSub"),type:"message",value:"เมนูผู้รับเหมา",color:THEME.blue},{icon:"☎️",title:uiText(lang,"contact"),subtitle:uiText(lang,"contactSub"),type:"message",value:"ติดต่อทีมเซฟตี้",color:THEME.green},{icon:"📍",title:uiText(lang,"map"),subtitle:uiText(lang,"mapSub"),type:"message",value:"แผนที่",color:THEME.orange}],THEME.navy,lang);}
function mapFlexFor(lang="th"){return menuFlex(uiText(lang,"map"),uiText(lang,"mapSub"),"📍",[{icon:"1",title:uiText(lang,"factory1"),subtitle:"Google Maps",type:"uri",value:"https://maps.app.goo.gl/ycBgWvYA8ze8L6Hj8",color:THEME.blue},{icon:"2",title:uiText(lang,"factory2"),subtitle:"Google Maps",type:"uri",value:"https://maps.app.goo.gl/keZxD798z9ZwKXE7A",color:THEME.green}],THEME.blue,lang);}
function phoneFlexFor(lang="th"){return menuFlex(uiText(lang,"phone"),uiText(lang,"phoneSub"),"☎️",[{icon:"1",title:uiText(lang,"factory1"),subtitle:"02-529-2450-6 • 102 / 127 / 129",type:"uri",value:"tel:025292450",color:THEME.blue},{icon:"2",title:uiText(lang,"factory2"),subtitle:"02-529-3200-6 • 137",type:"uri",value:"tel:025293200",color:THEME.green}],THEME.green,lang);}


async function handleFormAnswer(event,userId,text){
  const state=userState.get(userId); if(!state||state.mode!=="form") return reply(event,textMessage(state?tr(state,"expired"):I18N.th.expired));
  const value=String(text||"").trim(); const current=formQuestions[state.step]; if(!value) return reply(event,textMessage(tr(state,"typeAnswer")));
  if(current.key==="phone"&&!/^\d{10}$/.test(value)) return reply(event,textMessage(tr(state,"invalidPhone")));
  if(current.key==="idcard"&&!/^[A-Za-z0-9]{6,13}$/.test(value)) return reply(event,textMessage(tr(state,"invalidId")));
  state.formData[current.key]=value; state.step+=1; touchState(userId);
  if(state.step<formQuestions.length) return reply(event,formQuestionFlex(state));
  state.mode="review"; return reply(event,reviewFlex(state));
}
async function handleExamAnswer(event,userId,data){
  const state=userState.get(userId); if(!state||state.mode!=="exam") return reply(event,textMessage(state?tr(state,"expired"):I18N.th.expired));
  if(state.locked) return reply(event,textMessage(state.language==="en"?"Please wait while the next question loads.":"กรุณารอสักครู่ ระบบกำลังโหลดข้อถัดไป"));
  state.locked=true;
  try{const qi=state.currentQuestion-1,q=examQuestions[qi],selected=parseInt(String(data).replace("answer_",""),10),choices=qChoices(q,state.language);
    if(!q||!Number.isInteger(selected)||selected<0||selected>=choices.length) throw new Error("Invalid answer");
    const answerText=choices[selected],correct=selected===q.answer; state.answers[qi]=correct?`${answerText} (ถูก)`:answerText; if(correct)state.score+=1; state.currentQuestion+=1; touchState(userId);
    if(state.currentQuestion>examQuestions.length)return finishExam(event,userId); return reply(event,examFlex(examQuestions[state.currentQuestion-1],state.currentQuestion,state));
  }catch(error){console.error("Exam error:",error);return reply(event,textMessage(tr(state,"expired")));}finally{const latest=userState.get(userId);if(latest)latest.locked=false;}
}
async function finishExam(event,userId){
  const state=userState.get(userId); if(!state)return reply(event,textMessage(I18N.th.expired)); const score=state.score,total=examQuestions.length,pass=score>=PASS_SCORE;
  const result=resultFlex(score,total,pass,state); if(pass){const saved=await sendToGoogleSheet(userId,"ผ่าน",state.answers);discardAllSessions(userId);if(!saved)return reply(event,[result,textMessage(state.language==="en"?"⚠️ The result could not be saved. Please contact Safety.":"⚠️ บันทึกผลไม่สำเร็จ กรุณาติดต่อทีม Safety")]);return reply(event,result);} discardAllSessions(userId);return reply(event,result);
}
async function sendToGoogleSheet(userId, passStatus, answers = []) {
  const state = userState.get(userId);
  if (!state) return false;

  const examCompletedAt = new Date().toISOString();
  const examAttemptId = `${userId}-${Date.now()}`;
  const payload = {
    userId,
    examAttemptId,
    examCompletedAt,
    fullname: state.formData.fullname,
    position: state.formData.position,
    phone: state.formData.phone,
    idcard: state.formData.idcard,
    company: state.formData.company,
    score: state.score,
    result: passStatus,
    answers: Array.from({ length: 30 }, (_, i) => answers[i] ?? "")
  };

  try {
    const response = await axios.post(GOOGLE_SCRIPT_URL, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000
    });

    const saved = response.status >= 200 && response.status < 300;
    if (saved && passStatus === "ผ่าน") {
      latestPassedExams.set(userId, {
        examAttemptId,
        examCompletedAt,
        completedAtMs: Date.parse(examCompletedAt)
      });
    }
    return saved;
  } catch (error) {
    console.error("Google Sheet error:", error.response?.data || error.message);
    return false;
  }
}
async function getCertificateUrl(userId) {
  const requestVariants = [
    { mode: "get_all", userId, all: "1", includeExpired: "1", limit: "1000" },
    { mode: "list", userId, history: "1", includeExpired: "1", limit: "1000" },
    { mode: "get", userId, all: "1", history: "1", limit: "1000" }
  ];

  const collected = [];
  const messages = [];

  for (const params of requestVariants) {
    try {
      const response = await axios.get(GOOGLE_SCRIPT_URL, {
        params: { ...params, cacheBust: `${Date.now()}-${Math.random()}` },
        timeout: 30000
      });

      const normalized = normalizeCertificatePayload(response.data);
      collected.push(...normalized.cards);
      if (normalized.message) messages.push(normalized.message);
    } catch (error) {
      console.error(
        "Certificate lookup variant error:",
        params.mode,
        error.response?.data || error.stack || error.message
      );
    }
  }

  const seen = new Set();
  const cards = collected
    .filter(card => {
      if (!card?.url || seen.has(card.url)) return false;
      seen.add(card.url);
      return true;
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.issuedAt || "");
      const bTime = Date.parse(b.issuedAt || "");
      if (Number.isFinite(aTime) && Number.isFinite(bTime)) return bTime - aTime;
      if (Number.isFinite(aTime)) return -1;
      if (Number.isFinite(bTime)) return 1;
      return 0;
    });

  console.log("Certificate lookup:", {
    userId,
    returnedCards: cards.length,
    urls: cards.map(card => card.url)
  });

  return {
    status: cards.length ? "ready" : "not_found",
    cards,
    message: messages.filter(Boolean).join(" | ")
  };
}

function normalizeCertificatePayload(rawData) {
  let parsed = rawData;

  if (typeof rawData === "string") {
    const value = rawData.trim();
    try {
      parsed = JSON.parse(value);
    } catch (_) {
      const urls = value
        .split(/[\r\n,]+/)
        .map(item => item.trim())
        .filter(item => /^https:\/\//i.test(item));
      return {
        cards: urls.map(url => ({ url, issuedAt: "", title: "" })),
        message: urls.length ? "" : value
      };
    }
  }

  const normalized = normalizeCertificateResponse(parsed);
  return { cards: normalized.cards, message: normalized.message };
}
function normalizeCertificateResponse(data) {
  const source = data && typeof data === "object" ? data : {};
  const sourceCards = Array.isArray(source)
    ? source
    : Array.isArray(source.cards)
      ? source.cards
      : Array.isArray(source.certificates)
        ? source.certificates
        : Array.isArray(source.items)
          ? source.items
          : Array.isArray(source.data)
            ? source.data
            : source.url
              ? [source]
              : [];

  const seen = new Set();
  const cards = sourceCards
    .map(card => typeof card === "string" ? { url: card } : card)
    .map(card => ({
      url: String(card?.url || card?.cardUrl || card?.certificateUrl || card?.link || "").trim(),
      issuedAt: String(card?.issuedAt || card?.createdAt || card?.date || "").trim(),
      title: String(card?.title || card?.name || "").trim()
    }))
    .filter(card => {
      if (!/^https:\/\//i.test(card.url) || seen.has(card.url)) return false;
      seen.add(card.url);
      return true;
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.issuedAt || "");
      const bTime = Date.parse(b.issuedAt || "");
      if (Number.isFinite(aTime) && Number.isFinite(bTime)) return bTime - aTime;
      if (Number.isFinite(aTime)) return -1;
      if (Number.isFinite(bTime)) return 1;
      return 0;
    });

  return {
    status: String(source.status || (cards.length ? "ready" : "not_found")),
    cards,
    message: String(source.message || "")
  };
}
function certificateStatusText(language, status, expiresAt = "") {
  const text = {
    processing: {
      th: "⏳ ระบบได้รับผลสอบล่าสุดแล้ว และกำลังสร้างบัตรใบใหม่ กรุณาลองดาวน์โหลดอีกครั้งภายหลัง",
      en: "⏳ Your latest exam result was received. The new card is being generated. Please try again later.",
      ja: "⏳ 最新の試験結果を受け付けました。新しいカードを作成中です。後でもう一度お試しください。",
      my: "⏳ နောက်ဆုံးစာမေးပွဲရလဒ်ကို လက်ခံပြီးပါပြီ။ ကတ်အသစ်ဖန်တီးနေပါသည်။ နောက်မှ ထပ်မံစမ်းကြည့်ပါ။",
      zh: "⏳ 已收到最新考试结果，正在生成新卡。请稍后再试。"
    },
    expired: {
      th: `⚠️ บัตรผู้รับเหมาล่าสุดหมดอายุแล้ว${expiresAt ? ` เมื่อวันที่ ${expiresAt}` : ""}\nกรุณาทำแบบทดสอบใหม่เพื่อออกบัตรใบใหม่`,
      en: `⚠️ Your latest contractor card has expired${expiresAt ? ` on ${expiresAt}` : ""}.\nPlease complete the exam again to receive a new card.`,
      ja: `⚠️ 最新の請負業者カードは${expiresAt ? ` ${expiresAt} に` : ""}有効期限が切れています。\n新しいカードを取得するには、もう一度試験を受けてください。`,
      my: `⚠️ နောက်ဆုံးကန်ထရိုက်တာကတ်သည်${expiresAt ? ` ${expiresAt} တွင်` : ""} သက်တမ်းကုန်ပြီးပါပြီ။\nကတ်အသစ်ရယူရန် စာမေးပွဲကို ပြန်လည်ဖြေဆိုပါ။`,
      zh: `⚠️ 最新的承包商卡${expiresAt ? `已于 ${expiresAt}` : "已经"}过期。\n请重新参加考试以获取新卡。`
    },
    invalid_url: {
      th: "⚠️ พบข้อมูลบัตรล่าสุด แต่ลิงก์บัตรไม่ถูกต้อง กรุณาติดต่อทีม Safety",
      en: "⚠️ The latest card record was found, but its link is invalid. Please contact Safety.",
      ja: "⚠️ 最新のカード記録が見つかりましたが、リンクが無効です。Safetyへ連絡してください。",
      my: "⚠️ နောက်ဆုံးကတ်မှတ်တမ်းကိုတွေ့ရှိသော်လည်း လင့်ခ်မမှန်ပါ။ Safety ကိုဆက်သွယ်ပါ။",
      zh: "⚠️ 已找到最新卡片记录，但链接无效。请联系Safety团队。"
    },
    error: {
      th: "⚠️ ไม่สามารถตรวจสอบบัตรได้ในขณะนี้ กรุณาลองใหม่หรือติดต่อทีม Safety",
      en: "⚠️ The card cannot be checked right now. Please try again or contact Safety.",
      ja: "⚠️ 現在カードを確認できません。もう一度試すかSafetyへ連絡してください。",
      my: "⚠️ လက်ရှိကတ်ကိုစစ်ဆေး၍မရပါ။ ထပ်မံစမ်းကြည့်ပါ သို့မဟုတ် Safety ကိုဆက်သွယ်ပါ။",
      zh: "⚠️ 目前无法检查卡片，请稍后重试或联系Safety团队。"
    }
  };

  return text[status]?.[language] || text[status]?.th || "";
}

async function handleDownloadCertificate(event, userId) {
  const result = await getCertificateUrl(userId);
  const cards = Array.isArray(result.cards) ? result.cards : [];

  if (cards.length) {
    latestPassedExams.delete(userId);
    return reply(event, allCertificatesFlex(cards, getUserLanguage(userId)));
  }

  return reply(event, textMessage(runtimeText(userId, "noCard")));
}

async function beginIssueReport(event,userId){
  clearUserState(userId);
  userState.set(userId,{mode:"report_issue",locked:false});
  touchState(userId);
  return reply(event,issueFormFlex(getUserLanguage(userId)));
}
async function handleIssueReport(event,userId,text){
  const state=userState.get(userId);
  if(!state||state.mode!=="report_issue")return false;
  const report=String(text||"").trim();
  if(normalize(report)===normalize("ยกเลิกการแจ้งปัญหา")){
    clearUserState(userId);
    await reply(event,textMessage(runtimeText(userId,"cancelIssue")));
    return true;
  }
  if(event.type!=="message"||event.message?.type!=="text"||report.length<10){
    await reply(event,textMessage(runtimeText(userId,"issueMin")));
    return true;
  }
  if(state.locked)return true;
  state.locked=true;
  try{
    await client.pushMessage(ADMIN_USER_ID,issueAdminFlex(report,userId));
    clearUserState(userId);
    await reply(event,issueSuccessFlex(getUserLanguage(userId)));
  }catch(e){
    console.error("Issue push error:",e.response?.data||e.message);
    clearUserState(userId);
    await reply(event,textMessage(runtimeText(userId,"issueFail")));
  }
  return true;
}


function resumePromptFlex(saved) {
  const state = saved?.state || saved || {};
  const lang = getLanguage(state);
  const completedCount = state.mode === "exam"
    ? Math.max(0, Math.min(examQuestions.length, Number(state.currentQuestion || 1) - 1))
    : 0;
  const subtitle = state.mode === "exam"
    ? `${completedCount}/${examQuestions.length} ${tr(state, "completed")}`
    : tr(state, "resumeSub");

  return {
    type: "flex",
    altText: tr(state, "resumeTitle"),
    contents: {
      type: "bubble",
      size: "mega",
      styles: {
        body: { backgroundColor: THEME.canvas },
        footer: { backgroundColor: THEME.canvas }
      },
      header: titleBlock(
        "⏯️",
        "SAVED PROGRESS",
        tr(state, "resumeTitle"),
        subtitle,
        THEME.orange
      ),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: tr(state, "resumeSub"),
            size: "sm",
            color: THEME.ink,
            wrap: true,
            align: "center"
          },
          state.mode === "exam"
            ? {
                type: "text",
                text: `${tr(state, "progress")}: ${completedCount}/${examQuestions.length}`,
                size: "xs",
                weight: "bold",
                color: THEME.blue,
                align: "center"
              }
            : {
                type: "text",
                text: tr(state, "pausedNotice"),
                size: "xs",
                color: THEME.muted,
                wrap: true,
                align: "center"
              }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "18px",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: THEME.green,
            action: {
              type: "postback",
              label: tr(state, "continueExam").slice(0, 20),
              data: "resume=continue",
              displayText: tr(state, "continueExam")
            }
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: tr(state, "startNew").slice(0, 20),
              data: "resume=new",
              displayText: tr(state, "startNew")
            }
          }
        ]
      }
    }
  };
}

async function renderSavedSession(event, userId, savedState) {
  if (!savedState || !savedState.mode) {
    discardAllSessions(userId);
    return reply(event, languageSelectFlex());
  }

  const state = cloneSession(savedState);
  state.language = I18N[state.language] ? state.language : getUserLanguage(userId);
  state.locked = false;
  userState.set(userId, state);
  setUserLanguage(userId, state.language);
  touchState(userId);

  switch (state.mode) {
    case "language":
      return reply(event, languageSelectFlex());
    case "job":
      return reply(event, [pdpaFlex(state), jobPositionFlex(state)]);
    case "form":
      state.step = Math.max(0, Math.min(formQuestions.length - 1, Number(state.step || 0)));
      return reply(event, formQuestionFlex(state));
    case "review":
      return reply(event, reviewFlex(state));
    case "exam": {
      const number = Math.max(1, Math.min(examQuestions.length, Number(state.currentQuestion || 1)));
      state.currentQuestion = number;
      return reply(event, examFlex(examQuestions[number - 1], number, state));
    }
    default:
      discardAllSessions(userId);
      return reply(event, languageSelectFlex());
  }
}

function detailFlex(state, type = "exam") {
  const lang = getLanguage(state);
  const copy = {
    th: {
      title: "รายละเอียดแบบทดสอบ",
      subtitle: "ข้อมูลก่อนเริ่มทำแบบทดสอบ",
      lines: [
        `จำนวนข้อ: ${examQuestions.length} ข้อ`,
        `เกณฑ์ผ่าน: ${PASS_SCORE} คะแนน`,
        "กรุณาเลือกคำตอบจากปุ่มในข้อความล่าสุด",
        "หากออกไปใช้เมนูอื่น ระบบจะเก็บความคืบหน้าไว้ชั่วคราว"
      ]
    },
    en: {
      title: "Exam Details",
      subtitle: "Information before starting",
      lines: [
        `Questions: ${examQuestions.length}`,
        `Passing score: ${PASS_SCORE}`,
        "Select an answer from the buttons in the latest message.",
        "If you open another menu, your progress is temporarily saved."
      ]
    },
    ja: {
      title: "試験の詳細",
      subtitle: "開始前のご案内",
      lines: [
        `問題数: ${examQuestions.length}問`,
        `合格点: ${PASS_SCORE}点`,
        "最新メッセージのボタンから回答してください。",
        "別メニューを開くと、進捗は一時保存されます。"
      ]
    },
    my: {
      title: "စာမေးပွဲအသေးစိတ်",
      subtitle: "မစတင်မီ အချက်အလက်",
      lines: [
        `မေးခွန်း: ${examQuestions.length}`, 
        `အောင်မှတ်: ${PASS_SCORE}`,
        "နောက်ဆုံးစာရှိ ခလုတ်များမှ အဖြေရွေးပါ။",
        "အခြားမီနူးသို့သွားပါက တိုးတက်မှုကို ယာယီသိမ်းထားမည်။"
      ]
    },
    zh: {
      title: "考试详情",
      subtitle: "开始前说明",
      lines: [
        `题目数量：${examQuestions.length}题`,
        `及格分数：${PASS_SCORE}分`,
        "请从最新消息中的按钮选择答案。",
        "打开其他菜单时，系统会暂时保存考试进度。"
      ]
    }
  }[lang] || null;

  if (type !== "exam" || !copy) {
    return fallbackFlex(lang);
  }

  return {
    type: "flex",
    altText: copy.title,
    contents: {
      type: "bubble",
      size: "mega",
      styles: { body: { backgroundColor: THEME.canvas } },
      header: titleBlock("ℹ️", "EXAM INFORMATION", copy.title, copy.subtitle, THEME.blue),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: copy.lines.map((line, index) => ({
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          paddingAll: "12px",
          cornerRadius: "12px",
          backgroundColor: THEME.white,
          borderColor: THEME.line,
          borderWidth: "1px",
          contents: [
            { type: "text", text: String(index + 1), flex: 0, weight: "bold", color: THEME.blue },
            { type: "text", text: line, flex: 1, wrap: true, size: "sm", color: THEME.ink }
          ]
        }))
      }
    }
  };
}

function cloneSession(state) {
  return JSON.parse(JSON.stringify(state));
}

function pauseCurrentSession(userId) {
  const state = userState.get(userId);
  if (!state) return false;

  if (["language", "job", "form", "review", "exam"].includes(state.mode)) {
    pausedSessions.set(userId, {
      state: cloneSession(state),
      pausedAt: Date.now()
    });
  }

  clearUserState(userId);
  return true;
}

function discardAllSessions(userId) {
  clearUserState(userId);
  pausedSessions.delete(userId);
}

function setPendingMenuAction(userId, action) {
  pendingMenuActions.set(userId, {
    action,
    createdAt: Date.now()
  });
}

function clearPendingMenuAction(userId) {
  pendingMenuActions.delete(userId);
}

function renderSelectedMenu(action, language) {
  switch (action) {
    case "contractor":
      return contractorMainMenuFlex(language);
    case "map":
      return [mapFlexFor(language), phoneFlexFor(language)];
    case "contact":
      return contactMenuFlex(language);
    default:
      return contractorMainMenuFlex(language);
  }
}

async function routeMainRichMenu(event, userId, action) {
  // ถ้าเคยเลือกภาษาแล้ว ใช้ภาษาเดิมกับทุกฟังก์ชันทันที
  if (hasUserLanguage(userId)) {
    clearPendingMenuAction(userId);
    await reply(event, renderSelectedMenu(action, getUserLanguage(userId)));
    return true;
  }

  // เลือกภาษาเฉพาะครั้งแรกของ 3 Rich Menu หลัก
  clearUserState(userId);
  pausedSessions.delete(userId);
  setPendingMenuAction(userId, action);
  await reply(event, globalLanguageSelectFlex("th"));
  return true;
}

async function handleNavigationInterrupt(event, userId, msg) {
  if (event.type !== "message" || !msg) return false;

  const resetAndReply = async (messages) => {
    pauseCurrentSession(userId);
    await reply(event, messages);
    return true;
  };

  // เริ่มข้อสอบใหม่ได้ทันที ไม่ว่าจะค้างอยู่ขั้นตอนไหน
  if (msg.includes(normalize("ทำแบบทดสอบ"))) {
    const active = userState.get(userId);
    if (active && ["language", "job", "form", "review", "exam"].includes(active.mode)) {
      pausedSessions.set(userId, { state: cloneSession(active), pausedAt: Date.now() });
      clearUserState(userId);
    }
    const saved = pausedSessions.get(userId);
    if (saved) {
      await reply(event, resumePromptFlex(saved));
      return true;
    }
    if (hasUserLanguage(userId)) {
      const selected = getUserLanguage(userId);
      const examState = {
        mode: "job",
        language: selected,
        step: 0,
        formData: {},
        currentQuestion: 1,
        score: 0,
        answers: [],
        locked: false
      };
      userState.set(userId, examState);
      touchState(userId);
      await reply(event, [pdpaFlex(examState), jobPositionFlex(examState)]);
      return true;
    }

    userState.set(userId, { mode:"language", language:null, step:0, formData:{}, currentQuestion:1, score:0, answers:[], locked:false });
    touchState(userId);
    await reply(event, languageSelectFlex());
    return true;
  }

  // ออกจากขั้นตอนปัจจุบันและกลับเมนูหลัก
  if (
    msg === normalize("ยกเลิก") ||
    msg.includes(normalize("ยกเลิกข้อสอบ")) ||
    msg.includes(normalize("ออกจากข้อสอบ")) ||
    msg.includes(normalize("กลับเมนู"))
  ) {
    discardAllSessions(userId);
    clearPendingMenuAction(userId);
    await reply(event, [textMessage("ยกเลิกขั้นตอนปัจจุบันเรียบร้อยแล้วครับ"), contractorMainMenuFlex(getUserLanguage(userId))]);
    return true;
  }

  // คำสั่งจาก Rich Menu ทำงานได้ทันที และยกเลิก Session เดิม
  if (msg.includes(normalize("ผู้รับส่งสินค้า"))) {
    return resetAndReply(menuDelivery(getUserLanguage(userId)));
  }

  if (msg.includes(normalize("ผู้แก้ไขงาน"))) {
    return resetAndReply(menuVendor(getUserLanguage(userId)));
  }

  if (
    msg.includes(normalize("สื่ออบรมผู้รับเหมา")) ||
    (
      msg.includes(normalize("สื่อ")) &&
      msg.includes(normalize("อบรม")) &&
      msg.includes(normalize("ผู้รับเหมา"))
    )
  ) {
    return resetAndReply(trainingMenu(getUserLanguage(userId)));
  }

  if (msg.includes(normalize("ดาวน์โหลดบัตร"))) {
    pauseCurrentSession(userId);
    await handleDownloadCertificate(event, userId);
    return true;
  }

  if (msg.includes(normalize("ติดต่อทีมเซฟตี้"))) {
    return routeMainRichMenu(event, userId, "contact");
  }

  if (
    msg.includes("safetyhotline") ||
    (msg.includes("safety") && msg.includes("hotline"))
  ) {
    return resetAndReply(hotlineFlex(getUserLanguage(userId)));
  }

  if (msg.includes(normalize("แจ้งปัญหา"))) {
    pauseCurrentSession(userId);
    await beginIssueReport(event, userId);
    return true;
  }

  if (
    msg.includes(normalize("แผนที่")) ||
    msg.includes("map") ||
    msg.includes("location") ||
    msg.includes(normalize("โรงงานอยู่ไหน"))
  ) {
    return routeMainRichMenu(event, userId, "map");
  }

  if (
    msg === normalize("ข้อมูลผู้รับเหมา") ||
    msg === normalize("เมนูผู้รับเหมา") ||
    msg === normalize("ผู้รับเหมา") ||
    msg === normalize("เมนู") ||
    msg === "menu" ||
    msg === normalize("เริ่มต้น") ||
    msg === "start"
  ) {
    return routeMainRichMenu(event, userId, "contractor");
  }

  return false;
}

async function handleEvent(event) {
  if (!event || !["message", "postback"].includes(event.type)) {
    return null;
  }

  const userId = event.source?.userId;
  if (!userId) return null;

  const text =
    event.type === "message" && event.message?.type === "text"
      ? event.message.text
      : "";

  const msg = normalize(text);
  const data = event.postback?.data || "";

  if (data === "pref_language=select") {
    if (!pendingMenuActions.has(userId)) {
      setPendingMenuAction(userId, "contractor");
    }
    return reply(event, globalLanguageSelectFlex(getUserLanguage(userId)));
  }

  if (data.startsWith("pref_language=")) {
    const selected = setUserLanguage(userId, data.slice(14));
    const pending = pendingMenuActions.get(userId);
    clearPendingMenuAction(userId);

    if (pending?.action) {
      return reply(event, renderSelectedMenu(pending.action, selected));
    }

    return reply(event, contractorMainMenuFlex(selected));
  }

  if (["ภาษา","language","言語","ဘာသာစကား","语言","中文"].some(word => msg === normalize(word))) {
    setPendingMenuAction(userId, "contractor");
    return reply(event, globalLanguageSelectFlex(getUserLanguage(userId)));
  }

  // ในกลุ่ม ตอบเฉพาะข้อความที่เรียกบอท
  if (event.source.type === "group" && event.type === "message") {
    const calledBot = ["บอท", "bot", "safety"].some(word =>
      msg.includes(word)
    );
    if (!calledBot) return null;
  }

  // เหตุฉุกเฉินมีสิทธิ์สูงสุดและยกเลิก Session เดิม
  if (
    ["อุบัติเหตุ", "ฉุกเฉิน", "ไฟไหม้", "บาดเจ็บ"].some(word =>
      msg.includes(word)
    )
  ) {
    clearUserState(userId);
    return reply(
      event,
      textMessage(
        "⚠️ เหตุฉุกเฉิน กรุณาติดต่อทันที\n" +
        "โรงงาน 1: 102 / 127 / 129\n" +
        "โรงงาน 2: 137\n" +
        "ผู้จัดการ: 100"
      )
    );
  }

  // ตรวจ Rich Menu และคำสั่งนำทางก่อนตรวจ State ของข้อสอบ
  const navigationHandled = await handleNavigationInterrupt(
    event,
    userId,
    msg
  );
  if (navigationHandled) return null;

  if (data === "resume=continue") {
    const saved = pausedSessions.get(userId);
    if (!saved) return reply(event, languageSelectFlex());
    pausedSessions.delete(userId);
    return renderSavedSession(event, userId, saved.state);
  }

  if (data === "resume=new") {
    discardAllSessions(userId);
    if (hasUserLanguage(userId)) {
      const selected = getUserLanguage(userId);
      const examState = { mode:"job", language:selected, step:0, formData:{}, currentQuestion:1, score:0, answers:[], locked:false };
      userState.set(userId, examState);
      touchState(userId);
      return reply(event, [pdpaFlex(examState), jobPositionFlex(examState)]);
    }
    userState.set(userId, { mode:"language", language:null, step:0, formData:{}, currentQuestion:1, score:0, answers:[], locked:false });
    touchState(userId);
    return reply(event, languageSelectFlex());
  }

  if (data === "detail=exam") {
    const detailState = userState.get(userId) || pausedSessions.get(userId)?.state || { language:"th" };
    return reply(event, detailFlex(detailState, "exam"));
  }

  // ถ้าไม่ใช่คำสั่งนำทาง จึงประมวลผล State ปัจจุบัน
  const state = userState.get(userId);

  if (state?.mode === "report_issue") {
    return handleIssueReport(event, userId, text);
  }

  if (state?.mode === "language") {
    if (data.startsWith("language=")) {
      const selectedLanguage = data.slice(9);
      state.language = I18N[selectedLanguage] ? selectedLanguage : "th";
      setUserLanguage(userId, state.language);
      state.mode = "job";
      touchState(userId);
      return reply(event, [pdpaFlex(state), jobPositionFlex(state)]);
    }
    return reply(
      event,
      textMessage("กรุณาเลือกภาษา / Please select a language.")
    );
  }

  if (state?.mode === "job") {
    if (data.startsWith("job=")) {
      state.formData.position = data.slice(4);
      state.mode = "form";
      state.step = 0;
      touchState(userId);
      return reply(event, formQuestionFlex(state));
    }
    return reply(event, textMessage(tr(state, "chooseButton")));
  }

  if (state?.mode === "form") {
    return handleFormAnswer(event, userId, text);
  }

  if (state?.mode === "review") {
    if (data === "review=confirm") {
      state.mode = "exam";
      state.currentQuestion = 1;
      state.score = 0;
      state.answers = [];
      state.locked = false;
      touchState(userId);
      return reply(event, examFlex(examQuestions[0], 1, state));
    }

    if (data === "review=restart") {
      state.mode = "form";
      state.step = 0;
      state.formData = {
        position: state.formData.position
      };
      touchState(userId);
      return reply(event, formQuestionFlex(state));
    }

    return reply(event, reviewFlex(state));
  }

  if (state?.mode === "exam") {
    if (data.startsWith("answer_")) {
      return handleExamAnswer(event, userId, data);
    }
    return reply(event, textMessage(tr(state, "chooseButton")));
  }

  // คำถามทั่วไปเมื่อไม่มี Session ค้างอยู่
  const qa = safetyQA.find(item =>
    msg.includes(normalize(item.question))
  );
  if (qa) {
    return reply(event, textMessage(qa.answer));
  }

  return reply(event, fallbackFlex(getUserLanguage(userId)));
}

app.get(["/","/webhook","/health"],(req,res)=>res.status(200).json({ok:true,service:"Sodick Safety Bot",version:APP_VERSION}));
app.post("/webhook",line.middleware(config),async(req,res)=>{
  try {
    const events=Array.isArray(req.body.events)?req.body.events:[];
    await Promise.all(events.map(handleEvent));
    return res.status(200).end();
  } catch (error) {
    console.error("Webhook error status:",error.response?.status||"unknown");
    console.error("Webhook error data:",JSON.stringify(error.response?.data||null));
    console.error("Webhook error message:",error.stack||error.message);
    console.error("Active version:",APP_VERSION);
    return res.status(200).end();
  }
});
app.listen(PORT,()=>console.log(`Sodick Safety Bot ${APP_VERSION} running on port ${PORT}`));
