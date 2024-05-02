
export default class MusicPlayer {
  queue: any[];
  volume: number;
  isRepeat: boolean;
  isShuffle: boolean;
  isPlaying: boolean;
  isLoop: boolean;
  constructor() {
    this.queue = [];
    this.volume = 0.5;
    this.isRepeat = false;
    this.isShuffle = false;
    this.isPlaying = false;
    this.isLoop = false;
  }

  async play() {
    if (this.queue.length === 0) {
      return;
    }
    this.isPlaying = true;
    while (this.queue.length > 0) {
      const song = this.queue.shift();
      console.log(`재생: ${song.title}`);
      await this.sleep(song.duration);
    }
    this.isPlaying = false;
  }

  async pause() {
    this.isPlaying = false;
  }

  async stop() {
    this.isPlaying = false;
    this.queue = [];
  }

  async skip() {
    this.queue.shift();
  }

  async add(song: any) {
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

  async shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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

  async getQueueIndex() {
    return this.queue.map((song, index) => index);
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

  async getQueueSongAuthor(index: number) {
    return this.queue[index].author;
  }

  async getQueueSongViews(index: number) {
    return this.queue[index].views;
  }

  async getQueueSongDescription(index: number) {
    return this.queue[index].description;
  }

  async getQueueSongTimestamp(index: number) {
    return this.queue[index].timestamp;
  }

  async getQueueSongRequestedBy(index: number) {
    return this.queue[index].requestedBy;
  }
}