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
import { Tooltip } from '@mui/material';
import { format, parseISO } from "date-fns";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Refresh } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
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
  MoneyOff,
  AdminPanelSettings,
  Security
} from '@mui/icons-material';
import { ThemeContext } from '../context/ThemeContext';
import bookingService from '../services/bookingService';
import computerService from '../services/computerService';
import packageService from '../services/packageService';
import usersService from '../services/usersService';
import { checkAuth } from '../services/authService';
import paymentService from "../services/paymentService"; 
import { AuthContext } from "../context/contextIndex";

const Admin = () => {
  const { isDarkTheme } = useContext(ThemeContext);
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
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionFilter, setSessionFilter] = useState('all');
  const [roleModal, setRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRole, setNewRole] = useState('');
  const { isAuth, userRole: currentUserRole, handleAuthError } = useContext(AuthContext);
  const [apiLoading, setApiLoading] = useState(false);
  const [bookingsCache, setBookingsCache] = useState({
    all: null,
    active: null,
    pending: null,
    cancelled: null,
    finished: null
  });

  const showModal = (title, message) => {
    setModalContent({ title, message });
    setModalVisible(true);
  };

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
            main: "#3872ff",
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

  const fetchAllUsers = async () => {
    try {
      const usersData = await usersService.getUsers();
      setUsers(
        usersData.map(user => ({
          ...user,
          name: user.name || user.login || 'User'
        }))
      );
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users data');
    }
  };

  const fetchBookingsByFilter = async (filter) => {
    if (bookingsCache[filter] && filter !== 'all') {
      return bookingsCache[filter];
    }

    try {
      setApiLoading(true);
      let bookingsData;
      
      switch (filter) {
        case 'active':
          bookingsData = await bookingService.getActiveBookings();
          break;
        case 'pending':
          bookingsData = await bookingService.getPendingBookings();
          break;
        case 'cancelled':
          bookingsData = await bookingService.getCancelledBookings();
          break;
        case 'completed':
          bookingsData = await bookingService.getFinishedBookings();
          break;
        case 'all':
        default:
          bookingsData = await bookingService.getBookings();
          break;
      }

      setBookingsCache(prev => ({
        ...prev,
        [filter]: bookingsData
      }));

      return bookingsData;
    } catch (error) {
      console.error(`Error fetching ${filter} bookings:`, error);
      if (filter !== 'all') {
        const allBookings = await bookingService.getBookings();
        return allBookings.filter(booking => {
          if (filter === 'completed') {
            return booking.status === 'completed' || booking.status === 'finished';
          }
          return booking.status === filter;
        });
      }
      throw error;
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        try {
          const authResponse = await checkAuth();
          setCurrentUser({
            ...authResponse.data,
            name: authResponse.data.name || authResponse.data.login || authResponse.data.username || 'Admin'
          });
        } catch (authError) {
          console.error('Auth check failed:', authError);
          const user = JSON.parse(localStorage.getItem("user"));
          setCurrentUser({
            ...user,
            name: user?.name || user?.login || user?.username || 'Admin'
          });
        }
        
        const [computersData, packagesData] = await Promise.all([
          computerService.getComputers(),   
          packageService.getPackages()
        ]);
        
        setComputers(computersData);
        setPackages(packagesData);
        await fetchAllUsers();
        
        const initialBookings = await fetchBookingsByFilter('all');
        setBookings(initialBookings);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const updateBookingsForFilter = async () => {
      if (sessionFilter === 'all') {
        if (!bookingsCache.all) {
          try {
            const allBookings = await fetchBookingsByFilter('all');
            setBookings(allBookings);
          } catch (error) {
            console.error('Error loading all bookings:', error);
          }
        }
        return;
      }

      try {
        const filteredBookings = await fetchBookingsByFilter(sessionFilter);
        setBookings(filteredBookings);
      } catch (error) {
        console.error(`Error loading ${sessionFilter} bookings:`, error);
        setSnackbar({
          open: true,
          message: `Failed to load ${sessionFilter} bookings`,
          severity: 'error'
        });
      }
    };

    if (sessionFilter && !loading) {
      updateBookingsForFilter();
    }
  }, [sessionFilter, bookingsCache.all]);

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
        user: user || { 
          id: booking.user_id, 
          email: `user${booking.user_id}@example.com`, 
          name: `User ${booking.user_id}`,
          username: `User ${booking.user_id}`
        },
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
    
    return transformedBookings.filter((booking) => {
      return booking.date === selected;
    });
  }, [transformedBookings, selectedDate]);

  const pendingBookings = useMemo(() => 
    filteredBookings.filter(b => b.status === 'pending'), [filteredBookings]);

  const activeSessions = useMemo(() => 
    filteredBookings.filter(b => b.status === 'active'), [filteredBookings]);

  const blockedUsers = useMemo(() => 
    users.filter(user => user.status === 'blocked'), [users]);

  const cancelledBookings = useMemo(() => 
    filteredBookings.filter(b => b.status === 'cancelled'), [filteredBookings]);

  const handleBlockUser = async (userId) => {
    try {
      await usersService.blockUserByID(userId);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: 'blocked' } : user
      ));
      setSnackbar({
        open: true,
        message: `User blocked successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to block user',
        severity: 'error'
      });
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await usersService.unblockUserByID(userId);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: 'active' } : user
      ));
      setSnackbar({
        open: true,
        message: `User unblocked successfully`,
        severity: 'success'
      });
    } catch (error) {
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
      const currentUser = JSON.parse(localStorage.getItem("user"));
      if (currentUser?.id === selectedUserForDelete.id) {
        showModal("Delete User Error", "You cannot delete your own account.");
        return;
      }

      await usersService.deleteUserByID(selectedUserForDelete.id);

      setUsers(users.filter(user => user.id !== selectedUserForDelete.id));
      setSnackbar({
        open: true,
        message: `User ${selectedUserForDelete.username} deleted successfully`,
        severity: 'success'
      });
      setDeleteUserModal(false);
      setSelectedUserForDelete(null);

    } catch (error) {
      showModal("Delete User Error", "This user cannot be deleted. They may have active bookings.");
    }
  };

  const handleBalanceOperation = async () => {
    if (!selectedUser || !balanceAmount) return;
    
    try {
      const amount = Math.abs(parseFloat(balanceAmount));
      const userId = parseInt(selectedUser);
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      if (balanceOperation === 'subtract' && user.balance < amount) {
        setSnackbar({
          open: true,
          message: 'Cannot subtract more than current balance',
          severity: 'error'
        });
        return;
      }
      const finalAmount = balanceOperation === 'add' ? amount : -amount;
      
      await usersService.creditUserByID(userId, finalAmount);
      
      const newBalance = balanceOperation === 'add' 
        ? user.balance + amount 
        : user.balance - amount;
      
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, balance: Math.max(0, newBalance) }
          : u
      ));
      
      const operationText = balanceOperation === 'add' ? 'added to' : 'deducted from';
      setSnackbar({
        open: true,
        message: `Successfully ${operationText} ${user.name || user.email}: $${amount}`,
        severity: 'success'
      });
      
      setBalanceModal(false);
      setSelectedUser('');
      setBalanceAmount('');
      setBalanceOperation('add');
    } catch (error) {
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
      await bookingService.cancelBookingByID(selectedBookingForCancel.id);

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
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to cancel booking',
        severity: 'error'
      });
    }
  };

  const handleGrantAdmin = async (userId, newRole) => {
    if (!isAuth) {
      handleAuthError("Authorization required to change roles");
      return;
    }

    const validRoles = ['admin', 'client'];
    if (!validRoles.includes(newRole)) {
      setSnackbar({
        open: true,
        message: `Invalid role: ${newRole}. Available roles: ${validRoles.join(', ')}`,
        severity: 'error'
      });
      return;
    }

    const permissionMatrix = {
      owner: {
        canAssign: ['admin', 'client'],
        cannotModify: ['owner']
      },
      admin: {
        canAssign: ['client'],
        cannotModify: ['owner', 'admin']
      },
      client: {
        canAssign: [],
        cannotModify: ['owner', 'admin', 'client']
      }
    };

    const currentUserPermissions = permissionMatrix[currentUserRole];
    if (!currentUserPermissions) {
      setSnackbar({
        open: true,
        message: `Unknown user role: ${currentUserRole}`,
        severity: 'error'
      });
      return;
    }

    const targetUser = users.find(user => user.id === userId);
    if (!targetUser) {
      setSnackbar({
        open: true,
        message: 'User not found',
        severity: 'error'
      });
      return;
    }

    if (currentUserPermissions.cannotModify.includes(targetUser.role)) {
      setSnackbar({
        open: true,
        message: `You cannot modify users with role: ${targetUser.role}`,
        severity: 'error'
      });
      return;
    }

    if (!currentUserPermissions.canAssign.includes(newRole)) {
      setSnackbar({
        open: true,
        message: `You cannot assign role: ${newRole}. Available roles for your level: ${currentUserPermissions.canAssign.join(', ') || 'none'}`,
        severity: 'error'
      });
      return;
    }

    if (targetUser.role === newRole) {
      setSnackbar({
        open: true,
        message: `User already has role: ${newRole}`,
        severity: 'warning'
      });
      return;
    }

    try {
      setSnackbar({
        open: true,
        message: 'Updating user role...',
        severity: 'info'
      });

      const response = await usersService.grantRoleByID(userId, newRole);

      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, role: newRole }
            : user
        )
      );

      const userName = targetUser.name || targetUser.email || `User #${targetUser.id}`;
      const roleChangeMessage = `${userName} role successfully changed from ${targetUser.role} to ${newRole}`;

      setSnackbar({
        open: true,
        message: roleChangeMessage,
        severity: 'success'
      });

      if (currentUser?.id === userId) {
        setTimeout(() => {
          setSnackbar({
            open: true,
            message: 'Your role has been changed. Please refresh the page to see updated permissions.',
            severity: 'info'
          });
        }, 2000);
      }

    } catch (error) {
      let errorMessage = 'Failed to change user role';

      if (error.response?.status === 403) {
        errorMessage = 'Insufficient privileges to change roles';
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found or role endpoint unavailable';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid role or request format';
      } else if (error.response?.status === 409) {
        errorMessage = 'User already has the specified role';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred while changing role';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const FilterLoadingIndicator = () => (
    apiLoading && (
      <Box display="flex" alignItems="center" gap={1} ml={2}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    )
  );

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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontFamily={theme.typography.fontFamily} fontWeight="bold">
            {currentUser?.role === 'owner' ? 'Owner Dashboard' : 'Admin Dashboard'}
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

        <Grid container spacing={3} mb={4} justifyContent="flex-start">
          <Grid size="auto">
            <Box sx={{ width: 250 }}>
              <StatCard title="Total Users" value={users.length} icon={<People />} color="#4CAF50" />
            </Box>
          </Grid>
          <Grid size="auto">
            <Box sx={{ width: 250 }}>
              <StatCard title="Active Sessions" value={activeSessions.length} icon={<Schedule />} color="#2196F3" />
            </Box>
          </Grid>
          <Grid size="auto">
            <Box sx={{ width: 250 }}>
              <StatCard title="Total Computers" value={computers.length} icon={<Computer />} color="#FF9800" />
            </Box>
          </Grid>
          <Grid size="auto">
            <Box sx={{ width: 250 }}>
              <StatCard title="Pending Bookings" value={pendingBookings.length} icon={<Settings />} color="#F44336" />
            </Box>
          </Grid>
          <Grid size="auto">
            <Box sx={{ width: 250 }}>
              <StatCard title="Blocked Users" value={blockedUsers.length} icon={<Block />} color="#F44336" />
            </Box>
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
            <Tab label="Sessions" />
            <Tab label="Users Management" />
            <Tab label="Blocked Users" />
          </Tabs>

          {activeTab === 0 && (
            <Box p={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6">
                    {sessionFilter === 'all' ? `All Sessions (${filteredBookings.length})` : 
                    sessionFilter === 'pending' ? `Pending Sessions (${filteredBookings.length})` : 
                    sessionFilter === 'active' ? `Active Sessions (${filteredBookings.length})` : 
                    sessionFilter === 'completed' ? `Completed Sessions (${filteredBookings.length})` : 
                    `Cancelled Sessions (${filteredBookings.length})`}
                  </Typography>
                  <FilterLoadingIndicator />
                </Box>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Filter Status</InputLabel>
                    <Select
                      value={sessionFilter}
                      onChange={(e) => setSessionFilter(e.target.value)}
                      label="Filter Status"
                      disabled={apiLoading}
                    >
                      <MenuItem value="all">All Sessions</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setBookingsCache({
                        all: null,
                        active: null,
                        pending: null,
                        cancelled: null,
                        finished: null
                      });
                      fetchBookingsByFilter(sessionFilter).then(data => setBookings(data));
                    }}
                    disabled={apiLoading}
                    startIcon={<Refresh />}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>
              {filteredBookings.length === 0 ? (
                <Typography color={theme.palette.text.secondary}>
                  No {sessionFilter === 'all' ? 'sessions' : 
                      sessionFilter === 'pending' ? 'pending sessions' : 
                      sessionFilter === 'active' ? 'active sessions' : 
                      sessionFilter === 'completed' ? 'completed sessions' : 
                      'cancelled sessions'} for selected date.
                </Typography>
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
                      {filteredBookings.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.id}</TableCell>
                          <TableCell>{session.user?.email || session.user?.username}</TableCell>
                          <TableCell>№{session.computer.id}</TableCell>
                          <TableCell>{session.package.name}</TableCell>
                          <TableCell>{session.startTime}</TableCell>
                          <TableCell>
                            <Chip 
                              label={session.status} 
                              color={
                                session.status === 'active' ? 'success' : 
                                session.status === 'pending' ? 'warning' : 
                                session.status === 'completed' || session.status === 'finished' ? 'primary' : 
                                'error'
                              } 
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => {
                                setSelectedBookingForCancel(session);
                                setCancelBookingModal(true);
                              }}
                              title="Cancel Session"
                              disabled={session.status !== 'active' && session.status !== 'pending'}
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
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>${user.balance}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip 
                              label={user.role} 
                              color={
                                user.role === 'owner' ? 'secondary' : 
                                user.role === 'admin' ? 'primary' : 'default'
                              }
                              size="small"
                            />
                            {currentUser?.role === 'owner' && user.role !== 'owner' && (
                              <Typography variant="caption" color="text.secondary">
                                (manageable)
                              </Typography>
                            )}
                          </Box>
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
                            {/* Block/Unblock button */}
                            {user.status === 'active' ? (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleBlockUser(user.id)}
                                title="Block User"
                                disabled={user.role === 'owner' || (currentUser?.role === 'admin' && user.role === 'admin')}
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
                            
                            {/* Manage Balance button */}
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

                            {/* Manage Role button - только для Owner */}
                            {currentUser?.role === 'owner' && user.role !== 'owner' && (
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => {
                                  setSelectedUserForRole(user);
                                  setNewRole(user.role);
                                  setRoleModal(true);
                                }}
                                title="Manage Role"
                              >
                                <AdminPanelSettings />
                              </IconButton>
                            )}

                            {/* Delete button - только для Admin и только для клиентов */}
                            {currentUser?.role === 'admin' && user.role === 'client' && (
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
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {activeTab === 2 && (
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
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>${user.balance}</TableCell>
                          <TableCell>
                            <Chip 
                              label={user.role} 
                              color={
                                user.role === 'owner' ? 'secondary' : 
                                user.role === 'admin' ? 'primary' : 'default'
                              }
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
                    {user.name || user.email} - Current: ${user.balance}
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
                  <strong>User:</strong> {selectedBookingForCancel.user?.email || selectedBookingForCancel.user?.username}
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
              disabled={selectedBookingForCancel?.status !== 'active' && selectedBookingForCancel?.status !== 'pending'}
            >
              Cancel Booking
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={modalVisible}
          onClose={() => setModalVisible(false)}
          maxWidth="xs"
        >
          <DialogTitle>{modalContent.title}</DialogTitle>
          <DialogContent>
            <Typography>{modalContent.message}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalVisible(false)} autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={roleModal} onClose={() => setRoleModal(false)} fullWidth maxWidth="sm">
          <DialogTitle>Manage User Role</DialogTitle>
          <DialogContent>
            {selectedUserForRole && (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Change role for: <strong>{selectedUserForRole.name || selectedUserForRole.email}</strong>
                </Typography>
                
                <Box sx={{ mb: 2, p: 2, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>Current Role:</strong> {selectedUserForRole.role}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedUserForRole.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Balance:</strong> ${selectedUserForRole.balance}
                  </Typography>
                </Box>
                
                <FormControl fullWidth margin="dense">
                  <InputLabel>Select New Role</InputLabel>
                  <Select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    label="Select New Role"
                  >
                    <MenuItem value="client">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Security fontSize="small" />
                        Client
                      </Box>
                    </MenuItem>
                    <MenuItem value="admin">
                      <Box display="flex" alignItems="center" gap={1}>
                        <AdminPanelSettings fontSize="small" />
                        Admin
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {newRole === 'admin' 
                      ? 'Admin users can manage bookings, users, and system settings.'
                      : newRole === 'client'
                      ? 'Client users can only make bookings and manage their own account.'
                      : 'Select a role to see description.'
                    }
                  </Typography>
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setRoleModal(false);
              setSelectedUserForRole(null);
              setNewRole('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedUserForRole && newRole !== selectedUserForRole.role) {
                  handleGrantAdmin(selectedUserForRole.id, newRole);
                }
                setRoleModal(false);
                setSelectedUserForRole(null);
                setNewRole('');
              }}
              variant="contained" 
              disabled={!newRole || newRole === selectedUserForRole?.role}
              startIcon={<AdminPanelSettings />}
            >
              Update Role
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