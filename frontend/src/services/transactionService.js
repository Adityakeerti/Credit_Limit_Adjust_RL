import api from './api';

/**
 * Get user's transaction history
 * @param {string} userId - UUID of the user
 */
export const getUserTransactions = async (userId) => {
    const response = await api.get(`/api/transactions/user/${userId}`);
    return response.data;
};

/**
 * Create a purchase transaction
 * @param {string} userId - UUID of the user
 * @param {string} walletId - UUID of the wallet
 * @param {number} amount - Purchase amount
 * @param {string} description - Optional description
 */
export const createPurchase = async (userId, walletId, amount, description = '') => {
    const response = await api.post('/api/transactions/purchase', null, {
        params: { userId, walletId, amount, description }
    });
    return response.data;
};

/**
 * Settle an authorized transaction
 * @param {string} txnId - UUID of the transaction
 */
export const settleTransaction = async (txnId) => {
    const response = await api.post(`/api/transactions/${txnId}/settle`);
    return response.data;
};

/**
 * Reverse an authorized transaction
 * @param {string} txnId - UUID of the transaction
 */
export const reverseTransaction = async (txnId) => {
    const response = await api.post(`/api/transactions/${txnId}/reverse`);
    return response.data;
};

/**
 * Get ledger entries (audit trail) for a transaction
 * @param {string} txnId - UUID of the transaction
 */
export const getLedgerEntries = async (txnId) => {
    const response = await api.get(`/api/transactions/${txnId}/ledger`);
    return response.data;
};

/**
 * Get ALL transactions (Admin only)
 */
export const getAllTransactions = async () => {
    const response = await api.get('/api/transactions/all');
    return response.data;
};

export default {
    getUserTransactions,
    createPurchase,
    settleTransaction,
    reverseTransaction,
    getLedgerEntries,
    getAllTransactions,
};
