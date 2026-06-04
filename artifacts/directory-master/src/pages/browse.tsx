import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { 
  useListPublicEntries,
  useGetPublicStats,
  useGetPublicSettings
} from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, ArrowRight, Loader2, FilterX, CalendarDays, Building2, Globe, Tag, Mail, Phone, Sparkles, Info } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { FontLoader } from "@/components/template/FontLoader";
import { mergeTemplateSettings, getFontFamily } from "@/lib/templateTypes";
import type { SectionProps } from "@/lib/templateTypes";

export default function BrowsePage() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const categoryParam = params.category ? decodeURIComponent(params.category) : null;
  
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get("search") || "";
  
  const [search, setSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [sort, setSort] = useState<string>("newest");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: settings } = useGetPublicSettings();
  const { data: stats } = useGetPublicStats();
  
  const { data: entriesData, isLoading } = useListPublicEntries({
    page,
    limit,
    search: search || undefined,
    category: categoryParam || undefined,
    sort,
  });

  const ts = mergeTemplateSettings((settings as any)?.templateSettings);
  const browseFont = getFontFamily(ts.browse.font);

  const getSection = (id: string) => ts.browse.sections.find(s => s.id === id);
  const getSectionEnabled = (id: string) => getSection(id)?.enabled ?? true;
  const getSectionHeading = (id: string, fallback: string) => getSection(id)?.heading || fallback;
  const getSectionProps = (id: string) => getSection(id)?.props ?? {};

  const cardFields = ts.browse.cardFields;
  const cardImageFields = ts.browse.cardImageFields;
  const showField = (id: string) => cardFields.includes(id);
  const isImageField = (id: string) => cardImageFields.includes(id);

  const renderCardField = (entry: any, fid: string) => {
    // Image display mode — render value as <img> instead of text
    if (isImageField(fid)) {
      const val = (() => {
        if (fid.startsWith("custom:")) {
          const k = fid.slice(7);
          const cf = entry?.customFields;
          return cf && typeof cf === "object" ? cf[k] : null;
        }
        return (entry as any)[fid] ?? null;
      })();
      if (!val) return null;
      return (
        <div key={fid} className="pt-1">
          <img
            src={String(val)}
            alt=""
            className="h-12 w-12 rounded-full object-cover border border-gray-100 dark:border-gray-700"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      );
    }
    switch (fid) {
      case "location":
        return entry.location ? (
          <div key="location" className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{entry.location}</span>
          </div>
        ) : null;
      case "venue":
        return entry.venue ? (
          <div key="venue" className="flex items-center text-sm text-muted-foreground">
            <Building2 className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{entry.venue}</span>
          </div>
        ) : null;
      case "startDate":
        return entry.startDate ? (
          <div key="startDate" className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {entry.startDate}
              {showField("endDate") && entry.endDate && entry.endDate !== entry.startDate
                ? ` – ${entry.endDate}` : ""}
            </span>
          </div>
        ) : null;
      case "endDate":
        return (!showField("startDate") && entry.endDate) ? (
          <div key="endDate" className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span>{entry.endDate}</span>
          </div>
        ) : null;
      case "eventType":
        return entry.eventType ? (
          <div key="eventType" className="flex items-center text-sm text-muted-foreground">
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-medium">{entry.eventType}</span>
          </div>
        ) : null;
      case "website":
        return entry.website ? (
          <div key="website" className="flex items-center text-sm text-muted-foreground">
            <Globe className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1 text-primary">{entry.website.replace(/^https?:\/\//, "")}</span>
          </div>
        ) : null;
      case "tags":
        return entry.tags ? (
          <div key="tags" className="flex items-center gap-1 flex-wrap pt-1">
            <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            {entry.tags.split(",").slice(0, 3).map((tag: string, i: number) => (
              <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-muted-foreground">
                {tag.trim()}
              </span>
            ))}
          </div>
        ) : null;
      case "contactEmail":
        return entry.contactEmail ? (
          <div key="contactEmail" className="flex items-center text-sm text-muted-foreground">
            <Mail className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{entry.contactEmail}</span>
          </div>
        ) : null;
      case "contactPhone":
        return entry.contactPhone ? (
          <div key="contactPhone" className="flex items-center text-sm text-muted-foreground">
            <Phone className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{entry.contactPhone}</span>
          </div>
        ) : null;
      default: {
        if (fid.startsWith("custom:")) {
          const k = fid.slice(7);
          const cf = entry?.customFields;
          const val = cf && typeof cf === "object" ? cf[k] : null;
          if (!val) return null;
          return (
            <div key={fid} className="flex items-center text-sm text-muted-foreground">
              <Sparkles className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{String(val)}</span>
            </div>
          );
        }
        return null;
      }
    }
  };

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("search") || "";
    if (q !== search) {
      setSearch(q);
      setSearchInput(q);
    }
  }, [window.location.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    const newUrl = new URL(window.location.href);
    if (searchInput) {
      newUrl.searchParams.set("search", searchInput);
    } else {
      newUrl.searchParams.delete("search");
    }
    window.history.pushState({}, "", newUrl);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setSort("newest");
    setPage(1);
    setLocation("/browse");
  };

  const demoEntries = [
    { id: "demo1", title: "Tech Conference 2024", category: "Events", summary: "Annual gathering of tech enthusiasts and industry leaders.", location: "San Francisco, CA" },
    { id: "demo2", title: "Acme Innovations", category: "Companies", summary: "Leading provider of next-generation cloud infrastructure.", location: "New York, NY" },
    { id: "demo3", title: "Web Developer Toolkit", category: "Resources", summary: "Comprehensive collection of tools for modern web development.", location: "Online" },
  ];

  const isDemo = !isLoading && entriesData && entriesData.entries.length === 0 && !search && !categoryParam;

  const renderCardFields = (entry: any) => (
    <CardContent className="flex-grow space-y-2">
      {entry.summary && (
        <p className="text-muted-foreground line-clamp-3 text-sm">{entry.summary}</p>
      )}
      {cardFields.filter(id => id !== "category").map(fid => renderCardField(entry, fid))}
    </CardContent>
  );

  const renderEntryCard = (entry: any, isDemo = false) => (
    <Card key={entry.id} className="h-full flex flex-col hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          {showField("category") && entry.category && (
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              {entry.category}
            </Badge>
          )}
          {isDemo && <Badge variant="outline">Demo</Badge>}
        </div>
        <CardTitle className="line-clamp-2 text-xl">{entry.title}</CardTitle>
      </CardHeader>
      {renderCardFields(entry)}
      <CardFooter className="pt-4 border-t">
        <Link href={`/entry/${(entry as any).slug || entry.id}`} className="w-full">
          <Button variant="ghost" className="w-full group">
            View Details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );

  return (
    <div style={{ fontFamily: browseFont }}>
      <FontLoader fontKey={ts.browse.font} />

      {/* Header banner — driven by builder section props */}
      {(() => {
        const hp = getSectionProps("header") as SectionProps;
        if (!hp.backgroundImage && !hp.backgroundColor) return null;
        return (
          <div
            className="w-full h-40 bg-cover bg-center relative"
            style={hp.backgroundImage
              ? { backgroundImage: `url(${hp.backgroundImage})` }
              : { backgroundColor: hp.backgroundColor }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={hp.backgroundImage ? { backgroundColor: `rgba(0,0,0,${(hp.overlayOpacity ?? 40) / 100})` } : {}}
            >
              <h2
                className="text-3xl font-bold"
                style={{ color: hp.headingColor || "#ffffff", fontFamily: hp.fontFamily ? getFontFamily(hp.fontFamily) : undefined }}
              >
                {getSectionHeading("header", "Browse Directory")}
              </h2>
            </div>
          </div>
        );
      })()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Filters */}
          {getSectionEnabled("filters") && (
            <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
              <div>
                <h3 className="font-semibold mb-4 text-lg">Search</h3>
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Keywords..."
                      className="pl-9"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full mt-2" variant="secondary">
                    Search
                  </Button>
                </form>
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-lg">Categories</h3>
                <div className="space-y-1">
                  <Link 
                    href="/browse"
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      !categoryParam 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    All Categories
                  </Link>
                  {stats?.categoryBreakdown.map((cat) => (
                    <Link 
                      key={cat.category}
                      href={`/browse/${encodeURIComponent(cat.category)}`}
                      className={`flex justify-between items-center px-3 py-2 rounded-md text-sm transition-colors ${
                        categoryParam === cat.category 
                          ? "bg-primary text-primary-foreground font-medium" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <span className="truncate pr-2">{cat.category}</span>
                      <span className={`text-xs ${categoryParam === cat.category ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {cat.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {(search || categoryParam || sort !== "newest") && (
                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  <FilterX className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </aside>
          )}

          {/* Main Content */}
          {getSectionEnabled("grid") && (
            <main className="flex-1 min-w-0">
              {getSectionEnabled("header") && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      {categoryParam ? categoryParam : getSectionHeading("header", "All Entries")}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      {entriesData?.total || 0} results found
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium whitespace-nowrap">Sort by:</span>
                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="a-z">Name (A-Z)</SelectItem>
                        <SelectItem value="z-a">Name (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isDemo ? (
                <div className="space-y-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      <strong>No entries found.</strong> Your directory is empty. Here are some demo entries to show how it looks.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {demoEntries.map(entry => renderEntryCard(entry, true))}
                  </div>
                </div>
              ) : entriesData?.entries.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No entries found</h3>
                  <p className="mt-1 text-gray-500">Try adjusting your search or filters.</p>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {entriesData?.entries.map(entry => renderEntryCard(entry))}
                  </div>
                  {entriesData && entriesData.totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <span className="text-sm font-medium px-4">
                            Page {page} of {entriesData.totalPages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setPage(p => Math.min(entriesData.totalPages, p + 1))}
                            className={page === entriesData.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )}
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
