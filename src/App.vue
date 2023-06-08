<template>
  <h1>Fractureiser Web Scanner</h1>
  <div style="margin-bottom: 20px; font-weight: bold">
    Made by
    <a href="https://github.com/douira/fractureiser-web-detector">douira</a>,
    based on
    <a href="https://github.com/MCRcortex/nekodetector">nekodetector</a> by
    cortex et al.
  </div>
  <div style="margin-bottom: 20px; max-width: 800px">
    This tool works by looking for specific sequences of bytecodes within the
    class files. The files are scannend <i>locally</i> in your browser with
    JavaScript and aren't sent to a remove server.
  </div>
  <div style="margin-bottom: 20px; max-width: 800px">
    Be aware of false positives (it's possible but unlikely that a class file
    contains the same bytecode sequence as this tool is looking for) and false
    negatives (it's possible that a class file is infected but doesn't contain
    the same bytecode sequence as this tool is looking for).
    <br />
    More information on
    <a href="https://github.com/douira/fractureiser-web-detector">
      this project's GitHub page.
    </a>
  </div>
  <detector />
</template>

<script setup lang="ts">
import Detector from "./components/Detector.vue"
</script>
