@echo off
TITLE CraveDash Microservices Orchestrator Launcher
echo =========================================================================
echo    CRAVEDASH MOBILITY SERVICES - MICROSERVICES LAUNCH ENGINE
echo    Course: 24SDCS03A - SOA PROGRAMMING AND MICROSERVICES
echo    Project: PS034 Multi-Restaurant Food Ordering & Delivery Orchestration
echo    Team: PS34-S-03-02 (Om Prakhar, Mradul Dixit, Abhinav Singh)
echo =========================================================================
echo.

cd /d "%~dp0"

echo [0/6] Checking PostgreSQL database service...
net start postgresql-x64-18 >nul 2>&1

echo [1/6] Launching Eureka Discovery Server on port 8761...
start "CraveDash - Eureka Server (:8761)" cmd /k "cd eureka-server && mvn spring-boot:run"

echo Waiting 12 seconds for Eureka to register its registry...
timeout /t 12 /nobreak >nul

echo [2/6] Launching Auth and Identity Service on port 8084...
start "CraveDash - Auth Service (:8084)" cmd /k "cd auth-service && mvn spring-boot:run"

echo [3/6] Launching Restaurant Catalog Service on port 8081...
start "CraveDash - Restaurant Service (:8081)" cmd /k "cd restaurant-service && mvn spring-boot:run"

echo [4/6] Launching Payment Transaction Service on port 8083...
start "CraveDash - Payment Service (:8083)" cmd /k "cd payment-service && mvn spring-boot:run"

echo [5/6] Launching Order Orchestration Service on port 8082...
start "CraveDash - Order Service (:8082)" cmd /k "cd order-service && mvn spring-boot:run"

echo Waiting 10 seconds for backend microservices to register with Eureka...
timeout /t 10 /nobreak >nul

echo [6/6] Launching Spring Cloud API Gateway on port 8080...
start "CraveDash - API Gateway (:8080)" cmd /k "cd api-gateway && mvn spring-boot:run"

echo.
echo =========================================================================
echo All microservices launched in dedicated interactive consoles!
echo Eureka Registry:    http://localhost:8761
echo API Gateway:        http://localhost:8080
echo Frontend Portal:    %~dp0frontend\index.html
echo =========================================================================
echo Opening CraveDash Web Portal in default browser...
start "" "%~dp0frontend\index.html"
pause
