"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils/format-price";
import { searchProducts } from "@/server/actions/search";

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  images: { url: string; alt: string | null }[];
};

export function SearchBar() {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const doSearch = useCallback((q: string) => {
    startTransition(async () => {
      const items = await searchProducts(q, 5);
      setResults(items as SearchResult[]);
      setIsOpen(true);
    });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      // Clear results via a no-op transition to satisfy lint
      startTransition(() => {
        setResults([]);
        setIsOpen(false);
      });
      return;
    }

    debounceRef.current = setTimeout(() => doSearch(query), 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(slug: string) {
    setIsOpen(false);
    setQuery("");
    router.push(`/${locale}/products/${slug}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("placeholder")}
          className="h-9 w-[180px] pr-8 pl-8 md:w-[240px]"
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="bg-popover absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-md border shadow-lg">
          {isPending ? (
            <div className="text-muted-foreground p-3 text-center text-sm">
              {t("searching")}
            </div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    onClick={() => handleSelect(product.slug)}
                    className="hover:bg-accent flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
                  >
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt ?? product.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="bg-muted h-10 w-10 rounded" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatPrice(product.basePrice)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground p-3 text-center text-sm">
              {t("noResults")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
