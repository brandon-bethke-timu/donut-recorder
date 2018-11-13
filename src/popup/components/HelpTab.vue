<template>
  <div class="tab help-tab">
    <div class="content">
      <h4>Recording</h4>
      <ul>
        <li>To start recording click the record button</li>
        <li>Perform ui actions</li>
        <li>Click the pause button to temporarily stop recording. Click the pause button again to continue recording.</li>
        <li>Click the record icon again to stop recording and code will be generated.</li>
      </ul>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'HelpTab'
  }
</script>
<style lang="scss" scoped>
  @import "~styles/_variables.scss";
  @import "~styles/_mixins.scss";

  .help-tab {
    .content {
      padding: $spacer;
      text-align: left;

      ul {
        padding-left: 1rem;
      }

      pre {
        background: #272822;
        color: white;
        font-family: monospace;
        padding: 1rem;
        border-radius: 4px;
      }
    }

    .help-footer {
      @include footer();
      font-weight: normal;
      justify-content: flex-end;
      img {
        margin-left: 8px;
        width: 80px;
        vertical-align: middle;
      }
    }
  }
</style>
