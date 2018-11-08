<template>
  <div id="donut-recorder" class="recorder">
    <div class="header">
      <a href="#" @click="goHome">
        Recorder <span class="text-muted"><small>{{version}}</small></span>
      </a>
      <div class="left">
        <div class="recording-badge" v-show="isRecording">
          <span class="red-dot"></span>
          {{recordingBadgeText}}
        </div>
        <a href="#" @click="toggleShowHelp" class="header-button">
          <img src="/images/help.svg" alt="help" width="18px">
        </a>
        <a href="#" @click="openOptions" class="header-button">
          <img src="/images/settings.svg" alt="settings" width="18px">
        </a>
      </div>
    </div>
    <div class="main">
      <div class="tabs" v-show="!showHelp">
        <RecordingTab :code="code" :is-recording="isRecording" :live-events="recording" v-show="!showResultsTab"/>
        <div class="recording-footer" v-show="!showResultsTab">
          <button class="btn btn-sm" @click="toggleRecord" :class="isRecording ? 'btn-danger' : 'btn-primary'">
            {{recordButtonText}}
          </button>
          <button class="btn btn-sm btn-primary btn-outline-primary" @click="togglePause" v-show="isRecording">
            {{pauseButtonText}}
          </button>
          <a href="#" @click="showResultsTab = true" v-show="code">view code</a>
        </div>
        <div class="recording-footer" v-show="isRecording">
          <button class="btn btn-sm btn-primary" @click="wait" v-show="isRecording">
            {{waitButtonText}}
          </button>
          <button class="btn btn-sm btn-primary" @click="waitFor" v-show="isRecording">
            {{waitForButtonText}}
          </button>
          <button class="btn btn-sm btn-primary" @click="textClick" v-show="isRecording">
            {{textClickButtonText}}
          </button>
        </div>
        <ResultsTab :code="code" :copy-link-text="copyLinkText" :restart="restart" :set-copying="setCopying" v-show="showResultsTab"/>
        <div class="results-footer" v-show="showResultsTab">
          <button class="btn btn-sm btn-primary" @click="restart" v-show="code">Restart</button>
          <a href="#" v-clipboard:copy='code' @click="setCopying" v-show="code">{{copyLinkText}}</a>
        </div>
      </div>
      <HelpTab v-show="showHelp"></HelpTab>
    </div>
  </div>
</template>

<script>
  import { version } from '../../../package.json'
  import RecordingTab from "./RecordingTab.vue"
  import ResultsTab from "./ResultsTab.vue";
  import HelpTab from "./HelpTab.vue";
  import { global } from '../../code-generator/global-settings'
  import { CodeGenerator, generators } from '../../code-generator/code-generator'

  export default {
    name: 'App',
    components: { ResultsTab, RecordingTab, HelpTab },
    data () {
      return {
        code: '',
        showResultsTab: false,
        showHelp: false,
        recording: [],
        isRecording: false,
        isPaused: false,
        isCopying: false,
        bus: null,
        version,
        options: { global, generators }
      }
    },
    mounted () {
      this.loadState(() => {
        if (this.isRecording) {
          this.$chrome.storage.local.get(['recording'], ({ recording }) => {
            this.recording = recording
          })
        }

        if (!this.isRecording && this.code) {
          this.showResultsTab = true
        }
      })
      this.bus = this.$chrome.extension.connect({ name: 'recordControls' })
    },
    methods: {
      toggleRecord () {
        if (this.isRecording) {
          this.stop()
        } else {
          this.start()
        }
        this.isRecording = !this.isRecording
        this.storeState()
      },
      togglePause () {
        if (this.isPaused) {
          this.bus.postMessage({ action: 'unpause' })
          this.isPaused = false
        } else {
          this.bus.postMessage({ action: 'pause' })
          this.isPaused = true
        }
        this.storeState()
      },
      wait () {
        this.bus.postMessage({ action: 'wait' })
      },
      waitFor () {
        this.bus.postMessage({ action: 'wait-for' })
      },
      textClick() {
        this.bus.postMessage({ action: 'click-on' })
      },
      start () {
        this.cleanUp()
        this.bus.postMessage({ action: 'start' })
      },
      stop () {
        this.bus.postMessage({ action: 'stop' })
        this.refresh()

      },
      refresh () {
        this.$chrome.storage.local.get(['recording', 'options'], ({ recording, options }) => {
          this.recording = recording ? recording : []

          let activeOptions = {}
          let temp = options.generators.types.find((element) => element.id === options.generators.active).options
          for(let option in temp){
            let item = temp[option];
            activeOptions[item.name] = item.value
          }

          let generatorOptions = Object.assign(options.global, activeOptions)
          chrome.extension.getBackgroundPage().console.log("Using Code Generator", options.generators.active)
          chrome.extension.getBackgroundPage().console.log("With Options", JSON.stringify(generatorOptions))
          let codeGen = new CodeGenerator(options.generators.active, generatorOptions);
          this.code = codeGen.generate(this.recording)
          this.showResultsTab = true
          this.storeState()
        })
      },
      restart () {
        this.cleanUp()
        this.bus.postMessage({ action: 'cleanUp' })
      },
      cleanUp () {
        this.recording.length = 0
        this.code = ''
        this.showResultsTab = this.isRecording = this.isPaused = false
        this.storeState()
      },
      openOptions () {
        if (this.$chrome.runtime.openOptionsPage) {
          this.$chrome.runtime.openOptionsPage()
        }
      },
      loadState (cb) {
        this.$chrome.storage.local.get(['controls', 'code', 'options'], ({ controls, code, options }) => {
          if (controls) {
            this.isRecording = controls.isRecording
            this.isPaused = controls._isPaused
          }

          if (code) {
            this.refresh()
          }

          // Initialize the options in local storage if necessary
          if(!options){
            this.$chrome.storage.local.set({options: this.options})
          }
          cb()
        })
      },
      storeState () {
        this.$chrome.storage.local.set({
          code: this.code,
          controls: {
            isRecording: this.isRecording,
            isPaused: this.isPaused
          }
        })
      },
      setCopying () {
        this.isCopying = true
        setTimeout(() => { this.isCopying = false }, 1500)
      },
      goHome () {
        this.showResultsTab = false
        this.showHelp = false
      },
      toggleShowHelp () {
        this.showHelp = !this.showHelp
      }
    },
    computed: {
      recordingBadgeText () {
        return this.isPaused ? 'paused' : 'recording'
      },
      recordButtonText () {
        return this.isRecording ? 'Stop' : 'Record'
      },
      waitForButtonText () {
        return 'Wait For'
      },
      waitButtonText () {
        return 'Wait'
      },
      textClickButtonText () {
        return 'Text Click'
      },
      pauseButtonText () {
        return this.isPaused ? 'Resume' : 'Pause'
      },
      copyLinkText () {
        return this.isCopying ? 'copied!' : 'copy to clipboard'
      }
    }
}
</script>

<style lang="scss" scoped>
  @import "~styles/_animations.scss";
  @import "~styles/_variables.scss";
  @import "~styles/_mixins.scss";

  .recorder {
    font-size: 14px;

    .header {
      @include header();

      a {
        color: $gray-dark;
      }

      .left {
        margin-left: auto;
        display: flex;
        justify-content: flex-start;
        align-items: center;

        .recording-badge {
          color: $brand-danger;
          .red-dot {
            height: 9px;
            width: 9px;
            background-color: $brand-danger;
            border-radius: 50%;
            display: inline-block;
            margin-right: .4rem;
            vertical-align: middle;
            position: relative;
          }
        }

        .header-button {
          margin-left: $spacer;
          img {
            vertical-align: middle;
          }
        }
      }
    }

    .recording-footer {
      @include footer()
    }
    .results-footer {
      @include footer()
    }
  }
</style>
