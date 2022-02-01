// Types for compiled templates
declare module 'romgerebox/templates/*' {
  import { TemplateFactory } from 'htmlbars-inline-precompile'
  const tmpl: TemplateFactory
  export default tmpl
}

declare class WebAudioRecorder extends Error {
  startRecording() :void
  finishRecording() :void
  constructor(n: GainNode, o: WebAudioRecorderArgs);
}

declare module 'romgerebox/tests/helpers/ember-drag-drop' {
  function drag (selector: string, options: Record<string, string>): void;

  export {
    drag
  }
}
