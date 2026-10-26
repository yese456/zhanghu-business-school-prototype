/* 工作台专用界面；线上观察记录见 outputs/aicard-workbench-repair-20261021。 */
(function () {
  'use strict';
  const S=window.SHARED,W=S.workbench,{ref,reactive,computed,watch,onUnmounted}=Vue,{ElMessage,ElMessageBox}=ElementPlus;
  const E=window.ERP_EXTRA=window.ERP_EXTRA||{};
  const WorkbenchReplica={
    emits:['go'],components:{OrderDetail:E.comps.OrderDetail,WorkbenchMetricDetail:E.comps.WorkbenchMetricDetail},
    setup(props,{emit}){
      const revision=ref(0),prefs=ref(W.preferences()),keyword=ref(''),applied=ref(''),group=ref('pending'),page=ref(1),size=ref(10);
      const sort=ref({prop:'createdAt',order:'descending'}),lastRefresh=ref(S.now()),error=ref(''),detail=ref(false),orderId=ref('');
      const coreRole=ref(prefs.value.coreRole),period=ref('month'),dates=ref(W.range('month')),appliedDates=ref(W.range('month'));
      const metricOpen=ref(false),metricKey=ref(''),metricRole=ref(''),metricDates=ref([]);
      const openMetric=c=>{metricKey.value=c.key;metricRole.value=coreRole.value;metricDates.value=appliedDates.value.slice();metricOpen.value=true;};
      const notificationOpen=ref(false),notificationRole=ref('销售/跟单');
      const quickOpen=ref(false),quickDraft=ref([]),createDraft=ref([]),quickError=ref(''),dragKey=ref(''),closing=ref(false);
      let quickBase='',quickEpoch=0,alive=true;
      const quickSnapshot=()=>JSON.stringify([quickDraft.value,createDraft.value]);
      const quickDirty=()=>quickOpen.value&&quickSnapshot()!==quickBase;
      watch(quickSnapshot,()=>quickEpoch++,{flush:'sync'});
      const release=S.registerLeaveGuard(quickDirty,'未保存的快捷入口配置',quickSnapshot);
      const update=()=>{revision.value++;prefs.value=W.preferences();};
      const storage=e=>{if(e.key==='aicard.demo.b:workbench:v1'||e.key==='aicard.demo.b:workbench:recent:v1')update();};
      const unload=e=>{if(quickDirty()){e.preventDefault();e.returnValue='';}};
      addEventListener('aicard:data',update);addEventListener('aicard:workbench',update);addEventListener('storage',storage);addEventListener('beforeunload',unload);
      onUnmounted(()=>{alive=false;release();removeEventListener('aicard:data',update);removeEventListener('aicard:workbench',update);removeEventListener('storage',storage);removeEventListener('beforeunload',unload);});
      const allTodos=computed(()=>{revision.value;return W.todos(prefs.value);});
      const groups=[{key:'today',label:'今日新增',color:'#7776e9'},{key:'pending',label:'待处理总数',color:'#8da4ed'},{key:'stale',label:'超过3天未处理',color:'#ad95e7'},{key:'overdue',label:'生产逾期',color:'#c18e7b'},{key:'done',label:'本月已处理',color:'#8bc77c'}];
      const stats=computed(()=>groups.map(g=>({...g,count:allTodos.value.filter(r=>W.matches(r,g.key,applied.value)).length})));
      const filtered=computed(()=>allTodos.value.filter(r=>W.matches(r,group.value,applied.value)).sort((a,b)=>{if(!sort.value.order)return 0;const n=String(a[sort.value.prop]||'').localeCompare(String(b[sort.value.prop]||''));return sort.value.order==='ascending'?n:-n;}));
      const paged=computed(()=>filtered.value.slice((page.value-1)*size.value,page.value*size.value));
      watch(()=>[group.value,applied.value,size.value],()=>page.value=1);
      watch(()=>filtered.value.length,n=>page.value=Math.min(page.value,Math.max(1,Math.ceil(n/size.value))));
      const search=()=>{applied.value=keyword.value.trim();page.value=1;};
      const reset=()=>{keyword.value='';applied.value='';group.value='pending';page.value=1;};
      const refresh=()=>{update();lastRefresh.value=S.now();ElMessage.success('工作台数据已刷新');};
      const onSort=s=>{sort.value=s;page.value=1;};
      const viewOrder=id=>{if(!W.unique('orders',id))return ElMessage.warning('订货单不存在或编号不唯一，请刷新后核实');orderId.value=id;detail.value=true;};
      const handle=r=>{if(!allTodos.value.some(x=>x.id===r.id))return ElMessage.warning('该待办状态已变化，请刷新后核实');if(r.target)emit('go',r.target);else viewOrder(r.orderId);};
      const quick=computed(()=>prefs.value.quick.map(k=>W.entries.find(e=>e.key===k)).filter(Boolean));
      const creates=computed(()=>prefs.value.creates.map(k=>W.creates.find(e=>e.key===k)).filter(Boolean));
      const goEntry=e=>emit('go',e.route+(e.key==='suppliers'||e.key==='changes'?'':e.key==='corrections'?'?panel=corrections':'?wbEntry='+encodeURIComponent(e.key)));
      const openQuick=()=>{quickDraft.value=S.clone(prefs.value.quick);createDraft.value=S.clone(prefs.value.creates);quickBase=quickSnapshot();quickError.value='';quickOpen.value=true;};
      const closeQuick=async done=>{if(closing.value)return;closing.value=true;const epoch=quickEpoch;try{if(quickDirty())await ElMessageBox.confirm('快捷入口配置尚未保存，是否放弃本次修改？','未保存的快捷入口',{type:'warning',confirmButtonText:'放弃修改',cancelButtonText:'继续编辑'});if(!alive||epoch!==quickEpoch)return;quickOpen.value=false;if(typeof done==='function')done();}catch(_){}finally{closing.value=false;}};
      const saveQuick=()=>{quickError.value='';try{const saved=W.preferences();if(JSON.stringify([saved.quick,saved.creates])!==quickBase)throw Error('快捷入口已在其他页面修改，请关闭后重新打开核实');W.savePreferences({quick:quickDraft.value,creates:createDraft.value});quickBase=quickSnapshot();quickOpen.value=false;ElMessage.success('快捷入口已保存');}catch(e){quickError.value=e.message;}};
      const move=(key,delta)=>{const i=quickDraft.value.indexOf(key),j=i+delta;if(i<0||j<0||j>=quickDraft.value.length)return;const a=quickDraft.value.slice();[a[i],a[j]]=[a[j],a[i]];quickDraft.value=a;};
      const drop=key=>{const from=quickDraft.value.indexOf(dragKey.value),to=quickDraft.value.indexOf(key);if(from<0||to<0)return;const a=quickDraft.value.slice();a.splice(to,0,a.splice(from,1)[0]);quickDraft.value=a;dragKey.value='';};
      const selectAll=value=>quickDraft.value=value?W.entries.slice(0,7).map(e=>e.key):[];
      const notifyRows=computed(()=>W.notifications[notificationRole.value].map(label=>({label,enabled:W.enabled(prefs.value,notificationRole.value,label)})));
      const notifyAll=computed(()=>notifyRows.value.every(r=>r.enabled));
      const notifySome=computed(()=>notifyRows.value.some(r=>r.enabled)&&!notifyAll.value);
      const changeNotification=(label,value)=>{error.value='';try{const next=W.preferences().notifications;next[notificationRole.value]=next[notificationRole.value]||{};(label?[label]:W.notifications[notificationRole.value]).forEach(k=>next[notificationRole.value][k]=value);W.savePreferences({notifications:next});}catch(e){error.value=e.message;}};
      const setRole=role=>{try{W.savePreferences({coreRole:role});coreRole.value=role;}catch(e){error.value=e.message;}};
      const changePeriod=kind=>{if(kind==='custom')return;dates.value=W.range(kind);appliedDates.value=dates.value.slice();};
      const applyDates=()=>{error.value='';const ds=dates.value;if(!Array.isArray(ds)||ds.length!==2||!ds.every(W.day)||ds[0]>ds[1]){error.value='请选择有效日期范围，结束日期不能早于开始日期';return;}appliedDates.value=ds.slice();};
      const core=computed(()=>{revision.value;return W.metrics(coreRole.value,appliedDates.value);});
      const recentSort=ref('descending');
      const recent=computed(()=>{revision.value;return W.recent().sort((a,b)=>recentSort.value==='ascending'?a.at.localeCompare(b.at):b.at.localeCompare(a.at));});
      const relative=at=>{const elapsed=Date.now()-new Date(at.replace(' ','T')).getTime();if(!Number.isFinite(elapsed))return '未记录';const minutes=Math.max(0,Math.floor(elapsed/60000));return minutes<1?'刚刚':minutes<60?minutes+'分钟前':minutes<1440?Math.floor(minutes/60)+'小时前':Math.floor(minutes/1440)+'天前';};
      let session=S.store.get('b:workbench:session');if(!session){session={at:S.now()};try{S.store.set('b:workbench:session',session);}catch(_){session={at:'未记录'};}}
      return {W,S,stats,keyword,applied,group,page,size,filtered,paged,search,reset,refresh,onSort,lastRefresh,error,detail,orderId,viewOrder,handle,quick,creates,goEntry,openQuick,quickOpen,quickDraft,createDraft,quickError,closeQuick,saveQuick,move,drop,dragKey,selectAll,notificationOpen,notificationRole,notifyRows,notifyAll,notifySome,changeNotification,coreRole,setRole,period,dates,appliedDates,changePeriod,applyDates,core,metricOpen,metricKey,metricRole,metricDates,openMetric,recent,recentSort,relative,session,emit};
    },
    template:`<section class="wb-replica" aria-label="工作台">
      <el-alert v-if="error" :title="error" type="error" show-icon closable @close="error=''" class="wb-error"/>
      <div class="wb-replica__grid">
        <section class="wb-panel wb-todos" data-demo="工作事项：五个统计卡片可切换任务分组；搜索匹配订货单、合作商与业主；数据随本机业务状态更新">
          <header class="wb-panel__head"><h2><i></i>我的工作事项</h2><el-tooltip :content="'最近刷新：'+lastRefresh"><el-button size="small" @click="refresh"><el-icon><Refresh/></el-icon>刷新数据</el-button></el-tooltip></header>
          <div class="wb-search"><el-input v-model="keyword" clearable placeholder="输入订货单编号/名称/内部单号/C端/业主" aria-label="工作事项搜索" @keyup.enter="search" @clear="search"><template #prefix><el-icon><Search/></el-icon></template></el-input><el-button type="primary" @click="search">搜索</el-button><el-button v-if="applied" @click="reset">重置</el-button><el-button text @click="notificationOpen=true"><el-icon><Setting/></el-icon>设置</el-button></div>
          <div class="wb-replica__stats"><button v-for="s in stats" :key="s.key" class="wb-replica__stat" :class="{active:group===s.key}" :style="{'--stat-color':s.color}" :aria-pressed="group===s.key" @click="group=s.key"><span>{{s.label}}</span><strong>{{s.count}}<small>个</small></strong></button></div>
          <el-table :data="paged" class="wb-task-table" row-key="id" height="100%" @sort-change="onSort" :default-sort="{prop:'createdAt',order:'descending'}" :row-class-name="({row})=>row.overdue?'wb-row-overdue':''">
            <el-table-column type="index" label="" width="38" :index="i=>(page-1)*size+i+1"/>
            <el-table-column prop="title" label="待办内容" min-width="170"><template #default="s"><el-button link :type="s.row.overdue?'danger':'primary'" class="wb-task-title" @click="handle(s.row)">{{s.row.title}}</el-button></template></el-table-column>
            <el-table-column prop="no" label="单号" min-width="150"><template #default="s"><el-button link type="primary" @click="handle(s.row)">{{s.row.name?s.row.name+'-':''}}{{s.row.no}}</el-button></template></el-table-column>
            <el-table-column prop="by" label="发起人" width="90"><template #default="s"><span>{{s.row.by}}</span><small class="wb-secondary">{{s.row.department}}</small></template></el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="112" sortable="custom"><template #default="s">{{W.day(s.row.createdAt)||'—'}}</template></el-table-column>
            <el-table-column prop="processedAt" label="处理时间" width="112" sortable="custom"><template #default="s">{{W.day(s.row.processedAt)||'—'}}</template></el-table-column>
            <el-table-column label="操作" width="95" fixed="right"><template #default="s"><el-button link type="primary" @click="handle(s.row)">{{s.row.done?'查看详情':s.row.action}}</el-button></template></el-table-column>
            <template #empty><el-empty :description="applied?'没有匹配的工作事项':'当前分组暂无工作事项'" :image-size="64"/></template>
          </el-table>
          <footer class="wb-pagination"><el-pagination small background layout="total,prev,pager,next" :total="filtered.length" :page-size="size" v-model:current-page="page" :pager-count="5"/><el-select v-model="size" size="small" aria-label="每页工作事项" style="width:100px"><el-option :value="10" label="10条/页"/><el-option :value="20" label="20条/页"/><el-option :value="50" label="50条/页"/></el-select></footer>
        </section>
        <div class="wb-replica__right">
          <section class="wb-profile"><span class="wb-profile__avatar">张</span><div><strong>张松涛 你好！祝你开心每一天！</strong><p>登录于：{{session.at}}</p></div></section>
          <section class="wb-panel wb-shortcuts" data-demo="快捷入口：最多3个创建入口、7个业务入口，可设置显示项与顺序并保存">
            <header class="wb-panel__head"><h2><i></i>快捷入口</h2><div class="wb-create-buttons"><el-button v-for="c in creates" :key="c.key" size="small" type="primary" plain @click="emit('go',c.route)"><el-icon><Plus/></el-icon>{{c.label}}</el-button></div><el-button text size="small" aria-label="设置快捷入口" @click="openQuick">设置<el-icon><Setting/></el-icon></el-button></header>
            <div v-if="quick.length" class="wb-replica__quick"><button v-for="q in quick" :key="q.key" @click="goEntry(q)" :aria-label="q.label"><span :style="{background:q.color}"><el-icon><component :is="q.icon"/></el-icon></span><small>{{q.label}}</small></button></div><p v-else class="wb-no-shortcuts">未选择快捷入口，可通过“设置”添加</p>
          </section>
          <section class="wb-panel wb-core" data-demo="核心数据：9个岗位视图，点击指标打开对应明细；卡片、筛选合计与导出使用相同业务记录">
            <header class="wb-panel__head"><h2><i></i>核心数据</h2><el-select :model-value="coreRole" @change="setRole" size="small" aria-label="核心数据岗位" style="width:126px"><el-option v-for="r in W.roles" :key="r" :label="r" :value="r"/></el-select><el-select v-model="period" @change="changePeriod" size="small" aria-label="核心数据期间" style="width:98px"><el-option label="本月" value="month"/><el-option label="今天" value="today"/><el-option label="上月" value="lastMonth"/><el-option label="本年" value="year"/><el-option label="自定义" value="custom"/></el-select></header>
            <div v-if="period==='custom'" class="wb-date-range"><el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" size="small" :clearable="false"/><el-button type="primary" size="small" @click="applyDates">查询</el-button></div>
            <div class="wb-replica__core"><button v-for="c in core" :key="c.key" type="button" class="wb-metric-card" :aria-label="c.label+'，'+(c.value===null?'未记录':c.value)+'，查看明细'" @click="openMetric(c)"><el-tooltip :content="c.tip" placement="top"><span class="wb-metric-label">{{c.label}}<el-icon><InfoFilled/></el-icon></span></el-tooltip><strong>{{c.value===null?'未记录':c.value}}</strong></button></div>
          </section>
          <section class="wb-panel wb-recent" data-demo="近期关注的订货单：实际查看后记录时间；按浏览时间排序，点击返回同一订单详情">
            <header class="wb-panel__head"><h2><i></i>近期关注的订货单</h2></header>
            <el-table :data="recent" height="100%" row-key="id" :default-sort="{prop:'at',order:'descending'}" @sort-change="s=>recentSort=s.order||'descending'"><el-table-column type="index" width="32"/><el-table-column prop="action" label="动作类型" width="105"/><el-table-column label="订货单名称/编号" min-width="165"><template #default="s"><el-button link type="primary" @click="viewOrder(s.row.id)">{{s.row.order.name?s.row.order.name+'-':''}}{{s.row.order.no}}</el-button></template></el-table-column><el-table-column prop="at" label="浏览时间" width="110" sortable="custom"><template #default="s"><el-tooltip :content="s.row.at"><span>{{relative(s.row.at)}}</span></el-tooltip></template></el-table-column><template #empty><el-empty description="浏览订货单后，将在这里显示" :image-size="48"/></template></el-table>
          </section>
        </div>
      </div>
      <el-dialog v-model="notificationOpen" title="待办设置" width="min(660px,94vw)" class="wb-settings" append-to-body destroy-on-close>
        <el-alert v-if="error" :title="error" type="error" :closable="false"/><el-tabs v-model="notificationRole"><el-tab-pane v-for="(list,role) in W.notifications" :key="role" :name="role" :label="role"/></el-tabs>
        <div class="wb-notification-head"><strong>待办通知</strong><span><el-tag v-if="notifySome" size="small" type="info">部分开启</el-tag><el-switch :model-value="notifyAll" :aria-label="notificationRole+'全部待办通知'" @change="v=>changeNotification('',v)"/></span></div>
        <div class="wb-notifications"><div v-for="r in notifyRows" :key="r.label"><span>{{r.label}}</span><el-switch :model-value="r.enabled" :aria-label="r.label" @change="v=>changeNotification(r.label,v)"/></div></div><p class="wb-setting-tip">开关即时保存，仅影响本机工作台通知展示。</p><template #footer><el-button @click="notificationOpen=false">关闭</el-button></template>
      </el-dialog>
      <el-dialog v-model="quickOpen" title="设置快捷入口" width="min(820px,94vw)" :close-on-click-modal="false" :before-close="closeQuick" class="wb-settings" append-to-body destroy-on-close>
        <el-alert v-if="quickError" :title="quickError" type="error" :closable="false"/>
        <div class="wb-choice-title"><el-checkbox :model-value="createDraft.length===3" :indeterminate="createDraft.length>0&&createDraft.length<3" @change="v=>createDraft=v?W.creates.map(c=>c.key):[]">创建入口（{{createDraft.length}}/3）</el-checkbox><span>创建入口最多只能选择3个</span></div>
        <el-checkbox-group v-model="createDraft" class="wb-create-choices" aria-label="创建入口选项"><el-checkbox v-for="c in W.creates" :key="c.key" :value="c.key">{{c.label}}</el-checkbox></el-checkbox-group>
        <div class="wb-choice-title"><el-checkbox :model-value="false" :indeterminate="quickDraft.length>0" @change="selectAll">所有选项（{{quickDraft.length}}/21）</el-checkbox><span>快捷入口最多只能选择7个</span></div>
        <el-checkbox-group v-model="quickDraft" :max="7" class="wb-entry-choices" aria-label="快捷入口选项"><el-checkbox v-for="e in W.entries" :key="e.key" :value="e.key">{{e.label}}</el-checkbox></el-checkbox-group>
        <div class="wb-selected-title"><strong>已选（{{quickDraft.length}}）</strong><span>拖动或使用箭头调整顺序</span><el-button link type="primary" :disabled="!quickDraft.length" @click="quickDraft=[]">清空</el-button></div>
        <div class="wb-selected"><div v-for="(key,i) in quickDraft" :key="key" draggable="true" @dragstart="dragKey=key" @dragover.prevent @drop.prevent="drop(key)"><el-icon><Rank/></el-icon><span>{{W.entries.find(e=>e.key===key).label}}</span><el-button text circle size="small" :aria-label="'上移'+W.entries.find(e=>e.key===key).label" :disabled="i===0" @click="move(key,-1)"><el-icon><ArrowUp/></el-icon></el-button><el-button text circle size="small" :aria-label="'下移'+W.entries.find(e=>e.key===key).label" :disabled="i===quickDraft.length-1" @click="move(key,1)"><el-icon><ArrowDown/></el-icon></el-button><el-button text circle size="small" :aria-label="'移除'+W.entries.find(e=>e.key===key).label" @click="quickDraft=quickDraft.filter(k=>k!==key)"><el-icon><Close/></el-icon></el-button></div><el-empty v-if="!quickDraft.length" description="暂无已选入口" :image-size="40"/></div>
        <template #footer><el-button @click="closeQuick()">取消</el-button><el-button type="primary" @click="saveQuick">确定</el-button></template>
      </el-dialog>
      <OrderDetail v-model="detail" :order-id="orderId" @go="v=>emit('go',v)"/>
      <WorkbenchMetricDetail v-model="metricOpen" :metric-key="metricKey" :role="metricRole" :dates="metricDates" @go="v=>emit('go',v)"/>
    </section>`
  };
  E.comps=Object.assign(E.comps||{},{WorkbenchReplica});E.custom={...(E.custom||{}),'workbench/index':'WorkbenchReplica'};
})();
