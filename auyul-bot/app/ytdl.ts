import { AudioResource, createAudioResource } from "@discordjs/voice";
// import ytdl from "ytdl-core";
import ytdl from "@distube/ytdl-core";
// import fs from "fs";

// const ytdl_agent = ytdl.createAgent(JSON.parse(fs.readFileSync("cookies.json").toString()));
// console.log("ytdl agent created", JSON.parse(fs.readFileSync("cookies.json").toString()));
// console.log(ytdl_agent.jar, ytdl_agent.localAddress);

// const { getRandomIPv6 } = require("@distube/ytdl-core/lib/utils");
// import { getRandomIPv6 } from "@distube/ytdl-core/lib/utils.js";

const agentIP = ytdl.createAgent(undefined, {
  // localAddress: getRandomIPv6("2406:da12:2bf:b700::/56"),
  localAddress: "2406:da12:2bf:b7bb:7dc8:b0ad:7014:2849",
});

/*
const agentOptions = {
  headers: {
    referer: 'https://www.youtube.com/',
  },
};
*/

// const proxyAgent = ytdl.createProxyAgent({ uri: "http://152.26.229.66:9443" });

function ytdlmusic (url: string) {
  return ytdl(url, {
    filter: "audioonly",
    quality: "highestaudio",
    dlChunkSize: 0,
    begin: 0,
    highWaterMark: 1 << 25,
    agent: agentIP,
    // agent: proxyAgent,
    // IPv6Block: "2406:da12:2bf:b700::/56",
  });
}

export function ytdlAudioResource (url: string) {
  // console.log("ytdlAudioResource", url);
  
  const stream = ytdlmusic(url);
  /*
  stream.on("data", (chunk) => {
    console.log("stream data", chunk.length);
  });
  */
  const audioResource: AudioResource = createAudioResource(stream);
  return audioResource;
}
