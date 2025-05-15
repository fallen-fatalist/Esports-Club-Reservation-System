import React, { useState, useEffect } from 'react';
import './TimelineSchedule.css';

const TimelineSchedule = ({ bookings, date }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const calculateAppointmentStyle = (appointment) => {
    const hourWidth = 100 / 24;
    const startPosition = (appointment.startHour + (appointment.startMinute / 60)) * hourWidth;
    const width = (appointment.durationMinutes / 60) * hourWidth;
    return { 
      left: `${startPosition}%`, 
      width: `calc(${width}% - 2px)` 
    };
  };

  const calculateCurrentTimePosition = () => {
    const now = new Date();
    const hourOfDay = now.getHours();
    const minuteOfHour = now.getMinutes();
    const percentageOfDay = ((hourOfDay + (minuteOfHour / 60)) / 24) * 100;
    return { left: `${percentageOfDay}%` };
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (hours, minutes) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const appointments = bookings.map((b, i) => {
    const start = new Date(b.start_time);
    const end = new Date(b.end_time);
    const durationMinutes = (end - start) / 60000;
    
    return {
      id: i,
      title: b.user?.name || 'User',
      startHour: start.getHours(),
      startMinute: start.getMinutes(),
      durationMinutes,
      computerName: b.computer?.name || `Computer #${b.computer_id}`,
      userId: b.user_id,
      status: b.status,
      startTime: start,
      endTime: end,
    };
  });

  const handleMouseEnter = (appointment, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverInfo({
      appointment,
      position: {
        top: rect.top,
        left: rect.left + rect.width / 2
      }
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  return (
    <div className="schedule-container">
        <div className="date-container">
            <div className="current-date">{formatDate(date)}</div>
        </div>
      
        <div className="timeline-container">
            <div className="timeline">
                <div className="timeline-header">
                    <div className="hours-container">
                        {timeSlots.map((timeSlot, index) => (
                        <div key={index} className="timeline-header-cell">{timeSlot}</div>
                        ))}
                    </div>
                </div>
          
            <div className="timeline-content">
                <div className="hours-container">
                    {timeSlots.map((_, index) => (
                        <div key={index} className="hour-cell"></div>
                    ))}
              
                    {appointments.map(appointment => (
                        <div
                        key={appointment.id}
                        className="appointment"
                        style={calculateAppointmentStyle(appointment)}
                        onMouseEnter={(e) => handleMouseEnter(appointment, e)}
                        onMouseLeave={handleMouseLeave}
                        >
                        {appointment.title}
                        </div>
                    ))}
              
                <div
                    className="current-time-indicator"
                    style={calculateCurrentTimePosition()}
                ></div>
                </div>
            </div>
            </div>
        </div>

        {hoverInfo && (
        <div 
            className="appointment-modal"
            style={{
            position: 'fixed',
            top: `${hoverInfo.position.top - 100}px`,
            left: `${hoverInfo.position.left}px`,
            transform: 'translateX(-50%)'
            }}
        >
            <div className="modal-content">
            <h3>{hoverInfo.appointment.title}</h3>
            <p><strong>Role:</strong> user</p>
            <p><em>admin (in development)</em></p>
            <p><em>deposit (in development)</em></p>
            <p><strong>Booking:</strong> {formatDate(hoverInfo.appointment.startTime)}, {formatTime(hoverInfo.appointment.startHour, hoverInfo.appointment.startMinute)}</p>
            </div>
        </div>
        )}

    </div>
  );
};

export default TimelineSchedule;