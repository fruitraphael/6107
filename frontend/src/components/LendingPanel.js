import React, { useState } from 'react';

function LendingPanel({ account, signer }) {
  const [activeTab, setActiveTab] = useState('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleDeposit = async () => {
    if (!depositAmount) {
      setMessage({ type: 'error', text: 'Please enter an amount' });
      return;
    }
    setLoading(true);
    // In real app, call contract method
    setTimeout(() => {
      setMessage({ type: 'success', text: `Successfully deposited ${depositAmount} mETH` });
      setDepositAmount('');
      setLoading(false);
    }, 1000);
  };

  const handleBorrow = async () => {
    if (!borrowAmount) {
      setMessage({ type: 'error', text: 'Please enter an amount' });
      return;
    }
    setLoading(true);
    // In real app, call contract method
    setTimeout(() => {
      setMessage({ type: 'success', text: `Successfully borrowed ${borrowAmount} mDAI` });
      setBorrowAmount('');
      setLoading(false);
    }, 1000);
  };

  const handleRepay = async () => {
    if (!repayAmount) {
      setMessage({ type: 'error', text: 'Please enter an amount' });
      return;
    }
    setLoading(true);
    // In real app, call contract method
    setTimeout(() => {
      setMessage({ type: 'success', text: `Successfully repaid ${repayAmount} mDAI` });
      setRepayAmount('');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="panel">
      <h2 className="panel-title">💰 Lending Pool</h2>

      {message && (
        <div className={`alert ${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Collateral Deposited</div>
          <div className="stat-value">50 mETH</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Borrowed</div>
          <div className="stat-value">2 mDAI</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Health Factor</div>
          <div className="stat-value" style={{ color: '#00d97f' }}>5.0</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Available to Borrow</div>
          <div className="stat-value">48 mDAI</div>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '30px' }}>
        <button 
          className={`nav-tab ${activeTab === 'deposit' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposit')}
          style={{ margin: 0 }}
        >
          Deposit
        </button>
        <button 
          className={`nav-tab ${activeTab === 'borrow' ? 'active' : ''}`}
          onClick={() => setActiveTab('borrow')}
          style={{ margin: 0 }}
        >
          Borrow
        </button>
        <button 
          className={`nav-tab ${activeTab === 'repay' ? 'active' : ''}`}
          onClick={() => setActiveTab('repay')}
          style={{ margin: 0 }}
        >
          Repay
        </button>
      </div>

      {activeTab === 'deposit' && (
        <div>
          <div className="input-group-vertical">
            <label className="form-label">Amount to Deposit (mETH)</label>
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '20px' }}>
            Your available balance: 100 mETH
          </div>
          <button 
            className="btn-action"
            onClick={handleDeposit}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Deposit Collateral'}
          </button>
        </div>
      )}

      {activeTab === 'borrow' && (
        <div>
          <div className="input-group-vertical">
            <label className="form-label">Amount to Borrow (mDAI)</label>
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '20px' }}>
            Maximum you can borrow: 48 mDAI (based on collateral)
          </div>
          <button 
            className="btn-action"
            onClick={handleBorrow}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Borrow mDAI'}
          </button>
        </div>
      )}

      {activeTab === 'repay' && (
        <div>
          <div className="input-group-vertical">
            <label className="form-label">Amount to Repay (mDAI)</label>
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '20px' }}>
            You owe: 2 mDAI
          </div>
          <button 
            className="btn-action"
            onClick={handleRepay}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Repay Debt'}
          </button>
        </div>
      )}
    </div>
  );
}

export default LendingPanel;
