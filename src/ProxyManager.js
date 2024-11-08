require("colors");
const axios = require("axios");
const fs = require("fs");

const proxySources = {
  "内置代理1": "https://files.ramanode.top/airdrop/grass/server_1.txt",
  "内置代理2": "https://files.ramanode.top/airdrop/grass/server_2.txt",
  "内置代理3": "https://files.ramanode.top/airdrop/grass/server_3.txt",
//   "内置代理4": "https://files.ramanode.top/airdrop/grass/server_4.txt",
//   "内置代理5": "https://files.ramanode.top/airdrop/grass/server_5.txt",
//   "内置代理6": "https://files.ramanode.top/airdrop/grass/server_6.txt"
};

async function fetchProxy(url) {
  try {
    const response = await axios.get(url);
    console.log(`\n${url} 获取代理成功`.green);
    return response.data.split("\n").filter(Boolean);
  } catch (error) {
    console.error(`${url} 获取代理失败: ${error.message}`.red);
    return [];
  }
}

async function readLines(filePath) {
  try {
    const data = await fs.promises.readFile(filePath, "utf-8");
    console.log(`${filePath} 加载数据成功`.green);
    return data.split("\n").filter(Boolean);
  } catch (error) {
    console.error(`${filePath} 读取失败: ${error.message}`.red);
    return [];
  }
}

async function selectProxySource(inquirer) {
  const choices = ["自定义代理", ...Object.keys(proxySources), "不使用代理"];
  const { source } = await inquirer.prompt([{
    type: "list",
    name: "source",
    message: "选择代理来源:".cyan,
    choices: choices
  }]);

  if (source === "自定义代理") {
    const { fileName } = await inquirer.prompt([{
      type: "input",
      name: "fileName",
      message: "输入你的 proxy.txt 文件路径".cyan,
      default: "proxy.txt"
    }]);
    return {
      type: "file",
      source: fileName
    };
  } else if (source === "不使用代理") {
    return { type: "none" };
  } else {
    return {
      type: "url",
      source: proxySources[source]
    };
  }
}

module.exports = {
  fetchProxy,
  readLines,
  selectProxySource
};
