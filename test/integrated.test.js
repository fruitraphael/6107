const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Integrated System Tests - All Members (ethers v5)", function () {
  let mETH, mDAI, govToken, timelock, governor;
  let lendingPoolV1, liquidityMining, multisig;
  let deployer, user1, user2, user3;

  before(async function () {
    [deployer, user1, user2, user3] = await ethers.getSigners();
    console.log("\n🔧 Setting up test environment...");

    // ===== Deploy Tokens =====
    const MockToken = await ethers.getContractFactory("MockToken");
    mETH = await MockToken.deploy("Mock ETH", "mETH");
    mDAI = await MockToken.deploy("Mock DAI", "mDAI");
    await mETH.deployed();
    await mDAI.deployed();
    // Mint initial balances for deployer and user2 for tests
    await mETH.mint(deployer.address, ethers.utils.parseEther("10000"));
    await mDAI.mint(deployer.address, ethers.utils.parseEther("10000"));
    // Give user2 some mETH for integration deposit
    await mETH.mint(user2.address, ethers.utils.parseEther("100"));
    console.log("   ✅ Tokens deployed");

    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    govToken = await GovernanceToken.deploy(deployer.address);
    await govToken.deployed();
    await govToken.mint(deployer.address, ethers.utils.parseEther("1000"));
    await govToken.delegate(deployer.address);
    console.log("   ✅ GovernanceToken deployed");

    // ===== Deploy TimeLock =====
    const TimeLock = await ethers.getContractFactory("TimeLock");
    timelock = await TimeLock.deploy(
      86400, // 24 hours
      [deployer.address],
      [deployer.address],
      deployer.address
    );
    await timelock.deployed();
    console.log("   ✅ TimeLock deployed");

    // ===== Deploy SimpleGovernance =====
    const SimpleGovernance = await ethers.getContractFactory("SimpleGovernance");
    governor = await SimpleGovernance.deploy(govToken.address);
    await governor.deployed();
    console.log("   ✅ SimpleGovernance deployed");

    // ===== Deploy EmergencyMultiSig =====
    const EmergencyMultiSig = await ethers.getContractFactory("EmergencyMultiSig");
    multisig = await EmergencyMultiSig.deploy(
      [deployer.address, user1.address],
      2
    );
    await multisig.deployed();
    console.log("   ✅ EmergencyMultiSig deployed");

    // ===== Deploy LendingPoolV1 Proxy =====
    const LendingPoolV1 = await ethers.getContractFactory("LendingPoolV1");
    lendingPoolV1 = await upgrades.deployProxy(
      LendingPoolV1,
      [mETH.address, mDAI.address, deployer.address],
      {
        kind: "uups",
        constructorArgs: [mETH.address, mDAI.address],
        unsafeAllow: ["state-variable-assignment", "constructor"],
      }
    );
    await lendingPoolV1.deployed();
    console.log("   ✅ LendingPoolV1 deployed");

    // ===== Deploy LiquidityMining =====
    const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
    liquidityMining = await LiquidityMining.deploy(
      mETH.address,
      mDAI.address,
      govToken.address,
      ethers.utils.parseEther("0.1"),
      ethers.utils.parseEther("0.05")
    );
    await liquidityMining.deployed();
    console.log("   ✅ LiquidityMining deployed\n");

    // ===== Setup approvals =====
    await mETH.approve(lendingPoolV1.address, ethers.utils.parseEther("1000000"));
    await mDAI.approve(lendingPoolV1.address, ethers.utils.parseEther("1000000"));
    await mETH.approve(liquidityMining.address, ethers.utils.parseEther("1000000"));
    // Fund the rewards contract so it can pay out rewards
    await mDAI.mint(liquidityMining.address, ethers.utils.parseEther("1000000"));
    await govToken.mint(liquidityMining.address, ethers.utils.parseEther("1000000"));
    // Fund the lending pool so it has liquidity to lend
    await mDAI.mint(lendingPoolV1.address, ethers.utils.parseEther("1000000"));
    // Ensure user2 approved lending pool for integration deposit
    await mETH.connect(user2).approve(lendingPoolV1.address, ethers.utils.parseEther("1000000"));
  });

  describe("Member A & B: LendingPool", function () {
    it("Should deposit mETH collateral", async function () {
      const depositAmount = ethers.utils.parseEther("10");
      const tx = await lendingPoolV1.deposit(depositAmount);
      await tx.wait();

      const balance = await lendingPoolV1.collateralBalance(deployer.address);
      expect(balance.toString()).to.equal(depositAmount.toString());
    });

    it("Should borrow mDAI against collateral", async function () {
      const borrowAmount = ethers.utils.parseEther("2");
      const tx = await lendingPoolV1.borrow(borrowAmount);
      await tx.wait();

      const debt = await lendingPoolV1.debtBalance(deployer.address);
      expect(debt.gt(ethers.BigNumber.from("0"))).to.be.true;
    });

    it("Should return correct lending pool version", async function () {
      const version = await lendingPoolV1.getVersion();
      expect(version).to.equal("V1.0");
    });
  });

  describe("Member C: Governance", function () {
    it("Should have governance tokens with voting power", async function () {
      const votes = await govToken.getVotes(deployer.address);
      expect(votes.toString()).to.equal(ethers.utils.parseEther("1000").toString());
    });

    it("Should have TimeLock with 24h delay", async function () {
      const minDelay = await timelock.getMinDelay();
      expect(minDelay.toString()).to.equal(ethers.BigNumber.from("86400").toString());
    });

    it("Should have SimpleGovernance contract", async function () {
      const proposalCount = await governor.proposalCount();
      expect(proposalCount.toNumber()).to.be.gte(0);
    });

    it("Should have EmergencyMultiSig with 2 owners", async function () {
      const ownerCount = await multisig.ownersCount();
      expect(ownerCount.toString()).to.equal(ethers.BigNumber.from("2").toString());
    });
  });

  describe("Member D: LiquidityMining", function () {
    it("Should stake mETH tokens", async function () {
      const stakeAmount = ethers.utils.parseEther("5");
      const tx = await liquidityMining.stake(stakeAmount);
      await tx.wait();

      const staked = await liquidityMining.balances(deployer.address);
      expect(staked.toString()).to.equal(stakeAmount.toString());
    });

    it("Should earn reward tokens over time", async function () {
      await liquidityMining.stake(ethers.utils.parseEther("2"));

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [10]);
      await ethers.provider.send("evm_mine", []);

      const earned = await liquidityMining.earned(deployer.address);
      expect(earned.gt(ethers.BigNumber.from("0"))).to.be.true;
    });

    it("Should withdraw staked tokens", async function () {
      const initialStake = await liquidityMining.balances(deployer.address);
      const withdrawAmount = ethers.utils.parseEther("1");

      const tx = await liquidityMining.withdraw(withdrawAmount);
      await tx.wait();

      const remaining = await liquidityMining.balances(deployer.address);
      expect(remaining.toString()).to.equal(initialStake.sub(withdrawAmount).toString());
    });

    it("Should claim rewards", async function () {
      await liquidityMining.stake(ethers.utils.parseEther("1"));
      await ethers.provider.send("evm_increaseTime", [50]);
      await ethers.provider.send("evm_mine", []);

      const tx = await liquidityMining.claimRewards();
      await tx.wait();

      // Check rewards were claimed (earned should be 0 after claim)
      const earned = await liquidityMining.earned(deployer.address);
      expect(earned.toString()).to.equal(ethers.BigNumber.from("0").toString());
    });

    it("Should have correct reward rates", async function () {
      const rewardRate = await liquidityMining.rewardRate();
      const bonusRate = await liquidityMining.bonusRewardRate();

      expect(rewardRate.toString()).to.equal(ethers.utils.parseEther("0.1").toString());
      expect(bonusRate.toString()).to.equal(ethers.utils.parseEther("0.05").toString());
    });
  });

  describe("Integration Tests", function () {
    it("All contracts deployed correctly", async function () {
      expect(mETH.address).to.not.equal(ethers.constants.AddressZero);
      expect(mDAI.address).to.not.equal(ethers.constants.AddressZero);
      expect(lendingPoolV1.address).to.not.equal(ethers.constants.AddressZero);
      expect(govToken.address).to.not.equal(ethers.constants.AddressZero);
      expect(timelock.address).to.not.equal(ethers.constants.AddressZero);
      expect(governor.address).to.not.equal(ethers.constants.AddressZero);
      expect(liquidityMining.address).to.not.equal(ethers.constants.AddressZero);
      expect(multisig.address).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should handle lending and staking workflow", async function () {
      // Deposit collateral
      await lendingPoolV1.connect(user2).deposit(ethers.utils.parseEther("5"));

      // Stake in rewards
      await liquidityMining.stake(ethers.utils.parseEther("2"));

      const stakedAmount = await liquidityMining.balances(deployer.address);
      expect(stakedAmount.gt(ethers.BigNumber.from("0"))).to.be.true;

      const depositAmount = await lendingPoolV1.collateralBalance(user2.address);
      expect(depositAmount.toString()).to.equal(ethers.utils.parseEther("5").toString());
    });
  });
});
