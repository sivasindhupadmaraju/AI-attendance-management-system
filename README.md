# AI Smart Attendance System (Biometric Facial Recognition)

A high-performance full-stack web application designed for automatic attendance logging using computer vision and facial biometrics. It integrates a secure **FastAPI** backend with a responsive, modern **React + Tailwind CSS** admin control center.

## 🚀 Features

- **Biometric Face Scan logging**: Captures frames from webcam streams, processes face boundaries, generates 128-dimensional embedding vectors, and compares them with registered students using standard Euclidean distance.
- **Biometric Enrollment Control**: Add new student profiles along with front-facing portraits. Rejects enrollment if a face is not detected in the photograph.
- **Attendance Categorization**: Automatically groups logs under "Present" or "Late Arrival" based on customizable time guidelines (e.g. 9:00 AM threshold). Prevents duplicate logs for the same student on any given day.
- **High-fidelity Analytics**: View daily attendance trends, absent/present charts via Recharts, and department enrollment distributions.
- **CSV Data Exporter**: Queries historic database logs and generates downloadable CSV spreadsheets with authorization headers.
- **JWT Authorization Guards**: Authenticates admin/teacher logins using JSON Web Tokens (python-jose) and securely encrypts user records using bcrypt hash routines.
- **Developer Mock Mode Fallback**: Gracefully detects if `face_recognition` (dlib) or OpenCV binaries are missing from the host machine and runs in mock simulations, enabling full UI walkthroughs without heavy hardware requirements!

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, React Router v6, Tailwind CSS v3, Axios, Recharts, Lucide Icons |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, Pydantic |
| **Biometrics** | `face_recognition` (dlib model), OpenCV-Python, NumPy |
| **Database** | SQLite (via SQLAlchemy engine) |

---

## 📂 Project Structure

```
AI attendance management system/
├── backend/
│   ├── app/
│   │   ├── config.py            # Global Settings (JWT, Database, Thresholds)
│   │   ├── database.py          # SQLAlchemy connection & DB session local creators
│   │   ├── main.py              # FastAPI app initializer, CORS, static serving mounts
│   │   ├── models/              # SQLAlchemy Database Tables
│   │   │   ├── user.py          # Admin/Teacher users
│   │   │   ├── student.py       # Enrolled students with LargeBinary face encodings
│   │   │   └── attendance.py    # Attendance logs with status (present/late/absent)
│   │   ├── schemas/             # Pydantic Serializers & Payloads
│   │   ├── routers/             # API Endpoints (Auth, Students, Attendance, Reports)
│   │   ├── services/            # Cryptographic & Face Recognition logic
│   │   └── utils/               # FastAPI dependency injectors (get_db, get_current_user)
│   ├── student_images/          # Uploaded student face images stored on disk
│   ├── requirements.txt         # Backend Python dependencies
│   ├── seed_data.py             # Script to initialize tables and populate sample data
│   └── run.py                   # Development script to launch uvicorn
│
└── frontend/
    ├── src/
    │   ├── api/                 # Axios clients and API hooks
    │   ├── components/          # Reusable UI components (Sidebar, WebcamCapture, Table, Charts)
    │   ├── context/             # AuthContext state provider
    │   ├── pages/               # Views (Login, Dashboard, Student List, Records, Reports)
    │   ├── App.jsx              # Main App layout & route declarations
    │   └── main.jsx             # React Virtual DOM mounting script
    ├── tailwind.config.js       # Tailwind CSS v3 theme directives
    ├── package.json             # Frontend Node.js dependencies
    └── vite.config.js           # Vite server settings with backend proxy mapping
```

---

## 📦 Setup & Installation

### Prerequisites
- Python 3.10 or higher
- Node.js (v18 or higher)
- **C++ Build Tools** (Required on Windows if installing `face_recognition` to build `dlib` from source):
  - Download [Visual Studio Installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/) and select the **Desktop development with C++** workload.

---

### Step 1: Backend Setup

1. Open your terminal, navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows PowerShell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

4. Install the backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   > [!NOTE]
   > If the installation of `face-recognition` or `dlib` fails due to compilation issues, the backend will still run in **Developer Mock Mode**. This allows you to test the complete UI dashboard, log student listings, run mock webcam matches, and export report files.

5. Seed the database with default administrator accounts, student directories, and 7 days of attendance history:
   ```bash
   python seed_data.py
   ```
   *Seeding completes in seconds and creates the database file `attendance.db`.*

6. Start the FastAPI development server:
   ```bash
   python run.py
   ```
   *The API will start at [http://127.0.0.1:8000](http://127.0.0.1:8000). The Swagger API documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

---

### Step 2: Frontend Setup

1. Open a new terminal window and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install the frontend dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend dashboard will start at [http://localhost:5173](http://localhost:5173).*

---

## 🔑 Login Credentials

Log in using the seeded administrator details:
- **Email Address**: `admin@attendance.com`
- **Password**: `adminpassword`

---

## ⚙️ How Face Recognition Works

1. **Face Vector Generation**:
   During student registration, the uploaded image is processed by `face_recognition.face_encodings()`. It extracts 128 scalar vector points representing facial landmarks. These points are converted to a byte array using NumPy's `tobytes()` and saved in the SQLite `students` table as a `BLOB`. The source photo is stored on disk under `backend/student_images/`.

2. **Webcam Capture Processing**:
   In the **Live Attendance** view, the React client starts the webcam stream. Every 2.5 seconds, it takes a camera snapshot, converts it to a base64 string, and submits it to `/api/attendance/recognize`.

3. **Neural Vector Comparison**:
   The FastAPI server decodes the base64 image and loads all active student vector signatures from SQLite. It calculates the Euclidean distance between the webcam signature and all database student signatures.
   - If the closest distance is less than or equal to `0.50` (stricter than dlib's default `0.60` to reduce false positives), it identifies the student.
   - It maps the Euclidean distance to a percentage score for verification confidence.

4. **Biometric Logging & Duplication Lock**:
   Once identified, the system logs their arrival. If the arrival is past **9:00 AM**, the status is marked as **Late**; otherwise, it is logged as **Present**. The unique date/student constraint in SQLite prevents multiple check-ins on the same day.
