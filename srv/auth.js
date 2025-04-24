// SAP CAP XSUAA认证处理器 - 简化版
const xsenv = require('@sap/xsenv');
const { JWTStrategy } = require('@sap/xssec');
const passport = require('passport');

// 获取XSUAA服务配置
let xsuaaService;
try {
  xsuaaService = xsenv.getServices({ xsuaa: { tag: 'xsuaa' } }).xsuaa;
  console.log('已成功加载XSUAA服务配置:', xsuaaService.xsappname);
} catch (err) {
  console.warn('未找到XSUAA服务配置，将使用默认配置');
  // 创建一个最小化的模拟XSUAA服务
  xsuaaService = {
    xsappname: 'mock-sales-app',
    clientid: 'sb-mock-client',
    clientsecret: 'mock-secret',
    url: 'http://localhost:8080',
    uaadomain: 'localhost'
  };
}

/**
 * 为Express应用实现XSUAA认证
 * @param {object} app - Express应用实例
 */
module.exports = function (app) {
  // 配置Passport
  passport.use(new JWTStrategy(xsuaaService));
  
  // 注册基本中间件
  app.use(passport.initialize());
  
  // 添加JWT认证中间件（不强制认证，便于开发）
  app.use(passport.authenticate('JWT', { 
    session: false,
    failWithError: false
  }));
  
  // 添加通用用户信息中间件
  app.use((req, res, next) => {
    // 如果有认证用户，则Passport会设置req.user
    // 否则我们设置一个默认匿名用户
    if (!req.user) {
      req.user = { 
        id: 'anonymous', 
        name: 'Anonymous User',
        roles: ['anonymous']
      };
    }
    
    // 确保CAP能够使用这些用户信息进行授权
    if (req.user) {
      req.user.tenant = req.user.tenant || 'default';
      req.user.locale = req.user.locale || 'zh';
      req.user._roles = req.user.roles || [];
    }
    
    next();
  });
  
  console.log('已设置直接的Passport JWT认证中间件');
}; 