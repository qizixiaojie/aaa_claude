<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

/**
 * 医生卡片（头像占位 / 名字 / 职称 / 科室 / 擅长 / 挂号费 / 立即挂号）
 * 用于：首页推荐医生、医生列表、科室医生列表
 */
const props = defineProps({
  doctor: { type: Object, required: true },
})

const router = useRouter()

// 后端返回嵌套 department.name
const deptName = computed(() => props.doctor.department?.name || '未知科室')

// 点击卡片 → 医生详情（动态参数）
function goDetail() {
  router.push({ name: 'doctorDetail', params: { id: props.doctor.id } })
}

// 立即挂号 → 挂号确认页
function goBook() {
  router.push({ name: 'booking', params: { doctorId: props.doctor.id } })
}
</script>

<template>
  <div class="doctor-card" @click="goDetail">
    <div class="doctor-card__avatar">
      {{ doctor.name ? doctor.name.charAt(0) : '医' }}
    </div>

    <div class="doctor-card__info">
      <div class="doctor-card__name">
        <span class="doctor-card__name-text">{{ doctor.name }}</span>
        <el-tag size="small" type="primary" effect="plain">{{ doctor.title }}</el-tag>
      </div>
      <div class="doctor-card__meta">{{ deptName }} · {{ doctor.yearsExperience }} 年经验</div>
      <div class="doctor-card__specialty ellipsis">擅长：{{ doctor.specialty || '暂无' }}</div>
    </div>

    <div class="doctor-card__right">
      <div class="doctor-card__fee">
        <span class="text-price">￥{{ doctor.regFee }}</span>
        <span class="doctor-card__fee-label">/挂号费</span>
      </div>
      <el-button type="primary" size="small" round @click.stop="goBook">立即挂号</el-button>
    </div>
  </div>
</template>

<style scoped>
.doctor-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background-color: var(--color-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  cursor: pointer;
}

.doctor-card__avatar {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), #79bbff);
}

.doctor-card__info {
  flex: 1;
  min-width: 0;
}

.doctor-card__name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.doctor-card__name-text {
  font-size: 16px;
  font-weight: 600;
}

.doctor-card__meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.doctor-card__specialty {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-regular);
}

.doctor-card__right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.doctor-card__fee {
  font-size: 14px;
}

.doctor-card__fee .text-price {
  font-size: 17px;
}

.doctor-card__fee-label {
  font-size: 11px;
  color: var(--text-secondary);
}
</style>
