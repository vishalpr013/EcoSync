import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input, Button } from '../components/ui/FormControls';
import { Card } from '../components/ui/DataDisplay';
import { ArrowRight, Leaf, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';

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
    <Card className="grid lg:grid-cols-[1.05fr_0.95fr] overflow-hidden p-0 shadow-[0_30px_80px_rgba(15,23,42,0.16)] border-white/70 dark:border-slate-800 dark:bg-slate-950/90 backdrop-blur-xl">
      <section className="relative hidden lg:flex flex-col justify-between min-h-[650px] p-10 text-white bg-[#0d1b1b] overflow-hidden">
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 85% 12%, rgba(52,211,153,.22), transparent 28%), radial-gradient(circle at 10% 90%, rgba(59,130,246,.12), transparent 30%)' }} />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/15 border border-emerald-300/20 grid place-items-center text-emerald-300"><Leaf className="w-5 h-5" /></div>
            <div><p className="font-bold tracking-[-0.03em] text-lg">EcoSync</p><p className="text-[9px] uppercase tracking-[0.22em] text-slate-400">ESG Intelligence Platform</p></div>
          </div>
          <div className="mt-16 max-w-md">
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] font-semibold text-emerald-300"><span className="w-8 h-px bg-emerald-400/60" /> Built for measurable impact</span>
            <h1 className="mt-5 text-[2.7rem] leading-[1.08] font-semibold tracking-[-0.045em] text-white">Turn sustainability data into decisions.</h1>
            <p className="mt-5 text-sm leading-6 text-slate-400">A unified command center for carbon accounting, social impact, governance, and employee engagement.</p>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-3">
          {[['40%', 'Environmental'], ['30%', 'Social'], ['30%', 'Governance']].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 backdrop-blur-sm"><p className="text-xl font-semibold text-white">{value}</p><p className="mt-1 text-[10px] text-slate-500">{label} weight</p></div>
          ))}
        </div>
      </section>

      <section className="p-7 sm:p-10 lg:p-12 flex flex-col justify-center">
      {/* Brand Header */}
      <div className="mb-8">
        <div className="lg:hidden w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 mb-5">
          <Leaf className="w-5 h-5" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400 mb-2">Secure workspace</p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.035em] text-slate-950 dark:text-white">
          Welcome back
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Sign in to your organization’s ESG command center.
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
          className="w-full py-3 font-bold gap-2"
          loading={loading}
        >
          Sign In <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      {/* Demo Account quick-select panel */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><Sparkles className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase tracking-[0.15em]">Demo workspaces</span></div>
          <span className="text-[10px] text-slate-400">Password prefilled</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => handleDemoSelect(account.email)}
              className="group w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-600 bg-slate-50/80 hover:bg-emerald-50/70 hover:text-emerald-800 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-300 rounded-xl transition-all duration-200 border border-slate-200/70 hover:border-emerald-200 dark:border-slate-800 dark:hover:border-emerald-900 active:scale-[0.98]"
            >
              <span>{account.label}</span>
              <span className="text-[9px] text-slate-400 group-hover:text-emerald-500 font-semibold">{account.role}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-400"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> JWT secured · Role-based access · Audit logged</div>
      </section>
    </Card>
  );
};

export default LoginPage;
