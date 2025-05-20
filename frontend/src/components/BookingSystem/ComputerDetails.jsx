import React, { useEffect, useState } from "react";
import computerService from "../../services/computerService";
import bookingService from "../../services/bookingService";
import TimelineSchedule from "../UI/timeline/TimelineSchedule";

const isSameDay = (date1, date2) =>
  date1.getFullYear() === date2.getFullYear() &&
  date1.getMonth() === date2.getMonth() &&
  date1.getDate() === date2.getDate();

const formatTimeLeft = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return "Not available";
  seconds = Number(seconds);
  
  if (seconds === 0) return "Available now";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
};

const ComputerDetails = ({ computer, bookings, date }) => {
  const [detailedComputer, setDetailedComputer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loadingTimeLeft, setLoadingTimeLeft] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);

  const selectedDate = date ? new Date(date) : new Date();
  const computerBookings = Array.isArray(bookings)
    ? bookings
        .filter(
          (b) =>
            b &&
            b.computer_id === computer?.id &&
            isSameDay(new Date(b.start_time), selectedDate) &&
            b.status !== "cancelled"
        )
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    : [];

  useEffect(() => {
    if (computer?.id) {
      computerService
        .getComputerById(computer.id)
        .then(setDetailedComputer)
        .catch((error) =>
          console.error("Failed to fetch computer details:", error)
        );
    }
  }, [computer]);

  useEffect(() => {
    const fetchTimeLeft = async () => {
      if (!computer?.id) return;

      if (timeLeft === null) setLoadingTimeLeft(true);
      
      try {
        const response = await bookingService.getLeftTimeByComputerId(computer.id);
        const now = new Date();
        const activeOrUpcomingBookings = computerBookings.filter(
          (b) => new Date(b.end_time) > now
        );

        if (activeOrUpcomingBookings.length > 0 && response.secondsLeft === 0) {
          const currentOrNextBooking = activeOrUpcomingBookings.sort(
            (a, b) => new Date(a.start_time) - new Date(b.start_time)
          )[0];

          const bookingEnd = new Date(currentOrNextBooking.end_time);
          const secondsUntilEnd = Math.max(0, Math.floor((bookingEnd - now) / 1000));
          setTimeLeft(secondsUntilEnd);
        } else {
          setTimeLeft(response.secondsLeft);
        }
      } catch (error) {
        console.error("Failed to fetch time left:", error);
      } finally {
        setLoadingTimeLeft(false); 
      }
    };

    fetchTimeLeft();
    const interval = setInterval(fetchTimeLeft, 60000); 
    return () => clearInterval(interval);
  }, [computer, computerBookings]);

  if (!computer || !detailedComputer) return null;

  return (
    <div className="computer-details">
      <TimelineSchedule bookings={computerBookings} date={selectedDate} />
      <h3>Computer Info</h3>
      <div className="computer-schedule">
        {computerBookings.length > 0 ? (
          <div className="schedule-timeline">
            <div className="timeline-bookings">
              {computerBookings.map((booking, i) => {
                const start = new Date(booking.start_time);
                const end = new Date(booking.end_time);
                const startMinutes = start.getHours() * 60 + start.getMinutes();
                const endMinutes = end.getHours() * 60 + end.getMinutes();
                const startOffset = (startMinutes / 1440) * 100;
                const width = ((endMinutes - startMinutes) / 1440) * 100;

                return (
                  <div
                    key={i}
                    className={`timeline-booking ${booking.status}`}
                    style={{ left: `${startOffset}%`, width: `${width}%` }}
                    title={`${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                  >
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <></>
        )}

      <div className="computer-specs">
        <h4 onClick={() => setShowSpecs(!showSpecs)} style={{ cursor: "pointer" }}>
          Specifications {showSpecs ? "▲" : "▼"}
        </h4>
        {showSpecs && (
          <ul className="specs-list">
            {["cpu", "gpu", "ram", "monitor", "mouse", "keyboard", "headset", "mousepad"].map((spec) => (
              <li key={spec}>
                <strong>{spec.toUpperCase()}:</strong> {detailedComputer?.[spec] || "N/A"}
              </li>
            ))}
          </ul>
        )}
      </div>

        <div className="booking-list">
          <h4>Bookings</h4>
          {computerBookings.length > 0 ? (
            <ul>
              {computerBookings.map((booking, i) => (
                <li key={i} className={`booking-item ${booking.status}`}>
                  <span>
                    {new Date(booking.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(booking.end_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="booking-status">{booking.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-bookings">No bookings for this date</p>
          )}
          
          <div className="time-left">
            <h4>Time Until Next Available Slot</h4>
            {loadingTimeLeft ? (
              <p>Loading...</p>
            ) : (
              <p>{formatTimeLeft(timeLeft)}</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ComputerDetails;