import React, { useState, useEffect } from "react";
import Timedate from "../UI/date/Timedate/Timedate";
import MyTime from "../UI/date/MyTime/MyTime";
import MyDropdown from "../UI/dropdown/MyDropdown/MyDropdown";
import Message from "./Message";
import packageService from "../../services/packageService";

const BookingForm = ({
  date, setDate,
  time, setTime,
  selectedPackage, setSelectedPackage, 
  errorMessage,
  infoMessage, bookingSuccess,
  selectedComputers, handleBookMultipleComputers,
  setSelectedComputers, handleAutoSelectComputers,
  autoSelectCountInput, setAutoSelectCountInput,
  availableComputersCount,
  currentRoom = "Standard" 
}) => {
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setPackagesLoading(true);
        const fetchedPackages = await packageService.getPackages();
        setPackages(fetchedPackages);
        
        if (!selectedPackage && fetchedPackages.length > 0) {
          const defaultPackage = fetchedPackages.find(pkg => pkg.room === currentRoom) || fetchedPackages[0];
          setSelectedPackage(defaultPackage.id);
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
        setPackagesError('Failed to load packages');
      } finally {
        setPackagesLoading(false);
      }
    };

    fetchPackages();
  }, [currentRoom, selectedPackage, setSelectedPackage]);

  const filteredPackages = packages.filter(pkg => pkg.room === currentRoom);

  const parseValidCount = () => {
    const parsed = parseInt(autoSelectCountInput);
    if (isNaN(parsed) || parsed < 1) return 1;
    if (parsed > availableComputersCount) return availableComputersCount;
    return parsed;
  };

  const handleAutoSelectClick = () => {
    const count = parseValidCount();
    handleAutoSelectComputers(count);
  };

  const formatPackageOption = (pkg) => {
    return `${pkg.name} - ${pkg.duration}h - ${pkg.price}₸`;
  };

  return (
    <div className="reservation__container">
      <h3>PC Reservation</h3>
      <p>Select date and time</p>

      <div className="reservation__date">
        <Timedate value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="time__duration">
        <div className="reservation__time">
          <MyTime value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="reservation__duration">
          {packagesLoading ? (
            <MyDropdown disabled>
              <option>Loading packages...</option>
            </MyDropdown>
          ) : packagesError ? (
            <MyDropdown disabled>
              <option>Error loading packages</option>
            </MyDropdown>
          ) : (
            <MyDropdown 
              value={selectedPackage} 
              onChange={(e) => setSelectedPackage(Number(e.target.value))}
            >
              <option value="">Select package</option>
              {filteredPackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {formatPackageOption(pkg)}
                </option>
              ))}
            </MyDropdown>
          )}
        </div>
      </div>

      <div className="auto-selection">
        <label htmlFor="autoSelectCount">Auto-select computers:</label>
        <input
          id="autoSelectCount"
          type="number"
          min="1"
          max={availableComputersCount}
          value={autoSelectCountInput}
          onChange={(e) => {
            const value = e.target.value;
            const parsed = parseInt(value);
            if (parsed > availableComputersCount) {
              setAutoSelectCountInput(String(availableComputersCount));
            } else {
              setAutoSelectCountInput(value);
            }
          }}
          onBlur={() => {
            const count = parseValidCount();
            setAutoSelectCountInput(String(count));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAutoSelectClick();
            }
          }}
          className="auto-select-input"
        />
        <button className="auto-select-btn" onClick={handleAutoSelectClick}>
          <span className="btn-txt">Auto Select</span>
        </button>
      </div>

      {packagesError && <Message message={packagesError} type="error" />}
      {errorMessage && <Message message={errorMessage} type="error" />}
      {infoMessage && <Message message={infoMessage} type="info" />}
      {bookingSuccess && (
        <div className="booking-success-banner">
          <p>Your computer has been booked successfully!</p>
        </div>
      )}

      {selectedComputers.length > 0 && (
        <div className="computers__selection-actions">
          <span className="computers__selection-count">
            Selected computers: {selectedComputers.length}
          </span>
          <button className="book-multiple-button" onClick={handleBookMultipleComputers}>
            <span className="btn-txt">Book Selected</span>
          </button>
          <button className="clear-selection-button" onClick={() => setSelectedComputers([])}>
            <span className="btn-txt">Clear Selected</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingForm;