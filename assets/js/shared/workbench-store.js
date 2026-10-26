/* ERP 工作台：从共享业务实体计算待办和指标；偏好、浏览记录独立保存。 */
(function () {
  'use strict';
  const S = window.SHARED, copy = S.clone, KEY = 'b:workbench:v1', RECENT = 'b:workbench:recent:v1';
  const arr=v=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):[];
  const text = v => String(v == null ? '' : v), qty = n => Number.isFinite(Number(n)) ? Number(n) : 0;
  const round = n => Math.round(n * 10000) / 10000;
  const notifications = {
    '销售/跟单': ['订单报价通知', '报价审核通知', '收款通知', '合同签订通知', '申请制图通知', '待排产通知', '距订单交期还有15天未完工通知', '待创建交货单通知', '采购单产品需外协生产通知', '临近交期订单提醒', '创建交货单后长时间未提交提醒', '改单审核通知'],
    '设计': ['待制图通知', '图纸审核通知'], '财务': ['收款信息审核通知'],
    '生产': ['排产完成通知', '质检通知'], '仓管': ['提交交货单后待出库提醒']
  };
  const entries = [
    ['orders', '订货单', 'Tickets', 'project/index'], ['quoted', '已报价订单', 'Document', 'project/index'],
    ['ordered', '已下单订单', 'DocumentChecked', 'project/index'], ['plan', '待排产订单', 'Timer', 'project/index'],
    ['start', '待开工订单', 'Tools', 'project/index'], ['producing', '生产中订单', 'SetUp', 'project/index'],
    ['receive', '待入库订单', 'Box', 'project/index'], ['stored', '已入库订单', 'Collection', 'project/index'],
    ['dispatch', '待出库订单', 'Van', 'project/index'], ['unpaid', '待回款订单', 'Money', 'project/index'],
    ['part-paid', '部分回款订单', 'Coin', 'project/index'], ['delivery-draft', '待提交交货单', 'Document', 'deliver/index'],
    ['delivery-pending', '待出货交货单', 'Van', 'deliver/index'], ['delivery-done', '已出货交货单', 'CircleCheck', 'deliver/index'],
    ['suppliers', '供应商查询', 'Shop', 'purchase/supplier'], ['corrections', '查看库存修正记录', 'EditPen', 'inventory/inquiry'],
    ['task-plan', '待排产产品', 'Calendar', 'perfect/center'], ['plan-draft', '待提交的排产计划', 'Edit', 'perfect/center'],
    ['task-start', '待开工产品', 'Tools', 'perfect/center'], ['task-producing', '生产中产品', 'SetUp', 'perfect/center'],
    ['changes', '修改记录', 'List', 'project/modifylog']
  ].map(([key, label, icon, route], i) => ({ key, label, icon, route, color: ['#7588e6', '#8bbe72', '#79ac78', '#e3b450', '#d9a65b', '#718be5', '#d2ae5c'][i % 7] }));
  const creates = [{key:'order',label:'创建订货单',route:'project/add'}, {key:'delivery',label:'创建交货单',route:'deliver/index'}, {key:'stock',label:'备货排产',route:'palletPlan/add'}];
  const defaults = () => ({ quick: entries.slice(0, 7).map(x => x.key), creates: ['order', 'delivery'], notifications: {}, coreRole: '老板' });
  const roles = ['老板', '厂长', '生产部领导', '仓管', '销售', '跟单', '设计部领导', '设计', '财务'];
  const preferences = () => {
    const saved = S.store.get(KEY), p = Object.assign(defaults(), saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {});
    p.quick = Array.isArray(p.quick) ? [...new Set(p.quick.filter(k => entries.some(e => e.key === k)))].slice(0, 7) : defaults().quick;
    p.creates = Array.isArray(p.creates) ? [...new Set(p.creates.filter(k => creates.some(e => e.key === k)))].slice(0, 3) : defaults().creates;
    if (!p.notifications || typeof p.notifications !== 'object' || Array.isArray(p.notifications)) p.notifications = {};
    if (!roles.includes(p.coreRole)) p.coreRole = '老板';
    return copy(p);
  };
  const savePreferences = patch => {
    const p = Object.assign(preferences(), copy(patch));
    if (!Array.isArray(p.quick) || p.quick.length > 7 || new Set(p.quick).size !== p.quick.length || p.quick.some(k => !entries.some(e => e.key === k))) throw Error('快捷入口最多选择7个，且不能重复');
    if (!Array.isArray(p.creates) || p.creates.length > 3 || new Set(p.creates).size !== p.creates.length || p.creates.some(k => !creates.some(e => e.key === k))) throw Error('创建入口配置无效');
    if (!roles.includes(p.coreRole)) throw Error('请选择有效岗位视图');
    S.store.set(KEY, p); window.dispatchEvent(new CustomEvent('aicard:workbench')); return p;
  };
  const enabled = (p, role, label) => p.notifications?.[role]?.[label] !== false;
  const day = value => { const s = text(value).slice(0,10); if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return ''; const d = new Date(s + 'T00:00:00Z'); return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === s ? s : ''; };
  const today = () => day(S.now());
  const inRange = (date, range) => !range?.length || !!day(date) && day(date) >= range[0] && day(date) <= range[1];
  const liveOrder = o => !['草稿','方案(草稿)','已作废'].includes(o.state);
  const incomplete = o => liveOrder(o) && !['待入库','已入库','待出库','已出库','已完成','生产完成'].includes(o.state);
  const overdue = o => incomplete(o) && !!day(o.delivery) && day(o.delivery) < today();
  const unique = (kind, id) => { const a = S.db.all(kind).filter(o => o.id === id); return a.length === 1 ? a[0] : null; };
  const orderFor = no => { const a=S.db.all('orders').filter(o=>o.no===no);return a.length===1?a[0]:null; };
  const todos = (p = preferences()) => {
    const result = [], orders = S.db.all('orders'), now = today();
    const add = (role, label, id, title, entity, o, action, target, doneAt) => {
      if (!enabled(p, role, label)) return;
      result.push({id:role+':'+label+':'+id,role,label,title,orderId:o?.id||'',no:entity.no||entity.taskNo||o?.no||'',name:o?.name||'',innerNo:o?.innerNo||'',customer:o?.customer||'',customerName:o?.customerName||'',phone:o?.phone||'',by:entity.applicant||entity.creator||entity.operator||(entity===o?o?.owner:'')||'未记录',department:entity.department||o?.department||'',createdAt:entity.createdAt||'',processedAt:doneAt||'',done:!!doneAt,overdue:!!o&&overdue(o),action:action||'查看详情',target:target||''});
    };
    orders.forEach(o => {
      if (!o.id || !unique('orders',o.id) || orders.filter(x=>x.no===o.no).length!==1 || o.state==='已作废') return;
      if (['草稿','方案(草稿)'].includes(o.state)) add('销售/跟单','订单报价通知',o.id,'订货单待报价，请及时跟进',o,o);
      if (o.quoteStatus==='待审核') add('销售/跟单','报价审核通知',o.id,'订单报价待审核',o,o);
      if (liveOrder(o) && qty(o.unpaid)>0) add('销售/跟单','收款通知',o.id,'订货单待回款，请及时跟进',o,o);
      if (o.contractStatus==='待签订') add('销售/跟单','合同签订通知',o.id,'订货单合同待签订',o,o);
      if(o.drawingRequested===true)add('销售/跟单','申请制图通知',o.id,'收到新的制图申请',o,o);
      if (['待制图','图纸待确定'].includes(o.state)) add('设计','待制图通知',o.id,'订货单待制图，请尽快处理',o,o);
      if (o.state==='待排产') add('销售/跟单','待排产通知',o.id,'订货单待排产，请尽快处理',o,o,'立即排产');
      const days=day(o.delivery)?Math.round((new Date(day(o.delivery)+'T00:00:00Z')-new Date(now+'T00:00:00Z'))/86400000):null;
      if (incomplete(o) && days!==null && days>=0 && days<=15) add('销售/跟单','距订单交期还有15天未完工通知',o.id,'距订单交期还有'+days+'天，请关注完工进度',o,o);
      if (overdue(o)) add('销售/跟单','临近交期订单提醒',o.id,'订货单生产已逾期，请及时处理',o,o);
      if (['已入库','待出库'].includes(o.state) && !S.db.all('deliveryDocuments').some(d=>!['已作废','已取消'].includes(d.state)&&arr(d.items).some(l=>l.orderNo===o.no))) add('销售/跟单','待创建交货单通知',o.id,'订货单待创建交货单',o,o,'创建交货单','deliver/add?order='+encodeURIComponent(o.no));
      arr(o.receipts).forEach(r => { if (r.id && ['待确认','已确认'].includes(r.status)) add('财务','收款信息审核通知',o.id+':'+r.id,r.status==='待确认'?'收到新的回款信息，请审核':'回款信息已确认',Object.assign({},r,{createdAt:r.createdAt||r.date}),o,'查看详情','',r.status==='已确认'?(r.confirmedAt||r.updatedAt||r.date):''); });
      if (arr(o.items).some(l=>['待确认','待审核','图纸待确定','制图待确认'].includes(l.drawingStatus))) add('设计','图纸审核通知',o.id,'产品图纸待审核确认',o,o);
      arr(o.stateHistory).forEach((h,i)=>{if(h.state==='待开工'&&day(h.at))add('生产','排产完成通知',o.id+':'+i,'订货单排产完成',Object.assign({},o,{createdAt:h.at}),o,'查看详情','',h.at);});
    });
    S.db.all('orderAmendments').forEach(a=>{const o=unique('orders',a.orderId);if(o&&a.state==='待审核')add('销售/跟单','改单审核通知',a.id,'收到新的改单申请，请尽快审核',a,o,'审核改单','editApply/list');});
    S.db.all('tasks').forEach(t=>{const o=orderFor(t.orderNo);if(!o)return;if(t.status==='待质检'||t.qualityState==='待检验')add('生产','质检通知',t.id,'产品生产待质检',t,o,'查看生产任务','perfect/center?wbEntry=task-quality');});
    S.db.all('deliveryDocuments').forEach(d=>{
      if(!d.id||!unique('deliveryDocuments',d.id))return;
      const orderNos=[...new Set(arr(d.items).map(l=>l.orderNo).filter(Boolean))],o=orderNos.length===1?orderFor(orderNos[0]):null;
      if(d.state==='待提交')add('销售/跟单','创建交货单后长时间未提交提醒',d.id,'交货单待提交，请及时确认',d,o,'查看交货单','deliver/add?id='+encodeURIComponent(d.id));
      if(['待出库','部分出库'].includes(d.state))add('仓管','提交交货单后待出库提醒',d.id,'交货单待确认出库',d,o,'查看交货单','deliver/index?wbEntry=delivery-pending');
    });
    return result.sort((a,b)=>text(b.createdAt).localeCompare(text(a.createdAt))||a.id.localeCompare(b.id));
  };
  const matches = (r, group, keyword) => {
    const q=text(keyword).trim().toLowerCase(); if(q&&![r.no,r.name,r.innerNo,r.customer,r.customerName,r.phone].some(x=>text(x).toLowerCase().includes(q)))return false;
    if(group==='done')return r.done&&day(r.processedAt).slice(0,7)===today().slice(0,7);
    if(r.done)return false;
    if(group==='today')return day(r.createdAt)===today();
    if(group==='stale')return !!day(r.createdAt)&&new Date(today()+'T00:00:00Z')-new Date(day(r.createdAt)+'T00:00:00Z')>3*86400000;
    if(group==='overdue')return r.overdue&&r.label==='临近交期订单提醒';
    return true;
  };
  const entryMatches = (key, o) => {
    const raw=text(o.state||o.status),state=raw==='图纸待确定'?'待制图':raw, states={ordered:'已下单',plan:'待排产',start:'待开工',producing:'生产中',receive:'待入库',stored:'已入库',dispatch:'待出库','task-plan':'待排产','task-start':'待开工','task-producing':'生产中','plan-draft':'排产中','task-quality':'待质检'};
    if(states[key])return state===states[key];
    if(key==='quoted')return o.quoteStatus==='已报价'||state==='已报价';
    if(key==='unpaid')return liveOrder(o)&&qty(o.unpaid)>0;
    if(key==='part-paid')return liveOrder(o)&&qty(o.paid)>0&&qty(o.unpaid)>0;
    if(key==='delivery-draft')return state==='待提交';
    if(key==='delivery-pending')return ['待出库','部分出库'].includes(state);
    if(key==='delivery-done')return state==='已出库';
    if(key==='orders')return true;
    return false;
  };
  const routeContext = (hash, route) => {
    const params=new URLSearchParams(text(hash).split('?')[1]||''), key=params.get('wbEntry'), e=entries.find(e=>e.key===key&&e.route===route);
    if(e)return {key,label:e.label};
    if(key==='task-quality'&&route==='perfect/center')return {key,label:'待质检产品'};
    return null;
  };
  const range = kind => {const d=new Date(), start=new Date(d.getFullYear(),d.getMonth(),1),end=new Date(d.getFullYear(),d.getMonth()+1,0),fmt=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');if(kind==='today')return [today(),today()];if(kind==='lastMonth'){start.setMonth(start.getMonth()-1);end.setDate(0);}if(kind==='year'){start.setMonth(0);end.setMonth(11,31);}return [fmt(start),fmt(end)];};
  // 卡片、抽屉、筛选合计与导出共用同一指标定义，不另造一份明细数据。
  const validNumber=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
  const strictTotal=values=>{if(values.some(n=>!validNumber(n)))return null;const n=round(values.reduce((a,b)=>a+b,0));return Number.isFinite(n)?n:null;};
  const productAmount=(a,b)=>validNumber(a)&&validNumber(b)&&Number.isFinite(a*b)?round(a*b):null;
  const metricColumns={
    products:[['product','产品',180,'entity'],['code','产品编码',120],['taskNo','任务单',135],['orderNo','订货单',170,'order'],['innerNo','内部单号',130],['qty','产品数量',110,'number'],['unit','单位',70],['amount','产品金额',130,'money'],['status','产品状态',115,'status'],['delivery','交货日期',120],['customer','合作商',170],['customerName','C端/业主',130],['owner','销售',100],['follower','跟单',100]],
    orders:[['orderNo','订货单',200,'order'],['innerNo','内部单号',130],['qty','产品数量',110,'number'],['amount','订货单金额',135,'money'],['unpaid','待回款金额',130,'money'],['paid','已回款金额',130,'money'],['status','订货单状态',115,'status'],['payStatus','回款状态',110,'status'],['date','客户订货时间',130],['createdAt','订货单创建时间',165],['delivery','交货日期',120],['customer','合作商',170],['customerName','C端/业主',130],['owner','销售',100],['follower','跟单',100]],
    tasks:[['product','产品',180,'entity'],['taskNo','任务单',145,'entity'],['orderNo','订货单',170,'order'],['innerNo','内部单号',130],['qty','产品数',100,'number'],['unit','单位',70],['status','生产状态',115,'status'],['process','工序',140],['plannedStart','计划开始时间',135],['plannedEnd','计划结束时间',135],['days','计划工期',100,'number'],['startDate','生产开始时间',135],['endDate','生产完成时间',135],['amount','产品金额',130,'money'],['delivery','交货日期',120]],
    purchases:[['product','产品/物料',180,'entity'],['code','编码',120],['purchaseNo','采购单',145,'entity'],['orderNo','订货单',170,'order'],['innerNo','内部单号',130],['qty','采购数量',110,'number'],['unit','单位',70],['price','单价',120,'money'],['amount','采购金额',135,'money'],['receivedQty','入库数量',110,'number'],['receivedAmount','入库金额',135,'money'],['status','采购状态',115,'status'],['supplier','供应商',180],['buyer','采购员',100],['date','采购创建时间',165],['arrival','到货日期',120]],
    inventory:[['product','产品/物料',180,'entity'],['code','编码',125],['spec','规格',180],['material','材质',180],['warehouse','仓库',140],['qty','库存数量',115,'number'],['unit','单位',70],['amount','库存货值',140,'money'],['age','库龄',160],['receivedAt','入库日期',120],['orderNo','来源订货单',170,'order']]
  };
  const columnsFor=kind=>(metricColumns[kind]||[]).map(([prop,label,width,type])=>({prop,label,width,type:type||'text'}));
  const metricValue=(def,rows)=>def.mode==='missing'?null:def.mode==='count'?rows.length:def.mode==='rate'?(rows.length?round(rows.filter(r=>r.status==='生产完成').length/rows.length*100):0):strictTotal(rows.map(r=>r[def.field]));
  const formatMetric=(def,n)=>def.mode==='missing'?null:n===null?'未记录':def.mode==='rate'?n.toFixed(2)+'%':def.money?S.money(n):n;
  const metricCatalog=dates=>{
    const allOrders=arr(S.db.all('orders')).filter(liveOrder), periodOrders=allOrders.filter(o=>inRange(o.orderedAt||o.createdAt,dates));
    const relation=r=>r.orderId?unique('orders',r.orderId):r.orderNo?orderFor(r.orderNo):null;
    const base=(r,o)=>({entityId:r.id||'',orderId:o&&unique('orders',o.id)?o.id:'',orderNo:o?.no||r.orderNo||'',orderName:o?.name||'',innerNo:r.innerNo||o?.innerNo||'',customer:r.customer||o?.customer||'',customerName:r.customerName||r.contact||o?.customerName||'',owner:r.owner||o?.owner||'',follower:r.follower||o?.follower||'',delivery:r.delivery||o?.delivery||'',createdAt:r.createdAt||'',spec:r.spec||'',material:r.material||r.mat||'',img:r.productImg||r.img||''});
    const keyed=(kind,rows)=>{const seen=new Map();return rows.map(r=>{const id=kind+':'+text(r.entityId),i=seen.get(id)||0;seen.set(id,i+1);return {...r,id:id+':'+i,kind};});};
    const orderRows=os=>keyed('orders',os.map(o=>({...base(o,o),qty:o.products,amount:o.amount,paid:o.paid,unpaid:o.unpaid,status:o.state,payStatus:o.payStatus,date:o.orderedAt||o.createdAt,unit:''})));
    const productRows=os=>keyed('products',os.flatMap(o=>arr(o.items).map(l=>({...base(l,o),entityId:o.id+':'+text(l.key||l.lineId||l.id),product:l.name,code:l.code||l.sku||'',taskNo:l.taskNo||'',qty:l.qty,price:l.price,unit:l.unit||'',amount:productAmount(l.qty,l.price),status:l.drawingStatus||o.state,orderState:o.state,drawingStatus:l.drawingStatus||'',date:o.orderedAt||o.createdAt}))));
    const allTaskRows=keyed('tasks',arr(S.db.all('tasks')).map(t=>({...base(t,relation(t)),product:t.product,code:t.code||'',taskNo:t.taskNo||'',qty:t.qty,unit:t.unit||'',amount:t.amount,status:t.status,process:t.process||'',plannedStart:t.plannedStart||'',plannedEnd:t.plannedEnd||'',days:t.days??null,startDate:t.startDate||'',endDate:t.endDate||'',date:t.scheduledAt||t.createdAt})));
    const os=orderRows(periodOrders), ds=productRows(periodOrders), ts=allTaskRows.filter(t=>inRange(t.date,dates)), currentOrders=orderRows(allOrders);
    const finished=ts.filter(t=>t.status==='生产完成'), prod=currentOrders.filter(o=>o.status==='生产中'), shipped=os.filter(o=>o.status==='已出库'), unpaid=os.filter(o=>qty(o.unpaid)>0);
    const purchases=keyed('purchases',arr(S.db.all('purchases')).filter(p=>inRange(p.createdAt,dates)).map(p=>({...base(p,relation(p)),product:p.product,code:p.code||'',purchaseNo:p.no||'',qty:p.qty,unit:p.unit||'',price:p.price,amount:p.amount,receivedQty:p.receivedQty,receivedAmount:productAmount(p.receivedQty,p.price),status:p.state,supplier:p.supplier||'',buyer:p.buyer||'',date:p.createdAt,arrival:p.arrival||''})));
    const stockSource=S.warehouse?S.warehouse.rows():arr(S.db.all('inventory'));
    const stocks=keyed('inventory',stockSource.map(r=>({...base(r,relation(r)),product:r.name,code:r.code||'',qty:r.qty,unit:r.unit||'',amount:r.value,status:'当前库存',warehouse:r.warehouse||'',age:r.age||'未记录',receivedAt:r.receivedAt||''})));
    const alertDays=S.warehouse?S.warehouse.prefs().alertDays:60;
    const aged=keyed('inventory',arr(S.db.all('inventoryBatches')).filter(b=>b.qty>0&&alertDays>0&&day(b.receivedAt)&&Math.floor((Date.parse(today()+'T00:00:00Z')-Date.parse(day(b.receivedAt)+'T00:00:00Z'))/86400000)>alertDays).flatMap(b=>{const r=stockSource.find(r=>r.id===b.stockId);if(!r)return [];return [{...base(b,relation(b)),entityId:b.id,product:r.name,code:r.code||'',spec:r.spec||'',material:r.material||'',qty:b.qty,unit:r.unit||'',amount:productAmount(b.qty,b.unitPrice),status:'库龄预警',warehouse:r.warehouse||'',age:Math.floor((Date.parse(today()+'T00:00:00Z')-Date.parse(day(b.receivedAt)+'T00:00:00Z'))/86400000)+'天',receivedAt:day(b.receivedAt)}];}));
    const nearLimit=new Date(today()+'T00:00:00Z');nearLimit.setUTCDate(nearLimit.getUTCDate()+15);const nearEnd=nearLimit.toISOString().slice(0,10);
    const near=o=>incomplete({state:o.status})&&day(o.delivery)>=today()&&day(o.delivery)<=nearEnd;
    const late=o=>overdue({state:o.status,delivery:o.delivery});
    const defs={};
    const add=(key,label,kind,rows,mode='sum',field='qty',options={})=>{const def={key,label,kind,rows,mode,field,money:false,snapshot:false,dateLabel:kind==='tasks'?'排产时间':kind==='purchases'?'采购创建时间':'客户订货时间',...options};def.columns=columnsFor(kind);def.tip=def.notice||(def.snapshot?'当前状态快照，不受所选期间影响。':'按所选期间的'+def.dateLabel+'筛选本机记录。')+(kind==='products'||kind==='tasks'||kind==='inventory'?' 数量按原单位分别列示，跨单位合计不表示换算。':'');def.total=metricValue(def,rows);def.value=formatMetric(def,def.total);defs[key]=def;};
    add('order-products','订单产品数','products',ds);
    add('unpaid-orders','待回款订单数','orders',unpaid,'count');
    add('unpaid-amount','待回款金额','orders',os.filter(o=>!validNumber(o.unpaid)||o.unpaid>0),'sum','unpaid',{money:true});
    add('assigned-tasks','已分配任务数','tasks',ts.filter(t=>['待开工','生产中','生产完成'].includes(t.status)),'count');
    add('orders','订单数','orders',os,'count');add('order-amount','订单金额','orders',os,'sum','amount',{money:true});add('paid-amount','已回款金额','orders',os.filter(o=>!validNumber(o.paid)||o.paid>0),'sum','paid',{money:true});
    add('producing-orders','生产中订单数','orders',prod,'count','qty',{snapshot:true});add('producing-amount','生产中订单金额','orders',prod,'sum','amount',{money:true,snapshot:true});
    add('shipped-orders','已出库订单数','orders',shipped,'count');add('shipped-amount','已出库订单金额','orders',shipped,'sum','amount',{money:true});
    add('finished-products','完工的产品数','tasks',finished);add('finished-amount','完工的产品金额','tasks',finished,'sum','amount',{money:true});
    add('purchase-amount','采购金额','purchases',purchases,'sum','amount',{money:true});add('inventory-value','库存货值','inventory',stocks,'sum','amount',{money:true,snapshot:true});
    add('wages','计件工资金额','tasks',[],'missing','amount',{money:true,notice:'当前共享数据未记录工资明细，无法核算计件工资。请在计件工资表补充有效记录后再核对。'});
    add('task-waiting','待开工产品数','tasks',ts.filter(t=>t.status==='待开工'));add('task-started','开工产品数','tasks',ts.filter(t=>['生产中','生产完成'].includes(t.status)));
    add('task-producing','生产中产品数','tasks',allTaskRows.filter(t=>t.status==='生产中'),'sum','qty',{snapshot:true});add('task-finished','生产完成产品数','tasks',finished);
    add('task-near','临近交期产品数','tasks',ts.filter(t=>day(t.delivery)>=today()&&day(t.delivery)<=nearEnd&&t.status!=='生产完成'));
    add('task-overdue','生产逾期产品数','tasks',ts.filter(t=>day(t.delivery)&&day(t.delivery)<today()&&t.status!=='生产完成'));
    add('near-orders','临近交期订单数','orders',currentOrders.filter(near),'count','qty',{snapshot:true});add('overdue-orders','生产逾期订单数','orders',currentOrders.filter(late),'count','qty',{snapshot:true});
    add('rework','工序返工数量','tasks',[],'missing','qty',{notice:'当前共享数据未记录工序返工明细，无法核算返工数量。未记录不等于没有返工。'});add('completion-rate','计划完成率','tasks',ts,'rate');
    const drawn=ds.filter(l=>['已制图','已确认','已完成'].includes(l.drawingStatus));
    add('drawing-waiting','待制图产品数','products',ds.filter(l=>l.drawingStatus==='待制图'||!l.drawingStatus&&['待制图','图纸待确定'].includes(l.orderState)));
    add('drawing-confirm','制图待确认产品数','products',ds.filter(l=>['待确认','待审核','图纸待确定','制图待确认'].includes(l.drawingStatus)));
    add('drawing-done','已制图产品数','products',drawn);add('drawing-orders','已制图订单数','orders',os.filter(o=>drawn.some(l=>l.orderId===o.entityId)),'count');
    const unfinished=productRows(allOrders.filter(incomplete));
    add('unfinished-products','未完工产品数','products',unfinished,'sum','qty',{snapshot:true});add('unfinished-amount','未完工产品金额','products',unfinished,'sum','amount',{money:true,snapshot:true});
    const receivedPurchases=purchases.filter(p=>!validNumber(p.receivedQty)||p.receivedQty>0);
    add('purchase-received','采购入库数量','purchases',receivedPurchases,'sum','receivedQty');add('purchase-received-amount','采购入库金额','purchases',receivedPurchases,'sum','receivedAmount',{money:true});
    const dispatch=currentOrders.filter(o=>o.status==='待出库');add('dispatch-orders','待出库订单数','orders',dispatch,'count','qty',{snapshot:true});add('dispatch-amount','待出库订单金额','orders',dispatch,'sum','amount',{money:true,snapshot:true});
    add('warehouse-receive','待入库产品数','products',productRows(allOrders.filter(o=>o.state==='待入库')),'sum','qty',{snapshot:true});add('warehouse-dispatch','待出库产品数','products',productRows(allOrders.filter(o=>o.state==='待出库')),'sum','qty',{snapshot:true});
    add('inventory-qty','库存总数','inventory',stocks,'sum','qty',{snapshot:true});add('inventory-aged','库龄预警','inventory',aged,'sum','qty',{snapshot:true});
    defs['inventory-aged'].tip='当前库存中库龄超过'+alertDays+'天的批次数量；按仓库中心预警天数计算。缺少入库日期的批次不参与预警，不能据此判断其库龄。';
    return defs;
  };
  const metricKeys={
    '老板':['order-products','unpaid-orders','unpaid-amount','assigned-tasks','orders','order-amount','paid-amount','producing-orders','producing-amount','shipped-orders','shipped-amount','finished-products','finished-amount','purchase-amount','inventory-value','wages'],
    '厂长':['assigned-tasks','task-waiting','task-started','task-producing','task-finished','task-near','task-overdue','near-orders','overdue-orders','wages','rework','completion-rate'],
    '仓管':['warehouse-receive','warehouse-dispatch','inventory-qty','inventory-aged'],
    '销售':['order-products','unpaid-orders','unpaid-amount','orders','order-amount','paid-amount','producing-orders','producing-amount','near-orders','overdue-orders','shipped-orders','shipped-amount'],
    '跟单':['order-products','unpaid-orders','unpaid-amount','dispatch-orders','dispatch-amount','orders','order-amount','paid-amount','producing-orders','producing-amount','near-orders','overdue-orders','shipped-orders','shipped-amount','finished-products','finished-amount'],
    '设计':['drawing-waiting','drawing-confirm','drawing-done','drawing-orders'],
    '财务':['orders','order-amount','paid-amount','shipped-orders','shipped-amount','unfinished-products','unfinished-amount','finished-products','finished-amount','purchase-amount','purchase-received','purchase-received-amount','inventory-value','wages']
  };
  metricKeys['生产部领导']=metricKeys['厂长'];metricKeys['设计部领导']=metricKeys['设计'];
  const metricDetail=(role,key,dates)=>{if(!(metricKeys[role]||metricKeys['老板']).includes(key))return null;const def=metricCatalog(dates)[key];if(key==='overdue-orders'&&['销售','跟单'].includes(role))def.label='逾期订单数';return def;};
  const metrics=(role,dates)=>{const catalog=metricCatalog(dates);return (metricKeys[role]||metricKeys['老板']).map(key=>{const {label,value,tip}=catalog[key];return {key,label:key==='overdue-orders'&&['销售','跟单'].includes(role)?'逾期订单数':label,value,tip};});};
  const queryMetric=(def,query={},sort={})=>{
    if(!def)return [];const q=text(query.keyword).trim().toLowerCase();
    const result=def.rows.filter(r=>(!q||[r.product,r.code,r.taskNo,r.purchaseNo,r.orderNo,r.orderName,r.innerNo,r.customer,r.customerName,r.supplier,r.warehouse].some(v=>text(v).toLowerCase().includes(q)))&&(!query.status||r.status===query.status)&&(!query.payStatus||r.payStatus===query.payStatus)&&(!query.customer||r.customer===query.customer)&&(!query.customerName||r.customerName===query.customerName));
    if(sort.prop&&sort.order)result.sort((a,b)=>{const av=a[sort.prop],bv=b[sort.prop],am=av==null||av==='',bm=bv==null||bv==='';if(am!==bm)return am?1:-1;const n=typeof av==='number'&&typeof bv==='number'?av-bv:text(av).localeCompare(text(bv),'zh-CN',{numeric:true});return (sort.order==='descending'?-1:1)*n||a.id.localeCompare(b.id);});
    return result;
  };
  const metricSummary=(def,rows)=>{
    if(!def)return {value:'未记录',total:null,count:0,units:[],missing:0};const total=metricValue(def,rows), units=new Map();
    rows.forEach(r=>{if(validNumber(r.qty)){const unit=r.unit||'单位未记录';units.set(unit,round((units.get(unit)||0)+r.qty));}});
    return {total,value:formatMetric(def,total),count:rows.length,units:[...units].map(([unit,n])=>({unit,qty:n})),missing:rows.filter(r=>def.mode==='sum'&&!validNumber(r[def.field])).length,finished:rows.filter(r=>r.status==='生产完成').length};
  };
  const recent = () => {
    const saved=S.store.get(RECENT);if(!Array.isArray(saved))return [];
    return saved.filter(r=>r&&unique('orders',r.id)&&day(r.at)).slice(0,30).map(r=>({...r,order:unique('orders',r.id)}));
  };
  const recordVisit = id => {const o=unique('orders',id);if(!o)return false;const next=[{id:o.id,at:S.now(),action:'查看订货单'},...recent().filter(r=>r.id!==o.id).map(({order,...r})=>r)].slice(0,30);S.store.set(RECENT,next);window.dispatchEvent(new CustomEvent('aicard:workbench'));return true;};
  S.workbench={notifications,entries,creates,roles,preferences,savePreferences,enabled,todos,matches,entryMatches,routeContext,range,metrics,metricDetail,queryMetric,metricSummary,recent,recordVisit,unique,day,today};
})();
