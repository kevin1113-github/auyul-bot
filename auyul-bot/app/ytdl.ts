import { AudioResource, createAudioResource } from "@discordjs/voice";
import { spawn } from "child_process";
import { Readable } from "stream";

const cookiePath = "./cookies.txt";

// stream이 최소한 하나의 chunk를 보낼 때까지 기다리는 함수
function waitForStreamReady(stream: Readable): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Stream timed out waiting for data"));
    }, 5000); // 5초 안에 chunk가 안 오면 실패 처리

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
      reject(new Error("Stream ended before producing data"));
    });
  });
}

async function streamFromYtDlp(url: string): Promise<Readable> {
  const ytdlp = spawn("yt-dlp", [
    "--verbose",
    "-f",
    "bestaudio",
    "-o",
    "-",
    "--cookies",
    cookiePath,
    url,
  ]);

  ytdlp.stderr.on("data", (data) => {
    console.error(`🔴 yt-dlp stderr: ${data.toString()}`);
  });

  return ytdlp.stdout as Readable;
}

export async function ytDlpAudioResource(url: string): Promise<AudioResource> {
  const stream = await streamFromYtDlp(url);
  await waitForStreamReady(stream);
  const resource = createAudioResource(stream, { inlineVolume: true });
  resource.volume?.setVolume(1.0);
  return resource;
}
