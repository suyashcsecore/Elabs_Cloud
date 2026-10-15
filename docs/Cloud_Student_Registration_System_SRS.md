# Software Requirements Specification (SRS)

## Cloud-Based Student Registration and Event Management System

**Version:** 1.0  
**Project:** eLabs Cloud Computing Domain Project  
**Institution:** KIIT  
**Date:** 14 October 2026  

---

### Core Tech Stack:
- **Backend:** Node.js + Express
- **Frontend:** React + Vite + React Router
- **Database:** PostgreSQL (raw SQL using `pg` driver, no heavy ORM)
- **Auth:** JWT stored in `HttpOnly` cookies + bcrypt password hashing
- **Error Format:** `{ "error": { "code": "...", "message": "..." } }`
- **Roles:** `STUDENT`, `ORGANIZER`, `ADMIN`

### Key Modules & Requirements:
1. **Authentication & RBAC:**
   - Registration (default role: `STUDENT`). Elevated roles assigned only by Admin.
   - Login with bcrypt password verification, issuing JWT in HttpOnly cookie.
   - Logout clears auth cookie.
2. **Event Discovery & Management:**
   - `STUDENT`: Browse published events, view capacity, deadline, schedules.
   - `ORGANIZER`: Create, update, publish, cancel owned events.
3. **Registration & Concurrency Control:**
   - Atomic database transactions.
   - Strict capacity checks preventing overbooking under concurrent requests.
   - Prevention of duplicate active registrations.
   - Cancellation restores available seats.
4. **Organizer Roster & Reporting:**
   - View registered participants for assigned events.
   - Export attendee list to CSV.
5. **Admin Operations:**
   - Platform statistics dashboard (live counts of users, events, registrations).
   - Role management (promote/demote organizers).
6. **Cloud & Observability:**
   - `/health` endpoint reporting uptime and database connectivity.
   - Centralized structured error handling and logging.
