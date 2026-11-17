import socialCover from '../public/social/plop-marca-20261117-v2.jpg';
import {handleRequest} from './seo-domain.mjs';

export default {
  fetch(request) {
    return handleRequest(request, fetch, socialCover);
  },
};
