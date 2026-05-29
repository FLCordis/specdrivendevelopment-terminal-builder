// ── ESTADO ────────────────────────────────────────────────────
const STEPS=[
  {id:'meta',    label:'Sobre o Projeto'},
  {id:'domain',  label:'Problema & Usuários'},
  {id:'arch',    label:'Tecnologia'},
  {id:'quality', label:'Qualidade & Operação'},
  {id:'plan',    label:'Plano de Entregas'},
  {id:'agents',  label:'Agentes de IA'},
  {id:'rules',   label:'Regras & Automações'},
  {id:'cmds',    label:'Comandos Rápidos'},
  {id:'review',  label:'Revisão Final'},
];
let cur=0, pvTab=0, appMode='beginner', pvCollapsed=false;

let S={
  meta:{name:'',type:'',stage:'',audience:'',pitch:'',kpis:[],useGit:null},
  domain:{problem:'',objectives:[],stakeholders:[],useCases:[],nonGoals:[],nfrs:[]},
  arch:{languages:[],frameworks:[],databases:[],messaging:[],style:'',integrations:[],scalability:''},
  quality:{testTypes:[],testTools:[],obs:'',envs:[],cicd:'',security:'',secChecks:[]},
  plan:{phases:[]},
  agents:{list:[]},
  rules:{code:'',architecture:'',tests:'',security:'',examples:'',hooks:[]},
  cmds:{list:[]}
};

// Pixel-art sprites 8x8 (X=laranja, Y=dourado, .=transparente) — renderizam via _avSVG()
const AGENT_SPRITES={
  orchestrator:['...YY...','..YXXY..','.YXXXXY.','YXXYYXXY','YXXYYXXY','.YXXXXY.','..YXXY..','...YY...'],
  architect   :['...XX...','..XYYX..','..XYYX..','.XYYYYX.','.XYYYYX.','XXYYYYXX','XYYYYYYX','XXXXXXXX'],
  backend     :['XXXXXXXX','XYYYYYYX','XXXXXXXX','........','XXXXXXXX','XYYYYYYX','XXXXXXXX','........'],
  frontend    :['XXXXXXXX','XYYYYYYX','XYYYYYYX','XYYYYYYX','XXXXXXXX','...XX...','...XX...','.XXXXXX.'],
  qa          :['........','.......X','......XX','X....XYX','XX..XYY.','.XXXYY..','..XXY...','...X....'],
  devops      :['...XX...','.X.XX.X.','XXXXXXXX','.XXYYXX.','.XXYYXX.','XXXXXXXX','.X.XX.X.','...XX...'],
  dba         :['.XXXXXX.','XYYYYYYX','XXXXXXXX','X......X','X......X','XXXXXXXX','XYYYYYYX','.XXXXXX.'],
  reviewer    :['..XXXX..','.XYYYYX.','XYYYYYYX','XYYXXYYX','XYXXXXYX','XYYYYYYX','.XYYYYX.','..XXXX..'],
  git         :['X......X','XX....XX','.X....X.','.XX..XX.','..X..X..','..XXXX..','...XX...','...XX...'],
  generic     :['XXXXXXXX','X......X','X.YYYY.X','X.YXXY.X','X.YXXY.X','X.YYYY.X','X......X','XXXXXXXX']
};
function _avSVG(rows){
  if(!rows||!rows.length) return '';
  let r='';
  for(let y=0;y<rows.length;y++){const row=rows[y];for(let x=0;x<row.length;x++){const c=row[x];if(c==='X')r+=`<rect x="${x}" y="${y}" width="1" height="1" fill="#ff8c1a"/>`;else if(c==='Y')r+=`<rect x="${x}" y="${y}" width="1" height="1" fill="#ffcc33"/>`;}}
  return `<svg viewBox="0 0 8 8" width="24" height="24" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}
function agentAvatar(ag){
  const key=ag&&ag.icon;
  const rows=(key&&AGENT_SPRITES[key])||null;
  if(rows) return _avSVG(rows);
  return '<span class="agent-avatar-fallback">▣</span>';
}

const DEF_AGENTS=[
  {name:'Orquestrador / Team Lead',icon:'orchestrator',resp:'Lê CLAUDE.md, SPEC.md, PLAN.md e RULES.md antes de tudo. Decide qual agente especialista acionar e garante conformidade com regras, escopo e segurança.',arts:'CLAUDE.md, SPEC.md, PLAN.md, RULES.md, SECURITY.md',style:'Explica o que vai fazer, qual agente acionou e por quê. Faz checagem final antes de entregar.',implicit:true},
  {name:'Arquiteto',icon:'architect',resp:'Define e valida a arquitetura, revisa SPEC e PLAN. Aplica SOLID, KISS, DRY. Questiona complexidade desnecessária.',arts:'SPEC.md, PLAN.md, RULES.md, SECURITY.md',style:'Explica trade-offs, alerta sobre over-engineering, propõe a solução mais simples que funciona'},
  {name:'Backend',icon:'backend',resp:'Implementa APIs, regras de negócio e integrações. Segue clean code, SOLID e as regras de segurança do SECURITY.md.',arts:'SPEC.md, RULES.md, PLAN.md, SECURITY.md',style:'Código limpo, testável, seguro. Explica decisões. Propõe testes junto com a implementação'},
  {name:'Frontend',icon:'frontend',resp:'Implementa telas, componentes e fluxos de UI com foco em UX, performance e acessibilidade.',arts:'SPEC.md, RULES.md, SECURITY.md',style:'Foca em UX, acessibilidade, lazy loading e boas práticas de segurança frontend'},
  {name:'QA',icon:'qa',resp:'Cria e revisa testes, valida critérios de entrega, verifica edge cases e cobertura.',arts:'SPEC.md, PLAN.md, RULES.md',style:'Focado em cobertura, edge cases, testes de regressão e automação'},
  {name:'DevOps',icon:'devops',resp:'Configura CI/CD, ambientes, monitoramento, escalabilidade e infraestrutura.',arts:'HOOKS.md, RULES.md, SECURITY.md',style:'Focado em automação, segurança de infra, observabilidade e zero-downtime deploy'},
  {name:'DBA (Banco de Dados)',icon:'dba',resp:'Modela o banco, define índices, constraints, relacionamentos e estratégia de queries. Previne N+1, otimiza performance e define estratégia de cache e paginação.',arts:'SPEC.md, RULES.md, PLAN.md',style:'Focado em modelagem correta, performance de queries, integridade de dados e escalabilidade do banco'},
  {name:'Code Reviewer',icon:'reviewer',resp:'Revisão obrigatória após qualquer /implementar. Analisa qualidade, segurança, performance, manutenibilidade e conformidade com SPEC, RULES e SECURITY. Bloqueia merge se encontrar problemas críticos.',arts:'SPEC.md, RULES.md, SECURITY.md, PLAN.md',style:'Criterioso e objetivo. Aponta problemas com severidade (Crítico/Alto/Médio/Baixo), explica o motivo e sugere a correção exata. Nunca aprova código com issue Crítico ou Alto sem resolução.'},
  {name:'Git Master',icon:'git',resp:'Responsável exclusivo por commits, branches e PRs. NUNCA é chamado diretamente — só pode ser acionado pelo Orquestrador após o Code Reviewer emitir aprovação explícita (sem issues Crítico/Alto + todos os testes passando).',arts:'SPEC.md, PLAN.md, RULES.md',style:'Segue Conventional Commits. Referencia sempre a fase do PLAN.md no commit. Nunca sobe código quebrado.',implicit:true,gitOnly:true},
];

const DEF_CMDS=[
  {name:'/corrigir',goal:'Revisar código e sugerir correções conforme SPEC, RULES e SECURITY',when:'Após implementar uma funcionalidade',args:'[arquivo ou trecho]',reads:'SPEC.md, RULES.md, SECURITY.md'},
  {name:'/implementar',goal:'Implementar uma tarefa específica do plano',when:'Ao iniciar nova tarefa',args:'[ID ou descrição]',reads:'PLAN.md, SPEC.md, RULES.md, SECURITY.md'},
  {name:'/code-review',goal:'Revisão obrigatória após qualquer /implementar — analisa qualidade, segurança, performance e conformidade. Bloqueia merge se encontrar Crítico ou Alto.',when:'OBRIGATÓRIO após toda /implementar antes de qualquer commit ou PR',args:'[arquivo, pasta ou descrição da feature implementada]',reads:'SPEC.md, RULES.md, SECURITY.md, PLAN.md'},
  {name:'/explicar',goal:'Explicar parte do sistema ou fluxo de negócio',when:'Para entender um módulo ou decisão',args:'[módulo ou fluxo]',reads:'SPEC.md, CLAUDE.md'},
  {name:'/testar',goal:'Criar ou rodar testes de um módulo',when:'Após implementar funcionalidades',args:'[módulo]',reads:'SPEC.md, RULES.md'},
  {name:'/validar',goal:'Verificar se mudança está alinhada com SPEC/PLAN/RULES/SECURITY',when:'Antes de abrir PR',args:'[descrição da mudança]',reads:'SPEC.md, PLAN.md, RULES.md, SECURITY.md'},
  {name:'/sec-review',goal:'Fazer revisão de segurança de um componente ou PR',when:'Antes de qualquer merge com código de auth, dados ou integrações',args:'[arquivo ou componente]',reads:'SECURITY.md, RULES.md'},
  {name:'/db-review',goal:'Revisar modelagem, queries e índices do banco de dados',when:'Ao criar/alterar models, migrations ou queries complexas',args:'[model ou migration]',reads:'SPEC.md, RULES.md'},
  {name:'/git-commit',goal:'Fluxo completo de versionamento: verifica aprovação do Code Reviewer, confirma testes passando, cria commit semântico e abre PR.',when:'SOMENTE após /code-review aprovado e /testar com todos passando.',args:'descrição da feature ou fix concluído',reads:'SPEC.md, PLAN.md, RULES.md',gitOnly:true},
];

// ── FASE 2: TEMPLATES ────────────────────────────────────────
const TEMPLATES=[
  {
    label:'API REST Simples',
    desc:'API de dados com autenticação JWT e documentação OpenAPI',
    badges:['TypeScript','Node.js','Express','PostgreSQL'],
    state:{
      meta:{name:'API REST',type:'api-rest',stage:'mvp',audience:'Desenvolvedores frontend',pitch:'API de dados com autenticação JWT e documentação OpenAPI',kpis:[],useGit:true},
      domain:{problem:'',objectives:[],stakeholders:[],useCases:[],nonGoals:[],nfrs:[]},
      arch:{style:'monolito-modular',languages:['TypeScript'],frameworks:['Node.js','Express','Zod'],databases:['PostgreSQL'],messaging:[],integrations:[],scalability:''},
      quality:{testTypes:['Unitário','Integração'],testTools:['Jest','Supertest'],obs:'',envs:[],cicd:'',security:'',secChecks:['sec-login','sec-roles']},
      plan:{phases:[]},
      rules:{code:'',architecture:'',tests:'',security:'',examples:'',hooks:[]},
    }
  },
  {
    label:'SaaS com Autenticação',
    desc:'Plataforma SaaS com planos, pagamento e painel do usuário',
    badges:['TypeScript','Next.js','NestJS','PostgreSQL','Redis'],
    state:{
      meta:{name:'SaaS App',type:'app-web',stage:'mvp',audience:'Usuários finais B2C',pitch:'Plataforma SaaS com planos, pagamento e painel do usuário',kpis:[],useGit:true},
      domain:{problem:'',objectives:[],stakeholders:[],useCases:[],nonGoals:[],nfrs:[]},
      arch:{style:'app-web',languages:['TypeScript'],frameworks:['Next.js','NestJS','Prisma'],databases:['PostgreSQL','Redis'],messaging:['Bull'],integrations:[],scalability:''},
      quality:{testTypes:['Unitário','Integração','E2E'],testTools:['Jest','Playwright'],obs:'',envs:[],cicd:'',security:'',secChecks:['sec-login','sec-lgpd','sec-roles','sec-cripto','sec-logs']},
      plan:{phases:[]},
      rules:{code:'',architecture:'',tests:'',security:'',examples:'',hooks:[]},
    }
  },
  {
    label:'Automação N8N',
    desc:'Automatiza fluxo de dados entre sistemas via N8N com webhooks e filas',
    badges:['JavaScript','N8N','PostgreSQL','RabbitMQ'],
    state:{
      meta:{name:'Automação N8N',type:'automacao',stage:'mvp',audience:'Equipe operacional interna',pitch:'Automatiza fluxo de dados entre sistemas via N8N com webhooks e filas',kpis:[],useGit:true},
      domain:{problem:'',objectives:[],stakeholders:[],useCases:[],nonGoals:[],nfrs:[]},
      arch:{style:'event-driven',languages:['JavaScript','Node.js'],frameworks:['N8N'],databases:['PostgreSQL'],messaging:['Redis','RabbitMQ'],integrations:['Webhook','REST API'],scalability:''},
      quality:{testTypes:['Integração','E2E'],testTools:['Playwright'],obs:'',envs:[],cicd:'',security:'',secChecks:['sec-login','sec-logs']},
      plan:{phases:[]},
      rules:{code:'',architecture:'',tests:'',security:'',examples:'',hooks:[]},
    }
  },
  {
    label:'E-commerce',
    desc:'Loja virtual com catálogo, carrinho, checkout e painel admin',
    badges:['TypeScript','Next.js','Prisma','PostgreSQL','Stripe'],
    state:{
      meta:{name:'E-commerce',type:'monolito',stage:'mvp',audience:'Lojistas e clientes finais',pitch:'Loja virtual com catálogo, carrinho, checkout e painel admin',kpis:[],useGit:true},
      domain:{problem:'',objectives:[],stakeholders:[],useCases:[],nonGoals:[],nfrs:[]},
      arch:{style:'monolito-modular',languages:['TypeScript'],frameworks:['Next.js','Prisma'],databases:['PostgreSQL','Redis'],messaging:['Bull'],integrations:['Stripe','SendGrid'],scalability:''},
      quality:{testTypes:['Unitário','Integração','E2E'],testTools:['Jest','Playwright'],obs:'',envs:[],cicd:'',security:'',secChecks:['sec-login','sec-lgpd','sec-roles','sec-cripto','sec-logs']},
      plan:{phases:[]},
      rules:{code:'',architecture:'',tests:'',security:'',examples:'',hooks:[]},
    }
  },
];

const SEC_OPTS=[
  {id:'sec-login',  label:'Quero que os logins sejam seguros',         sub:'Autenticação com senha forte e proteção contra invasões',     val:'Autenticação segura com bcrypt/Argon2id, JWT em HttpOnly cookie, rate limiting e bloqueio após tentativas falhas.'},
  {id:'sec-lgpd',   label:'Quero seguir a LGPD',                       sub:'Lei Geral de Proteção de Dados do Brasil',                    val:'Conformidade LGPD: coleta mínima, consentimento explícito, direito de exclusão e portabilidade.'},
  {id:'sec-roles',  label:'Quero controlar quem acessa o quê',         sub:'Perfis de acesso: admin pode tudo, usuário só o que é dele',  val:'RBAC: controle de acesso por perfil, validado no servidor a cada request, com validação de ownership.'},
  {id:'sec-cripto', label:'Quero que dados sensíveis sejam protegidos', sub:'Criptografia de senhas, CPFs e outros dados pessoais',       val:'Criptografia AES-256-GCM em repouso, TLS 1.3 em trânsito, chaves gerenciadas via secret manager.'},
  {id:'sec-logs',   label:'Não quero dados pessoais nos logs',         sub:'Logs nunca registram CPF, e-mail ou telefone',                val:'Logs sem PII. Estrutura JSON com traceId. Auditoria de ações críticas em log separado.'},
];

// ── STORAGE ───────────────────────────────────────────────────
const STORAGE_KEY='sdd-terminal-state-v1';
let _saveTimer=null;

function loadFromLocalStorage(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return false;
    const parsed=JSON.parse(raw);
    Object.assign(S,parsed);
    return true;
  }catch(err){return false;}
}

function saveToLocalStorage(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(S));}catch(err){}
}

function scheduleSave(){
  clearTimeout(_saveTimer);
  _saveTimer=setTimeout(saveToLocalStorage,400);
}

// ── BOOT ──────────────────────────────────────────────────────
function init(){
  // Load order: localStorage (estado persistido)
  const loaded=loadFromLocalStorage();
  if(!loaded){
    if(!S.agents.list.length) S.agents.list=DEF_AGENTS.filter(a=>!a.gitOnly).map(a=>({...a}));
    if(!S.cmds.list.length)   S.cmds.list=DEF_CMDS.filter(c=>!c.gitOnly).map(c=>({...c}));
  } else {
    // Re-sync gitOnly items based on loaded useGit value
    const gitAgent=DEF_AGENTS.find(a=>a.gitOnly);
    const gitCmd=DEF_CMDS.find(c=>c.gitOnly);
    S.agents.list=S.agents.list.filter(a=>!a.gitOnly);
    S.cmds.list=S.cmds.list.filter(c=>!c.gitOnly);
    if(S.meta.useGit===true){
      if(gitAgent) S.agents.list.push({...gitAgent});
      if(gitCmd) S.cmds.list.push({...gitCmd});
    }
    if(!S.agents.list.length) S.agents.list=DEF_AGENTS.filter(a=>!a.gitOnly).map(a=>({...a}));
    if(!S.cmds.list.length)   S.cmds.list=DEF_CMDS.filter(c=>!c.gitOnly).map(c=>({...c}));
  }
  renderFooter();
  checkMobile();
  bootSequence();
  render();
  registerSW();
  setAI('ready','AI READY');
}

const BOOT_LINES=[
  '╔════════════════════════════════════════╗',
  '║  SDD BUILDER · APPLE ][ EDITION  v1.0  ║',
  '╚════════════════════════════════════════╝',
  '',
  '> INITIALIZING NEURAL CORE.............. [OK]',
  '> LOADING AGENT ROSTER................... [OK]',
  '>   ├ orchestrator..................... ✓',
  '>   ├ architect........................ ✓',
  '>   ├ backend · frontend · qa.......... ✓',
  '>   └ devops · dba · reviewer.......... ✓',
  '> MOUNTING MEMORY (localStorage)....... [OK]',
  '> READY_'
];

function bootSequence(){
  let booted=false;
  try{booted=localStorage.getItem('sdd.booted')==='1'}catch(_){}
  if(booted) return;
  try{if(window.matchMedia('(max-width: 479px)').matches){localStorage.setItem('sdd.booted','1');return;}}catch(_){}
  const el=document.getElementById('boot');
  const out=document.getElementById('boot-out');
  if(!el||!out){console.warn('[bootSequence] #boot not found');return;}
  el.removeAttribute('hidden');
  el.hidden=false;
  out.textContent='';
  let li=0,ci=0,done=false;
  const finish=()=>{
    if(done) return; done=true;
    try{localStorage.setItem('sdd.booted','1')}catch(_){}
    el.classList.add('fade-out');
    document.removeEventListener('click',skip);
    document.removeEventListener('keydown',skip);
    setTimeout(()=>{el.setAttribute('hidden','');el.classList.remove('fade-out')},260);
  };
  const skip=()=>finish();
  document.addEventListener('click',skip);
  document.addEventListener('keydown',skip);
  const tick=()=>{
    if(done) return;
    if(li>=BOOT_LINES.length){setTimeout(finish,500);return;}
    const line=BOOT_LINES[li];
    if(ci<line.length){
      out.textContent+=line.charAt(ci++);
      setTimeout(tick,line.startsWith('>')?14:22);
    } else {
      out.textContent+='\n';li++;ci=0;
      setTimeout(tick,line===''?80:140);
    }
  };
  setTimeout(tick,120);
}

// AI status (header LED + bottom aibar). state: 'ready'|'thinking'|'synced'|'error'
function setAI(state,label){
  state=state||'ready';
  const def={ready:'AI READY',thinking:'THINKING…',synced:'SYNCED',error:'ERROR'};
  const txt=label||def[state]||'AI READY';
  const h=document.getElementById('ai-status');
  const hl=document.getElementById('ai-status-label');
  if(h){h.setAttribute('data-state',state)}
  if(hl){hl.textContent=state==='ready'?'READY':txt.toUpperCase()}
  const b=document.getElementById('aibar-status');
  const bl=document.getElementById('aibar-label');
  if(b){b.setAttribute('data-state',state)}
  if(bl){bl.textContent=txt.toUpperCase()}
  if(setAI._t){clearTimeout(setAI._t);setAI._t=null}
  if(state==='synced'){
    setAI._t=setTimeout(()=>setAI('ready'),1400);
  }
}

function registerSW(){
  if(!('serviceWorker' in navigator)) return;
  if(location.protocol==='file:') return;
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

function setUseGit(val){
  S.meta.useGit=val;
  const gitAgent=DEF_AGENTS.find(a=>a.gitOnly);
  const gitCmd=DEF_CMDS.find(c=>c.gitOnly);
  if(val){
    if(gitAgent&&!S.agents.list.find(a=>a.gitOnly)) S.agents.list.push({...gitAgent});
    if(gitCmd&&!S.cmds.list.find(c=>c.gitOnly)) S.cmds.list.push({...gitCmd});
  } else {
    S.agents.list=S.agents.list.filter(a=>!a.gitOnly);
    S.cmds.list=S.cmds.list.filter(c=>!c.gitOnly);
  }
  renderStep(); renderSB(); scheduleSave();
}

function renderFooter(){
  const html=`
    <button class="sb-btn" onclick="openTemplateModal()">
      <span class="sb-btn-icon">📁</span>
      <span class="sb-btn-text"><strong>Templates</strong><small>Comece com um projeto pré-preenchido</small></span>
    </button>
    <button class="sb-btn btn-a" onclick="openTeamModal()">
      <span class="sb-btn-icon">📋</span>
      <span class="sb-btn-text"><strong>Para o Time</strong><small>Prompt pronto para o dev</small></span>
    </button>
    <button class="sb-btn btn-p" onclick="downloadZip()">
      <span class="sb-btn-icon">📦</span>
      <span class="sb-btn-text"><strong>Baixar Pacote (.zip)</strong><small>Todos os arquivos em um ZIP</small></span>
    </button>
    <button class="sb-btn" onclick="openSessionModal()">
      <span class="sb-btn-icon">💾</span>
      <span class="sb-btn-text"><strong>Salvar / Carregar</strong><small>Exporta ou importa JSON</small></span>
    </button>
    <button class="sb-btn" style="border-color:var(--r);color:var(--r)" onclick="clearAll()">
      <span class="sb-btn-icon">⊘</span>
      <span class="sb-btn-text"><strong>Limpar Tudo</strong><small>Reseta todo o progresso</small></span>
    </button>`;
  ['sb-footer','sb-footer-d'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.innerHTML=html;
  });
}

function checkMobile(){
  const mob=window.innerWidth<=768;
  document.getElementById('btn-menu').style.display=mob?'flex':'none';
}
window.addEventListener('resize',checkMobile);

// ── DRAWER / OVERLAYS ─────────────────────────────────────────
function openDrawer(){
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
}
function goMob(i){go(i);closeDrawer();}

// ── MODO ──────────────────────────────────────────────────────
function setMode(m){
  appMode=m;
  document.body.className=m;
  document.getElementById('btn-beginner').classList.toggle('active',m==='beginner');
  document.getElementById('btn-advanced').classList.toggle('active',m==='advanced');
  renderStep();
}

// ── RENDER ────────────────────────────────────────────────────
function render(){renderSB();renderStep();renderBotNav();}

function renderSB(){
  const vl=runValidations();
  const errc=vl.filter(x=>x.level==='error').length;
  const wrnc=vl.filter(x=>x.level==='warn').length;
  const html=STEPS.map((s,i)=>{
    const st=i===cur?'active':isDone(i)?'done':'todo';
    const ic=i===cur?'▶':isDone(i)?'✓':'○';
    let badge='';
    if(s.id==='review'&&(errc||wrnc)){
      const bc=errc?'var(--r)':'var(--a)';
      badge=`<span style="background:${bc};color:#000;font-size:10px;font-weight:700;padding:1px 5px;margin-left:4px;min-width:18px;text-align:center">${errc||wrnc}</span>`;
    }
    return`<div class="si ${st}" onclick="goMob(${i})"><span class="si-n">${String(i).padStart(2,'0')}</span><span class="si-l">${s.label}</span><span class="si-c">${badge||ic}</span></div>`;
  }).join('');
  ['snav','snav-d'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html;});
  const p=pct(), done=STEPS.filter((_,i)=>isDone(i)).length;
  ['cfill','cfill-d'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.width=p+'%';});
  ['cpct','cpct-d'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=`${done} / ${STEPS.length} etapas`;});
  const ss=calcSpecScore();
  const pv=document.getElementById('pct-val');
  if(pv){pv.textContent=ss.score+'/100';pv.style.color=scoreColor(ss.score);}
  const pctLabel=document.getElementById('pct-label');
  if(pctLabel) pctLabel.textContent='SCORE:';
}

function renderBotNav(){
  const ps=document.getElementById('mb-step');
  const pp=document.getElementById('mb-prev');
  const pn=document.getElementById('mb-next');
  if(ps) ps.textContent=`${cur+1}/${STEPS.length} · ${STEPS[cur].label}`;
  if(pp) pp.disabled=cur===0;
  if(pn) pn.disabled=cur===STEPS.length-1;
}

function isDone(i){
  const id=STEPS[i].id;
  if(id==='meta')    return!!(S.meta.name&&S.meta.type);
  if(id==='domain')  return!!S.domain.problem;
  if(id==='arch')    return!!S.arch.style;
  if(id==='quality') return!!(S.quality.testTypes.length||S.quality.obs||S.quality.secChecks.length);
  if(id==='plan')    return S.plan.phases.length>0;
  if(id==='agents')  return S.agents.list.length>0;
  if(id==='rules')   return!!(S.rules.code||S.rules.architecture);
  if(id==='cmds')    return S.cmds.list.length>0;
  return false;
}

function pct(){
  const c=[S.meta.name,S.meta.type,S.meta.stage,S.meta.pitch,
           S.domain.problem,S.arch.style,S.quality.secChecks.length>0,
           S.plan.phases.length>0,S.agents.list.length>0,S.cmds.list.length>0];
  return Math.round(c.filter(Boolean).length/c.length*100);
}

function go(i){cur=i;render();document.getElementById('main').scrollTop=0;}
function next(){if(cur<STEPS.length-1){cur++;render();document.getElementById('main').scrollTop=0;}}
function prev(){if(cur>0){cur--;render();document.getElementById('main').scrollTop=0;}}

function renderStep(){
  const fn={meta:sMeta,domain:sDomain,arch:sArch,quality:sQuality,plan:sPlan,agents:sAgents,rules:sRules,cmds:sCmds,review:sReview};
  document.getElementById('sc').innerHTML=(fn[STEPS[cur].id]||(() => ''))();
}

function nav(last=false){
  return`<div class="nav">
    ${cur>0?`<button class="btn" onclick="prev()">◀ Anterior</button>`:''}
    ${!last?`<button class="btn btn-p" onclick="next()">Próximo ▶</button>`:''}
    ${!last?`<button class="btn btn-sm" style="margin-left:auto;color:var(--gd);border-color:#1a4a1a" onclick="go(${STEPS.length-1})">Revisão →</button>`:''}
  </div>`;
}

function hdr2(n,title,bullets){
  return`<div class="sh"><h2><span class="cur"></span> ETAPA ${n} — ${title}</h2><ul class="step-bullets">${bullets.map(b=>`<li>${b}</li>`).join('')}</ul></div>`;
}

// ── FORM HELPERS ──────────────────────────────────────────────
function reqLabel(t){return`${t} <span class="req-badge">✦ Importante</span>`}
function optLabel(t){return`${t} <span class="opt-badge">Opcional</span>`}
function transl(t){return`<div class="transl">💬 ${t}</div>`}
function optNote(){return`<div class="opt-note">// Se não souber, deixe em branco — vai aparecer como [NEEDS CLARIFICATION] e o time técnico completa depois.</div>`}
function e(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function opts(arr,cv){return arr.map(([v,l])=>`<option value="${v}"${cv===v?' selected':''}>${l}</option>`).join('');}

function tags(id,path,arr,ph){
  const tgs=arr.map((t,i)=>`<span class="tag">${e(t)}<button class="trm" onclick="rmTag('${path}',${i})">✕</button></span>`).join('');
  return`<div class="tc" id="${id}" onclick="document.getElementById('${id}i').focus()">
    ${tgs}<input class="ti" id="${id}i" placeholder="${ph}" onkeydown="addTag(event,'${path}','${id}i')">
  </div><div class="hint">// Pressione Enter para adicionar cada item</div>`;
}

// ── ETAPAS ────────────────────────────────────────────────────
function sMeta(){
  const m=S.meta;
  return hdr2(0,'SOBRE O PROJETO',['Preencha o básico do projeto.','Não precisa preencher tudo agora.','Campos vazios são completados pelo time técnico depois.'])+`
  <div class="info"><strong style="color:var(--g)">Como funciona?</strong><br>
  Preencha as etapas. Os arquivos são gerados automaticamente à direita. Campos vazios ficam como <span style="color:var(--r)">[NEEDS CLARIFICATION]</span> — o time técnico completa.</div>
  <div class="fg"><label>${reqLabel('Como se chama o projeto?')}</label>
  <input type="text" value="${e(m.name)}" placeholder="Ex: Sistema de Agendamento de Consultas, Painel de Entregas" oninput="u('meta.name',this.value)"></div>
  <div class="g2">
    <div class="fg"><label>${reqLabel('Que tipo de sistema?')}</label>
    ${transl('Se não sabe, escolha "Deixo o time decidir".')}
    <select onchange="u('meta.type',this.value)">${opts([['','-- Escolha --'],['app-web','Site ou aplicativo web'],['api-rest','Serviço de dados / API'],['monolito','Sistema web completo'],['microsservicos','Vários serviços separados'],['automacao','Automação de processo'],['cli','Ferramenta de terminal'],['decide-time','Deixo o time técnico decidir']],m.type)}</select></div>
    <div class="fg"><label>${optLabel('Em que fase?')}</label>
    ${transl('Em qual momento do ciclo de vida está o projeto.')}
    <select onchange="u('meta.stage',this.value)">${opts([['','-- Escolha --'],['poc','Testando a ideia (PoC)'],['mvp','Primeira versão (MVP)'],['producao','Já em uso'],['refatoracao','Melhorando algo'],['modulo','Novo módulo']],m.stage)}</select></div>
  </div>
  <div class="fg"><label>O projeto será versionado com Git?</label>
  ${transl('Controle de versão com commits semânticos, branches e PRs.')}
  <div style="display:flex;gap:10px;margin-top:4px">
    <label style="display:flex;align-items:center;gap:7px;cursor:pointer;padding:8px 14px;border:1px solid ${m.useGit===true?'var(--g)':'#1a3a1a'};background:${m.useGit===true?'rgba(0,255,65,.08)':'transparent'};text-transform:none;letter-spacing:0;font-size:13px;font-weight:600">
      <input type="radio" name="useGit" value="sim" ${m.useGit===true?'checked':''} onchange="setUseGit(true)" style="accent-color:var(--g)"> Sim
    </label>
    <label style="display:flex;align-items:center;gap:7px;cursor:pointer;padding:8px 14px;border:1px solid ${m.useGit===false?'var(--g)':'#1a3a1a'};background:${m.useGit===false?'rgba(0,255,65,.08)':'transparent'};text-transform:none;letter-spacing:0;font-size:13px;font-weight:600">
      <input type="radio" name="useGit" value="nao" ${m.useGit===false?'checked':''} onchange="setUseGit(false)" style="accent-color:var(--g)"> Não
    </label>
  </div>
  <div class="opt-note">// Define se o agente Git Master e o comando /git-commit serão incluídos na documentação.</div>
  </div>
  <div class="fg"><label>${optLabel('Quem vai usar?')}</label>
  <input type="text" value="${e(m.audience)}" placeholder="Ex: Clientes do e-commerce, equipe de RH, médicos e recepcionistas" oninput="u('meta.audience',this.value)"></div>
  <div class="fg"><label>${reqLabel('Em uma frase: qual o valor principal?')}</label>
  ${transl('Se tivesse 10 segundos para explicar, o que diria?')}
  <input type="text" value="${e(m.pitch)}" placeholder="Ex: Pacientes agendam consultas online, sem precisar ligar para a clínica." oninput="u('meta.pitch',this.value)"></div>
  <div class="fg advanced-only"><label>${optLabel('Métricas de sucesso (KPIs)')}</label>
  ${tags('kpis','meta.kpis',m.kpis,'Ex: Reduzir tempo de espera de 2h para 15min  →  Enter')}${optNote()}</div>
  ${nav()}`;
}

function sDomain(){
  const d=S.domain;
  return hdr2(1,'PROBLEMA & USUÁRIOS',['Entenda o problema antes da solução.','Quanto mais concreto, melhor o resultado.','Escreva como falaria para um colega.'])+`
  <div class="fg"><label>${reqLabel('Qual problema esse sistema resolve?')}</label>
  ${transl('Descreva a dor atual. Quem sofre? O que perde? Com que frequência?')}
  <textarea oninput="u('domain.problem',this.value)" placeholder="Ex: Nossa equipe passa 3h/dia copiando pedidos do WhatsApp para o ERP. Isso gera erros e atrasos de 1 dia na entrega.">${e(d.problem)}</textarea></div>
  <div class="fg"><label>${optLabel('Objetivos de negócio')}</label>
  ${tags('obj','domain.objectives',d.objectives,'Ex: Reduzir erros em 90%  →  Enter')}${optNote()}</div>
  <div class="sec-label">◈ Perfis de usuário</div>
  <div class="fg"><div id="sth">${d.stakeholders.map((s,i)=>sthItem(s,i)).join('')}</div>
  <button class="btn btn-sm" onclick="addSth()" style="margin-top:4px">+ Adicionar perfil</button></div>
  <div class="sec-label">◈ O que o sistema precisa fazer?</div>
  <div class="fg"><div id="ucs">${d.useCases.map((u,i)=>ucItem(u,i)).join('')}</div>
  <button class="btn btn-sm" onclick="addUC()" style="margin-top:4px">+ Adicionar funcionalidade</button></div>
  <div class="fg advanced-only"><label>${optLabel('O que NÃO vai fazer?')}</label>
  ${tags('ng','domain.nonGoals',d.nonGoals,'Ex: Não vai integrar com o sistema de RH legado  →  Enter')}${optNote()}</div>
  <div class="fg advanced-only"><label>${optLabel('Requisitos técnicos críticos')}</label>
  ${tags('nfr','domain.nfrs',d.nfrs,'Ex: Deve responder em menos de 2 segundos  →  Enter')}${optNote()}</div>
  ${nav()}`;
}

function sthItem(s,i){
  return`<div class="li"><div class="lih"><span class="lit">PERFIL ${i+1}</span><button class="btn btn-sm btn-d" onclick="remSth(${i})">✕</button></div>
  <div class="g2">
    <div class="fg"><label>Nome / Perfil</label><input type="text" value="${e(s.name||'')}" placeholder="Ex: Gerente Financeiro" oninput="li('domain.stakeholders',${i},'name',this.value)"></div>
    <div class="fg"><label>O que quer alcançar</label><input type="text" value="${e(s.goals||'')}" placeholder="Ex: Ver relatórios em tempo real" oninput="li('domain.stakeholders',${i},'goals',this.value)"></div>
  </div>
  <div class="fg"><label>Descrição</label><input type="text" value="${e(s.desc||'')}" placeholder="Ex: Responsável pelo fechamento mensal, acessa 3x/semana" oninput="li('domain.stakeholders',${i},'desc',this.value)"></div></div>`;
}

function ucItem(u,i){
  return`<div class="li"><div class="lih"><span class="lit">FUNC. ${String(i+1).padStart(2,'0')}</span><button class="btn btn-sm btn-d" onclick="remUC(${i})">✕</button></div>
  <div class="g2">
    <div class="fg"><label>Nome</label><input type="text" value="${e(u.title||'')}" placeholder="Ex: Agendar consulta" oninput="li('domain.useCases',${i},'title',this.value)"></div>
    <div class="fg"><label>Quem usa</label><input type="text" value="${e(u.actor||'')}" placeholder="Ex: Paciente" oninput="li('domain.useCases',${i},'actor',this.value)"></div>
  </div>
  <div class="fg"><label>Como funciona</label><textarea style="min-height:60px" placeholder="Ex: O paciente escolhe médico, data e horário, confirma e recebe SMS." oninput="li('domain.useCases',${i},'desc',this.value)">${e(u.desc||'')}</textarea></div></div>`;
}

function sArch(){
  const a=S.arch;
  return hdr2(2,'TECNOLOGIA',['Defina a estrutura técnica do sistema.','Só o estilo arquitetural é obrigatório.','Evite complexidade desnecessária — KISS vale aqui também.'])+`
  <div class="info">💡 <strong style="color:var(--g)">Regra de ouro:</strong> Antes de adicionar qualquer tecnologia, pergunte: <em>"Isso resolve um problema real ou só parece sofisticado?"</em> Monolito modular é ótimo para MVPs.</div>
  <div class="fg"><label>${reqLabel('Como o sistema vai ser organizado?')}</label>
  ${transl('Se não souber, "Deixo o time técnico decidir" é uma escolha ótima. Microsserviços só fazem sentido quando há escala e equipes grandes.')}
  <select onchange="u('arch.style',this.value)">${opts([['','-- Escolha --'],['decide-time','Deixo o time técnico decidir'],['monolito-modular','Monolito Modular — ótimo para MVPs e sistemas pequenos/médios'],['app-web','Frontend e backend separados (SPA + API)'],['microsservicos','Microserviços — para escala real e equipes grandes'],['hexagonal','Arquitetura Hexagonal (Ports & Adapters)'],['event-driven','Orientado a eventos'],['serverless','Serverless (funções na nuvem)'],['mvc','MVC Tradicional']],a.style)}</select></div>
  <div class="fg advanced-only"><label>${optLabel('Integrações externas')}</label>
  ${transl('Quais serviços de terceiros o sistema vai usar?')}
  ${tags('ints','arch.integrations',a.integrations,'Ex: Stripe (pagamentos), SendGrid (e-mails)  →  Enter')}${optNote()}</div>
  <div class="fg advanced-only"><label>${optLabel('Linguagens de programação')}</label>
  ${tags('langs','arch.languages',a.languages,'Ex: TypeScript, Python  →  Enter')}${optNote()}</div>
  <div class="fg advanced-only"><label>${optLabel('Frameworks')}</label>
  ${tags('fwks','arch.frameworks',a.frameworks,'Ex: Next.js, NestJS  →  Enter')}${optNote()}</div>
  <div class="g2 advanced-only">
    <div class="fg"><label>${optLabel('Banco de dados')}</label>${tags('dbs','arch.databases',a.databases,'Ex: PostgreSQL  →  Enter')}${optNote()}</div>
    <div class="fg"><label>${optLabel('Cache / Filas')}</label>${tags('msgs','arch.messaging',a.messaging,'Ex: Redis, RabbitMQ  →  Enter')}${optNote()}</div>
  </div>
  <div class="fg advanced-only"><label>${optLabel('Volume e escalabilidade esperada')}</label>
  ${transl('Quantos usuários simultâneos? Qual crescimento previsto? Isso define se você precisa de cache, filas e escala horizontal.')}
  <textarea style="min-height:60px" placeholder="Ex: ~500 usuários simultâneos, pico de 2.000 em promoções, crescimento 30%/mês nos primeiros 6 meses." oninput="u('arch.scalability',this.value)">${e(a.scalability)}</textarea>${optNote()}</div>
  ${nav()}`;
}

function sQuality(){
  const q=S.quality;
  const checked=q.secChecks||[];
  const cbHtml=SEC_OPTS.map(o=>`<label class="cb-item"><input type="checkbox" ${checked.includes(o.id)?'checked':''} onchange="toggleSec('${o.id}')">
    <div><div class="cb-label">${o.label}</div><div class="cb-sub">${o.sub}</div></div></label>`).join('');
  return hdr2(3,'QUALIDADE & OPERAÇÃO',['Como garantir que o sistema funciona e continua funcionando?','Segurança não é feature extra — é parte do produto.','Em modo iniciante: foque nos checkboxes de segurança.'])+`
  <div class="fg"><label>${optLabel('Requisitos de segurança')}</label>
  ${transl('Marque o que faz sentido. O SECURITY.md será gerado com regras técnicas detalhadas para cada item.')}
  <div class="cb-group">${cbHtml}</div></div>
  <div class="fg advanced-only"><label>${optLabel('Como o sistema será monitorado?')}</label>
  ${transl('Logs, métricas e alertas. Como você vai saber quando algo está errado?')}
  <textarea style="min-height:60px" placeholder="Ex: Logs JSON estruturados, métricas no Grafana, alertas por e-mail e Slack se o sistema cair ou latência subir." oninput="u('quality.obs',this.value)">${e(q.obs)}</textarea>${optNote()}</div>
  <div class="g2 advanced-only">
    <div class="fg"><label>${optLabel('Tipos de teste')}</label>${tags('ttyp','quality.testTypes',q.testTypes,'Ex: Unitário, Integração, E2E  →  Enter')}${optNote()}</div>
    <div class="fg"><label>${optLabel('Ferramentas de teste')}</label>${tags('ttol','quality.testTools',q.testTools,'Ex: Jest, Playwright, k6  →  Enter')}${optNote()}</div>
  </div>
  <div class="fg advanced-only"><label>${optLabel('Ambientes')}</label>
  ${tags('envs','quality.envs',q.envs,'Ex: dev, staging, produção  →  Enter')}${optNote()}</div>
  <div class="fg advanced-only"><label>${optLabel('Processo de publicação (CI/CD)')}</label>
  <textarea style="min-height:60px" placeholder="Ex: GitHub Actions roda lint + testes automaticamente. Deploy em staging ao abrir PR; produção é manual com aprovação." oninput="u('quality.cicd',this.value)">${e(q.cicd)}</textarea>${optNote()}</div>
  ${nav()}`;
}

function sPlan(){
  const p=S.plan;
  return hdr2(4,'PLANO DE ENTREGAS — MILESTONES',['Cada fase é um Milestone com Critérios de Aceite rigorosos.','O agente IA NÃO avança para o próximo milestone enquanto os critérios não estiverem 100% verdes.','Comece pelo mínimo que já entrega valor real — KISS.'])+`
  <div class="info"><strong style="color:var(--g)">Sugestão:</strong> Milestone 1 = login + fluxo principal. Milestone 2 = funcionalidades secundárias. Milestone 3 = performance, observabilidade e hardening.<br><br><strong>Critérios de Aceite</strong> devem ser verificáveis (ex: "todos os testes E2E passando", "Code Reviewer aprovou sem Crítico/Alto", "endpoint X responde em &lt;200ms").</div>
  <div id="phases">${p.phases.map((ph,i)=>phItem(ph,i)).join('')}</div>
  <button class="btn btn-sm" onclick="addPh()" style="margin-top:6px">+ Adicionar fase</button>
  ${nav()}`;
}

function phItem(ph,i){
  return`<div class="li"><div class="lih"><span class="lit">MILESTONE ${i+1}: ${e(ph.name||'Novo Milestone')}</span><button class="btn btn-sm btn-d" onclick="remPh(${i})">✕</button></div>
  <div class="g2">
    <div class="fg"><label>Nome do milestone</label><input type="text" value="${e(ph.name||'')}" placeholder="Ex: MVP, Versão 2.0" oninput="li('plan.phases',${i},'name',this.value)"></div>
    <div class="fg"><label>Prazo estimado</label><input type="text" value="${e(ph.deadline||'')}" placeholder="Ex: 6 semanas" oninput="li('plan.phases',${i},'deadline',this.value)"></div>
  </div>
  <div class="fg"><label>Objetivo</label><input type="text" value="${e(ph.goal||'')}" placeholder="Ex: Fluxo principal funcionando ponta a ponta" oninput="li('plan.phases',${i},'goal',this.value)"></div>
  <div class="fg"><label>O que será entregue</label><textarea style="min-height:50px" placeholder="Ex: Tela de login, cadastro, listagem e API de pedido" oninput="li('plan.phases',${i},'deliverables',this.value)">${e(ph.deliverables||'')}</textarea></div>
  <div class="fg"><label>Critérios de Aceite (Definition of Done)</label>
  ${transl('Lista verificável. O agente IA NÃO avança de milestone enquanto qualquer item estiver pendente.')}
  <textarea style="min-height:70px" placeholder="Ex:\n- Todos os testes unitários e E2E passando\n- Code Reviewer aprovou sem issues Crítico/Alto\n- Endpoint /login responde em < 200ms (P95)\n- Deploy em staging validado pelo PO" oninput="li('plan.phases',${i},'done',this.value)">${e(ph.done||'')}</textarea></div></div>`;
}

function sAgents(){
  const a=S.agents;
  const vis=appMode==='beginner'?a.list.filter(ag=>!ag.implicit||ag.gitOnly):a.list;
  return hdr2(5,'AGENTES DE IA',['Especialistas que o Claude pode assumir.','O Orquestrador coordena tudo e decide qual acionar.','DBA e Agente de Segurança já vêm configurados.'])+`
  ${appMode==='beginner'?`<div class="info">🤖 <strong style="color:var(--g)">Como funciona:</strong><br>
  Um <strong>Orquestrador</strong> lê toda a documentação e decide qual especialista chamar em cada momento. Você descreve o que quer — ele cuida do resto, incluindo segurança e banco de dados.</div>`:''}
  <div id="agts">${vis.map(ag=>{const ri=a.list.indexOf(ag);return agItem(ag,ri);}).join('')}</div>
  <button class="btn btn-sm" onclick="addAg()" style="margin-top:6px">+ Adicionar agente</button>
  ${nav()}`;
}

function agItem(ag,i){
  const cls=['agent-card'];
  if(ag.implicit)cls.push('is-implicit');
  if(ag.gitOnly)cls.push('is-git');
  const tags=[];
  if(ag.implicit)tags.push('<span class="agent-tag agent-tag-imp">CORE</span>');
  if(ag.gitOnly)tags.push('<span class="agent-tag agent-tag-git">GIT</span>');
  const note=ag.gitOnly
    ? `<div class="agent-note">// Agente exclusivo de versionamento. Só é acionado pelo Orquestrador após aprovação do Code Reviewer e todos os testes passando.</div>`
    : ag.implicit
    ? `<div class="agent-note">// Coordena todos os outros. Lê docs e decide qual especialista acionar — incluindo segurança e banco.</div>`
    : '';
  return`<div class="${cls.join(' ')}">
  <div class="agent-head">
    <div class="agent-avatar">${agentAvatar(ag)}</div>
    <div class="agent-meta">
      <div class="agent-name">${e(ag.name||'NOVO AGENTE')}</div>
      <div class="agent-tags">${tags.join('')}</div>
    </div>
    <div class="agent-status"><span class="agent-dot"></span>ONLINE</div>
    <button class="btn btn-sm btn-d agent-rm" onclick="remAg(${i})" aria-label="Remover agente">✕</button>
  </div>
  ${note}
  <div class="agent-body">
    <div class="g2">
      <div class="fg"><label>Nome</label><input type="text" value="${e(ag.name||'')}" placeholder="Ex: DBA, Arquiteto" oninput="li('agents.list',${i},'name',this.value)"></div>
      <div class="fg"><label>Arquivos que lê primeiro</label><input type="text" value="${e(ag.arts||'')}" placeholder="Ex: SPEC.md, RULES.md" oninput="li('agents.list',${i},'arts',this.value)"></div>
    </div>
    <div class="fg"><label>O que faz</label><input type="text" value="${e(ag.resp||'')}" placeholder="Ex: Modela o banco, define índices e previne N+1 queries" oninput="li('agents.list',${i},'resp',this.value)"></div>
    <div class="fg advanced-only"><label>Como responde</label><input type="text" value="${e(ag.style||'')}" placeholder="Ex: Foca em performance, integridade e escalabilidade" oninput="li('agents.list',${i},'style',this.value)"></div>
  </div>
</div>`;
}

function sRules(){
  const r=S.rules;
  return hdr2(6,'REGRAS & AUTOMAÇÕES',['Padrões de desenvolvimento que o Claude segue.','SOLID, DRY, KISS e Clean Code são defaults.','Não precisa preencher tudo — foque no crítico.'])+`
  <div class="fg advanced-only"><label>${optLabel('Padrões de código')}</label>
  ${transl('Linters, formatadores e convenções. Nomes claros, funções pequenas, responsabilidade única.')}
  <textarea placeholder="Ex: ESLint + Prettier obrigatórios. Funções com nomes verbais. Máximo 20 linhas por função. Clean Code." oninput="u('rules.code',this.value)">${e(r.code)}</textarea>${optNote()}</div>
  <div class="fg advanced-only"><label>${optLabel('Organização interna do sistema')}</label>
  ${transl('Limites entre módulos, camadas e domínios. Princípio da responsabilidade única (SOLID).')}
  <textarea placeholder="Ex: Domain layer não importa de Infrastructure. Cada módulo expõe só sua interface pública. DDD para domínios complexos." oninput="u('rules.architecture',this.value)">${e(r.architecture)}</textarea>${optNote()}</div>
  <div class="fg advanced-only"><label>${optLabel('Regras para testes')}</label>
  ${transl('Cobertura mínima, onde testes são obrigatórios, pirâmide de testes.')}
  <textarea placeholder="Ex: 80% cobertura no domain layer. Todo endpoint tem teste de integração. Testes E2E nos fluxos críticos." oninput="u('rules.tests',this.value)">${e(r.tests)}</textarea>${optNote()}</div>
  <div class="fg"><label>${optLabel('Regras de segurança adicionais')}</label>
  ${transl('Complementa os checkboxes da etapa anterior. O SECURITY.md é gerado automaticamente com as regras técnicas.')}
  <textarea placeholder="Ex: Nunca logar CPF. Senhas apenas via variáveis de ambiente. Validar todo input com Zod." oninput="u('rules.security',this.value)">${e(r.security)}</textarea>${optNote()}</div>
  <div class="fg advanced-only"><label>${optLabel('Exemplos de Código (Few-Shot)')}</label>
  ${transl('Trechos de código que o Claude deve usar como referência de estilo. Injetados em CLAUDE.md dentro de uma tag &lt;examples&gt;.')}
  <textarea style="min-height:120px" placeholder="// Ex: padrão de handler de API\nexport async function getUser(req, res) {\n  const schema = z.object({ id: z.string().uuid() });\n  const { id } = schema.parse(req.params);\n  const user = await db.user.findUnique({ where: { id } });\n  if (!user) throw new HttpError(404, 'Not found');\n  return res.json({ data: user });\n}" oninput="u('rules.examples',this.value)">${e(r.examples||'')}</textarea>${optNote()}</div>
  <div class="fg advanced-only"><label>${optLabel('Automações (CI/CD hooks)')}</label>
  <div id="hooks">${r.hooks.map((h,i)=>hkItem(h,i)).join('')}</div>
  <button class="btn btn-sm" onclick="addHk()" style="margin-top:4px">+ Adicionar automação</button></div>
  ${nav()}`;
}

function hkItem(h,i){
  return`<div class="li"><div class="lih"><span class="lit">AUTOMAÇÃO ${i+1}</span><button class="btn btn-sm btn-d" onclick="remHk(${i})">✕</button></div>
  <div class="g2">
    <div class="fg"><label>Quando acontece</label><input type="text" value="${e(h.trigger||'')}" placeholder="Ex: Push na branch main" oninput="li('rules.hooks',${i},'trigger',this.value)"></div>
    <div class="fg"><label>Ferramenta</label><input type="text" value="${e(h.tool||'')}" placeholder="Ex: GitHub Actions" oninput="li('rules.hooks',${i},'tool',this.value)"></div>
  </div>
  <div class="fg"><label>O que executa</label><input type="text" value="${e(h.action||'')}" placeholder="Ex: Lint + testes + npm audit; bloquear merge se falhar" oninput="li('rules.hooks',${i},'action',this.value)"></div></div>`;
}

function sCmds(){
  const c=S.cmds;
  return hdr2(7,'COMANDOS RÁPIDOS',['Atalhos para usar no Claude Code.','/sec-review e /db-review já vêm configurados.','5 comandos padrão prontos para uso.'])+`
  <div id="cmdslist">${c.list.map((cmd,i)=>cmdItem(cmd,i)).join('')}</div>
  <button class="btn btn-sm" onclick="addCmd()" style="margin-top:6px">+ Adicionar comando</button>
  ${nav()}`;
}

function cmdItem(cmd,i){
  return`<div class="li"><div class="lih"><span class="lit" style="color:var(--g)">${e(cmd.name||'/novo')}</span><button class="btn btn-sm btn-d" onclick="remCmd(${i})">✕</button></div>
  <div class="g2">
    <div class="fg"><label>Nome (com /)</label><input type="text" value="${e(cmd.name||'')}" placeholder="Ex: /corrigir" oninput="li('cmds.list',${i},'name',this.value)"></div>
    <div class="fg"><label>Argumentos</label><input type="text" value="${e(cmd.args||'')}" placeholder="Ex: [arquivo]" oninput="li('cmds.list',${i},'args',this.value)"></div>
  </div>
  <div class="fg"><label>O que faz</label><input type="text" value="${e(cmd.goal||'')}" placeholder="Ex: Revisão de segurança antes de qualquer merge" oninput="li('cmds.list',${i},'goal',this.value)"></div>
  <div class="g2 advanced-only">
    <div class="fg"><label>Quando usar</label><input type="text" value="${e(cmd.when||'')}" placeholder="Ex: Antes de abrir PR" oninput="li('cmds.list',${i},'when',this.value)"></div>
    <div class="fg"><label>Arquivos que lê</label><input type="text" value="${e(cmd.reads||'')}" placeholder="Ex: SECURITY.md, RULES.md" oninput="li('cmds.list',${i},'reads',this.value)"></div>
  </div></div>`;
}

function sReview(){
  const w=warns();
  const p=pct();
  const {label,color}=meterLabel(p);
  const ss=calcSpecScore();
  const sc=ss.score, sclr=scoreColor(sc), slbl=scoreLabel(sc);
  const bdHtml=ss.breakdown.map(c=>{
    const cclr=c.pts===c.max?'var(--g)':c.pts===0?'var(--r)':'var(--a)';
    return`<div class="score-cat"><span class="score-cat-label">${c.label}</span><span class="score-cat-pts" style="color:${cclr}">${c.pts}/${c.max}pts</span></div>`;
  }).join('');
  return hdr2(8,'REVISÃO FINAL',['Confira antes de gerar os arquivos.','Campos vazios são esperados — o time completa.','Gere e copie para o repositório.'])+`
  <div class="spec-meter">
    <div class="spec-meter-label" style="color:${sclr}">◈ SPEC SCORE: ${sc}/100 — ${slbl}</div>
    <div class="spec-meter-bar"><div class="spec-meter-fill" style="width:${sc}%;background:${sclr};box-shadow:0 0 6px ${sclr}"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#1a5a1a;font-weight:600">
      <span>0</span><span>40</span><span>70</span><span>100</span>
    </div>
    <button class="score-toggle" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.textContent=this.textContent.includes('▸')?'▾ Ocultar breakdown':'▸ Ver breakdown'">▸ Ver breakdown</button>
    <div class="score-breakdown" style="display:none">${bdHtml}</div>
  </div>
  <div class="spec-meter" style="margin-top:0">
    <div class="spec-meter-label" style="color:${color};font-size:12px;font-weight:600">◈ COMPLETUDE: ${p}% — ${label}</div>
    <div class="spec-meter-bar" style="height:6px"><div class="spec-meter-fill" style="width:${p}%;background:${color}"></div></div>
  </div>
  ${(()=>{
    const vl=runValidations();
    const errs=vl.filter(x=>x.level==='error');
    const wrns=vl.filter(x=>x.level==='warn');
    let out='';
    if(errs.length) out+=`<div class="warn" style="border-color:var(--r);color:var(--r);background:rgba(255,68,68,.04)"><strong>✗ ${errs.length} erro(s) encontrado(s):</strong><br>${errs.map(x=>`✗ ${x.msg} — <a href="#" onclick="go(${x.step});return false;" style="color:var(--r);text-decoration:underline">ir para etapa</a>`).join('<br>')}</div>`;
    if(wrns.length) out+=`<div class="warn"><strong>⚠ ${wrns.length} aviso(s):</strong><br>${wrns.map(x=>`⚠ ${x.msg} — <a href="#" onclick="go(${x.step});return false;" style="color:var(--a);text-decoration:underline">ir para etapa</a>`).join('<br>')}</div>`;
    if(!vl.length) out+=`<div class="info">✅ Especificação consistente — pronto para gerar</div>`;
    return out;
  })()}
  ${w.length?`<div class="warn">⚠ ${w.length} campo(s) importante(s) vazio(s):<br>${w.map(x=>`• ${x}`).join('<br>')}<br><br>Pode gerar mesmo assim. O time completa os [NEEDS CLARIFICATION].</div>`:''}
  <div class="rv"><h3>◈ Projeto</h3>${rr('Nome',S.meta.name)}${rr('Tipo',S.meta.type)}${rr('Estágio',S.meta.stage)}${rr('Pitch',S.meta.pitch)}</div>
  <div class="rv"><h3>◈ Problema & Usuários</h3>${rr('Problema',S.domain.problem?S.domain.problem.substring(0,80)+'…':'')}${rr('Perfis',S.domain.stakeholders.length+' perfis')}${rr('Funcionalidades',S.domain.useCases.length+' cadastradas')}</div>
  <div class="rv"><h3>◈ Tecnologia & Plano</h3>${rr('Arquitetura',S.arch.style)}${rr('Fases',S.plan.phases.length+' fases')}${rr('Agentes',S.agents.list.length+' configurados')}${rr('Segurança',S.quality.secChecks.length+' requisitos marcados')}${rr('Git',S.meta.useGit===true?'✅ Git Master ativo':S.meta.useGit===false?'⬜ Sem versionamento Git':'⚠ Não definido')}</div>
  ${S.meta.useGit===null?`<div class="warn">ℹ Git não definido — responda "O projeto será versionado com Git?" na Etapa 0 para configurar o Git Master e o /git-commit.</div>`:''}
  <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn btn-p" onclick="generate()" style="font-size:14px;padding:0 20px;height:38px">⚡ GERAR TODOS OS ARQUIVOS</button>
    <button class="btn btn-a" onclick="openTeamModal()">📋 Para o time técnico</button>
  </div>
  ${nav(true)}`;
}

function meterLabel(p){
  if(p<20)  return{label:'Muito inicial',         color:'#ff4444'};
  if(p<40)  return{label:'Bom para começar',       color:'#ff8800'};
  if(p<60)  return{label:'Pronto para engenheiro', color:'#ffb000'};
  if(p<80)  return{label:'Poucas lacunas',          color:'#88ff00'};
  return    {label:'Completo',                      color:'#00ff41'};
}
function rr(k,v){return`<div class="rr"><span class="rk">${k}:</span><span class="rv2">${v||'<span style="color:#4a1a1a">[NEEDS CLARIFICATION]</span>'}</span></div>`;}
function warns(){
  const w=[];
  if(!S.meta.name)      w.push('Nome do projeto');
  if(!S.meta.type)      w.push('Tipo de sistema');
  if(!S.domain.problem) w.push('Descrição do problema');
  if(!S.arch.style)     w.push('Estilo de arquitetura');
  if(!S.plan.phases.length) w.push('Fases de entrega');
  return w;
}

// ── FASE 3: VALIDAÇÕES INTELIGENTES ──────────────────────────
function runValidations(){
  const v=[];
  // ERROS
  if(!S.meta.name)            v.push({level:'error',msg:'Projeto sem nome definido',step:0});
  if(!S.meta.type)            v.push({level:'error',msg:'Tipo de sistema não selecionado',step:0});
  if(!S.domain.problem)       v.push({level:'error',msg:'Problema do usuário não descrito — o SPEC.md ficará vazio',step:1});
  if(!S.plan.phases.length)   v.push({level:'error',msg:'Nenhuma fase de entrega definida — o PLAN.md não terá roadmap',step:4});
  // AVISOS
  if(S.arch.style==='microsservicos'&&!S.arch.messaging.length)
    v.push({level:'warn',msg:'Microsserviços sem mensageria (Redis/RabbitMQ) — como os serviços vão se comunicar?',step:2});
  if((S.quality.testTools.includes('Playwright')||S.quality.testTypes.includes('E2E'))&&!S.quality.envs.length)
    v.push({level:'warn',msg:'Testes E2E definidos mas nenhum ambiente (staging/prod) foi especificado',step:3});
  if(S.meta.useGit===true&&!S.quality.testTools.length)
    v.push({level:'warn',msg:'Git Master ativo mas nenhuma ferramenta de teste foi definida — o fluxo de aprovação ficará incompleto',step:3});
  if(S.arch.style==='microsservicos'&&S.arch.databases.length<=1)
    v.push({level:'warn',msg:'Microsserviços tipicamente usam um banco por serviço — considere revisar',step:2});
  if(!S.domain.useCases.length)
    v.push({level:'warn',msg:'Nenhum caso de uso definido — os agentes terão dificuldade para entender o escopo',step:1});
  if(!S.quality.secChecks.length)
    v.push({level:'warn',msg:'Nenhum requisito de segurança marcado — o SECURITY.md será gerado sem regras',step:3});
  if(S.arch.integrations&&S.arch.integrations.length>0&&!S.domain.nonGoals.length)
    v.push({level:'warn',msg:'Há integrações externas mas nenhum "não-escopo" definido — risco de scope creep',step:1});
  if(S.meta.useGit===null)
    v.push({level:'warn',msg:'Você não respondeu se o projeto usa Git (Etapa 0)',step:0});
  return v;
}

// ── FASE 5: SPEC SCORE ────────────────────────────────────────
function calcSpecScore(){
  const bd=[];
  // Identidade (20pts)
  let id=0;
  if(S.meta.name)     id+=5;
  if(S.meta.type)     id+=5;
  if(S.meta.pitch)    id+=5;
  if(S.meta.audience) id+=5;
  bd.push({label:'Identidade do projeto',pts:id,max:20});
  // Problema & Escopo (25pts)
  let dm=0;
  if(S.domain.problem&&S.domain.problem.length>50) dm+=10;
  else if(S.domain.problem) dm+=5;
  if(S.domain.useCases.length>=1) dm+=5;
  if(S.domain.useCases.length>=3) dm+=5;
  if(S.domain.nonGoals.length)    dm+=5;
  bd.push({label:'Problema & Escopo',pts:Math.min(dm,25),max:25});
  // Arquitetura (20pts)
  let ar=0;
  if(S.arch.style)            ar+=5;
  if(S.arch.languages.length) ar+=5;
  if(S.arch.databases.length) ar+=5;
  if(S.arch.integrations&&S.arch.integrations.length) ar+=5; else if(S.arch.style) ar+=5;
  bd.push({label:'Arquitetura',pts:Math.min(ar,20),max:20});
  // Qualidade & Segurança (20pts)
  let qa=0;
  if(S.quality.testTypes.length>=1) qa+=5;
  if(S.quality.testTools.length>=1) qa+=5;
  if(S.quality.secChecks.length>=2) qa+=5;
  if(S.quality.cicd)                qa+=5;
  bd.push({label:'Qualidade & Segurança',pts:Math.min(qa,20),max:20});
  // Plano (15pts)
  let pl=0;
  if(S.plan.phases.length>=1) pl+=5;
  if(S.plan.phases.length>=2) pl+=5;
  if(S.plan.phases.length>=1&&S.plan.phases.every(ph=>ph.done)) pl+=5;
  bd.push({label:'Plano de Entregas',pts:Math.min(pl,15),max:15});
  const score=bd.reduce((s,c)=>s+c.pts,0);
  return{score,breakdown:bd};
}

function scoreColor(s){
  if(s<40) return'var(--r)';
  if(s<70) return'var(--a)';
  return'var(--g)';
}
function scoreLabel(s){
  if(s<20) return'Muito inicial';
  if(s<40) return'Precisa de mais detalhes';
  if(s<60) return'Especificação básica';
  if(s<70) return'Boa especificação';
  if(s<85) return'Especificação sólida';
  return'Especificação excelente';
}

// ── SECURITY HELPERS ─────────────────────────────────────────
function toggleSec(id){
  const idx=S.quality.secChecks.indexOf(id);
  if(idx>=0) S.quality.secChecks.splice(idx,1);
  else S.quality.secChecks.push(id);
  renderSB();scheduleSave();
}

// ── STATE HELPERS ─────────────────────────────────────────────
function addTag(ev,path,inputId){
  if(ev.key!=='Enter'&&ev.key!=='Tab') return;
  ev.preventDefault();
  const v=ev.target.value.trim(); if(!v) return;
  const pts=path.split('.'); let o=S;
  for(let i=0;i<pts.length-1;i++) o=o[pts[i]];
  o[pts[pts.length-1]].push(v);
  ev.target.value=''; renderStep(); scheduleSave();
}
function rmTag(path,idx){
  const pts=path.split('.'); let o=S;
  for(let i=0;i<pts.length-1;i++) o=o[pts[i]];
  o[pts[pts.length-1]].splice(idx,1); renderStep(); scheduleSave();
}
function u(path,val){
  const pts=path.split('.'); let o=S;
  for(let i=0;i<pts.length-1;i++) o=o[pts[i]];
  o[pts[pts.length-1]]=val; renderSB(); scheduleSave();
}
function li(path,idx,field,val){
  const pts=path.split('.'); let o=S;
  for(const p of pts) o=o[p];
  o[idx][field]=val; scheduleSave();
}
function addSth(){S.domain.stakeholders.push({name:'',desc:'',goals:''});renderStep();scheduleSave();}
function remSth(i){S.domain.stakeholders.splice(i,1);renderStep();scheduleSave();}
function addUC(){S.domain.useCases.push({title:'',actor:'',desc:''});renderStep();scheduleSave();}
function remUC(i){S.domain.useCases.splice(i,1);renderStep();scheduleSave();}
function addPh(){S.plan.phases.push({name:'',goal:'',deliverables:'',done:'',deadline:''});renderStep();scheduleSave();}
function remPh(i){S.plan.phases.splice(i,1);renderStep();scheduleSave();}
function addAg(){S.agents.list.push({name:'',resp:'',arts:'',style:''});renderStep();scheduleSave();}
function remAg(i){S.agents.list.splice(i,1);renderStep();scheduleSave();}
function addHk(){S.rules.hooks.push({trigger:'',action:'',tool:''});renderStep();scheduleSave();}
function remHk(i){S.rules.hooks.splice(i,1);renderStep();scheduleSave();}
function addCmd(){S.cmds.list.push({name:'',goal:'',when:'',args:'',reads:''});renderStep();scheduleSave();}
function remCmd(i){S.cmds.list.splice(i,1);renderStep();scheduleSave();}

// ── API (geração + empacotamento no backend) ─────────────────
async function generate(){
  setAI('thinking','GENERATING');
  try{
    const r=await fetch(`${window.API_BASE}/api/generate`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({state:S}),
    });
    if(!r.ok) throw new Error('falha na geração');
    const {files,clarifications}=await r.json();
    if(clarifications&&clarifications.length) toast(`Atenção: ${clarifications.length} campo(s) com NEEDS CLARIFICATION`,1);
    renderFileList(files);
    setAI('synced','READY');
  }catch(e){toast('Erro ao gerar — backend offline?',1); setAI('error','ERROR');}
}

function renderFileList(files){
  const el=document.getElementById('pvc');
  if(!el) return;
  el.innerHTML='<ul>'+files.map(f=>`<li>${e(f.path)}</li>`).join('')+'</ul>';
}

// ── MODAL TEAM ────────────────────────────────────────────────
function openTeamModal(){
  const nm=S.meta.name||'[PROJETO]';
  document.getElementById('team-prompt').textContent=
`Olá! Segue o pacote agentic-bootstrap do projeto "${nm}".

PONTO DE ENTRADA: leia START.md primeiro — ele orquestra a ordem de leitura.

Ordem de leitura (definida em START.md):
1. /CLAUDE.md                  → regras globais + <thinking> obrigatório
2. /docs/01-product-spec.md    → problema, stakeholders, casos de uso
3. /docs/02-architecture.md    → stack e justificativa de dependências
4. /docs/03-roadmap.md         → milestones e Critérios de Aceite
5. /docs/04-security.md        → threat model e gates obrigatórios
6. /docs/05-rules.md           → padrões de código e PR review
7. /agents/                    → um arquivo .md por especialista

Instruções:
- Antes de QUALQUER mudança, abra <thinking>...</thinking> (regra #0 em CLAUDE.md).
- Campos [NEEDS CLARIFICATION] precisam ser discutidos antes de implementar.
- NÃO avance de milestone enquanto os <acceptance_criteria> da fase atual não estiverem 100% verdes.
- Auth, dados de usuário ou integrações: consulte /docs/04-security.md.
- Models/queries: acione /agents/dba.md.
- Slash commands em .claude/commands/ (/sec-review, /db-review, /validar, etc.).

Comece pela Primeira Ação descrita em START.md.`;
  document.getElementById('team-modal').style.display='flex';
}
function closeTeamModal(){document.getElementById('team-modal').style.display='none';}
function copyTeamPrompt(){navigator.clipboard.writeText(document.getElementById('team-prompt').textContent).then(()=>toast('Prompt copiado!'));}

// ── COPY / EXPORT ─────────────────────────────────────────────
function togglePV(){
  if(window.innerWidth<1101) return;
  pvCollapsed=!pvCollapsed;
  document.getElementById('app').style.gridTemplateColumns=pvCollapsed?'230px 1fr 32px':'230px 1fr 420px';
  document.getElementById('pv').setAttribute('data-collapsed',pvCollapsed);
  document.getElementById('pv-toggle-btn').textContent=pvCollapsed?'›':'‹';
}
function openSessionModal(){
  document.getElementById('session-modal').style.display='flex';
}
function closeSessionModal(){
  document.getElementById('session-modal').style.display='none';
}
function exportJSON(){
  const data=JSON.stringify(S,null,2);
  const name=(S.meta.name||'projeto').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const blob=new Blob([data],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`sdd-${name}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Projeto exportado!');
  setAI('synced','SAVED');
}
function importJSON(ev){
  const file=ev.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const parsed=JSON.parse(e.target.result);
      if(!parsed.meta||!parsed.domain) throw new Error('Arquivo inválido');
      Object.assign(S,parsed);
      render();
      scheduleSave();
      closeSessionModal();
      toast('Projeto carregado!');
      setAI('synced','LOADED');
    }catch{
      toast('Erro: arquivo JSON inválido',1);
      setAI('error','ERROR');
    }
  };
  reader.readAsText(file);
  ev.target.value='';
}
function clearAll(){
  if(!confirm('Tem certeza? Todo o progresso será perdido e não pode ser desfeito.')) return;
  S={
    meta:{name:'',type:'',stage:'',audience:'',pitch:'',kpis:[],useGit:null},
    domain:{problem:'',objectives:[],stakeholders:[],useCases:[],nonGoals:[],nfrs:[]},
    arch:{languages:[],frameworks:[],databases:[],messaging:[],style:'',integrations:[],scalability:''},
    quality:{testTypes:[],testTools:[],obs:'',envs:[],cicd:'',security:'',secChecks:[]},
    plan:{phases:[]},
    agents:{list:DEF_AGENTS.filter(a=>!a.gitOnly).map(a=>({...a}))},
    rules:{code:'',architecture:'',tests:'',security:'',examples:'',hooks:[]},
    cmds:{list:DEF_CMDS.filter(c=>!c.gitOnly).map(c=>({...c}))}
  };
  render();
  history.replaceState(null,'',window.location.pathname);
  try{localStorage.removeItem(STORAGE_KEY);}catch(err){}
  toast('Projeto resetado');
}
async function downloadZip(){
  setAI('thinking','PACKING');
  try{
    const r=await fetch(`${window.API_BASE}/api/package`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({state:S}),
    });
    if(!r.ok) throw new Error('falha no pacote');
    const blob=await r.blob();
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`${(S.meta.name||'projeto').toLowerCase().replace(/\s+/g,'-')}-sdd.zip`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),5000);
    toast('Pacote .zip baixado!'); setAI('synced','SYNCED');
  }catch(e){toast('Erro ao empacotar',1); setAI('error','ERROR');}
}
function toast(msg,err=0){
  const old=document.querySelector('.toast'); if(old) old.remove();
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  t.style.borderColor=err?'var(--r)':'var(--g)'; t.style.color=err?'var(--r)':'var(--g)';
  document.body.appendChild(t); setTimeout(()=>t.remove(),2600);
}

// ── FASE 2: TEMPLATES ────────────────────────────────────────
function openTemplateModal(){
  const grid=document.getElementById('tmpl-grid');
  grid.innerHTML=TEMPLATES.map((t,i)=>`
    <div class="tmpl-card" onclick="loadTemplate(${i})">
      <div class="tmpl-card-title">${t.label}</div>
      <div class="tmpl-card-desc">${t.desc}</div>
      <div class="tmpl-badges">${t.badges.map(b=>`<span class="tmpl-badge">${b}</span>`).join('')}</div>
    </div>`).join('');
  document.getElementById('template-modal').style.display='flex';
}

function closeTemplateModal(){
  document.getElementById('template-modal').style.display='none';
}

function loadTemplate(i){
  const tmpl=TEMPLATES[i];
  if(S.meta.name&&!confirm(`Carregar o template "${tmpl.label}"? O estado atual será substituído.`)) return;
  const ts=tmpl.state;
  Object.assign(S.meta,    ts.meta);
  Object.assign(S.domain,  ts.domain);
  Object.assign(S.arch,    ts.arch);
  Object.assign(S.quality, ts.quality);
  Object.assign(S.plan,    ts.plan);
  Object.assign(S.rules,   ts.rules);
  // Sincroniza agentes e comandos com base no useGit do template
  const useGit=ts.meta.useGit;
  S.agents.list=DEF_AGENTS.filter(a=>!a.gitOnly).map(a=>({...a}));
  S.cmds.list=DEF_CMDS.filter(c=>!c.gitOnly).map(c=>({...c}));
  if(useGit){
    const gitAgent=DEF_AGENTS.find(a=>a.gitOnly);
    const gitCmd=DEF_CMDS.find(c=>c.gitOnly);
    if(gitAgent) S.agents.list.push({...gitAgent});
    if(gitCmd) S.cmds.list.push({...gitCmd});
  }
  closeTemplateModal();
  render();
  saveToLocalStorage();
  toast(`Template "${tmpl.label}" carregado!`);
}


// ── BOOT ──────────────────────────────────────────────────────
init();
