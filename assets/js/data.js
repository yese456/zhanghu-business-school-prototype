/* ============================================================
   mock 数据层（确定性随机，保证每次刷新一致）
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 确定性随机 ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let rnd = mulberry32(20260317);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const money = (n) => '¥' + n.toLocaleString('zh-CN');

  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const dateStr = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const d = (offset) => {
    const t = new Date(2026, 9, 18);          // 基准日 2026-10-18
    t.setDate(t.getDate() + offset);
    return dateStr(t.getFullYear(), t.getMonth() + 1, t.getDate());
  };
  const dt = (offset, h, mi) => `${d(offset)} ${pad(h)}:${pad(mi)}:${pad(int(0, 59))}`;

  /* ---------- 商品 ---------- */
  const brands = ['创驰国际', '摩登翡丽', '221'];
  const cats = [
    { key: 'sofa', name: '沙发' }, { key: 'chair', name: '休闲椅' },
    { key: 'dining', name: '餐桌' }, { key: 'coffee', name: '茶几电视柜' },
    { key: 'bed', name: '床头柜' }, { key: 'floor', name: '地板' }
  ];
  const spaces = ['客厅', '书房', '餐厅', '卧室'];
  const styles = ['简约', '复古', '轻奢', '现代'];

  const productSeed = [
    ['简约三人位布艺沙发', 'sofa', 'sofa-4.jpg', 45000, 1, '沙发三人位'],
    ['翡翠绿转角沙发', 'sofa', 'sofa-5.jpg', 38800, 0, '绯红沙发三人位'],
    ['现代双人位布艺沙发', 'sofa', 'hero-4.jpg', 38620, 0, '轻奢沙发科技布款'],
    ['经典绒面沙发', 'sofa', 'scene-2.jpg', 23800, 0, 'KC5810 沙发'],
    ['云朵沙发 · 雾灰', 'sofa', 'sofa-1.jpg', 21600, 1, '云朵沙发 · 奶油白'],
    ['美式高背休闲椅组合', 'chair', 'sofa-3.jpg', 12800, 1, '黑金刚真皮沙发'],
    ['会客区休闲椅', 'chair', 'chair-1.jpg', 1250, 0, '气泡凳'],
    ['橡木餐椅', 'chair', 'chair-2.jpg', 1890, 0, 'DY-237 雪茄椅'],
    ['橙色软包餐椅', 'chair', 'dining-1.jpg', 1670, 1, '大理石餐桌'],
    ['圆形木面餐桌', 'dining', 'scene-1.jpg', 7500, 0, '餐桌 CY001'],
    ['白色宴会餐椅', 'chair', 'dining-3.jpg', 1280, 1, '岩板伸缩餐桌'],
    ['窗边圆形茶几', 'coffee', 'coffee-2.jpg', 1680, 1, '茶几 5555'],
    ['户外长方餐桌', 'dining', 'coffee-3.jpg', 3980, 0, '实木组合茶几'],
    ['原木圆餐桌', 'dining', 'coffee-1.jpg', 4680, 0, '圆形边几 · 白蜡木'],
    ['加大床 CP25001', 'bed', 'bed-1.jpg', 3650, 1],
    ['软包床 · 雾灰', 'bed', 'bed-2.jpg', 9800, 0],
    ['卧室软包床 · 黛绿', 'bed', 'scene-5.jpg', 5600, 1, '实木床架'],
    ['复合地板 · 浅栎木', 'floor', 'mat-wood-1.jpg', 816, 0]
  ];

  const products = productSeed.map((p, i) => {
    const cat = cats.find((c) => c.key === p[1]);
    return {
      id: 'P' + pad(1001 + i, 4),
      sku: 'SKU-' + pad(8800 + i * 7, 4),
      name: p[0], legacyName:p[5]||'',
      cat: cat.key,
      catName: cat.name,
      brand: brands[i % brands.length],
      price: p[3],
      priceFrom: !!p[4],
      img: '../assets/img/' + p[2],
      space: spaces[i % spaces.length],
      style: styles[i % styles.length],
      hot: i % 3 === 0,
      online: i % 7 !== 3,
      stock: int(0, 320),
      unit: '件',
      spec: pick(['2400×950×760mm', '3200×1000×750mm', '1800×900×760mm', 'φ900×420mm', '2200×1800mm']),
      material: pick(['意大利头层牛皮', '科技布', '白蜡木 + 岩板', '棉麻混纺', '实木多层板']),
      createdAt: d(-int(30, 520))
    };
  });

  /* ---------- 材质 ---------- */
  /* 每条材质都有语义匹配的实拍图；图像与名称不符的条目已移除（见 docs/图片清单.csv） */
  const materialSeed = [
    ['头层牛皮 · 焦糖', '皮面', 'A', 'mat-leather-1.jpg', 216],
    ['SC-96 曜石黑皮', '皮面', 'A', 'mat-leather-2.jpg', 168],
    ['提花织纹 · 米白', '布面', 'B', 'mat-fabric-1.jpg', 96],
    ['棉麻 · 云白', '布面', 'C', 'mat-fabric-2.jpg', 88],
    ['雪尼尔 · 深灰', '布面', 'B', 'mat-fabric-3.jpg', 104],
    ['雪花白大理石', '大理石', 'A', 'mat-marble-1.jpg', 380],
    ['拉丝不锈钢', '金属', 'B', 'mat-metal-2.jpg', 150],
    ['浅栎木饰面', '木面', 'B', 'mat-wood-1.jpg', 118]
  ];
  const materials = materialSeed.map((m, i) => ({
    id: 'M' + pad(201 + i, 3),
    code: 'MAT-' + pad(3100 + i * 3, 4),
    name: m[0], cat: m[1], grade: m[2], img: '../assets/img/' + m[3],
    price: m[4], unit: pick(['米', '㎡', '张', 'kg']),
    supplier: pick(['大理事-鸿亿', '真皮-柏翠', '五金-进祥', '布料-华纺', '木业-森源']),
    stock: int(20, 1800),
    status: i % 9 === 5 ? '停用' : '启用'
  }));

  /* ---------- 案例 ---------- */
  const cases = [
    ['深圳湾 1 号 · 平层样板间', 'scene-1.jpg', '深圳', '住宅样板间', 268],
    ['杭州西溪悦榕 · 会所', 'scene-2.jpg', '杭州', '会所', 1240],
    ['上海前滩 · 售楼处', 'scene-3.jpg', '上海', '售楼处', 860],
    ['成都麓湖 · 别墅软装', 'scene-4.jpg', '成都', '私宅', 520],
    ['北京朝阳 · 主卧软装', 'scene-5.jpg', '北京', '私宅', 38],
    ['广州琶洲 · 酒店大堂', 'scene-2.jpg', '广州', '酒店', 1600],
    ['南京 · 美学馆展厅', 'scene-3.jpg', '南京', '展厅', 720],
    ['苏州 · 园林民宿', 'hero-3.jpg', '苏州', '民宿', 460],
    ['武汉 · 江景大平层', 'hero-1.jpg', '武汉', '私宅', 310]
  ].map((c, i) => ({
    id: 'C' + pad(301 + i, 3), title: c[0], img: '../assets/img/' + c[1],
    city: c[2], type: c[3], area: c[4], year: 2023 + (i % 4),
    designer: pick(['林一舟', '陈斯羽', '周予安', '何墨']),
    views: int(320, 4800)
  }));

  /* ---------- 客户 ---------- */
  const surname = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '吴', '周', '徐', '孙', '马', '朱', '胡', '林'];
  const given = ['松涛', '静怡', '文山', '晓峰', '婉如', '子墨', '嘉禾', '明月', '书航', '亦然', '清和', '若初'];
  const regions = ['广东 · 深圳', '广东 · 广州', '浙江 · 杭州', '上海 · 浦东', '江苏 · 南京', '四川 · 成都', '北京 · 朝阳', '湖北 · 武汉'];
  const levels = ['战略客户', '重点客户', '普通客户', '潜在客户'];

  const customers = Array.from({ length: 26 }, (_, i) => {
    const name = surname[i % surname.length] + given[(i * 5) % given.length];
    return {
      id: 'CU' + pad(5001 + i, 4),
      name,
      contact: name,
      company: pick(['张姐定制', '文山别墅项目', '美汇美家', '华南龙脊', '简家家居', '合舍空间', '木言软装', '拾光设计']) + (i % 3 === 0 ? '（个体）' : '有限公司'),
      phone: '1' + pick(['38', '39', '58', '86', '77']) + pad(int(1000, 9999), 4) + pad(int(1000, 9999), 4),
      level: levels[i % levels.length],
      region: regions[i % regions.length],
      owner: pick(['张松涛', '袁彩怡', '黎明Leon', '曾燕然', '李婉如']),
      tags: [pick(['高意向', '已成交', '待跟进', '价格敏感']), pick(['沙发', '全屋定制', '工程单'])],
      orders: int(0, 18),
      amount: int(0, 86) * 1000,
      followAt: d(-int(0, 40)),
      createdAt: d(-int(30, 700)),
      source: pick(['小程序名片', '官网表单', '门店扫码', '转介绍', '线下展会'])
    };
  });

  /* ---------- 供应商 ---------- */
  const suppliers = [
    ['大理事-鸿亿', 'GYS-01', '大理石', '王鸿亿', '13802938471', 'A'],
    ['真皮-柏翠', 'GYS-08', '皮面', '柏翠', '13911203847', 'A'],
    ['真皮-DM', 'GYS-05', '皮面', 'D.M.', '13720394856', 'B'],
    ['五金-进祥', 'GYS-06', '金属', '李进祥', '13602938475', 'B'],
    ['布料-华纺', 'GYS-03', '布面', '陈华', '13510293847', 'A'],
    ['木业-森源', 'GYS-12', '木面', '周森', '13402938471', 'B'],
    ['海绵-瑞丰', 'GYS-15', '海绵', '吴瑞', '13302938472', 'C'],
    ['油漆-立邦工装', 'GYS-21', '油漆', '刘立', '13202938473', 'B']
  ].map((s, i) => ({
    id: 'S' + pad(101 + i, 3), name: s[0], code: s[1], cat: s[2], contact: s[3],
    phone: s[4], level: s[5], orders: int(6, 120), amount: int(20, 380) * 1000,
    status: i === 7 ? '停用' : '合作中', updatedAt: d(-int(1, 60))
  }));

  /* ---------- 员工 ---------- */
  const employees = [
    ['张松涛', '销售部', '销售总监'], ['袁彩怡', '财务部', '财务主管'],
    ['黎明Leon', '财务部', '出纳'], ['曾燕然', '销售部', '大客户经理'],
    ['李婉如', '设计部', '主案设计'], ['陈子墨', '生产部', '生产计划'],
    ['周予安', '生产部', '车间主管'], ['何墨', '品质部', '品检'],
    ['林一舟', '设计部', '深化设计'], ['吴明月', '客服部', '客服专员'],
    ['徐书航', '仓储部', '仓管'], ['孙亦然', '采购部', '采购经理']
  ].map((e, i) => ({
    id: 'E' + pad(11 + i, 3), name: e[0], dept: e[1], role: e[2],
    phone: '1' + pick(['38', '39', '58']) + pad(int(1000, 9999), 4) + pad(int(1000, 9999), 4),
    status: i === 10 ? '离职' : '在职', joinedAt: d(-int(120, 1500)),
    orders: int(0, 60), amount: int(0, 420) * 1000,
    avatar: e[0].slice(0, 1)
  }));

  /* ---------- 订货单 ---------- */
  const produceStatuses = ['待排产', '排产中', '待开工', '生产中', '生产完成', '已出库', '已作废'];
  const payStatuses = ['部分回款', '待回款', '全部回款', '未收款'];
  const channels = ['小程序', '门店', '官网', '业务员代客下单', '工程单'];

  const orders = Array.from({ length: 46 }, (_, i) => {
    const cu = customers[i % customers.length];
    const prodCount = int(1, 6);
    const amount = prodCount * int(1200, 26000);
    const paid = i % 5 === 0 ? 0 : Math.round(amount * pick([0.3, 0.5, 1]));
    const st = produceStatuses[i % produceStatuses.length];
    return {
      id: 'O' + pad(1001 + i, 4),
      no: 'S2606' + pad(2300 + i * 3, 4),
      innerNo: i % 4 === 0 ? '' : 'IN' + pad(88100 + i * 11, 5),
      customer: cu.company,
      customerName: cu.name,
      customerId: cu.id,
      products: prodCount,
      productName: products[i % products.length].name,
      productImg: products[i % products.length].img,
      amount,
      paid,
      unpaid: amount - paid,
      delivery: d(int(-24, 46)),
      produceStatus: st,
      payStatus: paid === 0 ? '未收款' : (paid === amount ? '全部回款' : '部分回款'),
      channel: channels[i % channels.length],
      owner: pick(['张松涛', '曾燕然', '袁彩怡', '张姐']),
      partner: pick(['-', 'jsz-002(经销商)', '创驰国际', '摩登翡丽']),
      createdAt: dt(-int(1, 120), int(9, 19), int(0, 59)),
      remainDays: int(-16, 42),
      tasks: prodCount,
      purchaseCount: int(0, 3),
      delay: i % 7 === 1,
      remark: i % 6 === 0 ? '客户要求 10 月 20 日前送达现场，需加急排产。' : ''
    };
  });

  /* ---------- 生产任务（货盘中心） ---------- */
  const processes = ['木工部', '油漆部', '软包部', '组装部', '包装部', '品检'];
  const tasks = Array.from({ length: 40 }, (_, i) => {
    const o = orders[i % orders.length];
    const p = products[i % products.length];
    return {
      id: 'T' + pad(8001 + i, 4),
      taskNo: '2507' + pad(703 - i, 4) + '-' + int(1, 6),
      product: p.name,
      productImg: p.img,
      qty: int(1, 12),
      process: processes[i % processes.length],
      processState: pick(['逾期未开工', '进行中', '已完成', '待开工']),
      startDate: d(-int(1, 30)),
      endDate: i % 3 === 0 ? '' : d(-int(0, 12)),
      orderNo: o.no,
      innerNo: o.innerNo,
      partner: o.partner,
      owner: o.owner,
      material: pick(['已备料', '待采购', '部分到货']),
      custom: i % 5 === 0,
      status: produceStatuses[i % produceStatuses.length]
    };
  });

  /* ---------- 交货单 ---------- */
  const deliveries = Array.from({ length: 22 }, (_, i) => {
    const o = orders[(i * 3) % orders.length];
    return {
      id: 'D' + pad(4001 + i, 4),
      no: 'JH2606' + pad(1200 + i * 7, 4),
      orderNo: o.no,
      customer: o.customer,
      qty: int(1, 8),
      amount: int(2, 40) * 1000,
      address: pick(['深圳市南山区科技园', '广州市天河区珠江新城', '杭州市西湖区文三路', '上海市浦东新区前滩']),
      receiver: o.customerName,
      phone: '1380293' + pad(int(1000, 9999), 4),
      deliverDate: d(int(-20, 20)),
      state: i % 4 === 0 ? '待发货' : (i % 4 === 1 ? '已发货' : (i % 4 === 2 ? '已签收' : '部分发货')),
      logistics: pick(['顺丰大件', '德邦物流', '安能物流', '专线配送']),
      trackingNo: 'SF' + pad(int(100000, 999999), 6) + pad(int(1000, 9999), 4)
    };
  });

  /* ---------- 付款单 ---------- */
  const payments = Array.from({ length: 30 }, (_, i) => {
    const s = suppliers[i % suppliers.length];
    const amount = [7638.17, 77782.4, 50, 25, 9854.8, 6700, 13000, 18000, 24000, 9600][i % 10];
    return {
      id: 'PAY' + pad(6001 + i, 4),
      no: 'FKD2606' + pad(9200 + i * 13, 4),
      supplier: s.name,
      supplierCode: s.code,
      amount,
      auditState: i % 5 === 0 ? '待审核' : (i % 9 === 4 ? '已驳回' : '已审核'),
      payState: i % 3 === 0 ? '待付款' : '已付款',
      applicant: pick(['张松涛', '袁彩怡', '黎明Leon', '曾燕然']),
      auditor: pick(['袁彩怡', '黎明Leon', '']),
      payer: pick(['袁彩怡', '曾燕然', '']),
      createdAt: d(-int(1, 110)),
      auditAt: i % 5 === 0 ? '' : d(-int(0, 100)),
      innerNo: 'IN' + pad(88100 + i * 9, 5),
      purchaseNo: 'CG' + pad(7000 + i, 4)
    };
  });

  /* ---------- 采购 ---------- */
  const purchases = Array.from({ length: 26 }, (_, i) => {
    const s = suppliers[i % suppliers.length];
    return {
      id: 'PU' + pad(7001 + i, 4),
      no: 'CG2606' + pad(4400 + i * 9, 4),
      type: pick(['成品采购', '物料采购', '委外工艺']),
      supplier: s.name,
      material: materials[i % materials.length].name,
      qty: int(2, 400),
      unit: pick(['米', '㎡', '件', 'kg']),
      amount: int(3, 90) * 1000,
      arrival: d(int(-10, 30)),
      state: pick(['待确认', '已下单', '部分到货', '已入库']),
      buyer: pick(['孙亦然', '陈子墨']),
      orderNo: orders[i % orders.length].no
    };
  });

  /* ---------- 库存 ---------- */
  const stockRows = Array.from({ length: 24 }, (_, i) => {
    const m = materials[i % materials.length];
    return {
      id: 'ST' + pad(9001 + i, 4),
      code: m.code,
      name: m.name,
      cat: m.cat,
      warehouse: pick(['一号仓', '二号仓', '三号仓', '车间暂存区']),
      location: pick(['A', 'B', 'C', 'D']) + '-' + pad(int(1, 24)) + '-' + pad(int(1, 6)),
      qty: int(0, 2400),
      unit: m.unit,
      safeQty: int(50, 400),
      amount: int(2, 180) * 1000,
      updatedAt: dt(-int(0, 20), int(8, 18), int(0, 59))
    };
  });

  /* ---------- 计件工资 ---------- */
  const wages = Array.from({ length: 20 }, (_, i) => {
    const e = employees[i % employees.length];
    return {
      id: 'W' + pad(3001 + i, 4),
      employee: e.name,
      dept: e.dept === '生产部' ? '生产部' : pick(['软包车间', '木工车间', '油漆车间']),
      process: processes[i % processes.length],
      qty: int(20, 480),
      unitPrice: pick([3.5, 6, 8.2, 12, 15]),
      amount: 0,
      month: '2026-09',
      state: i % 8 === 0 ? '待确认' : '已结算',
      auditor: '周予安'
    };
  }).map((w) => ({ ...w, amount: +(w.qty * w.unitPrice).toFixed(2) }));

  /* ---------- 提成 ---------- */
  const commissions = employees.slice(0, 8).map((e, i) => ({
    id: 'CM' + pad(101 + i, 3),
    employee: e.name,
    dept: '销售部',
    orders: int(2, 28),
    amount: int(20, 460) * 1000,
    rate: pick([0.01, 0.015, 0.02, 0.03]),
    commission: 0,
    month: '2026-09',
    state: i % 4 === 0 ? '待发放' : '已发放'
  })).map((c) => ({ ...c, commission: Math.round(c.amount * c.rate) }));

  /* ---------- 通知 ---------- */
  const notices = [
    ['订货单修改金额', '云顶会所-S26080217 的应收金额、实收金额、商品总价已修改，当前总金额：60,000 元，请知悉。', '08-04 11:15:01'],
    ['订货单产品信息修改', '云顶会所-S26080217 中「摩登翡丽 · 头层黄牛皮三人位」产品信息已更新。', '08-04 11:14:33'],
    ['订货单修改金额', '张姐定制-S26060409的应收金额,实收金额,商品总价已修改。', '08-04 11:05:14'],
    ['订货单修改金额', 'S26071413的应收金额,实收金额,商品总价已修改，当前总金额：12800元。', '07-23 15:53:21'],
    ['订货单修改金额', '多单位换算-2-S26070709的应收金额,实收金额,商品总价已修改。', '07-08 14:25:51'],
    ['新客户提交订货单', '客户「深圳湾壹号设计工作室」提交订货单 S26073012，请及时跟进。', '07-08 09:12:04'],
    ['交货单即将逾期', '交货单 JH26061204 距交期不足 48 小时，尚未发货。', '07-07 17:40:22'],
    ['付款单待审核', '付款单 FKD26069201 提交审核，金额 ¥7,638.17。', '07-07 10:02:11']
  ].map((n, i) => ({ id: 900 + i, title: n[0], content: n[1], time: n[2], read: i > 3 }));

  /* ---------- 首页 KPI ---------- */
  const kpi = {
    staff: 77, staffSub: '人',
    marketingAccounts: 66, marketingTotal: 5000,
    orderAccounts: 6, orderTotal: '不限',
    produceAccounts: 6, produceTotal: '不限',
    usedDays: Math.floor((new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate())-new Date(2025,2,17))/86400000), usedDate: '2025-03-17(开通)',
    leftDays: Math.max(0,Math.ceil((new Date(2028,2,17)-new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()))/86400000)), leftDate: '2028-03-17(截止)',
    customers: 174, deals: 4
  };

  const traffic = {
    today: { customers: 1, follow: 0, views: 2, forward: 0, saved: 0, likes: 0 },
    yesterday: { customers: 0, follow: 1, views: 5, forward: 1, saved: 0, likes: 1 },
    week: { customers: 3, follow: 2, views: 12, forward: 2, saved: 1, likes: 2 },
    month: { customers: 7, follow: 6, views: 38, forward: 4, saved: 2, likes: 5 },
    thisWeek: { customers: 2, follow: 3, views: 16, forward: 3, saved: 1, likes: 3 }
  };

  const quickActions = [
    { key: 'post', name: '发布企业动态', icon: 'Promotion' },
    { key: 'product', name: '公司产品管理', icon: 'Files' },
    { key: 'site', name: '官网编辑', icon: 'Monitor' },
    { key: 'staff', name: '新增员工', icon: 'UserFilled' },
    { key: 'role', name: '权限管理', icon: 'Lock' },
    { key: 'customer', name: '客户管理', icon: 'Avatar' }
  ];

  /* ---------- 系统 A 菜单（25 章节 / 110 项） ---------- */
  const adminMenu = [
    { title: '首页', icon: 'HomeFilled', items: [{ key: 'platform', name: '首页', icon: 'Monitor' }] },
    { title: '工作台', icon: 'Odometer', items: [{ key: 'workbenchWeb', name: '工作台', icon: 'DataBoard' }] },
    { title: '官网管理', icon: 'Monitor', items: [
      { key: 'eprTopic', name: '栏目管理' }, { key: 'eprProfile', name: '公司简介' },
      { key: 'eprInformation', name: '企业资讯' }, { key: 'eprVideo', name: '企业宣传片' },
      { key: 'eprHonor', name: '企业荣誉' }, { key: 'eprContact', name: '联系我们' },
      { key: 'eprPropaganda', name: '企业宣传册' }, { key: 'eprFile', name: '资料夹' },
      { key: 'clientCase', name: '客户案例' }, { key: 'manageTeam', name: '管理团队' },
      { key: 'eprPartner', name: '合作伙伴' }] },
    { title: '订货单', icon: 'Tickets', items: [
      { key: 'project', name: '订货单管理' }, { key: 'material', name: '材质管理' },
      { key: 'supplier', name: '供应商管理' }, { key: 'projectSet', name: '订货单设置' }] },
    { title: '商城管理', icon: 'ShoppingCart', items: [
      { key: 'shopDeco', name: '商城装修' }, { key: 'productOrder', name: '订单管理' },
      { key: 'refundForm', name: '退款管理' }, { key: 'productService', name: '服务单管理' },
      { key: 'scheme', name: '选货录单' }, { key: 'eprProduct', name: '商品管理' },
      { key: 'storeProduct', name: '门店商品' }, { key: 'sceneLibrary', name: '场景库' },
      { key: 'productAttribute', name: '商品属性' }, { key: 'marketLabel', name: '营销标签' },
      { key: 'serviceDiscount', name: '服务/优惠' }, { key: 'vipShopSet', name: '商城设置' },
      { key: 'unit', name: '计量单位管理' }] },
    { title: '社区', icon: 'ChatDotRound', items: [
      { key: 'postAudit', name: '内容审核' }, { key: 'postComment', name: '评论审核' },
      { key: 'postManage', name: '内容管理' }, { key: 'postSort', name: '分类管理' },
      { key: 'forumTopic', name: '话题管理' }, { key: 'forumUser', name: '用户管理' },
      { key: 'forumSet', name: '社区设置' }, { key: 'forumWord', name: '敏感词' }] },
    { title: '门店管理', icon: 'OfficeBuilding', items: [{ key: 'eprStore', name: '门店管理', icon: 'OfficeBuilding' }] },
    { title: '营销管理', icon: 'Present', items: [
      { key: 'speechcraftManage', name: '话术' }, { key: 'printCardCode', name: '印刷名片码' },
      { key: 'eprform', name: '表单管理' }, { key: 'groupActive', name: '拼团管理' },
      { key: 'seckill', name: '秒杀管理' }, { key: 'promosale', name: '满减/送' },
      { key: 'markup', name: '加价购' }, { key: 'ticket', name: '优惠券' },
      { key: 'promotion', name: '推广员' }, { key: 'marketForm', name: '营销表单' },
      { key: 'marketPoster', name: '营销海报' }, { key: 'vrcase', name: 'VR案例' },
      { key: 'electronAlbum', name: '电子画册' }, { key: 'survey', name: '互动问卷' },
      { key: 'lottery', name: '抽奖活动' }, { key: 'giftTicket', name: '礼品卡' },
      { key: 'productRecommend', name: '商品关联推荐' }, { key: 'recommendWord', name: '搜索推荐词' },
      { key: 'advertisement', name: '弹窗广告' }, { key: 'crowdfund', name: '众筹' },
      { key: 'wechatChannel', name: '视频号' }, { key: 'assist', name: '助力活动' }] },
    { title: '任务中心', icon: 'List', items: [{ key: 'work', name: '任务' }] },
    { title: '积分商城', icon: 'GoldMedal', items: [
      { key: 'pointsProductOrder', name: '积分商品订单' }, { key: 'pointsSale', name: '退换货管理' },
      { key: 'pointsQuery', name: '客户积分明细' }, { key: 'pointsProduct', name: '礼品管理' },
      { key: 'pointsProductSort', name: '礼品分类' }, { key: 'pointsTaskSet', name: '任务设置' },
      { key: 'signSetting', name: '签到设置' }, { key: 'pointsSetting', name: '积分商城设置' }] },
    { title: '客户管理', icon: 'User', items: [
      { key: 'clueCustomer', name: '未甄别身份访客' }, { key: 'customer', name: '客户管理' },
      { key: 'lable', name: '客户标签' }, { key: 'vipSet', name: '会员体系' },
      { key: 'highSeasCustomer', name: '客户公海管理' }] },
    { title: 'AI分析', icon: 'TrendCharts', items: [
      { key: 'interactAnalyse', name: '互动分析' }, { key: 'customerAnalysis', name: '客户洞察' },
      { key: 'productStatis', name: '商品报表' }, { key: 'ccStatist', name: '素材统计' }] },
    { title: '营销短信', icon: 'Message', items: [
      { key: 'marketSms', name: '营销短信' }, { key: 'sendRecord', name: '发送记录' },
      { key: 'rechargeRecord', name: '账户余额' }] },
    { title: '公司管理', icon: 'Management', items: [
      { key: 'employeeInfo', name: '组织架构管理' }, { key: 'quitHandover', name: '离职交接' }] },
    { title: '直播管理', icon: 'VideoCamera', items: [
      { key: 'eprliveinfo', name: '直播管理' }, { key: 'liveSort', name: '分类管理' }] },
    { title: '商学院', icon: 'Reading', items: [
      { key: 'bsCourse', name: '课程管理' }, { key: 'learnRecord', name: '学习记录' },
      { key: 'bsSort', name: '课程分类' }, { key: 'bsRecommend', name: '推荐位管理' }, { key: 'bsSet', name: '学院设置' }] },
    { title: '办会易', icon: 'Calendar', items: [{ key: 'expo', name: '活动管理' }] },
    { title: '小程序设置', icon: 'Setting', items: [
      { key: 'programSet', name: '小程序配置' }, { key: 'ossStorage', name: '云服务' },
      { key: 'businessCard', name: '默认名片' }, { key: 'cardNumber', name: '名片显示数值' },
      { key: 'cardSet', name: '名片设置' }, { key: 'templateMsg', name: '模板消息' },
      { key: 'eprServiceOrder', name: '订购记录' }] },
    { title: '内容中心', icon: 'Document', items: [
      { key: 'ccVideo', name: '视频' }, { key: 'ccArticle', name: '文章' }] },
    { title: '案例中心', icon: 'Picture', items: [
      { key: 'designHead', name: '总部案例' }, { key: 'designStore', name: '门店案例' },
      { key: 'designCustomer', name: '客户案例' }, { key: 'designLabel', name: '案例标签' },
      { key: 'designComment', name: '评论' }, { key: 'designSet', name: '案例设置' }] },
    { title: '工单管理', icon: 'Service', items: [
      { key: 'workorder', name: '工单' }, { key: 'workorderStatis', name: '工单统计' },
      { key: 'workorderEvaluate', name: '工单评价' }] },
    { title: '系统管理', icon: 'Tools', items: [
      { key: 'userInfo', name: '系统管理员' }, { key: 'roleManage', name: '角色管理' },
      { key: 'companyInfo', name: '公司信息' }, { key: 'settlementAccount', name: '结算账户' }] },
    { title: '业绩奖励', icon: 'Trophy', items: [{ key: 'incentive', name: '销售奖励' }] },
    { title: '抽奖活动', icon: 'Present', items: [
      { key: 'activityLottery', name: '抽奖活动', icon: 'Present' },
      { key: 'myInfo', name: '个人信息', icon: 'User' }] }
  ];

  /* ---------- 系统 B 菜单 ---------- */
  const erpMenu = [
    { key: 'lucky/list', name: '抽奖活动', icon: 'Present' },
    { key: 'workbench/index', name: '工作台', icon: 'Odometer' },
    { key: 'project/index', name: '订货单管理', icon: 'Tickets' },
    { key: 'deliver/index', name: '交货单', icon: 'Van' },
    { key: 'perfect/center', name: '货盘中心', icon: 'Box' },
    { key: 'purchase/other', name: '采购列表', icon: 'ShoppingCart' },
    { key: 'purchase/caigou', name: '采购列表', icon: 'ShoppingCart', indent: true },
    { key: 'reconciliation/index', name: '付款管理', icon: 'Money' },
    { key: 'inventory/inquiry', name: '仓库中心', icon: 'Files' },
    { key: 'printCenter/index', name: '打印中心', icon: 'Printer' },
    { key: 'wage/piece', name: '计件工资表', icon: 'Coin' },
    { key: 'productionTracking/index', name: '生产进度看板', icon: 'DataLine' },
    { key: 'commission/statistic', name: '员工提成统计', icon: 'UserFilled' },
    { key: 'statistics/board', name: '数据看板', icon: 'PieChart' },
    { key: 'project/modifylog', name: '改单记录', icon: 'EditPen', indent: true },
    { key: 'editApply/list', name: '改单管理', icon: 'Edit', indent: true },
    { key: 'bom/product', name: '生产数据维护中心', icon: 'SetUp', indent: true },
    { key: 'purchase/supplier', name: '供应商管理', icon: 'Shop', indent: true },
    { key: 'settings/index', name: '系统设置', icon: 'Setting', indent: true },
    { key: 'settings/customer', name: '客户管理', icon: 'User', indent: true, external: true },
    { key: 'settings/product', name: '产品管理', icon: 'Goods', indent: true, external: true },
    { key: 'settings/manage', name: '管理设置', icon: 'Tools', indent: true, external: true },
    { key: 'refund/index', name: '退款管理', icon: 'RefreshLeft', indent: true, external: true }
  ];

  const siteCats = [
    { name: '沙发', img: '../assets/img/sofa-2.jpg' }, { name: '休闲椅', img: '../assets/img/chair-1.jpg' },
    { name: '餐椅', img: '../assets/img/dining-3.jpg' }, { name: '餐桌', img: '../assets/img/dining-1.jpg' },
    { name: '茶几电视柜', img: '../assets/img/coffee-1.jpg' }, { name: '床头柜', img: '../assets/img/bed-1.jpg' },
    { name: '产品中心', img: '../assets/img/hero-2.jpg' }, { name: '案例中心', img: '../assets/img/scene-1.jpg' },
    { name: '活动中心', img: '../assets/img/scene-3.jpg' }, { name: '服务中心', img: '../assets/img/scene-5.jpg' },
    { name: '地板', img: '../assets/img/mat-wood-1.jpg' }
  ];

  const company = {
    name: '深圳市掌狐科技有限公司',
    short: '掌狐科技',
    sub: '掌工厂维护中心',
    desc: '掌狐科技是国家高新技术企业、深圳市高新技术企业，公司致力于企业云服务创新，专注研发企业数字化运营工具，帮助企业降低运营成本、提升管理能力及数字化转型，为数万家企业提供智能小程序营销获客、数据管理等技术服务。',
    tags: ['国家高新技术企业', '深圳市高新技术企业', '数万家企业客户'],
    founded: 2016,
    staff: 260,
    address: '深圳市南山区粤海街道科技南十二路 18 号 讯美科技广场 3 栋 12 层',
    phone: '0755-8654 3210',
    email: 'service@91zhanghu.com',
    site: 'www.91zhanghu.com'
  };

  global.MOCK = {
    brands, cats, spaces, styles, products, materials, cases, customers, suppliers,
    employees, orders, tasks, deliveries, payments, purchases, stockRows, wages,
    commissions, notices, kpi, traffic, quickActions, adminMenu, erpMenu, siteCats,
    company, processes, produceStatuses, payStatuses, channels,
    money, d, dt, int, pick
  };
})(window);
