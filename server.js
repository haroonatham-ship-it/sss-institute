const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api', (req, res) => res.json({ message: 'SSS Institution backend is running' }));

app.get('/api/courses', async (req, res) => {
  try { const [rows] = await db.query('SELECT * FROM courses ORDER BY course_id'); res.json(rows); }
  catch (e) { console.error(e); res.status(500).json({error:'Failed to fetch courses'}); }
});

app.post('/api/courses', async (req, res) => {
  try {
    const {name,duration,fees,icon,description,syllabus,bg_class} = req.body;
    const [r] = await db.query('INSERT INTO courses (course_name,duration,fees,icon,description,syllabus,bg_class) VALUES (?,?,?,?,?,?,?)',[name,duration,fees,icon,description,Array.isArray(syllabus)?syllabus.join('\n'):syllabus||'',bg_class||'bg-default']);
    res.json({message:'Course added',course_id:r.insertId});
  } catch(e) { console.error(e); res.status(500).json({error:e.code==='ER_DUP_ENTRY'?'Course name already exists':'Failed to add course'}); }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const {name,duration,fees,icon,description,syllabus,bg_class} = req.body;
    await db.query('UPDATE courses SET course_name=?,duration=?,fees=?,icon=?,description=?,syllabus=?,bg_class=? WHERE course_id=?',[name,duration,fees,icon,description,Array.isArray(syllabus)?syllabus.join('\n'):syllabus||'',bg_class||'bg-default',req.params.id]);
    res.json({message:'Course updated'});
  } catch(e) { console.error(e); res.status(500).json({error:e.code==='ER_DUP_ENTRY'?'Course name already exists':'Failed to update course'}); }
});

app.delete('/api/courses/:id', async (req, res) => {
  try { await db.query('DELETE FROM courses WHERE course_id=?',[req.params.id]); res.json({message:'Course deleted'}); }
  catch(e) { console.error(e); res.status(400).json({error:'Cannot delete a course that has students. Remove or move those students first.'}); }
});

app.get('/api/students', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT s.student_id,s.name,s.phone,c.course_name AS course,s.course_id,s.fees,s.paid,(s.fees-s.paid) AS balance,s.join_date,s.address FROM students s JOIN courses c ON s.course_id=c.course_id ORDER BY s.student_id DESC`);
    res.json(rows);
  } catch(e) { console.error(e); res.status(500).json({error:'Failed to fetch students'}); }
});

app.post('/api/students', async (req,res)=>{
  try { const {name,phone,course_id,fees,paid,join_date,address}=req.body; const [r]=await db.query('INSERT INTO students (name,phone,course_id,fees,paid,join_date,address) VALUES (?,?,?,?,?,?,?)',[name,phone,course_id,fees,paid||0,join_date,address]); res.json({message:'Student added',student_id:r.insertId}); }
  catch(e){console.error(e);res.status(500).json({error:'Failed to add student'});}
});

app.put('/api/students/:id', async(req,res)=>{
  try { const {name,phone,course_id,fees,paid,join_date,address}=req.body; await db.query('UPDATE students SET name=?,phone=?,course_id=?,fees=?,paid=?,join_date=?,address=? WHERE student_id=?',[name,phone,course_id,fees,paid||0,join_date,address,req.params.id]); res.json({message:'Student updated'}); }
  catch(e){console.error(e);res.status(500).json({error:'Failed to update student'});}
});

app.delete('/api/students/:id', async(req,res)=>{
  try { await db.query('DELETE FROM students WHERE student_id=?',[req.params.id]); res.json({message:'Student deleted'}); }
  catch(e){console.error(e);res.status(500).json({error:'Failed to delete student'});}
});

app.get('/api/payments', async(req,res)=>{
  try { const [rows]=await db.query(`SELECT p.payment_id,p.student_id,s.name AS student_name,c.course_name AS course,p.amount,p.payment_date,p.payment_method,p.status,p.notes FROM payments p JOIN students s ON p.student_id=s.student_id JOIN courses c ON s.course_id=c.course_id ORDER BY p.payment_id DESC`); res.json(rows); }
  catch(e){console.error(e);res.status(500).json({error:'Failed to fetch payments'});}
});

app.post('/api/payments', async(req,res)=>{
  const conn=await db.getConnection();
  try {
    await conn.beginTransaction();
    const {student_id,amount,payment_date,payment_method,notes}=req.body;
    const [studentRows]=await conn.query('SELECT fees,paid FROM students WHERE student_id=? FOR UPDATE',[student_id]);
    if(!studentRows.length) throw new Error('Student not found');
    await conn.query('INSERT INTO payments (student_id,amount,payment_date,payment_method,status,notes) VALUES (?,?,?,? ,?,?)',[student_id,amount,payment_date,payment_method||'Cash','Completed',notes||'']);
    await conn.query('UPDATE students SET paid=LEAST(fees,paid+?) WHERE student_id=?',[amount,student_id]);
    await conn.commit(); res.json({message:'Payment recorded'});
  } catch(e){await conn.rollback();console.error(e);res.status(500).json({error:e.message||'Failed to record payment'});} finally {conn.release();}
});

app.get('/api/report', async(req,res)=>{
  try { const month=Number(req.query.month); const year=Number(req.query.year); const [rows]=await db.query(`SELECT COUNT(*) AS total_students,COALESCE(SUM(fees),0) AS total_fees,COALESCE(SUM(paid),0) AS total_paid,COALESCE(SUM(fees-paid),0) AS total_balance FROM students WHERE MONTH(join_date)=? AND YEAR(join_date)=?`,[month,year]); res.json(rows[0]); }
  catch(e){console.error(e);res.status(500).json({error:'Failed to generate report'});}
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'..','frontend','index.html')));

app.listen(PORT,()=>console.log(`SSS Institution running at http://localhost:${PORT}`));
