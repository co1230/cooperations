const app=document.querySelector('#app');
const seedUsers=[
 {id:1,name:'林小满',email:'buyer@demo.com',password:'123456',role:'BUYER'},
 {id:2,name:'山屿生活馆',email:'merchant@demo.com',password:'123456',role:'MERCHANT'},
 {id:3,name:'平台管理员',email:'admin@demo.com',password:'123456',role:'ADMIN'}
];
const roleNames={BUYER:'普通买家',MERCHANT:'商家',ADMIN:'管理员'};
const dashboards={
 BUYER:{title:'买家中心',subtitle:'管理你的订单、售后与个人资料',nav:['概览','我的订单','售后服务','收货地址','个人资料'],stats:[['待付款','2'],['待收货','1'],['已完成','18'],['售后中','1']]},
 MERCHANT:{title:'商家工作台',subtitle:'今天也要认真经营，及时处理每一笔订单',nav:['经营概览','商品管理','订单管理','售后管理','店铺设置'],stats:[['今日销售额','¥ 8,620'],['待发货','12'],['在售商品','86'],['售后待处理','3']]},
 ADMIN:{title:'平台控制台',subtitle:'查看平台运行情况与关键业务指标',nav:['平台概览','用户管理','商家审核','商品治理','订单监管'],stats:[['平台用户','12,806'],['入驻商家','328'],['今日订单','1,024'],['待审核','16']]}
};
function users(){return accountService.users()}
function authView(mode='login',message=''){
 const register=mode==='register';
 app.innerHTML=`<main class="auth"><section class="brand"><div class="logo">QINGLAN · 青岚</div><h1>让每一次交易<br>清晰而从容</h1><p>一套为买家、商家与平台管理者共同打造的电商管理系统。</p></section><section class="auth-panel"><form class="card" id="authForm"><div class="tabs"><button type="button" class="tab ${!register?'active':''}" data-mode="login">登录</button><button type="button" class="tab ${register?'active':''}" data-mode="register">注册</button></div><h2>${register?'创建你的账户':'欢迎回来'}</h2>${register?'<label>昵称</label><input class="input" name="name" required maxlength="50" placeholder="请输入昵称">':''}<label>邮箱</label><input class="input" name="email" type="email" required placeholder="name@example.com"><label>密码</label><input class="input" name="password" type="password" required minlength="6" placeholder="至少 6 位密码">${register?'<label>注册身份</label><input class="input" value="普通买家" readonly aria-label="注册身份：普通买家">':''}<button class="btn btn-primary">${register?'注册并进入':'登录'}</button>${message?`<div class="error">${message}</div>`:''}<p class="hint">演示账号：buyer@demo.com / merchant@demo.com / admin@demo.com<br>密码均为 123456。商家和管理员账号不开放公开注册。</p></form></section></main>`;
 document.querySelectorAll('.tab').forEach(x=>x.onclick=()=>authView(x.dataset.mode));
 document.querySelector('#authForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),email=String(f.get('email')).trim().toLowerCase(),password=String(f.get('password'));if(register){const list=users();if(list.some(u=>u.email===email))return authView('register','该邮箱已注册');const user={id:Date.now(),name:String(f.get('name')).trim(),email,password,role:'BUYER',account_status:'ACTIVE'};list.push(user);localStorage.setItem('ecom_users',JSON.stringify(list));login(user)}else{try{login(accountService.authenticate(email,password))}catch(error){authView('login',escapeHtml(error.message))}}};
}
function login(user){const {password,...sessionUser}=user;sessionStorage.setItem('ecom_session',JSON.stringify(sessionUser));routeUser(sessionUser)}
function routeUser(user){try{user=accountService.currentUser();user.role==='BUYER'?storeHome(user):dashboard(user)}catch(error){authView('login',escapeHtml(error.message))}}
function storeHome(user){
 const products=[];
 app.innerHTML=`<div class="store"><header class="store-head"><a class="store-logo">QINGLAN <small>青岚选物</small></a><nav aria-label="商城导航">${storeSections.map(name=>`<button data-store-page="${name}" ${name==='首页'?'aria-current="page"':''}>${name}</button>`).join('')}</nav><div class="store-user">你好，${escapeHtml(user.name)}<button id="buyerCenter">买家中心</button><button id="myCart">购物车</button><button id="myOrders">我的订单</button><button id="exitStore">退出</button></div></header><main><section class="hero"><div><p class="eyebrow">AUTUMN COLLECTION · 2026</p><h1>把喜欢的日子<br>慢慢装进生活</h1><p class="hero-copy">从一只杯子、一盏灯开始，挑选经得起时间的日常好物。</p><button class="ghost-link" data-store-page="本周上新">探索秋日新选 →</button></div><div class="hero-art"><span>青</span><i>秋日<br>生活志</i></div></section><section class="categories">${storeCategories.map(name=>`<button data-store-page="${name}">${name}</button>`).join('')}</section><section class="showcase"><div class="section-title"><div><p>CURATED FOR YOU</p><h2>本周好物精选</h2></div><span id="productCount">商品目录</span></div><p id="cartNotice" class="cart-notice" role="status" aria-live="polite"></p><div class="product-grid">${products.map(p=>`<article class="product-card"><div class="product-img" style="--product-bg:${p.background}"><b>${p.icon}</b><em>${p.tag}</em></div><h3>${p.name}</h3><p>${p.description}</p><strong>${money(p.price)}</strong><del>${money(p.original_price)}</del><button class="add-cart" data-add-cart="${p.id}">加入购物车</button></article>`).join('')}</div></section><section class="mock-pay" id="homeOrders"><p role="status">正在加载订单…</p></section></main><footer>© 2026 青岚选物 · 认真挑选每一件日常</footer></div>`;
 document.querySelector('#exitStore').onclick=()=>{sessionStorage.removeItem('ecom_session');authView()};document.querySelector('#myOrders').onclick=()=>buyerOrdersView();loadHomeOrders(document.querySelector('#homeOrders'));wireProductCart(app);wireStoreNavigation(user);loadStoreCatalog(app);
}
const session=JSON.parse(sessionStorage.getItem('ecom_session')||'null');session?routeUser(session):authView();
if(typeof window!=='undefined') window.addEventListener('storage',event=>{if(event.key==='ecom_users'&&sessionStorage.getItem('ecom_session')){try{accountService.currentUser()}catch(error){authView('login',escapeHtml(error.message))}}});
