/* 商学院独立演示仓库。种子数据是界面对照样本与业务 mock，不连接原站 API。 */
(function () {
  'use strict';
  const S = window.SHARED, copy = x => JSON.parse(JSON.stringify(x));
  const KEY = 'a:academy:v1', FILE_DB = 'aicard-academy-files-v1';
  const routes = { bsCourse:'课程管理', learnRecord:'学习记录', bsSort:'课程分类', bsRecommend:'推荐位管理', learnCorner:'学习园地', bsSet:'学院设置' };
  const old = window.SCHEMA_A || {}, schema = {};
  Object.entries(old).forEach(([key,value]) => {
    if (key === 'bsCourse') Object.entries(routes).forEach(([k,name]) => schema[k] = { ...(old[k] || {}), name, chapter:'商学院' });
    if (!routes[key]) schema[key] = value;
  });
  if (!schema.bsCourse) Object.entries(routes).forEach(([k,name]) => schema[k] = {name,chapter:'商学院'});
  window.SCHEMA_A = schema;
  const now = () => new Date().toLocaleString('sv-SE').replace('T',' ').slice(0,16);
  const id = prefix => prefix + '-' + (window.crypto?.randomUUID?.() || Date.now()+'-'+Math.random().toString(36).slice(2));
  const tabs = ['产品配置','产品手册','下单测量手册','价格表','升级信息'];
  const emptyTabs = () => Object.fromEntries(tabs.map(t => [t,{images:[],files:[],videos:[]}]));
  const asset = (name,ext='pdf',n=0) => ({id:'seed-'+ext+'-'+n,name:name+'.'+ext,size:{"mp4":144053,"mp3":96565,"xlsx":17028,"pdf":1754}[ext],type:ext==='mp4'?'video/mp4':ext==='mp3'?'audio/mpeg':ext==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'application/pdf',url:'../assets/academy/'+(ext==='mp4'?'training-demo.mp4':ext==='mp3'?'training-demo.mp3':ext==='xlsx'?'training-plan.xlsx':'training-handbook.pdf')});
  const image = (file,n=0) => ({id:'photo-'+n,name:file,size:({"mat-wood-1.jpg":88837,"sofa-1.jpg":121627,"bed-1.jpg":68761,"dining-1.jpg":46738,"chair-1.jpg":87631})[file]||88000,type:'image/jpeg',url:'../assets/img/'+file});
  const libraryNames = ['门店接待礼仪','产品讲解逻辑话术','私域转化','小区楼盘客户变现','掌狐系统展会落地指导书','展会投放计划明细','实木材质识别','沙发结构与工艺','软床测量规范','床垫选购要点','门店晨会标准','售后工单处理','客户异议处理','陈列与灯光','新员工消防培训'];
  function legacySeed() {
    const categories = [
      ['c6','本月推荐','',1000],['c61','语文作文','c6',1000],['c62','必背古文','c6',100],
      ['c7','新人培训','',1],['c71','如何使用灭火器','c7',0],
      ['c8','产品学习','',1],['c81','社群运营','c8',0],['c82','小红书运营','c8',0],
      ['c5','技能提升','',1],['c51','常用操作','c5',0],['c4','门店管理培训','',1],['c3','销售技能培训','',1],['c2','企业文化','',1],['c1','产品讲解','',1]
    ].map(([id,name,parentId,sort])=>({id,name,parentId,sort}));
    const library = Array.from({length:111},(_,i) => {
      const ext = i===0?'mp4':i===1?'xlsx':i%6===2?'mp3':i%4===0?'mp4':i%7===0?'xlsx':'pdf';
      const title = libraryNames[i%libraryNames.length]+(i>=libraryNames.length?'·'+['基础篇','案例篇','实操篇','复盘篇','进阶篇','测评篇','答疑篇'][Math.floor(i/libraryNames.length)-1]:'');
      return {...asset(title,ext,i),id:'lib-'+i,kind:ext==='mp4'?'视频':ext==='mp3'?'音频':'文件',title};
    });
    // 第一屏及 6 个状态样本取自现场所见；后续名称为家居企业培训 mock。
    const first = [
      ['章节课-教材库选','章节','c4',4,false,8,'2025-04-28 13:32'],
      ['常规课-教材库选','文档','c51',1,false,0,'2025-04-28 13:30'],
      ['产品基础篇','章节','c3',8,false,1,'2026-06-15 10:36'],
      ['测试','章节','c1',2,false,2,'2026-05-29 15:01'],
      ['111测试','文档','c61',1,true,1,'2026-01-14 17:32'],
      ['艾绿版面搭建','文档','c61',1,false,2,'2026-01-14 17:28'],
      ['培训章节2','章节','c1',2,false,3,'2025-12-09 16:15'],
      ['常规课语文','文档','c61',1,false,0,'2025-12-09 16:13'],
      ['11111','文档','c61',1,false,0,'2025-12-08 16:40'],
      ['艾绿版面搭建','文档','c1',1,false,0,'2025-12-08 16:30']
    ];
    const base = (name,type,categoryId,amount,optional,createdAt,index,status='进行中') => {
      const lesson = j => ({id:'lesson-'+index+'-'+j,name:index===0?['门店接待礼仪','产品讲解逻辑话术','私域转化','小区楼盘客户变现'][j]:index===2?['1.1《中国室内家具发展历史与生活方式变化》','1.2《博蕊斯的品牌故事与文化》','1.3《博蕊斯沙发6大主材介绍》','1.4《博蕊斯软床3大结构8大主材》','1.5《博蕊斯床垫3大结构8大主材》','1.6《博蕊斯五金产品介绍》','1.7《门店接待SOP流程和话术》','1.8《6大流行风格装修风格解析》'][j]:libraryNames[(index+j)%libraryNames.length],content:copy(library[(index+j)%library.length]),minSeconds:600,percent:100,teachers:[],examId:'',intro:'<p>结合门店实际案例，掌握操作步骤与服务标准。</p>',attachments:[asset('课后练习与检查清单','xlsx',index)]});
      let sections = [];
      if(type==='章节') {
        const sectionNames = index===0?['销售基础技能','成交转化技巧']:index===2?['企业文化认知篇','产品基础知识全解析','门店SOP接待流程标准','流行装修风格认知']:['章节1'];
        sections = sectionNames.map((name,k)=>({id:'section-'+index+'-'+k,name,lessons:[]}));
        for(let j=0;j<amount;j++) {const k=index===0?Math.floor(j/2):index===2?(j<2?0:j<6?1:j===6?2:3):0;sections[k].lessons.push(lesson(j));}
      }
      return {id:'course-'+index,name,type,categoryId,optional,status,pinned:index<2,teachers:index===2?['潘老师','李老师','周老师']:[],scope:'all',peopleIds:[],deptIds:[],sections,content:type==='章节'?null:{...copy(library[(index+1)%library.length]),...(type==='文档'?asset(name,'pdf',index):type==='音频'?asset(name,'mp3',index):asset(name,'mp4',index))},cover:null,minSeconds:600,percent:100,examId:'',intro:'<p>'+name+'培训课程。通过知识讲解、情景演练与检查清单，帮助团队规范工作流程。</p>',attachments:type==='章节'?[]:[asset('课后练习与检查清单','xlsx',index)],unlock:false,creator:'专用',createdAt,updatedAt:createdAt};
    };
    const courses = first.map((v,i)=>base(v[0],v[1],v[2],v[3],v[4],v[6],i));
    const targets = {c61:33,c62:2,c71:2,c81:1,c82:1,c51:12,c4:1,c3:1,c2:3,c1:16};
    Object.entries(targets).forEach(([categoryId,total])=>{
      const count=courses.filter(c=>c.categoryId===categoryId).length;
      for(let j=count;j<total;j++) {
        const i=courses.length, themes=categoryId==='c61'?['门店服务案例写作','客户需求记录规范','品牌故事表达','产品卖点文案','售后沟通纪要','陈列观察笔记','活动复盘报告','工作周报表达']:categoryId==='c62'?['传统文化与企业精神','经典阅读分享']:categoryId==='c71'?['灭火器操作演练','仓库消防巡查']:categoryId==='c2'?['企业文化与价值观','团队协作与服务承诺','新员工入职指南']:libraryNames;
        courses.push(base(themes[j%themes.length]+(j>=themes.length?' '+(Math.floor(j/themes.length)+1):''),i%6===0?'视频':i%9===0?'音频':'文档',categoryId,1,j%4===0,'2025-'+String(11-Math.floor(i/12)).padStart(2,'0')+'-'+String(28-i%24).padStart(2,'0')+' 10:30',i));
      }
    });
    // 保持原站 72 门总数及分类数量，3 个未发布、3 个已下架均可验证。
    const pick = (categoryId,offset=0) => courses.filter(c=>c.categoryId===categoryId).slice(0).reverse()[offset];
    [['c1',0,'测试测试1332','视频','未发布'],['c61',0,'232','视频','未发布'],['c2',0,'常规课程317','视频','未发布'],['c81',0,'唱跳rap篮球','音频','已下架'],['c51',0,'政治课','文档','已下架'],['c1',1,'常规课程-音频','音频','已下架']].forEach(([cat,offset,name,type,status])=>{
      const c=pick(cat,offset);Object.assign(c,{name,type,status,content:asset(name,type==='音频'?'mp3':type==='视频'?'mp4':'pdf',c.id),intro:'<p>'+name+' · 企业培训演示内容。</p>'});
    });
    const names=['chenqing','刘晓','王燕','李龙轩','cangguan','李玲','陈琴','掌狐客服','陈清娇','广东家溢德照明科技有限公司','袁彩怡','张松涛','小枫叶','周明','陈晓','李佳','王晨','杨帆','郑敏','黄莉','胡彬','林楠','马磊','何静','许宁','韩雪','蒋涛','沈悦','宋伟','曹颖','卢杰','罗琳','汪洋','田欣','董超','彭燕','苏晨','魏佳'];
    const depts=['华东大区','云南','华南大区','惠州','上海','龙江镇东顺','直营门店','销售支持'];
    const people=names.map((name,i)=>({id:'person-'+i,name,dept:i===0?'华东大区':i===1?'云南':i===2?'华东大区':i===3?'华南大区':i===4?'':i===10?'华东大区':depts[i%depts.length],role:i%5===0?'店长':i%3===0?'导购':'员工',phone:'1380000'+String(1000+i)}));
    const records=[];
    const record=(c,person,index,done=false,seconds=0)=>{
      const ls=c.type==='章节'?c.sections.flatMap(s=>s.lessons.map(l=>({sectionName:s.name,...l}))):[{id:'regular',name:c.name}];
      return {id:'record-'+c.id+'-'+person.id,courseId:c.id,personId:person.id,startedAt:index===0?'2026-06-08 10:07:49':'2026-06-'+String(10+index%15).padStart(2,'0')+' 10:49:13',completedAt:done?'2026-06-'+String(10+index%15).padStart(2,'0')+' 11:10:14':'',lessons:ls.map((l,j)=>({lessonId:l.id,sectionName:l.sectionName||'',seconds:done?Math.max(20,Math.floor(seconds/ls.length)):j===0?seconds:0,status:done||j===0&&c.type==='章节'?'已完成':j===0?'学习中':'未学习',startedAt:j===0||done?'2026-06-15 10:49:13':'',completedAt:done||j===0&&c.type==='章节'?'2026-06-15 10:50:14':''}))};
    };
    first.forEach((v,i)=>{for(let j=0;j<v[5];j++)records.push(record(courses[i],people[i===2?10:j],i+j,i===3, i===2?39:62+j*20));});
    people.forEach((p,i)=>{
      const amount=i===0?15:2+(i%6);
      for(let j=0;j<amount;j++) {const c=courses[10+(i*7+j)%56];if(c.status!=='进行中'||records.some(r=>r.courseId===c.id&&r.personId===p.id))continue;records.push(record(c,p,i+j,j%3===0,90+(i*31+j*47)%850));}
    });
    const gardenCategories=['新人专区','品牌价值','主推爆款','零售学院','质量检测','客户服务','流量策划','产品大全','门店优秀案例','信息及AI工具'].map((name,i)=>({id:'garden-cat-'+i,name,sort:999-i,createdAt:i===3?'2026-05-21 10:08':'2026-09-07 16:'+String(46+i).padStart(2,'0')}));
    const gardens=[['实 木',0,'2026-09-02 13:24','2026-09-14 10:21','小枫叶'],['终端导购学习课件',3,'2026-05-21 10:13','2026-05-21 10:14','专用']].map(([name,k,createdAt,updatedAt,operator],i)=>{
      const content=emptyTabs();tabs.forEach((t,j)=>{content[t].images=[image(['mat-wood-1.jpg','sofa-1.jpg','bed-1.jpg','dining-1.jpg','chair-1.jpg'][j],i*10+j)];content[t].files=[asset(t+'学习资料',j===3?'xlsx':'pdf',i*10+j)];if(j!==3)content[t].videos=[asset(t+'讲解','mp4',i*10+j)];});
      return {id:'garden-'+i,name,categoryId:'garden-cat-'+k,sort:0,visible:true,cover:image(i?'sofa-1.jpg':'mat-wood-1.jpg',99+i),content,createdAt,updatedAt,operator};
    });
    return {version:1,categories,courses,people,records,library,exams:[{"id":"exam-1","name":"测试1"},{"id":"exam-2","name":"测试"},{"id":"exam-3","name":"2025年客户满意度问卷调查表"},{"id":"exam-4","name":"3+N考试"},{"id":"exam-5","name":"公司产品基础认知考试"},{"id":"exam-6","name":"测试问卷"},{"id":"exam-7","name":"koashi ceshi"},{"id":"exam-8","name":"测试50"},{"id":"exam-9","name":"调查问卷"},{"id":"exam-10","name":"业务知识考试"},{"id":"exam-11","name":"新员工入职培训考试"},{"id":"exam-12","name":"初级导购摸底考试"},{"id":"exam-13","name":"技能培训考试"},{"id":"exam-14","name":"部门业务考试"},{"id":"exam-15","name":"培训结业考试"},{"id":"exam-16","name":"产品知识竞赛"},{"id":"exam-17","name":"客户售后问卷"}],gardenCategories,gardens,settings:{menuName:'企业商学院'},notifications:[],trash:[],prefs:{gardenColumns:['categoryName','sort','visible','updatedAt','createdAt','operator'],gardenCategoryColumns:['count','sort','createdAt']},revision:0};
  }
  const SEED_VERSION=20261024, BACKUP_KEY=KEY+':backup:before-home-20261024';
  const trainingAsset=(name,ext='pdf',n=0)=>({id:'qimu-material-'+ext+'-'+n,name:name+'.'+ext,type:ext==='mp4'?'video/mp4':ext==='mp3'?'audio/mpeg':ext==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'application/pdf',size:0,mock:true,availability:'资料目录示意，未上传原文件，不提供预览或下载'});
  const domainGroups=[
    {category:'c4',teacher:0,audience:'门店店长与导购',purpose:'统一接待与成交动作，减少需求遗漏和口头承诺',outline:['识别家庭成员、空间与预算需求','通过样品体验和方案说明建立价值','记录承诺、交接设计并追踪回访'],cover:'sofa-1.jpg'},
    {category:'c1',teacher:1,audience:'门店导购与产品专员',purpose:'准确说明产品结构、使用边界和配置差异',outline:['识别产品结构与系列定位','对照样品解释材料和工艺','形成适配家庭场景的选型建议'],cover:'bed-1.jpg'},
    {category:'c61',teacher:2,audience:'产品、采购与设计人员',purpose:'把材料选型转化为可核验的订单配置',outline:['辨识基材、饰面与性能差异','核对样板、规格和供应批次','记录适用环境与替代配置审批'],cover:'mat-wood-1.jpg'},
    {category:'c51',teacher:3,audience:'量尺设计师与拆单人员',purpose:'降低复尺返工和设计下单偏差',outline:['采集现场尺寸和设备条件','复核柜体结构、功能与避让','完成客户确认及设计生产交接'],cover:'dining-1.jpg'},
    {category:'c82',teacher:4,audience:'生产班组与质检人员',purpose:'以工序检查减少错漏件和外观缺陷',outline:['核验工单、图纸和物料标识','按关键控制点检查首件及过程','隔离异常并形成返工追溯记录'],cover:'mat-wood-1.jpg'},
    {category:'c3',teacher:5,audience:'仓储、配送与安装人员',purpose:'提升一次交付成功率并减少现场损伤',outline:['复核订单齐套和现场条件','按作业顺序落实保护与安装','完成调试、验收和问题交接'],cover:'dining-1.jpg'},
    {category:'c62',teacher:6,audience:'售后客服与服务主管',purpose:'让问题有记录、有响应、有闭环',outline:['澄清现象与客户诉求','收集证据并判断处理路径','确认方案、复查结果与沉淀案例'],cover:'sofa-1.jpg'},
    {category:'c71',teacher:7,audience:'全员与现场班组长',purpose:'识别岗位风险并落实日常检查和应急报告',outline:['辨识作业环境和岗位危险源','确认防护、隔离及安全操作条件','发现异常立即停工并按流程报告'],cover:'chair-1.jpg'},
    {category:'c2',teacher:8,audience:'新员工、店长与业务骨干',purpose:'对齐栖木家居从设计到售后的跨部门责任',outline:['理解制造与零售一体的服务链路','明确岗位责任、交接证据和时限','以例会和复盘推动问题闭环'],cover:'chair-1.jpg'}
  ];
  const courseTitles=[
    '门店接待与需求诊断','门店晨会与服务巡检','栖木家居产品体系与选型','家庭收纳需求访谈','样品体验与价值讲解','全屋方案报价说明','客户异议识别与回应','定金订单与设计交接',
    '云栖沙发结构与坐感选型','眠语软床面料与床架工艺','舒眠床垫支撑层与软硬度','原木餐桌椅结构与保养','悦居客厅成套搭配','小户型家具尺寸规划','适老家具选型与使用边界','布艺色卡与样品体验',
    '人造板基材与饰面识别','柜体板材环保资料核验','封边胶线与耐用性检查','门板色差与纹理方向确认','铰链与抽屉导轨选型','柜内收纳五金配置','沙发面料耐磨与清洁边界','木皮与实木材料应用',
    '入户量尺与现场信息采集','厨房水电与设备尺寸复核','衣柜功能分区与人体尺度','全屋定制方案确认要点','异形空间收口设计','拆单图纸与物料清单校核','订单变更与版本签收','设计下单前复核清单',
    '板材开料与标签追溯','封边工序首件检查','排孔定位与连接件装配','门板外观检验标准','软包裁剪与缝制质量控制','沙发木架与底布检验','成品试装与功能检查','包装防护与出厂检验',
    '成品入库与库位管理','订单齐套与装车复核','入户配送与成品保护','柜体安装调平与固定','台面与墙面收口验收','五金调试与门缝校准','软体家具入户组装','交付验收与遗留问题闭环',
    '售后报修受理与分级','板件磕碰与补件取证','柜门异响与五金排查','沙发面料清洁指引','木制家具季节性养护','延期交付沟通与承诺管理','维修回访与满意度记录','售后案例复盘与质量反馈',
    '门店消防巡查与疏散','仓储堆码与通道管理','木工设备岗位安全','粉尘清理与作业防护','安装现场用电检查','登高作业风险识别','搬运协作与防护用品','异常事件报告与应急联络',
    '栖木家居服务承诺与岗位协作','新员工入职与学习路径','客户信息保护与授权使用','门店陈列与样品台账','促销活动规则与价格核对','门店库存与补货协同','生产交付周例会管理','订单全流程责任交接'
  ];
  const extraMaterials=['接待需求记录表','门店服务巡检清单','产品系列配置速查表','收纳需求访谈提纲','样品体验讲解卡','方案报价核对表','客户异议沟通记录','设计交接确认单','云栖沙发结构图解','眠语软床配置手册','舒眠床垫选型指南','原木餐桌保养卡','板材入库核验表','饰面色板签样记录','封边首件检查表','五金配置对照表','面料清洁说明卡','入户量尺记录表','厨房设备复核清单','衣柜功能确认单','收口节点图解','拆单物料校核表','订单变更签收单','开料标签核验表','排孔过程检查表','门板外观缺陷图谱','软包缝制检查单','木架装配巡检表','成品试装记录表','包装检验检查表','出库齐套核对单','配送现场保护清单','安装调平检查单','五金调试验收单','客户交付验收单','售后问题取证清单','补件申请记录表','门店消防巡检表','岗位安全交接清单'];
  function seed() {
    const legacy=legacySeed();
    const teachers=[['周岚','零售运营部','门店培训经理'],['林知远','产品研发部','产品培训主管'],['陈嘉宁','供应链采购部','材料与五金工程师'],['许墨','定制设计部','设计培训负责人'],['赵启明','制造质量部','工艺质量主管'],['陆川','交付安装部','安装培训主管'],['沈悦','客户服务部','售后服务主管'],['顾安','安全管理部','安全培训专员'],['唐宁','人力与学院','学习发展经理']].map(([name,dept,role],i)=>({id:'qimu-teacher-'+i,name,dept,role,personId:'person-'+i}));
    const names=['周岚','林知远','陈嘉宁','许墨','赵启明','陆川','沈悦','顾安','唐宁','苏禾','叶舒','方乔','温晴','宋言','季川','江澄','程悦','高远','陈溪','何沐','梁越','谢宁','夏青','孟林','吴桐','邱泽','丁然','姚笙','郑朗','冯清','乔松','余乐','潘文','杜衡','蒋辰','罗舒','胡晓','严瑾'];
    const assignments=[['华东直营门店','店长'],['华东直营门店','家居顾问'],['华南直营门店','店长'],['华南直营门店','家居顾问'],['定制设计部','量尺设计师'],['定制设计部','拆单设计师'],['供应链采购部','采购专员'],['制造质量部','开料班组长'],['制造质量部','封边操作员'],['制造质量部','质检员'],['软体制造部','软包工艺员'],['软体制造部','缝制组长'],['仓储物流部','仓储专员'],['交付安装部','安装技师'],['客户服务部','售后顾问']];
    const people=names.map((name,i)=>({id:'person-'+i,name,dept:i<9?teachers[i].dept:assignments[(i-9)%assignments.length][0],role:i<9?teachers[i].role:assignments[(i-9)%assignments.length][1],phone:'',employeeNo:'QM'+String(1001+i),fictional:true}));
    const categories=[['c6','材料与五金','',900],['c61','板材与饰面','c6',90],['c62','售后与养护','c6',80],['c7','安全与现场管理','',800],['c71','岗位安全','c7',90],['c8','制造与品质','',700],['c81','软体制造','c8',90],['c82','定制工艺与质检','c8',80],['c5','量尺设计与定制','',600],['c51','量尺与设计下单','c5',90],['c4','门店运营与导购','',500],['c3','仓储交付与安装','',400],['c2','入职与经营协同','',300],['c1','产品系列与选型','',200],['qimu-cat-hardware','五金与面料','c6',70],['qimu-cat-aftercare','售后与客户服务','',350],['qimu-cat-store','接待与成交','c4',90],['qimu-cat-delivery','配送与安装','c3',90],['qimu-cat-product','软体与成品家具','c1',90],['qimu-cat-onboarding','入职与岗位协作','c2',90]].map(([id,name,parentId,sort])=>({id,name,parentId,sort}));
    // 保留 c62 标识，调整到售后一级分类下；外部关联仍指向同一实体。
    categories.find(c=>c.id==='c62').parentId='qimu-cat-aftercare';
    const group=i=>domainGroups[Math.floor(i/8)];
    const library=[...courseTitles,...extraMaterials].map((title,i)=>{const ext=i>=72?'pdf':i===0||i===2?'mp4':i%9===0?'mp3':i%3===0?'mp4':'pdf';return {...trainingAsset(title,ext,i),id:'lib-'+i,title,kind:ext==='mp4'?'视频':ext==='mp3'?'音频':'文件',plannedMinutes:ext==='mp4'?24:ext==='mp3'?16:12};});
    const firstLessonNames={0:['迎宾与家庭需求识别','空间预算与购买阶段判断','样品体验与方案邀约','需求记录与设计交接'],2:['栖木家居品牌与服务链路','产品系列与家庭场景','云栖沙发结构与主材','眠语软床结构与面料','舒眠床垫支撑系统','柜体板材与五金配置','门店样品体验流程','成套搭配与尺寸校核'],3:['家庭成员与收纳物品盘点','需求优先级与方案确认'],6:['澄清价格与配置疑问','识别交期顾虑并确认承诺']};
    const courses=legacy.courses.map((c,i)=>{const g=i===2?domainGroups[1]:group(i),teacher=teachers[g.teacher];const title=courseTitles[i],minSeconds=i===1?900:i%3===0?1440:720;const intro='<p>适用岗位：'+g.audience+'。</p><p>业务目标：围绕'+title+'，'+g.purpose+'。</p><ul>'+g.outline.map(x=>'<li>'+x+'</li>').join('')+'</ul><p>课后任务：使用岗位检查清单完成一次现场复核，由直属负责人确认交接记录。</p>';
      const sections=c.sections.map((s,k)=>({...s,name:i===2?['品牌与业务认知','产品结构与材料','门店体验流程','场景选型实务'][k]:i===0?['需求诊断','体验与交接']:'岗位要点与现场实务',lessons:s.lessons.map((l,j)=>{const n=c.sections.slice(0,k).reduce((n,x)=>n+x.lessons.length,0)+j,name=firstLessonNames[i]?.[n]||g.outline[n%g.outline.length];return {...l,name,content:{...trainingAsset(name,'mp4',l.id),kind:'视频',plannedMinutes:15},teachers:[teacher.name],minSeconds:900,percent:100,intro:'<p>岗位目标：'+g.purpose+'。</p><p>学习要点：'+name+'；按现场记录核验关键步骤，发现异常及时交接。</p>',attachments:[trainingAsset(title+'岗位检查清单','pdf',l.id)]};})}));
      const type=c.type==='章节'?'章节':library[i].type.startsWith('video')?'视频':library[i].type.startsWith('audio')?'音频':'文档';
      return {...c,name:title,type,categoryId:i>=20&&i<=23?'qimu-cat-hardware':i===36||i===37?'c81':g.category,teachers:[teacher.name],sections,content:type==='章节'?null:copy(library[i]),cover:image(g.cover,i),minSeconds,percent:100,examId:i%8===0?'exam-'+(Math.floor(i/8)+1):'',intro,attachments:[trainingAsset(title+'岗位检查清单','pdf',i)],creator:'唐宁',createdAt:'2026-09-'+String(1+i%20).padStart(2,'0')+' 09:00',updatedAt:'2026-10-12 10:00',seedOrigin:'qimu-home'};
    });
    const records=legacy.records.map((r,i)=>{const c=courses.find(c=>c.id===r.courseId),lessons=c.type==='章节'?c.sections.flatMap(s=>s.lessons.map(l=>({...l,sectionName:s.name}))):[{...c,id:'regular',sectionName:''}],mode=i%4;let cursor=Date.parse('2026-10-'+String(13+i%8).padStart(2,'0')+'T09:00:00');const stamp=ms=>new Date(ms+8*3600*1000).toISOString().slice(0,19).replace('T',' ');const start=stamp(cursor);
      const rows=lessons.map((l,j)=>{const done=mode===0||mode===1&&lessons.length>1&&j<Math.floor(lessons.length/2),active=mode===2&&j===0||mode===1&&j===Math.floor(lessons.length/2),seconds=done?l.minSeconds+60:active?Math.floor(l.minSeconds/3):0,startedAt=seconds?stamp(cursor):'';cursor+=seconds*1000;const completedAt=done?stamp(cursor):'';cursor+=300000;return {lessonId:l.id,sectionName:l.sectionName,seconds,status:done?'已完成':active?'学习中':'未学习',startedAt,completedAt};});
      const done=rows.every(l=>l.status==='已完成');return {...r,startedAt:rows.some(l=>l.seconds)?start:'',completedAt:done?rows[rows.length-1].completedAt:'',lessons:rows};
    });
    const gardenCategories=['新人专区','品牌与服务','产品系列','零售学院','工艺质检','客户服务','交付安装','材料选型','门店运营','岗位安全'].map((name,i)=>({...legacy.gardenCategories[i],name}));
    const gardenNames=['原木系列板材与饰面选型资料','门店导购服务与交接手册','云栖沙发系列产品资料','眠语软床与舒眠床垫资料','全屋定制量尺与下单资料','交付安装与验收资料','售后问题受理与养护资料','生产质检与岗位安全资料'];
    const gardenImages=['mat-wood-1.jpg','sofa-1.jpg','sofa-1.jpg','bed-1.jpg','dining-1.jpg','dining-1.jpg','chair-1.jpg','mat-wood-1.jpg'];
    const gardenCats=[0,3,2,2,7,6,5,4];
    const gardens=gardenNames.map((name,i)=>{const content=emptyTabs();tabs.forEach((t,j)=>{content[t].images=j===0||j===1?[image(gardenImages[i],i*10+j)]:[];content[t].files=[trainingAsset(name+'·'+t,j===3?'xlsx':'pdf','garden-'+i+'-'+j)];});return {id:'garden-'+i,name,categoryId:'garden-cat-'+gardenCats[i],sort:100-i,visible:true,cover:image(gardenImages[i],99+i),content,createdAt:'2026-09-21 09:00',updatedAt:'2026-10-12 10:00',operator:'唐宁',seedOrigin:'qimu-home'};});
    const exams=['门店接待与服务流程考核','产品结构与选型考核','材料五金配置核验','量尺设计与下单考核','制造工序质量检查','交付安装与验收考核','售后受理与养护考核','岗位安全知识考核','新员工岗位协作考核','门店陈列与样品管理','客户需求诊断实务','全屋定制方案确认','包装与出库齐套检查','安装遗留问题交接','售后案例复盘','客户信息保护','订单变更责任交接'].map((name,i)=>({id:'exam-'+(i+1),name}));
    const recommendCategories=[{id:'qimu-rec-onboarding',name:'新员工学习路径',parentId:'',sort:900,courseIds:['course-64','course-65','course-0','course-2']},{id:'qimu-rec-store',name:'门店上岗必修',parentId:'qimu-rec-onboarding',sort:100,courseIds:['course-0','course-3','course-4','course-7']},{id:'qimu-rec-delivery',name:'交付岗位必修',parentId:'qimu-rec-onboarding',sort:90,courseIds:['course-41','course-42','course-45','course-47']},{id:'qimu-rec-product',name:'产品与定制专题',parentId:'',sort:800,courseIds:['course-2','course-8','course-16','course-24']},{id:'qimu-rec-quality',name:'品质与安全提升',parentId:'',sort:700,courseIds:['course-35','course-39','course-56','course-57']}];
    return {...legacy,seedVersion:SEED_VERSION,brand:{name:'栖木家居',fictional:true,description:'虚构的家居制造与销售一体企业；所有人员、业务与学习记录均为本地演示数据，不构成真实公司背书。'},categories,courses,people,teachers,records,library,exams,gardenCategories,gardens,recommendCategories,settings:{menuName:'栖木学堂',academyName:'栖木家居商学院',operator:'唐宁'}};
  }
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  // 只替换仍等于旧种子的字段。数组按稳定 ID 对齐，不按名称或位置猜测归属。
  function mergeSeedFields(current,oldValue,newValue,path,report) {
    if(current?.id&&oldValue?.id&&current.id!==oldValue.id){report.preserved.push(path+'.user-entity');return current;}
    if(same(current,oldValue)){if(!same(current,newValue))report.changed.push(path);return copy(newValue);}
    if(Array.isArray(current)&&Array.isArray(oldValue)&&Array.isArray(newValue)){
      const keyed=[...oldValue,...newValue].every(v=>v&&typeof v==='object'&&v.id);
      if(!keyed){report.preserved.push(path);return current;}
      return current.map(row=>{const old=oldValue.find(x=>x.id===row.id),next=newValue.find(x=>x.id===row.id);return old&&next?mergeSeedFields(row,old,next,path+'.'+row.id,report):row;});
    }
    if(current&&oldValue&&newValue&&typeof current==='object'&&typeof oldValue==='object'&&typeof newValue==='object'&&!Array.isArray(current)){
      const result=copy(current);Object.keys(newValue).forEach(key=>{if(!Object.prototype.hasOwnProperty.call(result,key)){result[key]=copy(newValue[key]);report.added.push(path+'.'+key);}else if(Object.prototype.hasOwnProperty.call(oldValue,key))result[key]=mergeSeedFields(result[key],oldValue[key],newValue[key],path+'.'+key,report);});return result;
    }
    report.preserved.push(path);return current;
  }
  function migrateSeed(input) {
    const next=seed(),report={target:SEED_VERSION,changed:[],added:[],preserved:[],warnings:[]};
    if(!input)return {state:next,report:{...report,fresh:true}};
    if(input.seedVersion>=SEED_VERSION)return {state:copy(input),report:{...report,noop:true}};
    if(input.version!==1)return {state:copy(input),report:{...report,unsupported:true,warnings:['未知仓库版本，未替换或清空数据']}};
    const old=legacySeed(),result=copy(input);
    // 删除过的旧实体不复活；新增实体只使用新版专属 ID，绝不按“测试”字样批量清理。
    ['categories','courses','people','records','library','exams','gardenCategories','gardens'].forEach(key=>{
      if(!Object.prototype.hasOwnProperty.call(result,key)){result[key]=copy(next[key]);report.added.push(key);return;}
      if(!Array.isArray(result[key])){report.warnings.push(key+' 类型未知，保留原值');return;}
      result[key]=result[key].map(row=>{const before=old[key].find(x=>x.id===row.id),after=next[key].find(x=>x.id===row.id);if(key==='records'&&before&&['courseId','personId','startedAt','completedAt','lessons'].some(k=>!same(row[k],before[k]))){report.preserved.push(key+'.'+row.id+'.user-progress');return row;}return before&&after?mergeSeedFields(row,before,after,key+'.'+row.id,report):row;});
      next[key].filter(row=>!old[key].some(x=>x.id===row.id)).forEach(row=>{if(row.parentId&&!result[key].some(x=>x.id===row.parentId))return;if(key==='gardens'&&!result.gardenCategories?.some(x=>x.id===row.categoryId))return;if(!result[key].some(x=>x.id===row.id)){result[key].push(copy(row));report.added.push(key+'.'+row.id);}});
    });
    result.settings=mergeSeedFields(result.settings||{},old.settings,next.settings,'settings',report);
    if(!Object.prototype.hasOwnProperty.call(result,'teachers'))result.teachers=copy(next.teachers);
    if(!Object.prototype.hasOwnProperty.call(result,'brand'))result.brand=copy(next.brand);
    if(!Object.prototype.hasOwnProperty.call(result,'recommendCategories'))result.recommendCategories=[];
    // 原有推荐名称、排序、未知属性、课程关联原样保留；仅首次迁移补入独立种子推荐。
    if(Array.isArray(result.recommendCategories))next.recommendCategories.forEach(row=>{if(result.recommendCategories.some(x=>x.id===row.id))return;const courseIds=row.courseIds.filter(id=>result.courses.some(c=>c.id===id&&c.seedOrigin==='qimu-home'));if(!courseIds.length)return;if(row.parentId&&!result.recommendCategories.some(x=>x.id===row.parentId))return;result.recommendCategories.push({...copy(row),courseIds});report.added.push('recommendCategories.'+row.id);});
    // 用户改动了课程结构/完成条件时，不把旧学习明细强行改成新的完成记录。
    result.records.forEach(r=>{const original=input.records?.find(x=>x.id===r.id),before=old.courses.find(x=>x.id===r.courseId),actual=result.courses.find(x=>x.id===r.courseId),after=next.courses.find(x=>x.id===r.courseId);if(!original||!before||!actual||!after)return;const shape=c=>({type:c.type,minSeconds:c.minSeconds,sections:(c.sections||[]).map(s=>({id:s.id,lessons:s.lessons.map(l=>({id:l.id,minSeconds:l.minSeconds}))}))});if(!same(shape(actual),shape(after))){Object.assign(r,copy(original));report.preserved.push('records.'+r.id+'.course-structure');}});
    result.seedVersion=SEED_VERSION;result.seedMigration={version:SEED_VERSION,changed:report.changed.length,added:report.added.length,preserved:report.preserved.length};return {state:result,report};
  }
  let rawStored=null,readError='';
  try{if(typeof localStorage!=='undefined'){rawStored=localStorage.getItem('aicard.demo.'+KEY);if(rawStored!==null)JSON.parse(rawStored);}}catch(e){readError='学院原数据无法安全读取，已保留原文，未执行迁移。';}
  const stored=S.store.get(KEY),migration=migrateSeed(stored);
  let initial=migration.state,migrationError=readError;
  if(!readError&&!migration.report.noop&&!migration.report.unsupported){
    try{if(stored&&!S.store.get(BACKUP_KEY))S.store.set(BACKUP_KEY,{capturedAt:now(),sourceKey:KEY,raw:rawStored,state:copy(stored)});S.store.set(KEY,initial);}
    catch(e){migrationError='学院演示数据迁移未保存：'+e.message;initial=stored||initial;console.warn(migrationError);}
  }
  const state = Vue.reactive(initial);
  // Writes are atomic at the metadata boundary: storage first, then reactive state.
  function transact(fn) {if(migrationError)throw Error(migrationError+' 请先导出备份并恢复存储后重试。');const next=copy(state);fn(next);next.revision++;S.store.set(KEY,next);Object.assign(state,next);return next;}
  const requireText=(text,label,max=40)=>{text=String(text||'').trim();if(!text)throw Error('请输入'+label);if(Array.from(text).length>max)throw Error(label+'不能超过'+max+'字');return text;};
  const integer=(n,label,min=0,max=999999)=>{if(n===''||n==null||!Number.isInteger(Number(n))||Number(n)<min||Number(n)>max)throw Error(label+'请输入'+min+'～'+max+'之间的整数');return Number(n);};
  const find=(arr,id,label)=>{const row=arr.find(x=>x.id===id);if(!row)throw Error(label+'已不存在，请刷新后重试');return row;};
  const flatLessons = c => c.type==='章节'?c.sections.flatMap(s=>s.lessons):[c];
  const categoryPath = c => {const category=state.categories.find(x=>x.id===(c.categoryId||c));if(!category)return '';const p=state.categories.find(x=>x.id===category.parentId);return (p?p.name+'/':'')+category.name;};
  function validateLesson(l) {
    l.name=requireText(l.name,'课程名称');if(!l.content)throw Error('请选择或上传课程内容');
    l.minSeconds=integer(l.minSeconds,'完成时长',1,359999);l.percent=integer(l.percent,'完成比例',1,100);
    l.teachers=(l.teachers||[]).map(t=>String(t).trim()).filter(Boolean);if(l.teachers.length>5)throw Error('最多可添加5个讲师');
    if(l.teachers.some(t=>Array.from(t).length>40))throw Error('讲师姓名不能超过40字');
    if(l.examId&&!state.exams.some(e=>e.id===l.examId))throw Error('关联考试已不存在');
    if((l.attachments||[]).length>5)throw Error('学习资料最多可上传5个附件');
    l.intro=S.sanitizeHtml(l.intro||'');return l;
  }
  const courseRecommendIds = courseId => state.recommendCategories.filter(c=>(c.courseIds||[]).includes(courseId)).map(c=>c.id);
  function saveCourse(input,publish,recommendIds) {
    const c=copy(input);c.name=requireText(c.name,'课程名称');
    if(!c.categoryId)throw Error('请选择课程分类');find(state.categories,c.categoryId,'课程分类');
    c.teachers=(c.teachers||[]).map(s=>s.trim()).filter(Boolean);if(c.teachers.length>5)throw Error('最多可添加5个讲师');
    if(c.scope==='partial'&&!c.peopleIds.length&&!c.deptIds.length)throw Error('请选择学员范围内的部门或人员');
    if(c.type==='章节') {if(!c.sections.length)throw Error('请添加至少一个章节');if(!flatLessons(c).length)throw Error('请添加至少一节课程');if(flatLessons(c).length>300)throw Error('最多可上传300个课程文件');c.sections.forEach(s=>{s.name=requireText(s.name,'章节名称');if(!s.lessons.length)throw Error('“'+s.name+'”请添加至少一节课程');s.lessons.forEach(validateLesson);});}
    else {validateLesson(c);c.type=/^video/.test(c.content.type)?'视频':/^audio/.test(c.content.type)?'音频':/^image/.test(c.content.type)?'图片':'文档';}
    c.intro=S.sanitizeHtml(c.intro||'');c.updatedAt=now();c.status=publish?'进行中':c.status||'未发布';
    if(!c.id){c.id=id('course');c.createdAt=now();c.creator=state.settings.operator||'唐宁';}
    // 未传推荐位时保留原关联；传空数组时仅解除当前课程的全部关联。
    if(recommendIds!==undefined&&!Array.isArray(recommendIds))throw Error('请选择有效的推荐位');
    const selected=recommendIds===undefined?null:new Set(recommendIds);
    if(selected)selected.forEach(categoryId=>{if(!state.recommendCategories.some(r=>r.id===categoryId))throw Error('推荐位已不存在，请移除失效推荐位后保存');});
    transact(d=>{const i=d.courses.findIndex(x=>x.id===c.id);if(i<0)d.courses.unshift(c);else d.courses[i]={...d.courses[i],...c};
      if(selected)d.recommendCategories.forEach(category=>{const ids=category.courseIds||[];if(selected.has(category.id)){if(!ids.includes(c.id))category.courseIds=[...ids,c.id];}else if(ids.includes(c.id))category.courseIds=ids.filter(courseId=>courseId!==c.id);});
    });return c;
  }
  function courseStatus(courseId,status) {if(!['未发布','进行中','已下架'].includes(status))throw Error('无效的课程状态');transact(d=>{const c=find(d.courses,courseId,'课程');if(c.status===status)throw Error('课程状态已变化，请刷新后重试');c.status=status;c.updatedAt=now();});}
  function deleteCourse(courseId) {transact(d=>{const c=find(d.courses,courseId,'课程');if(c.status==='进行中')throw Error('请先下架课程再删除');d.trash.push({kind:'course',entity:copy(c),records:d.records.filter(r=>r.courseId===courseId),deletedAt:now()});d.courses=d.courses.filter(x=>x.id!==courseId);d.records=d.records.filter(r=>r.courseId!==courseId);d.recommendCategories.forEach(c=>c.courseIds=(c.courseIds||[]).filter(id=>id!==courseId));});}
  function saveCategory(input,garden=false) {
    const c=copy(input);c.name=requireText(c.name,garden?'栏目分类名称':'分类名称',garden?50:Infinity);c.sort=integer(c.sort,'排序',garden?Number.MIN_SAFE_INTEGER:0,garden?Number.MAX_SAFE_INTEGER:9999);c.parentId=garden?'':c.parentId||'';
    const arr=garden?state.gardenCategories:state.categories;
    if(arr.some(x=>x.id!==c.id&&(x.parentId||'')===c.parentId&&x.name===c.name))throw Error('同一层级已有相同名称的分类');
    if(c.parentId){const p=find(arr,c.parentId,'上级分类');if(p.id===c.id||p.parentId)throw Error('课程分类最多支持两级，不能将分类设为自身的下级');if(c.id&&arr.some(x=>x.parentId===c.id))throw Error('当前分类含子分类，不能改为二级分类');}
    if(!c.id){c.id=id(garden?'garden-cat':'category');c.createdAt=now();}
    transact(d=>{const list=garden?d.gardenCategories:d.categories;const i=list.findIndex(x=>x.id===c.id);if(i<0)list.push(c);else list[i]=c;});return c;
  }
  function deleteCategory(categoryId,garden=false) {transact(d=>{const list=garden?d.gardenCategories:d.categories;find(list,categoryId,'分类');if(!garden&&list.some(c=>c.parentId===categoryId))throw Error('该分类含子分类，请先移除子分类');if((garden?d.gardens:d.courses).some(x=>x.categoryId===categoryId))throw Error('该分类仍有关联'+(garden?'产品资料':'课程')+'，请先调整分类');d.trash.push({kind:garden?'gardenCategory':'category',entity:copy(find(list,categoryId,'分类')),deletedAt:now()});if(garden)d.gardenCategories=list.filter(c=>c.id!==categoryId);else d.categories=list.filter(c=>c.id!==categoryId);});}
  const recommendSiblings = parentId => state.recommendCategories.filter(c=>(c.parentId||'')===(parentId||'')).slice().sort((a,b)=>b.sort-a.sort||a.id.localeCompare(b.id));
  function saveRecommendCategory(input) {
    const c=copy(input);c.name=requireText(c.name,'推荐分类名称',40);c.parentId=c.parentId||'';c.sort=integer(typeof c.sort==='string'?c.sort.trim():c.sort,'排序',0,9999);
    const list=state.recommendCategories,existing=c.id?find(list,c.id,'推荐分类'):null;
    if(list.some(x=>x.id!==c.id&&(x.parentId||'')===c.parentId&&x.name.normalize('NFKC').toLocaleLowerCase()===c.name.normalize('NFKC').toLocaleLowerCase()))throw Error('同一上级下已有同名推荐分类');
    if(c.parentId){const parent=find(list,c.parentId,'上级推荐分类');if(parent.id===c.id||parent.parentId)throw Error('推荐分类最多支持两级，不能选择自身或二级分类作为上级');if(c.id&&list.some(x=>x.parentId===c.id))throw Error('含子分类的推荐分类不能改为二级分类');}
    const saved={...existing,id:c.id||id('recommend'),name:c.name,parentId:c.parentId,sort:c.sort,courseIds:copy(existing?.courseIds||[])};
    transact(d=>{const i=d.recommendCategories.findIndex(x=>x.id===saved.id);if(i<0)d.recommendCategories.push(saved);else d.recommendCategories[i]=saved;});return saved;
  }
  function moveRecommendCategory(categoryId,delta) {
    if(delta!==-1&&delta!==1)throw Error('无效的排序方向');
    const row=find(state.recommendCategories,categoryId,'推荐分类'),siblings=recommendSiblings(row.parentId),from=siblings.findIndex(c=>c.id===categoryId),to=from+delta;
    if(to<0||to>=siblings.length)throw Error('已到同级排序边界');
    if(siblings.length>10000)throw Error('同级分类过多，请先调整排序');
    [siblings[from],siblings[to]]=[siblings[to],siblings[from]];
    transact(d=>siblings.forEach((c,i)=>find(d.recommendCategories,c.id,'推荐分类').sort=siblings.length-1-i));
  }
  function saveRecommendCourses(categoryId,courseIds) {
    find(state.recommendCategories,categoryId,'推荐分类');
    const ids=Array.from(new Set(courseIds));ids.forEach(courseId=>find(state.courses,courseId,'关联课程'));
    transact(d=>find(d.recommendCategories,categoryId,'推荐分类').courseIds=copy(ids));
  }
  function deleteRecommendCategory(categoryId) {
    transact(d=>{find(d.recommendCategories,categoryId,'推荐分类');if(d.recommendCategories.some(c=>c.parentId===categoryId))throw Error('该推荐分类含子分类，请先逐一删除子分类');d.recommendCategories=d.recommendCategories.filter(c=>c.id!==categoryId);});
  }
  function saveGarden(input) {
    const g=copy(input);g.name=requireText(g.name,'产品资料名称',50);if(!g.categoryId)throw Error('请选择栏目分类');find(state.gardenCategories,g.categoryId,'栏目分类');g.sort=integer(g.sort,'排序',0,99999999);
    tabs.forEach(t=>{const v=g.content[t];if(v.images.length>20||v.files.length>20||v.videos.length>5)throw Error(t+'附件数量超限');});
    if(!g.id){g.id=id('garden');g.createdAt=now();g.visible=true;}
    g.updatedAt=now();g.operator=state.settings.operator||'唐宁';transact(d=>{const i=d.gardens.findIndex(x=>x.id===g.id);if(i<0)d.gardens.unshift(g);else d.gardens[i]=g;});return g;
  }
  const rowRecord=r=>{const c=state.courses.find(c=>c.id===r.courseId),p=state.people.find(p=>p.id===r.personId);if(!c||!p)return null;const current=flatLessons(c),lessons=current.map((l,i)=>{const saved=r.lessons.find(x=>x.lessonId===(c.type==='章节'?l.id:'regular'));return saved||{lessonId:c.type==='章节'?l.id:'regular',seconds:0,status:'未学习',startedAt:'',completedAt:''};});const completed=lessons.filter(l=>l.status==='已完成').length,seconds=lessons.reduce((n,l)=>n+l.seconds,0);return {...r,lessons,name:p.name,dept:p.dept,courseName:c.name,type:c.type,optional:c.optional,attribute:c.optional?'选修':'必修',total:current.length,completed,seconds,status:completed===current.length&&current.length?'已完成':seconds?'学习中':'未学习',completedAt:completed===current.length&&current.length?r.completedAt||lessons.map(l=>l.completedAt).sort().pop()||'':'',teacher:c.teachers.join(',')};};
  const courseStats=c=>{const records=state.records.filter(r=>r.courseId===c.id).map(rowRecord).filter(Boolean);return {...c,categoryName:categoryPath(c),amount:flatLessons(c).length,learners:records.length,learning:records.filter(r=>r.status==='学习中').length,completed:records.filter(r=>r.status==='已完成').length,teacher:c.teachers.join(',')};};
  const staffStats=p=>{const rs=state.records.filter(r=>r.personId===p.id).map(rowRecord).filter(Boolean),part=optional=>rs.filter(r=>r.optional===optional);return {...p,count:rs.filter(r=>r.status==='已完成').length,seconds:rs.reduce((n,r)=>n+r.seconds,0),requiredCount:part(false).filter(r=>r.status==='已完成').length,requiredSeconds:part(false).reduce((n,r)=>n+r.seconds,0),optionalCount:part(true).filter(r=>r.status==='已完成').length,optionalSeconds:part(true).reduce((n,r)=>n+r.seconds,0)};};
  const duration=s=>{s=Math.max(0,Math.floor(Number(s)||0));if(!s)return '-';return(s>=3600?Math.floor(s/3600)+'小时':'')+(s>=60?Math.floor(s%3600/60)+'分钟':'')+(s%60?s%60+'秒':'');};
  let dbPromise;
  const db=()=>dbPromise||(dbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open(FILE_DB,1);request.onupgradeneeded=()=>request.result.createObjectStore('files',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('浏览器附件存储不可用'));}));
  async function fileStore(file,options={}) {
    const name=file.name, ext=name.split('.').pop().toLowerCase(),allowed=(options.accept||'mp4,mp3,doc,docx,ppt,pptx,xls,xlsx,pdf').split(','),limit=options.maxSize||2*1024**3;
    if(!allowed.includes(ext))throw Error('文件格式不支持，请选择 '+allowed.join(' / '));if(file.size>limit)throw Error('文件“'+name+'”超过'+(limit/1024**2)+'MB');if(!file.size)throw Error('不能上传空文件');
    if(navigator.storage?.estimate){const {quota,usage}=await navigator.storage.estimate();if(quota&&quota-usage<file.size)throw Error('浏览器存储空间不足，请释放空间后重试');}
    const fileId=id('file'),connection=await db();await new Promise((resolve,reject)=>{const tx=connection.transaction('files','readwrite');tx.objectStore('files').put({id:fileId,blob:file});tx.oncomplete=resolve;tx.onerror=()=>reject(Error('附件保存失败，浏览器空间可能不足'));tx.onabort=()=>reject(Error('附件保存已中止'));});
    const mime=file.type||({mp4:'video/mp4',mp3:'audio/mpeg',pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif'}[ext])||'application/octet-stream';return {id:fileId,name,size:file.size,type:mime,stored:true};
  }
  const urls=new Map();
  async function fileUrl(file) {if(file.mock)throw Error(file.availability||'资料仅为目录示意，尚未上传原文件');if(file.url)return file.url;if(urls.has(file.id))return urls.get(file.id);const connection=await db();const row=await new Promise((res,rej)=>{const r=connection.transaction('files').objectStore('files').get(file.id);r.onsuccess=()=>res(r.result);r.onerror=rej;});if(!row)throw Error('附件不存在，请重新上传');const url=URL.createObjectURL(row.blob);urls.set(file.id,url);return url;}
  async function download(file) {const url=await fileUrl(file);const a=document.createElement('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();}
  window.addEventListener('beforeunload',()=>urls.forEach(url=>URL.revokeObjectURL(url)));
  window.ACADEMY={state,routes,tabs,emptyTabs,KEY,BACKUP_KEY,SEED_VERSION,migrateSeed,migrationReport:migration.report,migrationError,seed,copy,id,now,transact,requireText,integer,asset:trainingAsset,image,flatLessons,categoryPath,validateLesson,courseRecommendIds,saveCourse,courseStatus,deleteCourse,saveCategory,deleteCategory,recommendSiblings,saveRecommendCategory,moveRecommendCategory,saveRecommendCourses,deleteRecommendCategory,saveGarden,rowRecord,courseStats,staffStats,duration,fileStore,fileUrl,download};
})();
