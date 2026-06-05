# Backend API Contract - Frontend Requirements

**Base URL:** `http://localhost:5202/api`

All endpoints return JSON responses. Frontend maps responses using type converters for case-insensitive field handling and enum conversions.

---

## 1. AUTHENTICATION

### POST `/Auth/login`
**Purpose:** User login with email and password

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (Success 200):**
```json
{
  "token": "string (JWT)",
  "fullName": "string",
  "email": "string",
  "role": "string (Admin | Receptionist | Doctor)"
}
```

**Note:** JWT token must include claims: `sub`, `email`, `name`, `role`, `doctorId` (if doctor), `exp`, `iat`

---

## 2. PATIENT MANAGEMENT

### POST `/Patient/search`
**Purpose:** Search patients by name or phone

**Request Body:**
```json
{
  "name": "string | null",
  "phoneNumber": "string | null"
}
```

**Response (Success 200):** Array of Patients
```json
[
  {
    "id": "number",
    "name": "string",
    "phone": "string",
    "gender": "number (0=Male, 1=Female, 2=Other)",
    "age": "number",
    "address": "string",
    "registeredAt": "ISO datetime string"
  }
]
```

### GET `/Patient`
**Purpose:** Get all patients

**Response (Success 200):** Array of Patients (same structure as search)

### GET `/Patient/{id}`
**Purpose:** Get patient by ID

**Response (Success 200):** Single Patient object

### POST `/Patient`
**Purpose:** Create new patient

**Request Body:**
```json
{
  "name": "string",
  "phone": "string",
  "gender": "number (0=Male, 1=Female, 2=Other)",
  "age": "number",
  "address": "string (optional)",
  "dateOfBirth": "ISO date string (optional)",
  "cnic": "string (optional)",
  "bloodGroup": "string (optional)",
  "allergies": "string (optional)",
  "chronicConditions": "string (optional)"
}
```

**Response (Success 201):** Single Patient object

### PUT `/Patient/{id}`
**Purpose:** Update patient

**Request Body:** Same as POST (all fields optional in practice)

**Response (Success 200):** Updated Patient object

---

## 3. DOCTOR MANAGEMENT

### GET `/Doctor`
**Purpose:** Get all doctors

**Response (Success 200):** Array of Doctors
```json
[
  {
    "id": "number",
    "name": "string",
    "email": "string",
    "phone": "string",
    "specialization": "string",
    "departmentId": "number",
    "departmentName": "string",
    "isActive": "boolean"
  }
]
```

### POST `/Doctor`
**Purpose:** Create new doctor

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "specialization": "string",
  "departmentId": "number",
  "password": "string (optional, if provided creates user)"
}
```

**Response (Success 201):** Single Doctor object

### PUT `/Doctor/{id}`
**Purpose:** Update doctor

**Request Body:**
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "specialization": "string (optional)",
  "departmentId": "number (optional)"
}
```

**Response (Success 200):** Updated Doctor object

### DELETE `/Doctor/{id}`
**Purpose:** Delete doctor

**Response (Success 204 or 200):** No content or success message

---

## 4. DEPARTMENT MANAGEMENT

### GET `/Department`
**Purpose:** Get all departments

**Response (Success 200):** Array of Departments
```json
[
  {
    "id": "number",
    "name": "string",
    "description": "string (optional)"
  }
]
```

### POST `/Department`
**Purpose:** Create new department

**Request Body:**
```json
{
  "name": "string",
  "clinicId": "number"
}
```

**Response (Success 201):** Single Department object

### DELETE `/Department/{id}`
**Purpose:** Delete department

**Response (Success 204 or 200):** No content or success message

---

## 5. TOKEN (QUEUE) MANAGEMENT

### GET `/Token/today/{doctorId}`
**Purpose:** Get today's tokens for a specific doctor

**Response (Success 200):** Array of Tokens
```json
[
  {
    "id": "number",
    "tokenNumber": "number",
    "patientId": "number",
    "patientName": "string",
    "patientPhone": "string (optional)",
    "doctorId": "number",
    "doctorName": "string",
    "status": "string (Waiting | InProgress | Done | Skipped)",
    "createdAt": "ISO datetime string"
  }
]
```

**Note:** Backend status values must be `Waiting`, `InProgress`, `Done`, or `Skipped`. Frontend converts to `Pending`, `InProgress`, `Completed`, `NoShow`.

### POST `/Token`
**Purpose:** Issue a new token for patient

**Request Body:**
```json
{
  "patientId": "number",
  "doctorId": "number"
}
```

**Response (Success 201):** Single Token object (includes id which is used later)

**Important:** After creating token, frontend will auto-create bill via `/Bill/token` endpoint

### PUT `/Token/{id}/status?status={status}`
**Purpose:** Update token status

**Query Parameter:** `status` - Must be one of: `Waiting`, `InProgress`, `Done`, `Skipped`

**Response (Success 200):** Updated Token object

---

## 6. VISIT MANAGEMENT

### POST `/Visit`
**Purpose:** Create a new visit record for a patient

**Request Body:**
```json
{
  "patientId": "number",
  "doctorId": "number",
  "tokenId": "number (optional)",
  "chiefComplaint": "string",
  "diagnosis": "string (optional)",
  "notes": "string (optional)"
}
```

**Response (Success 201):** Single Visit object
```json
{
  "id": "number",
  "patientId": "number",
  "patientName": "string (optional)",
  "doctorId": "number",
  "doctorName": "string (optional)",
  "tokenId": "number (optional)",
  "chiefComplaint": "string",
  "diagnosis": "string",
  "notes": "string",
  "createdAt": "ISO datetime string"
}
```

### GET `/Visit/{id}`
**Purpose:** Get visit by ID

**Response (Success 200):** Single Visit object

### GET `/Visit/patient/{patientId}`
**Purpose:** Get all visits for a patient

**Response (Success 200):** Array of Visit objects

### PUT `/Visit/{id}`
**Purpose:** Update visit

**Request Body:**
```json
{
  "diagnosis": "string (optional)",
  "instructions": "string (optional) - this is stored as notes"
}
```

**Response (Success 200):** Updated Visit object

---

## 7. PRESCRIPTION MANAGEMENT

### POST `/Prescription`
**Purpose:** Create prescription for a visit

**Request Body:**
```json
{
  "visitId": "number",
  "instructions": "string (optional) - stored as notes",
  "medicines": [
    {
      "medicineName": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "instructions": "string (optional)"
    }
  ]
}
```

**Response (Success 201):** Single Prescription object
```json
{
  "id": "number",
  "visitId": "number",
  "items": [
    {
      "medicine": "string",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "instructions": "string"
    }
  ],
  "notes": "string",
  "createdAt": "ISO datetime string"
}
```

### GET `/Prescription/visit/{visitId}`
**Purpose:** Get prescription for a visit

**Response (Success 200):** Single Prescription object or null

### GET `/Prescription/{id}/pdf`
**Purpose:** Export prescription as PDF

**Response (Success 200):** Binary PDF file
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename="prescription.pdf"`

---

## 8. BILLING MANAGEMENT

### POST `/Bill/token`
**Purpose:** Auto-create bill when token is issued

**Request Body:**
```json
{
  "tokenId": "number",
  "patientId": "number"
}
```

**Response (Success 201):** Single Bill object
```json
{
  "id": "number",
  "visitId": "number (optional)",
  "patientName": "string",
  "doctorName": "string (optional)",
  "consultationFee": "number",
  "extraCharges": "number",
  "discount": "number",
  "totalAmount": "number",
  "isPaid": "boolean",
  "status": "string (Paid | Unpaid)",
  "createdAt": "ISO datetime string"
}
```

### GET `/Bill/visit/{visitId}`
**Purpose:** Get bill for a visit

**Response (Success 200):** Single Bill object or null

### GET `/Bill/token/{tokenId}`
**Purpose:** Get bill for a token

**Response (Success 200):** Single Bill object or null

### POST `/Bill`
**Purpose:** Create bill (used if not auto-created)

**Request Body:**
```json
{
  "visitId": "number",
  "extraCharges": "number (optional)",
  "discount": "number (optional)",
  "paymentMethod": "number (optional)",
  "isPaid": "boolean (optional)"
}
```

**Response (Success 201):** Single Bill object

### PATCH `/Bill/{id}`
**Purpose:** Update bill charges only

**Request Body:**
```json
{
  "extraCharges": "number"
}
```

**Response (Success 200):** Updated Bill object

### PUT `/Bill/{id}/paid`
**Purpose:** Mark bill as paid

**Response (Success 200):** Updated Bill object with status="Paid"

---

## 9. DASHBOARD

### GET `/Dashboard/stats`
**Purpose:** Get dashboard statistics

**Response (Success 200):** DashboardStats object
```json
{
  "todayPatients": "number (optional)",
  "todayRevenue": "number",
  "totalPatients": "number",
  "totalDoctors": "number",
  "pendingTokens": "number (optional)",
  "recentTokens": [
    {
      "id": "number",
      "tokenNumber": "number",
      "patientId": "number",
      "patientName": "string",
      "status": "string",
      "createdAt": "ISO datetime"
    }
  ]
}
```

---

## 10. CLINIC INFO

### GET `/Clinic`
**Purpose:** Get clinic information

**Response (Success 200):** ClinicInfo object
```json
{
  "id": "number",
  "name": "string",
  "address": "string",
  "phone": "string",
  "email": "string",
  "city": "string",
  "openingHours": "string (optional)",
  "logo": "string (optional - base64 or URL)",
  "openTime": "string (optional - HH:mm format)",
  "closeTime": "string (optional - HH:mm format)"
}
```

### PUT `/Clinic`
**Purpose:** Update clinic information

**Request Body:**
```json
{
  "name": "string",
  "address": "string",
  "phone": "string",
  "email": "string",
  "city": "string",
  "openingHours": "string (optional)",
  "logo": "string (optional)",
  "openTime": "string (optional)",
  "closeTime": "string (optional)"
}
```

**Response (Success 200):** Updated ClinicInfo object

---

## ERROR HANDLING

All errors should return appropriate HTTP status codes with error messages:

```json
{
  "message": "string - descriptive error message",
  "errors": {
    "fieldName": ["error1", "error2"]
  }
}
```

**Common Status Codes:**
- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

---

## IMPORTANT NOTES

1. **Field Naming:** Backend DTOs use PascalCase (e.g., `PatientId`, `CreatedAt`). Frontend mapper uses case-insensitive lookup for flexibility.

2. **ID Conversion:** All IDs are numbers in database but converted to strings in frontend.

3. **Status Enums:**
   - **Token Status:** Backend: `Waiting`, `InProgress`, `Done`, `Skipped` ↔ Frontend: `Pending`, `InProgress`, `Completed`, `NoShow`
   - **Bill Status:** `Paid` ↔ `Unpaid`
   - **Gender:** 0=Male, 1=Female, 2=Other

4. **Token Issuance → Bill Auto-Creation Flow:**
   - User creates token via `/Token` POST
   - Token response includes `id`
   - Frontend immediately calls `/Bill/token` POST to auto-create bill
   - Bill is now linked to token and ready for charges

5. **Visit → Token Status Update Flow:**
   - User creates visit (optional token association)
   - User marks token as "Completed"
   - Frontend auto-updates visit with `instructions` field

6. **Headers:** All POST/PUT/PATCH requests must include:
   ```
   Content-Type: application/json
   ```

7. **Validation:** Backend should validate:
   - Required fields present and non-empty
   - Patient/Doctor/Department IDs exist
   - Duplicate checks where needed
   - Phone number format
