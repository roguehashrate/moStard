import { LinkOverlay } from "@chakra-ui/react";
import styled from "@emotion/styled";

const HoverLinkOverlay = styled(LinkOverlay)`
  &:before {
    z-index: 1;
    border-radius: var(--chakra-radii-2xl);
  }
  &:hover:before {
    background-color: var(--chakra-colors-card-hover-overlay);
  }
`;

export default HoverLinkOverlay;
