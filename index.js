require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");

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
// WEBHOOK (SDK v3 ใช้แบบนี้เท่านั้น)
// --------------------------------------------------
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const event = req.body.events[0];

    // ถ้าไม่ใช่ข้อความ → ไม่ตอบ
    if (!event || event.type !== "message" || event.message.type !== "text") {
      return res.status(200).end();
    }

    // ดึง userId
    const userId = event.source.userId;

    // ส่ง userId กลับไปให้ผู้ใช้
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "Your userId: " + userId
    });

    return res.status(200).end();

  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).end();
  }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------
app.listen(3000, () => {
  console.log("Server running");
});
