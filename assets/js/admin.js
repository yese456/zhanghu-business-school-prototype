/* ============================================================
   系统 A · 客户后台管理（Vue 3 + Element Plus）
   ============================================================ */
(function () {
  'use strict';
  const { createApp, ref, reactive, computed, watch, nextTick } = Vue;
  const { ElMessage, ElMessageBox } = ElementPlus;
  const M = window.MOCK;

  /* ---------- 基础工具 ---------- */
  /* 菜单与页面结构统一来自采集结果（schema-a.js），保证与线上系统一致 */
  const SCHEMA = window.SCHEMA_A || {};
  const ICON_OF = {};
  M.adminMenu.forEach((c) => { ICON_OF[c.title] = c.icon; });

  const MENU = (function buildMenu() {
    const order = [];
    const map = {};
    Object.keys(SCHEMA).forEach((key) => {
      const sp = SCHEMA[key];
      if (!map[sp.chapter]) { map[sp.chapter] = { title: sp.chapter, icon: ICON_OF[sp.chapter] || 'Files', items: [] }; order.push(map[sp.chapter]); }
      map[sp.chapter].items.push({ key: key, name: sp.name, icon: 'Minus' });
    });
    if (order.length) return order;
    return M.adminMenu;
  })();

  const academyMenuOrder=['首页','工作台','订货单','任务中心','商城管理','直播管理','办会易','内容中心','工单管理','案例中心','业绩奖励','社区','抽奖活动','门店管理','营销管理','商学院','官网管理','积分商城','客户管理','营销短信','AI分析','公司管理','小程序设置','系统管理'];
  const academyMenu=academyMenuOrder.map(title=>MENU.find(c=>c.title===title)).filter(Boolean).map(c=>({...c,title:c.title==='社区'?'社区管理':c.title==='积分商城'?'积分专区':c.title}));

  const mallMenu=academyMenu.map(c=>{if(c.title!=='商城管理')return c;const keys=['shopDeco','eprProduct','storeProduct','productOrder','scheme','productService','sceneLibrary','refundForm','productAttribute','marketLabel','unit/index','serviceDiscount','vipShopSet'];return{...c,items:keys.map(key=>c.items.find(i=>i.key===key)).filter(Boolean).map(i=>({...i,name:i.key==='productService'?'服务单':i.name}))};});

  const TITLE = {};
  const CHAPTER_OF = {};
  MENU.forEach((c) => c.items.forEach((it) => { TITLE[it.key] = it.name; CHAPTER_OF[it.key] = c.title; }));

  const tagType = (v) => {
    const s = String(v);
    if (/完成|已付|已审核|已通过|成功|已签收|已入库|启用|在职|全部回款|已结算|已发放|已成交|已发货/.test(s)) return 'success';
    if (/待|部分|进行中|审核中|排产|生产中|处理中/.test(s)) return 'warning';
    if (/驳回|作废|逾期|停用|离职|退款|失败|异常/.test(s)) return 'danger';
    if (/已出库|已下单|待开工/.test(s)) return 'primary';
    return 'info';
  };

  const fmtDate = (s) => s || '-';

  /* ---------- 通用列表数据集 ---------- */
  function dsOrders() {
    return {
      cols: [
        { prop: 'no', label: '订货单号', width: 132, link: true },
        { prop: 'customer', label: '客户', width: 180, ellipsis: true },
        { prop: 'products', label: '产品数', width: 76, align: 'center' },
        { prop: 'amount', label: '订货金额', width: 110, align: 'right', money: true },
        { prop: 'paid', label: '已回款', width: 110, align: 'right', money: true },
        { prop: 'payStatus', label: '回款状态', width: 100, tag: true },
        { prop: 'produceStatus', label: '生产状态', width: 100, tag: true },
        { prop: 'delivery', label: '交货日期', width: 108 },
        { prop: 'owner', label: '归属人', width: 92 },
        { prop: 'createdAt', label: '创建时间', width: 152 }
      ],
      rows: M.orders,
      filters: [
        { type: 'input', label: '订货单号', ph: '订货单号 / 内部单号' },
        { type: 'input', label: '客户', ph: '客户名称 / 手机号' },
        { type: 'select', label: '生产状态', ph: '请选择', opts: M.produceStatuses },
        { type: 'daterange', label: '下单时间' }
      ]
    };
  }
  function dsCustomers() {
    return {
      cols: [
        { prop: 'name', label: '客户姓名', width: 110 },
        { prop: 'company', label: '公司名称', width: 210, ellipsis: true },
        { prop: 'phone', label: '手机号', width: 128 },
        { prop: 'level', label: '客户等级', width: 100, tag: true },
        { prop: 'region', label: '所在地区', width: 122 },
        { prop: 'owner', label: '归属人', width: 100 },
        { prop: 'orders', label: '订单数', width: 80, align: 'center' },
        { prop: 'amount', label: '成交金额', width: 110, align: 'right', money: true },
        { prop: 'source', label: '来源', width: 108 },
        { prop: 'followAt', label: '最近跟进', width: 110 }
      ],
      rows: M.customers,
      filters: [
        { type: 'input', label: '关键词', ph: '姓名 / 手机号 / 公司' },
        { type: 'select', label: '客户等级', ph: '请选择', opts: M.levels || ['战略客户', '重点客户', '普通客户', '潜在客户'] },
        { type: 'select', label: '归属人', ph: '请选择', opts: ['张松涛', '袁彩怡', '黎明Leon', '曾燕然', '李婉如'] },
        { type: 'daterange', label: '创建时间' }
      ]
    };
  }
  function dsProducts() {
    return {
      cols: [
        { prop: 'name', label: '商品名称', width: 240, prod: true },
        { prop: 'sku', label: '商品编码', width: 130 },
        { prop: 'catName', label: '分类', width: 100 },
        { prop: 'brand', label: '品牌', width: 110 },
        { prop: 'price', label: '售价', width: 110, align: 'right', money: true },
        { prop: 'stock', label: '库存', width: 80, align: 'center' },
        { prop: 'online', label: '上架状态', width: 96, tag: true },
        { prop: 'createdAt', label: '创建时间', width: 110 }
      ],
      rows: M.products,
      filters: [
        { type: 'input', label: '商品名称', ph: '名称 / 编码' },
        { type: 'select', label: '商品分类', ph: '全部', opts: M.cats.map((c) => c.name) },
        { type: 'select', label: '品牌', ph: '全部', opts: M.brands },
        { type: 'select', label: '上架状态', ph: '全部', opts: ['已上架', '已下架'] }
      ]
    };
  }
  function dsMaterials() {
    return {
      cols: [
        { prop: 'name', label: '材质名称', width: 220, prod: true },
        { prop: 'code', label: '材质编码', width: 130 },
        { prop: 'cat', label: '材质分类', width: 100 },
        { prop: 'grade', label: '等级', width: 80, align: 'center' },
        { prop: 'price', label: '单价', width: 100, align: 'right', money: true },
        { prop: 'supplier', label: '供应商', width: 140 },
        { prop: 'stock', label: '库存', width: 90, align: 'center' },
        { prop: 'status', label: '状态', width: 90, tag: true }
      ],
      rows: M.materials,
      filters: [
        { type: 'input', label: '材质名称', ph: '名称 / 编码' },
        { type: 'select', label: '材质分类', ph: '全部', opts: ['皮面', '布面', '大理石', '金属', '木面', '海绵', '油漆'] },
        { type: 'select', label: '等级', ph: '全部', opts: ['A', 'B', 'C'] },
        { type: 'select', label: '状态', ph: '全部', opts: ['启用', '停用'] }
      ]
    };
  }
  function dsSuppliers() {
    return {
      cols: [
        { prop: 'name', label: '供应商名称', width: 200 },
        { prop: 'code', label: '供应商编码', width: 130 },
        { prop: 'cat', label: '供货品类', width: 110 },
        { prop: 'contact', label: '联系人', width: 100 },
        { prop: 'phone', label: '联系电话', width: 130 },
        { prop: 'level', label: '等级', width: 80, align: 'center' },
        { prop: 'orders', label: '合作单数', width: 100, align: 'center' },
        { prop: 'status', label: '合作状态', width: 100, tag: true }
      ],
      rows: M.suppliers,
      filters: [
        { type: 'input', label: '供应商', ph: '名称 / 编码' },
        { type: 'select', label: '供货品类', ph: '全部', opts: ['皮面', '布面', '大理石', '金属', '木面', '海绵', '油漆'] },
        { type: 'select', label: '合作状态', ph: '全部', opts: ['合作中', '停用'] },
        { type: 'daterange', label: '更新时间' }
      ]
    };
  }
  function dsContents() {
    const names = ['2026 秋冬新品发布：云朵系列', '掌工厂 MES 3.2 上线公告', '深圳湾样板间案例解析', '真皮沙发的 7 个养护细节', '门店导购话术模板（含异议处理）', '大理石台面如何选？', '工厂开放日实录', '全屋定制报价逻辑说明'];
    const rows = Array.from({ length: 22 }, (_, i) => ({
      id: 'CT' + (1001 + i), name: names[i % names.length] + (i > 7 ? ' · 第' + (Math.floor(i / 8) + 1) + '期' : ''),
      cat: ['企业资讯', '产品知识', '案例解析', '运营干货'][i % 4],
      author: ['张松涛', '李婉如', '曾燕然'][i % 3],
      views: 30 + i * 17, likes: 3 + i,
      state: i % 6 === 3 ? '草稿' : '已发布',
      updatedAt: M.d(-i * 3)
    }));
    return {
      cols: [
        { prop: 'name', label: '标题', width: 320, ellipsis: true },
        { prop: 'cat', label: '分类', width: 110 },
        { prop: 'author', label: '作者', width: 100 },
        { prop: 'views', label: '浏览', width: 90, align: 'center' },
        { prop: 'likes', label: '点赞', width: 90, align: 'center' },
        { prop: 'state', label: '状态', width: 96, tag: true },
        { prop: 'updatedAt', label: '更新时间', width: 120 }
      ],
      rows,
      filters: [
        { type: 'input', label: '标题', ph: '请输入标题关键词' },
        { type: 'select', label: '分类', ph: '全部', opts: ['企业资讯', '产品知识', '案例解析', '运营干货'] },
        { type: 'select', label: '状态', ph: '全部', opts: ['已发布', '草稿'] },
        { type: 'daterange', label: '更新时间' }
      ]
    };
  }
  function dsCampaigns() {
    const names = ['新人首单立减 200', '中秋团圆礼盒拼团', '限时秒杀 · 单人沙发', '满 3 万减 2500', '加价购 · 抱枕', '老客带新返 500 积分', '展厅到店礼', '国庆抽奖活动'];
    const rows = Array.from({ length: 18 }, (_, i) => ({
      id: 'CP' + (2001 + i), name: names[i % names.length],
      type: ['满减', '拼团', '秒杀', '优惠券', '加价购', '抽奖'][i % 6],
      budget: 5000 + i * 1200, used: 120 + i * 33,
      start: M.d(-30 + i), end: M.d(20 + i),
      state: i % 5 === 4 ? '已结束' : (i % 7 === 6 ? '未开始' : '进行中'),
      owner: ['张松涛', '曾燕然'][i % 2]
    }));
    return {
      cols: [
        { prop: 'name', label: '活动名称', width: 260, ellipsis: true },
        { prop: 'type', label: '活动类型', width: 100 },
        { prop: 'budget', label: '预算', width: 110, align: 'right', money: true },
        { prop: 'used', label: '已核销', width: 96, align: 'center' },
        { prop: 'start', label: '开始时间', width: 110 },
        { prop: 'end', label: '结束时间', width: 110 },
        { prop: 'state', label: '状态', width: 96, tag: true },
        { prop: 'owner', label: '创建人', width: 100 }
      ],
      rows,
      filters: [
        { type: 'input', label: '活动名称', ph: '请输入活动名称' },
        { type: 'select', label: '活动类型', ph: '全部', opts: ['满减', '拼团', '秒杀', '优惠券', '加价购', '抽奖'] },
        { type: 'select', label: '状态', ph: '全部', opts: ['进行中', '未开始', '已结束'] },
        { type: 'daterange', label: '活动时间' }
      ]
    };
  }
  function dsOrg() {
    const rows = M.employees.concat(M.employees.slice(0, 6).map((e, i) => ({
      ...e, id: e.id + 'b', name: e.name + '（分店' + (i + 1) + '）', dept: '门店', role: '店长'
    })));
    return {
      cols: [
        { prop: 'name', label: '姓名', width: 130 },
        { prop: 'dept', label: '部门', width: 130 },
        { prop: 'role', label: '岗位', width: 130 },
        { prop: 'phone', label: '手机号', width: 130 },
        { prop: 'orders', label: '跟进单数', width: 100, align: 'center' },
        { prop: 'amount', label: '业绩', width: 120, align: 'right', money: true },
        { prop: 'status', label: '状态', width: 90, tag: true },
        { prop: 'joinedAt', label: '入职时间', width: 110 }
      ],
      rows,
      filters: [
        { type: 'input', label: '姓名', ph: '姓名 / 手机号' },
        { type: 'select', label: '部门', ph: '全部', opts: ['销售部', '设计部', '生产部', '财务部', '客服部', '仓储部', '采购部', '门店'] },
        { type: 'select', label: '状态', ph: '全部', opts: ['在职', '离职'] },
        { type: 'daterange', label: '入职时间' }
      ]
    };
  }
  function dsGeneric(name) {
    const rows = Array.from({ length: 26 }, (_, i) => ({
      id: 'G' + (5001 + i),
      name: name + '记录 ' + String(i + 1).padStart(3, '0'),
      code: 'NO-' + String(20260 + i * 3),
      owner: ['张松涛', '袁彩怡', '曾燕然', '黎明Leon'][i % 4],
      qty: 10 + i * 7,
      amount: 1200 + i * 830,
      state: ['已启用', '待处理', '已完成', '已停用'][i % 4],
      updatedAt: M.d(-i)
    }));
    return {
      cols: [
        { prop: 'name', label: '名称', width: 260, ellipsis: true },
        { prop: 'code', label: '编号', width: 130 },
        { prop: 'owner', label: '负责人', width: 110 },
        { prop: 'qty', label: '数量', width: 90, align: 'center' },
        { prop: 'amount', label: '金额', width: 110, align: 'right', money: true },
        { prop: 'state', label: '状态', width: 100, tag: true },
        { prop: 'updatedAt', label: '更新时间', width: 120 }
      ],
      rows,
      filters: [
        { type: 'input', label: '关键词', ph: '名称 / 编号' },
        { type: 'select', label: '状态', ph: '全部', opts: ['已启用', '待处理', '已完成', '已停用'] },
        { type: 'select', label: '负责人', ph: '全部', opts: ['张松涛', '袁彩怡', '曾燕然', '黎明Leon'] },
        { type: 'daterange', label: '更新时间' }
      ]
    };
  }

  function datasetFor(key, name) {
    if (/订货单|订单|工单|任务|退款|发货/.test(name)) return dsOrders();
    if (/客户|访客|会员|用户|公海/.test(name)) return dsCustomers();
    if (/材质/.test(name)) return dsMaterials();
    if (/供应商/.test(name)) return dsSuppliers();
    if (/商品|礼品|产品|画册/.test(name)) return dsProducts();
    if (/案例|资讯|文章|视频|内容|课程|海报|名片|话术|问卷|话题|评论/.test(name)) return dsContents();
    if (/优惠券|拼团|秒杀|满减|加价|抽奖|助力|众筹|推广|活动|广告|推荐/.test(name)) return dsCampaigns();
    if (/员工|管理员|角色|组织|部门|团队|交接|管理员/.test(name)) return dsOrg();
    return dsGeneric(name);
  }

  const SETTING_KEYS = /Set$|Setting$|^programSet$|^cardSet$|^companyInfo$|^pointsSetting$/;

  /* ---------- 通用列表组件 ---------- */
  const GenericList = {
    props: ['title', 'conf'],
    setup(props) {
      const kw = ref('');
      const st = ref('');
      const page = ref(1);
      const size = ref(10);
      const checked = ref([]);
      const drawer = ref(false);
      const detail = ref(null);
      const form = reactive({ name: '', code: '', owner: '张松涛', state: '已启用', remark: '' });

      const rows = computed(() => props.conf.rows);
      const paged = computed(() => rows.value.slice((page.value - 1) * size.value, page.value * size.value));
      const stateGroups = computed(() => {
        const m = {};
        rows.value.forEach((r) => {
          const v = r.state || r.status || r.stage;
          if (v !== undefined && v !== null && v !== '') m[v] = (m[v] || 0) + 1;
        });
        return m;
      });

      const openNew = () => { drawer.value = true; Object.assign(form, { name: '', code: '', owner: '张松涛', state: '已启用', remark: '' }); };
      const submit = () => {
        if (!form.name) return ElMessage.warning('请输入名称');
        drawer.value = false;
        ElMessage.success('保存成功（原型演示）');
      };
      const rowAction = (act, row) => {
        if (act === 'detail') return (detail.value = row);
        if (act === 'del') {
          return ElMessageBox.confirm(`确认删除「${row.name || row.no}」？`, '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
            .then(() => ElMessage.success('已删除（原型演示）')).catch(() => {});
        }
        ElMessage.info('打开编辑：' + (row.name || row.no));
      };
      return { kw, st, page, size, checked, drawer, detail, form, paged, rows, stateGroups, openNew, submit, rowAction, tagType, TITLE };
    },
    template: `
    <div>
      <div class="page-hd" data-demo="页面标题区">
        <h3>{{ title }}</h3><span class="desc">共 {{ rows.length }} 条记录</span>
        <div class="ops">
          <el-button size="small" @click="rowAction('export')">导出</el-button>
          <el-button size="small" type="primary" @click="openNew">新建</el-button>
        </div>
      </div>
      <div class="filter" data-demo="查询筛选区">
        <div class="row">
          <div class="fi" v-for="(f,i) in conf.filters" :key="i">
            <label>{{ f.label }}</label>
            <el-input v-if="f.type==='input'" v-model="kw" :placeholder="f.ph" size="default" clearable />
            <el-select v-else-if="f.type==='select'" v-model="st" :placeholder="f.ph" clearable>
              <el-option v-for="o in f.opts" :key="o" :label="o" :value="o" />
            </el-select>
            <el-date-picker v-else type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" style="width:240px" />
          </div>
          <div class="acts">
            <el-button type="primary" size="default" @click="page=1">搜索</el-button>
            <el-button size="default" @click="kw='';st=''">重置</el-button>
          </div>
        </div>
      </div>
      <div class="status-tabs" data-demo="状态切换">
        <div class="t" :class="{on: st===''}" @click="st=''">全部 <el-badge class="count-badge" :value="String(rows.length)" :show-zero="true" :type="st===''?'primary':'info'" /></div>
        <div class="t" v-for="(n,k) in stateGroups" :key="k" :class="{on: st===k}" @click="st=k">{{ k }} <el-badge class="count-badge" :value="String(n)" :show-zero="true" :type="st===k?'primary':'info'" /></div>
      </div>
      <div class="table-wrap" data-demo="数据表格">
        <el-table :data="paged" size="default" @selection-change="v=>checked=v" style="width:100%">
          <el-table-column type="selection" width="46" />
          <el-table-column v-for="c in conf.cols" :key="c.prop" :prop="c.prop" :label="c.label"
            :width="c.width" :align="c.align||'left'" :show-overflow-tooltip="c.ellipsis">
            <template #default="s">
              <span v-if="c.tag"><el-tag size="small" :type="tagType(s.row[c.prop])" effect="light">{{ s.row[c.prop]===true?'已上架':(s.row[c.prop]===false?'已下架':s.row[c.prop]) }}</el-tag></span>
              <span v-else-if="c.money" class="num">{{ '¥' + Number(s.row[c.prop]).toLocaleString('zh-CN') }}</span>
              <span v-else-if="c.link" class="link" @click="rowAction('detail',s.row)">{{ s.row[c.prop] }}</span>
              <div v-else-if="c.prod" class="cell-prod">
                <img class="thumb" :src="s.row.img" alt="">
                <div><div class="nm">{{ s.row[c.prop] }}</div><div class="sk">{{ s.row.sku || s.row.code }}</div></div>
              </div>
              <span v-else>{{ s.row[c.prop] }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="s">
              <span class="link" @click="rowAction('detail',s.row)">详情</span>
              <span class="link" @click="rowAction('edit',s.row)">编辑</span>
              <span class="link" @click="rowAction('del',s.row)">删除</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <span class="total">已选 {{ checked.length }} 项 / 共 {{ rows.length }} 条</span>
          <el-pagination background layout="sizes, prev, pager, next, jumper" :total="rows.length"
            v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" />
        </div>
      </div>

      <el-drawer v-model="drawer" :title="'新建' + title" size="520px">
        <el-form label-width="88px" label-position="right">
          <el-form-item label="名称" required><el-input v-model="form.name" placeholder="请输入名称" /></el-form-item>
          <el-form-item label="编号"><el-input v-model="form.code" placeholder="系统可自动生成" /></el-form-item>
          <el-form-item label="负责人">
            <el-select v-model="form.owner" style="width:100%">
              <el-option v-for="o in ['张松涛','袁彩怡','曾燕然','黎明Leon']" :key="o" :label="o" :value="o" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="form.state">
              <el-radio label="已启用">启用</el-radio><el-radio label="待处理">暂存</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="drawer=false">取消</el-button>
          <el-button type="primary" @click="submit">保存</el-button>
        </template>
      </el-drawer>

      <el-dialog v-model="detail" title="详情" width="640px">
        <div class="desc-grid" v-if="detail">
          <div class="i" v-for="(k,i) in Object.keys(detail).slice(0,10)" :key="i">
            <span class="k">{{ k }}</span><span class="v">{{ detail[k] }}</span>
          </div>
        </div>
      </el-dialog>
    </div>`
  };

  /* ---------- 首页 ---------- */
  const Dashboard = {
    setup() {
      const period = ref('today');
      const t = computed(() => M.traffic[period.value]);
      const periods = [['today', '今天'], ['yesterday', '昨天'], ['week', '最近7天'], ['month', '最近30天'], ['thisWeek', '本周']];
      const openNotice=n=>{n.read=true;window.SHARED.store.set('notice:read',M.notices.filter(x=>x.read).map(x=>x.id));ElMessageBox.alert(n.content,n.title,{confirmButtonText:'知道了'});};
      return { M, period, periods, t, openNotice };
    },
    template: `
    <div>
      <div class="panel dashboard-overview" style="margin-bottom:16px" data-demo="账户概览">
        <div class="kpi-grid">
          <div class="kpi-cell"><div class="lb">员工总数</div><div class="vl">{{ M.kpi.staff }}<span class="u">人</span></div></div>
          <div class="kpi-cell"><div class="lb">营销账号数</div><div class="vl">{{ M.kpi.marketingAccounts }}<span class="u">/{{ M.kpi.marketingTotal }}</span></div></div>
          <div class="kpi-cell"><div class="lb">下单账号数</div><div class="vl">{{ M.kpi.orderAccounts }}<span class="u">/{{ M.kpi.orderTotal }}</span></div></div>
          <div class="kpi-cell"><div class="lb">生产账号数</div><div class="vl">{{ M.kpi.produceAccounts }}<span class="u">/{{ M.kpi.produceTotal }}</span></div></div>
          <div class="kpi-cell"><div class="lb">已使用天数</div><div class="vl">{{ M.kpi.usedDays }}<span class="u">天</span></div><div class="sub">{{ M.kpi.usedDate }}</div></div>
          <div class="kpi-cell"><div class="lb">剩余可用天数</div><div class="vl">{{ M.kpi.leftDays }}<span class="u">天</span></div><div class="sub">{{ M.kpi.leftDate }}</div></div>
          <div class="kpi-cell"><div class="lb">已获取客户数</div><div class="vl">{{ M.kpi.customers }}<span class="u">人</span></div></div>
          <div class="kpi-cell"><div class="lb">已成交客户数</div><div class="vl">{{ M.kpi.deals }}<span class="u">人</span></div></div>
        </div>
      </div>

      <div class="dashboard-middle" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px">
        <div class="panel" data-demo="流量统计">
          <div class="seg">
            <button v-for="p in periods" :key="p[0]" class="b" :class="{on: period===p[0]}" @click="period=p[0]">{{ p[1] }}</button>
          </div>
          <div class="traffic" style="height:220px">
            <div class="it"><div class="lb">客户数</div><div class="vl">{{ t.customers }}</div></div>
            <div class="it"><div class="lb">跟进总数</div><div class="vl">{{ t.follow }}</div></div>
            <div class="it"><div class="lb">浏览总数</div><div class="vl">{{ t.views }}</div></div>
            <div class="it"><div class="lb">被转发总数</div><div class="vl">{{ t.forward }}</div></div>
            <div class="it"><div class="lb">被保存总数</div><div class="vl">{{ t.saved }}</div></div>
            <div class="it"><div class="lb">被点赞总数</div><div class="vl">{{ t.likes }}</div></div>
          </div>
        </div>
        <div class="panel" data-demo="消息通知">
          <div class="panel-hd">通知<span class="extra" role="button" tabindex="0" @click="$emit('notices')" @keydown.enter="$emit('notices')">查看更多 ›</span></div>
          <div class="notice-list">
            <div class="notice-it" v-for="n in M.notices" :key="n.id">
              <span class="tt" @click="openNotice(n)">{{ n.title }}</span>
              <span class="ct">{{ n.content }}</span>
              <span class="tm">{{ n.time }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="panel dashboard-quick" data-demo="常用功能入口">
        <div class="panel-hd">常用功能</div>
        <div class="quick">
          <div class="it" v-for="q in M.quickActions" :key="q.key" @click="$emit('go', q.key)">
            <el-icon class="ic"><component :is="q.icon" /></el-icon>
            <span class="lb">{{ q.name }}</span>
          </div>
        </div>
      </div>
    </div>`
  };

  /* ---------- 工作台 ---------- */
  const Workbench = {
    setup() {
      const todo = M.orders.slice(0, 6).map((o, i) => ({
        no: o.no, from: o.owner, time: o.createdAt, op: ['跟进', '回款', '排产'][i % 3], state: ['待处理', '处理中', '已完成'][i % 3]
      }));
      return { todo, tagType };
    },
    template: `
    <div>
      <div class="page-hd"><h3>工作台</h3></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px">
        <div class="panel" style="padding:16px" v-for="k in [
          {l:'今日新增客户', v:3, c:'#409eff'}, {l:'待跟进客户', v:12, c:'#e6a23c'},
          {l:'本月成交额', v:'¥186,400', c:'#67c23a'}, {l:'待处理事项', v:7, c:'#f56c6c'}]" :key="k.l">
          <div class="muted">{{ k.l }}</div>
          <div style="font-size:24px;margin-top:8px;color:#303133;font-family:var(--font-num)">{{ k.v }}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-hd">待办事项<span class="extra">全部 ›</span></div>
        <el-table :data="todo" size="default">
          <el-table-column prop="no" label="订货单号" width="140" />
          <el-table-column prop="from" label="发起人" width="120" />
          <el-table-column prop="op" label="事项类型" width="120" />
          <el-table-column prop="time" label="创建时间" width="200" />
          <el-table-column prop="state" label="状态" width="110">
            <template #default="s"><el-tag size="small" :type="tagType(s.row.state)">{{ s.row.state }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作"><template #default><span class="link">处理</span></template></el-table-column>
        </el-table>
      </div>
    </div>`
  };

  /* ---------- 订货单管理 ---------- */
  const ORDER_TABS = ['待排产', '待开工', '生产中', '已入库', '已出库', '已作废'];
  const OrderList = {
    setup() {
      const kw = ref(''); const tab = ref('全部'); const page = ref(1); const size = ref(10);
      const detail = ref(null);
      const list = computed(() => window.SHARED.db.all('orders'));
      const filters=reactive({customer:'',stage:'',dates:[]});
      /* 计数从当前数据集统计，不再写死 */
      const tabs = computed(() => {
        const m = { 全部: list.value.length };
        ORDER_TABS.forEach((t) => { m[t] = list.value.filter((o) => o.produceStatus === t).length; });
        return Object.entries(m);
      });
      const rows = computed(() => {
        let r = tab.value === '全部' ? list.value : list.value.filter((o) => o.produceStatus === tab.value);
        const k = kw.value.trim();
        if (k) r = r.filter((o) => (o.no + o.customer + (o.productName || '') + (o.owner || '')).indexOf(k) >= 0);
        if(filters.customer)r=r.filter(o=>(o.customer+o.customerName+o.phone).includes(filters.customer));
        if(filters.stage)r=r.filter(o=>o.produceStatus===filters.stage);
        if(filters.dates?.length===2)r=r.filter(o=>String(o.createdAt).slice(0,10)>=filters.dates[0]&&String(o.createdAt).slice(0,10)<=filters.dates[1]);
        return r;
      });
      const paged = computed(() => rows.value.slice((page.value - 1) * size.value, page.value * size.value));
      const today = () => new Date().toISOString().slice(0, 10);

      /* 新建订货单：与线上一致的整单表单（订单归属 / 客户 / 收货 / 明细 / 金额） */
      const form = reactive({ open: false, data: {} });
      const formFields = [
        { key: 'name', label: '订货单名称', required: true, span: 2, ph: '如：张甜定制客厅套系' },
        { key: 'customer', label: '订单归属', type: 'select', required: true, opts: M.customers.map((c) => c.name).slice(0, 12) },
        { key: 'channel', label: '下单渠道', type: 'select', opts: ['小程序', '官网', '门店', '销售代下单'] },
        { key: 'owner', label: '销售', type: 'select', opts: ['张松涛', '袁彩怡', '曾燕然', '李静'] },
        { key: 'follower', label: '跟单员', type: 'select', opts: ['周慧', '吴敏', '刘洋'] },
        { key: 'contact', label: '收货人', required: true },
        { key: 'phone', label: '联系电话', required: true, ph: '11 位手机号' },
        { key: 'delivery', label: '交货日期', type: 'date' },
        { key: 'address', label: '收货地址', span: 2, ph: '省 / 市 / 区 + 详细地址' },
        { key: 'remark', label: '订单说明', type: 'textarea', span: 2 }
      ];
      const openNew = () => {
        window.open('../erp/index.html#/project/add?from=admin','_blank','noopener');
      };
      const submitOrder = (d) => {
        if (!/^1[3-9]\d{9}$/.test(String(d.phone || ''))) { ElMessage.warning('请填写正确的 11 位手机号'); return; }
        const no = 'SO' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + String(100 + list.value.length).slice(-3);
        list.value.unshift({
          id: no, no, innerNo: '', name: d.name, customer: d.customer, customerName: d.contact,
          channel: d.channel, owner: d.owner, delivery: d.delivery, partner: '—',
          amount: 0, paid: 0, unpaid: 0, payStatus: '未回款', produceStatus: '待排产',
          productName: '（待添加商品）', products: 0, productImg: '../assets/img/sofa-1.jpg',
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false }), remark: d.remark
        });
        form.open = false;
        tab.value = '全部'; page.value = 1;
        ElMessage.success('订货单 ' + no + ' 已创建（草稿），可在列表首行查看');
      };
      /* 线上行为：A 后台的订货单实际打开 ERP 系统（新标签），这里保留同页列表并给出跨系统入口 */
      const openErp = () => {
        window.open('../erp/index.html#/project/index', '_blank');
        ElMessage.success('已在 ERP 系统新标签中打开订货单管理');
      };
      const editOrder=o=>window.open('../erp/index.html#/project/edit?id='+encodeURIComponent(o.no),'_blank','noopener');
      const reset=()=>{kw.value='';tab.value='全部';page.value=1;Object.assign(filters,{customer:'',stage:'',dates:[]});};
      watch([kw,()=>filters.customer,()=>filters.stage,size],()=>page.value=1);
      return { kw, tab, page, size, tabs, rows, paged, detail, tagType, form, formFields, openNew, submitOrder, openErp,filters,reset,editOrder };
    },
    template: `
    <div>
      <div class="filter" data-demo="高级查询">
        <div class="row">
          <div class="fi"><label>订货单号</label><el-input v-model="kw" placeholder="订货单号 / 内部单号" /></div>
          <div class="fi"><label>客户</label><el-input v-model="filters.customer" placeholder="客户名称 / 手机号" /></div>
          <div class="fi"><label>生产状态</label>
            <el-select v-model="filters.stage" placeholder="全部" clearable><el-option v-for="s in ['待排产','待开工','生产中','已入库','已出库']" :key="s" :label="s" :value="s" /></el-select>
          </div>
          <div class="fi"><label>下单时间</label><el-date-picker v-model="filters.dates" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width:240px" /></div>
          <div class="acts">
            <el-button type="primary" @click="page=1">搜索</el-button>
            <el-button @click="reset">重置</el-button>
            <el-button type="primary" plain @click="openNew">+ 新建订货单</el-button>
            <el-button plain @click="openErp">在 ERP 中打开</el-button>
          </div>
        </div>
      </div>
      <div class="status-tabs" data-demo="生产状态分组">
        <div class="t" v-for="t in tabs" :key="t[0]" :class="{on: tab===t[0]}" @click="tab=t[0];page=1">{{ t[0] }} <el-badge class="count-badge" :value="String(t[1])" :show-zero="true" :type="tab===t[0]?'primary':'info'" /></div>
      </div>
      <div class="table-wrap">
        <el-table :data="paged" size="default">
          <el-table-column prop="no" label="订货单号" width="150">
            <template #default="s"><div><span class="link" @click="detail=s.row">{{ s.row.no }}</span><div class="muted">{{ s.row.innerNo || '—' }}</div></div></template>
          </el-table-column>
          <el-table-column label="产品" width="230">
            <template #default="s">
              <div class="cell-prod"><img v-if="s.row.productImg" class="thumb" :src="s.row.productImg"><span v-else class="image-empty">待补图</span><div>
                <div class="nm">{{ s.row.productName }}</div><div class="sk">共 {{ s.row.products }} 件商品</div></div></div>
            </template>
          </el-table-column>
          <el-table-column prop="customer" label="客户" width="180" show-overflow-tooltip />
          <el-table-column prop="amount" label="订单金额" width="110" align="right">
            <template #default="s"><span class="num">{{ '¥' + s.row.amount.toLocaleString() }}</span></template>
          </el-table-column>
          <el-table-column prop="paid" label="已回款" width="110" align="right">
            <template #default="s"><span class="num">{{ '¥' + s.row.paid.toLocaleString() }}</span></template>
          </el-table-column>
          <el-table-column prop="payStatus" label="回款状态" width="106">
            <template #default="s"><el-tag size="small" :type="tagType(s.row.payStatus)">{{ s.row.payStatus }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="produceStatus" label="生产状态" width="106">
            <template #default="s"><el-tag size="small" :type="tagType(s.row.produceStatus)">{{ s.row.produceStatus }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="delivery" label="交货日期" width="112" />
          <el-table-column prop="owner" label="归属人" width="94" />
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="s">
              <span class="link" @click="detail=s.row">详情</span>
              <span class="link" @click="editOrder(s.row)">编辑</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <span class="total">共 {{ rows.length }} 条</span>
          <el-pagination background layout="sizes, prev, pager, next, jumper" :total="rows.length"
            v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" />
        </div>
      </div>

      <el-drawer v-model="detail" title="订货单详情" size="620px">
        <template v-if="detail">
          <div class="form-sec">基本信息</div>
          <div class="desc-grid">
            <div class="i"><span class="k">订货单号</span><span class="v">{{ detail.no }}</span></div>
            <div class="i"><span class="k">内部单号</span><span class="v">{{ detail.innerNo || '—' }}</span></div>
            <div class="i"><span class="k">客户</span><span class="v">{{ detail.customer }}</span></div>
            <div class="i"><span class="k">联系人</span><span class="v">{{ detail.customerName }}</span></div>
            <div class="i"><span class="k">下单渠道</span><span class="v">{{ detail.channel }}</span></div>
            <div class="i"><span class="k">归属人</span><span class="v">{{ detail.owner }}</span></div>
            <div class="i"><span class="k">交货日期</span><span class="v">{{ detail.delivery }}</span></div>
            <div class="i"><span class="k">合作商</span><span class="v">{{ detail.partner }}</span></div>
          </div>
          <div class="form-sec" style="margin-top:18px">金额信息</div>
          <div class="desc-grid">
            <div class="i"><span class="k">订单金额</span><span class="v num">¥{{ detail.amount.toLocaleString() }}</span></div>
            <div class="i"><span class="k">已回款</span><span class="v num">¥{{ detail.paid.toLocaleString() }}</span></div>
            <div class="i"><span class="k">待回款</span><span class="v num">¥{{ detail.unpaid.toLocaleString() }}</span></div>
            <div class="i"><span class="k">回款状态</span><span class="v">{{ detail.payStatus }}</span></div>
          </div>
          <div class="form-sec" style="margin-top:18px">商品明细</div>
          <el-table :data="[{ n: detail.productName, q: detail.products, img: detail.productImg, p: detail.amount }]" size="small">
            <el-table-column label="商品" width="240">
              <template #default="s"><div class="cell-prod"><img class="thumb" :src="s.row.img"><span class="nm">{{ s.row.n }}</span></div></template>
            </el-table-column>
            <el-table-column prop="q" label="数量" width="80" align="center" />
            <el-table-column label="小计" align="right">
              <template #default="s"><span class="num">¥{{ s.row.p.toLocaleString() }}</span></template>
            </el-table-column>
          </el-table>
          <div v-if="detail.remark" style="margin-top:14px;background:#f7f9fc;border:1px dashed #dfe6f0;padding:10px 12px;font-size:13px;color:#606266">
            备注：{{ detail.remark }}
          </div>
        </template>
      </el-drawer>

      <FormDialog v-model="form.open" title="新建订货单" :fields="formFields" :model="form.data"
        width="820px" confirm-text="保存草稿" @submit="submitOrder" />
    </div>`
  };

  /* ---------- 客户管理 ---------- */
  const CustomerList = {
    setup() {
      const kw = ref(''); const page = ref(1); const size = ref(10); const detail = ref(null);
      const rows = computed(() => M.customers.filter((c) => !kw.value || c.name.includes(kw.value) || c.phone.includes(kw.value)));
      const paged = computed(() => rows.value.slice((page.value - 1) * size.value, page.value * size.value));
      return { kw, page, size, rows, paged, detail, tagType };
    },
    template: `
    <div>
      <div class="page-hd"><h3>客户管理</h3><span class="desc">共 {{ rows.length }} 位客户</span>
        <div class="ops"><el-button size="small">导入</el-button><el-button size="small" type="primary" @click="$message.success('已打开新建客户（原型演示）')">+ 新建客户</el-button></div>
      </div>
      <div class="filter">
        <div class="row">
          <div class="fi"><label>关键词</label><el-input v-model="kw" placeholder="姓名 / 手机号 / 公司" clearable /></div>
          <div class="fi"><label>客户等级</label><el-select placeholder="全部" clearable><el-option v-for="l in ['战略客户','重点客户','普通客户','潜在客户']" :key="l" :label="l" :value="l" /></el-select></div>
          <div class="fi"><label>归属人</label><el-select placeholder="全部" clearable><el-option v-for="o in ['张松涛','袁彩怡','曾燕然']" :key="o" :label="o" :value="o" /></el-select></div>
          <div class="acts"><el-button type="primary">搜索</el-button><el-button @click="kw=''">重置</el-button></div>
        </div>
      </div>
      <div class="table-wrap">
        <el-table :data="paged" size="default">
          <el-table-column label="客户" width="190">
            <template #default="s"><div class="cell-prod">
              <div style="width:32px;height:32px;border-radius:50%;background:#eaf2ff;color:#409eff;display:flex;align-items:center;justify-content:center;font-size:13px">{{ s.row.name.slice(0,1) }}</div>
              <div><div class="nm">{{ s.row.name }}</div><div class="sk">{{ s.row.phone }}</div></div>
            </div></template>
          </el-table-column>
          <el-table-column prop="company" label="公司" width="220" show-overflow-tooltip />
          <el-table-column prop="level" label="等级" width="106">
            <template #default="s"><el-tag size="small" :type="tagType(s.row.level)">{{ s.row.level }}</el-tag></template>
          </el-table-column>
          <el-table-column label="标签" width="180">
            <template #default="s"><el-tag v-for="t in s.row.tags" :key="t" size="small" type="info" effect="plain" style="margin-right:4px">{{ t }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="region" label="地区" width="120" />
          <el-table-column prop="owner" label="归属人" width="100" />
          <el-table-column prop="orders" label="订单数" width="86" align="center" />
          <el-table-column label="成交金额" width="120" align="right">
            <template #default="s"><span class="num">¥{{ s.row.amount.toLocaleString() }}</span></template>
          </el-table-column>
          <el-table-column prop="followAt" label="最近跟进" width="112" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="s"><span class="link" @click="detail=s.row">详情</span><span class="link" @click="$message.info('已打开跟进记录')">跟进</span></template>
          </el-table-column>
        </el-table>
        <div class="pager"><span class="total">共 {{ rows.length }} 条</span>
          <el-pagination background layout="sizes, prev, pager, next, jumper" :total="rows.length" v-model:current-page="page" v-model:page-size="size" :page-sizes="[10,20,50]" />
        </div>
      </div>
      <el-drawer v-model="detail" title="客户详情" size="560px">
        <template v-if="detail">
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:18px">
            <div style="width:48px;height:48px;border-radius:50%;background:#eaf2ff;color:#409eff;display:flex;align-items:center;justify-content:center;font-size:20px">{{ detail.name.slice(0,1) }}</div>
            <div><div style="font-size:16px;color:#303133">{{ detail.name }}</div>
              <div class="muted">{{ detail.company }}</div></div>
            <el-tag style="margin-left:auto" :type="tagType(detail.level)">{{ detail.level }}</el-tag>
          </div>
          <div class="desc-grid">
            <div class="i"><span class="k">手机号</span><span class="v">{{ detail.phone }}</span></div>
            <div class="i"><span class="k">所在地区</span><span class="v">{{ detail.region }}</span></div>
            <div class="i"><span class="k">来源</span><span class="v">{{ detail.source }}</span></div>
            <div class="i"><span class="k">归属人</span><span class="v">{{ detail.owner }}</span></div>
            <div class="i"><span class="k">订单数</span><span class="v">{{ detail.orders }}</span></div>
            <div class="i"><span class="k">成交金额</span><span class="v num">¥{{ detail.amount.toLocaleString() }}</span></div>
            <div class="i"><span class="k">创建时间</span><span class="v">{{ detail.createdAt }}</span></div>
            <div class="i"><span class="k">最近跟进</span><span class="v">{{ detail.followAt }}</span></div>
          </div>
          <div class="form-sec" style="margin-top:18px">跟进记录</div>
          <el-timeline style="padding-left:6px">
            <el-timeline-item v-for="(r,i) in [
              {t: detail.followAt, c:'电话沟通，客户确认 10 月下旬进店选样。'},
              {t: '2026-09-12', c:'发送沙发/茶几搭配方案，客户已查看。'},
              {t: '2026-08-28', c:'首次留资，来源：' + detail.source}]" :key="i" :timestamp="r.t">{{ r.c }}</el-timeline-item>
          </el-timeline>
        </template>
      </el-drawer>
    </div>`
  };

  /* ---------- 商品管理（网格） ---------- */
  const ProductGrid = {
    setup() {
      const kw = ref(''); const cat = ref(''); const edit = ref(null);
      const rows = computed(() => M.products.filter((p) => (!cat.value || p.catName === cat.value) && (!kw.value || p.name.includes(kw.value))));
      const form = reactive({ name: '', brand: '', price: 0, stock: 0, online: true });
      const openEdit = (p) => { edit.value = p; Object.assign(form, { name: p.name, brand: p.brand, price: p.price, stock: p.stock, online: p.online }); };
      return { kw, cat, rows, edit, form, M, openEdit };
    },
    template: `
    <div>
      <div class="page-hd"><h3>商品管理</h3><span class="desc">共 {{ rows.length }} 个商品</span>
        <div class="ops"><el-button size="small">批量上架</el-button><el-button size="small" type="primary" @click="$message.success('已打开新建商品（原型演示）')">+ 新建商品</el-button></div>
      </div>
      <div class="filter">
        <div class="row">
          <div class="fi"><label>商品名称</label><el-input v-model="kw" placeholder="名称 / 编码" clearable /></div>
          <div class="fi"><label>分类</label>
            <el-select v-model="cat" placeholder="全部" clearable><el-option v-for="c in M.cats" :key="c.key" :label="c.name" :value="c.name" /></el-select>
          </div>
          <div class="fi"><label>品牌</label><el-select placeholder="全部" clearable><el-option v-for="b in M.brands" :key="b" :label="b" :value="b" /></el-select></div>
          <div class="acts"><el-button type="primary">搜索</el-button><el-button @click="kw='';cat=''">重置</el-button></div>
        </div>
      </div>
      <div class="grid-prods">
        <div class="pcard" v-for="p in rows" :key="p.id">
          <div class="img"><img :src="p.img" :alt="p.name"></div>
          <div class="bd">
            <div class="nm">{{ p.name }}</div>
            <div class="muted" style="margin-top:4px">{{ p.sku }} · {{ p.brand }}</div>
            <div class="mt">
              <span class="pr">{{ '¥' + p.price.toLocaleString() }}{{ p.priceFrom ? ' 起' : '' }}</span>
              <el-tag size="small" :type="p.online ? 'success' : 'info'">{{ p.online ? '已上架' : '已下架' }}</el-tag>
            </div>
            <div class="ops"><span class="link" @click="openEdit(p)">编辑</span><span class="link">规格</span><span class="link">下架</span></div>
          </div>
        </div>
      </div>
      <el-empty v-if="!rows.length" description="没有匹配的商品" />

      <el-drawer v-model="edit" title="编辑商品" size="560px">
        <el-form label-width="88px" v-if="edit">
          <el-form-item label="商品图"><img :src="edit.img" style="width:120px;height:120px;object-fit:cover;border-radius:4px"></el-form-item>
          <el-form-item label="商品名称"><el-input v-model="form.name" /></el-form-item>
          <el-form-item label="品牌"><el-input v-model="form.brand" /></el-form-item>
          <el-form-item label="售价"><el-input-number v-model="form.price" :min="0" :step="100" /></el-form-item>
          <el-form-item label="库存"><el-input-number v-model="form.stock" :min="0" /></el-form-item>
          <el-form-item label="上架"><el-switch v-model="form.online" /></el-form-item>
        </el-form>
        <template #footer><el-button @click="edit=null">取消</el-button><el-button type="primary" @click="edit=null;$message.success('已保存（原型演示）')">保存</el-button></template>
      </el-drawer>
    </div>`
  };

  /* ---------- 主应用 ---------- */
  const app = createApp({
    components: { GenericList, Dashboard, Workbench, OrderList, CustomerList, ProductGrid, VideoManager:window.ADMIN_MEDIA.VideoManager, AcademyPage:window.ADMIN_ACADEMY.AcademyPage, MallPage:window.ADMIN_MALL.MallPage },
    setup() {
      const route = ref((location.hash || '#platform').slice(1));
      const openMap = reactive({ 官网管理: false, 订货单: true, 商城管理: false, 社区: false, 营销管理: false, 积分商城: false, 客户管理: true, AI分析: false, 营销短信: false, 公司管理: false, 直播管理: false, 商学院: false, 办会易: false, 小程序设置: false, 内容中心: false, 案例中心: false, 工单管理: false, 系统管理: false, 业绩奖励: false });
      const demo = ref(false);

      watch(route, (v) => {
        const ch = CHAPTER_OF[v];
        if (ch && MENU.find((c) => c.title === ch && c.items.length > 1)) openMap[ch] = true;
        location.hash = '#' + v;
        document.querySelector('.a-body') && (document.querySelector('.a-body').scrollTop = 0);
      });
      let navigationBusy=false;
      const go=async k=>{const aliases={post:'eprInformation',product:'eprProduct',site:'eprTopic',staff:'employeeInfo',role:'roleManage',unit:'unit/index'};k=aliases[k]||k;if(k===route.value)return true;if(!SCHEMA[k]&&k!=='myInfo'){ElementPlus.ElMessage.warning('该页面尚未配置');return false;}if(navigationBusy)return false;if(window.ACADEMY?.pendingUploads||window.MALL?.pendingUploads){ElMessage.warning('附件正在保存，请稍候');return false;}navigationBusy=true;try{const guard=window.SHARED.activeLeaveGuard,unchanged=guard?.checkpoint?.();if(guard?.dirty()){await ElementPlus.ElMessageBox.confirm('当前页面有未保存的修改，离开后这些修改不会保留。',guard.title||'未保存的修改',{type:'warning',confirmButtonText:'放弃修改并离开',cancelButtonText:'继续编辑',closeOnClickModal:false});if(unchanged&&!unchanged()){ElMessage.warning('确认期间内容已变化，请重新确认');return false;}}route.value=k;return true;}catch(e){return false;}finally{navigationBusy=false;}};
      window.addEventListener('hashchange',()=>{const target=(location.hash||'#platform').slice(1);if(target===route.value)return;history.replaceState(null,'','#'+route.value);go(target);});
      const toggle = (c) => { if (c.items.length > 1) openMap[c.title] = !openMap[c.title]; else route.value = c.items[0].key; };
      const curName = computed(() => TITLE[route.value] || '首页');
      const curChapter = computed(() => CHAPTER_OF[route.value] || '');
      const isMall=computed(()=>Object.prototype.hasOwnProperty.call(window.MALL.routes,route.value));
      const sourceShell=computed(()=>isMall.value||isAcademy.value);
      // 学院路由统一读取仓库登记，包含独立推荐位管理 bsRecommend。
      const isAcademy = computed(()=>Object.prototype.hasOwnProperty.call(window.ACADEMY.routes,route.value));

      /* 客户管理 / 商品管理改为按线上真实表头渲染（原卡片、精简表已不符合对照要求） */
      const special = { eprVideo:'VideoManager', platform: 'Dashboard', workbenchWeb: 'Workbench', project: 'OrderList' };
      const FEATURE = window.FEATURE_A || {};
      const spec = computed(() => SCHEMA[route.value] || { name: curName.value, cols: [], form: [] });
      const feature = computed(() => FEATURE[route.value] || null);
      const pageComp = computed(() => {
        if (special[route.value]) return special[route.value];
        if (FEATURE[route.value]) return 'FeaturePage';
        const sp = spec.value;
        if (sp.cols && sp.cols.length) return 'ListPage';
        if (sp.form && sp.form.length) return 'FormPage';
        return 'ListPage';
      });
      const confCache = {};
      const listConf = computed(() => {
        const k = route.value;
        if (!confCache[k]) confCache[k] = window.SHARED.buildConf(spec.value, k);
        return confCache[k];
      });

      const noticeOpen=ref(false);
      const readNotices=()=>{M.notices.forEach(n=>n.read=true);window.SHARED.store.set('notice:read',M.notices.map(n=>n.id));};
      const notifCount = computed(()=>M.notices.filter(n=>!n.read).length);
      return { MENU, academyMenu, mallMenu, route, openMap, demo, go, toggle, curName, curChapter, isAcademy, isMall, sourceShell, pageComp, listConf, spec, feature, notifCount, noticeOpen, readNotices, M };
    },
    template: `
    <div class="a-shell theme-a" :class="{'demo-on': demo,'academy-mode':sourceShell,'mall-mode':isMall}">
      <SideNav theme="a" :menu="isMall?mallMenu:isAcademy?academyMenu:MENU" :active="route" :width="176" @select="go">
        <template #brand>
          <div class="logo"><b v-if="isAcademy" class="ac-brand-logo">栖木家居<small>制造 · 零售 · 服务</small></b><img v-else :src="sourceShell?'../assets/academy/source-admin-logo.jpg':'../assets/img/logo.svg'" onerror="this.style.display='none'" alt=""></div>
          <div class="plat" title="切换平台"><span>微信小程序</span><i class="caret"></i></div>
        </template>
      </SideNav>

      <div class="a-main">
        <header class="a-header">
          <div class="crumb">
            <el-icon class="house"><Reading v-if="isAcademy"/><HomeFilled v-else/></el-icon>
            <b>{{ sourceShell?curName:(curChapter || curName) }}</b>
            <span class="sep" v-if="!sourceShell && curChapter && curChapter!==curName">/</span>
            <b v-if="!sourceShell && curChapter && curChapter!==curName">{{ curName }}</b>
          </div>
          <div class="spacer"></div>
          <a class="lnk" href="../site/index.html">返回官网</a>
          <a class="lnk board" href="../erp/index.html#statistics/board" target="_blank">数据看板<span class="new">NEW</span></a>
          <div class="bell" role="button" tabindex="0" aria-label="查看通知" @click="noticeOpen=true" @keydown.enter="noticeOpen=true"><el-badge :value="notifCount" :hidden="!notifCount" :max="99"><el-icon><Bell /></el-icon></el-badge></div>
          <div class="user" role="button" tabindex="0" @click="go('myInfo')" @keydown.enter="go('myInfo')"><span class="av">{{isAcademy?'唐':'张'}}</span>{{isAcademy?'唐宁':sourceShell?'专用':'张松涛'}}<el-icon><ArrowDown /></el-icon></div>
        </header>

        <div class="a-body">
          <AcademyPage v-if="isAcademy" :route-key="route" @go="go"/><MallPage v-else-if="isMall" :route-key="route" @go="go"/><VideoManager v-else-if="pageComp==='VideoManager'"/><FeaturePage v-else-if="pageComp==='FeaturePage'" :spec="feature" :key="route" :route-key="route" @go="go" />
          <component v-else-if="pageComp!=='ListPage' && pageComp!=='FormPage'" :is="pageComp" @go="go" @notices="noticeOpen=true" />
          <template v-else>
            <TipsBar v-if="spec.tips && spec.tips.length" :tips="spec.tips" />
            <ListPage v-if="pageComp==='ListPage'" :key="listConf.storeKey" :conf="listConf" dense @go="go" />
            <FormPage v-else :spec="spec" :key-name="route" :key="route" />
          </template>
        </div>
      </div>

      <el-drawer v-model="noticeOpen" title="通知中心" size="520px" append-to-body><el-button size="small" @click="readNotices">全部标为已读</el-button><div v-for="n in M.notices" :key="n.id" style="padding:16px 0;border-bottom:1px solid #ebeef5"><b>{{n.title}}</b><el-tag v-if="!n.read" size="small" style="margin-left:8px">未读</el-tag><p>{{n.content}}</p><small class="muted">{{n.time}}</small></div></el-drawer>
      <div class="demo-toggle" :class="{on: demo}" @click="demo=!demo">
        <span class="sw"></span><span>演示模式</span>
      </div>
    </div>`
  });

  Object.entries(ElementPlusIconsVue).forEach(([k, v]) => app.component(k, v));
  app.use(ElementPlus, { locale: window.ElementPlusLocaleZhCn });
  window.SHARED.register(app);
  app.mount('#app');
})();
