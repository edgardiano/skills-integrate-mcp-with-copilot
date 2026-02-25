# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Teacher login/logout (Admin Mode)
- Register and unregister students (teacher-only actions)

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   uvicorn app:app --reload
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/auth/login?username=<user>&password=<pass>`                    | Login as teacher and receive auth token                             |
| POST   | `/auth/logout`                                                    | Logout current teacher token                                        |
| GET    | `/auth/status`                                                    | Check if current token belongs to a logged-in teacher               |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Register a student for an activity (teacher-only)                   |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Remove a student from an activity (teacher-only)                    |

## Admin Mode Credentials

Teacher usernames/passwords are stored in `teachers.json` and validated by the backend.

Example file:

```json
{
   "ms.smith": "teach123",
   "mr.johnson": "teach456"
}
```

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
