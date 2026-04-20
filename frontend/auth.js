const authMessage = document.getElementById('auth-message');
const tabButtons = document.querySelectorAll('.tab-button');
const forms = document.querySelectorAll('.auth-form');

if (localStorage.getItem('authToken')) {
  window.location.replace('/dashboard');
}

function setActiveTab(tabName) {
  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });

  forms.forEach((form) => {
    form.classList.toggle('active', form.dataset.form === tabName);
  });

  authMessage.textContent = '';
}

async function submitAuthForm(endpoint, form) {
  const formData = new FormData(form);
  const payload = {
    username: formData.get('username'),
    password: formData.get('password')
  };

  const response = await fetch(`/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Authentication failed.');
  }

  localStorage.setItem('authToken', data.token);
  localStorage.setItem('authUser', JSON.stringify(data.user));
  window.location.replace('/dashboard');
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await submitAuthForm('login', event.currentTarget);
  } catch (error) {
    authMessage.textContent = error.message;
  }
});

document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await submitAuthForm('register', event.currentTarget);
  } catch (error) {
    authMessage.textContent = error.message;
  }
});