'use client';

import React, { useState } from 'react';
import { useAuth, Role } from '@/context/AuthContext';
import { QrCode, LogOut, LayoutDashboard, Home } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { LandingPage } from '@/components/LandingPage';
import LecturerDashboard from '@/components/real/LecturerDashboard';
import StudentDashboard from '@/components/real/StudentDashboard';

export default function HomeView() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<'landing' | 'dashboard'>('dashboard');

  // Auth Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authRole, setAuthRole] = useState<Role>('STUDENT');

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login', role: Role = 'STUDENT') => {
    setAuthMode(mode);
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <QrCode style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading qatt.…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 16px sm:0 24px',
            height: 54,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand Logo */}
          <div
            onClick={() => setView('landing')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode style={{ width: 15, height: 15, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--text-primary)', textTransform: 'lowercase' }}>
              qatt<span style={{ color: 'var(--accent)' }}>.</span>
            </span>
          </div>

          {/* User state / Auth action buttons */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Toggle view between landing & dashboard */}
              <div style={{ display: 'flex', gap: 4, marginRight: 6 }}>
                <button
                  onClick={() => setView('landing')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    border: 'none',
                    background: view === 'landing' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                    color: view === 'landing' ? '#c4b5fd' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Home style={{ width: 13, height: 13 }} />
                  <span className="hidden sm:inline">Overview</span>
                </button>
                <button
                  onClick={() => setView('dashboard')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    border: 'none',
                    background: view === 'dashboard' ? 'var(--accent)' : 'transparent',
                    color: view === 'dashboard' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <LayoutDashboard style={{ width: 13, height: 13 }} />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              </div>

              {/* User details */}
              <div style={{ textAlign: 'right', display: 'none' }} className="sm:block">
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {user.name}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
                  {user.role}
                  {user.matricNumber ? ` · ${user.matricNumber}` : ''}
                </p>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                title="Sign Out"
                style={{
                  padding: '7px 9px',
                  borderRadius: 7,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <LogOut style={{ width: 13, height: 13 }} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => handleOpenAuth('login')}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => handleOpenAuth('signup', 'STUDENT')}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {!user || view === 'landing' ? (
          <LandingPage onOpenAuth={handleOpenAuth} />
        ) : (
          <>
            {user.role === 'LECTURER' && <LecturerDashboard />}
            {user.role === 'STUDENT' && <StudentDashboard />}
            {user.role === 'ADMIN' && (
              <div
                style={{
                  maxWidth: 600,
                  margin: '80px auto',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                }}
              >
                <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                  Admin Console
                </p>
                <p>Administrative system management.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        qatt. — Student Attendance Management System Using QR Code Technology
      </footer>

      {/* Login & Sign Up Modal with wide layout and responsive mobile design */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        initialRole={authRole}
        onSuccess={() => setView('dashboard')}
      />
    </div>
  );
}
