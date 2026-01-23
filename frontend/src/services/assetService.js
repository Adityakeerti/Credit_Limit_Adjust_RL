import api from './api';

/**
 * Get all available assets
 */
export const getAllAssets = async () => {
    const response = await api.get('/api/assets');
    return response.data;
};

/**
 * Get asset by code
 * @param {string} code - Asset code (e.g., 'VEX', 'BTC')
 */
export const getAsset = async (code) => {
    const response = await api.get(`/api/assets/${code}`);
    return response.data;
};

/**
 * Get user's portfolio (holdings)
 * @param {string} userId - UUID of the user
 */
export const getPortfolio = async (userId) => {
    const response = await api.get(`/api/assets/portfolio/${userId}`);
    return response.data;
};

/**
 * Get user's VexCoin balance
 * @param {string} userId - UUID of the user
 */
export const getVexBalance = async (userId) => {
    const response = await api.get(`/api/assets/wallet/${userId}/vex`);
    return response.data;
};

/**
 * Purchase an asset
 * @param {string} userId - UUID of the user
 * @param {string} assetCode - Asset code
 * @param {number} quantity - Quantity to purchase
 */
export const purchaseAsset = async (userId, assetCode, quantity) => {
    const response = await api.post('/api/assets/purchase', null, {
        params: { userId, assetCode, quantity }
    });
    return response.data;
};

/**
 * Sell an asset
 * @param {string} userId - UUID of the user
 * @param {string} holdingId - UUID of the holding
 * @param {number} quantity - Quantity to sell
 */
export const sellAsset = async (userId, holdingId, quantity) => {
    const response = await api.post('/api/assets/sell', null, {
        params: { userId, holdingId, quantity }
    });
    return response.data;
};

/**
 * Transfer an NFT to another user
 * @param {string} fromUserId - UUID of sender
 * @param {string} toUserId - UUID of receiver
 * @param {string} holdingId - UUID of the NFT holding
 */
export const transferNFT = async (fromUserId, toUserId, holdingId) => {
    const response = await api.post('/api/assets/transfer-nft', null, {
        params: { fromUserId, toUserId, holdingId }
    });
    return response.data;
};

export default {
    getAllAssets,
    getAsset,
    getPortfolio,
    getVexBalance,
    purchaseAsset,
    sellAsset,
    transferNFT,
};
