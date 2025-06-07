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

  async deleteUserByID(id) {
    try {
      const response = await api.delete(`/api/users/${id}`);
      return response.status === 200;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      if (error.response?.status === 403) {
        throw new Error('Insufficient privileges to delete user');
      }
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      throw error;
    }
  },

async blockUserByID(id) {
  try {
    const response = await api.post(`/api/users/${id}/block`);
    return response.status === 200 || response.status === 204;
  } catch (error) {
    console.error(`Full error details for user ${id}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers
    });
    
    if (error.response?.status === 403) {
      throw new Error('Insufficient privileges to block user');
    }
    if (error.response?.status === 404) {
      throw new Error('User not found or endpoint not available');
    }
    throw error;
  }
},
  async unblockUserByID(id) {
    try {
      const response = await api.post(`/api/users/${id}/unblock`);
      return response.status === 200;
    } catch (error) {
      console.error(`Error unblocking user ${id}:`, error);
      if (error.response?.status === 403) {
        throw new Error('Insufficient privileges to unblock user');
      }
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      throw error;
    }
  },

  async creditUserByID(id, amount) {
    try {
      const response = await api.post(`/api/users/${id}/credit?amount=${amount}`);
      return response.status === 200 || response.status === 204;
    } catch (error) {
      console.error(`Error crediting user ${id} with amount ${amount}:`, error);
      
      if (error.response?.status === 403) {
        throw new Error('Insufficient privileges to credit user');
      }
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || 'Invalid amount or request format';
        throw new Error(errorMessage);
      }
      if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.error || 'Internal server error';
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },
  
  async grantRoleByID(id, role) {
    try {
      const response = await api.post(`/api/users/${id}/grant`, { role });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error(`Error granting role ${role} to user ${id}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      if (error.response?.status === 403) {
        throw new Error('Insufficient privileges to grant role. Only owners and managers can perform this action.');
      }
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Invalid role or request format';
        throw new Error(errorMessage);
      }
      if (error.response?.status === 409) {
        throw new Error('User already has this role');
      }
      if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.error || 'Internal server error';
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  async getUserBookings() {
    try {
      const response = await api.get(`/api/users/bookings`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default usersService;