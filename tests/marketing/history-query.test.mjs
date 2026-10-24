import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMarketingTestClient } from './runtime/local-database.mjs';

test('isolated history resolves delivery content titles and actor names', async () => {
  const { client, close } = await createMarketingTestClient();
  try {
    const id = '55555555-5555-4555-8555-555555555555';
    const created = await client.rpc('create_scheduled_content', { p_id: id, p_title: '历史检查样本', p_author_id: 'marketing_employee', p_assignee_id: 'marketing_employee', p_publish_at: '2026-11-01T00:00:00Z', p_platform_ids: ['11111111-1111-4111-8111-111111111111'] });
    assert.equal(created.error, null);
    const delivery = await client.from('slack_deliveries').insert({ delivery_key: 'isolated-history-check', event_type: 'submitted', content_id: id, channel_id: 'local-only', payload: {}, scheduled_for: '2026-11-01T00:00:00Z', status: 'cancelled' });
    assert.equal(delivery.error, null);
    const logs = await client.from('slack_deliveries').select('id, content:contents(title)');
    assert.equal(logs.error, null);
    assert.equal(logs.data[0].content.title, '历史检查样本');
    const audit = await client.from('audit_events').insert({ actor_id: 'marketing_admin_a', entity_type: 'content', entity_id: id, action: 'approved' });
    assert.equal(audit.error, null);
    const events = await client.from('audit_events').select('id, actor:profiles!audit_events_actor_id_fkey(display_name)').eq('action', 'approved');
    assert.equal(events.error, null);
    assert.equal(events.data[0].actor.display_name, '测试管理员 A');
  } finally { await close(); }
});
