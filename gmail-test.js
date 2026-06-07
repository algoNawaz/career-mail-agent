const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");
const axios = require("axios");

async function main() {
  const auth = await authenticate({
    scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
    keyfilePath: path.join(__dirname, "credentials.json"),
  });

  const token = auth.credentials.access_token;

  const list = await axios.get(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const messageId = list.data.messages[0].id;

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

  console.log("FROM:", from);
  console.log("SUBJECT:", subject);
}

main().catch(console.error);