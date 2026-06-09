@echo off
REM Usage:
REM   set FD_TOKEN=... 
REM   scripts\attack_100_reports.py

setlocal

if "%FD_TOKEN%"=="" (
  echo Missing FD_TOKEN env var. Set it to your Bearer JWT token.
  exit /b 1
)

python scripts\attack_100_reports.py
exit /b %errorlevel%


