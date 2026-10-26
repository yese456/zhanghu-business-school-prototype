/* ============================================================
   页面工厂 · 由 schema 生成 ListPage 所需的 conf
   - 字段结构来自线上系统采集结果
   - 行数据按字段语义生成，同一页面刷新结果稳定
   ============================================================ */
(function () {
  'use strict';
  const S = window.SHARED;

  const D = {
    person: ['张松涛', '王海涛', '李静', '陈志远', '周慧', '吴敏', '刘洋', '赵磊', '孙倩', '郑伟', '黄丽', '徐强', '张甜', '曾燕然', '袁彩怡', '黎明'],
    company: ['佛山市顺德区欧陆家私', '东莞名匠家居', '广州雅居乐家具', '惠州中信家居', '佛山名匠家居（二厂）', '苏州相城家具城', '北京居然之家（供应商）', '成都锦里家居', '杭州西湖家居馆', '中山大涌红木家具'],
    customer: ['深圳市恒美家居有限公司', '广州雅居乐家具', '东莞名匠家居', '杭州西湖家居馆', '成都锦里家居', '北京居然之家十里河店', '惠州中信家居', '深圳湾壹号软装', '星河WORLD 办公配套', '龙华壹方城样板间'],
    product: ['轻奢科技布沙发三人位', '云朵沙发 · 奶油白', '黑金刚真皮沙发', '大理石餐桌 CY001', '餐椅 CY002 布艺', 'DV-237 雪松椅', 'KC5810 沙发', '气泡凳', '北欧实木双人床', '软包床头柜', '胡桃木电视柜', '岩板茶几组合'],
    city: ['广东省深圳市', '广东省广州市', '广东省东莞市', '浙江省杭州市', '江苏省苏州市', '四川省成都市', '上海市浦东新区', '北京市朝阳区', '湖北省武汉市', '福建省厦门市'],
    channel: ['小程序', '官网', '门店', '销售代下单', '企业微信', '抖音'],
    category: ['客厅家具', '卧室家具', '餐厅家具', '书房家具', '定制柜类', '软装配饰'],
    level: ['A 类客户', 'B 类客户', 'C 类客户', '重点客户', '普通客户'],
    payStatus: ['未回款', '部分回款', '全部回款'],
    produceStatus: ['待排产', '待开工', '生产中', '生产完成', '已出库'],
    commonStatus: ['启用', '停用'],
    auditStatus: ['待审核', '已通过', '已驳回'],
    yesNo: ['是', '否'],
    title: ['2026 春季新品发布会圆满落幕', '如何挑选一张合适的沙发', '客厅这样布置，空间大一倍', '科技布面料的保养技巧', '定制柜的 5 个避坑要点', '轻奢风与奶油风怎么选', '门店导购必看的成交话术', '家居行业 2026 年度趋势'],
    material: ['布料', '真皮', '科技布', '岩板', '实木', '金属'],
    payType: ['银行转账', '微信支付', '支付宝', '现金', '承兑汇票'],
    orderName: ['张甜定制客厅套系', '龙哥-南山科技园样板间', '叶子-招商花园城三居', '南山卓越维港-全屋定制',
      '华侨城纯水岸-主卧套系', '星河WORLD-办公区配套', '深圳湾一号-软装配套', '龙华壹方城-样板间']
  };

  const ORDER_NAME = D.orderName;

  /* 字符串哈希（稳定种子） */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const pad = (n, w) => String(n).padStart(w || 2, '0');

  /* 按列语义生成单元格 */
  function cellValue(label, type, r, i) {
    const l = label || '';
    const catalog=window.MOCK?.products||[], product=catalog[i%catalog.length];
    if(type==='money'||/^(商品总价|产品总价|总价|单价|面价|订货价|优惠金额|订单金额|成交金额|合计金额)([（(].*?[）)])?$/.test(l))return /单价|面价|订货价/.test(l)?(product?.price||1280):Math.round(680+r()*50000);
    const pick = (arr) => arr[Math.floor(r() * arr.length) % arr.length];
    /* 主体类字段按行号轮转：12 行内不出现重名，更接近真实导出数据 */
    const rot = (arr) => arr[i % arr.length];

    if (/图片|封面|照片|头像/.test(l)) return product?.img || '../assets/img/sofa-1.jpg';
    if (/公司名称|企业名称/.test(l)) return rot(D.company);
    if (/网站|网址/.test(l)) return 'https://demo-' + (i + 1) + '.example.com';
    if (l === '名称') return '演示记录 ' + (i + 1);
    /* 人名优先于公司（如“业主姓名”） */
    if (/姓名|联系人|负责人|申请人|审核人|付款人|操作人|收货人|经办人|业务员/.test(l)) return rot(D.person);
    /* 布尔型语义先于公司/产品判断（如“客户可见”不是公司名） */
    if (/可见|是否|开启|启用|推荐|显示/.test(l)) return pick(D.yesNo);
    if (/合作状态/.test(l)) return pick(['合作中', '已暂停', '已终止']);
    if (/结算方式|结算周期/.test(l)) return pick(['月结 30 天', '现结', '预付 30%', '账期 60 天']);
    if (/品类|类别/.test(l)) return pick(D.category);
    /* 单号/编码类先判，避免被“供应商/客户”等词误命中 */
    if (/付款单号|付款编号/.test(l)) return 'FKD2609' + pad(2000 + Math.floor(r() * 7999), 4);
    if (/采购单号|申购单号/.test(l)) return 'CG2609' + pad(3000 + Math.floor(r() * 6999), 4);
    if (/内部单号/.test(l)) return 'NB' + pad(100000 + Math.floor(r() * 899999), 6);
    if (/交货单号/.test(l)) return 'JH2609' + pad(4000 + Math.floor(r() * 5999), 4);
    if (/订单号|订货单号|^订货单$/.test(l)) return 'SO2608' + pad(1000 + Math.floor(r() * 8999), 4);
    if (/订货单编号|订单编号/.test(l)) return 'SO2608' + pad(1000 + Math.floor(r() * 8999), 4);
    if (/售后单编号/.test(l)) return 'SH2609' + pad(1000 + Math.floor(r() * 8999), 4);
    if (/组合产品编号/.test(l)) return 'ZH2609' + pad(100, 3);
    if (/账号|帐号|登录名/.test(l)) return 'su' + pad(1000 + Math.floor(r() * 8999), 4);
    if (/编码|编号/.test(l)) return 'NO' + pad(10000 + Math.floor(r() * 89999), 5);
    if (/单号/.test(l)) return 'SO2608' + pad(1000 + Math.floor(r() * 8999), 4);
    if (/计量单位|^单位$|单位名称/.test(l)) return pick(['件', '套', '个', '米', '平方米', '张']);
    if (/供应商|供货商|采购方/.test(l)) return rot(D.company);
    if (/C端|业主|客户/.test(l)) return rot(D.customer);
    if (/订单归属|合作商|门店|单位/.test(l)) return rot(D.company);
    if (/人$|员$|^销售$|跟单|副销售|负责人|员工|操作员|管理员/.test(l)) return rot(D.person);
    if (/订货单名称|订单名称|售后单名称|项目名称|组合产品名称|名称/.test(l) && /单|订单|项目|组合/.test(l)) return pick(ORDER_NAME);
    if (/产品线|产品名称|产品$|商品|品名/.test(l)) return product?.name || rot(D.product);
    if (/材质/.test(l)) return pick(D.material);
    if (/规格|尺寸/.test(l)) return pick(['2200×950×860', '1800×900×750', '1400×800×760', '1600×900×760', '2000×1000×780']);
    if (/体积/.test(l)) return (0.4 + r() * 1.2).toFixed(2) + ' m³';
    if (/距离交期|距交期|剩余天数/.test(l)) { const dd = Math.floor(r() * 30) - 6; return dd < 0 ? '已逾期 ' + Math.abs(dd) + ' 天' : dd + ' 天'; }
    if (/待交货数|待出货数|待入库数|待收款数/.test(l)) return 1 + Math.floor(r() * 12);
    if (/停留时长/.test(l)) return (1 + Math.floor(r() * 30)) + ' 天 ' + Math.floor(r() * 24) + ' 小时';
    if (/状态/.test(l)) {
      if (/回款|收款|付款/.test(l)) return pick(D.payStatus);
      if (/生产|排产/.test(l)) return pick(D.produceStatus);
      if (/审核|审批/.test(l)) return pick(D.auditStatus);
      if (/推荐/.test(l)) return pick(D.yesNo);
      if (/订货单|订单/.test(l)) return pick(['待排产', '待开工', '生产中', '已入库', '已出库', '已作废']);
      if (/活动/.test(l)) return pick(['进行中', '已结束', '未开始']);
      return pick(D.commonStatus);
    }
    if (/是否|开启|显示|启用/.test(l)) return pick(D.yesNo);
    if (/付款方式|支付方式/.test(l)) return pick(D.payType);
    if (type === 'prod') return '../assets/img/' + ['sofa-1', 'sofa-2', 'sofa-3', 'dining-1', 'bed-1', 'coffee-1'][i % 6] + '.jpg';
    if (/分类|类型/.test(l)) return pick(D.category);
    if (/级别|等级/.test(l)) return pick(D.level);
    if (/渠道|来源|方式/.test(l)) return pick(D.channel);
    if (/手机|电话/.test(l)) return '1' + [3, 5, 7, 8, 9][i % 5] + pad(100000000 + Math.floor(r() * 899999999), 9);
    if (/邮箱/.test(l)) return 'user' + (100 + i) + '@91zhanghu.com';
    if (/地址|地区|城市/.test(l)) return rot(D.city);
    if (/标题|主题|资讯/.test(l)) return pick(D.title);
    if (/任务数|采购单数|件数|人数|次数|数量|库存|浏览|访客|分享|天数|个数|积分|得分|分值/.test(l)) return 1 + Math.floor(r() * 30);
    if (type === 'money' || /金额|价格|费用|单价|合计|余额|佣金|提成|工资/.test(l)) return Math.round(680 + r() * 180000);
    if (type === 'pct') return (5 + r() * 94) / 100;
    if (type === 'progress') return Math.round(5 + r() * 94);
    if (type === 'date' || /时间|日期/.test(l)) {
      const d = '2026-' + pad(1 + Math.floor(r() * 9)) + '-' + pad(1 + Math.floor(r() * 27));
      return /时间|创建|更新/.test(l) ? d + ' ' + pad(Math.floor(r() * 24)) + ':' + pad(Math.floor(r() * 60)) : d;
    }
    if (/简介|描述|备注|说明|内容/.test(l)) return '由门店导购维护，用于官网与小程序展示。';
    if (/排序|序号/.test(l)) return i + 1;
    if (/图标/.test(l)) return '—';
    return /标题|主题|文章|资讯|公告/.test(l) ? pick(D.title) : '—';
  }

  function buildRows(spec, key, n) {
    const cols = spec.cols || [];
    const r = S.mulberry32(hash(key));
    const rows = [];
    for (let i = 0; i < n; i++) {
      const row = { id: key + '-' + i, __i: i };
      cols.forEach((c) => { row[c.label] = cellValue(c.label, c.type, r, i); });
      reconcile(row, cols, r);
      rows.push(row);
    }
    return rows;
  }

  /* ------------------------------------------------------------
     行内业务一致性修正
     线上样例存在「已回款 > 订单金额」「交货早于下单」的矛盾，
     这里按业务规则收敛，保证演示数据可被评审。
     ------------------------------------------------------------ */
  const RE_TOTAL = /订单金额|订货单金额|订货金额|订单总额|总金额|应收金额|商品总价|合同金额|合计金额|订单合计/;
  const RE_PAID = /已回款|回款金额|已付金额|实收金额|已收款|已付款|已结算金额/;
  const RE_ORDER_D = /订货日期|下单日期|订单日期|创建日期|开单日期/;
  const RE_ARRIVE_D = /交货日期|发货日期|交付日期|出库日期|收货日期/;
  const RE_PAY_STATE = /回款状态|收款状态|付款状态|支付状态/;

  function shiftDate(d, days) {
    const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return d;
    const t = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days);
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  }

  function reconcile(row, cols, r) {
    const keys = Object.keys(row);
    const kTotal = keys.find((k) => RE_TOTAL.test(k));
    const kPaid = keys.find((k) => RE_PAID.test(k));
    const kOrder = keys.find((k) => RE_ORDER_D.test(k));
    const kArrive = keys.find((k) => RE_ARRIVE_D.test(k));
    const kState = keys.find((k) => RE_PAY_STATE.test(k));

    const qtyKey=keys.find(k=>/^(数量|订货数量|产品数量)$/.test(k)),priceKey=keys.find(k=>/^(单价|订货价)([（(].*?[）)])?$/.test(k));
    if(qtyKey&&priceKey){
      const amount=Math.round(Number(row[qtyKey])*Number(row[priceKey])*100)/100;
      ['总价','商品总价','产品总价','订货价合计'].forEach(k=>{if(keys.includes(k))row[k]=amount;});
      const discount=keys.includes('优惠金额')?Math.round(amount*.05*100)/100:0;if(keys.includes('优惠金额'))row['优惠金额']=discount;
      ['订单金额','成交金额','应收金额','订货单金额'].forEach(k=>{if(keys.includes(k))row[k]=Math.round((amount-discount)*100)/100;});
    }
    if (kTotal && typeof row[kTotal] === 'number') {
      const total = row[kTotal];
      if (kPaid && typeof row[kPaid] === 'number') {
        const ratio = r();
        const paid = ratio < 0.28 ? 0 : ratio < 0.62 ? Math.round(total * (0.2 + r() * 0.6)) : total;
        row[kPaid] = paid;
        if (kState) row[kState] = paid === 0 ? '未回款' : paid >= total ? '全部回款' : '部分回款';
      }
    }

    /* 材质跟随产品，避免「大理石餐桌 · 金属」这类错配 */
    const kProd = keys.find((k) => /产品名称|商品名称|^产品$|^商品$/.test(k));
    const kMat = keys.find((k) => /材质/.test(k));
    if (kProd && kMat) {
      const p = String(row[kProd] || '');
      if (/大理石|岩板/.test(p)) row[kMat] = '岩板';
      else if (/真皮/.test(p)) row[kMat] = '真皮';
      else if (/科技布/.test(p)) row[kMat] = '科技布';
      else if (/布艺|软包/.test(p)) row[kMat] = '布艺';
      else if (/餐桌|茶几|电视柜|椅|凳|床|柜/.test(p)) row[kMat] = '实木';
    }
    /* 计量单位也跟随产品，避免「沙发 · 米」 */
    const kUnit = keys.find((k) => /^单位$|计量单位/.test(k));
    if (kProd && kUnit) {
      const p2 = String(row[kProd] || '');
      row[kUnit] = /沙发/.test(p2) ? '套' : /餐桌|茶几|床/.test(p2) ? '张' : '件';
    }

    if (kOrder && kArrive) {
      const a = String(row[kOrder]).slice(0, 10);
      const b = String(row[kArrive]).slice(0, 10);
      if (/^\d{4}-/.test(a) && /^\d{4}-/.test(b) && b < a) {
        row[kArrive] = shiftDate(a, 7 + Math.floor(r() * 30));
      }
    }
  }


  const WIDTH = (label, type) => {
    if (type === 'prod') return 236;
    if (type === 'money') return 116;
    if (type === 'num') return 88;
    if (type === 'date') return 144;
    if (type === 'tag') return 100;
    if (/标题|名称|公司|客户|订单归属|产品/.test(label)) return 190;
    if (/地址|链接|内部单号/.test(label)) return 170;
    if (/手机|电话/.test(label)) return 126;
    if (/规格|尺寸/.test(label)) return 152;
    return 120;
  };

  const FILTER_OPTS = (label) => {
    if (/计量单位|^单位$/.test(label)) return [...new Set(['件','套','个','米','平方米','张',...(S.store.get('feature:unit/index')?.rows||[]).map(r=>r.name)])];
    if (/可见|是否|推荐|显示|启用/.test(label)) return ['是', '否'];
    if (/结算方式|结算周期/.test(label)) return ['月结 30 天', '现结', '预付 30%', '账期 60 天'];
    if (/合作状态/.test(label)) return ['合作中', '已暂停', '已终止'];
    if (/状态/.test(label)) return ['待处理', '处理中', '已完成', '已关闭'];
    if (/分类|类型/.test(label)) return D.category;
    if (/级别|等级/.test(label)) return D.level;
    if (/渠道|来源/.test(label)) return D.channel;
    if (/员工|归属|销售|部门/.test(label)) return D.person.slice(0, 8);
    if (/门店|客户|合作商/.test(label)) return D.company.slice(0, 5);
    if (/回款|付款/.test(label)) return D.payStatus;
    return D.commonStatus;
  };

  /* 由真实表头推导新增/编辑表单字段
     关键约定：表单字段 key 直接使用「列字段名」，与行数据同键，
     保证编辑可回填、新增可回显（原实现用 f0/f1 导致全部空值）。 */
  const FORM_SKIP = /^(序号|操作|排序)$|单号|编号|编码|创建时间|更新时间|操作人|最后|状态$|访客|浏览|分享|收藏|点赞|评论|数据|最近一次|添加时间|添加日期|上传时间|上传日期|文件大小/;
  function fieldType(label, colType) {
    if (colType === 'money') return 'number';
    if (colType === 'date') return 'date';
    if (colType === 'tag') return 'select';
    if (colType === 'progress') return 'number';
    if (/状态/.test(label)) return 'select';
    if (/分类|类型|级别|等级|渠道|来源|方式|归属/.test(label)) return 'select';
    if (/计量单位|^单位$/.test(label)) return 'select';
    if (/是否|开启|启用|推荐|显示|可见/.test(label)) return 'select';
    if (/时间|日期/.test(label)) return 'date';
    if (/金额|价格|费用|单价|数量|库存|佣金|提成|工资|天数|件数/.test(label)) return 'number';
    if (/备注|简介|描述|说明|内容|详情|文案/.test(label)) return 'textarea';
    if (/图片|封面|附件|文件|视频|照片/.test(label)) return 'upload';
    return 'input';
  }
  function deriveForm(spec) {
    const cols = (spec.cols || []).filter((c) => c.label && !FORM_SKIP.test(c.label));
    const out = cols.map((c) => {
      const t = fieldType(c.label, c.type);
      const f = {
        key: c.label, label: c.label, type: t,
        required: /名称|标题/.test(c.label),
        span: (t === 'textarea' || t === 'upload') ? 2 : 1
      };
      if (t === 'select') f.opts = FILTER_OPTS(c.label);
      return f;
    });
    /* 字段过少时补一条备注，避免弹窗过空 */
    if (out.length < 4 && !out.some((f) => /备注|描述/.test(f.label))) {
      out.push({ key: '备注', label: '备注', type: 'textarea', span: 2 });
    }
    return out;
  }

  /* 生成 ListPage 配置 */
  S.buildConf = function (spec, key) {
    const n = spec.rowsHint || 12;
    /* spec.rows 用于行数据已按业务口径写死的页面（见 schema-b-extra.js） */
    const rows = (spec.rows && spec.rows.length) ? spec.rows : buildRows(spec, key, n);

    if (key === 'eprPropaganda' && !spec.rows) {
      const titles = ['2026品牌与服务介绍','客厅家具选品手册','卧室空间搭配指南','餐厅家具产品手册','全屋定制工艺介绍','经销合作服务指南'];
      rows.splice(0, rows.length, ...titles.map((title,i)=>({
        id:'eprPropaganda-'+i, __i:i, '宣传册名称':title+'（演示）',
        '分类':['品牌介绍','产品手册','空间搭配','产品手册','工艺介绍','招商资料'][i],
        '文件大小':['2.4 MB','5.8 MB','3.6 MB','4.2 MB','6.1 MB','1.9 MB'][i],
        '访客数':[128,96,72,64,51,0][i], '分享次数':[26,18,12,9,7,0][i],
        '浏览量':[386,241,180,153,126,0][i], '状态':i===5?'停用':'启用',
        '上传日期':'2026-10-'+String(12-i).padStart(2,'0'), '序号':i+1,
        '备注':'合成演示记录：文件大小和访问统计为模拟值，未附真实PDF。'
      })));
    }
    if (key === 'eprContact' && !spec.rows) {
      rows.splice(0, rows.length, ...['总部展厅','深圳体验店','广州服务中心'].map((name,i)=>({
        id:'eprContact-'+i, __i:i, '公司名称':'示例家居 · '+name+'（演示）',
        '联系电话':['0755-0000 1001','0755-0000 1002','020-0000 1003'][i],
        '公司网站':'https://showroom-'+(i+1)+'.example.com',
        '公司地址':['深圳市南山区示例路1号（虚构地址）','深圳市福田区示例路2号（虚构地址）','广州市天河区示例路3号（虚构地址）'][i]
      })));
    }
    if (key === 'eprHonor' && !spec.rows) {
      rows.splice(0, rows.length, ...['产品设计展示','服务品质展示','工艺创新展示'].map((name,i)=>({
        id:'eprHonor-'+i, __i:i, '图片':'../assets/img/honor-demo.svg', '名称':name+'（演示，非真实荣誉）', '序号':i+1
      })));
    }

    const cols = (spec.cols || []).map((c) => {
      const type = /图片|商品图|封面|照片|头像/.test(c.label) ? 'image' : (/^(商品总价|产品总价|总价)$/.test(c.label)?'money':(key==='perfect/center' && c.label==='产品' ? 'prod' : (c.type || 'text')));
      return {
        prop: c.label, label: c.label, width: WIDTH(c.label, type),
        type: type, money: type === 'money', pct: type === 'pct',
        align: (type === 'money' || type === 'num') ? 'right' : 'left',
        ellipsis: !['prod', 'tag', 'progress'].includes(type)
      };
    });

    /* 状态标签：计数由行数据实时统计（在 ListPage 内完成），此处只给标签 */
    const tabs = (spec.tabs || [])
      .filter((t) => t !== '全部')
      .map((t) => ({ label: t, key: t }));

    /* 筛选项 → 行字段映射：优先同名，其次包含关系 */
    const labels = cols.map((c) => c.label);
    const resolveCol = (label) => {
      if (!label) return '';
      if (labels.indexOf(label) >= 0) return label;
      const hit = labels.find((l) => l.indexOf(label) >= 0 || label.indexOf(l) >= 0);
      return hit || label;
    };
    const filters = (spec.filters || []).map((f, i) => ({
      key: 'flt' + i, col: resolveCol(f.key || f.label),
      label: f.label, type: f.type || 'input', ph: f.ph, ph2: f.ph2,
      /* 选项优先取定义里写死的，避免通用词典与业务状态不一致 */
      opts: f.type === 'select' ? (f.opts || FILTER_OPTS(f.label)) : undefined
    }));

    /* 表单字段：优先用线上采集到的表单，其次由真实表头推导 */
    let formFields = null;
    if (spec.dialog && spec.dialog.fields && spec.dialog.fields.length) {
      formFields = spec.dialog.fields.map((f, i) => {
        const label = f.label || '';
        const hit = resolveCol(label);
        const t = f.type || fieldType(label, '');
        return {
          key: labels.indexOf(hit) >= 0 ? hit : label,
          label: label, type: t,
          required: !!f.required,
          span: (t === 'textarea' || t === 'upload' || t === 'richtext') ? 2 : 1,
          opts: t === 'select' ? FILTER_OPTS(label) : undefined
        };
      }).filter((f) => f.label);
    }
    if (!formFields || !formFields.length) formFields = deriveForm(spec);
    if (key === 'eprPropaganda') {
      const category = formFields.find(f=>f.key==='分类');
      if (category) category.opts=['品牌介绍','产品手册','空间搭配','工艺介绍','招商资料'];
    }
    if (!formFields.length) {
      formFields = [
        { key: '名称', label: '名称', required: true, span: 2 },
        { key: '备注', label: '备注', type: 'textarea', span: 2 }
      ];
    }

    return {
      title: spec.name, desc: spec.desc || '',
      storeKey: 'list:' + key, routeKey: key, entityKind: S.db ? S.db.kindFor(key) : '',
      filters: filters, tabs: tabs,
      allLabel: tabs.length ? '全部' : '',
      statusKey: spec.statusKey || '',
      toolbar: { left: (spec.toolbar && spec.toolbar.length ? spec.toolbar : ['新增', '导出']) },
      cols: cols, rows: rows, ops: spec.ops || ['编辑', '删除'],
      form: {
        fields: formFields, title: (spec.dialog && spec.dialog.title) || ('新增' + spec.name),
        width: formFields.length > 8 ? '820px' : '680px'
      },
      tips: spec.tips || null
    };
  };

  /* 供设置型表单页生成合理初值：同一字段每次打开取值一致 */
  S.demoValue = function (label, type, i) {
    const r = S.mulberry32(hash('field:' + (label || '')));
    const t = type === 'textarea' ? 'text' : (type || '');
    const v = cellValue(label || '', t, r, i || 0);
    if (type === 'number') return Number(v) || 0;
    return v;
  };

  S.DICT = D;
})();
