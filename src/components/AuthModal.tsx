'use client';

import React, { useState } from 'react';
import { useAuth, Role, SignupData } from '@/context/AuthContext';
import { QrCode, X, Eye, EyeOff, AlertCircle, CheckCircle2, GraduationCap, UserCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  initialRole?: Role;
  onSuccess?: () => void;
}

const DEPARTMENTS = [
  'Software & Web Development',
  'Computer Science',
  'Electrical & Electronic Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Accountancy',
  'Mass Communication',
  'Science Laboratory Technology',
  'Estate Management',
  'Urban & Regional Planning',
];

const LEVELS = ['ND I', 'ND II', 'HND I', 'HND II'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialRole = 'STUDENT',
  onSuccess,
}) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [role, setRole] = useState<Role>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    matricNumber: '',
    level: 'ND I',
    department: 'Software & Web Development',
  });

  // Sync state when opened with props
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRole(initialRole);
      setError('');
    }
  }, [isOpen, initialMode, initialRole]);

  if (!isOpen) return null;

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (role === 'STUDENT' && !form.matricNumber.trim()) {
        setError('Matriculation number is required for students.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login(form.email, form.password);
        if (res.error) {
          setError(res.error);
          return;
        }
      } else {
        const signupData: SignupData = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role,
          department: form.department,
        };
        if (role === 'STUDENT') {
          signupData.matricNumber = form.matricNumber.trim().toUpperCase();
          signupData.level = form.level;
        }
        const res = await signup(signupData);
        if (res.error) {
          setError(res.error);
          return;
        }
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch {
      setError('An unexpected error occurred. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '11px 13px',
    fontSize: 13,
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 5,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 12px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          position: 'relative',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <QrCode style={{ width: 16, height: 16, color: '#ffffff' }} />
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--text-primary)', textTransform: 'lowercase' }}>
                qatt<span style={{ color: 'var(--accent)' }}>.</span>
              </span>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                {mode === 'login' ? 'Sign in to access your dashboard' : 'Create an institutional account'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Modal Body with internal scroll for mobile */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 4,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 9,
              padding: 4,
              marginBottom: 18,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              style={{
                padding: '8px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: mode === 'login' ? 'var(--bg-card)' : 'transparent',
                color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              style={{
                padding: '8px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: mode === 'signup' ? 'var(--bg-card)' : 'transparent',
                color: mode === 'signup' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === 'signup' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Create Account
            </button>
          </div>

          {/* Role Switcher (Shown in Signup mode, or optionally in Signin) */}
          {mode === 'signup' && (
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>I am registering as:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 9,
                    border: `1.5px solid ${role === 'STUDENT' ? 'var(--accent)' : 'var(--border)'}`,
                    background: role === 'STUDENT' ? 'rgba(124, 58, 237, 0.1)' : 'var(--bg)',
                    color: role === 'STUDENT' ? '#c4b5fd' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <GraduationCap style={{ width: 16, height: 16 }} />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('LECTURER')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 9,
                    border: `1.5px solid ${role === 'LECTURER' ? 'var(--accent)' : 'var(--border)'}`,
                    background: role === 'LECTURER' ? 'rgba(124, 58, 237, 0.1)' : 'var(--bg)',
                    color: role === 'LECTURER' ? '#c4b5fd' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <UserCheck style={{ width: 16, height: 16 }} />
                  Lecturer
                </button>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <AlertCircle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder={role === 'LECTURER' ? 'e.g. Dr. Babatunde Alabi' : 'e.g. Oladimeji Samuel'}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Institutional Email</label>
              <input
                type="email"
                required
                placeholder={role === 'LECTURER' ? 'lecturer@fedpolyado.edu.ng' : 'student@fedpolyado.edu.ng'}
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                style={inputStyle}
              />
            </div>

            {mode === 'signup' && role === 'STUDENT' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Matriculation Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FPA/CS/22/1004"
                    value={form.matricNumber}
                    onChange={(e) => set('matricNumber', e.target.value.toUpperCase())}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Academic Level</label>
                  <select
                    value={form.level}
                    onChange={(e) => set('level', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl} style={{ background: '#120722', color: '#fff' }}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label style={labelStyle}>Department</label>
                <select
                  value={form.department}
                  onChange={(e) => set('department', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} style={{ background: '#120722', color: '#fff' }}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  style={{ ...inputStyle, paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: '12px',
                borderRadius: 8,
                background: 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.15s ease',
              }}
            >
              {loading ? (
                <span>Processing…</span>
              ) : mode === 'login' ? (
                <span>Sign In to qatt.</span>
              ) : (
                <span>Create {role === 'STUDENT' ? 'Student' : 'Lecturer'} Account</span>
              )}
            </button>
          </form>

          {/* Quick toggle at bottom */}
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            {mode === 'login' ? (
              <span>
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Register here
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
