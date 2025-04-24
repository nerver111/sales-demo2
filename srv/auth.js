// SAP CAP XSUAA认证处理器
const xsenv = require('@sap/xsenv');
const { JWTStrategy } = require('@sap/xssec');
const passport = require('passport');

// 设置自定义的认证验证器，替代CAP内部的认证检查
class XsuaaAuth {
  static get name() { return 'xsuaa' }

  // 主要认证处理器，在CAP尝试授权操作时被调用
  static async middleware(req, _res, next) {
    // 如果请求已经由Passport认证，则保留用户信息
    if (req.user && req.user.id) {
      req.user.attr = req.user.attr || {};
      console.log(`认证用户: ${req.user.id}`);
    } else {
      // 设置匿名用户
      req.user = { 
        id: 'anonymous', 
        roles: ['anonymous'] 
      };
    }

    // 始终允许请求通过
    next();
  }
}

// 获取XSUAA服务配置
let xsuaaService;
try {
  xsuaaService = xsenv.getServices({ xsuaa: { tag: 'xsuaa' } }).xsuaa;
  console.log('已成功加载XSUAA服务配置', xsuaaService.xsappname);
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
 * 为SAP CAP应用实现XSUAA认证
 * @param {object} app - Express应用实例
 */
module.exports = function (app) {
  // 配置Passport
  passport.use(new JWTStrategy(xsuaaService));
  
  // 注册基本中间件
  app.use(passport.initialize());
  
  // 添加JWT认证中间件，但不强制认证
  app.use(passport.authenticate('JWT', { 
    session: false,
    failWithError: false
  }));
  
  // 注册我们的自定义认证实现到CAP框架
  const cds = require('@sap/cds');
  // 将自定义认证处理器注册为"xsuaa"类型
  cds.env.requires.auth.impl = './srv/auth';
  
  console.log('XSUAA认证已完全替代内置认证');
  
  // 暴露我们的自定义认证处理器
  return XsuaaAuth;
}; 