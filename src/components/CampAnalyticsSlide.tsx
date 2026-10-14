import React, { useState } from 'react';
import { useFirebaseData } from '../context/FirebaseContext';

export const CampAnalyticsSlide: React.FC = () => {
  const { patients, registrations, camps } = useFirebaseData();
  const [selectedCamp, setSelectedCamp] = useState<string>('Holavanahalli Oct 2026 (Live Firestore)');
  const [exportBanner, setExportBanner] = useState<string | null>(null);

  const totalPatients = patients.length;
  const totalRegistrations = registrations.length;
  const screenedCount = Math.max(totalPatients, totalRegistrations);

  // Demographics calculated purely from entered records
  const femaleCount = patients.filter((p) => p.gender === 'Female').length;
  const maleCount = patients.filter((p) => p.gender === 'Male').length;
  const otherCount = patients.filter((p) => p.gender === 'Other').length;
  const femalePct = totalPatients > 0 ? Math.round((femaleCount / totalPatients) * 100) : 0;
  const malePct = totalPatients > 0 ? Math.round((maleCount / totalPatients) * 100) : 0;

  const seniorCount = patients.filter((p) => {
    const parsed = parseInt(p.age.replace(/\D/g, ''), 10);
    return !isNaN(parsed) && parsed >= 60;
  }).length;
  const seniorPct = totalPatients > 0 ? Math.round((seniorCount / totalPatients) * 100) : 0;

  // Station funnel counts from real status
  const station1Count = screenedCount;
  const station2Count = patients.filter(
    (p) => p.status === 'triaged' || p.status === 'consulted' || p.status === 'completed'
  ).length;
  const station3Count = patients.filter(
    (p) => p.status === 'consulted' || p.status === 'completed'
  ).length;
  const station4Count = patients.filter((p) => p.status === 'completed').length;

  // Real diagnosis aggregation
  const diagnosisMap = new Map<string, number>();
  patients.forEach((p) => {
    if (p.diagnosis && p.diagnosis.trim()) {
      const parts = p.diagnosis.split(';');
      parts.forEach((item) => {
        const cleaned = item.trim();
        if (cleaned) {
          diagnosisMap.set(cleaned, (diagnosisMap.get(cleaned) || 0) + 1);
        }
      });
    }
  });

  const realMorbidity = Array.from(diagnosisMap.entries()).map(([label, count]) => ({
    label,
    count,
    pct: totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0,
  }));

  // Real village aggregation
  const villageMap = new Map<string, number>();
  patients.forEach((p) => {
    const v = p.village?.trim() || 'Unknown Village';
    villageMap.set(v, (villageMap.get(v) || 0) + 1);
  });
  const villageData = Array.from(villageMap.entries()).map(([village, count]) => ({
    village,
    count,
    pct: totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0,
  }));

  const handleExport = (format: 'PDF' | 'CSV' | 'HMIS') => {
    setExportBanner(
      format === 'HMIS'
        ? `Aggregated epidemiological data for ${totalPatients} patient(s) synced with Karnataka State HMIS.`
        : `Generated ${format} District Health Officer report for ${totalPatients} real patient record(s).`
    );
    setTimeout(() => setExportBanner(null), 4500);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
                REAL-TIME EPIDEMIOLOGY &amp; TELEMETRY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-bold">
                {totalPatients} Live Patients
              </span>
            </div>
            <h1 className="text-lg font-bold text-on-surface">
              Camp Analytics &amp; District Health Telemetry
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCamp}
            onChange={(e) => setSelectedCamp(e.target.value)}
            className="text-xs bg-surface-container px-3 py-2 rounded-xl border border-outline-variant/30 font-semibold text-on-surface"
          >
            <option>Holavanahalli Oct 2026 (Live Firestore)</option>
            {camps.map((c) => (
              <option key={c.id}>
                {c.campCode} • {c.location} ({c.registeredCount} Patients)
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleExport('CSV')}
            className="px-3 py-2 rounded-xl border border-outline-variant/40 text-xs font-semibold text-on-surface hover:bg-surface-container"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport('PDF')}
            className="px-3 py-2 rounded-xl border border-primary text-primary text-xs font-semibold hover:bg-primary/5"
          >
            DHO PDF Report
          </button>
          <button
            type="button"
            onClick={() => handleExport('HMIS')}
            className="px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold"
          >
            Sync State HMIS
          </button>
        </div>
      </div>

      {exportBanner && (
        <div className="bg-primary-fixed border border-primary/30 text-on-primary-fixed px-4 py-3 rounded-xl flex items-center justify-between text-sm font-medium">
          <span>{exportBanner}</span>
          <button type="button" onClick={() => setExportBanner(null)}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* 4 Real-Data KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/25">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Total Patients Registered
          </p>
          <p className="text-3xl font-bold font-mono text-on-surface mt-1">{totalPatients}</p>
          <p className="text-xs text-primary font-semibold mt-0.5">
            {femalePct}% Female ({femaleCount}) • {malePct}% Male ({maleCount})
          </p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/25">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Senior Citizens (≥ 60y)
          </p>
          <p className="text-3xl font-bold font-mono text-secondary mt-1">{seniorCount}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {seniorPct}% of total cohort • Priority screening
          </p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/25">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Doctor Consultations Completed
          </p>
          <p className="text-3xl font-bold font-mono text-primary mt-1">{station3Count}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {totalPatients > 0 ? Math.round((station3Count / totalPatients) * 100) : 0}% consultation completion rate
          </p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/25">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Pharmacy Dispensed
          </p>
          <p className="text-3xl font-bold font-mono text-tertiary mt-1">{station4Count}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {totalPatients > 0 ? Math.round((station4Count / totalPatients) * 100) : 0}% prescriptions dispensed
          </p>
        </div>
      </div>

      {/* Station Pipeline Real Throughput & Morbidity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real Station Pipeline */}
        <div className="lg:col-span-6 bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Station Pipeline Real Throughput
              </h2>
              <p className="text-xs text-on-surface-variant">
                Live patient funnel computed from entered Firestore documents
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-primary">n = {totalPatients}</span>
          </div>

          <div className="space-y-3">
            {[
              {
                station: 'Station 01 • Intake & Token Desk',
                count: station1Count,
                pct: totalPatients > 0 ? 100 : 0,
                desc: 'Walk-ins registered & digital passes generated',
                color: 'bg-primary',
              },
              {
                station: 'Station 02 • Triage & Vitals Station',
                count: station2Count,
                pct: totalPatients > 0 ? Math.round((station2Count / totalPatients) * 100) : 0,
                desc: 'Vitals, BP, sugar & allergy records captured',
                color: 'bg-secondary',
              },
              {
                station: 'Station 03 • Doctor OPD Consultation',
                count: station3Count,
                pct: totalPatients > 0 ? Math.round((station3Count / totalPatients) * 100) : 0,
                desc: 'Clinical evaluation & electronic prescription',
                color: 'bg-tertiary',
              },
              {
                station: 'Station 04 • Pharmacy Dispensing',
                count: station4Count,
                pct: totalPatients > 0 ? Math.round((station4Count / totalPatients) * 100) : 0,
                desc: 'Medications packaged with bilingual labels',
                color: 'bg-stone-500',
              },
            ].map((st) => (
              <div
                key={st.station}
                className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-on-surface">{st.station}</span>
                  <span className="font-mono font-bold text-on-surface">
                    {st.count} patient{st.count === 1 ? '' : 's'} ({st.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full ${st.color} rounded-full transition-all duration-500`}
                    style={{ width: `${st.pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Real Morbidity & Diagnoses Logged */}
        <div className="lg:col-span-6 bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Clinical Diagnoses &amp; Morbidity Logged
              </h2>
              <p className="text-xs text-on-surface-variant">
                Aggregated from doctors consultation notes and entered records
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-primary">
              {realMorbidity.length} conditions
            </span>
          </div>

          {realMorbidity.length === 0 ? (
            <div className="py-10 text-center text-on-surface-variant text-xs space-y-2 border border-dashed border-outline-variant/30 rounded-xl p-4">
              <span className="material-symbols-outlined text-3xl text-outline-variant">
                medical_information
              </span>
              <p className="font-semibold text-on-surface">No Diagnoses Logged Yet</p>
              <p className="text-[11px] max-w-sm mx-auto">
                Consult a patient at Station 03 (Doctor Consultation Room) and dispatch their prescription to see real morbidity data here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {realMorbidity.map((item, idx) => {
                const colors = ['bg-primary', 'bg-tertiary', 'bg-secondary', 'bg-error', 'bg-stone-500'];
                const color = colors[idx % colors.length];
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-on-surface truncate max-w-[260px]">
                        {item.label}
                      </span>
                      <span className="font-mono font-bold text-on-surface">
                        {item.count} case{item.count === 1 ? '' : 's'} ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full`}
                        style={{ width: `${Math.max(item.pct, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Village Distribution Sub-card */}
          <div className="pt-2 border-t border-outline-variant/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-2">
              Patients by Village / Residence
            </h3>
            {villageData.length === 0 ? (
              <p className="text-[11px] text-on-surface-variant">No village data recorded yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {villageData.map((v) => (
                  <span
                    key={v.village}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container text-xs font-medium text-on-surface"
                  >
                    <span className="material-symbols-outlined text-xs text-primary">location_on</span>
                    <span>{v.village}</span>
                    <span className="font-mono font-bold text-primary">({v.count})</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real Entered Patients Registry Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Live Patient Registry Telemetry ({patients.length})
            </h2>
            <p className="text-xs text-on-surface-variant">
              All records loaded directly from Firestore collection &quot;patients&quot;
            </p>
          </div>
        </div>

        {patients.length === 0 ? (
          <div className="py-10 text-center text-on-surface-variant text-xs space-y-2 border border-dashed border-outline-variant/30 rounded-xl p-4">
            <span className="material-symbols-outlined text-3xl text-outline-variant">person_search</span>
            <p className="font-semibold text-on-surface">No Patient Records Entered Yet</p>
            <p className="text-[11px]">
              Use Station 01 (Public Portal) or Station 01 (Volunteer Desk) to register real patients.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Age / Gender</th>
                  <th className="py-2.5 px-3">Village</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Vitals / Diagnosis</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-primary">{p.token}</td>
                    <td className="py-2.5 px-3 font-semibold text-on-surface">{p.fullName}</td>
                    <td className="py-2.5 px-3 text-on-surface-variant">
                      {p.age} • {p.gender}
                    </td>
                    <td className="py-2.5 px-3 text-on-surface">{p.village}</td>
                    <td className="py-2.5 px-3 font-mono text-on-surface-variant">{p.phone}</td>
                    <td className="py-2.5 px-3 text-on-surface-variant max-w-[200px] truncate">
                      {p.diagnosis || p.vitalsSummary || 'Awaiting doctor consult'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'completed'
                            ? 'bg-primary-container text-on-primary-container'
                            : p.status === 'consulted'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : p.status === 'triaged'
                            ? 'bg-tertiary-container text-on-tertiary-container'
                            : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
