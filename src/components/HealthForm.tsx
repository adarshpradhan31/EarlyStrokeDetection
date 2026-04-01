import React, { useState } from 'react';
import { HealthData } from '../types';
import { db } from '../lib/db';
import { Heart, User, Activity, MapPin, Briefcase, Cigarette } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export default function HealthForm({ onComplete }: Props) {
  const [formData, setFormData] = useState<HealthData>({
    age: 45,
    gender: 'Male',
    hypertension: false,
    heartDisease: false,
    everMarried: true,
    workType: 'Private',
    residenceType: 'Urban',
    avgGlucoseLevel: 100,
    bmi: 25,
    smokingStatus: 'never smoked'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveHealthData(formData);
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
          <User size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Health Profile</h2>
          <p className="text-slate-500 text-sm">Please provide your baseline health information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Age</label>
          <input
            type="number"
            value={formData.age}
            onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Gender</label>
          <select
            value={formData.gender}
            onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Average Glucose Level</label>
          <input
            type="number"
            step="0.1"
            value={formData.avgGlucoseLevel}
            onChange={e => setFormData({ ...formData, avgGlucoseLevel: Number(e.target.value) })}
            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">BMI</label>
          <input
            type="number"
            step="0.1"
            value={formData.bmi}
            onChange={e => setFormData({ ...formData, bmi: Number(e.target.value) })}
            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Smoking Status</label>
          <select
            value={formData.smokingStatus}
            onChange={e => setFormData({ ...formData, smokingStatus: e.target.value as any })}
            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="never smoked">Never Smoked</option>
            <option value="formerly smoked">Formerly Smoked</option>
            <option value="smokes">Smokes</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Residence Type</label>
          <select
            value={formData.residenceType}
            onChange={e => setFormData({ ...formData, residenceType: e.target.value as any })}
            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="Urban">Urban</option>
            <option value="Rural">Rural</option>
          </select>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <input
            type="checkbox"
            checked={formData.hypertension}
            onChange={e => setFormData({ ...formData, hypertension: e.target.checked })}
            className="w-5 h-5 rounded text-blue-600"
          />
          <label className="text-sm font-medium text-slate-700">Hypertension History</label>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <input
            type="checkbox"
            checked={formData.heartDisease}
            onChange={e => setFormData({ ...formData, heartDisease: e.target.checked })}
            className="w-5 h-5 rounded text-blue-600"
          />
          <label className="text-sm font-medium text-slate-700">Heart Disease History</label>
        </div>

        <button
          type="submit"
          className="md:col-span-2 mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1"
        >
          Save Profile & Start Monitoring
        </button>
      </form>
    </div>
  );
}
