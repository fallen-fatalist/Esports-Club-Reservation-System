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
  InputAdornment,
  Snackbar
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ComputerIcon from "@mui/icons-material/Computer";
import PackageIcon from "@mui/icons-material/Inventory";
import StatusIcon from "@mui/icons-material/FiberManualRecord";
import PriceIcon from "@mui/icons-material/AttachMoney";
import CancelIcon from "@mui/icons-material/Cancel";
import InfoIcon from "@mui/icons-material/Info";
import VerifiedIcon from "@mui/icons-material/Verified";
import ShieldIcon from "@mui/icons-material/Shield";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, parseISO } from "date-fns";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import LockIcon from "@mui/icons-material/Lock";
import SettingsIcon from "@mui/icons-material/Settings";
import { AuthContext } from '../context/contextIndex';
import { api } from '../services/authService';
import usersService from '../services/usersService';
import { ThemeContext } from "../context/ThemeContext";
import bookingService from "../services/bookingService";
import computerService from "../services/computerService";
import packageService from "../services/packageService";
import paymentService from "../services/paymentService"; 
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

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [userBalance, setUserBalance] = useState(0); 
  const { userRole } = useContext(AuthContext);

  const [paymentStatus, setPaymentStatus] = useState(null); // 'pending', 'success', 'failed'
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelBookingModal, setCancelBookingModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const [userInfo, setUserInfo] = useState({
    email: '',
    name: '',
    role: userRole || 'client',
    registrationDate: null
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        const authResponse = await checkAuth();
        const userData = authResponse.data || {};

        setUserInfo({
          email: userData.email || '',
          name: userData.name || userData.login || userData.username || 'User',
          role: userRole || userData.role || 'client',
          registrationDate: userData.created_at ? new Date(userData.created_at) : null
        });
        
        setUserBalance(userData.balance || 0);

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
        setSnackbar({
          open: true,
          message: 'Failed to load user data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const EXCHANGE_RATE_KZT_TO_USD = 0.0021;
  const EXCHANGE_RATE_USD_TO_KZT = 476;

  const convertToUSD = (amountInKZT) => {
    return (amountInKZT * EXCHANGE_RATE_KZT_TO_USD).toFixed(2);
  };

  const convertToKZT = (amountInUSD) => {
    return Math.round(amountInUSD * EXCHANGE_RATE_USD_TO_KZT);
  };

  const formatBalance = (balance) => {
    const usdAmount = convertToUSD(balance);
    return `${balance}₸ ($${usdAmount})`;
  };

  const refreshUserBalance = async () => {
    try {
      const authResponse = await checkAuth();
      const userData = authResponse.data || {};
      setUserBalance(userData.balance || 0);
      return userData.balance || 0;
    } catch (error) {
      console.error('Error refreshing balance:', error);
      return null;
    }
  };

  const handleDeposit = async () => {
    const amountUSD = Number(depositAmount);

    if (!amountUSD || amountUSD < 1) {
      setSnackbar({
        open: true,
        message: 'Minimum deposit is $1',
        severity: 'error'
      });
      return;
    }

    try {
      setDepositLoading(true);
      const amountKZT = convertToKZT(amountUSD);
      const data = await paymentService.createDeposit(amountKZT);

      if (!data?.Location) {
        throw new Error('Payment link not received');
      }

      const paymentWindow = window.open(data.Location, '_blank');
      setDepositModalOpen(false);
      setDepositAmount('');

      setSnackbar({
        open: true,
        message: 'Complete the payment in PayPal. Click "Refresh Balance" button when done.',
        severity: 'info',
        autoHideDuration: 15000,
      });

      const checkPaymentStatus = setInterval(async () => {
        if (paymentWindow?.closed) {
          clearInterval(checkPaymentStatus);
          setTimeout(async () => {
            const newBalance = await refreshUserBalance();
            if (newBalance !== null && newBalance > userBalance) {
              setSnackbar({
                open: true,
                message: `Payment successful! Balance updated: ${formatBalance(newBalance)}`,
                severity: 'success'
              });
            }
          }, 2000);
        }
      }, 2000);

      setTimeout(() => clearInterval(checkPaymentStatus), 300000);

    } catch (err) {
      console.error('Deposit error:', err);
      setSnackbar({
        open: true,
        message: `Error: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setDepositLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    setLoading(true);
    const newBalance = await refreshUserBalance();
    setLoading(false);

    if (newBalance !== null) {
      setSnackbar({
        open: true,
        message: `Balance refreshed: ${formatBalance(newBalance)}`,
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Failed to refresh balance',
        severity: 'error'
      });
    }
  };

  const handleCancelBooking = (bookingId) => {
    const bookingToCancel = transformedBookings.find(b => b.id === bookingId);
    if (!bookingToCancel) return;

    setSelectedBookingForCancel(bookingToCancel);
    setCancelBookingModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!selectedBookingForCancel) return;

    try {
      setLoading(true);

      const result = await paymentService.cancelBooking(selectedBookingForCancel.id);
      
      console.log('Cancel booking result:', result);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedBookings = await bookingService.getUserBookings();
      setBookings(updatedBookings);

      setSnackbar({
        open: true,
        message: `Booking #${selectedBookingForCancel.id} cancelled successfully`,
        severity: 'success'
      });

      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('Cancel booking error:', error);
      setSnackbar({
        open: true,
        message: `Failed to cancel booking: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setCancelBookingModal(false);
      setSelectedBookingForCancel(null);
    }
  };

  const transformedBookings = useMemo(() => {
    if (!bookings.length || !computers.length || !packages.length) return [];

    return bookings
      .filter(b => b.status !== 'cancelled')
      .map(b => {
        const computer = computers.find(c => c.id === b.computer_id);
        const pkg = packages.find(p => p.id === b.package_id);

        const start = parseISO(b.start_time);
        const end = parseISO(b.end_time);

        return {
          id: b.id,
          dateTime: `${format(start, 'dd.MM.yyyy')} ${format(start, 'HH:mm')}-${format(end, 'HH:mm')}`,
          computerNumber: `№${computer?.id || b.computer_id}`,
          package: pkg?.name || 'Unknown Package',
          room: capitalizeFirst(computer?.room || pkg?.room || 'Unknown'),
          status: b.status,
          price: pkg?.price ? `${pkg.price}₸` : '-',
          date: format(start, 'yyyy-MM-dd'),
        };
      });
  }, [bookings, computers, packages]);


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
          {/* User Profile Section */}
          <Card sx={{ mb: 4, p: 3, backgroundColor: "background.paper", boxShadow: 1 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1 }} />
              Profile Information
            </Typography>
            
            {/* User Info Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
              {/* Personal Info */}
              <Card sx={{ p: 2, backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                  <InfoIcon sx={{ mr: 1, fontSize: 20 }} />
                  Personal Details
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 2, color: 'text.secondary', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{userInfo.email}</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ mr: 2, color: 'text.secondary', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{userInfo.name}</Typography>
                  </Box>
                </Box>
                
                {userInfo.registrationDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon sx={{ mr: 2, color: 'text.secondary', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Member Since</Typography>
                      <Typography variant="body1">
                        {format(userInfo.registrationDate, 'dd MMM yyyy')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Card>

              {/* Account Status */}
              <Card sx={{ p: 2, backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                  <VerifiedIcon sx={{ mr: 1, fontSize: 20 }} />
                  Account Status
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountBalanceWalletIcon sx={{ mr: 2, color: 'success.main', fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Balance</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatBalance(userBalance)}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={handleRefreshBalance}
                    disabled={loading}
                    title="Refresh balance"
                    sx={{ ml: 1 }}
                  >
                    {loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {userInfo.role === 'owner' ? (
                    <>
                      <AdminPanelSettingsIcon sx={{ mr: 2, color: 'error.main', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Role</Typography>
                        <Typography variant="body1" sx={{ color: 'error.main', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                          <ShieldIcon sx={{ mr: 0.5, fontSize: 16 }} />
                          Owner
                        </Typography>
                      </Box>
                    </>
                  ) : userInfo.role === 'admin' || userInfo.role === 'privileged' ? (
                    <>
                      <AdminPanelSettingsIcon sx={{ mr: 2, color: 'warning.main', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Role</Typography>
                        <Typography variant="body1" sx={{ color: 'warning.main', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                          <ShieldIcon sx={{ mr: 0.5, fontSize: 16 }} />
                          Administrator
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <PersonIcon sx={{ mr: 2, color: 'primary.main', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Role</Typography>
                        <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>
                          Client
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Card>
            </Box>
          </Card>

          {/* Account Actions Section */}
          <Card sx={{ mb: 4, p: 3, backgroundColor: "background.paper", boxShadow: 1 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
              <SettingsIcon sx={{ mr: 1 }} />
              Account Actions
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AccountBalanceWalletIcon />}
                onClick={() => setDepositModalOpen(true)}
                sx={{ p: 2, justifyContent: 'flex-start' }}
              >
                <Box sx={{ textAlign: 'left', flexGrow: 1 }}>
                  <Typography variant="button" sx={{ display: 'block' }}>Add Funds</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Current: {formatBalance(userBalance)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefreshBalance();
                  }}
                  disabled={loading}
                  sx={{ ml: 1, color: 'inherit' }}
                >
                  {loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                </IconButton>
              </Button>
              
              <Button
                variant="contained"
                size="large"
                startIcon={<LockIcon />}
                onClick={handleOpenPasswordModal}
                sx={{ p: 2, justifyContent: 'flex-start' }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="button" sx={{ display: 'block' }}>Change Password</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Update security
                  </Typography>
                </Box>
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
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <InfoIcon sx={{ mr: 1, fontSize: 16 }} />
                          ID
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ mr: 1, fontSize: 16 }} />
                          Date & Time
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ComputerIcon sx={{ mr: 1, fontSize: 16 }} />
                          Computer
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PackageIcon sx={{ mr: 1, fontSize: 16 }} />
                          Package
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StatusIcon sx={{ mr: 1, fontSize: 16 }} />
                          Room
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <VerifiedIcon sx={{ mr: 1, fontSize: 16 }} />
                          Status
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PriceIcon sx={{ mr: 1, fontSize: 16 }} />
                          Price
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CancelIcon sx={{ mr: 1, fontSize: 16 }} />
                          Actions
                        </Box>
                      </TableCell>
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
                            variant="contained"
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
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight={600}>
                        {booking.dateTime}
                      </Typography>
                    </Box>
                    <IconButton size="small" sx={{ color: "text.secondary" }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <InfoIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">ID: {booking.id}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ComputerIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">Computer: {booking.computerNumber}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PackageIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">Package: {booking.package}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FiberManualRecordIcon
                      color={getRoomColor(booking.room)}
                      sx={{ mr: 1, fontSize: 12 }}
                    />
                    <Typography variant="body2">Room: {booking.room}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <VerifiedIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">Status: {booking.status}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PriceIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">Price: {booking.price}</Typography>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    fullWidth
                    startIcon={<CancelIcon />}
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
        <Dialog
          open={cancelBookingModal}
          onClose={() => setCancelBookingModal(false)}
        >
          <DialogTitle>Confirm Cancellation</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel booking #{selectedBookingForCancel?.id}?
            </Typography>
            {selectedBookingForCancel && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedBookingForCancel.dateTime} - {selectedBookingForCancel.computerNumber}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelBookingModal(false)}>No, Keep It</Button>
            <Button 
              onClick={confirmCancelBooking} 
              color="error"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Yes, Cancel
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={depositModalOpen}
          onClose={() => {
            setDepositModalOpen(false);
            setDepositError('');
            setDepositAmount('');
          }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Add Funds to Account</DialogTitle>
          <DialogContent>
            {depositError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {depositError}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Amount (USD)"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { 
                  min: 1,
                  step: 1
                }
              }}
              sx={{ mt: 1 }}
              disabled={depositLoading}
            />
            
            {depositAmount && Number(depositAmount) > 0 && (
              <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                ≈ {convertToKZT(Number(depositAmount))}₸ KZT
              </Typography>
            )}
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Minimum deposit amount: $1 (≈476₸)
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setDepositModalOpen(false);
                setDepositError('');
                setDepositAmount('');
              }}
              disabled={depositLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeposit}
              variant="contained"
              disabled={depositLoading || !depositAmount}
              startIcon={depositLoading && <CircularProgress size={16} />}
            >
              Proceed to Payment
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({...snackbar, open: false})}
        >
          <Alert 
            onClose={() => setSnackbar({...snackbar, open: false})}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default Profile;