// import { AudioResource, createAudioResource } from "@discordjs/voice";
// // import ytdl from "ytdl-core";
// import ytdl from "@distube/ytdl-core";
// import fs from "fs";

// const cookies = JSON.parse(fs.readFileSync("cookies.json").toString());
// const agent = ytdl.createAgent(cookies);
// console.log("ytdl agent created:", cookies);

// function ytdlmusic (url: string) {
//   return ytdl(url, {
//     agent: agent,
//     filter: "audioonly",
//     quality: "highestaudio",
//     dlChunkSize: 0,
//     begin: 0,
//     highWaterMark: 1 << 25,
//   });
// }

// export function ytdlAudioResource (url: string) {
//   const stream = ytdlmusic(url);
//   const audioResource: AudioResource = createAudioResource(stream);
//   return audioResource;
// }

import { AudioResource, createAudioResource } from "@discordjs/voice";
import { YtDlpPlugin } from "@distube/yt-dlp";
import { spawn } from "child_process";
import { Readable } from "stream";
import fs from "fs";

// yt-dlp 실행 인자 세팅
const cookies = JSON.parse(fs.readFileSync("cookies.json").toString());
const cookiePath = "./cookies.txt";

// 쿠키 파일 생성 (yt-dlp는 파일 형식 쿠키만 지원)
fs.writeFileSync(cookiePath, cookies.map((c: any) => `${c.name}=${c.value}`).join("; "));

function streamFromYtDlp(url: string): Readable {
  const ytdlp = spawn("yt-dlp", [
    "-f", "bestaudio",
    "-o", "-",
    "--cookies", cookiePath,
    url
  ]);

  ytdlp.stderr.on("data", data => {
    console.error(`yt-dlp error: ${data}`);
  });

  return ytdlp.stdout as Readable;
}

export function ytDlpAudioResource(url: string): AudioResource {
  const stream = streamFromYtDlp(url);
  const resource = createAudioResource(stream, {
    inlineVolume: true,
  });
  return resource;
}