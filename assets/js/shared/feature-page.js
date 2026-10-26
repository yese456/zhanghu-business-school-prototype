/* ============================================================
   系统 A 专属功能页（开关型 / 分步接入 / 交接 / 云服务 / 工单统计）
   这些页面线上不是表格结构，按各自形态单独还原
   ============================================================ */
(function () {
  'use strict';
  const { ref, reactive, computed } = Vue;
  const { ElMessage, ElMessageBox } = ElementPlus;

  const FeaturePage = {
    name: 'FeaturePage',
    props: { spec: { type: Object, required: true }, routeKey:String },
    setup(props,{emit}) {
      const S=window.SHARED,key='feature:'+props.routeKey;
      const state=reactive(Object.assign({on:props.spec.on!==false,rows:[],records:S.clone(props.spec.records||[]),bindings:null,applied:false,configs:{},capacity:200,flow:197.36},S.store.get(key)||{}));
      const persist=()=>S.store.set(key,S.clone(state));
      const on=computed(()=>state.on),rows=computed(()=>state.rows),records=computed(()=>state.records);
      const toggle=()=>{const before=state.on;state.on=!before;try{persist();ElMessage.success((state.on?'已开启':'已关闭')+props.spec.title);}catch(e){state.on=before;}};
      const dialog=reactive({open:false,title:'',kind:'',id:'',name:'',code:'',value:'',files:[],enabled:true}),busy=ref(false),pick=reactive({from:'',to:''});
      const people={lm:'李明',wf:'王芳',zst:'张松涛',czy:'陈志远'};
      const edit=r=>{Object.assign(dialog,{open:true,title:props.spec.action||'新增',kind:'entry',id:r?.id||'',name:r?.name||'',code:r?.code||'',files:S.clone(r?.files||[])});};
      const remove=r=>ElMessageBox.confirm('删除「'+r.name+'」？','删除记录').then(()=>{if(props.routeKey==='unit/index'&&S.db.all('products').some(p=>p.unit===r.name))return ElMessage.warning('该单位正在被商品使用，不能删除');state.rows=state.rows.filter(x=>x.id!==r.id);persist();}).catch(()=>{});
      const act=t=>{
        if(props.spec.kind==='empty')return edit();
        if(props.spec.kind==='handover')return ElMessageBox.confirm('将所选人员的本地演示客户和订单交给接收方？','确认交接').then(()=>{if(!pick.from||!pick.to)return;const from=people[pick.from],to=people[pick.to];['orders','customers'].forEach(k=>S.db.all(k).filter(r=>r.owner===from).slice().forEach(r=>S.db.upsert(k,Object.assign({},r,{owner:to}))));state.records.unshift({t:'客户与订货单交接',from,to,time:S.now()});persist();pick.from=pick.to='';ElMessage.success('本地客户、订单归属和交接记录已更新');}).catch(()=>{});
        if(props.spec.kind==='steps'){
          if(t==='立即申请'){if(!state.bindings)return ElMessage.warning('请先关联视频号');state.applied=true;persist();return ElMessage.success('已生成本地申请记录，可在当前页查看；未向微信提交');}
          Object.assign(dialog,{open:true,title:'关联视频号',kind:'binding',name:state.bindings?.name||'',code:state.bindings?.code||''});return;
        }
        if(props.spec.kind==='storage'){Object.assign(dialog,{open:true,title:t,kind:t==='查看明细'?'usage':'storage',name:t,value:100});return;}
        const routes={'推广员管理':'promoter','商品管理':'eprProduct'};
        if(routes[t]&&window.SCHEMA_A[routes[t]])return emit('go',routes[t]);
        const config=state.configs[t]||{};Object.assign(dialog,{open:true,title:t,kind:'config',name:config.name||t,code:config.code||'',value:config.value||'',enabled:config.enabled!==false});
      };
      const save=()=>{
        if(dialog.kind==='entry'){
          if(!dialog.name.trim())return ElMessage.warning('请填写名称');
          if(state.rows.some(r=>r.name===dialog.name.trim()&&r.id!==dialog.id))return ElMessage.warning('名称已存在');
          if(props.routeKey==='sceneLibrary'&&!dialog.files.length)return ElMessage.warning('请上传场景图片');
          const r={id:dialog.id||S.newId('CFG'),name:dialog.name.trim(),files:S.clone(dialog.files),code:dialog.code,updated:S.now()},i=state.rows.findIndex(r=>r.id===dialog.id);
          if(i<0)state.rows.push(r);else{const before=state.rows[i].name;state.rows.splice(i,1,r);if(props.routeKey==='unit/index'&&before!==r.name)S.db.all('products').filter(p=>p.unit===before).slice().forEach(p=>S.db.upsert('products',Object.assign({},p,{unit:r.name})));}
        }else if(dialog.kind==='binding'){
          if(!dialog.name.trim()||!dialog.code.trim())return ElMessage.warning('请填写视频号名称和视频号 ID');state.bindings={name:dialog.name.trim(),code:dialog.code.trim(),at:S.now()};state.applied=false;
        }else if(dialog.kind==='config')state.configs[dialog.title]={name:dialog.name,code:dialog.code,value:dialog.value,enabled:dialog.enabled};
        else if(dialog.kind==='storage'){
          if(!Number.isFinite(Number(dialog.value))||Number(dialog.value)<=0)return ElMessage.warning('请选择有效容量');
          if(dialog.name==='购买存储')state.capacity+=Number(dialog.value);else state.flow+=Number(dialog.value);
          state.records.unshift({t:'本地演示额度变更',from:dialog.name,to:dialog.value+'GB',time:S.now()});
        }
        persist();dialog.open=false;ElMessage.success('已保存到当前浏览器演示数据');
      };
      return {state,on,rows,records,toggle,act,pick,dialog,edit,remove,save,busy};
    },
    template: `
    <div class="fp2">
      <TipsBar v-if="spec.tips && spec.tips.length" :tips="spec.tips" />

      <!-- 开关型 -->
      <div class="fp2-card toggle" v-if="spec.kind==='toggle'">
        <div class="l">
          <div class="t">「{{ spec.title }}」{{ on ? '已开启' : '已关闭' }}</div>
          <div class="d">{{ spec.desc }}</div>
        </div>
        <el-button :type="on?'default':'primary'" @click="toggle">{{ on ? '立即停用' : '立即开启' }}</el-button>
      </div>

      <!-- 分步接入 -->
      <div class="fp2-steps" v-if="spec.kind==='steps'">
        <div class="fp2-step" v-for="(s,i) in spec.steps" :key="i">
          <div class="no">{{ s.no }}</div>
          <div class="bd">
            <div class="t">{{ s.t }}</div>
            <div class="d">{{ s.d }}</div>
          </div>
          <el-tag v-if="i===0&&state.bindings" type="success">已关联 {{state.bindings.name}}</el-tag><el-tag v-if="i===1&&state.applied">本地申请已记录</el-tag><el-button type="primary" plain @click="act(s.btn)">{{i===0&&state.bindings?'修改关联':s.btn}}</el-button>
        </div>
      </div>

      <!-- 交接 -->
      <div class="fp2-card" v-if="spec.kind==='handover'">
        <div class="hd"><b>选择交接人</b><span class="sub">原型仅转移本地客户与订单归属，保留人员记录</span></div>
        <div class="row">
          <el-select v-model="pick.from" placeholder="请选择交出方" style="width:220px">
            <el-option label="李明（销售部）" value="lm" /><el-option label="王芳（客服部）" value="wf" />
          </el-select>
          <el-icon style="color:#c0c4cc"><Right /></el-icon>
          <el-select v-model="pick.to" placeholder="请选择接收方" style="width:220px">
            <el-option label="张松涛（销售部）" value="zst" /><el-option label="陈志远（销售部）" value="czy" />
          </el-select>
          <el-button type="primary" :disabled="!pick.from||!pick.to" @click="act('进行交接')">进行交接</el-button>
        </div>
        <div class="tip" v-if="!pick.from||!pick.to">请先选择交出方和接收方，再进行交接。</div>
        <div class="rec">
          <div class="rec-hd">交接记录</div>
          <div class="rec-row" v-for="(r,i) in records" :key="i">
            <span>{{ r.t }}</span><span class="m">{{ r.from }} → {{ r.to }}</span><span class="m">{{ r.time }}</span><span class="ok">已完成</span>
          </div>
        </div>
      </div>

      <!-- 云服务 -->
      <div class="fp2-grid" v-if="spec.kind==='storage'">
        <div class="fp2-card">
          <div class="hd"><b>存储容量</b><span class="r"><el-button size="small" type="primary" plain @click="act('购买存储')">购买存储</el-button></span></div>
          <div class="metric">{{ spec.used }}<span>/ {{ state.capacity }}GB</span></div>
          <div class="bar"><i :style="{width: spec.rate+'%'}"></i></div>
          <div class="mini">已使用 {{ spec.rate }}%</div>
        </div>
        <div class="fp2-card">
          <div class="hd"><b>剩余可用流量</b><span class="r"><el-button size="small" plain @click="act('购买流量')">购买流量</el-button>
            <el-button size="small" plain @click="act('查看明细')">查看明细</el-button></span></div>
          <div class="metric">{{ state.flow.toFixed(2) }}GB</div>
          <div class="bar"><i style="width:2%"></i></div>
          <div class="mini">本月已用 5.64GB</div>
        </div>
      </div>
      <div class="fp2-card notes" v-if="spec.kind==='storage' && spec.notes">
        <div class="hd"><b>云服务说明</b></div>
        <div class="note" v-for="(n,i) in spec.notes" :key="i"><b>{{ n.t }}</b><p>{{ n.d }}</p></div>
      </div>

      <!-- 工单统计 -->
      <div class="fp2-grid four" v-if="spec.kind==='stats'">
        <div class="fp2-card" v-for="(k,i) in spec.kpi" :key="i">
          <div class="mini">{{ k.label }}</div>
          <div class="metric sm">{{ k.value }}</div>
        </div>
      </div>
      <div class="fp2-card" v-if="spec.kind==='stats'">
        <div class="hd"><b>工单类型分布</b></div>
        <div class="dist" v-for="(d,i) in spec.dist" :key="i">
          <span class="n">{{ d.t }}</span>
          <span class="bar"><i :style="{width:d.p+'%'}"></i></span>
          <span class="v">{{ d.p }}%</span>
        </div>
      </div>

      <!-- 空态型 -->
      <div class="fp2-card empty" v-if="spec.kind==='empty' && !rows.length">
        <div class="ico">▤</div>
        <div class="t">{{ spec.emptyText || '暂无数据' }}</div>
        <div class="d">{{ spec.desc }}</div>
        <el-button type="primary" @click="act(spec.action||'新增')">{{ spec.action || '新增' }}</el-button>
      </div>

      <div class="fp2-card" v-if="spec.kind==='empty'&&rows.length"><div class="hd"><b>{{spec.name}}</b><el-button type="primary" size="small" @click="edit()">{{spec.action}}</el-button></div><el-table :data="rows"><el-table-column prop="name" label="名称"/><el-table-column v-if="routeKey==='sceneLibrary'" label="场景图片"><template #default="s"><el-image v-for="f in s.row.files" :key="f.uid" :src="f.url" :preview-src-list="s.row.files.map(x=>x.url)" style="width:70px;height:60px" fit="cover"/></template></el-table-column><el-table-column prop="updated" label="更新时间"/><el-table-column label="操作"><template #default="s"><el-button link type="primary" @click="edit(s.row)">编辑</el-button><el-button link type="danger" @click="remove(s.row)">删除</el-button></template></el-table-column></el-table></div>
      <div class="fp2-tabs" v-if="spec.tabs">
        <div class="fp2-tab" v-for="t in spec.tabs" :key="t" @click="act(t)">{{ t }}<el-icon><ArrowRight /></el-icon></div>
      </div>
      <el-dialog v-model="dialog.open" :title="dialog.title" width="580px" append-to-body>
        <el-alert v-if="dialog.kind!=='entry'" title="当前操作只更新本地演示状态。" type="info" :closable="false" style="margin-bottom:18px"/>
        <el-form label-width="100px" v-if="!['usage','storage'].includes(dialog.kind)">
          <el-form-item :label="dialog.kind==='binding'?'视频号名称':'名称'" required><el-input v-model="dialog.name" maxlength="80"/></el-form-item>
          <el-form-item v-if="dialog.kind==='binding'" label="视频号 ID" required><el-input v-model="dialog.code"/></el-form-item>
          <el-form-item v-if="dialog.kind==='entry'&&routeKey==='sceneLibrary'" label="场景图片" required><LocalUpload v-model="dialog.files" :limit="1" accept=".jpg,.jpeg,.png,.webp" @busy="v=>busy=v"/></el-form-item>
          <template v-if="dialog.kind==='config'"><el-form-item label="启用"><el-switch v-model="dialog.enabled"/></el-form-item><el-form-item label="规则内容"><el-input v-model="dialog.value" type="textarea" :rows="4" placeholder="填写本地演示规则"/></el-form-item></template>
        </el-form>
        <div v-if="dialog.kind==='storage'"><p>选择增加的演示额度，不会发起支付或购买云服务。</p><el-radio-group v-model="dialog.value"><el-radio-button :value="100">100GB</el-radio-button><el-radio-button :value="500">500GB</el-radio-button><el-radio-button :value="1000">1000GB</el-radio-button></el-radio-group></div>
        <el-table v-if="dialog.kind==='usage'" :data="records" empty-text="暂无本地额度变更"><el-table-column prop="from" label="项目"/><el-table-column prop="to" label="额度"/><el-table-column prop="time" label="时间"/></el-table>
        <template #footer><el-button @click="dialog.open=false">关闭</el-button><el-button v-if="dialog.kind!=='usage'" type="primary" :disabled="busy" @click="save">{{dialog.kind==='storage'?'增加演示额度':'保存'}}</el-button></template>
      </el-dialog>
    </div>`
  };

  window.SHARED.FeaturePage = FeaturePage;
})();
