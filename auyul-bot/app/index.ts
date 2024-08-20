import dotenv from "dotenv";
dotenv.config();
const TOKEN: string = process.env.TOKEN ?? "";
const CLIENT_ID: string = process.env.CLIENT_ID ?? "";
// console.log(TOKEN, CLIENT_ID);

const DEV_MODE: boolean = process.env.DEV_MODE === "true" ? true : false;

import { __dirname } from "./const.js";

import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  MessageType,
  Events,
  Interaction,
  GuildMember,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ActionRowData,
  StringSelectMenuComponent,
  AnyComponentBuilder,
  APIActionRowComponent,
  APIMessageActionRowComponent,
  APISelectMenuComponent,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  ButtonComponentData,
  ModalBuilder,
  TextInputStyle,
  TextInputBuilder,
  Integration,
  StringSelectMenuInteraction,
  ComponentType,
  TextBasedChannel,
  ChannelType,
  VoiceBasedChannel,
  Message,
  Channel,
  TextChannel,
  GuildChannel,
  GuildChannelCreateOptions,
} from "discord.js";
import {
  getVoiceConnection,
  createAudioPlayer,
  NoSubscriberBehavior,
  createAudioResource,
  StreamType,
  AudioPlayer,
  AudioPlayerStatus,
  VoiceConnection,
  getVoiceConnections,
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
} from "@discordjs/voice";
import { PassThrough } from "stream";

// custom import
import Commands from "./commands.js";
import {
  GetUserPlaylist,
  RegisterUser,
  RegisterUserMsg,
} from "./dbFunction.js";
import { JoinedServer, Servers, Users, UserPlaylist } from "./dbObject.js";
import Action from "./action.js";
import {
  T_DATA,
  T_GuildData,
  T_GuildPlaylist,
  T_UserPlaylist,
} from "./types.js";
import HttpServer from "./api.js";
import { searchMusic, searchMusicById } from "./youtube_music.js";
import yts, { VideoMetadataResult } from "yt-search";
import {
  DeleteConfirmMessage,
  DeleteMusicMessage,
  DeleteMyPlaylistMessage,
  EmptyEmbedMessage,
  MainController,
  MainControllerPlayingMessage,
  MyPlaylistListMessage,
  MyPlaylistMessage,
  PlaylistMessage,
} from "./Messages.js";
import ytdl from "ytdl-core";
import { ytdlAudioResource } from "./ytdl.js";

const guildDataList: T_GuildData[] = [];

// Reloading (/) commands.
const rest = new REST({ version: "10" }).setToken(TOKEN);
try {
  console.log("앱 명령어 새로고침 중...");
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: Commands });
  console.log("앱 명령어 불러오기 성공!");
} catch (error) {
  console.error(error);
}

// When bot is ready.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
let httpServer: HttpServer;
client.once(Events.ClientReady, async () => {
  // TODO: DB 불러오기
  await Servers.sync();
  await Users.sync();
  await JoinedServer.sync();
  await UserPlaylist.sync();

  const servers = await Servers.findAll();

  for (const server of servers) {
    if (DEV_MODE && server.dataValues.id != "1233212899862908938") {
      continue;
    }

    // 메인 메세지 전송
    const commandChannel = (await (
      await client.channels.fetch(server.dataValues.commandChannel)
    )?.fetch()) as TextBasedChannel;
    await clearMessages(commandChannel as TextChannel);
    const mainMessage = await commandChannel.send(MainController);

    const playlist: T_GuildPlaylist[] = [];
    const guildData: T_GuildData = {
      guildId: server.dataValues.id,
      audioPlayer: null,
      action: new Action(),
      playlist: playlist,
      playingIndex: 0,
      playingTime: 0,
      isPlaying: false,
      isRepeat: false,
      timeOut: null,
      mainMessage: mainMessage || null,
    };
    guildDataList.push(guildData);
  }
  httpServer = new HttpServer(client);
  httpServer.start();
  console.log("DEV_MODE: ", DEV_MODE);
  console.log(`${client.user?.tag} 로그인 성공!`);
});

// When bot received interaction.
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.guildId) {
    return;
  }

  // register user
  await RegisterUser(interaction);
  // get nickname
  const NICKNAME: string = getNickName(interaction);

  // get server data
  const server: T_DATA | null = await Servers.findOne({
    where: { id: interaction.guildId },
  });
  if (!server) {
    console.error("서버가 등록되지 않았습니다.");
    return;
  }

  // dev mode
  if (DEV_MODE && server.dataValues.id != "1233212899862908938") {
    return;
  }

  // get guild data
  let guildData: T_GuildData | undefined = guildDataList.find(
    (data) => data.guildId == interaction.guildId
  );
  if (!guildData) {
    guildData = {
      guildId: interaction.guildId,
      audioPlayer: null,
      action: new Action(interaction),
      playlist: [],
      playingIndex: 0,
      playingTime: 0,
      isPlaying: false,
      isRepeat: false,
      timeOut: null,
      mainMessage: null,
    } as T_GuildData;

    guildDataList.push(guildData);
  } else {
    guildData.action.setInteraction(interaction);
  }

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "채널생성") {
      const channelName: string =
        interaction.options.getString("채널이름") || "🎧⋮아율봇-음악채널";
      const newChannel: TextChannel | undefined =
        await interaction.guild?.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
        } as GuildChannelCreateOptions);
      if (!newChannel) {
        await interaction.reply({
          content: `채널 생성에 실패했습니다.`,
          ephemeral: true,
        });
        return;
      }

      await server.update({ commandChannel: newChannel.id });
      await interaction.reply({
        content: `<#${newChannel.id}> 채널이 명령어 채널로 생성되었습니다.`,
        ephemeral: true,
      });
      if (guildData.mainMessage) {
        await guildData.mainMessage.delete();
      }

      // 메인 메세지 전송
      const commandChannel = (await (
        await interaction.guild?.channels.fetch(newChannel.id)
      )?.fetch()) as TextBasedChannel;
      await clearMessages(commandChannel as TextChannel);
      const mainMessage = await commandChannel.send(MainController);
      guildData.mainMessage = mainMessage;

      return;
    }

    if (interaction.commandName === "채널설정") {
      const channel = interaction.options.getChannel("채널");
      if (!channel || channel.type != ChannelType.GuildText) {
        await interaction.reply({
          content: `텍스트 채널을 선택해주세요.`,
          ephemeral: true,
        });
        return;
      }

      await server.update({ commandChannel: channel.id });
      await interaction.reply({
        content: `<#${channel.id}> 채널이 명령어 채널로 설정되었습니다.`,
        ephemeral: true,
      });
      if (guildData.mainMessage) {
        await guildData.mainMessage.delete();
      }

      // 메인 메세지 전송
      const commandChannel = (await (
        await interaction.guild?.channels.fetch(channel.id)
      )?.fetch()) as TextBasedChannel;
      await clearMessages(commandChannel as TextChannel);
      const mainMessage = await commandChannel.send(MainController);
      guildData.mainMessage = mainMessage;

      return;
    }

    if (interaction.commandName === "채널해제") {
      const channelId = server.dataValues.commandChannel;
      if (!channelId) {
        await interaction.reply({
          content: `명령어 채널이 설정되지 않았습니다.`,
          ephemeral: true,
        });
        return;
      }

      await server.update({ commandChannel: null });
      await interaction.reply({
        content: `명령어 채널이 해제되었습니다.`,
        ephemeral: true,
      });
      return;
    }

    // 커맨드 채널이 설정되지 않았을 경우
    if (!server.dataValues.commandChannel) {
      await interaction.reply({
        content: `명령어 채널이 설정되지 않았습니다. 명령어 채널을 설정해주세요.`,
        ephemeral: true,
      });
      return;
    }

    // 커맨드 채널이 아닐 경우
    if (server.dataValues.commandChannel != interaction.channelId) {
      await interaction.reply({
        content: `명령어 채널이 아닙니다. [${
          (
            await interaction.guild?.channels.fetch(
              server.dataValues.commandChannel
            )
          )?.name
        }] 채널에서 사용해주세요.`,
        ephemeral: true,
      });
      return;
    }

    // if (interaction.commandName === "들어와") {
    //   // 새로운 오디오 플레이어로 접속
    //   const audioPlayer = createAudioPlayer({
    //     behaviors: {
    //       noSubscriber: NoSubscriberBehavior.Pause,
    //     },
    //   });
    //   guildData.audioPlayer = audioPlayer;
    //   await guildData.action.joinVoiceChannel(audioPlayer);
    //   return;
    // }

    if (interaction.commandName === "main") {
      // await guildData.mainInteraction?
      await interaction.reply({ content: "메인 메세지 출력", ephemeral: true });
      if (guildData.mainMessage) {
        await guildData.mainMessage.delete();
      }

      // 메인 메세지 전송
      const commandChannel = (await (
        await interaction.guild?.channels.fetch(
          server.dataValues.commandChannel
        )
      )?.fetch()) as TextBasedChannel;
      await clearMessages(commandChannel as TextChannel);
      const mainMessage = await commandChannel.send(MainController);
      guildData.mainMessage = mainMessage;
      return;
    }

    if (interaction.commandName === "나가") {
      guildData.audioPlayer = null;
      await guildData.action.exitVoiceChannel();
      return;
    }

    // if (interaction.commandName === "리모컨") {
    //   let remoteLink: string = "리모컨 웹 페이지 링크: ";
    //   await interaction.reply({ content: remoteLink, ephemeral: true });
    //   return;
    // }

    // if (interaction.commandName === "도움말") {
    //   await interaction.reply({
    //     content: `도움말 준비중입니다.`,
    //     ephemeral: true,
    //   });
    //   return;
    // }

    // if (interaction.commandName === "검색") {
    //   const keyword: string = interaction.options.getString("검색어") || "";
    //   const result = await searchMusic(keyword);
    //   // const result: any = [];
    //   if (result.length == 0) {
    //     await interaction.reply({
    //       content: `검색 결과가 없습니다.`,
    //       ephemeral: true,
    //     });
    //     return;
    //   }

    //   result.forEach(function (v) {
    //     const views = String(v.views).padStart(10, " ");
    //     console.log(
    //       `${views} | ${v.title} (${v.timestamp}) | ${v.author.name}`
    //     );
    //   });

    //   let list = "";
    //   for (let i = 0; i < result.length; i++) {
    //     list += `${i + 1}. ${result[i].title}\n`;
    //   }

    //   const select: StringSelectMenuBuilder = new StringSelectMenuBuilder()
    //     .setCustomId("selectMusic")
    //     .setPlaceholder("선택해주세요.")
    //     .addOptions(
    //       result.map((v, i) => {
    //         return new StringSelectMenuOptionBuilder()
    //           .setLabel(v.title)
    //           .setDescription(v.author.name)
    //           .setValue(i.toString());
    //       })
    //     );

    //   const actionRow: ActionRowBuilder<StringSelectMenuBuilder> =
    //     new ActionRowBuilder().addComponents(
    //       select
    //     ) as ActionRowBuilder<StringSelectMenuBuilder>;
    //   await interaction.reply({
    //     content: `검색 결과\n${list}`,
    //     components: [actionRow],
    //   });
    //   guildData.action.isReplied = true;
    //   return;
    // }

    // if (interaction.commandName === "재생목록") {
    //   await interaction.reply({
    //     ...new PlaylistMessage(
    //       guildData.playlist,
    //       0,
    //       guildData.isPlaying
    //     ).getMessage(),
    //     ephemeral: true,
    //   });

    //   return;
    // }

    // 슬래시 커맨드 사용시 아무 응답을 하지 않았을 경우 오류 응답 처리
    await interaction.reply({
      content: `명령어를 찾을 수 없습니다. 개발자에게 문의해주세요.`,
      ephemeral: true,
    });
    return;
  }

  // 모달 인터렉션
  if (interaction.isModalSubmit()) {
    if (
      interaction.customId === "searchModal" ||
      interaction.customId === "searchAddModal"
    ) {
      const keyword: string =
        interaction.fields.getTextInputValue("searchInput");
      const result: yts.VideoSearchResult[] = await searchMusic(keyword);
      if (result.length == 0) {
        await interaction.reply({
          content: `검색 결과가 없습니다.`,
          ephemeral: true,
        });
        return;
      }

      const musicSelectMenu: StringSelectMenuBuilder =
        new StringSelectMenuBuilder()
          .setCustomId(
            interaction.customId === "searchModal"
              ? "searchMusicSelect"
              : "searchAddMusicSelect"
          )
          .setPlaceholder("선택해주세요.")
          .addOptions(
            result.map((v: yts.VideoSearchResult) => {
              return new StringSelectMenuOptionBuilder()
                .setLabel(v.title.substring(0, 100))
                .setDescription(
                  v.author.name +
                    " | " +
                    v.timestamp +
                    " | 조회수: " +
                    v.views +
                    "회"
                )
                .setValue(v.videoId);
            })
          );

      const musicSelectActionRow: ActionRowBuilder<StringSelectMenuBuilder> =
        new ActionRowBuilder().addComponents(
          musicSelectMenu
        ) as ActionRowBuilder<StringSelectMenuBuilder>;
      await interaction.reply({
        ...new EmptyEmbedMessage(`재생 할 음악을 선택해주세요.`, [
          musicSelectActionRow,
        ]).getMessage(),
        ephemeral: true,
      });

      return;
    }

    if (interaction.customId.startsWith("myPlaylistMusicSearchModal")) {
      const playlistId: string = interaction.customId.substring(26);
      const playlist: T_DATA | null = await UserPlaylist.findOne({
        where: { id: playlistId },
      });

      if (!playlist) {
        if (interaction.isFromMessage()) {
          await interaction.update(
            new EmptyEmbedMessage(
              `플레이리스트를 찾을 수 없습니다.`
            ).getMessage()
          );
        } else {
          await interaction.reply({
            content: `플레이리스트를 찾을 수 없습니다.`,
            ephemeral: true,
          });
        }
        return;
      }

      const keyword: string =
        interaction.fields.getTextInputValue("searchInput");
      const result: yts.VideoSearchResult[] = await searchMusic(keyword);
      if (result.length == 0) {
        if (interaction.isFromMessage()) {
          await interaction.update(
            new EmptyEmbedMessage(`검색 결과가 없습니다.`).getMessage()
          );
        } else {
          await interaction.reply({
            content: `검색 결과가 없습니다.`,
            ephemeral: true,
          });
        }
        return;
      }

      const musicSelectMenu: StringSelectMenuBuilder =
        new StringSelectMenuBuilder()
          .setCustomId("myPlaylistMusicSearchSelect" + playlistId)
          .setPlaceholder("선택해주세요.")
          .addOptions(
            result.map((v: yts.VideoSearchResult) => {
              return new StringSelectMenuOptionBuilder()
                .setLabel(v.title)
                .setDescription(
                  v.author.name +
                    " | " +
                    v.timestamp +
                    " | 조회수: " +
                    v.views +
                    "회"
                )
                .setValue(v.videoId);
            })
          );

      const musicSelectActionRow: ActionRowBuilder<StringSelectMenuBuilder> =
        new ActionRowBuilder().addComponents(
          musicSelectMenu
        ) as ActionRowBuilder<StringSelectMenuBuilder>;

      if (interaction.isFromMessage()) {
        await interaction.update(
          new EmptyEmbedMessage(
            `플레이리스트 '${playlist.dataValues.name}'에 추가 할 음악을 선택해주세요.`,
            [musicSelectActionRow]
          ).getMessage()
        );
      } else {
        await interaction.reply({
          content: `플레이리스트 '${playlist.dataValues.name}'에 추가 할 음악을 선택해주세요.`,
          components: [musicSelectActionRow],
          ephemeral: true,
        });
      }

      return;
    }

    if (interaction.customId === "addMyPlaylistModal") {
      const playlistName: string = interaction.fields.getTextInputValue(
        "myPlaylistNameInput"
      );

      const createdPlaylist = await UserPlaylist.create({
        user_id: interaction.user.id,
        name: playlistName,
        playlist: guildData.playlist.map((v) => v.music),
      });

      if (interaction.isFromMessage()) {
        await interaction.update(
          new EmptyEmbedMessage(
            `플레이리스트 '${playlistName}'이(가) 추가되었습니다.`
          ).getMessage()
        );
      } else {
        await interaction.reply({
          content: `플레이리스트 '${playlistName}'이(가) 추가되었습니다.`,
          ephemeral: true,
        });
      }
      return;
    }
  }

  // 버튼 인터렉션
  if (interaction.isButton()) {
    if (interaction.customId === "playlist") {
      await interaction.reply({
        ...new PlaylistMessage(
          guildData.playlist,
          guildData.playingIndex,
          guildData.isPlaying
        ).getMessage(),
        ephemeral: true,
      });
      return;
    }

    if (interaction.customId === "playPlaylist") {
      await interaction.deferUpdate();
      playMusic(guildData);
      await interaction.deleteReply();
    }

    if (interaction.customId === "myPlaylist") {
      const playlists: T_DATA[] = await UserPlaylist.findAll({
        where: { user_id: interaction.user.id },
      });

      const myPlaylist: T_UserPlaylist[] = [];
      for (const playlist of playlists) {
        myPlaylist.push(await GetUserPlaylist(playlist));
      }

      interaction.reply({
        ...new MyPlaylistListMessage(myPlaylist, 0).getMessage(),
        ephemeral: true,
      });
      return;
    }

    if (interaction.customId === "popular") {
      await interaction.reply({
        content: `인기 차트 버튼 클릭`,
        ephemeral: true,
      });
      return;
    }

    if (interaction.customId === "search") {
      const searchModal = new ModalBuilder()
        .setCustomId("searchModal")
        .setTitle("검색");

      const searchInput: TextInputBuilder = new TextInputBuilder()
        .setCustomId("searchInput")
        .setLabel("검색어를 입력해주세요.")
        .setStyle(TextInputStyle.Short);
      const searchInputActionRow: ActionRowBuilder<TextInputBuilder> =
        new ActionRowBuilder().addComponents(
          searchInput
        ) as ActionRowBuilder<TextInputBuilder>;
      searchModal.addComponents(searchInputActionRow);

      await interaction.showModal(searchModal);
      return;
    }

    if (interaction.customId === "searchAdd") {
      const searchModal = new ModalBuilder()
        .setCustomId("searchAddModal")
        .setTitle("검색");

      const searchInput: TextInputBuilder = new TextInputBuilder()
        .setCustomId("searchInput")
        .setLabel("검색어를 입력해주세요.")
        .setStyle(TextInputStyle.Short);
      const searchInputActionRow: ActionRowBuilder<TextInputBuilder> =
        new ActionRowBuilder().addComponents(
          searchInput
        ) as ActionRowBuilder<TextInputBuilder>;
      searchModal.addComponents(searchInputActionRow);

      await interaction.showModal(searchModal);
      return;
    }

    if (interaction.customId === "selectRecentMusic") {
      await interaction.reply({
        content: `최근 재생 내역 선택`,
        ephemeral: true,
      });
      return;
    }

    if (interaction.customId.startsWith("prevPage")) {
      await interaction.update(
        new PlaylistMessage(
          guildData.playlist,
          guildData.playingIndex,
          guildData.isPlaying,
          parseInt(interaction.customId.substring(8)) - 1
        ).getMessage()
      );

      return;
    }
    if (interaction.customId.startsWith("nextPage")) {
      await interaction.update(
        new PlaylistMessage(
          guildData.playlist,
          guildData.playingIndex,
          guildData.isPlaying,
          parseInt(interaction.customId.substring(8)) + 1
        ).getMessage()
      );
      return;
    }

    if (interaction.customId === "addMyPlaylist") {
      const addMyPlaylistModal = new ModalBuilder()
        .setCustomId("addMyPlaylistModal")
        .setTitle("새로운 내 플레이리스트 추가");

      const myPlaylistNameInput: TextInputBuilder = new TextInputBuilder()
        .setCustomId("myPlaylistNameInput")
        .setLabel("새로운 플레이리스트 이름을 입력해주세요")
        .setStyle(TextInputStyle.Short);
      const addMyPlaylistInputActionRow: ActionRowBuilder<TextInputBuilder> =
        new ActionRowBuilder().addComponents(
          myPlaylistNameInput
        ) as ActionRowBuilder<TextInputBuilder>;
      addMyPlaylistModal.addComponents(addMyPlaylistInputActionRow);

      await interaction.showModal(addMyPlaylistModal);
      return;
    }

    if (interaction.customId === "deleteMyPlaylist") {
      const playlists: T_DATA[] = await UserPlaylist.findAll({
        where: { user_id: interaction.user.id },
      });

      const myPlaylist: T_UserPlaylist[] = [];
      for (const playlist of playlists) {
        myPlaylist.push(await GetUserPlaylist(playlist));
      }

      if (myPlaylist.length == 0) {
        await interaction.update({
          content: `삭제 할 플레이리스트가 없습니다.`,
        });
        return;
      }

      await interaction.update({
        ...new DeleteMyPlaylistMessage(myPlaylist).getMessage(),
      });
      return;
    }

    if (interaction.customId.startsWith("deleteMyPlaylistConfirm")) {
      const playlistId: string = interaction.customId.substring(23);
      const playlist: T_DATA | null = await UserPlaylist.findOne({
        where: { id: playlistId },
      });

      if (!playlist) {
        await interaction.update(
          new EmptyEmbedMessage(`플레이리스트를 찾을 수 없습니다.`).getMessage()
        );
        return;
      }

      await playlist.destroy();
      await interaction.update(
        new EmptyEmbedMessage(`플레이리스트가 삭제되었습니다.`).getMessage()
      );
      return;
    }

    if (interaction.customId === "deleteMyPlaylistCancel") {
      await interaction.update(
        new EmptyEmbedMessage(
          `플레이리스트 삭제를 취소하였습니다.`
        ).getMessage()
      );
      return;
    }

    if (interaction.customId.startsWith("addMyPlaylistMusic")) {
      const playlistId: string = interaction.customId.substring(18);
      const playlist: T_DATA | null = await UserPlaylist.findOne({
        where: { id: playlistId },
      });

      if (!playlist) {
        await interaction.update(
          new EmptyEmbedMessage(`플레이리스트를 찾을 수 없습니다.`).getMessage()
        );
        return;
      }

      const searchModal = new ModalBuilder()
        .setCustomId("myPlaylistMusicSearchModal" + playlistId)
        .setTitle("검색");

      const searchInput: TextInputBuilder = new TextInputBuilder()
        .setCustomId("searchInput")
        .setLabel("검색어를 입력해주세요.")
        .setStyle(TextInputStyle.Short);
      const searchInputActionRow: ActionRowBuilder<TextInputBuilder> =
        new ActionRowBuilder().addComponents(
          searchInput
        ) as ActionRowBuilder<TextInputBuilder>;
      searchModal.addComponents(searchInputActionRow);

      await interaction.showModal(searchModal);
      return;
    }

    // 플레이어 컨트롤러
    if (interaction.customId === "repeatMusic") {
      await interaction.deferUpdate();

      guildData.isRepeat = true;
      guildData.mainMessage?.edit(
        new MainControllerPlayingMessage(
          guildData.playlist,
          guildData.playingIndex,
          guildData.playingTime,
          guildData.isPlaying,
          guildData.isRepeat
        ).getMessage()
      );
      return;
    }

    if (interaction.customId === "resumeMusic") {
      await interaction.deferUpdate();

      guildData.isRepeat = false;
      guildData.mainMessage?.edit(
        new MainControllerPlayingMessage(
          guildData.playlist,
          guildData.playingIndex,
          guildData.playingTime,
          guildData.isPlaying,
          guildData.isRepeat
        ).getMessage()
      );
      return;
    }

    if (interaction.customId === "stopMusic") {
      await interaction.deferUpdate();

      guildData.audioPlayer?.stop();
      guildData.isPlaying = false;
      guildData.playingIndex = 0;
      guildData.playingTime = 0;
      guildData.audioPlayer = null;
      guildData.mainMessage?.edit(MainController);
      const voiceConnection: VoiceConnection | undefined = getVoiceConnection(
        guildData.guildId
      );
      if (voiceConnection) {
        voiceConnection.destroy();
      }
      if (guildData.timeOut) {
        clearInterval(guildData.timeOut);
      }
      return;
    }

    if (interaction.customId === "pauseMusic") {
      await interaction.deferUpdate();

      guildData.audioPlayer?.pause();
      guildData.isPlaying = false;
      guildData.mainMessage?.edit(
        new MainControllerPlayingMessage(
          guildData.playlist,
          guildData.playingIndex,
          guildData.playingTime,
          guildData.isPlaying,
          guildData.isRepeat
        ).getMessage()
      );
      return;
    }

    if (interaction.customId === "playMusic") {
      await interaction.deferUpdate();

      guildData.audioPlayer?.unpause();
      guildData.isPlaying = true;
      guildData.mainMessage?.edit(
        new MainControllerPlayingMessage(
          guildData.playlist,
          guildData.playingIndex,
          guildData.playingTime,
          guildData.isPlaying,
          guildData.isRepeat
        ).getMessage()
      );
      return;
    }

    if (interaction.customId === "prevMusic") {
      await interaction.deferUpdate();

      if (guildData.playingIndex > 0) {
        guildData.playingIndex -= 1;
        const resource = ytdlAudioResource(
          guildData.playlist[guildData.playingIndex].music.url
        );
        guildData.audioPlayer?.play(resource);
        guildData.isPlaying = true;
        guildData.playingTime = 0;
        guildData.mainMessage?.edit(
          new MainControllerPlayingMessage(
            guildData.playlist,
            guildData.playingIndex,
            guildData.playingTime,
            guildData.isPlaying,
            guildData.isRepeat
          ).getMessage()
        );
      }
      return;
    }

    if (interaction.customId === "nextMusic") {
      await interaction.deferUpdate();

      if (guildData.playingIndex < guildData.playlist.length - 1) {
        guildData.playingIndex += 1;
        const resource = ytdlAudioResource(
          guildData.playlist[guildData.playingIndex].music.url
        );
        guildData.audioPlayer?.play(resource);
        guildData.isPlaying = true;
        guildData.playingTime = 0;
        guildData.mainMessage?.edit(
          new MainControllerPlayingMessage(
            guildData.playlist,
            guildData.playingIndex,
            guildData.playingTime,
            guildData.isPlaying,
            guildData.isRepeat
          ).getMessage()
        );
      }
      return;
    }

    if (interaction.customId === "deleteMusicInPlaylist") {
      await interaction.update(
        new DeleteMusicMessage(guildData.playlist).getMessage()
      );
    }
  }

  // 셀렉트 메뉴 인터렉션
  if (interaction.isStringSelectMenu()) {
    if (
      interaction.customId === "searchMusicSelect" ||
      interaction.customId === "searchAddMusicSelect"
    ) {
      const videoId: string = interaction.values[0];
      const video: yts.VideoMetadataResult = await searchMusicById(videoId);
      console.log(video);

      if (interaction.customId === "searchMusicSelect") {
        guildData.playlist.unshift({
          music: video,
          play_user: interaction.user,
        });
      } else {
        guildData.playlist.push({
          music: video,
          play_user: interaction.user,
        });
      }

      await interaction.deferUpdate();
      await interaction.deleteReply();

      return;
    }

    if (interaction.customId.startsWith("myPlaylistMusicSearchSelect")) {
      const playlistId: string = interaction.customId.substring(27);
      const playlist: T_DATA | null = await UserPlaylist.findOne({
        where: { id: playlistId },
      });

      if (!playlist) {
        await interaction.update(
          new EmptyEmbedMessage(`플레이리스트를 찾을 수 없습니다.`).getMessage()
        );
        return;
      }

      const videoId: string = interaction.values[0];
      const video: yts.VideoMetadataResult = await yts({ videoId: videoId });
      await interaction.update(
        new EmptyEmbedMessage(
          `플레이리스트 '${playlist.dataValues.name}'에 추가한 음악: ${video.url}`
        ).getMessage()
      );

      await playlist.update({
        playlist: [...playlist.dataValues.playlist, video],
      });
      return;
    }

    if (interaction.customId === "selectMyPlaylist") {
      const playlistId: string = interaction.values[0];
      const playlist: T_DATA | null = await UserPlaylist.findOne({
        where: { id: playlistId },
      });

      if (!playlist) {
        await interaction.update(
          new EmptyEmbedMessage(`플레이리스트를 찾을 수 없습니다.`).getMessage()
        );
        return;
      }

      await interaction.update({
        ...new MyPlaylistMessage(
          await GetUserPlaylist(playlist),
          0
        ).getMessage(),
      });
      return;
    }

    if (interaction.customId === "deleteMyPlaylist") {
      const playlistId: string = interaction.values[0];
      const playlist: T_DATA | null = await UserPlaylist.findOne({
        where: { id: playlistId },
      });

      if (!playlist) {
        await interaction.update(
          new EmptyEmbedMessage(`플레이리스트를 찾을 수 없습니다.`).getMessage()
        );
        return;
      }

      await interaction.update({
        ...new DeleteConfirmMessage(
          await GetUserPlaylist(playlist)
        ).getMessage(),
      });
      return;
    }

    if (interaction.customId === "deleteMusic") {
      await interaction.deferUpdate();
      await interaction.deleteReply();

      const index: number = parseInt(interaction.values[0]);

      // if (guildData.playlist.length == 0 && index == 0) {

      // }

      if (guildData.playingIndex == index) {
        if (guildData.isPlaying) {
          playNext(guildData);
        }
      }
      if (guildData.playingIndex > index) {
        guildData.playingIndex -= 1;
      }
      guildData.playlist.splice(index, 1);
    }
  }
});

// When bot received message.
client.on(Events.MessageCreate, async (message) => {
  if (!message.guildId) {
    return;
  }

  // get server data
  const server: T_DATA | null = await Servers.findOne({
    where: { id: message.guildId },
  });
  if (!server) {
    console.error("서버가 등록되지 않았습니다.");
    return;
  }

  // dev mode
  if (DEV_MODE && server.dataValues.id != "1233212899862908938") {
    return;
  }

  // get guild data
  let guildData: T_GuildData | undefined = guildDataList.find(
    (data) => data.guildId == message.guildId
  );
  if (!guildData) {
    guildData = {
      guildId: message.guildId,
      audioPlayer: null,
      action: new Action(),
      playlist: [],
      playingIndex: 0,
      playingTime: 0,
      isPlaying: false,
      isRepeat: false,
      timeOut: null,
      mainMessage: null,
    } as T_GuildData;

    guildDataList.push(guildData);
  }

  if (message.author.bot) {
    return;
  }

  if (message.channelId != server.dataValues.commandChannel) {
    return;
  }

  guildData.action.setInteraction(message);

  // delete message
  await message.delete();

  // search music
  const keyword: string = message.content;
  const result: yts.VideoSearchResult = (await searchMusic(keyword))[0];
  const video: yts.VideoMetadataResult = await yts({ videoId: result.videoId });

  // add music to playlist
  guildData.playlist.push({
    music: video,
    play_user: message.author,
  });

  // // join voice channel
  // if (!guildData.audioPlayer) {
  //   const audioPlayer = createAudioPlayer({
  //     behaviors: {
  //       noSubscriber: NoSubscriberBehavior.Pause,
  //     },
  //   });
  //   guildData.audioPlayer = audioPlayer;
  //   await guildData.action.joinVoiceChannel(audioPlayer);
  // }

  // play music
  if (!guildData.isPlaying) {
    playMusic(guildData, guildData.playlist.length - 1);
  }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (!oldState.guild) {
    return;
  }
  const connection: VoiceConnection | undefined = getVoiceConnection(
    oldState.guild.id
  );
  if (!connection) {
    return;
  }

  // 사용자가 음성 채널을 떠났을 때
  if (oldState.channelId && !newState.channelId) {
    const channel = oldState.channel;
    if (!channel || channel.id != connection.joinConfig.channelId) {
      return;
    }

    if (channel) {
      const nonBotMembers = channel.members.filter(
        (member) => !member.user.bot
      );

      // 음성 채널에 남은 사람이 없는지 확인
      if (nonBotMembers.size === 0) {
        // 음성 채널에서 봇을 나가게 합니다.
        connection.destroy();
        const guildData: T_GuildData | undefined = guildDataList.find(
          (data) => data.guildId == oldState.guild?.id
        );
        if (!guildData) {
          return;
        }
        guildData.audioPlayer = null;
        guildData.isPlaying = false;
        guildData.playingIndex = 0;
        guildData.playingTime = 0;
        guildData.mainMessage?.edit(MainController);
        if (guildData.timeOut) {
          clearInterval(guildData.timeOut);
        }
      }
    }
  }
});

client.login(TOKEN);

function getNickName(interaction: Interaction): string {
  const name: string = interaction.user.globalName || interaction.user.username;
  return interaction.member instanceof GuildMember
    ? interaction.member.nickname || name
    : name;
}

function eventify_push(list: any[], callback: Function) {
  list.push = function (item: any): number {
    const number = Array.prototype.push.call(list, item);
    callback(list, item);
    return number;
  };
}

function eventify_unshift(list: any[], callback: Function) {
  list.unshift = function (item: any): number {
    const number = Array.prototype.unshift.call(list, item);
    callback(list, item);
    return number;
  };
}

// guildDataList에 서버가 추가될 때마다 실행
eventify_push(guildDataList, (list: T_GuildData[], guildData: T_GuildData) => {
  // 플레이리스트 앞에 음악이 추가될 때마다 실행
  eventify_unshift(
    guildData.playlist,
    (list: T_GuildPlaylist[], music: T_GuildPlaylist) => {
      playMusic(guildData);
    }
  );

  // 플레이리스트 뒤에 음악이 추가될 때마다 실행
  eventify_push(
    guildData.playlist,
    (list: T_GuildPlaylist[], music: T_GuildPlaylist) => {
      if (guildData.isPlaying) {
        guildData.mainMessage?.edit(
          new MainControllerPlayingMessage(
            guildData.playlist,
            guildData.playingIndex,
            guildData.playingTime,
            guildData.isPlaying,
            guildData.isRepeat
          ).getMessage()
        );
      }
    }
  );
});

// playlist 재생
function playMusic(guildData: T_GuildData, index: number = 0) {
  if (guildData.playlist.length > 0) {
    // play added music which is first music
    const audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });
    audioPlayer.on("error", (error) => {
      // console.error("Error:", error.message);
      console.log("Error");
      console.error("Error:", error);
      console.error("AudioResource:", error.resource);
      // 추가적인 오류 처리 로직
      audioPlayer.stop();
      guildData.isPlaying = false;
      guildData.playingIndex = 0;
      guildData.playingTime = 0;
      guildData.audioPlayer = null;
      guildData.mainMessage?.edit(MainController);
      const voiceConnection: VoiceConnection | undefined = getVoiceConnection(
        guildData.guildId
      );
      if (voiceConnection) {
	console.log("음악 재생이 종료되었습니다.");
        voiceConnection.destroy();
      }
      if (guildData.timeOut) {
        clearInterval(guildData.timeOut);
      }
    });
    guildData.audioPlayer = audioPlayer;
    const voiceChannel: VoiceBasedChannel | null = (
      guildData.action.interaction?.member as GuildMember
    ).voice.channel;
    // 음성 채널에 접속되어 있지 않을 경우
    // 재생하지 않고 플리에 추가만 함
    if (!voiceChannel || !guildData.mainMessage) {
      return;
    }
    const voiceConnection: VoiceConnection | undefined = getVoiceConnection(
      guildData.guildId
    );
    if (
      !voiceConnection ||
      voiceConnection.joinConfig.channelId != voiceChannel.id
    ) {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: false,
      });
      connection.on(
        VoiceConnectionStatus.Disconnected,
        async (oldState, newState) => {
          try {
            await Promise.race([
              entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
              entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
            // 연결이 복구됨
          } catch (error) {
            console.log("Reconnecting failed:", error);
            connection.destroy();
          }
        }
      );
      connection.subscribe(audioPlayer);
    }
    const resource = ytdlAudioResource(guildData.playlist[index].music.url);
    guildData.audioPlayer.play(resource);
    
    /*
    if (guildData.audioPlayer.checkPlayable() == false) {
      console.log("재생할 수 없는 음악입니다.");
      guildData.playlist.splice(index, 1);
      audioPlayer.stop();
      audioPlayer.state.status = AudioPlayerStatus.Idle;
      getVoiceConnection(guildData.guildId)?.destroy();
      return;
    }
    */
    
    guildData.isPlaying = true;
    guildData.playingIndex = index;
    guildData.playingTime = 0;

    guildData.mainMessage.edit(
      new MainControllerPlayingMessage(
        guildData.playlist,
        guildData.playingIndex,
        guildData.playingTime,
        guildData.isPlaying,
        guildData.isRepeat
      ).getMessage()
    );

    const timeOut: NodeJS.Timeout = setInterval(() => {
      if (!guildData.isPlaying) {
        return;
      }
      guildData.playingTime += 1;
      if (guildData.playingTime % 5 == 0) {
        guildData.mainMessage?.edit(
          new MainControllerPlayingMessage(
            guildData.playlist,
            guildData.playingIndex,
            guildData.playingTime,
            guildData.isPlaying,
            guildData.isRepeat
          ).getMessage()
        );
      }

      // 음악이 끝나면 다음 음악을 재생
      if (
        guildData.playingTime >=
        guildData.playlist[guildData.playingIndex].music.duration.seconds
      ) {
	console.log(guildData.playingTime, guildData.playlist[guildData.playingIndex].music.duration.seconds);
        playNext(guildData);
      }
    }, 1000);
    guildData.timeOut = timeOut;
  }
}

function playNext(guildData: T_GuildData) {
  guildData.playingTime = 0;

  // 반복 재생일 경우
  if (guildData.isRepeat) {
    const resource = ytdlAudioResource(
      guildData.playlist[guildData.playingIndex].music.url
    );
    guildData.audioPlayer?.play(resource);
  }
  // 반복 재생이 아니고 마지막 음악이 아닐 경우
  else if (guildData.playingIndex + 1 < guildData.playlist.length) {
    guildData.playingIndex += 1;
    const resource = ytdlAudioResource(
      guildData.playlist[guildData.playingIndex].music.url
    );
    guildData.audioPlayer?.play(resource);
  }
  // 반복 재생이 아니고 마지막 음악일 경우
  else {
    if (guildData.timeOut) {
      clearInterval(guildData.timeOut);
    }
    guildData.isPlaying = false;
    guildData.playingIndex = 0;
    guildData.playingTime = 0;
    guildData.audioPlayer?.stop();
    guildData.mainMessage?.edit(MainController);
    console.log("모든 음악이 끝나 음악 재생이 종료되었습니다.");
    getVoiceConnection(guildData.guildId)?.destroy();
  }
}

// async function clearMessages(channel: TextChannel) {
//   let fetchedMessages;
//   do {
//     fetchedMessages = await channel.messages.fetch({ limit: 100 });
//     await channel.bulkDelete(fetchedMessages);
//   } while (fetchedMessages.size >= 2);
// }
async function clearMessages(channel: TextChannel) {
  let fetchedMessages;
  do {
    fetchedMessages = await channel.messages.fetch({ limit: 100 });
    const messagesToDelete = fetchedMessages.filter(
      (msg) => Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
    );
    const messagesToDeleteIndividually = fetchedMessages.filter(
      (msg) => Date.now() - msg.createdTimestamp >= 14 * 24 * 60 * 60 * 1000
    );

    // Bulk delete messages that are less than 14 days old
    if (messagesToDelete.size > 0) {
      await channel.bulkDelete(messagesToDelete);
    }

    // Individually delete messages that are 14 days or older
    for (const [id, msg] of messagesToDeleteIndividually) {
      try {
        await msg.delete();
      } catch (error) {
        console.error(`Failed to delete message ${id}:`, error);
      }
    }
  } while (fetchedMessages.size >= 2);
}

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});




