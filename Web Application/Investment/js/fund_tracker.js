// Global Variables
let transactions = [];
let currentEditIndex = -1;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const importBtn = document.getElementById('importBtn');
const exportBtn = document.getElementById('exportBtn');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const transactionModal = document.getElementById('transactionModal');
const transactionForm = document.getElementById('transactionForm');
const closeModal = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const transactionTableBody = document.getElementById('transactionTableBody');
const portfolioCards = document.getElementById('portfolioCards');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadSampleData();
});

function initializeApp() {
    // Event Listeners
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileImport);
    exportBtn.addEventListener('click', exportToExcel);
    addTransactionBtn.addEventListener('click', openModal);
    closeModal.addEventListener('click', closeModalFunc);
    cancelBtn.addEventListener('click', closeModalFunc);
    transactionForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', filterTransactions);
    filterType.addEventListener('change', filterTransactions);
    
    // Modal close on outside click
    transactionModal.addEventListener('click', (e) => {
        if (e.target === transactionModal) closeModalFunc();
    });
    
    // Auto-calculate total amount
    const unitsInput = document.getElementById('units');
    const priceInput = document.getElementById('pricePerUnit');
    const totalInput = document.getElementById('totalAmount');
    
    function calculateTotal() {
        const units = parseFloat(unitsInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        totalInput.value = (units * price).toFixed(2);
    }
    
    unitsInput.addEventListener('input', calculateTotal);
    priceInput.addEventListener('input', calculateTotal);
}

function loadSampleData() {
    // Load sample data for demonstration
    transactions = [
        {
            id: generateId(),
            fundCode: 'K-TNZ-ThaiESG',
            fundName: 'K Target Net Zero Thai Equity Fund',
            transactionType: 'BUY',
            transactionDate: '2024-01-15',
            units: 1000.0000,
            pricePerUnit: 10.5000,
            totalAmount: 10500.00,
            notes: 'การลงทุนครั้งแรก'
        },
        {
            id: generateId(),
            fundCode: 'SCBTM(ThaiESGA)',
            fundName: 'SCB Thai Sustainable Mixed Fund',
            transactionType: 'BUY',
            transactionDate: '2024-02-10',
            units: 500.0000,
            pricePerUnit: 12.2500,
            totalAmount: 6125.00,
            notes: 'เพิ่มการลงทุนในกองทุนผสม'
        },
        {
            id: generateId(),
            fundCode: 'K-TNZ-ThaiESG',
            fundName: 'K Target Net Zero Thai Equity Fund',
            transactionType: 'BUY',
            transactionDate: '2024-03-05',
            units: 500.0000,
            pricePerUnit: 11.0000,
            totalAmount: 5500.00,
            notes: 'ซื้อเพิ่มเติม'
        }
    ];
    
    updateDisplay();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function openModal(editIndex = -1) {
    currentEditIndex = editIndex;
    transactionModal.style.display = 'block';
    
    if (editIndex >= 0) {
        // Editing mode
        const transaction = transactions[editIndex];
        document.getElementById('fundCode').value = transaction.fundCode;
        document.getElementById('fundName').value = transaction.fundName;
        document.getElementById('transactionType').value = transaction.transactionType;
        document.getElementById('transactionDate').value = transaction.transactionDate;
        document.getElementById('units').value = transaction.units;
        document.getElementById('pricePerUnit').value = transaction.pricePerUnit;
        document.getElementById('totalAmount').value = transaction.totalAmount;
        document.getElementById('notes').value = transaction.notes || '';
        
        document.querySelector('.modal-content h2').textContent = '✏️ แก้ไขรายการซื้อขาย';
    } else {
        // Adding mode
        transactionForm.reset();
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        document.querySelector('.modal-content h2').textContent = '📝 เพิ่มรายการซื้อขายใหม่';
    }
}

function closeModalFunc() {
    transactionModal.style.display = 'none';
    transactionForm.reset();
    currentEditIndex = -1;
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(transactionForm);
    const transaction = {
        id: currentEditIndex >= 0 ? transactions[currentEditIndex].id : generateId(),
        fundCode: formData.get('fundCode').trim().toUpperCase(),
        fundName: formData.get('fundName').trim(),
        transactionType: formData.get('transactionType'),
        transactionDate: formData.get('transactionDate'),
        units: parseFloat(formData.get('units')),
        pricePerUnit: parseFloat(formData.get('pricePerUnit')),
        totalAmount: parseFloat(formData.get('totalAmount')),
        notes: formData.get('notes').trim()
    };
    
    // Validation
    if (!transaction.fundCode || !transaction.fundName || !transaction.transactionDate ||
        !transaction.units || !transaction.pricePerUnit || !transaction.totalAmount) {
        showMessage('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
    }
    
    if (currentEditIndex >= 0) {
        transactions[currentEditIndex] = transaction;
        showMessage('แก้ไขรายการเรียบร้อยแล้ว', 'success');
    } else {
        transactions.push(transaction);
        showMessage('เพิ่มรายการใหม่เรียบร้อยแล้ว', 'success');
    }
    
    updateDisplay();
    closeModalFunc();
}

function deleteTransaction(index) {
    if (confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
        transactions.splice(index, 1);
        updateDisplay();
        showMessage('ลบรายการเรียบร้อยแล้ว', 'success');
    }
}

function updateDisplay() {
    updateTable();
    updateSummaryCards();
    updatePortfolioSummary();
}

function updateTable() {
    let filteredTransactions = filterTransactionsData();
    
    transactionTableBody.innerHTML = '';
    
    filteredTransactions.forEach((transaction, index) => {
        const originalIndex = transactions.indexOf(transaction);
        const row = document.createElement('tr');
        row.className = `transaction-${transaction.transactionType.toLowerCase()}`;
        
        row.innerHTML = `
            <td>${formatDate(transaction.transactionDate)}</td>
            <td><strong>${transaction.fundCode}</strong></td>
            <td>${transaction.fundName}</td>
            <td>
                <span class="badge ${transaction.transactionType === 'BUY' ? 'badge-success' : 'badge-danger'}">
                    ${transaction.transactionType === 'BUY' ? '🟢 ซื้อ' : '🔴 ขาย'}
                </span>
            </td>
            <td>${formatNumber(transaction.units, 4)}</td>
            <td>฿${formatNumber(transaction.pricePerUnit, 4)}</td>
            <td><strong>฿${formatNumber(transaction.totalAmount, 2)}</strong></td>
            <td>${transaction.notes || '-'}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="openModal(${originalIndex})" title="แก้ไข">
                    ✏️
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${originalIndex})" title="ลบ">
                    🗑️
                </button>
            </td>
        `;
        
        transactionTableBody.appendChild(row);
    });
}

function updateSummaryCards() {
    const totalInvestment = transactions
        .filter(t => t.transactionType === 'BUY')
        .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const totalSales = transactions
        .filter(t => t.transactionType === 'SELL')
        .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const uniqueFunds = [...new Set(transactions.map(t => t.fundCode))].length;
    
    document.getElementById('totalValue').textContent = `฿${formatNumber(totalInvestment, 2)}`;
    document.getElementById('totalPnL').textContent = `฿${formatNumber(totalSales - totalInvestment, 2)}`;
    document.getElementById('fundCount').textContent = `${uniqueFunds} กองทุน`;
}

function updatePortfolioSummary() {
    const fundSummary = {};
    
    // Calculate holdings for each fund
    transactions.forEach(transaction => {
        const { fundCode, fundName, transactionType, units, totalAmount } = transaction;
        
        if (!fundSummary[fundCode]) {
            fundSummary[fundCode] = {
                fundName,
                totalUnits: 0,
                totalInvestment: 0,
                totalSales: 0,
                averageCost: 0
            };
        }
        
        if (transactionType === 'BUY') {
            fundSummary[fundCode].totalUnits += units;
            fundSummary[fundCode].totalInvestment += totalAmount;
        } else {
            fundSummary[fundCode].totalUnits -= units;
            fundSummary[fundCode].totalSales += totalAmount;
        }
    });
    
    // Calculate average cost
    Object.keys(fundSummary).forEach(fundCode => {
        const fund = fundSummary[fundCode];
        if (fund.totalUnits > 0) {
            fund.averageCost = fund.totalInvestment / fund.totalUnits;
        }
    });
    
    // Display portfolio cards
    portfolioCards.innerHTML = '';
    
    Object.keys(fundSummary).forEach(fundCode => {
        const fund = fundSummary[fundCode];
        
        if (fund.totalUnits > 0) { // Only show funds with current holdings
            const card = document.createElement('div');
            card.className = 'fund-card';
            
            const netInvestment = fund.totalInvestment - fund.totalSales;
            const currentValue = fund.totalUnits * fund.averageCost; // This would be current market value in real scenario
            
            card.innerHTML = `
                <h3>${fundCode}</h3>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">${fund.fundName}</p>
                <div class="fund-stats">
                    <div class="stat">
                        <span>จำนวนหน่วย:</span>
                        <span>${formatNumber(fund.totalUnits, 4)}</span>
                    </div>
                    <div class="stat">
                        <span>ต้นทุนเฉลี่ย:</span>
                        <span>฿${formatNumber(fund.averageCost, 4)}</span>
                    </div>
                    <div class="stat">
                        <span>เงินลงทุนรวม:</span>
                        <span>฿${formatNumber(fund.totalInvestment, 2)}</span>
                    </div>
                    <div class="stat">
                        <span>เงินขายรวม:</span>
                        <span>฿${formatNumber(fund.totalSales, 2)}</span>
                    </div>
                    <div class="stat">
                        <span>มูลค่าปัจจุบัน:</span>
                        <span class="${netInvestment >= 0 ? 'positive' : 'negative'}">
                            ฿${formatNumber(netInvestment, 2)}
                        </span>
                    </div>
                </div>
            `;
            
            portfolioCards.appendChild(card);
        }
    });
}

function filterTransactionsData() {
    let filtered = transactions;
    
    // Filter by search term
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.fundCode.toLowerCase().includes(searchTerm) ||
            t.fundName.toLowerCase().includes(searchTerm) ||
            t.notes.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by transaction type
    const typeFilter = filterType.value;
    if (typeFilter !== 'ALL') {
        filtered = filtered.filter(t => t.transactionType === typeFilter);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
    
    return filtered;
}

function filterTransactions() {
    updateTable();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Convert imported data to transaction format
            const importedTransactions = jsonData.map(row => ({
                id: generateId(),
                fundCode: row['รหัสกองทุน'] || row['Fund Code'] || '',
                fundName: row['ชื่อกองทุน'] || row['Fund Name'] || '',
                transactionType: row['ประเภท'] || row['Type'] || 'BUY',
                transactionDate: formatDateForInput(row['วันที่'] || row['Date'] || ''),
                units: parseFloat(row['จำนวนหน่วย'] || row['Units'] || 0),
                pricePerUnit: parseFloat(row['ราคาต่อหน่วย'] || row['Price'] || 0),
                totalAmount: parseFloat(row['จำนวนเงิน'] || row['Amount'] || 0),
                notes: row['หมายเหตุ'] || row['Notes'] || ''
            })).filter(t => t.fundCode && t.fundName); // Filter out invalid rows
            
            if (importedTransactions.length > 0) {
                transactions = [...transactions, ...importedTransactions];
                updateDisplay();
                showMessage(`นำเข้าข้อมูล ${importedTransactions.length} รายการเรียบร้อยแล้ว`, 'success');
            } else {
                showMessage('ไม่พบข้อมูลที่ถูกต้องในไฟล์', 'error');
            }
            
        } catch (error) {
            console.error('Error importing file:', error);
            showMessage('เกิดข้อผิดพลาดในการนำเข้าไฟล์', 'error');
        }
    };
    
    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Reset file input
}

function exportToExcel() {
    if (transactions.length === 0) {
        showMessage('ไม่มีข้อมูลให้ส่งออก', 'error');
        return;
    }
    
    // Prepare data for export
    const exportData = transactions.map(t => ({
        'วันที่': formatDate(t.transactionDate),
        'รหัสกองทุน': t.fundCode,
        'ชื่อกองทุน': t.fundName,
        'ประเภท': t.transactionType === 'BUY' ? 'ซื้อ' : 'ขาย',
        'จำนวนหน่วย': t.units,
        'ราคาต่อหน่วย': t.pricePerUnit,
        'จำนวนเงิน': t.totalAmount,
        'หมายเหตุ': t.notes || ''
    }));
    
    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายการซื้อขายกองทุน');
    
    // Set column widths
    const colWidths = [
        { wch: 12 }, // วันที่
        { wch: 20 }, // รหัสกองทุน
        { wch: 40 }, // ชื่อกองทุน
        { wch: 10 }, // ประเภท
        { wch: 15 }, // จำนวนหน่วย
        { wch: 15 }, // ราคาต่อหน่วย
        { wch: 15 }, // จำนวนเงิน
        { wch: 30 }  // หมายเหตุ
    ];
    ws['!cols'] = colWidths;
    
    // Generate filename with current date
    const now = new Date();
    const filename = `รายการซื้อขายกองทุน_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
    showMessage('ส่งออกไฟล์เรียบร้อยแล้ว', 'success');
}

// Utility Functions
function formatNumber(num, decimals = 2) {
    return new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    try {
        // Handle various date formats
        let date;
        if (typeof dateString === 'number') {
            // Excel serial date
            date = new Date((dateString - 25569) * 86400 * 1000);
        } else {
            date = new Date(dateString);
        }
        
        if (isNaN(date.getTime())) return '';
        
        return date.toISOString().split('T')[0];
    } catch (error) {
        return '';
    }
}

function showMessage(text, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Insert at the top of container
    const container = document.querySelector('.container');
    container.insertBefore(message, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 5000);
}

// Add styles for small buttons and badges
const additionalStyles = `
    .btn-sm {
        padding: 6px 12px;
        font-size: 12px;
        margin: 0 2px;
    }
    
    .badge {
        padding: 4px 6px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .badge-success {
        background-color: #d4edda;
        color: #155724;
    }
    
    .badge-danger {
        background-color: #f8d7da;
        color: #721c24;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);