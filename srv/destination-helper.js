/**
 * SAP Destination服务工具函数
 * 用于在应用程序中获取和使用destination配置
 */
const xsenv = require('@sap/xsenv');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 用于保存destination配置的全局变量
let destinationConfigs = null;

// 获取destination服务和配置
function getDestinationService() {
  if (destinationConfigs) {
    return destinationConfigs;
  }

  try {
    console.log('获取destination服务配置...');
    
    // 方法1: 尝试从xsenv获取服务
    try {
      // 尝试使用不同方式获取destination服务
      const services = xsenv.getServices();
      
      // 方式1.1: 通过标准名称
      if (services.destination) {
        console.log('通过标准名称找到destination服务');
        destinationConfigs = services.destination;
        return destinationConfigs;
      }
      
      // 方式1.2: 查找可能的destination服务
      const destServiceNames = Object.keys(services).filter(
        key => key.toLowerCase().includes('destination')
      );
      
      if (destServiceNames.length > 0) {
        console.log(`找到可能的destination服务: ${destServiceNames.join(', ')}`);
        destinationConfigs = services[destServiceNames[0]];
        return destinationConfigs;
      }
    } catch (err) {
      console.log('从xsenv获取服务失败:', err.message);
    }
    
    // 方法2: 从环境变量获取
    const vcapServices = process.env.VCAP_SERVICES;
    if (vcapServices) {
      try {
        const services = JSON.parse(vcapServices);
        if (services.destination && services.destination[0]) {
          console.log('从VCAP_SERVICES环境变量找到destination服务');
          destinationConfigs = services.destination[0];
          return destinationConfigs;
        }
      } catch (err) {
        console.log('从环境变量获取失败:', err.message);
      }
    }
    
    // 方法3: 从default-env.json获取
    try {
      const defaultEnvPath = path.join(process.cwd(), 'default-env.json');
      if (fs.existsSync(defaultEnvPath)) {
        const defaultEnv = JSON.parse(fs.readFileSync(defaultEnvPath, 'utf8'));
        console.log('加载了default-env.json');
        
        if (defaultEnv.VCAP_SERVICES && 
            defaultEnv.VCAP_SERVICES.destination && 
            defaultEnv.VCAP_SERVICES.destination[0]) {
          
          console.log('从default-env.json找到destination服务');
          destinationConfigs = defaultEnv.VCAP_SERVICES.destination[0];
          return destinationConfigs;
        }
      }
    } catch (err) {
      console.log('从default-env.json获取失败:', err.message);
    }
    
    console.error('无法获取destination服务配置，请确保已在BTP上正确配置服务');
    throw new Error('未找到destination服务配置');
    
  } catch (err) {
    console.error('获取destination服务配置失败:', err.message);
    throw err;
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

  const destService = getDestinationService();
  
  // 优先从destinations数组中查找
  if (destService.destinations && Array.isArray(destService.destinations)) {
    const dest = destService.destinations.find(d => d.name === destinationName);
    if (dest) {
      console.log(`在destinations数组中找到destination: ${destinationName}`);
      return dest;
    }
  }
  
  // 如果找不到，抛出错误
  throw new Error(`未找到名为"${destinationName}"的destination配置。请确保在SAP BTP中已正确配置此destination`);
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
    const url = `${destination.url}${path || ''}`;
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