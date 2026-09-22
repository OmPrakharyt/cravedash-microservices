# CraveDash Mobility Services - PowerShell Orchestrator Launcher
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "   CRAVEDASH MOBILITY SERVICES - MICROSERVICES LAUNCH ENGINE" -ForegroundColor Yellow
Write-Host "   Course: 24SDCS03A - SOA PROGRAMMING AND MICROSERVICES" -ForegroundColor White
Write-Host "   Project: PS034 Multi-Restaurant Food Ordering & Delivery Orchestration" -ForegroundColor White
Write-Host "   Team: PS34-S-03-02 (Om Prakhar, Mradul Dixit, Abhinav Singh)" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Cyan

$baseDir = $PSScriptRoot

Write-Host "`n[0/6] Verifying PostgreSQL Service on localhost:5432..." -ForegroundColor Yellow
$pgService = Get-Service *postgres* -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pgService -and $pgService.Status -ne 'Running') {
    Write-Host "Starting PostgreSQL Service ($($pgService.Name))..." -ForegroundColor Yellow
    Start-Service $pgService.Name
}

Write-Host "[1/6] Starting Eureka Discovery Server (:8761)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\eureka-server'; mvn spring-boot:run"
Start-Sleep -Seconds 12

Write-Host "[2/6] Starting Auth Service (:8084)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\auth-service'; mvn spring-boot:run"

Write-Host "[3/6] Starting Restaurant Service (:8081)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\restaurant-service'; mvn spring-boot:run"

Write-Host "[4/6] Starting Payment Service (:8083)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\payment-service'; mvn spring-boot:run"

Write-Host "[5/6] Starting Order Orchestrator Service (:8082)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\order-service'; mvn spring-boot:run"
Start-Sleep -Seconds 10

Write-Host "[6/6] Starting API Gateway (:8080)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\api-gateway'; mvn spring-boot:run"

Write-Host "`nAll microservices initiated!" -ForegroundColor Green
Write-Host "Eureka Registry:  http://localhost:8761" -ForegroundColor Yellow
Write-Host "API Gateway:      http://localhost:8080" -ForegroundColor Yellow
Write-Host "Launching Frontend Portal..." -ForegroundColor Green

Start-Process "$baseDir\frontend\index.html"
