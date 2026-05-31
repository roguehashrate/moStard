import { Button, ButtonProps } from "@chakra-ui/react";
import { useMatch, Link as RouterLink } from "react-router-dom";

export default function SimpleNavItem({
  children,
  to,
  ...props
}: Omit<ButtonProps, "variant" | "colorScheme"> & { to: string }) {
  const match = useMatch(to);

   return (
    <Button
      as={RouterLink}
      to={to}
      justifyContent="flex-start"
      flexShrink={0}
      borderRadius="xl"
      transition="all 0.15s"
      _hover={{
        bg: "glass-bg-hover",
        transform: "translateX(2px)",
      }}
      {...props}
      variant="outline"
      colorScheme={match ? "primary" : undefined}
    >
      {children}
    </Button>
  );
}
