import React, { useState, useEffect, useRef, useCallback } from 'react'
import { loginUser } from './api/auth';
import { getEmployees, createEmployee, deleteEmployee } from './api/employees';

const h = React.createElement;

// ─── DATA ──────────────────────────────────────────────────────────
const EMPLOYEES=[
  {id:1,name:'Rahul Sharma',email:'rahul@nexacorp.io',role:'employee',dept:'Engineering',designation:'Senior Developer',avatar:'RS',color:'#6e8efb',score:92,status:'online',hrs:'7h 20m',idle:'12m',tasks:8,done:6},
  {id:2,name:'Priya Patel',email:'priya@nexacorp.io',role:'employee',dept:'Design',designation:'UI/UX Designer',avatar:'PP',color:'#a78bfa',score:88,status:'online',hrs:'6h 45m',idle:'18m',tasks:5,done:4},
  {id:3,name:'Akash Mehta',email:'akash@nexacorp.io',role:'employee',dept:'Engineering',designation:'Junior Developer',avatar:'AM',color:'#10d9a0',score:76,status:'idle',hrs:'5h 10m',idle:'45m',tasks:7,done:3},
  {id:4,name:'Sneha Reddy',email:'sneha@nexacorp.io',role:'employee',dept:'Human Resources',designation:'HR Manager',avatar:'SR',color:'#f59e3f',score:95,status:'online',hrs:'8h 00m',idle:'5m',tasks:4,done:4},
  {id:5,name:'Dev Kumar',email:'dev@nexacorp.io',role:'employee',dept:'Marketing',designation:'Marketing Lead',avatar:'DK',color:'#ff5e7a',score:81,status:'offline',hrs:'3h 20m',idle:'0m',tasks:6,done:2},
];
const ADMIN={id:0,name:'Arjun Verma',email:'admin@nexacorp.io',role:'admin',dept:'Management',designation:'System Administrator',avatar:'AV',color:'#10d9a0'};
const TASKS=[
  {id:1,title:'Implement OAuth 2.0 Authentication',project:'Auth System',priority:'high',status:'ongoing',due:'2026-05-16',assignee:1},
  {id:2,title:'Redesign Dashboard Interface',project:'UI Overhaul',priority:'medium',status:'completed',due:'2026-05-14',assignee:2},
  {id:3,title:'Fix Critical API Timeout Bug',project:'Backend',priority:'high',status:'not_started',due:'2026-05-15',assignee:3},
  {id:4,title:'Write Onboarding Documentation',project:'Documentation',priority:'low',status:'ongoing',due:'2026-05-18',assignee:1},
  {id:5,title:'Q2 Performance Review',project:'HR Operations',priority:'high',status:'ongoing',due:'2026-05-17',assignee:4},
  {id:6,title:'SEO Keyword Optimization',project:'Marketing',priority:'medium',status:'not_started',due:'2026-05-20',assignee:5},
  {id:7,title:'Database Query Optimization',project:'Backend',priority:'high',status:'delayed',due:'2026-05-13',assignee:3},
  {id:8,title:'Mobile Responsive Fixes',project:'UI Overhaul',priority:'medium',status:'under_review',due:'2026-05-15',assignee:2},
];
const APPS_DATA=[
  {name:'VS Code',icon:'💻',time:'3h 20m',pct:42,cat:'productive'},
  {name:'Chrome',icon:'🌐',time:'2h 10m',pct:28,cat:'neutral'},
  {name:'Slack',icon:'💬',time:'55m',pct:11,cat:'productive'},
  {name:'Figma',icon:'🎨',time:'40m',pct:8,cat:'productive'},
  {name:'YouTube',icon:'📺',time:'25m',pct:5,cat:'distracting'},
  {name:'Gmail',icon:'✉️',time:'18m',pct:4,cat:'neutral'},
  {name:'Games',icon:'🎮',time:'8m',pct:2,cat:'distracting'},
];
const LEAVE_REQUESTS=[
  {id:1,emp:'Akash Mehta',type:'Sick Leave',from:'2026-05-18',to:'2026-05-19',reason:'Fever and fatigue',status:'pending'},
  {id:2,emp:'Dev Kumar',type:'Annual Leave',from:'2026-05-22',to:'2026-05-24',reason:'Family vacation',status:'pending'},
  {id:3,emp:'Priya Patel',type:'Casual Leave',from:'2026-05-16',to:'2026-05-16',reason:'Personal work',status:'approved'},
];
const NOTIFS=[
  {id:1,text:'Akash Mehta has been idle for 45 minutes — review required',type:'warn',time:'5m ago'},
  {id:2,text:'Task "DB Query Optimization" is 2 days overdue',type:'red',time:'1h ago'},
  {id:3,text:'New leave request submitted by Akash Mehta',type:'blue',time:'2h ago'},
  {id:4,text:'Dev Kumar logged out 4 hours early today',type:'warn',time:'3h ago'},
  {id:5,text:'Monthly productivity report is ready to download',type:'green',time:'4h ago'},
];

// ─── UTILS ─────────────────────────────────────────────────────────
function scoreColor(s){return s>=90?'var(--success)':s>=75?'var(--accent3)':s>=60?'var(--warn)':'var(--danger)'}
function statusChip(s){const m={ongoing:'blue',completed:'green',not_started:'gray',delayed:'red',under_review:'amber'};return m[s]||'gray'}
function priorityChip(p){return p==='high'?'red':p==='medium'?'amber':'green'}

// ─── MINI BAR CHART ────────────────────────────────────────────────
function MiniBarChart({data,color='var(--accent)'}){
  const max=Math.max(...data);
  return h('div',{style:{display:'flex',alignItems:'flex-end',gap:3,height:52}},
    data.map((v,i)=>h('div',{key:i,style:{flex:1,height:`${(v/max)*100}%`,background:color,borderRadius:'3px 3px 0 0',opacity:.5+.5*(i/data.length),transition:'.3s'}}))
  );
}
function MiniLineChart({data,color='var(--accent)'}){
  const w=200,h2=50,max=Math.max(...data),min=Math.min(...data);
  const pts=data.map((v,i)=>[i*(w/(data.length-1)),(1-(v-min)/(max-min||1))*(h2-8)+4]);
  const d2=pts.map((p,i)=>(i===0?'M':'L')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  return h('svg',{width:'100%',height:h2,viewBox:`0 0 ${w} ${h2}`},
    h('defs',null,h('linearGradient',{id:'lineGrad',x1:'0',y1:'0',x2:'1',y2:'0'},h('stop',{offset:'0%',stopColor:color}),h('stop',{offset:'100%',stopColor:'var(--accent3)'}))),
    h('polyline',{points:pts.map(p=>p.join(',')).join(' '),fill:'none',stroke:'url(#lineGrad)',strokeWidth:2.5,strokeLinecap:'round',strokeLinejoin:'round'}),
    pts.map((p,i)=>h('circle',{key:i,cx:p[0],cy:p[1],r:2.5,fill:color}))
  );
}

// ─── SCORE RING ────────────────────────────────────────────────────
function ScoreRing({score,size=60}){
  const r=size/2-5,c=2*Math.PI*r,dash=c*score/100;
  const col=scoreColor(score);
  return h('div',{className:'score-ring',style:{width:size,height:size}},
    h('svg',{width:size,height:size},
      h('circle',{cx:size/2,cy:size/2,r,fill:'none',stroke:'var(--border)',strokeWidth:3}),
      h('circle',{cx:size/2,cy:size/2,r,fill:'none',stroke:col,strokeWidth:3,strokeDasharray:`${dash} ${c}`,strokeLinecap:'round',transform:`rotate(-90 ${size/2} ${size/2})`})
    ),
    h('span',{className:'score-val',style:{fontSize:Math.max(size/4.5,9),color:col}},score)
  );
}

// ─── LOGIN ─────────────────────────────────────────────────────────
function LoginPage({onLogin}){
  const [tab,setTab]=useState('admin');
  const [email,setEmail]=useState('');
  const [pass,setPass]=useState('');
  const [err,setErr]=useState('');

  async function tryLogin() {

    try {

        const response = await loginUser({
            email,
            password: pass
        });

        const data = response.data;

        localStorage.setItem('token', data.token);

        localStorage.setItem('user', JSON.stringify(data.user));

        onLogin(data.user);

        setErr('');

        alert('Login Successful');

    } catch (error) {

        console.log(error);

        setErr('Invalid Credentials');
    }
}async function tryLogin() {

    try {

        const response = await loginUser({
            email,
            password: pass
        });

        const data = response.data;

        localStorage.setItem('token', data.token);

        localStorage.setItem('user', JSON.stringify(data.user));

        onLogin(data.user);

        setErr('');

        alert('Login Successful');

    } catch (error) {

        console.log(error);

        setErr('Invalid Credentials');
    }
}
  return h('div',{className:'login-page'},
    h('div',{className:'login-box'},
      h('div',{className:'brand'},
        h('div',{className:'brand-logo'},'⬡'),
        h('h1',null,'NexaWork'),
        h('p',null,'Workforce Intelligence Platform')
      ),
      h('div',{className:'tab-row'},
        h('button',{className:'tab-btn '+(tab==='admin'?'active':''),onClick:()=>{setTab('admin');setErr('')}},'Admin / HR'),
        h('button',{className:'tab-btn '+(tab==='employee'?'active':''),onClick:()=>{setTab('employee');setErr('')}},'Employee')
      ),
      h('div',{className:'field'},
        h('label',null,'Email Address'),
        h('input',{type:'email',placeholder:tab==='admin'?'admin@nexacorp.io':'rahul@nexacorp.io',value:email,onChange:e=>setEmail(e.target.value)})
      ),
      h('div',{className:'field'},
        h('label',null,'Password'),
        h('input',{type:'password',placeholder:'Enter your password',value:pass,onChange:e=>setPass(e.target.value),onKeyDown:e=>e.key==='Enter'&&tryLogin()})
      ),
      err&&h('div',{className:'err-msg'},err),
      h('button',{className:'login-btn',onClick:tryLogin},'Sign In to NexaWork →'),
      h('div',{className:'demo-hint'},
        h('div',{style:{fontSize:11,color:'var(--accent)',fontWeight:700,marginBottom:4,textTransform:'uppercase',letterSpacing:'.5px'}},'Demo Credentials'),
        tab==='admin'
          ?h('span',null,'admin@nexacorp.io  ·  admin123')
          :h('span',null,'rahul@nexacorp.io  ·  emp123')
      )
    )
  );
}

// ─── SHELL ─────────────────────────────────────────────────────────
function Shell({user,onLogout,children,page,setPage,notifCount}){
  const isAdmin=user.role==='admin'||user.role==='hr';
  const adminNav=[
    {id:'dashboard',icon:'⊞',label:'Dashboard'},
    {id:'employees',icon:'◉',label:'Employees'},
    {id:'monitoring',icon:'◎',label:'Live Monitor'},
    {id:'tasks',icon:'◻',label:'Tasks'},
    {id:'attendance',icon:'▦',label:'Attendance'},
    {id:'leaves',icon:'◈',label:'Leave Management'},
    {id:'analytics',icon:'◗',label:'Analytics'},
    {id:'payroll',icon:'◆',label:'Payroll'},
    {id:'ai_insights',icon:'✦',label:'AI Insights'},
  ];
  const empNav=[
    {id:'emp_dashboard',icon:'⊞',label:'My Dashboard'},
    {id:'emp_tasks',icon:'◻',label:'My Tasks'},
    {id:'emp_attendance',icon:'▦',label:'Attendance'},
    {id:'emp_leaves',icon:'◈',label:'Leave Request'},
    {id:'emp_apps',icon:'◉',label:'App Usage'},
    {id:'emp_reports',icon:'✦',label:'My Reports'},
  ];
  const nav=isAdmin?adminNav:empNav;
  const pageTitle={
    dashboard:'Admin Dashboard',employees:'Employee Management',monitoring:'Live Monitoring',
    tasks:'Task Management',attendance:'Attendance Records',leaves:'Leave Management',
    analytics:'Team Analytics',payroll:'Payroll Processing',ai_insights:'AI Insights',
    emp_dashboard:'My Dashboard',emp_tasks:'My Tasks',emp_attendance:'Attendance',
    emp_leaves:'Leave Request',emp_apps:'App & Web Usage',emp_reports:'My Reports'
  };
  return h('div',{className:'shell'},
    h('div',{className:'sidebar'},
      h('div',{className:'sidebar-brand'},
        h('div',{className:'sidebar-logo'},'⬡'),
        h('span',null,'NexaWork')
      ),
      h('div',{className:'sidebar-nav'},
        h('div',{className:'nav-section'},isAdmin?'Management':'Employee'),
        nav.map(n=>h('div',{key:n.id,className:'nav-item '+(page===n.id?'active':''),onClick:()=>setPage(n.id)},
          h('span',{className:'icon',style:{fontSize:13,fontWeight:700,color:page===n.id?'var(--accent)':'var(--text3)'}},n.icon),
          h('span',null,n.label)
        ))
      ),
      h('div',{className:'sidebar-footer'},
        h('div',{className:'user-card'},
          h('div',{className:'avatar',style:{background:user.color+'25',color:user.color,border:`2px solid ${user.color}40`}},user.avatar),
          h('div',{className:'user-info'},
            h('div',{className:'user-name'},user.name.split(' ')[0]+' '+user.name.split(' ').pop()[0]+'.'),
            h('div',{className:'user-role'},user.designation||user.role)
          ),
          h('button',{className:'logout-btn',onClick:onLogout,title:'Sign Out'},'⏻')
        )
      )
    ),
    h('div',{className:'main'},
      h('div',{className:'topbar'},
        h('h2',null,pageTitle[page]||'NexaWork'),
        h('div',{style:{flex:1,fontSize:11,color:'var(--text3)',fontWeight:500,marginLeft:8}},
          'Monday, 18 May 2026'
        ),
        h('div',{className:'topbar-actions'},
          h('div',{className:'icon-btn',onClick:()=>setPage(isAdmin?'ai_insights':'emp_reports'),title:'AI Assistant',style:{fontSize:13,fontWeight:700,color:'var(--accent)'}},'✦'),
          h('div',{className:'icon-btn',style:{position:'relative'}},
            '🔔',
            notifCount>0&&h('span',{className:'badge',style:{position:'absolute',top:-5,right:-5}},notifCount)
          ),
          h('div',{className:'avatar',style:{width:34,height:34,background:user.color+'25',color:user.color,border:`2px solid ${user.color}40`,fontSize:11,fontWeight:800,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'default'}},user.avatar)
        )
      ),
      h('div',{className:'content'},children)
    )
  );
}

// ─── ADMIN DASHBOARD ───────────────────────────────────────────────
function AdminDashboard(){
  const online=EMPLOYEES.filter(e=>e.status==='online').length;
  const idle=EMPLOYEES.filter(e=>e.status==='idle').length;
  const avgScore=Math.round(EMPLOYEES.reduce((a,e)=>a+e.score,0)/EMPLOYEES.length);
  const tasksDone=TASKS.filter(t=>t.status==='completed').length;
  const heatData=Array.from({length:35},()=>Math.floor(Math.random()*5));
  return h('div',null,
    h('div',{className:'stat-grid'},
      h('div',{className:'stat-card teal'},
        h('div',{className:'stat-icon'},'👥'),
        h('div',{className:'stat-val',style:{color:'var(--accent)'}},EMPLOYEES.length),
        h('div',{className:'stat-label'},'Total Employees'),
        h('div',{className:'stat-trend',style:{color:'var(--accent)'}},'↑ 2 new this month')
      ),
      h('div',{className:'stat-card blue'},
        h('div',{className:'stat-icon'},'🟢'),
        h('div',{className:'stat-val',style:{color:'var(--accent3)'}},online),
        h('div',{className:'stat-label'},'Online Right Now'),
        h('div',{className:'stat-trend',style:{color:'var(--text3)'}},`${idle} idle · ${EMPLOYEES.length-online-idle} offline`)
      ),
      h('div',{className:'stat-card amber'},
        h('div',{className:'stat-icon'},'⭐'),
        h('div',{className:'stat-val',style:{color:'var(--accent2)'}},avgScore+'%'),
        h('div',{className:'stat-label'},'Avg Productivity'),
        h('div',{className:'stat-trend',style:{color:'var(--success)'}},'↑ 3.2% vs last week')
      ),
      h('div',{className:'stat-card danger'},
        h('div',{className:'stat-icon'},'✅'),
        h('div',{className:'stat-val',style:{color:'var(--danger)'}},tasksDone+'/'+TASKS.length),
        h('div',{className:'stat-label'},'Tasks Completed'),
        h('div',{className:'stat-trend',style:{color:'var(--danger)'}},'2 tasks overdue')
      )
    ),
    h('div',{className:'grid-2'},
      h('div',{className:'section'},
        h('div',{className:'section-head'},
          h('h3',null,'Team Live Status'),
          h('span',{className:'live-badge'},'● Live')
        ),
        h('div',{className:'section-body'},
          EMPLOYEES.map(e=>h('div',{key:e.id,style:{display:'flex',alignItems:'center',gap:12,padding:'11px 0',borderBottom:'1px solid var(--border)40'}},
            h('div',{className:'avatar',style:{width:34,height:34,background:e.color+'25',color:e.color,border:`2px solid ${e.color}40`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}},e.avatar),
            h('div',{style:{flex:1}},
              h('div',{style:{fontSize:13,fontWeight:700}},e.name),
              h('div',{style:{fontSize:11,color:'var(--text3)',marginTop:2,fontWeight:500}},e.designation+' · '+e.hrs)
            ),
            h('span',{className:'pulse '+(e.status||'offline')}),
            h(ScoreRing,{score:e.score,size:42})
          ))
        )
      ),
      h('div',{className:'section'},
        h('div',{className:'section-head'},h('h3',null,'Notifications '),h('span',{className:'section-badge'},NOTIFS.length)),
        h('div',{className:'section-body'},
          NOTIFS.slice(0,4).map(n=>h('div',{key:n.id,className:'notif'},
            h('div',{className:'notif-dot',style:{background:n.type==='warn'?'var(--warn)':n.type==='red'?'var(--danger)':n.type==='blue'?'var(--accent3)':'var(--success)'}}),
            h('div',{style:{flex:1}},
              h('div',{style:{fontSize:12,lineHeight:1.5,fontWeight:500}},n.text),
              h('div',{style:{fontSize:11,color:'var(--text3)',marginTop:3,fontFamily:'var(--mono)'}},n.time)
            )
          ))
        )
      )
    ),
    h('div',{className:'section'},
      h('div',{className:'section-head'},h('h3',null,'Weekly Productivity Trend')),
      h('div',{className:'section-body'},
        h('div',{style:{display:'flex',gap:16}},
          EMPLOYEES.map(e=>h('div',{key:e.id,style:{flex:1,textAlign:'center'}},
            h(MiniBarChart,{data:[78,82,79,88,85,e.score,e.score-2],color:e.color}),
            h('div',{style:{fontSize:11,color:'var(--text3)',marginTop:8,fontWeight:500}},e.name.split(' ')[0]),
            h('div',{style:{fontSize:12,fontWeight:800,color:scoreColor(e.score),fontFamily:'var(--mono)'}},e.score+'%')
          ))
        )
      )
    ),
    h('div',{className:'section'},
      h('div',{className:'section-head'},h('h3',null,'Activity Heatmap',' ',h('span',null,'last 5 weeks'))),
      h('div',{className:'section-body'},
        h('div',{style:{display:'flex',gap:4,marginBottom:10}},
          ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>h('div',{key:d,style:{flex:1,fontSize:10,color:'var(--text3)',textAlign:'center',fontWeight:700,textTransform:'uppercase',letterSpacing:'.4px'}},d))
        ),
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}},
          heatData.map((v,i)=>{
            const colors=['var(--border)','#10d9a025','#10d9a050','#10d9a080','var(--success)'];
            return h('div',{key:i,className:'hm-cell',style:{background:colors[v],border:'1px solid var(--border)40'},title:`${v} activity hours`});
          })
        )
      )
    )
  );
}

// ─── EMPLOYEE TABLE ────────────────────────────────────────────────
function EmployeesPage({employees=[]}){
  const [sel,setSel]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [search,setSearch]=useState('');
  const [newName,setNewName] = useState('');
  const [newEmail,setNewEmail] = useState('');
  const [newDept,setNewDept] = useState('');
  const [newRole,setNewRole] = useState('');
  const filtered = employees.filter((e) =>
    (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase())
);
async function addEmployee(){

    try{

        const employeeData = {

            name:newName,
            email:newEmail,
            department:newDept,
            designation:newRole,

            status:'active',
            score:80,
            hrs:'0h',
            idle:'-',
            avatar:newName.substring(0,2).toUpperCase(),
            color:'#10d9a0'
        };

        const response = await createEmployee(employeeData);

        console.log(response.data);

        alert('Employee Added Successfully');

        window.location.reload();

    }catch(error){

        console.log(error);

        alert('Failed to add employee');
    }
}
async function removeEmployee(id){

    try{

        await deleteEmployee(id);

        alert('Employee Removed');

        window.location.reload();

    }catch(error){

        console.log(error);

        alert('Delete Failed');
    }
}
  return h('div',null,
    h('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:18,gap:12}},
      h('div',{style:{position:'relative',flex:1,maxWidth:320}},
        h('span',{style:{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',fontSize:14}},'🔍'),
        h('input',{className:'form-input',placeholder:'Search employees or departments...',style:{paddingLeft:36},value:search,onChange:e=>setSearch(e.target.value)})
      ),
      h('button',{className:'submit-btn',onClick:()=>setShowAdd(true)},'+ Add Employee')
    ),
    showAdd && h('div',{
    className:'section',
    style:{marginBottom:20}
},

    h('h3',null,'Add Employee'),

    h('input',{
        className:'form-input',
        placeholder:'Employee Name',
        value:newName,
        onChange:e=>setNewName(e.target.value)
    }),

    h('input',{
        className:'form-input',
        placeholder:'Email',
        value:newEmail,
        onChange:e=>setNewEmail(e.target.value)
    }),

    h('input',{
        className:'form-input',
        placeholder:'Department',
        value:newDept,
        onChange:e=>setNewDept(e.target.value)
    }),

    h('input',{
        className:'form-input',
        placeholder:'Designation',
        value:newRole,
        onChange:e=>setNewRole(e.target.value)
    }),

    h('button',{
        className:'submit-btn',
        style:{marginTop:12},
        onClick:addEmployee
        },'Save Employee')
),
  showAdd && h('div',{
    className:'section',
    style:{marginBottom:20}
},

    h('div',{className:'section-head'},
        h('h3',null,'Add Employee')
    ),

    h('input',{
        className:'form-input',
        placeholder:'Employee Name',
        value:newName,
        onChange:e=>setNewName(e.target.value)
    }),

    h('input',{
        className:'form-input',
        placeholder:'Employee Email',
        value:newEmail,
        onChange:e=>setNewEmail(e.target.value)
    }),

    h('input',{
        className:'form-input',
        placeholder:'Department',
        value:newDept,
        onChange:e=>setNewDept(e.target.value)
    }),

    h('input',{
        className:'form-input',
        placeholder:'Designation',
        value:newRole,
        onChange:e=>setNewRole(e.target.value)
    }),

    h('button',{
        className:'submit-btn',
        style:{marginTop:12},
        onClick:addEmployee
    },'Save Employee')
),
    h('div',{className:'section'},
      h('div',{className:'section-head'},h('h3',null,'All Employees'),h('span',{className:'section-badge'},filtered.length+' records')),
      h('div',{className:'table-wrap'},
        h('table',null,
          h('thead',null,h('tr',null,
            ['Employee','Department','Status','Hours Today','Productivity','Idle Time','Actions'].map(c=>h('th',{key:c},c))
          )),
          h('tbody',null,
            filtered.map(e=>h('tr',{key:e.id},
              h('td',null,h('div',{className:'flex'},
                h('div',{className:'emp-avatar',style:{background:e.color+'25',color:e.color,border:`2px solid ${e.color}35`}},e.avatar),
                h('div',null,
                  h('div',{style:{fontWeight:700,fontSize:13}},e.name),
                  h('div',{style:{fontSize:11,color:'var(--text3)',marginTop:1,fontWeight:500}},e.email)
                )
              )),
              h('td',null,h('span',{style:{fontSize:13,color:'var(--text2)',fontWeight:500}},e.department)),
              h('td',null,h('span',{className:'flex',style:{gap:7}},
                h('span',{className:'pulse '+(e.status||'offline')}),
                h('span',{style:{fontSize:12,fontWeight:600,color:e.status==='online'?'var(--success)':e.status==='idle'?'var(--warn)':'var(--text3)'}},e.status)
              )),
              h('td',null,h('span',{style:{fontFamily:'var(--mono)',fontSize:12,fontWeight:500,color:'var(--text2)'}},e.hrs)),
              h('td',null,h('div',{style:{minWidth:100}},
                h('div',{style:{fontSize:13,fontWeight:800,color:scoreColor(e.score),fontFamily:'var(--mono)'}},e.score+'%'),
                h('div',{className:'prog-bar',style:{marginTop:5}},h('div',{className:'prog-fill',style:{width:e.score+'%',background:scoreColor(e.score)}}))
              )),
              h('td',null,h('span',{style:{fontFamily:'var(--mono)',fontSize:12,color:'var(--text3)',fontWeight:500}},e.idle||'—')),
              h('td',null,h('div',{style:{display:'flex',gap:7}},
                h('button',{className:'submit-btn',style:{padding:'5px 14px',fontSize:11},onClick:()=>setSel(e)},'View Profile'),
               h('button',{
    style:{
        padding:'5px 14px',
        background:'var(--danger)15',
        color:'var(--danger)',
        border:'1px solid var(--danger)30',
        borderRadius:7,
        cursor:'pointer',
        fontSize:11,
        fontWeight:700,
        fontFamily:'var(--font)'
    },
    onClick:()=>removeEmployee(e._id)
},'Remove')
              ))
            ))
          )
        )
      )
    ),
    sel&&h('div',{className:'modal-overlay',onClick:()=>setSel(null)},
      h('div',{className:'modal',onClick:e=>e.stopPropagation()},
        h('div',{className:'modal-head'},h('h3',null,'Employee Profile'),h('button',{className:'close-btn',onClick:()=>setSel(null)},'✕')),
        h('div',{className:'modal-body'},
          h('div',{style:{textAlign:'center',marginBottom:24}},
            h('div',{style:{width:72,height:72,borderRadius:'50%',background:sel.color+'25',color:sel.color,border:`3px solid ${sel.color}50`,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:800,marginBottom:14}},sel.avatar),
            h('div',{style:{fontSize:20,fontWeight:800,letterSpacing:'-.4px'}},sel.name),
            h('div',{style:{color:'var(--text3)',fontSize:13,marginTop:4,fontWeight:500}},sel.designation+' · '+sel.department),
            h('div',{style:{marginTop:10,display:'flex',justifyContent:'center'}},h(ScoreRing,{score:sel.score,size:80}))
          ),
          h('div',{style:{background:'var(--bg2)',borderRadius:12,padding:'4px 0',border:'1px solid var(--border)'}},
            [['Email',sel.email],['Status',sel.status],['Hours Today',sel.hrs],['Tasks Progress',sel.done+'/'+sel.tasks+' completed'],['Idle Time',sel.idle||'—']].map(([k,v])=>
              h('div',{key:k,style:{display:'flex',justifyContent:'space-between',padding:'11px 16px',borderBottom:'1px solid var(--border)40',fontSize:13}},
                h('span',{style:{color:'var(--text3)',fontWeight:500}},k),
                h('span',{style:{fontWeight:700,color:'var(--text)'}},v)
              )
            )
          )
        )
      )
    ),
    showAdd&&h('div',{className:'modal-overlay',onClick:()=>setShowAdd(false)},
      h('div',{className:'modal',onClick:e=>e.stopPropagation()},
        h('div',{className:'modal-head'},h('h3',null,'Add New Employee'),h('button',{className:'close-btn',onClick:()=>setShowAdd(false)},'✕')),
        h('div',{className:'modal-body'},
          h('div',{className:'form-row'},h('div',null,h('label',{className:'form-label'},'Full Name'),h('input',{className:'form-input',placeholder:'e.g. Arjun Kumar'})),h('div',null,h('label',{className:'form-label'},'Email Address'),h('input',{className:'form-input',placeholder:'arjun@nexacorp.io',type:'email'}))),
          h('div',{className:'form-row'},h('div',null,h('label',{className:'form-label'},'Department'),h('select',{className:'form-select'},['Engineering','Design','Human Resources','Marketing','Finance'].map(d=>h('option',{key:d},d)))),h('div',null,h('label',{className:'form-label'},'Designation'),h('input',{className:'form-input',placeholder:'e.g. Senior Developer'}))),
          h('button',{className:'submit-btn',style:{width:'100%',marginTop:10,padding:13},onClick:()=>setShowAdd(false)},'Add Employee to Team')
        )
      )
    )
  );
}

// ─── LIVE MONITOR ──────────────────────────────────────────────────
function LiveMonitor(){
  const [tick,setTick]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setTick(x=>x+1),5000);return()=>clearInterval(t)},[]);
  return h('div',null,
    h('div',{className:'stat-grid'},
      [{v:EMPLOYEES.filter(e=>e.status==='online').length,l:'Active Now',c:'var(--success)',icon:'🟢'},
       {v:EMPLOYEES.filter(e=>e.status==='idle').length,l:'Idle',c:'var(--warn)',icon:'🟡'},
       {v:EMPLOYEES.filter(e=>e.status==='offline').length,l:'Offline',c:'var(--text3)',icon:'⚫'},
       {v:TASKS.filter(t=>t.status==='ongoing').length,l:'Tasks In Progress',c:'var(--accent3)',icon:'⚡'}].map(({v,l,c,icon})=>
        h('div',{key:l,className:'stat-card teal'},
          h('div',{className:'stat-icon'},icon),
          h('div',{className:'stat-val',style:{color:c,fontFamily:'var(--mono)'}},v),
          h('div',{className:'stat-label'},l)
        )
      )
    ),
    h('div',{className:'section'},
      h('div',{className:'section-head'},
        h('h3',null,'Real-Time Employee Monitor'),
        h('span',{className:'live-badge'},'● Updates every 5s')
      ),
      h('div',{className:'section-body'},
        EMPLOYEES.map(e=>h('div',{key:e.id,style:{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:18,marginBottom:12,transition:'.2s',borderLeft:`3px solid ${e.status==='online'?'var(--success)':e.status==='idle'?'var(--warn)':'var(--text3)'}`}},
          h('div',{style:{display:'flex',alignItems:'center',gap:14,marginBottom:14}},
            h('div',{className:'avatar',style:{width:40,height:40,background:e.color+'25',color:e.color,border:`2px solid ${e.color}40`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,flexShrink:0}},e.avatar),
            h('div',{style:{flex:1}},
              h('div',{style:{fontWeight:700,fontSize:14}},e.name),
              h('div',{style:{fontSize:12,color:'var(--text3)',fontWeight:500,marginTop:2}},e.designation+' · '+e.dept)
            ),
            h('span',{className:'chip '+(e.status==='online'?'green':e.status==='idle'?'warn':'gray')},
              h('span',{className:'pulse '+(e.status||'offline')}),e.status
            )
          ),
          h('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}},
            [{l:'Hours',v:e.hrs},{l:'Score',v:e.score+'%'},{l:'Idle',v:e.idle||'0m'},{l:'Tasks',v:e.done+'/'+e.tasks}].map(({l,v})=>
              h('div',{key:l,style:{textAlign:'center',background:'var(--bg3)',borderRadius:9,padding:'10px 6px',border:'1px solid var(--border)'}},
                h('div',{style:{fontSize:15,fontWeight:800,color:'var(--accent)',fontFamily:'var(--mono)'}},v),
                h('div',{style:{fontSize:10,color:'var(--text3)',marginTop:2,fontWeight:700,textTransform:'uppercase',letterSpacing:'.4px'}},l)
              )
            )
          ),
          h('div',{style:{marginTop:12,fontSize:12,color:'var(--text3)',display:'flex',gap:8,flexWrap:'wrap'}},
            APPS_DATA.slice(0,3).map((a,i)=>h('span',{key:i,style:{background:'var(--bg3)',padding:'4px 10px',borderRadius:20,border:'1px solid var(--border)',fontWeight:500}},a.icon+' '+a.name+' · '+a.time))
          )
        ))
      )
    )
  );
}

// ─── TASKS PAGE ────────────────────────────────────────────────────
function TasksPage({myOnly,userId}){
  const [tasks,setTasks]=useState(TASKS);
  const [filter,setFilter]=useState('all');
  const [showAdd,setShowAdd]=useState(false);
  const filtered=tasks.filter(t=>{
    if(myOnly&&t.assignee!==userId)return false;
    if(filter==='all')return true;
    return t.status===filter;
  });
  function toggle(id){setTasks(ts=>ts.map(t=>t.id===id?{...t,status:t.status==='completed'?'ongoing':'completed'}:t))}
  return h('div',null,
    h('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:18,alignItems:'center'}},
      h('div',{className:'tab-nav',style:{marginBottom:0,border:'none',padding:0}},
        ['all','ongoing','completed','delayed','not_started'].map(f=>
          h('button',{key:f,className:'tn '+(filter===f?'active':''),onClick:()=>setFilter(f)},f.replace('_',' '))
        )
      ),
      !myOnly&&h('button',{className:'submit-btn',onClick:()=>setShowAdd(true)},'+ New Task')
    ),
    h('div',{className:'task-list'},
      filtered.length===0?h('div',{className:'empty-state'},'No tasks found for this filter.'):
      filtered.map(t=>{
        const emp=EMPLOYEES.find(e=>e.id===t.assignee);
        return h('div',{key:t.id,className:'task-item'},
          h('div',{className:'task-check '+(t.status==='completed'?'done':''),onClick:()=>toggle(t.id)},
            t.status==='completed'&&'✓'
          ),
          h('div',{className:'task-meta'},
            h('div',{className:'task-title '+(t.status==='completed'?'done':'')},t.title),
            h('div',{className:'task-sub'},t.project+' · Due: '+t.due+(emp?' · '+emp.name:''))
          ),
          h('div',{className:'task-actions'},
            h('span',{className:'chip '+priorityChip(t.priority)},t.priority),
            h('span',{className:'chip '+statusChip(t.status)},t.status.replace(/_/g,' '))
          )
        );
      })
    ),
    showAdd&&h('div',{className:'modal-overlay',onClick:()=>setShowAdd(false)},
      h('div',{className:'modal',onClick:e=>e.stopPropagation()},
        h('div',{className:'modal-head'},h('h3',null,'Create New Task'),h('button',{className:'close-btn',onClick:()=>setShowAdd(false)},'✕')),
        h('div',{className:'modal-body'},
          h('div',{className:'form-row full'},h('div',null,h('label',{className:'form-label'},'Task Title'),h('input',{className:'form-input',placeholder:'e.g. Build REST API endpoint'}))),
          h('div',{className:'form-row'},
            h('div',null,h('label',{className:'form-label'},'Project'),h('input',{className:'form-input',placeholder:'Project name'})),
            h('div',null,h('label',{className:'form-label'},'Assign To'),h('select',{className:'form-select'},EMPLOYEES.map(e=>h('option',{key:e.id,value:e.id},e.name))))
          ),
          h('div',{className:'form-row'},
            h('div',null,h('label',{className:'form-label'},'Priority'),h('select',{className:'form-select'},[h('option',null,'high'),h('option',null,'medium'),h('option',null,'low')])),
            h('div',null,h('label',{className:'form-label'},'Due Date'),h('input',{className:'form-input',type:'date'}))
          ),
          h('button',{className:'submit-btn',style:{width:'100%',marginTop:10,padding:13},onClick:()=>setShowAdd(false)},'Create Task')
        )
      )
    )
  );
}

// ─── ATTENDANCE ────────────────────────────────────────────────────
function AttendancePage(){
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const statuses=['present','present','present','absent','present','leave','empty','present','present','present','present','absent','empty','empty'];
  return h('div',null,
    h('div',{className:'stat-grid'},
      [{l:'Present Days',v:22,c:'var(--success)',icon:'✅'},{l:'Absent',v:2,c:'var(--danger)',icon:'❌'},{l:'On Leave',v:1,c:'var(--warn)',icon:'🌴'},{l:'Avg Hours/Day',v:'7h 42m',c:'var(--accent3)',icon:'⏱'}].map(({l,v,c,icon})=>
        h('div',{key:l,className:'stat-card teal'},h('div',{className:'stat-icon'},icon),h('div',{className:'stat-val',style:{color:c,fontFamily:'var(--mono)'}},v),h('div',{className:'stat-label'},l))
      )
    ),
    h('div',{className:'section'},
      h('div',{className:'section-head'},h('h3',null,'May 2026 Calendar')),
      h('div',{className:'section-body'},
        h('div',{style:{display:'flex',marginBottom:12}},
          days.map(d=>h('div',{key:d,style:{flex:1,textAlign:'center',fontSize:10,fontWeight:800,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.6px'}},d))
        ),
        h('div',{className:'att-grid'},
          Array.from({length:35},(_,i)=>{
            const s=statuses[i]||'present';
            return h('div',{key:i,className:'att-day '+s+(i===9?' today':'')},
              h('div',{style:{fontWeight:700,fontSize:12}},i<31?i+1:''),
              i<31?h('div',{style:{fontSize:9,marginTop:2}},s==='present'?'✓':s==='absent'?'✗':s==='leave'?'L':''):null
            );
          })
        ),
        h('div',{style:{display:'flex',gap:20,marginTop:18,fontSize:12}},
          [['present','Present','var(--success)'],['absent','Absent','var(--danger)'],['leave','Leave','var(--warn)']].map(([k,l,c])=>
            h('div',{key:k,style:{display:'flex',alignItems:'center',gap:6}},h('div',{style:{width:12,height:12,background:c+'25',border:`1px solid ${c}50`,borderRadius:3}}),h('span',{style:{color:'var(--text3)',fontWeight:500}},l))
          )
        )
      )
    ),
    h('div',{className:'section'},
      h('div',{className:'section-head'},h('h3',null,"Today's Attendance")),
      h('div',{className:'section-body'},
        h('div',{className:'table-wrap'},
          h('table',null,
            h('thead',null,h('tr',null,['Employee','Check In','Check Out','Hours','Status'].map(c=>h('th',{key:c},c)))),
            h('tbody',null,EMPLOYEES.map(e=>h('tr',{key:e.id},
              h('td',null,h('div',{className:'flex'},h('div',{className:'emp-avatar',style:{background:e.color+'25',color:e.color,border:`2px solid ${e.color}35`}},e.avatar),e.name)),
              h('td',null,h('span',{style:{fontFamily:'var(--mono)',fontSize:12}},'9:02 AM')),
              h('td',null,h('span',{style:{fontFamily:'var(--mono)',fontSize:12}},e.status==='offline'?'5:30 PM':'—')),
              h('td',null,h('span',{style:{fontFamily:'var(--mono)',fontSize:12,fontWeight:600}},e.hrs)),
              h('td',null,h('span',{className:'chip '+(e.status==='online'?'green':e.status==='idle'?'warn':'gray')},e.status))
            )))
          )
        )
      )
    )
  );
}

// ─── LEAVES ────────────────────────────────────────────────────────
function LeavesPage({isEmployee,empName}){
  const [reqs,setReqs]=useState(LEAVE_REQUESTS);
  const [show,setShow]=useState(false);
  function approve(id){setReqs(rs=>rs.map(r=>r.id===id?{...r,status:'approved'}:r))}
  function reject(id){setReqs(rs=>rs.map(r=>r.id===id?{...r,status:'rejected'}:r))}
  const myReqs=isEmployee?reqs.filter(r=>r.emp===empName):reqs;
  return h('div',null,
    isEmployee&&h('div',{style:{marginBottom:18}},
      h('button',{className:'submit-btn',onClick:()=>setShow(true)},'+ Apply for Leave')
    ),
    myReqs.length===0&&h('div',{className:'empty-state'},'No leave requests found.'),
    myReqs.map(r=>h('div',{key:r.id,className:'leave-item'},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}},
        h('div',null,
          h('div',{style:{fontWeight:800,fontSize:14,marginBottom:4}},r.type),
          h('div',{style:{fontSize:12,color:'var(--text3)',marginTop:3,fontWeight:500}},(!isEmployee?r.emp+' · ':'')+r.from+' → '+r.to),
          h('div',{style:{fontSize:12,color:'var(--text2)',marginTop:5,fontStyle:'italic'}},'"'+r.reason+'"')
        ),
        h('span',{className:'chip '+(r.status==='approved'?'green':r.status==='rejected'?'red':'amber')},r.status)
      ),
      !isEmployee&&r.status==='pending'&&h('div',{className:'leave-actions'},
        h('button',{className:'approve-btn',onClick:()=>approve(r.id)},'✓ Approve'),
        h('button',{className:'reject-btn',onClick:()=>reject(r.id)},'✕ Reject')
      )
    )),
    show&&h('div',{className:'modal-overlay',onClick:()=>setShow(false)},
      h('div',{className:'modal',onClick:e=>e.stopPropagation()},
        h('div',{className:'modal-head'},h('h3',null,'Apply for Leave'),h('button',{className:'close-btn',onClick:()=>setShow(false)},'✕')),
        h('div',{className:'modal-body'},
          h('div',{className:'form-row'},
            h('div',null,h('label',{className:'form-label'},'Leave Type'),h('select',{className:'form-select'},['Sick Leave','Annual Leave','Casual Leave','Maternity Leave'].map(l=>h('option',{key:l},l)))),
            h('div',null,h('label',{className:'form-label'},'From Date'),h('input',{className:'form-input',type:'date'}))
          ),
          h('div',{className:'form-row'},
            h('div',null,h('label',{className:'form-label'},'To Date'),h('input',{className:'form-input',type:'date'})),
            h('div',null,h('label',{className:'form-label'},'No. of Days'),h('input',{className:'form-input',placeholder:'Auto-calculated',readOnly:true}))
          ),
          h('div',{className:'form-row full'},h('div',null,h('label',{className:'form-label'},'Reason'),h('textarea',{className:'form-input',rows:3,placeholder:'Brief reason for your leave request...',style:{resize:'none'}}))),
          h('button',{className:'submit-btn',style:{width:'100%',padding:13},onClick:()=>setShow(false)},'Submit Leave Request')
        )
      )
    )
  );
}

// ─── APP USAGE ─────────────────────────────────────────────────────
function AppUsagePage(){
  return h('div',null,
    h('div',{className:'stat-grid'},
      [{l:'Productive Time',v:'4h 55m',c:'var(--success)',icon:'💻'},{l:'Neutral Time',v:'2h 28m',c:'var(--accent3)',icon:'🌐'},{l:'Distracting',v:'33m',c:'var(--danger)',icon:'⚠️'},{l:'Productivity Score',v:'63%',c:'var(--success)',icon:'📊'}].map(({l,v,c,icon})=>
        h('div',{key:l,className:'stat-card teal'},h('div',{className:'stat-icon'},icon),h('div',{className:'stat-val',style:{color:c,fontFamily:'var(--mono)'}},v),h('div',{className:'stat-label'},l))
      )
    ),
    h('div',{className:'section'},
      h('div',{className:'section-head'},h('h3',null,"Application Usage",' ',h('span',null,'today'))),
      h('div',{className:'section-body'},
        APPS_DATA.map(a=>h('div',{key:a.name,className:'app-row'},
          h('div',{className:'app-icon'},a.icon),
          h('div',{className:'app-info'},
            h('div',{className:'app-name'},a.name),
            h('div',{className:'app-time'},a.time)
          ),
          h('div',{className:'app-bar-wrap'},
            h('div',{className:'prog-bar'},h('div',{className:'prog-fill',style:{width:a.pct+'%',background:a.cat==='productive'?'var(--success)':a.cat==='distracting'?'var(--danger)':'var(--accent3)'}}))
          ),
          h('span',{className:'chip '+(a.cat==='productive'?'green':a.cat==='distracting'?'red':'blue')},a.cat)
        ))
      )
    )
  );
}

// ─── ANALYTICS ─────────────────────────────────────────────────────
function AnalyticsPage(){
  return h('div',null,
    h('div',{className:'section'},
      h('div',{className:'section-head'},h('h3',null,'Department Productivity')),
      h('div',{className:'section-body'},
        [['Engineering',87,'var(--accent3)'],['Design',82,'var(--purple)'],['Human Resources',95,'var(--success)'],['Marketing',78,'var(--accent2)'],['Finance',90,'var(--success)']].map(([d,s,c])=>
          h('div',{key:d,style:{display:'flex',alignItems:'center',gap:14,marginBottom:16}},
            h('div',{style:{width:120,fontSize:12,fontWeight:600,color:'var(--text2)'}},d),
            h('div',{style:{flex:1}},h('div',{className:'prog-bar',style:{height:10,borderRadius:6}},h('div',{className:'prog-fill',style:{width:s+'%',background:c,borderRadius:6}}))),
            h('div',{style:{width:44,textAlign:'right',fontSize:13,fontWeight:800,color:c,fontFamily:'var(--mono)'}},s+'%')
          )
        )
      )
    ),
    h('div',{className:'grid-2'},
      h('div',{className:'section'},
        h('div',{className:'section-head'},h('h3',null,'🏆 Top Performers')),
        h('div',{className:'section-body'},
          [...EMPLOYEES].sort((a,b)=>b.score-a.score).map((e,i)=>h('div',{key:e.id,style:{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)40'}},
            h('div',{style:{width:22,fontSize:i<3?15:12,fontWeight:800,color:i===0?'var(--accent2)':i===1?'var(--text2)':'var(--text3)',textAlign:'center'}},i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1),
            h('div',{className:'emp-avatar',style:{background:e.color+'25',color:e.color,border:`2px solid ${e.color}35`}},e.avatar),
            h('div',{style:{flex:1,fontSize:13,fontWeight:600}},e.name),
            h(ScoreRing,{score:e.score,size:36})
          ))
        )
      ),
      h('div',{className:'section'},
        h('div',{className:'section-head'},h('h3',null,'Task Completion Trend')),
        h('div',{className:'section-body'},
          h(MiniLineChart,{data:[65,70,68,75,80,85,88,84,90,87,92,89],color:'var(--accent)'}),
          h('div',{style:{textAlign:'center',marginTop:16}},
            h('div',{style:{fontSize:32,fontWeight:800,color:'var(--success)',fontFamily:'var(--mono)'}},Math.round(TASKS.filter(t=>t.status==='completed').length/TASKS.length*100)+'%'),
            h('div',{style:{fontSize:12,color:'var(--text3)',marginTop:4,fontWeight:500}},TASKS.filter(t=>t.status==='completed').length+' of '+TASKS.length+' tasks completed')
          )
        )
      )
    )
  );
}

// ─── PAYROLL ───────────────────────────────────────────────────────
function PayrollPage(){
  const salaries=[75000,65000,55000,70000,60000];
  return h('div',null,
    h('div',{className:'stat-grid'},
      [{l:'Total Payroll',v:'₹3,25,000',c:'var(--accent)',icon:'💰'},{l:'Employees Paid',v:'5/5',c:'var(--success)',icon:'✅'},{l:'Overtime Cost',v:'₹12,500',c:'var(--accent2)',icon:'⏰'},{l:'Next Pay Run',v:'May 31',c:'var(--text2)',icon:'📅'}].map(({l,v,c,icon})=>
        h('div',{key:l,className:'stat-card teal'},h('div',{className:'stat-icon'},icon),h('div',{className:'stat-val',style:{color:c,fontSize:20,fontFamily:'var(--mono)'}},v),h('div',{className:'stat-label'},l))
      )
    ),
    h('div',{className:'section'},
      h('div',{className:'section-head'},h('h3',null,'May 2026 Payroll'),h('button',{className:'submit-btn',style:{padding:'6px 16px',fontSize:12}},'▶ Run Payroll')),
      h('div',{className:'table-wrap'},
        h('table',null,
          h('thead',null,h('tr',null,['Employee','Department','Base Salary','Overtime','Deductions','Net Pay','Status'].map(c=>h('th',{key:c},c)))),
          h('tbody',null,EMPLOYEES.map((e,i)=>h('tr',{key:e.id},
            h('td',null,h('div',{className:'flex'},h('div',{className:'emp-avatar',style:{background:e.color+'25',color:e.color,border:`2px solid ${e.color}35`}},e.avatar),h('div',null,h('div',{style:{fontWeight:700,fontSize:13}},e.name),h('div',{style:{fontSize:11,color:'var(--text3)',marginTop:1}},e.designation)))),
            h('td',null,h('span',{style:{fontSize:12,color:'var(--text2)',fontWeight:500}},e.dept)),
            h('td',null,h('span',{style:{fontFamily:'var(--mono)',fontSize:12,fontWeight:600}},('₹'+salaries[i].toLocaleString()))),
            h('td',null,h('span',{style:{color:'var(--success)',fontFamily:'var(--mono)',fontSize:12,fontWeight:600}},'+₹'+(i*1200+500))),
            h('td',null,h('span',{style:{color:'var(--danger)',fontFamily:'var(--mono)',fontSize:12,fontWeight:600}},'-₹'+(i*200+1000))),
            h('td',null,h('span',{style:{color:'var(--accent)',fontFamily:'var(--mono)',fontSize:13,fontWeight:800}},('₹'+(salaries[i]+i*1200+500-i*200-1000).toLocaleString()))),
            h('td',null,h('span',{className:'chip green'},'✓ Processed'))
          )))
        )
      )
    )
  );
}

// ─── AI INSIGHTS ───────────────────────────────────────────────────
function AIInsightsPage(){
  const [input,setInput]=useState('');
  const [msgs,setMsgs]=useState([{role:'assistant',text:'Hello! I\'m your AI workforce analytics assistant powered by Claude. Ask me about team productivity, performance trends, workload balance, or any HR and operational insights you need.'}]);
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>endRef.current?.scrollIntoView({behavior:'smooth'}),[msgs]);
  async function sendMsg(){
    if(!input.trim()||loading)return;
    const q=input.trim();setInput('');
    setMsgs(m=>[...m,{role:'user',text:q}]);
    setLoading(true);
    try{
      const context=`You are an AI workforce analytics assistant for NexaWork, an enterprise productivity monitoring platform.
      Team data: 5 employees, avg productivity 86.4%, 3 online, 1 idle, 1 offline.
      Employees: Rahul Sharma (92%, Engineering, Senior Developer), Priya Patel (88%, Design, UI/UX Designer), Akash Mehta (76%, idle 45min, Engineering), Sneha Reddy (95%, HR Manager), Dev Kumar (81%, offline, Marketing Lead).
      Tasks: 8 total — 1 completed, 4 ongoing, 1 delayed (DB optimization), 2 not started.
      Company: NexaCorp. Date: May 18, 2026. Location: Hyderabad, India.
      Be concise, data-driven, and professional. Provide actionable recommendations.`;
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:context,messages:[...msgs.filter((m,idx)=>m.role!=='assistant'||idx>0).map(m=>({role:m.role,content:m.text})),{role:'user',content:q}]})});
      const d=await res.json();
      setMsgs(m=>[...m,{role:'assistant',text:d.content?.[0]?.text||'Unable to get response.'}]);
    }catch(e){setMsgs(m=>[...m,{role:'assistant',text:'Connection error. Please check your network and try again.'}]);}
    setLoading(false);
  }
  const suggestions=['Who is underperforming today?','Suggest workload rebalancing','Who is at burnout risk?','Give me attendance insights','Analyze productivity trends'];
  return h('div',null,
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 300px',gap:18,height:'calc(100vh - 190px)'}},
      h('div',{className:'section',style:{display:'flex',flexDirection:'column',overflow:'hidden'}},
        h('div',{className:'section-head'},
          h('h3',null,'✦ AI Workforce Assistant'),
          h('span',{className:'chip blue'},'Claude Powered')
        ),
        h('div',{style:{flex:1,overflowY:'auto',padding:18,display:'flex',flexDirection:'column',gap:12}},
          msgs.map((m,i)=>h('div',{key:i,style:{display:'flex',flexDirection:'column',alignItems:m.role==='user'?'flex-end':'flex-start'}},
            h('div',{style:{maxWidth:'82%',background:m.role==='user'?'linear-gradient(135deg,var(--accent),var(--accent3))':'var(--bg2)',borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',padding:'11px 16px',fontSize:13,lineHeight:1.65,border:m.role==='user'?'none':'1px solid var(--border)',color:m.role==='user'?'#0c1117':'var(--text)',fontWeight:m.role==='user'?600:400}},m.text)
          )),
          loading&&h('div',{style:{display:'flex',gap:5,padding:'12px 16px'}},h('div',{className:'dot-pulse'}),h('div',{className:'dot-pulse'}),h('div',{className:'dot-pulse'})),
          h('div',{ref:endRef})
        ),
        h('div',{style:{padding:'14px 18px',borderTop:'1px solid var(--border)',display:'flex',gap:9}},
          h('input',{className:'form-input',style:{flex:1},placeholder:'Ask about team productivity, insights, recommendations...',value:input,onChange:e=>setInput(e.target.value),onKeyDown:e=>e.key==='Enter'&&sendMsg()}),
          h('button',{className:'submit-btn',onClick:sendMsg,style:{padding:'10px 20px'}},'Send →')
        )
      ),
      h('div',{style:{display:'flex',flexDirection:'column',gap:14}},
        h('div',{className:'section'},
          h('div',{className:'section-head'},h('h3',null,'Quick Prompts')),
          h('div',{className:'section-body',style:{padding:'14px 16px'}},
            suggestions.map(s=>h('div',{key:s,style:{padding:'9px 12px',background:'var(--bg2)',borderRadius:9,cursor:'pointer',fontSize:12,marginBottom:7,border:'1px solid var(--border)',transition:'.15s',fontWeight:500,color:'var(--text2)'},onClick:()=>setInput(s),onMouseEnter:e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--text)'},onMouseLeave:e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}},s))
          )
        ),
        h('div',{className:'section'},
          h('div',{className:'section-head'},h('h3',null,'Team Scores')),
          h('div',{className:'section-body',style:{padding:'14px 16px'}},
            EMPLOYEES.map(e=>h('div',{key:e.id,style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)30'}},
              h('div',null,
                h('div',{style:{fontSize:12,fontWeight:600,color:'var(--text)'}},e.name.split(' ')[0]),
                h('div',{style:{fontSize:10,color:'var(--text3)',fontWeight:500,marginTop:1}},e.designation.split(' ').slice(0,2).join(' '))
              ),
              h(ScoreRing,{score:e.score,size:34})
            ))
          )
        )
      )
    )
  );
}

// ─── EMPLOYEE DASHBOARD ────────────────────────────────────────────
function EmployeeDashboard({user}){
  const [running,setRunning]=useState(false);
  const [onBreak,setOnBreak]=useState(false);
  const [secs,setSecs]=useState(26400);
  const [startTime]=useState('9:02 AM');
  useEffect(()=>{
    if(running&&!onBreak){const t=setInterval(()=>setSecs(s=>s+1),1000);return()=>clearInterval(t);}
  },[running,onBreak]);
  function fmt(s){const hh=Math.floor(s/3600),mm=Math.floor((s%3600)/60),ss=s%60;return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`}
  const myTasks=TASKS.filter(t=>t.assignee===user.id);
  const done=myTasks.filter(t=>t.status==='completed').length;
  return h('div',null,
    h('div',{className:'section'},
      h('div',{className:'timer-display'},
        h('div',{style:{fontSize:13,color:'var(--text3)',marginBottom:6,fontWeight:600}},
          'Welcome back, '+user.name.split(' ')[0]+'! 👋'
        ),
        h('div',{className:'timer-clock'},fmt(secs)),
        h('div',{className:'timer-date'},'Monday, 18 May 2026  ·  Check-in: '+startTime),
        h('div',{className:'timer-btns'},
          !running
            ?h('button',{className:'t-btn start',onClick:()=>setRunning(true)},'▶  Start Work')
            :h(React.Fragment,null,
              onBreak
                ?h('button',{className:'t-btn resume',onClick:()=>setOnBreak(false)},'▶  Resume')
                :h('button',{className:'t-btn break',onClick:()=>setOnBreak(true)},'⏸  Break'),
              h('button',{className:'t-btn stop',onClick:()=>{setRunning(false);setOnBreak(false)}},'⏹  Check Out')
            )
        ),
        running&&h('div',{style:{marginTop:12,fontSize:12,color:onBreak?'var(--warn)':'var(--success)',fontWeight:700}},
          onBreak?'⏸ On Break — Timer Paused':'🟢 Active Session Running')
      )
    ),
    h('div',{className:'stat-grid'},
      [
        {icon:'⏱️',v:fmt(secs),l:'Hours Worked',c:'var(--accent)'},
        {icon:'✅',v:done+'/'+myTasks.length,l:'Tasks Done',c:'var(--success)'},
        {icon:'⭐',v:user.score+'%',l:'My Score',c:scoreColor(user.score)},
        {icon:'💤',v:'12m',l:'Idle Time',c:'var(--warn)'}
      ].map(({icon,v,l,c})=>h('div',{key:l,className:'stat-card teal'},
        h('div',{className:'stat-icon'},icon),
        h('div',{className:'stat-val',style:{color:c,fontSize:22,fontFamily:'var(--mono)'}},v),
        h('div',{className:'stat-label'},l)
      ))
    ),
    h('div',{className:'grid-2'},
      h('div',{className:'section'},
        h('div',{className:'section-head'},h('h3',null,"Today's Tasks")),
        h('div',{className:'section-body'},
          myTasks.slice(0,4).map(t=>h('div',{key:t.id,style:{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)30'}},
            h('span',{style:{fontSize:14}},t.status==='completed'?'✅':'⬜'),
            h('div',{style:{flex:1}},
              h('div',{style:{fontSize:13,fontWeight:600,textDecoration:t.status==='completed'?'line-through':'none',color:t.status==='completed'?'var(--text3)':'var(--text)'}},t.title),
              h('div',{style:{fontSize:11,color:'var(--text3)',marginTop:2,fontWeight:500}},t.project+' · Due '+t.due)
            ),
            h('span',{className:'chip '+priorityChip(t.priority)},t.priority)
          ))
        )
      ),
      h('div',{className:'section'},
        h('div',{className:'section-head'},h('h3',null,'Top Apps Today')),
        h('div',{className:'section-body'},
          APPS_DATA.slice(0,5).map(a=>h('div',{key:a.name,className:'app-row'},
            h('div',{className:'app-icon'},a.icon),
            h('div',{className:'app-info'},h('div',{className:'app-name'},a.name),h('div',{className:'app-time'},a.time)),
            h('span',{className:'chip '+(a.cat==='productive'?'green':a.cat==='distracting'?'red':'blue')},a.cat)
          ))
        )
      )
    )
  );
}

// ─── MY REPORTS (AI COACH) ─────────────────────────────────────────
function MyReports({user}){
  const [msgs,setMsgs]=useState([{role:'assistant',text:`Hi ${user.name.split(' ')[0]}! I'm your personal AI performance coach. I have access to your productivity data and can give you personalized insights. Ask me anything about your performance, work patterns, or how to improve!`}]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>endRef.current?.scrollIntoView({behavior:'smooth'}),[msgs]);
  async function send(){
    if(!input.trim()||loading)return;
    const q=input.trim();setInput('');
    setMsgs(m=>[...m,{role:'user',text:q}]);setLoading(true);
    try{
      const sys=`You are a personal AI performance coach for ${user.name}, an employee at NexaCorp.
      Their data — Score: ${user.score}%, Department: ${user.dept}, Designation: ${user.designation}.
      Today hours: ${user.hrs}, Idle: ${user.idle||'12m'}, Tasks: ${user.done}/${user.tasks} done.
      Top apps: VS Code 3h20m, Chrome 2h10m, Slack 55m, YouTube 25m.
      Be encouraging, empathetic, and give specific actionable advice. Keep responses concise.`;
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,system:sys,messages:[{role:'user',content:q}]})});
      const d=await res.json();
      setMsgs(m=>[...m,{role:'assistant',text:d.content?.[0]?.text||'Error.'}]);
    }catch(e){setMsgs(m=>[...m,{role:'assistant',text:'Connection error. Please try again.'}]);}
    setLoading(false);
  }
  const quick=['How am I doing this week?','How can I improve my score?','Am I working too many hours?','What are my peak productive hours?'];
  return h('div',null,
    h('div',{className:'stat-grid'},
      [{l:'My Score',v:user.score+'%',c:scoreColor(user.score),icon:'⭐'},{l:'Hours Today',v:user.hrs,c:'var(--accent)',icon:'⏱'},{l:'Tasks Done',v:user.done+'/'+user.tasks,c:'var(--success)',icon:'✅'},{l:'Idle Time',v:user.idle||'12m',c:'var(--warn)',icon:'💤'}].map(({l,v,c,icon})=>
        h('div',{key:l,className:'stat-card teal'},h('div',{className:'stat-icon'},icon),h('div',{className:'stat-val',style:{color:c,fontSize:20,fontFamily:'var(--mono)'}},v),h('div',{className:'stat-label'},l))
      )
    ),
    h('div',{className:'section',style:{height:400,display:'flex',flexDirection:'column',overflow:'hidden'}},
      h('div',{className:'section-head'},
        h('h3',null,'✦ AI Performance Coach'),
        h('span',{className:'chip blue'},'Personal')
      ),
      h('div',{style:{flex:1,overflowY:'auto',padding:18,display:'flex',flexDirection:'column',gap:12}},
        msgs.map((m,i)=>h('div',{key:i,style:{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}},
          h('div',{style:{maxWidth:'82%',background:m.role==='user'?'linear-gradient(135deg,var(--accent),var(--accent3))':'var(--bg2)',borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',padding:'11px 16px',fontSize:13,lineHeight:1.65,border:m.role==='user'?'none':'1px solid var(--border)',color:m.role==='user'?'#0c1117':'var(--text)',fontWeight:m.role==='user'?600:400}},m.text)
        )),
        loading&&h('div',{style:{display:'flex',gap:5,padding:'12px 16px'}},h('div',{className:'dot-pulse'}),h('div',{className:'dot-pulse'}),h('div',{className:'dot-pulse'})),
        h('div',{ref:endRef})
      ),
      h('div',{style:{padding:'14px 18px',borderTop:'1px solid var(--border)',display:'flex',gap:9}},
        h('input',{className:'form-input',style:{flex:1},placeholder:'Ask about your performance...',value:input,onChange:e=>setInput(e.target.value),onKeyDown:e=>e.key==='Enter'&&send()}),
        h('button',{className:'submit-btn',onClick:send},'Ask →')
      )
    ),
    h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',marginTop:6}},
      quick.map(s=>h('button',{key:s,style:{padding:'8px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,cursor:'pointer',fontSize:12,color:'var(--text2)',transition:'.15s',fontFamily:'var(--font)',fontWeight:500},onClick:()=>setInput(s),onMouseEnter:e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)'},onMouseLeave:e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}},s))
    )
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────
function App(){
  const [employees,setEmployees] = useState([]);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
});
const [page, setPage] = useState(null);

const isAdmin = user && (user.role === 'admin' || user.role === 'hr');
  useEffect(()=>{if(user)setPage(isAdmin?'dashboard':'emp_dashboard')},[user]);
  if(!user)return h(LoginPage,{onLogin:setUser});
  function renderPage(){
    switch(page){
      case 'dashboard':return h(AdminDashboard);
      case 'employees':return h(EmployeesPage,{employees});
      case 'monitoring':return h(LiveMonitor);
      case 'tasks':return h(TasksPage,{myOnly:false});
      case 'attendance':return h(AttendancePage);
      case 'leaves':return h(LeavesPage,{isEmployee:false});
      case 'analytics':return h(AnalyticsPage);
      case 'payroll':return h(PayrollPage);
      case 'ai_insights':return h(AIInsightsPage);
      case 'emp_dashboard':return h(EmployeeDashboard,{user});
      case 'emp_tasks':return h(TasksPage,{myOnly:true,userId:user.id});
      case 'emp_attendance':return h(AttendancePage);
      case 'emp_leaves':return h(LeavesPage,{isEmployee:true,empName:user.name});
      case 'emp_apps':return h(AppUsagePage);
      case 'emp_reports':return h(MyReports,{user});
      default:return h('div',{style:{padding:40,textAlign:'center',color:'var(--text3)'}},'Loading...');
    }
  }
  useEffect(()=>{

    async function fetchEmployees(){

        try{

            const response = await getEmployees();

            setEmployees(response.data);

        }catch(error){

            console.log(error);
        }
    }

    fetchEmployees();

},[]);

return h(Shell,{
    user,
    onLogout:()=>{
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    },
    page,
    setPage,
    notifCount:3
},renderPage());

}

export default App;