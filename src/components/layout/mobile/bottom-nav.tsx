import { Avatar, Badge, Box, Flex, IconButton, useDisclosure } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { Link as RouterLink } from "react-router-dom";

import { DirectMessagesIcon, NotesIcon, NotificationsIcon, PlusCircleIcon, SearchIcon } from "../../icons";
import useRootPadding from "../../../hooks/use-root-padding";

import useUnreadNotificationCount from "../../../hooks/use-unread-notification-count";
import UserAvatar from "../../user/user-avatar";
import NavDrawer from "./nav-drawer";

export default function MobileBottomNav() {
  useRootPadding({ bottom: "var(--chakra-sizes-14)" });
  const account = useActiveAccount();
  const drawer = useDisclosure();
  const unreadCount = useUnreadNotificationCount();

  return (
    <>
      <Flex
        gap="2"
        pt="2"
        px="2"
        pb="calc(var(--chakra-space-2) + var(--safe-bottom))"
        borderTopWidth={1}
        hideFrom="md"
        bg="var(--chakra-colors-chakra-body-bg)"
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        zIndex="modal"
      >
        {account ? (
          <UserAvatar pubkey={account.pubkey} size="sm" onClick={drawer.onOpen} noProxy />
        ) : (
          <Avatar size="sm" src="/apple-touch-icon.png" onClick={drawer.onOpen} cursor="pointer" />
        )}
        <IconButton as={RouterLink} icon={<NotesIcon boxSize={6} />} aria-label="Home" flexGrow="1" size="md" to="/" />
        <IconButton
          as={RouterLink}
          icon={<SearchIcon boxSize={6} />}
          aria-label="Search"
          flexGrow="1"
          size="md"
          to="/search"
        />
        <IconButton
          as={RouterLink}
          icon={<PlusCircleIcon boxSize={6} />}
          aria-label="Create new"
          title="Create new"
          variant="solid"
          colorScheme="primary"
          to="/new"
        />
        <IconButton
          as={RouterLink}
          icon={<DirectMessagesIcon boxSize={6} />}
          aria-label="Messages"
          flexGrow="1"
          size="md"
          to="/messages"
        />
        <Box position="relative" flexGrow="1" display="flex">
          <IconButton
            as={RouterLink}
            icon={<NotificationsIcon boxSize={6} />}
            aria-label="Notifications"
            flex="1"
            size="md"
            to="/notifications"
          />
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="0"
              right="0"
              colorScheme="red"
              borderRadius="full"
              fontSize="xs"
              minW="5"
              h="5"
              display="flex"
              alignItems="center"
              justifyContent="center"
              zIndex="1"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Box>
      </Flex>
      <NavDrawer isOpen={drawer.isOpen} onClose={drawer.onClose} />
    </>
  );
}
