'use client';

import React, { useState } from 'react';
import { useAuth, Role, SignupData } from '@/context/AuthContext';
import { QrCode, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  onSuccess: () => void;
}

const DEPARTMENTS = [
  'Software & Web Development',
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Accountancy',
  'Mass Communication',
  'Science Laboratory Technology',
];

const LEVELS = ['ND1', 'ND2', 'HND1', 'HND2'];

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<Role>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    matricNumber: '',
    level: 'ND1',
    department: 'Software & Web Development',
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await login(form.email, form.password);
        if (error) { setError(error); return; }
      } else {
        const data: SignupData = {
          name: form.name,
          email: form.email,
          password: form.password,
          role,
          department: form.department,
        };
        if (role === 'STUDENT') {
          data.matricNumber = form.matricNumber;
          data.level = form.level;
        }
        const { error } = await signup(data);
        if (error) { setError(error); return; }
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
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
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 36,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <QrCode style={{ width: 17, height: 17, color: '#fff' }} />
          </div>
          <div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: '-0.3px',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              POLY<span style={{ color: 'var(--accent)' }}>ATTEND</span>
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
              Federal Polytechnic, Ado-Ekiti
            </p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg)',
            borderRadius: 9,
            padding: 3,
            marginBottom: 24,
            border: '1px solid var(--border)',
          }}
        >
          {(['login', 'signup'] as AuthMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 7,
                border: 'none',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'capitalize',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Signup extras */}
          {mode === 'signup' && (
            <>
              {/* Role selector */}
              <div>
                <label style={labelStyle}>I am a</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['STUDENT', 'LECTURER'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: 7,
                        border: `1px solid ${role === r ? 'var(--accent)' : 'var(--border)'}`,
                        background: role === r ? 'var(--accent-subtle)' : 'transparent',
                        color: role === r ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {r === 'STUDENT' ? 'Student' : 'Lecturer'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sanya Ololade Timileyin"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  style={inputStyle}
                />
              </div>

              {role === 'STUDENT' && (
                <>
                  <div>
                    <label style={labelStyle}>Matric Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FPA/CS/24/03-0108"
                      value={form.matricNumber}
                      onChange={(e) => set('matricNumber', e.target.value.toUpperCase())}
                      style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Level</label>
                      <select
                        value={form.level}
                        onChange={(e) => set('level', e.target.value)}
                        style={inputStyle}
                      >
                        {LEVELS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Department</label>
                      <select
                        value={form.department}
                        onChange={(e) => set('department', e.target.value)}
                        style={inputStyle}
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {role === 'LECTURER' && (
                <div>
                  <label style={labelStyle}>Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => set('department', e.target.value)}
                    style={inputStyle}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Email */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              required
              placeholder="you@fpa.edu.ng"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                minLength={mode === 'signup' ? 8 : 1}
                style={{ ...inputStyle, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 0,
                }}
              >
                {showPass ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              style={{
                fontSize: 12,
                color: '#ef4444',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 6,
                padding: '8px 12px',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'inherit',
              marginTop: 4,
            }}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : `Create ${role === 'STUDENT' ? 'Student' : 'Lecturer'} Account`}
          </button>
        </form>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 20 }}>
        Student Attendance Management System — Federal Polytechnic, Ado-Ekiti
      </p>
    </div>
  );
}
