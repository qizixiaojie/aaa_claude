import request from './request'

/**
 * 医生相关接口
 */

// 医生列表：params { keyword, departmentId, limit }
export function listDoctors(params) {
  return request.get('/doctors', { params })
}

// 医生详情（后端返回 { doctor },解包为医生对象本身）
export function getDoctor(id) {
  return request.get(`/doctors/${id}`).then((d) => d.doctor)
}

// 医生排班（未来 7 天）
export function getSchedules(doctorId) {
  return request.get(`/doctors/${doctorId}/schedules`)
}
