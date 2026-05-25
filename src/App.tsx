import React, { useState, useEffect } from 'react';
import HealthForm from './components/HealthForm';
import SensorDashboard from './components/SensorDashboard';
import RiskAnalysis from './components/RiskAnalysis';
import AlertSystem from './components/AlertSystem';
import AlertSettingsUI from './components/AlertSettingsUI';
import AuthPage from './components/AuthPage';
import BrainMap from './components/BrainMap';
import InteractiveSimulator from './components/InteractiveSimulator';
import EmergencyDrill from './components/EmergencyDrill';
import TelemetryReports from './components/TelemetryReports';
import { db } from './lib/db';
import { SensorData, RiskPrediction } from './types';
import {
  Activity, Shield, Bell, Settings, LogOut, Heart,
  Brain, Sliders, Clock, FileText, User, Users
} from 'lucide-react';

type TabId = 'dashboard' | 'brainmap' | 'simulator' | 'drill' | 'reports';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [hasProfile, setHasProfile] = useState(false);
  const [activeSensorAlert, setActiveSensorAlert] = useState<SensorData | null>(null);
  const [activeRiskAlert, setActiveRiskAlert] = useState<RiskPrediction | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

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
    <div className="min-h-screen bg-mesh text-slate-100 flex flex-col">
      {/* Ambient background glowing orbs */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[140px] pointer-events-none" />

      {/* ── Navigation Header ─────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-white/6" style={{ background: 'rgba(8,11,20,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Brand Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <span className="text-base font-black text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  StrokeGuard <span className="text-blue-400 font-extrabold">AI</span>
                </span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* User badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/4 border border-white/8 mr-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {user?.name?.charAt(0) ?? 'U'}
                </div>
                <span className="text-xs font-semibold text-slate-300">{user?.name?.split(' ')[0]}</span>
              </div>

              {/* Notification & Settings Triggers */}
              <button
                id="alerts-btn"
                onClick={() => setShowSettings(true)}
                title="System Notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/4 border border-white/8 text-slate-400 hover:text-white hover:border-white/20 transition-all"
              >
                <Bell size={17} />
                {(activeSensorAlert || activeRiskAlert) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-[#080b14] animate-pulse" />
                )}
              </button>
              
              <button
                id="settings-btn"
                onClick={() => setShowSettings(true)}
                title="Alert Settings"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/4 border border-white/8 text-slate-400 hover:text-white hover:border-white/20 transition-all"
              >
                <Settings size={17} />
              </button>

              <div className="w-px h-5 bg-white/8 mx-1" />

              <button
                id="logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-400 transition-colors"
              >
                <LogOut size={15} />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Sub Navigation Tab Controller ─────────────────────────────────── */}
      <div className="bg-white/[0.01] border-b border-white/4 py-3 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <TabButton
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              icon={<Activity size={14} />}
              label="Live Dashboard"
            />
            <TabButton
              active={activeTab === 'brainmap'}
              onClick={() => setActiveTab('brainmap')}
              icon={<Brain size={14} />}
              label="Anatomy Map"
            />
            <TabButton
              active={activeTab === 'simulator'}
              onClick={() => setActiveTab('simulator')}
              icon={<Sliders size={14} />}
              label="Risk Simulator"
            />
            <TabButton
              active={activeTab === 'drill'}
              onClick={() => setActiveTab('drill')}
              icon={<Clock size={14} />}
              label="FAST Drill"
            />
            <TabButton
              active={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
              icon={<FileText size={14} />}
              label="Clinical Reports"
            />
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Workspace ──────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Active Tab Content (8 or 9 cols depending on layout) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="animate-fade-in-up" key={activeTab}>
              {activeTab === 'dashboard' && (
                <div>
                  <SectionHeader
                    icon={<Activity size={18} className="text-blue-400" />}
                    title="Live Telemetry Dashboard"
                    subtitle="Real-time vital stats & IMU logs from your Raspberry Pi"
                  />
                  <SensorDashboard onAlert={setActiveSensorAlert} />
                </div>
              )}

              {activeTab === 'brainmap' && (
                <div>
                  <SectionHeader
                    icon={<Brain size={18} className="text-violet-400" />}
                    title="Cerebral Stroke Anatomy"
                    subtitle="Understand symptom pathology based on affected brain lobes"
                  />
                  <BrainMap />
                </div>
              )}

              {activeTab === 'simulator' && (
                <div>
                  <SectionHeader
                    icon={<Sliders size={18} className="text-cyan-400" />}
                    title="Clinical Parameter Simulation"
                    subtitle="Model custom patient profiles and observe risk threshold calculations"
                  />
                  <InteractiveSimulator />
                </div>
              )}

              {activeTab === 'drill' && (
                <div>
                  <SectionHeader
                    icon={<Clock size={18} className="text-rose-400" />}
                    title="Emergency Rescue Training"
                    subtitle="Coach family members to handle acute stroke events in the Golden Hour"
                  />
                  <EmergencyDrill />
                </div>
              )}

              {activeTab === 'reports' && (
                <div>
                  <SectionHeader
                    icon={<FileText size={18} className="text-emerald-400" />}
                    title="Data Diagnostics & Printing"
                    subtitle="Review statistical trends and generate clinic-ready summaries"
                  />
                  <TelemetryReports />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Risk Diagnostics & Emergencies (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Real-time Risk Prediction (Always visible except when simulating) */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <SectionHeader
                icon={<Brain size={16} className="text-violet-400" />}
                title="AI Stroke Analysis"
                subtitle="Live prediction feedback"
              />
              <RiskAnalysis onAlert={setActiveRiskAlert} />
            </div>

            {/* Emergency Contacts Widget */}
            <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <SectionHeader
                icon={<Heart size={16} className="text-rose-400" />}
                title="Emergency Contacts"
                subtitle="One-click speed dial panel"
              />
              <div className="space-y-3 mt-4">
                <ContactItem name="Dr. Sarah Johnson" role="Primary Physician" phone="+1 555-0123" />
                <ContactItem name="Emergency Response" role="Local EMS" phone="911" isEmergency />
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Modals & Alerts */}
      <AlertSystem
        sensorAlert={activeSensorAlert}
        riskAlert={activeRiskAlert}
        onClear={() => { setActiveSensorAlert(null); setActiveRiskAlert(null); }}
      />
      {showSettings && <AlertSettingsUI onClose={() => setShowSettings(false)} />}
    </div>
  );
}

// ── Sub-Components ────────────────────────────────────────────────────

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
        active
          ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-md shadow-blue-500/5'
          : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="p-2 rounded-lg bg-white/4 border border-white/6">{icon}</div>
      <div>
        <h2 className="text-sm font-black text-white tracking-tight uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {title}
        </h2>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
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
    <div className={`p-3.5 rounded-xl flex items-center justify-between border transition-all ${
      isEmergency
        ? 'bg-rose-500/8 border-rose-500/20 hover:border-rose-500/35'
        : 'bg-white/3 border-white/6 hover:border-white/12'
    }`}>
      <div>
        <div className="text-xs font-bold text-slate-200">{name}</div>
        <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 font-semibold">{role}</div>
      </div>
      <a
        href={`tel:${phone}`}
        className={`text-xs font-black transition-colors px-3 py-1.5 rounded-lg border ${
          isEmergency
            ? 'text-rose-400 hover:text-rose-300 border-rose-500/25 bg-rose-500/8'
            : 'text-blue-400 hover:text-blue-300 border-blue-500/25 bg-blue-500/8'
        }`}
      >
        {phone}
      </a>
    </div>
  );
}
