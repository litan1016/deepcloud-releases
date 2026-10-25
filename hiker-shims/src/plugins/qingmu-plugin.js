/**
 * @deepcloud/hiker-shims - QingmuPlugin
 * 青木模板系（阅动漫、漫画大全、聚阅等）特化自愈插件
 */

function normalizeQingmuParams({ importParam, sandbox, moduleUrl }) {
  if (typeof importParam !== 'object' || importParam === null) {
    return importParam;
  }

  // 1) QING_TITLE 补齐
  if (!importParam.QING_TITLE) {
    importParam.QING_TITLE = importParam.rule
      || sandbox.QING_TITLE
      || (sandbox.MY_RULE && sandbox.MY_RULE.title)
      || (typeof sandbox.getMyVar === 'function' ? sandbox.getMyVar('myCollection') : '')
      || '';
  }

  // 2) MY_RULE 补齐
  if (!importParam.MY_RULE) {
    importParam.MY_RULE = sandbox.MY_RULE || {};
  }

  // 3) isIndex 补齐
  if (importParam.isIndex === undefined) {
    importParam.isIndex = sandbox.isIndex !== undefined ? sandbox.isIndex : false;
  }

  // 4) url 补齐：防止 ClassTab 等模块解构 url 后直接调 url.includes('fyAll') 报 Cannot read properties of undefined
  if (importParam.url === undefined || importParam.url === null) {
    importParam.url = importParam.MY_RULE?.url
      || (sandbox.MY_RULE && sandbox.MY_RULE.url)
      || sandbox.MY_URL
      || sandbox.url
      || '';
  }

  // 5) title 补齐
  if (importParam.title === undefined || importParam.title === null) {
    importParam.title = importParam.MY_RULE?.title
      || (sandbox.MY_RULE && sandbox.MY_RULE.title)
      || importParam.QING_TITLE
      || '';
  }

  return importParam;
}

function generateModuleGuardHeader(source) {
  if (typeof source !== 'string') return '';
  let header = '';

  if (source.includes('importParam')) {
    header += `;(function(){
  if (typeof $ !== "undefined") {
    if (!$.importParam || typeof $.importParam !== "object") {
      try { $.importParam = (typeof importParam === "object" && importParam) ? importParam : {}; } catch(_) { $.importParam = {}; }
    }
    if (typeof $.importParam === "object") {
      if ($.importParam.url === undefined || $.importParam.url === null) {
        $.importParam.url = (typeof MY_RULE !== "undefined" && MY_RULE && MY_RULE.url) ? MY_RULE.url : ((typeof MY_URL !== "undefined" && MY_URL) ? MY_URL : "");
      }
      if ($.importParam.title === undefined || $.importParam.title === null) {
        $.importParam.title = (typeof MY_RULE !== "undefined" && MY_RULE && MY_RULE.title) ? MY_RULE.title : "";
      }
    }
  }
  if (typeof importParam === "undefined" || !importParam) {
    try { var importParam = (typeof $ !== "undefined" && $.importParam) ? $.importParam : {}; } catch(_) {}
  } else if (typeof importParam === "object") {
    if (importParam.url === undefined || importParam.url === null) {
      importParam.url = (typeof MY_RULE !== "undefined" && MY_RULE && MY_RULE.url) ? MY_RULE.url : ((typeof MY_URL !== "undefined" && MY_URL) ? MY_URL : "");
    }
    if (importParam.title === undefined || importParam.title === null) {
      importParam.title = (typeof MY_RULE !== "undefined" && MY_RULE && MY_RULE.title) ? MY_RULE.title : "";
    }
  }
})();
`;
  }

  // 青木模板 hijackEnv 模块防护：
  // 当 dataLoad 找不到目标规则使得 oriRULE 为 undefined 时，防止 RULE = oriRULE 后读取 RULE.url 抛出 TypeError
  if (source.includes('oriRULE') && (source.includes('RULE = oriRULE') || source.includes('RULE=oriRULE') || source.includes('base64Decode'))) {
    header += `;(function(){
  try {
    if (typeof globalThis !== 'undefined' && !globalThis.__HK_QINGMU_RULE_BACKUP__) {
      var _rawRule = (typeof MY_PARAMS !== 'undefined' && MY_PARAMS && MY_PARAMS.RULE) ? MY_PARAMS.RULE : "";
      if (_rawRule && typeof base64Decode === 'function') {
        try { globalThis.__HK_QINGMU_RULE_BACKUP__ = JSON.parse(base64Decode(_rawRule)); } catch(_) {}
      }
    }
  } catch(_) {}
})();
`;
  }

  return header;
}

function sanitizeHikerDotJsSyntax(source) {
  if (typeof source !== 'string' || !source.includes('.js:')) return source;

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let inRegex = false;
  let escape = false;

  let result = '';
  const len = source.length;

  for (let i = 0; i < len; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (escape) {
      escape = false;
      result += ch;
      continue;
    }

    if (ch === '\\' && (inSingle || inDouble || inTemplate || inRegex)) {
      escape = true;
      result += ch;
      continue;
    }

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      result += ch;
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        result += '*/';
        i++;
        continue;
      }
      result += ch;
      continue;
    }

    if (inSingle) {
      if (ch === "'") inSingle = false;
      result += ch;
      continue;
    }

    if (inDouble) {
      if (ch === '"') inDouble = false;
      result += ch;
      continue;
    }

    if (inTemplate) {
      if (ch === '`') inTemplate = false;
      result += ch;
      continue;
    }

    if (inRegex) {
      if (ch === '/') inRegex = false;
      result += ch;
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      result += '//';
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      result += '/*';
      i++;
      continue;
    }

    if (ch === "'") { inSingle = true; result += ch; continue; }
    if (ch === '"') { inDouble = true; result += ch; continue; }
    if (ch === '`') { inTemplate = true; result += ch; continue; }

    // 检测不在引号、注释内部的 .js:
    if (ch === '.' && source.slice(i, i + 4) === '.js:') {
      // 检查左侧是否有前置表达式
      let leftEnd = result.length - 1;
      while (leftEnd >= 0 && /\s/.test(result[leftEnd])) leftEnd--;

      if (leftEnd >= 0 && /[a-zA-Z0-9_$)\]'"`]/.test(result[leftEnd])) {
        // 向前回溯找到表达式起点
        let parenDepth = 0;
        let bracketDepth = 0;
        let braceDepth = 0;
        let start = leftEnd;

        while (start >= 0) {
          const c = result[start];
          if (c === ')') parenDepth++;
          else if (c === '(') {
            if (parenDepth > 0) parenDepth--;
            else break;
          } else if (c === ']') bracketDepth++;
          else if (c === '[') {
            if (bracketDepth > 0) bracketDepth--;
            else break;
          } else if (c === '}') braceDepth++;
          else if (c === '{') {
            if (braceDepth > 0) braceDepth--;
            else break;
          } else if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
            if (c === ',' || c === ';' || c === '=' || c === ':' || c === '\n' || c === '\r' || c === '?' || c === '&' || c === '|') {
              start++;
              break;
            }
            if (start >= 6 && /\breturn\s$/.test(result.slice(start - 7, start))) {
              break;
            }
          }
          start--;
        }
        if (start < 0) start = 0;
        while (start < leftEnd && /\s/.test(result[start])) start++;

        const expr = result.slice(start, leftEnd + 1).trim();

        // 向后寻找代码块 code 终点
        let codeStart = i + 4;
        while (codeStart < len && /\s/.test(source[codeStart])) codeStart++;

        let codeEnd = codeStart;
        let cParen = 0;
        let cBracket = 0;
        let cBrace = 0;
        let cSingle = false;
        let cDouble = false;
        let cTemplate = false;
        let cEscape = false;

        let isObjectProp = false;
        if (start > 0) {
          let prevCharIdx = start - 1;
          while (prevCharIdx >= 0 && /\s/.test(result[prevCharIdx])) prevCharIdx--;
          if (prevCharIdx >= 0 && result[prevCharIdx] === ':') {
            isObjectProp = true;
          }
        }

        while (codeEnd < len) {
          const cc = source[codeEnd];

          if (cEscape) {
            cEscape = false;
            codeEnd++;
            continue;
          }
          if (cc === '\\') {
            cEscape = true;
            codeEnd++;
            continue;
          }
          if (cSingle) {
            if (cc === "'") cSingle = false;
            codeEnd++;
            continue;
          }
          if (cDouble) {
            if (cc === '"') cDouble = false;
            codeEnd++;
            continue;
          }
          if (cTemplate) {
            if (cc === '`') cTemplate = false;
            codeEnd++;
            continue;
          }

          if (cc === "'") { cSingle = true; codeEnd++; continue; }
          if (cc === '"') { cDouble = true; codeEnd++; continue; }
          if (cc === '`') { cTemplate = true; codeEnd++; continue; }

          if (cc === '(') cParen++;
          else if (cc === ')') {
            if (cParen > 0) cParen--;
            else break;
          } else if (cc === '[') cBracket++;
          else if (cc === ']') {
            if (cBracket > 0) cBracket--;
            else break;
          } else if (cc === '{') cBrace++;
          else if (cc === '}') {
            if (cBrace > 0) cBrace--;
            else break;
          } else if (cParen === 0 && cBracket === 0 && cBrace === 0) {
            if (isObjectProp) {
              if (cc === ',' || cc === '\n' || cc === '\r') break;
            } else {
              if (cc === ';' || cc === ',' || cc === '\n' || cc === '\r') break;
            }
          }
          codeEnd++;
        }

        const code = source.slice(codeStart, codeEnd).trim();
        const hasStatements = code.includes(';') || /^(?:var|let|const|return|if|for|while)\b/.test(code);
        const replacement = hasStatements
          ? `((input) => { ${code} })(${expr})`
          : `((input) => (${code}))(${expr})`;

        result = result.slice(0, start) + replacement;
        i = codeEnd - 1;
        continue;
      }
    }

    result += ch;
  }

  return result;
}

function transformModuleSource(source) {
  if (typeof source !== 'string') return source;
  let res = sanitizeHikerDotJsSyntax(source);
  if (res.includes('oriRULE')) {
    if (res.includes('RULE = oriRULE') || res.includes('RULE=oriRULE')) {
      res = res.replace(/\bRULE\s*=\s*oriRULE\b(?!\s*\|\|)/g, 'RULE = (oriRULE || RULE || (typeof globalThis !== "undefined" && globalThis.__HK_QINGMU_RULE_BACKUP__) || {})');
    }
    // 当 dataLoad 找不到目标项导致 find(...) 返回 undefined 时，安全补齐 oriRULE 兜底对象
    res = res.replace(/\b(var\s+oriRULE\s*=[^;\r\n]+;?)/g, '$1\nif (typeof oriRULE === "undefined" || !oriRULE) { oriRULE = (typeof RULE !== "undefined" && RULE) ? RULE : {}; }');
    // 安全属性访问兜底：保护 oriRULE.pages, oriRULE.last_chapter_rule, oriRULE.preRule 等
    res = res.replace(/\boriRULE\.([a-zA-Z0-9_$]+)\b/g, '(oriRULE ? oriRULE.$1 : undefined)');
  }
  if (res.includes('setLastChapterRule')) {
    res = res.replace(/(\bsetLastChapterRule\s*=\s*function\s*\(\s*([a-zA-Z0-9_$]+)\s*\)\s*\{)/g, '$1\n    $2 = String($2 || "");');
  }
  if (res.includes('MY_RULE.find_rule.startsWith')) {
    res = res.replace(/\bMY_RULE\.find_rule\.startsWith\b/g, 'String(MY_RULE.find_rule || "").startsWith');
  }
  if (res.includes('MY_RULE.find_rule = RULE.detail_find_rule')) {
    res = res.replace(/MY_RULE\.find_rule\s*=\s*RULE\.detail_find_rule/g, 'MY_RULE.find_rule = RULE.detail_find_rule || RULE.find_rule || ""');
  }
  if (res.includes('MY_PARAMS') && res.includes('RULE')) {
    res = res.replace(/\b(var\s*\{[^}]*RULE[^}]*\}\s*=\s*MY_PARAMS)/g, 'var MY_PARAMS = (typeof globalThis !== "undefined" && globalThis.MY_PARAMS && typeof globalThis.MY_PARAMS === "object") ? globalThis.MY_PARAMS : ((typeof MY_PARAMS !== "undefined" && MY_PARAMS) ? MY_PARAMS : {});\n$1');
  }
  if (res.includes('MY_RULE.url = MY_PARAMS.url')) {
    res = res.replace(/\bMY_RULE\.url\s*=\s*MY_PARAMS\.url/g, 'MY_RULE.url = MY_PARAMS.url; try { MY_URL = MY_PARAMS.url; } catch(_) {}');
  }
  if (res.includes('Array.prototype.push.apply(myColl_el, param0.map(hijackEl))')) {
    res = res.replace(/Array\.prototype\.push\.apply\(myColl_el,\s*param0\.map\(hijackEl\)\)/g, `
        if (Array.isArray(param0) && param0.length <= 1 && typeof html === 'string' && html && html.includes('initIntroData')) {
            try {
                var mIntro = html.match(/initIntroData\\s*\\(\\s*(\\[[\\s\\S]*?\\])\\s*\\)/);
                if (mIntro) {
                    var parsedGroups = JSON.parse(mIntro[1]);
                    var chapters = (parsedGroups[0] && parsedGroups[0].data) || [];
                    var lazyCode = (typeof lazy !== 'undefined' && lazy) ? lazy : '';
                    chapters.slice().reverse().forEach(function(ch) {
                        param0.push({
                            title: ch.chapter_name || ch.title || '',
                            url: (ch.h || '') + lazyCode,
                            col_type: "text_2"
                        });
                    });
                    if (param0[0]) {
                        if (!param0[0].title || param0[0].title.trim() === '') {
                            param0[0].title = (typeof pageTitle !== 'undefined' && pageTitle) || (typeof pdfh === 'function' && pdfh(html, 'title&&Text') ? pdfh(html, 'title&&Text').replace(/《|》|漫画.*$/g, '').trim() : '') || (typeof MY_PARAMS !== 'undefined' && MY_PARAMS && MY_PARAMS.pageTitle) || (MY_RULE && MY_RULE.title) || '';
                        }
                        if (!param0[0].img || param0[0].img === '' || param0[0].img.includes('no.jpg')) {
                            param0[0].img = (typeof pd === 'function' ? (pd(html, '.img_001&&img&&src') || pd(html, '.info_cover&&img&&src')) : '') || (typeof MY_PARAMS !== 'undefined' && MY_PARAMS && MY_PARAMS.item && MY_PARAMS.item.img) || '';
                        }
                        if (!param0[0].desc || param0[0].desc.trim() === '') {
                            param0[0].desc = chapters.length > 0 ? ('更新至: ' + chapters[0].chapter_name) : '';
                        }
                    }
                }
            } catch(_) {}
        }
        Array.prototype.push.apply(myColl_el, param0.map(hijackEl))`);
  }
  return res;
}

/**
 * 安全声明语句规范化器：
 * 将 JS 源码中的顶层/块级 const/let 变量声明平滑转为 var，
 * 避免在沙箱复用上下文（eval / vm / Function）中发生 "Identifier 'X' has already been declared" 冲突。
 *
 * 核心安全特性：
 * 1. 完整状态机扫描，精准跳过单引号 '...'、双引号 "..."、模板字符串 `...`；
 * 2. 精准跳过单行注释 //...、块级注释 /*...* / 以及正则表达式字面量 /.../；
 * 3. 严格匹配声明边界（左侧为非标识符字符/符号，右侧为至少一个空白字符并紧跟合法标识符首字符或解构符 [ / {）；
 * 4. 严禁破坏字符串字面量（如目标站返回 HTML 结构匹配 h.indexOf('const VOD')）。
 */
function safeNormalizeDeclarations(source) {
  if (typeof source !== 'string' || (!source.includes('const') && !source.includes('let'))) {
    return source;
  }
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let inRegex = false;
  let escape = false;

  let result = '';
  const len = source.length;

  for (let i = 0; i < len; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (escape) {
      escape = false;
      result += ch;
      continue;
    }

    if (ch === '\\' && (inSingle || inDouble || inTemplate || inRegex)) {
      escape = true;
      result += ch;
      continue;
    }

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      result += ch;
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        result += '*/';
        i++;
        continue;
      }
      result += ch;
      continue;
    }

    if (inSingle) {
      if (ch === "'") inSingle = false;
      result += ch;
      continue;
    }

    if (inDouble) {
      if (ch === '"') inDouble = false;
      result += ch;
      continue;
    }

    if (inTemplate) {
      if (ch === '`') inTemplate = false;
      result += ch;
      continue;
    }

    if (inRegex) {
      if (ch === '/') inRegex = false;
      result += ch;
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      result += '//';
      i++;
      continue;
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true;
      result += '/*';
      i++;
      continue;
    }

    if (ch === "'") { inSingle = true; result += ch; continue; }
    if (ch === '"') { inDouble = true; result += ch; continue; }
    if (ch === '`') { inTemplate = true; result += ch; continue; }

    if (ch === '/') {
      let prevIdx = result.length - 1;
      while (prevIdx >= 0 && /\s/.test(result[prevIdx])) prevIdx--;
      const prevCh = prevIdx >= 0 ? result[prevIdx] : '';
      if (prevIdx < 0 || /[=(:,;&|!?+*%-~^{}\[\]]/.test(prevCh) || (prevIdx >= 5 && /\breturn$/.test(result.slice(0, prevIdx + 1).trim()))) {
        inRegex = true;
        result += ch;
        continue;
      }
    }

    const prevChar = i > 0 ? source[i - 1] : ' ';
    const isBoundaryBefore = !/[a-zA-Z0-9_$.]/.test(prevChar);
    if (isBoundaryBefore) {
      if (source.startsWith('const', i)) {
        const afterConst = source.slice(i + 5);
        const match = afterConst.match(/^(\s+)([$_a-zA-Z{\[])/);
        if (match) {
          result += 'var' + match[1];
          i += 5 + match[1].length - 1;
          continue;
        }
      } else if (source.startsWith('let', i)) {
        const afterLet = source.slice(i + 3);
        const match = afterLet.match(/^(\s+)([$_a-zA-Z{\[])/);
        if (match) {
          result += 'var' + match[1];
          i += 3 + match[1].length - 1;
          continue;
        }
      }
    }
    result += ch;
  }
  return result;
}

const QingmuPlugin = {
  name: 'qingmu-plugin',

  paramPipes: [
    normalizeQingmuParams,
  ],

  generateModuleGuardHeader,
  transformModuleSource,
  sanitizeHikerDotJsSyntax,
  safeNormalizeDeclarations,
};

module.exports = QingmuPlugin;
