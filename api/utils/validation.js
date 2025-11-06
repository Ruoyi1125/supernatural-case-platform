// 复旦学号验证（8-10位数字）
export const validateStudentId = (studentId) => {
  const pattern = /^\d{8,10}$/;
  return pattern.test(studentId);
};

// 邮箱验证
export const validateEmail = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

// 手机号验证（中国大陆）
export const validatePhone = (phone) => {
  const pattern = /^1[3-9]\d{9}$/;
  return pattern.test(phone);
};

// 密码强度验证（至少6位，包含字母和数字）
export const validatePassword = (password) => {
  if (password.length < 6) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
};

// 宿舍区域验证
export const validateDormitoryArea = (area) => {
  const validAreas = ['东区', '南区', '北区', '本部'];
  return validAreas.includes(area);
};

// 订单状态验证
export const validateOrderStatus = (status) => {
  const validStatuses = ['pending', 'accepted', 'picking', 'delivering', 'completed', 'cancelled'];
  return validStatuses.includes(status);
};

// 平台类型验证
export const validatePlatform = (platform) => {
  const validPlatforms = ['meituan', 'eleme', 'other'];
  return validPlatforms.includes(platform);
};

// 消息类型验证
export const validateMessageType = (type) => {
  const validTypes = ['text', 'image', 'system'];
  return validTypes.includes(type);
};

// 评分验证
export const validateRating = (rating) => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

// 费用验证
export const validateFee = (fee) => {
  return typeof fee === 'number' && fee >= 0 && fee <= 1000;
};

// 坐标验证
export const validateCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' && 
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

// 通用验证错误类
export class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

// 验证中间件生成器
export const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // 检查必填字段
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // 如果字段不是必填且为空，跳过其他验证
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // 类型验证
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
        continue;
      }

      // 长度验证
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters long`);
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
      }

      // 自定义验证函数
      if (rules.validator && !rules.validator(value)) {
        errors.push(rules.message || `${field} is invalid`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};