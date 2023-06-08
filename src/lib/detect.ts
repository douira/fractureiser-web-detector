import * as zip from "@zip.js/zip.js"
import {
  ClassInfo,
  CodeAttributeInfo,
  ConstantPoolInfo,
  ConstantType,
  Instruction,
  InstructionParser,
  JavaClassFile,
  JavaClassFileReader,
  MethodRefInfo,
  NameAndTypeInfo,
  Opcode,
  Utf8Info,
} from "java-class-tools"
import { Signature, signatures } from "./signatures.ts"
import { combineRank } from "./util.ts"

const classReader = new JavaClassFileReader()
const textDecoder = new TextDecoder()

const bytesToString = (bytes: number[]): string =>
  textDecoder.decode(new Uint8Array(bytes))

export type FileInfo = {
  name: string
  file: File | zip.Entry
  children?: FileInfo[]
} & (
  | {
      status: "added"
    }
  | {
      status: "loading"
    }
  | {
      status: "scanning"
    }
  | {
      status: "clean"
    }
  | {
      status: "infected"
      matches: Match[]
    }
  | {
      status: "error"
      error: string
    }
)
export type FileStatus = FileInfo["status"]

export interface DetectionOptions {
  // maximum allowed edit distance between the instructions and the signature
  maxDistance: number
}

export const detect = async (
  info: FileInfo,
  options: DetectionOptions
): Promise<void> => {
  info.status = "loading"
  // check if .jar or .class
  if (info.file === undefined) {
    info.status = "error"
  } else if (info.name.endsWith(".jar")) {
    await processJar(info, options)
  } else if (info.name.endsWith(".class") && info.file instanceof File) {
    await processClass(info, await info.file.arrayBuffer(), options)
  } else {
    info.status = "error"
    if (info.status === "error") {
      info.error = "File is not a .jar or .class file"
    }
  }
}

const processJar = async (
  info: FileInfo,
  options: DetectionOptions
): Promise<void> => {
  // extract class files from the zip
  if (!(info.file instanceof File)) {
    info.status = "error"
    if (info.status === "error") {
      info.error = "File in jar is missing"
    }
    return
  }
  const zipReader = new zip.ZipReader(new zip.BlobReader(info.file))
  const entries = await zipReader.getEntries()
  const classFiles = entries.filter(entry => entry.filename.endsWith(".class"))

  // process each class file
  info.children = classFiles.map(classFile => ({
    name: classFile.filename,
    file: classFile,
    status: "loading",
  }))
  await Promise.all(
    info.children.map(async child => {
      const classFile = child.file
      if (classFile instanceof File) {
        child.status = "error"
        if (child.status === "error") {
          child.error = "File jar has wrong type"
        }
        return
      }
      if (classFile.getData === undefined) {
        child.status = "error"
        if (child.status === "error") {
          child.error = "File is empty"
        }
        return
      }

      // extract array buffer for class reader
      const buffer = await await (
        await classFile.getData(new zip.BlobWriter())
      ).arrayBuffer()
      if (info.status === "loading") {
        ;(info.status as string) = "scanning"
      }
      await processClass(child, buffer, options)
      info.status = combineRank(info.status, child.status)
    })
  )
}

const opcodeToName = new Map<number, string>(
  Object.entries(Opcode).map(([name, opcode]) => [opcode as number, name])
)

type ConstantPool = (ConstantPoolInfo | undefined)[]

export type Operand = string | number
export type InlineInstruction = [opcode: Opcode | -1, ...operands: Operand[]]
export type RawInlineInstruction = [opcode: Opcode, ...operands: Operand[]]

const resolveTwoBytes = (operands: number[], constantPool: ConstantPool) =>
  constantPool[(operands[0] << 8) | operands[1]]

const resolveInstruction = (
  instruction: Instruction,
  constantPool: ConstantPool
): InlineInstruction => {
  const resolver = instructionResolvers[instruction.opcode]
  if (resolver === undefined) {
    return [
      -1,
      `No resolver for opcode ${opcodeToName.get(instruction.opcode)}`,
    ]
  }
  if (resolver === true) {
    return [instruction.opcode]
  }
  const constant = resolver(instruction, constantPool)
  return constant
    ? typeof constant === "number"
      ? [instruction.opcode, constant]
      : [instruction.opcode, ...resolveConstant(constant, constantPool)]
    : [instruction.opcode]
}

const instructionResolvers: Partial<
  Record<
    Opcode,
    // TODO: it seems it can only ever resolve to one constant pool item (not 100% sure though)
    | true
    | ((
        instruction: Instruction,
        constantPool: ConstantPool
      ) => ConstantPoolInfo | number | undefined)
  >
> = {
  [Opcode.NEW]: (instruction: Instruction, constantPool: ConstantPool) =>
    resolveTwoBytes(instruction.operands, constantPool),
  [Opcode.INVOKESPECIAL]: (
    instruction: Instruction,
    constantPool: ConstantPool
  ) => resolveTwoBytes(instruction.operands, constantPool),
  [Opcode.INVOKESTATIC]: (
    instruction: Instruction,
    constantPool: ConstantPool
  ) => resolveTwoBytes(instruction.operands, constantPool),
  [Opcode.INVOKEVIRTUAL]: (
    instruction: Instruction,
    constantPool: ConstantPool
  ) => resolveTwoBytes(instruction.operands, constantPool),
  [Opcode.BIPUSH]: (instruction: Instruction) => instruction.operands[0],
  [Opcode.BASTORE]: true,
  [Opcode.DUP]: true,
  [Opcode.ICONST_1]: true,
  [Opcode.ICONST_2]: true,
  [Opcode.ICONST_3]: true,
  [Opcode.ICONST_4]: true,
  [Opcode.ICONST_5]: true,
  // TODO: more instruction resolvers if necessary, but make sure not the mess up other signatures (that may only expect some of the opcodes to be resolved)
}

const resolveConstant = (
  constant: ConstantPoolInfo | undefined,
  constantPool: ConstantPool
): string[] => {
  if (!constant) {
    throw new Error("Constant not found")
  }
  const resolver = constantResolvers[constant.tag]
  if (!resolver) {
    return [`No resolver for constant ${constant.tag}`]
  }
  return resolver(constant, constantPool)
}

const constantResolvers: Partial<
  Record<
    ConstantType,
    (constant: ConstantPoolInfo, constantPool: ConstantPool) => string[]
  >
> = {
  [ConstantType.UTF8]: constant => [
    bytesToString((constant as Utf8Info).bytes),
  ],
  [ConstantType.CLASS]: (constant, constantPool) =>
    resolveConstant(
      constantPool[(constant as ClassInfo).name_index],
      constantPool
    ),
  [ConstantType.METHODREF]: (constant, constantPool) => {
    const methodRef = constant as MethodRefInfo
    return resolveConstant(
      constantPool[methodRef.class_index],
      constantPool
    ).concat(
      resolveConstant(constantPool[methodRef.name_and_type_index], constantPool)
    )
  },
  [ConstantType.NAME_AND_TYPE]: (constant, constantPool) => {
    const nameAndType = constant as NameAndTypeInfo
    return resolveConstant(
      constantPool[nameAndType.name_index],
      constantPool
    ).concat(
      resolveConstant(constantPool[nameAndType.descriptor_index], constantPool)
    )
  },
  // TODO: more constant resolvers if necessary
}

interface Match {
  method: string
  signature: Signature
  offset: number
  distance: number
}

const processClass = async (
  info: FileInfo,
  buffer: ArrayBuffer,
  options: DetectionOptions
): Promise<void> => {
  info.status = "scanning"
  let classFile: JavaClassFile
  try {
    classFile = classReader.read(buffer)
  } catch (e) {
    info.status = "error"
    if (info.status === "error") {
      info.error = (e as Error).toString()
    }
    console.error(e)
    return
  }

  // for all methods
  classFile.methods.forEach(method => {
    const codeAttribute = method.attributes.find(attr => "code" in attr) as
      | CodeAttributeInfo
      | undefined
    if (!codeAttribute) {
      return
    }

    const methodName = bytesToString(
      (classFile.constant_pool[method.name_index] as Utf8Info).bytes
    )

    const instructions = InstructionParser.fromBytecode(codeAttribute.code).map(
      instruction => resolveInstruction(instruction, classFile.constant_pool)
    )

    for (const sig of signatures) {
      const sigInstructions = sig.instructions
      if (sigInstructions.length > instructions.length) {
        continue
      }

      // generate local instruction array filtered to the opcodes used by this signature
      const localInstructions = instructions.filter(
        instruction =>
          instruction[0] !== -1 &&
          (sig.opcodes == null || sig.opcodes.has(instruction[0]))
      )

      if (sigInstructions.length > localInstructions.length) {
        continue
      }

      // console.log(sig.name)
      // console.log(sig.opcodes)
      // console.log(sigInstructions)
      // console.log(localInstructions)

      // look for signature in local instructions at any offset
      for (
        let offset = 0;
        offset < localInstructions.length - sigInstructions.length;
        offset++
      ) {
        // start looking for signature at offset in local instructions
        let mismatches = 0
        let localOffset = offset
        for (let i = 0; i < sigInstructions.length; i++) {
          const sigInstruction = sigInstructions[i]

          // find next local instruction with the same opcode
          let localInstruction: InlineInstruction
          do {
            localInstruction = localInstructions[localOffset + i]
          } while (
            localInstruction !== undefined &&
            localInstruction[0] !== sigInstruction[0] &&
            ++localOffset
          )

          if (localInstruction === undefined) {
            mismatches++
            if (mismatches > options.maxDistance) {
              break
            }
            continue
          }

          // match instructions
          let instructionMismatch = false
          if (sigInstruction.length !== localInstruction.length) {
            instructionMismatch = true
          } else {
            for (let j = 0; j < sigInstruction.length; j++) {
              if (sigInstruction[j] !== localInstruction[j]) {
                instructionMismatch = true
                break
              }
            }
          }
          if (instructionMismatch) {
            mismatches++
            if (mismatches > options.maxDistance) {
              break
            }
          }
        }

        // found match
        if (mismatches <= options.maxDistance) {
          info.status = "infected"
          if (info.status === "infected") {
            if (info.matches === undefined) {
              info.matches = []
            }
            info.matches.push({
              method: methodName,
              signature: sig,
              offset,
              distance: mismatches,
            })
          }

          // stop looking for this signature in this method
          break
        }
      }
    }
  })

  if (info.status === "scanning") {
    ;(info.status as string) = "clean"
  }
}
