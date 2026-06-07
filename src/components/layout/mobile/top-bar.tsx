import { Box, Image } from "@chakra-ui/react";

export default function MobileTopBar() {
  return (
    <Box
      position="sticky"
      top="0"
      zIndex="20"
      hideFrom="md"
      bg="chakra-body-bg"
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        pt="var(--safe-top)"
        pb="3"
        px="4"
      >
        <Image src="/transparent.png" boxSize="9" alt="moStard" borderRadius="full" />
      </Box>
    </Box>
  );
}
