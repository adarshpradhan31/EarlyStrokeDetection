import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { SensorData, HealthData, RiskPrediction } from '../types';
import {
  FileText, Download, TrendingUp, Sparkles, ShieldAlert, CheckCircle,
  Activity, Heart, Droplets, Thermometer, User, Printer, AlertTriangle
} from 'lucide-react';

export default function TelemetryReports() {
  const [logs, setLogs] = useState<SensorData[]>([]);
  const [profile, setProfile] = useState<HealthData | null>(null);
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);

  useEffect(() => {
    setLogs(db.getSensorLogs());
    setProfile(db.getHealthData());
    setPredictions(db.getPredictions());
  }, []);

  const totalReadings = logs.length;

  // Calculate statistics helpers
  const getStats = (key: keyof SensorData) => {
    if (logs.length === 0) return { avg: 0, min: 0, max: 0 };
    const values = logs.map(l => l[key] as number).filter(v => v !== undefined && v > 0);
    if (values.length === 0) return { avg: 0, min: 0, max: 0 };
    
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { avg, min, max };
  };

  const hrStats = getStats('heartRate');
  const spo2Stats = getStats('spo2');
  const systolicStats = getStats('systolicBP');
  const diastolicStats = getStats('diastolicBP');
  const tempStats = getStats('temperature');
  const movementStats = getStats('movement');

  const latestPrediction = predictions[predictions.length - 1] ?? null;

  // Export CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    
    const headers = [
      'Timestamp',
      'Date/Time',
      'Heart Rate (BPM)',
      'SpO2 (%)',
      'Systolic BP (mmHg)',
      'Diastolic BP (mmHg)',
      'Temperature (°C)',
      'Movement Index (0-100)',
      'Accel X', 'Accel Y', 'Accel Z',
      'Gyro X', 'Gyro Y', 'Gyro Z'
    ];

    const rows = logs.map(l => [
      l.timestamp,
      new Date(l.timestamp).toISOString(),
      l.heartRate,
      l.spo2 ?? 0,
      l.systolicBP,
      l.diastolicBP,
      l.temperature,
      l.movement,
      l.accelX ?? 0,
      l.accelY ?? 0,
      l.accelZ ?? 0,
      l.gyroX ?? 0,
      l.gyroY ?? 0,
      l.gyroZ ?? 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `strokeguard_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clinical PDF print layout trigger
  const handlePrintClinicalReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ── Header View ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText size={16} className="text-emerald-400" /> Clinical Reports & Analytics Export
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Aggregate real-time vitals and export formatted patient sheets for cardiologists</p>
        </div>
        <div className="flex gap-2 self-start sm:self-center">
          <button
            onClick={handleExportCSV}
            disabled={totalReadings === 0}
            className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={12} /> Export CSV Vitals
          </button>
          <button
            onClick={handlePrintClinicalReport}
            className="btn-primary flex items-center gap-2 py-2 px-4 shadow-lg shadow-emerald-500/10 text-xs font-bold bg-gradient-to-br from-emerald-500 to-green-600"
          >
            <Printer size={13} /> Print Clinical Report
          </button>
        </div>
      </div>

      {totalReadings === 0 ? (
        /* Empty state */
        <div className="glass-card p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">No Telemetry Logs Found</p>
            <p className="text-xs text-slate-600 mt-1">Waiting for initial sensor readings from the Raspberry Pi before compiling analytics.</p>
          </div>
        </div>
      ) : (
        /* Actual Analytics Panel */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Vitals Summary Table (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-card p-5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity size={14} className="text-blue-400" /> Statistical Telemetry Summary
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/6 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-2">Vitals Metric</th>
                      <th className="py-2.5 px-2 text-right">Min Recorded</th>
                      <th className="py-2.5 px-2 text-right">Max Recorded</th>
                      <th className="py-2.5 px-2 text-right">Average Value</th>
                      <th className="py-2.5 px-2">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4 text-slate-300 font-medium">
                    <ReportRow
                      icon={<Heart size={12} className="text-rose-400" />}
                      name="Heart Rate"
                      stats={hrStats}
                      unit="BPM"
                    />
                    <ReportRow
                      icon={<Droplets size={12} className="text-cyan-400" />}
                      name="Oxygen Level (SpO2)"
                      stats={spo2Stats}
                      unit="%"
                      isDecimal
                    />
                    <ReportRow
                      icon={<Activity size={12} className="text-indigo-400" />}
                      name="Systolic Pressure"
                      stats={systolicStats}
                      unit="mmHg"
                    />
                    <ReportRow
                      icon={<Activity size={12} className="text-violet-400" />}
                      name="Diastolic Pressure"
                      stats={diastolicStats}
                      unit="mmHg"
                    />
                    <ReportRow
                      icon={<Thermometer size={12} className="text-orange-400" />}
                      name="Body Temperature"
                      stats={tempStats}
                      unit="°C"
                      isDecimal
                    />
                    <ReportRow
                      icon={<TrendingUp size={12} className="text-amber-400" />}
                      name="Physical Movement"
                      stats={movementStats}
                      unit="idx"
                    />
                  </tbody>
                </table>
              </div>
              <div className="text-[10px] text-slate-600 font-semibold mt-3 text-right">
                Based on latest {totalReadings} samples saved in the active browser session.
              </div>
            </div>

            {/* Smart Medical Insights Card */}
            <div className="glass-card p-5 space-y-3 bg-gradient-to-br from-white/[0.01] to-white/[0.03]">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-violet-400 animate-pulse" /> AI Vitals Evaluation & Daily Summary
              </h3>
              
              <div className="space-y-2.5 text-xs text-slate-400 leading-relaxed">
                {hrStats.avg > 100 ? (
                  <InsightItem
                    type="warning"
                    title="Elevated Mean Pulse"
                    desc="Average heart rate is elevated. Could indicate minor anxiety, heat strain, or high stress."
                  />
                ) : (
                  <InsightItem
                    type="success"
                    title="Stable Heart Rates"
                    desc="Your cardiovascular rhythm is well-regulated, averaging safely under the threshold."
                  />
                )}

                {systolicStats.avg > 135 ? (
                  <InsightItem
                    type="warning"
                    title="Mild Hypertension Detected"
                    desc="Systolic averages show hypertensive trends. Maintain low sodium diets and contact your physician."
                  />
                ) : (
                  <InsightItem
                    type="success"
                    title="Optimal Arterial Pressures"
                    desc="Systolic and Diastolic blood pressures are resting inside healthy physiological limits."
                  />
                )}

                {spo2Stats.avg < 95 ? (
                  <InsightItem
                    type="critical"
                    title="Hypoxia Warning"
                    desc="Oxygen saturation averages are below 95%. Discard readings if high motion occurred; otherwise seek respiratory counsel."
                  />
                ) : (
                  <InsightItem
                    type="success"
                    title="Superb Oxygen Saturation"
                    desc="Hemoglobin blood transport averages are excellent (above 97%). Proper breathing confirmed."
                  />
                )}
              </div>
            </div>
          </div>

          {/* Quick Print Preview Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card p-5 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              <div className="space-y-4 relative z-10">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Print Clinical Summary</h3>
                <div className="p-4 rounded-xl border border-white/6 bg-white/2 space-y-3 text-xs text-slate-400 leading-relaxed">
                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                    <User size={14} className="text-blue-400" /> Patient Medical File
                  </div>
                  <div>Name: <span className="text-slate-200 font-semibold">{profile?.gender === 'Male' ? 'John Doe' : 'Jane Doe'}</span></div>
                  <div>Age: <span className="text-slate-200 font-semibold">{profile?.age} Years</span></div>
                  <div>Baseline BMI: <span className="text-slate-200 font-semibold">{profile?.bmi}</span></div>
                  <div>AI Risk Level: <span className={`font-bold ${latestPrediction && latestPrediction.riskScore > 60 ? 'text-rose-400' : 'text-emerald-400'}`}>{latestPrediction ? `${latestPrediction.riskScore}%` : 'N/A'}</span></div>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Triggering the print button generates a clean, dual-column medical format optimized for printer margins. Safely compatible with Google Chrome and Microsoft Edge PDF writers.
                </p>
              </div>
              <button
                onClick={handlePrintClinicalReport}
                className="btn-primary w-full py-3 text-xs font-bold bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/15 relative z-10 mt-6"
              >
                <Printer size={14} /> Generate & Print Report Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print-only clinical panel */}
      <PrintReportLayout
        profile={profile}
        predictions={predictions}
        hrStats={hrStats}
        spo2Stats={spo2Stats}
        systolicStats={systolicStats}
        diastolicStats={diastolicStats}
        tempStats={tempStats}
        movementStats={movementStats}
        logs={logs}
      />
    </div>
  );
}

function ReportRow({
  icon, name, stats, unit, isDecimal
}: {
  icon: React.ReactNode; name: string; stats: { avg: number; min: number; max: number };
  unit: string; isDecimal?: boolean;
}) {
  const formatVal = (v: number) => {
    return isDecimal ? v.toFixed(1) : Math.round(v).toString();
  };

  return (
    <tr className="border-b border-white/4 text-slate-300">
      <td className="py-3 px-2 flex items-center gap-2 font-semibold">
        {icon} <span>{name}</span>
      </td>
      <td className="py-3 px-2 text-right text-slate-400">{formatVal(stats.min)}</td>
      <td className="py-3 px-2 text-right text-slate-400">{formatVal(stats.max)}</td>
      <td className="py-3 px-2 text-right font-black text-white">{formatVal(stats.avg)}</td>
      <td className="py-3 px-2 text-slate-500 font-bold">{unit}</td>
    </tr>
  );
}

function InsightItem({
  type, title, desc
}: {
  type: 'success' | 'warning' | 'critical'; title: string; desc: string;
}) {
  return (
    <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
      type === 'critical' ? 'bg-rose-500/8 border-rose-500/20 text-rose-300' :
      type === 'warning' ? 'bg-amber-500/8 border-amber-500/20 text-amber-300' :
      'bg-emerald-500/8 border-emerald-500/18 text-emerald-300'
    }`}>
      {type === 'critical' && <ShieldAlert size={14} className="text-rose-400 flex-shrink-0 mt-0.5" />}
      {type === 'warning' && <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />}
      {type === 'success' && <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />}
      <div>
        <div className="font-bold">{title}</div>
        <div className="text-[11px] opacity-80 mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

// ── PRINT-ONLY COMPONENT (Hidden by default, styled for printers) ───────────────────────────
function PrintReportLayout({
  profile, predictions, hrStats, spo2Stats, systolicStats, diastolicStats, tempStats, movementStats, logs
}: any) {
  const latestPrediction = predictions[predictions.length - 1] ?? null;

  return (
    <div className="hidden print:block bg-white text-black p-8 font-sans max-w-4xl mx-auto border border-slate-300 rounded-lg shadow-sm">
      {/* Clinician Sheet Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">StrokeGuard AI</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Clinical Patient Telemetry Report</p>
        </div>
        <div className="text-right text-xs text-slate-500 font-semibold">
          <div>Generated: {new Date().toLocaleDateString()}</div>
          <div>System ID: SG-748CED56</div>
        </div>
      </div>

      {/* Patient Health Profile Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2">Patient Profile Details</h3>
          <div className="text-xs grid grid-cols-2 gap-y-1 text-slate-700">
            <div>Gender: <span className="font-bold text-slate-900">{profile?.gender ?? 'N/A'}</span></div>
            <div>Age: <span className="font-bold text-slate-900">{profile?.age ?? 'N/A'} Years</span></div>
            <div>BMI: <span className="font-bold text-slate-900">{profile?.bmi ?? 'N/A'}</span></div>
            <div>Glucose: <span className="font-bold text-slate-900">{profile?.avgGlucoseLevel ?? 'N/A'} mg/dL</span></div>
            <div className="col-span-2">Smoking: <span className="font-bold text-slate-900 capitalize">{profile?.smokingStatus ?? 'N/A'}</span></div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2">Medical History & Diagnosis</h3>
          <div className="text-xs grid grid-cols-2 gap-y-1 text-slate-700">
            <div>Hypertension: <span className="font-bold text-slate-900">{profile?.hypertension ? 'YES' : 'NO'}</span></div>
            <div>Heart Disease: <span className="font-bold text-slate-900">{profile?.heartDisease ? 'YES' : 'NO'}</span></div>
            <div>Ever Married: <span className="font-bold text-slate-900">{profile?.everMarried ? 'YES' : 'NO'}</span></div>
            <div>Residence: <span className="font-bold text-slate-900 capitalize">{profile?.residenceType ?? 'N/A'}</span></div>
          </div>
        </div>
      </div>

      {/* AI Stroke Analysis Card */}
      {latestPrediction && (
        <div className="p-4 border-2 border-slate-900 rounded-lg mb-6 bg-slate-50">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-2">AI Stroke Risk Prediction Summary</h3>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-700 italic">" {latestPrediction.prediction} "</p>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                Evaluated: {new Date(latestPrediction.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <div className="text-center bg-slate-900 text-white py-2 px-4 rounded-lg">
              <div className="text-[9px] uppercase tracking-widest font-bold opacity-80">Risk Score</div>
              <div className="text-3xl font-black">{latestPrediction.riskScore}%</div>
            </div>
          </div>
          
          <div className="border-t border-slate-200 mt-3 pt-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-900 mb-1.5">Actionable Clinical Recommendations</h4>
            <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
              {latestPrediction.recommendations.map((rec: string, i: number) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Statistics Table */}
      <div className="mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-3 border-b-2 border-slate-900 pb-1">Historical Telemetry Aggregates</h3>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase">
              <th className="py-2 px-1">Vitals Parameter</th>
              <th className="py-2 px-1 text-right">Min Value</th>
              <th className="py-2 px-1 text-right">Max Value</th>
              <th className="py-2 px-1 text-right">Mean Value</th>
              <th className="py-2 px-1">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold">
            <tr>
              <td className="py-2.5 px-1 font-bold">Heart Rate</td>
              <td className="py-2.5 px-1 text-right">{Math.round(hrStats.min)}</td>
              <td className="py-2.5 px-1 text-right">{Math.round(hrStats.max)}</td>
              <td className="py-2.5 px-1 text-right font-black text-slate-900">{Math.round(hrStats.avg)}</td>
              <td className="py-2.5 px-1 text-slate-500">BPM</td>
            </tr>
            <tr>
              <td className="py-2.5 px-1 font-bold">Oxygen Saturation (SpO2)</td>
              <td className="py-2.5 px-1 text-right">{spo2Stats.min.toFixed(1)}</td>
              <td className="py-2.5 px-1 text-right">{spo2Stats.max.toFixed(1)}</td>
              <td className="py-2.5 px-1 text-right font-black text-slate-900">{spo2Stats.avg.toFixed(1)}</td>
              <td className="py-2.5 px-1 text-slate-500">%</td>
            </tr>
            <tr>
              <td className="py-2.5 px-1 font-bold">Systolic Pressure</td>
              <td className="py-2.5 px-1 text-right">{Math.round(systolicStats.min)}</td>
              <td className="py-2.5 px-1 text-right">{Math.round(systolicStats.max)}</td>
              <td className="py-2.5 px-1 text-right font-black text-slate-900">{Math.round(systolicStats.avg)}</td>
              <td className="py-2.5 px-1 text-slate-500">mmHg</td>
            </tr>
            <tr>
              <td className="py-2.5 px-1 font-bold">Diastolic Pressure</td>
              <td className="py-2.5 px-1 text-right">{Math.round(diastolicStats.min)}</td>
              <td className="py-2.5 px-1 text-right">{Math.round(diastolicStats.max)}</td>
              <td className="py-2.5 px-1 text-right font-black text-slate-900">{Math.round(diastolicStats.avg)}</td>
              <td className="py-2.5 px-1 text-slate-500">mmHg</td>
            </tr>
            <tr>
              <td className="py-2.5 px-1 font-bold">Body Temperature</td>
              <td className="py-2.5 px-1 text-right">{tempStats.min.toFixed(1)}</td>
              <td className="py-2.5 px-1 text-right">{tempStats.max.toFixed(1)}</td>
              <td className="py-2.5 px-1 text-right font-black text-slate-900">{tempStats.avg.toFixed(1)}</td>
              <td className="py-2.5 px-1 text-slate-500">°C</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature block */}
      <div className="mt-16 flex justify-between items-center border-t border-slate-300 pt-6">
        <div className="text-xs text-slate-500">
          * Telemetry compiled from physical MAX30102 & MPU6050 continuous readings.
        </div>
        <div className="text-center">
          <div className="w-48 border-b border-slate-900 mb-1"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Clinician Signature</span>
        </div>
      </div>
    </div>
  );
}
