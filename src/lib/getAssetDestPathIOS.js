/**
 * @flow
 */
'use strict';

import type {AssetInfoType} from '../types';

const path = require('path');

function getAssetDestPathIOS(asset: AssetInfoType, scale: number): string {
  const suffix = scale === 1 ? '' : '@' + scale + 'x';
  const fileName = asset.name + suffix + '.' + asset.type;
  return path.join(asset.httpServerLocation.substr(1), fileName);
}

module.exports = getAssetDestPathIOS;
