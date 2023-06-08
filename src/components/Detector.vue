<template>
  <input type="file" @change="onFileChange" accept=".jar,.class" multiple />
  <div style="margin-top: 20px">
    <button @click="run">Scan</button>
    <button
      style="margin-left: 10px"
      @click="displayMode = (displayMode + 1) % 3"
    >
      <template v-if="displayMode === 0">All classes shown</template>
      <template v-else-if="displayMode === 1">Clean classes hidden</template>
      <template v-else>Only problems shown</template>
    </button>
    <div style="margin-top: 10px">
      Match looseness (edit distance):
      <input v-model="maxDistance" type="number" />
    </div>
  </div>
  <h4 :class="{ [globalStatus]: true }">Status: {{ globalStatus }}</h4>
  <div>
    <ul style="text-align: start">
      <li v-for="{ name, status, children } in files" :key="name">
        {{ name }}:
        <span v-if="children">{{ children.length }} classes&nbsp;</span>
        <span style="font-weight: bold" :class="{ [status]: true }">{{
          status
        }}</span>
        <ul v-if="children">
          <template v-for="child in children" :key="child.name">
            <li
              v-if="
                displayMode === 0 ||
                (child.status !== 'clean' && displayMode === 1) ||
                (child.status !== 'clean' &&
                  child.status !== 'added' &&
                  child.status !== 'loading' &&
                  child.status !== 'scanning' &&
                  displayMode === 2)
              "
            >
              {{ child.name }}:
              <span style="font-weight: bold" :class="{ [child.status]: true }">
                {{ child.status }}
              </span>
              <div v-if="child.status === 'error'">
                <samp>
                  {{ child.error }}
                </samp>
              </div>
              <ul v-if="child.status === 'infected' && child.matches">
                <li v-for="(match, i) in child.matches" :key="i">
                  Signature match in method <samp>{{ match.method }}</samp> with
                  signature <samp>{{ match.signature.name }}</samp
                  >.
                  <span :class="{ distance: match.distance > 0 }">
                    Distance {{ match.distance }}
                  </span>
                </li>
              </ul>
            </li>
          </template>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue"
import { FileInfo, FileStatus, detect } from "../lib/detect.js"
import { combineRank } from "../lib/util.js"

const globalStatus = ref<FileStatus | string>("idle")
const displayMode = ref(2)
const maxDistance = ref(0)

const files = reactive<FileInfo[]>([])

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    files.splice(0, files.length)
    for (let i = 0; i < target.files.length; i++) {
      const file = target.files[i]
      files.push({ name: file.name, file, status: "added" })
    }
  }
  globalStatus.value = "files selected"
}

const run = async () => {
  if (files.length === 0) {
    globalStatus.value = "no files selected"
    return
  }
  globalStatus.value = "loading & scanning"
  await Promise.all(
    Array.from(files).map(async info => {
      await detect(info, {
        maxDistance: maxDistance.value,
      })
      globalStatus.value = combineRank(globalStatus.value, info.status)
    })
  )
}
</script>

<style scoped>
.clean {
  color: rgb(8, 183, 8);
}
.infected {
  color: rgb(228, 69, 69);
}
.error {
  color: rgb(106, 106, 236);
}
.distance {
  font-weight: bold;
  color: rgb(255, 176, 48);
}
samp {
  background-color: rgb(29, 29, 29);
  border-radius: 3px;
  padding: 0 3px;
  font-family: monospace;
}
</style>
