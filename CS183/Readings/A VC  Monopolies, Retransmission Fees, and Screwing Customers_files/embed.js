var DISQUS=function(e){var i={AssertionError:function(c){this.message=c}};i.AssertionError.prototype.toString=function(){return"Assertion Error: "+(this.message||"[no message]")};i.assert=function(c,e){if(!c)throw new i.AssertionError(e);};var m=[];i.define=function(c,l){typeof c==="function"&&(l=c,c="");for(var a=c.split("."),d=a.shift(),f=i,g=(l||function(){return{}}).call({overwrites:function(d){d.__overwrites__=!0;return d}},e);d;)f=f[d]?f[d]:f[d]={},d=a.shift();for(var k in g)g.hasOwnProperty(k)&&
(g.__overwrites__||f[k]!==null&&i.assert(!f.hasOwnProperty(k),"Unsafe attempt to redefine existing module with "+k),f[k]=g[k],m.push(function(d,b){return function(){delete d[b]}}(f,k)));return f};i.use=function(c){return i.define(c)};i.cleanup=function(){for(var c=0;c<m.length;c++)m[c]()};return i}(this);
DISQUS.define(function(e,i){var m=e.document,c=m.getElementsByTagName("head")[0]||m.body,l={running:!1,timer:null,queue:[]};DISQUS.defer=function(a,d){function f(){var d=l.queue;if(d.length===0)l.running=!1,clearInterval(l.timer);for(var a=0,f;f=d[a];a++)f[0]()&&(d.splice(a--,1),f[1]())}l.queue.push([a,d]);f();if(!l.running)l.running=!0,l.timer=setInterval(f,100)};DISQUS.each=function(a,d){var f=a.length,g=Array.prototype.forEach;if(isNaN(f))for(var c in a)a.hasOwnProperty(c)&&d(a[c],c,a);else if(g)g.call(a,
d);else for(g=0;g<f;g++)d(a[g],g,a)};DISQUS.serializeArgs=function(a){var d=[];DISQUS.each(a,function(a,c){a!==i&&d.push(c+(a!==null?"="+encodeURIComponent(a):""))});return d.join("&")};DISQUS.serialize=function(a,d,c){d&&(a+=~a.indexOf("?")?a.charAt(a.length-1)=="&"?"":"&":"?",a+=DISQUS.serializeArgs(d));if(c)return d={},d[(new Date).getTime()]=null,DISQUS.serialize(a,d);d=a.length;return a.charAt(d-1)=="&"?a.slice(0,d-1):a};DISQUS.require=function(a,d,f,g,e){function j(b){if(b.type=="load"||/^(complete|loaded)$/.test(b.target.readyState))g&&
g(),n&&clearTimeout(n),DISQUS.bean.remove(b.target,h,j)}var b=m.createElement("script"),h=b.addEventListener?"load":"readystatechange",n=null;b.src=DISQUS.serialize(a,d,f);b.async=!0;b.charset="UTF-8";(g||e)&&DISQUS.bean.add(b,h,j);e&&(n=setTimeout(function(){e()},2E4));c.appendChild(b);return DISQUS};DISQUS.requireStylesheet=function(a,d,e){var g=m.createElement("link");g.rel="stylesheet";g.type="text/css";g.href=DISQUS.serialize(a,d,e);c.appendChild(g);return DISQUS};DISQUS.requireSet=function(a,
d,c){var e=a.length;DISQUS.each(a,function(a){DISQUS.require(a,{},d,function(){--e===0&&c()})})};DISQUS.injectCss=function(a){var d=m.createElement("style");d.setAttribute("type","text/css");a=a.replace(/\}/g,"}\n");e.location.href.match(/^https/)&&(a=a.replace(/http:\/\//g,"https://"));d.styleSheet?d.styleSheet.cssText=a:d.appendChild(m.createTextNode(a));c.appendChild(d)}});
DISQUS.define("JSON",function(){function e(b){return b<10?"0"+b:b}function i(b){d.lastIndex=0;return d.test(b)?'"'+b.replace(d,function(b){var d=k[b];return typeof d==="string"?d:"\\u"+("0000"+b.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+b+'"'}function m(b,d){var h,a,c,e,n=f,k,o=d[b];o&&typeof o==="object"&&typeof o.toJSON==="function"&&!l&&(o=o.toJSON(b));typeof j==="function"&&(o=j.call(d,b,o));switch(typeof o){case "string":return i(o);case "number":return isFinite(o)?String(o):"null";case "boolean":case "null":return String(o);
case "object":if(!o)return"null";f+=g;k=[];if(Object.prototype.toString.apply(o)==="[object Array]"){e=o.length;for(h=0;h<e;h+=1)k[h]=m(h,o)||"null";c=k.length===0?"[]":f?"[\n"+f+k.join(",\n"+f)+"\n"+n+"]":"["+k.join(",")+"]";f=n;return c}if(j&&typeof j==="object"){e=j.length;for(h=0;h<e;h+=1)a=j[h],typeof a==="string"&&(c=m(a,o))&&k.push(i(a)+(f?": ":":")+c)}else for(a in o)Object.hasOwnProperty.call(o,a)&&(c=m(a,o))&&k.push(i(a)+(f?": ":":")+c);c=k.length===0?"{}":f?"{\n"+f+k.join(",\n"+f)+"\n"+
n+"}":"{"+k.join(",")+"}";f=n;return c}}var c={},l=!1;if(typeof Date.prototype.toJSON!=="function")Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+e(this.getUTCMonth()+1)+"-"+e(this.getUTCDate())+"T"+e(this.getUTCHours())+":"+e(this.getUTCMinutes())+":"+e(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()};var a=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
d=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,f,g,k={"\u0008":"\\b","\t":"\\t","\n":"\\n","\u000c":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},j;c.stringify=function(b,h,d){var a;g=f="";if(typeof d==="number")for(a=0;a<d;a+=1)g+=" ";else typeof d==="string"&&(g=d);if((j=h)&&typeof h!=="function"&&(typeof h!=="object"||typeof h.length!=="number"))throw Error("JSON.stringify");return m("",{"":b})};c.parse=function(b,h){function d(b,
a){var c,e,g=b[a];if(g&&typeof g==="object")for(c in g)Object.hasOwnProperty.call(g,c)&&(e=d(g,c),e!==void 0?g[c]=e:delete g[c]);return h.call(b,a,g)}var c,b=String(b);a.lastIndex=0;a.test(b)&&(b=b.replace(a,function(b){return"\\u"+("0000"+b.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(b.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return c=eval("("+b+")"),
typeof h==="function"?d({"":c},""):c;throw new SyntaxError("JSON.parse");};var b={a:[1,2,3]},h,n;if(Object.toJSON&&Object.toJSON(b).replace(/\s/g,"")==='{"a":[1,2,3]}')h=Object.toJSON;typeof String.prototype.evalJSON==="function"&&(b='{"a":[1,2,3]}'.evalJSON(),b.a&&b.a.length===3&&b.a[2]===3&&(n=function(b){return b.evalJSON()}));(function(){var b=[1,2,3];typeof b.toJSON==="function"&&(b=b.toJSON(),l=!(b&&b.length===3&&b[2]===3))})();if(l||!h||!n)return{stringify:c.stringify,parse:c.parse};return{stringify:h,
parse:n}});
DISQUS.define(function(){function e(a){for(d=1;a=i.shift();)a()}var i=[],m,c=document,l=c.documentElement,a=l.doScroll,d=/^loade|c/.test(c.readyState),f;c.addEventListener&&c.addEventListener("DOMContentLoaded",m=function(){c.removeEventListener("DOMContentLoaded",m,!1);e()},!1);a&&c.attachEvent("onreadystatechange",m=function(){/^c/.test(c.readyState)&&(c.detachEvent("onreadystatechange",m),e())});f=a?function(a){self!=top?d?a():i.push(a):function(){try{l.doScroll("left")}catch(d){return setTimeout(function(){f(a)},50)}a()}()}:
function(a){d?a():i.push(a)};return{domready:f}});
DISQUS.define(function(e,i){function m(){throw Error(Array.prototype.join.call(arguments," "));}function c(b,h,a){if(b.addEventListener)b.addEventListener(h,a,!1);else if(b.attachEvent)b.attachEvent("on"+h,a);else throw Error("No event support.");}var l=e.document,a=DISQUS.use("JSON");if(!(DISQUS!==i&&DISQUS.version&&DISQUS.version()=="__version__")){var d={},f=0;c(e,"message",function(b){var h,c;for(c in d)if(Object.prototype.hasOwnProperty.call(d,c)&&b.origin==d[c].origin){h=!0;break}if(h)switch(h=
a.parse(b.data),(c=d[h.sender])||m("Message from our server but with invalid sender UID:",h.sender),h.scope){case "host":c.onMessage(h.name,h.data);break;case "global":DISQUS.trigger({target:null,sender:c.uid,name:h.name,data:h.data});break;default:m("Message",h.scope,"not supported. Sender:",b.origin)}},!1);c(e,"hashchange",function(){DISQUS.trigger({target:null,sender:e,name:"window.hashchange",data:{hash:e.location.hash}})},!1);c(e,"resize",function(){DISQUS.trigger({target:null,sender:e,name:"window.resize"})},
!1);var g=function(){DISQUS.trigger({target:null,sender:e,name:"window.scroll"})};(function(b,a,d,e){var p=(new Date).getTime();c(b,a,function(){var b=(new Date).getTime();b-p>=e&&(p=b,d())})})(e,"scroll",g,250);(function(b,a,d,e){var p;c(b,a,function(b){p&&clearTimeout(p);p=setTimeout(function(){d(b)},e)})})(e,"scroll",g,300);l.getElementsByTagName("html");c(e,"click",function(){DISQUS.trigger({target:null,sender:e,name:"window.click"})});g=function(b){var a=this;a.isReady=!1;a.uid=f++;a.elem=null;
a.listeners={};a.origin=b.origin;a.target=b.target;a.container=b.container;d[a.uid]=a;a.listen("ready",function(){a.isReady=!0})};g.prototype.load=function(b){var a=l.createElement("iframe");a.setAttribute("style","width:100%; border:none; overflow:hidden; display:none");a.setAttribute("allowTransparency","true");a.setAttribute("frameBorder","0");a.setAttribute("width","100%");a.setAttribute("id","dsq"+this.uid);a.setAttribute("data-disqus-uid",this.uid);a.setAttribute("src",this.target+"#"+this.uid);
c(a,"load",b||function(){a.style.display=""});(l.getElementById(this.container)||l.body).appendChild(a);this.elem=a};g.prototype.listen=function(b,a){this.listeners[b]||(this.listeners[b]=[]);this.listeners[b].push(a)};g.prototype.onMessage=function(b,a){for(var d=this.listeners[b]||[],c=0;c<d.length;c++)d[c](a)};g.prototype.sendMessage=function(b,d){var c=function(b,a,d){return function(){d.elem.contentWindow.postMessage(b,a)}}(a.stringify({scope:"client",data:{eventName:b,data:d}}),this.origin,
this);this.isReady?c():this.listen("ready",c)};g.prototype.getPosition=function(){for(var b=this.elem,a=0,d=0;b;)a+=b.offsetLeft,d+=b.offsetTop,b=b.offsetParent;return{top:d,left:a}};g.prototype.inViewport=function(b){var b=b||this.getPosition(),b=b.top,a=b+this.elem.offsetHeight,d=e.pageYOffset;return!(b>d+e.innerHeight||a<d)};var k=function(b){this.isReady=!1;this.uid=b.uid||f++;this.contents=b.contents;this.container=b.container;this.styles={width:"100%",border:"none",overflow:"hidden"};b.styles=
b.styles||{};for(var a in b.styles)b.styles.hasOwnProperty(a)&&(this.styles[a]=b.styles[a])};k.prototype.load=function(){var b=l.createElement("iframe");b.setAttribute("id","dsq"+this.uid);b.setAttribute("data-disqus-uid",this.uid);b.setAttribute("scrolling","no");for(var a in this.styles)this.styles.hasOwnProperty(a)&&(b.style[a]=this.styles[a]);(l.getElementById(this.container)||l.body).appendChild(b);this.element=b;this.window=b.contentWindow;this.document=this.window.document;this.document.write(this.contents);
this.document.close();if(b=this.document.getElementsByTagName("html")[0])this.element.style.height=b.offsetHeight+"px"};k.prototype.exec=function(b){b.call(this,this.window,this.document)};k.prototype.hide=function(){var b=this.element.style.display;if(b!=="none")this._display=b;this.element.style.display="none"};k.prototype.show=function(){this.element.style.display=this._display||"block"};k.prototype.click=function(b){c(this.document.body,"click",function(a){b(a)})};var j={};return{IFRAME:"__widget_iframe__",
log:function(a){var d=l.getElementById("messages");if(d){var c=l.createElement("p");c.innerHTML=a;d.appendChild(c)}},version:function(){return"__version__"},bind:function(a,d){j[a]||(j[a]=[]);j[a].push(d)},trigger:function(a){if(j[a.name])for(var d=j[a.name],c=0;c<d.length;c++)d[c](a)},Channel:g,Sandbox:k,App:function(a){this.uid=f++;a.call(this)}}}});
DISQUS.define(function(){function e(e){DISQUS.App.call(this,i);this.frame=new DISQUS.Channel({target:"http://mediacdn.disqus.com/1339189988/build/next-switches/client.html",container:e.container,origin:"http://mediacdn.disqus.com"});this.frame.load(function(){})}var i=function(){this.switches={}};e.prototype={constructor:e,fetch:function(e){var c=this,e=e||{},i=e.success;delete e.success;this.frame.listen("switches.received",function(a){c.switches=a;DISQUS.trigger({name:"switches.changed",data:a});
i&&i(a)});this.frame.sendMessage("fetch",e)},enabled:function(e){return this.switches[e]?this.switches[e]:!1}};return{Switches:function(i){return new e(i)}}});
DISQUS.define(function(e){function i(a,c,e,i,j,b){return'<img width="'+a+'" height="'+c+'" alt="'+i+'" src="data:image/'+e+";base64,"+j+'"'+(b?'style="'+b+'"':"")+"/>"}var m=e.document,c=["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",
"TkSuQmCC"],l=["R0lGODlhEAALAPQAAP///z2LqeLt8dvp7u7090GNqz2LqV+fuJ/F1IW2ycrf51aatHWs","waXJ14i4ys3h6FmctUCMqniuw+vz9eHs8fb5+meku+Tu8vT4+cfd5bbT3tbm7PH2+AAA","AAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQu","aW5mbwAh+QQJCwAAACwAAAAAEAALAAAFLSAgjmRpnqSgCuLKAq5AEIM4zDVw03ve27if","DgfkEYe04kDIDC5zrtYKRa2WQgAh+QQJCwAAACwAAAAAEAALAAAFJGBhGAVgnqhpHIeR","vsDawqns0qeN5+y967tYLyicBYE7EYkYAgAh+QQJCwAAACwAAAAAEAALAAAFNiAgjoth","LOOIJAkiGgxjpGKiKMkbz7SN6zIawJcDwIK9W/HISxGBzdHTuBNOmcJVCyoUlk7CEAAh",
"+QQJCwAAACwAAAAAEAALAAAFNSAgjqQIRRFUAo3jNGIkSdHqPI8Tz3V55zuaDacDyIQ+","YrBH+hWPzJFzOQQaeavWi7oqnVIhACH5BAkLAAAALAAAAAAQAAsAAAUyICCOZGme1rJY","5kRRk7hI0mJSVUXJtF3iOl7tltsBZsNfUegjAY3I5sgFY55KqdX1GgIAIfkECQsAAAAs","AAAAABAACwAABTcgII5kaZ4kcV2EqLJipmnZhWGXaOOitm2aXQ4g7P2Ct2ER4AMul00k","j5g0Al8tADY2y6C+4FIIACH5BAkLAAAALAAAAAAQAAsAAAUvICCOZGme5ERRk6iy7qpy","HCVStA3gNa/7txxwlwv2isSacYUc+l4tADQGQ1mvpBAAIfkECQsAAAAsAAAAABAACwAA","BS8gII5kaZ7kRFGTqLLuqnIcJVK0DeA1r/u3HHCXC/aKxJpxhRz6Xi0ANAZDWa+kEAA7","AAAAAAAAAAAA"],
a=function(a){var f=this,g={f:a.forum,t_i:a.identifier,t_u:a.url||e.location.href,t_s:a.slug,t_t:a.title,s_o:a.sortOrder,c:a.useConman};f.settings=a;f.indicators={north:null,south:null};DISQUS.App.call(this,function(){var k=m.getElementById(a.container),j=new DISQUS.Channel({origin:"http://disqus.com",target:DISQUS.serialize("http://disqus.com/next/lounge/client.html",g),container:a.container}),b=!1,h=m.createElement("div");h.innerHTML=i(71,17,"png","DISQUS",c.join(""))+i(16,11,"gif","...",l.join(""),
"margin:0 0 3px 5px");k.appendChild(h);var n=function(){var a=j.getPosition(),c=e.pageYOffset,d=e.innerHeight,f=j.inViewport(a);f?(b=!0,j.sendMessage("window.scroll",{frameOffset:a,pageOffset:c,height:d}),j.sendMessage("window.inViewport")):b&&!f&&(b=!1,j.sendMessage("window.scrollOffViewport"))};j.listen("ready",function(){k.removeChild(h);var b={themeUrl:a.themeUrl,permalink:a.permalink,anchorColor:a.anchorColor,referrer:e.location.href,colorScheme:a.colorScheme,serif:a.serif,remoteAuthS3:a.remoteAuthS3,
apiKey:a.apiKey,sso:a.sso};if(e.navigator.userAgent.match(/(iPad|iPhone|iPod)/))b.width=j.elem.offsetWidth;j.inViewport()&&j.sendMessage("window.inViewport");j.sendMessage("init",b)});j.listen("resize",function(a){j.elem.style.height=a.height+"px"});j.listen("reload",function(){e.location.reload()});j.listen("scrollTo",function(a){var b=j.getPosition(),b=a.relative==="window"?a.top:b.top+a.top;(a.force||!(b>e.pageYOffset&&b<e.pageYOffset+e.innerHeight))&&e.scrollTo(0,b)});j.listen("fakeScroll",n);
j.listen("realtime.init",function(a){for(var b=["north","south"],c,d,e=0;e<b.length;e++)d=b[e],c=new DISQUS.Sandbox({uid:"-indicator-"+d,container:f.settings.container,contents:a[d].contents,styles:a[d].styles}),c.load(),c.hide(),function(a){c.click(function(){j.sendMessage("realtime.click",a)})}(d),f.indicators[d]=c});j.listen("realtime.showNorth",function(a){var b=f.indicators.north;b.document.getElementById("message").innerHTML=a;b.show()});j.listen("realtime.hideNorth",function(){f.indicators.north.hide()});
j.listen("realtime.showSouth",function(a){var b=f.indicators.south;b.document.getElementById("message").innerHTML=a;b.show()});j.listen("realtime.hideSouth",function(){f.indicators.south.hide()});j.load();DISQUS.bind("window.hashchange",function(a){j.sendMessage("window.hashchange",a.data.hash)});DISQUS.bind("window.resize",function(){j.sendMessage("window.resize")});DISQUS.bind("window.scroll",n);DISQUS.bind("window.click",function(){j.sendMessage("window.click")});DISQUS.bind("switches.changed",
function(a){j.sendMessage("switches.changed",a.data)})})};return{Lounge:function(c){return new a(c)}}});
DISQUS.define(function(e){var i=e.document,m=function(c){var l=this;l.settings=c;l.legacyMode=c.legacyMode;DISQUS.App.call(this,function(){i.getElementById(c.container);var a=new DISQUS.Channel({origin:"http://disqus.com",target:"http://disqus.com/next/discovery/client.html",container:c.container});a.listen("ready",function(){a.sendMessage("init",{url:c.url,forum:c.forum,identifier:c.identifier,slug:c.slug,referrer:e.location.href,legacyMode:l.legacyMode})});a.listen("resize",function(c){a.elem.style.height=
c.height+"px"});a.load()})};return{Discovery:function(c){return new m(c)}}});
(function(e,i){function m(){function a(b){var b=b.getAttribute?b.getAttribute("src"):b.src,c=[/https?:\/\/(www\.)?disqus\.com\/forums\/([\w_\-]+)/i,/https?:\/\/(www\.)?([\w_\-]+)\.disqus\.com/i,/https?:\/\/(www\.)?dev\.disqus\.org\/forums\/([\w_\-]+)/i,/https?:\/\/(www\.)?([\w_\-]+)\.dev\.disqus\.org/i],d=c.length;if(!b||b.substring(b.length-8)!="embed.js")return null;for(var e=0;e<d;e++){var f=b.match(c[e]);if(f&&f.length&&f.length==3)return f[2]}return null}for(var b=i.getElementsByTagName("script"),
c=b.length-1;c>=0;c--){var d=a(b[c]);if(d!==null)return d}return null}function c(a,b,d){var f;if(a===i)return"";e.getComputedStyle?f=i.defaultView.getComputedStyle(a,null).getPropertyValue(b):a.currentStyle&&(f=a.currentStyle[b]?a.currentStyle[b]:a.currentStyle[d]);return f=="transparent"||f===""||f=="rgba(0, 0, 0, 0)"?c(a.parentNode,b,d):f||null}function l(a){function b(a){a=Number(a).toString(16);return a.length==1?"0"+a:a}if(a.substr(0,1)==="#")return a;var c=/.*?rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(a);
if(!c||c.length!==4)return"";var a=b(c[1]),d=b(c[2]),c=b(c[3]);return"#"+a+d+c}function a(a,b,d){Object.prototype.toString.call(a)==="[object String]"&&(a=i.createElement(a));var e=null;a.style.visibility="hidden";f.appendChild(a);e=c(a,b,d);f.removeChild(a);return e}var d=e.disqus_container_id||"disqus_thread",f=i.getElementById(d),g=function(){var a=e.location.hash;return(a=a&&a.match(/comment\-([0-9]+)/))&&a[1]}(),k={page:{},callbacks:{},sso:{}};DISQUS.each(["developer","shortname","identifier",
"url","title","category_id","slug","theme_root_url","demo"],function(a){var b=e["disqus_"+a];typeof b!=="undefined"&&(k[a]=b)});if(typeof e.disqus_config==="function")try{e.disqus_config.call(k)}catch(j){}var b=e.disqus_shortname||m(),b=b.toLowerCase(),h={container:d,url:k.url||e.location.href.replace(/#.*$/,""),forum:b,identifier:k.identifier,slug:k.slug},g={title:k.title||i.title,category:k.category_id,themeUrl:k.theme_root_url,useConman:k.demo,sortOrder:"popular",permalink:g,anchorColor:function(){var b=
i.createElement("a");b.href=+new Date;return a(b,"color")}(),colorScheme:128<function(a){a.match("^rgb")&&(a=l(a).substr(1));var b=parseInt(a.substr(0,2),16),c=parseInt(a.substr(2,2),16),a=parseInt(a.substr(4,2),16);return(b*299+c*587+a*114)/1E3}(a("span","color"))?"dark":"light",serif:{courier:1,times:1,georgia:1,palatino:1}.hasOwnProperty(a("span","font-family","fontFamily").toLowerCase()),apiKey:k.page.api_key,remoteAuthS3:k.page.remote_auth_s3,sso:k.sso},n;for(n in h)h.hasOwnProperty(n)&&(g[n]=
g[n]||h[n]);i.getElementById(d).innerHTML="";DISQUS.Lounge(g);var q=DISQUS.Switches({container:d});q.fetch({data:{forum:b},success:function(){q.enabled("discovery_next")&&DISQUS.Discovery(h)}});DISQUS.domready(function(){if(i.getElementsByClassName){var a=i.getElementsByClassName("dsq-brlink");a&&a.length&&a[0].parentNode.removeChild(a[0])}})})(this,this.document);