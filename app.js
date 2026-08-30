let fetchedDataset = [];

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const gender = document.getElementById('gender').value;
  const fullname = document.getElementById('fullname').value.trim();
  const grade = document.getElementById('grade').value;
  const favoriteSubject = document.getElementById('favoriteSubject').value.trim();

  if (!gender) {
    showAlert('กรุณาเลือกเพศก่อนบันทึกข้อมูล', 'bg-amber-50 text-amber-700 border border-amber-200');
    return;
  }
  if (!grade) {
    showAlert('กรุณาเลือกระดับชั้นการศึกษาก่อนบันทึกข้อมูล', 'bg-amber-50 text-amber-700 border border-amber-200');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerText = "กำลังบันทึกข้อมูล...";

  const { data, error } = await _supabase
    .from('student_surveys')
    .insert([
      { gender: gender, fullname: fullname, grade: grade, favorite_subject: favoriteSubject }
    ]);

  submitBtn.disabled = false;
  submitBtn.innerText = "บันทึกข้อมูล";

  if (error) {
    showAlert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message, 'bg-red-50 text-red-700 border border-red-200');
  } else {
    showAlert('บันทึกข้อมูลเข้าฐานข้อมูลเรียบร้อยแล้ว!', 'bg-emerald-50 text-emerald-700 border border-emerald-200');
    
    document.getElementById('surveyForm').reset();
    resetCustomDropdowns();
    
    if (!document.getElementById('adminDashboard').classList.contains('hidden')) {
      loadAdminData();
    }
  }
}

/* --- ฟังก์ชันควบคุม Custom Dropdown --- */
function toggleDropdown(event, menuId) {
  event.stopPropagation();
  const menu = document.getElementById(menuId);
  const isOpened = menu.classList.contains('active');
  
  closeAllDropdowns();
  
  if (!isOpened) {
    menu.classList.add('active');
    const arrowId = menuId.replace('Menu', 'Arrow');
    const arrow = document.getElementById(arrowId);
    if (arrow) arrow.classList.add('rotate-180');
  }
}

function selectOption(inputId, value, labelId, menuId) {
  document.getElementById(inputId).value = value;
  const label = document.getElementById(labelId);
  label.innerText = value;
  label.classList.remove('text-slate-400');
  label.classList.add('text-slate-800', 'font-medium');
  
  closeAllDropdowns();
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('active'));
  document.querySelectorAll('.dropdown-arrow').forEach(a => a.classList.remove('rotate-180'));
}

function resetCustomDropdowns() {
  document.getElementById('gender').value = '';
  document.getElementById('genderLabel').innerText = '-- กรุณาเลือกเพศ --';
  document.getElementById('genderLabel').className = 'text-slate-400';

  document.getElementById('grade').value = '';
  document.getElementById('gradeLabel').innerText = '-- กรุณาเลือกระดับชั้น --';
  document.getElementById('gradeLabel').className = 'text-slate-400';
}

/* ปิด Dropdown เมื่อคลิกพื้นที่อื่นภายนอก */
window.addEventListener('click', function(e) {
  if (!e.target.closest('.custom-select-container')) {
    closeAllDropdowns();
  }
});

/* --- ฟังก์ชันระบบแจ้งเตือน และ Admin --- */
function showAlert(message, styles) {
  const alertBox = document.getElementById('statusAlert');
  alertBox.className = `mt-6 p-4 rounded-xl text-center text-sm font-medium transition-all duration-300 ${styles}`;
  alertBox.innerText = message;
  alertBox.classList.remove('hidden');
  setTimeout(() => alertBox.classList.add('hidden'), 4000);
}

function openAdminModal() { 
  const modal = document.getElementById('adminModal');
  const modalCard = document.getElementById('adminModalCard');
  modal.classList.remove('hidden'); 
  modalCard.classList.remove('animate-pop-in');
  void modalCard.offsetWidth;
  modalCard.classList.add('animate-pop-in');
}

function closeAdminModal() { 
  document.getElementById('adminModal').classList.add('hidden'); 
}

function loginAdmin() {
  const pwd = document.getElementById('adminPassword').value;
  if (pwd === "20050609") {
    closeAdminModal();
    const dashboard = document.getElementById('adminDashboard');
    dashboard.classList.remove('hidden');
    dashboard.classList.remove('animate-pop-in');
    void dashboard.offsetWidth;
    dashboard.classList.add('animate-pop-in');
    loadAdminData();
  } else {
    alert("รหัสผ่านไม่ถูกต้อง");
  }
}

function logoutAdmin() {
  document.getElementById('adminDashboard').classList.add('hidden');
  document.getElementById('adminPassword').value = '';
}

async function loadAdminData() {
  const { data, error } = await _supabase
    .from('student_surveys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    alert('ไม่สามารถดึงข้อมูลได้: ' + error.message);
    return;
  }

  fetchedDataset = data || [];
  renderDashboard(fetchedDataset);
}

function renderDashboard(dataList) {
  const tbody = document.getElementById('dataTable');
  document.getElementById('recordCount').innerText = dataList.length;
  tbody.innerHTML = '';

  dataList.forEach((row) => {
    const formattedDate = new Date(row.created_at).toLocaleString('th-TH');
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50/80 transition-colors duration-150";
    tr.innerHTML = `
      <td class="py-3.5 px-4 border-b border-slate-100 text-slate-400 font-mono text-xs">${row.id}</td>
      <td class="py-3.5 px-4 border-b border-slate-100">${row.gender || '-'}</td>
      <td class="py-3.5 px-4 border-b border-slate-100 font-medium text-slate-800">${row.fullname}</td>
      <td class="py-3.5 px-4 border-b border-slate-100">${row.grade}</td>
      <td class="py-3.5 px-4 border-b border-slate-100 font-semibold text-indigo-700">${row.favorite_subject}</td>
      <td class="py-3.5 px-4 border-b border-slate-100 text-xs text-slate-500">${formattedDate}</td>
      <td class="py-3.5 px-4 border-b border-slate-100 text-center">
        <button onclick="deleteRow(${row.id})" class="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium text-xs active:scale-95 transition-all duration-150 cursor-pointer">ลบ</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function deleteRow(id) {
  if (confirm(`ยืนยันการลบรายการ ID: ${id}?`)) {
    const { error } = await _supabase
      .from('student_surveys')
      .delete()
      .eq('id', id);

    if (error) {
      alert('ลบข้อมูลไม่สำเร็จ: ' + error.message);
    } else {
      loadAdminData();
    }
  }
}

function exportToCSV() {
  if (fetchedDataset.length === 0) {
    alert('ไม่มีข้อมูลสำหรับ Export');
    return;
  }
  let csvContent = "\uFEFFID,เพศ,ชื่อ-นามสกุล,ระดับชั้น,วิชาที่ชอบ,เวลาที่บันทึก\n";
  fetchedDataset.forEach((row) => {
    csvContent += `${row.id},"${row.gender || ''}","${row.fullname}","${row.grade}","${row.favorite_subject}","${row.created_at}"\n`;
  });
  
  downloadBlob(csvContent, 'student_favorite_subjects_supabase.csv', 'text/csv;charset=utf-8;');
}

function generateIpynbFile() {
  const notebookData = {
    cells: [
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "# รายงานการวิเคราะห์วิทยาศาสตร์ข้อมูล: วิชาที่ชอบเรียน\n",
          "**จัดทำโดย:** กลุ่มโปรเจกต์วิทยาศาสตร์ข้อมูลโรงเรียน  \n",
          "**ที่มาของข้อมูล:** ระบบฐานข้อมูล Supabase Realtime Database"
        ]
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          "# 1. นำเข้าคลังไลบรารีที่จำเป็น\n",
          "import pandas as pd\n",
          "import matplotlib.pyplot as plt\n",
          "import seaborn as sns\n",
          "\n",
          "# ตั้งค่ารูปแบบกราฟ\n",
          "sns.set_theme(style='whitegrid')"
        ]
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          "# 2. อ่านข้อมูลจาก CSV (ที่ Export จากระบบ Supabase Admin)\n",
          "df = pd.read_csv('student_favorite_subjects_supabase.csv')\n",
          "print('--- แสดงตัวอย่างข้อมูล 5 แถวแรก ---')\n",
          "df.head()"
        ]
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          "# 3. ตรวจสอบคุณภาพข้อมูล (Data Cleaning & Quality Check)\n",
          "print('ตรวจสอบค่าสูญหาย:')\n",
          "print(df.isnull().sum())\n",
          "\n",
          "print('\\nตรวจสอบข้อมูลซ้ำซ้อน:', df.duplicated(subset=['ชื่อ-นามสกุล']).sum())\n",
          "# ลบข้อมูลซ้ำถ้ามี\n",
          "df = df.drop_duplicates(subset=['ชื่อ-นามสกุล'])"
        ]
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          "# 4. สรุปความถี่รายวิชา\n",
          "subject_counts = df['วิชาที่ชอบ'].value_counts()\n",
          "print('--- จำนวนนักเรียนจำแนกตามวิชาที่ชอบ ---')\n",
          "print(subject_counts)"
        ]
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          "# 5. สร้างกราฟแท่งแสดงวิชาที่ชอบเรียนมากที่สุด\n",
          "plt.figure(figsize=(10, 6))\n",
          "ax = sns.countplot(data=df, y='วิชาที่ชอบ', order=df['วิชาที่ชอบ'].value_counts().index, palette='viridis')\n",
          "plt.title('จำนวนนักเรียนจำแนกตามวิชาที่ชอบเรียน', fontsize=14, fontweight='bold')\n",
          "plt.xlabel('จำนวนนักเรียน (คน)')\n",
          "plt.ylabel('วิชาที่ชอบ')\n",
          "\n",
          "for p in ax.patches:\n",
          "    ax.annotate(f'{int(p.get_width())}', (p.get_width() + 0.2, p.get_y() + p.get_height() / 2.), va='center')\n",
          "\n",
          "plt.tight_layout()\n",
          "plt.show()"
        ]
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          "# 6. วิเคราะห์เปรียบเทียบวิชาที่ชอบตามระดับชั้น (Cross-tabulation)\n",
          "crosstab_data = pd.crosstab(df['ระดับชั้น'], df['วิชาที่ชอบ'])\n",
          "crosstab_data.plot(kind='bar', stacked=True, figsize=(12, 6), colormap='Accent')\n",
          "plt.title('สัดส่วนวิชาที่ชอบเรียนจำแนกตามระดับชั้น', fontsize=14, fontweight='bold')\n",
          "plt.xlabel('ระดับชั้น')\n",
          "plt.ylabel('จำนวนนักเรียน (คน)')\n",
          "plt.legend(title='วิชาที่ชอบ', bbox_to_anchor=(1.05, 1))\n",
          "plt.tight_layout()\n",
          "plt.show()"
        ]
      }
    ],
    metadata: {
      language_info: { name: "python" }
    },
    nbformat: 4,
    nbformat_minor: 2
  };

  const jsonString = JSON.stringify(notebookData, null, 2);
  downloadBlob(jsonString, 'student_favorite_subjects_analysis.ipynb', 'application/json');
}

function downloadBlob(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
