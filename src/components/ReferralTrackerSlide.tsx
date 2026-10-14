import React, { useState } from 'react';

interface ReferralRecord {
  id: string;
  token: string;
  patientName: string;
  ageGender: string;
  village: string;
  phone: string;
  provisionalDiagnosis: string;
  targetFacility: string;
  department: string;
  urgency: 'EMERGENCY_108' | 'URGENT_48H' | 'ROUTINE_OPD';
  appointmentDate: string;
  ashaWorker: string;
  status: 'TRANSIT_108' | 'BOOKED' | 'ADMITTED' | 'PENDING_COUNSELING';
  notes: string;
}

export const ReferralTrackerSlide: React.FC = () => {
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReferralId, setSelectedReferralId] = useState<string>('REF-2026-019');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [referrals, setReferrals] = useState<ReferralRecord[]>([
    {
      id: 'REF-2026-019',
      token: '#T-034',
      patientName: 'Narasimhaiah G.',
      ageGender: '67y / M',
      village: 'Holavanahalli',
      phone: '+91 94481 22901',
      provisionalDiagnosis: 'Unstable Angina / ST-Depression on 12-Lead ECG',
      targetFacility: 'Tumakuru District General Hospital',
      department: 'Cardiology / ICCU',
      urgency: 'EMERGENCY_108',
      appointmentDate: 'Immediate Transfer (108 ALS)',
      ashaWorker: 'Smt. Ratnamma (ASHA-04)',
      status: 'TRANSIT_108',
      notes: 'Loading dose Aspirin 300mg + Clopidogrel 300mg + Atorvastatin 80mg given at 10:42 AM.',
    },
    {
      id: 'REF-2026-020',
      token: '#T-043',
      patientName: 'Lakshmamma V.',
      ageGender: '52y / F',
      village: 'Byrenahalli',
      phone: '+91 98450 71239',
      provisionalDiagnosis: 'Severe Non-Proliferative Diabetic Retinopathy + HTN Stage 2',
      targetFacility: 'Minto Regional Ophthalmology / District Eye Wing',
      department: 'Retina & Vitreous Clinic',
      urgency: 'URGENT_48H',
      appointmentDate: '21 Oct 2026, 09:30 AM',
      ashaWorker: 'Smt. Pushpa K. (ASHA-09)',
      status: 'BOOKED',
      notes: 'Fundus capture attached to ABHA health locker. Fasting blood sugar 246 mg/dL.',
    },
    {
      id: 'REF-2026-021',
      token: '#T-028',
      patientName: 'Chikkanna M.',
      ageGender: '59y / M',
      village: 'Kyathasandra',
      phone: '+91 99001 48210',
      provisionalDiagnosis: 'Bilateral Mature Senile Cataract (VA 6/60 OD)',
      targetFacility: 'Koratagere Taluk Government Hospital',
      department: 'NPCBs Cataract Surgical Camp',
      urgency: 'ROUTINE_OPD',
      appointmentDate: '24 Oct 2026, 08:00 AM',
      ashaWorker: 'Smt. Jayamma (ASHA-02)',
      status: 'BOOKED',
      notes: 'Pre-op fitness cleared. Biometry scheduled at Taluk Hospital.',
    },
    {
      id: 'REF-2026-022',
      token: '#T-051',
      patientName: 'Yashodamma S.',
      ageGender: '34y / F',
      village: 'Thovinakere',
      phone: '+91 87621 33904',
      provisionalDiagnosis: 'Severe Iron Deficiency Anemia (Hb 6.8 g/dL) in 2nd Trimester ANC',
      targetFacility: 'Tumakuru MCH Wing (Mother & Child Hospital)',
      department: 'High-Risk Obstetrics Clinic',
      urgency: 'URGENT_48H',
      appointmentDate: '20 Oct 2026, 10:00 AM',
      ashaWorker: 'Smt. Savitha (ASHA-11)',
      status: 'PENDING_COUNSELING',
      notes: 'Parenteral Iron Sucrose infusion recommended; family counseling in progress.',
    },
  ]);

  const activeReferral =
    referrals.find((r) => r.id === selectedReferralId) || referrals[0];

  const filteredReferrals = referrals.filter((r) => {
    const matchesUrgency = urgencyFilter === 'ALL' || r.urgency === urgencyFilter;
    const matchesSearch =
      !searchQuery ||
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.targetFacility.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUrgency && matchesSearch;
  });

  const handleTriggerAshaSms = (ref: ReferralRecord) => {
    setBannerMessage(
      `Kannada SMS & WhatsApp referral pass dispatched to ${ref.patientName} (${ref.phone}) and ${ref.ashaWorker}.`
    );
    setTimeout(() => setBannerMessage(null), 4500);
  };

  const handleAdvanceStatus = (id: string) => {
    setReferrals((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nextStatus =
          r.status === 'PENDING_COUNSELING'
            ? 'BOOKED'
            : r.status === 'TRANSIT_108'
            ? 'ADMITTED'
            : 'ADMITTED';
        return { ...r, status: nextStatus };
      })
    );
    setBannerMessage(`Referral ${id} status updated and synced with ASHA worker follow-up queue.`);
    setTimeout(() => setBannerMessage(null), 4000);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-error-container text-on-error-container flex items-center justify-center">
            <span className="material-symbols-outlined">ambulance</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
                STATION 05 • CONTINUITY OF CARE & REFERRALS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-error-container text-on-error-container">
                1 Active 108 ALS Transfer
              </span>
            </div>
            <h1 className="text-lg font-bold text-on-surface">
              Specialist Referral Escalation, ASHA Handover & Tertiary Hospital Loop
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTriggerAshaSms(activeReferral)}
            className="px-3.5 py-2 rounded-xl border border-primary text-primary text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/5"
          >
            <span className="material-symbols-outlined text-sm">sms</span>
            <span>Broadcast ASHA Digest</span>
          </button>
        </div>
      </div>

      {bannerMessage && (
        <div className="bg-primary-fixed border border-primary/30 text-on-primary-fixed px-4 py-3 rounded-xl flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">verified</span>
            <span>{bannerMessage}</span>
          </div>
          <button type="button" onClick={() => setBannerMessage(null)}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-error/30">
          <p className="text-xs font-bold uppercase tracking-wider text-error">
            Emergency 108 Transfers
          </p>
          <p className="text-2xl font-bold font-mono text-error mt-1">02</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            1 Admitted at ICCU • 1 In Transit
          </p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-secondary/30">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">
            48-Hr Urgent Specialist
          </p>
          <p className="text-2xl font-bold font-mono text-secondary mt-1">09</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Retina, High-Risk ANC, Nephrology
          </p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/25">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Taluk Surgical Bookings
          </p>
          <p className="text-2xl font-bold font-mono text-on-surface mt-1">18</p>
          <p className="text-xs text-primary font-semibold mt-0.5">
            14 Cataract • 4 Hernia / General
          </p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/25">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            ASHA Worker Assigned
          </p>
          <p className="text-2xl font-bold font-mono text-primary mt-1">100%</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            29/29 mapped to village ASHA node
          </p>
        </div>
      </div>

      {/* Main Grid: Left 7 Cols Referral Ledger, Right 5 Cols Referral Dossier & Handover Slip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl border border-outline-variant/25 overflow-hidden">
          <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'All Referrals' },
                { id: 'EMERGENCY_108', label: '108 Emergency' },
                { id: 'URGENT_48H', label: 'Urgent 48h' },
                { id: 'ROUTINE_OPD', label: 'Routine Surgical' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setUrgencyFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    urgencyFilter === tab.id
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, village..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant/40"
              />
            </div>
          </div>

          <div className="divide-y divide-outline-variant/15">
            {filteredReferrals.map((ref) => {
              const isSelected = ref.id === selectedReferralId;
              return (
                <div
                  key={ref.id}
                  onClick={() => setSelectedReferralId(ref.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/6 border-l-4 border-primary'
                      : 'hover:bg-surface-container-low/60'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary">{ref.token}</span>
                        <h3 className="text-sm font-bold text-on-surface">{ref.patientName}</h3>
                        <span className="text-xs text-on-surface-variant">
                          ({ref.ageGender} • {ref.village})
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-on-surface mt-1">
                        {ref.provisionalDiagnosis}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">domain</span>
                        <span>
                          {ref.targetFacility} — <strong>{ref.department}</strong>
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          ref.urgency === 'EMERGENCY_108'
                            ? 'bg-error text-on-error'
                            : ref.urgency === 'URGENT_48H'
                            ? 'bg-secondary-fixed text-on-secondary-fixed'
                            : 'bg-primary-fixed text-on-primary-fixed'
                        }`}
                      >
                        {ref.urgency.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        {ref.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Active Referral Escalation Slip & ASHA Tracking */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl border border-outline-variant/25 p-5 space-y-4">
          <div className="flex items-start justify-between border-b border-outline-variant/20 pb-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
                OFFICIAL REFERRAL TRANSIT SLIP • {activeReferral.id}
              </span>
              <h2 className="text-base font-bold text-on-surface mt-0.5">
                {activeReferral.patientName} ({activeReferral.ageGender})
              </h2>
              <p className="text-xs text-on-surface-variant">
                Village: {activeReferral.village} • Phone: {activeReferral.phone}
              </p>
            </div>
            <span className="font-mono text-sm font-bold bg-surface-container px-2.5 py-1 rounded">
              {activeReferral.token}
            </span>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl space-y-2 text-xs">
            <div>
              <span className="text-on-surface-variant font-semibold uppercase text-[10px]">
                Provisional Camp Diagnosis
              </span>
              <p className="font-bold text-on-surface text-sm mt-0.5">
                {activeReferral.provisionalDiagnosis}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/20">
              <div>
                <span className="text-on-surface-variant font-semibold uppercase text-[10px]">
                  Receiving Hospital
                </span>
                <p className="font-bold text-on-surface mt-0.5">{activeReferral.targetFacility}</p>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold uppercase text-[10px]">
                  Assigned Slot / Mode
                </span>
                <p className="font-bold text-primary mt-0.5">{activeReferral.appointmentDate}</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-outline-variant/25 bg-surface-container-lowest space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Pre-Referral Stabilization & Handover Notes
            </span>
            <p className="text-xs text-on-surface leading-relaxed">{activeReferral.notes}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-primary-fixed/40 border border-primary/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Assigned Village ASHA Coordinator
              </span>
              <p className="text-xs font-bold text-on-surface mt-0.5">
                {activeReferral.ashaWorker}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTriggerAshaSms(activeReferral)}
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold"
            >
              Send SMS Alert
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleAdvanceStatus(activeReferral.id)}
              className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>Mark Hospital Admission Confirmed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
