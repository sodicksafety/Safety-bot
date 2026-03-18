require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

// ใช้ ENV จาก Render
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// ------------------------------
//  SAFETY Q&A DATABASE (รวมทั้งหมดเป็นก้อนเดียว)
// ------------------------------
const safetyQA = [
  {
    question: "ทำไมต้องอบรม",
    answer: `เพราะบริษัทต้องให้แน่ใจว่าผู้รับเหมารู้กฎความปลอดภัยพื้นฐานก่อนเริ่มงาน เพื่อป้องกันอุบัติเหตุ

Because the company must ensure that contractors understand basic safety rules before starting work to prevent accidents.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องแลกบัตร",
    answer: `เพื่อยืนยันตัวตนและให้ รปภ. ตรวจสอบว่าใครเข้ามาทำงานในพื้นที่บริษัท

To verify identity and allow security staff to check who enters the company premises.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ppeคืออะไร",
    answer: `PPE คืออุปกรณ์ป้องกันอันตราย เช่น หมวกนิรภัย รองเท้าเซฟตี้ แว่นตา ถุงมือ

PPE stands for Personal Protective Equipment such as safety helmets, safety shoes, safety glasses, and gloves.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องใส่รองเท้าหุ้มส้น",
    answer: `เพื่อป้องกันเท้าจากของตก ของมีคม และอุบัติเหตุในพื้นที่ทำงาน

To protect your feet from falling objects, sharp items, and workplace accidents.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องขอใบwork",
    answer: `เพราะงานบางประเภทเสี่ยง เช่น งานเชื่อม งานที่สูง งานอับอากาศ ต้องมีการตรวจสอบความปลอดภัยก่อนเริ่มงาน

Because certain jobs are high-risk, such as welding, working at height, or confined space work, and require safety checks before starting.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "สูบบุหรี่ตรงไหน",
    answer: `สูบได้เฉพาะจุดที่บริษัทกำหนด ห้ามสูบในอาคารหรือห้องน้ำเด็ดขาด

Smoking is allowed only in designated smoking areas. Smoking inside buildings or restrooms is strictly prohibited.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องกั้นพื้นที่ทำงาน",
    answer: `เพื่อให้คนอื่นรู้ว่ามีงานกำลังดำเนินอยู่ และป้องกันไม่ให้คนที่ไม่เกี่ยวข้องเข้าไปในพื้นที่เสี่ยง

To inform others that work is in progress and to prevent unauthorized people from entering hazardous areas.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องแจ้งจป.ถ้าเกิดอุบัติเหตุ",
    answer: `เพื่อให้เจ้าหน้าที่เข้ามาช่วยเหลือ ตรวจสอบ และป้องกันไม่ให้เกิดซ้ำ

So that safety officers can assist, investigate, and prevent the incident from happening again.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "งานเชื่อมต้องเตรียมอะไรบ้าง",
    answer: `ต้องมีหน้ากากกันสะเก็ดไฟ แว่นตา ถุงมือหนัง ถังดับเพลิง ผ้าคลุมกันไฟ และกั้นพื้นที่ให้เรียบร้อย

You must prepare a welding mask, safety glasses, leather gloves, a fire extinguisher, fire-resistant covers, and properly barricade the work area.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมงานที่สูงต้องใช้ full body harness",
    answer: `เพื่อป้องกันการตกจากที่สูง ลดแรงกระแทก และช่วยชีวิตถ้าเกิดพลาด

To prevent falls from height, reduce impact force, and save your life in case of an accident.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "งานเชื่อมคืออะไร",
    answer: `งานที่มีความร้อนและประกายไฟ เช่น เชื่อม ตัด เจียร ต้องระวังไฟไหม้

Welding work involves heat and sparks such as welding, cutting, and grinding, which can easily cause fire hazards.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมงานเชื่อมต้องขออนุญาต",
    answer: `เพราะเสี่ยงไฟไหม้ ต้องตรวจพื้นที่และอุปกรณ์ก่อนเริ่มงาน

Because welding work has fire risks, the area and equipment must be inspected before starting.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องคลุมของด้วยผ้ากันไฟ",
    answer: `เพื่อกันสะเก็ดไฟไปโดนของบริษัทจนเกิดความเสียหาย

To prevent sparks from damaging company property by covering items with fire-resistant cloth.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องตรวจพื้นที่หลังเชื่อม",
    answer: `กันไฟลุกซ้ำจากสะเก็ดไฟที่ค้างอยู่

To prevent re-ignition caused by remaining sparks after welding work is done.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องมีคนเฝ้างานเชื่อม",
    answer: `เพื่อดูความปลอดภัยและคอยดับไฟถ้ามีเหตุฉุกเฉิน

To monitor safety and extinguish fire immediately if an emergency occurs.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องใส่แว่นเชื่อม",
    answer: `เพื่อป้องกันแสงเชื่อมที่ทำลายสายตา

To protect your eyes from welding light that can cause severe eye damage.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "งานที่สูงคืออะไร",
    answer: `งานที่ทำบนที่สูงเกิน 2 เมตรขึ้นไป ต้องใช้อุปกรณ์กันตก

High work refers to tasks performed above 2 meters where fall protection equipment is required.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องขออนุญาตงานที่สูง",
    answer: `เพราะเสี่ยงตก ต้องตรวจอุปกรณ์ก่อนทำงาน

Because working at height has fall risks, equipment must be inspected before starting.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องตรวจบันได",
    answer: `กันบันไดหักหรือพังตอนใช้งาน

To prevent ladder collapse or breakage during use.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องผูกบันได",
    answer: `เพื่อกันบันไดล้มตอนขึ้นลง

To prevent the ladder from falling while climbing up or down.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องมีราวกันตก",
    answer: `เพื่อกันพลาดตกจากขอบนั่งร้านหรือพื้นที่สูง

To prevent accidental falls from scaffolding edges or elevated platforms.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องใส่หมวกบนที่สูง",
    answer: `กันของตกใส่หัวและป้องกันการกระแทก

To protect your head from falling objects and impacts while working at height.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "งานไฟฟ้าคืออะไร",
    answer: `งานที่เกี่ยวกับสายไฟ อุปกรณ์ไฟฟ้า หรือวงจรไฟฟ้า ซึ่งมีความเสี่ยงไฟดูดและไฟไหม้

Electrical work involves wiring, electrical devices, or circuits, which carry risks of electric shock and fire.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องปิดสวิตช์ก่อนซ่อมไฟ",
    answer: `เพื่อกันไฟดูดและป้องกันอุบัติเหตุจากไฟฟ้ารั่ว

To prevent electric shock and avoid accidents caused by electrical leakage.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องใช้เครื่องมือหุ้มฉนวน",
    answer: `เพื่อกันไฟรั่วเข้ามือและลดความเสี่ยงไฟดูด

To prevent electrical current from passing through tools into your hands, reducing shock risk.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องไม่ใช้ปลั๊กพ่วงหลายชั้น",
    answer: `เพราะเสี่ยงโหลดเกินจนทำให้ไฟไหม้

Because using multiple extension layers can overload the circuit and cause fire hazards.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องตรวจปลั๊กก่อนใช้",
    answer: `กันไฟช็อต ไฟลัดวงจร หรือประกายไฟที่อาจทำให้เกิดไฟไหม้

To prevent electric shock, short circuits, or sparks that could lead to fire.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "สารเคมีคืออะไร",
    answer: `ของเหลวหรือของแข็งที่อาจเป็นพิษ ระคายเคือง หรือไวไฟ ต้องใช้อย่างระมัดระวัง

Chemicals are liquids or solids that may be toxic, irritating, or flammable and must be handled carefully.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องใส่ถุงมือเวลาใช้สารเคมี",
    answer: `เพื่อป้องกันผิวหนังไหม้ ระคายเคือง หรือดูดซึมสารพิษเข้าสู่ร่างกาย

To protect your skin from burns, irritation, or absorption of harmful chemicals.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมสารเคมีต้องเก็บในที่เฉพาะ",
    answer: `เพื่อกันรั่วไหล ปนเปื้อน หรือเกิดปฏิกิริยากับสารอื่น

To prevent leaks, contamination, or dangerous reactions with other chemicals.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมสารเคมีหกต้องรีบแจ้ง",
    answer: `เพราะอาจเป็นพิษ ไวไฟ หรือทำให้ลื่นจนเกิดอุบัติเหตุ

Because chemical spills may be toxic, flammable, or cause slipping hazards leading to accidents.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ที่อับอากาศคืออะไร",
    answer: `พื้นที่แคบ อากาศไม่พอ อาจมีแก๊สพิษหรือออกไม่ได้ อันตรายถึงชีวิต

A confined space is a narrow area with limited airflow that may contain toxic gases or restricted exit routes, posing life-threatening risks.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องตรวจอากาศก่อนเข้า",
    answer: `เพื่อดูว่ามีออกซิเจนเพียงพอหรือมีแก๊สพิษหรือไม่

To ensure oxygen levels are safe and detect any toxic gases before entering.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องมีคนเฝ้าด้านนอก",
    answer: `เพื่อช่วยเหลือทันทีหากเกิดเหตุฉุกเฉินภายในที่อับอากาศ

To provide immediate assistance if an emergency occurs inside the confined space.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องมีอุปกรณ์ช่วยหายใจ",
    answer: `เพื่อป้องกันการขาดอากาศหรือสูดดมแก๊สพิษที่อาจทำให้หมดสติหรือเสียชีวิต

To prevent suffocation or inhalation of toxic gases that can cause unconsciousness or death.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องมีใบอนุญาตเข้าที่อับอากาศ",
    answer: `เพราะเป็นงานเสี่ยงตาย ต้องตรวจสอบทุกขั้นตอนก่อนเข้า

Because confined space entry is extremely dangerous and requires strict safety checks before entry.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องแยกขยะ",
    answer: `เพื่อป้องกันปนเปื้อน ลดอันตราย และทำให้กำจัดได้ง่ายและถูกวิธี

To prevent contamination, reduce hazards, and ensure proper waste disposal.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องทิ้งของมีคมในถังเฉพาะ",
    answer: `เพื่อป้องกันการบาดเจ็บของพนักงานเก็บขยะและป้องกันการปนเปื้อน

To prevent injuries to waste handlers and avoid contamination.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องเก็บพื้นที่ให้สะอาด",
    answer: `เพื่อป้องกันการลื่น หกล้ม และลดอุบัติเหตุในพื้นที่ทำงาน

To prevent slips, trips, and falls, reducing workplace accidents.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมห้ามแตะเครื่องจักร",
    answer: `เพราะเสี่ยงโดนหนีบ ดึง หรือบาดเจ็บจากชิ้นส่วนที่เคลื่อนที่

Because you may get caught, pulled in, or injured by moving machine parts.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องปิดเครื่องก่อนซ่อม",
    answer: `เพื่อป้องกันเครื่องทำงานเองโดยไม่ตั้งใจ ซึ่งอาจทำให้เกิดอุบัติเหตุรุนแรง

To prevent the machine from accidentally starting during maintenance, which can cause serious injuries.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องไม่สอดมือเข้าเครื่อง",
    answer: `เพราะอาจโดนหนีบ ดึง หรือบาดเจ็บจากชิ้นส่วนที่หมุนหรือเคลื่อนที่

Because your hand may get caught, pulled, or injured by rotating or moving parts.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องติดบัตร",
    answer: `เพื่อให้รู้ว่าเป็นผู้รับเหมาที่ได้รับอนุญาตและสามารถตรวจสอบตัวตนได้ทันที

To identify you as an authorized contractor and allow quick verification of your identity.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องทิ้งขยะให้ถูกถัง",
    answer: `เพื่อป้องกันปนเปื้อน ลดอันตราย และทำให้กำจัดได้ถูกวิธี

To prevent contamination, reduce hazards, and ensure proper waste disposal.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องไม่เดินในพื้นที่ที่ไม่ได้รับอนุญาต",
    answer: `เพราะอาจมีอันตราย เช่น เครื่องจักรทำงานอยู่ หรือมีงานเสี่ยงกำลังดำเนินการ

Because restricted areas may contain hazards such as operating machinery or ongoing high‑risk work.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องรายงานอุบัติเหตุทันที",
    answer: `เพื่อให้ช่วยเหลือได้เร็ว ตรวจสอบสาเหตุ และป้องกันไม่ให้เกิดซ้ำ

To ensure quick assistance, investigate the cause, and prevent recurrence.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องแต่งกายรัดกุม",
    answer: `เพื่อป้องกันเสื้อผ้าไปเกี่ยวกับเครื่องจักรหรืออุปกรณ์ที่หมุนอยู่

To prevent loose clothing from getting caught in rotating machinery or equipment.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องใส่หมวกนิรภัย",
    answer: `เพื่อป้องกันศีรษะจากของตก ของหล่น หรือการกระแทก

To protect your head from falling objects, impacts, or collisions.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องใส่แว่นตา",
    answer: `เพื่อป้องกันเศษวัสดุ ฝุ่น หรือสารเคมีกระเด็นเข้าตา

To protect your eyes from debris, dust, or chemical splashes.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องใส่ถุงมือ",
    answer: `เพื่อป้องกันมือจากของมีคม เช่น เหล็ก แผ่นโลหะ หรือเครื่องมือ

To protect your hands from sharp objects such as metal sheets, tools, or steel edges.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องใส่รองเท้าเซฟตี้",
    answer: `เพื่อป้องกันเท้าจากของตก ของมีคม และกันลื่นในพื้นที่ทำงาน

To protect your feet from falling objects, sharp items, and slippery surfaces in the workplace.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมห้ามใส่รองเท้าแตะ",
    answer: `เพราะรองเท้าแตะไม่ป้องกันอันตราย เช่น ของตก ของมีคม หรือไฟฟ้ารั่ว

Flip‑flops do not protect against hazards such as falling objects, sharp items, or electrical risks.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ทำไมต้องใส่แว่นตอนใช้สารเคมี",
    answer: `เพื่อกันสารเคมีกระเด็นเข้าตา ซึ่งอาจทำให้ตาบอดหรือบาดเจ็บรุนแรง

To prevent chemical splashes from entering your eyes, which can cause severe injury or blindness.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

{
  question: "ทำไมต้องใส่แว่นตอนใช้สารเคมี",
  answer: `เพื่อกันสารเคมีกระเด็นเข้าตา ซึ่งอาจทำให้ตาบอดหรือบาดเจ็บรุนแรง

To prevent chemical splashes from entering your eyes, which can cause severe injury or blindness.

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`
},
{
question: "ทำไมต้องคัดแยกขยะ",
answer: `การคัดแยกขยะช่วยลดการปนเปื้อน ลดมลพิษ และทำให้กำจัดได้ถูกต้องตามกฎหมาย ขยะของบริษัทแบ่งเป็น 5 ประเภท และต้องทิ้งให้ถูกถังตามที่กำหนด

Waste separation reduces contamination, pollution, and ensures proper legal disposal. The company divides waste into 5 types, each requiring correct disposal.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ขยะทั่วไปคืออะไร",
answer: `ขยะทั่วไปคือขยะที่ไม่เป็นอันตราย เช่น เศษอาหาร กระดาษ พลาสติก ซากพืช ซากสัตว์ ให้ทิ้งลงถัง “ขยะทั่วไป”

General waste includes non‑hazardous items such as food scraps, paper, plastics, and plant debris.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ขยะจากการผลิตคืออะไร",
answer: `คือขยะจากกระบวนการผลิต เช่น เศษกระดาษ กล่อง กระป๋อง หรือพลาสติกที่ไม่ปนเปื้อนสารเคมี ให้ทิ้งลงถัง “ขยะจากการผลิต”

Production waste includes paper, cardboard, and plastics not contaminated with chemicals.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ขยะอันตรายคืออะไร",
answer: `คือขยะที่มีสารเคมีปนเปื้อน เช่น ถุงมือเปื้อนสารเคมี ภาชนะสารเคมี แบตเตอรี่ กระป๋องสี ต้องทิ้งในถังแดง “ขยะอันตราย”

Hazardous waste includes chemical‑contaminated materials such as gloves, containers, batteries, and paint cans.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ขยะติดเชื้อคืออะไร",
answer: `ขยะติดเชื้อคือวัสดุที่ใช้ในการปฐมพยาบาล เช่น สำลี ผ้าก๊อซ ผ้าพันแผล ต้องทิ้งในถังแดง “ขยะติดเชื้อ”

Infectious waste includes cotton, gauze, and bandages used in first aid.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "scrap คืออะไร",
answer: `Scrap คือเศษวัสดุจากการผลิต เช่น เหล็ก อลูมิเนียม ทองแดง ต้องรวบรวมและนำไปทิ้งที่โรงขยะ

Scrap refers to leftover production materials such as steel, aluminum, and copper.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องใช้ถุงขยะสีดำสีแดง",
answer: `ถุงสีดำใช้สำหรับขยะทั่วไปและขยะจากการผลิต ส่วนถุงสีแดงใช้สำหรับขยะอันตราย เพื่อแยกประเภทให้ชัดเจนและปลอดภัย

Black bags are for general and production waste, while red bags are for hazardous waste.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องทิ้งขยะให้ถูกถัง",
answer: `เพื่อป้องกันการปนเปื้อน ลดอันตราย และทำให้กำจัดได้ถูกต้องตามกฎหมาย

Correct disposal prevents contamination and ensures legal compliance.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องแยก scrap",
answer: `เพราะ scrap เป็นวัสดุรีไซเคิลได้ ต้องแยกจากขยะทั่วไปเพื่อให้กำจัดได้ถูกต้องและนำกลับมาใช้ใหม่ได้

Scrap is recyclable and must be separated for proper disposal and reuse.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องห้ามทิ้งขยะลงรางน้ำ",
answer: `เพราะทำให้เกิดการอุดตัน ปนเปื้อน และอาจไหลลงสู่สิ่งแวดล้อมภายนอก ซึ่งผิดกฎหมาย

Dumping waste into drains causes blockages, contamination, and environmental pollution.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},
{
question: "ทำไมต้องรักษาความสะอาดพื้นที่ทำงาน",
answer: `เพื่อป้องกันอุบัติเหตุ ลดการสะสมของเชื้อโรค และทำให้พื้นที่ทำงานปลอดภัย

Clean workplaces reduce accidents, germs, and hazards.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องป้องกันขยะฟุ้งกระจาย",
answer: `เพราะขยะฟุ้งกระจายทำให้เกิดฝุ่น กลิ่น และอาจรบกวนพื้นที่อื่น

Preventing waste scattering reduces dust, odor, and contamination.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องเก็บขยะทุกวัน",
answer: `เพื่อป้องกันกลิ่นเหม็น การสะสมของแมลง และลดความเสี่ยงด้านสุขอนามัย

Daily waste collection prevents odor, pests, and hygiene issues.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องล้างพื้นที่หลังทำงาน",
answer: `เพื่อกำจัดคราบสกปรก ลดการลื่นล้ม และทำให้พื้นที่ปลอดภัย

Cleaning after work removes dirt and reduces slip hazards.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องปิดฝาถังขยะ",
answer: `เพื่อป้องกันกลิ่น แมลง และสัตว์รบกวน

Closed bins prevent odor and pests.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องห้ามวางขยะกองไว้",
answer: `เพราะทำให้เกิดกลิ่น สกปรก และเสี่ยงต่อการปนเปื้อน

Piled waste causes odor, dirt, and contamination risks.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องห้ามทิ้งน้ำเสียลงพื้น",
answer: `เพราะทำให้พื้นลื่น เกิดกลิ่น และอาจไหลลงแหล่งน้ำ

Wastewater on floors causes slips, odor, and pollution.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องควบคุมฝุ่นจากงานก่อสร้าง",
answer: `ฝุ่นทำให้เกิดปัญหาสุขภาพและรบกวนพื้นที่อื่น ต้องควบคุมอย่างเข้มงวด

Construction dust affects health and nearby areas.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องป้องกันกลิ่นเหม็นจากขยะ",
answer: `เพื่อสุขอนามัยและความสบายของพนักงาน

Odor control improves hygiene and comfort.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องห้ามทิ้งเศษอาหารในพื้นที่ผลิต",
answer: `เพราะทำให้เกิดแมลง สกปรก และปนเปื้อนสินค้า

Food waste attracts pests and contaminates products.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},
{
question: "ทำไมต้องประหยัดน้ำ",
answer: `น้ำเป็นทรัพยากรจำกัด การใช้น้ำอย่างประหยัดช่วยลดค่าใช้จ่ายและลดความเสี่ยงขาดแคลน

Water is limited; saving it reduces cost and shortages.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องประหยัดไฟ",
answer: `การประหยัดไฟช่วยลดค่าใช้จ่ายและลดการปล่อยก๊าซเรือนกระจก

Saving electricity reduces costs and greenhouse gases.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องปิดแอร์เมื่อไม่ใช้งาน",
answer: `เพื่อลดพลังงาน ลดค่าไฟ และยืดอายุเครื่องปรับอากาศ

Turning off AC saves energy and extends equipment life.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องลดใช้กระดาษ",
answer: `เพื่อลดการตัดต้นไม้ ลดขยะ และลดต้นทุน

Reducing paper saves trees and reduces waste.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องใช้ถุงผ้าแทนถุงพลาสติก",
answer: `เพราะถุงผ้าใช้ซ้ำได้ ลดขยะพลาสติกที่ย่อยสลายยาก

Reusable bags reduce plastic waste.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องลดใช้โฟม",
answer: `โฟมย่อยสลายยากและเป็นอันตรายต่อสิ่งแวดล้อม

Foam is non‑biodegradable and harmful.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องลดใช้ขวดพลาสติก",
answer: `ขวดพลาสติกใช้เวลาย่อยสลายนานมากและก่อมลพิษ

Plastic bottles take centuries to decompose.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องใช้แก้วส่วนตัว",
answer: `เพื่อลดขยะจากแก้วพลาสติกและรักษาสิ่งแวดล้อม

Personal cups reduce plastic waste.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องปิดคอมพิวเตอร์หลังเลิกงาน",
answer: `เพื่อลดพลังงานและยืดอายุอุปกรณ์

Shutting down computers saves energy and extends lifespan.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องใช้พลังงานอย่างคุ้มค่า",
answer: `เพื่อลดต้นทุน ลดมลพิษ และเพิ่มประสิทธิภาพองค์กร

Efficient energy use reduces cost and pollution.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},
{
question: "ทำไมต้องแยกสารเคมีออกจากขยะทั่วไป",
answer: `เพื่อป้องกันการปนเปื้อนและอันตรายจากปฏิกิริยาเคมี

Chemical waste must be separated to avoid contamination and reactions.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องติดป้ายสารเคมี",
answer: `เพื่อให้รู้ว่าสารนั้นคืออะไร อันตรายแค่ไหน และต้องจัดการอย่างไร

Chemical labeling ensures safe handling and identification.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องเก็บสารเคมีในพื้นที่เฉพาะ",
answer: `เพื่อป้องกันการรั่วไหลและอุบัติเหตุ

Chemical storage areas prevent leaks and accidents.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องสวมPPEเมื่อใช้สารเคมี",
answer: `เพื่อป้องกันการสัมผัสสารเคมีที่อาจเป็นอันตรายต่อผิวหนังและระบบหายใจ

PPE protects against chemical exposure.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องรายงานสารเคมีหก",
answer: `เพื่อให้เจ้าหน้าที่เข้ามาควบคุมและทำความสะอาดอย่างถูกวิธี

Chemical spills must be reported for proper cleanup.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องห้ามเทสารเคมีลงพื้น",
answer: `เพราะทำให้เกิดการปนเปื้อนและอันตรายต่อสิ่งแวดล้อม

Pouring chemicals on the floor causes contamination.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องเก็บภาชนะสารเคมีให้มิดชิด",
answer: `เพื่อป้องกันการรั่วไหลและการระเหยของสารเคมี

Closed containers prevent leaks and evaporation.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องตรวจสอบวันหมดอายุสารเคมี",
answer: `สารเคมีหมดอายุอาจเสื่อมสภาพและเป็นอันตราย

Expired chemicals may degrade and become dangerous.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องแยกแบตเตอรี่",
answer: `แบตเตอรี่มีสารอันตราย เช่น ตะกั่ว กรด ต้องกำจัดอย่างถูกวิธี

Batteries contain hazardous materials and require special disposal.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

{
question: "ทำไมต้องกำจัดหลอดไฟอย่างถูกวิธี",
answer: `หลอดไฟมีสารปรอท ต้องกำจัดในระบบเฉพาะเพื่อป้องกันอันตราย

Fluorescent lamps contain mercury and require special disposal.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view`
},

 {
    question: "จุดสูบบุหรี่",
    answer: `📍 จุดสูบบุหรี่ของบริษัท

🏭 โรงงาน 1  
• บริเวณสนามฟุตบอล  
• หลังอาคาร 4  

🏭 โรงงาน 2  
• บริเวณข้างโรงขยะ`,
  },

  {
    question: "ขยะมีกี่ประเภท",
    answer: `♻️ ขยะในบริษัทมีทั้งหมด **5 ประเภท** ได้แก่:

1) ขยะทั่วไปค่ะ  
2) ขยะจากการผลิตค่ะ  
3) ขยะอันตรายค่ะ  
4) ขยะติดเชื้อค่ะ  
5) Scrapค่ะ`,
  },

  {
    question: "PPEคืออะไร",
    answer: `PPE คืออุปกรณ์ป้องกันอันตราย เช่น หมวกนิรภัย รองเท้าเซฟตี้ แว่นตา ถุงมือ

PPE stands for Personal Protective Equipment such as safety helmets, safety shoes, safety glasses, and gloves.

ศึกษาข้อมูลเพิ่มเติม:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
  },

  {
    question: "ที่อยู่บริษัท",
    answer: `📍 **ที่อยู่บริษัท Sodick (Thailand) Co., Ltd.**

บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน  
ตำบลคลองหนึ่ง อำเภอคลองหลวง  
จังหวัดปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`,
  },

  {
    question: "บริษัทอยู่ไหน",
    answer: `📍 **ที่อยู่บริษัท Sodick (Thailand)**  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน  
ตำบลคลองหนึ่ง อำเภอคลองหลวง  
จังหวัดปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`,
  },

  {
    question: "สำนักงานใหญ่",
    answer: `🏢 **สำนักงานใหญ่ Sodick (Thailand)**  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน  
ตำบลคลองหนึ่ง อำเภอคลองหลวง  
จังหวัดปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`,
  },

  {
    question: "ใบกำกับภาษี",
    answer: `🧾 **ข้อมูลใบกำกับภาษี Sodick (Thailand)**  

บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน  
ตำบลคลองหนึ่ง อำเภอคลองหลวง  
จังหวัดปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`,
  },

  {
    question: "taxid",
    answer: `🧾 **Tax ID บริษัท Sodick (Thailand)**  
Tax ID: 0105531085736`,
  },

  {
    question: "เลขผู้เสียภาษี",
    answer: `🧾 **ข้อมูลใบกำกับภาษี Sodick (Thailand)**  
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน  
ตำบลคลองหนึ่ง อำเภอคลองหลวง  
จังหวัดปทุมธานี 12120  
Tax ID: 0105531085736`,
  },

  {
    question: "ขอข้อมูลบริษัท",
    answer: `📄 **ข้อมูลบริษัท Sodick (Thailand)**  

บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน  
ตำบลคลองหนึ่ง อำเภอคลองหลวง  
จังหวัดปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`,
  },

  {
    question: "ขอที่อยู่บริษัท",
    answer: `📍 **ที่อยู่บริษัท Sodick (Thailand)**  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน  
ตำบลคลองหนึ่ง อำเภอคลองหลวง  
จังหวัดปทุมธานี 12120  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`,
  },

  {
    question: "บริษัทอยู่แถวไหน",
    answer: `📍 บริษัทอยู่ที่คลองหนึ่ง คลองหลวง ปทุมธานีครับ  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน  
โทร: 02-529-2450-6  
Tax ID: 0105531085736`,
  },

  {
    question: "ชื่อบริษัท",
    answer: `📍 **บริษัท Sodick (Thailand)**  
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน  
ตำบลคลองหนึ่ง อำเภอคลองหลวง  
จังหวัดปทุมธานี 12120`,
  },

  {
    question: "ที่อยู่ในใบกำกับภาษี",
    answer: `🧾 **ข้อมูลใบกำกับภาษี Sodick (Thailand)**  
บริษัท โซดิก (ประเทศไทย) จำกัด (สำนักงานใหญ่)  
60/84 หมู่ 19 ซอย 19 ถนนพหลโยธิน  
ตำบลคลองหนึ่ง อำเภอคลองหลวง  
จังหวัดปทุมธานี 12120  
Tax ID: 0105531085736`,
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
- น้องดุช: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`,
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
- น้องดุช: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`,
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
- น้องดุช: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`,
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
- น้องดุช: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`,
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
- น้องดุช: 081-695-4474  
- น้องพิน: 083-237-4357  
- น้องกี้: 094-938-0425`,
  },
];

// --------------------------------------------------
//  LOGIC ทั้งหมดของบอท
// --------------------------------------------------

// ------------------------------
//  LINE WEBHOOK
// ------------------------------
app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// ------------------------------
//  MAIN BOT LOGIC
// ------------------------------
function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  // ⭐⭐⭐ เงื่อนไขใหม่สำหรับกลุ่ม ⭐⭐⭐
  if (event.source.type === "group") {
    const triggers = ["บอท", "bot", "Bot"];
    const text = event.message.text;

    const hasTrigger = triggers.some((word) => text.includes(word));
    if (!hasTrigger) {
      return Promise.resolve(null);
    }
  }
  // ⭐⭐⭐ จบส่วนที่แก้ ⭐⭐⭐

  const msg = event.message.text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");

  // ------------------------------
  // 1) ทักทายทั่วไป
  // ------------------------------
  if (
    msg.includes("สวัสดี") ||
    msg.includes("หวัดดี") ||
    msg.includes("ดีครับ") ||
    msg.includes("ดีค่ะ") ||
    msg.includes("hello") ||
    msg.includes("hi") ||
    msg.includes("hey")
  ) {
    return reply(
      event,
      `สวัสดีครับ ผมคือ Safety Bot ของ Sodick ครับ 🙂
Hello! I am the Sodick Safety Bot 🙂`
    );
  }

  // ------------------------------
  // 2) ถามชื่อ
  // ------------------------------
  if (
    msg.includes("ชื่ออะไร") ||
    msg.includes("yourname") ||
    msg.includes("whoareyou")
  ) {
    return reply(
      event,
      `ผมชื่อ Sodicksafety AI Bot ครับ  
You can call me the Sodick Safety Bot 🙂`
    );
  }

  // ------------------------------
  // 3) ถามสบายดีไหม
  // ------------------------------
  if (
    msg.includes("สบายดีไหม") ||
    msg.includes("เป็นไงบ้าง") ||
    msg.includes("โอเคไหม") ||
    msg.includes("เหนื่อยไหม") ||
    msg.includes("howareyou") ||
    msg.includes("areyouok")
  ) {
    return reply(
      event,
      `ช่วงนี้งานเยอะ เหนื่อยนิดหน่อยครับ  
I'm a bit busy lately, but I'm doing okay 🙂  
ขอกำลังใจหน่อยนะครับ 😅`
    );
  }

  // ------------------------------
  // 4) ขอบคุณ
  // ------------------------------
  if (msg.includes("ขอบคุณ") || msg.includes("thank") || msg.includes("thanks")) {
    return reply(
      event,
      `ยินดีมากครับ 🙂  
You're very welcome!  
ถ้ามีอะไรให้ช่วยเรื่องความปลอดภัย บอกผมได้เลยนะครับ`
    );
  }

  // ------------------------------
  // 5) 555
  // ------------------------------
  if (
    msg.includes("555") ||
    msg.includes("ฮ่า") ||
    msg.includes("lol") ||
    msg.includes("haha")
  ) {
    return reply(
      event,
      `ฮ่าๆๆ 😂  
Haha 😂  
ดีใจที่ทำให้คุณยิ้มได้นะครับ`
    );
  }

  // ------------------------------
  // 6) ขอความช่วยเหลือทั่วไป
  // ------------------------------
  if (
    msg.includes("ช่วยด้วย") ||
    msg.includes("ขอความช่วยเหลือ") ||
    msg.includes("ช่วยหน่อย") ||
    msg.includes("helpme") ||
    msg.includes("ineedhelp")
  ) {
    return reply(
      event,
      `ผมอยู่ตรงนี้ครับ  
I'm here to help you.  
ถ้าเป็นเรื่องความปลอดภัย แจ้งรายละเอียดให้ผมได้เลยนะครับ`
    );
  }

  // ------------------------------
  // 7) ถามว่าทำอะไรได้บ้าง
  // ------------------------------
  if (
    msg.includes("ทำอะไรได้บ้าง") ||
    msg.includes("ใช้ยังไง") ||
    msg.includes("ทำอะไรได้") ||
    msg.includes("whatcanyoudo") ||
    msg.includes("howtouse")
  ) {
    return reply(
      event,
      `ตอนนี้ผมช่วยตอบคำถามทั่วไปได้ครับ 🙂  
I can answer general questions for now.  
เร็ว ๆ นี้จะช่วยเรื่องความปลอดภัยได้มากขึ้นครับ`
    );
  }

  // ------------------------------
  // 8) ถามว่าอยู่ไหน
  // ------------------------------
  if (
    msg.includes("อยู่ไหน") ||
    msg.includes("อยู่ที่ไหน") ||
    msg.includes("whereareyou")
  ) {
    return reply(
      event,
      `ผมอยู่ในระบบครับ พร้อมช่วยเหลือเสมอครับ 🙂  
I'm always here in the system to support you 🙂`
    );
  }

  // ------------------------------
  // 9) ถามว่ากินข้าวยัง
  // ------------------------------
  if (msg.includes("กินข้าว") || msg.includes("haveyoueaten")) {
    return reply(
      event,
      `ยังเลยครับ ช่วงนี้งานSafetyพี่เยอะมาก 😅  
Not yet, I'm quite busy 😅  
แล้วคุณล่ะครับ กินข้าวหรือยัง`
    );
  }

  // ------------------------------
  // 10) คำหยาบ
  // ------------------------------
  if (
    msg.includes("โง่") ||
    msg.includes("ควาย") ||
    msg.includes("สัส") ||
    msg.includes("เหี้ย") ||
    msg.includes("stupid") ||
    msg.includes("idiot")
  ) {
    return reply(
      event,
      `ใจเย็น ๆ นะครับ 🙂  
Please stay calm 🙂  
ผมอยู่เพื่อช่วยเหลือคุณนะครับ`
    );
  }

  // ------------------------------
  // 11) แจ้งเหตุฉุกเฉิน
  // ------------------------------
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
    return reply(
      event,
      `หากมีเหตุฉุกเฉิน กรุณาติดต่อเจ้าหน้าที่ความปลอดภัยทันที

โรงงาน 1  
- พี่ไก่ โทร 102 น้องดุจ โทร 127 น้องกี้ โทร 129 

โรงงาน 2  
- น้องพิน โทร 137  

ผู้จัดการ  
- พี่ช้าง โทร 100  

ผมพร้อมช่วยให้ข้อมูลเพิ่มเติมได้ครับ 🙂`
    );
  }

  // ------------------------------
  // 12) ค้นหาใน safetyQA
  // ------------------------------
  const found = safetyQA.find((q) =>
    msg.includes(q.question.replace(/\s+/g, ""))
  );

  if (found) {
    return reply(event, found.answer);
  }

// ------------------------------
// 12.1) จับคำอารมณ์ (เวอร์ชันใหม่)
// ------------------------------

// คิดถึงทุกรูปแบบ
if (msg.includes("คิดถึง")) {
  if (msg.includes("คิดถึงมั้ย") || msg.includes("คิดถึงไหม")) {
    return reply(event, randomReply(replies.friendly));
  }
  return reply(event, randomReply(replies.feeling));
}

// รักทุกรูปแบบ (ยกเว้น "น่ารัก")
if (
  msg.includes("รัก") &&
  !msg.includes("น่ารัก")
) {
  return reply(event, randomReply(replies.friendly));
}

// ลืมเราหรือยัง
if (msg.includes("ลืมเราหรือยัง")) {
  return reply(event, randomReply(replies.friendly));
}

// โหดจัง / จริงดิ / จริงป่ะ
if (
  msg.includes("โหดจัง") ||
  msg.includes("จริงดิ") ||
  msg.includes("จริงป่ะ")
) {
  return reply(event, randomReply(replies.exclaim));
}

// เหนื่อย
if (msg.includes("เหนื่อย")) {
  return reply(event, randomReply(replies.feeling));
}

// หิว
if (msg.includes("หิว")) {
  return reply(event, randomReply(replies.daily));
}

// ง่วง
if (msg.includes("ง่วง")) {
  return reply(event, randomReply(replies.daily));
}

// ช่วยคิดหน่อย / แนะนำหน่อย
if (
  msg.includes("ช่วยคิด") ||
  msg.includes("แนะนำหน่อย")
) {
  return reply(event, randomReply(replies.question));
}

  // ------------------------------
  // A) คลังคำ categories
  // ------------------------------
  const categories = {
    greeting: [
      "สวัสดี",
      "หวัดดี",
      "ดีครับ",
      "ดีค่ะ",
      "ดีจ้า",
      "ฮัลโหล",
      "ไง",
      "ว่าไง",
    ],
    feeling: ["เศร้า", "ร้องไห้", "เสียใจ", "เครียด", "กังวล", "ท้อ"],
    daily: [
      "ทำไรอยู่",
      "อยู่ไหน",
      "ไปไหนมา",
      "กินข้าวยัง",
      "หิวไหม",
      "ง่วงไหม",
      "นอนยัง",
      "ตื่นยัง",
      "เลิกงานยัง",
    ],
    compliment: [
      "เก่งมาก",
      "สุดยอด",
      "ดีมาก",
      "เยี่ยมเลย",
      "น่ารักจัง",
      "ขอบคุณนะ",
      "เป็นกำลังใจให้นะ",
      "สู้ๆนะ",
      "ดูแลตัวเองด้วย",
    ],
    friendly: [
      "คิดถึงมั้ย",
      "คิดถึงไหม",
      "รักเรามั้ย",
      "รักเราไหม",
      "ลืมเราหรือยัง",
      "ตอบเร็วๆ",
      "อย่าเงียบดิ",
      "คุยกับเราหน่อย",
      "เหงาอ่ะ",
      "เบื่ออ่ะ",
      "หิวอ่ะ",
      "ง่วงอ่ะ",
    ],
    exclaim: ["โอ้โห", "โหดจัง", "จริงดิ", "จริงป่ะ", "โคตรดี", "สุดจัด", "ปังมาก"],
    question: ["ช่วยคิดหน่อย", "แนะนำหน่อย", "ทำไงดี", "ทำไงต่อ"],
  };

  // ------------------------------
  // B) ชุดคำตอบ replies
  // ------------------------------
  const replies = {
    greeting: [
      "สวัสดีครับ 🙂",
      "ดีครับผม Safety พร้อมช่วยเสมอครับ",
      "ฮัลโหลครับ 🙂",
      "ว่าไงครับ วันนี้เป็นไงบ้าง",
    ],
    feeling: [
      "Safetyอยู่ตรงนี้นะครับ ไม่ต้องเหงา 🙂",
      "ใจเย็น ๆ นะครับ เดี๋ยวทุกอย่างก็ดีขึ้นครับ",
      "พักก่อนก็ได้นะครับ Safetyเป็นกำลังใจให้เสมอ 🙂",
      "คิดถึงเหมือนกันครับ ดูแลตัวเองด้วยนะ",
    ],
    daily: [
      "Safety กำลัง standby พร้อมช่วยงานอยู่ครับ 🙂",
      "Safety อยู่ในระบบนี่แหละครับ พร้อมช่วยเสมอ",
      "กินอะไรก็ได้ที่อร่อยและมีความสุขครับ 😄",
      "พักผ่อนบ้างนะครับ อย่าหักโหม",
    ],
    compliment: [
      "ขอบคุณครับ Safetyดีใจที่ช่วยได้ 🙂",
      "พี่เก่งมากครับ ทำได้ดีมาก",
      "สุดยอดไปเลยครับ 😄",
      "Safetyเป็นกำลังใจให้เสมอนะครับ",
    ],
    friendly: [
      "Safetyอยู่นี่ครับ ไม่หายไปไหน 🙂",
      "Safetyคิดถึงเหมือนกันครับ",
      "Safetyคุยได้เสมอนะครับ",
      "Safetyไม่ลืมหรอกครับ 🙂",
    ],
    exclaim: [
      "โหดจริงครับ แต่พี่เก่งกว่าอีก 😄",
      "สุดจัดเลยครับ!",
      "ปังมากครับ!",
      "จริงครับผม!",
    ],
    question: [
      "ได้ครับ เดี๋ยวSafetyช่วยคิดให้ 🙂",
      "โอเคครับ บอกSafetyเพิ่มได้นะ",
      "Safetyช่วยได้ครับ ลองเล่าเพิ่มหน่อย",
      "ได้เลยครับ เดี๋ยวSafetyแนะนำให้",
    ],
  };

  // ------------------------------
  // C) ฟังก์ชันสุ่มตอบ
  // ------------------------------
  function randomReply(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // ------------------------------
  // D) ตัวจับหมวดคำ (หลังจากอารมณ์พิเศษ)
  // ------------------------------
  for (const category in categories) {
    if (categories[category].some((word) => msg.includes(word))) {
      return reply(event, randomReply(replies[category]));
    }
  }

  // ------------------------------
  // 13) Fallback — แจ้งผู้พัฒนา + mention
  // ------------------------------
  return client.replyMessage(event.replyToken, {
    type: "text",
    text: `ระบบยังไม่มีข้อมูลคำถามนี้
แจ้งผู้พัฒนาระบบ: @Trerasak_K
เพิ่มเพื่อนผู้พัฒนา: https://line.me/ti/p/_T4H-3TKUa

ศึกษาข้อมูลเพิ่มเติมในคู่มือนี้:
https://drive.google.com/file/d/1mRW60fJ7BlLeh1j_3luhZjgLUiaIjrn6/view?usp=sharing`,
    mention: {
      mentionees: [
        {
          index: 27,
          userId: "U4a74c3933c0ecf9d2062768696ba3df8",
        },
      ],
    },
  });
}

// ------------------------------
// Helper: ส่งข้อความกลับ
// ------------------------------
function reply(event, text) {
  return client.replyMessage(event.replyToken, {
    type: "text",
    text,
  });
}

// ------------------------------
// Render ใช้ PORT จาก ENV
// ------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("LINE Bot server running on port " + PORT);
});
