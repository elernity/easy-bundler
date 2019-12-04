/**
 * @flow
 */
'use strict';

class Module {
  modulePath: string; // 绝对路径
  moduleId: ?string;
  code: ?string;
  buffer: ?Buffer;
  constructor(filePath: string) {
    this.modulePath = filePath;
  }

  invalidate() {}
}

module.exports = Module;
