import React, { useMemo, useContext, useState } from "react";
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
import { format } from "date-fns";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import { ThemeContext } from "../context/ThemeContext";
import useBookings from "../hooks/useBookings";

const getZoneColor = (zone) => {
  switch (zone?.toLowerCase()) {
    case "game pro":
      return "error";
    case "vip zone":
      return "warning";
    case "standard":
      return "primary";
    default:
      return "default";
  }
};

const Profile = () => {
  const { isDarkTheme } = useContext(ThemeContext);
  const { transformedBookings, loading, error } = useBookings();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const filteredBookings = useMemo(() => {
  const selected = format(selectedDate, "yyyy-MM-dd");
  return transformedBookings.filter((b) => b.date === selected);
}, [transformedBookings, selectedDate]);
  const theme = useMemo(
    () =>
      createTheme({
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
            ) : filteredBookings.length === 0 ? (
              <Typography>No reservations found.</Typography>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: 1,
                  backgroundColor: "background.paper",
                  boxShadow: 1,
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      {Object.keys(filteredBookings[0]).map((key) => (
                        <TableCell key={key} sx={{ textTransform: "capitalize" }}>
                          {key.replace(/([A-Z])/g, " $1")}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBookings.map((booking, idx) => (
                      <TableRow key={idx}>
                        {Object.entries(booking).map(([key, value]) => (
                          <TableCell key={key}>
                            {key === "zone" ? (
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <FiberManualRecordIcon
                                  color={getZoneColor(value)}
                                  sx={{ mr: 1, fontSize: 12 }}
                                />
                                {value}
                              </Box>
                            ) : (
                              value || "-"
                            )}
                          </TableCell>
                        ))}
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
            ) : filteredBookings.length === 0 ? (
              <Typography>No reservations found.</Typography>
            ) : (
              filteredBookings.map((booking, idx) => (
                <Card
                  key={idx}
                  sx={{
                    mb: 2,
                    maxWidth: 360,
                    mx: "auto",
                    backgroundColor: "background.paper",
                    boxShadow: 3,
                    p: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {booking.date} at {booking.time}
                    </Typography>
                    <IconButton size="small" sx={{ color: "text.secondary" }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="body2" gutterBottom>
                    Code: {booking.reservationCode || "-"}
                  </Typography>
                  <Typography variant="body2">Duration: {booking.duration}</Typography>
                  <Typography variant="body2">Zone: {booking.zone}</Typography>
                  <Typography variant="body2">Status: {booking.status}</Typography>
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
