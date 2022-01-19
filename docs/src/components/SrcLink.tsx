import React from 'react';
import * as CONFIG from '../config';
import './SrcLink.css';

/**
 * Match `file.ext` in a path, or if the file name is `index.ext`,
 * match `dir/index.ext`
 */
const fileRegExp = /([^/]+\/index\.[^/]+$|[^/]+$)/;

export const SrcLink = ({ snippet }: { snippet: string }) => (
  <small className="src-link">
    <a href={`${CONFIG.GITHUB_EDIT_URL}src/pages/${snippet}`}>
      {snippet.match(fileRegExp)[0]}
    </a>
  </small>
);
