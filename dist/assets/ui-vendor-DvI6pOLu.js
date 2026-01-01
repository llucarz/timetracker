import{r as ke,g as Se,a as je}from"./react-vendor-K2gBt1py.js";function Ue(e,t){for(var n=0;n<t.length;n++){const r=t[n];if(typeof r!="string"&&!Array.isArray(r)){for(const o in r)if(o!=="default"&&!(o in e)){const i=Object.getOwnPropertyDescriptor(r,o);i&&Object.defineProperty(e,o,i.get?i:{enumerable:!0,get:()=>r[o]})}}}return Object.freeze(Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}))}var X={exports:{}},D={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var ie;function Be(){if(ie)return D;ie=1;var e=ke(),t=Symbol.for("react.element"),n=Symbol.for("react.fragment"),r=Object.prototype.hasOwnProperty,o=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,i={key:!0,ref:!0,__self:!0,__source:!0};function s(c,f,l){var d,v={},h=null,p=null;l!==void 0&&(h=""+l),f.key!==void 0&&(h=""+f.key),f.ref!==void 0&&(p=f.ref);for(d in f)r.call(f,d)&&!i.hasOwnProperty(d)&&(v[d]=f[d]);if(c&&c.defaultProps)for(d in f=c.defaultProps,f)v[d]===void 0&&(v[d]=f[d]);return{$$typeof:t,type:c,key:h,ref:p,props:v,_owner:o.current}}return D.Fragment=n,D.jsx=s,D.jsxs=s,D}var ce;function ze(){return ce||(ce=1,X.exports=Be()),X.exports}var O=ze(),a=ke();const He=Se(a),Ce=Ue({__proto__:null,default:He},[a]);function xe(e){var t,n,r="";if(typeof e=="string"||typeof e=="number")r+=e;else if(typeof e=="object")if(Array.isArray(e)){var o=e.length;for(t=0;t<o;t++)e[t]&&(n=xe(e[t]))&&(r&&(r+=" "),r+=n)}else for(n in e)e[n]&&(r&&(r+=" "),r+=n);return r}function Qn(){for(var e,t,n=0,r="",o=arguments.length;n<o;n++)(e=arguments[n])&&(t=xe(e))&&(r&&(r+=" "),r+=t);return r}/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),qe=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,n,r)=>r?r.toUpperCase():n.toLowerCase()),se=e=>{const t=qe(e);return t.charAt(0).toUpperCase()+t.slice(1)},Ne=(...e)=>e.filter((t,n,r)=>!!t&&t.trim()!==""&&r.indexOf(t)===n).join(" ").trim();/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var Ke={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye=a.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:n=2,absoluteStrokeWidth:r,className:o="",children:i,iconNode:s,...c},f)=>a.createElement("svg",{ref:f,...Ke,width:t,height:t,stroke:e,strokeWidth:r?Number(n)*24/Number(t):n,className:Ne("lucide",o),...c},[...s.map(([l,d])=>a.createElement(l,d)),...Array.isArray(i)?i:[i]]));/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=(e,t)=>{const n=a.forwardRef(({className:r,...o},i)=>a.createElement(Ye,{ref:i,iconNode:t,className:Ne(`lucide-${Ve(se(e))}`,`lucide-${e}`,r),...o}));return n.displayName=se(e),n};/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],er=y("arrow-right",Xe);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ze=[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]],tr=y("arrow-up-right",Ze);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ge=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],nr=y("calendar",Ge);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Je=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],rr=y("check",Je);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qe=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],or=y("chevron-down",Qe);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const et=[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]],ar=y("chevron-left",et);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tt=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],ir=y("chevron-right",tt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nt=[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]],cr=y("chevron-up",nt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rt=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],sr=y("circle-alert",rt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ot=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],ur=y("circle-check",ot);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const at=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]],lr=y("clock",at);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const it=[["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193",key:"yfwify"}],["path",{d:"M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07",key:"jlfiyv"}]],dr=y("cloud-off",it);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ct=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]],fr=y("download",ct);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const st=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 18v-6",key:"17g6i2"}],["path",{d:"m9 15 3 3 3-3",key:"1npd3o"}]],vr=y("file-down",st);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ut=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],hr=y("info",ut);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lt=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],pr=y("layout-dashboard",lt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dt=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],mr=y("loader-circle",dt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ft=[["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}],["polyline",{points:"10 17 15 12 10 7",key:"1ail0h"}],["line",{x1:"15",x2:"3",y1:"12",y2:"12",key:"v6grx8"}]],yr=y("log-in",ft);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vt=[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]],gr=y("log-out",vt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ht=[["polyline",{points:"15 3 21 3 21 9",key:"mznyad"}],["polyline",{points:"9 21 3 21 3 15",key:"1avn1i"}],["line",{x1:"21",x2:"14",y1:"3",y2:"10",key:"ota7mn"}],["line",{x1:"3",x2:"10",y1:"21",y2:"14",key:"1atl0r"}]],Er=y("maximize-2",ht);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pt=[["polyline",{points:"4 14 10 14 10 20",key:"11kfnr"}],["polyline",{points:"20 10 14 10 14 4",key:"rlmsce"}],["line",{x1:"14",x2:"21",y1:"10",y2:"3",key:"o5lafz"}],["line",{x1:"3",x2:"10",y1:"21",y2:"14",key:"1atl0r"}]],br=y("minimize-2",pt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mt=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]],wr=y("pencil",mt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yt=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],kr=y("rotate-ccw",yt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gt=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],Sr=y("save",gt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Et=[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],Cr=y("settings",Et);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bt=[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]],xr=y("sparkles",bt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wt=[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]],Nr=y("trash-2",wt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kt=[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]],_r=y("trending-up",kt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const St=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],Rr=y("triangle-alert",St);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ct=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]],Or=y("upload",Ct);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xt=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],Pr=y("x",xt);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nt=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],Mr=y("zap",Nt);function ue(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function _e(...e){return t=>{let n=!1;const r=e.map(o=>{const i=ue(o,t);return!n&&typeof i=="function"&&(n=!0),i});if(n)return()=>{for(let o=0;o<r.length;o++){const i=r[o];typeof i=="function"?i():ue(e[o],null)}}}}function V(...e){return a.useCallback(_e(...e),e)}var Re=je();const _t=Se(Re);function Z(e,t,{checkForDefaultPrevented:n=!0}={}){return function(o){if(e?.(o),n===!1||!o.defaultPrevented)return t?.(o)}}function Ar(e,t=[]){let n=[];function r(i,s){const c=a.createContext(s),f=n.length;n=[...n,s];const l=v=>{const{scope:h,children:p,...S}=v,u=h?.[e]?.[f]||c,m=a.useMemo(()=>S,Object.values(S));return O.jsx(u.Provider,{value:m,children:p})};l.displayName=i+"Provider";function d(v,h){const p=h?.[e]?.[f]||c,S=a.useContext(p);if(S)return S;if(s!==void 0)return s;throw new Error(`\`${v}\` must be used within \`${i}\``)}return[l,d]}const o=()=>{const i=n.map(s=>a.createContext(s));return function(c){const f=c?.[e]||i;return a.useMemo(()=>({[`__scope${e}`]:{...c,[e]:f}}),[c,f])}};return o.scopeName=e,[r,Rt(o,...t)]}function Rt(...e){const t=e[0];if(e.length===1)return t;const n=()=>{const r=e.map(o=>({useScope:o(),scopeName:o.scopeName}));return function(i){const s=r.reduce((c,{useScope:f,scopeName:l})=>{const v=f(i)[`__scope${l}`];return{...c,...v}},{});return a.useMemo(()=>({[`__scope${t.scopeName}`]:s}),[s])}};return n.scopeName=t.scopeName,n}function Ot(e){const t=Pt(e),n=a.forwardRef((r,o)=>{const{children:i,...s}=r,c=a.Children.toArray(i),f=c.find(At);if(f){const l=f.props.children,d=c.map(v=>v===f?a.Children.count(l)>1?a.Children.only(null):a.isValidElement(l)?l.props.children:null:v);return O.jsx(t,{...s,ref:o,children:a.isValidElement(l)?a.cloneElement(l,void 0,d):null})}return O.jsx(t,{...s,ref:o,children:i})});return n.displayName=`${e}.Slot`,n}function Pt(e){const t=a.forwardRef((n,r)=>{const{children:o,...i}=n;if(a.isValidElement(o)){const s=Tt(o),c=Lt(i,o.props);return o.type!==a.Fragment&&(c.ref=r?_e(r,s):s),a.cloneElement(o,c)}return a.Children.count(o)>1?a.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var Mt=Symbol("radix.slottable");function At(e){return a.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===Mt}function Lt(e,t){const n={...t};for(const r in t){const o=e[r],i=t[r];/^on[A-Z]/.test(r)?o&&i?n[r]=(...c)=>{const f=i(...c);return o(...c),f}:o&&(n[r]=o):r==="style"?n[r]={...o,...i}:r==="className"&&(n[r]=[o,i].filter(Boolean).join(" "))}return{...e,...n}}function Tt(e){let t=Object.getOwnPropertyDescriptor(e.props,"ref")?.get,n=t&&"isReactWarning"in t&&t.isReactWarning;return n?e.ref:(t=Object.getOwnPropertyDescriptor(e,"ref")?.get,n=t&&"isReactWarning"in t&&t.isReactWarning,n?e.props.ref:e.props.ref||e.ref)}var Dt=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],q=Dt.reduce((e,t)=>{const n=Ot(`Primitive.${t}`),r=a.forwardRef((o,i)=>{const{asChild:s,...c}=o,f=s?n:t;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),O.jsx(f,{...c,ref:i})});return r.displayName=`Primitive.${t}`,{...e,[t]:r}},{});function It(e,t){e&&Re.flushSync(()=>e.dispatchEvent(t))}function I(e){const t=a.useRef(e);return a.useEffect(()=>{t.current=e}),a.useMemo(()=>(...n)=>t.current?.(...n),[])}function Ft(e,t=globalThis?.document){const n=I(e);a.useEffect(()=>{const r=o=>{o.key==="Escape"&&n(o)};return t.addEventListener("keydown",r,{capture:!0}),()=>t.removeEventListener("keydown",r,{capture:!0})},[n,t])}var $t="DismissableLayer",oe="dismissableLayer.update",Wt="dismissableLayer.pointerDownOutside",jt="dismissableLayer.focusOutside",le,Oe=a.createContext({layers:new Set,layersWithOutsidePointerEventsDisabled:new Set,branches:new Set}),Ut=a.forwardRef((e,t)=>{const{disableOutsidePointerEvents:n=!1,onEscapeKeyDown:r,onPointerDownOutside:o,onFocusOutside:i,onInteractOutside:s,onDismiss:c,...f}=e,l=a.useContext(Oe),[d,v]=a.useState(null),h=d?.ownerDocument??globalThis?.document,[,p]=a.useState({}),S=V(t,E=>v(E)),u=Array.from(l.layers),[m]=[...l.layersWithOutsidePointerEventsDisabled].slice(-1),g=u.indexOf(m),b=d?u.indexOf(d):-1,w=l.layersWithOutsidePointerEventsDisabled.size>0,k=b>=g,C=Ht(E=>{const _=E.target,T=[...l.branches].some(Y=>Y.contains(_));!k||T||(o?.(E),s?.(E),E.defaultPrevented||c?.())},h),N=Vt(E=>{const _=E.target;[...l.branches].some(Y=>Y.contains(_))||(i?.(E),s?.(E),E.defaultPrevented||c?.())},h);return Ft(E=>{b===l.layers.size-1&&(r?.(E),!E.defaultPrevented&&c&&(E.preventDefault(),c()))},h),a.useEffect(()=>{if(d)return n&&(l.layersWithOutsidePointerEventsDisabled.size===0&&(le=h.body.style.pointerEvents,h.body.style.pointerEvents="none"),l.layersWithOutsidePointerEventsDisabled.add(d)),l.layers.add(d),de(),()=>{n&&l.layersWithOutsidePointerEventsDisabled.size===1&&(h.body.style.pointerEvents=le)}},[d,h,n,l]),a.useEffect(()=>()=>{d&&(l.layers.delete(d),l.layersWithOutsidePointerEventsDisabled.delete(d),de())},[d,l]),a.useEffect(()=>{const E=()=>p({});return document.addEventListener(oe,E),()=>document.removeEventListener(oe,E)},[]),O.jsx(q.div,{...f,ref:S,style:{pointerEvents:w?k?"auto":"none":void 0,...e.style},onFocusCapture:Z(e.onFocusCapture,N.onFocusCapture),onBlurCapture:Z(e.onBlurCapture,N.onBlurCapture),onPointerDownCapture:Z(e.onPointerDownCapture,C.onPointerDownCapture)})});Ut.displayName=$t;var Bt="DismissableLayerBranch",zt=a.forwardRef((e,t)=>{const n=a.useContext(Oe),r=a.useRef(null),o=V(t,r);return a.useEffect(()=>{const i=r.current;if(i)return n.branches.add(i),()=>{n.branches.delete(i)}},[n.branches]),O.jsx(q.div,{...e,ref:o})});zt.displayName=Bt;function Ht(e,t=globalThis?.document){const n=I(e),r=a.useRef(!1),o=a.useRef(()=>{});return a.useEffect(()=>{const i=c=>{if(c.target&&!r.current){let f=function(){Pe(Wt,n,l,{discrete:!0})};const l={originalEvent:c};c.pointerType==="touch"?(t.removeEventListener("click",o.current),o.current=f,t.addEventListener("click",o.current,{once:!0})):f()}else t.removeEventListener("click",o.current);r.current=!1},s=window.setTimeout(()=>{t.addEventListener("pointerdown",i)},0);return()=>{window.clearTimeout(s),t.removeEventListener("pointerdown",i),t.removeEventListener("click",o.current)}},[t,n]),{onPointerDownCapture:()=>r.current=!0}}function Vt(e,t=globalThis?.document){const n=I(e),r=a.useRef(!1);return a.useEffect(()=>{const o=i=>{i.target&&!r.current&&Pe(jt,n,{originalEvent:i},{discrete:!1})};return t.addEventListener("focusin",o),()=>t.removeEventListener("focusin",o)},[t,n]),{onFocusCapture:()=>r.current=!0,onBlurCapture:()=>r.current=!1}}function de(){const e=new CustomEvent(oe);document.dispatchEvent(e)}function Pe(e,t,n,{discrete:r}){const o=n.originalEvent.target,i=new CustomEvent(e,{bubbles:!1,cancelable:!0,detail:n});t&&o.addEventListener(e,t,{once:!0}),r?It(o,i):o.dispatchEvent(i)}var G=0;function Lr(){a.useEffect(()=>{const e=document.querySelectorAll("[data-radix-focus-guard]");return document.body.insertAdjacentElement("afterbegin",e[0]??fe()),document.body.insertAdjacentElement("beforeend",e[1]??fe()),G++,()=>{G===1&&document.querySelectorAll("[data-radix-focus-guard]").forEach(t=>t.remove()),G--}},[])}function fe(){const e=document.createElement("span");return e.setAttribute("data-radix-focus-guard",""),e.tabIndex=0,e.style.outline="none",e.style.opacity="0",e.style.position="fixed",e.style.pointerEvents="none",e}var J="focusScope.autoFocusOnMount",Q="focusScope.autoFocusOnUnmount",ve={bubbles:!1,cancelable:!0},qt="FocusScope",Kt=a.forwardRef((e,t)=>{const{loop:n=!1,trapped:r=!1,onMountAutoFocus:o,onUnmountAutoFocus:i,...s}=e,[c,f]=a.useState(null),l=I(o),d=I(i),v=a.useRef(null),h=V(t,u=>f(u)),p=a.useRef({paused:!1,pause(){this.paused=!0},resume(){this.paused=!1}}).current;a.useEffect(()=>{if(r){let u=function(w){if(p.paused||!c)return;const k=w.target;c.contains(k)?v.current=k:R(v.current,{select:!0})},m=function(w){if(p.paused||!c)return;const k=w.relatedTarget;k!==null&&(c.contains(k)||R(v.current,{select:!0}))},g=function(w){if(document.activeElement===document.body)for(const C of w)C.removedNodes.length>0&&R(c)};document.addEventListener("focusin",u),document.addEventListener("focusout",m);const b=new MutationObserver(g);return c&&b.observe(c,{childList:!0,subtree:!0}),()=>{document.removeEventListener("focusin",u),document.removeEventListener("focusout",m),b.disconnect()}}},[r,c,p.paused]),a.useEffect(()=>{if(c){pe.add(p);const u=document.activeElement;if(!c.contains(u)){const g=new CustomEvent(J,ve);c.addEventListener(J,l),c.dispatchEvent(g),g.defaultPrevented||(Yt(Qt(Me(c)),{select:!0}),document.activeElement===u&&R(c))}return()=>{c.removeEventListener(J,l),setTimeout(()=>{const g=new CustomEvent(Q,ve);c.addEventListener(Q,d),c.dispatchEvent(g),g.defaultPrevented||R(u??document.body,{select:!0}),c.removeEventListener(Q,d),pe.remove(p)},0)}}},[c,l,d,p]);const S=a.useCallback(u=>{if(!n&&!r||p.paused)return;const m=u.key==="Tab"&&!u.altKey&&!u.ctrlKey&&!u.metaKey,g=document.activeElement;if(m&&g){const b=u.currentTarget,[w,k]=Xt(b);w&&k?!u.shiftKey&&g===k?(u.preventDefault(),n&&R(w,{select:!0})):u.shiftKey&&g===w&&(u.preventDefault(),n&&R(k,{select:!0})):g===b&&u.preventDefault()}},[n,r,p.paused]);return O.jsx(q.div,{tabIndex:-1,...s,ref:h,onKeyDown:S})});Kt.displayName=qt;function Yt(e,{select:t=!1}={}){const n=document.activeElement;for(const r of e)if(R(r,{select:t}),document.activeElement!==n)return}function Xt(e){const t=Me(e),n=he(t,e),r=he(t.reverse(),e);return[n,r]}function Me(e){const t=[],n=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:r=>{const o=r.tagName==="INPUT"&&r.type==="hidden";return r.disabled||r.hidden||o?NodeFilter.FILTER_SKIP:r.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;n.nextNode();)t.push(n.currentNode);return t}function he(e,t){for(const n of e)if(!Zt(n,{upTo:t}))return n}function Zt(e,{upTo:t}){if(getComputedStyle(e).visibility==="hidden")return!0;for(;e;){if(t!==void 0&&e===t)return!1;if(getComputedStyle(e).display==="none")return!0;e=e.parentElement}return!1}function Gt(e){return e instanceof HTMLInputElement&&"select"in e}function R(e,{select:t=!1}={}){if(e&&e.focus){const n=document.activeElement;e.focus({preventScroll:!0}),e!==n&&Gt(e)&&t&&e.select()}}var pe=Jt();function Jt(){let e=[];return{add(t){const n=e[0];t!==n&&n?.pause(),e=me(e,t),e.unshift(t)},remove(t){e=me(e,t),e[0]?.resume()}}}function me(e,t){const n=[...e],r=n.indexOf(t);return r!==-1&&n.splice(r,1),n}function Qt(e){return e.filter(t=>t.tagName!=="A")}var F=globalThis?.document?a.useLayoutEffect:()=>{},en=Ce[" useId ".trim().toString()]||(()=>{}),tn=0;function Tr(e){const[t,n]=a.useState(en());return F(()=>{n(r=>r??String(tn++))},[e]),e||(t?`radix-${t}`:"")}var nn="Portal",rn=a.forwardRef((e,t)=>{const{container:n,...r}=e,[o,i]=a.useState(!1);F(()=>i(!0),[]);const s=n||o&&globalThis?.document?.body;return s?_t.createPortal(O.jsx(q.div,{...r,ref:t}),s):null});rn.displayName=nn;var on=Ce[" useInsertionEffect ".trim().toString()]||F;function Dr({prop:e,defaultProp:t,onChange:n=()=>{},caller:r}){const[o,i,s]=an({defaultProp:t,onChange:n}),c=e!==void 0,f=c?e:o;{const d=a.useRef(e!==void 0);a.useEffect(()=>{const v=d.current;v!==c&&console.warn(`${r} is changing from ${v?"controlled":"uncontrolled"} to ${c?"controlled":"uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`),d.current=c},[c,r])}const l=a.useCallback(d=>{if(c){const v=cn(d)?d(e):d;v!==e&&s.current?.(v)}else i(d)},[c,e,i,s]);return[f,l]}function an({defaultProp:e,onChange:t}){const[n,r]=a.useState(e),o=a.useRef(n),i=a.useRef(t);return on(()=>{i.current=t},[t]),a.useEffect(()=>{o.current!==n&&(i.current?.(n),o.current=n)},[n,o]),[n,r,i]}function cn(e){return typeof e=="function"}var sn=function(e){if(typeof document>"u")return null;var t=Array.isArray(e)?e[0]:e;return t.ownerDocument.body},P=new WeakMap,$=new WeakMap,W={},ee=0,Ae=function(e){return e&&(e.host||Ae(e.parentNode))},un=function(e,t){return t.map(function(n){if(e.contains(n))return n;var r=Ae(n);return r&&e.contains(r)?r:(console.error("aria-hidden",n,"in not contained inside",e,". Doing nothing"),null)}).filter(function(n){return!!n})},ln=function(e,t,n,r){var o=un(t,Array.isArray(e)?e:[e]);W[n]||(W[n]=new WeakMap);var i=W[n],s=[],c=new Set,f=new Set(o),l=function(v){!v||c.has(v)||(c.add(v),l(v.parentNode))};o.forEach(l);var d=function(v){!v||f.has(v)||Array.prototype.forEach.call(v.children,function(h){if(c.has(h))d(h);else try{var p=h.getAttribute(r),S=p!==null&&p!=="false",u=(P.get(h)||0)+1,m=(i.get(h)||0)+1;P.set(h,u),i.set(h,m),s.push(h),u===1&&S&&$.set(h,!0),m===1&&h.setAttribute(n,"true"),S||h.setAttribute(r,"true")}catch(g){console.error("aria-hidden: cannot operate on ",h,g)}})};return d(t),c.clear(),ee++,function(){s.forEach(function(v){var h=P.get(v)-1,p=i.get(v)-1;P.set(v,h),i.set(v,p),h||($.has(v)||v.removeAttribute(r),$.delete(v)),p||v.removeAttribute(n)}),ee--,ee||(P=new WeakMap,P=new WeakMap,$=new WeakMap,W={})}},Ir=function(e,t,n){n===void 0&&(n="data-aria-hidden");var r=Array.from(Array.isArray(e)?e:[e]),o=sn(e);return o?(r.push.apply(r,Array.from(o.querySelectorAll("[aria-live], script"))),ln(r,o,n,"aria-hidden")):function(){return null}},x=function(){return x=Object.assign||function(t){for(var n,r=1,o=arguments.length;r<o;r++){n=arguments[r];for(var i in n)Object.prototype.hasOwnProperty.call(n,i)&&(t[i]=n[i])}return t},x.apply(this,arguments)};function Le(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var o=0,r=Object.getOwnPropertySymbols(e);o<r.length;o++)t.indexOf(r[o])<0&&Object.prototype.propertyIsEnumerable.call(e,r[o])&&(n[r[o]]=e[r[o]]);return n}function dn(e,t,n){if(n||arguments.length===2)for(var r=0,o=t.length,i;r<o;r++)(i||!(r in t))&&(i||(i=Array.prototype.slice.call(t,0,r)),i[r]=t[r]);return e.concat(i||Array.prototype.slice.call(t))}var z="right-scroll-bar-position",H="width-before-scroll-bar",fn="with-scroll-bars-hidden",vn="--removed-body-scroll-bar-size";function te(e,t){return typeof e=="function"?e(t):e&&(e.current=t),e}function hn(e,t){var n=a.useState(function(){return{value:e,callback:t,facade:{get current(){return n.value},set current(r){var o=n.value;o!==r&&(n.value=r,n.callback(r,o))}}}})[0];return n.callback=t,n.facade}var pn=typeof window<"u"?a.useLayoutEffect:a.useEffect,ye=new WeakMap;function mn(e,t){var n=hn(null,function(r){return e.forEach(function(o){return te(o,r)})});return pn(function(){var r=ye.get(n);if(r){var o=new Set(r),i=new Set(e),s=n.current;o.forEach(function(c){i.has(c)||te(c,null)}),i.forEach(function(c){o.has(c)||te(c,s)})}ye.set(n,e)},[e]),n}function yn(e){return e}function gn(e,t){t===void 0&&(t=yn);var n=[],r=!1,o={read:function(){if(r)throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");return n.length?n[n.length-1]:e},useMedium:function(i){var s=t(i,r);return n.push(s),function(){n=n.filter(function(c){return c!==s})}},assignSyncMedium:function(i){for(r=!0;n.length;){var s=n;n=[],s.forEach(i)}n={push:function(c){return i(c)},filter:function(){return n}}},assignMedium:function(i){r=!0;var s=[];if(n.length){var c=n;n=[],c.forEach(i),s=n}var f=function(){var d=s;s=[],d.forEach(i)},l=function(){return Promise.resolve().then(f)};l(),n={push:function(d){s.push(d),l()},filter:function(d){return s=s.filter(d),n}}}};return o}function En(e){e===void 0&&(e={});var t=gn(null);return t.options=x({async:!0,ssr:!1},e),t}var Te=function(e){var t=e.sideCar,n=Le(e,["sideCar"]);if(!t)throw new Error("Sidecar: please provide `sideCar` property to import the right car");var r=t.read();if(!r)throw new Error("Sidecar medium not found");return a.createElement(r,x({},n))};Te.isSideCarExport=!0;function bn(e,t){return e.useMedium(t),Te}var De=En(),ne=function(){},K=a.forwardRef(function(e,t){var n=a.useRef(null),r=a.useState({onScrollCapture:ne,onWheelCapture:ne,onTouchMoveCapture:ne}),o=r[0],i=r[1],s=e.forwardProps,c=e.children,f=e.className,l=e.removeScrollBar,d=e.enabled,v=e.shards,h=e.sideCar,p=e.noRelative,S=e.noIsolation,u=e.inert,m=e.allowPinchZoom,g=e.as,b=g===void 0?"div":g,w=e.gapMode,k=Le(e,["forwardProps","children","className","removeScrollBar","enabled","shards","sideCar","noRelative","noIsolation","inert","allowPinchZoom","as","gapMode"]),C=h,N=mn([n,t]),E=x(x({},k),o);return a.createElement(a.Fragment,null,d&&a.createElement(C,{sideCar:De,removeScrollBar:l,shards:v,noRelative:p,noIsolation:S,inert:u,setCallbacks:i,allowPinchZoom:!!m,lockRef:n,gapMode:w}),s?a.cloneElement(a.Children.only(c),x(x({},E),{ref:N})):a.createElement(b,x({},E,{className:f,ref:N}),c))});K.defaultProps={enabled:!0,removeScrollBar:!0,inert:!1};K.classNames={fullWidth:H,zeroRight:z};var wn=function(){if(typeof __webpack_nonce__<"u")return __webpack_nonce__};function kn(){if(!document)return null;var e=document.createElement("style");e.type="text/css";var t=wn();return t&&e.setAttribute("nonce",t),e}function Sn(e,t){e.styleSheet?e.styleSheet.cssText=t:e.appendChild(document.createTextNode(t))}function Cn(e){var t=document.head||document.getElementsByTagName("head")[0];t.appendChild(e)}var xn=function(){var e=0,t=null;return{add:function(n){e==0&&(t=kn())&&(Sn(t,n),Cn(t)),e++},remove:function(){e--,!e&&t&&(t.parentNode&&t.parentNode.removeChild(t),t=null)}}},Nn=function(){var e=xn();return function(t,n){a.useEffect(function(){return e.add(t),function(){e.remove()}},[t&&n])}},Ie=function(){var e=Nn(),t=function(n){var r=n.styles,o=n.dynamic;return e(r,o),null};return t},_n={left:0,top:0,right:0,gap:0},re=function(e){return parseInt(e||"",10)||0},Rn=function(e){var t=window.getComputedStyle(document.body),n=t[e==="padding"?"paddingLeft":"marginLeft"],r=t[e==="padding"?"paddingTop":"marginTop"],o=t[e==="padding"?"paddingRight":"marginRight"];return[re(n),re(r),re(o)]},On=function(e){if(e===void 0&&(e="margin"),typeof window>"u")return _n;var t=Rn(e),n=document.documentElement.clientWidth,r=window.innerWidth;return{left:t[0],top:t[1],right:t[2],gap:Math.max(0,r-n+t[2]-t[0])}},Pn=Ie(),L="data-scroll-locked",Mn=function(e,t,n,r){var o=e.left,i=e.top,s=e.right,c=e.gap;return n===void 0&&(n="margin"),`
  .`.concat(fn,` {
   overflow: hidden `).concat(r,`;
   padding-right: `).concat(c,"px ").concat(r,`;
  }
  body[`).concat(L,`] {
    overflow: hidden `).concat(r,`;
    overscroll-behavior: contain;
    `).concat([t&&"position: relative ".concat(r,";"),n==="margin"&&`
    padding-left: `.concat(o,`px;
    padding-top: `).concat(i,`px;
    padding-right: `).concat(s,`px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(c,"px ").concat(r,`;
    `),n==="padding"&&"padding-right: ".concat(c,"px ").concat(r,";")].filter(Boolean).join(""),`
  }
  
  .`).concat(z,` {
    right: `).concat(c,"px ").concat(r,`;
  }
  
  .`).concat(H,` {
    margin-right: `).concat(c,"px ").concat(r,`;
  }
  
  .`).concat(z," .").concat(z,` {
    right: 0 `).concat(r,`;
  }
  
  .`).concat(H," .").concat(H,` {
    margin-right: 0 `).concat(r,`;
  }
  
  body[`).concat(L,`] {
    `).concat(vn,": ").concat(c,`px;
  }
`)},ge=function(){var e=parseInt(document.body.getAttribute(L)||"0",10);return isFinite(e)?e:0},An=function(){a.useEffect(function(){return document.body.setAttribute(L,(ge()+1).toString()),function(){var e=ge()-1;e<=0?document.body.removeAttribute(L):document.body.setAttribute(L,e.toString())}},[])},Ln=function(e){var t=e.noRelative,n=e.noImportant,r=e.gapMode,o=r===void 0?"margin":r;An();var i=a.useMemo(function(){return On(o)},[o]);return a.createElement(Pn,{styles:Mn(i,!t,o,n?"":"!important")})},ae=!1;if(typeof window<"u")try{var j=Object.defineProperty({},"passive",{get:function(){return ae=!0,!0}});window.addEventListener("test",j,j),window.removeEventListener("test",j,j)}catch{ae=!1}var M=ae?{passive:!1}:!1,Tn=function(e){return e.tagName==="TEXTAREA"},Fe=function(e,t){if(!(e instanceof Element))return!1;var n=window.getComputedStyle(e);return n[t]!=="hidden"&&!(n.overflowY===n.overflowX&&!Tn(e)&&n[t]==="visible")},Dn=function(e){return Fe(e,"overflowY")},In=function(e){return Fe(e,"overflowX")},Ee=function(e,t){var n=t.ownerDocument,r=t;do{typeof ShadowRoot<"u"&&r instanceof ShadowRoot&&(r=r.host);var o=$e(e,r);if(o){var i=We(e,r),s=i[1],c=i[2];if(s>c)return!0}r=r.parentNode}while(r&&r!==n.body);return!1},Fn=function(e){var t=e.scrollTop,n=e.scrollHeight,r=e.clientHeight;return[t,n,r]},$n=function(e){var t=e.scrollLeft,n=e.scrollWidth,r=e.clientWidth;return[t,n,r]},$e=function(e,t){return e==="v"?Dn(t):In(t)},We=function(e,t){return e==="v"?Fn(t):$n(t)},Wn=function(e,t){return e==="h"&&t==="rtl"?-1:1},jn=function(e,t,n,r,o){var i=Wn(e,window.getComputedStyle(t).direction),s=i*r,c=n.target,f=t.contains(c),l=!1,d=s>0,v=0,h=0;do{if(!c)break;var p=We(e,c),S=p[0],u=p[1],m=p[2],g=u-m-i*S;(S||g)&&$e(e,c)&&(v+=g,h+=S);var b=c.parentNode;c=b&&b.nodeType===Node.DOCUMENT_FRAGMENT_NODE?b.host:b}while(!f&&c!==document.body||f&&(t.contains(c)||t===c));return(d&&Math.abs(v)<1||!d&&Math.abs(h)<1)&&(l=!0),l},U=function(e){return"changedTouches"in e?[e.changedTouches[0].clientX,e.changedTouches[0].clientY]:[0,0]},be=function(e){return[e.deltaX,e.deltaY]},we=function(e){return e&&"current"in e?e.current:e},Un=function(e,t){return e[0]===t[0]&&e[1]===t[1]},Bn=function(e){return`
  .block-interactivity-`.concat(e,` {pointer-events: none;}
  .allow-interactivity-`).concat(e,` {pointer-events: all;}
`)},zn=0,A=[];function Hn(e){var t=a.useRef([]),n=a.useRef([0,0]),r=a.useRef(),o=a.useState(zn++)[0],i=a.useState(Ie)[0],s=a.useRef(e);a.useEffect(function(){s.current=e},[e]),a.useEffect(function(){if(e.inert){document.body.classList.add("block-interactivity-".concat(o));var u=dn([e.lockRef.current],(e.shards||[]).map(we),!0).filter(Boolean);return u.forEach(function(m){return m.classList.add("allow-interactivity-".concat(o))}),function(){document.body.classList.remove("block-interactivity-".concat(o)),u.forEach(function(m){return m.classList.remove("allow-interactivity-".concat(o))})}}},[e.inert,e.lockRef.current,e.shards]);var c=a.useCallback(function(u,m){if("touches"in u&&u.touches.length===2||u.type==="wheel"&&u.ctrlKey)return!s.current.allowPinchZoom;var g=U(u),b=n.current,w="deltaX"in u?u.deltaX:b[0]-g[0],k="deltaY"in u?u.deltaY:b[1]-g[1],C,N=u.target,E=Math.abs(w)>Math.abs(k)?"h":"v";if("touches"in u&&E==="h"&&N.type==="range")return!1;var _=Ee(E,N);if(!_)return!0;if(_?C=E:(C=E==="v"?"h":"v",_=Ee(E,N)),!_)return!1;if(!r.current&&"changedTouches"in u&&(w||k)&&(r.current=C),!C)return!0;var T=r.current||C;return jn(T,m,u,T==="h"?w:k)},[]),f=a.useCallback(function(u){var m=u;if(!(!A.length||A[A.length-1]!==i)){var g="deltaY"in m?be(m):U(m),b=t.current.filter(function(C){return C.name===m.type&&(C.target===m.target||m.target===C.shadowParent)&&Un(C.delta,g)})[0];if(b&&b.should){m.cancelable&&m.preventDefault();return}if(!b){var w=(s.current.shards||[]).map(we).filter(Boolean).filter(function(C){return C.contains(m.target)}),k=w.length>0?c(m,w[0]):!s.current.noIsolation;k&&m.cancelable&&m.preventDefault()}}},[]),l=a.useCallback(function(u,m,g,b){var w={name:u,delta:m,target:g,should:b,shadowParent:Vn(g)};t.current.push(w),setTimeout(function(){t.current=t.current.filter(function(k){return k!==w})},1)},[]),d=a.useCallback(function(u){n.current=U(u),r.current=void 0},[]),v=a.useCallback(function(u){l(u.type,be(u),u.target,c(u,e.lockRef.current))},[]),h=a.useCallback(function(u){l(u.type,U(u),u.target,c(u,e.lockRef.current))},[]);a.useEffect(function(){return A.push(i),e.setCallbacks({onScrollCapture:v,onWheelCapture:v,onTouchMoveCapture:h}),document.addEventListener("wheel",f,M),document.addEventListener("touchmove",f,M),document.addEventListener("touchstart",d,M),function(){A=A.filter(function(u){return u!==i}),document.removeEventListener("wheel",f,M),document.removeEventListener("touchmove",f,M),document.removeEventListener("touchstart",d,M)}},[]);var p=e.removeScrollBar,S=e.inert;return a.createElement(a.Fragment,null,S?a.createElement(i,{styles:Bn(o)}):null,p?a.createElement(Ln,{noRelative:e.noRelative,gapMode:e.gapMode}):null)}function Vn(e){for(var t=null;e!==null;)e instanceof ShadowRoot&&(t=e.host,e=e.host),e=e.parentNode;return t}const qn=bn(De,Hn);var Kn=a.forwardRef(function(e,t){return a.createElement(K,x({},e,{ref:t,sideCar:qn}))});Kn.classNames=K.classNames;function Yn(e,t){return a.useReducer((n,r)=>t[n][r]??n,e)}var Xn=e=>{const{present:t,children:n}=e,r=Zn(t),o=typeof n=="function"?n({present:r.isPresent}):a.Children.only(n),i=V(r.ref,Gn(o));return typeof n=="function"||r.isPresent?a.cloneElement(o,{ref:i}):null};Xn.displayName="Presence";function Zn(e){const[t,n]=a.useState(),r=a.useRef(null),o=a.useRef(e),i=a.useRef("none"),s=e?"mounted":"unmounted",[c,f]=Yn(s,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return a.useEffect(()=>{const l=B(r.current);i.current=c==="mounted"?l:"none"},[c]),F(()=>{const l=r.current,d=o.current;if(d!==e){const h=i.current,p=B(l);e?f("MOUNT"):p==="none"||l?.display==="none"?f("UNMOUNT"):f(d&&h!==p?"ANIMATION_OUT":"UNMOUNT"),o.current=e}},[e,f]),F(()=>{if(t){let l;const d=t.ownerDocument.defaultView??window,v=p=>{const u=B(r.current).includes(CSS.escape(p.animationName));if(p.target===t&&u&&(f("ANIMATION_END"),!o.current)){const m=t.style.animationFillMode;t.style.animationFillMode="forwards",l=d.setTimeout(()=>{t.style.animationFillMode==="forwards"&&(t.style.animationFillMode=m)})}},h=p=>{p.target===t&&(i.current=B(r.current))};return t.addEventListener("animationstart",h),t.addEventListener("animationcancel",v),t.addEventListener("animationend",v),()=>{d.clearTimeout(l),t.removeEventListener("animationstart",h),t.removeEventListener("animationcancel",v),t.removeEventListener("animationend",v)}}else f("ANIMATION_END")},[t,f]),{isPresent:["mounted","unmountSuspended"].includes(c),ref:a.useCallback(l=>{r.current=l?getComputedStyle(l):null,n(l)},[])}}function B(e){return e?.animationName||"none"}function Gn(e){let t=Object.getOwnPropertyDescriptor(e.props,"ref")?.get,n=t&&"isReactWarning"in t&&t.isReactWarning;return n?e.ref:(t=Object.getOwnPropertyDescriptor(e,"ref")?.get,n=t&&"isReactWarning"in t&&t.isReactWarning,n?e.props.ref:e.props.ref||e.ref)}export{gr as $,Nr as A,xr as B,sr as C,Ut as D,er as E,Kt as F,_r as G,wr as H,hr as I,kr as J,Er as K,tr as L,br as M,Cr as N,yr as O,q as P,mr as Q,Ce as R,Sr as S,Rr as T,It as U,fr as V,vr as W,Pr as X,dr as Y,Mr as Z,Or as _,ur as a,pr as a0,_e as b,Qn as c,Ar as d,He as e,Re as f,F as g,I as h,Dr as i,O as j,Tr as k,Z as l,rn as m,Ir as n,Lr as o,Kn as p,or as q,a as r,rr as s,cr as t,V as u,ir as v,ar as w,Xn as x,nr as y,lr as z};
