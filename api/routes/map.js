import express from 'express';
import axios from 'axios';
import { validateCoordinates } from '../utils/validation.js';

const router = express.Router();

const AMAP_API_KEY = process.env.AMAP_API_KEY;
const AMAP_BASE_URL = 'https://restapi.amap.com/v3';

// 检查高德地图 API Key
if (!AMAP_API_KEY) {
  console.warn('Warning: AMAP_API_KEY not configured. Map services will not work.');
}

// 地理编码 - 地址转坐标
router.get('/geocode', async (req, res) => {
  try {
    const { address, city = '上海市' } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!AMAP_API_KEY) {
      return res.status(503).json({ error: 'Map service not configured' });
    }

    const response = await axios.get(`${AMAP_BASE_URL}/geocode/geo`, {
      params: {
        key: AMAP_API_KEY,
        address,
        city
      }
    });

    if (response.data.status !== '1') {
      return res.status(400).json({ 
        error: 'Geocoding failed',
        message: response.data.info 
      });
    }

    const geocodes = response.data.geocodes;
    if (!geocodes || geocodes.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const result = geocodes[0];
    const [lng, lat] = result.location.split(',').map(Number);

    res.json({
      address: result.formatted_address,
      coordinates: { lng, lat },
      level: result.level,
      province: result.province,
      city: result.city,
      district: result.district
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

// 逆地理编码 - 坐标转地址
router.get('/regeocode', async (req, res) => {
  try {
    const { lng, lat } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const coordinates = { lng: parseFloat(lng), lat: parseFloat(lat) };
    if (!validateCoordinates(coordinates)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    if (!AMAP_API_KEY) {
      return res.status(503).json({ error: 'Map service not configured' });
    }

    const response = await axios.get(`${AMAP_BASE_URL}/geocode/regeo`, {
      params: {
        key: AMAP_API_KEY,
        location: `${lng},${lat}`,
        extensions: 'all'
      }
    });

    if (response.data.status !== '1') {
      return res.status(400).json({ 
        error: 'Reverse geocoding failed',
        message: response.data.info 
      });
    }

    const regeocode = response.data.regeocode;
    const addressComponent = regeocode.addressComponent;

    res.json({
      formatted_address: regeocode.formatted_address,
      coordinates: coordinates,
      province: addressComponent.province,
      city: addressComponent.city,
      district: addressComponent.district,
      township: addressComponent.township,
      neighborhood: addressComponent.neighborhood?.name,
      building: addressComponent.building?.name,
      pois: regeocode.pois?.slice(0, 5).map(poi => ({
        name: poi.name,
        type: poi.type,
        distance: poi.distance,
        address: poi.address
      }))
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: 'Failed to reverse geocode coordinates' });
  }
});

// 路径规划
router.get('/route', async (req, res) => {
  try {
    const { 
      origin_lng, 
      origin_lat, 
      dest_lng, 
      dest_lat, 
      strategy = 0 // 0: 速度优先, 1: 费用优先, 2: 距离优先
    } = req.query;

    if (!origin_lng || !origin_lat || !dest_lng || !dest_lat) {
      return res.status(400).json({ 
        error: 'Origin and destination coordinates are required' 
      });
    }

    const origin = { lng: parseFloat(origin_lng), lat: parseFloat(origin_lat) };
    const dest = { lng: parseFloat(dest_lng), lat: parseFloat(dest_lat) };

    if (!validateCoordinates(origin) || !validateCoordinates(dest)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    if (!AMAP_API_KEY) {
      return res.status(503).json({ error: 'Map service not configured' });
    }

    const response = await axios.get(`${AMAP_BASE_URL}/direction/walking`, {
      params: {
        key: AMAP_API_KEY,
        origin: `${origin_lng},${origin_lat}`,
        destination: `${dest_lng},${dest_lat}`,
        extensions: 'all'
      }
    });

    if (response.data.status !== '1') {
      return res.status(400).json({ 
        error: 'Route planning failed',
        message: response.data.info 
      });
    }

    const route = response.data.route;
    if (!route.paths || route.paths.length === 0) {
      return res.status(404).json({ error: 'No route found' });
    }

    const path = route.paths[0];
    
    res.json({
      distance: parseInt(path.distance), // 距离（米）
      duration: parseInt(path.duration), // 时间（秒）
      origin: origin,
      destination: dest,
      steps: path.steps.map(step => ({
        instruction: step.instruction,
        distance: parseInt(step.distance),
        duration: parseInt(step.duration),
        polyline: step.polyline
      }))
    });
  } catch (error) {
    console.error('Route planning error:', error);
    res.status(500).json({ error: 'Failed to plan route' });
  }
});

// POI 搜索
router.get('/search', async (req, res) => {
  try {
    const { 
      keywords, 
      city = '上海市',
      types,
      lng,
      lat,
      radius = 3000,
      page = 1,
      size = 20
    } = req.query;

    if (!keywords) {
      return res.status(400).json({ error: 'Keywords are required' });
    }

    if (!AMAP_API_KEY) {
      return res.status(503).json({ error: 'Map service not configured' });
    }

    const params = {
      key: AMAP_API_KEY,
      keywords,
      city,
      page: Math.max(1, parseInt(page)),
      offset: Math.min(25, Math.max(1, parseInt(size))),
      extensions: 'all'
    };

    // 如果提供了坐标，进行周边搜索
    if (lng && lat) {
      const coordinates = { lng: parseFloat(lng), lat: parseFloat(lat) };
      if (validateCoordinates(coordinates)) {
        params.location = `${lng},${lat}`;
        params.radius = Math.min(50000, Math.max(100, parseInt(radius)));
        params.sortrule = 'distance'; // 按距离排序
      }
    }

    // 如果指定了类型
    if (types) {
      params.types = types;
    }

    const response = await axios.get(`${AMAP_BASE_URL}/place/text`, {
      params
    });

    if (response.data.status !== '1') {
      return res.status(400).json({ 
        error: 'POI search failed',
        message: response.data.info 
      });
    }

    const pois = response.data.pois || [];
    
    res.json({
      total: parseInt(response.data.count) || 0,
      page: parseInt(page),
      size: pois.length,
      pois: pois.map(poi => {
        const [lng, lat] = poi.location.split(',').map(Number);
        return {
          id: poi.id,
          name: poi.name,
          type: poi.type,
          address: poi.address,
          coordinates: { lng, lat },
          distance: poi.distance ? parseInt(poi.distance) : null,
          tel: poi.tel,
          business_area: poi.business_area
        };
      })
    });
  } catch (error) {
    console.error('POI search error:', error);
    res.status(500).json({ error: 'Failed to search POI' });
  }
});

// 获取复旦大学校园地标
router.get('/campus/landmarks', async (req, res) => {
  try {
    // 复旦大学主要地标坐标
    const landmarks = [
      {
        name: '复旦大学邯郸校区',
        type: 'campus',
        coordinates: { lng: 121.5033, lat: 31.2989 },
        address: '上海市杨浦区邯郸路220号'
      },
      {
        name: '复旦大学枫林校区',
        type: 'campus',
        coordinates: { lng: 121.4356, lat: 31.1801 },
        address: '上海市徐汇区东安路131号'
      },
      {
        name: '复旦大学张江校区',
        type: 'campus',
        coordinates: { lng: 121.6024, lat: 31.2066 },
        address: '上海市浦东新区张衡路825号'
      },
      {
        name: '复旦大学江湾校区',
        type: 'campus',
        coordinates: { lng: 121.5089, lat: 31.3394 },
        address: '上海市杨浦区淞沪路2005号'
      },
      // 邯郸校区主要建筑
      {
        name: '光华楼',
        type: 'building',
        coordinates: { lng: 121.5025, lat: 31.2985 },
        address: '复旦大学邯郸校区'
      },
      {
        name: '第一教学楼',
        type: 'building',
        coordinates: { lng: 121.5030, lat: 31.2995 },
        address: '复旦大学邯郸校区'
      },
      {
        name: '复旦大学图书馆',
        type: 'library',
        coordinates: { lng: 121.5040, lat: 31.2990 },
        address: '复旦大学邯郸校区'
      },
      // 宿舍区域
      {
        name: '本部宿舍区',
        type: 'dormitory',
        coordinates: { lng: 121.5020, lat: 31.3000 },
        address: '复旦大学邯郸校区'
      },
      {
        name: '北区宿舍',
        type: 'dormitory',
        coordinates: { lng: 121.5010, lat: 31.3010 },
        address: '复旦大学邯郸校区'
      },
      {
        name: '南区宿舍',
        type: 'dormitory',
        coordinates: { lng: 121.5035, lat: 31.2975 },
        address: '复旦大学邯郸校区'
      }
    ];

    res.json({ landmarks });
  } catch (error) {
    console.error('Get campus landmarks error:', error);
    res.status(500).json({ error: 'Failed to get campus landmarks' });
  }
});

// 计算两点间距离
router.get('/distance', async (req, res) => {
  try {
    const { 
      origin_lng, 
      origin_lat, 
      dest_lng, 
      dest_lat 
    } = req.query;

    if (!origin_lng || !origin_lat || !dest_lng || !dest_lat) {
      return res.status(400).json({ 
        error: 'Origin and destination coordinates are required' 
      });
    }

    const origin = { lng: parseFloat(origin_lng), lat: parseFloat(origin_lat) };
    const dest = { lng: parseFloat(dest_lng), lat: parseFloat(dest_lat) };

    if (!validateCoordinates(origin) || !validateCoordinates(dest)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // 使用 Haversine 公式计算直线距离
    const R = 6371000; // 地球半径（米）
    const lat1Rad = origin.lat * Math.PI / 180;
    const lat2Rad = dest.lat * Math.PI / 180;
    const deltaLatRad = (dest.lat - origin.lat) * Math.PI / 180;
    const deltaLngRad = (dest.lng - origin.lng) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDistance = R * c;

    // 如果配置了高德地图 API，获取实际路径距离
    let routeDistance = null;
    let routeDuration = null;

    if (AMAP_API_KEY) {
      try {
        const response = await axios.get(`${AMAP_BASE_URL}/direction/walking`, {
          params: {
            key: AMAP_API_KEY,
            origin: `${origin_lng},${origin_lat}`,
            destination: `${dest_lng},${dest_lat}`
          }
        });

        if (response.data.status === '1' && response.data.route.paths.length > 0) {
          const path = response.data.route.paths[0];
          routeDistance = parseInt(path.distance);
          routeDuration = parseInt(path.duration);
        }
      } catch (apiError) {
        console.error('Route API error:', apiError);
        // 继续返回直线距离
      }
    }

    res.json({
      origin,
      destination: dest,
      straight_distance: Math.round(straightDistance),
      route_distance: routeDistance,
      route_duration: routeDuration,
      estimated_walking_time: Math.round(straightDistance / 1.4) // 假设步行速度 1.4 m/s
    });
  } catch (error) {
    console.error('Calculate distance error:', error);
    res.status(500).json({ error: 'Failed to calculate distance' });
  }
});

export default router;