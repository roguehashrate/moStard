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
      borderBottom="0.5px solid var(--chakra-colors-chakra-border-color)"
      alignItems="center"
      gap="2"
      minH="calc(var(--chakra-sizes-12) + var(--safe-top))"
      position="sticky"
      top="0"
      bg="chakra-body-bg"
      zIndex="docked"
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
