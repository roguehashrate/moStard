import { Box, type BoxProps } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";
import { useRenderedContent } from "applesauce-react/hooks";
import { emojis, nostrMentions, links, hashtags } from "applesauce-content/text";

import { components } from "../content";
import { renderGenericUrl } from "../content/links";
import { nipDefinitions } from "../content/transform/nip-notation";
import { bipDefinitions } from "../content/transform/bip-notation";
import { moneroAddressLinks } from "../content/transform/monero-notation";

const transformers = [links, nostrMentions, emojis, hashtags, nipDefinitions, bipDefinitions, moneroAddressLinks];

const linkRenderers = [renderGenericUrl];

const PicturePostContentSymbol = Symbol.for("picture-post-content");

export default function MediaPostContents({ post, ...props }: { post: NostrEvent } & Omit<BoxProps, "children">) {
  const content = useRenderedContent(post, components, {
    linkRenderers,
    transformers,
    cacheKey: PicturePostContentSymbol,
  });

  return (
    <Box whiteSpace="pre-wrap" dir="auto" {...props}>
      {content}
    </Box>
  );
}
