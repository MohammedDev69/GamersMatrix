const fs = require("fs");
const path = require("path");

function rm(target) {
  try {
    fs.rmSync(target, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

rm(path.join(__dirname, "..", "dist"));
rm(path.join(__dirname, "..", "tsconfig.build.tsbuildinfo"));
