import React from "react";
import MyModal from "../UI/modal/MyModal";
import ComputerDetails from "../BookingSystem/ComputerDetails";
import BookingSummary from "../UI/bookingSummary/BookingSummary";
import crossIcon from '../../images/Cross.svg';

const ComputerDetailsModal = ({ visible, setVisible, selectedComputer, computers, date, time, duration, bookings }) => {
  const computer = computers.find(c => c.id === selectedComputer);

  return (
    <MyModal visible={visible} setVisible={setVisible}>
      {computer && (
        <div className="booking-steps">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="modal-close-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          onClick={() => setVisible(false)}
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            d="M20 20L4 4m16 0L4 20"
          />
        </svg>

          <h3>Computer Details</h3>
          <BookingSummary computerId={selectedComputer} date={date} time={time} duration={duration} />
          <ComputerDetails computer={computer} bookings={bookings} date={date} />
        </div>
      )}
    </MyModal>
  );
};


export default ComputerDetailsModal;
