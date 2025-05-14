import React, { useEffect, useState } from "react";
import computerService from "../../services/computerService";

const isSameDay = (date1, date2) =>
  date1.getFullYear() === date2.getFullYear() &&
  date1.getMonth() === date2.getMonth() &&
  date1.getDate() === date2.getDate();

const ComputerDetails = ({ computer, bookings, date }) => {
  const [detailedComputer, setDetailedComputer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingDuration, setBookingDuration] = useState(null);

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
    const calculateTimeLeft = () => {
      if (!bookings || !computer?.id) return;

      const now = new Date();
      const activeBookings = bookings.filter((booking) => {
        if (
          booking.computer_id !== computer.id ||
          booking.status === "cancelled"
        )
          return false;

        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        return now >= start && now <= end;
      });

      if (activeBookings.length > 0) {
        const currentBooking = activeBookings.sort(
          (a, b) =>
            new Date(a.start_time) - new Date(b.start_time)
        )[0];

        const startTime = new Date(currentBooking.start_time);
        const endTime = new Date(currentBooking.end_time);
        const totalDurationMins = Math.floor((endTime - startTime) / 60000);
        const remainingMins = Math.max(0, Math.floor((endTime - now) / 60000));

        setActiveBooking(currentBooking);
        setBookingDuration(totalDurationMins);
        setTimeLeft(remainingMins);
      } else {
        setActiveBooking(null);
        setBookingDuration(null);
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [bookings, computer]);

  if (!computer || !detailedComputer) return null;

  const selectedDate = new Date(date);
  const computerBookings = bookings
    .filter(
      (b) =>
        b.computer_id === computer.id &&
        isSameDay(new Date(b.start_time), selectedDate) &&
        b.status !== "cancelled"
    )
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  return (
    <div className="computer-details">
      <h3>Computer Info</h3>

      <div className="computer-specs">
        <h4>Specifications</h4>
        <ul className="specs-list">
          {["cpu", "gpu", "ram", "ssd", "hdd", "monitor", "mouse", "keyboard", "headset", "mousepad"].map((spec) => (
            <li key={spec}>
              <strong>{spec.toUpperCase()}:</strong> {detailedComputer?.[spec] || "N/A"}
            </li>
          ))}
        </ul>
      </div>

      <div className="computer-schedule">
        <h4>Schedule for {date}</h4>

        {computerBookings.length > 0 ? (
          <div className="schedule-timeline">
            <div className="timeline-hours">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="timeline-hour">
                  <span>{i}:00</span>
                </div>
              ))}
            </div>

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
                    <span>
                      {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="no-bookings">No bookings for this date</p>
        )}

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
          
          {timeLeft !== null ? (
            <div className="time-left">
              <h4>Time Left in Current Session</h4>
              <p>{timeLeft} minutes remaining</p>
              {activeBooking && bookingDuration && (
                <div className="active-booking-info">
                  <p>
                    {new Date(activeBooking.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(activeBooking.end_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p>Total booking duration: {bookingDuration} minutes</p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-active-session">
              <h3>Time left:</h3>
              <p>No active session</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComputerDetails;
