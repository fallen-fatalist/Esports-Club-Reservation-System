import { api, checkIsPriveleged } from './authService.js';

const usersService = {
  async checkPrivileges() {
    try {
      const response = await checkIsPriveleged();
      return response.status === 200;
    } catch (error) {
      console.error('Privilege verification failed:', error);
      return false;
    }
  },

  async getUsers() {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Error getting users:', error);
      if (error.response?.status === 403) {
        throw new Error('Insufficient privileges');
      }
      throw error;
    }
  },

  async deleteUserByID(userId) {
    try {
      const response = await api.delete(`/api/users/${userId}`);
      return response.status === 200;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      if (error.response?.status === 403) {
        throw new Error('Insufficient privileges to delete user');
      }
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      throw error;
    }
  },

  async blockUserByID(userId) {
    try {
      const response = await api.post(`/api/users/${userId}/block`);
      return response.status === 200;
    } catch (error) {
      console.error(`Error blocking user ${userId}:`, error);
      if (error.response?.status === 403) {
        throw new Error('Insufficient privileges to block user');
      }
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      throw error;
    }
  },

  async unblockUserByID(userId) {
    try {
      const response = await api.post(`/api/users/${userId}/unblock`);
      return response.status === 200;
    } catch (error) {
      console.error(`Error unblocking user ${userId}:`, error);
      if (error.response?.status === 403) {
        throw new Error('Insufficient privileges to unblock user');
      }
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      throw error;
    }
  },

  async creditUserByID(userId, amount) {
    try {
      const response = await api.post(`/api/users/${userId}/credit`, {
        amount: amount
      });
      return response.status === 200;
    } catch (error) {
      console.error(`Error crediting user ${userId} with amount ${amount}:`, error);
      if (error.response?.status === 403) {
        throw new Error('Insufficient privileges to credit user');
      }
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid amount or request format');
      }
      throw error;
    }
  },

  async getUserBookings(userId) {
    try {
      const response = await api.get(`/api/users/${userId}/bookings`);
      return response.data;
    } catch (error) {
      console.error(`Error getting bookings for user ${userId}:`, error);
      throw error;
    }
  }
};

export default usersService;