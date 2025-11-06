// 高德地图相关工具函数

export interface Location {
  lng: number
  lat: number
  address?: string
  name?: string
}

export interface MapConfig {
  center: Location
  zoom: number
  mapStyle?: string
}

// 复旦大学默认坐标
export const FUDAN_CENTER: Location = {
  lng: 121.5033,
  lat: 31.2993,
  address: '上海市杨浦区邯郸路220号',
  name: '复旦大学'
}

// 默认地图配置
export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: FUDAN_CENTER,
  zoom: 16,
  mapStyle: 'normal'
}

// 复旦大学校园边界（大致范围）
export const FUDAN_BOUNDS = {
  northeast: { lng: 121.5150, lat: 31.3050 },
  southwest: { lng: 121.4950, lat: 31.2930 }
}

// 常用地点
export const COMMON_LOCATIONS = {
  // 宿舍区
  dormitories: [
    { name: '本部1号楼', lng: 121.5020, lat: 31.2980, address: '本部1号楼' },
    { name: '本部2号楼', lng: 121.5025, lat: 31.2985, address: '本部2号楼' },
    { name: '本部3号楼', lng: 121.5030, lat: 31.2990, address: '本部3号楼' },
    { name: '本部4号楼', lng: 121.5035, lat: 31.2995, address: '本部4号楼' },
    { name: '本部5号楼', lng: 121.5040, lat: 31.3000, address: '本部5号楼' },
    { name: '枫林1号楼', lng: 121.4380, lat: 31.1780, address: '枫林1号楼' },
    { name: '枫林2号楼', lng: 121.4385, lat: 31.1785, address: '枫林2号楼' },
    { name: '张江1号楼', lng: 121.6050, lat: 31.2050, address: '张江1号楼' },
    { name: '张江2号楼', lng: 121.6055, lat: 31.2055, address: '张江2号楼' }
  ],
  
  // 食堂
  canteens: [
    { name: '本部食堂', lng: 121.5015, lat: 31.2975, address: '本部食堂' },
    { name: '旦苑餐厅', lng: 121.5045, lat: 31.3005, address: '旦苑餐厅' },
    { name: '枫林食堂', lng: 121.4375, lat: 31.1775, address: '枫林食堂' },
    { name: '张江食堂', lng: 121.6045, lat: 31.2045, address: '张江食堂' }
  ],
  
  // 校门
  gates: [
    { name: '南门', lng: 121.5033, lat: 31.2960, address: '复旦大学南门' },
    { name: '北门', lng: 121.5033, lat: 31.3020, address: '复旦大学北门' },
    { name: '东门', lng: 121.5080, lat: 31.2993, address: '复旦大学东门' },
    { name: '西门', lng: 121.4986, lat: 31.2993, address: '复旦大学西门' }
  ]
}

// 计算两点之间的距离（米）
export const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371000 // 地球半径（米）
  const lat1Rad = (point1.lat * Math.PI) / 180
  const lat2Rad = (point2.lat * Math.PI) / 180
  const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180
  const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

// 格式化距离显示
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  } else {
    return `${(distance / 1000).toFixed(1)}km`
  }
}

// 检查坐标是否在复旦校园内
export const isWithinFudanCampus = (location: Location): boolean => {
  return (
    location.lng >= FUDAN_BOUNDS.southwest.lng &&
    location.lng <= FUDAN_BOUNDS.northeast.lng &&
    location.lat >= FUDAN_BOUNDS.southwest.lat &&
    location.lat <= FUDAN_BOUNDS.northeast.lat
  )
}

// 获取当前位置
export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lng: position.coords.longitude,
          lat: position.coords.latitude
        })
      },
      (error) => {
        reject(new Error(`获取位置失败: ${error.message}`))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

// 地址解析（需要高德地图API）
export const geocodeAddress = async (address: string): Promise<Location> => {
  const apiKey = import.meta.env.VITE_AMAP_API_KEY
  
  if (!apiKey) {
    throw new Error('高德地图API密钥未配置')
  }

  try {
    const response = await fetch(
      `https://restapi.amap.com/v3/geocode/geo?key=${apiKey}&address=${encodeURIComponent(address)}&city=上海`
    )
    
    const data = await response.json()
    
    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      const [lng, lat] = data.geocodes[0].location.split(',').map(Number)
      return {
        lng,
        lat,
        address: data.geocodes[0].formatted_address,
        name: address
      }
    } else {
      throw new Error('地址解析失败')
    }
  } catch (error) {
    throw new Error(`地址解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 逆地址解析（坐标转地址）
export const reverseGeocode = async (location: Location): Promise<string> => {
  const apiKey = import.meta.env.VITE_AMAP_API_KEY
  
  if (!apiKey) {
    throw new Error('高德地图API密钥未配置')
  }

  try {
    const response = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?key=${apiKey}&location=${location.lng},${location.lat}&radius=100&extensions=base`
    )
    
    const data = await response.json()
    
    if (data.status === '1' && data.regeocode) {
      return data.regeocode.formatted_address
    } else {
      throw new Error('逆地址解析失败')
    }
  } catch (error) {
    throw new Error(`逆地址解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 搜索附近的地点
export const searchNearbyPlaces = async (
  location: Location,
  keyword: string,
  radius: number = 1000
): Promise<Location[]> => {
  const apiKey = import.meta.env.VITE_AMAP_API_KEY
  
  if (!apiKey) {
    throw new Error('高德地图API密钥未配置')
  }

  try {
    const response = await fetch(
      `https://restapi.amap.com/v3/place/around?key=${apiKey}&location=${location.lng},${location.lat}&keywords=${encodeURIComponent(keyword)}&radius=${radius}&offset=20&page=1&extensions=base`
    )
    
    const data = await response.json()
    
    if (data.status === '1' && data.pois) {
      return data.pois.map((poi: any) => {
        const [lng, lat] = poi.location.split(',').map(Number)
        return {
          lng,
          lat,
          address: poi.address,
          name: poi.name
        }
      })
    } else {
      return []
    }
  } catch (error) {
    console.error('搜索附近地点失败:', error)
    return []
  }
}

// 路径规划
export const planRoute = async (
  origin: Location,
  destination: Location,
  strategy: number = 0 // 0: 速度优先, 1: 费用优先, 2: 距离优先, 3: 不走高速
): Promise<any> => {
  const apiKey = import.meta.env.VITE_AMAP_API_KEY
  
  if (!apiKey) {
    throw new Error('高德地图API密钥未配置')
  }

  try {
    const response = await fetch(
      `https://restapi.amap.com/v3/direction/walking?key=${apiKey}&origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}&output=json`
    )
    
    const data = await response.json()
    
    if (data.status === '1' && data.route) {
      return data.route
    } else {
      throw new Error('路径规划失败')
    }
  } catch (error) {
    throw new Error(`路径规划失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 地图样式配置
export const MAP_STYLES = {
  normal: 'normal',
  satellite: 'satellite',
  dark: 'dark',
  light: 'light',
  fresh: 'fresh',
  grey: 'grey',
  graffiti: 'graffiti',
  macaron: 'macaron',
  blue: 'blue',
  darkblue: 'darkblue',
  wine: 'wine'
}

// 地图图标配置
export const MAP_ICONS = {
  pickup: '/icons/pickup-marker.png',
  delivery: '/icons/delivery-marker.png',
  user: '/icons/user-marker.png',
  dormitory: '/icons/dormitory-marker.png',
  canteen: '/icons/canteen-marker.png',
  gate: '/icons/gate-marker.png'
}