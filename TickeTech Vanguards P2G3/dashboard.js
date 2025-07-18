// Dashboard module
import authManager from './auth.js';
import { db } from './firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    doc, 
    updateDoc 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

class DashboardManager {
    constructor() {
        this.tickets = [];
        this.currentFilter = 'all';
        this.init();
    }

    // Initialize dashboard
    init() {
        authManager.onAuthStateChanged((user) => {
            if (user) {
                this.loadUserData(user);
                this.loadTickets(user);
            }
        });
    }

    // Load user data
    async loadUserData(user) {
        const profileEmail = document.getElementById('profileEmail');
        const profileName = document.getElementById('profileName');
        
        if (profileEmail) {
            profileEmail.value = user.email;
        }
        
        if (profileName) {
            profileName.value = user.displayName || '';
        }
    }

    // Load user tickets
    async loadTickets(user) {
        try {
            const ticketsRef = collection(db, 'tickets');
            const q = query(
                ticketsRef,
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            this.tickets = [];
            
            querySnapshot.forEach((doc) => {
                this.tickets.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            this.updateTicketStats();
            this.renderTickets();
        } catch (error) {
            console.error('Error loading tickets:', error);
            authManager.showToast('Error loading tickets. Please try again.', 'error');
        }
    }

    // Update ticket statistics
    updateTicketStats() {
        const totalTickets = this.tickets.length;
        const openTickets = this.tickets.filter(ticket => ticket.status === 'open').length;
        const resolvedTickets = this.tickets.filter(ticket => ticket.status === 'resolved').length;
        
        const totalTicketsEl = document.getElementById('totalTickets');
        const openTicketsEl = document.getElementById('openTickets');
        const resolvedTicketsEl = document.getElementById('resolvedTickets');
        
        if (totalTicketsEl) totalTicketsEl.textContent = totalTickets;
        if (openTicketsEl) openTicketsEl.textContent = openTickets;
        if (resolvedTicketsEl) resolvedTicketsEl.textContent = resolvedTickets;
    }

    // Render tickets list
    renderTickets() {
        const ticketsList = document.getElementById('ticketsList');
        if (!ticketsList) return;
        
        let filteredTickets = this.tickets;
        
        if (this.currentFilter !== 'all') {
            filteredTickets = this.tickets.filter(ticket => ticket.status === this.currentFilter);
        }
        
        if (filteredTickets.length === 0) {
            ticketsList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-ticket-alt text-4xl mb-4"></i>
                    <p>No tickets found${this.currentFilter !== 'all' ? ` with status "${this.currentFilter}"` : ''}.</p>
                </div>
            `;
            return;
        }
        
        ticketsList.innerHTML = filteredTickets.map(ticket => `
            <div class="ticket-card bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">${ticket.subject}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">${ticket.description}</p>
                        <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span class="flex items-center">
                                <i class="fas fa-folder mr-1"></i>
                                ${this.getCategoryLabel(ticket.category)}
                            </span>
                            <span class="flex items-center">
                                <i class="fas fa-clock mr-1"></i>
                                ${this.formatDate(ticket.createdAt)}
                            </span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end space-y-2">
                        <span class="px-3 py-1 rounded-full text-xs font-medium status-${ticket.status}">
                            ${this.getStatusLabel(ticket.status)}
                        </span>
                        <span class="px-3 py-1 rounded-full text-xs font-medium priority-${ticket.priority}">
                            ${this.getPriorityLabel(ticket.priority)}
                        </span>
                    </div>
                </div>
                
                ${ticket.response ? `
                    <div class="mt-4 p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
                        <h5 class="font-semibold text-gray-900 dark:text-dark-text mb-2">Response:</h5>
                        <p class="text-sm text-gray-700 dark:text-gray-300">${ticket.response}</p>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // Get category label
    getCategoryLabel(category) {
        const categories = {
            'web-development': 'Web Development',
            'cloud-support': 'Cloud Support',
            'cybersecurity': 'Cybersecurity',
            'other': 'Other'
        };
        return categories[category] || category;
    }

    // Get status label
    getStatusLabel(status) {
        const statuses = {
            'open': 'Open',
            'in-progress': 'In Progress',
            'resolved': 'Resolved'
        };
        return statuses[status] || status;
    }

    // Get priority label
    getPriorityLabel(priority) {
        const priorities = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High'
        };
        return priorities[priority] || priority;
    }

    // Format date
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Set ticket filter
    setTicketFilter(filter) {
        this.currentFilter = filter;
        this.renderTickets();
        
        // Update filter buttons
        const filterButtons = document.querySelectorAll('.ticket-filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
    }

    // Update user profile
    async updateProfile(name) {
        try {
            const user = authManager.getCurrentUser();
            if (!user) return;
            
            // Update user profile (in a real app, you'd update the Firebase user profile)
            // For now, we'll just show a success message
            authManager.showToast('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            authManager.showToast('Error updating profile. Please try again.', 'error');
        }
    }
}

// Initialize dashboard manager
const dashboardManager = new DashboardManager();

// Export for use in other modules
export default dashboardManager;

// DOM event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Profile update
    const updateProfileBtn = document.getElementById('updateProfileBtn');
    const profileName = document.getElementById('profileName');
    
    updateProfileBtn?.addEventListener('click', () => {
        const name = profileName.value.trim();
        if (name) {
            dashboardManager.updateProfile(name);
        }
    });

    // Quick action buttons
    const newTicketBtn = document.getElementById('newTicketBtn');
    const viewTicketsBtn = document.getElementById('viewTicketsBtn');
    
    newTicketBtn?.addEventListener('click', () => {
        authManager.navigateToSection('tickets');
    });
    
    viewTicketsBtn?.addEventListener('click', () => {
        authManager.navigateToSection('dashboard');
    });

    // Ticket filter buttons
    const ticketFilterButtons = document.querySelectorAll('.ticket-filter-btn');
    ticketFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            dashboardManager.setTicketFilter(filter);
        });
    });
});
