# StrokeGuard AI

Advanced stroke detection system with real-time sensors, AI risk analysis (Gemini), Telegram alerts.

## Quick Start

```bash
npm install
npm run dev  # Full stack: backend:5000 + frontend:3000
```

Frontend: http://localhost:3000  
API: http://localhost:5000/api/auth

## Features
- Real auth (bcrypt/jwt)
- Mock sensors + charts (recharts)
- AI risk prediction (Gemini fallback)
- Alert system + Telegram
- Vercel deploy ready (static + serverless planned)

## Users (db.json)
email: adu@gmail.com

## Deploy
```bash
npm run build
vercel
```

## .env (optional)
Copy .env.example
