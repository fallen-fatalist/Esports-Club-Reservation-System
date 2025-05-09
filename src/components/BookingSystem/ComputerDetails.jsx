import React, { useEffect, useState } from "react";
import computerService from "../../services/computerService";
import bookingService from "../../services/bookingService"; 

const ComputerDetails = ({ computer, bookings, date }) => {
  const [detailedComputer, setDetailedComputer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null); 

  useEffect(() => {
    if (computer?.id) {
      computerService.getComputerById(computer.id)
        .then(setDetailedComputer)
        .catch(error => console.error("Failed to fetch computer details:", error));
      
      // Получаем оставшееся время по компьютеру
      bookingService.getLeftTimeByComputerId(computer.id)
        .then(data => setTimeLeft(data.timeLeft))
        .catch(() => setTimeLeft(null));
    }
  }, [computer]);

  if (!computer || !detailedComputer) return null;

  const computerBookings = bookings
    .filter(
      b =>
        b.computer_id === computer.id &&
        new Date(b.start_time).toISOString().split('T')[0] === date &&
        b.status !== 'cancelled'
    )
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  return (
    <div className="computer-details">
      <h3>Computer Info</h3>

      {timeLeft !== null && (
        <div className="time-left">
          <h4>Time Left in Current Session</h4>
          <p>{timeLeft} minutes remaining</p>
        </div>
      )}

      <div className="computer-specs">
        <h4>Specifications</h4>
        <ul className="specs-list">
          <li><strong>CPU:</strong> {detailedComputer.cpu || "N/A"}</li>
          <li><strong>GPU:</strong> {detailedComputer.gpu || "N/A"}</li>
          <li><strong>RAM:</strong> {detailedComputer.ram || "N/A"}</li>
          <li><strong>SSD:</strong> {detailedComputer.ssd || "N/A"}</li>
          <li><strong>HDD:</strong> {detailedComputer.hdd || "N/A"}</li>
          <li><strong>Monitor:</strong> {detailedComputer.monitor || "N/A"}</li>
          <li><strong>Mouse:</strong> {detailedComputer.mouse || "N/A"}</li>
          <li><strong>Keyboard:</strong> {detailedComputer.keyboard || "N/A"}</li>
          <li><strong>Headset:</strong> {detailedComputer.headset || "N/A"}</li>
          <li><strong>Mousepad:</strong> {detailedComputer.mousepad || "N/A"}</li>
        </ul>
      </div>

      <div className="computer-schedule">
        <h4>Schedule for {date}</h4>
        {computerBookings.length > 0 ? (
          <div className="schedule-timeline">
            <div className="timeline-hours">
              {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                <div key={hour} className="timeline-hour">
                  <span>{hour}:00</span>
                </div>
              ))}
            </div>

            <div className="timeline-bookings">
              {computerBookings.map((booking, i) => {
                const startTime = new Date(booking.start_time);
                const endTime = new Date(booking.end_time);
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);

                const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
                const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

                const startOffset = (startMinutes / (24 * 60)) * 100;
                const duration = ((endMinutes - startMinutes) / (24 * 60)) * 100;

                return (
                  <div
                    key={i}
                    className={`timeline-booking ${booking.status}`}
                    style={{
                      left: `${startOffset}%`,
                      width: `${duration}%`
                    }}
                    title={`${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  >
                    <span className="booking-time">
                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  <span className="booking-time">
                    {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="booking-status">{booking.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-bookings">No bookings for this date</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComputerDetails;
