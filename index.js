require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

// ใช้ชื่อ ENV ให้ตรงกับ Render
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }
  const msg = event.message.text
  .toLowerCase()
  .trim()
  .replace(/\s+/g, "");

// 1) ทักทายทั่วไป (ไทย + อังกฤษ)
if (
  msg.includes("สวัสดี") ||
  msg.includes("หวัดดี") ||
  msg.includes("ดีครับ") ||
  msg.includes("ดีค่ะ") ||
  msg.includes("hello") ||
  msg.includes("hi") ||
  msg.includes("hey")
) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `สวัสดีครับ ผมคือ Safety Bot ของ Sodick ครับ 🙂  
Hello! I am the Sodick Safety Bot 🙂`
  });
}

// 2) ถามชื่อ (ไทย + อังกฤษ)
if (
  msg.includes("ชื่ออะไร") ||
  msg.includes("ชื่ออะไรครับ") ||
  msg.includes("ชื่ออะไรคะ") ||
  msg.includes("your name") ||
  msg.includes("who are you")
) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `ผมชื่อ AI Sodick Safety ครับ  
You can call me the Sodick Safety Bot 🙂`
  });
}

// 3) ถามสบายดีไหม (ไทย + อังกฤษ)
if (
  msg.includes("สบายดีไหม") ||
  msg.includes("เป็นไงบ้าง") ||
  msg.includes("โอเคไหม") ||
  msg.includes("เหนื่อยไหม") ||
  msg.includes("how are you") ||
  msg.includes("are you ok")
) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `ช่วงนี้งานเยอะ เหนื่อยนิดหน่อยครับ  
I'm a bit busy lately, but I'm doing okay 🙂  
ขอกำลังใจหน่อยนะครับ 😅`
  });
}

// 4) ขอบคุณ (ไทย + อังกฤษ)
if (
  msg.includes("ขอบคุณ") ||
  msg.includes("thank") ||
  msg.includes("thanks")
) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `ยินดีมากครับ 🙂  
You're very welcome!  
ถ้ามีอะไรให้ช่วยเรื่องความปลอดภัย บอกผมได้เลยนะครับ`
  });
}

// 5) หัวเราะ (ไทย + อังกฤษ)
if (
  msg.includes("555") ||
  msg.includes("ฮ่า") ||
  msg.includes("lol") ||
  msg.includes("haha")
) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `ฮ่าๆๆ 😂  
Haha 😂  
ดีใจที่ทำให้คุณยิ้มได้นะครับ`
  });
}

// 6) ขอความช่วยเหลือทั่วไป (ไทย + อังกฤษ)
if (
  msg.includes("ช่วยด้วย") ||
  msg.includes("ขอความช่วยเหลือ") ||
  msg.includes("ช่วยหน่อย") ||
  msg.includes("help me") ||
  msg.includes("i need help")
) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `ผมอยู่ตรงนี้ครับ  
I'm here to help you.  
ถ้าเป็นเรื่องความปลอดภัย แจ้งรายละเอียดให้ผมได้เลยนะครับ`
  });
}

// 7) ถามว่าทำอะไรได้บ้าง (ไทย + อังกฤษ)
if (
  msg.includes("ทำอะไรได้บ้าง") ||
  msg.includes("ใช้ยังไง") ||
  msg.includes("ทำอะไรได้") ||
  msg.includes("what can you do") ||
  msg.includes("how to use")
) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `ตอนนี้ผมช่วยตอบคำถามทั่วไปได้ครับ 🙂  
I can answer general questions for now.  
เร็ว ๆ นี้จะช่วยเรื่องความปลอดภัยได้มากขึ้นครับ`
  });
}

// 8) ถามว่าอยู่ไหน (ไทย + อังกฤษ)
if (
  msg.includes("อยู่ไหน") ||
  msg.includes("อยู่ที่ไหน") ||
  msg.includes("where are you")
) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `ผมอยู่ในระบบครับ พร้อมช่วยเหลือเสมอ 🙂  
I'm always here in the system to support you 🙂`
  });
}

// 9) ถามว่ากินข้าวยัง (ไทย + อังกฤษ)
if (
  msg.includes("กินข้าวยัง") ||
  msg.includes("กินข้าวหรือยัง") ||
  msg.includes("have you eaten")
) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `ยังเลยครับ ช่วงนี้งานเยอะมาก 😅  
Not yet, I'm quite busy 😅  
แล้วคุณล่ะครับ กินข้าวหรือยัง`
  });
}

// 10) คำหยาบ (ไทย + อังกฤษ)
if (
  msg.includes("โง่") ||
  msg.includes("ควาย") ||
  msg.includes("สัส") ||
  msg.includes("เหี้ย") ||
  msg.includes("stupid") ||
  msg.includes("idiot")
) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `ใจเย็น ๆ นะครับ 🙂  
Please stay calm 🙂  
ผมอยู่เพื่อช่วยเหลือคุณนะครับ`
  });
}

// 11) แจ้งเหตุ / อันตราย / อุบัติเหตุ (ไทย + อังกฤษ)
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
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text:
`หากมีเหตุฉุกเฉิน กรุณาติดต่อเจ้าหน้าที่ความปลอดภัยทันทีนะครับ  
In case of emergency, please contact Safety staff immediately.

โรงงาน 1  
- น้องดุจ โทร 127  

โรงงาน 2  
- น้องพิน โทร 137  

ผู้จัดการ  
- พี่ช้าง โทร 100  

ผมพร้อมช่วยให้ข้อมูลเพิ่มเติมได้ครับ 🙂`
  });
}

// 12) หมวดความรู้สึก (รัก / คิดถึง / ห่วง / เหงา) ไทย + อังกฤษ
if (
  msg.includes("คิดถึง") ||
  msg.includes("รัก") ||
  msg.includes("รักนะ") ||
  msg.includes("ห่วง") ||
  msg.includes("เหงา") ||
  msg.includes("งอน") ||
  msg.includes("miss") ||
  msg.includes("love") ||
  msg.includes("lonely")
) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text:
`AI Sodick Safety คิดถึงเสมอ รักนะ จุ๊ฟๆ 💙  
AI Sodick Safety always misses you and cares for you 💙  
ทำงานอย่างปลอดภัยด้วยนะครับ 🙂`
  });
}

return client.replyMessage(event.replyToken, {
  type: "text",
  text:
`ระบบยังไม่มีข้อมูลคำถามนี้
แจ้งผู้พัฒนาระบบ: @Trerasak_K
เพิ่มเพื่อนผู้พัฒนา: https://line.me/ti/p/_T4H-3TKUa

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  mention: {
    mentionees: [
      {
        index: 27, // ตำแหน่งตัวอักษรที่ @Trerasak_K เริ่ม (พี่คำนวณให้ใหม่แล้ว)
        userId: "U4a74c3933c0ecf9d2062768696ba3df8"
      }
    ]
  }
});
}

// Render จะใช้ PORT จาก ENV
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("LINE Bot server running on port " + PORT);
});
