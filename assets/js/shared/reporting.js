/* 报表从共享实体聚合：周期、KPI、图表和导出使用同一数据集。 */
(function(){
  'use strict';
  const S=window.SHARED,round=n=>Math.round(Number(n||0)*100)/100;
  const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
  const finite=n=>Number.isFinite(n)?n:null;
  const sum=(a,k)=>{if(['qty','出货件数'].includes(k))return round(a.reduce((n,r)=>n+Number(r[k]||0),0));if(a.some(r=>!valid(r[k])))return null;return finite(round(a.reduce((n,r)=>n+r[k],0)));};
  const ratio=(a,b)=>valid(a)&&valid(b)?(b?finite(a/b):0):null;
  const average=(a,n)=>valid(a)?(n?finite(a/n):0):null;
  const percent=n=>n===null?'未记录':(n*100).toFixed(1)+'%';
  const departments=['销售一部','销售二部','销售三部','渠道部','电销部','大客户部'];
  const dept=o=>o.department||departments[Math.max(0,['张松涛','曾燕然','袁彩怡','王海涛','李静','陈志远','周慧','吴敏'].indexOf(o.owner))%departments.length];
  S.reportPeriod=(range,now=new Date())=>{
    const y=now.getFullYear(),m=now.getMonth(),end=new Date(y,m,now.getDate());let start;
    if(range==='上月')return [iso(new Date(y,m-1,1)),iso(new Date(y,m,0))];
    if(range==='本年')start=new Date(y,0,1);else if(range==='本季度')start=new Date(y,Math.floor(m/3)*3,1);else start=new Date(y,m,1);
    return [iso(start),iso(end)];
  };
  S.buildReport=(key,range,targets)=>{
    const base=window.B_STAT[key]||{name:'统计报表',cols:[],chart:{}},period=S.reportPeriod(range);
    const inPeriod=d=>{d=String(d||'').slice(0,10);return d>=period[0]&&d<=period[1];};
    const all=S.db.all('orders'),orders=all.filter(o=>inPeriod(o.createdAt)),live=orders.filter(o=>!['草稿','方案(草稿)','已作废'].includes(o.state));
    const days=d=>Math.max(0,Math.floor((new Date(period[1])-new Date(String(d).slice(0,10)))/86400000)||0);
    let rows=[],cols=S.clone(base.cols),data=live,chart={kind:base.chart?.kind||'bar',title:'所选周期统计',labels:[],values:[]};
    const groups=(data,key)=>{const map=new Map();data.forEach(o=>{const k=key(o);if(!map.has(k))map.set(k,[]);map.get(k).push(o);});return [...map.entries()];};
    const money=n=>valid(n)?S.money(round(n)):'未记录',amount=sum(live,'amount'),paid=sum(live,'paid');
    let kpi=[['订货总额',money(amount)],['回款总额',money(paid)],['订单数',live.length+' 单'],['平均客单价',money(average(amount,live.length))]];
    if(key==='statistic/saleRank'||key==='statistic/dailyStaff'){
      rows=groups(live,o=>o.owner||'未指派').map(([owner,a])=>({id:owner,'销售员':owner,'部门':dept(a[0]),'订货单数':a.length,'本月单数':a.length,'订货金额':sum(a,'amount'),'回款金额':sum(a,'paid'),'回款率':ratio(sum(a,'paid'),sum(a,'amount')),'目标完成率':null,'今日金额':sum(a.filter(o=>String(o.createdAt).slice(0,10)===period[1]),'amount'),'本周金额':sum(a.filter(o=>days(o.createdAt)<7),'amount'),'本月金额':sum(a,'amount')})).sort((a,b)=>a['订货金额']===null?(b['订货金额']===null?0:1):b['订货金额']===null?-1:b['订货金额']-a['订货金额']).map((r,i)=>Object.assign(r,{'排名':r['订货金额']===null?null:i+1}));
      chart={kind:'hbar',title:'销售员订货金额（元）',labels:rows.map(r=>r['销售员']),values:rows.map(r=>r['订货金额'])};
    }else if(key==='statistic/target'){
      const month=period[0].slice(0,7),saved=Array.isArray(targets)?targets:[];
      rows=departments.map((d,i)=>{const actual=sum(live.filter(o=>dept(o)===d),'amount'),target=Number(saved.find(r=>r['部门']===d&&r['月份']===month)?.['目标金额']??(base.rows?.[i]?.[2]||0));return {id:d,'部门':d,'月份':month,'目标金额':target,'实际完成':actual,'完成率':ratio(actual,target),'差额':valid(actual)&&valid(target)?finite(round(actual-target)):null};});
      const total=sum(rows,'目标金额');kpi=[['目标总额',money(total)],['已设定部门',rows.filter(r=>r['目标金额']>0).length+' 个'],['整体完成率',percent(ratio(amount,total))],['待设定部门',rows.filter(r=>!r['目标金额']).length+' 个']];
      chart={kind:'bar',title:'各部门目标完成率（%）',labels:departments,values:rows.map(r=>r['完成率']===null?null:finite(round(r['完成率']*100)))};
    }else if(key==='statistic/product'){
      const shipments=S.db.all('deliveries').filter(d=>inPeriod(d.deliverDate)&&/已发货|已签收|部分发货/.test(d.state));
      const lines=shipments.flatMap(d=>[{id:d.productId,name:d.product,qty:d.qty,amount:d.amount}]);
      rows=S.db.all('products').map(p=>{const a=lines.filter(l=>l.id===p.id);return {id:p.id,'产品名称':p.name,'SKU':p.sku,'分类':p.catName,'出货件数':sum(a,'qty'),'出货金额':sum(a,'amount'),'库存':p.stock,'动销状态':a.length?'正常':'本期无出货'};}).sort((a,b)=>b['出货件数']-a['出货件数']).map((r,i)=>Object.assign(r,{'排名':i+1}));
      chart={kind:'hbar',title:'产品出货件数 TOP 8（件）',labels:rows.slice(0,8).map(r=>r['产品名称']),values:rows.slice(0,8).map(r=>r['出货件数'])};
      kpi=[['在售产品',S.db.all('products').filter(p=>p.online!==false).length+' 个'],['本期出货件数',sum(rows,'出货件数')+' 件'],['动销率',(rows.length?rows.filter(r=>r['出货件数']>0).length/rows.length*100:0).toFixed(1)+'%'],['本期无出货',rows.filter(r=>!r['出货件数']).length+' 个']];
    }else if(key==='statistic/monthlyShipment'){
      data=S.db.all('deliveries').filter(d=>inPeriod(d.deliverDate)&&/已发货|已签收|部分发货/.test(d.state));
      rows=data.map(d=>({id:d.id,'交货单号':d.no,'关联订货单':d.orderNo,'客户':d.customer,'金额':d.amount,'出货仓库':d.warehouse||'成品一仓','出货日期':d.deliverDate}));
      kpi=[['出货单数',new Set(data.map(d=>d.no)).size+' 单'],['出货金额',money(sum(data,'amount'))],['出货数量',sum(data,'qty')+' 件'],['涉及客户',new Set(data.map(d=>d.customer)).size+' 家']];
      const a=groups(data,d=>String(d.deliverDate).slice(0,10)).sort((a,b)=>a[0].localeCompare(b[0]));chart={kind:'line',title:'逐日出货金额（元）',labels:a.map(([d])=>d.slice(5)),values:a.map(([,a])=>sum(a,'amount'))};
    }else if(['statistic/orderWait','statistic/production','statistic/completed','statistic/monthlyOrder'].includes(key)){
      data=orders.filter(o=>key==='statistic/orderWait'?['草稿','方案(草稿)'].includes(o.state):key==='statistic/production'?!['草稿','方案(草稿)','已作废','已出库','已完成','生产完成'].includes(o.state):key==='statistic/completed'?(!['已出库','已完成','已作废'].includes(o.state)&&(['生产完成','已入库'].includes(o.state)||o.produceStatus==='生产完成')):!['草稿','方案(草稿)','已作废'].includes(o.state));
      rows=data.map(o=>({id:o.id,'订货单号':o.no,'客户':o.customer,'产品':o.productName,'金额':o.amount,'停留天数':days(o.createdAt),'销售':o.owner,'创建时间':o.createdAt,'下单时间':o.createdAt,'生产进度':o.produceStatus,'交货日期':o.delivery,'完工日期':o.completedAt||'未记录','待出货天数':o.completedAt?days(o.completedAt):null,'仓库':o.warehouse||'成品一仓'}));
      kpi=[['订单数',data.length+' 单'],['涉及金额',money(sum(data,'amount'))],['超过交期',data.filter(o=>o.delivery&&o.delivery<period[1]).length+' 单'],['平均客单价',money(average(sum(data,'amount'),data.length))]];
      const a=groups(data,o=>key==='statistic/monthlyOrder'?String(o.createdAt).slice(0,10):o.owner||'未指派').sort((a,b)=>a[0].localeCompare(b[0]));chart={kind:key==='statistic/monthlyOrder'?'line':'bar',title:key==='statistic/monthlyOrder'?'逐日订货金额（元）':'各销售订单数（单）',labels:a.map(([d])=>d),values:a.map(([,a])=>key==='statistic/monthlyOrder'?sum(a,'amount'):a.length)};
    }else if(key==='statistic/saleTrend'){
      const a=groups(live,o=>String(o.createdAt).slice(0,7)).sort((a,b)=>a[0].localeCompare(b[0]));
      rows=a.map(([m,a])=>({id:m,'月份':m,'订货单数':a.length,'订货金额':sum(a,'amount'),'回款金额':sum(a,'paid'),'同比':null}));chart={kind:'line',title:'每月订货金额（元）',labels:a.map(([m])=>m),values:a.map(([,a])=>sum(a,'amount'))};
    }else if(key==='statistic/monthlyDept'){
      const months=[...new Set(live.map(o=>String(o.createdAt).slice(0,7)))].sort();
      cols=[{l:'部门'},...months.map(m=>({l:m,t:'money'})),{l:'合计',t:'money'}];
      rows=departments.map(d=>{const a=live.filter(o=>dept(o)===d),r={id:d,'部门':d,'合计':sum(a,'amount')};months.forEach(m=>r[m]=sum(a.filter(o=>String(o.createdAt).startsWith(m)),'amount'));return r;});
      chart={kind:'bar',title:'各部门订货金额（元）',labels:departments,values:rows.map(r=>r['合计'])};
    }else if(key==='statistic/dailyDept'){
      const a=groups(live,o=>String(o.createdAt).slice(0,10)).sort((a,b)=>a[0].localeCompare(b[0]));
      cols=[{l:'日期'},...departments.map(d=>({l:d,t:'money'})),{l:'合计',t:'money'}];
      rows=a.map(([d,a])=>{const r={id:d,'日期':d,'合计':sum(a,'amount')};departments.forEach(deptName=>r[deptName]=sum(a.filter(o=>dept(o)===deptName),'amount'));return r;});
      chart={kind:'line',title:'全部部门逐日订货金额（元）',labels:a.map(([d])=>d.slice(5)),values:rows.map(r=>r['合计'])};
    }
    return {name:base.name,desc:period.join(' 至 ')+'；从本地共享业务实体计算，未记录的同比、完工时间显示为空。',editable:base.editable,cols,kpi,chart,rows};
  };
})();
