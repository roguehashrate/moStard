import { useState } from "react";
import { ButtonGroup, Flex, type FlexProps, IconButton, Text, Image, Heading, LinkOverlay, Box, Divider } from "@chakra-ui/react";

import { ChevronLeftIcon, ChevronRightIcon } from "../../icons";
import NavItems from "../components";
import useRootPadding from "../../../hooks/use-root-padding";
import AccountSwitcher from "../components/account-switcher";
import { CollapsedContext } from "../context";
import RelayConnectionButton from "../components/connections-button";
import PublishLogButton from "../components/publish-log-button";
import RouterLink from "~/components/router-link";
import SupportButton from "~/components/support-button";

export default function DesktopSideNav({ ...props }: Omit<FlexProps, "children">) {
  const [collapsed, setCollapsed] = useState(false);

  useRootPadding({
    left: collapsed ? "var(--chakra-sizes-16)" : "var(--chakra-sizes-64)",
  });

  return (
    <CollapsedContext.Provider value={collapsed}>
      <Flex
        direction="column"
        gap="1"
        px="2"
        py="3"
        shrink={0}
        borderRightWidth={1}
        borderRightColor="chakra-border-color"
        pt="calc(var(--chakra-space-3) + var(--safe-top))"
        pb="calc(var(--chakra-space-3) + var(--safe-bottom))"
        w={collapsed ? "16" : "64"}
        position="fixed"
        left="0"
        bottom="0"
        top="0"
        zIndex="modal"
        overflowY="auto"
        overflowX="hidden"
        overscroll="none"
        bg="chakra-subtle-bg"
        bgOpacity="0.92"
        transition="width 0.2s ease"
        _scrollbar={{ display: "none" }}
        css={{ "&::-webkit-scrollbar": { width: "0px" } }}
        {...props}
      >
        <Flex gap="3" px="3" alignItems="center" mb="2">
          <Image src="/transparent.png" boxSize="48px" alt="moStard" borderRadius="2xl" />
          {!collapsed && (
            <Box>
              <Heading size="sm" fontWeight="bold" lineHeight="1.2">moStard</Heading>
              <Text fontSize="xs" color="chakra-subtle-text">moStard</Text>
            </Box>
          )}
        </Flex>

        <Divider mb="1" borderColor="chakra-border-color" opacity={0.5} />

        <NavItems />

        <Box mt="auto">
          <AccountSwitcher />
        </Box>

        <Divider my="1" borderColor="chakra-border-color" />

        <ButtonGroup variant="ghost" size="sm" w="full" spacing={1}>
          <IconButton
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(!collapsed)}
            icon={collapsed ? <ChevronRightIcon boxSize={5} /> : <ChevronLeftIcon boxSize={5} />}
            borderRadius="xl"
          />
          {!collapsed && (
            <>
              <RelayConnectionButton w="full" />
              <PublishLogButton flexShrink={0} />
            </>
          )}
        </ButtonGroup>

        {!collapsed && <SupportButton />}

        {!collapsed && (
          <Image src="/xmr-beeg-yoshi.png" mt="1" opacity="0.5" borderRadius="xl" />
        )}
      </Flex>
    </CollapsedContext.Provider>
  );
}
