@echo off

set LOGFILE=%~dp0log.txt
echo Starting batch process... > "%LOGFILE%"
@REM :: Check if Node.js version 20 is installed
@REM node -v | find "v20." > nul
@REM IF %ERRORLEVEL% NEQ 0 (
@REM     echo Installing Node.js version 20...
@REM     :: Add the command to install Node.js version 20 here. This placeholder might need replacing with a specific installer command.
@REM     curl -o node-v20-setup.exe https://nodejs.org/dist/latest-v20.x/node-v20.x.x-x64.msi
@REM     start /wait node-v20-setup.exe
@REM ) ELSE (
@REM     echo Node.js version 20 is already installed.
@REM )

:: Install project dependencies
echo Installing npm dependencies... > "%LOGFILE%"
call npm install --force


echo Checking for pm2 >> "%LOGFILE%"
call npm list -g pm2 > nul 2>&1

REM Check the error level of the last command
if %ERRORLEVEL% NEQ 0 (
    echo pm2 is not installed, installing... >> "%LOGFILE%"
    call npm install -g pm2
) else (
    echo pm2 is already installed. >> "%LOGFILE%"
)



echo deleting previous project >> "%LOGFILE%"
REM Install npm packages
call pm2 delete realtime.config.js
if ERRORLEVEL 1 (
    echo Error delete pm2! >> "%LOGFILE%"
    goto end
) else (
    echo pm2 delete >> "%LOGFILE%"
)


echo starting project >> "%LOGFILE%"
REM Install npm packages
call pm2 start realtime.config.js --env production
if ERRORLEVEL 1 (
    echo Error start pm2! >> "%LOGFILE%"
    goto end
) else (
    echo pm2 started >> "%LOGFILE%"
)



echo Reloading >> "%LOGFILE%"
REM Install npm packages
call pm2 reload realtime.config.js --env production




echo List >> "%LOGFILE%"
REM Install npm packages
call pm2 monit


echo Operations completed successfully. >> "%LOGFILE%"

:end
pause
