-- TCUnnect: 20250908300001_payment_methods_update.sql
-- Real PayMongo methods for this app: GCash, Maya, QRPh — dropping card.

alter table premium_purchases drop constraint premium_purchases_payment_method_check;
alter table premium_purchases add constraint premium_purchases_payment_method_check
  check (payment_method in ('gcash', 'maya', 'qrph'));
