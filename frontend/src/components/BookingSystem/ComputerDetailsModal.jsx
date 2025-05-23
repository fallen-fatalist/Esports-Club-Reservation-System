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
          <img
            src={crossIcon}
            alt="Close"
            className="modal-close-icon"
            onClick={() => setVisible(false)}
            style={{ cursor: 'pointer', width: 24, height: 24 }}
          />
          <BookingSummary computerId={selectedComputer} date={date} time={time} duration={duration} />
          <ComputerDetails computer={computer} bookings={bookings} date={date} />
        </div>
      )}
    </MyModal>
  );
};

export default ComputerDetailsModal;
