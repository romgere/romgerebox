import Component from '@glimmer/component'
import Constants from 'romgerebox/constants'
import { htmlSafe } from '@ember/template'

interface UiInputArgs {
  playing: boolean;
  loopSideA: boolean;
  loopCount: number;
  loopValue: number;

  recording: boolean;
  micEnable: boolean;
  recordingTime: number;
  canDownload: boolean;

  playAction: () => void;
  recordAction: () => void;
  micAction: () => void;
  downloadAction: () => void;
  saveAction: () => void;
}

export default class BoxToolbarComponent extends Component<UiInputArgs> {
  loopInfo = Constants.LOOP_INFO_TYPE

  get progressStyle() {
    return htmlSafe(`width: ${this.args.loopValue}%`)
  }
}
