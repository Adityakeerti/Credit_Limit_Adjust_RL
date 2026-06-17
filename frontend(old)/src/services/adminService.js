import api from './api';

/**
 * Get all users (paginated) - ADMIN only
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @param {string} sortBy - Sort field
 * @param {string} sortDir - Sort direction ('asc' or 'desc')
 */
export const getUsers = async (page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc') => {
    const response = await api.get('/admin/users', {
        params: { page, size, sortBy, sortDir }
    });
    return response.data;
};

/**
 * Get single user details - ADMIN only
 * @param {string} userId - UUID of the user
 */
export const getUser = async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
};

/**
 * Update user status - ADMIN only
 * @param {string} userId - UUID of the user
 * @param {string} status - New status ('ACTIVE', 'SUSPENDED', etc.)
 */
export const updateUserStatus = async (userId, status) => {
    const response = await api.put(`/admin/users/${userId}/status`, { status });
    return response.data;
};

/**
 * Get all wallets - ADMIN only
 */
export const getWallets = async () => {
    const response = await api.get('/admin/wallets');
    return response.data;
};

/**
 * Adjust user credit limit - ADMIN only
 * @param {string} walletId - UUID of the wallet
 * @param {number} adjustment - Amount to adjust (positive or negative)
 */
export const adjustCreditLimit = async (walletId, adjustment) => {
    const response = await api.post(`/admin/wallets/${walletId}/adjust-limit`, { adjustment });
    return response.data;
};

/**
 * Get all transactions (paginated) - ADMIN only
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @param {string} status - Filter by status (optional)
 */
export const getTransactions = async (page = 0, size = 20, status = null) => {
    const params = { page, size };
    if (status) params.status = status;

    const response = await api.get('/admin/transactions', { params });
    return response.data;
};

/**
 * Get dashboard metrics - ADMIN only
 */
export const getMetrics = async () => {
    const response = await api.get('/admin/metrics');
    return response.data;
};

export default {
    getUsers,
    getUser,
    updateUserStatus,
    getWallets,
    adjustCreditLimit,
    getTransactions,
    getMetrics,
};
