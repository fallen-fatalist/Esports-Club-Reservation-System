import React, { useState, useEffect, useCallback } from "react";
import useComputers from "../hooks/useComputers";
import useBookings from "../hooks/useBookings";
import ComputerList from "../components/BookingSystem/ComputerList";
import bookingService from "../services/bookingService";
import isComputerAvailable from "../components/utils/isComputerAvailable";
import dateUtils from "../components/utils/dateUtils";
import ComputerDetailsModal from "../components/BookingSystem/ComputerDetailsModal";
import BookingForm from "../components/BookingSystem/BookingForm";  

const Booking = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('12:00');
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

  useEffect(() => {
    if (fetchedComputers.length > 0) {
      setComputers(fetchedComputers);
      setFilteredComputers(fetchedComputers);
    }
  }, [fetchedComputers]);
  
  const validateDateTime = useCallback(() => {
    try {
      const bookingStart = dateUtils.parseDate(date, time);
      const now = new Date();

      if (bookingStart <= now) {
        setErrorMessage("Cannot book in the past.");
        return false;
      }
      if (duration > 180) {
        setErrorMessage("Maximum booking duration is 3 hours");
        return false;
      }

      setErrorMessage(null);
      return true;
    } catch (error) {
      setErrorMessage(error.message);
      return false;
    }
  }, [date, time, duration]);

  const checkAvailability = useCallback(() => {
    if (!validateDateTime()) return;

    const updatedList = computers.map((c) => {
      const available = isComputerAvailable(c.id, bookings, date, time, duration);
      return {
        ...c,
        status: available ? 'available' : 'busy',
      };
    });

    setFilteredComputers(updatedList);
    setIsFiltered(true);
    setSelectedComputers([]);
    setErrorMessage(null);
  }, [computers, bookings, date, time, duration, validateDateTime]);

  useEffect(() => {
    if (computers.length > 0) {
      checkAvailability();
    }
  }, [computers.length, checkAvailability]);



  const handleComputerClick = (computerId) => {
    const computer = computersToDisplay.find(c => c.id === computerId);
    if (computer && computer.status === 'busy') {
      return; 
    }
    
    setSelectedComputers((prev) => {
      if (prev.includes(computerId)) {
        return prev.filter((id) => id !== computerId);
      } else {
        return [...prev, computerId];
      }
    });
    setErrorMessage(null);
  };

  const handleViewComputerDetails = (computerId) => {
    setModalComputerId(computerId);
    setModalVisible(true);
  };

  const handleBookMultipleComputers = async () => {
    if (selectedComputers.length === 0) {
      setErrorMessage("Please select at least one computer.");
      return;
    }

    if (!validateDateTime()) return;

    try {
      setInfoMessage(`Processing booking for ${selectedComputers.length} computer(s)...`);

      const startTime = dateUtils.parseDate(date, time);
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

  const handleBookComputer = async (computerId) => {
    if (!validateDateTime()) return;

    try {
      setInfoMessage("Processing your booking...");

      const startTime = dateUtils.parseDate(date, time);
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

      setFilteredComputers((prev) =>
        prev.map((c) => (c.id === computerId ? { ...c, status: 'busy' } : c))
      );
      setComputers((prev) =>
        prev.map((c) => (c.id === computerId ? { ...c, status: 'busy' } : c))
      );

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
    const available = computersToDisplay.filter((comp) => comp.status === 'available');
    const autoSelected = available.slice(0, count).map((comp) => comp.id);
    setSelectedComputers(autoSelected);
  };

  const handleBookingSuccess = async () => {
    setBookingSuccess(true);
    setErrorMessage(null);
    setInfoMessage(null);

    setFilteredComputers((prev) =>
      prev.map((c) =>
        selectedComputers.includes(c.id) ? { ...c, status: 'busy' } : c
      )
    );

    setComputers((prev) =>
      prev.map((c) =>
        selectedComputers.includes(c.id) ? { ...c, status: 'busy' } : c
      )
    );

    await refetchBookings();

    setSelectedComputers([]);
    setIsFiltered(false);
    setModalVisible(false);

    setTimeout(() => {
      setBookingSuccess(false);
    }, 3000);
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

  if (loading) return <div className="loading-message">Loading computers...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  const computersToDisplay = isFiltered ? filteredComputers : computers;

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
            computers={computersToDisplay}
            onComputerClick={handleComputerClick}
            onViewDetails={handleViewComputerDetails}
            selectedComputers={selectedComputers}
            onBook={handleBookComputer}
          />

          {isFiltered && computersToDisplay.length === 0 && (
            <p className="no-computers-message">No available computers for selected time</p>
          )}
        </div>

        <ComputerDetailsModal
          visible={modalVisible}
          setVisible={setModalVisible}
          selectedComputer={modalComputerId}
          computers={computersToDisplay}
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