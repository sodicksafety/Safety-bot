require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

// ใช้ ENV จาก Render
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// ------------------------------
//  SAFETY Q&A DATABASE
// ------------------------------
const safetyQA = [
  {
    question: "จุดสูบบุหรี่",
    answer: `📍 จุดสูบบุหรี่ของบริษัท

🏭 โรงงาน 1  
• บริเวณสนามฟุตบอล  
• หลังอาคาร 4  

🏭 โรงงาน 2  
• บริเวณข้างโรงขยะ`,
  },

  {
    question: "ขยะมีกี่ประเภท",
    answer: `♻️ ขยะในบริษัทมีทั้งหมด **5 ประเภท** ได้แก่:

1) ขยะทั่วไป  
2) ขยะจากการผลิต  
3) ขยะอันตราย  
4) ขยะติดเชื้อ  
5) Scrap`,
  },

  {
    question: "ppeคืออะไร",
    answer: `PPE คืออุปกรณ์ป้องกันอันตราย เช่น หมวกนิรภัย รองเท้าเซฟตี้ แว่นตา ถุงมือ

PPE = Personal Protective Equipment`,
  },

  {
    question: "ที่อยู่บริษัท",
    answer: `📍 **ที่อยู่บริษัท Sodick (Thailand) Co., Ltd.**

60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน  
ตำบลคลองหนึ่ง อำเภอคลองหลวง  
จังหวัดปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`,
  },

  {
    question: "เบอร์ติดต่อ",
    answer: `📞 **เบอร์ติดต่อบริษัท Sodick (Thailand)**

🏭 โรงงาน 1: 02-529-2450 ถึง 6  
🏭 โรงงาน 2: 02-529-3200 ถึง 6  

📱 มือถือ  
- พี่ไก่: 061-645-5095  
- น้องดุช: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`,
  },
];

/* ------------------------------
   LINE WEBHOOK
------------------------------ */
app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

/* ------------------------------
   MAIN BOT LOGIC
------------------------------ */
function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  // ⭐ เงื่อนไขกลุ่ม (ต้องมีคำว่า บอท)
  if (event.source.type === "group") {
    const triggers = ["บอท", "bot", "Bot"];
    const raw = event.message.text;
    const hasTrigger = triggers.some((w) => raw.includes(w));
    if (!hasTrigger) return Promise.resolve(null);
  }

  // ⭐ เตรียมข้อความ
  let msg = event.message.text.toLowerCase().trim().replace(/\s+/g, "");

  // ⭐ AO TABLE
  if (msg === "ao") {
    return reply(event, `
💚 SAFETY ZONE
A : [A1] [A2] [A3] [A4]
B : [B1] [B2] [B3] [B4]
C : [C1] [C2] [C3] [C4]

💙 SUPPORT ZONE
D : [D1] [D2] [D3] [D4]
E : [E1] [E2] [E3] [E4]
F : [F1] [F2] [F3] [F4] [F5] [F6]
    `);
  }

  // ⭐ ทักทาย
  if (
    msg.includes("สวัสดี") ||
    msg.includes("หวัดดี") ||
    msg.includes("ดีครับ") ||
    msg.includes("ดีค่ะ") ||
    msg.includes("hello") ||
    msg.includes("hi") ||
    msg.includes("hey")
  ) {
    return reply(event, `สวัสดีครับ ผมคือ Safety Bot ของ Sodick ครับ 🙂`);
  }

  // ⭐ ชื่อ
  if (msg.includes("ชื่ออะไร") || msg.includes("yourname") || msg.includes("whoareyou")) {
    return reply(event, `ผมชื่อ Sodicksafety AI Bot ครับ 🙂`);
  }

  // ⭐ สบายดีไหม
  if (
    msg.includes("สบายดีไหม") ||
    msg.includes("เป็นไงบ้าง") ||
    msg.includes("โอเคไหม") ||
    msg.includes("เหนื่อยไหม") ||
    msg.includes("howareyou") ||
    msg.includes("areyouok")
  ) {
    return reply(event, `ช่วงนี้งานเยอะ เหนื่อยนิดหน่อยครับ 🙂`);
  }

  // ⭐ ขอบคุณ
  if (msg.includes("ขอบคุณ") || msg.includes("thank") || msg.includes("thanks")) {
    return reply(event, `ยินดีมากครับ 🙂`);
  }

  // ⭐ 555
  if (msg.includes("555") || msg.includes("ฮ่า") || msg.includes("lol") || msg.includes("haha")) {
    return reply(event, `ฮ่าๆๆ 😂`);
  }

  // ⭐ ขอความช่วยเหลือ
  if (
    msg.includes("ช่วยด้วย") ||
    msg.includes("ขอความช่วยเหลือ") ||
    msg.includes("ช่วยหน่อย") ||
    msg.includes("helpme") ||
    msg.includes("ineedhelp")
  ) {
    return reply(event, `ผมอยู่ตรงนี้ครับ พร้อมช่วยเสมอ 🙂`);
  }

  // ⭐ emergency
  if (
    msg.includes("แจ้งเหตุ") ||
    msg.includes("อุบัติเหตุ") ||
    msg.includes("เกิดเหตุ") ||
    msg.includes("อันตราย") ||
    msg.includes("ไม่ปลอดภัย") ||
    msg.includes("ฉุกเฉิน") ||
    msg.includes("ไฟไหม้") ||
    msg.includes("บาดเจ็บ") ||
    msg.includes("help") ||
    msg.includes("emergency") ||
    msg.includes("danger")
  ) {
    return reply(
      event,
      `หากมีเหตุฉุกเฉิน กรุณาติดต่อเจ้าหน้าที่ความปลอดภัยทันที

โรงงาน 1  
- พี่ไก่ โทร 102 น้องดุจ โทร 127 น้องกี้ โทร 129 

โรงงาน 2  
- น้องพิน โทร 137  

ผู้จัดการ  
- พี่ช้าง โทร 100  

ผมพร้อมช่วยให้ข้อมูลเพิ่มเติมได้ครับ 🙂`
    );
  }

  // ⭐ ค้นหาใน safetyQA
  const found = safetyQA.find((q) =>
    msg.includes(q.question.replace(/\s+/g, ""))
  );
  if (found) return reply(event, found.answer);

  // ⭐ categories
  const categories = {
    greeting: ["สวัสดี", "หวัดดี", "ดีครับ", "ดีค่ะ", "ดีจ้า", "ฮัลโหล", "ไง", "ว่าไง"],
    feeling: ["เศร้า", "ร้องไห้", "เสียใจ", "เครียด", "กังวล", "ท้อ"],
    daily: ["ทำไรอยู่", "อยู่ไหน", "ไปไหนมา", "กินข้าวยัง", "หิวไหม", "ง่วงไหม", "นอนยัง", "ตื่นยัง", "เลิกงานยัง"],
    compliment: ["เก่งมาก", "สุดยอด", "ดีมาก", "เยี่ยมเลย", "น่ารักจัง", "ขอบคุณนะ", "เป็นกำลังใจให้นะ", "สู้ๆนะ", "ดูแลตัวเองด้วย"],
    friendly: ["คิดถึง", "คิดถึงไหม", "รักมั้ย", "รักเราไหม", "ลืมเราหรือยัง", "ตอบเร็วๆ", "อย่าเงียบดิ", "คุยกับเราหน่อย", "เหงา", "เบื่อ", "หิว", "ง่วง"],
    exclaim: ["โอ้โห", "โหดจัง", "จริงดิ", "จริงป่ะ", "โคตรดี", "สุดจัด", "ปังมาก"],
    question: ["ช่วยคิดหน่อย", "แนะนำหน่อย", "ทำไงดี", "ทำไงต่อ"],
  };

  // ⭐ replies
  const replies = {
    greeting: ["สวัสดีครับ 🙂", "ดีครับผม Safety พร้อมช่วยเสมอครับ", "ฮัลโหลครับ 🙂", "ว่าไงครับ วันนี้เป็นไงบ้าง"],
    feeling: ["Safetyอยู่ตรงนี้นะครับ ไม่ต้องเหงา 🙂", "ใจเย็น ๆ นะครับ เดี๋ยวทุกอย่างก็ดีขึ้นครับ", "พักก่อนก็ได้นะครับ Safetyเป็นกำลังใจให้เสมอ 🙂", "คิดถึงเหมือนกันครับ ดูแลตัวเองด้วยนะ"],
    daily: ["Safety กำลัง standby พร้อมช่วยงานอยู่ครับ 🙂", "Safety อยู่ในระบบนี่แหละครับ พร้อมช่วยเสมอ", "กินอะไรก็ได้ที่อร่อยและมีความสุขครับ 😄", "พักผ่อนบ้างนะครับ อย่าหักโหม"],
    compliment: ["ขอบคุณครับ Safetyดีใจที่ช่วยได้ 🙂", "พี่เก่งมากครับ ทำได้ดีมาก", "สุดยอดไปเลยครับ 😄", "Safetyเป็นกำลังใจให้เสมอนะครับ"],
    friendly: ["อยู่นี่ครับ ไม่หายไปไหน @Safety 🙂", "รักเสมอ  @Safety", "ไม่เบื่อ  @Safety", "หิวต้องอดทนจะไม่อ้วน  @Safety", "คิดถึงเหมือนกันครับ  @Safety", "คุยได้เสมอนะครับ  @Safety", "ไม่ลืมหรอกครับ  @Safety 🙂"],
    exclaim: ["โหดจริงครับ แต่พี่เก่งกว่าอีก 😄", "สุดจัดเลยครับ!", "ปังมากครับ!", "จริงครับผม!"],
    question: ["ได้ครับ เดี๋ยวSafetyช่วยคิดให้ 🙂", "โอเคครับ บอกSafetyเพิ่มได้นะ", "Safetyช่วยได้ครับ ลองเล่าเพิ่มหน่อย", "ได้เลยครับ เดี๋ยวSafetyแนะนำให้"],
  };

  // ⭐ random reply
  function randomReply(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // ⭐ category detection
  for (const category in categories) {
    if (categories[category].some((word) => msg.includes(word))) {
      return reply(event, randomReply(replies[category]));
    }
  }

  // ⭐ fallback
  return reply(event, "ระบบยังไม่มีข้อมูลคำถามนี้");
}

/* ------------------------------
   Helper
------------------------------ */
function reply(event, text) {
  return client.replyMessage(event.replyToken, {
    type: "text",
    text,
  });
}

/* ------------------------------
   START SERVER
------------------------------ */
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
