import { Box, Flex, Heading, IconButton, Image } from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { useDisclosure } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";

import { ArcBackground } from "../../arc-background";
import UserAvatar from "../../user/user-avatar";
import NavDrawer from "./nav-drawer";

export default function MobileTopBar() {
  const account = useActiveAccount();
  const drawer = useDisclosure();

  return (
    <>
      <Box
        position="sticky"
        top="0"
        zIndex="20"
        hideFrom="md"
      >
        <Box position="relative">
          <div className="glass-blur">
            <ArcBackground variant="down" />
          </div>
          <Box
            position="relative"
            zIndex={1}
            pt="var(--safe-top)"
          >
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              h="var(--safe-top)"
              bg="chakra-body-bg"
            />
            <Flex
              h="10"
              px="3"
              alignItems="center"
              justifyContent="space-between"
            >
              {account ? (
                <UserAvatar
                  pubkey={account.pubkey}
                  size="sm"
                  noProxy
                  onClick={drawer.onOpen}
                  cursor="pointer"
                />
              ) : (
                <IconButton
                  aria-label="Menu"
                  icon={<HamburgerIcon boxSize={5} />}
                  variant="ghost"
                  borderRadius="full"
                  onClick={drawer.onOpen}
                />
              )}
              <Flex alignItems="center" gap="2">
                <Image src="/transparent.png" boxSize="6" alt="moStard" borderRadius="full" />
                <Heading size="xs" fontWeight="bold">moStard</Heading>
              </Flex>
              <Box w="10" />
            </Flex>
          </Box>
        </Box>
      </Box>
      <NavDrawer isOpen={drawer.isOpen} onClose={drawer.onClose} />
    </>
  );
}
