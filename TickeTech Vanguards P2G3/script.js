// Main application script
import authManager from './auth.js';
import dashboardManager from './dashboard.js';
import ticketManager from './tickets.js';
import contactManager from './contact.js';
import themeManager from './theme.js';

class App {
    constructor() {
        this.currentSection = 'home';
        this.init();
    }

    // Initialize application
    init() {
        this.setupEventListeners();
        this.initializeAOS();
        this.handleRouting();
        this.hideLoadingSpinner();
    }

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Navigation links
            this.setupNavigationLinks();
            
            // Mobile menu
            this.setupMobileMenu();
            
            // Service filters
            this.setupServiceFilters();
            
            // CTA buttons
            this.setupCTAButtons();
            
            // Smooth scrolling for anchor links
            this.setupSmoothScrolling();
            
            // Handle hash changes
            window.addEventListener('hashchange', () => {
                this.handleRouting();
            });
        });
    }

    // Setup navigation links
    setupNavigationLinks() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                
                if (href.startsWith('#')) {
                    const sectionId = href.substring(1);
                    this.navigateToSection(sectionId);
                }
            });
        });
    }

    // Setup mobile menu
    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        mobileMenuBtn?.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
        
        // Close mobile menu when clicking on a link
        const mobileNavLinks = mobileMenu?.querySelectorAll('.nav-link');
        mobileNavLinks?.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // Setup service filters
    setupServiceFilters() {
        const serviceFilterBtns = document.querySelectorAll('.service-filter-btn');
        
        serviceFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.filterServices(filter);
                
                // Update active button
                serviceFilterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    // Filter services
    filterServices(filter) {
        const serviceItems = document.querySelectorAll('.service-item');
        
        serviceItems.forEach(item => {
            if (filter === 'all' || item.classList.contains(filter)) {
                item.style.display = 'block';
                item.classList.remove('hidden');
            } else {
                item.style.display = 'none';
                item.classList.add('hidden');
            }
        });
    }

    // Setup CTA buttons
    setupCTAButtons() {
        const getStartedBtn = document.getElementById('getStartedBtn');
        const learnMoreBtn = document.getElementById('learnMoreBtn');
        const viewAllServicesBtn = document.getElementById('viewAllServicesBtn');
        
        getStartedBtn?.addEventListener('click', () => {
            if (authManager.isAuthenticated()) {
                this.navigateToSection('dashboard');
            } else {
                document.getElementById('loginBtn')?.click();
            }
        });
        
        learnMoreBtn?.addEventListener('click', () => {
            this.navigateToSection('about');
        });
        
        viewAllServicesBtn?.addEventListener('click', () => {
            this.navigateToSection('services');
        });
    }

    // Setup smooth scrolling
    setupSmoothScrolling() {
        const anchors = document.querySelectorAll('a[href^="#"]');
        
        anchors.forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Initialize AOS (Animate On Scroll)
    initializeAOS() {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 1000,
                once: true,
                offset: 100,
                easing: 'ease-in-out'
            });
        }
    }

    // Handle routing
    handleRouting() {
        const hash = window.location.hash.substring(1);
        
        if (hash) {
            this.navigateToSection(hash);
        } else {
            this.navigateToSection('home');
        }
    }

    // Navigate to section
    navigateToSection(sectionId) {
        // Check if section requires authentication
        if ((sectionId === 'dashboard' || sectionId === 'tickets') && !authManager.isAuthenticated()) {
            document.getElementById('loginBtn')?.click();
            return;
        }
        
        // Hide all sections
        const sections = document.querySelectorAll('main > section');
        sections.forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            this.currentSection = sectionId;
            
            // Update navigation active state
            this.updateActiveNavLink(sectionId);
            
            // Update URL hash
            if (window.location.hash !== `#${sectionId}`) {
                window.history.pushState(null, null, `#${sectionId}`);
            }
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Refresh AOS
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
        }
    }

    // Update active navigation link
    updateActiveNavLink(sectionId) {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            const href = link.getAttribute('href');
            if (href === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }

    // Hide loading spinner
    hideLoadingSpinner() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        setTimeout(() => {
            loadingSpinner?.classList.add('hidden');
        }, 500);
    }

    // Show loading spinner
    showLoadingSpinner() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        loadingSpinner?.classList.remove('hidden');
    }

    // Handle errors
    handleError(error, userMessage = 'An error occurred. Please try again.') {
        console.error('Application error:', error);
        authManager.showToast(userMessage, 'error');
    }
}

// Initialize application
const app = new App();

// Export for use in other modules
export default app;

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    authManager.showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    authManager.showToast('An unexpected error occurred. Please try again.', 'error');
});
