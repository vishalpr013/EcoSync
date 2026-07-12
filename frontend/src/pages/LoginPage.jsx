import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input, Button } from '../components/ui/FormControls';
import { Card } from '../components/ui/DataDisplay';
import { Sparkles, ShieldAlert } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // List of pre-configured demo roles
  const demoAccounts = [
    { label: 'Admin Account', email: 'admin@ecosync.com', role: 'Admin' },
    { label: 'ESG Manager Account', email: 'manager@ecosync.com', role: 'ESG Manager' },
    { label: 'Department Head Account', email: 'head@ecosync.com', role: 'Department Head' },
    { label: 'Employee Account', email: 'employee@ecosync.com', role: 'Employee' },
    { label: 'Auditor Account', email: 'auditor@ecosync.com', role: 'Auditor' }
  ];

  const handleDemoSelect = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password'); // Default password for seeder
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl border border-gray-250/30 p-8 dark:bg-gray-950/80 backdrop-blur-md">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 mb-2">
          E
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Welcome to EcoSync
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          AI-Powered ESG Management Platform
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-650 dark:text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-750 dark:text-red-400 font-semibold">{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="yourname@ecosync.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button
          type="submit"
          variant="primary"
          className="w-full py-2.5 font-bold"
          loading={loading}
        >
          Sign In
        </Button>
      </form>

      {/* Demo Account quick-select panel */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-850">
        <div className="flex items-center gap-1.5 mb-3 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-bold uppercase tracking-wider">Quick Demo Login</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => handleDemoSelect(account.email)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-gray-650 bg-gray-50 hover:bg-indigo-50/40 hover:text-indigo-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 rounded-lg transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-950"
            >
              <span>{account.label}</span>
              <span className="text-[10px] text-gray-400 font-semibold">{account.role}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default LoginPage;
