import { createAudioResource } from "@discordjs/voice";
import ytdl from "ytdl-core";

function ytdlmusic (url: string) {
  return ytdl(url, {
    filter: "audioonly",
    quality: "highestaudio",
    dlChunkSize: 0,
    begin: 0,
    highWaterMark: 1 << 25,
  });
}

export function ytdlAudioResource (url: string) {
  return createAudioResource(ytdlmusic(url));
}