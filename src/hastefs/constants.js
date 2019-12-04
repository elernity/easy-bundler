/**
 * @flow
 */
'use strict';

// 一旦匹配到黑名单中的后缀名，则不进行缩略名(shortName)的获取
const extBlackList: Set<string> = new Set([
    // json模块绝对不可能有缩略名（除了package.json，这一部分我们在另一个条件分支中处理了）
    '.json',
    // 图片
    '.bmp','.gif','.ico','.jpeg','.jpg','.png','.svg','.tiff','.tif','.webp',
    // 视频
    '.avi','.mp4','.mpeg','.mpg','.ogv','.webm','.3gp','.3g2',
    // 音频
    '.aac','.midi','.mid','.mp3','.oga','.wav','.3gp','.3g2',
    // 字体
    '.eot','.otf','.ttf','.woff','.woff2',
  ]);

const constValue = {
    /**
     * 对于可缩略的模块，我们定义如下数据结构：
     *  ModuleDataMap: Map<缩略名， Map<平台， Array<模块绝对路径， 模块类型>>>，
     * 以下是对应的字段值或索引：
     */
    PATH: 0,
    TYPE: 1,
    MODULE: 'type-module',
    PACKAGE: 'type-package',
    GENERIC: 'platform-generic',
    NATIVE: 'platform-native',

    /**
     * 支持的平台 用于判断提取到的平台后缀是否有效
     */
    SUPPORTED_PLATFORM_EXTS: ['android', 'ios', 'native', 'web'],
};

module.exports = {
    extBlackList: extBlackList,
    constValue: constValue,
};
