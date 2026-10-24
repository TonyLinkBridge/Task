export const MARKETING_TEST_CLERK = Object.freeze({
 appId:'app_3L8qZznRq1INxJxWedBuT6o99lq',
 instanceId:'ins_3L8qZzogoyNkwbjNByNaQZDnu33',
 frontend:'great-horse-9598.clerk.accounts.dev',
 origin:'http://127.0.0.1:3219',
});

export function assertMarketingClerkProviders(providers){
 if(providers.clerkAppId!==MARKETING_TEST_CLERK.appId||providers.clerkInstanceId!==MARKETING_TEST_CLERK.instanceId)throw Error('MARKETING_TEST_CLERK_ID_MISMATCH');
 for(const [name,prefix]of [['clerkPublishableKey','pk_test_'],['clerkSecretKey','sk_test_']]){
  if(typeof providers[name]!=='string'||!providers[name].startsWith(prefix)||!/^[_A-Za-z0-9=-]+$/.test(providers[name]))throw Error('MARKETING_TEST_CLERK_KEY_REQUIRED');
 }
 if(Buffer.from(providers.clerkPublishableKey.slice(8),'base64').toString()!==MARKETING_TEST_CLERK.frontend+'$')throw Error('MARKETING_TEST_CLERK_FRONTEND_MISMATCH');
}

export function assertMarketingClerkInstance(instance){
 if(instance.id!==MARKETING_TEST_CLERK.instanceId||instance.environment_type!=='development')throw Error('MARKETING_TEST_CLERK_ENVIRONMENT_MISMATCH');
}

// Test-only transport correction; retain all Clerk authentication headers and cookies.
export function normalizeMarketingClerkResponse(request,response){
 const origin=new URL(MARKETING_TEST_CLERK.origin);
 if(request.headers.get('host')!==origin.host)throw Error('MARKETING_TEST_HOST_DENIED');
 if(!response)return response;
 const source=new URL(request.url);
 const local=url=>url.protocol==='http:'&&url.port===origin.port&&['127.0.0.1','localhost'].includes(url.hostname);
 const rewrite=response.headers.get('x-middleware-rewrite');
 if(rewrite){const target=new URL(rewrite);if(local(target)&&target.pathname===source.pathname&&target.search===source.search){response.headers.delete('x-middleware-rewrite');response.headers.set('x-middleware-next','1');}}
 const location=response.headers.get('location');
 if(location){const target=new URL(location,origin);if(local(target)){target.hostname=origin.hostname;response.headers.set('location',target.href);}}
 // Avoid a streamed root-page redirect after the OAuth callback in this preview.
 // Authentication has already run; preserve its headers and any login/upstream redirect.
 if(source.pathname==='/'&&response.headers.get('x-clerk-auth-status')==='signed-in'&&!response.headers.get('location')&&!response.headers.get('x-middleware-rewrite')){
  const headers=new Headers(response.headers);headers.delete('x-middleware-next');headers.set('location',origin.href+'marketing');
  return new Response(null,{status:307,headers});
 }
 return response;
}
