import React, { useState } from 'react';

function StakingPanel({ account, signer }) {
  const [activeTab, setActiveTab] = useState('stake');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleStake = async () => {
    if (!stakeAmount) {
      setMessage({ type: 'error', text: 'Please enter an amount' });
      return;
    }
    setLoading(true);
    // In real app, call contract
    setTimeout(() => {
      setMessage({ type: 'success', text: `Successfully staked ${stakeAmount} mETH` });
      setStakeAmount('');
      setLoading(false);
    }, 1000);
  };

  const handleUnstake = async () => {
    if (!unstakeAmount) {
      setMessage({ type: 'error', text: 'Please enter an amount' });
      return;
    }
    setLoading(true);
    // In real app, call contract
    setTimeout(() => {
      setMessage({ type: 'success', text: `Successfully unstaked ${unstakeAmount} mETH` });
      setUnstakeAmount('');
      setLoading(false);
    }, 1000);
  };

  const handleClaimRewards = async () => {
    setLoading(true);
    // In real app, call contract
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Rewards claimed successfully!' });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="panel">
      <h2 className="panel-title">⚡ Liquidity Mining</h2>

      {message && (
        <div className={`alert ${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Staked Amount</div>
          <div className="stat-value">10 mETH</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Reward Rate</div>
          <div className="stat-value" style={{ color: '#00d97f' }}>0.1 mDAI/s</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Earned Rewards</div>
          <div className="stat-value" style={{ color: '#ffa502' }}>1.234 mDAI</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bonus Rewards</div>
          <div className="stat-value" style={{ color: '#ffa502' }}>0.617 GOV</div>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '30px' }}>
        <button 
          className={`nav-tab ${activeTab === 'stake' ? 'active' : ''}`}
          onClick={() => setActiveTab('stake')}
          style={{ margin: 0 }}
        >
          Stake
        </button>
        <button 
          className={`nav-tab ${activeTab === 'unstake' ? 'active' : ''}`}
          onClick={() => setActiveTab('unstake')}
          style={{ margin: 0 }}
        >
          Unstake
        </button>
      </div>

      {activeTab === 'stake' && (
        <div>
          <div className="input-group-vertical">
            <label className="form-label">Amount to Stake (mETH)</label>
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '20px' }}>
            Your available balance: 100 mETH
          </div>
          <button 
            className="btn-action"
            onClick={handleStake}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Stake mETH'}
          </button>
        </div>
      )}

      {activeTab === 'unstake' && (
        <div>
          <div className="input-group-vertical">
            <label className="form-label">Amount to Unstake (mETH)</label>
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '20px' }}>
            Currently staked: 10 mETH
          </div>
          <button 
            className="btn-action"
            onClick={handleUnstake}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Unstake mETH'}
          </button>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '10px', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h5 style={{ margin: 0 }}>💎 Your Rewards</h5>
          <button 
            className="btn-action"
            onClick={handleClaimRewards}
            disabled={loading}
            style={{ margin: 0, width: 'auto', padding: '8px 20px', marginTop: 0 }}
          >
            {loading ? 'Claiming...' : 'Claim All'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.95rem' }}>
          <div>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '5px' }}>mDAI Rewards</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffa502' }}>1.234 mDAI</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '5px' }}>GOV Bonus</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffa502' }}>0.617 GOV</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px' }}>
        <h5 style={{ marginBottom: '15px' }}>📊 Reward Rates</h5>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.95rem' }}>
          <li>Base Reward: <strong>0.1 mDAI per second</strong></li>
          <li>Bonus Reward: <strong>0.05 GOV per second</strong></li>
          <li>APY: <strong>~31.5%</strong> (on base rewards)</li>
        </ul>
      </div>
    </div>
  );
}

export default StakingPanel;
