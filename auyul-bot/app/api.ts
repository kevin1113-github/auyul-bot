import { Client, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
const REQUEST_PASSWORD: string = process.env.REQUEST_PASSWORD ?? "";
const DEV_MODE: boolean = process.env.DEV_MODE === "true" ? true : false;

import http from "http";
import { Servers } from "./dbObject.js";
import { T_DATA } from "./types.js";

export default class HttpServer {
  private server: http.Server;
  private client: Client;

  private async notice(data: EmbedBuilder) {
    await Servers.sync();
    const servers: T_DATA[] = await Servers.findAll();
    for (const server of servers) {
      if (DEV_MODE && server.dataValues.id != "1233212899862908938") {
        continue;
      }
      const commandChannel = server.dataValues.commandChannel;
      if (commandChannel) {
        this.client.channels.fetch(commandChannel).then((channel) => {
          if (channel?.isTextBased()) {
            try {
              channel.send({ embeds: [data] });
            } catch (error) {
              console.log(error);
            }
          }
        });
      }
    }
  }

  private requestHandler = (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) => {
    if (req.url === "/notice" && req.method === "POST") {
      let postData: string = "";
      req.on("data", (data) => {
        postData += typeof data === "string" ? data : data.toString();
      });
      req.on("end", async () => {
        const password = postData.split(",")[0];
        postData = postData.split(",")[1];
        postData = postData.replace(/\\n/g, "\n");
        const title: string = postData.split("\n")[0];
        postData = postData.replace(title + "\n", "");
        if (
          password.startsWith("password=") &&
          password.split("=")[1] === REQUEST_PASSWORD
        ) {
          const embed = new EmbedBuilder()
            .setColor("#9A8ED7")
            .setTitle(title)
            .setDescription(postData)
            .setFooter({
              text: "아율봇 ⓒ 2024. @kevin1113dev All Rights Reserved.",
              iconURL:
                "https://github.com/kevin1113-github/auyul-bot/blob/master/auyul-profile.png?raw=true",
            });

          await this.notice(embed);
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write("OK");
        res.end();
      });
    } else {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.write("<h1>404 Not Found</h1>");
      res.end();
    }
  };

  constructor(client: Client) {
    this.server = http.createServer(this.requestHandler);
    this.client = client;
  }

  start() {
    this.server.listen(8081, () => {
      console.log("Server is running on 8081 port");
    });
  }

  stop() {
    this.server.close(() => {
      console.log("Server is closed");
    });
  }
}
