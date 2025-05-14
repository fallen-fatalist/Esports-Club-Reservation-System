import React from "react";
import classes from "./MyTime.module.css"
const MyTime = ({ ...props }) => {
    return (
      <input
        type="time"
        {...props}
        className={classes.inputTime}
      />
    );
  };

  export default MyTime
  