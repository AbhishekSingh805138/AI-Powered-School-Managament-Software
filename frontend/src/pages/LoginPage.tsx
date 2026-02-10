import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { GraduationCap, Mail, Lock, User, Building2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<string>('student');
  const [tenantId, setTenantId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      const roleRoutes: Record<string, string> = {
        super_admin: '/super-admin',
        school_admin: '/school-admin',
        teacher: '/teacher',
        student: '/student',
        parent: '/parent'
      };
      navigate(roleRoutes[user.role] || '/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;
    if (isLogin) {
      result = await login(email, password);
    } else {
      result = await register({
        email,
        password,
        full_name: fullName,
        role,
        tenant_id: tenantId || null
      });
    }

    if (!result.success) {
      setError(result.error || 'An error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block">
          <img
            src="https://images.pexels.com/photos/18435276/pexels-photo-18435276.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            alt="School building"
            className="rounded-2xl shadow-2xl w-full h-[600px] object-cover"
          />
        </div>

        <div className="bg-white border border-[#0F2F24]/10 rounded-2xl p-8 lg:p-12 shadow-xl">
          <div className="flex items-center gap-2 mb-8">
            <GraduationCap className="w-8 h-8 text-[#0F2F24]" />
            <h1 className="text-3xl font-semibold text-[#0F2F24]">EduPro</h1>
          </div>

          <h2 className="text-3xl font-semibold text-[#0F2F24] mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-[#52525B] mb-8">
            {isLogin ? 'Sign in to access your dashboard' : 'Register to get started'}
          </p>

          {error && (
            <div data-testid="error-message" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-[#0F2F24] mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  data-testid="fullname-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="w-full px-4 py-3 border border-[#0F2F24]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2F24] bg-[#F5F5F0]"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#0F2F24] mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                data-testid="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#0F2F24]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2F24] bg-[#F5F5F0]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F2F24] mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </label>
              <input
                data-testid="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#0F2F24]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2F24] bg-[#F5F5F0]"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#0F2F24] mb-2">
                    Role
                  </label>
                  <select
                    data-testid="role-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 border border-[#0F2F24]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2F24] bg-[#F5F5F0]"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="school_admin">School Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                {role !== 'super_admin' && (
                  <div>
                    <label className="block text-sm font-medium text-[#0F2F24] mb-2">
                      <Building2 className="w-4 h-4 inline mr-2" />
                      School ID (Optional)
                    </label>
                    <input
                      data-testid="tenant-input"
                      type="text"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="w-full px-4 py-3 border border-[#0F2F24]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2F24] bg-[#F5F5F0]"
                      placeholder="Leave empty for demo"
                    />
                  </div>
                )}
              </>
            )}

            <button
              data-testid="submit-button"
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-[#0F2F24] text-white rounded-full font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              data-testid="toggle-mode-button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-[#0F2F24] hover:underline font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;