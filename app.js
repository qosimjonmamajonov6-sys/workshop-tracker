// App State
let transactions = [];
let employees = [];
let employeeActions = [];
let incomeExpenseChart = null;
let dailyTrendChart = null;
let currentRange = 'all';
let editingId = null;
let editingEmpId = null;
let currentView = 'dashboard';

// DOM Elements
const balanceEl = document.getElementById('total-balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const searchInput = document.getElementById('search-input');
const currentDateEl = document.getElementById('current-date');
const dateFilters = document.getElementById('date-filters');
const mainNav = document.getElementById('main-nav');
const dashboardView = document.getElementById('dashboard-view');
const employeesView = document.getElementById('employees-view');

// Employee Elements
const employeeForm = document.getElementById('employee-form');
const employeeList = document.getElementById('employee-list');
const attendanceForm = document.getElementById('attendance-form');
const empActionList = document.getElementById('emp-action-list');
const attEmpSelect = document.getElementById('att-emp-select');
const attTypeSelect = document.getElementById('att-type');
const attLabel = document.getElementById('att-label');
const attValue = document.getElementById('att-value');

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initCharts();
    updateUI();
    setCurrentDate();
    setupEventListeners();
});

function loadData() {
    const storedTx = localStorage.getItem('workshop_transactions');
    transactions = storedTx ? JSON.parse(storedTx) : [];
    
    const storedEmp = localStorage.getItem('workshop_employees');
    employees = storedEmp ? JSON.parse(storedEmp) : [];
    
    const storedActions = localStorage.getItem('workshop_emp_actions');
    employeeActions = storedActions ? JSON.parse(storedActions) : [];
}

function saveData() {
    localStorage.setItem('workshop_transactions', JSON.stringify(transactions));
    localStorage.setItem('workshop_employees', JSON.stringify(employees));
    localStorage.setItem('workshop_emp_actions', JSON.stringify(employeeActions));
}

function setupEventListeners() {
    try {
        // Nav Switching
        if (mainNav) {
            mainNav.querySelectorAll('.nav-item').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = link.dataset.section;
                    if (section) switchView(section);
                });
            });
        }

        // Date Range Filters
        if (dateFilters) {
            dateFilters.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const activeBtn = dateFilters.querySelector('.active');
                    if (activeBtn) activeBtn.classList.remove('active');
                    btn.classList.add('active');
                    currentRange = btn.dataset.range;
                    updateUI(searchInput ? searchInput.value : '');
                });
            });
        }

        // Search Filter
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                updateUI(e.target.value);
            });
        }

        // Employee Form
        if (employeeForm) {
            employeeForm.addEventListener('submit', handleEmployeeSubmit);
        } else {
            console.error("Employee form topilmadi!");
        }
        
        // Attendance/Action Form
        if (attendanceForm) {
            attendanceForm.addEventListener('submit', handleAttendanceSubmit);
        }

        // Attendance Type Change
        if (attTypeSelect) {
            attTypeSelect.addEventListener('change', () => {
                if (attTypeSelect.value === 'work') {
                    if (attLabel) attLabel.innerText = 'Qiymat (Soat/Kun)';
                    if (attValue) attValue.placeholder = '0';
                } else {
                    if (attLabel) attLabel.innerText = 'Summa (UZS)';
                    if (attValue) attValue.placeholder = 'Summani kiriting';
                }
            });
        }
    } catch (err) {
        console.error("SetupEventListeners xatosi:", err);
    }
}

function switchView(section) {
    currentView = section;
    
    // Update Nav
    mainNav.querySelectorAll('.nav-item').forEach(link => {
        link.classList.toggle('active', link.dataset.section === section);
    });

    // Update Header
    document.querySelector('.top-bar h1').innerText = 
        section === 'dashboard' ? 'Boshqaruv Paneli' : 
        section === 'employees' ? 'Ishchilar Bo\'limi' : 'Hisobotlar';

    // Show/Hide Sections
    dashboardView.style.display = section === 'dashboard' ? 'block' : 'none';
    employeesView.style.display = section === 'employees' ? 'block' : 'none';

    if (section === 'dashboard') {
        updateUI();
    } else if (section === 'employees') {
        renderEmployees();
        renderEmployeeActions();
        populateEmployeeSelect();
    }
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: 'UZS',
        minimumFractionDigits: 0
    }).format(amount);
}

function setCurrentDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.innerText = `Bugun: ${now.toLocaleDateString('uz-UZ', options)}`;
}

// --- Transaction Functions ---

function isTransactionInRange(dateStr) {
    if (currentRange === 'all') return true;
    const tDate = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (currentRange === 'today') return tDate >= startOfToday;
    if (currentRange === 'week') {
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        return tDate >= startOfWeek;
    }
    if (currentRange === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return tDate >= startOfMonth;
    }
    return true;
}

function updateUI(searchFilter = '') {
    const filteredByDate = transactions.filter(t => isTransactionInRange(t.date));
    const filtered = filteredByDate.filter(t => 
        t.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.category.toLowerCase().includes(searchFilter.toLowerCase())
    );

    const income = filteredByDate.filter(t => t.type === 'kirim').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = filteredByDate.filter(t => t.type === 'chiqim').reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = income - expense;

    balanceEl.innerText = formatCurrency(balance);
    incomeEl.innerText = formatCurrency(income);
    expenseEl.innerText = formatCurrency(expense);

    renderTransactions(filtered);
    if (incomeExpenseChart) updateCharts(filteredByDate);
}

function renderTransactions(list) {
    transactionList.innerHTML = '';
    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sorted.length === 0) {
        transactionList.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Ma\'lumotlar mavjud emas</td></tr>';
        return;
    }

    sorted.forEach(t => {
        const row = document.createElement('tr');
        row.className = `tr-${t.type} ${editingId === t.id ? 'edit-mode' : ''}`;
        row.innerHTML = `
            <td>${new Date(t.date).toLocaleDateString('uz-UZ')}</td>
            <td style="font-weight: 500;">${t.description}</td>
            <td><span class="category-tag">${t.category}</span></td>
            <td class="amount-cell">${t.type === 'kirim' ? '+' : '-'} ${formatCurrency(t.amount).replace('UZS', '')}</td>
            <td style="text-align: right;">
                <button class="btn-edit" onclick="editTransaction('${t.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteTransaction('${t.id}')"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        transactionList.appendChild(row);
    });
}

// --- Employee Functions ---

function handleEmployeeSubmit(e) {
    e.preventDefault();
    try {
        const nameInput = document.getElementById('emp-name');
        const typeInput = document.getElementById('emp-type');
        const rateInput = document.getElementById('emp-rate');

        if (!nameInput || !typeInput || !rateInput) {
            console.error("Forma elementlari topilmadi!");
            return;
        }

        const name = nameInput.value.trim();
        const type = typeInput.value;
        const rate = parseFloat(rateInput.value);

        if (!name || isNaN(rate)) {
            alert("Iltimos, barcha maydonlarni to'g'ri to'ldiring!");
            return;
        }

        if (editingEmpId) {
            const index = employees.findIndex(emp => emp.id === editingEmpId);
            if (index !== -1) {
                employees[index] = { ...employees[index], name, type, rate };
            }
            editingEmpId = null;
            const submitBtn = document.getElementById('emp-submit-btn');
            if (submitBtn) submitBtn.innerText = 'Ishchini Qo\'shish';
        } else {
            const newEmp = {
                id: Date.now().toString(),
                name,
                type,
                rate,
                balance: 0
            };
            employees.push(newEmp);
        }

        saveData();
        renderEmployees();
        populateEmployeeSelect();
        employeeForm.reset();
        console.log("Ishchi muvaffaqiyatli saqlandi:", name);
    } catch (err) {
        console.error("handleEmployeeSubmit xatosi:", err);
        alert("Ishchini saqlashda xatolik yuz berdi.");
    }
}

function renderEmployees() {
    employeeList.innerHTML = '';
    employees.forEach(emp => {
        const row = document.createElement('tr');
        const balanceClass = emp.balance >= 0 ? 'balance-positive' : 'balance-negative';
        row.innerHTML = `
            <td style="font-weight: 600;">${emp.name}</td>
            <td>${emp.type === 'hourly' ? 'Soatbay' : 'Kunbay'}</td>
            <td>${formatCurrency(emp.rate)}</td>
            <td class="${balanceClass}">${formatCurrency(emp.balance)}</td>
            <td style="text-align: right;">
                <button class="btn-edit" onclick="editEmployee('${emp.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteEmployee('${emp.id}')"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        employeeList.appendChild(row);
    });
}

window.editEmployee = (id) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    editingEmpId = id;
    document.getElementById('emp-name').value = emp.name;
    document.getElementById('emp-type').value = emp.type;
    document.getElementById('emp-rate').value = emp.rate;
    document.getElementById('emp-submit-btn').innerText = 'Saqlash';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteEmployee = (id) => {
    if (confirm('Ushbu ishchini o\'chirmoqchimisiz?')) {
        employees = employees.filter(e => e.id !== id);
        saveData();
        renderEmployees();
        populateEmployeeSelect();
    }
};

function populateEmployeeSelect() {
    attEmpSelect.innerHTML = '<option value="">Tanlang...</option>';
    employees.forEach(emp => {
        const opt = document.createElement('option');
        opt.value = emp.id;
        opt.innerText = emp.name;
        attEmpSelect.appendChild(opt);
    });
}

function handleAttendanceSubmit(e) {
    e.preventDefault();
    const empId = attEmpSelect.value;
    const type = attTypeSelect.value;
    const value = parseFloat(attValue.value);

    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    let amount = 0;
    let description = '';

    if (type === 'work') {
        amount = value * emp.rate;
        description = `${value} ${emp.type === 'hourly' ? 'soat' : 'kun'} ish vaqti`;
        emp.balance += amount;
    } else {
        amount = value;
        description = `Avans berildi (${emp.name})`;
        emp.balance -= amount;
        
        // Add to main transactions
        const newTx = {
            id: Date.now().toString(),
            type: 'chiqim',
            description: `Ish haqiga avans: ${emp.name}`,
            amount: amount,
            category: 'Ish haqi',
            date: new Date().toISOString()
        };
        transactions.push(newTx);
    }

    const action = {
        id: Date.now().toString(),
        empId,
        empName: emp.name,
        type,
        value,
        amount: type === 'work' ? amount : -amount,
        description,
        date: new Date().toISOString()
    };

    employeeActions.push(action);
    saveData();
    renderEmployees();
    renderEmployeeActions();
    attendanceForm.reset();
}

function renderEmployeeActions() {
    empActionList.innerHTML = '';
    const sorted = [...employeeActions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

    sorted.forEach(act => {
        const row = document.createElement('tr');
        const amountClass = act.amount >= 0 ? 'balance-positive' : 'balance-negative';
        row.innerHTML = `
            <td>${new Date(act.date).toLocaleDateString('uz-UZ')}</td>
            <td>${act.empName}</td>
            <td>${act.description}</td>
            <td class="${amountClass}">${formatCurrency(Math.abs(act.amount))}</td>
            <td style="text-align: right;">
                <button class="btn-delete" onclick="deleteEmpAction('${act.id}')"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        empActionList.appendChild(row);
    });
}

window.deleteEmpAction = (id) => {
    if (confirm('Ushbu amalni o\'chirmoqchimisiz?')) {
        const act = employeeActions.find(a => a.id === id);
        if (act) {
            const emp = employees.find(e => e.id === act.empId);
            if (emp) {
                emp.balance -= act.amount; // Revert balance
            }
            employeeActions = employeeActions.filter(a => a.id !== id);
            saveData();
            renderEmployees();
            renderEmployeeActions();
        }
    }
};

// --- Charts Logic ---

function initCharts() {
    const canvas1 = document.getElementById('incomeExpenseChart');
    const canvas2 = document.getElementById('dailyTrendChart');
    if (!canvas1 || !canvas2) return;

    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    incomeExpenseChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Kirim', 'Chiqim'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Kirim vs Chiqim', color: '#f8fafc' }
            }
        }
    });

    dailyTrendChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Kirim', data: [], borderColor: '#10b981', tension: 0.4, fill: false },
                { label: 'Chiqim', data: [], borderColor: '#ef4444', tension: 0.4, fill: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Kunlik Trend', color: '#f8fafc' }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateCharts(data) {
    const income = data.filter(t => t.type === 'kirim').reduce((sum, t) => sum + t.amount, 0);
    const expense = data.filter(t => t.type === 'chiqim').reduce((sum, t) => sum + t.amount, 0);
    incomeExpenseChart.data.datasets[0].data = [income, expense];
    incomeExpenseChart.update();

    const dailyData = {};
    data.forEach(t => {
        const day = new Date(t.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
        if (!dailyData[day]) dailyData[day] = { kirim: 0, chiqim: 0 };
        dailyData[day][t.type] += t.amount;
    });

    const labels = Object.keys(dailyData).reverse().slice(-7);
    dailyTrendChart.data.labels = labels;
    dailyTrendChart.data.datasets[0].data = labels.map(l => dailyData[l].kirim);
    dailyTrendChart.data.datasets[1].data = labels.map(l => dailyData[l].chiqim);
    dailyTrendChart.update();
}

// Transaction Add/Edit/Delete
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="type"]:checked').value;
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;

    if (editingId) {
        const index = transactions.findIndex(t => t.id === editingId);
        transactions[index] = { ...transactions[index], type, description, amount, category };
        editingId = null;
        transactionForm.querySelector('.btn-submit').innerText = 'Qo\'shish';
    } else {
        transactions.push({ id: Date.now().toString(), type, description, amount, category, date: new Date().toISOString() });
    }

    saveData();
    updateUI(searchInput.value);
    transactionForm.reset();
});

window.editTransaction = (id) => {
    const t = transactions.find(t => t.id === id);
    if (!t) return;
    editingId = id;
    document.querySelector(`input[name="type"][value="${t.type}"]`).checked = true;
    document.getElementById('description').value = t.description;
    document.getElementById('amount').value = t.amount;
    document.getElementById('category').value = t.category;
    transactionForm.querySelector('.btn-submit').innerText = 'Saqlash';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteTransaction = (id) => {
    if (confirm('O\'chirmoqchimisiz?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        updateUI(searchInput.value);
    }
};
