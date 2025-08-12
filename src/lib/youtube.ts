export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export async function searchChartViewVideos(
  songTitle: string,
  songDifficulty?: string
): Promise<YouTubeVideo[]> {
  try {
    // calls vercel function
    const params = new URLSearchParams({
      songTitle,
      ...(songDifficulty && { songDifficulty })
    });

    const response = await fetch(`/api/youtube-search?${params}`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const videos: YouTubeVideo[] = await response.json();
    return videos;
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    
    // mock data on error
    return [
      {
        id: 'mock1',
        title: `${songTitle} - Chart View`,
        channelTitle: 'Chart Player',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      },
      {
        id: 'mock2', 
        title: `${songTitle} - Full Combo`,
        channelTitle: 'Pro Player',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      },
      {
        id: 'mock3',
        title: `${songTitle} - Perfect Play`,
        channelTitle: 'Master Player', 
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      }
    ];
  }
}
