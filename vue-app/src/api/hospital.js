import request from './request'

/**
 * 医院简介相关接口
 */

// 医院简介（单条）
export function getHospitalProfile() {
  return request.get('/hospital/profile')
}
