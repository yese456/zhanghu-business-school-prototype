/* ============================================================
   共享组件 · 通用工具
   ============================================================ */
(function () {
  'use strict';
  const S = (window.SHARED = window.SHARED || {});

  const leaveGuards=[];
  Object.defineProperty(S,'activeLeaveGuard',{configurable:true,get(){
    if(!leaveGuards.length)return null;
    return {dirty:()=>leaveGuards.some(g=>g.dirty()),checkpoint:()=>{const entries=leaveGuards.map(g=>({guard:g,dirty:!!g.dirty(),value:g.snapshot?g.snapshot():undefined}));return ()=>entries.length===leaveGuards.length&&entries.every((e,i)=>leaveGuards[i]===e.guard&&!!e.guard.dirty()===e.dirty&&(!e.guard.snapshot||e.guard.snapshot()===e.value));},get title(){
      for(let i=leaveGuards.length-1;i>=0;i--)if(leaveGuards[i].dirty())return leaveGuards[i].title;
      return leaveGuards[leaveGuards.length-1]?.title;
    }};
  }});
  S.registerLeaveGuard = (dirty, title, snapshot) => {
    const guard={dirty,title,snapshot};leaveGuards.push(guard);
    return ()=>{const i=leaveGuards.indexOf(guard);if(i!==-1)leaveGuards.splice(i,1);};
  };

  S.money = (v) => {
    if (v === null || v === undefined || v === '' || v === '-') return '-';
    const n = Number(v);
    if (isNaN(n)) return String(v);
    return '¥' + n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  };

  S.num = (v) => {
    const n = Number(v);
    return isNaN(n) ? v : n.toLocaleString('zh-CN');
  };

  /* 状态 → Element Plus tag 类型（中文语义推断） */
  S.tagType = (v) => {
    const s = String(v == null ? '' : v);
    if (/^(是|否)$/.test(s)) return s === '是' ? 'success' : 'info';
    if (/完成|已付|已审核|已通过|成功|已签收|已入库|启用|在职|全部回款|已结算|已发放|已成交|已发货|正常|上线|已上架|通过|已确认|已排产|已收款|已核销/.test(s)) return 'success';
    if (/待|部分|进行中|审核中|排产|生产中|处理中|未开始|草稿|预热|即将|待定|新建/.test(s)) return 'warning';
    if (/驳回|作废|逾期|停用|离职|退款|失败|异常|关闭|下架|超时|拒绝|取消/.test(s)) return 'danger';
    if (/已出库|已下单|待开工|已排期|已发布|已同步/.test(s)) return 'primary';
    return 'info';
  };

  /* 状态 → 圆点颜色（自定义状态条用） */
  S.dotColor = (v) => {
    const t = S.tagType(v);
    return { success: '#52c41a', warning: '#faad14', danger: '#f56c6c', primary: '#4981ff', info: '#c0c4cc' }[t] || '#c0c4cc';
  };

  /* 金额/数字右对齐渲染 */
  S.fmtCell = (v, col) => {
    if (v === null || v === undefined || v === '') return '-';
    if (col && col.money) return S.money(v);
    if (col && col.pct) return (Number(v) * 100).toFixed(1) + '%';
    return String(v);
  };

  /* 简易防抖 */
  S.debounce = (fn, ms) => {
    let t;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms || 260);
    };
  };

  /* 生成稳定伪随机（保证刷新数据一致） */
  S.mulberry32 = (seed) => {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  S.uid = (() => { let i = 0; return (p) => (p || 'id') + '-' + (++i); })();

  /* 深拷贝（配置对象复用，避免跨页面污染） */
  S.clone = (o) => JSON.parse(JSON.stringify(o));

  /* ------------------------------------------------------------
     演示数据仓库（localStorage）
     用途：新增/编辑/删除/状态流转在切换页面、刷新后仍然保留。
     说明：仅存演示数据，不含任何真实业务信息；清空方法见 S.store.clearAll()
     ------------------------------------------------------------ */
  const PREFIX = 'aicard.demo.';
  S.store = {
    get(k) {
      try {
        const raw = localStorage.getItem(PREFIX + k);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    set(k, v) {
      try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); return true; }
      catch (e) {
        const message = '本地保存失败：存储空间不足或不可用，请移除较大附件后重试。';
        if (window.ElementPlus?.ElMessage) window.ElementPlus.ElMessage.error(message);
        throw new Error(message);
      }
    },
    del(k) {
      try { localStorage.removeItem(PREFIX + k); } catch (e) { /* noop */ }
    },
    clearAll() {
      try {
        Object.keys(localStorage).filter((k) => k.indexOf(PREFIX) === 0).forEach((k) => localStorage.removeItem(k));
      } catch (e) { /* noop */ }
    },
    /* 首次运行时打标，便于演示脚本判断是否为「全新会话」 */
    boot() {
      try { if (!localStorage.getItem(PREFIX + 'boot')) localStorage.setItem(PREFIX + 'boot', new Date().toISOString()); } catch (e) { /* noop */ }
    }
  };
  S.store.boot();
})();
