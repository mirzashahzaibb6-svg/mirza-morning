const P=[
{n:"Gulabi Kashmiri Chai",d:"Rose, almond and pistachio",p:650,i:"images/gulabi-chai.jpg"},
{n:"Pu-erh & Jasmine Tea",d:"Aged leaf with a floral finish",p:550,i:"images/pu-erh-tea.jpg"},
{n:"Karak Cup Art",d:"Strong, spiced and frothed",p:450,i:"images/karak-art.jpg"},
{n:"Rosetta Latte",d:"Silky milk over a double shot",p:700,i:"images/rosetta-latte.jpg"},
{n:"Glass Cappuccino",d:"Cocoa dust and thick crema",p:600,i:"images/glass-cappuccino.jpg"},
{n:"Cinnamon Cappuccino",d:"Warm spice, slow pour",p:650,i:"images/cinnamon-cappuccino.jpg"},
{n:"Cardamom Latte",d:"Star anise, stovetop brew",p:680,i:"images/cardamom-latte.jpg"}];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
/* storage with fallback */
const mem={};const S={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return mem[k]??d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){mem[k]=v}}};
let user=S.get("mm_session",null),cart=S.get("mm_cart",{}),pending=null,cur=4;
/* loader */
let n=0;const rg=$("#rg"),pct=$("#pct");
const tick=setInterval(()=>{n+=Math.random()*5+2;if(n>=100){n=100;clearInterval(tick);setTimeout(()=>{$("#loader").classList.add("done");setTimeout(()=>{document.body.classList.add("ready");startBurst()},500);setTimeout(()=>$("#loader").remove(),1400)},350)}rg.style.strokeDashoffset=440*(1-n/100);pct.textContent=Math.floor(n)+"%"},60);

/* parallax + scroll */
function onScroll(){$(".top").classList.toggle("sc",scrollY>40);let on="home";["home","about","menu","contact"].forEach(s=>{if($("#"+s).getBoundingClientRect().top<innerHeight*.5)on=s});$$(".links a").forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+on))}
addEventListener("scroll",onScroll,{passive:true});onScroll();
/* coverflow */
const cf=$("#cf");
P.forEach((p,i)=>{const d=document.createElement("div");d.className="it";d.innerHTML=`<div class="in"><img src="${p.i}" alt="${p.n}"></div><span class="tag">Rs ${p.p}</span>`;d.onclick=()=>{cur=i;layout()};
d.addEventListener("mousemove",e=>{if(i!==cur)return;const r=d.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5,c=d.firstChild.style;c.setProperty("--ry",x*24+"deg");c.setProperty("--rx",-y*24+"deg")});
d.addEventListener("mouseleave",()=>{d.firstChild.style.setProperty("--ry","0deg");d.firstChild.style.setProperty("--rx","0deg")});cf.appendChild(d)});
function layout(){const w=innerWidth<760?120:250;$$(".it").forEach((d,i)=>{const o=i-cur,a=Math.abs(o);d.style.transform=`translateX(${o*w}px) translateZ(${-a*180}px) rotateY(${-o*32}deg) scale(${a?.9:1.08})`;d.style.opacity=a>2?0:1-a*.28;d.style.zIndex=10-a;d.style.pointerEvents=a>2?"none":"auto";d.style.filter=a?`brightness(${1-a*.22})`:"none"});
const p=P[cur];$("#info").innerHTML=`<h3>${p.n}</h3><p>${p.d} · Rs ${p.p}</p><button class="cta" id="add">Add to cart</button>`;$("#add").onclick=()=>addCart(cur)}
$("#prev").onclick=()=>{cur=Math.max(0,cur-1);layout()};$("#next").onclick=()=>{cur=Math.min(P.length-1,cur+1);layout()};
let sx=null;cf.addEventListener("pointerdown",e=>sx=e.clientX);cf.addEventListener("pointerup",e=>{if(sx!==null&&Math.abs(e.clientX-sx)>50){cur=Math.max(0,Math.min(P.length-1,cur+(e.clientX<sx?1:-1)));layout()}sx=null});
let wl=0;cf.addEventListener("wheel",e=>{const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if((d>0&&cur<P.length-1)||(d<0&&cur>0)){e.preventDefault();if(Date.now()-wl>380){wl=Date.now();cur+=d>0?1:-1;layout()}}},{passive:false});
addEventListener("resize",layout);layout();
/* toast */
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("s");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("s"),2400)}
/* cart */
function addCart(i){if(!user){pending=i;openAuth();return}cart[i]=(cart[i]||0)+1;S.set("mm_cart",cart);renderCart();toast(P[i].n+" added to cart")}
function renderCart(){const ks=Object.keys(cart);$("#cnt").textContent=ks.reduce((a,k)=>a+cart[k],0);let t=0;
$("#lines").innerHTML=ks.length?ks.map(k=>{const p=P[k];t+=p.p*cart[k];return`<div class="ln"><img src="${p.i}" alt=""><div>${p.n}<small>Rs ${p.p}</small></div><div class="q"><button data-k="${k}" data-v="-1" aria-label="Remove one">−</button><span>${cart[k]}</span><button data-k="${k}" data-v="1" aria-label="Add one">+</button></div></div>`}).join(""):"<p style='opacity:.6;padding-top:20px'>Your cart is empty. Add a cup from the menu.</p>";
$("#tot").textContent="Rs "+t}
$("#lines").onclick=e=>{const b=e.target.closest("button");if(!b)return;const k=b.dataset.k;cart[k]+=+b.dataset.v;if(cart[k]<1)delete cart[k];S.set("mm_cart",cart);renderCart()};
$("#cartb").onclick=()=>$("#drawer").classList.add("open");$("#cx").onclick=()=>$("#drawer").classList.remove("open");
$("#co").onclick=()=>{if(!user){$("#drawer").classList.remove("open");openAuth();return}if(!Object.keys(cart).length)return toast("Add a cup first");cart={};S.set("mm_cart",cart);renderCart();$("#drawer").classList.remove("open");toast("Order placed. Thank you, "+user.name.split(" ")[0]+"!")}
/* auth (browser-side demo backend) */
let mode="in";
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,"0")).join("");
function openAuth(){$("#auth").classList.add("open");$("#err").textContent=""}
function setMode(m){mode=m;$$(".tabs button").forEach(b=>b.classList.toggle("on",b.dataset.m===m));$("#nm").style.display=m==="up"?"block":"none";$("#go").textContent=m==="up"?"Create account":"Log in";$("#pw").autocomplete=m==="up"?"new-password":"current-password"}
$$(".tabs button").forEach(b=>b.onclick=()=>setMode(b.dataset.m));
$("#ax").onclick=()=>{$("#auth").classList.remove("open");pending=null};
$("#userb").onclick=()=>{if(user){user=null;S.set("mm_session",null);paint();toast("Logged out")}else openAuth()};
function paint(){$("#userb").textContent=user?user.name.split(" ")[0]+" · Log out":"Login / Register"}
$("#go").onclick=async()=>{const em=$("#em").value.trim().toLowerCase(),pw=$("#pw").value,nm=$("#nm").value.trim(),err=$("#err"),U=S.get("mm_users",{});
if(!/^\S+@\S+\.\S+$/.test(em))return err.textContent="Enter a valid email address.";
if(pw.length<6)return err.textContent="Password must be at least 6 characters.";
const h=await hash(pw);
if(mode==="up"){if(!nm)return err.textContent="Enter your name.";if(U[em])return err.textContent="This email already has an account. Log in instead.";U[em]={name:nm,h};S.set("mm_users",U);user={name:nm,email:em}}
else{if(!U[em]||U[em].h!==h)return err.textContent="Email or password is incorrect.";user={name:U[em].name,email:em}}
S.set("mm_session",user);paint();$("#auth").classList.remove("open");toast("Welcome, "+user.name.split(" ")[0]);
if(pending!==null){const i=pending;pending=null;addCart(i)}};
paint();renderCart();

/* hero: a glass bowl floats in the air, beans rise out of it and return into it on scroll */
const home=$("#home"),hbg=$("#hbg"),steam=$("#mouth"),bb=$("#bb"),bf=$("#bf"),bi=$("#bi"),heap=$("#heap"),bc=$("#beans"),shd=$("#shd"),hc=$(".hc"),scr=$(".scr"),beans=[];
let bt0=0,pc=0,bx=0,by=0,bk=1;const IW=678,IH=452,CX=.715,CY=.29,NB=26;
function place(){const W=innerWidth,H=innerHeight,d=W>860,s=Math.max(H/IH*1.04,d?0:W*2.2/IW),rw=IW*s,rh=IH*s,tx=d?W*.78:W*.5,ty=d?H*.42:H*.3;
const ox=rw<W?W-rw:Math.min(0,Math.max(W-rw,tx-CX*rw)),oy=Math.min(0,Math.max(H-rh,ty-CY*rh));
Object.assign(hbg.style,{width:rw+"px",height:rh+"px",left:ox+"px",top:oy+"px",transformOrigin:(CX*rw)+"px "+(CY*rh)+"px"});
steam.style.transform=`translate(${ox+CX*rw}px,${oy+CY*rh}px)`;
const bw=Math.min(290,W*(d?.25:.62));bk=bw/320;bx=d?W*.495:W*.5;by=d?H*.56:H*.7;
[bb,bf].forEach(e=>{e.style.width=bw+"px";e.style.height=bw*.75+"px";e.style.left=(bx-bw/2)+"px";e.style.top=(by-120*bk)+"px"});
heap.style.left=bx+"px";heap.style.top=by+"px";shd.style.width=bw*.9+"px";shd.style.left=(bx-bw*.45)+"px";shd.style.top=(by+160*bk)+"px"}
(function(){const h=[];for(let i=0;i<26;i++){const x=(Math.random()*2-1)*88;h.push({x,y:-50-12*(1-Math.pow(x/95,2))+Math.random()*24,r:Math.random()*360})}h.sort((a,b)=>a.y-b.y);
heap.innerHTML=h.map(b=>`<div class="pb" style="transform:translate(${b.x}px,${b.y}px) translate(-50%,-50%) rotate(${b.r}deg) scale(.55)"></div>`).join("")})();
addEventListener("resize",place);hbg.complete?place():hbg.onload=place;place();
for(let i=0;i<NB;i++){const el=document.createElement("div");el.className="bean";bc.appendChild(el);const d=Math.random(),up=Math.random()<.85;
beans.push({el,d,inn:0,a:up?-Math.PI*(.03+Math.random()*.94):Math.PI*(Math.random()<.5?Math.random()*.15:.85+Math.random()*.15),r:.22+Math.random()*.62,size:.55+d*.9,arc:60+Math.random()*150,sw:(Math.random()-.5)*160,sp:.5+Math.random()*.8,ph:Math.random()*6.28,wa:10+Math.random()*16,rx:Math.random()*360,ry:Math.random()*360,rz:Math.random()*360,vx:(Math.random()-.5)*90,vy:(Math.random()-.5)*90,vz:(Math.random()-.5)*160});
if(d>.85)el.style.filter="blur(1.5px)"}
function startBurst(){bt0=performance.now()}
function frame(now){const H=Math.max(1,home.offsetHeight-innerHeight),tp=cl(scrollY/H);pc+=(tp-pc)*.07;const p=pc,t=now/1000,W=innerWidth,U=Math.min(W,innerHeight*1.5)*.5;
const intro=bt0?1-Math.pow(1-cl((now-bt0)/1400),3):0,fx=Math.sin(t*.5)*4,fy=Math.sin(t*1.05)*10+(1-intro)*70,fr=Math.sin(t*.75)*1.4,tf=`translate(${fx}px,${fy}px) rotate(${fr}deg)`;
bb.style.transform=bf.style.transform=tf;heap.style.transform=tf+` scale(${bk})`;bb.style.opacity=bf.style.opacity=heap.style.opacity=intro;
shd.style.transform=`scale(${1-fy*.012})`;shd.style.opacity=intro*(.75+fy*.012);
const mx=bx+fx,my=by+fy-52*bk;
beans.forEach((o,i)=>{let x0=0,E=0;if(bt0){x0=cl((now-bt0-650-i*42)/1700);E=1-Math.pow(1-x0,3)}
const bp=cl((p*1.3-.06-i*.032)/.32),e=bp<.5?4*bp*bp*bp:1-Math.pow(-2*bp+2,3)/2,ey=Math.pow(e,2.2);
let sx=Math.cos(o.a)*o.r*U*1.25,sy=Math.sin(o.a)*o.r*U*.85;sx=Math.min(Math.max(sx,-(mx-W*.2)),W-mx-30);sy=Math.max(sy,-(my-110));
if(sy>-30*bk&&Math.abs(sx)<135*bk)sx=(sx<0?-1:1)*135*bk;
const x=mx+sx*E*(1-e)+Math.sin(t*o.sp+o.ph)*o.wa*x0*(1-e)+Math.sin(bp*Math.PI)*o.sw,
y=my+16*bk*(1-E)+sy*E*(1-ey)-Math.sin(Math.PI*x0)*o.arc*(1-ey)+Math.cos(t*o.sp*.8+o.ph)*o.wa*x0*(1-e)-Math.sin(bp*Math.PI)*50+26*bk*ey;
const sc=o.size*(.2+.8*E)*(1-.4*e),op=(bt0?Math.min(1,x0*8)*(1-cl((ey-.8)/.2)):0)*(o.d<.3?.85:1),k=1+(1-x0)*3;
const inner=x0<.08||ey>.7;if(inner!==!!o.inn){o.inn=inner;(inner?bi:bc).appendChild(o.el)}
o.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%) rotateZ(${o.rz+t*o.vz*k}deg) rotateX(${o.rx+t*o.vx*k}deg) rotateY(${o.ry+t*o.vy*k}deg) scale(${sc})`;o.el.style.opacity=op});
hbg.style.transform=`scale(${1+p*.15})`;steam.style.opacity=Math.max(0,1-p*2);
hc.style.opacity=Math.max(0,1-p*3.2);hc.style.transform=`translateY(${-p*140}px)`;hc.style.pointerEvents=p>.25?"none":"";scr.style.opacity=Math.max(0,.8-p*6);
requestAnimationFrame(frame)}
requestAnimationFrame(frame);
/* scroll reveals + grid view */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("shown");io.unobserve(e.target)}}),{threshold:.18});
$$(".rv").forEach(el=>io.observe(el));
$("#grid").innerHTML=P.map((p,i)=>`<div class="gc"><img src="${p.i}" alt="${p.n}"><div class="gb"><h4>${p.n}</h4><p>${p.d}</p><div class="gr"><b>Rs ${p.p}</b><button class="cta" data-i="${i}">Add to cart</button></div></div></div>`).join("");
$("#grid").onclick=e=>{const b=e.target.closest("button");if(b)addCart(+b.dataset.i)};
$$(".vt button").forEach(b=>b.onclick=()=>{$$(".vt button").forEach(x=>x.classList.toggle("on",x===b));const g=b.dataset.v==="g";$("#menu").classList.toggle("g",g);$$(".gc").forEach(c=>{c.classList.remove("shown");io.unobserve(c);if(g)io.observe(c)})});
/* lower sections: marquee, pinned side-scroll gallery, drawn step line, parallax beans */
$("#mq").innerHTML=("TIGER-STRIPE CREMA<b></b>SLOW POURED<b></b>MADE FRESH<b></b>").repeat(6);
$("#track").innerHTML=P.map(p=>`<div class="gi"><div class="gim"><img src="${p.i}" alt="${p.n}"></div><h4>${p.n}</h4><span>Rs ${p.p}</span></div>`).join("");
const gal=$("#gal"),track=$("#track"),gfill=$("#gfill"),steps=$("#steps"),sfill=$("#sfill"),sdot=$("#sdot"),stp=$$(".stp"),gis=$$(".gi"),pars=$$("[data-par]");let sched=0;
const cl=v=>Math.min(1,Math.max(0,v));
function lower(){sched=0;const h=innerHeight,w=innerWidth;
const g=gal.getBoundingClientRect(),gp=cl(-g.top/(gal.offsetHeight-h));track.style.transform=`translateX(${-gp*Math.max(0,track.scrollWidth-w)}px)`;gfill.style.transform=`scaleX(${gp})`;
gis.forEach(c=>{const r=c.getBoundingClientRect(),d=Math.abs(r.left+r.width/2-w/2)/w,s=1.06-d*.3;c.style.transform=`scale(${Math.max(.8,s)})`;c.style.opacity=Math.max(.45,1-d*.9)});
const r=steps.getBoundingClientRect(),sp=cl((h*.7-r.top-r.height*.15)/(r.height*.55));sfill.style.transform=`scaleX(${sp})`;sdot.style.left=sp*100+"%";stp.forEach((s,i)=>s.classList.toggle("on",sp>=[.02,.5,.97][i]||(w<=860&&r.top<h*(.7-i*.12))));
pars.forEach(el=>{const q=el.getBoundingClientRect();el.style.transform=`translateY(${(q.top+q.height/2-h/2)*-el.dataset.par}px) rotate(${(q.top-h/2)*.12}deg)`})}
addEventListener("scroll",()=>{if(!sched){sched=1;requestAnimationFrame(lower)}},{passive:true});addEventListener("resize",lower);lower();