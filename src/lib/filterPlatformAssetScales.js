/**
 * @flow
 */
'use strict';

const ALLOWED_SCALES = {
  ios: [1, 2, 3],
};

function filterPlatformAssetScales(
  platform: string,
  scales: Array<number>,
): Array<number> {
  const whitelist = ALLOWED_SCALES[platform];
  if (!whitelist) {
    return scales;
  }
  const result = scales.filter((scale: number): boolean => whitelist.indexOf(scale) > -1);
  if (result.length === 0 && scales.length > 0) {
    // No matching scale found, but there are some available. Ideally we don't
    // want to be in this situation and should throw, but for now as a fallback
    // let's just use the closest larger image
    const maxScale = whitelist[whitelist.length - 1];
    for (const scale of scales) {
      if (scale > maxScale) {
        result.push(scale);
        break;
      }
    }

    // There is no larger scales available, use the largest we have
    if (result.length === 0) {
      result.push(scales[scales.length - 1]);
    }
  }
  return result;
}

module.exports = filterPlatformAssetScales;
