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

window.addEventListener('click', function(e) {
  if (!e.target.closest('.custom-select-container')) {
    closeAllDropdowns();
  }
});

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

async function loginAdmin() {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;

  const { data, error } = await _supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
  } else {
    closeAdminModal();
    const dashboard = document.getElementById('adminDashboard');
    dashboard.classList.remove('hidden');
    dashboard.classList.remove('animate-pop-in');
    void dashboard.offsetWidth;
    dashboard.classList.add('animate-pop-in');
    loadAdminData();
  }
}

async function logoutAdmin() {
  await _supabase.auth.signOut();
  document.getElementById('adminDashboard').classList.add('hidden');
  document.getElementById('adminEmail').value = '';
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
          "# 🧪 ใบงานการทดลอง (Labsheet): การวิเคราะห์ข้อมูลความสนใจในรายวิชาของนักเรียน\n",
          "**รายวิชา:** วิทยาศาสตร์ข้อมูลและการวิเคราะห์ (Data Science & Analytics)  \n",
          "**แหล่งข้อมูล:** ฐานข้อมูลแบบ Realtime ผ่าน Supabase Data Collection System  \n",
          "---\n",
          "### 🎯 วัตถุประสงค์การทดลอง\n",
          "1. **การนำเข้าข้อมูล (Data Ingestion):** อ่านข้อมูลไฟล์ CSV จากระบบสำรวจออนไลน์  \n",
          "2. **การทำความสะอาดข้อมูล (Data Cleaning):** ตรวจสอบค่าสูญหายและลบรายการข้อมูลที่ซ้ำซ้อน  \n",
          "3. **การวิเคราะห์สถิติ (Data Analysis):** แยกข้อความและคำนวณความถี่ข้อมูลจำแนกตามเพศและระดับชั้น  \n",
          "4. **การนำเสนอด้วยภาพ (Data Visualization):** สร้างกราฟสถิติที่แสดงผลภาษาไทยได้อย่างถูกต้อง"
        ]
      },
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "## 📌 ขั้นตอนที่ 1: การเตรียมสภาพแวดล้อม และนำเข้าไลบรารี (Environment Setup)\n",
          "ดาวน์โหลดฟอนต์ภาษาไทย (TH Sarabun New) และนำเข้าไลบรารี `pandas`, `matplotlib`, `seaborn`"
        ]
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          "!wget -q https://github.com/Phonbopit/sarabun-webfont/raw/master/fonts/thsarabunnew-webfont.ttf\n",
          "\n",
          "import pandas as pd\n",
          "import matplotlib as mpl\n",
          "import matplotlib.pyplot as plt\n",
          "import seaborn as sns\n",
          "\n",
          "# ตั้งค่าฟอนต์ภาษาไทยให้ Matplotlib และ Seaborn\n",
          "mpl.font_manager.fontManager.addfont('thsarabunnew-webfont.ttf')\n",
          "mpl.rc('font', family='TH Sarabun New', size=14)\n",
          "sns.set_theme(style='whitegrid', rc={'font.family': 'TH Sarabun New'})\n",
          "\n",
          "print('ตั้งค่าฟอนต์ภาษาไทยและนำเข้าไลบรารีสำเร็จ!')"
        ]
      },
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "## 📌 ขั้นตอนที่ 2: การนำเข้าข้อมูล (Data Ingestion)\n",
          "โหลดไฟล์ CSV ที่ Export มาจากระบบ Admin เข้าสู่ Pandas DataFrame"
        ]
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          "df = pd.read_csv('student_favorite_subjects_supabase.csv')\n",
          "\n",
          "print('--- ตัวอย่างข้อมูล 5 แถวแรก ---')\n",
          "display(df.head())\n",
          "\n",
          "print('\\n--- รายละเอียดประเภทข้อมูลและขนาด ---')\n",
          "df.info()"
        ]
      },
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "## 📌 ขั้นตอนที่ 3: การสำรวจและทำความสะอาดข้อมูล (Data Exploration & Cleaning)\n",
          "ตรวจสอบค่าที่หายไป (Missing Values) และกรองรายการชื่อซ้ำออก"
        ]
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          "print('จำนวนค่าว่าง (Null Count):')\n",
          "print(df.isnull().sum())\n",
          "\n",
          "before_clean = len(df)\n",
          "df = df.drop_duplicates(subset=['ชื่อ-นามสกุล'], keep='last')\n",
          "after_clean = len(df)\n",
          "\n",
          "print(f'\\nจำนวนข้อมูลก่อนคลีน: {before_clean} แถว | หลังคลีน: {after_clean} แถว')"
        ]
      },
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "## 📌 ขั้นตอนที่ 4: การประมวลผลและการวิเคราะห์ข้อมูล (Data Processing)\n",
          "แยกรายวิชาที่คั่นด้วยเครื่องหมายลูกน้ำ (,) ออกเป็นรายวิชาเดี่ยวเพื่อคำนวณความนิยม"
        ]
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          "# แยกข้อมูลกรณีที่กรอกหลายวิชา (คั่นด้วยเครื่องหมายจุลภาค)\n",
          "df['วิชาที่ชอบ'] = df['วิชาที่ชอบ'].astype(str).str.split(',')\n",
          "df_exploded = df.explode('วิชาที่ชอบ')\n",
          "# ลบช่องว่างส่วนเกินที่อาจติดมาระหว่างการแยกข้อความ\n",
          "df_exploded['วิชาที่ชอบ'] = df_exploded['วิชาที่ชอบ'].str.strip()\n",
          "\n",
          "subject_counts = df_exploded['วิชาที่ชอบ'].value_counts().reset_index()\n",
          "subject_counts.columns = ['วิชาที่ชอบ', 'จำนวน (คน)']\n",
          "display(subject_counts)\n",
          "\n",
          "crosstab_result = pd.crosstab(df_exploded['ระดับชั้น'], df_exploded['วิชาที่ชอบ'], margins=True, margins_name='รวม')\n",
          "display(crosstab_result)"
        ]
      },
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "## 📌 ขั้นตอนที่ 5: การนำเสนอผลด้วยแผนภาพ (Data Visualization)\n",
          "แสดงแผนภาพสรุปอันดับรายวิชายอดนิยม และเปรียบเทียบตามระดับชั้น"
        ]
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          "plt.figure(figsize=(10, 5))\n",
          "ax = sns.barplot(data=subject_counts, x='จำนวน (คน)', y='วิชาที่ชอบ', palette='mako')\n",
          "plt.title('อันดับรายวิชาที่นักเรียนชอบเรียนมากที่สุด', fontsize=16, fontweight='bold', pad=15)\n",
          "plt.xlabel('จำนวนนักเรียน (คน)', fontsize=12)\n",
          "plt.ylabel('รายวิชา', fontsize=12)\n",
          "\n",
          "for p in ax.patches:\n",
          "    val = int(p.get_width())\n",
          "    if val > 0:\n",
          "        ax.annotate(f'{val} คน', (val + 0.1, p.get_y() + p.get_height() / 2.), va='center')\n",
          "\n",
          "plt.tight_layout()\n",
          "plt.show()\n",
          "\n",
          "plt.figure(figsize=(12, 6))\n",
          "sns.countplot(data=df_exploded, x='ระดับชั้น', hue='วิชาที่ชอบ', palette='Set2')\n",
          "plt.title('วิชาที่ชอบจำแนกตามระดับชั้นการศึกษา', fontsize=16, fontweight='bold', pad=15)\n",
          "plt.xlabel('ระดับชั้น', fontsize=12)\n",
          "plt.ylabel('จำนวนนักเรียน (คน)', fontsize=12)\n",
          "plt.legend(title='รายวิชา', bbox_to_anchor=(1.05, 1), loc='upper left')\n",
          "plt.tight_layout()\n",
          "plt.show()"
        ]
      },
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "## 📌 ขั้นตอนที่ 6: สรุปผลการทดลอง (Conclusion)\n",
          "- **สรุปผลวิเคราะห์:** จากการประมวลผลข้อมูล สามารถระบุอันดับวิชาที่นักเรียนให้ความสนใจมากที่สุดได้อย่างชัดเจน  \n",
          "- **ประโยชน์และการนำไปใช้:** ข้อมูลนี้สามารถนำไปใช้วางแผนจัดตารางเรียน คอร์สเสริม หรือกิจกรรมชมรมให้สอดคล้องกับความต้องการของนักเรียน"
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
