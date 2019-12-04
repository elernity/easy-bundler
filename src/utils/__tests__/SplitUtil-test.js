'use strict';

const SplitUtil = require('../SplitUtil');

describe('拆包辅助工具测试', () => {
    it('基础包判别测试', () => {
        expect(SplitUtil.isBaseModule('node_modules/react-native/Libraries/Inspector/BoxInspector.js')).toBeTruthy();
        expect(SplitUtil.isBaseModule('node_modules/@sdp.nd/nd-react-wrapper/NdConstants.js')).toBeTruthy();
        expect(SplitUtil.isBaseModule('/tmp/node_modules/@sdp.nd/nd-react-wrapper/NdConstants.js')).toBeFalsy();
    });
});
