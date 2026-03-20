require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

// --------------------------------------------------
// CONFIG (Render ENV)
// --------------------------------------------------
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// --------------------------------------------------
// SAFETY Q&A
// --------------------------------------------------
const safetyQA = [
  {
    question: "ทำไมต้องอบรม",
    answer: `เพราะบริษัทต้องให้แน่ใจว่าผู้รับเหมารู้กฎความปลอดภัยก่อนเริ่มงาน  
ศึกษาข้อมูล:  
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
  },

  {
    question: "ppeคืออะไร",
    answer: `PPE คืออุปกรณ์ป้องกันอันตราย เช่น หมวกนิรภัย รองเท้าเซฟตี้ แว่นตา ถุงมือ  
ศึกษาข้อมูล:  
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
  },

  {
    question: "งานที่สูงคืออะไร",
    answer: `งานที่ทำบนที่สูงเกิน 2 เมตร ต้องใช้อุปกรณ์กันตก  
ศึกษาข้อมูล:  
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
  },

  {
    question: "สารเคมีคืออะไร",
    answer: `ของเหลวหรือของแข็งที่อาจเป็นพิษ ระคายเคือง หรือไวไฟ  
ศึกษาข้อมูล:  
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
  },

  {
    question: "ที่อับอากาศคืออะไร",
    answer: `พื้นที่แคบ อากาศไม่พอ อาจมีแก๊สพิษหรือออกไม่ได้ อันตรายถึงชีวิต  
ศึกษาข้อมูล:  
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
  },

  {
    question: "จุดสูบบุหรี่",
    answer: `📍 จุดสูบบุหรี่  
โรงงาน 1: สนามฟุตบอล / หลังอาคาร 4  
โรงงาน 2: ข้างโรงขยะ`
  },

  {
    question: "ขยะมีกี่ประเภท",
    answer: `♻️ ขยะมี 5 ประเภท: ทั่วไป / ผลิต / อันตราย / ติดเชื้อ / Scrap`
  },

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

/* --------------------------------------------------
   CATEGORIES
-------------------------------------------------- */
const categories = {
  greeting: ["สวัสดี", "หวัดดี", "ดีครับ", "ดีค่ะ", "ดีจ้า", "ฮัลโหล"],

  feeling: [
    "เศร้า", "ร้องไห้", "เสียใจ", "เครียด", "กังวล",
    "ท้อ", "ผิดหวัง", "เหนื่อย", "เหนื่อยไหม", "กำลังใจ"
  ],

  daily: [
    "ทำไรอยู่", "ทำอะไรอยู่", "อยู่ไหน", "ไปไหนมา",
    "กินข้าวยัง", "กินข้าวหรือยัง", "ง่วงไหม", "นอนยัง", "หิว"
  ],

  compliment: ["เก่งมาก", "สุดยอด", "ดีมาก", "เยี่ยมเลย", "น่ารักจัง"],

  friendly: ["คิดถึง", "รัก", "เหงา", "เบื่อ"],

  exclaim: ["โอ้โห", "โหดจัง", "จริงดิ", "สุดจัด"],

  botinfo: ["ชื่ออะไร", "ชื่อบอท", "คุณคือใคร", "เป็นใคร", "แนะนำตัว", "ทำอะไรได้บ้าง"]
};


/* --------------------------------------------------
   REPLIES
-------------------------------------------------- */
const replies = {
  greeting: {
    "สวัสดี": "สวัสดีครับ 🙂",
    "หวัดดี": "หวัดดีครับ 🙂",
    "ดีครับ": "ดีครับผม Safety พร้อมช่วยครับ",
    "ดีค่ะ": "ดีค่ะ 🙂",
    "ดีจ้า": "ดีจ้าาา 🙂",
    "ฮัลโหล": "ฮัลโหลครับ 🙂"
  },

  feeling: {
    "เศร้า": "ไม่ต้องเศร้านะครับ Safety อยู่ตรงนี้💚 🙂",
    "ร้องไห้": "ไม่เป็นไรนะครับ ผมอยู่ตรงนี้ครับ",
    "เสียใจ": "เดี๋ยวทุกอย่างดีขึ้นนะครับ สู้ ๆ ครับ",
    "เครียด": "พักก่อนก็ได้นะครับ อย่ากดดันตัวเองมาก",
    "กังวล": "ไม่ต้องกังวลนะครับ ผมอยู่เป็นเพื่อนครับ",
    "ท้อ": "พักก่อนนะครับ เดี๋ยวค่อยลุยใหม่ได้ครับ",
    "ผิดหวัง": "ไม่เป็นไรนะครับ ทุกอย่างเริ่มใหม่ได้เสมอ 🙂",
    "เหนื่อย": "พักหน่อยนะครับ เดี๋ยวค่อยลุยใหม่ได้ครับ",
    "เหนื่อยไหม": "เหนื่อยมากครับช่วงนี้งานเยอะมาก 💚แต่ยังพร้อมช่วยอยู่ครับ💚 🙂",
    "กำลังใจ": "ส่งกำลังใจให้ครับ ✨ สู้ไปด้วยกันนะครับ"
  },

  daily: {
    "ทำไรอยู่": "Safety กำลัง standby พร้อมช่วยครับ 🙂",
    "ทำอะไรอยู่": "Safety กำลัง standby พร้อมช่วยครับ 🙂",
    "อยู่ไหน": "Safety 💚อยู่ในระบบนี่แหละครับ พร้อมช่วยเสมอ",
    "ไปไหนมา": "Safety 💚ยังอยู่ตรงนี้เลยครับ 🙂",
    "กินข้าวยัง": "ยังเลยครับ ช่วงนี้ Safety งานเยอะ 😅",
    "กินข้าวหรือยัง": "ยังเลยครับ ช่วงนี้ Safety งานเยอะ 😅",
    "ง่วงไหม": "ง่วงนิดหน่อยครับ💚 แต่ยังช่วยได้ครับ 🙂",
    "นอนยัง": "ยังครับ Safety standby อยู่ครับ",
    "หิว": "หิวเหมือนกันครับ 😅 กินอะไรอร่อย ๆ หน่อยไหม"
  },

  compliment: {
    "เก่งมาก": "พี่เก่งมากครับ 🙂",
    "สุดยอด": "สุดยอดไปเลยครับ!",
    "ดีมาก": "ดีมากครับผม!",
    "เยี่ยมเลย": "เยี่ยมจริง ๆ ครับ!",
    "น่ารักจัง": "ขอบคุณครับ เขินเลย 😳"
  },

  friendly: {
    "คิดถึง": "Safety 💚คิดถึงเหมือนกันครับ 🙂",
    "รัก": "Safety 💚 รักๆๆๆๆเหมือนกันครับ 💚",
    "เหงา": "ไม่ต้องเหงานะครับ Safety อยู่ตรงนี้ 🙂",
    "เบื่อ": "อย่าเบื่อ 💚Safety💚 นะครับ 😅"
  },

  exclaim: {
    "โอ้โห": "โอ้โหจริงครับ!",
    "โหดจัง": "โหดมากครับ!",
    "จริงดิ": "จริงครับ!",
    "สุดจัด": "สุดจัดเลยครับ!"
  },

  botinfo: {
    "ชื่ออะไร": botIntro(),
    "ชื่อบอท": botIntro(),
    "คุณคือใคร": botIntro(),
    "เป็นใคร": botIntro(),
    "แนะนำตัว": botIntro(),
    "ทำอะไรได้บ้าง": botIntro()
  }
};
/* --------------------------------------------------
   BOT INTRO FUNCTION
-------------------------------------------------- */
function botIntro() {
  return (
`สวัสดีครับ ผมชื่อ Sodick Safety AI Bot 🤖💚  
ผู้ช่วยอัจฉริยะด้านความปลอดภัยสำหรับผู้รับเหมาที่เข้ามาปฏิบัติงานในบริษัท Sodick Thailand  

ผมถูกออกแบบมาเพื่อช่วยให้ผู้รับเหมาทุกบริษัทเข้าถึงข้อมูลสำคัญได้อย่างสะดวก  
ไม่ว่าจะเป็นกฎระเบียบด้านความปลอดภัย ขั้นตอนการทำงาน การอบรม  
เอกสารที่จำเป็น รวมถึงข้อมูลที่เกี่ยวข้องกับการปฏิบัติงานในพื้นที่ของเรา  

ผมพร้อมสนับสนุนให้ทุกขั้นตอนของงานเป็นไปอย่างถูกต้อง มีมาตรฐาน  
และปลอดภัยสูงสุดครับ

Hello, my name is Sodick Safety AI Bot 🤖💚  
An intelligent safety assistant designed for contractors working within Sodick Thailand.  

My purpose is to help all vendors easily access essential information, including safety regulations,  
work procedures, required training, and important documents related to on-site operations.  

I am here to support you in ensuring that every step of your work is compliant, efficient,  
and carried out with the highest level of safety.`
  );
}


/* --------------------------------------------------
   REPLY FUNCTION
-------------------------------------------------- */
function reply(event, text) {
  return client.replyMessage(event.replyToken, {
    type: "text",
    text,
  });
}

/* --------------------------------------------------
   NORMALIZE (เวอร์ชันสุดท้าย)
-------------------------------------------------- */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/–/g, "-")
    .replace(/—/g, "-")
    .trim();
}

/* --------------------------------------------------
   FLEX: CONTACT CARD
-------------------------------------------------- */
const FLEX_CONTACT_CARD = {
  type: "bubble",
  header: {
    type: "box",
    layout: "vertical",
    paddingAll: "16px",
    backgroundColor: "#1E90FF",
    contents: [
      {
        type: "text",
        text: "📞 Sodick Thailand – Contact",
        weight: "bold",
        size: "md",
        color: "#FFFFFF"
      }
    ]
  },
  body: {
    type: "box",
    layout: "vertical",
    spacing: "lg",
    contents: [
      {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: "🏭 โรงงาน 1", weight: "bold", size: "md" },
          { type: "text", text: "เบอร์บริษัท: 02-529-2450 ถึง 6", size: "sm", color: "#555555" },
          { type: "text", text: "เบอร์ภายใน: 102, 127, 129", size: "sm", color: "#555555" },
          {
            type: "button",
            style: "primary",
            color: "#1E90FF",
            action: { type: "uri", label: "โทรโรงงาน 1", uri: "tel:025292450" }
          }
        ]
      },

      { type: "separator" },

      {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: "🏭 โรงงาน 2", weight: "bold", size: "md" },
          { type: "text", text: "เบอร์บริษัท: 02-529-3200 ถึง 6", size: "sm", color: "#555555" },
          { type: "text", text: "เบอร์ภายใน: 137", size: "sm", color: "#555555" },
          {
            type: "button",
            style: "primary",
            color: "##1E90FF",
            action: { type: "uri", label: "โทรโรงงาน 2", uri: "tel:025293200" }
          }
        ]
      },

      { type: "separator" },

      {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: "📱 เบอร์มือถือทีมเซฟตี้", weight: "bold", size: "md" },
          { type: "text", text: "พี่ไก่: 061-645-5095", size: "sm", color: "#555555" },
          { type: "text", text: "น้องดุจ: 081-695-4474", size: "sm", color: "#555555" },
          { type: "text", text: "น้องพิน: 083-237-4357", size: "sm", color: "#555555" },
          { type: "text", text: "น้องกี้: 094-938-0425", size: "sm", color: "#555555" }
        ]
      }
    ]
  }
};

/* --------------------------------------------------
   WEBHOOK
-------------------------------------------------- */
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const event = req.body.events[0];

    if (!event || event.type !== "message" || event.message.type !== "text") {
      return res.status(200).end();
    }

    const text = event.message.text;
    const msg = normalize(text);
    const cleanText = msg;

    /* --------------------------------------------------
       1) เงื่อนไขเฉพาะในกลุ่ม
    -------------------------------------------------- */
    if (event.source.type === "group") {
      const triggers = ["บอท", "bot", "safety", "Safety"];
      const hasTrigger = triggers.some((w) => text.includes(w));
      if (!hasTrigger) return res.status(200).end();
    }

    /* --------------------------------------------------
       2) Emergency
    -------------------------------------------------- */
    if (
      msg.includes("อุบัติเหตุ") ||
      msg.includes("ฉุกเฉิน") ||
      msg.includes("ไฟไหม้") ||
      msg.includes("บาดเจ็บ") ||
      msg.includes("danger") ||
      msg.includes("emergency")
    ) {
      return reply(event, `⚠️ เหตุฉุกเฉิน กรุณาติดต่อทันที  
โรงงาน 1: 102 / 127 / 129  
โรงงาน 2: 137  
ผู้จัดการ: 100`);
    }

    /* --------------------------------------------------
       3) Safety Q&A
    -------------------------------------------------- */
    const found = safetyQA.find((q) =>
      msg.includes(normalize(q.question))
    );
    if (found) return reply(event, found.answer);

    /* --------------------------------------------------
       4) Categories
    -------------------------------------------------- */
    for (const category in categories) {
      for (const word of categories[category]) {
        if (msg.includes(normalize(word))) {
          return reply(event, replies[category][word]);
        }
      }
    }

    /* --------------------------------------------------
       เบอร์ติดต่อ (Flex Message)
    -------------------------------------------------- */
    if (
      msg.includes("เบอร์ติดต่อ") ||
      msg.includes("ขอเบอร์ติดต่อ") ||
      msg.includes("ขอเบอร์") ||
      msg.includes("เบอร์โทร") ||
      msg.includes("ขอเบอร์โทร") ||
      msg.includes("เบอร์บริษัท") ||
      msg.includes("เบอร์โรงงาน") ||
      msg.includes("เบอร์ภายใน") ||
      msg.includes("โทรโรงงาน") ||
      msg.includes("โทรบริษัท") ||
      msg.includes("ติดต่อบริษัท") ||
      msg.includes("contact") ||
      msg.includes("call") ||
      msg.includes("phone") ||
      msg.includes("เบอร์")
    ) {
      return client.replyMessage(event.replyToken, {
        type: "flex",
        altText: "เบอร์ติดต่อบริษัท Sodick Thailand",
        contents: FLEX_CONTACT_CARD
      });
    }
    
/* --------------------------------------------------
   ปุ่มที่ 4 : ผู้รับเหมา
-------------------------------------------------- */
if (
  cleanText.includes("ข้อมูลผู้รับเหมา") ||
  cleanText.includes("ผู้รับเหมา")
) {
  const headerText = {
    type: "text",
    text: `ข้อมูลผู้รับเหมา  
กรุณาส่งเอกสารบันทึกการอบรมกลับมาที่อีเมล  
thai_safety@sodick.co.th`
  };

  const flex = {
    type: "flex",
    altText: "ข้อมูลผู้รับเหมา",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#1E90FF",
            action: {
              type: "message",
              label: "สำหรับ ผู้รับ–ส่งสินค้า",
              text: "ผู้รับส่งสินค้า"
            }
          },
          {
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: {
              type: "message",
              label: "สำหรับ ผู้เข้ามาทำงาน–แก้ไขงาน",
              text: "ผู้แก้ไขงาน"
            }
          },
          {
            type: "button",
            style: "primary",
            color: "#FF0000",
            action: {
              type: "message",
              label: "ขอบัตรย้อนหลัง",
              text: "ขอบัตรย้อนหลัง"
            }
          }
        ]
      }
    }
  };

  return client.replyMessage(event.replyToken, [headerText, flex]);
}
/* --------------------------------------------------
   เมนูย่อย: ผู้รับ–ส่งสินค้า
-------------------------------------------------- */
if (
  cleanText.includes("ผู้รับส่งสินค้า") ||
  cleanText.includes("ผู้รับ-ส่งสินค้า") ||
  cleanText.includes("รับส่งสินค้า")
) {

  const flex = {
    type: "flex",
    altText: "ผู้รับ–ส่งสินค้า",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#1E90FF",
            action: {
              type: "uri",
              label: "วีดีโออบรม",
              uri: "https://drive.google.com/file/d/1bz2qUynfvSFNuS3FoM1iGcLIn3Z8m0fb/view?usp=drivesdk"
            }
          },
          {
            type: "button",
            style: "primary",
            color: "#1E90FF",
            action: {
              type: "uri",
              label: "ทำแบบทดสอบ",
              uri: "https://docs.google.com/forms/d/e/1FAIpQLSeJtzzJRUguEBn0vynw3DgSyDvG3nnUGnWYrRWa8A3-pguzeQ/viewform?usp=header"
            }
          },
          {
            type: "button",
            style: "primary",
            color: "#1E90FF",
            action: {
              type: "uri",
              label: "เอกสารบันทึกการอบรม",
              uri: "https://drive.google.com/file/d/1QWnOr9Cmkdbsmp0byIlocZmmVIjcPqWe/view?usp=drivesdk"
            }
          }
        ]
      }
    }
  };

  return client.replyMessage(event.replyToken, flex);
}


/* --------------------------------------------------
   เมนูย่อย: ผู้เข้ามาทำงาน–แก้ไขงาน
-------------------------------------------------- */
if (
  cleanText.includes("ผู้แก้ไขงาน") ||
  cleanText.includes("แก้ไขงาน") ||
  cleanText.includes("ผู้เข้ามาทำงาน")
) {

  const flex = {
    type: "flex",
    altText: "ผู้เข้ามาทำงาน–แก้ไขงาน",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: {
              type: "uri",
              label: "วีดีโออบรม",
              uri: "https://drive.google.com/file/d/1bz2qUynfvSFNuS3FoM1iGcLIn3Z8m0fb/view?usp=drivesdk"
            }
          },
          {
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: {
              type: "uri",
              label: "ทำแบบทดสอบ",
              uri: "https://docs.google.com/forms/d/e/1FAIpQLSeJtzzJRUguEBn0vynw3DgSyDvG3nnUGnWYrRWa8A3-pguzeQ/viewform?usp=header"
            }
          },
          {
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: {
              type: "uri",
              label: "เอกสารบันทึกการอบรม",
              uri: "https://drive.google.com/file/d/1QWnOr9Cmkdbsmp0byIlocZmmVIjcPqWe/view?usp=drivesdk"
            }
          },
          {
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: {
              type: "uri",
              label: "ใบขอเข้ามาทำงาน",
              uri: "https://drive.google.com/file/d/1m9zT6FEHTFs_GdXIcKrr3WCngONKn4OV/view?usp=drivesdk"
            }
          },
          {
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: {
              type: "uri",
              label: "ใบตรวจสอบเครื่องมือ",
              uri: "https://drive.google.com/file/d/1HJxEXai6--EduOXJTDGtvl0-Sfu5_k7c/view?usp=drivesdk"
            }
          }
        ]
      }
    }
  };

  return client.replyMessage(event.replyToken, flex);
}


/* --------------------------------------------------
   ปุ่มที่ 3 : ขอบัตรย้อนหลัง
-------------------------------------------------- */
if (
  cleanText.includes("ขอบัตรย้อนหลัง") ||
  cleanText.includes("ขอ้บัตรย้อนหลัง") ||
  cleanText.includes("บัตรย้อนหลัง")
) {
  return client.replyMessage(event.replyToken, {
    type: "text",
    text: "ระบบกำลังตรวจสอบข้อมูลของคุณ...\nขณะนี้ยังไม่พบข้อมูลใบเซอร์ย้อนหลังของคุณในระบบ"
  });
}


/* --------------------------------------------------
   ⭐ ปุ่มที่ 6 — ส่งรูป + ปุ่มโทร
-------------------------------------------------- */
if (msg.includes("ติดต่อทีมเซฟตี้")) {

  await client.replyMessage(event.replyToken, {
    type: "image",
    originalContentUrl: "https://drive.google.com/uc?export=view&id=18x1R8O2FLduj-lFn22lWphUxh-qsodxs",
    previewImageUrl: "https://drive.google.com/uc?export=view&id=18x1R8O2FLduj-lFn22lWphUxh-qsodxs"
  });

  await client.pushMessage(event.source.userId, {
    type: "flex",
    altText: "เบอร์ติดต่อทีมเซฟตี้",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "เลือกเบอร์ที่ต้องการโทร",
            weight: "bold",
            size: "lg",
            align: "center"
          },
          {
            type: "button",
            style: "primary",
            color: "#1E90FF",
            action: { type: "uri", label: "พี่ช้าง (Safety Mgr.)", uri: "tel:0813765583" }
          },
          {
            type: "button",
            style: "primary",
            color: "#1E90FF",
            action: { type: "uri", label: "พี่ไก่ (Safety Factory1)", uri: "tel:0616455095" }
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "uri", label: "น้องพิน (Safety Factory2)", uri: "tel:0832374357" }
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "uri", label: "น้องดุจ (Safety Factory1)", uri: "tel:0816954474" }
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "uri", label: "น้องกี้ (Safety Environment)", uri: "tel:0949380425" }
          }
        ]
      }
    }
  });

  return;
}
/* --------------------------------------------------
   แผนที่บริษัท (Flex Message)
-------------------------------------------------- */
if (
  msg.includes("แผนที่") ||
  msg.includes("map") ||
  msg.includes("location") ||
  msg.includes("โลเคชั่น") ||
  msg.includes("โรงงานอยู่ไหน") ||
  msg.includes("ไปโรงงาน") ||
  msg.includes("factory")
) {

  return client.replyMessage(event.replyToken, {
    type: "flex",
    altText: "แผนที่บริษัท Sodick Thailand",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "horizontal",
        paddingAll: "16px",
        backgroundColor: "#1E90FF",
        contents: [
          {
            type: "text",
            text: "📍 Sodick Thailand – Map Guide",
            weight: "bold",
            size: "md",
            color: "#FFFFFF"
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        contents: [
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "🏭 โรงงาน 1 (Factory 1)",
                weight: "bold",
                size: "md"
              },
              {
                type: "text",
                text: "Google Maps อัปเดตล่าสุด: เม.ย. 2022",
                size: "sm",
                color: "#555555"
              },
              {
                type: "button",
                style: "primary",
                color: "#1E90FF",
                action: {
                  type: "uri",
                  label: "เปิดแผนที่โรงงาน 1",
                  uri: "https://maps.app.goo.gl/ycBgWvYA8ze8L6Hj8"
                }
              }
            ]
          },

          {
            type: "separator"
          },

          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "🏭 โรงงาน 2 (Factory 2)",
                weight: "bold",
                size: "md"
              },
              {
                type: "text",
                text: "Google Maps อัปเดตล่าสุด: เม.ย. 2025",
                size: "sm",
                color: "#555555"
              },
              {
                type: "button",
                style: "primary",
                color: "#1E90FF",
                action: {
                  type: "uri",
                  label: "เปิดแผนที่โรงงาน 2",
                  uri: "https://maps.app.goo.gl/keZxD798z9ZwKXE7A"
                }
              }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "กดปุ่มเพื่อเปิดเส้นทางใน Google Maps",
            size: "xs",
            color: "#888888",
            align: "center"
          }
        ]
      }
    }
  });
}

/* --------------------------------------------------
   6) Fallback
-------------------------------------------------- */
return client.replyMessage(event.replyToken, {
  type: "text",
  text:
`━━━━━━━━━━━━━━━━━━━━
❗ ไม่พบข้อมูลคำถามนี้ในระบบ
━━━━━━━━━━━━━━━━━━━━

ขออภัยครับ 🙂  
ระบบยังไม่มีคำตอบสำหรับคำถามนี้  
แต่เราจะอัปเดตฐานข้อมูลอย่างต่อเนื่องครับ

📞 ติดต่อผู้พัฒนาระบบ  
@Trerasak_K (พี่ไก่)

➕ เพิ่มเพื่อนผู้ดูแล  
https://line.me/ti/p/_T4H-3TKUa`
});

/* --------------------------------------------------
   Server
-------------------------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("LINE Bot server running on port " + PORT));
