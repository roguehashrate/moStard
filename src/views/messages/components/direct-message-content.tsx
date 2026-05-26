import { Box, BoxProps, Text } from "@chakra-ui/react";
import { useRenderedContent } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import React, { useMemo } from "react";

import { getExpirationTimestamp, getRumorGiftWraps, isRumor, Rumor } from "applesauce-core/helpers";
import dayjs from "dayjs";
import { components } from "../../../components/content";
import {
  renderAppleMusicUrl,
  renderGenericUrl,
  renderImageUrl,
  renderRedditUrl,
  renderSimpleXLink,
  renderSongDotLinkUrl,
  renderSoundCloudUrl,
  renderSpotifyUrl,
  renderStemstrUrl,
  renderStreamUrl,
  renderTidalUrl,
  renderTwitterUrl,
  renderVideoUrl,
  renderWavlakeUrl,
  renderYoutubeURL,
} from "../../../components/content/links";
import { renderAudioUrl } from "../../../components/content/links/audio";
import { LightboxProvider } from "../../../components/lightbox-provider";
import { useLegacyMessagePlaintext } from "../../../hooks/use-legacy-message-plaintext";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import DecryptPlaceholder from "../chat/components/decrypt-placeholder";

const DirectMessageContentSymbol = Symbol.for("direct-message-content");
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
  renderGenericUrl,
];

function LegacyDirectMessageContent({
  message,
  text,
  children,
  ...props
}: { message: NostrEvent; text: string; children?: React.ReactNode } & BoxProps) {
  const plaintext = useLegacyMessagePlaintext(message).plaintext;
  const content = useRenderedContent(plaintext, components, { linkRenderers, cacheKey: DirectMessageContentSymbol });

  const expirationTimestamp = getExpirationTimestamp(message);

  return (
    <ContentSettingsProvider event={message}>
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {content}
          {children}
        </Box>

        {expirationTimestamp && (
          <Text fontSize="xs" color="orange.500">
            Disappears: {dayjs.unix(expirationTimestamp).fromNow()}
          </Text>
        )}
      </LightboxProvider>
    </ContentSettingsProvider>
  );
}

type SealedMessage = Rumor | (NostrEvent & { kind: typeof kinds.PrivateDirectMessage });

function isSealedMessage(message: NostrEvent | Rumor): message is SealedMessage {
  if (isRumor(message)) return true;
  const event = message as NostrEvent;
  return event.kind === kinds.PrivateDirectMessage;
}

function SealedDirectMessageContent({
  message,
  children,
  ...props
}: { message: SealedMessage; children?: React.ReactNode } & BoxProps) {
  const content = useRenderedContent(message, components, { linkRenderers, cacheKey: DirectMessageContentSymbol });
  const expirationTimestamp = useMemo(() => {
    if (isRumor(message)) {
      const giftWraps = getRumorGiftWraps(message);
      for (const giftWrap of giftWraps) {
        const ts = getExpirationTimestamp(giftWrap);
        if (ts) return ts;
      }
      return undefined;
    }
    return getExpirationTimestamp(message);
  }, [message]);

  return (
    <ContentSettingsProvider event={message as NostrEvent}>
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {content}
          {children}
        </Box>

        {expirationTimestamp && (
          <Text fontSize="xs" color="orange.500">
            Disappears: {dayjs.unix(expirationTimestamp).fromNow()}
          </Text>
        )}
      </LightboxProvider>
    </ContentSettingsProvider>
  );
}

export default function DirectMessageContent({
  message,
  children,
  ...props
}: { message: NostrEvent | Rumor; children?: React.ReactNode } & BoxProps) {
  if (isSealedMessage(message)) {
    return <SealedDirectMessageContent message={message} children={children} {...props} />;
  }

  return (
    <DecryptPlaceholder message={message as NostrEvent}>
      {(text) => (
        <LegacyDirectMessageContent message={message as NostrEvent} text={text} children={children} {...props} />
      )}
    </DecryptPlaceholder>
  );
}
