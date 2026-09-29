'use client';

import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Html5Qrcode } from 'html5-qrcode';
import { useApp } from '@/context/AppContext';
import { AttendanceRecord } from '@/lib/types';
import {
  X,
  Camera,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface QRScannerModalProps {
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ onClose }) => {
  const { currentUser, sessions, markAttendance } = useApp();
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    record?: AttendanceRecord;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'qr-camera-stream';

  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext not supported
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    stopScanner();
    const res = markAttendance(decodedText, 'QR_SCAN');
    setResult(res);

    if (res.success) {
      playSuccessSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#c084fc', '#10b981', '#ffffff'],
      });
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // ignore scan frames
        }
      );
      setIsScanning(true);
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Camera permission was not granted or is unavailable on this device. You can use the manual session token input tab below.'
      );
      setActiveTab('manual');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.warn('Scanner stop error:', e);
      } finally {
        setIsScanning(false);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'camera' && !result) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [activeTab, result]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const res = markAttendance(manualCode.trim(), 'SESSION_CODE');
    setResult(res);

    if (res.success) {
      playSuccessSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#c084fc', '#10b981', '#ffffff'],
      });
    }
  };

  const resetScanner = () => {
    setResult(null);
    setManualCode('');
    if (activeTab === 'camera') {
      setTimeout(() => startScanner(), 300);
    }
  };

  const currentActiveSession = sessions.find(
    (s) => s.isActive && new Date(s.expiresAt) > new Date()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#090214] border border-purple-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 dark:border-white/[0.06] bg-purple-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                Scan Lecture Attendance QR
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                {currentUser?.name} ({currentUser?.matricNumber || 'Student'})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-neutral-400 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success or Error Result View */}
        {result ? (
          <div className="p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
            {result.success ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-500 dark:text-emerald-400 border-2 border-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Attendance Recorded!
                  </h4>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    {result.message}
                  </p>
                </div>

                {result.record && (
                  <div className="p-4 rounded-2xl bg-purple-50 dark:bg-white/[0.03] border border-purple-200 dark:border-white/10 text-left text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-neutral-400">Course:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {result.record.courseCode} - {result.record.courseTitle}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-neutral-400">Student:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {result.record.studentName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-neutral-400">Matric No:</span>
                      <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">
                        {result.record.matricNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-neutral-400">Timestamp:</span>
                      <span className="font-mono text-gray-700 dark:text-neutral-300">
                        {new Date(result.record.markedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-neutral-400">Method:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {result.record.method === 'QR_SCAN' ? 'Camera QR Scan' : 'Session Token'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-transform active:scale-95"
                  >
                    Done
                  </button>
                  <button
                    onClick={resetScanner}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold border border-purple-200 dark:border-white/10 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    Scan Another
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/70 text-red-500 border-2 border-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    Scan Not Accepted
                  </h4>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1 leading-relaxed">
                    {result.message}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={resetScanner}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-transform active:scale-95"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            {/* Tab switchers: Camera vs Manual Code */}
            <div className="flex rounded-full p-1 bg-purple-50 dark:bg-white/[0.04] border border-purple-200 dark:border-white/10 mb-5">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'camera'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-purple-600'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> Camera Scanner
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'manual'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-purple-600'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" /> Enter Code
              </button>
            </div>

            {/* Camera Scanner View */}
            {activeTab === 'camera' && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center border border-purple-500/40">
                  <div id={readerElementId} className="w-full h-full" />

                  {/* Laser beam animation */}
                  <div className="animate-scan-laser pointer-events-none" />

                  {/* Corner guide overlay */}
                  <div className="absolute inset-8 border border-dashed border-purple-400/50 rounded-xl pointer-events-none" />
                </div>

                {cameraError && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 text-xs">
                    {cameraError}
                  </div>
                )}

                <p className="text-center text-xs text-gray-500 dark:text-neutral-400">
                  Align the lecture projector QR code within the frame to scan automatically.
                </p>
              </div>
            )}

            {/* Manual Code View */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1.5">
                    Session Attendance Token
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. CSC301-842"
                    className="w-full px-4 py-3 rounded-2xl uppercase font-mono tracking-widest text-center text-lg font-bold bg-white dark:bg-white/[0.04] border border-purple-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                  />
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1.5 text-center">
                    Look for the short token displayed under the QR code on the lecture screen.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Validate & Record Attendance
                </button>
              </form>
            )}

            {/* Demo Quick-Fill Helper for instant testing */}
            {currentActiveSession && (
              <div className="mt-5 p-3 rounded-2xl bg-purple-50 dark:bg-white/[0.03] border border-purple-200/60 dark:border-white/10 flex items-center justify-between text-xs">
                <div className="truncate">
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    Live Demo Session:
                  </span>{' '}
                  <span className="font-mono text-gray-600 dark:text-neutral-300 font-bold">
                    {currentActiveSession.token}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('manual');
                    setManualCode(currentActiveSession.token);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 hover:scale-105 transition-transform"
                >
                  Auto-Fill
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
