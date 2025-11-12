const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

async function runCommand(job) {
  return new Promise((resolve) => {
    const logPath = path.resolve(__dirname, `../../logs/${job.id}.log`);
    fs.mkdirSync(path.dirname(logPath), { recursive: true });

    const child = spawn(job.command, {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
      fs.appendFileSync(logPath, data);
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
      fs.appendFileSync(logPath, data);
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

module.exports = { runCommand };
