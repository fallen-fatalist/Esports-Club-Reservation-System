import React from 'react';
import classes from './Timedate.module.css';

const Timedate = ({children, ...props}) => {
    return (
        <input 
        type="date"     
        {...props}
        className={classes.inputDate} 
        />
    );
};

export default Timedate