'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  QrCode,
  LogOut,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  GraduationCap,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  onNavigateHome: () => void;
  onOpenScanner?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onNavigateHome, onOpenScanner }) => {
  const { currentUser, setCurrentUser, users, resetToDefaultData } = useApp();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />;
      case 'LECTURER':
        return <UserCheck className="w-3.5 h-3.5 text-purple-400" />;
      case 'STUDENT':
        return <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-colors bg-[#ffffff]/80 dark:bg-[#04010a]/80 border-purple-200/60 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo (Nexora style) */}
        <div
          onClick={onNavigateHome}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30 border border-purple-400/30 group-hover:scale-105 transition-transform">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white uppercase font-sans">
              POLY<span className="text-purple-600 dark:text-purple-400">ATTEND</span>
            </span>

        </div>

        {/* Center Navigation Links (Nexora style) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-gray-600 dark:text-neutral-400">
          <button
            onClick={onNavigateHome}
            className="hover:text-purple-600 dark:hover:text-white transition-colors"
          >
            Overview
          </button>
          <button
            onClick={() => {
              const lec = users.find((u) => u.id === 'lec-1') || users.find((u) => u.role === 'LECTURER');
              if (lec) setCurrentUser(lec);
            }}
            className="hover:text-purple-600 dark:hover:text-white transition-colors"
          >
            Lecturer Portal
          </button>
          <button
            onClick={() => {
              const stu = users.find((u) => u.id === 'stu-1') || users.find((u) => u.role === 'STUDENT');
              if (stu) setCurrentUser(stu);
            }}
            className="hover:text-purple-600 dark:hover:text-white transition-colors"
          >
            Student Portal
          </button>
          <button
            onClick={() => {
              const adm = users.find((u) => u.role === 'ADMIN');
              if (adm) setCurrentUser(adm);
            }}
            className="hover:text-purple-600 dark:hover:text-white transition-colors"
          >
            Admin Console
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Quick Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all bg-purple-50 hover:bg-purple-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-purple-200 dark:border-white/10 text-gray-800 dark:text-neutral-200"
              title="Switch demo account"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline text-neutral-400 text-[11px]">Role:</span>
              <span className="font-bold text-purple-700 dark:text-purple-300">
                {currentUser ? currentUser.role : 'Guest'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl shadow-2xl py-2 border z-50 bg-white dark:bg-[#0c0517] border-purple-200 dark:border-purple-800/70 backdrop-blur-2xl">
                <div className="px-3 py-1.5 border-b border-purple-100 dark:border-white/[0.06]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-400">
                    Switch Test Account
                  </p>
                </div>
                <div className="p-1 space-y-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${currentUser?.id === u.id
                          ? 'bg-purple-600 text-white font-semibold shadow-md'
                          : 'hover:bg-purple-50 dark:hover:bg-white/[0.05] text-gray-700 dark:text-neutral-200'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {getRoleIcon(u.role)}
                        <div className="truncate">
                          <p className="truncate font-semibold">{u.name}</p>
                          <p className={`text-[10px] ${currentUser?.id === u.id ? 'text-purple-100' : 'text-gray-400 dark:text-neutral-400'}`}>
                            {u.matricNumber || u.role}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-current opacity-70">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reset Mock Data */}
          <button
            onClick={() => {
              if (confirm('Reset attendance system state back to default demo data?')) {
                resetToDefaultData();
              }
            }}
            className="p-2 rounded-full text-gray-400 hover:text-purple-600 dark:text-neutral-400 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/[0.05] transition-colors"
            title="Reset Mock Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Primary Action Button (Nexora Red/Purple Pill) */}
          {currentUser ? (
            <button
              onClick={() => setCurrentUser(null)}
              className="p-2 rounded-full text-gray-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 hover:bg-purple-50 dark:hover:bg-white/[0.05] transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-bold rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
