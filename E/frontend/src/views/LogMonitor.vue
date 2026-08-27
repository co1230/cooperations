<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card stat-today">
        <div class="stat-num">{{ stats.today_count }}</div>
        <div class="stat-label">今日操作次数</div>
      </div>
      <div class="stat-card stat-total">
        <div class="stat-num">{{ stats.total_count }}</div>
        <div class="stat-label">累计操作次数</div>
      </div>
    </div>

    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="query.admin_name"
            placeholder="操作人（模糊搜索）"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-select v-model="query.action" clearable placeholder="操作类型" style="width: 160px" @change="handleSearch">
            <el-option v-for="item in actionOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 380px"
            @change="handleSearch"
          />
        </div>
        <el-button :icon="Search" type="primary" @click="handleSearch">查询</el-button>
      </div>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="admin_name" label="操作人" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.admin_id === 0" type="warning" size="small">系统</el-tag>
            <span v-else>{{ row.admin_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作类型" width="130" />
        <el-table-column prop="target_type" label="对象类型" width="110">
          <template #default="{ row }">{{ row.target_type || '-' }}</template>
        </el-table-column>
        <el-table-column prop="target_id" label="对象ID" width="90" align="center">
          <template #default="{ row }">{{ row.target_id ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="detail" label="操作详情" min-width="260" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="130">
          <template #default="{ row }">{{ row.ip || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
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
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { getLogList, getLogStats } from '../api/log'
import { formatTime } from '../utils/format'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const dateRange = ref(null)
const stats = reactive({ today_count: 0, total_count: 0 })

const query = reactive({ page: 1, page_size: 10, admin_name: '', action: '' })

const actionOptions = [
  '管理员登录',
  '新增类目',
  '修改类目',
  '删除类目',
  '新增品牌',
  '修改品牌',
  '删除品牌',
  '封禁用户',
  '解封用户',
  '平台介入',
  '强制退款',
  '关闭争议',
  '超时自动介入'
]

async function fetchStats() {
  try {
    const res = await getLogStats()
    Object.assign(stats, res.data)
  } catch {
    /* 错误提示已由拦截器统一处理 */
  }
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: query.page, page_size: query.page_size }
    if (query.admin_name) params.admin_name = query.admin_name
    if (query.action) params.action = query.action
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_time = dateRange.value[0]
      params.end_time = dateRange.value[1]
    }
    const res = await getLogList(params)
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
  fetchStats()
}

onMounted(() => {
  fetchList()
  fetchStats()
})
</script>

<style scoped>
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  padding: 16px 20px;
  border-radius: 8px;
  color: #fff;
}

.stat-num {
  font-size: 28px;
  font-weight: bold;
}

.stat-label {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.9;
}

.stat-today {
  background: #409eff;
}

.stat-total {
  background: #606266;
}
</style>
