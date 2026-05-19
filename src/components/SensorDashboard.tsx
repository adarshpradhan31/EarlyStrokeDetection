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

function generateSimData(): SensorData {
  return {
    timestamp: Date.now(),
    heartRate: 65 + Math.random() * 35 + (Math.random() > 0.92 ? 45 : 0),
    systolicBP: 112 + Math.random() * 28 + (Math.random() > 0.93 ? 38 : 0),
    diastolicBP: 70 + Math.random() * 18,
    temperature: 36.5 + Math.random() * 0.9,
    spo2: 96 + Math.random() * 3,
    movement: Math.random() * 18 + (Math.random() > 0.95 ? 55 : 0),
    accelX: (Math.random() - 0.5) * 0.4,
    accelY: (Math.random() - 0.5) * 0.4,
    accelZ: 9.8 + (Math.random() - 0.5) * 0.15,
    gyroX: (Math.random() - 0.5) * 8,
    gyroY: (Math.random() - 0.5) * 8,
    gyroZ: (Math.random() - 0.5) * 4,
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
    const alerts = [
      settings.alertOnHeartRate && newSensor.heartRate > settings.heartRateThreshold,
      settings.alertOnBP && newSensor.systolicBP > settings.systolicBPThreshold,
      settings.alertOnTemp && newSensor.temperature > settings.temperatureThreshold,
      settings.alertOnMovement && newSensor.movement > settings.movementThreshold,
      settings.alertOnSpo2 && (newSensor.spo2 ?? 100) < settings.spo2Threshold,
    ];
    if (alerts.some(Boolean)) onAlertRef.current(newSensor);
  }, []);

  // Simulation fallback — only active when Pi is not connected
  useEffect(() => {
    if (connectionMode === 'pi') return;
    const interval = setInterval(() => processReading(generateSimData()), 2000);
    return () => clearInterval(interval);
  }, [connectionMode, processReading]);

  // Live Pi data
  useEffect(() => {
    if (!piData || connectionMode !== 'pi') return;
    processReading(piData);
  }, [piData, connectionMode, processReading]);

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
        <Cpu size={32} className="animate-pulse text-blue-400" />
        <span className="text-sm font-medium">Initializing sensors...</span>
      </div>
    );
  }

  const isPiMode = connectionMode === 'pi';
  const hasSpo2 = current.spo2 !== undefined;
  const hasImu = current.gyroX !== undefined;

  return (
    <div className="space-y-5">

      {/* ── Connection Badge ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 font-medium">
          Last update: {new Date(current.timestamp).toLocaleTimeString()}
        </p>
        <ConnectionBadge mode={connectionMode} />
      </div>

      {/* ── Vital Stats Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          icon={<Heart size={18} className="text-red-500" />}
          label="Heart Rate"
          value={`${Math.round(current.heartRate)}`}
          unit="BPM"
          status={current.heartRate > 100 ? 'warning' : 'normal'}
        />
        {hasSpo2 && (
          <StatCard
            icon={<Droplets size={18} className="text-sky-500" />}
            label="SpO2"
            value={`${(current.spo2 ?? 0).toFixed(1)}`}
            unit="%"
            status={(current.spo2 ?? 100) < 94 ? 'warning' : 'normal'}
          />
        )}
        <StatCard
          icon={<Activity size={18} className="text-indigo-500" />}
          label="BP"
          value={`${Math.round(current.systolicBP)}/${Math.round(current.diastolicBP)}`}
          unit="mmHg"
          status={current.systolicBP > 140 ? 'warning' : 'normal'}
        />
        <StatCard
          icon={<Thermometer size={18} className="text-orange-500" />}
          label="Temperature"
          value={`${current.temperature.toFixed(1)}`}
          unit="°C"
          status={current.temperature > 38 ? 'warning' : 'normal'}
        />
        <StatCard
          icon={<Zap size={18} className="text-amber-500" />}
          label="Movement"
          value={`${Math.round(current.movement)}`}
          unit="idx"
          status={current.movement > 50 ? 'warning' : 'normal'}
        />
      </div>

      {/* ── Charts Row 1: HR + SpO2 ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title="Heart Rate"
          icon={<Heart size={16} className="text-red-500" />}
        >
          <AreaChart data={logs}>
            <defs>
              <linearGradient id="gradHr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="timestamp" hide />
            <YAxis domain={['dataMin - 10', 'dataMax + 10']} width={36} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={() => ''}
              formatter={(v: number) => [`${Math.round(v)} BPM`, 'Heart Rate']}
            />
            <Area type="monotone" dataKey="heartRate" stroke="#ef4444" fill="url(#gradHr)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ChartCard>

        <ChartCard
          title="SpO2 — Blood Oxygen"
          icon={<Droplets size={16} className="text-sky-500" />}
        >
          <AreaChart data={logs}>
            <defs>
              <linearGradient id="gradSpo2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="timestamp" hide />
            <YAxis domain={[85, 100]} width={36} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={() => ''}
              formatter={(v: number) => [`${v.toFixed(1)}%`, 'SpO2']}
            />
            <Area type="monotone" dataKey="spo2" stroke="#0ea5e9" fill="url(#gradSpo2)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ChartCard>
      </div>

      {/* ── Charts Row 2: Blood Pressure ─────────────────────── */}
      <ChartCard
        title="Blood Pressure"
        icon={<Activity size={16} className="text-indigo-500" />}
      >
        <LineChart data={logs}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="timestamp" hide />
          <YAxis domain={['dataMin - 10', 'dataMax + 10']} width={36} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={() => ''}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Line type="monotone" dataKey="systolicBP" stroke="#6366f1" strokeWidth={2} dot={false} name="Systolic" />
          <Line type="monotone" dataKey="diastolicBP" stroke="#a5b4fc" strokeWidth={2} dot={false} name="Diastolic" />
        </LineChart>
      </ChartCard>

      {/* ── Charts Row 3: MPU6050 Gyroscope ──────────────────── */}
      {hasImu && (
        <>
          <ChartCard
            title="MPU6050 — Gyroscope (°/s)"
            icon={<RotateCcw size={16} className="text-violet-500" />}
          >
            <LineChart data={logs}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="timestamp" hide />
              <YAxis width={40} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={() => ''} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="gyroX" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Gyro X" />
              <Line type="monotone" dataKey="gyroY" stroke="#06b6d4" strokeWidth={2} dot={false} name="Gyro Y" />
              <Line type="monotone" dataKey="gyroZ" stroke="#f59e0b" strokeWidth={2} dot={false} name="Gyro Z" />
            </LineChart>
          </ChartCard>

          {/* ── IMU Live Values ─────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Cpu size={13} className="text-violet-400" /> Accelerometer (m/s²)
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <AxisBadge label="X" value={current.accelX ?? 0} color="violet" />
                <AxisBadge label="Y" value={current.accelY ?? 0} color="cyan" />
                <AxisBadge label="Z" value={current.accelZ ?? 0} color="amber" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <RotateCcw size={13} className="text-violet-400" /> Gyroscope (°/s)
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <AxisBadge label="X" value={current.gyroX ?? 0} color="violet" />
                <AxisBadge label="Y" value={current.gyroY ?? 0} color="cyan" />
                <AxisBadge label="Z" value={current.gyroZ ?? 0} color="amber" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

const tooltipStyle: React.CSSProperties = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)',
  fontSize: '12px',
};

function ConnectionBadge({ mode }: { mode: 'connecting' | 'pi' | 'simulated' }) {
  if (mode === 'pi') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
        <Wifi size={11} />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
        Raspberry Pi Live
      </div>
    );
  }
  if (mode === 'simulated') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
        <WifiOff size={11} /> Simulated Mode
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse inline-block" />
      Connecting…
    </div>
  );
}

function StatCard({
  icon, label, value, unit, status
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning';
}) {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      status === 'warning'
        ? 'bg-red-50 border-red-200 animate-pulse'
        : 'bg-white border-slate-100 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="p-1.5 bg-slate-50 rounded-lg">{icon}</div>
        {status === 'warning' && <AlertTriangle size={13} className="text-red-500" />}
      </div>
      <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{label}</div>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-xl font-black text-slate-800">{value}</span>
        <span className="text-slate-400 text-[10px]">{unit}</span>
      </div>
    </div>
  );
}

function ChartCard({
  title, icon, children
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-700">
        {icon} {title}
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const axisColorMap: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-700 border-violet-200',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
};

function AxisBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border p-2 text-center ${axisColorMap[color]}`}>
      <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">{label}</div>
      <div className="text-sm font-black leading-tight mt-0.5">{value.toFixed(2)}</div>
    </div>
  );
}
