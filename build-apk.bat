@echo off
echo ========================================
echo    ساخت APK توار
echo ========================================

REM پیدا کردن Gradle داخل Android Studio
set GRADLE_PATH=
for /d %%G in ("%LOCALAPPDATA%\Google\AndroidStudio*") do (
    for /f "delims=" %%H in ('dir /b /s "%%G\plugins\android\lib\external-system-impl\gradle\*\bin\gradle.bat" 2^>nul') do (
        set GRADLE_PATH=%%H
    )
)

REM اگه پیدا نشد از Android SDK استفاده کن
if "%GRADLE_PATH%"=="" (
    for /f "delims=" %%G in ('where gradle 2^>nul') do set GRADLE_PATH=%%G
)

if "%GRADLE_PATH%"=="" (
    echo خطا: Gradle پیدا نشد
    echo لطفاً از داخل Android Studio بیلد کن
    pause
    exit /b 1
)

echo استفاده از: %GRADLE_PATH%
"%GRADLE_PATH%" assembleDebug

echo.
echo APK در این مسیر است:
echo app\build\outputs\apk\debug\app-debug.apk
pause
