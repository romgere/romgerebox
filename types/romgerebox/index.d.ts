import Ember from 'ember';

declare global {
  interface Array<T> extends Ember.ArrayPrototypeExtensions<T> {}
  // interface Function extends Ember.FunctionPrototypeExtensions {}

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
}


export {};
