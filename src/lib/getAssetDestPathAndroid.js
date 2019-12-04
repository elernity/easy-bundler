/**
 * @flow
 */
'use strict';

import type {AssetInfoType} from '../types';

const AssetPathUtil = require('../utils/AssetPathUtil');
const path = require('path');

function getAssetDestPathAndroid(asset: AssetInfoType, scale: number): string {
  const androidFolder = AssetPathUtil.getAndroidDrawableFolderName(asset, scale);
  const fileName =  AssetPathUtil.getAndroidResourceIdentifier(asset);
  return path.join(androidFolder, fileName + '.' + asset.type);
}

module.exports = getAssetDestPathAndroid;
