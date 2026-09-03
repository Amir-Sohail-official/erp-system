import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { ERPLayout } from './components/ERPLayout.jsx';
import { Button, Input } from './components/ui.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

function getCurrentPath() {
  return window.location.pathname || '/';
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [route, setRoute] = useState(getCurrentPath());
  const [credentials, setCredentials] = useState({
    email: 'admin@erp.local',
    password: 'admin123456',
  });

  useEffect(() => {
    const handleRouteChange = () => setRoute(getCurrentPath());
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('erp_token');

    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUser(response.data.data);
      })
      .catch(() => {
        localStorage.removeItem('erp_token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const navigate = (nextPath) => {
    window.history.pushState({}, '', nextPath);
    setRoute(nextPath);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      const token = response.data?.data?.token;

      if (!token) {
        throw new Error('Login response missing token');
      }

      localStorage.setItem('erp_token', token);

      const profileResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(profileResponse.data.data);
      navigate('/dashboard');
    } catch (error) {
      setLoginError(error?.response?.data?.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('erp_token');
    setUser(null);
    navigate('/');
  };

  if (loading) {
    return (
      <main className="erp-auth-shell">
        <div className="erp-auth-card">
          <p>Loading session...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="erp-auth-shell">
        <div className="erp-auth-card">
          <div className="erp-auth-header">
            <p className="erp-brand-kicker">ERP</p>
            <h1>Sign in</h1>
            <p>Professional ERP access</p>
          </div>

          <form className="erp-auth-form" onSubmit={handleLogin}>
            <Input
              label="Email"
              type="email"
              value={credentials.email}
              onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
              placeholder="admin@erp.local"
            />

            <Input
              label="Password"
              type="password"
              value={credentials.password}
              onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
              placeholder="••••••••"
            />

            {loginError ? <div className="erp-alert">{loginError}</div> : null}

            <Button type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? 'Signing in...' : 'Login'}
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return <ERPLayout user={user} route={route} navigate={navigate} onLogout={handleLogout} />;
}

export default App;
