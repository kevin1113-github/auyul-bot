// ytdl.ts
import { spawn } from "child_process";
import { Readable } from "stream";
import { AudioResource, createAudioResource } from "@discordjs/voice";

const cookiePath = "./cookies.txt";

export function waitForStreamReady(stream: Readable): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Stream timed out waiting for data")), 30000);
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

  return { yt, output: yt.stdout };
}

async function streamYtDlp(url: string): Promise<Readable> {
  const { yt, output: ytStream } = spawnYtDlp(url);
  return ytStream;
}

export async function ytDlpAudioResource(url: string): Promise<AudioResource> {
  const stream = await streamYtDlp(url);
  return createAudioResource(stream);
}
