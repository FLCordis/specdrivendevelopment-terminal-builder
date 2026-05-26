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

// Mapa de slugs em inglês para os agentes default. Custom agents caem em slugifyAgent().
const AGENT_SLUG_MAP={
  'Orquestrador / Team Lead':'orchestrator',
  'Arquiteto':'architect',
  'Backend':'backend',
  'Frontend':'frontend',
  'QA':'qa',
  'DevOps':'devops',
  'DBA (Banco de Dados)':'dba',
  'Code Reviewer':'code-reviewer',
  'Git Master':'git-master',
};
function slugifyAgent(ag){
  if(ag&&AGENT_SLUG_MAP[ag.name]) return AGENT_SLUG_MAP[ag.name];
  const raw=(ag&&ag.name)||'agent';
  return raw.toString()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')||'agent';
}

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
  // Load order: localStorage first, then hash (shared link wins if present)
  const loadedFromStorage=loadFromLocalStorage();
  const loadedFromHash=hashToState();
  const loaded=loadedFromStorage||loadedFromHash;
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
  renderStep(); schedPV(); renderSB(); scheduleSave();
}

function copyLink(){
  setAI('thinking','ENCODING');
  stateToHash();
  navigator.clipboard.writeText(window.location.href).then(()=>{toast('Link copiado!');setAI('synced','SYNCED')}).catch(()=>setAI('error','ERROR'));
}

function renderFooter(){
  const html=`
    <button class="sb-btn btn-p" onclick="generateAll()">
      <span class="sb-btn-icon">⚡</span>
      <span class="sb-btn-text"><strong>Gerar Arquivos</strong><small>Cria CLAUDE.md, SPEC.md e mais</small></span>
    </button>
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
    <button class="sb-btn" onclick="copyLink()">
      <span class="sb-btn-icon">🔗</span>
      <span class="sb-btn-text"><strong>Copiar Link</strong><small>Compartilha projeto via URL</small></span>
    </button>
    <button class="sb-btn" onclick="exportJSON()">
      <span class="sb-btn-icon">⬇</span>
      <span class="sb-btn-text"><strong>Salvar JSON</strong><small>Exporta seu progresso</small></span>
    </button>
    <label class="sb-btn" style="cursor:pointer">
      <span class="sb-btn-icon">⬆</span>
      <span class="sb-btn-text"><strong>Carregar JSON</strong><small>Retoma projeto salvo</small></span>
      <input type="file" accept=".json" style="display:none" onchange="importJSON(event)">
    </label>
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

function openPVOverlay(){renderPVOverlay();document.getElementById('pv-overlay').classList.add('open');}
function closePVOverlay(){document.getElementById('pv-overlay').classList.remove('open');}

function renderPVOverlay(){
  const gens=getActiveGens();
  const files=getActiveFiles();
  if(pvTab>=files.length) pvTab=0;
  document.getElementById('pvtabs2').innerHTML=files.map((f,i)=>
    `<div class="pvt${i===pvTab?' active':''}" title="${f}" onclick="switchPV2(${i})">${f}</div>`).join('');
  const md=(gens[pvTab]||(() => ''))();
  document.getElementById('pvc2').innerHTML=`<pre>${hlNC(md)}</pre>`;
}
function switchPV2(i){pvTab=i;renderPVOverlay();}
function copyOne2(){navigator.clipboard.writeText(document.getElementById('pvc2').innerText).then(()=>toast('Copiado!'));}

// ── MODO ──────────────────────────────────────────────────────
function setMode(m){
  appMode=m;
  document.body.className=m;
  document.getElementById('btn-beginner').classList.toggle('active',m==='beginner');
  document.getElementById('btn-advanced').classList.toggle('active',m==='advanced');
  renderStep();
}

// ── RENDER ────────────────────────────────────────────────────
function render(){renderSB();renderStep();renderPVTabs();schedPV();renderBotNav();}

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
    <button class="btn btn-p" onclick="generateAll()" style="font-size:14px;padding:0 20px;height:38px">⚡ GERAR TODOS OS ARQUIVOS</button>
    <button class="btn btn-a" onclick="openTeamModal()">📋 Para o time técnico</button>
    <button class="btn btn-sm" onclick="exportJSON()">⬇ Salvar JSON</button>
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
  schedPV();renderSB();scheduleSave();
}
function hasCheck(id){return S.quality.secChecks.includes(id);}
function secText(){
  if(!S.quality.secChecks.length) return '[NEEDS CLARIFICATION: Defina políticas de segurança]';
  return SEC_OPTS.filter(o=>S.quality.secChecks.includes(o.id)).map(o=>o.val).join('\n');
}
function isWebArch(){return['app-web','monolito','monolito-modular','microsservicos','bff','mvc'].includes(S.arch.style);}
function isApiArch(){return['api-rest','microsservicos','bff','monolito-modular','app-web','monolito','mvc'].includes(S.arch.style);}

// ── STATE HELPERS ─────────────────────────────────────────────
function addTag(ev,path,inputId){
  if(ev.key!=='Enter'&&ev.key!=='Tab') return;
  ev.preventDefault();
  const v=ev.target.value.trim(); if(!v) return;
  const pts=path.split('.'); let o=S;
  for(let i=0;i<pts.length-1;i++) o=o[pts[i]];
  o[pts[pts.length-1]].push(v);
  ev.target.value=''; renderStep(); schedPV(); scheduleSave();
}
function rmTag(path,idx){
  const pts=path.split('.'); let o=S;
  for(let i=0;i<pts.length-1;i++) o=o[pts[i]];
  o[pts[pts.length-1]].splice(idx,1); renderStep(); schedPV(); scheduleSave();
}
function u(path,val){
  const pts=path.split('.'); let o=S;
  for(let i=0;i<pts.length-1;i++) o=o[pts[i]];
  o[pts[pts.length-1]]=val; schedPV(); renderSB(); scheduleSave();
}
function li(path,idx,field,val){
  const pts=path.split('.'); let o=S;
  for(const p of pts) o=o[p];
  o[idx][field]=val; schedPV(); scheduleSave();
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

// ── PREVIEW ──────────────────────────────────────────────────
function renderPVTabs(){
  const files=getActiveFiles();
  if(pvTab>=files.length) pvTab=0;
  document.getElementById('pvtabs').innerHTML=files.map((f,i)=>
    `<div class="pvt${i===pvTab?' active':''}" title="${f}" onclick="switchPV(${i})">${f}</div>`).join('');
}
function switchPV(i){pvTab=i;renderPVTabs();renderPV();}
let pvTimer=null;
function schedPV(){
  clearTimeout(pvTimer); pvTimer=setTimeout(renderPV,400);
}
function hlNC(md){
  return md.replace(/\[NEEDS CLARIFICATION[^\]]*\]/g,s=>`<span style="color:#ff5555;font-weight:bold">${s}</span>`);
}
function renderPV(){
  const gens=getActiveGens();
  const md=(gens[pvTab]||(() => ''))();
  document.getElementById('pvc').innerHTML=`<pre>${hlNC(md)}</pre>`;
}
function generateAll(){
  renderPV();
  const p=document.getElementById('pvc');
  p.style.transition='box-shadow .3s'; p.style.boxShadow='0 0 22px rgba(0,255,65,.5)';
  setTimeout(()=>p.style.boxShadow='',800);
  toast('Arquivos gerados! Use 👁 Ver para copiar.');
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
function copyOne(){navigator.clipboard.writeText(document.getElementById('pvc').innerText).then(()=>toast('Copiado!'));}
function copyAll(){
  const gens=getActiveGens();
  const files=getActiveFiles();
  const all=gens.map((g,i)=>`<!-- FILE: ${files[i]} -->\n\`\`\`md\n${g()}\n\`\`\``).join('\n\n');
  navigator.clipboard.writeText(all).then(()=>toast('Todos os arquivos copiados!'));
}
function togglePV(){
  if(window.innerWidth<1101) return;
  pvCollapsed=!pvCollapsed;
  document.getElementById('app').style.gridTemplateColumns=pvCollapsed?'230px 1fr 32px':'230px 1fr 420px';
  document.getElementById('pv').setAttribute('data-collapsed',pvCollapsed);
  document.getElementById('pv-toggle-btn').textContent=pvCollapsed?'›':'‹';
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
  render(); schedPV();
  history.replaceState(null,'',window.location.pathname);
  try{localStorage.removeItem(STORAGE_KEY);}catch(err){}
  toast('Projeto resetado');
}
function exportJSON(){
  const nm=(S.meta.name||'projeto').replace(/\s+/g,'-').toLowerCase();
  const b=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`${nm}-spec.json`; a.click();
}

async function downloadZip(){
  if(typeof JSZip==='undefined'){toast('JSZip ainda carregando — tente em 2s',1);return;}
  setAI('thinking','PACKING');
  try{
    const manifest=getManifest();
    const zip=new JSZip();
    for(const entry of manifest){
      const content=entry.gen();
      if(!content) continue;
      // JSZip cria docs/ e agents/ automaticamente a partir do path
      zip.file(entry.path,content);
    }
    zip.file('spec.json',JSON.stringify(S,null,2));
    const blob=await zip.generateAsync({type:'blob'});
    const nm=(S.meta.name||'projeto').replace(/\s+/g,'-').toLowerCase();
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`${nm}-sdd.zip`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),5000);
    toast('Pacote .zip baixado!');
    setAI('synced','SYNCED');
  }catch(err){setAI('error','ERROR');throw err}
}
function importJSON(ev){
  const f=ev.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      Object.assign(S,JSON.parse(e.target.result));
      // Re-sync gitOnly items based on loaded useGit value
      const gitAgent=DEF_AGENTS.find(a=>a.gitOnly);
      const gitCmd=DEF_CMDS.find(c=>c.gitOnly);
      S.agents.list=S.agents.list.filter(a=>!a.gitOnly);
      S.cmds.list=S.cmds.list.filter(c=>!c.gitOnly);
      if(S.meta.useGit===true){
        if(gitAgent) S.agents.list.push({...gitAgent});
        if(gitCmd) S.cmds.list.push({...gitCmd});
      }
      render();saveToLocalStorage();toast('Projeto carregado!');
    }
    catch{toast('Erro no arquivo JSON',1);}
  };
  r.readAsText(f);
}
function toast(msg,err=0){
  const old=document.querySelector('.toast'); if(old) old.remove();
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  t.style.borderColor=err?'var(--r)':'var(--g)'; t.style.color=err?'var(--r)':'var(--g)';
  document.body.appendChild(t); setTimeout(()=>t.remove(),2600);
}

// ── MARKDOWN GENERATORS ───────────────────────────────────────
const nc=(v,fb='')=>v||(fb?`[NEEDS CLARIFICATION: ${fb}]`:'[NEEDS CLARIFICATION]');
const ls=(arr,p='-')=>arr.length?arr.map(i=>`${p} ${i}`).join('\n'):`- [NEEDS CLARIFICATION]`;

function gStart(){
  const name=nc(S.meta.name);
  const firstPhase=S.plan.phases[0];
  const firstPhaseLine=firstPhase
    ? `Fase 1 — ${firstPhase.name||'[NEEDS CLARIFICATION]'} (objetivo: ${firstPhase.goal||'[NEEDS CLARIFICATION]'})`
    : '[NEEDS CLARIFICATION: nenhuma fase definida no roadmap]';
  const agentList=S.agents.list.map(a=>`- \`/agents/${slugifyAgent(a)}.md\` — ${a.name||'agente'}`).join('\n')||'- [NEEDS CLARIFICATION]';
  const changelogLine=S.meta.useGit?'8. `/docs/08-changelog.md` → histórico de versões':'';

  return `# START.md — Bootstrap Agentico

> Ponto de entrada do projeto **${name}**. Se você é uma IA chegando neste repositório do zero, leia este arquivo PRIMEIRO.

---

<bootstrap_protocol>

Você é o **Orquestrador**. Sua missão: levar este projeto do estado atual até produção seguindo a ordem estrita abaixo. Não pule etapas. Não invente contexto que não está documentado — abra \`[NEEDS CLARIFICATION]\` quando faltar informação.

</bootstrap_protocol>

---

<context_assimilation>

## Passo a passo de Assimilação de Contexto

Leia, **na ordem**, antes de qualquer ação:

1. \`/CLAUDE.md\` → regras globais, princípios de engenharia e o uso obrigatório de \`<thinking>\`
2. \`/docs/01-product-spec.md\` → problema, stakeholders, casos de uso e escopo
3. \`/docs/02-architecture.md\` → stack, estilo arquitetural e dependências
4. \`/docs/03-roadmap.md\` → fases, milestones e **Critérios de Aceite**
5. \`/docs/04-security.md\` → threat model e gates obrigatórios de segurança
6. \`/docs/05-rules.md\` → padrões de código, testes e PR review
7. \`/agents/\` → conheça os especialistas disponíveis e quando acionar cada um
${changelogLine}

Após ler, confirme em \`<thinking>\` que você entendeu (a) o problema, (b) a arquitetura, (c) a fase atual do roadmap e (d) quais agentes serão acionados.

</context_assimilation>

---

<first_action>

## Primeira Ação

Comece pela **${firstPhaseLine}** do roadmap.

\`\`\`
1. Abrir <thinking> e mapear arquivos a ler, agente a acionar e critério de aceite que será validado.
2. Acionar o agente especialista apropriado de /agents/
3. Implementar a menor unidade de valor da fase
4. Acionar /agents/code-reviewer.md
5. Rodar /testar — todos os testes verdes
6. Validar contra os <acceptance_criteria> da fase no roadmap
\`\`\`

</first_action>

---

<phase_gate>

## Regra de Avanço de Fase

**Você NÃO PODE avançar para a Fase N+1 enquanto qualquer item dos \`<acceptance_criteria>\` da Fase N estiver pendente, com teste falhando ou com issue Crítico/Alto em aberto no \`/agents/code-reviewer.md\`.**

Se a fase atual estiver bloqueada: pare, descreva o bloqueio em \`<thinking>\`, e devolva o controle ao usuário.

</phase_gate>

---

<thinking_required>

## Tag \`<thinking>\` é OBRIGATÓRIA

Antes de QUALQUER alteração de código, arquivo ou arquitetura, abra:

\`\`\`
<thinking>
- Objetivo desta ação:
- Arquivos lidos (de /docs e /agents):
- Agente especialista acionado:
- Critério de aceite que será validado:
- Riscos de segurança aplicáveis (consultar /docs/04-security.md):
</thinking>
\`\`\`

Saídas sem \`<thinking>\` prévio são consideradas inválidas e devem ser refeitas.

</thinking_required>

---

<agents_index>

## Índice de Agentes

${agentList}

</agents_index>
`;
}

function gArchitecture(){
  const langs=S.arch.languages.length?S.arch.languages.map(l=>`- ${l}`).join('\n'):'- [NEEDS CLARIFICATION]';
  const fwks=S.arch.frameworks.length?S.arch.frameworks.map(l=>`- ${l}`).join('\n'):'- [NEEDS CLARIFICATION]';
  const dbs=S.arch.databases.length?S.arch.databases.map(l=>`- ${l}`).join('\n'):'- [NEEDS CLARIFICATION]';
  const msgs=S.arch.messaging.length?S.arch.messaging.map(l=>`- ${l}`).join('\n'):'- —';
  const ints=S.arch.integrations.length?S.arch.integrations.map(l=>`- ${l}`).join('\n'):'- —';

  return `# 02 — Architecture

> Stack, estilo arquitetural e justificativa de cada dependência. Antes de adicionar QUALQUER tecnologia nova, justifique aqui (KISS).

---

<style>

## Estilo Arquitetural

**${nc(S.arch.style)}**

${S.arch.scalability?`### Escalabilidade esperada\n${S.arch.scalability}`:''}

</style>

---

<stack>

## Stack

### Linguagens
${langs}

### Frameworks
${fwks}

### Bancos de Dados
${dbs}

### Cache / Filas / Mensageria
${msgs}

</stack>

---

<integrations>

## Integrações Externas

${ints}

> Toda integração externa exige tratamento de falha (timeout, retry com backoff, circuit breaker) e validação de webhook (HMAC) quando aplicável.

</integrations>

---

<dependency_rationale>

## Por que cada dependência existe?

Para cada item da stack acima, responda em \`<thinking>\`: **"Isso resolve um problema real e atual, ou é over-engineering?"**

- Monolito modular é a melhor escolha por padrão.
- Microsserviços só se justificam com escala real e múltiplas equipes.
- Cache (Redis) só quando há hot path mensurável.
- Filas só quando há trabalho assíncrono de fato.

Tecnologias adicionadas sem justificativa documentada devem ser questionadas pelo \`/agents/architect.md\` no próximo Code Review.

</dependency_rationale>
`;
}

function gAgentFile(a){
  const reads=(a.arts||'').split(',').map(s=>s.trim()).filter(Boolean).map(f=>`- \`${f}\``).join('\n')||'- `/CLAUDE.md`\n- `/docs/01-product-spec.md`';
  const isOrch=a.implicit&&!a.gitOnly;
  const isGit=a.gitOnly;
  const triggerNote=isOrch
    ? 'Ponto de entrada padrão. É acionado em toda nova tarefa.'
    : isGit
      ? 'NUNCA acionado diretamente. Só pode ser invocado pelo Orquestrador após o Code Reviewer emitir "✅ APROVADO" e todos os testes passarem.'
      : 'Acionado pelo Orquestrador quando a tarefa entra no domínio de responsabilidade abaixo.';

  return `# Agente — ${a.name||'[NEEDS CLARIFICATION]'}

<role>
${triggerNote}
</role>

---

<responsibilities>

${a.resp||'[NEEDS CLARIFICATION]'}

</responsibilities>

---

<reads_first>

Antes de qualquer ação, este agente DEVE ler:

${reads}

</reads_first>

---

<style>

${a.style||'[NEEDS CLARIFICATION]'}

</style>

---

<mandatory_thinking>

Antes de produzir qualquer saída (código, decisão, revisão), este agente DEVE abrir:

\`\`\`
<thinking>
- Tarefa recebida:
- Arquivos lidos:
- Critério de aceite a validar (do /docs/03-roadmap.md):
- Regras de /docs/04-security.md aplicáveis:
- Plano de ação:
</thinking>
\`\`\`

Sem \`<thinking>\` prévio, a saída deste agente é inválida.

</mandatory_thinking>
${isGit?`
---

<git_master_protocol>

## Protocolo de Versionamento

\`\`\`
1. Implementação concluída
2. /code-review → sem issues Crítico ou Alto
3. /testar → todos os testes passando
4. Code Reviewer emite: "✅ APROVADO — Git Master pode ser acionado"
5. Orquestrador aciona Git Master

❌ NUNCA commitar com testes falhando
❌ NUNCA commitar com issue Crítico ou Alto aberto
\`\`\`

Conventional Commits obrigatório. Toda mensagem referencia a fase do \`/docs/03-roadmap.md\`.

</git_master_protocol>
`:''}`;
}

function gClaude(){
  const cmdTbl=S.cmds.list.map(c=>`| \`${c.name||'?'}\` | ${c.goal||'?'} |`).join('\n');
  const examplesBlock=S.rules.examples&&S.rules.examples.trim()
    ? `\n<examples>\nReferência de estilo de código que você DEVE seguir ao implementar neste projeto.\nUse estes trechos como modelo de qualidade, estrutura e idioma.\n\n\`\`\`\n${S.rules.examples}\n\`\`\`\n</examples>\n\n---\n`
    : '';

  return `# CLAUDE.md — Constituição do Projeto

> Leia este arquivo antes de qualquer interação.
> Você é o **Orquestrador / Team Lead**: leia /docs/01-product-spec.md, /docs/03-roadmap.md e /docs/04-security.md, entenda a tarefa, decida qual agente especialista acionar e garanta conformidade com /docs/05-rules.md e /docs/04-security.md.

---

<mandatory_thinking>

## Regra #0 — \`<thinking>\` é OBRIGATÓRIO

Antes de QUALQUER alteração de código, arquitetura ou arquivo, você DEVE abrir:

\`\`\`
<thinking>
- Objetivo da ação:
- Arquivos lidos (/docs e /agents):
- Agente especialista acionado:
- Critério de aceite que será validado (do /docs/03-roadmap.md):
- Riscos de segurança aplicáveis (/docs/04-security.md):
</thinking>
\`\`\`

**Saídas sem \`<thinking>\` prévio são inválidas e devem ser refeitas.** Esta regra não tem exceção — vale para correções triviais, refatorações e mudanças "óbvias".

</mandatory_thinking>

---

<project_scope>

## Projeto

| Campo | Valor |
|-------|-------|
| **Nome** | ${nc(S.meta.name)} |
| **Tipo** | ${nc(S.meta.type)} |
| **Estágio** | ${nc(S.meta.stage)} |
| **Público-alvo** | ${nc(S.meta.audience)} |
| **Pitch** | ${nc(S.meta.pitch)} |

## Objetivos

**Problema:** ${nc(S.domain.problem)}

**Objetivos:**
${ls(S.domain.objectives)}

</project_scope>

---

<architecture>

## Stack Principal

- **Linguagens:** ${S.arch.languages.join(', ')||'[NEEDS CLARIFICATION]'}
- **Frameworks:** ${S.arch.frameworks.join(', ')||'[NEEDS CLARIFICATION]'}
- **Banco de dados:** ${S.arch.databases.join(', ')||'[NEEDS CLARIFICATION]'}
- **Cache / Filas:** ${S.arch.messaging.join(', ')||'—'}
- **Arquitetura:** ${nc(S.arch.style)}

</architecture>

---

<sources_of_truth>

## Fontes de Verdade

| Arquivo | Propósito |
|---------|-----------|
| \`SPEC.md\` | Requisitos funcionais e não-funcionais |
| \`PLAN.md\` | Plano de implementação em fases |
| \`AGENTS.md\` | Agentes e Orquestrador |
| \`RULES.md\` | Regras de código, arquitetura e qualidade |
| \`SECURITY.md\` | Threat model e regras de segurança por domínio |
| \`HOOKS.md\` | Automações e CI/CD |
| \`SLASH-COMMANDS.md\` | Comandos disponíveis |

</sources_of_truth>

---

<rules_for_claude>

## Regras para o Claude

1. Leia **SPEC.md** e **PLAN.md** antes de alterar qualquer código de negócio.
2. Nunca mude arquitetura sem atualizar SPEC.md e confirmar com o usuário.
3. Sempre proponha testes para mudanças relevantes.
4. Sinalize \`[NEEDS CLARIFICATION]\` quando faltar informação.
5. Nunca execute ações destrutivas sem aprovação explícita.
6. **Antes de implementar auth, dados de usuário, pagamento ou integração externa: leia SECURITY.md e aplique as regras do domínio correspondente.**
7. **Antes de criar ou alterar models, queries ou migrations: acione o agente DBA.**
8. Aplique SOLID, DRY e KISS — questione complexidade desnecessária.
9. Como Orquestrador: identifique e acione o agente especialista adequado para cada tarefa.

</rules_for_claude>

---

<engineering_principles>

## Princípios de Engenharia

- **SOLID**: código desacoplado e manutenível
- **DRY**: sem duplicação
- **KISS**: a solução mais simples que funciona
- **Clean Code**: nomes claros, funções pequenas, responsabilidade única
- **Segurança por design**: não é feature extra — é parte de cada componente

</engineering_principles>

---

<workflow>

## Fluxo de Trabalho

\`\`\`
Especificar → Clarificar → Planejar → [Sec Review] → Implementar → Code Review (obrigatório) → Testar → PR
\`\`\`

> ⚠️ O Code Reviewer deve ser acionado após **toda** /implementar, sem exceção.
> Nenhum commit ou PR sem aprovação do Code Reviewer.

</workflow>

---

<slash_commands>

## Slash Commands

| Comando | Objetivo |
|---------|----------|
${cmdTbl||'| — | — |'}

</slash_commands>

---
${examplesBlock}
<thinking_instruction>
Antes de gerar qualquer código, use a tag \`<thinking>...</thinking>\` para raciocinar passo a passo:

1. Reformule a tarefa com suas próprias palavras
2. Identifique quais arquivos de verdade (SPEC.md, PLAN.md, RULES.md, SECURITY.md) são relevantes
3. Liste os agentes especialistas que precisam ser acionados
4. Verifique alinhamento com as regras de segurança aplicáveis
5. Só então produza o código ou a explicação final

A tag \`<thinking>\` é interna ao seu raciocínio — não a inclua no código entregue ao usuário.
</thinking_instruction>
`;
}

function gSpec(){
  const sths=S.domain.stakeholders.length
    ?S.domain.stakeholders.map(s=>`### ${s.name||'[NEEDS CLARIFICATION]'}\n- **Descrição:** ${s.desc||'[NEEDS CLARIFICATION]'}\n- **Objetivos:** ${s.goals||'[NEEDS CLARIFICATION]'}`).join('\n\n')
    :'> [NEEDS CLARIFICATION]';
  const ucs=S.domain.useCases.length
    ?S.domain.useCases.map((u,i)=>`### UC${String(i+1).padStart(2,'0')} — ${u.title||'[NEEDS CLARIFICATION]'}\n- **Ator:** ${u.actor||'—'}\n- **Fluxo:** ${u.desc||'[NEEDS CLARIFICATION]'}`).join('\n\n')
    :'> [NEEDS CLARIFICATION]';
  return `# SPEC.md — Especificação do Projeto

> Fonte única da verdade. Resolva todos os [NEEDS CLARIFICATION] antes de implementar.

---

## Visão Geral

**${nc(S.meta.pitch)}**

${nc(S.domain.problem,'Descreva o problema de negócio')}

---

## Escopo

### ✅ Dentro do Escopo
${ls(S.domain.objectives)}

### ❌ Fora do Escopo
${ls(S.domain.nonGoals)}

---

## Stakeholders & Personas

${sths}

---

## Funcionalidades Principais

${ucs}

---

## Requisitos Não Funcionais

${ls(S.domain.nfrs)}

### Escalabilidade
- Volume esperado: ${nc(S.arch.scalability,'Defina volume e picos esperados')}
- Estratégia: cache, filas e paginação devem ser planejados antes de escalar

### Performance
- Queries devem ser otimizadas com índices pelo agente DBA
- Evitar N+1 queries — usar eager loading ou DataLoader quando necessário
- Cache (Redis ou similar) para dados lidos com frequência e baixa mutação

### Manutenibilidade
- Cobertura de testes mínima: ${S.rules.tests?'ver RULES.md':'[NEEDS CLARIFICATION]'}
- APIs documentadas com Swagger/OpenAPI
- Decisões arquiteturais registradas em \`docs/adr/\`

---

## Integrações Externas

${S.arch.integrations.length?S.arch.integrations.map(i=>`- ${i}`).join('\n'):'- [NEEDS CLARIFICATION se aplicável]'}

---

## Segurança e Privacidade

${secText()}
${S.rules.security?'\n'+S.rules.security:''}

> Para regras técnicas detalhadas, consulte **SECURITY.md**.
`;
}

function gPlan(){
  const phs=S.plan.phases.length
    ?S.plan.phases.map((ph,i)=>{
      const doneLines=(ph.done||'').split('\n').map(s=>s.trim()).filter(Boolean);
      const userCriteria=doneLines.length
        ? doneLines.map(l=>l.startsWith('-')||l.startsWith('*')?l:`- ${l}`).join('\n')
        : '- [NEEDS CLARIFICATION: defina critérios verificáveis]';
      return `
## Milestone ${i+1}: ${ph.name||'[NEEDS CLARIFICATION]'}
${ph.deadline?`**Prazo:** ${ph.deadline}\n`:''}
**Objetivo:** ${ph.goal||'[NEEDS CLARIFICATION]'}

**Entregáveis:**
${ph.deliverables?ph.deliverables.split('\n').map(l=>`- ${l}`).join('\n'):'- [NEEDS CLARIFICATION]'}

<acceptance_criteria milestone="${i+1}">

Este milestone só é considerado CONCLUÍDO quando TODOS os critérios abaixo estiverem verdes:

${userCriteria}
- Code Reviewer aprovou sem issues Crítico ou Alto em aberto
- Todos os testes automatizados (\`/testar\`) passando
- Gates de \`/docs/04-security.md\` aplicáveis foram validados${S.meta.useGit?'\n- Git Master criou PR com referência a este milestone':''}

</acceptance_criteria>
`;
    }).join('\n---\n')
    :'> [NEEDS CLARIFICATION]';

  return `# 03 — Roadmap

> Sequência rigorosa de milestones. Atualizar ao concluir cada um.

<phase_gate>

## Regra de Avanço

**É PROIBIDO iniciar o Milestone N+1 enquanto qualquer item dos \`<acceptance_criteria>\` do Milestone N estiver pendente, com teste falhando ou com issue Crítico/Alto aberto pelo Code Reviewer.**

Se um milestone estiver bloqueado: abra \`<thinking>\` descrevendo o bloqueio e devolva o controle ao usuário humano.

</phase_gate>

---

---

## Objetivo

Implementar **${nc(S.meta.name)}** em fases iterativas, entregando valor a cada ciclo.

---

${phs}

---

## Ordem de Implementação Recomendada

1. **Setup**: repositório, CI/CD, linting, estrutura de pastas
2. **Fundação de segurança**: autenticação, autorização, secrets management
3. **Modelagem de dados** (acionar agente DBA): schema, índices, constraints
4. **Domínio central**: regras de negócio, entidades, casos de uso
5. **APIs e integrações**: endpoints, validação, tratamento de erros
6. **Testes automatizados**: unitários, integração, E2E dos fluxos críticos
7. **Observabilidade**: logs estruturados, métricas, alertas
8. **Performance**: cache, otimização de queries, lazy loading
9. **Hardening e segurança**: penetration test, npm audit, revisão de headers

---

## Riscos e Mitigação

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Dependências externas instáveis | Média | Mocks em dev; monitorar SLAs; circuit breaker |
| Mudanças de requisito | Alta | SPEC.md atualizada; revisões regulares |
| Over-engineering prematuro | Média | Questionar toda tecnologia antes de adicionar |
| Vulnerabilidade de segurança | Alta | SECURITY.md como gate obrigatório no PR |
| Performance degradada | Média | DBA review em toda query; Redis para hot paths |
`;
}

function gAgents(){
  const orch=S.agents.list.find(a=>a.implicit&&!a.gitOnly);
  const gitMaster=S.agents.list.find(a=>a.gitOnly);
  const specs=S.agents.list.filter(a=>!a.implicit&&!a.gitOnly);
  const codeReviewer=specs.find(a=>a.name==='Code Reviewer');
  const reviewerResp=codeReviewer
    ? codeReviewer.resp + (S.meta.useGit ? ' Após aprovação sem issues Crítico/Alto + testes passando, emite sinal explícito "✅ APROVADO — Git Master pode ser acionado" para liberar o versionamento. Sem essa sinalização, o Git Master não age.' : '')
    : '[NEEDS CLARIFICATION]';

  const gitMasterSection=S.meta.useGit&&gitMaster?`
---

<git_master>

## Git Master

> **Agente exclusivo de versionamento.** NUNCA é chamado diretamente.

| Campo | Valor |
|-------|-------|
| **Responsabilidades** | ${gitMaster.resp} |
| **Arquivos** | \`${(gitMaster.arts||'').replace(/,\s*/g,'`, `')}\` |
| **Estilo** | ${gitMaster.style} |

\`\`\`
Fluxo obrigatório antes de qualquer commit:
  1. Implementação concluída
  2. /code-review → sem issues Crítico ou Alto
  3. /testar → todos os testes passando (Playwright, Jest, etc.)
  4. Code Reviewer emite: "✅ APROVADO — Git Master pode ser acionado"
  5. Orquestrador aciona Git Master

  ❌ NUNCA commitar com testes falhando
  ❌ NUNCA commitar com issue Crítico ou Alto aberto
\`\`\`

</git_master>
`:'';

  return `# AGENTS.md — Agentes de IA

> Papéis especializados para uso com Claude Code.
> O Orquestrador é o ponto de entrada padrão e coordena todos os outros.

---

<orchestrator>

## Orquestrador / Team Lead

> **Ponto de entrada padrão.** Lê a documentação completa e decide qual especialista acionar.

| Campo | Valor |
|-------|-------|
| **Responsabilidades** | ${orch?orch.resp:'Lê CLAUDE.md, SPEC.md, PLAN.md, RULES.md e SECURITY.md. Decide qual especialista acionar. Valida resultado.'} |
| **Arquivos prioritários** | \`CLAUDE.md\`, \`SPEC.md\`, \`PLAN.md\`, \`RULES.md\`, \`SECURITY.md\` |
| **Estilo** | Explica o que vai fazer e por quê. Faz checagem final antes de entregar. |

\`\`\`
Fluxo:
Receber tarefa → Ler docs → Identificar agente → Acionar com contexto
→ Validar contra RULES.md + SECURITY.md → Entregar com explicação
\`\`\`

</orchestrator>

---

<specialists>

## Agentes Especialistas

${specs.map(a=>{
  const resp=a.name==='Code Reviewer'?reviewerResp:(a.resp||'[NEEDS CLARIFICATION]');
  return `### ${a.name||'[NEEDS CLARIFICATION]'}
| Campo | Valor |
|-------|-------|
| **Responsabilidades** | ${resp} |
| **Arquivos** | \`${(a.arts||'').replace(/,\s*/g,'`, `')}\` |
| **Estilo** | ${a.style||'[NEEDS CLARIFICATION]'} |
`;}).join('\n')||'> [NEEDS CLARIFICATION]'}

</specialists>
${gitMasterSection}
---

<usage>

## Como Usar

\`\`\`
// Modo Orquestrador (padrão)
Você é o Orquestrador. Leia CLAUDE.md, SPEC.md e PLAN.md.
Tarefa: [DESCRIÇÃO]
Decida qual agente especialista usar e execute.

// Modo especialista direto
Você é o agente DBA. Leia SPEC.md e RULES.md.
Tarefa: revisar a migration users.sql e sugerir índices.
\`\`\`

</usage>
`;
}

function gRules(){
  const hasAuth=hasCheck('sec-login');
  const hasRoles=hasCheck('sec-roles');
  const hasLGPD=hasCheck('sec-lgpd');
  const hasCrypto=hasCheck('sec-cripto');
  const hasLogs=hasCheck('sec-logs');
  const webArch=isWebArch();
  const apiArch=isApiArch();

  const authRules=hasAuth?`
### Autenticação
- Hash de senha com **bcrypt** (custo ≥ 12) ou **Argon2id** — nunca MD5/SHA1/SHA256 direto.
- JWT assinado com **RS256 ou ES256** (chave assimétrica) — nunca HS256 com segredo fraco.
- **JWT armazenado em HttpOnly + Secure + SameSite=Strict cookie** — nunca localStorage.
- Refresh token com rotação obrigatória; invalidar anterior imediatamente no servidor.
- Rate limiting no login: 5 tentativas por IP/15 min, depois backoff exponencial.
- Logout invalida refresh token no servidor (blacklist Redis ou rotação).`:'';

  const rolesRules=hasRoles?`
### Autorização (RBAC)
- Validar permissões **no servidor** em cada request — nunca confiar no cliente.
- Verificar ownership: usuário A não acessa dados do usuário B mesmo com role válido.
- Tokens não carregam permissões mutáveis — buscar do banco a cada operação crítica.
- Audit log obrigatório para ações privilegiadas.`:'';

  const apiRules=apiArch?`
### API
- Validar e sanitizar **toda entrada** no servidor com Zod/Joi — schema antes do handler.
- Rejeitar campos desconhecidos (\`stripUnknown\`).
- Erros retornam mensagem genérica ao cliente; detalhe apenas no log interno.
- CORS: whitelist explícita de origens — nunca \`*\` em produção.
- Rate limiting global: por IP e por usuário autenticado.
- IDs na API: usar **UUIDs v4** — nunca IDs sequenciais (evita IDOR).
- Headers: \`CSP\`, \`X-Frame-Options: DENY\`, \`X-Content-Type-Options\`, \`HSTS\`.`:'';

  const webRules=webArch?`
### Frontend
- Nunca armazenar tokens ou PII em localStorage/sessionStorage.
- Nunca usar \`innerHTML\` / \`dangerouslySetInnerHTML\` com dados externos.
- Sanitizar HTML de terceiros com **DOMPurify**.
- CSP deve bloquear \`unsafe-inline\` e \`unsafe-eval\`.
- \`npm audit\` no CI — bloquear build com CVE crítico.`:'';

  const lgpdRules=hasLGPD?`
### LGPD
- Coletar apenas dados estritamente necessários (minimização).
- Consentimento registrado com \`userId\`, \`timestamp\`, \`ipHash\`, \`versão do termo\`.
- Endpoint de deleção de conta que anonimiza todos os dados do usuário.
- Prazo de retenção definido por tipo de dado; job de purge automático.`:'';

  const cryptoRules=hasCrypto?`
### Criptografia
- Dados sensíveis em repouso: **AES-256-GCM**.
- Em trânsito: **TLS 1.3** (mínimo TLS 1.2). Desabilitar SSLv3/TLS 1.0/1.1.
- Chaves via secret manager (Vault, AWS KMS) — nunca em código ou \`.env\` commitado.`:'';

  const logRules=hasLogs?`
### Logs
- Nunca logar: senhas, tokens, CPF, e-mail, telefone, dados de cartão.
- Estrutura JSON: \`timestamp\`, \`level\`, \`traceId\`, \`userId\` (hash), \`action\`, \`result\`.
- Log de auditoria separado para: login, logout, mudança de senha, alteração de permissão, deleção.`:'';

  const noSec=!hasAuth&&!hasRoles&&!hasLGPD&&!hasCrypto&&!hasLogs&&!webArch&&!apiArch;

  return `# RULES.md — Regras e Padrões

> Para threat model e regras de segurança detalhadas por vetor, consulte **SECURITY.md**.

---

<global_principles>

## Princípios Globais

- **SOLID**: responsabilidade única, aberto/fechado, substituição de Liskov, segregação de interfaces, inversão de dependência.
- **DRY**: sem duplicação de lógica.
- **KISS**: a solução mais simples que resolve o problema real.
- **Clean Code**: nomes claros, funções pequenas (≤ 20 linhas), responsabilidade única.
- **Não superengenheirar**: questionar toda tecnologia antes de adicionar.

</global_principles>

---

<code_rules>

## Código

${S.rules.code||'[NEEDS CLARIFICATION: Defina linters, formatadores e convenções]'}

</code_rules>

---

<architecture_rules>

## Arquitetura

${S.rules.architecture||'[NEEDS CLARIFICATION: Defina limites entre módulos e camadas]'}

</architecture_rules>

---

<database_rules>

## Banco de Dados (acionar agente DBA)

- Modelagem correta: relacionamentos bem definidos, constraints e chaves estrangeiras.
- Índices em todas as colunas usadas em \`WHERE\`, \`JOIN\` e \`ORDER BY\` frequentes.
- Evitar N+1 queries — usar eager loading ou DataLoader.
- Queries com paginação obrigatória — nunca \`SELECT *\` em tabelas grandes.
- Dados duplicados são proibidos — normalização adequada.
- Estratégia de cache definida para hot paths (Redis ou similar).

</database_rules>

---

<test_rules>

## Testes

${S.rules.tests||'[NEEDS CLARIFICATION: Defina cobertura mínima e obrigatoriedade]'}

Pirâmide de testes:
- **Unitários**: lógica de domínio e funções puras
- **Integração**: endpoints de API e integrações externas
- **E2E**: fluxos críticos do usuário (login, checkout, etc.)
- **Carga**: k6 ou similar para endpoints de alto volume

</test_rules>

---

<security_rules>

## Segurança${noSec?' [NEEDS CLARIFICATION: Defina requisitos na etapa Qualidade & Operação]':''}
${authRules}${rolesRules}${apiRules}${webRules}${lgpdRules}${cryptoRules}${logRules}
${S.rules.security?'\n### Regras Adicionais\n'+S.rules.security:''}

</security_rules>

---

<performance_rules>

## Performance

- Backend: cache para dados lidos frequentemente, filas para operações pesadas.
- Queries: analisadas pelo agente DBA antes de ir para produção.
- Frontend: lazy loading, code splitting, otimização de imagens, SSR/SSG quando aplicável.
- Compressão de resposta (gzip/brotli) habilitada.

</performance_rules>

---

<documentation_rules>

## Documentação

- APIs documentadas com **Swagger/OpenAPI** (\`/docs\`).
- Decisões arquiteturais em \`docs/adr/\` (Architecture Decision Records).
- Mapa de dados sensíveis em \`docs/data-map.md\`.

</documentation_rules>

---

<commit_rules>

## Commits e Branches

\`\`\`
feat/ fix/ chore/ docs/ test/ sec/ perf/
Formato: tipo(escopo): descrição no imperativo
Exemplos:
  feat(auth): implementar refresh token com rotação
  sec(api): adicionar rate limiting no endpoint de login
  perf(db): adicionar índice na coluna user_id da tabela orders
\`\`\`

</commit_rules>

<pr_review_rules>

## PR Review

- PRs com auth, permissões ou dados sensíveis: revisão de segurança obrigatória (/sec-review).
- PRs com models, migrations ou queries: revisão do agente DBA (/db-review).
- Nenhum merge com testes falhando ou vulnerabilidade crítica no \`npm audit\`.

</pr_review_rules>
${S.meta.useGit?`
---

<git_workflow>

## Fluxo de Versionamento com Git Master

Cadeia obrigatória: implementar → /code-review (sem Crítico/Alto) → /testar (todos passando) → Code Reviewer: "✅ APROVADO" → Git Master: commit + PR

Padrão Conventional Commits: feat, fix, refactor, test, docs, chore, sec, perf
Formato: \`tipo(escopo): descrição\` + corpo com referência à fase do PLAN.md

Branches:
- \`main\`/\`master\`: nunca commitar direto — sempre via PR aprovado
- Features: \`feat/nome-da-feature\` | Fixes: \`fix/descricao-do-bug\`

</git_workflow>
`:''}`;
}

function gHooks(){
  const hks=S.rules.hooks.length
    ?S.rules.hooks.map((h,i)=>`
### Automação ${i+1}
| Quando | O que faz | Ferramenta |
|--------|-----------|------------|
| ${h.trigger||'[NEEDS CLARIFICATION]'} | ${h.action||'[NEEDS CLARIFICATION]'} | ${h.tool||'[NEEDS CLARIFICATION]'} |
`).join('\n')
    :'> [NEEDS CLARIFICATION: Defina automações]';

  return `# HOOKS.md — Automações e CI/CD

---

${hks}

---

## Pipelines Recomendados

### Pipeline de PR (obrigatório)
\`\`\`
Abertura de PR
  → Lint (bloqueia se falhar)
  → Testes unitários + integração (bloqueia se falhar)
  → npm audit --audit-level=critical (bloqueia se CVE crítico)
  → Build
  → Notificação ao time
\`\`\`

### Pipeline de Release
\`\`\`
Tag de versão
  → Suite completa de testes
  → Build prod
  → Deploy staging
  → Smoke tests
  → Aprovação manual obrigatória
  → Deploy prod
  → Notificação
\`\`\`

### Rota de Incidente
\`\`\`
Alarme crítico
  → Notificar time (Slack/PagerDuty)
  → Criar issue com prioridade máxima
  → Analisar logs (NÃO deletar — preservar para forense)
  → Avaliar rollback
  → Post-mortem obrigatório
\`\`\`

---

**CI/CD:** ${S.quality.cicd||'[NEEDS CLARIFICATION]'}
**Ambientes:** ${S.quality.envs.join(', ')||'[NEEDS CLARIFICATION]'}

Regras:
- Produção: aprovação manual obrigatória.
- Segredos nunca expostos em logs de CI/CD.
- Ambientes de staging idênticos à produção (parity).
`;
}

function gCmds(){
  const cmd0=S.cmds.list[0]||{name:'/corrigir',reads:'SPEC.md, RULES.md, SECURITY.md',goal:'Revisar código',args:'[arquivo]'};
  const gitCommitFile=S.meta.useGit?`

---

## \`.claude/commands/git-commit.md\`

\`\`\`markdown
---
description: "Fluxo completo de versionamento: verifica aprovação do Code Reviewer, confirma testes passando, cria commit semântico e abre PR."
argument-hint: "descrição da feature ou fix concluído"
---

Projeto: **${S.meta.name||'[PROJETO]'}**

Leia antes de começar:
- \`SPEC.md\`
- \`PLAN.md\`
- \`RULES.md\`

## Checklist de Pré-requisitos

Verifique cada item antes de prosseguir. Se qualquer item NÃO estiver confirmado, PARE e informe o usuário.

- [ ] /code-review foi executado e não há issues Crítico ou Alto em aberto
- [ ] /testar foi executado e todos os testes estão passando (Playwright, Jest, etc.)
- [ ] Code Reviewer emitiu explicitamente: "✅ APROVADO — Git Master pode ser acionado"
- [ ] Não há arquivos não intencionais no staging area

❌ Se qualquer item acima não estiver confirmado: PARE. Informe qual pré-requisito está pendente e aguarde resolução.

## Fluxo de Commit

Após confirmação de todos os pré-requisitos:

1. Identifique o tipo de mudança: feat | fix | refactor | test | docs | chore | sec | perf
2. Identifique o escopo (módulo ou camada afetada)
3. Referencie a fase do PLAN.md correspondente

**Formato obrigatório:**
\`\`\`
tipo(escopo): descrição no imperativo

- Detalhe relevante 1
- Detalhe relevante 2

Ref: PLAN.md Fase X — [nome da fase]
\`\`\`

**Branch:**
- Features: \`feat/nome-da-feature\`
- Fixes: \`fix/descricao-do-bug\`
- Nunca commitar direto em main/master

**Argumentos recebidos:** \`$ARGUMENTS\`
\`\`\`
`:'';

  return `# SLASH-COMMANDS.md — Comandos para Claude Code

> Criar arquivos em \`.claude/commands/\`.

---

## Comandos Disponíveis

${S.cmds.list.map(c=>`### \`${c.name||'/cmd'}\`
| O que faz | Quando usar | Argumentos | Lê primeiro |
|-----------|------------|------------|-------------|
| ${c.goal||'[NEEDS CLARIFICATION]'} | ${c.when||'—'} | \`${c.args||'—'}\` | \`${c.reads||'—'}\` |
`).join('\n')||'> [NEEDS CLARIFICATION]'}

---

## Exemplo: \`.claude/commands/${(cmd0.name||'/corrigir').replace('/','')}.md\`

\`\`\`markdown
---
description: "${cmd0.goal||'Descrição'}"
argument-hint: "${cmd0.args||'[argumento]'}"
---

Projeto: **${S.meta.name||'[PROJETO]'}**

Leia antes de começar:
${(cmd0.reads||'SPEC.md').split(',').map(f=>`- \`${f.trim()}\``).join('\n')}

Passos:
1. Analise: \`$ARGUMENTS\`
2. ${cmd0.goal||'Execute a tarefa'}
3. Explique cada mudança e o motivo.
4. Use [NEEDS CLARIFICATION] se faltar informação.
5. Nunca faça ações destrutivas sem confirmação explícita.
6. Sempre verifique se a mudança respeita SECURITY.md.
\`\`\`
${gitCommitFile}`;
}

function gSecurity(){
  const proj=nc(S.meta.name);
  const hasAuth=hasCheck('sec-login');
  const hasRoles=hasCheck('sec-roles');
  const hasLGPD=hasCheck('sec-lgpd');
  const hasCrypto=hasCheck('sec-cripto');
  const hasLogs=hasCheck('sec-logs');
  const webArch=isWebArch();
  const apiArch=isApiArch();
  const integrations=S.arch.integrations;

  const threats=[];
  threats.push(`| Secrets Exposure | Código/Logs/CI | Crítica | Secret manager; git-secrets no pre-commit; nunca commitar \`.env\` |`);
  threats.push(`| Dependency Vulnerabilities | Build/Deploy | Alta | \`npm audit\` no CI; Dependabot; bloquear build com CVE crítico |`);
  if(hasAuth){
    threats.push(`| Brute Force / Credential Stuffing | Endpoint de login | Alta | Rate limiting 5 req/15min/IP; backoff exponencial; CAPTCHA após 3 falhas |`);
    threats.push(`| Token Theft via XSS | Toda aplicação | Alta | JWT em HttpOnly cookie; CSP restritivo; nunca localStorage |`);
    threats.push(`| JWT Algorithm Confusion | API de autenticação | Alta | Fixar algoritmo no servidor (RS256/ES256); rejeitar \`alg: none\` |`);
    threats.push(`| Session Fixation | Fluxo de login | Média | Regenerar session ID após autenticação bem-sucedida |`);
  }
  if(hasRoles){
    threats.push(`| IDOR (Insecure Direct Object Reference) | Todos endpoints | Alta | Validar ownership no servidor; usar UUIDs; nunca IDs sequenciais |`);
    threats.push(`| Privilege Escalation | Endpoints admin | Alta | Verificar role no servidor a cada request |`);
  }
  if(webArch){
    threats.push(`| XSS (Cross-Site Scripting) | Frontend | Alta | Escapar saída; CSP; nunca innerHTML com dados externos; DOMPurify |`);
    threats.push(`| CSRF (Cross-Site Request Forgery) | Forms/Mutations | Alta | SameSite=Strict cookie; CSRF token em operações de escrita |`);
    threats.push(`| Clickjacking | Toda UI | Baixa | Header X-Frame-Options: DENY |`);
  }
  if(apiArch){
    threats.push(`| SQL/NoSQL Injection | Queries de banco | Crítica | ORM com parametrização; nunca concatenar input em query |`);
    threats.push(`| Mass Assignment | Endpoints de criação | Alta | Whitelist explícita de campos; nunca spread direto do body |`);
    threats.push(`| Excessive Data Exposure | Responses de API | Média | Serializar apenas campos necessários |`);
    threats.push(`| Path Traversal | Upload/File serve | Alta | Validar caminhos; nunca usar input do usuário em fs.readFile |`);
  }
  if(integrations.length>0){
    threats.push(`| Supply Chain Attack | Integrações externas | Média | Validar webhooks (HMAC); chaves com escopo mínimo; rotacionar |`);
  }

  const authSection=hasAuth?`
## 2. Autenticação Segura

### Fluxo de Login
\`\`\`
POST /auth/login
  → Validar schema (email, senha não vazia)
  → Buscar usuário (timing-safe: mesmo tempo se não existe)
  → bcrypt.compare() — nunca comparação direta
  → Se falha: incrementar contador Redis; retornar erro genérico "credenciais inválidas"
  → Se sucesso:
      access token  → JWT RS256, exp 15min
      refresh token → UUID v4 opaco, salvo como hash, exp 7d
  → Set-Cookie: accessToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api
  → Set-Cookie: refreshToken=<t>; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh

POST /auth/refresh
  → Validar refresh token (buscar hash no banco)
  → Invalidar token atual (rotação)
  → Emitir novo par de tokens

POST /auth/logout
  → Invalidar refresh token no servidor (não apenas no cliente)
\`\`\`

### Rate Limiting de Autenticação
\`\`\`
Endpoint /auth/login:
  - 5 requisições / 15 minutos por IP
  - Após 3 falhas: exigir CAPTCHA
  - Após 5 falhas: bloquear IP por 15min (backoff exponencial)
  - Notificar usuário por e-mail após 5 falhas na mesma conta
\`\`\`

### Senhas
- Mínimo 12 caracteres.
- Verificar contra lista de senhas comuns.
- Nunca armazenar em texto puro — bcrypt/Argon2id obrigatório.
- Nunca logar senhas (mesmo com erro de validação).`:'';

  const apiSection=apiArch?`
## 3. Segurança de API

### Headers Obrigatórios
\`\`\`
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
\`\`\`

### Validação de Input
\`\`\`typescript
// ✅ Correto — schema definido antes do handler
const schema = z.object({ email: z.string().email(), password: z.string().min(12) });
const body = schema.parse(req.body); // lança erro se inválido

// ❌ Errado — aceita qualquer coisa
const { email, password } = req.body;
\`\`\`

### Tratamento de Erros
\`\`\`typescript
// ✅ Correto
catch (err) {
  logger.error({ traceId, err: err.message, userId: req.user?.id });
  res.status(500).json({ error: 'Erro interno', traceId });
}

// ❌ Errado — expõe detalhe interno
res.status(500).json({ error: err.message, stack: err.stack });
\`\`\`

### Banco de Dados
\`\`\`typescript
// ✅ Correto — query parametrizada via ORM
await db.user.findFirst({ where: { id: userId } });

// ❌ Errado — SQL injection
await db.raw(\`SELECT * FROM users WHERE id = \${userId}\`);
\`\`\``:'';

  const webSection=webArch?`
## 4. Segurança Frontend

### Armazenamento
| Local | Permitido | Proibido |
|-------|----------|---------|
| HttpOnly Cookie | Tokens de auth | — |
| sessionStorage | Dados de UI temporários | Tokens, PII |
| localStorage | Preferências não-sensíveis | Tokens, PII, segredos |
| React State (memory) | Dados da sessão em uso | — |

### XSS
- Frameworks modernos escapam por padrão — nunca usar \`dangerouslySetInnerHTML\` com input externo.
- Sanitizar HTML de terceiros com **DOMPurify** antes de renderizar.
- CSP deve bloquear \`unsafe-inline\` e \`unsafe-eval\`.

### Dependências
\`\`\`bash
npm audit --audit-level=critical  # rodar no CI, falha se CVE crítico
\`\`\``:'';

  const lgpdSection=hasLGPD?`
## 5. LGPD — Checklist de Implementação

- [ ] Mapa de dados PII em \`docs/data-map.md\`
- [ ] Consentimento registrado: userId, timestamp, ipHash, versão do termo
- [ ] Endpoint \`GET /account/export\` → exporta todos os dados do usuário
- [ ] Endpoint \`DELETE /account\` → anonimiza PII, preserva logs de auditoria
- [ ] Prazo de retenção definido por tipo de dado; job de purge automático
- [ ] DPO definido; contato publicado na política de privacidade
- [ ] Contratos DPA assinados com sub-processadores (integrações externas)
- [ ] Prazo de notificação à ANPD: 72h após constatar vazamento de dados`:'';

  const prSection=`
## ${hasLGPD?6:5}. Checklist de Segurança — PR Review

Antes de aprovar qualquer PR com código sensível:

**Autenticação e Sessão**
- [ ] Tokens em HttpOnly cookie (nunca localStorage)
- [ ] Rate limiting implementado nos endpoints de auth
- [ ] Refresh token com rotação e revogação no servidor

**Autorização**
- [ ] Permissões verificadas no servidor (não só no frontend)
- [ ] Ownership de recursos validado por usuário
- [ ] IDs expostos são UUIDs (não sequenciais)

**Entrada e Saída**
- [ ] Todo input validado com schema (Zod/Joi)
- [ ] Erros retornam mensagem genérica ao cliente
- [ ] Queries parametrizadas (sem concatenação de string)
- [ ] Campos de resposta serializados explicitamente (sem retornar objeto completo do ORM)

**Dados e Privacidade**
- [ ] Nenhum dado sensível em logs
- [ ] \`npm audit\` sem CVE crítico

**Infraestrutura**
- [ ] Nenhuma chave/segredo em código ou \`.env\` commitado
- [ ] Headers de segurança configurados
- [ ] TLS 1.2+ obrigatório`;

  const secretsSection=`
## ${hasLGPD?7:6}. Gestão de Segredos

\`\`\`bash
# ✅ Correto
DATABASE_URL → secret manager (Vault / AWS Secrets Manager / GCP Secret Manager)
JWT_PRIVATE_KEY → HSM ou secret manager

# ❌ Proibido
DATABASE_URL=postgres://user:senha@host/db  # nunca em .env commitado
JWT_SECRET=minha-chave                       # nunca hardcoded
\`\`\`

- Adicionar \`.env\` e \`.env.*\` ao \`.gitignore\`.
- Usar **git-secrets** no pre-commit hook.
- Rotacionar segredos imediatamente se houver suspeita de exposição.`;

  const incidentSection=`
## ${hasLGPD?8:7}. Resposta a Incidentes

\`\`\`
1. Detectou anomalia → isolar componente afetado imediatamente
2. Revogar todos os tokens e segredos potencialmente comprometidos
3. Preservar logs para análise forense (NÃO deletar)
4. Notificar usuários afetados${hasLGPD?'\n5. LGPD: notificar ANPD em até 72h se dados pessoais vazaram':''}
${hasLGPD?'6':'5'}. Post-mortem obrigatório: root cause + ações corretivas documentadas
\`\`\``;

  const noChecks=!hasAuth&&!hasRoles&&!hasLGPD&&!hasCrypto&&!hasLogs&&!webArch&&!apiArch;

  return `# SECURITY.md — Contrato de Segurança

> **Segurança não é feature extra — é parte de cada componente.**
> Consulte este arquivo antes de implementar qualquer feature com auth, dados de usuário, pagamento ou integração externa.
> Em caso de conflito entre velocidade e segurança: **segurança prevalece**.

Projeto: **${proj}**

---

## 1. Modelo de Ameaças (Threat Model)

${noChecks?'> [NEEDS CLARIFICATION: Defina os requisitos de segurança na etapa Qualidade & Operação]':
`| Ameaça | Superfície | Severidade | Mitigação |
|--------|-----------|------------|----------|
${threats.join('\n')}`}

---
${authSection}
${apiSection}
${webSection}
${lgpdSection}
${prSection}
${secretsSection}
${incidentSection}
`;
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
  schedPV();
  saveToLocalStorage();
  toast(`Template "${tmpl.label}" carregado!`);
}

// ── FASE 4: ARQUIVOS GITHUB EXTRAS ───────────────────────────
function gPRTemplate(){
  const proj=nc(S.meta.name);
  const phases=S.plan.phases.map((p,i)=>`- [ ] Fase ${i+1}: ${p.name||'[sem nome]'}`).join('\n')||'- [ ] [definir fase no PLAN.md]';
  const secChecks=S.quality.secChecks.length>0
    ? S.quality.secChecks.map(c=>`- [ ] Segurança: ${c} verificado`).join('\n')
    : '';
  return `## Descrição
<!-- O que foi implementado? Referencie a fase do PLAN.md -->

## Tipo de mudança
- [ ] feat: nova funcionalidade
- [ ] fix: correção de bug
- [ ] refactor: refatoração
- [ ] docs: documentação
- [ ] test: testes
- [ ] chore: tarefas de manutenção

## Fase do PLAN.md concluída
${phases}

## Checklist obrigatório (Code Reviewer)
- [ ] /code-review executado sem issues Crítico ou Alto
- [ ] Todos os testes passando (/testar)
- [ ] Sem regressões nos testes existentes
- [ ] SPEC.md e PLAN.md atualizados se necessário
- [ ] Nenhum dado sensível exposto (secrets, tokens, PII)
${secChecks}

## Como testar
<!-- Passos para validar esta PR -->
1.
2.

## Screenshots (se aplicável)
<!-- Antes / Depois -->

## Notas adicionais
<!-- Decisões de design, trade-offs, débito técnico criado -->`;
}

function gBugReport(){
  const proj=nc(S.meta.name);
  const envList=S.quality.envs&&S.quality.envs.length>0
    ? S.quality.envs.map(e=>`- [ ] ${e}`).join('\n')
    : '- [ ] development\n- [ ] staging\n- [ ] production';
  return `---
name: Bug Report
about: Reporte um problema em ${proj}
title: '[BUG] '
labels: bug
assignees: ''
---

## Descrição do Bug
<!-- Uma descrição clara e concisa do que é o bug -->

## Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Preencha '...'
4. Veja o erro

## Comportamento Esperado
<!-- O que deveria acontecer -->

## Comportamento Atual
<!-- O que está acontecendo de fato -->

## Screenshots / Logs
<!-- Se aplicável, adicione screenshots ou logs de erro -->

## Ambiente
**Ambiente afetado:**
${envList}

**Versão / Branch:**
**Sistema Operacional:**
**Navegador (se aplicável):**
**Versão do Node.js (se aplicável):**

## Contexto Adicional
<!-- Qualquer outra informação relevante sobre o problema -->

## Severidade
- [ ] Crítica — sistema inoperante
- [ ] Alta — funcionalidade principal bloqueada
- [ ] Média — workaround existe
- [ ] Baixa — cosmético / minor`;
}

function gFeatureRequest(){
  const proj=nc(S.meta.name);
  return `---
name: Feature Request
about: Sugira uma nova funcionalidade para ${proj}
title: '[FEAT] '
labels: enhancement
assignees: ''
---

## Problema que Resolve
<!-- Qual problema do usuário esta feature endereça? -->
<!-- Ex: "Como usuário, eu preciso de X para poder Y" -->

## Solução Proposta
<!-- Descrição clara da funcionalidade desejada -->

## Alternativas Consideradas
<!-- Outras abordagens que você considerou e por que as descartou -->

## Critério de Pronto
<!-- Como saberemos que esta feature está completa? -->
- [ ]
- [ ]
- [ ]

## Fase do PLAN.md
<!-- Esta feature se encaixa em qual fase existente, ou é nova? -->

## Impacto Estimado
- [ ] Alta prioridade — bloqueia usuários
- [ ] Média prioridade — melhoria significativa de UX
- [ ] Baixa prioridade — nice to have

## Contexto Adicional
<!-- Mockups, exemplos de outros produtos, referências -->`;
}

function gChangelog(){
  if(!S.meta.useGit) return '';
  const name=S.meta.name||'NEEDS CLARIFICATION';
  const phases=S.plan.phases;
  const phaseSections=phases.length
    ? phases.map((ph,i)=>{
        const version=`0.${i+1}.0`;
        const label=ph.name||`Fase ${i+1}`;
        const goal=ph.goal||'NEEDS CLARIFICATION';
        const deadline=ph.deadline?` — ${ph.deadline}`:'';
        const deliverables=ph.deliverables
          ? ph.deliverables.split('\n').filter(Boolean).map(d=>`- ${d.trim()}`).join('\n')
          : '- NEEDS CLARIFICATION';
        return `## [${version}]${deadline}\n### ${label}\n> ${goal}\n\n### Added\n${deliverables}`;
      }).join('\n\n---\n\n')
    : '## [0.1.0]\n### Added\n- NEEDS CLARIFICATION';
  return `# Changelog — ${name}

Todas as mudanças notáveis são documentadas aqui.
Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
Versionamento: [Semantic Versioning](https://semver.org/lang/pt-BR/)

> **Instrução para o Git Master:** a cada PR mergeado, mover os itens concluídos
> de \`[Unreleased]\` para a versão correspondente com a data real de entrega.

***

## [Unreleased]

### Added
### Changed
### Fixed
### Security

***

${phaseSections}
`;}

// Manifesto unificado: cada entrada vira um arquivo no ZIP e uma aba no preview.
// path = caminho final dentro do ZIP (com docs/ ou agents/ quando aplicável).
function getManifest(){
  const m=[
    {path:'START.md',                       gen:gStart},
    {path:'CLAUDE.md',                      gen:gClaude},
    {path:'docs/01-product-spec.md',        gen:gSpec},
    {path:'docs/02-architecture.md',        gen:gArchitecture},
    {path:'docs/03-roadmap.md',             gen:gPlan},
    {path:'docs/04-security.md',            gen:gSecurity},
    {path:'docs/05-rules.md',               gen:gRules},
    {path:'docs/06-hooks.md',               gen:gHooks},
    {path:'docs/07-slash-commands.md',      gen:gCmds},
  ];
  if(S.meta.useGit===true){
    m.push({path:'docs/08-changelog.md', gen:gChangelog});
  }
  // Um arquivo por agente ativo, em /agents/<slug>.md
  for(const ag of S.agents.list){
    const slug=slugifyAgent(ag);
    m.push({path:`agents/${slug}.md`, gen:()=>gAgentFile(ag)});
  }
  if(S.meta.useGit===true){
    m.push({path:'.github/pull_request_template.md',          gen:gPRTemplate});
    m.push({path:'.github/ISSUE_TEMPLATE/bug_report.md',      gen:gBugReport});
    m.push({path:'.github/ISSUE_TEMPLATE/feature_request.md', gen:gFeatureRequest});
  }
  return m;
}

function getActiveFiles(){return getManifest().map(e=>e.path);}
function getActiveGens(){return getManifest().map(e=>e.gen);}

// ── URL HASH (compartilhar via link, sob demanda) ─────────────
function stateToHash(){
  try{
    const json=JSON.stringify(S);
    const compressed=LZString.compressToEncodedURIComponent(json);
    window.location.hash='v1='+compressed;
  }catch(err){}
}

function hashToState(){
  try{
    const h=window.location.hash;
    if(!h||!h.startsWith('#v1=')) return false;
    const compressed=h.slice(4);
    const json=LZString.decompressFromEncodedURIComponent(compressed);
    if(!json) return false;
    const parsed=JSON.parse(json);
    Object.assign(S,parsed);
    return true;
  }catch(err){return false;}
}


// ── BOOT ──────────────────────────────────────────────────────
init();
