# QuickTasks

A fast, minimalist task management panel for Windows. Designed with a dark Obsidian and Gold theme, it runs in the background and opens instantly using a keyboard shortcut.

## Features

- Instant Access: Show or hide the panel anytime with Ctrl + Shift + Space.
- Clean Design: Dark mode theme with gold highlights.
- Always Ready: Starts automatically when you log into Windows.
- Smart Deadlines: Get notifications for upcoming or overdue tasks.
- Portable: No installation needed. Runs as a single .exe file.

## Installation

1. Download the latest QuickTasks.exe from the Releases section (or the dist folder if you build it yourself).
2. Move the file to a permanent folder on your PC (for example, Documents/Apps).
3. Double-click the file to run it.

The app will now run in the background and automatically start with Windows.

## Controls

- Ctrl + Shift + Space: Show or hide the panel.
- Esc or click outside: Hide the panel.
- Right-click the Tray Icon: Open the "Show Quick Tasks" menu.

## Development

If you want to build the project from the source code:

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Build the portable .exe file
npm run build
```
