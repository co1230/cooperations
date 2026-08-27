// Promise-based mock API. Replace these methods with HTTP requests for production.
const productCatalog = [
  {id:101,merchant_id:2,name:'手冲咖啡分享壶',description:'耐热玻璃 · 600ml',price:128,original_price:159,icon:'☕',tag:'热卖',background:'#efe8db'},
  {id:102,merchant_id:2,name:'月影氛围台灯',description:'三档暖光 · 无级调节',price:219,original_price:269,icon:'◒',tag:'新品',background:'#e6e3d8'},
  {id:103,merchant_id:2,name:'云感香薰加湿器',description:'静音运行 · 细腻雾化',price:169,original_price:199,icon:'♨',tag:'精选',background:'#dde9e4'},
  {id:104,merchant_id:2,name:'原木桌面收纳架',description:'北美黑胡桃 · 手工打磨',price:119,original_price:149,icon:'▱',tag:'口碑',background:'#eadfd3'},
  {id:105,merchant_id:2,name:'轻氧保温杯',description:'316不锈钢 · 450ml',price:129,original_price:159,icon:'◉',tag:'推荐',background:'#dee9ea'},
  {id:106,merchant_id:2,name:'亚麻午睡毯',description:'亲肤透气 · 四季可用',price:169,original_price:209,icon:'⌁',tag:'舒适',background:'#e8e2d7'}
].map((product,index)=>({...product,sku:`PRODUCT-${product.id}`,stock:[80,35,60,45,120,70][index],product_status:'ON_SALE'}));
const orderApi = (() => {
  const key = 'ecom_order_db_v1';
  const copy = value => JSON.parse(JSON.stringify(value));
  const catalog = db => db.products ??= copy(productCatalog);
  function requireRole(user,role) {if(user.role!==role) throw new Error('无权执行此操作');}
  function shop(db,id) {return (db.shops ??= {})[id] ??= {name:id===2?'山屿生活馆':'我的店铺',contact:'',description:'',delivery_note:'',after_sale_note:'',open:true};}
  function available(db,product) {return product.product_status==='ON_SALE'&&!product.governance_locked&&shop(db,product.merchant_id).open;}
  function save(db) {localStorage.setItem(key,JSON.stringify(db));}
  function canIntervene(db,ticket,decision) {
    const order=db.orders.find(order=>order.id===ticket.order_id);
    if(!order||ticket.platform_intervention||order.after_sale_status==='REFUNDED') return false;
    if(!['PAID','SHIPPED','COMPLETED'].includes(order.order_status)) return false;
    if(db.after_sale_tickets.some(other=>other.order_id===ticket.order_id&&other.id>ticket.id)) return false;
    return (decision==='FORCE_REFUND'?['APPLIED','PROCESSING','APPROVED','REJECTED']:['APPLIED','PROCESSING','APPROVED']).includes(ticket.status);
  }
  function read() {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
    const rows = [
      [1, 'Q20260826001', '轻氧保温杯', 129, 1, 'PENDING_PAYMENT', 'NONE', '2026-08-26T09:00:00+08:00'],
      [2, 'Q20260825088', '原木桌面收纳架', 119, 2, 'COMPLETED', 'PROCESSING', '2026-08-25T09:00:00+08:00'],
      [3, 'Q20260824036', '亚麻午睡毯', 169, 1, 'SHIPPED', 'NONE', '2026-08-24T09:00:00+08:00'],
      [4, 'Q20260822019', '便携咖啡滤杯', 89, 1, 'COMPLETED', 'REFUNDED', '2026-08-22T09:00:00+08:00']
    ];
    const db = {orders: [], order_items: [], payment_records: [], order_status_logs: [], after_sale_tickets: []};
    for (const [id, order_no, product_name, unit_price, quantity, order_status, after_sale_status, created_at] of rows) {
      db.orders.push({id, order_no, buyer_id: 1, merchant_id: 2, total_amount: unit_price * quantity,
        order_status, after_sale_status, created_at, updated_at: created_at,
        paid_at: order_status === 'PENDING_PAYMENT' ? null : created_at});
      db.order_items.push({id, order_id: id, product_id: id, product_name, sku: `DEMO-${id}`, unit_price, quantity, subtotal: unit_price * quantity});
    }
    db.after_sale_tickets = [
      {id: 1, ticket_no: 'AS20260825001', order_id: 2, buyer_id: 1, merchant_id: 2, ticket_type: 'REFUND_ONLY', status: 'PROCESSING', reason: '演示退款申请', requested_amount: 238},
      {id: 2, ticket_no: 'AS20260822001', order_id: 4, buyer_id: 1, merchant_id: 2, ticket_type: 'REFUND_ONLY', status: 'COMPLETED', reason: '演示退款完成', requested_amount: 89}
    ];
    // The old unscoped demo belongs only to the built-in demo buyer, never a new user.
    const legacy = JSON.parse(localStorage.getItem('demo_order') || 'null');
    if (legacy?.no === rows[0][1] && legacy.status === '已支付') {
      recordPayment(db, db.orders[0], legacy.paidAt || new Date().toISOString());
    }
    localStorage.setItem(key, JSON.stringify(db));
    return db;
  }
  function actor() {
    if (typeof accountService !== 'undefined') return accountService.currentUser();
    const session = JSON.parse(sessionStorage.getItem('ecom_session') || 'null');
    if (!session || !['BUYER', 'MERCHANT', 'ADMIN'].includes(session.role)) throw new Error('请先登录');
    return session;
  }
  const visible = (order, user) => user.role === 'ADMIN' || (user.role === 'BUYER' ? order.buyer_id === user.id : order.merchant_id === user.id);
  function recordPayment(db, order, now) {
    order.order_status = 'PAID';
    order.paid_at = now;
    order.updated_at = now;
    db.payment_records.push({id: db.payment_records.length + 1, payment_no: `MOCK-${order.order_no}`, order_id: order.id,
      buyer_id: order.buyer_id, amount: order.total_amount, payment_method: 'MOCK', payment_status: 'SUCCESS', paid_at: now, created_at: now});
    db.order_status_logs.push({id: db.order_status_logs.length + 1, order_id: order.id, operator_id: order.buyer_id,
      status_type: 'ORDER', from_status: 'PENDING_PAYMENT', to_status: 'PAID', remark: '模拟支付成功', created_at: now});
  }
  const detail = (db, order) => copy({...order, items: db.order_items.filter(i => i.order_id === order.id),
    after_sale_tickets: db.after_sale_tickets.filter(t => t.order_id === order.id)});
  async function request(action) {
    const caller = actor();
    await new Promise(resolve => setTimeout(resolve, 120));
    const current = actor();
    if (caller.id !== current.id || caller.role !== current.role) throw new Error('登录状态已变更，请重新操作');
    return action(current);
  }
  function buyerCart(db, user) {
    if (user.role !== 'BUYER') throw new Error('仅买家可使用购物车');
    db.carts ??= {};
    return db.carts[user.id] ??= [];
  }
  function cartView(db, user) {
    const items = buyerCart(db, user).map(item => {
      const product = catalog(db).find(product => product.id === item.product_id);
      if (!product) throw new Error('购物车商品不存在');
      return {...item, product: copy(product), subtotal: Math.round(product.price * 100) * item.quantity / 100};
    });
    return {items, count: items.reduce((sum, item) => sum + item.quantity, 0),
      selected_count: items.filter(item => item.selected).reduce((sum, item) => sum + item.quantity, 0),
      total: items.filter(item => item.selected).reduce((sum, item) => sum + Math.round(item.subtotal * 100), 0) / 100};
  }
  function saveCart(db, user) {
    const result = cartView(db, user);
    localStorage.setItem(key, JSON.stringify(db));
    return result;
  }
  return {
    listPlatformTickets: () => request(user=>{
      requireRole(user,'ADMIN');const db=read();
      return copy(db.after_sale_tickets.map(ticket=>({...ticket,
        order_no:db.orders.find(order=>order.id===ticket.order_id)?.order_no,
        can_force_refund:canIntervene(db,ticket,'FORCE_REFUND'),can_reject:canIntervene(db,ticket,'REJECT')
      })).sort((a,b)=>b.id-a.id));
    }),
    interveneRefund: (id,decision,reason) => request(user=>{
      requireRole(user,'ADMIN');
      if(!['FORCE_REFUND','REJECT'].includes(decision)) throw new Error('无效的平台处理操作');
      if(typeof reason!=='string'||!reason.trim()||reason.trim().length>200) throw new Error('请填写 1–200 字平台处理原因');
      const db=read(),ticket=db.after_sale_tickets.find(ticket=>ticket.id===id);
      if(!ticket||!canIntervene(db,ticket,decision)) throw new Error('该工单已结束、已有新申请或不可重复介入，请刷新列表');
      const order=db.orders.find(order=>order.id===ticket.order_id),now=new Date().toISOString(),previous=order.after_sale_status;
      if(decision==='FORCE_REFUND') {
        const amount=Number(ticket.requested_amount),cents=Math.round(amount*100);
        if(!Number.isFinite(amount)||cents<=0||cents>Math.round(order.total_amount*100)||Math.abs(amount*100-cents)>0.000001) throw new Error('工单退款金额无效，无法执行退款');
        if((db.refund_records||[]).some(record=>record.order_id===order.id)) throw new Error('该订单已有退款记录，不能重复退款');
        ticket.status='COMPLETED';ticket.completed_at=now;order.after_sale_status='REFUNDED';
        (db.refund_records??=[]).push({ticket_id:id,order_id:order.id,amount:cents/100,operator_id:user.id,created_at:now,method:'MOCK',source:'PLATFORM'});
        if(cents===Math.round(order.total_amount*100)) db.payment_records.filter(p=>p.order_id===order.id&&p.payment_status==='SUCCESS').forEach(p=>{p.payment_status='REFUNDED';});
      } else {ticket.status='REJECTED';order.after_sale_status='REJECTED';}
      ticket.platform_intervention={decision,reason:reason.trim(),operator_id:user.id,created_at:now};
      ticket.updated_at=now;order.updated_at=now;
      db.order_status_logs.push({id:db.order_status_logs.length+1,order_id:order.id,operator_id:user.id,status_type:'AFTER_SALE',from_status:previous,to_status:order.after_sale_status,remark:`平台${decision==='FORCE_REFUND'?'强制退款':'驳回'}：${reason.trim()}`,created_at:now});
      save(db);return copy(ticket);
    }),
    listStoreProducts: () => request(() => {const db=read();return copy(catalog(db).filter(product=>available(db,product)));}),
    saveProduct: (id,values) => request(user=>{
      requireRole(user,'MERCHANT');
      const db=read(), products=catalog(db);
      let product=id===null?null:products.find(product=>product.id===id&&product.merchant_id===user.id);
      if(id!==null&&!product) throw new Error('商品不存在或不属于本店');
      const name=String(values.name||'').trim(),description=String(values.description||'').trim();
      if(!name||name.length>160||description.length>1000) throw new Error('商品名称需为 1–160 字，描述不超过 1000 字');
      if(!/^\d+(\.\d{1,2})?$/.test(String(values.price))||Number(values.price)<=0||Number(values.price)>9999999) throw new Error('售价须大于零，最多两位小数');
      const stock=Number(values.stock);
      if(!Number.isInteger(stock)||stock<0||stock>999999) throw new Error('库存须为 0–999999 的整数');
      if(!['ON_SALE','OFF_SALE','DRAFT'].includes(values.product_status)) throw new Error('商品状态无效');
      if(product?.governance_locked&&values.product_status==='ON_SALE') throw new Error('商品已被平台下架，请等待解除限制');
      if(!product) {const newId=Math.max(100,...products.map(p=>p.id))+1;product={id:newId,merchant_id:user.id,sku:`PRODUCT-${newId}`,icon:'▦',tag:'新品',background:'#e6e3d8'};products.push(product);}
      Object.assign(product,{name,description,price:Number(values.price),original_price:Number(values.price),stock,product_status:values.product_status,updated_at:new Date().toISOString()});
      save(db);return copy(product);
    }),
    listGovernance: () => request(user=>{requireRole(user,'ADMIN');const db=read();return {products:copy(catalog(db)),logs:copy(db.governance_logs||[])};}),
    governProduct: (id,locked,reason) => request(user=>{
      requireRole(user,'ADMIN');
      if(typeof locked!=='boolean'||typeof reason!=='string'||!reason.trim()||reason.trim().length>200) throw new Error('请填写 1–200 字治理原因');
      const db=read(),product=catalog(db).find(p=>p.id===id);
      if(!product) throw new Error('商品不存在');
      if(Boolean(product.governance_locked)===locked) throw new Error('商品治理状态已变更，请刷新');
      product.governance_locked=locked;product.governance_reason=reason.trim();
      product.product_status='OFF_SALE';
      (db.governance_logs??=[]).push({product_id:id,operator_id:user.id,action:locked?'下架并限制上架':'解除限制（待商家重新上架）',reason:reason.trim(),created_at:new Date().toISOString()});
      save(db);return copy(product);
    }),
    getShop: () => request(user=>{requireRole(user,'MERCHANT');return copy(shop(read(),user.id));}),
    saveShop: values => request(user=>{
      requireRole(user,'MERCHANT');const db=read();
      const updated={};
      for(const field of ['name','contact','description','delivery_note','after_sale_note']) {
        const value=String(values[field]||'').trim();
        if(value.length>(field==='name'?50:500)||field==='name'&&!value) throw new Error('店铺名称必填（最多50字），其他字段最多500字');
        updated[field]=value;
      }
      if(typeof values.open!=='boolean') throw new Error('营业状态无效');
      Object.assign(shop(db,user.id),updated,{open:values.open});save(db);return copy(shop(db,user.id));
    }),
    listMerchantTickets: () => request(user=>{requireRole(user,'MERCHANT');const db=read();return copy(db.after_sale_tickets.filter(t=>t.merchant_id===user.id).map(t=>({...t,order_no:db.orders.find(o=>o.id===t.order_id)?.order_no})));}),
    reviewRefund: (id,action,note) => request(user=>{
      requireRole(user,'MERCHANT');
      if(typeof note!=='string'||note.trim().length>200||action==='REJECT'&&!note.trim()) throw new Error('拒绝需填写原因，备注最多200字');
      const db=read(),ticket=db.after_sale_tickets.find(t=>t.id===id&&t.merchant_id===user.id);
      if(!ticket) throw new Error('售后工单不存在或不属于本店');
      const order=db.orders.find(o=>o.id===ticket.order_id),previous=order.after_sale_status,now=new Date().toISOString();
      if(['APPROVE','REJECT'].includes(action)&&['APPLIED','PROCESSING'].includes(ticket.status)) {
        ticket.status=action==='APPROVE'?'APPROVED':'REJECTED';order.after_sale_status=ticket.status;
      } else if(action==='REFUND'&&ticket.status==='APPROVED') {
        ticket.status='COMPLETED';ticket.completed_at=now;order.after_sale_status='REFUNDED';
        (db.refund_records??=[]).push({ticket_id:id,order_id:order.id,amount:ticket.requested_amount,operator_id:user.id,created_at:now,method:'MOCK'});
        if(Number(ticket.requested_amount)===Number(order.total_amount)) db.payment_records.filter(p=>p.order_id===order.id&&p.payment_status==='SUCCESS').forEach(p=>{p.payment_status='REFUNDED';});
      } else throw new Error('当前工单状态不允许此操作，请勿重复处理');
      ticket.merchant_reply=note.trim();ticket.updated_at=now;order.updated_at=now;
      db.order_status_logs.push({id:db.order_status_logs.length+1,order_id:order.id,operator_id:user.id,status_type:'AFTER_SALE',from_status:previous,to_status:order.after_sale_status,remark:note.trim()||'商家售后处理',created_at:now});
      save(db);return copy(ticket);
    }),
    shipOrder: id => request(user=>{
      requireRole(user,'MERCHANT');const db=read(),order=db.orders.find(o=>o.id===id&&o.merchant_id===user.id);
      if(!order||order.order_status!=='PAID'||!['NONE','REJECTED','CLOSED'].includes(order.after_sale_status)) throw new Error('订单不可发货：请确认已付款且无进行中的售后');
      const now=new Date().toISOString();order.order_status='SHIPPED';order.shipped_at=now;order.updated_at=now;
      db.order_status_logs.push({id:db.order_status_logs.length+1,order_id:id,operator_id:user.id,status_type:'ORDER',from_status:'PAID',to_status:'SHIPPED',remark:'商家模拟发货',created_at:now});save(db);return detail(db,order);
    }),
    listMerchantProducts: () => request(user => {
      if (user.role !== 'MERCHANT') throw new Error('仅商家可查看店铺商品');
      return copy(catalog(read()).filter(product => product.merchant_id === user.id));
    }),
    getCart: () => request(user => cartView(read(), user)),
    addToCart: productId => request(user => {
      const db = read(), cart = buyerCart(db, user);
      const product=catalog(db).find(product=>product.id===productId);
      if(!product) throw new Error('商品不存在');
      if(!available(db,product)||product.stock===0) throw new Error('商品已下架、店铺休业或无库存');
      const item = cart.find(item => item.product_id === productId);
      if (item) {
        if (item.quantity >= 99) throw new Error('每件商品最多购买 99 件');
        item.quantity += 1;
      } else cart.push({product_id: productId, quantity: 1, selected: true});
      return saveCart(db, user);
    }),
    updateCart: (productId, patch) => request(user => {
      const db = read(), cart = buyerCart(db, user);
      const item = cart.find(item => item.product_id === productId);
      if (!item) throw new Error('购物车商品不存在，请刷新');
      if (patch.quantity !== undefined) {
        if (!Number.isInteger(patch.quantity) || patch.quantity < 1 || patch.quantity > 99) throw new Error('数量必须为 1–99 的整数');
        item.quantity = patch.quantity;
      }
      if (patch.selected !== undefined) {
        if (typeof patch.selected !== 'boolean') throw new Error('勾选状态无效');
        item.selected = patch.selected;
      }
      return saveCart(db, user);
    }),
    selectCart: selected => request(user => {
      if (typeof selected !== 'boolean') throw new Error('勾选状态无效');
      const db = read();
      buyerCart(db, user).forEach(item => {item.selected = selected;});
      return saveCart(db, user);
    }),
    removeFromCart: productId => request(user => {
      const db = read(), cart = buyerCart(db, user);
      db.carts[user.id] = cart.filter(item => item.product_id !== productId);
      return saveCart(db, user);
    }),
    checkoutCart: () => request(user => {
      const db = read(), snapshot = cartView(db, user);
      const selected = snapshot.items.filter(item => item.selected);
      if (!selected.length) throw new Error('请先勾选要结算的商品');
      for(const item of selected) {
        const product=catalog(db).find(p=>p.id===item.product_id);
        if(!available(db,product)||product.stock<item.quantity) throw new Error(`${product.name}已下架、休业或库存不足，请调整购物车`);
        product.stock-=item.quantity;
      }
      const now = new Date().toISOString(), created = [];
      for (const merchantId of new Set(selected.map(item => item.product.merchant_id))) {
        const items = selected.filter(item => item.product.merchant_id === merchantId);
        const id = Math.max(0, ...db.orders.map(order => order.id)) + 1;
        const order = {id, order_no: `Q${Date.now()}-${id}`, buyer_id: user.id, merchant_id: merchantId,
          total_amount: items.reduce((sum, item) => sum + Math.round(item.subtotal * 100), 0) / 100,
          order_status:'PENDING_PAYMENT', after_sale_status:'NONE', paid_at:null, created_at:now, updated_at:now};
        db.orders.push(order);
        for (const item of items) db.order_items.push({id:Math.max(0, ...db.order_items.map(row => row.id)) + 1,
          order_id:id, product_id:item.product_id, product_name:item.product.name, sku:`PRODUCT-${item.product_id}`,
          unit_price:item.product.price, quantity:item.quantity, subtotal:item.subtotal});
        db.order_status_logs.push({id:db.order_status_logs.length + 1, order_id:id, operator_id:user.id,
          status_type:'ORDER', from_status:null, to_status:'PENDING_PAYMENT', remark:'购物车结算创建订单', created_at:now});
        created.push(detail(db, order));
      }
      db.carts[user.id] = buyerCart(db, user).filter(item => !item.selected);
      // Persist order creation and cart removal together; failure leaves both unchanged.
      localStorage.setItem(key, JSON.stringify(db));
      return created;
    }),
    listOrders: () => request(user => {
      const db = read();
      return db.orders.filter(order => visible(order, user)).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(order => detail(db, order));
    }),
    applyRefund: (id, payload) => request(user => {
      const db = read();
      const order = db.orders.find(row => row.id === id);
      if (user.role !== 'BUYER' || !order || order.buyer_id !== user.id) throw new Error('无权申请此订单退款');
      if (!['PAID', 'SHIPPED', 'COMPLETED'].includes(order.order_status)) throw new Error('仅已付款订单可申请退款');
      if (!['NONE', 'REJECTED'].includes(order.after_sale_status)) throw new Error('此订单已有售后申请，请勿重复提交');
      if (!payload || !['REFUND_ONLY', 'RETURN_REFUND'].includes(payload.ticket_type)) throw new Error('请选择有效的退款类型');
      if (payload.ticket_type === 'RETURN_REFUND' && order.order_status === 'PAID') throw new Error('待发货订单请选择仅退款');
      const reason = typeof payload.reason === 'string' ? payload.reason.trim() : '';
      if (!reason || reason.length > 200) throw new Error('退款原因需填写 1–200 个字符');
      const amountText = String(payload.requested_amount ?? '');
      if (!/^\d+(\.\d{1,2})?$/.test(amountText)) throw new Error('退款金额最多保留两位小数');
      const cents = Math.round(Number(amountText) * 100);
      if (!Number.isSafeInteger(cents) || cents <= 0 || cents > Math.round(order.total_amount * 100)) throw new Error('退款金额须大于 0 且不超过订单金额');
      const evidence = payload.evidence_urls ?? [];
      if (!Array.isArray(evidence) || evidence.length > 3) throw new Error('最多上传 3 张凭证');
      for (const url of evidence) {
        if (typeof url !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(url)) throw new Error('凭证仅支持 PNG、JPEG、WebP 图片');
        const encoded = url.split(',')[1];
        const bytes = encoded.length * 3 / 4 - (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0);
        if (encoded.length % 4 || bytes > 300 * 1024) throw new Error('单张凭证不能超过 300 KB');
      }
      const now = new Date().toISOString();
      const ticketId = Math.max(0, ...db.after_sale_tickets.map(ticket => ticket.id)) + 1;
      db.after_sale_tickets.push({id: ticketId, ticket_no: `AS-${order.order_no}-${ticketId}`, order_id: order.id,
        buyer_id: user.id, merchant_id: order.merchant_id, ticket_type: payload.ticket_type, status: 'APPLIED',
        reason, requested_amount: cents / 100, evidence_urls: copy(evidence), created_at: now, updated_at: now});
      db.order_status_logs.push({id: db.order_status_logs.length + 1, order_id: order.id, operator_id: user.id,
        status_type: 'AFTER_SALE', from_status: order.after_sale_status, to_status: 'APPLIED', remark: '提交退款申请', created_at: now});
      order.after_sale_status = 'APPLIED';
      order.updated_at = now;
      try { localStorage.setItem(key, JSON.stringify(db)); }
      catch (error) { throw new Error('退款申请未保存，浏览器存储可能已满，请减少凭证大小后重试'); }
      return detail(db, order);
    }),
    payOrder: id => request(user => {
      const db = read();
      const order = db.orders.find(row => row.id === id);
      if (user.role !== 'BUYER' || !order || order.buyer_id !== user.id) throw new Error('无权支付此订单');
      // Repeat payment requests are idempotent, with one payment record and one log.
      if (order.order_status === 'PAID') return detail(db, order);
      if (order.order_status !== 'PENDING_PAYMENT') throw new Error('当前订单状态不允许支付');
      recordPayment(db, order, new Date().toISOString());
      localStorage.setItem(key, JSON.stringify(db));
      return detail(db, order);
    })
  };
})();
