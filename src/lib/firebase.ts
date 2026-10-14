import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
};
export type { User };

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Defensive sanitization helpers matching firebase-blueprint.json & firestore.rules
function clampStr(val: string, min: number, max: number, fallback: string): string {
  const trimmed = (val || '').trim();
  if (trimmed.length < min) return fallback.slice(0, max);
  return trimmed.slice(0, max);
}

function sanitizeId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `id-${Date.now()}`;
}

function sanitizeAadhaar4(val: string): string {
  const digits = (val || '').replace(/\D/g, '');
  if (digits.length >= 4) return digits.slice(-4);
  return digits.padStart(4, '0');
}

function sanitizeGender(val: string): 'Female' | 'Male' | 'Other' {
  if (val === 'Female' || val === 'Male' || val === 'Other') return val;
  if (val.toLowerCase().startsWith('f')) return 'Female';
  if (val.toLowerCase().startsWith('m')) return 'Male';
  return 'Other';
}

export interface PatientRecordInput {
  id?: string;
  token: string;
  fullName: string;
  phone: string;
  age: string;
  gender: string;
  village: string;
  aadhaarLast4: string;
  department: string;
  vitalsSummary?: string;
  diagnosis?: string;
  prescriptionSummary?: string;
  status?: 'registered' | 'triaged' | 'consulted' | 'completed';
}

export interface RegistrationRecordInput {
  id?: string;
  patientId?: string;
  campId?: string;
  token: string;
  fullName: string;
  phone: string;
  dob: string;
  gender: string;
  village: string;
  govId: string;
  arrivalSlot: string;
  symptoms: string;
  department?: string;
  status?: 'queued' | 'checked-in' | 'completed';
}

export interface CampRecordInput {
  id?: string;
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
  status?: 'active' | 'provisioning' | 'completed';
}

/**
 * Ensures the default active camp document exists for the current authenticated user
 * so registrations always reference an existing campId in `/camps/{campId}`.
 */
export async function ensureDefaultCampExists(userId: string): Promise<string> {
  const campDocId = sanitizeId(`camp-tmk-04-${userId.slice(0, 16)}`);
  const campPath = `camps/${campDocId}`;
  try {
    const q = query(collection(db, 'camps'), where('ownerId', '==', userId));
    const snap = await getDocs(q);
    const existingCamp = snap.docs.find((d) => d.id === campDocId);
    if (!existingCamp) {
      await setDoc(doc(db, 'camps', campDocId), {
        ownerId: userId,
        campCode: 'CAMP-TMK-04',
        taluk: 'Koratagere Taluk',
        location: 'Govt Higher Primary School, Holavanahalli',
        campDate: '18 Oct 2026',
        meshStatus: 'ONLINE_MESH',
        registeredCount: 312,
        targetCapacity: 400,
        doctorsAssigned: 5,
        volunteersAssigned: 14,
        piNodeIp: '192.168.40.10',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return campDocId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, campPath);
  }
}

/**
 * Atomically saves a new Registration to `/registrations` AND its linked Patient to `/patients`,
 * ensuring relational integrity with `/camps/{campId}` and `/patients/{patientId}`.
 */
export async function saveRegistrationAndPatientToFirestore(
  input: RegistrationRecordInput
): Promise<{ registrationId: string; patientId: string; campId: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to save registration data.');
  }

  const uid = currentUser.uid;
  const campId = input.campId
    ? sanitizeId(input.campId)
    : await ensureDefaultCampExists(uid);

  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const patientId = sanitizeId(input.patientId || `pat-${suffix}`);
  const registrationId = sanitizeId(input.id || `reg-${suffix}`);

  const cleanToken = clampStr(input.token, 2, 20, '#T-042');
  const cleanName = clampStr(input.fullName, 1, 120, 'Walk-in Patient');
  const cleanPhone = clampStr(input.phone, 5, 25, '+91 98450 00000');
  const cleanGender = sanitizeGender(input.gender);
  const cleanVillage = clampStr(input.village, 1, 120, 'Holavanahalli');
  const cleanAadhaar4 = sanitizeAadhaar4(input.govId);
  const cleanDept = clampStr(input.department || 'General Medicine', 1, 80, 'General Medicine');
  const cleanDob = clampStr(input.dob, 1, 30, '45y');
  const cleanGovId = clampStr(input.govId, 4, 40, `XXXX-XXXX-${cleanAadhaar4}`);
  const cleanSlot = clampStr(input.arrivalSlot, 1, 40, '09:00 AM - 10:30 AM');
  const cleanSymptoms = (input.symptoms || '').trim().slice(0, 300);

  const batch = writeBatch(db);

  const patientRef = doc(db, 'patients', patientId);
  batch.set(patientRef, {
    ownerId: uid,
    token: cleanToken,
    fullName: cleanName,
    phone: cleanPhone,
    age: clampStr(cleanDob, 1, 10, '45y'),
    gender: cleanGender,
    village: cleanVillage,
    aadhaarLast4: cleanAadhaar4,
    department: cleanDept,
    vitalsSummary: cleanSymptoms ? `Intake: ${cleanSymptoms.slice(0, 200)}` : 'Pending Triage Vitals',
    diagnosis: 'Pending Doctor Consultation',
    prescriptionSummary: 'Pending Pharmacy Dispensing',
    status: 'registered',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const registrationRef = doc(db, 'registrations', registrationId);
  batch.set(registrationRef, {
    ownerId: uid,
    patientId,
    campId,
    token: cleanToken,
    fullName: cleanName,
    phone: cleanPhone,
    dob: cleanDob,
    gender: cleanGender,
    village: clampStr(input.village, 1, 160, 'Holavanahalli'),
    govId: cleanGovId,
    arrivalSlot: cleanSlot,
    symptoms: cleanSymptoms,
    status: input.status || 'queued',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return { registrationId, patientId, campId };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `registrations/${registrationId}`);
  }
}

/**
 * Saves or updates a Patient record in `/patients/{patientId}` (used by Triage Vitals, Voice AI Intake, Doctor Consultation, Pharmacy).
 */
export async function savePatientClinicalDataToFirestore(
  input: PatientRecordInput
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to save patient clinical data.');
  }

  const uid = currentUser.uid;
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const patientId = sanitizeId(input.id || `pat-${suffix}`);
  const path = `patients/${patientId}`;

  try {
    await setDoc(doc(db, 'patients', patientId), {
      ownerId: uid,
      token: clampStr(input.token, 2, 20, '#T-001'),
      fullName: clampStr(input.fullName, 1, 120, 'Patient'),
      phone: clampStr(input.phone, 5, 25, '+91 98450 00000'),
      age: clampStr(input.age, 1, 10, '40y'),
      gender: sanitizeGender(input.gender),
      village: clampStr(input.village, 1, 120, 'Camp Ward'),
      aadhaarLast4: sanitizeAadhaar4(input.aadhaarLast4),
      department: clampStr(input.department, 1, 80, 'General Medicine'),
      vitalsSummary: (input.vitalsSummary || '').trim().slice(0, 300),
      diagnosis: (input.diagnosis || '').trim().slice(0, 500),
      prescriptionSummary: (input.prescriptionSummary || '').trim().slice(0, 500),
      status: input.status || 'triaged',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return patientId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Updates an existing patient record in `/patients/{patientId}` with new vitals, diagnosis, or prescription.
 */
export async function updatePatientClinicalRecord(
  patientId: string,
  updates: {
    vitalsSummary?: string;
    diagnosis?: string;
    prescriptionSummary?: string;
    status?: 'registered' | 'triaged' | 'consulted' | 'completed';
    fullName?: string;
    phone?: string;
    age?: string;
    gender?: 'Female' | 'Male' | 'Other';
    village?: string;
    department?: string;
  }
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to update patient data.');
  }

  const cleanId = sanitizeId(patientId);
  const path = `patients/${cleanId}`;

  try {
    const payload: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (updates.vitalsSummary !== undefined) {
      payload.vitalsSummary = updates.vitalsSummary.slice(0, 300);
    }
    if (updates.diagnosis !== undefined) {
      payload.diagnosis = updates.diagnosis.slice(0, 500);
    }
    if (updates.prescriptionSummary !== undefined) {
      payload.prescriptionSummary = updates.prescriptionSummary.slice(0, 500);
    }
    if (updates.status !== undefined) {
      payload.status = updates.status;
    }
    if (updates.fullName !== undefined) {
      payload.fullName = clampStr(updates.fullName, 1, 120, 'Patient');
    }
    if (updates.phone !== undefined) {
      payload.phone = clampStr(updates.phone, 5, 25, '+91 98450 00000');
    }
    if (updates.age !== undefined) {
      payload.age = clampStr(updates.age, 1, 10, '40y');
    }
    if (updates.gender !== undefined) {
      payload.gender = sanitizeGender(updates.gender);
    }
    if (updates.village !== undefined) {
      payload.village = clampStr(updates.village, 1, 120, 'Camp Ward');
    }
    if (updates.department !== undefined) {
      payload.department = clampStr(updates.department, 1, 80, 'General Medicine');
    }

    await updateDoc(doc(db, 'patients', cleanId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Saves a Camp configuration record to `/camps/{campId}`.
 */
export async function saveCampToFirestore(input: CampRecordInput): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to save camp data.');
  }

  const uid = currentUser.uid;
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const campId = sanitizeId(input.id || `camp-${input.campCode}-${suffix}`);
  const path = `camps/${campId}`;

  try {
    await setDoc(doc(db, 'camps', campId), {
      ownerId: uid,
      campCode: sanitizeId(input.campCode).slice(0, 32),
      taluk: clampStr(input.taluk, 1, 100, 'Koratagere Taluk'),
      location: clampStr(input.location, 1, 200, 'Holavanahalli School Campus'),
      campDate: clampStr(input.campDate, 1, 60, '18 Oct 2026'),
      meshStatus: input.meshStatus || 'ONLINE_MESH',
      registeredCount: Math.max(0, Math.min(100000, Math.round(input.registeredCount || 0))),
      targetCapacity: Math.max(1, Math.min(100000, Math.round(input.targetCapacity || 350))),
      doctorsAssigned: Math.max(0, Math.min(1000, Math.round(input.doctorsAssigned || 4))),
      volunteersAssigned: Math.max(0, Math.min(5000, Math.round(input.volunteersAssigned || 12))),
      piNodeIp: clampStr(input.piNodeIp, 1, 64, '192.168.40.10'),
      status: input.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return campId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCampStatusInFirestore(
  campId: string,
  meshStatus: 'ONLINE_MESH' | 'SYNC_PENDING' | 'PROVISIONING' | 'COMPLETED',
  registeredCount: number,
  status: 'active' | 'provisioning' | 'completed' = 'active'
): Promise<void> {
  const cleanId = sanitizeId(campId);
  const path = `camps/${cleanId}`;
  try {
    await updateDoc(doc(db, 'camps', cleanId), {
      meshStatus,
      registeredCount: Math.max(0, Math.min(100000, Math.round(registeredCount))),
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
