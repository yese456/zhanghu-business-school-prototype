/* ============================================================
   系统 C · 品牌官网（Vue 3 + Element Plus）
   ============================================================ */
(function () {
  'use strict';
  const { createApp, ref, reactive, computed, watch } = Vue;
  const { ElMessage, ElMessageBox } = ElementPlus;
  const M = window.MOCK;

  const money = (n) => '¥' + Number(n).toLocaleString('zh-CN');

  /* ------------------------------------------------------------
     演示数据：订货单实体 / 购物草稿 / 登录态
     同一份实体在「选品 → 草稿 → 提交 → 列表 → 详情」之间流转，
     切页与刷新后保持一致（localStorage 持久化）。
     ------------------------------------------------------------ */
  const S = window.SHARED;
  const K_ORDERS = 'c:orders';
  const K_DRAFT = 'c:draft';
  const K_SESSION = 'c:session';
  const displayDiscount=ref(Number(S.store.get('c:displayDiscount')??10));
  const displayPrice=n=>Math.round(Number(n)*displayDiscount.value*10)/100;

  const mockOrders = () => M.orders.map((o) => ({
    no: o.no, product: o.productName, img: o.productImg, qty: o.products,
    amount: o.amount, paid: o.paid, state: o.produceStatus, created: String(o.createdAt).slice(0, 10),
    customer: o.customer, contact: o.customerName, phone: o.phone || '', address: o.address || '',
    delivery: o.delivery, channel: o.channel, owner: o.owner, remark: o.remark || '', items: null
  }));
  const savedOrders = () => { const v = S.store.get(K_ORDERS); return Array.isArray(v) ? v : []; };
  const allOrders = () => S.db ? S.db.all('orders').map(o => S.db.siteOrder(o)) : savedOrders().concat(mockOrders());
  const findOrder = (no) => allOrders().find((o) => o.no === no) || null;
  const saveOrder = (o) => {
    if (S.db) S.db.upsert('orders', Object.assign({}, o, { id:o.no, productName:o.product, productImg:o.img, products:o.qty,
      createdAt:o.created, customerName:o.contact, produceStatus:o.state }));
    else { const l = savedOrders().filter(x => x.no !== o.no); l.unshift(o); S.store.set(K_ORDERS, l); }
    return o;
  };

  const getDraft = () => S.store.get(K_DRAFT) || { items: [], customer: '', phone: '', company: '', address: '', date: '', remark: '' };
  const setDraft = (d) => S.store.set(K_DRAFT, d);
  const clearDraft = () => S.store.del(K_DRAFT);

  const getSession = () => {try{return JSON.parse(sessionStorage.getItem('aicard.demo.'+K_SESSION))||S.store.get(K_SESSION)||null;}catch(e){return S.store.get(K_SESSION)||null;}};
  const setSession = (u) => {sessionStorage.removeItem('aicard.demo.'+K_SESSION);S.store.del(K_SESSION);if(u){if(u.remember)S.store.set(K_SESSION,u);else sessionStorage.setItem('aicard.demo.'+K_SESSION,JSON.stringify(u));}};

  const routes = [
    '/', '/login', '/case', '/case-detail', '/product', '/product-detail', '/fenglu-product-detail',
    '/fenglu-case-detail', '/product-records', '/material', '/material-detail', '/project', '/project-add',
    '/project-detail', '/project-edit', '/project-product', '/about', '/order-index', '/order-add', '/order-detail',
    '/aftersale', '/aftersale-detail', '/aftersale-add', '/statistics', '/statisticslist',
    '/statisticsstandard', '/process-set', '/together', '/workbench'
  ];

  /* ---------- 品牌标识 ---------- */
  const LOGO = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="12" fill="#E2874F"/>
    <path d="M18 44c0-10 5.5-16 13-16 6.4 0 10.5 4 10.5 9.2 0 4.2-3 6.8-6.6 6.8" fill="none" stroke="#fff" stroke-width="5.4" stroke-linecap="round"/>
    <path d="M44 18c-1 9-5.4 13.5-12 13.5" fill="none" stroke="#fff" stroke-width="5.4" stroke-linecap="round"/>
    <circle cx="42.5" cy="45" r="3.4" fill="#fff"/></svg>`;

  /* ---------- 首页 ---------- */
  const Home = {
    props: ['nav'],
    setup(props) {
      const slides = [
        { img: '../assets/img/source-home/banner-1.jpg' },
        { img: '../assets/img/source-home/banner-2.jpg' }
      ];
      const idx = ref(0);
      let timer = null;
      const start = () => { timer = setInterval(() => { idx.value = (idx.value + 1) % slides.length; }, 5000); };
      start();
      Vue.onUnmounted(() => clearInterval(timer));
      const go = (i) => { idx.value = (i + slides.length) % slides.length; };
      const hot = M.products.slice(0, 8);
      return { slides, idx, go, hot, cats: [{"name": "沙发", "img": "../assets/img/source-home/category-1.jpg"}, {"name": "休闲椅", "img": "../assets/img/source-home/category-2.jpg"}, {"name": "餐椅", "img": "../assets/img/source-home/category-3.jpg"}, {"name": "餐桌", "img": "../assets/img/source-home/category-4.jpg"}, {"name": "茶几电视柜", "img": "../assets/img/source-home/category-5.jpg"}, {"name": "床头柜", "img": "../assets/img/source-home/category-6.jpg"}, {"name": "产品中心", "img": "../assets/img/source-home/category-7.png"}, {"name": "案例中心", "img": "../assets/img/source-home/category-8.png"}, {"name": "活动中心", "img": "../assets/img/source-home/category-9.png"}, {"name": "服务中心", "img": "../assets/img/source-home/category-10.png"}, {"name": "地板", "img": "../assets/img/source-home/category-11.jpg"}, {"name": "删除", "img": "../assets/img/source-home/category-12.jpg"}], M, money, displayPrice, LOGO };
    },
    template: `
    <div>
      <div class="hero source-hero" data-demo="原站双屏轮播，可左右切换 / 圆点定位">
        <div class="slide" v-for="(s,i) in slides" :key="i" :class="{on: idx===i}"><img :src="s.img" alt=""></div>
        <button type="button" class="arw l" aria-label="上一张轮播" @click="go(idx-1)">‹</button>
        <button type="button" class="arw r" aria-label="下一张轮播" @click="go(idx+1)">›</button>
        <div class="dots"><button type="button" v-for="(s,i) in slides" :key="i" :class="{on: idx===i}" :aria-label="'切换到第'+(i+1)+'张轮播'" :aria-pressed="idx===i" @click="go(i)"></button></div>
      </div>

      <div class="source-home-sections"><div class="container">
        <div class="sec">
          <div class="sec-hd"><h3>热销爆款</h3>
            <span class="more" @click="nav('/product')">更多 ›</span></div>
          <div class="pgrid">
            <div class="pcard2" v-for="p in hot" :key="p.id" @click="nav('/product-detail', p.id)">
              <div class="ph"><img :src="p.img" :alt="p.name"></div>
              <div class="bd">
                <span class="tag" v-if="p.hot">热卖款</span><span style="font-size:13px">{{ p.name }}</span>
                <div class="nm" style="height:auto;margin-top:6px">{{ p.brand }}</div>
                <div class="pr">￥{{ displayPrice(p.price).toLocaleString() }}<span v-if="p.priceFrom">起</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-hd"><h3>分类推荐</h3></div>
          <div class="source-category-grid">
            <div v-for="c in cats" :key="c.name" style="cursor:pointer" @click="nav('/product')">
              <img :src="c.img" :alt="c.name"><span>{{ c.name }}</span>
            </div>
          </div>
        </div>

      </div></div>
    </div>`
  };

  /* ---------- 商品列表 ---------- */
  const Product = {
    props: ['nav', 'kw'],
    setup(props) {
      const brand = ref('全部'), cat = ref('全部'), space = ref('全部'), style = ref('全部');
      const mode = ref('grid'), page = ref(1), size = 16, expand = ref(false);
      const kw = ref(props.kw || ''), showHidden = ref(false);
      watch([brand, cat, space, style, kw, showHidden], () => { page.value = 1; });
      watch(() => props.kw, v => { kw.value = v || ''; });
      const cats = ['全部', '沙发', '休闲椅', '餐椅', '餐桌', '茶几电视柜', '床头柜', '产品中心', '案例中心', '活动中心', '服务中心', '地板'];
      const rows = computed(() => {
        const k = String(kw.value || '').trim();
        return M.products.filter((p) =>
          (showHidden.value || p.online !== false) &&
          (!k || (p.name + p.sku + p.brand + p.material).indexOf(k) >= 0) &&
          (brand.value === '全部' || p.brand === brand.value) &&
          (cat.value === '全部' || p.catName === cat.value || p.cat === cat.value) &&
          (space.value === '全部' || p.space === space.value) &&
          (style.value === '全部' || p.style === style.value)
        );
      });
      const paged = computed(() => rows.value.slice((page.value - 1) * size, page.value * size));
      const reset = () => { brand.value = '全部'; cat.value = '全部'; space.value = '全部'; style.value = '全部'; kw.value = ''; };
      return { brand, cat, space, style, mode, page, size, cats, rows, paged, expand, reset, kw, showHidden, M, money, displayPrice };
    },
    template: `
    <div>
      <div class="filter-panel" data-demo="筛选条件（可组合，选择即生效）">
        <div class="container">
          <div class="frow"><div class="k">品牌</div><div class="vs">
            <span class="chip" :class="{on: brand==='全部'}" @click="brand='全部'">全部</span>
            <span class="chip" v-for="b in ['创驰国际','摩登翡丽','221']" :key="b" :class="{on: brand===b}" @click="brand=b">{{ b }}</span>
          </div></div>
          <div class="frow"><div class="k">分类</div><div class="vs">
            <span class="chip" v-for="c in (expand ? cats : cats.slice(0,9))" :key="c" :class="{on: cat===c}" @click="cat=c">{{ c }}</span>
            <span class="chip" style="color:#e2874f" @click="expand=!expand">{{ expand ? '收起' : '展开' }}</span>
          </div></div>
          <div class="frow"><div class="k">空间</div><div class="vs">
            <span class="chip" v-for="c in ['全部','客厅','书房','餐厅','卧室']" :key="c" :class="{on: space===c}" @click="space=c">{{ c }}</span>
          </div></div>
          <div class="frow"><div class="k">风格</div><div class="vs">
            <span class="chip" v-for="c in ['全部','简约','复古','轻奢','现代']" :key="c" :class="{on: style===c}" @click="style=c">{{ c }}</span>
          </div></div>
        </div>
      </div>

      <div class="container">
        <div class="fbar">
          <el-checkbox v-model="showHidden" label="查看隐藏产品" size="small" />
          <span style="margin-left:14px">共 {{ rows.length }} 件商品</span>
          <div class="sp">
            <span style="cursor:pointer" @click="reset">重置筛选</span>
            <span>浏览模式</span>
            <div class="viewmode">
              <i :class="{on: mode==='grid'}" @click="mode='grid'"><el-icon><Grid /></el-icon></i>
              <i :class="{on: mode==='list'}" @click="mode='list'"><el-icon><Tickets /></el-icon></i>
            </div>
          </div>
        </div>

        <div :class="mode==='grid' ? 'pgrid' : 'plist'" style="padding-bottom:26px">
          <div class="pcard2" v-for="p in paged" :key="p.id" @click="nav('/product-detail', p.id)">
            <div class="ph"><img :src="p.img" :alt="p.name"></div>
            <div class="bd">
              <div><span class="tag" v-if="p.hot">热卖款</span><span class="tag" v-else-if="p.priceFrom">可定制</span>
                <span style="font-size:14px">{{ p.name }}</span></div>
              <div class="br">{{ p.brand }}</div>
              <div class="pr">￥{{ displayPrice(p.price).toLocaleString() }}<span v-if="p.priceFrom"> 起</span></div>
            </div>
          </div>
        </div>
        <div v-if="!rows.length" class="empty2">没有符合筛选条件的商品，试试其他分类</div>

        <div style="display:flex;justify-content:center;padding:10px 0 50px">
          <el-pagination background layout="prev, pager, next" :total="rows.length" :page-size="size" v-model:current-page="page" />
        </div>
      </div>
    </div>`
  };

  /* ---------- 商品详情 ---------- */
  const ProductDetail = {
    props: ['nav', 'id'],
    setup(props) {
      const p = computed(() => M.products.find((x) => x.id === props.id) || M.products[0]);
      /* 相册只用真实存在的本地图片，避免 404 */
      const imgs = computed(() => [p.value.img, '../assets/img/scene-1.jpg', '../assets/img/scene-3.jpg', '../assets/img/scene-5.jpg'].slice(0, 4));
      const cur = ref(0), tab = ref('detail'), qty = ref(1);
      const mats = M.materials.filter((m) => /皮面|布面/.test(m.cat)).slice(0, 4);
      const mat = ref(mats[0] && mats[0].id);
      const related = M.products.filter((x) => x.id !== p.value.id).slice(0, 4);

      /* 加入订货单：写入共享草稿，列表/下单页读取同一份数据 */
      const pushDraft = (go) => {
        const dr = getDraft();
        const hit = dr.items.find((it) => it.id === p.value.id && it.mat === mat.value);
        if (hit) hit.qty += qty.value;
        else dr.items.push({ id: p.value.id, qty: qty.value, mat: mat.value, price: p.value.price });
        setDraft(dr);
        ElMessage.success('已加入订货单：' + p.value.name + ' × ' + qty.value);
        if (go) props.nav('/order-add');
      };
      const add = () => pushDraft(false);
      const buyNow = () => { const dr = getDraft(); dr.items = []; setDraft(dr); pushDraft(true); };
      return { p, imgs, cur, tab, qty, mats, mat, add, buyNow, related, money, displayPrice, nav: props.nav, M };
    },
    template: `
    <div class="container">
      <div class="crumb"><a @click="nav('/')">首页</a><span class="sp">/</span><a @click="nav('/product')">商品</a><span class="sp">/</span>{{ p.catName }}</div>
      <div class="detail">
        <div class="gallery">
          <div class="main"><img :src="imgs[cur]" :alt="p.name"></div>
          <div class="ths"><div class="t" v-for="(g,i) in imgs" :key="i" :class="{on: cur===i}" @click="cur=i"><img :src="g"></div></div>
        </div>
        <div class="dinfo">
          <h1>{{ p.name }}</h1>
          <div class="meta">
            <span class="tag" v-if="p.hot" style="font-size:11px;color:#d9603a;border:1px solid #f3c9bb;background:#fdf3ef;padding:1px 6px">热卖款</span>
            <span>品牌：{{ p.brand }}</span><span>·</span><span>编码：{{ p.sku }}</span>
          </div>
          <div class="price">￥{{ displayPrice(p.price).toLocaleString() }}<span v-if="p.priceFrom">起 / {{ p.unit }}</span></div>
          <div class="rows">
            <div class="r"><span class="k">规格</span><span class="v">{{ p.spec }}</span></div>
            <div class="r"><span class="k">主材</span><span class="v">{{ p.material }}</span></div>
            <div class="r"><span class="k">空间</span><span class="v">{{ p.space }} · {{ p.style }}</span></div>
            <div class="r"><span class="k">交期</span><span class="v">下单后 25-35 天（定制款 40 天）</span></div>
            <div class="r"><span class="k">库存</span><span class="v">{{ p.stock }} 件</span></div>
          </div>
          <div style="display:flex;align-items:center;gap:14px;margin-top:4px">
            <span style="font-size:13px;color:#9aa0aa;width:72px">材质</span>
            <el-radio-group v-model="mat" size="small">
              <el-radio-button v-for="m in mats" :key="m.id" :label="m.id">{{ m.name.split(' ')[0] }}</el-radio-button>
            </el-radio-group>
          </div>
          <div class="qty">
            <span style="font-size:13px;color:#9aa0aa;width:72px">数量</span>
            <button class="b" @click="qty=Math.max(1,qty-1)">−</button><input v-model.number="qty" type="number"><button class="b" @click="qty++">+</button>
            <span style="font-size:12px;color:#9aa0aa;margin-left:10px">预计金额 {{ '¥' + (p.price*qty).toLocaleString() }}</span>
          </div>
          <div class="btns-row">
            <button type="button" class="big-btn main" @click="add">加入订货单</button>
            <button type="button" class="big-btn ghost" @click="buyNow">直接下单</button>
            <button type="button" class="big-btn ghost" @click="$message.info('已收藏')">收藏</button>
          </div>
        </div>
      </div>

      <div class="dtabs">
        <div class="t" :class="{on: tab==='detail'}" @click="tab='detail'">商品详情</div>
        <div class="t" :class="{on: tab==='spec'}" @click="tab='spec'">规格参数</div>
        <div class="t" :class="{on: tab==='mat'}" @click="tab='mat'">材质说明</div>
      </div>
      <div class="dbody">
        <template v-if="tab==='detail'">
          <p>{{ p.name }} 采用 {{ p.material }}，{{ p.style }}风格，适合{{ p.space }}场景。结构件经 72 小时盐雾与 5 万次疲劳测试，坐感回弹衰减 ≤ 3%。</p>
          <img :src="imgs[1]" style="width:100%;max-height:420px;object-fit:cover;margin:18px 0">
          <p>可选配色 12 种，支持尺寸、面料、软硬度定制；工程单可提供深化图纸与打样服务。</p>
        </template>
        <table v-else-if="tab==='spec'" class="spec-table">
          <tr><td class="k">产品编码</td><td>{{ p.sku }}</td><td class="k">规格尺寸</td><td>{{ p.spec }}</td></tr>
          <tr><td class="k">主材</td><td>{{ p.material }}</td><td class="k">品牌</td><td>{{ p.brand }}</td></tr>
          <tr><td class="k">适用空间</td><td>{{ p.space }}</td><td class="k">风格</td><td>{{ p.style }}</td></tr>
          <tr><td class="k">单位</td><td>{{ p.unit }}</td><td class="k">起订量</td><td>1 件</td></tr>
          <tr><td class="k">执行标准</td><td>GB/T 3324-2017</td><td class="k">质保</td><td>3 年</td></tr>
        </table>
        <div v-else>
          <p>本款可选用下列材质，实际以打样确认为准：</p>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:14px">
            <div v-for="m in mats" :key="m.id" style="border:1px solid #eee">
              <img :src="m.img" style="width:100%;height:150px;object-fit:cover">
              <div style="padding:10px 12px;font-size:13px">{{ m.name }}<div style="color:#9aa0aa;font-size:12px;margin-top:4px">{{ m.cat }} · {{ m.grade }}级 · ￥{{ m.price }}/{{ m.unit }}</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="sec" style="padding-top:0;padding-bottom:60px">
        <div class="sec-hd"><h3 style="font-size:18px">相关推荐</h3></div>
        <div class="pgrid">
          <div class="pcard2" v-for="r in related" :key="r.id" @click="nav('/product-detail', r.id)">
            <div class="ph" style="height:200px"><img :src="r.img"></div>
            <div class="bd"><div class="nm" style="height:auto">{{ r.name }}</div><div class="pr" style="margin-top:8px">￥{{ r.price.toLocaleString() }}</div></div>
          </div>
        </div>
      </div>
    </div>`
  };

  /* ---------- 材质 ---------- */
  const Material = {
    props: ['nav','kw'],
    setup(props) {
      const cat = ref('全部');
      const cats = ['全部', '皮面', '布面', '大理石', '金属', '油漆', '海绵', '木面'];
      const rows = computed(() => M.materials.filter((m) => (cat.value === '全部' || m.cat === cat.value)&&(!props.kw||[m.name,m.code,m.sku,m.cat].join(' ').includes(props.kw))));
      const cur = ref(null);
      return { cat, cats, rows, cur, money };
    },
    template: `
    <div>
      <div class="filter-panel" data-demo="筛选条件（可组合，选择即生效）">
        <div class="container">
          <div class="frow"><div class="k">材质</div><div class="vs">
            <span class="chip" v-for="c in cats" :key="c" :class="{on: cat===c}" @click="cat=c">{{ c }}</span>
          </div></div>
        </div>
      </div>
      <div class="container">
        <div class="fbar"><span>共 {{ rows.length }} 种材质</span>
          <div class="sp"><span>浏览模式</span><div class="viewmode"><i class="on"><el-icon><Grid /></el-icon></i><i><el-icon><Tickets /></el-icon></i></div></div>
        </div>
        <div class="mgrid" style="padding-bottom:50px">
          <div class="mcard" v-for="m in rows" :key="m.id" @click="cur=m">
            <div class="ph"><img :src="m.img" :alt="m.name"></div>
            <div class="bd">
              <div class="nm"><span class="g">{{ m.grade }}</span>{{ m.name }}</div>
              <div class="ct">{{ m.cat }} · ￥{{ m.price }}/{{ m.unit }}</div>
            </div>
          </div>
        </div>
      </div>
      <el-dialog v-model="cur" :title="cur ? cur.name : ''" width="720px">
        <div v-if="cur" style="display:grid;grid-template-columns:320px 1fr;gap:24px">
          <img :src="cur.img" style="width:100%;height:280px;object-fit:cover">
          <div>
            <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed #eee;font-size:13px"><span style="color:#9aa0aa">材质编码</span><span>{{ cur.code }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed #eee;font-size:13px"><span style="color:#9aa0aa">分类</span><span>{{ cur.cat }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed #eee;font-size:13px"><span style="color:#9aa0aa">等级</span><span>{{ cur.grade }} 级</span></div>
            <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed #eee;font-size:13px"><span style="color:#9aa0aa">参考单价</span><span>￥{{ cur.price }} / {{ cur.unit }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed #eee;font-size:13px"><span style="color:#9aa0aa">供应商</span><span>{{ cur.supplier }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:9px 0;font-size:13px"><span style="color:#9aa0aa">库存</span><span>{{ cur.stock }} {{ cur.unit }}</span></div>
          </div>
        </div>
        <template #footer><el-button @click="cur=null">关闭</el-button><el-button type="primary" @click="cur=null;$message.success('已加入材质清单')">加入材质清单</el-button></template>
      </el-dialog>
    </div>`
  };

  /* ---------- 案例 ---------- */
  const CaseList = {
    props: ['nav'],
    setup(props) {
      const type = ref('全部');
      const types = ['全部', '住宅样板间', '会所', '售楼处', '私宅', '办公', '酒店', '展厅', '民宿'];
      const rows = computed(() => M.cases.filter((c) => type.value === '全部' || c.type === type.value));
      return { type, types, rows };
    },
    template: `
    <div>
      <div class="filter-panel" data-demo="筛选条件（可组合，选择即生效）"><div class="container">
        <div class="frow"><div class="k">类型</div><div class="vs">
          <span class="chip" v-for="t in types" :key="t" :class="{on: type===t}" @click="type=t">{{ t }}</span>
        </div></div>
      </div></div>
      <div class="container">
        <div class="fbar"><span>共 {{ rows.length }} 个案例</span></div>
        <div class="cgrid" style="padding-bottom:60px">
          <div class="ccard" v-for="c in rows" :key="c.id" @click="nav('/case-detail', c.id)">
            <img :src="c.img" :alt="c.title">
            <div class="ov"><div class="t">{{ c.title }}</div><div class="m">{{ c.city }} · {{ c.type }} · {{ c.area }}㎡ · {{ c.year }}</div></div>
          </div>
        </div>
      </div>
    </div>`
  };

  const CaseDetail = {
    props: ['nav', 'id'],
    setup(props) {
      const c = computed(() => M.cases.find((x) => x.id === props.id) || M.cases[0]);
      const others = M.cases.filter((x) => x.id !== c.value.id).slice(0, 3);
      return { c, others, nav: props.nav };
    },
    template: `
    <div>
      <div style="height:420px;overflow:hidden"><img :src="c.img" style="width:100%;height:100%;object-fit:cover"></div>
      <div class="container">
        <div class="crumb"><a @click="nav('/')">首页</a><span class="sp">/</span><a @click="nav('/case')">案例</a><span class="sp">/</span>{{ c.title }}</div>
        <h1 style="font-size:26px;font-weight:500;margin:6px 0 12px">{{ c.title }}</h1>
        <div style="display:flex;gap:22px;font-size:13px;color:#9aa0aa;padding-bottom:20px;border-bottom:1px solid #eee">
          <span>{{ c.city }}</span><span>{{ c.type }}</span><span>{{ c.area }} ㎡</span><span>{{ c.year }}</span><span>主案设计：{{ c.designer }}</span>
        </div>
        <div class="dbody">
          <p>本项目位于{{ c.city }}，面积 {{ c.area }} ㎡，由 {{ c.designer }} 主案设计。整体以低饱和度的材质层次构建空间气质，主沙发选用创驰国际高定系列，配合手工打磨的石材与木饰面，形成克制的质感对比。</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:22px 0">
            <img src="../assets/img/scene-2.jpg" style="width:100%;height:300px;object-fit:cover">
            <img src="../assets/img/scene-4.jpg" style="width:100%;height:300px;object-fit:cover">
          </div>
          <p>软装部分采用模块化组合方案，兼顾使用与陈列；所有面料均通过 4 万次耐磨测试，可拆洗维护。</p>
        </div>
        <div class="sec" style="padding-top:0;padding-bottom:60px">
          <div class="sec-hd"><h3 style="font-size:18px">更多案例</h3></div>
          <div class="cgrid">
            <div class="ccard" v-for="o in others" :key="o.id" @click="nav('/case-detail', o.id)" style="height:220px">
              <img v-if="o.img" :src="o.img"><div class="ov"><div class="t" style="font-size:15px">{{ o.title }}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>`
  };

  /* ---------- 公司介绍 ---------- */
  const About = {
    setup() {
      return { M };
    },
    template: `
    <div>
      <div class="about-hero">
        <img src="../assets/img/hero-4.jpg" alt="">
        <div class="container in">
          <h1>{{ M.company.name }}<span style="font-size:16px;opacity:.75;margin-left:12px">{{ M.company.sub }}</span></h1>
          <p>{{ M.company.desc }}</p>
        </div>
      </div>
      <div class="container">
        <div class="stat-row">
          <div class="s"><div class="v">2016</div><div class="l">成立年份</div></div>
          <div class="s"><div class="v">26000㎡</div><div class="l">生产基地</div></div>
          <div class="s"><div class="v">3200+</div><div class="l">月产能（件）</div></div>
          <div class="s"><div class="v">数万</div><div class="l">服务企业</div></div>
        </div>
        <div class="about-body">
          <div class="txt">
            <h3>关于我们</h3>
            <p>{{ M.company.desc }}</p>
            <p>旗下「创驰国际」「摩登翡丽」两大软装品牌，覆盖沙发、休闲椅、餐桌、茶几电视柜、床具与地板等全屋品类，为设计师、工程商与终端客户提供从选样、打样到批量交付的一体化服务。</p>
            <h3 style="margin-top:30px">我们能做什么</h3>
            <p>· 高定软装：支持尺寸、面料、结构定制，48 小时出样；<br>
               · 工程配套：售楼处、样板间、酒店批量交付，交付节点可控；<br>
               · 数字化协同：订货单在线流转，生产进度、质检、物流全程可视。</p>
          </div>
          <div class="about-side">
            <div class="r"><span class="k">公司名称</span><span class="v">{{ M.company.name }}</span></div>
            <div class="r"><span class="k">成立时间</span><span class="v">{{ M.company.founded }} 年</span></div>
            <div class="r"><span class="k">员工规模</span><span class="v">{{ M.company.staff }} 人</span></div>
            <div class="r"><span class="k">联系电话</span><span class="v">{{ M.company.phone }}</span></div>
            <div class="r"><span class="k">商务邮箱</span><span class="v">{{ M.company.email }}</span></div>
            <div class="r" style="border-bottom:0"><span class="k">公司地址</span><span class="v">{{ M.company.address }}</span></div>
          </div>
        </div>
        <div class="sec" style="padding-top:10px;padding-bottom:60px">
          <div class="sec-hd"><h3>资质与荣誉</h3></div>
          <div style="display:flex;gap:14px;flex-wrap:wrap">
            <span v-for="t in M.company.tags" :key="t" style="border:1px solid #eee;padding:10px 18px;font-size:13px;color:#4b5563">{{ t }}</span>
            <span style="border:1px solid #eee;padding:10px 18px;font-size:13px;color:#4b5563">质量检验流程展示（演示）</span>
            <span style="border:1px solid #eee;padding:10px 18px;font-size:13px;color:#4b5563">环保材料管理展示（演示）</span>
          </div>
        </div>
      </div>
    </div>`
  };

  /* ---------- 订货单 ---------- */
  const OrderIndex = {
    props: ['nav'],
    setup(props) {
      const tab = ref('全部订单');
      const tabs = ['全部订单', '草稿', '待确认', '生产中', '已完成', '售后'];
      const rows = computed(allOrders), page = ref(1), draft = ref(getDraft());
      watch(tab, () => { page.value = 1; });
      const draftItems = computed(() => {
        const dr = draft.value;
        return (dr.items || []).map((it) => {
          const p = M.products.find((x) => x.id === it.id) || M.products[0];
          return { id: it.id, name: p.name, img: p.img, qty: it.qty, price: p.price, amount: p.price * it.qty };
        });
      });
      const draftTotal = computed(() => draftItems.value.reduce((a, b) => a + b.amount, 0));
      const list = computed(() => {
        if (tab.value === '全部订单') return rows.value;
        if (tab.value === '草稿') return rows.value.filter(r => r.state === '草稿');
        const states = { '待确认': ['待确认','已下单','待排产'], '生产中': ['生产中','排产中','待开工'], '已完成': ['已完成','生产完成','待入库','已入库','待出库','已出库'], '售后': ['售后'] };
        return rows.value.filter(r => (states[tab.value] || [tab.value]).includes(r.state));
      });
      const dropDraft = () => {
        ElMessageBox.confirm('确认清空当前草稿？', '提示', { type: 'warning' })
          .then(() => { clearDraft(); draft.value = getDraft(); ElMessage.success('草稿已清空'); }).catch(() => {});
      };
      const paged = computed(() => list.value.slice((page.value - 1) * 10, page.value * 10));
      return { tab, tabs, list, rows, paged, page, draftItems, draftTotal, dropDraft, nav: props.nav, money };
    },
    template: `
    <div class="container">
      <div class="crumb"><a @click="nav('/')">首页</a><span class="sp">/</span>订货单</div>
      <div class="order-wrap">
        <div class="order-side">
          <div class="it" v-for="t in tabs" :key="t" :class="{on: tab===t}" @click="tab=t">{{ t }}</div>
          <div style="margin-top:18px"><el-button type="primary" style="width:100%" @click="nav('/order-add')">+ 新建订货单</el-button></div>
        </div>
        <div class="order-main">
          <div class="panel2" v-if="draftItems.length && (tab==='全部订单'||tab==='草稿')" style="margin-bottom:16px;border:1px dashed #f0c9b4">
            <div class="hd">未提交的草稿<span class="r">共 {{ draftItems.length }} 种商品 · {{ money(draftTotal) }}</span></div>
            <el-table :data="draftItems" size="small">
              <el-table-column label="商品" width="260">
                <template #default="s"><div style="display:flex;gap:9px;align-items:center">
                  <img v-if="s.row.img" :src="s.row.img" style="width:36px;height:36px;object-fit:cover;border-radius:3px">
                  <span style="font-size:13px">{{ s.row.name }}</span></div></template>
              </el-table-column>
              <el-table-column prop="qty" label="数量" width="80" align="center" />
              <el-table-column label="小计" align="right">
                <template #default="s"><span style="font-family:var(--font-num)">{{ money(s.row.amount) }}</span></template>
              </el-table-column>
            </el-table>
            <div style="padding:12px 18px;display:flex;gap:10px">
              <el-button type="primary" size="small" @click="nav('/order-add')">继续编辑并提交</el-button>
              <el-button size="small" @click="dropDraft">清空草稿</el-button>
            </div>
          </div>
          <div class="panel2">
            <div class="hd">我的订货单<span class="r">共 {{ list.length }} 单</span></div>
            <el-table :data="paged" size="default" empty-text="暂无该状态的订货单">
              <el-table-column prop="no" label="订货单号" width="140" />
              <el-table-column label="商品" width="230">
                <template #default="s"><div style="display:flex;gap:9px;align-items:center">
                  <img v-if="s.row.img" :src="s.row.img" style="width:40px;height:40px;object-fit:cover;border-radius:3px">
                  <div><div style="font-size:13px">{{ s.row.product }}</div><div style="font-size:11px;color:#9aa0aa">共 {{ s.row.qty }} 件</div></div>
                </div></template>
              </el-table-column>
              <el-table-column label="金额" width="120" align="right">
                <template #default="s"><span style="font-family:var(--font-num)">{{ money(s.row.amount) }}</span></template>
              </el-table-column>
              <el-table-column prop="state" label="状态" width="110" />
              <el-table-column prop="created" label="下单日期" width="120" />
              <el-table-column label="操作">
                <template #default="s"><span style="color:#e2874f;cursor:pointer;font-size:13px" @click="nav('/order-detail', 'id='+s.row.no)">查看详情</span></template>
              </el-table-column>
            </el-table>
            <div style="padding:14px 18px;display:flex;align-items:center"><span style="font-size:13px;color:#9aa0aa">共 {{ list.length }} 条</span>
              <el-pagination v-model:current-page="page" style="margin-left:auto" layout="prev, pager, next" :total="list.length" :page-size="10" small /></div>
          </div>
        </div>
      </div>
    </div>`
  };

  const OrderAdd = {
    props: ['nav'],
    setup(props) {
      const step = ref(0);
      const prods = M.products;
      const dr = getDraft();
      const form = reactive({
        name: dr.name || '',
        customer: dr.customer || '', phone: dr.phone || '', company: dr.company || '', address: dr.address || '',
        date: dr.date || '', remark: dr.remark || '',
        items: (dr.items && dr.items.length) ? dr.items.slice() : []
      });
      const unitPrice=it=>it.price??(prods.find(p=>p.id===it.id)?.price||0);
      const updatePrice=it=>{it.price=prods.find(p=>p.id===it.id)?.price??null;};
      const total = computed(() => form.items.reduce((a, it) => {
        const p = prods.find((x) => x.id === it.id);
        return a + (p ? unitPrice(it) * it.qty : 0);
      }, 0));
      const qtyAll = computed(() => form.items.reduce((a, b) => a + Number(b.qty || 0), 0));
      const addItem = () => form.items.push({ id: prods[0].id, qty: 1, price: prods[0].price });
      const del = (i) => form.items.splice(i, 1);
      const snapshot = () => ({ name: form.name, customer: form.customer, phone: form.phone, company: form.company,
        address: form.address, date: form.date, remark: form.remark, items: JSON.parse(JSON.stringify(form.items)) });

      const validate = () => {
        if (form.items.some(it => !prods.find(p => p.id === it.id) || !Number.isFinite(Number(it.qty)) || Number(it.qty) <= 0)) return '请选择有效商品，数量须大于 0';
        if (form.date && form.date < new Date().toISOString().slice(0,10)) return '交付日期不能早于下单日期';
        if (!form.items.length) return '请先添加至少 1 件商品';
        if (!form.customer.trim()) return '请填写联系人姓名';
        if (!/^1[3-9]\d{9}$/.test(String(form.phone).trim())) return '请填写正确的 11 位手机号';
        if (!form.address.trim()) return '请填写交付地址';
        return '';
      };
      const saveDraft = () => {
        setDraft(snapshot());
        ElMessage.success('已保存草稿，可在「订货单 - 草稿」中继续编辑');
      };
      const submitted = ref(false);
      const submit = () => {
        if (submitted.value) return;
        const err = validate();
        if (err) return ElMessage.warning(err);
        const no = S.newId('S');
        const first = prods.find((x) => x.id === form.items[0].id) || prods[0];
        const o = {
          no, name: form.name.trim() || (form.customer + '的订货单'), product: form.items.length > 1 ? (first.name + ' 等 ' + form.items.length + ' 件') : first.name,
          img: first.img, qty: qtyAll.value, amount: total.value, paid: 0, state: '待确认',
          created: new Date().toISOString().slice(0, 10), customer: form.company || form.customer,
          contact: form.customer, phone: form.phone, address: form.address, delivery: form.date,
          channel: '官网', owner: '张松涛', remark: form.remark,
          items: form.items.map((it) => {
            const p = prods.find((x) => x.id === it.id) || prods[0];
            return { id: it.id, name: p.name, img: p.img, qty: it.qty, price: unitPrice(it) };
          })
        };
        saveOrder(o);
        submitted.value = true;
        clearDraft();
        ElMessageBox.alert('订货单 ' + no + ' 已提交，等待商家确认。', '提交成功', { confirmButtonText: '查看订单' })
          .then(() => props.nav('/order-detail', 'id=' + no)).catch(() => {});
      };
      return { step, form, prods, total, qtyAll, addItem, del, submit, saveDraft, submitted, money, unitPrice, updatePrice };
    },
    template: `
    <div class="container site-order-add">
      <div class="crumb"><a @click="nav('/')">首页</a><span class="sp">/</span><a @click="nav('/order-index')">订货单</a><span class="sp">/</span>新建订货单</div>
      <div class="order-steps" style="display:flex;gap:16px;padding:6px 0 22px">
        <el-steps :active="step" align-center style="width:520px">
          <el-step title="选择商品" /><el-step title="填写信息" /><el-step title="确认提交" />
        </el-steps>
        <div style="margin-left:auto;font-size:13px;color:#9aa0aa;align-self:center">下单后 24 小时内商家会与您确认交期</div>
      </div>

      <div class="panel2" style="margin-bottom:18px">
        <div class="hd">商品明细<span class="r"><el-button size="small" type="primary" plain @click="addItem">+ 添加商品</el-button></span></div>
        <div style="padding:16px 20px">
          <div v-if="!form.items.length" style="padding:34px 0;text-align:center;color:#9aa0aa;font-size:13px">
            还没有商品，点击右上角「添加商品」，或先去 <a style="color:#e2874f;cursor:pointer" @click="nav('/product')">商品列表</a> 选品
          </div>
          <div v-for="(it,i) in form.items" :key="i" class="order-entry" style="display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px dashed #f0f0f0">
            <img :src="(prods.find(p=>p.id===it.id)||{}).img" style="width:64px;height:64px;object-fit:cover;border-radius:3px">
            <div style="flex:1">
              <el-select v-model="it.id" @change="updatePrice(it)" size="small" style="width:300px">
                <el-option v-for="p in prods" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
              <div style="font-size:12px;color:#9aa0aa;margin-top:6px">单价 ￥{{ unitPrice(it).toLocaleString() }} · {{ (prods.find(p=>p.id===it.id)||{}).spec }}</div>
            </div>
            <el-input-number v-model="it.qty" :min="1" size="small" style="width:110px" />
            <div style="width:110px;text-align:right;font-family:var(--font-num);color:#d9603a">￥{{ (unitPrice(it) * it.qty).toLocaleString() }}</div>
            <span style="color:#c0c4cc;cursor:pointer" @click="del(i)">删除</span>
          </div>
        </div>
      </div>

      <div class="order-summary-grid" style="display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:18px;padding-bottom:26px">
        <div class="panel2">
          <div class="hd">收货与联系信息</div>
          <div class="form2">
            <div class="fi"><label>订单名称</label><el-input v-model="form.name" placeholder="如：南山卓越维港-全屋定制" /></div>
            <div class="fi"><label><i>*</i>联系人</label><el-input v-model="form.customer" placeholder="请输入收货人姓名" /></div>
            <div class="fi"><label><i>*</i>手机号</label><el-input v-model="form.phone" placeholder="11 位手机号，用于接收订单与物流通知" /></div>
            <div class="fi"><label>公司名称</label><el-input v-model="form.company" placeholder="选填" /></div>
            <div class="fi" style="grid-column:1/-1"><label><i>*</i>交付地址</label><el-input v-model="form.address" placeholder="省 / 市 / 区 详细地址" /></div>
            <div class="fi"><label>期望交货</label><el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" /></div>
            <div class="fi" style="align-items:flex-start"><label>备注</label><el-input v-model="form.remark" type="textarea" :rows="3" placeholder="如定制尺寸、面料偏好、现场限制等" /></div>
          </div>
        </div>
        <div class="panel2" style="height:fit-content">
          <div class="hd">订单汇总</div>
          <div style="padding:18px 20px">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:12px"><span style="color:#9aa0aa">商品件数</span><span>{{ qtyAll }}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:12px"><span style="color:#9aa0aa">运费</span><span>到货后按实际结算</span></div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid #f0f0f0;padding-top:14px">
              <span style="font-size:13px;color:#9aa0aa">商品金额</span>
              <span style="font-size:24px;color:#d9603a;font-family:var(--font-num)">{{ money(total) }}</span>
            </div>
            <button type="button" class="big-btn main" style="width:100%;margin-top:18px" :disabled="submitted" @click="submit">提交订货单</button>
            <button type="button" class="big-btn ghost" style="width:100%;margin-top:10px" @click="saveDraft">保存草稿</button>
            <div style="font-size:12px;color:#9aa0aa;margin-top:10px;line-height:1.7">提交后商家将在 24 小时内确认库存与交期，确认前可随时修改。</div>
          </div>
        </div>
      </div>
    </div>`
  };

  const OrderDetail = {
    props: ['nav', 'id'],
    setup(props) {
      const o = computed(() => findOrder(props.id) || findOrder((allOrders()[0] || {}).no) || mockOrders()[0]);
      const step = computed(() => ({ 待确认: 1, 草稿: 0, 待排产: 1, 排产中: 2, 待开工: 2, 生产中: 3, 生产完成: 4, 待入库:4, 已入库:4, 待出库:4, 已出库: 5 }[o.value.state] ?? 1));
      const items = computed(() => o.value.items || [{ name: o.value.product, img: o.value.img, qty: o.value.qty, price: o.value.amount }]);
      return { o, step, items, nav: props.nav, money, found: computed(() => !!findOrder(props.id)) };
    },
    template: `
    <div class="container">
      <div class="crumb"><a @click="nav('/')">首页</a><span class="sp">/</span><a @click="nav('/order-index')">订货单</a><span class="sp">/</span>{{ o.no }}</div>
      <div class="panel2" style="margin-bottom:16px">
        <div class="hd">订单进度<span class="r">{{ o.state }}</span></div>
        <div style="padding:26px 30px 10px">
          <el-steps :active="step" align-center>
            <el-step title="已下单" :description="o.created" />
            <el-step title="已确认" />
            <el-step title="生产中" />
            <el-step title="质检完成" />
            <el-step title="已发货" />
          </el-steps>
        </div>
      </div>
      <div class="site-detail-grid" style="display:grid;grid-template-columns:1fr 360px;gap:16px;padding-bottom:60px">
        <div class="panel2">
          <div class="hd">商品明细</div>
          <el-table :data="items" size="default">
            <el-table-column label="商品" width="300">
              <template #default="s"><div style="display:flex;gap:10px;align-items:center">
                <img v-if="s.row.img" :src="s.row.img" style="width:52px;height:52px;object-fit:cover;border-radius:3px">
                <span>{{ s.row.name }}</span></div></template>
            </el-table-column>
            <el-table-column prop="qty" label="数量" width="90" align="center" />
            <el-table-column label="金额" align="right">
              <template #default="s"><span style="font-family:var(--font-num)">{{ money(s.row.price * s.row.qty) }}</span></template>
            </el-table-column>
          </el-table>
          <div style="padding:14px 18px;font-size:13px;color:#6b7280">备注：{{ o.remark || '无' }}</div>
        </div>
        <div class="panel2" style="height:fit-content">
          <div class="hd">订单信息</div>
          <div style="padding:16px 20px;font-size:13px">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f0f0f0"><span style="color:#9aa0aa">订货单号</span><span>{{ o.no }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f0f0f0"><span style="color:#9aa0aa">客户</span><span>{{ o.customer }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f0f0f0"><span style="color:#9aa0aa">联系人</span><span>{{ o.contact }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f0f0f0"><span style="color:#9aa0aa">联系电话</span><span>{{ o.phone || '—' }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f0f0f0"><span style="color:#9aa0aa">交付地址</span><span style="max-width:200px;text-align:right">{{ o.address || '—' }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f0f0f0"><span style="color:#9aa0aa">交货日期</span><span>{{ o.delivery || '待确认' }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f0f0f0"><span style="color:#9aa0aa">渠道</span><span>{{ o.channel }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0"><span style="color:#9aa0aa">归属人</span><span>{{ o.owner }}</span></div>
            <div style="border-top:1px solid #f0f0f0;margin-top:8px;padding-top:14px;display:flex;justify-content:space-between;align-items:baseline">
              <span style="color:#9aa0aa">订单金额</span><span style="font-size:22px;color:#d9603a;font-family:var(--font-num)">{{ money(o.amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>`
  };

  const AfterSale = {
    props: ['nav'],
    setup(props) {
      const rows = computed(() => S.db.all('aftersales'));
      const detail = (r) => props.nav('/aftersale-detail', 'id=' + r.id);
      return { rows, detail, nav: props.nav, money };
    },
    template: `
    <div class="container">
      <div class="crumb">首页<span class="sp">/</span>售后</div>
      <div class="panel2" style="margin-bottom:50px">
        <div class="hd">售后服务单<span class="r"><el-button size="small" type="primary" @click="nav('/aftersale-add')">+ 申请售后</el-button></span></div>
        <el-table :data="rows" size="default">
          <el-table-column prop="no" label="服务单号" width="150">
            <template #default="s"><span style="color:#e2874f;cursor:pointer" @click="detail(s.row)">{{ s.row.no }}</span></template>
          </el-table-column>
          <el-table-column prop="order" label="关联订货单" width="150" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="reason" label="原因" width="160" />
          <el-table-column prop="state" label="状态" width="110" />
          <el-table-column prop="date" label="提交日期" />
          <el-table-column label="操作" width="100">
            <template #default="s"><span style="color:#e2874f;cursor:pointer" @click="detail(s.row)">查看</span></template>
          </el-table-column>
        </el-table>
      </div>
    </div>`
  };

  /* ---------- 售后详情（此前误串到材质详情） ---------- */
  const AfterSaleDetail = {
    props: ['nav', 'id'],
    setup(props) {
      const o = computed(() => S.db.find('aftersales', props.id) || S.db.all('aftersales')[0]);
      const logs = computed(() => o.value.history || [
        { t: o.value.date + ' 10:20', c: '客户提交售后申请：' + o.value.type + '，' + o.value.reason },
        ...(o.value.state === '待受理' ? [] : [{ t: o.value.date + ' 14:05', c: o.value.state === '已完成' ? '处理完成，客户已确认' : '客服已受理，正在处理' }])
      ]);
      return { o, logs, nav: props.nav, money };
    },
    template: `
    <div class="container">
      <div class="crumb"><a @click="nav('/')">首页</a><span class="sp">/</span><a @click="nav('/aftersale')">售后</a><span class="sp">/</span>{{ o.no }}</div>
      <div class="site-detail-grid" style="display:grid;grid-template-columns:1fr 360px;gap:16px;padding-bottom:60px">
        <div>
          <div class="panel2" style="margin-bottom:16px">
            <div class="hd">售后商品</div>
            <div style="display:flex;gap:14px;padding:18px 20px;align-items:center">
              <img v-if="o.img" :src="o.img" style="width:88px;height:88px;object-fit:cover;border-radius:4px">
              <div>
                <div style="font-size:15px">{{ o.product }}</div>
                <div style="font-size:12px;color:#9aa0aa;margin-top:6px">数量 {{ o.qty }} 件 · 关联订货单 {{ o.order }}</div>
                <div style="font-size:13px;color:#d9603a;margin-top:6px;font-family:var(--font-num)">{{ money(o.amount) }}</div>
              </div>
            </div>
          </div>
          <div class="panel2">
            <div class="hd">问题凭证</div><div style="padding:16px 24px"><LocalUpload :model-value="o.files || []" disabled /></div>
            <div class="hd">处理进度</div>
            <el-timeline style="padding:18px 24px">
              <el-timeline-item v-for="(l,i) in logs" :key="i" :timestamp="l.t">{{ l.c }}</el-timeline-item>
            </el-timeline>
          </div>
        </div>
        <div class="panel2" style="height:fit-content">
          <div class="hd">售后信息</div>
          <div style="padding:16px 20px;font-size:13px">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f0f0f0"><span style="color:#9aa0aa">服务单号</span><span>{{ o.no }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f0f0f0"><span style="color:#9aa0aa">售后类型</span><span>{{ o.type }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f0f0f0"><span style="color:#9aa0aa">申请原因</span><span>{{ o.reason }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f0f0f0"><span style="color:#9aa0aa">当前状态</span><span>{{ o.state }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #f0f0f0"><span style="color:#9aa0aa">联系人</span><span>{{ o.contact }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0"><span style="color:#9aa0aa">联系电话</span><span>{{ o.phone }}</span></div>
          </div>
        </div>
      </div>
    </div>`
  };

  /* ---------- 订货项目：详情 / 编辑 ---------- */
  const projectOf = id => {
    const p = S.db.find('projects', id) || S.db.all('projects')[0];
    return Object.assign({}, p, S.store.get('c:project:' + p?.id) || {});
  };

  const ProjectDetail = {
    props: ['nav', 'id'],
    setup(props) {
      const p = computed(() => projectOf(props.id));
      const stages = ['已签约', '方案确认', '生产排期', '生产中', '交付安装', '验收完成'];
      const active = computed(() => ({'待排产':2,'排产中':2,'待开工':2,'生产中':3,'生产完成':4,'已出库':5,'已完成':6}[p.value.stage] ?? Math.max(0, stages.indexOf(p.value.stage))));
      const logs = computed(() => [{t:p.value.created,c:'项目创建，归属 '+p.value.owner},...(p.value.history||[])]);
      return { p, stages, active, logs, nav: props.nav, money };
    },
    template: `
    <div class="container">
      <div class="crumb"><a @click="nav('/')">首页</a><span class="sp">/</span><a @click="nav('/project')">订货项目</a><span class="sp">/</span>{{ p.name }}</div>
      <div class="panel2" style="margin-bottom:16px">
        <div class="hd">项目进度<span class="r">
          <el-button size="small" @click="nav('/project-product', 'id='+p.id)">项目产品</el-button><el-button size="small" @click="nav('/project-edit', 'id='+p.id)">编辑项目</el-button></span></div>
        <div style="padding:26px 30px 10px">
          <el-steps :active="active" align-center>
            <el-step v-for="s in stages" :key="s" :title="s" />
          </el-steps>
        </div>
      </div>
      <div class="site-detail-grid" style="display:grid;grid-template-columns:1fr 360px;gap:16px;padding-bottom:60px">
        <div class="panel2">
          <div class="hd">项目信息</div>
          <div style="padding:16px 20px;display:grid;grid-template-columns:1fr 1fr;gap:14px 20px;font-size:13px">
            <div><div style="color:#9aa0aa;font-size:12px">项目名称</div><div style="margin-top:4px">{{ p.name }}</div></div>
            <div><div style="color:#9aa0aa;font-size:12px">客户</div><div style="margin-top:4px">{{ p.customer }}</div></div>
            <div><div style="color:#9aa0aa;font-size:12px">联系人 / 电话</div><div style="margin-top:4px">{{ p.contact }} · {{ p.phone }}</div></div>
            <div><div style="color:#9aa0aa;font-size:12px">房屋信息</div><div style="margin-top:4px">{{ p.room }} · {{ p.area }}</div></div>
            <div style="grid-column:1/-1"><div style="color:#9aa0aa;font-size:12px">项目地址</div><div style="margin-top:4px">{{ p.address }}</div></div>
            <div><div style="color:#9aa0aa;font-size:12px">预计交付</div><div style="margin-top:4px">{{ p.delivery }}</div></div>
            <div><div style="color:#9aa0aa;font-size:12px">合同金额</div><div style="margin-top:4px;color:#d9603a;font-family:var(--font-num)">{{ money(p.amount) }}</div></div>
          </div>
        </div>
        <div class="panel2" style="height:fit-content">
          <div class="hd">项目动态</div>
          <el-timeline style="padding:18px 24px">
            <el-timeline-item v-for="(l,i) in logs" :key="i" :timestamp="l.t">{{ l.c }}</el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </div>`
  };

  const ProjectEdit = {
    props: ['nav', 'id'],
    setup(props) {
      const isNew = !props.id;
      const p = isNew ? { id:S.newId('XM'), no:'', name:'', customer:'', contact:'', phone:'', room:'三居', area:'', address:'', delivery:'', amount:0, owner:'张松涛', created:new Date().toISOString().slice(0,10), stage:'已签约' } : projectOf(props.id);
      p.no = p.no || p.id;
      const f = reactive(Object.assign({}, p));
      const save = () => {
        if (!f.name.trim()) return ElMessage.warning('请填写项目名称');
        if (!f.contact.trim() || !f.address.trim()) return ElMessage.warning('请填写联系人和项目地址');
        if (f.delivery && f.delivery < f.created) return ElMessage.warning('预计交付不能早于项目创建日期');
        if (!/^1[3-9]\d{9}$/.test(String(f.phone))) return ElMessage.warning('请填写正确的 11 位手机号');
        S.db.upsert('projects', S.clone(f));
        S.store.set('c:project:' + p.id, S.clone(f));
        ElMessage.success('项目已保存');
        props.nav('/project-detail', 'id=' + p.id);
      };
      return { f, p, save, isNew, nav: props.nav };
    },
    template: `
    <div class="container">
      <div class="crumb"><a @click="nav('/')">首页</a><span class="sp">/</span><a @click="nav('/project')">订货项目</a><span class="sp">/</span>{{ isNew ? '新建项目' : '编辑项目' }}</div>
      <div class="panel2" style="margin-bottom:60px;max-width:820px">
        <div class="hd">{{ isNew ? '新建项目' : '编辑项目' }} · {{ p.no }}</div>
        <div class="form2" style="padding:20px 24px">
          <div class="fi" style="grid-column:1/-1"><label><i>*</i>项目名称</label><el-input v-model="f.name" /></div>
          <div class="fi"><label>客户 / 公司</label><el-input v-model="f.customer" /></div>
          <div class="fi"><label>合同金额</label><el-input-number v-model="f.amount" :min="0" :precision="2" /></div>
          <div class="fi"><label><i>*</i>联系人</label><el-input v-model="f.contact" /></div>
          <div class="fi"><label><i>*</i>联系电话</label><el-input v-model="f.phone" placeholder="11 位手机号" /></div>
          <div class="fi"><label>户型</label><el-select v-model="f.room"><el-option v-for="r in ['两居','三居','四居','复式']" :key="r" :label="r" :value="r" /></el-select></div>
          <div class="fi"><label>面积</label><el-input v-model="f.area" /></div>
          <div class="fi" style="grid-column:1/-1"><label>项目地址</label><el-input v-model="f.address" /></div>
          <div class="fi"><label>预计交付</label><el-date-picker v-model="f.delivery" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" /></div>
          <div class="fi" style="align-items:flex-start"><label>备注</label><el-input v-model="f.remark" type="textarea" :rows="3" /></div>
        </div>
        <div style="padding:0 24px 22px;display:flex;gap:10px">
          <el-button type="primary" @click="save">保存</el-button>
          <el-button @click="isNew ? nav('/project') : nav('/project-detail', 'id='+p.id)">取消</el-button>
        </div>
      </div>
    </div>`
  };

  /* ---------- 根应用 ---------- */
  const ROUTE_NAMES = {
    '/project': '订货项目', '/project-add': '新建订货项目', '/project-detail': '项目详情',
    '/project-product': '项目产品', '/product-records': '成交记录', '/statisticslist': '统计明细',
    '/process-set': '工艺设置', '/together': '组合产品', '/workbench': '工作台',
    '/aftersale-add': '新建售后单', '/project-edit': '编辑项目'
  };

  /* ---------- 登录 ---------- */
  const Login = {
    props: ['nav'],
    setup(props) {
      const f = reactive({ acc: S.demoAuth.account, pwd: '', remember: true });
      const busy=ref(false);
      const submit = async () => {
        if(busy.value)return;
        if (!f.acc || !f.pwd) return ElMessage.warning('请输入账号与密码');
        busy.value=true;
        try{if(!await S.demoAuth.verify(f.acc,f.pwd))return ElMessage.warning('演示账号或密码不正确');setSession({acc:f.acc,name:'张松涛',at:S.now(),remember:f.remember});ElMessage.success('演示登录成功');props.nav('/');}catch(e){ElMessage.error(e.message);}finally{busy.value=false;}
      };
      return { f, submit, busy };
    },
    template: `
    <div class="login-wrap">
      <div class="login-card">
        <div class="lg-hd"><h2>创驰国际 · 客户中心</h2><p>登录后可查看商品、材质与订货单</p></div>
        <el-alert title="本地演示账号：13800000000，初始密码：demo12345。" type="info" :closable="false" style="margin-bottom:18px"/><el-form :model="f" label-position="top">
          <el-form-item label="账号"><el-input v-model="f.acc" placeholder="手机号 / 账号" size="large" /></el-form-item>
          <el-form-item label="密码"><el-input v-model="f.pwd" type="password" show-password placeholder="请输入密码" size="large" @keyup.enter="submit" /></el-form-item>
          <el-checkbox v-model="f.remember">记住登录状态</el-checkbox>
          <el-button type="primary" size="large" style="width:100%;margin-top:16px" @click="submit" :loading="busy">登 录</el-button>
        </el-form>
        <div class="lg-ft"><span @click="nav('/')">先随便看看 →</span></div>
      </div>
    </div>`
  };

  /* ---------- 通用详情（材质 / 风格系列） ---------- */
  const SimpleDetail = {
    props: ['nav', 'kind', 'id'],
    setup(props) {
      const pools = {
        material: M.materials,
        case: M.cases,
        fenglu: M.products.filter((p, i) => i % 3 === 0)
      };
      const list = computed(() => pools[props.kind] || M.products);
      /* 按传入 id 定位实体；找不到时给出空态而不是永远展示第一条 */
      const item = computed(() => props.id ? list.value.find((x) => x.id === props.id) || null : list.value[0] || null);
      const more = computed(() => list.value.filter((x) => x.id !== item.value?.id).slice(0, 4));
      return { item, more, nav: props.nav, money };
    },
    template: `
    <div class="container">
      <el-empty v-if="!item" description="记录不存在或已被删除"><el-button @click="nav('/material')">返回列表</el-button></el-empty><template v-else><div class="crumb"><span @click="nav('/')">首页</span> / <span>{{ item.name }}</span></div>
      <div class="dt-wrap">
        <div class="dt-media"><img :src="item.img" alt=""></div>
        <div class="dt-info">
          <h2>{{ item.name }}</h2>
          <div class="dt-sub">{{ item.sku || item.tag || '系列款' }}</div>
          <div class="dt-price">{{ money(item.price ?? 1280) }}<span>起</span></div>
          <div class="dt-rows">
            <div class="r"><span class="k">材质</span><span class="v">{{ item.material || '科技布 / 高回弹海绵' }}</span></div>
            <div class="r"><span class="k">规格</span><span class="v">{{ item.size || '三人位 2200×950×830mm' }}</span></div>
            <div class="r"><span class="k">交期</span><span class="v">7-15 天（定制款 25 天）</span></div>
            <div class="r"><span class="k">起订</span><span class="v">1 件起订，支持一件代发</span></div>
          </div>
          <div class="dt-acts">
            <el-button type="primary" @click="nav('/order-add')">立即下单</el-button>
            <el-button @click="nav('/product')">继续选品</el-button>
          </div>
        </div>
      </div>
      <div class="sec"><div class="sec-hd"><h3>同类推荐</h3></div>
        <div class="p-grid">
          <div class="p-card" v-for="p in more" :key="p.id" @click="nav('/product-detail','id='+p.id)">
            <div class="p-img"><img :src="p.img" alt=""></div>
            <div class="p-nm">{{ p.name }}</div>
            <div class="p-pr">{{ money(p.price) }}<span>起</span></div>
          </div>
        </div>
      </div></template>
    </div>`
  };

  /* ---------- 数据页 ---------- */
  const StatPage = {
    props: ['nav', 'kind'],
    setup(props) {
      const range=ref('本月');
      const orders=computed(()=>S.db.all('orders').filter(o=>!['草稿','方案(草稿)','已取消','已作废'].includes(o.state)&&(range.value==='全部'||String(o.createdAt).slice(0,7)===S.now().slice(0,7))));
      const rows=computed(()=>{const map=new Map();orders.value.forEach(o=>(o.items||[]).forEach(l=>{const key=l.id||l.name,p=S.db.find('products',l.id),r=map.get(key)||{name:l.name,cat:p?.catName||'自定义产品',qty:0,amount:0};r.qty+=Number(l.qty);r.amount+=Number(l.qty)*Number(l.price||0);map.set(key,r);}));const sum=[...map.values()].reduce((n,r)=>n+r.amount,0);return [...map.values()].map(r=>Object.assign(r,{amount:Math.round(r.amount*100)/100,rate:sum?r.amount/sum:0})).sort((a,b)=>b.amount-a.amount);});
      const kpi=computed(()=>{const sum=orders.value.reduce((n,o)=>n+o.amount,0),days=orders.value.filter(o=>o.delivery).map(o=>Math.max(0,(new Date(o.delivery)-new Date(String(o.createdAt).slice(0,10)))/86400000));return [{label:range.value+'订货额',value:money(sum)},{label:'订货单数',value:orders.value.length,unit:'单'},{label:'成交客户',value:new Set(orders.value.map(o=>o.customerId||o.customer)).size,unit:'家'},{label:'平均约定交期',value:days.length?(days.reduce((n,d)=>n+d,0)/days.length).toFixed(1):'—',unit:'天'}];});
      const exportRows=()=>S.download('产品订货统计.csv',S.csv(['产品名称','分类','订货数量','订货金额','占比'],rows.value.map(r=>[r.name,r.cat,r.qty,r.amount,(r.rate*100).toFixed(2)+'%'])),'text/csv;charset=utf-8');
      return { kpi, rows, range, kind: props.kind, nav: props.nav, money, exportRows };
    },
    template: `
    <div class="container">
      <div class="crumb"><span @click="nav('/')">首页</span> / <span>{{ kind==='standard' ? '标准统计' : '数据统计' }}</span></div>
      <StatCards :items="kpi" :cols="4" />
      <div class="pt-card">
        <div class="pt-hd"><h3>{{ kind==='standard' ? '标准统计明细' : '产品订货统计' }}</h3>
          <span class="r"><el-radio-group v-model="range" size="small"><el-radio-button value="本月">本月</el-radio-button><el-radio-button value="全部">全部</el-radio-button></el-radio-group><el-button size="small" plain @click="exportRows">导出</el-button></span></div>
        <el-table :data="rows" border size="default">
          <el-table-column prop="name" label="产品名称" min-width="220" show-overflow-tooltip />
          <el-table-column prop="cat" label="分类" width="120" />
          <el-table-column prop="qty" label="订货数量" width="110" align="right" />
          <el-table-column label="订货金额" width="130" align="right"><template #default="s"><span>{{ money(s.row.amount) }}</span></template></el-table-column>
          <el-table-column label="占比" width="140"><template #default="s"><el-progress :percentage="Math.round(s.row.rate*100)" :stroke-width="6" /></template></el-table-column>
        </el-table>
      </div>
    </div>`
  };

  /* ---------- schema 驱动的通用业务页（项目/售后/组合产品/工作台等） ---------- */
  const PortalPage = {
    props: ['nav', 'route'],
    setup(props) {
      const S = window.SCHEMA_C || {};
      const spec = Object.assign({}, S[props.route] || {});
      if (!spec.name) spec.name = ROUTE_NAMES[props.route] || '业务页面';
      const confCache = {};
      const conf = () => {
        if (!confCache.c) {
          confCache.c = window.SHARED.buildConf({
            name: spec.name || '业务页面', cols: spec.cols, ops: spec.ops,
            toolbar: spec.toolbar, rowsHint: spec.rowsHint || 10
          }, props.route);
        }
        return confCache.c;
      };
      const isForm = !!(!spec.cols && spec.form);
      return { spec, conf, isForm, nav: props.nav };
    },
    template: `
    <div class="container portal">
      <div class="crumb"><span @click="nav('/')">首页</span> / <span>{{ spec.name || '业务页面' }}</span></div>
      <div class="pt-card">
        <ListPage v-if="!isForm" :conf="conf()" />
        <FormPage v-else :spec="{name: spec.name || '新建', form: spec.form}" />
      </div>
    </div>`
  };

  const app = createApp({
    components: Object.assign({ Home, Product, ProductDetail, Material, CaseList, CaseDetail, About, OrderIndex, OrderAdd, OrderDetail, AfterSale, AfterSaleDetail, ProjectDetail, ProjectEdit, Login, SimpleDetail, StatPage, PortalPage, MaterialDetail: SimpleDetail }, window.SITE_EXTRA || {}),
    setup() {
      /* 解析 #/path?k=v&k2=v2 → { path, q:{...} } */
      const parse = () => {
        const raw = (location.hash || '#/').replace(/^#/, '') || '/';
        const [path, qs] = raw.split('?');
        const q = {};
        (qs || '').split('&').filter(Boolean).forEach((kv) => {
          const i = kv.indexOf('=');
          const k = i >= 0 ? kv.slice(0, i) : kv;
          let v = i >= 0 ? kv.slice(i + 1) : '';
          try { v = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (_) { /* 损坏的外部链接保持可读，不让整页空白 */ }
          q[k] = v;
        });
        /* 兼容旧写法 ?P1002（无键名） */
        if (!q.id && Object.keys(q).length === 1) {
          const only = Object.keys(q)[0];
          if (!/^[a-z]+$/i.test(only) || /^P\d|^SO|^AS/i.test(only)) { q.id = only; delete q[only]; }
        }
        return { path: routes.includes(path) ? path : '/', q };
      };
      const cur = ref(parse());
      const kw = ref('');
      const loc = ref('深圳市'),searchType=ref('产品'),discountOpen=ref(false),discountInput=ref(displayDiscount.value);
      const openDiscount=()=>{discountInput.value=displayDiscount.value;discountOpen.value=true;};
      const saveDiscount=(reset=false)=>{const value=reset?10:Number(discountInput.value);if((!reset&&(discountInput.value===null||discountInput.value===''))||!Number.isFinite(value)||value<0||value>10)return ElMessage.warning('请填写0-10之间的数字');S.store.set('c:displayDiscount',value);displayDiscount.value=value;discountOpen.value=false;ElMessage.success(reset?'已恢复原价':'产品展示折扣已保存');};
      const session = ref(getSession());
      const demo = ref(false);

      window.addEventListener('hashchange', () => { cur.value = parse(); session.value = getSession(); window.scrollTo(0, 0); });
      const nav = (path, param) => {
        if (path === '@admin') return window.open('../admin/index.html#platform', '_blank', 'noopener');
        if (path === '@erp') return window.open('../erp/index.html#/project/index', '_blank', 'noopener');
        let qs = '';
        if (param) qs = param.indexOf('=') >= 0 ? param : 'id=' + param;
        location.hash = '#' + path + (qs ? '?' + qs : '');
        cur.value = parse();
        window.scrollTo(0, 0);
      };
      const logout = () => {
        setSession(null); session.value = null;
        ElMessage.success('已退出登录'); nav('/');
      };

      const navItems = [
        { t: '首页', p: '/' }, { t: '商品', p: '/product' }, { t: '材质', p: '/material' },
        { t: '案例', p: '/case' }, { t: '公司介绍', p: '/about' }, { t: '订货单', p: '@erp' }
      ];
      const isOn = (p) => {
        const cp = cur.value.path;
        if (p === '/') return cp === '/';
        if (p === '/product') return cp.startsWith('/product');
        if (p === '/material') return cp.startsWith('/material');
        if (p === '/case') return cp.startsWith('/case');
        if (p === '/order-index') return cp.startsWith('/order') || cp.startsWith('/aftersale');
        return cp === p;
      };
      const search = () => {
        const k = kw.value.trim();
        if (!k) return ElMessage.warning('请输入名称或编码');
        nav(searchType.value==='材质'?'/material':'/product', 'kw=' + encodeURIComponent(k));
      };
      const MAP = {
        '/': 'Home', '/login': 'Login',
        '/product': 'Product', '/product-detail': 'ProductDetail', '/fenglu-product-detail': 'ProductDetail',
        '/material': 'Material', '/material-detail': 'MaterialDetail',
        '/case': 'CaseList', '/case-detail': 'CaseDetail', '/fenglu-case-detail': 'CaseDetail',
        '/about': 'About',
        '/order-index': 'OrderIndex', '/order-add': 'OrderAdd', '/order-detail': 'OrderDetail',
        '/aftersale': 'AfterSale', '/aftersale-add': 'AfterSaleAdd', '/aftersale-detail': 'AfterSaleDetail',
        '/statistics': 'StatPage', '/statisticsstandard': 'StatPage',
        '/project': 'ProjectList', '/project-add': 'ProjectEdit', '/project-detail': 'ProjectDetail',
        '/project-edit': 'ProjectEdit',
        '/project-product': 'ProjectProducts', '/product-records': 'ProductRecords', '/statisticslist': 'StatisticsDetail',
        '/process-set': 'ProcessSettings', '/together': 'Together', '/workbench': 'Workbench'
      };
      const pageComp = computed(() => MAP[cur.value.path] || 'Home');
      const isHome = computed(() => cur.value.path === '/');
      const missing = computed(() => {
        const id = cur.value.q.id, path = cur.value.path;
        if (!id) return false;
        if (/^\/(order-detail)$/.test(path)) return !findOrder(id);
        if (/^\/(project-detail|project-edit|project-product)$/.test(path)) return !S.db.find('projects',id);
        if (path === '/aftersale-detail') return !S.db.find('aftersales',id);
        if (/product-detail$/.test(path)) return !M.products.find(x => x.id === id);
        if (path === '/material-detail') return !M.materials.find(x => x.id === id);
        if (/case-detail$/.test(path)) return !M.cases.find(x => x.id === id);
        return false;
      });
      return { cur, nav, navItems, isOn, kw, loc, searchType,discountOpen,discountInput,openDiscount,saveDiscount,search, pageComp, isHome, M, LOGO, session, logout, getSession, demo, missing };
    },
    template: `
    <div :class="{'demo-on': demo}">
      <div v-if="!['/together','/statisticslist','/process-set','/workbench'].includes(cur.path)" class="site-header" data-demo="品牌导航 / 搜索 / 城市定位 / 用户菜单">
        <div class="container hd-main">
          <div class="logo-box" @click="nav('/')" style="cursor:pointer"><img src="../assets/img/source-home/logo.jpg" alt="品牌标识"></div>
          <nav class="site-nav">
            <div class="nv" v-for="n in navItems" :key="n.p" :class="{on: isOn(n.p)}" @click="nav(n.p)">{{ n.t }}</div>
            <a class="nv" href="../admin/index.html" target="_blank">管理</a>
          </nav>
          <div class="hd-right">
            <div class="search-box">
              <select class="cat" v-model="searchType" aria-label="搜索类别"><option>产品</option><option>材质</option><option>品牌</option></select>
              <input v-model="kw" placeholder="请输入名称或编码" @keyup.enter="search">
              <button class="btn" type="button" aria-label="搜索" @click="search"><el-icon><Search /></el-icon></button>
            </div>
            <el-dropdown v-if="session" trigger="click" @command="c => c==='logout' ? logout() : c==='discount'?openDiscount():nav(c)">
              <div style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#333;margin-left:14px">
                <el-icon style="font-size:16px;color:#909399"><UserFilled /></el-icon>
                {{ session.name }}
                <el-icon><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="discount">折扣计算器</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <button v-else class="site-login" @click="nav('/login')">登录 / 注册</button>
          </div>
        </div>
      </div>

      <el-result v-if="missing" icon="warning" title="记录不存在或已被删除" sub-title="请返回列表重新选择"><template #extra><el-button @click="nav('/')">返回首页</el-button></template></el-result>
      <Login v-else-if="pageComp==='Login'" :nav="nav" />
      <MaterialDetail v-else-if="pageComp==='MaterialDetail'" :nav="nav" kind="material" :id="cur.q.id || ''" />
      <AfterSaleDetail v-else-if="pageComp==='AfterSaleDetail'" :nav="nav" :id="cur.q.id || ''" />
      <ProjectDetail v-else-if="pageComp==='ProjectDetail'" :nav="nav" :id="cur.q.id || ''" />
      <ProjectProducts v-else-if="pageComp==='ProjectProducts'" :nav="nav" :id="cur.q.id || ''" :key="cur.q.id" />
      <ProjectEdit v-else-if="pageComp==='ProjectEdit'" :nav="nav" :id="cur.q.id || ''" :key="cur.path + (cur.q.id || '')" />
      <StatPage v-else-if="pageComp==='StatPage'" :nav="nav" :kind="cur.path==='/statisticsstandard'?'standard':''" />
      <PortalPage v-else-if="pageComp==='PortalPage'" :nav="nav" :route="cur.path" :key="cur.path" />
      <component v-else :is="pageComp" :nav="nav" :id="cur.q.id || ''" :kw="cur.q.kw || ''" :key="cur.path + (cur.q.id||'') + (cur.q.kw||'')" />

      <el-dialog v-model="discountOpen" title="设置产品展示折扣" width="500px"><el-form label-width="120px"><el-form-item label="产品展示折扣"><el-input-number v-model="discountInput" :min="0" :max="10" :precision="2" placeholder="请输入折扣"/><div class="muted">请填写0-10之间的数字，例如8折，就填写8，95折就填写9.5</div></el-form-item></el-form><template #footer><el-button @click="saveDiscount(true)">恢复原价</el-button><el-button type="primary" @click="saveDiscount(false)">确定</el-button></template></el-dialog>
      <footer v-if="!['/together','/statisticslist','/process-set','/workbench'].includes(cur.path)" class="site-footer source-footer" data-demo="原站公司维护中心页脚">
        <div class="container">深圳市掌狐科技有限公司（掌工厂维护中心）</div>
      </footer>

      <div class="demo-toggle" :class="{on: demo}" @click="demo=!demo"><span class="sw"></span><span>演示模式</span></div>
    </div>`
  });

  Object.entries(ElementPlusIconsVue).forEach(([k, v]) => app.component(k, v));
  app.use(ElementPlus, { locale: window.ElementPlusLocaleZhCn });
  if (window.SHARED && window.SHARED.register) window.SHARED.register(app);
  app.mount('#app');
})();
