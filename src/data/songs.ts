import cover1 from "@/assets/covers/cover-1.jpg";
import cover2 from "@/assets/covers/cover-2.jpg";

export type Song = {
  id: string;
  title: string;
  artist: string;
  difficulty: number; // 1-15 typical rhythm scale
  image: string;
};

export const songs: Song[] = [
  { id: "1", title: "Extradimensional Cosmic Phenomenon", artist: "TAKIO feat. つぐ", difficulty: 11.3, image: cover1 },
  { id: "2", title: "Lilly", artist: "Juggernaut.", difficulty: 10.8, image: cover2 },
];
