// 地址数据接口定义
export interface Province {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  provinceId: string;
}

export interface District {
  id: string;
  name: string;
  cityId: string;
}

// 导入PCAA数据
import { PCAA_DATA, type PcaaData } from './pcaaData';

// 地址数据处理类
class AddressDataProcessor {
  private pcaaData: PcaaData;

  constructor() {
    this.pcaaData = PCAA_DATA;
  }

  /**
   * 获取所有省份
   */
  getProvinces(): Province[] {
    const countryData = this.pcaaData['86'];
    if (!countryData) return [];

    return Object.entries(countryData).map(([id, name]) => ({
      id,
      name
    }));
  }

  /**
   * 根据省份ID获取城市列表
   */
  getCitiesByProvinceId(provinceId: string): City[] {
    const provinceData = this.pcaaData[provinceId];
    if (!provinceData) return [];

    return Object.entries(provinceData).map(([id, name]) => ({
      id,
      name,
      provinceId
    }));
  }

  /**
   * 根据省份名称获取城市列表
   */
  getCitiesByProvinceName(provinceName: string): City[] {
    // 先找到省份ID
    const countryData = this.pcaaData['86'];
    if (!countryData) return [];

    const provinceId = Object.entries(countryData).find(([_, name]) => name === provinceName)?.[0];
    if (!provinceId) return [];

    return this.getCitiesByProvinceId(provinceId);
  }

  /**
   * 根据城市ID获取区县列表
   */
  getDistrictsByCityId(cityId: string): District[] {
    const cityData = this.pcaaData[cityId];
    if (!cityData) return [];

    return Object.entries(cityData).map(([id, name]) => ({
      id,
      name,
      cityId
    }));
  }

  /**
   * 根据城市名称和省份名称获取区县列表
   */
  getDistrictsByCityName(cityName: string, provinceName: string): District[] {
    // 先获取省份下的所有城市
    const cities = this.getCitiesByProvinceName(provinceName);
    
    // 找到匹配的城市
    const city = cities.find(c => c.name === cityName);
    if (!city) return [];

    return this.getDistrictsByCityId(city.id);
  }

  /**
   * 根据省份名称获取省份信息
   */
  getProvinceByName(provinceName: string): Province | null {
    const provinces = this.getProvinces();
    return provinces.find(p => p.name === provinceName) || null;
  }

  /**
   * 根据城市名称和省份名称获取城市信息
   */
  getCityByName(cityName: string, provinceName: string): City | null {
    const cities = this.getCitiesByProvinceName(provinceName);
    return cities.find(c => c.name === cityName) || null;
  }

  /**
   * 根据区县名称、城市名称和省份名称获取区县信息
   */
  getDistrictByName(districtName: string, cityName: string, provinceName: string): District | null {
    const districts = this.getDistrictsByCityName(cityName, provinceName);
    return districts.find(d => d.name === districtName) || null;
  }

  /**
   * 验证地址是否有效
   */
  validateAddress(provinceName: string, cityName: string, districtName: string): boolean {
    const province = this.getProvinceByName(provinceName);
    if (!province) return false;

    const city = this.getCityByName(cityName, provinceName);
    if (!city) return false;

    const district = this.getDistrictByName(districtName, cityName, provinceName);
    return !!district;
  }

  /**
   * 获取完整的地址路径
   */
  getAddressPath(provinceName: string, cityName?: string, districtName?: string): string {
    let path = provinceName;
    
    if (cityName) {
      path += ` > ${cityName}`;
    }
    
    if (districtName) {
      path += ` > ${districtName}`;
    }
    
    return path;
  }
}

// 创建全局实例
const addressProcessor = new AddressDataProcessor();

// 导出便捷方法
export const getProvinces = (): Province[] => {
  return addressProcessor.getProvinces();
};

export const getCitiesByProvinceName = (provinceName: string): City[] => {
  return addressProcessor.getCitiesByProvinceName(provinceName);
};

export const getDistrictsByCityName = (cityName: string, provinceName: string): District[] => {
  return addressProcessor.getDistrictsByCityName(cityName, provinceName);
};

export const validateAddress = (provinceName: string, cityName: string, districtName: string): boolean => {
  return addressProcessor.validateAddress(provinceName, cityName, districtName);
};

export const getAddressPath = (provinceName: string, cityName?: string, districtName?: string): string => {
  return addressProcessor.getAddressPath(provinceName, cityName, districtName);
};

// 导出处理器实例（用于高级用法）
export { addressProcessor };

export default addressProcessor; 