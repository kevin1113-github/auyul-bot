import yts from "yt-search";

export async function searchMusic(query: string) {
  const result: yts.SearchResult = await yts(query);
  const returns: yts.VideoSearchResult[] = result.videos.slice(0, 10);
  // console.log(returns);
  return returns;
}

export async function searchMusicById(id: string) {
  const result: yts.VideoMetadataResult = await yts({ videoId: id });
  return result;
}
