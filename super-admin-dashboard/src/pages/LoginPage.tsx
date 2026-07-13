import { useState } from 'react';
import apiClient from '../api/client';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const token = res.data.data.token;
      localStorage.setItem('admin_token', token);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={login} className="bg-white p-8 rounded-xl shadow-sm border border-card-border w-full max-w-sm">
        <h1 className="text-xl font-semibold text-text-primary mb-6 text-center">Super Admin Login</h1>
        {error && <div className="mb-4 p-3 text-sm text-danger bg-red-50 rounded-lg">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
}
