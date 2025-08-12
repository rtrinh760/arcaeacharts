export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface YouTubeVideoSearchResult {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
  };
}

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

export async function searchChartViewVideos(
  songTitle: string,
  songDifficulty: string
): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn("YouTube API key not configured");
    // Return mock data for development
    return [
      {
        id: "mock1",
        title: `${songTitle} - Chart View`,
        channelTitle: "Chart Player",
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "mock2",
        title: `${songTitle} - Full Combo`,
        channelTitle: "Pro Player",
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "mock3",
        title: `${songTitle} - Perfect Play`,
        channelTitle: "Master Player",
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ];
  }

  try {
    const searchQuery = `${songTitle} ${songDifficulty} chart view`;
    const response = await fetch(
      `${YOUTUBE_API_BASE_URL}/search?` +
        new URLSearchParams({
          part: "snippet",
          q: searchQuery,
          type: "video",
          maxResults: "3",
          key: YOUTUBE_API_KEY,
          order: "relevance",
        })
    );

    if (!response.ok) {
      throw new Error("YouTube API request failed");
    }

    const data = await response.json();

    return data.items.map(
      (item: YouTubeVideoSearchResult): YouTubeVideo => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      })
    );
  } catch (error) {
    console.error("Error searching YouTube videos:", error);
    return [];
  }
}
