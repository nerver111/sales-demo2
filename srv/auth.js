// SAP CAP XSUAA认证处理器
const xsenv = require('@sap/xsenv');
const { JWTStrategy } = require('@sap/xssec');
const passport = require('passport');

// 获取XSUAA服务配置
let xsuaaService;
try {
  xsuaaService = xsenv.getServices({ xsuaa: { tag: 'xsuaa' } }).xsuaa;
  console.log('已成功加载XSUAA服务配置', xsuaaService.xsappname);
} catch (err) {
  console.warn('未找到XSUAA服务配置:', err.message);
  // 创建一个最小化的模拟XSUAA服务以避免错误
  xsuaaService = {
    xsappname: 'mock-sales-app',
    clientid: 'sb-mock-client',
    clientsecret: 'mock-secret',
    url: 'http://localhost:8080',
    uaadomain: 'localhost'
  };
}

/**
 * 为SAP CAP应用实现XSUAA认证
 * @param {object} app - Express应用实例
 */
module.exports = function (app) {
  // 配置Passport
  passport.use(new JWTStrategy(xsuaaService));
  
  // 注册中间件
  app.use(passport.initialize());
  
  // 添加JWT认证中间件
  app.use(passport.authenticate('JWT', { 
    session: false,
    failWithError: false // 允许未认证请求继续（开发环境）
  }));
  
  console.log('XSUAA认证中间件已注册');
}; 