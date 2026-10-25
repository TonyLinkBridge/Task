import {getReadyMarketingMotion}from'@/features/marketing/motion-runtime';
const flights=new Set<HTMLElement>();
export function clearPermissionFlights(){for(const node of flights)node.remove();flights.clear();}
/** Same permission-to-role flight and neighboring cell ripple as the reference. */
export function animatePermissionChange(cell:HTMLElement,roleId:string,checked:boolean){
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const gsap=getReadyMarketingMotion();if(!gsap)return;
 const scope=cell.closest('.marketing-team');
 const column=Array.from(scope?.querySelectorAll<HTMLElement>('[data-permission-role]')??[]).filter(n=>n.dataset.permissionRole===roleId);
 const rings=column.map(n=>n.querySelector('.tm-cell__ring')).filter(Boolean);
 gsap.fromTo(rings,{opacity:0,scale:.8},{opacity:.5,scale:1.4,duration:.16,stagger:.035,ease:'power2.out'});
 gsap.to(rings,{opacity:0,scale:1.5,duration:.34,delay:.16,stagger:.035,ease:'power2.in'});
 const card=Array.from(scope?.querySelectorAll<HTMLElement>('[data-role-card]')??[]).find(n=>n.dataset.roleCard===roleId);
 const count=card?.querySelector<HTMLElement>('[data-role-count]');if(!count)return;
 let target=count.getBoundingClientRect();const start=cell.getBoundingClientRect();if(target.bottom<0||target.top>innerHeight)target=start;
 const dot=document.createElement('span');dot.className='team-portal tm-dot'+(checked?'':' is-off');dot.setAttribute('aria-hidden','true');
 Object.assign(dot.style,{left:`${start.left+start.width/2-7}px`,top:`${start.top+start.height/2-7}px`,background:checked?'var(--good)':'var(--mk-muted)'});document.body.append(dot);flights.add(dot);
 const x=target.left+target.width/2-(start.left+start.width/2),y=target.top+target.height/2-(start.top+start.height/2),duration=Math.min(.75,.35+Math.hypot(x,y)/2400);
 gsap.fromTo(dot,{scale:.2,opacity:0},{scale:1.15,opacity:1,duration:.18,ease:'back.out(3)'});
 gsap.to(dot,{x,duration,delay:.16,ease:'power2.inOut'});gsap.to(dot,{y,duration,delay:.16,ease:'power3.in'});
 gsap.to(dot,{scale:2.6,opacity:0,delay:duration+.16,duration:.35,ease:'power2.out',onComplete:()=>{dot.remove();flights.delete(dot);}});
 gsap.fromTo(card,{scale:1.035},{scale:1,delay:duration+.16,duration:.6,ease:'back.out(2.4)',clearProps:'transform'});
 window.setTimeout(()=>{dot.remove();flights.delete(dot);},1600);
}
