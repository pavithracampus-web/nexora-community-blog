// ==================== ADMIN FUNCTIONS ====================
import { auth, db, signOutUser } from './firebase.js';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
const provider = new GoogleAuthProvider();

async function checkAdmin(user) {
    if (!user) return false;
    try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        return adminDoc.exists();
    } catch (e) {
        return false;
    }
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function loadPendingPosts() {
    const tbody = document.getElementById('pendingBody');
    const countEl = document.getElementById('pendingCount');
    try {
        const q = query(collection(db, 'communityBlogs'), where('moderationStatus', '==', 'pending'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        countEl.textContent = snapshot.size;
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i><p>No pending posts to review</p></td></tr>';
            return;
        }
        
        tbody.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
            return `
                <tr>
                    <td class="admin-post-title">${escapeHtml(data.title)}</td>
                    <td>${escapeHtml(data.authorName)}</td>
                    <td><span class="admin-category">${escapeHtml(data.category)}</span></td>
                    <td>${date}</td>
                    <td class="admin-actions">
                        <button class="btn-approve" onclick="approvePost('${doc.id}')"><i class="fas fa-check"></i> Approve</button>
                        <button class="btn-reject" onclick="rejectPost('${doc.id}')"><i class="fas fa-times"></i> Reject</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading pending posts:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading posts</p></td></tr>';
    }
}

async function loadApprovedPosts() {
    const tbody = document.getElementById('approvedBody');
    const countEl = document.getElementById('approvedCount');
    try {
        const q = query(collection(db, 'communityBlogs'), where('moderationStatus', '==', 'approved'), orderBy('createdAt', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        
        countEl.textContent = snapshot.size;
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No approved posts yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
            return `
                <tr>
                    <td class="admin-post-title">${escapeHtml(data.title)}</td>
                    <td>${escapeHtml(data.authorName)}</td>
                    <td><span class="admin-category">${escapeHtml(data.category)}</span></td>
                    <td>${date}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading approved posts:', error);
    }
}

async function approvePost(postId) {
    if (!confirm('Approve this blog post?')) return;
    try {
        await updateDoc(doc(db, 'communityBlogs', postId), {
            published: true,
            moderationStatus: 'approved',
            publishedAt: serverTimestamp()
        });
        showToast('Post approved!', 'success');
        loadPendingPosts();
        loadApprovedPosts();
    } catch (error) {
        console.error('Error approving post:', error);
        showToast('Error approving post', 'error');
    }
}

async function rejectPost(postId) {
    const reason = prompt('Rejection reason (optional):');
    try {
        await updateDoc(doc(db, 'communityBlogs', postId), {
            published: false,
            moderationStatus: 'rejected',
            moderationReason: reason || null
        });
        showToast('Post rejected', 'success');
        loadPendingPosts();
    } catch (error) {
        console.error('Error rejecting post:', error);
        showToast('Error rejecting post', 'error');
    }
}

// Make functions globally available
window.approvePost = approvePost;
window.rejectPost = rejectPost;

// Initialize
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert('Please sign in to access admin dashboard');
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = user;
    
    // Update UI
    document.getElementById('userAvatarNav').src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}`;
    document.getElementById('userLabel').textContent = user.displayName;
    document.getElementById('userInfoNav').style.display = 'flex';
    
    // Check admin
    const isAdminUser = await checkAdmin(user);
    if (!isAdminUser) {
        alert('Access denied. You are not an admin.');
        await signOutUser();
        window.location.href = 'index.html';
        return;
    }
    
    // Load posts
    loadPendingPosts();
    loadApprovedPosts();
});

// Sign out
document.getElementById('signOutBtn')?.addEventListener('click', async () => {
    await signOutUser();
    window.location.href = 'index.html';
});

// Dark mode toggle
document.getElementById('darkModeToggle')?.addEventListener('click', () => {
    const toggle = document.getElementById('darkModeToggle');
    const icon = toggle?.querySelector('i');
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
    localStorage.setItem('theme', isLight ? 'dark' : 'light');
    icon?.classList.toggle('fa-moon');
    icon?.classList.toggle('fa-sun');
});