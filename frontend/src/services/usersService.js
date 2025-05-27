import { api } from './authService.js';


/* ALL FUNCTIONS FROM THIS SERVICE REQUIRES ADMIN ROLE AND HIGHER! */
const usersService = {
    async getUsers() {
        try {
            /* Requires admin priviliges or higher */
            const response = await api.get('/api/users');
            if (response.status === 200) {
                return response.data;
            } else {
                console.error('Error getting users:', response);
            }
        } catch (error) {
            console.error('Error getting packages:', error);
            throw error;
        }
    },
    // blocked user cannot, book + enter to the website
    async blockUserByID(id) {
        try {
            /* Requires admin priviliges or higher */
            const response = await api.post(`/api/users/${id}/block`);
            if (response.status === 204) {
                return true;
            } else {
                console.error('Error blocking user:', response);
                return false;
            }
        } catch (error) {
            console.error(`Error blocking user #${id}:`, error);
            throw error;
        }
    },
    async unblockUserByID(id) {
        try {
            /* Requires admin priviliges or higher */
            const response = await api.post(`/api/users/${id}/unblock`);
            if (response.status === 204) {
                return true;
            } else {
                console.error('Error blocking user:', response);
                return false;
            }
        } catch (error) {
            console.error(`Error blocking user #${id}:`, error);
            throw error;
        }
    }, 
    async deleteUserByID(id) {
        try {
            /* Requires admin priviliges or higher */
            const response = await api.delete(`/api/users/${id}`);
            if (response.status === 204) {
                return true;
            } else {
                console.error('Error deleting user:', response);
                return false;
            }
        } catch (error) {
            console.error(`Error deleting user #${id}:`, error);
            throw error;
        }
    },
    async creditUserByID(id, creditAmount) {
        try {
            /* Requires admin priviliges or higher */
            const response = await api.post(`/api/users/${id}/credit?amount=${creditAmount}`);
            if (response.status === 204) {
                return true;
            } else {
                console.error('Error crediting user:', response);
                return false;
            }
        } catch (error) {
            console.error(`Error crediting user #${id}:`, error);
            throw error;
        }
    }
};

export default usersService;