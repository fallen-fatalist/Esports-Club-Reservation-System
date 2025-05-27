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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, parseISO } from "date-fns";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import LockIcon from "@mui/icons-material/Lock";
import SettingsIcon from "@mui/icons-material/Settings";

import { ThemeContext } from "../context/ThemeContext";
import bookingService from "../services/bookingService";
import computerService from "../services/computerService";
import packageService from "../services/packageService";
import { checkAuth, requestPasswordReset, confirmPasswordReset } from "../services/authService";

const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

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

const Profile = ({ onLogout }) => {
  const { isDarkTheme } = useContext(ThemeContext);
  const [bookings, setBookings] = useState([]);
  const [computers, setComputers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Password reset modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleCancelBooking = (bookingId) => {
    // TODO: Implement cancel booking functionality
    console.log('Cancel booking:', bookingId);
  };

  // Password reset functions
  const resetPasswordModalState = () => {
    setResetStep(1);
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setUserEmail('');
  };

  const handleOpenPasswordModal = async () => {
    setIsPasswordModalOpen(true);
    setPasswordLoading(true);
    setPasswordError('');

    try {
      const response = await checkAuth();
      setUserEmail(response.data.email || '');
    } catch (err) {
      setPasswordError('Failed to get user information');
      console.error('Auth check error:', err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    resetPasswordModalState();
  };

  const handleRequestPasswordReset = async () => {
    if (!userEmail) {
      setPasswordError('Email is required');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    try {
      await requestPasswordReset(userEmail);
      setResetStep(2);
      setPasswordSuccess('Password reset code sent to your email');
    } catch (err) {
      if (err.response?.status === 429) {
        setPasswordError('Too many requests. Please wait 24 hours before trying again.');
      } else if (err.response?.status === 400) {
        setPasswordError('Invalid email address');
      } else {
        setPasswordError('Failed to send reset code. Please try again.');
      }
      console.error('Password reset request error:', err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleConfirmPasswordReset = async () => {
    setPasswordError('');

    if (!resetCode.trim()) {
      setPasswordError('Verification code is required');
      return;
    }

    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    setPasswordLoading(true);

    try {
      await confirmPasswordReset({
        code: resetCode.trim(),
        email: userEmail,
        new_password: newPassword
      });

      setPasswordSuccess('Password changed successfully! You will be logged out.');
      
      setTimeout(async () => {
        try {
          await checkAuth();
          setPasswordError('Session should have been terminated. Please log out manually.');
        } catch (authError) {
          handleClosePasswordModal();
          if (onLogout) {
            onLogout();
          } else {
            window.location.href = '/login';
          }
        }
      }, 2000);

    } catch (err) {
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || '';
        if (errorMessage.includes('code')) {
          setPasswordError('Invalid or expired verification code');
        } else if (errorMessage.includes('password')) {
          setPasswordError('Password does not meet requirements');
        } else {
          setPasswordError('Invalid request. Please check your inputs.');
        }
      } else if (err.response?.status === 429) {
        setPasswordError('Too many attempts. Please wait before trying again.');
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
      console.error('Password reset confirm error:', err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRetryPasswordRequest = () => {
    setResetStep(1);
    setPasswordError('');
    setPasswordSuccess('');
  };

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
          {/* Settings Panel */}
          <Card sx={{ mb: 4, p: 3, backgroundColor: "background.paper", boxShadow: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
              <SettingsIcon sx={{ mr: 1 }} />
              Account Settings
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Change your account password
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={handleOpenPasswordModal}
              >
                Change Password
              </Button>
            </Box>
          </Card>

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
                      <TableCell>Actions</TableCell>
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
                        <TableCell>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleCancelBooking(booking.id)}
                            sx={{ minWidth: 100 }}
                          >
                            Cancel
                          </Button>
                        </TableCell>
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
                  <Typography variant="body2" sx={{ mb: 2 }}>Price: {booking.price}</Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    fullWidth
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    Cancel Booking
                  </Button>
                </Card>
              ))
            )}
          </Box>
        </Box>

        {/* Password Reset Modal */}
        <Dialog 
          open={isPasswordModalOpen} 
          onClose={handleClosePasswordModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { backgroundColor: "background.paper" }
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Change Password</Typography>
            <IconButton onClick={handleClosePasswordModal} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}

            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {passwordSuccess}
              </Alert>
            )}

            {resetStep === 1 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  We'll send a verification code to your email address to confirm the password change.
                </Typography>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  disabled={passwordLoading}
                  variant="outlined"
                />
              </Box>
            )}

            {resetStep === 2 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  A verification code has been sent to <strong>{userEmail}</strong>. 
                  Please enter the code and your new password below.
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Verification Code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    disabled={passwordLoading}
                    placeholder="Enter 6-digit code"
                  />

                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={passwordLoading}
                    helperText="Password must be at least 8 characters with uppercase, lowercase, number and special character"
                  />

                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Button
                  variant="text"
                  size="small"
                  onClick={handleRetryPasswordRequest}
                  disabled={passwordLoading}
                >
                  Didn't receive the code? Request new one
                </Button>
              </Box>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClosePasswordModal} disabled={passwordLoading}>
              Cancel
            </Button>
            
            {resetStep === 1 && (
              <Button
                onClick={handleRequestPasswordReset}
                variant="contained"
                disabled={passwordLoading || !userEmail}
                startIcon={passwordLoading && <CircularProgress size={16} />}
              >
                Send Code
              </Button>
            )}

            {resetStep === 2 && (
              <Button
                onClick={handleConfirmPasswordReset}
                variant="contained"
                disabled={passwordLoading || !resetCode || !newPassword || !confirmPassword}
                startIcon={passwordLoading && <CircularProgress size={16} />}
              >
                Confirm
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default Profile;