import dateUtils from './dateUtils';

const normalizeId = (id) => typeof id === 'string' ? parseInt(id, 10) : id;

const isComputerAvailable = (computerId, bookings, date, time, duration) => {
  try {
    const compId = normalizeId(computerId);
    const startTime = dateUtils.parseDate(date, time);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const now = new Date();

    if (isNaN(startTime.getTime())) {
      console.error("Invalid date created:", startTime);
      return false;
    }
    
    if (startTime < now) {
      return false;
    }

    const isAvailable = !bookings.some((booking) => {
      const bookingCompId = normalizeId(booking.computer_id);
      if (bookingCompId !== compId || booking.status === 'cancelled') return false;

      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);

      if (isNaN(bookingStart.getTime()) || isNaN(bookingEnd.getTime())) {
        console.warn("Invalid booking dates:", booking.start_time, booking.end_time);
        return false;
      }

      return startTime < bookingEnd && endTime > bookingStart;
    });

    return isAvailable;
  } catch (error) {
    console.error("Error in isComputerAvailable:", error);
    return false;
  }
};

export default isComputerAvailable;
