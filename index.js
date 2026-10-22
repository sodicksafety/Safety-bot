"use strict";

require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");
const axios = require("axios");

const app = express();

/* ==================================================
   CONFIGURATION
================================================== */
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

const THEME = {
  navy: "#092F55",
  blue: "#1769AA",
  sky: "#EAF5FD",
  cyan: "#5BB8EA",
  gold: "#F2C14E",
  green: "#15966A",
  greenSoft: "#E9F9F2",
  red: "#C43D4B",
  redSoft: "#FFF0F2",
  orange: "#E8892E",
  orangeSoft: "#FFF5E8",
  ink: "#18364D",
  muted: "#647D90",
  line: "#D8E5EE",
  white: "#FFFFFF",
  canvas: "#F4F8FB"
};

/* ==================================================
   STATE
   Note: state is in memory. A Render restart clears it.
================================================== */
const userState = new Map();
const inactivityTimers = new Map();

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[–—]/g, "-")
    .trim();
}

function safeText(value, max = 500) {
  return String(value ?? "").trim().slice(0, max) || "-";
}

function clearUserState(userId) {
  userState.delete(userId);
  const timer = inactivityTimers.get(userId);
  if (timer) clearTimeout(timer);
  inactivityTimers.delete(userId);
}

function touchState(userId) {
  const oldTimer = inactivityTimers.get(userId);
  if (oldTimer) clearTimeout(oldTimer);
  const timer = setTimeout(() => clearUserState(userId), SESSION_TIMEOUT_MS);
  inactivityTimers.set(userId, timer);
}

function reply(event, messages) {
  const list = Array.isArray(messages) ? messages : [messages];
  return client.replyMessage(event.replyToken, list);
}

function textMessage(text) {
  return { type: "text", text: safeText(text, 5000) };
}

function titleBlock(icon, eyebrow, title, subtitle, color = THEME.navy) {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "md",
    paddingAll: "20px",
    backgroundColor: color,
    contents: [
      {
        type: "box",
        layout: "vertical",
        width: "52px",
        height: "52px",
        cornerRadius: "18px",
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        contents: [{ type: "text", text: icon, size: "xl", align: "center" }]
      },
      {
        type: "box",
        layout: "vertical",
        flex: 1,
        justifyContent: "center",
        contents: [
          { type: "text", text: eyebrow, size: "xxs", weight: "bold", color: "#BFD8EA" },
          { type: "text", text: title, size: "xl", weight: "bold", color: "#FFFFFF", wrap: true, margin: "xs" },
          { type: "text", text: subtitle, size: "xs", color: "#DCEAF4", wrap: true, margin: "xs" }
        ]
      }
    ]
  };
}

function actionCard(icon, title, subtitle, action, accent = THEME.blue, background = THEME.white) {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "md",
    paddingAll: "15px",
    margin: "sm",
    cornerRadius: "16px",
    backgroundColor: background,
    borderColor: THEME.line,
    borderWidth: "1px",
    action,
    contents: [
      {
        type: "box",
        layout: "vertical",
        width: "44px",
        height: "44px",
        cornerRadius: "14px",
        backgroundColor: accent,
        justifyContent: "center",
        alignItems: "center",
        contents: [{ type: "text", text: icon, size: "lg", align: "center" }]
      },
      {
        type: "box",
        layout: "vertical",
        flex: 1,
        justifyContent: "center",
        contents: [
          { type: "text", text: title, size: "sm", weight: "bold", color: THEME.ink, wrap: true },
          { type: "text", text: subtitle, size: "xxs", color: THEME.muted, wrap: true, margin: "xs" }
        ]
      },
      { type: "text", text: "›", size: "xl", weight: "bold", color: accent, flex: 0, gravity: "center" }
    ]
  };
}

const safetyQA = [
    
  {
    question: "ที่อยู่",
    answer: `📍 Sodick (Thailand)
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`
  },

  {
    question: "ขอที่อยู่",
    answer: `📍 Sodick (Thailand)
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`
  },

  {
    question: "ที่อยู่บริษัท",
    answer: `📍 Sodick (Thailand)
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`
  },

  {
    question: "ชื่อบริษัท",
    answer: `📍 Sodick (Thailand)
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่) 
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`
  },

  {
    question: "ใบกำกับภาษี",
    answer: `🧾 ใบกำกับภาษี Sodick (Thailand)  
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่) 
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`
  },

  {
    question: "ข้อมูลบริษัท",
    answer: `🧾 ใบกำกับภาษี Sodick (Thailand)  
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่) 
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`
  },

  {
    question: "อยากได้ที่อยู่บริษัท",
    answer: `🧾 ใบกำกับภาษี Sodick (Thailand)  
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่) 
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`
  },

  {
    question: "บริษัท",
    answer: `🧾 ใบกำกับภาษี Sodick (Thailand)  
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่) 
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`
  },

  {
    question: "เบอร์ติดต่อ",
    answer: `📞 **เบอร์ติดต่อบริษัท Sodick (Thailand)**

🏭 **โรงงาน 1**  
เบอร์ติดต่อบริษัท: 02-529-2450 ถึง 6  
เบอร์ภายใน: 102, 127, 129  

🏭 **โรงงาน 2**  
เบอร์ติดต่อบริษัท: 02-529-3200 ถึง 6  
เบอร์ภายใน: 137  

📱 **เบอร์มือถือ**  
- พี่ไก่: 061-645-5095  
- น้องดุจ: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`
  },

  {
    question: "ขอเบอร์ติดต่อ",
    answer: `📞 **เบอร์ติดต่อบริษัท Sodick (Thailand)**

🏭 **โรงงาน 1**  
เบอร์ติดต่อบริษัท: 02-529-2450 ถึง 6  
เบอร์ภายใน: 102, 127, 129  

🏭 **โรงงาน 2**  
เบอร์ติดต่อบริษัท: 02-529-3200 ถึง 6  
เบอร์ภายใน: 137  

📱 **เบอร์มือถือ**  
- พี่ไก่: 061-645-5095  
- น้องดุจ: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`
  },

  {
    question: "ขอเบอร์",
    answer: `📞 **เบอร์ติดต่อบริษัท Sodick (Thailand)**

🏭 **โรงงาน 1**  
เบอร์ติดต่อบริษัท: 02-529-2450 ถึง 6  
เบอร์ภายใน: 102, 127, 129  

🏭 **โรงงาน 2**  
เบอร์ติดต่อบริษัท: 02-529-3200 ถึง 6  
เบอร์ภายใน: 137  

📱 **เบอร์มือถือ**  
- พี่ไก่: 061-645-5095  
- น้องดุจ: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`
  },

  {
    question: "ขอเบอร์โทร",
    answer: `📞 **เบอร์ติดต่อบริษัท Sodick (Thailand)**

🏭 **โรงงาน 1**  
เบอร์ติดต่อบริษัท: 02-529-2450 ถึง 6  
เบอร์ภายใน: 102, 127, 129  

🏭 **โรงงาน 2**  
เบอร์ติดต่อบริษัท: 02-529-3200 ถึง 6  
เบอร์ภายใน: 137  

📱 **เบอร์มือถือ**  
- พี่ไก่: 061-645-5095  
- น้องดุจ: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`
  },

  {
    question: "เบอร์โทร",
    answer: `📞 **เบอร์ติดต่อบริษัท Sodick (Thailand)**

🏭 **โรงงาน 1**  
เบอร์ติดต่อบริษัท: 02-529-2450 ถึง 6  
เบอร์ภายใน: 102, 127, 129  

🏭 **โรงงาน 2**  
เบอร์ติดต่อบริษัท: 02-529-3200 ถึง 6  
เบอร์ภายใน: 137  

📱 **เบอร์มือถือ**  
- พี่ไก่: 061-645-5095  
- น้องดุจ: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`
  }
];

const examQuestions = [
  { q: "1) PPE คืออะไร?", choices: ["อุปกรณ์ป้องกันอันตรายส่วนบุคคล", "รองเท้าธรรมดา", "เสื้อผ้าทั่วไป"], answer: 0 },
  { q: "2) หมวกนิรภัยต้องสวมเมื่อไหร่?", choices: ["เมื่ออยู่ในพื้นที่ทำงาน", "เฉพาะตอนมีผู้จัดการมา", "ไม่จำเป็น"], answer: 0 },
  { q: "3) งานที่สูงคือความสูงตั้งแต่กี่เมตรขึ้นไป?", choices: ["1 เมตร", "2 เมตร", "5 เมตร"], answer: 1 },
  { q: "4) ถังดับเพลิงสีแดงใช้สำหรับดับอะไร?", choices: ["ไฟฟ้า", "เชื้อเพลิงของเหลว", "ไม้/กระดาษ"], answer: 2 },
  { q: "5) หากพบอุบัติเหตุควรทำอย่างไร?", choices: ["ถ่ายรูปก่อน", "แจ้งทีม Safety ทันที", "เดินหนี"], answer: 1 },
  { q: "6) จะสูบบุหรี่ควรทำอย่างไร?", choices: ["สูบตรงไหนก็ได้", "สูบในห้องน้ำ", "สูบเฉพาะจุดที่กำหนด"], answer: 2 },
  { q: "7) การเดินในโรงงานควรเดินตรงไหน?", choices: ["เดินในเลนคนเดิน", "เดินบนถนนรถยก", "เดินตรงไหนก็ได้"], answer: 0 },
  { q: "8) ถ้าพบสารเคมีหกควรทำอย่างไร?", choices: ["เช็ดเอง", "แจ้ง Safety", "ปล่อยไว้"], answer: 1 },
  { q: "9) การยกของหนักควรทำอย่างไร?", choices: ["ก้มหลังยก", "ใช้แรงเต็มที่", "ย่อตัวแล้วยก"], answer: 2 },
  { q: "10) ป้ายเตือน สีเหลือง หมายถึงอะไร?", choices: ["ข้อบังคับ", "คำเตือน", "ห้ามทำ"], answer: 1 },
  { q: "11) ป้ายวงกลม สีแดง มีเส้นทับหมายถึง?", choices: ["ควรทำ", "ห้ามทำ", "ไม่เกี่ยว"], answer: 1 },
  { q: "12) ถ้าต้องใช้บันไดควรทำอย่างไร?", choices: ["ปีนสองคน", "ตรวจสภาพก่อนใช้", "ใช้บันไดพัง"], answer: 1 },
  { q: "13) ถ้าต้องทำงานเชื่อมต้องมีอุปกรณ์อะไร?", choices: ["แว่นเชื่อม", "หมวกกันน็อค", "รองเท้าแตะ"], answer: 0 },
  { q: "14) ถ้าต้องทำงานในที่อับอากาศต้องมีอุปกรณ์?", choices: ["ใบอนุญาต", "ไฟฉาย", "น้ำดื่ม"], answer: 0 },
  { q: "15) รถยกมีสิทธิ์ในถนนโรงงานมากกว่าคนเดินหรือไม่?", choices: ["ใช่", "ไม่ใช่", "แล้วแต่เวลา"], answer: 1 },
  { q: "16) ถ้าพบสายไฟชำรุดควรทำอย่างไร?", choices: ["จับดู", "แจ้งช่างไฟ", "ใช้ต่อ"], answer: 1 },
  { q: "17) ถ้าต้องตัดเหล็กควรใส่อุปกรณ์อะไร?", choices: ["แว่นตานิรภัย", "หมวกแก๊ป", "ไม่มีอะไร"], answer: 0 },
  { q: "18) ถังดับเพลิงต้องตรวจทุกกี่เดือน?", choices: ["1 เดือน", "3 เดือน", "6 เดือน"], answer: 2 },
  { q: "19) ถ้าต้องทำงานบนที่สูงต้องใช้อุปกรณ์อะไร?", choices: ["รองเท้าแตะ", "เข็มขัดกันตก", "หมวกแก๊ป"], answer: 1 },
  { q: "20) การเดินในพื้นที่การผลิตควรใส่อะไร?", choices: ["รองเท้าเซฟตี้", "รองเท้าแตะ", "รองเท้าผ้าใบ"], answer: 0 },
  { q: "21) ถ้าต้องขนของหนักควรทำอย่างไร?", choices: ["ใช้รถเข็น", "ยกเอง", "ลากไปกับพื้น"], answer: 0 },
  { q: "22) ถ้าพบไฟไหม้ควรทำอย่างไร?", choices: ["วิ่งหนี", "แจ้ง 102/127/129", "ถ่ายคลิป"], answer: 1 },
  { q: "23) ถ้าต้องทำงานเสียงดังควรใส่อะไร?", choices: ["ที่อุดหู", "หมวกแก๊ป", "ไม่มีอะไร"], answer: 0 },
  { q: "24) ถ้าต้องทำงานกับสารเคมีควรใส่อะไร?", choices: ["แว่น + ถุงมือ", "รองเท้าแตะ", "ไม่มีอะไร"], answer: 0 },
  { q: "25) ถ้าพบคนหมดสติควรทำอย่างไร?", choices: ["เขย่าตัวแรง ๆ", "แจ้ง Safety", "ปล่อยไว้"], answer: 1 },
  { q: "26) ถ้าต้องใช้เครื่องมือไฟฟ้าควรทำอะไร?", choices: ["ตรวจสายไฟก่อนใช้", "ใช้ทันที", "ใช้ตอนเปียกน้ำ"], answer: 0 },
  { q: "27) ถ้าต้องเดินในพื้นที่มืดควรทำอย่างไร?", choices: ["ใช้ไฟฉาย", "เดินไปเลย", "วิ่ง"], answer: 0 },
  { q: "28) ถ้าต้องทำงานใกล้รถยกควรทำอย่างไร?", choices: ["เดินตัดหน้า", "รักษาระยะห่าง", "ยืนข้างรถ"], answer: 1 },
  { q: "29) ถ้าต้องทำงานอากาศร้อนควรทำอย่างไร?", choices: ["พักเป็นระยะ", "ทำต่อจนเสร็จ", "ไม่ต้องพัก"], answer: 0 },
  { q: "30) ถ้าพบสิ่งผิดปกติควรทำอย่างไร?", choices: ["แจ้ง Safety", "ปล่อยไว้", "ถ่ายรูปลงโซเชียล"], answer: 0 }
];

/* ==================================================
   MODERN FLEX MESSAGES
================================================== */
function contractorMainMenuFlex() {
  const items = [
    ["📦", "ผู้รับ–ส่งสินค้า", "Delivery visitor", "ผู้รับส่งสินค้า", THEME.blue],
    ["🛠️", "ผู้เข้ามาทำงาน–แก้ไขงาน", "Contractor / Vendor", "ผู้แก้ไขงาน", "#7B61A8"],
    ["🎓", "สื่อสำหรับอบรมผู้รับเหมา", "Safety training media", "สื่ออบรมผู้รับเหมา", THEME.green],
    ["🪪", "ขอบัตรผู้รับเหมาย้อนหลัง", "Download contractor card", "ดาวน์โหลดบัตร", THEME.orange]
  ];

  return {
    type: "flex",
    altText: "เมนูผู้รับเหมา / Contractor Menu",
    contents: {
      type: "bubble",
      size: "mega",
      styles: { body: { backgroundColor: THEME.canvas }, footer: { backgroundColor: THEME.canvas } },
      header: titleBlock("🦺", "SODICK SAFETY", "Contractor Service", "ระบบบริการผู้รับเหมา", THEME.navy),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "18px",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "vertical",
            paddingAll: "14px",
            cornerRadius: "14px",
            backgroundColor: "#FFF7DE",
            borderColor: "#F4D784",
            borderWidth: "1px",
            contents: [
              { type: "text", text: "⚠️ ข้อกำชับด้านความปลอดภัย", weight: "bold", color: "#805A09", size: "sm" },
              { type: "text", text: "กรุณาทำแบบทดสอบด้วยตนเอง ห้ามทำแทน ส่งคำตอบ หรือช่วยกันตอบ", wrap: true, color: "#765B20", size: "xs", margin: "sm" },
              { type: "text", text: "Complete the test individually. Results are officially recorded.", wrap: true, color: "#8A7442", size: "xxs", margin: "xs" }
            ]
          },
          ...items.map(([icon, title, subtitle, message, accent]) => actionCard(
            icon, title, subtitle,
            { type: "message", label: title.slice(0, 20), text: message },
            accent
          )),
          {
            type: "box",
            layout: "vertical",
            paddingAll: "12px",
            cornerRadius: "12px",
            backgroundColor: "#E9F4FB",
            contents: [
              { type: "text", text: "ส่งเอกสารบันทึกการอบรม", size: "xxs", color: THEME.muted, align: "center" },
              { type: "text", text: "thai_safety@sodick.co.th", size: "sm", weight: "bold", color: THEME.blue, align: "center", margin: "xs" }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "14px",
        contents: [{ type: "text", text: "Safety first • Work smart • Go home safe", size: "xxs", color: THEME.muted, align: "center" }]
      }
    }
  };
}

function menuFlex(title, subtitle, icon, items, color = THEME.navy) {
  return {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      size: "mega",
      styles: { body: { backgroundColor: THEME.canvas } },
      header: titleBlock(icon, "SODICK SAFETY", title, subtitle, color),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "18px",
        spacing: "sm",
        contents: items.map(item => actionCard(
          item.icon,
          item.title,
          item.subtitle,
          item.type === "uri"
            ? { type: "uri", label: item.title.slice(0, 20), uri: item.value }
            : { type: "message", label: item.title.slice(0, 20), text: item.value },
          item.color || THEME.blue
        ))
      }
    }
  };
}

function menuDelivery() {
  return menuFlex("ผู้รับ–ส่งสินค้า", "DELIVERY VISITOR", "📦", [
    { icon: "▶️", title: "วิดีโออบรม", subtitle: "Safety training video", type: "uri", value: "https://drive.google.com/file/d/1bz2qUynfvSFNuS3FoM1iGcLIn3Z8m0fb/view?usp=sharing", color: "#D24B4B" },
    { icon: "📝", title: "ทำแบบทดสอบ", subtitle: "Start safety exam", type: "message", value: "ทำแบบทดสอบ", color: THEME.blue },
    { icon: "📄", title: "เอกสารบันทึกการอบรม", subtitle: "Training record document", type: "uri", value: "https://drive.google.com/file/d/1QWnOr9Cmkdbsmp0byIlocZmmVIjcPqWe/view?usp=drive_link", color: THEME.green }
  ], THEME.blue);
}

function menuVendor() {
  return menuFlex("ผู้เข้ามาทำงาน–แก้ไขงาน", "CONTRACTOR / VENDOR", "🛠️", [
    { icon: "▶️", title: "วิดีโออบรม", subtitle: "Safety training video", type: "uri", value: "https://drive.google.com/file/d/1bz2qUynfvSFNuS3FoM1iGcLIn3Z8m0fb/view?usp=sharing", color: "#D24B4B" },
    { icon: "📝", title: "ทำแบบทดสอบ", subtitle: "Start safety exam", type: "message", value: "ทำแบบทดสอบ", color: THEME.blue },
    { icon: "📄", title: "เอกสารบันทึกการอบรม", subtitle: "Training record document", type: "uri", value: "https://drive.google.com/file/d/1QWnOr9Cmkdbsmp0byIlocZmmVIjcPqWe/view?usp=drive_link", color: THEME.green },
    { icon: "📋", title: "ใบขอเข้ามาทำงาน", subtitle: "Work entry request", type: "uri", value: "https://drive.google.com/file/d/1m9zT6FEHTFs_GdXIcKrr3WCngONKn4OV/view?usp=drive_link", color: THEME.orange },
    { icon: "🔧", title: "ใบตรวจสอบเครื่องมือ", subtitle: "Tool inspection form", type: "uri", value: "https://drive.google.com/file/d/1HJxEXai6--EduOXJTDGtvl0-Sfu5_k7c/view?usp=drive_link", color: "#7B61A8" }
  ], "#483878");
}

function trainingMenu() {
  return menuFlex("สื่ออบรมผู้รับเหมา", "CONTRACTOR TRAINING", "🎓", [
    { icon: "01", title: "ความปลอดภัยในการทำงาน", subtitle: "General workplace safety", type: "uri", value: "https://youtu.be/MGbZGFtQCLQ?si=S7Xg3pxeOqkQCyx5", color: THEME.blue },
    { icon: "02", title: "ความปลอดภัยงานเชื่อม", subtitle: "Welding safety", type: "uri", value: "https://youtu.be/gpUlIKyjSQM?si=QctBbVhlth2bbmDt", color: "#7B61A8" },
    { icon: "03", title: "การใช้ถังดับเพลิง", subtitle: "Fire extinguisher", type: "uri", value: "https://youtu.be/54FuqMUGlOQ?si=4-9RT_1fmtGnMg0f", color: THEME.red },
    { icon: "04", title: "ขับขี่ปลอดภัย", subtitle: "Safe driving", type: "uri", value: "https://youtu.be/jUPDb2aHWSM?si=x2wPrp2DGoluXvuF", color: THEME.orange },
    { icon: "05", title: "การแยกขยะ", subtitle: "Waste segregation", type: "uri", value: "https://youtu.be/5HI55e0oL_M?si=Hg5EdfhXNIaeKlP9", color: THEME.green }
  ], THEME.green);
}

function pdpaFlex() {
  return {
    type: "flex",
    altText: "นโยบายคุ้มครองข้อมูลส่วนบุคคล",
    contents: {
      type: "bubble",
      size: "mega",
      styles: { body: { backgroundColor: THEME.canvas } },
      header: titleBlock("🛡️", "PRIVACY NOTICE", "นโยบาย PDPA", "Personal Data Protection", THEME.navy),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "lg",
        contents: [
          { type: "text", text: "บริษัทเก็บข้อมูลเพื่อยืนยันตัวตน ออกบัตร บันทึกผลอบรม และสนับสนุนระบบความปลอดภัย", wrap: true, color: THEME.ink, size: "sm" },
          {
            type: "box", layout: "vertical", paddingAll: "14px", cornerRadius: "14px", backgroundColor: THEME.sky,
            contents: [
              { type: "text", text: "• ยืนยันตัวตนผู้รับเหมา\n• ออกบัตรผู้รับเหมา\n• บันทึกผลการอบรม\n• ใช้ในระบบความปลอดภัย", wrap: true, size: "xs", color: THEME.ink }
            ]
          },
          { type: "button", style: "primary", color: THEME.blue, action: { type: "uri", label: "อ่านนโยบายฉบับเต็ม", uri: "https://www.sodick.co.th/Privacy%20Policy/AN-2022-0103-Announcement%20Personal%20Data%20Policy%20(THA).pdf" } }
        ]
      }
    }
  };
}

function jobPositionFlex() {
  const jobs = [
    ["👔", "เจ้าของบริษัท / Owner", "Owner"],
    ["🧭", "ผู้ควบคุมงาน / Supervisor", "Supervisor"],
    ["📐", "วิศวกร / Engineer", "Engineer"],
    ["📋", "โฟร์แมน / Foreman", "Foreman"],
    ["🔧", "ช่าง / Technician", "Technician"],
    ["👷", "พนักงานทั่วไป / General Worker", "GeneralWorker"]
  ];
  return {
    type: "flex",
    altText: "เลือกตำแหน่งงาน",
    contents: {
      type: "bubble",
      size: "mega",
      styles: { body: { backgroundColor: THEME.canvas } },
      header: titleBlock("💼", "STEP 1 OF 2", "เลือกตำแหน่งงาน", "Select job position", THEME.blue),
      body: {
        type: "box", layout: "vertical", paddingAll: "18px", spacing: "sm",
        contents: jobs.map(([icon, label, value]) => actionCard(icon, label, "แตะเพื่อเลือก / Tap to select", { type: "postback", label: label.slice(0, 20), data: `job=${value}`, displayText: label }, THEME.blue))
      }
    }
  };
}

function formQuestionFlex(step) {
  const q = formQuestions[step];
  const total = formQuestions.length;
  const icons = ["👤", "📱", "🪪", "🏢"];
  const titles = ["ชื่อ–นามสกุล", "เบอร์โทรศัพท์", "ข้อมูลยืนยันตัวตน", "ชื่อบริษัท"];
  return {
    type: "flex",
    altText: titles[step] || "กรอกข้อมูล",
    contents: {
      type: "bubble",
      size: "mega",
      styles: { body: { backgroundColor: THEME.canvas } },
      header: titleBlock(icons[step] || "📝", `STEP ${step + 1} OF ${total}`, titles[step] || "กรอกข้อมูล", "Please type your answer in chat", THEME.blue),
      body: {
        type: "box", layout: "vertical", paddingAll: "20px", spacing: "lg",
        contents: [
          { type: "text", text: q.text, wrap: true, size: "sm", color: THEME.ink },
          { type: "box", layout: "vertical", paddingAll: "14px", cornerRadius: "14px", backgroundColor: THEME.sky, contents: [{ type: "text", text: "⌨️ พิมพ์คำตอบในช่องแชทด้านล่าง", size: "xs", weight: "bold", color: THEME.blue, align: "center" }] }
        ]
      }
    }
  };
}

function examFlex(questionObj, number) {
  const total = examQuestions.length;
  const progress = Math.max(1, Math.min(100, Math.round((number / total) * 100)));
  const questionText = safeText(questionObj.q.replace(/^\d+\)\s*/, ""), 300);
  const letters = ["A", "B", "C", "D"];
  return {
    type: "flex",
    altText: `ข้อ ${number} จาก ${total}`,
    contents: {
      type: "bubble",
      size: "mega",
      styles: { body: { backgroundColor: THEME.canvas } },
      header: titleBlock("📝", `SAFETY QUIZ • ${progress}%`, `ข้อ ${number} จาก ${total}`, "เลือกคำตอบที่ถูกต้อง", THEME.navy),
      body: {
        type: "box", layout: "vertical", paddingAll: "20px", spacing: "lg",
        contents: [
          {
            type: "box", layout: "vertical", paddingAll: "16px", cornerRadius: "16px", backgroundColor: THEME.white,
            borderColor: THEME.line, borderWidth: "1px",
            contents: [{ type: "text", text: questionText, wrap: true, size: "md", weight: "bold", color: THEME.ink }]
          },
          {
            type: "box", layout: "vertical", height: "8px", cornerRadius: "4px", backgroundColor: "#DDE8F0",
            contents: [{ type: "box", layout: "vertical", width: `${progress}%`, height: "8px", cornerRadius: "4px", backgroundColor: THEME.gold, contents: [] }]
          },
          ...questionObj.choices.map((choice, index) => actionCard(
            letters[index] || String(index + 1),
            safeText(choice, 220),
            `ตัวเลือก ${letters[index] || index + 1}`,
            { type: "postback", label: safeText(choice, 20), data: `answer_${index}`, displayText: safeText(choice, 300) },
            index === 0 ? THEME.blue : index === 1 ? "#7B61A8" : THEME.orange
          ))
        ]
      }
    }
  };
}

function resultFlex(score, total, pass) {
  const color = pass ? THEME.green : THEME.red;
  const soft = pass ? THEME.greenSoft : THEME.redSoft;
  return {
    type: "flex",
    altText: pass ? "ผ่านการทดสอบ" : "ไม่ผ่านการทดสอบ",
    contents: {
      type: "bubble", size: "mega",
      styles: { body: { backgroundColor: soft }, footer: { backgroundColor: soft } },
      header: titleBlock(pass ? "✅" : "↻", "EXAM RESULT", pass ? "ผ่านการทดสอบ" : "ยังไม่ผ่านการทดสอบ", pass ? "Congratulations" : "Please try again", color),
      body: {
        type: "box", layout: "vertical", paddingAll: "22px", spacing: "lg", alignItems: "center",
        contents: [
          { type: "text", text: `${score}/${total}`, size: "3xl", weight: "bold", color, align: "center" },
          { type: "text", text: `เกณฑ์ผ่าน ${PASS_SCORE}/${total}`, size: "sm", color: THEME.muted, align: "center" },
          { type: "text", text: pass ? "ระบบกำลังบันทึกผลและเตรียมบัตรผู้รับเหมา" : "กรุณาทบทวนสื่ออบรมแล้วทำแบบทดสอบใหม่", wrap: true, size: "sm", color: THEME.ink, align: "center" }
        ]
      },
      footer: {
        type: "box", layout: "vertical", paddingAll: "18px",
        contents: [pass
          ? { type: "button", style: "primary", color: THEME.green, action: { type: "message", label: "ดาวน์โหลดบัตร", text: "ดาวน์โหลดบัตร" } }
          : { type: "button", style: "primary", color: THEME.red, action: { type: "message", label: "ทำแบบทดสอบใหม่", text: "ทำแบบทดสอบ" } }
        ]
      }
    }
  };
}

function certificateFlex(url) {
  return {
    type: "flex",
    altText: "บัตรผู้รับเหมา",
    contents: {
      type: "bubble", size: "mega",
      hero: { type: "image", url, size: "full", aspectRatio: "20:13", aspectMode: "cover" },
      styles: { body: { backgroundColor: THEME.canvas }, footer: { backgroundColor: THEME.canvas } },
      body: {
        type: "box", layout: "vertical", paddingAll: "20px", spacing: "md",
        contents: [
          { type: "text", text: "บัตรผู้รับเหมา", size: "xl", weight: "bold", color: THEME.navy, align: "center" },
          { type: "text", text: "Contractor Safety Card", size: "xs", color: THEME.muted, align: "center" }
        ]
      },
      footer: { type: "box", layout: "vertical", paddingAll: "18px", contents: [{ type: "button", style: "primary", color: THEME.green, action: { type: "uri", label: "เปิดและดาวน์โหลดบัตร", uri: url } }] }
    }
  };
}

function contactMenuFlex() {
  return menuFlex("ติดต่อทีม Safety", "CONTACT & SUPPORT", "☎️", [
    { icon: "📞", title: "Safety Hotline", subtitle: "โทรติดต่อเจ้าหน้าที่", type: "message", value: "Safety Hotline", color: THEME.blue },
    { icon: "📣", title: "แจ้งปัญหา", subtitle: "Report an issue", type: "message", value: "แจ้งปัญหา", color: THEME.orange }
  ], THEME.navy);
}

function hotlineFlex() {
  const contacts = [
    ["Safety Manager", "0813765583", THEME.red],
    ["Safety Factory 1", "0616455095", THEME.blue],
    ["Safety Factory 2", "0832374357", "#7B61A8"],
    ["Safety Factory 1", "0816954474", THEME.green],
    ["Environment", "0949380425", THEME.orange]
  ];
  return {
    type: "flex", altText: "Safety Hotline",
    contents: { type: "bubble", size: "mega", styles: { body: { backgroundColor: THEME.canvas } },
      header: titleBlock("📞", "EMERGENCY CONTACT", "Safety Hotline", "แตะเพื่อโทรออก", THEME.red),
      body: { type: "box", layout: "vertical", paddingAll: "18px", spacing: "sm", contents: contacts.map(([title, phone, color]) => actionCard("☎", title, phone, { type: "uri", label: title.slice(0, 20), uri: `tel:${phone}` }, color)) }
    }
  };
}

function issueFormFlex() {
  return {
    type: "flex", altText: "แจ้งปัญหา",
    contents: { type: "bubble", size: "mega", styles: { body: { backgroundColor: THEME.canvas }, footer: { backgroundColor: THEME.canvas } },
      header: titleBlock("📣", "REPORT AN ISSUE", "แจ้งปัญหา", "ส่งถึงทีม Safety เพียง 1 ครั้ง", THEME.orange),
      body: { type: "box", layout: "vertical", paddingAll: "20px", spacing: "lg", contents: [
        { type: "text", text: "พิมพ์รายละเอียดทั้งหมดในข้อความถัดไป", size: "md", weight: "bold", color: THEME.ink, wrap: true },
        { type: "box", layout: "vertical", paddingAll: "16px", spacing: "sm", cornerRadius: "16px", backgroundColor: THEME.orangeSoft, contents: [
          { type: "text", text: "1. รายละเอียดปัญหา\n2. ชื่อผู้แจ้ง\n3. บริษัท\n4. เบอร์ติดต่อกลับ", size: "sm", color: THEME.ink, wrap: true }
        ]},
        { type: "text", text: "ข้อความทั่วไปและคำตอบข้อสอบจะไม่ถูกส่งหา ADMIN", size: "xs", color: THEME.muted, wrap: true, align: "center" }
      ]},
      footer: { type: "box", layout: "vertical", paddingAll: "18px", contents: [{ type: "button", style: "secondary", action: { type: "message", label: "ยกเลิกการแจ้ง", text: "ยกเลิกการแจ้งปัญหา" } }] }
    }
  };
}

function issueAdminFlex(reportText, userId) {
  return {
    type: "flex", altText: "มีผู้ใช้งานแจ้งปัญหาใหม่",
    contents: { type: "bubble", size: "mega", styles: { body: { backgroundColor: THEME.redSoft } },
      header: titleBlock("🔔", "NEW ISSUE", "แจ้งปัญหาใหม่", "สถานะ: รอตรวจสอบ", THEME.red),
      body: { type: "box", layout: "vertical", paddingAll: "20px", spacing: "lg", contents: [
        { type: "box", layout: "vertical", paddingAll: "16px", cornerRadius: "16px", backgroundColor: THEME.white, borderColor: "#F0C9CF", borderWidth: "1px", contents: [
          { type: "text", text: safeText(reportText, 1500), size: "sm", color: THEME.ink, wrap: true }
        ]},
        { type: "text", text: `LINE User ID: ${userId}`, size: "xxs", color: THEME.muted, wrap: true }
      ]}
    }
  };
}

function issueSuccessFlex() {
  return {
    type: "flex", altText: "รับแจ้งปัญหาแล้ว",
    contents: { type: "bubble", size: "mega", styles: { body: { backgroundColor: THEME.greenSoft } },
      body: { type: "box", layout: "vertical", paddingAll: "24px", spacing: "lg", alignItems: "center", contents: [
        { type: "text", text: "✅", size: "3xl", align: "center" },
        { type: "text", text: "รับแจ้งเรียบร้อยแล้ว", size: "xl", weight: "bold", color: THEME.green, align: "center" },
        { type: "text", text: "ส่งรายละเอียดให้ทีม Safety แล้ว\nทีมงานจะตรวจสอบโดยเร็วที่สุด", size: "sm", color: THEME.ink, wrap: true, align: "center" },
        { type: "text", text: "Your report has been sent to the Safety team.", size: "xs", color: THEME.muted, wrap: true, align: "center" }
      ]}
    }
  };
}

function fallbackFlex() {
  return {
    type: "flex", altText: "ไม่พบข้อมูลคำถามนี้",
    contents: { type: "bubble", size: "mega", styles: { body: { backgroundColor: THEME.canvas } },
      header: titleBlock("💬", "HELP CENTER", "ยังไม่พบคำตอบ", "ลองเลือกเมนูด้านล่าง", THEME.navy),
      body: { type: "box", layout: "vertical", paddingAll: "18px", spacing: "sm", contents: [
        actionCard("🦺", "เมนูผู้รับเหมา", "Contractor menu", { type: "message", label: "เมนูผู้รับเหมา", text: "เมนูผู้รับเหมา" }, THEME.blue),
        actionCard("☎️", "ติดต่อทีม Safety", "Contact Safety", { type: "message", label: "ติดต่อทีม Safety", text: "ติดต่อทีมเซฟตี้" }, THEME.green),
        actionCard("📍", "แผนที่โรงงาน", "Factory map", { type: "message", label: "แผนที่", text: "แผนที่" }, THEME.orange)
      ]}
    }
  };
}

const mapFlex = {
  type: "flex", altText: "แผนที่บริษัท Sodick Thailand",
  contents: { type: "bubble", size: "mega", styles: { body: { backgroundColor: THEME.canvas } },
    header: titleBlock("📍", "LOCATION", "Sodick Thailand", "Factory map guide", THEME.blue),
    body: { type: "box", layout: "vertical", paddingAll: "18px", spacing: "sm", contents: [
      actionCard("1", "โรงงาน 1 / Factory 1", "Google Maps", { type: "uri", label: "เปิดแผนที่โรงงาน 1", uri: "https://maps.app.goo.gl/ycBgWvYA8ze8L6Hj8" }, THEME.blue),
      actionCard("2", "โรงงาน 2 / Factory 2", "Google Maps", { type: "uri", label: "เปิดแผนที่โรงงาน 2", uri: "https://maps.app.goo.gl/keZxD798z9ZwKXE7A" }, THEME.green)
    ]}
  }
};

const phoneFlex = {
  type: "flex", altText: "เบอร์โทรโรงงาน Sodick Thailand",
  contents: { type: "bubble", size: "mega", styles: { body: { backgroundColor: THEME.canvas } },
    header: titleBlock("☎️", "FACTORY CONTACT", "เบอร์โทรโรงงาน", "Sodick Thailand", THEME.green),
    body: { type: "box", layout: "vertical", paddingAll: "18px", spacing: "sm", contents: [
      actionCard("1", "โรงงาน 1", "02-529-2450-6 • ต่อ 102 / 127 / 129", { type: "uri", label: "โทรโรงงาน 1", uri: "tel:025292450" }, THEME.blue),
      actionCard("2", "โรงงาน 2", "02-529-3200-6 • ต่อ 137", { type: "uri", label: "โทรโรงงาน 2", uri: "tel:025293200" }, THEME.green)
    ]}
  }
};

/* ==================================================
   FORM AND EXAM LOGIC
================================================== */
const formQuestions = [
  { key: "fullname", text: "กรุณาพิมพ์ชื่อ–นามสกุลของคุณ\nPlease type your full name" },
  { key: "phone", text: "กรุณาพิมพ์เบอร์โทรศัพท์ 10 หลัก\nPlease type your 10-digit phone number" },
  { key: "idcard", text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก หรือ Passport / Work Permit 6–13 ตัวอักษร\nPlease enter National ID, Passport, or Work Permit" },
  { key: "company", text: "กรุณาพิมพ์ชื่อบริษัทของคุณ\nPlease type your company name" }
];

async function handleFormAnswer(event, userId, text) {
  const state = userState.get(userId);
  if (!state || state.mode !== "form") return reply(event, textMessage("ขั้นตอนหมดอายุ กรุณาเริ่มทำแบบทดสอบใหม่"));
  const value = String(text || "").trim();
  const current = formQuestions[state.step];
  if (!value) return reply(event, textMessage("กรุณากรอกข้อมูลก่อนดำเนินการต่อ"));
  if (current.key === "phone" && !/^\d{10}$/.test(value)) {
    return reply(event, textMessage("❌ เบอร์โทรไม่ถูกต้อง กรุณากรอกตัวเลข 10 หลัก เช่น 0812345678"));
  }
  if (current.key === "idcard" && !/^[A-Za-z0-9]{6,13}$/.test(value)) {
    return reply(event, textMessage("❌ หมายเลขไม่ถูกต้อง กรุณาใช้ตัวอักษรภาษาอังกฤษหรือตัวเลข 6–13 ตัว"));
  }
  state.formData[current.key] = value;
  state.step += 1;
  touchState(userId);
  if (state.step < formQuestions.length) return reply(event, formQuestionFlex(state.step));
  state.mode = "exam";
  state.currentQuestion = 1;
  state.score = 0;
  state.answers = [];
  state.locked = false;
  return reply(event, examFlex(examQuestions[0], 1));
}

async function handleExamAnswer(event, userId, data) {
  const state = userState.get(userId);
  if (!state || state.mode !== "exam") return reply(event, textMessage("⚠️ ขั้นตอนข้อสอบหมดอายุ กรุณาพิมพ์ ทำแบบทดสอบ เพื่อเริ่มใหม่"));
  if (state.locked) return reply(event, textMessage("⏳ กรุณารอสักครู่ ระบบกำลังโหลดข้อถัดไป"));
  state.locked = true;
  try {
    const qIndex = state.currentQuestion - 1;
    const question = examQuestions[qIndex];
    if (!question || !Array.isArray(question.choices)) throw new Error("Invalid question state");
    const selected = Number.parseInt(String(data).replace("answer_", ""), 10);
    if (!Number.isInteger(selected) || selected < 0 || selected >= question.choices.length) throw new Error("Invalid answer index");
    const selectedText = question.choices[selected];
    const correct = selected === question.answer;
    state.answers[qIndex] = correct ? `${selectedText} (ถูก)` : selectedText;
    if (correct) state.score += 1;
    state.currentQuestion += 1;
    touchState(userId);
    if (state.currentQuestion > examQuestions.length) return finishExam(event, userId);
    return reply(event, examFlex(examQuestions[state.currentQuestion - 1], state.currentQuestion));
  } catch (error) {
    console.error("Exam error:", error);
    return reply(event, textMessage("⚠️ ระบบพบความผิดปกติ กรุณาเริ่มทำแบบทดสอบใหม่"));
  } finally {
    const latest = userState.get(userId);
    if (latest) latest.locked = false;
  }
}

async function finishExam(event, userId) {
  const state = userState.get(userId);
  if (!state) return reply(event, textMessage("ไม่พบข้อมูลการทดสอบ"));
  const score = state.score;
  const total = examQuestions.length;
  const pass = score >= PASS_SCORE;
  if (pass) {
    const saved = await sendToGoogleSheet(userId, "ผ่าน", state.answers);
    clearUserState(userId);
    if (!saved) {
      return reply(event, [resultFlex(score, total, true), textMessage("⚠️ บันทึกผลไม่สำเร็จ กรุณาติดต่อทีม Safety ก่อนดาวน์โหลดบัตร")]);
    }
    return reply(event, resultFlex(score, total, true));
  }
  clearUserState(userId);
  return reply(event, resultFlex(score, total, false));
}

/* ==================================================
   GOOGLE APPS SCRIPT SERVICE
================================================== */
async function sendToGoogleSheet(userId, passStatus, answers = []) {
  const state = userState.get(userId);
  if (!state) return false;
  const fullAnswers = Array.from({ length: examQuestions.length }, (_, index) => answers[index] ?? "");
  const payload = {
    userId,
    fullname: state.formData.fullname,
    position: state.formData.position,
    phone: state.formData.phone,
    idcard: state.formData.idcard,
    company: state.formData.company,
    score: state.score,
    result: passStatus,
    answers: fullAnswers
  };
  try {
    const response = await axios.post(GOOGLE_SCRIPT_URL, payload, { headers: { "Content-Type": "application/json" }, timeout: 30000 });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error("Google Sheet error:", error.response?.data || error.message);
    return false;
  }
}

async function getCertificateUrl(userId) {
  try {
    const response = await axios.get(GOOGLE_SCRIPT_URL, { params: { mode: "get", userId }, timeout: 30000 });
    const url = typeof response.data === "string" ? response.data.trim() : response.data?.url;
    return /^https:\/\//i.test(url || "") ? url : null;
  } catch (error) {
    console.error("Certificate error:", error.response?.data || error.message);
    return null;
  }
}

async function handleDownloadCertificate(event, userId) {
  const url = await getCertificateUrl(userId);
  if (!url) return reply(event, textMessage("ยังไม่พบบัตรของคุณ กรุณารอระบบสร้างบัตรหรือติดต่อทีม Safety"));
  return reply(event, certificateFlex(url));
}

/* ==================================================
   ISSUE REPORT FLOW
   Push is used only once after the user explicitly opens
   the issue-report flow and submits a valid description.
================================================== */
async function beginIssueReport(event, userId) {
  clearUserState(userId);
  userState.set(userId, { mode: "report_issue", startedAt: Date.now(), locked: false });
  touchState(userId);
  return reply(event, issueFormFlex());
}

async function handleIssueReport(event, userId, text) {
  const state = userState.get(userId);
  if (!state || state.mode !== "report_issue") return false;
  const reportText = String(text || "").trim();
  if (normalize(reportText) === normalize("ยกเลิกการแจ้งปัญหา")) {
    clearUserState(userId);
    await reply(event, textMessage("ยกเลิกการแจ้งปัญหาเรียบร้อยแล้ว\nThe issue report has been cancelled."));
    return true;
  }
  if (event.type !== "message" || event.message?.type !== "text") {
    await reply(event, textMessage("กรุณาพิมพ์รายละเอียดปัญหาเป็นข้อความ"));
    return true;
  }
  if (reportText.length < 10) {
    await reply(event, textMessage("กรุณาระบุรายละเอียดเพิ่มเติมอย่างน้อย 10 ตัวอักษร"));
    return true;
  }
  if (state.locked) {
    await reply(event, textMessage("กำลังส่งข้อมูล กรุณารอสักครู่"));
    return true;
  }
  state.locked = true;
  try {
    await client.pushMessage(ADMIN_USER_ID, issueAdminFlex(reportText, userId));
    clearUserState(userId);
    await reply(event, issueSuccessFlex());
  } catch (error) {
    console.error("Issue push error:", error.response?.data || error.message);
    clearUserState(userId);
    await reply(event, textMessage("ไม่สามารถส่งข้อมูลได้ กรุณาติดต่อทีม Safety ทางโทรศัพท์"));
  }
  return true;
}

/* ==================================================
   MESSAGE ROUTER
================================================== */
function emergencyMessage() {
  return textMessage("⚠️ เหตุฉุกเฉิน กรุณาติดต่อทันที\nโรงงาน 1: 102 / 127 / 129\nโรงงาน 2: 137\nผู้จัดการ: 100");
}

async function handleEvent(event) {
  if (!event || !["message", "postback"].includes(event.type)) return null;
  const userId = event.source?.userId;
  if (!userId) return null;
  const text = event.type === "message" && event.message?.type === "text" ? event.message.text : "";
  const msg = normalize(text);
  const data = event.postback?.data || "";

  if (event.source.type === "group" && event.type === "message") {
    const mentioned = ["บอท", "bot", "safety"].some(word => msg.includes(word));
    if (!mentioned) return null;
  }

  const current = userState.get(userId);
  if (current?.mode === "report_issue") return handleIssueReport(event, userId, text);

  if (["อุบัติเหตุ", "ฉุกเฉิน", "ไฟไหม้", "บาดเจ็บ"].some(word => msg.includes(word))) {
    return reply(event, emergencyMessage());
  }

  if (msg.includes("ทำแบบทดสอบ")) {
    clearUserState(userId);
    userState.set(userId, { mode: "job", step: 0, formData: {}, currentQuestion: 1, score: 0, answers: [], locked: false });
    touchState(userId);
    return reply(event, [pdpaFlex(), jobPositionFlex()]);
  }

  const state = userState.get(userId);
  if (state?.mode === "job") {
    if (data.startsWith("job=")) {
      state.formData.position = data.slice(4);
      state.mode = "form";
      state.step = 0;
      touchState(userId);
      return reply(event, formQuestionFlex(0));
    }
    return reply(event, textMessage("กรุณาเลือกตำแหน่งงานจากปุ่มในข้อความล่าสุด"));
  }
  if (state?.mode === "form") return handleFormAnswer(event, userId, text);
  if (state?.mode === "exam") {
    if (data.startsWith("answer_")) return handleExamAnswer(event, userId, data);
    return reply(event, textMessage("กรุณาเลือกคำตอบจากปุ่มในข้อสอบ"));
  }

  if (msg.includes("สื่อ") && msg.includes("อบรม") && msg.includes("ผู้รับเหมา")) return reply(event, trainingMenu());
  if (msg.includes("ผู้รับส่งสินค้า")) return reply(event, menuDelivery());
  if (msg.includes("ผู้แก้ไขงาน")) return reply(event, menuVendor());
  if (msg.includes("ดาวน์โหลดบัตร")) return handleDownloadCertificate(event, userId);
  if (["ข้อมูลผู้รับเหมา", "เมนูผู้รับเหมา", "ผู้รับเหมา"].some(word => msg.includes(normalize(word)))) return reply(event, contractorMainMenuFlex());
  if (msg.includes("ติดต่อทีมเซฟตี้")) return reply(event, contactMenuFlex());
  if (msg.includes("safetyhotline") || (msg.includes("safety") && msg.includes("hotline"))) return reply(event, hotlineFlex());
  if (msg.includes("แจ้งปัญหา")) return beginIssueReport(event, userId);
  if (["แผนที่", "map", "location", "โรงงานอยู่ไหน"].some(word => msg.includes(word))) return reply(event, [mapFlex, phoneFlex]);

  const foundQA = safetyQA.find(item => msg.includes(normalize(item.question)));
  if (foundQA) return reply(event, textMessage(foundQA.answer.replace(/\*\*/g, "")));

  if (["เมนู", "menu", "เริ่มต้น", "start"].some(word => msg === normalize(word))) return reply(event, contractorMainMenuFlex());
  return reply(event, fallbackFlex());
}

/* ==================================================
   WEBHOOK AND SERVER
================================================== */
app.get(["/", "/webhook", "/health"], (req, res) => {
  res.status(200).json({ ok: true, service: "Sodick Safety Bot" });
});

app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const events = Array.isArray(req.body.events) ? req.body.events : [];
    await Promise.all(events.map(event => handleEvent(event)));
    return res.status(200).end();
  } catch (error) {
    console.error("Webhook error:", error.response?.data || error.stack || error.message);
    return res.status(200).end();
  }
});

app.listen(PORT, () => {
  console.log(`Sodick Safety Bot running on port ${PORT}`);
});
