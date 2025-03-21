// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add sticky navigation
const navbar = document.querySelector('.navbar');
const navbarHeight = navbar.getBoundingClientRect().height;

window.addEventListener('scroll', () => {
    if (window.scrollY > navbarHeight) {
        navbar.classList.add('sticky');
    } else {
        navbar.classList.remove('sticky');
    }
});

// Mobile menu toggle
const createMobileMenu = () => {
    const navbar = document.querySelector('.navbar');
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    
    navbar.querySelector('.container').appendChild(mobileMenuBtn);
    
    mobileMenuBtn.addEventListener('click', () => {
        const navLinks = navbar.querySelector('.nav-links');
        navLinks.classList.toggle('show');
    });
};

// Initialize mobile menu
if (window.innerWidth <= 768) {
    createMobileMenu();
}

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        if (!document.querySelector('.mobile-menu-btn')) {
            createMobileMenu();
        }
    } else {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.remove();
        }
    }
});

// Add scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.section, .calendar-section').forEach((section) => {
    section.classList.add('fade-in');
    observer.observe(section);
});

// Modal functionality
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    
    // Add modal with a slight delay to allow for the fade in
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal(modalId);
        }
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    
    // Remove the show class
    modal.classList.remove('show');
    
    // Wait for the animation to complete before hiding the modal
    setTimeout(() => {
        document.body.style.overflow = ''; // Restore scrolling
    }, 300); // Match this with your CSS transition duration
}

// Add smooth loading for images
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('.location-image img');
    
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.parentElement.classList.add('loaded');
        });
    });
    
    // Check for data
    checkDataExists();
});

// Check if data exists in localStorage
function checkDataExists() {
    // Only run this check if we're not on the admin page
    if (window.location.href.includes('admin.html')) {
        return;
    }
    
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    
    // If no games data exists, show a warning banner
    if (games.length === 0) {
        const warningBanner = document.createElement('div');
        warningBanner.className = 'data-warning';
        warningBanner.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Nav ielādēti dati. Lūdzu, izmantojiet <a href="admin.html">administrācijas paneli</a> lai importētu datus no JSON faila.</span>
            <button class="close-warning" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;
        document.body.insertBefore(warningBanner, document.body.firstChild);
        
        // Add styles for the warning banner
        const style = document.createElement('style');
        style.textContent = `
            .data-warning {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 20px;
                background-color: #fff3cd;
                color: #856404;
                border-bottom: 1px solid #ffeeba;
                position: relative;
                z-index: 1000;
            }
            .data-warning i {
                font-size: 18px;
                color: #ffc107;
            }
            .data-warning a {
                color: #0056b3;
                text-decoration: underline;
            }
            .close-warning {
                background: none;
                border: none;
                cursor: pointer;
                margin-left: auto;
                color: #856404;
                font-size: 16px;
            }
        `;
        document.head.appendChild(style);
    }
} 