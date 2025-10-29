import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const owner = process.env.FORWARDER_OWNER ?? deployerAddress;

  console.log('Deploying CallForwarder with account:', deployerAddress);
  console.log('Using owner address:', owner);

  const CallForwarder = await ethers.getContractFactory('CallForwarder');
  const implementation = await CallForwarder.deploy();
  await implementation.waitForDeployment();

  console.log('CallForwarder implementation deployed to:', await implementation.getAddress());

  const Proxy = await ethers.getContractFactory('CallForwarderProxy');
  const initData = CallForwarder.interface.encodeFunctionData('initialize', [owner]);
  const proxy = await Proxy.deploy(await implementation.getAddress(), initData);
  await proxy.waitForDeployment();

  console.log('CallForwarder proxy deployed to:', await proxy.getAddress());
  console.log('CallForwarder ready at:', await proxy.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
