// UI components and interactions for the Outcrook email detective game

import { CONFIG } from './config.js';
import { 
    getCurrentTimeString, 
    getRandomJumbleChar, 
    calculateDistance,
    wait 
} from './utils.js';

/**
 * Update current time display
 */
export function updateCurrentTime() {
    const currentTimeSpan = document.querySelector(CONFIG.SELECTORS.CURRENT_TIME_SPAN);
    if (currentTimeSpan) {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        currentTimeSpan.textContent = now.toLocaleTimeString('en-US', options);
    }
}

/**
 * Update notification badge for a folder
 * @param {string} folderId - Folder ID
 * @param {number} count - Unread count
 */
export function updateNotificationBadge(folderId, count) {
    const badgeElement = document.getElementById(`${folderId}-badge`);
    if (badgeElement) {
        if (count > 0) {
            badgeElement.textContent = `(${count})`;
            // Apply different class for trash notification
            if (folderId === 'trash') {
                badgeElement.classList.add('trash-notification-badge');
                badgeElement.classList.remove('notification-badge');
            } else {
                badgeElement.classList.add('notification-badge');
                badgeElement.classList.remove('trash-notification-badge');
            }
            badgeElement.style.display = 'inline';
        } else {
            badgeElement.style.display = 'none';
            badgeElement.classList.remove('notification-badge');
            badgeElement.classList.remove('trash-notification-badge');
        }
    }
}

/**
 * Refresh all unread counts based on email states
 * @param {Array} emails - Array of emails
 */
export function refreshUnreadCounts(emails) {
    const unreadCounts = {
        inbox: 0,
        sent: 0,
        drafts: 0,
        spam: 0,
        trash: 0
    };

    for (const email of emails) {
        if (email.folder in unreadCounts && !email.read) {
            unreadCounts[email.folder]++;
        }
    }

    for (const folder in unreadCounts) {
        updateNotificationBadge(folder, unreadCounts[folder]);
    }
}

/**
 * Render email item element
 * @param {Object} email - Email object
 * @param {string} currentFolder - Current folder
 * @param {Function} onDeleteClick - Callback for delete button click
 * @param {Function} onEmailClick - Callback for email item click
 * @returns {HTMLElement} Email item element
 */
export function renderEmailItem(email, currentFolder, onDeleteClick, onEmailClick) {
    const emailItem = document.createElement('div');
    emailItem.classList.add('email-item');
    if (!email.read) {
        emailItem.classList.add('unread');
    }
    emailItem.classList.add('slide-in');
    emailItem.dataset.emailId = email.id;
    
    emailItem.innerHTML = `
        <div class="email-info">
            <div class="email-sender">${email.sender}</div>
            <div class="email-subject">${email.subject}</div>
            <div class="email-date">${email.date} ${email.receivedTime}</div>
        </div>
        <button class="delete-email-item-btn" data-email-id="${email.id}">🗑️</button>
    `;

    const deleteButton = emailItem.querySelector('.delete-email-item-btn');
    // Hide delete button in the trash folder or for Jane's email
    if (currentFolder === 'trash' || email.id === 'welcome-email') {
        deleteButton.style.display = 'none';
    }

    // Add email item click event listener
    emailItem.addEventListener('click', () => {
        if (onEmailClick) {
            onEmailClick(email, emailItem);
        }
    });

    // Add delete button event listener
    deleteButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the email item click event from firing
        if (onDeleteClick) {
            onDeleteClick(email.id);
        }
    });

    return emailItem;
}

/**
 * Display email content in the content area
 * @param {Object} email - Email object
 * @param {Function} onReplyClick - Callback for reply button click
 * @param {Function} onMultipleChoiceReply - Callback for multiple choice reply
 * @param {Function} onInstallClick - Callback for install button click
 */
export function displayEmailContent(email, onReplyClick, onMultipleChoiceReply, onInstallClick) {
    const emailBodyContentDiv = document.querySelector(CONFIG.SELECTORS.EMAIL_BODY_CONTENT_DIV);
    if (!emailBodyContentDiv) return;

    emailBodyContentDiv.innerHTML = `
        <h3>${email.subject}</h3>
        <p>From: ${email.senderIP ? `<span class="sender-ip-clue" data-ip="${email.senderIP}">${email.sender}</span>` : email.sender}</p>
        <p>Date: ${email.date}</p>
        <hr>
        <div>${email.body}</div>
    `;
    
    // Jumble the clue text after setting the HTML
    jumbleClueText();
    
    const replyButton = document.querySelector(CONFIG.SELECTORS.REPLY_EMAIL_BTN);
    const magnifyingGlassIcon = document.querySelector(CONFIG.SELECTORS.MAGNIFYING_GLASS_ICON);

    // Reset nudge states
    if (replyButton) {
        replyButton.classList.remove('reply-nudge-active');
    }
    if (magnifyingGlassIcon) {
        magnifyingGlassIcon.classList.remove('pulse-magnify');
    }

    // Handle button visibility based on email type
    if (email.emailType === 'readOnly' || email.replied) {
        if (replyButton) replyButton.style.display = 'none';
    } else if (email.emailType === 'multipleChoice') {
        if (replyButton) replyButton.style.display = 'none';
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'reply-options-container';
        email.replyOptions.forEach(option => {
            const optionButton = document.createElement('button');
            optionButton.className = 'reply-option-btn';
            optionButton.textContent = option.text;
            optionButton.addEventListener('click', () => onMultipleChoiceReply(email, option));
            optionsContainer.appendChild(optionButton);
        });
        emailBodyContentDiv.appendChild(optionsContainer);
    } else {
        if (replyButton) {
            replyButton.style.display = 'inline-block';
            replyButton.onclick = onReplyClick;
        }
    }

    // Add nudge for important emails (Jane's welcome email)
    if (email.id === 'welcome-email' && !email.replied && replyButton) {
        replyButton.classList.add('reply-nudge-active');
    }

    // Nudge for magnifying glass on R&D email
    if (magnifyingGlassIcon && email.id === 'rd-email') {
        magnifyingGlassIcon.classList.add('pulse-magnify');
        
        // Start compose pulsation when R&D email is viewed (user can now use magnifier to reveal "Alex")
        setTimeout(() => {
            const composeBtn = document.querySelector('.compose-btn');
            if (composeBtn && !composeBtn.classList.contains('compose-nudge-active')) {
                composeBtn.classList.add('compose-nudge-active');
            }
        }, CONFIG.TIMING.COMPOSE_NUDGE_DELAY);
    }

    // Update user name placeholders
    updateUserNamePlaceholders();

    // Add click event listener to install link if it exists
    const installBtn = emailBodyContentDiv.querySelector('#install-tool-btn');
    if (installBtn && onInstallClick) {
        installBtn.addEventListener('click', onInstallClick);
    }
}

/**
 * Update user name placeholders in email content
 */
export function updateUserNamePlaceholders() {
    const userName = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_NAME) || 'User';
    
    const welcomeUserNameSpan = document.querySelector('#welcome-user-name');
    if (welcomeUserNameSpan) {
        welcomeUserNameSpan.textContent = userName;
    }

    const rdUserNameSpan = document.querySelector('#rd-user-name');
    if (rdUserNameSpan) {
        rdUserNameSpan.textContent = userName;
    }

    const ceoUserNameSpan = document.querySelector('#ceo-user-name');
    if (ceoUserNameSpan) {
        ceoUserNameSpan.textContent = userName;
    }
}

/**
 * Jumble clue text for magnifier reveal
 */
export function jumbleClueText() {
    document.querySelectorAll('.jumbled-clue').forEach(clueElement => {
        if (clueElement.hasChildNodes()) return; // Already jumbled

        const clue = clueElement.dataset.clue;
        const letters = clue.split('');

        clueElement.innerHTML = ''; // Clear it

        letters.forEach(originalChar => {
            const span = document.createElement('span');
            const randomChar = getRandomJumbleChar();
            span.textContent = randomChar;
            span.dataset.char = originalChar; // Store the original character
            span.dataset.jumble = randomChar; // Store the jumbled character
            span.style.setProperty('--rot', `${Math.random() * 40 - 20}deg`);
            span.style.setProperty('--x', `${Math.random() * 6 - 3}px`);
            span.style.setProperty('--y', `${Math.random() * 6 - 3}px`);
            clueElement.appendChild(span);
        });
    });
    
    // Prepare sender IP clues for magnifier reveal
    document.querySelectorAll('.sender-ip-clue').forEach(clueElement => {
        if (clueElement.hasChildNodes()) return; // Already prepared

        const ip = clueElement.dataset.ip;
        const originalText = clueElement.textContent; // "Dr. Aris Thorne, Head of R&D"
        const letters = originalText.split(''); // Split the original name into letters

        clueElement.innerHTML = ''; // Clear it

        letters.forEach((originalChar, index) => {
            const span = document.createElement('span');
            span.textContent = originalChar; // Show the original character
            span.dataset.char = index < ip.length ? ip[index] : originalChar; // Store IP char or original
            span.dataset.jumble = originalChar; // Store the original character
            span.style.setProperty('--rot', '0deg');
            span.style.setProperty('--x', '0px');
            span.style.setProperty('--y', '0px');
            clueElement.appendChild(span);
        });
    });
}

/**
 * Handle magnifier reveal effect
 * @param {MouseEvent} event - Mouse event
 */
export function handleMagnifierReveal(event) {
    if (!document.body.classList.contains('microscope-active')) return;

    const lensRadius = CONFIG.UI.LENS_RADIUS;
    
    // Handle jumbled clues
    document.querySelectorAll('.jumbled-clue span').forEach(span => {
        const rect = span.getBoundingClientRect();
        const spanX = rect.left + rect.width / 2;
        const spanY = rect.top + rect.height / 2;
        
        const distance = calculateDistance(spanX, spanY, event.clientX, event.clientY);

        if (distance < lensRadius) {
            span.textContent = span.dataset.char;
            span.classList.add('revealed');
        } else {
            span.textContent = span.dataset.jumble;
            span.classList.remove('revealed');
        }
    });
    
    // Handle sender IP reveals (letter by letter)
    document.querySelectorAll('.sender-ip-clue span').forEach(span => {
        const rect = span.getBoundingClientRect();
        const spanX = rect.left + rect.width / 2;
        const spanY = rect.top + rect.height / 2;
        
        const distance = calculateDistance(spanX, spanY, event.clientX, event.clientY);

        if (distance < lensRadius) {
            span.textContent = span.dataset.char;
            span.classList.add('revealed');
        } else {
            span.textContent = span.dataset.jumble;
            span.classList.remove('revealed');
        }
    });
}

/**
 * Simulate typing effect
 * @param {HTMLElement} targetElement - Element to type into
 * @param {string} fullText - Text to type
 * @param {number} charsPerKey - Characters per keystroke
 * @param {Function} onComplete - Callback when typing is complete
 */
export function simulateTyping(targetElement, fullText, charsPerKey = CONFIG.UI.TYPING_CHARS_PER_KEY, onComplete) {
    let charIndex = 0;
    let keydownListener;
    let typingCompleted = false;

    function typeChar() {
        if (charIndex < fullText.length) {
            targetElement.textContent += fullText.substring(charIndex, charIndex + charsPerKey);
            charIndex += charsPerKey;
            if (charIndex >= fullText.length) {
                typingCompleted = true;
                document.removeEventListener('keydown', keydownListener);
                if (onComplete) {
                    onComplete();
                }
            }
        }
    }

    // Listener for keystroke-driven typing
    keydownListener = function(event) {
        if (!typingCompleted && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            typeChar();
        }
    };

    document.addEventListener('keydown', keydownListener);
}

/**
 * Create interactive reply interface
 * @param {Object} originalEmail - Original email being replied to
 * @param {string} replyText - Reply text to type
 * @param {Function} onReplyComplete - Callback when reply is complete
 */
export function createInteractiveReplyInterface(originalEmail, replyText, onReplyComplete) {
    const emailBodyContentDiv = document.querySelector(CONFIG.SELECTORS.EMAIL_BODY_CONTENT_DIV);
    const replyEmailBtn = document.querySelector(CONFIG.SELECTORS.REPLY_EMAIL_BTN);
    
    if (!emailBodyContentDiv || !replyEmailBtn) return;

    // Create a new container for the reply interface elements
    const replyInterfaceContainer = document.createElement('div');
    replyInterfaceContainer.id = 'reply-interface-container';
    
    // Clear emailBodyContentDiv and prepare for reply interface
    emailBodyContentDiv.innerHTML = `
        <h3>Replying to: ${originalEmail.subject}</h3>
        <div id="reply-typing-area" style="border: 1px solid #ccc; padding: 10px; min-height: 100px; white-space: pre-wrap; position: relative; user-select: none;"></div>
    `;
    replyEmailBtn.style.display = 'none'; // Hide original reply button
    
    const emailContentDiv = document.querySelector('.email-content');
    emailContentDiv.appendChild(replyInterfaceContainer);

    const replyTypingArea = document.getElementById('reply-typing-area');
    let typingStarted = false;

    // Create and append the type prompt initially to replyTypingArea
    const typePrompt = document.createElement('p');
    typePrompt.id = 'type-prompt';
    typePrompt.classList.add('flashing-text');
    typePrompt.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);';
    typePrompt.textContent = 'Press any key to start typing...';
    replyTypingArea.appendChild(typePrompt);

    // Create send button and prompt, append to replyInterfaceContainer
    const sendPromptElement = document.createElement('p');
    sendPromptElement.id = 'send-prompt';
    sendPromptElement.textContent = 'Press Enter to send';
    sendPromptElement.style.display = 'none'; // Initially hidden
    replyInterfaceContainer.appendChild(sendPromptElement);
    
    const sendReplyBtn = document.createElement('button');
    sendReplyBtn.id = 'send-reply-btn';
    sendReplyBtn.textContent = 'Send';
    sendReplyBtn.style.display = 'none'; // Initially hidden
    replyInterfaceContainer.appendChild(sendReplyBtn);

    const sendReplyHandler = function() {
        sendReplyBtn.removeEventListener('click', sendReplyHandler);
        document.removeEventListener('keydown', enterSendHandler);
        
        replyInterfaceContainer.remove(); // Remove from DOM after use

        if (onReplyComplete) {
            onReplyComplete(replyText);
        }
    };

    const enterSendHandler = function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendReplyHandler();
        }
    };

    const startTypingListener = function(event) {
        if (!typingStarted && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            typePrompt.remove(); // Remove the prompt entirely
            typingStarted = true;
            document.removeEventListener('keydown', startTypingListener); // Remove this listener once typing starts
            
            simulateTyping(replyTypingArea, replyText, CONFIG.UI.TYPING_CHARS_PER_KEY, () => {
                sendPromptElement.style.display = 'block'; // Show prompt
                sendReplyBtn.style.display = 'block'; // Show the Send button

                sendReplyBtn.addEventListener('click', sendReplyHandler);
                document.addEventListener('keydown', enterSendHandler);
            });
        }
    };

    document.addEventListener('keydown', startTypingListener);
}

/**
 * Show custom prompt/notification
 * @param {string} message - Message to show
 * @param {string} type - Type of prompt ('alert' or 'prompt')
 * @param {string} defaultValue - Default value for prompt
 * @returns {Promise<string>} Promise that resolves with user input
 */
export function showCustomPrompt(message, type = 'alert', defaultValue = '') {
    return new Promise((resolve) => {
        const customPromptOverlay = document.querySelector(CONFIG.SELECTORS.CUSTOM_PROMPT_OVERLAY);
        const customPromptMessage = document.querySelector(CONFIG.SELECTORS.CUSTOM_PROMPT_MESSAGE);
        const customPromptInput = document.querySelector(CONFIG.SELECTORS.CUSTOM_PROMPT_INPUT);
        const customPromptOkBtn = document.querySelector(CONFIG.SELECTORS.CUSTOM_PROMPT_OK_BTN);
        const customPromptCancelBtn = document.querySelector(CONFIG.SELECTORS.CUSTOM_PROMPT_CANCEL_BTN);

        if (!customPromptOverlay || !customPromptMessage || !customPromptInput || !customPromptOkBtn) {
            console.error('Custom prompt elements not found');
            resolve('');
            return;
        }

        customPromptMessage.textContent = message;
        customPromptInput.value = defaultValue;
        customPromptOverlay.style.display = 'flex';

        let activeKeydownListener = null;

        const handleOk = (value) => {
            customPromptInput.classList.remove('input-error');
            customPromptOverlay.style.display = 'none';
            customPromptOkBtn.removeEventListener('click', okButtonListener);
            if (activeKeydownListener) {
                document.removeEventListener('keydown', activeKeydownListener);
            }
            resolve(value);
        };

        const promptKeydownListener = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (customPromptInput.value.trim().length > 0) {
                    handleOk(customPromptInput.value);
                } else {
                    customPromptInput.classList.add('input-error');
                }
            }
        };

        const okButtonListener = () => {
            if (type === 'prompt' && customPromptInput.value.trim().length === 0) {
                customPromptInput.classList.add('input-error');
            } else {
                handleOk(customPromptInput.value);
            }
        };
        
        const alertKeydownListener = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleOk(customPromptInput.value);
            }
        };

        if (type === 'prompt') {
            customPromptInput.style.display = 'block';
            customPromptInput.placeholder = 'Type Here';
            customPromptOkBtn.style.display = 'inline-block';
            if (customPromptCancelBtn) customPromptCancelBtn.style.display = 'none';
            customPromptInput.focus();
            
            customPromptOkBtn.addEventListener('click', okButtonListener);
            document.addEventListener('keydown', promptKeydownListener);
            activeKeydownListener = promptKeydownListener;
        } else { // 'alert'
            customPromptInput.style.display = 'none';
            customPromptOkBtn.style.display = 'inline-block';
            if (customPromptCancelBtn) customPromptCancelBtn.style.display = 'none';
            
            customPromptOkBtn.addEventListener('click', okButtonListener);
            document.addEventListener('keydown', alertKeydownListener);
            activeKeydownListener = alertKeydownListener;
        }
    });
}

/**
 * Simulate installation progress
 * @param {Function} onComplete - Callback when installation is complete
 */
export function simulateInstallation(onComplete) {
    const installOverlay = document.getElementById('install-overlay');
    const progressBar = document.getElementById('progress-bar');
    const installStatus = document.getElementById('install-status');
    
    if (!installOverlay || !progressBar || !installStatus) {
        console.error('Installation elements not found');
        if (onComplete) onComplete();
        return;
    }

    installOverlay.style.display = 'flex';

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * CONFIG.UI.PROGRESS_INCREMENT;
        if (progress > 100) {
            progress = 100;
        }
        progressBar.style.width = progress + '%';

        if (progress === 100) {
            clearInterval(interval);
            installStatus.textContent = 'Installation Complete!';
            setTimeout(() => {
                installOverlay.style.display = 'none';
                if (onComplete) onComplete();
            }, 1500);
        }
    }, CONFIG.UI.PROGRESS_INTERVAL);
}

/**
 * Handle mouse move for custom cursor and magnifier effect
 * @param {MouseEvent} e - Mouse event
 */
export function handleMouseMove(e) {
    // If the custom cursor element is visible for any reason, it should follow the mouse.
    if (customCursor && customCursor.style.display === 'block') {
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top = e.clientY + 'px';

        // Handle lens-based reveal effect
        if (document.body.classList.contains('microscope-active')) {
            const lensRadius = CONFIG.LENS_RADIUS;
            document.querySelectorAll('.jumbled-clue span').forEach(span => {
                const rect = span.getBoundingClientRect();
                const spanX = rect.left + rect.width / 2;
                const spanY = rect.top + rect.height / 2;
                
                const distance = Math.sqrt(Math.pow(spanX - e.clientX, 2) + Math.pow(spanY - e.clientY, 2));

                if (distance < lensRadius) {
                    span.textContent = span.dataset.char;
                    span.classList.add('revealed');
                } else {
                    span.textContent = span.dataset.jumble;
                    span.classList.remove('revealed');
                }
            });
        }
    }
}
