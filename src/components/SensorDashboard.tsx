import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { SensorData } from '../types';
import { db } from '../lib/db';
import {
  Heart, Thermometer, Activity, Zap,
  AlertTriangle, Wifi, WifiOff, Droplets,
  Cpu, RotateCcw
} from 'lucide-react';
import { useSensorSocket } from '../hooks/useSensorSocket';

interface Props {
  onAlert: (sensor: SensorData) => void;
}

let simHeartRate = 72;
let simSystolicBP = 118;
let simDiastolicBP = 76;
let simTemp = 36.6;
let simSpo2 = 98.5;

function generateSimData(): SensorData {
  // Drifting random walk model for natural looking waveforms
  simHeartRate += (Math.random() - 0.5) * 2.5;
  simHeartRate = Math.max(62, Math.min(94, simHeartRate));

  simSystolicBP += (Math.random() - 0.5) * 3.0;
  simSystolicBP = Math.max(112, Math.min(132, simSystolicBP));

  simDiastolicBP += (Math.random() - 0.5) * 1.5;
  simDiastolicBP = Math.max(72, Math.min(84, simDiastolicBP));

  simTemp += (Math.random() - 0.5) * 0.08;
  simTemp = Math.max(36.3, Math.min(37.1, simTemp));

  simSpo2 += (Math.random() - 0.5) * 0.25;
  simSpo2 = Math.max(96.5, Math.min(99.8, simSpo2));

  const movement = Math.random() * 8 + (Math.random() > 0.985 ? 40 : 0);

  return {
    timestamp: Date.now(),
    heartRate: simHeartRate,
    systolicBP: simSystolicBP,
    diastolicBP: simDiastolicBP,
    temperature: simTemp,
    spo2: simSpo2,
    movement,
    accelX: (Math.random() - 0.5) * 0.2,
    accelY: (Math.random() - 0.5) * 0.2,
    accelZ: 9.8 + (Math.random() - 0.5) * 0.1,
    gyroX: (Math.random() - 0.5) * 4,
    gyroY: (Math.random() - 0.5) * 4,
    gyroZ: (Math.random() - 0.5) * 2,
  };
}


export default function SensorDashboard({ onAlert }: Props) {
  const { sensorData: piData, connectionMode } = useSensorSocket();
  const [logs, setLogs] = useState<SensorData[]>([]);
  const [current, setCurrent] = useState<SensorData | null>(null);
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;

  const processReading = useCallback((newSensor: SensorData) => {
    db.saveSensorData(newSensor);
    setLogs(db.getSensorLogs());
    setCurrent(newSensor);

    const settings = db.getAlertSettings();
    const sensorInUse = newSensor.heartRate > 0;

    const alerts = [
      settings.alertOnHeartRate && sensorInUse && newSensor.heartRate > settings.heartRateThreshold,
      settings.alertOnBP && sensorInUse && newSensor.systolicBP > settings.systolicBPThreshold,
      settings.alertOnTemp && newSensor.temperature > settings.temperatureThreshold,
      settings.alertOnMovement && newSensor.movement > settings.movementThreshold,
      settings.alertOnSpo2 && sensorInUse && (newSensor.spo2 ?? 100) < settings.spo2Threshold,
    ];
    if (alerts.some(Boolean)) onAlertRef.current(newSensor);
  }, []);

  useEffect(() => {
    if (connectionMode === 'pi') return;
    const interval = setInterval(() => processReading(generateSimData()), 2000);
    return () => clearInterval(interval);
  }, [connectionMode, processReading]);

  useEffect(() => {
    if (!piData || connectionMode !== 'pi') return;
    processReading(piData);
  }, [piData, connectionMode, processReading]);

  if (!current) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center gap-4 text-slate-500">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Cpu size={28} className="text-blue-400 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-300 text-sm">Initializing Sensors</p>
          <p className="text-xs text-slate-600 mt-1">Waiting for first reading...</p>
        </div>
      </div>
    );
  }

  const isPiMode = connectionMode === 'pi';
  const hasSpo2 = current.spo2 !== undefined;
  const hasImu = current.gyroX !== undefined;
  const sensorInUse = current.heartRate > 0;

  return (
    <div className="space-y-4">
      {/* ── Top bar: timestamp + connection badge ─── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-600 font-medium">
          Last update: <span className="text-slate-400">{new Date(current.timestamp).toLocaleTimeString()}</span>
        </p>
        <ConnectionBadge mode={connectionMode} />
      </div>

      {/* ── Pulse Sensor Inactive Banner ─── */}
      {isPiMode && !sensorInUse && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/25 animate-fade-in">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Pulse Sensor Inactive</p>
            <p className="text-xs text-amber-500/80 mt-0.5">
              Place and hold your finger on the MAX30102 sensor to enable heart rate & SpO2 monitoring and AI stroke analysis.
            </p>
          </div>
        </div>
      )}

      {/* ── Vital Stats Grid ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <VitalCard
          icon={<Heart size={16} className={`text-rose-400 ${sensorInUse ? 'animate-heartbeat' : ''}`} />}
          label="Heart Rate"
          value={sensorInUse ? `${Math.round(current.heartRate)}` : '--'}
          unit="BPM"
          warning={sensorInUse && current.heartRate > 100}
          color="rose"
        />
        {hasSpo2 && (
          <VitalCard
            icon={<Droplets size={16} className="text-cyan-400" />}
            label="SpO2"
            value={sensorInUse ? `${(current.spo2 ?? 0).toFixed(1)}` : '--'}
            unit="%"
            warning={sensorInUse && (current.spo2 ?? 100) < 94}
            color="cyan"
          />
        )}
        <VitalCard
          icon={<Activity size={16} className="text-indigo-400" />}
          label="Blood Pressure"
          value={sensorInUse ? `${Math.round(current.systolicBP)}/${Math.round(current.diastolicBP)}` : '--'}
          unit="mmHg"
          warning={sensorInUse && current.systolicBP > 140}
          color="indigo"
        />
        <VitalCard
          icon={<Thermometer size={16} className="text-orange-400" />}
          label="Temperature"
          value={`${current.temperature.toFixed(1)}`}
          unit="°C"
          warning={current.temperature > 38}
          color="orange"
        />
        <VitalCard
          icon={<Zap size={16} className="text-amber-400" />}
          label="Movement"
          value={`${Math.round(current.movement)}`}
          unit="idx"
          warning={current.movement > 50}
          color="amber"
        />
      </div>

      {/* ── Chart Row 1: Heart Rate + SpO2 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DarkChart title="Heart Rate" icon={<Heart size={13} className="text-rose-400" />}>
          <AreaChart data={logs}>
            <defs>
              <linearGradient id="gradHr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="timestamp" hide />
            <YAxis domain={['dataMin - 10', 'dataMax + 10']} width={32} tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip unit="BPM" />} />
            <Area type="monotone" dataKey="heartRate" stroke="#f43f5e" fill="url(#gradHr)" strokeWidth={2} dot={false} />
          </AreaChart>
        </DarkChart>

        <DarkChart title="SpO2 – Blood Oxygen" icon={<Droplets size={13} className="text-cyan-400" />}>
          <AreaChart data={logs}>
            <defs>
              <linearGradient id="gradSpo2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="timestamp" hide />
            <YAxis domain={[85, 100]} width={32} tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip unit="%" />} />
            <Area type="monotone" dataKey="spo2" stroke="#06b6d4" fill="url(#gradSpo2)" strokeWidth={2} dot={false} />
          </AreaChart>
        </DarkChart>
      </div>

      {/* ── Chart Row 2: Blood Pressure ─── */}
      <DarkChart title="Blood Pressure" icon={<Activity size={13} className="text-indigo-400" />}>
        <LineChart data={logs}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="timestamp" hide />
          <YAxis domain={['dataMin - 10', 'dataMax + 10']} width={32} tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip unit="mmHg" />} />
          <Legend />
          <Line type="monotone" dataKey="systolicBP"  stroke="#818cf8" strokeWidth={2} dot={false} name="Systolic" />
          <Line type="monotone" dataKey="diastolicBP" stroke="#4f46e5" strokeWidth={2} dot={false} name="Diastolic" />
        </LineChart>
      </DarkChart>

      {/* ── IMU Section ─── */}
      {hasImu && (
        <>
          <DarkChart title="MPU6050 – Gyroscope (°/s)" icon={<RotateCcw size={13} className="text-violet-400" />}>
            <LineChart data={logs}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="timestamp" hide />
              <YAxis width={40} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip unit="°/s" />} />
              <Legend />
              <Line type="monotone" dataKey="gyroX" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Gyro X" />
              <Line type="monotone" dataKey="gyroY" stroke="#06b6d4" strokeWidth={2} dot={false} name="Gyro Y" />
              <Line type="monotone" dataKey="gyroZ" stroke="#f59e0b" strokeWidth={2} dot={false} name="Gyro Z" />
            </LineChart>
          </DarkChart>

          {/* IMU Live Values */}
          <div className="grid grid-cols-2 gap-4">
            <ImuPanel title="Accelerometer (m/s²)" icon={<Cpu size={12} className="text-violet-400" />}>
              <AxisBadge label="X" value={current.accelX ?? 0} color="violet" />
              <AxisBadge label="Y" value={current.accelY ?? 0} color="cyan" />
              <AxisBadge label="Z" value={current.accelZ ?? 0} color="amber" />
            </ImuPanel>
            <ImuPanel title="Gyroscope (°/s)" icon={<RotateCcw size={12} className="text-violet-400" />}>
              <AxisBadge label="X" value={current.gyroX ?? 0} color="violet" />
              <AxisBadge label="Y" value={current.gyroY ?? 0} color="cyan" />
              <AxisBadge label="Z" value={current.gyroZ ?? 0} color="amber" />
            </ImuPanel>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function ConnectionBadge({ mode }: { mode: 'connecting' | 'pi' | 'simulated' }) {
  if (mode === 'pi') {
    return (
      <span className="badge badge-green">
        <Wifi size={10} />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Raspberry Pi Live
      </span>
    );
  }
  if (mode === 'simulated') {
    return (
      <span className="badge badge-amber">
        <WifiOff size={10} />
        Simulated Mode
      </span>
    );
  }
  return (
    <span className="badge badge-slate">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
      Connecting…
    </span>
  );
}

const colorMap = {
  rose:   { bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.2)',   text: '#f87171', iconBg: 'rgba(244,63,94,0.12)' },
  cyan:   { bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.2)',   text: '#22d3ee', iconBg: 'rgba(6,182,212,0.12)' },
  indigo: { bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.2)',  text: '#818cf8', iconBg: 'rgba(99,102,241,0.12)' },
  orange: { bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)',  text: '#fb923c', iconBg: 'rgba(249,115,22,0.12)' },
  amber:  { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  text: '#fbbf24', iconBg: 'rgba(245,158,11,0.12)' },
  violet: { bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)',  text: '#a78bfa', iconBg: 'rgba(139,92,246,0.12)' },
};

function VitalCard({
  icon, label, value, unit, warning, color
}: {
  icon: React.ReactNode; label: string; value: string; unit: string;
  warning: boolean; color: keyof typeof colorMap;
}) {
  const c = colorMap[color];
  return (
    <div
      className={`stat-card ${warning ? 'warning' : ''}`}
      style={warning ? {} : { '--tw-border-opacity': '1' } as any}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: c.iconBg }}>{icon}</div>
        {warning && <AlertTriangle size={12} className="text-rose-400" />}
      </div>
      <div className="label-xs mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black" style={{ color: warning ? '#f87171' : '#e2e8f0' }}>{value}</span>
        <span className="text-[10px] text-slate-600">{unit}</span>
      </div>
    </div>
  );
}

function DarkChart({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactElement }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-white/5">{icon}</div>
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(17,24,39,0.96)', border: '1px solid rgba(99,130,255,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name ?? 'Value'}:</span>
          <span className="font-bold text-white">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value} {unit}</span>
        </div>
      ))}
    </div>
  );
}

function ImuPanel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-card p-4">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
        {icon} {title}
      </h4>
      <div className="grid grid-cols-3 gap-2">{children}</div>
    </div>
  );
}

const axisColors: Record<string, string> = {
  violet: 'rgba(139,92,246,0.12)',
  cyan:   'rgba(6,182,212,0.12)',
  amber:  'rgba(245,158,11,0.12)',
};
const axisText: Record<string, string> = {
  violet: '#a78bfa',
  cyan:   '#22d3ee',
  amber:  '#fbbf24',
};

function AxisBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl p-2.5 text-center border border-white/8" style={{ background: axisColors[color] }}>
      <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: axisText[color], opacity: 0.7 }}>{label}</div>
      <div className="text-sm font-black text-slate-200">{value.toFixed(2)}</div>
    </div>
  );
}
