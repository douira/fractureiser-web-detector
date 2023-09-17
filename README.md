# Fractureiser Web Detector

The situation has evolved since this proejct was written and I currently don't have time to keep up with MMPA or other Minecraft-related security developments. There's been efforts to streamline and vastly expand virus scanning alongside other measures. I will only be merging trivially reviewable commits. Feel free to maintain a fork and contact me about it so that I can post it here.

https://douira.github.io/fractureiser-web-detector/

## About

Made by [douira](https://github.com/douira), based on [nekodetector](https://github.com/MCRcortex/nekodetector) by cortex et al. Uses [java-class-tools](https://github.com/leonardosnt/java-class-tools) to parse Java class files in JS and [mdiff](https://github.com/tapirdata/mdiff) for matching bytecode sequences after preprocessing.

Detects the [fractureiser](https://github.com/fractureiser-investigation/fractureiser) malware in .jar or .class files that you give it.

This tool works by looking for specific sequences of bytecodes within the class files. Be aware of false positives (it's possible but unlikely that a class file contains the same bytecode sequence as this tool is looking for) and false negatives (it's possible that a class file is infected but doesn't contain the same bytecode sequence as this tool is looking for).

## Scope

The purpose of this tool is to allow users to detect if their files are infected with known signatures of the malware without needing to download and execute a program. It also avoids needing to host infrastructure and stays available independent of third-party infrastructure. Being hosted on GitHub Pages provides reasonable reliability.

## Known Problems

Some class files can't be properly read by the class parser library. It also appears the class files with the malicious payload are the ones that can't be parsed. This may be intentional obfuscation by the author of the malware or a coincidental bug in the class parser library. Pull Requests to resolve this issue are welcome.

## License

Due to the nature of this being a malware detection tool, the permissive MIT license is applied. The only requirement is that you include the copyright notice and the license text as described in [the license file](./LICENSE).

## How To Run

This project is a Vue.js application. Any knowledge about Vue.js should apply here

If anyone wants to run the webserver locally, e.g. for development purposes, they will require nodejs.

After cloning and entering the project folder, the following commands will import the dependencies
```CMD
npm install
```
and start the app.
```CMD
npm run dev
```
