/**
 * 销售计划管理服务实现
 */
const cds = require('@sap/cds')

module.exports = async (srv) => {
  // 引入认证授权处理器
  await require('./auth-handler')(srv);

  const { SalesPlans, ListOfSalesPlans, SalesPlanItems, Products } = srv.entities

  // 完成销售计划操作
  srv.on('completeSalesPlan', async (req) => {
    const { salesPlan: id } = req.data;
    
    // 检查销售计划是否存在
    const plan = await SELECT.one.from(SalesPlans).where({ ID: id });
    if (!plan) {
      return req.reject(404, `ID为${id}的销售计划不存在`);
    }
    
    // 检查销售计划的状态
    if (plan.status === 'Completed') {
      return req.reject(400, '销售计划已经是完成状态');
    }
    
    // 更新销售计划状态为完成
    await UPDATE(SalesPlans)
      .set({ status: 'Completed' })
      .where({ ID: id });
      
    // 返回更新后的销售计划
    return await SELECT.one.from(SalesPlans).where({ ID: id });
  });
  
  // 取消销售计划操作
  srv.on('cancelSalesPlan', async (req) => {
    const { salesPlan: id } = req.data;
    
    // 检查销售计划是否存在
    const plan = await SELECT.one.from(SalesPlans).where({ ID: id });
    if (!plan) {
      return req.reject(404, `ID为${id}的销售计划不存在`);
    }
    
    // 检查销售计划的状态
    if (plan.status === 'Canceled') {
      return req.reject(400, '销售计划已经是取消状态');
    }
    
    // 更新销售计划状态为取消
    await UPDATE(SalesPlans)
      .set({ status: 'Canceled' })
      .where({ ID: id });
      
    // 返回更新后的销售计划
    return await SELECT.one.from(SalesPlans).where({ ID: id });
  });
  
  // 拦截销售计划创建和更新事件，确保数据完整性
  srv.before(['CREATE', 'UPDATE'], 'SalesPlans', (req) => {
    // 确保开始日期早于结束日期
    if (req.data.startDate && req.data.endDate) {
      const startDate = new Date(req.data.startDate);
      const endDate = new Date(req.data.endDate);
      
      if (startDate > endDate) {
        return req.reject(400, '开始日期不能晚于结束日期');
      }
    }
    
    // 确保销售目标是正值
    if (req.data.targetAmount !== undefined && req.data.targetAmount <= 0) {
      return req.reject(400, '销售目标必须是正值');
    }
  });
  
  // 拦截销售计划删除操作，确保无关联项目
  srv.before('DELETE', 'SalesPlans', async (req) => {
    const id = req.params[0];
    
    // 检查是否存在关联的销售计划项目
    const items = await SELECT.from(SalesPlanItems).where({ salesPlan_ID: id });
    
    if (items.length > 0) {
      return req.reject(400, '无法删除此销售计划，因为它包含销售计划项目。请先删除关联的项目。');
    }
  });

  // 辅助函数：按用户ID过滤销售计划
  const filterSalesPlansByUserAccess = async (req) => {
    // 跳过管理员用户的权限检查
    if (req.user.is('admin')) return;
    
    // 获取当前用户ID
    const userId = req.user.id;
    
    // 如果没有指定ID，则对整个列表进行过滤（只显示用户有权限的销售计划）
    if (!req.data || !req.data.ID) {
      try {
        // 查询当前用户能访问的销售计划IDs
        const accessiblePlans = await SELECT.from('UserSalesPlanAccess')
          .where({ userId: userId })
          .columns(['salesPlan_ID']);
        
        // 如果用户没有任何关联的销售计划，则返回空
        if (!accessiblePlans || !accessiblePlans.length) {
          req.query.where({ ID: { '<': 0 } }); // 不匹配任何ID的条件
          return;
        }
        
        // 构建ID过滤条件
        const planIds = accessiblePlans.map(plan => plan.salesPlan_ID);
        
        if (planIds.length > 0) {
          req.query.where({ ID: { in: planIds } });
        } else {
          req.query.where({ ID: { '<': 0 } }); // 不匹配任何ID的条件
        }
      } catch (error) {
        console.error("过滤销售计划时出错:", error);
        req.reject(500, "获取访问权限时出错");
      }
    } 
    // 如果指定了ID，检查用户是否有权限访问该销售计划
    else {
      try {
        const access = await SELECT.from('UserSalesPlanAccess')
          .where({ userId: userId, salesPlan_ID: req.data.ID });
        
        if (!access || !access.length) {
          req.reject(403, '您没有权限查看此销售计划');
        }
      } catch (error) {
        console.error("检查销售计划访问权限时出错:", error);
        req.reject(500, "检查访问权限时出错");
      }
    }
  };
  
  // 在读取销售计划列表时，添加用户访问权限的过滤
  srv.before('READ', 'SalesPlans', filterSalesPlansByUserAccess);
  
  // 在读取销售计划简化视图时，也添加用户访问权限的过滤
  srv.before('READ', 'ListOfSalesPlans', filterSalesPlansByUserAccess);

  // 授予用户对销售计划的访问权限
  srv.on('grantPlanAccess', async (req) => {
    const { userId, salesPlanId, accessLevel } = req.data;
    const tx = cds.transaction(req);
    
    try {
      // 检查销售计划是否存在
      const plan = await tx.read('SalesPlans').where({ ID: salesPlanId });
      if (!plan.length) {
        return req.error(404, `销售计划 #${salesPlanId} 不存在`);
      }
      
      // 检查是否已有权限记录
      const existingAccess = await tx.read('UserSalesPlanAccess')
        .where({ userId: userId, salesPlan_ID: salesPlanId });
      
      if (existingAccess.length) {
        // 更新现有权限
        await tx.update('UserSalesPlanAccess')
          .set({ accessLevel: accessLevel })
          .where({ userId: userId, salesPlan_ID: salesPlanId });
      } else {
        // 创建新的权限记录
        await tx.create('UserSalesPlanAccess').entries({
          userId: userId,
          salesPlan_ID: salesPlanId,
          accessLevel: accessLevel
        });
      }
      
      return { success: true, message: `已授予用户 ${userId} 对销售计划 #${salesPlanId} 的访问权限` };
    } catch (error) {
      req.error(500, `授权失败: ${error.message}`);
    }
  });

  // 撤销用户对销售计划的访问权限
  srv.on('revokePlanAccess', async (req) => {
    const { userId, salesPlanId } = req.data;
    const tx = cds.transaction(req);
    
    try {
      // 删除权限记录
      await tx.delete('UserSalesPlanAccess')
        .where({ userId: userId, salesPlan_ID: salesPlanId });
      
      return { success: true, message: `已撤销用户 ${userId} 对销售计划 #${salesPlanId} 的访问权限` };
    } catch (error) {
      req.error(500, `撤销权限失败: ${error.message}`);
    }
  });
} 
