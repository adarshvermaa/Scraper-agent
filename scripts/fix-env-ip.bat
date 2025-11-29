@echo off
echo.
echo [CONFIG] Fixing backend environment (using 127.0.0.1)...
echo.

cd secure-scrape-agent-backend

REM Create new .env content with 127.0.0.1
(
echo # Environment Configuration
echo NODE_ENV=development
echo PORT=3004
echo.
echo # Database
echo DATABASE_URL=postgresql://neondb_owner:npg_8V7YdckjnaZz@ep-quiet-paper-a112i34q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require^&channel_binding=require
echo.
echo # Redis
echo REDIS_HOST=127.0.0.1
echo REDIS_PORT=6379
echo REDIS_PASSWORD=
echo.
echo # Milvus
echo MILVUS_ADDRESS=127.0.0.1:19530
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
echo [INFO] Restarting backend...
echo.

cd ..
scripts\start-apps.bat
