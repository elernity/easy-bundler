# easy-bundler

🍔轻便的react-native离线包构建替代方案：

- [x] 完美替代react-native bundle/unbundle命令
- [x] 简化缓存，提升构建速度
- [x] 支持拆包，助力优化加载方案
- [x] unbundle格式业务包，按需加载更快捷
- [x] 低耦合，易拓展，高自由度
- [x] 基于babel 7，拥抱新环境

## 安装

在react-native工程根目录下：

```shell
cnpm install @sdp.nd/easy-bundler
```

## 使用

在react-native工程根目录下：

```shell
./node_modules/.bin/easy-bundler bundle [option]
```

可以通过下述方式获取参数释义：

```shell
./node_modules/.bin/easy-bundler bundle -h
```
