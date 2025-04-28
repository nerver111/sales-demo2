/**
 * SAP Destination服务工具函数
 * 用于在应用程序中获取和使用destination配置
 */
const xsenv = require('@sap/xsenv');
const axios = require('axios');
const https = require('https');

// 尝试从环境变量加载服务
let destinationService;
try {
  // 尝试使用直接标签查找
  try {
    destinationService = xsenv.getServices({ destination: { tag: 'destination' } }).destination;
    console.log('通过tag成功加载destination服务配置');
  } catch (err) {
    // 尝试按服务名称查找
    console.log('尝试通过服务名称查找destination...');
    const services = xsenv.getServices();
    
    // 查找可能的destination服务
    const possibleServiceNames = Object.keys(services).filter(
      key => key.toLowerCase().includes('destination')
    );
    
    if (possibleServiceNames.length > 0) {
      console.log(`找到可能的destination服务: ${possibleServiceNames.join(', ')}`);
      destinationService = services[possibleServiceNames[0]];
    } else {
      throw new Error('未找到任何destination相关服务');
    }
  }
  
  console.log('已成功加载destination服务配置');
} catch (err) {
  console.warn('无法从环境变量加载destination服务配置:', err.message);
  
  // 尝试查找VCAP_SERVICES环境变量中的destination服务
  const vcapServices = process.env.VCAP_SERVICES;
  if (vcapServices) {
    try {
      const services = JSON.parse(vcapServices);
      if (services.destination) {
        console.log('从VCAP_SERVICES找到destination服务');
        destinationService = services.destination[0];
      }
    } catch (e) {
      console.error('解析VCAP_SERVICES失败:', e.message);
    }
  }
  
  if (!destinationService) {
    console.error('未找到destination服务，请确保已在BTP上正确配置');
  }
}

/**
 * 获取指定名称的destination配置
 * @param {string} destinationName - destination名称
 * @returns {Promise<object>} - destination配置对象
 */
async function getDestination(destinationName) {
  if (!destinationName) {
    throw new Error('必须提供destination名称');
  }

  if (!destinationService) {
    throw new Error('未找到destination服务，请确保已在BTP上正确配置');
  }

  // 检查destinations是否直接在顶级对象中
  if (destinationService.destinations && Array.isArray(destinationService.destinations)) {
    const dest = destinationService.destinations.find(d => d.name === destinationName);
    if (dest) {
      console.log(`在顶级destinations中找到destination配置: ${destinationName}`);
      return dest;
    }
  }
  
  // 检查是否在credentials下
  if (destinationService.credentials && destinationService.credentials.destinations) {
    const dest = destinationService.credentials.destinations.find(d => d.name === destinationName);
    if (dest) {
      console.log(`在credentials.destinations中找到destination配置: ${destinationName}`);
      return dest;
    }
  }

  // 如果找不到，抛出错误
  throw new Error(`未找到名为 ${destinationName} 的destination配置，请确保已在BTP上配置了此destination`);
}

/**
 * 使用destination配置发送HTTP请求
 * @param {string} destinationName - destination名称
 * @param {string} path - 请求路径
 * @param {object} options - axios请求选项
 * @returns {Promise<object>} - HTTP响应
 */
async function callDestination(destinationName, path, options = {}) {
  try {
    const destination = await getDestination(destinationName);
    
    // 构建请求URL和配置
    const url = `${destination.url}${path}`;
    const config = {
      ...options,
      url,
      method: options.method || 'GET',
      // 允许自签名证书用于开发环境
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      // 设置超时
      timeout: options.timeout || 10000
    };
    
    // 处理认证
    if (destination.authentication === 'BasicAuthentication' && 
        destination.username && destination.password) {
      config.auth = {
        username: destination.username,
        password: destination.password
      };
    }
    
    // 发送请求
    console.log(`发送请求到目标服务: ${destination.name} (${url})`);
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('调用destination服务失败:', error.message);
    throw error;
  }
}

module.exports = {
  getDestination,
  callDestination
}; 