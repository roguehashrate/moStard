import { ReactNode } from "react";
import { Flex, FlexProps, Heading } from "@chakra-ui/react";

import { BackIconButton } from "../../router/back-button";

export default function SimpleHeader({
  children,
  title,
  icon,
  ...props
}: Omit<FlexProps, "title"> & { title?: ReactNode; icon?: ReactNode }) {
  return (
    <Flex
      px="2"
      pb="2"
      pt="calc(var(--chakra-space-2) + var(--safe-top))"
      borderBottom="1px solid var(--chakra-colors-chakra-border-color)"
      alignItems="center"
      gap="2"
      minH="calc(var(--chakra-sizes-14) + var(--safe-top))"
      position="sticky"
      top="0"
      backgroundColor="var(--chakra-colors-chakra-body-bg)"
      bgOpacity="0.85"
      zIndex="modal"
      className="glass-blur"
      {...props}
    >
      <BackIconButton hideFrom="xl" />
      {icon}
      <Heading fontWeight="bold" size="md" ml={{ base: 0, md: "2" }} whiteSpace="pre" isTruncated>
        {title}
      </Heading>
      {children}
    </Flex>
  );
}
