import React, { useState } from 'react';

function GovernancePanel({ account, signer }) {
  const [proposals, setProposals] = useState([
    {
      id: 1,
      title: 'Increase min collateral requirement to 150%',
      status: 'Active',
      votes: { for: 1250, against: 340, abstain: 120 },
      endBlock: 'Block 15,234,567'
    },
    {
      id: 2,
      title: 'Enable governance token staking',
      status: 'Active',
      votes: { for: 890, against: 210, abstain: 80 },
      endBlock: 'Block 15,240,000'
    }
  ]);

  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');

  const handleCreateProposal = async () => {
    if (!proposalTitle) {
      alert('Please enter proposal title');
      return;
    }
    // In real app, call contract
    alert('Proposal created successfully!');
    setShowCreateProposal(false);
    setProposalTitle('');
    setProposalDesc('');
  };

  const handleVote = async (proposalId, voteType) => {
    // In real app, call contract
    alert(`Voted ${voteType} on proposal ${proposalId}`);
  };

  return (
    <div className="panel">
      <h2 className="panel-title">🗳️ Governance</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">GOV Balance</div>
          <div className="stat-value">1,000 GOV</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Voting Power</div>
          <div className="stat-value">1,000</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Proposals</div>
          <div className="stat-value">2</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Votes Cast</div>
          <div className="stat-value">5</div>
        </div>
      </div>

      <button 
        className="btn-action"
        onClick={() => setShowCreateProposal(!showCreateProposal)}
        style={{ marginTop: '20px', marginBottom: '30px', background: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.5)' }}
      >
        {showCreateProposal ? '✕ Cancel' : '+ Create Proposal'}
      </button>

      {showCreateProposal && (
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
          <h5 style={{ marginBottom: '20px' }}>Create New Proposal</h5>
          <div className="input-group-vertical">
            <label className="form-label">Proposal Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter proposal title"
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
            />
          </div>
          <div className="input-group-vertical">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              placeholder="Describe your proposal"
              value={proposalDesc}
              onChange={(e) => setProposalDesc(e.target.value)}
              rows="4"
            />
          </div>
          <button className="btn-action" onClick={handleCreateProposal}>
            Submit Proposal
          </button>
        </div>
      )}

      <h4 style={{ marginTop: '30px', marginBottom: '20px' }}>Active Proposals</h4>

      {proposals.map((proposal) => (
        <div key={proposal.id} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '10px', marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
            <div>
              <h5 style={{ margin: 0, marginBottom: '5px' }}>Proposal #{proposal.id}: {proposal.title}</h5>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Ends: {proposal.endBlock}
              </p>
            </div>
            <span style={{ background: '#00d97f', color: '#000', padding: '5px 10px', borderRadius: '5px', fontSize: '0.85rem', fontWeight: 600 }}>
              {proposal.status}
            </span>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>For: {proposal.votes.for} votes</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {((proposal.votes.for / (proposal.votes.for + proposal.votes.against + proposal.votes.abstain)) * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', marginBottom: '10px' }}>
              <div 
                style={{ 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #00d97f, #00d4ff)',
                  width: `${(proposal.votes.for / (proposal.votes.for + proposal.votes.against + proposal.votes.abstain)) * 100}%`,
                  borderRadius: '2px'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
              <span>Against: {proposal.votes.against}</span>
              <span>Abstain: {proposal.votes.abstain}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <button 
              className="btn-secondary"
              onClick={() => handleVote(proposal.id, 'For')}
              style={{ fontSize: '0.9rem', marginTop: 0 }}
            >
              Vote For ✓
            </button>
            <button 
              className="btn-secondary"
              onClick={() => handleVote(proposal.id, 'Against')}
              style={{ fontSize: '0.9rem', marginTop: 0 }}
            >
              Vote Against ✗
            </button>
            <button 
              className="btn-secondary"
              onClick={() => handleVote(proposal.id, 'Abstain')}
              style={{ fontSize: '0.9rem', marginTop: 0 }}
            >
              Abstain ∼
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default GovernancePanel;
