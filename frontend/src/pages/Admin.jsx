import React, { useContext, useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CssBaseline
} from '@mui/material';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, parseISO } from "date-fns";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  AccountBalanceWallet,
  People,
  Computer,
  Schedule,
  Add,
  Settings
} from '@mui/icons-material';
import { ThemeContext } from '../context/ThemeContext';
import bookingService from '../services/bookingService';
import computerService from '../services/computerService';
import packageService from '../services/packageService';

const Admin = () => {
  const { isDarkTheme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState(0);
  const [balanceModal, setBalanceModal] = useState(false);
  const [userModal, setUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Data states
  const [users, setUsers] = useState([]);
  const [computers, setComputers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          primary: { 
            main: "rgb(33, 53, 88)",
            dark: "#215385"
          },
          text: {
            primary: isDarkTheme ? "#e0e0e0" : "#333333",
            secondary: isDarkTheme ? "#9a9a9a" : "#555555",
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              contained: {
                backgroundColor: "rgb(33, 53, 88)",
                '&:hover': {
                  backgroundColor: "#215385",
                },
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                color: isDarkTheme ? "#9a9a9a" : "#555555",
              },
            },
          },
        },
      }),
    [isDarkTheme]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookingsData, computersData, packagesData] = await Promise.all([
          bookingService.getBookings(),    
          computerService.getComputers(),   
          packageService.getPackages()      
        ]);

        setBookings(bookingsData);
        setComputers(computersData);
        setPackages(packagesData);

        const uniqueUserIds = [...new Set(bookingsData.map(booking => booking.user_id))];
        const mockUsers = uniqueUserIds.map(userId => ({
          id: userId,
          email: `user${userId}@example.com`,
          name: `User ${userId}`,
          balance: 0
        }));
        setUsers(mockUsers);

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
      const user = users.find(u => u.id === booking.user_id);

      const startTime = parseISO(booking.start_time);
      const endTime = parseISO(booking.end_time);

      const dateStr = format(startTime, 'dd.MM.yyyy');
      const timeRange = `${format(startTime, 'HH:mm')}-${format(endTime, 'HH:mm')}`;

      return {
        id: booking.id,
        user: user || { id: booking.user_id, email: `user${booking.user_id}@example.com`, name: `User ${booking.user_id}` },
        computer: computer || { id: booking.computer_id, name: `Computer ${booking.computer_id}` },
        package: pkg || { name: 'Unknown Package' },
        startTime: `${dateStr} ${timeRange}`,
        status: booking.status,
        date: format(startTime, 'yyyy-MM-dd'),
        timeLeft: booking.timeLeft || '—'
      };
    });
  }, [bookings, computers, packages, users]);

  const filteredBookings = useMemo(() => {
    const selected = format(selectedDate, "yyyy-MM-dd");
    return transformedBookings.filter((b) => b.date === selected);
  }, [transformedBookings, selectedDate]);

  const pendingBookings = useMemo(() => 
    filteredBookings.filter(b => b.status === 'pending'), [filteredBookings]);

  const activeSessions = useMemo(() => 
    filteredBookings.filter(b => b.status === 'active'), [filteredBookings]);

  const handleTopUpBalance = () => {
    if (selectedUser && balanceAmount) {
      setSnackbar({
        open: true,
        message: `Successfully added $${balanceAmount} to ${selectedUser}`,
        severity: 'success'
      });
      setBalanceModal(false);
      setSelectedUser('');
      setBalanceAmount('');
    }
  };

  const handleApproveBooking = (bookingId) => {
    setSnackbar({ open: true, message: 'Booking approved successfully', severity: 'success' });
  };

  const handleRejectBooking = (bookingId) => {
    setSnackbar({ open: true, message: 'Booking rejected', severity: 'info' });
  };

  const handleEndSession = (sessionId) => {
    setSnackbar({ open: true, message: 'Session ended successfully', severity: 'success' });
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
      border: `1px solid ${isDarkTheme ? '#444' : '#ddd'}`,
      fontFamily: theme.typography.fontFamily
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold">{value}</Typography>
            <Typography variant="body2" color={theme.palette.text.secondary}>{title}</Typography>
          </Box>
          <Box sx={{ color: color, fontSize: 40 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, color: theme.palette.text.primary, p: 3 }}>
          <Typography>Loading admin data...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, color: theme.palette.text.primary, p: 3 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        background: theme.palette.background.default,
        color: theme.palette.text.primary,
        p: 3,
        fontFamily: theme.typography.fontFamily
      }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontFamily={theme.typography.fontFamily} fontWeight="bold">
            Admin Dashboard
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              variant="contained"
              startIcon={<AccountBalanceWallet />}
              onClick={() => setBalanceModal(true)}
            >
              Top Up Balance
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setUserModal(true)}
            >
              Add User
            </Button>
          </Box>
        </Box>

        {/* Date Picker */}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ mb: 3, maxWidth: 300 }}>
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

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Users" value={users.length} icon={<People />} color="#4CAF50" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Active Sessions" value={activeSessions.length} icon={<Schedule />} color="#2196F3" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Computers" value={computers.length} icon={<Computer />} color="#FF9800" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Pending Bookings" value={pendingBookings.length} icon={<Settings />} color="#F44336" />
          </Grid>
        </Grid>

        {/* Tables */}
        <Paper sx={{ 
          background: theme.palette.background.paper, 
          border: `1px solid ${isDarkTheme ? '#444' : '#ddd'}`,
          borderRadius: 1,
          boxShadow: 1
        }}>
          <Tabs value={activeTab} onChange={(e, newVal) => setActiveTab(newVal)}>
            <Tab label="Pending Bookings" />
            <Tab label="Active Sessions" />
          </Tabs>

          {activeTab === 0 && (
            <Box p={3}>
              <Typography variant="h6" mb={2}>Pending Bookings</Typography>
              {pendingBookings.length === 0 ? (
                <Typography color={theme.palette.text.secondary}>No pending bookings for selected date.</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Computer</TableCell>
                        <TableCell>Package</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>{booking.id}</TableCell>
                          <TableCell>{booking.user?.email || `User ${booking.user?.id}`}</TableCell>
                          <TableCell>№{booking.computer.id}</TableCell>
                          <TableCell>{booking.package.name}</TableCell>
                          <TableCell>{booking.startTime}</TableCell>
                          <TableCell>
                            <Chip label={booking.status} color="warning" size="small" />
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success" 
                              onClick={() => handleApproveBooking(booking.id)} 
                              sx={{ mr: 1 }}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error" 
                              onClick={() => handleRejectBooking(booking.id)}
                            >
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box p={3}>
              <Typography variant="h6" mb={2}>Active Sessions</Typography>
              {activeSessions.length === 0 ? (
                <Typography color={theme.palette.text.secondary}>No active sessions for selected date.</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Computer</TableCell>
                        <TableCell>Package</TableCell>
                        <TableCell>Time Left</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.id}</TableCell>
                          <TableCell>{session.user?.email || `User ${session.user?.id}`}</TableCell>
                          <TableCell>№{session.computer.id}</TableCell>
                          <TableCell>{session.package.name}</TableCell>
                          <TableCell>{session.timeLeft}</TableCell>
                          <TableCell>
                            <Chip label={session.status} color="success" size="small" />
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error" 
                              onClick={() => handleEndSession(session.id)}
                            >
                              End Session
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Paper>

        {/* Modals */}
        <Dialog open={balanceModal} onClose={() => setBalanceModal(false)}>
          <DialogTitle>Top Up User Balance</DialogTitle>
          <DialogContent>
            <TextField
              select
              label="User"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              fullWidth
              SelectProps={{ native: true }}
              margin="normal"
            >
              <option value="">Select user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.name} ({user.email}) - ${user.balance}
                </option>
              ))}
            </TextField>
            <TextField
              label="Amount ($)"
              type="number"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBalanceModal(false)}>Cancel</Button>
            <Button 
              onClick={handleTopUpBalance} 
              variant="contained" 
              disabled={!selectedUser || !balanceAmount}
            >
              Top Up
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={userModal} onClose={() => setUserModal(false)}>
          <DialogTitle>Add User</DialogTitle>
          <DialogContent>
            <TextField label="Full Name" fullWidth margin="normal" />
            <TextField label="Email" fullWidth margin="normal" />
            <TextField label="Initial Balance" type="number" fullWidth margin="normal" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserModal(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                setSnackbar({ open: true, message: 'User added successfully', severity: 'success' });
                setUserModal(false);
              }}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default Admin;