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
const APP_VERSION = "3.1.0-richmenu-interrupt";

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
    chooseButton: "กรุณาเลือกจากปุ่มในข้อความล่าสุด"
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
    chooseButton: "Please select an option from the latest message."
  }
};

const JOB_LABELS = {
  Owner: { th: "เจ้าของบริษัท", en: "Owner" }, Supervisor: { th: "ผู้ควบคุมงาน", en: "Supervisor" },
  Engineer: { th: "วิศวกร", en: "Engineer" }, Foreman: { th: "โฟร์แมน", en: "Foreman" },
  Technician: { th: "ช่าง", en: "Technician" }, GeneralWorker: { th: "พนักงานทั่วไป", en: "General Worker" }
};

const userState = new Map();
const inactivityTimers = new Map();
function normalize(v = "") { return String(v).toLowerCase().replace(/\s/g, "").replace(/[–—]/g, "-").trim(); }
function safeText(v, max = 500) { return String(v ?? "").trim().slice(0, max) || "-"; }
function tr(state, key) { const lang = state?.language === "en" ? "en" : "th"; return I18N[lang][key] || I18N.th[key] || key; }
function clearUserState(userId) { userState.delete(userId); const timer = inactivityTimers.get(userId); if (timer) clearTimeout(timer); inactivityTimers.delete(userId); }
function touchState(userId) { const old = inactivityTimers.get(userId); if (old) clearTimeout(old); inactivityTimers.set(userId, setTimeout(() => clearUserState(userId), SESSION_TIMEOUT_MS)); }
function reply(event, messages) { return client.replyMessage(event.replyToken, Array.isArray(messages) ? messages : [messages]); }
function textMessage(text) { return { type: "text", text: safeText(text, 5000) }; }

function titleBlock(icon, eyebrow, title, subtitle, color = THEME.navy) {
  return { type: "box", layout: "horizontal", spacing: "md", paddingAll: "20px", backgroundColor: color, contents: [
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
  { th:["PPE คืออะไร?",["อุปกรณ์ป้องกันอันตรายส่วนบุคคล","รองเท้าธรรมดา","เสื้อผ้าทั่วไป"]], en:["What does PPE mean?",["Personal protective equipment","Ordinary shoes","General clothing"]], answer:0 },
  { th:["หมวกนิรภัยต้องสวมเมื่อไหร่?",["เมื่ออยู่ในพื้นที่ทำงาน","เฉพาะตอนมีผู้จัดการมา","ไม่จำเป็น"]], en:["When must a safety helmet be worn?",["When inside the work area","Only when a manager is present","It is not necessary"]], answer:0 },
  { th:["งานที่สูงคือความสูงตั้งแต่กี่เมตรขึ้นไป?",["1 เมตร","2 เมตร","5 เมตร"]], en:["Work at height starts from what height?",["1 meter","2 meters","5 meters"]], answer:1 },
  { th:["ถังดับเพลิงสีแดงใช้สำหรับดับอะไร?",["ไฟฟ้า","เชื้อเพลิงของเหลว","ไม้/กระดาษ"]], en:["In this test, what is the red fire extinguisher used for?",["Electrical fire","Flammable liquid","Wood / paper"]], answer:2 },
  { th:["หากพบอุบัติเหตุควรทำอย่างไร?",["ถ่ายรูปก่อน","แจ้งทีม Safety ทันที","เดินหนี"]], en:["What should you do if you find an accident?",["Take a photo first","Notify the Safety team immediately","Walk away"]], answer:1 },
  { th:["จะสูบบุหรี่ควรทำอย่างไร?",["สูบตรงไหนก็ได้","สูบในห้องน้ำ","สูบเฉพาะจุดที่กำหนด"]], en:["Where is smoking allowed?",["Anywhere","In the restroom","Only in designated areas"]], answer:2 },
  { th:["การเดินในโรงงานควรเดินตรงไหน?",["เดินในเลนคนเดิน","เดินบนถนนรถยก","เดินตรงไหนก็ได้"]], en:["Where should pedestrians walk in the factory?",["In the pedestrian lane","On the forklift road","Anywhere"]], answer:0 },
  { th:["ถ้าพบสารเคมีหกควรทำอย่างไร?",["เช็ดเอง","แจ้ง Safety","ปล่อยไว้"]], en:["What should you do if chemicals spill?",["Clean it yourself","Notify Safety","Leave it"]], answer:1 },
  { th:["การยกของหนักควรทำอย่างไร?",["ก้มหลังยก","ใช้แรงเต็มที่","ย่อตัวแล้วยก"]], en:["How should a heavy object be lifted?",["Bend the back","Use maximum force","Squat and lift"]], answer:2 },
  { th:["ป้ายเตือนสีเหลืองหมายถึงอะไร?",["ข้อบังคับ","คำเตือน","ห้ามทำ"]], en:["What does a yellow safety sign mean?",["Mandatory action","Warning","Prohibition"]], answer:1 },
  { th:["ป้ายวงกลมสีแดงมีเส้นทับหมายถึงอะไร?",["ควรทำ","ห้ามทำ","ไม่เกี่ยว"]], en:["What does a red circle with a diagonal line mean?",["Recommended","Prohibited","Not relevant"]], answer:1 },
  { th:["ถ้าต้องใช้บันไดควรทำอย่างไร?",["ปีนสองคน","ตรวจสภาพก่อนใช้","ใช้บันไดพัง"]], en:["What should you do before using a ladder?",["Climb with two people","Inspect it before use","Use a damaged ladder"]], answer:1 },
  { th:["ถ้าต้องทำงานเชื่อมต้องมีอุปกรณ์อะไร?",["แว่นเชื่อม","หมวกกันน็อค","รองเท้าแตะ"]], en:["What equipment is required for welding?",["Welding eye protection","Motorcycle helmet","Sandals"]], answer:0 },
  { th:["ถ้าต้องทำงานในที่อับอากาศต้องมีอะไร?",["ใบอนุญาต","ไฟฉาย","น้ำดื่ม"]], en:["What is required for confined-space work?",["A work permit","A flashlight","Drinking water"]], answer:0 },
  { th:["รถยกมีสิทธิ์ในถนนโรงงานมากกว่าคนเดินหรือไม่?",["ใช่","ไม่ใช่","แล้วแต่เวลา"]], en:["Does a forklift always have more right of way than pedestrians?",["Yes","No","It depends on the time"]], answer:1 },
  { th:["ถ้าพบสายไฟชำรุดควรทำอย่างไร?",["จับดู","แจ้งช่างไฟ","ใช้ต่อ"]], en:["What should you do with a damaged electrical cable?",["Touch it","Notify an electrician","Continue using it"]], answer:1 },
  { th:["ถ้าต้องตัดเหล็กควรใส่อุปกรณ์อะไร?",["แว่นตานิรภัย","หมวกแก๊ป","ไม่มีอะไร"]], en:["What should be worn when cutting metal?",["Safety glasses","A cap","Nothing"]], answer:0 },
  { th:["ถังดับเพลิงต้องตรวจทุกกี่เดือน?",["1 เดือน","3 เดือน","6 เดือน"]], en:["According to this training, how often is a fire extinguisher inspected?",["Every month","Every 3 months","Every 6 months"]], answer:2 },
  { th:["ถ้าต้องทำงานบนที่สูงต้องใช้อุปกรณ์อะไร?",["รองเท้าแตะ","เข็มขัดกันตก","หมวกแก๊ป"]], en:["What equipment is required for work at height?",["Sandals","Fall-protection harness","A cap"]], answer:1 },
  { th:["การเดินในพื้นที่การผลิตควรใส่อะไร?",["รองเท้าเซฟตี้","รองเท้าแตะ","รองเท้าผ้าใบ"]], en:["What footwear is required in the production area?",["Safety shoes","Sandals","Training shoes"]], answer:0 },
  { th:["ถ้าต้องขนของหนักควรทำอย่างไร?",["ใช้รถเข็น","ยกเอง","ลากไปกับพื้น"]], en:["How should heavy materials be transported?",["Use a trolley","Carry them alone","Drag them on the floor"]], answer:0 },
  { th:["ถ้าพบไฟไหม้ควรทำอย่างไร?",["วิ่งหนี","แจ้ง 102/127/129","ถ่ายคลิป"]], en:["What should you do if you find a fire?",["Run away","Call extensions 102 / 127 / 129","Record a video"]], answer:1 },
  { th:["ถ้าต้องทำงานเสียงดังควรใส่อะไร?",["ที่อุดหู","หมวกแก๊ป","ไม่มีอะไร"]], en:["What should be worn in a noisy work area?",["Hearing protection","A cap","Nothing"]], answer:0 },
  { th:["ถ้าต้องทำงานกับสารเคมีควรใส่อะไร?",["แว่น + ถุงมือ","รองเท้าแตะ","ไม่มีอะไร"]], en:["What should be worn when working with chemicals?",["Safety glasses and gloves","Sandals","Nothing"]], answer:0 },
  { th:["ถ้าพบคนหมดสติควรทำอย่างไร?",["เขย่าตัวแรง ๆ","แจ้ง Safety","ปล่อยไว้"]], en:["What should you do if a person is unconscious?",["Shake the person strongly","Notify Safety","Leave the person"]], answer:1 },
  { th:["ถ้าต้องใช้เครื่องมือไฟฟ้าควรทำอะไร?",["ตรวจสายไฟก่อนใช้","ใช้ทันที","ใช้ตอนเปียกน้ำ"]], en:["What should be done before using an electrical tool?",["Inspect the cable","Use it immediately","Use it while wet"]], answer:0 },
  { th:["ถ้าต้องเดินในพื้นที่มืดควรทำอย่างไร?",["ใช้ไฟฉาย","เดินไปเลย","วิ่ง"]], en:["What should you do in a dark area?",["Use a flashlight","Keep walking without light","Run"]], answer:0 },
  { th:["ถ้าต้องทำงานใกล้รถยกควรทำอย่างไร?",["เดินตัดหน้า","รักษาระยะห่าง","ยืนข้างรถ"]], en:["What should you do near a forklift?",["Walk in front of it","Keep a safe distance","Stand beside it"]], answer:1 },
  { th:["ถ้าต้องทำงานอากาศร้อนควรทำอย่างไร?",["พักเป็นระยะ","ทำต่อจนเสร็จ","ไม่ต้องพัก"]], en:["What should you do when working in hot conditions?",["Take regular breaks","Continue until finished","Do not take breaks"]], answer:0 },
  { th:["ถ้าพบสิ่งผิดปกติควรทำอย่างไร?",["แจ้ง Safety","ปล่อยไว้","ถ่ายรูปลงโซเชียล"]], en:["What should you do if you notice an abnormal condition?",["Notify Safety","Ignore it","Post a photo on social media"]], answer:0 }
];

function qText(question, lang) { return question[lang === "en" ? "en" : "th"][0]; }
function qChoices(question, lang) { return question[lang === "en" ? "en" : "th"][1]; }

function languageSelectFlex() {
  return { type: "flex", altText: "เลือกภาษา / Select Language", contents: { type: "bubble", size: "mega", styles: { body: { backgroundColor: THEME.canvas } },
    header: titleBlock("🌐", "LANGUAGE", "เลือกภาษา / Select Language", "ใช้ภาษาที่เลือกจนจบแบบทดสอบ", THEME.navy),
    body: { type: "box", layout: "vertical", paddingAll: "20px", spacing: "md", contents: [
      actionCard("🇹🇭", "ภาษาไทย", "ทำแบบทดสอบเป็นภาษาไทย", { type: "postback", label: "ภาษาไทย", data: "language=th", displayText: "ภาษาไทย" }, THEME.blue),
      actionCard("🇬🇧", "English", "Take the exam in English", { type: "postback", label: "English", data: "language=en", displayText: "English" }, THEME.purple)
    ]}
  }};
}

function pdpaFlex(state) {
  const en = state?.language === "en";
  return { type: "flex", altText: en ? "Privacy Notice" : "นโยบายคุ้มครองข้อมูลส่วนบุคคล", contents: { type: "bubble", size: "mega", styles: { body: { backgroundColor: THEME.canvas } },
    header: titleBlock("🛡️", "PRIVACY NOTICE", en ? "Privacy Notice" : "นโยบาย PDPA", en ? "Personal Data Protection" : "การคุ้มครองข้อมูลส่วนบุคคล", THEME.navy),
    body: { type: "box", layout: "vertical", paddingAll: "20px", spacing: "lg", contents: [
      { type: "text", text: en ? "The company collects personal data for identity verification, contractor cards, training records, and safety operations." : "บริษัทเก็บข้อมูลเพื่อยืนยันตัวตน ออกบัตร บันทึกผลอบรม และสนับสนุนระบบความปลอดภัย", wrap: true, color: THEME.ink, size: "sm" },
      { type: "button", style: "primary", color: THEME.blue, action: { type: "uri", label: en ? "Read Full Policy" : "อ่านนโยบายฉบับเต็ม", uri: "https://www.sodick.co.th/Privacy%20Policy/AN-2022-0103-Announcement%20Personal%20Data%20Policy%20(THA).pdf" } }
    ]}
  }};
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
  const result=resultFlex(score,total,pass,state); if(pass){const saved=await sendToGoogleSheet(userId,"ผ่าน",state.answers);clearUserState(userId);if(!saved)return reply(event,[result,textMessage(state.language==="en"?"⚠️ The result could not be saved. Please contact Safety.":"⚠️ บันทึกผลไม่สำเร็จ กรุณาติดต่อทีม Safety")]);return reply(event,result);} clearUserState(userId);return reply(event,result);
}
async function sendToGoogleSheet(userId,passStatus,answers=[]){const state=userState.get(userId);if(!state)return false;const payload={userId,fullname:state.formData.fullname,position:state.formData.position,phone:state.formData.phone,idcard:state.formData.idcard,company:state.formData.company,score:state.score,result:passStatus,answers:Array.from({length:30},(_,i)=>answers[i]??"")};try{const r=await axios.post(GOOGLE_SCRIPT_URL,payload,{headers:{"Content-Type":"application/json"},timeout:30000});return r.status>=200&&r.status<300;}catch(e){console.error("Google Sheet error:",e.response?.data||e.message);return false;}}
async function getCertificateUrl(userId){try{const r=await axios.get(GOOGLE_SCRIPT_URL,{params:{mode:"get",userId},timeout:30000});const url=typeof r.data==="string"?r.data.trim():r.data?.url;return /^https:\/\//i.test(url||"")?url:null;}catch(e){console.error("Certificate error:",e.response?.data||e.message);return null;}}
async function handleDownloadCertificate(event,userId){const url=await getCertificateUrl(userId);return url?reply(event,certificateFlex(url)):reply(event,textMessage("ยังไม่พบบัตรของคุณ กรุณารอระบบสร้างบัตรหรือติดต่อทีม Safety"));}
async function beginIssueReport(event,userId){clearUserState(userId);userState.set(userId,{mode:"report_issue",locked:false});touchState(userId);return reply(event,issueFormFlex());}
async function handleIssueReport(event,userId,text){const state=userState.get(userId);if(!state||state.mode!=="report_issue")return false;const report=String(text||"").trim();if(normalize(report)===normalize("ยกเลิกการแจ้งปัญหา")){clearUserState(userId);await reply(event,textMessage("ยกเลิกการแจ้งปัญหาเรียบร้อยแล้ว"));return true;}if(event.type!=="message"||event.message?.type!=="text"||report.length<10){await reply(event,textMessage("กรุณาพิมพ์รายละเอียดปัญหาอย่างน้อย 10 ตัวอักษร"));return true;}if(state.locked)return true;state.locked=true;try{await client.pushMessage(ADMIN_USER_ID,issueAdminFlex(report,userId));clearUserState(userId);await reply(event,issueSuccessFlex());}catch(e){console.error("Issue push error:",e.response?.data||e.message);clearUserState(userId);await reply(event,textMessage("ไม่สามารถส่งข้อมูลได้ กรุณาติดต่อทีม Safety ทางโทรศัพท์"));}return true;}

async function handleNavigationInterrupt(event, userId, msg) {
  if (event.type !== "message" || !msg) return false;

  const resetAndReply = async (messages) => {
    clearUserState(userId);
    await reply(event, messages);
    return true;
  };

  // เริ่มข้อสอบใหม่ได้ทันที ไม่ว่าจะค้างอยู่ขั้นตอนไหน
  if (msg.includes(normalize("ทำแบบทดสอบ"))) {
    clearUserState(userId);
    userState.set(userId, {
      mode: "language",
      language: null,
      step: 0,
      formData: {},
      currentQuestion: 1,
      score: 0,
      answers: [],
      locked: false
    });
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
    return resetAndReply([
      textMessage("ยกเลิกขั้นตอนปัจจุบันเรียบร้อยแล้วครับ"),
      contractorMainMenuFlex()
    ]);
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
    clearUserState(userId);
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
    clearUserState(userId);
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

  // ถ้าไม่ใช่คำสั่งนำทาง จึงประมวลผล State ปัจจุบัน
  const state = userState.get(userId);

  if (state?.mode === "report_issue") {
    return handleIssueReport(event, userId, text);
  }

  if (state?.mode === "language") {
    if (data.startsWith("language=")) {
      state.language = data.slice(9) === "en" ? "en" : "th";
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
