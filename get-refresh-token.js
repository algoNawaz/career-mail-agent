const { authenticate } = require("@google-cloud/local-auth");
const path = require("path");

async function main() {
  const auth = await authenticate({
    scopes: [
      "https://www.googleapis.com/auth/gmail.modify"
    ],
    keyfilePath: path.join(
      __dirname,
      "credentials.json"
    ),
  });

  console.log("\nREFRESH TOKEN:");
  console.log(auth.credentials.refresh_token);
}

main().catch(console.error);