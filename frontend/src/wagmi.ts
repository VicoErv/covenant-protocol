import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { foundry } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'Covenant Protocol',
    projectId: 'YOUR_PROJECT_ID', // WalletConnect Project ID (User needs to provide or use public one for dev)
    chains: [foundry], // Using Anvil/Foundry local chain
    ssr: false, // Client side mostly
});
