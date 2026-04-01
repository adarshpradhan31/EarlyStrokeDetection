import React, { useState, useEffect } from 'react';
import HealthForm from './components/HealthForm';
import SensorDashboard from './components/SensorDashboard';
import RiskAnalysis from './components/RiskAnalysis';
import AlertSystem from './components/AlertSystem';
import AlertSettingsUI from './components/AlertSettingsUI';
import AuthPage from './components/AuthPage';
import { db } from './lib/db';
import { SensorData, RiskPrediction } from './types';
import { Activity, Shield, Bell, Settings, LogOut } from 'lucide-react';

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
    // keep health data in db since it's an MVP, or you can clear it if you want
    localStorage.removeItem('stroke_guard_health_data');
    setToken(null);
    setUser(null);
    window.location.reload();
  };

  if (!token || !user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-200">
                <Shield size={48} />
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">StrokeGuard AI</h1>
            <p className="text-slate-500 max-w-md mx-auto">
              Advanced early stroke detection system using real-time monitoring and artificial intelligence.
            </p>
          </div>
          <HealthForm onComplete={() => setHasProfile(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <Shield size={20} />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">StrokeGuard AI</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Settings size={20} />
              </button>
              <div className="h-8 w-px bg-slate-100 mx-2" />
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Real-time Monitoring */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={24} className="text-blue-600" /> Live Vitals
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Sensors Connected
                </div>
              </div>
              <SensorDashboard onAlert={setActiveSensorAlert} />
            </section>
          </div>

          {/* Right Column: AI Analysis & History */}
          <div className="space-y-8">
            <RiskAnalysis onAlert={setActiveRiskAlert} />
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Emergency Contacts</h3>
              <div className="space-y-3">
                <ContactItem name="Dr. Sarah Johnson" role="Primary Physician" phone="+1 555-0123" />
                <ContactItem name="Emergency Response" role="Local EMS" phone="911" isEmergency />
              </div>
            </div>
          </div>
        </div>
      </main>

      <AlertSystem 
        sensorAlert={activeSensorAlert} 
        riskAlert={activeRiskAlert}
        onClear={() => { setActiveSensorAlert(null); setActiveRiskAlert(null); }} 
      />

      {showSettings && <AlertSettingsUI onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function ContactItem({ name, role, phone, isEmergency }: { name: string, role: string, phone: string, isEmergency?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border flex items-center justify-between ${isEmergency ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
      <div>
        <div className="text-sm font-bold text-slate-800">{name}</div>
        <div className="text-[10px] text-slate-500 uppercase font-medium">{role}</div>
      </div>
      <div className={`text-sm font-bold ${isEmergency ? 'text-red-600' : 'text-blue-600'}`}>{phone}</div>
    </div>
  );
}
