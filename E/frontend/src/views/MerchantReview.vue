<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="query.account_status" style="width: 160px" @change="handleSearch">
            <el-option label="待审核" value="PENDING" />
            <el-option label="已开通" value="ACTIVE" />
            <el-option label="全部" value="" />
          </el-select>
        </div>
        <el-button :icon="Refresh" @click="handleSearch">刷新</el-button>
      </div>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="username" label="用户名" width="110" />
        <el-table-column prop="email" label="邮箱" min-width="170" show-overflow-tooltip />
        <el-table-column label="店铺名称" min-width="130">
          <template #default="{ row }">{{ shopName(row) }}</template>
        </el-table-column>
        <el-table-column label="联系人" width="100">
          <template #default="{ row }">{{ contact(row) }}</template>
        </el-table-column>
        <el-table-column label="入驻说明" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ description(row) }}</template>
        </el-table-column>
        <el-table-column label="申请时间" width="170">
          <template #default="{ row }">{{ appliedAt(row) }}</template>
        </el-table-column>
        <el-table-column label="审核状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="reviewTagType(row)">{{ reviewText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ reviewRemark(row) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <template v-if="canReview(row)">
              <el-button size="small" type="success" link @click="handleApprove(row)">通过</el-button>
              <el-button size="small" type="danger" link @click="handleReject(row)">拒绝</el-button>
            </template>
            <span v-else class="muted-text">已审核</span>
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
import { approveMerchant, getMerchantApplications, rejectMerchant } from '../api/merchant'
import { formatTime } from '../utils/format'

const loading = ref(false)
const list = ref([])
const total = ref(0)

const query = reactive({ page: 1, page_size: 10, account_status: 'PENDING' })

function application(row) {
  return row.merchant_application || {}
}

function shopName(row) {
  return application(row).shop_name || '-'
}

function contact(row) {
  return application(row).contact || '-'
}

function description(row) {
  return application(row).description || '-'
}

function appliedAt(row) {
  return application(row).applied_at ? formatTime(application(row).applied_at) : '-'
}

function review(row) {
  return application(row).review || null
}

function canReview(row) {
  return row.account_status === 'PENDING' && !review(row)
}

function reviewText(row) {
  const r = review(row)
  if (r) return r.result === 'APPROVED' ? '已通过' : '已拒绝'
  return row.account_status === 'ACTIVE' ? '已开通' : '待审核'
}

function reviewTagType(row) {
  const r = review(row)
  if (r) return r.result === 'APPROVED' ? 'success' : 'danger'
  return row.account_status === 'ACTIVE' ? 'success' : 'warning'
}

function reviewRemark(row) {
  const r = review(row)
  if (!r) return '-'
  return `${r.remark}（${r.operator_name || '管理员'}）`
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: query.page, page_size: query.page_size }
    if (query.account_status) params.account_status = query.account_status
    const res = await getMerchantApplications(params)
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

async function handleApprove(row) {
  try {
    await ElMessageBox.confirm(
      `确定通过「${shopName(row)}」（${row.email}）的入驻申请吗？通过后该商家即可登录商家后台。`,
      '商家审核',
      { type: 'warning', confirmButtonText: '通过申请' }
    )
  } catch {
    return
  }
  try {
    await approveMerchant(row.id)
    ElMessage.success('审核通过，商家已开通登录')
    fetchList()
  } catch {
    /* 错误提示已由拦截器统一处理 */
  }
}

async function handleReject(row) {
  let remark
  try {
    remark = (
      await ElMessageBox.prompt('请输入驳回原因（1-200 字，必填）', '驳回入驻申请', {
        confirmButtonText: '确认驳回',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputValidator: (value) => {
          const v = (value || '').trim()
          if (!v) return '驳回原因不能为空'
          if (v.length > 200) return '驳回原因不能超过 200 字'
          return true
        }
      })
    ).value.trim()
  } catch {
    return
  }
  try {
    await rejectMerchant(row.id, { remark })
    ElMessage.success('已驳回该申请')
    fetchList()
  } catch {
    /* 错误提示已由拦截器统一处理 */
  }
}

onMounted(fetchList)
</script>

<style scoped>
.muted-text {
  color: #909399;
  font-size: 13px;
}
</style>
