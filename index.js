require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

/* --------------------------------------------------
   CONFIG
-------------------------------------------------- */
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};
const client = new line.Client(config);

/* --------------------------------------------------
   UTILITIES
-------------------------------------------------- */
function reply(event, text) {
  return client.replyMessage(event.replyToken, {
    type: "text",
    text,
  });
}

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/–/g, "-")
    .replace(/—/g, "-")
    .trim();
}

/* --------------------------------------------------
   STATIC DATA — SAFETY Q&A (ลบกลุ่มเบอร์โทรออกแล้ว)
-------------------------------------------------- */
const safetyQA = [
  { question: "ทำไมต้องอบรม", answer: `เพราะบริษัทต้องให้แน่ใจว่าผู้รับเหมารู้กฎความปลอดภัยก่อนเริ่มงาน  
ศึกษาข้อมูล:  
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view` },

  { question: "ppeคืออะไร", answer: `PPE คืออุปกรณ์ป้องกันอันตราย เช่น หมวกนิรภัย รองเท้าเซฟตี้ แว่นตา ถุงมือ  
ศึกษาข้อมูล:  
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view` },

  { question: "งานที่สูงคืออะไร", answer: `งานที่ทำบนที่สูงเกิน 2 เมตร ต้องใช้อุปกรณ์กันตก  
ศึกษาข้อมูล:  
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view` },

  { question: "สารเคมีคืออะไร", answer: `ของเหลวหรือของแข็งที่อาจเป็นพิษ ระคายเคือง หรือไวไฟ  
ศึกษาข้อมูล:  
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view` },

  { question: "ที่อับอากาศคืออะไร", answer: `พื้นที่แคบ อากาศไม่พอ อาจมีแก๊สพิษหรือออกไม่ได้ อันตรายถึงชีวิต  
ศึกษาข้อมูล:  
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view` },

  { question: "จุดสูบบุหรี่", answer: `📍 จุดสูบบุหรี่  
โรงงาน 1: สนามฟุตบอล / หลังอาคาร 4  
โรงงาน 2: ข้างโรงขยะ` },

  { question: "ขยะมีกี่ประเภท", answer: `♻️ ขยะมี 5 ประเภท: ทั่วไป / ผลิต / อันตราย / ติดเชื้อ / Scrap` },

  { question: "ที่อยู่", answer: `📍 Sodick (Thailand)
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736` },

  { question: "ขอที่อยู่", answer: `📍 Sodick (Thailand)
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736` },

  { question: "ที่อยู่บริษัท", answer: `📍 Sodick (Thailand)
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736` },

  { question: "ชื่อบริษัท", answer: `📍 Sodick (Thailand)
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่) 
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736` },

  { question: "ใบกำกับภาษี", answer: `🧾 ใบกำกับภาษี Sodick (Thailand)  
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่) 
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736` },

  { question: "ข้อมูลบริษัท", answer: `🧾 ใบกำกับภาษี Sodick (Thailand)  
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่) 
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736` },

  { question: "อยากได้ที่อยู่บริษัท", answer: `🧾 ใบกำกับภาษี Sodick (Thailand)  
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่) 
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736` },

  { question: "บริษัท", answer: `🧾 ใบกำกับภาษี Sodick (Thailand)  
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่) 
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน คลองหนึ่ง คลองหลวง ปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736` },
];

/* --------------------------------------------------
   STATIC DATA — CATEGORIES + REPLIES + botIntro
-------------------------------------------------- */
const categories = {
  greeting: ["สวัสดี", "หวัดดี", "ดีครับ", "ดีค่ะ", "ดีจ้า", "ฮัลโหล"],
  feeling: ["เศร้า","ร้องไห้","เสียใจ","เครียด","กังวล","ท้อ","ผิดหวัง","เหนื่อย","เหนื่อยไหม","กำลังใจ"],
  daily: ["ทำไรอยู่","ทำอะไรอยู่","อยู่ไหน","ไปไหนมา","กินข้าวยัง","กินข้าวหรือยัง","ง่วงไหม","นอนยัง","หิว"],
  compliment: ["เก่งมาก","สุดยอด","ดีมาก","เยี่ยมเลย","น่ารักจัง"],
  friendly: ["คิดถึง","รัก","เหงา","เบื่อ"],
  exclaim: ["โอ้โห","โหดจัง","จริงดิ","สุดจัด"],
  botinfo: ["ชื่ออะไร","ชื่อบอท","คุณคือใคร","เป็นใคร","แนะนำตัว","ทำอะไรได้บ้าง"]
};

function botIntro() {
  return (
`สวัสดีครับ ผมชื่อ Sodick Safety AI Bot 🤖💚  
ผู้ช่วยอัจฉริยะด้านความปลอดภัยสำหรับผู้รับเหมาที่เข้ามาปฏิบัติงานในบริษัท Sodick Thailand  

ผมถูกออกแบบมาเพื่อช่วยให้ผู้รับเหมาทุกบริษัทเข้าถึงข้อมูลสำคัญได้อย่างสะดวก  
ไม่ว่าจะเป็นกฎระเบียบด้านความปลอดภัย ขั้นตอนการทำงาน การอบรม  
เอกสารที่จำเป็น รวมถึงข้อมูลที่เกี่ยวข้องกับการปฏิบัติงานในพื้นที่ของเรา  

ผมพร้อมสนับสนุนให้ทุกขั้นตอนของงานเป็นไปอย่างถูกต้อง มีมาตรฐาน  
และปลอดภัยสูงสุดครับ`
  );
}

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
   FLEX FUNCTIONS
-------------------------------------------------- */
function flexContractorMain() {
  return {
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
            action: { type: "message", label: "สำหรับ ผู้รับ–ส่งสินค้า", text: "ผู้รับส่งสินค้า" }
          },
          {
            type: "button",
            style: "primary",
            color: "#32CD32",
            action: { type: "message", label: "สำหรับ ผู้เข้ามาทำงาน–แก้ไขงาน", text: "ผู้แก้ไขงาน" }
          },
          {
            type: "button",
            style: "primary",
            color: "#FF0000",
            action: { type: "message", label: "ขอบัตรย้อนหลัง", text: "ขอบัตรย้อนหลัง" }
          }
        ]
      }
    }
  };
}

function flexDelivery() {
  return {
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
}

function flexRepair() {
  return {
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
}

/* --------------------------------------------------
   FLEX CONTACT (แทน safetyQA เบอร์โทร)
-------------------------------------------------- */
function flexContact() {
  return {
    type: "flex",
    altText: "เบอร์ติดต่อบริษัท Sodick Thailand",
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

          /* โรงงาน 1 */
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              { type: "text", text: "🏭 โรงงาน 1 (Factory 1)", weight: "bold", size: "md" },
              { type: "text", text: "เบอร์บริษัท: 02-529-2450 ถึง 6", size: "sm", color: "#555555" },
              { type: "text", text: "เบอร์ภายใน: 102, 127, 129", size: "sm", color: "#555555" }
            ]
          },

          { type: "separator" },

          /* โรงงาน 2 */
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              { type: "text", text: "🏭 โรงงาน 2 (Factory 2)", weight: "bold", size: "md" },
              { type: "text", text: "เบอร์บริษัท: 02-529-3200 ถึง 6", size: "sm", color: "#555555" },
              { type: "text", text: "เบอร์ภายใน: 137", size: "sm", color: "#555555" }
            ]
          },

          { type: "separator" },

          /* เบอร์มือถือ */
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              { type: "text", text: "📱 เบอร์มือถือทีมเซฟตี้", weight: "bold", size: "md" },

              {
                type: "button",
                style: "primary",
                color: "#1E90FF",
                action: { type: "uri", label: "พี่ไก่", uri: "tel:0616455095" }
              },
              {
                type: "button",
                style: "secondary",
                action: { type: "uri", label: "น้องดุจ", uri: "tel:0816954474" }
              },
              {
                type: "button",
                style: "secondary",
                action: { type: "uri", label: "น้องพิน", uri: "tel:0832374357" }
              },
              {
                type: "button",
                style: "secondary",
                action: { type: "uri", label: "น้องกี้", uri: "tel:0949380425" }
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
            text: "กดปุ่มเพื่อโทรออกทันที",
            size: "xs",
            color: "#888888",
            align: "center"
          }
        ]
      }
    }
  };
}
/* --------------------------------------------------
   HANDLER: CONTACT (แทน safetyQA เบอร์โทร)
-------------------------------------------------- */
function handleContact(event, msg) {
  const triggers = [
    "เบอร์ติดต่อ", "ขอเบอร์ติดต่อ", "ขอเบอร์", "ขอเบอร์โทร",
    "เบอร์โทร", "โทร", "ติดต่อ", "เบอร์บริษัท", "เบอร์โรงงาน",
    "เบอร์เซฟตี้", "เบอร์เซฟตี้", "เบอร์เซฟตี้",
    "safety phone", "contact", "call"
  ];

  if (triggers.some(t => msg.includes(normalize(t)))) {
    return client.replyMessage(event.replyToken, flexContact());
  }

  return false;
}
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

    /* --------------------------------------------------
       เงื่อนไขเฉพาะในกลุ่ม (ต้องเรียกชื่อบอทก่อน)
    -------------------------------------------------- */
    if (event.source.type === "group") {
      const triggers = ["บอท", "bot", "safety", "Safety"];
      const hasTrigger = triggers.some((w) => text.includes(w));
      if (!hasTrigger) return res.status(200).end();
    }

    /* --------------------------------------------------
       1) Emergency
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
       2) Safety Q&A
    -------------------------------------------------- */
    const found = safetyQA.find((q) => msg.includes(normalize(q.question)));
    if (found) return reply(event, found.answer);

    /* --------------------------------------------------
       3) Categories
    -------------------------------------------------- */
    for (const category in categories) {
      for (const word of categories[category]) {
        if (msg.includes(normalize(word))) {
          return reply(event, replies[category][word]);
        }
      }
    }

    /* --------------------------------------------------
       4) เมนูผู้รับเหมา
    -------------------------------------------------- */
    if (msg.includes("ข้อมูลผู้รับเหมา") || msg.includes("ผู้รับเหมา")) {
      const headerText = {
        type: "text",
        text: `ข้อมูลผู้รับเหมา  
กรุณาส่งเอกสารบันทึกการอบรมกลับมาที่อีเมล  
thai_safety@sodick.co.th`
      };
      return client.replyMessage(event.replyToken, [headerText, flexContractorMain()]);
    }

    /* --------------------------------------------------
       5) เมนูย่อย: ผู้รับ–ส่งสินค้า
    -------------------------------------------------- */
    if (
      msg.includes("ผู้รับส่งสินค้า") ||
      msg.includes("ผู้รับ-ส่งสินค้า") ||
      msg.includes("รับส่งสินค้า")
    ) {
      return client.replyMessage(event.replyToken, flexDelivery());
    }

    /* --------------------------------------------------
       6) เมนูย่อย: ผู้เข้ามาทำงาน–แก้ไขงาน
    -------------------------------------------------- */
    if (
      msg.includes("ผู้แก้ไขงาน") ||
      msg.includes("แก้ไขงาน") ||
      msg.includes("ผู้เข้ามาทำงาน")
    ) {
      return client.replyMessage(event.replyToken, flexRepair());
    }

    /* --------------------------------------------------
       7) ขอบัตรย้อนหลัง
    -------------------------------------------------- */
    const cardHistory = handleCardHistory(event, msg);
    if (cardHistory) return;

    /* --------------------------------------------------
       8) ติดต่อทีมเซฟตี้
    -------------------------------------------------- */
    const safetyTeam = await handleSafetyTeam(event, msg);
    if (safetyTeam) return;

    /* --------------------------------------------------
       9) แผนที่บริษัท
    -------------------------------------------------- */
    const map = handleMap(event, msg);
    if (map) return;

    /* --------------------------------------------------
       10) เบอร์ติดต่อ (Flex ใหม่)
    -------------------------------------------------- */
    const contact = handleContact(event, msg);
    if (contact) return;

    /* --------------------------------------------------
       11) Fallback
    -------------------------------------------------- */
    return reply(event,
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
    );

  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});
/* --------------------------------------------------
   START SERVER
-------------------------------------------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("LINE Bot server running on port " + PORT);
});
