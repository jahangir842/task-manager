# Task Manager Application

A full-stack task management application built with FastAPI backend and Vite-powered frontend.

## Project Structure

```
task-manager/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── main.js
    ├── style.css
    ├── package.json
    └── vite.config.js
```

## Backend Setup

### Prerequisites
- Python 3.x
- PostgreSQL

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory with your database configuration:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/taskmanager
```

5. Start the backend server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation will be available at `http://localhost:8000/docs`

### Backend Dependencies
- FastAPI (v0.104.1)
- SQLAlchemy (v2.0.23)
- Uvicorn (v0.24.0)
- PostgreSQL (via psycopg2-binary v2.9.9)
- Pydantic (v2.5.0)
- python-dotenv (v1.0.0)

## Frontend Setup

### Prerequisites
- Node.js

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Frontend Stack
- Vite (v5.0.0)
- JavaScript
- HTML/CSS

## Features

- Task Creation and Management
- RESTful API
- Database Integration
- Modern UI Interface

## API Endpoints

The following endpoints are available:

- `GET /tasks` - Retrieve all tasks
- `POST /tasks` - Create a new task
- `GET /tasks/{task_id}` - Retrieve a specific task
- `PUT /tasks/{task_id}` - Update a task
- `DELETE /tasks/{task_id}` - Delete a task

## Development

To work on both frontend and backend simultaneously:

1. Start the backend server (in backend directory):
```bash
uvicorn main:app --reload
```

2. Start the frontend development server (in frontend directory):
```bash
npm run dev
```

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```

### Backend
The backend can be deployed using any ASGI server. For production, it's recommended to use Gunicorn with Uvicorn workers.

## License

MIT License

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request