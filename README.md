# BWC Portal - Task & Company Management System

## Overview

The BWC Portal is a comprehensive, full-stack web application designed for internal team and company management. It provides a centralized platform for user authentication, task assignment, group collaboration, and company/event management. The application features a modern, responsive user interface built with React and a robust, high-performance backend API powered by FastAPI.

---

## Key Features

-   **User Authentication**: Secure user registration and login system using JWT (JSON Web Tokens). Includes password reset functionality via email.
-   **Role-Based Access Control**: Differentiates between regular `users` and `admins`, with specific privileges for administrative functions.
-   **Admin Panel**: A dedicated interface for administrators to manage all users, including updating roles (admin/user) and toggling active status.
-   **Task Management**: Full CRUD (Create, Read, Update, Delete) functionality for tasks. Tasks can be assigned priorities (Urgent/Important) and associated with specific companies.
-   **Company Management**: Admins can create, view, edit, and delete company profiles. Each task created must be assigned to a company.
-   **Event & Seminar System**: Admins can create events/seminars with a specific date, time, and location.
    -   **Event Notifications**: Non-admin users are greeted with a pop-up modal on login, notifying them of the next upcoming event.
    -   **Calendar Integration**: All events, task deadlines, and user birthdays are automatically displayed on the main dashboard calendar.
-   **Interactive Dashboard**: A central dashboard that provides a color-coded, at-a-glance overview of tasks categorized by urgency and importance.
-   **Group Collaboration**: Admins can create user groups and assign tasks to them.

---

## Technology Stack

### Backend

-   **Framework**: FastAPI
-   **Language**: Python 3.11+
-   **Database**: PostgreSQL
-   **ORM**: SQLAlchemy
-   **Data Validation**: Pydantic
-   **Authentication**: Passlib (for password hashing), python-jose (for JWT)
-   **Environment Variables**: python-dotenv
-   **Server**: Uvicorn

### Frontend

-   **Framework**: React 18+
-   **Build Tool**: Vite
-   **Routing**: React Router
-   **UI Components**: `react-datepicker` for custom date/time selection
-   **Styling**: Plain CSS with a custom variable-based theme.

---

## Project Setup and Installation

Follow these steps to get the project running on your local machine.

### 1. Backend Setup

1.  **Navigate to the Backend Directory**:
    ```bash
    cd "Backend Code"
    ```

2.  **Create and Activate a Virtual Environment**:
    ```bash
    # Create the environment
    python -m venv venv

    # Activate it (on Windows PowerShell)
    .\venv\Scripts\activate
    ```

3.  **Install Dependencies**:
    Run the following command to install all required Python packages:
    ```bash
    pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary python-dotenv "passlib[bcrypt]" "python-jose[cryptography]" "pydantic[email]"
    ```

4.  **Configure Environment Variables (Optional)**:
    If you want to enable the password reset feature, you must create a `.env` file in the `Backend Code` directory and add your SMTP email credentials:
    ```env
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USERNAME=your-email@gmail.com
    EMAIL_PASSWORD=your-gmail-app-password
    EMAIL_SENDER_NAME="BWC Portal"
    ```

5.  **Set Up the Database**:
    The following scripts must be run in order to initialize and populate the database.
    ```bash
    # First, reset the database to create all tables correctly
    # (You will be asked to confirm this action)
    python reset_database.py

    # Next, seed the database with the default admin user and companies
    python seed.py
    ```

6.  **Run the Backend Server**:
    ```bash
    uvicorn main:app --reload
    ```
    The backend API will now be running at `http://127.0.0.1:8000`. You can view the interactive documentation at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

1.  **Navigate to the Frontend Directory**:
    Open a **new terminal** and navigate to the frontend code:
    ```bash
    cd "Frontend Code"
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Frontend Development Server**:
    ```bash
    npm run dev
    ```
    The frontend application will now be accessible at `http://localhost:5173`.

---
## Default Login

After seeding the database, you can log in with the following default administrator credentials:
-   **Email**: `admin@bwc.com`
-   **Password**: `password`
