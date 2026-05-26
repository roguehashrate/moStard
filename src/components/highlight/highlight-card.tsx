import { Box, Card, CardBody, CardProps, Flex, Text } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";
import UserAvatar from "../user/user-avatar";
import UserLink from "../user/user-link";

export default function HighlightCard({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const highlightedText = event.content;
  const eTag = event.tags.find((t) => t[0] === "e");
  const sourceEventId = eTag?.[1];

  if (!highlightedText) return null;

  return (
    <Card {...props}>
      <CardBody p="4">
        <Box borderLeft="4px solid" borderColor="green.400" pl="4" py="2" mb="3">
          <Text whiteSpace="pre-wrap" fontStyle="italic">
            {highlightedText}
          </Text>
        </Box>

        {sourceEventId && (
          <Flex gap="2" alignItems="center" mt="2">
            <Text fontSize="sm" color="gray.500">
              Highlight from a note
            </Text>
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
