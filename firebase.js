// ==================== FIREBASE CONFIG ====================
// Firebase is initialized ONCE here and exported
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBqFujiGzuSTzPVVB6rQCaaTwyDMOxBHG4",
  authDomain: "nexora-community-blog.firebaseapp.com",
  projectId: "nexora-community-blog",
  storageBucket: "nexora-community-blog.firebasestorage.app",
  messagingSenderId: "457134747489",
  appId: "1:457134747489:web:2efaf90a5530a025781f20",
  measurementId: "G-E5W52VW1NJ"
};

// Initialize Firebase ONCE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ==================== AUTH ====================
let currentUser = null;

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (window.handleAuthStateChange) {
        window.handleAuthStateChange(user);
    }
});

// Sign in with Google
async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        console.log('Sign in successful:', result.user.displayName);
    } catch (error) {
        console.error('Auth error:', error.code, error.message);
        let errorMsg = 'Sign in failed. ' + error.code;
        
        if (error.code === 'auth/unauthorized-domain') {
            errorMsg = 'This domain is not authorized. Please add it to Firebase Console > Authentication > Authorized domains.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMsg = 'Popup was blocked. Please allow popups for this site.';
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMsg = 'Sign in was cancelled.';
        }
        
        if (window.showToast) {
            window.showToast(errorMsg, 'error');
        }
    }
}

// Sign out
async function signOutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// ==================== BLOGS ====================
// Load published community blogs
async function loadCommunityBlogs() {
    const grid = document.getElementById('userBlogsGrid');
    if (!grid) return;

    try {
        const q = query(
            collection(db, 'communityBlogs'),
            where('published', '==', true),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            grid.innerHTML = '<p class="blogs-empty">No community blogs yet. Be the first to create one!</p>';
            return;
        }

        grid.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            const excerpt = data.excerpt || (data.content ? data.content.substring(0, 150) + '...' : '');
            const category = data.category || 'General';
            const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

            return `
                <article class="user-blog-card">
                    <div class="article-image">
                        ${data.imageUrl 
                            ? `<img src="${escapeHtml(data.imageUrl)}" alt="${escapeHtml(data.title)}" loading="lazy">`
                            : `<div class="placeholder"><i class="fas fa-blog"></i></div>`
                        }
                        <span class="article-badge">${escapeHtml(category)}</span>
                    </div>
                    <div class="article-content">
                        <div class="article-meta">
                            <span class="meta-date"><i class="far fa-calendar"></i> ${date}</span>
                            ${data.readTime ? `<span class="meta-read"><i class="far fa-clock"></i> ${data.readTime} min</span>` : ''}
                        </div>
                        <h3 class="article-title">${escapeHtml(data.title)}</h3>
                        <p class="article-excerpt">${escapeHtml(excerpt)}</p>
                        <div class="article-author">
                            ${data.authorPhoto 
                                ? `<img src="${escapeHtml(data.authorPhoto)}" alt="${escapeHtml(data.authorName)}">`
                                : `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(data.authorName || 'User')}&background=6366f1&color=fff" alt="Author">`
                            }
                            <span>${escapeHtml(data.authorName || 'Anonymous')}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading blogs:', error);
        grid.innerHTML = '<p class="blogs-error">Error loading blogs. Please try again.</p>';
    }
}

// Submit new blog
async function submitBlog(details) {
    if (!currentUser) {
        if (window.showToast) {
            window.showToast('Please sign in to submit a blog', 'error');
        }
        return false;
    }

    try {
        const excerpt = details.content.substring(0, 140);
        const readTime = Math.max(1, Math.ceil(details.content.split(/\s+/).length / 200));

        await addDoc(collection(db, 'communityBlogs'), {
            title: details.title,
            category: details.category,
            imageUrl: details.imageUrl || null,
            content: details.content,
            excerpt: excerpt,
            readTime: readTime,
            createdAt: serverTimestamp(),
            authorUid: currentUser.uid,
            authorName: currentUser.displayName,
            authorPhoto: currentUser.photoURL,
            published: false,
            moderationStatus: 'pending'
        });

        if (window.showToast) {
            window.showToast('Blog submitted for review!', 'success');
        }
        if (window.closeBlogModal) {
            window.closeBlogModal();
        }
        return true;
    } catch (error) {
        console.error('Error submitting blog:', error);
        if (window.showToast) {
            window.showToast('Error submitting blog. Please try again.', 'error');
        }
        return false;
    }
}

// Helper
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ==================== EVENT LISTENERS ====================
// Sign in button
document.getElementById('signInBtn')?.addEventListener('click', signInWithGoogle);

// Sign out button
document.getElementById('signOutBtn')?.addEventListener('click', signOutUser);

// Blog submit event
document.addEventListener('blog-submit', async (e) => {
    await submitBlog(e.detail);
});

// Load blogs on page load
loadCommunityBlogs();

// Export for admin.js
export { app, auth, db, signInWithGoogle, signOutUser, submitBlog, loadCommunityBlogs };
export default { app, auth, db };