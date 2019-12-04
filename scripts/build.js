'use strict';

const fse = require('fs-extra');
const path = require('path');
const glob = require('glob');
const babel = require('babel-core');

const srcDir = path.join(__dirname, '..', 'src');
const buildDir = path.join(__dirname, '..', 'build');

function skip(filePath) {
    return !new RegExp(/.*\.js/).test(filePath)
    || new RegExp(/.*\/lib\/polyfill\/.*/).test(filePath)
    || new RegExp(/.*\/lib\/replacement\/.*/).test(filePath)
    || (require.resolve('../src/index.js') === filePath);
}

function ignore(filePath) {
    return new RegExp(/.*\/__files__\/.*/).test(filePath)
    || new RegExp(/.*\/__mocks__\/.*/).test(filePath)
    || new RegExp(/.*\/__tests__\/.*/).test(filePath);
}

function buildFile(filePath) {
    if (ignore(filePath)) {
        return;
    }
    const relativePath = path.relative(srcDir, filePath);
    const buildFilePath = path.resolve(buildDir, relativePath);
    fse.ensureDirSync(path.dirname(buildFilePath));

    if (skip(filePath)) {
        fse.copySync(filePath, buildFilePath);
    } else {
        const transformedCode = babel.transformFileSync(filePath).code;
        fse.writeFileSync(buildFilePath, transformedCode);
    }
}

function build() {
    console.log('[执行脚本] build.js 开始.');
    const pattern = path.join(srcDir, '**/*');
    const files = glob.sync(pattern, {
        nodir: true
    });
    files.forEach(buildFile);
    console.log('[执行脚本] build.js 结束.');
}

build();
