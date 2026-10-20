// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.1rem;">${type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
    <div style="flex: 1; line-height: 1.4;">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// Kiểm tra query parameters từ URL
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('error')) {
    const errorMsg = params.get('error');
    if (errorMsg === 'google_not_configured') {
      showToast('Chưa cấu hình GOOGLE_CLIENT_ID trong file .env! Hãy mở mục Hướng dẫn cấu hình hoặc thử nút Test Gmail.', 'error');
      openModal();
    } else if (errorMsg === 'github_not_configured') {
      showToast('Chưa cấu hình GITHUB_CLIENT_ID trong file .env! Hãy mở mục Hướng dẫn cấu hình hoặc thử nút Test GitHub.', 'error');
      openModal();
    } else {
      showToast(decodeURIComponent(errorMsg), 'error');
    }
  }

  if (params.get('message') === 'logged_out') {
    showToast('Bạn đã đăng xuất an toàn khỏi hệ thống!', 'success');
  } else if (params.get('message') === 'session_expired') {
    showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'info');
  }

  // Làm sạch URL sau khi hiển thị toast
  if (params.has('error') || params.has('message')) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Xử lý Modal Hướng Dẫn
const guideModal = document.getElementById('guideModal');
const btnOpenGuide = document.getElementById('btnOpenGuide');
const btnCloseGuide = document.getElementById('btnCloseGuide');

function openModal() {
  if (guideModal) {
    guideModal.classList.add('active');
  }
}

function closeModal() {
  if (guideModal) {
    guideModal.classList.remove('active');
  }
}

if (btnOpenGuide) btnOpenGuide.addEventListener('click', openModal);
if (btnCloseGuide) btnCloseGuide.addEventListener('click', closeModal);

if (guideModal) {
  guideModal.addEventListener('click', (e) => {
    if (e.target === guideModal) closeModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Kiểm tra trạng thái hệ thống và cấu hình OAuth
async function checkAuthStatus() {
  try {
    // 1. Kiểm tra nếu người dùng đã đăng nhập sẵn
    const meRes = await fetch('/auth/me');
    const meData = await meRes.json();
    if (meData.authenticated) {
      window.location.href = '/dashboard.html';
      return;
    }

    // 2. Kiểm tra trạng thái API credentials
    const statusRes = await fetch('/api/auth/status');
    const statusData = await statusRes.json();

    const badgeGoogle = document.getElementById('badgeGoogleStatus');
    const badgeGithub = document.getElementById('badgeGithubStatus');
    const btnLoginGoogle = document.getElementById('btnLoginGoogle');
    const btnLoginGithub = document.getElementById('btnLoginGithub');

    if (badgeGoogle) {
      if (statusData.googleConfigured) {
        badgeGoogle.textContent = 'Sẵn Sàng';
        badgeGoogle.className = 'btn-status-badge status-badge-ready';
      } else {
        badgeGoogle.textContent = 'Chưa có Key';
        badgeGoogle.className = 'btn-status-badge status-badge-pending';
        // Khi click nếu chưa có key, hiển thị hướng dẫn
        btnLoginGoogle.addEventListener('click', (e) => {
          e.preventDefault();
          showToast('Chưa điền GOOGLE_CLIENT_ID trong .env. Bạn có thể xem hướng dẫn hoặc dùng nút "⚡ Test Gmail" bên dưới!', 'error');
          openModal();
        });
      }
    }

    if (badgeGithub) {
      if (statusData.githubConfigured) {
        badgeGithub.textContent = 'Sẵn Sàng';
        badgeGithub.className = 'btn-status-badge status-badge-ready';
      } else {
        badgeGithub.textContent = 'Chưa có Key';
        badgeGithub.className = 'btn-status-badge status-badge-pending';
        btnLoginGithub.addEventListener('click', (e) => {
          e.preventDefault();
          showToast('Chưa điền GITHUB_CLIENT_ID trong .env. Bạn có thể xem hướng dẫn hoặc dùng nút "⚡ Test GitHub" bên dưới!', 'error');
          openModal();
        });
      }
    }

    // Cập nhật text redirect URI trong modal nếu URL khác
    const googleUriElem = document.getElementById('googleRedirectUriText');
    const githubUriElem = document.getElementById('githubRedirectUriText');
    if (googleUriElem && statusData.redirectUris) {
      googleUriElem.textContent = statusData.redirectUris.google;
    }
    if (githubUriElem && statusData.redirectUris) {
      githubUriElem.textContent = statusData.redirectUris.github;
    }

  } catch (err) {
    console.error('Lỗi khi kiểm tra trạng thái Auth:', err);
  }
}

// Khởi chạy khi load trang
document.addEventListener('DOMContentLoaded', () => {
  checkUrlParams();
  checkAuthStatus();
});
