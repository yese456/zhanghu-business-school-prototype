/* 交货静态模板参考布局：只读文档快照，不是出库凭证或打印适配器。 */
(function(){
'use strict';
const S=window.SHARED;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=v=>typeof v==='string'?v:null;
const scalar=v=>typeof v==='string'||typeof v==='number'&&Number.isFinite(v)?v:null;
const valid=v=>typeof v==='string'&&v.trim().length>0;
const image=v=>typeof v==='string'&&/^(?:\.\.\/|\.\/)?assets\/images\/[a-zA-Z0-9_\/-]+\.(?:png|jpe?g|webp|gif)$/i.test(v)&&!v.includes('/../')?v:null;
S.deliveryLayoutProjection=sourceId=>{
 const all=S.db.all('deliveryDocuments');
 if(!valid(sourceId)||!Array.isArray(all))throw Error('交货内部ID或集合无效，无法预览');
 const matches=all.filter(d=>object(d)&&d.id===sourceId);
 if(matches.length!==1)throw Error('交货内部ID不存在或不唯一，无法预览');
 const d=matches[0];
 if(!valid(d.no)||all.filter(x=>object(x)&&x.no===d.no).length!==1)throw Error('交货单号缺失或不唯一，无法预览');
 if(!Array.isArray(d.items)||d.items.some(l=>!object(l)))throw Error('交货明细格式异常，无法预览');
 const seen=new Set(),diagnostics=['仅展示交货文档历史资料快照，未核对当前订单、仓库或出库流水；外部及未知图片地址不加载','原站动态列分组与公司、申请人身份未核实；此处规格、材质为本机固定资料列','出库数量及出库合计未核实，不以交货数量推算'];
 const items=d.items.map((l,i)=>{
  if(!valid(l.sourceKey)||seen.has(l.sourceKey))throw Error('交货来源行缺失或重复，无法预览');
  seen.add(l.sourceKey);
  if(typeof l.qty!=='number'||!Number.isFinite(l.qty)||l.qty<0)throw Error('交货数量格式异常，无法预览');
  const row={index:i+1};
  for(const k of ['product','spec','material','orderNo','innerNo','warehouse','unit'])row[k]=text(l[k]);
  for(const k of ['volume','packages'])row[k]=scalar(l[k]);
  row.qty=l.qty;row.img=image(l.img);return row;
 });
 const pages=[];
 for(let offset=0;offset<items.length;){const count=offset===0?5:6;pages.push({number:pages.length+1,first:offset===0,last:false,items:items.slice(offset,offset+count)});offset+=count;}
 pages.forEach((p,i)=>{p.total=pages.length;p.last=i===pages.length-1;});
 const info=object(d.logisticsInfo)?d.logisticsInfo:{};
 const logisticsInfo=Object.fromEntries(['receiver','phone','address','company','trackingNo','contact','companyPhone','plate'].map(k=>[k,text(info[k])]));
 return {document:{id:d.id,no:d.no,customer:text(d.customer),receiver:text(d.receiver),applicant:null,remark:text(d.remark),logisticsInfo},pages,diagnostics};
};
})();
