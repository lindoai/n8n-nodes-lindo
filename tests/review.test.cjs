const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Lindo } = require('../dist/nodes/Lindo/Lindo.node');
const { LindoTrigger } = require('../dist/nodes/Lindo/LindoTrigger.node');
const { LindoApi } = require('../dist/credentials/LindoApi.credentials');
const { LindoFormTrigger } = require('../dist/nodes/Lindo/LindoFormTrigger.node');
const { LindoFormWebhookApi } = require('../dist/credentials/LindoFormWebhookApi.credentials');
const { LindoOAuth2Api } = require('../dist/credentials/LindoOAuth2Api.credentials');

test('success and continued errors preserve input item linking', async () => {
  let calls = 0;
  const result = await new Lindo().execute.call({
    getInputData: () => [{json:{}}, {json:{}}, {json:{}}],
    getNodeParameter: name => ({resource:'credits',operation:'get',authentication:'apiKey'})[name],
    continueOnFail: () => true,
    helpers: { httpRequestWithAuthentication: async () => {
      if (++calls === 2) throw new Error('API failed');
      return {result:{balance:calls}};
    }},
  });
  assert.deepEqual(result[0].map(x => x.pairedItem), [{item:0},{item:1},{item:2}]);
  assert.equal(result[0][1].json.error, 'API failed');
});

test('webhook deletion surfaces API failure and succeeds when accepted', async () => {
  const context = {
    getNodeWebhookUrl: () => 'https://example.com/webhook',
    getNodeParameter: () => 'apiKey',
    helpers: {httpRequestWithAuthentication: async () => {throw new Error('Unauthorized');}},
  };
  const remove = new LindoTrigger().webhookMethods.default.delete;
  await assert.rejects(remove.call(context), /Unauthorized/);
  context.helpers.httpRequestWithAuthentication = async () => ({});
  assert.equal(await remove.call(context), true);
});

test('all node and credential icon variants are packaged SVG files', () => {
  for (const [instance, directory] of [
    [new Lindo(), 'nodes/Lindo'], [new LindoTrigger(), 'nodes/Lindo'],
    [new LindoFormTrigger(), 'nodes/Lindo'], [new LindoFormWebhookApi(), 'credentials'],
    [new LindoApi(), 'credentials'], [new LindoOAuth2Api(), 'credentials'],
  ]) {
    const icons = instance.description?.icon || instance.icon;
    for (const icon of typeof icons === 'string' ? [icons] : [icons.light, icons.dark]) {
      assert.match(icon, /^file:.*\.svg$/);
      const file = path.join(__dirname, '../dist', directory, icon.slice(5));
      assert.match(fs.readFileSync(file,'utf8'), /<svg/);
    }
  }
});

test('OAuth client secret is masked and all option lists are alphabetized', () => {
  assert.equal(new LindoOAuth2Api().properties.find(p=>p.name==='clientSecret').typeOptions.password,true);
  for(const node of [new Lindo(), new LindoTrigger()]) {
    for(const property of node.description.properties) {
      if(!property.options) continue;
      const labels=property.options.map(o=>o.displayName || o.name);
      assert.deepEqual(labels,[...labels].sort((a,b)=>a.localeCompare(b)));
    }
  }
  assert.equal(new Lindo().description.properties.find(p=>p.name==='resource').options.find(o=>o.value==='credits').name,'Credit');
});
