import React from "react";
import Timedate from "../UI/date/Timedate/Timedate";
import MyTime from "../UI/date/MyTime/MyTime";
import MyDropdown from "../UI/dropdown/MyDropdown/MyDropdown";
import MyButton from "../UI/button/MyButton/MyButton";
import Legend from "../UI/legend/Legend";
import Message from "./Message";

const BookingForm = ({
  date, setDate, 
  time, setTime, 
  duration, setDuration, 
  onCheckAvailability, errorMessage,  
  infoMessage, bookingSuccess, 
  selectedComputers, handleBookMultipleComputers, 
  setSelectedComputers, handleAutoSelectComputers, 
  autoSelectCount, setAutoSelectCount,
  autoSelectCountInput, setAutoSelectCountInput }) => (

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
    <MyButton onClick={onCheckAvailability}>
      <span className="btn-txt">Check Availability</span>
    </MyButton>
    <div className="auto-selection">
      <label htmlFor="autoSelectCount">Auto-select computers:</label>
      <input
        id="autoSelectCount"
        type="number"
        min="1"
        value={autoSelectCountInput}
        onChange={(e) => setAutoSelectCountInput(e.target.value)}
        onBlur={() => {
          const parsed = parseInt(autoSelectCountInput);
          if (isNaN(parsed) || parsed < 1) {
            setAutoSelectCount(1);
            setAutoSelectCountInput("1");
          } else {
            setAutoSelectCount(parsed);
          }
        }}
        className="auto-select-input"
      />
      <MyButton onClick={() => handleAutoSelectComputers(autoSelectCount)}>
        Auto Select
      </MyButton>
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
        <MyButton className="book-multiple-button" onClick={handleBookMultipleComputers}>
          <span className="btn-txt">Book Selected</span>
        </MyButton>
        <MyButton className="clear-selection-button" onClick={() => setSelectedComputers([])}>
          <span className="btn-txt">Clear Selected</span>
        </MyButton>
      </div>
    )}

    <Legend />
  </div>
);

export default BookingForm;
