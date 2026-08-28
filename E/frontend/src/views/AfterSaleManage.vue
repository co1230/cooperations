<template>
  <div class="page-container">
    <!-- 状态统计卡片 -->
    <div class="stats-row">
      <div class="stat-card stat-pending">
        <div class="stat-num">{{ stats.pending }}</div>
        <div class="stat-label">待审核</div>
      </div>
      <div class="stat-card stat-overdue">
        <div class="stat-num">{{ stats.overdue }}</div>
        <div class="stat-label">超时未处理</div>
      </div>
      <div class="stat-card stat-processing">
        <div class="stat-num">{{ stats.processing }}</div>
        <div class="stat-label">处理中</div>
      </div>
      <div class="stat-card stat-completed">
        <div class="stat-num">{{ stats.completed }}</div>
        <div class="stat-label">已退款</div>
      </div>
      <div class="stat-card stat-closed">
        <div class="stat-num">{{ stats.closed }}</div>
        <div class="stat-label">已驳回/关闭</div>
      </div>
    </div>

    <el-card shadow="never">
      <el-alert
        type="info"
        show-icon
        :closable="false"
        title="系统每 30 秒自动扫描一次售后工单，超过处理时限仍未处理的工单自动标记「处理中（平台介入）」。强制退款/驳回均需填写 1-200 字处理原因；可覆盖商家已拒绝的最新申请；已有更新工单或已被平台处理过的工单不可重复介入。"
        class="auto-alert"
      />
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="query.status" style="width: 150px" @change="handleSearch">
            <el-option label="全部状态" value="" />
            <el-option label="待审核" value="APPLIED" />
            <el-option label="处理中" value="PROCESSING" />
            <el-option label="已同意" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
            <el-option label="买家已寄回" value="BUYER_SHIPPED" />
            <el-option label="退款中" value="REFUNDING" />
            <el-option label="已退款" value="COMPLETED" />
            <el-option label="已关闭" value="CLOSED" />
          </el-select>
          <el-select v-model="query.type" style="width: 150px" @change="handleSearch">
            <el-option label="全部类型" value="" />
            <el-option label="仅退款" value="REFUND_ONLY" />
            <el-option label="退货退款" value="RETURN_REFUND" />
            <el-option label="换货" value="EXCHANGE" />
          </el-select>
        </div>
        <el-button :icon="Refresh" @click="handleSearch">刷新</el-button>
      </div>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="ticket_no" label="工单号" min-width="130" />
        <el-table-column prop="order_no" label="订单号" min-width="125" />
        <el-table-column label="商品" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.product_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="买家" width="130">
          <template #default="{ row }">
            {{ row.buyer_name }}
            <el-tag
              v-if="row.user_account_status === 'DISABLED'"
              type="danger"
              size="small"
              class="banned-tag"
            >
              已封禁
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="typeTagType(row.ticket_type)">{{ typeText(row.ticket_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请金额" width="100" align="right">
          <template #default="{ row }">
            {{ row.requested_amount != null ? '¥' + row.requested_amount : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="申请原因" min-width="120" show-overflow-tooltip />
        <el-table-column label="状态" width="105" align="center">
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
        <el-table-column label="处理截止" width="170">
          <template #default="{ row }">{{ row.deadline ? formatTime(row.deadline) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'APPLIED' && !row.is_platform_intervened"
              size="small"
              type="primary"
              link
              @click="handleIntervene(row)"
            >
              介入
            </el-button>
            <el-button v-if="row.can_force_refund" size="small" type="success" link @click="handleRefund(row)">
              强制退款
            </el-button>
            <el-button v-if="row.can_reject" size="small" type="danger" link @click="handleReject(row)">
              驳回
            </el-button>
            <span
              v-if="!row.can_force_refund && !row.can_reject && !(row.status === 'APPLIED' && !row.is_platform_intervened)"
              class="no-action"
            >
              不可介入
            </span>
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
const stats = reactive({ pending: 0, overdue: 0, processing: 0, completed: 0, closed: 0 })

const query = reactive({ page: 1, page_size: 10, status: '', type: '' })

const statusMap = {
  APPLIED: ['待审核', 'warning'],
  PROCESSING: ['处理中', 'primary'],
  APPROVED: ['已同意', 'success'],
  REJECTED: ['已驳回', 'danger'],
  BUYER_SHIPPED: ['买家已寄回', 'info'],
  REFUNDING: ['退款中', 'warning'],
  COMPLETED: ['已退款', 'success'],
  CLOSED: ['已关闭', 'info']
}

const typeMap = {
  REFUND_ONLY: ['仅退款', 'primary'],
  RETURN_REFUND: ['退货退款', 'warning'],
  EXCHANGE: ['换货', 'info']
}

function statusText(status) {
  return statusMap[status]?.[0] || status
}

function statusTagType(status) {
  return statusMap[status]?.[1] || 'info'
}

function typeText(type) {
  return typeMap[type]?.[0] || type
}

function typeTagType(type) {
  return typeMap[type]?.[1] || 'info'
}

// 平台处理原因校验：1-200 字（对齐 A 任务规则）
function promptReason(title) {
  return ElMessageBox.prompt('请输入平台处理原因（1-200 字，必填）', title, {
    confirmButtonText: '确认处理',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputValidator: (value) => {
      const v = (value || '').trim()
      if (!v) return '处理原因不能为空'
      if (v.length > 200) return '处理原因不能超过 200 字'
      return true
    }
  })
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
    if (query.status) params.status = query.status
    if (query.type) params.type = query.type
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
      `确定以平台身份介入售后工单「${row.ticket_no}」吗？`,
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
  let reason
  try {
    reason = (await promptReason('强制退款')).value.trim()
  } catch {
    return
  }
  try {
    await refundAfterSale(row.id, { reason })
    ElMessage.success('强制退款成功')
    handleSearch()
  } catch {
    /* 错误提示已由拦截器统一处理 */
  }
}

async function handleReject(row) {
  let reason
  try {
    reason = (await promptReason('驳回申请')).value.trim()
  } catch {
    return
  }
  try {
    await closeAfterSale(row.id, { reason })
    ElMessage.success('驳回成功，争议已关闭')
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

.stat-processing {
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

.banned-tag {
  margin-left: 4px;
}

.no-action {
  color: #909399;
  font-size: 13px;
}
</style>
