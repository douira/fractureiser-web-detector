<template>
  <h1>Fractureiser Web Jar Scanner</h1>
  <div style="margin-bottom: 20px; font-weight: bold">
    Made by douira, based on
    <a href="https://github.com/MCRcortex/nekodetector">nekodetector</a> by
    cortex et al.
  </div>
  <div style="margin-bottom: 20px">
    This tool works by looking for specific sequences of bytecodes within the
    class files. Be aware of false positives (it's possible but unlikely that a
    class file contains the same bytecode sequence as this tool is looking for)
    and false negatives (it's possible that a class file is infected but doesn't
    contain the same bytecode sequence as this tool is looking for).
  </div>
  <detector />
</template>

<script setup lang="ts">
import Detector from "./components/Detector.vue"
</script>
