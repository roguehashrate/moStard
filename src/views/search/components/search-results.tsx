import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Flex, Heading, Spinner, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react";
import { mapEventsToStore } from "applesauce-core";
import { LRU } from "applesauce-core/helpers";
import { onlyEvents } from "applesauce-relay";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Observable } from "rxjs";

import { eventCache$ } from "../../../services/event-cache";
import { eventStore } from "../../../services/event-store";
import pool from "../../../services/pool";
import ArticleSearchResults from "./article-results";
import NoteSearchResults from "./note-results";
import ProfileSearchResults from "./profile-results";

export type SearchType = "all" | "users" | "notes" | "articles" | "hashtags";

export function createSearchAction(relays?: string[]): (filters: Filter[]) => Observable<NostrEvent> {
  return (filters: Filter[]) => {
    if (!relays || relays.length === 0) {
      if (!eventCache$.value) throw new Error("No event cache");
      if (!eventCache$.value.search) throw new Error("Event cache does not support search");
      return eventCache$.value.search(filters).pipe(mapEventsToStore(eventStore));
    }
    return pool.request(relays, filters).pipe(onlyEvents(), mapEventsToStore(eventStore));
  };
}

const searchCache = new LRU<NostrEvent[]>(10);

function getFilters(type: SearchType, query: string): Filter[] {
  const cleanQuery = query.replace(/^#/, "").trim();
  switch (type) {
    case "users":
      return [{ search: query, kinds: [kinds.Metadata], limit: 100 }];
    case "notes":
      return [{ search: query, kinds: [kinds.ShortTextNote], limit: 200 }];
    case "articles":
      return [{ search: query, kinds: [kinds.LongFormArticle], limit: 100 }];
    case "hashtags":
      return [{ search: cleanQuery, kinds: [kinds.ShortTextNote], "#t": [cleanQuery], limit: 200 }];
    case "all":
    default:
      return [
        { search: query, kinds: [kinds.Metadata], limit: 50 },
        { search: query, kinds: [kinds.ShortTextNote], limit: 100 },
        { search: query, kinds: [kinds.LongFormArticle], limit: 50 },
      ];
  }
}

function SearchResultsTab({
  type,
  query,
  relay,
  onResults,
}: {
  type: SearchType;
  query: string;
  relay: string;
  onResults?: (count: number) => void;
}) {
  const [results, setResults] = useState<NostrEvent[]>([]);
  const [searching, setSearching] = useState(false);
  const [done, setDone] = useState(false);
  const notified = useRef(false);

  const search = useMemo(() => createSearchAction(relay ? [relay] : []), [relay]);
  const cacheKey = `${type}-${query}-${relay}`;

  useEffect(() => {
    if (query.length < 2) return;
    setDone(false);
    notified.current = false;

    if (searchCache.has(cacheKey)) {
      const events = searchCache.get(cacheKey)!;
      setResults(events);
      setSearching(false);
      setDone(true);
    } else {
      setResults([]);
      setSearching(true);

      const filters = getFilters(type, query);
      const sub = search(filters).subscribe({
        next: (event) => {
          setResults((arr) => {
            const newArr = [...arr, event];
            searchCache.set(cacheKey, newArr);
            return newArr;
          });
        },
        error: () => {
          setSearching(false);
          setDone(true);
        },
        complete: () => {
          setSearching(false);
          setDone(true);
        },
      });

      return () => sub.unsubscribe();
    }
  }, [query, search, type]);

  useEffect(() => {
    if (done && !notified.current) {
      notified.current = true;
      onResults?.(results.length);
    }
  }, [done, results.length, onResults]);

  if (searching && results.length === 0) {
    return (
      <Flex justify="center" py="10">
        <Spinner />
      </Flex>
    );
  }

  if (results.length === 0 && done) {
    return (
      <Text color="gray.500" py="4" textAlign="center">
        No results found
      </Text>
    );
  }

  const profiles = results.filter((e) => e.kind === kinds.Metadata);
  const notes = results.filter((e) => e.kind === kinds.ShortTextNote);
  const articles = results.filter((e) => e.kind === kinds.LongFormArticle);

  return (
    <>
      {searching && (
        <Text fontSize="sm" color="gray.500" mb="2">
          Searching... ({results.length} found)
        </Text>
      )}
      {profiles.length > 0 && <ProfileSearchResults profiles={profiles} />}
      {notes.length > 0 && <NoteSearchResults notes={notes} />}
      {articles.length > 0 && <ArticleSearchResults articles={articles} />}
    </>
  );
}

export default function SearchResults({
  query,
  relay,
  type,
  onTypeChange,
}: {
  query: string;
  relay: string;
  type: SearchType;
  onTypeChange?: (type: SearchType) => void;
}) {
  return (
    <Tabs
      index={["all", "users", "notes", "articles", "hashtags"].indexOf(type)}
      onChange={(i) => onTypeChange?.(["all", "users", "notes", "articles", "hashtags"][i] as SearchType)}
      isLazy
      lazyBehavior="keepMounted"
    >
      <TabList>
        <Tab>All</Tab>
        <Tab>Users</Tab>
        <Tab>Notes</Tab>
        <Tab>Articles</Tab>
        <Tab>Hashtags</Tab>
      </TabList>

      <TabPanels>
        <TabPanel px="0">
          <SearchResultsTab type="all" query={query} relay={relay} />
        </TabPanel>
        <TabPanel px="0">
          <SearchResultsTab type="users" query={query} relay={relay} />
        </TabPanel>
        <TabPanel px="0">
          <SearchResultsTab type="notes" query={query} relay={relay} />
        </TabPanel>
        <TabPanel px="0">
          <SearchResultsTab type="articles" query={query} relay={relay} />
        </TabPanel>
        <TabPanel px="0">
          <SearchResultsTab type="hashtags" query={query} relay={relay} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
