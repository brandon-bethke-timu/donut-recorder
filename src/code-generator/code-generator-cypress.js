import messageActions from './message-actions'
import Block from './block'
import {global} from './global-settings'
//import {details as eventToString} from 'key-event-to-string'

export const options = [
    { type: "checkbox", name: "ignoreUncaughtExceptions", title: "Ignore uncaught exceptions", value: false, id: "ignoreUncaughtExceptions"},
    { type: "textbox", name: "typingDelay", title: "The delay between keystrokes", value: 100, id: "typingDelay"}
]

const newLine = '\n';

const descHeader = `describe("", function(){\n`
const descFooter = `})\n`
const itemHeader = `  it("", function(){\n`
const itemFooter = `  })\n`

export class CodeGeneratorCypress {
  constructor (options) {
    this._options = Object.assign(global, options)
    this._blocks = []
    this._frame = 'page'
    this._frameId = 0
    this._allFrames = {}
    this._navigationPromiseSet = false
    this.variables = []
  }

  generate (events) {

    return this.addGlobalVariables() + newLine
           + this.addGlobalMethods() + newLine
           + descHeader
           + itemHeader
           + this.addSetup()
           + this.parseEvents(events)
           + itemFooter
           + descFooter
           + newLine
           + (this._options.ignoreUncaughtExceptions ? this.addUncaughtException() : '')
  }

  addUncaughtException(){
    let result = ''
    let block = new Block(this._frameId)

    block.addLine({value: `Cypress.on('uncaught:exception', (err, runnable) => {`})
    block.addLine({value: `  return false`})
    block.addLine({value: `})`})

    this.addBlock(block);
    for (let block of this._blocks) {
      const lines = block.getLines()
      for (let line of lines) {
        result += line.value + newLine
      }
    }
    this._blocks = [];
    return result + newLine
  }

  addImports(){
    let result = ''
    let block = new Block(this._frameId);

    //Example
    //block.addLine({value: `import xxx from 'xxx';`})

    this.addBlock(block);
    for (let block of this._blocks) {
      const lines = block.getLines()
      for (let line of lines) {
        result += line.value + newLine
      }
    }
    this._blocks = [];
    return result + newLine
  }

  addGlobalVariables(){
    let result = ''
    let block = new Block(this._frameId);

    //Example
    //block.addLine({value: `let xxx = {};`})

    this.addBlock(block);
    for (let block of this._blocks) {
      const lines = block.getLines()
      for (let line of lines) {
        result += line.value + newLine
      }
    }
    this._blocks = [];
    return result + newLine
  }

  addGlobalMethods(){

    let result = ''
    let block = new Block(this._frameId);

    //Example
    block.addLine({value: `let getString = function(){`})
    block.addLine({value: `  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10)`})
    block.addLine({value: `}`})

    this.addBlock(block);
    for (let block of this._blocks) {
      const lines = block.getLines()
      for (let line of lines) {
        result += line.value + newLine
      }
    }
    this._blocks = [];
    return result + newLine

  }

  addSetup(){
    let result = ''
    let block = new Block(this._frameId, 2);
    let cookies = JSON.parse(this._options.cookies)
    for (var key in cookies) {
      let keyValue = JSON.stringify(cookies[key])
      let cookieOptions = JSON.parse(keyValue)
      let name = cookies[key].name;
      let value = cookies[key].value;
      delete cookieOptions.name;
      delete cookieOptions.value;
      cookieOptions = JSON.stringify(cookieOptions);
      block.addLine({value: `cy.setCookie("${name}", "${value}", ${cookieOptions})`})
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

  parseEvents (events) {
    let result = ''
    for (let i = 0; i < events.length; i++) {
      const { name, key, value, action, frameId, frameUrl, target, keyCode, altKey, ctrlKey, shiftKey } = events[i]
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
          } else if (keyCode == 13) {
            this._blocks.push(this._handleKeyPress(target.selector, '{enter}'))
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
          this._blocks.push(this._handleKeyDown(target.selector, value))
          break;

        case 'mousedown':
          if(nextEvent && nextEvent.action === 'navigation*' && this._options.waitForNavigation && !this._navigationPromiseSet) {
            const block = new Block(this._frameId, 1)
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
          this._blocks.push(this._handleAddWait(value))
          break

        case 'set-local-storage*':
          this._blocks.push(this._handleSetLocalStorage())
          break

        case 'goto*':
          this._blocks.push(this._handleGoto(value, frameId))
          break

        case 'viewport*':
          //this._blocks.push((this._handleViewport(value.width, value.height)))
          break

        case 'variable*':
          this._blocks.push(this.handleVariable(name, value))
          break;
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

  format(expression){
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
    return `'${temp}'`
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

  handleVariable(name, value){
    value = this.format(value)
    const block = new Block(this._frameId, 2)
    block.addLine({value: `let ${name} = ${value}`})
    return block;
  }

  _handleSetLocalStorage() {
    const block = new Block(this._frameId, 2)
    let script = ""
    var storage = JSON.parse(this._options.localStorage)
    if(Object.keys(storage).length > 0){
      for (var key in storage) {
        var keyValue = storage[key]
        block.addLine({ value: `localStorage.setItem("${key}", "${keyValue}")`})
      }
    }
    return block
  }

  _handleAddWait(period) {
    const block = new Block(this._frameId, 2)
    block.addLine({ value: `cy.wait(${period});`})
    return block
  }

  _handleClickText(id, tagName, innerText) {
    innerText = this.format(innerText)
    const block = new Block(this._frameId, 2)
    if(id){
      block.addLine({ value: `cy.get('#${id}').click()`})
    } else {
      block.addLine({ value: `cy.get("${tagName}:contains(${innerText})").click()`})
    }
    return block
  }

  _handleWaitFor(id, selector, tagName, innerText) {
    innerText = this.format(innerText)
    const block = new Block(this._frameId, 2)
    if(id){
      block.addLine({ value: `cy.get('#${id}').should('be.visible')`})
    } else if(selector) {
      block.addLine({ value: `cy.get('${selector}').should('be.visible')` })
    } else {
      block.addLine({ value: `cy.get("${tagName}:contains(${innerText})").should('be.visible')`})
    }
    return block
  }

  _handleKeyDown (selector, value) {
    value = this.format(value);
    const block = new Block(this._frameId, 2)
    block.addLine({ value: `cy.get('${selector}').type(${value}, {delay: ${this._options.typingDelay}})` })
    return block
  }

  _handleKeyPress(selector, value) {
    const block = new Block(this._frameId, 2)
    block.addLine({value: `cy.get('${selector}').type('${value}', {delay: ${this._options.typingDelay}})`})
    return block
  }

  _handleClick (selector) {
    const block = new Block(this._frameId, 2)
    block.addLine({ value: `cy.get("${selector}").click()`})
    return block
  }

  _handleChange (selector, value) {
    const block = new Block(this._frameId, 2, { value: `cy.get('${selector}').select('${value}')` })
    return block
  }

  _handleGoto (href) {
    href = this.format(href)
    const block = new Block(this._frameId, 2, { value: `cy.visit(${href})` })
    return block
  }

  _handleViewport (width, height) {
    const block = new Block(this._frameId, 2, { value: `cy.viewport(${width}, ${height})` })
    return block
  }

  _handleWaitForNavigation () {
    const block = new Block(this._frameId, 2)
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
