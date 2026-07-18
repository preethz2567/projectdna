@echo off
echo Starting ProjectDNA Local Development Environment...

echo Starting Backend (Node.js)...
start "ProjectDNA Backend" cmd /c "cd server && npm run dev"

echo Starting Frontend (React/Vite)...
start "ProjectDNA Frontend" cmd /c "cd client && npm run dev"

echo Starting AI Service (Python)...
start "ProjectDNA AI Service" cmd /c "cd ai-service && venv\Scripts\activate && python app.py"

echo All services are starting in separate windows!
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:3000
echo - AI:       http://localhost:5001
echo.
echo To stop the servers, just close the 3 new command prompt windows.
pause
