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
  destinationService = xsenv.getServices({ destination: { tag: 'destination' } }).destination;
} catch (err) {
  console.warn('未找到destination服务配置');
  destinationService = null;
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

  // 1. 检查本地配置
  if (destinationService && destinationService.credentials && 
      destinationService.credentials.destinations) {
    
    // 在本地配置中查找
    const localDest = destinationService.credentials.destinations.find(
      dest => dest.name === destinationName
    );
    
    if (localDest) {
      console.log(`已找到本地destination配置: ${destinationName}`);
      return localDest;
    }
  }

  // 2. 如果本地没有配置，使用BTP云环境destination服务
  if (destinationService && destinationService.credentials && 
      destinationService.credentials.uri) {
    
    // 在BTP云环境中，我们使用destination服务API
    // 注：此处仅提供模拟实现，生产系统应使用实际的Destination服务API调用
    
    // 对于测试环境，我们提供模拟数据
    console.log(`使用测试环境的模拟destination配置: ${destinationName}`);
    
    // 为不同的destination提供不同的模拟配置
    if (destinationName === 'sap-demo') {
      return {
        name: 'sap-demo',
        url: 'https://www.baidu.com',
        authentication: 'NoAuthentication',
        type: 'HTTP',
        proxyType: 'Internet'
      };
    }
  }

  // 3. 未找到destination配置
  console.warn(`未找到destination: ${destinationName}`);
  throw new Error(`未找到名为 ${destinationName} 的destination配置`);
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
      timeout: options.timeout || 30000 // 设置30秒超时
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