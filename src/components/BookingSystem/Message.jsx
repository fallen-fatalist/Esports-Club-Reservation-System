import React from "react";

const Message = ({ message, type }) => {
  return (
    message && (
      <div className={`${type}-message`} aria-live={type === "error" ? "assertive" : "polite"}>
        {message}
      </div>
    )
  );
};

export default Message;
