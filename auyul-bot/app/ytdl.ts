import { AudioResource, createAudioResource } from "@discordjs/voice";
// import ytdl from "ytdl-core";
import ytdl from "@distube/ytdl-core";
import fs from "fs";

const cookies = JSON.parse(fs.readFileSync("cookies.json").toString());
const agent = ytdl.createAgent(cookies);
console.log("ytdl agent created:", cookies);

function ytdlmusic (url: string) {
  return ytdl(url, {
    agent: agent,
    filter: "audioonly",
    quality: "highestaudio",
    dlChunkSize: 0,
    begin: 0,
    highWaterMark: 1 << 25,
  });
}

export function ytdlAudioResource (url: string) {
  const stream = ytdlmusic(url);
  const audioResource: AudioResource = createAudioResource(stream);
  return audioResource;
}
