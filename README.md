# pipet

A Chrome extension that simply extracts colors.

Hold the left mouse button for **0.2 seconds** on any webpage to sample the colour at the cursor position.  
The hex code (e.g. `FFC700`) is copied to the clipboard automatically, and a brief eyedropper animation confirms the capture.

## Installation

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select this repository folder.

## Usage

- **Long-press** the left mouse button anywhere on a page for ≥ 0.2 s.
- The colour at that exact pixel is sampled, the hex code is copied to your clipboard, and an animation is shown.
- Release or move the mouse before 0.2 s to cancel without extracting.

## Permissions

| Permission | Reason |
| --- | --- |
| `tabs` | Required to capture a screenshot of the active tab for pixel sampling |
| `clipboardWrite` | Allows writing the hex code to the clipboard from an async context |
| `<all_urls>` | Content script must run on every page; also needed for `captureVisibleTab` |
