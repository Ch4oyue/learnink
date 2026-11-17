import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pg = require(process.env.PG_MODULE || 'pg');
// Local-only dummy secret. Never use a real project secret here.
const SECRET='super-secret-jwt-token-with-at-least-32-characters-long';
const b64=s=>Buffer.from(s).toString('base64url');
const sign=(p)=>{const h=b64(JSON.stringify({alg:'HS256',typ:'JWT'})),d=b64(JSON.stringify(p));return h+'.'+d+'.'+crypto.createHmac('sha256',SECRET).update(h+'.'+d).digest('base64url')};
const verify=t=>{try{const [h,d,s]=t.split('.');if(crypto.createHmac('sha256',SECRET).update(h+'.'+d).digest('base64url')!==s)return null;const p=JSON.parse(Buffer.from(d,'base64url'));if(p.exp&&p.exp<Date.now()/1000)return null;return p}catch{return null}};
export const FN={'get-users':9101,'generate-api-key':9102,'validate-quiz-answers':9103,'award-xp':9104};
const pool=new pg.Pool({host:process.env.PGHOST,user:'postgres',database:'lk'});
const cleanQuery=(u)=>{const q=new URLSearchParams([...u.searchParams]).toString();return q?'?'+q:''};
function proxy(req,res,port,path,body){
  const hdr={...req.headers};delete hdr.host;
  const r=http.request({host:'127.0.0.1',port,path,method:req.method,headers:hdr},p=>{res.writeHead(p.statusCode,{...p.headers,'access-control-allow-origin':'*','access-control-allow-headers':'*'});p.pipe(res)});
  r.on('error',e=>{res.writeHead(502);res.end(String(e))});
  r.end(body);
}
http.createServer(async(req,res)=>{
  const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);
  const u=new URL(req.url,'http://x');
  const cors={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
  if(req.method==='OPTIONS'){res.writeHead(204,cors);return res.end()}
  const rest=/^\/rest\/v1\/((?:rpc\/)?[a-z_]+)$/.exec(u.pathname);
  if(rest)return proxy(req,res,3001,'/'+rest[1]+cleanQuery(u),body);
  if(u.pathname==='/auth/v1/user'&&req.method==='PUT'){
    const t=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');const p=verify(t);
    if(!p||!p.sub){res.writeHead(401,cors);return res.end('{"msg":"invalid JWT"}')}
    let data={};try{data=JSON.parse(body.toString()||'{}').data||{}}catch{}
    const {rows}=await pool.query("update auth.users set raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||$2::jsonb where id=$1 returning id,email,raw_user_meta_data",[p.sub,JSON.stringify(data)]);
    res.writeHead(200,{...cors,'content-type':'application/json'});
    return res.end(JSON.stringify({id:rows[0].id,aud:'authenticated',role:'authenticated',email:rows[0].email,user_metadata:rows[0].raw_user_meta_data,app_metadata:{}}));
  }
  if(u.pathname==='/auth/v1/user'){
    const t=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');const p=verify(t);
    if(!p||!p.sub){res.writeHead(401,{...cors,'content-type':'application/json'});return res.end('{"msg":"invalid JWT"}')}
    const {rows}=await pool.query('select id,email,raw_user_meta_data,created_at from auth.users where id=$1',[p.sub]);
    if(!rows[0]){res.writeHead(401,{...cors});return res.end('{"msg":"user not found"}')}
    res.writeHead(200,{...cors,'content-type':'application/json'});
    return res.end(JSON.stringify({id:rows[0].id,aud:'authenticated',role:'authenticated',email:rows[0].email,user_metadata:rows[0].raw_user_meta_data,app_metadata:{},created_at:rows[0].created_at}));
  }
  const m=/^\/functions\/v1\/([a-z-]+)$/.exec(u.pathname);
  if(m&&Object.hasOwn(FN,m[1]))return proxy(req,res,FN[m[1]],'/'+cleanQuery(u),body);
  res.writeHead(404,{...cors,'content-type':'application/json'});res.end('{"error":"gateway: unknown route"}');
}).listen(9000,()=>console.log('gw up'));
