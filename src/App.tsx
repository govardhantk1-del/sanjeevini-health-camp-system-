/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrandLogo } from './components/BrandLogo';
import { CampOverviewSlide } from './components/CampOverviewSlide';
import { VolunteerDeskSlide } from './components/VolunteerDeskSlide';
import { VoiceAiIntakeSlide } from './components/VoiceAiIntakeSlide';
import { TriageVitalsSlide } from './components/TriageVitalsSlide';
import { DoctorConsultationSlide } from './components/DoctorConsultationSlide';
import { PatientDossierSlide } from './components/PatientDossierSlide';
import { PharmacyDispensingSlide } from './components/PharmacyDispensingSlide';
import { ReferralTrackerSlide } from './components/ReferralTrackerSlide';
import { CampAnalyticsSlide } from './components/CampAnalyticsSlide';
import { CampAdminSlide } from './components/CampAdminSlide';
import { FirebaseProvider, useFirebaseData } from './context/FirebaseContext';
import { AuthGate } from './components/AuthGate';
import { UserProfileModal } from './components/UserProfileModal';
import { PatientPortalView } from './components/PatientPortalView';
import { auth, signOut } from './lib/firebase';

export type StationId =
  | 'overview'
  | 'volunteer'
  | 'voice-ai'
  | 'triage'
  | 'consultation'
  | 'dossier'
  | 'pharmacy'
  | 'referrals'
  | 'analytics'
  | 'admin';

interface StationNavItem {
  id: StationId;
  label: string;
  shortLabel: string;
  stationCode: string;
  icon: string;
  group: 'INTAKE' | 'CLINICAL' | 'OPERATIONS';
  badge?: string;
}

const STATION_ITEMS: StationNavItem[] = [
  {
    id: 'overview',
    label: 'Patient Registration & Pass',
    shortLabel: 'Register',
    stationCode: 'Station 01 • Public Portal',
    icon: 'how_to_reg',
    group: 'INTAKE',
  },
  {
    id: 'volunteer',
    label: 'Volunteer Desk & 80mm Slip',
    shortLabel: 'Desk Queue',
    stationCode: 'Station 01 • Token Counter',
    icon: 'badge',
    group: 'INTAKE',
    badge: '312',
  },
  {
    id: 'voice-ai',
    label: 'Voice AI Clinical Intake',
    shortLabel: 'Voice AI',
    stationCode: 'Station 01 • Speech Intake',
    icon: 'record_voice_over',
    group: 'INTAKE',
    badge: 'KN/HI',
  },
  {
    id: 'triage',
    label: 'Triage & Vitals Station 02',
    shortLabel: 'Vitals',
    stationCode: 'Station 02 • Pre-Clinical',
    icon: 'monitor_heart',
    group: 'CLINICAL',
  },
  {
    id: 'consultation',
    label: 'Doctor Consultation Room',
    shortLabel: 'Doctor Rx',
    stationCode: 'Station 03 • OPD Console',
    icon: 'stethoscope',
    group: 'CLINICAL',
    badge: '#T-042',
  },
  {
    id: 'dossier',
    label: 'Longitudinal EHR Dossier',
    shortLabel: 'EHR Dossier',
    stationCode: 'Patient Health Record',
    icon: 'folder_shared',
    group: 'CLINICAL',
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy & Dosage Labels',
    shortLabel: 'Pharmacy',
    stationCode: 'Station 04 • Dispensing',
    icon: 'medication',
    group: 'CLINICAL',
    badge: '4 Wait',
  },
  {
    id: 'referrals',
    label: 'Specialist & 108 Referrals',
    shortLabel: 'Referrals',
    stationCode: 'Station 05 • Escalation',
    icon: 'ambulance',
    group: 'CLINICAL',
  },
  {
    id: 'analytics',
    label: 'Camp Analytics & DHO Reports',
    shortLabel: 'Analytics',
    stationCode: 'Epidemiology Telemetry',
    icon: 'analytics',
    group: 'OPERATIONS',
  },
  {
    id: 'admin',
    label: 'Multi-Site & Mesh Admin',
    shortLabel: 'Mesh Admin',
    stationCode: 'Operations & Roster',
    icon: 'hub',
    group: 'OPERATIONS',
  },
];

function AuthenticatedAppShell() {
  const {
    user,
    authReady,
    patients,
    camps,
    registrations,
    userProfile,
    isPatientPortal,
    setIsPatientPortal,
  } = useFirebaseData();
  const [activeStation, setActiveStation] = useState<StationId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);

  if (!authReady) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm font-semibold text-primary">
          <span className="material-symbols-outlined animate-spin">sync</span>
          <span>Connecting to Sanjeevini Firestore &amp; Auth...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  if (isPatientPortal) {
    return (
      <>
        <PatientPortalView onSwitchToClinician={() => setIsPatientPortal(false)} />
        <UserProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      </>
    );
  }

  const handleStationSelect = (station: string) => {
    const valid = STATION_ITEMS.find((s) => s.id === station);
    if (valid) {
      setActiveStation(valid.id);
    } else {
      setActiveStation('overview');
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentStationMeta =
    STATION_ITEMS.find((s) => s.id === activeStation) || STATION_ITEMS[0];

  return (
    <div className="min-h-dvh bg-surface text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Top Fixed Clinical Command Header */}
      <header className="fixed top-0 inset-x-0 h-14 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/25 z-40 px-3 sm:px-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile / Tablet Drawer Toggle (< 1024px) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Toggle Station Navigation Drawer"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStationSelect('overview')}
            className="flex items-center gap-2.5 text-left min-w-0"
          >
            <BrandLogo className="w-8 h-8" />
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-on-surface truncate">
                  Sanjeevini
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-bold">
                  Firestore Live
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant truncate hidden md:block">
                Holavanahalli Camp #04 • {patients.length} patients • {registrations.length} registrations • {camps.length} camps
              </p>
            </div>
          </button>
        </div>

        {/* Center / Right Quick Station Switcher & User Auth Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Station Dropdown */}
          <div className="flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl px-2.5 py-1">
            <span className="material-symbols-outlined text-primary text-sm hidden sm:inline">
              layers
            </span>
            <label htmlFor="station-select" className="sr-only">
              Select Clinical Station
            </label>
            <select
              id="station-select"
              value={activeStation}
              onChange={(e) => handleStationSelect(e.target.value)}
              className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none pr-1 max-w-[140px] sm:max-w-none"
            >
              {STATION_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* User Profile & Role Badge */}
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors"
            title="Edit Profile (Admin, Doctor, Clinician, or Patient)"
          >
            <span className="material-symbols-outlined text-sm text-primary">account_circle</span>
            <span className="hidden md:inline truncate max-w-[120px]">
              {userProfile?.fullName || 'Profile'}
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-bold">
              {userProfile?.role || 'doctor'}
            </span>
          </button>

          {/* Switch to Patient Portal */}
          <button
            type="button"
            onClick={() => setIsPatientPortal(true)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container text-xs font-semibold text-primary"
            title="Switch to Patient Portal"
          >
            <span className="material-symbols-outlined text-sm">badge</span>
            <span>Patient View</span>
          </button>

          <button
            type="button"
            onClick={() => signOut(auth)}
            className="px-2.5 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Mobile & Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-surface-container-lowest h-full shadow-2xl border-r border-outline-variant/25 flex flex-col z-10 overflow-y-auto">
            <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BrandLogo className="w-7 h-7" />
                <div>
                  <p className="font-bold text-sm text-on-surface">Sanjeevini Stations</p>
                  <p className="text-[11px] font-mono text-on-surface-variant truncate max-w-[160px]">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-3 space-y-4 flex-1">
              {(['INTAKE', 'CLINICAL', 'OPERATIONS'] as const).map((group) => (
                <div key={group}>
                  <p className="px-2.5 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-bold mb-1.5">
                    {group === 'INTAKE'
                      ? '01 • Registration & Intake'
                      : group === 'CLINICAL'
                      ? '02 • Clinical Care & Pharmacy'
                      : '03 • Telemetry & Operations'}
                  </p>
                  <div className="space-y-1">
                    {STATION_ITEMS.filter((i) => i.group === group).map((item) => {
                      const active = item.id === activeStation;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleStationSelect(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                            active
                              ? 'bg-primary text-on-primary shadow-xs'
                              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="material-symbols-outlined text-[18px] shrink-0">
                              {item.icon}
                            </span>
                            <div className="truncate">
                              <p className="truncate">{item.label}</p>
                              <p
                                className={`text-[10px] font-mono ${
                                  active ? 'text-on-primary/80' : 'text-on-surface-variant/70'
                                }`}
                              >
                                {item.stationCode}
                              </p>
                            </div>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                                active
                                  ? 'bg-white/20 text-white'
                                  : 'bg-surface-container-high text-on-surface'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Left Fixed Sidebar (Controlled by CSS Media Query .app-sidebar-desktop >= 1024px) */}
      <aside className="app-sidebar-desktop fixed top-14 left-0 bottom-0 w-60 bg-surface-container-lowest border-r border-outline-variant/25 flex-col justify-between z-30 overflow-y-auto">
        <div className="p-3 space-y-4">
          {(['INTAKE', 'CLINICAL', 'OPERATIONS'] as const).map((group) => (
            <div key={group}>
              <p className="px-2.5 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-bold mb-1.5">
                {group === 'INTAKE'
                  ? '01 • Registration & Intake'
                  : group === 'CLINICAL'
                  ? '02 • Clinical Stations'
                  : '03 • Admin & Telemetry'}
              </p>
              <div className="space-y-0.5">
                {STATION_ITEMS.filter((i) => i.group === group).map((item) => {
                  const active = item.id === activeStation;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleStationSelect(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                        active
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="material-symbols-outlined text-[18px] shrink-0">
                          {item.icon}
                        </span>
                        <div className="truncate">
                          <p className="truncate leading-tight">{item.label}</p>
                          <p
                            className={`text-[10px] font-mono ${
                              active ? 'text-on-primary/75' : 'text-on-surface-variant/70'
                            }`}
                          >
                            {item.stationCode}
                          </p>
                        </div>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Firestore Sync Status Footer */}
        <div className="p-3 m-3 rounded-xl bg-surface-container-low border border-outline-variant/25 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-primary">
              Firestore Connected
            </span>
            <span className="font-mono text-[10px] font-bold text-primary">LIVE</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-snug">
            patients: {patients.length} • registrations: {registrations.length} • camps: {camps.length}
          </p>
        </div>
      </aside>

      {/* Main Responsive Content Container */}
      <main className="app-shell-main">
        <div className="max-w-[1440px] mx-auto pt-3">
          {/* Active Station Bar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 bg-surface-container-low/80 border border-outline-variant/20 rounded-xl px-3.5 py-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold text-primary uppercase">
                {currentStationMeta.stationCode}
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-semibold text-on-surface">{currentStationMeta.label}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const idx = STATION_ITEMS.findIndex((s) => s.id === activeStation);
                  const prevIdx = (idx - 1 + STATION_ITEMS.length) % STATION_ITEMS.length;
                  handleStationSelect(STATION_ITEMS[prevIdx].id);
                }}
                className="px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                <span>Prev Station</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const idx = STATION_ITEMS.findIndex((s) => s.id === activeStation);
                  const nextIdx = (idx + 1) % STATION_ITEMS.length;
                  handleStationSelect(STATION_ITEMS[nextIdx].id);
                }}
                className="px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-1"
              >
                <span>Next Station</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Active Station View */}
          {activeStation === 'overview' && (
            <CampOverviewSlide onNavigate={handleStationSelect} />
          )}
          {activeStation === 'volunteer' && (
            <VolunteerDeskSlide onNavigate={handleStationSelect} />
          )}
          {activeStation === 'voice-ai' && (
            <VoiceAiIntakeSlide onNavigate={handleStationSelect} />
          )}
          {activeStation === 'triage' && (
            <TriageVitalsSlide onNavigate={handleStationSelect} />
          )}
          {activeStation === 'consultation' && (
            <DoctorConsultationSlide onNavigate={handleStationSelect} />
          )}
          {activeStation === 'dossier' && <PatientDossierSlide />}
          {activeStation === 'pharmacy' && (
            <PharmacyDispensingSlide onNavigate={handleStationSelect} />
          )}
          {activeStation === 'referrals' && <ReferralTrackerSlide />}
          {activeStation === 'analytics' && <CampAnalyticsSlide />}
          {activeStation === 'admin' && <CampAdminSlide />}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Controlled by CSS Media Query .app-bottom-nav-mobile < 1024px) */}
      <nav
        aria-label="Mobile Primary Stations"
        className="app-bottom-nav-mobile fixed bottom-0 inset-x-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 z-40 items-center justify-around px-1"
      >
        {[
          STATION_ITEMS[0], // Register
          STATION_ITEMS[1], // Desk Queue
          STATION_ITEMS[3], // Vitals
          STATION_ITEMS[4], // Doctor Rx
          STATION_ITEMS[6], // Pharmacy
        ].map((item) => {
          const active = item.id === activeStation;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleStationSelect(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
                active ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-[10px] mt-0.5 truncate max-w-[64px]">{item.shortLabel}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-xl">grid_view</span>
          <span className="text-[10px] mt-0.5">Stations</span>
        </button>
      </nav>

      {/* Profile Edit Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AuthenticatedAppShell />
    </FirebaseProvider>
  );
}
