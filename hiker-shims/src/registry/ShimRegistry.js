/**
 * @deepcloud/hiker-shims - ShimRegistry
 * 零侵入增量垫片与插件注册中心
 * 
 * 遵循开闭原则 (Open-Closed Principle)：
 * 沙箱作为调度微内核长期封版，所有生态扩展、全局常量、命名空间方法、
 * 模块入参自愈管道、虚拟模块与导出修饰器均通过插件声明注册。
 */

class ShimRegistry {
  constructor() {
    this.plugins = new Map();
    this.globals = {};
    this.namespaceExtensions = {};
    this.paramPipes = [];
    this.virtualModules = new Map();
    this.postExportInterceptors = [];
  }

  /**
   * 注册生态插件
   * @param {Object} plugin
   * @param {string} plugin.name 插件唯一标识
   * @param {Object} [plugin.globals] 全局常量池 (例: { PC_UA, MOBILE_UA })
   * @param {Object} [plugin.namespaceExtensions] 命名空间扩展 (例: { $: { movie, rstrip } })
   * @param {Array<Function>} [plugin.paramPipes] 入参链式自愈管道中间件
   * @param {Object<string, Function>} [plugin.virtualModules] 虚拟模块工厂字典
   * @param {Array<Function>} [plugin.postExportInterceptors] 导出物后置修饰拦截器
   */
  register(plugin) {
    if (!plugin || typeof plugin !== 'object' || !plugin.name) {
      throw new Error('[ShimRegistry] 插件必须具备有效的 name 属性');
    }
    if (this.plugins.has(plugin.name)) {
      return this; // 避免重复注册
    }
    this.plugins.set(plugin.name, plugin);

    // 1. 聚合全局常量
    if (plugin.globals && typeof plugin.globals === 'object') {
      Object.assign(this.globals, plugin.globals);
    }

    // 2. 聚合命名空间扩展
    if (plugin.namespaceExtensions && typeof plugin.namespaceExtensions === 'object') {
      for (const [ns, extObj] of Object.entries(plugin.namespaceExtensions)) {
        this.namespaceExtensions[ns] = Object.assign(this.namespaceExtensions[ns] || {}, extObj);
      }
    }

    // 3. 聚合入参自愈管道
    if (Array.isArray(plugin.paramPipes)) {
      for (const pipe of plugin.paramPipes) {
        if (typeof pipe === 'function') {
          this.paramPipes.push(pipe);
        }
      }
    }

    // 4. 聚合虚拟模块
    if (plugin.virtualModules && typeof plugin.virtualModules === 'object') {
      for (const [url, factory] of Object.entries(plugin.virtualModules)) {
        if (typeof factory === 'function') {
          this.virtualModules.set(url, factory);
        }
      }
    }

    // 5. 聚合导出物后置拦截器
    if (Array.isArray(plugin.postExportInterceptors)) {
      for (const interceptor of plugin.postExportInterceptors) {
        if (typeof interceptor === 'function') {
          this.postExportInterceptors.push(interceptor);
        }
      }
    }

    return this;
  }

  /**
   * 将全局常量高效注入目标沙箱（享受 V8 Inline Cache）
   * @param {Object} targetSandbox
   */
  applyGlobals(targetSandbox) {
    if (!targetSandbox || typeof targetSandbox !== 'object') return targetSandbox;
    Object.assign(targetSandbox, this.globals);
    if (targetSandbox.global && typeof targetSandbox.global === 'object') {
      Object.assign(targetSandbox.global, this.globals);
    }
    return targetSandbox;
  }

  /**
   * 将各命名空间静态扩展方法挂载到目标沙箱
   * @param {Object} targetSandbox
   */
  applyNamespaceExtensions(targetSandbox) {
    if (!targetSandbox || typeof targetSandbox !== 'object') return targetSandbox;
    for (const [ns, extObj] of Object.entries(this.namespaceExtensions)) {
      if (!targetSandbox[ns]) {
        targetSandbox[ns] = {};
      }
      if (typeof targetSandbox[ns] === 'function' || typeof targetSandbox[ns] === 'object') {
        Object.assign(targetSandbox[ns], extObj);
      }
      if (targetSandbox.global && targetSandbox.global[ns]) {
        Object.assign(targetSandbox.global[ns], extObj);
      }
    }
    return targetSandbox;
  }

  /**
   * 运行入参链式自愈管道
   * @param {Object} context
   * @param {Object} context.importParam
   * @param {Object} context.sandbox
   * @param {string} context.moduleUrl
   * @returns {Object} 规范化后的安全入参
   */
  runParamPipeline(context) {
    if (!context || typeof context !== 'object') return {};
    let currentParam = context.importParam;
    if (currentParam === null || currentParam === undefined) {
      currentParam = {};
    }

    // 流经已注册的所有自愈中间件
    for (const pipe of this.paramPipes) {
      try {
        const res = pipe({
          importParam: currentParam,
          sandbox: context.sandbox,
          moduleUrl: context.moduleUrl,
        });
        if (res && typeof res === 'object') {
          currentParam = res;
        }
      } catch (err) {
        console.warn(`[ShimRegistry] ParamPipe execution warning for ${context.moduleUrl}:`, err.message);
      }
    }

    // 局部边界安全防护代理：只保护当前入参对象，防止未传递字段的解构导致后续 .includes() / .split() 报错
    return createSafeParamBoundaryProxy(currentParam);
  }

  /**
   * 探测并加载虚拟模块
   * @param {string} moduleUrl
   * @param {Object} context
   * @returns {any|null}
   */
  getVirtualModule(moduleUrl, context) {
    if (typeof moduleUrl !== 'string') return null;
    for (const [pattern, factory] of this.virtualModules.entries()) {
      if (moduleUrl === pattern || (pattern instanceof RegExp && pattern.test(moduleUrl)) || moduleUrl.includes(pattern)) {
        try {
          return factory(context);
        } catch (err) {
          console.warn(`[ShimRegistry] VirtualModule factory error for ${moduleUrl}:`, err.message);
          return null;
        }
      }
    }
    return null;
  }

  /**
   * 对模块导出物应用后置拦截器（例如修饰老旧生态模块的缺失方法）
   * @param {string} moduleKey
   * @param {any} exported
   * @param {Object} context
   * @returns {any}
   */
  applyPostExportInterceptors(moduleKey, exported, context) {
    let result = exported;
    for (const interceptor of this.postExportInterceptors) {
      try {
        result = interceptor(moduleKey, result, context);
      } catch (err) {
        console.warn(`[ShimRegistry] PostExportInterceptor error for ${moduleKey}:`, err.message);
      }
    }
    return result;
  }
}

/**
 * 局部边界安全代理：仅作用于 $.importParam 单体对象
 * 规避全局 Proxy 带来的性能雪崩，同时为未定义属性提供安全兜底，根除 Cannot read properties of undefined
 */
function createSafeParamBoundaryProxy(rawParam) {
  if (typeof rawParam !== 'object' || rawParam === null) {
    return rawParam;
  }

  return new Proxy(rawParam, {
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      }
      // 常见在规则解构中容易被不加判断直接调用 .includes / .split / .replace 的字段
      if (prop === 'url' || prop === 'title' || prop === 'class_name' || prop === 'filter' || prop === 'rule') {
        return '';
      }
      return undefined;
    }
  });
}

// 全局注册中心单例
const defaultRegistry = new ShimRegistry();

module.exports = {
  ShimRegistry,
  defaultRegistry,
  createSafeParamBoundaryProxy,
};
