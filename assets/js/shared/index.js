/* ============================================================
   共享组件注册入口
   用法：SHARED.register(app)
   ============================================================ */
(function () {
  'use strict';
  const S = (window.SHARED = window.SHARED || {});
  S.register = function (app) {
    ['SideNav', 'FilterBar', 'StatusTabs', 'DataTable', 'FormDialog', 'ListPage',
      'TipsBar', 'FormPage', 'StatCards', 'FeaturePage', 'LocalUpload', 'RichEditor'].forEach(function (n) {
      if (S[n]) app.component(S[n].name || n, S[n]);
    });
  };
  S.version = '1.1.0';
})();
