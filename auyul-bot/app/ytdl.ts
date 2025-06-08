import { spawn } from "child_process";
import { Readable } from "stream";
import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";

const cookiePath = "./cookies.txt";

function waitForStreamReady(stream: Readable): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Stream timed out waiting for data")), 5000);
    stream.once("data", () => { clearTimeout(timeout); resolve(); });
    stream.once("error", (err) => { clearTimeout(timeout); reject(err); });
    stream.once("end", () => { clearTimeout(timeout); reject(new Error("Stream ended before data")); });
  });
}

async function streamWithFfmpeg(url: string): Promise<Readable> {
  const yt = spawn("yt-dlp", [
    "-f", "140", // ← 명확한 m4a 포맷으로 변경
    "-o", "-", // stdout으로 출력
    "--cookies", cookiePath,
    url,
  ]);

  (yt.stderr as NodeJS.ReadableStream).on("data", (data) => {
    console.error("🔴 yt-dlp:", data.toString());
  });

  const ffmpeg = spawn("ffmpeg", [
    "-loglevel", "debug", // 디버깅 로그 추가
    "-i", "pipe:0",       // yt-dlp의 stdout
    "-f", "s16le",        // 리니어 PCM
    "-ar", "48000",       // Discord용 표준 샘플레이트
    "-ac", "2",           // 스테레오
    "pipe:1",             // ffmpeg의 stdout
  ], { stdio: ["pipe", "pipe", "pipe"] });

  (ffmpeg.stderr as unknown as NodeJS.ReadableStream).on("data", (data) => {
    console.error("🔧 ffmpeg:", data.toString());
  });

  yt.stdout.pipe(ffmpeg.stdin);

  return ffmpeg.stdout as Readable;
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
