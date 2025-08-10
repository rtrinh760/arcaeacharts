import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Song {
  id: number;
  imageUrl: string;
  title: string;
  artist: string;
  difficulty: string;
  constant: number;
  level: string;
  version: string;
}

export const getSongs = async (): Promise<Song[]> => {
  let allSongs: Song[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .range(from, from + pageSize - 1)
      .order("title", { ascending: true });

    if (error) {
      console.error("Error fetching songs:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    allSongs = [...allSongs, ...data];

    // if there's less data than pageSize (1000), we've reached the end
    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return allSongs;
};
