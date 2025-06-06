import { api } from './authService.js';

const paymentService = {

    async payForBooking({ computer_id, start_time, end_time, package_id, user_id }) {
        const response = await api.post('/api/payment/booking', {
            computer_id,
            start_time,
            end_time,
            package_id,
            user_id
        });
        return response.data;
    },

    async cancelBooking(booking_id) {
        const response = await api.post('/api/payment/cancel', { booking_id });
        return response.data;
    },

    async createDeposit(amount) {
        const response = await api.post('/api/payment/deposit', { amount });
        return response.data;
    },

};

export default paymentService;