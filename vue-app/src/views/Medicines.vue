<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import { listMedicines } from '../api/medicines'

/**
 * 药品库页：搜索 + 分类筛选（全部/西药/中成药/外用药）+ 药品列表
 */
const keyword = ref('')
const category = ref('全部')
const categories = ['全部', '西药', '中成药', '外用药']

const medicines = ref([])
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    medicines.value = (await listMedicines({
      keyword: keyword.value.trim() || undefined,
      category: category.value === '全部' ? undefined : category.value,
    })) || []
  } catch {
    medicines.value = []
  } finally {
    loading.value = false
  }
}

function onCategoryChange() {
  fetchList()
}

function resetSearch() {
  keyword.value = ''
  category.value = '全部'
  fetchList()
}

onMounted(fetchList)
</script>

<template>
  <div class="page medicines">
    <!-- 搜索框 -->
    <el-input
      v-model="keyword"
      class="medicines__search"
      placeholder="搜索药品名称 / 通用名"
      clearable
      :prefix-icon="Search"
      @keyup.enter="fetchList"
      @clear="fetchList"
    />

    <!-- 分类筛选 -->
    <el-radio-group v-model="category" class="medicines__cats" @change="onCategoryChange">
      <el-radio-button v-for="c in categories" :key="c" :value="c">{{ c }}</el-radio-button>
    </el-radio-group>

    <!-- 药品列表 -->
    <div v-loading="loading" class="medicines__list">
      <div v-for="m in medicines" :key="m.id" class="card medicines__item">
        <div class="medicines__main">
          <div class="medicines__name">
            {{ m.name }}
            <el-tag size="small" type="primary" effect="plain">{{ m.category }}</el-tag>
          </div>
          <div class="medicines__spec">规格：{{ m.specification || '—' }}</div>
          <div class="medicines__factory ellipsis">厂家：{{ m.manufacturer || '—' }}</div>
        </div>
        <div class="medicines__price">
          <span class="text-price">￥{{ Number(m.price).toFixed(2) }}</span>
          <span class="medicines__unit">/{{ m.unit }}</span>
        </div>
      </div>

      <EmptyState
        v-if="!loading && medicines.length === 0"
        description="没有找到相关药品"
        button-text="清空筛选"
        @action="resetSearch"
      />
    </div>
  </div>
</template>

<style scoped>
.medicines__search {
  margin-top: 12px;
}

.medicines__cats {
  display: flex;
  width: 100%;
  margin: 12px 0;
}

.medicines__cats :deep(.el-radio-button) {
  flex: 1;
}

.medicines__cats :deep(.el-radio-button__inner) {
  width: 100%;
}

.medicines__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 200px;
}

.medicines__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
}

.medicines__main {
  flex: 1;
  min-width: 0;
}

.medicines__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
}

.medicines__spec,
.medicines__factory {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.medicines__price {
  flex-shrink: 0;
  text-align: right;
}

.medicines__price .text-price {
  font-size: 17px;
}

.medicines__unit {
  font-size: 11px;
  color: var(--text-secondary);
}
</style>
