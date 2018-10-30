# Donut Recorder

Donut recorder is a Chrome extension that records your browser interactions and generates a script.

## Usage

- Click the icon and hit Record.
- Tap <kbd>alt</kbd> after you finish typing in an `input` element. The keycode is configurable in the options.
- Click links, inputs and other elements.
- Wait for full page load on each navigation. The icon will switch from ![](src/images/icon_rec.png) to ![](src/images/icon_wait.png).
- Click Pause when you want to navigate without recording anything. Hit Resume to continue recording.
## Background

## Development

1. Run: `git clone https://github.com/brandon-bethke-neudesic/donut-recorder.git`
2. Build the project: `cd donut-recorder && npm i && npm run dev`
2. In chrome, navigate to chrome://extensions
3. Ensure that 'Developer mode' is checked
4. Click Load unpacked extension...
5. Browse to donut-recorder/build and click Select

## Credits & disclaimer

Donut recorder was based on Puppeteer recorder.

## License
MIT
