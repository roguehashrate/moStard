import { Avatar, Box, Flex, IconButton, useDisclosure } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { Link as RouterLink, useLocation } from "react-router-dom";

import { NotesIcon, SearchIcon, PlusCircleIcon, NotificationsIcon, ProfileIcon } from "../../icons";
import useRootPadding from "../../../hooks/use-root-padding";
import useUnreadNotificationCount from "../../../hooks/use-unread-notification-count";
import UserAvatar from "../../user/user-avatar";
import NavDrawer from "./nav-drawer";

function NavTab({
  to,
  icon,
  badge,
}: {
  to: string;
  icon: React.ReactElement;
  badge?: number;
}) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <Box position="relative" flex="1" display="flex" justifyContent="center" alignItems="center">
      <Box
        as={RouterLink}
        to={to}
        display="flex"
        alignItems="center"
        justifyContent="center"
        minW="44px"
        minH="44px"
        color={isActive ? "primary.500" : "chakra-subtle-text"}
        _dark={{ color: isActive ? "primary.400" : "#5C5C5E" }}
      >
        {icon}
      </Box>
      {badge !== undefined && badge > 0 && (
        <Box
          position="absolute"
          top="6px"
          right="calc(50% - 14px)"
          w="8px"
          h="8px"
          borderRadius="full"
          bg="#FF3B30"
        />
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
        zIndex="banner"
        hideFrom="md"
        bg="chakra-body-bg"
      >
        <Flex
          h="56px"
          px="2"
          pb="var(--safe-bottom)"
          alignItems="center"
          justifyContent="space-around"
        >
          <NavTab to="/" icon={<NotesIcon boxSize={6} />} />
          <NavTab to="/search" icon={<SearchIcon boxSize={6} />} />

          <IconButton
            as={RouterLink}
            icon={<PlusCircleIcon boxSize={7} />}
            aria-label="New post"
            title="New post"
            variant="ghost"
            colorScheme="primary"
            size="lg"
            borderRadius="full"
            to="/new"
            minW="48px"
            minH="48px"
            mt="-12px"
            bg="chakra-body-bg"
            boxShadow="lg"
            zIndex="1"
          />

          <NavTab to="/notifications" icon={<NotificationsIcon boxSize={5} />} badge={unreadCount} />

          <Box flex="1" display="flex" justifyContent="center" alignItems="center" minW="44px" minH="44px">
            {account ? (
              <UserAvatar
                pubkey={account.pubkey}
                size="sm"
                onClick={drawer.onOpen}
                noProxy
                cursor="pointer"
              />
            ) : (
              <Box
                as={RouterLink}
                to="/settings"
                display="flex"
                alignItems="center"
                justifyContent="center"
                minW="44px"
                minH="44px"
                color="chakra-subtle-text"
                _dark={{ color: "#5C5C5E" }}
              >
                <ProfileIcon boxSize={6} />
              </Box>
            )}
          </Box>
        </Flex>
      </Box>
      <NavDrawer isOpen={drawer.isOpen} onClose={drawer.onClose} />
    </>
  );
}
