/* ============================================================
   共享组件 · 数据表格 DataTable
   cols: [{
     prop, label, width, minWidth, align, fixed, sortable,
     type: 'prod' | 'tag' | 'money' | 'link' | 'pct' | 'progress' | 'index' | 'selection',
     ellipsis, sub（第二行小字）, opts（tag 可选值）
   }]
   ops: [ '编辑' ] 或 [{ label, type, show(row) }]
   ============================================================ */
(function () {
  'use strict';
  const S = window.SHARED;

  const DataTable = {
    name: 'DataTable',
    props: {
      cols: { type: Array, default: () => [] },
      tagLabels: { type: Object, default: () => ({}) },
      rows: { type: Array, default: () => [] },
      ops: { type: Array, default: () => [] },
      selectable: { type: Boolean, default: true },
      loading: { type: Boolean, default: false },
      height: { type: [String, Number], default: '' },
      rowKey: { type: String, default: 'id' },
      opsWidth: { type: Number, default: 0 },
      emptyText: { type: String, default: '暂无数据' },
      size: { type: String, default: 'default' },
      stripe: { type: Boolean, default: false },
      maxOps: { type: Number, default: 2 },
      remoteSort: Boolean, expandable: Boolean, ringProgress: Boolean,
      filterOptions: { type: Object, default: () => ({}) },
      columnFilters: { type: Object, default: () => ({}) }
    },
    emits: ['selection-change', 'op', 'link', 'row-click', 'sort-change', 'filter-change'],
    setup(props, { emit, expose }) {
      const { computed } = Vue;
      const tableRef = Vue.ref(null);
      expose({ clearSelection: () => tableRef.value?.clearSelection(), toggleRowSelection: (r,v) => tableRef.value?.toggleRowSelection(r,v) });
      const colWidth = computed(() => props.opsWidth || (props.ops.length > props.maxOps ? 118 : 150));
      /* 文本列改用 min-width：Element 会把容器余量按比例分给这些列，
         否则固定 width 的列不会撑满，右侧会留出一大片空白。 */
      const isFlex = (c) => !c.exactWidth && (c.type || 'text') === 'text' && !c.money && !c.pct;
      const opList = (row) => props.ops
        .map((o) => (typeof o === 'string' ? { label: o } : o))
        .filter((o) => !o.show || o.show(row));
      /* 超出 maxOps 的操作收进「更多」，与线上一致 */
      const headOps = (row) => {
        const all = opList(row);
        return all.length > props.maxOps ? all.slice(0, props.maxOps - 1) : all;
      };
      const moreOps = (row) => {
        const all = opList(row);
        return all.length > props.maxOps ? all.slice(props.maxOps - 1) : [];
      };
      const lineTotal = (row,line) => {
        if(row.__entity!=='orders')return S.money(line.qty*line.price);
        const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
        return valid(line.qty)&&valid(line.price)&&Number.isFinite(line.qty*line.price)?S.money(line.qty*line.price):'未记录';
      };
      const cellText = (row, c) => {
        if(props.tagLabels[c.prop]?.[row[c.prop]]!==undefined)return props.tagLabels[c.prop][row[c.prop]];
        const v = row[c.prop];
        if (v === null || v === undefined || v === '') return c.empty || '-';
        if (Array.isArray(v)) return v.map(x=>typeof x==='object'?x.name:x).join('、');
        if (c.money) return S.money(v);
        if (c.pct) return (Number(v) * 100).toFixed(1) + '%';
        return String(v);
      };
      /* 进度列可能是「方案(草稿)」这类状态文案，需区分渲染 */
      const isNum = (v) => v !== '' && v !== null && v !== undefined && !isNaN(Number(v));
      const progress = v => isNum(v) ? Math.min(100,Math.max(0,Number(v))) : ({'方案(草稿)':0,'草稿':0,'待排产':5,'排产中':15,'待开工':25,'生产中':55,'生产完成':85,'已入库':90,'已出库':100,'已完成':100}[v]||0);
      const isImageCol = c => c.type === 'image' || /图片|商品图|封面|照片|头像/.test(c.label);
      const imageSrc = (row,c) => {
        const value = row[c.prop];
        const item = Array.isArray(value) ? value[0] : value;
        const src = typeof item === 'string' ? item : (item?.url || item?.data || item?.src || '');
        return /^(\.\.?\/|\/|https?:\/\/|data:image\/|blob:)/i.test(src) ? src : '';
      };
      return { colWidth, opList, headOps, moreOps, lineTotal, cellText, isNum, S, isFlex, tableRef, progress, isImageCol, imageSrc };
    },
    template: `
    <el-table ref="tableRef" :data="rows" :size="size" :stripe="stripe" :height="height||undefined" :max-height="height?undefined:560" :row-key="rowKey"
      :empty-text="emptyText" v-loading="loading" border data-demo="数据表格"
      @selection-change="e=>$emit('selection-change',e)" @row-click="r=>$emit('row-click',r)"
      @sort-change="e=>$emit('sort-change',e)" @filter-change="e=>$emit('filter-change',e)">
      <el-table-column v-if="selectable" type="selection" :reserve-selection="true" width="42" fixed />
      <el-table-column v-if="expandable" type="expand" width="42" fixed>
        <template #default="s"><div class="dt-expanded">
          <el-descriptions :column="3" border size="small"><el-descriptions-item v-for="c in cols" :key="c.prop" :label="c.label">{{cellText(s.row,c)}}</el-descriptions-item></el-descriptions>
          <el-table v-if="s.row.__lines&&s.row.__lines.length" :data="s.row.__lines" size="small" border>
            <el-table-column prop="name" label="产品名称" /><el-table-column prop="spec" label="规格尺寸" />
            <el-table-column prop="qty" label="数量" width="90" /><el-table-column label="单价" width="130"><template #default="l">{{S.money(l.row.price)}}</template></el-table-column>
            <el-table-column label="合计" width="130"><template #default="l">{{lineTotal(s.row,l.row)}}</template></el-table-column>
          </el-table>
        </div></template>
      </el-table-column>
      <el-table-column v-for="(c,i) in cols" :key="c.prop||c.label||i" :prop="c.prop" :label="c.label"
        :width="isFlex(c)?undefined:c.width" :min-width="isFlex(c)?(Number(c.width)||160):(c.minWidth||120)"
        :align="c.align||'left'" :fixed="c.fixed" :column-key="c.prop"
        :sortable="c.sortable===false?false:(remoteSort?'custom':true)" :show-overflow-tooltip="!!c.ellipsis"
        :filters="filterOptions[c.prop]" :filtered-value="columnFilters[c.prop]||[]">
        <template #default="s">
          <!-- 产品（图 + 名称 + 副标题） -->
          <el-image v-if="isImageCol(c) && imageSrc(s.row,c)" :src="imageSrc(s.row,c)" class="dt-thumb" fit="contain" :preview-src-list="[imageSrc(s.row,c)]" preview-teleported @click.stop><template #error><span>图片加载失败</span></template></el-image>
          <span v-else-if="isImageCol(c)">未上传图片</span>
          <div v-else-if="c.type==='prod'" class="dt-prod" @click.stop="$emit('link',{row:s.row,col:c})">
            <el-image v-if="s.row[c.imgProp||'img']" class="dt-thumb" :src="s.row[c.imgProp||'img']" fit="cover" />
            <div v-else class="dt-thumb ph"></div>
            <div class="dt-prod-tx">
              <div class="n">{{ s.row[c.prop] }}</div>
              <div class="s">{{ c.subProp ? s.row[c.subProp] : (s.row.sku || ('共 ' + (s.row.products||1) + ' 件商品')) }}</div>
            </div>
          </div>
          <!-- 状态标签 -->
          <el-image v-else-if="/图片|商品图|封面/.test(c.label)&&typeof s.row[c.prop]==='string'&&s.row[c.prop]" :src="s.row[c.prop]" class="dt-thumb" fit="cover" :preview-src-list="[s.row[c.prop]]" preview-teleported @click.stop />
          <el-tag v-else-if="c.type==='tag'" size="small" :type="S.tagType(s.row[c.prop])" effect="light">{{ tagLabels[c.prop]?.[s.row[c.prop]] ?? s.row[c.prop] }}</el-tag>
          <!-- 可点击文本 -->
          <span v-else-if="c.type==='link'" class="dt-link" @click.stop="$emit('link',{row:s.row,col:c})">{{ cellText(s.row,c) }}</span>
          <!-- 金额 -->
          <span v-else-if="c.money" class="dt-num">{{ cellText(s.row,c) }}</span>
          <!-- 百分比 -->
          <span v-else-if="c.pct" class="dt-num">{{ cellText(s.row,c) }}</span>
          <!-- 进度条 -->
          <div v-else-if="c.type==='progress'&&ringProgress" class="dt-progress-cell"><el-progress type="circle" :width="36" :stroke-width="3" :percentage="progress(s.row[c.prop])" /></div>
          <div v-else-if="c.type==='progress' && isNum(s.row[c.prop])" class="dt-prog">
            <span class="bar"><i :style="{width:Number(s.row[c.prop]||0)+'%'}"></i></span>
            <em>{{ Number(s.row[c.prop]||0) }}%</em>
          </div>
          <el-tag v-else-if="c.type==='progress'" size="small" :type="S.tagType(s.row[c.prop])" effect="light">{{ s.row[c.prop] }}</el-tag>
          <!-- 两行文本 -->
          <div v-else-if="c.sub" class="dt-two">
            <div class="n">{{ cellText(s.row,c) }}</div>
            <div class="s">{{ s.row[c.sub] }}</div>
          </div>
          <span v-else>{{ cellText(s.row,c) }}</span>
        </template>
      </el-table-column>
      <el-table-column v-if="ops.length" label="操作" :width="colWidth" fixed="right">
        <template #default="s">
          <div class="dt-ops" :class="{multi:opList(s.row).length>maxOps}">
            <span class="dt-op" role="button" tabindex="0" v-for="(o,i) in headOps(s.row)" :key="i" :class="o.type" @keydown.enter.stop="$emit('op',{row:s.row,label:o.label})" @click.stop="$emit('op',{row:s.row,label:o.label})">{{ o.label }}</span>
            <el-dropdown v-if="moreOps(s.row).length" trigger="click" class="dt-more"
              @command="c=>$emit('op',{row:s.row,label:c})">
              <span class="dt-op">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="o in moreOps(s.row)" :key="o.label" :command="o.label">{{ o.label }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
      <template #empty><el-empty :description="emptyText" :image-size="70"><slot name="empty" /></el-empty></template>
    </el-table>`
  };

  S.DataTable = DataTable;
})();
