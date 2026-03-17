import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import AdminPanel from './pages/AdminPanel';
import { useAuth } from './context/AuthContext';

function App() {
  const { token, logout, user } = useAuth();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {token && (
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }} data-testid="app-title">User Management</Typography>
            <Typography variant="body2" sx={{ marginRight: 2 }}>{user?.username}</Typography>
            <Button color="inherit" onClick={logout} data-testid="logout-btn">Logout</Button>
          </Toolbar>
        </AppBar>
      )}
      <Container sx={{ flex: 1, paddingY: 4 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/profile" element={token ? <UserProfile /> : <Navigate to="/login" />} />
          <Route path="/admin" element={token && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" />} />
          <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
