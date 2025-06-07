import { BaseInteraction, ChatInputCommandInteraction, GuildMember, Interaction, InteractionType, Message, MessageInteraction, VoiceBasedChannel, blockQuote } from "discord.js";
import { AudioPlayer, EndBehaviorType, VoiceConnection, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { Servers } from "./dbObject.js";
import { T_DATA } from "./types.js";
import { types } from "util";
// import { reqSTT } from './reqSTT.js';
// import { GetWeatherImage } from './weather.js';

export default class Action {
  interaction: Interaction | Message | null;
	isReplied = false;

	constructor(interaction: Interaction | Message | null = null) {
		this.interaction = interaction;
    this.isReplied = false;
  }

	// 메세지나 슬래시 커맨드 입력시
	setInteraction(interaction: Interaction | Message) {
		this.interaction = interaction;
		this.isReplied = false;
	}

	async exitVoiceChannel() {
		if (!this.interaction) return;
    if (!this.interaction.guildId) return;

    const voiceConnection: VoiceConnection | undefined = getVoiceConnection(this.interaction.guildId);
		if (!voiceConnection) {
			// await this.reply('음성채널에 연결되어 있지 않습니다');
			return;
		} else {
			voiceConnection.destroy();
			// await this.reply('음성채널 나감');
			return;
		}
  }

  async joinVoiceChannel(audioPlayer: AudioPlayer) {
		if (!this.interaction) return;
    if (!this.interaction.guildId || !(this.interaction.member instanceof GuildMember)) return;

		const voiceChannel: VoiceBasedChannel | null = this.interaction.member.voice.channel;
    if (!voiceChannel) {
      // await this.reply('음성 채널에 먼저 접속해주세요');
			return;
    }

    const voiceConnection: VoiceConnection | undefined = getVoiceConnection(this.interaction.guildId);
    if (!voiceConnection || voiceConnection.joinConfig.channelId != voiceChannel.id) {
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: false
      }).subscribe(audioPlayer);
      // await this.reply('음성 채널 접속 성공');
      return;
    } else {
      // await this.reply('이미 접속 되어 있습니다');
      return;
    }
  }

	// private async send(msg: string, isBlockQuote: boolean, isEphemeral: boolean = false): Promise<void> {
	// 	if (!this.interaction) return;
  //   if (!this.interaction.channel) {
  //     return;
  //   }
		
	// 	const server: DATA | null = await Servers.findOne({ where: { id: this.interaction.guildId } });
  //   if (!server) {
  //     console.error('서버가 등록되지 않았습니다.');
  //     return;
  //   }

	// 	await this.interaction.channel.send(msg);
	// }

	// async reply(msg: string, isBlockQuote: boolean = false, isEphemeral: boolean = false): Promise<void> {
	// 	if (!this.interaction) return;
	// 	if (!(this.interaction instanceof Message || this.interaction.isChatInputCommand())) return;

	// 	const server: DATA | null = await Servers.findOne({ where: { id: this.interaction.guildId } });
  //   if (!server) {
  //     console.error('서버가 등록되지 않았습니다.');
  //     return;
  //   }

	// 	if(this.isReplied) {
	// 		await this.send(msg, isBlockQuote, isEphemeral);
	// 	} else {
	// 		if (this.interaction instanceof ChatInputCommandInteraction) await this.interaction.reply({ content: msg, flags: MessageFlags.Ephemeral, });
	// 		else await this.interaction.reply(msg);
	// 		this.isReplied = true;
	// 	}
	// }

	// async sendBlockQuote(msg: string): Promise<void> {
	// 	if (!this.interaction) return;
	// 	if (!this.interaction.channel) {
	// 		return;
	// 	}

	// 	const server: DATA | null = await Servers.findOne({ where: { id: this.interaction.guildId } });
	// 	if (!server) {
	// 		console.error('서버가 등록되지 않았습니다.');
	// 		return;
	// 	}

	// 	await this.interaction.channel.send(blockQuote(msg));
	// }
}
