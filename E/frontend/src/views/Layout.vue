<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon :size="24"><Shop /></el-icon>
        <span>电商后台管理系统</span>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#001529"
        text-color="rgba(255,255,255,0.68)"
        active-text-color="#ffffff"
        class="menu"
      >
        <el-menu-item index="/category">
          <el-icon><FolderOpened /></el-icon>
          <span>类目管理</span>
        </el-menu-item>
        <el-menu-item index="/brand">
          <el-icon><Medal /></el-icon>
          <span>品牌管理</span>
        </el-menu-item>
        <el-menu-item index="/user">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/after-sale">
          <el-icon><Service /></el-icon>
          <span>售后介入</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <el-icon><Document /></el-icon>
          <span>日志监控</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-title">平台运营后台</div>
        <el-dropdown @command="handleCommand">
          <span class="admin-name">
            <el-icon><UserFilled /></el-icon>
            {{ store.adminInfo?.username || '管理员' }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store'

const router = useRouter()
const store = useUserStore()

function handleCommand(command) {
  if (command === 'logout') {
    store.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background: #001529;
}

.logo {
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.menu {
  border-right: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.admin-name {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #303133;
  outline: none;
}

.main {
  overflow-y: auto;
}
</style>
