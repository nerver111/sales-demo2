const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  const { SalesPlans } = this.entities;

  this.on('READ', SalesPlans, async (req, next) => {
    const user = req.user;
    if (user.is('HyperManager')) {
      req.query.where({ nkaType: 'Hyper' });
    } else if (user.is('NKAManager')) {
      req.query.where({ nkaType: 'NKA' });
    }
    return next();
  });
});