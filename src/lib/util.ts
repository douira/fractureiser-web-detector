import { FileStatus } from "./detect.ts"

const statusRank: FileStatus[] = ["infected", "error", "clean"]

export const combineRank = (rank1: FileStatus | string, rank2: FileStatus) => {
  const rank1Index = statusRank.indexOf(rank1 as FileStatus)
  if (rank1Index === -1) {
    return rank2
  }
  const rank2Index = statusRank.indexOf(rank2)
  return statusRank[Math.min(rank1Index, rank2Index)]
}
