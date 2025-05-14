import { useState, useEffect, useCallback } from "react";
import bookingService from "../services/bookingService";

const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingService.getBookings();
      setBookings(data);
      setError(null);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { bookings, loading, error, refetchBookings: fetchBookings };
};

export default useBookings;
