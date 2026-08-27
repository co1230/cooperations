const accountService = (() => {
  function users() {
    const stored = localStorage.getItem('ecom_users');
    const list = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(seedUsers));
    let changed = !stored;
    for (const user of list) if (!user.account_status) {user.account_status = 'ACTIVE'; changed = true;}
    for (const [email, name, contact] of [['apply1@demo.com','青禾家居','陈女士'],['apply2@demo.com','拾光文具','李先生']]) {
      if (list.some(user => user.email === email)) continue;
      const id = Math.max(0,...list.map(user=>user.id)) + 1;
      list.push({id,name,email,password:'123456',role:'MERCHANT',account_status:'PENDING',
        merchant_application:{status:'PENDING',contact,description:'演示入驻申请，申请经营生活日用品',submitted_at:new Date().toISOString(),reviewed_at:null,reviewed_by:null,review_note:''}});
      changed = true;
    }
    if (changed) localStorage.setItem('ecom_users',JSON.stringify(list));
    return list;
  }
  function assertActive(user) {
    if (!user) throw new Error('账号不存在，请重新登录');
    if (user.account_status === 'DISABLED') throw new Error('账号已被封禁，请联系管理员');
    if (user.account_status !== 'ACTIVE') throw new Error(user.merchant_application?.status === 'REJECTED' ? '入驻申请已被拒绝，请联系管理员' : '商家入驻申请待审核，暂不能登录');
    return user;
  }
  function currentUser() {
    const session = JSON.parse(sessionStorage.getItem('ecom_session') || 'null');
    if (!session) throw new Error('请先登录');
    try {return assertActive(users().find(user=>user.id===session.id));}
    catch (error) {sessionStorage.removeItem('ecom_session'); throw error;}
  }
  const publicUser = user => {const {password,...safe} = user; return safe;};
  async function adminRequest(action) {
    const caller = currentUser();
    if (caller.role !== 'ADMIN') throw new Error('仅管理员可执行此操作');
    await new Promise(resolve=>setTimeout(resolve,120));
    const current = currentUser();
    if (current.id !== caller.id || current.role !== 'ADMIN') throw new Error('管理员登录状态已变更');
    return action(current);
  }
  return {users,currentUser,
    authenticate(email,password) {
      const user = users().find(user=>user.email===email&&user.password===password);
      if (!user) throw new Error('邮箱或密码错误，请重试');
      return publicUser(assertActive(user));
    },
    listUsers: () => adminRequest(()=>users().map(publicUser)),
    setStatus: (id,status) => adminRequest(admin=>{
      if (!['ACTIVE','DISABLED'].includes(status)) throw new Error('无效的账号状态');
      const list=users(), target=list.find(user=>user.id===id);
      if (!target) throw new Error('用户不存在');
      if (target.id===admin.id || target.role==='ADMIN') throw new Error('不允许封禁管理员账号');
      if (target.account_status==='PENDING') throw new Error('请先通过商家审核处理该账号');
      target.account_status=status;
      target.status_updated_at=new Date().toISOString();
      target.status_updated_by=admin.id;
      localStorage.setItem('ecom_users',JSON.stringify(list));
      return publicUser(target);
    }),
    reviewMerchant: (id,decision,note='') => adminRequest(admin=>{
      if (!['APPROVED','REJECTED'].includes(decision)) throw new Error('无效审核结果');
      if (typeof note!=='string' || note.trim().length>200 || (decision==='REJECTED'&&!note.trim())) throw new Error('拒绝时需填写原因，审核备注最多 200 字');
      const list=users(), target=list.find(user=>user.id===id);
      if (!target || target.role!=='MERCHANT' || target.merchant_application?.status!=='PENDING' || target.account_status!=='PENDING') throw new Error('该申请不存在或已审核，请刷新列表');
      target.merchant_application={...target.merchant_application,status:decision,review_note:note.trim(),reviewed_by:admin.id,reviewed_at:new Date().toISOString()};
      if (decision==='APPROVED') target.account_status='ACTIVE';
      // Application and account activation are persisted in one write.
      localStorage.setItem('ecom_users',JSON.stringify(list));
      return publicUser(target);
    })
  };
})();
