@echo off
setlocal EnableExtensions
title Dino Game Server
cd /d "%~dp0"
set PORT=5173
set URL=http://127.0.0.1:%PORT%/
set LOG=%~dp0start.log

> "%LOG%" echo ==== %date% %time% ====
>>"%LOG%" echo --- where node:
where node >>"%LOG%" 2>&1
>>"%LOG%" echo --- where py:
where py >>"%LOG%" 2>&1
>>"%LOG%" echo --- where python:
where python >>"%LOG%" 2>&1

rem ---- 1) Node.js ----
node -v >>"%LOG%" 2>&1
if not errorlevel 1 (
  >>"%LOG%" echo [OK] Dung Node.js
  call node build.js >>"%LOG%" 2>&1
  start "" cmd /c "ping -n 3 127.0.0.1 >nul & start %URL%"
  node server.js
  goto :end
)

rem ---- 2) Python launcher (py) ----
py -3 -c "import sys; print(sys.version)" >>"%LOG%" 2>&1
if not errorlevel 1 (
  set PYCMD=py -3
  goto :python
)

rem ---- 3) python (bo qua ban gia cua Microsoft Store) ----
python -c "import sys; print(sys.version)" >>"%LOG%" 2>&1
if not errorlevel 1 (
  set PYCMD=python
  goto :python
)

>>"%LOG%" echo [LOI] Khong tim thay Node.js hay Python chay duoc. Mo file truc tiep.
echo Khong tim thay Node.js/Python chay duoc - mo game truc tiep bang file.
start "" "%~dp0src\index.html"
goto :end

:python
>>"%LOG%" echo [OK] Dung %PYCMD%
echo Server Python tai %URL%  (dong cua so nay de tat server)
start "" cmd /c "ping -n 3 127.0.0.1 >nul & start %URL%"
%PYCMD% -m http.server %PORT% --bind 127.0.0.1 --directory "%~dp0src" 2>>"%LOG%"
>>"%LOG%" echo [THOAT] Server da dung, ma loi %errorlevel%

:end
echo.
echo Xem chi tiet trong start.log. Nhan phim bat ky de dong.
pause >nul
