import api from './api';

const N8N_BASE = '/api/n8n';

/**
 * Fetch all assets via n8n endpoint (no auth required)
 */
export const getAgentAssets = async () => {
    const response = await api.get(`${N8N_BASE}/assets`);
    return response.data;
};

/**
 * Execute auto-buy via n8n agent
 */
export const executeAutoBuy = async (userId, assetCode, quantity) => {
    const response = await api.post(`${N8N_BASE}/webhook/buy`, {
        userId,
        assetCode,
        quantity
    });
    return response.data;
};

/**
 * Execute auto-sell via n8n agent
 */
export const executeAutoSell = async (userId, holdingId, quantity) => {
    const response = await api.post(`${N8N_BASE}/webhook/sell`, {
        userId,
        holdingId,
        quantity
    });
    return response.data;
};

/**
 * Adjust credit limit via n8n agent
 */
export const adjustCredit = async (userId, newLimit, reason) => {
    const response = await api.post(`${N8N_BASE}/webhook/credit/adjust`, {
        userId,
        newLimit,
        reason
    });
    return response.data;
};

/**
 * Get platform metrics
 */
export const getPlatformMetrics = async () => {
    const response = await api.get(`${N8N_BASE}/metrics`);
    return response.data;
};

/**
 * Get recent transactions via n8n
 */
export const getAgentTransactions = async (limit = 10) => {
    const response = await api.get(`${N8N_BASE}/transactions`, { params: { limit } });
    return response.data;
};

/**
 * Get all users via n8n
 */
export const getAgentUsers = async () => {
    const response = await api.get(`${N8N_BASE}/users`);
    return response.data;
};

/**
 * Check agent health
 */
export const checkAgentHealth = async () => {
    const response = await api.get(`${N8N_BASE}/health`);
    return response.data;
};

export default {
    getAgentAssets,
    executeAutoBuy,
    executeAutoSell,
    adjustCredit,
    getPlatformMetrics,
    getAgentTransactions,
    getAgentUsers,
    checkAgentHealth
};
