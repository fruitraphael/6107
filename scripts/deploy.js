const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying with account:", deployer.address);

  // 1. 部署 Mock Tokens
  const MockToken = await ethers.getContractFactory("MockToken");
  const mETH = await MockToken.deploy("Mock ETH", "mETH");
  const mDAI = await MockToken.deploy("Mock DAI", "mDAI");
  await mETH.waitForDeployment();
  const mETHAddr = await mETH.getAddress();
  const mDAIAddr = await mDAI.getAddress();
  console.log(`✅ Tokens: mETH(${mETHAddr}), mDAI(${mDAIAddr})`);

  // 2. 部署 LendingPoolV1 (UUPS Proxy)
  const LendingPoolV1 = await ethers.getContractFactory("LendingPoolV1");
  
  console.log("Deploying Proxy...");
  const proxy = await upgrades.deployProxy(
    LendingPoolV1, 
    [mETHAddr, mDAIAddr, deployer.address], 
    { 
      kind: 'uups', 
      constructorArgs: [mETHAddr, mDAIAddr],
      // 👇👇👇 关键修改：添加这行白名单，允许继承 Member B 的构造函数和变量赋值 👇👇👇
      unsafeAllow: ['state-variable-assignment', 'constructor'] 
    }
  );
  await proxy.waitForDeployment();
  const proxyAddr = await proxy.getAddress();
  console.log(`✅ LendingPool Proxy: ${proxyAddr}`);

  // 3. 验证 V1
  console.log("Current Version:", await proxy.getVersion());

  // 4. 演示升级到 V2
  console.log("\n⚡ Upgrading to V2...");
  const LendingPoolV2 = await ethers.getContractFactory("LendingPoolV2");
  
  const upgraded = await upgrades.upgradeProxy(proxyAddr, LendingPoolV2, {
      constructorArgs: [mETHAddr, mDAIAddr],
      // 👇 升级时也要加白名单
      unsafeAllow: ['state-variable-assignment', 'constructor']
  });
  await upgraded.waitForDeployment();

  console.log("✅ Upgrade Successful!");
  console.log("New Version:", await upgraded.getVersion());
  
  // 5. 验证新功能
  await upgraded.setProtocolFee(100);
  console.log("Protocol Fee Set:", await upgraded.protocolFee());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});