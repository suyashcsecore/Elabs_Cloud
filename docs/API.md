# API Documentation: eLabs Student Registration and Event Management System

This document catalogs all endpoints exposed by the eLabs backend, including RBAC access rules, parameters, request payloads, and response structures.

All responses strictly follow the standard JSON schema:
- **Success:** `{ "message": "...", "data": { ... } }`
- **Error:** `{ "error": { "code": "...", "message": "...", "details": ... } }`

---

## Base URLs
- **Local Dev:** `http://localhost:5000`
- **Health Check:** `http://localhost:5000/health` (Public, no auth)

---

## 1. Public & System Endpoints

### 1.1 Health Check
- **Endpoint:** `GET /health`
- **Role Required:** Public (No authentication)
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "uptime": 1284,
  "db": "connected",
  "timestamp": "2026-10-15T03:30:00.000Z"
}
```

---

## 2. Authentication & Authorization (`/api/auth`)

### 2.1 Register Student Account
- **Endpoint:** `POST /api/auth/register`
- **Role Required:** Public
- **Rate Limit:** 10 requests / 15 minutes per IP
- **Payload:**
```json
{
  "name": "Alex Mercer",
  "email": "alex.mercer@kiit.ac.in",
  "password": "Password123!"
}
```
- **Response (201 Created):** Sets `elabs_auth_token` HttpOnly cookie.
```json
{
  "message": "Account created successfully.",
  "data": {
    "user": {
      "id": "e4b172a6-2311-4a11-80a1-9a997d91d801",
      "name": "Alex Mercer",
      "email": "alex.mercer@kiit.ac.in",
      "role": "STUDENT",
      "status": "ACTIVE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.2 Login User
- **Endpoint:** `POST /api/auth/login`
- **Role Required:** Public
- **Rate Limit:** 10 requests / 15 minutes per IP
- **Payload:**
```json
{
  "email": "student@elabs.kiit.ac.in",
  "password": "Password123!"
}
```
- **Response (200 OK):** Sets `elabs_auth_token` HttpOnly cookie.

### 2.3 Logout User
- **Endpoint:** `POST /api/auth/logout`
- **Role Required:** Authenticated
- **Response (200 OK):** Clears authentication cookie.

### 2.4 Get Current User Profile
- **Endpoint:** `GET /api/auth/me`
- **Role Required:** Authenticated (any role)
- **Response (200 OK):** Returns current user object.

---

## 3. Events (`/api/events`)

### 3.1 List Published Events
- **Endpoint:** `GET /api/events`
- **Role Required:** Public
- **Query Parameters:**
  - `search`: string (filters title, description, location)
  - `category`: string (`Workshop`, `Hackathon`, `Seminar`, `Webinar`)
  - `startDate`: ISO 8601 string
  - `endDate`: ISO 8601 string
  - `page`: integer (default: 1)
  - `limit`: integer (default: 10)
- **Response (200 OK):**
```json
{
  "data": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "events": [
      {
        "id": "c1f7a0b3-1e52-474d-b3ef-4f114c000001",
        "title": "Cloud Architecture & Kubernetes Workshop",
        "category": "Workshop",
        "start_at": "2026-10-25T10:00:00.000Z",
        "end_at": "2026-10-25T16:00:00.000Z",
        "location": "eLabs Tech Center Lab 2",
        "capacity": 50,
        "remaining_seats": 38,
        "status": "PUBLISHED",
        "availability_status": "OPEN"
      }
    ]
  }
}
```

### 3.2 Get Event Details
- **Endpoint:** `GET /api/events/:id`
- **Role Required:** Public
- **Response (200 OK):** Returns full event object with `remaining_seats` and `is_user_registered` indicator.

### 3.3 Create Event Draft
- **Endpoint:** `POST /api/events`
- **Role Required:** `ORGANIZER` or `ADMIN`
- **Payload:**
```json
{
  "title": "Generative AI Hackathon 2026",
  "description": "48-hour build sprint on multimodal agents.",
  "category": "Hackathon",
  "startAt": "2026-11-10T09:00:00.000Z",
  "endAt": "2026-11-12T18:00:00.000Z",
  "location": "Auditorium Hall 5",
  "capacity": 100,
  "registrationDeadline": "2026-11-09T23:59:59.000Z"
}
```

### 3.4 Update Event
- **Endpoint:** `PUT /api/events/:id`
- **Role Required:** Owner `ORGANIZER` or `ADMIN`
- **Payload:** Updated fields (cannot reduce capacity below active registrations).

### 3.5 Publish Event
- **Endpoint:** `POST /api/events/:id/publish`
- **Role Required:** Owner `ORGANIZER` or `ADMIN`
- **Response (200 OK):** Changes status from `DRAFT` to `PUBLISHED`.

### 3.6 Cancel Event
- **Endpoint:** `POST /api/events/:id/cancel`
- **Role Required:** Owner `ORGANIZER` or `ADMIN`
- **Response (200 OK):** Marks event as `CANCELLED`.

---

## 4. Student Registrations (`/api/events/:id/registrations` & `/api/registrations`)

### 4.1 Register for Event (Atomic Row Lock)
- **Endpoint:** `POST /api/events/:id/registrations`
- **Role Required:** `STUDENT`
- **Logic:** Executed in ACID transaction with `SELECT ... FOR UPDATE`.
- **Response (201 Created):** Confirms seat reservation.
- **Conflict (409 Conflict):** Returns code `EVENT_FULL` or `ALREADY_REGISTERED`.

### 4.2 Cancel Own Registration
- **Endpoint:** `DELETE /api/events/:id/registrations/me`
- **Role Required:** `STUDENT`
- **Response (200 OK):** Cancels active registration and frees the seat.

### 4.3 Get Student's Registrations
- **Endpoint:** `GET /api/registrations/me`
- **Role Required:** `STUDENT`
- **Response (200 OK):** Returns list of active and past registrations.

---

## 5. Organizer Management (`/api/organizer`)

### 5.1 Get Managed Events
- **Endpoint:** `GET /api/organizer/events`
- **Role Required:** `ORGANIZER` or `ADMIN`
- **Response (200 OK):** Returns events created by the caller with real-time seat metrics.

### 5.2 Get Event Participants
- **Endpoint:** `GET /api/organizer/events/:id/participants`
- **Role Required:** Owner `ORGANIZER` or `ADMIN`
- **Response (200 OK):** Returns student attendee roster.

### 5.3 Export Participant Roster CSV
- **Endpoint:** `GET /api/organizer/events/:id/participants.csv`
- **Role Required:** Owner `ORGANIZER` or `ADMIN`
- **Response (200 OK):** Returns `text/csv` stream with CSV injection escaping (`=`, `+`, `-`, `@`).

---

## 6. Admin Control Center (`/api/admin`)

### 6.1 Platform Analytics Summary
- **Endpoint:** `GET /api/admin/summary`
- **Role Required:** `ADMIN`
- **Response (200 OK):** Returns aggregated user stats, event breakdown, 14-day daily counts, and top 5 events.

### 6.2 All Events Overview
- **Endpoint:** `GET /api/admin/events`
- **Role Required:** `ADMIN`
- **Response (200 OK):** Returns platform-wide events roster.

### 6.3 List All Users
- **Endpoint:** `GET /api/admin/users`
- **Role Required:** `ADMIN`
- **Query Parameters:** `search`, `role`, `status`, `limit`, `offset`.

### 6.4 Update User Role
- **Endpoint:** `PATCH /api/admin/users/:id/role`
- **Role Required:** `ADMIN`
- **Payload:** `{ "role": "ORGANIZER" }` or `{ "role": "STUDENT" }` (cannot demote self).

### 6.5 Update User Status
- **Endpoint:** `PATCH /api/admin/users/:id/status`
- **Role Required:** `ADMIN`
- **Payload:** `{ "status": "ACTIVE" }` or `{ "status": "DISABLED" }` (cannot disable self).
