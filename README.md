# 🎬 FilmVault — Movie Tracker Web Application

> Full Stack Web Development Project | 21EC2015 – Web Technology | IA3
> **Josiah A Anderson Samuel** | URK24EC3006 | Karunya Institute of Science and Technology

---

## 📌 Project Overview

FilmVault is a personal movie tracking web application — your own version of Letterboxd. Users can search movies, maintain a watchlist, track what they've watched, rate and review films, view statistics, and get AI-powered recommendations.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18 + Vite |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| External API | TMDb API (movie search & posters) |
| AI | Claude AI API (recommendations) |

---

## 🚀 Features

- 🔐 **User Authentication** — Register/Login with JWT tokens, bcrypt hashed passwords
- 🔍 **Movie Search** — Real-time TMDb API search with posters
- 📋 **Watchlist & History** — Track movies as Watchlist or Watched
- ⭐ **Rate & Review** — 1–5 star ratings with personal reviews
- 🎭 **Genre Tagging** — 12 genre categories
- 📊 **Statistics** — Genre breakdown, rating distribution, viewing insights
- 🤖 **AI Recommendations** — Claude AI suggests movies based on your taste
- ✅ **Input Validation** — 3-layer: React + express-validator + Mongoose schema

---

## 📁 Folder Structure

```
filmvault/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── middleware/auth.js     # JWT protect middleware
│   ├── models/
│   │   ├── User.js            # User schema + bcrypt pre-save hook
│   │   └── Movie.js           # Movie schema with enums + validation
│   ├── routes/
│   │   ├── auth.js            # POST /register, POST /login, GET /me
│   │   └── movies.js          # Full CRUD + GET /stats aggregation
│   ├── server.js              # Express app entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx     # Sidebar + routing wrapper
│   │   │   ├── MovieGrid.jsx  # Responsive movie card grid
│   │   │   ├── MovieModal.jsx # Edit status, rating, genre, review
│   │   │   ├── SearchBar.jsx  # TMDb search with dropdown
│   │   │   ├── StarRating.jsx # Interactive star rating
│   │   │   └── Toast.jsx      # Notification toasts
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Global auth state
│   │   │   └── MovieContext.jsx # Global movie state + CRUD
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx     # Login + Signup
│   │   │   ├── Dashboard.jsx    # All movies view
│   │   │   ├── WatchlistPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── StatsPage.jsx    # Charts + insights
│   │   │   └── AIPage.jsx       # AI recommendations
│   │   ├── utils/
│   │   │   ├── api.js           # Axios instance + JWT interceptors
│   │   │   └── tmdb.js          # TMDb search helper
│   │   ├── App.jsx              # Routes
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global cinematic dark theme
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local) or MongoDB Atlas account
- TMDb API key — free at [themoviedb.org](https://www.themoviedb.org/settings/api)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI and JWT_SECRET
npm install
npm run dev
# → Server running on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env: set VITE_TMDB_API_KEY
npm install
npm run dev
# → App running on http://localhost:5173
```

---

## 🔌 REST API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Create new account |
| POST | `/login` | Public | Login → returns JWT |
| GET | `/me` | Private | Get current user |

### Movies — `/api/movies`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Private | Get all user movies |
| GET | `/stats` | Private | Aggregated statistics |
| GET | `/:id` | Private | Get single movie |
| POST | `/` | Private | Add new movie |
| PUT | `/:id` | Private | Update status/rating/review |
| DELETE | `/:id` | Private | Remove movie |

---

## 🗃️ Database Design

**Users Collection**
- `username` — String, unique, 3–30 chars
- `email` — String, unique, validated
- `password` — bcrypt hashed

**Movies Collection**
- `user` — ObjectId ref to Users (1:N relationship)
- `title` — String, required
- `status` — enum: `watchlist` | `watched`
- `rating` — Number 0–5
- `genre` — enum: 12 genres
- `review` — String max 2000 chars

---

## 🔒 Security

- Passwords hashed with **bcryptjs** (10 salt rounds)
- **JWT** tokens expire in 30 days
- All movie routes protected with `auth` middleware
- Input sanitised with **express-validator**
- CORS configured for localhost dev

---

## 📊 Evaluation Rubric (IA3)

| Criteria | Marks |
|----------|-------|
| Design & UI Structure | 20 |
| Input Validation | 15 |
| Frontend–Backend Integration | 25 |
| GitHub Repository | 10 |
| Project Report | 15 |
| Viva / Presentation | 15 |
| **Total** | **100** |

---

*21EC2015 – Web Technology | Internal Assessment 3 | Karunya Institute of Science and Technology*
