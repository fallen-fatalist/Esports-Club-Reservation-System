import React from 'react';
import classes from './MyDropdown.module.css';

const MyDropdown = ({children, ...props}) => {
    return (
        <select {...props} className={classes.dropdown}>
            {children}
        </select>
    );
};

export default MyDropdown