import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getPortfolio, transferNFT } from '../services/assetService';
import { getAgentUsers } from '../services/agentService';
import GlassCard from './GlassCard';
import './NFTOwnership.css';

const NFTOwnership = () => {
    const { user } = useApp();
    const [nftHoldings, setNftHoldings] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedNft, setSelectedNft] = useState(null);
    const [transferToUserId, setTransferToUserId] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    // Fetch NFT holdings
    const fetchNFTs = async () => {
        if (!user?.userId) return;
        try {
            setIsLoading(true);
            const holdings = await getPortfolio(user.userId);
            // Filter only NFT type assets
            const nfts = holdings.filter(h =>
                h.asset?.assetType === 'NFT' || h.assetCode?.includes('NFT') || h.tokenId
            );
            setNftHoldings(nfts);
        } catch (err) {
            console.error('Failed to fetch NFTs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch all users for transfer dropdown
    const fetchUsers = async () => {
        try {
            const users = await getAgentUsers();
            setAllUsers(users.filter(u => u.userId !== user?.userId));
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    useEffect(() => {
        fetchNFTs();
        fetchUsers();
    }, [user?.userId]);

    const openTransferModal = (nft) => {
        setSelectedNft(nft);
        setTransferToUserId('');
        setShowTransferModal(true);
    };

    const handleTransfer = async () => {
        if (!selectedNft || !transferToUserId) return;

        try {
            setIsTransferring(true);
            await transferNFT(user.userId, transferToUserId, selectedNft.holdingId);
            alert('NFT transferred successfully!');
            setShowTransferModal(false);
            fetchNFTs(); // Refresh list
        } catch (err) {
            alert('Transfer failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsTransferring(false);
        }
    };

    // Truncate hash for display
    const truncateHash = (hash) => {
        if (!hash) return 'N/A';
        return `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}`;
    };

    return (
        <section className="section-nft-ownership">
            <div className="section-header-row">
                <h2 className="section-title">🎨 NFT Ownership</h2>
                <span className="nft-count">{nftHoldings.length} NFTs</span>
            </div>

            <GlassCard className="nft-container">
                {isLoading ? (
                    <div className="nft-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading NFTs...</p>
                    </div>
                ) : nftHoldings.length === 0 ? (
                    <div className="nft-empty">
                        <span className="empty-icon">🖼️</span>
                        <h3>No NFTs Owned</h3>
                        <p>Purchase NFTs from the marketplace to see them here.</p>
                    </div>
                ) : (
                    <div className="nft-grid">
                        {nftHoldings.map(nft => (
                            <div key={nft.holdingId} className="nft-card">
                                <div className="nft-image">
                                    <img
                                        src={nft.asset?.imageUrl || '/placeholder-nft.png'}
                                        alt={nft.asset?.name || 'NFT'}
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=NFT'; }}
                                    />
                                </div>
                                <div className="nft-info">
                                    <h4 className="nft-name">{nft.asset?.name || nft.assetCode}</h4>
                                    <div className="nft-details">
                                        <div className="detail-row">
                                            <span className="label">Token ID:</span>
                                            <span className="value">{nft.tokenId || 'N/A'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Tx Hash:</span>
                                            <span className="value hash" title={nft.ownershipTxHash}>
                                                {truncateHash(nft.ownershipTxHash)}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Owner:</span>
                                            <span className="value owner">You</span>
                                        </div>
                                    </div>
                                    <button
                                        className="transfer-btn"
                                        onClick={() => openTransferModal(nft)}
                                        disabled={nft.isLocked}
                                    >
                                        {nft.isLocked ? '🔒 Locked' : '↗️ Transfer'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>

            {/* Transfer Modal */}
            {showTransferModal && selectedNft && (
                <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
                    <div className="transfer-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Transfer NFT</h3>
                            <button className="close-btn" onClick={() => setShowTransferModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="transfer-nft-preview">
                                <span className="nft-icon">🎨</span>
                                <span className="nft-label">{selectedNft.asset?.name || selectedNft.assetCode}</span>
                            </div>
                            <div className="form-group">
                                <label>Transfer To:</label>
                                <select
                                    value={transferToUserId}
                                    onChange={e => setTransferToUserId(e.target.value)}
                                >
                                    <option value="">Select recipient...</option>
                                    {allUsers.map(u => (
                                        <option key={u.userId} value={u.userId}>
                                            {u.name} ({u.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowTransferModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-transfer"
                                onClick={handleTransfer}
                                disabled={!transferToUserId || isTransferring}
                            >
                                {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default NFTOwnership;
