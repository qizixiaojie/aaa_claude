<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { listAdminPrescriptions } from '../../api/admin'

/**
 * 处方管理：全量处方查询
 */
const list = ref([])
const loading = ref(false)
const filters = reactive({ keyword: '', status: '' })

const STATUS_OPTIONS = ['待取药', '已取药']

async function fetchList() {
  loading.value = true
  try {
    const params = {}
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.status) params.status = filters.status
    list.value = (await listAdminPrescriptions(params)) || []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)
</script>

<template>
  <div class="admin-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input
        v-model="filters.keyword"
        placeholder="处方号 / 患者 / 账号用户"
        clearable
        style="width: 240px"
        @keyup.enter="fetchList"
        @clear="fetchList"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 140px">
        <el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" />
      </el-select>
      <el-button type="primary" @click="fetchList">查询</el-button>
      <div class="toolbar__right">
        <el-button @click="fetchList"><el-icon><Refresh /></el-icon>刷新</el-button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="card-panel">
      <el-table v-loading="loading" :data="list" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="prescNo" label="处方号" min-width="170" />
        <el-table-column prop="patientName" label="就诊人" min-width="90" />
        <el-table-column prop="userName" label="账号用户" min-width="90" />
        <el-table-column prop="doctorName" label="开方医生" min-width="90" />
        <el-table-column label="金额" width="100" align="center">
          <template #default="{ row }">
            <span class="text-price">￥{{ Number(row.totalAmount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '已取药' ? 'success' : 'primary'" size="small" effect="light">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="开方时间" min-width="160" />
        <template #empty>
          <el-empty description="暂无处方数据" />
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
