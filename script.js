import { Game } from './src/core/game.js';

// Pop-up infos
const infoBtn = document.getElementById('info-btn');
const infoPopup = document.getElementById('info-popup');
const closePopup = document.getElementById('close-popup');
infoBtn.onclick = () => infoPopup.style.display = 'flex';
closePopup.onclick = () => infoPopup.style.display = 'none';
window.onclick = (e) => {
    if (e.target === infoPopup) infoPopup.style.display = 'none';
};

// Système de compte (localStorage)
const accountForm = document.getElementById('account-form');
const playBtn = document.getElementById('play-btn');
const logoutBtn = document.getElementById('logout-btn');
let loggedIn = false;
let currentUser = localStorage.getItem('mow_user') || null;

function updateUI() {
    if (currentUser) {
        loggedIn = true;
        playBtn.textContent = `Jouer en tant que ${currentUser}`;
        logoutBtn.style.display = '';
        // Désactive les inputs et pré-remplit
        accountForm.username.value = currentUser;
        accountForm.username.disabled = true;
        accountForm.password.value = '';
        accountForm.password.disabled = true;
        playBtn.disabled = false;
    } else {
        loggedIn = false;
        playBtn.textContent = 'Jouer';
        logoutBtn.style.display = 'none';
        accountForm.username.value = '';
        accountForm.username.disabled = false;
        accountForm.password.value = '';
        accountForm.password.disabled = false;
        playBtn.disabled = false;
    }
}

accountForm.onsubmit = (e) => {
    e.preventDefault();
    if (loggedIn) {
        launchGame();
        return;
    }
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (username && password) {
        let users = JSON.parse(localStorage.getItem('mow_users') || '{}');
        if (!users[username]) users[username] = {};
        users[username].password = password;
        users[username].progress = users[username].progress || {};
        localStorage.setItem('mow_users', JSON.stringify(users));
        localStorage.setItem('mow_user', username);
        currentUser = username;
        updateUI();
    }
};

logoutBtn.onclick = () => {
    localStorage.removeItem('mow_user');
    currentUser = null;
    updateUI();
};

updateUI();

// Lancement du jeu
const home = document.getElementById('home-screen');
const canvas = document.getElementById('game');
function launchGame() {
    if (!currentUser) return;
    home.style.display = 'none';
    canvas.style.display = '';
    document.body.style.pointerEvents = '';
    let users = JSON.parse(localStorage.getItem('mow_users') || '{}');
    let progress = users[currentUser]?.progress || {};
    const game = new Game(progress, currentUser);
    game.run();
}