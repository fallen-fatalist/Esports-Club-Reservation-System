import { api } from './authService.js';

const packageService = {
    async getPackages() {
        try {
            const response = await api.get('/api/packages');
            return response.data;
        } catch (error) {
            console.error('Error getting packages:', error);
            throw error;
        }
    }
};

export default packageService;