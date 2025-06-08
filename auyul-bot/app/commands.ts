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

  // new SlashCommandBuilder()
  //   .setName("채널해제")
  //   .setDescription("명령어 채널을 해제합니다."),

  // new SlashCommandBuilder()
  //   .setName("리모컨")
  //   .setDescription("조작이 손쉬운 리모컨 웹 페이지 링크를 불러옵니다."),

  // new SlashCommandBuilder()
  //   .setName("도움말")
  //   .setDescription("도움말을 불러옵니다."),

  // new SlashCommandBuilder()
  //   .setName("검색")
  //   .setDescription("노래를 검색합니다.")
  //   .addStringOption((option) =>
  //     option.setName("검색어").setDescription("검색어").setRequired(true)
  //   ),
];

export default Commands;
