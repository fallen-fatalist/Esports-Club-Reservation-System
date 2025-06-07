import { api } from './authService.js';

const bookingService = {
    async getBookings() {
        try {
            const response = await api.get('/api/bookings');  
            return response.data;
        } catch (error) {
            console.error('Error getting bookings', error);
            throw error;
        }
    },
    async getUserBookings() {
        try {
            const response = await api.get('/api/users/bookings');  
            return response.data;
        } catch (error) {
            console.error('Error getting bookings', error);
            throw error;
        }
    },

    async createBooking(bookingData) {
      try {
        
        try {
          const response = await api.post('/api/bookings', bookingData);
          return response.data;
        } catch (error) {
          if (error.response && error.response.status === 500) {
            
            try {
              const altResponse = await api.post('/api/booking', bookingData);
              return altResponse.data;
            } catch (alt1Error) {
              
              try {
                const modifiedData = {
                  ...bookingData,
                  user_id: Number(bookingData.user_id),
                  computer_id: Number(bookingData.computer_id),
                  package_id: Number(bookingData.package_id)
                };
                
                const modResponse = await api.post('/api/bookings', modifiedData);
                return modResponse.data;
              } catch (modError) {
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
        const response = await api.get(`/api/computer/${id}/bookings`);
        return response.data;
      } catch (error) {
        console.error(`Error getting bookings for computer #${id}:`, error);
        throw error;
      }
    },
    async getLeftTimeByComputerId(id) {
      try {
        /* 
          MUST DO: Package should be selected in frontend
          then its ID entered as parameter to the request 
          to get the remaining time for that package 
          to be available for specific computer
          
          Hint: packages can be fetched through /api/packages
        */
        const response = await api.get(`/api/computers/${id}/remaining?packageID=1`);
        let secondsLeft = null;
        
        if (response.data && typeof response.data === 'object') {
          secondsLeft = response.data.left_time;
        } else if (typeof response.data === 'number') {
          secondsLeft = response.data;
        }
        
        return {
          secondsLeft: secondsLeft,
          minutesLeft: secondsLeft !== null ? Math.floor(secondsLeft / 60) : null
        };
      } catch (error) {
        console.error(`Error getting left time for computer #${id}:`, error);
        throw error;
      }
    }, 
    async cancelBookingByID(id) {
      try {
        const response = await api.post(`/api/bookings/${id}/cancel`);

        if (response.status === 200 || response.status === 204) {
          return true;
        }

        return false;
      } catch (error) {
        if (error.response?.status === 401) {
          throw new Error('Authentication required');
        }
        if (error.response?.status === 403) {
          throw new Error('Insufficient privileges to cancel booking');
        }
        if (error.response?.status === 404) {
          throw new Error('Booking not found');
        }
        if (error.response?.status === 409) {
          throw new Error('Booking cannot be cancelled');
        }

        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Failed to cancel booking';
        throw new Error(errorMessage);
      }
    },
    async getCancelledBookings() {
      try {
        const response = await api.get('/api/bookings/cancelled');
        return response.data;
      } catch (error) {
        console.error('Error getting cancelled bookings:', error);
        throw error;
      }
    }

};

export default bookingService;
