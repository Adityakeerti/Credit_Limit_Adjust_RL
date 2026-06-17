import React from 'react';
import BankerQuickStats from './BankerQuickStats';
import AssetsEnvironment from './AssetsEnvironment';
import TransactionSystem from './TransactionSystem';

const DashboardContent = ({ userType }) => {
    return (
        <div className="dashboard-content-grid">
            <h1 className="dashboard-title">Overview ({userType === 'banker' ? 'Banker' : 'User'})</h1>

            <div className="dashboard-grid">
                {/* Banker Stats - Only visible to Banker */}
                {userType === 'banker' && (
                    <section className="dashboard-column">
                        <BankerQuickStats />
                    </section>
                )}

                {/* Assets Environment */}
                <section className="dashboard-column">
                    <AssetsEnvironment />
                </section>

                {/* Transactions */}
                <section className="dashboard-column">
                    <TransactionSystem />
                </section>
            </div>
        </div>
    );
};

export default DashboardContent;
