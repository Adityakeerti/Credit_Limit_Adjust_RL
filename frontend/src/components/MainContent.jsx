import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import AssetCard from '../components/AssetCard';
import Chart from '../components/common/Chart';
import TradeModal from '../components/modals/TradeModal';
import BankerMainContent from '../components/BankerMainContent';
import NFTOwnership from '../components/NFTOwnership';
import AgentPanel from '../components/AgentPanel';
import { useApp } from '../context/AppContext';
import { getAllAssets, getPortfolio } from '../services/assetService';
import './MainContent.css';

const MainContent = () => {
    const { user, triggerTxUpdate, isAdmin } = useApp();
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [marketAssets, setMarketAssets] = useState([]);
    const [portfolioAssets, setPortfolioAssets] = useState([]);
    const [isLoadingMarket, setIsLoadingMarket] = useState(true);
    const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);

    // Trade Modal State
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
    const [tradeAsset, setTradeAsset] = useState(null);
    const [tradePortfolioItem, setTradePortfolioItem] = useState(null);

    // Fetch market assets on mount
    const fetchMarketAssets = async () => {
        try {
            setIsLoadingMarket(true);
            const assets = await getAllAssets();
            // Transform backend assets to display format
            const transformed = assets.map(asset => ({
                id: asset.assetId,
                code: asset.code,
                name: asset.name,
                type: asset.assetType,
                price: `${parseFloat(asset.unitPriceVex || 0).toFixed(2)} VEX`,
                priceValue: parseFloat(asset.unitPriceVex || 0),
                change: Math.random() * 10 - 2, // Simulated change
                unit: 'VEX',
                description: asset.description
            }));
            setMarketAssets(transformed);
        } catch (err) {
            console.error('Failed to fetch market assets:', err);
            setMarketAssets([]);
        } finally {
            setIsLoadingMarket(false);
        }
    };

    useEffect(() => {
        fetchMarketAssets();
    }, []);

    // Fetch user portfolio
    const fetchPortfolio = async () => {
        if (!user?.userId) {
            setIsLoadingPortfolio(false);
            return;
        }

        try {
            setIsLoadingPortfolio(true);
            const holdings = await getPortfolio(user.userId);
            // Transform holdings to display format
            const transformed = holdings.map(holding => ({
                id: holding.holdingId,
                name: holding.asset?.name || holding.assetCode || 'Unknown Asset',
                type: holding.asset?.assetType || 'ASSET',
                amount: `${parseFloat(holding.quantity || 0).toFixed(4)}`,
                value: `${(parseFloat(holding.quantity || 0) * parseFloat(holding.asset?.unitPriceVex || 0)).toFixed(2)} VEX`,
                assetCode: holding.assetCode,
                holdingId: holding.holdingId,
                asset: holding.asset // Keep internal reference
            }));
            setPortfolioAssets(transformed);
        } catch (err) {
            console.error('Failed to fetch portfolio:', err);
            setPortfolioAssets([]);
        } finally {
            setIsLoadingPortfolio(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
    }, [user?.userId]);

    // Asset price history (simulated)
    const generatePriceHistory = (basePrice) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.map((date, i) => ({
            date,
            price: basePrice * (0.9 + Math.random() * 0.2 + (i * 0.01))
        }));
    };

    const handleAssetClick = (asset) => {
        setSelectedAsset(asset);
    };

    const closeModal = () => {
        setSelectedAsset(null);
    };

    const openBuyModal = (e, asset) => {
        e.stopPropagation();
        setTradeType('buy');
        setTradeAsset(asset);
        setTradePortfolioItem(null);
        setShowTradeModal(true);
    };

    const openSellModal = (portfolioItem) => {
        setTradeType('sell');
        setTradeAsset(null);
        setTradePortfolioItem(portfolioItem);
        setShowTradeModal(true);
    };

    const handleTradeSuccess = () => {
        fetchPortfolio();
        if (triggerTxUpdate) triggerTxUpdate(); // Trigger transaction refresh
        alert(`Successfully ${tradeType === 'buy' ? 'purchased' : 'sold'} asset!`);
    };

    const getChartColor = (change) => {
        return change >= 0 ? '#10b981' : '#ef4444';
    };

    // Broadcast assets
    const broadcastAssets = marketAssets.length > 0 ? marketAssets : [
        { id: 1, name: 'Loading...', type: 'ASSET', price: '---', change: 0, unit: 'VEX' }
    ];

    // Determine user type (KNN Gimmick) from risk score
    const getUserType = () => {
        if (!user || user.riskScore === undefined) return 'Standard User';
        if (user.riskScore <= 0.3) return 'Good Payer';
        if (user.riskScore >= 0.7) return 'Late Payer';
        return 'Frequent Payer';
    };
    const userTypeLabel = getUserType();

    // Render BankerMainContent for admins
    if (isAdmin) {
        return <BankerMainContent />;
    }

    return (
        <div className="main-view-content">
            {/* KNN Gimmick Badge */}
            <div className={`user-type-badge ${userTypeLabel.replace(' ', '-').toLowerCase()}`}>
                <span className="badge-label">Predicted Profile:</span>
                <span className="badge-value">{userTypeLabel}</span>
            </div>

            {/* Broadcast Section */}
            <section className="section-broadcast">
                <div className="section-header-row">
                    <h2 className="section-title">Market Broadcast</h2>
                    <span className="live-pill">● LIVE</span>
                </div>
                <div className="broadcast-scroller">
                    <div className="broadcast-track">
                        {[...broadcastAssets, ...broadcastAssets].map((asset, index) => (
                            <div key={`${asset.id}-${index}`} className="broadcast-item">
                                <AssetCard
                                    name={asset.name}
                                    type={asset.type}
                                    price={asset.price}
                                    change={asset.change}
                                    onClick={() => handleAssetClick(asset)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Market List (Buy Section) - Hidden for Admins */}
            {!isAdmin && (
                <section className="section-market-list">
                    <h2 className="section-title">Available Assets</h2>
                    <div className="market-grid">
                        {marketAssets.map(asset => (
                            <div key={asset.id} className="market-asset-card" onClick={() => handleAssetClick(asset)}>
                                <div className="market-asset-info">
                                    <span className="market-asset-name">{asset.name}</span>
                                    <span className="market-asset-price">{asset.price}</span>
                                </div>
                                <button className="buy-btn" onClick={(e) => openBuyModal(e, asset)}>Buy</button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Asset Detail Modal */}
            {selectedAsset && (
                <div className="asset-modal-overlay" onClick={closeModal}>
                    <div className="asset-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="asset-modal-header">
                            <div className="asset-modal-title">
                                <h2>{selectedAsset.name}</h2>
                                <span className="asset-type-badge">{selectedAsset.type}</span>
                            </div>
                            <button className="close-btn" onClick={closeModal}>×</button>
                        </div>
                        <div className="asset-modal-body">
                            <div className="asset-price-info">
                                <div className="current-price">
                                    <span className="price-label">Current Price</span>
                                    <span className="price-value">{selectedAsset.price}</span>
                                </div>
                                <div className={`price-change ${selectedAsset.change >= 0 ? 'positive' : 'negative'}`}>
                                    {selectedAsset.change >= 0 ? '↑' : '↓'} {Math.abs(selectedAsset.change).toFixed(1)}%
                                    <span className="change-period">24h</span>
                                </div>
                            </div>
                            <div className="asset-chart">
                                <h3>Price History (12 Months)</h3>
                                <Chart
                                    data={generatePriceHistory(selectedAsset.priceValue || 100)}
                                    type="area"
                                    xKey="date"
                                    yKeys={['price']}
                                    colors={[getChartColor(selectedAsset.change)]}
                                    height={300}
                                    showLegend={false}
                                />
                            </div>
                            <div className="modal-actions">
                                {!isAdmin && (
                                    <button className="modal-buy-btn" onClick={(e) => { closeModal(); openBuyModal(e, selectedAsset); }}>
                                        Buy {selectedAsset.name}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Trade Modal */}
            {showTradeModal && (
                <TradeModal
                    asset={tradeAsset}
                    portfolioItem={tradePortfolioItem}
                    type={tradeType}
                    onClose={() => setShowTradeModal(false)}
                    onSuccess={handleTradeSuccess}
                />
            )}

            {/* Portfolio Section - Hidden for Bankers */}
            {!isAdmin && (
                <section className="section-portfolio">
                    <h2 className="section-title">Your Portfolio</h2>
                    <GlassCard className="portfolio-table-container">
                        {isLoadingPortfolio ? (
                            <div className="portfolio-loading">
                                <div className="loading-spinner"></div>
                                <p>Loading portfolio...</p>
                            </div>
                        ) : portfolioAssets.length === 0 ? (
                            <div className="portfolio-empty">
                                <span className="empty-icon">📊</span>
                                <h3>No Assets Yet</h3>
                                <p>Purchase assets from the market to build your portfolio.</p>
                            </div>
                        ) : (
                            <table className="portfolio-table">
                                <thead>
                                    <tr>
                                        <th>Asset</th>
                                        <th>Type</th>
                                        <th>Holdings</th>
                                        <th>Value</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolioAssets.map(asset => (
                                        <tr key={asset.id}>
                                            <td style={{ fontWeight: '600' }}>{asset.name}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{asset.type}</td>
                                            <td>{asset.amount}</td>
                                            <td>{asset.value}</td>
                                            <td>
                                                <button
                                                    className="trade-btn sell"
                                                    onClick={() => openSellModal(asset)}
                                                >
                                                    Sell
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </GlassCard>
                </section>
            )}

            {/* NFT Ownership Section - Hidden for Bankers */}
            {!isAdmin && <NFTOwnership />}

            {/* Agent Automation Panel - Hidden for Bankers */}
            {!isAdmin && <AgentPanel />}
        </div>
    );
};

export default MainContent;
