import{getReadyMarketingMotion}from'./motion-runtime';
export const ROUTE_EXIT_SECONDS=.18;
export function captureRouteSnapshot(main:HTMLElement,targetPath:string){
 const rect=main.getBoundingClientRect();
 const top=Math.max(0,rect.top);
 const mask=document.createElement('div');
 mask.dataset.marketingRouteSnapshot=targetPath;
 mask.setAttribute('aria-hidden','true');mask.setAttribute('inert','');
 Object.assign(mask.style,{position:'fixed',top:`${top}px`,left:`${rect.left}px`,width:`${rect.width}px`,height:`${Math.max(0,Math.min(rect.bottom,window.innerHeight)-top)}px`,overflow:'hidden',pointerEvents:'none',zIndex:'10',contain:'layout paint'});
 const copy=main.cloneNode(true) as HTMLElement;
 const originalFields=main.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('input,textarea,select');
 const copiedFields=copy.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('input,textarea,select');
 originalFields.forEach((field,i)=>{const clone=copiedFields[i];if(!clone)return;clone.value=field.value;clone.scrollTop=field.scrollTop;if(field instanceof HTMLInputElement&&clone instanceof HTMLInputElement)clone.checked=field.checked;});
 for(const node of [copy,...copy.querySelectorAll<HTMLElement>('*')]){node.removeAttribute('id');node.removeAttribute('name');node.removeAttribute('for');node.removeAttribute('autofocus');}
 copy.querySelectorAll('script,iframe,object,embed').forEach(node=>node.remove());
 copy.querySelectorAll('video,audio').forEach(node=>{node.removeAttribute('autoplay');node.setAttribute('preload','none');});
 Object.assign(copy.style,{margin:'0',width:`${rect.width}px`,transform:`translateY(${rect.top-top}px)`});
 mask.append(copy);
 let timer:ReturnType<typeof setTimeout>|undefined;
 let tween:{kill():void}|undefined;
 const dispose=()=>{if(timer)clearTimeout(timer);tween?.kill();mask.remove();};
 return {targetPath,mount(parent:HTMLElement){parent.append(mask);},dispose,play(parent:HTMLElement){
  parent.append(mask);
  const done=()=>dispose();
  const gsap=getReadyMarketingMotion();
  if(gsap)tween=gsap.fromTo(mask,{opacity:1,y:0},{opacity:0,y:-8,duration:ROUTE_EXIT_SECONDS,ease:'power2.in',onComplete:done});
  else mask.animate?.([{opacity:1,translate:'0 0'},{opacity:0,translate:'0 -8px'}],{duration:180,easing:'cubic-bezier(.333333,0,.666667,0)',fill:'forwards'});
  timer=setTimeout(done,220);
 }};
}
export type RouteSnapshot=ReturnType<typeof captureRouteSnapshot>;
