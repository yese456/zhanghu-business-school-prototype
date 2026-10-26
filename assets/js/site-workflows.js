/* 官网项目与售后流程；复用三系统业务实体，不以通用列表表单代替单据。 */
(function () {
  'use strict';
  const S = window.SHARED, { ref, reactive, computed, watch } = Vue;
  const { ElMessage, ElMessageBox } = ElementPlus;
  const ProjectList = {
    props:['nav'],
    setup(p) {
      const keyword=ref(''), stage=ref(''), page=ref(1);
      const stages=['已签约','方案确认','待排产','排产中','生产中','生产完成','已出库','验收完成'];
      const rows=computed(()=>S.db.all('projects').filter(r=>(!keyword.value||(r.name+r.customer+r.no).includes(keyword.value.trim()))&&(!stage.value||r.stage===stage.value)));
      const paged=computed(()=>rows.value.slice((page.value-1)*10,page.value*10));
      watch([keyword,stage],()=>page.value=1);
      const remove=r=>ElMessageBox.confirm('删除项目「'+r.name+'」？关联订货单会保留。','删除项目',{type:'warning'}).then(()=>{S.db.remove('projects',[r.id]);S.store.del('c:project:'+r.id);if(page.value>1&&!paged.value.length)page.value--;ElMessage.success('项目已删除');}).catch(()=>{});
      return {keyword,stage,stages,page,rows,paged,remove,nav:p.nav,money:S.money};
    },
    template:`<div class="container"><div class="crumb"><a @click="nav('/')">首页</a><span class="sp">/</span>订货项目</div><div class="panel2" style="margin-bottom:50px"><div class="hd">我的项目<span class="r"><el-button type="primary" size="small" @click="nav('/project-add')">+ 新建项目</el-button></span></div><div class="site-list-filter"><el-input v-model="keyword" clearable placeholder="项目名称 / 客户 / 编号" aria-label="搜索项目"/><el-select v-model="stage" clearable placeholder="项目阶段"><el-option v-for="v in stages" :key="v" :value="v" :label="v"/></el-select><el-button @click="keyword='';stage=''">重置</el-button></div><el-table :data="paged" empty-text="暂无符合条件的项目"><el-table-column prop="no" label="项目编号" min-width="160"/><el-table-column prop="name" label="项目名称" min-width="220"/><el-table-column prop="customer" label="客户" min-width="150"/><el-table-column prop="contact" label="联系人" width="100"/><el-table-column prop="phone" label="联系电话" width="140"/><el-table-column prop="stage" label="项目阶段" width="110"/><el-table-column prop="delivery" label="预计交付" width="120"/><el-table-column label="操作" fixed="right" width="175"><template #default="s"><el-button link type="primary" @click="nav('/project-detail','id='+s.row.id)">详情</el-button><el-button link type="primary" @click="nav('/project-edit','id='+s.row.id)">编辑</el-button><el-button link type="danger" @click="remove(s.row)">删除</el-button></template></el-table-column></el-table><el-pagination v-model:current-page="page" :total="rows.length" :page-size="10" layout="total, prev, pager, next" style="padding:18px;justify-content:flex-end"/></div></div>`
  };
  const AfterSaleAdd = {
    props:['nav'],
    setup(p) {
      const form=reactive({order:'',line:'',type:'维修',reason:'',qty:1,amount:0,contact:'',phone:'',address:'',remark:'',files:[]});
      const orders=computed(()=>S.db.all('orders').filter(o=>o.state!=='草稿'&&o.items?.length));
      const order=computed(()=>S.db.find('orders',form.order));
      const lines=computed(()=>order.value?.items||[]);
      const line=computed(()=>lines.value[Number(form.line)]);
      const submitted=ref(false);
      watch(()=>form.order,()=>{form.line='';form.qty=1;form.amount=0;if(order.value){form.contact=order.value.customerName;form.phone=order.value.phone;form.address=order.value.address;}});
      watch(()=>form.line,()=>{form.qty=1;form.amount=line.value?.price||0;});
      watch(()=>form.qty,()=>{form.amount=Math.round((line.value?.price||0)*form.qty*100)/100;});
      const save=()=>{
        if(submitted.value)return;
        if(!order.value||form.line===''||!line.value)return ElMessage.warning('请选择关联订货单和售后商品');
        if(!form.reason.trim())return ElMessage.warning('请填写售后原因');
        if(!form.contact.trim()||!/^1[3-9]\d{9}$/.test(form.phone.trim()))return ElMessage.warning('请填写联系人和有效的 11 位手机号');
        const pending=S.db.all('aftersales').filter(a=>a.order===form.order&&(a.productId===line.value.id||a.product===line.value.name)&&!['已取消','已驳回'].includes(a.state)).reduce((n,a)=>n+Number(a.qty),0);
        if(!Number.isInteger(form.qty)||form.qty<1||form.qty+pending>line.value.qty)return ElMessage.warning('申请数量超出该商品剩余可售后数量');
        if(form.amount<0||form.amount>form.qty*line.value.price)return ElMessage.warning('申请金额不得超过本次数量对应的商品金额');
        const no=S.newId('AS'),date=new Date().toISOString().slice(0,10);
        S.db.upsert('aftersales',Object.assign({},S.clone(form),{id:no,no,date,state:'待受理',productId:line.value.id,product:line.value.name,img:line.value.img,history:[{t:S.now(),c:'客户提交售后申请：'+form.type+'，'+form.reason}]}));
        submitted.value=true;ElMessage.success('售后申请已保存');p.nav('/aftersale-detail','id='+no);
      };
      return {form,orders,order,lines,line,save,submitted,nav:p.nav};
    },
    template:`<div class="container"><div class="crumb"><a @click="nav('/')">首页</a><span class="sp">/</span><a @click="nav('/aftersale')">售后服务</a><span class="sp">/</span>申请售后</div><div class="panel2" style="max-width:920px;margin-bottom:50px"><div class="hd">新建售后单</div><el-form label-width="110px" style="padding:24px" @submit.prevent><el-form-item label="关联订货单" required><el-select v-model="form.order" filterable placeholder="选择订货单" style="width:100%"><el-option v-for="o in orders" :key="o.no" :value="o.no" :label="o.no+' · '+o.name"/></el-select></el-form-item><el-form-item label="售后商品" required><el-select v-model="form.line" :disabled="!order" placeholder="选择商品" style="width:100%"><el-option v-for="(l,i) in lines" :key="i" :value="String(i)" :label="l.name+' · 已购 '+l.qty+' 件'"/></el-select></el-form-item><el-form-item label="售后类型" required><el-radio-group v-model="form.type"><el-radio-button v-for="t in ['维修','换货','退货']" :key="t" :value="t">{{t}}</el-radio-button></el-radio-group></el-form-item><el-form-item label="售后原因" required><el-input v-model="form.reason" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="描述问题、位置和实际情况"/></el-form-item><el-form-item label="申请数量" required><el-input-number v-model="form.qty" :min="1" :max="line?.qty||1" :precision="0"/></el-form-item><el-form-item label="申请金额"><el-input-number v-model="form.amount" :min="0" :max="(line?.price||0)*form.qty" :precision="2"/><span class="muted" style="margin-left:8px">元，最高为本次申请商品金额</span></el-form-item><el-form-item label="联系人" required><el-input v-model="form.contact" maxlength="30"/></el-form-item><el-form-item label="联系电话" required><el-input v-model="form.phone" maxlength="11"/></el-form-item><el-form-item label="联系地址"><el-input v-model="form.address"/></el-form-item><el-form-item label="问题凭证"><LocalUpload v-model="form.files" accept=".jpg,.jpeg,.png,.webp,.pdf"/></el-form-item><el-form-item label="补充说明"><el-input v-model="form.remark" type="textarea" :rows="2"/></el-form-item><el-form-item><el-button type="primary" :disabled="submitted" @click="save">提交申请</el-button><el-button @click="nav('/aftersale')">取消</el-button></el-form-item></el-form></div></div>`
  };
  const ProjectProducts = {
    props:['nav','id'],
    setup(p){
      const project=computed(()=>S.db.find('projects',p.id)||S.db.all('projects')[0]);
      const source=project.value;
      const lines=ref(S.clone(source?.items||(S.db.find('orders',source?.id)?.items)||[])),open=ref(false),keyword=ref(''),picked=ref([]);
      const products=computed(()=>S.db.all('products').filter(v=>!keyword.value||(v.name+' '+v.sku).includes(keyword.value.trim())));
      const total=computed(()=>lines.value.reduce((n,l)=>n+Number(l.qty)*Number(l.price||0),0));
      const add=()=>{if(!picked.value.length)return ElMessage.warning('请选择产品');picked.value.forEach(v=>{const l=lines.value.find(l=>l.id===v.id);if(l)l.qty=Number(l.qty)+1;else lines.value.push({id:v.id,key:S.newId('LINE'),name:v.name,img:v.img,code:v.sku,spec:v.spec,mat:v.material,unit:v.unit,qty:1,price:v.price});});open.value=false;picked.value=[];};
      const save=()=>{if(lines.value.some(l=>!Number.isFinite(Number(l.qty))||l.qty<=0||!Number.isFinite(Number(l.price))||l.price<0))return ElMessage.warning('请检查数量和单价');S.db.upsert('projects',Object.assign({},project.value,{items:S.clone(lines.value),productAmount:Math.round(total.value*100)/100,history:[...(project.value.history||[]),{t:S.now(),c:'更新项目产品，共 '+lines.value.length+' 种'}]}));ElMessage.success('项目产品已保存');};
      const toDraft=()=>{if(!lines.value.length)return ElMessage.warning('请先添加产品');const d=S.store.get('c:draft')||{items:[]};lines.value.forEach(l=>{const old=d.items.find(x=>x.id===l.id);if(old)old.qty=Number(old.qty)+Number(l.qty);else d.items.push({id:l.id,qty:l.qty,price:l.price});});S.store.set('c:draft',d);p.nav('/order-add');};
      return {project,lines,open,keyword,picked,products,total,add,save,toDraft,nav:p.nav,money:S.money};
    },
    template:`<div class="container"><div class="crumb"><a @click="nav('/project')">订货项目</a> / <a @click="nav('/project-detail','id='+project.id)">{{project.name}}</a> / 项目产品</div><div class="panel2" style="margin-bottom:50px"><div class="hd">项目产品<span class="r"><el-button size="small" @click="open=true">从产品库添加</el-button><el-button type="primary" size="small" @click="save">保存产品</el-button><el-button size="small" @click="toDraft">加入订货草稿</el-button></span></div><el-table :data="lines" empty-text="暂无项目产品，请从产品库添加"><el-table-column label="产品" min-width="230"><template #default="s"><div style="display:flex;gap:10px;align-items:center"><el-image :src="s.row.img" fit="cover" style="width:56px;height:56px"/><span>{{s.row.name}}</span></div></template></el-table-column><el-table-column prop="code" label="编号" width="140"/><el-table-column prop="spec" label="规格" min-width="160"/><el-table-column label="数量" width="155"><template #default="s"><el-input-number v-model="s.row.qty" :min="0.01" :precision="2" size="small" style="width:125px"/></template></el-table-column><el-table-column prop="unit" label="单位" width="65"/><el-table-column label="订货价" width="160"><template #default="s"><el-input-number v-model="s.row.price" :min="0" :precision="2" size="small" style="width:135px"/></template></el-table-column><el-table-column label="金额" width="125"><template #default="s">{{money(s.row.qty*s.row.price)}}</template></el-table-column><el-table-column label="操作" width="85"><template #default="s"><el-button link type="danger" @click="lines.splice(s.$index,1)">移除</el-button></template></el-table-column></el-table><div style="padding:20px;text-align:right">产品小计：{{money(total)}} <span class="muted">合同金额在项目信息中单独维护</span></div></div><el-dialog v-model="open" title="选择项目产品" width="900px"><el-input v-model="keyword" clearable placeholder="产品名称 / 编号" style="margin-bottom:16px"/><el-table :data="products" height="380" @selection-change="v=>picked=v"><el-table-column type="selection" width="45"/><el-table-column prop="name" label="名称"/><el-table-column prop="sku" label="编号"/><el-table-column label="单价"><template #default="s">{{money(s.row.price)}}</template></el-table-column></el-table><template #footer><el-button @click="open=false">取消</el-button><el-button type="primary" @click="add">添加所选</el-button></template></el-dialog></div>`
  };
  window.SITE_EXTRA={ProjectList,AfterSaleAdd,ProjectProducts};
})();
