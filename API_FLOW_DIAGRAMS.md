# API Flow Diagrams

## 1. Token Issuance & Auto-Bill Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECEPTIONIST ISSUES TOKEN                     │
└─────────────────────────────────────────────────────────────────┘

Frontend: POST /Token
{
  "patientId": 2,
  "doctorId": 2
}
      ↓
Backend creates Token record
      ↓
Response: {
  "id": 101,
  "tokenNumber": 1,
  "patientId": 2,
  "patientName": "Hafsa Hameed",
  "doctorId": 2,
  "doctorName": "Jawad Ur Rehman",
  "status": "Waiting",
  "createdAt": "2026-06-03T10:37:21"
}
      ↓
Frontend AUTOMATICALLY calls:

Frontend: POST /Bill/token
{
  "tokenId": 101,
  "patientId": 2
}
      ↓
Backend creates Bill record (linked to token)
      ↓
Response: {
  "id": 50,
  "tokenId": 101,
  "patientName": "Hafsa Hameed",
  "consultationFee": 500,
  "extraCharges": 0,
  "totalAmount": 500,
  "status": "Unpaid",
  "isPaid": false,
  "createdAt": "2026-06-03T10:37:21"
}

Result: ✓ Token issued
        ✓ Bill auto-created
        ✓ Both ready for consultation
```

---

## 2. Visit Creation & Consultation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  DOCTOR STARTS CONSULTATION                       │
└──────────────────────────────────────────────────────────────────┘

Token Status: Waiting → Doctor clicks "Start"
      ↓
Doctor fills form:
  - Chief Complaint
  - Diagnosis
  - Notes
      ↓
Frontend: POST /Visit
{
  "patientId": 2,
  "doctorId": 2,
  "tokenId": 101,
  "chiefComplaint": "Headache",
  "diagnosis": "Migraine",
  "notes": "Take rest"
}
      ↓
Backend creates Visit record
      ↓
Response: {
  "id": 45,
  "patientId": 2,
  "doctorId": 2,
  "tokenId": 101,
  "chiefComplaint": "Headache",
  "diagnosis": "Migraine",
  "notes": "Take rest",
  "createdAt": "2026-06-03T11:00:00"
}
      ↓
Frontend:
  - Shows "Prescription" button
  - Opens Prescription Dialog

┌──────────────────────────────────────────────────────────────────┐
│                      PRESCRIPTION FORM                            │
└──────────────────────────────────────────────────────────────────┘

Doctor adds medicines and saves:

Frontend: POST /Prescription
{
  "visitId": 45,
  "instructions": "Take with food",
  "medicines": [
    {
      "medicineName": "Aspirin",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "duration": "3 days"
    }
  ]
}
      ↓
Backend creates Prescription record
      ↓
Response: {
  "id": 20,
  "visitId": 45,
  "items": [ /* medicines */ ],
  "notes": "Take with food",
  "createdAt": "2026-06-03T11:15:00"
}
      ↓
Frontend: Can export PDF via GET /Prescription/20/pdf

┌──────────────────────────────────────────────────────────────────┐
│                   MARK CONSULTATION DONE                          │
└──────────────────────────────────────────────────────────────────┘

Doctor changes token status:

Frontend: PUT /Token/101/status?status=Done
      ↓
Backend updates Token.status = "Done"
      ↓
Frontend AUTOMATICALLY updates Visit:

Frontend: PUT /Visit/45
{
  "diagnosis": "Migraine",
  "instructions": "Completed"
}
      ↓
Backend updates Visit
      ↓
Result: ✓ Token marked Complete
        ✓ Visit marked Complete
        ✓ Ready for billing
```

---

## 3. Billing Management Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    BILLING STAFF VIEW                             │
└──────────────────────────────────────────────────────────────────┘

Billing page loads empty

Billing staff searches patient:

Frontend: POST /Patient/search
{
  "name": "Hafsa Hameed",
  "phoneNumber": null
}
      ↓
Backend returns matching patients
      ↓
Response: [
  {
    "id": 2,
    "name": "Hafsa Hameed",
    "phone": "03364104860"
  }
]
      ↓
Billing staff clicks on patient
      ↓
Frontend: GET /Bill/token/{tokenId}
      ↓
Backend returns bill for that token
      ↓
Response: {
  "id": 50,
  "tokenId": 101,
  "patientName": "Hafsa Hameed",
  "consultationFee": 500,
  "extraCharges": 0,
  "totalAmount": 500,
  "status": "Unpaid",
  "isPaid": false
}
      ↓
Bill displayed with "Update Charges" and "Mark Paid" buttons

┌──────────────────────────────────────────────────────────────────┐
│                  UPDATE CHARGES WORKFLOW                          │
└──────────────────────────────────────────────────────────────────┘

Billing staff adds extra charges (lab test, etc):

Frontend: PATCH /Bill/50
{
  "extraCharges": 200
}
      ↓
Backend: totalAmount = consultationFee + extraCharges - discount
         totalAmount = 500 + 200 - 0 = 700
      ↓
Response: {
  "id": 50,
  "totalAmount": 700,
  "extraCharges": 200,
  "status": "Unpaid"
}
      ↓
Bill display updates with new total

┌──────────────────────────────────────────────────────────────────┐
│                    MARK BILL AS PAID                              │
└──────────────────────────────────────────────────────────────────┘

Billing staff marks bill paid (after patient pays):

Frontend: PUT /Bill/50/paid
      ↓
Backend: Bill.isPaid = true, Bill.status = "Paid"
      ↓
Response: {
  "id": 50,
  "status": "Paid",
  "isPaid": true,
  "totalAmount": 700
}
      ↓
Result: ✓ Bill marked Paid
        ✓ Patient can be released
```

---

## 4. Patient Search for Billing

```
INPUT: Name or Phone
       ↓
Frontend: POST /Patient/search
{
  "name": "Hafsa Hameed",        // if user typed name
  "phoneNumber": null             // set null if searching by name
}
OR
{
  "name": null,
  "phoneNumber": "03364104860"    // set null if searching by phone
}
       ↓
SEARCH PRIORITY:
  - If 7+ digits found in input → search by phone
  - Otherwise → search by name
       ↓
Backend searches Patient table
       ↓
RESPONSE: Array of matched patients
[
  {
    "id": 2,
    "name": "Hafsa Hameed",
    "phone": "03364104860",
    "gender": 1,
    "age": 28
  },
  {
    "id": 5,
    "name": "Hafsa Ali",
    "phone": "03001234567",
    "gender": 1,
    "age": 25
  }
]
       ↓
Frontend displays results as clickable cards
User clicks on desired patient
       ↓
Frontend looks up bill for that patient
```

---

## 5. Token Status Workflow

```
TOKEN LIFECYCLE:

Issue Token
     ↓
status: "Waiting"
  - Patient waiting in queue
  - Bill auto-created
  - Start button enabled
     ↓
Doctor clicks Start
     ↓
status: "InProgress"
  - Doctor-patient consultation ongoing
  - Doctor fills visit form
  - Prescription created
  - Start button disabled (shows Prescription)
     ↓
Doctor completes consultation
     ↓
Doctor marks token "Complete" via dropdown
     ↓
Frontend: PUT /Token/{id}/status?status=Done
Backend: Token.status = "Done" (mapped from "Completed")
         Visit auto-updated
     ↓
status: "Done"
  - Consultation complete
  - Visit complete
  - Bill ready (already auto-created)
  - Billing staff can view/update charges
  - Start button permanently disabled
     ↓
Doctor can also manually set:
  - "Skipped" (patient no-show)
  - "Waiting" (requeue)

IMPORTANT: Cannot mark token "Done" without a Visit
```

---

## 6. Field Transformation Examples

```
BACKEND → FRONTEND

Token Status Enum:
  "Waiting"     → "Pending"
  "InProgress"  → "InProgress"
  "Done"        → "Completed"
  "Skipped"     → "NoShow"

Bill Status Enum:
  "Paid"        → (displayed as StatusBadge)
  "Unpaid"      → (displayed as StatusBadge)

Gender Enum (number → string):
  0  → "Male"
  1  → "Female"
  2  → "Other"

IDs (number → string):
  123 → "123"

Field Name (PascalCase → camelCase optional):
  PatientId    → patientId (case-insensitive lookup)
  CreatedAt    → createdAt
  DoctorName   → doctorName

Visit.instructions ← Visit.notes (on update)
Prescription.instructions ← Prescription.notes (on response)
```

---

## 7. State Management

```
ACTIVE TOKEN STATE (in queue page):

activeToken = Token object
  - Persists while sheet is open
  - Used to show consultation title
  - Source of patientId for visit creation
  - Source of tokenId for visit creation

visitId = string (Visit ID)
  - Set after visit creation
  - Used for prescription
  - Used to change Start button to Prescription

showPrescriptionDialog = boolean
  - Set true after visit creation
  - Opens prescription form

When consultation ends:
  - setActiveToken(null)    // closes sheet
  - setVisitId(null)        // resets
  - showPrescriptionDialog(false)
```

---

## 8. Error Cases

```
ERROR: Invalid Patient ID
  Token created with patientId that doesn't exist
  Backend should reject POST /Token with 400

ERROR: Doctor inactive
  Try to create token with inactive doctor
  Backend should reject POST /Token with 400

ERROR: Bill already exists for token
  Try to POST /Bill/token twice
  Backend should reject with 400 or return existing

ERROR: Visit doesn't exist
  Try to mark token "Done" without visit
  Frontend prevents this in UI

ERROR: Cannot update completed token
  Try to change status of "Done" token
  Backend should allow (for flexibility) or reject

ERROR: Prescription without visit
  POST /Prescription without valid visitId
  Backend should reject with 400
```
