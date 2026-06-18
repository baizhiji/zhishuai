// 敏感数据脱敏工具

// 手机号脱敏: 13812345678 → 138****5678
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

// 身份证号脱敏: 110101199001011234 → 110101****1234
export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 10) return idCard;
  return idCard.slice(0, 6) + '********' + idCard.slice(-4);
}

// 邮箱脱敏: example@domain.com → e****e@domain.com
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return local[0] + '***@' + domain;
  return local[0] + '****' + local[local.length - 1] + '@' + domain;
}

// 姓名脱敏: 张三 → 张*, 李四五 → 李**
export function maskName(name: string): string {
  if (!name) return name;
  if (name.length === 1) return name;
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 1);
}

// 银行卡号脱敏: 6222001234567890 → 6222****7890
export function maskBankCard(cardNo: string): string {
  if (!cardNo || cardNo.length < 8) return cardNo;
  return cardNo.slice(0, 4) + '****' + cardNo.slice(-4);
}

// 地址脱敏: 北京市朝阳区xxx → 北京市朝阳区***
export function maskAddress(address: string): string {
  if (!address || address.length <= 6) return address;
  return address.slice(0, 6) + '***';
}

// 通用脱敏: 保留前n后m位
export function maskGeneric(value: string, prefixKeep = 2, suffixKeep = 2): string {
  if (!value) return value;
  if (value.length <= prefixKeep + suffixKeep) return value;
  const prefix = value.slice(0, prefixKeep);
  const suffix = value.slice(-suffixKeep);
  const masked = '*'.repeat(value.length - prefixKeep - suffixKeep);
  return prefix + masked + suffix;
}

// API响应脱敏中间件 - 对特定字段自动脱敏
export function maskResponseFields(fields: Record<string, 'phone' | 'idCard' | 'email' | 'name' | 'bankCard' | 'address'>) {
  return (req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      if (data && typeof data === 'object') {
        data = applyMaskToObj(data, fields);
      }
      return originalJson(data);
    };
    next();
  };
}

function applyMaskToObj(obj: any, fields: Record<string, string>): any {
  if (Array.isArray(obj)) {
    return obj.map(item => applyMaskToObj(item, fields));
  }

  if (obj && typeof obj === 'object') {
    const result = { ...obj };
    for (const [field, type] of Object.entries(fields)) {
      if (result[field] && typeof result[field] === 'string') {
        switch (type) {
          case 'phone': result[field] = maskPhone(result[field]); break;
          case 'idCard': result[field] = maskIdCard(result[field]); break;
          case 'email': result[field] = maskEmail(result[field]); break;
          case 'name': result[field] = maskName(result[field]); break;
          case 'bankCard': result[field] = maskBankCard(result[field]); break;
          case 'address': result[field] = maskAddress(result[field]); break;
        }
      }
    }
    return result;
  }

  return obj;
}
