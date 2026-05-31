import { useState, useEffect, useRef, useCallback } from "react";
import { Flex, Input, Select, Checkbox, ModalHeader, Text, type CardProps } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import type { NostrEvent } from "nostr-tools";
import useAppSettings from "../../hooks/use-user-app-settings";
import CustomTipAmountOptions from "./tip-options";
import { InvoiceModalContent } from "../invoice-modal";
import { WarningIcon } from "@chakra-ui/icons";
import { EmbedEventCard } from "../embed-event/card";
import { getCoingeckoId, getPaytoTypeInfo } from "../../helpers/payto-types";

const DEBOUNCE_TIME = 600;

const CURRENCIES = {
  eur: { s: "€" },
  usd: { s: "$" },
  btc: { s: "฿" },
  aed: { s: "" },
  ars: { s: "" },
  aud: { s: "" },
  bdt: { s: "" },
  bhd: { s: "" },
  brl: { s: "" },
  bmd: { s: "" },
  cad: { s: "" },
  chf: { s: "" },
  clp: { s: "" },
  cny: { s: "" },
  czk: { s: "" },
  dkk: { s: "" },
  gbp: { s: "" },
  hkd: { s: "" },
  huf: { s: "" },
  idr: { s: "Rp" },
  ils: { s: "" },
  inr: { s: "" },
  jpy: { s: "" },
  krw: { s: "" },
  kwd: { s: "" },
  lkr: { s: "" },
  mmk: { s: "" },
  mxn: { s: "" },
  myr: { s: "" },
  ngn: { s: "" },
  nok: { s: "" },
  nzd: { s: "" },
  php: { s: "" },
  pkr: { s: "" },
  pln: { s: "" },
  rub: { s: "" },
  sar: { s: "" },
  sek: { s: "" },
  sgd: { s: "" },
  thb: { s: "" },
  try: { s: "" },
  twd: { s: "" },
  uah: { s: "" },
  vef: { s: "" },
  vnd: { s: "" },
  zar: { s: "" },
  xdr: { s: "" },
  xag: { s: "" },
  xau: { s: "" },
  sats: { s: "" },
};

const CACHE_TIME = 5 * 60 * 1000;
const REFRESH_INTERVAL = 60 * 1000;
const useCoinPrice = (currency: string, isApiEnabled: boolean, coingeckoId?: string) => {
  const [price, setPrice] = useState(null);
  const cacheRef = useRef({});
  const coinId = coingeckoId || "";

  useEffect(() => {
    if (!isApiEnabled) return;

    const fetchPrice = async () => {
      const now = Date.now();
      const cache = cacheRef.current;
      const cacheKey = `${coinId}-${currency}`;

      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${currency}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const coinData = data[coinId];
        const newPrice = coinData ? coinData[currency] : undefined;
        setPrice(newPrice);
        cache[cacheKey] = { price: newPrice, timestamp: now };
      } catch (error) {
        console.error("Error fetching price:", error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [currency, isApiEnabled, coinId]);

  return price;
};

export type InputStepProps = {
  pubkey?: string;
  event?: NostrEvent;
  initialComment?: string;
  initialAmount?: number;
  defaultAmount?: number;
  allowComment?: boolean;
  showEmbed?: boolean;
  embedProps?: CardProps;
  address?: string;
  paymentType?: string;
};

export default function InputStep({
  event,
  initialComment,
  initialAmount,
  defaultAmount,
  showEmbed = true,
  embedProps,
  address,
  paymentType = "",
}: InputStepProps) {
  const { customZapAmounts } = useAppSettings();
  const [isApiEnabled, setIsApiEnabled] = useState(false);
  const coingeckoId = getCoingeckoId(paymentType);
  const paytoInfo = getPaytoTypeInfo(paymentType);
  const coinLabel = paytoInfo?.symbol || paymentType.toUpperCase();

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<{
    comment: string;
    cryptoAmount: number;
    fiatAmount: number;
    currency: string;
  }>({
    mode: "onBlur",
    defaultValues: {
      cryptoAmount: defaultAmount ?? initialAmount ?? (Number.parseFloat(customZapAmounts.split(",")[0]) || 0),
      fiatAmount: 0,
      currency: "usd",
      comment: initialComment ?? "",
    },
  });

  const selectedCurrency = watch("currency");
  const watchedCryptoAmount = watch("cryptoAmount");
  const price = useCoinPrice(selectedCurrency, isApiEnabled, coingeckoId);

  const useDebouncedCallback = (callback: (arg: number) => void, delay: number) => {
    const timeoutRef = useRef();
    return useCallback(
      (arg: number) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        // @ts-ignore
        timeoutRef.current = setTimeout(() => callback(arg), delay);
      },
      [callback, delay],
    );
  };

  const updateFiat = useCallback(
    (crypto: number) => {
      if (isApiEnabled && price && !Number.isNaN(crypto)) {
        const fiatAmount = (crypto * price).toFixed(2);
        setValue("fiatAmount", Number(fiatAmount));
      }
    },
    [isApiEnabled, price, setValue],
  );
  const debouncedUpdateFiat = useDebouncedCallback(updateFiat, DEBOUNCE_TIME);

  const updateCrypto = useCallback(
    (fiat: number) => {
      if (price && !Number.isNaN(fiat)) {
        const cryptoAmount = (fiat / price).toFixed(4);
        setValue("cryptoAmount", Number(cryptoAmount));
      }
    },
    [price, setValue],
  );
  const debouncedUpdateCrypto = useDebouncedCallback(updateCrypto, DEBOUNCE_TIME);

  useEffect(() => {
    if (!isApiEnabled || !price) return;

    if (watchedCryptoAmount) {
      const fiatAmount = Number((watchedCryptoAmount * price).toFixed(2));
      setValue("fiatAmount", fiatAmount);
    }
  }, [price, watchedCryptoAmount, isApiEnabled, setValue]);

  const cryptoRegister = register("cryptoAmount", {
    valueAsNumber: true,
  });
  const fiatRegister = register("fiatAmount", {
    valueAsNumber: true,
  });

  if (!address) {
    return (
      <Flex gap="4" direction="column">
        {showEmbed && event && <EmbedEventCard event={event} {...embedProps} />}

        <ModalHeader px="0" pb="0" pt="4">
          Tried to send a tip, but couldn't find a payment address in your friend's profile!
        </ModalHeader>
        <Text>You might want to ask your friend to add one. Or send a message to request the address.</Text>
        {/* TODO: send message from here */}

        <WarningIcon boxSize={"max"} px="40" py="20" />
      </Flex>
    );
  }

  return (
    <Flex gap="4" direction="column">
      {showEmbed && event && <EmbedEventCard event={event} {...embedProps} />}

      <InvoiceModalContent
        address={address}
        amount={watch("cryptoAmount")}
        paymentType={paymentType}
        onPaid={() => {}}
      />

      {defaultAmount ? null : (
        <>
          <CustomTipAmountOptions
            onSelect={(amount) => setValue("cryptoAmount", amount, { shouldDirty: true })}
            paymentType={paymentType}
          />

          <Flex gap="2" alignItems="center">
            {coinLabel}
            <Input
              type="number"
              placeholder={`Custom amount ${coinLabel}`}
              step={0.0001}
              isInvalid={!!errors.cryptoAmount}
              {...cryptoRegister}
              onChange={(e) => {
                cryptoRegister.onChange(e);
                const crypto = Number(e.target.value);
                debouncedUpdateFiat(crypto);
              }}
            />
          </Flex>

          {coingeckoId && (
            <>
              <Flex
                gap="2"
                alignItems="center"
                bg="glass-bg"
                borderRadius="xl"
                px="4"
                py="3"
                borderWidth="1px"
                borderColor="chakra-border-color"
                transition="all 0.15s"
                _hover={{ borderColor: "primary.400" }}
              >
                <Checkbox
                  isChecked={isApiEnabled}
                  onChange={(e) => setIsApiEnabled(e.target.checked)}
                  size="lg"
                  colorScheme="primary"
                >
                  Enable CoinGecko API for fiat currency rates
                </Checkbox>
              </Flex>

              {isApiEnabled && (
                <Flex gap="2" alignItems="center">
                  <Select flex={1} w="sm" {...register("currency")}>
                    {Object.keys(CURRENCIES).map((code) => (
                      <option key={code} value={code}>
                        {code.toUpperCase()}
                      </option>
                    ))}
                  </Select>

                  <Input
                    flex={3}
                    type="number"
                    placeholder={`Custom amount ${selectedCurrency.toUpperCase()}`}
                    step={0.01}
                    isInvalid={!!errors.fiatAmount}
                    {...fiatRegister}
                    onChange={(e) => {
                      fiatRegister.onChange(e);
                      const fiat = Number(e.target.value);
                      debouncedUpdateCrypto(fiat);
                    }}
                  />
                </Flex>
              )}
            </>
          )}
        </>
      )}
    </Flex>
  );
}
