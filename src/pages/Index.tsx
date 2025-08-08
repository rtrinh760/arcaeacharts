import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { songs as allSongs, type Song } from "@/data/songs";

const Index = () => {
  const [query, setQuery] = useState("");
  const [difficultyRange, setDifficultyRange] = useState<[number, number]>([
    1, 12,
  ]);

  useEffect(() => {
    // SEO metadata
    document.title = "Arcaea Charts";
    const desc =
      "Browse Arcaea songs by titles, artists, and difficulty levels.";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", "/");
      document.head.appendChild(link);
    }
  }, []);

  const filtered: Song[] = useMemo(() => {
    const [min, max] = difficultyRange;
    return allSongs.filter((s) => {
      const q = query.toLowerCase();
      const matches =
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.difficulty.toString().includes(q);
      const inRange = s.difficulty >= min && s.difficulty <= max;
      return matches && inRange;
    });
  }, [query, difficultyRange]);

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "RhythmDex Song Index",
      itemListElement: filtered.slice(0, 20).map((s, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "MusicRecording",
          name: s.title,
          byArtist: { "@type": "MusicGroup", name: s.artist },
          image: s.image,
          genre: "Rhythm Game",
          keywords: `difficulty ${s.difficulty}`,
        },
      })),
    }),
    [filtered]
  );

  return (
    <div className="flex flex-col min-h-screen items-center">
      <header className="py-10">
        <div className="flex flex-row items-center justify-center gap-x-4">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight px-10 bg-gradient-primary">
            Arcaea Charts
          </h1>
          <a href="https://ko-fi.com/S6S41JCXEZ" target="_blank" rel="noopener noreferrer">
            <img
              src="https://storage.ko-fi.com/cdn/kofi5.png?v=6"
              alt="Buy Me a Coffee at ko-fi.com"
              className="border-0 h-10"
            />
          </a>
        </div>
      </header>

      <main className="container">
        <section aria-labelledby="filters" className="mb-6">
          <h2 id="filters" className="sr-only">
            Filters
          </h2>
          <div className="grid md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, artist, or difficulty"
                aria-label="Search songs"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Difficulty</span>
                <span>
                  <Badge
                    variant="secondary"
                    aria-label="Current min difficulty"
                  >
                    {difficultyRange[0]}
                  </Badge>
                  <span className="mx-1">–</span>
                  <Badge
                    variant="secondary"
                    aria-label="Current max difficulty"
                  >
                    {difficultyRange[1]}
                  </Badge>
                </span>
              </div>
              <Slider
                value={difficultyRange}
                onValueChange={(val) =>
                  setDifficultyRange([val[0], val[1]] as [number, number])
                }
                min={1}
                max={12}
                step={0.1}
                aria-label="Difficulty range"
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="results">
          <h2 id="results" className="sr-only">
            Results
          </h2>
          <ul className="space-y-3" role="list">
            {filtered.map((song) => (
              <li
                key={song.id}
                className="group p-4 rounded-lg border bg-card hover:border-ring transition-all duration-200"
              >
                <article className="flex items-center gap-4">
                  <img
                    src={song.image}
                    width={80}
                    height={80}
                    loading="lazy"
                    alt={`Cover art: ${song.title} by ${song.artist}`}
                    className="h-20 w-20 rounded-md object-cover ring-1 ring-border group-hover:ring-ring transition"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">
                      {song.title}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {song.artist}
                    </p>
                  </div>
                  <div>
                    <Badge
                      className="select-none"
                      aria-label={`Difficulty ${song.difficulty}`}
                    >
                      {song.difficulty}
                    </Badge>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              No songs match your search.
            </div>
          )}
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <footer className="w-full py-4 mt-auto text-center text-sm text-gray-500">
        Arcaea Charts by Richard Trinh
        <span className="mx-2">·</span>
        <a
          href="https://github.com/rtrinh760/arcaeacharts"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
};

export default Index;
