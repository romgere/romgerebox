import Ember from 'ember';

declare global {
  interface Array<T> extends Ember.ArrayPrototypeExtensions<T> {}
  // interface Function extends Ember.FunctionPrototypeExtensions {}

  type MixCodeValue = number | undefined
  type MixCodeArray = Array<MixCodeValue>

  interface BoxSample {
    file_a: string;
    file_b?: string;
    color: string;
    icon: string;
  }

  interface BoxVersion {
    name: string;
    loopTime: number;
    samples: Array<BoxSample>;
  }

  interface VersionsDef {
    versions: Array<BoxVersion>
  }
  
  interface WebAudioRecorderOptions {
    timeLimit :number
  }
  
  interface WebAudioRecorderArgs {
    workerDir: string;
    encoding: string,
    
    onComplete: () => void;
    onTimeout: () => void;
    options ?: WebAudioRecorderOptions
  }

  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}


export {};
