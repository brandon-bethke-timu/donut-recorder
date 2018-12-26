import messageActions from '../code-generator/message-actions'
import uuid from "./uuid"

class RecordingController {
  constructor () {
    this._recording = []
    this._boundedMessageHandler = null
    this._boundedNavigationHandler = null
    this._boundedWaitHandler = null
    this._badgeState = ''
    this._isPaused = false
  }

  boot () {
    chrome.extension.onConnect.addListener(port => {
      port.onMessage.addListener(msg => {
        if (msg.action === 'start') this.start()
        if (msg.action === 'stop') this.stop()
        if (msg.action === 'cleanUp') this.cleanUp()
        if (msg.action === 'pause') this.pause()
        if (msg.action === 'unpause') this.unPause()
        if (msg.action === 'wait*') this.wait(msg)
        if (msg.action === 'wait-for*') this.waitFor(msg)
        if (msg.action === 'click-on*') this.clickText(msg)
        if (msg.action === 'insert-event') this.insertEvent(msg)
        if (msg.action === 'remove-event') this.removeEvent(msg)
        if (msg.action === 'update-event') this.updateEvent(msg)
        if (msg.action === 'new-event') this.newEvent(msg)
        if (msg.action === 'get-recording') chrome.runtime.sendMessage({control: 'update-recording', recording: this._recording})
        if (msg.action === 'variable*') this.variable(msg)
      })
    })
  }

  variable(msg) {
    this.handleMessage(msg)
  }

  insertEvent(msg) {
    var itemIndex = this._recording.findIndex( el => {
      return el.id === msg.event.id && el.id
    });

    if(itemIndex === -1){
      return
    }
    this._recording.splice(itemIndex, 1)
    this._recording.splice(msg.index, 0, msg.event)
    chrome.runtime.sendMessage({control: 'update-recording', recording: this._recording})
  }

  removeEvent(msg) {
    var itemIndex = this._recording.findIndex( el => {
      return el.id === msg.event.id && el.id
    });

    if(itemIndex === -1){
      return
    }
    this._recording.splice(itemIndex, 1)
    chrome.runtime.sendMessage({control: 'update-recording', recording: this._recording})
  }

  updateEvent(msg){
    var itemIndex = this._recording.findIndex( el => {
      return el.id === msg.event.id && el.id
    });

    if(itemIndex === -1){
      return
    }
    this._recording[itemIndex] = msg.event;
    chrome.runtime.sendMessage({control: 'update-recording', recording: this._recording})
  }

  newEvent(msg){
      this._recording.push(msg.event);
      //if(msg.event.action === "goto*"){
      //    chrome.tabs.update(undefined, {url: msg.event.value})
      //}
      chrome.runtime.sendMessage({control: 'update-recording', recording: this._recording})
  }

  wait(msg){
    this.handleMessage(msg);
  }

  waitFor(msg) {
    this.handleMessage(msg);
  }

  clickText(msg){
    this.handleMessage(msg);
  }

  start () {
    this.cleanUp(() => {
      this._badgeState = 'rec'
      this.injectScript()
      this._boundedMessageHandler = this.handleMessage.bind(this)
      this._boundedNavigationHandler = this.handleNavigation.bind(this)
      this._boundedWaitHandler = this.handleWait.bind(this)

      chrome.runtime.onMessage.addListener(this._boundedMessageHandler)
      chrome.webNavigation.onCompleted.addListener(this._boundedNavigationHandler)
      chrome.webNavigation.onBeforeNavigate.addListener(this._boundedWaitHandler)

      chrome.browserAction.setIcon({ path: './images/icon-green.png' })
      chrome.browserAction.setBadgeText({ text: this._badgeState })
      chrome.browserAction.setBadgeBackgroundColor({ color: '#FF0000' })
    })
  }

  stop () {
      this.handledViewport = false;
      this.handledUrl = false;
      this._badgeState = this._recording.length > 0 ? '1' : ''

      chrome.runtime.onMessage.removeListener(this._boundedMessageHandler)
      chrome.webNavigation.onCompleted.removeListener(this._boundedNavigationHandler)
      chrome.webNavigation.onBeforeNavigate.removeListener(this._boundedWaitHandler)

      chrome.browserAction.setIcon({ path: './images/icon-black.png' })
      chrome.browserAction.setBadgeText({text: this._badgeState})
      chrome.browserAction.setBadgeBackgroundColor({color: '#45C8F1'})
  }

  pause () {
    this._badgeState = '❚❚'
    chrome.browserAction.setBadgeText({ text: this._badgeState })
    this._isPaused = true
  }

  unPause () {
    this._badgeState = 'rec'
    chrome.browserAction.setBadgeText({ text: this._badgeState })
    this._isPaused = false
  }

  cleanUp (cb) {
      this.handledViewport = false;
      this.handledUrl = false;
      this._recording = []
      chrome.browserAction.setBadgeText({ text: '' })
      chrome.runtime.sendMessage({control: 'update-recording', recording: this._recording})
      if (cb) cb()
  }

  recordCurrentUrl (href) {
      this.handledUrl = true;
      this.handleMessage({ id: uuid(), action: messageActions.GOTO, value: href })
  }

  recordCurrentViewportSize (value) {
      this.handledViewport = true;
      this.handleMessage({ id: uuid(), value, action: messageActions.VIEWPORT })
  }

  recordNavigation () {
      this.handleMessage({ id: uuid(), action: messageActions.NAVIGATION })
  }

  handleMessage (msg, sender) {
    let skip = false;
    if (msg.control) return this.handleControlMessage(msg, sender)
    // to account for clicks etc. we need to record the frameId and url to later target the frame in playback
    msg.frameId = sender ? sender.frameId : undefined
    msg.frameUrl = sender ? sender.url : undefined

    let recordingLength = this._recording.length;

    // Only record the last mouse move event
    if(!this._isPaused && msg.action == 'mousemove' && recordingLength > 0){
      if(this._recording[recordingLength - 1].action == 'mousemove'){
        this._recording[recordingLength - 1] = msg
        skip = true;
      }
    }

    if(!this._isPaused && msg.action === 'keydown' && msg.keyCode === 18 && recordingLength > 1){

      let selector = msg.target.selector;

      for(let i = recordingLength - 1; i >= 0; i--){
        let item = this._recording[i];
        let prevItem = this._recording[i - 1]

        if(item.action === 'keydown' && item.target.selector == selector){
          this._recording.splice(i, 1)
        }
        else if(item.action === 'mousemove' && prevItem && prevItem.action === 'keydown' && prevItem.target.selector == selector){
          this._recording.splice(i, 1)
        }
        else if(item.action === 'mousedown' && prevItem && prevItem.action === 'keydown' && prevItem.target.selector == selector){
          this._recording.splice(i, 1)
        }
        else {
          break
        }
      }
      msg.action = 'type-text*'
      msg.keyCode = undefined
      msg.clear = false
    }

    if(!this._isPaused && msg.action === 'keydown' && msg.keyCode == 17 && recordingLength > 1){
      let mousemove = undefined;
      if(this._recording[recordingLength - 1].action == 'mousemove'){
        mousemove = this._recording[recordingLength -1]
      }

      if(this._recording[recordingLength - 2].action == 'wait-for*'){
        this._recording[recordingLength - 2] = mousemove;
        this._recording[recordingLength - 2].action = 'wait-for-text*'
        this._recording.pop()
        skip = true;
      }
    }

    if(!this._isPaused && msg.action == 'mousedown' && recordingLength > 1){

      if(this._recording[recordingLength - 1].action == 'wait-for*'){
        this._recording[recordingLength - 1] = msg;
        this._recording[recordingLength - 1].action = 'wait-for-text*'
        skip = true;
      }

      if(this._recording[recordingLength - 1].action == 'mousemove' && this._recording[recordingLength - 2].action == 'wait-for*'){
        this._recording[recordingLength - 2] = msg;
        this._recording[recordingLength - 2].action = 'wait-for-text*'
        skip = true;
      }

      if(this._recording[recordingLength - 1].action == 'click-on*'){
        this._recording[recordingLength - 1] = msg;
        this._recording[recordingLength - 1].action = 'click-text*'
        skip = true;
      }

      if(this._recording[recordingLength - 1].action == 'mousemove' && this._recording[recordingLength - 2].action == 'click-on*'){
        this._recording[recordingLength - 2] = msg;
        this._recording[recordingLength - 2].action = 'click-text*'
        skip = true;
      }

      if(this._recording[recordingLength - 1].keyCode == 17){
        this._recording[recordingLength - 1] = msg;
        this._recording[recordingLength - 1].action = 'click-text*'
        skip = true;
      }

      if(this._recording[recordingLength - 1].action == 'mousemove' && this._recording[recordingLength - 2].keyCode == 17){
        this._recording[recordingLength - 2] = msg;
        this._recording[recordingLength - 2].action = 'click-text*'
        skip = true;
      }
    }

    if (!this._isPaused && !skip) {
      this._recording.push(msg)
    }
    chrome.runtime.sendMessage({control: 'update-recording', recording: this._recording})
  }

  handleControlMessage (msg, sender) {
    if (msg.control === 'update-recording') return // Ignore this message since this message is only sent from us
    if (msg.control === 'get-viewport-size' && !this.handledViewport) this.recordCurrentViewportSize(msg.value)
    if (msg.control === 'get-current-url' && !this.handledUrl) this.recordCurrentUrl(msg.value)
  }


  handleNavigation ({ frameId }) {
      this.injectScript()
      if (frameId === 0) {
          this.recordNavigation()
      }
      this._badgeState = 'rec'
      chrome.browserAction.setBadgeText({text: this._badgeState})
  }

  handleWait () {
    chrome.browserAction.setBadgeText({ text: 'wait' })
  }

  injectScript () {
    chrome.tabs.executeScript({ file: 'content-script.js', allFrames: false })
  }
}

window.recordingController = new RecordingController()
window.recordingController.boot()
