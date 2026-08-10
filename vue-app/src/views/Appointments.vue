<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatusTag from '../components/StatusTag.vue'
import EmptyState from '../components/EmptyState.vue'
import PubPaymentDialog from '../components/PubPaymentDialog.vue'
import { listAppointments, cancelAppointment, payAppointment } from '../api/appointments'

/**
 * 我的预约列表
 * - 卡片式展示预约信息 + 状态标签
 * - 操作按钮按状态显示：待支付→[去支付][取消]、已支付→[查看处方][取消]、已完成→[查看处方]
 * - 支付复用 PubPaymentDialog 组件
 */
const router = useRouter()

const appointments = ref([])
const loading = ref(false)

// 支付弹窗
const payDialogVisible = ref(false)
const currentAppt = ref(null)

async function fetchList() {
  loading.value = true
  try {
    appointments.value = (await listAppointments()) || []
  } catch {
    appointments.value = []
  } finally {
    loading.value = false
  }
}

// 去支付
function openPay(appt) {
  currentAppt.value = appt
  payDialogVisible.value = true
}

// 取消预约
async function handleCancel(appt) {
  try {
    await ElMessageBox.confirm('确定要取消该预约吗？取消后不可恢复。', '取消预约', {
      type: 'warning',
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想',
    })
  } catch {
    return // 用户取消
  }
  try {
    await cancelAppointment(appt.id)
    ElMessage.success('预约已取消')
    fetchList()
  } catch {
    /* 错误已由拦截器提示 */
  }
}

// 支付成功
function handlePaySuccess() {
  ElMessage.success('支付成功')
  fetchList()
}

// 查看处方
function viewPrescription() {
  router.push({ name: 'prescriptions' })
}

onMounted(fetchList)
</script>

<template>
  <div class="page appointments">
    <div v-loading="loading" class="appointments__list">
      <div v-for="appt in appointments" :key="appt.id" class="card appointments__item">
        <div class="appointments__head">
          <div class="appointments__doc">
            {{ appt.doctor_name || '医生' }}
            <span class="appointments__dept">{{ appt.department_name || appt.doctor?.department_name || '' }}</span>
          </div>
          <StatusTag :status="appt.status" />
        </div>

        <div class="appointments__rows">
          <div class="appointments__row">
            <span class="appointments__label">就诊时间</span>
            <span>{{ appt.appoint_date }} {{ appt.period }}</span>
          </div>
          <div class="appointments__row">
            <span class="appointments__label">排队号</span>
            <span>{{ appt.queue_no ?? '—' }}</span>
          </div>
          <div class="appointments__row">
            <span class="appointments__label">挂号费</span>
            <span class="text-price">￥{{ Number(appt.fee).toFixed(2) }}</span>
          </div>
        </div>

        <!-- 按状态显示操作按钮 -->
        <div class="appointments__actions">
          <template v-if="appt.status === '待支付'">
            <el-button size="small" @click="handleCancel(appt)">取消</el-button>
            <el-button size="small" type="primary" @click="openPay(appt)">去支付</el-button>
          </template>
          <template v-else-if="appt.status === '已支付'">
            <el-button size="small" @click="handleCancel(appt)">取消</el-button>
            <el-button size="small" type="primary" plain @click="viewPrescription">查看处方</el-button>
          </template>
          <template v-else-if="appt.status === '已完成'">
            <el-button size="small" type="primary" plain @click="viewPrescription">查看处方</el-button>
          </template>
        </div>
      </div>

      <EmptyState
        v-if="!loading && appointments.length === 0"
        description="暂无预约记录"
        button-text="去挂号"
        @action="router.push({ name: 'doctors' })"
      />
    </div>

    <!-- 支付弹窗（待支付订单补支付） -->
    <PubPaymentDialog
      v-model="payDialogVisible"
      title="挂号费支付"
      :order-no="currentAppt?.order_no || ''"
      :amount="Number(currentAppt?.fee || 0)"
      :pay="(method) => payAppointment(currentAppt.id, { method })"
      @success="handlePaySuccess"
    />
  </div>
</template>

<style scoped>
.appointments__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 200px;
  margin-top: 12px;
}

.appointments__item {
  padding: 14px;
}

.appointments__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.appointments__doc {
  font-size: 15px;
  font-weight: 600;
}

.appointments__dept {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
}

.appointments__rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 0;
  border-top: 1px dashed var(--color-border);
  border-bottom: 1px dashed var(--color-border);
}

.appointments__row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.appointments__label {
  color: var(--text-secondary);
}

.appointments__actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
