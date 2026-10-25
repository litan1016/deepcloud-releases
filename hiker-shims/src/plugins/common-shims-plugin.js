/**
 * @deepcloud/hiker-shims - CommonShimsPlugin
 * 通用全局常量与 $ 命名空间扩展插件
 */

const CommonShimsPlugin = {
  name: 'common-shims-plugin',

  globals: {
    PC_UA: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    MOBILE_UA: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  },

  namespaceExtensions: {
    $: {
      movie: ['mp4', 'mkv', 'avi', 'mov', 'rmvb', 'webm', 'flv', 'm4v', 'm3u8', 'ts'],
      audio: ['mp3', 'flac', 'ogg', 'm4a', 'wav', 'opus', 'aac', 'ape'],
      img: ['jpg', 'png', 'jpeg', 'gif', 'svg', 'raw', 'webp'],
      office: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'],
      subtitle: ['srt', 'ass', 'vtt', 'sub', 'smi'],
      text: ['txt', 'md', 'json', 'js', 'css', 'html', 'xml'],
      yasuo: ['zip', 'rar', '7z', 'tar', 'gz'],

      rstrip: (str, char) => {
        if (str === null || str === undefined) return '';
        const s = String(str);
        if (!char) return s.replace(/\s+$/, '');
        const escaped = char.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        return s.replace(new RegExp(`(?:${escaped})+$`, 'g'), '');
      },
      lstrip: (str, char) => {
        if (str === null || str === undefined) return '';
        const s = String(str);
        if (!char) return s.replace(/^\s+/, '');
        const escaped = char.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        return s.replace(new RegExp(`^(?:${escaped})+`, 'g'), '');
      },
      strip: (str, char) => {
        if (str === null || str === undefined) return '';
        const s = String(str);
        if (!char) return s.trim();
        const escaped = char.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        return s.replace(new RegExp(`^(?:${escaped})+|(?:${escaped})+$`, 'g'), '');
      },
      removeExt: (filename) => {
        if (!filename) return '';
        const s = String(filename);
        const lastDot = s.lastIndexOf('.');
        return lastDot > 0 ? s.slice(0, lastDot) : s;
      },
      isOffice: (url) => {
        return /\.(?:doc|docx|docm|dotm|dotx|xlsx|xlsb|xls|xlsm|pptx|ppsx|ppt|pps|pptm|potm|ppam|potx|ppsm|pdf)(?:[?#]|$)/i.test(String(url || ''));
      },
      similar: (s, t, f = 2) => {
        if (!s || !t) return 0;
        if (s === t) return 100;
        const l = Math.max(s.length, t.length);
        const n = s.length;
        const m = t.length;
        const d = [];
        for (let i = 0; i <= n; i++) d[i] = [i];
        for (let j = 0; j <= m; j++) d[0][j] = j;
        for (let i = 1; i <= n; i++) {
          for (let j = 1; j <= m; j++) {
            const cost = s[i - 1] === t[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
          }
        }
        const res = (1 - d[n][m] / l) * 100;
        return Number(res.toFixed(f));
      },
      searchwords: {
        addData: () => {},
        delData: () => {},
        getData: () => [],
        clearData: () => {}
      },
      dataConvert: (data) => data,
    }
  }
};

module.exports = CommonShimsPlugin;
