import rawData from 'china-area-data';

export interface RegionOption {
  value: string;
  label: string;
  children?: RegionOption[];
}

const data = rawData as Record<string, Record<string, string>>;

function buildRegionOptions(): RegionOption[] {
  const provinces = data['86'];
  if (!provinces) return [];

  return Object.entries(provinces).map(([provinceCode, provinceName]) => {
    const cities = data[provinceCode];
    if (!cities || Object.keys(cities).length === 0) {
      return { value: provinceName, label: provinceName };
    }

    const cityOptions = Object.entries(cities).map(([cityCode, cityName]) => {
      const districts = data[cityCode];
      if (!districts || Object.keys(districts).length === 0) {
        return { value: cityName, label: cityName };
      }

      return {
        value: cityName,
        label: cityName,
        children: Object.entries(districts).map(([, districtName]) => ({
          value: districtName,
          label: districtName,
        })),
      };
    });

    return {
      value: provinceName,
      label: provinceName,
      children: cityOptions,
    };
  });
}

/** 省市区三级级联选项（值使用区域名称，便于直接回显与存储） */
export const regionOptions = buildRegionOptions();

/** 将级联选择值拼接为区域路径字符串 */
export function joinRegion(values?: string[] | null): string {
  if (!values || values.length === 0) return '';
  return values.join(' / ');
}

/** 从区域路径字符串还原为级联选择值（最佳匹配） */
export function splitRegion(region?: string | null): string[] {
  if (!region) return [];
  return region.split(' / ').map(s => s.trim()).filter(Boolean);
}
