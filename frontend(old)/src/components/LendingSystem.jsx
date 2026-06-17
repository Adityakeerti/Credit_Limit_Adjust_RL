import React, { useState } from 'react';
import GlassCard from './GlassCard';

const LendingSystem = () => {
    const [borrowAmount, setBorrowAmount] = useState('');

    return (
        <GlassCard className="dashboard-section lending-section">
            <h3 className="section-header">Lending System</h3>
            <div className="lending-content">
                <div className="balance-display">
                    <span className="label">Available Credit</span>
                    <span className="value text-gradient">$50,000.00</span>
                </div>

                <div className="action-area">
                    <div className="input-group">
                        <input
                            type="number"
                            placeholder="Amount to Borrow"
                            className="glass-input"
                            value={borrowAmount}
                            onChange={(e) => setBorrowAmount(e.target.value)}
                        />
                    </div>
                    <button className="dashboard-btn primary">Borrow</button>
                    <button className="dashboard-btn secondary">Repay</button>
                </div>

                <div className="active-loans">
                    <h4>Active Loans</h4>
                    <div className="loan-item">
                        <span>Home Loan</span>
                        <span className="negative">-$120,000</span>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default LendingSystem;
