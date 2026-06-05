# Backend Implementation Requirements - Summary

## Critical Workflows

### 1. **Token Issuance & Auto-Bill Creation**
```
Step 1: Receptionist creates Token via POST /Token
        Request: { patientId: number, doctorId: number }
        Response: { id, tokenNumber, patientId, patientName, ... }

Step 2: Frontend IMMEDIATELY calls POST /Bill/token
        Request: { tokenId: <from step 1>, patientId: number }
        Response: { id, visitId, totalAmount, status: "Unpaid", ... }

Result: Bill exists before visit creation and is ready for charges
```

### 2. **Visit Creation & Token Completion**
```
Step 1: Doctor starts consultation, creates Visit via POST /Visit
        Request: { patientId, doctorId, tokenId, chiefComplaint, diagnosis, notes }
        Response: { id, patientId, doctorId, tokenId, ... }

Step 2: Doctor changes token status to "Completed" via PUT /Token/{id}/status?status=Done
        Frontend auto-updates visit via PUT /Visit/{visitId}
        Request: { diagnosis, instructions }

Result: Visit and Token both show "Completed"
```

### 3. **Billing Management**
```
Step 1: Bill auto-created on token issuance (see workflow 1)

Step 2: Billing staff searches patient and views their bill

Step 3: Billing staff can update charges via PATCH /Bill/{id}
        Request: { extraCharges: number }
        Result: totalAmount is recalculated

Step 4: Billing staff marks bill as paid via PUT /Bill/{id}/paid
        Result: status changes to "Paid"
```

---

## Required Endpoints Summary

| Module | Endpoint | Method | Purpose |
|--------|----------|--------|---------|
| **Auth** | `/Auth/login` | POST | User login with JWT token response |
| **Patient** | `/Patient/search` | POST | Search by name or phone |
| **Patient** | `/Patient` | GET | Get all patients |
| **Patient** | `/Patient/{id}` | GET/POST/PUT | Get/Create/Update patient |
| **Doctor** | `/Doctor` | GET | Get all doctors |
| **Doctor** | `/Doctor` | POST | Create doctor |
| **Doctor** | `/Doctor/{id}` | PUT/DELETE | Update/Delete doctor |
| **Department** | `/Department` | GET | Get all departments |
| **Department** | `/Department` | POST | Create department |
| **Department** | `/Department/{id}` | DELETE | Delete department |
| **Token** | `/Token/today/{doctorId}` | GET | Get today's tokens for doctor |
| **Token** | `/Token` | POST | Issue new token ⭐ |
| **Token** | `/Token/{id}/status` | PUT | Update token status |
| **Visit** | `/Visit` | POST | Create visit ⭐ |
| **Visit** | `/Visit/{id}` | GET/PUT | Get/Update visit |
| **Visit** | `/Visit/patient/{patientId}` | GET | Get patient's visits |
| **Prescription** | `/Prescription` | POST | Create prescription |
| **Prescription** | `/Prescription/visit/{visitId}` | GET | Get prescription for visit |
| **Prescription** | `/Prescription/{id}/pdf` | GET | Export prescription as PDF |
| **Bill** | `/Bill/token` | POST | Auto-create bill from token ⭐ |
| **Bill** | `/Bill/visit/{visitId}` | GET | Get bill for visit |
| **Bill** | `/Bill/token/{tokenId}` | GET | Get bill for token |
| **Bill** | `/Bill` | POST | Create bill (fallback) |
| **Bill** | `/Bill/{id}` | PATCH | Update charges |
| **Bill** | `/Bill/{id}/paid` | PUT | Mark as paid |
| **Dashboard** | `/Dashboard/stats` | GET | Dashboard statistics |
| **Clinic** | `/Clinic` | GET/PUT | Get/Update clinic info |

⭐ = Critical for core workflow

---

## Data Models Required

### Patient
- id, name, phone, gender (enum: 0/1/2), age, address, dateOfBirth, cnic, bloodGroup, allergies, chronicConditions, registeredAt

### Doctor
- id, name, email, phone, specialization, departmentId, departmentName, isActive

### Department
- id, name, description

### Token
- id, tokenNumber, patientId, patientName, patientPhone, doctorId, doctorName, status (Waiting/InProgress/Done/Skipped), createdAt

### Visit
- id, patientId, patientName, doctorId, doctorName, tokenId, chiefComplaint, diagnosis, notes, createdAt

### Prescription
- id, visitId, medicines (array with: medicineName, dosage, frequency, duration, instructions), instructions, createdAt

### Bill
- id, tokenId (foreign key), visitId (foreign key), patientName, doctorName, consultationFee, extraCharges, discount, totalAmount, isPaid, status (Paid/Unpaid), createdAt

### ClinicInfo
- id, name, address, phone, email, city, openingHours, logo, openTime, closeTime

---

## Key Validation Rules

### Patient
- Name and phone are required
- Phone should be unique or allow duplicates?
- Gender must be 0, 1, or 2

### Doctor
- Email should be unique
- Specialization is required
- DepartmentId must exist in Department table

### Token
- PatientId and DoctorId must exist
- TokenNumber auto-incremented daily (resets each day)
- Status must be one of: Waiting, InProgress, Done, Skipped
- Can only mark token "Done" if visit exists

### Visit
- PatientId and DoctorId must exist
- ChiefComplaint is required
- If tokenId provided, token must exist

### Bill
- Created automatically when token is issued
- Can only have one bill per token
- TotalAmount = consultationFee + extraCharges - discount
- Status determined by isPaid flag

---

## Field Naming Convention

Frontend uses PascalCase in DTO, but DTOs should support case-insensitive field lookup:

✅ These will work:
- `PatientId` or `patientId` or `patientID`
- `CreatedAt` or `createdAt` or `created_at`
- `DoctorName` or `doctorName` or `doctor_name`

---

## Important Status Mappings

**Token Status Conversion:**
| Backend | Frontend |
|---------|----------|
| Waiting | Pending |
| InProgress | InProgress |
| Done | Completed |
| Skipped | NoShow |

**Query Parameter Format:**
- Token status update sends status as query parameter, not body
- Example: `PUT /Token/123/status?status=Done`

---

## Error Response Format

```json
{
  "message": "Descriptive error message",
  "errors": {
    "patientId": ["Patient not found"],
    "doctorId": ["Doctor is inactive"]
  }
}
```

Status codes:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server error

---

## Special Considerations

1. **JWT Token Claims:** Must include `doctorId` claim if user is a doctor (null/empty for admin/receptionist)

2. **Transaction Handling:** Token creation and bill creation should be in same transaction to maintain consistency

3. **PDF Export:** Prescription PDF endpoint must return binary data with proper headers

4. **Concurrency:** Bill charges can be updated while patient is being billed, ensure proper locking

5. **Audit Trail:** Consider logging all bill status changes and charge updates
