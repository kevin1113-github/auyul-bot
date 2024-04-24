import { ChannelType, SlashCommandBuilder } from 'discord.js';

const Commands: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">[] = [
  new SlashCommandBuilder()
    .setName('들어와')
    .setDescription('음성채널에 참가합니다.'),

  new SlashCommandBuilder()
    .setName('나가')
    .setDescription('음성채널에서 나갑니다.'),

  new SlashCommandBuilder()
    .setName('채널설정')
    .setDescription('명령어 채널을 설정합니다.')
    .addChannelOption(option =>
      option.setName('채널')
        .setDescription('음악 명령어 채널')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('채널해제')
    .setDescription('명령어 채널을 해제합니다.'),
      
  new SlashCommandBuilder()
    .setName('음소거')
    .setDescription('아율봇이 채팅을 치지 않도록 음소거합니다.'),
  
  new SlashCommandBuilder()
    .setName('음소거해제')
    .setDescription('아율봇의 음소거를 해제합니다.'),

  new SlashCommandBuilder()
    .setName('리모컨')
    .setDescription('조작이 손쉬운 리모컨 웹 페이지 링크를 불러옵니다.'),
];

export default Commands;