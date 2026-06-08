require("dotenv").config();

const Imap = require("imap-simple");
const { simpleParser } = require("mailparser");
const axios = require("axios");
const fs = require("fs");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const EMAIL = process.env.EMAIL;
const APP_PASSWORD = process.env.APP_PASSWORD;

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

let processed = [];

if (fs.existsSync("processed.json")) {
  processed = JSON.parse(
    fs.readFileSync("processed.json", "utf8")
  );
}

async function sendTelegram(message) {
  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      chat_id: CHAT_ID,
      text: message
    }
  );
}

async function checkEmails() {
    const config = {
        imap: {
          user: EMAIL,
          password: APP_PASSWORD,
          host: "imap.gmail.com",
          port: 993,
          tls: true,
          authTimeout: 10000,
          tlsOptions: {
            rejectUnauthorized: false
          }
        }
      };

  console.log("Starting IMAP connection...");
  const connection = await Imap.connect(config);
  console.log("Connected to Gmail");
 
  console.log("Opening inbox...");
  await connection.openBox("INBOX");
  console.log("Inbox opened");

  const searchCriteria = ["ALL"];

  const fetchOptions = {
    bodies: [""],
    markSeen: false
  };

  console.log("Searching emails...");
  const messages = await connection.search(
    searchCriteria,
    fetchOptions
  );
  console.log("Unread messages found:", messages.length);

  console.log(
    `[${new Date().toLocaleTimeString()}] Found ${messages.length} unread emails`
  );

  for (const item of messages) {
    const raw = item.parts[0].body;

    const parsed = await simpleParser(raw);

    const id = parsed.messageId || Math.random().toString();

    if (processed.includes(id)) {
      continue;
    }

    const from = parsed.from?.text || "";
    const subject = parsed.subject || "";

    const text =
      `${from} ${subject}`.toLowerCase();

    const keywordMatch = KEYWORDS.some(k =>
      text.includes(k)
    );

    const companyMatch = COMPANIES.some(c =>
      text.includes(c)
    );

    if (keywordMatch || companyMatch) {
      await sendTelegram(
`🚨 Important Career Email

From: ${from}

Subject: ${subject}`
      );

      console.log("📨 Notification sent!");
    }

    processed.push(id);

    if (processed.length > 500) {
      processed = processed.slice(-500);
    }

    fs.writeFileSync(
      "processed.json",
      JSON.stringify(processed, null, 2)
    );
  }

  connection.end();
}

async function run() {
  try {
    await checkEmails();
  } catch (err) {
    console.error(err.message);
  }
}

run();

setInterval(run, 60000);