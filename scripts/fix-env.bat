@echo off
echo.
echo [CONFIG] Fixing backend environment for local development...
echo.

cd secure-scrape-agent-backend

REM Create new .env content
(
echo # Environment Configuration
echo NODE_ENV=development
echo PORT=3004
echo.
echo # Database
echo DATABASE_URL=postgresql://neondb_owner:npg_8V7YdckjnaZz@ep-quiet-paper-a112i34q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
echo.
echo # Redis ^(UPDATED: localhost for local dev^)
echo REDIS_HOST=localhost
echo REDIS_PORT=6379
echo REDIS_PASSWORD=
echo.
echo # Milvus ^(UPDATED: localhost for local dev^)
echo MILVUS_ADDRESS=localhost:19530
echo MILVUS_USERNAME=
echo MILVUS_PASSWORD=
echo.
echo # AI Providers
echo OPENAI_API_KEY=sk-placeholder
echo ANTHROPIC_API_KEY=sk-placeholder
echo GEMINI_API_KEY=placeholder
echo.
echo # Security
echo JWT_SECRET=dev-secret-key
echo CORS_ORIGIN=http://localhost:5173
) > .env

echo [SUCCESS] Updated .env file!
echo.
echo [INFO] Restarting backend to apply changes...
echo.

cd ..
scripts\start-apps.bat
