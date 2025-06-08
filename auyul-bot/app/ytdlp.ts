// ytdl.ts
import { spawn } from "child_process";
import { Readable } from "stream";
import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";

const cookiePath = "./cookies.txt";

function waitForStreamReady(stream: Readable): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Stream timed out waiting for data")), 10000);
    stream.once("data", () => {
      clearTimeout(timeout);
      resolve();
    });
    stream.once("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    stream.once("end", () => {
      clearTimeout(timeout);
      reject(new Error("Stream ended before receiving data"));
    });
  });
}

let currentYtDlp: ReturnType<typeof spawn> | null = null;

function spawnYtDlp(url: string): { yt: ReturnType<typeof spawn>, output: Readable } {
  const yt = spawn("yt-dlp", [
    "--force-ipv4",
    "--limit-rate", "500K",
    "--retries", "5",
    "--no-playlist",
    "-f", "bestaudio[ext=webm]/bestaudio",
    "-o", "-",
    "--cookies", cookiePath,
    url,
  ]);

  currentYtDlp = yt;
  return { yt, output: yt.stdout };
}


// 전역에서 ffmpeg 프로세스를 관리하도록 export
let currentFfmpeg: ReturnType<typeof spawn> | null = null;

function spawnFfmpeg(): { ffmpeg: ReturnType<typeof spawn>, output: Readable } {
  const ffmpeg = spawn("ffmpeg", [
    "-loglevel", "error",
    "-i", "pipe:0",
    "-f", "s16le",
    "-ar", "48000",
    "-ac", "2",
    "pipe:1",
  ]);

  currentFfmpeg = ffmpeg;
  return { ffmpeg, output: ffmpeg.stdout };
}

function stopCurrentYtDlp() {
  if (currentYtDlp && !currentYtDlp.killed) {
    currentYtDlp.kill("SIGKILL");
    currentYtDlp = null;
  }
}

function stopCurrentFfmpeg() {
  if (currentFfmpeg && !currentFfmpeg.killed) {
    currentFfmpeg.kill("SIGKILL");
    currentFfmpeg = null;
  }
}

export function stopCurrentProcesses() {
  stopCurrentFfmpeg();
  stopCurrentYtDlp();
}

async function streamWithFfmpeg(url: string): Promise<Readable> {
  const { yt, output: ytStream } = spawnYtDlp(url);
  const { ffmpeg, output } = spawnFfmpeg();

  let errored = false;

  ytStream.on("error", (err) => {
    errored = true;
    console.error("[yt-dlp] 오류 발생:", err);
    yt.kill("SIGKILL");
    ffmpeg.kill("SIGKILL");
  });

  ffmpeg.on("error", (err) => {
    errored = true;
    console.error("[ffmpeg] 오류 발생:", err);
    yt.kill("SIGKILL");
    ffmpeg.kill("SIGKILL");
  });

  yt.stderr?.on("data", (data) => {
    console.error("[yt-dlp stderr]:", data.toString());
  });

  ffmpeg.stderr?.on("data", (data) => {
    console.error("[ffmpeg stderr]:", data.toString());
  });

  try {
    if (!ffmpeg.stdin || ffmpeg.stdin.destroyed || !ffmpeg.stdin.writable) {
      throw new Error("FFmpeg stdin이 유효하지 않아 스트리밍을 시작할 수 없습니다.");
    }

    // 수동으로 데이터 흐름 처리
    for await (const chunk of ytStream) {
      try {
        if (!ffmpeg.stdin.writable) {
          throw new Error("FFmpeg stdin이 이미 닫혔습니다.");
        }
        const canWrite = ffmpeg.stdin.write(chunk);
        if (!canWrite) {
          await new Promise((resolve) => ffmpeg.stdin?.once("drain", resolve));
        }
      } catch (err) {
        console.error("[파이프 수동 전송 실패]:", err);
        yt.kill("SIGKILL");
        ffmpeg.kill("SIGKILL");
        throw err;
      }
    }

    // 끝났으면 stdin 종료
    ffmpeg.stdin.end();

  } catch (err) {
    yt.kill("SIGKILL");
    ffmpeg.kill("SIGKILL");
    throw err;
  }

  return output;
}

export async function ytDlpAudioResource(url: string): Promise<AudioResource> {
  const stream = await streamWithFfmpeg(url);
  await waitForStreamReady(stream);
  return createAudioResource(stream, {
    inputType: StreamType.Raw,
    inlineVolume: true,
  });
}
