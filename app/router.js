import EmberRouter from '@ember/routing/router';
import config from 'romgerebox/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('box', {path : 'box/:version_idx'});
  this.route('unlock-audio');
});
