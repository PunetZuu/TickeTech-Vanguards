// Contact module
import authManager from './auth.js';

class ContactManager {
    constructor() {
        this.init();
    }

    // Initialize contact manager
    init() {
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const contactForm = document.getElementById('contactForm');
            
            contactForm?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitContactForm();
            });
        });
    }

    // Submit contact form
    async submitContactForm() {
        // Get form data
        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const message = document.getElementById('contactMessage').value.trim();

        // Validate form
        const errors = this.validateContactForm(name, email, message);
        if (errors.length > 0) {
            this.showValidationErrors(errors);
            return;
        }

        try {
            // Prepare data for n8n webhook
            const contactData = {
                name,
                email,
                message,
                timestamp: new Date().toISOString(),
                source: 'website_contact_form'
            };

            // Send to n8n webhook
            await this.sendToN8nWebhook(contactData);
            
            // Show success message
            authManager.showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
            
            // Reset form
            this.resetContactForm();
            
        } catch (error) {
            console.error('Error submitting contact form:', error);
            authManager.showToast('Error sending message. Please try again.', 'error');
        }
    }

    // Send data to n8n webhook
    async sendToN8nWebhook(data) {
        // n8n webhook URL - replace with your actual webhook URL
        const webhookUrl = 'https://your-n8n-instance.com/webhook/contact-form';
        
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Contact form data sent to n8n successfully:', result);
            
            return result;
        } catch (error) {
            console.error('Error sending to n8n webhook:', error);
            throw error;
        }
    }

    // Validate contact form
    validateContactForm(name, email, message) {
        const errors = [];

        if (!name) {
            errors.push('Name is required');
        } else if (name.length < 2) {
            errors.push('Name must be at least 2 characters long');
        }

        if (!email) {
            errors.push('Email is required');
        } else if (!this.isValidEmail(email)) {
            errors.push('Please enter a valid email address');
        }

        if (!message) {
            errors.push('Message is required');
        } else if (message.length < 10) {
            errors.push('Message must be at least 10 characters long');
        }

        return errors;
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show validation errors
    showValidationErrors(errors) {
        const errorMessage = errors.join(', ');
        authManager.showToast(errorMessage, 'error');
    }

    // Reset contact form
    resetContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.reset();
        }
    }
}

// Initialize contact manager
const contactManager = new ContactManager();

// Export for use in other modules
export default contactManager;
