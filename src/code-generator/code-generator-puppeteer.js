import messageActions from './message-actions'
import Block from './block'
import {global} from './global-settings'

export const options = [
    { type: "checkbox", name: "mocha", title: "in mocha test format", value: false, id: "mocha"},
    { type: "checkbox", name: "headless", title: "headless", value: false, id: "headless"},
    { type: "textbox", name: "typingDelay", title: "The delay between keystrokes", value: 100, id: "typingDelay"}
]

const newLine = '\n';

export class CodeGeneratorPuppeteer {
  constructor (options) {
    this._options = Object.assign(global, options)
    this._blocks = []
    this._frame = 'page'
    this._frameId = 0
    this._allFrames = {}
    this._navigationPromiseSet = false
    this.language = "js"
  }

  generate (events) {
    let block = new Block(this._frameId, 0)

    this.addImports(block)
    block.addLine({value: ''})
    this.addGlobalVariables(block)
    block.addLine({value: ''})
    this.addGlobalMethods(block)
    block.addLine({value: ''})
    if(this._options.mocha){
      block.addLine({value: `describe("", async function(){`})
      block.addLine({value: `  it("", async function(){`})
      block.setIndent(2)
    }
    this.addSetup(block)
    this.addEvents(block, events)
    if(!this._options.mocha){
        block.addLine({value: `browser.close()`})
    }
    if(this._options.mocha){
        block.setIndent(0)
        block.addLine({value: `  })`})
        block.addLine({value: `  after(async function(){`})
        block.addLine({value: `    browser.close()`})
        block.addLine({value: `  })`})
        block.addLine({value: `})`})
    }

    const lines = block.getLines()
    let script = ''
    for (let line of lines) {
      script = script + line.value + newLine
    }

    return script;
  }

  addImports(block){
    block.addLine({value: `import puppeteer from 'puppeteer';`})
  }

  addGlobalVariables(block){
    block.addLine({value: `let browser = undefined;`})
    block.addLine({value: `let page = undefined;`})
  }

  addGlobalMethods(block){
    block.addLine({value: `const click = async function(path){`})
    block.addLine({value: `  let e = await page.waitFor(path, {visible: true})`})
    block.addLine({value: `  await e.click()`})
    block.addLine({value: `}`})
    block.addLine({value: ''})

    block.addLine({value: `const type = async function(path, message, press){`})
    block.addLine({value: `  let e = await page.waitFor(path, {visible: true})`})
    block.addLine({value: `  if(press){`})
    block.addLine({value: `    await e.press(message)`})
    block.addLine({value: `  } else {`})
    block.addLine({value: `    await e.type(message, {delay: ${this._options.typingDelay}})`})
    block.addLine({value: `  }`})
    block.addLine({value: `}`})
    block.addLine({value: ''})

    block.addLine({value: `let getString = function(){`})
    block.addLine({value: `  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10)`})
    block.addLine({value: `}`})
  }

  addSetup(block){
    block.addLine({value: `browser = await puppeteer.launch( {headless: ${this._options.headless}} );`})
    block.addLine({value: `page = await browser.newPage();`})

    var cookies = JSON.parse(this._options.cookies)
    for (var key in cookies) {
      var keyValue = JSON.stringify(cookies[key])
      block.addLine({value: `await page.setCookie(${keyValue})`})
    }
  }

  addBlock(block){
    this._blocks.push(block)
  }

  addEvents (block, events) {
    for (let i = 0; i < events.length; i++) {
      const { name, value, action, frameId, frameUrl, target, keyCode, altKey, ctrlKey, shiftKey, key } = events[i]
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
            this._handleKeyPress(block, target.selector, key)
          }
          break

        case 'wait-for-selector*':
          this._handleWaitFor(block, undefined, target.selector, undefined, undefined)
          break;

        case 'wait-for-text*':
          this._handleWaitFor(block, undefined, undefined, target.tagName, target.innerText)
          break;

        case 'click-text*':
          this._handleClickText(block, undefined, target.tagName, target.innerText)
          break;

        case 'type-text*':
          this._handleKeyDown(block, target.selector, value, keyCode)
          break;

        case 'mousedown':
          if(nextEvent && nextEvent.action === 'navigation*' && this._options.waitForNavigation && !this._navigationPromiseSet) {
            block.addLine({value: `const navigationPromise = page.waitForNavigation()`})
            this._navigationPromiseSet = true
          }
          this._handleClick(block, target.selector)
          break

        case 'change':
          if (target.tagName === 'SELECT') {
            this._handleChange(block, target.selector, value)
          }
          break

        case 'goto*':
          this._handleGoto(block, value, frameId)
          break

        case 'viewport*':
          this._handleViewport(block, value.width, value.height)
          break

        case 'navigation*':
          this._handleWaitForNavigation(block)
          break

        case 'wait*':
          this._handleAddWait(block, value)
          break

        case 'set-local-storage*':
          this._handleSetLocalStorage(block)
          break

        case 'variable*':
          this.handleVariable(block, name, value)
          break
      }
    }
  }

  format(expression){
    if(!expression) return expression;

    if(expression.match(/^['].*[']$/)){
      return expression
    }

    if(expression.match(/^["].*["]$/)){
      return expression
    }
    let isExpression = false
    isExpression = isExpression || expression.match(/\{\{([A-Za-z0-9]*)\}\}/)
    isExpression = isExpression || expression.match(/getString\(\)/)
    let temp = expression.replace(/\{\{([A-Za-z0-9]*)\}\}/, "$1")
    if(isExpression){
      return temp
    }
    return `"${temp}"`
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

  handleVariable(block, name, value){
    value = this.format(value)
    block.addLine({value: `let ${name} = ${value}`})
  }

  _handleSetLocalStorage(block) {
    var storage = JSON.parse(this._options.localStorage)
    if(Object.keys(storage).length > 0){
      block.addLine({ value: `await page.evaluate(() => {`})
      for (var key in storage) {
        var keyValue = storage[key]
        block.addLine({ value: `  localStorage.setItem("${key}", "${keyValue}")`})
      }
      block.addLine({ value: `})`})
    }
  }

  _handleAddWait(block, period) {
    block.addLine({ value: `await page.waitFor(${period});`})
  }

  _handleClickText(block, id, tagName, innerText) {
    innerText = this.format(innerText)
    if(id){
      block.addLine({ value: `await click('#${id}')`})
    } else {
      block.addLine({ value: `await click('//${tagName}[normalize-space() = ${innerText}]')`})
    }
  }

  _handleWaitFor(block, id, selector, tagName, innerText) {
    innerText = this.format(innerText)
    if(id){
      block.addLine({ value: `await ${this._frame}.waitFor('#${id}', {visible: true})`})
    } else if(selector) {
      block.addLine({ value: `await ${this._frame}.waitFor('${selector}', {visible: true})` })
    } else {
      block.addLine({ value: `await ${this._frame}.waitFor('//${tagName}[normalize-space() = ${innerText}]', {visible: true})`})
    }
  }

  _handleEnter(block, selector) {
    block.addLine({value: `await page.keyboard.press('Enter')`})
  }

  _handleKeyDown (block, selector, value) {
    value = this.format(value);
    block.addLine({ value: `await type('${selector}', ${value})` })
  }

  _handleKeyPress(block, selector, value) {
    block.addLine({value: `await type('${selector}', '${value}', true)`})
  }

  _handleClick (block, selector) {
    block.addLine({ value: `await click('${selector}')`})
  }
  _handleChange (block, selector, value) {
    block.addLine({ value: `await ${this._frame}.select('${selector}', '${value}')` })
  }
  _handleGoto (block, href) {
    href = this.format(href)
    block.addLine({ value: `await ${this._frame}.goto(${href})` })
  }

  _handleViewport (block, width, height) {
    block.addLine({ value: `await ${this._frame}.setViewport({ width: ${width}, height: ${height} })` })
  }

}
