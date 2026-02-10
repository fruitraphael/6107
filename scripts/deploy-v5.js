const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, signer2] = await ethers.getSigners();
  console.log("\n========================================");
  console.log("🚀 INTEGRATED DEPLOYMENT - ALL MEMBERS");
  console.log("========================================\n");
  console.log("Deployer:", deployer.address);
  console.log("Signer2:", signer2.address);

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
  await lendingPoolProxy.deployed();
  const lendingPoolAddr = lendingPoolProxy.address;
  addresses.lendingPoolV1 = lendingPoolAddr;
  
  console.log(`✅ LendingPool Proxy (V1): ${lendingPoolAddr}`);
  console.log(`   Version: ${await lendingPoolProxy.getVersion()}`);

  // ============ MEMBER C: GOVERNANCE ============
  console.log("\n--- MEMBER C: Governance & MultiSig ---");

  // Deploy Governance Token
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const govToken = await GovernanceToken.deploy(deployer.address);
  await govToken.deployed();
  const govTokenAddr = govToken.address;
  addresses.governanceToken = govTokenAddr;
  console.log(`✅ GovernanceToken: ${govTokenAddr}`);

  // Mint governance tokens for voting
  const mintTx = await govToken.mint(deployer.address, ethers.utils.parseEther("1000"));
  await mintTx.wait();
  console.log(`   Minted 1000 GOV to deployer`);

  // Delegate voting power (for snapshot voting)
  const delegateTx = await govToken.delegate(deployer.address);
  await delegateTx.wait();
  console.log(`   Delegated voting power to deployer`);

  // Deploy TimeLock
  const minDelay = 86400; // 24 hours in seconds (as required by Member C's contract)
  const TimeLock = await ethers.getContractFactory("TimeLock");
  const timelock = await TimeLock.deploy(
    minDelay,
    [deployer.address],
    [deployer.address],
    deployer.address
  );
  await timelock.deployed();
  const timelockAddr = timelock.address;
  addresses.timeLock = timelockAddr;
  console.log(`✅ TimeLock: ${timelockAddr}`);

  // Deploy SimpleGovernance
  const SimpleGovernance = await ethers.getContractFactory("SimpleGovernance");
  const governor = await SimpleGovernance.deploy(govTokenAddr);
  await governor.deployed();
  const governorAddr = governor.address;
  addresses.governance = governorAddr;
  console.log(`✅ SimpleGovernance: ${governorAddr}`);

  // Deploy Emergency MultiSig (needs 2+ owners with required >= 2)
  const multiSignOwners = [deployer.address, signer2.address]; // Use 2 different owners
  const multiSigThreshold = 2; // Require both approvals (2 of 2)
  const EmergencyMultiSig = await ethers.getContractFactory("EmergencyMultiSig");
  const multisig = await EmergencyMultiSig.deploy(multiSignOwners, multiSigThreshold);
  await multisig.deployed();
  const multisigAddr = multisig.address;
  addresses.emergencyMultiSig = multisigAddr;
  console.log(`✅ EmergencyMultiSig: ${multisigAddr}`);

  // ============ MEMBER D: STAKING & REWARDS ============
  console.log("\n--- MEMBER D: Liquidity Mining (Staking Rewards) ---");

  const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
  const rewardRate = ethers.utils.parseEther("0.1");
  const bonusRewardRate = ethers.utils.parseEther("0.05");
  
  const liquidityMining = await LiquidityMining.deploy(
    mETHAddr,        // staking token: mETH
    mDAIAddr,        // reward token: mDAI
    govTokenAddr,    // bonus reward token: GOV
    rewardRate,
    bonusRewardRate
  );
  await liquidityMining.deployed();
  const liquidityMiningAddr = liquidityMining.address;
  addresses.liquidityMining = liquidityMiningAddr;
  console.log(`✅ LiquidityMining: ${liquidityMiningAddr}`);
  console.log(`   Reward Rate: 0.1 per second`);
  console.log(`   Bonus Rate: 0.05 per second`);

  // ============ SETUP INTERACTIONS ============
  console.log("\n--- Setting Up Interactions ---");

  // Mint initial tokens for testing
  const mintAmount = ethers.utils.parseEther("10000");
  const mintTx1 = await mETH.mint(deployer.address, mintAmount);
  await mintTx1.wait();
  const mintTx2 = await mDAI.mint(deployer.address, mintAmount);
  await mintTx2.wait();
  console.log(`✅ Minted ${ethers.utils.formatEther(mintAmount)} test tokens`);

  // Approve lending pool
  const approveMETHTx = await mETH.approve(lendingPoolAddr, ethers.utils.parseEther("5000"));
  await approveMETHTx.wait();
  const approveDAITx = await mDAI.approve(lendingPoolAddr, ethers.utils.parseEther("5000"));
  await approveDAITx.wait();
  console.log(`✅ Approved lending pool for mETH & mDAI`);

  // Approve staking
  const approveMETHStakeTx = await mETH.approve(liquidityMiningAddr, ethers.utils.parseEther("5000"));
  await approveMETHStakeTx.wait();
  console.log(`✅ Approved staking contract for mETH`);

  // ============ SAVE ADDRESSES ============
  console.log("\n--- Saving Addresses ---");
  const addressesPath = path.join(__dirname, "..", "addresses.json");
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`✅ Saved to addresses.json`);

  console.log("\n========================================");
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("========================================\n");
  console.log("Contract Addresses:");
  Object.entries(addresses).forEach(([name, addr]) => {
    console.log(`  ${name}: ${addr}`);
  });
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
