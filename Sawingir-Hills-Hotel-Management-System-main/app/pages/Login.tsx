import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Lock, User, Mail, Building2, Mountain, ShieldCheck, ClipboardList, UtensilsCrossed } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../lib/auth-context';
import { getClientEnv } from '../lib/runtime-env';

const API_BASE = getClientEnv('VITE_API_URL', 'http://localhost:3010/api');
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

function getNetworkMessage(error: unknown, fallback: string) {
  if (error instanceof TypeError) {
    return `Unable to reach the API at ${API_ORIGIN}. Start the backend server and try again.`;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

const workspaceHighlights = [
  {
    icon: ClipboardList,
    label: 'Live front office flow',
    value: 'Reservations, arrivals, and checkouts share the same backend data.',
  },
  {
    icon: UtensilsCrossed,
    label: 'Restaurant operations',
    value: 'POS, kitchen display, and menu workspace run inside one staff shell.',
  },
  {
    icon: ShieldCheck,
    label: 'Safer sign-in',
    value: 'RBAC and refresh-cookie sessions are enforced server-side.',
  },
];

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    department: 'Front Office',
  });

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      await login(loginData.username, loginData.password);
      navigate('/');
    } catch (error) {
      setErrorMsg(getNetworkMessage(error, 'Login failed. Check your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      setErrorMsg("Passwords don't match");
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: registerData.fullName,
          email: registerData.email,
          username: registerData.username,
          password: registerData.password,
          department: registerData.department,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setMessage('Registration successful. Your account is waiting for admin approval.');
      setIsLogin(true);
      setRegisterData({
        fullName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        department: 'Front Office',
      });
    } catch (error) {
      setErrorMsg(getNetworkMessage(error, 'Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(155,92,243,0.10),_transparent_24%),linear-gradient(180deg,_#fcfaff,_#f4effb)] px-5 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1380px] overflow-hidden rounded-[28px] border border-white/65 bg-white shadow-[0_28px_80px_rgba(73,30,118,0.10)] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#4c1d95_0%,#5b21b6_46%,#3b0764_100%)] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(216,180,254,0.18),_transparent_28%)]" />
          <div className="relative z-10 max-w-xl">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/12 bg-white/12">
              <Mountain className="h-8 w-8" />
            </div>
            <p className="mb-4 text-sm uppercase tracking-[0.26em] text-white/60">Sawingir Hills Hotel Management</p>
            <h1 className="max-w-lg text-5xl font-semibold tracking-[-0.04em] text-white">One operational workspace for your live hotel team.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/82">
              The system now runs real front office and restaurant flows on top of the backend, so staff can work from one calmer control surface instead of jumping between mock screens.
            </p>
          </div>

          <div className="relative z-10 grid gap-3">
            {workspaceHighlights.map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    <div className="mt-1 text-sm leading-6 text-white/72">{item.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_32px_rgba(91,33,182,0.24)]">
                <Mountain className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Sawingir Hills</h1>
              <p className="mt-1 text-sm text-muted-foreground">Hotel Management System</p>
            </div>

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  className="rounded-[24px] border border-border bg-card p-7 shadow-[0_18px_48px_rgba(63,28,109,0.08)] sm:p-8"
                >
                  <div className="mb-6">
                    <h2 className="text-3xl font-semibold text-foreground">Welcome back</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Sign in to continue with the live hotel operations workspace.
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="username">Email or username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter your email or username"
                          value={loginData.username}
                          onChange={(event) => setLoginData({ ...loginData, username: event.target.value })}
                          className="h-12 pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={loginData.password}
                          onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                          className="h-12 pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {errorMsg && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMsg}</div>}
                    {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

                    <Button type="submit" disabled={isLoading} className="h-12 w-full">
                      {isLoading ? 'Signing in...' : 'Sign in'}
                    </Button>
                  </form>

                  <div className="mt-6 flex items-center">
                    <div className="flex-1 border-t border-border" />
                    <span className="px-4 text-sm text-muted-foreground">Need a staff account?</span>
                    <div className="flex-1 border-t border-border" />
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setMessage('');
                      setIsLogin(false);
                    }}
                    variant="outline"
                    className="mt-4 h-12 w-full"
                  >
                    Create account
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  className="max-h-[90vh] overflow-y-auto rounded-[24px] border border-border bg-card p-7 shadow-[0_18px_48px_rgba(63,28,109,0.08)] sm:p-8"
                >
                  <div className="mb-6">
                    <h2 className="text-3xl font-semibold text-foreground">Create account</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Register a staff user and wait for administrator approval.
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="fullName"
                          value={registerData.fullName}
                          onChange={(event) => setRegisterData({ ...registerData, fullName: event.target.value })}
                          className="h-12 pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={registerData.email}
                          onChange={(event) => setRegisterData({ ...registerData, email: event.target.value })}
                          className="h-12 pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regUsername">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="regUsername"
                          value={registerData.username}
                          onChange={(event) => setRegisterData({ ...registerData, username: event.target.value })}
                          className="h-12 pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <select
                          id="department"
                          value={registerData.department}
                          onChange={(event) => setRegisterData({ ...registerData, department: event.target.value })}
                          className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="Front Office">Front Office</option>
                          <option value="Restaurant POS">Restaurant POS</option>
                          <option value="Housekeeping">Housekeeping</option>
                          <option value="Back Office">Back Office</option>
                          <option value="Manager">Manager</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regPassword">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="regPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={registerData.password}
                          onChange={(event) => setRegisterData({ ...registerData, password: event.target.value })}
                          className="h-12 pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={registerData.confirmPassword}
                          onChange={(event) => setRegisterData({ ...registerData, confirmPassword: event.target.value })}
                          className="h-12 pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {errorMsg && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMsg}</div>}
                    {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

                    <Button type="submit" disabled={isLoading} className="h-12 w-full">
                      {isLoading ? 'Submitting...' : 'Register'}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setErrorMsg('');
                        setMessage('');
                        setIsLogin(true);
                      }}
                      className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
