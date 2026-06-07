
const defaults=['Milch','Butter','Eier','Brot','Käse','Joghurt'];
let state=JSON.parse(localStorage.getItem('shoppingApp')||'{"mode":"plan","items":[]}');

function save(){localStorage.setItem('shoppingApp',JSON.stringify(state));render();}

function addItem(name=null){
 const n=name||document.getElementById('itemInput').value.trim();
 const q=document.getElementById('qtyInput').value||1;
 if(!n)return;
 state.items.push({name:n,qty:q,checked:false});
 document.getElementById('itemInput').value='';
 save();
}

function removeItem(i){state.items.splice(i,1);save();}
function startShopping(){state.mode='shop';save();}
function finishShopping(){
 if(confirm('Liste löschen?')){
  state={mode:'plan',items:[]};
  save();
 }
}

function toggle(i){state.items[i].checked=!state.items[i].checked;save();}

function render(){
 document.getElementById('planView').classList.toggle('hidden',state.mode!=='plan');
 document.getElementById('shopView').classList.toggle('hidden',state.mode!=='shop');

 document.getElementById('defaults').innerHTML=defaults.map(x=>`<button class="chip" onclick="addItem('${x}')">${x}</button>`).join('');

 document.getElementById('planList').innerHTML=state.items.map((x,i)=>
 `<li>${x.qty}x ${x.name} <button onclick="removeItem(${i})">🗑️</button></li>`).join('');

 const done=state.items.filter(x=>x.checked).length;
 document.getElementById('progress').innerHTML=`${done} von ${state.items.length} erledigt`;

 document.getElementById('shopList').innerHTML=state.items.map((x,i)=>
 `<li class="${x.checked?'done':''}">
 <label><input type="checkbox" ${x.checked?'checked':''} onchange="toggle(${i})">
 ${x.qty}x ${x.name}</label></li>`).join('');
}

if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js');}
render();
