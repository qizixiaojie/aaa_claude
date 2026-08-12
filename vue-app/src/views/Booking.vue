<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, HomeFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import PubPaymentDialog from '../components/PubPaymentDialog.vue'
import EmptyState from '../components/EmptyState.vue'
import { getDoctor, getSchedules } from '../api/doctors'
import { createAppointment, payAppointment } from '../api/appointments'
import { useUserStore } from '../stores/user'

/**
 * 挂号确认 + 支付页（独立子页：白底 + 返回）
 * - 展示医生与所选时间摘要
 * - 患者姓名（默认当前用户，可改）
 * - 确认挂号 → 生成待支付订单 → 支付弹窗 → 支付成功展示排队号 → 跳我的预约
 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const doctorId = route.params.doctorId

const doctor = ref(null)
const schedules = ref([])
const patientName = ref(userStore.userInfo?.realName || '')
const submitting = ref(false)

// 患者信息缺失时的提示
const patientHint = computed(() => (patientName.value ? '' : '请填写患者姓名'))

// 排班按日期分组（供选择时间）
const scheduleDays = computed(() => {
  const map = new Map()
  schedules.value.forEach((s) => {
    if (!map.has(s.workDate)) map.set(s.workDate, [])
    map.get(s.workDate).push(s)
  })
  return Array.from(map.entries()).sort((a, b) => (a[0] > b[0] ? 1 : -1))
})

// 当前选中的排班：优先用路由 query 传入，否则用户手动选择
const picked = ref(null)
const selectedSchedule = computed(() => {
  if (picked.value) return picked.value
  return (
    schedules.value.find((s) => String(s.id) === String(route.query.scheduleId)) || null
  )
})

const fee = computed(() => Number(doctor.value?.regFee || 0))

// 支付弹窗状态
const payDialogVisible = ref(false)
const currentOrder = ref(null)

// 选择排班
function pickSchedule(s) {
  picked.value = picked.value?.id === s.id ? null : s
}

function isSelected(s) {
  return selectedSchedule.value?.id === s.id
}

// 确认挂号：生成待支付订单
async function handleConfirm() {
  if (!selectedSchedule.value) {
    ElMessage.warning('请选择就诊时间')
    return
  }
  if (!patientName.value.trim()) {
    ElMessage.warning('请填写患者姓名')
    return
  }
  submitting.value = true
  try {
    const appt = await createAppointment({
      doctorId,
      scheduleId: selectedSchedule.value.id,
      appointDate: selectedSchedule.value.workDate,
      period: selectedSchedule.value.period,
      patientName: patientName.value.trim(),
    })
    currentOrder.value = appt
    payDialogVisible.value = true
  } catch {
    /* 错误已由拦截器提示 */
  } finally {
    submitting.value = false
  }
}

// 支付成功：展示排队号与支付凭证号，并跳我的预约
function handlePaySuccess(payResult) {
  const queueNo = currentOrder.value?.appointment?.queueNo
  const cert = payResult?.payment?.paymentNo
  let msg = `支付成功！排队号 ${queueNo ?? '—'}`
  if (cert) msg += `，支付凭证 ${cert}`
  ElMessage.success(msg)
  router.push({ name: 'appointments' })
}

onMounted(async () => {
  try {
    doctor.value = await getDoctor(doctorId)
  } catch {
    doctor.value = null
  }
  try {
    schedules.value = (await getSchedules(doctorId)) || []
  } catch {
    schedules.value = []
  }
})
</script>

<template>
  <div class="sub-page booking">
    <!-- 返回栏 -->
    <header class="sub-page-header">
      <div class="sub-page-header__back" @click="router.back()">
        <el-icon :size="18"><ArrowLeft /></el-icon>
      </div>
      <span class="sub-page-header__title">预约挂号</span>
      <div class="sub-page-header__home" @click="router.push({ name: 'home' })">
        <el-icon :size="18"><HomeFilled /></el-icon>
      </div>
    </header>

    <div class="sub-page-content booking__content">
      <template v-if="doctor">
        <!-- 医生与所选时间摘要 -->
        <div class="card">
          <el-descriptions :column="1" size="small" title="挂号信息">
            <el-descriptions-item label="医生">
              {{ doctor.name }} · {{ doctor.title }}
            </el-descriptions-item>
            <el-descriptions-item label="科室">
              {{ doctor.department?.name || '未知科室' }}
            </el-descriptions-item>
            <el-descriptions-item label="就诊日期">
              {{ selectedSchedule ? selectedSchedule.workDate : '请选择' }}
            </el-descriptions-item>
            <el-descriptions-item label="就诊时段">
              {{ selectedSchedule ? selectedSchedule.period : '请选择' }}
            </el-descriptions-item>
            <el-descriptions-item label="挂号费">
              <span class="text-price">￥{{ fee.toFixed(2) }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 未带排班进入时，选择就诊时间 -->
        <div v-if="!route.query.scheduleId && scheduleDays.length" class="card booking__pick">
          <div class="booking__pick-title">请选择就诊时间</div>
          <div v-for="[date, items] in scheduleDays" :key="date" class="booking__day">
            <div class="booking__date">{{ date }}</div>
            <div class="booking__periods">
              <div
                v-for="s in items"
                :key="s.id"
                class="booking__period"
                :class="{
                  'booking__period--active': isSelected(s),
                  'booking__period--disabled': s.remainingSlots <= 0,
                }"
                @click="s.remainingSlots > 0 && pickSchedule(s)"
              >
                {{ s.period }} · 余 {{ s.remainingSlots }}
              </div>
            </div>
          </div>
        </div>

        <!-- 患者信息 -->
        <div class="card booking__patient">
          <div class="booking__patient-label">患者姓名</div>
          <el-input
            v-model="patientName"
            placeholder="请输入患者姓名"
            clearable
          />
          <div v-if="patientHint" class="booking__hint">{{ patientHint }}</div>
        </div>
      </template>

      <EmptyState v-else description="医生信息加载失败" />

      <!-- 支付弹窗（与我的预约共用组件） -->
      <PubPaymentDialog
        v-model="payDialogVisible"
        title="挂号费支付"
        :order-no="currentOrder?.appointment?.orderNo || ''"
        :amount="fee"
        :pay="(method) => payAppointment(currentOrder?.appointment?.id, { method })"
        @success="handlePaySuccess"
      />
    </div>

    <!-- 底部固定：确认挂号 -->
    <div v-if="doctor" class="fixed-bar">
      <el-button type="primary" :loading="submitting" @click="handleConfirm">
        确认挂号
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.booking__content {
  padding-bottom: 76px;
}

.booking__pick {
  margin-top: 12px;
}

.booking__pick-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

.booking__day {
  margin-bottom: 12px;
}

.booking__day:last-child {
  margin-bottom: 0;
}

.booking__date {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.booking__periods {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.booking__period {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.booking__period--active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.booking__period--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.booking__patient {
  margin-top: 12px;
}

.booking__patient-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.booking__hint {
  margin-top: 6px;
  font-size: 12px;
  color: #f56c6c;
}
</style>
