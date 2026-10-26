/* 三系统共用的本地业务实体。相同编号在列表、详情、编辑和打印间保持一致。 */
(function () {
  'use strict';
  const S = window.SHARED, M = window.MOCK;
  const copy = S.clone, round = n => Math.round((Number(n) || 0) * 100) / 100;
  S.now = () => { const d=new Date(),pad=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds()); };
  S.newId = p => (p || 'ID') + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  S.safeText = v => String(v == null ? '' : v);
  S.download = (name, text, type) => {
    const url = URL.createObjectURL(new Blob([text], { type: type || 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  S.csv = (heads, rows) => '\ufeff' + [heads, ...rows].map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  S.parseCsv = text => {
    const rows = []; let row = [], cell = '', quote = false;
    text = text.replace(/^\ufeff/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') { if (quote && text[i + 1] === '"') { cell += '"'; i++; } else quote = !quote; }
      else if (c === ',' && !quote) { row.push(cell); cell = ''; }
      else if ((c === '\n' || c === '\r') && !quote) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); if (row.some(v => v.trim())) rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (quote) throw new Error('CSV 引号未闭合，请检查文件格式');
    row.push(cell); if (row.some(v => v.trim())) rows.push(row); return rows;
  };
  const seedOrders = M.orders.map((o, i) => {
    const p = M.products[i % M.products.length], qty = o.products;
    return Object.assign({}, o, { name: o.customerName + ' · ' + p.name, phone: M.customers[i % M.customers.length].phone,
      address: M.customers[i % M.customers.length].region + ' 家居体验店 2 楼', state: o.produceStatus,
      items: [{ id: p.id, key: p.id, name: p.name, img: p.img, code: p.sku, qty, price: round(o.amount / qty), face: p.price, unit: p.unit, spec: p.spec, mat: p.material }], fees: {} });
  });
  const seed = { version: 3, processCatalog: [], processRoutes: [], products: copy(M.products), customers: copy(M.customers), suppliers: copy(M.suppliers), materials: copy(M.materials), orders: seedOrders, projects: [], aftersales: [], events: [], warehouses: [], inventoryBatches: [], inventoryMovements: [], inventoryCorrections: [], warehousePreferences: [], deliveries:copy(M.deliveries),purchases:copy(M.purchases),payments:copy(M.payments),tasks:copy(M.tasks),inventory:copy(M.stockRows) };
  seed.customers.forEach((c, i) => { c.phone = '138' + String(10000000 + i * 137).slice(-8); c.company = c.company.replace(/（个体）有限公司/, '（个体工商户）'); });
  seed.products.forEach(p => {
    const defs = { sofa: ['套', '2800×1000×850mm', '科技布 / 高回弹海绵'], chair: ['张', '820×850×900mm', '棉麻 / 实木框架'], dining: ['张', '1800×900×750mm', '岩板 / 金属桌脚'], coffee: ['件', '1200×600×420mm', '白蜡木 / 岩板'], bed: ['张', '2200×1800×1100mm', '实木 / 织物软包'], floor: ['㎡', '1215×196×12mm', '实木多层板'] };
    [p.unit, p.spec, p.material] = defs[p.cat] || defs.sofa;
  });
  seed.aftersales = seedOrders.slice(0, 8).map((o, i) => ({ id: 'AS2607' + (100 + i), no: 'AS2607' + (100 + i), order: o.no, type: ['退货', '换货', '维修'][i % 3], reason: ['尺寸不符', '运输磕碰', '面料色差'][i % 3], state: ['处理中', '已完成', '待受理'][i % 3], date: String(o.createdAt||'').slice(0, 10), contact: o.customerName, phone: o.phone, product: o.productName, img: o.productImg, qty: 1, amount: round(o.amount / o.products), files: [] }));
  seed.projects = seedOrders.slice(0, 12).map((o, i) => ({ id: o.no, no: o.no, name: o.name, customer: o.customer, contact: o.customerName, phone: o.phone, address: o.address, amount: o.amount, stage: o.produceStatus, owner: o.owner, created: String(o.createdAt||'').slice(0, 10), delivery: o.delivery, area: (68 + i * 7) + ' ㎡', room: ['三居', '四居', '两居'][i % 3], remark: '' }));
  seed.tasks.forEach(t=>{const o=seed.orders.find(o=>o.no===t.orderNo),l=o?.items[0];if(!l)return;Object.assign(t,{productId:l.id,product:l.name,productImg:l.img,qty:Math.min(t.qty,l.qty),price:l.price,unit:l.unit,material:l.mat,spec:l.spec});if(t.startDate<String(o.createdAt).slice(0,10))t.startDate=String(o.createdAt).slice(0,10);});
  seed.deliveries.forEach(d=>{const o=seed.orders.find(o=>o.no===d.orderNo),l=o?.items[0];if(!l)return;Object.assign(d,{productId:l.id,product:l.name,qty:Math.min(d.qty,l.qty),price:l.price,unit:l.unit,material:l.mat,spec:l.spec,amount:round(Math.min(d.qty,l.qty)*l.price)});if(d.deliverDate<String(o.createdAt).slice(0,10))d.deliverDate=String(o.createdAt).slice(0,10);});
  seed.purchases.forEach((p,i)=>{const m=seed.materials[i%seed.materials.length],o=seed.orders.find(o=>o.no===p.orderNo),l=o?.items[0],material=p.type==='物料采购';Object.assign(p,{productId:material?m.id:l?.id,product:material?m.name:l?.name,unit:material?m.unit:l?.unit,price:material?m.price:l?.price,spec:material?(m.spec||'按样板'):l?.spec,material:material?m.name:l?.mat,cat:p.type});p.amount=round(p.qty*p.price);p.receivedQty=p.state==='已入库'?p.qty:0;});
  const catalogSeed=copy(seed.products);
  const old = S.store.get('entities:v3');
  const state = Vue.reactive(old && old.version === 3 ? Object.assign(seed, old) : seed);
  for(const k of ['warehouseReservations','warehouseShipments','orderProductApplications','orderOutsourceApplications','orderAmendments','orderPurchaseApplications'])if(!Array.isArray(state[k]))state[k]=[];
  if(!Array.isArray(state.warehouseIssues))state.warehouseIssues=[];
  if(!Array.isArray(state.warehouseReceipts))state.warehouseReceipts=[];
  if(!Array.isArray(state.deliveryDocuments))state.deliveryDocuments=copy(S.store.get('b:delivery-docs:v1')||[]);
  state.products.forEach(p=>{const n=catalogSeed.find(n=>n.id===p.id);if(n&&n.legacyName&&p.name===n.legacyName)Object.assign(p,{name:n.name,img:n.img,cat:n.cat,catName:n.catName,unit:n.unit,spec:n.spec,material:n.material,price:n.price});});
  state.orders.forEach(o=>(o.items||[]).forEach(l=>{const n=catalogSeed.find(p=>p.id===l.id);if(n&&n.legacyName&&l.name===n.legacyName)Object.assign(l,{name:n.name,img:n.img,unit:n.unit,spec:n.spec});}));
  state.aftersales.forEach(a=>{const n=catalogSeed.find(p=>p.legacyName===a.product);if(n){a.product=n.name;a.img=n.img;a.productId=n.id;}});
  function normalizeOrder(o) {
    if (!Array.isArray(o.items)) {
      const p=state.products.find(p=>p.id===o.productId||p.name===o.productName||p.name===o.product);
      const qty=Math.max(1,Number(o.products||o.qty)||1);
      o.items=(o.products||o.qty)?[{id:p?.id||S.newId('ITEM'),name:o.productName||o.product||p?.name||'定制产品',img:o.productImg||o.img||p?.img||'',qty,price:round(Number(o.amount||0)/qty),spec:p?.spec||'',unit:p?.unit||'件'}]:[];
    }
    if (!/^1[3-9]\d{9}$/.test(String(o.phone||''))) o.phone=(state.customers.find(c=>c.id===o.customerId||c.company===o.customer)||state.customers[0]||{phone:''}).phone;

    o.items = o.items.map(l => Object.assign({}, state.products.find(p=>p.id===l.id)||{}, l, { qty: Math.max(0, Number(l.qty) || 0), price: l.price===null||l.price==='' ? null : Math.max(0, Number(l.price) || 0) }));
    o.fees = o.fees || {};Object.keys(o.fees).forEach(k=>o.fees[k]=Math.max(0,Number(o.fees[k])||0));
    o.products = o.items.reduce((n, l) => n + l.qty, 0);
    o.productName = o.items.length ? o.items[0].name + (o.items.length > 1 ? ' 等 ' + o.items.length + ' 种' : '') : '待添加商品';
    o.productImg = o.items[0]?.img || '';
    const lineAmounts=o.items.map(l=>l.price===null?null:l.qty*l.price),goods=lineAmounts.reduce((n,v)=>n+(v??0),0);
    const amountKnown=lineAmounts.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0)&&Number.isFinite(goods)&&Number.isFinite(round(goods));
    o.goodsAmount = amountKnown ? round(goods) : null;
    if(amountKnown)o.fees.discount=Math.min(o.goodsAmount,Number(o.fees.discount)||0);
    const total=amountKnown?round(Math.max(0,o.goodsAmount-(Number(o.fees.discount)||0))+['crate','install','tax','commission','design','service','freight'].reduce((n,k)=>n+(Number(o.fees[k])||0),0)):null;
    o.amount = typeof total==='number'&&Number.isFinite(total)?total:null;
    if(o.amount===null){
      // 未报价不等于零金额；不能据未知总额清除既有已收或优惠事实。
      o.paid=typeof o.paid==='number'&&Number.isFinite(o.paid)&&o.paid>=0?o.paid:0;
      o.unpaid=null;o.payStatus='未核实';
    }else{
      o.paid = Math.min(o.amount, Math.max(0, Number(o.paid) || 0)); o.unpaid = round(o.amount - o.paid);
      o.payStatus = !o.paid ? '未回款' : o.unpaid ? '部分回款' : '全部回款';
    }
    o.partnerType=o.partnerType||(['工程单','门店'].includes(o.channel)?(o.channel==='工程单'?'工程单':'直营'):'经销商');o.follower=o.follower||'周慧';o.newSale=o.newSale||'曾燕然';
    o.produceStatus = o.produceStatus || o.state || '待排产'; o.state = o.state || o.produceStatus;if(o.state==='排产中')o.state='待排产';if(o.state==='生产完成')o.state='待入库';
    const created = String(o.createdAt || S.now()).slice(0, 10); if (o.delivery && o.delivery < created) o.delivery = created;
    const createdTime=o.createdAt?new Date(o.createdAt).getTime():NaN,age=Date.now()-createdTime;
    o.duration=Number.isFinite(createdTime)&&age>=0?Math.floor(age/86400000)+' 天':'未核实';
    o.remainDays = o.delivery ? Math.ceil((new Date(o.delivery) - new Date(new Date().toISOString().slice(0, 10))) / 86400000) : null;
    return o;
  }
  state.orders.forEach(normalizeOrder);
  state.customers.forEach((c,i)=>Object.assign(c,{phone:/^1[3-9]\d{9}$/.test(c.phone)?c.phone:'138'+String(10000000+i*137).slice(-8),department:c.department||'家居销售部',points:c.points??(200+i*37),interactions:c.interactions??(3+i%7),followCount:c.followCount??(1+i%4),visitAt:c.visitAt||c.createdAt,assignedAt:c.assignedAt||c.createdAt,customerType:c.customerType||'合作客户',isVisitor:c.isVisitor??0,isPublic:c.isPublic??false}));
  state.products.forEach((p,i)=>Object.assign(p,{store:p.store||'创驰国际旗舰店',sort:p.sort??i+1,display:p.display||'图文展示',createdAt:p.createdAt||'2026-09-01 09:30:00',visits:p.visits??(86+i*23),sales:p.sales??0,liveState:p.liveState||'未开播',hospitalState:'不适用'}));
  ['projects','aftersales'].forEach(k=>state[k].forEach((p,i)=>{if(!/^1[3-9]\d{9}$/.test(p.phone||''))p.phone=(state.orders.find(o=>o.no===(p.order||p.no))||state.customers[i%state.customers.length]).phone;}));

  const mapping = {
    deliveries: {'产品':'product','规格':'spec','材质':'material','订货单':'orderNo','内部单号':'innerNo','待交货数':'qty','合作商':'customer','单位':'unit','C端/业主':'receiver','可用库存':'stock','体积':'volume','包装件数':'packages','订单付款状态':'payStatus','距离交期':'remainDays','交货日期':'deliverDate','订单创建日期':'createdAt','交货单号':'no'},
    purchases: {'产品':'product','规格尺寸':'spec','材料/颜色':'material','产品说明':'description','分类':'cat','数量':'qty','包装件数':'packages','单个体积':'volume','入库数量':'receivedQty','单位':'unit','单价':'price','总价':'amount','产品图纸':'drawing','备注':'remark','计划到货日期':'expected','到货日期':'arrival','供应商':'supplier','采购单':'no','订货单':'orderNo','内部单号':'innerNo','采购员':'buyer','采购状态':'state','付款状态':'payState','发货状态':'shipState','销售':'owner','跟单':'follower','创建人':'creator','创建日期':'createdAt'},
    payments: {'付款单号':'no','供应商名称':'supplier','供应商编码':'supplierCode','付款金额':'amount','审核状态':'auditState','付款状态':'payState','申请人员':'applicant','审核人员':'auditor','付款人员':'payer','创建时间':'createdAt','审核时间':'auditAt','付款时间':'paidAt'},
    tasks: {'状态':'status','产品':'product','任务编号':'taskNo','工序':'process','生产开始时间':'startDate','生产完成时间':'endDate','订货单':'orderNo','内部单号':'innerNo','合作商':'customer','C端/业主':'contact','材料/颜色':'material','规格尺寸':'spec','皮面':'leather','布面':'fabric','大理石':'marble','金属':'metal','油漆':'paint','海绵':'sponge','木面':'wood','五金电镀':'plating','刷油漆':'painting','大理石切割':'cutting','五金加工':'hardware','产品说明':'description','分类':'cat','数量':'qty','产品金额':'amount','单位':'unit','单个包装件数':'singlePackages','单个体积':'volume','排产人员':'planner','计划开始时间':'plannedStart','计划结束时间':'plannedEnd','计划天数':'days','排产时间':'scheduledAt','交货日期':'delivery','订货日期':'orderDate','订单创建日期':'createdAt','包装件数':'packages'},
    inventory: {'名称':'name','编码':'code','规格':'spec','材质':'material','分类':'cat','库存数量':'qty','单位':'unit','货值':'value','库龄':'age','仓库':'warehouse'},
    orders: { '订单号':'no', '订货单号':'no', '订货单编号':'no', '订货单名称':'name', '订单名称':'name', '内部单号':'innerNo', '订单归属(合作商)':'customer', '客户':'customer', '客户名称':'customer', 'C端/业主':'customerName', '产品数量':'products', '数量':'products', '订货单金额':'amount', '订单金额':'amount', '已回款金额':'paid', '已付金额':'paid', '交货日期':'delivery', '生产进度':'produceStatus', '订货单状态':'state', '订单状态':'state', '回款状态':'payStatus', '订货日期':'createdAt', '销售':'owner', '跟单':'follower', '副销售':'newSale', '订货单说明':'remark', '任务数':'tasks', '采购单数':'purchaseCount','停留时长':'duration','开工日期':'startDate','截止日期':'endDate' },
    products: { '商品图':'img', '产品图片':'img', '商品名称':'name', '名称':'name', '产品名称':'name', '产品':'name', '商品分类':'catName', '分类':'catName', '品牌':'brand', '编号':'sku', '产品编号':'sku', '规格尺寸':'spec', '规格':'spec', '材料/颜色':'material', '材质':'material', '库存':'stock', '单价':'price', '面价':'price', '价格':'price', '计量单位':'unit', '创建时间':'createdAt', '上架':'online', '推荐':'hot', '门店':'store','销量':'sales','访问量':'visits','下架时间':'offlineAt','推荐排序':'sort','展示方式':'display','列表排序':'sort','微信直播状态':'liveState','互联网医院同步状态':'hospitalState' },
    customers: { '客户':'company', '客户名称':'company', '公司名称':'company', '联系人':'name', '姓名':'name', '手机号':'phone', '手机号码':'phone', '联系电话':'phone', '会员等级':'level', '客户级别':'level', '来源渠道':'source', '流量来源':'source', '负责人':'owner', '最近跟进时间':'followAt', '创建时间':'createdAt', '所在地区':'region','积分':'points','互动次数':'interactions','跟进次数':'followCount','扫码进店时间':'createdAt','最近访问时间':'visitAt','公司分配时间':'assignedAt','公司跟进时间':'followAt','客户类型':'customerType','所属部门':'department','是否访客':'isVisitor','是否公海':'isPublic' },
    suppliers: { '供应商名称':'name', '供应商编码':'code', '联系人':'contact', '联系电话':'phone', '所在地区':'region', '供货品类':'cat', '结算方式':'settle', '合作状态':'status', '启用':'enabled', '创建时间':'updatedAt', '添加日期':'updatedAt' },
    materials: { '材质':'name', '材质编码':'code', '材质级别':'grade', '材质分类':'cat', '价格':'price', '计量单位':'unit', '供应商':'supplier', '库存':'stock', '客户可见':'visible', '是否使用':'status', '推荐':'hot' },
    projects: { '项目名称':'name', '项目编号':'no', '客户':'customer', '联系人':'contact', '联系电话':'phone', '项目地址':'address', '合同金额':'amount', '项目阶段':'stage', '创建时间':'created' }
  };
  const kinds = { project:'orders', 'project/index':'orders', eprProduct:'products', 'physical/index':'products', customer:'customers', supplier:'suppliers', 'purchase/supplier':'suppliers', material:'materials', '/project':'projects','deliver/index':'deliveries','purchase/other':'purchases','purchase/caigou':'purchases','reconciliation/index':'payments','perfect/center':'tasks','inventory/inquiry':'inventory' };
  const normalizeLinked=(k,e,i)=>{
    const taskQty=e.qty;
    const normalizeTaskMoney=()=>{
      const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
      e.price=valid(e.price)?e.price:null;
      const amount=e.price!==null&&valid(taskQty)&&valid(e.qty)?e.qty*e.price:null;
      const rounded=typeof amount==='number'&&Number.isFinite(amount)?round(amount):null;
      e.amount=typeof rounded==='number'&&Number.isFinite(rounded)?rounded:null;
    };
    // 交货事务拥有的投影不经过旧目录补值；冷载不能制造库存、包装或金额事实。
    if(k==='deliveries'&&typeof e.documentId==='string'&&e.documentId&&typeof e.sourceKey==='string'&&e.sourceKey&&e.id===e.no+':'+e.sourceKey){const docs=Array.isArray(state.deliveryDocuments)?state.deliveryDocuments.filter(d=>d?.id===e.documentId&&d?.no===e.no):[];if(docs.length===1&&Array.isArray(docs[0].items)&&docs[0].items.filter(l=>l?.sourceKey===e.sourceKey).length===1)return e;}
    const o=state.orders.find(x=>x.no===e.orderNo)||{},p=state.products.find(x=>e.productId?x.id===e.productId:(x.name===e.product||x.name===e.name))||state.materials.find(x=>e.productId?x.id===e.productId:(x.name===e.product||x.name===e.name))||{};
    if(k==='inventory'&&e.warehouseManaged)return e;
    if(k==='inventory'){const m=state.materials.find(m=>m.code===e.code||m.name===e.name),item=m||p,qty=Number.isFinite(Number(e.qty))?Number(e.qty):Number(item.stock)||0;Object.assign(e,{name:e.name||item.name,code:e.code||item.code||item.sku,spec:e.spec||item.spec||'按样板',material:m?.name||e.material||item.material,cat:e.cat||item.catName||item.cat,qty,unit:e.unit||item.unit,value:e.value!==null&&e.value!==''&&Number.isFinite(Number(e.value))&&Number(e.value)>=0?Number(e.value):round(qty*(Number(item.price)||0)),age:e.age||'28 天',warehouse:e.warehouse||'成品一仓'});return e;}
    if(k==='payments'){e.amount=Math.max(0,round(e.amount));if(e.auditState!=='已审核')e.payState='待付款';e.auditAt=e.auditState==='待审核'?'':(e.auditAt||e.createdAt);e.paidAt=e.payState==='已付款'?(e.paidAt||e.createdAt):'';return e;}
    if(!o.no||!p.id){e.qty=e.qty==null?1:Math.max(0,Number(e.qty)||0);if(k==='tasks')normalizeTaskMoney();else if(e.price!==null&&e.price!==''&&Number.isFinite(Number(e.price))){e.price=Math.max(0,Number(e.price));e.amount=round(e.price*e.qty);}return e;}
    const updated=catalogSeed.find(x=>x.id===e.productId&&x.legacyName===e.product);if(updated){e.product=updated.name;e.spec=updated.spec;e.material=updated.material;e.cat=updated.catName;}
    e.orderNo=o.no;e.innerNo=o.innerNo;e.customer=o.customer;e.contact=o.customerName;e.createdAt=e.createdAt||o.createdAt;e.productId=e.productId||p.id;e.product=e.product||p.name;e.spec=e.spec||p.spec;e.material=e.material||p.material;e.cat=e.cat||p.catName;e.unit=e.unit||p.unit;
    e.qty=e.qty==null?1:Math.max(0,Number(e.qty)||0);if(k!=='tasks'){e.price=e.price!==null&&e.price!==''&&Number.isFinite(Number(e.price))?Math.max(0,Number(e.price)):Math.max(0,Number(p.price)||0);e.amount=round(e.price*e.qty);}e.stock=p.stock;e.volume=e.volume||'0.85 m³';e.packages=e.packages||Math.ceil(e.qty/2);e.singlePackages=1;e.payStatus=o.payStatus;e.remainDays=o.remainDays==null?'待确认':o.remainDays+' 天';e.owner=e.owner||o.owner;e.follower=e.follower||o.follower||'周慧';e.creator=e.creator||'张松涛';e.description=e.description||p.material+'，按订单确认尺寸制作';e.remark=e.remark||'按确认样板制作';e.delivery=o.delivery;e.orderDate=String(o.createdAt).slice(0,10);
    if(k==='deliveries'){e.qty=Math.min(e.qty,o.products||1);e.amount=round(e.qty*e.price);e.receiver=e.receiver||o.customerName;e.phone=e.phone||o.phone;e.address=e.address||o.address;e.deliverDate=e.deliverDate||o.delivery;}
    if(k==='purchases'){e.expected=e.expected||o.delivery;e.arrival=e.state==='已入库'?(e.arrival||e.expected):'';e.receivedQty=Math.min(Math.max(0,Number(e.receivedQty)||0),e.qty);e.buyer=e.buyer||'孙亦然';e.shipState=e.shipState||(e.receivedQty?'已到货':'待发货');e.payState=e.payState||'待付款';}
    if(k==='tasks'){const candidates=(o.items||[]).filter((l,j)=>e.sourceKey?e.sourceKey===o.no+':'+(l.key||l.id||j):l.id===e.productId);const line=candidates.length===1?candidates[0]:null;if(line&&!e.sourceKey)e.qty=Math.min(e.qty,line.qty);normalizeTaskMoney();e.startDate=e.startDate||e.orderDate;e.endDate=e.status==='生产完成'?(e.endDate||e.delivery):'';e.plannedStart=e.plannedStart||e.startDate;e.plannedEnd=e.plannedEnd||e.delivery;e.days=Math.max(1,Math.ceil((new Date(e.plannedEnd)-new Date(e.plannedStart))/86400000)||7);e.planner=e.planner||'陈子墨';e.scheduledAt=e.scheduledAt||e.orderDate;['leather','fabric','marble','metal','paint','sponge','wood','plating','painting','cutting','hardware'].forEach(key=>{if(!e[key])e[key]=['fabric','sponge','wood'].includes(key)?'按样板确认':'不适用';});}
    return e;
  };
  ['deliveries','purchases','payments','tasks','inventory'].forEach(k=>state[k].forEach((e,i)=>normalizeLinked(k,e,i)));
  const persist = () => { S.store.set('entities:v3', state); window.dispatchEvent(new CustomEvent('aicard:data')); };
  // 保留响应式数组引用；有限块追加，避免大集合写入或回滚超过函数实参数量上限。
  const replaceContents=(target,rows)=>{target.length=0;for(let i=0;i<rows.length;i+=1024)target.push(...rows.slice(i,i+1024));};
  const commit=(k,next)=>{
    const before=copy(state[k]);
    try{replaceContents(state[k],next);persist();}catch(e){replaceContents(state[k],before);window.dispatchEvent(new CustomEvent('aicard:data'));throw e;}
  };
  const db = S.db = {
    state, mapping, kindFor: k => kinds[k] || '', normalizeOrder, persist,
    prepareLinked: (k,data)=>normalizeLinked(k,copy(data),0),
    all: k => state[k] || [], find: (k, id) => (state[k] || []).find(x => x.id === id || x.no === id),
    upsert(k, data) {
      const d = copy(data); if (!d.id) d.id = d.no || S.newId(k.slice(0, 2));
      if (k === 'orders') { d.no = d.no || S.newId('SO'); normalizeOrder(d); }
      if(['deliveries','purchases','payments','tasks','inventory'].includes(k))normalizeLinked(k,d,0);
      const next=copy(state[k]),i=next.findIndex(x=>x.id===d.id||(k==='orders'&&d.no&&x.no===d.no));
      if(i<0)next.unshift(d);else next[i]=d;commit(k,next);return d;
    },
    commitMany(changes) {
      const before={},next={},keys=Object.keys(changes);keys.forEach(k=>{if(!Array.isArray(state[k])||!Array.isArray(changes[k]))throw Error('无效的事务集合：'+k);before[k]=copy(state[k]);next[k]=copy(changes[k]);});
      try{keys.forEach(k=>replaceContents(state[k],next[k]));persist();}catch(e){keys.forEach(k=>replaceContents(state[k],before[k]));window.dispatchEvent(new CustomEvent('aicard:data'));throw e;}
    },
    upsertMany(k, data) {
      const next=copy(state[k]);
      data.forEach(value=>{const d=copy(value);if(!d.id)d.id=d.no||S.newId(k.slice(0,2));if(k==='orders'){d.no=d.no||S.newId('SO');normalizeOrder(d);}if(['deliveries','purchases','payments','tasks','inventory'].includes(k))normalizeLinked(k,d,0);const i=next.findIndex(x=>x.id===d.id||(k==='orders'&&d.no&&x.no===d.no));if(i<0)next.unshift(d);else next[i]=d;});
      commit(k,next);return data.length;
    },
    remove(k, ids) { commit(k,state[k].filter(x=>!ids.includes(x.id))); },
    rows(k, cols = []) {
      return (state[k] || []).map((entity, i) => {
        const r = Object.assign({}, entity.__fields || {}, { 状态: entity.status || entity.state || '', id: entity.id, __entity: k, __lines: copy(entity.items || []), img: entity.img || entity.productImg || state.products.find(p=>p.id===entity.productId)?.img, __record: copy(entity) });
        cols.forEach(c => { const p = c.prop || c.label, key = (mapping[k] || {})[p]; if (key) { let v = entity[key]; if (['online','hot','visible','enabled','isPublic'].includes(key)) v = v === false ? '否' : '是'; r[p] = v == null ? '' : v; } else if (p === '序号') r[p] = i + 1; else if (r[p] === undefined) r[p] = '';
          if (k === 'customers' && /订单数|累计消费/.test(p)) { const os = state.orders.filter(o => o.customerId === entity.id || o.customer === entity.company); r[p] = p === '订单数' ? os.length : round(os.reduce((a, o) => a + o.amount, 0)); }
        }); return r;
      });
    },
    saveRows(k, rows) {
      const next=rows.map(r => {
        const original = db.find(k, r.id) || r.__record || {};
        const e = Object.assign({}, original, { id: r.id || S.newId(k), __fields: copy(r) }); delete e.__fields.__record; delete e.__fields.__lines;
        Object.entries(mapping[k] || {}).forEach(([p, key]) => { if (r[p] !== undefined) e[key] = ['online','hot','visible','enabled','isPublic'].includes(key) ? !['否','停用',false].includes(r[p]) : r[p]; });
        if (k === 'orders') { e.items = r.__lines || e.items || []; normalizeOrder(e); }
        if(['deliveries','purchases','payments','tasks','inventory'].includes(k)) normalizeLinked(k,e,0);
        return e;
      });commit(k,next);
    },
    siteOrder(o) { return Object.assign({}, o, { product: o.productName, img: o.productImg, qty: o.products, created: String(o.createdAt || '').slice(0, 10), contact: o.customerName, items: copy(o.items) }); }
  };
  // 一次性迁移之前各系统保存的新建单据；保留原键和源码备份，不丢弃历史记录。
  if (!old) {
    (S.store.get('c:orders') || []).forEach(o => db.upsert('orders', Object.assign({}, o, { id:o.no, productName:o.product, productImg:o.img, products:o.qty, createdAt:o.created, customerName:o.contact, produceStatus:o.state })));
    (S.store.get('b:orders') || []).forEach(r => {
      const o = { id:r['订单号'], no:r['订单号'], items:r.__lines || [], createdAt:r['订货日期'], fees:r.__fees || {} };
      Object.entries(mapping.orders).forEach(([p, k]) => { if (r[p] !== undefined) o[k] = r[p]; }); db.upsert('orders',o);
    });
  }
  ['products','customers','suppliers','materials','orders','deliveries','purchases','payments','tasks'].forEach(k => { M[k] = state[k]; });
  M.stockRows=state.inventory;
  const readNotice=S.store.get('notice:read')||[];M.notices=Vue.reactive(state.orders.slice(0,8).map((o,i)=>({id:'NOTICE:'+o.no,title:i%2?'订单交付提醒':'订货单待跟进',content:'订货单 '+o.no+'（'+o.customer+'），应收 '+S.money(o.amount)+'，已收 '+S.money(o.paid)+'；当前状态：'+o.state+'。',time:String(o.createdAt).slice(5,16),read:readNotice.includes('NOTICE:'+o.no)})));
  persist();
  window.addEventListener('storage', e => {
    if (e.key !== 'aicard.demo.entities:v3' || !e.newValue) return;
    try { const n = JSON.parse(e.newValue); Object.keys(seed).forEach(k => { if (Array.isArray(state[k]) && Array.isArray(n[k])) replaceContents(state[k],n[k]); }); window.dispatchEvent(new CustomEvent('aicard:data')); } catch (_) { /* 保留当前可用数据 */ }
  });
})();
