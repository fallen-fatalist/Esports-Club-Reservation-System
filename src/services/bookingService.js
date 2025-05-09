// bookingService.js
import axios from 'axios';

const bookingService = {
    async getBookings() {
        try {
            const response = await axios.get('/api/bookings');  
            return response.data;
        } catch (error) {
            console.error('Error getting bookings', error);
            throw error;
        }
    },
    async createBooking(bookingData) {
      try {
        console.log('Request payload:', JSON.stringify(bookingData, null, 2));
        
        try {
          const response = await axios.post('/api/bookings', bookingData);
          return response.data;
        } catch (error) {
          if (error.response && error.response.status === 500) {
            console.log('Attempting fallback approaches...');
            
            try {
              const altResponse = await axios.post('/api/booking', bookingData);
              return altResponse.data;
            } catch (alt1Error) {
              console.log('Alternative endpoint 1 failed, trying next approach');
              
              try {
                const modifiedData = {
                  ...bookingData,
                  user_id: Number(bookingData.user_id),
                  computer_id: Number(bookingData.computer_id),
                  package_id: Number(bookingData.package_id)
                };
                
                const modResponse = await axios.post('/api/bookings', modifiedData);
                return modResponse.data;
              } catch (modError) {
                console.log('Modified data approach failed');
                throw modError; 
              }
            }
          }
          throw error; 
        }
      } catch (error) {
        console.error('Full error details:', {
          config: error.config,
          response: {
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
          },
          message: error.message
        });
        throw error;
      }
    },
    async getBookingsByComputerId(id) {
        try {
          const response = await axios.get(`/api/bookings/${id}`);
          return response.data;
        } catch (error) {
          console.error(`Error getting bookings for computer #${id}:`, error);
          throw error;
        }
      },
    async getLeftTimeByComputerId(id) {
        try {
          const response = await axios.get(`/api/bookings/${id}/left`);
          return response.data;
        } catch (error) {
          console.error(`Error getting left time for computer #${id}:`, error);
          throw error;
        }
      }
};

export default bookingService;