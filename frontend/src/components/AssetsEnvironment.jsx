import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import AssetCard from './AssetCard';
import { getAllAssets } from '../services/assetService';

const AssetsEnvironment = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const data = await getAllAssets();
                // Transform to display format
                const displayAssets = data.map(asset => ({
                    id: asset.assetId,
                    name: asset.name,
                    type: asset.assetType,
                    price: `${parseFloat(asset.unitPriceVex).toFixed(2)} VEX`,
                    priceValue: parseFloat(asset.unitPriceVex),
                    change: (Math.random() * 5 - 2.5).toFixed(2), // Simulated change
                    code: asset.code
                }));
                // Take top 3 or 4 for dashboard display
                setAssets(displayAssets.slice(0, 4));
            } catch (err) {
                console.error("Failed to fetch assets:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();
    }, []);

    if (loading) return <div className="text-white">Loading assets...</div>;

    return (
        <GlassCard className="dashboard-section assets-section">
            <h3 className="section-header">Assets Environment</h3>
            <div className="assets-grid">
                {assets.map(asset => (
                    <AssetCard
                        key={asset.id}
                        name={asset.name}
                        type={asset.type}
                        price={asset.price}
                        change={parseFloat(asset.change)}
                    />
                ))}
            </div>
        </GlassCard>
    );
};

export default AssetsEnvironment;
