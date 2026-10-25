/**
 * @deepcloud/hiker-shims - VirtualModulesPlugin
 * 内置虚拟模块与模块导出修饰拦截插件
 */

const VirtualModulesPlugin = {
  name: 'virtual-modules-plugin',

  virtualModules: {
    'hiker://virtual/localStorage': (context) => {
      const sandbox = context?.sandbox || {};
      return {
        getItem: (k, d) => (typeof sandbox.getItem === 'function' ? sandbox.getItem(k, d !== undefined ? d : '') : (d !== undefined ? d : '')),
        setItem: (k, v) => (typeof sandbox.setItem === 'function' ? sandbox.setItem(k, v) : undefined),
        removeItem: (k) => (typeof sandbox.clearItem === 'function' ? sandbox.clearItem(k) : undefined),
        clear: () => {},
      };
    }
  },

  postExportInterceptors: [
    function repairLocalStorageModule(moduleKey, exported, context) {
      if (typeof moduleKey === 'string' && moduleKey.includes('localStorage')) {
        let repaired = (exported && typeof exported === 'object') ? exported : {};
        const sandbox = context?.sandbox || {};

        if (typeof repaired.getItem !== 'function') {
          repaired.getItem = (k, d) => (typeof sandbox.getItem === 'function' ? sandbox.getItem(k, d !== undefined ? d : '') : (d !== undefined ? d : ''));
        }
        if (typeof repaired.setItem !== 'function') {
          repaired.setItem = (k, v) => (typeof sandbox.setItem === 'function' ? sandbox.setItem(k, v) : undefined);
        }
        if (typeof repaired.removeItem !== 'function') {
          repaired.removeItem = (k) => (typeof sandbox.clearItem === 'function' ? sandbox.clearItem(k) : undefined);
        }
        if (typeof repaired.clear !== 'function') {
          repaired.clear = () => {};
        }
        return repaired;
      }
      return exported;
    }
  ]
};

module.exports = VirtualModulesPlugin;
