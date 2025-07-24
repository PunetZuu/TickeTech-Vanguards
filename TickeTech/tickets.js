// Tickets module
import authManager from './auth.js';
import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

class TicketManager {
    constructor() {
        this.init();
    }

    // Initialize ticket manager
    init() {
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const ticketForm = document.getElementById('ticketForm');
            const cancelTicketBtn = document.getElementById('cancelTicketBtn');
            const submitTicketBtn = document.getElementById('submitTicketBtn');
            
            // Form submission
            ticketForm?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitTicket();
            });
            
            // Cancel button
            cancelTicketBtn?.addEventListener('click', () => {
                this.cancelTicket();
            });
        });
    }

    // Submit ticket
    async submitTicket() {
        const user = authManager.getCurrentUser();
        if (!user) {
            authManager.showToast('Please log in to submit a ticket.', 'error');
            return;
        }

        // Get form data
        const category = document.getElementById('ticketCategory').value;
        const priority = document.getElementById('ticketPriority').value;
        const subject = document.getElementById('ticketSubject').value;
        const description = document.getElementById('ticketDescription').value;

        // Validate form
        if (!category || !priority || !subject.trim() || !description.trim()) {
            authManager.showToast('Please fill in all required fields.', 'error');
            return;
        }

        try {
            // Create ticket object
            const ticket = {
                userId: user.uid,
                userEmail: user.email,
                category,
                priority,
                subject: subject.trim(),
                description: description.trim(),
                status: 'open',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Add to Firestore
            const docRef = await addDoc(collection(db, 'tickets'), ticket);
            
            // Show success message
            authManager.showToast('Ticket submitted successfully!', 'success');
            
            // Reset form
            this.resetForm();
            
            // Navigate to dashboard
            setTimeout(() => {
                authManager.navigateToSection('dashboard');
            }, 1000);
            
            // Send notification via n8n webhook (if configured)
            this.sendTicketNotification(ticket, docRef.id);
            
        } catch (error) {
            console.error('Error submitting ticket:', error);
            authManager.showToast('Error submitting ticket. Please try again.', 'error');
        }
    }

    // Send ticket notification via n8n webhook
    async sendTicketNotification(ticket, ticketId) {
        const webhookUrl = 'https://your-n8n-instance.com/webhook/ticket-notification';
        
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ticketId,
                    userEmail: ticket.userEmail,
                    category: ticket.category,
                    priority: ticket.priority,
                    subject: ticket.subject,
                    description: ticket.description,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error('Webhook request failed');
            }
            
            console.log('Ticket notification sent successfully');
        } catch (error) {
            console.error('Error sending ticket notification:', error);
            // Don't show error to user as this is a background process
        }
    }

    // Cancel ticket submission
    cancelTicket() {
        if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
            this.resetForm();
            authManager.navigateToSection('dashboard');
        }
    }

    // Reset form
    resetForm() {
        const ticketForm = document.getElementById('ticketForm');
        if (ticketForm) {
            ticketForm.reset();
        }
    }

    // Validate ticket form
    validateForm() {
        const category = document.getElementById('ticketCategory').value;
        const priority = document.getElementById('ticketPriority').value;
        const subject = document.getElementById('ticketSubject').value;
        const description = document.getElementById('ticketDescription').value;

        const errors = [];

        if (!category) {
            errors.push('Please select a category');
        }

        if (!priority) {
            errors.push('Please select a priority');
        }

        if (!subject.trim()) {
            errors.push('Please enter a subject');
        } else if (subject.trim().length < 5) {
            errors.push('Subject must be at least 5 characters long');
        }

        if (!description.trim()) {
            errors.push('Please enter a description');
        } else if (description.trim().length < 10) {
            errors.push('Description must be at least 10 characters long');
        }

        return errors;
    }

    // Show validation errors
    showValidationErrors(errors) {
        const errorMessage = errors.join(', ');
        authManager.showToast(errorMessage, 'error');
    }
}

// Initialize ticket manager
const ticketManager = new TicketManager();

// Export for use in other modules
export default ticketManager;

// Additional DOM event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Handle submit ticket buttons throughout the site
    const submitTicketButtons = document.querySelectorAll('[id$="submitTicketBtn"], [id$="SubmitTicketBtn"]');
    
    submitTicketButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (authManager.isAuthenticated()) {
                authManager.navigateToSection('tickets');
            } else {
                // Show login modal first
                document.getElementById('loginBtn')?.click();
            }
        });
    });
});
