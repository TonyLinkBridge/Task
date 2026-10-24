import{test}from'node:test';import assert from'node:assert/strict';
import{MARKETING_TEST_CLERK as expected,assertMarketingClerkProviders,assertMarketingClerkInstance,normalizeMarketingClerkResponse}from'../../scripts/marketing-login-isolation.mjs';
const providers={clerkAppId:expected.appId,clerkInstanceId:expected.instanceId,clerkPublishableKey:'pk_test_'+Buffer.from(expected.frontend+'$').toString('base64'),clerkSecretKey:'sk_test_not_a_real_key'};
test('real login launcher accepts only the exact dedicated development provider',()=>{
 assert.doesNotThrow(()=>assertMarketingClerkProviders(providers));
 for(const changed of [{clerkAppId:'production'},{clerkSecretKey:'sk_live_never_allowed'},{clerkPublishableKey:'pk_test_'+Buffer.from('another.clerk.accounts.dev$').toString('base64')},{clerkSecretKey:'sk_test_line\nbreak'}])assert.throws(()=>assertMarketingClerkProviders({...providers,...changed}));
 assert.doesNotThrow(()=>assertMarketingClerkInstance({id:expected.instanceId,environment_type:'development'}));
 assert.throws(()=>assertMarketingClerkInstance({id:expected.instanceId,environment_type:'production'}));
});
test('same local middleware hop is removed without removing authentication headers or cookies',()=>{
 const request=new Request(expected.origin+'/marketing?status=in_review',{headers:{host:'127.0.0.1:3219'}});
 const response=new Response(null,{headers:{'x-middleware-rewrite':'http://localhost:3219/marketing?status=in_review','x-clerk-auth-status':'signed-in','x-middleware-override-headers':'x-clerk-auth-status','set-cookie':'test=secure; HttpOnly'}});
 const result=normalizeMarketingClerkResponse(request,response);
 assert.equal(result.headers.get('x-middleware-rewrite'),null);assert.equal(result.headers.get('x-middleware-next'),'1');assert.equal(result.headers.get('x-clerk-auth-status'),'signed-in');assert.match(result.headers.get('set-cookie'),/HttpOnly/);assert.equal(result.headers.get('x-middleware-override-headers'),'x-clerk-auth-status');
});
test('real upstream auth proxy requests and external OAuth redirects remain intact',()=>{
 const request=new Request(expected.origin+'/__clerk/v1/client',{headers:{host:'127.0.0.1:3219'}});
 const target='https://'+expected.frontend+'/v1/client';const response=new Response(null,{headers:{'x-middleware-rewrite':target,location:'https://slack.com/openid/connect/authorize'}});
 normalizeMarketingClerkResponse(request,response);assert.equal(response.headers.get('x-middleware-rewrite'),target);assert.equal(response.headers.get('location'),'https://slack.com/openid/connect/authorize');
 const redirect=new Response(null,{headers:{location:'http://localhost:3219/login?redirect=%2Fmarketing'}});normalizeMarketingClerkResponse(request,redirect);assert.equal(redirect.headers.get('location'),expected.origin+'/login?redirect=%2Fmarketing');
 assert.throws(()=>normalizeMarketingClerkResponse(new Request('https://tasklb.vercel.app/',{headers:{host:'tasklb.vercel.app'}}),response));
});
test('authenticated test entry redirects before rendering and retains Clerk session headers',()=>{
 const request=new Request(expected.origin+'/',{headers:{host:'127.0.0.1:3219'}});
 const response=new Response(null,{headers:{'x-middleware-next':'1','x-clerk-auth-status':'signed-in','set-cookie':'test=session; HttpOnly'}});
 const result=normalizeMarketingClerkResponse(request,response);
 assert.equal(result.status,307);assert.equal(result.headers.get('location'),expected.origin+'/marketing');
 assert.equal(result.headers.get('x-middleware-next'),null);assert.equal(result.headers.get('x-clerk-auth-status'),'signed-in');assert.match(result.headers.get('set-cookie'),/HttpOnly/);
 const login=new Response(null,{status:307,headers:{location:expected.origin+'/login?redirect=%2F'}});
 assert.equal(normalizeMarketingClerkResponse(request,login).headers.get('location'),expected.origin+'/login?redirect=%2F');
});
