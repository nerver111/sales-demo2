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
  console.log('已成功加载destination服务配置');
} catch (err) {
  console.warn('未找到destination服务配置, 将使用模拟数据', err.message);
  
  // 创建模拟的destination服务配置
  destinationService = {
    destinations: [
      {
        name: "sap-demo",
        url: "https://www.baidu.com",
        authentication: "NoAuthentication",
        proxyType: "Internet",
        type: "HTTP",
        description: "示例目标 (模拟)"
      }
    ]
  };
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

  // 检查destinations是否直接在顶级对象中
  if (destinationService && destinationService.destinations && Array.isArray(destinationService.destinations)) {
    const dest = destinationService.destinations.find(d => d.name === destinationName);
    if (dest) {
      console.log(`在顶级destinations中找到destination配置: ${destinationName}`);
      return dest;
    }
  }
  
  // 检查是否在credentials下
  if (destinationService && destinationService.credentials && destinationService.credentials.destinations) {
    const dest = destinationService.credentials.destinations.find(d => d.name === destinationName);
    if (dest) {
      console.log(`在credentials.destinations中找到destination配置: ${destinationName}`);
      return dest;
    }
  }

  // 如果找不到，使用模拟destination
  console.log(`未找到名为 ${destinationName} 的destination配置，使用模拟数据`);
  return {
    name: destinationName,
    url: "https://www.baidu.com",
    authentication: "NoAuthentication",
    type: "HTTP",
    proxyType: "Internet",
    description: "模拟的destination配置"
  };
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
    try {
      const response = await axios(config);
      return response.data;
    } catch (requestError) {
      console.error('请求失败:', requestError.message);
      
      // 返回模拟数据，以允许开发继续而不是失败
      if (process.env.NODE_ENV !== 'production') {
        console.log('返回模拟数据用于开发环境');
        return { 
          mock: true, 
          message: "模拟数据 - 实际请求失败",
          error: requestError.message
        };
      }
      throw requestError;
    }
  } catch (error) {
    console.error('调用destination服务失败:', error.message);
    throw error;
  }
}

module.exports = {
  getDestination,
  callDestination
}; 