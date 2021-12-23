// https://github.com/microsoft/TypeScript/issues/28308
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

// declare var AudioWorkletProcessor: {
//   prototype: AudioWorkletProcessor;
//   new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
// }

interface AudioParamDescriptor {
  name: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
  automationRate: AutomationRate;
}

declare function registerProcessor(
  name: string,
  processorCtor: (new (
    options?: AudioWorkletNodeOptions
  ) => AudioWorkletProcessor) & {
    parameterDescriptors?: AudioParamDescriptor[];
  }
): undefined;

