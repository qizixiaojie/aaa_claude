import request from './request'

/**
 * 处方相关接口
 */

// 我的处方列表
export function listPrescriptions() {
  return request.get('/prescriptions')
}

// 处方详情（含处方明细 items）
export function getPrescription(id) {
  return request.get(`/prescriptions/${id}`)
}

// 模拟取药
export function pickupPrescription(id) {
  return request.post(`/prescriptions/${id}/pickup`)
}
