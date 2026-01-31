import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { foundry } from 'wagmi/chains';

import { http } from 'wagmi';

export const config = getDefaultConfig({
    appName: 'Covenant Protocol',
    projectId: '9a98059e665d9573889601004126139c', // Public dummy ID for dev
    chains: [foundry],
    transports: {
        [foundry.id]: http('http://localhost:8545'),
    },
    ssr: false,
});
