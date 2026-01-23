import api from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Login with email and password
 * @returns {Promise<{token, userId, email, role}>}
 */
export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, userId, email: userEmail, role, riskScore } = response.data;

    // Store token and user info
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ userId, email: userEmail, role, riskScore }));

    return response.data;
};

/**
 * Register a new user
 * @returns {Promise<{token, userId, email, role}>}
 */
export const register = async (name, email, password, role = 'USER') => {
    const response = await api.post('/auth/register', { name, email, password, role });
    const { token, userId, email: userEmail, role: retrievedRole, riskScore } = response.data;

    // Store token and user info
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ userId, email: userEmail, role: retrievedRole, riskScore }));

    return response.data;
};

/**
 * Validate current token
 * @returns {Promise<{valid, userId, email}>}
 */
export const validateToken = async () => {
    const response = await api.get('/auth/validate');
    return response.data;
};

/**
 * Logout - clear stored data
 */
export const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

/**
 * Get stored token
 */
export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get stored user info
 */
export const getStoredUser = () => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
    return !!getToken();
};

export default {
    login,
    register,
    validateToken,
    logout,
    getToken,
    getStoredUser,
    isAuthenticated,
};
