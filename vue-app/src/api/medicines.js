import request from './request'

/**
 * 药品相关接口
 */

// 药品列表：params { keyword, category }
export function listMedicines(params) {
  return request.get('/medicines', { params })
}
