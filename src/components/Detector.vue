<template>
  Select .class and .jar files to scan:<br />
  <input
    type="file"
    @change="onFileChange"
    accept=".jar,.class"
    multiple
    style="padding-left: 80px"
  />
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
    <div v-if="showMatchLooseness" style="margin-top: 10px">
      <p style="max-width: 800px; margin-bottom: 10px">
        Using a nonzero looseness enables finding imperfect matches with the
        signatures. Such results are usually false positive detections but may
        be interesting in the case of obfuscation. Additionally, matches may be
        reported with a higher distance than necessary.
      </p>
      Match looseness (edit distance):
      <input v-model="maxDistance" type="number" />
    </div>
    <div v-else style="margin-top: 10px">
      <a @click="showMatchLooseness = true" style="cursor: pointer">
        Adjust match looseness (advanced)
      </a>
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
                    Distance {{ match.distance }},
                  </span>
                  <span>
                    Instruction offset
                    {{ match.offset }}
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
const showMatchLooseness = ref(false)

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
  let fileSlices = new Array(window.navigator.hardwareConcurrency)
  const middleIndex = Math.ceil(files.length / fileSlices.length);
  for (let i = 0; i < fileSlices.length; i++) {
    fileSlices[i] = files.slice(middleIndex*i, middleIndex*(i+1));
  }
  for (let i = 0; i < fileSlices.length; i++) {
    new Promise(async _ => {
      for await (let info of fileSlices[i]) {
        await detect(info, {
          maxDistance: maxDistance.value,
        })
        globalStatus.value = combineRank(globalStatus.value, info.status)
      }
      console.log("finished " + i)
    })
    console.log("started " + i)
  }
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
