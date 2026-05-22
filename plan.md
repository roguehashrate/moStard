# NIP-89 `payto:` Payment Targets Implementation

Replace the current Monero-only tipping system with the NIP-89 `payto://` payment targets standard, while keeping Monero as the default and adding a settings toggle to enable other payment types.

## User Review Required

> [!IMPORTANT]
> **Monero stays default.** When `enableAlternativePayments` is `false` (default), only Monero targets are shown on profiles, in tip dialogs, and on note actions. All other payment types are hidden.

> [!IMPORTANT]
> **Settings rename.** The "Monero" settings page will be renamed to **"Payments"** and will contain:
> - The existing tipping amounts config
> - A new toggle: "Enable alternative payment methods" (off by default)
> - The Monero icon stays on the nav item

## Open Questions

> [!NOTE]
> The reference implementation supports ~30+ payment types (PayPal, Venmo, Ko-fi, etc.). For moStard, I plan to support only the **crypto types** initially: Monero, Bitcoin, Lightning, Nano, Ethereum, Litecoin, Dogecoin, Bitcoin Cash, Solana. Should I include fiat/tip services (PayPal, CashApp, Ko-fi, etc.) as well?
Yes do this.

> [!NOTE]
> The reference implementation includes "Open with" wallet app deep links (Cake Wallet, Phoenix, etc.). Should I implement that, or keep it simple with just copy address + QR code + `payto://` URI link?
yes also do this.

## Proposed Changes

### Data Layer — Payment Type Registry

#### [NEW] [payto-types.ts](file:///home/roguehashrate/code/moStard/src/helpers/payto-types.ts)
Static registry of recognized payment types (adapted from reference's `payto-types.json` but as a TypeScript module). Contains:
- Type definitions: `PaytoType` with `label`, `symbol`, `category`, `uriScheme`
- Alias map (e.g. `xmr → monero`, `btc → bitcoin`)
- `getCanonicalPaytoType()`, `getPaytoTypeInfo()`, `isKnownPaytoType()`
- `buildPaytoUri()`, `parsePaytoUri()`
- Export the `PAYTO_URI_REGEX` for content parsing
- Subset of ~10 crypto types initially (not the full 30+ from the reference)

---

### App Settings

#### [MODIFY] [app-settings.ts](file:///home/roguehashrate/code/moStard/src/helpers/app-settings.ts)
- Add `AppSettingsV16` with new field: `enableAlternativePayments: boolean` (default `false`)
- Update `AppSettings` type alias and `DEFAULT_APP_SETTINGS`

---

### Hooks

#### [NEW] [use-user-payment-targets.ts](file:///home/roguehashrate/code/moStard/src/hooks/use-user-payment-targets.ts)
Replaces `use-user-xmr-metadata.ts`. Extracts payment targets from a user's kind 0 metadata:
1. Check `payto` array in profile JSON (NIP-89 standard)
2. Check `cryptocurrency_addresses` object (Garnet standard)
3. Check top-level coin keys (e.g. `monero`, `bitcoin`)
4. Fall back to bio parsing for `XMR: address` style lines
5. Returns `PaymentTarget[]` — array of `{ type, authority, paytoUri }`
6. Respects the `enableAlternativePayments` setting: when `false`, filters to only Monero

#### [NEW] [use-event-payment-targets.ts](file:///home/roguehashrate/code/moStard/src/hooks/use-event-payment-targets.ts)
Replaces `use-event-xmr-address.ts`. For a given event:
1. Gets payment targets from the event author's profile
2. Also scans the event content for Monero addresses (existing behavior)
3. Returns the merged list, filtered by settings

#### [KEEP] [use-user-xmr-metadata.ts](file:///home/roguehashrate/code/moStard/src/hooks/use-user-xmr-metadata.ts)
Keep as-is for backward compatibility (used by support-button). Will internally be a thin wrapper around the new hook, filtering for Monero only.

#### [KEEP] [use-event-xmr-address.ts](file:///home/roguehashrate/code/moStard/src/hooks/use-event-xmr-address.ts)
Keep as-is for backward compatibility. Internally wraps new hook.

---

### Components — Payment Infrastructure

#### [NEW] [payto-icon.tsx](file:///home/roguehashrate/code/moStard/src/components/payment/payto-icon.tsx)
Returns the appropriate Chakra icon for a payment target type. Uses existing Monero icons for `monero`, and Unicode symbols / simple SVG for others (₿ for Bitcoin, ⚡ for Lightning, Ӿ for Nano, etc).

#### [NEW] [payment-target-dialog.tsx](file:///home/roguehashrate/code/moStard/src/components/payment/payment-target-dialog.tsx)
A Chakra Modal that replaces the simple `InvoiceModalContent` for non-Monero types. Shows:
- Payment type label and icon
- The address with copy button
- QR code with appropriate URI scheme (`bitcoin:`, `monero:`, `nano:`, `payto://`)
- "Open in Wallet" button using the coin-specific URI scheme

#### [MODIFY] [invoice-modal.tsx](file:///home/roguehashrate/code/moStard/src/components/invoice-modal.tsx)
- Add a `paymentType` prop (defaults to `"monero"`)
- Build the URI based on the payment type's scheme (e.g. `bitcoin:address`, `monero:address`)
- Pass proper icon flag to QR code component

#### [MODIFY] [event-tip-button.tsx](file:///home/roguehashrate/code/moStard/src/components/tip/event-tip-button.tsx)
- Use `useEventPaymentTargets()` instead of `useEventXMRAddress()`
- Show the button when ANY payment target exists (not just Monero)
- Use the primary payment target's icon (first target — Monero if available)
- Pass payment targets into the tip modal

#### [MODIFY] [event-tip-modal/index.tsx](file:///home/roguehashrate/code/moStard/src/components/event-tip-modal/index.tsx)
- Accept `paymentTargets` prop instead of just `address`
- If multiple targets exist, show a payment method selector (dropdown or tabs)
- Pass selected target to `InputStep`

#### [MODIFY] [event-tip-modal/input-step.tsx](file:///home/roguehashrate/code/moStard/src/components/event-tip-modal/input-step.tsx)
- Accept `paymentType` prop alongside `address`
- Adapt the CoinGecko API call to fetch price for the selected coin type (not just Monero)
- Update the "no address" error message to be generic (not Monero-specific)
- Pass `paymentType` to `InvoiceModalContent`

#### [MODIFY] [event-tip-modal/tip-options.tsx](file:///home/roguehashrate/code/moStard/src/components/event-tip-modal/tip-options.tsx)
- Use `PaytoIcon` component for the button icon instead of hardcoded Monero icon

#### [MODIFY] [qr-code-svg.tsx](file:///home/roguehashrate/code/moStard/src/components/qr-code/qr-code-svg.tsx)
- Rename `xmrIcon` prop to `coinIcon` and accept a string type to show the right overlay icon
- Keep backward compat: `xmrIcon` still works

---

### Content Parsing

#### [MODIFY] [monero-notation.ts](file:///home/roguehashrate/code/moStard/src/components/content/transform/monero-notation.ts)
Keep the existing Monero address transformer as-is. No changes needed — it will continue to highlight Monero addresses in content.

---

### Settings UI

#### [MODIFY] [settings/monero/index.tsx](file:///home/roguehashrate/code/moStard/src/views/settings/monero/index.tsx)
Rename to "Payments" and add:
- **Toggle switch**: "Enable alternative payment methods" with helper text explaining that when enabled, non-Monero payment targets (Bitcoin, Lightning, etc.) will be shown on user profiles and notes
- Keep the existing tipping amounts input

#### [MODIFY] [settings/index.tsx](file:///home/roguehashrate/code/moStard/src/views/settings/index.tsx)
- Update the nav item label from "Monero" to "Payments" (keep MoneroWhiteIcon)

---

### Profile Display

#### [MODIFY] [user-about-content.tsx](file:///home/roguehashrate/code/moStard/src/components/user/user-about-content.tsx)
No changes needed — existing monero-notation transformer continues to work. The `payto` data from profiles is consumed by the tip button/modal, not the about section.

---

## File Change Summary

| Action | File | Description |
|--------|------|-------------|
| NEW | `src/helpers/payto-types.ts` | Payment type registry and utilities |
| NEW | `src/hooks/use-user-payment-targets.ts` | Extract payment targets from profiles |
| NEW | `src/hooks/use-event-payment-targets.ts` | Extract payment targets from events |
| NEW | `src/components/payment/payto-icon.tsx` | Icon component for payment types |
| NEW | `src/components/payment/payment-target-dialog.tsx` | Generic payment dialog |
| MODIFY | `src/helpers/app-settings.ts` | Add `enableAlternativePayments` setting |
| MODIFY | `src/components/invoice-modal.tsx` | Support multiple coin URI schemes |
| MODIFY | `src/components/tip/event-tip-button.tsx` | Use new payment targets hook |
| MODIFY | `src/components/event-tip-modal/index.tsx` | Multi-target support |
| MODIFY | `src/components/event-tip-modal/input-step.tsx` | Generic coin support |
| MODIFY | `src/components/event-tip-modal/tip-options.tsx` | Generic icon |
| MODIFY | `src/components/qr-code/qr-code-svg.tsx` | Generic coin icon overlay |
| MODIFY | `src/views/settings/monero/index.tsx` | Rename to Payments, add toggle |
| MODIFY | `src/views/settings/index.tsx` | Update nav label |

## Verification Plan

### Automated Tests
- `npm run build` — ensure no TypeScript errors
- Verify the app starts with `npm run dev`

### Manual Verification (Browser)
1. **Default state (Monero only)**: Open a user profile with a Monero address → tip button appears → modal shows XMR QR code
2. **Toggle on**: Enable alternative payments in settings → profiles with `payto` arrays or `cryptocurrency_addresses` show all payment types in tip dialog
3. **Payment dialog**: Click a non-Monero payment target → dialog shows correct address, QR code, copy button, and wallet deep link
4. **Settings page**: Navigate to Settings → Payments → toggle switch works, tipping amounts still saves
5. **Backward compat**: `support-button.tsx` still works with hardcoded Monero address

