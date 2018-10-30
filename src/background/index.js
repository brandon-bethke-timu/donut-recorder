import messageActions from '../code-generator/message-actions'

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
        if (msg.action === 'wait') this.wait()
        if (msg.action === 'wait-for') this.waitFor()
        if (msg.action === 'click-text') this.clickText()
      })
    })
  }

  wait(){
    this.handleMessage({ action: messageActions.WAIT });
  }

  waitFor() {
    this.handleMessage({ action: messageActions.WAIT_FOR });
  }

  clickText(){
    this.handleMessage({ action: messageActions.CLICK_TEXT });
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
    this._badgeState = this._recording.length > 0 ? '1' : ''

    chrome.runtime.onMessage.removeListener(this._boundedMessageHandler)
    chrome.webNavigation.onCompleted.removeListener(this._boundedNavigationHandler)
    chrome.webNavigation.onBeforeNavigate.removeListener(this._boundedWaitHandler)

    chrome.browserAction.setIcon({ path: './images/icon-black.png' })
    chrome.browserAction.setBadgeText({text: this._badgeState})
    chrome.browserAction.setBadgeBackgroundColor({color: '#45C8F1'})

    chrome.storage.local.set({ recording: this._recording }, () => {
      console.debug('recording stored')
    })
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
    this._recording = []
    chrome.browserAction.setBadgeText({ text: '' })
    chrome.storage.local.remove('recording', () => {
      console.debug('stored recording cleared')
      if (cb) cb()
    })
  }

  recordCurrentUrl (href) {
    this.handleMessage({ action: messageActions.GOTO, value: href })
    this.handleMessage({ action: messageActions.SET_LOCAL_STORAGE })
  }

  recordCurrentViewportSize (value) {
    this.handleMessage({ value, action: messageActions.VIEWPORT })
  }

  recordNavigation () {
    this.handleMessage({ action: messageActions.NAVIGATION })
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

      for(let i = recordingLength - 1; i >= 0; i--){
        if(this._recording[i].action === 'keydown'){
          this._recording.splice(i, 1)
        }
      }
      msg.action = 'type-text*'
      msg.keyCode = undefined
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
    chrome.storage.local.set({ recording: this._recording }, () => {
      console.debug('stored recording updated')
    })
  }

  handleControlMessage (msg, sender) {
    if (msg.control === 'event-recorder-started') chrome.browserAction.setBadgeText({ text: this._badgeState })
    if (msg.control === 'get-viewport-size') this.recordCurrentViewportSize(msg.value)
    if (msg.control === 'get-current-url') this.recordCurrentUrl(msg.value)
  }

  handleNavigation ({ frameId }) {
    console.debug('frameId is:', frameId)
    this.injectScript()
    if (frameId === 0) {
      this.recordNavigation()
    }
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