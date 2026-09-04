const API_URL = '/api/v1/Recipes';
const AUTH_URL = '/api/v1/Auth';
let currentLanguage = 'bg';

// --- РЕЧНИК ЗА UI ПРЕВОДИ ---
const uiTranslations = {
    bg: {
        siteTitle: "🍳 Кулинарен Блог",
        createHeader: "Добави нова рецепта",
        lblTitle: "Заглавие:",
        lblCategory: "Категория:",
        lblIngredients: "Съставки:",
        lblInstructions: "Начин на приготвяне:",
        lblImageFile: "Снимка (файлов качване):",
        lblImageUrl: "ИЛИ URL на снимка:",
        btnPublish: "Публикувай рецепта",
        btnAuthModal: "Вход / Регистрация",
        btnLogout: "Изход",
        tabLogin: "Вход",
        tabRegister: "Регистрация",
        loginHeader: "Вход в профила",
        regHeader: "Нова регистрация",
        lblEmail: "Имейл:",
        lblPassword: "Парола:",
        lblUsername: "Потребителско име / Име:",
        btnLoginSubmit: "Влез",
        btnRegSubmit: "Регистрирай се",
        btnViewRecipe: "Виж рецептата",
        modalIngredientsHeader: "🛒 Съставки",
        modalInstructionsHeader: "👨‍🍳 Начин на приготвяне",
        loadingText: "Зареждане на рецепти...",
        noRecipesText: "Няма намерени рецепти.",
        greeting: "Здравей",
        categories: ["Основни", "Салати", "Десерти", "Супи"]
    },
    en: {
        siteTitle: "🍳 Culinary Blog",
        createHeader: "Add New Recipe",
        lblTitle: "Title:",
        lblCategory: "Category:",
        lblIngredients: "Ingredients:",
        lblInstructions: "Instructions:",
        lblImageFile: "Image (File Upload):",
        lblImageUrl: "OR Image URL:",
        btnPublish: "Publish Recipe",
        btnAuthModal: "Login / Register",
        btnLogout: "Logout",
        tabLogin: "Login",
        tabRegister: "Register",
        loginHeader: "Account Login",
        regHeader: "New Registration",
        lblEmail: "Email:",
        lblPassword: "Password:",
        lblUsername: "Username / Name:",
        btnLoginSubmit: "Login",
        btnRegSubmit: "Register",
        btnViewRecipe: "View Recipe",
        modalIngredientsHeader: "🛒 Ingredients",
        modalInstructionsHeader: "👨‍🍳 Instructions",
        loadingText: "Loading recipes...",
        noRecipesText: "No recipes found.",
        greeting: "Hello",
        categories: ["Main Dishes", "Salads", "Desserts", "Soups"]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnBg = document.getElementById('btn-bg');
    const btnEn = document.getElementById('btn-en');

    if (btnBg) btnBg.addEventListener('click', () => switchLanguage('bg'));
    if (btnEn) btnEn.addEventListener('click', () => switchLanguage('en'));

    // Форма за рецепта
    const createForm = document.getElementById('create-recipe-form');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateRecipe);
    }

    // Модал за вход / регистрация
    setupAuthModal();
    checkAuthStatus();

    // Зареждаме UI преводите и рецептите
    updateUiLanguage(currentLanguage);
    fetchRecipes(currentLanguage);
});

// --- ДИНАМИЧЕН UI ПРЕВОД ---

function updateUiLanguage(lang) {
    const t = uiTranslations[lang];
    if (!t) return;

    document.getElementById('site-title').textContent = t.siteTitle;
    document.getElementById('lbl-create-header').textContent = t.createHeader;
    document.getElementById('lbl-title').textContent = t.lblTitle;
    document.getElementById('lbl-category').textContent = t.lblCategory;
    document.getElementById('lbl-ingredients').textContent = t.lblIngredients;
    document.getElementById('lbl-instructions').textContent = t.lblInstructions;
    document.getElementById('lbl-image-file').textContent = t.lblImageFile;
    document.getElementById('lbl-image-url').textContent = t.lblImageUrl;
    document.getElementById('btn-publish').textContent = t.btnPublish;

    const btnAuth = document.getElementById('btn-auth-modal');
    if (btnAuth && !localStorage.getItem('token')) {
        btnAuth.textContent = t.btnAuthModal;
    }
    document.getElementById('btn-logout').textContent = t.btnLogout;
    document.getElementById('tab-login').textContent = t.tabLogin;
    document.getElementById('tab-register').textContent = t.tabRegister;

    document.getElementById('lbl-login-header').textContent = t.loginHeader;
    document.getElementById('lbl-login-email').textContent = t.lblEmail;
    document.getElementById('lbl-login-password').textContent = t.lblPassword;
    document.getElementById('btn-login-submit').textContent = t.btnLoginSubmit;

    document.getElementById('lbl-reg-header').textContent = t.regHeader;
    document.getElementById('lbl-reg-username').textContent = t.lblUsername;
    document.getElementById('lbl-reg-email').textContent = t.lblEmail;
    document.getElementById('lbl-reg-password').textContent = t.lblPassword;
    document.getElementById('btn-reg-submit').textContent = t.btnRegSubmit;

    document.getElementById('modal-lbl-ingredients').textContent = t.modalIngredientsHeader;
    document.getElementById('modal-lbl-instructions').textContent = t.modalInstructionsHeader;

    // Обновяване на категория опциите във формата
    const selectCat = document.getElementById('category');
    if (selectCat && selectCat.options.length === 4) {
        const bgCategories = ["Основни", "Салати", "Десерти", "Супи"];
        for (let i = 0; i < selectCat.options.length; i++) {
            selectCat.options[i].text = t.categories[i];
            selectCat.options[i].value = bgCategories[i]; // Запазваме консистентна стойност за бекенда
        }
    }
}

function switchLanguage(lang) {
    currentLanguage = lang;
    const btnBg = document.getElementById('btn-bg');
    const btnEn = document.getElementById('btn-en');

    if (btnBg) btnBg.classList.toggle('active', lang === 'bg');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');

    updateUiLanguage(lang);
    checkAuthStatus();
    fetchRecipes(lang);
}

// --- АВТЕНТИКАЦИЯ И МОДАЛ ---

function setupAuthModal() {
    const modal = document.getElementById('auth-modal');
    const btnOpen = document.getElementById('btn-auth-modal');
    const btnClose = document.querySelector('.close-modal');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const btnLogout = document.getElementById('btn-logout');

    if (btnOpen) btnOpen.onclick = () => modal.style.display = 'flex';
    if (btnClose) btnClose.onclick = () => modal.style.display = 'none';

    window.onclick = (event) => {
        if (event.target === modal) modal.style.display = 'none';
    };

    if (tabLogin && tabRegister) {
        tabLogin.onclick = () => {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        };

        tabRegister.onclick = () => {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
        };
    }

    if (loginForm) loginForm.onsubmit = handleLogin;
    if (registerForm) registerForm.onsubmit = handleRegister;
    if (btnLogout) btnLogout.onclick = handleLogout;
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) throw new Error('Невалиден имейл или парола!');

        const data = await response.json();
        localStorage.setItem('token', data.token);
        if (data.username) localStorage.setItem('username', data.username);

        alert('Успешен вход!');
        document.getElementById('auth-modal').style.display = 'none';
        checkAuthStatus();
    } catch (err) {
        alert(`Грешка при вход: ${err.message}`);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch(`${AUTH_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        if (!response.ok) throw new Error('Грешка при регистрация.');

        alert('Регистрацията е успешна! Моля, влезте с вашите данни.');
        document.getElementById('tab-login').click();
    } catch (err) {
        alert(`Грешка: ${err.message}`);
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    alert('Излязохте от профила.');
    checkAuthStatus();
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const btnAuth = document.getElementById('btn-auth-modal');
    const btnLogout = document.getElementById('btn-logout');
    const userDisplay = document.getElementById('user-display-name');
    const greetingText = uiTranslations[currentLanguage].greeting;

    if (token) {
        if (btnAuth) btnAuth.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'inline-block';
        if (userDisplay) {
            userDisplay.textContent = username ? `${greetingText}, ${username}` : `${greetingText}!`;
            userDisplay.style.display = 'inline-block';
        }
    } else {
        if (btnAuth) {
            btnAuth.textContent = uiTranslations[currentLanguage].btnAuthModal;
            btnAuth.style.display = 'inline-block';
        }
        if (btnLogout) btnLogout.style.display = 'none';
        if (userDisplay) userDisplay.style.display = 'none';
    }
}

// --- РЕЦЕПТИ & ПРЕВОДИ ---

async function fetchRecipes(lang) {
    const container = document.getElementById('recipes-list');
    if (container) container.innerHTML = `<p>${uiTranslations[lang].loadingText}</p>`;

    try {
        const response = await fetch(`${API_URL}?lang=${lang}`);
        if (!response.ok) throw new Error(`Статус: ${response.status}`);

        const recipes = await response.json();
        renderRecipes(recipes);
    } catch (error) {
        console.error('Грешка:', error);
        if (container) container.innerHTML = `<p style="color:red;">Грешка при зареждане: ${error.message}</p>`;
    }
}

function renderRecipes(recipes) {
    const container = document.getElementById('recipes-list');
    if (!container) return;
    container.innerHTML = '';

    if (!recipes || recipes.length === 0) {
        container.innerHTML = `<p>${uiTranslations[currentLanguage].noRecipesText}</p>`;
        return;
    }

    // Запазваме списъка в глобална променлива
    window.currentRecipesList = recipes;

    recipes.forEach((recipe, index) => {
        const card = document.createElement('div');
        card.className = 'recipe-card';

        const imageUrl = recipe.imageUrl || recipe.ImageUrl || 'https://picsum.photos/400/200?food';
        const titleText = recipe.title || recipe.Title || 'Без заглавие';
        const categoryText = recipe.category || recipe.Category || 'Общи';

        // Използваме безопасни DOM методи срещу XSS
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = titleText;
        img.className = 'recipe-image';

        const content = document.createElement('div');
        content.className = 'recipe-content';

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = categoryText;

        const title = document.createElement('h3');
        title.className = 'recipe-title';
        title.textContent = titleText;

        const btnView = document.createElement('button');
        btnView.className = 'btn btn-view-recipe';
        btnView.textContent = uiTranslations[currentLanguage].btnViewRecipe;
        btnView.addEventListener('click', () => openRecipeModal(recipe));

        content.appendChild(badge);
        content.appendChild(title);
        content.appendChild(btnView);

        card.appendChild(img);
        card.appendChild(content);

        container.appendChild(card);
    });
}

function openRecipeModal(recipe) {
    const modal = document.getElementById('recipe-details-modal');
    if (!modal) return;

    const img = document.getElementById('modal-recipe-image');
    img.src = recipe.imageUrl || recipe.ImageUrl || 'https://picsum.photos/400/200?food';
    img.alt = recipe.title || recipe.Title || '';

    document.getElementById('modal-recipe-title').textContent = recipe.title || recipe.Title || '';
    document.getElementById('modal-recipe-category').textContent = recipe.category || recipe.Category || '';
    document.getElementById('modal-recipe-ingredients').textContent = recipe.ingredients || recipe.Ingredients || '';
    document.getElementById('modal-recipe-instructions').textContent = recipe.instructions || recipe.Instructions || '';

    modal.style.display = 'flex';

    const closeBtn = document.querySelector('.close-recipe-modal');
    closeBtn.onclick = () => modal.style.display = 'none';

    window.onclick = (event) => {
        if (event.target === modal) modal.style.display = 'none';
        const authModal = document.getElementById('auth-modal');
        if (event.target === authModal) authModal.style.display = 'none';
    };
}

// --- СЪЗДАВАНЕ НА РЕЦЕПТА ---

async function handleCreateRecipe(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Трябва да сте влезли в профила си, за да добавите рецепта!');
        document.getElementById('auth-modal').style.display = 'flex';
        return;
    }

    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const ingredients = document.getElementById('ingredients').value;
    const instructions = document.getElementById('instructions').value;
    const imageFileInput = document.getElementById('imageFile');
    let imageUrl = document.getElementById('imageUrl') ? document.getElementById('imageUrl').value : '';

    try {
        if (imageFileInput && imageFileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('file', imageFileInput.files[0]);

            const uploadRes = await fetch(`${API_URL}/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.imageUrl;
            }
        }

        const recipeData = { title, category, ingredients, instructions, imageUrl };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(recipeData)
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Сесията ви е изтекла. Моля, влезте отново.');
            }
            throw new Error('Неуспешно публикуване на рецептата.');
        }

        alert('Рецептата е изпратена успешно!');
        document.getElementById('create-recipe-form').reset();
        fetchRecipes(currentLanguage);
    } catch (error) {
        console.error('Грешка:', error);
        alert(`Грешка: ${error.message}`);
    }
}