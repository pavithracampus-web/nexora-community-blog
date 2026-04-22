document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initHeader();
    initDarkMode();
    initMobileMenu();
    initNewsletter();
    initSmoothScroll();
    initBlogModal();
    initCharCounters();
});

function initCursor() {
    const cursor = document.querySelector('.cursor-glow');
    if (!cursor) return;
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
}

function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}

function initDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    const icon = toggle?.querySelector('i');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        icon?.classList.replace('fa-moon', 'fa-sun');
    }
    toggle?.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
        localStorage.setItem('theme', isLight ? 'dark' : 'light');
        icon?.classList.toggle('fa-moon');
        icon?.classList.toggle('fa-sun');
    });
}

function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const links = document.getElementById('navLinks');
    btn?.addEventListener('click', () => {
        btn.classList.toggle('active');
        links?.classList.toggle('active');
    });
    links?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            btn?.classList.remove('active');
            links?.classList.remove('active');
        });
    });
}

function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail')?.value;
        if (email && validateEmail(email)) {
            showToast('Successfully subscribed!', 'success');
            form.reset();
        } else {
            showToast('Please enter a valid email address.', 'error');
        }
    });
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function initBlogModal() {
    const modal = document.getElementById('blogModal');
    if (!modal) return;

    const addBtn = document.getElementById('addBlogBtn');
    const closeBtn = document.getElementById('blogModalClose');
    const cancelBtn = document.getElementById('cancelBlogBtn');
    const form = document.getElementById('blogForm');
    const backdrop = modal.querySelector('.blog-modal-backdrop');

    addBtn.addEventListener('click', () => {
        if (addBtn.disabled) return;
        modal.hidden = false;
        const titleInput = document.getElementById('blogTitle');
        if (titleInput) titleInput.focus();
    });

    const closeBlogModalFn = () => {
        modal.hidden = true;
        if (form) form.reset();
        const titleCount = document.getElementById('titleCount');
        const contentCount = document.getElementById('contentCount');
        if (titleCount) titleCount.textContent = '0';
        if (contentCount) contentCount.textContent = '0';
        if (addBtn) addBtn.focus();
    };

    closeBtn.addEventListener('click', closeBlogModalFn);
    cancelBtn.addEventListener('click', closeBlogModalFn);
    backdrop.addEventListener('click', closeBlogModalFn);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) {
            closeBlogModalFn();
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        window.handleBlogSubmit();
    });
}

function initCharCounters() {
    const titleInput = document.getElementById('blogTitle');
    const contentInput = document.getElementById('blogContent');
    const titleCount = document.getElementById('titleCount');
    const contentCount = document.getElementById('contentCount');

    titleInput?.addEventListener('input', () => {
        if (titleCount) titleCount.textContent = titleInput.value.length;
    });
    contentInput?.addEventListener('input', () => {
        if (contentCount) contentCount.textContent = contentInput.value.length;
    });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 10001; display: flex; flex-direction: column; gap: 12px; }
    .toast { display: flex; align-items: center; gap: 12px; padding: 16px 24px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: 0 8px 32px rgba(0,0,0,0.3); transform: translateX(120%); transition: transform 0.3s ease; }
    .toast.show { transform: translateX(0); }
    .toast-success i { color: var(--success); }
    .toast-error i { color: var(--danger); }
    .btn-signin { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--gradient-1); border: none; border-radius: var(--radius-md); color: white; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: var(--transition); }
    .btn-signin:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.4); }
    .btn-signout { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--glass); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: var(--transition); }
    .btn-signout:hover { background: var(--bg-card-hover); border-color: var(--danger); color: var(--danger); }
    .btn-admin { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--secondary); border: none; border-radius: var(--radius-md); color: white; font-size: 0.9rem; font-weight: 500; text-decoration: none; }
    .btn-admin:hover { opacity: 0.9; }
    .user-info-nav { display: flex; align-items: center; gap: 10px; padding: 6px 14px; background: var(--glass); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .user-avatar-nav { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
    .user-label { font-size: 0.875rem; font-weight: 500; }
    .btn-add-blog:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-add-blog:disabled:hover { transform: none; box-shadow: none; }
    .char-count { display: block; font-size: 0.75rem; color: var(--text-muted); text-align: right; margin-top: 4px; }
    .blogs-loading { grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px; }
    @media (max-width: 768px) {
        .btn-signin span, .btn-signout span { display: none; }
        .btn-signin, .btn-signout { padding: 10px 14px; }
        .user-label { display: none; }
        .user-info-nav { padding: 6px 10px; }
    }
`;
document.head.appendChild(toastStyles);

// ==================== AUTH HANDLERS ====================
window.handleAuthStateChange = function(user) {
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const userInfoNav = document.getElementById('userInfoNav');
    const userAvatarNav = document.getElementById('userAvatarNav');
    const userLabel = document.getElementById('userLabel');
    const adminBtn = document.getElementById('adminBtn');
    const addBlogBtn = document.getElementById('addBlogBtn');

    if (user) {
        signInBtn.style.display = 'none';
        signOutBtn.style.display = 'inline-flex';
        userInfoNav.style.display = 'flex';
        userAvatarNav.src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName);
        userLabel.textContent = user.displayName;
        if (adminBtn) adminBtn.style.display = 'inline-flex';
        if (addBlogBtn) {
            addBlogBtn.disabled = false;
            addBlogBtn.removeAttribute('disabled');
            addBlogBtn.title = 'Create a new blog post';
        }
    } else {
        signInBtn.style.display = 'inline-flex';
        signOutBtn.style.display = 'none';
        userInfoNav.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
        if (addBlogBtn) {
            addBlogBtn.disabled = true;
            addBlogBtn.setAttribute('disabled', 'true');
            addBlogBtn.title = 'Sign in to submit a blog';
        }
    }
};

window.handleSignIn = function() {
    const signInBtn = document.getElementById('signInBtn');
    signInBtn?.click();
};

window.handleSignOut = function() {
    const signOutBtn = document.getElementById('signOutBtn');
    signOutBtn?.click();
};

window.handleBlogSubmit = function() {
    const title = document.getElementById('blogTitle').value.trim();
    const category = document.getElementById('blogCategory').value;
    const imageUrl = document.getElementById('blogImage').value.trim();
    const content = document.getElementById('blogContent').value.trim();

    if (!title || !category || !content) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    if (title.length < 5 || title.length > 80) {
        showToast('Title must be between 5-80 characters', 'error');
        return;
    }
    if (content.length < 120 || content.length > 5000) {
        showToast('Content must be between 120-5000 characters', 'error');
        return;
    }
    if (imageUrl && !imageUrl.startsWith('https://')) {
        showToast('Image URL must start with https://', 'error');
        return;
    }

    document.dispatchEvent(new CustomEvent('blog-submit', {
        detail: { title, category, imageUrl, content }
    }));
};

window.closeBlogModal = function() {
    const modal = document.getElementById('blogModal');
    const addBlogBtn = document.getElementById('addBlogBtn');
    modal.hidden = true;
    const form = document.getElementById('blogForm');
    if (form) form.reset();
    const titleCount = document.getElementById('titleCount');
    const contentCount = document.getElementById('contentCount');
    if (titleCount) titleCount.textContent = '0';
    if (contentCount) contentCount.textContent = '0';
    if (addBlogBtn) addBlogBtn.focus();
};

window.showToast = showToast;