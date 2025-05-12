import React from "react";
import MyModal from "../UI/modal/MyModal";
import ComputerDetails from "../BookingSystem/ComputerDetails";
import BookingSummary from "../UI/bookingSummary/BookingSummary";
import MyButton from "../UI/button/MyButton/MyButton";

const ComputerDetailsModal = ({ visible, setVisible, selectedComputer, computers, date, time, duration, onBookComputer, bookings }) => {
  const computer = computers.find(c => c.id === selectedComputer);

  return (
    <MyModal visible={visible} setVisible={setVisible}>
      {computer && (
        <div className="booking-steps">
          <h3>Computer Details</h3>
          <BookingSummary computerId={selectedComputer} date={date} time={time} duration={duration} />
          <ComputerDetails computer={computer} bookings={bookings} date={date} />
          {computer.status === 'available' && (
            <MyButton className="confirm-booking-btn" onClick={onBookComputer}>
              <span>Confirm Booking</span>
            </MyButton>
          )}
        </div>
      )}
    </MyModal>
  );
};


export default ComputerDetailsModal;
