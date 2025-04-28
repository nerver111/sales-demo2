using { sap.capire.sales as my } from '../db/schema';

// 定义销售计划管理服务
service SalesService @(
  path:'/sales', 
  requires: ['authenticated-user', 'viewer']
) {
  // 浏览销售计划时使用的简化视图
  @readonly entity ListOfSalesPlans as projection on my.SalesPlans {
    ID, title, startDate, endDate, targetAmount, unit, status
  };

  // 详细的销售计划视图，支持CRUD操作
  @(restrict: [
    { grant: ['READ'], to: 'viewer' },
    { grant: ['CREATE', 'UPDATE'], to: 'editor' },
    { grant: ['DELETE'], to: 'admin' }
  ])
  @cds.redirection.target entity SalesPlans as projection on my.SalesPlans;
  
  // 商品实体
  @(restrict: [
    { grant: ['READ'], to: 'viewer' },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: 'admin' }
  ])
  @cds.redirection.target entity Products as projection on my.Products;

  
  // 添加用户与销售计划的访问控制
  @(restrict: [
    { grant: ['READ'], to: 'viewer' },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: 'admin' }
  ])
  entity UserSalesPlanAccess as projection on my.UserSalesPlanAccess;
  
  // 销售计划商品关联
  @(restrict: [
    { grant: ['READ'], to: 'viewer' },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: 'editor' }
  ])
  entity SalesPlanItems as projection on my.SalesPlanItems;

  // 通过自定义函数添加额外功能
  @(restrict: [{ to: 'editor' }])
  action completeSalesPlan ( salesPlan: SalesPlans:ID ) returns SalesPlans;
  
  @(restrict: [{ to: 'editor' }])
  action cancelSalesPlan ( salesPlan: SalesPlans:ID ) returns SalesPlans;
  
  // 在服务中添加权限管理操作
  @(restrict: [{ to: 'admin' }])
  action grantPlanAccess(userId: String, salesPlanId: Integer, accessLevel: String);
  
  @(restrict: [{ to: 'admin' }])
  action revokePlanAccess(userId: String, salesPlanId: Integer);
  
  // 添加外部服务API - 使用Destination服务
  type ExternalServiceResponse {
    success: Boolean;
    data: String;
    error: String;
  }
  
  @(restrict: [{ to: 'admin' }])
  action callExternalService(destinationName: String, path: String) returns ExternalServiceResponse;
  
  @(restrict: [{ to: 'viewer' }])
  function getProducts() returns {
    success: Boolean;
    count: Integer;
    products: array of {
      ProductID: Integer;
      ProductName: String;
      UnitPrice: Decimal;
      UnitsInStock: Integer;
      CategoryID: Integer;
    };
    error: String;
  };
}

// 管理服务，用于管理员访问
service SalesAdminService @(
  path:'/sales-admin', 
  requires: 'admin'
) {
  @cds.redirection.target entity SalesPlans as projection on my.SalesPlans;
  @cds.redirection.target entity Products as projection on my.Products;
  entity SalesPlanItems as projection on my.SalesPlanItems;
} 