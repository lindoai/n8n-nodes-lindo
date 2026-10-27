const { test } = require('node:test');
const assert = require('node:assert/strict');
const {createHmac} = require('node:crypto');
const {LindoFormTrigger} = require('../dist/nodes/Lindo/LindoFormTrigger.node');
function context({expired=false,invalid=false,slug='',tamper=false}={}) {
 const timestamp=String(Math.floor(Date.now()/1000)-(expired?600:0));
 const body={id:'submission-1',type:'form.submitted',website_id:'website-1',form:{slug:'contact'},data:{email:'test@example.com'}};
 const rawBody=Buffer.from(JSON.stringify(body));
 const signature=createHmac('sha256','website-secret').update(timestamp+'.').update(rawBody).digest('hex');
 const request={rawBody:tamper?Buffer.from(JSON.stringify({...body,data:{email:'changed'}})):rawBody,headers:{'x-lindo-timestamp':timestamp,'x-lindo-signature':'sha256='+(invalid?'0'.repeat(64):signature),'x-lindo-delivery-id':body.id}};
 const result={};
 const response={status(code){result.code=code;return this;},json(value){result.response=value;return this;}};
 return {result,getRequestObject:()=>request,getResponseObject:()=>response,getCredentials:async()=>({signingSecret:'website-secret'}),getNodeParameter:name=>name==='websiteId'?'website-1':slug,helpers:{returnJsonArray:body=>[{json:body}]}};
}
test('verified submission is acknowledged and emitted',async()=>{const c=context();const r=await new LindoFormTrigger().webhook.call(c);assert.equal(c.result.code,200);assert.equal(r.workflowData[0][0].json.id,'submission-1');assert.equal(r.noWebhookResponse,true);});
for(const options of [{expired:true},{invalid:true},{tamper:true}]) test('rejects unauthenticated request '+JSON.stringify(options),async()=>{const c=context(options);const r=await new LindoFormTrigger().webhook.call(c);assert.equal(c.result.code,401);assert.equal(r.workflowData,undefined);});
test('other form slugs are acknowledged without downstream execution',async()=>{const c=context({slug:'newsletter'});const r=await new LindoFormTrigger().webhook.call(c);assert.equal(c.result.code,200);assert.equal(r.workflowData,undefined);});

test('lifecycle uses scoped subscriptions and authenticated API requests', async () => {
 const calls=[];
 const ctx={getNodeWebhookUrl:()=> 'https://n8n.example.com/webhook/form-1',
  getNodeParameter:name=>name==='authentication'?'formWebhook':'website-1',
  getCredentials:async name=>{assert.equal(name,'lindoFormWebhookApi');return {baseUrl:'https://api.lindo.ai'};},
  helpers:{httpRequestWithAuthentication:async function(name,options){calls.push({name,options});return {success:true,result:{exists:true}};}}};
 const hooks=new LindoFormTrigger().webhookMethods.default;
 assert.equal(await hooks.checkExists.call(ctx),true);
 assert.equal(await hooks.create.call(ctx),true);
 assert.equal(await hooks.delete.call(ctx),true);
 assert.deepEqual(calls.map(c=>c.options.method),['GET','POST','DELETE']);
 for(const call of calls){assert.equal(call.name,'lindoFormWebhookApi');assert.equal(call.options.url,'https://api.lindo.ai/v1/workspace/automations/n8n/hooks');
  assert.deepEqual(call.options.qs||call.options.body,{target_url:'https://n8n.example.com/webhook/form-1',event_type:'form.submitted',website_id:'website-1'});}
});
test('lifecycle checks report a missing subscription',async()=>{
 const ctx={getNodeWebhookUrl:()=> 'https://n8n.example.com/webhook/form-1',getNodeParameter:name=>name==='authentication'?'formWebhook':'website-1',getCredentials:async()=>({}),helpers:{httpRequestWithAuthentication:async()=>({success:true,result:{exists:false}})}};
 assert.equal(await new LindoFormTrigger().webhookMethods.default.checkExists.call(ctx),false);
});
test('signed payload from another website is rejected',async()=>{
 const c=context();const original=c.getNodeParameter;c.getNodeParameter=name=>name==='websiteId'?'website-2':original(name);
 const result=await new LindoFormTrigger().webhook.call(c);assert.equal(c.result.code,401);assert.equal(result.workflowData,undefined);
});
