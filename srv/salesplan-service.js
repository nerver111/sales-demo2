const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  const { SalesPlan } = this.entities;

  this.on('READ', SalesPlan, async (req, next) => {
    const user = req.user;
    // 根据角色集合过滤数据
    if (user.is('HyperManager')) {
      req.query.where({ nkaType: 'Hyper' });
    } else if (user.is('NKAManager')) {
      req.query.where({ nkaType: 'NKA' });
    }
    // 其它角色可继续扩展
    return next();
  });
}); 