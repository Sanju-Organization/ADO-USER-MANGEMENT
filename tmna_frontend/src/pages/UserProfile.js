import React, { useState } from 'react';
import { Box, TextField, Button, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function UserProfile() {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
  });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${user.id}`, formData);
      setUser({ ...user, ...formData });
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/users/${user.id}/change-password`, { oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setMessage('Password changed successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Password change failed');
    }
  };

  return (
    <Box sx={{ maxWidth: 500 }}>
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <Box component="form" onSubmit={handleProfileUpdate} sx={{ marginTop: 2 }}>
        <TextField fullWidth label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} margin="normal" />
        <TextField fullWidth label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} margin="normal" />
        <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} margin="normal" />
        <TextField fullWidth label="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} margin="normal" />
        <Button type="submit" variant="contained" fullWidth sx={{ marginTop: 2 }}>Update Profile</Button>
      </Box>
      <Box component="form" onSubmit={handlePasswordChange} sx={{ marginTop: 4 }}>
        <TextField fullWidth label="Old Password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} margin="normal" />
        <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} margin="normal" />
        <Button type="submit" variant="contained" fullWidth sx={{ marginTop: 2 }}>Change Password</Button>
      </Box>
    </Box>
  );
}

export default UserProfile;
