PRAGMA foreign_keys = ON;

INSERT INTO import_batches (id,organization_id,platform,import_type,source_name,period_start,period_end,status,rows_received,rows_imported,details_json) VALUES ('imp_bolt_2025_12_30_2026_05_31','org_daniel_sc','Bolt','earnings_csv','Ganhos por motorista 30 dez 2025-31 mai 2026','2025-12-30','2026-05-31','completed',9,9,'{"seeded":true}') ON CONFLICT(id) DO NOTHING;

INSERT INTO import_batches (id,organization_id,platform,import_type,source_name,period_start,period_end,status,rows_received,rows_imported,details_json) VALUES ('imp_bolt_2026_06_01_2026_07_19','org_daniel_sc','Bolt','earnings_csv','Ganhos por motorista 1 jun 2026-19 jul 2026','2026-06-01','2026-07-19','completed',7,7,'{"seeded":true}') ON CONFLICT(id) DO NOTHING;

INSERT INTO import_batches (id,organization_id,platform,import_type,source_name,period_start,period_end,status,rows_received,rows_imported,details_json) VALUES ('imp_uber_2026_06_15_2026_07_13','org_daniel_sc','Uber','driver_activity_csv','Uber driver activity 15 jun-13 jul 2026','2026-06-15','2026-07-13','completed',7,7,'{"seeded":true}') ON CONFLICT(id) DO NOTHING;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_carlos_jesus','Carlos Jesus','351910369014','crlsmnjesus@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_43de687d_dea5_4c48_9b85_0fc58ab6f2e7','drv_carlos_jesus','Bolt','43de687d-dea5-4c48-9b85-0fc58ab6f2e7','49741997-ed93-4127-be97-36fa92660373',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_43de687d_dea5_4c48_9b85_0fc58ab6f2e7_2025_12_30_2026_05_31','org_daniel_sc','Bolt','drv_carlos_jesus','bolt:43de687d-dea5-4c48-9b85-0fc58ab6f2e7:2025-12-30:2026-05-31','Ganhos por motorista-30 dez 2025-31 mai 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2025-12-30','2026-05-31','aggregated_period',
6074,4558,1516,0,10,0,0,0,0,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Carlos Jesus","Email":"crlsmnjesus@gmail.com","Telemóvel":351910369014,"Ganhos brutos (total)|€":60.74,"Ganhos brutos (pagamentos na app)|€":60.74,"IVA sobre os ganhos brutos (pagamentos na app)|€":2.76,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":0.0,"Ganhos da campanha|€":0.0,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":0.0,"IVA das taxas de cancelamento|€":0.0,"Portagens|€":0.1,"Taxas de reserva|€":0.0,"IVA das taxas de reserva|€":0.0,"Total de taxas|€":15.16,"Comissões|€":15.16,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":45.58,"Pagamento previsto|€":45.58,"Ganhos brutos por hora|€/h":7.49,"Ganhos líquidos por hora|€/h":5.62,"Desconto de comissão (in-app)|€":12.61,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"43de687d-dea5-4c48-9b85-0fc58ab6f2e7","Identificador individual":"49741997-ed93-4127-be97-36fa92660373"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_daniel_silva','Daniel Silva','351932925068','danisilvatvde@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_7eb9a048_d4a7_428b_a08b_d69328b49442','drv_daniel_silva','Bolt','7eb9a048-d4a7-428b-a08b-d69328b49442','eeb9107e-4c71-4494-a372-55f471af3931',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_7eb9a048_d4a7_428b_a08b_d69328b49442_2025_12_30_2026_05_31','org_daniel_sc','Bolt','drv_daniel_silva','bolt:7eb9a048-d4a7-428b-a08b-d69328b49442:2025-12-30:2026-05-31','Ganhos por motorista-30 dez 2025-31 mai 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2025-12-30','2026-05-31','aggregated_period',
315371,241802,73070,1450,515,4484,0,2175,600,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Daniel Silva","Email":"danisilvatvde@gmail.com","Telemóvel":351932925068,"Ganhos brutos (total)|€":3153.71,"Ganhos brutos (pagamentos na app)|€":3072.62,"IVA sobre os ganhos brutos (pagamentos na app)|€":145.12,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":14.5,"Ganhos da campanha|€":44.84,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":21.75,"IVA das taxas de cancelamento|€":1.25,"Portagens|€":5.15,"Taxas de reserva|€":6.0,"IVA das taxas de reserva|€":0.36,"Total de taxas|€":735.7,"Comissões|€":730.7,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":2418.02,"Pagamento previsto|€":2418.02,"Ganhos brutos por hora|€/h":12.81,"Ganhos líquidos por hora|€/h":9.82,"Desconto de comissão (in-app)|€":497.98,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"7eb9a048-d4a7-428b-a08b-d69328b49442","Identificador individual":"eeb9107e-4c71-4494-a372-55f471af3931"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_fabio_silva','Fábio Silva','351918488546','fabio.daniel.pais.da.silva.88@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_1459ee9a_7dc3_4369_9c89_223af54b44f5','drv_fabio_silva','Bolt','1459ee9a-7dc3-4369-9c89-223af54b44f5','7a9dec33-2842-491a-a795-c1994a0f8b9c',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_1459ee9a_7dc3_4369_9c89_223af54b44f5_2025_12_30_2026_05_31','org_daniel_sc','Bolt','drv_fabio_silva','bolt:1459ee9a-7dc3-4369-9c89-223af54b44f5:2025-12-30:2026-05-31','Ganhos por motorista-30 dez 2025-31 mai 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2025-12-30','2026-05-31','aggregated_period',
2212,1667,546,0,30,0,0,0,0,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Fábio Silva","Email":"fabio.daniel.pais.da.silva.88@gmail.com","Telemóvel":351918488546,"Ganhos brutos (total)|€":22.12,"Ganhos brutos (pagamentos na app)|€":22.12,"IVA sobre os ganhos brutos (pagamentos na app)|€":0.95,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":0.0,"Ganhos da campanha|€":0.0,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":0.0,"IVA das taxas de cancelamento|€":0.0,"Portagens|€":0.3,"Taxas de reserva|€":0.0,"IVA das taxas de reserva|€":0.0,"Total de taxas|€":5.46,"Comissões|€":5.46,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":16.67,"Pagamento previsto|€":16.67,"Ganhos brutos por hora|€/h":18.63,"Ganhos líquidos por hora|€/h":14.04,"Desconto de comissão (in-app)|€":5.48,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"1459ee9a-7dc3-4369-9c89-223af54b44f5","Identificador individual":"7a9dec33-2842-491a-a795-c1994a0f8b9c"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_gerson_miguel','Gerson Miguel','351922014998','uberestafeta22@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_6cde8665_a0c7_47cb_b333_d6e6ea18ba2d','drv_gerson_miguel','Bolt','6cde8665-a0c7-47cb-b333-d6e6ea18ba2d','f30973b6-f3cb-430e-aac0-8d303a27e992',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_6cde8665_a0c7_47cb_b333_d6e6ea18ba2d_2025_12_30_2026_05_31','org_daniel_sc','Bolt','drv_gerson_miguel','bolt:6cde8665-a0c7-47cb-b333-d6e6ea18ba2d:2025-12-30:2026-05-31','Ganhos por motorista-30 dez 2025-31 mai 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2025-12-30','2026-05-31','aggregated_period',
4193,3184,1009,0,0,0,0,0,0,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Gerson Miguel","Email":"uberestafeta22@gmail.com","Telemóvel":351922014998,"Ganhos brutos (total)|€":41.93,"Ganhos brutos (pagamentos na app)|€":41.93,"IVA sobre os ganhos brutos (pagamentos na app)|€":2.35,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":0.0,"Ganhos da campanha|€":0.0,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":0.0,"IVA das taxas de cancelamento|€":0.0,"Portagens|€":0.0,"Taxas de reserva|€":0.0,"IVA das taxas de reserva|€":0.0,"Total de taxas|€":10.09,"Comissões|€":10.09,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":31.84,"Pagamento previsto|€":31.84,"Ganhos brutos por hora|€/h":1.7,"Ganhos líquidos por hora|€/h":1.29,"Desconto de comissão (in-app)|€":0.0,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"6cde8665-a0c7-47cb-b333-d6e6ea18ba2d","Identificador individual":"f30973b6-f3cb-430e-aac0-8d303a27e992"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_joel_assuncao','Joel Assunção','351939607176','Rubberpuntocom@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_4b4bab61_e304_4067_9d99_94ad36488c78','drv_joel_assuncao','Bolt','4b4bab61-e304-4067-9d99-94ad36488c78','173c6e53-e29c-4972-851a-217c24a83851',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_4b4bab61_e304_4067_9d99_94ad36488c78_2025_12_30_2026_05_31','org_daniel_sc','Bolt','drv_joel_assuncao','bolt:4b4bab61-e304-4067-9d99-94ad36488c78:2025-12-30:2026-05-31','Ganhos por motorista-30 dez 2025-31 mai 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2025-12-30','2026-05-31','aggregated_period',
5700,4362,1339,0,90,0,0,350,0,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Joel Assunção","Email":"Rubberpuntocom@gmail.com","Telemóvel":351939607176,"Ganhos brutos (total)|€":57.0,"Ganhos brutos (pagamentos na app)|€":53.5,"IVA sobre os ganhos brutos (pagamentos na app)|€":2.63,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":0.0,"Ganhos da campanha|€":0.0,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":3.5,"IVA das taxas de cancelamento|€":0.2,"Portagens|€":0.9,"Taxas de reserva|€":0.0,"IVA das taxas de reserva|€":0.0,"Total de taxas|€":13.39,"Comissões|€":13.39,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":43.62,"Pagamento previsto|€":43.62,"Ganhos brutos por hora|€/h":11.12,"Ganhos líquidos por hora|€/h":8.51,"Desconto de comissão (in-app)|€":7.4,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"4b4bab61-e304-4067-9d99-94ad36488c78","Identificador individual":"173c6e53-e29c-4972-851a-217c24a83851"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_marcelo_gomes','Marcelo Gomes','351915021406','blalmeidagomes2611@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_b920cb39_43da_4dc6_a960_a4723d6d9ae0','drv_marcelo_gomes','Bolt','b920cb39-43da-4dc6-a960-a4723d6d9ae0','b8e1e004-e253-42e5-8569-b6a80aa6cc08',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_b920cb39_43da_4dc6_a960_a4723d6d9ae0_2025_12_30_2026_05_31','org_daniel_sc','Bolt','drv_marcelo_gomes','bolt:b920cb39-43da-4dc6-a960-a4723d6d9ae0:2025-12-30:2026-05-31','Ganhos por motorista-30 dez 2025-31 mai 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2025-12-30','2026-05-31','aggregated_period',
21111,16023,5088,350,60,0,0,730,0,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Marcelo Gomes","Email":"blalmeidagomes2611@gmail.com","Telemóvel":351915021406,"Ganhos brutos (total)|€":211.11,"Ganhos brutos (pagamentos na app)|€":200.31,"IVA sobre os ganhos brutos (pagamentos na app)|€":10.37,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":3.5,"Ganhos da campanha|€":0.0,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":7.3,"IVA das taxas de cancelamento|€":0.42,"Portagens|€":0.6,"Taxas de reserva|€":0.0,"IVA das taxas de reserva|€":0.0,"Total de taxas|€":50.88,"Comissões|€":50.88,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":160.23,"Pagamento previsto|€":160.23,"Ganhos brutos por hora|€/h":10.48,"Ganhos líquidos por hora|€/h":7.95,"Desconto de comissão (in-app)|€":18.78,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"b920cb39-43da-4dc6-a960-a4723d6d9ae0","Identificador individual":"b8e1e004-e253-42e5-8569-b6a80aa6cc08"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_tiago_pinto','Tiago Pinto','351912320731','t1ag0afp737@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_a2e4a08e_08f2_4115_a844_44406caa8785','drv_tiago_pinto','Bolt','a2e4a08e-08f2-4115-a844-44406caa8785','06b81bb8-230f-4d1b-b46c-9b24e18e5f52',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_a2e4a08e_08f2_4115_a844_44406caa8785_2025_12_30_2026_05_31','org_daniel_sc','Bolt','drv_tiago_pinto','bolt:a2e4a08e-08f2-4115-a844-44406caa8785:2025-12-30:2026-05-31','Ganhos por motorista-30 dez 2025-31 mai 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2025-12-30','2026-05-31','aggregated_period',
311428,237128,73301,1831,2835,0,0,1715,1200,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Tiago Pinto","Email":"t1ag0afp737@gmail.com","Telemóvel":351912320731,"Ganhos brutos (total)|€":3114.28,"Ganhos brutos (pagamentos na app)|€":3078.82,"IVA sobre os ganhos brutos (pagamentos na app)|€":146.77,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":18.31,"Ganhos da campanha|€":0.0,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":17.15,"IVA das taxas de cancelamento|€":0.98,"Portagens|€":28.35,"Taxas de reserva|€":12.0,"IVA das taxas de reserva|€":0.72,"Total de taxas|€":743.01,"Comissões|€":733.01,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":2371.28,"Pagamento previsto|€":2371.28,"Ganhos brutos por hora|€/h":11.03,"Ganhos líquidos por hora|€/h":8.4,"Desconto de comissão (in-app)|€":489.52,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"a2e4a08e-08f2-4115-a844-44406caa8785","Identificador individual":"06b81bb8-230f-4d1b-b46c-9b24e18e5f52"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_viviana_reis','Viviana Reis','351913900938','vivianasreistvde@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_e19c57eb_c420_45b7_9e98_43c77db58495','drv_viviana_reis','Bolt','e19c57eb-c420-45b7-9e98-43c77db58495','04ecdfa6-d908-4668-bc5c-0e8c2d2b7faa',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_e19c57eb_c420_45b7_9e98_43c77db58495_2025_12_30_2026_05_31','org_daniel_sc','Bolt','drv_viviana_reis','bolt:e19c57eb-c420-45b7-9e98-43c77db58495:2025-12-30:2026-05-31','Ganhos por motorista-30 dez 2025-31 mai 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2025-12-30','2026-05-31','aggregated_period',
32179,24444,7736,0,425,0,0,0,100,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Viviana Reis","Email":"vivianasreistvde@gmail.com","Telemóvel":351913900938,"Ganhos brutos (total)|€":321.79,"Ganhos brutos (pagamentos na app)|€":321.79,"IVA sobre os ganhos brutos (pagamentos na app)|€":16.35,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":0.0,"Ganhos da campanha|€":0.0,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":0.0,"IVA das taxas de cancelamento|€":0.0,"Portagens|€":4.25,"Taxas de reserva|€":1.0,"IVA das taxas de reserva|€":0.06,"Total de taxas|€":77.36,"Comissões|€":77.36,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":244.44,"Pagamento previsto|€":244.44,"Ganhos brutos por hora|€/h":2.16,"Ganhos líquidos por hora|€/h":1.64,"Desconto de comissão (in-app)|€":30.36,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"e19c57eb-c420-45b7-9e98-43c77db58495","Identificador individual":"04ecdfa6-d908-4668-bc5c-0e8c2d2b7faa"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_angela_campos','Ângela Campos','351963016771','angelasofiacampos20@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_bc31b3be_240e_42ae_9d37_077460ed0cef','drv_angela_campos','Bolt','bc31b3be-240e-42ae-9d37-077460ed0cef','01e08d36-5388-451c-9eb7-6a4c472b0e90',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_bc31b3be_240e_42ae_9d37_077460ed0cef_2025_12_30_2026_05_31','org_daniel_sc','Bolt','drv_angela_campos','bolt:bc31b3be-240e-42ae-9d37-077460ed0cef:2025-12-30:2026-05-31','Ganhos por motorista-30 dez 2025-31 mai 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2025-12-30','2026-05-31','aggregated_period',
7588,5791,1797,0,0,0,0,0,0,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Ângela Campos","Email":"angelasofiacampos20@gmail.com","Telemóvel":351963016771,"Ganhos brutos (total)|€":75.88,"Ganhos brutos (pagamentos na app)|€":75.88,"IVA sobre os ganhos brutos (pagamentos na app)|€":3.45,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":0.0,"Ganhos da campanha|€":0.0,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":0.0,"IVA das taxas de cancelamento|€":0.0,"Portagens|€":0.0,"Taxas de reserva|€":0.0,"IVA das taxas de reserva|€":0.0,"Total de taxas|€":17.97,"Comissões|€":17.97,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":57.91,"Pagamento previsto|€":57.91,"Ganhos brutos por hora|€/h":9.4,"Ganhos líquidos por hora|€/h":7.18,"Desconto de comissão (in-app)|€":14.9,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"bc31b3be-240e-42ae-9d37-077460ed0cef","Identificador individual":"01e08d36-5388-451c-9eb7-6a4c472b0e90"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_anubis_ribeiro','Anúbis Ribeiro','351937672457','undercoverprotection1993@hotmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_134b3cc6_b10e_4c83_b00a_75f558a8bd33','drv_anubis_ribeiro','Bolt','134b3cc6-b10e-4c83-b00a-75f558a8bd33','29d40217-d13b-4773-93ab-ffd864725cd7',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_134b3cc6_b10e_4c83_b00a_75f558a8bd33_2026_06_01_2026_07_19','org_daniel_sc','Bolt','drv_anubis_ribeiro','bolt:134b3cc6-b10e-4c83-b00a-75f558a8bd33:2026-06-01:2026-07-19','Ganhos por motorista-1 jun 2026-19 jul 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2026-06-01','2026-07-19','aggregated_period',
405,304,101,0,0,0,0,0,0,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Anúbis Ribeiro","Email":"undercoverprotection1993@hotmail.com","Telemóvel":351937672457,"Ganhos brutos (total)|€":4.05,"Ganhos brutos (pagamentos na app)|€":4.05,"IVA sobre os ganhos brutos (pagamentos na app)|€":0.17,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":0.0,"Ganhos da campanha|€":0.0,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":0.0,"IVA das taxas de cancelamento|€":0.0,"Portagens|€":0.0,"Taxas de reserva|€":0.0,"IVA das taxas de reserva|€":0.0,"Total de taxas|€":1.01,"Comissões|€":1.01,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":3.04,"Pagamento previsto|€":3.04,"Ganhos brutos por hora|€/h":11.03,"Ganhos líquidos por hora|€/h":8.27,"Desconto de comissão (in-app)|€":1.13,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"134b3cc6-b10e-4c83-b00a-75f558a8bd33","Identificador individual":"29d40217-d13b-4773-93ab-ffd864725cd7"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_daniel_silva','Daniel Silva','351932925068','danisilvatvde@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_7eb9a048_d4a7_428b_a08b_d69328b49442','drv_daniel_silva','Bolt','7eb9a048-d4a7-428b-a08b-d69328b49442','eeb9107e-4c71-4494-a372-55f471af3931',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_7eb9a048_d4a7_428b_a08b_d69328b49442_2026_06_01_2026_07_19','org_daniel_sc','Bolt','drv_daniel_silva','bolt:7eb9a048-d4a7-428b-a08b-d69328b49442:2026-06-01:2026-07-19','Ganhos por motorista-1 jun 2026-19 jul 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2026-06-01','2026-07-19','aggregated_period',
196520,154606,41814,1950,510,21845,0,1080,300,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Daniel Silva","Email":"danisilvatvde@gmail.com","Telemóvel":351932925068,"Ganhos brutos (total)|€":1965.2,"Ganhos brutos (pagamentos na app)|€":1716.45,"IVA sobre os ganhos brutos (pagamentos na app)|€":82.99,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":19.5,"Ganhos da campanha|€":218.45,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":10.8,"IVA das taxas de cancelamento|€":0.62,"Portagens|€":5.1,"Taxas de reserva|€":3.0,"IVA das taxas de reserva|€":0.18,"Total de taxas|€":419.14,"Comissões|€":418.14,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":1546.06,"Pagamento previsto|€":1546.06,"Ganhos brutos por hora|€/h":21.09,"Ganhos líquidos por hora|€/h":16.59,"Desconto de comissão (in-app)|€":252.15,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"7eb9a048-d4a7-428b-a08b-d69328b49442","Identificador individual":"eeb9107e-4c71-4494-a372-55f471af3931"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_joel_assuncao','Joel Assunção','351939607176','Rubberpuntocom@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_4b4bab61_e304_4067_9d99_94ad36488c78','drv_joel_assuncao','Bolt','4b4bab61-e304-4067-9d99-94ad36488c78','173c6e53-e29c-4972-851a-217c24a83851',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_4b4bab61_e304_4067_9d99_94ad36488c78_2026_06_01_2026_07_19','org_daniel_sc','Bolt','drv_joel_assuncao','bolt:4b4bab61-e304-4067-9d99-94ad36488c78:2026-06-01:2026-07-19','Ganhos por motorista-1 jun 2026-19 jul 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2026-06-01','2026-07-19','aggregated_period',
35704,27032,8673,200,30,0,0,1445,100,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Joel Assunção","Email":"Rubberpuntocom@gmail.com","Telemóvel":351939607176,"Ganhos brutos (total)|€":357.04,"Ganhos brutos (pagamentos na app)|€":340.59,"IVA sobre os ganhos brutos (pagamentos na app)|€":16.24,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":2.0,"Ganhos da campanha|€":0.0,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":14.45,"IVA das taxas de cancelamento|€":0.83,"Portagens|€":0.3,"Taxas de reserva|€":1.0,"IVA das taxas de reserva|€":0.06,"Total de taxas|€":86.73,"Comissões|€":86.73,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":270.32,"Pagamento previsto|€":270.32,"Ganhos brutos por hora|€/h":6.72,"Ganhos líquidos por hora|€/h":5.09,"Desconto de comissão (in-app)|€":55.83,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"4b4bab61-e304-4067-9d99-94ad36488c78","Identificador individual":"173c6e53-e29c-4972-851a-217c24a83851"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_marcelo_gomes','Marcelo Gomes','351915021406','blalmeidagomes2611@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_b920cb39_43da_4dc6_a960_a4723d6d9ae0','drv_marcelo_gomes','Bolt','b920cb39-43da-4dc6-a960-a4723d6d9ae0','b8e1e004-e253-42e5-8569-b6a80aa6cc08',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_b920cb39_43da_4dc6_a960_a4723d6d9ae0_2026_06_01_2026_07_19','org_daniel_sc','Bolt','drv_marcelo_gomes','bolt:b920cb39-43da-4dc6-a960-a4723d6d9ae0:2026-06-01:2026-07-19','Ganhos por motorista-1 jun 2026-19 jul 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2026-06-01','2026-07-19','aggregated_period',
28221,21816,6405,0,245,1500,0,350,0,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Marcelo Gomes","Email":"blalmeidagomes2611@gmail.com","Telemóvel":351915021406,"Ganhos brutos (total)|€":282.21,"Ganhos brutos (pagamentos na app)|€":263.71,"IVA sobre os ganhos brutos (pagamentos na app)|€":12.85,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":0.0,"Ganhos da campanha|€":15.0,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":3.5,"IVA das taxas de cancelamento|€":0.2,"Portagens|€":2.45,"Taxas de reserva|€":0.0,"IVA das taxas de reserva|€":0.0,"Total de taxas|€":64.05,"Comissões|€":64.05,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":218.16,"Pagamento previsto|€":218.16,"Ganhos brutos por hora|€/h":13.5,"Ganhos líquidos por hora|€/h":10.44,"Desconto de comissão (in-app)|€":36.77,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"b920cb39-43da-4dc6-a960-a4723d6d9ae0","Identificador individual":"b8e1e004-e253-42e5-8569-b6a80aa6cc08"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_nelson_cassama','Nelson Cassama','351938705937','nelsoncassama02@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_807b1458_ab78_4afd_a09b_a8efe5df1d71','drv_nelson_cassama','Bolt','807b1458-ab78-4afd-a09b-a8efe5df1d71','a9631116-7fd8-410f-b36f-435f018042b0',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_807b1458_ab78_4afd_a09b_a8efe5df1d71_2026_06_01_2026_07_19','org_daniel_sc','Bolt','drv_nelson_cassama','bolt:807b1458-ab78-4afd-a09b-a8efe5df1d71:2026-06-01:2026-07-19','Ganhos por motorista-1 jun 2026-19 jul 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2026-06-01','2026-07-19','aggregated_period',
20995,15875,5120,0,240,0,0,0,0,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Nelson Cassama","Email":"nelsoncassama02@gmail.com","Telemóvel":351938705937,"Ganhos brutos (total)|€":209.95,"Ganhos brutos (pagamentos na app)|€":209.95,"IVA sobre os ganhos brutos (pagamentos na app)|€":10.58,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":0.0,"Ganhos da campanha|€":0.0,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":0.0,"IVA das taxas de cancelamento|€":0.0,"Portagens|€":2.4,"Taxas de reserva|€":0.0,"IVA das taxas de reserva|€":0.0,"Total de taxas|€":51.2,"Comissões|€":51.2,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":158.75,"Pagamento previsto|€":158.75,"Ganhos brutos por hora|€/h":15.1,"Ganhos líquidos por hora|€/h":11.42,"Desconto de comissão (in-app)|€":23.02,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"807b1458-ab78-4afd-a09b-a8efe5df1d71","Identificador individual":"a9631116-7fd8-410f-b36f-435f018042b0"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,phone,email,status,tenant_id,updated_at)
VALUES ('drv_tiago_pinto','Tiago Pinto','351912320731','t1ag0afp737@gmail.com','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=COALESCE(NULLIF(excluded.phone,''),drivers.phone),email=COALESCE(NULLIF(excluded.email,''),drivers.email),tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,external_partner_id,organization_id,platform_status,rating,score,raw_json,updated_at)
VALUES ('bolt_drv_a2e4a08e_08f2_4115_a844_44406caa8785','drv_tiago_pinto','Bolt','a2e4a08e-08f2-4115-a844-44406caa8785','06b81bb8-230f-4d1b-b46c-9b24e18e5f52',NULL,'historical',NULL,NULL,'{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,external_partner_id=excluded.external_partner_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO aggregate_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,granularity,
gross_cents,net_cents,commission_cents,tips_cents,tolls_cents,campaign_cents,reimbursement_cents,cancellation_cents,booking_fee_cents,
trip_count,hours_online,distance_km,acceptance_rate,utilization_rate,completion_rate,rating,raw_json,updated_at)
VALUES ('agg_bolt_a2e4a08e_08f2_4115_a844_44406caa8785_2026_06_01_2026_07_19','org_daniel_sc','Bolt','drv_tiago_pinto','bolt:a2e4a08e-08f2-4115-a844-44406caa8785:2026-06-01:2026-07-19','Ganhos por motorista-1 jun 2026-19 jul 2026-DANIEL SC MEDIAÇÃO DE SEGUROS E SERVIÇOS, LDA.csv','2026-06-01','2026-07-19','aggregated_period',
177885,137394,39992,1100,1945,6810,0,0,500,
0,0.000000,0.000000,NULL,NULL,NULL,NULL,'{"Motorista":"Tiago Pinto","Email":"t1ag0afp737@gmail.com","Telemóvel":351912320731,"Ganhos brutos (total)|€":1778.85,"Ganhos brutos (pagamentos na app)|€":1699.75,"IVA sobre os ganhos brutos (pagamentos na app)|€":82.67,"Ganhos brutos (pagamentos em dinheiro)|€":0.0,"IVA sobre os ganhos brutos (pagamentos em dinheiro)|€":0.0,"Dinheiro recebido|€":0.0,"Gorjetas dos passageiros|€":11.0,"Ganhos da campanha|€":68.1,"Reembolsos de despesas|€":0.0,"Taxas de cancelamento|€":0.0,"IVA das taxas de cancelamento|€":0.0,"Portagens|€":19.45,"Taxas de reserva|€":5.0,"IVA das taxas de reserva|€":0.3,"Total de taxas|€":404.92,"Comissões|€":399.92,"Reembolsos aos passageiros|€":0.0,"Outras taxas|€":0.0,"Ganhos líquidos|€":1373.94,"Pagamento previsto|€":1373.94,"Ganhos brutos por hora|€/h":12.12,"Ganhos líquidos por hora|€/h":9.36,"Desconto de comissão (in-app)|€":240.47,"Desconto da comissão (dinheiro)|€":0.0,"Identificador do motorista":"a2e4a08e-08f2-4115-a844-44406caa8785","Identificador individual":"06b81bb8-230f-4d1b-b46c-9b24e18e5f52"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,gross_cents=excluded.gross_cents,net_cents=excluded.net_cents,commission_cents=excluded.commission_cents,
tips_cents=excluded.tips_cents,tolls_cents=excluded.tolls_cents,campaign_cents=excluded.campaign_cents,reimbursement_cents=excluded.reimbursement_cents,
cancellation_cents=excluded.cancellation_cents,booking_fee_cents=excluded.booking_fee_cents,trip_count=excluded.trip_count,hours_online=excluded.hours_online,
distance_km=excluded.distance_km,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

UPDATE driver_platform_accounts SET platform_status='active',rating=5.0,score=97.0,updated_at=CURRENT_TIMESTAMP
WHERE platform='Bolt' AND external_driver_id='7eb9a048-d4a7-428b-a08b-d69328b49442';

UPDATE driver_platform_accounts SET platform_status='active',rating=0.0,score=90.0,updated_at=CURRENT_TIMESTAMP
WHERE platform='Bolt' AND external_driver_id='4b4bab61-e304-4067-9d99-94ad36488c78';

UPDATE driver_platform_accounts SET platform_status='active',rating=5.0,score=91.0,updated_at=CURRENT_TIMESTAMP
WHERE platform='Bolt' AND external_driver_id='b920cb39-43da-4dc6-a960-a4723d6d9ae0';

UPDATE driver_platform_accounts SET platform_status='active',rating=4.75,score=88.0,updated_at=CURRENT_TIMESTAMP
WHERE platform='Bolt' AND external_driver_id='a2e4a08e-08f2-4115-a844-44406caa8785';

INSERT INTO drivers (id,name,status,tenant_id,updated_at)
VALUES ('drv_daniel_silva','Daniel Silva','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,organization_id,platform_status,raw_json,updated_at)
VALUES ('uber_drv_5026f4bb_7442_437a_8016_a3f5247e5bf6','drv_daniel_silva','Uber','5026f4bb-7442-437a-8016-a3f5247e5bf6',NULL,'active','{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,platform_status='active',updated_at=CURRENT_TIMESTAMP;

INSERT INTO activity_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,trip_count,hours_online,hours_on_trip,raw_json,updated_at)
VALUES ('act_uber_5026f4bb_7442_437a_8016_a3f5247e5bf6_2026_06_15_2026_07_13','org_daniel_sc','Uber','drv_daniel_silva','uber:5026f4bb-7442-437a-8016-a3f5247e5bf6:2026-06-15:2026-07-13','20260615-20260713-driver_activity-DANIEL_SC_MEDIAO_DE_SEGUROS_E_SERVIOS_LDA.csv',
'2026-06-15','2026-07-13',125,57.533333,32.716667,'{"UUID do motorista":"5026f4bb-7442-437a-8016-a3f5247e5bf6","Nome próprio do motorista":"DANIEL JOSE","Apelido do motorista":"SANTOS SILVA","Viagens concluídas":125,"Tempo online (dias: horas: minutos)":"02:09:32","Tempo em viagem (dias: horas: minutos)":"01:08:43"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,trip_count=excluded.trip_count,hours_online=excluded.hours_online,hours_on_trip=excluded.hours_on_trip,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,status,tenant_id,updated_at)
VALUES ('drv_joel_assuncao','Joel Assunção','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,organization_id,platform_status,raw_json,updated_at)
VALUES ('uber_drv_1de3ed19_7e46_4195_92af_1ef335166af4','drv_joel_assuncao','Uber','1de3ed19-7e46-4195-92af-1ef335166af4',NULL,'active','{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,platform_status='active',updated_at=CURRENT_TIMESTAMP;

INSERT INTO activity_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,trip_count,hours_online,hours_on_trip,raw_json,updated_at)
VALUES ('act_uber_1de3ed19_7e46_4195_92af_1ef335166af4_2026_06_15_2026_07_13','org_daniel_sc','Uber','drv_joel_assuncao','uber:1de3ed19-7e46-4195-92af-1ef335166af4:2026-06-15:2026-07-13','20260615-20260713-driver_activity-DANIEL_SC_MEDIAO_DE_SEGUROS_E_SERVIOS_LDA.csv',
'2026-06-15','2026-07-13',173,64.150000,24.266667,'{"UUID do motorista":"1de3ed19-7e46-4195-92af-1ef335166af4","Nome próprio do motorista":"joel","Apelido do motorista":"assuncao","Viagens concluídas":173,"Tempo online (dias: horas: minutos)":"02:16:09","Tempo em viagem (dias: horas: minutos)":"01:00:16"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,trip_count=excluded.trip_count,hours_online=excluded.hours_online,hours_on_trip=excluded.hours_on_trip,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,status,tenant_id,updated_at)
VALUES ('drv_julio_jardim','Júlio Jardim','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,organization_id,platform_status,raw_json,updated_at)
VALUES ('uber_drv_3ff60261_eb15_4d6a_bf44_b5a690154db7','drv_julio_jardim','Uber','3ff60261-eb15-4d6a-bf44-b5a690154db7',NULL,'active','{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,platform_status='active',updated_at=CURRENT_TIMESTAMP;

INSERT INTO activity_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,trip_count,hours_online,hours_on_trip,raw_json,updated_at)
VALUES ('act_uber_3ff60261_eb15_4d6a_bf44_b5a690154db7_2026_06_15_2026_07_13','org_daniel_sc','Uber','drv_julio_jardim','uber:3ff60261-eb15-4d6a-bf44-b5a690154db7:2026-06-15:2026-07-13','20260615-20260713-driver_activity-DANIEL_SC_MEDIAO_DE_SEGUROS_E_SERVIOS_LDA.csv',
'2026-06-15','2026-07-13',412,120.733333,56.816667,'{"UUID do motorista":"3ff60261-eb15-4d6a-bf44-b5a690154db7","Nome próprio do motorista":"JULIO","Apelido do motorista":"JARDIM","Viagens concluídas":412,"Tempo online (dias: horas: minutos)":"05:00:44","Tempo em viagem (dias: horas: minutos)":"02:08:49"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,trip_count=excluded.trip_count,hours_online=excluded.hours_online,hours_on_trip=excluded.hours_on_trip,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,status,tenant_id,updated_at)
VALUES ('drv_viviana_reis','Viviana Reis','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,organization_id,platform_status,raw_json,updated_at)
VALUES ('uber_drv_5033f94b_7849_4c88_909c_bad602a80d69','drv_viviana_reis','Uber','5033f94b-7849-4c88-909c-bad602a80d69',NULL,'active','{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,platform_status='active',updated_at=CURRENT_TIMESTAMP;

INSERT INTO activity_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,trip_count,hours_online,hours_on_trip,raw_json,updated_at)
VALUES ('act_uber_5033f94b_7849_4c88_909c_bad602a80d69_2026_06_15_2026_07_13','org_daniel_sc','Uber','drv_viviana_reis','uber:5033f94b-7849-4c88-909c-bad602a80d69:2026-06-15:2026-07-13','20260615-20260713-driver_activity-DANIEL_SC_MEDIAO_DE_SEGUROS_E_SERVIOS_LDA.csv',
'2026-06-15','2026-07-13',38,22.250000,10.200000,'{"UUID do motorista":"5033f94b-7849-4c88-909c-bad602a80d69","Nome próprio do motorista":"VIVIANA","Apelido do motorista":"SOARES REIS","Viagens concluídas":38,"Tempo online (dias: horas: minutos)":"00:22:15","Tempo em viagem (dias: horas: minutos)":"00:10:12"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,trip_count=excluded.trip_count,hours_online=excluded.hours_online,hours_on_trip=excluded.hours_on_trip,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,status,tenant_id,updated_at)
VALUES ('drv_tiago_pinto','Tiago Pinto','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,organization_id,platform_status,raw_json,updated_at)
VALUES ('uber_drv_64b6a744_8e9c_4f11_9e16_a584223f3c1b','drv_tiago_pinto','Uber','64b6a744-8e9c-4f11-9e16-a584223f3c1b',NULL,'active','{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,platform_status='active',updated_at=CURRENT_TIMESTAMP;

INSERT INTO activity_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,trip_count,hours_online,hours_on_trip,raw_json,updated_at)
VALUES ('act_uber_64b6a744_8e9c_4f11_9e16_a584223f3c1b_2026_06_15_2026_07_13','org_daniel_sc','Uber','drv_tiago_pinto','uber:64b6a744-8e9c-4f11-9e16-a584223f3c1b:2026-06-15:2026-07-13','20260615-20260713-driver_activity-DANIEL_SC_MEDIAO_DE_SEGUROS_E_SERVIOS_LDA.csv',
'2026-06-15','2026-07-13',186,129.533333,69.966667,'{"UUID do motorista":"64b6a744-8e9c-4f11-9e16-a584223f3c1b","Nome próprio do motorista":"TIAGO ALEXANDRE","Apelido do motorista":"FERREIRA PINTO","Viagens concluídas":186,"Tempo online (dias: horas: minutos)":"05:09:32","Tempo em viagem (dias: horas: minutos)":"02:21:58"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,trip_count=excluded.trip_count,hours_online=excluded.hours_online,hours_on_trip=excluded.hours_on_trip,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,status,tenant_id,updated_at)
VALUES ('drv_marcelo_gomes','Marcelo Gomes','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,organization_id,platform_status,raw_json,updated_at)
VALUES ('uber_drv_d680dc71_c245_428c_ac90_c3323ab4585f','drv_marcelo_gomes','Uber','d680dc71-c245-428c-ac90-c3323ab4585f',NULL,'active','{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,platform_status='active',updated_at=CURRENT_TIMESTAMP;

INSERT INTO activity_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,trip_count,hours_online,hours_on_trip,raw_json,updated_at)
VALUES ('act_uber_d680dc71_c245_428c_ac90_c3323ab4585f_2026_06_15_2026_07_13','org_daniel_sc','Uber','drv_marcelo_gomes','uber:d680dc71-c245-428c-ac90-c3323ab4585f:2026-06-15:2026-07-13','20260615-20260713-driver_activity-DANIEL_SC_MEDIAO_DE_SEGUROS_E_SERVIOS_LDA.csv',
'2026-06-15','2026-07-13',150,87.750000,46.283333,'{"UUID do motorista":"d680dc71-c245-428c-ac90-c3323ab4585f","Nome próprio do motorista":"MARCELO","Apelido do motorista":"DE ALMEIDA GOMES","Viagens concluídas":150,"Tempo online (dias: horas: minutos)":"03:15:45","Tempo em viagem (dias: horas: minutos)":"01:22:17"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,trip_count=excluded.trip_count,hours_online=excluded.hours_online,hours_on_trip=excluded.hours_on_trip,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;

INSERT INTO drivers (id,name,status,tenant_id,updated_at)
VALUES ('drv_anubis_ribeiro','Anúbis Ribeiro','active','org_daniel_sc',CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,tenant_id='org_daniel_sc',updated_at=CURRENT_TIMESTAMP;

INSERT INTO driver_platform_accounts
(id,driver_id,platform,external_driver_id,organization_id,platform_status,raw_json,updated_at)
VALUES ('uber_drv_96cb2228_a731_4f4d_88ef_b382df2f8c82','drv_anubis_ribeiro','Uber','96cb2228-a731-4f4d-88ef-b382df2f8c82',NULL,'active','{"source":"csv_seed"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_driver_id) DO UPDATE SET driver_id=excluded.driver_id,platform_status='active',updated_at=CURRENT_TIMESTAMP;

INSERT INTO activity_driver_periods
(id,organization_id,platform,driver_id,external_id,source_name,period_start,period_end,trip_count,hours_online,hours_on_trip,raw_json,updated_at)
VALUES ('act_uber_96cb2228_a731_4f4d_88ef_b382df2f8c82_2026_06_15_2026_07_13','org_daniel_sc','Uber','drv_anubis_ribeiro','uber:96cb2228-a731-4f4d-88ef-b382df2f8c82:2026-06-15:2026-07-13','20260615-20260713-driver_activity-DANIEL_SC_MEDIAO_DE_SEGUROS_E_SERVIOS_LDA.csv',
'2026-06-15','2026-07-13',36,11.800000,7.800000,'{"UUID do motorista":"96cb2228-a731-4f4d-88ef-b382df2f8c82","Nome próprio do motorista":"Anúbis","Apelido do motorista":"Ribeiro","Viagens concluídas":36,"Tempo online (dias: horas: minutos)":"00:11:48","Tempo em viagem (dias: horas: minutos)":"00:07:48"}',CURRENT_TIMESTAMP)
ON CONFLICT(platform,external_id,period_start,period_end) DO UPDATE SET
driver_id=excluded.driver_id,trip_count=excluded.trip_count,hours_online=excluded.hours_online,hours_on_trip=excluded.hours_on_trip,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP;


-- Consolidação de registos anteriores nos identificadores canónicos, preservando regras e acertos.
UPDATE financial_entries SET driver_id='drv_daniel_silva' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_daniel_silva' AND (LOWER(name)=LOWER('Daniel Silva') OR LOWER(name)=LOWER('DANIEL JOSE SANTOS SILVA') OR LOWER(COALESCE(email,''))=LOWER('danisilvatvde@gmail.com')));
UPDATE settlement_adjustments SET driver_id='drv_daniel_silva' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_daniel_silva' AND (LOWER(name)=LOWER('Daniel Silva') OR LOWER(name)=LOWER('DANIEL JOSE SANTOS SILVA') OR LOWER(COALESCE(email,''))=LOWER('danisilvatvde@gmail.com')));
UPDATE privacy_consents SET driver_id='drv_daniel_silva' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_daniel_silva' AND (LOWER(name)=LOWER('Daniel Silva') OR LOWER(name)=LOWER('DANIEL JOSE SANTOS SILVA') OR LOWER(COALESCE(email,''))=LOWER('danisilvatvde@gmail.com')));
UPDATE data_deletion_requests SET driver_id='drv_daniel_silva' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_daniel_silva' AND (LOWER(name)=LOWER('Daniel Silva') OR LOWER(name)=LOWER('DANIEL JOSE SANTOS SILVA') OR LOWER(COALESCE(email,''))=LOWER('danisilvatvde@gmail.com')));
UPDATE vehicles SET current_driver_id='drv_daniel_silva' WHERE current_driver_id IN (SELECT id FROM drivers WHERE id<>'drv_daniel_silva' AND (LOWER(name)=LOWER('Daniel Silva') OR LOWER(name)=LOWER('DANIEL JOSE SANTOS SILVA') OR LOWER(COALESCE(email,''))=LOWER('danisilvatvde@gmail.com')));
UPDATE settlement_rules SET driver_id='drv_daniel_silva' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_daniel_silva' AND (LOWER(name)=LOWER('Daniel Silva') OR LOWER(name)=LOWER('DANIEL JOSE SANTOS SILVA') OR LOWER(COALESCE(email,''))=LOWER('danisilvatvde@gmail.com'))) AND NOT EXISTS (SELECT 1 FROM settlement_rules WHERE driver_id='drv_daniel_silva');
DELETE FROM settlement_rules WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_daniel_silva' AND (LOWER(name)=LOWER('Daniel Silva') OR LOWER(name)=LOWER('DANIEL JOSE SANTOS SILVA') OR LOWER(COALESCE(email,''))=LOWER('danisilvatvde@gmail.com')));
DELETE FROM weekly_settlements WHERE driver_id='drv_daniel_silva' AND week_start IN (SELECT week_start FROM weekly_settlements WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_daniel_silva' AND (LOWER(name)=LOWER('Daniel Silva') OR LOWER(name)=LOWER('DANIEL JOSE SANTOS SILVA') OR LOWER(COALESCE(email,''))=LOWER('danisilvatvde@gmail.com'))));
UPDATE weekly_settlements SET driver_id='drv_daniel_silva' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_daniel_silva' AND (LOWER(name)=LOWER('Daniel Silva') OR LOWER(name)=LOWER('DANIEL JOSE SANTOS SILVA') OR LOWER(COALESCE(email,''))=LOWER('danisilvatvde@gmail.com')));
DELETE FROM settlement_week_overrides WHERE driver_id='drv_daniel_silva' AND week_start IN (SELECT week_start FROM settlement_week_overrides WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_daniel_silva' AND (LOWER(name)=LOWER('Daniel Silva') OR LOWER(name)=LOWER('DANIEL JOSE SANTOS SILVA') OR LOWER(COALESCE(email,''))=LOWER('danisilvatvde@gmail.com'))));
UPDATE settlement_week_overrides SET driver_id='drv_daniel_silva' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_daniel_silva' AND (LOWER(name)=LOWER('Daniel Silva') OR LOWER(name)=LOWER('DANIEL JOSE SANTOS SILVA') OR LOWER(COALESCE(email,''))=LOWER('danisilvatvde@gmail.com')));
UPDATE drivers SET status='merged',updated_at=CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM drivers WHERE id<>'drv_daniel_silva' AND (LOWER(name)=LOWER('Daniel Silva') OR LOWER(name)=LOWER('DANIEL JOSE SANTOS SILVA') OR LOWER(COALESCE(email,''))=LOWER('danisilvatvde@gmail.com')));
UPDATE financial_entries SET driver_id='drv_tiago_pinto' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_tiago_pinto' AND (LOWER(name)=LOWER('Tiago Pinto') OR LOWER(name)=LOWER('TIAGO ALEXANDRE FERREIRA PINTO') OR LOWER(COALESCE(email,''))=LOWER('t1ag0afp737@gmail.com')));
UPDATE settlement_adjustments SET driver_id='drv_tiago_pinto' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_tiago_pinto' AND (LOWER(name)=LOWER('Tiago Pinto') OR LOWER(name)=LOWER('TIAGO ALEXANDRE FERREIRA PINTO') OR LOWER(COALESCE(email,''))=LOWER('t1ag0afp737@gmail.com')));
UPDATE privacy_consents SET driver_id='drv_tiago_pinto' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_tiago_pinto' AND (LOWER(name)=LOWER('Tiago Pinto') OR LOWER(name)=LOWER('TIAGO ALEXANDRE FERREIRA PINTO') OR LOWER(COALESCE(email,''))=LOWER('t1ag0afp737@gmail.com')));
UPDATE data_deletion_requests SET driver_id='drv_tiago_pinto' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_tiago_pinto' AND (LOWER(name)=LOWER('Tiago Pinto') OR LOWER(name)=LOWER('TIAGO ALEXANDRE FERREIRA PINTO') OR LOWER(COALESCE(email,''))=LOWER('t1ag0afp737@gmail.com')));
UPDATE vehicles SET current_driver_id='drv_tiago_pinto' WHERE current_driver_id IN (SELECT id FROM drivers WHERE id<>'drv_tiago_pinto' AND (LOWER(name)=LOWER('Tiago Pinto') OR LOWER(name)=LOWER('TIAGO ALEXANDRE FERREIRA PINTO') OR LOWER(COALESCE(email,''))=LOWER('t1ag0afp737@gmail.com')));
UPDATE settlement_rules SET driver_id='drv_tiago_pinto' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_tiago_pinto' AND (LOWER(name)=LOWER('Tiago Pinto') OR LOWER(name)=LOWER('TIAGO ALEXANDRE FERREIRA PINTO') OR LOWER(COALESCE(email,''))=LOWER('t1ag0afp737@gmail.com'))) AND NOT EXISTS (SELECT 1 FROM settlement_rules WHERE driver_id='drv_tiago_pinto');
DELETE FROM settlement_rules WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_tiago_pinto' AND (LOWER(name)=LOWER('Tiago Pinto') OR LOWER(name)=LOWER('TIAGO ALEXANDRE FERREIRA PINTO') OR LOWER(COALESCE(email,''))=LOWER('t1ag0afp737@gmail.com')));
DELETE FROM weekly_settlements WHERE driver_id='drv_tiago_pinto' AND week_start IN (SELECT week_start FROM weekly_settlements WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_tiago_pinto' AND (LOWER(name)=LOWER('Tiago Pinto') OR LOWER(name)=LOWER('TIAGO ALEXANDRE FERREIRA PINTO') OR LOWER(COALESCE(email,''))=LOWER('t1ag0afp737@gmail.com'))));
UPDATE weekly_settlements SET driver_id='drv_tiago_pinto' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_tiago_pinto' AND (LOWER(name)=LOWER('Tiago Pinto') OR LOWER(name)=LOWER('TIAGO ALEXANDRE FERREIRA PINTO') OR LOWER(COALESCE(email,''))=LOWER('t1ag0afp737@gmail.com')));
DELETE FROM settlement_week_overrides WHERE driver_id='drv_tiago_pinto' AND week_start IN (SELECT week_start FROM settlement_week_overrides WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_tiago_pinto' AND (LOWER(name)=LOWER('Tiago Pinto') OR LOWER(name)=LOWER('TIAGO ALEXANDRE FERREIRA PINTO') OR LOWER(COALESCE(email,''))=LOWER('t1ag0afp737@gmail.com'))));
UPDATE settlement_week_overrides SET driver_id='drv_tiago_pinto' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_tiago_pinto' AND (LOWER(name)=LOWER('Tiago Pinto') OR LOWER(name)=LOWER('TIAGO ALEXANDRE FERREIRA PINTO') OR LOWER(COALESCE(email,''))=LOWER('t1ag0afp737@gmail.com')));
UPDATE drivers SET status='merged',updated_at=CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM drivers WHERE id<>'drv_tiago_pinto' AND (LOWER(name)=LOWER('Tiago Pinto') OR LOWER(name)=LOWER('TIAGO ALEXANDRE FERREIRA PINTO') OR LOWER(COALESCE(email,''))=LOWER('t1ag0afp737@gmail.com')));
UPDATE financial_entries SET driver_id='drv_joel_assuncao' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_joel_assuncao' AND (LOWER(name)=LOWER('Joel Assunção') OR LOWER(name)=LOWER('joel assuncao') OR LOWER(COALESCE(email,''))=LOWER('Rubberpuntocom@gmail.com')));
UPDATE settlement_adjustments SET driver_id='drv_joel_assuncao' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_joel_assuncao' AND (LOWER(name)=LOWER('Joel Assunção') OR LOWER(name)=LOWER('joel assuncao') OR LOWER(COALESCE(email,''))=LOWER('Rubberpuntocom@gmail.com')));
UPDATE privacy_consents SET driver_id='drv_joel_assuncao' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_joel_assuncao' AND (LOWER(name)=LOWER('Joel Assunção') OR LOWER(name)=LOWER('joel assuncao') OR LOWER(COALESCE(email,''))=LOWER('Rubberpuntocom@gmail.com')));
UPDATE data_deletion_requests SET driver_id='drv_joel_assuncao' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_joel_assuncao' AND (LOWER(name)=LOWER('Joel Assunção') OR LOWER(name)=LOWER('joel assuncao') OR LOWER(COALESCE(email,''))=LOWER('Rubberpuntocom@gmail.com')));
UPDATE vehicles SET current_driver_id='drv_joel_assuncao' WHERE current_driver_id IN (SELECT id FROM drivers WHERE id<>'drv_joel_assuncao' AND (LOWER(name)=LOWER('Joel Assunção') OR LOWER(name)=LOWER('joel assuncao') OR LOWER(COALESCE(email,''))=LOWER('Rubberpuntocom@gmail.com')));
UPDATE settlement_rules SET driver_id='drv_joel_assuncao' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_joel_assuncao' AND (LOWER(name)=LOWER('Joel Assunção') OR LOWER(name)=LOWER('joel assuncao') OR LOWER(COALESCE(email,''))=LOWER('Rubberpuntocom@gmail.com'))) AND NOT EXISTS (SELECT 1 FROM settlement_rules WHERE driver_id='drv_joel_assuncao');
DELETE FROM settlement_rules WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_joel_assuncao' AND (LOWER(name)=LOWER('Joel Assunção') OR LOWER(name)=LOWER('joel assuncao') OR LOWER(COALESCE(email,''))=LOWER('Rubberpuntocom@gmail.com')));
DELETE FROM weekly_settlements WHERE driver_id='drv_joel_assuncao' AND week_start IN (SELECT week_start FROM weekly_settlements WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_joel_assuncao' AND (LOWER(name)=LOWER('Joel Assunção') OR LOWER(name)=LOWER('joel assuncao') OR LOWER(COALESCE(email,''))=LOWER('Rubberpuntocom@gmail.com'))));
UPDATE weekly_settlements SET driver_id='drv_joel_assuncao' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_joel_assuncao' AND (LOWER(name)=LOWER('Joel Assunção') OR LOWER(name)=LOWER('joel assuncao') OR LOWER(COALESCE(email,''))=LOWER('Rubberpuntocom@gmail.com')));
DELETE FROM settlement_week_overrides WHERE driver_id='drv_joel_assuncao' AND week_start IN (SELECT week_start FROM settlement_week_overrides WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_joel_assuncao' AND (LOWER(name)=LOWER('Joel Assunção') OR LOWER(name)=LOWER('joel assuncao') OR LOWER(COALESCE(email,''))=LOWER('Rubberpuntocom@gmail.com'))));
UPDATE settlement_week_overrides SET driver_id='drv_joel_assuncao' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_joel_assuncao' AND (LOWER(name)=LOWER('Joel Assunção') OR LOWER(name)=LOWER('joel assuncao') OR LOWER(COALESCE(email,''))=LOWER('Rubberpuntocom@gmail.com')));
UPDATE drivers SET status='merged',updated_at=CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM drivers WHERE id<>'drv_joel_assuncao' AND (LOWER(name)=LOWER('Joel Assunção') OR LOWER(name)=LOWER('joel assuncao') OR LOWER(COALESCE(email,''))=LOWER('Rubberpuntocom@gmail.com')));
UPDATE financial_entries SET driver_id='drv_marcelo_gomes' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_marcelo_gomes' AND (LOWER(name)=LOWER('Marcelo Gomes') OR LOWER(name)=LOWER('MARCELO DE ALMEIDA GOMES') OR LOWER(COALESCE(email,''))=LOWER('blalmeidagomes2611@gmail.com')));
UPDATE settlement_adjustments SET driver_id='drv_marcelo_gomes' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_marcelo_gomes' AND (LOWER(name)=LOWER('Marcelo Gomes') OR LOWER(name)=LOWER('MARCELO DE ALMEIDA GOMES') OR LOWER(COALESCE(email,''))=LOWER('blalmeidagomes2611@gmail.com')));
UPDATE privacy_consents SET driver_id='drv_marcelo_gomes' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_marcelo_gomes' AND (LOWER(name)=LOWER('Marcelo Gomes') OR LOWER(name)=LOWER('MARCELO DE ALMEIDA GOMES') OR LOWER(COALESCE(email,''))=LOWER('blalmeidagomes2611@gmail.com')));
UPDATE data_deletion_requests SET driver_id='drv_marcelo_gomes' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_marcelo_gomes' AND (LOWER(name)=LOWER('Marcelo Gomes') OR LOWER(name)=LOWER('MARCELO DE ALMEIDA GOMES') OR LOWER(COALESCE(email,''))=LOWER('blalmeidagomes2611@gmail.com')));
UPDATE vehicles SET current_driver_id='drv_marcelo_gomes' WHERE current_driver_id IN (SELECT id FROM drivers WHERE id<>'drv_marcelo_gomes' AND (LOWER(name)=LOWER('Marcelo Gomes') OR LOWER(name)=LOWER('MARCELO DE ALMEIDA GOMES') OR LOWER(COALESCE(email,''))=LOWER('blalmeidagomes2611@gmail.com')));
UPDATE settlement_rules SET driver_id='drv_marcelo_gomes' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_marcelo_gomes' AND (LOWER(name)=LOWER('Marcelo Gomes') OR LOWER(name)=LOWER('MARCELO DE ALMEIDA GOMES') OR LOWER(COALESCE(email,''))=LOWER('blalmeidagomes2611@gmail.com'))) AND NOT EXISTS (SELECT 1 FROM settlement_rules WHERE driver_id='drv_marcelo_gomes');
DELETE FROM settlement_rules WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_marcelo_gomes' AND (LOWER(name)=LOWER('Marcelo Gomes') OR LOWER(name)=LOWER('MARCELO DE ALMEIDA GOMES') OR LOWER(COALESCE(email,''))=LOWER('blalmeidagomes2611@gmail.com')));
DELETE FROM weekly_settlements WHERE driver_id='drv_marcelo_gomes' AND week_start IN (SELECT week_start FROM weekly_settlements WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_marcelo_gomes' AND (LOWER(name)=LOWER('Marcelo Gomes') OR LOWER(name)=LOWER('MARCELO DE ALMEIDA GOMES') OR LOWER(COALESCE(email,''))=LOWER('blalmeidagomes2611@gmail.com'))));
UPDATE weekly_settlements SET driver_id='drv_marcelo_gomes' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_marcelo_gomes' AND (LOWER(name)=LOWER('Marcelo Gomes') OR LOWER(name)=LOWER('MARCELO DE ALMEIDA GOMES') OR LOWER(COALESCE(email,''))=LOWER('blalmeidagomes2611@gmail.com')));
DELETE FROM settlement_week_overrides WHERE driver_id='drv_marcelo_gomes' AND week_start IN (SELECT week_start FROM settlement_week_overrides WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_marcelo_gomes' AND (LOWER(name)=LOWER('Marcelo Gomes') OR LOWER(name)=LOWER('MARCELO DE ALMEIDA GOMES') OR LOWER(COALESCE(email,''))=LOWER('blalmeidagomes2611@gmail.com'))));
UPDATE settlement_week_overrides SET driver_id='drv_marcelo_gomes' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_marcelo_gomes' AND (LOWER(name)=LOWER('Marcelo Gomes') OR LOWER(name)=LOWER('MARCELO DE ALMEIDA GOMES') OR LOWER(COALESCE(email,''))=LOWER('blalmeidagomes2611@gmail.com')));
UPDATE drivers SET status='merged',updated_at=CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM drivers WHERE id<>'drv_marcelo_gomes' AND (LOWER(name)=LOWER('Marcelo Gomes') OR LOWER(name)=LOWER('MARCELO DE ALMEIDA GOMES') OR LOWER(COALESCE(email,''))=LOWER('blalmeidagomes2611@gmail.com')));
UPDATE financial_entries SET driver_id='drv_viviana_reis' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_viviana_reis' AND (LOWER(name)=LOWER('Viviana Reis') OR LOWER(name)=LOWER('VIVIANA SOARES REIS') OR LOWER(COALESCE(email,''))=LOWER('vivianasreistvde@gmail.com')));
UPDATE settlement_adjustments SET driver_id='drv_viviana_reis' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_viviana_reis' AND (LOWER(name)=LOWER('Viviana Reis') OR LOWER(name)=LOWER('VIVIANA SOARES REIS') OR LOWER(COALESCE(email,''))=LOWER('vivianasreistvde@gmail.com')));
UPDATE privacy_consents SET driver_id='drv_viviana_reis' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_viviana_reis' AND (LOWER(name)=LOWER('Viviana Reis') OR LOWER(name)=LOWER('VIVIANA SOARES REIS') OR LOWER(COALESCE(email,''))=LOWER('vivianasreistvde@gmail.com')));
UPDATE data_deletion_requests SET driver_id='drv_viviana_reis' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_viviana_reis' AND (LOWER(name)=LOWER('Viviana Reis') OR LOWER(name)=LOWER('VIVIANA SOARES REIS') OR LOWER(COALESCE(email,''))=LOWER('vivianasreistvde@gmail.com')));
UPDATE vehicles SET current_driver_id='drv_viviana_reis' WHERE current_driver_id IN (SELECT id FROM drivers WHERE id<>'drv_viviana_reis' AND (LOWER(name)=LOWER('Viviana Reis') OR LOWER(name)=LOWER('VIVIANA SOARES REIS') OR LOWER(COALESCE(email,''))=LOWER('vivianasreistvde@gmail.com')));
UPDATE settlement_rules SET driver_id='drv_viviana_reis' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_viviana_reis' AND (LOWER(name)=LOWER('Viviana Reis') OR LOWER(name)=LOWER('VIVIANA SOARES REIS') OR LOWER(COALESCE(email,''))=LOWER('vivianasreistvde@gmail.com'))) AND NOT EXISTS (SELECT 1 FROM settlement_rules WHERE driver_id='drv_viviana_reis');
DELETE FROM settlement_rules WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_viviana_reis' AND (LOWER(name)=LOWER('Viviana Reis') OR LOWER(name)=LOWER('VIVIANA SOARES REIS') OR LOWER(COALESCE(email,''))=LOWER('vivianasreistvde@gmail.com')));
DELETE FROM weekly_settlements WHERE driver_id='drv_viviana_reis' AND week_start IN (SELECT week_start FROM weekly_settlements WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_viviana_reis' AND (LOWER(name)=LOWER('Viviana Reis') OR LOWER(name)=LOWER('VIVIANA SOARES REIS') OR LOWER(COALESCE(email,''))=LOWER('vivianasreistvde@gmail.com'))));
UPDATE weekly_settlements SET driver_id='drv_viviana_reis' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_viviana_reis' AND (LOWER(name)=LOWER('Viviana Reis') OR LOWER(name)=LOWER('VIVIANA SOARES REIS') OR LOWER(COALESCE(email,''))=LOWER('vivianasreistvde@gmail.com')));
DELETE FROM settlement_week_overrides WHERE driver_id='drv_viviana_reis' AND week_start IN (SELECT week_start FROM settlement_week_overrides WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_viviana_reis' AND (LOWER(name)=LOWER('Viviana Reis') OR LOWER(name)=LOWER('VIVIANA SOARES REIS') OR LOWER(COALESCE(email,''))=LOWER('vivianasreistvde@gmail.com'))));
UPDATE settlement_week_overrides SET driver_id='drv_viviana_reis' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_viviana_reis' AND (LOWER(name)=LOWER('Viviana Reis') OR LOWER(name)=LOWER('VIVIANA SOARES REIS') OR LOWER(COALESCE(email,''))=LOWER('vivianasreistvde@gmail.com')));
UPDATE drivers SET status='merged',updated_at=CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM drivers WHERE id<>'drv_viviana_reis' AND (LOWER(name)=LOWER('Viviana Reis') OR LOWER(name)=LOWER('VIVIANA SOARES REIS') OR LOWER(COALESCE(email,''))=LOWER('vivianasreistvde@gmail.com')));
UPDATE financial_entries SET driver_id='drv_julio_jardim' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_julio_jardim' AND (LOWER(name)=LOWER('Júlio Jardim') OR LOWER(name)=LOWER('JULIO JARDIM')));
UPDATE settlement_adjustments SET driver_id='drv_julio_jardim' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_julio_jardim' AND (LOWER(name)=LOWER('Júlio Jardim') OR LOWER(name)=LOWER('JULIO JARDIM')));
UPDATE privacy_consents SET driver_id='drv_julio_jardim' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_julio_jardim' AND (LOWER(name)=LOWER('Júlio Jardim') OR LOWER(name)=LOWER('JULIO JARDIM')));
UPDATE data_deletion_requests SET driver_id='drv_julio_jardim' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_julio_jardim' AND (LOWER(name)=LOWER('Júlio Jardim') OR LOWER(name)=LOWER('JULIO JARDIM')));
UPDATE vehicles SET current_driver_id='drv_julio_jardim' WHERE current_driver_id IN (SELECT id FROM drivers WHERE id<>'drv_julio_jardim' AND (LOWER(name)=LOWER('Júlio Jardim') OR LOWER(name)=LOWER('JULIO JARDIM')));
UPDATE settlement_rules SET driver_id='drv_julio_jardim' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_julio_jardim' AND (LOWER(name)=LOWER('Júlio Jardim') OR LOWER(name)=LOWER('JULIO JARDIM'))) AND NOT EXISTS (SELECT 1 FROM settlement_rules WHERE driver_id='drv_julio_jardim');
DELETE FROM settlement_rules WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_julio_jardim' AND (LOWER(name)=LOWER('Júlio Jardim') OR LOWER(name)=LOWER('JULIO JARDIM')));
DELETE FROM weekly_settlements WHERE driver_id='drv_julio_jardim' AND week_start IN (SELECT week_start FROM weekly_settlements WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_julio_jardim' AND (LOWER(name)=LOWER('Júlio Jardim') OR LOWER(name)=LOWER('JULIO JARDIM'))));
UPDATE weekly_settlements SET driver_id='drv_julio_jardim' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_julio_jardim' AND (LOWER(name)=LOWER('Júlio Jardim') OR LOWER(name)=LOWER('JULIO JARDIM')));
DELETE FROM settlement_week_overrides WHERE driver_id='drv_julio_jardim' AND week_start IN (SELECT week_start FROM settlement_week_overrides WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_julio_jardim' AND (LOWER(name)=LOWER('Júlio Jardim') OR LOWER(name)=LOWER('JULIO JARDIM'))));
UPDATE settlement_week_overrides SET driver_id='drv_julio_jardim' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_julio_jardim' AND (LOWER(name)=LOWER('Júlio Jardim') OR LOWER(name)=LOWER('JULIO JARDIM')));
UPDATE drivers SET status='merged',updated_at=CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM drivers WHERE id<>'drv_julio_jardim' AND (LOWER(name)=LOWER('Júlio Jardim') OR LOWER(name)=LOWER('JULIO JARDIM')));
UPDATE financial_entries SET driver_id='drv_anubis_ribeiro' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_anubis_ribeiro' AND (LOWER(name)=LOWER('Anúbis Ribeiro')));
UPDATE settlement_adjustments SET driver_id='drv_anubis_ribeiro' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_anubis_ribeiro' AND (LOWER(name)=LOWER('Anúbis Ribeiro')));
UPDATE privacy_consents SET driver_id='drv_anubis_ribeiro' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_anubis_ribeiro' AND (LOWER(name)=LOWER('Anúbis Ribeiro')));
UPDATE data_deletion_requests SET driver_id='drv_anubis_ribeiro' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_anubis_ribeiro' AND (LOWER(name)=LOWER('Anúbis Ribeiro')));
UPDATE vehicles SET current_driver_id='drv_anubis_ribeiro' WHERE current_driver_id IN (SELECT id FROM drivers WHERE id<>'drv_anubis_ribeiro' AND (LOWER(name)=LOWER('Anúbis Ribeiro')));
UPDATE settlement_rules SET driver_id='drv_anubis_ribeiro' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_anubis_ribeiro' AND (LOWER(name)=LOWER('Anúbis Ribeiro'))) AND NOT EXISTS (SELECT 1 FROM settlement_rules WHERE driver_id='drv_anubis_ribeiro');
DELETE FROM settlement_rules WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_anubis_ribeiro' AND (LOWER(name)=LOWER('Anúbis Ribeiro')));
DELETE FROM weekly_settlements WHERE driver_id='drv_anubis_ribeiro' AND week_start IN (SELECT week_start FROM weekly_settlements WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_anubis_ribeiro' AND (LOWER(name)=LOWER('Anúbis Ribeiro'))));
UPDATE weekly_settlements SET driver_id='drv_anubis_ribeiro' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_anubis_ribeiro' AND (LOWER(name)=LOWER('Anúbis Ribeiro')));
DELETE FROM settlement_week_overrides WHERE driver_id='drv_anubis_ribeiro' AND week_start IN (SELECT week_start FROM settlement_week_overrides WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_anubis_ribeiro' AND (LOWER(name)=LOWER('Anúbis Ribeiro'))));
UPDATE settlement_week_overrides SET driver_id='drv_anubis_ribeiro' WHERE driver_id IN (SELECT id FROM drivers WHERE id<>'drv_anubis_ribeiro' AND (LOWER(name)=LOWER('Anúbis Ribeiro')));
UPDATE drivers SET status='merged',updated_at=CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM drivers WHERE id<>'drv_anubis_ribeiro' AND (LOWER(name)=LOWER('Anúbis Ribeiro')));
