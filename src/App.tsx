import React, { useState, useEffect } from 'react';
import HealthForm from './components/HealthForm';
import SensorDashboard from './components/SensorDashboard';
import RiskAnalysis from './components/RiskAnalysis';
import AlertSystem from './components/AlertSystem';
import AlertSettingsUI from './components/AlertSettingsUI';
import AuthPage from './components/AuthPage';
import { db } from './lib/db';
import { SensorData, RiskPrediction } from './types';
import { Activity, Shield, Bell, Settings, LogOut, Heart, Cpu } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [hasProfile, setHasProfile] = useState(false);
  const [activeSensorAlert, setActiveSensorAlert] = useState<SensorData | null>(null);
  const [activeRiskAlert, setActiveRiskAlert] = useState<RiskPrediction | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const profile = db.getHealthData();
    if (profile) setHasProfile(true);
  }, []);

  const handleLoginSuccess = (newToken: string, loggedInUser: any) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setToken(newToken);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('stroke_guard_health_data');
    setToken(null);
    setUser(null);
    window.location.reload();
  };

  if (!token || !user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (!hasProfile) {
    return <HealthForm onComplete={() => setHasProfile(true)} />;
  }

  return (
    <div className="min-h-screen bg-mesh">
      {/* Ambient background orbs */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[140px] pointer-events-none" />

      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-white/6" style={{ background: 'rgba(8,11,20,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <span className="text-base font-black text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  StrokeGuard <span className="text-blue-400">AI</span>
                </span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* User pill */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/4 border border-white/8 mr-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <span className="text-xs font-medium text-slate-300">{user?.name?.split(' ')[0]}</span>
              </div>

              <button
                id="alerts-btn"
                onClick={() => setShowSettings(true)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/4 border border-white/8 text-slate-400 hover:text-white hover:border-white/20 transition-all"
              >
                <Bell size={17} />
                {(activeSensorAlert || activeRiskAlert) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-[#080b14]" />
                )}
              </button>
              <button
                id="settings-btn"
                onClick={() => setShowSettings(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/4 border border-white/8 text-slate-400 hover:text-white hover:border-white/20 transition-all"
              >
                <Settings size={17} />
              </button>
              <div className="w-px h-5 bg-white/8 mx-1" />
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-400 transition-colors"
              >
                <LogOut size={15} />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ──────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Live Health Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">Real-time monitoring · AI stroke risk detection</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Col: Sensor Dashboard (2/3) ─── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
              <SectionHeader
                icon={<Activity size={18} className="text-blue-400" />}
                title="Live Vitals"
                subtitle="Real-time sensor telemetry"
              />
              <SensorDashboard onAlert={setActiveSensorAlert} />
            </div>
          </div>

          {/* ── Right Col: AI Analysis + Contacts (1/3) ─── */}
          <div className="space-y-6">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <RiskAnalysis onAlert={setActiveRiskAlert} />
            </div>

            {/* Emergency Contacts */}
            <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <SectionHeader
                icon={<Heart size={16} className="text-rose-400" />}
                title="Emergency Contacts"
                subtitle=""
              />
              <div className="space-y-3 mt-4">
                <ContactItem name="Dr. Sarah Johnson" role="Primary Physician" phone="+1 555-0123" />
                <ContactItem name="Emergency Response" role="Local EMS" phone="911" isEmergency />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AlertSystem
        sensorAlert={activeSensorAlert}
        riskAlert={activeRiskAlert}
        onClear={() => { setActiveSensorAlert(null); setActiveRiskAlert(null); }}
      />
      {showSettings && <AlertSettingsUI onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="p-2 rounded-lg bg-white/5 border border-white/8">{icon}</div>
      <div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function ContactItem({
  name, role, phone, isEmergency
}: {
  name: string; role: string; phone: string; isEmergency?: boolean;
}) {
  return (
    <div className={`p-3 rounded-xl flex items-center justify-between border transition-all ${
      isEmergency
        ? 'bg-rose-500/8 border-rose-500/20 hover:border-rose-500/35'
        : 'bg-white/3 border-white/7 hover:border-white/15'
    }`}>
      <div>
        <div className="text-sm font-semibold text-slate-200">{name}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{role}</div>
      </div>
      <a
        href={`tel:${phone}`}
        className={`text-sm font-bold transition-colors ${isEmergency ? 'text-rose-400 hover:text-rose-300' : 'text-blue-400 hover:text-blue-300'}`}
      >
        {phone}
      </a>
    </div>
  );
}
