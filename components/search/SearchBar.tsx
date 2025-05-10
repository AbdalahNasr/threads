"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchContent } from "@/lib/actions/search.actions";

interface SearchResult {
  id: string;
  type: "user" | "community" | "post";
  title: string;
  image?: string;
  url: string;
}

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchQuery.trim().length > 2) {
      setIsSearching(true);

      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await searchContent(searchQuery);

          // Sort results to prioritize: 1. Users, 2. Posts, 3. Communities
          const sortedResults = [...results].sort((a, b) => {
            const typeOrder: Record<string, number> = {
              user: 0,
              post: 1,
              community: 2,
            };
            return typeOrder[a.type] - typeOrder[b.type];
          });

          setSearchResults(sortedResults);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const handleResultClick = (url: string) => {
    setSearchQuery("");
    setSearchResults([]);
    router.push(url);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {(searchResults.length > 0 || isSearching) && (
        <div className="absolute top-full mt-1 w-full bg-background border rounded-md shadow-lg z-10 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div>
              {searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="p-3 hover:bg-accent cursor-pointer flex items-center"
                  onClick={() => handleResultClick(result.url)}
                >
                  {result.image && (
                    <img
                      src={result.image}
                      alt={result.title}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  )}
                  <div>
                    <p className="font-medium">{result.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {result.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
