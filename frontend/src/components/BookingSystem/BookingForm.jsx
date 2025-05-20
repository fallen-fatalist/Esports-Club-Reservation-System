import React from "react";
import Timedate from "../UI/date/Timedate/Timedate";
import MyTime from "../UI/date/MyTime/MyTime";
import MyDropdown from "../UI/dropdown/MyDropdown/MyDropdown";
import Message from "./Message";

const BookingForm = ({
  date, setDate,
  time, setTime,
  duration, setDuration,
  errorMessage,
  infoMessage, bookingSuccess,
  selectedComputers, handleBookMultipleComputers,
  setSelectedComputers, handleAutoSelectComputers,
  autoSelectCountInput, setAutoSelectCountInput,
  availableComputersCount
}) => {

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
          <MyDropdown value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="180">3 hours</option>
          </MyDropdown>
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
