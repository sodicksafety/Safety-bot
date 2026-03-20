/* --------------------------------------------------
   IMPORTS & CONFIG
-------------------------------------------------- */
import express from "express";
import line from "@line/bot-sdk";

const app = express();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);

/* --------------------------------------------------
   UTILITIES
-------------------------------------------------- */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\u0E00-\u0E7Fa-z0-9]/gi, "");
}

function reply(event, text) {
  return client.replyMessage(event.replyToken, {
    type: "text",
    text
  });
}

/* --------------------------------------------------
   SAFETY Q&A DATABASE
-------------------------------------------------- */
const safetyQA = [
  {
    question: "ppeคืออะไร",
    answer: "PPE คืออุปกรณ์ป้องกันอันตรายส่วนบุคคล เช่น หมวกนิรภัย แว่นตา ถุงมือ รองเท้าเซฟตี้ เป็นต้น"
  },
  {
    question: "ทำไมต้องใส่หมวกนิรภัย",
    answer: "เพื่อป้องกันศีรษะจากการกระแทก วัตถุตกหล่น หรืออุบัติเหตุในพื้นที่ทำงาน"
  },
  {
    question: "เข้าเขตผลิตต้องทำอย่างไร",
    answer: "ต้องสวม PPE ให้ครบ ตรวจสอบอุปกรณ์ และปฏิบัติตามกฎความปลอดภัยของพื้นที่"
  }
  // เพิ่มคำถามอื่น ๆ ได้ตามต้องการ
];
/* --------------------------------------------------
   CATEGORIES (หมวดหมู่คำถาม)
-------------------------------------------------- */
const categories = {
  ppe: ["ppe", "อุปกรณ์ป้องกัน", "เซฟตี้", "หมวกนิรภัย", "รองเท้าเซฟตี้"],
  rule: ["กฎความปลอดภัย", "กฎโรงงาน", "เข้าเขตผลิต", "ข้อห้าม"],
  fire: ["ไฟไหม้", "ดับเพลิง", "ถังดับเพลิง", "fire"],
  chemical: ["สารเคมี", "msds", "เคมี", "chemical"]
};

/* --------------------------------------------------
   REPLIES (คำตอบตามหมวดหมู่)
-------------------------------------------------- */
const replies = {
  ppe: {
    ppe: "PPE คืออุปกรณ์ป้องกันอันตรายส่วนบุคคล เช่น หมวกนิรภัย แว่นตา ถุงมือ รองเท้าเซฟตี้",
    อุปกรณ์ป้องกัน: "อุปกรณ์ป้องกันมีหลายชนิด เช่น หมวกนิรภัย แว่นตา ถุงมือ หน้ากาก และรองเท้าเซฟตี้",
    เซฟตี้: "การใส่ PPE ช่วยลดความเสี่ยงจากอุบัติเหตุในพื้นที่ทำงาน",
    หมวกนิรภัย: "หมวกนิรภัยช่วยป้องกันศีรษะจากการกระแทกและวัตถุตกหล่น",
    รองเท้าเซฟตี้: "รองเท้าเซฟตี้ช่วยป้องกันเท้าจากการกระแทก การบาดเจ็บ และของมีคม"
  },

  rule: {
    กฎความปลอดภัย: "โปรดปฏิบัติตามกฎความปลอดภัยของบริษัทอย่างเคร่งครัด",
    กฎโรงงาน: "เข้าเขตผลิตต้องสวม PPE ให้ครบ ตรวจสอบอุปกรณ์ และปฏิบัติตามป้ายเตือน",
    เข้าเขตผลิต: "ต้องสวม PPE ครบ ตรวจสอบอุปกรณ์ และปฏิบัติตามกฎพื้นที่",
    ข้อห้าม: "ห้ามวิ่ง ห้ามหยอกล้อ ห้ามใช้โทรศัพท์ในพื้นที่เสี่ยง"
  },

  fire: {
    ไฟไหม้: "กรณีไฟไหม้ ให้รีบแจ้งหัวหน้างานและใช้ถังดับเพลิงประเภทที่เหมาะสม",
    ดับเพลิง: "ถังดับเพลิงมีหลายประเภท เช่น A B C โปรดเลือกใช้ให้ถูกต้อง",
    ถังดับเพลิง: "ถังดับเพลิงต้องตรวจสอบแรงดันและสภาพถังทุกเดือน",
    fire: "Fire emergency: Follow evacuation plan and notify safety team immediately"
  },

  chemical: {
    สารเคมี: "การทำงานกับสารเคมีต้องสวม PPE และอ่าน MSDS ก่อนใช้งาน",
    msds: "MSDS คือเอกสารข้อมูลความปลอดภัยของสารเคมี",
    เคมี: "สารเคมีบางชนิดอาจเป็นอันตราย ต้องปฏิบัติตามคู่มือความปลอดภัย",
    chemical: "Chemical handling requires PPE and proper ventilation"
  }
};

/* --------------------------------------------------
   BOT INTRO (ข้อความแนะนำตัวเวอร์ชันเต็ม)
-------------------------------------------------- */
const botIntro = `
สวัสดีครับ ผมชื่อ Sodick Safety AI Bot 🤖💚  
ผู้ช่วยอัจฉริยะด้านความปลอดภัยสำหรับผู้รับเหมาที่เข้ามาปฏิบัติงานในบริษัท Sodick Thailand  

ผมถูกออกแบบมาเพื่อช่วยให้ผู้รับเหมาทุกบริษัทเข้าถึงข้อมูลสำคัญได้อย่างสะดวก  
ไม่ว่าจะเป็นกฎระเบียบด้านความปลอดภัย ขั้นตอนการทำงาน การอบรม  
เอกสารที่จำเป็น รวมถึงข้อมูลที่เกี่ยวข้องกับการปฏิบัติงานในพื้นที่ของเรา  

ผมพร้อมสนับสนุนให้ทุกขั้นตอนของงานเป็นไปอย่างถูกต้อง มีมาตรฐาน  
และปลอดภัยสูงสุดครับ

----------------------------------------------

Hello, my name is Sodick Safety AI Bot 🤖💚  
An intelligent safety assistant designed for contractors working within Sodick Thailand.  

My purpose is to help all vendors easily access essential information, including safety regulations,  
work procedures, required training, and important documents related to on-site operations.  

I am here to support you in ensuring that every step of your work is compliant, efficient,  
and carried out with the highest level of safety.
`;

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
   ปุ่มที่ 3 : ขอบัตรย้อนหลัง
-------------------------------------------------- */
function handleCardHistory(event, msg) {
  if (
    msg.includes("ขอบัตรย้อนหลัง") ||
    msg.includes("ขอ้บัตรย้อนหลัง") ||
    msg.includes("บัตรย้อนหลัง")
  ) {
    return reply(
      event,
      "ระบบกำลังตรวจสอบข้อมูลของคุณ...\nขณะนี้ยังไม่พบข้อมูลใบเซอร์ย้อนหลังของคุณในระบบ"
    );
  }
  return false;
}
/* --------------------------------------------------
   ปุ่มที่ 6 — ส่งรูป + ปุ่มโทร
-------------------------------------------------- */
async function handleSafetyTeam(event, msg) {
  if (!msg.includes("ติดต่อทีมเซฟตี้")) return false;

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

  return true;
}
/* --------------------------------------------------
   FLEX: CONTACT (เบอร์ 02 + เบอร์ภายใน)
-------------------------------------------------- */
const flexContact = {
  type: "flex",
  altText: "เบอร์ติดต่อบริษัท",
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
          text: "เบอร์ติดต่อบริษัท",
          weight: "bold",
          size: "lg",
          color: "#0A4D0A"
        },
        {
          type: "separator",
          margin: "md"
        },

        /* -------------------------
           โรงงาน 1
        ------------------------- */
        {
          type: "text",
          text: "🏭 โรงงาน 1",
          weight: "bold",
          size: "md",
          margin: "md"
        },
        {
          type: "text",
          text: "โทร: 02-529-2450 ถึง 6",
          wrap: true
        },
        {
          type: "text",
          text: "ภายใน: 102 / 127 / 129",
          wrap: true,
          margin: "sm"
        },

        {
          type: "separator",
          margin: "md"
        },

        /* -------------------------
           โรงงาน 2
        ------------------------- */
        {
          type: "text",
          text: "🏭 โรงงาน 2",
          weight: "bold",
          size: "md",
          margin: "md"
        },
        {
          type: "text",
          text: "โทร: 02-529-3200 ถึง 6",
          wrap: true
        },
        {
          type: "text",
          text: "ภายใน: 137",
          wrap: true,
          margin: "sm"
        }
      ]
    }
  }
};
/* --------------------------------------------------
   ปุ่มที่ 7 : แผนที่โรงงาน
-------------------------------------------------- */
function handleMap(event, msg) {
  if (
    msg.includes("แผนที่") ||
    msg.includes("map") ||
    msg.includes("โรงงานอยู่ไหน") ||
    msg.includes("ไปยังโรงงาน")
  ) {
    return reply(event, {
      type: "flex",
      altText: "แผนที่โรงงาน Sodick Thailand",
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
              text: "แผนที่โรงงาน Sodick Thailand",
              weight: "bold",
              size: "lg",
              color: "#0A4D0A"
            },
            {
              type: "separator",
              margin: "md"
            },
            {
              type: "button",
              style: "primary",
              color: "#1E90FF",
              action: {
                type: "uri",
                label: "เปิดแผนที่ (Google Maps)",
                uri: "https://maps.app.goo.gl/7x1q8y8q8x1q8y8q8"
              }
            }
          ]
        }
      }
    });
  }
  return false;
}
/* --------------------------------------------------
   WEBHOOK — จุดรับข้อความจาก LINE
-------------------------------------------------- */
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events;

    for (const event of events) {
      if (event.type !== "message" || !event.message.text) continue;

      const msg = event.message.text;

      // -------------------------------
// ลำดับการตรวจปุ่มต่าง ๆ
// -------------------------------
if (handleCardHistory(event, msg)) continue;
if (await handleSafetyTeam(event, msg)) continue;
if (handleMap(event, msg)) continue;

// FLEX ผู้รับเหมา
if (msg.includes("ข้อมูลผู้รับเหมา")) {
  return reply(event, flexContractorMain());
}

// FLEX ผู้รับ–ส่งสินค้า
if (msg.includes("ผู้รับส่งสินค้า") || msg.includes("ผู้รับ-ส่งสินค้า")) {
  return reply(event, flexDelivery());
}

// FLEX ผู้เข้ามาทำงาน–แก้ไขงาน
if (msg.includes("ผู้แก้ไขงาน") || msg.includes("ผู้เข้ามาทำงาน")) {
  return reply(event, flexRepair());
}

// FLEX เบอร์ 02 (เมนูติดต่อบริษัท)
if (msg.includes("ติดต่อบริษัท") || msg.includes("เบอร์บริษัท")) {
  return reply(event, flexContact);
}

/* --------------------------------------------------
   10) Fallback — ตอบเมื่อไม่พบคำสั่ง
-------------------------------------------------- */
return reply(
  event,
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

res.status(200).send("OK");
} catch (err) {
  console.error("Webhook Error:", err);
  res.status(500).send("Error");
}
});

/* --------------------------------------------------
   START SERVER
-------------------------------------------------- */
app.listen(process.env.PORT || 3000, () => {
  console.log("BOT SERVER RUNNING...");
});
