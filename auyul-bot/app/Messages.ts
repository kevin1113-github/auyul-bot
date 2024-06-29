import {
  ActionRowBuilder,
  ActionRowData,
  AnyComponentBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionReplyOptions,
  MessageActionRowComponentBuilder,
  MessageActionRowComponentData,
  MessagePayload,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { VideoMetadataResult } from "yt-search";
import { T_GuildPlaylist, T_UserPlaylist } from "./types.js";

interface MessageInterface {
  getMessage(): BaseMessageOptions;
}

class MainControllerMessage implements MessageInterface {
  // 메인 메세지 임베드
  private mainMessageEmbed = new EmbedBuilder()
    .setColor("#ccbdb7")
    .setTitle("음악이 재생되고 있지 않습니다.")
    .setDescription("음악을 재생하려면 `검색` 또는 `재생목록`을 이용해주세요.")
    .setThumbnail(
      "https://github.com/kevin1113-github/auyul-bot/blob/master/auyul-profile.png?raw=true"
    )
    .setTimestamp()
    .setFooter({
      text: "아율봇",
      iconURL:
        "https://github.com/kevin1113-github/auyul-bot/blob/master/auyul-profile.png?raw=true",
    });

  // 메인 메세지 액션 로우1
  private playlistButton: ButtonBuilder = new ButtonBuilder()
    .setCustomId("playlist")
    .setLabel("재생목록")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("🎧");
  private myPlaylistButton: ButtonBuilder = new ButtonBuilder()
    .setCustomId("myPlaylist")
    .setLabel("내 플리")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("🎵");
  private popularButton: ButtonBuilder = new ButtonBuilder()
    .setCustomId("popular")
    .setLabel("인기 차트")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("📈")
    .setDisabled(true); // TODO: 인기 차트 기능 추가
  private searchButton: ButtonBuilder = new ButtonBuilder()
    .setCustomId("search")
    .setLabel("검색")
    .setStyle(ButtonStyle.Success)
    .setEmoji("🔍");
  public actionRow1: ActionRowBuilder<ButtonBuilder> =
    new ActionRowBuilder().addComponents(
      this.playlistButton,
      this.myPlaylistButton,
      this.popularButton,
      this.searchButton
    ) as ActionRowBuilder<ButtonBuilder>;

  // 메인 메세지 액션 로우2
  private selectRecentMusicMenu: StringSelectMenuBuilder =
    new StringSelectMenuBuilder()
      .setCustomId("selectRecentMusic")
      .setPlaceholder("최근 재생 내역")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("준비중 입니다.")
          .setValue("recent")
      );
  private actionRow2: ActionRowBuilder<StringSelectMenuBuilder> =
    new ActionRowBuilder().addComponents(
      this.selectRecentMusicMenu
    ) as ActionRowBuilder<StringSelectMenuBuilder>;

  public getMessage() {
    return {
      embeds: [this.mainMessageEmbed],
      components: [this.actionRow1, this.actionRow2],
    };
  }
}

const mainControllerMessage = new MainControllerMessage();
export const MainController = mainControllerMessage.getMessage();

export class MainControllerPlayingMessage implements MessageInterface {
  private playlist: T_GuildPlaylist[];
  private playingIndex: number;
  private playingTime: number;
  private isPlaying: boolean;

  private mainMessageEmbed: EmbedBuilder;
  private actionRow1: ActionRowBuilder<ButtonBuilder>;
  private actionRow2: ActionRowBuilder<ButtonBuilder>;
  private playlistButton: ButtonBuilder;
  private myPlaylistButton: ButtonBuilder;
  private searchButton: ButtonBuilder;
  private repeatButton: ButtonBuilder;
  private prevButton: ButtonBuilder;
  private playPauseButton: ButtonBuilder;
  private nextButton: ButtonBuilder;
  private stopButton: ButtonBuilder;

  constructor(
    playlist: T_GuildPlaylist[],
    playingIndex: number,
    playingTime: number,
    isPlaying: boolean,
    isRepeat: boolean
  ) {
    this.playlist = playlist;
    this.playingIndex = playingIndex;
    this.playingTime = playingTime;
    this.isPlaying = isPlaying;

    const barLength: number = 6;

    const progressBar: number = Math.floor(
      (playingTime / playlist[playingIndex].music.seconds) * barLength
    );

    const playingTimeStr: string = getTimeFormat(
      playingTime,
      playlist[playingIndex].music.seconds
    );

    this.mainMessageEmbed = new EmbedBuilder()
      .setColor("#ccbdb7")
      .setTitle(`재생중: ${playlist[playingIndex].music.title}`)
      .setDescription(
        `게시자: ${playlist[playingIndex].music.author.name}\n길이: ${
          playlist[playingIndex].music.timestamp
        }\n조회수: ${playlist[playingIndex].music.views}회\n링크: [Link](${
          playlist[playingIndex].music.url
        })\n추가자: <@${
          playlist[playingIndex].play_user.id
        }>\n[${playingTimeStr}] ${`⎯`.repeat(progressBar)}⦿${`⎯`.repeat(
          progressBar <= barLength ? barLength - progressBar : 0
        )} [${playlist[playingIndex].music.timestamp}]`
      )
      // .setTitle(`0:00 ━━━━●────────── 4:00`)
      // .setTitle(``)
      .setThumbnail(playlist[playingIndex].play_user.displayAvatarURL())
      .setImage(playlist[0].music.thumbnail)
      .setTimestamp()
      .setFooter({
        text: "아율봇",
        iconURL:
          "https://github.com/kevin1113-github/auyul-bot/blob/master/auyul-profile.png?raw=true",
      });

    this.playlistButton = new ButtonBuilder()
      .setCustomId("playlist")
      .setLabel("재생목록")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🎧");
    this.myPlaylistButton = new ButtonBuilder()
      .setCustomId("myPlaylist")
      .setLabel("내 플리")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🎵");
    this.searchButton = new ButtonBuilder()
      .setCustomId("searchAdd")
      .setLabel("검색")
      .setStyle(ButtonStyle.Success)
      .setEmoji("🔍");
    this.actionRow1 = new ActionRowBuilder().addComponents(
      this.playlistButton,
      this.myPlaylistButton,
      this.searchButton
    ) as ActionRowBuilder<ButtonBuilder>;

    this.repeatButton = new ButtonBuilder()
      .setCustomId(isRepeat ? "resumeMusic" : "repeatMusic")
      // .setLabel(isRepeat ? "반복재생 끄기" : "반복재생")
      .setStyle(ButtonStyle.Primary)
      .setEmoji(isRepeat ? "1256638731469983745" : "1256637678586167357");
    this.prevButton = new ButtonBuilder()
      .setCustomId("prevMusic")
      // .setLabel("이전곡")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("1256636198437388359")
      .setDisabled(playingIndex === 0);
    this.playPauseButton = new ButtonBuilder()
      .setCustomId(isPlaying ? "pauseMusic" : "playMusic")
      // .setLabel(isPlaying ? "일시정지" : "재생")
      .setStyle(ButtonStyle.Success)
      .setEmoji(isPlaying ? "1256636201293840437" : "1256636200157053009");
    this.nextButton = new ButtonBuilder()
      .setCustomId("nextMusic")
      // .setLabel("다음곡")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("1256636203382476913")
      .setDisabled(playingIndex === playlist.length - 1);
    this.stopButton = new ButtonBuilder()
      .setCustomId("stopMusic")
      // .setLabel("정지")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("1256636196839493684");
    this.actionRow2 = new ActionRowBuilder().addComponents(
      this.repeatButton,
      this.prevButton,
      this.playPauseButton,
      this.nextButton,
      this.stopButton
    ) as ActionRowBuilder<ButtonBuilder>;
  }

  public getMessage() {
    return {
      embeds: [this.mainMessageEmbed],
      components: [this.actionRow1, this.actionRow2],
    };
  }
}

export class PlaylistMessage implements MessageInterface {
  private playlist: T_GuildPlaylist[];
  private playlistMessageEmbed: EmbedBuilder;
  private actionRow1: ActionRowBuilder<ButtonBuilder>;
  private prevButton: ButtonBuilder;
  private currentPage: ButtonBuilder;
  private nextButton: ButtonBuilder;
  private actionRow2: ActionRowBuilder<ButtonBuilder>;
  private playButton: ButtonBuilder;

  constructor(
    playlist: T_GuildPlaylist[],
    playingIndex: number,
    isPlaying: boolean,
    page: number | null = null
  ) {
    if (!isPlaying) {
      playingIndex = 0;
    }
    const pageIndex: number = page ?? Math.floor(playingIndex / 10);
    this.playlist = playlist;
    this.playlistMessageEmbed = new EmbedBuilder().setColor("#ccbdb7");

    if (playlist.length === 0) {
      this.playlistMessageEmbed
        .setTitle("재생목록이 비어있습니다.")
        .setDescription("음악을 검색하여 추가해주세요.");
    } else if (isPlaying) {
      this.playlistMessageEmbed
        .setTitle("현재 재생중인 목록입니다.")
        .setDescription(
          `재생중: ${this.playlist[playingIndex].music.title}`
        )
        .setThumbnail(this.playlist[playingIndex].music.thumbnail)
        .addFields(
          this.playlist
            .slice(
              pageIndex * 10,
              Math.min((pageIndex + 1) * 10, playlist.length)
            )
            .map((video, index) => {
              return {
                name: `${playingIndex == pageIndex * 10 + index ? "▶️ " : ""} ${
                  pageIndex * 10 + index + 1
                }. ${video.music.title}`,
                value: `게시자: ${video.music.author.name} | 길이: ${video.music.timestamp} | 조회수: ${video.music.views}회 | [링크](${video.music.url}) | 추가자: <@${video.play_user.id}>`,
              };
            })
        );
    } else {
      this.playlistMessageEmbed
        .setTitle("재생목록입니다.")
        .addFields(
          this.playlist
            .slice(
              pageIndex * 10,
              Math.min((pageIndex + 1) * 10, playlist.length)
            )
            .map((video, index) => {
              return {
                name: `${
                  pageIndex * 10 + index + 1
                }. ${video.music.title}`,
                value: `게시자: ${video.music.author.name} | 길이: ${video.music.timestamp} | 조회수: ${video.music.views}회 | [링크](${video.music.url}) | 추가자: <@${video.play_user.id}>`,
              };
            })
        );
    }

    this.playlistMessageEmbed.setTimestamp().setFooter({
      text: "아율봇",
      iconURL:
        "https://github.com/kevin1113-github/auyul-bot/blob/master/auyul-profile.png?raw=true",
    });

    this.prevButton = new ButtonBuilder()
      .setCustomId("prevPage" + pageIndex)
      // .setLabel("이전")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("1256654988277584002")
      .setDisabled(pageIndex === 0);
    this.currentPage = new ButtonBuilder()
      .setCustomId("currentPage" + pageIndex)
      .setLabel(`${pageIndex + 1}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);
    this.nextButton = new ButtonBuilder()
      .setCustomId("nextPage" + pageIndex)
      // .setLabel("다음")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("1256654986176106539")
      .setDisabled((pageIndex + 1) * 10 >= playlist.length);
    this.actionRow1 = new ActionRowBuilder().addComponents(
      this.prevButton,
      this.currentPage,
      this.nextButton
    ) as ActionRowBuilder<ButtonBuilder>;

    this.playButton = new ButtonBuilder()
      .setCustomId("playPlaylist")
      .setLabel("처음부터 재생하기")
      .setStyle(ButtonStyle.Success)
      .setEmoji("1256636200157053009")
      .setDisabled(isPlaying || playlist.length === 0);
    this.actionRow2 = new ActionRowBuilder().addComponents(
      this.playButton
    ) as ActionRowBuilder<ButtonBuilder>;
  }

  public getMessage() {
    return {
      embeds: [this.playlistMessageEmbed],
      components: [this.actionRow1, this.actionRow2],
    };
  }
}

export class MyPlaylistListMessage implements MessageInterface {
  private myPlaylistList: T_UserPlaylist[];
  private myPlaylistListMessageEmbed: EmbedBuilder;
  private actionRow1: ActionRowBuilder<StringSelectMenuBuilder>;
  private actionRow2: ActionRowBuilder<ButtonBuilder>;
  private actionRow3: ActionRowBuilder<ButtonBuilder>;
  private selectMyPlaylistMenu: StringSelectMenuBuilder;
  private addMyPlaylistButton: ButtonBuilder;
  private deleteMyPlaylistButton: ButtonBuilder;
  private prevButton: ButtonBuilder;
  private currentPage: ButtonBuilder;
  private nextButton: ButtonBuilder;

  constructor(myPlaylistList: T_UserPlaylist[], page: number | null = null) {
    const pageIndex: number = page ?? 0;
    this.myPlaylistList = myPlaylistList;
    this.myPlaylistListMessageEmbed = new EmbedBuilder().setColor("#ccbdb7");

    if (myPlaylistList.length === 0) {
      this.myPlaylistListMessageEmbed
        .setTitle("내 플레이리스트 목록이 비어있습니다.")
        .setDescription("플레이리스트를 추가해주세요.");
    } else {
      this.myPlaylistListMessageEmbed
        .setTitle("내 플레이리스트 목록")
        .addFields(
          this.myPlaylistList
            .slice(
              pageIndex * 10,
              Math.min((pageIndex + 1) * 10, myPlaylistList.length)
            )
            .map((playlist: T_UserPlaylist, index) => {
              return {
                name: `${pageIndex * 10 + index + 1}. ${playlist.name}`,
                value: `${playlist.playlist.length}곡 | 총 ${getTotalDuration(
                  playlist
                )}`,
              };
            })
        );
    }

    this.myPlaylistListMessageEmbed.setTimestamp().setFooter({
      text: "아율봇",
      iconURL:
        "https://github.com/kevin1113-github/auyul-bot/blob/master/auyul-profile.png?raw=true",
    });

    this.selectMyPlaylistMenu = new StringSelectMenuBuilder()
      .setCustomId("selectMyPlaylist")
      .setPlaceholder("플레이리스트를 선택해주세요.")
      .addOptions(
        this.myPlaylistList
          .slice(
            pageIndex * 10,
            Math.min((pageIndex + 1) * 10, myPlaylistList.length)
          )
          .map((playlist: T_UserPlaylist) => {
            return new StringSelectMenuOptionBuilder()
              .setLabel(playlist.name)
              .setValue(playlist.id);
          })
      );
    this.actionRow1 = new ActionRowBuilder().addComponents(
      this.selectMyPlaylistMenu
    ) as ActionRowBuilder<StringSelectMenuBuilder>;

    this.addMyPlaylistButton = new ButtonBuilder()
      .setCustomId("addMyPlaylist")
      .setLabel("플레이리스트 추가")
      .setStyle(ButtonStyle.Success)
      .setEmoji("➕");
    this.deleteMyPlaylistButton = new ButtonBuilder()
      .setCustomId("deleteMyPlaylist")
      .setLabel("플레이리스트 삭제")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🗑️");
    this.actionRow2 = new ActionRowBuilder().addComponents(
      this.addMyPlaylistButton,
      this.deleteMyPlaylistButton
    ) as ActionRowBuilder<ButtonBuilder>;

    this.prevButton = new ButtonBuilder()
      .setCustomId("prevPage" + pageIndex)
      // .setLabel("이전")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("1256654988277584002")
      .setDisabled(pageIndex === 0);
    this.currentPage = new ButtonBuilder()
      .setCustomId("currentPage" + pageIndex)
      .setLabel(`${pageIndex + 1}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);
    this.nextButton = new ButtonBuilder()
      .setCustomId("nextPage" + pageIndex)
      // .setLabel("다음")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("1256654986176106539")
      .setDisabled((pageIndex + 1) * 10 >= myPlaylistList.length);
    this.actionRow3 = new ActionRowBuilder().addComponents(
      this.prevButton,
      this.currentPage,
      this.nextButton
    ) as ActionRowBuilder<ButtonBuilder>;
  }

  private getComponents() {
    const components = [];
    if (this.selectMyPlaylistMenu.options.length > 0)
      components.push(this.actionRow1);
    components.push(this.actionRow2);
    components.push(this.actionRow3);
    return components;
  }

  public getMessage() {
    return {
      embeds: [this.myPlaylistListMessageEmbed],
      components: [...this.getComponents()],
    };
  }
}

export class DeleteMyPlaylistMessage implements MessageInterface {
  private myPlaylistList: T_UserPlaylist[];
  private deleteMyPlaylistMessageEmbed: EmbedBuilder;
  private actionRow: ActionRowBuilder<StringSelectMenuBuilder>;
  private selectMyPlaylistMenu: StringSelectMenuBuilder;

  constructor(myPlaylistList: T_UserPlaylist[]) {
    this.myPlaylistList = myPlaylistList;
    this.deleteMyPlaylistMessageEmbed = new EmbedBuilder()
      .setColor("#ccbdb7")
      .setTitle("플레이리스트 삭제")
      .setDescription("삭제할 플레이리스트를 선택해주세요.")
      .setTimestamp()
      .setFooter({
        text: "아율봇",
        iconURL:
          "https://github.com/kevin1113-github/auyul-bot/blob/master/auyul-profile.png?raw=true",
      });

    this.selectMyPlaylistMenu = new StringSelectMenuBuilder()
      .setCustomId("deleteMyPlaylist")
      .setPlaceholder("플레이리스트를 선택해주세요.")
      .addOptions(
        this.myPlaylistList.map((playlist: T_UserPlaylist) => {
          return new StringSelectMenuOptionBuilder()
            .setLabel(playlist.name)
            .setDescription(
              `${playlist.playlist.length}곡 | 총 ${getTotalDuration(playlist)}`
            )
            .setValue(playlist.id);
        })
      );
    this.actionRow = new ActionRowBuilder().addComponents(
      this.selectMyPlaylistMenu
    ) as ActionRowBuilder<StringSelectMenuBuilder>;
  }

  public getMessage() {
    return {
      embeds: [this.deleteMyPlaylistMessageEmbed],
      components: [this.actionRow],
    };
  }
}

export class MyPlaylistMessage implements MessageInterface {
  private myPlaylist: T_UserPlaylist;
  private myPlaylistMessageEmbed: EmbedBuilder;
  private actionRow1: ActionRowBuilder<StringSelectMenuBuilder>;
  private actionRow2: ActionRowBuilder<ButtonBuilder>;
  private actionRow3: ActionRowBuilder<ButtonBuilder>;
  private selectMyPlaylistMusicMenu: StringSelectMenuBuilder;
  private addMyPlaylistMusicButton: ButtonBuilder;
  private deleteMyPlaylistMusicButton: ButtonBuilder;
  private prevButton: ButtonBuilder;
  private currentPage: ButtonBuilder;
  private nextButton: ButtonBuilder;

  constructor(myPlaylist: T_UserPlaylist, page: number | null = null) {
    const pageIndex: number = page ?? 0;
    this.myPlaylist = myPlaylist;
    this.myPlaylistMessageEmbed = new EmbedBuilder().setColor("#ccbdb7");

    if (myPlaylist.playlist.length === 0) {
      this.myPlaylistMessageEmbed
        .setTitle(`플레이리스트 '${myPlaylist.name}'이(가) 비어있습니다.`)
        .setDescription("음악을 추가해주세요.");
    } else {
      this.myPlaylistMessageEmbed
        .setTitle(`플레이리스트 ${myPlaylist.name}`)
        .setDescription(
          `${myPlaylist.playlist.length}곡 | 총 ${getTotalDuration(myPlaylist)}`
        )
        .setThumbnail(this.myPlaylist.playlist[0].thumbnail)
        .addFields(
          this.myPlaylist.playlist
            .slice(
              pageIndex * 10,
              Math.min((pageIndex + 1) * 10, myPlaylist.playlist.length)
            )
            .map((video, index) => {
              return {
                name: `${pageIndex * 10 + index + 1}. ${video.title}`,
                value: `${video.author.name} | ${video.timestamp} | 조회수: ${video.views}회 | [링크](${video.url})`,
              };
            })
        );
    }

    this.myPlaylistMessageEmbed.setTimestamp().setFooter({
      text: "아율봇",
      iconURL:
        "https://github.com/kevin1113-github/auyul-bot/blob/master/auyul-profile.png?raw=true",
    });

    this.selectMyPlaylistMusicMenu = new StringSelectMenuBuilder()
      .setCustomId("selectMyPlaylistMusic" + myPlaylist.id)
      .setPlaceholder("음악을 선택해주세요.")
      .addOptions(
        this.myPlaylist.playlist
          .slice(
            pageIndex * 10,
            Math.min((pageIndex + 1) * 10, myPlaylist.playlist.length)
          )
          .map((video: VideoMetadataResult, index) => {
            return new StringSelectMenuOptionBuilder()
              .setLabel(video.title)
              .setValue(video.videoId);
          })
      )
      // .setDisabled(myPlaylist.playlist.length === 0); // TODO: 해야함.
      .setDisabled(true);
    this.actionRow1 = new ActionRowBuilder().addComponents(
      this.selectMyPlaylistMusicMenu
    ) as ActionRowBuilder<StringSelectMenuBuilder>;

    this.addMyPlaylistMusicButton = new ButtonBuilder()
      .setCustomId("addMyPlaylistMusic" + myPlaylist.id)
      .setLabel("음악 추가")
      .setStyle(ButtonStyle.Success)
      .setEmoji("➕");
    this.deleteMyPlaylistMusicButton = new ButtonBuilder()
      .setCustomId("deleteMyPlaylistMusic" + myPlaylist.id)
      .setLabel("음악 삭제(준비중)")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🗑️")
      // .setDisabled(myPlaylist.playlist.length === 0); // TODO: 해야함.
      .setDisabled(true);
    this.actionRow2 = new ActionRowBuilder().addComponents(
      this.addMyPlaylistMusicButton,
      this.deleteMyPlaylistMusicButton
    ) as ActionRowBuilder<ButtonBuilder>;

    this.prevButton = new ButtonBuilder()
      .setCustomId("prevPage" + pageIndex)
      // .setLabel("이전")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("1256654988277584002")
      .setDisabled(pageIndex === 0);
    this.currentPage = new ButtonBuilder()
      .setCustomId("currentPage" + pageIndex)
      .setLabel(`${pageIndex + 1}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);
    this.nextButton = new ButtonBuilder()
      .setCustomId("nextPage" + pageIndex)
      // .setLabel("다음")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("1256654986176106539")
      .setDisabled((pageIndex + 1) * 10 >= myPlaylist.playlist.length);
    this.actionRow3 = new ActionRowBuilder().addComponents(
      this.prevButton,
      this.currentPage,
      this.nextButton
    ) as ActionRowBuilder<ButtonBuilder>;
  }

  private getComponents() {
    const components = [];
    if (this.selectMyPlaylistMusicMenu.options.length > 0)
      components.push(this.actionRow1);
    components.push(this.actionRow2);
    components.push(this.actionRow3);
    return components;
  }

  public getMessage() {
    return {
      embeds: [this.myPlaylistMessageEmbed],
      components: [...this.getComponents()],
    };
  }
}

export class DeleteConfirmMessage implements MessageInterface {
  private playlist: T_UserPlaylist;
  private deleteConfirmMessageEmbed: EmbedBuilder;
  private actionRow: ActionRowBuilder<ButtonBuilder>;
  private confirmButton: ButtonBuilder;
  private cancelButton: ButtonBuilder;

  constructor(playlist: T_UserPlaylist) {
    this.playlist = playlist;
    this.deleteConfirmMessageEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle(`플레이리스트 삭제`)
      .setDescription(
        `정말로 플레이리스트 '${playlist.name}'을(를) 삭제하시겠습니까?`
      )
      .addFields([
        {
          name: playlist.name,
          value: `${playlist.playlist.length}곡 | 총 ${getTotalDuration(
            playlist
          )}`,
        },
      ]);

    this.confirmButton = new ButtonBuilder()
      .setCustomId("deleteMyPlaylistConfirm" + playlist.id)
      .setLabel("삭제")
      .setStyle(ButtonStyle.Danger);
    this.cancelButton = new ButtonBuilder()
      .setCustomId("deleteMyPlaylistCancel")
      .setLabel("취소")
      .setStyle(ButtonStyle.Secondary);

    const actionRow: ActionRowBuilder<ButtonBuilder> =
      new ActionRowBuilder().addComponents(
        this.confirmButton,
        this.cancelButton
      ) as ActionRowBuilder<ButtonBuilder>;
    this.actionRow = actionRow;
  }

  public getMessage() {
    return {
      embeds: [this.deleteConfirmMessageEmbed],
      components: [this.actionRow],
    };
  }
}

export class EmptyEmbedMessage implements MessageInterface {
  private emptyEmbedMessage: EmbedBuilder;
  private components: ActionRowData<MessageActionRowComponentBuilder>[] | null;

  constructor(message: string, compoenets: ActionRowBuilder[] | null = null) {
    this.emptyEmbedMessage = new EmbedBuilder()
      .setColor("#ccbdb7")
      .setTitle(message);
    this.components = compoenets as
      | ActionRowData<MessageActionRowComponentBuilder>[]
      | null;
  }

  public getMessage() {
    return {
      embeds: [this.emptyEmbedMessage],
      components: this.components ?? [],
    };
  }
}

// // TODO
// export class MyPlaylistMusicMessage implements MessageInterface {
//   private myPlaylist: T_UserPlaylist;
//   private music: VideoMetadataResult;
//   private myPlaylistMusicMessageEmbed: EmbedBuilder;
//   private actionRow: ActionRowBuilder<ButtonBuilder>;
//   private addMyPlaylistMusicButton: ButtonBuilder;

//   constructor(myPlaylist: T_UserPlaylist, music: VideoMetadataResult) {
//     this.myPlaylist = myPlaylist;
//     this.music = music;
//     this.myPlaylistMusicMessageEmbed = new EmbedBuilder()
//       .setColor("#ccbdb7")
//       .setTitle("음악 추가")
//       .setDescription(`플레이리스트 '${myPlaylist.name}'에 '${music.title}'을(를) 추가하시겠습니까?`)
//       .setThumbnail(music.thumbnail)
//       .setTimestamp()
//       .setFooter({
//         text: "아율봇",
//         iconURL:
//         "https://github.com/kevin1113-github/auyul-bot/blob/master/auyul-profile.png?raw=true",
//       });

//     this.addMyPlaylistMusicButton = new ButtonBuilder()
//       .setCustomId("addMyPlaylistMusicConfirm"+myPlaylist.id)
//       .setLabel("추가")
//       .setStyle(ButtonStyle.Success)
//       .setEmoji("➕");
//     this.actionRow = new ActionRowBuilder().addComponents(this.addMyPlaylistMusicButton) as ActionRowBuilder<ButtonBuilder>;
//   }

//   public getMessage() {
//     return {
//       embeds: [this.myPlaylistMusicMessageEmbed],
//       components: [this.actionRow],
//     };
//   }
// }
function getTotalDuration(playlist: T_UserPlaylist) {
  let totalLength = 0;
  for (const music of playlist.playlist) {
    totalLength += music.seconds;
  }
  return `${Math.floor(totalLength / 60)}분 ${totalLength % 60}초`;
}

function getTimeFormat(playingTime: number, endTime: number): string {
  if (endTime < 3600) {
    return `${Math.floor(playingTime / 60)}:${playingTime % 60}`;
  } else {
    const hours: number = Math.floor(playingTime / 3600);
    const minutes: number = Math.floor((playingTime % 3600) / 60);
    const seconds: number = playingTime % 60;
    return `${hours}:${minutes < 10 ? "0" + minutes : minutes}:${
      seconds < 10 ? "0" + seconds : seconds
    }`;
  }
}
