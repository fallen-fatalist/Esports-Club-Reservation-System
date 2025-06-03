import React from 'react';

const formatDuration = (duration) => {
  if (!duration || isNaN(duration) || duration <= 0) {
    return 'Not specified';
  }
  
  if (duration === 1) {
    return `${duration} hour`;
  } else {
    return `${duration} hours`;
  }
};

const BookingSummary = ({ computerId, date, time, selectedPackage, packages }) => {
  const getSelectedPackageInfo = () => {
    if (!selectedPackage || !packages || packages.length === 0) {
      return {
        name: 'Not selected',
        duration: null,
        price: null,
        room: null
      };
    }
    
    const packageInfo = packages.find(pkg => pkg.id === selectedPackage);
    
    if (!packageInfo) {
      return {
        name: 'Package not found',
        duration: null,
        price: null,
        room: null
      };
    }
    
    return {
      name: packageInfo.name,
      duration: packageInfo.duration,
      price: packageInfo.price,
      room: packageInfo.room
    };
  };

  const packageInfo = getSelectedPackageInfo();

  return (
    <div className="bookingSummary">
      <h3>Booking Details</h3>
      <p><strong>Computer ID:</strong> {computerId || 'Not selected'}</p>
      <p><strong>Date:</strong> {date || 'Not selected'}</p>
      <p><strong>Time:</strong> {time || 'Not selected'}</p>
      <p><strong>Selected Package:</strong> {packageInfo.name}</p>
      <p><strong>Duration:</strong> {formatDuration(packageInfo.duration)}</p>
      {packageInfo.price && (
        <p><strong>Price:</strong> {packageInfo.price}₸</p>
      )}
      {packageInfo.room && (
        <p><strong>Room:</strong> {packageInfo.room}</p>
      )}
    </div>
  );
};

export default BookingSummary;