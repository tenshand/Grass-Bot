require("colors");
const WebSocket = require("ws");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { SocksProxyAgent } = require("socks-proxy-agent");
const { HttpsProxyAgent } = require("https-proxy-agent");

class Bot {
  constructor(config) {
    this.config = config;
  }

  async getProxyIP(proxyUrl) {
    const agent = proxyUrl.startsWith("http") ? new HttpsProxyAgent(proxyUrl) : new SocksProxyAgent(proxyUrl);

    try {
      const response = await axios.get(this.config.ipCheckURL, {
        httpsAgent: agent
      });

      console.log(`通过代理 ${proxyUrl} 连接成功`.green);
      return response.data;
    } catch (error) {
      console.error(`由于连接错误，跳过代理 ${proxyUrl}：${error.message}`.yellow);
      return null;
    }
  }

  async connectToProxy(proxyUrl, userId) {
    const formattedProxyUrl = proxyUrl.startsWith("socks5://") ? proxyUrl : proxyUrl.startsWith("http") ? proxyUrl : `socks5://${proxyUrl}`;
    let retryCount = 3;

    while (retryCount > 0) {
      const proxyIPInfo = await this.getProxyIP(formattedProxyUrl);

      if (!proxyIPInfo) {
        console.log(`代理 ${formattedProxyUrl} 失败，重试剩余次数：${retryCount - 1}`.yellow);
        retryCount--;
        await new Promise(resolve => setTimeout(resolve, this.config.retryInterval));
        continue;
      }

      try {
        const agent = formattedProxyUrl.startsWith("http") ? new HttpsProxyAgent(formattedProxyUrl) : new SocksProxyAgent(formattedProxyUrl);
        const wsUrl = `wss://${this.config.wssHost}`;
        const socket = new WebSocket(wsUrl, {
          agent,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
            "Pragma": "no-cache",
            "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cache-Control": "no-cache",
            "OS": "Windows",
            "Platform": "Desktop",
            "Browser": "Mozilla"
          }
        });

        socket.on("open", () => {
          console.log(`连接到 ${proxyUrl}`.cyan);
          console.log(`代理 IP 信息：${JSON.stringify(proxyIPInfo)}`.magenta);
          setTimeout(() => {
            this.sendPing(socket, proxyIPInfo.ip);
          }, 3000);
        });

        socket.on("message", (message) => {
          const data = JSON.parse(message);

          console.log(`收到消息：${JSON.stringify(data)}`.blue);

          if (data.action === "AUTH") {
            const authResponse = {
              id: data.id,
              origin_action: "AUTH",
              result: {
                browser_id: uuidv4(),
                user_id: userId,
                user_agent: "Mozilla/5.0",
                timestamp: Math.floor(Date.now() / 1000),
                device_type: "desktop",
                version: "4.28.1"
              }
            };

            socket.send(JSON.stringify(authResponse));
            console.log(`发送认证响应：${JSON.stringify(authResponse)}`.green);
          } else if (data.action === "PONG") {
            console.log(`收到 PONG：${JSON.stringify(data)}`.blue);
          }
        });

        socket.on("close", (code, reason) => {
          console.log(`WebSocket 关闭，代码：${code}，原因：${reason}`.yellow);

          if (code === 4000) {
            console.warn(`服务器以代码 4000 关闭连接：${reason}`.red);
            setTimeout(() => this.connectToProxy(proxyUrl, userId), this.config.retryInterval * 5);
          } else {
            setTimeout(() => this.connectToProxy(proxyUrl, userId), this.config.retryInterval * (Math.random() + 1));
          }
        });

        socket.on("error", (error) => {
          console.error(`代理 ${proxyUrl} 上的 WebSocket 错误：${error.message}`.red);
          socket.terminate();
        });

        return;
      } catch (error) {
        console.error(`连接代理 ${proxyUrl} 失败：${error.message}`.red);
        retryCount--;
        await new Promise(resolve => setTimeout(resolve, this.config.retryInterval));
      }
    }

    console.log(`代理 ${formattedProxyUrl} 多次尝试失败，跳过...`.red);
  }

  async connectDirectly(userId) {
    try {
      const wsUrl = `wss://${this.config.wssHost}`;
      const socket = new WebSocket(wsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0",
          "Pragma": "no-cache",
          "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          "OS": "Windows",
          "Platform": "Desktop",
          "Browser": "Mozilla"
        }
      });

      socket.on("open", () => {
        console.log("直接连接成功，无代理".cyan);
        setTimeout(() => {
          this.sendPing(socket, "Direct IP");
        }, 3000);
      });

      socket.on("message", (message) => {
        const data = JSON.parse(message);

        console.log(`收到消息：${JSON.stringify(data)}`.blue);

        if (data.action === "AUTH") {
          const authResponse = {
            id: data.id,
            origin_action: "AUTH",
            result: {
              browser_id: uuidv4(),
              user_id: userId,
              user_agent: "Mozilla/5.0",
              timestamp: Math.floor(Date.now() / 1000),
              device_type: "desktop",
              version: "4.28.1"
            }
          };

          socket.send(JSON.stringify(authResponse));
          console.log(`发送认证响应：${JSON.stringify(authResponse)}`.green);
        } else if (data.action === "PONG") {
          console.log(`收到 PONG：${JSON.stringify(data)}`.blue);
        }
      });

      socket.on("close", (code, reason) => {
        console.log(`WebSocket 关闭，代码：${code}，原因：${reason}`.yellow);
        setTimeout(() => this.connectDirectly(userId), this.config.retryInterval * (Math.random() + 1));
      });

      socket.on("error", (error) => {
        console.error(`WebSocket 错误：${error.message}`.red);
        socket.terminate();
      });
    } catch (error) {
      console.error(`直接连接失败：${error.message}`.red);
    }
  }

  sendPing(socket, ip) {
    setInterval(() => {
      const pingMessage = {
        id: uuidv4(),
        version: "1.0.0",
        action: "PING",
        data: {}
      };

      socket.send(JSON.stringify(pingMessage));
      console.log(`发送 Ping - IP：${ip}, 消息：${JSON.stringify(pingMessage)}`.cyan);
    }, 60000);
  }
}

module.exports = Bot;