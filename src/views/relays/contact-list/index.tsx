import { Button, Flex, Heading, Link, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { Link as RouterLink } from "react-router-dom";
import { EventTemplate } from "nostr-tools";
import dayjs from "dayjs";

import RelayFavicon from "../../../components/relay-favicon";
import useUserContactRelays from "../../../hooks/use-user-contact-relays";
import { CheckIcon } from "../../../components/icons";
import { useCallback, useState } from "react";
import useUserContactList from "../../../hooks/use-user-contact-list";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import SimpleView from "../../../components/layout/presets/simple-view";
import ConfirmDialog from "../../../components/confirm-dialog";

export default function ContactListRelaysView() {
  const account = useActiveAccount();
  const contacts = useUserContactList(account?.pubkey);
  const relays = useUserContactRelays(account?.pubkey);
  const publish = usePublishEvent();
  const clearDialog = useDisclosure();

  const [loading, setLoading] = useState(false);
  const clearRelays = useCallback(async () => {
    if (!contacts) return;
    clearDialog.onClose();

    const draft: EventTemplate = {
      kind: contacts.kind,
      content: "",
      tags: contacts.tags,
      created_at: dayjs().unix(),
    };

    setLoading(true);
    await publish("Clear Relays", draft);
    setLoading(false);
  }, [setLoading, contacts, publish, clearDialog]);

  if (relays === undefined) return <Spinner />;

  return (
    <SimpleView
      title="Contact list relays"
      actions={
        relays && (
          <Button colorScheme="red" onClick={clearDialog.onOpen} isLoading={loading} ml="auto" size="sm">
            Clear Relays
          </Button>
        )
      }
    >
      <Text fontStyle="italic" mt="-2">
        Some apps store relays in your contacts list (kind-3)
        <br />
        moStard does not use these relays, instead it uses your{" "}
        <Link as={RouterLink} to="/relays/mailboxes" color="blue.500">
          Mailbox Relays
        </Link>
      </Text>

      {relays === null ? (
        <Text color="green.500" fontSize="lg" mt="4">
          <CheckIcon /> You don't have any relays stored in your contact list
        </Text>
      ) : (
        <>
          <Heading size="md" mt="2">
            Read Relays
          </Heading>
          {relays.inbox.map((relay) => (
            <Flex key={relay} gap="2" alignItems="center" overflow="hidden">
              <RelayFavicon relay={relay} size="xs" />
              <Link as={RouterLink} to={`/relays/${encodeURIComponent(relay)}`} isTruncated>
                {relay}
              </Link>
            </Flex>
          ))}

          <Heading size="md" mt="2">
            Write Relays
          </Heading>
          {relays.outbox.map((relay) => (
            <Flex key={relay} gap="2" alignItems="center" overflow="hidden">
              <RelayFavicon relay={relay} size="xs" />
              <Link as={RouterLink} to={`/relays/${encodeURIComponent(relay)}`} isTruncated>
                {relay}
              </Link>
            </Flex>
          ))}
        </>
      )}
      <ConfirmDialog
        isOpen={clearDialog.isOpen}
        onClose={clearDialog.onClose}
        onConfirm={clearRelays}
        title="Clear contact list relays?"
        description="Other Nostr apps may be affected if they rely on these relays. Are you sure you want to remove them?"
        confirmText="Clear Relays"
        colorScheme="red"
      />
    </SimpleView>
  );
}
