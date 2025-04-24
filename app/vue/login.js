// 登录页面Vue组件
const app = new Vue({
  el: '#app',
  data() {
    return {
      username: '',
      password: '',
      rememberMe: false,
      usernameError: '',
      passwordError: '',
      formErrors: [],
      showPassword: false,
      isLoggingIn: false,
      loginFailed: false,
      loginErrorMessage: ''
    }
  },
  computed: {
    formIsValid() {
      return this.username.trim() !== '' && 
             this.password.trim() !== '' && 
             !this.usernameError && 
             !this.passwordError;
    }
  },
  methods: {
    validateUsername() {
      this.usernameError = '';
      if (!this.username.trim()) {
        this.usernameError = '用户名不能为空';
        return;
      }
      if (this.username.length < 3) {
        this.usernameError = '用户名长度至少为3个字符';
      }
    },
    validatePassword() {
      this.passwordError = '';
      if (!this.password.trim()) {
        this.passwordError = '密码不能为空';
        return;
      }
      if (this.password.length < 6) {
        this.passwordError = '密码长度至少为6个字符';
      }
    },
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    closeAlert() {
      this.loginFailed = false;
    },
    login() {
      // 重置错误
      this.formErrors = [];
      this.loginFailed = false;
      
      // 表单验证
      this.validateUsername();
      this.validatePassword();
      
      if (!this.formIsValid) {
        return;
      }
      
      // 显示加载状态
      this.isLoggingIn = true;
      
      // 模拟API调用
      setTimeout(() => {
        const apiUrl = '/api/login';
        
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username,
            password: this.password,
            rememberMe: this.rememberMe
          })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('登录失败');
          }
          return response.json();
        })
        .then(data => {
          // 登录成功，重定向到首页或仪表盘
          localStorage.setItem('token', data.token);
          window.location.href = '/dashboard';
        })
        .catch(error => {
          // 登录失败，显示错误消息
          this.loginFailed = true;
          this.loginErrorMessage = '用户名或密码不正确，请重试。';
          console.error('登录错误:', error);
        })
        .finally(() => {
          this.isLoggingIn = false;
        });
      }, 1000); // 模拟网络延迟
    },
    checkPreviousLogin() {
      // 检查用户是否已经登录
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const rememberMe = localStorage.getItem('rememberMe');
      
      if (isLoggedIn === 'true') {
        // 如果已登录，重定向到主页
        window.location.href = 'dashboard.html';
      }
      
      // 如果记住了登录，填充用户名
      if (rememberMe === 'true') {
        this.username = localStorage.getItem('username') || '';
        this.rememberMe = true;
      }
    }
  },
  mounted() {
    // 页面加载时检查登录状态
    this.checkPreviousLogin();
  }
});

// 登录处理逻辑
const loginHandler = {
  data() {
    return {
      username: '',
      password: '',
      loginError: '',
      isLoggingIn: false,
      isLoggedIn: false,
      currentUser: null
    };
  },
  
  methods: {
    // 处理登录表单提交
    handleLogin() {
      this.isLoggingIn = true;
      this.loginError = '';
      
      // 检查输入验证
      if (!this.username || !this.password) {
        this.loginError = '请输入用户名和密码';
        this.isLoggingIn = false;
        return;
      }
      
      // 发送登录请求
      const apiUrl = window.location.origin + '/login';
      
      axios.post(apiUrl, {
        username: this.username,
        password: this.password
      })
      .then(response => {
        if (response.data && response.data.success) {
          this.isLoggedIn = true;
          this.currentUser = response.data.user;
          
          // 存储用户信息
          localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          
          // 触发登录成功事件
          this.$emit('login-success', this.currentUser);
          
          // 重置表单
          this.username = '';
          this.password = '';
          
          // 显示登录成功通知
          this.$root.showNotification('登录成功', '欢迎回来，' + this.currentUser.name, 'success');
          
          // 加载销售计划和产品数据
          this.$root.loadSalesPlans();
          this.$root.loadProducts();
        } else {
          this.loginError = response.data.message || '登录失败，请重试';
        }
      })
      .catch(error => {
        console.error('登录错误:', error);
        this.loginError = '登录服务异常，请联系管理员';
      })
      .finally(() => {
        this.isLoggingIn = false;
      });
    },
    
    // 检查是否已登录
    checkLoginStatus() {
      const savedUser = localStorage.getItem('currentUser');
      
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
          this.isLoggedIn = true;
          
          // 验证会话是否有效
          this.validateSession();
          
          return true;
        } catch (e) {
          console.error('解析用户信息出错:', e);
          localStorage.removeItem('currentUser');
        }
      }
      
      return false;
    },
    
    // 验证当前会话是否仍然有效
    validateSession() {
      const apiUrl = window.location.origin + '/currentUser';
      
      axios.get(apiUrl)
        .then(response => {
          if (response.data && response.data.id) {
            // 更新用户信息
            this.currentUser = response.data;
            this.isLoggedIn = true;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          } else {
            // 会话已过期，需要重新登录
            this.logout();
          }
        })
        .catch(error => {
          console.error('验证会话出错:', error);
          // 出错时，假设会话已过期
          this.logout();
        });
    },
    
    // 登出
    logout() {
      const apiUrl = window.location.origin + '/logout';
      
      axios.post(apiUrl)
        .then(() => {
          this.performLogout();
        })
        .catch(error => {
          console.error('登出出错:', error);
          this.performLogout();
        });
    },
    
    // 执行登出逻辑
    performLogout() {
      // 清除本地存储
      localStorage.removeItem('currentUser');
      
      // 重置状态
      this.isLoggedIn = false;
      this.currentUser = null;
      
      // 触发登出事件
      this.$emit('logout');
      
      // 显示通知
      this.$root.showNotification('已登出', '您已成功退出系统', 'info');
    }
  }
};

// 导出登录处理器
window.loginHandler = loginHandler; 