import { Box, ComponentWithAs, Flex, FlexProps } from "@chakra-ui/react";
import useScrollRestoreRef from "../hooks/use-scroll-restore";

const VerticalPageLayout: ComponentWithAs<"div", FlexProps> = ({ children, ...props }: FlexProps) => {
  const ref = useScrollRestoreRef();

  return (
    <Box
      overflowX="hidden"
      overflowY="auto"
      h="full"
      w="full"
      ref={ref}
      tabIndex={0}
      aria-label="Main content"
    >
      <Flex
        direction="column"
        pb="calc(var(--safe-bottom-nav) + var(--chakra-space-4))"
        w="full"
        role="main"
        aria-live="polite"
        {...props}
      >
        {children}
      </Flex>
    </Box>
  );
};

export default VerticalPageLayout;
