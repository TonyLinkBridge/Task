export type MotionTween={kill():void};
export type MarketingGsap={
 context(fn:()=>void,scope:Element):{revert():void};
 fromTo(target:unknown,from:Record<string,unknown>,to:Record<string,unknown>):MotionTween;
 to(target:unknown,vars:Record<string,unknown>):MotionTween;
};
let ready:MarketingGsap|undefined;
let loading:Promise<MarketingGsap>|undefined;
export function getReadyMarketingMotion(){return ready;}
export function loadMarketingMotion():Promise<MarketingGsap>{
 if(ready)return Promise.resolve(ready);
 const url='/marketing-assets/motion.mjs';
 return loading??=(import(/* webpackIgnore: true */ url) as Promise<{gsap:MarketingGsap}>).then(module=>ready=module.gsap).catch(error=>{loading=undefined;throw error;});
}
