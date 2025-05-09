const dateUtils = {
  formatWithLocalTimezone: (date) => {
    const tzOffset = date.getTimezoneOffset();
    const tzHours = Math.floor(Math.abs(tzOffset) / 60);
    const tzMinutes = Math.abs(tzOffset) % 60;
    const tzSign = tzOffset <= 0 ? '+' : '-';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    const timezone = `${tzSign}${String(tzHours).padStart(2, '0')}:${String(tzMinutes).padStart(2, '0')}`;
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezone}`;
  },
  
  parseDate: (dateString, timeString) => {
    try {
      if (dateString.includes('.')) {
        const [day, month, year] = dateString.split('.');
        
        if (!day || !month || !year || 
            isNaN(Number(day)) || isNaN(Number(month)) || isNaN(Number(year))) {
          throw new Error("Invalid date format. Please use DD.MM.YYYY");
        }
        
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timeString}:00`);
      } 
      
      if (dateString.includes('-')) {
        return new Date(`${dateString}T${timeString}:00`);
      }
      
      throw new Error("Unsupported date format. Please use DD.MM.YYYY or YYYY-MM-DD");
    } catch (error) {
      throw new Error("Could not create a valid date. Please check your date format.");
    }
  }
};


export default dateUtils;