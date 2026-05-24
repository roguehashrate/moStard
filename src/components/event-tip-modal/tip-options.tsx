import { Button, Flex } from "@chakra-ui/react";

import useAppSettings from "../../hooks/use-user-app-settings";
import PaytoIcon from "../payment/payto-icon";

export default function CustomTipAmountOptions({
  onSelect,
  paymentType = "",
}: {
  onSelect: (value: number) => void;
  paymentType?: string;
}) {
  const { customZapAmounts } = useAppSettings();

  return (
    <Flex gap="2" alignItems="center" wrap="wrap">
      {customZapAmounts
        .split(",")
        .map((v) => Number.parseFloat(v))
        .map((amount) => (
          <Button
            key={amount}
            onClick={() => onSelect(amount)}
            leftIcon={<PaytoIcon type={paymentType} />}
            variant="solid"
            size="sm"
            isDisabled={false}
          >
            {amount}
          </Button>
        ))}
    </Flex>
  );
}
