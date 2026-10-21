// ============================================================
// SSS Institution - MySQL Connected Frontend
// ============================================================
const API_URL = "/api";

let db = {
  courses: [],
  students: [],
  payments: []
};

async function loadDatabase() {
  try {
    const [coursesRes, studentsRes, paymentsRes] = await Promise.all([
      fetch(`${API_URL}/courses`),
      fetch(`${API_URL}/students`),
      fetch(`${API_URL}/payments`)
    ]);
    if (!coursesRes.ok || !studentsRes.ok || !paymentsRes.ok) throw new Error('API request failed');
    const courses = await coursesRes.json();
    const students = await studentsRes.json();
    const payments = await paymentsRes.json();

    db.courses = courses.map(c => ({
      id: c.course_id, name: c.course_name, icon: c.icon || '📚', bgClass: c.bg_class || 'bg-default',
      duration: c.duration, fees: Number(c.fees), desc: c.description || '',
      syllabus: c.syllabus ? String(c.syllabus).split('\n').filter(Boolean) : []
    }));
    db.students = students.map(s => ({
      id: s.student_id, name: s.name, phone: s.phone, course: s.course, fees: Number(s.fees),
      paid: Number(s.paid), date: s.join_date ? String(s.join_date).slice(0,10) : '', address: s.address || ''
    }));
    db.payments = payments.map(p => ({
      id: p.payment_id, studentId: p.student_id, studentName: p.student_name, course: p.course,
      amount: Number(p.amount), date: p.payment_date ? String(p.payment_date).slice(0,10) : '',
      method: p.payment_method, status: p.status, notes: p.notes || ''
    }));
    renderHomeStrip();
    renderCatalog();
    renderStudents();
    renderPayments();
    renderCatalogMgmt();
    renderReport();
    console.log('SSS Institution: MySQL connected');
  } catch (error) {
    console.error(error);
    showToast('Database connection failed. Check MySQL and backend.', 'error');
  }
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

document.addEventListener('DOMContentLoaded', loadDatabase);

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) {
    el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (page === 'home') renderHomeStrip();
  if (page === 'catalog') renderCatalog();
  if (page === 'admin') { adminTab('students'); renderStudents(); }
}

function toggleMenu() {
  const nav = document.querySelector('.nav-links');
  nav.classList.toggle('open');
}

/* =================== RENDER HOME COURSE STRIP =================== */
function renderHomeStrip() {
  const grid = document.getElementById('homeCoursesGrid');
  if (!grid) return;
  grid.innerHTML = db.courses.map(c => buildCourseCard(c)).join('');
}

/* =================== RENDER CATALOG =================== */
function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;
  grid.innerHTML = db.courses.map(c => buildCourseCard(c)).join('');
}

function buildCourseCard(c) {
  return `
    <div class="course-card" onclick="showCourseDetail(${c.id})">
      <div class="course-img ${c.bgClass || 'bg-default'}">${c.icon}</div>
      <div class="course-body">
        <h3>${c.name}</h3>
        <p>${c.desc.substring(0, 90)}...</p>
        <div class="course-meta">
          <span class="course-fee">₹${c.fees.toLocaleString()}</span>
          <span class="course-duration">⏱ ${c.duration}</span>
        </div>
        <div class="course-cta">
          <button class="btn-primary full-width" onclick="event.stopPropagation(); showCourseDetail(${c.id})">View Details →</button>
        </div>
      </div>
    </div>
  `;
}

/* =================== COURSE DETAIL =================== */
function showCourseDetail(id) {
  const c = db.courses.find(x => x.id === id);
  if (!c) return;

  const syllabusHTML = c.syllabus.map(s => `<li>${s}</li>`).join('');

  document.getElementById('courseDetailWrap').innerHTML = `
    <div class="detail-back" onclick="showPage('catalog')">← Back to Courses</div>
    <div class="detail-hero">
      <div class="detail-icon">${c.icon}</div>
      <div>
        <h1>${c.name}</h1>
        <p>${c.desc}</p>
        <div class="detail-chips">
          <span class="chip">⏱ ${c.duration}</span>
          <span class="chip">📚 ${c.syllabus.length} Topics</span>
          <span class="chip">🏆 Certificate Included</span>
        </div>
      </div>
    </div>
    <div class="detail-layout">
      <div class="detail-syllabus">
        <h2>Course Syllabus</h2>
        <ul class="syllabus-list">${syllabusHTML}</ul>
      </div>
      <div class="detail-sidebar">
        <div class="sidebar-card">
          <h3>💰 Course Fee</h3>
          <div class="fee-big">₹${c.fees.toLocaleString()}</div>
          <div class="fee-note">All inclusive · No hidden charges</div>
          <br>
          <button class="btn-primary full-width" onclick="openQR(${c.fees}, '${c.name}')">
            📱 Pay Now (QR)
          </button>
        </div>
        <div class="sidebar-card">
          <h3>📞 Contact Us</h3>
          <div class="contact-quick">
            <div class="cq-item">📞 <a href="tel:+91*********">+91 ***********</a></div>
            <div class="cq-item">💬 <a href="https://wa.me/91*********" target="_blank">WhatsApp</a></div>
            <div class="cq-item">📧 <a href="mailto:info@sssinstitution.in">info@sssinstitution.in</a></div>
            <div class="cq-item">📍 <span>Chennai, Tamil Nadu</span></div>
          </div>
          <br>
          <button class="btn-primary full-width" onclick="showPage('contact')">
            Enquire Now
          </button>
        </div>
      </div>
    </div>
  `;

  showPage('course');
}

/* =================== QR PAYMENT =================== */
function openQR(amount, courseName) {
  document.getElementById('qrAmount').textContent = `Course: ${courseName} · ₹${amount.toLocaleString()}`;
  generateQR();
  document.getElementById('qrModal').classList.remove('hidden');
}

function generateQR() {
  const grid = document.getElementById('qrGrid');
  grid.innerHTML = '';
  // Generate a decorative QR-like pattern
  const pattern = [];
  for (let i = 0; i < 100; i++) pattern.push(Math.random() > 0.45 ? 1 : 0);
  // Finder patterns (corners)
  const corners = [0,1,2,3,4,5,6,10,11,12,13,14,15,16,20,30,40,50,60,
                   70,3,13,23,33,43,53,63,90,91,92,93,94,95,96];
  corners.forEach(i => { if (i < 100) pattern[i] = 1; });
  pattern.forEach(v => {
    const cell = document.createElement('div');
    cell.className = 'qr-cell';
    cell.style.opacity = v ? '1' : '0';
    grid.appendChild(cell);
  });
}

/* =================== CONTACT FORM =================== */
function submitEnquiry() {
  const name = document.getElementById('enqName').value.trim();
  const phone = document.getElementById('enqPhone').value.trim();
  const course = document.getElementById('enqCourse').value;
  if (!name || !phone) { showToast('Please fill name and phone number', 'error'); return; }
  showToast(`✅ Thank you ${name}! We'll contact you shortly.`, 'success');
  ['enqName','enqPhone','enqCourse','enqMsg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

/* =================== ADMIN TABS =================== */
function adminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
  event.currentTarget.classList.add('active');
  document.getElementById('tab-' + tab).classList.remove('hidden');
  if (tab === 'students') renderStudents();
  if (tab === 'payments') renderPayments();
  if (tab === 'report') renderReport();
  if (tab === 'catalog-mgmt') renderCatalogMgmt();
}

/* =================== STUDENTS CRUD =================== */
function renderStudents() {
  const search = (document.getElementById('studentSearch')?.value || '').toLowerCase();
  const tbody = document.getElementById('studentsTable');
  const filtered = db.students.filter(s =>
    s.name.toLowerCase().includes(search) ||
    s.course.toLowerCase().includes(search) ||
    s.phone.includes(search)
  );
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--gray)">No students found</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map((s, i) => {
    const balance = s.fees - s.paid;
    const status = balance === 0 ? 'badge-green' : balance < s.fees ? 'badge-yellow' : 'badge-red';
    const statusText = balance === 0 ? 'Paid' : balance < s.fees ? 'Partial' : 'Unpaid';
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${s.name}</strong></td>
        <td>${s.phone}</td>
        <td>${s.course}</td>
        <td>₹${s.fees.toLocaleString()}</td>
        <td>₹${s.paid.toLocaleString()}</td>
        <td><span class="badge ${balance > 0 ? 'badge-red' : 'badge-green'}">₹${balance.toLocaleString()}</span></td>
        <td>${formatDate(s.date)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn-edit" onclick="editStudent(${s.id})">✏️</button>
            <button class="btn-danger" onclick="deleteStudent(${s.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openStudentModal(id = null) {
  document.getElementById('studentModalTitle').textContent = id ? 'Edit Student' : 'Add New Student';
  document.getElementById('studentId').value = id || '';
  const s = id ? db.students.find(x => x.id === id) : null;
  document.getElementById('sName').value = s?.name || '';
  document.getElementById('sPhone').value = s?.phone || '';
  document.getElementById('sCourse').value = s?.course || '';
  document.getElementById('sFees').value = s?.fees || '';
  document.getElementById('sPaid').value = s?.paid || 0;
  document.getElementById('sDate').value = s?.date || new Date().toISOString().split('T')[0];
  document.getElementById('sAddress').value = s?.address || '';
  document.getElementById('studentModal').classList.remove('hidden');
}

function editStudent(id) { openStudentModal(id); }

async function saveStudent() {
  const id = document.getElementById('studentId').value;
  const name = document.getElementById('sName').value.trim();
  const phone = document.getElementById('sPhone').value.trim();
  const course = document.getElementById('sCourse').value;
  const fees = parseInt(document.getElementById('sFees').value) || 0;
  const paid = parseInt(document.getElementById('sPaid').value) || 0;
  const date = document.getElementById('sDate').value;
  const address = document.getElementById('sAddress').value.trim();
  if (!name || !phone || !course || !fees || !date) { showToast('Please fill all required fields', 'error'); return; }
  const c = db.courses.find(x => x.name === course);
  if (!c) { showToast('Course not found', 'error'); return; }
  try {
    const payload = { name, phone, course_id: c.id, fees, paid, join_date: date, address };
    if (id) {
      await apiJson(`${API_URL}/students/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('✅ Student updated successfully', 'success');
    } else {
      await apiJson(`${API_URL}/students`, { method: 'POST', body: JSON.stringify(payload) });
      showToast('✅ Student added successfully', 'success');
    }
    closeModal('studentModal');
    await loadDatabase();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student?')) return;
  try {
    await apiJson(`${API_URL}/students/${id}`, { method: 'DELETE' });
    showToast('Student deleted', 'success');
    await loadDatabase();
  } catch (e) { showToast(e.message, 'error'); }
}

function autoFillFee() {
  const course = document.getElementById('sCourse').value;
  const c = db.courses.find(x => x.name === course);
  if (c) document.getElementById('sFees').value = c.fees;
}

/* =================== PAYMENTS CRUD =================== */
function renderPayments() {
  const tbody = document.getElementById('paymentsTable');
  if (!db.payments.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--gray)">No payments recorded</td></tr>`;
    return;
  }
  tbody.innerHTML = db.payments.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${p.studentName}</strong></td>
      <td>${p.course}</td>
      <td><strong>₹${p.amount.toLocaleString()}</strong></td>
      <td>${formatDate(p.date)}</td>
      <td>${p.method}</td>
      <td><span class="badge badge-green">${p.status}</span></td>
    </tr>
  `).join('');
}

function openPaymentModal() {
  const sel = document.getElementById('pStudent');
  sel.innerHTML = '<option value="">Select student</option>' +
    db.students.map(s => `<option value="${s.id}">${s.name} – ${s.course}</option>`).join('');
  document.getElementById('pDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('pAmount').value = '';
  document.getElementById('pNotes').value = '';
  document.getElementById('paymentModal').classList.remove('hidden');
}

async function savePayment() {
  const studentId = parseInt(document.getElementById('pStudent').value);
  const amount = parseInt(document.getElementById('pAmount').value) || 0;
  const date = document.getElementById('pDate').value;
  const method = document.getElementById('pMethod').value;
  const notesEl = document.getElementById('pNotes');
  const notes = notesEl ? notesEl.value.trim() : '';
  if (!studentId || !amount || !date) { showToast('Please fill all required fields', 'error'); return; }
  try {
    await apiJson(`${API_URL}/payments`, { method: 'POST', body: JSON.stringify({ student_id: studentId, amount, payment_date: date, payment_method: method, notes }) });
    showToast('✅ Payment recorded successfully', 'success');
    closeModal('paymentModal');
    await loadDatabase();
  } catch (e) { showToast(e.message, 'error'); }
}

/* =================== MONTHLY REPORT =================== */
function renderReport() {
  const month = document.getElementById('reportMonth').value;
  const courseFilter = document.getElementById('reportCourse').value;

  let filtered = [...db.students];
  if (courseFilter) filtered = filtered.filter(s => s.course === courseFilter);
  if (month) {
    const monthIdx = ['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(month);
    filtered = filtered.filter(s => {
      if (!s.date) return false;
      return new Date(s.date).getMonth() === monthIdx;
    });
  }

  const totalStudents = filtered.length;
  const totalFees = filtered.reduce((a, s) => a + s.fees, 0);
  const totalPaid = filtered.reduce((a, s) => a + s.paid, 0);
  const totalBalance = totalFees - totalPaid;

  document.getElementById('reportStats').innerHTML = `
    <div class="stat-card"><h4>Students</h4><div class="stat-val">${totalStudents}</div></div>
    <div class="stat-card"><h4>Total Fees</h4><div class="stat-val">₹${totalFees.toLocaleString()}</div></div>
    <div class="stat-card"><h4>Amount Collected</h4><div class="stat-val">₹${totalPaid.toLocaleString()}</div></div>
    <div class="stat-card"><h4>Balance Due</h4><div class="stat-val" style="color:var(--danger)">₹${totalBalance.toLocaleString()}</div></div>
  `;

  const tbody = document.getElementById('reportTable');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--gray)">No data for selected filters</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map((s, i) => {
    const balance = s.fees - s.paid;
    const statusClass = balance === 0 ? 'badge-green' : balance < s.fees ? 'badge-yellow' : 'badge-red';
    const statusText = balance === 0 ? 'Fully Paid' : balance < s.fees ? 'Partial' : 'Unpaid';
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${s.name}</strong></td>
        <td>${s.course}</td>
        <td>₹${s.fees.toLocaleString()}</td>
        <td>₹${s.paid.toLocaleString()}</td>
        <td>₹${balance.toLocaleString()}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  }).join('');
}

/* =================== CATALOG MANAGEMENT CRUD =================== */
function renderCatalogMgmt() {
  const grid = document.getElementById('catalogMgmtGrid');
  grid.innerHTML = db.courses.map(c => `
    <div class="catalog-mgmt-card">
      <div class="card-icon">${c.icon}</div>
      <h3>${c.name}</h3>
      <p>Duration: ${c.duration} · Fee: ₹${c.fees.toLocaleString()}</p>
      <div class="card-actions">
        <button class="btn-edit" onclick="editCatalog(${c.id})">✏️ Edit</button>
        <button class="btn-danger" onclick="deleteCatalog(${c.id})">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

function openCatalogModal(id = null) {
  document.getElementById('catalogModalTitle').textContent = id ? 'Edit Course' : 'Add Course';
  document.getElementById('catalogId').value = id || '';
  const c = id ? db.courses.find(x => x.id === id) : null;
  document.getElementById('cName').value = c?.name || '';
  document.getElementById('cDuration').value = c?.duration || '';
  document.getElementById('cFees').value = c?.fees || '';
  document.getElementById('cIcon').value = c?.icon || '📚';
  document.getElementById('cDesc').value = c?.desc || '';
  document.getElementById('cSyllabus').value = c?.syllabus?.join('\n') || '';
  document.getElementById('catalogModal').classList.remove('hidden');
}

function editCatalog(id) { openCatalogModal(id); }

async function saveCatalog() {
  const id = document.getElementById('catalogId').value;
  const name = document.getElementById('cName').value.trim();
  const duration = document.getElementById('cDuration').value.trim();
  const fees = parseInt(document.getElementById('cFees').value) || 0;
  const icon = document.getElementById('cIcon').value.trim() || '📚';
  const desc = document.getElementById('cDesc').value.trim();
  const syllabus = document.getElementById('cSyllabus').value.trim().split('\n').map(s => s.trim()).filter(Boolean);
  if (!name || !duration || !fees || !desc) { showToast('Please fill all required fields', 'error'); return; }
  try {
    const payload = { name, duration, fees, icon, description: desc, syllabus, bg_class: id ? (db.courses.find(c => c.id === parseInt(id))?.bgClass || 'bg-default') : 'bg-default' };
    if (id) {
      await apiJson(`${API_URL}/courses/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('✅ Course updated successfully', 'success');
    } else {
      await apiJson(`${API_URL}/courses`, { method: 'POST', body: JSON.stringify(payload) });
      showToast('✅ Course added successfully', 'success');
    }
    closeModal('catalogModal');
    await loadDatabase();
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteCatalog(id) {
  if (db.courses.length <= 1) { showToast('Cannot delete the last course', 'error'); return; }
  if (!confirm('Delete this course from the catalog?')) return;
  try {
    await apiJson(`${API_URL}/courses/${id}`, { method: 'DELETE' });
    showToast('Course removed from catalog', 'success');
    await loadDatabase();
  } catch (e) { showToast(e.message, 'error'); }
}

/* =================== MODAL HELPERS =================== */
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

/* =================== TOAST =================== */
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  setTimeout(() => { toast.className = 'toast hidden'; }, 3500);
}

/* =================== UTILS =================== */
function formatDate(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* =================== INIT =================== */
document.addEventListener('DOMContentLoaded', function() {
  showPage('home');
  // Set today's date as default for modals
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(inp => { if (!inp.value) inp.value = today; });
});
