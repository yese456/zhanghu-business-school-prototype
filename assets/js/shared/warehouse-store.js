/* 仓库中心：批次为数量依据，库存/修正/流水同事务保存。仅操作本机演示实体。 */
(function () {
  'use strict';
  const S = window.SHARED, db = S.db, copy = S.clone;
  const q4 = n => Math.round((Number(n) + Number.EPSILON) * 1e4) / 1e4;
  const money4 = q4, text = v => String(v ?? '').trim();
  const day = () => S.now().slice(0, 10);
  const validQty = n => n != null && /^(?:\d+(?:\.\d{0,4})?|\.\d{1,4})$/.test(String(n).trim()) && Number.isFinite(Number(n)) && Number(n) >= 0 && Number.isSafeInteger(Math.round(Number(n) * 1e4));
  const dateOK = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
  const daysOld = (date, today = day()) => dateOK(text(date).slice(0, 10)) ? Math.max(0, Math.floor((Date.parse(today + 'T00:00:00Z') - Date.parse(date.slice(0, 10) + 'T00:00:00Z')) / 86400000)) : null;
  const beforeDay = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const getWarehouse = id => db.all('warehouses').find(w => w.id === id);
  const getStock = id => db.find('inventory', id);
  const getBatches = id => db.all('inventoryBatches').filter(b => b.stockId === id);
  const prefs = () => db.all('warehousePreferences')[0] || { id: 'warehouse-center', alertDays: 60, columns: ['name', 'code', 'spec', 'material', 'cat', 'qty', 'unit', 'value', 'age', 'warehouse'] };
  function summarize(stock, batches) {
    const list = batches.filter(b => b.stockId === stock.id), qty = q4(list.reduce((n, b) => n + b.qty, 0));
    return { ...stock, warehouseManaged: true, qty, value: money4(list.reduce((n, b) => n + b.qty * b.unitPrice, 0)) };
  }
  function linkCatalog(stock) {
    const matches = db.all(stock.kind === 'material' ? 'materials' : 'products').filter(item => text(item.sku || item.code) === text(stock.code) && text(item.unit) === text(stock.unit));
    if (matches.length !== 1 || stock.productId && stock.productId !== matches[0].id) return stock;
    return { ...stock, productId: matches[0].id, img: stock.img || matches[0].img || '' };
  }
  function ensure() {
    if (db.all('warehousePreferences').some(p => p.initialized)) {
      if (!prefs().catalogLinked) db.commitMany({ inventory: db.all('inventory').map(r => linkCatalog(copy(r))), warehousePreferences: [{ ...prefs(), catalogLinked: true }] });
      return;
    }
    const warehouses = copy(db.all('warehouses')), stocks = copy(db.all('inventory'));
    const batches = copy(db.all('inventoryBatches')), movements = copy(db.all('inventoryMovements'));
    const findWarehouse = name => {
      let w = warehouses.find(w => w.name === name);
      if (!w) { w = { id: S.newId('WH'), name, code: 'WH' + String(warehouses.length + 1).padStart(3, '0'), address: '', remark: '本机演示仓库', enabled: true }; warehouses.push(w); }
      return w;
    };
    // 只在原始种子库存内补充成品样例；已有自定义库存时不注入新的业务记录。
    const pureSeed = stocks.length === 24 && stocks.every(r => /^ST90\d\d$/.test(r.id));
    if (pureSeed) db.all('products').slice(0, 8).forEach((p, i) => stocks.unshift({
      id: 'WH-DEMO-P' + p.id, productId: p.id, kind: 'product', name: p.name, code: p.sku,
      spec: p.spec, material: p.material, cat: p.catName, unit: p.unit, img: p.img,
      warehouse: i % 2 ? '成品二仓' : '成品一仓', qty: i === 7 ? 0 : 8 + i * 4,
      value: (i === 7 ? 0 : 8 + i * 4) * p.price, demoSeed: true
    }));
    stocks.forEach((r, i) => {
      r.warehouseId = r.warehouseId || findWarehouse(r.warehouse || '待确认仓库').id;
      r.kind = r.kind || (db.all('materials').some(m => m.code === r.code) ? 'material' : 'product');
      Object.assign(r, linkCatalog(r));
      r.warehouseManaged = true;
      if (batches.some(b => b.stockId === r.id)) return;
      const price = r.qty ? Number(r.value || 0) / r.qty : Number(db.all(r.kind === 'material' ? 'materials' : 'products').find(p => p.id === r.productId || (p.code || p.sku) === r.code)?.price || 0);
      // 老数据只有数量快照，不补造采购/订单来源与入库日期。新种子批次日期明确为演示数据。
      const portions = r.demoSeed && r.qty > 0 ? [q4(r.qty * .5), q4(r.qty * .25), q4(r.qty * .25)] : [r.qty];
      portions.forEach((qty, j) => {
        const receivedAt = r.demoSeed ? beforeDay([12, 45, 91][j]) : (r.receivedAt || '');
        const b = { id: S.newId('WB'), stockId: r.id, qty, unitPrice: price, receivedAt, origin: r.demoSeed ? 'Mock 期初入库' : '期初库存快照', orderId: r.orderId || '', orderNo: r.orderNo || '', innerNo: r.innerNo || '', taskId: r.taskId || '', purchaseId: r.purchaseId || '' };
        batches.push(b);
        movements.push({ id: S.newId('WM'), batchId: b.id, stockId: r.id, warehouseId: r.warehouseId, warehouse: r.warehouse, delta: qty, qtyBefore: 0, qtyAfter: qty, type: b.origin, time: receivedAt ? receivedAt + ' 09:00:00' : S.now(), operator: '演示仓管', receiptNo: 'QC-' + b.id, packages: null, volume: null, remark: r.demoSeed ? '本机 Mock 期初数据' : '仅登记已有库存快照；实际入库日期及业务历史未记录', orderId: b.orderId, orderNo: b.orderNo, taskId: b.taskId, purchaseId: b.purchaseId });
      });
    });
    db.commitMany({ warehouses, inventory: stocks.map(r => summarize(r, batches)), inventoryBatches: batches, inventoryMovements: movements, warehousePreferences: [{ ...prefs(), initialized: true, catalogLinked: true, initializedAt: S.now() }] });
  }
  function rows() {
    return db.all('inventory').map(r => {
      const bs = getBatches(r.id).filter(b => b.qty > 0), ages = bs.map(b => daysOld(b.receivedAt)).filter(a => a != null);
      const unknownAge = bs.some(b => daysOld(b.receivedAt) == null), maxAge = ages.length ? Math.max(...ages) : null, minAge = ages.length ? Math.min(...ages) : null;
      return { ...r, warehouse: getWarehouse(r.warehouseId)?.name || r.warehouse, disabledWarehouse: getWarehouse(r.warehouseId)?.enabled === false, maxAge, minAge, unknownAge,
        age: maxAge == null ? '未记录' : (minAge === maxAge ? maxAge : minAge + '-' + maxAge) + '天' + (unknownAge ? ' / 部分未记录' : ''),
        warning: prefs().alertDays > 0 && maxAge != null && maxAge > prefs().alertDays };
    });
  }
  function queryRows(q = {}, sort = {}) {
    const includes = (v, needle) => !text(needle) || text(v).toLowerCase().includes(text(needle).toLowerCase());
    const result = rows().filter(r => {
      const bs = getBatches(r.id), orders = bs.map(b => db.find('orders', b.orderId || b.orderNo)).filter(Boolean);
      const related = orders.flatMap(o => [o.name, o.no, o.innerNo]).concat(bs.flatMap(b => [b.orderNo, b.innerNo]));
      return (!q.warehouseId || r.warehouseId === q.warehouseId) && (q.showZero || r.qty > 0) && includes([r.name, r.code, r.material].join(' '), q.product)
        && includes(related.join(' '), q.order) && includes(orders.flatMap(o => [o.customer, o.customerName, o.contact]).join(' '), q.customer)
        && (!q.age || (q.age === 'unknown' ? r.unknownAge : bs.some(b => b.qty > 0 && ageIn(daysOld(b.receivedAt), q.age))))
        && (q.quantity === '' || q.quantity == null || (q.compare === 'gt' ? r.qty > Number(q.quantity) : q.compare === 'eq' ? r.qty === Number(q.quantity) : r.qty < Number(q.quantity)));
    });
    if (sort.prop && sort.order) result.sort((a, b) => {
      const key = sort.prop === 'age' ? 'maxAge' : sort.prop, av = a[key], bv = b[key];
      const value = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''), 'zh-CN', { numeric: true });
      return (sort.order === 'descending' ? -1 : 1) * value || String(a.id).localeCompare(String(b.id));
    });
    return result;
  }
  function ageIn(n, bucket) { return n != null && (bucket === '30' ? n <= 30 : bucket === '60' ? n > 30 && n <= 60 : bucket === '90' ? n > 60 : false); }
  function correct(batchId, deduction, expectedQty) {
    const b = db.find('inventoryBatches', batchId), n = Number(deduction);
    if (!b) throw Error('库存批次不存在，请关闭后重新打开');
    if (!validQty(deduction) || n <= 0) throw Error('扣减数量必须大于0，且最多支持4位小数');
    if (expectedQty !== undefined && b.qty !== expectedQty) throw Error('该批次库存已变化，请重新打开后核对');
    if (n > b.qty) throw Error('扣减数量不能大于最大库存');
    const stock = getStock(b.stockId);
    if (!stock || !getWarehouse(stock.warehouseId)) throw Error('库存或仓库不存在，请重新核对');
    const activeReservations = db.all('warehouseReservations').filter(r => r.inventoryBatchId === b.id || r.receiptId === b.receiptId && b.receiptId);
    const reserved = activeReservations.reduce((sum, r) => sum + Math.max(0, Number(r.qty) - db.all('warehouseIssues').filter(x => x.reservationId === r.id).reduce((s, x) => s + Number(x.qty || 0), 0)), 0);
    if (q4(b.qty - n) < reserved) throw Error('扣减后数量少于已预留库存，请先处理预留');
    const batches = copy(db.all('inventoryBatches')), target = batches.find(x => x.id === batchId), before = target.qty;
    target.qty = q4(before - n);
    const no = S.newId('XZ'), time = S.now(), operator = '张松涛';
    const correction = { id: no, no, stockId: stock.id, batchId, name: stock.name, code: stock.code, spec: stock.spec, material: stock.material, warehouseId: stock.warehouseId, warehouse: getWarehouse(stock.warehouseId).name, before, deduction: n, after: target.qty, unit: stock.unit, time, operator, orderId: b.orderId, orderNo: b.orderNo, innerNo: b.innerNo, taskId: b.taskId, purchaseId: b.purchaseId };
    const movement = { ...correction, id: S.newId('WM'), delta: -n, qtyBefore: before, qtyAfter: target.qty, type: '库存修正', receiptNo: no, remark: '库存异常手动扣减', packages: null, volume: null };
    db.commitMany({ inventoryBatches: batches, inventory: db.all('inventory').map(r => r.id === stock.id ? summarize(r, batches) : copy(r)), inventoryCorrections: [correction, ...copy(db.all('inventoryCorrections'))], inventoryMovements: [...copy(db.all('inventoryMovements')), movement] });
    return correction;
  }
  function saveWarehouse(form) {
    const data = { id: form.id || S.newId('WH'), name: text(form.name), code: text(form.code), address: text(form.address), remark: text(form.remark), enabled: form.enabled !== false };
    if (!data.name || data.name.length > 20) throw Error('请输入不超过20字的仓库名称');
    if (data.code.length > 20 || data.address.length > 100 || data.remark.length > 500) throw Error('仓库编码、地址或备注超出字数限制');
    if (db.all('warehouses').some(w => w.id !== data.id && w.name === data.name)) throw Error('仓库名称已存在');
    if (data.code && db.all('warehouses').some(w => w.id !== data.id && w.code.toLowerCase() === data.code.toLowerCase())) throw Error('仓库编码已存在');
    const ws = copy(db.all('warehouses')), idx = ws.findIndex(w => w.id === data.id);
    if (form.id && idx < 0) throw Error('仓库已不存在，请刷新列表');
    if (idx < 0) ws.unshift(data); else ws[idx] = { ...ws[idx], ...data };
    db.commitMany({ warehouses: ws, inventory: db.all('inventory').map(r => r.warehouseId === data.id ? { ...r, warehouse: data.name } : copy(r)) });
    return data;
  }
  function removeWarehouse(id) {
    const w = getWarehouse(id);
    if (!w) throw Error('仓库不存在');
    if (w.enabled) throw Error('请先禁用仓库');
    if (db.all('inventory').some(r => r.warehouseId === id) || db.all('inventoryMovements').some(m => m.warehouseId === id)
      || ['warehouseReceipts', 'warehouseIssues', 'warehouseReservations', 'warehouseShipments'].some(k => db.all(k).some(r => r.warehouseId === id || r.warehouse === w.name))) throw Error('仓库已有库存或业务记录，无法删除');
    db.commitMany({ warehouses: db.all('warehouses').filter(r => r.id !== id).map(copy) });
  }
  function savePrefs(change) {
    const next = { ...prefs(), ...copy(change) };
    if (!Number.isInteger(next.alertDays) || next.alertDays < 0 || next.alertDays > 36500) throw Error('预警天数须为0至36500的整数');
    if (!Array.isArray(next.columns) || !next.columns.includes('name')) throw Error('名称列必须保留');
    if (new Set(next.columns).size !== next.columns.length || next.columns[0] !== 'name' || next.columns.some(k => !['name','code','spec','specCode','material','cat','qty','unit','value','age','warehouse'].includes(k))) throw Error('列字段或顺序无效，请重新选择');
    db.commitMany({ warehousePreferences: [next] });
  }
  const headers = ['名称', '编码', '规格', '材质', '分类', '库存数量', '单位', '单价', '仓库编码', '入库时间', '订货单', '内部单号', '任务', '采购单', '包装件数', '体积', '备注'];
  function previewImport(matrix, kind) {
    if (!['product', 'material'].includes(kind)) throw Error('请选择产品或物料导入');
    if (!Array.isArray(matrix) || matrix.length < 2) throw Error('导入文件没有数据');
    if (matrix.length > 1001) throw Error('单次最多导入1000行，请拆分文件');
    const hs = matrix[0].map(text);
    if (headers.some(h => !hs.includes(h)) || new Set(hs).size !== hs.length) throw Error('表头不匹配，请使用本机演示模板且不要修改表头');
    const seen = new Set();
    return matrix.slice(1).map((r, i) => ({ r, line: i + 2 })).filter(({ r }) => r.some(v => text(v))).map(({ r, line }) => {
      const raw = Object.fromEntries(hs.map((h, j) => [h, text(r[j])])), errors = [];
      const catalog = db.all(kind === 'product' ? 'products' : 'materials').filter(p => (p.sku || p.code) === raw['编码']);
      const item = catalog.length === 1 ? catalog[0] : null, warehouses = db.all('warehouses').filter(w => w.code === raw['仓库编码']), wh = warehouses.length === 1 ? warehouses[0] : null;
      if (!item) errors.push('编码未匹配唯一' + (kind === 'product' ? '产品' : '物料'));
      if (item && item.name !== raw['名称']) errors.push('名称与编码不一致');
      if (item && item.unit !== raw['单位']) errors.push('单位与档案不一致');
      if (warehouses.length > 1) errors.push('仓库编号不唯一，请核实历史资料');
      else if (!wh) errors.push('仓库编码不存在');
      else if (!wh.enabled) errors.push('仓库已停用');
      if (!validQty(raw['库存数量']) || Number(raw['库存数量']) <= 0) errors.push('库存数量须大于0，最多4位小数');
      if (!validQty(raw['单价'])) errors.push('单价须为非负数，最多4位小数');
      if (!dateOK(raw['入库时间']) || raw['入库时间'] > day()) errors.push('入库时间须为有效日期且不能晚于今天');
      const order = raw['订货单'] ? db.all('orders').find(o => o.no === raw['订货单']) : null;
      if (raw['订货单'] && !order) errors.push('订货单不存在');
      if (raw['内部单号'] && (!order || order.innerNo !== raw['内部单号'])) errors.push('内部单号与订货单不一致');
      const task = raw['任务'] ? db.all('tasks').find(t => t.id === raw['任务'] || t.taskNo === raw['任务']) : null;
      if (raw['任务'] && (!task || !order || task.orderNo !== order.no)) errors.push('任务须属于所选订货单');
      const purchase = raw['采购单'] ? db.all('purchases').filter(p => p.no === raw['采购单'] && p.productId === item?.id && (!order || p.orderNo === order.no)) : [];
      if (raw['采购单'] && purchase.length !== 1) errors.push('采购单未匹配唯一同产品行');
      if (raw['包装件数'] && (!/^\d+$/.test(raw['包装件数']) || !Number.isSafeInteger(Number(raw['包装件数'])))) errors.push('包装件数须为非负整数');
      if (raw['体积'] && !validQty(raw['体积'])) errors.push('体积须为非负数，最多4位小数');
      const signature = JSON.stringify(headers.map(h => raw[h]));
      if (seen.has(signature)) errors.push('文件内存在完全重复行'); seen.add(signature);
      return { line, raw, errors, itemId: item?.id, warehouseId: wh?.id, orderId: order?.id || '', taskId: task?.id || '', purchaseId: purchase[0]?.id || '' };
    });
  }
  function importRows(preview, kind, token) {
    if (!token || db.all('inventoryMovements').some(m => m.importToken === token)) throw Error('该批次已导入，请勿重复提交');
    if (!Array.isArray(preview) || !preview.length || preview.some((r, i) => !Number.isInteger(r.line) || r.line < 2 || r.line > 1001 || i > 0 && r.line <= preview[i - 1].line)) throw Error('预览行号无效，请重新上传');
    const matrix = Array.from({ length: preview[preview.length - 1].line }, () => []); matrix[0] = headers;
    preview.forEach(r => { matrix[r.line - 1] = headers.map(h => r.raw[h]); });
    const checked = previewImport(matrix, kind);
    if (!checked.length || checked.some(r => r.errors.length)) throw Error('导入数据尚有错误，请修正后重新上传');
    if (checked.length !== preview.length || checked.some((line, i) => line.line !== preview[i].line || ['itemId', 'warehouseId', 'orderId', 'taskId', 'purchaseId'].some(k => line[k] !== preview[i][k]))) throw Error('预览后来源身份已变化，请重新上传核实');
    const stocks = copy(db.all('inventory')), batches = copy(db.all('inventoryBatches')), movements = copy(db.all('inventoryMovements'));
    const assertIds = (rows, label) => { const ids = new Set(); for (const row of rows) { if (typeof row.id !== 'string' || !row.id.trim() || ids.has(row.id)) throw Error(label + '内部ID缺失或冲突，未导入'); ids.add(row.id); } };
    const generatedId = (prefix, rows, label) => { const id = S.newId(prefix); if (typeof id !== 'string' || !id.trim() || rows.some(row => row.id === id)) throw Error(label + '内部ID缺失或冲突，未导入'); return id; };
    checked.forEach(line => {
      const r = line.raw, qty = Number(r['库存数量']), price = Number(r['单价']), warehouse = getWarehouse(line.warehouseId), item = db.find(kind === 'product' ? 'products' : 'materials', line.itemId);
      const matches = stocks.filter(s => s.kind === kind && s.code === r['编码'] && s.warehouseId === warehouse.id && s.spec === r['规格'] && s.material === r['材质'] && s.unit === r['单位']);
      if (matches.length > 1) throw Error('库存身份不唯一，请核实历史资料，未导入');
      let stock = matches[0];
      if (stock && stock.productId !== line.itemId) throw Error('库存产品内部身份冲突，请核实历史资料，未导入');
      if (!stock) { stock = { id: generatedId('ST', stocks, '库存'), warehouseManaged: true, productId: item.id, kind, name: item.name, code: r['编码'], spec: r['规格'], material: r['材质'], cat: r['分类'], unit: r['单位'], warehouseId: warehouse.id, warehouse: warehouse.name, img: item.img, qty: 0, value: 0 }; stocks.unshift(stock); }
      const batch = { id: generatedId('WB', batches, '批次'), stockId: stock.id, qty, unitPrice: price, receivedAt: r['入库时间'], origin: kind === 'product' ? '产品库存导入' : '物料库存导入', orderId: line.orderId, orderNo: r['订货单'], innerNo: r['内部单号'], taskId: line.taskId, purchaseId: line.purchaseId };
      batches.push(batch);
      movements.push({ id: generatedId('WM', movements, '流水'), stockId: stock.id, batchId: batch.id, warehouseId: warehouse.id, warehouse: warehouse.name, delta: qty, qtyBefore: 0, qtyAfter: qty, type: batch.origin, time: S.now(), operator: '张松涛', receiptNo: S.newId('RK'), importToken: token, packages: r['包装件数'] === '' ? null : Number(r['包装件数']), volume: r['体积'] === '' ? null : Number(r['体积']), remark: r['备注'], orderId: batch.orderId, orderNo: batch.orderNo, taskId: batch.taskId, purchaseId: batch.purchaseId });
    });
    assertIds(stocks, '库存'); assertIds(batches, '批次'); assertIds(movements, '流水');
    db.commitMany({ inventory: stocks.map(s => summarize(s, batches)), inventoryBatches: batches, inventoryMovements: movements });
    return checked.length;
  }
  S.warehouse = { ensure, rows, queryRows, getBatches, getStock, getWarehouse, prefs, correct, saveWarehouse, removeWarehouse, savePrefs, headers, previewImport, importRows, daysOld, ageIn, q4, validQty, dateOK };
})();
