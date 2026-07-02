const axios = require("axios");
const { google } = require("googleapis");

require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const CAREER_LABEL_ID =
  "Label_5430076646289734756";

const KEYWORDS = [
  "interview",
  "assessment",
  "shortlisted",
  "offer",
  "selection",
  "test",
  "exam",
  "recruitment"
];

const COMPANIES = [
  "tcs",
  "infosys",
  "wipro",
  "accenture",
  "cognizant",
  "capgemini",
  "deloitte"
];

let token = "";

async function sendTelegram(message) {
  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      chat_id: CHAT_ID,
      text: message
    }
  );
}

async function init() {
  const auth = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET
  );

  auth.setCredentials({
    refresh_token: REFRESH_TOKEN
  });

  const accessTokenResponse =
    await auth.getAccessToken();

  token = accessTokenResponse.token;

  console.log("✅ Gmail authenticated");
}

async function addProcessedLabel(messageId) {
  await axios.post(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      addLabelIds: [CAREER_LABEL_ID]
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

async function checkEmails() {
  const list = await axios.get(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread -label:CareerAgentProcessed&maxResults=20",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const messages = list.data.messages || [];

  console.log(
    `[${new Date().toLocaleTimeString()}] Found ${messages.length} unread emails`
  );

  for (const msg of messages) {
    const messageId = msg.id;

    const email = await axios.get(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const headers = email.data.payload.headers;

    const subject =
      headers.find(h => h.name === "Subject")?.value || "";

    const from =
      headers.find(h => h.name === "From")?.value || "";

    const text =
      `${from} ${subject}`.toLowerCase();

    const keywordMatch = KEYWORDS.some(keyword =>
      text.includes(keyword)
    );

    const companyMatch = COMPANIES.some(company =>
      text.includes(company)
    );

    if (keywordMatch || companyMatch) {
      await sendTelegram(
`🚨 Important Career Email

From: ${from}

Subject: ${subject}`
      );

      console.log("📨 Notification sent!");

      await addProcessedLabel(messageId);

      console.log(
        "🏷️ CareerAgentProcessed label added"
      );
    }
  }
}

async function run() {
  try {
    await checkEmails();
  } catch (err) {
    console.error(
      err.response?.data?.error?.message || err.message
    );
  }
}

async function start() {
  await init();
  await run();
}

start();