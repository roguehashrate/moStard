import { Global, css } from "@emotion/react";

import { overrideReactTextareaAutocompleteStyles } from "./react-textarea-autocomplete";
import { capacitorScannerStyles } from "./capacitor-scanner";

const styles = css`
  :focus-visible {
    outline: 2px solid var(--chakra-colors-primary-500);
    outline-offset: 2px;
    border-radius: var(--chakra-radii-sm);
  }

  ::selection {
    background-color: var(--chakra-colors-primary-200);
    color: var(--chakra-colors-gray-900);
  }

  * {
    scrollbar-width: none;
  }
  *::-webkit-scrollbar {
    display: none;
  }

  .scrollbar-thin {
    scrollbar-width: thin;
  }
  .scrollbar-thin::-webkit-scrollbar {
    display: block;
    height: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: var(--chakra-colors-chakra-border-color);
    border-radius: 9999px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }

`;

export default function GlobalStyles() {
  return (
    <>
      <Global styles={styles} />
      <Global styles={overrideReactTextareaAutocompleteStyles} />
      <Global styles={capacitorScannerStyles} />
    </>
  );
}
