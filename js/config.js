// ============================================
// API Configuration for TechFix Repairs
// ============================================
// UPDATE THE PRODUCTION URL BELOW WITH YOUR HOSTINGER DOMAIN
// ============================================

const API_CONFIG = {
    // Development (local Laravel server) - Don't change this
    // This is used when running: php artisan serve (starts on port 8000)
    development: 'http://127.0.0.1:8000/api',
    
    // Production (Hostinger)
    // Backend is hosted under /backend, expose API at /backend/api
    production: 'https://techfix.ccs4thyear.com/backend/public/api',
    
    // Get current API URL based on environment
    getCurrent: function() {
        // Check if we're in Cordova mobile app
        // Cordova apps should always use production API (Hostinger)
        if (typeof cordova !== 'undefined' || typeof window.cordova !== 'undefined') {
            return this.production;
        }
        
        // Check hostname
        const hostname = window.location.hostname;
        
        // Development: localhost or 127.0.0.1 (local development)
        // This means you're testing on your computer
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
            return this.development;
        }
        
        // Production: GitHub Pages, custom domain, or any other host
        // GitHub Pages URLs: username.github.io
        // Custom domains: yourdomain.com
        // When frontend is hosted (GitHub Pages), use production API
        return this.production;
    }
};

// Set global API_URL variable
var API_URL = API_CONFIG.getCurrent();

// Also set baseURL for compatibility with auth.js
API_CONFIG.baseURL = API_CONFIG.getCurrent();

// Log for debugging (you can remove this in production)
if (API_CONFIG.getCurrent() === API_CONFIG.development) {
    console.log('🔧 Development Mode - API URL:', API_URL);
    console.log('   (Local Laravel server: php artisan serve)');
} else {
    console.log('🚀 Production Mode - API URL:', API_URL);
    console.log('   (Hostinger backend)');
}
