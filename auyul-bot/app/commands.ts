import { ChannelType, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";

const Commands: SlashCommandOptionsOnlyBuilder[] = [
  // new SlashCommandBuilder()
  //   .setName("들어와")
  //   .setDescription("음성채널에 참가합니다."),

  new SlashCommandBuilder()
    .setName("main")
    .setDescription("테스트용 메인 메세지"),

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

  new SlashCommandBuilder()
    .setName("채널해제")
    .setDescription("명령어 채널을 해제합니다."),

  // new SlashCommandBuilder()
  //   .setName("리모컨")
  //   .setDescription("조작이 손쉬운 리모컨 웹 페이지 링크를 불러옵니다."),

  // new SlashCommandBuilder()
  //   .setName("도움말")
  //   .setDescription("도움말을 불러옵니다."),

  new SlashCommandBuilder()
    .setName("검색")
    .setDescription("노래를 검색합니다.")
    .addStringOption((option) =>
      option.setName("검색어").setDescription("검색어").setRequired(true)
    ),

  // new SlashCommandBuilder()
  //   .setName("재생")
  //   .setDescription("노래를 재생합니다."),

  // new SlashCommandBuilder()
  //   .setName("일시정지")
  //   .setDescription("노래를 일시정지합니다."),

  // new SlashCommandBuilder()
  //   .setName("이전곡")
  //   .setDescription("이전 곡을 재생합니다."),
  
  // new SlashCommandBuilder()
  //   .setName("다음곡")
  //   .setDescription("다음 곡을 재생합니다."),

  // new SlashCommandBuilder()
  //   .setName("정지")
  //   .setDescription("노래를 정지합니다."),

  // new SlashCommandBuilder()
  //   .setName("재생목록")
  //   .setDescription("재생목록을 불러옵니다."),

  // new SlashCommandBuilder()
  //   .setName("제거")
  //   .setDescription("재생목록에서 노래를 제거합니다.")
  //   .addIntegerOption((option) =>
  //     option.setName("번호").setDescription("제거할 노래의 번호").setRequired(true)
  //   ),

  // new SlashCommandBuilder()
  //   .setName("섞기")
  //   .setDescription("재생목록을 섞습니다."),

  // new SlashCommandBuilder()
  //   .setName("반복")
  //   .setDescription("노래를 반복재생합니다."),

  // new SlashCommandBuilder()
  //   .setName("반복해제")
  //   .setDescription("노래 반복재생을 해제합니다."),

  // new SlashCommandBuilder()
  //   .setName("볼륨")
  //   .setDescription("볼륨을 조절합니다.")
  //   .addIntegerOption((option) =>
  //     option.setName("볼륨").setDescription("조절할 볼륨").setRequired(true)
  //   ),
];

export default Commands;
