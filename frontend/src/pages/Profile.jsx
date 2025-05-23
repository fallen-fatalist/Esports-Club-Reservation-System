import React, { useMemo, useContext, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Card,
  Divider,
  Stack,
  CssBaseline,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, parseISO } from "date-fns";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import { ThemeContext } from "../context/ThemeContext";
import bookingService from "../services/bookingService";
import computerService from "../services/computerService";
import packageService from "../services/packageService";

// Функция форматирования первой буквы в верхний регистр
const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Определение цвета по комнате
const getRoomColor = (room) => {
  switch (room?.toLowerCase()) {
    case "vip":
      return "warning";
    case "console":
      return "error";
    case "standard":
      return "primary";
    default:
      return "default";
  }
};

const Profile = () => {
  const { isDarkTheme } = useContext(ThemeContext);
  const [bookings, setBookings] = useState([]);
  const [computers, setComputers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookingsData, computersData, packagesData] = await Promise.all([
          bookingService.getUserBookings(),
          computerService.getComputers(),
          packageService.getPackages()
        ]);
        setBookings(bookingsData);
        setComputers(computersData);
        setPackages(packagesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const transformedBookings = useMemo(() => {
    if (!bookings.length || !computers.length || !packages.length) return [];

    return bookings.map((booking) => {
      const computer = computers.find(c => c.id === booking.computer_id);
      const pkg = packages.find(p => p.id === booking.package_id);

      const startTime = parseISO(booking.start_time);
      const endTime = parseISO(booking.end_time);

      const dateStr = format(startTime, 'dd.MM.yyyy');
      const timeRange = `${format(startTime, 'HH:mm')}-${format(endTime, 'HH:mm')}`;
      const dateTime = `${dateStr} ${timeRange}`;

      const roomRaw = computer?.room || pkg?.room || 'Unknown';
      const room = capitalizeFirst(roomRaw);

      return {
        id: booking.id,
        dateTime: dateTime,
        computerNumber: `№${computer?.id || booking.computer_id}`,
        package: pkg?.name || 'Unknown Package',
        room: room,
        status: booking.status,
        price: pkg?.price ? `${pkg.price}₸` : '-',
        date: format(startTime, 'yyyy-MM-dd'),
      };
    });
  }, [bookings, computers, packages]);

  const filteredBookings = useMemo(() => {
    const selected = format(selectedDate, "yyyy-MM-dd");
    return transformedBookings.filter((b) => b.date === selected);
  }, [transformedBookings, selectedDate]);

  const theme = useMemo(
    () =>
      createTheme({
        typography: {
          fontFamily: "'Open Sans', sans-serif",
        },
        palette: {
          mode: isDarkTheme ? "dark" : "light",
          background: {
            default: isDarkTheme ? "rgb(46, 46, 48)" : "#ffffff",
            paper: isDarkTheme ? "rgb(62, 62, 63)" : "#fafafa",
          },
          primary: { main: "#5a8fc5" },
          error: {
            main: isDarkTheme ? "#a44a44" : "#c62828",
            light: isDarkTheme ? "#4f2121" : "#ffe6e6",
          },
          success: {
            main: isDarkTheme ? "#208f23" : "#2e7d32",
          },
          text: {
            primary: isDarkTheme ? "#e0e0e0" : "#333333",
            secondary: isDarkTheme ? "#9a9a9a" : "#555555",
          },
        },
      }),
    [isDarkTheme]
  );

  const getDisplayBookings = () => {
    return filteredBookings.map(({ date, ...rest }) => rest);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", p: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ mb: 3 }}>
            <DatePicker
              label="Select date"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              format="dd-MM-yyyy"
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "outlined"
                }
              }}
            />
          </Box>
        </LocalizationProvider>

        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
            My reservations
          </Typography>

          {/* Desktop table */}
          <Box sx={{ display: { xs: "none", md: "block" }, mb: 5 }}>
            {loading ? (
              <Typography>Loading reservations...</Typography>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : getDisplayBookings().length === 0 ? (
              <Typography>No reservations found.</Typography>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 1, backgroundColor: "background.paper", boxShadow: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Computer</TableCell>
                      <TableCell>Package</TableCell>
                      <TableCell>Room</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getDisplayBookings().map((booking, idx) => (
                      <TableRow key={booking.id || idx}>
                        <TableCell>{booking.id}</TableCell>
                        <TableCell>{booking.dateTime}</TableCell>
                        <TableCell>{booking.computerNumber}</TableCell>
                        <TableCell>{booking.package}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <FiberManualRecordIcon
                              color={getRoomColor(booking.room)}
                              sx={{ mr: 1, fontSize: 12 }}
                            />
                            {booking.room}
                          </Box>
                        </TableCell>
                        <TableCell>{booking.status}</TableCell>
                        <TableCell>{booking.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          {/* Mobile cards */}
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            {loading ? (
              <Typography>Loading reservations...</Typography>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : getDisplayBookings().length === 0 ? (
              <Typography>No reservations found.</Typography>
            ) : (
              getDisplayBookings().map((booking, idx) => (
                <Card key={booking.id || idx} sx={{ mb: 2, maxWidth: 360, mx: "auto", backgroundColor: "background.paper", boxShadow: 3, p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {booking.dateTime}
                    </Typography>
                    <IconButton size="small" sx={{ color: "text.secondary" }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="body2" gutterBottom>ID: {booking.id}</Typography>
                  <Typography variant="body2">Computer: {booking.computerNumber}</Typography>
                  <Typography variant="body2">Package: {booking.package}</Typography>
                  <Typography variant="body2">Room: {booking.room}</Typography>
                  <Typography variant="body2">Status: {booking.status}</Typography>
                  <Typography variant="body2">Price: {booking.price}</Typography>
                </Card>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Profile;
