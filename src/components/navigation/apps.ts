import type { ComponentWithAs, IconProps } from "@chakra-ui/react";

import {
  ArticleIcon,
  BadgeIcon,
  BookmarkIcon,
  EmojiPacksIcon,
  LiveStreamIcon,
  MapIcon,
  MediaIcon,
  NotesIcon,
  NotificationsIcon,
  SearchIcon,
  TorrentIcon,
  VideoIcon,
  WikiIcon,
} from "../icons";
import MessageQuestionSquare from "../icons/message-question-square";
import UploadCloud01 from "../icons/upload-cloud-01";
import Users03 from "../icons/users-03";
import FileAttachment01 from "../icons/file-attachment-01";
import PuzzlePiece01 from "../icons/puzzle-piece-01";
import Users02 from "../icons/users-02";
import Users01 from "../icons/users-01";
import MessageChatCircle from "../icons/message-chat-circle";

export type App = {
  icon?: ComponentWithAs<"svg", IconProps>;
  image?: string;
  title: string;
  description: string;
  id: string;
  isExternal?: boolean;
  to: string;
};

export const internalApps: App[] = [
  {
    title: "Notes",
    description: "Short text posts from your friends",
    icon: NotesIcon,
    id: "notes",
    to: "/notes",
  },
  {
    title: "Discover",
    description: "Discover new feeds",
    icon: PuzzlePiece01,
    id: "discover",
    to: "/discovery",
  },
  {
    title: "Notifications",
    description: "Notifications feed",
    icon: NotificationsIcon,
    id: "notifications",
    to: "/notifications",
  },
  {
    title: "Search",
    description: "Search for users and notes",
    icon: SearchIcon,
    id: "search",
    to: "/search",
  },
  {
    title: "Relay Chat",
    description: "Simple dissapearing chat on relays",
    icon: MessageChatCircle,
    id: "relay-chat",
    to: "/relay-chat",
  },
  {
    title: "Pictures",
    description: "Browser picture posts",
    icon: MediaIcon,
    id: "pictures",
    to: "/pictures",
  },
  {
    title: "Wiki",
    description: "Browse wiki pages",
    icon: WikiIcon,
    id: "wiki",
    to: "/wiki",
  },
  {
    title: "Badges",
    description: "Create and manage badges",
    icon: BadgeIcon,
    id: "badges",
    to: "/badges",
  },
  {
    title: "Torrents",
    description: "Browse torrents on nostr",
    icon: TorrentIcon,
    id: "torrents",
    to: "/torrents",
  },
  {
    title: "Emojis",
    description: "Create custom emoji packs",
    icon: EmojiPacksIcon,
    id: "emojis",
    to: "/emojis",
  },
  {
    title: "Bookmarks",
    description: "Manage your bookmarks",
    icon: BookmarkIcon,
    id: "bookmarks",
    to: "/bookmarks",
  },
  {
    title: "Lists",
    description: "Lists of people and notes",
    icon: Users01,
    id: "lists",
    to: "/lists",
  },
  {
    title: "Videos",
    description: "Browse videos",
    icon: VideoIcon,
    id: "videos",
    to: "/videos",
  },
  {
    title: "Articles",
    description: "Browse articles",
    icon: ArticleIcon,
    id: "articles",
    to: "/articles",
  },
  {
    title: "Files",
    description: "Browse files",
    icon: FileAttachment01,
    id: "files",
    to: "/files",
  },
];

export const internalTools: App[] = [
  {
    title: "Event Console",
    description: "Find events based on nostr filters",
    icon: SearchIcon,
    id: "console",
    to: "/tools/console",
  },
  {
    title: "Event Publisher",
    description: "Write and publish events",
    icon: UploadCloud01,
    id: "publisher",
    to: "/tools/publisher",
  },
  {
    title: "Unknown Events",
    description: "A timeline of unknown events",
    icon: MessageQuestionSquare,
    id: "unknown",
    to: "/tools/unknown",
  },
  {
    title: "Map",
    description: "Explore events with geohashes",
    icon: MapIcon,
    id: "map",
    to: "/map",
  },
  {
    title: "noStrudel Users",
    description: "Discover other users using noStrudel",
    icon: Users03,
    id: "nostrudel-users",
    to: "/tools/nostrudel-users",
  },
];

export const externalTools: App[] = [
  {
    id: "nak",
    title: "Nostr Army Knife",
    description: "Universal NIP-19 tool",
    to: "https://nak.nostr.com/",
    image: "https://nak.nostr.com/favicon.ico",
    isExternal: true,
  },
  {
    id: "nostrdebug.co",
    title: "Nostr Debug",
    description: "Debug nostr relays and sign events",
    to: "https://nostrdebug.com/",
    image: "https://nostrdebug.com/favicon.ico",
    isExternal: true,
  },
  {
    id: "dtan.xyz",
    title: "DTAN",
    description: "Torrents over nostr",
    to: "https://dtan.xyz/",
    image: "https://dtan.xyz/logo_256.jpg",
    isExternal: true,
  },
  {
    id: "nostrapps.com",
    title: "Nostr Apps",
    description: "Curated directory of nostr apps",
    image: "https://uploads-ssl.webflow.com/641d0d46d5c124ac928a6027/64b1dd06d59d8f1e530d2926_32x32.png",
    to: "https://www.nostrapps.com/",
    isExternal: true,
  },
  {
    id: "metadata.nostr.com",
    title: "Nostr Profile Manager",
    description: "Backup and manage your profile",
    to: "https://metadata.nostr.com/",
    image: "https://metadata.nostr.com/img/git.png",
    isExternal: true,
  },
  {
    id: "nostr-delete.vercel.app",
    title: "Nostr Event Deletion",
    description: "Advanced event deletion",
    to: "https://nostr-delete.vercel.app/",
    image: "https://nostr-delete.vercel.app/favicon.png",
    isExternal: true,
  },
  // TODO: moStard CDN
  {
    title: "Satellite CDN",
    description: "Scalable media hosting for the nostr ecosystem",
    image: "https://satellite.earth/image.png",
    id: "satellite-cdn",
    to: "https://satellite.earth/cdn",
    isExternal: true,
  },
  {
    id: "w3.do",
    title: "URL Shortener",
    description: "Shorten URLs and store on nostr",
    to: "https://w3.do/",
    image: "https://w3.do/favicon.ico",
    isExternal: true,
  },
  {
    id: "nosbin.com",
    title: "nosbin",
    description: "Upload code snippets to nostr",
    to: "https://nosbin.com/",
    image: "https://nosbin.com/logo.png",
    isExternal: true,
  },
  {
    id: "bouquet.slidestr.net",
    title: "Bouquet",
    description: "Manage your blobs on multiple servers",
    to: "https://bouquet.slidestr.net/",
    image: "https://bouquet.slidestr.net/bouquet.png",
    isExternal: true,
  },
  {
    id: "monerospace",
    title: "Monerospace",
    description: "Blockchain explorer for Monero",
    to: "https://monerospace.org/",
    image: "https://monerospace.org/favicon.ico",
    isExternal: true,
  },
  {
    id: "nostrarchives",
    title: "NostrArchives",
    description: "Analytics platform for Nostr",
    to: "https://nostrarchives.com/",
    image: "https://nostrarchives.com/favicon.ico",
    isExternal: true,
  },
  {
    id: "xmrbazaar",
    title: "XmrBazaar",
    description: "Buy and sell products and services for Monero",
    to: "https://xmrbazaar.com/",
    image: "https://xmrbazaar.com/img/img_xmrbazaar_favicon.png",
    isExternal: true,
  },
  {
    id: "nano-gpt",
    title: "Nano GPT",
    description: "An AI that supports Monero payments for use — affiliate link, purchases support moStard",
    to: "https://nano-gpt.com/r/x7tJXbdk",
    image: "https://nano-gpt.com/logo.png",
    isExternal: true,
  },
];

export const defaultAnonFavoriteApps = ["notes", "discover", "search", "articles"];
export const defaultUserFavoriteApps = ["notes", "discover", "notifications", "search"];

export const allApps = [...internalApps, ...internalTools, ...externalTools];
