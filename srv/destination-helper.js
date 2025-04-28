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
  console.log('已成功加载destination服务配置:', 
    destinationService.destinations ? 
    `找到${destinationService.destinations.length}个destination` : 
    '未在顶级对象找到destinations');
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

  if (!destinationService) {
    throw new Error('Destination服务未配置');
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
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
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