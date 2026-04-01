import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SensorData } from '../types';
import { db } from '../lib/db';
import { Heart, Thermometer, Activity, Zap, AlertTriangle } from 'lucide-react';

interface Props {
  onAlert: (sensor: SensorData) => void;
}

export default function SensorDashboard({ onAlert }: Props) {
  const [logs, setLogs] = useState<SensorData[]>([]);
  const [current, setCurrent] = useState<SensorData | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const newSensor: SensorData = {
        timestamp: Date.now(),
        heartRate: 60 + Math.random() * 40 + (Math.random() > 0.9 ? 50 : 0), // Occasional spike
        systolicBP: 110 + Math.random() * 30 + (Math.random() > 0.9 ? 40 : 0),
        diastolicBP: 70 + Math.random() * 20,
        temperature: 36.5 + Math.random() * 1,
        movement: Math.random() * 20 + (Math.random() > 0.95 ? 60 : 0)
      };

      db.saveSensorData(newSensor);
      setLogs(db.getSensorLogs());
      setCurrent(newSensor);

      // Check custom thresholds
      const settings = db.getAlertSettings();
      const isHeartRateAlert = settings.alertOnHeartRate && newSensor.heartRate > settings.heartRateThreshold;
      const isBPAlert = settings.alertOnBP && newSensor.systolicBP > settings.systolicBPThreshold;
      const isTempAlert = settings.alertOnTemp && newSensor.temperature > settings.temperatureThreshold;
      const isMovementAlert = settings.alertOnMovement && newSensor.movement > settings.movementThreshold;

      if (isHeartRateAlert || isBPAlert || isTempAlert || isMovementAlert) {
        onAlert(newSensor);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [onAlert]);

  if (!current) return <div className="text-center py-12 text-slate-500">Initializing sensors...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Heart className="text-red-500" />} 
          label="Heart Rate" 
          value={`${Math.round(current.heartRate)}`} 
          unit="BPM"
          status={current.heartRate > 100 ? 'warning' : 'normal'}
        />
        <StatCard 
          icon={<Activity className="text-blue-500" />} 
          label="Blood Pressure" 
          value={`${Math.round(current.systolicBP)}/${Math.round(current.diastolicBP)}`} 
          unit="mmHg"
          status={current.systolicBP > 140 ? 'warning' : 'normal'}
        />
        <StatCard 
          icon={<Thermometer className="text-orange-500" />} 
          label="Temperature" 
          value={`${current.temperature.toFixed(1)}`} 
          unit="°C"
          status={current.temperature > 38 ? 'warning' : 'normal'}
        />
        <StatCard 
          icon={<Zap className="text-yellow-500" />} 
          label="Movement" 
          value={`${Math.round(current.movement)}`} 
          unit="Index"
          status={current.movement > 50 ? 'warning' : 'normal'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Heart size={20} className="text-red-500" /> Heart Rate Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={logs}>
                <defs>
                  <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" hide />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                  labelClassName="hidden"
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="heartRate" stroke="#ef4444" fillOpacity={1} fill="url(#colorHr)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity size={20} className="text-blue-500" /> Blood Pressure Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={logs}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" hide />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                  labelClassName="hidden"
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="systolicBP" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="diastolicBP" stroke="#94a3b8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, status }: { icon: React.ReactNode, label: string, value: string, unit: string, status: 'normal' | 'warning' }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${status === 'warning' ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-white border-slate-100 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        {status === 'warning' && <AlertTriangle size={16} className="text-red-500" />}
      </div>
      <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        <span className="text-slate-400 text-xs">{unit}</span>
      </div>
    </div>
  );
}
