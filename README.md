# Fractureiser Web Detector

Made by [douira](https://github.com/douira), based on [nekodetector](https://github.com/MCRcortex/nekodetector) by cortex et al. Uses [java-class-tools](https://github.com/leonardosnt/java-class-tools) to parse Java class files in JS and [mdiff](https://github.com/tapirdata/mdiff) for matching bytecode sequences after preprocessing.

Detects the [fractureiser](https://github.com/fractureiser-investigation/fractureiser) malware in .jar files that you give it.

This tool works by looking for specific sequences of bytecodes within the class files. Be aware of false positives (it's possible but unlikely that a class file contains the same bytecode sequence as this tool is looking for) and false negatives (it's possible that a class file is infected but doesn't contain the same bytecode sequence as this tool is looking for).

## Scope

The purpose of this tool is to allow users to detect if their files are infected with known signatures of the malware without needing to download and execute a program. It also avoids needing to host infrastructure and stays available independent of third-party infrastructure. Being hosted on GitHub Pages provides reasonable reliability.

## Known Problems

Some class files can't be properly read by the class parser library. It also appears the class files with the malicious payload are the ones that can't be parsed. This may be intentional obfuscation by the author of the malware or a coincidental bug in the class parser library. Pull Requests to resolve this issue are welcome.

## License

Due to the nature of this being a malware detection tool, the permissive MIT license is applied. The only requirement is that you include the copyright notice and the license text as described in [the license file](./LICENSE).
