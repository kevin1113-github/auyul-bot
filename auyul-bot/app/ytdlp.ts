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

function spawnYtDlpStream(url: string): Readable {
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

  yt.stderr.on("data", () => {});
  yt.on("error", () => {});

  return yt.stdout;
}

export async function ytDlpAudioResource(url: string): Promise<AudioResource> {
  const stream = spawnYtDlpStream(url);
  await waitForStreamReady(stream);
  return createAudioResource(stream, {
    inputType: StreamType.WebmOpus,
    inlineVolume: true,
  });
}
