import { useEffect } from "react";
import {
  TonConnectUIProvider,
  TonConnectButton,
  useTonAddress,
} from "@tonconnect/ui-react";
import { useGame } from "@/hooks/useGame";

function WalletSync() {
  const address = useTonAddress();
  const { state, connectWallet, disconnectWallet } = useGame();

  useEffect(() => {
    if (address && address !== state.walletAddress) connectWallet(address);
    if (!address && state.walletAddress) disconnectWallet();
  }, [address, state.walletAddress, connectWallet, disconnectWallet]);

  return (
    <div className="flex justify-center [&_button]:!rounded-xl">
      <TonConnectButton />
    </div>
  );
}

export default function TonWallet() {
  const manifestUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/api/public/tonconnect-manifest`;

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <WalletSync />
    </TonConnectUIProvider>
  );
}
