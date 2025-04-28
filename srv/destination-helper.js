/**
 * SAP Destination服务工具函数
 * 用于在应用程序中获取和使用destination配置
 */
const xsenv = require('@sap/xsenv');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

// sap-demo destination的硬编码配置
const SAP_DEMO_CONFIG = {
  name: "sap-demo",
  url: "https://httpbin.org/get",
  authentication: "NoAuthentication",
  proxyType: "Internet",
  type: "HTTP"
};

// 用于保存destination服务和destination配置的全局变量
let globalDestinationConfig = null;

// 尝试以各种方式获取destination配置
function initializeDestinationConfig() {
  if (globalDestinationConfig) {
    return globalDestinationConfig;
  }

  try {
    console.log('初始化destination配置...');
    
    // 方法1: 尝试从xsenv获取服务
    try {
      // 尝试使用不同方式获取destination服务
      const services = xsenv.getServices();
      
      // 方式1.1: 通过标准名称
      if (services.destination) {
        console.log('通过标准名称找到destination服务');
        if (services.destination.destinations) {
          const dest = services.destination.destinations.find(d => d.name === 'sap-demo');
          if (dest) {
            console.log('在destination.destinations中找到sap-demo');
            globalDestinationConfig = dest;
            return globalDestinationConfig;
          }
        }
      }
      
      // 方式1.2: 查找可能的destination服务
      const destServiceNames = Object.keys(services).filter(
        key => key.toLowerCase().includes('destination')
      );
      
      if (destServiceNames.length > 0) {
        console.log(`找到可能的destination服务: ${destServiceNames.join(', ')}`);
        const destService = services[destServiceNames[0]];
        
        if (destService && destService.destinations) {
          const dest = destService.destinations.find(d => d.name === 'sap-demo');
          if (dest) {
            console.log(`在${destServiceNames[0]}.destinations中找到sap-demo`);
            globalDestinationConfig = dest;
            return globalDestinationConfig;
          }
        }
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
          const destService = services.destination[0];
          console.log('从VCAP_SERVICES环境变量找到destination服务');
          
          if (destService.destinations) {
            const dest = destService.destinations.find(d => d.name === 'sap-demo');
            if (dest) {
              console.log('在VCAP_SERVICES.destination[0].destinations中找到sap-demo');
              globalDestinationConfig = dest;
              return globalDestinationConfig;
            }
          }
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
          
          const destService = defaultEnv.VCAP_SERVICES.destination[0];
          
          if (destService.destinations) {
            const dest = destService.destinations.find(d => d.name === 'sap-demo');
            if (dest) {
              console.log('在default-env.json中找到sap-demo配置');
              globalDestinationConfig = dest;
              return globalDestinationConfig;
            }
          }
        }
      }
    } catch (err) {
      console.log('从default-env.json获取失败:', err.message);
    }
    
    // 方法4: 使用硬编码配置
    console.log('使用硬编码的sap-demo配置');
    globalDestinationConfig = SAP_DEMO_CONFIG;
    return globalDestinationConfig;
    
  } catch (err) {
    console.error('初始化destination配置失败:', err.message);
    // 返回硬编码的配置作为后备
    globalDestinationConfig = SAP_DEMO_CONFIG;
    return globalDestinationConfig;
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

  // 目前只支持sap-demo
  if (destinationName !== 'sap-demo') {
    throw new Error(`只支持名为sap-demo的destination，不支持: ${destinationName}`);
  }
  
  // 初始化并返回配置
  return initializeDestinationConfig();
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