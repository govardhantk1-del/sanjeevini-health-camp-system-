import React, { useState } from 'react';
import { useFirebaseData } from '../context/FirebaseContext';
import { UserProfileModal } from './UserProfileModal';
import { BrandLogo } from './BrandLogo';
import { auth, signOut } from '../lib/firebase';

interface PatientPortalViewProps {
  onSwitchToClinician?: () => void;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({ onSwitchToClinician }) => {
  const { user, userProfile, activePatient, patients, setIsPatientPortal } = useFirebaseData();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Derive patient record: matching userProfile.patientToken or first entered patient, or userProfile info
  const myRecord =
    patients.find(
      (p) =>
        (userProfile?.patientToken && p.token === userProfile.patientToken) ||
        (userProfile?.phone && p.phone === userProfile.phone) ||
        (userProfile?.fullName && p.fullName.toLowerCase() === userProfile.fullName.toLowerCase())
    ) ||
    activePatient ||
    null;

  const displayName = myRecord?.fullName || userProfile?.fullName || 'Patient';
  const displayToken = myRecord?.token || userProfile?.patientToken || '#T-042';
  const displayAge = myRecord?.age || userProfile?.age || '45y';
  const displayGender = myRecord?.gender || userProfile?.gender || 'Female';
  const displayVillage = myRecord?.village || userProfile?.village || 'Holavanahalli Village, Tumakuru';
  const displayPhone = myRecord?.phone || userProfile?.phone || '+91 98450 12345';
  const displayVitals = myRecord?.vitalsSummary || 'Pending Triage Vitals at Station 02';
  const displayDiagnosis = myRecord?.diagnosis || 'Pending Doctor OPD Consultation at Station 03';
  const displayRx = myRecord?.prescriptionSummary || 'Pending Pharmacy Dispensing at Station 04';
  const status = myRecord?.status || 'registered';

  const handleCopy = () => {
    navigator.clipboard?.writeText(displayToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 1500);
  };

  return (
    <div className="min-h-dvh bg-surface text-on-surface pb-12">
      {/* Top Patient Header */}
      <header className="sticky top-0 inset-x-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/25 z-40 px-4 sm:px-6 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <BrandLogo className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-on-surface">Sanjeevini Patient Pass</span>
              <span className="bg-primary-container text-on-primary-container text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                LIVE PASS
              </span>
            </div>
            <p className="text-xs text-on-surface-variant truncate">
              {displayName} • Token <span className="font-mono font-bold text-primary">{displayToken}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            <span className="hidden sm:inline">Edit My Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPatientPortal(false);
              onSwitchToClinician?.();
            }}
            className="px-3 py-1.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Switch to Clinician Console"
          >
            <span className="material-symbols-outlined text-base">stethoscope</span>
            <span className="hidden md:inline">Clinician View</span>
          </button>

          <button
            type="button"
            onClick={() => signOut(auth)}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-base">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner with Switch / Edit option */}
        <div className="bg-primary/10 border border-primary/25 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">verified_user</span>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-primary font-bold">
                TUMAKURU DISTRICT HEALTH OUTREACH
              </p>
              <h1 className="text-base font-bold text-on-surface">
                Welcome, {displayName}! Your Live Camp Records
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-sm">manage_accounts</span>
            <span>Update Profile Details</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* 1. DIGITAL CAMP PASS & TOKEN                                  */}
        {/* ============================================================== */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant block mb-1">
                CAMP ENTRY TOKEN NUMBER
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl font-mono font-bold text-primary tracking-wider">
                  {displayToken}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-mono font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  {copiedToken ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-surface-container-low p-3 rounded-xl">
              <div className="w-12 h-12 bg-white rounded-lg p-1 border border-outline-variant/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-3xl text-primary">qr_code_2</span>
              </div>
              <div className="text-xs">
                <p className="font-bold text-on-surface">Fast-Track QR Scan</p>
                <p className="text-on-surface-variant text-[11px]">Show this to station volunteers</p>
              </div>
            </div>
          </div>

          {/* Patient Bio Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
            <div>
              <p className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">
                Patient Name
              </p>
              <p className="text-sm font-bold text-on-surface mt-0.5">{displayName}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">
                Age &amp; Gender
              </p>
              <p className="text-sm font-semibold text-on-surface mt-0.5">
                {displayAge} • {displayGender}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">
                Phone
              </p>
              <p className="text-sm font-mono text-on-surface mt-0.5">{displayPhone}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">
                Village / Ward
              </p>
              <p className="text-sm text-on-surface truncate mt-0.5">{displayVillage}</p>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. CAMP WORKFLOW STATUS TRACKER                               */}
        {/* ============================================================== */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-primary font-bold">
            Live Station Progress &amp; Queue Tracker
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-primary-container text-on-primary-container border border-primary/20 text-xs">
              <div className="flex items-center justify-between font-bold mb-1">
                <span>01. Intake Desk</span>
                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
              </div>
              <p className="text-[11px] opacity-90">Token #{displayToken} Assigned</p>
            </div>

            <div
              className={`p-3 rounded-xl text-xs border ${
                status === 'triaged' || status === 'consulted' || status === 'completed'
                  ? 'bg-primary-container text-on-primary-container border-primary/20'
                  : 'bg-surface-container-low text-on-surface border-outline-variant/30'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>02. Triage Vitals</span>
                <span className="material-symbols-outlined text-sm">
                  {status === 'triaged' || status === 'consulted' || status === 'completed'
                    ? 'check_circle'
                    : 'schedule'}
                </span>
              </div>
              <p className="text-[11px] opacity-80">
                {status === 'triaged' || status === 'consulted' || status === 'completed'
                  ? 'Vitals Captured'
                  : 'Awaiting Station 02'}
              </p>
            </div>

            <div
              className={`p-3 rounded-xl text-xs border ${
                status === 'consulted' || status === 'completed'
                  ? 'bg-primary-container text-on-primary-container border-primary/20'
                  : 'bg-surface-container-low text-on-surface border-outline-variant/30'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>03. Doctor OPD</span>
                <span className="material-symbols-outlined text-sm">
                  {status === 'consulted' || status === 'completed' ? 'check_circle' : 'schedule'}
                </span>
              </div>
              <p className="text-[11px] opacity-80">
                {status === 'consulted' || status === 'completed'
                  ? 'Consultation Completed'
                  : 'Room 2 • Dr. Meera Nair'}
              </p>
            </div>

            <div
              className={`p-3 rounded-xl text-xs border ${
                status === 'completed'
                  ? 'bg-primary-container text-on-primary-container border-primary/20'
                  : 'bg-surface-container-low text-on-surface border-outline-variant/30'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>04. Pharmacy</span>
                <span className="material-symbols-outlined text-sm">
                  {status === 'completed' ? 'check_circle' : 'schedule'}
                </span>
              </div>
              <p className="text-[11px] opacity-80">
                {status === 'completed' ? 'Medications Dispensed' : 'Counter 1 Ready'}
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. VITALS, DOCTOR NOTES & PRESCRIPTION                        */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Vitals Record */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <span className="material-symbols-outlined">vital_signs</span>
              <span>Triage &amp; Clinical Vitals</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs">
              <p className="font-mono text-on-surface leading-relaxed">{displayVitals}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase block">
                  Blood Group
                </span>
                <span className="font-bold text-on-surface text-sm">
                  {userProfile?.bloodGroup || 'B+'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase block">
                  Allergies
                </span>
                <span className="font-semibold text-error text-xs">
                  {userProfile?.allergies || 'Penicillin Allergy'}
                </span>
              </div>
            </div>
          </div>

          {/* Doctor Consultation Notes & Prescriptions */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <span className="material-symbols-outlined">medication</span>
              <span>Doctor Diagnosis &amp; Prescriptions</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-on-surface-variant font-bold uppercase block mb-1">
                  Primary Diagnosis
                </span>
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-on-surface font-semibold">{displayDiagnosis}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-on-surface-variant font-bold uppercase block mb-1">
                  Prescribed Medication Regimen
                </span>
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-on-surface leading-relaxed">{displayRx}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* User Profile Modal */}
      <UserProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
};
