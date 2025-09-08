import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSongs, type Song } from "@/lib/supabase";
import { searchChartViewVideos, type YouTubeVideo } from "@/lib/youtube";
import { VideoOverlay } from "@/components/VideoOverlay";

const Index = () => {
  const [query, setQuery] = useState("");
  const [difficultyRange, setDifficultyRange] = useState<[number, number]>([
    1, 12,
  ]);
  const [debouncedDifficultyRange, setDebouncedDifficultyRange] = useState<
    [number, number]
  >([1, 12]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    []
  );
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<"title" | "artist" | "constant">(
    "constant"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoCache, setVideoCache] = useState<Map<string, YouTubeVideo[]>>(
    new Map()
  );

  const [targetRatings, setTargetRatings] = useState<Map<string, string>>(new Map());
  const difficultyTypes = ["Past", "Present", "Future", "Eternal", "Beyond"];





  const calculateRequiredScore = (constant: number, targetRating: number): number => {
    const requiredModifier = targetRating - constant;
    
    if (requiredModifier >= 2.0) {
      return 10000000;
    }
    
    if (requiredModifier >= 1.0) {
      return Math.round(9800000 + (requiredModifier - 1.0) * 200000);
    }
    
    const calculatedScore = Math.round(9500000 + requiredModifier * 300000);
    
    return Math.max(0, Math.min(9800000, calculatedScore));
  };





  const getTargetRating = (songTitle: string, difficulty: string): string => {
    const key = `${songTitle}-${difficulty}`;
    return targetRatings.get(key) || "";
  };

  const updateTargetRating = (songTitle: string, difficulty: string, rating: string) => {
    const key = `${songTitle}-${difficulty}`;
    setTargetRatings(prev => new Map(prev).set(key, rating));
  };



  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case "Past":
        return "#4caed1";
      case "Present":
        return "#8fad4c";
      case "Future":
        return "#822c68";
      case "Eternal":
        return "#8571a3";
      case "Beyond":
        return "#b5112e";
      default:
        return "#64748b";
    }
  };

  const toggleDifficulty = (difficulty: string) => {
    setSelectedDifficulties(
      (
        prev // current selected difficulties
      ) =>
        prev.includes(difficulty)
          ? prev.filter((d) => d !== difficulty) // remove if already selected
          : [...prev, difficulty] // add if not selected
    );
  };

  const handleChartView = async (songTitle: string, songDifficulty: string) => {
    let videos = videoCache.get(songTitle);

    if (!videos) {
      videos = await searchChartViewVideos(songTitle, songDifficulty);
      setVideoCache((prev) => new Map(prev).set(songTitle, videos || []));
    }

    if (videos && videos.length > 0) {
      // Use the first (most relevant) video
      setSelectedVideo(videos[0].id);
    }
  };

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

    const loadSongs = async () => {
      try {
        setLoading(true);
        setError(null);
        const songs = await getSongs();
        setAllSongs(songs);
      } catch (err) {
        console.error("Error loading songs:", err);
        setError("Failed to load songs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadSongs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDifficultyRange(difficultyRange);
    }, 150);

    return () => clearTimeout(timer);
  }, [difficultyRange]);

  const processedSongs = useMemo(() => {
    return allSongs.map((song) => ({
      ...song,
      searchText:
        `${song.title} ${song.artist} ${song.constant} ${song.level}`.toLowerCase(),
    }));
  }, [allSongs]);

  const filtered: Song[] = useMemo(() => {
    const [min, max] = debouncedDifficultyRange;
    const q = query.toLowerCase();

    return processedSongs.filter((s) => {
      const matches = !q || s.searchText.includes(q);
      const inRange = s.constant >= min && s.constant <= max;
      const difficultyMatch =
        selectedDifficulties.length === 0 ||
        selectedDifficulties.includes(s.difficulty);
      return matches && inRange && difficultyMatch;
    });
  }, [query, debouncedDifficultyRange, selectedDifficulties, processedSongs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, debouncedDifficultyRange, selectedDifficulties]);

  // Sort filtered songs
  const sortedSongs = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "constant":
          aValue = a.constant;
          bValue = b.constant;
          break;
        case "title":
          aValue = a[sortBy].toLowerCase();
          bValue = b[sortBy].toLowerCase();
          break;
        case "artist":
        default:
          aValue = a[sortBy].toLowerCase();
          bValue = b[sortBy].toLowerCase();
          break;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    return sorted;
  }, [filtered, sortBy, sortOrder]);

  const paginatedSongs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedSongs.slice(startIndex, endIndex);
  }, [sortedSongs, currentPage, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageSizeOptions = [10, 25, 50, 100];

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Arcaea Song Chart Index",
      itemListElement: filtered.slice(0, 20).map((s, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "MusicRecording",
          name: s.title,
          byArtist: { "@type": "MusicGroup", name: s.artist },
          image: s.imageUrl,
          genre: "Rhythm Game",
          keywords: `difficulty ${s.difficulty}, constant ${s.constant}, level ${s.level}, version ${s.version}`,
        },
      })),
    }),
    [filtered]
  );

  return (
    <div className="flex flex-col min-h-screen items-center">
      <header className="py-10">
        <div className="flex flex-row items-center justify-center gap-x-4">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#4e356f]">
              Arcaea Charts
            </h1>
            <img
              src="/logo.jpg"
              alt="Game Logo"
              className="h-16 md:h-20 w-auto object-contain"
            />
          </div>
        </div>
      </header>
      <main className="container px-4 lg:px-0">
        <section aria-labelledby="filters" className="mb-6">
          <h2 id="filters" className="sr-only">
            Filters
          </h2>
          <div className="space-y-4">
            {/* Search Bar - Full Width */}
            <div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, artist, or constant"
                aria-label="Search songs"
              />
            </div>

            {/* Sort and Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 width:75%">
              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground mr-1 sm:mr-0">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "title" | "artist" | "constant")
                  }
                  className="text-xs px-2 py-1 border border-input bg-background rounded-md text-foreground"
                >
                  <option value="title">Title</option>
                  <option value="artist">Artist</option>
                  <option value="constant">Constant</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="text-xs px-2 py-1 h-auto min-w-[32px]"
                  title={
                    sortOrder === "asc" ? "Sort Ascending" : "Sort Descending"
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Filter:</span>
                {difficultyTypes.map((difficulty) => (
                  <Button
                    key={difficulty}
                    variant={
                      selectedDifficulties.includes(difficulty)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleDifficulty(difficulty)}
                    className="text-xs border-2"
                    style={{
                      backgroundColor: selectedDifficulties.includes(difficulty)
                        ? getDifficultyColor(difficulty)
                        : "transparent",
                      borderColor: getDifficultyColor(difficulty),
                      color: selectedDifficulties.includes(difficulty)
                        ? "white"
                        : getDifficultyColor(difficulty),
                    }}
                  >
                    {difficulty === "Eternal"
                      ? "ETR"
                      : difficulty === "Beyond"
                      ? "BYD"
                      : difficulty === "Past"
                      ? "PST"
                      : difficulty === "Present"
                      ? "PRS"
                      : difficulty === "Future"
                      ? "FTR"
                      : difficulty.slice(0, 3).toUpperCase()}
                  </Button>
                ))}
              </div>

              {/* Difficulty Range Slider - Visible on large screens */}
              <div className="hidden lg:flex lg:items-center lg:gap-4 lg:flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Difficulty:
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="secondary"
                      aria-label="Current min difficulty"
                    >
                      {difficultyRange[0]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">–</span>
                    <Badge
                      variant="secondary"
                      aria-label="Current max difficulty"
                    >
                      {difficultyRange[1]}
                    </Badge>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
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
            </div>

            {/* Difficulty Range Slider - Below on smaller screens */}
            <div className="space-y-2 lg:hidden">
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
          {loading && (
            <div className="text-center py-16 text-muted-foreground">
              Loading songs...
            </div>
          )}
          {error && (
            <div className="text-center py-16 text-red-500">{error}</div>
          )}
          {!loading && !error && (
            <>
              <ul className="space-y-3" role="list">
                {paginatedSongs.map((song, index) => (
                  <li
                    key={`${song.title}-${song.difficulty}-${song.version}-${index}`}
                    className="group p-4 rounded-lg border bg-card hover:border-ring transition-all duration-200"
                  >
                    <article className="flex items-center gap-4">
                      {/* Left Section: Image + Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <img
                          src={`https://corsproxy.io/?${encodeURIComponent(
                            song.imageUrl
                          )}`}
                          width={80}
                          height={80}
                          loading="lazy"
                          alt={`Cover art: ${song.title} by ${song.artist}`}
                          className="h-20 w-20 rounded-md object-cover ring-1 ring-border group-hover:ring-ring transition"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-semibold truncate">
                            {song.title}
                          </h3>
                          <p className="text-sm md:text-md text-muted-foreground truncate">
                            {song.artist}
                          </p>
                          <div className="text-xs md:text-sm text-muted-foreground">
                            {song.version} •{" "}
                            <span
                              style={{
                                color: getDifficultyColor(song.difficulty),
                                fontWeight: "600",
                              }}
                            >
                              {song.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Center Section: Play Rating Input */}
                      <div className="flex flex-col items-center gap-2 min-w-[240px] md:min-w-[300px] max-w-[400px] flex-1">
                        {/* Play Rating Input (shows on hover) */}
                        <div className="w-full max-w-[320px] group relative">
                          {/* Hover overlay with input and play rating */}
                          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center p-2 z-10">
                            {/* Spacer to center input when no value */}
                            {!getTargetRating(song.title, song.difficulty) && <div className="flex-1"></div>}
                            
                            <div className="w-full">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter play rating"
                                value={getTargetRating(song.title, song.difficulty)}
                                onChange={(e) => updateTargetRating(song.title, song.difficulty, e.target.value)}
                                className="w-full text-center text-sm h-8"
                              />
                            </div>
                            
                            {/* Show required score or spacer */}
                            <div className="w-full h-6 mt-2">
                              {getTargetRating(song.title, song.difficulty) && (
                                <div className="text-xs font-medium text-green-700 px-2 py-1 bg-green-50 border border-green-200 rounded text-center w-full">
                                  Required: {calculateRequiredScore(song.constant, parseFloat(getTargetRating(song.title, song.difficulty)) || 0).toLocaleString()}
                                </div>
                              )}
                            </div>
                            
                            {/* Spacer to center input when no value */}
                            {!getTargetRating(song.title, song.difficulty) && <div className="flex-1"></div>}
                          </div>
                          
                          {/* Empty hover area */}
                          <div className="h-24 cursor-pointer"></div>
                        </div>
                      </div>

                      {/* Right Section: Level, Constant, Chart View */}
                      <div className="flex flex-col items-end gap-2 min-w-[140px] md:min-w-[160px]">
                        <Badge
                          className="select-none h-6 md:h-8 w-full justify-center text-xs md:text-sm font-medium font-mono border-2"
                          style={{
                            backgroundColor: "#4e356f",
                            borderColor: "#4e356f",
                            color: "#ffffff",
                          }}
                          aria-label={`Level ${song.level}`}
                        >
                          {"Level:    " + song.level}
                        </Badge>
                        <Badge
                          className="select-none h-6 md:h-8 w-full justify-center text-xs md:text-sm font-medium font-mono border-2"
                          style={{
                            backgroundColor: "#f9fafb",
                            borderColor: "#4e356f",
                            color: "#111827",
                          }}
                          aria-label={`Constant ${song.constant}`}
                        >
                          {"Constant: " + song.constant}
                        </Badge>

                        <Button
                          onClick={() =>
                            handleChartView(song.title, song.difficulty)
                          }
                          variant="outline"
                          size="sm"
                          className="text-xs font-medium bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 text-red-700 w-full justify-center"
                        >
                          Chart View
                        </Button>
                      </div>
                    </article>
                  </li>
                ))}

                {filtered.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    No songs match your search.
                  </div>
                )}
              </ul>

              {/* Pagination Controls */}
              {filtered.length > 0 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Results info */}
                  <div className="text-sm text-muted-foreground">
                    {Math.min(
                      (currentPage - 1) * pageSize + 1,
                      filtered.length
                    )}
                    -{Math.min(currentPage * pageSize, filtered.length)} of{" "}
                    {filtered.length} songs
                  </div>

                  {/* Page size selector */}
                  <div className="flex items-center gap-2">
                    {pageSizeOptions.map((size) => (
                      <Button
                        key={size}
                        variant={pageSize === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setPageSize(size);
                          setCurrentPage(1);
                        }}
                        className="text-xs"
                      >
                        {size}
                      </Button>
                    ))}
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    <span className="text-sm text-muted-foreground">
                      {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <footer className="w-full py-8 mt-auto text-center text-md text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-row items-center gap-2">
            Arcaea Charts by 8bits
            <span>·</span>
            <a
              href="https://github.com/rtrinh760/arcaeacharts"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700 mr-2"
            >
              GitHub
            </a>
            <a
              href="https://ko-fi.com/S6S41JCXEZ"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://storage.ko-fi.com/cdn/kofi5.png?v=6"
                alt="Buy Me a Coffee at ko-fi.com"
                className="border-0 h-8"
              />
            </a>
          </div>
        </div>
      </footer>

      {/* Video Overlay */}
      <VideoOverlay
        videoId={selectedVideo || ""}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
};

export default Index;
