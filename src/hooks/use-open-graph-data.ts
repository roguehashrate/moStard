import { useAsync } from "react-use";
import { fetchWithProxy } from "../helpers/request";
import type { OgObjectInteral } from "../lib/open-graph-scraper/types";
import useAppSettings from "./use-user-app-settings";

const blockedExtensions = new Set([
  ".7z",
  ".apk",
  ".bin",
  ".bz2",
  ".css",
  ".csv",
  ".doc",
  ".docx",
  ".gif",
  ".gz",
  ".heic",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".mp3",
  ".mp4",
  ".mpeg",
  ".ogg",
  ".pdf",
  ".png",
  ".ppt",
  ".pptx",
  ".rar",
  ".svg",
  ".tif",
  ".tiff",
  ".txt",
  ".webm",
  ".webp",
  ".xls",
  ".xlsx",
  ".zip",
]);

const HTML_CONTENT_TYPES = ["text/html", "application/xhtml+xml"];
const FALLBACK_PROXY_PREFIX = "https://r.jina.ai/";

function hasBlockedExtension(url: URL) {
  const match = url.pathname.match(/\.[A-Za-z0-9]+$/);
  if (!match) return false;
  return blockedExtensions.has(match[0].toLowerCase());
}

async function fetchHtmlDirect(url: URL, signal: AbortSignal) {
  const response = await fetchWithProxy(url, { signal });
  const contentType = response.headers.get("content-type");

  if (!response.ok) throw new Error(`Failed to load open graph source: ${response.status}`);
  if (contentType && !HTML_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }

  return response.text();
}

async function fetchHtmlFallback(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const response = await fetch(`${FALLBACK_PROXY_PREFIX}${url.toString()}`);
  if (!response.ok) return null;
  return response.text();
}

const openGraphDataCache = new Map<string, OgObjectInteral>();

export default function useOpenGraphData(url: URL) {
  const { loadOpenGraphData } = useAppSettings();

  return useAsync(async () => {
    if (!loadOpenGraphData) return null;

    const { default: extractMetaTags } = await import("../lib/open-graph-scraper/extract");

    if (openGraphDataCache.has(url.toString())) return openGraphDataCache.get(url.toString());

    if (hasBlockedExtension(url)) return null;

    try {
      const controller = new AbortController();
      let html: string | null = null;

      try {
        html = await fetchHtmlDirect(url, controller.signal);
      } catch (error) {
        controller.abort();
      }

      if (!html) {
        html = await fetchHtmlFallback(url);
      }

      if (!html) return null;

      const data = extractMetaTags(html);
      openGraphDataCache.set(url.toString(), data);
      return data;
    } catch (e) {}
    return null;
  }, [url.toString(), loadOpenGraphData]);
}
