/* 核心数据明细：与卡片共用统计定义，只读取共享业务实体。 */
(function () {
  'use strict';
  const S=window.SHARED,W=S.workbench,{ref,reactive,computed,watch,onUnmounted}=Vue,{ElMessage}=ElementPlus;
  const E=window.ERP_EXTRA=window.ERP_EXTRA||{};
  const WorkbenchMetricDetail={
    props:{modelValue:Boolean,metricKey:String,role:String,dates:Array},emits:['update:modelValue','go'],components:{OrderDetail:E.comps.OrderDetail},
    setup(props,{emit}){
      const version=ref(0),expanded=ref(false),queryDates=ref([]),appliedDates=ref([]),error=ref(''),page=ref(1),jumpInput=ref('1'),size=ref(10),table=ref(null);
      const blank=()=>({keyword:'',status:'',payStatus:'',customer:'',customerName:''}),query=reactive(blank()),applied=ref(blank()),sort=ref({});
      const entityOpen=ref(false),entityId=ref(''),orderOpen=ref(false),orderId=ref('');
      const refresh=()=>version.value++;addEventListener('aicard:data',refresh);addEventListener('aicard:workbench',refresh);
      onUnmounted(()=>{removeEventListener('aicard:data',refresh);removeEventListener('aicard:workbench',refresh);});
      const resetPage=()=>{page.value=1;jumpInput.value='1';};
      watch(()=>[props.modelValue,props.metricKey,props.role],()=>{if(!props.modelValue)return;queryDates.value=(props.dates||[]).slice();appliedDates.value=queryDates.value.slice();Object.assign(query,blank());applied.value=blank();sort.value={};resetPage();expanded.value=false;error.value='';entityOpen.value=false;orderOpen.value=false;});
      const context=computed(()=>{version.value;if(!props.modelValue)return {def:null,error:''};try{return {def:W.metricDetail(props.role,props.metricKey,appliedDates.value),error:''};}catch(e){return {def:null,error:'明细读取失败：'+e.message};}});
      const def=computed(()=>context.value.def),rows=computed(()=>W.queryMetric(def.value,applied.value,sort.value)),shown=computed(()=>rows.value.slice((page.value-1)*size.value,page.value*size.value));
      const totals=computed(()=>W.metricSummary(def.value,rows.value));
      const options=computed(()=>Object.fromEntries(['status','payStatus','customer','customerName'].map(k=>[k,[...new Set((def.value?.rows||[]).map(r=>r[k]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'zh-CN'))])));
      const columns=computed(()=>{const cs=def.value?.columns||[];if(def.value?.kind==='orders'&&['unpaid','paid'].includes(def.value.field))return [...cs.filter(c=>c.prop===def.value.field),...cs.filter(c=>c.prop!==def.value.field)];return cs;});
      const filtered=computed(()=>Object.values(applied.value).some(Boolean));
      watch(()=>[rows.value.length,size.value],()=>page.value=Math.min(page.value,Math.max(1,Math.ceil(rows.value.length/size.value))));
      watch(size,resetPage);
      watch(page,n=>jumpInput.value=String(n));
      const search=()=>{error.value='';if(!def.value?.snapshot&&def.value?.mode!=='missing'){const d=queryDates.value;if(!Array.isArray(d)||d.length!==2||!d.every(W.day)||d[0]>d[1]){error.value='请选择有效日期范围，结束日期不能早于开始日期';return;}appliedDates.value=d.slice();}applied.value={...query,keyword:query.keyword.trim()};resetPage();};
      const reset=()=>{Object.assign(query,blank());applied.value=blank();queryDates.value=(props.dates||[]).slice();appliedDates.value=queryDates.value.slice();resetPage();sort.value={};error.value='';table.value?.clearSort();};
      const sortChange=s=>{sort.value={prop:s.prop,order:s.order};resetPage();};
      const jumpPage=()=>{const n=Number(jumpInput.value),max=Math.max(1,Math.ceil(rows.value.length/size.value));if(!/^\d+$/.test(jumpInput.value)||!Number.isSafeInteger(n)||n<1){error.value='页码须为大于0的整数';return;}error.value='';page.value=Math.min(n,max);jumpInput.value=String(page.value);};
      const close=()=>{entityOpen.value=false;orderOpen.value=false;emit('update:modelValue',false);};
      const viewOrder=row=>{if(!row.orderId||!W.unique('orders',row.orderId))return ElMessage.warning('关联订货单未记录、已删除或不唯一，请核实');orderId.value=row.orderId;orderOpen.value=true;};
      const viewEntity=row=>{entityId.value=row.id;entityOpen.value=true;};
      const entity=computed(()=>def.value?.rows.find(r=>r.id===entityId.value)||null);
      const display=(row,c)=>{const v=row[c.prop];return c.type==='money'?(typeof v==='number'&&Number.isFinite(v)?S.money(v):'未记录'):v===null||v===undefined||v===''?'—':v;};
      const periodText=computed(()=>def.value?.snapshot?'当前状态快照':appliedDates.value.join(' 至 '));
      const exportRows=()=>{
        error.value='';try{
          if(!def.value||def.value.mode==='missing'||!rows.value.length)throw Error('当前没有可导出的明细');
          const headers=columns.value.map(c=>c.label),data=rows.value.map(r=>columns.value.map(c=>{const v=r[c.prop];return v===null||v===undefined||v===''?(c.type==='money'?'未记录':''):v;}));
          const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([headers,...data]),'指标明细');
          const conditions=[['指标',def.value.label],['岗位',props.role],['统计范围',periodText.value],['统计说明',def.value.tip],['搜索词',applied.value.keyword],['状态',applied.value.status||'全部'],['回款状态',applied.value.payStatus||'全部'],['合作商',applied.value.customer||'全部'],['C端/业主',applied.value.customerName||'全部'],['明细条数',rows.value.length],['指标合计',totals.value.value],['导出时间',S.now()]];
          XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(conditions),'统计条件');
          const bytes=XLSX.write(book,{bookType:'xlsx',type:'array'});if(!bytes.byteLength)throw Error('导出文件生成为空');
          S.download('核心数据-'+def.value.label+'-'+W.today()+'.xlsx',bytes,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');ElMessage.success('已生成当前筛选的'+rows.value.length+'条明细');
        }catch(e){error.value=e.message;}
      };
      return {S,W,def,context,expanded,queryDates,appliedDates,error,page,jumpInput,size,table,query,applied,sort,rows,shown,totals,options,columns,filtered,search,reset,sortChange,jumpPage,close,viewOrder,viewEntity,entityOpen,entity,orderOpen,orderId,display,periodText,exportRows,emit};
    },
    template:`<el-drawer :model-value="modelValue" @update:model-value="$emit('update:modelValue',$event)" direction="rtl" :size="expanded?'100%':'75%'" :show-close="false" append-to-body destroy-on-close class="wb-metric-drawer" @closed="entityOpen=false;orderOpen=false">
      <template #header><div class="wb-metric-heading"><h2>{{def?.label||'核心数据明细'}}</h2><el-tag size="small" type="info">{{role}}</el-tag><span></span><el-button text circle :aria-label="expanded?'还原明细窗口':'放大明细窗口'" @click="expanded=!expanded"><el-icon><FullScreen/></el-icon></el-button><el-button text circle aria-label="关闭核心数据明细" @click="close"><el-icon><Close/></el-icon></el-button></div></template>
      <el-alert v-if="error||context.error" :title="error||context.error" type="error" :closable="false" show-icon/>
      <el-empty v-if="!def&&!context.error" description="指标不存在或当前岗位不可用"/>
      <template v-if="def">
        <p class="wb-metric-scope">{{def.tip}}</p>
        <template v-if="def.mode==='missing'"><el-result icon="info" title="未记录" :sub-title="def.notice"/><div class="wb-metric-missing"><el-button @click="close">关闭</el-button></div></template>
        <template v-else>
          <el-form class="wb-metric-filters" label-position="top" size="small" @submit.prevent="search">
            <el-form-item v-if="!def.snapshot" :label="def.dateLabel" class="wb-metric-dates"><el-date-picker v-model="queryDates" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" aria-label="明细日期范围" :clearable="false"/></el-form-item>
            <el-form-item v-else label="统计范围"><span class="wb-metric-snapshot">当前状态快照</span></el-form-item>
            <el-form-item :label="def.kind==='orders'?'订货单状态':'状态'"><el-select v-model="query.status" clearable placeholder="全部" aria-label="明细状态"><el-option v-for="s in options.status" :key="s" :label="s" :value="s"/></el-select></el-form-item>
            <el-form-item label="合作商"><el-select v-model="query.customer" filterable clearable placeholder="请选择合作商" aria-label="明细合作商"><el-option v-for="s in options.customer" :key="s" :label="s" :value="s"/></el-select></el-form-item>
            <el-form-item label="C端/业主"><el-select v-model="query.customerName" filterable clearable placeholder="请选择C端/业主" aria-label="明细C端/业主"><el-option v-for="s in options.customerName" :key="s" :label="s" :value="s"/></el-select></el-form-item>
            <el-form-item label="搜索" class="wb-metric-keyword"><el-input v-model="query.keyword" clearable placeholder="产品/单号/内部单号/合作商" aria-label="明细搜索" @keyup.enter="search"/></el-form-item>
            <el-form-item v-if="def.kind==='orders'" label="回款状态"><el-select v-model="query.payStatus" clearable placeholder="全部" aria-label="明细回款状态"><el-option v-for="s in options.payStatus" :key="s" :label="s" :value="s"/></el-select></el-form-item>
            <el-form-item class="wb-metric-query-actions"><el-button type="primary" @click="search">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
          </el-form>
          <div class="wb-metric-summary"><span>{{filtered?'筛选后':'当前'}}明细：<b>{{totals.count}}</b>条</span><span>{{def.label}}：<strong>{{totals.value}}</strong></span><span v-if="def.mode==='rate'">已完成 {{totals.finished}} / 计划 {{totals.count}}</span><el-button size="small" :disabled="!rows.length" @click="exportRows"><el-icon><Download/></el-icon>导出</el-button></div>
          <p v-if="totals.missing" class="wb-metric-warning">{{totals.missing}}条记录的统计字段未记录或无效，合计显示“未记录”，请核实明细。</p>
          <div v-if="totals.units.length&&def.kind!=='orders'" class="wb-metric-units">按单位：<span v-for="u in totals.units" :key="u.unit">{{u.qty}} {{u.unit}}</span></div>
          <el-table ref="table" :key="metricKey" :data="shown" row-key="id" border size="small" height="100%" class="wb-metric-table" @sort-change="sortChange">
            <el-table-column v-for="c in columns" :key="c.prop" :prop="c.prop" :label="c.label" :min-width="c.width" :align="c.type==='money'||c.type==='number'?'right':'left'" sortable="custom" :show-overflow-tooltip="c.type!=='entity'&&c.type!=='order'">
              <template #default="s"><template v-if="c.type==='order'"><el-button v-if="s.row.orderId" link type="primary" @click="viewOrder(s.row)">{{s.row.orderName?s.row.orderName+'-':''}}{{s.row.orderNo}}</el-button><span v-else>{{display(s.row,c)}}</span></template><el-button v-else-if="c.type==='entity'&&s.row[c.prop]" link type="primary" @click="viewEntity(s.row)">{{display(s.row,c)}}</el-button><el-tag v-else-if="c.type==='status'&&s.row[c.prop]" size="small" :type="S.tagType(s.row[c.prop])">{{display(s.row,c)}}</el-tag><span v-else>{{display(s.row,c)}}</span></template>
            </el-table-column>
            <el-table-column v-if="['tasks','purchases','inventory'].includes(def.kind)" label="操作" width="95" fixed="right"><template #default="s"><el-button link type="primary" @click="viewEntity(s.row)">查看详情</el-button></template></el-table-column>
            <template #empty><el-empty :description="filtered?'没有匹配的明细，请调整筛选条件':'当前统计范围暂无明细'" :image-size="70"/></template>
          </el-table>
          <footer class="wb-metric-pagination"><el-pagination small background v-model:current-page="page" v-model:page-size="size" :total="rows.length" :page-sizes="[10,20,50]" :pager-count="5" layout="total,sizes,prev,pager,next"/><label class="wb-metric-jump">前往<el-input v-model="jumpInput" size="small" aria-label="明细页码" inputmode="numeric" @keyup.enter="jumpPage"/>页<el-button size="small" @click="jumpPage">跳转</el-button></label></footer>
        </template>
      </template>
      <el-dialog v-model="entityOpen" :title="def?.kind==='purchases'?'采购明细':def?.kind==='tasks'?'生产任务明细':def?.kind==='inventory'?'库存明细':'产品明细'" width="min(850px,94vw)" append-to-body destroy-on-close class="wb-metric-entity">
        <template v-if="entity"><el-image v-if="entity.img" :src="entity.img" :preview-src-list="[entity.img]" preview-teleported fit="cover" class="wb-metric-product-image"/><el-descriptions :column="2" border size="small"><el-descriptions-item v-for="c in columns" :key="c.prop" :label="c.label"><el-button v-if="c.type==='order'&&entity.orderId" link type="primary" @click="viewOrder(entity)">{{entity.orderNo}}</el-button><span v-else>{{display(entity,c)}}</span></el-descriptions-item></el-descriptions><p class="wb-metric-scope">{{entity.spec? '规格：'+entity.spec+'　':''}}{{entity.material?'材质：'+entity.material:''}}</p></template><el-empty v-else description="该记录状态已变化或已删除，请关闭后重新查询"/><template #footer><el-button @click="entityOpen=false">关闭</el-button></template>
      </el-dialog>
      <OrderDetail v-model="orderOpen" :order-id="orderId" @go="v=>emit('go',v)"/>
    </el-drawer>`
  };
  E.comps=Object.assign(E.comps||{},{WorkbenchMetricDetail});
})();
