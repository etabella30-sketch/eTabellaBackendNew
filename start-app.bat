@echo off
SETLOCAL

:: Default to 'coreapi' if not set
IF "%APP_NAME%"=="" SET APP_NAME=coreapi
:: Default to 'coreapi' if not set
IF "%PROC_NAME%"=="" SET PROC_NAME=start
:: Default to 'development' if not set
IF "%ENV_MODE%"=="" SET ENV_MODE=development

:: Construct the .env file name based on the environment mode
SET ENV_FILE=.env.%ENV_MODE%

:: Check if the .env file exists and copy it to the correct location
IF EXIST "%ENV_FILE%" (
  copy "%ENV_FILE%" dist\.env
) ELSE (
  echo Environment file '%ENV_FILE%' not found!
  EXIT /B 1
)

:: Start the NestJS application based on the provided environment variables
IF "%ENV_MODE%"=="development" "%PROC_NAME%"=="start"  (
  ::nest %PROC_NAME% --debug --watch %APP_NAME%
  IF "%PROC_NAME%"=="start" (
      echo Running in development mode with debug and watch...
      nest %PROC_NAME% --debug --watch %APP_NAME%
  ) ELSE (
      echo Running %PROC_NAME% for %APP_NAME% in development mode...
      nest %PROC_NAME% %APP_NAME%
  )
) ELSE (
  nest %PROC_NAME% %APP_NAME%
)

ENDLOCAL
