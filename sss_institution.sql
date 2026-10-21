CREATE DATABASE IF NOT EXISTS sss_institution;
USE sss_institution;

CREATE TABLE IF NOT EXISTS courses (
  course_id INT AUTO_INCREMENT PRIMARY KEY,
  course_name VARCHAR(100) NOT NULL UNIQUE,
  duration VARCHAR(50) NOT NULL,
  fees DECIMAL(10,2) NOT NULL,
  icon VARCHAR(20),
  description TEXT,
  syllabus TEXT,
  bg_class VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS students (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  course_id INT NOT NULL,
  fees DECIMAL(10,2) NOT NULL,
  paid DECIMAL(10,2) DEFAULT 0,
  join_date DATE NOT NULL,
  address VARCHAR(255),
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method ENUM('Cash','UPI / QR','Bank Transfer','Cheque') DEFAULT 'Cash',
  status VARCHAR(30) DEFAULT 'Completed',
  notes VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON UPDATE CASCADE ON DELETE CASCADE
);

INSERT IGNORE INTO courses (course_name,duration,fees,icon,description,syllabus,bg_class) VALUES
('Tally Prime','3 Months',5000,'📊','Master Tally Prime, GST, inventory, payroll and financial reporting.','Introduction to Tally Prime Interface\nCompany Creation & Configuration\nLedger & Group Management\nVoucher Entry\nInventory Management & Stock\nGST Configuration & Filing\nBank Reconciliation\nPayroll Management','bg-tally'),
('Busy Accounting','2 Months',4000,'💼','Learn Busy Accounting, GST, billing and inventory management.','Introduction to Busy Software\nCompany Setup & Configuration\nMasters: Accounts, Items & Groups\nSales & Purchase Management\nGST Return Filing\nInventory Management\nBank Reconciliation','bg-busy'),
('Advanced Excel','2 Months',3500,'📈','Learn advanced Excel formulas, Pivot Tables, dashboards and data analysis.','Excel Interface & Shortcuts\nAdvanced Formulas\nLogical Functions\nPivot Tables & Pivot Charts\nData Validation\nDashboards\nMacros & VBA Introduction','bg-excel'),
('Financial Modelling','4 Months',8000,'🏦','Build professional financial models and perform business analysis.','Financial Statements\nThree Statement Model\nDCF Valuation\nScenario Analysis\nBusiness Analysis','bg-fin'),
('QuickBooks','2 Months',4500,'💻','Learn QuickBooks accounting and financial management.','Company Setup\nInvoicing\nExpenses\nBank Reconciliation\nReports','bg-qb');

INSERT INTO students (name,phone,course_id,fees,paid,join_date,address)
SELECT 'Priya Sharma','9876543201',course_id,5000,5000,'2025-01-10','Adyar, Chennai' FROM courses WHERE course_name='Tally Prime' AND NOT EXISTS (SELECT 1 FROM students WHERE phone='9876543201');
INSERT INTO students (name,phone,course_id,fees,paid,join_date,address)
SELECT 'Rajan Kumar','9876543202',course_id,3500,2000,'2025-01-15','T. Nagar, Chennai' FROM courses WHERE course_name='Advanced Excel' AND NOT EXISTS (SELECT 1 FROM students WHERE phone='9876543202');
INSERT INTO students (name,phone,course_id,fees,paid,join_date,address)
SELECT 'Anitha Devi','9876543203',course_id,8000,4000,'2025-02-01','Velachery, Chennai' FROM courses WHERE course_name='Financial Modelling' AND NOT EXISTS (SELECT 1 FROM students WHERE phone='9876543203');
INSERT INTO students (name,phone,course_id,fees,paid,join_date,address)
SELECT 'Karthik R','9876543204',course_id,4500,4500,'2025-02-12','Porur, Chennai' FROM courses WHERE course_name='QuickBooks' AND NOT EXISTS (SELECT 1 FROM students WHERE phone='9876543204');
INSERT INTO students (name,phone,course_id,fees,paid,join_date,address)
SELECT 'Meena S','9876543205',course_id,4000,1500,'2025-03-05','Tambaram, Chennai' FROM courses WHERE course_name='Busy Accounting' AND NOT EXISTS (SELECT 1 FROM students WHERE phone='9876543205');

INSERT INTO payments (student_id,amount,payment_date,payment_method,status)
SELECT student_id,5000,'2025-01-10','Cash','Completed' FROM students WHERE phone='9876543201' AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.student_id=students.student_id);
INSERT INTO payments (student_id,amount,payment_date,payment_method,status)
SELECT student_id,2000,'2025-01-15','UPI / QR','Completed' FROM students WHERE phone='9876543202' AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.student_id=students.student_id);
INSERT INTO payments (student_id,amount,payment_date,payment_method,status)
SELECT student_id,4000,'2025-02-01','Bank Transfer','Completed' FROM students WHERE phone='9876543203' AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.student_id=students.student_id);
INSERT INTO payments (student_id,amount,payment_date,payment_method,status)
SELECT student_id,4500,'2025-02-12','Cash','Completed' FROM students WHERE phone='9876543204' AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.student_id=students.student_id);
INSERT INTO payments (student_id,amount,payment_date,payment_method,status)
SELECT student_id,1500,'2025-03-05','UPI / QR','Completed' FROM students WHERE phone='9876543205' AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.student_id=students.student_id);

-- Useful JOIN checks
SELECT s.student_id,s.name,s.phone,c.course_name,s.fees,s.paid,(s.fees-s.paid) AS balance,s.join_date,s.address
FROM students s JOIN courses c ON s.course_id=c.course_id ORDER BY s.student_id;

SELECT p.payment_id,s.name AS student_name,c.course_name,p.amount,p.payment_date,p.payment_method,p.status
FROM payments p JOIN students s ON p.student_id=s.student_id JOIN courses c ON s.course_id=c.course_id ORDER BY p.payment_id;

SHOW DATABASES;