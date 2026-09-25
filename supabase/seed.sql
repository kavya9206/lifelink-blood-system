-- LifeLink seed data — run after schema.sql
-- Creates: hospitals, inventory, demo donor names, and open blood requests.
-- Demo user rows are NOT inserted here; Flux/API creates them via Supabase Auth.
--    Register via the app: admin@lifelink.in / donor@lifelink.in / recipient@lifelink.in / hospital@lifelink.in
--    Password: demo1234  (set via Supabase Auth UI or API register endpoint)

-- All timestamps are relative to now() so the demo always feels current.

WITH base_facilities(facility, city) AS (
  VALUES
    ('LifeLink Central Blood Bank', 'Mumbai'),
    ('AIIMS Blood Centre', 'Delhi'),
    ('Apollo Blood Bank', 'Chennai'),
    ('Manipal Blood Bank', 'Bengaluru'),
    ('Ruby Hall Blood Centre', 'Pune'),
    ('KIMS Voluntary Blood Bank', 'Kochi')
),
group_list(bg) AS (
  VALUES ('A+'),('A-'),('B+'),('B-'),('AB+'),('AB-'),('O+'),('O-')
)
-- Hospitals
INSERT INTO public.hospitals (name, city, address, phone, emergency_24x7, groups)
VALUES
  ('All India Institute of Medical Sciences (AIIMS)', 'Delhi', 'Ansari Nagar, New Delhi 110029', '+91 11 2658 8500', true, ARRAY['A+','A-','B+','B-','AB+','AB-','O+','O-']),
  ('Apollo Hospitals Greams Road', 'Chennai', '21, Greams Lane, Thousand Lights', '+91 44 2829 3333', true, ARRAY['A+','B+','B-','AB+','O+','O-']),
  ('Fortis Hospital Mulund', 'Mumbai', 'Mulund Goregaon Link Road, Mulund West', '+91 22 6799 4444', true, ARRAY['A+','A-','B+','AB+','O+']),
  ('Manipal Hospital Old Airport Road', 'Bengaluru', '98, HAL Old Airport Road', '+91 80 2502 4444', true, ARRAY['A+','B+','AB+','AB-','O+','O-']),
  ('Ruby Hall Clinic', 'Pune', '40, Sassoon Road, Sangamvadi', '+91 20 6645 5100', false, ARRAY['A+','B+','O+','O-']),
  ('Amrita Institute of Medical Sciences', 'Kochi', 'Ponekkara, Edappally', '+91 484 400 1234', true, ARRAY['A+','A-','B+','AB+','O+']),
  ('Medanta The Medicity', 'Delhi', 'CH Baktawar Singh Road, Sector 38, Gurugram', '+91 124 414 1414', true, ARRAY['A+','B+','B-','AB+','O+','O-']),
  ('Sawai Man Singh Hospital', 'Jaipur', 'JLN Marg, Adarsh Nagar', '+91 141 252 0177', false, ARRAY['B+','AB+','O+']),
  ('Nizam''s Institute of Medical Sciences', 'Hyderabad', 'Punjagutta', '+91 40 2348 9999', true, ARRAY['A+','B+','AB+','O+','O-']),
  ('Institute of Postgraduate Medical Education & Research (IPGMER)', 'Kolkata', '244, Acharya Jagadish Chandra Bose Road', '+91 33 2204 1000', false, ARRAY['A+','B+','O+'])
ON CONFLICT DO NOTHING;

-- Inventory — unit counts rotated so every blood group shows available/low/critical states
INSERT INTO public.inventory (blood_group, facility, city, units, low_stock_threshold)
VALUES
  ('A+','LifeLink Central Blood Bank','Mumbai',18,8), ('A-','LifeLink Central Blood Bank','Mumbai',5,8), ('B+','LifeLink Central Blood Bank','Mumbai',21,8), ('B-','LifeLink Central Blood Bank','Mumbai',4,8), ('AB+','LifeLink Central Blood Bank','Mumbai',9,8), ('AB-','LifeLink Central Blood Bank','Mumbai',3,8), ('O+','LifeLink Central Blood Bank','Mumbai',26,8), ('O-','LifeLink Central Blood Bank','Mumbai',7,8),
  ('A+','AIIMS Blood Centre','Delhi',9,8), ('A-','AIIMS Blood Centre','Delhi',3,8), ('B+','AIIMS Blood Centre','Delhi',12,8), ('B-','AIIMS Blood Centre','Delhi',6,8), ('AB+','AIIMS Blood Centre','Delhi',6,8), ('AB-','AIIMS Blood Centre','Delhi',2,8), ('O+','AIIMS Blood Centre','Delhi',15,8), ('O-','AIIMS Blood Centre','Delhi',4,8),
  ('A+','Apollo Blood Bank','Chennai',22,8), ('A-','Apollo Blood Bank','Chennai',6,8), ('B+','Apollo Blood Bank','Chennai',17,8), ('B-','Apollo Blood Bank','Chennai',3,8), ('AB+','Apollo Blood Bank','Chennai',11,8), ('AB-','Apollo Blood Bank','Chennai',4,8), ('O+','Apollo Blood Bank','Chennai',24,8), ('O-','Apollo Blood Bank','Chennai',8,8),
  ('A+','Manipal Blood Bank','Bengaluru',14,8), ('A-','Manipal Blood Bank','Bengaluru',4,8), ('B+','Manipal Blood Bank','Bengaluru',19,8), ('B-','Manipal Blood Bank','Bengaluru',5,8), ('AB+','Manipal Blood Bank','Bengaluru',7,8), ('AB-','Manipal Blood Bank','Bengaluru',3,8), ('O+','Manipal Blood Bank','Bengaluru',20,8), ('O-','Manipal Blood Bank','Bengaluru',6,8),
  ('A+','Ruby Hall Blood Centre','Pune',7,8), ('A-','Ruby Hall Blood Centre','Pune',2,8), ('B+','Ruby Hall Blood Centre','Pune',10,8), ('B-','Ruby Hall Blood Centre','Pune',2,8), ('AB+','Ruby Hall Blood Centre','Pune',5,8), ('AB-','Ruby Hall Blood Centre','Pune',2,8), ('O+','Ruby Hall Blood Centre','Pune',12,8), ('O-','Ruby Hall Blood Centre','Pune',3,8),
  ('A+','KIMS Voluntary Blood Bank','Kochi',16,8), ('A-','KIMS Voluntary Blood Bank','Kochi',5,8), ('B+','KIMS Voluntary Blood Bank','Kochi',13,8), ('B-','KIMS Voluntary Blood Bank','Kochi',4,8), ('AB+','KIMS Voluntary Blood Bank','Kochi',8,8), ('AB-','KIMS Voluntary Blood Bank','Kochi',2,8), ('O+','KIMS Voluntary Blood Bank','Kochi',18,8), ('O-','KIMS Voluntary Blood Bank','Kochi',5,8)
ON CONFLICT (facility, blood_group) DO UPDATE SET units = EXCLUDED.units, updated_at = now();

-- Demo donors (no auth-linked user_id; linked once the user registers via the API)
INSERT INTO public.donors (name, age, gender, blood_group, phone, email, city, address, last_donation, available)
VALUES
  ('Priya Patel', 31, 'Female', 'A+',  '+91 98790 11223', 'priya.patel@example.in',  'Ahmedabad','14, Sindhu Bhavan Marg, Bodakdev', now()::date - 75, true),
  ('Rohan Mehta', 42, 'Male',   'B+',  '+91 99300 45678', 'rohan.mehta@example.in',  'Mumbai',   '9A, Palm Grove, Powai', now()::date - 400, true),
  ('Ananya Iyer', 25, 'Female', 'O-',  '+91 98860 77889', 'ananya.iyer@example.in',  'Bengaluru','22, Indiranagar 100ft Road', now()::date - 30, false),
  ('Vikram Singh Rathore', 36, 'Male', 'AB+', '+91 98110 22334', 'vikram.singh@example.in', 'Delhi',    'C-9, Green Park Extension', now()::date - 210, true),
  ('Sneha Kulkarni', 29, 'Female', 'A-', '+91 97660 88990', 'sneha.k@example.in',     'Pune',     'Plot 45, Baner Road', null, true),
  ('Arjun Reddy', 33, 'Male',   'O+',  '+91 90000 12345', 'arjun.reddy@example.in',  'Hyderabad','8-2-120, Road No. 12, Banjara Hills', now()::date - 95, true),
  ('Kavya Nair', 26, 'Female', 'B-',  '+91 98470 33455', 'kavya.nair@example.in',   'Kochi',    'Villa 6, Marine Drive', now()::date - 180, true),
  ('Rahul Verma', 39, 'Male',   'AB-', '+91 98310 99887', 'rahul.verma@example.in',  'Kolkata',  '5B, Salt Lake Sector 3', now()::date - 500, true),
  ('Divya Joshi', 24, 'Female', 'O-',  '+91 94140 66554', 'divya.joshi@example.in',  'Jaipur',   '27, C-Scheme, Ashok Nagar', now()::date - 60, true)
ON CONFLICT DO NOTHING;

-- Blood requests (status mirrors original demo states so the boards still feel alive)
INSERT INTO public.blood_requests (patient_name, blood_group, units, hospital_name, hospital_city, contact, needed_by, urgency, notes, status)
VALUES
  ('Ramesh Gupta',     'B+',  2, 'AIIMS New Delhi',   'Delhi',   '+91 98111 22334', now()::date + 2,  'critical', 'Post-surgery transfusion, ICU. Sample data.', 'approved'),
  ('Lakshmi Narayanan','O+',  3, 'Apollo Hospitals',  'Chennai', '+91 90031 44556', now()::date + 5,  'urgent',   'Thalassemia patient, regular transfusion.', 'pending'),
  ('Imran Khan',       'A-',  1, 'Ruby Hall Clinic',  'Pune',    '+91 97660 11220', now()::date + 9,  'normal',   'Planned operation, scheduled admission.', 'fulfilled'),
  ('Sarita Devi',      'AB+', 2, 'Fortis Hospital',   'Mumbai',  '+91 98200 66778', now()::date + 3,  'urgent',   'Anemia emergency, maternity ward.', 'pending'),
  ('Devika Menon',     'O-',  1, 'KIMS Hospital',     'Kochi',   '+91 98470 77889', now()::date + 15, 'critical', 'Road accident, emergency ward.', 'fulfilled')
ON CONFLICT DO NOTHING;

-- Seed donation history: one entry per donor that has a last_donation
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, city, last_donation FROM public.donors WHERE last_donation IS NOT NULL LOOP
    IF NOT EXISTS (SELECT 1 FROM public.donation_history WHERE donor_id = r.id) THEN
      INSERT INTO public.donation_history (donor_id, date, location, units)
      VALUES (r.id, r.last_donation, r.city || ' voluntary camp', 1);
    END IF;
  END LOOP;
END $$;
