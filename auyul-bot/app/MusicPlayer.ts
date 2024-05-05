// MusicPlayer.ts

import { AudioPlayer, AudioResource, StreamType, createAudioResource } from "@discordjs/voice";

// 음악 클래스
class Music {
  title: string;
  duration: number;
  url: string;
  thumbnail: string;
  audioResource: AudioResource;

  constructor(title: string, duration: number, url: string, thumbnail: string) {
    this.title = title;
    this.duration = duration;
    this.url = url;
    this.thumbnail = thumbnail;
    this.audioResource = createAudioResource(url);
  }
}

// 음악 플레이어 클래스
export default class MusicPlayer {
  player: AudioPlayer; // 오디오 플레이어
  queue: Music[];     // 음악 큐
  volume: number;     // 볼륨
  isPlaying: boolean; // 재생 중
  isRepeat: boolean;  // 반복 재생
  isShuffle: boolean; // 셔플 재생
  isLoop: boolean;    // 루프 재생

  constructor(player: AudioPlayer) {
    this.player = player;
    this.queue = [];
    this.volume = 50;
    this.isPlaying = false;
    this.isRepeat = false;
    this.isShuffle = false;
    this.isLoop = false;
  }

  async setPlayer(player: AudioPlayer) {
    this.player = player;
  }

  async getPlayer() {
    return this.player;
  }

  async play() {
    this.isPlaying = true;
    // TODO: Play Logic
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }
    this.player.play(this.queue[0].audioResource);
  }

  async pause() {
    this.isPlaying = false;
    // TODO: Pause Logic
  }

  async stop() {
    this.isPlaying = false;
    this.queue = [];
  }

  async skip() {
    this.queue.shift();
  }

  async add(song: Music) {
    this.queue.push(song);
  }

  async remove(index: number) {
    this.queue.splice(index, 1);
  }

  async shuffle() {
    this.queue = await this.shuffleArray(this.queue);
  }

  async repeat() {
    this.isRepeat = !this.isRepeat;
  }

  async loop() {
    this.isLoop = !this.isLoop;
  }

  async sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async setVolume(volume: number) {
    this.volume = volume;
  }

  async getVolume() {
    return this.volume;
  }

  async getQueue() {
    return this.queue;
  }

  async getRepeat() {
    return this.isRepeat;
  }

  async getShuffle() {
    return this.isShuffle;
  }

  async getPlaying() {
    return this.isPlaying;
  }

  async getLoop() {
    return this.isLoop;
  }

  async getSongInfo() {
    return this.queue[0];
  }

  async getQueueLength() {
    return this.queue.length;
  }

  async getQueueList() {
    return this.queue.map((song, index) => `${index + 1}. ${song.title}`);
  }

  async clearQueue() {
    this.queue = [];
  }

  async getQueueIndex(song: Music) {
    return this.queue.indexOf(song);
  }

  async getQueueSong(index: number) {
    return this.queue[index];
  }


  async getQueueSongTitle(index: number) {
    return this.queue[index].title;
  }

  async getQueueSongDuration(index: number) {
    return this.queue[index].duration;
  }

  async getQueueSongUrl(index: number) {
    return this.queue[index].url;
  }

  async getQueueSongThumbnail(index: number) {
    return this.queue[index].thumbnail;
  }

  private async shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
