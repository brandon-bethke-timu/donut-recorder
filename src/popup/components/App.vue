<template>
  <div id="donut-recorder" class="recorder">
    <div class="header">
      <a href="#" @click="goHome">Recorder <span class="text-muted"><small>{{version}}</small></span></a>
      <div class="recording-buttons">
        <img src="/images/recording-start.svg" v-show="!showResults && !isRecording" @click="toggleRecord" v-b-tooltip.hover title="Start Recording" alt="Start Recording">
        <img src="/images/recording-stop.svg" v-show="isRecording" @click="toggleRecord" v-b-tooltip.hover title="Stop Recording" alt="Stop Recording" >
        <img class='pause-buttons' src="/images/recording-pause.svg" v-show="isRecording && !isPaused" @click="togglePause" v-b-tooltip.hover title="Pause Recording" alt="Pause Recording">
        <img class='pause-buttons' src="/images/recording-resume.svg" v-show="isRecording && isPaused" @click="togglePause" v-b-tooltip.hover title="Resume Recording" alt="Resume Recording">
        <img src="/images/recording-restart.svg" v-show="showResults && code" @click="restart" v-b-tooltip.hover title="Restart Recording" alt="Restart Recording">
        <img src="/images/recording-copy.svg" v-clipboard:copy='code' v-show="showResults && code" @click="setCopying" v-b-tooltip.hover title="Copy Recording" alt="Copy Recording">
      </div>
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
        <RecordingTab :code="code" :is-recording="isRecording" :live-events="recording" v-show="!showResults"/>
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
        <ResultsTab :code="code" :restart="restart" v-show="showResults"/>
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
        showResults: false,
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
      chrome.runtime.onMessage.addListener((request)=>{
        if(request.control === 'update-recording'){
          this.recording = request.recording;
          if(!this.isRecording && !this.isPaused && this.showResults) {
            this.refresh()
          }
        }
      })
      this.loadState()
      this.bus = this.$chrome.extension.connect({ name: 'recordControls' })
      this.bus.postMessage({action: 'get-recording'})
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
        this.$chrome.storage.local.get(['options'], ({ options }) => {
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
          this.showResults = true
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
        this.showResults = this.isRecording = this.isPaused = false
        this.storeState()
      },
      openOptions () {
        if (this.$chrome.runtime.openOptionsPage) {
          this.$chrome.runtime.openOptionsPage()
        }
      },
      loadState (cb) {
        chrome.storage.local.get(['controls', 'options'], ({ controls, options }) => {
          if (controls) {
            this.isRecording = controls.isRecording
            this.isPaused = controls.isPaused
            this.showResults = controls.showResults
          }
          // Initialize the options in local storage if necessary
          if(!options){
            chrome.storage.local.set({options: this.options})
          }
          if(cb) cb()
        })
      },
      storeState () {
        this.$chrome.storage.local.set({
          controls: {
            isRecording: this.isRecording,
            isPaused: this.isPaused,
            showResults: this.showResults
          }
        })
      },
      setCopying () {
        this.isCopying = true
        setTimeout(() => { this.isCopying = false }, 1500)
      },
      goHome () {
        this.showResults = false
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

      .recording-buttons {
        margin-left: 15px;
      }

      .pause-buttons {
        -webkit-transform: rotate(90deg);
        padding-left: 2px
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
