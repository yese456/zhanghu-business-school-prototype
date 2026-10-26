/* 打印中心本机只读投影；不声明原站数据接口或打印状态。 */
(function () {
  'use strict';
  const S = window.SHARED;
  const valid = v => typeof v === 'string' && v.trim().length > 0;
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const scalar = v => typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)) ? v : null;
  const sources = {
    'sales-contract': ['orders'], delivery: ['deliveryDocuments'],
    'production-instruction': ['tasks'], 'carton-label': ['tasks'],
    'material-label': ['purchases', '物料采购'], 'outsourcing-label': ['purchases', '委外加工'],
    'finished-purchase': ['purchases', '成品采购'], 'material-purchase': ['purchases', '物料采购'],
    'outsourcing-document': ['purchases', '委外加工']
  };
  S.printCenterRows = categoryId => {
    const rows = [], diagnostics = [];
    const diagnostic = (code, sourceKind, sourceId, details) => diagnostics.push({code, sourceKind, sourceId: scalar(sourceId), details});
    const category = window.ERP_PRINT_SCHEMA?.categories.find(c => c.id === categoryId);
    if (!category || !Object.prototype.hasOwnProperty.call(sources, categoryId)) {
      diagnostic('unknown-category', null, null, '打印分类不存在'); return {rows, diagnostics};
    }
    const [kind, type] = sources[categoryId];
    const all = S.db.all(kind), orders = S.db.all('orders');
    if (!Array.isArray(all) || !Array.isArray(orders)) {
      diagnostic('invalid-collection', kind, null, '实体集合格式异常'); return {rows, diagnostics};
    }
    if (categoryId === 'carton-label') diagnostic('local-source-scope', kind, null, '本机仅tasks来源，不代表原站库存标签全覆盖');
    const counts = new Map();
    all.forEach(r => {if (object(r) && valid(r.id)) counts.set(r.id, (counts.get(r.id) || 0) + 1);});
    const orderLink = r => {
      let matches;
      if (r.orderId !== undefined && r.orderId !== null && r.orderId !== '') {
        if (!valid(r.orderId)) {diagnostic('invalid-order-id', kind, r.id, '来源订单ID格式异常'); return null;}
        matches = orders.filter(o => object(o) && o.id === r.orderId);
        if (matches.length !== 1 || !valid(matches[0].no) || !valid(r.orderNo) || r.orderNo !== matches[0].no) {
          diagnostic('order-pair-mismatch', kind, r.id, '订单ID须唯一且订单号exact一致'); return null;
        }
      } else {
        matches = valid(r.orderNo) ? orders.filter(o => object(o) && o.no === r.orderNo) : [];
      }
      const o = matches.length === 1 ? matches[0] : null;
      if (!o || !valid(o.id) || orders.filter(x => object(x) && x.id === o.id).length !== 1 || !valid(o.no) || orders.filter(x => object(x) && x.no === o.no).length !== 1) {
        diagnostic('order-source-unverified', kind, r.id, '订单来源缺失或身份不唯一'); return null;
      }
      return o;
    };
    all.forEach(r => {
      if (!object(r) || !valid(r.id) || counts.get(r.id) !== 1) {
        diagnostic('source-id-invalid-or-duplicate', kind, object(r) ? r.id : null, '实体ID须非空string且在集合唯一'); return;
      }
      if (kind === 'purchases' && !['成品采购', '物料采购', '委外加工'].includes(r.type)) {
        diagnostic('purchase-type-unverified', kind, r.id, '未核实采购type，未归类：' + String(r.type)); return;
      }
      if (type && r.type !== type) return;
      const o = kind === 'orders' ? r : kind === 'deliveryDocuments' ? null : orderLink(r);
      if (kind === 'orders' && (!valid(r.no) || all.filter(x => object(x) && x.no === r.no).length !== 1)) {
        diagnostic('order-number-unverified', kind, r.id, '订单号缺失或不唯一'); return;
      }
      if (kind === 'deliveryDocuments' && (!valid(r.no) || all.filter(x => object(x) && x.no === r.no).length !== 1)) {
        diagnostic('delivery-number-unverified', kind, r.id, '交货单号缺失或不唯一'); return;
      }
      const values = Object.fromEntries(category.columns.filter(c => c.label && c.type !== 'action').map(c => [c.label, null]));
      const put = (label, value) => {if (Object.prototype.hasOwnProperty.call(values, label)) values[label] = scalar(value);};
      const mapping = kind === 'orders' ? {
        '订货单':'no','内部单号':'innerNo','合作商':'customer','C 端/业主':'customerName','销售':'owner','跟单':'follower','订货日期':'createdAt','订单创建日期':'createdAt'
      } : kind === 'deliveryDocuments' ? {
        '交货单号':'no','合作商':'customer','C 端/业主':'receiver','出货状态':'state','创建日期':'created','更新时间':'updated'
      } : kind === 'tasks' ? {
        '产品':'product','任务编号':'taskNo','工序':'process','材料/颜色':'material','规格尺寸':'spec','材质':'material','产品说明':'description','数量':'qty','计划开始时间':'plannedStart','包装件数':'packages','单个体积':'volume','生产开始时间':'startDate','生产完成时间':'endDate','仓库':'warehouse'
      } : {
        '产品':'product','物料':'material','规格尺寸':'spec','材料/颜色':'material','皮面':'leather','布面':'fabric','大理石':'marble','供应商':'supplier','数量':'qty','单位':'unit','单价':'price','合计':'amount','采购单':'no','产品说明':'description','备注':'remark','采购员':'buyer','采购创建人':'creator','创建人':'creator','采购创建时间':'createdAt','到货日期':'arrival','到货时间':'arrival','颜色':'color','尺寸':'size','规格参数':'spec','仓库':'warehouse'
      };
      Object.entries(mapping).forEach(([label, key]) => put(label, r[key]));
      if (o && kind !== 'orders') {
        put('订货单', o.no); put('内部单号', o.innerNo); put('合作商', o.customer); put('C 端/业主', o.customerName);
        put('订货日期', o.createdAt); put('订单创建时间', o.createdAt);
      }
      put('打印状态', '未核实'); put('最近打印时间', null);
      const missing = Object.keys(values).filter(label => values[label] === null);
      if (missing.length) diagnostic('fields-unrecorded', kind, r.id, missing.join('、'));
      rows.push({id: kind + ':' + r.id, sourceKind: kind, sourceId: r.id, values});
    });
    return {rows, diagnostics};
  };
})();
