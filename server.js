import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

// Hỗ trợ reverse proxy (Render, Railway, VPS, Nginx, Cloudflare)
app.set('trust proxy', 1);

// Cấu hình Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret_key_123456789',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
      secure: 'auto', // Tự động nhận diện HTTPS khi lên host
      httpOnly: true,
    },
  })
);

// Phục vụ file tĩnh từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Kiểm tra trạng thái cấu hình OAuth Keys
app.get('/api/auth/status', (req, res) => {
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_ID.trim() !== '' &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_SECRET.trim() !== ''
  );

  const githubConfigured = Boolean(
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_ID.trim() !== '' &&
    process.env.GITHUB_CLIENT_SECRET &&
    process.env.GITHUB_CLIENT_SECRET.trim() !== ''
  );

  res.json({
    googleConfigured,
    githubConfigured,
    port: PORT,
    appUrl: APP_URL,
    redirectUris: {
      google: `${APP_URL}/auth/google/callback`,
      github: `${APP_URL}/auth/github/callback`,
    },
  });
});

// Lấy thông tin phiên đăng nhập của người dùng hiện tại
app.get('/auth/me', (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user,
    });
  } else {
    res.json({
      authenticated: false,
      user: null,
    });
  }
});

// ===============================================================
// GOOGLE OAUTH 2.0 (GMAIL)
// ===============================================================

app.get('/auth/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return res.redirect('/?error=google_not_configured');
  }

  const redirectUri = encodeURIComponent(`${APP_URL}/auth/google/callback`);
  const scope = encodeURIComponent('openid email profile');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  res.redirect(googleAuthUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('Google Auth Error:', error);
    return res.redirect(`/?error=${encodeURIComponent('Google login bị hủy hoặc gặp lỗi: ' + error)}`);
  }

  if (!code) {
    return res.redirect('/?error=no_code_provided');
  }

  try {
    // 1. Đổi code lấy Access Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code.toString(),
        client_id: process.env.GOOGLE_CLIENT_ID?.trim() || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET?.trim() || '',
        redirect_uri: `${APP_URL}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to get Google token:', tokenData);
      return res.redirect(`/?error=${encodeURIComponent('Lỗi khi đổi Google Token: ' + (tokenData.error_description || tokenData.error || 'Token failure'))}`);
    }

    // 2. Dùng Access Token lấy thông tin User Profile
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch Google user info:', userInfo);
      return res.redirect('/?error=failed_fetch_google_user');
    }

    // 3. Lưu vào Session
    req.session.user = {
      id: userInfo.sub,
      name: userInfo.name || userInfo.email?.split('@')[0],
      email: userInfo.email,
      picture: userInfo.picture,
      verifiedEmail: userInfo.email_verified,
      provider: 'google',
      providerDisplayName: 'Google (Gmail)',
      loginAt: new Date().toISOString(),
      raw: userInfo,
    };

    res.redirect('/dashboard.html');
  } catch (err) {
    console.error('Error during Google OAuth callback:', err);
    res.redirect(`/?error=${encodeURIComponent('Lỗi máy chủ khi xử lý đăng nhập Google')}`);
  }
});

// ===============================================================
// GITHUB OAUTH
// ===============================================================

app.get('/auth/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  if (!clientId) {
    return res.redirect('/?error=github_not_configured');
  }

  const redirectUri = encodeURIComponent(`${APP_URL}/auth/github/callback`);
  const scope = encodeURIComponent('read:user user:email');
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

  res.redirect(githubAuthUrl);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('GitHub Auth Error:', error);
    return res.redirect(`/?error=${encodeURIComponent('GitHub login bị hủy hoặc gặp lỗi: ' + error)}`);
  }

  if (!code) {
    return res.redirect('/?error=no_code_provided');
  }

  try {
    // 1. Đổi code lấy Access Token từ GitHub
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID?.trim(),
        client_secret: process.env.GITHUB_CLIENT_SECRET?.trim(),
        code: code.toString(),
        redirect_uri: `${APP_URL}/auth/github/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to get GitHub token:', tokenData);
      return res.redirect(`/?error=${encodeURIComponent('Lỗi khi đổi GitHub Token: ' + (tokenData.error_description || tokenData.error || 'Token failure'))}`);
    }

    // 2. Dùng Access Token lấy thông tin người dùng từ GitHub API
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'OAuth-App-Antigravity',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('Failed to fetch GitHub user info:', userData);
      return res.redirect('/?error=failed_fetch_github_user');
    }

    // 3. Nếu email bị ẩn (private email trong GitHub), gọi endpoint /user/emails
    let userEmail = userData.email;
    if (!userEmail) {
      try {
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'OAuth-App-Antigravity',
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (emailsResponse.ok) {
          const emails = await emailsResponse.json();
          // Lấy email primary & verified
          const primaryEmail = emails.find((e) => e.primary && e.verified) || emails[0];
          if (primaryEmail) {
            userEmail = primaryEmail.email;
          }
        }
      } catch (emailErr) {
        console.warn('Could not retrieve secondary emails from GitHub:', emailErr);
      }
    }

    // 4. Lưu vào Session
    req.session.user = {
      id: userData.id.toString(),
      name: userData.name || userData.login,
      username: userData.login,
      email: userEmail || `${userData.login}@users.noreply.github.com`,
      picture: userData.avatar_url,
      bio: userData.bio || '',
      profileUrl: userData.html_url,
      followers: userData.followers || 0,
      publicRepos: userData.public_repos || 0,
      provider: 'github',
      providerDisplayName: 'GitHub',
      loginAt: new Date().toISOString(),
      raw: userData,
    };

    res.redirect('/dashboard.html');
  } catch (err) {
    console.error('Error during GitHub OAuth callback:', err);
    res.redirect(`/?error=${encodeURIComponent('Lỗi máy chủ khi xử lý đăng nhập GitHub')}`);
  }
});

// ===============================================================
// CHẾ ĐỘ THỬ NGHIỆM DEMO (Dành cho việc test ngay lập tức mà không cần key)
// ===============================================================

app.get('/auth/demo/:provider', (req, res) => {
  const provider = req.params.provider;

  if (provider === 'google') {
    req.session.user = {
      id: 'demo-google-user-108291823901',
      name: 'Nguyễn Văn A (Demo User)',
      email: 'nguyenvana.demo@gmail.com',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      verifiedEmail: true,
      provider: 'google',
      providerDisplayName: 'Google (Gmail)',
      isDemo: true,
      loginAt: new Date().toISOString(),
      raw: {
        sub: 'demo-google-user-108291823901',
        name: 'Nguyễn Văn A (Demo User)',
        email: 'nguyenvana.demo@gmail.com',
        email_verified: true,
        locale: 'vi',
      },
    };
  } else if (provider === 'github') {
    req.session.user = {
      id: 'demo-github-user-9823412',
      name: 'Trần Minh Quân (Demo Dev)',
      username: 'quan-developer',
      email: 'quan.dev@github.example.com',
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      bio: 'Fullstack Developer & Open Source Enthusiast 🚀',
      profileUrl: 'https://github.com',
      followers: 42,
      publicRepos: 18,
      provider: 'github',
      providerDisplayName: 'GitHub',
      isDemo: true,
      loginAt: new Date().toISOString(),
      raw: {
        login: 'quan-developer',
        id: 9823412,
        name: 'Trần Minh Quân (Demo Dev)',
        public_repos: 18,
        followers: 42,
      },
    };
  } else {
    return res.redirect('/?error=invalid_demo_provider');
  }

  res.redirect('/dashboard.html');
});

// ===============================================================
// ĐĂNG XUẤT (LOGOUT)
// ===============================================================

app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/?message=logged_out');
  });
});

// Khởi chạy Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Ứng dụng Web OAuth đang chạy tại: ${APP_URL}`);
  console.log(`🔑 Google Auth Endpoint: ${APP_URL}/auth/google`);
  console.log(`🔑 GitHub Auth Endpoint: ${APP_URL}/auth/github`);
  console.log(`💡 Chế độ thử nghiệm Demo:`);
  console.log(`   - Google Demo: ${APP_URL}/auth/demo/google`);
  console.log(`   - GitHub Demo: ${APP_URL}/auth/demo/github`);
  console.log(`=================================================`);
});
