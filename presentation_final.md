# Syncora - Academic Task Management System
**Operating System (OS), CSE-323 | Fall 2025**

---

## Slide 1: Title Slide

# **Syncora**
### Your All-in-One Academic Task Manager

**Unifying Canvas LMS, Google Calendar & Manual Tasks**

---

**Presented by:**
Rayed Riasat Rabbi (2311649642)
Habiba Alam Raisa (2231272642)
Nuzhat Tasnim Silvia (2212314042)
MD. Al Amin (2212581042)

**Course:** CSE-323 Operating Systems  
**Instructor:** Dr. Rashed Mazumder  
**Platform:** Android (React Native + Expo)

---

## Slide 2: The Problem

### **Students Face Daily Challenges**

📚 **Platform Fragmentation**  
Checking Canvas, Google Calendar, emails separately

⏰ **Time Waste**  
15-30 minutes daily copying assignments manually

📉 **Missed Deadlines**  
No centralized view of all tasks

---

### **Our Solution: Syncora**
✅ One app for all academic tasks  
✅ Automatic Canvas sync  
✅ Visual calendar planning

---

## Slide 3: Login & Authentication Screen

### **Secure Multi-Provider Login**

**Features:**
- Email/Password authentication
- Google Sign-In integration
- Persistent sessions
- Secure token storage

---

```
┌─────────────────────────┐
│                         │
│                         │
│   [LOGIN SCREEN]        │
│   SCREENSHOT            │
│   (Portrait)            │
│                         │
│   - Email field         │
│   - Password field      │
│   - Login button        │
│   - Google sign-in      │
│                         │
│                         │
│                         │
└─────────────────────────┘
```

---

## Slide 4: Dashboard - Overview

### **Smart Analytics at a Glance**

**Real-Time Metrics:**
- 📊 Total Tasks
- ✅ Completed Today
- ⏰ Due This Week
- 🎓 Canvas Synced

**Quick Actions:**
- Add Task
- Sync Canvas
- View Calendar

---

```
┌─────────────────────────┐
│                         │
│  [DASHBOARD SCREEN]     │
│  SCREENSHOT             │
│  (Portrait)             │
│                         │
│  - Greeting header      │
│  - Stats cards          │
│  - Quick actions        │
│  - Upcoming tasks       │
│                         │
│                         │
│                         │
└─────────────────────────┘
```

---

## Slide 5: Tasks Screen - List View

### **Comprehensive Task Management**

**Features:**
- Priority badges (Low, Medium, High)
- Status indicators (Pending, In Progress, Completed)
- Source icons (Canvas, Manual, Google)
- Quick status toggle
- Advanced filtering

---

```
┌─────────────────────────┐
│                         │
│   [TASKS SCREEN]        │
│   SCREENSHOT            │
│   (Portrait)            │
│                         │
│   - Filter button       │
│   - Task list           │
│   - Priority colors     │
│   - Status badges       │
│   - Due dates           │
│                         │
│                         │
└─────────────────────────┘
```

---

## Slide 6: Task Filtering

### **Smart Task Filtering**

**Filter Options:**
- All Tasks
- Pending
- In Progress
- Completed
- Due Soon (7 days)
- Canvas Tasks
- Manual Tasks

---

```
┌─────────────────────────┐
│                         │
│  [FILTER MODAL]         │
│  SCREENSHOT             │
│  (Portrait)             │
│                         │
│  - Filter options       │
│  - Active filter        │
│  - Checkmarks           │
│                         │
│                         │
│                         │
│                         │
└─────────────────────────┘
```

---

## Slide 7: Canvas Integration - Courses

### **Canvas LMS Integration**

**Features:**
- Active courses list
- Course codes
- Direct Canvas links
- Real-time sync

---

```
┌─────────────────────────┐
│                         │
│  [CANVAS SCREEN]        │
│  SCREENSHOT             │
│  (Portrait)             │
│                         │
│  - Connected status     │
│  - Stats cards          │
│  - Courses list         │
│  - Course details       │
│                         │
│                         │
│                         │
└─────────────────────────┘
```

---

## Slide 8: Canvas - Assignments

### **Automatic Assignment Sync**

**Features:**
- Upcoming assignments (30 days)
- Due date countdown
- Points display
- Overdue highlighting
- Individual/bulk sync
- Duplicate prevention

---

```
┌─────────────────────────┐
│                         │
│  [ASSIGNMENTS TAB]      │
│  SCREENSHOT             │
│  (Portrait)             │
│                         │
│  - Assignment cards     │
│  - Due dates            │
│  - Points               │
│  - Sync buttons         │
│  - Overdue markers      │
│                         │
│                         │
└─────────────────────────┘
```

---

## Slide 9: Canvas - Announcements

### **Course Announcements**

**Features:**
- Recent announcements
- Posted dates
- Quick add to tasks
- Direct links to Canvas

---

```
┌─────────────────────────┐
│                         │
│  [ANNOUNCEMENTS TAB]    │
│  SCREENSHOT             │
│  (Portrait)             │
│                         │
│  - Announcement cards   │
│  - Posted dates         │
│  - Message preview      │
│  - Add task button      │
│                         │
│                         │
│                         │
└─────────────────────────┘
```

---

## Slide 10: Calendar View

### **Visual Task Planning**

**Features:**
- Interactive calendar
- Color-coded dates:
  - 🟢 Today
  - 🔴 Overdue
  - 🟡 Pending
  - 🟢 Completed
- Day view with tasks
- Google Calendar sync

---

```
┌─────────────────────────┐
│                         │
│  [CALENDAR SCREEN]      │
│  SCREENSHOT             │
│  (Portrait)             │
│                         │
│  - Calendar grid        │
│  - Colored dots         │
│  - Selected date        │
│  - Tasks for day        │
│                         │
│                         │
│                         │
└─────────────────────────┘
```

---

## Slide 11: Add Task Screen

### **Create Custom Tasks**

**Features:**
- Title & description
- Due date picker
- Priority selection
- Status selection
- Form validation

---

```
┌─────────────────────────┐
│                         │
│  [ADD TASK SCREEN]      │
│  SCREENSHOT             │
│  (Portrait)             │
│                         │
│  - Title input          │
│  - Description field    │
│  - Date picker          │
│  - Priority dropdown    │
│  - Save button          │
│                         │
│                         │
└─────────────────────────┘
```

---

## Slide 12: Task Detail Screen

### **Complete Task Information**

**Features:**
- Full task details
- Edit/Delete options
- Status management
- Priority display
- Due date & time
- Source indicator

---

```
┌─────────────────────────┐
│                         │
│  [TASK DETAIL SCREEN]   │
│  SCREENSHOT             │
│  (Portrait)             │
│                         │
│  - Task title           │
│  - Description          │
│  - Priority badge       │
│  - Status badge         │
│  - Due date             │
│  - Action buttons       │
│                         │
└─────────────────────────┘
```

---

## Slide 13: Profile & Settings

### **User Profile Management**

**Features:**
- User information
- Canvas connection status
- Google Calendar status
- Logout option

---

```
┌─────────────────────────┐
│                         │
│  [PROFILE SCREEN]       │
│  SCREENSHOT             │
│  (Portrait)             │
│                         │
│  - User name            │
│  - Email                │
│  - Canvas status        │
│  - Google status        │
│  - Logout button        │
│                         │
│                         │
└─────────────────────────┘
```

---

## Slide 14: Technology Stack & Architecture

### **Modern Tech Stack**

**Frontend:**
- React Native 0.76.9
- Expo SDK 52.0.0
- TypeScript 5.3.3

**Backend:**
- Supabase (PostgreSQL)
- Row Level Security

**Integrations:**
- Canvas LMS API
- Google Calendar API

---

### **Simple Architecture**

```
┌──────────────────────────────────┐
│     Mobile App (React Native)    │
├──────────────────────────────────┤
│  Dashboard | Tasks | Canvas      │
├──────────────────────────────────┤
│  Task Service | Canvas Service   │
├──────────────────────────────────┤
│     Supabase Backend (DB)        │
└──────────────────────────────────┘
         ↓              ↓
    Canvas API    Google API
```

---

## Slide 15: Key Achievements & Impact

### **Project Success**

**📊 By the Numbers:**
- 10,000+ lines of code
- 12 functional screens
- 3 API integrations
- 15+ features

**⏰ Student Impact:**
- Saves 90-180 hours/year
- Reduces missed deadlines
- Centralizes all tasks
- Improves organization

**🚀 Future Plans:**
- iOS support
- Push notifications
- Multi-LMS support
- AI-powered features

---

### **Thank You!**

---

**Contact:** rayedriasat@gmail.com  
**Platform:** Android (Expo)  
**Status:** ✅ Production Ready
