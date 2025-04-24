/**
 * 销售计划应用程序的认证和授权处理器
 */
const cds = require('@sap/cds');
const xsenv = require('@sap/xsenv');
const { JWTStrategy } = require('@sap/xssec');
const passport = require('passport');

// 获取XSUAA配置
let xsuaaService;
try {
  xsuaaService = xsenv.getServices({ xsuaa: { tag: 'xsuaa' } }).xsuaa;
  console.log('已加载XSUAA服务配置');
} catch (err) {
  console.warn('未找到XSUAA服务配置，使用默认值');
  xsuaaService = {
    xsappname: 'sales-app',
    clientid: 'default-client',
    clientsecret: 'default-secret',
    url: 'http://localhost:4004'
  };
}

/**
 * 初始化认证
 * @param {object} srv - CAP服务实例
 */
module.exports = async (srv) => {
  const app = cds.app;
  if (!app) {
    console.warn('未找到Express应用实例，无法配置认证');
    return;
  }

  const isXsuaaEnabled = process.env.XSUAA_ENABLED || 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  // 在开发模式下，添加登录端点
  if (!isProduction) {
    // 模拟登录端点
    app.post('/login', (req, res) => {
      console.log('收到登录请求');
      
      // 从请求体获取用户名密码
      const { username, password } = req.body || {};
      
      if (!username) {
        return res.status(400).json({ error: '需要提供用户名' });
      }
      
      // 模拟用户
      const users = {
        alice: {
          id: 'alice',
          name: 'Alice',
          password: 'pass',
          roles: ['viewer', 'editor', 'admin'],
          tenant: 'devtenant',
          locale: 'zh'
        },
        bob: {
          id: 'bob',
          name: 'Bob',
          password: 'pass',
          roles: ['viewer', 'editor'],
          tenant: 'devtenant',
          locale: 'zh'
        },
        charlie: {
          id: 'charlie',
          name: 'Charlie',
          password: 'pass',
          roles: ['viewer'],
          tenant: 'devtenant',
          locale: 'zh'
        }
      };
      
      // 检查用户名和密码
      const user = users[username];
      if (!user || (password && user.password !== password)) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }
      
      // 创建会话
      req.session = req.session || {};
      req.session.user = {
        id: user.id,
        name: user.name,
        roles: user.roles,
        tenant: user.tenant,
        locale: user.locale
      };
      
      console.log(`用户 ${username} 登录成功`);
      res.json({ 
        user: req.session.user,
        message: '登录成功' 
      });
    });

    // 退出登录端点
    app.post('/logout', (req, res) => {
      if (req.session) {
        const username = req.session.user?.id || 'unknown';
        req.session.user = null;
        console.log(`用户 ${username} 已登出`);
      }
      res.json({ message: '已登出' });
    });

    // 获取当前用户信息端点
    app.get('/currentUser', (req, res) => {
      const user = req.session?.user || { 
        id: 'anonymous', 
        roles: ['anonymous'], 
        tenant: 'default',
        locale: 'zh'
      };
      res.json({ user });
    });
  }

  // 添加用户中间件 - 确保每个请求都有用户信息
  app.use((req, res, next) => {
    // 从会话中获取用户信息（开发模式）
    if (req.session?.user) {
      req.user = req.session.user;
      // 添加角色检查函数
      req.user.is = function(role) {
        return this.roles.includes(role);
      };
    } 
    // 没有用户信息，设置匿名用户
    else if (!req.user) {
      req.user = { 
        id: 'anonymous', 
        name: 'Anonymous User',
        roles: ['anonymous'],
        tenant: 'default',
        locale: 'zh' 
      };
      // 添加角色检查函数
      req.user.is = function(role) {
        return this.roles.includes(role);
      };
    }
    next();
  });

  // 在XSUAA启用的情况下配置Passport
  if (isXsuaaEnabled === 'true') {
    try {
      // 配置Passport
      passport.use(new JWTStrategy(xsuaaService));
      app.use(passport.initialize());
      
      // 在开发模式下不强制要求JWT认证
      if (!isProduction) {
        console.log('开发模式：不强制要求JWT认证');
        app.use(passport.authenticate('JWT', { 
          session: false,
          failWithError: false
        }));
      } else {
        console.log('生产模式：强制要求JWT认证');
        app.use(passport.authenticate('JWT', { 
          session: false
        }));
      }
      
      console.log('XSUAA认证已配置');
    } catch (error) {
      console.error('XSUAA认证配置失败:', error.message);
    }
  } else {
    console.log('XSUAA认证已禁用');
  }

  // 获取实体引用
  const { SalesPlans, UserSalesPlanAccess } = srv.entities;

  // 拦截READ操作，添加用户上下文相关的筛选
  srv.before('READ', 'SalesPlans', async (req) => {
    // 获取用户信息
    const user = req.user;
    if (!user) return;

    // 检查用户是否具有管理员角色，管理员可以查看所有销售计划
    if (user.is('admin')) return;

    // 获取用户区域和部门属性
    const region = user.attr?.region;
    const department = user.attr?.department;

    // 根据用户权限添加筛选条件
    const filters = [];

    // 当设置了region时筛选
    if (region) {
      filters.push({ region });
    }

    // 当设置了department时筛选
    if (department) {
      filters.push({ department });
    }

    // 查询用户具有访问权限的销售计划
    const userAccess = await SELECT.from(UserSalesPlanAccess)
      .where({ userId: user.id });

    // 添加可访问的销售计划IDs到筛选条件
    if (userAccess.length > 0) {
      const planIds = userAccess.map(access => access.salesPlanId);
      filters.push({ ID: { in: planIds } });
    }

    // 应用筛选条件（如果有）
    if (filters.length > 0) {
      req.query.where({
        or: filters
      });
    }
  });

  // 拦截WRITE操作，确保用户只能修改其有权限的销售计划
  srv.before(['CREATE', 'UPDATE', 'DELETE'], 'SalesPlans', async (req) => {
    // 获取用户信息
    const user = req.user;
    if (!user) return req.reject(403, '未认证的用户');

    // 检查用户是否具有管理员角色，管理员可以修改所有销售计划
    if (user.is('admin')) return;

    // 对于创建操作，检查用户是否有editor权限
    if (req.event === 'CREATE') {
      if (!user.is('editor')) {
        return req.reject(403, '您没有创建销售计划的权限');
      }
      
      // 自动设置用户区域和部门属性
      if (user.attr?.region) {
        req.data.region = user.attr.region;
      }
      if (user.attr?.department) {
        req.data.department = user.attr.department;
      }
      
      return;
    }

    // 对于更新和删除操作，需要检查用户是否有权限访问指定的销售计划
    const planId = req.data.ID || req.params[0];
    if (!planId) return req.reject(400, '未指定销售计划ID');

    // 查询用户访问权限
    const userAccess = await SELECT.from(UserSalesPlanAccess)
      .where({ userId: user.id, salesPlanId: planId });
    
    const plan = await SELECT.one.from(SalesPlans).where({ ID: planId });
    
    // 检查是否属于用户的区域或部门
    const hasRegionAccess = user.attr?.region && plan?.region === user.attr.region;
    const hasDeptAccess = user.attr?.department && plan?.department === user.attr.department;
    
    // 如果没有直接访问权限，且不在用户的区域或部门内，则拒绝访问
    if (userAccess.length === 0 && !hasRegionAccess && !hasDeptAccess) {
      return req.reject(403, '您没有权限修改此销售计划');
    }
    
    // 对于删除操作，检查用户是否有admin权限
    if (req.event === 'DELETE' && !user.is('admin')) {
      return req.reject(403, '只有管理员可以删除销售计划');
    }
  });

  // 实现grantPlanAccess操作
  srv.on('grantPlanAccess', async (req) => {
    const { userId, salesPlanId, accessLevel } = req.data;
    
    // 检查用户权限
    if (!req.user.is('admin')) {
      return req.reject(403, '只有管理员可以授予访问权限');
    }
    
    // 查找是否已存在访问记录
    const existingAccess = await SELECT.from(UserSalesPlanAccess)
      .where({ userId, salesPlanId });
      
    if (existingAccess.length > 0) {
      // 更新现有访问权限
      await UPDATE(UserSalesPlanAccess)
        .set({ accessLevel })
        .where({ userId, salesPlanId });
    } else {
      // 创建新的访问权限
      await INSERT.into(UserSalesPlanAccess)
        .entries({ userId, salesPlanId, accessLevel });
    }
    
    return { success: true, message: '访问权限已授予' };
  });
  
  // 实现revokePlanAccess操作
  srv.on('revokePlanAccess', async (req) => {
    const { userId, salesPlanId } = req.data;
    
    // 检查用户权限
    if (!req.user.is('admin')) {
      return req.reject(403, '只有管理员可以撤销访问权限');
    }
    
    // 删除访问记录
    await DELETE.from(UserSalesPlanAccess)
      .where({ userId, salesPlanId });
      
    return { success: true, message: '访问权限已撤销' };
  });
}; 