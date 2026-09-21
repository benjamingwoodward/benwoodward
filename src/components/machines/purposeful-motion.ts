import type { Animate } from "./motion";
import { dockingAngles, type IllustrationId } from "./purposeful-machines";

const ease = (t:number) => { const p=Math.max(0,Math.min(1,t));return p*p*p*(10+p*(-15+6*p)); };
const phase = (t:number,a:number,b:number) => ease((t-a)/(b-a));
const samples = (pose:(t:number)=>Keyframe) => Array.from({length:241},(_,i)=>({offset:i/240,...pose(i/240)}));
const on = "#ff4f1f", off = "#f3f4ef";
function dockPose(t:number) {
  const positions=[[0,115,80],[.17,132,108],[.23,132,108],[.37,132,72],[.57,196,72],[.73,217,108],[.8,217,108],[1,115,80]];
  const i=Math.max(1,positions.findIndex(p=>p[0]>=t));
  const a=positions[i-1],b=positions[i],p=phase(t,a[0],b[0]);
  return dockingAngles(a[1]+(b[1]-a[1])*p,a[2]+(b[2]-a[2])*p);
}

export function animatePurposefulMachine(root:Element, animate:Animate, scene:IllustrationId) {
  const track=(name:string,frames:Keyframe[])=>{const element=root.querySelector(`[data-art="${name}"]`);if(element)animate(element,frames);};
  const lamp=(name:string,start:number,end:number)=>track(name,[{fill:off,offset:0},{fill:off,offset:start},{fill:on,offset:end},{fill:on,offset:1}]);
  if(scene === "financial-systems") {
    const travel=(t:number)=>28+94*phase(t,.02,.30)+124*phase(t,.69,.98);
    track("transaction",samples(t=>({transform:`translate(${travel(t)}px,120px)`})));
    track("scan",samples(t=>({transform:`translateY(${22*phase(t,.35,.56)}px)`,opacity:phase(t,.31,.35)*(1-phase(t,.56,.60))})));
    track("inspection-gate",samples(t=>({transform:`rotate(${-90*phase(t,.57,.69)}deg)`})));
    for(const name of ["inspection-drive-left","inspection-drive-right"])track(name,samples(t=>({transform:`rotate(${(travel(t)-28)/9*180/Math.PI}deg)`})));
    lamp("inspection-indicator",.56,.63);
  } else if(scene === "merchant-connection") {
    track("shoulder",samples(t=>({transform:`rotate(${dockPose(t).shoulder}deg)`})));
    track("elbow",samples(t=>({transform:`rotate(${dockPose(t).elbow}deg)`})));
    track("gripper",samples(t=>{const a=dockPose(t);return{transform:`rotate(${-a.shoulder-a.elbow}deg)`};}));
    track("merchant-waiting",[{visibility:"visible",offset:0,easing:"steps(1,end)"},{visibility:"hidden",offset:.23},{visibility:"hidden",offset:1}]);
    track("merchant-carried",[{visibility:"hidden",offset:0,easing:"steps(1,end)"},{visibility:"visible",offset:.23,easing:"steps(1,end)"},{visibility:"hidden",offset:.73},{visibility:"hidden",offset:1}]);
    track("merchant-seated",[{visibility:"hidden",offset:0,easing:"steps(1,end)"},{visibility:"visible",offset:.73},{visibility:"visible",offset:1}]);
    track("lock",samples(t=>({transform:`rotate(${-90*phase(t,.81,.95)}deg)`})));
    lamp("connected",.93,.99);
  } else if(scene === "outbound-system") {
    track("paper-feed",samples(t=>({transform:`translateY(${75*phase(t,.02,.39)}px)`})));
    track("printed-lines",samples(t=>({strokeDasharray:"1",strokeDashoffset:String(1-phase(t,.06,.23))})));
    track("print-carriage",samples(t=>({transform:`translateX(${38*(phase(t,.04,.24)-phase(t,.28,.39))}px)`})));
    track("mail",samples(t=>({transform:`translate(${120+112*phase(t,.71,.98)}px,${86+33*phase(t,.31,.48)}px)`})));
    track("fold-arm",samples(t=>({transform:`rotate(${-48+48*(phase(t,.4,.51)-phase(t,.62,.70))}deg)`})));
    track("envelope-lines",[{opacity:0,offset:0},{opacity:0,offset:.50},{opacity:1,offset:.60},{opacity:1,offset:1}]);
    for(const name of ["mail-drive-left","mail-drive-right"])track(name,samples(t=>({transform:`rotate(${112/9*180/Math.PI*phase(t,.71,.98)}deg)`})));
    lamp("mail-indicator",.70,.77);
  } else if(scene === "water-measurement") {
    track("probe",samples(t=>({transform:`translateY(${26*phase(t,.04,.36)}px)`})));
    track("probe-shaft",samples(t=>({height:`${26*phase(t,.04,.36)}px`})));
    track("meter-needle",samples(t=>({transform:`rotate(${-65+81*phase(t,.37,.63)+6*Math.sin(Math.max(0,t-.63)*40)*(1-phase(t,.63,.87))*(t>.63?1:0)}deg)`})));
    track("record",samples(t=>({transform:`translateY(${-42*(1-phase(t,.57,.95))}px)`})));
    lamp("measurement-indicator",.51,.59);
  } else {
    // The push jaw and board share their exact travel; the board never levitates.
    const slide=(t:number)=>25*(1-phase(t,.03,.28));
    track("circuit-board",samples(t=>({transform:`translateX(${slide(t)}px)`})));
    track("jig-left",samples(t=>({transform:`translateX(${-8*(1-phase(t,.30,.43))}px)`})));
    track("jig-right",samples(t=>({transform:`translateX(${slide(t)}px)`})));
    // Driver tip reaches the screw at y=122, then withdraws; the spring sleeve overlaps its guide.
    const driverY=(t:number)=>-22+14*(phase(t,.44,.57)-phase(t,.69,.85));
    track("driver",samples(t=>({transform:`translateY(${driverY(t)}px)`})));
    for(const name of ["driver-guide-left","driver-guide-right"])track(name,samples(t=>({height:`${Math.max(0,16+driverY(t))}px`})));
    track("fastener",[{opacity:0,offset:0},{opacity:0,offset:.57},{opacity:1,offset:.68},{opacity:1,offset:1}]);
    lamp("prototype-indicator",.87,.97);
  }
}
