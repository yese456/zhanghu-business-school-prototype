/* ============================================================
   共享组件 · 页面辅助
   TipsBar   ：页面顶部「温馨提示」条
   FormPage  ：设置型页面（字段卡片 + 保存/重置）
   StatCards ：顶部数据卡片组
   ============================================================ */
(function () {
  'use strict';
  const S = window.SHARED;
  const { ref, computed } = Vue;
  const { ElMessage } = ElementPlus;

  const TipsBar = {
    name: 'TipsBar',
    props: { tips: { type: Array, default: () => [] }, title: { type: String, default: '温馨提示' } },
    setup() { return { open: ref(true) }; },
    template: `
    <div class="tips" v-if="tips && tips.length && open">
      <el-icon class="ic"><InfoFilled /></el-icon>
      <div class="bd">
        <div class="t">{{ title }}</div>
        <div class="l" v-for="(t,i) in tips" :key="i"><i>{{ i+1 }}</i>{{ t }}</div>
      </div>
      <el-icon class="x" @click="open=false"><Close /></el-icon>
    </div>`
  };

  const FormPage = {
    name: 'FormPage',
    props: { spec: { type: Object, required: true }, keyName: { type: String, default: '' } },
    setup(props) {
      const S = window.SHARED;
      const storeKey = computed(() => 'form:' + (props.keyName || props.spec.name || 'page'));

      /* 初值：优先已保存快照，其次按字段语义生成（原实现全部为空） */
      const buildDefaults = () => {
        const d = {};
        (props.spec.form || []).forEach((f, i) => {
          if (f.type === 'switch') d[f.key] = true;
          else if (f.type === 'upload') d[f.key] = [];
          else if (f.type === 'textarea') d[f.key] = (S.demoValue ? S.demoValue(f.label, 'text', i) : '') || '';
          else if (f.type === 'number') d[f.key] = S.demoValue ? S.demoValue(f.label, 'number', i) : 0;
          else d[f.key] = S.demoValue ? S.demoValue(f.label, f.type, i) : '';
        });
        return d;
      };
      const saved = S.store.get(storeKey.value);
      const data = ref(Object.assign(buildDefaults(), saved || {}));
      const dirty = ref(false),mediaBusy=ref(false);
      Vue.watch(data,()=>dirty.value=true,{deep:true});
      const snapshot = ref(JSON.parse(JSON.stringify(data.value)));

      const save = () => {
        if(mediaBusy.value)return;
        for(const f of props.spec.form||[]){const v=data.value[f.key];if((f.required||f.label.includes('*'))&&(v==null||v===''||(Array.isArray(v)&&!v.length)))return ElMessage.warning('请填写'+f.label.replace(/\*/g,''));if(/手机|电话/.test(f.label)&&v&&!/^1[3-9]\d{9}$/.test(String(v)))return ElMessage.warning('请填写正确的11位手机号');}
        S.store.set(storeKey.value, JSON.parse(JSON.stringify(data.value)));
        snapshot.value = JSON.parse(JSON.stringify(data.value));
        dirty.value = false;
        ElMessage.success('已保存，重新进入本页可看到保存后的内容');
      };
      const reset = () => {
        data.value = JSON.parse(JSON.stringify(snapshot.value));
        dirty.value = false;
        ElMessage.info('已还原为上次保存的内容');
      };
      return { data, save, reset, dirty, snapshot,mediaBusy };
    },
    template: `
    <div class="fp">
      <div class="fp-card">
        <div class="fp-hd">
          <h3>{{ spec.name }}</h3>
          <span class="sub" v-if="spec.tips">{{ spec.tips[0] }}</span>
        </div>
        <el-form :model="data" label-width="120px" class="fp-form">
          <el-form-item v-for="f in (spec.form||[])" :key="f.key" :label="f.label">
            <el-input v-if="!f.type || f.type==='input'" v-model="data[f.key]" :placeholder="'请输入'+f.label" clearable />
            <el-input v-else-if="f.type==='textarea'" v-model="data[f.key]" type="textarea" :rows="4" :placeholder="'请输入'+f.label" show-word-limit maxlength="500" />
            <el-input v-else-if="f.type==='number'" v-model="data[f.key]" type="number" />
            <el-date-picker v-else-if="f.type==='date'" v-model="data[f.key]" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
            <el-switch v-else-if="f.type==='switch'" v-model="data[f.key]" />
            <LocalUpload v-else-if="f.type==='upload'" v-model="data[f.key]" :limit="4" @busy="v=>mediaBusy=v"></LocalUpload>
            <el-input v-else v-model="data[f.key]" :placeholder="'请输入'+f.label" />
          </el-form-item>
        </el-form>
        <div class="fp-ft">
          <el-button type="primary" :disabled="mediaBusy" @click="save">保存</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>`
  };

  const StatCards = {
    name: 'StatCards',
    props: { items: { type: Array, default: () => [] }, cols: { type: Number, default: 4 } },
    template: `
    <div class="sc" :style="{gridTemplateColumns:'repeat('+cols+', minmax(0,1fr))'}">
      <div class="sc-it" v-for="(it,i) in items" :key="i" :style="it.color?{background:it.color,color:'#fff'}:null">
        <div class="l">{{ it.label }}</div>
        <div class="v">{{ it.value }}<span v-if="it.unit">{{ it.unit }}</span></div>
        <div class="d" v-if="it.delta">{{ it.delta }}</div>
      </div>
    </div>`
  };

  S.TipsBar = TipsBar;
  S.FormPage = FormPage;
  S.StatCards = StatCards;
})();
