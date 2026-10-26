/* 附件与富文本均保存可序列化数据，切页/刷新后可回显。 */
(function () {
  'use strict';
  const S = window.SHARED, { ref, computed, watch, nextTick } = Vue, { ElMessage } = ElementPlus;
  S.sanitizeHtml = html => {
    const d = new DOMParser().parseFromString(String(html || ''), 'text/html');
    d.querySelectorAll('script,style,iframe,object,embed,form,input,button,link,meta').forEach(n => n.remove());
    d.body.querySelectorAll('*').forEach(n => Array.from(n.attributes).forEach(a => {
      if (/^on/i.test(a.name) || a.name === 'srcdoc' || (['href','src'].includes(a.name) && !/^(https?:|data:image\/|data:video\/|\/|\.\.?\/|#)/i.test(a.value))) n.removeAttribute(a.name);
    })); return d.body.innerHTML;
  };
  const LocalUpload = {
    props: { modelValue:{default:()=>[]}, limit:{default:6}, disabled:Boolean, accept:{default:'.jpg,.jpeg,.png,.webp,.gif,.pdf,.csv,.txt,.mp4,.webm'} },
    emits:['update:modelValue','busy'],
    setup(p,{emit}) {
      const loading=ref(false), preview=ref(null);
      const files=computed(()=>Array.isArray(p.modelValue)?p.modelValue:[]);
      const change=async f=>{
        if(!f.raw) return; if(f.raw.size>1024*1024) return ElMessage.warning('请上传不超过 1MB 的演示附件');
        const ext=f.name.split('.').pop().toLowerCase();
        const allowed = String(p.accept).split(',').map(x => x.trim().replace(/^\./, '').toLowerCase());
        if(!['jpg','jpeg','png','webp','gif','pdf','csv','txt','mp4','webm','mkv'].includes(ext) || !allowed.includes(ext)) return ElMessage.error('文件格式不支持，请选择：' + p.accept);
        if(files.value.length>=p.limit) return ElMessage.warning('最多上传 '+p.limit+' 个文件');
        loading.value=true;emit('busy',true);
        try {
          const url=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f.raw);});
          if(files.value.reduce((n,x)=>n+(x.url||'').length,0)+url.length>3*1024*1024) return ElMessage.warning('本组附件总大小超过 3MB，请压缩后上传');
          emit('update:modelValue',files.value.concat({uid:f.uid,name:f.name,url,size:f.raw.size,type:f.raw.type,status:'success'}));
        } catch(e){ElMessage.error('文件读取失败，请重试');} finally{loading.value=false;emit('busy',false);}
      };
      const remove=f=>emit('update:modelValue',files.value.filter(x=>x.uid!==f.uid));
      return {files,loading,change,remove,preview};
    },
    template:`<div class="local-media" v-loading="loading"><el-upload v-if="!disabled" action="#" :auto-upload="false" :show-file-list="false" :accept="accept" :disabled="disabled||loading" :on-change="change"><el-button size="small" :disabled="disabled||loading">选择附件</el-button><template #tip><div class="el-upload__tip">每个文件 ≤1MB，最多 {{limit}} 个；支持 {{accept}}</div></template></el-upload><div v-if="disabled&&!files.length" class="muted">暂无附件</div><div class="media-file" v-for="f in files" :key="f.uid"><img v-if="(f.type||'').startsWith('image/')" :src="f.url" @click="preview=f" :alt="f.name"><a :href="f.url" :download="f.name">{{f.name}}</a><span>{{Math.ceil((f.size||0)/1024)}} KB</span><el-button v-if="!disabled" link type="danger" @click="remove(f)">移除</el-button></div><el-dialog :model-value="!!preview" title="图片预览" width="720px" append-to-body @close="preview=null"><img v-if="preview" :src="preview.url" style="width:100%" :alt="preview.name"></el-dialog></div>`
  };
  const RichEditor = {
    props:{modelValue:{default:''}}, emits:['update:modelValue','busy'],
    setup(p,{emit}) {
      const editor=ref(null), media=ref(false), files=ref([]), video=ref('');
      const sync=()=>emit('update:modelValue',S.sanitizeHtml(editor.value?.innerHTML));
      const set=()=>{if(editor.value&&document.activeElement!==editor.value)editor.value.innerHTML=S.sanitizeHtml(p.modelValue);};
      watch(()=>p.modelValue,set);Vue.onMounted(set);
      const command=(name,val)=>{editor.value.focus();document.execCommand(name,false,val||null);sync();};
      const addMedia=()=>{const html=files.value.filter(f=>(f.type||'').startsWith('image/')).map(f=>'<p><img src="'+f.url+'" alt="'+f.name.replace(/["<>]/g,'')+'"></p>').join('');command('insertHTML',html);files.value=[];media.value=false;};
      const addVideo=()=>{if(!/^https:\/\/[^\s]+\.(mp4|webm)(\?.*)?$/i.test(video.value))return ElMessage.warning('请输入 HTTPS 的 MP4 / WebM 视频地址');const v=document.createElement('video');v.src=video.value;v.controls=true;command('insertHTML',v.outerHTML);video.value='';};
      const paste=e=>{e.preventDefault();const h=e.clipboardData.getData('text/html');if(h)command('insertHTML',S.sanitizeHtml(h));else command('insertText',e.clipboardData.getData('text/plain'));};
      return {editor,sync,command,media,files,addMedia,video,addVideo,paste};
    },
    template:`<div class="rich-editor"><div class="rich-tools"><el-button size="small" @mousedown.prevent @click="command('bold')">加粗</el-button><el-button size="small" @mousedown.prevent @click="command('italic')">斜体</el-button><el-button size="small" @mousedown.prevent @click="command('formatBlock','h3')">小标题</el-button><el-button size="small" @mousedown.prevent @click="command('insertUnorderedList')">列表</el-button><el-button size="small" @mousedown.prevent @click="command('undo')">撤销</el-button><el-button size="small" @click="media=true">插入图片</el-button><el-button size="small" @mousedown.prevent @click="command('removeFormat')">清除格式</el-button></div><div ref="editor" class="rich-content" contenteditable="true" role="textbox" aria-label="资讯正文" aria-multiline="true" @input="sync" @paste="paste"></div><div class="rich-tools"><el-input v-model="video" placeholder="HTTPS MP4 / WebM 视频地址" size="small"></el-input><el-button size="small" @click="addVideo">插入视频</el-button></div><el-dialog v-model="media" title="插入正文图片" width="600px" append-to-body><LocalUpload v-model="files" @busy="v=>$emit('busy',v)" accept=".png,.jpg,.jpeg,.webp,.gif"></LocalUpload><template #footer><el-button @click="media=false">取消</el-button><el-button type="primary" @click="addMedia" :disabled="!files.length">插入</el-button></template></el-dialog></div>`
  };
  S.LocalUpload=LocalUpload;S.RichEditor=RichEditor;
})();
