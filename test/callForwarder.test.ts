import { expect } from 'chai';
import { ethers } from 'hardhat';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';

async function deployForwarder(owner: string) {
  const CallForwarder = await ethers.getContractFactory('CallForwarder');
  const implementation = await CallForwarder.deploy();
  await implementation.waitForDeployment();

  const Proxy = await ethers.getContractFactory('CallForwarderProxy');
  const initData = CallForwarder.interface.encodeFunctionData('initialize', [owner]);
  const proxy = await Proxy.deploy(await implementation.getAddress(), initData);
  await proxy.waitForDeployment();

  return CallForwarder.attach(await proxy.getAddress());
}

describe('CallForwarder', () => {
  it('executes a batch of calls and forwards native value', async () => {
    const [owner] = await ethers.getSigners();
    const forwarder = await deployForwarder(owner.address);

    const Receiver = await ethers.getContractFactory('Receiver');
    const receiver = await Receiver.deploy();
    await receiver.waitForDeployment();

    const valueToSend = ethers.parseEther('0.25');
    await owner.sendTransaction({ to: await forwarder.getAddress(), value: valueToSend });

    const calls = [
      {
        target: await receiver.getAddress(),
        value: valueToSend,
        data: receiver.interface.encodeFunctionData('setStoredValue', [42n]),
      },
    ];

    const [successes] = await forwarder.callStatic.executeCalls(calls, false);
    expect(successes).to.deep.equal([true]);

    await expect(forwarder.executeCalls(calls, false))
      .to.emit(forwarder, 'CallExecuted')
      .withArgs(0, await receiver.getAddress(), calls[0].data, anyValue());

    expect(await receiver.storedValue()).to.equal(42n);
    expect(await receiver.totalReceived()).to.equal(valueToSend);
    expect(await ethers.provider.getBalance(await forwarder.getAddress())).to.equal(0n);
  });

  it('reverts the entire batch when allowFailure is false and a call fails', async () => {
    const [owner] = await ethers.getSigners();
    const forwarder = await deployForwarder(owner.address);

    const Receiver = await ethers.getContractFactory('Receiver');
    const receiver = await Receiver.deploy();
    await receiver.waitForDeployment();

    const calls = [
      {
        target: await receiver.getAddress(),
        value: 0n,
        data: receiver.interface.encodeFunctionData('setStoredValue', [1n]),
      },
      {
        target: await receiver.getAddress(),
        value: 0n,
        data: receiver.interface.encodeFunctionData('forceRevert', []),
      },
    ];

    await expect(forwarder.executeCalls(calls, false))
      .to.be.revertedWithCustomError(forwarder, 'CallExecutionFailed')
      .withArgs(1, anyValue());
  });

  it('continues executing when allowFailure is true', async () => {
    const [owner] = await ethers.getSigners();
    const forwarder = await deployForwarder(owner.address);

    const Receiver = await ethers.getContractFactory('Receiver');
    const receiver = await Receiver.deploy();
    await receiver.waitForDeployment();

    const calls = [
      {
        target: await receiver.getAddress(),
        value: 0n,
        data: receiver.interface.encodeFunctionData('setStoredValue', [7n]),
      },
      {
        target: await receiver.getAddress(),
        value: 0n,
        data: receiver.interface.encodeFunctionData('forceRevert', []),
      },
      {
        target: await receiver.getAddress(),
        value: 0n,
        data: receiver.interface.encodeFunctionData('setStoredValue', [11n]),
      },
    ];

    const [successes] = await forwarder.callStatic.executeCalls(calls, true);
    expect(successes).to.deep.equal([true, false, true]);

    const tx = await forwarder.executeCalls(calls, true);
    await tx.wait();

    expect(await receiver.storedValue()).to.equal(11n);
  });

  it('blocks execution from non-owners', async () => {
    const [owner, attacker] = await ethers.getSigners();
    const forwarder = await deployForwarder(owner.address);

    const Receiver = await ethers.getContractFactory('Receiver');
    const receiver = await Receiver.deploy();
    await receiver.waitForDeployment();

    const calls = [
      {
        target: await receiver.getAddress(),
        value: 0n,
        data: receiver.interface.encodeFunctionData('setStoredValue', [5n]),
      },
    ];

    await expect(forwarder.connect(attacker).executeCalls(calls, false))
      .to.be.revertedWithCustomError(forwarder, 'OwnableUnauthorizedAccount')
      .withArgs(attacker.address);
  });

  it('lets the owner withdraw native balance', async () => {
    const [owner, recipient] = await ethers.getSigners();
    const forwarder = await deployForwarder(owner.address);

    const valueToSend = ethers.parseEther('1');
    await owner.sendTransaction({ to: await forwarder.getAddress(), value: valueToSend });

    await expect(forwarder.connect(recipient).withdrawNative(recipient.address))
      .to.be.revertedWithCustomError(forwarder, 'OwnableUnauthorizedAccount')
      .withArgs(recipient.address);

    await expect(forwarder.withdrawNative(recipient.address))
      .to.emit(forwarder, 'WithdrawNative')
      .withArgs(recipient.address, valueToSend);

    expect(await ethers.provider.getBalance(await forwarder.getAddress())).to.equal(0n);
  });

  it('lets the owner withdraw ERC20 balances', async () => {
    const [owner, recipient] = await ethers.getSigners();
    const forwarder = await deployForwarder(owner.address);

    const Token = await ethers.getContractFactory('MockERC20');
    const token = await Token.deploy();
    await token.waitForDeployment();

    const mintAmount = ethers.parseUnits('1000', 18);
    await token.mint(await forwarder.getAddress(), mintAmount);

    await expect(forwarder.withdrawToken(await token.getAddress(), recipient.address))
      .to.emit(forwarder, 'WithdrawToken')
      .withArgs(await token.getAddress(), recipient.address, mintAmount);

    expect(await token.balanceOf(recipient.address)).to.equal(mintAmount);
  });

  it('restricts upgrades to the owner', async () => {
    const [owner, attacker] = await ethers.getSigners();
    const forwarder = await deployForwarder(owner.address);

    const CallForwarder = await ethers.getContractFactory('CallForwarder');
    const newImpl = await CallForwarder.deploy();
    await newImpl.waitForDeployment();

    await expect(forwarder.connect(attacker).upgradeTo(await newImpl.getAddress()))
      .to.be.revertedWithCustomError(forwarder, 'OwnableUnauthorizedAccount')
      .withArgs(attacker.address);
  });
});
