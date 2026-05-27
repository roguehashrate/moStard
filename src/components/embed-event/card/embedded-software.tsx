import { Card, CardBody, CardHeader, CardProps, Flex, Heading, Image, LinkBox, LinkOverlay, Spacer, Tag, Text, Wrap, chakra } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import {
  getSoftwareAppIcon,
  getSoftwareAppLicense,
  getSoftwareAppName,
  getSoftwareAppPlatform,
  getSoftwareAppScreenshots,
  getSoftwareAppSummary,
  getSoftwareAppTags,
  getSoftwareAppUrl,
} from "../../../helpers/nostr/software";
import Timestamp from "../../timestamp";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export default function EmbeddedSoftware({
  app,
  ...props
}: Omit<CardProps, "children"> & { app: NostrEvent }) {
  const name = getSoftwareAppName(app);
  const summary = getSoftwareAppSummary(app);
  const icon = getSoftwareAppIcon(app);
  const screenshots = getSoftwareAppScreenshots(app);
  const tags = getSoftwareAppTags(app);
  const platform = getSoftwareAppPlatform(app);
  const license = getSoftwareAppLicense(app);
  const launchUrl = useMemo(() => getSoftwareAppUrl(app), [app]);

  return (
    <Card as={LinkBox} {...props}>
      <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
        {icon && <Image src={icon} boxSize="32px" borderRadius="md" alt={`${name} icon`} />}
        <Heading size="md" display="flex" alignItems="center" gap="2">
          <LinkOverlay href={launchUrl} isExternal>
            {name}
          </LinkOverlay>
        </Heading>
        <UserAvatarLink pubkey={app.pubkey} size="xs" />
        <UserLink pubkey={app.pubkey} isTruncated fontWeight="bold" fontSize="md" />
        <Spacer />
        <Timestamp timestamp={app.created_at} />
      </CardHeader>
      <CardBody p="2">
        {summary && (
          <Text noOfLines={2} mb="2">
            {summary}
          </Text>
        )}
        <Flex gap="2" wrap="wrap" align="center">
          {tags.length > 0 && (
            <Wrap>
              {tags.map((tag) => (
                <Tag key={tag} size="sm">
                  {tag}
                </Tag>
              ))}
            </Wrap>
          )}
          {platform && (
            <Tag size="sm" colorScheme="blue">
              {platform}
            </Tag>
          )}
          {license && (
            <Tag size="sm" colorScheme="green">
              {license}
            </Tag>
          )}
        </Flex>
        {screenshots.length > 0 && (
          <Flex gap="2" mt="2" overflowX="auto">
            {screenshots.map((url, i) => (
              <Image key={i} src={url} boxSize="120px" objectFit="cover" borderRadius="md" flexShrink={0} alt={`Screenshot ${i + 1}`} />
            ))}
          </Flex>
        )}
        {app.content && (
          <chakra.div mt="2" whiteSpace="pre-wrap" noOfLines={3} fontSize="sm" color="gray.500">
            {app.content}
          </chakra.div>
        )}
      </CardBody>
    </Card>
  );
}
