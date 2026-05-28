import { useState, useCallback, useEffect } from "react";
import {
  Flex,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  FormErrorMessage,
  Heading,
  Button,
  Switch,
  Text,
  Alert,
  AlertIcon,
  Code,
  Box,
} from "@chakra-ui/react";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import { BackIconButton } from "../../../components/router/back-button";
import useSettingsForm from "../use-settings-form";
import useAppSettings from "../../../hooks/use-user-app-settings";
import { nwcManager } from "../../../services/nwc-manager";

export default function PaymentSettings() {
  const { register, submit, formState, watch, setValue } = useSettingsForm();
  const enableAlternativePayments = watch("enableAlternativePayments");
  const nwcEnabled = watch("nwcEnabled");
  const [nwcStatus, setNwcStatus] = useState(nwcManager.status);
  const [nwcError, setNwcError] = useState<string | null>(nwcManager.error);
  const [nwcBalance, setNwcBalance] = useState<number | null>(nwcManager.balance);

  const nwcConnectionString = watch("nwcConnectionString");
  const [showSecret, setShowSecret] = useState(false);

  const handleNWCConnect = useCallback(() => {
    if (nwcManager.status === "connected") {
      nwcManager.disconnect();
    } else {
      nwcManager.connect(nwcConnectionString);
    }
  }, [nwcConnectionString]);

  useEffect(() => {
    const subStatus = nwcManager.status$.subscribe(setNwcStatus);
    const subError = nwcManager.error$.subscribe(setNwcError);
    const subBalance = nwcManager.balance$.subscribe(setNwcBalance);
    return () => {
      subStatus.unsubscribe();
      subError.unsubscribe();
      subBalance.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (nwcStatus === "connected") {
      nwcManager.checkBalance();
    }
  }, [nwcStatus]);

  return (
    <VerticalPageLayout as="form" onSubmit={submit} flex={1}>
      <Flex gap="2" alignItems="center">
        <BackIconButton />
        <Heading size="md">Payment Settings</Heading>
      </Flex>
      <Flex direction="column" gap="4">
        <FormControl display="flex" alignItems="center" justifyContent="space-between">
          <Flex direction="column">
            <FormLabel htmlFor="enableAlternativePayments" mb="0">
              Enable alternative payment methods
            </FormLabel>
            <FormHelperText>
              When enabled, non-Monero payment targets (Bitcoin, Lightning, etc.) will be shown on profiles and notes
            </FormHelperText>
          </Flex>
          <Switch
            id="enableAlternativePayments"
            isChecked={enableAlternativePayments}
            onChange={(e) => setValue("enableAlternativePayments", e.target.checked, { shouldDirty: true })}
          />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="customZapAmounts" mb="0">
            Tipping Amounts
          </FormLabel>
          <Input
            id="customZapAmounts"
            maxW="sm"
            autoComplete="off"
            {...register("customZapAmounts", {
              validate: (v) => {
                if (!/^[\d.,]*$/.test(v)) return "Must be a list of comma separated numbers";
                return true;
              },
            })}
          />
          {formState.errors.customZapAmounts && (
            <FormErrorMessage>{formState.errors.customZapAmounts.message}</FormErrorMessage>
          )}
          <FormHelperText>
            <span>Comma separated list of quick amounts for tipping other users</span>
          </FormHelperText>
        </FormControl>

        <Box borderTop="1px" borderColor="chakra-border-color" pt="4">
          <Heading size="sm" mb="4">
            Lightning Zaps (NWC)
          </Heading>

          <FormControl>
            <FormLabel htmlFor="nwcConnectionString" mb="0">
              NWC Connection String
            </FormLabel>
            <Flex gap="2">
              <Input
                id="nwcConnectionString"
                maxW="lg"
                autoComplete="off"
                type={showSecret ? "text" : "password"}
                placeholder="nostr+wallet://..."
                {...register("nwcConnectionString")}
              />
              <Button size="sm" variant="outline" onClick={() => setShowSecret(!showSecret)} flexShrink={0}>
                {showSecret ? "Hide" : "Show"}
              </Button>
            </Flex>
            <FormHelperText>
              Paste your NWC connection string from a Lightning wallet (e.g. Alby, Mutiny). This is stored in your synced settings.
            </FormHelperText>
          </FormControl>

          <Flex gap="2" mt="2" alignItems="center">
            <Button
              size="sm"
              colorScheme={nwcStatus === "connected" ? "red" : "primary"}
              onClick={handleNWCConnect}
              isDisabled={!nwcConnectionString}
            >
              {nwcStatus === "connected" ? "Disconnect" : "Connect"}
            </Button>
            {nwcStatus === "connected" && (
              <Button size="sm" variant="outline" onClick={() => nwcManager.checkBalance()}>
                Refresh Balance
              </Button>
            )}
            <Flex gap="2" alignItems="center">
              {nwcStatus === "connecting" && (
                <Text fontSize="sm" color="yellow.400">
                  Connecting...
                </Text>
              )}
              {nwcStatus === "connected" && (
                <>
                  <Text fontSize="sm" color="green.400">
                    Connected
                  </Text>
                  {nwcBalance !== null && (
                    <Code fontSize="sm">{nwcBalance.toLocaleString()} sats</Code>
                  )}
                </>
              )}
              {nwcStatus === "error" && nwcError && (
                <Text fontSize="sm" color="red.400">
                  {nwcError}
                </Text>
              )}
            </Flex>
          </Flex>

          {nwcStatus === "connected" && (
            <FormControl display="flex" alignItems="center" justifyContent="space-between" mt="4">
              <Flex direction="column">
                <FormLabel htmlFor="nwcEnabled" mb="0">
                  Enable Lightning Zaps
                </FormLabel>
                <FormHelperText>
                  When enabled and alternative payments are on, a Zap button will appear on notes/profiles for Lightning-using users
                </FormHelperText>
              </Flex>
              <Switch
                id="nwcEnabled"
                isChecked={nwcEnabled}
                onChange={(e) => setValue("nwcEnabled", e.target.checked, { shouldDirty: true })}
              />
            </FormControl>
          )}

          {nwcStatus === "connected" && nwcEnabled && enableAlternativePayments && (
            <Alert status="success" mt="2" fontSize="sm">
              <AlertIcon />
              Zaps are ready! Zap buttons will appear on notes/profiles from users with Lightning addresses.
            </Alert>
          )}

          {nwcStatus === "connected" && (
            <FormControl>
              <FormLabel htmlFor="zapAmounts" mb="0">
                Zap Amounts (sats)
              </FormLabel>
              <Input
                id="zapAmounts"
                maxW="sm"
                autoComplete="off"
                {...register("zapAmounts", {
                  validate: (v) => {
                    if (!/^[\d,]*$/.test(v)) return "Must be a list of comma separated numbers";
                    return true;
                  },
                })}
              />
              {formState.errors.zapAmounts && (
                <FormErrorMessage>{formState.errors.zapAmounts.message}</FormErrorMessage>
              )}
              <FormHelperText>
                Comma separated list of quick amounts in sats for zapping other users
              </FormHelperText>
            </FormControl>
          )}
        </Box>
      </Flex>
      <Button
        ml="auto"
        isLoading={formState.isLoading || formState.isValidating || formState.isSubmitting}
        isDisabled={!formState.isDirty}
        colorScheme="primary"
        type="submit"
      >
        Save Settings
      </Button>
    </VerticalPageLayout>
  );
}
