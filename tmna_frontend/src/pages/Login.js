import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, Card, CardContent } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom data-testid="login-title">Login</Typography>
          {error && <Alert severity="error" sx={{ marginBottom: 2 }} data-testid="login-error">{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" type="email" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="login-email" />
            <TextField fullWidth label="Password" type="password" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="login-password" />
            <Button type="submit" fullWidth variant="contained" sx={{ marginTop: 2 }} disabled={loading} data-testid="login-submit">{loading ? 'Logging in...' : 'Login'}</Button>
          </form>
          <Typography variant="body2" sx={{ marginTop: 2 }}>Don't have an account? <Link to="/register" data-testid="register-link">Register</Link></Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;
