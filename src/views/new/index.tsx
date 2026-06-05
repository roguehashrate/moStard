import { Card, CardBody, ComponentWithAs, Flex, Heading, IconProps, LinkBox, SimpleGrid, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { MediaIcon, NotesIcon } from "../../components/icons";
import HoverLinkOverlay from "../../components/hover-link-overlay";
import SimpleView from "../../components/layout/presets/simple-view";

const NEW_TYPES: { title: string; path: string; summary?: string; icon: ComponentWithAs<"svg", IconProps> }[] = [
  { title: "Post", path: "/new/note", summary: "A quick message with optional images, video, and polls", icon: NotesIcon },
  { title: "Image Gallery", path: "/new/media", summary: "A multi-image album with descriptions", icon: MediaIcon },
];

export default function NewView() {
  return (
    <SimpleView title="Create new" maxW="6xl" center>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="2">
        {NEW_TYPES.map(({ title, path, icon: Icon, summary }) => (
          <Card key={title} as={LinkBox}>
            <CardBody display="flex" gap="4">
              <Icon boxSize={10} />
              <Flex gap="2" flexDirection="column">
                <Heading size="md">
                  <HoverLinkOverlay as={RouterLink} to={path}>
                    {title}
                  </HoverLinkOverlay>
                </Heading>

                {summary && <Text whiteSpace="pre-line">{summary}</Text>}
              </Flex>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </SimpleView>
  );
}
