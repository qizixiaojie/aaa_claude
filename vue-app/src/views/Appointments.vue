<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatusTag from '../components/StatusTag.vue'
import EmptyState from '../components/EmptyState.vue'
import PubPaymentDialog from '../components/PubPaymentDialog.vue'
import { listAppointments, cancelAppointment, payAppointment, checkinAppointment, finishAppointment } from '../api/appointments'

/**
 * 我的预约列表
 * - 卡片式展示预约信息 + 状态标签
 * - 就诊闭环：待支付→[去支付][取消] 已支付→[到院签到][取消] 待就诊→[接诊完成] 已完成→[查看处方]
 * - 已支付以上状态展示就诊码（= 支付凭证号）；接诊完成时后台才生成电子处方
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
function handlePaySuccess(result) {
  const cert = result?.payment?.paymentNo
  ElMessage.success(cert ? `支付成功，就诊码 ${cert}` : '支付成功')
  fetchList()
}

// 到院签到：已支付 → 待就诊
async function handleCheckin(appt) {
  try {
    await ElMessageBox.confirm(
      `确认患者「${appt.patientName || ''}」已到院，请出示就诊码签到？`,
      '到院签到',
      { type: 'info', confirmButtonText: '确认签到', cancelButtonText: '再等等' }
    )
  } catch {
    return // 用户取消
  }
  try {
    await checkinAppointment(appt.id)
    ElMessage.success('签到成功，请按排队号等待就诊')
    fetchList()
  } catch {
    /* 错误已由拦截器提示 */
  }
}

// 接诊完成（演示医生操作）：待就诊 → 已完成，此刻生成电子处方
async function handleFinish(appt) {
  try {
    await ElMessageBox.confirm('确认该患者已完成就诊？完成后将生成电子处方。', '接诊完成', {
      type: 'success',
      confirmButtonText: '确认完成',
      cancelButtonText: '再等等',
    })
  } catch {
    return // 用户取消
  }
  try {
    await finishAppointment(appt.id)
    ElMessage.success('就诊完成，电子处方已生成')
    fetchList()
  } catch {
    /* 错误已由拦截器提示 */
  }
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
            {{ appt.doctor?.name || '医生' }}
            <span class="appointments__dept">{{ appt.doctor?.department?.name || '' }}</span>
          </div>
          <StatusTag :status="appt.status" />
        </div>

        <div class="appointments__rows">
          <div class="appointments__row">
            <span class="appointments__label">就诊时间</span>
            <span>{{ appt.appointDate }} {{ appt.period }}</span>
          </div>
          <div class="appointments__row">
            <span class="appointments__label">排队号</span>
            <span>{{ appt.queueNo ?? '—' }}</span>
          </div>
          <div class="appointments__row">
            <span class="appointments__label">挂号费</span>
            <span class="text-price">￥{{ Number(appt.fee).toFixed(2) }}</span>
          </div>
          <div class="appointments__row">
            <span class="appointments__label">预约时间</span>
            <span>{{ appt.createdAt || '—' }}</span>
          </div>
          <!-- 已支付/待就诊/已完成：展示支付时间与就诊码（= 唯一支付凭证号） -->
          <template v-if="appt.status === '已支付' || appt.status === '待就诊' || appt.status === '已完成'">
            <div class="appointments__row">
              <span class="appointments__label">支付时间</span>
              <span>{{ appt.paidAt || '—' }}</span>
            </div>
            <div class="appointments__row">
              <span class="appointments__label">就诊码</span>
              <span class="appointments__cert">{{ appt.paymentNo || '—' }}</span>
            </div>
          </template>
        </div>

        <!-- 按状态显示操作按钮（就诊闭环：支付 → 签到 → 接诊完成 → 看处方） -->
        <div class="appointments__actions">
          <template v-if="appt.status === '待支付'">
            <el-button size="small" @click="handleCancel(appt)">取消</el-button>
            <el-button size="small" type="primary" @click="openPay(appt)">去支付</el-button>
          </template>
          <template v-else-if="appt.status === '已支付'">
            <el-button size="small" @click="handleCancel(appt)">取消</el-button>
            <el-button size="small" type="primary" @click="handleCheckin(appt)">到院签到</el-button>
          </template>
          <template v-else-if="appt.status === '待就诊'">
            <el-button size="small" type="success" @click="handleFinish(appt)">接诊完成</el-button>
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
      :order-no="currentAppt?.orderNo || ''"
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

.appointments__cert {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: var(--text-regular);
  word-break: break-all;
}

.appointments__actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
