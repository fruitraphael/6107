import React, { useState, useEffect } from 'react';

function Dashboard({ account, provider, balances }) {
  const [stats, setStats] = useState({
    tvl: '0',
    totalBorrowed: '0',
    totalStaked: '0',
    activeUsers: '0'
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // In real app, load from contracts
    setStats({
      tvl: '$2,450,000',
      totalBorrowed: '$1,850,000',
      totalStaked: '$3,200,000',
      activeUsers: '127'
    });
  };

  return (
    <div className="panel">
      <h2 className="panel-title">📊 Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Value Locked</div>
          <div className="stat-value">{stats.tvl}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Borrowed</div>
          <div className="stat-value">{stats.totalBorrowed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Staked</div>
          <div className="stat-value">{stats.totalStaked}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Users</div>
          <div className="stat-value">{stats.activeUsers}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Your mETH Balance</div>
          <div className="stat-value">{balances.mETH}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Your mDAI Balance</div>
          <div className="stat-value">{balances.mDAI}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Your GOV Balance</div>
          <div className="stat-value">{balances.GOV}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Portfolio Value</div>
          <div className="stat-value">$0.00</div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginTop: '30px' }}>
        <div className="stat-card">
          <div className="stat-label">Lending Position</div>
          <div className="stat-value">$0.00</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Earned Interest</div>
          <div className="stat-value">$0.00</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Staking Rewards</div>
          <div className="stat-value">$0.00</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Voting Power</div>
          <div className="stat-value">0 GOV</div>
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '10px', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
        <h5 style={{ marginBottom: '15px', color: '#00d4ff' }}>🎯 Quick Start</h5>
        <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
          <li>💰 Go to <strong>Lending Pool</strong> to deposit collateral and borrow tokens</li>
          <li>🗳️ Visit <strong>Governance</strong> to participate in voting and proposals</li>
          <li>⚡ Check <strong>Staking</strong> to earn rewards on your tokens</li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
