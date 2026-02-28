INSERT INTO buildings (id, name, code, address, management_fee)
VALUES ('00000000-0000-0000-0000-000000000001', '宏盛國際金融中心', 'HSIFC', '台北市信義區（示例）', 120.50)
ON CONFLICT (id) DO NOTHING;

INSERT INTO floors (building_id, label, sort_index)
SELECT '00000000-0000-0000-0000-000000000001', 'B' || gs::text, -gs
FROM generate_series(5, 1, -1) gs
ON CONFLICT (building_id, label) DO NOTHING;

INSERT INTO floors (building_id, label, sort_index)
SELECT '00000000-0000-0000-0000-000000000001', gs::text || 'F', gs
FROM generate_series(1, 20, 1) gs
ON CONFLICT (building_id, label) DO NOTHING;

WITH target_floors AS (
  SELECT id, label
  FROM floors
  WHERE building_id = '00000000-0000-0000-0000-000000000001'
    AND label IN ('5F', '6F', '9F', '10F')
),
unit_defs AS (
  SELECT * FROM (VALUES
    ('A1', 80.00, 60.00, 5.00),
    ('A2', 85.00, 64.00, 5.00),
    ('A3', 90.00, 68.00, 5.00),
    ('A4', 95.00, 72.00, 5.00),
    ('A5', 100.00, 76.00, 5.00),
    ('A6', 105.00, 80.00, 5.00),
    ('A6-1', 110.00, 84.00, 5.00)
  ) AS u(code, gross_area, net_area, balcony_area)
)
INSERT INTO units (building_id, floor_id, code, gross_area, net_area, balcony_area, is_current)
SELECT '00000000-0000-0000-0000-000000000001', tf.id, ud.code, ud.gross_area, ud.net_area, ud.balcony_area, true
FROM target_floors tf
CROSS JOIN unit_defs ud
ON CONFLICT (floor_id, code, is_current) DO NOTHING;

INSERT INTO owners (id, building_id, name, tax_id, contact_name, contact_phone, contact_email, notes)
VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '宏盛資產管理股份有限公司', '12345678', '王經理', '02-2712-1000', 'owner1@example.com', '主業主'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '宏盛開發投資股份有限公司', '87654321', '陳協理', '02-2712-2000', 'owner2@example.com', null)
ON CONFLICT (id) DO NOTHING;

INSERT INTO floor_owners (floor_id, owner_id, share_percent, start_date, notes)
SELECT f.id, '00000000-0000-0000-0000-000000000101', 60.00, now(), '5F 持分'
FROM floors f WHERE f.building_id='00000000-0000-0000-0000-000000000001' AND f.label='5F'
ON CONFLICT DO NOTHING;

INSERT INTO floor_owners (floor_id, owner_id, share_percent, start_date, notes)
SELECT f.id, '00000000-0000-0000-0000-000000000102', 100.00, now(), '9F 持分'
FROM floors f WHERE f.building_id='00000000-0000-0000-0000-000000000001' AND f.label='9F'
ON CONFLICT DO NOTHING;

INSERT INTO floor_owners (floor_id, owner_id, share_percent, start_date, notes)
SELECT f.id, '00000000-0000-0000-0000-000000000101', 40.00, now(), '10F 持分'
FROM floors f WHERE f.building_id='00000000-0000-0000-0000-000000000001' AND f.label='10F'
ON CONFLICT DO NOTHING;

INSERT INTO common_areas (id, building_id, floor_id, name, code, description)
SELECT '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', f.id, '大廳', 'LOBBY-1F', '一樓接待與等候區'
FROM floors f WHERE f.building_id='00000000-0000-0000-0000-000000000001' AND f.label='1F'
ON CONFLICT (id) DO NOTHING;

INSERT INTO common_areas (id, building_id, name, code) VALUES
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', '電梯', 'ELEVATOR'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000001', '機房', 'MACHINE-ROOM'),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000001', '公共走廊', 'PUBLIC-CORRIDOR')
ON CONFLICT (id) DO NOTHING;

INSERT INTO common_areas (id, building_id, floor_id, name, code)
SELECT '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', f.id, '停車場', 'PARKING-B2'
FROM floors f WHERE f.building_id='00000000-0000-0000-0000-000000000001' AND f.label='B2'
ON CONFLICT (id) DO NOTHING;

INSERT INTO vendors (id, building_id, name, contact_name, contact_phone) VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', '全方位機電工程', '林先生', '02-2777-1000'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', '大都會室內修繕', '張小姐', '02-2777-2000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO repair_records (
  building_id, scope_type, floor_id, item, description, vendor_id, vendor_name, quote_amount, status, reported_at, notes
)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'FLOOR',
  f.id,
  '10F 空調主機更換',
  '更換冷媒管線與壓縮機',
  '00000000-0000-0000-0000-000000000301',
  '全方位機電工程',
  480000,
  'QUOTED',
  CURRENT_DATE,
  '待董事會核准'
FROM floors f
WHERE f.building_id='00000000-0000-0000-0000-000000000001' AND f.label='10F';

INSERT INTO repair_records (
  building_id, scope_type, common_area_id, item, description, vendor_id, vendor_name, quote_amount, approved_amount,
  status, acceptance_result, inspector_name, reported_at, accepted_at, notes
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'COMMON_AREA',
  '00000000-0000-0000-0000-000000000201',
  '一樓大廳地坪修復',
  '石材破損修復與拋光',
  '00000000-0000-0000-0000-000000000302',
  '大都會室內修繕',
  160000,
  150000,
  'ACCEPTED',
  'PASS',
  '李主任',
  CURRENT_DATE,
  now(),
  '已驗收完成'
);
