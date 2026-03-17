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

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: "คุณส่งข้อความว่า: " + event.message.text,
  });
}

// Render จะใช้ PORT จาก ENV
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("LINE Bot server running on port " + PORT);
});
