/* BIFF8 图片：按 MS-XLS 的工作表偏移和 MS-ODRAW 的 pib/ClientAnchor 归属，保留原始 JPG/PNG 字节。 */
(function(){
  'use strict';
  const join=chunks=>{const out=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let at=0;chunks.forEach(c=>{out.set(c,at);at+=c.length;});return out;};
  const view=bytes=>new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  function artRecords(bytes,start=0,end=bytes.length,depth=0){
    if(depth>32)throw Error('Excel 图片分组层级过深');const result=[],v=view(bytes);let at=start;
    while(at<end){if(end-at<8)throw Error('Excel 图片记录不完整');const flags=v.getUint16(at,true),type=v.getUint16(at+2,true),size=v.getUint32(at+4,true),from=at+8,to=from+size;if(to>end)throw Error('Excel 图片记录长度不正确');const node={type,instance:flags>>>4,from,to,bytes};if((flags&15)===15)node.children=artRecords(bytes,from,to,depth+1);result.push(node);at=to;}
    return result;
  }
  const flatten=nodes=>nodes.flatMap(n=>[n,...flatten(n.children||[])]);
  function xlsImages(book){
    const found=new Map(),entry=book.cfb?.FileIndex.find(e=>/^(Workbook|Book)$/i.test(e.name));if(!entry?.content)return found;
    const bytes=new Uint8Array(entry.content),v=view(bytes),records=[],sheets=[];let at=0;
    while(at+4<=bytes.length){const type=v.getUint16(at,true),size=v.getUint16(at+2,true);if(!type&&!size)break;const from=at+4,to=from+size;if(to>bytes.length)throw Error('Excel 工作簿记录不完整');records.push({type,at,from,to});if(type===0x85&&size>=8)sheets.push(v.getUint32(from,true));at=to;}
    if(!sheets.length)return found;const start=sheets[0],end=Math.min(...sheets.filter(n=>n>start),bytes.length),globalChunks=[],sheetChunks=[];let collecting='';
    for(const r of records){if(r.type===0xeb&&r.at<start)collecting='global';else if(r.type===0xec&&r.at>=start&&r.at<end)collecting='sheet';else if(r.type!==0x3c)collecting='';if(collecting&&(r.type===0xeb||r.type===0xec||r.type===0x3c))(collecting==='global'?globalChunks:sheetChunks).push(bytes.subarray(r.from,r.to));if(r.type===0x7f&&r.at>=start&&r.at<end)throw Error('该 XLS 使用旧式图片，请在 Excel 中另存为 XLSX 后导入，以保留图片');}
    if(!sheetChunks.length)return found;
    const groupNodes=flatten(artRecords(join(globalChunks))),stores=groupNodes.find(n=>n.type===0xf001)?.children||[],drawNodes=flatten(artRecords(join(sheetChunks)));
    for(const shape of drawNodes.filter(n=>n.type===0xf004)){
      let picture=0;for(const props of (shape.children||[]).filter(n=>[0xf00b,0xf121,0xf122].includes(n.type))){const pv=view(props.bytes);if(props.from+props.instance*6>props.to)throw Error('Excel 图片属性不完整');for(let i=0;i<props.instance;i++){const p=props.from+i*6,id=pv.getUint16(p,true);if((id&0x3fff)===0x104&&!(id&0x8000))picture=pv.getUint32(p+2,true);}}
      if(!picture)continue;const anchor=shape.children?.find(n=>n.type===0xf010);if(!anchor||anchor.to-anchor.from!==18)throw Error('Excel 图片缺少可识别的单元格位置');const av=view(anchor.bytes);if(av.getUint16(anchor.from+2,true)!==0)continue;const row=av.getUint16(anchor.from+6,true)+1;
      const bse=stores[picture-1];if(!bse||bse.type!==0xf007||bse.to-bse.from<36)throw Error('Excel 图片引用不存在');const from=bse.from+36+bse.bytes[bse.from+33];if(from+8>bse.to)throw Error('Excel 图片存储位置无法识别，请另存为 XLSX 后导入');const blip=artRecords(bse.bytes,from,bse.to)[0],png=blip.type===0xf01e,jpeg=[0xf01d,0xf02a].includes(blip.type);if(!png&&!jpeg)throw Error('第'+row+'行图片格式不支持，请转为 JPG/PNG 或另存为 XLSX 后导入');const one=png?[0x6e0]:[0x46a,0x6e2],two=png?[0x6e1]:[0x46b,0x6e3],skip=one.includes(blip.instance)?17:two.includes(blip.instance)?33:0;if(!skip||blip.from+skip>=blip.to)throw Error('第'+row+'行图片内容不完整');const data=blip.bytes.slice(blip.from+skip,blip.to);if(png?!(data[0]===0x89&&data[1]===0x50&&data[2]===0x4e&&data[3]===0x47):!(data[0]===0xff&&data[1]===0xd8))throw Error('第'+row+'行图片内容与格式不符');
      const file=new File([data],'xls-row-'+row+(png?'.png':'.jpg'),{type:png?'image/png':'image/jpeg'});if(!found.has(row))found.set(row,[]);found.get(row).push(file);
    }
    return found;
  }
  window.MALL_WORKBOOK_IMAGES={xlsImages};
})();
