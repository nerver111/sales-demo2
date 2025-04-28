/**
 * 外部服务调用示例
 * 展示如何在CAP服务中使用destination
 */
const cds = require('@sap/cds');
const { callDestination } = require('./destination-helper');

/**
 * 处理外部服务调用
 */
module.exports = async (srv) => {
  // 定义处理器，使用destination调用外部服务
  srv.on('callExternalService', async (req) => {
    try {
      const { destinationName, path } = req.data;
      
      if (!destinationName || !path) {
        return req.error(400, '必须提供destinationName和path参数');
      }
      
      // 调用外部服务
      console.log(`通过destination ${destinationName} 调用路径: ${path}`);
      const result = await callDestination(destinationName, path);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('调用外部服务失败:', error.message);
      return req.error(500, `调用外部服务失败: ${error.message}`);
    }
  });
  
  // 使用sap-demo destination调用服务
  srv.on('getProducts', async (req) => {
    try {
      console.log('开始调用sap-demo destination...');
      
      // 使用已配置的sap-demo destination
      const response = await callDestination('sap-demo', '/');
      console.log('成功调用sap-demo destination');
      
      // 返回结果
      return { 
        success: true, 
        count: 1, 
        products: [{
          ProductID: 1,
          ProductName: "成功连接到httpbin服务",
          UnitPrice: 99.99,
          UnitsInStock: 100,
          CategoryID: 1
        }],
        message: "成功调用sap-demo destination"
      };
    } catch (error) {
      console.error('调用destination失败:', error.message);
      
      // 返回失败信息
      return req.error(500, `调用destination服务失败: ${error.message}`);
    }
  });
}; 