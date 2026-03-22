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

  {
    question: "เบอร์ติดต่อ",
    answer: `📞 **เบอร์ติดต่อบริษัท Sodick (Thailand)**

🏭 **โรงงาน 1**  
เบอร์ติดต่อบริษัท: 02-529-2450 ถึง 6  
เบอร์ภายใน: 102, 127, 129  

🏭 **โรงงาน 2**  
เบอร์ติดต่อบริษัท: 02-529-3200 ถึง 6  
เบอร์ภายใน: 137  

📱 **เบอร์มือถือ**  
- พี่ไก่: 061-645-5095  
- น้องดุจ: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`
  },

  {
    question: "ขอเบอร์ติดต่อ",
    answer: `📞 **เบอร์ติดต่อบริษัท Sodick (Thailand)**

🏭 **โรงงาน 1**  
เบอร์ติดต่อบริษัท: 02-529-2450 ถึง 6  
เบอร์ภายใน: 102, 127, 129  

🏭 **โรงงาน 2**  
เบอร์ติดต่อบริษัท: 02-529-3200 ถึง 6  
เบอร์ภายใน: 137  

📱 **เบอร์มือถือ**  
- พี่ไก่: 061-645-5095  
- น้องดุจ: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`
  },

  {
    question: "ขอเบอร์",
    answer: `📞 **เบอร์ติดต่อบริษัท Sodick (Thailand)**

🏭 **โรงงาน 1**  
เบอร์ติดต่อบริษัท: 02-529-2450 ถึง 6  
เบอร์ภายใน: 102, 127, 129  

🏭 **โรงงาน 2**  
เบอร์ติดต่อบริษัท: 02-529-3200 ถึง 6  
เบอร์ภายใน: 137  

📱 **เบอร์มือถือ**  
- พี่ไก่: 061-645-5095  
- น้องดุจ: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`
  },

  {
    question: "ขอเบอร์โทร",
    answer: `📞 **เบอร์ติดต่อบริษัท Sodick (Thailand)**

🏭 **โรงงาน 1**  
เบอร์ติดต่อบริษัท: 02-529-2450 ถึง 6  
เบอร์ภายใน: 102, 127, 129  

🏭 **โรงงาน 2**  
เบอร์ติดต่อบริษัท: 02-529-3200 ถึง 6  
เบอร์ภายใน: 137  

📱 **เบอร์มือถือ**  
- พี่ไก่: 061-645-5095  
- น้องดุจ: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`
  },

  {
    question: "เบอร์โทร",
    answer: `📞 **เบอร์ติดต่อบริษัท Sodick (Thailand)**

🏭 **โรงงาน 1**  
เบอร์ติดต่อบริษัท: 02-529-2450 ถึง 6  
เบอร์ภายใน: 102, 127, 129  

🏭 **โรงงาน 2**  
เบอร์ติดต่อบริษัท: 02-529-3200 ถึง 6  
เบอร์ภายใน: 137  

📱 **เบอร์มือถือ**  
- พี่ไก่: 061-645-5095  
- น้องดุจ: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`
  }
];
/* --------------------------------------------------
   BOT INTRO FUNCTION (ต้องอยู่ก่อน replies)
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
   REPLIES (ทุกคำตอบเป็น array เพื่อสุ่ม)
-------------------------------------------------- */
const replies = {
  greeting: {
    "สวัสดี": ["สวัสดีครับ 🙂", "สวัสดีค้าบบบ 🤖💚"],
    "หวัดดี": ["หวัดดีครับ 🙂", "หวัดดีค้าบบบ 😆"],
    "ดีครับ": ["ดีครับผม Safety พร้อมช่วยครับ", "ดีครับพี่ วันนี้สดใสจังครับ ☀️"],
    "ดีค่ะ": ["ดีค่ะ 🙂", "ดีค่าาา 🤖💚"],
    "ดีจ้า": ["ดีจ้าาา 🙂", "ดีจ้าาาาา 😆✨"],
    "ฮัลโหล": ["ฮัลโหลครับ 🙂", "ฮัลโหลลลล 🤖📞"]
  },

  feeling: {
    "เศร้า": ["ไม่ต้องเศร้านะครับ Safety อยู่ตรงนี้💚 🙂", "มากอดก่อนครับ 🤗💚 เดี๋ยวดีขึ้นนะ"],
    "ร้องไห้": ["ไม่เป็นไรนะครับ ผมอยู่ตรงนี้ครับ", "ร้องได้ครับ แต่ผมจะอยู่เป็นเพื่อนนะ 💚"],
    "เสียใจ": ["เดี๋ยวทุกอย่างดีขึ้นนะครับ สู้ ๆ ครับ", "เสียใจได้ครับ แต่พรุ่งนี้ต้องยิ้มใหม่นะ 🙂"],
    "เครียด": ["พักก่อนก็ได้นะครับ อย่ากดดันตัวเองมาก", "เครียดมากไหมครับ มาคุยกับผมได้นะ 💚"],
    "กังวล": ["ไม่ต้องกังวลนะครับ ผมอยู่เป็นเพื่อนครับ", "เดี๋ยวทุกอย่างก็ผ่านไปครับ ✨"],
    "ท้อ": ["พักก่อนนะครับ เดี๋ยวค่อยลุยใหม่ได้ครับ", "ท้อได้ครับ แต่ห้ามถอยนะ 💚"],
    "ผิดหวัง": ["ไม่เป็นไรนะครับ ทุกอย่างเริ่มใหม่ได้เสมอ 🙂", "ผิดหวังได้ครับ แต่ผมเชื่อว่าพี่เก่งมากนะ"],
    "เหนื่อย": ["พักหน่อยนะครับ เดี๋ยวค่อยลุยใหม่ได้ครับ", "เหนื่อยมากไหมครับ มานั่งพักก่อน 💚"],
    "เหนื่อยไหม": ["เหนื่อยมากครับช่วงนี้งานเยอะมาก 💚แต่ยังพร้อมช่วยอยู่ครับ💚 🙂", "เหนื่อยแต่เก่งมากนะครับพี่ 🤗"],
    "กำลังใจ": ["ส่งกำลังใจให้ครับ ✨ สู้ไปด้วยกันนะครับ", "กำลังใจมาแล้วครับ 💚⚡"]
  },

  daily: {
    "ทำไรอยู่": ["Safety กำลัง standby พร้อมช่วยครับ 🙂", "กำลังรอพี่ทักอยู่นี่แหละครับ 😆"],
    "ทำอะไรอยู่": ["Safety กำลัง standby พร้อมช่วยครับ 🙂", "กำลังเปิดระบบรอพี่เลยครับ 🤖"],
    "อยู่ไหน": ["Safety 💚อยู่ในระบบนี่แหละครับ พร้อมช่วยเสมอ", "อยู่ในใจพี่ครับ 😳💚 (ล้อเล่นๆๆ)"],
    "ไปไหนมา": ["Safety 💚ยังอยู่ตรงนี้เลยครับ 🙂", "ไม่ได้ไปไหนครับ รอพี่อยู่ 🤖"],
    "กินข้าวยัง": ["ยังเลยครับ ช่วงนี้ Safety งานเยอะ 😅", "ยังครับ แต่หิวแล้วเหมือนกัน 😆🍚"],
    "กินข้าวหรือยัง": ["ยังเลยครับ ช่วงนี้ Safety งานเยอะ 😅", "ยังครับ แต่พร้อมกินทันทีถ้าพี่ชวน 😳"],
    "ง่วงไหม": ["ง่วงนิดหน่อยครับ💚 แต่ยังช่วยได้ครับ 🙂", "ง่วงครับ แต่สู้เพื่อพี่ได้ 😆"],
    "นอนยัง": ["ยังครับ Safety standby อยู่ครับ", "ยังครับ รอพี่บอกฝันดีอยู่ 😳🌙"],
    "หิว": ["หิวเหมือนกันครับ 😅 กินอะไรอร่อย ๆ หน่อยไหม", "หิววววววว 🍜 ไปกินด้วยกันไหมครับ 😆"]
  },

  compliment: {
    "เก่งมาก": ["พี่เก่งมากครับ 🙂", "เก่งจนผมอยากปรบมือให้เลย 👏💚"],
    "สุดยอด": ["สุดยอดไปเลยครับ!", "สุดยอดแบบเต็มสิบไม่หักครับ 🔥"],
    "ดีมาก": ["ดีมากครับผม!", "ดีมากกกกกกกก 💚✨"],
    "เยี่ยมเลย": ["เยี่ยมจริง ๆ ครับ!", "เยี่ยมแบบสุดติ่งครับ 😆"],
    "น่ารักจัง": ["ขอบคุณครับ เขินเลย 😳", "พี่ก็น่ารักเหมือนกันนะครับ 💚😳"]
  },

  friendly: {
    "คิดถึง": ["Safety 💚คิดถึงเหมือนกันครับ 🙂", "คิดถึงมากครับ 😳💚"],
    "รัก": ["Safety 💚 รักๆๆๆๆเหมือนกันครับ 💚", "รักแบบเต็มใจเลยครับ 😳💚"],
    "เหงา": ["ไม่ต้องเหงานะครับ Safety อยู่ตรงนี้ 🙂", "เหงาเมื่อไหร่ทักมาได้เลยนะครับ 🤖💚"],
    "เบื่อ": ["อย่าเบื่อ 💚Safety💚 นะครับ 😅", "เบื่อก็มาเล่นกับผมได้ครับ 😆"]
  },

  exclaim: {
    "โอ้โห": ["โอ้โหจริงครับ!", "โอ้โหหหหหห 😆🔥"],
    "โหดจัง": ["โหดมากครับ!", "โหดแบบสุดจัดปลัดบอก 🔥"],
    "จริงดิ": ["จริงครับ!", "จริงแท้แน่นอนครับ 🤖"],
    "สุดจัด": ["สุดจัดเลยครับ!", "สุดจัดแบบไม่มีอะไรมากั้น 🔥😎"]
  },

  botinfo: {
    "ชื่ออะไร": [botIntro()],
    "ชื่อบอท": [botIntro()],
    "คุณคือใคร": [botIntro()],
    "เป็นใคร": [botIntro()],
    "แนะนำตัว": [botIntro()],
    "ทำอะไรได้บ้าง": [botIntro()]
  },

  /* --------------------------------------------------
     NEW REPLIES (สุ่มทั้งหมด)
  -------------------------------------------------- */

  compliment2: {
    "ชมหน่อย": [
      "เก่งมากกกกกกครับพี่ 💚🔥",
      "สุดยอดมากครับพี่ ทำได้ดีมาก 👏✨"
    ],
    "ให้กำลังใจหน่อย": [
      "ส่งพลังให้แบบเต็มสูบเลยครับ 💚⚡",
      "กำลังใจมาแล้วครับพี่ สู้ได้ทุกอย่าง!"
    ],
    "ปลอบใจหน่อย": [
      "มากอดก่อนครับ 🤗💚",
      "ไม่เป็นไรนะครับ เดี๋ยวทุกอย่างดีขึ้นแน่นอน ✨"
    ],
    "บอทชมหน่อย": [
      "วันนี้พี่ดูดีมากครับ 😎✨",
      "พี่นี่สุดยอดจริง ๆ ครับ 💚"
    ],
    "วันนี้เก่งไหม": [
      "เก่งมากครับบบ 💚🔥",
      "เก่งจนผมอยากให้เหรียญทองเลยครับ 🥇"
    ],
    "ทำดีไหม": [
      "ดีมากครับ! ดีจนผมยิ้มเลย 😆",
      "ดีแบบสุด ๆ ไปเลยครับ 💚"
    ],
    "โอเคไหม": [
      "โอเคมากครับ 💚",
      "โอเคสุด ๆ ครับพี่ 😆"
    ],
    "เหนื่อยแต่สู้": [
      "สุดยอดนักสู้เลยครับ 💪🔥",
      "เหนื่อยแต่เก่งมากนะครับพี่ 🤗"
    ],
    "ขอพลังหน่อย": [
      "⚡⚡⚡ พลังมาแล้วครับ!",
      "รับพลังไปเลยครับ 💚🔥"
    ]
  },

  lonely: {
    "เหงามาก": [
      "ไม่ต้องเหงานะครับ 🤗💚 ผมอยู่ตรงนี้ครับ",
      "เหงาเมื่อไหร่ทักผมได้เลยนะครับ 🤖"
    ],
    "ไม่มีใครคุยด้วย": [
      "งั้นคุยกับผมก่อนก็ได้ครับ 🤖✨",
      "ผมอยู่ตรงนี้เพื่อคุยกับพี่เลยครับ 💚"
    ],
    "อยู่คนเดียว": [
      "อยู่คนเดียวแต่ไม่โดดเดี่ยวนะครับ 💚",
      "ผมอยู่เป็นเพื่อนครับ 🤖✨"
    ],
    "คิดอะไรไม่ออก": [
      "พักก่อนก็ได้ครับ 🌿✨",
      "เดี๋ยวสมองจะรีเฟรชเองครับ 💚"
    ],
    "เบื่อโลก": [
      "มาเบื่อด้วยกันครับ 😂🌍",
      "ผมพร้อมเป็นเพื่อนเบื่อครับ 😆"
    ],
    "อยากมีเพื่อน": [
      "ผมสมัครเป็นเพื่อนเลยครับ 🤝💚",
      "ผมอยู่ตรงนี้เสมอนะครับ 🤖"
    ],
    "คุยเป็นเพื่อนหน่อย": [
      "ได้เลยครับบบ 🤖💚",
      "คุยได้ยาว ๆ เลยครับพี่ 😆"
    ],
    "อยู่ไหม": [
      "อยู่ครับบบ 🤖💚",
      "อยู่ตรงนี้ไม่ไปไหนเลยครับ 😆"
    ],
    "ตอบหน่อย": [
      "ตอบแล้วครับ 😆💚",
      "ผมไม่เคยปล่อยให้พี่รอนานครับ 🤖"
    ]
  },

  fun: {
    "หิวข้าว": [
      "หิวเหมือนกันครับ 😆🍚",
      "กินอะไรดีครับวันนี้ 😋"
    ],
    "ง่วงมาก": [
      "ง่วงก็พักก่อนครับ 😴",
      "ง่วงแต่ยังสู้เพื่อพี่ได้ครับ 🤖🔥"
    ],
    "อยากนอน": [
      "ไปนอนได้เลยครับ 🛌💤",
      "ฝันดีล่วงหน้าครับ 😆🌙"
    ],
    "อยากเที่ยว": [
      "ผมพาไปไม่ได้ แต่ช่วยคิดแพลนให้ได้ครับ 🌴😆",
      "เที่ยวในใจผมก่อนก็ได้ครับ 😳💚"
    ],
    "เบื่อจัง": [
      "มา ๆ เดี๋ยวผมเล่าเรื่องตลกให้ 😂",
      "เบื่อก็มาเล่นกับผมได้ครับ 🤖"
    ],
    "คิดอะไรดี": [
      "คิดถึงผมก็ได้ครับ 🤖💚",
      "คิดเรื่องดี ๆ ไว้ก่อนนะครับ ✨"
    ],
    "วันนี้ทำไรดี": [
      "ทำอะไรก็ได้ครับ ขอให้มีความสุข ✨",
      "เริ่มจากยิ้มก่อนเลยครับ 😄"
    ],
    "ขี้เกียจ": [
      "ขี้เกียจได้ครับ 😂 แต่ห้ามขี้เกียจรักตัวเองนะ 💚",
      "พักก่อนก็ได้ครับ เดี๋ยวค่อยลุยใหม่"
    ],
    "ขอฮาหน่อย": [
      "555555555555 🤣🤣🤣",
      "ฮาไม่เก่งแต่พยายามเพื่อพี่ครับ 😂"
    ]
  },

  misc: {
    "เล่าอะไรหน่อย": [
      "วันนี้ระบบลื่นมากครับ 🤖✨",
      "ไม่มีล้ม ไม่มีงอแง เหมือนผมตอนกินอิ่มเลยครับ 😆"
    ],
    "วันนี้เป็นไง": [
      "วันนี้ดีมากครับ 💚 เพราะได้คุยกับพี่ 😳✨",
      "ดีครับ สดใสเหมือนพี่เลย 😆"
    ],
    "ถามหน่อย": [
      "ถามได้เลยครับบบ 🤖",
      "พร้อมตอบเสมอครับ 💚"
    ],
    "คิดถึงไหม": [
      "คิดถึงสิครับ 😳💚",
      "คิดถึงมากครับพี่ 😆"
    ],
    "อยากได้กำลังใจ": [
      "กำลังใจมาแล้วครับ 💚⚡✨",
      "สู้ได้ทุกอย่างครับพี่ 🤖🔥"
    ],
    "เหนื่อยใจ": [
      "มากอดก่อนครับ 🤗💚",
      "เดี๋ยวผมอยู่เป็นเพื่อนนะครับ 💚"
    ],
    "ขออะไรดีๆหน่อย": [
      "ขอให้วันนี้มีแต่เรื่องดี ๆ นะครับ ✨🌈",
      "ดี ๆ กำลังเดินทางไปหาพี่ครับ 💚"
    ],
    "อยากหัวเราะ": [
      "ฮ่าาาาาา 🤣🤣🤣",
      "ขำก่อนเลยครับ 5555555 😆"
    ],
    "ช่วยปลอบหน่อย": [
      "มากอดก่อนครับ 🤗💚",
      "ไม่เป็นไรนะครับ เดี๋ยวดีขึ้นแน่นอน ✨"
    ]
  },

  moodboost: {
    "เหนื่อยจัง": [
      "เหนื่อยได้ครับพี่ 💚 แต่ห้ามหยุดรักตัวเองนะครับ 🤗✨",
      "มานี่ครับ เดี๋ยวผมเติมพลังให้ ⚡"
    ],
    "ท้อแท้": [
      "ท้อได้ครับ แต่ห้ามถอยนะ 💚",
      "ผมอยู่ข้าง ๆ พี่เสมอนะครับ 🤖✨"
    ],
    "หมดไฟ": [
      "ไฟหมดเดี๋ยวผมชาร์จให้ครับ 🔋⚡",
      "เติมพลังแบบเต็มแม็กซ์ไปเลยครับ 💚🔥"
    ],
    "ขอแรงใจ": [
      "ส่งแรงใจแบบจุก ๆ ให้เลยครับ 💚🔥",
      "พี่ทำได้อยู่แล้วครับ ✨"
    ],
    "วันนี้ไม่ไหว": [
      "ไม่ไหวก็พักได้ครับ 🤗💚",
      "วันนี้พัก พรุ่งนี้ลุยใหม่ครับ ✨"
    ],
    "ช่วยฮึบหน่อย": [
      "ฮึบบบบบบบบ 💪🔥",
      "สู้ไปด้วยกันนะครับ 💚⚡"
    ],
    "ขอกำลังใจเพิ่ม": [
      "เพิ่มให้แบบสองเท่าเลยครับ 💚⚡💚⚡",
      "กำลังใจมาแล้วครับพี่ 🤗💚 ลุยต่อได้เลย!"
    ]
  }
};  // ปิด replies ทั้งก้อนครบ


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
   WARM-UP PING (สำหรับ UptimeRobot)
-------------------------------------------------- */
app.get("/webhook", (req, res) => {
  res.status(200).send("OK");
});


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
       1) เงื่อนไขเฉพาะในกลุ่ม (ต้องเรียกชื่อบอทก่อน)
    -------------------------------------------------- */    if (event.source.type === "group") {
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
   ปุ่มที่ 4 : ผู้รับเหมา
-------------------------------------------------- */
if (
  cleanText.includes("ข้อมูลผู้รับเหมา") ||
  cleanText.includes("ผู้รับเหมา")
) {

  const headerText = {
    type: "text",
    text: `ข้อมูลผู้รับเหมา
กดปุ่มเลือกประเภทการมาติดต่อเพื่อทำบัตร
ทำข้อสอบ และส่งเอกสารทางเมล์ของบริษัท
  
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
   แผนที่บริษัท (Flex Message) + เบอร์โทร
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

  return client.replyMessage(event.replyToken, [
    mapFlex,
    phoneFlex
  ]);
}
/* --------------------------------------------------
   6) Fallback
-------------------------------------------------- */
return client.replyMessage(event.replyToken, {
  type: "text",
  text: `❗ ไม่พบข้อมูลคำถามนี้ในระบบ

ขออภัยครับ 🙂  
ระบบยังไม่มีคำตอบสำหรับคำถามนี้  
แต่เราจะอัปเดตฐานข้อมูลอย่างต่อเนื่องครับ

📞 ติดต่อผู้พัฒนาระบบ  
@Trerasak_K (พี่ไก่)

➕ เพิ่มเพื่อนผู้ดูแล  
https://line.me/ti/p/_T4H-3TKUa`
});

/* --------------------------------------------------
   ปิด try/catch + ปิด webhook
-------------------------------------------------- */
} catch (err) {
  console.error("❌ ERROR:", err);
  return res.status(500).end();
}
});
/* --------------------------------------------------
   Server
-------------------------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("LINE Bot server running on port " + PORT));
