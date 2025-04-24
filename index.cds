// 销售计划应用入口文件
using from './db/schema';
using from './srv/sales-service';

// 移除自动导出注解，避免与init.js中的数据导入冲突
// annotate sap.capire.sales.SalesPlans with @cds.autoexpose; 