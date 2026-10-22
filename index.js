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
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzM-aH9KjLB0xo5JiJBia09hCdWhCcusS2P4p3J_0swaH4QyZSpTCvpYlEqCTUMBjQi/exec";
const PASS_SCORE = 24;
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const APP_VERSION = "4.0.0-multilingual-resume-premium";

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
  }
};

const JOB_LABELS = {
  Owner: { th: "เจ้าของบริษัท", en: "Owner", ja: "会社経営者", my: "ကုမ္ပဏီပိုင်ရှင်" },
  Supervisor: { th: "ผู้ควบคุมงาน", en: "Supervisor", ja: "監督者", my: "ကြီးကြပ်သူ" },
  Engineer: { th: "วิศวกร", en: "Engineer", ja: "エンジニア", my: "အင်ဂျင်နီယာ" },
  Foreman: { th: "โฟร์แมน", en: "Foreman", ja: "職長", my: "ဖိုမင်" },
  Technician: { th: "ช่าง", en: "Technician", ja: "技術者", my: "နည်းပညာရှင်" },
  GeneralWorker: { th: "พนักงานทั่วไป", en: "General Worker", ja: "一般作業員", my: "အထွေထွေလုပ်သား" }
};

const userState = new Map();
const pausedSessions = new Map();
const inactivityTimers = new Map();
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
  { th:["PPE คืออะไร?",["อุปกรณ์ป้องกันอันตรายส่วนบุคคล","รองเท้าธรรมดา","เสื้อผ้าทั่วไป"]], en:["What does PPE mean?",["Personal protective equipment","Ordinary shoes","General clothing"]], ja:["PPEとは何ですか？",["個人用保護具","一般的な靴","一般的な衣服"]], my:["PPE ဆိုတာဘာလဲ။",["ကိုယ်ရေးကာကွယ်ရေးပစ္စည်း","သာမန်ဖိနပ်","သာမန်အဝတ်အစား"]], answer:0 },
  { th:["หมวกนิรภัยต้องสวมเมื่อไหร่?",["เมื่ออยู่ในพื้นที่ทำงาน","เฉพาะตอนมีผู้จัดการมา","ไม่จำเป็น"]], en:["When must a safety helmet be worn?",["When inside the work area","Only when a manager is present","It is not necessary"]], ja:["安全ヘルメットはいつ着用しますか？",["作業エリア内にいるとき","管理者が来たときだけ","着用不要"]], my:["လုံခြုံရေးဦးထုပ်ကို ဘယ်အချိန်ဝတ်ရမလဲ။",["အလုပ်ဧရိယာထဲရှိချိန်","မန်နေဂျာလာချိန်သာ","မလိုအပ်ပါ"]], answer:0 },
  { th:["งานที่สูงคือความสูงตั้งแต่กี่เมตรขึ้นไป?",["1 เมตร","2 เมตร","5 เมตร"]], en:["Work at height starts from what height?",["1 meter","2 meters","5 meters"]], ja:["高所作業は何メートル以上ですか？",["1メートル","2メートル","5メートル"]], my:["အမြင့်တွင်အလုပ်သည် ဘယ်နှမီတာမှစပါသလဲ။",["၁ မီတာ","၂ မီတာ","၅ မီတာ"]], answer:1 },
  { th:["ถังดับเพลิงสีแดงใช้สำหรับดับอะไร?",["ไฟฟ้า","เชื้อเพลิงของเหลว","ไม้/กระดาษ"]], en:["In this test, what is the red fire extinguisher used for?",["Electrical fire","Flammable liquid","Wood / paper"]], ja:["この試験で赤い消火器は何を消すために使いますか？",["電気火災","液体燃料火災","木材・紙の火災"]], my:["ဤစာမေးပွဲအရ အနီရောင်မီးသတ်ဘူးကို ဘာအတွက်သုံးသလဲ။",["လျှပ်စစ်မီး","အရည်လောင်စာမီး","သစ်သား/စက္ကူမီး"]], answer:2 },
  { th:["หากพบอุบัติเหตุควรทำอย่างไร?",["ถ่ายรูปก่อน","แจ้งทีม Safety ทันที","เดินหนี"]], en:["What should you do if you find an accident?",["Take a photo first","Notify the Safety team immediately","Walk away"]], ja:["事故を発見したらどうしますか？",["先に写真を撮る","直ちにSafetyへ連絡","立ち去る"]], my:["မတော်တဆမှုတွေ့လျှင် ဘာလုပ်ရမလဲ။",["ဓာတ်ပုံအရင်ရိုက်မည်","Safety အဖွဲ့ကို ချက်ချင်းအကြောင်းကြားမည်","ထွက်သွားမည်"]], answer:1 },
  { th:["จะสูบบุหรี่ควรทำอย่างไร?",["สูบตรงไหนก็ได้","สูบในห้องน้ำ","สูบเฉพาะจุดที่กำหนด"]], en:["Where is smoking allowed?",["Anywhere","In the restroom","Only in designated areas"]], ja:["喫煙はどこで可能ですか？",["どこでも","トイレ","指定場所のみ"]], my:["ဆေးလိပ်ကို ဘယ်မှာသောက်ရမလဲ။",["နေရာတိုင်း","အိမ်သာ","သတ်မှတ်နေရာတွင်သာ"]], answer:2 },
  { th:["การเดินในโรงงานควรเดินตรงไหน?",["เดินในเลนคนเดิน","เดินบนถนนรถยก","เดินตรงไหนก็ได้"]], en:["Where should pedestrians walk in the factory?",["In the pedestrian lane","On the forklift road","Anywhere"]], ja:["工場内ではどこを歩きますか？",["歩行者通路","フォークリフト道路","どこでも"]], my:["စက်ရုံအတွင်း ဘယ်နေရာကလျှောက်ရမလဲ။",["လူသွားလမ်း","ဖော့ကလစ်လမ်း","နေရာတိုင်း"]], answer:0 },
  { th:["ถ้าพบสารเคมีหกควรทำอย่างไร?",["เช็ดเอง","แจ้ง Safety","ปล่อยไว้"]], en:["What should you do if chemicals spill?",["Clean it yourself","Notify Safety","Leave it"]], ja:["化学物質の漏れを発見したら？",["自分で拭く","Safetyへ連絡","放置する"]], my:["ဓာတုပစ္စည်းယိုဖိတ်မှုတွေ့လျှင်။",["ကိုယ်တိုင်သုတ်မည်","Safety ကိုအကြောင်းကြားမည်","ထားခဲ့မည်"]], answer:1 },
  { th:["การยกของหนักควรทำอย่างไร?",["ก้มหลังยก","ใช้แรงเต็มที่","ย่อตัวแล้วยก"]], en:["How should a heavy object be lifted?",["Bend the back","Use maximum force","Squat and lift"]], ja:["重い物を持ち上げる方法は？",["腰を曲げて持つ","力いっぱい持つ","しゃがんで持ち上げる"]], my:["လေးလံသောပစ္စည်းကို မည်သို့မရမလဲ။",["ခါးကုန်း၍မမည်","အားအပြည့်သုံးမည်","ဒူးကွေးပြီးမမည်"]], answer:2 },
  { th:["ป้ายเตือนสีเหลืองหมายถึงอะไร?",["ข้อบังคับ","คำเตือน","ห้ามทำ"]], en:["What does a yellow safety sign mean?",["Mandatory action","Warning","Prohibition"]], ja:["黄色の安全標識の意味は？",["義務","警告","禁止"]], my:["အဝါရောင်လုံခြုံရေးဆိုင်း၏အဓိပ္ပါယ်။",["မဖြစ်မနေလုပ်ရန်","သတိပေးချက်","တားမြစ်ချက်"]], answer:1 },
  { th:["ป้ายวงกลมสีแดงมีเส้นทับหมายถึงอะไร?",["ควรทำ","ห้ามทำ","ไม่เกี่ยว"]], en:["What does a red circle with a diagonal line mean?",["Recommended","Prohibited","Not relevant"]], ja:["赤い円に斜線の標識の意味は？",["推奨","禁止","関係なし"]], my:["အနီစက်ဝိုင်းနှင့် မျဉ်းဖြတ်ဆိုင်း၏အဓိပ္ပါယ်။",["လုပ်သင့်သည်","မလုပ်ရ","မသက်ဆိုင်"]], answer:1 },
  { th:["ถ้าต้องใช้บันไดควรทำอย่างไร?",["ปีนสองคน","ตรวจสภาพก่อนใช้","ใช้บันไดพัง"]], en:["What should you do before using a ladder?",["Climb with two people","Inspect it before use","Use a damaged ladder"]], ja:["はしご使用前に何をしますか？",["2人で登る","使用前点検","壊れたものを使う"]], my:["လှေကားအသုံးမပြုမီ ဘာလုပ်ရမလဲ။",["နှစ်ယောက်တက်မည်","အသုံးမပြုမီစစ်မည်","ပျက်နေသောလှေကားသုံးမည်"]], answer:1 },
  { th:["ถ้าต้องทำงานเชื่อมต้องมีอุปกรณ์อะไร?",["แว่นเชื่อม","หมวกกันน็อค","รองเท้าแตะ"]], en:["What equipment is required for welding?",["Welding eye protection","Motorcycle helmet","Sandals"]], ja:["溶接作業に必要な保護具は？",["溶接用保護メガネ","バイク用ヘルメット","サンダル"]], my:["ဂဟေဆော်ရာတွင် ဘာလိုအပ်သလဲ။",["ဂဟေဆော်မျက်မှန်","ဆိုင်ကယ်ဦးထုပ်","ဖိနပ်ပါး"]], answer:0 },
  { th:["ถ้าต้องทำงานในที่อับอากาศต้องมีอะไร?",["ใบอนุญาต","ไฟฉาย","น้ำดื่ม"]], en:["What is required for confined-space work?",["A work permit","A flashlight","Drinking water"]], ja:["閉所作業に必要なものは？",["作業許可証","懐中電灯","飲料水"]], my:["ပိတ်လှောင်နေရာအလုပ်အတွက် ဘာလိုအပ်သလဲ။",["အလုပ်ခွင့်လက်မှတ်","ဓာတ်မီး","သောက်ရေ"]], answer:0 },
  { th:["รถยกมีสิทธิ์ในถนนโรงงานมากกว่าคนเดินหรือไม่?",["ใช่","ไม่ใช่","แล้วแต่เวลา"]], en:["Does a forklift always have more right of way than pedestrians?",["Yes","No","It depends on the time"]], ja:["フォークリフトは常に歩行者より優先ですか？",["はい","いいえ","時間による"]], my:["ဖော့ကလစ်သည် လမ်းလျှောက်သူထက်အမြဲဦးစားပေးပါသလား။",["ဟုတ်သည်","မဟုတ်ပါ","အချိန်ပေါ်မူတည်သည်"]], answer:1 },
  { th:["ถ้าพบสายไฟชำรุดควรทำอย่างไร?",["จับดู","แจ้งช่างไฟ","ใช้ต่อ"]], en:["What should you do with a damaged electrical cable?",["Touch it","Notify an electrician","Continue using it"]], ja:["電線の損傷を発見したら？",["触って確認","電気担当へ連絡","そのまま使用"]], my:["ပျက်စီးလျှပ်စစ်ကြိုးတွေ့လျှင်။",["ကိုင်ကြည့်မည်","လျှပ်စစ်ကျွမ်းကျင်သူကိုအကြောင်းကြားမည်","ဆက်သုံးမည်"]], answer:1 },
  { th:["ถ้าต้องตัดเหล็กควรใส่อุปกรณ์อะไร?",["แว่นตานิรภัย","หมวกแก๊ป","ไม่มีอะไร"]], en:["What should be worn when cutting metal?",["Safety glasses","A cap","Nothing"]], ja:["金属切断時に着用するものは？",["保護メガネ","帽子","何もなし"]], my:["သံဖြတ်ရာတွင် ဘာဝတ်ရမလဲ။",["လုံခြုံရေးမျက်မှန်","ဦးထုပ်","ဘာမှမဝတ်"]], answer:0 },
  { th:["ถังดับเพลิงต้องตรวจทุกกี่เดือน?",["1 เดือน","3 เดือน","6 เดือน"]], en:["According to this training, how often is a fire extinguisher inspected?",["Every month","Every 3 months","Every 6 months"]], ja:["この研修では消火器を何か月ごとに点検しますか？",["1か月","3か月","6か月"]], my:["ဤသင်တန်းအရ မီးသတ်ဘူးကို ဘယ်နှလတိုင်းစစ်ရမလဲ။",["၁ လ","၃ လ","၆ လ"]], answer:2 },
  { th:["ถ้าต้องทำงานบนที่สูงต้องใช้อุปกรณ์อะไร?",["รองเท้าแตะ","เข็มขัดกันตก","หมวกแก๊ป"]], en:["What equipment is required for work at height?",["Sandals","Fall-protection harness","A cap"]], ja:["高所作業に必要なものは？",["サンダル","墜落制止用器具","帽子"]], my:["အမြင့်တွင်အလုပ်အတွက် ဘာလိုအပ်သလဲ။",["ဖိနပ်ပါး","ပြုတ်ကျကာကွယ်ရေးခါးပတ်","ဦးထုပ်"]], answer:1 },
  { th:["การเดินในพื้นที่การผลิตควรใส่อะไร?",["รองเท้าเซฟตี้","รองเท้าแตะ","รองเท้าผ้าใบ"]], en:["What footwear is required in the production area?",["Safety shoes","Sandals","Training shoes"]], ja:["生産エリアで必要な履物は？",["安全靴","サンダル","運動靴"]], my:["ထုတ်လုပ်ရေးဧရိယာတွင် ဘာဖိနပ်ဝတ်ရမလဲ။",["Safety ဖိနပ်","ဖိနပ်ပါး","အားကစားဖိနပ်"]], answer:0 },
  { th:["ถ้าต้องขนของหนักควรทำอย่างไร?",["ใช้รถเข็น","ยกเอง","ลากไปกับพื้น"]], en:["How should heavy materials be transported?",["Use a trolley","Carry them alone","Drag them on the floor"]], ja:["重い荷物を運ぶ方法は？",["台車を使う","一人で持つ","床を引きずる"]], my:["လေးလံပစ္စည်းကို မည်သို့သယ်ရမလဲ။",["တွန်းလှည်းသုံးမည်","တစ်ယောက်တည်းမမည်","မြေပေါ်ဆွဲမည်"]], answer:0 },
  { th:["ถ้าพบไฟไหม้ควรทำอย่างไร?",["วิ่งหนี","แจ้ง 102/127/129","ถ่ายคลิป"]], en:["What should you do if you find a fire?",["Run away","Call extensions 102 / 127 / 129","Record a video"]], ja:["火災を発見したら？",["逃げる","内線102/127/129へ連絡","動画を撮る"]], my:["မီးလောင်မှုတွေ့လျှင်။",["ထွက်ပြေးမည်","102/127/129 ကိုအကြောင်းကြားမည်","ဗီဒီယိုရိုက်မည်"]], answer:1 },
  { th:["ถ้าต้องทำงานเสียงดังควรใส่อะไร?",["ที่อุดหู","หมวกแก๊ป","ไม่มีอะไร"]], en:["What should be worn in a noisy work area?",["Hearing protection","A cap","Nothing"]], ja:["騒音作業で着用するものは？",["耳栓","帽子","何もなし"]], my:["ဆူညံသံများသောအလုပ်တွင် ဘာဝတ်ရမလဲ။",["နားပိတ်","ဦးထုပ်","ဘာမှမဝတ်"]], answer:0 },
  { th:["ถ้าต้องทำงานกับสารเคมีควรใส่อะไร?",["แว่น + ถุงมือ","รองเท้าแตะ","ไม่มีอะไร"]], en:["What should be worn when working with chemicals?",["Safety glasses and gloves","Sandals","Nothing"]], ja:["化学物質を扱うときの保護具は？",["保護メガネと手袋","サンダル","何もなし"]], my:["ဓာတုပစ္စည်းနှင့်အလုပ်တွင် ဘာဝတ်ရမလဲ။",["မျက်မှန်နှင့်လက်အိတ်","ဖိနပ်ပါး","ဘာမှမဝတ်"]], answer:0 },
  { th:["ถ้าพบคนหมดสติควรทำอย่างไร?",["เขย่าตัวแรง ๆ","แจ้ง Safety","ปล่อยไว้"]], en:["What should you do if a person is unconscious?",["Shake the person strongly","Notify Safety","Leave the person"]], ja:["意識のない人を発見したら？",["強く揺さぶる","Safetyへ連絡","放置する"]], my:["သတိလစ်သူတွေ့လျှင်။",["ပြင်းပြင်းလှုပ်မည်","Safety ကိုအကြောင်းကြားမည်","ထားခဲ့မည်"]], answer:1 },
  { th:["ถ้าต้องใช้เครื่องมือไฟฟ้าควรทำอะไร?",["ตรวจสายไฟก่อนใช้","ใช้ทันที","ใช้ตอนเปียกน้ำ"]], en:["What should be done before using an electrical tool?",["Inspect the cable","Use it immediately","Use it while wet"]], ja:["電動工具使用前にすることは？",["電線を点検","すぐ使用","濡れた状態で使用"]], my:["လျှပ်စစ်ကိရိယာအသုံးမပြုမီ။",["ကြိုးကိုစစ်မည်","ချက်ချင်းသုံးမည်","စိုနေချိန်သုံးမည်"]], answer:0 },
  { th:["ถ้าต้องเดินในพื้นที่มืดควรทำอย่างไร?",["ใช้ไฟฉาย","เดินไปเลย","วิ่ง"]], en:["What should you do in a dark area?",["Use a flashlight","Keep walking without light","Run"]], ja:["暗い場所ではどうしますか？",["懐中電灯を使う","そのまま歩く","走る"]], my:["မှောင်သောနေရာတွင်။",["ဓာတ်မီးသုံးမည်","ဒီအတိုင်းလျှောက်မည်","ပြေးမည်"]], answer:0 },
  { th:["ถ้าต้องทำงานใกล้รถยกควรทำอย่างไร?",["เดินตัดหน้า","รักษาระยะห่าง","ยืนข้างรถ"]], en:["What should you do near a forklift?",["Walk in front of it","Keep a safe distance","Stand beside it"]], ja:["フォークリフト付近で作業するときは？",["前を横切る","安全距離を保つ","車両の横に立つ"]], my:["ဖော့ကလစ်အနီးအလုပ်လုပ်ရာတွင်။",["ရှေ့မှဖြတ်မည်","လုံခြုံသောအကွာအဝေးထားမည်","ကားဘေးရပ်မည်"]], answer:1 },
  { th:["ถ้าต้องทำงานอากาศร้อนควรทำอย่างไร?",["พักเป็นระยะ","ทำต่อจนเสร็จ","ไม่ต้องพัก"]], en:["What should you do when working in hot conditions?",["Take regular breaks","Continue until finished","Do not take breaks"]], ja:["暑い環境で作業するときは？",["定期的に休憩","終わるまで続ける","休憩しない"]], my:["ပူသောနေရာတွင်အလုပ်လုပ်ရာတွင်။",["ပုံမှန်အနားယူမည်","ပြီးသည်အထိဆက်လုပ်မည်","မနားမည်"]], answer:0 },
  { th:["ถ้าพบสิ่งผิดปกติควรทำอย่างไร?",["แจ้ง Safety","ปล่อยไว้","ถ่ายรูปลงโซเชียล"]], en:["What should you do if you notice an abnormal condition?",["Notify Safety","Ignore it","Post a photo on social media"]], ja:["異常を発見したら？",["Safetyへ連絡","放置する","SNSへ投稿"]], my:["မမှန်ကန်သောအခြေအနေတွေ့လျှင်။",["Safety ကိုအကြောင်းကြားမည်","ထားခဲ့မည်","လူမှုကွန်ရက်တင်မည်"]], answer:0 }
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
    ["🇲🇲", "မြန်မာဘာသာ", "Myanmar", "my", THEME.green]
  ];
  return {
    type: "flex",
    altText: "เลือกภาษา / Select Language",
    contents: {
      type: "bubble", size: "mega",
      styles: { body: { backgroundColor: THEME.canvas } },
      header: titleBlock("🌐", "4 LANGUAGES", "เลือกภาษา / Select Language", "ไทย • English • 日本語 • မြန်မာ", THEME.navy),
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

function menuFlex(title,subtitle,icon,items,color=THEME.navy){return{type:"flex",altText:title,contents:{type:"bubble",size:"mega",styles:{body:{backgroundColor:THEME.canvas}},header:titleBlock(icon,"SODICK SAFETY",title,subtitle,color),body:{type:"box",layout:"vertical",paddingAll:"18px",spacing:"sm",contents:items.map(i=>actionCard(i.icon,i.title,i.subtitle,i.type==="uri"?{type:"uri",label:i.title.slice(0,20),uri:i.value}:{type:"message",label:i.title.slice(0,20),text:i.value},i.color||THEME.blue))}}};}
function menuDelivery(){return menuFlex("ผู้รับ–ส่งสินค้า","DELIVERY VISITOR","📦",[
  {icon:"▶️",title:"วิดีโออบรม",subtitle:"Safety training video",type:"uri",value:"https://drive.google.com/file/d/1bz2qUynfvSFNuS3FoM1iGcLIn3Z8m0fb/view?usp=sharing",color:THEME.red},
  {icon:"📝",title:"ทำแบบทดสอบ",subtitle:"Start safety exam",type:"message",value:"ทำแบบทดสอบ",color:THEME.blue},
  {icon:"📄",title:"เอกสารบันทึกการอบรม",subtitle:"Training record document",type:"uri",value:"https://drive.google.com/file/d/1QWnOr9Cmkdbsmp0byIlocZmmVIjcPqWe/view?usp=drive_link",color:THEME.green}],THEME.blue);}
function menuVendor(){return menuFlex("ผู้เข้ามาทำงาน–แก้ไขงาน","CONTRACTOR / VENDOR","🛠️",[
  {icon:"▶️",title:"วิดีโออบรม",subtitle:"Safety training video",type:"uri",value:"https://drive.google.com/file/d/1bz2qUynfvSFNuS3FoM1iGcLIn3Z8m0fb/view?usp=sharing",color:THEME.red},
  {icon:"📝",title:"ทำแบบทดสอบ",subtitle:"Start safety exam",type:"message",value:"ทำแบบทดสอบ",color:THEME.blue},
  {icon:"📄",title:"เอกสารบันทึกการอบรม",subtitle:"Training record document",type:"uri",value:"https://drive.google.com/file/d/1QWnOr9Cmkdbsmp0byIlocZmmVIjcPqWe/view?usp=drive_link",color:THEME.green},
  {icon:"📋",title:"ใบขอเข้ามาทำงาน",subtitle:"Work entry request",type:"uri",value:"https://drive.google.com/file/d/1m9zT6FEHTFs_GdXIcKrr3WCngONKn4OV/view?usp=drive_link",color:THEME.orange},
  {icon:"🔧",title:"ใบตรวจสอบเครื่องมือ",subtitle:"Tool inspection form",type:"uri",value:"https://drive.google.com/file/d/1HJxEXai6--EduOXJTDGtvl0-Sfu5_k7c/view?usp=drive_link",color:THEME.purple}],THEME.purple);}
function trainingMenu(){return menuFlex("สื่ออบรมผู้รับเหมา","CONTRACTOR TRAINING","🎓",[
  {icon:"01",title:"ความปลอดภัยในการทำงาน",subtitle:"General workplace safety",type:"uri",value:"https://youtu.be/MGbZGFtQCLQ?si=S7Xg3pxeOqkQCyx5",color:THEME.blue},
  {icon:"02",title:"ความปลอดภัยงานเชื่อม",subtitle:"Welding safety",type:"uri",value:"https://youtu.be/gpUlIKyjSQM?si=QctBbVhlth2bbmDt",color:THEME.purple},
  {icon:"03",title:"การใช้ถังดับเพลิง",subtitle:"Fire extinguisher",type:"uri",value:"https://youtu.be/54FuqMUGlOQ?si=4-9RT_1fmtGnMg0f",color:THEME.red},
  {icon:"04",title:"ขับขี่ปลอดภัย",subtitle:"Safe driving",type:"uri",value:"https://youtu.be/jUPDb2aHWSM?si=x2wPrp2DGoluXvuF",color:THEME.orange},
  {icon:"05",title:"การแยกขยะ",subtitle:"Waste segregation",type:"uri",value:"https://youtu.be/5HI55e0oL_M?si=Hg5EdfhXNIaeKlP9",color:THEME.green}],THEME.green);}
function contractorMainMenuFlex(){return menuFlex("ระบบบริการผู้รับเหมา","CONTRACTOR SERVICE","🦺",[
  {icon:"📦",title:"ผู้รับ–ส่งสินค้า",subtitle:"Delivery visitor",type:"message",value:"ผู้รับส่งสินค้า",color:THEME.blue},
  {icon:"🛠️",title:"ผู้เข้ามาทำงาน–แก้ไขงาน",subtitle:"Contractor / Vendor",type:"message",value:"ผู้แก้ไขงาน",color:THEME.purple},
  {icon:"🎓",title:"สื่อสำหรับอบรมผู้รับเหมา",subtitle:"Safety training media",type:"message",value:"สื่ออบรมผู้รับเหมา",color:THEME.green},
  {icon:"🪪",title:"ขอบัตรผู้รับเหมาย้อนหลัง",subtitle:"Download contractor card",type:"message",value:"ดาวน์โหลดบัตร",color:THEME.orange}],THEME.navy);}
function certificateFlex(url){return{type:"flex",altText:"บัตรผู้รับเหมา",contents:{type:"bubble",size:"mega",hero:{type:"image",url,size:"full",aspectRatio:"20:13",aspectMode:"cover"},body:{type:"box",layout:"vertical",paddingAll:"20px",contents:[{type:"text",text:"บัตรผู้รับเหมา / Contractor Card",size:"lg",weight:"bold",color:THEME.navy,align:"center"}]},footer:{type:"box",layout:"vertical",paddingAll:"18px",contents:[{type:"button",style:"primary",color:THEME.green,action:{type:"uri",label:"เปิดและดาวน์โหลดบัตร",uri:url}}]}}};}
function contactMenuFlex(){return menuFlex("ติดต่อทีม Safety","CONTACT & SUPPORT","☎️",[{icon:"📞",title:"Safety Hotline",subtitle:"โทรติดต่อเจ้าหน้าที่",type:"message",value:"Safety Hotline",color:THEME.blue},{icon:"📣",title:"แจ้งปัญหา",subtitle:"Report an issue",type:"message",value:"แจ้งปัญหา",color:THEME.orange}],THEME.navy);}
function hotlineFlex(){return menuFlex("Safety Hotline","EMERGENCY CONTACT","📞",[
  {icon:"☎",title:"Safety Manager",subtitle:"081-376-5583",type:"uri",value:"tel:0813765583",color:THEME.red},
  {icon:"☎",title:"Safety Factory 1",subtitle:"061-645-5095",type:"uri",value:"tel:0616455095",color:THEME.blue},
  {icon:"☎",title:"Safety Factory 2",subtitle:"083-237-4357",type:"uri",value:"tel:0832374357",color:THEME.purple},
  {icon:"☎",title:"Safety Factory 1",subtitle:"081-695-4474",type:"uri",value:"tel:0816954474",color:THEME.green},
  {icon:"☎",title:"Environment",subtitle:"094-938-0425",type:"uri",value:"tel:0949380425",color:THEME.orange}],THEME.red);}
function issueFormFlex(){return{type:"flex",altText:"แจ้งปัญหา",contents:{type:"bubble",size:"mega",header:titleBlock("📣","REPORT AN ISSUE","แจ้งปัญหา","ข้อความถัดไปจะส่งหา Safety 1 ครั้ง",THEME.orange),body:{type:"box",layout:"vertical",paddingAll:"20px",spacing:"lg",contents:[{type:"text",text:"กรุณาพิมพ์: รายละเอียดปัญหา / ชื่อ / บริษัท / เบอร์ติดต่อกลับ",wrap:true,size:"sm",color:THEME.ink},{type:"text",text:"ข้อความทั่วไปและคำตอบข้อสอบจะไม่ถูกส่งหา ADMIN",wrap:true,size:"xs",color:THEME.muted,align:"center"}]},footer:{type:"box",layout:"vertical",paddingAll:"18px",contents:[{type:"button",style:"secondary",action:{type:"message",label:"ยกเลิกการแจ้ง",text:"ยกเลิกการแจ้งปัญหา"}}]}}};}
function issueAdminFlex(reportText,userId){return{type:"flex",altText:"มีผู้ใช้งานแจ้งปัญหาใหม่",contents:{type:"bubble",size:"mega",header:titleBlock("🔔","NEW ISSUE","แจ้งปัญหาใหม่","สถานะ: รอตรวจสอบ",THEME.red),body:{type:"box",layout:"vertical",paddingAll:"20px",spacing:"lg",contents:[dataRow("รายละเอียด",safeText(reportText,1500)),{type:"text",text:`LINE User ID: ${userId}`,size:"xxs",color:THEME.muted,wrap:true}]}}};}
function issueSuccessFlex(){return{type:"flex",altText:"รับแจ้งปัญหาแล้ว",contents:{type:"bubble",size:"mega",body:{type:"box",layout:"vertical",paddingAll:"24px",spacing:"lg",alignItems:"center",backgroundColor:THEME.greenSoft,contents:[{type:"text",text:"✅",size:"3xl"},{type:"text",text:"รับแจ้งเรียบร้อยแล้ว",size:"xl",weight:"bold",color:THEME.green},{type:"text",text:"ส่งรายละเอียดให้ทีม Safety แล้ว",size:"sm",color:THEME.ink}]}}};}
function fallbackFlex(){return menuFlex("ยังไม่พบคำตอบ","HELP CENTER","💬",[{icon:"🦺",title:"เมนูผู้รับเหมา",subtitle:"Contractor menu",type:"message",value:"เมนูผู้รับเหมา",color:THEME.blue},{icon:"☎️",title:"ติดต่อทีม Safety",subtitle:"Contact Safety",type:"message",value:"ติดต่อทีมเซฟตี้",color:THEME.green},{icon:"📍",title:"แผนที่โรงงาน",subtitle:"Factory map",type:"message",value:"แผนที่",color:THEME.orange}],THEME.navy);}
const mapFlex=menuFlex("Sodick Thailand","FACTORY MAP","📍",[{icon:"1",title:"โรงงาน 1 / Factory 1",subtitle:"Google Maps",type:"uri",value:"https://maps.app.goo.gl/ycBgWvYA8ze8L6Hj8",color:THEME.blue},{icon:"2",title:"โรงงาน 2 / Factory 2",subtitle:"Google Maps",type:"uri",value:"https://maps.app.goo.gl/keZxD798z9ZwKXE7A",color:THEME.green}],THEME.blue);
const phoneFlex=menuFlex("เบอร์โทรโรงงาน","FACTORY CONTACT","☎️",[{icon:"1",title:"โรงงาน 1",subtitle:"02-529-2450-6 ต่อ 102 / 127 / 129",type:"uri",value:"tel:025292450",color:THEME.blue},{icon:"2",title:"โรงงาน 2",subtitle:"02-529-3200-6 ต่อ 137",type:"uri",value:"tel:025293200",color:THEME.green}],THEME.green);

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
async function sendToGoogleSheet(userId,passStatus,answers=[]){const state=userState.get(userId);if(!state)return false;const payload={userId,fullname:state.formData.fullname,position:state.formData.position,phone:state.formData.phone,idcard:state.formData.idcard,company:state.formData.company,score:state.score,result:passStatus,answers:Array.from({length:30},(_,i)=>answers[i]??"")};try{const r=await axios.post(GOOGLE_SCRIPT_URL,payload,{headers:{"Content-Type":"application/json"},timeout:30000});return r.status>=200&&r.status<300;}catch(e){console.error("Google Sheet error:",e.response?.data||e.message);return false;}}
async function getCertificateUrl(userId){try{const r=await axios.get(GOOGLE_SCRIPT_URL,{params:{mode:"get",userId},timeout:30000});const url=typeof r.data==="string"?r.data.trim():r.data?.url;return /^https:\/\//i.test(url||"")?url:null;}catch(e){console.error("Certificate error:",e.response?.data||e.message);return null;}}
async function handleDownloadCertificate(event,userId){const url=await getCertificateUrl(userId);return url?reply(event,certificateFlex(url)):reply(event,textMessage("ยังไม่พบบัตรของคุณ กรุณารอระบบสร้างบัตรหรือติดต่อทีม Safety"));}
async function beginIssueReport(event,userId){clearUserState(userId);userState.set(userId,{mode:"report_issue",locked:false});touchState(userId);return reply(event,issueFormFlex());}
async function handleIssueReport(event,userId,text){const state=userState.get(userId);if(!state||state.mode!=="report_issue")return false;const report=String(text||"").trim();if(normalize(report)===normalize("ยกเลิกการแจ้งปัญหา")){clearUserState(userId);await reply(event,textMessage("ยกเลิกการแจ้งปัญหาเรียบร้อยแล้ว"));return true;}if(event.type!=="message"||event.message?.type!=="text"||report.length<10){await reply(event,textMessage("กรุณาพิมพ์รายละเอียดปัญหาอย่างน้อย 10 ตัวอักษร"));return true;}if(state.locked)return true;state.locked=true;try{await client.pushMessage(ADMIN_USER_ID,issueAdminFlex(report,userId));clearUserState(userId);await reply(event,issueSuccessFlex());}catch(e){console.error("Issue push error:",e.response?.data||e.message);clearUserState(userId);await reply(event,textMessage("ไม่สามารถส่งข้อมูลได้ กรุณาติดต่อทีม Safety ทางโทรศัพท์"));}return true;}

function cloneSession(state) {
  return JSON.parse(JSON.stringify(state));
}

function pauseCurrentSession(userId) {
  const state = userState.get(userId);
  if (!state || !["language", "job", "form", "review", "exam"].includes(state.mode)) return false;
  pausedSessions.set(userId, { state: cloneSession(state), pausedAt: Date.now() });
  clearUserState(userId);
  return true;
}

function discardAllSessions(userId) {
  clearUserState(userId);
  pausedSessions.delete(userId);
}

function resumePromptFlex(saved) {
  const state = saved.state;
  const total = examQuestions.length;
  const completed = state.mode === "exam" ? Math.max(0, state.currentQuestion - 1) : 0;
  const percent = Math.round((completed / total) * 100);
  return {
    type: "flex", altText: tr(state, "resumeTitle"),
    contents: { type: "bubble", size: "mega", styles: { body: { backgroundColor: THEME.canvas }, footer: { backgroundColor: THEME.canvas } },
      header: titleBlock("⏸️", "SAVED PROGRESS", tr(state,"resumeTitle"), tr(state,"resumeSub"), THEME.orange),
      body: { type: "box", layout: "vertical", paddingAll: "20px", spacing: "lg", contents: [
        { type: "text", text: `${completed}/${total}`, size: "3xl", weight: "bold", color: THEME.orange, align: "center" },
        { type: "text", text: `${tr(state,"progress")} ${percent}%`, size: "sm", color: THEME.muted, align: "center" },
        { type: "box", layout: "vertical", height: "9px", cornerRadius: "5px", backgroundColor: "#DDE8F0", contents: [
          { type: "box", layout: "vertical", width: `${Math.max(2, percent)}%`, height: "9px", cornerRadius: "5px", backgroundColor: THEME.gold, contents: [] }
        ]}
      ]},
      footer: { type: "box", layout: "vertical", paddingAll: "18px", spacing: "sm", contents: [
        { type: "button", style: "primary", color: THEME.green, action: { type: "postback", label: tr(state,"continueExam").slice(0,20), data: "resume=continue", displayText: tr(state,"continueExam") } },
        { type: "button", style: "secondary", action: { type: "postback", label: tr(state,"startNew").slice(0,20), data: "resume=new", displayText: tr(state,"startNew") } }
      ]}
    }
  };
}

function detailFlex(state, type) {
  const lang = getLanguage(state);
  const copy = {
    th: ["ข้อมูลเพิ่มเติม", "• แบบทดสอบ 30 ข้อ\n• เกณฑ์ผ่าน 24 คะแนน\n• ระบบบันทึกผลเมื่อสอบผ่าน\n• สามารถพักและกลับมาทำต่อได้"],
    en: ["More Information", "• 30 questions\n• Passing score: 24\n• Results are saved after passing\n• You can pause and continue later"],
    ja: ["詳細情報", "• 全30問\n• 合格点24点\n• 合格後に結果を保存\n• 一時停止して続きから再開可能"],
    my: ["အချက်အလက်အသေးစိတ်", "• မေးခွန်း ၃၀\n• အောင်မှတ် ၂၄\n• အောင်ပြီးမှရလဒ်သိမ်းမည်\n• ခေတ္တနားပြီး ဆက်လုပ်နိုင်သည်"]
  }[lang];
  return { type:"flex", altText:copy[0], contents:{ type:"bubble", size:"mega", header:titleBlock("ℹ️","DETAILS",copy[0],"Sodick Safety",THEME.blue), body:{type:"box",layout:"vertical",paddingAll:"20px",contents:[{type:"text",text:copy[1],wrap:true,size:"sm",color:THEME.ink}]}}};
}

async function renderSavedSession(event, userId, state) {
  userState.set(userId, state);
  touchState(userId);
  if (state.mode === "language") return reply(event, languageSelectFlex());
  if (state.mode === "job") return reply(event, [pdpaFlex(state), jobPositionFlex(state)]);
  if (state.mode === "form") return reply(event, formQuestionFlex(state));
  if (state.mode === "review") return reply(event, reviewFlex(state));
  if (state.mode === "exam") return reply(event, examFlex(examQuestions[state.currentQuestion - 1], state.currentQuestion, state));
  return reply(event, languageSelectFlex());
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
    await reply(event, [textMessage("ยกเลิกขั้นตอนปัจจุบันเรียบร้อยแล้วครับ"), contractorMainMenuFlex()]);
    return true;
  }

  // คำสั่งจาก Rich Menu ทำงานได้ทันที และยกเลิก Session เดิม
  if (msg.includes(normalize("ผู้รับส่งสินค้า"))) {
    return resetAndReply(menuDelivery());
  }

  if (msg.includes(normalize("ผู้แก้ไขงาน"))) {
    return resetAndReply(menuVendor());
  }

  if (
    msg.includes(normalize("สื่ออบรมผู้รับเหมา")) ||
    (
      msg.includes(normalize("สื่อ")) &&
      msg.includes(normalize("อบรม")) &&
      msg.includes(normalize("ผู้รับเหมา"))
    )
  ) {
    return resetAndReply(trainingMenu());
  }

  if (msg.includes(normalize("ดาวน์โหลดบัตร"))) {
    pauseCurrentSession(userId);
    await handleDownloadCertificate(event, userId);
    return true;
  }

  if (msg.includes(normalize("ติดต่อทีมเซฟตี้"))) {
    return resetAndReply(contactMenuFlex());
  }

  if (
    msg.includes("safetyhotline") ||
    (msg.includes("safety") && msg.includes("hotline"))
  ) {
    return resetAndReply(hotlineFlex());
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
    return resetAndReply([mapFlex, phoneFlex]);
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
    return resetAndReply(contractorMainMenuFlex());
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

  return reply(event, fallbackFlex());
}

app.get(["/","/webhook","/health"],(req,res)=>res.status(200).json({ok:true,service:"Sodick Safety Bot",version:APP_VERSION}));
app.post("/webhook",line.middleware(config),async(req,res)=>{try{const events=Array.isArray(req.body.events)?req.body.events:[];await Promise.all(events.map(handleEvent));return res.status(200).end();}catch(error){console.error("Webhook error:",error.response?.data||error.stack||error.message);return res.status(200).end();}});
app.listen(PORT,()=>console.log(`Sodick Safety Bot ${APP_VERSION} running on port ${PORT}`));
