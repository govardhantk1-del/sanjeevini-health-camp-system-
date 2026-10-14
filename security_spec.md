# Sanjeevini Health Camp System — Firestore Security Specification

## 1. Data Invariants
1. **Authentication & Ownership Invariant (`ownerId`)**: Every document in `/patients/{patientId}`, `/camps/{campId}`, and `/registrations/{registrationId}` must be owned by an authenticated user (`ownerId == request.auth.uid`). No anonymous or unauthenticated access is permitted.
2. **PII Isolation Invariant**: Clinical records (`patients`) and gate passes (`registrations`) contain sensitive PII (phone numbers, village addresses, masked IDs, vitals, diagnoses). `get` and `list` operations strictly enforce `resource.data.ownerId == request.auth.uid` (or `isAdmin()` on single-document operations). Blanket `isSignedIn()` reads are forbidden.
3. **Path Variable Hardening (`isValidId`)**: All single-document operations (`get`, `create`, `update`, `delete`) validate document IDs using `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
4. **Strict Schema & Volumetric Bounds**: All writes validate required and allowed keys (`hasAll` and `hasOnly`) and enforce exact `.size()` bounds on every string field matching `firebase-blueprint.json`.
5. **Relational Integrity**: A `/registrations/{registrationId}` record cannot be created unless its referenced `/patients/{patientId}` and `/camps/{campId}` documents exist (or `existsAfter` in an atomic batch).
6. **Temporal & Immutable Field Integrity**: `createdAt` must equal `request.time` on creation and remain immutable on updates (`incoming().createdAt == existing().createdAt`). `updatedAt` must equal `request.time` on every write. `ownerId` is strictly immutable.
7. **Terminal State Locking**: Once a record reaches its terminal status (`status == 'completed'`), further non-admin updates are rejected.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read/Write**: Attempting `get` or `create` on `/patients/pat_01` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Identity Spoofing on Create**: Creating `/patients/pat_01` where `ownerId: "victim_uid"` != `request.auth.uid` -> `PERMISSION_DENIED`.
3. **Shadow / Ghost Field Injection**: Creating or updating `/patients/pat_01` with an undeclared field `isSuperUser: true` -> `PERMISSION_DENIED` via `keys().hasOnly(...)` and `affectedKeys().hasOnly(...)`.
4. **Cross-Tenant PII Read**: Authenticated user `user_B` attempting `get` or `list` on `user_A`'s `/patients/pat_01` -> `PERMISSION_DENIED`.
5. **Unfiltered List Query Scraping**: Authenticated user running an unfiltered `list` query on `/registrations` without `where('ownerId', '==', auth.uid)` -> `PERMISSION_DENIED`.
6. **Path ID Poisoning**: Creating a document with a 500-character or special-character ID `/patients/bad$id` -> `PERMISSION_DENIED` via `isValidId()`.
7. **Denial-of-Wallet String Overflow**: Submitting a `diagnosis` string of 10,000 characters (limit 500) -> `PERMISSION_DENIED`.
8. **Value Type Poisoning on Update**: Updating `registeredCount` in `/camps/camp_01` with a string `"999"` instead of a number -> `PERMISSION_DENIED` via `isValidCamp(incoming())`.
9. **Immutable Field Mutation**: Attempting to mutate `ownerId` or `createdAt` during an `update` -> `PERMISSION_DENIED`.
10. **Forged Client Timestamp**: Submitting a past or future `createdAt` or `updatedAt` timestamp that does not equal `request.time` -> `PERMISSION_DENIED`.
11. **Orphaned Registration Creation**: Creating `/registrations/reg_01` referencing a non-existent `patientId` or `campId` -> `PERMISSION_DENIED`.
12. **Terminal State Re-opening**: Attempting to update a `/patients/pat_01` or `/registrations/reg_01` document whose `existing().status == 'completed'` -> `PERMISSION_DENIED`.
