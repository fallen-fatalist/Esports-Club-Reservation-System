import { useState, useEffect, useCallback } from "react";
import bookingService from "../services/bookingService";
import { format, differenceInMinutes } from "date-fns";

const useBookings = () => {
  const [rawBookings, setRawBookings] = useState([]);
  const [transformedBookings, setTransformedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingService.getBookings();

      setRawBookings(data);

      const transformed = data.map((b) => {
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);

        return {
          ...b, 
          date: format(start, "yyyy-MM-dd"),
          time: format(start, "HH:mm"),
          duration: `${differenceInMinutes(end, start)} min`,
        };
      });

      setTransformedBookings(transformed);
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

  return {
    bookings: rawBookings,               
    transformedBookings,                
    loading,
    error,
    refetchBookings: fetchBookings,
  };
};

export default useBookings;
  