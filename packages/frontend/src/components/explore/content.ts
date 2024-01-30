import antisocialApeClubIcon from './media/antisocial-ape-club.jpg';
import apollo42Icon from './media/apollo42.jpg';
import arbitoorAggregatorIcon from './media/arbitoor-aggregator.jpg';
import armoredKingdomIcon from './media/armored-kingdom.jpg';
import astroStakersIcon from './media/astro-stakers.jpg';
import burrowIcon from './media/burrow.svg';
import collectNFTsSectionIcon from './media/collectNFTsSectionIcon.svg';
import cryptoheroeIcon from './media/cryptoheroes.jpg';
import exchangeSectionIcon from './media/exchangeSectionIcon.svg';
import galaxyOnlineIcon from './media/galaxy-online.svg';
import hashRushIcon from './media/hash-rush.png';
import jumboExchangeIcon from './media/jumbo-exchange.jpg';
import learnNearIcon from './media/learn-near.png';
import linearProtocolIcon from './media/linear-protocol.jpg';
import metapoolIcon from './media/meta-pool.jpg';
import metamonIcon from './media/metamon.jpg';
import mintbaseIcon from './media/mintbase.jpg';
import nearnautsIcon from './media/nearnauts.jpg';
import parasIcon from './media/paras.svg';
import pembrockFinanceIcon from './media/pembrock-finance.jpg';
import playToEarnSectionIcon from './media/playToEarnSectionIcon.svg';
import rainbowbridgeIcon from './media/rainbow-bridge.svg';
import refFinanceIcon from './media/ref-finance.jpg';
import spinIcon from './media/spin.jpg';
import startEarningSectionIcon from './media/startEarningSectionIcon.svg';
import sweatEconomyIcon from './media/sweat-economy.jpg';
import tamagoIcon from './media/tamago.jpg';
import tonicDexIcon from './media/tonic-dex.jpg';

interface Project {
    icon: any;
    name: string;
    linkUrl: string;
    category?: string;
    info?: string;
}

interface Section {
    name: string;
    icon: any;
    colour: string;
    sectionLink: string;
    projects: Project[];
}

export const trandingProjects: Project[] = [
    {
        icon: refFinanceIcon,
        name: 'Ref Finance',
        linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=ref-finance',
    },
    {
        icon: parasIcon,
        name: 'Paras',
        linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=paras',
    },
    {
        icon: burrowIcon,
        name: 'Burrow',
        linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=burrow',
    },
    {
        icon: metapoolIcon,
        name: 'Meta Pool',
        linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=meta-pool',
    },
    {
        icon: learnNearIcon,
        name: 'Learn NEAR Club',
        linkUrl: 'https://learnnear.club',
    },
    {
        icon: rainbowbridgeIcon,
        name: 'Rainbow Bridge',
        linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=rainbow-bridge',
    },
];

export const exchangeSection: Section = {
    name: 'Exchanges',
    icon: exchangeSectionIcon,
    colour: '#FFF7FB',
    sectionLink: 'https://near.org/near/widget/Search.IndexPage?term=exchanges',
    projects: [
        {
            icon: refFinanceIcon,
            name: 'Ref Finance',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=ref-finance',
            category: 'AMM DEX',
            info: 'Multi-purpose DeFi platform built on NEAR Protocol.',
        },
        {
            icon: tonicDexIcon,
            name: 'Tonic DEX',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=tonic-dex',
            category: 'Orderbook DEX',
            info: 'Orderbook DEX on NEAR.',
        },
        {
            icon: jumboExchangeIcon,
            name: 'Jumbo Exchange',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=jumbo-exchange',
            category: 'AMM DEX',
            info: 'UI/UX Friendly AMM built on NEAR.',
        },
        {
            icon: arbitoorAggregatorIcon,
            name: 'Arbitoor Aggregator',
            linkUrl:
                'https://near.org/near/widget/Search.IndexPage?term=arbitoor-aggregator',
            category: 'DEX Aggregator',
            info: 'The Liquidity Aggregator and Swap Infrastructure for NEAR.',
        },
        {
            icon: spinIcon,
            name: 'Spin',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=spin',
            category: 'Orderbook DEX',
            info: 'DeFi derivatives infrastructure built on NEAR Protocol.',
        },
        {
            icon: rainbowbridgeIcon,
            name: 'Rainbow Bridge',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=rainbow-bridge',
            category: 'Cross-chain Bridge',
            info: 'Transfer tokens between Ethereum and NEAR.',
        },
    ],
};

export const startEarningSection: Section = {
    name: 'Start Earning',
    icon: startEarningSectionIcon,
    colour: 'linear-gradient(0deg, #F4FFEE, #F4FFEE), linear-gradient(0deg, #ECFFE3, #ECFFE3), linear-gradient(0deg, #ECFFE3, #ECFFE3), #ECFFE3;',
    sectionLink: 'https://near.org/near/widget/Search.IndexPage?term=defi',
    projects: [
        {
            icon: burrowIcon,
            name: 'Burrow',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=burrow',
            category: 'Lending Protocol',
            info: 'Borrow, Supply, Thrive.',
        },

        {
            icon: pembrockFinanceIcon,
            name: 'PembRock Finance',
            linkUrl:
                'https://near.org/near/widget/Search.IndexPage?term=pembrock-finance',
            category: 'Leveraged yield farming',
            info: 'Leveraged yield farming on NEAR.',
        },
        {
            icon: metapoolIcon,
            name: 'Meta Pool',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=meta-pool',
            category: 'Liquid Staking',
            info: 'Liquid Staking Protocol built on NEAR.',
        },
        {
            icon: linearProtocolIcon,
            name: 'LiNEAR Protocol',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=linear-protocol',
            category: 'Liquid Staking',
            info: 'Your Journey of DeFi on NEAR Starts Here.',
        },
        {
            icon: astroStakersIcon,
            name: 'Astro-Stakers',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=astro-stakers',
            category: 'Staking Provider',
            info: 'Low-fee Community Staking Provider for NEAR Protocol.',
        },
        {
            icon: learnNearIcon,
            name: 'Learn NEAR Club',
            linkUrl: 'https://learnnear.club/',
            category: 'Staking Provider',
            info: 'Learn how to use and build on NEAR and Earn NEAR.',
        },
    ],
};

export const collectNFTsSection: Section = {
    name: 'Collect NFTs',
    icon: collectNFTsSectionIcon,
    colour: 'linear-gradient(0deg, #FEF4FF, #FEF4FF), linear-gradient(0deg, #ECFFE3, #ECFFE3), linear-gradient(0deg, #ECFFE3, #ECFFE3), #ECFFE3;',
    sectionLink: 'https://near.org/near/widget/Search.IndexPage?term=marketplaces',
    projects: [
        {
            icon: parasIcon,
            name: 'Paras',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=paras',
            category: 'NFT Marketplace',
            info: 'Create, Trade, and Collect Digital Collectibles.',
        },
        {
            icon: mintbaseIcon,
            name: 'Mintbase',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=mintbase',
            category: 'NFT Marketplace',
            info: 'Digital assets minted and backed by you.',
        },
        {
            icon: apollo42Icon,
            name: 'Apollo42',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=apollo42',
            category: 'NFT Marketplace',
            info: 'Your journey to a new galaxy of digital cultures and collectibles.',
        },
        {
            icon: tamagoIcon,
            name: 'Tamago',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=tamago',
            category: 'Audio Streaming platform',
            info: 'Decentralized Audio Streaming platform built on the NEAR.',
        },
        {
            icon: nearnautsIcon,
            name: 'NEARNauts',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=nearnauts',
            category: 'NFT Collectibles',
            info: 'A generative project on the NEAR Network.',
        },
        {
            icon: antisocialApeClubIcon,
            name: 'Antisocial Ape Club',
            linkUrl:
                'https://near.org/near/widget/Search.IndexPage?term=antisocial-ape-club',
            category: 'NFT Collectibles',
            info: '3333 unique, randomly generated pixel art ape NFTs.',
        },
    ],
};

export const playToEarnSection: Section = {
    name: 'Play To Earn',
    icon: playToEarnSectionIcon,
    colour: 'linear-gradient(0deg, #F7F7FF, #F7F7FF), linear-gradient(0deg, #ECFFE3, #ECFFE3), linear-gradient(0deg, #ECFFE3, #ECFFE3), #ECFFE3;',
    sectionLink: 'https://near.org/near/widget/Search.IndexPage?term=gaming',
    projects: [
        {
            icon: metamonIcon,
            name: 'Metamon',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=metamon',
            category: 'Play to Earn',
            info: 'Free-to-play Play-to-Earn online Battle Royale Game and Sci-Fi Franchise.',
        },
        {
            icon: cryptoheroeIcon,
            name: 'Crypto Hero',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=cryptoheroes',
            category: 'Play to Earn',
            info: 'A blockchain game focused on PvE with a P2E raid system.',
        },
        {
            icon: armoredKingdomIcon,
            name: 'Armored Kindom',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=armored-kingdom',
            category: 'Play to Earn',
            info: 'A multi-media entertainment universe.',
        },
        {
            icon: galaxyOnlineIcon,
            name: 'Galaxy Online',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=galaxy-online',
            category: 'Play to Earn',
            info: 'Epic MMO with blockchain-based game races.',
        },
        {
            icon: hashRushIcon,
            name: 'Hash Rush',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=hash-rush',
            category: 'Play to Earn',
            info: 'Online sci-fi/fantasy RTS set in the fictional Hermeian galaxy.',
        },
        {
            icon: sweatEconomyIcon,
            name: 'Sweat Economy',
            linkUrl: 'https://near.org/near/widget/Search.IndexPage?term=sweat-economy',
            category: 'Move to Earn',
            info: 'Sweatcoin. Move to Earn. Walk into crypto.',
        },
    ],
};
