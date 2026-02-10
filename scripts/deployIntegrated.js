const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n========================================");
  console.log("🚀 INTEGRATED DEPLOYMENT - ALL MEMBERS");
  console.log("========================================\n");
  console.log("Deployer:", deployer.address);

  const addresses = {};

  // ============ MEMBER A + B: TOKENS & LENDING POOL ============
  console.log("\n--- MEMBER A & B: Token + Lending Pool ---");
  
  const MockToken = await ethers.getContractFactory("MockToken");
  const mETH = await MockToken.deploy("Mock ETH", "mETH");
  const mDAI = await MockToken.deploy("Mock DAI", "mDAI");
  await mETH.deployed();
  await mDAI.deployed();
  
  const mETHAddr = mETH.address;
  const mDAIAddr = mDAI.address;
  addresses.mETH = mETHAddr;
  addresses.mDAI = mDAIAddr;
  
  console.log(`✅ Mock Tokens:`);
  console.log(`   mETH: ${mETHAddr}`);
  console.log(`   mDAI: ${mDAIAddr}`);

  // Deploy LendingPoolV1 via UUPS Proxy
  const LendingPoolV1 = await ethers.getContractFactory("LendingPoolV1");
  console.log("\n⏳ Deploying LendingPoolV1 Proxy...");
  
  const lendingPoolProxy = await upgrades.deployProxy(
    LendingPoolV1,
    [mETHAddr, mDAIAddr, deployer.address],
    {
      kind: "uups",
      constructorArgs: [mETHAddr, mDAIAddr],
      unsafeAllow: ["state-variable-assignment", "constructor"],
    }
  );
  await lendingPoolProxy.waitForDeployment();
  const lendingPoolAddr = await lendingPoolProxy.getAddress();
  addresses.lendingPoolV1 = lendingPoolAddr;
  
  console.log(`✅ LendingPool Proxy (V1): ${lendingPoolAddr}`);
  console.log(`   Version: ${await lendingPoolProxy.getVersion()}`);

  // ============ MEMBER C: GOVERNANCE ============
  console.log("\n--- MEMBER C: Governance Token, TimeLock, Governor ---");

  // Deploy Governance Token
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const govToken = await GovernanceToken.deploy(deployer.address);
  await govToken.waitForDeployment();
  const govTokenAddr = await govToken.getAddress();
  addresses.governanceToken = govTokenAddr;
  console.log(`✅ GovernanceToken: ${govTokenAddr}`);

  // Mint governance tokens for voting (only deployer has voting power initially)
  const mintTx = await govToken.mint(deployer.address, ethers.parseEther("1000"));
  await mintTx.wait();
  console.log(`   Minted 1000 GOV to deployer`);

  // Delegate voting power (for snapshot voting)
  const delegateTx = await govToken.delegate(deployer.address);
  await delegateTx.wait();
  console.log(`   Delegated voting power to deployer`);

  // Deploy TimeLock (24h delay = 86400 seconds)
  const minDelay = 1; // For demo: 1 second (in production: 86400
  const TimeLock = await ethers.getContractFactory("TimeLock");
  const timelock = await TimeLock.deploy(
    minDelay,
    [deployer.address], // proposers (can be Governance later)
    [deployer.address], // executors (anyone can execute after delay)
    deployer.address    // admin
  );
  await timelock.waitForDeployment();
  const timelockAddr = await timelock.getAddress();
  addresses.timelock = timelockAddr;
  console.log(`✅ TimeLock: ${timelockAddr}`);
  console.log(`   Min Delay: ${minDelay} seconds (demo mode)`);

  // Deploy Governor
  const Governance = await ethers.getContractFactory("Governance");
  const governor = await Governance.deploy(govTokenAddr, timelockAddr);
  await governor.waitForDeployment();
  const governorAddr = await governor.getAddress();
  addresses.governor = governorAddr;
  console.log(`✅ Governor: ${governorAddr}`);
  console.log(`   Voting Period: 20 blocks` );
  console.log(`   Quorum: 4%`);

  // Update TimeLock roles: allow Governor to propose
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const DEFAULT_ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();

  const grantProposerTx = await timelock.grantRole(PROPOSER_ROLE, governorAddr);
  await grantProposerTx.wait();
  console.log(`   Governor granted PROPOSER_ROLE`);

  const grantExecutorTx = await timelock.grantRole(
    EXECUTOR_ROLE,
    ethers.ZeroAddress
  );
  await grantExecutorTx.wait();
  console.log(`   Anyone can execute (EXECUTOR_ROLE to 0x0)`);

  // ============ MEMBER A: UPGRADE DEMO (V1 -> V2) ============
  console.log("\n--- MEMBER A: Demonstrating Proxy Upgrade (V1 -> V2) ---");

  // Transfer ownership of LendingPool to Governor (for governance-controlled upgrades)
  console.log("⏳ Transferring LendingPool ownership to Governor...");
  const transferOwnershipTx = await lendingPoolProxy.transferOwnership(governorAddr);
  await transferOwnershipTx.wait();
  console.log(`✅ LendingPool ownership transferred to Governor`);

  // Perform direct V1->V2 upgrade for demo
  console.log("\n⏳ Upgrading to LendingPoolV2...");
  const LendingPoolV2 = await ethers.getContractFactory("LendingPoolV2");
  const lendingPoolV2 = await upgrades.upgradeProxy(
    lendingPoolAddr,
    LendingPoolV2,
    {
      constructorArgs: [mETHAddr, mDAIAddr],
      unsafeAllow: ["state-variable-assignment", "constructor"],
    }
  );
  await lendingPoolV2.waitForDeployment();
  addresses.lendingPoolV2 = lendingPoolAddr; // Same proxy address
  
  console.log(`✅ Upgrade to V2 Successful!`);
  console.log(`   New Version: ${await lendingPoolV2.getVersion()}`);

  // Downgrade back to V1 for testing both versions
  console.log("\n⏳ Testing Downgrade: V2 -> V1...");
  const lendingPoolV1_restored = await upgrades.upgradeProxy(
    lendingPoolAddr,
    LendingPoolV1,
    {
      constructorArgs: [mETHAddr, mDAIAddr],
      unsafeAllow: ["state-variable-assignment", "constructor"],
    }
  );
  await lendingPoolV1_restored.waitForDeployment();
  
  console.log(`✅ Downgraded back to V1`);
  console.log(`   Current Version: ${await lendingPoolV1_restored.getVersion()}`);

  // ============ MEMBER D: LIQUIDITY MINING ============
  console.log("\n--- MEMBER D: Liquidity Mining / Staking Rewards ---");

  const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
  
  // Deploy Staking contract via Proxy
  const rewardRate = ethers.parseEther("0.1");      // 0.1 reward token per second
  const bonusRewardRate = ethers.parseEther("0.05"); // 0.05 bonus per second
  
  const liquidityMiningProxy = await upgrades.deployProxy(
    LiquidityMining,
    [
      mDAIAddr,            // staking token (mDAI)
      mDAIAddr,            // main reward token (mDAI)
      govTokenAddr,        // bonus reward token (GOV)
      rewardRate,
      bonusRewardRate,
      deployer.address,
    ],
    {
      kind: "uups",
    }
  );
  await liquidityMiningProxy.waitForDeployment();
  const liquidityMiningAddr = await liquidityMiningProxy.getAddress();
  addresses.liquidityMining = liquidityMiningAddr;
  
  console.log(`✅ LiquidityMining Proxy: ${liquidityMiningAddr}`);
  console.log(`   Staking Token: mDAI`);
  console.log(`   Main Reward: mDAI (${ethers.formatEther(rewardRate)}/sec)`);
  console.log(`   Bonus Reward: GOV (${ethers.formatEther(bonusRewardRate)}/sec)`);

  // ============ EMERGENCY MULTISIG (Optional - Member C) ============
  console.log("\n--- MEMBER C: Emergency MultiSig (Optional) ---");

  const EmergencyMultiSig = await ethers.getContractFactory(
    "EmergencyMultiSig"
  );
  // Simple setup: just deployer (1-of-1)
  const multisig = await EmergencyMultiSig.deploy(
    [deployer.address],
    1 // require 1 confirmation
  );
  await multisig.waitForDeployment();
  const multisigAddr = await multisig.getAddress();
  addresses.emergencyMultisig = multisigAddr;
  
  console.log(`✅ EmergencyMultiSig: ${multisigAddr}`);

  // ============ PREPARE DEMO DATA ============
  console.log("\n--- Preparing Demo Data ---");

  // Mint test tokens for demo
  const mintAmount = ethers.parseEther("10000");
  
  const mintMETHTx = await mETH.mint(deployer.address, mintAmount);
  await mintMETHTx.wait();
  
  const mintDAITx = await mDAI.mint(deployer.address, mintAmount);
  await mintDAITx.wait();
  
  console.log(`✅ Demo tokens minted to deployer:`);
  console.log(`   10000 mETH`);
  console.log(`   10000 mDAI`);

  // Approve LendingPool for deposits
  const approveMETHTx = await mETH.approve(lendingPoolAddr, ethers.parseEther("5000"));
  await approveMETHTx.wait();
  
  const approveDAITx = await mDAI.approve(lendingPoolAddr, ethers.parseEther("5000"));
  await approveDAITx.wait();
  
  console.log(`✅ Approved LendingPool to spend tokens`);

  // ============ SUMMARY ============
  console.log("\n========================================");
  console.log("✅ ALL DEPLOYMENTS COMPLETE!");
  console.log("========================================\n");

  console.log("📋 CONTRACT ADDRESSES:");
  console.log(JSON.stringify(addresses, null, 2));

  // Save addresses to file for frontend use
  const outputPath = path.join(__dirname, "../addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log(`\n📄 Addresses saved to: ${outputPath}`);

  return addresses;
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
