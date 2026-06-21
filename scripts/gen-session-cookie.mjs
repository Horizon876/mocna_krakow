import fs from "node:fs";
import crypto from "node:crypto";

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx);
    let value = trimmed.slice(idx + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] ??= value;
  }
}

loadEnv(process.argv[2] || ".env");

const secret = process.env.SESSION_SECRET;
if (!secret) {
  console.error("Brak SESSION_SECRET");
  process.exit(1);
}

const role = "admin";
const expires = Date.now() + 8 * 60 * 60 * 1000;
const payload = `${role}:${expires}`;
const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
console.log(`admin_session=${payload}.${sig}`);
