
/**
 * Simple Messenger Bot for a university club
 * - Supports webhook verification
 * - Handles messages & postbacks
 * - Sends quick menu with links (about, contact, payment groups, course groups, study plan, course map)
 *
 * Fill your links in the LINKS and COURSES objects below.
 * Set Secrets/Env Vars: PAGE_ACCESS_TOKEN, VERIFY_TOKEN
 */

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "change_me_verify_token";

if (!PAGE_ACCESS_TOKEN) {
  console.warn("⚠️ Missing PAGE_ACCESS_TOKEN env var!");
}

// ====== EDIT THESE LINKS ======
const LINKS = {
  CLUB_PAGE: "https://facebook.com/YourClubPageUsername",
  ABOUT_TEXT: "نبذة مختصرة عن التخصص: هذا التخصص يهتم بكذا وكذا... (عدّل النص)",
  ABOUT_VIDEO: "https://youtu.be/your_intro_video",
  PAY_GROUPS: [
    { title: "مجموعة الدفع 2024/2025", url: "https://m.me/j/EXAMPLE1" },
    { title: "مجموعة الدفع 2025/2026", url: "https://m.me/j/EXAMPLE2" }
  ],
  COURSE_GROUPS: [
    { title: "مجموعة مساق مادة 1", url: "https://m.me/j/COURSE1" },
    { title: "مجموعة مساق مادة 2", url: "https://m.me/j/COURSE2" }
  ],
  STUDY_PLAN: "https://drive.google.com/your_plan_link",
  COURSE_MAP_DRIVE: "https://drive.google.com/your_course_map_link"
};

// Map course names to Drive links
const COURSES = {
  "مادة 1": "https://drive.google.com/drive/folders/EXAMPLE_C1",
  "مادة 2": "https://drive.google.com/drive/folders/EXAMPLE_C2",
  "مادة 3": "https://drive.google.com/drive/folders/EXAMPLE_C3"
};

// ====== WEBHOOK VERIFY (GET) ======
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified.");
      res.status(200).send(challenge);
    } else {
      console.log("❌ Verify token mismatch.");
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// ====== WEBHOOK RECEIVE (POST) ======
app.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging && entry.messaging[0];
      if (!webhookEvent) return;

      const sender_psid = webhookEvent.sender && webhookEvent.sender.id;
      if (!sender_psid) return;

      if (webhookEvent.message) {
        handleMessage(sender_psid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(sender_psid, webhookEvent.postback);
      }
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ====== BASIC ROUTES ======
app.get("/", (req, res) => {
  res.send("Messenger bot is running ✅");
});

// Optional: setup Get Started + persistent menu
app.get("/setup", async (req, res) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        get_started: { payload: "GET_STARTED" },
        greeting: [{
          locale: "default",
          text: "أهلاً بك في بوت نادي التخصص 👋"
        }],
        persistent_menu: [{
          locale: "default",
          composer_input_disabled: false,
          call_to_actions: [
            { type: "postback", title: "النبذة والفيديو", payload: "ABOUT" },
            { type: "postback", title: "التواصل مع النادي", payload: "CONTACT" },
            { type: "postback", title: "الخطة الدراسية", payload: "PLAN" },
            { type: "postback", title: "مجموعات الدفع", payload: "PAY_GROUPS" },
            { type: "postback", title: "مجموعات المواد", payload: "COURSE_GROUPS" }
          ]
        }]
      }
    );
    res.send("Setup done ✅ (get_started + menu)");
  } catch (e) {
    console.error(e?.response?.data || e.message);
    res.status(500).send("Setup failed ❌");
  }
});

// ====== HELPERS ======
function mainMenuQuickReplies() {
  const qrs = [
    { content_type: "text", title: "النبذة", payload: "ABOUT" },
    { content_type: "text", title: "التواصل", payload: "CONTACT" },
    { content_type: "text", title: "الخطة", payload: "PLAN" },
    { content_type: "text", title: "مجاميع الدفع", payload: "PAY_GROUPS" },
    { content_type: "text", title: "مجاميع المواد", payload: "COURSE_GROUPS" },
    { content_type: "text", title: "خريطة المواد", payload: "COURSE_MAP" }
  ];
  return {
    text: "شو بتحب تختار؟",
    quick_replies: qrs
  };
}

async function handleMessage(sender_psid, received_message) {
  if (received_message.quick_reply && received_message.quick_reply.payload) {
    return handlePayload(sender_psid, received_message.quick_reply.payload);
  }

  const text = (received_message.text || "").trim();
  if (!text) {
    return callSendAPI(sender_psid, { text: "ابعثلي كلمة 'قائمة' لعرض الخيارات 👇" });
  }

  // simple keywords
  const norm = text.replace(/\s+/g, "").toLowerCase();
  if (["help","menu","قائمة","خيارات"].some(k => norm.includes(k))) {
    return callSendAPI(sender_psid, mainMenuQuickReplies());
  }
  if (norm.includes("نبذة") || norm.includes("تعريف")) {
    return sendAbout(sender_psid);
  }
  if (norm.includes("تواصل") || norm.includes("ادارة")) {
    return sendContact(sender_psid);
  }
  if (norm.includes("خطة")) {
    return sendPlan(sender_psid);
  }
  if (norm.includes("مجاميع") || norm.includes("مجموعة") || norm.includes("جروبات")) {
    return sendGroups(sender_psid);
  }
  if (norm.includes("خريطة") || norm.includes("مواد")) {
    // If the user typed a course name exactly
    if (COURSES[text]) {
      return callSendAPI(sender_psid, { text: `رابط ${text}: ${COURSES[text]}` });
    }
    // Otherwise show course list
    return sendCourses(sender_psid);
  }

  // Try exact match with a course name
  if (COURSES[text]) {
    return callSendAPI(sender_psid, { text: `رابط ${text}: ${COURSES[text]}` });
  }

  // Fallback: show menu
  await callSendAPI(sender_psid, { text: "ما فهمت طلبك 🙂" });
  return callSendAPI(sender_psid, mainMenuQuickReplies());
}

function handlePostback(sender_psid, postback) {
  const payload = postback.payload || "";
  return handlePayload(sender_psid, payload);
}

async function handlePayload(sender_psid, payload) {
  switch (payload) {
    case "GET_STARTED":
      await callSendAPI(sender_psid, { text: "أهلاً وسهلاً بك 👋" });
      return callSendAPI(sender_psid, mainMenuQuickReplies());
    case "ABOUT": return sendAbout(sender_psid);
    case "CONTACT": return sendContact(sender_psid);
    case "PLAN": return sendPlan(sender_psid);
    case "PAY_GROUPS": return sendPayGroups(sender_psid);
    case "COURSE_GROUPS": return sendCourseGroups(sender_psid);
    case "COURSE_MAP": return callSendAPI(sender_psid, { text: `خريطة المواد: ${LINKS.COURSE_MAP_DRIVE}` });
    default:
      // if payload is "COURSE::<name>"
      if (payload.startsWith("COURSE::")) {
        const name = payload.split("COURSE::")[1];
        const url = COURSES[name];
        if (url) return callSendAPI(sender_psid, { text: `رابط ${name}: ${url}` });
      }
      return callSendAPI(sender_psid, mainMenuQuickReplies());
  }
}

// ----- send helpers -----
async function sendAbout(sender_psid) {
  await callSendAPI(sender_psid, { text: LINKS.ABOUT_TEXT });
  if (LINKS.ABOUT_VIDEO) {
    return callSendAPI(sender_psid, { text: `فيديو تعريفي: ${LINKS.ABOUT_VIDEO}` });
  }
}

function sendContact(sender_psid) {
  return callSendAPI(sender_psid, { text: `تواصل مع إدارة النادي:\n${LINKS.CLUB_PAGE}` });
}

function sendPlan(sender_psid) {
  return callSendAPI(sender_psid, { text: `الخطة الدراسية: ${LINKS.STUDY_PLAN}` });
}

async function sendPayGroups(sender_psid) {
  if (!LINKS.PAY_GROUPS || LINKS.PAY_GROUPS.length === 0) {
    return callSendAPI(sender_psid, { text: "لا توجد مجموعات دفع حالياً." });
  }
  for (const g of LINKS.PAY_GROUPS) {
    await callSendAPI(sender_psid, { text: `${g.title}: ${g.url}` });
  }
}

async function sendCourseGroups(sender_psid) {
  if (!LINKS.COURSE_GROUPS || LINKS.COURSE_GROUPS.length === 0) {
    return callSendAPI(sender_psid, { text: "لا توجد مجموعات مواد حالياً." });
  }
  for (const g of LINKS.COURSE_GROUPS) {
    await callSendAPI(sender_psid, { text: `${g.title}: ${g.url}` });
  }
}

async function sendCourses(sender_psid) {
  // build quick replies with courses
  const items = Object.keys(COURSES).slice(0, 11); // limit to 11 quick replies
  if (items.length === 0) {
    return callSendAPI(sender_psid, { text: "أضف أسماء المواد وربطها في الكود أولاً." });
  }
  const qrs = items.map(name => ({
    content_type: "text",
    title: name.slice(0, 20),
    payload: `COURSE::${name}`
  }));
  return callSendAPI(sender_psid, {
    text: "اختر المادة لعرض رابط الدرايف:",
    quick_replies: qrs
  });
}

// Core send function
async function callSendAPI(psid, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: psid },
        message
      }
    );
  } catch (e) {
    console.error("Send API error:", e?.response?.data || e.message);
  }
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
