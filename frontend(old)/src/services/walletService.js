import api from './api';

/**
 * Get user's credit wallet
 * @param {string} userId - UUID of the user
 */
export const getWallet = async (userId) => {
    const response = await api.get(`/api/wallet/${userId}`);
    return response.data;
};

/**
 * Lock credits in wallet (for purchases)
 * @param {string} userId - UUID of the user
 * @param {number} amount - Amount to lock
 */
export const lockCredits = async (userId, amount) => {
    const response = await api.post(`/api/wallet/${userId}/lock`, null, {
        params: { amount }
    });
    return response.data;
};

export default {
    getWallet,
    lockCredits,
};
