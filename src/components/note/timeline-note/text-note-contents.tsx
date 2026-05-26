import React, { Suspense } from "react";
import { Box, type BoxProps, Spinner } from "@chakra-ui/react";
import type { EventTemplate, NostrEvent } from "nostr-tools";
import { useRenderedContent } from "applesauce-react/hooks";
import { textNoteTransformers, TextNoteContentSymbol, galleries } from "applesauce-content/text";

import {
  renderWavlakeUrl,
  renderYoutubeURL,
  renderImageUrl,
  renderTwitterUrl,
  renderAppleMusicUrl,
  renderSpotifyUrl,
  renderTidalUrl,
  renderVideoUrl,
  renderOpenGraphUrl,
  renderSongDotLinkUrl,
  renderStemstrUrl,
  renderSoundCloudUrl,
  renderSimpleXLink,
  renderRedditUrl,
  renderAudioUrl,
  renderModelUrl,
  renderCodePenURL,
  renderArchiveOrgURL,
  renderStreamUrl,
  renderNostrAppWebLink,
} from "../../content/links";
import { LightboxProvider } from "../../lightbox-provider";
import MediaOwnerProvider from "../../../providers/local/media-owner";
import { components } from "../../content";
import { nipDefinitions } from "../../content/transform/nip-notation";
import { bipDefinitions } from "../../content/transform/bip-notation";
import { moneroAddressLinks } from "~/components/content/transform/monero-notation";
import { CharkaMarkdown } from "../../markdown/markdown";

const transformers = [...textNoteTransformers, galleries, nipDefinitions, bipDefinitions, moneroAddressLinks];

const MARKDOWN_PATTERNS = [
  /(^|\n)#{1,6}\s+/, // headings
  /```/, // fenced code block
  /(^|\n)[>\-*+]\s+/, // blockquotes & lists
  /(^|\n)\d+\.\s+/, // ordered lists
  /!\[.*?\]\(.*?\)/, // images
  /\[.+?\]\(.+?\)/, // links
  /\*\*[^\n]+?\*\*/, // bold
  /__[^\n]+?__/, // bold underline style
  /(^|[\s([{>])_[^_\n]+?_(?=([\s).,!?:;\]}]|$))/, // italic underscore
  /(^|[\s([{>])\*[^*\n]+?\*(?=([\s).,!?:;\]}]|$))/, // italic asterisk
  /~~[^~\n]+?~~/, // strikethrough
  /`[^`\n]+?`/, // inline code
];

function hasMarkdownTag(tags?: (string | undefined)[][]): boolean {
  if (!Array.isArray(tags)) return false;
  return tags.some(
    (tag) => tag[0] === "content-type" && typeof tag[1] === "string" && tag[1].toLowerCase().includes("markdown"),
  );
}

function looksLikeMarkdown(content: string | undefined): boolean {
  if (!content) return false;
  return MARKDOWN_PATTERNS.some((pattern) => pattern.test(content));
}

export type TextNoteContentsProps = {
  event: NostrEvent | EventTemplate;
  noOpenGraphLinks?: boolean;
  maxLength?: number;
};

function isMarkdownContent(event: NostrEvent | EventTemplate | string): boolean {
  const tags = typeof event === "string" ? undefined : (event as EventTemplate).tags;
  if (hasMarkdownTag(tags)) return true;

  const content = typeof event === "string" ? event : (event.content ?? "");
  return looksLikeMarkdown(content);
}

const linkRenderers = [
  renderSimpleXLink,
  renderYoutubeURL,
  renderTwitterUrl,
  renderRedditUrl,
  renderWavlakeUrl,
  renderAppleMusicUrl,
  renderSpotifyUrl,
  renderTidalUrl,
  renderSongDotLinkUrl,
  renderStemstrUrl,
  renderSoundCloudUrl,
  renderImageUrl,
  renderVideoUrl,
  renderStreamUrl,
  renderAudioUrl,
  renderModelUrl,
  renderCodePenURL,
  renderArchiveOrgURL,
  renderNostrAppWebLink,
  renderOpenGraphUrl,
];

export const TextNoteContents = React.memo(
  ({ event, noOpenGraphLinks, maxLength, ...props }: TextNoteContentsProps & Omit<BoxProps, "children">) => {
    const markdownEnabled = isMarkdownContent(event);

    const content = useRenderedContent(event, components, {
      linkRenderers,
      transformers,
      maxLength,
      cacheKey: TextNoteContentSymbol,
    });

    const rawContent = typeof event === "string" ? event : (event.content ?? "");

    return (
      <MediaOwnerProvider owner={(event as NostrEvent).pubkey as string | undefined}>
        <LightboxProvider>
          <Suspense fallback={<Spinner />}>
            <Box whiteSpace={markdownEnabled ? undefined : "pre-wrap"} dir="auto" {...props}>
              {markdownEnabled ? <CharkaMarkdown>{rawContent}</CharkaMarkdown> : content}
            </Box>
          </Suspense>
        </LightboxProvider>
      </MediaOwnerProvider>
    );
  },
);

export default TextNoteContents;
