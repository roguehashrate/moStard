import { Avatar, Badge, Box, Flex, IconButton, useDisclosure } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { Link as RouterLink, useLocation } from "react-router-dom";

import { DirectMessagesIcon, NotesIcon, NotificationsIcon, PlusCircleIcon, SearchIcon } from "../../icons";
import useRootPadding from "../../../hooks/use-root-padding";

import useUnreadNotificationCount from "../../../hooks/use-unread-notification-count";
import UserAvatar from "../../user/user-avatar";
import NavDrawer from "./nav-drawer";

function NavTab({
  to,
  icon,
  label,
  badge,
}: {
  to: string;
  icon: React.ReactElement;
  label: string;
  badge?: number;
}) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <Box position="relative" flex="1" display="flex" justifyContent="center">
      <Box
        as={RouterLink}
        to={to}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p="2"
        borderRadius="2xl"
        bg={isActive ? "primary.50" : "transparent"}
        _dark={{
          bg: isActive ? "whiteAlpha.100" : "transparent",
        }}
        transition="all 0.15s"
        _hover={{
          bg: isActive ? undefined : "glass-bg-hover",
        }}
      >
        <Box
          as="span"
          color={isActive ? "primary.500" : "chakra-subtle-text"}
          _dark={{ color: isActive ? "primary.400" : "whiteAlpha.600" }}
        >
          {icon}
        </Box>
      </Box>
      {!!badge && badge > 0 && (
        <Badge
          position="absolute"
          top="1.5"
          right="calc(50% - 16px)"
          colorScheme="red"
          borderRadius="full"
          fontSize="2xs"
          minW="4.5"
          h="4.5"
          display="flex"
          alignItems="center"
          justifyContent="center"
          lineHeight="1"
        >
          {badge >= 10 ? "9+" : badge}
        </Badge>
      )}
    </Box>
  );
}

export default function MobileBottomNav() {
  useRootPadding({ bottom: "var(--chakra-sizes-14)" });
  const account = useActiveAccount();
  const drawer = useDisclosure();
  const unreadCount = useUnreadNotificationCount();

  return (
    <>
      <Box
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        zIndex="modal"
        hideFrom="md"
      >
        <Flex
          gap="1"
          pt="2"
          px="2"
          pb="calc(var(--chakra-space-2) + var(--safe-bottom))"
          position="relative"
          alignItems="center"
          bg="chakra-body-bg"
          borderTopWidth="1px"
          borderTopColor="chakra-border-color"
        >
          {account ? (
              <UserAvatar pubkey={account.pubkey} size="sm" onClick={drawer.onOpen} noProxy />
            ) : (
              <Avatar size="sm" src="/apple-touch-icon.png" onClick={drawer.onOpen} cursor="pointer" />
            )}
            <NavTab to="/" icon={<NotesIcon boxSize={6} />} label="Home" />
            <NavTab to="/search" icon={<SearchIcon boxSize={6} />} label="Search" />
            <IconButton
              as={RouterLink}
              icon={<PlusCircleIcon boxSize={6} />}
              aria-label="Create new"
              title="Create new"
              variant="solid"
              colorScheme="primary"
              size="md"
              borderRadius="full"
              to="/new"
              boxShadow="0 0 16px var(--chakra-colors-primary-500)"
            />
            <NavTab to="/messages" icon={<DirectMessagesIcon boxSize={5} />} label="Messages" />
            <NavTab to="/notifications" icon={<NotificationsIcon boxSize={5} />} label="Notifications" badge={unreadCount} />
        </Flex>
      </Box>
      <NavDrawer isOpen={drawer.isOpen} onClose={drawer.onClose} />
    </>
  );
}
