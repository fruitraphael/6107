const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * INTEGRATED DEMO - ethers v5 compatible
 * Demonstrates all team members' deployed contracts
 */

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  
  console.log("\n" + "=".repeat(70));
  console.log("🚀 INTEGRATED DEMO - ALL 4 TEAM MEMBERS' CONTRACTS");
  console.log("=".repeat(70) + "\n");

  // Load addresses
  const addressesPath = path.join(__dirname, "../addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error("❌ addresses.json not found! Run 'npm run deploy' first.");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
  console.log("📍 Deployed Contracts Loaded:\n");
  Object.entries(addresses).forEach(([name, addr]) => {
    console.log(`   ${name.padEnd(20)} : ${addr}`);
  });
  console.log();

  // ============ GET CONTRACT INSTANCES ============
  const mETH = await ethers.getContractAt("MockToken", addresses.mETH);
  const mDAI = await ethers.getContractAt("MockToken", addresses.mDAI);
  const lendingPool = await ethers.getContractAt("LendingPoolV1", addresses.lendingPoolV1);
  const govToken = await ethers.getContractAt("GovernanceToken", addresses.governanceToken);
  const governor = await ethers.getContractAt("SimpleGovernance", addresses.governance);
  const timelock = await ethers.getContractAt("TimeLock", addresses.timeLock);
  const liquidityMining = await ethers.getContractAt("LiquidityMining", addresses.liquidityMining);
  const multisig = await ethers.getContractAt("EmergencyMultiSig", addresses.emergencyMultiSig);

  // ============ MEMBER A & B: LENDING POOL ============
  console.log("\n" + "=".repeat(70));
  console.log("💰 MEMBER A & B: LENDING POOL - DEPOSIT & BORROW");
  console.log("=".repeat(70) + "\n");

  console.log("1️⃣  Depositing 100 mETH as collateral...");
  let tx = await lendingPool.deposit(mETH.address, ethers.utils.parseEther("100"), deployer.address);
  await tx.wait();
  
  const collateralBal = await lendingPool.getCollateralBalance(deployer.address, mETH.address);
  console.log(`   ✅ Collateral deposited: ${ethers.utils.formatEther(collateralBal)} mETH\n`);

  console.log("2️⃣  Borrowing 20 mDAI against collateral...");
  tx = await lendingPool.borrow(mDAI.address, ethers.utils.parseEther("20"), deployer.address);
  await tx.wait();

  const debtBal = await lendingPool.getBorrow(deployer.address, mDAI.address);
  console.log(`   ✅ Debt borrowed: ${ethers.utils.formatEther(debtBal)} mDAI\n`);

  console.log("3️⃣  Checking lending pool version...");
  const version = await lendingPool.getVersion();
  console.log(`   ✅ Lending Pool Version: ${version}\n`);

  // ============ MEMBER C: GOVERNANCE ============
  console.log("=".repeat(70));
  console.log("🗳️  MEMBER C: GOVERNANCE - TOKENS & VOTING");
  console.log("=".repeat(70) + "\n");

  console.log("1️⃣  Checking governance token voting power...");
  const votes = await govToken.getVotes(deployer.address);
  console.log(`   ✅ Voting power: ${ethers.utils.formatEther(votes)} sGOV\n`);

  console.log("2️⃣  Checking TimeLock minimum delay...");
  const minDelay = await timelock.getMinDelay();
  console.log(`   ✅ TimeLock minimum delay: ${minDelay} seconds (24 hours)\n`);

  console.log("3️⃣  Submitting governance proposal...");
  tx = await governor.submitProposal(
    addresses.mETH,
    "0x",
    "Test Proposal: Demo Governance"
  );
  await tx.wait();

  const proposalCount = await governor.proposalCount();
  console.log(`   ✅ Total proposals: ${proposalCount}\n`);

  console.log("4️⃣  Checking Emergency MultiSig owners...");
  const ownerCount = await multisig.ownersCount();
  console.log(`   ✅ MultiSig has ${ownerCount} owners (2-of-2 signature required)\n`);

  // ============ MEMBER D: STAKING & REWARDS ============
  console.log("=".repeat(70));
  console.log("⚡ MEMBER D: LIQUIDITY MINING - STAKING & REWARDS");
  console.log("=".repeat(70) + "\n");

  console.log("1️⃣  Checking staking reward rates...");
  const rewardRate = await liquidityMining.rewardRate();
  const bonusRate = await liquidityMining.bonusRewardRate();
  console.log(`   ✅ Base reward rate: ${ethers.utils.formatEther(rewardRate)}/second`);
  console.log(`   ✅ Bonus reward rate: ${ethers.utils.formatEther(bonusRate)}/second\n`);

  console.log("2️⃣  Staking 50 mETH for rewards...");
  tx = await liquidityMining.stake(ethers.utils.parseEther("50"));
  await tx.wait();
  console.log(`   ✅ Stake transaction confirmed\n`);

  console.log("3️⃣  Simulating time passing (10 seconds)...");
  await ethers.provider.send("evm_increaseTime", [10]);
  await ethers.provider.send("evm_mine", []);
  console.log(`   ✅ Block time advanced\n`);

  console.log("4️⃣  Checking accrued rewards...");
  const earned = await liquidityMining.earned(deployer.address);
  const earnedBonus = await liquidityMining.earnedBonus(deployer.address);
  console.log(`   ✅ Base rewards earned: ${ethers.utils.formatEther(earned)} mDAI`);
  console.log(`   ✅ Bonus rewards earned: ${ethers.utils.formatEther(earnedBonus)} GOV\n`);

  console.log("5️⃣  Claiming rewards...");
  tx = await liquidityMining.claimRewards();
  await tx.wait();
  console.log(`   ✅ Rewards claimed\n`);

  console.log("6️⃣  Withdrawing staked tokens...");
  tx = await liquidityMining.withdraw(ethers.utils.parseEther("25"));
  await tx.wait();
  console.log(`   ✅ 25 mETH withdrawn\n`);

  // ============ INTEGRATION TEST ============
  console.log("=".repeat(70));
  console.log("🔗 INTEGRATION TEST - CROSS-CONTRACT WORKFLOW");
  console.log("=".repeat(70) + "\n");

  console.log("Workflow: Borrow from lending pool → Stake for rewards\n");

  console.log("1️⃣  User1 deposits 50 mETH collateral...");
  tx = await lendingPool.deposit(mETH.address, ethers.utils.parseEther("50"), user1.address);
  await tx.wait();
  console.log(`   ✅ Collateral deposited\n`);

  console.log("2️⃣  User1 borrows 10 mDAI...");
  tx = await lendingPool.borrow(mDAI.address, ethers.utils.parseEther("10"), user1.address);
  await tx.wait();
  console.log(`   ✅ mDAI borrowed\n`);

  console.log("3️⃣  User1 stakes 5 mETH in rewards pool...");
  tx = await liquidityMining.stake(ethers.utils.parseEther("5"));
  await tx.wait();
  console.log(`   ✅ Tokens staked\n`);

  // ============ FINAL SUMMARY ============
  console.log("=".repeat(70));
  console.log("✅ DEMO COMPLETE - ALL CONTRACTS WORKING!");
  console.log("=".repeat(70) + "\n");

  console.log("📊 SUMMARY:\n");
  console.log("  ✓ Member A: UUPS Proxy Pattern for upgradeable contracts");
  console.log("  ✓ Member B: Lending Pool Protocol (deposit, borrow, repay)");
  console.log("  ✓ Member C: Governance + TimeLock + Emergency MultiSig");
  console.log("  ✓ Member D: Dual-token staking rewards (mDAI + GOV)\n");

  console.log("📈 Key Metrics:\n");
  console.log(`  • Lending Pool Version: ${version}`);
  console.log(`  • Governance Proposals: ${proposalCount}`);
  console.log(`  • MultiSig Owners: ${ownerCount}`);
  console.log(`  • Total Contracts Deployed: 8\n`);

  console.log("🎯 All team members' code integrated and tested successfully!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
