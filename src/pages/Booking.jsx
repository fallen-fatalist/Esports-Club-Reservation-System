import React, { useState, useEffect } from "react";
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
  const [selectedComputer, setSelectedComputer] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [filteredComputers, setFilteredComputers] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { computers: fetchedComputers = [], loading, error } = useComputers();
  const { bookings, refetchBookings } = useBookings();
  const [computers, setComputers] = useState([]);

  useEffect(() => {
    if (fetchedComputers.length > 0) {
      setComputers(fetchedComputers);
      setFilteredComputers(fetchedComputers);
    }
  }, [fetchedComputers]);

  const validateDateTime = () => {
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
  };

  const handleAvailabilityCheck = () => {
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
    setSelectedComputer(null);
    setErrorMessage(null);
  };

  const handleComputerClick = (computerId) => {
    const list = isFiltered ? filteredComputers : computers;
    const computer = list.find(c => c.id === computerId);
    if (!computer) return;

    setSelectedComputer(computerId === selectedComputer ? null : computerId);
    setErrorMessage(null);
    setModalVisible(true);
  };

  const handleBookComputer = async () => {
    if (!selectedComputer) {
      setErrorMessage("Please select a computer first");
      return;
    }

    if (!validateDateTime()) return;

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const userId = currentUser?.id || 1;

    try {
      setInfoMessage("Processing your booking...");

      const startTime = dateUtils.parseDate(date, time);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const formattedStartTime = dateUtils.formatWithLocalTimezone(startTime);
      const formattedEndTime = dateUtils.formatWithLocalTimezone(endTime);

      const bookingData = {
        user_id: userId,
        computer_id: selectedComputer,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        package_id: 1,
        status: "pending"
      };

      await bookingService.createBooking(bookingData);
      handleBookingSuccess();
    } catch (error) {
      handleBookingError(error);
    }
  };

  const handleBookingSuccess = async () => {
    setBookingSuccess(true);
    setErrorMessage(null);
    setInfoMessage(null);
  
    setFilteredComputers(prev =>
      prev.map(c =>
        c.id === selectedComputer ? { ...c, status: 'busy' } : c
      )
    );
  
    setComputers(prev =>
      prev.map(c =>
        c.id === selectedComputer ? { ...c, status: 'busy' } : c
      )
    );
  
    await refetchBookings(); 
  
    setSelectedComputer(null);
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
          onCheckAvailability={handleAvailabilityCheck}
          errorMessage={errorMessage}
          infoMessage={infoMessage}
          bookingSuccess={bookingSuccess}
        />

        <div className="computers__container">
          <ComputerList 
            computers={computersToDisplay} 
            onComputerClick={handleComputerClick}
            selectedComputers={selectedComputer ? [selectedComputer] : []}
          />

          {isFiltered && computersToDisplay.length === 0 && (
            <p className="no-computers-message">No available computers for selected time</p>
          )}
        </div>

        <ComputerDetailsModal
          visible={modalVisible}
          setVisible={setModalVisible}
          selectedComputer={selectedComputer}
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
