import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { purchaseAsset, sellAsset } from '../../services/assetService';
import './TradeModal.css';

const TradeModal = ({ asset, portfolioItem, type, onClose, onSuccess }) => {
    const { user, refreshWallet } = useApp();
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isBuy = type === 'buy';
    const price = isBuy ? asset.priceValue : (parseFloat(portfolioItem?.value.replace(' VEX', '')) / parseFloat(portfolioItem?.amount));
    const total = (parseFloat(quantity) * price).toFixed(2);

    // For sell, max quantity is what they own
    const maxQuantity = !isBuy && portfolioItem ? parseFloat(portfolioItem.amount) : Infinity;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isBuy) {
                await purchaseAsset(user.userId, asset.code, parseFloat(quantity));
            } else {
                await sellAsset(user.userId, portfolioItem.holdingId, parseFloat(quantity));
            }

            await refreshWallet(); // Refresh wallet balance
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Trade failed:', err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="trade-modal-overlay">
            <div className="trade-modal">
                <div className="trade-header">
                    <h2>{isBuy ? 'Buy Asset' : 'Sell Asset'}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="trade-body">
                    <div className="asset-info">
                        <span className="asset-name">{isBuy ? asset.name : portfolioItem.name}</span>
                        <span className="asset-price">{price.toFixed(2)} VEX</span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                min="0.0001"
                                step="0.0001"
                                max={!isBuy ? maxQuantity : undefined}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="trade-input"
                                required
                            />
                            {!isBuy && <span className="max-hint">Max: {maxQuantity}</span>}
                        </div>

                        <div className="trade-summary">
                            <div className="summary-row">
                                <span>Total Value</span>
                                <span className="total-value">{total} VEX</span>
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button
                            type="submit"
                            className={`trade-submit-btn ${isBuy ? 'buy' : 'sell'}`}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : (isBuy ? 'Confirm Purchase' : 'Confirm Sale')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TradeModal;
