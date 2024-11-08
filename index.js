require("colors");

const inquirer = require("inquirer");
const Bot = require("./src/Bot");
const Config = require("./src/Config");
const { fetchProxy, readLines, selectProxySource } = require("./src/ProxyManager");
const { delay, displayHeader } = require("./src/utils");

async function main() {
  displayHeader();
  console.log("请稍候...\n".yellow);
  await delay(1000);

  const config = new Config();
  const bot = new Bot(config);

  const proxySource = await selectProxySource(inquirer);
  let proxies = [];

  if (proxySource.type === "file") {
    proxies = await readLines(proxySource.source);
  } else if (proxySource.type === "url") {
    proxies = await fetchProxy(proxySource.source);
  } else if (proxySource.type === "none") {
    console.log("未选择代理，直接连接。".cyan);
  }

  if (proxySource.type !== "none" && proxies.length === 0) {
    console.error("未找到代理，程序退出...".red);
    return;
  }

  console.log(
    proxySource.type !== "none"
      ? `加载了 ${proxies.length} 个代理`.green
      : "启用直接连接模式。".green
  );

  const userIds = await readLines("uid.txt");

  if (userIds.length === 0) {
    console.error("在 uid.txt 中未找到用户 ID，程序退出...".red);
    return;
  }

  console.log(`加载了 ${userIds.length} 个用户 ID\n`.green);

  const connectionTasks = userIds.flatMap((userId) =>
    proxySource.type !== "none"
      ? proxies.map((proxy) => bot.connectToProxy(proxy, userId))
      : [bot.connectDirectly(userId)]
  );

  await Promise.allSettled(connectionTasks);
}

main().catch(console.error);
