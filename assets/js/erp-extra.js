/* ============================================================
   系统 B · 隐藏业务子页面组件（补齐 F01）
   - StatPage      12 个统计报表页（KPI + 图表 + 明细表）
   - SortNav       顶部分类导航（排序/显示开关/新增，真实落库）
   - Decoration    店铺装修（组件库 + 手机预览 + 属性面板）
   - MessageCenter 我的消息（分类/已读/未读计数）
   - LearnGarden   学习园地（课程卡片 + 学习进度）
   - SceneLib      场景库（空间/风格筛选 + 搭配商品）
   - Profile       客户个人中心（资料/地址/账号安全）
   所有组件都通过 window.SHARED.store 做演示数据持久化。
   ============================================================ */
(function () {
  'use strict';
  const S = window.SHARED;
  const { ref, reactive, computed } = Vue;
  const { ElMessage } = ElementPlus;
  const IMG = (n) => '../assets/img/' + n + '.jpg';
  const money = (n) => '¥' + Number(n || 0).toLocaleString('zh-CN');

  /* ============================================================
     1. 统计报表页
     ============================================================ */
  const StatPage = {
    props: { rkey: { type: String, default: '' }, nav: { type: Function, default: () => {} } },
    setup(props) {
      const known=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
      const money=v=>typeof v==='number'&&Number.isFinite(v)?S.money(v):'未记录';
      const range = ref('本月');
      const ranges = props.rkey==='statistic/target'?['本月','上月']:['本月', '上月', '本季度', '本年'];
      const targets=ref(S.store.get('b:stat:target')||[]);
      const def=computed(()=>S.buildReport(props.rkey,range.value,targets.value));
      const rows=computed(()=>def.value.rows);
      const pickRange=v=>{range.value=v;};
      const updateTarget=(r,value)=>{
        const list=S.clone(targets.value),i=list.findIndex(x=>x['部门']===r['部门']&&x['月份']===r['月份']);
        const item=Object.assign({},r,{'目标金额':value});if(i<0)list.push(item);else list[i]=item;targets.value=list;
      };

      /* ---- 图表几何 ---- */
      const chart = computed(() => def.value.chart || null);
      const maxV = computed(() => {
        const vs = (chart.value && chart.value.values) || [];
        return Math.max.apply(null, vs.filter(known).concat([1])) * 1.15;
      });
      const linePts = computed(() => {
        const c = chart.value;
        if (!c || c.kind !== 'line') return '';
        return c.values.every(known)?dots.value.map((d) => d.x + ',' + d.y).join(' '):'';
      });
      const areaPts = computed(() => {
        if (!dots.value.length||!chart.value.values.every(known)) return '';
        return '52,224 ' + dots.value.map((d) => d.x + ',' + d.y).join(' ') + ' 742,224';
      });
      /* 折线上每个数据点（与折线同一套坐标，避免两处公式不一致） */
      const dots = computed(() => {
        const c = chart.value;
        if (!c || c.kind !== 'line') return [];
        const n = c.values.length;
        const W = 760, H = 260, PL = 52, PR = 18, PT = 20, PB = 36;
        const iw = W - PL - PR, ih = H - PT - PB;
        return c.values.map((v, i) => ({
          x: +(PL + (n === 1 ? iw / 2 : iw * i / (n - 1))).toFixed(1),
          y: +(PT + ih - ih * (v / maxV.value)).toFixed(1),
          v: v, index:i
        })).filter(d=>known(d.v));
      });
      const gridY = computed(() => {
        const H = 260, PT = 20, PB = 36;
        const ih = H - PT - PB;
        return [0, 1, 2, 3, 4].map((i) => {
          const y = PT + ih - ih * i / 4;
          return { y: y, v: (maxV.value * i / 4).toFixed(0) };
        });
      });
      const barPct = (v) => known(v)?Math.round((v / maxV.value) * 100):0;

      /* ---- 表格单元格 ---- */
      const cell = (c, v) => {
        if ((c.t==='money'||c.t==='pct')&&(typeof v!=='number'||!Number.isFinite(v)))return '未记录';
        if (v === null || v === undefined || v === '') return '—';
        if (c.t === 'money') return money(v);
        if (c.t === 'pct') return (Number(v) * 100).toFixed(1) + '%';
        return String(v);
      };
      const saveTarget = () => {
        S.store.set('b:stat:target', targets.value);
        ElMessage.success('业绩目标已保存，共 ' + rows.value.length + ' 个部门');
      };
      const exportRows = () => {
        const cs = def.value.cols || [];
        const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
        const out = [cs.map((c) => esc(c.l)).join(',')];
        rows.value.forEach((r) => out.push(cs.map((c) => esc(r[c.l])).join(',')));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['\ufeff' + out.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
        a.download = def.value.name + '_' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        ElMessage.success('已导出 ' + rows.value.length + ' 条到 CSV 文件');
      };
      return { def, range, ranges, pickRange, rows, chart, linePts, areaPts, dots, gridY, barPct, maxV, cell, saveTarget, exportRows, money, updateTarget };
    },
    template: `
    <div class="st">
      <div class="st-hd" data-demo="报表标题与统计周期">
        <div><h2>{{ def.name }}</h2><p class="muted">{{ def.desc }}</p></div>
        <div class="st-hd-r">
          <el-radio-group :model-value="range" size="small" @update:model-value="pickRange">
            <el-radio-button v-for="r in ranges" :key="r" :value="r" :label="r">{{ r }}</el-radio-button>
          </el-radio-group>
          <el-button size="small" plain @click="exportRows">导出</el-button>
        </div>
      </div>

      <div class="st-kpi" data-demo="核心指标（切换周期重算）">
        <div class="st-k" v-for="(k,i) in def.kpi" :key="i">
          <div class="l">{{ k[0] }}</div>
          <div class="v">{{ k[1] }}</div>
          <div class="d" :class="k[3]?'up':'down'" v-if="k[2]">{{ k[3] ? '▲' : '▼' }} {{ k[2] }}</div>
        </div>
      </div>

      <div class="st-card" data-demo="趋势图（折线 / 竖柱 / 横条）">
        <div class="st-card-hd">{{ chart ? chart.title : '' }}<span class="muted">{{ range }}</span></div>

        <!-- 折线 -->
        <svg v-if="chart && chart.kind==='line'" viewBox="0 0 760 260" class="st-svg">
          <g v-for="(g,i) in gridY" :key="i">
            <line :x1="52" :x2="742" :y1="g.y" :y2="g.y" stroke="#eef1f6" stroke-width="1" />
            <text :x="44" :y="g.y+4" text-anchor="end" font-size="10" fill="#a6adba">{{ g.v }}</text>
          </g>
          <polygon :points="areaPts" fill="#5b8def" opacity="0.07" />
          <polyline :points="linePts" fill="none" stroke="#5b8def" stroke-width="2.4" stroke-linejoin="round" />
          <g v-for="(d,i) in dots" :key="'p'+i">
            <circle :cx="d.x" :cy="d.y" r="3.4" fill="#fff" stroke="#5b8def" stroke-width="2" />
            <text :x="d.x" y="246" text-anchor="middle" font-size="10" fill="#a6adba">{{ chart.labels[d.index] }}</text>
          </g>
        </svg>

        <!-- 竖向柱 -->
        <div v-else-if="chart && chart.kind==='bar'" class="st-bars">
          <div class="st-bar" v-for="(v,i) in chart.values" :key="i">
            <div class="bw"><div class="b" :style="{height:barPct(v)+'%'}"><span>{{ v===null?'未记录':v }}</span></div></div>
            <div class="bl">{{ chart.labels[i] }}</div>
          </div>
        </div>

        <!-- 横向条 -->
        <div v-else-if="chart && chart.kind==='hbar'" class="st-hbars">
          <div class="st-hb" v-for="(v,i) in chart.values" :key="i">
            <div class="hl">{{ chart.labels[i] }}</div>
            <div class="ht"><div class="hf" :style="{width:barPct(v)+'%'}"></div></div>
            <div class="hv">{{ v===null?'未记录':v }}</div>
          </div>
        </div>
      </div>

      <div class="st-card" data-demo="明细数据（可导出）">
        <div class="st-card-hd">明细数据<span class="muted">共 {{ rows.length }} 条</span>
          <el-button v-if="def.editable" size="small" type="primary" style="margin-left:auto" @click="saveTarget">保存目标</el-button>
        </div>
        <el-table :data="rows" size="small" border max-height="420">
          <el-table-column v-for="(c,i) in def.cols" :key="i" :label="c.l" :align="(c.t==='num'||c.t==='money'||c.t==='pct')?'right':'left'" min-width="110">
            <template #default="s">
              <el-input-number v-if="c.edit" :model-value="s.row[c.l]" @update:model-value="v=>updateTarget(s.row,v)" :controls="false" size="small" :min="0" :step="10000" style="width:130px" />
              <span v-else-if="c.t==='money'" class="dt-num">{{ cell(c, s.row[c.l]) }}</span>
              <span v-else-if="c.t==='pct'" class="dt-num">{{ cell(c, s.row[c.l]) }}</span>
              <span v-else>{{ cell(c, s.row[c.l]) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>`
  };

  /* ============================================================
     2. 顶部分类导航（排序）
     ============================================================ */
  const SORT_SEED = [
    { id: 's1', name: '沙发', icon: 'sofa', goods: 86, show: true },
    { id: 's2', name: '休闲椅', icon: 'chair', goods: 24, show: true },
    { id: 's3', name: '餐椅', icon: 'dining-chair', goods: 18, show: true },
    { id: 's4', name: '餐桌', icon: 'table', goods: 16, show: true },
    { id: 's5', name: '茶几电视柜', icon: 'coffee', goods: 22, show: true },
    { id: 's6', name: '床头柜', icon: 'bedside', goods: 12, show: false },
    { id: 's7', name: '产品中心', icon: 'grid', goods: 0, show: true },
    { id: 's8', name: '案例中心', icon: 'case', goods: 0, show: true }
  ];

  const SortNav = {
    props: { nav: { type: Function, default: () => {} } },
    setup() {
      const KEY = 'b:sort:goods';
      const list = ref((S.store.get(KEY) || SORT_SEED).map((x) => Object.assign({}, x)));
      const dlg = reactive({ open: false, name: '', icon: 'custom' });
      const persist = () => S.store.set(KEY, list.value);
      const move = (i, d) => {
        const j = i + d;
        if (j < 0 || j >= list.value.length) return;
        const tmp = list.value[i];
        list.value.splice(i, 1);
        list.value.splice(j, 0, tmp);
        persist();
        ElMessage.success('已' + (d < 0 ? '上移' : '下移') + '到第 ' + (j + 1) + ' 位');
      };
      const toggle = (row, v) => { row.show = v; persist(); ElMessage.success('「' + row.name + '」已' + (v ? '显示' : '隐藏')); };
      const del = (row) => {
        const i = list.value.indexOf(row);
        list.value.splice(i, 1); persist(); ElMessage.success('已删除「' + row.name + '」');
      };
      const add = () => {
        if (!dlg.name.trim()) return ElMessage.warning('请填写分类名称');
        list.value.push({ id: 's' + Date.now(), name: dlg.name, icon: dlg.icon || 'custom', goods: 0, show: true });
        persist(); dlg.open = false; dlg.name = '';
        ElMessage.success('已新增分类「' + list.value[list.value.length - 1].name + '」');
      };
      return { list, dlg, move, toggle, del, add };
    },
    template: `
    <div class="st">
      <div class="st-hd">
        <div><h2>顶部分类导航</h2><p class="muted">小程序首页顶部导航顺序，拖动或上下移动即时生效</p></div>
        <el-button size="small" type="primary" @click="dlg.open=true">新增分类</el-button>
      </div>
      <div class="st-card" data-demo="分类排序（显示开关即时生效）">
        <div class="sn-hd"><span>排序</span><span>分类名称</span><span>图标标识</span><span>关联商品</span><span>是否显示</span><span>操作</span></div>
        <div class="sn-row" v-for="(row,i) in list" :key="row.id">
          <span class="sn-idx">{{ i+1 }}</span>
          <span class="sn-nm"><i class="sn-handle">⋮⋮</i>{{ row.name }}</span>
          <span class="muted">{{ row.icon }}</span>
          <span>{{ row.goods }} 个</span>
          <el-switch :model-value="row.show" size="small" @update:model-value="v=>toggle(row,v)" />
          <span class="sn-ops">
            <span class="link" @click="move(i,-1)">上移</span>
            <span class="link" @click="move(i,1)">下移</span>
            <span class="link danger" @click="del(row)">删除</span>
          </span>
        </div>
      </div>
      <el-dialog v-model="dlg.open" title="新增分类" width="420px">
        <el-form label-width="88px">
          <el-form-item label="分类名称"><el-input v-model="dlg.name" placeholder="如：户外家具" /></el-form-item>
          <el-form-item label="图标标识"><el-input v-model="dlg.icon" placeholder="英文标识，如 outdoor" /></el-form-item>
        </el-form>
        <template #footer><el-button @click="dlg.open=false">取消</el-button><el-button type="primary" @click="add">确定</el-button></template>
      </el-dialog>
    </div>`
  };

  /* ============================================================
     3. 店铺装修
     ============================================================ */
  const BLOCK_LIB = [
    { type: 'banner', name: '轮播图', icon: 'Picture' },
    { type: 'notice', name: '公告栏', icon: 'Bell' },
    { type: 'nav', name: '图文导航', icon: 'Grid' },
    { type: 'goods', name: '商品分组', icon: 'Goods' },
    { type: 'coupon', name: '优惠券', icon: 'Ticket' },
    { type: 'video', name: '视频', icon: 'VideoCamera' },
    { type: 'richtext', name: '富文本', icon: 'Document' }
  ];
  const DECO_SEED = [
    { id: 'b1', type: 'banner', title: '首页主轮播', show: true },
    { id: 'b2', type: 'notice', title: '公告：10 月订货满 10 万赠安装服务', show: true },
    { id: 'b3', type: 'nav', title: '金刚区导航', show: true },
    { id: 'b4', type: 'goods', title: '热销沙发', show: true },
    { id: 'b5', type: 'coupon', title: '新人礼券包', show: true }
  ];

  const Decoration = {
    props: { nav: { type: Function, default: () => {} } },
    setup() {
      let KEY = 'b:deco:home';
      const blocks = ref((S.store.get(KEY) || DECO_SEED).map((x) => Object.assign({}, x)));
      const sel = ref(blocks.value[0] ? blocks.value[0].id : '');
      const page = ref('首页');
      const cur = computed(() => blocks.value.find((b) => b.id === sel.value) || null);
      const persist = () => S.store.set(KEY, blocks.value);
      const addBlock = (lib) => {
        const b = { id: 'b' + Date.now(), type: lib.type, title: lib.name, show: true };
        blocks.value.push(b); sel.value = b.id; persist();
        ElMessage.success('已添加「' + lib.name + '」组件，可在右侧编辑属性');
      };
      const move = (i, d) => {
        const j = i + d;
        if (j < 0 || j >= blocks.value.length) return;
        const t = blocks.value[i];
        blocks.value.splice(i, 1); blocks.value.splice(j, 0, t);
        persist(); ElMessage.success('组件顺序已调整');
      };
      const del = (b) => {
        const i = blocks.value.indexOf(b);
        blocks.value.splice(i, 1); persist();
        if (sel.value === b.id) sel.value = blocks.value[0] ? blocks.value[0].id : '';
        ElMessage.success('已删除组件');
      };
      const save = () => { persist(); ElMessage.success('当前页面装修已保存到本地预览'); };
      const pickPage = p => {persist();page.value=p;KEY='b:deco:'+({'首页':'home','分类页':'category','我的':'profile'}[p]);blocks.value=S.clone(S.store.get(KEY)||[]);sel.value=blocks.value[0]?.id||'';};
      const typeName = (t) => { const hit = BLOCK_LIB.find((l) => l.type === t); return hit ? hit.name : t; };
      return { blocks, sel, cur, page, addBlock, move, del, save, pickPage, typeName, BLOCK_LIB, IMG };
    },
    template: `
    <div class="st">
      <div class="st-hd">
        <div><h2>店铺装修</h2><p class="muted">小程序店铺页面组件化配置，左侧组件库 · 中间实时预览 · 右侧属性</p></div>
        <div class="st-hd-r">
          <el-radio-group :model-value="page" size="small" @update:model-value="pickPage">
            <el-radio-button value="首页" label="首页" /><el-radio-button value="分类页" label="分类页" /><el-radio-button value="我的" label="我的" />
          </el-radio-group>
          <el-button size="small" type="primary" @click="save">保存并发布</el-button>
        </div>
      </div>

      <div class="dc" data-demo="装修工作区：组件库 / 手机预览 / 属性面板">
        <div class="dc-lib">
          <div class="dc-lib-hd">组件库</div>
          <div class="dc-lib-i" v-for="l in BLOCK_LIB" :key="l.type" @click="addBlock(l)">
            <el-icon><component :is="l.icon" /></el-icon><span>{{ l.name }}</span><i>+</i>
          </div>
        </div>

        <div class="dc-phone">
          <div class="dc-pv-top">掌工厂 · {{ page }}</div>
          <div class="dc-pv">
            <div class="dc-blk" v-for="(b,i) in blocks" :key="b.id" :class="{on: sel===b.id}" @click="sel=b.id" v-show="b.show">
              <div class="dc-blk-tools">
                <span @click.stop="move(i,-1)">↑</span><span @click.stop="move(i,1)">↓</span><span @click.stop="del(b)">×</span>
              </div>
              <div v-if="b.type==='banner'" class="dc-banner"><span>轮播图 1 / 3</span></div>
              <div v-else-if="b.type==='notice'" class="dc-notice"><el-icon><Bell /></el-icon>{{ b.title }}</div>
              <div v-else-if="b.type==='nav'" class="dc-nav">
                <div v-for="t in ['沙发','餐桌','餐椅','茶几']" :key="t"><i></i><span>{{ t }}</span></div>
              </div>
              <div v-else-if="b.type==='goods'" class="dc-goods">
                <div class="t">{{ b.title }}</div>
                <div class="g"><el-image :src="IMG('sofa-1')" fit="cover" /><em>轻奢科技布沙发</em><b>¥24,000</b></div>
                <div class="g"><el-image :src="IMG('dining-1')" fit="cover" /><em>大理石餐桌 CY001</em><b>¥16,400</b></div>
              </div>
              <div v-else-if="b.type==='coupon'" class="dc-coupon"><div><b>¥1000</b><span>满 10000 可用</span></div><i>领取</i></div>
              <div v-else-if="b.type==='video'" class="dc-video"><el-icon><VideoPlay /></el-icon></div>
              <div v-else class="dc-text">{{ b.title }}</div>
            </div>
            <div class="dc-empty" v-if="!blocks.length">从左侧选择组件添加到页面</div>
          </div>
        </div>

        <div class="dc-prop">
          <div class="dc-lib-hd">组件属性</div>
          <div v-if="cur">
            <div class="dc-f"><label>组件类型</label><el-input :model-value="typeName(cur.type)" size="small" disabled /></div>
            <div class="dc-f"><label>标题 / 文案</label><el-input v-model="cur.title" size="small" @change="save" /></div>
            <div class="dc-f"><label>是否显示</label><el-switch v-model="cur.show" size="small" @change="save" /></div>
            <div class="dc-f"><label>上边距</label><el-input-number v-model="cur.marginTop" :min="0" :max="120" :controls="false" size="small" style="width:100%" @change="save" /></div>
            <div class="dc-f"><label>背景色</label><el-color-picker v-model="cur.background" @change="save" /></div>
            <p class="muted" style="font-size:12px;line-height:1.7;margin-top:12px">属性修改即时反映到中间预览，点「保存并发布」写入演示数据。</p>
          </div>
          <div v-else class="muted" style="padding:16px;font-size:13px">请选择页面中的组件</div>
        </div>
      </div>
    </div>`
  };

  /* ============================================================
     4. 我的消息
     ============================================================ */
  const MSG_SEED = [
    { id: 'm1', cat: '订单消息', title: '订货单 SO261018100 已下单成功', body: '客户深圳市恒美家居有限公司提交订货单，金额 ¥96,000，请安排排产。', at: '2026-10-18 09:24', read: false },
    { id: 'm2', cat: '待办提醒', title: '交接班任务待处理：交货单 JH261017088', body: '交货单待确认出库，已停留 2 天，请及时处理。', at: '2026-10-18 08:40', read: false },
    { id: 'm3', cat: '系统通知', title: '系统将于 10 月 20 日 02:00 升级', body: '升级期间订货单提交将暂停约 15 分钟，请提前通知客户。', at: '2026-10-17 18:02', read: false },
    { id: 'm4', cat: '公告', title: '10 月订货政策：满 10 万赠安装服务', body: '活动时间 10-01 至 10-31，按订货单开单金额累计。', at: '2026-10-16 10:15', read: true },
    { id: 'm5', cat: '订单消息', title: '订货单 SO261017061 状态变更为「待排产」', body: '东莞名匠家居的订单已完成制图审核，进入排产队列。', at: '2026-10-17 15:36', read: true },
    { id: 'm6', cat: '待办提醒', title: '采购单 CG2609021 交期临近', body: '供应商回复 10-16 可提货，请确认到货安排。', at: '2026-10-16 09:12', read: false },
    { id: 'm7', cat: '系统通知', title: '你的账号已在新设备登录', body: '登录地点：深圳市南山区，如非本人操作请及时修改密码。', at: '2026-10-15 21:40', read: true },
    { id: 'm8', cat: '公告', title: '新版产品图册已上传至学习园地', body: '2026 秋季新品图册与卖点话术已更新，可在学习园地查看。', at: '2026-10-14 11:08', read: true }
  ];

  const MessageCenter = {
    setup() {
      const KEY = 'b:msg';
      const list = ref((S.store.get(KEY) || MSG_SEED).map((x) => Object.assign({}, x)));
      const cat = ref('全部');
      const cats = ['全部', '订单消息', '待办提醒', '系统通知', '公告'];
      const persist = () => S.store.set(KEY, list.value);
      const unread = computed(() => list.value.filter((m) => !m.read).length);
      const filtered = computed(() => (cat.value === '全部' ? list.value : list.value.filter((m) => m.cat === cat.value)));
      const countOf = (c) => (c === '全部' ? list.value.length : list.value.filter((m) => m.cat === c).length);
      const readOne = (m) => {
        if (m.read) return;
        m.read = true; persist(); ElMessage.success('已标记为已读');
      };
      const readAll = () => {
        list.value.forEach((m) => { m.read = true; });
        persist(); ElMessage.success('已全部标记为已读');
      };
      const del = (m) => {
        const i = list.value.indexOf(m);
        list.value.splice(i, 1); persist(); ElMessage.success('消息已删除');
      };
      return { list, cat, cats, filtered, unread, countOf, readOne, readAll, del };
    },
    template: `
    <div class="st">
      <div class="st-hd">
        <div><h2>我的消息</h2><p class="muted">订单与待办通知集中在此，未读 {{ unread }} 条</p></div>
        <el-button size="small" plain :disabled="!unread" @click="readAll">全部标记已读</el-button>
      </div>
      <div class="mg-tabs" data-demo="消息分类（计数实时统计）">
        <span v-for="c in cats" :key="c" class="mg-tab" :class="{on:cat===c}" @click="cat=c">
          {{ c }}<i>{{ countOf(c) }}</i>
        </span>
      </div>
      <div class="st-card" data-demo="消息列表（未读红点 / 全部已读 / 删除）">
        <div class="mg-row" v-for="m in filtered" :key="m.id" :class="{unread:!m.read}" @click="readOne(m)">
          <span class="mg-dot" :class="{off: m.read}"></span>
          <span class="mg-cat">{{ m.cat }}</span>
          <div class="mg-main">
            <div class="t">{{ m.title }}</div>
            <div class="b">{{ m.body }}</div>
          </div>
          <span class="mg-at">{{ m.at }}</span>
          <span class="mg-op" @click.stop="del(m)">删除</span>
        </div>
        <div class="dc-empty" v-if="!filtered.length">该分类下暂无消息</div>
      </div>
    </div>`
  };

  /* ============================================================
     5. 学习园地
     ============================================================ */
  const COURSES = [
    { id: 'c1', cat: '产品知识', t: '科技布面料三种工艺区别与卖点提炼', by: '产品部 · 陈志远', dur: '18 分钟', done: 100, img: 'sofa-2' },
    { id: 'c2', cat: '产品知识', t: '岩板餐桌的耐刮测试与话术', by: '产品部 · 陈志远', dur: '12 分钟', done: 100, img: 'dining-1' },
    { id: 'c3', cat: '销售技巧', t: '客厅套系连带销售的 5 个提问', by: '销售一部 · 张松涛', dur: '26 分钟', done: 60, img: 'scene-1' },
    { id: 'c4', cat: '销售技巧', t: '客户说「再看看」时的三种回应', by: '销售一部 · 曾燕然', dur: '15 分钟', done: 30, img: 'scene-3' },
    { id: 'c5', cat: '系统操作', t: '订货单从报价到下单全流程实操', by: '实施部 · 李静', dur: '32 分钟', done: 0, img: 'coffee-1' },
    { id: 'c6', cat: '系统操作', t: '改单申请与退款流程注意事项', by: '实施部 · 王海涛', dur: '21 分钟', done: 0, img: 'bed-1' },
    { id: 'c7', cat: '新人入职', t: '新销售第一周必做的 7 件事', by: '培训中心 · 周慧', dur: '24 分钟', done: 0, img: 'chair-1' },
    { id: 'c8', cat: '新人入职', t: '产品线导览：从沙发到定制柜', by: '培训中心 · 周慧', dur: '38 分钟', done: 0, img: 'scene-5' }
  ];

  const LearnGarden = {
    setup() {
      const cat = ref('全部课程');
      const cats = ['全部课程', '产品知识', '销售技巧', '系统操作', '新人入职'];
      const courses=ref(COURSES.map(c=>Object.assign({},c,{done:(S.store.get('b:learning:progress')||{})[c.id]??c.done})));
      const list = computed(() => (cat.value === '全部课程' ? courses.value : courses.value.filter((c) => c.cat === cat.value)));
      const doneHours = computed(() => (courses.value.reduce((n,c)=>n+parseInt(c.dur)*c.done/100,0)/60).toFixed(1));
      const current=ref(null),chapter=ref(0),reader=ref(false);
      const sections=computed(()=>current.value?[{title:'学习目标',text:'理解《'+current.value.t+'》的关键步骤，结合本地演示资料完成练习。'},{title:'操作要点',text:current.value.cat==='系统操作'?'先检查客户、商品规格、数量与交期，再核对金额和费用。保存草稿后刷新确认，提交后查看列表与详情一致性。':current.value.cat==='销售技巧'?'确认使用场景、空间尺寸和预算；说明配置与交期，记录客户待确认的问题，避免把待核实信息当作承诺。':'核对产品规格、面料和工艺说明；用样品与可确认的资料说明差异，记录未知项并安排复核。'},{title:'课后练习',text:'在本地演示中完成一项相关操作，检查字段、保存结果和刷新回读。完成后可标记本课程已学完。'}]:[]);
      const go=c=>{current.value=c;chapter.value=Math.min(2,Math.floor(c.done/34));reader.value=true;};
      const progress=value=>{current.value.done=Math.max(current.value.done,value);S.store.set('b:learning:progress',Object.fromEntries(courses.value.map(c=>[c.id,c.done])));};
      const next=()=>{progress(chapter.value===2?100:(chapter.value+1)*33);if(chapter.value<2)chapter.value++;else{reader.value=false;ElMessage.success('课程学习已完成');}};
      return { cat, cats, list, COURSES:courses, doneHours, go, IMG, current, chapter, reader, sections, next };
    },
    template: `
    <div class="st">
      <div class="st-hd">
        <div><h2>学习园地</h2><p class="muted">产品知识、销售话术与系统操作课程，已完成 {{ doneHours }} 小时</p></div>
      </div>
      <div class="mg-tabs">
        <span v-for="c in cats" :key="c" class="mg-tab" :class="{on:cat===c}" @click="cat=c">{{ c }}</span>
      </div>
      <div class="lg-grid" data-demo="课程卡片（学习进度）">
        <div class="lg-card" v-for="c in list" :key="c.id">
          <div class="lg-cover"><el-image :src="IMG(c.img)" fit="cover" /><span class="lg-dur">{{ c.dur }}</span></div>
          <div class="lg-body">
            <div class="lg-t">{{ c.t }}</div>
            <div class="lg-by">{{ c.by }}</div>
            <div class="lg-prog"><span><i :style="{width:c.done+'%'}"></i></span><em>{{ c.done }}%</em></div>
            <el-button size="small" :type="c.done===100?'':'primary'" plain @click="go(c)">{{ c.done===100?'复习':'继续学习' }}</el-button>
          </div>
        </div>
      </div>
      <el-dialog v-model="reader" :title="current?.t||'课程学习'" width="760px"><div v-if="current"><el-tag>{{current.cat}}</el-tag><p class="muted">本地演示图文课程 · {{current.by}} · {{current.dur}}</p><el-steps :active="chapter" finish-status="success"><el-step v-for="x in sections" :key="x.title" :title="x.title"/></el-steps><div style="padding:24px 4px;line-height:1.9"><h3>{{sections[chapter].title}}</h3><p>{{sections[chapter].text}}</p></div><el-progress :percentage="current.done"/></div><template #footer><el-button @click="reader=false">保存进度并关闭</el-button><el-button type="primary" @click="next">{{chapter===2?'标记完成':'下一节'}}</el-button></template></el-dialog>
    </div>`
  };

  /* ============================================================
     6. 场景库
     ============================================================ */
  const SCENES = [
    { id: 'a1', name: '现代简约客厅', space: '客厅', style: '现代简约', img: 'scene-4', goods: 6, items: [['轻奢科技布沙发三人位', 24000, 'sofa-1'], ['岩板茶几组合', 3800, 'coffee-1']] },
    { id: 'a2', name: '轻奢餐厨一体', space: '餐厅', style: '轻奢', img: 'scene-2', goods: 5, items: [['大理石餐桌 CY001', 16400, 'dining-1'], ['餐椅 CY002 布艺', 12000, 'dining-3']] },
    { id: 'a3', name: '奶油风主卧', space: '卧室', style: '奶油风', img: 'bed-2', goods: 4, items: [['北欧实木双人床', 30000, 'bed-1'], ['软包床头柜', 980, 'bed-1']] },
    { id: 'a4', name: '原木书房', space: '书房', style: '原木', img: 'chair-2', goods: 3, items: [['DV-237 雪松椅', 12000, 'chair-1'], ['胡桃木电视柜', 3100, 'coffee-1']] },
    { id: 'a5', name: '会客洽谈区', space: '客厅', style: '轻奢', img: 'scene-5', goods: 4, items: [['黑金刚真皮沙发', 45600, 'sofa-3'], ['气泡凳', 280, 'chair-1']] },
    { id: 'a6', name: '小户型客厅', space: '客厅', style: '现代简约', img: 'scene-1', goods: 5, items: [['云朵沙发 · 奶油白', 12800, 'sofa-2'], ['岩板茶几组合', 3800, 'coffee-1']] }
  ];

  const sceneDefs=[['欧式会客厅','客厅','复古',[0,5]],['现代客厅与开放厨房','客厅','现代',[3,9]],['暖色酒店主卧','卧室','轻奢',[15]],['原木小餐厅','餐厅','原木',[7,13]],['黛绿卧室','卧室','现代',[16,5]],['小户型餐厅','餐厅','简约',[9,7]]];
  SCENES.forEach((s,i)=>{const [name,space,style,ids]=sceneDefs[i];Object.assign(s,{name,space,style,items:ids.map(j=>{const p=window.MOCK.products[j];return [p.name,p.price,(typeof p.img==='string'?p.img.split('/').pop().replace('.jpg',''):''),p.id];}),goods:ids.length});});
  const SceneLib = {
    setup() {
      const scenePrice=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?S.money(v):'未记录';
      const space = ref('全部空间');
      const style = ref('全部风格');
      const spaces = ['全部空间', '客厅', '餐厅', '卧室', '书房'];
      const styles = ['全部风格','现代','简约','轻奢','复古','原木'];
      const list = computed(() => SCENES.filter((s) => (space.value === '全部空间' || s.space === space.value) && (style.value === '全部风格' || s.style === style.value)));
      const dlg = reactive({ open: false, row: null });
      const open = (s) => { dlg.row = s; dlg.open = true; };
      const useScene=s=>{
        const draft=S.store.get('c:draft')||{items:[]};
        s.items.forEach(g=>{const p=window.MOCK.products.find(p=>p.id===g[3]);if(!p)return;const old=draft.items.find(l=>l.id===p.id);if(old)old.qty=Number(old.qty)+1;else draft.items.push({id:p.id,qty:1,price:p.price});});
        S.store.set('c:draft',draft);ElMessage.success('已把 '+s.items.length+' 件商品加入官网订货草稿');
      };
      return { space, style, spaces, styles, list, dlg, open, useScene, IMG, scenePrice };
    },
    template: `
    <div class="st">
      <div class="st-hd">
        <div><h2>场景库</h2><p class="muted">按空间与风格组织的搭配方案，可直接带商品进订货单</p></div>
        <div class="st-hd-r">
          <el-select v-model="space" size="small" style="width:130px"><el-option v-for="s in spaces" :key="s" :label="s" :value="s" /></el-select>
          <el-select v-model="style" size="small" style="width:130px"><el-option v-for="s in styles" :key="s" :label="s" :value="s" /></el-select>
        </div>
      </div>
      <div class="scn-grid" data-demo="场景卡片（可整套加入订货单）">
        <div class="scn-card" v-for="s in list" :key="s.id" @click="open(s)">
          <div class="scn-img"><el-image :src="IMG(s.img)" fit="cover" /><span class="scn-tag">{{ s.space }} · {{ s.style }}</span></div>
          <div class="scn-body"><div class="t">{{ s.name }}</div><div class="s">搭配 {{ s.goods }} 件商品</div></div>
        </div>
        <div class="dc-empty" v-if="!list.length">该筛选条件下暂无场景</div>
      </div>

      <el-dialog v-model="dlg.open" :title="dlg.row ? dlg.row.name : ''" width="720px">
        <div v-if="dlg.row" style="display:flex;gap:16px">
          <el-image :src="IMG(dlg.row.img)" fit="cover" style="width:320px;height:240px;border-radius:8px" />
          <div style="flex:1">
            <p class="muted" style="margin:0 0 10px">空间：{{ dlg.row.space }} · 风格：{{ dlg.row.style }} · 共 {{ dlg.row.goods }} 件</p>
            <div class="scn-g" v-for="(g,i) in dlg.row.items" :key="i">
              <el-image v-if="g[2]" :src="IMG(g[2])" fit="cover" class="scn-gimg" /><span v-else class="scn-gimg muted">暂无图片</span>
              <span class="n">{{ g[0] }}</span><span class="p">{{ scenePrice(g[1]) }}</span>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="dlg.open=false">关闭</el-button>
          <el-button type="primary" @click="useScene(dlg.row);dlg.open=false">整套加入订货单</el-button>
        </template>
      </el-dialog>
    </div>`
  };

  /* ============================================================
     7. 客户个人中心
     ============================================================ */
  const Profile = {
    setup() {
      const KEY = 'b:profile';
      const p = reactive(Object.assign({
        name: '张松涛', phone: '13510228877', email: 'zhangsongtao@91zhanghu.com',
        company: '深圳市恒美家居有限公司', title: '采购负责人', area: '广东省深圳市南山区'
      }, S.store.get(KEY) || {}));
      const tab = ref('基本信息');
      const tabs = ['基本信息', '收货地址', '账号安全'];
      const addr = ref(S.store.get('b:addresses')||[
        { id: 'ad1', name: '张甜', phone: '13510228877', area: '广东省深圳市南山区', detail: '粤海街道科技南十二路 18 号讯美科技广场 3 栋 12 层', def: true },
        { id: 'ad2', name: '张甜', phone: '13510228877', area: '广东省深圳市福田区', detail: '华强北路 1 号仓库 B 区 2 号门', def: false }
      ]);
      const dlg = reactive({ open: false, name: '', phone: '', area: '', detail: '' });
      const save = () => {
        if(!p.name.trim()||!/^1[3-9]\d{9}$/.test(p.phone))return ElMessage.warning('请填写姓名和有效手机号');
        if(p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))return ElMessage.warning('请输入有效邮箱');
        S.store.set(KEY, JSON.parse(JSON.stringify(p)));
        ElMessage.success('基本信息已保存');
      };
      const addAddr = () => {
        if(!dlg.name.trim()||!/^1[3-9]\d{9}$/.test(dlg.phone)||!dlg.area.trim()||!dlg.detail.trim())return ElMessage.warning('请填写收货人、有效手机号、地区和详细地址');
        addr.value.push({ id: 'ad' + Date.now(), name: dlg.name, phone: dlg.phone, area: dlg.area, detail: dlg.detail, def: false });
        if(addr.value.length===1)addr.value[0].def=true;S.store.set('b:addresses',addr.value);
        dlg.open = false;Object.assign(dlg,{name:'',phone:'',area:'',detail:''});ElMessage.success('收货地址已新增');
      };
      const setDef = (a) => { addr.value.forEach((x) => { x.def = x.id === a.id; });S.store.set('b:addresses',addr.value);ElMessage.success('已设为默认地址'); };
      const delAddr = (a) => {
        const i = addr.value.indexOf(a); addr.value.splice(i, 1);if(addr.value.length&&!addr.value.some(x=>x.def))addr.value[0].def=true;S.store.set('b:addresses',addr.value);ElMessage.success('地址已删除');
      };
      const pwd = reactive({ old: '', next: '', again: '' });
      const pwdBusy=ref(false);
      const savePwd = async () => {
        if (!pwd.old || !pwd.next) return ElMessage.warning('请填写原密码与新密码');
        if (pwd.next !== pwd.again) return ElMessage.warning('两次输入的新密码不一致');
        pwdBusy.value=true;
        try{await S.demoAuth.change(pwd.old,pwd.next);pwd.old=pwd.next=pwd.again='';ElMessage.success('本地演示密码已修改，官网演示登录将使用新密码');}catch(e){ElMessage.warning(e.message);}finally{pwdBusy.value=false;}
      };
      const devices=ref(S.store.get('b:devices')||[
        { d:'当前浏览器 · 本地演示',ip:'127.0.0.1',at:S.now(),now:true },
        { d:'演示设备 · iPhone',ip:'192.0.2.10',at:'2026-10-17 21:36',now:false }
      ]);
      const offline=d=>{devices.value=devices.value.filter(x=>x!==d);S.store.set('b:devices',devices.value);ElMessage.success('演示设备已移除');};
      return { p, tab, tabs, addr, dlg, save, addAddr, setDef, delAddr, pwd, savePwd, pwdBusy, devices, offline };
    },
    template: `
    <div class="st">
      <div class="st-hd"><div><h2>客户个人中心</h2><p class="muted">维护客户资料、收货地址与账号安全</p></div></div>
      <div class="pf" data-demo="个人中心：资料 / 地址 / 账号安全">
        <div class="pf-side" data-demo="客户信息卡">
          <div class="pf-av">张</div>
          <div class="pf-nm">{{ p.name }}</div>
          <div class="pf-co">{{ p.company }}</div>
          <div class="pf-lv">A 类客户</div>
          <div class="pf-nums">
            <div><b>3,280</b><span>积分</span></div>
            <div><b>2</b><span>优惠券</span></div>
            <div><b>12</b><span>订单</span></div>
          </div>
        </div>
        <div class="pf-main">
          <div class="mg-tabs" style="margin-top:0">
            <span v-for="t in tabs" :key="t" class="mg-tab" :class="{on:tab===t}" @click="tab=t">{{ t }}</span>
          </div>

          <div v-if="tab==='基本信息'" class="pf-form">
            <div class="f"><label>客户名称</label><el-input v-model="p.name" size="small" /></div>
            <div class="f"><label>手机号</label><el-input v-model="p.phone" size="small" /></div>
            <div class="f"><label>邮箱</label><el-input v-model="p.email" size="small" /></div>
            <div class="f"><label>公司</label><el-input v-model="p.company" size="small" /></div>
            <div class="f"><label>职位</label><el-input v-model="p.title" size="small" /></div>
            <div class="f"><label>所在地区</label><el-input v-model="p.area" size="small" /></div>
            <div class="pf-ft"><el-button type="primary" size="small" @click="save">保存修改</el-button></div>
          </div>

          <div v-else-if="tab==='收货地址'">
            <div class="pf-addr" v-for="a in addr" :key="a.id">
              <div class="hd"><b>{{ a.name }}</b><span class="muted">{{ a.phone }}</span><el-tag v-if="a.def" size="small" type="primary" effect="light">默认</el-tag></div>
              <div class="bd">{{ a.area }} {{ a.detail }}</div>
              <div class="op">
                <span class="link" v-if="!a.def" @click="setDef(a)">设为默认</span>
                <span class="link danger" @click="delAddr(a)">删除</span>
              </div>
            </div>
            <el-button size="small" type="primary" plain @click="dlg.open=true">新增收货地址</el-button>
          </div>

          <div v-else>
            <el-alert title="仅修改本地演示账号 13800000000，初始密码 demo12345；不影响线上账号。" :closable="false" type="info" style="margin-bottom:16px"/><div class="pf-form">
              <div class="f"><label>原密码</label><el-input v-model="pwd.old" type="password" size="small" show-password /></div>
              <div class="f"><label>新密码</label><el-input v-model="pwd.next" type="password" size="small" show-password /></div>
              <div class="f"><label>确认新密码</label><el-input v-model="pwd.again" type="password" size="small" show-password /></div>
              <div class="pf-ft"><el-button type="primary" size="small" @click="savePwd" :loading="pwdBusy">修改密码</el-button></div>
            </div>
            <div class="pf-dev-hd">登录设备</div>
            <div class="pf-dev" v-for="(d,i) in devices" :key="i">
              <span>{{ d.d }}</span><span class="muted">{{ d.ip }}</span><span class="muted">{{ d.at }}</span>
              <el-tag v-if="d.now" size="small" type="success" effect="light">当前设备</el-tag>
              <span v-else class="link danger" role="button" tabindex="0" @click="offline(d)" @keydown.enter="offline(d)">下线</span>
            </div>
          </div>
        </div>
      </div>

      <el-dialog v-model="dlg.open" title="新增收货地址" width="520px">
        <el-form label-width="88px">
          <el-form-item label="收货人"><el-input v-model="dlg.name" /></el-form-item>
          <el-form-item label="手机号"><el-input v-model="dlg.phone" /></el-form-item>
          <el-form-item label="所在地区"><el-input v-model="dlg.area" /></el-form-item>
          <el-form-item label="详细地址"><el-input v-model="dlg.detail" type="textarea" :rows="2" /></el-form-item>
        </el-form>
        <template #footer><el-button @click="dlg.open=false">取消</el-button><el-button type="primary" @click="addAddr">确定</el-button></template>
      </el-dialog>
    </div>`
  };

  /* ============================================================
     注册到 erp.js
     ============================================================ */
  window.ERP_EXTRA = {
    comps: {
      StatPage: StatPage, SortNav: SortNav, Decoration: Decoration,
      MessageCenter: MessageCenter, LearnGarden: LearnGarden, SceneLib: SceneLib, Profile: Profile
    },
    /* 自定义组件对应的路由 */
    custom: {
      'goods/sort': 'SortNav', 'store/decoration': 'Decoration', 'message/index': 'MessageCenter',
      'learningGarden/index': 'LearnGarden', 'scene/index': 'SceneLib', 'personal/setting': 'Profile'
    },
    /* 独立编辑页 */
    sub: { 'lucky/add': 'DocEdit', 'physical/add': 'DocEdit', 'package/add': 'DocEdit' },
    names: {
      'goods/sort': '顶部分类导航', 'store/decoration': '店铺装修', 'message/index': '我的消息',
      'learningGarden/index': '学习园地', 'scene/index': '场景库', 'personal/setting': '客户个人中心',
      'lucky/add': '创建抽奖活动', 'physical/add': '新增商品', 'package/add': '新增套餐商品'
    },
    /* 列表页「新增」应跳转的独立页 */
    newRoute: { 'lucky/list': 'lucky/add' },
    /* 列表页工具栏里的页面跳转按钮 */
    navButtons: { 'purchase/supplier': { '账号管理': 'purchase/supplier/account' } }
  };
  Object.keys(window.B_STAT || {}).forEach((k) => {
    window.ERP_EXTRA.custom[k] = 'StatPage';
    window.ERP_EXTRA.names[k] = window.B_STAT[k].name;
  });
})();
