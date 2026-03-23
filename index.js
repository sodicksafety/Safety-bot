require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");
const axios = require("axios");

const app = express();

// --------------------------------------------------
// CONFIG
// --------------------------------------------------
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// --------------------------------------------------
// STATE MANAGEMENT
// --------------------------------------------------
let userState = {};  
// userState[userId] = {
//   mode: "pdpa" | "form" | "exam" | "waiting_certificate",
//   contractorType: "delivery" | "vendor",
//   step: 0,
//   formData: {},
//   currentQuestion: 1,
//   score: 0
// };

// --------------------------------------------------
// GOOGLE SHEET API URL
// --------------------------------------------------
const SHEET_API_URL = process.env.SHEET_API_URL;

// --------------------------------------------------
// NORMALIZE FUNCTION
// --------------------------------------------------
function normalize(text) {
  return text.toLowerCase().trim();
}
// --------------------------------------------------
// 30 EXAM QUESTIONS
// --------------------------------------------------
const examQuestions = [
  { q: "1) PPE คืออะไร?", choices: ["อุปกรณ์ป้องกันอันตรายส่วนบุคคล", "รองเท้าธรรมดา", "เสื้อผ้าทั่วไป"], answer: 0 },
  { q: "2) หมวกนิรภัยต้องสวมเมื่อไหร่?", choices: ["เมื่ออยู่ในพื้นที่ทำงาน", "เฉพาะตอนมีผู้จัดการมา", "ไม่จำเป็น"], answer: 0 },
  { q: "3) งานที่สูงคือความสูงตั้งแต่กี่เมตรขึ้นไป?", choices: ["1 เมตร", "2 เมตร", "5 เมตร"], answer: 1 },
  { q: "4) ถังดับเพลิงสีแดงใช้ดับอะไร?", choices: ["ไฟฟ้า", "เชื้อเพลิงของเหลว", "ไม้/กระดาษ"], answer: 2 },
  { q: "5) หากพบอุบัติเหตุควรทำอย่างไร?", choices: ["ถ่ายรูปก่อน", "แจ้งทีม Safety ทันที", "เดินหนี"], answer: 1 },
  { q: "6) จุดสูบบุหรี่ควรทำอย่างไร?", choices: ["สูบตรงไหนก็ได้", "สูบในห้องน้ำ", "สูบเฉพาะจุดที่กำหนด"], answer: 2 },
  { q: "7) การเดินในโรงงานควรเดินตรงไหน?", choices: ["เดินในเลนคนเดิน", "เดินบนถนนรถยก", "เดินตรงไหนก็ได้"], answer: 0 },
  { q: "8) ถ้าพบสารเคมีหกควรทำอย่างไร?", choices: ["เช็ดเอง", "แจ้ง Safety", "ปล่อยไว้"], answer: 1 },
  { q: "9) การยกของหนักควรทำอย่างไร?", choices: ["ก้มหลังยก", "ใช้แรงเต็มที่", "ย่อตัวแล้วยก"], answer: 2 },
  { q: "10) ป้ายเตือนสีเหลืองหมายถึงอะไร?", choices: ["ข้อบังคับ", "คำเตือน", "ห้ามทำ"], answer: 1 },
  { q: "11) ป้ายวงกลมสีแดงมีเส้นทับหมายถึง?", choices: ["ควรทำ", "ห้ามทำ", "ไม่เกี่ยว"], answer: 1 },
  { q: "12) ถ้าต้องใช้บันไดควรทำอย่างไร?", choices: ["ปีนสองคน", "ตรวจสภาพก่อนใช้", "ใช้บันไดพัง"], answer: 1 },
  { q: "13) ถ้าต้องทำงานเชื่อมต้องมีอะไร?", choices: ["แว่นเชื่อม", "หมวกกันน็อค", "รองเท้าแตะ"], answer: 0 },
  { q: "14) ถ้าต้องทำงานในที่อับอากาศต้องมี?", choices: ["ใบอนุญาต", "ไฟฉาย", "น้ำดื่ม"], answer: 0 },
  { q: "15) รถยกมีสิทธิ์ในถนนโรงงานมากกว่าคนเดินหรือไม่?", choices: ["ใช่", "ไม่ใช่", "แล้วแต่เวลา"], answer: 1 },
  { q: "16) ถ้าพบสายไฟชำรุดควรทำอย่างไร?", choices: ["จับดู", "แจ้งช่างไฟ", "ใช้ต่อ"], answer: 1 },
  { q: "17) ถ้าต้องตัดเหล็กควรใส่อะไร?", choices: ["แว่นตานิรภัย", "หมวกแก๊ป", "ไม่มีอะไร"], answer: 0 },
  { q: "18) ถังดับเพลิงต้องตรวจทุกกี่เดือน?", choices: ["1 เดือน", "3 เดือน", "6 เดือน"], answer: 2 },
  { q: "19) ถ้าต้องทำงานบนที่สูงต้องใช้อะไร?", choices: ["รองเท้าแตะ", "เข็มขัดกันตก", "หมวกแก๊ป"], answer: 1 },
  { q: "20) การเดินในพื้นที่ผลิตควรใส่อะไร?", choices: ["รองเท้าเซฟตี้", "รองเท้าแตะ", "รองเท้าผ้าใบ"], answer: 0 },
  { q: "21) ถ้าต้องขนของหนักควรทำอย่างไร?", choices: ["ใช้รถเข็น", "ยกเอง", "ลากไปกับพื้น"], answer: 0 },
  { q: "22) ถ้าพบไฟไหม้ควรทำอย่างไร?", choices: ["วิ่งหนี", "แจ้ง 102/127/129", "ถ่ายคลิป"], answer: 1 },
  { q: "23) ถ้าต้องทำงานเสียงดังควรใส่อะไร?", choices: ["ที่อุดหู", "หมวกแก๊ป", "ไม่มีอะไร"], answer: 0 },
  { q: "24) ถ้าต้องทำงานกับสารเคมีควรใส่อะไร?", choices: ["แว่น + ถุงมือ", "รองเท้าแตะ", "ไม่มีอะไร"], answer: 0 },
  { q: "25) ถ้าพบคนหมดสติควรทำอย่างไร?", choices: ["เขย่าตัวแรง ๆ", "แจ้ง Safety", "ปล่อยไว้"], answer: 1 },
  { q: "26) ถ้าต้องใช้เครื่องมือไฟฟ้าควรทำอะไร?", choices: ["ตรวจสายไฟก่อนใช้", "ใช้ทันที", "ใช้ตอนเปียกน้ำ"], answer: 0 },
  { q: "27) ถ้าต้องเดินในพื้นที่มืดควรทำอย่างไร?", choices: ["ใช้ไฟฉาย", "เดินไปเลย", "วิ่ง"], answer: 0 },
  { q: "28) ถ้าต้องทำงานใกล้รถยกควรทำอย่างไร?", choices: ["เดินตัดหน้า", "รักษาระยะห่าง", "ยืนข้างรถ"], answer: 1 },
  { q: "29) ถ้าต้องทำงานร้อนควรทำอย่างไร?", choices: ["พักเป็นระยะ", "ทำต่อจนเสร็จ", "ไม่ต้องพัก"], answer: 0 },
  { q: "30) ถ้าพบสิ่งผิดปกติควรทำอย่างไร?", choices: ["แจ้ง Safety", "ปล่อยไว้", "ถ่ายรูปลงโซเชียล"], answer: 0 }
];
// --------------------------------------------------
// FLEX TEMPLATE FOR EXAM
// --------------------------------------------------
function examFlex(questionObj, number) {
  return {
    type: "flex",
    altText: `ข้อที่ ${number}`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: `ข้อที่ ${number}`,
            weight: "bold",
            size: "lg",
            color: "#1E90FF"
          },
          {
            type: "text",
            text: questionObj.q,
            wrap: true,
            size: "md",
            color: "#333333"
          },
          {
            type: "separator",
            margin: "md"
          },
          ...questionObj.choices.map((choice, index) => ({
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: {
              type: "postback",
              label: choice,
              data: `answer_${index}`
            }
          }))
        ]
      }
    }
  };
}
// --------------------------------------------------
// PDPA FLEX
// --------------------------------------------------
function pdpaFlex() {
  return {
    type: "flex",
    altText: "PDPA",
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "นโยบาย PDPA",
            weight: "bold",
            size: "lg",
            color: "#1E90FF"
          },
          {
            type: "text",
            text:
              "บริษัทมีการเก็บข้อมูลส่วนบุคคลเพื่อใช้ในการออกบัตรผู้รับเหมาและบันทึกการอบรมความปลอดภัย\n\n" +
              "ข้อมูลจะถูกใช้เพื่อ:\n" +
              "• ยืนยันตัวตนผู้รับเหมา\n" +
              "• ออกบัตรผู้รับเหมา\n" +
              "• บันทึกผลการอบรม\n" +
              "• ใช้ในระบบความปลอดภัยของบริษัท\n\n" +
              "กรุณากดยอมรับเพื่อดำเนินการต่อ",
            wrap: true,
            size: "sm",
            color: "#333333"
          },
          {
            type: "separator",
            margin: "md"
          },
          {
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: {
              type: "postback",
              label: "ยอมรับและกรอกข้อมูล",
              data: "pdpa_accept"
            }
          }
        ]
      }
    }
  };
}
// --------------------------------------------------
// FORM QUESTIONS
// --------------------------------------------------
const formQuestions = [
  { key: "fullname", text: "กรุณาพิมพ์ชื่อ–นามสกุลของคุณ" },
  { key: "phone", text: "กรุณาพิมพ์เบอร์โทรศัพท์" },
  { key: "idcard", text: "กรุณาพิมพ์เลขบัตรประชาชน 13 หลัก" },
  { key: "company", text: "กรุณาพิมพ์ชื่อบริษัทของคุณ" }
];
// --------------------------------------------------
// ส่งคำถามฟอร์มตามลำดับ
// --------------------------------------------------
function askFormQuestion(userId) {
  const step = userState[userId].step;
  const q = formQuestions[step];

  return {
    type: "text",
    text: q.text
  };
}
// --------------------------------------------------
// HANDLE FORM ANSWER
// --------------------------------------------------
async function handleFormAnswer(event, userId, text) {
  const state = userState[userId];
  const step = state.step;
  const key = formQuestions[step].key;

  // เก็บคำตอบลง formData
  state.formData[key] = text;
  state.step++;

  // ถ้ายังไม่ครบ → ถามคำถามถัดไป
  if (state.step < formQuestions.length) {
    return client.replyMessage(event.replyToken, askFormQuestion(userId));
  }

  // ถ้าครบแล้ว → เริ่มข้อสอบ
  state.mode = "exam";
  state.currentQuestion = 1;
  state.score = 0;

  const qObj = examQuestions[0];
  const flex = examFlex(qObj, 1);

  return client.replyMessage(event.replyToken, flex);
}
// --------------------------------------------------
// HANDLE EXAM ANSWER
// --------------------------------------------------
async function handleExamAnswer(event, userId, data) {
  const state = userState[userId];
  const qIndex = state.currentQuestion - 1;
  const question = examQuestions[qIndex];

  // ดึงคำตอบที่ user เลือก
  const selected = Number(data.replace("answer_", ""));

  // ตรวจคำตอบ
  if (selected === question.answer) {
    state.score++;
  }

  // ไปข้อถัดไป
  state.currentQuestion++;

  // ถ้ายังไม่ครบ 30 ข้อ → ส่งข้อถัดไป
  if (state.currentQuestion <= examQuestions.length) {
    const nextQ = examQuestions[state.currentQuestion - 1];
    const flex = examFlex(nextQ, state.currentQuestion);
    return client.replyMessage(event.replyToken, flex);
  }

  // ถ้าครบแล้ว → ไปท่อน 4.2
  return finishExam(event, userId);
}
// --------------------------------------------------
// FINISH EXAM → CALCULATE SCORE + SEND TO SHEET
// --------------------------------------------------
async function finishExam(event, userId) {
  const state = userState[userId];

  const total = examQuestions.length;
  const score = state.score;
  const pass = score >= 24 ? "ผ่าน" : "ไม่ผ่าน"; // ผ่าน 80%

  // เปลี่ยนโหมด
  state.mode = "waiting_certificate";

  // ส่งข้อมูลไป Google Sheet
  await sendToGoogleSheet(userId, pass);

  // ส่งสรุปผลสอบให้ผู้ใช้
  const summary = {
    type: "flex",
    altText: "สรุปผลสอบ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "สรุปผลการทำแบบทดสอบ",
            weight: "bold",
            size: "lg",
            color: "#1E90FF"
          },
          {
            type: "text",
            text: `คะแนนของคุณ: ${score} / ${total}`,
            size: "md",
            color: "#333333"
          },
          {
            type: "text",
            text: `ผลสอบ: ${pass}`,
            weight: "bold",
            size: "md",
            color: pass === "ผ่าน" ? "#32CD32" : "#FF0000"
          },
          {
            type: "separator",
            margin: "md"
          },
          {
            type: "text",
            text:
              pass === "ผ่าน"
                ? "ระบบกำลังสร้างบัตรผู้รับเหมา กรุณารอสักครู่…"
                : "คุณไม่ผ่านการทดสอบ กรุณาทำใหม่อีกครั้ง",
            wrap: true,
            size: "sm",
            color: "#555555"
          }
        ]
      }
    }
  };

  return client.replyMessage(event.replyToken, summary);
}
// --------------------------------------------------
// SEND DATA TO GOOGLE SHEET
// --------------------------------------------------
async function sendToGoogleSheet(userId, passStatus) {
  const state = userState[userId];
  const data = state.formData;

  const payload = {
    userId: userId,
    fullname: data.fullname,
    phone: data.phone,
    idcard: data.idcard,
    company: data.company,
    contractorType: state.contractorType,
    score: state.score,
    status: passStatus,
    timestamp: new Date().toISOString()
  };

  try {
    await axios.post(SHEET_API_URL, payload);
  } catch (err) {
    console.error("❌ ERROR sending to Google Sheet:", err);
  }
}
// --------------------------------------------------
// GET CERTIFICATE URL FROM GOOGLE SHEET
// --------------------------------------------------
async function getCertificateUrl(userId) {
  try {
    const res = await axios.get(`${SHEET_API_URL}?userId=${userId}`);
    return res.data.certificate_url || null;
  } catch (err) {
    console.error("❌ ERROR fetching certificate:", err);
    return null;
  }
}
// --------------------------------------------------
// CERTIFICATE FLEX
// --------------------------------------------------
function certificateFlex(url) {
  return {
    type: "flex",
    altText: "ดาวน์โหลดบัตรผู้รับเหมา",
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "บัตรผู้รับเหมา",
            weight: "bold",
            size: "lg",
            color: "#1E90FF"
          },
          {
            type: "text",
            text: "กดปุ่มด้านล่างเพื่อดาวน์โหลดบัตรผู้รับเหมา",
            wrap: true,
            size: "sm",
            color: "#555555"
          },
          {
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: {
              type: "uri",
              label: "ดาวน์โหลดบัตรผู้รับเหมา",
              uri: url
            }
          }
        ]
      }
    }
  };
}
// --------------------------------------------------
// HANDLE DOWNLOAD CERTIFICATE
// --------------------------------------------------
async function handleDownloadCertificate(event, userId) {
  const url = await getCertificateUrl(userId);

  if (!url) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text:
        "⏳ ระบบกำลังสร้างบัตรผู้รับเหมาอยู่ครับ\n" +
        "กรุณารอสักครู่ แล้วพิมพ์คำว่า \"ดาวน์โหลดบัตร\" อีกครั้ง"
    });
  }

  const flex = certificateFlex(url);
  return client.replyMessage(event.replyToken, flex);
}
// --------------------------------------------------
// SEND DOCUMENTS BY CONTRACTOR TYPE
// --------------------------------------------------
async function sendDocumentsByType(event, userId) {
  const type = userState[userId].contractorType;

  // -------------------------------
  // ผู้รับ–ส่งสินค้า (Delivery)
  // -------------------------------
  if (type === "delivery") {
    const flex = {
      type: "flex",
      altText: "เอกสารผู้รับ–ส่งสินค้า",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: "เอกสารสำหรับผู้รับ–ส่งสินค้า",
              weight: "bold",
              size: "lg",
              color: "#1E90FF"
            },
            {
              type: "text",
              text: "กรุณาดาวน์โหลดเอกสารด้านล่างนี้",
              size: "sm",
              color: "#555555"
            },
            {
              type: "button",
              style: "primary",
              color: "#32CD32",
              action: {
                type: "uri",
                label: "เอกสารบันทึกการอบรม",
                uri: "https://drive.google.com/file/d/1QWnOr9Cmkdbsmp0byIlocZmmVIjcPqWe/view"
              }
            }
          ]
        }
      }
    };

    return client.replyMessage(event.replyToken, flex);
  }

  // -------------------------------
  // ผู้เข้ามาทำงาน–แก้ไขงาน (Vendor)
  // -------------------------------
  const flexVendor = {
    type: "flex",
    altText: "เอกสารผู้เข้ามาทำงาน–แก้ไขงาน",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "เอกสารสำหรับผู้เข้ามาทำงาน–แก้ไขงาน",
            weight: "bold",
            size: "lg",
            color: "#1E90FF"
          },
          {
            type: "text",
            text: "กรุณาดาวน์โหลดเอกสารทั้งหมดด้านล่างนี้",
            size: "sm",
            color: "#555555"
          },
          {
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: {
              type: "uri",
              label: "เอกสารบันทึกการอบรม",
              uri: "https://drive.google.com/file/d/1QWnOr9Cmkdbsmp0byIlocZmmVIjcPqWe/view"
            }
          },
          {
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: {
              type: "uri",
              label: "ใบขอเข้ามาทำงาน",
              uri: "https://drive.google.com/file/d/1m9zT6FEHTFs_GdXIcKrr3WCngONKn4OV/view"
            }
          },
          {
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: {
              type: "uri",
              label: "ใบตรวจสอบเครื่องมือ",
              uri: "https://drive.google.com/file/d/1HJxEXai6--EduOXJTDGtvl0-Sfu5_k7c/view"
            }
          }
        ]
      }
    }
  };

  return client.replyMessage(event.replyToken, flexVendor);
}
if (msg.includes("ดาวน์โหลดบัตร")) {
  await handleDownloadCertificate(event, userId);
  return sendDocumentsByType(event, userId);
}
// --------------------------------------------------
// WEBHOOK
// --------------------------------------------------
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const event = req.body.events[0];
    if (!event) return res.status(200).end();

    const userId = event.source.userId;
    const text = event.message?.text || "";
    const msg = normalize(text);

    // -------------------------------
    // USER อยู่ในโหมดสอบ
    // -------------------------------
    if (userState[userId]) {
      const state = userState[userId];

      // PDPA
      if (state.mode === "pdpa") {
        if (event.postback?.data === "pdpa_accept") {
          state.mode = "form";
          state.step = 0;
          return client.replyMessage(event.replyToken, askFormQuestion(userId));
        }
        return;
      }

      // FORM
      if (state.mode === "form") {
        return handleFormAnswer(event, userId, text);
      }

      // EXAM
      if (state.mode === "exam") {
        if (event.postback?.data?.startsWith("answer_")) {
          return handleExamAnswer(event, userId, event.postback.data);
        }
        return;
      }

      // WAITING CERTIFICATE
      if (state.mode === "waiting_certificate") {
        if (msg.includes("ดาวน์โหลดบัตร")) {
          await handleDownloadCertificate(event, userId);
          return sendDocumentsByType(event, userId);
        }

        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "พิมพ์ \"ดาวน์โหลดบัตร\" เพื่อรับบัตรผู้รับเหมา"
        });
      }
    }

    // -------------------------------
    // เริ่มทำแบบทดสอบ
    // -------------------------------
    if (msg.includes("ผู้รับส่งสินค้า") || msg.includes("ผู้รับ-ส่งสินค้า")) {
      userState[userId] = {
        mode: "pdpa",
        contractorType: "delivery",
        step: 0,
        formData: {},
        currentQuestion: 1,
        score: 0
      };
      return client.replyMessage(event.replyToken, pdpaFlex());
    }

    if (msg.includes("ผู้แก้ไขงาน") || msg.includes("ผู้เข้ามาทำงาน")) {
      userState[userId] = {
        mode: "pdpa",
        contractorType: "vendor",
        step: 0,
        formData: {},
        currentQuestion: 1,
        score: 0
      };
      return client.replyMessage(event.replyToken, pdpaFlex());
    }

    // -------------------------------
    // คำสั่งดาวน์โหลดบัตร (สำรอง)
    // -------------------------------
    if (msg.includes("ดาวน์โหลดบัตร")) {
      await handleDownloadCertificate(event, userId);
      return sendDocumentsByType(event, userId);
    }

    // -------------------------------
    // FALLBACK
    // -------------------------------
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "พิมพ์ \"ผู้รับส่งสินค้า\" หรือ \"ผู้เข้ามาทำงาน\" เพื่อเริ่มทำแบบทดสอบ"
    });

  } catch (err) {
    console.error("❌ ERROR in webhook:", err);
    return res.status(500).end();
  }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------
app.listen(process.env.PORT || 3000, () => {
  console.log("SERVER RUNNING");
});
