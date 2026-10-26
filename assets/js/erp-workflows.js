/* 单据实体写入与打印预览：使用与列表相同的订单和产品数据。 */
(function () {
  'use strict';
  const S=window.SHARED,{ref,computed}=Vue,{ElMessage}=ElementPlus;
  const round=n=>Math.round(Number(n||0)*100)/100;
  const deliveryRows=d=>{
    const batch=(d.items||[]).map((l,i)=>{
      const order=S.db.find('orders',l.orderNo),line=l.sourceKey?(order?.items||[]).find((x,j)=>l.sourceKey===l.orderNo+':'+(x.key||x.id||j)):(order?.items||[]).find(x=>x.id===(l.productId||l.id))||(order?.items||[]).find(x=>x.name===(l.product||l.name));
      return {id:d.no+':'+i,no:d.no,sourceKey:l.sourceKey,orderNo:l.orderNo,productId:l.productId||l.id||line?.id,product:l.product||l.name||line?.name,qty:l.qty,price:l.price??line?.price??0,spec:l.spec,material:l.material,unit:l.unit,customer:d.customer,receiver:d.receiver,phone:d.phone,address:d.address,deliverDate:d.date,createdAt:d.created,state:d.state,items:S.clone(d.items)};
    });
    return batch;
  };
  S.syncDeliveryDocument=d=>S.db.upsertMany('deliveries',deliveryRows(d));
  S.saveDeliveryDocument=d=>{
    const docs=S.clone(S.db.all('deliveryDocuments')),at=docs.findIndex(x=>x.no===d.no);if(at<0)docs.unshift(S.clone(d));else docs[at]=S.clone(d);
    const keys=new Set();
    (d.items||[]).forEach(l=>{
      if(!l.sourceKey)return;
      if(keys.has(l.sourceKey))throw Error('交货单包含重复订单产品行，请合并数量后重试');keys.add(l.sourceKey);
      const order=S.db.find('orders',l.orderNo),line=(order?.items||[]).find((x,j)=>l.sourceKey===l.orderNo+':'+(x.key||x.id||j));
      if(!line)throw Error('关联订单产品已不存在，请重新选择');
      const total=docs.filter(doc=>!['已作废','已取消'].includes(doc.state)).reduce((sum,doc)=>sum+(doc.items||[]).filter(x=>x.sourceKey===l.sourceKey).reduce((n,x)=>n+Number(x.qty),0),0);
      if(!Number.isInteger(Number(l.qty))||Number(l.qty)<=0||!Number.isFinite(total)||total>Number(line.qty))throw Error('累计交货数量超过订单产品数量或数量无效，未保存');
    });
    const next=S.clone(S.db.all('deliveries')).filter(r=>r.no!==d.no),batch=deliveryRows(d).map(r=>S.db.prepareLinked('deliveries',r));
    S.db.commitMany({deliveryDocuments:docs,deliveries:batch.concat(next)});return d;
  };
  S.saveBusinessDocument=(key,r)=>{
    const f=r,id=r.__id,items=r.__lines||[],now=S.now(),db=S.db;
    if(key==='purchase/supplier/add')return db.upsert('suppliers',{id,name:f.name,code:f.code||S.newId('GYS'),contact:f.contact,phone:f.phone,region:f.area,cat:f.cats,settle:f.settle,status:f.state||'合作中',address:f.addr,remark:f.remark,updatedAt:now});
    if(key==='physical/add'||key==='package/add'){
      const catNames={沙发:'sofa',休闲椅:'chair',餐椅:'chair',餐桌:'dining',茶几电视柜:'coffee',床头柜:'bed'},p=db.all('products').find(p=>p.catName===f.cat)||db.all('products')[0];
      return db.upsert('products',{id,name:f.name,sku:f.code||S.newId('SKU'),cat:catNames[f.cat]||'package',catName:f.cat||'组合套餐',brand:f.brand||'创驰国际',price:Number(f.price),face:Number(f.face||f.origin||f.price),spec:f.spec||'按订单确认',material:f.material||'按套餐明细',unit:f.unit||'套',img:f.files?.[0]?.url||p.img,stock:0,online:f.state!=='停用',createdAt:now,description:f.desc,variants:S.clone(items),valid:f.valid});
    }
    if(key==='purchase/add'){const batch=items.map((l,i)=>({id:id+':'+i,no:f.no,supplier:f.supplier,product:l['物料名称'],spec:l['规格'],qty:Number(l['数量']),price:Number(l['单价']),amount:round(Number(l['数量'])*Number(l['单价'])),expected:f.expect,buyer:f.buyer||'张松涛',orderNo:f.order||'',state:'待审核',payState:'待付款',shipState:'待发货',remark:f.remark,createdAt:now,items:S.clone(items)}));db.upsertMany('purchases',batch);return batch;}
    if(key==='reconciliation/add')return db.upsert('payments',{id,no:f.no,supplier:f.supplier,supplierCode:db.all('suppliers').find(s=>s.name===f.supplier)?.code||'未设置',amount:Number(f.amount),auditState:'待审核',payState:'待付款',applicant:'张松涛',auditor:'待指派',payer:'待指派',createdAt:now,plannedDate:f.date,method:f.method,remark:f.remark,items:S.clone(items)});
    if(key==='palletPlan/add'){
      const order=db.find('orders',f.order);if(!order)throw Error('请选择有效订货单');
      const matches=(order.items||[]).map((line,i)=>({line,key:order.no+':'+(line.key||line.id||i)})).filter(x=>f.sourceKey?x.key===f.sourceKey:true);
      if(matches.length!==1)throw Error('订单含多个产品行，请从订货单详情的具体产品进入生产计划');
      const old=db.find('tasks',id);if(!S.saveOrderProductionPlan)throw Error('生产计划服务未加载');
      return S.saveOrderProductionPlan({id:old?.id,orderId:order.id,sourceKey:matches[0].key,qty:old?.qty??matches[0].line.qty,steps:items.map(l=>({process:l['工序'],department:l['工序'],start:f.start,end:f.end,wage:0,owner:l['负责人'],hours:Number(l['计划工时'])}))});
    }
    if(key==='deliver/add'){
      const o=db.find('orders',f.order);if(!o)throw Error('请选择有效订货单');
      const mapped=items.map(l=>{const matches=(o.items||[]).map((x,j)=>({line:x,key:o.no+':'+(x.key||x.id||j)})).filter(x=>l.sourceKey?x.key===l.sourceKey:x.line.name===l['产品名称']&&(!l['规格尺寸']||x.line.spec===l['规格尺寸']));if(matches.length!==1)throw Error('产品无法唯一匹配订单行，请重新选择订单或在交货中心勾选产品');const {line,key}=matches[0];return {sourceKey:key,orderNo:o.no,productId:line.id,product:line.name,spec:line.spec,qty:Number(l['数量']),price:line.price??0,remark:l['备注']};});
      const doc={no:f.no,customer:f.customer,receiver:f.contact,phone:f.phone,address:f.address,date:f.date,logistics:f.carrier,state:'待出货',created:now,updated:now,remark:f.remark,items:mapped};
      return S.saveDeliveryDocument(doc);
    }
    if(key==='lucky/add')return r;
  };
  const PrintCenter={
    props:['nav'],
    setup(p){
      const keyword=ref(''),dates=ref([]),query=ref({keyword:'',dates:[]}),history=ref(S.store.get('b:print-history')||[]),open=ref(false),kind=ref('销售单/合同'),orderNo=ref('');
      const items=[['销售单/合同','Document','按所选订货单生成销售单'],['交货单','Van','交付产品与收货信息'],['生产指令单','Tickets','产品规格与车间任务'],['外箱标签','PriceTag','产品与客户箱唛'],['物料标签','CollectionTag','物料规格与单位'],['质检报告','DocumentChecked','产品检验记录表'],['条码贴纸','Postcard','产品编码贴纸模板']];
      const orders=computed(()=>S.db.all('orders'));
      const records=computed(()=>history.value.filter(r=>(!query.value.keyword||r.n.includes(query.value.keyword))&&(!query.value.dates?.length||(r.t.slice(0,10)>=query.value.dates[0]&&r.t.slice(0,10)<=query.value.dates[1]))));
      const act=n=>{kind.value=n;orderNo.value=orders.value[0]?.no||'';open.value=true;};
      const preview=()=>{
        if(kind.value==='交货单')return ElMessage.warning('交货打印模板及唯一单据入口尚未核实；请到交货中心按明确交货单查看本机资料预览，不生成打印记录');
        if(!S.db.find('orders',orderNo.value))return ElMessage.warning('请选择有效订单');
        history.value.unshift({id:S.newId('PR'),t:S.now(),u:'张松涛',d:kind.value,n:orderNo.value,c:'已生成预览'});S.store.set('b:print-history',history.value);open.value=false;
        p.nav('print/order?id='+encodeURIComponent(orderNo.value)+'&kind='+encodeURIComponent(kind.value));
      };
      const again=r=>{kind.value=r.d;orderNo.value=r.n;preview();};
      const search=()=>query.value={keyword:keyword.value.trim(),dates:dates.value||[]};
      const reset=()=>{keyword.value='';dates.value=[];search();};
      return {items,keyword,dates,records,open,kind,orderNo,orders,act,preview,again,search,reset};
    },
    template:`<div><div class="filters" style="margin-bottom:12px"><div class="row"><div class="fi"><label>订货单号</label><el-input v-model="keyword" clearable placeholder="请输入订货单号" style="width:220px" @keyup.enter="search"/></div><div class="fi"><label>生成时间</label><el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width:250px"/></div><div class="acts"><el-button type="primary" size="small" @click="search">搜索</el-button><el-button size="small" @click="reset">重置</el-button></div></div></div><div class="print-grid"><div class="print-card" v-for="i in items" :key="i[0]" role="button" tabindex="0" @click="act(i[0])" @keydown.enter="act(i[0])"><div class="ic"><el-icon><component :is="i[1]"/></el-icon></div><div><div class="t">{{i[0]}}</div><div class="d">{{i[2]}}</div></div></div></div><div class="tablecard" style="margin-top:12px"><div class="tb-bar"><b>最近生成记录</b></div><el-table :data="records" empty-text="暂无生成记录"><el-table-column prop="t" label="生成时间" width="180"/><el-table-column prop="u" label="操作人" width="120"/><el-table-column prop="d" label="单据类型" width="150"/><el-table-column prop="n" label="关联订货单" min-width="190"/><el-table-column prop="c" label="状态" width="130"/><el-table-column label="操作" width="100"><template #default="s"><el-button link type="primary" @click="again(s.row)">重新预览</el-button></template></el-table-column></el-table></div><el-dialog v-model="open" :title="'生成'+kind" width="560px"><el-form label-width="95px"><el-form-item label="订货单" required><el-select v-model="orderNo" filterable style="width:100%"><el-option v-for="o in orders" :key="o.no" :value="o.no" :label="o.no+' · '+o.customer"/></el-select></el-form-item></el-form><template #footer><el-button @click="open=false">取消</el-button><el-button type="primary" @click="preview">生成预览</el-button></template></el-dialog></div>`
  };
  const CodeBarcode={
    props:['value'],setup(p){const svg=Vue.ref(null);Vue.watchEffect(()=>{const value=String(p.value||'');if(svg.value&&window.JsBarcode){try{window.JsBarcode(svg.value,value,{format:'CODE128',width:2,height:52,fontSize:13,margin:12,displayValue:true});}catch(_){svg.value.textContent='编码不支持';}}},{flush:'post'});return{svg};},template:`<svg ref="svg" class="code128" role="img" :aria-label="'Code128条码 '+value"></svg>`
  };
  const PrintOrder={
    components:{CodeBarcode},
    props:['nav','id','kind'],
    setup(p){
      return {nav:p.nav,notice:'原模板验收未完成：来源身份、纸面实体及打印记录副作用尚未完整核实。旧通用入口已停止；未生成打印记录、未调用打印或读取默认订单。'};
    },
    template:`<el-result icon="warning" title="原打印模板验收未完成" :sub-title="notice"><template #extra><el-button type="primary" @click="nav('printCenter/index')">返回打印中心</el-button></template></el-result>`
  };
  Object.assign(window.ERP_EXTRA.comps,{PrintCenter,PrintOrder});
})();
