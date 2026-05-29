import { useContext } from "react";
import { Badge, Box, Button, ComponentWithAs, IconButton, IconButtonProps, IconProps } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";

import { CollapsedContext } from "../context";

function BadgePill({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Badge
      colorScheme="red"
      borderRadius="full"
      fontSize="xs"
      minW="5"
      h="5"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}

export default function NavItem({
  to,
  icon: Icon,
  label,
  colorScheme,
  variant,
  badge,
}: {
  to: string;
  icon: ComponentWithAs<"svg", IconProps>;
  label: string;
  colorScheme?: IconButtonProps["colorScheme"];
  variant?: IconButtonProps["variant"];
  badge?: number;
}) {
  const collapsed = useContext(CollapsedContext);
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + "/");

  if (collapsed)
    return (
      <Box position="relative" display="flex" justifyContent="center" px="1">
        <IconButton
          as={RouterLink}
          aria-label={label}
          title={label}
          icon={<Icon boxSize={5.5} />}
          fontSize="24"
          variant="ghost"
          to={to}
          flexShrink={0}
          color={isActive ? "primary.500" : "chakra-subtle-text"}
          _dark={{
            color: isActive ? "primary.400" : "whiteAlpha.600",
            bg: isActive ? "whiteAlpha.100" : "transparent",
          }}
          bg={isActive ? "primary.50" : "transparent"}
          borderRadius="xl"
        />
        {!!badge && badge > 0 && (
          <Badge
            position="absolute"
            top="0"
            right="0"
            colorScheme="red"
            borderRadius="full"
            fontSize="xs"
            minW="4"
            h="4"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {badge > 99 ? "99+" : badge}
          </Badge>
        )}
      </Box>
    );

  return (
    <Box px="1">
      <Button
        as={RouterLink}
        aria-label={label}
        title={label}
        leftIcon={<Icon boxSize={5} />}
        variant="ghost"
        p="2.5"
        justifyContent="flex-start"
        to={to}
        flexShrink={0}
        w="full"
        fontSize="sm"
        fontWeight={isActive ? "semibold" : "normal"}
        color={isActive ? "primary.500" : "chakra-body-text"}
        _dark={{
          color: isActive ? "primary.400" : undefined,
          bg: isActive ? "whiteAlpha.100" : "transparent",
        }}
        bg={isActive ? "primary.50" : "transparent"}
        borderRadius="xl"
        rightIcon={badge && badge > 0 ? <BadgePill count={badge} /> : undefined}
      >
        {label}
      </Button>
    </Box>
  );
}
