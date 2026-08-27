// Shared helpers. Load before all application scripts in index.html.
const orderStatusNames = {PENDING_PAYMENT: '待付款', PAID: '待发货', SHIPPED: '已发货', COMPLETED: '已完成', CANCELLED: '已取消', CLOSED: '已关闭'};
const afterSaleNames = {NONE: '无售后', APPLIED: '退款审核中', PROCESSING: '处理中', APPROVED: '已同意', REJECTED: '已拒绝', REFUNDING: '退款中', REFUNDED: '已退款', CLOSED: '已关闭'};
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const money = amount => `¥ ${Number(amount).toFixed(2)}`;
