using { Currency, managed, sap } from '@sap/cds/common';
namespace sap.capire.sales;

// 商品实体
entity Products : managed {
  key ID        : Integer;
  name          : String(100) @mandatory;  // 商品名称
  description   : String(1000);            // 商品描述
  price         : Decimal(10,2) @mandatory;// 商品价格
  currency      : Currency;                // 货币
  category      : String(50);              // 商品类别
  sku           : String(50);              // 商品编码
  stock         : Integer;                 // 库存数量
  unit          : String(10);              // 单位
  imageUrl      : String(255);             // 商品图片URL
  salesPlans    : Association to many SalesPlanItems on salesPlans.product = $self; // 关联的销售计划
}

// 销售计划实体
entity SalesPlans : managed {
  key ID        : Integer;
  title         : String(100) @mandatory;  // 销售计划标题
  description   : String(1000);            // 销售计划描述
  startDate     : Date @mandatory;         // 计划开始日期
  endDate       : Date @mandatory;         // 计划结束日期
  targetAmount  : Decimal(10,2) @mandatory;// 目标销售额
  unit          : String(3) @mandatory;    // 单位 (如"件"、"箱"等)
  status        : String(20) enum {
    draft       = '草稿';
    inProgress  = '进行中';
    completed   = '已完成';
    cancelled   = '已取消';
  } default 'draft';                       // 计划状态
  responsiblePerson : String(100);         // 负责人
  remarks       : String(1000);            // 备注信息
  items         : Composition of many SalesPlanItems on items.salesPlan = $self; // 销售计划中包含的商品
}

// 销售计划商品关联表（多对多关系）
entity SalesPlanItems : managed {
  key ID        : UUID;
  salesPlan     : Association to SalesPlans;       // 关联的销售计划
  product       : Association to Products;         // 关联的商品
  quantity      : Integer @mandatory;              // 计划销售数量
  targetPrice   : Decimal(10,2);                   // 目标售价
  discount      : Decimal(5,2);                    // 折扣
  notes         : String(500);                     // 备注
}

// 用户与销售计划关联表（权限控制）
entity UserSalesPlanAccess : managed {
  key ID        : UUID;
  userId        : String(255) @mandatory;  // 用户ID
  salesPlan     : Association to SalesPlans; // 关联的销售计划
  accessLevel   : String(20) enum {
    read        = '只读';
    manage      = '管理';
  } default 'read';              // 访问权限级别
}

// 为了UI展示友好，添加注释
annotate SalesPlans with @(
  UI: {
    HeaderInfo: {
      TypeName: '销售计划',
      TypeNamePlural: '销售计划',
      Title: { Value: title },
      Description: { Value: description }
    },
    SelectionFields: [ ID, title, startDate, endDate, status ],
    LineItem: [
      { Value: ID, Label: '编号' },
      { Value: title, Label: '标题' },
      { Value: startDate, Label: '开始日期' },
      { Value: endDate, Label: '结束日期' },
      { Value: targetAmount, Label: '目标销量' },
      { Value: unit, Label: '单位' },
      { Value: status, Label: '状态' }
    ],
    Facets: [
      { 
        $Type: 'UI.ReferenceFacet',
        Label: '基本信息',
        Target: '@UI.FieldGroup#BasicInfo'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: '详细信息',
        Target: '@UI.FieldGroup#DetailInfo'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: '计划商品',
        Target: 'items/@UI.LineItem'
      }
    ],
    FieldGroup#BasicInfo: {
      Data: [
        { Value: ID, Label: '编号' },
        { Value: title, Label: '标题' },
        { Value: startDate, Label: '开始日期' },
        { Value: endDate, Label: '结束日期' },
        { Value: status, Label: '状态' }
      ]
    },
    FieldGroup#DetailInfo: {
      Data: [
        { Value: description, Label: '描述' },
        { Value: targetAmount, Label: '目标销量' },
        { Value: unit, Label: '单位' },
        { Value: responsiblePerson, Label: '负责人' },
        { Value: remarks, Label: '备注' }
      ]
    }
  }
);

// 为商品添加UI注释
annotate Products with @(
  UI: {
    HeaderInfo: {
      TypeName: '商品',
      TypeNamePlural: '商品',
      Title: { Value: name },
      Description: { Value: description }
    },
    SelectionFields: [ ID, name, category, price ],
    LineItem: [
      { Value: ID, Label: '编号' },
      { Value: name, Label: '商品名称' },
      { Value: price, Label: '价格' },
      { Value: currency_code, Label: '货币' },
      { Value: category, Label: '类别' },
      { Value: stock, Label: '库存' },
      { Value: unit, Label: '单位' }
    ],
    Facets: [
      { 
        $Type: 'UI.ReferenceFacet',
        Label: '基本信息',
        Target: '@UI.FieldGroup#BasicInfo'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: '详细信息',
        Target: '@UI.FieldGroup#DetailInfo'
      },
      {
        $Type: 'UI.ReferenceFacet',
        Label: '相关销售计划',
        Target: 'salesPlans/@UI.LineItem'
      }
    ],
    FieldGroup#BasicInfo: {
      Data: [
        { Value: ID, Label: '编号' },
        { Value: name, Label: '商品名称' },
        { Value: category, Label: '类别' },
        { Value: price, Label: '价格' },
        { Value: currency_code, Label: '货币' }
      ]
    },
    FieldGroup#DetailInfo: {
      Data: [
        { Value: description, Label: '描述' },
        { Value: sku, Label: 'SKU' },
        { Value: stock, Label: '库存' },
        { Value: unit, Label: '单位' },
        { Value: imageUrl, Label: '图片URL' }
      ]
    }
  }
);

// 为销售计划商品关联表添加UI注释
annotate SalesPlanItems with @(
  UI: {
    HeaderInfo: {
      TypeName: '计划商品',
      TypeNamePlural: '计划商品',
      Title: { Value: product.name }
    },
    LineItem: [
      { Value: product.ID, Label: '商品编号' },
      { Value: product.name, Label: '商品名称' },
      { Value: quantity, Label: '计划数量' },
      { Value: targetPrice, Label: '目标售价' },
      { Value: discount, Label: '折扣' },
      { Value: notes, Label: '备注' }
    ],
    Facets: [
      { 
        $Type: 'UI.ReferenceFacet',
        Label: '商品信息',
        Target: '@UI.FieldGroup#ItemInfo'
      }
    ],
    FieldGroup#ItemInfo: {
      Data: [
        { Value: product_ID, Label: '商品' },
        { Value: quantity, Label: '计划数量' },
        { Value: targetPrice, Label: '目标售价' },
        { Value: discount, Label: '折扣' },
        { Value: notes, Label: '备注' }
      ]
    }
  }
);

// 为用户权限关联表添加UI注释
annotate UserSalesPlanAccess with @(
  UI: {
    HeaderInfo: {
      TypeName: '用户权限',
      TypeNamePlural: '用户权限',
      Title: { Value: userId },
      Description: { Value: accessLevel }
    },
    LineItem: [
      { Value: userId, Label: '用户ID' },
      { Value: salesPlan_ID, Label: '销售计划ID' },
      { Value: accessLevel, Label: '权限级别' }
    ],
    Facets: [
      { 
        $Type: 'UI.ReferenceFacet',
        Label: '权限信息',
        Target: '@UI.FieldGroup#AccessInfo'
      }
    ],
    FieldGroup#AccessInfo: {
      Data: [
        { Value: userId, Label: '用户ID' },
        { Value: salesPlan_ID, Label: '销售计划' },
        { Value: accessLevel, Label: '权限级别' }
      ]
    }
  }
);

// 启用草稿功能支持编辑
annotate SalesPlans with @fiori.draft.enabled;
annotate Products with @fiori.draft.enabled;
annotate UserSalesPlanAccess with @fiori.draft.enabled; 