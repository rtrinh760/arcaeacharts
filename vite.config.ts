import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

interface YouTubeAPIResponse {
  items: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      channelTitle: string;
      thumbnails: { medium: { url: string } };
    };
  }>;
}

// API plugin for development
function apiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/youtube-search', async (req, res) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const url = new URL(req.url!, `http://${req.headers.host}`);
        const songTitle = url.searchParams.get('songTitle');
        const songDifficulty = url.searchParams.get('songDifficulty');

        if (!songTitle) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'songTitle parameter is required' }));
          return;
        }

        const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY;
        
        if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
          console.warn('YouTube API key not configured, returning mock data');
          // Return mock data for development
          const mockVideos = [
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
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(mockVideos));
          return;
        }

        try {
          console.log(`Using YouTube API key: ${YOUTUBE_API_KEY.substring(0, 10)}...`);
          const searchQuery = `${songTitle} ${songDifficulty || ''} chart view`.trim();
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?` +
            new URLSearchParams({
              part: 'snippet',
              q: searchQuery,
              type: 'video',
              maxResults: '3',
              key: YOUTUBE_API_KEY,
              order: 'relevance'
            })
          );

          if (!response.ok) {
            throw new Error(`YouTube API request failed: ${response.status}`);
          }

          const data = await response.json() as YouTubeAPIResponse;
          
          const videos = data.items.map((item) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnailUrl: item.snippet.thumbnails.medium.url,
            videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`
          }));

          console.log(`Found ${videos.length} YouTube videos for "${searchQuery}"`);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(videos));
        } catch (error) {
          console.error('Error searching YouTube videos:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to search YouTube videos' }));
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react(), tailwindcss(), apiPlugin(env)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
    }
  }
})
