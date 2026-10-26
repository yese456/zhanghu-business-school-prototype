/* 仓库中心专用界面，替换通用列表和通用字段更新弹窗。 */
(function () {
  'use strict';
  const S = window.SHARED, W = S.warehouse, db = S.db;
  const { ref, reactive, computed, watch, onUnmounted } = Vue;
  const { ElMessage, ElMessageBox } = ElementPlus;
  const clone = S.clone, n = v => Number(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 4 });
  const valueCell = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? money(v) : '未记录';
  const money = v => '¥' + n(v), dash = v => v === '' || v == null ? '—' : v;
  const columns = [
    { key: 'name', label: '名称', width: 180 }, { key: 'code', label: '编码', width: 130 },
    { key: 'spec', label: '规格', width: 180 }, { key: 'specCode', label: '规格编码', width: 130 },
    { key: 'material', label: '材质', width: 180 }, { key: 'cat', label: '分类', width: 100 },
    { key: 'qty', label: '库存数量', width: 120 }, { key: 'unit', label: '单位', width: 80 },
    { key: 'value', label: '货值', width: 140 }, { key: 'age', label: '库龄', width: 130 },
    { key: 'warehouse', label: '仓库', width: 130 }
  ];
  const initialQuery = () => ({ warehouseId: '', age: '', order: '', customer: '', product: '', compare: 'lt', quantity: '', showZero: false });
  const monthRange = () => { const d = new Date(), end = S.now().slice(0, 10); d.setMonth(d.getMonth() - 1); return [d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), end]; };
  const inDates = (r, dates) => !dates?.length || r.time.slice(0, 10) >= dates[0] && r.time.slice(0, 10) <= dates[1];
  const hasText = (v, q) => !String(q || '').trim() || String(v || '').toLowerCase().includes(q.trim().toLowerCase());
  const pageSlice = (rows, page, size) => rows.slice((page - 1) * size, page * size);
  const Relation = {
    props: ['kind', 'id', 'orderNo', 'label'], emits: ['open'], setup(props) {
      const entity = computed(() => {
        if (props.kind === 'purchase') {
          const matches = props.id !== '' && props.id != null ? db.all('purchases').filter(p => p.id === props.id) : [];
          return matches.length === 1 ? matches[0] : null;
        }
        if (props.kind !== 'order') {
          const matches = props.id !== '' && props.id != null ? db.all('tasks').filter(t => t.id === props.id) : [];
          return matches.length === 1 ? matches[0] : null;
        }
        const orders = db.all('orders'), hasId = props.id !== '' && props.id != null;
        const matches = hasId ? orders.filter(o => o.id === props.id) : props.orderNo ? orders.filter(o => o.no === props.orderNo) : [];
        const target = matches.length === 1 ? matches[0] : null;
        return target && target.id !== '' && target.id != null && orders.filter(o => o.id === target.id).length === 1 ? target : null;
      });
      return { entity, display: computed(() => props.label || entity.value?.no || entity.value?.taskNo || entity.value?.name || props.id || '') };
    }, template: `<el-button v-if="entity" link type="primary" @click="$emit('open',kind,entity.id)">{{display}}</el-button><span v-else>{{display||'—'}}</span>`
  };
  const WarehouseCenter = {
    props: ['nav'], components: { WarehouseRelation: Relation, OrderDetail: window.ERP_EXTRA.comps.OrderDetail },
    setup(props) {
      const error = ref(''), ready = ref(false), busy = ref(false);
      const init = () => { try { W.ensure(); ready.value = true; error.value = ''; } catch (e) { error.value = e.message; } }; init();
      const query = reactive(initialQuery()), applied = ref(initialQuery()), sort = reactive({}), page = ref(1), size = ref(10);
      const rows = computed(() => ready.value ? W.queryRows(applied.value, sort) : []), shown = computed(() => pageSlice(rows.value, page.value, size.value));
      const warehouses = computed(() => db.all('warehouses')), visibleCols = computed(() => W.prefs().columns.map(k => columns.find(c => c.key === k)).filter(Boolean));
      const totals = computed(() => {
        const list = rows.value, valid = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;
        const sum = list.every(r => valid(r.value)) ? list.reduce((total, r) => total + r.value, 0) : null;
        const value = valid(sum) ? W.q4(sum) : null;
        return { qty: W.q4(list.reduce((total, r) => total + r.qty, 0)), value: valid(value) ? value : null };
      });
      const search = () => {
        if (query.quantity !== '' && !W.validQty(query.quantity)) return ElMessage.warning('库存数量请输入非负数，最多4位小数');
        applied.value = clone(query); page.value = 1;
      };
      const reset = () => { Object.assign(query, initialQuery()); search(); };
      const sortChange = s => { Object.assign(sort, { prop: s.prop, order: s.order }); page.value = 1; };
      watch([() => rows.value.length, size], () => { page.value = Math.min(page.value, Math.max(1, Math.ceil(rows.value.length / size.value))); });
      const detail = reactive({ open: false, stockId: '', age: '', page: 1, size: 10 });
      const currentStock = computed(() => W.rows().find(r => r.id === detail.stockId));
      const detailAll = computed(() => W.getBatches(detail.stockId).map(b => ({ ...b, age: W.daysOld(b.receivedAt) })));
      const detailRows = computed(() => detailAll.value.filter(b => !detail.age || W.ageIn(b.age, detail.age)));
      const detailTotals = computed(() => ['all', '30', '60', '90'].map(bucket => W.q4(detailAll.value.filter(b => bucket === 'all' || W.ageIn(b.age, bucket)).reduce((sum, b) => sum + b.qty, 0))));
      const openDetail = r => Object.assign(detail, { open: true, stockId: r.id, age: '', page: 1 });
      watch(() => detail.age, () => { detail.page = 1; });
      const correction = reactive({ open: false, batchId: '', expectedQty: 0, deduction: '', saving: false, error: '' });
      const correctionRef = ref(), correctionRules = { deduction: [{ validator: (_r, v, callback) => {
        if (!W.validQty(v) || Number(v) <= 0) return callback(Error('扣减数量必须大于0，且最多支持4位小数'));
        if (Number(v) > correction.expectedQty) return callback(Error('扣减数量不能大于最大库存'));
        callback();
      }, trigger: 'blur' }] };
      const openCorrection = b => Object.assign(correction, { open: true, batchId: b.id, expectedQty: b.qty, deduction: '', saving: false, error: '' });
      const applyCorrection = async () => {
        if (correction.saving) return;
        if (!await correctionRef.value?.validate().catch(() => false)) return;
        correction.saving = true; correction.error = '';
        try { W.correct(correction.batchId, correction.deduction, correction.expectedQty); correction.open = false; correction.deduction = ''; ElMessage.success('已保存1条库存修正记录'); }
        catch (e) { correction.error = e.message; } finally { correction.saving = false; }
      };
      const ledger = reactive({ open: false, stockId: '', dates: [], page: 1, size: 10 });
      const ledgerStock = computed(() => W.rows().find(r => r.id === ledger.stockId));
      const ledgerRows = computed(() => db.all('inventoryMovements').filter(m => m.stockId === ledger.stockId && inDates(m, ledger.dates)).slice().sort((a, b) => b.time.localeCompare(a.time) || b.id.localeCompare(a.id)));
      const ledgerTotals = computed(() => ({ in: W.q4(ledgerRows.value.filter(m => m.delta > 0).reduce((a, m) => a + m.delta, 0)), out: W.q4(-ledgerRows.value.filter(m => m.delta < 0).reduce((a, m) => a + m.delta, 0)) }));
      const openLedger = r => Object.assign(ledger, { open: true, stockId: r.id, dates: [], page: 1 });
      watch(() => ledger.dates, () => { ledger.page = 1; });
      const receipt = ref(null), relation = reactive({ open: false, kind: '', id: '' }), orderOpen = ref(false), orderId = ref('');
      const related = computed(() => {
        if (relation.kind === 'task') {
          const matches = relation.id !== '' && relation.id != null ? db.all('tasks').filter(t => t.id === relation.id) : [];
          return matches.length === 1 ? matches[0] : null;
        }
        const matches = relation.id !== '' && relation.id != null ? db.all('purchases').filter(p => p.id === relation.id) : [];
        return matches.length === 1 ? matches[0] : null;
      });
      const openRelation = (kind, id) => { if (kind === 'order') { orderId.value = id; orderOpen.value = true; } else {
        if (kind === 'purchase' && (id === '' || id == null || db.all('purchases').filter(p => p.id === id).length !== 1)) return ElMessage.warning('采购记录不存在或不唯一，请重新核实');
        if (kind === 'task' && (id === '' || id == null || db.all('tasks').filter(t => t.id === id).length !== 1)) return ElMessage.warning('生产任务不存在或不唯一，请重新核实');
        Object.assign(relation, { open: true, kind, id });
      } };
      const age = reactive({ open: false, days: 0, initial: 0, error: '' });
      const openAge = () => Object.assign(age, { open: true, days: W.prefs().alertDays, initial: W.prefs().alertDays, error: '' });
      const saveAge = () => { try { W.savePrefs({ alertDays: age.days }); age.open = false; ElMessage.success(age.days ? '已设置库龄超过' + age.days + '天预警' : '已关闭库龄预警'); } catch (e) { age.error = e.message; } };
      const col = reactive({ open: false, selected: [], initial: '', dragging: '' });
      const optionalCols = columns.filter(c => c.key !== 'name'), selectedOptional = computed({ get: () => col.selected.filter(k => k !== 'name'), set: keys => { col.selected = ['name', ...col.selected.filter(k => k !== 'name' && keys.includes(k)), ...keys.filter(k => !col.selected.includes(k))]; } });
      const openColumns = () => Object.assign(col, { open: true, selected: clone(W.prefs().columns), initial: JSON.stringify(W.prefs().columns) });
      const moveColumn = (key, offset) => { const i = col.selected.indexOf(key), j = i + offset; if (i < 1 || j < 1 || j >= col.selected.length) return; const next = col.selected.slice(); next.splice(j, 0, next.splice(i, 1)[0]); col.selected = next; };
      const dropColumn = key => { const i = col.selected.indexOf(col.dragging), j = col.selected.indexOf(key); if (i > 0 && j > 0) moveColumn(col.dragging, j - i); };
      const saveColumns = () => { try { W.savePrefs({ columns: col.selected }); col.open = false; ElMessage.success('已保存列字段及顺序'); } catch (e) { ElMessage.error(e.message); } };
      const corrections = reactive({ open: false, warehouseId: '', dates: monthRange(), operator: '', order: '', product: '', applied: {}, page: 1, size: 10 });
      const searchCorrections = () => { corrections.applied = clone({ warehouseId: corrections.warehouseId, dates: corrections.dates, operator: corrections.operator, order: corrections.order, product: corrections.product }); corrections.page = 1; };
      const resetCorrections = () => { Object.assign(corrections, { warehouseId: '', dates: monthRange(), operator: '', order: '', product: '' }); searchCorrections(); };
      const openCorrections = () => { corrections.open = true; resetCorrections(); };
      if(new URLSearchParams(location.hash.split('?')[1]||'').get('panel')==='corrections')openCorrections();
      const operators = computed(() => [...new Set(db.all('inventoryCorrections').map(r => r.operator))]);
      const correctionRows = computed(() => { const q = corrections.applied; return db.all('inventoryCorrections').filter(r => (!q.warehouseId || r.warehouseId === q.warehouseId) && inDates(r, q.dates) && (!q.operator || r.operator === q.operator) && hasText(r.orderNo, q.order) && hasText([r.name, r.code, r.material].join(' '), q.product)); });
      const imp = reactive({ open: false, kind: 'product', files: [], rows: [], error: '', reading: false, saving: false, token: '' });
      let readVersion = 0;
      const openImport = kind => { readVersion++; Object.assign(imp, { open: true, kind, files: [], rows: [], error: '', reading: false, saving: false, token: S.newId('IMPORT') }); };
      const downloadTemplate = () => {
        const item = db.all(imp.kind === 'product' ? 'products' : 'materials')[0], wh = warehouses.value.find(w => w.enabled && w.code);
        if (!wh) return ElMessage.warning('请先创建并启用一个有编码的仓库');
        const sample = [item.name, item.sku || item.code, item.spec || '', item.material || '', item.catName || item.cat || '', 2.5, item.unit, item.price || 0, wh.code, S.now().slice(0, 10), '', '', '', '', 1, .5, '本机演示导入示例，请按实际库存修改'];
        const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([W.headers, sample]), '库存导入');
        S.download((imp.kind === 'product' ? '产品' : '物料') + '库存-本机演示模板.xlsx', XLSX.write(book, { bookType: 'xlsx', type: 'array' }), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      };
      const readFile = async file => {
        const version = ++readVersion; imp.rows = []; imp.error = ''; imp.reading = true;
        try {
          if (!/\.(xlsx|xls)$/i.test(file.name)) throw Error('请选择.xls或.xlsx文件');
          if (file.size > 100 * 1024 * 1024) throw Error('文件大小不能超过100M');
          const bytes = await file.raw.arrayBuffer();
          const book = XLSX.read(bytes, { type: 'array', cellDates: true });
          if (book.SheetNames.length !== 1 || book.Workbook?.Sheets?.some(s => s.Hidden)) throw Error('请保留一个可见工作表，移除隐藏或多余工作表');
          const sheet = book.Sheets[book.SheetNames[0]];
          if (sheet['!merges']?.length || sheet['!rows']?.some(r => r?.hidden) || sheet['!cols']?.some(c => c?.hidden)) throw Error('模板中不能包含合并单元格、隐藏行或隐藏列');
          const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }).map(row => row.map(value => value instanceof Date ? value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0') : value));
          const preview = W.previewImport(matrix, imp.kind);
          if (!preview.length) throw Error('导入文件没有数据');
          if (version === readVersion && imp.open) { imp.rows = preview; imp.token = S.newId('IMPORT'); }
        } catch (e) { if (version === readVersion) imp.error = e.message || '文件无法读取，请检查后重试'; }
        finally { if (version === readVersion) imp.reading = false; }
      };
      const removeFile = () => { readVersion++; imp.rows = []; imp.files = []; imp.error = ''; imp.reading = false; };
      const importErrors = computed(() => imp.rows.filter(r => r.errors.length).length);
      const applyImport = async () => {
        if (imp.saving || imp.reading) return;
        if (!imp.rows.length || importErrors.value) { imp.error = '请上传校验通过的库存文件'; return; }
        imp.saving = true;
        try { const count = W.importRows(imp.rows, imp.kind, imp.token); imp.open = false; imp.rows = []; imp.files = []; page.value = 1; ElMessage.success('已导入' + count + '条库存批次'); }
        catch (e) { imp.error = e.message; } finally { imp.saving = false; }
      };
      const dirty = key => key === 'correction' ? correction.open && correction.deduction !== '' : key === 'age' ? age.open && age.days !== age.initial : key === 'col' ? col.open && JSON.stringify(col.selected) !== col.initial : key === 'imp' ? imp.open && (imp.files.length > 0 || imp.rows.length > 0) : false;
      const requestClose = async (key, done) => {
        if (correction.saving || imp.saving || imp.reading) return;
        if (dirty(key)) { try { await ElMessageBox.confirm('当前修改尚未保存，是否放弃？', '未保存的修改', { confirmButtonText: '放弃修改', cancelButtonText: '继续编辑', type: 'warning' }); } catch (_) { return; } }
        ({ correction, age, col, imp })[key].open = false; if (key === 'imp') readVersion++; if (done) done();
      };
      const unregister = S.registerLeaveGuard(() => ['correction', 'age', 'col', 'imp'].some(dirty), '仓库中心有未保存的修改'); onUnmounted(() => { readVersion++; unregister(); });
      const goWarehouse = () => props.nav('warehouse/manage');
      return { error, ready, busy, init, query, applied, rows, shown, sortChange, page, size, warehouses, visibleCols, totals, search, reset, detail, currentStock, detailAll, detailRows, detailTotals, openDetail, correction, correctionRef, correctionRules, openCorrection, applyCorrection, ledger, ledgerStock, ledgerRows, ledgerTotals, openLedger, receipt, relation, related, openRelation, orderOpen, orderId, age, openAge, saveAge, col, optionalCols, selectedOptional, openColumns, moveColumn, dropColumn, saveColumns, columns, corrections, correctionRows, operators, searchCorrections, resetCorrections, openCorrections, imp, openImport, downloadTemplate, readFile, removeFile, importErrors, applyImport, requestClose, goWarehouse, pageSlice, n, money, valueCell, dash, W, ElMessage };
    },
    template: `
    <section class="wh-center" data-demo="仓库中心：筛选、批次库存、流水与修正同源">
      <el-alert v-if="error" :title="error" type="error" :closable="false"><el-button @click="init">重试</el-button></el-alert>
      <el-form class="wh-query" size="small" @submit.prevent="search" data-demo="输入筛选条件后点击搜索；重置恢复全部库存">
        <el-select v-model="query.warehouseId" aria-label="仓库" placeholder="全部仓库" clearable filterable style="width:100%"><el-option v-for="w in warehouses" :key="w.id" :value="w.id" :label="w.name+(w.enabled?'':'（停用）')"/></el-select>
        <el-select v-model="query.age" aria-label="库龄" placeholder="全部库龄" clearable style="width:100%"><el-option label="30天以内" value="30"/><el-option label="31-60天" value="60"/><el-option label="60天以上" value="90"/><el-option label="库龄未记录" value="unknown"/></el-select>
        <el-input v-model="query.order" placeholder="输入订货单名称/编码/内部单号" clearable @keyup.enter="search"/>
        <el-input v-model="query.customer" placeholder="输入合作商/C端/业主" clearable @keyup.enter="search"/>
        <el-input v-model="query.product" placeholder="输入产品/材质名称/编码" clearable @keyup.enter="search"/>
        <div class="wh-quantity"><el-select v-model="query.compare" aria-label="库存数量比较" style="width:142px"><el-option label="库存数量低于" value="lt"/><el-option label="库存数量等于" value="eq"/><el-option label="库存数量高于" value="gt"/></el-select><el-input v-model="query.quantity" aria-label="库存数量条件" placeholder="请输入" inputmode="decimal" clearable @keyup.enter="search"/></div>
        <div class="wh-query-bottom"><el-checkbox v-model="query.showZero">显示零库存</el-checkbox><div class="wh-query-actions"><el-button type="primary" native-type="submit">搜索</el-button><el-button @click="reset">重置</el-button></div></div>
      </el-form>
      <div class="wh-heading-row"><div class="wh-summary" data-demo="汇总来自全部筛选结果，保留四位小数"><span>库存总数：<b>{{n(totals.qty)}}</b></span><span>数量按原值相加，不同单位不可换算</span><span>货值：<b>{{valueCell(totals.value)}}</b></span></div>
      <div class="wh-toolbar" data-demo="导入、库龄预警、仓库管理、修正记录与列设置"><el-button link type="primary" @click="openImport('product')"><el-icon aria-hidden="true"><Plus /></el-icon><span>导入产品库存</span></el-button><el-button link type="primary" @click="openImport('material')"><el-icon aria-hidden="true"><Plus /></el-icon><span>导入物料库存</span></el-button><el-button link type="primary" @click="openAge">库龄预警设置</el-button><el-button link type="primary" @click="goWarehouse">仓库设置</el-button><el-button link type="primary" @click="openCorrections">修正记录</el-button><el-button link type="primary" @click="openColumns">设置列字段</el-button></div></div>
      <el-table class="wh-stock-table" :data="shown" row-key="id" :row-class-name="({row})=>row.warning?'wh-aged-stock':''" border height="calc(100dvh - 310px)" @sort-change="sortChange" data-demo="按产品、规格、材质和仓库区分库存；操作对应当前行">
        <el-table-column v-for="c in visibleCols" :key="c.key" :prop="c.key" :label="c.label" :min-width="c.width" :align="['qty','value'].includes(c.key)?'right':'left'" sortable="custom" show-overflow-tooltip>
          <template #default="s"><template v-if="c.key==='name'"><div class="wh-name-cell"><el-image v-if="s.row.img" class="wh-thumb" :src="s.row.img" :alt="s.row.name" fit="cover" :preview-src-list="[s.row.img]" preview-teleported @click.stop/><span class="wh-product-name">{{s.row.name}}</span></div></template><span v-else-if="c.key==='value'">{{valueCell(s.row.value)}}</span><span v-else-if="c.key==='qty'">{{n(s.row.qty)}}</span><span v-else-if="c.key==='age'" :class="{'wh-warning':s.row.warning}">{{s.row.age}}</span><span v-else>{{dash(s.row[c.key])}}</span></template>
        </el-table-column><el-table-column label="操作" fixed="right" width="120" align="center"><template #default="s"><el-button link type="primary" @click="openDetail(s.row)">查看明细</el-button><el-button link type="primary" @click="openLedger(s.row)">变动记录</el-button></template></el-table-column>
        <template #empty><el-empty :description="Object.values(applied).some(v=>v&&v!=='lt')?'没有符合条件的库存':'暂无库存数据'" :image-size="64"><el-button @click="reset">重置筛选</el-button></el-empty></template>
      </el-table><el-pagination class="wh-pagination" v-model:current-page="page" v-model:page-size="size" :total="rows.length" :page-sizes="[10,20,50,100]" layout="total,sizes,prev,pager,next,jumper" @size-change="page=1"/>

      <el-dialog v-model="detail.open" title="产品库存明细" width="min(1300px,96vw)" class="wh-dialog" destroy-on-close>
        <template v-if="currentStock"><div class="wh-item-info"><strong>{{currentStock.name}}</strong><span>分类：{{dash(currentStock.cat)}}</span><span>{{dash(currentStock.spec)}}</span></div><div class="wh-summary"><span v-for="(label,i) in ['总库存','30天以内库龄','31-60天库龄','60天以上库龄']" :key="label">{{label}}：<b>{{n(detailTotals[i])}}</b></span></div>
        <el-radio-group v-model="detail.age" class="wh-age-tabs"><el-radio-button value="">全部</el-radio-button><el-radio-button value="30">30天以内</el-radio-button><el-radio-button value="60">31-60天</el-radio-button><el-radio-button value="90">60天以上</el-radio-button></el-radio-group>
        <el-table :data="pageSlice(detailRows,detail.page,detail.size)" row-key="id" border max-height="430"><el-table-column label="库存数量" min-width="110" align="right"><template #default="s">{{n(s.row.qty)}}</template></el-table-column><el-table-column label="单位" width="75"><template #default>{{currentStock.unit}}</template></el-table-column><el-table-column label="入库时间" min-width="145"><template #default="s"><el-tooltip v-if="!s.row.receivedAt" content="期初库存快照未记录实际入库日期"><span>未记录（期初快照）</span></el-tooltip><span v-else>{{s.row.receivedAt}}</span></template></el-table-column><el-table-column label="库龄" min-width="90"><template #default="s"><span :class="{'wh-warning':W.prefs().alertDays>0&&s.row.age>W.prefs().alertDays}">{{s.row.age==null?'未记录':s.row.age+'天'}}</span></template></el-table-column><el-table-column label="订货单" min-width="165"><template #default="s"><WarehouseRelation kind="order" :id="s.row.orderId" :order-no="s.row.orderNo" :label="s.row.orderNo" @open="openRelation"/></template></el-table-column><el-table-column prop="innerNo" label="内部单号" min-width="120"/><el-table-column label="任务" min-width="140"><template #default="s"><WarehouseRelation kind="task" :id="s.row.taskId" @open="openRelation"/></template></el-table-column><el-table-column label="采购" min-width="140"><template #default="s"><WarehouseRelation kind="purchase" :id="s.row.purchaseId" @open="openRelation"/></template></el-table-column><el-table-column label="操作" fixed="right" width="105"><template #default="s"><el-button link type="primary" :disabled="s.row.qty<=0" @click="openCorrection(s.row)">库存修正</el-button></template></el-table-column></el-table>
        <el-pagination class="wh-pagination" v-model:current-page="detail.page" v-model:page-size="detail.size" :total="detailRows.length" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next,jumper" @size-change="detail.page=1"/></template>
      </el-dialog>
      <el-dialog v-model="correction.open" title="库存修正" width="min(500px,94vw)" append-to-body :before-close="done=>requestClose('correction',done)"><p>当库存出现系统里有，但实际没有的异常情况时，可手动修正库存</p><el-alert v-if="correction.error" :title="correction.error" type="error" :closable="false"/><el-form ref="correctionRef" :model="correction" :rules="correctionRules" label-position="top" :disabled="correction.saving" @submit.prevent="applyCorrection"><el-form-item label="扣减库存数量" prop="deduction"><el-input v-model="correction.deduction" inputmode="decimal" placeholder="请输入扣减数量"/><div class="wh-help">当前批次库存：{{n(correction.expectedQty)}}；扣减后：{{n(correction.expectedQty-Number(correction.deduction||0))}}</div></el-form-item></el-form><template #footer><el-button :disabled="correction.saving" @click="requestClose('correction')">取消</el-button><el-button type="primary" :loading="correction.saving" @click="applyCorrection">确定</el-button></template></el-dialog>

      <el-dialog v-model="ledger.open" title="产品库存变动记录" width="min(1400px,96vw)" class="wh-dialog" destroy-on-close><div class="wh-item-info" v-if="ledgerStock"><strong>{{ledgerStock.name}}</strong><span>分类：{{dash(ledgerStock.cat)}}</span><span>{{dash(ledgerStock.spec)}}</span></div><el-date-picker v-model="ledger.dates" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:280px"/><div class="wh-summary"><span>库存数量：<b>{{n(ledgerStock?.qty)}}</b></span><span>入库总数：<b>{{n(ledgerTotals.in)}}</b></span><span>出库总数：<b>{{n(ledgerTotals.out)}}</b></span></div><el-table :data="pageSlice(ledgerRows,ledger.page,ledger.size)" row-key="id" border max-height="430"><el-table-column label="变动数量" min-width="110" align="right"><template #default="s"><span :class="s.row.delta<0?'wh-warning':''">{{s.row.delta>0?'+':''}}{{n(s.row.delta)}}</span></template></el-table-column><el-table-column label="单位" width="70"><template #default>{{ledgerStock?.unit}}</template></el-table-column><el-table-column label="包装件数" min-width="95"><template #default="s">{{dash(s.row.packages)}}</template></el-table-column><el-table-column label="体积" min-width="90"><template #default="s">{{dash(s.row.volume)}}</template></el-table-column><el-table-column label="出/入库凭证" min-width="170"><template #default="s"><el-button link type="primary" @click="receipt=s.row">{{s.row.receiptNo}}</el-button></template></el-table-column><el-table-column prop="time" label="操作时间" min-width="170"/><el-table-column prop="type" label="变动类型" min-width="140"/><el-table-column prop="operator" label="操作人" min-width="100"/><el-table-column prop="remark" label="备注" min-width="230" show-overflow-tooltip/><el-table-column label="订货单" min-width="155"><template #default="s"><WarehouseRelation kind="order" :id="s.row.orderId" :order-no="s.row.orderNo" :label="s.row.orderNo" @open="openRelation"/></template></el-table-column><el-table-column label="任务" min-width="140"><template #default="s"><WarehouseRelation kind="task" :id="s.row.taskId" @open="openRelation"/></template></el-table-column><el-table-column label="采购" min-width="140"><template #default="s"><WarehouseRelation kind="purchase" :id="s.row.purchaseId" @open="openRelation"/></template></el-table-column></el-table><el-pagination class="wh-pagination" v-model:current-page="ledger.page" v-model:page-size="ledger.size" :total="ledgerRows.length" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next,jumper" @size-change="ledger.page=1"/></el-dialog>
      <el-dialog :model-value="!!receipt" title="库存变动凭证" width="min(700px,94vw)" append-to-body @close="receipt=null"><el-alert title="此处仅展示库存变动流水及批次关联，不是业务入库凭证；凭证编号不等于业务入库内部ID。此展示未证明订单来源行 sourceKey，不计作交货可用库存。" type="info" :closable="false"/><el-descriptions v-if="receipt" :column="2" border><el-descriptions-item label="凭证编号" :span="2">{{receipt.receiptNo}}</el-descriptions-item><el-descriptions-item label="流水内部ID" :span="2"><span style="overflow-wrap:anywhere;word-break:break-word">{{receipt.id == null || receipt.id === '' ? '未记录' : receipt.id}}</span></el-descriptions-item><el-descriptions-item label="批次内部ID" :span="2"><span style="overflow-wrap:anywhere;word-break:break-word">{{receipt.batchId == null || receipt.batchId === '' ? '未记录' : receipt.batchId}}</span></el-descriptions-item><el-descriptions-item label="库存内部ID" :span="2"><span style="overflow-wrap:anywhere;word-break:break-word">{{receipt.stockId == null || receipt.stockId === '' ? '未记录' : receipt.stockId}}</span></el-descriptions-item><el-descriptions-item label="仓库内部ID" :span="2"><span style="overflow-wrap:anywhere;word-break:break-word">{{receipt.warehouseId == null || receipt.warehouseId === '' ? '未记录' : receipt.warehouseId}}</span></el-descriptions-item><el-descriptions-item label="变动类型">{{receipt.type}}</el-descriptions-item><el-descriptions-item label="变动数量">{{n(receipt.delta)}} {{ledgerStock?.unit}}</el-descriptions-item><el-descriptions-item label="批次变动前">{{n(receipt.qtyBefore)}}</el-descriptions-item><el-descriptions-item label="批次变动后">{{n(receipt.qtyAfter)}}</el-descriptions-item><el-descriptions-item label="仓库">{{receipt.warehouse}}</el-descriptions-item><el-descriptions-item label="操作人">{{receipt.operator}}</el-descriptions-item><el-descriptions-item label="操作时间" :span="2">{{receipt.time}}</el-descriptions-item><el-descriptions-item label="备注" :span="2">{{dash(receipt.remark)}}</el-descriptions-item></el-descriptions><template #footer><el-button @click="receipt=null">关闭</el-button></template></el-dialog>

      <el-dialog v-model="age.open" title="库龄预警设置" width="min(470px,94vw)" :before-close="done=>requestClose('age',done)"><el-alert v-if="age.error" :title="age.error" type="error" :closable="false"/><div class="wh-age-setting">库龄超过 <el-input-number v-model="age.days" aria-label="库龄预警天数" :min="0" :max="36500" :precision="0" :controls="false" style="width:100px"/> 天进行预警</div><p class="wh-help">输入0天代表不进行库龄预警</p><template #footer><el-button @click="requestClose('age')">取消</el-button><el-button type="primary" @click="saveAge">确定</el-button></template></el-dialog>
      <el-dialog v-model="col.open" title="设置列字段" width="min(680px,94vw)" :before-close="done=>requestClose('col',done)"><div class="wh-columns"><div><el-checkbox :model-value="selectedOptional.length===optionalCols.length" :indeterminate="selectedOptional.length>0&&selectedOptional.length<optionalCols.length" @change="v=>selectedOptional=v?optionalCols.map(c=>c.key):[]">所有选项（{{selectedOptional.length}}/{{optionalCols.length}}）</el-checkbox><el-checkbox-group v-model="selectedOptional"><el-checkbox v-for="c in optionalCols" :key="c.key" :value="c.key">{{c.label}}</el-checkbox></el-checkbox-group></div><div><div class="wh-columns-title">已选（{{selectedOptional.length}}）<el-button link type="primary" @click="selectedOptional=[]">清空</el-button></div><div v-for="(key,i) in selectedOptional" :key="key" class="wh-column-selected" draggable="true" @dragstart="col.dragging=key" @dragover.prevent @drop.prevent="dropColumn(key)"><span>{{columns.find(c=>c.key===key)?.label}}</span><el-button text :aria-label="'上移'+columns.find(c=>c.key===key)?.label" :disabled="i===0" @click="moveColumn(key,-1)">↑</el-button><el-button text :aria-label="'下移'+columns.find(c=>c.key===key)?.label" :disabled="i===selectedOptional.length-1" @click="moveColumn(key,1)">↓</el-button><el-button text :aria-label="'移除'+columns.find(c=>c.key===key)?.label" @click="col.selected=col.selected.filter(k=>k!==key)">×</el-button></div></div></div><template #footer><el-button @click="requestClose('col')">取消</el-button><el-button type="primary" @click="saveColumns">确定</el-button></template></el-dialog>

      <el-dialog v-model="corrections.open" title="库存修正记录" width="min(1450px,96vw)" class="wh-dialog" destroy-on-close><el-form class="wh-corrections-query" @submit.prevent="searchCorrections"><el-select v-model="corrections.warehouseId" aria-label="修正记录仓库" clearable placeholder="全部仓库" style="width:180px"><el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id"/></el-select><el-date-picker v-model="corrections.dates" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:260px"/><el-select v-model="corrections.operator" aria-label="操作人" clearable placeholder="全部操作人" style="width:160px"><el-option v-for="o in operators" :key="o" :label="o" :value="o"/></el-select><el-input v-model="corrections.order" placeholder="输入订货单名称/编码" style="width:210px" clearable/><el-input v-model="corrections.product" placeholder="输入产品/材质名称/编码" style="width:230px" clearable/><el-button type="primary" native-type="submit">搜索</el-button><el-button @click="resetCorrections">重置</el-button></el-form><el-table :data="pageSlice(correctionRows,corrections.page,corrections.size)" row-key="id" border max-height="430"><el-table-column v-for="c in [{p:'name',l:'名称',w:180},{p:'code',l:'编码',w:130},{p:'spec',l:'规格',w:180},{p:'warehouse',l:'仓库',w:130},{p:'before',l:'修正前库存数量',w:150},{p:'deduction',l:'扣减数量',w:110},{p:'after',l:'修正后库存数量',w:150},{p:'unit',l:'单位',w:75},{p:'time',l:'操作时间',w:170},{p:'operator',l:'操作人',w:100},{p:'material',l:'材质',w:160}]" :key="c.p" :prop="c.p" :label="c.l" :min-width="c.w" show-overflow-tooltip/><el-table-column label="订货单" min-width="155"><template #default="s"><WarehouseRelation kind="order" :id="s.row.orderId" :order-no="s.row.orderNo" :label="s.row.orderNo" @open="openRelation"/></template></el-table-column><el-table-column label="任务" min-width="130"><template #default="s"><WarehouseRelation kind="task" :id="s.row.taskId" @open="openRelation"/></template></el-table-column><el-table-column label="采购单" min-width="140"><template #default="s"><WarehouseRelation kind="purchase" :id="s.row.purchaseId" @open="openRelation"/></template></el-table-column></el-table><el-pagination class="wh-pagination" v-model:current-page="corrections.page" v-model:page-size="corrections.size" :total="correctionRows.length" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next,jumper" @size-change="corrections.page=1"/></el-dialog>

      <el-dialog v-model="imp.open" :title="imp.kind==='product'?'批量添加产品库存导入':'批量添加材质库存导入'" width="min(1020px,94vw)" class="wh-dialog" :before-close="done=>requestClose('imp',done)"><p>第一步：<el-button link type="primary" @click="downloadTemplate">下载导入数据模板</el-button></p><p>第二步：按照数据模板中的示例填写信息</p><p>第三步：上传填写好的数据模板文件</p><el-upload v-model:file-list="imp.files" :auto-upload="false" :limit="1" accept=".xls,.xlsx" :on-change="readFile" :on-remove="removeFile" :disabled="imp.saving||imp.reading" :on-exceed="()=>ElMessage.warning('请先移除当前文件再上传')"><el-button type="primary" :loading="imp.reading">上传文件</el-button></el-upload><p class="wh-help">本机演示模板，产品/物料编码及单位须与档案一致。支持.xls、.xlsx，文件不超过100M，单次最多1000行。导入会追加库存批次。</p><el-alert v-if="imp.error" :title="imp.error" type="error" :closable="false"/><template v-if="imp.rows.length"><el-alert :type="importErrors?'error':'success'" :title="'共'+imp.rows.length+'行，'+importErrors+'行需修正；校验通过后才会保存全部数据'" :closable="false"/><el-table :data="imp.rows" row-key="line" border max-height="280"><el-table-column prop="line" label="行号" width="65"/><el-table-column label="名称" min-width="160"><template #default="s">{{s.row.raw['名称']}}</template></el-table-column><el-table-column label="编码" min-width="140"><template #default="s">{{s.row.raw['编码']}}</template></el-table-column><el-table-column label="库存数量" width="110"><template #default="s">{{s.row.raw['库存数量']}}</template></el-table-column><el-table-column label="仓库编码" width="110"><template #default="s">{{s.row.raw['仓库编码']}}</template></el-table-column><el-table-column label="校验结果" min-width="230"><template #default="s"><span :class="s.row.errors.length?'wh-warning':''">{{s.row.errors.join('；')||'通过'}}</span></template></el-table-column></el-table></template><template #footer><el-button :disabled="imp.saving||imp.reading" @click="requestClose('imp')">取消</el-button><el-button type="primary" :loading="imp.saving" :disabled="imp.reading||!imp.rows.length||importErrors>0" @click="applyImport">确定</el-button></template></el-dialog>
      <OrderDetail v-model="orderOpen" :order-id="orderId" @go="nav"/><el-dialog v-model="relation.open" :title="relation.kind==='task'?'关联生产任务':'关联采购明细'" width="min(760px,94vw)" append-to-body><el-descriptions v-if="related" :column="2" border><el-descriptions-item label="编号" :span="2">{{related.no||related.taskNo||related.id}}</el-descriptions-item><el-descriptions-item label="产品">{{related.product}}</el-descriptions-item><el-descriptions-item label="数量">{{n(related.qty)}} {{related.unit}}</el-descriptions-item><el-descriptions-item label="状态">{{related.state||related.status}}</el-descriptions-item><el-descriptions-item label="供应商">{{dash(related.supplier)}}</el-descriptions-item><el-descriptions-item label="规格" :span="2">{{dash(related.spec)}}</el-descriptions-item><el-descriptions-item label="订货单" :span="2">{{dash(related.orderNo)}}</el-descriptions-item><el-descriptions-item label="备注" :span="2">{{dash(related.remark)}}</el-descriptions-item></el-descriptions><el-empty v-else description="关联记录已不存在"/><template #footer><el-button @click="relation.open=false">关闭</el-button></template></el-dialog>
    </section>`
  };
  const WarehouseManagement = {
    props: ['nav'], setup() {
      const error = ref(''); try { W.ensure(); } catch (e) { error.value = e.message; }
      const query = ref(''), applied = ref(''), page = ref(1), size = ref(10), saving = ref(false), formRef = ref();
      const rows = computed(() => db.all('warehouses').filter(w => hasText(w.name + ' ' + w.code, applied.value)));
      const dialog = reactive({ open: false, initial: '', error: '' }), form = reactive({ id: '', name: '', code: '', address: '', remark: '', enabled: true });
      const rules = { name: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }] };
      const search = () => { applied.value = query.value; page.value = 1; };
      const reset = () => { query.value = ''; search(); };
      const open = r => { Object.assign(form, r ? clone(r) : { id: '', name: '', code: '', address: '', remark: '', enabled: true }); Object.assign(dialog, { open: true, initial: JSON.stringify(form), error: '' }); };
      const dirty = () => dialog.open && JSON.stringify(form) !== dialog.initial;
      const close = async done => {
        if (saving.value) return;
        if (dirty()) { try { await ElMessageBox.confirm('当前修改尚未保存，是否放弃？', '未保存的修改', { confirmButtonText: '放弃修改', cancelButtonText: '继续编辑', type: 'warning' }); } catch (_) { return; } }
        dialog.open = false; if (typeof done === 'function') done();
      };
      const unregister = S.registerLeaveGuard(dirty, '仓库信息有未保存的修改'); onUnmounted(unregister);
      const save = async () => {
        if (saving.value || !await formRef.value?.validate().catch(() => false)) return;
        saving.value = true; dialog.error = '';
        try { W.saveWarehouse(form); dialog.open = false; ElMessage.success(form.id ? '已更新1个仓库' : '已添加1个仓库'); }
        catch (e) { dialog.error = e.message; } finally { saving.value = false; }
      };
      const toggle = r => { try { W.saveWarehouse({ ...r, enabled: !r.enabled }); ElMessage.success('已' + (r.enabled ? '禁用' : '启用') + '仓库“' + r.name + '”'); } catch (e) { ElMessage.error(e.message); } };
      const remove = async r => {
        try { await ElMessageBox.confirm('确定删除仓库“' + r.name + '”？已有库存或业务记录的仓库不能删除。', '删除仓库', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }); }
        catch (_) { return; }
        try { W.removeWarehouse(r.id); page.value = Math.min(page.value, Math.max(1, Math.ceil(rows.value.length / size.value))); ElMessage.success('已删除1个仓库'); } catch (e) { ElMessage.error(e.message); }
      };
      return { error, query, applied, page, size, rows, search, reset, dialog, form, formRef, rules, saving, open, close, save, toggle, remove, pageSlice };
    }, template: `<section class="wh-center wh-management" data-demo="仓库管理：新增、编辑、启停及删除闭环"><el-alert v-if="error" :title="error" type="error" :closable="false"/><el-form inline @submit.prevent="search"><el-form-item label="仓库"><el-input v-model="query" placeholder="请输入仓库名称/编码" clearable style="width:240px"/></el-form-item><el-form-item><el-button type="primary" native-type="submit">搜索</el-button><el-button @click="reset">重置</el-button></el-form-item></el-form><div class="wh-toolbar"><el-button type="primary" @click="open()">添加仓库</el-button><el-button @click="nav('inventory/inquiry')">返回仓库中心</el-button></div><el-table :data="pageSlice(rows,page,size)" row-key="id" border height="calc(100dvh - 290px)"><el-table-column prop="name" label="仓库名称" min-width="180" show-overflow-tooltip/><el-table-column prop="code" label="仓库编码" min-width="130"/><el-table-column prop="address" label="仓库地址" min-width="250" show-overflow-tooltip/><el-table-column label="状态" width="95"><template #default="s"><el-tag :type="s.row.enabled?'success':'danger'">{{s.row.enabled?'启用':'停用'}}</el-tag></template></el-table-column><el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip/><el-table-column label="操作" width="190" fixed="right"><template #default="s"><el-button link type="primary" @click="toggle(s.row)">{{s.row.enabled?'禁用':'启用'}}</el-button><el-button link type="primary" @click="open(s.row)">编辑</el-button><el-button v-if="!s.row.enabled" link type="danger" @click="remove(s.row)">删除</el-button></template></el-table-column><template #empty><el-empty description="没有符合条件的仓库" :image-size="64"><el-button @click="reset">重置筛选</el-button></el-empty></template></el-table><el-pagination class="wh-pagination" v-model:current-page="page" v-model:page-size="size" :total="rows.length" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next,jumper" @size-change="page=1"/>
    <el-dialog v-model="dialog.open" :title="form.id?'编辑仓库':'添加仓库'" width="min(600px,94vw)" :before-close="close" destroy-on-close><el-alert v-if="dialog.error" :title="dialog.error" type="error" :closable="false"/><el-form ref="formRef" :model="form" :rules="rules" label-width="100px" :disabled="saving" scroll-to-error @submit.prevent="save"><el-form-item label="仓库名称" prop="name"><el-input v-model="form.name" placeholder="请输入仓库名称" maxlength="20" show-word-limit/></el-form-item><el-form-item label="仓库编码" prop="code"><el-input v-model="form.code" placeholder="请输入仓库编码" maxlength="20" show-word-limit/></el-form-item><el-form-item label="仓库地址" prop="address"><el-input v-model="form.address" placeholder="请输入仓库地址" maxlength="100" show-word-limit/></el-form-item><el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" maxlength="500" show-word-limit/></el-form-item><el-form-item label="启用仓库" prop="enabled"><el-switch v-model="form.enabled" aria-label="启用仓库"/></el-form-item></el-form><template #footer><el-button :disabled="saving" @click="close()">取消</el-button><el-button type="primary" :loading="saving" @click="save">确定</el-button></template></el-dialog></section>`
  };
  Object.assign(window.ERP_EXTRA.comps, { WarehouseCenter, WarehouseManagement });
  window.ERP_EXTRA.custom = { ...(window.ERP_EXTRA.custom || {}), 'inventory/inquiry': 'WarehouseCenter' };
  window.ERP_EXTRA.sub = { ...(window.ERP_EXTRA.sub || {}), 'warehouse/manage': 'WarehouseManagement' };
})();
