import React from 'react';
import styles from './bookingSummary.module.css';

const BookingSummary = ({ computerId, date, time, duration }) => (
  <div className={styles.bookingSummary}>
    <p><strong>Computer:</strong> #{computerId}</p>
    <p><strong>Date:</strong> {date}</p>
    <p><strong>Time:</strong> {time}</p>
    <p><strong>Duration:</strong> {duration / 60} hour(s)</p>
  </div>
);

export default BookingSummary;
