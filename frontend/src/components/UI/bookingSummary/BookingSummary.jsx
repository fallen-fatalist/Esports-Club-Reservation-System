import React from 'react';

const formatDuration = (duration) => {
  if (!duration || isNaN(duration) || duration <= 0) {
    return 'Not specified';
  }
  
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
};

const BookingSummary = ({ computerId, date, time, duration }) => (
  <div className="bookingSummary">
    <h3>Computer Details</h3>
    <p><strong>Computer id:</strong> {computerId || 'Not selected'}</p>
    <p><strong>Date:</strong> {date || 'Not selected'}</p>
    <p><strong>Time:</strong> {time || 'Not selected'}</p>
    <p><strong>Duration:</strong> {formatDuration(duration)}</p>
  </div>
);

export default BookingSummary;