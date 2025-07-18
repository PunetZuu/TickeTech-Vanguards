// script.js
// Departments data
let departments = [];

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const uploadBtn = document.getElementById('uploadBtn');
const downloadReportBtn = document.getElementById('downloadReportBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const searchInput = document.getElementById('searchInput');
const departmentsContainer = document.getElementById('departmentsContainer');
const sortTicketsBtn = document.getElementById('sortTicketsBtn');
const sortResolutionBtn = document.getElementById('sortResolutionBtn');
const uploadStatus = document.getElementById('uploadStatus');

// Charts
let ticketChart, resolutionChart;
let pdfTicketChart, pdfResolutionChart;

// Login functionality
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'admin123') {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        renderDashboard();
    } else {
        alert('Invalid credentials. Use admin/admin123 for demo.');
    }
});

// Logout functionality
logoutBtn.addEventListener('click', function() {
    dashboard.style.display = 'none';
    loginScreen.style.display = 'flex';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

// File upload functionality
uploadBtn.addEventListener('click', function() {
    fileInput.click();
});

fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    processFile(file);
});

// Drag and drop functionality
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropArea.style.borderColor = '#3b82f6';
    dropArea.style.backgroundColor = '#f0f9ff';
}

function unhighlight() {
    dropArea.style.borderColor = '#cbd5e1';
    dropArea.style.backgroundColor = '';
}

dropArea.addEventListener('drop', function(e) {
    const file = e.dataTransfer.files[0];
    if (file) {
        processFile(file);
    }
});

// Process uploaded file
function processFile(file) {
    uploadStatus.classList.remove('hidden');
    uploadStatus.textContent = `Processing ${file.name}...`;
    uploadStatus.className = 'upload-status status-info';
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
        processCSV(file);
    } else if (fileExtension === 'xml') {
        processXML(file);
    } else {
        uploadStatus.textContent = 'Unsupported file format. Please upload CSV or XML.';
        uploadStatus.className = 'upload-status status-error';
    }
}

// Process CSV files
function processCSV(file) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.errors.length > 0) {
                handleUploadError(`Error processing CSV: ${results.errors[0].message}`);
                return;
            }
            
            if (results.data.length === 0) {
                handleUploadError('No valid data found in CSV file');
                return;
            }
            
            try {
                departments = parseData(results.data);
                renderDashboard();
                handleUploadSuccess(file.name);
            } catch (error) {
                handleUploadError(`Error processing data: ${error.message}`);
            }
        },
        error: function(error) {
            handleUploadError(`Error reading file: ${error.message}`);
        }
    });
}

// Process XML files
function processXML(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
            
            // Extract departments from XML
            const deptNodes = xmlDoc.getElementsByTagName('department');
            if (deptNodes.length === 0) {
                handleUploadError('No department data found in XML file');
                return;
            }
            
            const data = [];
            for (let i = 0; i < deptNodes.length; i++) {
                const dept = deptNodes[i];
                data.push({
                    Department: getXmlValue(dept, 'name'),
                    Tickets: getXmlValue(dept, 'tickets'),
                    Resolution: getXmlValue(dept, 'resolution'),
                    Priority: getXmlValue(dept, 'priority')
                });
            }
            
            departments = parseData(data);
            renderDashboard();
            handleUploadSuccess(file.name);
        } catch (error) {
            handleUploadError(`Error processing XML: ${error.message}`);
        }
    };
    reader.onerror = function() {
        handleUploadError('Error reading XML file');
    };
    reader.readAsText(file);
}

// Helper to get value from XML node
function getXmlValue(parent, tagName) {
    const elements = parent.getElementsByTagName(tagName);
    return elements.length > 0 ? elements[0].textContent : '';
}

// Parse data from any format into standardized department objects
function parseData(rawData) {
    return rawData.map((row, index) => {
        // Map fields from various naming conventions
        const name = row.Department || row.department || row.Name || row.Dept || `Department ${index + 1}`;
        const tickets = parseNumber(row.Tickets || row.tickets || row.Count || row.count);
        const avgResolution = parseNumber(row.Resolution || row.resolution || row.AvgResolution || row.avg_resolution);
        const minResolution = parseNumber(row.MinResolution || row.min_resolution || row.Min || row.min) || 0;
        const maxResolution = parseNumber(row.MaxResolution || row.max_resolution || row.Max || row.max) || avgResolution * 2 || 48;
        const priorityTickets = parseNumber(row.Priority || row.priority || row.HighPriority || row.high_priority) || 0;
        
        return {
            id: index + 1,
            name: name,
            tickets: tickets,
            avgResolution: avgResolution,
            minResolution: minResolution,
            maxResolution: maxResolution,
            priorityTickets: priorityTickets
        };
    });
}

// Helper to parse numbers from strings
function parseNumber(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    
    // Remove commas and non-numeric characters except decimal point
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

// Handle upload success
function handleUploadSuccess(filename) {
    uploadStatus.textContent = `Successfully processed ${filename}! Dashboard updated.`;
    uploadStatus.className = 'upload-status status-success';
}

// Handle upload error
function handleUploadError(message) {
    uploadStatus.textContent = message;
    uploadStatus.className = 'upload-status status-error';
}

// Download Report functionality
downloadReportBtn.addEventListener('click', function() {
    if (departments.length === 0) {
        uploadStatus.classList.remove('hidden');
        uploadStatus.textContent = 'No data available to generate report';
        uploadStatus.className = 'upload-status status-error';
        return;
    }
    
    // Create CSV content with headers
    let csvContent = "Department,Tickets,Avg Resolution (h),Min Resolution (h),Max Resolution (h),Priority Tickets,Status\n";
    
    departments.forEach(dept => {
        // Determine status based on performance
        let status = "Good";
        if (dept.avgResolution < 20) status = "Excellent";
        if (dept.avgResolution > 40) status = "Needs Improvement";
        
        csvContent += `"${dept.name}",${dept.tickets},${dept.avgResolution},${dept.minResolution},${dept.maxResolution},${dept.priorityTickets},"${status}"\n`;
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    // Create filename with timestamp
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    link.setAttribute('download', `ticketech_report_${timestamp}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    uploadStatus.classList.remove('hidden');
    uploadStatus.textContent = 'CSV report downloaded successfully!';
    uploadStatus.className = 'upload-status status-success';
});

// Export PDF functionality
exportPdfBtn.addEventListener('click', function() {
    if (departments.length === 0) {
        uploadStatus.classList.remove('hidden');
        uploadStatus.textContent = 'No data available to generate report';
        uploadStatus.className = 'upload-status status-error';
        return;
    }
    
    // Show processing message
    uploadStatus.classList.remove('hidden');
    uploadStatus.textContent = 'Generating PDF report...';
    uploadStatus.className = 'upload-status status-info';
    
    // Set report date
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('reportDate').textContent = `Generated: ${now.toLocaleDateString('en-US', options)}`;
    
    // Update PDF report stats
    document.getElementById('pdfDeptCount').textContent = departments.length;
    document.getElementById('pdfTotalTickets').textContent = departments.reduce((sum, dept) => sum + dept.tickets, 0).toLocaleString();
    document.getElementById('pdfAvgResolution').textContent = (departments.reduce((sum, dept) => sum + dept.avgResolution, 0) / departments.length).toFixed(1) + 'h';
    document.getElementById('pdfHighPriority').textContent = departments.reduce((sum, dept) => sum + dept.priorityTickets, 0);
    
    // Generate department table for PDF
    const pdfDeptTable = document.getElementById('pdfDeptTable');
    pdfDeptTable.innerHTML = '';
    
    departments.forEach(dept => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        // Determine status based on performance
        let statusClass = '';
        if (dept.avgResolution < 20) statusClass = 'text-green-600 font-medium';
        if (dept.avgResolution > 40) statusClass = 'text-red-600 font-medium';
        
        row.innerHTML = `
            <td class="border py-2 px-4">${dept.name}</td>
            <td class="border py-2 px-4">${dept.tickets}</td>
            <td class="border py-2 px-4 ${statusClass}">${dept.avgResolution}</td>
            <td class="border py-2 px-4">${dept.minResolution}</td>
            <td class="border py-2 px-4">${dept.maxResolution}</td>
            <td class="border py-2 px-4">${dept.priorityTickets}</td>
        `;
        pdfDeptTable.appendChild(row);
    });
    
    // Create charts for PDF report
    createPdfCharts();
    
    // Use html2canvas to capture the report content
    const reportElement = document.getElementById('pdfReport');
    reportElement.classList.remove('hidden');
    
    html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false
    }).then(canvas => {
        reportElement.classList.add('hidden');
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add additional pages if needed
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Save PDF with timestamp
        const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        pdf.save(`ticketech_report_${timestamp}.pdf`);
        
        uploadStatus.textContent = 'PDF report generated successfully!';
        uploadStatus.className = 'upload-status status-success';
    }).catch(error => {
        console.error('Error generating PDF:', error);
        uploadStatus.textContent = 'Error generating PDF report. Please try again.';
        uploadStatus.className = 'upload-status status-error';
        reportElement.classList.add('hidden');
    });
});

// Create charts for PDF report
function createPdfCharts() {
    // Destroy existing charts if they exist
    if (pdfTicketChart) pdfTicketChart.destroy();
    if (pdfResolutionChart) pdfResolutionChart.destroy();
    
    // Tickets by Department chart
    const ticketCtx = document.getElementById('pdfTicketChart').getContext('2d');
    pdfTicketChart = new Chart(ticketCtx, {
        type: 'bar',
        data: {
            labels: departments.map(dept => dept.name),
            datasets: [{
                label: 'Number of Tickets',
                data: departments.map(dept => dept.tickets),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Tickets'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Resolution Time Comparison chart
    const resolutionCtx = document.getElementById('pdfResolutionChart').getContext('2d');
    pdfResolutionChart = new Chart(resolutionCtx, {
        type: 'radar',
        data: {
            labels: departments.map(dept => dept.name),
            datasets: [
                {
                    label: 'Avg Resolution (hours)',
                    data: departments.map(dept => dept.avgResolution),
                    fill: true,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(54, 162, 235)'
                },
                {
                    label: 'Priority Tickets',
                    data: departments.map(dept => dept.priorityTickets * 2),
                    fill: true,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(255, 99, 132)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(255, 99, 132)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0
                }
            }
        }
    });
}

// Search functionality
searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const filteredDepartments = departments.filter(dept => 
        dept.name.toLowerCase().includes(searchTerm)
    );
    
    renderDepartmentCards(filteredDepartments);
});

// Sorting functionality
sortTicketsBtn.addEventListener('click', function() {
    const sorted = [...departments].sort((a, b) => b.tickets - a.tickets);
    renderDepartmentCards(sorted);
});

sortResolutionBtn.addEventListener('click', function() {
    const sorted = [...departments].sort((a, b) => a.avgResolution - b.avgResolution);
    renderDepartmentCards(sorted);
});

// Render department cards
function renderDepartmentCards(depts) {
    departmentsContainer.innerHTML = '';
    
    if (depts.length === 0) {
        departmentsContainer.innerHTML = `
            <div class="department-card">
                <div class="card-header">
                    <div class="dept-name">No Matching Departments</div>
                    <div class="dept-status status-warning">Try Again</div>
                </div>
                <div class="dept-stats">
                    <div class="stat-box">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Tickets</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Priority</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">0h</div>
                        <div class="stat-label">Avg. Res</div>
                    </div>
                </div>
                <div class="progress-container">
                    <div class="progress-header">
                        <span>Resolution Time</span>
                        <span>0h - 0h</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    depts.forEach(dept => {
        // Determine status based on performance
        let statusClass, statusText;
        if (dept.avgResolution < 20) {
            statusClass = 'status-good';
            statusText = 'Excellent';
        } else if (dept.avgResolution > 40) {
            statusClass = 'status-bad';
            statusText = 'Needs Improvement';
        } else {
            statusClass = 'status-warning';
            statusText = 'Good';
        }
        
        const progress = Math.min(100, dept.avgResolution);
        
        const card = document.createElement('div');
        card.className = 'department-card';
        card.innerHTML = `
            <div class="card-header">
                <div class="dept-name">${dept.name}</div>
                <div class="dept-status ${statusClass}">${statusText}</div>
            </div>
            
            <div class="dept-stats">
                <div class="stat-box">
                    <div class="stat-value">${dept.tickets}</div>
                    <div class="stat-label">Tickets</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${dept.priorityTickets}</div>
                    <div class="stat-label">Priority</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${dept.avgResolution}h</div>
                    <div class="stat-label">Avg. Res</div>
                </div>
            </div>
            
            <div class="progress-container">
                <div class="progress-header">
                    <span>Resolution Time</span>
                    <span>${dept.minResolution}h - ${dept.maxResolution}h</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
        
        departmentsContainer.appendChild(card);
    });
}

// Calculate dashboard totals
function calculateTotals() {
    const deptCount = departments.length;
    const totalTickets = departments.reduce((sum, dept) => sum + dept.tickets, 0);
    const totalResolution = departments.reduce((sum, dept) => sum + dept.avgResolution, 0);
    const totalPriority = departments.reduce((sum, dept) => sum + dept.priorityTickets, 0);
    
    document.getElementById('deptCount').textContent = deptCount;
    document.getElementById('totalTickets').textContent = totalTickets.toLocaleString();
    document.getElementById('avgResolution').textContent = deptCount > 0 
        ? (totalResolution / deptCount).toFixed(1) + 'h' 
        : '0h';
    document.getElementById('highPriority').textContent = totalPriority;
}

// Create charts
function createCharts() {
    // Destroy existing charts if they exist
    if (ticketChart) ticketChart.destroy();
    if (resolutionChart) resolutionChart.destroy();
    
    if (departments.length === 0) {
        // Create empty charts
        const ticketCtx = document.getElementById('ticketChart').getContext('2d');
        ticketChart = new Chart(ticketCtx, {
            type: 'bar',
            data: { datasets: [], labels: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Upload data to see visualization',
                        font: { size: 14 },
                        color: '#6b7280',
                        position: 'bottom',
                        padding: 20
                    }
                }
            }
        });
        
        const resolutionCtx = document.getElementById('resolutionChart').getContext('2d');
        resolutionChart = new Chart(resolutionCtx, {
            type: 'radar',
            data: { datasets: [], labels: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { r: { suggestedMin: 0 } },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Upload data to see visualization',
                        font: { size: 14 },
                        color: '#6b7280',
                        position: 'bottom',
                        padding: 20
                    }
                }
            }
        });
        return;
    }
    
    // Tickets by Department chart
    const ticketCtx = document.getElementById('ticketChart').getContext('2d');
    ticketChart = new Chart(ticketCtx, {
        type: 'bar',
        data: {
            labels: departments.map(dept => dept.name),
            datasets: [{
                label: 'Number of Tickets',
                data: departments.map(dept => dept.tickets),
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(201, 203, 207, 0.7)',
                    'rgba(255, 205, 86, 0.7)',
                    'rgba(75, 192, 115, 0.7)',
                    'rgba(153, 102, 155, 0.7)',
                    'rgba(54, 162, 135, 0.7)'
                ],
                borderColor: [
                    'rgb(54, 162, 235)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 99, 132)',
                    'rgb(201, 203, 207)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 115)',
                    'rgb(153, 102, 155)',
                    'rgb(54, 162, 135)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Tickets'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Resolution Time Comparison chart
    const resolutionCtx = document.getElementById('resolutionChart').getContext('2d');
    resolutionChart = new Chart(resolutionCtx, {
        type: 'radar',
        data: {
            labels: departments.map(dept => dept.name),
            datasets: [
                {
                    label: 'Avg Resolution (hours)',
                    data: departments.map(dept => dept.avgResolution),
                    fill: true,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(54, 162, 235)'
                },
                {
                    label: 'Priority Tickets',
                    data: departments.map(dept => dept.priorityTickets * 2),
                    fill: true,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    pointBackgroundColor: 'rgb(255, 99, 132)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(255, 99, 132)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0
                }
            }
        }
    });
}

// Render the entire dashboard
function renderDashboard() {
    calculateTotals();
    renderDepartmentCards(departments);
    createCharts();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Pre-populate login for demo convenience
    document.getElementById('username').value = 'admin';
    document.getElementById('password').value = 'admin123';
});