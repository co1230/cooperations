const plannedPages = {
  '商品管理':['商品新增与编辑','上下架管理','库存与价格维护'],
  '售后管理':['查看退款凭证','审核退款申请','退货与退款处理'],
  '店铺设置':['店铺基本资料','配送与售后说明','营业状态设置'],
  '用户管理':['用户列表与搜索','账号创建','账号状态管理'],
  '商家审核':['入驻申请列表','资质审核','审核结果记录'],
  '商品治理':['违规商品检查','商品下架处理','处理记录查询'],
  '售后服务':['售后工单查询','申请进度跟踪','售后沟通记录'],
  '收货地址':['新增收货地址','编辑与删除地址','设置默认地址'],
  '个人资料':['昵称与头像维护','联系方式维护','账号安全设置']
};
const storeSections = ['首页','生活美学','居家日用','本周上新'];
const storeCategories = ['餐厨器物','香氛洗护','卧室织物','桌面文具','户外随行'];
function plannedPageContent(title) {
  const plans = plannedPages[title] || ['分类商品展示','商品筛选与排序','专题内容推荐'];
  return `<section class="panel placeholder-panel"><span class="badge orange">开发中</span><h2>${escapeHtml(title)}页面（开发中）</h2><p>该模块已纳入功能规划，当前仅展示页面结构，尚未开放业务操作。</p><h3>计划功能</h3><ul>${plans.map(plan => `<li>${escapeHtml(plan)}</li>`).join('')}</ul><div class="empty">功能开发中，暂无可展示的列表数据。</div></section>`;
}
function dashboard(user, index = 0) {
  const d = dashboards[user.role];
  if (!d) return authView();
  if (!Number.isInteger(index) || index < 0 || index >= d.nav.length) index = 0;
  const title = d.nav[index];
  if (user.role === 'BUYER' && title === '我的订单') return buyerOrdersView();
  const isOrders = ['订单管理','订单监管'].includes(title);
  const isAdminPage=user.role==='ADMIN'&&['用户管理','商家审核'].includes(title);
  const isPlatform=user.role==='ADMIN'&&title==='售后介入';
  const isProducts=user.role==='MERCHANT'&&title==='商品管理';
  const businessMode=user.role==='ADMIN'&&title==='商品治理'?'governance':user.role==='MERCHANT'?({'售后管理':'tickets','店铺设置':'shop','订单管理':'orders'})[title]:null;
  const table = `<section class="panel"><div class="panel-head"><h3>${isOrders ? title : '近期订单'}</h3><span class="badge green">模拟接口数据</span></div><div class="table-wrap"><table><thead><tr><th>订单编号</th><th>商品</th><th>金额</th><th>订单状态</th><th>售后状态</th></tr></thead><tbody id="dashboardOrders"><tr><td colspan="5">正在加载订单…</td></tr></tbody></table></div></section>`;
  const content = isPlatform ? '<section class="panel" id="platformRefunds"><p role="status">正在加载售后工单…</p></section>' : businessMode ? '<section class="panel" id="businessPage"><p role="status">正在加载…</p></section>' : index === 0 ? `<p class="hint">以下统计为演示数据，订单列表读取模拟接口。</p><section class="stats">${d.stats.map(s=>`<article class="stat"><span>${s[0]}</span><strong>${s[1]}</strong></article>`).join('')}</section>${table}` : isOrders ? table : isAdminPage ? '<section class="panel" id="adminPage"><p role="status">正在加载…</p></section>' : isProducts ? '<section class="panel" id="merchantProducts"><p role="status">正在加载商品…</p></section>' : plannedPageContent(title);
  app.innerHTML = `<div class="shell"><aside class="side"><div class="logo">QINGLAN</div><div class="role-tag">${roleNames[user.role]}</div><nav class="nav" aria-label="后台导航">${d.nav.map((name,i)=>`<button class="${i === index ? 'active' : ''}" ${i === index ? 'aria-current="page"' : ''} aria-label="${name}" title="${name}" data-page-index="${i}" data-icon="${['⌂','▦','◎','◇','⚙','⚖'][i]}">${name}</button>`).join('')}${user.role === 'BUYER' ? '<button id="dashboardStore" data-icon="⌂" title="商城首页" aria-label="商城首页">商城首页</button>' : ''}<button class="logout" data-icon="↪" title="退出登录" aria-label="退出登录">退出登录</button></nav></aside><main class="main"><header class="top"><div><h2>${index === 0 ? d.title : title}</h2><p>${index === 0 ? d.subtitle : `${roleNames[user.role]} / ${title}`}</p></div><div class="avatar">${escapeHtml(user.name.slice(0,1))}</div></header>${content}${index ? '<button class="order-pay" id="backOverview">返回概览</button>' : ''}${title === '售后服务' ? '<button class="order-pay" id="existingRefunds">查看订单并申请退款</button>' : ''}</main></div>`;
  document.querySelectorAll('[data-page-index]').forEach(button => {button.onclick = () => dashboard(user, Number(button.dataset.pageIndex));});
  document.querySelector('.logout').onclick = () => {sessionStorage.removeItem('ecom_session'); authView();};
  if ((index === 0 || isOrders)&&!businessMode) loadDashboardOrders(document.querySelector('#dashboardOrders'));
  if (businessMode) loadBusinessPage(document.querySelector('#businessPage'),businessMode);
  if (isAdminPage) loadAdminPage(document.querySelector('#adminPage'),title);
  if (isPlatform) loadPlatformRefunds(document.querySelector('#platformRefunds'));
  if (isProducts) loadBusinessPage(document.querySelector('#merchantProducts'),'products');
  if (index) document.querySelector('#backOverview').onclick = () => dashboard(user);
  if (user.role === 'BUYER') document.querySelector('#dashboardStore').onclick = () => storeHome(user);
  if (title === '售后服务') document.querySelector('#existingRefunds').onclick = () => buyerOrdersView();
}
function wireStoreNavigation(user) {
  document.querySelectorAll('[data-store-page]').forEach(button => {
    button.onclick = () => button.dataset.storePage === '首页' ? storeHome(user) : storePlaceholder(user, button.dataset.storePage);
  });
  const center = document.querySelector('#buyerCenter');
  if (center) center.onclick = () => dashboard(user);
}
function storePlaceholder(user, title) {
  if (![...storeSections, ...storeCategories].includes(title)) return storeHome(user);
  app.innerHTML = `<div class="store"><header class="store-head"><a class="store-logo">QINGLAN <small>青岚选物</small></a><nav aria-label="商城导航">${storeSections.map(name => `<button data-store-page="${name}" ${name === title ? 'aria-current="page"' : ''}>${name}</button>`).join('')}</nav><div class="store-user"><button id="placeholderCart">购物车</button><button id="placeholderOrders">我的订单</button><button id="buyerCenter">买家中心</button></div></header><main class="orders-page"><p>商城 / ${escapeHtml(title)}</p>${plannedPageContent(title)}<button class="order-pay" data-store-page="首页">返回商城首页</button></main></div>`;
  wireStoreNavigation(user);
  document.querySelector('#placeholderCart').onclick = () => cartPage();
  document.querySelector('#placeholderOrders').onclick = () => buyerOrdersView();
}
