<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, OfficeBuilding, FirstAidKit, Document, Location, Clock } from '@element-plus/icons-vue'
import SectionTitle from '../components/SectionTitle.vue'
import DepartmentCard from '../components/DepartmentCard.vue'
import DoctorCard from '../components/DoctorCard.vue'
import { getHospitalProfile } from '../api/hospital'
import { listDepartments } from '../api/departments'
import { listDoctors } from '../api/doctors'

const router = useRouter()

// 医院信息（API 拉取，失败时兜底默认值）
const hospital = ref({
  name: '仁爱医院',
  level: '三级甲等',
  address: '建设中路 1 号',
  open_hours: '周一至周日 8:00-17:00',
})

const departments = ref([])
const doctors = ref([])

// 快捷入口宫格
const quickEntries = [
  { label: '预约挂号', icon: Calendar, name: 'doctors' },
  { label: '科室导航', icon: OfficeBuilding, name: 'departments' },
  { label: '药品查询', icon: FirstAidKit, name: 'medicines' },
  { label: '我的处方', icon: Document, name: 'prescriptions' },
]

function goEntry(entry) {
  router.push({ name: entry.name })
}

onMounted(async () => {
  // 医院简介
  try {
    hospital.value = { ...hospital.value, ...(await getHospitalProfile()) }
  } catch {
    /* 错误已由拦截器提示，使用默认值兜底 */
  }
  // 科室（前 8 个宫格展示）
  try {
    departments.value = ((await listDepartments()) || []).slice(0, 8)
  } catch {
    departments.value = []
  }
  // 推荐医生（前 4 个）
  try {
    doctors.value = ((await listDoctors({ limit: 4 })) || []).slice(0, 4)
  } catch {
    doctors.value = []
  }
})
</script>

<template>
  <div class="page home">
    <!-- 医院卡片 -->
    <div class="card home__hospital">
      <div class="home__hospital-head">
        <div class="home__hospital-name">{{ hospital.name }}</div>
        <el-tag size="small" type="danger" effect="plain">{{ hospital.level }}</el-tag>
      </div>
      <div class="home__hospital-line">
        <el-icon :size="14"><Location /></el-icon>
        <span>{{ hospital.address }}</span>
      </div>
      <div class="home__hospital-line">
        <el-icon :size="14"><Clock /></el-icon>
        <span>门诊时间：{{ hospital.open_hours }}</span>
      </div>
    </div>

    <!-- 快捷入口宫格 -->
    <div class="card home__quick">
      <div
        v-for="entry in quickEntries"
        :key="entry.name"
        class="home__quick-item"
        @click="goEntry(entry)"
      >
        <div class="home__quick-icon">
          <el-icon :size="22"><component :is="entry.icon" /></el-icon>
        </div>
        <span class="home__quick-label">{{ entry.label }}</span>
      </div>
    </div>

    <!-- 科室导航 -->
    <SectionTitle title="科室导航" moreText="查看全部" moreTo="departments" />
    <div class="home__dept-grid">
      <DepartmentCard
        v-for="dept in departments"
        :key="dept.id"
        :department="dept"
        compact
      />
    </div>

    <!-- 推荐医生 -->
    <SectionTitle title="推荐医生" moreText="更多医生" moreTo="doctors" />
    <div class="home__doctors">
      <DoctorCard v-for="doc in doctors" :key="doc.id" :doctor="doc" />
    </div>

    <!-- 底部提示 -->
    <div class="home__tip">
      <p>本页面数据来源于医院信息系统</p>
      <p>如有疑问请致电咨询 · 感谢您的信任</p>
    </div>
  </div>
</template>

<style scoped>
.home__hospital {
  margin-top: 12px;
  background: linear-gradient(135deg, var(--color-primary), #66b1ff);
  color: #fff;
  border: none;
}

.home__hospital-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.home__hospital-name {
  font-size: 20px;
  font-weight: 700;
}

.home__hospital-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
  opacity: 0.95;
}

.home__quick {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 14px 6px;
}

.home__quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  cursor: pointer;
}

.home__quick-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.home__quick-label {
  font-size: 12px;
  color: var(--text-regular);
}

.home__dept-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.home__doctors {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.home__tip {
  margin: 24px 0 8px;
  text-align: center;
  font-size: 11px;
  color: var(--text-placeholder);
  line-height: 1.8;
}
</style>
