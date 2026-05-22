import { Grid, GridItem, Text, VStack } from "@chakra-ui/react";
import { CreateProfile, UpdateProfile } from "applesauce-actions/actions";
import type { ProfileContent } from "applesauce-core/helpers";
import { useActionHub, useActiveAccount, useObservableMemo } from "applesauce-react/hooks";
import { nip19 } from "nostr-tools";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import SimpleView from "../../../components/layout/presets/simple-view";
import useAsyncAction from "../../../hooks/use-async-action";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useUploadFile from "../../../hooks/use-upload-file";
import useUserProfile from "../../../hooks/use-user-profile";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { profileLoader } from "../../../services/loaders";
import localSettings from "../../../services/preferences";
import ProfileEditForm from "./components/profile-edit-form";
import ProfilePreview from "./components/profile-preview";
import { eventStore } from "../../../services/event-store";

export type ProfileFormData = Omit<ProfileContent, "picture" | "banner"> & {
  picture?: string | File;
  banner?: string | File;
  monero?: string;
};

function isLightningAddress(addr: string) {
  const isEmail =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return isEmail.test(addr);
}

export default function ProfileSettingsView() {
  const publish = usePublishEvent();
  const account = useActiveAccount()!;
  const metadata = useUserProfile(account.pubkey);
  const readRelays = useReadRelays();
  const uploadFile = useUploadFile();
  const navigate = useNavigate();
  const [uploadStatus, setUploadStatus] = useState<string>();
  const actions = useActionHub();

  // Form management
  const formMethods = useForm<ProfileFormData>({
    mode: "onBlur",
    defaultValues: metadata,
  });

  // Load a fresh profile metadata to avoid stale data
  useObservableMemo(
    () =>
      profileLoader({
        pubkey: account.pubkey,
        kind: 0,
        cache: false,
        relays: readRelays,
      }),
    [account.pubkey, readRelays],
  );

  // Extract monero address from profile data
  const getMoneroFromProfile = (profile: Record<string, unknown> | null | undefined): string => {
    if (!profile) return "";
    if (profile.payto && Array.isArray(profile.payto)) {
      for (const entry of profile.payto) {
        if (typeof entry === "string" && entry.startsWith("payto://monero/")) {
          return entry.replace("payto://monero/", "");
        }
        if (typeof entry === "object" && entry !== null) {
          const e = entry as Record<string, unknown>;
          if (typeof e.uri === "string" && e.uri.startsWith("payto://monero/")) {
            return e.uri.replace("payto://monero/", "");
          }
        }
      }
    }
    const crypto = profile.cryptocurrency_addresses as Record<string, unknown> | undefined;
    if (crypto?.monero && typeof crypto.monero === "string") return crypto.monero;
    if (profile.monero && typeof profile.monero === "string") return profile.monero;
    return "";
  };

  // Reset form when metadata changes
  useEffect(() => {
    if (metadata) {
      const resetData = { ...metadata, monero: getMoneroFromProfile(metadata as Record<string, unknown>) };
      formMethods.reset(resetData as ProfileFormData);
    }
  }, [metadata, formMethods]);

  const { run: handleSubmit, loading } = useAsyncAction(
    async (update: ProfileFormData) => {
      try {
        const newMetadata: ProfileContent = {
          name: update.name,
          about: update.about,
          website: update.website,
        };

        // Upload files if selected
        if (update.picture) {
          if (typeof update.picture === "string") {
            newMetadata.picture = update.picture;
          } else {
            setUploadStatus("Uploading profile picture...");
            const uploadResult = await uploadFile.run(update.picture);
            if (uploadResult) newMetadata.picture = uploadResult.url;
          }
        }

        if (update.banner) {
          if (typeof update.banner === "string") {
            newMetadata.banner = update.banner;
          } else {
            setUploadStatus("Uploading banner image...");
            const uploadResult = await uploadFile.run(update.banner);
            if (uploadResult) newMetadata.banner = uploadResult.url;
          }
        }

        setUploadStatus("Creating profile event...");

        if (update.display_name !== undefined) newMetadata.displayName = newMetadata.display_name = update.display_name;
        if (update.about !== undefined) newMetadata.about = update.about;
        if (update.website !== undefined) newMetadata.website = update.website;
        if (update.nip05 !== undefined) newMetadata.nip05 = update.nip05;

        if (update.monero !== undefined) {
          const addr = update.monero.trim();
          if (addr) {
            (newMetadata as Record<string, unknown>)["monero"] = addr;
            const profileMeta = metadata as Record<string, unknown>;
            (newMetadata as Record<string, unknown>)["cryptocurrency_addresses"] = {
              ...((profileMeta?.cryptocurrency_addresses || {}) as Record<string, unknown>),
              monero: addr,
            };
            const existingPayto = (profileMeta?.payto || []) as string[];
            const paytoArr = [
              ...existingPayto.filter((p: string) => typeof p === "string" && !p.startsWith("payto://monero/")),
              `payto://monero/${addr}`,
            ];
            (newMetadata as Record<string, unknown>)["payto"] = paytoArr;
          }
        }

        setUploadStatus("Signing and publishing...");
        if (eventStore.hasReplaceable(0, account.pubkey)) {
          await actions
            .exec(UpdateProfile, newMetadata)
            .forEach((e) => publish("Update profile", e, localSettings.lookupRelays.value));
        } else {
          await actions
            .exec(CreateProfile, newMetadata)
            .forEach((e) => publish("Create profile", e, localSettings.lookupRelays.value));
        }

        // Navigate to user profile
        const npub = nip19.npubEncode(account.pubkey);
        navigate(`/u/${npub}`);
      } finally {
        setUploadStatus(undefined);
      }
    },
    [uploadFile, actions, publish, navigate, account.pubkey],
  );

  return (
    <SimpleView title="Edit Profile" maxW="6xl" center>
      <FormProvider {...formMethods}>
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
          {/* Form */}
          <GridItem>
            <ProfileEditForm onSubmit={handleSubmit} loading={loading} uploadStatus={uploadStatus} />
          </GridItem>

          {/* Preview */}
          <GridItem>
            <VStack spacing={4} align="stretch" position="sticky" top={4}>
              <Text fontSize="lg" fontWeight="semibold">
                Preview
              </Text>
              <ProfilePreview />
            </VStack>
          </GridItem>
        </Grid>
      </FormProvider>
    </SimpleView>
  );
}
