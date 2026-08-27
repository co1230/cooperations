<template>
  <div class="page-container">
    <!-- 状态统计卡片 -->
    <div class="stats-row">
      <div class="stat-card stat-pending">
        <div class="stat-num">{{ stats.pending }}</div>
        <div class="stat-label">待处理</div>
      </div>
      <div class="stat-card stat-overdue">
        <div class="stat-num">{{ stats.overdue }}</div>
        <div class="stat-label">超时未处理</div>
      </div>
      <div class="stat-card stat-intervened">
        <div class="stat-num">{{ stats.intervened }}</div>
        <div class="stat-label">平台已介入</div>
      </div>
      <div class="stat-card stat-completed">
        <div class="stat-num">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card stat-closed">
        <div class="stat-num">{{ stats.closed }}</div>
        <div class="stat-label">已关闭</div>
      </div>
    </div>

    <el-card shadow="never">
      <el-alert
        type="info"
        show-icon
        :closable="false"
        title="系统每 30 秒自动扫描一次售后单，超过处理时限仍未处理的售后单将自动标记为「平台已介入」"
        class="auto-alert"
      />
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="query.status" style="width: 150px" @change="handleSearch">
            <el-option label="全部状态" value="" />
            <el-option label="待处理" :value="0" />
            <el-option label="平台已介入" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已关闭" :value="3" />
          </el-select>
          <el-select v-model="query.type" style="width: 150px" @change="handleSearch">
            <el-option label="全部类型" value="" />
            <el-option label="退货" value="return" />
            <el-option label="退款" value="refund" />
          </el-select>
        </div>
        <el-button :icon="Refresh" @click="handleSearch">刷新</el-button>
      </div>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="after_sale_no" label="售后单号" min-width="140" />
        <el-table-column prop="order_no" label="订单号" min-width="130" />
        <el-table-column prop="product_name" label="商品" min-width="160" show-overflow-tooltip />
        <el-table-column prop="username" label="申请用户" width="100" />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === 'return' ? 'warning' : 'primary'">
              {{ row.type === 'return' ? '退货' : '退款' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="申请原因" min-width="130" show-overflow-tooltip />
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="超时" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_overdue" type="danger" size="small">已超时</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="平台介入" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_platform_intervened" type="info" size="small">已介入</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="处理结果" min-width="140">
          <template #default="{ row }">{{ row.result || '-' }}</template>
        </el-table-column>
        <el-table-column label="处理截止" width="170">
          <template #default="{ row }">{{ formatTime(row.deadline) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              size="small"
              type="primary"
              link
              @click="handleIntervene(row)"
            >
              介入
            </el-button>
            <el-button
              v-if="row.status === 0 || row.status === 1"
              size="small"
              type="success"
              link
              @click="handleRefund(row)"
            >
              强制退款
            </el-button>
            <el-button
              v-if="row.status === 0 || row.status === 1"
              size="small"
              type="danger"
              link
              @click="handleClose(row)"
            >
              关闭争议
            </el-button>
            <span v-if="row.status === 2 || row.status === 3" class="no-action">已处理完成</span>
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
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import {
  closeAfterSale,
  getAfterSaleList,
  getAfterSaleStats,
  interveneAfterSale,
  refundAfterSale
} from '../api/afterSale'
import { formatTime } from '../utils/format'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const stats = reactive({ pending: 0, overdue: 0, intervened: 0, completed: 0, closed: 0 })

const query = reactive({ page: 1, page_size: 10, status: '', type: '' })

function statusText(status) {
  return { 0: '待处理', 1: '平台已介入', 2: '已完成', 3: '已关闭' }[status] || '未知'
}

function statusTagType(status) {
  return { 0: 'warning', 1: 'primary', 2: 'success', 3: 'info' }[status] || 'info'
}

async function fetchStats() {
  try {
    const res = await getAfterSaleStats()
    Object.assign(stats, res.data)
  } catch {
    /* 错误提示已由拦截器统一处理 */
  }
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: query.page, page_size: query.page_size }
    if (query.status !== '') params.status = query.status
    if (query.type !== '') params.type = query.type
    const res = await getAfterSaleList(params)
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

async function handleIntervene(row) {
  try {
    await ElMessageBox.confirm(
      `确定以平台身份介入售后单「${row.after_sale_no}」吗？`,
      '平台介入',
      { type: 'warning' }
    )
  } catch {
    return
  }
  try {
    await interveneAfterSale(row.id)
    ElMessage.success('平台介入成功')
    handleSearch()
  } catch {
    /* 错误提示已由拦截器统一处理 */
  }
}

async function handleRefund(row) {
  try {
    await ElMessageBox.confirm(
      `确定对售后单「${row.after_sale_no}」执行强制退款吗？关联订单将同步标记为已退款。`,
      '强制退款',
      { type: 'warning', confirmButtonText: '确认退款', confirmButtonClass: 'el-button--danger' }
    )
  } catch {
    return
  }
  try {
    await refundAfterSale(row.id, { result: '管理员强制退款' })
    ElMessage.success('强制退款成功')
    handleSearch()
  } catch {
    /* 错误提示已由拦截器统一处理 */
  }
}

async function handleClose(row) {
  try {
    await ElMessageBox.confirm(
      `确定关闭售后单「${row.after_sale_no}」的争议吗？`,
      '关闭争议',
      { type: 'warning' }
    )
  } catch {
    return
  }
  try {
    await closeAfterSale(row.id, { result: '管理员关闭争议' })
    ElMessage.success('关闭争议成功')
    handleSearch()
  } catch {
    /* 错误提示已由拦截器统一处理 */
  }
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

.stat-pending {
  background: #e6a23c;
}

.stat-overdue {
  background: #f56c6c;
}

.stat-intervened {
  background: #409eff;
}

.stat-completed {
  background: #67c23a;
}

.stat-closed {
  background: #909399;
}

.auto-alert {
  margin-bottom: 16px;
}

.no-action {
  color: #909399;
  font-size: 13px;
}
</style>
