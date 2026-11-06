@echo off
title HNU CTF - PHP Backend Server
echo ========================================================
echo   Starting HNU CTF PHP Backend Server on port 8000...
echo   URL: http://127.0.0.1:8000
echo ========================================================
echo.
cd /d "%~dp0"
php -S 127.0.0.1:8000 router.php
pause

