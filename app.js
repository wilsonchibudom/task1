// Edit these to match your business decisions
var CFG = { currency: '₦', commission: 200, minPrice: 500 };
var $ = function(s){ return document.querySelector(s); };
var esc = function(t){ var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
var money = function(n){ return CFG.currency + n.toLocaleString(); };
function seed(){ return { role:'sender', online:true, wallet:1000, next:3, pk:[
  { id:1, from:'Rumuola Market', to:'Trans-Amadi', sname:'Demo sender', sphone:'0800 000 0001', price:800, pay:'cash', status:'open', otp:'4821', cash:false, ok:false },
  { id:2, from:'GRA Phase 2', to:'Rumuokoro', sname:'Demo sender 2', sphone:'0800 000 0002', price:1500, pay:'app', status:'open', otp:'7305', cash:false, ok:false } ] }; }
var S = seed(), ROLE = null, ref = null, lastJson = '', pending = false;
ROLE = window.REL_ROLE || null; // each page locks its own side
function shared(){ return { online:S.online, wallet:S.wallet, next:S.next, pk:S.pk }; }
function apply(j){
  try { var d = JSON.parse(j); if (!Array.isArray(d.pk)) return false; S.online = d.online; S.wallet = d.wallet; S.next = d.next; S.pk = d.pk; return true; } catch (e) { return false; }
}
try { var j0 = localStorage.getItem('reliaxMvp'); if (j0 && apply(j0)) lastJson = j0; } catch (e) {}
function save(){
  var j = JSON.stringify(shared());
  if (j === lastJson) return;
  lastJson = j;
  try { localStorage.setItem('reliaxMvp', j); } catch (e) {}
  if (ref) ref.set({ json: j }).catch(function(){});
}
function say(t){ save(); render(); $('#msg').textContent = t || ''; }
function maybeRender(){
  var a = document.activeElement;
  if (a && /INPUT|SELECT/.test(a.tagName) && $('#view').contains(a)) pending = true; else render();
}
function launcher(){
  return '<section class="picks">' + [['sender', 'Sender', 'Post packages, accept counters and track deliveries'], ['rider', 'Rider', 'Find packages, counter offers and deliver'], ['admin', 'Admin', 'Watch every package and the commission earned']].map(function(r){
    return '<button class="card pick" data-a="role" data-id="' + r[0] + '"><h2>' + r[1] + '</h2><span class="muted">' + r[2] + '</span></button>';
  }).join('') + '</section>';
}
var chip = function(s){ return '<span class="chip ' + s + '">' + s[0].toUpperCase() + s.slice(1) + '</span>'; };
var payTxt = function(p){ return p.pay === 'cash' ? 'Cash' : 'In-app'; };

function sender(){
  var mine = S.pk.slice().reverse().map(function(p){
    var h = '<div class="pk"><div class="row"><h3>' + esc(p.from) + ' to ' + esc(p.to) + '</h3>' + chip(p.status) + '</div>' +
      '<div class="muted">' + (p.status === 'open' ? 'Your offer ' : '') + money(p.price) + ' · ' + payTxt(p) + '</div>';
    if (p.status === 'claimed') h += '<div>Give this code to the rider at drop-off: <span class="otp">' + p.otp + '</span></div>';
    if (p.status === 'open' && p.counter) h += '<div class="banner">A rider countered with <b>' + money(p.counter) + '</b>. <span class="inl"><button class="btn" data-a="acceptc" data-id="' + p.id + '">Accept counter</button><button class="btn alt" data-a="declinec" data-id="' + p.id + '">Decline</button></span></div>';
    if (p.cash && !p.ok) h += '<div class="banner">The rider marked cash as collected. <button class="btn" data-a="confirm" data-id="' + p.id + '">Confirm I paid cash</button></div>';
    if (p.cash && p.ok) h += '<div class="muted">Cash payment confirmed.</div>';
    return h + '</div>';
  }).join('') || '<p class="muted">No packages yet. Post your first one above.</p>';
  return '<section class="card"><h2>Post a package</h2><div class="grid">' +
    '<label>Pickup address<input type="text" id="from" placeholder="Where to collect"></label>' +
    '<label>Drop-off address<input type="text" id="to" placeholder="Where to deliver"></label>' +
    '<label>Your name<input type="text" id="sname" autocomplete="name"></label>' +
    '<label>Phone number<input type="text" id="sphone" inputmode="tel" autocomplete="tel"></label>' +
    '<label>Payment<select id="pay"><option value="app">Pay in the app</option><option value="cash">Pay rider in cash</option></select></label>' +
    '<label>Your offer (' + CFG.currency + ')<input type="text" id="offer" inputmode="numeric" placeholder="e.g. 1500"></label></div>' +
    '<p class="muted">Set your own offer. Riders can accept it or counter. Your phone number is shown to the rider only after they take the job.</p>' +
    '<p><button class="btn" data-a="post">Post package</button></p></section>' +
    '<section class="card"><h2>My packages</h2><div style="display:grid;gap:.7rem">' + mine + '</div></section>';
}

function rider(){
  var done = S.pk.filter(function(p){ return p.status === 'delivered'; });
  var gross = done.reduce(function(a, p){ return a + p.price; }, 0), com = done.length * CFG.commission;
  var active = S.pk.filter(function(p){ return p.status === 'claimed'; })[0];
  var open = S.pk.filter(function(p){ return p.status === 'open'; });
  var h = '<section class="card"><div class="row"><h2>Today</h2><button class="btn alt" data-a="online" aria-pressed="' + S.online + '">' + (S.online ? 'Online' : 'Offline') + '</button></div>' +
    '<div class="stats"><div class="stat">Delivered<b>' + done.length + '</b></div><div class="stat">Gross<b>' + money(gross) + '</b></div>' +
    '<div class="stat">Commission<b>' + money(com) + '</b></div><div class="stat">You keep<b>' + money(gross - com) + '</b></div></div>' +
    '<div class="row" style="margin-top:.8rem"><span>Wallet: <b>' + money(S.wallet) + '</b> <span class="muted">(commission of ' + money(CFG.commission) + ' per package; cash jobs need it in your wallet)</span></span><button class="btn alt" data-a="topup">Top up ' + money(1000) + '</button></div></section>';
  if (active) h += '<section class="card"><h2>Current delivery</h2><div class="pk"><div class="row"><h3>' + esc(active.from) + ' to ' + esc(active.to) + '</h3>' + chip('claimed') + '</div>' +
    '<div class="muted">' + money(active.price) + ' · ' + payTxt(active) + '</div>' + (active.sname ? '<div>Sender: <b>' + esc(active.sname) + '</b>' + (active.sphone ? ' · <a href="tel:' + esc(active.sphone.replace(/[^\d+]/g, '')) + '">' + esc(active.sphone) + '</a>' : '') + '</div>' : '') + '<div class="inl">' +
    '<label>Sender code<input type="text" id="otp" inputmode="numeric" maxlength="4" placeholder="4 digits"></label>' +
    (active.pay === 'cash' ? '<label><input type="checkbox" id="cashchk"> Cash collected</label>' : '') +
    '<button class="btn" data-a="deliver" data-id="' + active.id + '">Confirm delivery</button></div></div></section>';
  h += '<section class="card"><h2>Packages near you</h2><div style="display:grid;gap:.7rem">' + (!S.online ? '<p class="muted">Go online to see packages.</p>' :
    open.map(function(p){ return '<div class="pk"><div class="row"><h3>' + esc(p.from) + ' to ' + esc(p.to) + '</h3><b>' + money(p.price) + '</b></div><div class="muted">' + (p.sname ? 'From ' + esc(p.sname) + ' · ' : '') + payTxt(p) + (p.counter ? ' · Your counter of ' + money(p.counter) + ' is with the sender' : '') + '</div><div class="inl"><button class="btn" data-a="claim" data-id="' + p.id + '">Accept offer</button>' + (p.counter ? '' : '<input type="text" id="c' + p.id + '" inputmode="numeric" placeholder="Your price"><button class="btn alt" data-a="counter" data-id="' + p.id + '">Counter</button>') + '</div></div>'; }).join('') || '<p class="muted">No open packages right now.</p>') + '</div></section>';
  return h;
}

function admin(){
  var done = S.pk.filter(function(p){ return p.status === 'delivered'; });
  var rows = S.pk.map(function(p){ return '<tr><td>#' + p.id + '</td><td>' + esc(p.from) + ' to ' + esc(p.to) + '</td><td>' + esc(p.sname || '') + '</td><td>' + money(p.price) + '</td><td>' + payTxt(p) + '</td><td>' + p.status + '</td></tr>'; }).join('');
  return '<section class="card"><h2>Platform overview</h2><div class="stats"><div class="stat">Packages<b>' + S.pk.length + '</b></div><div class="stat">Delivered<b>' + done.length + '</b></div>' +
    '<div class="stat">Commission earned<b>' + money(done.length * CFG.commission) + '</b></div><div class="stat">Flat commission<b>' + money(CFG.commission) + '</b></div></div></section>' +
    '<section class="card"><h2>All packages</h2><div class="scroll"><table><thead><tr><th>ID</th><th>Route</th><th>Sender</th><th>Price</th><th>Payment</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
}

var views = { sender: sender, rider: rider, admin: admin };
function render(){
  document.body.dataset.role = ROLE || '';
  $('#view').innerHTML = ROLE ? views[ROLE]() : launcher();
  $('#rolelabel').textContent = ROLE ? ROLE[0].toUpperCase() + ROLE.slice(1) + ' view' : '';
  $('#rolelabel').hidden = !ROLE; $('#switchbtn').hidden = !ROLE;
  $('#intro').textContent = ROLE ? '' : 'Pick a side. Open this page on other devices or windows and pick a different side on each. They update live.';
  $('#msg').textContent = '';
}
var find = function(id){ return S.pk.filter(function(p){ return p.id === +id; })[0]; };
var act = {
  role: function(id){ ROLE = id; try { sessionStorage.setItem('reliaxRole', id); } catch (e) {} render(); },
  switch: function(){ ROLE = null; try { sessionStorage.removeItem('reliaxRole'); } catch (e) {} render(); },
  online: function(){ S.online = !S.online; save(); render(); },
  topup: function(){ S.wallet += 1000; say('Wallet topped up.'); },
  reset: function(){ S = seed(); say('Demo data reset.'); },
  post: function(){
    var f = $('#from').value.trim(), t = $('#to').value.trim(), sn = $('#sname').value.trim(), sp = $('#sphone').value.trim(), offer = parseInt($('#offer').value, 10);
    if (!f || !t) { $('#msg').textContent = 'Enter both a pickup and a drop-off address.'; return; }
    if (!sn || sp.replace(/\D/g, '').length < 7) { $('#msg').textContent = 'Enter your name and a valid phone number so the rider can reach you.'; return; }
    if (!(offer >= CFG.minPrice)) { $('#msg').textContent = 'Your offer must be at least ' + money(CFG.minPrice) + '.'; return; }
    S.pk.push({ id:S.next++, from:f, to:t, sname:sn, sphone:sp, price:offer, pay:$('#pay').value, status:'open', otp:String(1000 + Math.floor(Math.random() * 9000)), cash:false, ok:false });
    say('Package posted. Riders nearby can now claim it.');
  },
  claim: function(id){
    var p = find(id);
    if (S.pk.some(function(x){ return x.status === 'claimed'; })) return say('Finish your current delivery first.');
    if (p.pay === 'cash' && S.wallet < CFG.commission) return say('Cash jobs need at least ' + money(CFG.commission) + ' in your wallet. Top up to continue.');
    p.status = 'claimed'; p.counter = null; say('Offer accepted. Head to the pickup address.');
  },
  deliver: function(id){
    var p = find(id);
    if ($('#otp').value.trim() !== p.otp) return say('Wrong code. Ask the sender for the 4-digit code.');
    if (p.pay === 'cash' && !$('#cashchk').checked) return say('Tick "Cash collected" to confirm you received the payment.');
    p.status = 'delivered';
    if (p.pay === 'cash') { p.cash = true; S.wallet -= CFG.commission; }
    say('Delivered. ' + (p.pay === 'cash' ? 'Commission deducted from your wallet and the sender was notified.' : 'Your payout is ' + money(p.price - CFG.commission) + '.'));
  },
  confirm: function(id){ find(id).ok = true; say('Thanks, cash payment confirmed.'); },
  counter: function(id){
    var p = find(id), amt = parseInt($('#c' + id).value, 10);
    if (!(amt >= CFG.minPrice)) return say('Your counter must be at least ' + money(CFG.minPrice) + '.');
    if (S.pk.some(function(x){ return x.status === 'claimed'; })) return say('Finish your current delivery first.');
    if (S.pk.some(function(x){ return x.status === 'open' && x.counter; })) return say('You already have a counter waiting for a sender.');
    if (p.pay === 'cash' && S.wallet < CFG.commission) return say('Cash jobs need at least ' + money(CFG.commission) + ' in your wallet. Top up to continue.');
    p.counter = amt; say('Counter of ' + money(amt) + ' sent. Waiting for the sender.');
  },
  acceptc: function(id){
    var p = find(id);
    if (S.pk.some(function(x){ return x.status === 'claimed'; })) { p.counter = null; return say('The rider took another job, so this counter expired.'); }
    p.price = p.counter; p.counter = null; p.status = 'claimed'; say('Counter accepted. The rider is on the way.');
  },
  declinec: function(id){ find(id).counter = null; say('Counter declined. Your package is still open.'); }
};
document.addEventListener('click', function(e){ var a = e.target.closest('[data-a]'); if (a) act[a.dataset.a](a.dataset.id); });
window.addEventListener('storage', function(e){
  if (e.key === 'reliaxMvp' && e.newValue && e.newValue !== lastJson && apply(e.newValue)) { lastJson = e.newValue; maybeRender(); }
});
document.addEventListener('focusout', function(){
  if (pending) setTimeout(function(){ var t = (document.activeElement || {}).tagName || ''; if (pending && !/INPUT|SELECT/.test(t)) { pending = false; render(); } }, 60);
});
if (window.claude && claude.use) claude.use('db').then(function(db){
  if (!db) return;
  ref = db.doc('app/state');
  ref.onSnapshot(function(snap){
    if (snap.metadata.hasPendingWrites || !snap.exists) return;
    var j = snap.data().json;
    if (j && j !== lastJson && apply(j)) { lastJson = j; maybeRender(); }
  });
}).catch(function(){});
render();
