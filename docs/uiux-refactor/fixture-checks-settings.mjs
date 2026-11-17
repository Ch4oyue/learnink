import { chromium } from '/tmp/learnink/node_modules/playwright/index.mjs';
const [port] = process.argv.slice(2);
const UID='fixture-user-0000-0000-000000000001';
const SESSION={access_token:'a',refresh_token:'b',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:UID,email:'fixture@example.test',aud:'authenticated',role:'authenticated',user_metadata:{display_name:'Fixture User'},created_at:'2026-01-01T00:00:00Z'}};
const PROFILE={id:UID,display_name:'Fixture User',avatar_url:null,current_streak:3,longest_streak:7,last_activity_date:'2026-11-17',points:120,labels:[],is_premium:false,premium_until:null};
const fails=[];let n=0;const check=(t,ok,x='')=>{n++;if(!ok)fails.push(t);console.log(ok?'PASS':'FAIL',t,x)};
const browser=await chromium.launch();
for(const [name,vw,vh] of [['desktop',1440,900],['mobile',390,844]]){
 const ctx=await browser.newContext({viewport:{width:vw,height:vh}});
 await ctx.addInitScript((s)=>{if(!localStorage.getItem('theme'))localStorage.setItem('theme','light');localStorage.setItem('sb-placeholder-auth-token',JSON.stringify(s))},SESSION);
 const page=await ctx.newPage();
 await page.route('**://placeholder.supabase.co/**',(route)=>{const req=route.request();const url=new URL(req.url());const obj=(req.headers()['accept']||'').includes('vnd.pgrst.object');const ok=b=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(b)});
  if(!url.pathname.startsWith('/rest/v1/'))return ok({});if(url.pathname.includes('/rpc/'))return ok(0);
  const t=url.pathname.split('/rest/v1/')[1];if(t==='profiles')return ok(obj?PROFILE:[PROFILE]);if(t==='user_roles')return ok(obj?{role:'user'}:[{role:'user'}]);return ok(obj?{}:[])});
 await page.goto(`http://127.0.0.1:${port}/dashboard/settings`,{waitUntil:'networkidle'}).catch(()=>{});await page.waitForTimeout(1200);
 await page.screenshot({path:`/tmp/shots/int-settings-light-${name}.png`});
 const isDark=()=>page.evaluate(()=>document.documentElement.classList.contains('dark'));
 check(`${name}: starts light`,!(await isDark()));
 await page.getByRole('button',{name:/^Dark/}).click();await page.waitForTimeout(500);
 check(`${name}: Dark tile switches to dark`,await isDark(), 'stored='+await page.evaluate(()=>localStorage.getItem('theme')));
 await page.screenshot({path:`/tmp/shots/int-settings-dark-${name}.png`});
 await page.reload({waitUntil:'networkidle'}).catch(()=>{});await page.waitForTimeout(800);
 check(`${name}: dark persists after reload`,await isDark());
 await page.getByRole('button',{name:/^Light/}).click();await page.waitForTimeout(400);
 check(`${name}: Light tile switches back`,!(await isDark()));
 if(name==='mobile'){const b=page.getByRole('button',{name:/Enabled|Disabled/});check('mobile: transparent-nav toggle present',await b.count()>0);
  if(await b.count()){const before=(await b.first().textContent()).trim();await b.first().click();await page.waitForTimeout(300);const after=(await b.first().textContent()).trim();check('mobile: transparent-nav toggle flips label',before!==after,`${before} -> ${after}`);check('mobile: toggle persisted to localStorage',(await page.evaluate(()=>localStorage.getItem('transparentMobileNav')))==='true');}}
 await ctx.close();}
await browser.close();console.log('SUMMARY',n-fails.length,'/',n);fails.forEach(f=>console.log(' - FAIL',f));
