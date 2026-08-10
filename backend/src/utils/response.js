// 统一响应格式：成功 { code:0, message:'ok', data }；失败 { code:1, message }

function ok(res, data) {
  return res.json({ code: 0, message: 'ok', data });
}

function fail(res, message, httpCode = 400) {
  return res.status(httpCode).json({ code: 1, message });
}

module.exports = { ok, fail };
