/* ============================================================
   共享组件 · 列表页 ListPage（筛选 + 状态条 + 工具栏 + 表格 + 分页 + 弹窗）
   conf = {
     title, desc, storeKey,
     filters:[{ key, col, label, type, ph, ph2, opts }],   // key=筛选项标识，col=行数据字段
     tabs:[{ label, count, key }], allLabel, statusKey,
     toolbar:{ left:[], right:[] },
     cols:[], rows:[], ops:[],
     form:{ fields:[{ key(=列字段), label, type }], width, mode },
     detail:{ fields:[] }
   }
   约定：行数据以「列字段名」为 key，表单字段 key 与列字段一致，保证新增/编辑双向回显。
   ============================================================ */
(function () {
  'use strict';
  const S = window.SHARED;
  const { ref, reactive, computed, watch } = Vue;
  const { ElMessage, ElMessageBox } = ElementPlus;

  /* 统一取「YYYY-MM-DD」用于日期比较；非日期返回空串 */
  const asDate = (v) => {
    if (!v) return '';
    const s = String(v).trim();
    const m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (!m) return '';
    return m[1] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[3]).padStart(2, '0');
  };
  const nowStr = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  };

  const ListPage = {
    name: 'ListPage',
    props: {
      conf: { type: Object, required: true },
      dense: { type: Boolean, default: false },
      userName: { type: String, default: '张松涛' }
    },
    emits: ['go', 'changed'],
    setup(props, { emit }) {
      const kw = ref('');
      const status = ref('');
      const workbenchEntry = ref(S.workbench?.routeContext(location.hash,props.conf.routeKey)||null);
      const clearWorkbenchEntry=()=>{workbenchEntry.value=null;page.value=1;};
      watch(status,clearWorkbenchEntry);
      const page = ref(1);
      const size = ref(10);
      const sel = ref([]);
      const tableRef = ref(null), density = ref(S.store.get('density') || 'default');
      const sort = reactive({ prop:'', order:'' }), columnFilters = reactive({});
      const entityKind = props.conf.entityKind || (S.db && S.db.kindFor(props.conf.routeKey)) || '';
      const viewKey = 'columns:' + (props.conf.storeKey || props.conf.title);
      const columnState = ref(S.store.get(viewKey) || []), columnOpen = ref(false), columnDraft = ref([]);
      const importState = reactive({open:false,headers:[],mapping:{},rows:[],file:'',error:''});
      const dictionaryVersion=ref(0),category=reactive({open:false,title:'',rows:[],name:'',field:'',original:[]});
      const action = reactive({open:false,title:'',targets:[],field:'',value:'',note:''});
      const production = reactive({open:false,title:'',targets:[],steps:[],note:''});
      const isProduction = computed(()=>props.conf.routeKey==='perfect/center');
      const productionMenu=ref(false);
      const productionNames=['木工部','油漆部','软包部','组装部','包装部','品检'];
      const openProduction=(title,targets)=>{
        if(!targets.length)return ElMessage.warning('请先勾选需要操作的产品，不会默认操作全部记录');
        const records=targets.map(r=>S.db.find('tasks',r.id)).filter(Boolean);
        const saved=records.length===1?records[0].productionSteps:null;
        Object.assign(production,{open:true,title,targets:targets.map(r=>r.id),note:'',steps:S.clone(saved||[{department:'木工部',start:'',end:'',owner:'',state:'待开工'}])});
      };
      const saveProduction=()=>{
        if(!production.steps.length||production.steps.some(s=>!s.department||!s.start||!s.end||s.end<s.start))return ElMessage.warning('请为每道工序填写工序、开始和结束日期，结束日期不能早于开始日期');
        const dispatch=/下发/.test(production.title);
        const current=production.targets.map(id=>S.db.find('tasks',id));
        if(current.some(x=>!x))return ElMessage.warning('部分生产任务已不存在，请重新选择');
        if(current.some(x=>!['待排产','排产中'].includes(x.status||'待排产')))return ElMessage.warning('仅待排产或排产中的任务可修改计划/下发，不能将已开工或完成任务退回');
        const next=current.map(live=>{
          const entity=S.clone(live),steps=S.clone(production.steps),starts=steps.map(s=>s.start).sort(),ends=steps.map(s=>s.end).sort();
          entity.productionSteps=steps;entity.plannedStart=starts[0];entity.plannedEnd=ends[ends.length-1];entity.days=Math.round((new Date(entity.plannedEnd)-new Date(entity.plannedStart))/86400000)+1;
          entity.scheduledAt=nowStr();entity.planner=props.userName;entity.status=dispatch?'待开工':'排产中';entity.process=steps.map(s=>s.department+'「'+s.start+'—'+s.end+'」').join('；');
          entity.productionHistory=(entity.productionHistory||[]).concat({action:production.title,steps,note:production.note,at:nowStr(),mock:true});return entity;
        });
        try{S.db.upsertMany('tasks',next);production.open=false;clearSelection();ElMessage.success('生产计划已保存到本机（Mock）');}catch(e){ElMessage.error('保存失败，整批生产任务未改变，请重试');}

      };
      const procurement=reactive({open:false,title:'',supplier:'',date:'',note:'',lines:[]});
      const openProcurement=(title,targets)=>{if(!targets.length)return ElMessage.warning('请先选择产品');Object.assign(procurement,{open:true,title,supplier:'',date:'',note:'',lines:targets.map(r=>{const t=S.db.find('tasks',r.id)||r.__record||{};return {taskId:r.id,orderNo:t.orderNo,productId:t.productId,product:t.product||r['产品'],spec:t.spec||'',unit:t.unit||'件',qty:Number(t.qty)||1,price:0};})});};
      const saveProcurement=()=>{
        if(!procurement.supplier||!procurement.date)return ElMessage.warning('请选择供应商和计划到货日期');
        if(procurement.date<S.now().slice(0,10))return ElMessage.warning('计划到货不能早于今天');
        if(procurement.lines.some(l=>!Number.isFinite(Number(l.qty))||l.qty<=0||!Number.isFinite(Number(l.price))||l.price<0))return ElMessage.warning('请检查数量和单价');
        const no=S.newId(/委外/.test(procurement.title)?'WW':'SG');
        const batch=procurement.lines.map((l,i)=>Object.assign({},S.clone(l),{id:no+':'+i,no,cat:/委外/.test(procurement.title)?'委外加工':'生产申购',supplier:procurement.supplier,expected:procurement.date,amount:Math.round(l.qty*l.price*100)/100,state:'待审核',payState:'未付款',shipState:'待发货',buyer:props.userName,createdAt:S.now(),remark:procurement.note}));
        try{S.db.upsertMany('purchases',batch);procurement.open=false;clearSelection();ElMessage.success('已生成采购记录：'+no+'，可在采购列表查看');}catch(e){ElMessage.error('保存失败，整批采购记录未写入，请重试');}

      };
      const form = reactive({ open: false, title: '新增', data: {}, editingId: null });
      const drawer = reactive({ open: false, row: null });

      const fields = computed(() => props.conf.filters || []);
      const baseCols = computed(() => props.conf.cols || []);
      const cols = computed(() => {
        if(!columnState.value.length) return baseCols.value;
        const configured=columnState.value.filter(x=>x.show!==false).map(x=>baseCols.value.find(c=>c.prop===x.prop)).filter(Boolean);
        return configured.length ? configured : baseCols.value;
      });
      const ops = computed(() => props.conf.ops || []);
      /* 行数据放入 ref：schema 生成的是普通对象，直接改 props 不会触发视图更新 */
      const entityRows=()=>{
        const list=S.db.rows(entityKind,baseCols.value);
        if(props.conf.routeKey==='project/index')list.forEach(r=>{const o=r.__record,ts=S.db.all('tasks').filter(t=>t.orderNo===o.no),ms=(o.items||[]).flatMap(l=>l.materials||[]);r['生产进度']=ts.length?Math.round(ts.reduce((n,t)=>n+(Number(t.progress)||(/完成/.test(t.status)?100:0)),0)/ts.length*100)/100:Number(o.progress)||0;r['材质对接']=ms.filter(m=>m.confirmed).length+'/'+ms.length;});
        return list;
      };
      const rows = ref(entityKind ? entityRows() : S.clone(props.conf.rows || []));
      const syncEntities=()=>{if(entityKind) rows.value=entityRows();};
      window.addEventListener('aicard:data',syncEntities);
      Vue.onUnmounted(()=>window.removeEventListener('aicard:data',syncEntities));
      const filterOptions = computed(()=>Object.fromEntries(baseCols.value.filter(c=>c.type==='tag').map(c=>[c.prop,[...new Set(rows.value.map(r=>r[c.prop]).filter(v=>v!==''&&v!=null))].map(v=>({text:String(v),value:v}))])));

      const filterModel = reactive({});
      watch(fields, (fs) => {
        fs.forEach((f) => { if (filterModel[f.key] === undefined) filterModel[f.key] = ''; });
      }, { immediate: true });

      const allLabel = computed(() => props.conf.allLabel || ((props.conf.tabs || []).length ? '全部' : ''));
      const statusCol = computed(() => {
        if (['purchase/caigou','purchase/other'].includes(props.conf.routeKey)) return '__purchaseType';
        if (isProduction.value) return '状态';
        if (props.conf.statusKey) return props.conf.statusKey;
        const c = baseCols.value.find((x) => /状态|阶段/.test(x.label));
        return c ? c.prop : '';
      });

      // 分类映射只用于订货列表导航，不改写行或实体的真实状态。
      const statusGroup = value => props.conf.routeKey==='project/index'&&value==='图纸待确定'?'待制图':value;
      const tabValue = r => statusCol.value==='__purchaseType' ? String(r.__record?.type||r.type||'') : statusGroup(String(r[statusCol.value] == null ? '' : r[statusCol.value]));
      const tabCounts = computed(() => {
        const m = {};
        if (!statusCol.value) return m;
        rows.value.forEach((r) => {
          const v = tabValue(r);
          if (!v) return;
          m[v] = (m[v] || 0) + 1;
        });
        return m;
      });
      const tabs = computed(() => (props.conf.tabs || []).map((t) => {
        const k = t.key || t.label;
        return { label: t.label, key: k, count: statusCol.value ? (tabCounts.value[k] || 0) : (t.count || 0) };
      }));
      const allCount = computed(() => rows.value.length);

      const filtered = computed(() => {
        let list = rows.value.slice();
        if(workbenchEntry.value)list=list.filter(r=>S.workbench.entryMatches(workbenchEntry.value.key,r.__record||r));

        /* 关键字：按当前页可见列匹配 */
        const k = kw.value.trim();
        if (k) {
          list = list.filter((r) => cols.value.some((c) => String(r[c.prop] == null ? '' : r[c.prop]).indexOf(k) >= 0));
        }

        /* 状态标签 */
        if (status.value && allLabel.value && status.value !== allLabel.value && statusCol.value) {
          list = list.filter((r) => tabValue(r) === status.value);
        }

        /* 筛选条件（含日期区间） */
        fields.value.forEach((f) => {
          const v = filterModel[f.key];
          if (v === '' || v === null || v === undefined) return;
          if(f.test){list=list.filter(r=>f.test(r,v));return;}
          const col = f.col || f.key;
          if (Array.isArray(v)) {
            const from = v[0] ? String(v[0]).slice(0, 10) : '';
            const to = v[1] ? String(v[1]).slice(0, 10) : '';
            if (!from && !to) return;
            list = list.filter((r) => {
              const d = asDate(r[col]);
              if (!d) return false;
              if (from && d < from) return false;
              if (to && d > to) return false;
              return true;
            });
            return;
          }
          const sv = String(v);
          list = list.filter((r) => {
            const cell = r[col];
            const cs = String(cell == null ? '' : cell);
            if (f.type === 'date') return asDate(cell) === sv.slice(0, 10);
            if (f.type === 'select' || f.type === 'radio') return cs === sv || cs.indexOf(sv) >= 0;
            return cs.indexOf(sv) >= 0;
          });
        });
        Object.entries(columnFilters).forEach(([key,vs])=>{if(vs.length)list=list.filter(r=>vs.includes(r[key]));});
        if(sort.prop&&sort.order) list.sort((a,b)=>{
          const x=a[sort.prop],y=b[sort.prop],numeric=x!==''&&y!==''&&Number.isFinite(Number(x))&&Number.isFinite(Number(y));
          return (numeric?Number(x)-Number(y):String(x??'').localeCompare(String(y??''),'zh-CN',{numeric:true}))*(sort.order==='ascending'?1:-1);
        });
        return list;
      });

      const paged = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value));
      const totalQty = computed(() => sel.value.reduce((a, b) => a + (Number(b['数量']) || Number(b.qty) || Number(b.products) || 0), 0));

      watch(() => filtered.value.length, (n) => {
        const max = Math.max(1, Math.ceil(n / size.value));
        if (page.value > max) page.value = max;
      });

      /* ---------- 演示数据持久化：切页/刷新后保持 ---------- */
      const storeKey = props.conf.storeKey || '';
      const persist = () => { if(entityKind) S.db.saveRows(entityKind, rows.value); else if (storeKey) S.store.set(storeKey, rows.value); };

      /* 载入上次的演示数据（含新增、编辑、删除、状态流转结果） */
      if (storeKey && !entityKind) {
        const saved = S.store.get(storeKey);
        if (Array.isArray(saved)) rows.value = saved;
      }

      const doSearch = () => {
        page.value = 1;
        ElMessage.success('已按条件筛选，共 ' + filtered.value.length + ' 条');
      };
      const doReset = () => {
        workbenchEntry.value=null;
        kw.value = ''; status.value = allLabel.value;
        Object.keys(filterModel).forEach((k) => { filterModel[k] = ''; });
        Object.keys(columnFilters).forEach(k=>delete columnFilters[k]);
        page.value = 1;
      };

      /* ---------- 表单字段：key 必须与列字段同名 ---------- */
      const formFieldBase = computed(() => {
        const declared = props.conf.form && props.conf.form.fields;
        if(props.conf.routeKey==='eprInformation') return [
          {key:'标题',label:'标题',required:true,span:2},{key:'分类',label:'分类',type:'select',opts:['产品资讯','公司动态','行业知识','客厅家具']},
          {key:'排序',label:'排序',type:'number',min:0},{key:'来源链接',label:'公众号文章链接',span:2,ph:'https://mp.weixin.qq.com/...',tip:'仅记录来源；获取公众号文章未接入，不会请求真实账号。'},
          {key:'封面附件',label:'缩略图',type:'upload',accept:'.png,.jpg,.jpeg,.webp,.gif',limit:1,span:2,tip:'参考尺寸 500×400px，仅限 1 张；本地演示附件 ≤1MB'},
          {key:'主图视频',label:'主图视频',type:'upload',accept:'.mp4,.webm',limit:1,span:2},{key:'视频封面',label:'视频封面',type:'upload',accept:'.png,.jpg,.jpeg,.webp,.gif',limit:1,span:2,tip:'参考比例 16:9，仅限 1 张'},
          {key:'正文',label:'内容',type:'richtext',required:true,span:2},
          {key:'状态',label:'发布状态',type:'select',opts:['草稿','已发布']},{key:'发布时间',label:'发布时间',type:'date'}
        ];
        if (declared && declared.length) return declared;
        const skip = /^(序号|操作|排序)$/;
        return cols.value
          .filter((c) => c.prop && !skip.test(c.label))
          .map((c) => {
            const l = c.label;
            let t = 'input';
            if (c.type === 'date' || /时间|日期/.test(l)) t = 'date';
            else if (c.type === 'money' || /金额|价格|费用|单价|数量|库存/.test(l)) t = 'number';
            else if (/状态|分类|类型|级别|方式|来源|是否|可见|推荐|单位/.test(l)) t = 'select';
            else if (/备注|简介|描述|内容|说明/.test(l)) t = 'textarea';
            else if (/图片|封面|附件|文件/.test(l)) t = 'upload';
            return {
              key: c.prop, label: l, type: t, opts: t === 'select' ? (c.opts || ['启用', '停用']) : undefined,
              required: /名称|标题|客户|供应商/.test(l), span: (t === 'textarea' || t === 'upload') ? 2 : 1
            };
          });
      });

      const formFields=computed(()=>{dictionaryVersion.value;return formFieldBase.value.map(f=>{const saved=S.store.get('dict:'+(props.conf.routeKey||storeKey)+':'+f.key);return saved?Object.assign({},f,{opts:saved.filter(r=>r.enabled).map(r=>r.name)}):f;});});
      const blank = (f) => {
        if (f.type === 'switch') return false;
        if (f.type === 'checkbox' || f.type === 'multiselect' || f.type === 'upload') return [];
        return '';
      };

      const openNew = (label) => {
        /* 线上为独立编辑页的模块（如新增订货单），跳转而不是弹窗 */
        if (props.conf.newRoute) { emit('go', props.conf.newRoute); return; }
        const nm = (props.conf.title || '').replace(/(管理|列表|设置|中心)$/, '');
        const t = props.conf.form && props.conf.form.title;
        form.title = label ? (label.indexOf(nm) >= 0 || !nm ? label : label + ' · ' + nm) : (t || ('新增' + nm));
        const d = {};
        /* 以列结构打底，保证保存后列表每一列都有值 */
        cols.value.forEach((c) => { if (!/^(序号)$/.test(c.label)) d[c.prop] = ''; });
        formFields.value.forEach((f) => { d[f.key] = blank(f); });
        form.data = d;
        form.editingId = null;
        if(props.conf.routeKey==='eprInformation') Object.assign(form.data,{状态:'草稿',作者:props.userName,正文:'',发布时间:''});
        form.open = true;
      };

      const blockPurchaseWrite=()=>{
        if(!['purchase/caigou','purchase/other'].includes(props.conf.routeKey))return false;
        ElMessage.warning('采购专属新增、编辑、审核、删除、复制、导入及库存联动事务尚未完成；请核对来源申请，不能使用通用写入替代采购业务。');
        return true;
      };
      const openEdit = (row) => {
        if(['purchase/caigou','purchase/other'].includes(props.conf.routeKey)){if(!row?.id)return ElMessage.warning('采购内部ID缺失，无法打开资料');return emit('go','purchase/add?purchaseId='+encodeURIComponent(row.id));}
        if(blockPurchaseWrite())return;
        if (!row) return;
        if(props.conf.routeKey==='reconciliation/index')return emit('go','reconciliation/edit?id='+encodeURIComponent(row.id));
        const d = S.clone(row);
        cols.value.forEach((c) => { d[c.prop] = row[c.prop] === undefined || row[c.prop] === null ? '' : row[c.prop]; });
        formFields.value.forEach((f) => { if (d[f.key] === undefined) d[f.key] = blank(f); });
        form.data = d;
        form.title = '编辑' + (props.conf.title || '');
        form.editingId = row.id;
        form.open = true;
      };

      const submit = (data) => {
        if(blockPurchaseWrite())return;
        if(props.conf.routeKey==='eprInformation'){
          data=S.clone(data);data['正文']=S.sanitizeHtml(data['正文']||'');
          const body=new DOMParser().parseFromString(data['正文'],'text/html');
          if(!String(data['标题']||'').trim()||(!body.body.textContent.trim()&&!body.querySelector('img,video')))return ElMessage.warning('请填写资讯标题和正文');
          if(!['草稿','已发布'].includes(data['状态']))return ElMessage.warning('请选择草稿或已发布状态');
          data['发布时间']=data['状态']==='已发布'?(data['发布时间']||nowStr()):'';
          data['更新时间']=nowStr();
        }
        const backup=S.clone(rows.value),isEdit=!!form.editingId;
        const list = rows.value;
        if (form.editingId) {
          const i = list.findIndex((r) => r.id === form.editingId);
          if (i >= 0) Object.assign(list[i], data);

        } else {
          const row = { id: S.newId('NEW') };
          cols.value.forEach((c) => { row[c.prop] = ''; });
          Object.assign(row, data);
          /* 状态列留空时落到第一个状态标签，避免新增行「消失」 */
          if (statusCol.value && !row[statusCol.value]) {
            const st = (props.conf.tabs || [])[0];
            row[statusCol.value] = st ? (st.key || st.label) : '';
          }
          if ('创建时间' in row && !row['创建时间']) row['创建时间'] = nowStr();
          if ('添加时间' in row && !row['添加时间']) row['添加时间'] = nowStr();
          if ('操作人' in row && !row['操作人']) row['操作人'] = props.userName;
          list.unshift(row);
          page.value = 1;

        }
        try{persist();form.open=false;ElMessage.success(isEdit?'修改已保存':'新增成功，已插入列表首行');emit('changed');}catch(e){rows.value=backup;}
      };

      const del = (row) => {
        if(blockPurchaseWrite())return;
        ElMessageBox.confirm('确认删除该记录？删除后不可恢复。', '提示', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
          .then(() => {
            const i = rows.value.findIndex(r=>r.id===row.id);
            if (i >= 0) rows.value.splice(i, 1);
            persist();
            ElMessage.success('已删除');
            emit('changed');
          }).catch(() => {});
      };

      /* 状态流转：就地修改状态列 */
      const setState = (row, val) => {
        if(blockPurchaseWrite())return;
        if (!statusCol.value) return ElMessage.warning('当前页面没有可变更的状态字段');
        row[statusCol.value] = val;
        persist();
        ElMessage.success('已更新为「' + val + '」');
        emit('changed');
      };

      /* 真实 CSV 导出 */
      const exportCsv = () => {
        const list = filtered.value;
        const heads = cols.value.map((c) => c.label);
        const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
        const lines = [heads.map(esc).join(',')];
        list.forEach((r) => { lines.push(cols.value.map((c) => esc(r[c.prop])).join(',')); });
        const csv = '\ufeff' + lines.join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (props.conf.title || '列表') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 3000);
        ElMessage.success('已导出 ' + list.length + ' 条到 CSV 文件');
      };

      const openColumns=()=>{
        const old=columnState.value;
        columnDraft.value=(old.length?old:baseCols.value.map(c=>({prop:c.prop,show:true}))).filter(x=>baseCols.value.some(c=>c.prop===x.prop));
        baseCols.value.forEach(c=>{if(!columnDraft.value.some(x=>x.prop===c.prop))columnDraft.value.push({prop:c.prop,show:true});});
        columnDraft.value=S.clone(columnDraft.value); columnOpen.value=true;
      };
      const moveColumn=(i,d)=>{const j=i+d;if(j<0||j>=columnDraft.value.length)return;const a=columnDraft.value.splice(i,1)[0];columnDraft.value.splice(j,0,a);};
      const applyColumns=()=>{if(!columnDraft.value.some(c=>c.show))return ElMessage.warning('至少保留一列');columnState.value=S.clone(columnDraft.value);S.store.set(viewKey,columnState.value);columnOpen.value=false;};
      const onSort=e=>{sort.prop=e.prop;sort.order=e.order;page.value=1;};
      const onFilter=e=>{Object.assign(columnFilters,e);page.value=1;};
      watch([kw,status,size],()=>{page.value=1;});
      watch(filterModel,()=>{page.value=1;},{deep:true});
      watch(density,v=>S.store.set('density',v));
      const clearSelection=()=>{tableRef.value?.clearSelection();sel.value=[];};
      const bulkDelete=()=>{
        if(blockPurchaseWrite())return;
        if(!sel.value.length)return ElMessage.warning('请先选择记录');
        const ids=sel.value.map(r=>r.id);
        ElMessageBox.confirm('将删除 '+ids.length+' 条记录，删除后不可恢复。','批量删除',{type:'warning',confirmButtonText:'删除',cancelButtonText:'取消'}).then(()=>{
          rows.value=rows.value.filter(r=>!ids.includes(r.id));clearSelection();persist();ElMessage.success('已删除 '+ids.length+' 条记录');
        }).catch(()=>{});
      };
      const blockPurchaseReceipt=(label,targets)=>{
        if(!['purchase/caigou','purchase/other'].includes(props.conf.routeKey)||!/收货/.test(label))return false;
        const pending=targets.some(r=>r['采购状态']==='待审核');
        ElMessage.warning(pending?'当前采购尚待审核，请先核实审核状态；不能直接收货。':'真实收货及入库事务尚未实现，不能用通用字段更新替代收货。');
        return true;
      };
      const openAction=(label,targets)=>{
        if(blockPurchaseReceipt(label,targets))return;
        if(blockPurchaseWrite())return;
        if(!targets.length)return ElMessage.warning('请先选择要操作的记录');
        let pattern=/状态|阶段/;
        if(/推荐/.test(label))pattern=/推荐/;else if(/采购员/.test(label))pattern=/采购员/;else if(/分配|转移|认领|负责人/.test(label))pattern=/负责人|销售|跟单|员工/;else if(/展示/.test(label))pattern=/展示方式/;else if(/积分/.test(label))pattern=/积分/;else if(/上架|下架/.test(label))pattern=/上架|状态/;
        const c=baseCols.value.find(c=>pattern.test(c.label))||baseCols.value.find(c=>!/序号|编号|单号|时间/.test(c.label));
        Object.assign(action,{open:true,title:label,targets:targets.map(r=>r.id),field:c?.prop||'',value:'',note:''});
        if(/取消推荐/.test(label))action.value='否';else if(/推荐|上架/.test(label))action.value='是';else if(/下架/.test(label))action.value='否';else if(/启用/.test(label))action.value='启用';else if(/停用/.test(label))action.value='停用';
      };
      const applyAction=()=>{
        if(blockPurchaseWrite())return;
        if(!action.field||action.value==='')return ElMessage.warning('请选择字段并填写新值');
        const col=baseCols.value.find(c=>c.prop===action.field);let value=action.value;
        if(col&&['money','num','pct','progress'].includes(col.type)){value=Number(value);if(!Number.isFinite(value))return ElMessage.warning('该字段需要数值');}
        rows.value.forEach(r=>{if(action.targets.includes(r.id)){r[action.field]=value;r.__history=(r.__history||[]).concat({action:action.title,field:action.field,value,note:action.note,at:nowStr()});}});
        persist();action.open=false;ElMessage.success('已更新 '+action.targets.length+' 条记录');clearSelection();
      };
      const openCategory=title=>{
        const pattern=/品牌/.test(title)?/品牌/:/空间/.test(title)?/空间/:/风格/.test(title)?/风格/:/标签/.test(title)?/标签/:/分类|品类/;
        const field=baseCols.value.find(c=>pattern.test(c.label));
        const saved=S.store.get('dict:'+(props.conf.routeKey||storeKey)+':'+(field?.prop||title))||S.store.get('dict:'+(props.conf.routeKey||storeKey)+':'+title);
        const names=field?[...new Set(rows.value.map(r=>r[field.prop]).filter(Boolean))]:['默认分类'];
        const list=S.clone(saved||names.map((n,i)=>({id:'CAT'+i,name:String(n),enabled:true})));
        Object.assign(category,{open:true,title,field:field?.prop||title,name:'',rows:list,original:S.clone(list)});
      };
      const addCategory=()=>{const n=category.name.trim();if(!n)return ElMessage.warning('请输入名称');if(category.rows.some(r=>r.name===n))return ElMessage.warning('名称已存在');category.rows.push({id:S.newId('CAT'),name:n,enabled:true});category.name='';};
      const saveCategory=()=>{
        category.rows.forEach(r=>r.name=r.name.trim());
        if(category.rows.some(r=>!r.name))return ElMessage.warning('分类名称不能为空');
        if(new Set(category.rows.map(r=>r.name)).size!==category.rows.length)return ElMessage.warning('分类名称不能重复');
        const removed=category.original.filter(o=>!category.rows.some(r=>r.id===o.id));
        if(removed.some(o=>rows.value.some(r=>r[category.field]===o.name)))return ElMessage.warning('分类仍被记录使用，请先迁移记录后再删除');
        category.original.forEach(o=>{const n=category.rows.find(r=>r.id===o.id);if(n&&n.name!==o.name)rows.value.forEach(r=>{if(r[category.field]===o.name)r[category.field]=n.name;});});
        persist();S.store.set('dict:'+(props.conf.routeKey||storeKey)+':'+category.field,category.rows);dictionaryVersion.value++;category.open=false;ElMessage.success('已保存 '+category.rows.length+' 项');
      };
      const importPreview=computed(()=>importState.rows.map((cells,i)=>{
        const row={id:S.newId('IMP')},errors=[];
        importState.headers.forEach((h,j)=>{const key=importState.mapping[j];if(!key)return;let v=cells[j]??'';const c=baseCols.value.find(c=>c.prop===key);if(c&&['num','money','pct'].includes(c.type)&&v!==''){v=Number(String(v).replace(/[¥￥,]/g,''));if(!Number.isFinite(v))errors.push(key+'必须为数值');else if(v<0&&/数量|库存|价格|单价|金额/.test(key)&&!/差额/.test(key))errors.push(key+'不能为负数');}row[key]=v;});
        formFields.value.filter(f=>f.required).forEach(f=>{if(row[f.key]===undefined||String(row[f.key]).trim()==='')errors.push('缺少'+f.label);});
        Object.entries(row).forEach(([k,v])=>{if(/手机号|联系电话/.test(k)&&v&&!/^1[3-9]\d{9}$/.test(String(v)))errors.push(k+'格式不正确');});
        return {line:i+2,row,error:errors.join('；')};
      }));
      const readImport=async f=>{
        if(!f.raw)return;importState.error='';importState.file='';
        try{
          if(!/\.(csv|xlsx|xls)$/i.test(f.name))throw new Error('请选择 CSV、XLSX 或 XLS 文件');
          if(f.raw.size>5*1024*1024)throw new Error('文件不能超过 5MB');
          let parsed;
          if(/\.csv$/i.test(f.name))parsed=S.parseCsv(await f.raw.text());
          else if(window.XLSX){const wb=XLSX.read(await f.raw.arrayBuffer(),{type:'array',sheetRows:502,cellDates:true,dateNF:'yyyy-mm-dd'});parsed=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',raw:false,dateNF:'yyyy-mm-dd',blankrows:false});}
          else throw new Error('Excel 解析器未加载，请刷新重试，或改用 UTF-8 CSV');
          if(parsed.length<2)throw new Error('文件中没有数据行');if(!parsed[0].some(x=>String(x).trim()))throw new Error('表头不能为空');if(parsed.length>501)throw new Error('每次最多导入 500 行');
          importState.headers=parsed[0].map(x=>String(x).trim());importState.rows=parsed.slice(1).filter(r=>r.some(x=>String(x).trim()));importState.file=f.name;
          importState.mapping={};importState.headers.forEach((h,i)=>{const c=baseCols.value.find(c=>c.label===h);if(c)importState.mapping[i]=c.prop;});
        }catch(e){importState.headers=[];importState.rows=[];importState.error=e.message;}
      };
      const importRows=()=>{
        if(blockPurchaseWrite())return;
        if(!importPreview.value.length||importPreview.value.some(r=>r.error))return ElMessage.warning('请先修正所有导入错误');
        const mapped=Object.values(importState.mapping).filter(Boolean);if(new Set(mapped).size!==mapped.length)return ElMessage.warning('同一字段不能重复映射');
        const fresh=importPreview.value.map(x=>Object.assign({[statusCol.value]:(props.conf.tabs||[])[0]?.label||''},x.row,{id:S.newId('IMP')}));rows.value.unshift(...fresh);persist();importState.open=false;page.value=1;ElMessage.success('已导入 '+fresh.length+' 条记录');
      };
      const templateCsv=()=>S.download((props.conf.title||'列表')+'导入模板.csv',S.csv(baseCols.value.map(c=>c.label),[]),'text/csv;charset=utf-8');
      const printRows=target=>{
        const list=target||filtered.value,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const w=window.open('','_blank');if(!w)return ElMessage.warning('请允许弹出打印预览窗口');
        w.document.write('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>'+esc(props.conf.title)+'</title><style>body{font:13px sans-serif;padding:20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:7px}button{margin:12px}@media print{button{display:none}}</style><h2>'+esc(props.conf.title)+'</h2><p>共 '+list.length+' 条 · '+nowStr()+'</p><button onclick="window.print()">打印 / 保存 PDF</button><table><tr>'+cols.value.map(c=>'<th>'+esc(c.label)+'</th>').join('')+'</tr>'+list.map(r=>'<tr>'+cols.value.map(c=>'<td>'+esc(r[c.prop])+'</td>').join('')+'</tr>').join('')+'</table></html>');w.document.close();
      };

      const onOp = (e) => {
        const row = e.row, label = e.label;
        if(blockPurchaseReceipt(label,[row]))return;
        if(props.conf.routeKey==='reconciliation/index'&&/审核|付款/.test(label)){drawer.row=row;drawer.open=true;return;}
        if(isProduction.value && /生产计划|下发生产任务/.test(label))return openProduction(label,[row]);
        if(isProduction.value && /申购|委外加工/.test(label))return openProcurement(label,[row]);
        if (/详情|查看/.test(label)) { drawer.row = row; drawer.open = true; return; }
        if (/编辑|修改/.test(label)) { if(entityKind==='orders'&&props.conf.routeKey==='project/index')return emit('go','project/edit?id='+encodeURIComponent(row['订单号']));return openEdit(row); }
        if (/删除/.test(label)) return del(row);
        if (/作废/.test(label)) return setState(row, '已作废');
        if (/停用/.test(label)) return setState(row, '停用');
        if (/启用|上架/.test(label)) return setState(row, '启用');
        if (/审核|通过/.test(label)) return setState(row, '已通过');
        if (/复制|再来一单/.test(label)) {
          if(blockPurchaseWrite())return;
          if(entityKind==='orders'){const matches=S.db.all('orders').filter(o=>row.id&&o.id===row.id);if(matches.length!==1)return ElMessage.warning('复制来源订货单不存在或不唯一，请重新核实');const o=S.clone(matches[0]);delete o.drawingLinkDraft;delete o.orderDrawingFiles;const no=S.newId('SO');Object.assign(o,{id:no,no,name:(o.name||o.no)+'（副本）',paid:0,state:'草稿',produceStatus:'草稿',createdAt:S.now(),tasks:0,purchaseCount:0,receipts:[],orderHistory:[],stateHistory:[],progress:0,orderedAt:'',startDate:'',endDate:''});(o.items||[]).forEach(l=>['taskNo','productionSteps','progress','drawings','drawingStatus','drawingCreator','drawingUploadedAt','drawingAuditor','drawingAuditedAt','designStartedAt','receivedQty','deliveredQty','status'].forEach(k=>delete l[k]));S.db.upsert('orders',o);page.value=1;ElMessage.success('已复制为新编号草稿：'+no);return;}
          const copy = Object.assign({}, row, { id: 'COPY-' + Date.now() });
          rows.value.unshift(copy);
          persist();
          ElMessage.success('已复制一条记录');
          return;
        }
        if (/导出/.test(label)) return exportCsv();
        if (/打印/.test(label)) {if(entityKind==='orders'&&props.conf.routeKey==='project/index')return emit('go','print/order?id='+encodeURIComponent(row['订单号']));return printRows([row]);}
        openAction(label,[row]);
      };

      const detailFields = computed(() => {
        const r = drawer.row || {};
        return cols.value.filter((c) => c.prop in r).map((c) => ({ k: c.prop, label: c.label, v: r[c.prop] }));
      });

      const toolClick = (b) => {
        if(isProduction.value && b==='生产计划'){if(!sel.value.length)return ElMessage.warning('请先勾选产品');productionMenu.value=true;return;}
        if(isProduction.value && /下发生产任务/.test(b))return openProduction(b,sel.value);
        if(isProduction.value && /申购|委外加工/.test(b))return openProcurement(b,sel.value);
        /* 工具栏里配置了跳转的按钮（如「账号管理」）先取路由 */
        const nav = (props.conf.navButtons || {})[b];
        if (nav) { emit('go', nav); return; }
        if (/导入|从本地/.test(b)){if(blockPurchaseWrite())return;importState.open=true;importState.rows=[];importState.headers=[];importState.error='';return;}
        if (/导出|下载/.test(b)) return exportCsv();
        if (/分类|品牌|空间|风格|标签/.test(b)) return openCategory(b);
        if (/打印/.test(b)) return printRows();
        if (/删除/.test(b))return bulkDelete();
        if (/批量|推荐|取消推荐|分配|退回|领取|认领|展示方式/.test(b))return openAction(b,sel.value);
        if (/新增|新建|添加|创建|发布|上传|录入/.test(b)) return openNew(b);
        openAction(b,sel.value);
      };

      return {
        production,productionMenu,productionNames,isProduction,openProduction,saveProduction,
        workbenchEntry,clearWorkbenchEntry,kw, status, page, size, sel, form, drawer, fields, cols, ops, rows, tabs, allLabel, allCount, statusCol,
        procurement, openProcurement, saveProcurement, suppliers:S.db.all('suppliers'), filtered, paged, filterModel, totalQty, doSearch, doReset, openNew, openEdit, submit, onOp,
        detailFields, formFields, emit, S, exportCsv, toolClick, baseCols,tableRef,density,columnFilters,filterOptions,columnOpen,columnDraft,openColumns,moveColumn,applyColumns,onSort,onFilter,clearSelection,bulkDelete,action,openAction,applyAction,category,addCategory,saveCategory,importState,importPreview,readImport,importRows,templateCsv
      };
    },
    template: `
    <div class="lp" :class="{dense,'order-list':conf.routeKey==='project/index'}">
      <el-alert v-if="workbenchEntry" class="wb-entry-filter" :title="'工作台快捷筛选：'+workbenchEntry.label" type="info" show-icon closable @close="clearWorkbenchEntry"/>
      <div class="lp-hd" v-if="conf.title&&!conf.hideTitle" data-demo="页面标题与说明">
        <div class="lp-title">
          <h2>{{ conf.title }}</h2>
          <span class="lp-desc" v-if="conf.desc">{{ conf.desc }}</span>
        </div>
        <div class="lp-hd-acts"><slot name="hd"></slot></div>
      </div>

      <FilterBar v-if="fields.length" :fields="fields" :model="filterModel" @search="doSearch" @reset="doReset"><el-button v-if="conf.primaryInFilters" type="primary" size="small" @click="openNew()">+ 新增订货单</el-button></FilterBar>

      <StatusTabs v-if="tabs.length" :tabs="tabs" :all-label="allLabel" :all-count="allCount" v-model="status" />

      <div class="lp-card">
        <div class="lp-bar" data-demo="工具栏与搜索">
          <slot name="bar-left">
            <el-button v-for="b in ((conf.toolbar&&conf.toolbar.left)||[]).filter(b=>!conf.primaryInFilters||!/新增|新建/.test(b))" :key="b" size="small"
              :type="/新增|新建|创建|发布/.test(b)?'primary':''" :plain="/导出|导入|打印/.test(b)"
              :disabled="isProduction && /生产计划|下发生产任务|申购|委外加工/.test(b) && !sel.length" @click="toolClick(b)">{{ b }}</el-button>
          </slot>
          <div class="lp-bar-r">
            <el-input v-if="conf.searchable!==false" v-model="kw" size="small" placeholder="搜索当前列表" clearable style="width:200px">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button v-if="conf.routeKey==='project/index'" size="small" link type="primary" @click="openColumns">设置列字段</el-button>
            <el-select v-else v-model="density" size="small" aria-label="表格密度" style="width:90px"><el-option label="默认" value="default" /><el-option label="紧凑" value="small" /></el-select>
            <el-button v-if="conf.routeKey!=='project/index'" size="small" circle @click="doSearch" aria-label="刷新列表"><el-icon><Refresh /></el-icon></el-button>
            <el-button v-if="conf.routeKey!=='project/index'" size="small" circle @click="openColumns" aria-label="列设置"><el-icon><Setting /></el-icon></el-button>
          </div>
        </div>
        <div v-if="sel.length" class="lp-batch" data-demo="跨页选择与批量操作">已选 {{sel.length}} 条<el-button link @click="clearSelection">清空选择</el-button><el-button size="small" @click="openAction('批量编辑',sel)">批量编辑</el-button><el-button size="small" type="danger" plain @click="bulkDelete">批量删除</el-button></div>
        <DataTable ref="tableRef" :cols="cols" :rows="paged" :ops="ops" :selectable="conf.selectable!==false" @op="onOp" @link="e=>onOp({row:e.row,label:'详情'})"
          :remote-sort="true" :filter-options="filterOptions" :column-filters="columnFilters" @sort-change="onSort" @filter-change="onFilter"
          :tag-labels="conf.routeKey==='project/index'?{'订货单状态':{'草稿':'方案(草稿)'},'回款状态':{'未回款':'待回款'}}:{}" :expandable="conf.expandable!==false" :ring-progress="conf.routeKey==='project/index'" :size="density" :empty-text="rows.length?'没有符合条件的记录':'暂无数据'"
          @selection-change="v=>sel=v" :max-ops="conf.maxOps||2"><template #empty><el-button v-if="rows.length" link type="primary" @click="doReset">清空筛选</el-button><el-button v-else link type="primary" @click="openNew()">新增记录</el-button></template></DataTable>
        <div class="lp-ft" data-demo="分页与合计">
          <span class="lp-sum">已选 <b>{{ sel.length }}</b> 项<span v-if="totalQty"> · 合计数量 <b>{{ totalQty }}</b></span> · 共 <b>{{ filtered.length }}</b> 条</span>
          <el-pagination background layout="sizes, prev, pager, next, jumper" :total="filtered.length"
            :page-sizes="[10,20,50,100]" v-model:current-page="page" v-model:page-size="size" />
        </div>
      </div>

      <el-dialog v-model="procurement.open" :title="procurement.title" width="900px" append-to-body><el-form label-width="110px"><el-form-item label="供应商" required><el-select v-model="procurement.supplier" filterable placeholder="请选择供应商"><el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.name"/></el-select></el-form-item><el-form-item label="计划到货日期" required><el-date-picker v-model="procurement.date" type="date" value-format="YYYY-MM-DD"/></el-form-item><el-form-item label="备注"><el-input v-model="procurement.note" type="textarea" :rows="2"/></el-form-item></el-form><el-table :data="procurement.lines"><el-table-column prop="product" label="产品" min-width="180"/><el-table-column prop="orderNo" label="订货单" width="150"/><el-table-column label="数量" width="155"><template #default="s"><el-input-number v-model="s.row.qty" :min="0.01" :precision="2" size="small" style="width:130px"/></template></el-table-column><el-table-column label="单价" width="160"><template #default="s"><el-input-number v-model="s.row.price" :min="0" :precision="2" size="small" style="width:135px"/></template></el-table-column><el-table-column label="金额" width="120"><template #default="s">{{S.money(s.row.qty*s.row.price)}}</template></el-table-column></el-table><template #footer><el-button @click="procurement.open=false">取消</el-button><el-button type="primary" @click="saveProcurement">生成采购记录</el-button></template></el-dialog>
      <el-dialog v-model="productionMenu" title="生产计划" width="360px" append-to-body><el-alert title="请针对已勾选的产品选择操作" :closable="false"/><div style="display:flex;gap:12px;margin-top:20px"><el-button type="primary" @click="productionMenu=false;openProduction('创建生产计划',sel)">创建生产计划</el-button><el-button @click="productionMenu=false;openProduction('调整生产计划',sel)">调整生产计划</el-button></div></el-dialog>
      <el-dialog v-model="production.open" :title="production.title" width="min(1060px,95vw)" append-to-body :close-on-click-modal="false" destroy-on-close>
        <el-alert :title="'本地 Mock · 已选 '+production.targets.length+' 个产品。工序编辑为暂定实现，原站详细表单尚未核验，不代表 1:1 完成。'" type="warning" :closable="false"/>
        <el-table :data="production.steps" border style="margin-top:16px"><el-table-column label="工序 / 部门" min-width="150"><template #default="s"><el-select v-model="s.row.department" style="width:140px" filterable allow-create><el-option v-for="n in productionNames" :key="n" :label="n" :value="n"/></el-select></template></el-table-column><el-table-column label="计划开始时间" min-width="175"><template #default="s"><el-date-picker v-model="s.row.start" value-format="YYYY-MM-DD" style="width:155px"/></template></el-table-column><el-table-column label="计划结束时间" min-width="175"><template #default="s"><el-date-picker v-model="s.row.end" value-format="YYYY-MM-DD" style="width:155px"/></template></el-table-column><el-table-column label="负责人" min-width="130"><template #default="s"><el-input v-model="s.row.owner" placeholder="待分配"/></template></el-table-column><el-table-column label="操作" width="80"><template #default="s"><el-button link type="danger" @click="production.steps.splice(s.$index,1)">删除</el-button></template></el-table-column></el-table>
        <el-button style="margin:12px 0" @click="production.steps.push({department:'',start:'',end:'',owner:'',state:'待开工'})">添加工序</el-button><el-input v-model="production.note" type="textarea" placeholder="计划说明"/>
        <template #footer><el-button @click="production.open=false">取消</el-button><el-button type="primary" @click="saveProduction">{{/下发/.test(production.title)?'确认下发（Mock）':'保存生产计划（Mock）'}}</el-button></template>
      </el-dialog>
      <el-dialog v-model="columnOpen" title="列设置" width="440px" append-to-body>
        <div class="column-settings"><div v-for="(c,i) in columnDraft" :key="c.prop"><el-checkbox v-model="c.show">{{c.prop}}</el-checkbox><span><el-button link :disabled="i===0" @click="moveColumn(i,-1)" :aria-label="'上移'+c.prop">上移</el-button><el-button link :disabled="i===columnDraft.length-1" @click="moveColumn(i,1)" :aria-label="'下移'+c.prop">下移</el-button></span></div></div>
        <template #footer><el-button @click="columnDraft=baseCols.map(c=>({prop:c.prop,show:true}))">恢复默认</el-button><el-button @click="columnOpen=false">取消</el-button><el-button type="primary" @click="applyColumns">应用</el-button></template>
      </el-dialog>
      <el-dialog v-model="importState.open" title="批量导入 · 预览与字段映射" width="900px" append-to-body :close-on-click-modal="false">
        <p class="muted">支持 CSV / XLSX / XLS，读取第一个工作表；首行为表头，每次最多 500 行、5MB。确认前请核对字段映射。</p>
        <div class="import-tools"><el-upload action="#" :auto-upload="false" :show-file-list="false" accept=".csv,.xlsx,.xls" :on-change="readImport"><el-button type="primary">选择导入文件</el-button></el-upload><el-button @click="templateCsv">下载 CSV 模板</el-button><span>{{importState.file}}</span></div>
        <el-alert v-if="importState.error" :title="importState.error" type="error" :closable="false" />
        <div v-if="importState.headers.length" class="import-mapping"><div v-for="(h,i) in importState.headers" :key="i"><span>{{h}}</span><el-select v-model="importState.mapping[i]" placeholder="忽略此列" clearable size="small"><el-option v-for="c in baseCols" :key="c.prop" :label="c.label" :value="c.prop" /></el-select></div></div>
        <el-table v-if="importPreview.length" :data="importPreview" height="270" size="small" border><el-table-column prop="line" label="文件行" width="75" /><el-table-column label="预览内容"><template #default="s">{{Object.entries(s.row.row).filter(([k])=>k!=='id').map(([k,v])=>k+'：'+v).join('；')}}</template></el-table-column><el-table-column prop="error" label="校验结果" width="230"><template #default="s"><span :style="{color:s.row.error?'#f56c6c':'#67c23a'}">{{s.row.error||'通过'}}</span></template></el-table-column></el-table>
        <template #footer><span style="margin-right:12px">共 {{importPreview.length}} 行</span><el-button @click="importState.open=false">取消</el-button><el-button type="primary" :disabled="!importPreview.length||importPreview.some(r=>r.error)" @click="importRows">确认导入</el-button></template>
      </el-dialog>
      <el-dialog v-model="category.open" :title="category.title" width="600px" append-to-body>
        <el-table :data="category.rows" size="small"><el-table-column label="名称"><template #default="s"><el-input v-model="s.row.name" /></template></el-table-column><el-table-column label="启用" width="90"><template #default="s"><el-switch v-model="s.row.enabled" /></template></el-table-column><el-table-column label="操作" width="90"><template #default="s"><el-button link type="danger" @click="category.rows.splice(s.$index,1)">删除</el-button></template></el-table-column></el-table>
        
        <div class="import-tools"><el-input v-model="category.name" placeholder="输入新名称" @keyup.enter="addCategory" /><el-button @click="addCategory">添加</el-button></div>
        <template #footer><el-button @click="category.open=false">取消</el-button><el-button type="primary" @click="saveCategory">保存</el-button></template>
      </el-dialog>
      <el-dialog v-model="action.open" :title="action.title" width="520px" append-to-body :close-on-click-modal="false">
        <el-alert :title="'本次操作将更新 '+action.targets.length+' 条记录'" type="info" :closable="false" />
        <el-form label-width="90px" style="margin-top:18px"><el-form-item label="更新字段"><el-select v-model="action.field" style="width:100%"><el-option v-for="c in baseCols.filter(c=>!/序号|单号|编号|创建时间/.test(c.label))" :key="c.prop" :label="c.label" :value="c.prop" /></el-select></el-form-item><el-form-item label="新值"><el-select v-model="action.value" filterable allow-create default-first-option style="width:100%" placeholder="选择或输入新值"><el-option v-for="v in [...new Set(rows.map(r=>r[action.field]).filter(v=>v!==''&&v!=null))]" :key="String(v)" :label="String(v)" :value="v" /></el-select></el-form-item><el-form-item label="操作说明"><el-input v-model="action.note" type="textarea" :rows="2" /></el-form-item></el-form>
        <template #footer><el-button @click="action.open=false">取消</el-button><el-button type="primary" @click="applyAction">确认更新</el-button></template>
      </el-dialog>

      <FormDialog v-model="form.open" :title="form.title" :fields="formFields" :model="form.data"
        :width="(conf.form&&conf.form.width)||'680px'" :mode="conf.routeKey==='eprInformation'?'page':(conf.form&&conf.form.mode)||'dialog'"
        :confirm-text="form.editingId?'保存修改':'确定'"
        @submit="submit" />

      <OrderDetail v-if="conf.routeKey==='project/index'" v-model="drawer.open" :order-id="drawer.row?.id||''" @go="v=>emit('go',v)" />
      <PaymentDetail v-else-if="conf.routeKey==='reconciliation/index'" v-model="drawer.open" :payment-id="drawer.row?.id||''" />
      <el-drawer v-else v-model="drawer.open" title="详情" size="520px" append-to-body destroy-on-close>
        <div class="lp-dt" v-if="drawer.row">
          <div class="lp-dt-hd">
            <el-image v-if="drawer.row.img" :src="drawer.row.img" class="lp-dt-img" fit="cover" />
            <div>
              <div class="t">{{ drawer.row.name || drawer.row.no || drawer.row.title || (cols[0] && drawer.row[cols[0].prop]) || '记录详情' }}</div>
              <div class="s">{{ drawer.row.sku || drawer.row.code || drawer.row.phone || '' }}</div>
            </div>
          </div>
          <div class="lp-dt-row" v-for="f in detailFields" :key="f.k">
            <span class="k">{{ f.label }}</span>
            <span class="v">{{ f.v === '' || f.v === null || f.v === undefined ? '-' : f.v }}</span>
          </div>
          <div v-if="drawer.row['正文']" class="article-preview" v-html="S.sanitizeHtml(drawer.row['正文'])"></div>
          <template v-for="(v,k) in drawer.row" :key="k"><LocalUpload v-if="Array.isArray(v)&&v.length&&v[0]&&v[0].url" :model-value="v" disabled /></template>
          <el-timeline v-if="drawer.row.__history" style="margin-top:20px"><el-timeline-item v-for="(h,i) in drawer.row.__history" :key="i" :timestamp="h.at">{{h.action}} · {{h.field}} → {{h.value}} {{h.note}}</el-timeline-item></el-timeline>
        </div>
        <template #footer>
          <el-button @click="drawer.open=false">关闭</el-button>
          <el-button type="primary" @click="drawer.open=false;openEdit(drawer.row)">编辑</el-button>
        </template>
      </el-drawer>
    </div>`
  };

  S.ListPage = ListPage;
})();
