// Main script for the Outcrook email detective game - Modular version

import { CONFIG } from './assets/js/config.js';
import { 
    formatUserName, 
    getUserName, 
    setUserName, 
    isDarkModeEnabled, 
    setDarkMode, 
    getCursorTheme, 
    setCursorTheme,
    wait 
} from './assets/js/utils.js';
import { loadEmailTemplates } from './assets/js/email-manager.js';
import { 
    updateCurrentTime, 
    refreshUnreadCounts, 
    renderEmailItem, 
    displayEmailContent, 
    simulateTyping, 
    showCustomPrompt, 
    handleMagnifierReveal,
    jumbleClueText 
} from './assets/js/ui-components.js';
import { 
    GameState, 
    EmailDeliverySystem, 
    ReplySystem, 
    ComposeSystem, 
    InstallationSystem 
} from './assets/js/game-logic.js';

// Global game state
let gameState;
let emailDeliverySystem;
let replySystem;
let composeSystem;
let installationSystem;

// DOM elements
let container;
let introScreen;
let nameInput;
let startGameBtn;
let userProfile;
let emailListDiv;
let emailListFolderHeader;
let replyEmailBtn;
let emailBodyContentDiv;
let currentTimeSpan;

// Custom cursor elements
let cursorOptions;
let customCursor;
let currentCursorTheme = CONFIG.CURSOR_THEMES.DEFAULT;

// Settings elements
let settingsBtn;
let settingsMenu;
let closeSettingsBtn;
let darkModeToggle;
let body;

// Compose elements
let composeModalOverlay;
let composeBtn;
let closeComposeBtn;
let sendComposeBtn;
let composeTo;
let composeSubject;
let composeBody;

// Microscope elements
let microscopeWrapper;
let magnifyingGlassIcon;
let microscopeStatus;

/**
 * Initialize the game
 */
async function initializeGame() {
    try {
        // Load email templates
        await loadEmailTemplates();
        
        // Initialize game systems
        gameState = new GameState();
        emailDeliverySystem = new EmailDeliverySystem(gameState, onEmailDelivered);
        replySystem = new ReplySystem(gameState, emailDeliverySystem, onReplySent);
        composeSystem = new ComposeSystem(gameState, emailDeliverySystem, onEmailSent);
        installationSystem = new InstallationSystem(gameState, emailDeliverySystem, onInstallationComplete);
        
        // Make emails global for external functions
        window.emails = gameState.emails;
        
        // Get DOM elements
        initializeDOMElements();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize UI
        initializeUI();
        
        // Start the game
        startGame();
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showCustomPrompt('Failed to initialize game. Please refresh the page.', 'alert');
    }
}

/**
 * Initialize DOM elements
 */
function initializeDOMElements() {
    container = document.querySelector(CONFIG.SELECTORS.CONTAINER);
    introScreen = document.querySelector(CONFIG.SELECTORS.INTRO_SCREEN);
    nameInput = document.querySelector(CONFIG.SELECTORS.NAME_INPUT);
    startGameBtn = document.querySelector(CONFIG.SELECTORS.START_GAME_BTN);
    userProfile = document.querySelector(CONFIG.SELECTORS.USER_PROFILE);
    emailListDiv = document.querySelector(CONFIG.SELECTORS.EMAIL_LIST_DIV);
    emailListFolderHeader = document.querySelector(CONFIG.SELECTORS.EMAIL_LIST_FOLDER_HEADER);
    replyEmailBtn = document.querySelector(CONFIG.SELECTORS.REPLY_EMAIL_BTN);
    emailBodyContentDiv = document.querySelector(CONFIG.SELECTORS.EMAIL_BODY_CONTENT_DIV);
    currentTimeSpan = document.querySelector(CONFIG.SELECTORS.CURRENT_TIME_SPAN);
    
    // Custom cursor elements
    cursorOptions = document.querySelectorAll('.cursor-option');
    customCursor = document.querySelector(CONFIG.SELECTORS.CUSTOM_CURSOR);
    
    // Settings elements
    settingsBtn = document.querySelector(CONFIG.SELECTORS.SETTINGS_BTN);
    settingsMenu = document.querySelector(CONFIG.SELECTORS.SETTINGS_MENU);
    closeSettingsBtn = document.querySelector(CONFIG.SELECTORS.CLOSE_SETTINGS_BTN);
    darkModeToggle = document.querySelector(CONFIG.SELECTORS.DARK_MODE_TOGGLE);
    body = document.body;
    
    // Compose elements
    composeModalOverlay = document.querySelector(CONFIG.SELECTORS.COMPOSE_MODAL_OVERLAY);
    composeBtn = document.querySelector(CONFIG.SELECTORS.COMPOSE_BTN);
    closeComposeBtn = document.querySelector(CONFIG.SELECTORS.CLOSE_COMPOSE_BTN);
    sendComposeBtn = document.querySelector(CONFIG.SELECTORS.SEND_COMPOSE_BTN);
    composeTo = document.querySelector(CONFIG.SELECTORS.COMPOSE_TO);
    composeSubject = document.querySelector(CONFIG.SELECTORS.COMPOSE_SUBJECT);
    composeBody = document.querySelector(CONFIG.SELECTORS.COMPOSE_BODY);
    
    // Microscope elements
    microscopeWrapper = document.querySelector(CONFIG.SELECTORS.MICROSCOPE_WRAPPER);
    magnifyingGlassIcon = document.querySelector(CONFIG.SELECTORS.MAGNIFYING_GLASS_ICON);
    microscopeStatus = document.querySelector(CONFIG.SELECTORS.MICROSCOPE_STATUS);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Intro screen listeners
    startGameBtn.addEventListener('click', handleStartGame);
    nameInput.addEventListener('keydown', handleNameInputKeydown);
    nameInput.addEventListener('input', handleNameInputChange);
    
    // Navigation listeners
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const folder = item.id.replace('-nav', '');
            setActiveFolder(folder);
            loadEmailsForFolder(folder);
        });
    });
    
    // Settings listeners
    settingsBtn.addEventListener('click', () => settingsMenu.style.display = 'flex');
    closeSettingsBtn.addEventListener('click', () => settingsMenu.style.display = 'none');
    darkModeToggle.addEventListener('change', handleDarkModeToggle);
    cursorOptions.forEach(option => {
        option.addEventListener('click', () => applyCursorTheme(option.dataset.cursor));
    });
    
    // Compose listeners
    composeBtn.addEventListener('click', openComposeModal);
    closeComposeBtn.addEventListener('click', closeComposeModal);
    sendComposeBtn.addEventListener('click', handleSendCompose);
    composeTo.addEventListener('change', handleComposeToChange);
    
    // Mouse move listener for custom cursor
    document.addEventListener('mousemove', handleMouseMove);
}

/**
 * Initialize UI
 */
function initializeUI() {
    // Load preferences
    if (isDarkModeEnabled()) {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    const savedCursorTheme = getCursorTheme();
    applyCursorTheme(savedCursorTheme);
}

/**
 * Start the game
 */
function startGame() {
    container.style.display = 'grid';
    introScreen.style.display = 'none';
    
    // Setup timers
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();
    
    // Load initial emails
    loadEmailsForFolder(gameState.currentFolder);
    refreshUnreadCounts(gameState.emails);
    
    // Deliver welcome email after delay
    setTimeout(() => {
        emailDeliverySystem.deliverWelcomeEmail();
    }, CONFIG.TIMING.WELCOME_EMAIL_DELAY);
}

/**
 * Handle start game button click
 */
function handleStartGame() {
    const userName = nameInput.value;
    if (userName && userName.trim().length > 0) {
        const formattedName = formatUserName(userName);
        setUserName(formattedName);
        userProfile.textContent = `Detective ${formattedName}`;
        initializeGame();
    } else {
        nameInput.classList.add('input-error');
    }
}

/**
 * Handle name input keydown
 */
function handleNameInputKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        startGameBtn.click();
    }
}

/**
 * Handle name input change
 */
function handleNameInputChange() {
    if (nameInput.classList.contains('input-error')) {
        nameInput.classList.remove('input-error');
    }
    
    const placeholder = document.getElementById('placeholder-flash');
    if (nameInput.value.length > 0) {
        placeholder.style.display = 'none';
    } else {
        placeholder.style.display = 'block';
    }
}

/**
 * Load emails for a specific folder
 */
function loadEmailsForFolder(folder) {
    emailListDiv.innerHTML = '';
    emailBodyContentDiv.innerHTML = '<h3 class="email-content-placeholder">Select an email to view its content</h3>';
    if (replyEmailBtn) replyEmailBtn.style.display = 'none';
    
    gameState.currentFolder = folder;
    emailListFolderHeader.textContent = folder.charAt(0).toUpperCase() + folder.slice(1);
    
    const filteredEmails = gameState.getEmailsForFolder(folder);
    if (filteredEmails.length > 0) {
        // Sort emails by timestamp
        filteredEmails.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        filteredEmails.forEach(email => {
            const emailItem = renderEmailItem(email, folder);
            
            // Add pulsation to read legal-email
            if (email.id === 'legal-email' && email.read) {
                const deleteButton = emailItem.querySelector('.delete-email-item-btn');
                if (deleteButton) {
                    deleteButton.classList.add('delete-nudge-active');
                }
            }
            
            emailListDiv.appendChild(emailItem);
        });
        
        // Select the first email
        const firstEmailToSelect = filteredEmails.find(email => !email.read) || filteredEmails[0];
        if (firstEmailToSelect) {
            const correspondingEmailItem = emailListDiv.querySelector(`[data-email-id="${firstEmailToSelect.id}"]`);
            if (correspondingEmailItem) {
                handleEmailDisplay(firstEmailToSelect, correspondingEmailItem);
            }
        }
    } else {
        emailListDiv.innerHTML = '<div class="email-list-placeholder">No emails in this folder.</div>';
        emailBodyContentDiv.innerHTML = '<div class="email-content-placeholder">Select an email to view its content</div>';
    }
}

/**
 * Handle email display
 */
function handleEmailDisplay(email, emailItem) {
    // Stop existing pulses
    document.querySelectorAll('.delete-email-item-btn').forEach(btn => {
        if (btn.dataset.emailId !== email.id) {
            btn.classList.remove('delete-nudge-active');
        }
    });
    
    displayEmailContent(email, handleReplyClick, handleMultipleChoiceReply, handleInstallClick);
    
    // Update active state
    document.querySelectorAll('.email-item').forEach(el => el.classList.remove('active'));
    emailItem.classList.add('active');
    
    // Start pulsation timer for read-only emails
    if (email.emailType === 'readOnly' && !email.read) {
        const deleteButton = emailItem.querySelector('.delete-email-item-btn');
        if (deleteButton) {
            setTimeout(() => {
                deleteButton.classList.add('delete-nudge-active');
            }, CONFIG.TIMING.DELETE_NUDGE_DELAY);
        }
    }
    
    // Pulsate install button for IT email
    if (email.id === 'it-support-email' && !email.replied) {
        const installBtn = document.getElementById('install-tool-btn');
        if (installBtn) {
            installBtn.classList.add('install-btn-pulsate');
        }
    }
    
    // Mark as read
    if (!email.read) {
        gameState.updateEmail(email.id, { read: true });
        emailItem.classList.remove('unread');
    }
}

/**
 * Handle reply button click
 */
function handleReplyClick() {
    const currentEmailSubject = emailBodyContentDiv.querySelector('h3').textContent;
    const currentEmailSender = emailBodyContentDiv.querySelector('p:nth-of-type(1)').textContent.replace('From: ', '');
    
    const originalEmail = gameState.emails.find(email => email.subject === currentEmailSubject && email.sender === currentEmailSender);
    
    if (!originalEmail || originalEmail.replied) {
        showCustomPrompt('You have already replied to this email or it\'s not a valid email to reply to.', 'alert');
        return;
    }
    
    replySystem.handleInteractiveReply(originalEmail, () => {
        loadEmailsForFolder(gameState.currentFolder);
        refreshUnreadCounts(gameState.emails);
    });
}

/**
 * Handle multiple choice reply
 */
function handleMultipleChoiceReply(originalEmail, selectedOption) {
    replySystem.handleMultipleChoiceReply(originalEmail, selectedOption);
    loadEmailsForFolder(gameState.currentFolder);
    refreshUnreadCounts(gameState.emails);
}

/**
 * Handle install button click
 */
function handleInstallClick(e) {
    e.preventDefault();
    
    const microscopeWrapper = document.getElementById('microscope-wrapper');
    if (microscopeWrapper && microscopeWrapper.classList.contains('visible')) {
        showCustomPrompt('Digital Microscope Tool is already installed.', 'alert');
        return;
    }
    
    const installBtn = e.target;
    installBtn.textContent = 'Installing...';
    installBtn.disabled = true;
    installBtn.classList.remove('install-btn-pulsate');
    
    // Find the IT email to move to trash
    const itEmail = gameState.emails.find(email => email.id === 'it-support-email');
    if (itEmail) {
        gameState.updateEmail(itEmail.id, { replied: true });
    }
    
    installationSystem.handleInstallation(itEmail);
}

/**
 * Set active folder
 */
function setActiveFolder(folderId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => nav.classList.remove('active'));
    const activeNavItem = document.getElementById(`${folderId}-nav`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
}

/**
 * Apply cursor theme
 */
function applyCursorTheme(theme) {
    if (document.body.classList.contains('microscope-active')) {
        showCustomPrompt('Deactivate the Digital Microscope to change your cursor.', 'alert');
        return;
    }
    
    currentCursorTheme = theme;
    
    cursorOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.cursor === theme) {
            option.classList.add('active');
        }
    });
    
    if (theme === CONFIG.CURSOR_THEMES.DEFAULT) {
        body.classList.remove('custom-cursor-active');
        customCursor.style.display = 'none';
    } else {
        body.classList.add('custom-cursor-active');
        customCursor.style.display = 'block';
        customCursor.textContent = CONFIG.CURSOR_EMOJIS[theme];
    }
    
    setCursorTheme(theme);
}

/**
 * Handle mouse move
 */
function handleMouseMove(e) {
    if (customCursor.style.display === 'block') {
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top = e.clientY + 'px';
        handleMagnifierReveal(e);
    }
}

/**
 * Handle dark mode toggle
 */
function handleDarkModeToggle() {
    if (darkModeToggle.checked) {
        body.classList.add('dark-mode');
        setDarkMode(true);
    } else {
        body.classList.remove('dark-mode');
        setDarkMode(false);
    }
}

/**
 * Open compose modal
 */
function openComposeModal() {
    if (composeSystem.isStoryContacted()) {
        showCustomPrompt("You've already followed up on your lead.", 'alert');
        return;
    }
    
    // Remove pulsation
    if (composeBtn) {
        composeBtn.classList.remove('compose-nudge-active');
    }
    
    // Populate dropdown
    composeTo.innerHTML = '<option value="">Select a contact...</option>';
    composeSystem.getRandomNames().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        composeTo.appendChild(option);
    });
    
    composeSubject.value = '';
    composeBody.innerHTML = '';
    sendComposeBtn.disabled = true;
    composeModalOverlay.style.display = 'flex';
}

/**
 * Close compose modal
 */
function closeComposeModal() {
    composeModalOverlay.style.display = 'none';
}

/**
 * Handle compose to change
 */
function handleComposeToChange() {
    if (composeSystem.isStoryContacted()) return;
    
    if (composeTo.value.toLowerCase() === 'alex chen') {
        composeSubject.readOnly = true;
        composeSubject.value = 'A Quick Question';
        
        const userName = getUserName();
        const alexEmailBody = `Hi Alex,

I'm the special investigator looking into the recent security incident. I was hoping you could shed some light on the computer hiccups from last month.

Any information would be a great help.

Best,
Detective ${userName}`;
        
        // Setup interactive typing
        composeBody.innerHTML = '';
        const typePrompt = document.createElement('p');
        typePrompt.classList.add('flashing-text');
        typePrompt.style.cssText = 'position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); font-size: 0.9em;';
        typePrompt.textContent = 'Press any key to start typing...';
        composeBody.appendChild(typePrompt);
        
        const startTypingListener = (event) => {
            if (!event.metaKey && !event.ctrlKey) {
                typePrompt.remove();
                document.removeEventListener('keydown', startTypingListener);
                simulateTyping(composeBody, alexEmailBody, CONFIG.UI.TYPING_CHARS_PER_KEY, () => {
                    sendComposeBtn.disabled = false;
                });
            }
        };
        document.addEventListener('keydown', startTypingListener);
    } else {
        composeSubject.readOnly = false;
        composeSubject.value = '';
    }
}

/**
 * Handle send compose
 */
function handleSendCompose() {
    composeSystem.handleComposeSend(composeTo.value, composeSubject.value, composeBody.textContent);
    closeComposeModal();
    loadEmailsForFolder(gameState.currentFolder);
}

/**
 * Add magnifying glass icon
 */
function addMagnifyingGlassIcon() {
    if (!microscopeWrapper) return;
    
    microscopeWrapper.classList.add('visible');
    
    magnifyingGlassIcon.addEventListener('click', () => {
        microscopeWrapper.classList.toggle('active');
        body.classList.toggle('microscope-active');
        
        if (microscopeWrapper.classList.contains('active')) {
            microscopeStatus.textContent = 'ON';
            customCursor.textContent = '';
            body.classList.add('custom-cursor-active');
            customCursor.style.display = 'block';
        } else {
            microscopeStatus.textContent = 'OFF';
            applyCursorTheme(getCursorTheme());
        }
    });
}

/**
 * Callback when email is delivered
 */
function onEmailDelivered() {
    if (gameState.currentFolder === CONFIG.FOLDERS.INBOX) {
        loadEmailsForFolder(CONFIG.FOLDERS.INBOX);
    }
}

/**
 * Callback when reply is sent
 */
function onReplySent() {
    loadEmailsForFolder(gameState.currentFolder);
    refreshUnreadCounts(gameState.emails);
}

/**
 * Callback when email is sent
 */
function onEmailSent() {
    loadEmailsForFolder(CONFIG.FOLDERS.INBOX);
}

/**
 * Callback when installation is complete
 */
function onInstallationComplete() {
    addMagnifyingGlassIcon();
    loadEmailsForFolder(gameState.currentFolder);
    refreshUnreadCounts(gameState.emails);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the game
    initializeGame();
});
