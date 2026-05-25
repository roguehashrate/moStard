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

  if (collapsed)
    return (
      <Box position="relative" display="inline-block">
        <IconButton
          as={RouterLink}
          aria-label={label}
          title={label}
          icon={<Icon boxSize={5} />}
          fontSize="24"
          variant={variant || "ghost"}
          to={to}
          flexShrink={0}
          colorScheme={colorScheme || (location.pathname.startsWith(to) ? "primary" : undefined)}
        />
        {badge && badge > 0 && (
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
  else
    return (
      <Button
        as={RouterLink}
        aria-label={label}
        title={label}
        leftIcon={<Icon boxSize={5} />}
        variant={variant || "link"}
        p="2"
        justifyContent="flex-start"
        colorScheme={colorScheme || (location.pathname.startsWith(to) ? "primary" : undefined)}
        to={to}
        flexShrink={0}
        rightIcon={badge && badge > 0 ? <BadgePill count={badge} /> : undefined}
      >
        {label}
      </Button>
    );
}
