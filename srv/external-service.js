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
  
  // 获取Northwind OData服务产品列表示例
  srv.on('getProducts', async () => {
    try {
      // 使用已配置的my-odata-service destination
      const products = await callDestination('my-odata-service', '/Products?$top=10');
      return { success: true, count: products.d.results.length, products: products.d.results };
    } catch (error) {
      console.error('获取产品列表失败:', error.message);
      return { success: false, error: error.message };
    }
  });
}; 