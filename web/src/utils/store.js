// 模拟 localStorage 前端存储（后续成员A的 RBAC 权限框架就绪后，可接用户真实数据）

const KEY = {
  address: 'yg_addresses',
  favorites: 'yg_favorites',
}

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(KEY[key] || key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function save(key, value) {
  localStorage.setItem(KEY[key] || key, JSON.stringify(value))
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
