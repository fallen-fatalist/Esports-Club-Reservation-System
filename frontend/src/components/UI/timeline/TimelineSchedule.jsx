import React, { useState, useEffect, useRef } from 'react';
import './TimelineSchedule.css';

const TimelineSchedule = ({ bookings }) => {
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [selectedDate, setSelectedDate] = useState(normalizedToday);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoverInfo, setHoverInfo] = useState(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    scrollToCurrentTime();

    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); 

    return () => clearInterval(interval);
  }, [selectedDate]);

  const scrollToCurrentTime = () => {
    if (!timelineRef.current) return;

    const now = new Date();
    if (now.toDateString() === selectedDate.toDateString()) {
      const totalMinutes = now.getHours() * 60 + now.getMinutes();
      const scrollWidth = timelineRef.current.scrollWidth;
      const scrollLeft = (totalMinutes / (24 * 60)) * scrollWidth;
      timelineRef.current.scrollLeft = scrollLeft - 100;
    } else {
      timelineRef.current.scrollLeft = 0;
    }
  };

  const generateTimeSlots = () =>
    Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const formatTime = (hours, minutes) =>
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const groupBookingsIndividually = () =>
    bookings
      .filter((b) => new Date(b.start_time).toDateString() === selectedDate.toDateString())
      .map((booking, index) => {
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        const durationMinutes = (end - start) / 60000;

        return {
          rowId: `booking-${booking.id}-${index}`,
          userName: booking.user?.name || 'User',
          booking: {
            id: booking.id,
            title: booking.user?.name || 'User',
            startHour: start.getHours(),
            startMinute: start.getMinutes(),
            durationMinutes,
            computerName: booking.computer?.name || `Computer #${booking.computer_id}`,
            userId: booking.user_id,
            status: booking.status,
            startTime: start,
            endTime: end,
          },
        };
      });

  const calculateAppointmentStyle = (appointment) => {
    const hourWidth = 100 / 24;
    const startPosition = (appointment.startHour + appointment.startMinute / 60) * hourWidth;
    const width = (appointment.durationMinutes / 60) * hourWidth;
    return {
      left: `${startPosition}%`,
      width: `calc(${width}% - 2px)`,
    };
  };

  const calculateCurrentTimePosition = () => {
    const now = new Date();
    const hourOfDay = now.getHours();
    const minuteOfHour = now.getMinutes();
    const percentageOfDay = ((hourOfDay + minuteOfHour / 60) / 24) * 100;
    return { left: `${percentageOfDay}%` };
  };

  const handleMouseEnter = (appointment, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const modalWidth = 240;
    const modalHeight = 140;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceAbove = rect.top;
    const top =
      spaceAbove > modalHeight + 10 ? rect.top - modalHeight - 10 : rect.bottom + 10;

    const left = Math.min(
      Math.max(rect.left + rect.width / 2, modalWidth / 2),
      viewportWidth - modalWidth / 2
    );

    setHoverInfo({ appointment, position: { top, left } });
  };

  const handleMouseLeave = () => setHoverInfo(null);

  const timeSlots = generateTimeSlots();
  const individualBookings = groupBookingsIndividually();

  const allRows =
    individualBookings.length > 0
      ? individualBookings
      : [{ rowId: 'empty-row', userName: '', booking: null }];

  return (
    <div className="schedule-container">
      <div className="date-container">
        <div className="date-navigation">
          <button
            onClick={() =>
              setSelectedDate(
                (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1)
              )
            }
          >
            &larr;
          </button>

          <span className="current-date">{formatDate(selectedDate)}</span>

          <button
            onClick={() =>
              setSelectedDate(
                (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1)
              )
            }
          >
            &rarr;
          </button>

          <button className="today-button" onClick={() => setSelectedDate(normalizedToday)}>
            today
          </button>
        </div>
      </div>

      <div className="timeline-container" ref={timelineRef}>
        <div className="timeline">
          <div className="timeline-header">
            <div className="hours-container">
              {timeSlots.map((timeSlot, idx) => (
                <div key={idx} className="timeline-header-cell">
                  {timeSlot}
                </div>
              ))}
            </div>
          </div>

          <div className="timeline-content">
            {allRows.map(({ rowId, userName, booking }) => (
              <div key={rowId} className="user-timeline-row">
                <div className="hours-container">
                  {timeSlots.map((_, idx) => (
                    <div key={idx} className="hour-cell" />
                  ))}

                  {booking && (
                    <div
                      className="appointment"
                      style={calculateAppointmentStyle(booking)}
                      onMouseEnter={(e) => handleMouseEnter(booking, e)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {booking.computerName}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {selectedDate.toDateString() === currentDate.toDateString() && (
              <div
                className="current-time-indicator"
                style={calculateCurrentTimePosition()}
              />
            )}
          </div>
        </div>
      </div>

      {hoverInfo && (
        <div
          className="appointment-modal"
          style={{
            position: 'fixed',
            top: `${hoverInfo.position.top}px`,
            left: `${hoverInfo.position.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="modal-content">
            <h3>{hoverInfo.appointment.title}</h3>
            <p>
              <strong>Role:</strong> user
            </p>
            <p>
              <em>admin (in development)</em>
            </p>
            <p>
              <em>deposit (in development)</em>
            </p>
            <p>
              <strong>Booking:</strong> {formatDate(hoverInfo.appointment.startTime)}, {formatTime(hoverInfo.appointment.startHour, hoverInfo.appointment.startMinute)} –{' '}
              {formatTime(hoverInfo.appointment.endTime.getHours(), hoverInfo.appointment.endTime.getMinutes())}
            </p>
            <p>
              <strong>Computer:</strong> {hoverInfo.appointment.computerName}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineSchedule;
