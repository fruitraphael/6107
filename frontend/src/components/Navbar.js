import React from 'react';
import './Navbar.css';

function Navbar({ account, onConnect, onDisconnect }) {
  const formatAddress = (address) => {
    if (!address) return '';
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">DeFi Protocol</span>
        </div>

        <div className="navbar-right">
          {account ? (
            <div className="wallet-connected">
              <span className="account-badge">
                {formatAddress(account)}
              </span>
              <button className="btn-disconnect" onClick={onDisconnect}>
                Disconnect
              </button>
            </div>
          ) : (
            <button className="btn-connect" onClick={onConnect}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
