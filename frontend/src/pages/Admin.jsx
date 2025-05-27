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
  CssBaseline,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  Settings,
  Block,
  Delete,
  Cancel,
  PersonAdd,
  MoneyOff
} from '@mui/icons-material';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/contextIndex';
import bookingService from '../services/bookingService';
import computerService from '../services/computerService';
import packageService from '../services/packageService';
import usersService from '../services/usersService';
import { checkAuth, checkIsPriveleged } from '../services/authService';

const Admin = () => {
  const { isDarkTheme } = useContext(ThemeContext);
  const { handleAuthError, showModal } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(0);
  const [balanceModal, setBalanceModal] = useState(false);
  const [deleteUserModal, setDeleteUserModal] = useState(false);
  const [cancelBookingModal, setCancelBookingModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceOperation, setBalanceOperation] = useState('add');
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [users, setUsers] = useState([]);
  const [computers, setComputers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPrivileged, setIsPrivileged] = useState(false);

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

  const checkAdminPrivileges = async () => {
    try {
      const response = await checkIsPriveleged();
      setIsPrivileged(response.status === 200);
      return response.status === 200;
    } catch (error) {
      console.error('Error checking admin privileges:', error);
      if (error.response?.status === 401) {
        handleAuthError('Admin access required');
      } else if (error.response?.status === 403) {
        setSnackbar({
          open: true,
          message: 'Access denied. Admin privileges required.',
          severity: 'error'
        });
      }
      setIsPrivileged(false);
      return false;
    }
  };

  const fetchAllUsers = async () => {
    try {
      const userData = await usersService.getUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.message === 'Insufficient privileges') {
        setSnackbar({
          open: true,
          message: 'Insufficient privileges to view users',
          severity: 'error'
        });
      } else {
        setError('Failed to load users data');
      }
    }
  };

  // Функция для обновления данных пользователя после операций с балансом
  const refreshUserData = async (userId) => {
    try {
      const updatedUsers = await usersService.getUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First check if user has admin privileges
        const hasPrivileges = await checkAdminPrivileges();
        if (!hasPrivileges) {
          setError('Admin access required');
          return;
        }

        const [bookingsData, computersData, packagesData] = await Promise.all([
          bookingService.getBookings(),    
          computerService.getComputers(),   
          packageService.getPackages(),
          fetchAllUsers()
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

  const blockedUsers = useMemo(() => 
    users.filter(user => user.status === 'blocked'), [users]);

  const handleBlockUser = async (userId) => {
    try {
      const success = await usersService.blockUserByID(userId);
      if (success) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: 'blocked' } : user
        ));
        setSnackbar({
          open: true,
          message: `User blocked successfully`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to block user',
        severity: 'error'
      });
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const success = await usersService.unblockUserByID(userId);
      if (success) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: 'active' } : user
        ));
        setSnackbar({
          open: true,
          message: `User unblocked successfully`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to unblock user',
        severity: 'error'
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return;
    try {
      const success = await usersService.deleteUserByID(selectedUserForDelete.id);
      if (success) {
        setUsers(users.filter(user => user.id !== selectedUserForDelete.id));
        setSnackbar({
          open: true,
          message: `User ${selectedUserForDelete.username} deleted successfully`,
          severity: 'success'
        });
        setDeleteUserModal(false);
        setSelectedUserForDelete(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete user',
        severity: 'error'
      });
    }
  };

  const handleBalanceOperation = async () => {
    if (!selectedUser || !balanceAmount) return;
    try {
      const amount = parseFloat(balanceAmount);
      const user = users.find(u => u.id === parseInt(selectedUser));
      if (!user) return;

      // Для вычитания передаем отрицательную сумму
      const finalAmount = balanceOperation === 'add' ? amount : -amount;
      
      const success = await usersService.creditUserByID(user.id, finalAmount);
      if (success) {
        // Обновляем данные пользователей с сервера вместо клиентского расчета
        await refreshUserData(user.id);
        
        setSnackbar({
          open: true,
          message: `Successfully ${balanceOperation === 'add' ? 'added' : 'deducted'} $${amount} ${balanceOperation === 'add' ? 'to' : 'from'} ${user.username}`,
          severity: 'success'
        });

        setBalanceModal(false);
        setSelectedUser('');
        setBalanceAmount('');
        setBalanceOperation('add');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update balance',
        severity: 'error'
      });
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingForCancel) return;
    try {
      const status = await bookingService.cancelBookingByID(selectedBookingForCancel.id);
      if (status === 200) {
        setBookings(bookings.map(booking => 
          booking.id === selectedBookingForCancel.id 
            ? { ...booking, status: 'cancelled' }
            : booking
        ));
        setSnackbar({
          open: true,
          message: `Booking #${selectedBookingForCancel.id} cancelled successfully`,
          severity: 'success'
        });
        setCancelBookingModal(false);
        setSelectedBookingForCancel(null);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to cancel booking',
        severity: 'error'
      });
    }
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
          {error === 'Admin access required' && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              You don't have permission to access this page. Please contact an administrator.
            </Typography>
          )}
        </Box>
      </ThemeProvider>
    );
  }

  if (!isPrivileged) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, color: theme.palette.text.primary, p: 3 }}>
          <Typography color="error">Access Denied</Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            You don't have administrator privileges to access this page.
          </Typography>
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
              Manage Balance
            </Button>
          </Box>
        </Box>

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
          <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Blocked Users" value={blockedUsers.length} icon={<Block />} color="#F44336" />
          </Grid> 
        </Grid>

        <Paper sx={{ 
          background: theme.palette.background.paper, 
          border: `1px solid ${isDarkTheme ? '#444' : '#ddd'}`,
          borderRadius: 1,
          boxShadow: 1,
          mb: 3
        }}>
          <Tabs value={activeTab} onChange={(e, newVal) => setActiveTab(newVal)}>
            <Tab label="Pending Bookings" />
            <Tab label="Active Sessions" />
            <Tab label="Users Management" />
            <Tab label="Blocked Users" />
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
                            <Chip label={booking.status} color="warning" />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => {
                                setSelectedBookingForCancel(booking);
                                setCancelBookingModal(true);
                              }}
                              title="Cancel Booking"
                            >
                              <Cancel />
                            </IconButton>
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
                        <TableCell>Time</TableCell>
                        <TableCell>Time Left</TableCell>
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
                          <TableCell>{session.startTime}</TableCell>
                          <TableCell>{session.timeLeft}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => {
                                setSelectedBookingForCancel(session);
                                setCancelBookingModal(true);
                              }}
                              title="Cancel Session"
                            >
                              <Cancel />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Box p={3}>
              <Typography variant="h6" mb={2}>Users Management</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Balance</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>${user.balance}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            color={user.role === 'admin' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.status} 
                            color={user.status === 'active' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            {user.status === 'active' ? (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleBlockUser(user.id)}
                                title="Block User"
                              >
                                <Block />
                              </IconButton>
                            ) : (
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleUnblockUser(user.id)}
                                title="Unblock User"
                              >
                                <PersonAdd />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedUser(user.id.toString());
                                setBalanceModal(true);
                              }}
                              title="Manage Balance"
                            >
                              <AccountBalanceWallet />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedUserForDelete(user);
                                setDeleteUserModal(true);
                              }}
                              title="Delete User"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {activeTab === 3 && (
            <Box p={3}>
              <Typography variant="h6" mb={2}>Blocked Users</Typography>
              {blockedUsers.length === 0 ? (
                <Typography color={theme.palette.text.secondary}>No blocked users.</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {blockedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>${user.balance}</TableCell>
                          <TableCell>
                            <Chip 
                              label={user.role} 
                              color={user.role === 'admin' ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.status} 
                              color="error"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleUnblockUser(user.id)}
                                title="Unblock User"
                              >
                                <PersonAdd />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setSelectedUser(user.id.toString());
                                  setBalanceModal(true);
                                }}
                                title="Manage Balance"
                              >
                                <AccountBalanceWallet />
                              </IconButton>
                            </Box>
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

        <Dialog open={balanceModal} onClose={() => setBalanceModal(false)} fullWidth maxWidth="sm">
          <DialogTitle>Manage User Balance</DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="dense">
              <InputLabel>Select User</InputLabel>
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                label="Select User"
              >
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id.toString()}>
                    {user.username} ({user.email}) - Current: ${user.balance}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="dense">
              <InputLabel>Operation</InputLabel>
              <Select
                value={balanceOperation}
                onChange={(e) => setBalanceOperation(e.target.value)}
                label="Operation"
              >
                <MenuItem value="add">Add to Balance</MenuItem>
                <MenuItem value="subtract">Subtract from Balance</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              type="number"
              label="Amount"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              margin="dense"
              inputProps={{ min: 0, step: 0.01 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setBalanceModal(false);
              setSelectedUser('');
              setBalanceAmount('');
              setBalanceOperation('add');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleBalanceOperation} 
              variant="contained" 
              disabled={!selectedUser || !balanceAmount}
              startIcon={balanceOperation === 'add' ? <Add /> : <MoneyOff />}
            >
              {balanceOperation === 'add' ? 'Add Money' : 'Subtract Money'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteUserModal} onClose={() => setDeleteUserModal(false)} maxWidth="sm">
          <DialogTitle>Confirm User Deletion</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete user <strong>{selectedUserForDelete?.username}</strong>?
            </Typography>
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setDeleteUserModal(false);
              setSelectedUserForDelete(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteUser} 
              variant="contained" 
              color="error"
              startIcon={<Delete />}
            >
              Delete User
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={cancelBookingModal} onClose={() => setCancelBookingModal(false)} maxWidth="sm">
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel booking <strong>#{selectedBookingForCancel?.id}</strong>?
            </Typography>
            {selectedBookingForCancel && (
              <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>User:</strong> {selectedBookingForCancel.user?.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Computer:</strong> №{selectedBookingForCancel.computer?.id}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong> {selectedBookingForCancel.startTime}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setCancelBookingModal(false);
              setSelectedBookingForCancel(null);
            }}>
              Keep Booking
            </Button>
            <Button 
              onClick={handleCancelBooking} 
              variant="contained" 
              color="warning"
              startIcon={<Cancel />}
            >
              Cancel Booking
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default Admin;