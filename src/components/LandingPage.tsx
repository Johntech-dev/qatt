'use client';

import React, { useEffect, useRef } from 'react';
import { drawQRCodeWithLogo } from '@/lib/qrHelper';
import { Role } from '@/context/AuthContext';
import {
  QrCode,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Clock,
  CheckCircle2,
  Users,
  BookOpen,
  FileSpreadsheet,
  Check,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'signup', role?: Role) => void;
  onOpenScanner?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const qrPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw a preview QR code on canvas with FPA logo
  useEffect(() => {
    if (qrPreviewCanvasRef.current) {
      const samplePayload = JSON.stringify({
        token: 'FPA2026',
        course: 'SWD 211',
        topic: 'Web Systems Architecture',
        institution: 'Federal Polytechnic, Ado-Ekiti',
      });

      drawQRCodeWithLogo(qrPreviewCanvasRef.current, samplePayload, {
        width: 190,
        margin: 1,
        darkColor: '#2b0948',
        lightColor: '#ffffff',
        logoSrc: '/fpa-logo.png',
        logoSizeRatio: 0.24,
      }).catch((err) => console.error(err));
    }
  }, []);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', paddingBottom: 60 }}>
      {/* Hero Section */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '52px 20px 32px', textAlign: 'center' }}>
        {/* Hero Title */}
        <h1
          style={{
            fontSize: 'clamp(34px, 5.5vw, 56px)',
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            margin: '0 auto 18px',
            maxWidth: 780,
          }}
        >
          Smart QR Code <br />
          <span style={{ color: 'var(--accent)' }}>Attendance System</span>
        </h1>

        {/* Hero Description */}
        <p
          style={{
            fontSize: 'clamp(13px, 1.5vw, 14px)',
            color: 'var(--text-secondary)',
            maxWidth: 560,
            margin: '0 auto 24px',
            lineHeight: 1.5,
          }}
        >
          Fast, tamper-proof lecture attendance verification. Eliminate proxy sign-ins with dynamically generated QR codes, instant matriculation validation, and real-time reporting.
        </p>

        {/* Hero Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 32,
          }}
        >
          <button
            onClick={() => onOpenAuth('signup', 'STUDENT')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 26px',
              borderRadius: 10,
              background: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              transition: 'transform 0.15s ease, opacity 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Student Registration <ArrowRight style={{ width: 16, height: 16 }} />
          </button>

          <button
            onClick={() => onOpenAuth('login', 'LECTURER')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 24px',
              borderRadius: 10,
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            Lecturer Portal
          </button>

          <button
            onClick={() => onOpenAuth('login', 'STUDENT')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 20px',
              borderRadius: 10,
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: 'none',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Sign In →
          </button>
        </div>

        {/* Live Interactive Preview Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px 20px',
            textAlign: 'left',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header bar of preview */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              paddingBottom: 16,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Live Attendance Console
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                ● ACTIVE SESSION
              </span>
            </div>

            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>Course: <strong style={{ color: 'var(--text-primary)' }}>SWD 211</strong></span>
              <span>Units: <strong style={{ color: 'var(--text-primary)' }}>3</strong></span>
            </div>
          </div>

          {/* Body: Left recent scans, Right active QR Code preview */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              marginTop: 20,
              alignItems: 'center',
            }}
          >
            {/* Left Column: Live Verification Flow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Recent Student Check-Ins
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Ogunlesi Samuel', matric: 'FPA/SWD/22/1004', time: 'Just now', method: 'QR Scan' },
                  { name: 'Afolabi Kehinde', matric: 'FPA/CS/22/2019', time: '1 min ago', method: 'Session Code' },
                  { name: 'Ibrahim Fatima', matric: 'FPA/SWD/22/1088', time: '2 mins ago', method: 'QR Scan' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#4ade80',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check style={{ width: 12, height: 12 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {item.matric}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 600 }}>Verified</span>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: QR Canvas Display */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                borderRadius: 12,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  padding: 12,
                  borderRadius: 12,
                  display: 'inline-block',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <canvas ref={qrPreviewCanvasRef} style={{ display: 'block', width: 170, height: 170 }} />
              </div>

              <div style={{ marginTop: 14 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Manual Session Token: </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    color: 'var(--accent)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(124, 58, 237, 0.12)',
                    border: '1px solid rgba(124, 58, 237, 0.25)',
                  }}
                >
                  FPA2026
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Step Flow Section */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            How qatt. Works
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Streamlined in three frictionless steps for lecturers and students.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            {
              step: '01',
              title: 'Lecturer Creates Session',
              desc: 'Select course, duration, and project dynamic QR code on the lecture hall screen with single click.',
            },
            {
              step: '02',
              title: 'Student Scans or Inputs Code',
              desc: 'Students open camera scanner or submit session token using authenticated matriculation credentials.',
            },
            {
              step: '03',
              title: 'Instant Database Log',
              desc: 'Attendance is validated against course enrollment, preventing duplicates, and exported to CSV.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: 'var(--accent)',
                }}
              >
                {item.step}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
