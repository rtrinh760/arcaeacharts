# Arcaea Charts

A basic web application for browsing and searching Arcaea charts.

## Features

### **Search & Filtering**
- **Text Search**: Search by song title, artist, or chart constant
- **Difficulty Range**:  Slider for filtering by chart constant (1.0 - 12.0+)
- **Difficulty Types**: Filter by Past, Present, Future, Eternal, and Beyond difficulties

### **Chart View**
- **YouTube Integration**: Each song card includes a "Chart View" button
- **Fullscreen Video Player**: Videos open in a locked fullscreen overlay
- **Auto Search**: Automatically searches for chart view videos using YouTube API

## Technologies
- **Frontend**: React, TypeScript, Tailwind
- **Backend**: Supabase
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rtrinh760/arcaeacharts.git
   cd arcaeacharts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create a .env.local file
   echo "VITE_SUPABASE_URL=your_supabase_project_url" >> .env.local
   echo "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env.local
   
   # Optional: For YouTube chart view videos
   echo "VITE_YOUTUBE_API_KEY=your_youtube_api_key" >> .env.local
   ```
   
   **Note**: The YouTube API key is optional. Without it, the app will show demo videos for chart view functionality.

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

For detailed Supabase setup instructions, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
- Follow TypeScript best practices
- Use existing UI components from shadcn/ui
- Maintain responsive design principles
- Add proper error handling
- Include performance considerations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Arcaea](https://arcaea.lowiro.com/)
- [Arcaea Wiki](https://arcaea.fandom.com/wiki/Arcaea_Wiki)

## Support

If you find this project helpful, consider supporting it:

[![Ko-fi](https://storage.ko-fi.com/cdn/kofi5.png?v=6)](https://ko-fi.com/S6S41JCXEZ)

---

**Made by 8bits** | [Live Demo](https://arcaeacharts.vercel.app) | [Report Issues](https://github.com/rtrinh760/arcaeacharts/issues)
