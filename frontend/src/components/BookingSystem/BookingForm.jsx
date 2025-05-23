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
  currentRoom: initialRoom = "Standard",
  setCurrentRoom // Необязательный prop для изменения текущего зала
}) => {
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState(null);
  const [internalRoom, setInternalRoom] = useState(initialRoom);

  // Используем внутреннее состояние, если внешнее не передано
  const currentRoom = setCurrentRoom ? initialRoom : internalRoom;

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setPackagesLoading(true);
        const fetchedPackages = await packageService.getPackages();
        setPackages(fetchedPackages);
        
        // Сбрасываем выбранный пакет при смене зала
        if (selectedPackage) {
          const currentPackage = fetchedPackages.find(pkg => pkg.id === selectedPackage);
          if (!currentPackage || currentPackage.room !== currentRoom) {
            const defaultPackage = fetchedPackages.find(pkg => pkg.room === currentRoom);
            setSelectedPackage(defaultPackage ? defaultPackage.id : '');
          }
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

  // Получаем уникальные залы из пакетов
  const availableRooms = [...new Set(packages.map(pkg => pkg.room))].sort();

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

  const handleRoomChange = (newRoom) => {
    // Используем внешний setter, если передан, иначе внутренний
    if (setCurrentRoom) {
      setCurrentRoom(newRoom);
    } else {
      setInternalRoom(newRoom);
    }
    // Очищаем выбранные компьютеры при смене зала
    setSelectedComputers([]);
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
        
        {/* Выбор зала */}
        <div className="reservation__room">
          <MyDropdown 
            value={currentRoom} 
            onChange={(e) => handleRoomChange(e.target.value)}
          >
            {availableRooms.map((room) => (
              <option key={room} value={room}>
                {room} Room
              </option>
            ))}
          </MyDropdown>
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