/**
 * @deepcloud/hiker-shims - ecosystem-shims
 * 海阔视界规则生态（青木/道长/聚阅/网盘）高频常量与自愈垫片
 * 架构升级：采用微内核与插件化注册调度体系，支持声明式增量扩展与 V8 编译字节码二级缓存
 */

const { ShimRegistry, defaultRegistry, createSafeParamBoundaryProxy } = require('./registry/ShimRegistry');
const { ScriptCachePool, defaultScriptCachePool } = require('./cache/ScriptCachePool');

const CommonShimsPlugin = require('./plugins/common-shims-plugin');
const QingmuPlugin = require('./plugins/qingmu-plugin');
const VirtualModulesPlugin = require('./plugins/virtual-modules-plugin');

// 默认装载核心插件
defaultRegistry.register(CommonShimsPlugin);
defaultRegistry.register(QingmuPlugin);
defaultRegistry.register(VirtualModulesPlugin);

// 向后兼容历史直接解构引用的常量与方法
const ECOSYSTEM_GLOBALS = defaultRegistry.globals;
const ECOSYSTEM_DOLLAR_EXTENSIONS = defaultRegistry.namespaceExtensions.$ || {};

/**
 * 模块入参自愈规范化管线（向后兼容接口，内部无缝走多插件 Pipeline）
 */
function normalizeModuleImportParam(currentImportParam, coreSandbox, moduleUrl = '') {
  return defaultRegistry.runParamPipeline({
    importParam: currentImportParam,
    sandbox: coreSandbox,
    moduleUrl: moduleUrl,
  });
}

/**
 * 模块执行头部动态自愈守卫代码生成器（委托给 QingmuPlugin）
 */
function generateModuleGuardHeader(source) {
  return QingmuPlugin.generateModuleGuardHeader(source);
}

function transformModuleSource(source) {
  return QingmuPlugin.transformModuleSource ? QingmuPlugin.transformModuleSource(source) : source;
}

function sanitizeHikerDotJsSyntax(source) {
  return QingmuPlugin.sanitizeHikerDotJsSyntax ? QingmuPlugin.sanitizeHikerDotJsSyntax(source) : source;
}

function safeNormalizeDeclarations(source) {
  return QingmuPlugin.safeNormalizeDeclarations ? QingmuPlugin.safeNormalizeDeclarations(source) : source;
}

module.exports = {
  // 核心微内核注册表与缓存池
  ShimRegistry,
  defaultRegistry,
  ScriptCachePool,
  defaultScriptCachePool,
  createSafeParamBoundaryProxy,

  // 内置核心插件导出
  CommonShimsPlugin,
  QingmuPlugin,
  VirtualModulesPlugin,

  // 向后兼容接口
  ECOSYSTEM_GLOBALS,
  ECOSYSTEM_DOLLAR_EXTENSIONS,
  normalizeModuleImportParam,
  generateModuleGuardHeader,
  transformModuleSource,
  sanitizeHikerDotJsSyntax,
  safeNormalizeDeclarations,
};
