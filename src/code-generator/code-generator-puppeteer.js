import messageActions from './message-actions'
import Block from './block'
import {global} from './global-settings'

const methodHeader1 = `  const timeoutPromise = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));\n`
const methodHeader2 = `  const click = async function(path){
      let e = await page.waitFor(path, {visible: true})
      await e.click();
  }\n`

const methodHeader3 = `  const type = async function(path, message){
      let e = await page.waitFor(path, {visible: true})
      await e.type(message, {delay: 50});
  }\n`

const importPuppeteer = `const puppeteer = require('puppeteer');\n`

const header = `const browser = await puppeteer.launch()
const page = await browser.newPage()\n`

const footer = `await browser.close()`

const asyncOpener = `(async () => {\n`

const wrappedHeader = asyncOpener + methodHeader1 + methodHeader2 + methodHeader3 +`
  const browser = await puppeteer.launch()
  const page = await browser.newPage()\n`

const wrappedFooter = `  await browser.close()
})()`

export class CodeGeneratorPuppeteer {
  constructor (options) {
    this._options = Object.assign(global, options)
    this._blocks = []
    this._frame = 'page'
    this._frameId = 0
    this._allFrames = {}
    this._navigationPromiseSet = false
  }

  generate (events) {
    return importPuppeteer + this._getHeader() + this._parseEvents(events) + this._getFooter()
  }

  addCookies(){
    let script = ""
    var cookies = JSON.parse(this._options.cookies)
    for (var key in cookies) {
      var keyValue = JSON.stringify(cookies[key])
      script = script + `  await page.setCookie(${keyValue})\n`
    }
    return script;
  }

  _getHeader () {
    let hdr = wrappedHeader
    hdr = this._options.headless ? hdr : hdr.replace('launch()', 'launch({ headless: false })')
    hdr = hdr + this.addCookies();
    return hdr
  }

  _getFooter () {
    return wrappedFooter
  }

  _parseEvents (events) {
    let result = ''

    for (let i = 0; i < events.length; i++) {
      const { value, action, frameId, frameUrl, target, keyCode, altKey, ctrlKey, shiftKey, key } = events[i]
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
          this._mousePosition = target;
          break
        case 'keydown':
          if (keyCode == this._options.typingTerminator) {
            this._blocks.push(this._handleKeyDown(target.selector, value))
          }
          if (keyCode == 13) {
            this._blocks.push(this._handleEnter(target.selector))
          }
          if (keyCode == 17 && previousEvent && previousEvent.action == 'wait-for*') {
            this._blocks.push(this._handleWaitFor(this._mousePosition.id, undefined, this._mousePosition.tagName, this._mousePosition.innerText))
            //this._blocks.push(this._handleWaitFor(id, this._mousePosition.selector, undefined, undefined))
          }
          break
        case 'mousedown':

          if(nextEvent && nextEvent.action === 'navigation*' && this._options.waitForNavigation && !this._navigationPromiseSet) {
            const block = new Block(this._frameId)
            block.addLine({value: `const navigationPromise = page.waitForNavigation()`})
            this._blocks.push(block)
            this._navigationPromiseSet = true
          }
          if(previousEvent && previousEvent.action == 'click-text*'){
            this._blocks.push(this._handleClickText(target.id, target.tagName, target.innerText))
          } else if(previousEvent && previousEvent.action == 'wait-for*'){
            this._blocks.push(this._handleWaitFor(target.id, target.selector, target.tagName, target.innerText))
          } else if(previousEvent && previousEvent.keyCode == 17){
            this._blocks.push(this._handleClickText(target.id, target.tagName, target.innerText))
          } else {
            this._blocks.push(this._handleClick(target.selector))
          }
          break
        case 'change':
          if (target.tagName === 'SELECT') {
            this._blocks.push(this._handleChange(target.selector, value))
          }
          break
        case 'goto*':
          this._blocks.push(this._handleGoto(value, frameId))
          break
        case 'viewport*':
          this._blocks.push((this._handleViewport(value.width, value.height)))
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
      }
    }

    this._postProcess()

    const indent = '  '
    const newLine = `\n`

    for (let block of this._blocks) {
      const lines = block.getLines()
      for (let line of lines) {
        result += indent + line.value + newLine
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
    block.addLine({ value: `await page.waitFor(${period});`})
    return block
  }

  _handleClickText(id, tagName, innerText) {
    const block = new Block(this._frameId)
    if(id){
      block.addLine({ value: `await click('#${id}')`})
    } else {
      block.addLine({ value: `await click('//${tagName}[normalize-space() = "${innerText}"]')`})
    }
    return block
  }

  _handleWaitFor(id, selector, tagName, innerText) {
    const block = new Block(this._frameId)
    if(id){
      block.addLine({ value: `await ${this._frame}.waitFor('#${id}', {visible: true})`})
    } else if(selector) {
      block.addLine({ value: `await ${this._frame}.waitFor('${selector}', {visible: true})` })
    } else {
      block.addLine({ value: `await ${this._frame}.waitFor('//${tagName}[normalize-space() = "${innerText}"]', {visible: true})`})
    }
    return block
  }

  _handleEnter() {
    const block = new Block(this._frameId)
    block.addLine({value: `await page.keyboard.press('Enter');`})
    return block
  }

  _handleKeyDown (selector, value) {
    const block = new Block(this._frameId)
    block.addLine({ value: `await type('${selector}', '${value}')` })
    return block
  }

  _handleClick (selector) {
    const block = new Block(this._frameId)
    block.addLine({ value: `await click("${selector}")`})
    return block
  }

  _handleChange (selector, value) {
    return new Block(this._frameId, { value: `await ${this._frame}.select('${selector}', '${value}')` })
  }

  _handleGoto (href) {
    return new Block(this._frameId, { value: `await ${this._frame}.goto('${href}')` })
  }

  _handleViewport (width, height) {
    return new Block(this._frameId, { value: `await ${this._frame}.setViewport({ width: ${width}, height: ${height} })` })
  }

  _handleWaitForNavigation () {
    const block = new Block(this._frameId)
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
