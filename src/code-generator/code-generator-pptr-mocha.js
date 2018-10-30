import messageActions from './message-actions'
import Block from './block'
import {global} from './global-settings'

export const options = [
    { type: "checkbox", name: "headless", title: "headless", value: false, id: "headless"},
    { type: "checkbox", name: "waitForNavigation", title: "add 'waitForNavigation' lines on navigation", value: true, id: "waitForNavigation"}
]

const newLine = '\n';

const clickMethod = `const click = async function(path){
    let e = await page.waitFor(path, {visible: true})
    await e.click();
}\n`

const typeMethod = `const type = async function(path, message){
    let e = await page.waitFor(path, {visible: true})
    await e.type(message, {delay: 50});
}\n`

const descHeader = `describe("", async function(){\n`
const descFooter = `})\n`
const itemHeader = `  it("", async function(){\n`
const itemFooter = `  })\n`

export class CodeGeneratorPptrMocha {
  constructor (options) {
    this._options = Object.assign(global, options)
    this._blocks = []
    this._frame = 'page'
    this._frameId = 0
    this._allFrames = {}
    this._navigationPromiseSet = false
  }

  generate (events) {
    return this.addImports() + newLine
           + this.addGlobalVariables() + newLine
           + this.addGlobalMethods() + newLine
           + descHeader + newLine
           + itemHeader
           + this.addSetup()
           + this._parseEvents(events)
           + `    browser.close()\n`
           + itemFooter
           + descFooter
  }

  addImports(){
    let result = ''
    let block = new Block(this._frameId);
    block.addLine({value: `import puppeteer from 'puppeteer';`})

    this.addBlock(block);
    for (let block of this._blocks) {
      const lines = block.getLines()
      for (let line of lines) {
        result += line.value + newLine
      }
    }
    this._blocks = [];
    return result
  }

  addGlobalVariables(){
    let result = ''
    let block = new Block(this._frameId);
    block.addLine({value: `let browser = undefined;`})
    block.addLine({value: `let page = undefined;`})

    this.addBlock(block);
    for (let block of this._blocks) {
      const lines = block.getLines()
      for (let line of lines) {
        result += line.value + newLine
      }
    }
    this._blocks = [];
    return result
  }

  addGlobalMethods(){

    let result = ''
    let block = new Block(this._frameId);

    block.addLine({value: `const click = async function(path){`})
    block.addLine({value: `  let e = await page.waitFor(path, {visible: true})`})
    block.addLine({value: `  await e.click()`})
    block.addLine({value: `}`})

    block.addLine({value: `const type = async function(path, message, press){`})
    block.addLine({value: `  let e = await page.waitFor(path, {visible: true})`})
    block.addLine({value: `  if(press){`})
    block.addLine({value: `    await e.press(message)`})
    block.addLine({value: `  } else {`})
    block.addLine({value: `    await e.type(message, {delay: 50})`})
    block.addLine({value: `  }`})
    block.addLine({value: `}`})

    this.addBlock(block);
    for (let block of this._blocks) {
      const lines = block.getLines()
      for (let line of lines) {
        result += line.value + newLine
      }
    }
    this._blocks = [];
    return result

  }

  addSetup(){
    let result = ''
    let block = new Block(this._frameId);
    block.indent(2)
    block.addLine({value: `browser = await puppeteer.launch( {headless: false} );`})
    block.addLine({value: `page = await browser.newPage();`})

    var cookies = JSON.parse(this._options.cookies)
    for (var key in cookies) {
      var keyValue = JSON.stringify(cookies[key])
      block.addLine({value: `await page.setCookie(${keyValue})`})
    }

    this.addBlock(block);
    for (let block of this._blocks) {
      const lines = block.getLines()
      for (let line of lines) {
        result += line.value + newLine
      }
    }
    this._blocks = [];
    return result
  }

  addBlock(block){
    this._blocks.push(block)
  }

  _parseEvents (events) {
    let result = ''
    for (let i = 0; i < events.length; i++) {
      const { key, value, action, frameId, frameUrl, target, keyCode, altKey, ctrlKey, shiftKey } = events[i]
      // we need to keep a handle on what frames events originate from
      this._setFrames(frameId, frameUrl)

      const getPreviousEvent = function(index){
        for(let i = index - 1; i >=0 ; i--) {
          let previousEvent = events[i]
          if(previousEvent.action === "mousemove"){
            continue;
          }
          return previousEvent;
        }
        return undefined;
      }

      const getNextEvent = function(index){
        for(let i = index + 1; i < events.length; i++) {
          let nextEvent = events[i]
          if(nextEvent.action === "mousemove"){
            continue;
          }
          return nextEvent;
        }
        return undefined;
      }
      const previousEvent = getPreviousEvent(i);
      const nextEvent = getNextEvent(i);

      switch (action) {
        case 'mousemove':
          break

        case 'keydown':
          if (keyCode == 16 || keyCode == 17 || keyCode == 18) {
          } else {
            this._blocks.push(this._handleKeyPress(target.selector, key))
          }
          break

        case 'wait-for-text*':
          this._blocks.push(this._handleWaitFor(undefined, undefined, target.tagName, target.innerText))
          break;

        case 'click-text*':
          this._blocks.push(this._handleClickText(undefined, target.tagName, target.innerText))
          break;

        case 'type-text*':
          this._blocks.push(this._handleKeyDown(target.selector, value, keyCode))
          break;

        case 'mousedown':
          if(nextEvent && nextEvent.action === 'navigation*' && this._options.waitForNavigation && !this._navigationPromiseSet) {
            const block = new Block(this._frameId)
            block.indent(1);
            block.addLine({value: `const navigationPromise = page.waitForNavigation()`})
            this._blocks.push(block)
            this._navigationPromiseSet = true
          }
          this._blocks.push(this._handleClick(target.selector))
          break

        case 'change':
          if (target.tagName === 'SELECT') {
            this._blocks.push(this._handleChange(target.selector, value))
          }
          break

        case 'navigation*':
          this._blocks.push(this._handleWaitForNavigation())
          break

        case 'wait*':
          this._blocks.push(this._handleAddWait(this._options.wait))
          break

        case 'set-local-storage*':
          this._blocks.push(this._handleSetLocalStorage())
          break

        case 'goto*':
          this._blocks.push(this._handleGoto(value, frameId))
          break

        case 'viewport*':
          this._blocks.push((this._handleViewport(value.width, value.height)))
          break
      }
    }

    this._postProcess()

    for (let block of this._blocks) {
      const lines = block.getLines()
      for (let line of lines) {
        result += line.value + newLine
      }
    }

    return result
  }

  _setFrames (frameId, frameUrl) {
    if (frameId && frameId !== 0) {
      this._frameId = frameId
      this._frame = `frame_${frameId}`
      this._allFrames[frameId] = frameUrl
    } else {
      this._frameId = 0
      this._frame = 'page'
    }
  }

  _postProcess () {
    // we want to create only one navigationPromise
    if (this._options.waitForNavigation && !this._navigationPromiseSet) {
      this._postProcessWaitForNavigation()
    }

    // when events are recorded from different frames, we want to add a frame setter near the code that uses that frame
    if (Object.keys(this._allFrames).length > 0) {
      this._postProcessSetFrames()
    }

  }

  _handleSetLocalStorage() {
    const block = new Block(this._frameId)
    block.indent(1);
    let script = ""
    var storage = JSON.parse(this._options.localStorage)
    if(Object.keys(storage).length > 0){
      block.addLine({ value: `await page.evaluate(() => {`})
      for (var key in storage) {
        var keyValue = storage[key]
        block.addLine({ value: `  localStorage.setItem("${key}", "${keyValue}")`})
      }
      block.addLine({ value: `})`})
    }
    return block
  }

  _handleAddWait(period) {
    const block = new Block(this._frameId)
    block.indent(1);
    block.addLine({ value: `await page.waitFor(${period});`})
    return block
  }

  _handleClickText(id, tagName, innerText) {
    const block = new Block(this._frameId)
    block.indent(1);
    if(id){
      block.addLine({ value: `await click('#${id}')`})
    } else {
      block.addLine({ value: `await click('//${tagName}[normalize-space() = "${innerText}"]')`})
    }
    return block
  }

  _handleWaitFor(id, selector, tagName, innerText) {
    const block = new Block(this._frameId)
    block.indent(1);
    if(id){
      block.addLine({ value: `await ${this._frame}.waitFor('#${id}', {visible: true})`})
    } else if(selector) {
      block.addLine({ value: `await ${this._frame}.waitFor('${selector}', {visible: true})` })
    } else {
      block.addLine({ value: `await ${this._frame}.waitFor('//${tagName}[normalize-space() = "${innerText}"]', {visible: true})`})
    }
    return block
  }

  _handleEnter(selector) {
    const block = new Block(this._frameId)
    block.indent(1);
    block.addLine({value: `await page.keyboard.press('Enter')`})
    return block
  }

  _handleKeyDown (selector, value) {
    const block = new Block(this._frameId)
    block.indent(1);
    block.addLine({ value: `await type('${selector}', '${value}')` })
    return block
  }

  _handleKeyPress(selector, value) {
    const block = new Block(this._frameId)
    block.indent(1);
    block.addLine({value: `await type('${selector}', '${value}', true)`})
    return block
  }

  _handleClick (selector) {
    const block = new Block(this._frameId)
    block.indent(1);
    block.addLine({ value: `await click("${selector}")`})
    return block
  }
  _handleChange (selector, value) {
    const block = new Block(this._frameId, { value: `await ${this._frame}.select('${selector}', '${value}')` })
    block.indent(1);
    return block
  }
  _handleGoto (href) {
    const block = new Block(this._frameId, { value: `await ${this._frame}.goto('${href}')` })
    block.indent(1);
    return block
  }

  _handleViewport (width, height) {
    const block = new Block(this._frameId, { value: `await ${this._frame}.setViewport({ width: ${width}, height: ${height} })` })
    block.indent(1);
    return block
  }

  _handleWaitForNavigation () {
    const block = new Block(this._frameId)
    block.indent(1);
    if (this._options.waitForNavigation) {
      block.addLine({value: `await navigationPromise`})
    }
    return block
  }

  _postProcessWaitForNavigation () {
    for (let [i, block] of this._blocks.entries()) {
      const lines = block.getLines()
      for (let line of lines) {
        if (line.type === messageActions.NAVIGATION) {
          this._blocks[i].addLineToTop({value: `const navigationPromise = page.waitForNavigation()`})
          return
        }
      }
    }
  }

  _postProcessSetFrames () {
    for (let [i, block] of this._blocks.entries()) {
      const lines = block.getLines()
      for (let line of lines) {
        if (line.frameId && Object.keys(this._allFrames).includes(line.frameId.toString())) {
          const declaration = `const frame_${line.frameId} = frames.find(f => f.url() === '${this._allFrames[line.frameId]}')`
          this._blocks[i].addLineToTop(({ value: declaration }))
          this._blocks[i].addLineToTop({ value: 'let frames = await page.frames()' })
          delete this._allFrames[line.frameId]
          break
        }
      }
    }
  }

}
