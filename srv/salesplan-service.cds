using salesplan from '../db/data-model';

service SalesPlanService {
  entity SalesPlans as projection on salesplan.SalesPlan;
} 