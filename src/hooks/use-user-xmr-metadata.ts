import { getXMR } from "../helpers/monero";
import useUserProfile from "./use-user-profile";

export default function useUserXMRMetadata(pubkey: string) {
	const userMetadata = useUserProfile(pubkey);
	let address = (userMetadata as any)?.cryptocurrency_addresses?.monero;

	if (!address) {
		const bio = userMetadata?.about || "";
		address = getXMR(bio);
	}

	return { address };
}
