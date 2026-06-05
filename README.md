# Matias AegisAuth

A comprehensive authentication risk analysis system with real-time monitoring and security assessment capabilities.

## Features

- **Password Analysis**: Analyze password strength and crack time estimates
- **Hash Detection**: Identify hash types and assess security
- **Feasibility Simulation**: Simulate attack feasibility based on entropy
- **Recommendation Engine**: Generate security recommendations
- **Real-time Dashboard**: Live monitoring of security metrics
- **Statistics Overview**: Track analysis history and risk trends

## Project Structure

```
Matias_AegisAuth/
├── Backend/                 # FastAPI backend
│   ├── app/
│   │   ├── analyzers/      # Analysis modules
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── security/       # JWT authentication
│   │   └── main.py         # Application entry point
│   └── requirments.txt     # Python dependencies
└── Frontend/               # React + Vite frontend
    └── Matias-Aegis-Auth/
        ├── src/
        │   ├── api/        # API client
        │   ├── hooks/      # Custom React hooks
        │   └── components/ # UI components
        └── package.json    # Node dependencies
```

## Getting Started

### Backend Setup

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirments.txt
```

5. Run the server:
```bash
python -m uvicorn app.main:app --reload
```

The backend will be available at `http://127.0.0.1:8000`

### Frontend Setup

1. Navigate to the Frontend directory:
```bash
cd Frontend/Matias-Aegis-Auth
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or `http://localhost:5174` if 5173 is in use)

## API Endpoints

### Analysis Endpoints
- `POST /analyze/password` - Analyze password strength
- `POST /analyze/hash` - Detect hash type
- `POST /analyze/feasibility` - Simulate attack feasibility
- `POST /analyze/recommendations` - Get security recommendations

### Statistics Endpoints
- `GET /stats/overview` - Get overall statistics
- `GET /stats/recent` - Get recent analysis alerts
- `GET /stats/risk_trend` - Get risk trend data

### Live Monitoring
- WebSocket endpoint for real-time security updates

## Technology Stack

### Backend
- FastAPI - Modern Python web framework
- SQLAlchemy - ORM for database operations
- JWT - Authentication
- Uvicorn - ASGI server

### Frontend
- React 19 - UI library
- Vite - Build tool
- TailwindCSS - Styling
- Recharts - Data visualization
- React Router - Client-side routing

## License

This project is private and proprietary.
