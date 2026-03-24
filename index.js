require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");
const axios = require("axios");

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
   STATE MANAGEMENT
-------------------------------------------------- */
let userState = {};
// userState[userId] = {
//   mode: "pdpa" | "form" | "exam" | "waiting_certificate",
//   contractorType: "delivery" | "vendor",
//   step: 0,
//   formData: {},
//   currentQuestion: 1,
//   score: 0
// };

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
   WARM-UP PING (สำหรับ UptimeRobot)
-------------------------------------------------- */
app.get("/webhook", (req, res) => {
  res.status(200).send("OK");
});
/* --------------------------------------------------
   SAFETY Q&A
-------------------------------------------------- */
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
    question: "เบอร์ติดต่อ",
    answer: `📞 **เบอร์ติดต่อบริษัท Sodick (Thailand)**

🏭 **โรงงาน 1**  
เบอร์ติดต่อบริษัท: 02-529-2450 ถึง 6  
เบอร์ภายใน: 102, 127, 129  

🏭 **โรงงาน 2**  
เบอร์ติดต่อบริษัท: 02-529-3200 ถึง 6  
เบอร์ภายใน: 137  

📱 **เบอร์มือถือทีม Safety**  
- พี่ไก่: 061-645-5095  
- น้องดุจ: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`
  }
];
/* --------------------------------------------------
   CATEGORIES
-------------------------------------------------- */
const categories = {
  greeting: [
    "สวัสดี","หวัดดี","ดีครับ","ดีค่ะ","ดีจ้า","ฮัลโหล",
    "สวัสดีตอนเช้า","สวัสดีตอนบ่าย","สวัสดีตอนเย็น",
    "ทักครับ","ทักค่า","ทักทายครับ","ทักทายค่า",
    "อยู่ป่าว","ว่างไหม","มีใครอยู่ไหม"
  ],

  feeling: [
    "เศร้า","ร้องไห้","เสียใจ","เครียด","กังวล","ท้อ","ผิดหวัง",
    "เหนื่อย","เหนื่อยไหม","กำลังใจ","หมดแรง","ใจหาย","ไม่โอเค",
    "เหนื่อยมากเลยวันนี้","เหนื่อยใจจัง","ท้อแท้มาก","ไม่ไหวแล้ว",
    "หงุดหงิด","เบื่อโลก","เบื่อคน","เบื่อทุกอย่าง","อยากพักยาวๆ",
    "รู้สึกแย่","วันนี้ไม่ค่อยโอเค","วันนี้ใจฟู","วันนี้ใจเหี่ยว"
  ],

  daily: [
    "ทำไรอยู่","ทำอะไรอยู่","อยู่ไหน","ไปไหนมา","กินข้าวยัง",
    "กินข้าวหรือยัง","ง่วงไหม","นอนยัง","หิว","วันนี้อากาศเป็นไง",
    "วันนี้งานเยอะไหม","วันนี้ยุ่งไหม","วันนี้กินอะไรดี",
    "วันนี้ออกไปไหนไหม","วันนี้รถติดไหม","วันนี้มีประชุมไหม",
    "วันนี้อยากนอนทั้งวัน","วันนี้อยากเที่ยว","วันนี้อยากพัก",
    "วันนี้อยากกินของหวาน","วันนี้อยากกินชานม","วันนี้อยากกินหมูกระทะ",
    "วันนี้อยากดูหนัง","วันนี้อยากฟังเพลง","ทำงานอยู่ไหม",
    "พักหรือยัง","เลิกงานยัง"
  ],

  compliment: [
    "สุดปัง","โคตรเก่ง","วันนี้ฉันเก่งไหม","วันนี้ฉันทำดีไหม",
    "ฉันทำดีที่สุดแล้ว","ฉันพยายามมากเลย","อยากให้ชมหน่อย",
    "อยากได้พลังบวก","อยากได้แรงใจ"
  ],

  friendly: [
    "คิดถึง","คิดถึงมาก","คิดถึงที่สุด","รัก","รักนะ","รักมาก",
    "เหงา","เบื่อ","เศร้า","หิว","หิวมาก","หิวไหม","ง่วง","ง่วงมาก",
    "อยู่ไหน","ทำอะไรอยู่","คิดถึงไหม","คิดถึงปะ","คุยด้วยหน่อย",
    "อยากคุย","อยากคุยด้วย","อยากคุยยาวๆ","อยู่เป็นเพื่อนหน่อย",
    "ไม่มีใครคุยด้วยเลย","อยากให้ปลอบหน่อย","อยากให้กำลังใจหน่อย",
    "เครียด","ท้อ","เหนื่อย","หมดแรง","ดีใจ","ตื่นเต้น"
  ],

  exclaim: [
    "โอ้โห","โหด","จริงดิ","สุดจัด","โหสุดยอด","โหดีมาก",
    "จริงเหรอ","เอาจริงดิ","โคตรดีเลย","โคตรเจ๋ง","สุดยอดมาก",
    "โอ้ยขำ","ฮามาก"
  ],

  botinfo: ["ชื่ออะไร","ชื่อบอท","คุณคือใคร","เป็นใคร","แนะนำตัว","ทำอะไรได้บ้าง"]
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
และปลอดภัยสูงสุดครับ`
  );
}

/* --------------------------------------------------
   REPLIES
-------------------------------------------------- */
const replies = {
  greeting: { /* …ทั้งหมดตามที่ไก่ส่ง… */ },
  feeling: { /* … */ },
  daily: { /* … */ },
  compliment: { /* … */ },
  friendly: { /* … */ },
  exclaim: { /* … */ },
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
   REPLY FUNCTION
-------------------------------------------------- */
function reply(event, text) {
  return client.replyMessage(event.replyToken, {
    type: "text",
    text,
  });
}
/* --------------------------------------------------
   EXAM QUESTIONS (30 ข้อ)
-------------------------------------------------- */
const examQuestions = [
  {
    q: "1) PPE คืออะไร?",
    choices: ["อุปกรณ์ป้องกันอันตรายส่วนบุคคล", "รองเท้าธรรมดา", "เสื้อผ้าทั่วไป"],
    answer: 0
  },
  {
    q: "2) หมวกนิรภัยต้องสวมเมื่อไหร่?",
    choices: ["เมื่ออยู่ในพื้นที่ทำงาน", "เฉพาะตอนมีผู้จัดการมา", "ไม่จำเป็น"],
    answer: 0
  },
  {
    q: "3) งานที่สูงคือความสูงตั้งแต่กี่เมตรขึ้นไป?",
    choices: ["1 เมตร", "2 เมตร", "5 เมตร"],
    answer: 1
  },
  {
    q: "4) ถังดับเพลิงสีแดงใช้ดับอะไร?",
    choices: ["ไฟฟ้า", "เชื้อเพลิงของเหลว", "ไม้/กระดาษ"],
    answer: 2
  },
  {
    q: "5) หากพบอุบัติเหตุควรทำอย่างไร?",
    choices: ["ถ่ายรูปก่อน", "แจ้งทีม Safety ทันที", "เดินหนี"],
    answer: 1
  },
  {
    q: "6) จุดสูบบุหรี่ควรทำอย่างไร?",
    choices: ["สูบตรงไหนก็ได้", "สูบในห้องน้ำ", "สูบเฉพาะจุดที่กำหนด"],
    answer: 2
  },
  {
    q: "7) การเดินในโรงงานควรเดินตรงไหน?",
    choices: ["เดินในเลนคนเดิน", "เดินบนถนนรถยก", "เดินตรงไหนก็ได้"],
    answer: 0
  },
  {
    q: "8) ถ้าพบสารเคมีหกควรทำอย่างไร?",
    choices: ["เช็ดเอง", "แจ้ง Safety", "ปล่อยไว้"],
    answer: 1
  },
  {
    q: "9) การยกของหนักควรทำอย่างไร?",
    choices: ["ก้มหลังยก", "ใช้แรงเต็มที่", "ย่อตัวแล้วยก"],
    answer: 2
  },
  {
    q: "10) ป้ายเตือนสีเหลืองหมายถึงอะไร?",
    choices: ["ข้อบังคับ", "คำเตือน", "ห้ามทำ"],
    answer: 1
  },
  {
    q: "11) ป้ายวงกลมสีแดงมีเส้นทับหมายถึง?",
    choices: ["ควรทำ", "ห้ามทำ", "ไม่เกี่ยว"],
    answer: 1
  },
  {
    q: "12) ถ้าต้องใช้บันไดควรทำอย่างไร?",
    choices: ["ปีนสองคน", "ตรวจสภาพก่อนใช้", "ใช้บันไดพัง"],
    answer: 1
  },
  {
    q: "13) ถ้าต้องทำงานเชื่อมต้องมีอะไร?",
    choices: ["แว่นเชื่อม", "หมวกกันน็อค", "รองเท้าแตะ"],
    answer: 0
  },
  {
    q: "14) ถ้าต้องทำงานในที่อับอากาศต้องมี?",
    choices: ["ใบอนุญาต", "ไฟฉาย", "น้ำดื่ม"],
    answer: 0
  },
  {
    q: "15) รถยกมีสิทธิ์ในถนนโรงงานมากกว่าคนเดินหรือไม่?",
    choices: ["ใช่", "ไม่ใช่", "แล้วแต่เวลา"],
    answer: 1
  },
  {
    q: "16) ถ้าพบสายไฟชำรุดควรทำอย่างไร?",
    choices: ["จับดู", "แจ้งช่างไฟ", "ใช้ต่อ"],
    answer: 1
  },
  {
    q: "17) ถ้าต้องตัดเหล็กควรใส่อะไร?",
    choices: ["แว่นตานิรภัย", "หมวกแก๊ป", "ไม่มีอะไร"],
    answer: 0
  },
  {
    q: "18) ถังดับเพลิงต้องตรวจทุกกี่เดือน?",
    choices: ["1 เดือน", "3 เดือน", "6 เดือน"],
    answer: 2
  },
  {
    q: "19) ถ้าต้องทำงานบนที่สูงต้องใช้อะไร?",
    choices: ["รองเท้าแตะ", "เข็มขัดกันตก", "หมวกแก๊ป"],
    answer: 1
  },
  {
    q: "20) การเดินในพื้นที่ผลิตควรใส่อะไร?",
    choices: ["รองเท้าเซฟตี้", "รองเท้าแตะ", "รองเท้าผ้าใบ"],
    answer: 0
  },
  {
    q: "21) ถ้าต้องขนของหนักควรทำอย่างไร?",
    choices: ["ใช้รถเข็น", "ยกเอง", "ลากไปกับพื้น"],
    answer: 0
  },
  {
    q: "22) ถ้าพบไฟไหม้ควรทำอย่างไร?",
    choices: ["วิ่งหนี", "แจ้ง 102/127/129", "ถ่ายคลิป"],
    answer: 1
  },
  {
    q: "23) ถ้าต้องทำงานเสียงดังควรใส่อะไร?",
    choices: ["ที่อุดหู", "หมวกแก๊ป", "ไม่มีอะไร"],
    answer: 0
  },
  {
    q: "24) ถ้าต้องทำงานกับสารเคมีควรใส่อะไร?",
    choices: ["แว่น + ถุงมือ", "รองเท้าแตะ", "ไม่มีอะไร"],
    answer: 0
  },
  {
    q: "25) ถ้าพบคนหมดสติควรทำอย่างไร?",
    choices: ["เขย่าตัวแรง ๆ", "แจ้ง Safety", "ปล่อยไว้"],
    answer: 1
  },
  {
    q: "26) ถ้าต้องใช้เครื่องมือไฟฟ้าควรทำอะไร?",
    choices: ["ตรวจสายไฟก่อนใช้", "ใช้ทันที", "ใช้ตอนเปียกน้ำ"],
    answer: 0
  },
  {
    q: "27) ถ้าต้องเดินในพื้นที่มืดควรทำอย่างไร?",
    choices: ["ใช้ไฟฉาย", "เดินไปเลย", "วิ่ง"],
    answer: 0
  },
  {
    q: "28) ถ้าต้องทำงานใกล้รถยกควรทำอย่างไร?",
    choices: ["เดินตัดหน้า", "รักษาระยะห่าง", "ยืนข้างรถ"],
    answer: 1
  },
  {
    q: "29) ถ้าต้องทำงานร้อนควรทำอย่างไร?",
    choices: ["พักเป็นระยะ", "ทำต่อจนเสร็จ", "ไม่ต้องพัก"],
    answer: 0
  },
  {
    q: "30) ถ้าพบสิ่งผิดปกติควรทำอย่างไร?",
    choices: ["แจ้ง Safety", "ปล่อยไว้", "ถ่ายรูปลงโซเชียล"],
    answer: 0
  }
];
/* --------------------------------------------------
   FLEX TEMPLATE FOR EXAM
-------------------------------------------------- */
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
/* --------------------------------------------------
   PDPA FLEX
-------------------------------------------------- */
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
/* --------------------------------------------------
   FORM QUESTIONS
-------------------------------------------------- */
const formQuestions = [
  { key: "fullname", text: "กรุณาพิมพ์ชื่อ–นามสกุลของคุณ" },
  { key: "phone", text: "กรุณาพิมพ์เบอร์โทรศัพท์" },
  { key: "idcard", text: "กรุณาพิมพ์เลขบัตรประชาชน 13 หลัก" },
  { key: "company", text: "กรุณาพิมพ์ชื่อบริษัทของคุณ" }
];
/* --------------------------------------------------
   ส่งคำถามฟอร์มตามลำดับ
-------------------------------------------------- */
function askFormQuestion(userId) {
  const step = userState[userId].step;
  const q = formQuestions[step];

  return {
    type: "text",
    text: q.text
  };
}
/* --------------------------------------------------
   HANDLE FORM ANSWER
-------------------------------------------------- */
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
/* --------------------------------------------------
   HANDLE EXAM ANSWER
-------------------------------------------------- */
async function handleExamAnswer(event, userId, data) {
  const state = userState[userId];
  const qIndex = state.currentQuestion - 1;
  const question = examQuestions[qIndex];

  const selected = parseInt(data.replace("answer_", ""), 10);

  // ตรวจคำตอบ
  if (selected === question.answer) {
    state.score++;
  }

  // ไปข้อถัดไป
  state.currentQuestion++;

  // ถ้าทำครบแล้ว → สรุปผล
  if (state.currentQuestion > examQuestions.length) {
    return finishExam(event, userId);
  }

  // ส่งข้อถัดไป
  const nextQ = examQuestions[state.currentQuestion - 1];
  const flex = examFlex(nextQ, state.currentQuestion);

  return client.replyMessage(event.replyToken, flex);
}
/* --------------------------------------------------
   FINISH EXAM
-------------------------------------------------- */
async function finishExam(event, userId) {
  const state = userState[userId];
  const score = state.score;
  const total = examQuestions.length;

  const pass = score >= 24; // ผ่าน 80%

  // ส่งผลสอบ
  await client.replyMessage(event.replyToken, {
    type: "text",
    text: `สรุปผลการทำแบบทดสอบ\nคะแนนของคุณ: ${score}/${total}\nผลสอบ: ${pass ? "ผ่าน ✅" : "ไม่ผ่าน ❌"}`
  });

  // ถ้าไม่ผ่าน → จบ flow
  if (!pass) {
    delete userState[userId];
    return;
  }

  // ถ้าผ่าน → ส่งข้อมูลไป Google Sheet
  await sendToGoogleSheet(userId, "ผ่าน");

  // เปลี่ยนโหมดรอบัตร
  state.mode = "waiting_certificate";

  // แจ้งผู้ใช้
  return client.pushMessage(userId, {
    type: "text",
    text: "ระบบกำลังออกบัตรผู้รับเหมาให้คุณ\nกรุณาพิมพ์: ดาวน์โหลดบัตร"
  });
}
/* --------------------------------------------------
   SEND TO GOOGLE SHEET
-------------------------------------------------- */
async function sendToGoogleSheet(userId, passStatus) {
  const state = userState[userId];

  const payload = {
    userId,
    fullname: state.formData.fullname,
    phone: state.formData.phone,
    idcard: state.formData.idcard,
    company: state.formData.company,
    score: state.score,
    status: passStatus
  };

  try {
    await axios.post("YOUR_GOOGLE_APPS_SCRIPT_URL", payload);
  } catch (err) {
    console.error("❌ ERROR sending to Google Sheet:", err);
  }
}
/* --------------------------------------------------
   GET CERTIFICATE URL
-------------------------------------------------- */
async function getCertificateUrl(userId) {
  try {
    const res = await axios.get(`YOUR_APPS_SCRIPT_GET_URL?userId=${userId}`);
    return res.data.url;
  } catch (err) {
    console.error("❌ ERROR getCertificateUrl:", err);
    return null;
  }
}
/* --------------------------------------------------
   CERTIFICATE FLEX
-------------------------------------------------- */
function certificateFlex(url) {
  return {
    type: "flex",
    altText: "บัตรผู้รับเหมา",
    contents: {
      type: "bubble",
      hero: {
        type: "image",
        url,
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#1E90FF",
            action: {
              type: "uri",
              label: "ดาวน์โหลดบัตร",
              uri: url
            }
          }
        ]
      }
    }
  };
}
/* --------------------------------------------------
   HANDLE DOWNLOAD CERTIFICATE
-------------------------------------------------- */
async function handleDownloadCertificate(event, userId) {
  const url = await getCertificateUrl(userId);

  if (!url) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "ยังไม่พบบัตรของคุณ กรุณารอสักครู่แล้วพิมพ์: ดาวน์โหลดบัตร"
    });
  }

  return client.replyMessage(event.replyToken, certificateFlex(url));
}
/* --------------------------------------------------
   SEND DOCUMENTS BY TYPE
-------------------------------------------------- */
async function sendDocumentsByType(event, userId) {
  const type = userState[userId].contractorType;

  if (type === "delivery") {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "เอกสารสำหรับผู้รับ–ส่งสินค้า:\nhttps://drive.google.com/..."
    });
  }

  if (type === "vendor") {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "เอกสารสำหรับผู้เข้ามาทำงาน–แก้ไขงาน:\nhttps://drive.google.com/..."
    });
  }
}
/* --------------------------------------------------
   WEBHOOK
-------------------------------------------------- */
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const event = req.body.events[0];

    if (!event || event.type !== "message" && event.type !== "postback") {
      return res.status(200).end();
    }

    const userId = event.source.userId;
    const text = event.message?.text || "";
    const msg = normalize(text);
    const data = event.postback?.data || "";

    /* --------------------------------------------------
       1) เงื่อนไขเฉพาะในกลุ่ม (ต้องเรียกชื่อบอทก่อน)
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
      msg.includes("บาดเจ็บ")
    ) {
      return reply(event, `⚠️ เหตุฉุกเฉิน กรุณาติดต่อทันที  
โรงงาน 1: 102 / 127 / 129  
โรงงาน 2: 137  
ผู้จัดการ: 100`);
    }

    /* --------------------------------------------------
       3) ถ้า user อยู่ใน state → จัดการ Flow ผู้รับเหมาใหม่
    -------------------------------------------------- */
    if (userState[userId]) {
      const state = userState[userId];

      /* PDPA */
      if (state.mode === "pdpa") {
        if (data === "pdpa_accept") {
          state.mode = "form";
          state.step = 0;
          state.formData = {};
          return client.replyMessage(event.replyToken, askFormQuestion(userId));
        }
        return client.replyMessage(event.replyToken, pdpaFlex());
      }

      /* FORM */
      if (state.mode === "form") {
        return handleFormAnswer(event, userId, text);
      }

      /* EXAM */
      if (state.mode === "exam") {
        if (data.startsWith("answer_")) {
          return handleExamAnswer(event, userId, data);
        }
      }

      /* WAITING CERTIFICATE */
      if (state.mode === "waiting_certificate") {
        if (msg.includes("ดาวน์โหลดบัตร")) {
          return handleDownloadCertificate(event, userId);
        }
        return reply(event, "พิมพ์: ดาวน์โหลดบัตร เพื่อรับบัตรผู้รับเหมา");
      }
    }

    /* --------------------------------------------------
       4) เริ่ม Flow ผู้รับเหมาใหม่
    -------------------------------------------------- */
    if (msg.includes("ผู้รับเหมาใหม่") || msg.includes("ทำบัตร")) {
      userState[userId] = { mode: "pdpa" };
      return client.replyMessage(event.replyToken, pdpaFlex());
    }

    /* --------------------------------------------------
       5) Safety Q&A
    -------------------------------------------------- */
    const found = safetyQA.find((q) => msg.includes(normalize(q.question)));
    if (found) return reply(event, found.answer);

    /* --------------------------------------------------
       6) Categories (เพื่อนคุย)
    -------------------------------------------------- */
    for (const category in categories) {
      for (const word of categories[category]) {
        if (msg.includes(normalize(word))) {
          return reply(event, replies[category][word]);
        }
      }
    }

    /* --------------------------------------------------
       7) เมนูผู้รับเหมาเก่า
    -------------------------------------------------- */
    if (msg.includes("ผู้รับเหมา")) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "เมนูผู้รับเหมาเก่า\n(ไก่เก็บไว้ในโฟลเดอร์เรียบร้อยแล้ว)"
      });
    }

    /* --------------------------------------------------
       8) ติดต่อทีมเซฟตี้
    -------------------------------------------------- */
    if (msg.includes("ติดต่อทีมเซฟตี้")) {
      await client.replyMessage(event.replyToken, {
        type: "image",
        originalContentUrl: "https://drive.google.com/uc?export=view&id=18x1R8O2FLduj-lFn22lWphUxh-qsodxs",
        previewImageUrl: "https://drive.google.com/uc?export=view&id=18x1R8O2FLduj-lFn22lWphUxh-qsodxs"
      });

      return client.pushMessage(userId, {
        type: "flex",
        altText: "เบอร์ติดต่อทีมเซฟตี้",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            contents: [
              { type: "text", text: "เลือกเบอร์ที่ต้องการโทร", weight: "bold", size: "lg", align: "center" },
              { type: "button", style: "primary", color: "#1E90FF", action: { type: "uri", label: "พี่ช้าง (Mgr.)", uri: "tel:0813765583" }},
              { type: "button", style: "primary", color: "#1E90FF", action: { type: "uri", label: "พี่ไก่ (Factory1)", uri: "tel:0616455095" }},
              { type: "button", style: "secondary", action: { type: "uri", label: "น้องพิน (Factory2)", uri: "tel:0832374357" }},
              { type: "button", style: "secondary", action: { type: "uri", label: "น้องดุจ (Factory1)", uri: "tel:0816954474" }},
              { type: "button", style: "secondary", action: { type: "uri", label: "น้องกี้ (Environment)", uri: "tel:0949380425" }}
            ]
          }
        }
      });
    }

    /* --------------------------------------------------
       9) แผนที่ + เบอร์โรงงาน
    -------------------------------------------------- */
    if (
      msg.includes("แผนที่") ||
      msg.includes("map") ||
      msg.includes("location") ||
      msg.includes("โรงงานอยู่ไหน")
    ) {
      return client.replyMessage(event.replyToken, [
        mapFlex,
        phoneFlex
      ]);
    }

    /* --------------------------------------------------
       10) Fallback
    -------------------------------------------------- */
    return reply(event, `❗ ไม่พบข้อมูลคำถามนี้ในระบบ  
ขออภัยครับ 🙂  
ติดต่อผู้พัฒนา: @Trerasak_K`);

  } catch (err) {
    console.error("❌ ERROR:", err);
    return res.status(500).end();
  }
});
/* --------------------------------------------------
   MAP FLEX (แผนที่โรงงาน 1–2)
-------------------------------------------------- */
const mapFlex = {
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

        { type: "separator" },

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
};

/* --------------------------------------------------
   PHONE FLEX (เบอร์โทรโรงงาน)
-------------------------------------------------- */
const phoneFlex = {
  type: "flex",
  altText: "เบอร์โทรโรงงาน Sodick Thailand",
  contents: {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      backgroundColor: "#32CD32",
      contents: [
        {
          type: "text",
          text: "📞 เบอร์โทรโรงงาน Sodick Thailand",
          weight: "bold",
          size: "md",
          color: "#FFFFFF"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "🏭 โรงงาน 1",
          weight: "bold",
          size: "md"
        },
        {
          type: "text",
          text: "02-529-2450-6\nต่อ:102-127-129",
          size: "sm",
          color: "#333333"
        },

        { type: "separator" },

        {
          type: "text",
          text: "🏭 โรงงาน 2",
          weight: "bold",
          size: "md"
        },
        {
          type: "text",
          text: "02-529-3200-6\nต่อ:137",
          size: "sm",
          color: "#333333"
        }
      ]
    }
  }
};
/* --------------------------------------------------
   SERVER START
-------------------------------------------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 LINE Bot server running on port " + PORT);
});

