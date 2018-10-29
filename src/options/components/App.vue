<template>
  <div class="options">
    <div class="container">
      <div class="header">
        Recorder Options
        <small class="saving-badge text-muted" v-show="saving">
          Saving...
        </small>
      </div>
      <div class="content" v-if="!loading">
        <div class="settings-block">
          <h4 class="settings-block-title">Code Generator Settings</h4>
          <div class="settings-block-main">
            <div class="settings-group" >
              <template v-for="generator in options.generators.types">
                <div>
                  <input v-bind:id="generator.id" v-bind:value="generator.id" type="radio" v-model="options.generators.active" v-on:change="save(generator)">
                  <label>{{generator.title}}</label>
                </div>
              </template>
            </div>
            <h4 class="settings-block-title">Generator Specific Options</h4>
            <template v-for="option in myoptions">
              <input v-bind:id="option.id" v-bind:value="option.value" v-bind:type="option.type" v-model="option.value" v-on:change="save()">
              <label>{{option.title}}</label>
            </template>
            <div class="settings-group">
            </div>
            <h4 class="settings-block-title">Common Options</h4>
            <div class="settings-group">
              <label>
                <input id="settings-headless" type="checkbox" v-model="options.global.headless" @change="save">
                set <code>headless</code> in puppeteer launch options
              </label>
            </div>
            <div class="settings-group">
              <label>
                <input id="settings-waitForNavigation" type="checkbox" v-model="options.global.waitForNavigation" @change="save">
                add <code>waitForNavigation</code> lines on navigation
              </label>
            </div>
            <div class="settings-group">
              <label>
                <input id="settings-wait" type="textbox" v-model="options.global.wait" @change="save">
                the wait period for arbitrary wait commands</code>
              </label>
            </div>
            <div class="settings-group">
              <label>
                <input id="settings-typingTerminator" type="textbox" v-model="options.global.typingTerminator" @change="save">
                the keycode that indicates that the user is done typing and emit the <code>type()</code> instruction
              </label>
            </div>
            <div class="settings-group">
              <label for="settings-cookies" >A json value that defines the cookies.</label>
              <textarea class="settings-textarea" id="settings-cookies" v-model="options.global.cookies" @change="save"></textarea>
            </div>
            <div class="settings-group">
              <label for="settings-localStorage">A json value that defines the local storage values.</label>
              <textarea class="settings-textarea" id="settings-localStorage" v-model="options.global.localStorage" @change="save"></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { global } from '../../code-generator/global-settings'
  import { CodeGenerator, generators } from '../../code-generator/code-generator'

  export default {
    name: 'App',
    data () {
      return {
        myoptions: [],
        loading: true,
        saving: false,
        options: {global, generators}
      }
    },
    mounted () {
      this.load()
    },
    methods: {
      save (generator) {
        this.saving = true
        this.$chrome.storage.local.set({options: this.options }, () => {
          setTimeout(() => {
            this.saving = false
          }, 500)
        })
      },
      load () {
        this.$chrome.storage.local.get('options', ({ options }) => {
          if (options) {
            this.options = options
          }
          this.loading = false
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  @import "~styles/_variables.scss";
  @import "~styles/_mixins.scss";

  .options {

    height: 100%;
    min-height: 580px;
    background: $gray-lighter;
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: auto;
    position: fixed;
    left: 0;
    top: 0;

    .container {
      padding: 0 2 * $spacer;
      width: 550px;
      margin: 0 auto;

      .content {
        background: white;
        padding: 2 * $spacer;
        border-radius: 4px;
        min-height: 500px;
      }

      .footer {
        @include footer();
        background: $gray-lighter;
        font-weight: normal;
        justify-content: center;
        img {
          margin-left: 8px;
          width: 80px;
          vertical-align: middle;
        }
      }

      .header {
        @include header();
        background: $gray-lighter;
        justify-content: space-between;
      }

      .settings-block {
        .settings-block-title {
          margin: 0;
          padding-bottom: $spacer;
          border-bottom: 1px solid $gray-light;
        }
        .settings-block-main {
          padding: $spacer 0;
          margin-bottom: $spacer;

          .settings-group {
            margin-bottom: $spacer;
            display: block;
          }
        }
      }
    }
  }
</style>
