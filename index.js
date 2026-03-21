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

    if (!event || event.type !== "message" || event.message.type !== "text") {
      return res.status(200).end();
    }

    const userId = event.source.userId;

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
// START SERVER (ต้องใช้ PORT ของ Render เท่านั้น)
// --------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
