import axios from 'axios';

const computerService = {
  async getComputers() {
    try {
      const response = await axios.get('/api/computers');
      return response.data;
    } catch (error) {
      console.error('Error getting list of computers:', error);
      throw error;
    }
  },

  async getComputerById(id) {
    try {
      const response = await axios.get(`/api/computers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`error getting info about computers #${id}:`, error);
      throw error;
    }
  }
  
};


export default computerService;