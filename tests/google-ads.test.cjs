const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function load(){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync('lib/google-ads.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('module','exports',code)(m,m.exports);return m.exports;}
test('Ads is restricted to owned marketing/onboarding pages, not creator traffic',()=>{const a=load(); assert.equal(a.adsPageAllowed('linkovne.com','/'),true);assert.equal(a.adsPageAllowed('linkovne.com','/pricing'),true);assert.equal(a.adsPageAllowed('linkovne.com','/features'),true); assert.equal(a.adsPageAllowed('linkovne.com','/onboarding'),true); for(const p of ['/somecreator','/dashboard','/admin','/auth/callback','/reset'])assert.equal(a.adsPageAllowed('linkovne.com',p),false);assert.equal(a.adsPageAllowed('creator.example','/'),false);});
test('only a current explicit opt-in enables measurement',()=>{const a=load(); for(const raw of [null,'yes','{}','{"choice":"granted","version":0}','{"choice":"denied","version":1}'])assert.equal(a.hasAdsConsent(raw),false);assert.equal(a.hasAdsConsent('{"choice":"granted","version":1}'),true);});
test('Google receives no auth tokens, email or arbitrary URL parameters',()=>{const a=load();assert.equal(a.adsPageLocation('https://linkovne.com/register?email=private@example.com&code=secret&gclid=ad123&next=/private#token'),'https://linkovne.com/register?gclid=ad123');});
test('conversion requires valid server event and cannot be resent after acknowledgment',()=>{const a=load();const storage=new Map();const s={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};assert.equal(a.pendingConversion(s),null);a.queueConversion(s,'not-valid');assert.equal(a.pendingConversion(s),null);const id='b96e4742-f38e-4c86-a029-a17bd437b880';a.queueConversion(s,id);assert.equal(a.pendingConversion(s),id);a.acknowledgeConversion(s,id);a.queueConversion(s,id);assert.equal(a.pendingConversion(s),null);});
test('isolated Google document blocks foreign messages and only starts after consented parent',()=>{
 const vm=require('node:vm'); const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('lib/google-ads-frame.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('module','exports',code)(m,m.exports);
 const script=m.exports.ADS_FRAME_HTML.match(/<script>([\s\S]*)<\/script>/)[1];
 let listener; const scripts=[]; const messages=[];
 const parent={postMessage:(...args)=>messages.push(args)};
 const context={URL,Date,Array,parent,document:{createElement:()=>({}),head:{appendChild:x=>scripts.push(x)}},window:null};
 context.window=context;context.addEventListener=(type,fn)=>{listener=fn;};vm.createContext(context);vm.runInContext(script,context);
 assert.equal(scripts.length,0);
 listener({origin:'https://evil.example',source:parent,data:{type:'linkovne:ads-start',location:'https://linkovne.com/'}});
 listener({origin:'https://linkovne.com',source:parent,data:{type:'linkovne:ads-start',location:'https://linkovne.com/privatecreator'}});
 assert.equal(scripts.length,0);
 listener({origin:'https://linkovne.com',source:parent,data:{type:'linkovne:ads-start',location:'https://linkovne.com/?code=secret&gclid=123'}});
 assert.equal(scripts.length,1);assert.match(scripts[0].src,/AW-18577399281/);
 const config=context.dataLayer.find(x=>x[0]==='config')[2]; assert.equal(config.page_location,'https://linkovne.com/?gclid=123');assert.equal(config.send_page_view,false);
 listener({origin:'https://linkovne.com',source:parent,data:{type:'linkovne:ads-convert',id:'private@email.example'}});
 assert.equal(context.dataLayer.filter(x=>x[0]==='event').length,0);
 const id='a'.repeat(64);listener({origin:'https://linkovne.com',source:parent,data:{type:'linkovne:ads-convert',id}});
 const event=context.dataLayer.find(x=>x[0]==='event')[2];assert.equal(event.transaction_id,id);assert.equal(event.page_location,'https://linkovne.com/onboarding');event.event_callback();assert.equal(messages[0][0].id,id);
});
test('actual onboarding emits one stable conversion only for a newly acquired first profile',async()=>{
 const {createHash}=require('node:crypto');
 const state={count:0,markerError:false,user:{id:'test-user-opaque-id',created_at:'2026-11-16T12:00:00Z',user_metadata:{}}};
 const client={auth:{getUser:async()=>({data:{user:state.user}}),updateUser:async({data})=>{if(state.markerError)return {error:{message:'offline'}};Object.assign(state.user.user_metadata,data);return {error:null};}},rpc:async()=>({data:true}),from:()=>{const q={select:()=>q,eq:async()=>({count:state.count,error:null}),upsert:async()=>({error:null}),insert:()=>q,single:async()=>({data:{id:'profile'},error:null})};return q;}};
 const mocks={
  'node:crypto':{createHash},'next/navigation':{redirect:()=>{throw Error('unexpected redirect');}},'next/cache':{revalidatePath:()=>{}},'next/headers':{cookies:async()=>({get:()=>null,delete:()=>{}})},
  '@/lib/supabase/server':{createClient:async()=>client},'@/lib/templates':{templateByKey:()=>({key:'paper',theme:'classic',design:{}}),templateBlocks:()=>[]},'@/lib/blocks':{socialHref:()=>''},
 };
 const m={exports:{}};const code=ts.transpileModule(fs.readFileSync('app/onboarding/actions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',code)(key=>{if(!(key in mocks))throw Error(key);return mocks[key];},m,m.exports);
 const payload={username:'testcreator',template:'paper'};
 const first=await m.exports.completeOnboarding(payload);assert.equal(first.ok,true);assert.match(first.conversionId,/^[a-f0-9]{64}$/);assert.equal(state.user.user_metadata.linkovne_ads_onboarded,true);
 state.count=1;assert.equal((await m.exports.completeOnboarding(payload)).conversionId,undefined);
 state.count=0;assert.equal((await m.exports.completeOnboarding(payload)).conversionId,undefined);
 state.user.user_metadata={};state.user.created_at='2026-10-01T00:00:00Z';assert.equal((await m.exports.completeOnboarding(payload)).conversionId,undefined);
 state.user.created_at='2026-11-16T12:00:00Z';state.markerError=true;assert.equal((await m.exports.completeOnboarding(payload)).conversionId,undefined);
});
