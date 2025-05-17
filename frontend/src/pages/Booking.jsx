import React, { useState, useEffect, useCallback } from "react";
import useComputers from "../hooks/useComputers";
import useBookings from "../hooks/useBookings";
import ComputerList from "../components/BookingSystem/ComputerList";
import bookingService from "../services/bookingService";
import isComputerAvailable from "../components/utils/isComputerAvailable";
import dateUtils from "../components/utils/dateUtils";
import ComputerDetailsModal from "../components/BookingSystem/ComputerDetailsModal";
import BookingForm from "../components/BookingSystem/BookingForm";

const excludedStatuses = ['pending', 'under repair', 'not working', 'unknown'];

const getCurrentTimeString = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1); 
  const roundedMinutes = Math.ceil(now.getMinutes() / 5) * 5;
  now.setMinutes(roundedMinutes);
  now.setSeconds(0);
  now.setMilliseconds(0);
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');

  if (hours === '00' && parseInt(mins) < 5) {
    return `00:05`;
  }
  
  return `${hours}:${mins}`;
};

const isDisplayableStatus = (status) => {
  return !excludedStatuses.includes(status);
};

const Booking = () => {
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTimeString());
  const [duration, setDuration] = useState(60);
  const [selectedComputers, setSelectedComputers] = useState([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [filteredComputers, setFilteredComputers] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalComputerId, setModalComputerId] = useState(null);
  const [autoSelectCount, setAutoSelectCount] = useState(1);
  const [autoSelectCountInput, setAutoSelectCountInput] = useState("1");

  const { computers: fetchedComputers = [], loading, error } = useComputers();
  const { bookings, refetchBookings } = useBookings();
  const [computers, setComputers] = useState([]);

  const validateDateTime = useCallback(() => {
    const timeToUse = time || getCurrentTimeString();
    const today = getCurrentDate(); 

    if (date < today) {
      setErrorMessage(`Cannot book in the past. Please select today's date (${today})`);
      return false;
    }
    
    const bookingStart = dateUtils.parseDate(date, timeToUse);
    const nowPlusBuffer = new Date();
    
    if (bookingStart <= nowPlusBuffer) {
      const futureTime = new Date(Date.now() + 1 * 60 * 1000);
      const hours = String(futureTime.getHours()).padStart(2, '0');
      const minutes = String(Math.ceil(futureTime.getMinutes() / 5) * 5).padStart(2, '0');
      setErrorMessage(`Cannot book in the past. Choose time after ${hours}:${minutes}`);
      return false;
    }

    if (duration > 180) {
      setErrorMessage("Maximum booking duration is 3 hours");
      return false;
    }

    setErrorMessage(null);
    return true;
  }, [date, time, duration]);

  
  const checkAvailability = useCallback(() => {

    if (!validateDateTime()) return;
    const timeToUse = time || getCurrentTimeString();

    const updatedList = fetchedComputers
      .filter(c => !excludedStatuses.includes(c.status))
      .map((c) => {
        const available = bookings.length > 0
          ? isComputerAvailable(c.id, bookings, date, timeToUse, duration)
          : true; 
        return {
          ...c,
          status: available ? 'available' : 'busy',
        };
      });

    setComputers(updatedList);
    setFilteredComputers(updatedList);
    setIsFiltered(true);
    setSelectedComputers([]);
    setErrorMessage(null);
  }, [fetchedComputers, bookings, date, time, duration, validateDateTime]);


  useEffect(() => {

    if (fetchedComputers.length > 0) {
      checkAvailability();
    }
  }, [fetchedComputers, checkAvailability]);


  const handleBookMultipleComputers = async () => {
    if (selectedComputers.length === 0) {
      setErrorMessage("Please select at least one computer.");
      return;
    }
    if (!validateDateTime()) return;

    try {
      setInfoMessage(`Processing booking for ${selectedComputers.length} computer(s)...`);
      const startTime = dateUtils.parseDate(date, time || getCurrentTimeString());
      const endTime = new Date(startTime.getTime() + duration * 60000);
      const formattedStartTime = dateUtils.formatWithLocalTimezone(startTime);
      const formattedEndTime = dateUtils.formatWithLocalTimezone(endTime);
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const userId = currentUser?.id || 1;

      const bookingPromises = selectedComputers.map(computerId =>
        bookingService.createBooking({
          user_id: userId,
          computer_id: computerId,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          package_id: 1,
          status: "pending"
        })
      );

      await Promise.all(bookingPromises);
      handleBookingSuccess();
    } catch (error) {
      handleBookingError(error);
    }
  };

  const handleBookingSuccess = async () => {
    setBookingSuccess(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const updated = computers.map(c =>
      selectedComputers.includes(c.id) ? { ...c, status: 'busy' } : c
    );

    setComputers(updated);
    setFilteredComputers(updated);

    await refetchBookings();
    setSelectedComputers([]);
    setIsFiltered(true);
    setModalVisible(false);

    setTimeout(() => setBookingSuccess(false), 3000);
  };

  const handleBookingError = (error) => {
    let errorMsg = "Error creating booking. Please try again.";
    if (error.response?.data?.message) {
      errorMsg = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMsg = error.response.data.error;
    } else if (error.message) {
      errorMsg = `Error: ${error.message}`;
    }
    setErrorMessage(errorMsg);
    setInfoMessage(null);
  };

  const handleComputerClick = (computerId) => {
    const computer = filteredComputers.find(c => c.id === computerId);
    if (!computer || excludedStatuses.includes(computer.status) || computer.status === 'busy') return;

    setSelectedComputers((prev) =>
      prev.includes(computerId) ? prev.filter((id) => id !== computerId) : [...prev, computerId]
    );
    setErrorMessage(null);
  };

  const handleBookComputer = async (computerId) => {
    const computer = filteredComputers.find(c => c.id === computerId);
    if (!computer || excludedStatuses.includes(computer.status)) {
      setErrorMessage("This computer is not available for booking.");
      return;
    }
    if (!validateDateTime()) return;

    try {
      setInfoMessage("Processing your booking...");
      const startTime = dateUtils.parseDate(date, time || getCurrentTimeString());
      const endTime = new Date(startTime.getTime() + duration * 60000);
      const formattedStartTime = dateUtils.formatWithLocalTimezone(startTime);
      const formattedEndTime = dateUtils.formatWithLocalTimezone(endTime);
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const userId = currentUser?.id || 1;

      await bookingService.createBooking({
        user_id: userId,
        computer_id: computerId,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        package_id: 1,
        status: "pending"
      });

      const updated = computers.map(c =>
        c.id === computerId ? { ...c, status: 'busy' } : c
      );

      setComputers(updated);
      setFilteredComputers(updated);
      await refetchBookings();

      setSelectedComputers((prev) => prev.filter((id) => id !== computerId));
      setInfoMessage(null);
      setErrorMessage(null);
      setBookingSuccess(true);
      setTimeout(() => setBookingSuccess(false), 3000);
    } catch (error) {
      handleBookingError(error);
    }
  };

  const handleAutoSelectComputers = (count = 1) => {
    const available = filteredComputers.filter((c) => c.status === 'available');

    if (available.length === 0) {
      setErrorMessage("No available computers for auto-selection.");
      setInfoMessage(null); // extra
      return;
    }

    const adjustedCount = Math.min(count, available.length);

    if (count > available.length) {
      setInfoMessage(`Requested ${count}, but only ${available.length} available. All available computers have been selected.`);
    } 

    const autoSelected = available.slice(0, adjustedCount).map((c) => c.id);
    setSelectedComputers(autoSelected);
    setErrorMessage(null);
  };

  const handleViewComputerDetails = (computerId) => {
    setModalComputerId(computerId);
    setModalVisible(true);
  };

  const getFilteredComputersForDisplay = () => {
    return filteredComputers.filter(c => isDisplayableStatus(c.status));
  };

  if (loading) return <div className="loading-message">Loading computers...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <section className="booking__section">
      <div className="booking__container">
        <BookingForm
          date={date}
          setDate={setDate}
          time={time}
          setTime={setTime}
          duration={duration}
          setDuration={setDuration}
          onCheckAvailability={checkAvailability}
          errorMessage={errorMessage}
          infoMessage={infoMessage}
          bookingSuccess={bookingSuccess}
          selectedComputers={selectedComputers}
          handleBookMultipleComputers={handleBookMultipleComputers}
          setSelectedComputers={setSelectedComputers}
          autoSelectCount={autoSelectCount}
          setAutoSelectCount={setAutoSelectCount}
          handleAutoSelectComputers={handleAutoSelectComputers}
          autoSelectCountInput={autoSelectCountInput}
          setAutoSelectCountInput={setAutoSelectCountInput}
        />

        <div className="computers__container">
          <ComputerList
            computers={getFilteredComputersForDisplay()}
            onComputerClick={handleComputerClick}
            onViewDetails={handleViewComputerDetails}
            selectedComputers={selectedComputers}
            onBook={handleBookComputer}
          />
          {isFiltered && getFilteredComputersForDisplay().length === 0 && (
            <p className="no-computers-message">No available computers for selected time</p>
          )}
        </div>

        <ComputerDetailsModal
          visible={modalVisible}
          setVisible={setModalVisible}
          selectedComputer={modalComputerId}
          computers={filteredComputers}
          date={date}
          time={time}
          duration={duration}
          onBookComputer={handleBookComputer}
          bookings={bookings}
        />
      </div>
    </section>
  );
};

export default Booking;