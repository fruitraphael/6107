import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import LendingPanel from './components/LendingPanel';
import GovernancePanel from './components/GovernancePanel';
import StakingPanel from './components/StakingPanel';

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [userBalances, setUserBalances] = useState({
    mETH: '0',
    mDAI: '0',
    GOV: '0'
  });

  // Connect to wallet
  const connectWallet = async () => {
    try {
      setLoading(true);
      if (!window.ethereum) {
        alert('Please install MetaMask');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);

      // Load user balances
      await loadBalances(signer, accounts[0]);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // Load user balances
  const loadBalances = async (signer, account) => {
    try {
      const addresses = await fetch('../../../addresses.json').then(r => r.json());
      
      // Load token balances (simplified - in real app, you'd call contract methods)
      setUserBalances({
        mETH: '0',
        mDAI: '0',
        GOV: '0'
      });
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setUserBalances({ mETH: '0', mDAI: '0', GOV: '0' });
  };

  return (
    <div className="App">
      <Navbar 
        account={account} 
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
      />

      <div className="container-fluid mt-4">
        {!account ? (
          <div className="welcome-section text-center py-5">
            <div className="welcome-card">
              <h1 className="mb-4">🚀 Welcome to DeFi Protocol</h1>
              <p className="lead mb-5">Advanced Financial Platform with Lending, Governance & Staking</p>
              <button 
                className="btn btn-primary btn-lg"
                onClick={connectWallet}
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        ) : (
          <div className="row">
            <div className="col-md-3">
              <div className="nav-tabs-vertical">
                <button 
                  className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  📊 Dashboard
                </button>
                <button 
                  className={`nav-tab ${activeTab === 'lending' ? 'active' : ''}`}
                  onClick={() => setActiveTab('lending')}
                >
                  💰 Lending Pool
                </button>
                <button 
                  className={`nav-tab ${activeTab === 'governance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('governance')}
                >
                  🗳️ Governance
                </button>
                <button 
                  className={`nav-tab ${activeTab === 'staking' ? 'active' : ''}`}
                  onClick={() => setActiveTab('staking')}
                >
                  ⚡ Staking
                </button>
              </div>
            </div>

            <div className="col-md-9">
              {activeTab === 'dashboard' && (
                <Dashboard 
                  account={account} 
                  provider={provider}
                  balances={userBalances}
                />
              )}
              {activeTab === 'lending' && (
                <LendingPanel 
                  account={account} 
                  signer={signer}
                />
              )}
              {activeTab === 'governance' && (
                <GovernancePanel 
                  account={account} 
                  signer={signer}
                />
              )}
              {activeTab === 'staking' && (
                <StakingPanel 
                  account={account} 
                  signer={signer}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
