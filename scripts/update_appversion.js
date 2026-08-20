const { PrismaClient } = require("/var/www/zhishuai/server/node_modules/@prisma/client");
const fs = require("fs");
const crypto = require("crypto");

const file = "/var/www/zhishuai/downloads/智枢AI_3.0.0_x64-setup.exe";
const data = fs.readFileSync(file);
const sha256 = crypto.createHash("sha256").update(data).digest("hex");
const size = data.length;
const sizeMB = (size / 1024 / 1024).toFixed(1) + " MB";

async function main() {
  const prisma = new PrismaClient();
  const updated = await prisma.appVersion.updateMany({
    where: { platform: "desktop", version: "3.0.0", channel: "stable" },
    data: { sha256, size: sizeMB, updatedAt: new Date() }
  });
  console.log("Updated records:", updated.count);
  console.log("sha256:", sha256);
  console.log("size:", sizeMB);
  const record = await prisma.appVersion.findFirst({
    where: { platform: "desktop", version: "3.0.0", channel: "stable" },
    orderBy: { releasedAt: "desc" }
  });
  console.log("Record:", JSON.stringify(record, null, 2));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
