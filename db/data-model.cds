namespace salesplan;

entity SalesPlan {
  key ID           : UUID;
  year             : Integer;
  planType         : String(50);
  salesType        : String(50);
  nkaType          : String(50);
  name             : String(100);
  owner            : String(50);
  status           : String(20);
  updatedAt        : Timestamp;
  stoppedAt        : Timestamp;
} 