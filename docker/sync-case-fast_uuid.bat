@echo off
setlocal enabledelayedexpansion

:: Set console colors
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "GREEN=%ESC%[32m"
set "RED=%ESC%[31m"
set "YELLOW=%ESC%[33m"
set "BLUE=%ESC%[34m"
set "RESET=%ESC%[0m"

:: Display header
echo %BLUE%=====================================
echo    rclone FAST Case Sync Tool
echo =====================================%RESET%
echo.

:INPUT
set /p CASE_NO="Enter case UUID (e.g., 25f3c3d1-27ba-4d82-832a-0c6a543339a1): "

:: Check if input is empty
if "%CASE_NO%"=="" (
    echo %RED%Error: Case UUID cannot be empty!%RESET%
    goto INPUT
)

:: Simple UUID format check (optional but helpful)
set "uuid_check=!CASE_NO!"
if not "!uuid_check:~8,1!!uuid_check:~13,1!!uuid_check:~18,1!!uuid_check:~23,1!"=="----" (
    echo %RED%Error: Invalid UUID format!%RESET%
    goto INPUT
)

:: Construct the paths
set SOURCE_PATH=etabella/doc/case%CASE_NO%/
set DEST_PATH=etabella/doc/case%CASE_NO%/

:: Display the paths
echo.
echo %BLUE%Debug Information:%RESET%
echo Case Number: %YELLOW%%CASE_NO%%RESET%
echo Source Path: %YELLOW%digitalocean:%SOURCE_PATH%%RESET%
echo Destination Path: %YELLOW%minio:%DEST_PATH%%RESET%
echo.

:: Ask for optimization level
echo %BLUE%Select transfer speed optimization:%RESET%
echo 1. Normal    (4 transfers,  8 checkers) - Current speed
echo 2. Fast      (8 transfers, 16 checkers) - 2x faster
echo 3. Very Fast (16 transfers, 32 checkers) - 4x faster  
echo 4. Max Speed (32 transfers, 64 checkers) - Maximum speed
echo.
set /p SPEED_LEVEL="Choose optimization level (1-4): "

:: Set parameters based on speed level using goto
if "%SPEED_LEVEL%"=="1" goto LEVEL1
if "%SPEED_LEVEL%"=="2" goto LEVEL2
if "%SPEED_LEVEL%"=="3" goto LEVEL3
if "%SPEED_LEVEL%"=="4" goto LEVEL4
goto INVALID_LEVEL

:LEVEL1
set TRANSFERS=4
set CHECKERS=8
set CHUNK_SIZE=8M
set BUFFER_SIZE=16M
goto LEVEL_SET

:LEVEL2
set TRANSFERS=8
set CHECKERS=16
set CHUNK_SIZE=16M
set BUFFER_SIZE=32M
goto LEVEL_SET

:LEVEL3
set TRANSFERS=16
set CHECKERS=32
set CHUNK_SIZE=32M
set BUFFER_SIZE=64M
goto LEVEL_SET

:LEVEL4
set TRANSFERS=32
set CHECKERS=64
set CHUNK_SIZE=64M
set BUFFER_SIZE=128M
goto LEVEL_SET

:INVALID_LEVEL
echo %YELLOW%Invalid choice, using Fast (level 2)%RESET%
set TRANSFERS=8
set CHECKERS=16
set CHUNK_SIZE=16M
set BUFFER_SIZE=32M

:LEVEL_SET
echo.
echo %YELLOW%Optimization: %TRANSFERS% transfers, %CHECKERS% checkers, %CHUNK_SIZE% chunks%RESET%
echo.

:: Ask for confirmation
set /p CONFIRM="Do you want to proceed with FAST sync? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo %YELLOW%Sync cancelled by user.%RESET%
    goto END
)

:: Check if rclone container responds
echo %BLUE%Checking rclone container...%RESET%
docker exec etabella-rclone echo "test" >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%Error: rclone container is not responding!%RESET%
    goto END
)

:: Test connections quickly
echo %BLUE%Testing connections...%RESET%
docker exec etabella-rclone rclone --timeout 5s lsd digitalocean: >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ DigitalOcean connection failed!%RESET%
    goto END
)

docker exec etabella-rclone rclone --no-check-certificate --timeout 5s lsd minio: >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ MinIO connection failed!%RESET%
    goto END
)

echo %GREEN%✅ Both connections working%RESET%

:: Display the optimized command
echo.
echo %BLUE%Executing OPTIMIZED rclone sync command...%RESET%
echo %YELLOW%Transfers: %TRANSFERS% parallel, Checkers: %CHECKERS%, Chunk size: %CHUNK_SIZE%%RESET%
echo.

:: Run the FAST rclone sync command with optimizations (simplified)
docker exec etabella-rclone rclone sync digitalocean:%SOURCE_PATH% minio:%DEST_PATH% --no-check-certificate --progress --stats=5s --transfers=%TRANSFERS% --checkers=%CHECKERS% --retries=3 --buffer-size=%BUFFER_SIZE% --fast-list

:: Check the exit code
if %errorlevel% equ 0 (
    echo.
    echo %GREEN%✅ FAST sync completed successfully!%RESET%
    echo %GREEN%Case %CASE_NO% files transferred at optimized speed!%RESET%

    :: Show what was synced
    echo.
    echo %BLUE%Verifying sync...%RESET%
    docker exec etabella-rclone rclone size minio:%DEST_PATH% --no-check-certificate
) else (
    echo.
    echo %RED%❌ Sync failed with error code %errorlevel%!%RESET%
    echo %YELLOW%Try with lower optimization level or check network%RESET%
)

:: ----------------------------------------------------------------------
:: Ask if user wants to sync another case (loop back to UUID input)
:: ----------------------------------------------------------------------
echo.
set /p NEXT_CASE="%BLUE%Sync another case? (y/N): %RESET%"
if /i "%NEXT_CASE%"=="y" (
    echo.
    echo %BLUE%=====================================
    echo    Starting next case sync
    echo =====================================%RESET%
    echo.
    goto INPUT
)

:END
echo.
echo %BLUE%Press any key to exit...%RESET%
pause >nul