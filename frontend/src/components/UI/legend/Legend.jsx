import React from 'react';
import styles from './Legend.module.css';

const Legend = () => (
  <div className={styles.legend}>
    <div className={styles.legendItem}>
      <span className={`${styles.circle} ${styles.available}`}></span>
      <span>Available</span>
    </div>
    <div className={styles.legendItem}>
      <span className={`${styles.circle} ${styles.booked}`}></span>
      <span>Booked</span>
    </div>
    <div className={styles.legendItem}>
      <span className={`${styles.circle} ${styles.unknown}`}></span>
      <span>Unavailable</span>
    </div>
  </div>
);

export default Legend;
