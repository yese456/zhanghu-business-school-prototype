/* ============================================================
   共享组件 · 左侧导航 SideNav
   一套结构，两套主题（a = 客户后台深色 / b = 订货系统白色）
   - 章节模式：menu = [{title, icon, items:[{key,name}]}]
   - 平铺模式：menu = [{key, name, icon, indent, external}]
   ============================================================ */
(function () {
  'use strict';
  const S = window.SHARED;

  const SideNav = {
    name: 'SideNav',
    props: {
      menu: { type: Array, required: true },
      active: { type: String, default: '' },
      theme: { type: String, default: 'b' },
      width: { type: Number, default: 0 },
      brandTitle: { type: String, default: '' },
      brandSub: { type: String, default: '' },
      brandIcon: { type: String, default: 'Grid' },
      autoOpen: { type: Boolean, default: true }
    },
    emits: ['update:active', 'select'],
    setup(props, { emit }) {
      const { ref, reactive, computed, watch } = Vue;
      const isChapter = computed(() => props.menu.some((m) => Array.isArray(m.items)));
      const open = reactive({});
      const w = computed(() => props.width || (props.theme === 'a' ? 176 : 211));

      const chapterOf = computed(() => {
        let out = '';
        props.menu.forEach((c) => { if (Array.isArray(c.items) && c.items.some((i) => i.key === props.active)) out = c.title; });
        return out;
      });

      const ensureOpen = () => {
        props.menu.forEach((c) => {
          if (!Array.isArray(c.items)) return;
          if (open[c.title] === undefined) open[c.title] = c.items.some((i) => i.key === props.active) || c.__open === true;
        });
        if (props.autoOpen && chapterOf.value) open[chapterOf.value] = true;
      };
      ensureOpen();
      watch(() => props.active, ensureOpen);

      const pick = (k) => { if (k && k !== props.active) emit('update:active', k); emit('select', k); };
      const hitChapter = (c) => {
        if (Array.isArray(c.items) && c.items.length > 1) { open[c.title] = !open[c.title]; return; }
        const first = (c.items && c.items[0]) || null;
        if (first) pick(first.key);
      };

      return { isChapter, open, w, chapterOf, pick, hitChapter };
    },
    template: `
    <aside class="sn" :class="'sn--'+theme" :style="{width:w+'px', flexBasis:w+'px'}">
      <div class="sn-brand">
        <slot name="brand">
          <div class="sn-mark"><el-icon><component :is="brandIcon" /></el-icon></div>
          <div class="sn-bt">
            <div class="t">{{ brandTitle }}</div>
            <div class="s" v-if="brandSub">{{ brandSub }}</div>
          </div>
        </slot>
      </div>
      <nav class="sn-menu" data-demo="左侧菜单（章节 / 条目）">
        <template v-if="isChapter">
          <div class="sn-ch" v-for="c in menu" :key="c.title" :class="{open: open[c.title], active: chapterOf===c.title}">
            <div class="sn-ch-hd" @click="hitChapter(c)" data-demo-hd>
              <el-icon class="ic" v-if="c.icon"><component :is="c.icon" /></el-icon>
              <span class="tx">{{ c.title }}</span>
              <span class="ar" v-if="c.items && c.items.length>1"></span>
            </div>
            <div class="sn-ch-bd" v-show="open[c.title]" v-if="c.items && c.items.length>1">
              <div class="sn-it" v-for="it in c.items" :key="it.key" :class="{on: active===it.key}" @click="pick(it.key)">
                <span>{{ it.name }}</span>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="sn-it flat" v-for="m in menu" :key="m.key"
            :class="{on: active===m.key, indent: m.indent}" @click="pick(m.key)">
            <el-icon class="ic" v-if="m.icon"><component :is="m.icon" /></el-icon>
            <span class="tx">{{ m.name }}</span>
            <el-icon class="ext" v-if="m.external"><TopRight /></el-icon>
          </div>
        </template>
      </nav>
      <slot name="footer"></slot>
    </aside>`
  };

  S.SideNav = SideNav;
})();
