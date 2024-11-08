require("colors");

const BOLD = "\x1b[1m";
const NORMAL = "\x1b[0m";
const BLUE = "\x1b[1;34m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const RED = "\x1b[0;31m";
const RESET = "\x1b[0m";
const INFO_ICON = "ℹ️";
const SUCCESS_ICON = "✅";
const WARNING_ICON = "⚠️";
const ERROR_ICON = "❌";

const delay = async (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

function displayHeader() {
  process.stdout.write("\x1bc");
  console.log(YELLOW + "╔════════════════════════════════════════╗");
  console.log(YELLOW + "║             Grass 挂机脚本              ║");
  console.log(YELLOW + "║       https://github.com/Lwx7832       ║");
  console.log(YELLOW + "╚════════════════════════════════════════╝");
  console.log();
}

function logInfo(message) {
  console.log(`${BLUE}${INFO_ICON} ${message}${RESET}`);
}

function logSuccess(message) {
  console.log(`${GREEN}${SUCCESS_ICON} ${message}${RESET}`);
}

function logWarning(message) {
  console.log(`${YELLOW}${WARNING_ICON} ${message}${RESET}`);
}

function logError(message) {
  console.log(`${RED}${ERROR_ICON} ${message}${RESET}`);
}

module.exports = {
  delay,
  displayHeader,
  logInfo,
  logSuccess,
  logWarning,
  logError
};
