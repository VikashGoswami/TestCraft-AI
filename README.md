# 🎓 TestCraft AI

[![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI_Extraction-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

> **TestCraft AI** is an intelligent, full-stack Computer-Based Testing (CBT) and assessment platform designed for educators, institutions, and learners. It combines AI-powered exam digitization, high-stakes CBT test delivery, automated negative-marking evaluation, and diagnostic post-test performance analytics.

---

## 🌟 Key Highlights

### 🤖 1. AI Question Paper Extraction (Powered by Google Gemini)
- **One-Click Paper Digitization**: Upload scanned PDF or image exam papers (supports uploads up to 50MB via chunked multipart streaming).
- **Multimodal AI Pipeline**: Leverages Google Gemini (`gemini-3.5-flash` with automatic fallback to `gemini-2.5-flash-lite` and `gemini-3.8-flash`) to parse raw text and diagrams.
- **Intelligent Field Parsing**: Extracts question text, multiple choices, correct answer keys, topics, difficulty levels, **step-by-step explanations**, and **"💡 Short Tricks / Key Concepts"**.
- **Human-in-the-Loop Review**: Preview, edit, add, or prune parsed questions before publishing to a live test.

### 💻 2. Realistic CBT Test Runner
- **Competitive Exam Interface**: Replicates the UX of national competitive exams (e.g. NTA, JEE, CAT, GRE).
- **5-State Question Palette**:
  - ⚪ *Not Visited*
  - 🔴 *Not Answered*
  - 🟢 *Answered*
  - 🟣 *Marked for Review*
  - 🟣🟢 *Answered & Marked for Review*
- **Precision Server-Synchronized Timer**: Automatic test auto-submission upon timer expiry.
- **Configurable Test Parameters**: Negative marking (-0.25, -0.33, or custom penalty), question shuffling, option randomization, and custom passing scores.

### 📊 3. Diagnostic Candidate Results & AI Analysis
- **Comprehensive Scorecards**: Total questions, attempted count, unattempted count, correct/wrong counts, and obtained marks vs total marks.
- **AI Strengths & Weaknesses**: Diagnostic summary mapping candidate mastery across topics with actionable study recommendations.
- **Detailed Solution & Short Trick Review**: Candidates can inspect every question alongside official answers, detailed solutions, and memory shortcuts to avoid needing external study materials.

### 👩‍🏫 4. Comprehensive Educator & Admin Dashboard
- **Test Management**: Full lifecycle management (Draft ➔ Published ➔ Archived).
- **Bulk CSV / Excel Upload**: Alternative fast import via standard spreadsheets (sample template included).
- **Shareable Links & Access Control**: Generate custom slug links, QR codes, participant limits, and expiration windows.
- **Granular Attempt Inspection**: Educators can inspect all candidate submissions, review answers in a read-only modal, and monitor completion rates.
- **Multi-Role RBAC**: Support for `individual`, `teacher`, `institution_admin`, and `student`.

---

## 🏗️ Architecture & Tech Stack

```
TestCraft AI/
├── backend/            # Laravel 13 REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/   # Auth, Tests, Questions, Attempts, Dashboard
│   │   ├── Services/               # Gemini AI, Claude AI, Scoring, State Machine
│   │   ├── Models/                 # Test, Question, Option, Attempt, Share, etc.
│   │   └── Jobs/                   # Asynchronous AI report generation
│   ├── config/services.php         # Gemini & Claude configurations
│   └── routes/api.php              # Versioned API routes (/api/v1/...)
│
├── frontend/           # Next.js 14 (App Router)
│   ├── app/
│   │   ├── (auth)/                 # Login, Register, Google OAuth
│   │   ├── (dashboard)/            # Teacher & Admin management suite
│   │   └── take/[shareSlug]/       # Candidate instructions, CBT runner, results
│   ├── components/                 # CBT QuestionPalette, Modals, Timer, Reviewers
│   └── lib/                        # Axios client, types, state machine hooks
│
└── sample_questions.csv # Ready-to-use CSV import template
```

- **Backend**: Laravel 13, Laravel Sanctum (SPA Auth), Spatie Permission, Maatwebsite Excel, Google Gemini API, Anthropic Claude API.
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, Headless UI, React Hot Toast, QRCode.react.
- **Databases Supported**: MySQL 8.x, PostgreSQL 14+, or SQLite.

---

## 🚀 Getting Started

### Prerequisites
- **PHP**: `^8.2` or `^8.3`
- **Composer**: `^2.x`
- **Node.js**: `^20.x` or `^22.x`
- **MySQL / PostgreSQL** (or SQLite for local dev)
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

---

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
composer install

# Configure environment variables
cp .env.example .env

# Generate application key
php artisan key:generate
```

Open `backend/.env` and update the database and AI credentials:
```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=testcraft_ai
DB_USERNAME=root
DB_PASSWORD=

# Google Gemini API (for Question Paper Extraction & Short Tricks)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash

# (Optional) Anthropic Claude API for asynchronous reports
ANTHROPIC_API_KEY=your_anthropic_api_key_here

FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost
```

Run database migrations and seed default roles:
```bash
php artisan migrate --seed
```

Start the Laravel backend server:
```bash
php artisan serve --port=8000
```
*(Backend runs at `http://127.0.0.1:8000`)*

---

### 2. Frontend Setup

In a new terminal window:
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
```

Ensure `frontend/.env.local` contains:
```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
# Optional: Google OAuth Client ID if using Google Sign-In
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

Start the Next.js development server:
```bash
npm run dev
```
*(Frontend runs at `http://localhost:3000`)*

---

## 🧪 Testing & Verification

### Backend Tests
Execute the full test suite with PHPUnit:
```bash
cd backend
php artisan test
```
*Current test suite: 24/24 passing unit & feature tests (62 assertions).*

### Frontend Typecheck
Verify TypeScript integrity:
```bash
cd frontend
npx tsc --noEmit
```

---

## 📁 Bulk Upload CSV Format

You can test bulk upload using `sample_questions.csv` in the root folder:

| Column | Required | Description | Example |
|---|---|---|---|
| `question_text` | Yes | Question description | *What is the capital of France?* |
| `option_a` | Yes | First choice | *London* |
| `option_b` | Yes | Second choice | *Paris* |
| `option_c` | Yes | Third choice | *Berlin* |
| `option_d` | Yes | Fourth choice | *Madrid* |
| `correct_option` | Yes | Letter of correct choice (`a`, `b`, `c`, `d`) | `b` |
| `topic` | No | Subject or chapter tag | *Geography* |
| `difficulty` | No | `easy`, `medium`, or `hard` | `easy` |
| `marks` | No | Weightage marks | `1` |

---

## 🛡️ Security & Privacy
- **Secrets Management**: Sensitive credentials (`.env`, API keys) are strictly ignored in `.gitignore`.
- **Deterministic Scoring**: Exam scoring and negative marks are evaluated 100% deterministically in the backend service layer; AI never modifies student marks.
- **Ownership Middleware**: Candidate exam attempts are guarded by strict ownership validation and encrypted session identifiers.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
