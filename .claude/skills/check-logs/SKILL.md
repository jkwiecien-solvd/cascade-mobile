---
name: check-logs
description: Reviews logs from adb logcat, simctl syslog, Metro bundler, or reads the error directly from the emulator/simulator screen (using screenshot or UI layout tree) to identify and diagnose crashes or errors.
---
# Check Logs Skill

This skill provides step-by-step instructions for troubleshooting React Native and Expo app crashes, errors, or anomalies on connected emulators or simulators.

## Step 1: Detect Active Platforms
First, find where the app is running:
- **Android**: Run `adb devices` to check for connected devices/emulators.
- **iOS**: Run `xcrun simctl list devices | grep Booted` to find booted iOS simulators.
- **Metro Bundler**: Check if the bundler process is running or if a dev server is active (usually on port 8081).

## Step 2: Retrieve Android Logs (Logcat)
If an Android device or emulator is active:
1. **JavaScript errors and logs**:
   ```bash
   adb logcat -d ReactNativeJS:E *:S
   ```
2. **All JavaScript console logs**:
   ```bash
   adb logcat -d ReactNativeJS:V *:S
   ```
3. **Native Android crashes (Java/Kotlin)**:
   ```bash
   adb logcat -d AndroidRuntime:E *:S
   ```
4. **General Error dump (last 300 lines)**:
   ```bash
   adb logcat -d -t 300 *:E
   ```
5. **Search for exceptions, crash or fatal errors**:
   ```bash
   adb logcat -d | grep -i -E "exception|crash|fatal|error|fail" | tail -n 100
   ```

## Step 3: Retrieve iOS Logs (simctl)
If an iOS simulator is active:
1. **Query Simulator System Log**:
   ```bash
   xcrun simctl syslog booted | grep -i -E "react|expo|error|crash" | tail -n 100
   ```
2. **Show recent log stream**:
   ```bash
   xcrun simctl spawn booted log show --predicate 'sender == "React" or process == "CascadeMobile"' --last 5m
   ```

## Step 4: Extract Screen Error Directly from Emulator/Simulator
Sometimes logs are rotated or missing, but the error is displayed directly on the screen (e.g., React Native RedBox or LogBox).

### Android (Text Extraction via UI Layout Dump)
You can dump the UI hierarchy of the screen to search for text on the emulator screen:
1. Dump the layout on the device:
   ```bash
   adb shell uiautomator dump /sdcard/window_dump.xml
   ```
2. Pull the file to a temporary location in your scratch directory:
   ```bash
   adb pull /sdcard/window_dump.xml ./scratch/window_dump.xml
   ```
3. Read or grep the XML file to find the displayed error text (search for keywords like `error`, `exception`, `TypeError`, `fail`, or custom screen text):
   ```bash
   grep -o 'text="[^"]*"' ./scratch/window_dump.xml | head -n 50
   ```
4. Delete the temporary files:
   ```bash
   rm ./scratch/window_dump.xml && adb shell rm /sdcard/window_dump.xml
   ```

### Capturing visual screenshots
If visual inspection is needed:
- **Android**:
  ```bash
  adb shell screencap -p /sdcard/screen.png
  adb pull /sdcard/screen.png ./scratch/emulator_screenshot.png
  adb shell rm /sdcard/screen.png
  ```
- **iOS**:
  ```bash
  xcrun simctl screenshot booted ./scratch/simulator_screenshot.png
  ```
You can view the captured image using the `view_file` tool.

## Step 5: Analyze and Resolve
Once logs or screen text are gathered:
1. Extract the error message and the **stack trace**.
2. Locate the file name, function, and line number where the issue originated.
3. Open the target file using `view_file` and inspect the code around the line number.
4. Explain the cause of the error clearly to the user.
5. Propose a specific fix or replacement for the issue.
6. **IMPORTANT**: Do NOT apply the fix, write to files, or execute commands to change code until the user has explicitly confirmed and approved the proposed solution. Wait for user consent before proceeding.
