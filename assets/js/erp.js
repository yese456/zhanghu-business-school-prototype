/* ============================================================
   系统 B · 订货管理系统（Vue 3 + Element Plus）
   ============================================================ */
(function () {
  'use strict';
  const { createApp, ref, reactive, computed, watch } = Vue;
  const { ElMessage, ElMessageBox } = ElementPlus;
  const M = window.MOCK;

  const SCHEMA_B = Object.assign({}, window.SCHEMA_B || {}, window.SCHEMA_B_EXTRA || {});
  const MENU = M.erpMenu;
  const EX = window.ERP_EXTRA || { comps: {}, custom: {}, sub: {}, names: {}, newRoute: {}, navButtons: {} };
  const NAME = {};
  MENU.forEach((m) => { NAME[m.key] = m.name; });

  const tagT = (v) => {
    const s = String(v);
    if (/完成|已付|已审核|已通过|已入库|已签收|已发货|已结算|已发放|合作中|启用|在职|全部回款/.test(s)) return 'success';
    if (/待|部分|进行中|排产|生产中|处理中/.test(s)) return 'warning';
    if (/驳回|作废|逾期|停用|离职|退款|异常/.test(s)) return 'danger';
    if (/已下单|已出库|待开工/.test(s)) return 'primary';
    return 'info';
  };
  const money = (n) => '¥' + Number(n).toLocaleString('zh-CN');

  /* ============ 表格页配置（旧版手工配置：提供状态条/工具栏/操作列） ============ */
  function legacyConf(key) {
    const base = { pageSize: 10 };

    if (key === 'project/index') {
      return {
        filters: [
          { l: '订货单号', ph: '订货单号 / 内部单号' },
          { l: '产品', ph: '请输入产品名称' },
          { l: 'C端/业主', ph: '客户名称或手机号', type: 'input' },
          { l: '订单归属(合作商)', ph: '请输入名称或手机号', type: 'input' },
          { l: '合作商类型', type: 'select', opts: ['全部', '经销商', '直营', '工程单'] },
          { l: '销售', type: 'select', opts: ['请选择销售', '张松涛', '曾燕然', '袁彩怡'] },
          { l: '产品线', type: 'select', opts: ['请选择产品线', '沙发', '餐桌', '茶几'] },
          { l: '销售', type: 'select', opts: ['请选择销售', '张松涛', '张姐'] },
          { l: '回款状态', type: 'select', opts: ['全部', '未收款', '部分回款', '全部回款'] },
          { l: '订单时间', type: 'daterange' }
        ],
        tabs: [['全部', 476], ['方案(草稿)', 311], ['已下单', 52], ['待制图', 8], ['待排产', 46], ['待开工', 31], ['生产中', 37], ['已入库', 31], ['已出库', 6], ['已作废', 7]],
        toolbar: ['打印', '导出'],
        cols: [
          { p: 'no', l: '订货单号', w: 132, t: 'link', sub: 'innerNo' },
          { p: 'productName', l: '产品', w: 210, t: 'prod' },
          { p: 'partner', l: '订单归属(合作商)', w: 150 },
          { p: 'products', l: '产品数量', w: 84, align: 'center' },
          { p: 'amount', l: '订单金额', w: 106, align: 'right', t: 'money' },
          { p: 'paid', l: '已回款金额', w: 110, align: 'right', t: 'money' },
          { p: 'delivery', l: '交货日期', w: 106 },
          { p: 'tasks', l: '任务数', w: 74, align: 'center' },
          { p: 'purchaseCount', l: '采购单数', w: 86, align: 'center' },
          { p: 'produceStatus', l: '生产进度', w: 96, t: 'tag' },
          { p: 'payStatus', l: '订单状态', w: 92, t: 'tagSt' },
          { p: 'remainDays', l: '停留时长', w: 96, t: 'days' },
          { p: 'payStatus', l: '回款状态', w: 96, t: 'tag' },
          { p: 'createdAt', l: '订货日期', w: 96 }
        ],
        rows: M.orders,
        ops: ['复制', '更多']
      };
    }
    if (key === 'perfect/center') {
      return {
        filters: [
          { l: '排产时间', type: 'daterange' },
          { l: '产品名称/编码', ph: '产品名称/编码' },
          { l: '合作商', type: 'select', opts: ['请选择合作商'] },
          { l: 'C端/业主', ph: '客户名称或手机号' },
          { l: '订货单号/内部单号', ph: '订货单号/内部单号' },
          { l: '任务编号', ph: '输入任务编号' }
        ],
        tabs: [['全部', 379], ['待排产', 107], ['排产中', 50], ['待开工', 79], ['生产中', 36], ['生产完成', 0], ['临近交期', 0], ['生产逾期', 110], ['质检记录', 0]],
        toolbar: ['生产计划', '下发生产任务', '打印', '成品申购', '物料申购', '委外加工', '导出'],
        cols: [
          { p: 'product', l: '产品', w: 150, t: 'prod', detail: true },
          { p: 'taskNo', l: '任务编号', w: 116 },
          { p: 'process', l: '工序', w: 160, t: 'proc' },
          { p: 'startDate', l: '生产开始时间', w: 110 },
          { p: 'endDate', l: '生产完成时间', w: 110 },
          { p: 'orderNo', l: '订货单', w: 120, t: 'link' },
          { p: 'innerNo', l: '内部单号', w: 100 },
          { p: 'partner', l: '合作商', w: 96 },
          { p: 'owner', l: 'C端/业主', w: 96 },
          { p: 'material', l: '材料', w: 90 }
        ],
        rows: M.tasks,
        ops: ['调整生产计划', '打印生产流程卡', '成品申购', '物料申购', '委外加工']
      };
    }
    if (key === 'deliver/index') {
      return {
        filters: [
          { l: '交货单号', ph: '交货单号' },
          { l: '订货单号', ph: '订货单号' },
          { l: '客户', ph: '客户名称/手机号' },
          { l: '发货状态', type: 'select', opts: ['全部', '待发货', '已发货', '已签收'] },
          { l: '交货日期', type: 'daterange' }
        ],
        tabs: [['未建交货单', 12], ['已建交货单', 22]],
        toolbar: ['打印交货单', '导出'],
        cols: [
          { p: 'no', l: '交货单号', w: 130, t: 'link' },
          { p: 'orderNo', l: '订货单号', w: 124, t: 'link' },
          { p: 'customer', l: '客户', w: 190 },
          { p: 'qty', l: '数量', w: 76, align: 'center' },
          { p: 'amount', l: '金额', w: 110, align: 'right', t: 'money' },
          { p: 'address', l: '收货地址', w: 200, ellipsis: true },
          { p: 'receiver', l: '收货人', w: 92 },
          { p: 'deliverDate', l: '交货日期', w: 108 },
          { p: 'logistics', l: '物流', w: 100 },
          { p: 'state', l: '状态', w: 96, t: 'tag' }
        ],
        rows: M.deliveries,
        ops: ['打印', '发货']
      };
    }
    if (key === 'reconciliation/index') {
      return {
        filters: [
          { l: '创建时间', type: 'daterange' },
          { l: '全部审核状态', type: 'select', opts: ['全部审核状态', '待审核', '已审核', '已驳回'] },
          { l: '全部付款状态', type: 'select', opts: ['全部付款状态', '待付款', '已付款'] },
          { l: '选择供应商', type: 'select', opts: ['选择供应商'].concat(M.suppliers.map((s) => s.name)) },
          { l: '请输入采购单号', ph: '请输入采购单号' },
          { l: '请输入订货单号', ph: '请输入订货单号' },
          { l: '内部单号', ph: '请输入内部单号' }
        ],
        tabs: [],
        toolbar: [],
        cols: [
          { p: 'no', l: '付款单号', w: 120, t: 'link' },
          { p: 'supplier', l: '供应商名称', w: 130, t: 'link' },
          { p: 'supplierCode', l: '供应商编码', w: 100 },
          { p: 'amount', l: '付款金额', w: 100, align: 'right', t: 'money' },
          { p: 'auditState', l: '审核状态', w: 96, t: 'tag' },
          { p: 'payState', l: '付款状态', w: 96, t: 'tag' },
          { p: 'applicant', l: '申请人员', w: 96 },
          { p: 'auditor', l: '审核人员', w: 96 },
          { p: 'payer', l: '付款人员', w: 96 },
          { p: 'createdAt', l: '创建时间', w: 104 },
          { p: 'auditAt', l: '审核时间', w: 104 }
        ],
        rows: M.payments,
        ops: [{label:'编辑',show:r=>r.__record?.auditState==='待审核'&&r.__record?.payState!=='已付款'},{label:'审核',show:r=>r.__record?.auditState==='待审核'&&r.__record?.payState!=='已付款'},{label:'删除',show:r=>r.__record?.auditState==='待审核'&&r.__record?.payState!=='已付款'},'查看详情',{label:'付款',show:r=>r.__record?.auditState==='已审核'&&r.__record?.payState==='待付款'}]
      };
    }
    if (key === 'inventory/inquiry') {
      return {
        filters: [
          { l: '物料名称', ph: '名称 / 编码' },
          { l: '仓库', type: 'select', opts: ['全部', '一号仓', '二号仓', '三号仓', '车间暂存区'] },
          { l: '物料分类', type: 'select', opts: ['全部', '皮面', '布面', '大理石', '金属', '木面'] },
          { l: '库存预警', type: 'select', opts: ['全部', '低于安全库存'] }
        ],
        tabs: [['全部', 24], ['正常', 19], ['低于安全库存', 3], ['零库存', 2]],
        toolbar: ['导出', '盘点'],
        cols: [
          { p: 'code', l: '物料编码', w: 124 },
          { p: 'name', l: '物料名称', w: 200 },
          { p: 'cat', l: '分类', w: 92 },
          { p: 'warehouse', l: '仓库', w: 110 },
          { p: 'location', l: '库位', w: 100 },
          { p: 'qty', l: '库存数量', w: 100, align: 'right' },
          { p: 'unit', l: '单位', w: 70, align: 'center' },
          { p: 'safeQty', l: '安全库存', w: 100, align: 'right' },
          { p: 'amount', l: '库存金额', w: 110, align: 'right', t: 'money' },
          { p: 'updatedAt', l: '更新时间', w: 150 }
        ],
        rows: M.stockRows,
        ops: ['流水', '调整']
      };
    }
    if (key === 'wage/piece') {
      return {
        filters: [
          { l: '员工姓名', ph: '请输入员工姓名' },
          { l: '车间', type: 'select', opts: ['全部', '软包车间', '木工车间', '油漆车间'] },
          { l: '结算月份', type: 'month' },
          { l: '结算状态', type: 'select', opts: ['全部', '待确认', '已结算'] }
        ],
        tabs: [['全部', 20], ['待确认', 3], ['已结算', 17]],
        toolbar: ['批量结算', '导出'],
        cols: [
          { p: 'employee', l: '员工', w: 100 },
          { p: 'dept', l: '车间', w: 110 },
          { p: 'process', l: '工序', w: 100 },
          { p: 'qty', l: '计件数量', w: 100, align: 'right' },
          { p: 'unitPrice', l: '单价', w: 90, align: 'right', t: 'money' },
          { p: 'amount', l: '计件工资', w: 110, align: 'right', t: 'money' },
          { p: 'month', l: '结算月份', w: 100 },
          { p: 'state', l: '状态', w: 96, t: 'tag' },
          { p: 'auditor', l: '审核人', w: 90 }
        ],
        rows: M.wages,
        ops: ['明细', '结算']
      };
    }
    if (key === 'commission/statistic') {
      return {
        filters: [
          { l: '员工', ph: '请输入员工姓名' },
          { l: '统计月份', type: 'month' },
          { l: '发放状态', type: 'select', opts: ['全部', '待发放', '已发放'] }
        ],
        tabs: [['全部', 8], ['待发放', 2], ['已发放', 6]],
        toolbar: ['导出'],
        cols: [
          { p: 'employee', l: '员工', w: 110 },
          { p: 'dept', l: '部门', w: 110 },
          { p: 'orders', l: '成交单数', w: 100, align: 'right' },
          { p: 'amount', l: '成交金额', w: 120, align: 'right', t: 'money' },
          { p: 'rate', l: '提成比例', w: 100, align: 'right', t: 'pct' },
          { p: 'commission', l: '提成金额', w: 120, align: 'right', t: 'money' },
          { p: 'month', l: '月份', w: 100 },
          { p: 'state', l: '状态', w: 96, t: 'tag' }
        ],
        rows: M.commissions,
        ops: ['明细']
      };
    }
    if (key === 'purchase/caigou' || key === 'purchase/other') {
      return {
        filters: [
          { l: '采购单号', ph: '请输入采购单号' },
          { l: '供应商', type: 'select', opts: ['全部'].concat(M.suppliers.map((s) => s.name)) },
          { l: '采购类型', type: 'select', opts: ['全部', '成品采购', '物料采购', '委外工艺'] },
          { l: '到货日期', type: 'daterange' }
        ],
        tabs: [['成品采购', 9], ['物料采购', 12], ['委外工艺', 5]],
        toolbar: ['新建采购单', '导出'],
        cols: [
          { p: 'no', l: '采购单号', w: 130, t: 'link' },
          { p: 'type', l: '采购类型', w: 100, t: 'tag' },
          { p: 'supplier', l: '供应商', w: 150 },
          { p: 'material', l: '物料', w: 180 },
          { p: 'qty', l: '数量', w: 80, align: 'right' },
          { p: 'unit', l: '单位', w: 70, align: 'center' },
          { p: 'amount', l: '金额', w: 110, align: 'right', t: 'money' },
          { p: 'arrival', l: '到货日期', w: 108 },
          { p: 'state', l: '状态', w: 96, t: 'tag' },
          { p: 'buyer', l: '采购员', w: 90 }
        ],
        rows: M.purchases,
        ops: ['详情', '收货']
      };
    }
    if (key === 'purchase/supplier') {
      return {
        filters: [
          { l: '供应商', ph: '名称 / 编码' },
          { l: '供货品类', type: 'select', opts: ['全部', '皮面', '布面', '大理石', '金属', '木面'] },
          { l: '合作状态', type: 'select', opts: ['全部', '合作中', '停用'] }
        ],
        tabs: [['全部', 8], ['合作中', 7], ['停用', 1]],
        toolbar: ['新建供应商', '导出'],
        cols: [
          { p: 'name', l: '供应商名称', w: 180 },
          { p: 'code', l: '编码', w: 110 },
          { p: 'cat', l: '供货品类', w: 100 },
          { p: 'contact', l: '联系人', w: 100 },
          { p: 'phone', l: '联系电话', w: 130 },
          { p: 'level', l: '等级', w: 80, align: 'center' },
          { p: 'orders', l: '合作单数', w: 96, align: 'right' },
          { p: 'amount', l: '累计金额', w: 116, align: 'right', t: 'money' },
          { p: 'status', l: '状态', w: 92, t: 'tag' }
        ],
        rows: M.suppliers,
        ops: ['详情', '编辑']
      };
    }
    if (key === 'editApply/list') {
      const rows = M.orders.slice(0, 16).map((o, i) => ({
        id: 'EA' + i, no: 'GD' + o.no.slice(1), orderNo: o.no, customer: o.customer,
        type: ['改金额', '改交期', '改产品', '改数量'][i % 4],
        applicant: o.owner, reason: ['客户调整客厅方案', '客户要求提前交货', '补差价换材质', '门店录错规格'][i % 4],
        state: ['待审核', '已通过', '已驳回'][i % 3], createdAt: o.createdAt
      }));
      return {
        filters: [{ l: '改单编号', ph: '请输入改单编号' }, { l: '订货单号', ph: '请输入订货单号' }, { l: '审核状态', type: 'select', opts: ['全部', '待审核', '已通过', '已驳回'] }],
        tabs: [['全部', 16], ['待审核', 6], ['已通过', 6], ['已驳回', 4]],
        toolbar: ['导出'],
        cols: [
          { p: 'no', l: '改单编号', w: 130, t: 'link' },
          { p: 'orderNo', l: '订货单号', w: 130, t: 'link' },
          { p: 'customer', l: '客户', w: 180 },
          { p: 'type', l: '改单类型', w: 100 },
          { p: 'reason', l: '改单原因', w: 200, ellipsis: true },
          { p: 'applicant', l: '申请人', w: 96 },
          { p: 'state', l: '审核状态', w: 100, t: 'tag' },
          { p: 'createdAt', l: '提交时间', w: 152 }
        ],
        rows,
        ops: ['审核', '详情']
      };
    }
    if (key === 'project/modifylog') {
      const rows = M.orders.slice(0, 20).map((o, i) => ({
        id: 'ML' + i, orderNo: o.no, field: ['应收金额', '实收金额', '商品总价', '交货日期'][i % 4],
        before: ['¥' + (o.amount + 5000).toLocaleString(), o.delivery, '3 件', '张姐定制'][i % 4],
        after: ['¥' + o.amount.toLocaleString(), M.d(i), '4 件', '张姐定制（改）'][i % 4],
        operator: o.owner, createdAt: o.createdAt
      }));
      return {
        filters: [{ l: '订货单号', ph: '请输入订货单号' }, { l: '操作人', ph: '请输入操作人' }, { l: '修改时间', type: 'daterange' }],
        tabs: [],
        toolbar: ['导出'],
        cols: [
          { p: 'orderNo', l: '订货单号', w: 140, t: 'link' },
          { p: 'field', l: '修改字段', w: 120 },
          { p: 'before', l: '修改前', w: 160 },
          { p: 'after', l: '修改后', w: 160 },
          { p: 'operator', l: '操作人', w: 100 },
          { p: 'createdAt', l: '修改时间', w: 170 }
        ],
        rows, ops: []
      };
    }
    if (key === 'bom/product') {
      const rows = M.products.map((p, i) => ({
        id: p.id, sku: p.sku, name: p.name, img: p.img, spec: p.spec,
        material: p.material, process: ['开料→封边→组装', '裁皮→车缝→扪皮', '打磨→喷漆→烘干'][i % 3],
        hours: 6 + (i % 9), cost: 800 + i * 320, state: '已维护'
      }));
      return {
        filters: [{ l: '产品名称', ph: '名称 / 编码' }, { l: '产品分类', type: 'select', opts: ['全部'].concat(M.cats.map((c) => c.name)) }, { l: '维护状态', type: 'select', opts: ['全部', '已维护', '未维护'] }],
        tabs: [['全部', 18], ['已维护', 15], ['未维护', 3]],
        toolbar: ['批量维护', '导出'],
        cols: [
          { p: 'name', l: '产品', w: 220, t: 'prod' },
          { p: 'sku', l: '产品编码', w: 120 },
          { p: 'spec', l: '规格', w: 150 },
          { p: 'material', l: '主材', w: 150 },
          { p: 'process', l: '工艺路线', w: 190 },
          { p: 'hours', l: '标准工时', w: 96, align: 'right', t: 'hour' },
          { p: 'cost', l: '标准成本', w: 110, align: 'right', t: 'money' },
          { p: 'state', l: '状态', w: 92, t: 'tag' }
        ],
        rows, ops: ['BOM', '工艺']
      };
    }
    if (key === 'refund/index') {
      const rows = M.orders.slice(0, 14).map((o, i) => ({
        id: 'RF' + i, no: 'TK2607' + String(100 + i), orderNo: o.no, customer: o.customer,
        amount: Math.round(o.amount * 0.3), reason: ['尺寸不符', '颜色差异', '物流破损', '客户取消'][i % 4],
        state: ['待审核', '已退款', '已驳回'][i % 3], createdAt: M.d(-i)
      }));
      return {
        filters: [{ l: '退款单号', ph: '请输入退款单号' }, { l: '订货单号', ph: '请输入订货单号' }, { l: '退款状态', type: 'select', opts: ['全部', '待审核', '已退款', '已驳回'] }],
        tabs: [['全部', 14], ['待审核', 5], ['已退款', 5], ['已驳回', 4]],
        toolbar: ['导出'],
        cols: [
          { p: 'no', l: '退款单号', w: 130, t: 'link' },
          { p: 'orderNo', l: '订货单号', w: 130, t: 'link' },
          { p: 'customer', l: '客户', w: 190 },
          { p: 'amount', l: '退款金额', w: 110, align: 'right', t: 'money' },
          { p: 'reason', l: '退款原因', w: 160 },
          { p: 'state', l: '状态', w: 96, t: 'tag' },
          { p: 'createdAt', l: '申请时间', w: 110 }
        ],
        rows, ops: ['审核', '详情']
      };
    }
    return base;
  }

  /* ============ 通用表格页 ============ */
  const TablePage = {
    props: ['rkey'],
    setup(props) {
      const conf = computed(() => confFor(props.rkey));
      const tab = ref(0);
      const page = ref(1);
      const size = ref(10);
      const sel = ref([]);
      const detail = ref(null);
      const rows = computed(() => {
        const all = conf.value.rows || [];
        const t = (conf.value.tabs || [])[tab.value];
        if (!t || t[0] === '全部' || tab.value === 0) return all;
        return all.filter((r) => Object.values(r).some((v) => String(v) === t[0]));
      });
      const paged = computed(() => rows.value.slice((page.value - 1) * size.value, page.value * size.value));
      const openDetail = (r) => { detail.value = r; };
      const act = (a) => ElMessage.info(a + '（原型演示）');
      return { conf, tab, page, size, sel, detail, rows, paged, openDetail, act, tagT, money, M };
    },
    template: `
    <div>
      <div class="filters" data-demo="查询条件">
        <div class="row">
          <div class="fi" v-for="(f,i) in conf.filters" :key="i">
            <label>{{ f.l }}</label>
            <el-input v-if="!f.type" :placeholder="f.ph" clearable />
            <el-select v-else-if="f.type==='select'" :placeholder="f.opts[0]" clearable>
              <el-option v-for="o in f.opts" :key="o" :label="o" :value="o" />
            </el-select>
            <el-date-picker v-else-if="f.type==='daterange'" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" style="width:230px" />
            <el-date-picker v-else-if="f.type==='month'" type="month" placeholder="选择月份" style="width:140px" />
          </div>
          <div class="acts">
            <el-button type="primary" size="small" @click="page=1">搜索</el-button>
            <el-button size="small">重置</el-button>
          </div>
        </div>
      </div>

      <div class="statbar" v-if="conf.tabs && conf.tabs.length" data-demo="状态分组">
        <div class="s" v-for="(t,i) in conf.tabs" :key="i" :class="{on: tab===i}" @click="tab=i;page=1">
          <span>{{ t[0] }}</span><el-badge class="count-badge" :value="String(t[1])" :show-zero="true" type="info" />
        </div>
      </div>

      <div class="tablecard">
        <div class="tb-bar">
          <el-button v-for="b in (conf.toolbar||[])" :key="b" size="small"
            :type="['新建采购单','批量结算','新建供应商','批量维护'].includes(b)?'primary':'default'"
            @click="act(b)">{{ b }}</el-button>
          <div class="right" @click="act('设置列字段')"><el-icon><Setting /></el-icon>设置列字段</div>
        </div>
        <el-table :data="paged" size="small" @selection-change="v=>sel=v" :row-key="r=>r.id" style="width:100%">
          <el-table-column type="selection" width="40" fixed />
          <el-table-column v-for="c in conf.cols" :key="c.l+c.p" :prop="c.p" :label="c.l" :width="c.w" :align="c.align||'left'"
            :show-overflow-tooltip="c.ellipsis" sortable>
            <template #default="s">
              <div v-if="c.t==='prod'" class="cellprod" style="cursor:pointer" @click="openDetail(s.row)">
                <img class="thumb" :src="s.row.productImg||s.row.img" alt="">
                <div><div class="nm">{{ s.row[c.p] }}</div><div class="sk">{{ c.detail ? '产品详情' : (s.row.sku || ('共 ' + (s.row.products||1) + ' 件商品')) }}</div></div>
              </div>
              <span v-else-if="c.t==='link'" class="link" @click="openDetail(s.row)">{{ s.row[c.p] }}</span>
              <div v-else-if="c.t==='tag'" ><el-tag size="small" :type="tagT(s.row[c.p])" effect="light">{{ s.row[c.p] }}</el-tag></div>
              <span v-else-if="c.t==='tagSt'"><span :style="{color: s.row.delay ? '#f56c6c' : '#909399', fontSize:'12px'}">{{ s.row[c.p] }}</span></span>
              <span v-else-if="c.t==='money'" class="num">{{ money(s.row[c.p]) }}</span>
              <span v-else-if="c.t==='pct'">{{ (s.row[c.p]*100).toFixed(1) }}%</span>
              <span v-else-if="c.t==='hour'">{{ s.row[c.p] }} h</span>
              <span v-else-if="c.t==='days'" :style="{color: s.row[c.p]<0 ? '#f56c6c' : '#606266'}">{{ s.row[c.p] }}天{{ s.row[c.p]<0 ? ' 逾期' : '' }}</span>
              <span v-else-if="c.t==='proc'">
                <span class="proc-tag" :class="{ok: s.row.processState==='已完成'}">{{ s.row.processState }} · {{ s.row.process }} [{{ s.row.startDate.slice(5) }}~{{ (s.row.endDate||'未定').slice(5) }}]</span>
              </span>
              <span v-else>{{ s.row[c.p] }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" :width="conf.ops && conf.ops.length>3 ? 118 : 150" fixed="right" v-if="(conf.ops||[]).length">
            <template #default="s">
              <div class="ops-cell"><span class="link" v-for="(o,i) in conf.ops" :key="i" @click="act(o)">{{ o }}</span></div>
            </template>
          </el-table-column>
        </el-table>
        <div class="tb-foot">
          <span class="sum">已选: <b>{{ sel.length }}</b> 合计数量: <b>{{ sel.reduce((a,b)=>a+(Number(b.qty)||Number(b.products)||0),0) }}</b></span>
          <el-pagination background layout="sizes, prev, pager, next, jumper" :total="rows.length" :page-sizes="[10,20,50]"
            v-model:current-page="page" v-model:page-size="size" />
        </div>
      </div>

      <el-drawer v-model="detail" title="详情" size="600px">
        <div v-if="detail">
          <div class="desc-grid" style="display:grid;grid-template-columns:1fr 1fr;column-gap:24px">
            <div v-for="(v,k) in detail" :key="k" style="display:flex;padding:8px 0;border-bottom:1px dashed #eef1f6;font-size:13px">
              <span style="width:110px;color:#909399">{{ k }}</span><span style="flex:1;color:#303133">{{ v }}</span>
            </div>
          </div>
        </div>
      </el-drawer>
    </div>`
  };

  /* ============ 工作台 ============ */
  const Workbench = {
    emits: ['go'],
    setup() {
      const stats = [
        { l: '今日新增', v: 0, c: 'linear-gradient(135deg,#5b8def,#4a7cf7)' },
        { l: '待处理总数', v: 334, c: 'linear-gradient(135deg,#8ba7f5,#6f8cf6)' },
        { l: '超过3天未处理', v: 334, c: 'linear-gradient(135deg,#9b8cf0,#7e6bea)' },
        { l: '生产逾期', v: 0, c: 'linear-gradient(135deg,#c9836b,#b96a52)' },
        { l: '本月已处理', v: 0, c: 'linear-gradient(135deg,#8cc98a,#6dbb70)' }
      ];
      const quick = [
        ['订货单', 'Tickets', '#6f8cf6'], ['已报价订单', 'Document', '#5bbf8a'], ['已下单订单', 'Files', '#e8a33d'],
        ['待排产订单', 'Timer', '#e2b93b'], ['待开工订单', 'Tools', '#4aa7d8'], ['生产中订单', 'SetUp', '#5b8def'],
        ['待入库订单', 'Box', '#7e6bea']
      ];
      const core = [
        ['订单产品数', '3.12'], ['待回款订单数', '1', '¥22万'], ['待回收金额', '¥22万'], ['已分配任务数', '0'],
        ['订单数', '1'], ['订单金额', '¥23.1万'], ['已回收金额', '¥11100'], ['生产中订单数', '32'],
        ['生产中订单金额', '¥207.8万'], ['已出库订单数', '0'], ['已出库订单金额', '¥0'], ['完工的产品数', '355.3287']
      ];
      const todo = [
        { t: '订货单待审批', hi: true, no: 'SO20261018003', by: '王海涛', ct: '10-18 09:12', pt: '', op: '处理' },
        { t: '交货单待确认出库', hi: false, no: 'JH20261018007', by: '李静', ct: '10-18 09:40', pt: '', op: '处理' },
        { t: '采购单待审核', hi: false, no: 'CG20261015012', by: '陈志远', ct: '10-15 14:26', pt: '', op: '处理' },
        { t: '退款申请待处理', hi: true, no: 'TK20261017009', by: '周慧', ct: '10-17 16:03', pt: '', op: '处理' },
        { t: '客户资料待完善', hi: false, no: 'KH20261016021', by: '吴敏', ct: '10-16 11:18', pt: '10-17 10:02', op: '查看' }
      ];
      return { stats, quick, core, todo, M, extra: window.B_EXTRA_INDEX || [] };
    },
    template: `
    <div class="wb-grid" data-demo="工作台（今日数据 / 待办 / 快捷入口）">
      <div>
        <div class="wb-card" style="margin-bottom:12px">
          <div class="wb-head"><i class="dotmark"></i>我的工作事项<span class="r">刷新数据</span></div>
          <div class="wb-mini">
            <el-input placeholder="输入订货单号/名称/内部单号" size="small"><template #append><el-button size="small">搜索</el-button></template></el-input>
            <el-select size="small" placeholder="请选择部门" style="width:150px"><el-option label="销售部" value="1" /></el-select>
            <span class="muted">个人</span>
            <el-select size="small" style="width:100px"><el-option label="个人" value="1" /></el-select>
            <span class="muted" style="margin-left:auto;cursor:pointer"><el-icon><Setting /></el-icon></span>
          </div>
          <div class="wb-stats">
            <div class="wb-stat" v-for="s in stats" :key="s.l" :style="{background:s.c}">
              <div class="l">{{ s.l }}</div><div class="v">{{ s.v }}<span>个</span></div>
              <div class="up">↗</div>
            </div>
          </div>
          <div style="border-top:1px solid #f0f2f5;margin-top:6px">
            <div class="todo-hd">
              <span>待办内容</span><span>单号</span><span>发起人</span><span>创建时间</span><span>处理时间</span><span>操作</span>
            </div>
            <div class="todo-row" v-for="(r,i) in todo" :key="i">
              <div class="t"><i :class="{hi:r.hi}"></i>{{ r.t }}</div>
              <div class="link">{{ r.no }}</div>
              <div>{{ r.by }}</div>
              <div class="muted">{{ r.ct }}</div>
              <div class="muted">{{ r.pt || '—' }}</div>
              <div><span class="link">{{ r.op }}</span></div>
            </div>
            <div class="empty-box" v-if="!todo.length" style="padding:66px 0 46px"><span class="icon">▤</span>暂无数据</div>
          </div>
        </div>

        <div class="wb-card" v-if="extra.length">
          <div class="wb-head"><i class="dotmark"></i>业务子页面入口<span class="r muted">线上隐藏路由，点击直达</span></div>
          <div class="ex-groups">
            <div class="ex-g" v-for="g in extra" :key="g.g">
              <div class="ex-gt">{{ g.g }}</div>
              <div class="ex-items">
                <span class="ex-i" v-for="it in g.items" :key="it[1]" @click="$emit('go', it[1])">{{ it[0] }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="profile-card">
          <div class="balls"></div>
          <div class="row1">
            <div class="av">张</div>
            <div><div class="hi">张松涛 你好！祝你开心每一天！</div>
              <div class="ts">登录于：2026-10-18 10:23:36</div></div>
          </div>
        </div>
        <div class="wb-card" style="margin-bottom:12px">
          <div class="wb-head"><i class="dotmark"></i>快捷入口
            <span class="r"><el-button size="small" type="primary" plain>+创建订货单</el-button>
            <el-button size="small" type="primary" plain>+创建交货单</el-button></span>
          </div>
          <div class="quick-grid">
            <div class="q" v-for="q in quick" :key="q[0]">
              <div class="b" :style="{background:q[2]}"><el-icon><component :is="q[1]" /></el-icon></div>
              <div class="t">{{ q[0] }}</div>
            </div>
          </div>
        </div>
        <div class="wb-card">
          <div class="wb-head"><i class="dotmark"></i>核心数据<span class="r" style="cursor:pointer">设置</span></div>
          <div style="display:flex;gap:8px;margin:-4px 0 12px">
            <el-select size="small" style="width:86px"><el-option label="老板" value="1" /></el-select>
            <el-date-picker type="daterange" size="small" start-placeholder="2026-10-01" end-placeholder="2026-10-31" style="flex:1" />
          </div>
          <div class="core-grid">
            <div class="c" v-for="(c,i) in core" :key="i">
              <div class="l">{{ c[0] }} <el-icon style="font-size:11px"><InfoFilled /></el-icon></div>
              <div class="v">{{ c[1] }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>`
  };

  /* ============ 数据看板 ============ */
  const Board = {
    setup() {
      const kpi = [
        ['进行中订单', '128', '+12.4%'], ['本月订货额', '¥286.4万', '+8.1%'],
        ['待回款金额', '¥62.3万', '-3.2%'], ['生产逾期单', '17', '+2'],
        ['本月出库', '96 单', '+6.5%'], ['平均交付周期', '23.4 天', '-1.2 天']
      ];
      const bars = [42, 58, 36, 71, 64, 88, 76, 54, 69, 82, 47, 61];
      const bars2 = [18, 26, 22, 31, 28, 40, 36, 24, 30, 38, 21, 27];
      const rank = M.customers.slice(0, 6);
      return { kpi, bars, bars2, rank, money };
    },
    template: `
    <div>
      <div class="kpi-row" data-demo="核心指标">
        <div class="kpi-box" v-for="k in kpi" :key="k[0]">
          <div class="l">{{ k[0] }}</div>
          <div class="v">{{ k[1] }}</div>
          <div class="d" :class="{down: k[2].startsWith('-')}">{{ k[2] }} 环比</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:12px">
        <div class="chart-card">
          <div class="h">订货额趋势<span class="r">单位：万元</span></div>
          <div class="bars">
            <div class="b" v-for="(v,i) in bars" :key="i"><em>{{ v }}</em><i :style="{height: v*1.7 + 'px'}"></i><span>{{ i+1 }}月</span></div>
          </div>
        </div>
        <div class="chart-card">
          <div class="h">订单量分布<span class="r">按渠道</span></div>
          <div class="bars">
            <div class="b" v-for="(v,i) in bars2" :key="i"><em>{{ v }}</em><i :style="{height: v*3 + 'px', background:'linear-gradient(180deg,#9bd0a3,#6dbb70)'}"></i><span>{{ i+1 }}月</span></div>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="chart-card">
          <div class="h">客户成交排行<span class="r">近 30 天</span></div>
          <el-table :data="rank" size="small">
            <el-table-column type="index" label="#" width="46" />
            <el-table-column prop="company" label="客户" show-overflow-tooltip />
            <el-table-column prop="orders" label="订单数" width="90" align="right" />
            <el-table-column label="成交金额" width="120" align="right">
              <template #default="s"><span class="num">{{ money(s.row.amount) }}</span></template>
            </el-table-column>
          </el-table>
        </div>
        <div class="chart-card">
          <div class="h">生产状态分布<span class="r">实时</span></div>
          <el-table :data="[
            {s:'待排产',n:107,p:'28.2%'},{s:'排产中',n:50,p:'13.2%'},{s:'待开工',n:79,p:'20.8%'},
            {s:'生产中',n:36,p:'9.5%'},{s:'生产完成',n:61,p:'16.1%'},{s:'生产逾期',n:46,p:'12.1%'}]" size="small">
            <el-table-column prop="s" label="状态" />
            <el-table-column prop="n" label="任务数" width="100" align="right" />
            <el-table-column prop="p" label="占比" width="100" align="right" />
          </el-table>
        </div>
      </div>
    </div>`
  };

  /* ============ 生产进度看板 ============ */
  const Tracking = {
    setup() {
      const cols = ['待排产', '排产中', '待开工', '生产中', '生产完成'];
      const groups = computed(() => cols.map((c) => ({
        name: c, items: M.tasks.filter((t) => t.status === c).slice(0, 6)
      })));
      return { groups, money };
    },
    template: `
    <div class="kb" data-demo="生产进度泳道">
      <div class="kb-col" v-for="g in groups" :key="g.name">
        <div class="h"><i class="dotmark" style="width:6px;height:6px;border-radius:50%;background:#4981ff;display:inline-block"></i>{{ g.name }}<el-badge class="count-badge" :value="String(g.items.length)" :show-zero="true" type="info" /></div>
        <div class="kb-item" v-for="t in g.items" :key="t.id">
          <div class="t">{{ t.product }}</div>
          <div class="m"><span>{{ t.taskNo }}</span><span>{{ t.owner }}</span></div>
          <div class="m"><span>{{ t.orderNo }}</span></div>
          <div class="bar"><i :style="{width: (20 + (t.qty*6)%80) + '%'}"></i></div>
        </div>
        <div v-if="!g.items.length" class="muted" style="text-align:center;padding:20px 0">暂无任务</div>
      </div>
    </div>`
  };

  /* ============ 打印中心 ============ */
  const PrintCenter = {
    setup() {
      const items = [
        ['销售单/合同', 'Document', '按订货单批量生成销售合同'],
        ['交货单', 'Van', '生成交货单并打印随货联'],
        ['生产指令单', 'Tickets', '下发车间的生产指令单'],
        ['外箱标签', 'PriceTag', '按箱规生成外箱标签'],
        ['物料标签', 'CollectionTag', '物料入库标签打印'],
        ['质检报告', 'DocumentChecked', '按批次生成质检报告'],
        ['条码贴纸', 'Postcard', '自定义条码贴纸模板']
      ];
      return { items, act: (n) => ElMessage.info('打开「' + n + '」打印面板（原型演示）') };
    },
    template: `
    <div>
      <div class="filters" style="margin-bottom:12px">
        <div class="row">
          <div class="fi"><label>订货单号</label><el-input placeholder="请输入订货单号" style="width:220px" /></div>
          <div class="fi"><label>打印时间</label><el-date-picker type="daterange" start-placeholder="开始" end-placeholder="结束" style="width:230px" /></div>
          <div class="acts"><el-button type="primary" size="small">搜索</el-button><el-button size="small">重置</el-button></div>
        </div>
      </div>
      <div class="print-grid">
        <div class="print-card" v-for="i in items" :key="i[0]" @click="act(i[0])">
          <div class="ic"><el-icon><component :is="i[1]" /></el-icon></div>
          <div><div class="t">{{ i[0] }}</div><div class="d">{{ i[2] }}</div></div>
        </div>
      </div>
      <div class="tablecard" style="margin-top:12px">
        <div class="tb-bar"><b style="font-size:14px">最近打印记录</b></div>
        <el-table :data="[
          {t:'2026-10-18 09:42',u:'张松涛',d:'销售单/合同',n:'S26062305',c:'成功'},
          {t:'2026-10-17 17:21',u:'曾燕然',d:'交货单',n:'JH26061204',c:'成功'},
          {t:'2026-10-17 15:08',u:'袁彩怡',d:'外箱标签',n:'S26062312',c:'成功'},
          {t:'2026-10-16 11:33',u:'陈子墨',d:'生产指令单',n:'T2507703-1',c:'失败'}]" size="small">
          <el-table-column prop="t" label="打印时间" width="180" />
          <el-table-column prop="u" label="操作人" width="120" />
          <el-table-column prop="d" label="单据类型" width="160" />
          <el-table-column prop="n" label="关联单号" width="180" />
          <el-table-column prop="c" label="结果">
            <template #default="s"><el-tag size="small" :type="s.row.c==='成功'?'success':'danger'">{{ s.row.c }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作"><template #default><span class="link">重新打印</span></template></el-table-column>
        </el-table>
      </div>
    </div>`
  };

  /* ============ 系统设置 ============ */
  /* ============ 系统设置（按菜单分为四个页面） ============ */
  const SETTING_DEFS = {
    'settings/index': {
      title: '系统设置', desc: '订货单模板、业务流转与数据维护',
      secs: [
        {
          h: '订货单 / 合同条款', sub: '自定义订货单、合同模板中的条款内容',
          items: [{ k: 'clause', l: '条款内容', t: 'textarea', rows: 5,
            v: '1. 本合同自双方签字盖章之日起生效。\n2. 需方应在签订合同时支付 30% 定金。\n3. 供方应在收到定金后 30 个工作日内完成生产。' }]
        },
        {
          h: '业务流程', sub: '控制订货单流转中的自动化行为',
          items: [
            { k: 'autoAudit', l: '订货单提交后自动审核', t: 'switch', v: true },
            { k: 'sms', l: '发货前短信通知客户', t: 'switch', v: false },
            { k: 'days', l: '订单停留预警天数', t: 'number', v: 15 }
          ]
        },
        {
          h: '数据与备份', sub: '演示数据的导出与清理（原型内写入 localStorage）',
          items: [
            { k: 'backup', l: '每日自动备份', t: 'switch', v: true },
            { k: 'keep', l: '备份保留天数', t: 'number', v: 90 }
          ]
        }
      ]
    },
    'settings/customer': {
      title: '客户管理设置', desc: '客户标签、公海回收与查重规则',
      secs: [
        {
          h: '客户标签', sub: '标签用于客户分层与筛选，可拖到客户卡片上',
          items: [{ k: 'tags', l: '标签（逗号分隔）', t: 'input', v: 'A 类客户, B 类客户, C 类客户, 重点客户, 待激活' }]
        },
        {
          h: '公海回收', sub: '客户在私海长期无跟进时自动回到公海',
          items: [
            { k: 'poolDays', l: '无跟进回收天数', t: 'number', v: 30 },
            { k: 'poolNotice', l: '回收前 3 天提醒负责人', t: 'switch', v: true }
          ]
        },
        {
          h: '查重规则', sub: '新增客户时按以下字段判重',
          items: [{ k: 'dup', l: '判重字段', t: 'select', opts: ['手机号', '客户名称 + 手机号', '仅客户名称'], v: '客户名称 + 手机号' }]
        }
      ]
    },
    'settings/product': {
      title: '产品管理设置', desc: '编码规则、价格策略与库存预警',
      secs: [
        {
          h: '编码规则', sub: '新增产品时自动生成 SKU',
          items: [
            { k: 'skuRule', l: 'SKU 规则', t: 'select', opts: ['品类 + 流水号', '品牌 + 品类 + 流水号', '手工录入'], v: '品类 + 流水号' },
            { k: 'skuPrefix', l: '流水号前缀', t: 'input', v: 'SF-' }
          ]
        },
        {
          h: '价格策略', sub: '面价与销售价之间的换算关系',
          items: [
            { k: 'faceRate', l: '面价系数（销售价 × N）', t: 'number', v: 1.15 },
            { k: 'minRate', l: '最低折扣限制', t: 'number', v: 0.8 }
          ]
        },
        {
          h: '库存预警', sub: '低于安全库存时在货盘中心高亮',
          items: [
            { k: 'warn', l: '开启库存预警', t: 'switch', v: true },
            { k: 'safe', l: '安全库存默认值', t: 'number', v: 5 }
          ]
        }
      ]
    },
    'settings/manage': {
      title: '管理设置', desc: '角色权限矩阵与审批流',
      secs: [
        {
          h: '审批流', sub: '订货单金额超过阈值时进入审批',
          items: [
            { k: 'approve', l: '需要审批', t: 'switch', v: true },
            { k: 'amount', l: '审批金额阈值（元）', t: 'number', v: 50000 },
            { k: 'approver', l: '审批人', t: 'select', opts: ['张松涛', '王海涛', '曾燕然'], v: '王海涛' }
          ]
        }
      ],
      matrix: true
    }
  };

  const Settings = {
    components: { ProcessCatalog: EX.comps.ProcessCatalog, ProcessRoutes: EX.comps.ProcessRoutes },
    props: ['rkey'],
    setup(props) {
      const S = window.SHARED;
      const key = SETTING_DEFS[props.rkey] ? props.rkey : 'settings/index';
      const def = SETTING_DEFS[key];
      const form = reactive({});
      def.secs.forEach((sec) => sec.items.forEach((it) => { form[it.k] = it.v; }));
      const saved = S.store.get('b:setting:' + key);
      if (saved) Object.assign(form, saved.form || saved);
      const save = () => {
        const snapshot = { version: 2, form: S.clone(form), matrix: S.clone(matrix) };
        if (S.store.set('b:setting:' + key, snapshot) === false) return;
        ElMessage.success(def.title + '已保存（本地演示）');
      };
      const reset = () => {
        const snapshot = S.store.get('b:setting:' + key);
        def.secs.forEach((sec) => sec.items.forEach((it) => { form[it.k] = it.v; }));
        if (snapshot) Object.assign(form, snapshot.form || snapshot);
        perms.forEach(p => roles.forEach(r => { matrix[p][r] = snapshot?.matrix?.[p]?.[r] ?? defaultPermission(p, r); }));
        ElMessage.success(snapshot ? '已恢复上次保存值' : '已恢复初始值');
      };
      /* 角色权限矩阵（管理设置） */
      const roles = ['老板', '销售总监', '销售员', '跟单员', '供应商'];
      const perms = ['订货单', '交货单', '采购', '付款', '统计报表', '系统设置'];
      const matrix = reactive({});
      const defaultPermission = (p, r) => !(r === '供应商' && p !== '订货单') && !(r === '销售员' && (p === '系统设置' || p === '付款'));
      perms.forEach((p) => { matrix[p] = {}; roles.forEach((r) => { matrix[p][r] = saved?.matrix?.[p]?.[r] ?? defaultPermission(p, r); }); });
      return { def, form, save, reset, roles, perms, matrix, settingsTab:ref('existing'), beforeSettingsTab:async()=>{const g=S.activeLeaveGuard,unchanged=g?.checkpoint?.();if(g?.dirty()){try{await ElMessageBox.confirm('工序尚未保存，确定放弃？','未保存的工序',{confirmButtonText:'放弃修改并离开',cancelButtonText:'继续编辑'});if(unchanged&&!unchanged()){ElMessage.warning('确认期间设置输入已变化，请重新确认');return false;}}catch(e){return false;}}return true;}, showCatalog:key==='settings/index' };
    },
    template: `
    <div style="max-width:100%;min-width:0">
      <el-tabs v-if="showCatalog" v-model="settingsTab" :before-leave="beforeSettingsTab"><el-tab-pane label="现有设置" name="existing"/><el-tab-pane label="工序管理" name="process"/><el-tab-pane label="工艺路线管理" name="routes"/></el-tabs>
      <ProcessCatalog v-if="showCatalog&&settingsTab==='process'"/>
      <ProcessRoutes v-else-if="showCatalog&&settingsTab==='routes'"/>
      <div v-else>
      <div class="st-hd" style="margin-bottom:12px">
        <div><h2>{{ def.title }}</h2><p class="muted">{{ def.desc }}</p></div>
      </div>
      <div class="set-card" v-for="sec in def.secs" :key="sec.h" data-demo="设置分区（保存后重新进入可回读）">
        <div class="h">{{ sec.h }}</div>
        <div class="sub">{{ sec.sub }}</div>
        <el-form label-width="200px" v-if="sec.items.length > 1 || sec.items[0].t !== 'textarea'">
          <el-form-item v-for="it in sec.items" :key="it.k" :label="it.l">
            <el-switch v-if="it.t==='switch'" v-model="form[it.k]" />
            <el-input-number v-else-if="it.t==='number'" v-model="form[it.k]" :min="0" />
            <el-select v-else-if="it.t==='select'" v-model="form[it.k]" style="width:260px">
              <el-option v-for="o in it.opts" :key="o" :label="o" :value="o" />
            </el-select>
            <el-input v-else v-model="form[it.k]" style="width:420px" />
          </el-form-item>
        </el-form>
        <el-input v-else v-model="form[sec.items[0].k]" type="textarea" :rows="sec.items[0].rows||5" />
      </div>

      <div class="set-card" v-if="def.matrix" data-demo="角色权限矩阵（6 模块 × 5 角色）">
        <div class="h">角色权限矩阵</div>
        <div class="sub">本地演示：勾选并保存角色访问配置；不改变当前菜单，不代表真实账号鉴权。</div>
        <el-table :data="perms.map(p=>({ p: p }))" size="small" border>
          <el-table-column label="模块" prop="p" width="150" />
          <el-table-column v-for="r in roles" :key="r" :label="r" align="center">
            <template #default="s"><el-checkbox v-model="matrix[s.row.p][r]" :aria-label="s.row.p + ' / ' + r" /></template>
          </el-table-column>
        </el-table>
      </div>

      <div style="display:flex;gap:10px;margin-top:4px">
        <el-button type="primary" @click="save">保存设置</el-button>
        <el-button @click="reset">恢复上次保存</el-button>
      </div>
      </div>
    </div>`
  };

  /* ============ 抽奖活动 ============ */
  const Lucky = {
    props:['nav'],
    setup(props) {
      const seed = Array.from({ length: 8 }, (_, i) => ({
        id: i, name: ['周年庆抽奖', '双十一转盘', '到店礼抽奖', '新客首单抽奖'][i % 4] + (i > 3 ? ' · ' + (i - 3) : ''),
        prize: ['戴森吹风机', '沙发抵用券 500', '抱枕套装', '全屋软装设计'][i % 4],
        join: 120 + i * 37, win: 8 + i * 4, state: i % 3 === 2 ? '已结束' : '进行中', end: M.d(10 + i)
      }));
      const keyword=ref(''),state=ref('');
      const added=(window.SHARED.store.get('b:doc:lucky/add')||[]).map(r=>({id:r.__id,name:r.name,prize:r.first,join:0,win:0,state:r.end<new Date().toISOString().slice(0,10)?'已结束':'进行中',end:r.end}));
      const rows=computed(()=>added.concat(seed).filter(r=>(!keyword.value||r.name.includes(keyword.value))&&(!state.value||r.state===state.value)));
      return { rows, tagT, keyword, state, nav:props.nav };
    },
    template: `
    <div>
      <div class="filters" style="margin-bottom:12px">
        <div class="row">
          <div class="fi"><label>活动名称</label><el-input v-model="keyword" clearable placeholder="请输入活动名称" style="width:200px" /></div>
          <div class="fi"><label>状态</label><el-select v-model="state" clearable placeholder="全部" style="width:140px"><el-option label="进行中" value="进行中" /><el-option label="已结束" value="已结束" /></el-select></div>
          <div class="acts"><el-button type="primary" size="small" @click="keyword=keyword.trim()">搜索</el-button><el-button size="small" @click="nav('lucky/add')">+ 新建抽奖</el-button></div>
        </div>
      </div>
      <div class="print-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="print-card" v-for="r in rows" :key="r.id" style="flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <div class="ic" style="width:36px;height:36px;font-size:16px"><el-icon><Present /></el-icon></div>
            <div class="t" style="font-size:13px">{{ r.name }}</div>
            <el-tag size="small" style="margin-left:auto" :type="tagT(r.state)">{{ r.state }}</el-tag>
          </div>
          <div class="d">奖品：{{ r.prize }}</div>
          <div class="d">参与 {{ r.join }} 人 · 中奖 {{ r.win }} 人</div>
          <div class="d">截止：{{ r.end }}</div>
        </div>
      </div>
    </div>`
  };

  /* ============ 由 schema 生成列表页配置（真实字段来自线上系统） ============ */
  function adaptFilters(fs) {
    return (fs || []).map((f) => ({
      label: f.l || f.label, key: f.l || f.label, ph: f.ph,
      type: f.type === 'daterange' ? 'daterange' : (f.type === 'select' ? 'select' : 'input'),
      opts: f.opts
    }));
  }

  function confFor(key) {
    const leg = legacyConf(key) || {};
    const sp = SCHEMA_B[key];
    const built = sp && sp.cols && sp.cols.length ? window.SHARED.buildConf(sp, key) : null;

    if (!built) {
      // 无 schema：退回旧配置，仅做结构转换
      return {
        title: NAME[key], filters: adaptFilters(leg.filters),
        tabs: (leg.tabs || []).filter((t) => t[0] !== '全部').map(([label, count]) => ({ label, count, key: label })),
        allLabel: (leg.tabs || []).length ? '全部' : '',
        toolbar: { left: leg.toolbar || ['新增', '导出'] },
        cols: (leg.cols || []).map((c) => ({ prop: c.p, label: c.l, width: c.w, type: c.t === 'link' ? 'link' : (c.t === 'money' ? 'money' : (c.t === 'tag' ? 'tag' : 'text')), align: c.t === 'money' ? 'right' : 'left' })),
        rows: (leg.rows || []).map((r, i) => Object.assign({ id: 'L' + i }, r)),
        ops: leg.ops || ['编辑', '删除']
      };
    }

    const tabList = (leg.tabs || []).filter((t) => t[0] !== '全部').map(([label, count]) => ({ label, count, key: label }));
    let tb = (leg.toolbar && leg.toolbar.length) ? leg.toolbar.slice() : (built.toolbar.left || []).slice();
    /* 线上有独立编辑页的模块，工具栏必须有新增入口 */
    if (NEW_ROUTE[key] && !tb.some((b) => /新增|新建|创建/.test(b))) tb = [NEW_LABEL[NEW_ROUTE[key]] || '新增'].concat(tb);
    if (key === 'project/index') tb = tb.filter((b) => b !== '新增');
    /* 工具栏里需要附带「跳到子页面」的按钮（如供应商 → 账号管理） */
    const navs = (EX.navButtons || {})[key];
    if (navs) tb = tb.concat(Object.keys(navs).filter((k) => tb.indexOf(k) < 0));
    if(key==='project/index'){
      const db=window.SHARED.db,all=db.all('orders'),unique=k=>[...new Set(all.map(o=>o[k]).filter(Boolean))];
      built.filters=[
        {key:'order',label:'订货单',type:'input',ph:'请输入订货单名称/编号/内部单号',width:190,test:(r,v)=>[r.__record?.no,r.__record?.name,r.__record?.innerNo].join(' ').includes(v)},
        {key:'product',label:'产品',type:'input',ph:'请输入产品名称',width:190,test:(r,v)=>(r.__record?.items||[]).some(l=>l.name.includes(v))},
        {key:'contact',label:'C端/业主',type:'select',ph:'请输入名称或手机号码',width:190,opts:unique('customerName'),test:(r,v)=>(r.__record.customerName+' '+r.__record.phone).includes(v)},
        {key:'partner',col:'订单归属(合作商)',label:'订单归属(合作商)',type:'select',ph:'请输入名称或手机号码',width:190,opts:unique('customer')},
        {key:'partnerType',label:'合作商类型',type:'select',ph:'全部',opts:['经销商','直营','工程单'],width:150,test:(r,v)=>r.__record.partnerType===v},
        {key:'sale',col:'销售',label:'销售',type:'select',ph:'请选择销售',width:190,opts:unique('owner')},
        {key:'follower',col:'跟单',label:'跟单',type:'select',ph:'请选择跟单',width:190,opts:unique('follower')},
        {key:'newSale',col:'副销售',label:'副销售',type:'select',ph:'请选择副销售',width:190,opts:unique('newSale')},
        {key:'paid',col:'回款状态',label:'回款状态',type:'select',ph:'全部',width:190,opts:['未回款','部分回款','全部回款']},
        {key:'dates',col:'订货日期',label:'订货时间',type:'daterange',width:260},
        {key:'overdue',label:'逾期订货单',type:'checkbox',test:(r,v)=>!v||(r.__record.delivery&&r.__record.delivery<new Date().toISOString().slice(0,10)&&!['已出库','已完成','已作废'].includes(r.__record.state))}
      ];
      const orderColumns=[['订单号',195],['内部单号',171],['订单归属(合作商)',171],['产品数量',64],['订货单金额',80],['已回款金额',80],['交货日期',90],['任务数',54],['采购单数',54],['生产进度',64],['订货单状态',80],['停留时长',80],['回款状态',68],['订货日期',80],['开工日期',90],['C端/业主',80],['截止日期',90],['销售',75],['跟单',75],['副销售',75],['材质对接',68]];
      built.cols=orderColumns.map(([label,width])=>{const c=built.cols.find(c=>c.label===label)||{prop:label,label};return Object.assign({},c,{width,minWidth:width,exactWidth:true,sortable:false,fixed:label==='订单号'?'left':false,type:label==='订单号'?'link':/金额/.test(label)?'money':label==='订货单状态'?'tag':label==='生产进度'?'progress':'text'});});
      built.hideTitle=true;built.primaryInFilters=true;built.searchable=false;built.selectable=false;
      built.tabs=['方案(草稿)','已下单','待制图','待排产','待开工','生产中','待入库','已入库','待出库','已出库','已作废'].map(label=>({label,key:label==='方案(草稿)'?'草稿':label}));
      built.statusKey='订货单状态';built.ops=['复制',{label:'编辑',show:r=>['草稿','方案(草稿)'].includes(r.__record?.state)},{label:'作废',show:r=>!['草稿','方案(草稿)','已作废'].includes(r.__record?.state)},'导出'];tb=['新增订货单'];
    }
    if(key==='reconciliation/index'){
      tb=['新增付款单'];built.hideTitle=true;built.searchable=false;
      built.filters=[{key:'created',col:'创建时间',label:'创建时间',type:'daterange',width:260},{key:'audit',col:'审核状态',label:'审核状态',type:'select',ph:'全部审核状态',width:160,opts:['待审核','已审核','已驳回']},{key:'pay',col:'付款状态',label:'付款状态',type:'select',ph:'全部付款状态',width:160,opts:['待付款','已付款']},{key:'supplier',col:'供应商名称',label:'供应商',type:'select',ph:'选择供应商',width:190,opts:[...new Set(window.SHARED.db.all('payments').map(p=>p.supplier))]},{key:'number',col:'付款单号',label:'付款单号',type:'input',width:170},{key:'purchase',label:'采购单号',type:'input',width:170,test:(r,v)=>{const p=r.__record||{},ids=[p.purchaseNo,...(p.purchaseNos||[]),...(p.items||[]).map(x=>x.purchaseNo||x['采购单'])].filter(Boolean);return ids.some(x=>String(x).includes(v));}},{key:'order',label:'订货单号',type:'input',width:170,test:(r,v)=>{const p=r.__record||{},ids=[p.purchaseNo,...(p.purchaseNos||[]),...(p.items||[]).map(x=>x.purchaseNo||x['采购单'])].filter(Boolean);return [p.orderNo,...window.SHARED.db.all('purchases').filter(x=>p.purchaseIds?.length?p.purchaseIds.includes(x.id):ids.includes(x.no)||ids.includes(x.id)).map(x=>x.orderNo)].filter(Boolean).some(x=>String(x).includes(v));}},{key:'inner',label:'内部单号',type:'input',width:170,test:(r,v)=>{const p=r.__record||{},ids=[p.purchaseNo,...(p.purchaseNos||[]),...(p.items||[]).map(x=>x.purchaseNo||x['采购单'])].filter(Boolean);return [p.innerNo,...window.SHARED.db.all('purchases').filter(x=>p.purchaseIds?.length?p.purchaseIds.includes(x.id):ids.includes(x.no)||ids.includes(x.id)).map(x=>x.innerNo||window.SHARED.db.all('orders').find(o=>o.no===x.orderNo)?.innerNo)].filter(Boolean).some(x=>String(x).includes(v));}}];
    }
    return Object.assign({}, built, {
      newRoute: NEW_ROUTE[key] || '',
      navButtons: navs || null,
      tabs: key==='project/index'?built.tabs:(tabList.length ? tabList : built.tabs),
      allLabel: (tabList.length || built.tabs.length) ? '全部' : '',
      toolbar: { left: tb },
      ops: key==='project/index'?built.ops:((leg.ops && leg.ops.length) ? leg.ops : built.ops),
      filters: built.filters.length ? built.filters : adaptFilters(leg.filters)
    });
  }

  /* ============ 新增 / 编辑订货单（线上 /project/add 完整编辑器） ============ */
  const ORDER_LINE_COLS = ['序号', '产品图片', '名称', '编号', '区域', '品牌', '材料/颜色', '规格尺寸', '产品说明', '皮革', '布艺', '大理石', '操作'];
  const ORDER_FEE_KEYS = [
    ['产品合计', 'qty'], ['产品面价总价', 'face'], ['订货总价', 'order'], ['优惠金额', 'discount'],
    ['开单金额', 'invoice'], ['木架费', 'crate'], ['安装运输', 'install'], ['税金', 'tax'],
    ['佣金', 'commission'], ['设计费', 'design'], ['服务费', 'service'], ['运费', 'freight']
  ];

  const OrderEdit = {
    props: ['nav', 'id','editApply'],
    setup(props) {
      const S = window.SHARED;
      const validAmount=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
      const amountSum=values=>{if(!values.every(validAmount))return null;const total=values.reduce((n,v)=>n+v,0);return Number.isFinite(total)?total:null;};
      const lineAmount=(qty,price)=>validAmount(qty)&&validAmount(price)&&Number.isFinite(qty*price)?qty*price:null;
      const feeValue=n=>n==null||n===''?0:n;
      const money=n=>validAmount(n)?'¥'+n.toLocaleString('zh-CN'):'未记录';
      const today = () => new Date().toISOString().slice(0, 10);
      const head = reactive({
        name: '', innerNo: '', partner: '', ownerCustomer: '', sale: '张松涛', newSale: '',
        follower: '张松涛', orderAt: today(), delivery: '', remark: ''
      });
      const lines = ref([]);
      const fees = reactive({ discount: 0, crate: 0, install: 0, tax: 0, commission: 0, design: 0, service: 0, freight: 0 });
      const editing = ref(props.id || '');
      const pickOpen = ref(false);
      const picked = ref([]),editorMediaBusy=ref(0);let productPickerBase=null;
      const isEdit = computed(() => !!editing.value);
      const amendment=!!props.editApply,amendBase=S.clone(S.db.find('orders',editing.value)||{}),amend=reactive({open:false,reason:'',changes:[],proposal:null,error:'',saving:false});
      const amendmentProposal=()=>Object.assign(S.clone(amendBase),{name:head.name,innerNo:head.innerNo,customer:head.partner,customerName:head.ownerCustomer,owner:head.sale,newSale:head.newSale,follower:head.follower,createdAt:head.orderAt,delivery:head.delivery,remark:head.remark,items:S.clone(lines.value),fees:S.clone(fees)});
      let amendmentSaved=false;const amendDirty=()=>amendment&&!amendmentSaved&&(S.orderAmendDiff(amendBase,amendmentProposal()).length>0||pickOpen.value&&picked.value.length>0||editorMediaBusy.value>0||importBusy.value||!!importPreview.value||!!amend.reason);
      const leaveAmend=e=>{if(amendDirty()){e.preventDefault();e.returnValue='';}};
      if(amendment){const release=S.registerLeaveGuard(amendDirty,'未保存的改单',()=>JSON.stringify({proposal:amendmentProposal(),picker:pickOpen.value,picked:picked.value,pending:editorMediaBusy.value,importBusy:importBusy.value,importPreview:importPreview.value,amendReason:amend.reason}));Vue.onUnmounted(release);window.addEventListener('beforeunload',leaveAmend);Vue.onUnmounted(()=>window.removeEventListener('beforeunload',leaveAmend));}
      const confirmAmend=()=>{if(!editorAlive||amend.saving)return;if(pickOpen.value||editorMediaBusy.value||JSON.stringify(amendmentProposal())!==JSON.stringify(amend.proposal)){amend.error='改单预览与当前输入已变化，请关闭预览并重新提交申请';return;}amend.error='';amend.saving=true;try{S.submitOrderAmendment(editing.value,amend.proposal,amend.reason,amendBase);amendmentSaved=true;amend.open=false;ElMessage.success('改单申请已保存到本机，待审核（Mock）');props.nav('editApply/list');}catch(e){amend.error=e.message;}finally{amend.saving=false;}};

      /* 打开时回读草稿（同单跨页可追踪） */
      if (editing.value) {
        const entity = S.db.find('orders',editing.value);
        if(entity){Object.assign(head,{name:entity.name||entity.productName,innerNo:entity.innerNo||'',partner:entity.customer||'',ownerCustomer:entity.customerName||'',sale:entity.owner??'',newSale:entity.newSale||'',follower:entity.follower||'',orderAt:String(entity.createdAt).slice(0,10),delivery:entity.delivery||'',remark:entity.remark||''});lines.value=S.clone(entity.items||[]);Object.assign(fees,entity.fees||{});}
        const saved = !entity && (S.store.get('b:orders') || []).find((o) => o['订单号'] === editing.value);
        if (saved) {
          head.name = saved['订货单名称'] || head.name;
          head.innerNo = saved['内部单号'] || '';
          head.partner = saved['订单归属(合作商)'] || '';
          head.delivery = saved['交货日期'] || '';
          head.remark = saved['订货单说明'] || '';
          lines.value = saved.__lines || [];
          Object.assign(head,saved.__head||{});Object.assign(fees,saved.__fees||{});
        }
      }

      let editorBase=editing.value?JSON.stringify(S.db.find('orders',editing.value)||null):null;
      const editorSnapshot=()=>JSON.stringify({head,lines:lines.value,fees});
      let editorBaseline=editorSnapshot();
      const editorGuardSnapshot=()=>JSON.stringify({input:editorSnapshot(),picker:pickOpen.value,picked:picked.value,pending:editorMediaBusy.value,importOpen:importOpen.value,importBusy:importBusy.value,importPreview:importPreview.value,amendReason:amend.reason});const editorDirty=()=>amendment?amendDirty():editorSnapshot()!==editorBaseline||pickOpen.value&&picked.value.length>0||editorMediaBusy.value>0||importBusy.value||!!importPreview.value;
      const editorLeave=e=>{if(editorDirty()){e.preventDefault();e.returnValue='';}};
      if(!amendment){const release=S.registerLeaveGuard(editorDirty,'未保存的订货单',editorGuardSnapshot);Vue.onUnmounted(release);window.addEventListener('beforeunload',editorLeave);Vue.onUnmounted(()=>window.removeEventListener('beforeunload',editorLeave));}
      const markEditorSaved=()=>{editorBase=editing.value?JSON.stringify(S.db.find('orders',editing.value)||null):null;editorBaseline=editorSnapshot();};

      const qtySum = computed(() => lines.value.reduce((a, l) => a + Number(l.qty || 0), 0));
      const orderTotal = computed(() => amountSum(lines.value.map(l=>lineAmount(l.qty,l.price))));
      const faceTotal = computed(() => amountSum(lines.value.map(l=>lineAmount(l.qty,l.face))));
      const invoice = computed(() => validAmount(orderTotal.value)&&validAmount(feeValue(fees.discount))?Math.max(0,orderTotal.value-feeValue(fees.discount)):null);
      const extra = computed(() => amountSum(['crate','install','tax','commission','design','service','freight'].map(k=>feeValue(fees[k]))));
      const receivable = computed(() => amountSum([invoice.value,extra.value]));
      const received = computed(() => {if(!editing.value)return 0;const a=S.db.all('orders').filter(o=>o.id===editing.value||o.no===editing.value);return a.length===1&&validAmount(a[0].paid)?a[0].paid:null;});

      const materialTypes = [['leather','皮面'],['fabric','布面'],['marble','大理石'],['metal','金属'],['paint','油漆'],['sponge','海绵'],['wood','木面']];
      const selectedLines = ref([]), importOpen = ref(false), materialOpen = ref(false), materialTarget = ref(null);
      const importFile=ref(null), importBusy=ref(false), importPreview=ref(null), importError=ref('');let importEpoch=0,importContext=null;watch(importOpen,()=>{importEpoch++;importPreview.value=null;importContext=null;importBusy.value=false;});
      const chooseImport=()=>importFile.value.click();
      const readImport=async event=>{
        const file=event.target.files[0];event.target.value='';if(!file||!editorAlive||!importOpen.value||importBusy.value)return;const epoch=++importEpoch,input=editorSnapshot(),catalog=JSON.stringify(S.db.all('products'));
        importPreview.value=null;importError.value='';
        if(!/\.xlsx?$/i.test(file.name)||file.size<=0||file.size>2*1024*1024){importError.value='本机支持2MB以内非空 .xls / .xlsx：1个工作表、200行含空位、100列，不接受公式';return;}
        importBusy.value=true;
        try{const bytes=await file.arrayBuffer();if(!editorAlive||!importOpen.value||epoch!==importEpoch)return;if(editorSnapshot()!==input||JSON.stringify(S.db.all('products'))!==catalog)throw Error('读取期间订货输入或产品目录已变化，请重新选择文件');const wb=XLSX.read(bytes,{type:'array',cellStyles:true,sheetRows:201});importPreview.value=S.parseOrderSheet(wb);importContext={input,catalog,preview:JSON.stringify(importPreview.value)};}catch(e){if(editorAlive&&epoch===importEpoch)importError.value=e.message||'Excel 解析失败';}finally{if(epoch===importEpoch)importBusy.value=false;}
      };
      const confirmImport=()=>{if(!editorAlive||!importOpen.value||!importPreview.value||importBusy.value)return;if(!importContext||editorSnapshot()!==importContext.input||JSON.stringify(S.db.all('products'))!==importContext.catalog||JSON.stringify(importPreview.value)!==importContext.preview)return ElMessage.warning('导入预览或订货输入已变化，请重新读取文件');lines.value.push(...importPreview.value.rows);ElMessage.success('已追加 '+importPreview.value.rows.length+' 行产品明细');importOpen.value=false;importPreview.value=null;};
      const closeImport=async done=>{if(importBusy.value)return ElMessage.warning('工作簿正在读取，请稍候');const epoch=importEpoch,input=JSON.stringify(importPreview.value);if(importPreview.value){try{await ElMessageBox.confirm('关闭后未应用的产品导入预览将被放弃，订单不变。','放弃导入预览？',{confirmButtonText:'放弃预览',cancelButtonText:'继续查看',type:'warning'});}catch(e){return;}}if(!editorAlive||epoch!==importEpoch)return;if(importBusy.value||JSON.stringify(importPreview.value)!==input)return ElMessage.warning('确认期间导入预览已变化，请重新确认');importEpoch++;importPreview.value=null;importContext=null;importOpen.value=false;if(typeof done==='function')done();};
      const closeAmend=async done=>{if(amend.saving)return;const input=JSON.stringify({reason:amend.reason,proposal:amend.proposal});if(amend.reason){try{await ElMessageBox.confirm('关闭本次改单预览？已填写原因会保留在当前编辑页，不提交申请。','关闭改单预览',{confirmButtonText:'关闭预览',cancelButtonText:'继续编辑',type:'warning'});}catch(e){return;}}if(!editorAlive)return;if(JSON.stringify({reason:amend.reason,proposal:amend.proposal})!==input)return ElMessage.warning('确认期间改单预览已变化，请重新确认');amend.open=false;if(typeof done==='function')done();};
      const importTemplate=()=>{const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([S.orderImportHeaders]),'产品销售明细');S.download('产品销售明细模板.xlsx',XLSX.write(book,{type:'array',bookType:'xlsx'}),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');};
      const pickFilter = reactive({name:'',brand:'',space:'',cat:''});
      const pickRows = computed(()=>M.products.filter(p=>(!pickFilter.name||String(p.name+' '+p.sku).includes(pickFilter.name))&&(!pickFilter.brand||p.brand===pickFilter.brand)&&(!pickFilter.space||p.space===pickFilter.space)&&(!pickFilter.cat||p.catName===pickFilter.cat)));
      const addCustom = () => {
        lines.value.push({ key:S.newId('LINE'), name:'', code:'', area:'客厅', brand:'', mat:'', spec:'', desc:'', qty:1, unit:'小件', face:0, discount:100, price:0, img:'', materialFiles:{}, materialStates:{} });
      };
      const recalcPrice = l => { const discount=l.discount??100,value=lineAmount(l.face,discount);l.price=value===null?null:Math.round(value)/100; };
      const uploadProduct = (event,line) => {const file=event.target.files[0];event.target.value='';if(file)readEditorImage(file,line,src=>line.img=src);};
      const readEditorImage=(file,line,done)=>{if(!editorAlive||editorMediaBusy.value||!lines.value.includes(line))return;if(!/^image\/(jpeg|png|gif|webp)$/.test(file.type)||file.size<=0||file.size>1024*1024)return ElMessage.warning('本地演示仅支持1MB以内非空图片');const input=editorSnapshot(),row=JSON.stringify(line);editorMediaBusy.value++;const reader=new FileReader();reader.onload=()=>{if(!editorAlive)return;if(editorSnapshot()!==input||!lines.value.includes(line)||lines.value.filter(l=>l.key===line.key).length!==1||JSON.stringify(line)!==row)return ElMessage.warning('读取期间订货单或产品行已变化，请重新选择图片');done(reader.result);};reader.onerror=()=>{if(editorAlive)ElMessage.error('图片读取失败，请重新选择');};reader.onloadend=()=>{editorMediaBusy.value=Math.max(0,editorMediaBusy.value-1);};reader.readAsDataURL(file);};
      const uploadMaterial = (event,line,key) => {const file=event.target.files[0];event.target.value='';if(file)readEditorImage(file,line,src=>{line.materialFiles=line.materialFiles||{};line.materialFiles[key]=src;});};
      const openMaterials = line => {materialTarget.value=line;materialOpen.value=true;};
      const copyLine = line => {const next=S.clone(line);next.key=S.newId('LINE');lines.value.push(next);};
      const deleteSelected = () => {if(!selectedLines.value.length)return ElMessage.warning('请先选择产品');const keys=new Set(selectedLines.value.map(l=>l.key));lines.value=lines.value.filter(l=>!keys.has(l.key));};
      const continueNew = () => {const no=saveDraft(false);if(!no)return;editing.value='';Object.assign(head,{name:'',innerNo:'',partner:'',ownerCustomer:'',orderAt:today(),delivery:'',remark:''});lines.value=[];Object.keys(fees).forEach(k=>fees[k]=0);markEditorSaved();ElMessage.success('已保存草稿并新建空白订货单');};
      const openPick = () => {if(!editorAlive||pickOpen.value||editorMediaBusy.value)return;productPickerBase={input:editorSnapshot(),catalog:JSON.stringify(M.products)};picked.value = []; pickOpen.value = true; };
      const confirmPick = () => {
        if(!editorAlive||!pickOpen.value||!productPickerBase)return;if(editorSnapshot()!==productPickerBase.input||JSON.stringify(M.products)!==productPickerBase.catalog)return ElMessage.warning('选择期间订货输入或产品目录已变化，请取消选择重新核实');if(new Set(picked.value.map(p=>p.id)).size!==picked.value.length||picked.value.some(p=>{const a=M.products.filter(x=>x.id===p.id);return a.length!==1||JSON.stringify(a[0])!==JSON.stringify(p);}))return ElMessage.warning('所选产品不存在、不唯一或已变化，请重新选择');
        if(!picked.value.length)return ElMessage.warning('请先选择产品');
        picked.value.forEach((p) => {
          lines.value.push({
            id:p.id, key:S.newId('LINE'), name: p.name, code: p.sku, area: p.space, brand: p.brand,
            mat: p.material, spec: p.spec, desc: '', leather: '', fabric: '', marble: '',
            qty: 1, unit:p.unit, discount:100, price:p.price, face:p.price, img:p.img, materialFiles:{}, materialStates:{}
          });
        });
        pickOpen.value = false;
        ElMessage.success('已添加 ' + picked.value.length + ' 个产品');
      };
      const delLines = (i) => { lines.value.splice(i, 1); };

      const persist = (status) => {
        let no = editing.value || S.newId('SO');
        const allOrders=S.db.all('orders'),matches=editing.value?allOrders.filter(o=>o.id===editing.value||o.no===editing.value):[],current=matches.length===1?matches[0]:null;if(editing.value&&matches.length!==1)throw Error('订货单身份不存在或不唯一，请保留输入重新核实');if(current&&(allOrders.filter(o=>o.id===current.id).length!==1||allOrders.filter(o=>o.no===current.no).length!==1))throw Error('订货单内部ID或业务编号不唯一，请核实');if(!current&&allOrders.some(o=>o.id===no||o.no===no))throw Error('新订货单标识发生冲突，请重新保存');
        if(editing.value&&(!current||JSON.stringify(current)!==editorBase))throw Error('订货单已变化或不存在，请保留表单并重新核实');
        const original=current||{};if(current)no=current.no;
        if(original.state&&!['草稿','方案(草稿)'].includes(original.state))throw Error('非草稿禁止直接覆盖，请申请改单');
        const customerMatches=M.customers.filter(c=>c.company===head.partner||c.name===head.partner);if(customerMatches.length>1||customerMatches[0]&&M.customers.filter(c=>c.id===customerMatches[0].id).length!==1)throw Error('合作商名称或内部ID不唯一，请核实后保存');const customer=customerMatches[0];
        S.db.upsert('orders',Object.assign({},original,{id:original.id||no,no,name:head.name,innerNo:head.innerNo,customer:customer?.company||head.partner,customerId:customer?.id,customerName:head.ownerCustomer||customer?.name||'',phone:original.phone||customer?.phone||'',address:original.address||customer?.region||'',owner:head.sale,follower:head.follower,newSale:head.newSale,channel:original.channel||'业务员代客下单',createdAt:head.orderAt,delivery:head.delivery,remark:head.remark,items:S.clone(lines.value),fees:S.clone(fees),state:status,produceStatus:status==='草稿'?'草稿':(original.produceStatus==='草稿'?'待排产':original.produceStatus||'待排产')}));
        /* entities:v3 为权威实体；列表直接投影。旧 b:orders/list 镜像仅保留迁移历史，不再重复写入。 */
        return no;
      };

      const validate = (forSubmit) => {
        if (typeof head.name!=='string'||!head.name.trim()) return '请填写订货单名称';
        const keys=lines.value.map(l=>l.key||l.id);if(keys.some(k=>typeof k!=='string'||!k.trim())||new Set(keys).size!==keys.length)return '产品行标识缺失或重复，请保留输入核实';if(lines.value.some(l=>l.id&&S.db.all('products').filter(p=>p.id===l.id).length>1))return '关联产品内部ID不唯一，请核实产品目录';
        if(!head.orderAt)return '请选择订货时间';
        if(head.delivery&&head.delivery<head.orderAt)return '交货日期不能早于订货日期';
        if(lines.value.some(l=>!l.name||!Number.isFinite(Number(l.qty))||Number(l.qty)<=0||!Number.isFinite(Number(l.price))||Number(l.price)<0))return '请检查产品名称、数量与单价';
        if(Object.values(fees).some(v=>!Number.isFinite(Number(v))||Number(v)<0))return '费用不能为负数或无效值';
        if(orderTotal.value!==null&&Number(fees.discount)>orderTotal.value)return '优惠金额不能超过订货总价';
        if (forSubmit && !lines.value.length) return '请至少添加 1 个产品';
        if (forSubmit && lines.value.some(l=>l.price===null||l.price==='')) return '请补齐未报价商品的订货价，再提交订货单';
        if (forSubmit && !head.delivery) return '请选择交货日期';
        return '';
      };
      const saveDraft = (close) => {
        if(!editorAlive)return;if(pickOpen.value||importOpen.value||editorMediaBusy.value)return ElMessage.warning('请先结束产品选择、导入或图片读取，再保存订货单');
        if(amendment)return ElMessage.warning('改单请提交申请，不可保存为草稿');
        if(editing.value&&!['草稿','方案(草稿)'].includes(S.db.find('orders',editing.value)?.state))return ElMessage.warning('非草稿请申请改单');
        const err = validate(false);
        if (err) return ElMessage.warning(err);
        let no;try{no=persist('草稿');}catch(e){ElMessage.error(e.message||'草稿保存失败，请保留表单');return;}
        editing.value = no;markEditorSaved();
        ElMessage.success('草稿已保存：' + no);
        if (close) props.nav('project/index');
        return no;
      };
      const submit = () => {
        if(!editorAlive)return;if(pickOpen.value||importOpen.value||editorMediaBusy.value)return ElMessage.warning('请先结束产品选择、导入或图片读取，再提交订货单');
        const err = validate(true);
        if (err) return ElMessage.warning(err);
        if(amendment){amend.proposal=amendmentProposal();amend.changes=S.orderAmendDiff(amendBase,amend.proposal);if(!amend.changes.length)return ElMessage.warning('未检测到变更，无需申请改单');amend.error='';amend.open=true;return;}
        if(editing.value&&!['草稿','方案(草稿)'].includes(S.db.find('orders',editing.value)?.state))return ElMessage.warning('非草稿请申请改单');
        let no;try{no=persist('已下单');}catch(e){ElMessage.error(e.message||'订货单提交失败，请保留表单');return;}
        editing.value=no;markEditorSaved();
        ElMessageBox.alert('订货单 ' + no + ' 已提交，可在订货单管理中查看。', '提交成功', { confirmButtonText: '返回列表' })
          .then(() => props.nav('project/index')).catch(() => {});
      };
      let editorAlive=true;Vue.onUnmounted(()=>{editorAlive=false;});const cancel = async () => {if(editorMediaBusy.value||importBusy.value)return ElMessage.warning('图片或工作簿正在读取，请稍候再关闭');const closeInput=editorGuardSnapshot();if(editorDirty()){try{await ElMessageBox.confirm('当前订货单有未保存的修改，离开后不会保留。',amendment?'未保存的改单':'未保存的订货单',{type:'warning',confirmButtonText:'放弃修改并离开',cancelButtonText:'继续编辑'});}catch(e){return;}}if(!editorAlive)return;if(editorGuardSnapshot()!==closeInput)return ElMessage.warning('确认期间订单输入已变化，请保留修改重新确认');if(amendment)amendmentSaved=true;else editorBaseline=editorSnapshot();props.nav('project/index');};

      return {
        closeAmend,closeImport,editorDirty,amendment,amend,confirmAmend,head, lines, fees, editing, isEdit, pickOpen, picked, qtySum, orderTotal, faceTotal, invoice, receivable, received,
        ORDER_LINE_COLS, ORDER_FEE_KEYS, addCustom, openPick, confirmPick, delLines, saveDraft, submit, cancel,
        M, money, lineAmount, tagT, materialTypes, selectedLines, importOpen, materialOpen, materialTarget, pickFilter, pickRows,
        recalcPrice, uploadProduct, uploadMaterial, openMaterials, copyLine, deleteSelected, continueNew, importFile, importBusy, importPreview, importError, chooseImport, readImport, confirmImport, importTemplate
      };
    },
    template: `
    <div class="oe">
      <div class="oe-hd">
        <h3>{{ amendment?'申请改单':(isEdit ? '编辑订货单' : '新增订货单') }}</h3>
        <span class="no" v-if="isEdit">{{ editing }}</span>
      </div>

      <div class="oe-card">
        <div class="oe-grid">
          <div class="f"><label><i>*</i>订货单名称</label><el-input v-model="head.name" placeholder="请输入订货单名称" size="small" /></div>
          <div class="f"><label>内部单号</label><el-input v-model="head.innerNo" placeholder="请输入内部单号" size="small" /></div>
          <div class="f"><label>订单归属(合作商)</label>
            <el-select v-model="head.partner" placeholder="请选择" size="small" clearable filterable>
              <el-option v-for="c in M.customers.slice(0,12)" :key="c.id" :label="c.name" :value="c.name" />
            </el-select>
          </div>
          <div class="f"><label>C端/业主</label>
            <el-select v-model="head.ownerCustomer" placeholder="请选择C端/业主" size="small" clearable filterable>
              <el-option v-for="c in M.customers.slice(0,12)" :key="c.id" :label="c.name + ' · ' + c.phone" :value="c.name" />
            </el-select>
          </div>
          <div class="f"><label>销售</label>
            <el-select v-model="head.sale" size="small"><el-option v-for="p in ['张松涛','曾燕然','袁彩怡','李静']" :key="p" :label="p" :value="p" /></el-select>
          </div>
          <div class="f"><label>副销售</label>
            <el-select v-model="head.newSale" placeholder="请选择" size="small" clearable><el-option v-for="p in ['周慧','吴敏','刘洋']" :key="p" :label="p" :value="p" /></el-select>
          </div>
          <div class="f"><label>跟单</label>
            <el-select v-model="head.follower" size="small"><el-option v-for="p in ['张松涛','周慧','吴敏']" :key="p" :label="p" :value="p" /></el-select>
          </div>
          <div class="f"><label><i>*</i>订货时间</label><el-date-picker v-model="head.orderAt" type="date" value-format="YYYY-MM-DD" size="small" style="width:100%" /></div>
          <div class="f"><label><i>*</i>交货日期</label><el-date-picker v-model="head.delivery" type="date" value-format="YYYY-MM-DD" placeholder="请选择" size="small" style="width:100%" /></div>
          <div class="f wide"><label>订货单说明</label>
            <el-input v-model="head.remark" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="填写加工要求、送货要求等" />
          </div>
        </div>
      </div>

      <div class="oe-card">
        <div class="oe-bar">
          <el-button size="small" type="primary" plain @click="addCustom">+ 添加自定义产品</el-button>
          <el-button size="small" type="primary" plain @click="openPick">+ 从产品库中添加</el-button>
          <el-button size="small" plain @click="importOpen=true">导入</el-button>
          <el-button size="small" @click="deleteSelected">删除</el-button>
          <span class="hint">共 {{ lines.length }} 行 · {{ qtySum }} 件</span>
        </div>
        <h4 style="margin:8px 0">订货清单 <small style="font-weight:400;color:#909399">左右滑动表格</small></h4>
        <el-table :data="lines" row-key="key" size="small" border empty-text="暂无数据，请添加自定义产品或从产品库添加" max-height="480" @selection-change="v=>selectedLines=v">
          <el-table-column type="selection" width="42" />
          <el-table-column label="序号" width="56" align="center">
            <template #default="s">{{ s.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="产品图片" width="76">
            <template #default="s"><el-image v-if="s.row.img" :src="s.row.img" style="width:60px;height:60px" fit="contain" :preview-src-list="[s.row.img]" preview-teleported /><label style="display:block;color:#409eff;cursor:pointer">上传图片<input type="file" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none" @change="uploadProduct($event,s.row)"></label></template>
          </el-table-column>
          <el-table-column label="名称" min-width="150">
            <template #default="s"><el-input v-model="s.row.name" size="small" /></template>
          </el-table-column>
          <el-table-column v-for="c in [['code','编号'],['area','区域'],['brand','品牌'],['mat','材料/颜色'],['spec','规格尺寸']]" :key="c[0]" :label="c[1]" width="150"><template #default="s"><el-input v-model="s.row[c[0]]" size="small" :aria-label="c[1]" /></template></el-table-column>
          <el-table-column label="产品说明" width="130">
            <template #default="s"><el-input v-model="s.row.desc" size="small" placeholder="选填" /></template>
          </el-table-column>
          <el-table-column v-for="m in materialTypes" :key="m[0]" :label="m[1]" width="170"><template #default="s">
            <el-image v-if="s.row.materialFiles&&s.row.materialFiles[m[0]]" :src="s.row.materialFiles[m[0]]" style="width:50px;height:50px" fit="cover" />
            <el-input v-model="s.row[m[0]]" type="textarea" :rows="2" placeholder="输入材质名称" :aria-label="m[1]+'名称'" />
            <label style="color:#409eff;cursor:pointer">上传材质图<input type="file" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none" @change="uploadMaterial($event,s.row,m[0])"></label>
            <el-select :model-value="s.row.materialStates?.[m[0]]||'材质待确认'" @update:model-value="v=>{s.row.materialStates=s.row.materialStates||{};s.row.materialStates[m[0]]=v}" size="small" style="width:145px"><el-option label="材质待确认" value="材质待确认" /><el-option label="材质已确认" value="材质已确认" /></el-select>
          </template></el-table-column>
          <el-table-column label="数量" width="94">
            <template #default="s"><el-input-number v-model="s.row.qty" size="small" controls-position="right" style="width:80px" /></template>
          </el-table-column>
          <el-table-column label="单位" width="120"><template #default="s"><el-input v-model="s.row.unit" size="small" /></template></el-table-column>
          <el-table-column label="面价" width="140"><template #default="s"><el-input-number v-model="s.row.face" :min="0" size="small" style="width:125px" @change="recalcPrice(s.row)" /></template></el-table-column>
          <el-table-column label="折扣(%)" width="140"><template #default="s"><el-input-number v-model="s.row.discount" :min="0" :max="100" size="small" style="width:125px" @change="recalcPrice(s.row)" /></template></el-table-column>
          <el-table-column label="订货价" width="140">
            <template #default="s"><el-input-number v-model="s.row.price" :min="0" :step="100" size="small" controls-position="right" style="width:94px" /></template>
          </el-table-column>
          <el-table-column label="订货价合计" width="130"><template #default="s">{{s.row.price===null||s.row.price===''?'待报价':money(lineAmount(s.row.qty,s.row.price))}}</template></el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="s"><el-button link type="primary" @click="openMaterials(s.row)">批量加材质</el-button><el-button link type="primary" @click="copyLine(s.row)">复制</el-button><el-button link type="danger" @click="delLines(s.$index)">删除</el-button></template>
          </el-table-column>
        </el-table>

        <div class="oe-sum">
          <div class="it"><span>产品合计</span><b>{{ qtySum }}</b></div>
          <div class="it"><span>产品面价总价</span><b>{{ money(faceTotal) }}</b></div>
          <div class="it"><span>订货总价</span><b>{{ money(orderTotal) }}</b></div>
          <div class="it"><span>优惠金额</span><el-input-number v-model="fees.discount" :min="0" size="small" controls-position="right" style="width:96px" /></div>
          <div class="it"><span>开单金额</span><b>{{ money(invoice) }}</b></div>
          <div class="it"><span>木架费</span><el-input-number v-model="fees.crate" :min="0" size="small" controls-position="right" style="width:86px" /></div>
          <div class="it"><span>安装运输</span><el-input-number v-model="fees.install" :min="0" size="small" controls-position="right" style="width:86px" /></div>
          <div class="it"><span>税金</span><el-input-number v-model="fees.tax" :min="0" size="small" controls-position="right" style="width:86px" /></div>
          <div class="it"><span>佣金</span><el-input-number v-model="fees.commission" :min="0" size="small" controls-position="right" style="width:86px" /></div>
          <div class="it"><span>设计费</span><el-input-number v-model="fees.design" :min="0" size="small" controls-position="right" style="width:86px" /></div>
          <div class="it"><span>服务费</span><el-input-number v-model="fees.service" :min="0" size="small" controls-position="right" style="width:86px" /></div>
          <div class="it"><span>运费</span><el-input-number v-model="fees.freight" :min="0" size="small" controls-position="right" style="width:86px" /></div>
          <div class="it tot"><span>应收金额</span><b>{{ money(receivable) }}</b></div>
          <div class="it"><span>实收金额</span><b>{{ money(received) }}</b></div>
        </div>
      </div>

      <div class="oe-ft">
        <el-button v-if="!amendment" @click="saveDraft(false)">保存草稿</el-button>
        <el-button v-if="!amendment" @click="saveDraft(true)">保存草稿并关闭</el-button>
        <el-button v-if="!amendment" @click="continueNew">保存并继续新建</el-button>
        <el-button type="primary" @click="submit">{{amendment?'提交改单申请':'提交'}}</el-button>
        <el-button @click="cancel">取消</el-button>
      </div>

      <el-dialog v-model="amend.open" title="改单确认" :before-close="closeAmend" width="min(900px,94vw)" append-to-body :close-on-click-modal="false" :close-on-press-escape="!amend.saving" :show-close="!amend.saving" class="order-amend-confirm"><el-alert title="本机Mock：提交只生成待审核申请，不立即覆盖订单、不通知部门。" :closable="false"/><el-form label-width="90px" style="margin-top:16px"><el-form-item label="改单原因" required><el-input v-model="amend.reason" type="textarea" maxlength="200" show-word-limit placeholder="必填，改单可能影响排产顺序与物料准备，方便审核人员了解具体改单原因。"/></el-form-item></el-form><el-alert v-if="amend.error" :title="amend.error" type="error" :closable="false"/><el-table :data="amend.changes" border size="small"><el-table-column prop="object" label="修改对象" width="150"/><el-table-column prop="field" label="修改字段" width="130"/><el-table-column prop="before" label="修改前" min-width="150"/><el-table-column prop="after" label="修改后" min-width="150"/><el-table-column prop="type" label="修改类型" width="90"/></el-table><template #footer><el-button :disabled="amend.saving" @click="closeAmend">取消</el-button><el-button type="primary" :loading="amend.saving" @click="confirmAmend">确定</el-button></template></el-dialog>
      <el-dialog v-model="importOpen" title="导入产品销售明细" width="min(680px,96vw)" append-to-body :before-close="closeImport" :close-on-click-modal="false">
        <el-alert title="仅本机解析：非空文件2MB、1个工作表、200行含空位和表头、100列，不支持隐藏/合并/公式。编号唯一才匹配产品目录，不按名称猜测。空白价格保留为空，提交前需报价。" type="info" :closable="false" />
        <input ref="importFile" type="file" accept=".xls,.xlsx" style="display:none" @change="readImport">
        <div style="padding:18px 0;display:flex;gap:12px"><el-button type="primary" :loading="importBusy" @click="chooseImport">选择产品明细文件</el-button><el-button @click="importTemplate">下载导入模板</el-button></div>
        <p>首个工作表最多 200 行（含表头），不支持隐藏或合并行列。本地文件上限 5MB；原系统页面标注为 200MB。</p>
        <p>嵌入式图片暂不解析；按编号或名称匹配产品库图片，未匹配的图片可在明细中补传。</p>
        <el-alert v-if="importError" :title="importError" type="error" :closable="false" />
        <div v-if="importPreview"><p>工作表：{{importPreview.name}} · {{importPreview.rows.length}} 行 · 未报价 {{importPreview.unpriced}} 行 · 需补图 {{importPreview.unmatched}} 行</p><el-table :data="importPreview.rows" height="260" size="small"><el-table-column prop="name" label="名称" min-width="180"/><el-table-column prop="code" label="编号"/><el-table-column prop="qty" label="数量" width="80"/><el-table-column label="订货价" width="100"><template #default="s">{{s.row.price===null?'待报价':money(s.row.price)}}</template></el-table-column></el-table></div>
        <template #footer><el-button @click="closeImport">取消</el-button><el-button type="primary" :disabled="!importPreview||importBusy" @click="confirmImport">确认追加明细</el-button></template>
      </el-dialog>
      <el-dialog v-model="materialOpen" title="添加自定义材质" width="1000px" append-to-body>
        <el-alert title="本地演示：图片保存在当前明细，单图最大1MB；暂不支持跨分类拖拽和Excel粘贴。" :closable="false" />
        <div v-if="materialTarget" style="display:grid;grid-template-columns:repeat(7,1fr);gap:10px;margin:18px 0"><div v-for="m in materialTypes" :key="m[0]"><h4>{{m[1]}}</h4><el-image v-if="materialTarget.materialFiles?.[m[0]]" :src="materialTarget.materialFiles[m[0]]" style="width:90px;height:90px" fit="contain" /><label style="display:block;color:#409eff;cursor:pointer">点击上传<input type="file" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none" @change="uploadMaterial($event,materialTarget,m[0])"></label></div></div>
        <template #footer><el-button @click="materialOpen=false">关闭</el-button></template>
      </el-dialog>
      <el-dialog v-model="pickOpen" title="选择产品" width="min(1100px,96vw)" append-to-body destroy-on-close :close-on-click-modal="false">
        <div style="display:flex;gap:10px;margin-bottom:12px"><el-input v-model="pickFilter.name" placeholder="名称或编码" style="width:240px" /><el-select v-for="f in [['brand','全部品牌'],['space','全部空间'],['cat','全部分类']]" :key="f[0]" v-model="pickFilter[f[0]]" :placeholder="f[1]" clearable style="width:180px"><el-option v-for="v in [...new Set(M.products.map(p=>p[f[0]==='cat'?'catName':f[0]]))].filter(Boolean)" :key="v" :label="v" :value="v" /></el-select></div>
        <el-table :data="pickRows" size="small" height="420" @selection-change="v=>picked=v">
          <el-table-column type="selection" width="44" />
          <el-table-column label="产品" min-width="200">
            <template #default="s"><div style="display:flex;gap:8px;align-items:center">
              <img :src="s.row.img" style="width:36px;height:36px;object-fit:cover;border-radius:3px">
              <span>{{ s.row.name }}</span></div></template>
          </el-table-column>
          <el-table-column prop="sku" label="编号" width="110" />
          <el-table-column prop="space" label="区域" width="80" />
          <el-table-column prop="brand" label="品牌" width="110" />
          <el-table-column label="单价" width="110" align="right">
            <template #default="s">{{ money(s.row.price) }}</template>
          </el-table-column>
        </el-table>
        <template #footer>
          <el-button @click="pickOpen=false">取消</el-button>
          <el-button type="primary" @click="confirmPick">加入订货单（{{ picked.length }}）</el-button>
        </template>
      </el-dialog>
    </div>`
  };

  /* ============ 单据类子页面（交货 / 申购 / 付款 / 生产计划） ============ */
  const DOC_DEFS = {
    'deliver/add': {
      title: '新增交货单',
      fields: [
        { k: 'no', l: '交货单号', ph: '自动生成', ro: true }, { k: 'order', l: '关联订货单', req: true, ph: '请选择订货单' },
        { k: 'customer', l: '客户', req: true }, { k: 'contact', l: '收货人', req: true },
        { k: 'phone', l: '联系电话', req: true }, { k: 'date', l: '交货日期', t: 'date', req: true },
        { k: 'carrier', l: '承运方式', t: 'select', opts: ['自有物流', '三方物流', '客户自提', '安装队随车'] },
        { k: 'address', l: '收货地址', wide: true }, { k: 'remark', l: '备注', t: 'textarea', wide: true }
      ],
      items: ['产品名称', '规格尺寸', '数量', '备注']
    },
    'purchase/add': {
      title: '新增申购单',
      fields: [
        { k: 'no', l: '申购单号', ph: '自动生成', ro: true }, { k: 'supplier', l: '供应商', req: true, t: 'select', opts: ['佛山市顺德区欧陆家私', '东莞名匠家居', '广州雅居乐家具'] },
        { k: 'type', l: '申购类型', t: 'select', opts: ['原材料', '五金配件', '成品采购', '外协加工'] },
        { k: 'order', l: '关联订货单' }, { k: 'expect', l: '期望到货日期', t: 'date', req: true },
        { k: 'buyer', l: '采购员', t: 'select', opts: ['张松涛', '周慧', '吴敏'] },
        { k: 'remark', l: '申购说明', t: 'textarea', wide: true }
      ],
      items: ['物料名称', '规格', '数量', '单价', '金额']
    },
    'reconciliation/add': {
      title: '新增付款单',
      fields: [
        { k: 'no', l: '付款单号', ph: '自动生成', ro: true }, { k: 'supplier', l: '供应商', req: true, t: 'select', opts: ['佛山市顺德区欧陆家私', '东莞名匠家居'] },
        { k: 'amount', l: '付款金额', req: true, t: 'number' }, { k: 'method', l: '付款方式', t: 'select', opts: ['银行转账', '承兑汇票', '现金'] },
        { k: 'date', l: '付款日期', t: 'date', req: true }, { k: 'remark', l: '备注', t: 'textarea', wide: true }
      ],
      items: ['关联采购单', '应付金额', '本次付款', '备注']
    },
    'palletPlan/add': {
      title: '新增生产计划',
      fields: [
        { k: 'no', l: '计划单号', ph: '自动生成', ro: true }, { k: 'order', l: '关联订货单', req: true },
        { k: 'line', l: '生产线', t: 'select', opts: ['软体一线', '软体二线', '板式线', '定制线'] },
        { k: 'start', l: '计划开工', t: 'date', req: true }, { k: 'end', l: '计划完工', t: 'date', req: true },
        { k: 'owner', l: '负责人', t: 'select', opts: ['张松涛', '陈志远', '刘洋'] },
        { k: 'remark', l: '计划说明', t: 'textarea', wide: true }
      ],
      items: ['工序', '计划工时', '负责人', '备注']
    },
    'purchase/supplier/add': {
      title: '新增供应商',
      fields: [
        { k: 'name', l: '供应商名称', req: true }, { k: 'code', l: '供应商编码', ph: '自动生成' },
        { k: 'contact', l: '联系人', req: true }, { k: 'phone', l: '联系电话', req: true },
        { k: 'area', l: '所在地区' }, { k: 'cats', l: '供货品类' },
        { k: 'settle', l: '结算方式', t: 'select', opts: ['月结 30 天', '现结', '预付 30%'] },
        { k: 'state', l: '合作状态', t: 'select', opts: ['合作中', '已暂停'] },
        { k: 'addr', l: '详细地址', wide: true }, { k: 'remark', l: '备注', t: 'textarea', wide: true }
      ]
    },
    'warehouse/manage': {
      title: '仓库管理',
      fields: [
        { k: 'name', l: '仓库名称', req: true }, { k: 'code', l: '仓库编码' },
        { k: 'owner', l: '负责人', t: 'select', opts: ['张松涛', '周慧'] },
        { k: 'area', l: '面积（㎡）', t: 'number' }, { k: 'addr', l: '仓库地址', wide: true },
        { k: 'remark', l: '备注', t: 'textarea', wide: true }
      ]
    }
  };
  /* 抽奖活动 / 新增商品 / 套餐商品（见 schema-b-extra.js） */
  Object.assign(DOC_DEFS, window.B_DOC_DEFS || {});

  const DocEdit = {
    props: ['nav', 'id', 'rkey'],
    setup(props) {
      const S = window.SHARED;
      const def = S.clone(DOC_DEFS[props.rkey] || { title: '新建', fields: [] });
      def.fields.forEach(x=>{if(x.k==='supplier'){x.opts=S.db.all('suppliers').map(r=>r.name);}if(x.k==='order'){x.t='select';x.opts=S.db.all('orders').map(o=>o.no);}});
      if(props.rkey==='physical/add'||props.rkey==='package/add')def.fields.push({k:'files',l:'商品主图',t:'upload',wide:true});
      const backs = { 'deliver/add':'deliver/index', 'purchase/add':'purchase/other', 'reconciliation/add':'reconciliation/index', 'palletPlan/add':'productionTracking/index', 'purchase/supplier/add':'purchase/supplier', 'warehouse/manage':'inventory/inquiry' };
      const back = () => props.nav(def.back || backs[props.rkey] || 'project/index');
      const history = ref(S.store.get('b:doc:' + props.rkey) || []);
      const f = reactive({});
      def.fields.forEach((x) => { f[x.k] = x.ro ? S.newId(props.rkey.split('/')[0].toUpperCase()) : (x.t==='upload'?[]:''); });
      const lines = ref(def.items && props.rkey!=='physical/add' ? [{}] : []);
      watch(()=>f.order,no=>{
        const o=S.db.find('orders',no);if(!o||f.__id)return;
        if(props.rkey==='deliver/add'){Object.assign(f,{customer:o.customer,contact:o.customerName,phone:o.phone,address:o.address});lines.value=o.items.map((l,i)=>({sourceKey:o.no+':'+(l.key||l.id||i),productId:l.id,'产品名称':l.name,'规格尺寸':l.spec,'数量':l.qty,'备注':''}));}
        if(props.rkey==='purchase/add'&&lines.value.every(l=>!l['物料名称']))lines.value=o.items.map(l=>({'物料名称':l.name,'规格':l.spec,'数量':l.qty,'单价':l.price,'金额':l.qty*l.price}));
      });
      watch(lines,ls=>{if(props.rkey==='purchase/add')ls.forEach(l=>l['金额']=Math.round(Number(l['数量']||0)*Number(l['单价']||0)*100)/100);},{deep:true});
      const docSnapshot=()=>JSON.stringify({form:f,lines:lines.value});
      let docAlive=true;Vue.onUnmounted(()=>{docAlive=false;});let docBaseline=docSnapshot();const docDirty=()=>docSnapshot()!==docBaseline;
      const releaseDocGuard=S.registerLeaveGuard(docDirty,'未保存的'+def.title,docSnapshot);Vue.onUnmounted(releaseDocGuard);
      const docLeave=e=>{if(docDirty()){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',docLeave);Vue.onUnmounted(()=>window.removeEventListener('beforeunload',docLeave));
      const readRecord = async record => {
        const originalInput=docSnapshot(),recordInput=JSON.stringify(record),routeKey=props.rkey;
        if(docDirty()){try{await ElMessageBox.confirm('载入记录将丢弃当前未保存的修改。','未保存的'+def.title,{type:'warning',confirmButtonText:'放弃修改并载入',cancelButtonText:'继续编辑'});}catch(e){return;}}
        if(!docAlive||props.rkey!==routeKey)return;if(docSnapshot()!==originalInput||JSON.stringify(record)!==recordInput)return ElMessage.warning('确认期间输入或记录已变化，请重新核实');
        def.fields.forEach(x => { f[x.k] = record[x.k] ?? ''; }); f.__id = record.__id;
        lines.value = S.clone(record.__lines || []);
        docBaseline=docSnapshot();
        ElMessage.info('已载入已保存记录；再次保存将更新同一条记录');
      };
      const addLine = () => lines.value.push({});
      const delLine = (i) => lines.value.splice(i, 1);
      const save = () => {
        if(props.rkey==='purchase/add')return ElMessage.warning('通用采购新增未接入可靠来源事务，不保存旧文档或采购实体；请从订货产品行进入专属申购。');
        const miss = def.fields.filter((x) => x.req && !String(f[x.k] || '').trim());
        if (miss.length) return ElMessage.warning('请填写：' + miss.map((m) => m.l).join('、'));
        if (f.phone && !/^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/.test(String(f.phone))) return ElMessage.warning('请输入有效联系电话');
        if (f.start && f.end && f.end < f.start) return ElMessage.warning('计划完工不能早于计划开工');
        if ('amount' in f && !(Number(f.amount) > 0)) return ElMessage.warning('付款金额必须大于 0');
        if (def.items && ((props.rkey!=='physical/add'&&!lines.value.length) || lines.value.some(row => !String(row[def.items[0]] || '').trim()))) return ElMessage.warning('请补齐每行的' + def.items[0]);
        if (def.items?.includes('数量') && lines.value.some(row => !(Number(row['数量']) > 0))) return ElMessage.warning('每行数量必须大于 0');
        if(f.order&&!S.db.find('orders',f.order))return ElMessage.warning('请选择有效的关联订货单');
        if(['physical/add','package/add'].includes(props.rkey)&&!(Number(f.price)>0))return ElMessage.warning('销售价格必须大于 0');
        if(props.rkey==='purchase/add'&&lines.value.some(l=>!Number.isFinite(Number(l['单价']))||Number(l['单价'])<0))return ElMessage.warning('单价须为不小于 0 的数字');
        if(props.rkey==='palletPlan/add'&&lines.value.some(l=>!(Number(l['计划工时'])>0)))return ElMessage.warning('计划工时必须大于 0');
        if(props.rkey==='reconciliation/add'){
          if(lines.value.some(l=>!(Number(l['本次付款'])>0)||Number(l['本次付款'])>Number(l['应付金额'])))return ElMessage.warning('每行本次付款须大于 0 且不超过应付金额');
          if(Math.abs(lines.value.reduce((n,l)=>n+Number(l['本次付款']),0)-Number(f.amount))>.005)return ElMessage.warning('付款金额须等于明细本次付款合计');
        }
        const list = S.store.get('b:doc:' + props.rkey) || [];
        const record = Object.assign({ __at: new Date().toISOString() }, S.clone(f), { __lines: S.clone(lines.value) });
        const id = record.no || record.__id || S.newId('DOC'); record.__id = id; f.__id = id;
        const index = list.findIndex(x => (x.__id || x.no) === id);
        if (index < 0) list.unshift(record); else list[index] = record;
        if(['deliver/add','palletPlan/add'].includes(props.rkey)){try{S.saveBusinessDocument(props.rkey,record);history.value=S.clone(list);}catch(e){return ElMessage.error(e.message||'交货保存失败，文档和明细未改变');}}
        else{S.store.set('b:doc:' + props.rkey, list);history.value=S.clone(list);if(S.saveBusinessDocument)S.saveBusinessDocument(props.rkey,record);}
        docBaseline=docSnapshot();
        ElMessage.success(def.title + '已保存（本地演示，含 ' + lines.value.length + ' 行明细）');
      };
      return { def, f, lines, addLine, delLine, save, money, back, history, readRecord };
    },
    template: `
    <div class="oe">
      <div class="oe-hd"><h3>{{ def.title }}</h3><el-button size="small" @click="back">返回列表</el-button></div>
      <el-alert type="info" :closable="false" title="本地单据演示：表头和明细保存到本机；下方已保存记录可载入核对，不代表线上提交。" style="margin-bottom:12px" />
      <div class="oe-card" data-demo="单据表头（必填项带 *）">
        <div class="oe-grid">
          <div class="f" v-for="x in def.fields" :key="x.k" :class="{wide:x.wide}">
            <label><i v-if="x.req">*</i>{{ x.l }}</label>
            <LocalUpload v-if="x.t==='upload'" v-model="f[x.k]" :limit="1" accept=".png,.jpg,.jpeg,.webp" />
            <el-input v-else-if="!x.t" v-model="f[x.k]" :placeholder="x.ph||('请输入'+x.l)" size="small" :disabled="x.ro" />
            <el-input v-else-if="x.t==='textarea'" v-model="f[x.k]" type="textarea" :rows="3" :placeholder="x.ph||('请输入'+x.l)" />
            <el-input v-else-if="x.t==='number'" v-model="f[x.k]" type="number" size="small" />
            <el-date-picker v-else-if="x.t==='date'" v-model="f[x.k]" type="date" value-format="YYYY-MM-DD" size="small" style="width:100%" placeholder="选择日期" />
            <el-select v-else-if="x.t==='select'" v-model="f[x.k]" size="small" clearable style="width:100%" :placeholder="'请选择' + x.l">
              <el-option v-for="o in x.opts" :key="o" :label="o" :value="o" />
            </el-select>
          </div>
        </div>
      </div>
      <div class="oe-card" v-if="def.items" data-demo="明细行（可增删）">
        <div class="oe-bar"><el-button size="small" type="primary" plain @click="addLine">+ 添加明细</el-button><span class="hint">共 {{ lines.length }} 行</span></div>
        <el-table :data="lines" size="small" border>
          <el-table-column label="序号" width="56" align="center"><template #default="s">{{ s.$index+1 }}</template></el-table-column>
          <el-table-column v-for="(h,i) in def.items" :key="i" :label="h">
            <template #default="s"><el-input-number v-if="/数量|单价|金额|工时|加价|概率/.test(h)" v-model="s.row[h]" :min="0" :precision="/数量/.test(h)?0:2" :controls="false" :disabled="rkey==='purchase/add'&&h==='金额'" size="small" style="width:100%"/><el-input v-else v-model="s.row[h]" size="small" /></template>
          </el-table-column>
          <el-table-column label="操作" width="70"><template #default="s"><span class="link" style="color:#f56c6c" @click="delLine(s.$index)">删除</span></template></el-table-column>
        </el-table>
      </div>
      <div class="oe-card" v-if="history.length" data-demo="已保存记录（刷新可回读）">
        <h4>已保存记录（{{ history.length }}）</h4>
        <el-table :data="history" size="small" max-height="260" border>
          <el-table-column v-for="x in def.fields.slice(0,3)" :key="x.k" :prop="x.k" :label="x.l" min-width="130" />
          <el-table-column label="明细行数" width="100"><template #default="s">{{ (s.row.__lines || []).length }}</template></el-table-column>
          <el-table-column label="操作" width="120"><template #default="s"><el-button link type="primary" @click="readRecord(s.row)">载入记录</el-button></template></el-table-column>
        </el-table>
      </div>
      <div class="oe-ft">
        <el-button type="primary" @click="save">保存</el-button>
        <el-button @click="back">返回列表</el-button>
      </div>
    </div>`
  };

  /* ============ 打印销售订单 ============ */
  const PrintOrder = {
    props: ['nav'],
    setup() {
      const order = M.orders[0];
      return { order, money, M };
    },
    template: `
    <div style="padding:24px;background:#fff;max-width:900px;margin:0 auto">
      <div style="text-align:center;font-size:20px;font-weight:600;letter-spacing:2px">销售订货单</div>
      <div style="text-align:right;font-size:12px;color:#909399">打印时间 {{ new Date().toLocaleString('zh-CN') }}</div>
      <el-divider />
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
        <div>订货单号：{{ order.no }}</div><div>订货日期：{{ order.createdAt }}</div>
        <div>客户：{{ order.customer }}</div><div>交货日期：{{ order.delivery }}</div>
        <div>联系人：{{ order.customerName }}</div><div>销售：{{ order.owner }}</div>
      </div>
      <el-table :data="[{ n: order.productName, q: order.products, p: order.amount }]" size="small" border style="margin-top:14px">
        <el-table-column label="产品名称" prop="n" />
        <el-table-column label="数量" prop="q" width="90" align="center" />
        <el-table-column label="金额" width="130" align="right"><template #default="s">{{ money(s.row.p) }}</template></el-table-column>
      </el-table>
      <div style="text-align:right;margin-top:14px;font-size:14px">合计：<b style="color:#d9603a">{{ money(order.amount) }}</b></div>
      <div style="margin-top:40px;display:flex;justify-content:space-between;font-size:13px;color:#606266">
        <span>客户签字：____________</span><span>门店盖章：____________</span>
      </div>
      <div style="margin-top:24px;text-align:center">
        <el-button type="primary" @click="window.print()">打印</el-button>
        <el-button @click="nav('project/index')">返回</el-button>
      </div>
    </div>`
  };

  /* 交货单：订单产品选择与本地单据分离，不能套用通用新增表单。 */
  const DeliveryPage = {
    setup() {
      const S=window.SHARED, db=S.db, tab=ref('pending'), selected=ref([]), page=ref(1), size=ref(10);
      const filters=reactive({customer:'',receiver:'',dates:[],warehouse:'',product:'',order:''}), query=ref({});
      const docs=computed(()=>db.all('deliveryDocuments')), dialog=reactive({open:false,mode:'create',target:'',items:[]});
      const form=reactive({receiver:'',phone:'',address:'',logistics:'',date:'',remark:''});
      const options=computed(()=>[...new Set(db.all('orders').map(o=>o.customer).filter(Boolean))]);
      const allocated=(key)=>docs.value.reduce((n,d)=>n+(d.items||[]).filter(l=>l.sourceKey===key).reduce((a,l)=>a+Number(l.qty),0),0);
      const products=computed(()=>db.all('orders').flatMap(o=>(o.items||[]).map((l,i)=>{
        const key=o.no+':'+(l.key||l.id||i), p=db.all('products').find(p=>p.id===l.id||p.sku===l.code)||{};
        return {sourceKey:key,productId:l.id||p.id,price:Number(l.price??p.price??0),orderNo:o.no,innerNo:o.innerNo||'未填写',customer:o.customer||'未指定合作商',receiver:o.customerName||'未填写业主',phone:o.phone||'',address:o.address||'',product:l.name||'自定义产品',img:l.img||p.img||'',code:l.code||p.sku||'',spec:l.spec||'未填写规格',material:l.mat||p.material||'未指定材质',qty:Math.max(0,Number(l.qty)-allocated(key)),unit:l.unit||'件',stock:p.stock??0,volume:l.volume||'未录入',packages:l.packages??0,payStatus:o.payStatus,remain:o.remainDays==null?'交期待确认':o.remainDays+' 天',date:o.delivery||'',created:o.createdAt,warehouse:l.warehouse||'成品一仓'};
      })).filter(l=>l.qty>0));
      const filtered=computed(()=>products.value.filter(l=>{const q=query.value;return (!q.customer||l.customer===q.customer)&&(!q.receiver||(l.receiver+' '+l.phone).includes(q.receiver))&&(!q.warehouse||l.warehouse===q.warehouse)&&(!q.product||(l.product+' '+l.code).includes(q.product))&&(!q.order||l.orderNo.includes(q.order))&&(!q.dates?.length||(l.date&&l.date>=q.dates[0]&&l.date<=q.dates[1]));}));
      const search=()=>{query.value=S.clone(filters);page.value=1;selected.value=[];};
      const reset=()=>{Object.assign(filters,{customer:'',receiver:'',dates:[],warehouse:'',product:'',order:''});search();};
      const open=(mode)=>{
        if(!selected.value.length)return ElMessage.warning('请先勾选要交货的订单产品');
        if(new Set(selected.value.map(l=>l.customer+'|'+l.receiver)).size>1)return ElMessage.warning('请选择同一合作商及业主的产品');
        Object.assign(dialog,{open:true,mode,target:'',items:S.clone(selected.value)});
        const first=selected.value[0];Object.assign(form,{receiver:first.receiver,phone:first.phone,address:first.address,logistics:'',date:new Date().toISOString().slice(0,10),remark:''});
      };
      const compatible=computed(()=>docs.value.filter(d=>d.state==='待出货'&&d.customer===dialog.items[0]?.customer&&d.receiver===dialog.items[0]?.receiver));
      const save=()=>{
        if(!dialog.items.length||dialog.items.some(l=>!Number.isInteger(l.qty)||l.qty<1||l.qty>(products.value.find(x=>x.sourceKey===l.sourceKey)?.qty||0)))return ElMessage.warning('交货数量必须是大于零且不超过待交货数的整数');
        let doc;
        if(dialog.mode==='append'){
          doc=S.clone(compatible.value.find(d=>d.no===dialog.target)||null);if(!doc)return ElMessage.warning('请选择可追加的待出货交货单');
          dialog.items.forEach(l=>{const old=doc.items.find(x=>x.sourceKey===l.sourceKey);if(old)old.qty+=l.qty;else doc.items.push(S.clone(l));});
        }else{
          if(!form.receiver.trim()||!form.date)return ElMessage.warning('请填写收货人和交货日期');
          doc=Object.assign({no:S.newId('JH'),customer:dialog.items[0].customer,state:'待出货',created:S.now(),items:S.clone(dialog.items)},S.clone(form));
        }
        doc.updated=S.now();try{S.saveDeliveryDocument(doc);dialog.open=false;selected.value=[];tab.value='built';ElMessage.success('交货单已保存到本机（Mock）');}catch(e){ElMessage.error('交货单保存失败，文档和明细均未改变，请保留表单后重试');}
      };
      const detail=ref(null);
      return {tab,selected,page,size,filters,options,products,filtered,search,reset,open,dialog,form,docs,compatible,save,detail};
    },
    template:`<div class="lp delivery-page"><el-tabs v-model="tab" @tab-change="selected=[]"><el-tab-pane label="未建交货单" name="pending"/><el-tab-pane label="已建交货单" name="built"/></el-tabs>
      <template v-if="tab==='pending'"><el-form inline label-width="80px" style="padding:12px 0">
        <el-form-item label="合作商"><el-select v-model="filters.customer" clearable filterable placeholder="请选择合作商" style="width:210px"><el-option v-for="c in options" :key="c" :label="c" :value="c"/></el-select></el-form-item>
        <el-form-item label="C端/业主"><el-input v-model="filters.receiver" placeholder="请输入名称或手机号码" style="width:210px" clearable/></el-form-item>
        <el-form-item label="交货日期"><el-date-picker v-model="filters.dates" type="daterange" value-format="YYYY-MM-DD" range-separator="至" style="width:250px"/></el-form-item>
        <el-form-item label="仓库"><el-select v-model="filters.warehouse" clearable placeholder="全部仓库" style="width:180px"><el-option label="成品一仓" value="成品一仓"/></el-select></el-form-item>
        <el-form-item label="产品"><el-input v-model="filters.product" clearable style="width:210px" @keyup.enter="search"/></el-form-item>
        <el-form-item label="订货单"><el-input v-model="filters.order" clearable style="width:210px" @keyup.enter="search"/></el-form-item>
        <el-form-item><el-button type="primary" @click="search">搜索</el-button><el-button @click="reset">重置</el-button></el-form-item>
      </el-form><div style="display:flex;gap:12px;margin-bottom:14px"><el-button type="primary" :disabled="!selected.length" @click="open('create')">创建交货单</el-button><el-button :disabled="!selected.length" @click="open('append')">添加到已建交货单</el-button></div>
      <p style="color:#909399;font-size:13px">请先筛选合作商、C端/业主或订货单后再查询要出库的产品，勾选对应产品后，即可创建交货单和添加到已建交货单。</p>
      <el-table :data="filtered.slice((page-1)*size,page*size)" row-key="sourceKey" border @selection-change="v=>selected=v"><el-table-column type="selection" :reserve-selection="true" width="44"/>
      <el-table-column label="产品" min-width="245"><template #default="s"><div style="display:flex;align-items:center;gap:10px"><el-image v-if="s.row.img" :src="s.row.img" :preview-src-list="[s.row.img]" preview-teleported style="width:58px;height:58px;flex-shrink:0" fit="contain"/><div>{{s.row.product}}<div style="color:#909399">{{s.row.code}}</div></div></div></template></el-table-column>
      <el-table-column v-for="c in [['spec','规格',190],['material','材质',160],['orderNo','订货单',160],['innerNo','内部单号',140],['qty','待交货数',100],['customer','合作商',200],['unit','单位',70],['receiver','C端/业主',130]]" :key="c[0]" :prop="c[0]" :label="c[1]" :min-width="c[2]"/>
      <el-table-column label="可用库存" width="100"><template #default="s"><span :style="{color:s.row.stock===0?'#f56c6c':''}">{{s.row.stock}}</span></template></el-table-column>
      <el-table-column prop="volume" label="体积" width="100"/><el-table-column prop="packages" label="包装件数" width="100"/>
      <el-table-column label="订单付款状态" width="140"><template #default="s"><el-tag :type="s.row.payStatus==='全部回款'?'success':'warning'">{{s.row.payStatus}}</el-tag></template></el-table-column>
      <el-table-column prop="remain" label="距离交期" width="130"/><el-table-column prop="date" label="交货日期" width="130"/><el-table-column prop="created" label="订单创建日期" width="170"/></el-table>
      <el-pagination style="margin-top:16px;justify-content:flex-end" layout="total,sizes,prev,pager,next" :total="filtered.length" :page-sizes="[10,20,50]" v-model:current-page="page" v-model:page-size="size"/>
      </template>
      <template v-else><el-table :data="docs" border><el-table-column prop="no" label="交货单号" min-width="180"/><el-table-column prop="customer" label="合作商" min-width="190"/><el-table-column prop="receiver" label="C端/业主" width="130"/><el-table-column label="总产品数量" width="110"><template #default="s">{{s.row.items.reduce((n,l)=>n+l.qty,0)}}</template></el-table-column><el-table-column label="关联订单数" width="110"><template #default="s">{{new Set(s.row.items.map(l=>l.orderNo)).size}}</template></el-table-column><el-table-column prop="logistics" label="物流" min-width="140"/><el-table-column prop="state" label="出货状态" width="110"/><el-table-column prop="created" label="申请时间" width="170"/><el-table-column prop="updated" label="更新时间" width="170"/><el-table-column label="操作" width="90" fixed="right"><template #default="s"><el-button link type="primary" @click="detail=s.row">查看</el-button></template></el-table-column></el-table><p style="color:#909399">本地 Mock：仅保存本机交货单，不执行真实出库。</p></template>
      <el-dialog v-model="dialog.open" :title="dialog.mode==='append'?'添加到已建交货单':'创建交货单'" width="min(920px,94vw)" :close-on-click-modal="false" destroy-on-close><el-alert title="本地 Mock：确认后保存本机交货单，不调用线上接口。" :closable="false"/>
      <el-form label-width="90px" style="margin-top:16px" v-if="dialog.mode==='create'"><el-form-item label="收货人" required><el-input v-model="form.receiver"/></el-form-item><el-form-item label="联系电话"><el-input v-model="form.phone"/></el-form-item><el-form-item label="收货地址"><el-input v-model="form.address"/></el-form-item><el-form-item label="交货日期" required><el-date-picker v-model="form.date" value-format="YYYY-MM-DD"/></el-form-item><el-form-item label="物流"><el-input v-model="form.logistics"/></el-form-item><el-form-item label="备注"><el-input v-model="form.remark" type="textarea"/></el-form-item></el-form>
      <el-select v-else v-model="dialog.target" placeholder="请选择同一合作商、业主的待出货交货单" style="width:100%;margin:16px 0"><el-option v-for="d in compatible" :key="d.no" :label="d.no+' · '+d.receiver" :value="d.no"/></el-select>
      <el-table :data="dialog.items" border><el-table-column prop="product" label="产品"/><el-table-column prop="orderNo" label="订货单"/><el-table-column label="本次交货数量" width="180"><template #default="s"><el-input-number v-model="s.row.qty" :min="1" :precision="0" style="width:145px"/></template></el-table-column></el-table>
      <template #footer><el-button @click="dialog.open=false">取消</el-button><el-button type="primary" @click="save">确认保存</el-button></template></el-dialog>
      <el-dialog :model-value="!!detail" title="交货单详情 · 本地 Mock" width="min(900px,94vw)" @close="detail=null"><template v-if="detail"><p>{{detail.no}} · {{detail.receiver}} · {{detail.address}}</p><el-table :data="detail.items" border><el-table-column prop="product" label="产品"/><el-table-column prop="orderNo" label="订货单"/><el-table-column prop="qty" label="数量"/></el-table></template></el-dialog>
    </div>`
  };

  /* ============ 根应用 ============ */
  const CUSTOM = {
    'deliver/index': 'DeliveryReplica',
    'workbench/index': 'Workbench', 'statistics/board': 'Board',
    'productionTracking/index': 'Tracking', 'printCenter/index': 'PrintCenter',
    'settings/index': 'Settings', 'settings/customer': 'Settings', 'settings/product': 'Settings', 'settings/manage': 'Settings',
    'lucky/list': 'Lucky'
  };

  /* 列表页「新增」应跳转到的独立编辑页 */
  const NEW_ROUTE = {
    'project/index': 'project/add', 'deliver/index': 'deliver/add', 'purchase/other': 'purchase/add',
    'reconciliation/index': 'reconciliation/add', 'purchase/supplier': 'purchase/supplier/add'
  };

  /* 线上注册但菜单里没有的业务子页面（此前点击会退回列表） */
  const SUB = {
    'project/add': 'OrderEdit', 'project/edit': 'OrderEdit',
    'deliver/add': 'DeliveryEditor', 'purchase/add': 'DocEdit', 'reconciliation/add': 'DocEdit',
    'palletPlan/add': 'DocEdit', 'purchase/supplier/add': 'DocEdit', 'warehouse/manage': 'DocEdit',
    'print/order': 'PrintOrder'
  };
  const SUB_NAME = {
    'project/add': '新增订货单', 'project/edit': '编辑订货单',
    'deliver/add': '新增交货单', 'purchase/add': '新增申购单', 'reconciliation/add': '新增付款单',
    'palletPlan/add': '新增生产计划', 'purchase/supplier/add': '新增供应商', 'warehouse/manage': '仓库管理',
    'print/order': '打印销售订单'
  };
  Object.keys(SUB_NAME).forEach((k) => { if (!NAME[k]) NAME[k] = SUB_NAME[k]; });

  /* ---- 合并 schema-b-extra.js 补齐的子页面（F01） ---- */
  Object.assign(CUSTOM, EX.custom || {});
  Object.assign(SUB, EX.sub || {});
  Object.assign(NEW_ROUTE, EX.newRoute || {});
  Object.keys(EX.names || {}).forEach((k) => { if (!NAME[k]) NAME[k] = EX.names[k]; });
  /* 列表型子页面（不在菜单里）也要有标题，否则 hash 路由会退回订货单管理 */
  Object.keys(window.SCHEMA_B_EXTRA || {}).forEach((k) => {
    if (!NAME[k]) NAME[k] = window.SCHEMA_B_EXTRA[k].name;
  });
  const NEW_LABEL = {
    'project/add': '新增订货单', 'deliver/add': '新增交货单', 'purchase/add': '新增申购单',
    'reconciliation/add': '新增付款单', 'purchase/supplier/add': '新增供应商',
    'lucky/add': '新增抽奖活动', 'physical/add': '新增商品', 'package/add': '新增套餐商品'
  };

  const app = createApp({
    components: Object.assign({
      TablePage, Workbench, Board, Tracking, PrintCenter, Settings, Lucky, OrderEdit, DocEdit, PrintOrder, DeliveryPage
    }, EX.comps || {}),
    setup() {
      const parseHash = () => {
        const h = (location.hash || '#/project/index').replace(/^#\/?/, '').split('?')[0];
        return (NAME[h] || SUB[h]) ? h : 'project/index';
      };
      const route = ref(parseHash());
      const params=ref(new URLSearchParams((location.hash.split('?')[1]||'')));
      const tabs = ref([{ key: 'workbench/index', name: '工作台' }, { key: 'project/index', name: '订货单管理' }]);
      const demo = ref(false), mobileMenu=ref(false), shareOpen=ref(false), phoneOpen=ref(false);
      const shareUrl=ref(location.href);
      const share=()=>{shareUrl.value=location.href;shareOpen.value=true;};
      const copyShare=async()=>{try{await navigator.clipboard.writeText(shareUrl.value);ElMessage.success('链接已复制');}catch(e){ElMessage.warning('请选中并复制链接');}};
      const fullscreen=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>ElMessage.warning('浏览器未允许全屏'));};
      const notice=computed(()=>{const o=window.SHARED.db.all('orders')[0];return o?o.no+' · '+(o.customer||'合作商未记录')+' · 应收 '+money(o.amount):'暂无订货单';});

      const ensureTab = (k,target) => { let tab=tabs.value.find(t=>t.key===k);if(!tab){tab={key:k,name:NAME[k]};tabs.value.push(tab);}if(target)tab.target=target; };
      ensureTab(route.value,location.hash);

      watch(route, (v) => { ensureTab(v); if(parseHash()!==v)location.hash = '#/' + v; });

      let acceptedHash=location.hash,navigationBusy=false;
      const go = async(k) => {const [path,qs]=String(k).replace(/^#?\/?/,'').split('?'),target='#/'+path+(qs?'?'+qs:'');if(!NAME[path]&&!SUB[path]){ElMessage.warning('页面不存在');return false;}if(target===acceptedHash)return true;if(navigationBusy)return false;navigationBusy=true;
        try{const guard=window.SHARED.activeLeaveGuard,unchanged=guard?.checkpoint?.();if(guard?.dirty()){await ElementPlus.ElMessageBox.confirm('当前页面有未保存的修改，离开后这些修改不会保留。',guard.title||'未保存的修改',{type:'warning',confirmButtonText:'放弃修改并离开',cancelButtonText:'继续编辑'});if(unchanged&&!unchanged()){ElMessage.warning('确认期间输入或页面已变化，请保留修改重新确认');return false;}}acceptedHash=target;params.value=new URLSearchParams(qs||'');location.hash=target;route.value=path;ensureTab(path,target);return true;}catch(e){return false;}finally{navigationBusy=false;}};
      const selectMenu=k=>{const map={'settings/customer':'customer','settings/product':'eprProduct'};if(map[k])return window.open('../admin/index.html#'+map[k],'_blank','noopener');go(k);};
      const closeTab = async(t) => {const i=tabs.value.findIndex(x=>x.key===t.key);if(i<0)return;if(route.value===t.key){const next=tabs.value[i>0?i-1:i+1];const destination=next?.target||next?.key||'workbench/index';if(next?.key===t.key)return;if(!await go(destination))return;}tabs.value=tabs.value.filter(x=>x.key!==t.key);if(!tabs.value.length)tabs.value.push({key:'workbench/index',name:'工作台'});};
      const confCache = {};
      const listConf = computed(() => {
        const k = route.value;
        if (!confCache[k]) confCache[k] = confFor(k);
        return confCache[k];
      });
      const pageComp = computed(() => route.value==='purchase/add'&&params.value.has('purchaseId')?'PurchaseDraftEdit':route.value==='purchase/add'&&params.value.get('type')==='outsource'?'OrderOutsourceApplication':route.value==='purchase/add'&&params.value.get('type')==='product'?'OrderProductApplication':route.value==='purchase/add'&&params.value.get('type')==='material'&&(params.value.has('sourceKey')||params.value.has('applicationId'))?'OrderMaterialApplication':route.value==='palletPlan/add'&&(params.value.has('sourceKey')||params.value.has('taskId'))?'OrderProductionPlan':(SUB[route.value] || CUSTOM[route.value] || 'ListPage'));
      const title = computed(() => NAME[route.value] || '');

      window.addEventListener('hashchange', () => {const requested=location.hash;if(requested===acceptedHash)return;history.replaceState(null,'',location.pathname+location.search+acceptedHash);go(requested);});

      /* 编辑时从 hash 读取单据号： #/project/edit?id=SO2608... */
      const editId = computed(() => {
        return params.value.get('id')||'';
      });

      /* 各组件只需拿到自己声明的 props，避免把函数型 nav 写成 DOM 属性 */
      const compProps = computed(() => {
        const p = pageComp.value;
        if (p === 'DocEdit' || p === 'StatPage' || p === 'Settings') return { rkey: route.value, nav: go };
        if (p === 'OrderOutsourceApplication' || p === 'OrderProductApplication' || p === 'OrderMaterialApplication') return {id:params.value.get('applicationId')||'',orderId:params.value.get('orderId')||'',sourceKey:params.value.get('sourceKey')||'',nav:go};
        if (p === 'OrderProductionPlan') return {id:params.value.get('taskId')||'',orderId:params.value.get('orderId')||'',sourceKey:params.value.get('sourceKey')||'',nav:go};
        if (p === 'PurchaseDraftEdit') return {id:params.value.get('purchaseId')||'',nav:go};
        if (p === 'DeliveryEditor') return { id: editId.value, orderNo:params.value.get('order')||'', nav:go };
        if (p === 'DeliveryReplica') return { nav:go };
        if (p === 'PaymentEdit') return { id: editId.value, nav: go };
        if (p === 'OrderEdit') return { id: editId.value, editApply:params.value.get('editApply')==='1', nav: go };
        if (p === 'PrintOrder') return { nav: go, id:editId.value, kind:params.value.get('kind')||'' };
        if (p === 'PrintCenter' || p === 'Lucky' || p === 'WarehouseCenter' || p === 'WarehouseManagement') return { nav: go };
        return {};
      });

      return { MENU, params, route, tabs, demo, go, closeTab, pageComp, compProps, listConf, title, NAME, editId, mobileMenu, shareOpen, phoneOpen, shareUrl, share, copyShare, fullscreen, notice, selectMenu };
    },
    template: `
    <div class="erp-shell theme-b" :class="{'demo-on': demo}">
      <SideNav theme="b" :menu="MENU" :active="route==='warehouse/manage'?'inventory/inquiry':route" :width="211" @select="selectMenu">
        <template #brand>
          <div class="mark">
            <svg viewBox="0 0 24 24" fill="none"><path d="M4 17c0-5 3-8 7-8 3.4 0 6 2.3 6 5.2 0 2.3-1.8 3.6-3.7 3.6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M18 4c-.6 4.6-3 7-6.4 7" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>
          </div>
          <div class="nm">管理系统</div>
        </template>
      </SideNav>

      <div class="erp-main">
        <header class="erp-top" data-demo="顶部公告 / 快捷图标 / 账号区">
          <el-button class="burger" text aria-label="打开功能导航" @click="mobileMenu=true"><el-icon><Fold /></el-icon></el-button>
          <div class="notice">
            <span>{{notice}}</span>
            <span class="arr">→</span>
          </div>
          <a class="lnk" href="../site/index.html" style="font-size:13px;color:#606266">返回官网</a>
          <div class="acts">
            <el-icon class="ic" role="button" tabindex="0" aria-label="全屏" @click="fullscreen" @keydown.enter="fullscreen"><FullScreen /></el-icon>
            <el-icon class="ic" role="button" tabindex="0" aria-label="手机预览" @click="phoneOpen=true" @keydown.enter="phoneOpen=true"><Cellphone /></el-icon>
            <el-icon class="ic" role="button" tabindex="0" aria-label="分享当前页面" @click="share" @keydown.enter="share"><Share /></el-icon>
          </div>
          <el-dropdown trigger="click" @command="go"><div class="user" tabindex="0"><span class="av">张</span>张松涛<el-icon><ArrowDown /></el-icon></div><template #dropdown><el-dropdown-menu><el-dropdown-item command="personal/setting">个人设置</el-dropdown-item><el-dropdown-item command="settings/index">系统设置</el-dropdown-item></el-dropdown-menu></template></el-dropdown>
        </header>

        <div class="erp-tabs" data-demo="多标签页（可关闭 / 自动补位）">
          <div class="erp-tab" v-for="t in tabs" :key="t.key" :class="{on: route===t.key}" @click="go(t.target||t.key)">
            <el-icon style="font-size:13px"><Tickets /></el-icon>
            <span>{{ t.name }}</span>
            <el-icon class="x" @click.stop="closeTab(t)"><Close /></el-icon>
          </div>
          <div class="more"><el-icon><More /></el-icon></div>
        </div>

        <div class="erp-body">
          <ListPage v-if="pageComp==='ListPage'" :key="route+'?'+params.toString()" :conf="listConf" @go="go" />
          <component v-else :is="pageComp" :key="route+'?'+params.toString()" v-bind="compProps" @go="go" />
        </div>
      </div>

      <el-drawer v-model="mobileMenu" title="功能导航" direction="ltr" size="260px"><el-menu :default-active="route" @select="k=>{go(k);mobileMenu=false}"><el-menu-item v-for="m in MENU" :key="m.key" :index="m.key">{{m.name}}</el-menu-item></el-menu></el-drawer>
      <el-dialog v-model="shareOpen" title="分享当前页面" width="min(560px,92vw)"><el-input v-model="shareUrl" readonly aria-label="当前页面链接"/><template #footer><el-button @click="shareOpen=false">关闭</el-button><el-button type="primary" @click="copyShare">复制链接</el-button></template></el-dialog>
      <el-dialog v-model="phoneOpen" title="官网手机预览" width="420px"><iframe v-if="phoneOpen" src="../site/index.html" title="官网手机预览" style="width:100%;height:620px;border:1px solid #dcdfe6"></iframe></el-dialog>
      <div class="demo-toggle" :class="{on: demo}" @click="demo=!demo"><span class="sw"></span><span>演示模式</span></div>
    </div>`
  });

  Object.entries(ElementPlusIconsVue).forEach(([k, v]) => app.component(k, v));
  Object.entries(EX.comps||{}).forEach(([k,v])=>app.component(k,v));
  app.use(ElementPlus, { locale: window.ElementPlusLocaleZhCn });
  if (window.SHARED && window.SHARED.register) window.SHARED.register(app);
  app.mount('#app');
})();
