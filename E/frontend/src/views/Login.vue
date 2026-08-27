<template>
  <div class="login-container">
    <el-card class="login-card" shadow="always">
      <div class="login-title">
        <h2>电商平台后台管理系统</h2>
        <p>管理员登录</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" size="large">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-tip">默认账号：admin / 123456</div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '../api/auth'
import { useUserStore } from '../store'

const router = useRouter()
const store = useUserStore()

const formRef = ref()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await login({ username: form.username, password: form.password })
    store.setLogin(res.data.token, res.data.adminInfo)
    ElMessage.success('登录成功')
    router.push('/')
  } catch {
    /* 错误提示已由拦截器统一处理 */
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1f3b73 0%, #2b6cb0 50%, #4299e1 100%);
}

.login-card {
  width: 400px;
  border-radius: 8px;
}

.login-title {
  text-align: center;
  margin-bottom: 24px;
}

.login-title h2 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #303133;
}

.login-title p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.login-btn {
  width: 100%;
}

.login-tip {
  text-align: center;
  color: #909399;
  font-size: 12px;
}
</style>
