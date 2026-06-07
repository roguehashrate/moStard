import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Box, Flex, Spinner } from "@chakra-ui/react";

import MobileBottomNav from "./bottom-nav";
import MobileTopBar from "./top-bar";
import { ErrorBoundary } from "../../error-boundary";
import SupportPaywall from "../components/support-paywall";

export default function MobileLayout() {
  return (
    <Flex direction="column" h="full" w="full" hideFrom="md">
      <SupportPaywall />
      <MobileTopBar />
      <Box flex="1" w="full" overflow="hidden">
        <Suspense fallback={<Spinner />}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Suspense>
      </Box>
      <MobileBottomNav />
    </Flex>
  );
}
