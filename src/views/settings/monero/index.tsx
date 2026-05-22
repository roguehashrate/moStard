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
} from "@chakra-ui/react";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import useSettingsForm from "../use-settings-form";

export default function PaymentSettings() {
  const { register, submit, formState, watch, setValue } = useSettingsForm();
  const enableAlternativePayments = watch("enableAlternativePayments");

  return (
    <VerticalPageLayout as="form" onSubmit={submit} flex={1}>
      <Heading size="md">Payment Settings</Heading>
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
