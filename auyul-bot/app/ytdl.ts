import { createAudioResource } from "@discordjs/voice";
// import ytdl from "ytdl-core";
import ytdl from "@distube/ytdl-core";
// import fs from "fs";

// const ytdl_agent = ytdl.createAgent(JSON.parse(fs.readFileSync("cookies.json").toString()));
// console.log("ytdl agent created", JSON.parse(fs.readFileSync("cookies.json").toString()));
// console.log(ytdl_agent.jar, ytdl_agent.localAddress);

// const { getRandomIPv6 } = require("@distube/ytdl-core/lib/utils");
// import { getRandomIPv6 } from "@distube/ytdl-core/lib/utils.js";

const agentForARandomIP = ytdl.createAgent(undefined, {
  // localAddress: getRandomIPv6("2406:da12:2bf:b700::/56"),
  localAddress: "2406:da12:2bf:b76f:9a2a:f590:237a:6ff8",
});

function ytdlmusic (url: string) {
  return ytdl(url, {
    // agent: ytdl_agent,
    filter: "audioonly",
    quality: "highestaudio",
    dlChunkSize: 0,
    begin: 0,
    highWaterMark: 1 << 25,
    agent: agentForARandomIP,
  });
}

export function ytdlAudioResource (url: string) {
  // console.log("ytdlAudioResource", url);
  return createAudioResource(ytdlmusic(url));
}
