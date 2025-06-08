import { spawn } from "child_process";
import { Readable } from "stream";
import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";

const cookiePath = "./cookies.txt";

function waitForStreamReady(stream: Readable): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Stream timed out waiting for data")), 10000);
    stream.once("data", () => {
      clearTimeout(timeout);
      console.log("✅ stream is ready");
      resolve();
    });
    stream.once("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    stream.once("end", () => {
      clearTimeout(timeout);
      reject(new Error("Stream ended before data"));
    });
  });
}

async function streamWithFfmpeg(url: string): Promise<Readable> {
  const yt = spawn("yt-dlp", [
    "-f", "bestaudio[ext=m4a]/bestaudio",
    "-o", "-",               // stdout
    "--no-playlist",         // 혹시 플레이리스트면 방지
    url,
  ]);

  yt.stdout.on("data", () => {
    console.log("✅ yt-dlp is sending data");
  });

  yt.stderr.on("data", (data) => {
    console.error("🔴 yt-dlp:", data.toString());
  });

  yt.on("error", (err) => {
    console.error("yt-dlp spawn error:", err);
  });

  const ffmpeg = spawn("ffmpeg", [
    "-loglevel", "error",     // 필요시 'debug'
    "-i", "pipe:0",
    "-f", "s16le",
    "-ar", "48000",
    "-ac", "2",
    "pipe:1",
  ], { stdio: ["pipe", "pipe", "pipe"] });

  ffmpeg.stderr.on("data", (data) => {
    console.error("🔧 ffmpeg:", data.toString());
  });

  ffmpeg.on("error", (err) => {
    console.error("ffmpeg spawn error:", err);
  });

  yt.stdout.pipe(ffmpeg.stdin);

  // 스트림이 끝나는 경우 핸들링
  yt.on("close", (code) => {
    if (code !== 0) console.warn(`yt-dlp exited with code ${code}`);
  });
  ffmpeg.on("close", (code) => {
    if (code !== 0) console.warn(`ffmpeg exited with code ${code}`);
  });

  return ffmpeg.stdout;
}

export async function ytDlpAudioResource(url: string): Promise<AudioResource> {
  const stream = await streamWithFfmpeg(url);
  await waitForStreamReady(stream);
  const resource = createAudioResource(stream, {
    inputType: StreamType.Raw, // 리니어 PCM
    inlineVolume: true,
  });
  resource.volume?.setVolume(1.0);
  return resource;
}
