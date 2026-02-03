import { useEffect, useState } from "react";
import { ethers } from "ethers";

const stakingAddress = "0xYOUR_STAKING_CONTRACT_ADDRESS";
const stakingABI = [
  "function stake(uint256 amount)",
  "function claimReward()",
  "function earned(address account) view returns (uint256)",
  "function balances(address account) view returns (uint256)"
];

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [earned, setEarned] = useState("0");
  const [stakeAmount, setStakeAmount] = useState("");

  async function connectWallet() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    const staking = new ethers.Contract(
      stakingAddress,
      stakingABI,
      signer
    );

    setAccount(address);
    setContract(staking);
  }

  async function stake() {
    await contract.stake(ethers.parseEther(stakeAmount));
  }

  async function claim() {
    await contract.claimReward();
  }

  async function loadEarned() {
    if (!contract || !account) return;
    const value = await contract.earned(account);
    setEarned(ethers.formatEther(value));
  }

  useEffect(() => {
    loadEarned();
  }, [contract, account]);

  return (
    <div style={{ padding: 40 }}>
      <h2>Staking Demo (Member D)</h2>

      {!account && (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}

      {account && (
        <>
          <p>Connected: {account}</p>

          <input
            placeholder="Stake amount"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
          />
          <button onClick={stake}>Stake</button>

          <p>Earned: {earned}</p>
          <button onClick={claim}>Claim Reward</button>
        </>
      )}
    </div>
  );
}

export default App;
