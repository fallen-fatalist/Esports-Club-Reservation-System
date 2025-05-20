import React from "react";
import classes from "./MyTime.module.css"
const MyTime = ({ ...props }) => {
    return (
      <input
        type="time"
        step="60" 
        {...props}
        className={classes.inputTime}
      />
    );
  };

  export default MyTime
  