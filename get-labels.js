require("dotenv").config();

const { google } = require("googleapis");

async function main() {
  const auth = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );

  auth.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });

  const gmail = google.gmail({
    version: "v1",
    auth
  });

  const labels = await gmail.users.labels.list({
    userId: "me"
  });

  console.log(labels.data.labels);
}

main().catch(console.error);