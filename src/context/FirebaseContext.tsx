import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  User,
  collection,
  query,
  where,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  ensureDefaultCampExists,
} from '../lib/firebase';

export interface FirestorePatientDoc {
  id: string;
  ownerId: string;
  token: string;
  fullName: string;
  phone: string;
  age: string;
  gender: 'Female' | 'Male' | 'Other';
  village: string;
  aadhaarLast4: string;
  department: string;
  vitalsSummary: string;
  diagnosis: string;
  prescriptionSummary: string;
  status: 'registered' | 'triaged' | 'consulted' | 'completed';
}

export interface FirestoreCampDoc {
  id: string;
  ownerId: string;
  campCode: string;
  taluk: string;
  location: string;
  campDate: string;
  meshStatus: 'ONLINE_MESH' | 'SYNC_PENDING' | 'PROVISIONING' | 'COMPLETED';
  registeredCount: number;
  targetCapacity: number;
  doctorsAssigned: number;
  volunteersAssigned: number;
  piNodeIp: string;
  status: 'active' | 'provisioning' | 'completed';
}

export interface FirestoreRegistrationDoc {
  id: string;
  ownerId: string;
  patientId: string;
  campId: string;
  token: string;
  fullName: string;
  phone: string;
  dob: string;
  gender: 'Female' | 'Male' | 'Other';
  village: string;
  govId: string;
  arrivalSlot: string;
  symptoms: string;
  status: 'queued' | 'checked-in' | 'completed';
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: 'doctor' | 'clinician' | 'nurse' | 'pharmacist' | 'admin' | 'patient';
  speciality?: string;
  licenseNumber?: string;
  phone?: string;
  village?: string;
  age?: string;
  gender?: 'Female' | 'Male' | 'Other';
  hospitalAffiliation?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  allergies?: string;
  patientToken?: string;
  opdRoom?: string;
}

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  patients: FirestorePatientDoc[];
  camps: FirestoreCampDoc[];
  registrations: FirestoreRegistrationDoc[];
  defaultCampId: string | null;
  userProfile: UserProfile | null;
  updateUserProfile: (profileUpdates: Partial<UserProfile>) => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  activePatient: FirestorePatientDoc | null;
  isPatientPortal: boolean;
  setIsPatientPortal: (value: boolean) => void;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  user: null,
  authReady: false,
  patients: [],
  camps: [],
  registrations: [],
  defaultCampId: null,
  userProfile: null,
  updateUserProfile: () => {},
  selectedPatientId: null,
  setSelectedPatientId: () => {},
  activePatient: null,
  isPatientPortal: false,
  setIsPatientPortal: () => {},
});

const PROFILE_STORAGE_KEY_PREFIX = 'sanjeevini_user_profile_';

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [patients, setPatients] = useState<FirestorePatientDoc[]>([]);
  const [camps, setCamps] = useState<FirestoreCampDoc[]>([]);
  const [registrations, setRegistrations] = useState<FirestoreRegistrationDoc[]>([]);
  const [defaultCampId, setDefaultCampId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isPatientPortal, setIsPatientPortal] = useState<boolean>(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser) {
        // Load stored profile or initialize default
        try {
          const stored = localStorage.getItem(`${PROFILE_STORAGE_KEY_PREFIX}${currentUser.uid}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            setUserProfile(parsed);
            if (parsed.role === 'patient') {
              setIsPatientPortal(true);
            }
          } else {
            const defaultProf: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              fullName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Clinician'),
              role: 'doctor',
              speciality: 'General Medicine',
              licenseNumber: 'KMC-2026-081',
              hospitalAffiliation: 'Tumakuru District Health Mission',
              opdRoom: 'Room 2 • OPD',
            };
            setUserProfile(defaultProf);
            localStorage.setItem(`${PROFILE_STORAGE_KEY_PREFIX}${currentUser.uid}`, JSON.stringify(defaultProf));
          }
        } catch {
          // fallback
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubAuth();
  }, []);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const merged: UserProfile = {
        uid: prev?.uid || user?.uid || 'guest-user',
        email: prev?.email || user?.email || '',
        fullName: updates.fullName !== undefined ? updates.fullName : (prev?.fullName || 'User'),
        role: updates.role || prev?.role || 'doctor',
        speciality: updates.speciality !== undefined ? updates.speciality : prev?.speciality,
        licenseNumber: updates.licenseNumber !== undefined ? updates.licenseNumber : prev?.licenseNumber,
        phone: updates.phone !== undefined ? updates.phone : prev?.phone,
        village: updates.village !== undefined ? updates.village : prev?.village,
        age: updates.age !== undefined ? updates.age : prev?.age,
        gender: updates.gender !== undefined ? updates.gender : prev?.gender,
        hospitalAffiliation: updates.hospitalAffiliation !== undefined ? updates.hospitalAffiliation : prev?.hospitalAffiliation,
        emergencyContact: updates.emergencyContact !== undefined ? updates.emergencyContact : prev?.emergencyContact,
        bloodGroup: updates.bloodGroup !== undefined ? updates.bloodGroup : prev?.bloodGroup,
        allergies: updates.allergies !== undefined ? updates.allergies : prev?.allergies,
        patientToken: updates.patientToken !== undefined ? updates.patientToken : prev?.patientToken,
        opdRoom: updates.opdRoom !== undefined ? updates.opdRoom : prev?.opdRoom,
      };

      const storageKey = user?.uid
        ? `${PROFILE_STORAGE_KEY_PREFIX}${user.uid}`
        : `${PROFILE_STORAGE_KEY_PREFIX}guest`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } catch {
        // ignore
      }

      if (merged.role === 'patient') {
        setIsPatientPortal(true);
      }

      return merged;
    });
  };

  useEffect(() => {
    if (!authReady || !user) {
      setPatients([]);
      setCamps([]);
      setRegistrations([]);
      setDefaultCampId(null);
      return;
    }

    let isMounted = true;
    ensureDefaultCampExists(user.uid)
      .then((cId) => {
        if (isMounted) setDefaultCampId(cId);
      })
      .catch((err) => {
        console.error('Failed to initialize default camp:', err);
      });

    const patientsQuery = query(
      collection(db, 'patients'),
      where('ownerId', '==', user.uid)
    );
    const unsubPatients = onSnapshot(
      patientsQuery,
      (snap) => {
        const docs: FirestorePatientDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FirestorePatientDoc, 'id'>),
        }));
        setPatients(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'patients');
      }
    );

    const campsQuery = query(
      collection(db, 'camps'),
      where('ownerId', '==', user.uid)
    );
    const unsubCamps = onSnapshot(
      campsQuery,
      (snap) => {
        const docs: FirestoreCampDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FirestoreCampDoc, 'id'>),
        }));
        setCamps(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'camps');
      }
    );

    const registrationsQuery = query(
      collection(db, 'registrations'),
      where('ownerId', '==', user.uid)
    );
    const unsubRegistrations = onSnapshot(
      registrationsQuery,
      (snap) => {
        const docs: FirestoreRegistrationDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FirestoreRegistrationDoc, 'id'>),
        }));
        setRegistrations(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'registrations');
      }
    );

    return () => {
      isMounted = false;
      unsubPatients();
      unsubCamps();
      unsubRegistrations();
    };
  }, [authReady, user]);

  // Derive active patient based on selectedPatientId, or fallback to first available entered patient
  const activePatient =
    patients.find((p) => p.id === selectedPatientId) ||
    (patients.length > 0 ? patients[0] : null);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        patients,
        camps,
        registrations,
        defaultCampId,
        userProfile,
        updateUserProfile,
        selectedPatientId,
        setSelectedPatientId,
        activePatient,
        isPatientPortal,
        setIsPatientPortal,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebaseData() {
  return useContext(FirebaseContext);
}
