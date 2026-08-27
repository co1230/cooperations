<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="query.keyword"
            placeholder="搜索用户名/昵称/手机号"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
          <el-select v-model="query.status" style="width: 140px" @change="handleSearch">
            <el-option label="全部状态" value="" />
            <el-option label="正常" :value="0" />
            <el-option label="封禁" :value="1" />
          </el-select>
        </div>
        <el-button :icon="Refresh" @click="handleSearch">刷新</el-button>
      </div>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column label="昵称" min-width="110">
          <template #default="{ row }">{{ row.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column label="头像" width="80" align="center">
          <template #default="{ row }">
            <el-avatar v-if="row.avatar" :size="40" :src="row.avatar" />
            <el-avatar v-else :size="40">{{ (row.nickname || row.username).slice(0, 1) }}</el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="手机号" min-width="130">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
              {{ row.status === 0 ? '正常' : '封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="封禁原因" min-width="130">
          <template #default="{ row }">{{ row.ban_reason || '-' }}</template>
        </el-table-column>
        <el-table-column label="封禁至" min-width="170">
          <template #default="{ row }">{{ formatBanUntil(row) }}</template>
        </el-table-column>
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" size="small" type="danger" link @click="openBanDialog(row)">
              封禁
            </el-button>
            <el-button v-else size="small" type="success" link @click="handleUnban(row)">
              解封
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        background
        layout="total, sizes, prev, pager, next"
        :total="total"
        v-model:current-page="query.page"
        v-model:page-size="query.page_size"
        :page-sizes="[10, 20, 50]"
        @current-change="fetchList"
        @size-change="fetchList"
      />
    </el-card>

    <!-- 封禁弹窗 -->
    <el-dialog v-model="banDialogVisible" title="封禁用户" width="480px">
      <div class="ban-user-name">
        封禁用户：<b>{{ currentUser?.username }}</b>（{{ currentUser?.nickname || '无昵称' }}）
      </div>
      <el-form :model="banForm" :rules="banRules" ref="banFormRef" label-width="90px">
        <el-form-item label="封禁原因" prop="ban_reason">
          <el-input
            v-model="banForm.ban_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入封禁原因"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="封禁时长" prop="ban_duration_hours">
          <el-select v-model="banForm.ban_duration_hours" style="width: 100%">
            <el-option label="1天" :value="24" />
            <el-option label="3天" :value="72" />
            <el-option label="7天" :value="168" />
            <el-option label="30天" :value="720" />
            <el-option label="永久封禁" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="banDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="handleBan">确认封禁</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { banUser, getUserList, unbanUser } from '../api/user'
import { formatTime } from '../utils/format'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const banDialogVisible = ref(false)
const submitting = ref(false)
const banFormRef = ref()
const currentUser = ref(null)

const query = reactive({ page: 1, page_size: 10, keyword: '', status: '' })
const banForm = reactive({ ban_reason: '', ban_duration_hours: 24 })
const banRules = {
  ban_reason: [{ required: true, message: '请输入封禁原因', trigger: 'blur' }],
  ban_duration_hours: [{ required: true, message: '请选择封禁时长', trigger: 'change' }]
}

function formatBanUntil(row) {
  if (row.status !== 1) return '-'
  if (!row.ban_until) return '永久'
  return formatTime(row.ban_until)
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: query.page, page_size: query.page_size, keyword: query.keyword }
    if (query.status !== '') params.status = query.status
    const res = await getUserList(params)
    total.value = res.data.total
    list.value = res.data.list
  } catch {
    /* 错误提示已由拦截器统一处理 */
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function openBanDialog(row) {
  currentUser.value = row
  banForm.ban_reason = ''
  banForm.ban_duration_hours = 24
  banDialogVisible.value = true
}

async function handleBan() {
  await banFormRef.value.validate()
  submitting.value = true
  try {
    await banUser(currentUser.value.id, { ...banForm })
    ElMessage.success('封禁成功')
    banDialogVisible.value = false
    fetchList()
  } catch {
    /* 错误提示已由拦截器统一处理 */
  } finally {
    submitting.value = false
  }
}

async function handleUnban(row) {
  try {
    await ElMessageBox.confirm(`确定解封用户「${row.username}」吗？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await unbanUser(row.id)
    ElMessage.success('解封成功')
    fetchList()
  } catch {
    /* 错误提示已由拦截器统一处理 */
  }
}

onMounted(fetchList)
</script>

<style scoped>
.ban-user-name {
  margin-bottom: 16px;
  color: #606266;
}
</style>
