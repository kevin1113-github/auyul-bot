import { createAudioResource } from "@discordjs/voice";
// import ytdl from "ytdl-core";
import ytdl from "@distube/ytdl-core";
import fs from "fs";

const agent = ytdl.createAgent(JSON.parse(fs.readFileSync("cookies.json").toString()));

function ytdlmusic (url: string) {
  return ytdl(url, {
    ...agent,
    filter: "audioonly",
    quality: "highestaudio",
    dlChunkSize: 0,
    begin: 0,
    highWaterMark: 1 << 25,
  });
}

export function ytdlAudioResource (url: string) {
  // console.log("ytdlAudioResource", url);
  return createAudioResource(ytdlmusic(url));
}