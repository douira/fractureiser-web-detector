import { Opcode } from "java-class-tools"
import type { InlineInstruction, RawInlineInstruction } from "./detect.ts"

export interface Signature {
  name: string
  instructions: InlineInstruction[]
  opcodes: null | Set<Opcode>
}

// https://github.com/MCRcortex/nekodetector/blob/6afbe30dc3046b65de9c6ba6cde8ecb59a79ca8b/src/main/java/me/cortex/jarscanner/Detector.java
type RawSignature = {
  name: string
  instructions: RawInlineInstruction[]
  opcodes?: null
}
const signaturesRaw: RawSignature[] = [
  {
    name: "sig1",
    // prettier-ignore
    instructions: [
      [Opcode.NEW, "java/lang/String"],
      [Opcode.INVOKESPECIAL, "java/lang/String", "<init>", "([B)V"],
      [Opcode.NEW, "java/lang/String"],
      [Opcode.INVOKESPECIAL, "java/lang/String", "<init>", "([B)V"],
      [Opcode.INVOKESTATIC, "java/lang/Class", "forName", "(Ljava/lang/String;)Ljava/lang/Class;"],
      [Opcode.INVOKEVIRTUAL, "java/lang/Class", "getConstructor", "([Ljava/lang/Class;)Ljava/lang/reflect/Constructor;"],
      [Opcode.INVOKESPECIAL, "java/lang/String", "<init>", "([B)V"],
      [Opcode.INVOKESPECIAL, "java/lang/String", "<init>", "([B)V"],
      [Opcode.INVOKESPECIAL, "java/lang/String", "<init>", "([B)V"],
      [Opcode.INVOKESPECIAL, "java/net/URL", "<init>", "(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;)V"],
      [Opcode.INVOKEVIRTUAL, "java/lang/reflect/Constructor", "newInstance", "([Ljava/lang/Object;)Ljava/lang/Object;"],
      [Opcode.INVOKESTATIC, "java/lang/Class", "forName", "(Ljava/lang/String;ZLjava/lang/ClassLoader;)Ljava/lang/Class;"],
      [Opcode.INVOKESPECIAL, "java/lang/String", "<init>", "([B)V"],
      [Opcode.INVOKEVIRTUAL, "java/lang/Class", "getMethod", "(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;"],
      [Opcode.INVOKEVIRTUAL, "java/lang/reflect/Method", "invoke", "(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;"],
		],
  },
  {
    name: "sig2",
    // prettier-ignore
    instructions: [
      [Opcode.INVOKESTATIC, "java/lang/Runtime", "getRuntime", "()Ljava/lang/Runtime;"],
      [Opcode.INVOKESTATIC, "java/util/Base64", "getDecoder", "()Ljava/util/Base64$Decoder;"],
      [Opcode.INVOKEVIRTUAL, "java/lang/String", "concat", "(Ljava/lang/String;)Ljava/lang/String;"], //TODO:FIXME: this might not be in all of them
      [Opcode.INVOKEVIRTUAL, "java/util/Base64$Decoder", "decode", "(Ljava/lang/String;)[B"],
      [Opcode.INVOKESPECIAL, "java/lang/String", "<init>", "([B)V"],
      [Opcode.INVOKEVIRTUAL, "java/io/File", "getPath", "()Ljava/lang/String;"],
      [Opcode.INVOKEVIRTUAL, "java/lang/Runtime", "exec", "([Ljava/lang/String;)Ljava/lang/Process;"],
    ],
  },
  {
    name: "sig3-ip",
    // prettier-ignore
    instructions: [
      [Opcode.BIPUSH, 56],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.ICONST_1],
      [Opcode.BIPUSH, 53],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.ICONST_2],
      [Opcode.BIPUSH, 46],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.ICONST_3],
      [Opcode.BIPUSH, 50],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.ICONST_4],
      [Opcode.BIPUSH, 49],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.ICONST_5],
      [Opcode.BIPUSH, 55],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.BIPUSH, 6],
      [Opcode.BIPUSH, 46],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.BIPUSH, 7],
      [Opcode.BIPUSH, 49],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.BIPUSH, 8],
      [Opcode.BIPUSH, 52],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.BIPUSH, 9],
      [Opcode.BIPUSH, 52],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.BIPUSH, 10],
      [Opcode.BIPUSH, 46],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.BIPUSH, 11],
      [Opcode.BIPUSH, 49],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.BIPUSH, 12],
      [Opcode.BIPUSH, 51],
      [Opcode.BASTORE],
      [Opcode.DUP],
      [Opcode.BIPUSH, 13],
      [Opcode.BIPUSH, 48]
			],
    opcodes: null, // don't filter
  },
]

export const signatures: Signature[] = signaturesRaw.map(sig => ({
  ...sig,
  opcodes: sig.opcodes === null ? null : new Set(sig.instructions.map(i => i[0])),
}))
