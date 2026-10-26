/* ============================================================
   共享组件 · 状态筛选条 StatusTabs
   tabs: [{ label, count, key }]
   对外契约与 v-model 一致：modelValue / update:modelValue
   ============================================================ */
(function () {
  'use strict';
  const S = window.SHARED;

  const StatusTabs = {
    name: 'StatusTabs',
    props: {
      tabs: { type: Array, default: () => [] },
      modelValue: { type: String, default: '' },
      allLabel: { type: String, default: '' },
      allCount: { type: [String, Number], default: '' }
    },
    emits: ['update:modelValue', 'change'],
    setup(props, { emit }) {
      const pick = (k) => { emit('update:modelValue', k); emit('change', k); };
      return { pick };
    },
    template: `
    <div class="stb" data-demo="状态分组（计数实时统计）">
      <div class="stb-it" v-if="allLabel" :class="{on: modelValue===allLabel}" @click="pick(allLabel)">
        <span>{{ allLabel }}</span><el-badge class="stb-count" v-if="allCount!==''" :value="String(allCount)" :show-zero="true" :type="modelValue===allLabel?'primary':'info'" />
      </div>
      <div class="stb-it" v-for="t in tabs" :key="t.key||t.label" :class="{on: modelValue===(t.key||t.label)}" @click="pick(t.key||t.label)">
        <span>{{ t.label }}</span><el-badge class="stb-count" v-if="t.count!==undefined" :value="String(t.count)" :show-zero="true" :type="modelValue===(t.key||t.label)?'primary':'info'" />
      </div>
      <slot></slot>
    </div>`
  };

  S.StatusTabs = StatusTabs;
})();
