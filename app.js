const $=id=>document.getElementById(id);
const shortcuts=[['AAPL','stock','Apple'],['MSFT','stock','Microsoft'],['NVDA','stock','NVIDIA'],['BND','stock','US bond ETF'],['AGG','stock','US bond ETF'],['TLT','stock','US Treasury ETF'],['BTC-USD','crypto','Bitcoin'],['ETH-USD','crypto','Ethereum']];
let current=null;let watch=JSON.parse(localStorage.getItem('mf_watch')||'[]');$('notes').value=localStorage.getItem('mf_notes')||'';
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url,opts){const r=await fetch(url,opts);let data=await r.json();if(!r.ok)throw Error(data.error||'Request failed');return data}
async function quote(kind,symbol){return api('/api/quote?kind='+encodeURIComponent(kind)+'&symbol='+encodeURIComponent(symbol))}
function renderQuote(q){$('quote').innerHTML=`<div><b>${escapeHtml(q.symbol)}</b> · ${escapeHtml(q.asset_type)}</div><strong>${escapeHtml(q.price===null?'Unavailable':Number(q.price).toLocaleString('en-US',{maximumFractionDigits:8})+' '+q.currency)}</strong><p class="muted">Source: ${escapeHtml(q.source)} · As of: ${escapeHtml(q.as_of||'unknown')} ${q.note?'· '+escapeHtml(q.note):''}</p>`}
async function doLookup(){const kind=$('kind').value,symbol=$('symbol').value.trim().toUpperCase();$('quote').textContent='Fetching public quote…';$('save').disabled=true;try{current=await quote(kind,symbol);renderQuote(current);$('save').disabled=false}catch(e){current=null;$('quote').textContent='No verified quote: '+e.message}}
function persist(){localStorage.setItem('mf_watch',JSON.stringify(watch));renderList()}
function renderList(){const root=$('list');root.replaceChildren();if(!watch.length){root.textContent='No saved assets yet.';return}watch.forEach((w,i)=>{const a=document.createElement('article');const d=document.createElement('div');const name=document.createElement('b');name.textContent=w.symbol;const sub=document.createElement('small');sub.textContent=' '+w.kind+' · '+(w.price??'Not refreshed')+' '+(w.currency||'');d.append(name,document.createElement('br'),sub);const b=document.createElement('button');b.textContent='Remove';b.onclick=()=>{watch.splice(i,1);persist()};a.append(d,b);root.append(a)})}
$('lookup').onclick=doLookup;$('save').onclick=()=>{if(!current)return;const kind=$('kind').value;watch=watch.filter(w=>!(w.symbol===current.symbol&&w.kind===kind));watch.push({symbol:current.symbol,kind,price:current.price,currency:current.currency});persist()};$('refresh').onclick=async()=>{for(const w of watch){try{const q=await quote(w.kind,w.symbol);w.price=q.price;w.currency=q.currency}catch(e){w.price='Unavailable'}}persist()};$('export').onclick=()=>{const rows=[['symbol','kind','price','currency'],...watch.map(w=>[w.symbol,w.kind,w.price,w.currency])];const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='marketforge-watchlist.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};$('saveNotes').onclick=()=>{localStorage.setItem('mf_notes',$('notes').value);$('saveNotes').textContent='Saved';setTimeout(()=>$('saveNotes').textContent='Save notes',1200)};
$('ask').onclick=async()=>{$('answer').textContent='Contacting configured cloud AI…';try{const r=await api('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:$('model').value,question:$('question').value})});$('answer').textContent=r.answer}catch(e){$('answer').textContent='AI unavailable: '+e.message}};
shortcuts.forEach(([symbol,kind,label])=>{const b=document.createElement('button');b.textContent=symbol+' · '+label;b.onclick=()=>{$('kind').value=kind;$('symbol').value=symbol;doLookup()};$('shortcuts').append(b)});renderList();api('/api/health').then(d=>$('health').textContent='Netlify API online').catch(()=>$('health').textContent='API unavailable — check Netlify deployment');

// Seven genuine navigation layers: app → module → workspace → tool → action → validation → result.
const paths = [
 {app:'Market Data',module:'Public quotes',workspace:'Lookup',tool:'Stock / ETF',action:'Fetch stock quote',validation:'Check ticker',result:'Quote details',task:'stock'},
 {app:'Market Data',module:'Public quotes',workspace:'Lookup',tool:'Crypto spot',action:'Fetch crypto price',validation:'Check pair',result:'Quote details',task:'crypto'},
 {app:'Market Data',module:'Saved assets',workspace:'Watchlist',tool:'Refresh',action:'Refresh saved prices',validation:'Check saved symbols',result:'Updated watchlist',task:'refresh'},
 {app:'Market Data',module:'Saved assets',workspace:'Watchlist',tool:'Export',action:'Export CSV',validation:'Check watchlist',result:'CSV file',task:'csv'},
 {app:'Market Data',module:'Saved assets',workspace:'Watchlist',tool:'Export',action:'Export JSON',validation:'Check watchlist',result:'JSON file',task:'json'},
 {app:'Market Data',module:'Saved assets',workspace:'Watchlist',tool:'Import',action:'Import JSON',validation:'Validate imported file',result:'Imported watchlist',task:'import'},
 {app:'Portfolio',module:'RRSP / retirement',workspace:'Personal notes',tool:'Editor',action:'Save portfolio notes',validation:'Check note length',result:'Saved notes',task:'notes'},
 {app:'Research AI',module:'Cloud AI',workspace:'Research',tool:'Prompt',action:'Ask AI',validation:'Check model and question',result:'AI response',task:'ai'},
 {app:'System',module:'Service diagnostics',workspace:'Server',tool:'Health',action:'Check server',validation:'Verify API response',result:'Server status',task:'health'},
 {app:'System',module:'Service diagnostics',workspace:'Server',tool:'Configuration',action:'Show integration status',validation:'Check local configuration',result:'Integration report',task:'status'},
 {app:'Issuer information',module:'Real-world listing',workspace:'Requirements',tool:'Compliance',action:'Show listing requirements',validation:'No issuer submission',result:'Requirements summary',task:'issuer'}
];
const keys=['app','module','workspace','tool','action','validation','result'];
let selection=[];
const layerNav=$('layerNav'),bread=$('breadcrumbs'),message=$('layerMessage'),actions=$('layerActions');
function navButton(label,callback,cls=''){const b=document.createElement('button');b.textContent=label;b.className=cls;b.onclick=callback;return b}
function renderLayers(){
 const level=selection.length;bread.replaceChildren();selection.forEach((s,i)=>bread.append(navButton((i+1)+'. '+s,()=>{selection=selection.slice(0,i);renderLayers()},'crumb')));
 layerNav.replaceChildren();actions.replaceChildren();
 if(level<7){const key=keys[level],options=[...new Set(paths.filter(p=>selection.every((s,i)=>p[keys[i]]===s)).map(p=>p[key]))];
 const heading=document.createElement('h3');heading.textContent='Layer '+(level+1)+' / 7 — '+key.toUpperCase();layerNav.append(heading);
 options.forEach(opt=>layerNav.append(navButton(opt,()=>{selection.push(opt);renderLayers()},'nav-choice')));
 message.textContent=level===0?'Choose a real app workflow.':`Selected: ${selection.join(' → ')}. Choose the next layer.`;
 }else{const p=paths.find(p=>selection.every((s,i)=>p[keys[i]]===s));
 const h=document.createElement('h3');h.textContent='Layer 7 / 7 — Ready to execute';layerNav.append(h);
 actions.append(navButton('▶ Run '+p.action,()=>executeTask(p),'execute'),navButton('↺ Start over',()=>{selection=[];renderLayers()},'crumb'));
 message.textContent='Ready: '+p.result+'. No real trades or exchange submissions will be placed.';
 }}
async function executeTask(p){try{
 if(p.task==='stock'||p.task==='crypto'){$('kind').value=p.task;$('lookupPanel').scrollIntoView({behavior:'smooth'});await doLookup();message.textContent='Quote lookup finished. Review its source and timestamp below.'}
 else if(p.task==='refresh'){$('refresh').click();$('watchPanel').scrollIntoView({behavior:'smooth'});message.textContent='Watchlist refresh started. Results may be delayed.'}
 else if(p.task==='csv'){$('export').click();message.textContent='CSV export requested.'}
 else if(p.task==='json'){$('exportJson').click();message.textContent='JSON export requested.'}
 else if(p.task==='import'){$('importFile').click();message.textContent='Select a MarketForge JSON watchlist file.'}
 else if(p.task==='notes'){$('saveNotes').click();$('portfolioPanel').scrollIntoView({behavior:'smooth'});message.textContent='Portfolio notes saved locally.'}
 else if(p.task==='ai'){$('aiPanel').scrollIntoView({behavior:'smooth'});$('ask').click();message.textContent='AI request started; review the response in the AI panel.'}
 else if(p.task==='health'){const d=await api('/api/health');message.textContent=d.ok?'Netlify API is responding.':'Netlify API did not report healthy.'}
 else if(p.task==='status'){message.textContent='Quote providers: Stooq (stocks/ETFs) and Coinbase (crypto). AI: optional server-side OPENAI_API_KEY. Trading, brokerage auth and issuance: not implemented.'}
 else if(p.task==='issuer'){$('issuerPanel').scrollIntoView({behavior:'smooth'});message.textContent='Real issuance requires issuer authorization, legal review, market-specific application and approval. No automatic upload or listing is performed.'}
 }catch(e){message.textContent='Operation could not finish: '+e.message}}
function downloadJson(){const blob=new Blob([JSON.stringify({format:'marketforge-watchlist-v1',assets:watch},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='marketforge-watchlist.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
$('exportJson').onclick=downloadJson;$('importJson').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>1000000)throw Error('File exceeds 1 MB');const data=JSON.parse(await file.text());if(data.format!=='marketforge-watchlist-v1'||!Array.isArray(data.assets)||data.assets.length>500)throw Error('Not a valid MarketForge watchlist');const cleaned=data.assets.map(x=>{if(!x||!['stock','crypto'].includes(x.kind)||typeof x.symbol!=='string'||!(/^[A-Z0-9.\-]{1,20}$/.test(x.symbol)))throw Error('Invalid asset entry');return {symbol:x.symbol,kind:x.kind,price:null,currency:''}});watch=cleaned;persist();message.textContent='Imported '+watch.length+' symbols. Refresh to retrieve public quotes.'}catch(err){message.textContent='Import failed: '+err.message}finally{e.target.value=''}};
renderLayers();
