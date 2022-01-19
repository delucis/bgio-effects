import{a as t,j as s,b as l,R as h,E as g,F as u}from"./vendor.493dee82.js";/* empty css              */const o={topLeft:t("circle",{r:"7",cx:"25",cy:"25"}),topRight:t("circle",{r:"7",cx:"75",cy:"25"}),centre:t("circle",{r:"7",cx:"50",cy:"50"}),bottomLeft:t("circle",{r:"7",cx:"25",cy:"75"}),bottomRight:t("circle",{r:"7",cx:"75",cy:"75"})},v=[t("svg",{viewBox:"0 0 100 100",className:"jk-pip-face",children:o.centre}),s("svg",{viewBox:"0 0 100 100",className:"jk-pip-face",children:[o.bottomLeft,o.topRight]}),s("svg",{viewBox:"0 0 100 100",className:"jk-pip-face",children:[o.bottomLeft,o.centre,o.topRight]}),s("svg",{viewBox:"0 0 100 100",className:"jk-pip-face",children:[o.topLeft,o.topRight,o.bottomLeft,o.bottomRight]}),s("svg",{viewBox:"0 0 100 100",className:"jk-pip-face",children:[o.topLeft,o.topRight,o.centre,o.bottomLeft,o.bottomRight]}),s("svg",{viewBox:"0 0 100 100",className:"jk-pip-face",children:[o.topLeft,o.topRight,t("circle",{r:"7",cx:"25",cy:"50"}),t("circle",{r:"7",cx:"75",cy:"50"}),o.bottomLeft,o.bottomRight]})],p=["rotateY(-90deg)","rotateX(-90deg)","rotateY(90deg)","rotateY(0deg)","rotateX(90deg)","rotateX(180deg)"],j=["rotateX(20deg) rotateZ(45deg) rotateY(90deg)","rotateX(110deg) rotateY(45deg)","rotateX(20deg) rotateZ(45deg) rotateY(-90deg)","rotateX(20deg) rotateZ(45deg)","rotateX(-70deg) rotateY(-45deg)","rotateX(-160deg) rotateZ(-45deg)"],x=({dieSize:e="2em",animated:r=!1,face:a=6})=>{const c=v,d=["jk-die"];r&&d.push("jk-die--animated");const i=d.join(" ");return s("div",{className:i,style:{"--jk-die-size":e},"aria-label":`Die showing ${a}`,role:"img",children:[t("div",{className:"jk-shadow","aria-hidden":!0}),s("div",{className:"jk-die-body",style:{transform:j[a-1]},"aria-hidden":!0,children:[t("div",{className:"jk-internal",style:{transform:"rotateZ(0deg)"}}),t("div",{className:"jk-internal",style:{transform:"rotateX(90deg)"}}),t("div",{className:"jk-internal",style:{transform:"rotateY(90deg)"}}),c.map((m,f)=>s(h.Fragment,{children:[t("div",{className:"jk-face",style:{transform:`${p[f]} translateZ(calc(var(--jk-die-size) * .5))`},children:m}),t("div",{className:"jk-inner-face",style:{transform:`${p[f]} translateZ(calc(var(--jk-die-size) * .49))`}})]},f))]})]})},b=l.exports.memo(x),X=(e=1)=>{const[r,a]=l.exports.useState({face:e,animated:!1}),c=l.exports.useCallback(i=>{a({face:i,animated:!0});const m=setTimeout(()=>a({face:i,animated:!1}),1e3);return()=>clearTimeout(m)},[]);return[l.exports.useCallback(i=>t(b,{...i,...r}),[r]),c]},n={setup:()=>({roll:1,score:0}),moves:{roll:(e,r)=>{e.roll=r.random.D6(),e.roll===6&&e.score++}},endIf:e=>e.score>=5},k={effects:{roll:{create:e=>e}}},w={...n,plugins:[g(k)],moves:{...n.moves,roll:(e,r)=>{e.roll=r.random.D6(),r.effects.roll(e.roll),e.roll===6&&e.score++}}},R={effects:{roll:{create:e=>e,duration:1}}},Y={...n,plugins:[g(R)],moves:{...n.moves,roll:(e,r)=>{e.roll=r.random.D6(),r.effects.roll(e.roll),e.roll===6&&e.score++}}},y=e=>{const[r,a]=l.exports.useState(!1);return l.exports.useEffect(()=>{if(e===0)return;a(!0);const c=setTimeout(()=>{a(!1)},1e3);return()=>c&&clearTimeout(c)},[e]),r},N=({score:e})=>{const r=y(e);return t(u,{children:s("label",{children:[s("span",{className:r?"tada":void 0,children:["Sixes: ",t("strong",{children:e})]}),t("progress",{max:5,value:e,children:e})]})})};function B({score:e,moves:r,isGameover:a}){return s("div",{children:[s("p",{children:[s("span",{children:["Rolls: ",t("strong",{children:r})]}),t("br",{}),t(N,{score:e})]}),t("p",{children:a&&t("strong",{children:"You win!"})})]})}export{n as B,Y as G,B as S,w as a,X as u};
