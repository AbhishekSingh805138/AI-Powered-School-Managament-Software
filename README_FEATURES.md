# EduPro - School Management System

## 🎓 Features Overview

### Core Features
- ✅ **Multi-tenant Architecture** - Multiple schools in one system with data isolation
- ✅ **Role-Based Access Control** - 5 user types (Super Admin, School Admin, Teacher, Student, Parent)
- ✅ **Student Management** - Complete CRUD operations with bulk CSV import
- ✅ **Teacher Management** - Staff management with subject assignments
- ✅ **Attendance Tracking** - Mark and monitor student attendance
- ✅ **Gradebook System** - Assignments, grades, and performance tracking
- ✅ **Timetable Management** - Schedule classes by grade and period
- ✅ **Fee Management** - Track payments and overdue fees
- ✅ **AI Chat Assistant** - GPT-4o powered help desk (using Emergent LLM key)
- ✅ **Dashboard Analytics** - Real-time statistics and insights
- ✅ **Bulk Import** - CSV upload for students and teachers
- ✅ **Downloadable Reports** - Attendance, Grades, and Student reports in CSV

### 📧 Email Notifications (Ready to Activate)

Email notification endpoints are implemented but require a Resend API key to activate.

**How to Activate:**

1. Sign up at [Resend.com](https://resend.com) (free tier available)
2. Get your API key from Dashboard → API Keys
3. Add to `/app/backend/.env`:
   ```
   RESEND_API_KEY=re_your_api_key_here
   SENDER_EMAIL=onboarding@resend.dev
   ```
4. Install Resend SDK:
   ```bash
   cd /app/backend
   pip install resend
   pip freeze > requirements.txt
   ```
5. Restart backend:
   ```bash
   sudo supervisorctl restart backend
   ```

**Available Notification Endpoints:**
- `POST /api/notifications/assignment` - Notify students about new assignments
- `POST /api/notifications/fee-reminder` - Send fee reminders to parents

## 🚀 Quick Start

### Default Credentials

Create accounts with these roles:
- **Super Admin**: Manages multiple schools
- **School Admin**: Manages one school (requires tenant_id)
- **Teacher**: Manages classes and grades (requires tenant_id)
- **Student**: Views assignments and grades (requires tenant_id)
- **Parent**: Monitors children's progress (requires tenant_id)

### Bulk Import Format

**Students CSV Format:**
```csv
first_name,last_name,email,grade,date_of_birth,parent_email
John,Doe,john@example.com,5,2015-01-15,parent@example.com
Jane,Smith,jane@example.com,6,2014-05-20,parent2@example.com
```

**Teachers CSV Format:**
```csv
first_name,last_name,email,qualification,subjects
Alice,Johnson,alice@school.com,MSc Physics,Physics;Chemistry
Bob,Williams,bob@school.com,MA English,English;Literature
```

*Note: Subjects should be separated by semicolons (;)*

## 🎨 Design System

- **Theme**: Ivy League Futurist
- **Primary Color**: Oxford Green (#0F2F24)
- **Secondary**: Bone White (#F5F5F0)
- **Accent**: Electric Violet (#7C3AED) for AI features
- **Typography**: Fraunces (headings), Manrope (body), JetBrains Mono (data)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Schools (Super Admin only)
- `POST /api/schools` - Create new school
- `GET /api/schools` - List all schools

### Students
- `POST /api/students` - Create student
- `GET /api/students` - List students
- `GET /api/students/{id}` - Get student details
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student
- `POST /api/students/bulk-import` - Bulk import via CSV

### Teachers
- `POST /api/teachers` - Create teacher
- `GET /api/teachers` - List teachers
- `POST /api/teachers/bulk-import` - Bulk import via CSV

### Attendance
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance` - Get attendance records (filter by student_id, date)

### Assignments & Grades
- `POST /api/assignments` - Create assignment
- `GET /api/assignments` - List assignments (filter by grade)
- `POST /api/grades` - Submit grade
- `GET /api/grades` - Get grades (filter by student_id, assignment_id)

### Timetable
- `POST /api/timetable` - Create timetable entry
- `GET /api/timetable` - Get timetable (filter by grade, day)

### Fees
- `POST /api/fees` - Create fee record
- `GET /api/fees` - Get fees (filter by student_id, status)
- `PUT /api/fees/{id}/pay` - Mark fee as paid

### Reports
- `GET /api/reports/attendance` - Download attendance report CSV
- `GET /api/reports/grades` - Download grades report CSV
- `GET /api/reports/students` - Download students report CSV

### AI Chat
- `POST /api/ai/chat` - Send message to AI assistant

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🔧 Tech Stack

**Frontend:**
- React 18
- React Router v6
- Axios
- Tailwind CSS
- Lucide React Icons

**Backend:**
- FastAPI
- MongoDB (Motor async driver)
- JWT Authentication
- Emergent Integrations (OpenAI GPT-4o)
- Python 3.11

**AI:**
- OpenAI GPT-4o via Emergent LLM key
- Chat context maintained per session

## 🎯 Next Enhancement Ideas

1. **Parent-Teacher Messaging** - Direct communication channel
2. **Mobile App** - React Native companion app
3. **Attendance QR Codes** - Quick check-in via QR scan
4. **Grade Analytics** - Trend charts and performance predictions
5. **Homework Submission** - File upload and grading interface
6. **Event Calendar** - School events and holiday management
7. **Library Management** - Book checkout system
8. **Transportation Tracking** - Bus route and timing management

## 📝 Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-xxxx
SECRET_KEY=your-jwt-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Optional: Activate email notifications
RESEND_API_KEY=re_your_key_here
SENDER_EMAIL=onboarding@resend.dev
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-app.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

## 🧪 Testing

Run comprehensive tests:
```bash
# Backend tests
python /app/backend_test.py

# Frontend E2E tests
# Use testing agent or manual testing via UI
```

## 📄 License

Built with Emergent AI - Your school management solution.
