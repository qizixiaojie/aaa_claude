<script setup>
import { ref, watch } from 'vue'
import { CreditCard } from '@element-plus/icons-vue'

/**
 * 支付确认弹窗（挂号支付 / 预约列表补支付共用）
 * props.pay(method) 返回 Promise，成功时 emit('success', result)
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '支付确认' },
  orderNo: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  pay: { type: Function, required: true },
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(props.modelValue)
watch(
  () => props.modelValue,
  (v) => {
    visible.value = v
    if (v) payMethod.value = '微信支付'
  }
)

const payMethods = ['微信支付', '支付宝', '医保支付']
const payMethod = ref('微信支付')
const paying = ref(false)

async function confirmPay() {
  paying.value = true
  try {
    const result = await props.pay(payMethod.value)
    visible.value = false
    emit('update:modelValue', false)
    emit('success', result)
  } catch {
    // 失败提示由 request 拦截器统一处理，弹窗保持打开可重试
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="86%"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="pay-panel">
      <!-- 订单号与金额 -->
      <div class="pay-panel__order">订单号：{{ orderNo }}</div>
      <div class="pay-panel__amount">
        <span class="pay-panel__currency">¥</span>
        <span class="pay-panel__num">{{ amount.toFixed(2) }}</span>
      </div>

      <!-- 支付方式单选 -->
      <el-radio-group v-model="payMethod" class="pay-panel__methods">
        <el-radio
          v-for="m in payMethods"
          :key="m"
          :value="m"
          class="pay-panel__method"
        >{{ m }}</el-radio>
      </el-radio-group>

      <!-- 确认支付 -->
      <el-button
        type="primary"
        class="pay-panel__submit"
        :loading="paying"
        @click="confirmPay"
      >
        <el-icon v-if="!paying"><CreditCard /></el-icon>
        确认支付
      </el-button>
    </div>
  </el-dialog>
</template>

<style scoped>
.pay-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 8px 0 4px;
}

.pay-panel__order {
  font-size: 13px;
  color: var(--text-secondary);
}

.pay-panel__amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: #303133;
}

.pay-panel__currency {
  font-size: 16px;
}

.pay-panel__num {
  font-size: 34px;
  font-weight: 700;
}

.pay-panel__methods {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.pay-panel__method {
  width: 100%;
  margin-right: 0;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-sizing: border-box;
}

.pay-panel__method.is-checked {
  border-color: var(--color-primary);
}

.pay-panel__submit {
  width: 100%;
  height: 44px;
  font-size: 15px;
}
</style>
