
// import React, { useState, useEffect } from 'react';
// import { 
//   Paper, 
//   Table, 
//   TableBody, 
//   TableCell, 
//   TableContainer, 
//   TableHead, 
//   TableRow,
//   Typography,
//   IconButton,
//   Box,
//   Button,
//   CircularProgress,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogContentText,
//   DialogTitle,
//   Tooltip
// } from '@mui/material';
// import { 
//   Check as CheckIcon, 
//   Close as CloseIcon,
//   NavigateBefore as NavigateBeforeIcon,
//   NavigateNext as NavigateNextIcon
// } from '@mui/icons-material';

// // Компонент календаря бронирования
// const Calendar = () => {
//   // Данные для имитации бронирований (в реальном приложении будут из API)
//   const [bookings, setBookings] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Загрузка данных бронирования
//   useEffect(() => {
//     // Имитация загрузки данных
//     setTimeout(() => {
//       const mockBookings = [
//         { id: 1, computer_id: 1, start_time: new Date(2025, 4, 12, 10, 0), end_time: new Date(2025, 4, 12, 12, 0) },
//         { id: 2, computer_id: 2, start_time: new Date(2025, 4, 13, 14, 0), end_time: new Date(2025, 4, 13, 16, 0) },
//         { id: 3, computer_id: 3, start_time: new Date(2025, 4, 14, 9, 0), end_time: new Date(2025, 4, 14, 11, 0) },
//         { id: 4, computer_id: 1, start_time: new Date(2025, 4, 15, 16, 0), end_time: new Date(2025, 4, 15, 18, 0) }
//       ];
      
//       setBookings(mockBookings);
//       setLoading(false);
//     }, 1000);
//   }, []);

//   if (loading) return (
//     <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
//       <CircularProgress />
//     </Box>
//   );
  
//   if (error) return (
//     <Typography color="error" variant="h6" align="center">
//       Ошибка: {error}
//     </Typography>
//   );

//   return (
//     <Box p={4}>
//       <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
//         Календарь бронирования
//       </Typography>
//       <BookingGrid bookings={bookings} />
//     </Box>
//   );
// };

// // Компонент сетки бронирования
// const BookingGrid = ({ bookings }) => {
//   // Состояние для модального окна бронирования
//   const [openDialog, setOpenDialog] = useState(false);
//   const [selectedSlot, setSelectedSlot] = useState(null);
  
//   // Состояние для недели (для навигации между неделями)
//   const [weekOffset, setWeekOffset] = useState(0);

//   // Дни недели
//   const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
//   // Часы работы (с 9:00 до 22:00)
//   const hours = [];
//   for (let i = 9; i <= 22; i++) {
//     hours.push(`${i.toString().padStart(2, '0')}:00`);
//   }

//   // Получение текущей даты с учетом смещения недели
//   const today = new Date();
//   today.setDate(today.getDate() + weekOffset * 7);
//   const currentDay = today.getDay(); // 0 = воскресенье, 1 = понедельник, ...
  
//   // Создаем массив дат для текущей недели с учетом смещения
//   const weekDates = [];
//   for (let i = 0; i < 7; i++) {
//     const dayOffset = i - (currentDay === 0 ? 6 : currentDay - 1); // Корректировка для начала с понедельника
//     const date = new Date(today);
//     date.setDate(today.getDate() + dayOffset);
//     weekDates.push(date);
//   }

//   // Проверка, забронирован ли временной слот
//   const isSlotBooked = (date, time) => {
//     const [hours, minutes] = time.split(':').map(Number);
//     const slotTime = new Date(date);
//     slotTime.setHours(hours, minutes, 0, 0);
    
//     return bookings.some(booking => {
//       return slotTime >= booking.start_time && slotTime < booking.end_time;
//     });
//   };

//   const formatDate = (date) => {
//     return `${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
//   };

//   // Обработчик клика на слот
//   const handleSlotClick = (date, time, booked) => {
//     if (!booked) {
//       setSelectedSlot({ date, time });
//       setOpenDialog(true);
//     }
//   };

//   // Обработчик закрытия диалога
//   const handleCloseDialog = () => {
//     setOpenDialog(false);
//   };

//   // Обработчик подтверждения бронирования
//   const handleConfirmBooking = () => {
//     if (selectedSlot) {
//       const { date, time } = selectedSlot;
//       const formattedDate = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
//       console.log(`Бронирование подтверждено: ${formattedDate} в ${time}`);
//       // Здесь добавьте логику сохранения бронирования
//     }
//     setOpenDialog(false);
//   };

//   // Навигация между неделями
//   const navigateWeek = (direction) => {
//     setWeekOffset(prev => prev + direction);
//   };

//   return (
//     <>
//       <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//         <Button 
//           variant="outlined" 
//           startIcon={<NavigateBeforeIcon />}
//           onClick={() => navigateWeek(-1)}
//         >
//           Предыдущая неделя
//         </Button>
//         <Typography variant="h6">
//           {`${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}`}
//         </Typography>
//         <Button 
//           variant="outlined" 
//           endIcon={<NavigateNextIcon />}
//           onClick={() => navigateWeek(1)}
//         >
//           Следующая неделя
//         </Button>
//       </Box>

//       <TableContainer component={Paper} elevation={3}>
//         <Table sx={{ minWidth: 650 }} aria-label="booking calendar">
//           <TableHead>
//             <TableRow>
//               <TableCell sx={{ fontWeight: 'bold', width: '100px' }}>Время</TableCell>
//               {daysOfWeek.map((day, index) => (
//                 <TableCell key={day} align="center" sx={{ fontWeight: 'bold' }}>
//                   <Typography variant="subtitle1">{day}</Typography>
//                   <Typography variant="body2">{formatDate(weekDates[index])}</Typography>
//                 </TableCell>
//               ))}
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {hours.map(time => (
//               <TableRow key={time} hover>
//                 <TableCell component="th" scope="row" align="center">
//                   {time}
//                 </TableCell>
//                 {weekDates.map((date) => {
//                   const booked = isSlotBooked(date, time);
//                   return (
//                     <TableCell 
//                       key={`${date}-${time}`} 
//                       align="center"
//                       onClick={() => handleSlotClick(date, time, booked)}
//                       sx={{
//                         backgroundColor: booked ? '#ffebee' : '#e8f5e9',
//                         cursor: booked ? 'default' : 'pointer',
//                         '&:hover': {
//                           backgroundColor: booked ? '#ffcdd2' : '#c8e6c9',
//                         },
//                       }}
//                     >
//                       <Tooltip title={booked ? "Занято" : "Свободно"}>
//                         {booked ? (
//                           <CloseIcon color="error" />
//                         ) : (
//                           <CheckIcon color="success" />
//                         )}
//                       </Tooltip>
//                     </TableCell>
//                   );
//                 })}
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       {/* Диалог для подтверждения бронирования */}
//       <Dialog
//         open={openDialog}
//         onClose={handleCloseDialog}
//         aria-labelledby="alert-dialog-title"
//         aria-describedby="alert-dialog-description"
//       >
//         <DialogTitle id="alert-dialog-title">
//           {"Подтверждение бронирования"}
//         </DialogTitle>
//         <DialogContent>
//           <DialogContentText id="alert-dialog-description">
//             {selectedSlot && `Вы хотите забронировать время ${selectedSlot.time} на ${selectedSlot.date.getDate()}.${selectedSlot.date.getMonth() + 1}.${selectedSlot.date.getFullYear()}?`}
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCloseDialog} color="primary">
//             Отмена
//           </Button>
//           <Button onClick={handleConfirmBooking} color="primary" autoFocus>
//             Подтвердить
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </>
//   );
// };

// export default Calendar;