/* 交货资料的静态参考布局；不执行原站模板、不打印、不写业务或偏好。 */
(function () {
'use strict';
const {ref,watch,onUnmounted}=Vue;
window.DeliveryLayoutPreview={
 name:'DeliveryLayoutPreview',
 props:{modelValue:Boolean,sourceId:{type:String,default:''}},
 emits:['update:modelValue'],
 setup(props,{emit}){
  const projection=ref(null),error=ref('');
  const text=value=>value===null||value===undefined||value===''?'未记录':String(value);
  const fields=[['receiver','收货人'],['phone','电话'],['address','收货地址'],['company','物流公司'],['trackingNo','物流单号'],['contact','物流联系人'],['companyPhone','物流联系电话'],['plate','车牌号']];
  function refresh(){
   projection.value=null;error.value='';
   if(!props.modelValue)return;
   try{
    const value=window.SHARED.deliveryLayoutProjection(props.sourceId);
    if(!value||!value.document||!Array.isArray(value.pages)||!Array.isArray(value.diagnostics))throw Error('交货布局资料格式异常');
    projection.value=value;
   }catch(e){error.value=e?.message||'交货资料读取失败';}
  }
  const close=()=>emit('update:modelValue',false);
  watch(()=>[props.modelValue,props.sourceId],refresh,{immediate:true});
  window.addEventListener('aicard:data',refresh);
  onUnmounted(()=>window.removeEventListener('aicard:data',refresh));
  return {projection,error,text,fields,close};
 },
 template:`<el-dialog :model-value="modelValue" @update:model-value="v=>!v&&close()" title="交货资料 · 静态参考布局" width="min(1240px,calc(100vw - 24px))" top="3vh" append-to-body destroy-on-close class="delivery-layout-dialog">
 <el-alert title="本机资料的静态参考布局，非原站模板运行样张，不构成真实出库凭证。不生成打印记录，不提供打印或 PDF。" type="warning" :closable="false" show-icon/>
 <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="dlp-message"/>
 <template v-else-if="projection">
 <ul v-if="projection.diagnostics.length" class="dlp-diagnostics" aria-label="资料诊断"><li v-for="(d,i) in projection.diagnostics" :key="i">{{text(d)}}</li></ul>
 <el-empty v-if="!projection.pages.length" description="暂无交货产品资料"/>
 <div v-else class="dlp-scroll" tabindex="0" role="region" aria-label="交货参考页，可横向滚动查看完整内容">
 <article v-for="page in projection.pages" :key="page.number" class="dlp-page" :aria-label="'第 '+page.number+' 页，共 '+page.total+' 页'">
 <template v-if="page.first"><h2 class="dlp-title">交货单 · 资料参考</h2><dl class="dlp-head"><div><dt>交货单号</dt><dd>{{text(projection.document.no)}}</dd></div><div><dt>申请人</dt><dd>{{text(projection.document.applicant)}}</dd></div><div><dt>合作商</dt><dd>{{text(projection.document.customer)}}</dd></div><div><dt>C端/业主</dt><dd>{{text(projection.document.receiver)}}</dd></div><div v-for="f in fields" :key="f[0]"><dt>{{f[1]}}</dt><dd>{{text((projection.document.logisticsInfo||{})[f[0]])}}</dd></div></dl></template>
 <table class="dlp-products"><caption>交货产品资料（数量不等于实际出库量）</caption><colgroup><col class="dlp-index"/><col/><col class="dlp-image-col"/><col/><col/><col/><col/><col/><col/><col/><col/><col/></colgroup><thead><tr><th scope="col">序号</th><th scope="col">产品</th><th scope="col">图片</th><th scope="col">规格</th><th scope="col">材质</th><th scope="col">订货单号</th><th scope="col">内部单号</th><th scope="col">体积（资料）</th><th scope="col">包装件数（资料）</th><th scope="col">交货数量（资料）</th><th scope="col">单位</th><th scope="col">仓库</th></tr></thead><tbody><tr v-for="(row,i) in page.items" :key="i"><td>{{text(row.index)}}</td><td>{{text(row.product)}}</td><td><span v-if="row.img" class="dlp-image-note">图片已记录（本参考不加载外部图片）</span><span v-else>未记录</span></td><td>{{text(row.spec)}}</td><td>{{text(row.material)}}</td><td>{{text(row.orderNo)}}</td><td>{{text(row.innerNo)}}</td><td>{{text(row.volume)}}</td><td>{{text(row.packages)}}</td><td>{{text(row.qty)}}</td><td>{{text(row.unit)}}</td><td>{{text(row.warehouse)}}</td></tr></tbody></table>
 <template v-if="page.last"><p class="dlp-unverified">出库合计：未核实（不按交货数量推算）</p><dl class="dlp-remark"><dt>备注</dt><dd>{{text(projection.document.remark)}}</dd></dl></template>
 <footer class="dlp-page-footer"><span>静态参考 · 非真实出库凭证</span><span>第 {{page.number}} 页 / 共 {{page.total}} 页</span></footer>
 </article></div></template>
 <template #footer><el-button @click="close">关闭</el-button></template></el-dialog>`
};
})();
