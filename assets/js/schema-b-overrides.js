/* 线上只读复核：2026-10-19。单独维护采集污染修正，避免重建 schema 时丢失。 */
(function(){
  const p=window.SCHEMA_B['project/index'];
  const names=['订单号','内部单号','C端/业主','订单归属(合作商)','产品数量','订货单金额','已回款金额','交货日期','任务数','采购单数','生产进度','订货单状态','停留时长','回款状态','订货日期','开工日期','截止日期','销售','跟单','副销售'];
  p.cols=names.map(label=>Object.assign({},p.cols.find(c=>c.label===label)||{label,type:'text'},{type:label==='回款状态'?'tag':(p.cols.find(c=>c.label===label)?.type||'text')}));
  p.ops=['复制','编辑','打印','作废'];
})();
