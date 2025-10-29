const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const owner = process.env.FORWARDER_OWNER ?? deployerAddress;

  console.log('Deploying CallForwarder with account:', deployerAddress);
  console.log('Using owner address:', owner);

  const CallForwarder = await ethers.getContractFactory('CallForwarder');
  const implementation = await CallForwarder.deploy();
  await implementation.waitForDeployment();
  const implementationAddress = await implementation.getAddress();

  console.log('CallForwarder implementation deployed to:', implementationAddress);

  const Proxy = await ethers.getContractFactory('CallForwarderProxy');
  const initData = CallForwarder.interface.encodeFunctionData('initialize', [owner]);
  const proxy = await Proxy.deploy(implementationAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  console.log('CallForwarder proxy deployed to:', proxyAddress);
  console.log('CallForwarder ready at:', proxyAddress);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = main;
