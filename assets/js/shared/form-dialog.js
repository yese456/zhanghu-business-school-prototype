/* ============================================================
   共享组件 · 表单弹窗 FormDialog
   fields: [{
     key, label, type, opts, required, ph, span, rows, tip, disabled, suffix
   }]
   type: input | textarea | number | select | multiselect | date | daterange
         | switch | radio | checkbox | upload | richtext | static
   ============================================================ */
(function () {
  'use strict';
  const S = window.SHARED;

  const FormDialog = {
    name: 'FormDialog',
    props: {
      modelValue: { type: Boolean, default: false },
      title: { type: String, default: '新增' },
      fields: { type: Array, default: () => [] },
      model: { type: Object, default: () => ({}) },
      width: { type: String, default: '640px' },
      mode: { type: String, default: 'dialog' },
      labelWidth: { type: String, default: '104px' },
      columns: { type: Number, default: 2 },
      confirmText: { type: String, default: '确定' }
    },
    emits: ['update:modelValue', 'submit', 'cancel'],
    setup(props, { emit }) {
      const { ref, computed, watch, onUnmounted } = Vue;let alive=true,epoch=0;onUnmounted(()=>{alive=false;epoch++;});
      const mediaBusy=ref(0),busy=v=>mediaBusy.value=Math.max(0,mediaBusy.value+(v?1:-1));
      const formRef = ref(null), saving = ref(false), initial = ref(''), preview = ref(false);
      const article = computed(() => props.fields.some(f => f.type === 'richtext'));
      watch(() => props.modelValue, v => { epoch++;if(v) { initial.value=JSON.stringify(props.model); Vue.nextTick(()=>formRef.value?.clearValidate()); } }, {immediate:true});
      const beforeClose = done => {
        if(!alive||!props.modelValue||saving.value)return;if(mediaBusy.value)return ElementPlus.ElMessage.warning('媒体文件正在处理，请稍候再关闭');const token=epoch,model=props.model,snapshot=JSON.stringify(model);
        if(snapshot===initial.value) return done();
        ElementPlus.ElMessageBox.confirm('关闭后，本次未保存的修改将丢失。','放弃修改？',{confirmButtonText:'放弃修改',cancelButtonText:'继续编辑',type:'warning'}).then(()=>{if(!alive||!props.modelValue||token!==epoch||props.model!==model)return;if(mediaBusy.value||JSON.stringify(props.model)!==snapshot)return ElementPlus.ElMessage.warning('确认期间输入已变化，请保留修改重新确认');done();}).catch(()=>{});
      };
      const cancel=()=>beforeClose(()=>{emit('update:modelValue',false);emit('cancel');});
      const visible = computed({
        get: () => props.modelValue,
        set: (v) => emit('update:modelValue', v)
      });
      const rules = computed(() => {
        const r = {};
        props.fields.forEach((f) => {
          if (f.required) r[f.key] = [{ required: true, message: (f.type === 'select' || f.type === 'multiselect' ? '请选择' : '请输入') + f.label, trigger: f.type === 'select' ? 'change' : 'blur' }];
          if (/手机|电话/.test(f.label)) (r[f.key]||(r[f.key]=[])).push({validator:(_,v,cb)=>!v||/^1[3-9]\d{9}$/.test(String(v))||/^0\d{2,3}-?\d{7,8}$/.test(String(v))?cb():cb(new Error('请输入有效联系电话')),trigger:'blur'});
          if(f.type==='richtext'&&f.required)r[f.key]=[{validator:(_,v,cb)=>{const d=new DOMParser().parseFromString(v||'','text/html');d.body.textContent.trim()||d.querySelector('img,video')?cb():cb(new Error('请输入正文内容'));},trigger:'change'}];
          if(/邮箱/.test(f.label))(r[f.key]||(r[f.key]=[])).push({type:'email',message:'请输入有效邮箱',trigger:'blur'});
          if (f.rule) r[f.key] = f.rule;
        });
        return r;
      });
      const submit = async () => {
        if(!alive||!props.modelValue||saving.value||mediaBusy.value) return;
        const token=epoch,model=props.model,snapshot=JSON.stringify(model);saving.value=true;
        try {
          if(formRef.value) await formRef.value.validate();
          if(!alive||!props.modelValue||token!==epoch||props.model!==model)return;if(mediaBusy.value||JSON.stringify(props.model)!==snapshot)return ElementPlus.ElMessage.warning('校验期间输入已变化，请核实后重新保存');
          emit('submit', S.clone(props.model));
        } catch (e) { /* 错误保留在对应字段下方 */ }
        finally { Vue.nextTick(()=>{saving.value=false;}); }
      };
      return { formRef, visible, rules, submit, saving, beforeClose, cancel, article, preview, S, busy, mediaBusy };
    },
    template: `
    <component :is="mode==='drawer' ? 'el-drawer' : 'el-dialog'" v-model="visible" :title="title"
      :size="mode==='drawer' ? width : undefined" :width="mode==='drawer' ? undefined : width"
      :fullscreen="mode==='page'" :close-on-click-modal="false" :before-close="beforeClose" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="model" :rules="rules" :label-width="labelWidth" class="fd-form">
        <div class="fd-grid" :style="{gridTemplateColumns:'repeat('+columns+', minmax(0,1fr))'}">
          <el-form-item v-for="f in fields" :key="f.key" :label="f.label" :prop="f.key"
            :style="{gridColumn: (f.span||1)>=columns ? '1 / -1' : 'auto'}">
            <el-input v-if="!f.type || f.type==='input'" v-model="model[f.key]" :placeholder="f.ph||('请输入'+f.label)"
              :disabled="f.disabled" clearable>
              <template #append v-if="f.suffix">{{ f.suffix }}</template>
              <template #prepend v-if="f.prefix">{{ f.prefix }}</template>
            </el-input>
            <el-input v-else-if="f.type==='textarea'" v-model="model[f.key]" type="textarea" :rows="f.rows||3"
              :placeholder="f.ph||('请输入'+f.label)" :disabled="f.disabled" show-word-limit :maxlength="f.maxlength||200" />
            <el-input-number v-else-if="f.type==='number'" :model-value="model[f.key]===''?undefined:Number(model[f.key])" @update:model-value="v=>model[f.key]=v" :min="f.min" :max="f.max" :precision="f.precision" :step="f.step||1" :placeholder="f.ph||('请输入'+f.label)" :disabled="f.disabled" controls-position="right" style="width:100%" />
            <el-select v-else-if="f.type==='select'" v-model="model[f.key]" :placeholder="f.ph||'请选择'" clearable filterable :disabled="f.disabled" style="width:100%">
              <el-option v-for="o in (f.opts||[])" :key="o.value!==undefined?o.value:o" :label="o.label!==undefined?o.label:o" :value="o.value!==undefined?o.value:o" />
            </el-select>
            <el-select v-else-if="f.type==='multiselect'" v-model="model[f.key]" multiple collapse-tags :placeholder="f.ph||'请选择'" :disabled="f.disabled" style="width:100%">
              <el-option v-for="o in (f.opts||[])" :key="o.value!==undefined?o.value:o" :label="o.label!==undefined?o.label:o" :value="o.value!==undefined?o.value:o" />
            </el-select>
            <el-date-picker v-else-if="f.type==='date'" v-model="model[f.key]" type="date" :placeholder="f.ph||'选择日期'" value-format="YYYY-MM-DD" style="width:100%" :disabled="f.disabled" />
            <el-date-picker v-else-if="f.type==='daterange'" v-model="model[f.key]" type="daterange" range-separator="~" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:100%" />
            <el-switch v-else-if="f.type==='switch'" v-model="model[f.key]" :disabled="f.disabled" />
            <el-radio-group v-else-if="f.type==='radio'" v-model="model[f.key]" :disabled="f.disabled">
              <el-radio v-for="o in (f.opts||[])" :key="o" :label="o">{{ o }}</el-radio>
            </el-radio-group>
            <el-checkbox-group v-else-if="f.type==='checkbox'" v-model="model[f.key]" :disabled="f.disabled">
              <el-checkbox v-for="o in (f.opts||[])" :key="o" :label="o">{{ o }}</el-checkbox>
            </el-checkbox-group>
            <LocalUpload v-else-if="f.type==='upload'" v-model="model[f.key]" :limit="f.limit||6" :accept="f.accept" :disabled="f.disabled" @busy="busy"></LocalUpload>
            <RichEditor v-else-if="f.type==='richtext'" v-model="model[f.key]" @busy="busy"></RichEditor>
            <div v-else-if="f.type==='static'" class="fd-static">{{ model[f.key] || '-' }}</div>
            <div class="fd-tip" v-if="f.tip">{{ f.tip }}</div>
          </el-form-item>
        </div>
      </el-form>
      <el-dialog v-model="preview" title="资讯预览（本地演示）" width="720px" append-to-body>
        <h2>{{ model['标题'] }}</h2><p>{{ model['分类'] }} · {{ model['发布时间'] }}</p>
        <div class="article-preview" v-html="S.sanitizeHtml(model['正文'])"></div>
        <template #footer><el-button @click="preview=false">继续编辑</el-button><el-button type="primary" @click="preview=false;submit()">保存当前发布状态</el-button></template>
      </el-dialog>
      <template #footer>
        <el-button v-if="article" @click="preview=true">预览</el-button>
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" :loading="saving" :disabled="mediaBusy>0" @click="submit">{{ confirmText }}</el-button>
      </template>
    </component>`
  };

  S.FormDialog = FormDialog;
})();
