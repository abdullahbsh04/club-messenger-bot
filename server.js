'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');   // ✅ استبدلنا request بـ axios
require('dotenv').config();

const app = express().use(bodyParser.json());
const PORT = process.env.PORT || 1337;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// webhook للتحقق
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// webhook لاستقبال الرسائل
app.post('/webhook', (req, res) => {
  let body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(function(entry) {
      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// استقبال أي رسالة
function handleMessage(sender_psid, received_message) {
  if (received_message.quick_reply) {
    let payload = received_message.quick_reply.payload;
    handleQuickReply(sender_psid, payload);
  } else {
    // أي رسالة يكتبها المستخدم → نعرض القائمة مباشرة
    startConversation(sender_psid);
  }
}

// بدء المحادثة (ترحيب + قائمة)
function startConversation(sender_psid) {
  sendTextMessage(sender_psid, "مرحبا بك في نادي هندسة الأتمتة الصناعية، نحن هنا لمساعدتك ✅");
  sendQuickReplies(sender_psid);
}

// التعامل مع اختيارات القائمة
function handleQuickReply(sender_psid, payload) {
  switch (payload) {
    case "ABOUT_MAJOR":
      sendTextMessage(sender_psid,
        "📘 هذا رابط منشور تعريفي عن التخصص:\nhttps://www.facebook.com/share/v/19nZQ7Etds/"
      );
      break;

    case "STUDENTS_GROUPS":
      sendTextMessage(sender_psid,
        "🌐 جروبات طلاب التخصص:\n\n" +
        "- جروب جميع الطلاب: https://m.me/j/AbYTm4WbUD1GUfkz/\n" +
        "- دفعة 2025: https://m.me/j/AbY-p17kgtwvmi8D/\n" +
        "- دفعة 2024: https://m.me/j/AbbY1wf4m4GDfpe2/\n" +
        "- دفعة 2023: https://m.me/j/Abb4PoBpSRmHnWqa/\n" +
        "- دفعة 2022: https://m.me/j/AbZs3IuWv_8G-VGE/\n" +
        "- دفعة 2021: https://m.me/j/AbaZlfepk-mtpq6d/"
      );
      break;

    case "COURSES_GROUPS":
      sendTextMessage(sender_psid,
        "📚 جروبات المواد والمختبرات:\n\n" +
        "- المنطق الرقمي والالكترونيات الرقمية (ديجيتال): https://m.me/j/AbaWDr2ogRBe7pNi/\n" +
        "- أجهزة الحماية والتحكم (بروتكشن): https://m.me/j/AbblC3cFGyEbT1p_/\n" +
        "- إلكترونيات عامة: https://m.me/j/AbaLaKU-x5-fOnNg/\n" +
        "- تصميم الدوائر المنطقية (ديجيتال): https://m.me/j/AbYNnYVJXmiaUgjb/\n" +
        "- متحكمات دقيقة (مايكرو): https://m.me/j/Aba8C2Sg65ch-zHT/\n" +
        "- برمجة أنظمة التحكم المنطقي والشبكات: https://m.me/j/Abbowta-WUd4Pue1/\n" +
        "- قيادة محركات التيار المستمر (DC): https://m.me/j/AbZmqdPEoQXA_1Nx/\n" +
        "- التحكم المنطقي المبرمج 2 (PLC 2): https://m.me/j/Abbzz8HTZx-IPfVS/\n" +
        "- قيادة محركات التيار المتردد (AC): https://m.me/j/AbYiAbjvhG6RsoP3/\n" +
        "- أنظمة التحكم المبرمج (PLC): https://m.me/j/AbZJw_wmpliZAaf5/\n" +
        "- التوافق الكهرومغناطيسي: https://m.me/j/AbaaA_XxYZmGU_sj/\n" +
        "- أنظمة الإشراف: https://m.me/j/AbalqJf2M7tolHl4/\n\n" +
        "🔬 مختبرات:\n" +
        "- مختبر المنطق الرقمي: https://m.me/j/AbaOWxgeP7BPoo4Q/\n" +
        "- مختبر الحماية والتحكم: https://m.me/j/AbZCBC-VCNqt5xnL/\n" +
        "- مختبر إلكترونيات: https://m.me/j/Abbon3AdqI0aLbud/\n" +
        "- مختبر تصميم الدوائر: https://m.me/j/AbYoRtwM9jczPxgG/\n" +
        "- مختبر مايكرو: https://m.me/j/AbYj_B6DTVrKgPz6/\n" +
        "- مختبر PLC 2: https://m.me/j/Aba3iFGCW8Ef65b5/\n" +
        "- مختبر القيادة الكهربائية: https://m.me/j/AbaMAGzusNeLtszk/\n" +
        "- مختبر PLC: https://m.me/j/AbY6Dn-S1dUDrjGG/"
      );
      break;

    case "STUDY_PLANS":
      sendStudyPlans(sender_psid);
      return;

    case "CLUB_LIBRARY":
      sendTextMessage(sender_psid, "📖 مكتبة النادي (سيتم إضافتها لاحقًا).");
      break;

    case "END_CHAT":
      sendRestartOption(sender_psid);
      return;

    case "RESTART_CHAT":
      startConversation(sender_psid);
      return;
  }

  sendQuickReplies(sender_psid);
}

// دالة إرسال نص
function sendTextMessage(sender_psid, text) {
  let response = { text: text };
  callSendAPI(sender_psid, response);
}

// دالة إرسال القائمة العمودية
function sendQuickReplies(sender_psid) {
  let response = {
    "text": "اختر من القائمة:",
    "quick_replies": [
      { "content_type": "text", "title": "ما هو التخصص ؟", "payload": "ABOUT_MAJOR" },
      { "content_type": "text", "title": "جروبات طلاب التخصص", "payload": "STUDENTS_GROUPS" },
      { "content_type": "text", "title": "جروبات المواد والمختبرات", "payload": "COURSES_GROUPS" },
      { "content_type": "text", "title": "الخطط الدراسية", "payload": "STUDY_PLANS" },
      { "content_type": "text", "title": "مكتبة النادي", "payload": "CLUB_LIBRARY" },
      { "content_type": "text", "title": "إنهاء", "payload": "END_CHAT" }
    ]
  };
  callSendAPI(sender_psid, response);
}

// دالة الخطط الدراسية
function sendStudyPlans(sender_psid) {
  let response = {
    "text": "📑 اختر نوع الخطة:",
    "quick_replies": [
      { "content_type": "text", "title": "الخطة الدراسية", "payload": "STUDY_PLAN_LINK" },
      { "content_type": "text", "title": "الخطة الإرشادية", "payload": "ADVISING_PLAN_LINK" },
      { "content_type": "text", "title": "إنهاء", "payload": "END_CHAT" }
    ]
  };
  callSendAPI(sender_psid, response);
}

// معالجة روابط الخطط
function handleQuickReply(sender_psid, payload) {
  switch (payload) {
    case "STUDY_PLAN_LINK":
      sendTextMessage(sender_psid,
        "🔗 الخطة الدراسية:\nhttps://ptuk.edu.ps/ar/academic-programs/study-plan.php?name=bachelor-of-electrical-eng-industrial-automation"
      );
      break;

    case "ADVISING_PLAN_LINK":
      sendTextMessage(sender_psid,
        "🔗 الخطة الإرشادية:\nhttps://ptuk.edu.ps/ar/academic-programs/advising-plan.php?name=bachelor-of-electrical-eng-industrial-automation"
      );
      break;

    default:
      // باقي الباي لودات تظل زي ما هي فوق
      handleQuickReplyDefault(sender_psid, payload);
      return;
  }
  sendQuickReplies(sender_psid);
}

function handleQuickReplyDefault(sender_psid, payload) {
  // نفس switch تبعت الخيارات الأساسية
}

// دالة إرسال خيار إعادة البدء
function sendRestartOption(sender_psid) {
  let response = {
    "text": "✨ انتهت المحادثة، أهلا بكم في أي وقت ❤️",
    "quick_replies": [
      { "content_type": "text", "title": "🔄 إعادة البدء", "payload": "RESTART_CHAT" }
    ]
  };
  callSendAPI(sender_psid, response);
}

// إرسال عبر Facebook API باستخدام axios
async function callSendAPI(sender_psid, response) {
  try {
    await axios.post(
      `https://graph.facebook.com/v12.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: sender_psid },
        message: response
      }
    );
    console.log('Message sent!');
  } catch (err) {
    console.error("Unable to send message:", err.response ? err.response.data : err.message);
  }
}

// تشغيل السيرفر
app.listen(PORT, () => console.log(`Webhook is listening on port ${PORT}`));
