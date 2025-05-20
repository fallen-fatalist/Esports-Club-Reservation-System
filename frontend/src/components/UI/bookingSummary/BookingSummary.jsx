import React from 'react';

const BookingSummary = ({ computerId, date, time, duration }) => (
  <div className="bookingSummary">
    <h3>Computer Details</h3>
    <p><strong>Computer id:</strong> {computerId}</p>
    <p><strong>Date:</strong> {date}</p>
    <p><strong>Time:</strong> {time}</p>
    <p><strong>Duration:</strong> {duration / 60} hour(s)</p>
  </div>
);

export default BookingSummary;
