import{f as S}from"./chunk-RBH5UFJB.js";import{a as x}from"./chunk-PBMXKT54.js";import{b as j,d as C}from"./chunk-HUCMZM6B.js";import{A as I,a as b,h,oa as l,ta as d}from"./chunk-WGWHO3VQ.js";var p=class{constructor(){this.avoid=["a","above","about","accordance","according","accordingly","across","actually","adj","affected","affecting","affects","after","afterwards","again","against","all","almost","alone","along","already","also","although","always","am","among","amongst","an","and","another","any","anyhow","anyone","anything","anywhere","are","aren't","arise","around","as","ask","at","away","be","became","because","become","becomes","been","before","beforehand","begin","behind","being","below","beside","besides","between","both","but","by","came","can","cannot","can't","co","could","couldn't","did","didn't","do","does","doesn't","done","don't","down","during","each","eg","else","elsewhere","end","ending","enough","etc","even","ever","every","everyone","everything","everywhere","except","few","for","from","gave","get","gets","gone","got","had","hadn't","hardly","has","hasn't","have","haven't","having","he","he'd","hence","her","here","hereafter","hereby","herein","here's","hereupon","hers","herself","he's","him","himself","his","how","however","i","i'd","ie","if","i'll","i'm","in","inc","indeed","instead","into","is","isn't","it","its","it's","itself","i've","just","last","later","latter","latterly","least","less","let","lets","like","likely","ll","ltd","made","mainly","make","makes","many","may","maybe","me","meantime","meanwhile","might","miss","more","moreover","most","mostly","mr","mrs","ms","much","must","my","myself","na","namely","next","no","nobody","none","nonetheless","noone","nor","not","nothing","now","nowhere","of","off","often","on","one","only","onto","or","other","others","otherwise","our","ours","ourselves","out","over","own","past","per","perhaps","q","rather","re","recent","recently","said","same","say","seem","seemed","seeming","seems","several","shall","she","she's","should","shouldn't","since","so","some","somehow","someone","something","sometime","sometimes","somewhere","still","such","taking","than","that","that'll","that's","the","their","them","themselves","then","thence","there","thereafter","thereby","there'd","therefore","therein","there'll","there're","there's","thereupon","there've","these","they","theyd","they'll","they're","they've","this","those","though","through","throughout","thru","thus","til","to","together","too","took","toward","towards","under","unless","unlike","unlikely","until","unto","up","upon","us","used","using","ve","very","via","was","was'nt","we","we'd","well","were","werent","what","whatever","what'll","what's","what've","when","whence","whenever","where","whereafter","whereas","whereby","wherein","where's","whereupon","wherever","whether","which","while","who","who'd","whoever","whole","who'll","whom","whomever","who's","whose","why","will","with","within","without","won't","would","would'nt","yes","yet","you","you'd","you'll","your","you're","yours","yourself","yourselves","you've","--"]}};var q=(()=>{class a extends p{constructor(e){super(),this.fds=e}getIndexData(e){return h(this,null,function*(){let t={},r=this.fds.getActiveFeedData()??[],n=new Set((this.avoid??[]).map(c=>c.toLowerCase())),s=(e??"").trim(),i=s.length>0,f=s.toLowerCase();for(let c of r){let m=c?.page??0,D=c?.data??[];for(let[H,u]of D.entries()){let N=(u?.lines??[]).join(""),v=`${m}:${H+1}`,g=new Set,k=N.toLowerCase().match(/[a-z0-9_-]+/g);if(k)for(let o of k)n.has(o)||(!i||o.includes(f))&&g.add(o);let w=typeof u.time=="string"?u.time.trim().slice(0,-3):"";w&&(!i||w.includes(s))&&g.add(w);for(let o of g){let y=o.charAt(0).toUpperCase();if(!y)continue;let $=t[y]??(t[y]={}),L=$[o]??($[o]={});v in L||(L[v]=null)}}}return t})}static{this.\u0275fac=function(t){return new(t||a)(d(S))}}static{this.\u0275prov=l({token:a,factory:a.\u0275fac,providedIn:"root"})}}return a})();var Q=(()=>{class a{constructor(e){this.http=e}getSessionList(e,t,r){return h(this,null,function*(){let n=new j().set("nCaseid",e);n=n.set("nUserid",t),r&&(n=n.set("cType",r));try{let s=yield I(this.http.get(`${x.cloudUrl2}${x.realtimeserive}/session/getsessionsbycaseid`,{params:n}));return s.length?s:[]}catch(s){return console.error(s),[]}})}static{this.\u0275fac=function(t){return new(t||a)(d(C))}}static{this.\u0275prov=l({token:a,factory:a.\u0275fac,providedIn:"root"})}}return a})();var P={includeTimestamps:!0,includePageBreaks:!0,includeLineNumbers:!0,cssMode:"linked"};var G=(()=>{class a{renderToHtml(e,t={}){let r=b(b({},P),t),n=this.renderPages(e,r);return r.cssMode==="inline"?this.wrapWithInlineStyles(n):this.wrapWithLinkedStyles(n)}renderPages(e,t){let r="";for(let n of e)t.pageRange&&(n.page<t.pageRange.start||n.page>t.pageRange.end)||(r+=this.renderPage(n,t));return r}renderPage(e,t){let n=`<div class="transcript-page${t.includePageBreaks?" transcript-page-break":""}" data-page="${e.page}">
`;if(n+=`  <div class="transcript-page-header">Page ${e.page}</div>
`,e.data&&e.data.length)for(let s of e.data)n+=this.renderLine(s,e.page,t);return n+=`</div>
`,n}renderLine(e,t,r){let n=this.getLineClasses(e),s=this.getLineDataAttributes(e,t),i=`  <div class="transcript-line ${n.join(" ")}" ${s}>
`;if(r.includeLineNumbers){let m=e.lineIndex===1?`${t}.${e.lineIndex}`:`${e.lineIndex}`;i+=`    <span class="line-number">${this.escapeHtml(m)}</span>
`}r.includeTimestamps&&e.time&&(i+=`    <span class="timestamp">${this.escapeHtml(this.formatTimestamp(e.time))}</span>
`);let f=e.lines?e.lines.join(" "):"",c=this.processLinks(f,e.links);return i+=`    <span class="line-text">${c}</span>
`,i+=`  </div>
`,i}getLineClasses(e){let t=[];return(e.formate==="QES"||e.formate==="QES-CONTINUE")&&t.push("question-block"),e.formate==="PRNTH"&&t.push("parenthetical"),e.formate==="FL"&&t.push("first-line"),e.isBold&&t.push("is-bold"),e.nHid&&t.push("highlighted"),t}getLineDataAttributes(e,t){let r=[];return r.push(`data-line="${e.lineIndex}"`),r.push(`data-page="${t}"`),e.unicid&&r.push(`data-identity="${this.escapeAttr(e.unicid)}"`),e.oPage!=null&&r.push(`data-opage="${e.oPage}"`),e.oLine!=null&&r.push(`data-oline="${e.oLine}"`),e.nHid&&r.push(`data-hid="${this.escapeAttr(e.nHid)}"`),e.time&&r.push(`data-time="${this.escapeAttr(e.time)}"`),r.join(" ")}formatTimestamp(e){if(!e)return"";let t=e.split(":");return t.length>=3?t.slice(0,3).join(":"):e}processLinks(e,t){let r=this.escapeHtml(e);if(t&&t.length>0)for(let n of t){let s=this.escapeHtml(n);r=r.replace(s,`<a class="transcript-link" href="${this.escapeAttr(n)}" target="_blank">${s}</a>`)}return r}wrapWithLinkedStyles(e){return`<div class="transcript-document">
${e}</div>`}wrapWithInlineStyles(e){return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transcript</title>
  <style>
    ${A}
  </style>
</head>
<body>
  <div class="transcript-document">
    ${e}
  </div>
</body>
</html>`}escapeHtml(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}escapeAttr(e){return e?e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#039;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}static{this.\u0275fac=function(t){return new(t||a)}}static{this.\u0275prov=l({token:a,factory:a.\u0275fac,providedIn:"root"})}}return a})(),A=`
  * { margin: 0; padding: 0; box-sizing: border-box; }

  .transcript-document {
    font-family: 'Courier New', Courier, monospace;
    font-size: 15px;
    line-height: 1.5;
    color: #1a1a1a;
    background: #fff;
  }

  .transcript-page {
    position: relative;
    padding: 16px 40px 24px 40px;
    min-width: 956px;
    max-width: fit-content;
    width: fit-content;
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .transcript-page-break {
    page-break-after: always;
    break-after: page;
  }

  .transcript-page-header {
    background: #737373;
    color: #fff;
    font-size: 12px;
    padding: 6px 10px;
    margin-bottom: 24px;
    height: 36px;
    display: flex;
    align-items: center;
  }

  .transcript-line {
    display: flex;
    align-items: flex-start;
    position: relative;
    font-size: 15px;
  }

  .line-number {
    display: inline-flex;
    justify-content: flex-end;
    width: 65px;
    min-width: 65px;
    padding: 0 6px;
    text-align: right;
    user-select: none;
    letter-spacing: -0.3px;
    background: #f5f5f5;
    margin-right: 12px;
    flex-shrink: 0;
  }

  .timestamp {
    white-space: nowrap;
    padding: 0 6px;
    width: 75px;
    min-width: 75px;
    font-size: 12px;
    user-select: none;
    overflow: hidden;
    letter-spacing: -0.3px;
    flex-shrink: 0;
  }

  .line-text {
    flex: 1;
    text-align: left;
    white-space: pre-wrap;
    word-break: break-word;
    user-select: text;
    cursor: text;
  }

  .question-block .line-text,
  .is-bold .line-text {
    font-weight: bold;
  }

  .parenthetical .line-text {
    padding-left: 2em;
    font-style: italic;
  }

  .highlighted {
    background-color: var(--highlightcolor, #ffff00);
  }

  .transcript-link {
    color: #2563eb;
    text-decoration: underline;
    cursor: pointer;
  }

  .transcript-link:hover {
    color: #1d4ed8;
  }

  @media print {
    .transcript-page {
      padding: 0;
      min-width: unset;
      width: 100%;
    }

    .transcript-page-header {
      background: #737373 !important;
      color: #fff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .line-number {
      background: #f5f5f5 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;export{q as a,Q as b,G as c};
