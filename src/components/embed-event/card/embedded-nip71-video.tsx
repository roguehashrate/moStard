import { Card, CardBody, CardProps, Flex, Image, Text } from "@chakra-ui/react";
import { getMediaAttachments } from "applesauce-core/helpers";
import type { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { getSharableEventAddress } from "../../../services/relay-hints";
import UserAvatar from "../../user/user-avatar";
import UserLink from "../../user/user-link";

export default function EmbeddedNip71Video({ video, ...props }: Omit<CardProps, "children"> & { video: NostrEvent }) {
  const attachments = getMediaAttachments(video);
  const firstVideo = attachments?.find((m) => m.type?.startsWith("video/"));
  const thumb = firstVideo?.thumbnail || video.tags.find((t) => t[0] === "image")?.[1];
  const url = firstVideo?.url;
  const naddr = getSharableEventAddress(video);

  if (!url) {
    return (
      <Card {...props} position="relative">
        <CardBody p="2">
          <Flex gap="2" alignItems="center">
            <UserAvatar pubkey={video.pubkey} size="xs" />
            <Text fontSize="sm" fontWeight="bold">
              <UserLink pubkey={video.pubkey} />
            </Text>
            <Text fontSize="sm" color="gray.500">
              Video
            </Text>
          </Flex>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card {...props} position="relative">
      <CardBody p="2" as={RouterLink} to={`/videos/${naddr}`} _hover={{ textDecoration: "none" }}>
        {thumb && <Image src={thumb} borderRadius="md" maxH="2in" mx="auto" mb="2" />}
        <Flex gap="2" alignItems="center">
          <UserAvatar pubkey={video.pubkey} size="xs" />
          <Text fontSize="sm" fontWeight="bold">
            <UserLink pubkey={video.pubkey} />
          </Text>
        </Flex>
      </CardBody>
    </Card>
  );
}
