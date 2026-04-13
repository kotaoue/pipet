# pipet

A Chrome extension that simply extracts colors.

Press and hold the primary mouse button for **0.2 seconds** on any webpage, or hold the C key for **0.2 seconds** to sample the color at the current pointer position.  
The hex code (e.g. `FFC700`) is copied to the clipboard automatically, and a brief eyedropper animation confirms the capture.

## Installation

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select this repository folder.

## Usage

- **Press and hold** the primary mouse button anywhere on a page for ≥ 0.2 s.
- Or move the pointer to the target pixel and **hold C** for ≥ 0.2 s.
- While holding C, the cursor switches to an eyedropper-style indicator until capture finishes or is canceled.
- The color at that exact pixel is sampled, the hex code is copied to your clipboard, and an animation is shown.
- Release or move the pointer before 0.2 s to cancel without extracting.
- On macOS trackpads, tap-and-hold is not exposed as a sustained press to web pages, so use click-and-hold or the C-key gesture instead.

## Permissions

| Permission | Reason |
| --- | --- |
| `tabs` | Required to capture a screenshot of the active tab for pixel sampling |
| `clipboardWrite` | Allows writing the hex code to the clipboard from an async context |
| `<all_urls>` | Content script must run on every page; also needed for `captureVisibleTab` |
