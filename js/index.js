// Deprecated shim: the canonical client script is now at /public/js/index.js
console.warn('Deprecated: please use /js/index.js (public/js/index.js). This file will be removed in a future cleanup.');

// Local quote calculation fallback
function calculateQuoteLocally(formData) {
    const serviceMultipliers = {
        'clearing': 1,
        'sea_freight': 2.5,
        'air_freight': 4,
        'full_logistics': 3
    };
    
    const cargoMultipliers = {
        'general': 1,
        'construction': 1.2,
        'vehicles': 1.5,
        'perishable': 1.8,
        'hazardous': 2.2
    };

    const baseCost = (serviceMultipliers[formData.serviceType] || 1) * 500;
    const weightCost = formData.weight * 2.5;
    const volumeCost = formData.volume * 150;
    const cargoMultiplier = cargoMultipliers[formData.cargoType] || 1;
    
    const calculatedAmount = (baseCost + weightCost + volumeCost) * cargoMultiplier;

    return {
        success: true,
        data: {
            calculatedAmount: calculatedAmount.toFixed(2),
            currency: "USD",
            quoteId: `LOCAL-QUOTE-${Date.now()}`,
            breakdown: {
                baseFee: baseCost.toFixed(2),
                weightCharge: weightCost.toFixed(2),
                volumeCharge: volumeCost.toFixed(2),
                cargoSurcharge: cargoMultiplier
            },
            note: "Calculated locally - connect to backend for accurate pricing"
        }
    };
}

// Enhanced tracking with local fallback
async function trackShipmentWithFallback(trackingNumber) {
    try {
        const response = await fetch(`${API_BASE}/shipments/track/${trackingNumber}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn('API unavailable, using demo tracking data:', error);
        return getDemoTrackingData(trackingNumber);
    }
}

// Demo tracking data fallback
function getDemoTrackingData(trackingNumber) {
    const demoData = {
        'LCL-2024-001': {
            trackingNumber: 'LCL-2024-001',
            status: 'customs_clearance',
            description: 'Construction Materials',
            client: 'Liberia Construction Co.',
            origin: {
                country: 'China',
                port: 'Port of Shanghai'
            },
            destination: {
                country: 'Liberia',
                port: 'Freeport of Monrovia'
            },
            timeline: [
                {
                    status: 'customs_clearance',
                    description: 'Customs processing at Freeport of Monrovia',
                    location: 'Monrovia, Liberia',
                    timestamp: new Date().toISOString()
                },
                {
                    status: 'arrived',
                    description: 'Vessel arrived at port',
                    location: 'Freeport of Monrovia',
                    timestamp: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    status: 'in_transit',
                    description: 'Departed origin port',
                    location: 'Port of Shanghai',
                    timestamp: new Date(Date.now() - 604800000).toISOString()
                }
            ],
            estimatedArrival: new Date(Date.now() + 259200000).toISOString(),
            carrier: {
                name: 'Maersk Line',
                vessel: 'MAERSK MONROVIA'
            }
        },
        'LCL-2024-002': {
            trackingNumber: 'LCL-2024-002',
            status: 'in_transit',
            description: 'Mining Equipment',
            client: 'Liberia Mining Corp.',
            origin: {
                country: 'USA',
                port: 'Port of Baltimore'
            },
            destination: {
                country: 'Liberia',
                port: 'Freeport of Monrovia'
            },
            timeline: [
                {
                    status: 'in_transit',
                    description: 'Vessel in Atlantic Ocean',
                    location: 'Mid-Atlantic',
                    timestamp: new Date(Date.now() - 172800000).toISOString()
                },
                {
                    status: 'booked',
                    description: 'Booking confirmed and documentation completed',
                    location: 'Port of Baltimore',
                    timestamp: new Date(Date.now() - 2592000000).toISOString()
                }
            ],
            estimatedArrival: new Date(Date.now() + 604800000).toISOString(),
            carrier: {
                name: 'MSC',
                vessel: 'MSC LIBERIA'
            }
        }
    };

    return {
        success: true,
        data: demoData[trackingNumber] || {
            trackingNumber: trackingNumber,
            status: 'pending',
            description: 'Shipment information not found',
            timeline: [],
            note: 'Demo data - connect to backend for real tracking'
        }
    };
}

// Update the main tracking function to use fallback
async function trackShipment() {
    const trackingNumber = document.getElementById('trackingNumber').value.trim();
    const resultsDiv = document.getElementById('trackingResults');
    
    if (!trackingNumber) {
        alert('Please enter a tracking number');
        return;
    }

    try {
        // Show loading state
        const trackBtn = document.querySelector('.tracking-input .btn');
        const originalText = trackBtn.innerHTML;
        trackBtn.innerHTML = '<div class="loading"></div> Tracking...';
        trackBtn.disabled = true;

        const data = await trackShipmentWithFallback(trackingNumber);
        
        // Restore button
        trackBtn.innerHTML = originalText;
        trackBtn.disabled = false;
        
        if (data.success) {
            displayTrackingResults(data.data);
            resultsDiv.style.display = 'block';
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Shipment not found. Please check your tracking number.');
        }
    } catch (error) {
        console.error('Error tracking shipment:', error);
        alert('Error tracking shipment. Please try again.');
        
        // Restore button in case of error
        const trackBtn = document.querySelector('.tracking-input .btn');
        trackBtn.innerHTML = 'Track Shipment';
        trackBtn.disabled = false;
    }
}

// Update the main quote function to use fallback
async function calculateQuote() {
    const formData = {
        serviceType: document.getElementById('serviceType').value,
        origin: document.getElementById('origin').value,
        cargoType: document.getElementById('cargoType').value,
        weight: parseFloat(document.getElementById('weight').value),
        volume: parseFloat(document.getElementById('volume').value),
        value: parseFloat(document.getElementById('value').value),
        description: document.getElementById('cargoDescription').value
    };

    // Validate required fields
    if (!formData.serviceType || !formData.origin || !formData.cargoType || 
        !formData.weight || !formData.volume) {
        alert('Please fill all required fields');
        return;
    }

    try {
        const data = await calculateQuoteWithFallback(formData);
        
        if (data.success) {
            displayQuoteResult(data.data);
        } else {
            alert('Error calculating quote: ' + data.message);
        }
    } catch (error) {
        console.error('Error calculating quote:', error);
        alert('Error calculating quote. Please try again.');
    }
}

// Enhanced quote result display
function displayQuoteResult(quoteData) {
    const calculatedAmount = document.getElementById('calculatedAmount');
    const quoteResult = document.getElementById('quoteResult');
    
    calculatedAmount.textContent = quoteData.calculatedAmount;
    
    // Add breakdown if available
    if (quoteData.breakdown) {
        let breakdownHtml = `
            <div class="quote-breakdown">
                <div class="breakdown-item">
                    <div class="detail-label">Base Fee</div>
                    <div class="detail-value">$${quoteData.breakdown.baseFee}</div>
                </div>
                <div class="breakdown-item">
                    <div class="detail-label">Weight Charge</div>
                    <div class="detail-value">$${quoteData.breakdown.weightCharge}</div>
                </div>
                <div class="breakdown-item">
                    <div class="detail-label">Volume Charge</div>
                    <div class="detail-value">$${quoteData.breakdown.volumeCharge}</div>
                </div>
        `;
        
        if (quoteData.breakdown.cargoSurcharge && quoteData.breakdown.cargoSurcharge > 1) {
            breakdownHtml += `
                <div class="breakdown-item">
                    <div class="detail-label">Cargo Surcharge</div>
                    <div class="detail-value">${quoteData.breakdown.cargoSurcharge}x</div>
                </div>
            `;
        }
        
        breakdownHtml += '</div>';
        
        // Insert breakdown before the note
        const noteElement = quoteResult.querySelector('p');
        if (noteElement) {
            noteElement.insertAdjacentHTML('beforebegin', breakdownHtml);
        }
    }
    
    // Add note if present
    if (quoteData.note) {
        const existingNote = quoteResult.querySelector('.quote-note');
        if (!existingNote) {
            const noteElement = document.createElement('p');
            noteElement.className = 'quote-note';
            noteElement.style.fontSize = '0.9em';
            noteElement.style.color = '#6c757d';
            noteElement.style.marginTop = '10px';
            noteElement.textContent = quoteData.note;
            quoteResult.appendChild(noteElement);
        }
    }
    
    quoteResult.style.display = 'block';
    quoteResult.scrollIntoView({ behavior: 'smooth' });
}

// Mobile menu toggle (for future responsive enhancement)
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Add responsive navigation for mobile
function initMobileNavigation() {
    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.nav-links');
    
    // Create mobile menu button
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuBtn.style.display = 'none';
    mobileMenuBtn.onclick = toggleMobileMenu;
    
    nav.appendChild(mobileMenuBtn);
    
    // Check screen size and toggle mobile menu
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            mobileMenuBtn.style.display = 'block';
            navLinks.style.display = 'none';
        } else {
            mobileMenuBtn.style.display = 'none';
            navLinks.style.display = 'flex';
        }
    }
    
    window.addEventListener('resize', checkScreenSize);
    checkScreenSize(); // Initial check
}

// Initialize mobile navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMobileNavigation();
});
// SMS Management Functions
async function checkSMSBalance() {
    try {
        const response = await fetch('/api/sms/balance', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('smsBalance').textContent = 
                `${data.data.balance} ${data.data.currency}`;
        }
    } catch (error) {
        console.error('Error checking SMS balance:', error);
    }
}

async function sendBulkSMS(clientIds, message, templateType) {
    try {
        const response = await fetch('/api/sms/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                clientIds,
                message,
                templateType
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Bulk SMS sent successfully to ${data.data.sentCount} recipients`);
            return true;
        } else {
            alert('Failed to send bulk SMS: ' + data.message);
            return false;
        }
    } catch (error) {
        console.error('Error sending bulk SMS:', error);
        alert('Error sending bulk SMS');
        return false;
    }
}

async function loadSMSLogs() {
    try {
        const response = await fetch('/api/sms/logs', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        if (data.success) {
            displaySMSLogs(data.data);
        }
    } catch (error) {
        console.error('Error loading SMS logs:', error);
    }
}

function displaySMSLogs(logs) {
    const tbody = document.querySelector('#smsLogsTable tbody');
    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${log.phoneNumber}</td>
            <td title="${log.message}">${log.message.substring(0, 50)}${log.message.length > 50 ? '...' : ''}</td>
            <td>
                <span class="status-badge status-${log.status}">
                    ${log.status}
                </span>
            </td>
            <td>${log.gateway}</td>
            <td>$${log.cost?.toFixed(2) || '0.00'}</td>
            <td>${new Date(log.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Character counter for SMS messages
document.getElementById('bulkMessage')?.addEventListener('input', function() {
    const count = this.value.length;
    document.getElementById('charCount').textContent = count;
    
    if (count > 160) {
        this.value = this.value.substring(0, 160);
        document.getElementById('charCount').textContent = 160;
    }
});

// Initialize SMS dashboard when admin logs in
function initializeSMSDashboard() {
    checkSMSBalance();
    loadSMSLogs();
    
    // Set up periodic refresh every 5 minutes
    setInterval(() => {
        checkSMSBalance();
        loadSMSLogs();
    }, 300000);
}
// Export functionality for future use
window.LiberiaClearLogistics = {
    trackShipment,
    calculateQuote,
    clientLogin,
    clientRegister,
    logout,
    showTab
};
 // Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initMobileNavigation();
    // ... any other initialization logic ...
});

console.log('LiberiaClearLogistics frontend initialized successfully!');
console.log('Backend API URL:', API_BASE);
