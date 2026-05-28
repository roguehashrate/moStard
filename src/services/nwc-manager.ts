import { BehaviorSubject, Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { hexToBytes } from "@noble/hashes/utils";
import { nip04, getPublicKey, finalizeEvent } from "nostr-tools";
import type { NostrEvent, EventTemplate } from "nostr-tools";

import pool from "./pool";
import {
  parseNWCConnectionString,
  decryptNWCResponse,
  type NWCConfig,
  type NWCResponse,
} from "../helpers/nwc";

export type NWCStatus = "disconnected" | "connecting" | "connected" | "error";

class NWCManager {
  public status$ = new BehaviorSubject<NWCStatus>("disconnected");
  public error$ = new BehaviorSubject<string | null>(null);
  public balance$ = new BehaviorSubject<number | null>(null);

  private config: NWCConfig | null = null;
  private secretKey: Uint8Array | null = null;
  private clientPubkey: string | null = null;
  private subs: Subscription[] = [];
  private pendingRequests = new Map<
    string,
    { resolve: (res: NWCResponse) => void; reject: (err: Error) => void; timer: NodeJS.Timeout }
  >();

  get status(): NWCStatus {
    return this.status$.value;
  }

  get error(): string | null {
    return this.error$.value;
  }

  get balance(): number | null {
    return this.balance$.value;
  }

  private cleanup() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
    this.subs = [];
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error("NWC disconnected"));
    }
    this.pendingRequests.clear();
  }

  connect(connectionString: string) {
    this.cleanup();

    if (!connectionString) {
      this.error$.next("No NWC connection string configured");
      this.status$.next("error");
      return;
    }

    let parsed: NWCConfig;
    try {
      parsed = parseNWCConnectionString(connectionString);
    } catch {
      this.error$.next("Invalid NWC connection string");
      this.status$.next("error");
      return;
    }

    this.config = parsed;
    this.status$.next("connecting");
    this.error$.next(null);

    const secretBytes = hexToBytes(parsed.secret);
    this.secretKey = secretBytes;
    this.clientPubkey = getPublicKey(secretBytes);

    const relay = pool.relay(parsed.relay);

    // Subscribe to connection status changes
    const connectSub = relay.connected$.subscribe((isConnected) => {
      this.status$.next(isConnected ? "connected" : "connecting");
    });
    this.subs.push(connectSub);

    // Subscribe to NWC response events (kind 23195).
    // This also triggers the relay connection — subscribing to connected$ alone is not enough,
    // the relay only connects when a subscription/req/publish is actually made.
    const eventSub = relay.subscription([
      { kinds: [23195], "#p": [this.clientPubkey!], limit: 0 },
    ])
      .pipe(filter((packet): packet is NostrEvent => typeof packet === "object"))
      .subscribe({
        next: (event) => {
          this.handleNWCEvent(event);
        },
        error: (err: Error) => {
          console.error("NWC subscription error:", err);
        },
      });
    this.subs.push(eventSub);
  }

  disconnect() {
    this.cleanup();
    this.config = null;
    this.secretKey = null;
    this.clientPubkey = null;
    this.status$.next("disconnected");
    this.error$.next(null);
    this.balance$.next(null);
  }

  private handleNWCEvent(event: NostrEvent) {
    try {
      const secret = this.secretKey;
      if (!secret) return;

      const hexSecret = Array.from(secret)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const response = decryptNWCResponse(hexSecret, event.pubkey, event.content);

      const eTag = event.tags?.find(([t]) => t === "e");
      const reqId = eTag?.[1];

      if (reqId && this.pendingRequests.has(reqId)) {
        const pending = this.pendingRequests.get(reqId)!;
        clearTimeout(pending.timer);
        pending.resolve(response);
        this.pendingRequests.delete(reqId);
      }
    } catch (e) {
      console.error("Failed to decrypt NWC response:", e);
    }
  }

  async payInvoice(invoice: string): Promise<NWCResponse> {
    return this.encryptAndPublish("pay_invoice", { invoice });
  }

  async checkBalance(): Promise<void> {
    try {
      const response = await this.encryptAndPublish("get_balance", {});
      if (response.result && response.result.balance !== undefined) {
        this.balance$.next(Math.round((response.result.balance as number) / 1000));
      }
    } catch {
      console.error("Failed to check NWC balance");
    }
  }

  private async encryptAndPublish(
    method: string,
    params: Record<string, unknown>,
  ): Promise<NWCResponse> {
    if (!this.config || !this.secretKey) throw new Error("NWC not connected");

    const content = JSON.stringify({ method, params });
    const encrypted = nip04.encrypt(this.secretKey, this.config.pubkey, content);

    const eventTemplate: EventTemplate = {
      kind: 23194,
      created_at: Math.round(Date.now() / 1000),
      content: encrypted,
      tags: [["p", this.config.pubkey]],
    };

    const signedEvent = finalizeEvent(eventTemplate, this.secretKey);

    return new Promise<NWCResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(signedEvent.id);
        reject(new Error("NWC request timed out"));
      }, 30_000);

      this.pendingRequests.set(signedEvent.id, { resolve, reject, timer });

      pool.event([this.config!.relay], signedEvent).subscribe({
        error: (err: Error) => {
          clearTimeout(timer);
          this.pendingRequests.delete(signedEvent.id);
          reject(err);
        },
      });
    });
  }
}

export const nwcManager = new NWCManager();
