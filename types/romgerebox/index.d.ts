import Ember from 'ember'

declare global {
  // eslint-disable-next-line ember-suave/no-direct-property-access
  interface Array<T> extends Ember.ArrayPrototypeExtensions<T> {}
  // interface Function extends Ember.FunctionPrototypeExtensions {}

  type MixCodeValue = number | undefined
  type MixCodeArray = Array<MixCodeValue>

  interface BoxSample {
    file_a: string; // eslint-disable-line camelcase
    file_b?: string; // eslint-disable-line camelcase
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


export {}
