import { Model } from "sequelize";
import { AudioPlayer } from "@discordjs/voice";
import Action from "./action.js";
import { Message, User, VoiceBasedChannel } from "discord.js";
import { VideoMetadataResult } from "yt-search";

export type T_DATA = Model<any, any>;
export type T_MusicData = { name: string; url: string };
export type T_GuildData = {
  guildId: string;
  audioPlayer: AudioPlayer | null;
  action: Action;
  playlist: T_GuildPlaylist[];
  playingIndex: number;
  playingTime: number;
  isPlaying: boolean;
  isRepeat: boolean;
  timeOut: NodeJS.Timeout | null;
  mainMessage: Message<true>;
  voiceChannel: VoiceBasedChannel | null;
};
export type T_UserPlaylist = { id: string, user_id: string; name: string; playlist: VideoMetadataResult[] };
export type T_GuildPlaylist = { music: VideoMetadataResult, play_user: User };