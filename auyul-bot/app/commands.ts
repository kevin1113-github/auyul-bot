import { ChannelType, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";

const Commands: SlashCommandOptionsOnlyBuilder[] = [
  new SlashCommandBuilder()
    .setName("나가")
    .setDescription("음성채널에서 나갑니다."),

  new SlashCommandBuilder()
    .setName("채널설정")
    .setDescription("명령어 채널을 설정합니다.")
    .addChannelOption((option) =>
      option
        .setName("채널")
        .setDescription("음악 명령어 채널")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("채널생성")
    .setDescription("명령어 채널을 생성합니다.")
    .addStringOption((option) =>
      option.setName("채널이름").setDescription("생성할 채널 이름").setRequired(false)
    ),
];

export default Commands;
