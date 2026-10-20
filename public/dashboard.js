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

async function loadUserProfile() {
  try {
    const res = await fetch('/auth/me');
    const data = await res.json();

    if (!data.authenticated || !data.user) {
      window.location.href = '/?message=session_expired';
      return;
    }

    const user = data.user;

    // Cập nhật Avatar và Tên
    const avatarElem = document.getElementById('userAvatar');
    if (avatarElem) {
      avatarElem.src = user.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
      avatarElem.alt = user.name || 'User Avatar';
    }

    const nameElem = document.getElementById('userName');
    if (nameElem) nameElem.textContent = user.name || user.username || 'Người dùng';

    const emailElem = document.getElementById('userEmail');
    if (emailElem) emailElem.textContent = user.email || 'Không có email công khai';

    // Badge Demo
    const demoTag = document.getElementById('demoTag');
    if (demoTag && user.isDemo) {
      demoTag.style.display = 'inline-block';
    }

    // Provider Chip Icon
    const providerChip = document.getElementById('providerChip');
    if (providerChip) {
      if (user.provider === 'google') {
        providerChip.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
        `;
      } else {
        providerChip.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
        `;
      }
    }

    // Grid Info
    const providerNameElem = document.getElementById('providerName');
    if (providerNameElem) {
      providerNameElem.textContent = user.providerDisplayName || user.provider;
    }

    const userIdElem = document.getElementById('userId');
    if (userIdElem) userIdElem.textContent = user.id || 'N/A';

    const loginTimeElem = document.getElementById('loginTime');
    if (loginTimeElem) {
      const date = new Date(user.loginAt || Date.now());
      loginTimeElem.textContent = date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }

    // Extra Box: Google email verified hoặc GitHub Repos
    const extraLabel1 = document.getElementById('extraLabel1');
    const extraValue1 = document.getElementById('extraValue1');
    if (user.provider === 'google') {
      extraLabel1.textContent = 'Trạng thái Gmail';
      extraValue1.textContent = user.verifiedEmail !== false ? '✅ Đã xác thực' : '⚠️ Chưa xác minh';
    } else {
      extraLabel1.textContent = 'Public Repositories';
      extraValue1.textContent = `${user.publicRepos ?? 0} repos (${user.followers ?? 0} followers)`;
      extraValue1.style.color = '#38bdf8';

      // Hiển thị phần bio và link GitHub nếu có
      const githubDetails = document.getElementById('githubDetails');
      const userBio = document.getElementById('userBio');
      const userGithubLink = document.getElementById('userGithubLink');

      if (githubDetails) {
        githubDetails.style.display = 'block';
        if (userBio) userBio.textContent = user.bio || 'Chưa cập nhật tiểu sử trên GitHub.';
        if (userGithubLink && user.profileUrl) {
          userGithubLink.href = user.profileUrl;
          userGithubLink.textContent = `🔗 Xem hồ sơ @${user.username} trên GitHub &rarr;`;
        }
      }
    }

    // Dữ liệu Raw JSON
    const rawJsonContent = document.getElementById('rawJsonContent');
    if (rawJsonContent) {
      rawJsonContent.textContent = JSON.stringify(user, null, 2);
    }

    showToast(`Chào mừng bạn, ${user.name || 'thành viên'}! Đăng nhập thành công.`, 'success');

  } catch (err) {
    console.error('Lỗi khi tải thông tin user:', err);
    showToast('Lỗi khi tải thông tin người dùng từ máy chủ', 'error');
  }
}

// Bật tắt xem Raw JSON
const btnToggleJson = document.getElementById('btnToggleJson');
const rawJsonPanel = document.getElementById('rawJsonPanel');

if (btnToggleJson && rawJsonPanel) {
  btnToggleJson.addEventListener('click', () => {
    rawJsonPanel.classList.toggle('active');
    btnToggleJson.querySelector('span').textContent = rawJsonPanel.classList.contains('active')
      ? 'Ẩn Dữ Liệu JSON'
      : 'Xem Dữ Liệu JSON Thô';
  });
}

document.addEventListener('DOMContentLoaded', loadUserProfile);
