import { NostrEvent } from "nostr-tools";

export const SOFTWARE_APP_KIND = 32267;

export function getSoftwareAppIdentifier(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "d")?.[1] ?? "";
}

export function getSoftwareAppName(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "name")?.[1] ?? "Untitled App";
}

export function getSoftwareAppSummary(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "summary")?.[1] ?? "";
}

export function getSoftwareAppIcon(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "icon")?.[1];
}

export function getSoftwareAppScreenshots(event: NostrEvent) {
  return event.tags.filter((t) => t[0] === "image").map((t) => t[1]);
}

export function getSoftwareAppTags(event: NostrEvent) {
  return event.tags.filter((t) => t[0] === "t").map((t) => t[1]);
}

export function getSoftwareAppPlatform(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "f")?.[1];
}

export function getSoftwareAppLicense(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "license")?.[1];
}

export function getSoftwareAppRepository(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "repository")?.[1];
}

export function getSoftwareAppUrl(event: NostrEvent) {
  const id = getSoftwareAppIdentifier(event);
  if (id) return `https://zapstore.dev/apps/${id}`;
  const repo = getSoftwareAppRepository(event);
  if (repo) return repo;
  return undefined;
}
