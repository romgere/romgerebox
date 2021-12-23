export interface AudioStreamProcessor extends ScriptProcessorNode {
  volume: number
}

declare function audioStreamProcessor(context: AudioContext, callback: () => void) : AudioStreamProcessor

export {
  audioStreamProcessor
}