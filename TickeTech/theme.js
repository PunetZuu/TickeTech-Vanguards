// Theme management module
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.init();
    }

    // Initialize theme manager
    init() {
        this.loadTheme();
        this.setupEventListeners();
    }

    // Load theme from localStorage
    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.currentTheme = 'dark';
            }
        }
        
        this.applyTheme();
    }

    // Apply theme to document
    applyTheme() {
        const html = document.documentElement;
        const body = document.body;
        
        if (this.currentTheme === 'dark') {
            html.classList.add('dark');
            body.classList.add('dark');
        } else {
            html.classList.remove('dark');
            body.classList.remove('dark');
        }
        
        // Update theme toggle button
        this.updateThemeToggleButton();
    }

    // Toggle theme
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveTheme();
    }

    // Save theme to localStorage
    saveTheme() {
        localStorage.setItem('theme', this.currentTheme);
    }

    // Update theme toggle button
    updateThemeToggleButton() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const moonIcon = themeToggle.querySelector('.fas.fa-moon');
            const sunIcon = themeToggle.querySelector('.fas.fa-sun');
            
            if (this.currentTheme === 'dark') {
                moonIcon?.classList.add('hidden');
                sunIcon?.classList.remove('hidden');
            } else {
                moonIcon?.classList.remove('hidden');
                sunIcon?.classList.add('hidden');
            }
        }
    }

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const themeToggle = document.getElementById('themeToggle');
            
            themeToggle?.addEventListener('click', () => {
                this.toggleTheme();
            });
        });

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.currentTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme();
                }
            });
        }
    }

    // Get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Set theme programmatically
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.currentTheme = theme;
            this.applyTheme();
            this.saveTheme();
        }
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other modules
export default themeManager;
