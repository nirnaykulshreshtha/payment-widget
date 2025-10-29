process.env.TS_NODE_PROJECT ??= 'tsconfig.hardhat.json';
require('ts-node/register');
require('dotenv/config');

require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-chai-matchers');

const deployerKey = process.env.FORWARDER_DEPLOYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
const accounts = deployerKey ? [deployerKey] : undefined;

const envNetworks = [
  { name: 'mainnet', env: 'MAINNET_RPC_URL', chainId: 1 },
  { name: 'sepolia', env: 'SEPOLIA_RPC_URL', chainId: 11155111 },
  { name: 'polygon', env: 'POLYGON_RPC_URL', chainId: 137 },
  { name: 'polygonAmoy', env: 'POLYGON_AMOY_RPC_URL', chainId: 80002 },
  { name: 'bsc', env: 'BNB_RPC_URL', chainId: 56 },
  { name: 'bscTestnet', env: 'BNB_TESTNET_RPC_URL', chainId: 97 },
  { name: 'base', env: 'BASE_RPC_URL', chainId: 8453 },
  { name: 'baseSepolia', env: 'BASE_SEPOLIA_RPC_URL', chainId: 84532 },
  { name: 'optimism', env: 'OPTIMISM_RPC_URL', chainId: 10 },
  { name: 'optimismSepolia', env: 'OPTIMISM_SEPOLIA_RPC_URL', chainId: 11155420 },
  { name: 'arbitrum', env: 'ARBITRUM_RPC_URL', chainId: 42161 },
  { name: 'arbitrumSepolia', env: 'ARBITRUM_SEPOLIA_RPC_URL', chainId: 421614 },
];

const networks = envNetworks.reduce((acc, { name, env, chainId }) => {
  const url = process.env[env];
  if (url) {
    acc[name] = {
      url,
      accounts,
      chainId,
    };
  }
  return acc;
}, {});

/** @type {import('hardhat/config').HardhatUserConfig} */
const config = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  networks,
};

module.exports = config;
