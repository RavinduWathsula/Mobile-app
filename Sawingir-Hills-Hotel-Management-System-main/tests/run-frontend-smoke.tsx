import assert from 'node:assert/strict';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { Login } from '../app/pages/Login';
import { Dashboard } from '../app/pages/Dashboard';
import { AuthContext, type AuthContextValue, type AuthUser } from '../app/lib/auth-context';

const demoUser: AuthUser = {
  id: 1,
  fullName: 'Front Office Demo',
  email: 'frontoffice@sawingir.com',
  username: 'frontoffice',
  role: 'Front Office',
  roleId: 3,
  department: 'Front Office',
  avatarUrl: null,
};

function createAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    isAuthenticated: true,
    isLoading: false,
    user: demoUser,
    login: async () => undefined,
    logout: async () => undefined,
    refreshUser: async () => undefined,
    ...overrides,
  };
}

function check(name: string, run: () => void) {
  run();
  console.log(`PASS ${name}`);
}

try {
  check('login screen renders sign-in shell', () => {
    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={createAuthValue({ isAuthenticated: false, user: null })}>
          <Login />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    assert.match(html, /Welcome Back/);
    assert.match(html, /Email or Username/);
    assert.match(html, /Sign In/);
  });

  check('dashboard renders authenticated summary shell', () => {
    const html = renderToString(
      <MemoryRouter>
        <AuthContext.Provider value={createAuthValue()}>
          <Dashboard />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    assert.match(html, /Dashboard/);
    assert.match(html, /live hotel snapshot/i);
    assert.match(html, /No occupancy data available yet/i);
  });

  console.log('Passed frontend smoke checks.');
} catch (error) {
  console.error('Frontend smoke checks failed.');
  console.error(error);
  process.exit(1);
}
