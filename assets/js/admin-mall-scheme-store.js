/* 客户方案与方案订单的专用事务。所有状态只保存在本机演示数据中。 */
(function(){
  'use strict';
  const M=window.MALL;
  const fieldKeys={'业主名称':'owner','业主姓名':'owner','联系电话':'phone','地区':'region','详细地址':'address','小区':'community','房号':'room','其他':'other','上门时间':'appointment','备注':'note','报单凭证':'vouchers'};
  const schemeFieldKey=f=>fieldKeys[f.defaultName]||f.id;
  const schemeOrderFields=r=>M.copy(r.formSnapshot||(r.schemeId?M.state.schemeSettings.fields:M.state.schemeSettings.reportFields)).filter(f=>f.visible!==false&&f.defaultName!=='订单金额');
  const schemeRefundableAmount=r=>Number.isSafeInteger(r.onlinePaid)&&r.onlinePaid>=0&&Number.isSafeInteger(r.refundedOnline??0)?Math.max(0,r.onlinePaid-(r.refundedOnline||0)):null;
  const schemeProductImage=(product,variant)=>{const image=Array.isArray(variant?.image)?variant.image[0]:variant?.image;return M.copy(image||product?.images?.[0]||null);};
  const schemeLineImage=line=>{const image=Array.isArray(line.image)?line.image[0]:line.image;if(image)return image;const p=M.state.products.find(p=>p.id===line.productId);return schemeProductImage(p,p?.variants.find(v=>v.id===line.variantId));};
  const record=(db,kind,key,revision)=>{
    if(!['schemes','templates','schemeOrders'].includes(kind))throw Error('不支持的方案类型');
    const r=db[kind].find(r=>r.id===key);if(!r)throw Error('记录已不存在，请刷新后重试');
    if(revision!==undefined&&r.revision!==revision)throw Error('记录已变化，请重新打开');return r;
  };
  const finish=r=>{r.revision=(r.revision||0)+1;r.updatedAt=M.now();return M.copy(r);};
  const recalculate=r=>{const values=r.items.map(M.schemeLineTotal);r.amount=values.every(v=>v!==null)?values.reduce((n,v)=>n+v,0):null;if(r.amount!==null&&!Number.isSafeInteger(r.amount))throw Error('商品合计金额超出范围');};
  function saveSchemeMetadata(kind,input){return M.transact(db=>{
    if(!['schemes','templates'].includes(kind))throw Error('订单没有方案资料修改入口');
    const r=record(db,kind,input.id,input.revision),name=M.txt(input.name,'方案名称',28),sort=M.integer(input.sort,'排序',-99999999,99999999);
    if(!input.images?.length)throw Error('请上传方案主图');if(input.images.length>1||input.shareImages?.length>1)throw Error('方案主图和分享图各限1张');
    const categories=M.copy(input.categories||[]),seen=new Set();if(categories.length>4)throw Error('方案分类最多4个');
    if(kind==='templates'&&!categories.length)throw Error('请选择方案分类');
    categories.forEach(c=>{const t=db.schemeCategories.find(t=>t.id===c.id);if(!t||!c.values?.length)throw Error('请选择方案分类及分类值');if(seen.has(c.id))throw Error('方案分类不能重复');seen.add(c.id);if(c.values.some(v=>!t.values.includes(v)))throw Error('分类值已变化，请重新选择');});
    Object.assign(r,{name,sort,images:M.copy(input.images),shareImages:M.copy(input.shareImages||[]),categories});return finish(r);
  });}
  function setSchemeItemQuantity(kind,key,lineId,value,revision){return M.transact(db=>{
    const r=record(db,kind,key,revision),line=r.items.find(l=>l.id===lineId);if(!line)throw Error('商品已不存在');line.qty=M.integer(value,'商品数量',1,999999999);recalculate(r);return finish(r);
  });}
  function removeSchemeItem(kind,key,lineId,revision){return M.transact(db=>{
    const r=record(db,kind,key,revision);if(!r.items.some(l=>l.id===lineId))throw Error('商品已不存在');r.items=r.items.filter(l=>l.id!==lineId);recalculate(r);return finish(r);
  });}
  const availableInGroup=(p,g,db=M.state)=>!p.deleted&&p.active&&(!g.categoryIds?.length||g.categoryIds.some(id=>id===p.categoryId||db.categories.find(c=>c.id===p.categoryId)?.parentId===id));
  function addSchemeOrderItems(key,groupId,inputs,revision){return M.transact(db=>{
    const r=record(db,'schemeOrders',key,revision),g=db.schemeGroups.find(g=>g.id===groupId);if(!g)throw Error('方案分组已不存在');if(!inputs.length)throw Error('请先选择商品');
    if(r.items.filter(l=>l.groupId===groupId).length+inputs.length>50)throw Error('每个方案分组最多50款商品');
    const seen=new Set(r.items.filter(l=>l.groupId===groupId).map(l=>l.productId+'\u0000'+(l.variantId||'')));
    inputs.forEach(input=>{const p=db.products.find(p=>p.id===input.productId);if(!p||!availableInGroup(p,g,db))throw Error('商品已下架、删除或不在该分组范围');const variant=input.variantId?p.variants.find(v=>v.id===input.variantId):null;if(input.variantId&&!variant||!input.variantId&&p.variants.length)throw Error('商品规格已变化，请重新选择');const duplicate=p.id+'\u0000'+(variant?.id||'');if(seen.has(duplicate))throw Error('同一分组不能重复添加相同商品规格');seen.add(duplicate);const price=variant?.price??p.price;
      r.items.push({id:M.id('scheme-line'),productId:p.id,variantId:variant?.id||'',name:p.name,image:schemeProductImage(p,variant),spec:variant?.values.join(' / ')||'',price:price==null?null:M.integer(price,'商品价格',0,999999999999),qty:M.integer(input.qty,'搭配数量',1,999999999),groupId,remarks:''});
    });recalculate(r);return finish(r);
  });}
  function updateSchemeOrder(key,action,input,revision){return M.transact(db=>{
    const r=record(db,'schemeOrders',key,revision);
    if(action==='表单'){
      const fields=M.copy(r.formSnapshot||(r.schemeId?db.schemeSettings.fields:db.schemeSettings.reportFields)).filter(f=>f.visible!==false&&f.defaultName!=='订单金额');
      fields.forEach(f=>{const key=schemeFieldKey(f),value=input[key]??(f.type==='图片'||f.type==='省市区'?[]:'');
        if(f.type==='图片'){if(f.required&&!value.length)throw Error('请上传'+f.name);r[key]=M.copy(value);}
        else if(f.type==='省市区'){if(f.required&&(!Array.isArray(value)||value.length!==3||value.some(v=>!String(v).trim())))throw Error('请选择完整'+f.name);r[key]=M.copy(value);}
        else{const max={owner:32,phone:20,address:100,note:500}[key]||Number.MAX_SAFE_INTEGER;const text=String(value).trim();if(f.required&&!text)throw Error('请填写'+f.name);if(text.length>max)throw Error(f.name+'最多'+max+'字');r[key]=text;}
      });
    }else if(action==='付款'){
      if(r.paymentType==='定金')throw Error('定金订单不提供付款信息编辑');
      const key=r.paymentMode==='线下支付'?'paid':r.paymentMode==='线上支付'?'receivable':'';if(!key)throw Error('支付方式未记录，请先核实');r[key]=M.integer(input.amount,key==='paid'?'实收金额':'应收金额',0,999999999999);
    }else if(action==='发货'){
      if(r.status!=='已完成')throw Error('当前状态不提供发货');if(!['快递发货','无需物流'].includes(input.mode))throw Error('请选择发货方式');
      const express=input.mode==='快递发货'?M.txt(input.express,'物流公司',100):'',tracking=input.mode==='快递发货'?M.txt(input.tracking,'物流单号',80):'';
      if(express&&M.O.express?.length&&!M.O.express.includes(express))throw Error('请选择有效物流公司');r.shipping={mode:input.mode,express,tracking,createdAt:M.now()};
    }else if(action==='完工效果图'){
      const url=M.txt(input.vrUrl,'VR链接',2048);let parsed;try{parsed=new URL(url);}catch(e){throw Error('请输入完整的http或https链接');}if(!['http:','https:'].includes(parsed.protocol))throw Error('VR链接仅支持http或https');r.vrUrl=url;
    }else throw Error('不支持的订单操作');
    return finish(r);
  });}
  function refundSchemeOrder(key,reason,revision){return M.transact(db=>{
    const r=record(db,'schemeOrders',key,revision),amount=schemeRefundableAmount(r);if(amount===null||amount<=0||r.status==='已关闭')throw Error('当前订单没有可退线上金额');
    if(!['客户申请退款','商品不符合发货条件退款'].includes(reason))throw Error('请选择退款原因');
    r.refundedOnline=(r.refundedOnline||0)+amount;r.refundHistory||=[];r.refundHistory.push({id:M.id('scheme-refund'),amount,reason,createdAt:M.now(),result:'本地模拟退款'});r.status='已关闭';return finish(r);
  });}
  Object.assign(M,{schemeFieldKey,schemeOrderFields,schemeRefundableAmount,schemeProductImage,schemeLineImage,saveSchemeMetadata,setSchemeItemQuantity,removeSchemeItem,availableInGroup,addSchemeOrderItems,updateSchemeOrder,refundSchemeOrder});
})();
