import { Nip07Interface } from "applesauce-signers";
import { NostrSignerPlugin } from "nostr-signer-capacitor-plugin";
import { EventTemplate, getEventHash, nip19, NostrEvent, UnsignedEvent, verifyEvent } from "nostr-tools";

type Permission = {
  type: "string";
  kind?: number;
};

export default class AndroidNativeSigner implements Nip07Interface {
  packageName: string;
  connected = false;

  permissions: Permission[] = [];

  private pubkey: string | null = null;
  verifyEvent: typeof verifyEvent = verifyEvent;

  nip04: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
  };
  nip44: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
  };

  constructor(packageName: string) {
    this.packageName = packageName;

    this.nip04 = {
      encrypt: this.nip04Encrypt.bind(this),
      decrypt: this.nip04Decrypt.bind(this),
    };
    this.nip44 = {
      encrypt: this.nip44Encrypt.bind(this),
      decrypt: this.nip44Decrypt.bind(this),
    };
  }

  static async getSignerApps() {
    return (await NostrSignerPlugin.getInstalledSignerApps()).apps;
  }

  async setup() {
    if (this.connected) return;

    await NostrSignerPlugin.setPackageName({ packageName: this.packageName });

    // get pubkey
    const result = await (this.permissions.length > 0
      ? NostrSignerPlugin.getPublicKey({ permissions: JSON.stringify(this.permissions) })
      : NostrSignerPlugin.getPublicKey());
    const key = result.npub;
    if (!key) throw new Error("Signer did not return a public key");

    this.pubkey = this.parseReturnedKey(key);

    this.connected = true;
  }

  private parseReturnedKey(key: string): string {
    const hexRegex = /^[0-9a-f]{64}$/i;
    if (key.startsWith("npub")) {
      return nip19.decode(key).data as string;
    }
    if (hexRegex.test(key)) {
      return key.toLowerCase();
    }
    throw new Error("Unsupported public key format returned by signer");
  }

  async getPublicKey() {
    await this.setup();
    return this.pubkey!;
  }
  async signEvent(template: UnsignedEvent | EventTemplate) {
    const pubkey = await this.getPublicKey();

    // add pubkey to template
    const withPubkey: UnsignedEvent = {
      ...template,
      pubkey: pubkey,
    };

    // calculate the event id
    const unsigned = {
      ...withPubkey,
      id: getEventHash(withPubkey),
      // plugin requires an empty sig field
      sig: "",
    };

    // request signature
    const result = await NostrSignerPlugin.signEvent({
      eventJson: JSON.stringify(unsigned),
      eventId: unsigned.id,
      npub: nip19.npubEncode(unsigned.pubkey),
    });

    const signed: NostrEvent = { ...unsigned, id: result.id, sig: result.signature };
    if (!this.verifyEvent(signed)) throw new Error("Invalid signature");

    return signed;
  }

  // NIP-04
  async nip04Encrypt(pubkey: string, plaintext: string) {
    const p = await this.getPublicKey();
    const result = await NostrSignerPlugin.nip04Encrypt({
      plainText: plaintext,
      npub: nip19.npubEncode(p),
      pubKey: pubkey,
    });
    return result.result;
  }
  async nip04Decrypt(pubkey: string, ciphertext: string) {
    const p = await this.getPublicKey();
    const result = await NostrSignerPlugin.nip04Decrypt({
      encryptedText: ciphertext,
      npub: nip19.npubEncode(p),
      pubKey: pubkey,
    });
    return result.result;
  }

  // NIP-44
  async nip44Encrypt(pubkey: string, plaintext: string) {
    const p = await this.getPublicKey();
    const result = await NostrSignerPlugin.nip44Encrypt({
      plainText: plaintext,
      npub: nip19.npubEncode(p),
      pubKey: pubkey,
    });
    return result.result;
  }
  async nip44Decrypt(pubkey: string, ciphertext: string) {
    const p = await this.getPublicKey();
    const result = await NostrSignerPlugin.nip44Decrypt({
      encryptedText: ciphertext,
      npub: nip19.npubEncode(p),
      pubKey: pubkey,
    });
    return result.result;
  }
}
