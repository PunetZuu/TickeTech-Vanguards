// Authentication module
import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.initializeAuth();
    }

    // Initialize authentication state listener
    initializeAuth() {
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.updateUIForAuthState(user);
            this.notifyAuthStateListeners(user);
        });
    }

    // Register auth state listener
    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
    }

    // Notify all auth state listeners
    notifyAuthStateListeners(user) {
        this.authStateListeners.forEach(callback => callback(user));
    }

    // Update UI based on authentication state
    updateUIForAuthState(user) {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userEmail = document.getElementById('userEmail');
        const dashboardLink = document.getElementById('dashboardLink');
        const mobileDashboardLink = document.getElementById('mobileDashboardLink');

        if (user) {
            // User is signed in
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
            userEmail.textContent = user.email;
            dashboardLink.classList.remove('hidden');
            mobileDashboardLink.classList.remove('hidden');
        } else {
            // User is signed out
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
            dashboardLink.classList.add('hidden');
            mobileDashboardLink.classList.add('hidden');
        }
    }

    // Sign up with email and password
    async signUp(email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            this.showToast('Account created successfully!', 'success');
            return userCredential.user;
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            this.showToast('Signed in successfully!', 'success');
            return userCredential.user;
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    }

    // Sign out
    async signOut() {
        try {
            await signOut(auth);
            this.showToast('Signed out successfully!', 'success');
            this.navigateToSection('home');
        } catch (error) {
            this.handleAuthError(error);
            throw error;
        }
    }

    // Handle authentication errors
    handleAuthError(error) {
        let message = 'An error occurred. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'This email is already registered. Please sign in instead.';
                break;
            case 'auth/weak-password':
                message = 'Password should be at least 6 characters long.';
                break;
            case 'auth/invalid-email':
                message = 'Please enter a valid email address.';
                break;
            case 'auth/user-not-found':
                message = 'No account found with this email address.';
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password. Please try again.';
                break;
            case 'auth/too-many-requests':
                message = 'Too many failed attempts. Please try again later.';
                break;
            default:
                message = error.message;
        }
        
        this.showAuthError(message);
    }

    // Show authentication error
    showAuthError(message) {
        const authError = document.getElementById('authError');
        authError.textContent = message;
        authError.classList.remove('hidden');
        
        // Hide error after 5 seconds
        setTimeout(() => {
            authError.classList.add('hidden');
        }, 5000);
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastContent = document.getElementById('toastContent');
        const toastIcon = document.getElementById('toastIcon');
        const toastMessage = document.getElementById('toastMessage');

        // Set toast content
        toastMessage.textContent = message;
        
        // Set toast type
        if (type === 'success') {
            toastContent.className = 'bg-green-500 text-white px-6 py-3 rounded-md shadow-lg flex items-center space-x-2';
            toastIcon.className = 'fas fa-check-circle';
        } else if (type === 'error') {
            toastContent.className = 'bg-red-500 text-white px-6 py-3 rounded-md shadow-lg flex items-center space-x-2';
            toastIcon.className = 'fas fa-exclamation-circle';
        } else if (type === 'warning') {
            toastContent.className = 'bg-yellow-500 text-white px-6 py-3 rounded-md shadow-lg flex items-center space-x-2';
            toastIcon.className = 'fas fa-exclamation-triangle';
        }

        // Show toast
        toast.classList.remove('hidden');
        
        // Hide toast after 4 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }

    // Navigate to section
    navigateToSection(sectionId) {
        // Hide all sections
        const sections = ['home', 'about', 'services', 'contact', 'dashboard', 'tickets'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                element.classList.add('hidden');
            }
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Close modal if open
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.add('hidden');
        }

        // Update URL hash
        window.location.hash = sectionId;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for use in other modules
export default authManager;

// DOM event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Auth modal elements
    const authModal = document.getElementById('authModal');
    const authForm = document.getElementById('authForm');
    const authModalTitle = document.getElementById('authModalTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const logoutBtn = document.getElementById('logoutBtn');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    let isLoginMode = true;

    // Show login modal
    loginBtn?.addEventListener('click', () => {
        isLoginMode = true;
        updateAuthModal();
        authModal.classList.remove('hidden');
    });

    // Show signup modal
    signupBtn?.addEventListener('click', () => {
        isLoginMode = false;
        updateAuthModal();
        authModal.classList.remove('hidden');
    });

    // Close modal
    closeAuthModal?.addEventListener('click', () => {
        authModal.classList.add('hidden');
        document.getElementById('authError').classList.add('hidden');
    });

    // Close modal on outside click
    authModal?.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.add('hidden');
            document.getElementById('authError').classList.add('hidden');
        }
    });

    // Login tab
    loginTab?.addEventListener('click', () => {
        isLoginMode = true;
        updateAuthModal();
    });

    // Signup tab
    signupTab?.addEventListener('click', () => {
        isLoginMode = false;
        updateAuthModal();
    });

    // Update auth modal based on mode
    function updateAuthModal() {
        if (isLoginMode) {
            authModalTitle.textContent = 'Login';
            authSubmitBtn.textContent = 'Login';
            loginTab.classList.add('border-primary', 'text-primary');
            loginTab.classList.remove('border-transparent', 'text-gray-500');
            signupTab.classList.remove('border-primary', 'text-primary');
            signupTab.classList.add('border-transparent', 'text-gray-500');
        } else {
            authModalTitle.textContent = 'Sign Up';
            authSubmitBtn.textContent = 'Sign Up';
            signupTab.classList.add('border-primary', 'text-primary');
            signupTab.classList.remove('border-transparent', 'text-gray-500');
            loginTab.classList.remove('border-primary', 'text-primary');
            loginTab.classList.add('border-transparent', 'text-gray-500');
        }
        document.getElementById('authError').classList.add('hidden');
    }

    // Auth form submission
    authForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;

        try {
            if (isLoginMode) {
                await authManager.signIn(email, password);
            } else {
                await authManager.signUp(email, password);
            }
            
            // Close modal and redirect to dashboard
            authModal.classList.add('hidden');
            authManager.navigateToSection('dashboard');
        } catch (error) {
            // Error is handled in the auth manager
            console.error('Authentication error:', error);
        }
    });

    // Logout
    logoutBtn?.addEventListener('click', async () => {
        try {
            await authManager.signOut();
            userDropdown.classList.add('hidden');
        } catch (error) {
            console.error('Logout error:', error);
        }
    });

    // User menu dropdown
    userMenuBtn?.addEventListener('click', () => {
        userDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!userMenuBtn?.contains(e.target) && !userDropdown?.contains(e.target)) {
            userDropdown?.classList.add('hidden');
        }
    });
});
