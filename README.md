# Donut Recorder

Donut recorder is a Chrome extension that records your browser interactions and generates a script. Currently the extension must be built and loaded locally, it is not downloadable from the store.

## Basic Usage

1. Click the icon and then click 'Record'.
2. Perform ui actions.
3. Click 'Pause' to temporarily stop recording actions. Click 'Resume' to continue recording.
4. Click 'Stop' to stop recording and code will be generated.

## Advanced Usage
- Tapping <kbd>alt</kbd> after typing in an `input` element will cause all the immediately preceeding and grouped keydown events to be emmitted as a single command. The keycode is configurable in the options.

- Tap <kbd>control</kbd>, then click on an element. This will emit code that attempts to match an element by the innerText rather than css path and then click on it.

- Click the 'Wait For' button, then mouse over an element and press the <kbd>control</kbd> key. This will emit code to wait for an element to appear in the DOM that matches the innerText.

- Wait for full page load on each navigation. The icon will switch from ![](src/images/icon_rec.png) to ![](src/images/icon_wait.png).

#### Events
By default the recorder will only act on the following events:

- mousedown
- mousemove
- keydown
- select
- submit
- load
- unload

The events recorded are configured in the /context-scripts/dom-events-to-record.js file. When adding new events, the code generators must be modified accordingly to emit code when those events occur. Currently, there will probably be unwanted side effects to certain operations if adding mouseup, keyup, keypress.

#### Code Generators
The following code generators are included:

- Cypress

  Outputs the recorded events for use with [Cypress](https://docs.cypress.io). This is the default code generator.

- Puppeteer

  Outputs the recorded events for use with [Puppeteer](https://pptr.dev/)
  Can be configured to output in [Mocha](https://mochajs.org/) format

- YAML

  Outputs the recorded events in yaml for use by a custom tool or otherwise.

## Development

1. Run: `git clone https://github.com/brandon-bethke-neudesic/donut-recorder.git`
2. Build the project: `cd donut-recorder && npm i && npm run dev`
2. In chrome, navigate to chrome://extensions
3. Ensure that 'Developer mode' is checked
4. Click Load unpacked extension...
5. Browse to donut-recorder/build and click Select

## Adding a new code generator

See src/code-generators/code-generator-puppeteer.js for an example

#### Basics

1. Create a file and a new class in the src/code-generator folder. Make sure the class is exported (not default) and has a `generate()` method
2. In file src/code-generator/code-generator.js:
   - Import your new generator
   - Add an entry to `generators.types[]`
   - Add an entry to `classes`
   - Custom options should be exprted from your module and added to the `options` array field in `generators.types`

## Known Issues

1. The puppeteer code generator does not support variables at the moment.

2. See 'Unknown Issues'

## Unknown Issues

One doesn't know what one doesn't know.

## Credits & disclaimer

The Donut Recorder was based on [Puppeteer Recorder](https://github.com/checkly/puppeteer-recorder).

## License
MIT
