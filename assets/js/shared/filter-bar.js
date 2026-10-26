/* ============================================================
   共享组件 · 筛选区 FilterBar
   fields: [{ type, label, key, ph, opts, width, span }]
   type: input | select | date | daterange | number | cascader | radio
   ============================================================ */
(function () {
  'use strict';
  const S = window.SHARED;

  const FilterBar = {
    name: 'FilterBar',
    props: {
      fields: { type: Array, default: () => [] },
      model: { type: Object, default: () => ({}) },
      actions: { type: Boolean, default: true },
      inline: { type: Boolean, default: false },
      labelWidth: { type: Number, default: 0 }
    },
    emits: ['search', 'reset'],
    setup(props, { emit }) {
      const { ref } = Vue;
      const more = ref(false);
      const visible = Vue.computed(() => (more.value ? props.fields : props.fields.filter((f) => !f.hidden)));
      const set = (k, v) => { props.model[k] = v; };
      return { more, visible, set, emit };
    },
    template: `
    <div class="fb" :class="{inline}" data-demo="查询筛选区">
      <div class="fb-row">
        <div class="fb-fi" v-for="f in visible" :key="f.key" :style="f.span?{gridColumn:'span '+f.span}:null">
          <label v-if="f.label" :style="labelWidth?{width:labelWidth+'px'}:null">{{ f.label }}</label>
          <el-input v-if="!f.type || f.type==='input'" :model-value="model[f.key]" @update:model-value="set(f.key,$event)"
            :placeholder="f.ph||('请输入'+f.label)" :style="{width:(f.width||172)+'px'}" size="small" clearable>
            <template #append v-if="f.append"><el-button size="small" @click="emit('search')">{{ f.append }}</el-button></template>
          </el-input>
          <el-input v-else-if="f.type==='number'" type="number" :model-value="model[f.key]" @update:model-value="set(f.key,$event)"
            :placeholder="f.ph||('请输入'+f.label)" :style="{width:(f.width||172)+'px'}" size="small" />
          <el-select v-else-if="f.type==='select'" :model-value="model[f.key]" @update:model-value="set(f.key,$event)"
            :placeholder="f.ph||'请选择'" :style="{width:(f.width||172)+'px'}" size="small" clearable filterable>
            <el-option v-for="o in (f.opts||[])" :key="o" :label="o" :value="o" />
          </el-select>
          <el-date-picker v-else-if="f.type==='date'" :model-value="model[f.key]" @update:model-value="set(f.key,$event)"
            type="date" size="small" :placeholder="f.ph||'选择日期'" :style="{width:(f.width||172)+'px'}" value-format="YYYY-MM-DD" />
          <el-date-picker v-else-if="f.type==='daterange'" :model-value="model[f.key]" @update:model-value="set(f.key,$event)"
            type="daterange" size="small" range-separator="~" :start-placeholder="f.ph||'开始日期'" :end-placeholder="f.ph2||'结束日期'"
            :style="{width:(f.width||238)+'px'}" value-format="YYYY-MM-DD" />
          <el-checkbox v-else-if="f.type==='checkbox'" :model-value="!!model[f.key]" @update:model-value="set(f.key,$event)" :aria-label="f.label"/>
          <el-radio-group v-else-if="f.type==='radio'" :model-value="model[f.key]" @update:model-value="set(f.key,$event)" size="small">
            <el-radio-button v-for="o in (f.opts||[])" :key="o" :label="o">{{ o }}</el-radio-button>
          </el-radio-group>
        </div>
        <div class="fb-acts" v-if="actions">
          <el-button type="primary" size="small" @click="emit('search')"><el-icon><Search /></el-icon>搜索</el-button>
          <el-button size="small" @click="emit('reset')">重置</el-button>
          <span class="fb-more" v-if="fields.some(f=>f.hidden)" @click="more=!more">{{ more?'收起':'更多' }}<el-icon><component :is="more?'ArrowUp':'ArrowDown'" /></el-icon></span>
        </div>
        <slot></slot>
      </div>
    </div>`
  };

  S.FilterBar = FilterBar;
})();
