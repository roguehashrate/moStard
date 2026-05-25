import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Stat,
  StatGroup,
  StatHelpText,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";
import { useAsync } from "react-use";

import Timestamp from "../../../components/timestamp";
import { getPubkeysFromList } from "../../../helpers/nostr/lists";
import useUserContactList from "../../../hooks/use-user-contact-list";
import { useAdditionalRelayContext } from "../../../providers/local/additional-relay";
import trustedUserStatsService from "../../../services/trusted-user-stats";

export default function UserStatsAccordion({ pubkey }: { pubkey: string }) {
  const contextRelays = useAdditionalRelayContext();
  const contacts = useUserContactList({ pubkey, relays: contextRelays });

  const { value: stats } = useAsync(() => trustedUserStatsService.getUserStats(pubkey), [pubkey]);

  return (
    <Accordion allowMultiple p="2">
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" textAlign="left">
              Network Stats
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb="2">
          <StatGroup gap="4" whiteSpace="pre">
            <Stat>
              <StatLabel>Following</StatLabel>
              <StatNumber>{contacts ? getPubkeysFromList(contacts).length : "Unknown"}</StatNumber>
              {contacts && (
                <StatHelpText>
                  Updated <Timestamp timestamp={contacts.created_at} />
                </StatHelpText>
              )}
            </Stat>

            {stats && (
              <>
                <Stat>
                  <StatLabel>Followers</StatLabel>
                  <StatNumber>{stats.followers_pubkey_count || 0}</StatNumber>
                </Stat>

                <Stat>
                  <StatLabel>Notes & replies</StatLabel>
                  <StatNumber>{stats.pub_note_count || 0}</StatNumber>
                </Stat>

                <Stat>
                  <StatLabel>Reactions</StatLabel>
                  <StatNumber>{stats.pub_reaction_count || 0}</StatNumber>
                </Stat>
              </>
            )}
          </StatGroup>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
