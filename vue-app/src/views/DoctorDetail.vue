<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Warning } from '@element-plus/icons-vue'
import SectionTitle from '../components/SectionTitle.vue'
import EmptyState from '../components/EmptyState.vue'
import { getDoctor, getSchedules } from '../api/doctors'

/**
 * 医生详情页（独立子页：白底 + 返回）
 * - 医生信息 + 擅长与简介
 * - 未来 7 天排班（余号 > 0 可点，余号少显示紧张）
 * - 底部固定「立即挂号」按钮，带所选排班跳挂号页
 */
const route = useRoute()
const router = useRouter()
const doctorId = route.params.id

const doctor = ref(null)
const schedules = ref([])
const selectedSchedule = ref(null)

// 按出诊日期分组的排班（未来 7 天）
const scheduleDays = computed(() => {
  const map = new Map()
  schedules.value.forEach((s) => {
    if (!map.has(s.workDate)) map.set(s.workDate, [])
    map.get(s.workDate).push(s)
  })
  return Array.from(map.entries()).sort((a, b) => (a[0] > b[0] ? 1 : -1))
})

// 选中排班
function pickSchedule(s) {
  selectedSchedule.value = selectedSchedule.value?.id === s.id ? null : s
}

function isSelected(s) {
  return selectedSchedule.value?.id === s.id
}

// 底部「立即挂号」：带所选排班跳 /booking/:doctorId?scheduleId=&date=&period=
function goBook() {
  const query = selectedSchedule.value
    ? {
        scheduleId: selectedSchedule.value.id,
        date: selectedSchedule.value.workDate,
        period: selectedSchedule.value.period,
      }
    : {}
  router.push({ name: 'booking', params: { doctorId }, query })
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
  <div class="sub-page doctor-detail">
    <!-- 返回栏 -->
    <header class="sub-page-header">
      <div class="sub-page-header__back" @click="router.back()">
        <el-icon :size="18"><ArrowLeft /></el-icon>
      </div>
      <span class="sub-page-header__title">医生详情</span>
    </header>

    <div class="sub-page-content doctor-detail__content">
      <!-- 医生信息 -->
      <template v-if="doctor">
        <div class="card doctor-detail__head">
          <div class="doctor-detail__avatar">{{ doctor.name.charAt(0) }}</div>
          <div class="doctor-detail__head-info">
            <div class="doctor-detail__name">
              {{ doctor.name }}
              <el-tag size="small" type="primary" effect="plain">{{ doctor.title }}</el-tag>
            </div>
            <div class="doctor-detail__meta">
              {{ doctor.department?.name || '未知科室' }}
              · {{ doctor.yearsExperience }} 年从业经验
            </div>
            <div class="doctor-detail__fee">
              挂号费 <span class="text-price">￥{{ doctor.regFee }}</span>
            </div>
          </div>
        </div>

        <!-- 擅长与简介 -->
        <div class="card doctor-detail__block">
          <div class="doctor-detail__row">
            <span class="doctor-detail__label">擅长</span>
            <span>{{ doctor.specialty || '暂无' }}</span>
          </div>
          <div class="doctor-detail__row doctor-detail__row--col">
            <span class="doctor-detail__label">简介</span>
            <span class="doctor-detail__intro">{{ doctor.introduction || '该医生暂未填写简介' }}</span>
          </div>
        </div>

        <!-- 排班时间 -->
        <SectionTitle title="排班时间" />
        <div class="card">
          <div v-if="scheduleDays.length" class="doctor-detail__schedules">
            <div v-for="[date, items] in scheduleDays" :key="date" class="doctor-detail__day">
              <div class="doctor-detail__date">{{ date }}</div>
              <div class="doctor-detail__periods">
                <div
                  v-for="s in items"
                  :key="s.id"
                  class="doctor-detail__period"
                  :class="{
                    'doctor-detail__period--active': isSelected(s),
                    'doctor-detail__period--disabled': s.remainingSlots <= 0,
                  }"
                  @click="s.remainingSlots > 0 && pickSchedule(s)"
                >
                  <span>{{ s.period }}</span>
                  <span class="doctor-detail__remain">
                    <template v-if="s.remainingSlots > 0">
                      余 {{ s.remainingSlots }} 号
                      <el-tag v-if="s.remainingSlots < 5" size="small" type="danger" effect="light">
                        紧张
                      </el-tag>
                    </template>
                    <span v-else>约满</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <EmptyState v-else description="近期暂无排班" />
        </div>

        <div class="doctor-detail__tip">
          <el-icon :size="14"><Warning /></el-icon>
          <span>请提前选择就诊时间，按时就诊</span>
        </div>
      </template>

      <EmptyState v-else description="医生信息加载失败" />
    </div>

    <!-- 底部固定：立即挂号 -->
    <div v-if="doctor" class="fixed-bar">
      <el-button type="primary" @click="goBook">立即挂号</el-button>
    </div>
  </div>
</template>

<style scoped>
.doctor-detail__content {
  padding-bottom: 76px;
}

.doctor-detail__head {
  display: flex;
  gap: 14px;
  align-items: center;
}

.doctor-detail__avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), #79bbff);
  flex-shrink: 0;
}

.doctor-detail__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.doctor-detail__meta {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.doctor-detail__fee {
  margin-top: 8px;
  font-size: 13px;
}

.doctor-detail__block {
  margin-top: 12px;
}

.doctor-detail__row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.7;
}

.doctor-detail__row--col {
  flex-direction: column;
  gap: 4px;
  margin-bottom: 0;
}

.doctor-detail__label {
  flex-shrink: 0;
  color: var(--text-secondary);
}

.doctor-detail__intro {
  color: var(--text-regular);
}

.doctor-detail__day {
  margin-bottom: 14px;
}

.doctor-detail__day:last-child {
  margin-bottom: 0;
}

.doctor-detail__date {
  font-size: 13px;
  color: var(--text-regular);
  font-weight: 600;
  margin-bottom: 8px;
}

.doctor-detail__periods {
  display: flex;
  gap: 10px;
}

.doctor-detail__period {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.doctor-detail__period--active {
  border-color: var(--color-primary);
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.doctor-detail__period--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.doctor-detail__remain {
  font-size: 11px;
  color: var(--text-secondary);
}

.doctor-detail__tip {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
