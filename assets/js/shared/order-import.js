/* 产品销售明细的本地 Excel 预览；不调用线上导入或保存接口。 */
(function () {
  'use strict';
  const S = window.SHARED;
  S.orderImportHeaders = ['序号','产品图片','名称','编号','区域','品牌','材料/颜色','规格尺寸','产品说明','皮面','布面','大理石','金属','油漆','海绵','木面','数量','单位','面价','折扣(%)','订货价','订货价合计'];
  S.parseOrderSheet = workbook => {
    if (!workbook||!Array.isArray(workbook.SheetNames)||workbook.SheetNames.length!==1) throw new Error('本机产品导入仅支持1个工作表，请整理后重新选择');
    const name=workbook.SheetNames[0], sheet=workbook.Sheets?.[name];if(!sheet)throw new Error('工作表内容不存在');if(workbook.Workbook?.Sheets?.some(s=>s.Hidden))throw new Error('请取消隐藏工作表后重新导入');for(const key of ['!ref','!fullref']){if(!sheet[key])continue;let range;try{range=XLSX.utils.decode_range(sheet[key]);}catch(e){throw new Error('工作表有效范围异常');}if(range.s.r!==0||range.s.c!==0||range.e.r>=200||range.e.c>=100)throw new Error('工作表须从A1开始，最多200行（含空位及表头）、100列');}if(Object.entries(sheet).some(([key,cell])=>!key.startsWith('!')&&cell&&typeof cell==='object'&&cell.f!==undefined))throw new Error('请将公式转为明确数值后重新导入，不使用缓存计算结果');
    if ((sheet['!merges']||[]).length || (sheet['!rows']||[]).some(r=>r?.hidden) || (sheet['!cols']||[]).some(c=>c?.hidden)) throw new Error('请取消合并单元格及隐藏的行、列后重新导入');
    const data=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:true,blankrows:true});
    if (data.length>200) throw new Error('首个工作表最多 200 行（含表头）');
    const heads=(data.shift()||[]).map(v=>String(v).trim());
    if (heads.length!==S.orderImportHeaders.length || heads.some((v,i)=>v!==S.orderImportHeaders[i])) throw new Error('表头名称或顺序不符，请下载本页模板后填写');
    const number=(v,label,row,optional)=>{if(v===''||v==null){if(optional)return null;throw new Error('第 '+row+' 行缺少'+label);}const n=Number(v);if(!Number.isFinite(n)||n<0)throw new Error('第 '+row+' 行的'+label+'必须为非负数字');return n;};
    const rows=data.map((a,i)=>{
      const n=i+2;if(a.every(v=>v===''||v===null||v===undefined))return null;const get=k=>a[heads.indexOf(k)]??'',code=String(get('编号')).trim(),catalog=S.db.all('products'),matches=code?catalog.filter(p=>p.sku===code):[];if(matches.length>1)throw new Error('第 '+n+' 行产品编号不唯一，请核实目录');const p=matches[0];if(p&&(!p.id||catalog.filter(x=>x.id===p.id).length!==1))throw new Error('第 '+n+' 行产品内部ID不唯一，请核实目录');
      if(!String(get('名称')).trim())throw new Error('第 '+n+' 行缺少名称');
      const qty=number(get('数量'),'数量',n,false);if(qty<=0)throw new Error('第 '+n+' 行数量必须大于 0');
      const price=number(get('订货价'),'订货价',n,true), face=number(get('面价'),'面价',n,true), discount=number(get('折扣(%)'),'折扣',n,true), total=number(get('订货价合计'),'订货价合计',n,true);
      if(discount!==null&&discount>100)throw new Error('第 '+n+' 行折扣须在 0–100 之间');
      if(total!==null&&price!==null&&Math.abs(total-qty*price)>.011)throw new Error('第 '+n+' 行订货价合计与数量 × 订货价不符');
      return {id:p?.id||S.newId('CUSTOM'),key:S.newId('LINE'),name:String(get('名称')).trim(),code:String(get('编号')),area:String(get('区域')),brand:String(get('品牌')),mat:String(get('材料/颜色')),spec:String(get('规格尺寸')),desc:String(get('产品说明')),leather:String(get('皮面')),fabric:String(get('布面')),marble:String(get('大理石')),metal:String(get('金属')),paint:String(get('油漆')),sponge:String(get('海绵')),wood:String(get('木面')),qty,unit:String(get('单位')),face,discount,price,pricePending:price===null,img:p?.img||'',materialFiles:{},materialStates:{}};
    }).filter(Boolean);
    if(!rows.length)throw new Error('表头下没有产品明细');
    return {name,rows,unpriced:rows.filter(r=>r.price===null).length,unmatched:rows.filter(r=>!r.img).length};
  };
})();
