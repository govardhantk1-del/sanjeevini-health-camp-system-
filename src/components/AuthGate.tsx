import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  saveRegistrationAndPatientToFirestore,
} from '../lib/firebase';
import { useFirebaseData, UserProfile } from '../context/FirebaseContext';

export const AuthGate: React.FC = () => {
  const { updateUserProfile, setIsPatientPortal } = useFirebaseData();
  const [portalType, setPortalType] = useState<'clinician' | 'patient'>('clinician');
  
  // Clinician form state
  const [clinicianMode, setClinicianMode] = useState<'signin' | 'signup'>('signin');
  const [clinicianName, setClinicianName] = useState('Dr. Govardhan T K');
  const [clinicianRole, setClinicianRole] = useState<UserProfile['role']>('doctor');
  const [speciality, setSpeciality] = useState('General Medicine');
  const [licenseNumber, setLicenseNumber] = useState('KMC-2026-081');
  const [clinicianEmail, setClinicianEmail] = useState('');
  const [clinicianPassword, setClinicianPassword] = useState('');

  // Patient form state
  const [patientMode, setPatientMode] = useState<'signin' | 'register'>('signin');
  const [patientLookup, setPatientLookup] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  
  // New Patient registration fields
  const [patFullName, setPatFullName] = useState('');
  const [patPhone, setPatPhone] = useState('');
  const [patAge, setPatAge] = useState('');
  const [patGender, setPatGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [patVillage, setPatVillage] = useState('');
  const [patGovId, setPatGovId] = useState('');
  const [patSymptoms, setPatSymptoms] = useState('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showProviderGuide, setShowProviderGuide] = useState<boolean>(false);

  // Clinician Email Auth
  const handleClinicianEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setShowProviderGuide(false);

    const cleanEmail = clinicianEmail.trim();
    if (!cleanEmail || clinicianPassword.length < 6) {
      setErrorMsg('Please enter a valid email address and a password of at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (clinicianMode === 'signup') {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, clinicianPassword);
        updateUserProfile({
          uid: userCred.user.uid,
          email: cleanEmail,
          fullName: clinicianName.trim() || 'Clinician',
          role: clinicianRole,
          speciality,
          licenseNumber,
          hospitalAffiliation: 'Tumakuru District Health Mission',
        });
      } else {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, clinicianPassword);
        updateUserProfile({
          uid: userCred.user.uid,
          email: cleanEmail,
          role: clinicianRole,
        });
      }
      setIsPatientPortal(false);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setShowProviderGuide(true);
        setErrorMsg(
          'Email/Password sign-in is not yet enabled in the Firebase Console for this project. Enable it using the steps below, or use Google Sign-In or Demo Access.'
        );
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setErrorMsg('Invalid email or password. If you do not have an account yet, switch to "Create Account".');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Switch to "Sign In" to log in.');
      } else {
        setErrorMsg(err?.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In with safe handling of popup-closed-by-user
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      updateUserProfile({
        uid: userCred.user.uid,
        email: userCred.user.email || '',
        fullName: userCred.user.displayName || 'Dr. Clinician',
        role: portalType === 'patient' ? 'patient' : clinicianRole,
      });
      if (portalType === 'patient') {
        setIsPatientPortal(true);
      } else {
        setIsPatientPortal(false);
      }
    } catch (err: any) {
      const code = err?.code || '';
      // Gracefully handle auth/popup-closed-by-user without throwing an unhandled error
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setInfoMsg(
          'Google sign-in popup was closed before completing. You can click to try again, or use the Email & Password sign-in below.'
        );
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg(
          'The pop-up window was blocked by your browser. Please allow popups for this site, or use Email & Password sign-in below.'
        );
      } else {
        setErrorMsg(err?.message || 'Google Sign-In was cancelled or failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Patient Email/Password or Phone Auth
  const handlePatientAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (patientMode === 'register') {
      if (!patFullName.trim() || !patPhone.trim()) {
        setErrorMsg('Please enter your Full Name and Contact Phone Number.');
        return;
      }
      setLoading(true);
      try {
        // Try creating account if email provided, or sign in anonymously/existing
        const cleanEmail = patientEmail.trim() || `patient.${Date.now()}@sanjeevini.org`;
        const cleanPassword = patientPassword.length >= 6 ? patientPassword : `pass-${Date.now()}`;
        
        let uid = 'patient-' + Date.now();
        try {
          const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          uid = userCred.user.uid;
        } catch (authErr: any) {
          // If already in use, attempt sign in or proceed with current auth
          if (auth.currentUser) {
            uid = auth.currentUser.uid;
          }
        }

        const tokenNumber = `#T-${String(Math.floor(Math.random() * 800) + 100)}`;
        // Save patient registration to Firestore
        await saveRegistrationAndPatientToFirestore({
          token: tokenNumber,
          fullName: patFullName.trim(),
          phone: patPhone.trim(),
          dob: patAge.trim() || '40y',
          gender: patGender,
          village: patVillage.trim() || 'Camp Ward',
          govId: patGovId.trim() || 'Aadhaar: XXXX-XXXX-0000',
          arrivalSlot: '10:00 AM - 11:30 AM',
          symptoms: patSymptoms.trim() || 'General Health Checkup',
          status: 'queued',
        });

        updateUserProfile({
          uid,
          email: cleanEmail,
          fullName: patFullName.trim(),
          role: 'patient',
          phone: patPhone.trim(),
          age: patAge.trim(),
          gender: patGender,
          village: patVillage.trim(),
          patientToken: tokenNumber,
          emergencyContact: patPhone.trim(),
        });

        setIsPatientPortal(true);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Could not complete patient registration.');
      } finally {
        setLoading(false);
      }
    } else {
      // Patient Sign-In
      const cleanEmail = patientEmail.trim();
      if (!cleanEmail || patientPassword.length < 6) {
        setErrorMsg('Please enter your registered email address and password (at least 6 characters).');
        return;
      }
      setLoading(true);
      try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, patientPassword);
        updateUserProfile({
          uid: userCred.user.uid,
          email: cleanEmail,
          role: 'patient',
        });
        setIsPatientPortal(true);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Invalid credentials. If you are a new patient, choose "New Patient Registration".');
      } finally {
        setLoading(false);
      }
    }
  };

  // Demo Sign-In Helpers for instant friction-free testing
  const handleQuickDemoClinician = async () => {
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      // Use existing demo or sign in
      const demoEmail = 'doctor.meera@sanjeevini.org';
      const demoPass = 'Clinician2026!';
      try {
        await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      } catch {
        try {
          await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        } catch {
          // If auth rules or provider disabled, simulate authenticated user session
        }
      }
      updateUserProfile({
        fullName: clinicianName || 'Dr. Meera Nair, MD',
        role: clinicianRole || 'doctor',
        speciality: 'General Medicine & Diabetology',
        licenseNumber: 'KMC-2026-081',
        hospitalAffiliation: 'Tumakuru District Health Mission',
        opdRoom: 'Room 2 • OPD',
      });
      setIsPatientPortal(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoPatient = async () => {
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const demoEmail = 'patient.lakshmamma@sanjeevini.org';
      const demoPass = 'Patient2026!';
      try {
        await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      } catch {
        try {
          await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        } catch {
          // fallback
        }
      }
      updateUserProfile({
        fullName: 'Lakshmamma Gowda',
        role: 'patient',
        phone: '+91 98450 12345',
        age: '52y',
        gender: 'Female',
        village: 'Hosahalli Village, Tumakuru',
        patientToken: '#T-042',
        emergencyContact: '+91 98450 99881 (Son: Manjunath)',
        bloodGroup: 'B+',
        allergies: 'Penicillin Allergy',
      });
      setIsPatientPortal(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Demo patient access failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-surface flex flex-col justify-center items-center p-3 sm:p-6 py-8">
      <div className="w-full max-w-xl bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden">
        {/* Brand Banner */}
        <div className="bg-primary text-on-primary p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <BrandLogo className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-85 block font-bold">
                TUMAKURU RURAL OUTREACH • FIRESTORE CLOUD
              </span>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                Sanjeevini Health Camp System
              </h1>
            </div>
          </div>
          <p className="text-xs text-on-primary/85 mt-2.5 leading-relaxed">
            Select your portal below to sign in. Clinicians access triage and consultation consoles; patients access their live camp pass, vitals, and prescriptions.
          </p>

          {/* TWO DEDICATED PORTAL TABS */}
          <div className="grid grid-cols-2 gap-2 mt-4 bg-black/20 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setPortalType('clinician');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                portalType === 'clinician'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-primary/80 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">stethoscope</span>
              <span>Doctor / Clinician Portal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalType('patient');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                portalType === 'patient'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-primary/80 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">person</span>
              <span>Patient &amp; Family Portal</span>
            </button>
          </div>
        </div>

        {/* Informative Messages & Friendly Popup Notices */}
        <div className="p-5 sm:p-6 space-y-4">
          {infoMsg && (
            <div className="p-3.5 rounded-xl bg-primary-container/30 border border-primary/30 text-on-surface text-xs font-medium flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">
                info
              </span>
              <div className="flex-1">
                <p className="text-on-surface font-semibold">{infoMsg}</p>
              </div>
              <button
                type="button"
                onClick={() => setInfoMsg(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-medium space-y-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                <span className="flex-1">{errorMsg}</span>
              </div>
              {showProviderGuide && (
                <div className="bg-white/80 text-stone-900 p-3 rounded-lg text-[11px] space-y-1 border border-error/20">
                  <p className="font-bold">How to enable Email/Password in Firebase Console:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Open Firebase Console &rarr; Authentication &rarr; Sign-in method.</li>
                    <li>Click <strong>Add new provider</strong> &rarr; select <strong>Email/Password</strong>.</li>
                    <li>Toggle <strong>Enable</strong> and click <strong>Save</strong>.</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* PORTAL 1: DOCTOR / CLINICIAN / ADMIN PORTAL                 */}
          {/* ============================================================ */}
          {portalType === 'clinician' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Clinician &amp; Staff Console</h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Access Volunteer Desk, OPD Consultation, Pharmacy &amp; Analytics
                  </p>
                </div>
                <div className="flex gap-1 bg-surface-container p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setClinicianMode('signin');
                      setErrorMsg(null);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      clinicianMode === 'signin'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClinicianMode('signup');
                      setErrorMsg(null);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      clinicianMode === 'signup'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    Register Staff
                  </button>
                </div>
              </div>

              <form onSubmit={handleClinicianEmailAuth} className="space-y-3.5">
                {clinicianMode === 'signup' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Doctor / Clinician Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={clinicianName}
                        onChange={(e) => setClinicianName(e.target.value)}
                        placeholder="Dr. Govardhan T K"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Clinical Role
                      </label>
                      <select
                        value={clinicianRole}
                        onChange={(e) => setClinicianRole(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      >
                        <option value="doctor">Doctor (General Physician / OPD)</option>
                        <option value="clinician">Specialist Consultant (Cardio/Ortho)</option>
                        <option value="nurse">Triage Nurse / ANM</option>
                        <option value="pharmacist">Camp Pharmacist</option>
                        <option value="admin">Camp Administrator / Medical Officer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Medical Council / Staff ID
                      </label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="KMC-2026-081"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Department / Speciality
                      </label>
                      <input
                        type="text"
                        value={speciality}
                        onChange={(e) => setSpeciality(e.target.value)}
                        placeholder="General Medicine"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Clinician Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={clinicianEmail}
                      onChange={(e) => setClinicianEmail(e.target.value)}
                      placeholder="doctor@sanjeevini.org"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                      lock
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={clinicianPassword}
                      onChange={(e) => setClinicianPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-base">
                    {clinicianMode === 'signup' ? 'badge' : 'login'}
                  </span>
                  <span>
                    {loading
                      ? 'Authenticating...'
                      : clinicianMode === 'signup'
                      ? 'Create Clinician Profile & Enter Workstation'
                      : 'Sign In to Clinical Stations'}
                  </span>
                </button>
              </form>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-outline-variant/30 w-full" />
                <span className="bg-surface-container-lowest px-2 text-[10px] font-mono uppercase text-on-surface-variant">
                  OR USE GOOGLE
                </span>
                <div className="border-t border-outline-variant/30 w-full" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 px-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-primary">verified_user</span>
                  <span>Continue with Google</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickDemoClinician}
                  disabled={loading}
                  className="w-full py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs flex items-center justify-center gap-2 border border-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">local_hospital</span>
                  <span>Quick Clinician Access</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PORTAL 2: PATIENT & FAMILY PORTAL                           */}
          {/* ============================================================ */}
          {portalType === 'patient' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Patient Health Portal</h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Access your live camp token, vitals, prescriptions &amp; digital pass
                  </p>
                </div>
                <div className="flex gap-1 bg-surface-container p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setPatientMode('signin');
                      setErrorMsg(null);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      patientMode === 'signin'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    Existing Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPatientMode('register');
                      setErrorMsg(null);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      patientMode === 'register'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    New Patient Register
                  </button>
                </div>
              </div>

              {patientMode === 'register' ? (
                /* Patient Direct Self-Registration */
                <form onSubmit={handlePatientAuth} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Patient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={patFullName}
                        onChange={(e) => setPatFullName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Mobile Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={patPhone}
                        onChange={(e) => setPatPhone(e.target.value)}
                        placeholder="+91 98450 12345"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Age (e.g. 45y)
                      </label>
                      <input
                        type="text"
                        value={patAge}
                        onChange={(e) => setPatAge(e.target.value)}
                        placeholder="45y"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Gender
                      </label>
                      <select
                        value={patGender}
                        onChange={(e) => setPatGender(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Village / Ward / Taluk
                      </label>
                      <input
                        type="text"
                        value={patVillage}
                        onChange={(e) => setPatVillage(e.target.value)}
                        placeholder="Holavanahalli Village, Tumakuru"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Aadhaar (Last 4) or Govt ID
                      </label>
                      <input
                        type="text"
                        value={patGovId}
                        onChange={(e) => setPatGovId(e.target.value)}
                        placeholder="Aadhaar: 8921"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Chief Symptoms / Reason for Visit
                    </label>
                    <input
                      type="text"
                      value={patSymptoms}
                      onChange={(e) => setPatSymptoms(e.target.value)}
                      placeholder="e.g. Headache, High BP, Joint Pain, General Checkup"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Account Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="patient@example.com"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Portal PIN / Password
                      </label>
                      <input
                        type="password"
                        value={patientPassword}
                        onChange={(e) => setPatientPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-60 mt-2"
                  >
                    <span className="material-symbols-outlined text-base">how_to_reg</span>
                    <span>
                      {loading ? 'Registering Patient...' : 'Register Patient & Generate Live Camp Pass'}
                    </span>
                  </button>
                </form>
              ) : (
                /* Patient Sign In */
                <form onSubmit={handlePatientAuth} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Patient Registered Email
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                        mail
                      </span>
                      <input
                        type="email"
                        required
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="patient@example.com"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Password / Security PIN
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                        lock
                      </span>
                      <input
                        type="password"
                        required
                        value={patientPassword}
                        onChange={(e) => setPatientPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-on-surface font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-base">login</span>
                    <span>{loading ? 'Accessing Pass...' : 'Sign In to View My Camp Pass & Vitals'}</span>
                  </button>
                </form>
              )}

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-outline-variant/30 w-full" />
                <span className="bg-surface-container-lowest px-2 text-[10px] font-mono uppercase text-on-surface-variant">
                  OR QUICK ACCESS
                </span>
                <div className="border-t border-outline-variant/30 w-full" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 px-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-primary">verified_user</span>
                  <span>Continue with Google</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickDemoPatient}
                  disabled={loading}
                  className="w-full py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs flex items-center justify-center gap-2 border border-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  <span>Quick Patient Demo Pass</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
