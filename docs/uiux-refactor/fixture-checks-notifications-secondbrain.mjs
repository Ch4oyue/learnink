import { chromium } from '/tmp/learnink/node_modules/playwright/index.mjs';
const [port] = process.argv.slice(2);
const UID = 'fixture-user-0000-0000-000000000001';
const SESSION = { access_token:'fixture-access-token', refresh_token:'fixture-refresh-token', token_type:'bearer', expires_in:3600, expires_at:Math.floor(Date.now()/1000)+3600,
 user:{ id:UID, email:'fixture@example.test', aud:'authenticated', role:'authenticated', user_metadata:{display_name:'Fixture User'}, created_at:'2026-01-01T00:00:00Z' } };
const PROFILE = { id:UID, display_name:'Fixture User', avatar_url:null, current_streak:3, longest_streak:7, last_activity_date:'2026-11-17', points:120, labels:[], is_premium:false, premium_until:null };
const now = Date.now();
let notifs = [
 { id:'n1', user_id:UID, title:'Request approved', message:'Your material request was approved', type:'success', is_read:false, related_request_id:null, related_module_id:null, created_at:new Date(now-3600e3).toISOString() },
 { id:'n2', user_id:UID, title:'New module', message:'A new module is published', type:'info', is_read:false, related_request_id:null, related_module_id:null, created_at:new Date(now-7200e3).toISOString() },
 { id:'n3', user_id:UID, title:'Welcome', message:'Welcome to LearnInk', type:'info', is_read:true, related_request_id:null, related_module_id:null, created_at:new Date(now-86400e3).toISOString() },
];
let notes = [
 { id:'k1', user_id:UID, module_id:'m1', content:'Flexbox aligns along the main axis', highlighted_text:'justify-content', created_at:new Date(now-3600e3).toISOString(), updated_at:new Date(now-3600e3).toISOString() },
 { id:'k2', user_id:UID, module_id:'m2', content:'Closures capture scope', highlighted_text:null, created_at:new Date(now-7200e3).toISOString(), updated_at:new Date(now-7200e3).toISOString() },
 { id:'k3', user_id:UID, module_id:'m1', content:'Grid vs flex tradeoffs', highlighted_text:null, created_at:new Date(now-9200e3).toISOString(), updated_at:new Date(now-9200e3).toISOString() },
];
const mods=[{id:'m1',title:'CSS Layout'},{id:'m2',title:'JS Basics'}];
const log=[]; const fails=[];
const check=(n,ok,extra='')=>{ (ok?log:fails).push(n+(extra?': '+extra:'')); console.log(ok?'PASS':'FAIL',n,extra); };
const browser = await chromium.launch();
for (const [name,vw,vh] of [['desktop',1440,900],['mobile',390,844]]) {
 const ctx = await browser.newContext({ viewport:{width:vw,height:vh}, deviceScaleFactor:1 });
 await ctx.addInitScript((s)=>{ localStorage.setItem('theme','light'); localStorage.setItem('sb-placeholder-auth-token', JSON.stringify(s)); }, SESSION);
 const page = await ctx.newPage();
 let writes=[];
 notifs.forEach(n=>{}); 
 await page.route('**://placeholder.supabase.co/**', async (route)=>{
  const req=route.request(); const url=new URL(req.url()); const method=req.method();
  const obj=(req.headers()['accept']||'').includes('vnd.pgrst.object');
  const ok=(b,extra={})=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(b),...extra});
  if(!url.pathname.startsWith('/rest/v1/')) return ok({});
  if(url.pathname.includes('/rpc/')) return ok(0);
  const table=url.pathname.split('/rest/v1/')[1];
  const q=url.searchParams;
  if(table==='profiles') return ok(obj?PROFILE:[PROFILE]);
  if(table==='user_roles') return ok(obj?{role:'user'}:[{role:'user'}]);
  if(table==='notifications'){
    if(method==='PATCH'){ writes.push('PATCH notifications '+url.search); const id=(q.get('id')||'').replace('eq.',''); const uidq=q.get('user_id');
      notifs=notifs.map(n=> (id? n.id===id : (uidq && !n.is_read)) ? {...n,is_read:true}:n); return route.fulfill({status:204,body:''}); }
    if(method==='HEAD'||req.headers()['prefer']?.includes('count')){ const c=notifs.filter(n=>!n.is_read).length; return route.fulfill({status:200,headers:{'content-range':`0-0/${c}`},contentType:'application/json',body:'[]'}); }
    return ok(notifs);
  }
  if(table==='learning_notes'){
    if(method==='DELETE'){ writes.push('DELETE learning_notes '+url.search); const id=(q.get('id')||'').replace('eq.',''); notes=notes.filter(n=>n.id!==id); return route.fulfill({status:204,body:''}); }
    let r=notes; const mid=q.get('module_id'); if(mid) r=r.filter(n=>n.module_id===mid.replace('eq.','')); return ok(r);
  }
  if(table==='modules') return ok(mods);
  return ok(obj?{}:[]);
 });
 // NOTIFICATIONS
 await page.goto(`http://127.0.0.1:${port}/dashboard/notifications`,{waitUntil:'networkidle'}).catch(()=>{});
 await page.waitForTimeout(1500);
 check(`${name}: notifications subtitle shows 2 unread`, (await page.textContent('body')).includes('2 unread'));
 await page.screenshot({path:`/tmp/shots/int-notif-before-${name}.png`});
 await page.getByText('Request approved').first().click(); await page.waitForTimeout(1200);
 check(`${name}: click marks one read (PATCH by id)`, writes.some(w=>w.includes('PATCH notifications')&&w.includes('id=eq.n1')), writes.join(' ; '));
 check(`${name}: subtitle now 1 unread`, (await page.textContent('body')).includes('1 unread'));
 const markAll = page.getByRole('button',{name:/mark all/i}); 
 check(`${name}: mark-all button present`, await markAll.count()>0);
 if(await markAll.count()){ await markAll.first().click(); await page.waitForTimeout(1200); check(`${name}: mark all -> all read`, (await page.textContent('body')).includes('All notifications have been read')); }
 await page.screenshot({path:`/tmp/shots/int-notif-after-${name}.png`});
 notifs=notifs.map((n,i)=>({...n,is_read:i===2})); writes=[];
 // SECOND BRAIN
 await page.goto(`http://127.0.0.1:${port}/dashboard/second-brain`,{waitUntil:'networkidle'}).catch(()=>{});
 await page.waitForTimeout(1500);
 let body=await page.textContent('body');
 check(`${name}: second-brain lists 3 notes`, ['Flexbox aligns','Closures capture','Grid vs flex'].every(t=>body.includes(t)));
 await page.screenshot({path:`/tmp/shots/int-sb-before-${name}.png`});
 await page.getByPlaceholder(/search notes/i).fill('closures'); await page.waitForTimeout(500);
 body=await page.textContent('body');
 check(`${name}: search filters to closures only`, body.includes('Closures capture') && !body.includes('Flexbox aligns'));
 await page.getByPlaceholder(/search notes/i).fill(''); await page.waitForTimeout(400);
 const chip=page.getByRole('button',{name:/CSS Layout/});
 if(await chip.count()){ await chip.first().click(); await page.waitForTimeout(900); body=await page.textContent('body'); check(`${name}: module filter shows CSS notes only`, body.includes('Flexbox aligns')&&body.includes('Grid vs flex')&&!body.includes('Closures capture')); await page.screenshot({path:`/tmp/shots/int-sb-filter-${name}.png`}); }
 else check(`${name}: module chip CSS Layout present`, false);
 await ctx.close();
}
await browser.close();
console.log('\nSUMMARY pass',log.length,'fail',fails.length); fails.forEach(f=>console.log(' -',f));
