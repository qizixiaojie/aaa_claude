import request from './request'

/**
 * 科室相关接口
 */

// 科室列表
export function listDepartments() {
  return request.get('/departments')
}

// 科室详情
export function getDepartment(id) {
  return request.get(`/departments/${id}`)
}
