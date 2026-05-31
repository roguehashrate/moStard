import type { MouseEventHandler } from "react";
import {
  Avatar,
  ButtonGroup,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  type DrawerProps,
  Flex,
  Text,
  Image,
} from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";

import AccountSwitcher from "../components/account-switcher";
import NavItems from "../components";
import { CollapsedContext } from "../context";
import RelayConnectionButton from "../components/connections-button";
import PublishLogButton from "../components/publish-log-button";
import SupportButton from "~/components/support-button";

export default function NavDrawer({ onClose, ...props }: Omit<DrawerProps, "children">) {
  const account = useActiveAccount();

  const handleClickItem: MouseEventHandler = (e) => {
    if (e.target instanceof HTMLAnchorElement || e.target instanceof HTMLButtonElement) {
      onClose();
    }
  };

  return (
    <Drawer placement="left" onClose={onClose} {...props}>
      <DrawerOverlay />
      <DrawerContent borderRadius="2xl" mx="2" my="2" className="glass-blur-strong">
        <CollapsedContext.Provider value={false}>
          <DrawerBody
            display="flex"
            flexDirection="column"
            px="4"
            pt="4"
            overflowY="auto"
            overflowX="hidden"
            gap="2"
            onClick={handleClickItem}
          >
            <Flex gap="3" px="1" alignItems="center" mb="2">
              <Avatar src="/apple-touch-icon.png" size="md" borderRadius="2xl" />
              {!account && (
                <Text fontWeight="bold" fontSize="lg">moStard</Text>
              )}
            </Flex>
            <AccountSwitcher />
            <NavItems />
            <ButtonGroup variant="ghost" onClick={onClose}>
              <RelayConnectionButton w="full" borderRadius="xl" />
              <PublishLogButton flexShrink={0} />
            </ButtonGroup>
            <SupportButton />
          </DrawerBody>
        </CollapsedContext.Provider>
      </DrawerContent>
    </Drawer>
  );
}
