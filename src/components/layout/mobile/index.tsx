import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Box, Spinner } from "@chakra-ui/react";

import MobileBottomNav from "./bottom-nav";
import MobileTopBar from "./top-bar";
import { ErrorBoundary } from "../../error-boundary";
import SupportPaywall from "../components/support-paywall";

export default function MobileLayout() {
  return (
    <>
      <SupportPaywall />
      <MobileTopBar />
      <Box
        sx={{
          "@media (max-width: 47.99em)": {
            mt: "calc(-1 * var(--safe-top, 0px) - 2.5rem)",
            pt: "calc(var(--safe-top, 0px) + 2.5rem)",
          },
        }}
      >
        <Suspense fallback={<Spinner />}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Suspense>
      </Box>
      <MobileBottomNav />
    </>
  );
}
