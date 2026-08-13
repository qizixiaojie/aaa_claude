<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { listAdminAppointments, updateAppointmentStatus } from '../../api/admin'

/**
 * 预约管理：全量预约列表，支持按状态/日期/关键字筛选，可直接改状态
 */
const list = ref([])
const loading = ref(false)
const filters = reactive({ status: '', date: '', keyword: '' })

const STATUS_OPTIONS = ['待支付', '已支付', '待就诊', '已完成', '已取消']

// 状态 → tag 类型（与患者端 StatusTag 保持一致）
const STATUS_TYPE = {
  待支付: 'warning',
  已支付: 'success',
  待就诊: 'primary',
  已完成: 'info',
  已取消: 'danger',
}

async function fetchList() {
  loading.value = true
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.date) params.date = filters.date
    if (filters.keyword) params.keyword = filters.keyword
    list.value = (await listAdminAppointments(params)) || []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

// 修改状态
async function handleStatusChange(row, status) {
  try {
    await updateAppointmentStatus(row.id, status)
    ElMessage.success(`已更新为「${status}」`)
    fetchList()
  } catch {
    /* 拦截器已提示 */
  }
}

function resetFilters() {
  filters.status = ''
  filters.date = ''
  filters.keyword = ''
  fetchList()
}

onMounted(fetchList)
</script>

<template>
  <div class="admin-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 140px">
        <el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" />
      </el-select>
      <el-date-picker
        v-model="filters.date"
        type="date"
        placeholder="就诊日期"
        value-format="YYYY-MM-DD"
        style="width: 160px"
      />
      <el-input
        v-model="filters.keyword"
        placeholder="患者 / 订单号 / 手机号"
        clearable
        style="width: 220px"
        @keyup.enter="fetchList"
        @clear="fetchList"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="fetchList">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
      <div class="toolbar__right">
        <el-button @click="fetchList"><el-icon><Refresh /></el-icon>刷新</el-button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="card-panel">
      <el-table v-loading="loading" :data="list" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="patientName" label="就诊人" min-width="90" />
        <el-table-column prop="userName" label="账号用户" min-width="90" />
        <el-table-column prop="userPhone" label="手机号" min-width="120" />
        <el-table-column prop="doctorName" label="医生" min-width="90" />
        <el-table-column prop="departmentName" label="科室" min-width="90" />
        <el-table-column label="就诊时间" min-width="130">
          <template #default="{ row }">{{ row.appointDate }} {{ row.period }}</template>
        </el-table-column>
        <el-table-column prop="queueNo" label="排队号" width="80" align="center" />
        <el-table-column label="挂号费" width="90" align="center">
          <template #default="{ row }">￥{{ Number(row.fee).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-select
              :model-value="row.status"
              size="small"
              style="width: 100px"
              @change="(v) => handleStatusChange(row, v)"
            >
              <el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s">
                <el-tag :type="STATUS_TYPE[s]" size="small" effect="light">{{ s }}</el-tag>
              </el-option>
            </el-select>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无预约数据" />
        </template>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar__right {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.card-panel {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}
</style>
