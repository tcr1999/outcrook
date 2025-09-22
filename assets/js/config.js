// Configuration and constants for the Outcrook email detective game

export const CONFIG = {
    // Game timing constants
    TIMING: {
        WELCOME_EMAIL_DELAY: 3000,
        NEXT_STORY_EMAIL_DELAY: 3000,
        SPAM_CASCADE_DELAY: 6000,
        SPAM_INTERVAL: 15000,
        IT_EMAIL_DELAY: 5000,
        RD_EMAIL_DELAY: 3000,
        ALEX_REPLY_DELAY: 4000,
        HR_EMAIL_DELAY: 8000,
        CEO_EMAIL_DELAY: 5000,
        DELETE_NUDGE_DELAY: 5000,
        COMPOSE_NUDGE_DELAY: 2000
    },

    // UI constants
    UI: {
        TYPING_CHARS_PER_KEY: 15,
        LENS_RADIUS: 45,
        PROGRESS_INTERVAL: 200,
        PROGRESS_INCREMENT: 10
    },

    // Email types
    EMAIL_TYPES: {
        INTERACTIVE_REPLY: 'interactiveReply',
        MULTIPLE_CHOICE: 'multipleChoice',
        READ_ONLY: 'readOnly'
    },

    // Folders
    FOLDERS: {
        INBOX: 'inbox',
        SENT: 'sent',
        DRAFTS: 'drafts',
        SPAM: 'spam',
        TRASH: 'trash'
    },

    // Cursor themes
    CURSOR_THEMES: {
        DEFAULT: 'default',
        MAGNIFYING_GLASS: 'magnifying-glass'
    },

    // Cursor emojis
    CURSOR_EMOJIS: {
        'default': '🖱️',
        'magnifying-glass': '🔍'
    },

    // Jumble characters for clue obfuscation
    JUMBLE_CHARS: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=',

    // Spam responses
    SPAM_RESPONSES: [
        "My pet squirrel, Nutsy, handles all my banking. He says \"Nuts to you!\"",
        "Sorry, I'm currently on a mission to find the world's largest rubber duck. Priorities, you know!",
        "My fortune is tied up in a cheese-of-the-month club. Top secret stuff, can't discuss!",
        "Your email caused my teacup pig to faint from excitement. Please send a less enthusiastic email next time."
    ],

    // Local storage keys
    STORAGE_KEYS: {
        USER_NAME: 'outcrookUserName',
        DARK_MODE: 'darkMode',
        CURSOR_THEME: 'cursorTheme'
    },

    // DOM selectors
    SELECTORS: {
        CONTAINER: '.container',
        INTRO_SCREEN: '#intro-screen',
        NAME_INPUT: '#name-input',
        START_GAME_BTN: '#start-game-btn',
        USER_PROFILE: '#user-profile',
        EMAIL_LIST_DIV: '.email-list',
        EMAIL_LIST_FOLDER_HEADER: '#email-list-folder-header',
        REPLY_EMAIL_BTN: '#reply-email-btn',
        EMAIL_BODY_CONTENT_DIV: '#email-body-content',
        CURRENT_TIME_SPAN: '#current-time',
        CUSTOM_PROMPT_OVERLAY: '#custom-prompt-overlay',
        CUSTOM_PROMPT_MESSAGE: '#custom-prompt-message',
        CUSTOM_PROMPT_INPUT: '#custom-prompt-input',
        CUSTOM_PROMPT_OK_BTN: '#custom-prompt-ok',
        CUSTOM_PROMPT_CANCEL_BTN: '#custom-prompt-cancel',
        SETTINGS_BTN: '#settings-btn',
        SETTINGS_MENU: '#settings-menu',
        CLOSE_SETTINGS_BTN: '#close-settings-btn',
        DARK_MODE_TOGGLE: '#dark-mode-toggle',
        CUSTOM_CURSOR: '#custom-cursor',
        MAGNIFYING_GLASS_ICON: '#magnifying-glass-icon',
        MICROSCOPE_WRAPPER: '#microscope-wrapper',
        MICROSCOPE_STATUS: '#microscope-status',
        COMPOSE_MODAL_OVERLAY: '#compose-modal-overlay',
        COMPOSE_BTN: '.compose-btn',
        CLOSE_COMPOSE_BTN: '#close-compose-btn',
        SEND_COMPOSE_BTN: '#send-compose-btn',
        COMPOSE_TO: '#compose-to',
        COMPOSE_SUBJECT: '#compose-subject',
        COMPOSE_BODY: '#compose-body-text'
    }
};

// Default game state
export const DEFAULT_GAME_STATE = {
    emails: [],
    currentFolder: 'inbox',
    nextStoryEmailIndex: 0,
    spamDeliveryTimer: null,
    itEmailSent: false,
    spamCascadeInterval: null,
    availableSpamTemplates: [],
    storyContacted: false
};

// Default unread counts
export const DEFAULT_UNREAD_COUNTS = {
    inbox: 0,
    sent: 0,
    drafts: 0,
    spam: 0,
    trash: 0
};
