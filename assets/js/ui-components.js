// UI components and interactions for the Outcrook email detective game

import { CONFIG } from './config.js';
import { 
    getCurrentTimeString, 
    getRandomJumbleChar, 
    calculateDistance,
    wait,
    applyCursorTheme
} from './utils.js';
import { soundSystem } from './sound-system.js';

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
 * Update coin display with animation
 * @param {number} newTotal - New total coin count
 * @param {number} addedAmount - Amount of coins added
 */
export function updateCoinDisplay(newTotal, addedAmount) {
    const coinDisplay = document.querySelector('.coin-display-inline');
    if (!coinDisplay) return;

    const coinCount = coinDisplay.querySelector('.coin-count');
    const coinIcon = coinDisplay.querySelector('.coin-icon');
    
    if (!coinCount || !coinIcon) return;

    // Play coin sound
    soundSystem.playCoinSound();
    
    // Animate the coin icon
    coinIcon.classList.add('coin-earned');
    
    // Animate the count change
    const currentCount = parseInt(coinCount.textContent) || 0;
    const targetCount = newTotal;
    
    // Create a smooth counting animation
    animateCount(coinCount, currentCount, targetCount, 1000);
    
    // Remove the animation class after animation completes
    setTimeout(() => {
        coinIcon.classList.remove('coin-earned');
    }, 1000);
}

/**
 * Animate counting from current to target number
 * @param {HTMLElement} element - Element to animate
 * @param {number} start - Starting number
 * @param {number} end - Ending number
 * @param {number} duration - Animation duration in ms
 */
function animateCount(element, start, end, duration) {
    const startTime = performance.now();
    const difference = end - start;
    
    function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.round(start + (difference * easeOutQuart));
        
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateCount);
        }
    }
    
    requestAnimationFrame(updateCount);
}

/**
 * Create character thumbnail element
 * @param {string} senderName - Name of the sender
 * @returns {HTMLElement} Thumbnail element
 */
export function createCharacterThumbnail(senderName) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'character-thumbnail';
    
    // Get initials from sender name
    const initials = getInitials(senderName);
    thumbnail.textContent = initials;
    
    // Add data attribute for potential future image loading
    thumbnail.dataset.senderName = senderName;
    
    return thumbnail;
}

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
export function getInitials(name) {
    if (!name) return '?';
    
    // Handle special cases for known characters
    const nameMap = {
        'Jane Smith': 'JS',
        'Marcus Webb, Chief Security Officer': 'MW', 
        'Dr. Aris Thorne': 'AT',
        'Alex Chen': 'AC',
        'Patricia Wells': 'PW',
        'Dick Thompson': 'DT',
        'Richard "Dick" Thompson': 'DT',
        'IT Support': 'IT',
        'HR Department': 'HR',
        'CEO Office': 'CE'
    };
    
    if (nameMap[name]) {
        return nameMap[name];
    }
    
    // Extract initials from name
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    
    return '?';
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
    
    // Get initials for thumbnail
    const initials = getInitials(email.sender);
    
    emailItem.innerHTML = `
        <div class="email-info">
            <div class="email-sender-with-thumbnail">
                <div class="character-thumbnail">${initials}</div>
                <div class="email-sender">${email.sender}</div>
            </div>
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
export function displayEmailContent(email, onReplyClick, onMultipleChoiceReply, onInstallClick, gameState = null) {
    const emailBodyContentDiv = document.querySelector(CONFIG.SELECTORS.EMAIL_BODY_CONTENT_DIV);
    if (!emailBodyContentDiv) return;

    // Create sender line with thumbnail
    const senderLine = document.createElement('div');
    senderLine.className = 'email-sender-with-thumbnail';
    
    const thumbnail = createCharacterThumbnail(email.sender);
    senderLine.appendChild(thumbnail);
    
    const senderText = document.createElement('span');
    // Create consistent spacing for alignment - pad sender name to fixed width
    const maxNameLength = 35; // Maximum expected name length
    const paddedSender = email.sender.padEnd(maxNameLength, ' ');
    
    senderText.innerHTML = `From: ${email.senderIP ? `<span class="sender-ip-clue" data-ip="${email.senderIP}">${paddedSender}</span>` : paddedSender}`;
    senderLine.appendChild(senderText);

    // Create consistent spacing for subject line IP display
    const maxSubjectLength = 50; // Maximum expected subject length
    const paddedSubject = email.subject.padEnd(maxSubjectLength, ' ');
    
    emailBodyContentDiv.innerHTML = `
        <h3 class="subject-line" data-ip="${email.subjectIP || ''}" data-original-subject="${email.subject}">${paddedSubject}</h3>
        <p>Date: ${email.date}</p>
        <hr>
        <div>${processEmailBodyForMagnifier(email.body)}</div>
    `;
    
    // Insert sender line after subject
    const subjectLine = emailBodyContentDiv.querySelector('.subject-line');
    subjectLine.insertAdjacentElement('afterend', senderLine);
    
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
        
        // Remove any existing reply options containers first
        const existingOptionsContainer = emailBodyContentDiv.querySelector('.reply-options-container');
        if (existingOptionsContainer) {
            existingOptionsContainer.remove();
        }
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'reply-options-container';
        email.replyOptions.forEach(option => {
            const optionButton = document.createElement('button');
            optionButton.className = 'reply-option-btn';
            optionButton.textContent = option.text;
            optionButton.addEventListener('click', () => {
                // Play clicky multiple choice sound
                soundSystem.playMultipleChoiceClick();
                onMultipleChoiceReply(email, option);
            });
            optionsContainer.appendChild(optionButton);
        });
        emailBodyContentDiv.appendChild(optionsContainer);
    } else {
        if (replyButton) {
            replyButton.style.display = 'inline-block';
            replyButton.onclick = onReplyClick;
        }
    }

    // Add nudge for important emails (Jane's welcome email) with delay
    if (email.id === 'welcome-email' && !email.replied && replyButton) {
        setTimeout(() => {
            replyButton.classList.add('reply-nudge-active');
        }, CONFIG.TIMING.REPLY_NUDGE_DELAY);
    }

    // Nudge for magnifying glass on R&D email
    if (magnifyingGlassIcon && email.id === 'rd-email') {
        magnifyingGlassIcon.classList.add('pulse-magnify');
        
        // Start compose pulsation when R&D email is viewed (user can now use magnifier to reveal "Alex")
        // But only if Alex hasn't been contacted yet
        setTimeout(() => {
            const composeBtn = document.querySelector('.compose-btn');
            if (composeBtn && !composeBtn.classList.contains('compose-nudge-active')) {
                // Check if Alex has been contacted using the storyContacted flag
                if (!gameState || !gameState.storyContacted) {
                    composeBtn.classList.add('compose-nudge-active');
                }
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

    const evFollowupUserNameSpan = document.querySelector('#ev-followup-user-name');
    if (evFollowupUserNameSpan) {
        evFollowupUserNameSpan.textContent = userName;
    }

    const alexReplyUserNameSpan = document.querySelector('#alex-reply-user-name');
    if (alexReplyUserNameSpan) {
        alexReplyUserNameSpan.textContent = userName;
    }

    const itLogUserNameSpan = document.querySelector('#it-log-user-name');
    if (itLogUserNameSpan) {
        itLogUserNameSpan.textContent = userName;
    }

    const csoUserNameSpan = document.querySelector('#cso-user-name');
    if (csoUserNameSpan) {
        csoUserNameSpan.textContent = userName;
    }

    const csoFollowupUserNameSpan = document.querySelector('#cso-followup-user-name');
    if (csoFollowupUserNameSpan) {
        csoFollowupUserNameSpan.textContent = userName;
    }

    const itClearanceUserNameSpan = document.querySelector('#it-clearance-user-name');
    if (itClearanceUserNameSpan) {
        itClearanceUserNameSpan.textContent = userName;
    }

    const itSupportUserNameSpan = document.querySelector('#it-support-user-name');
    if (itSupportUserNameSpan) {
        itSupportUserNameSpan.textContent = userName;
    }

    const hrUserNameSpan = document.querySelector('#hr-user-name');
    if (hrUserNameSpan) {
        hrUserNameSpan.textContent = userName;
    }
}

/**
 * Show slideable notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (0 = persistent)
 * @param {string} title - Optional title
 */
export function showSlideableNotification(message, type = 'info', duration = 0, title = '') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    notification.id = notificationId;

    notification.innerHTML = `
        <div class="notification-content">
            ${title ? `<div class="notification-title">${title}</div>` : ''}
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="removeNotification('${notificationId}')">&times;</button>
    `;

    container.appendChild(notification);

    // Trigger slide-in animation
    setTimeout(() => {
        notification.classList.add('slide-in');
    }, 10);

    // No auto-remove - notifications stay until manually closed
}

/**
 * Remove notification
 * @param {string} notificationId - ID of notification to remove
 */
export function removeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (!notification) return;

    notification.classList.add('slide-out');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 400);
}

// Make removeNotification globally available
window.removeNotification = removeNotification;

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
        if (clueElement.querySelector('span')) return; // Already prepared (has span children)

        const ip = clueElement.dataset.ip;
        const originalText = clueElement.textContent; // "Dr. Aris Thorne, Head of R&D"
        const letters = originalText.split(''); // Split the original name into letters


        clueElement.innerHTML = ''; // Clear it

        // Create a mapping of non-space characters to IP characters
        let ipCharIndex = 0;
        
        letters.forEach((originalChar, index) => {
            const span = document.createElement('span');
            span.textContent = originalChar; // Show the original character
            
            // Only make non-space characters revealable, and only if we have IP characters left
            if (originalChar !== ' ' && ipCharIndex < ip.length) {
                span.dataset.char = ip[ipCharIndex]; // Store IP char for revealable characters
                span.dataset.jumble = originalChar; // Store the original character
                span.style.setProperty('--rot', '0deg');
                span.style.setProperty('--x', '0px');
                span.style.setProperty('--y', '0px');
                span.style.setProperty('display', 'inline-block'); // Make revealable characters inline-block
                ipCharIndex++; // Move to next IP character
            } else {
                // For spaces and characters beyond IP length, don't make them revealable
                span.dataset.char = originalChar; // Keep original character
                span.dataset.jumble = originalChar; // Keep original character
                span.style.setProperty('display', 'inline'); // Keep spaces as normal inline elements
                // No transform styles for non-revealable characters
            }
            
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
    
    // Check if Alex clue has been fully revealed
    checkAlexClueRevealed();
    
    // Handle sender IP reveals (letter by letter)
    document.querySelectorAll('.sender-ip-clue span').forEach(span => {
        const rect = span.getBoundingClientRect();
        const spanX = rect.left + rect.width / 2;
        const spanY = rect.top + rect.height / 2;
        
        const distance = calculateDistance(spanX, spanY, event.clientX, event.clientY);

        if (distance < lensRadius) {
            span.textContent = span.dataset.char;
            // Only add 'revealed' class if this character has IP data (not a space or non-IP char)
            if (span.dataset.char !== span.dataset.jumble) {
                span.classList.add('revealed');
            }
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
            
            // Handle jumbled clues (Alex reveal)
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
            
            // Handle sender IP clues (letter by letter reveal)
            document.querySelectorAll('.sender-ip-clue span').forEach(span => {
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
            
            // Handle subject line IP reveals
            document.querySelectorAll('.subject-line').forEach(subjectLine => {
                const rect = subjectLine.getBoundingClientRect();
                const spanX = rect.left + rect.width / 2;
                const spanY = rect.top + rect.height / 2;
                
                const distance = Math.sqrt(Math.pow(spanX - e.clientX, 2) + Math.pow(spanY - e.clientY, 2));

                if (distance < lensRadius && subjectLine.dataset.ip) {
                    const maxSubjectLength = 50;
                    const paddedSubject = subjectLine.dataset.originalSubject.padEnd(maxSubjectLength, ' ');
                    subjectLine.textContent = `${paddedSubject} [${subjectLine.dataset.ip}]`;
                    subjectLine.classList.add('revealed');
                } else if (subjectLine.dataset.ip) {
                    // Restore original subject if it has an IP
                    const maxSubjectLength = 50;
                    const paddedSubject = subjectLine.dataset.originalSubject.padEnd(maxSubjectLength, ' ');
                    subjectLine.textContent = `${paddedSubject}`;
                    subjectLine.classList.remove('revealed');
                }
            });
            
            // Handle name IP reveals in email body
            document.querySelectorAll('.name-ip-clue').forEach(nameSpan => {
                const rect = nameSpan.getBoundingClientRect();
                const spanX = rect.left + rect.width / 2;
                const spanY = rect.top + rect.height / 2;
                
                const distance = Math.sqrt(Math.pow(spanX - e.clientX, 2) + Math.pow(spanY - e.clientY, 2));

                if (distance < lensRadius && nameSpan.dataset.ip) {
                    nameSpan.textContent = `IP: ${nameSpan.dataset.ip}`;
                    nameSpan.classList.add('revealed');
                } else if (nameSpan.dataset.ip) {
                    // Restore original name if it has an IP
                    nameSpan.textContent = nameSpan.dataset.originalName;
                    nameSpan.classList.remove('revealed');
                }
            });
        }
    }
}

/**
 * Process email body to add magnifier classes to names
 * @param {string} body - Email body HTML
 * @returns {string} Processed HTML with magnifier classes
 */
function processEmailBodyForMagnifier(body) {
    // Define names and their corresponding IP addresses
    const nameIPMap = {
        'Jane': '192.168.1.042',
        'Marcus Webb, Chief Security Officer': '192.168.1.089', 
        'Dr. Aris Thorne': '192.168.1.105',
        'Alex Chen': '192.168.1.156', // Normal work IP
        'Patricia Wells': '192.168.1.203',
        'Dick Thompson': '192.168.1.001',
        'Richard "Dick" Thompson': '192.168.1.001'
    };
    
    let processedBody = body;
    
    // Replace each name with a magnifier-enabled span
    Object.entries(nameIPMap).forEach(([name, ip]) => {
        const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        processedBody = processedBody.replace(regex, `<span class="name-ip-clue" data-ip="${ip}" data-original-name="${name}">${name}</span>`);
    });
    
    // Special case: In forwarded emails, Alex Chen should show her suspicious IP (192.168.1.203)
    // This creates the IP discrepancy that the detective can discover
    if (processedBody.includes('Forwarded Email:')) {
        console.log('Found forwarded email section');
        // Replace Alex Chen in the forwarded section with her suspicious IP
        const forwardedSection = processedBody.split('Forwarded Email:')[1];
        if (forwardedSection) {
            console.log('Forwarded section found:', forwardedSection.substring(0, 200));
            
            // First, make sure Alex Chen is properly tagged in the forwarded section
            let updatedForwardedSection = forwardedSection;
            
            // Replace any untagged "Alex Chen" in the forwarded section
            updatedForwardedSection = updatedForwardedSection.replace(
                /Alex Chen(?!<\/span>)/g,
                '<span class="name-ip-clue" data-ip="192.168.1.156" data-original-name="Alex Chen">Alex Chen</span>'
            );
            
            // Then replace the IP with the suspicious one
            updatedForwardedSection = updatedForwardedSection.replace(
                /<span class="name-ip-clue" data-ip="192\.168\.1\.156" data-original-name="Alex Chen">Alex Chen<\/span>/g,
                '<span class="name-ip-clue" data-ip="192.168.1.203" data-original-name="Alex Chen">Alex Chen</span>'
            );
            
            console.log('Updated forwarded section:', updatedForwardedSection.substring(0, 200));
            processedBody = processedBody.replace(forwardedSection, updatedForwardedSection);
        }
    }
    
    return processedBody;
}

/**
 * Add magnifying glass icon functionality
 */
export function addMagnifyingGlassIcon() {
    const microscopeWrapper = document.getElementById('microscope-wrapper');
    const magnifyingGlassIcon = document.getElementById('magnifying-glass-icon');
    const statusText = document.getElementById('microscope-status');
    const customCursor = document.getElementById('custom-cursor');
    
    if (!microscopeWrapper || !magnifyingGlassIcon || !statusText) return;
    
    // Make the whole element visible
    microscopeWrapper.classList.add('visible');
    
    // Add click listener to toggle the microscope state
    magnifyingGlassIcon.addEventListener('click', () => {
        const body = document.body;
        microscopeWrapper.classList.toggle('active');
        body.classList.toggle('microscope-active');

        if (microscopeWrapper.classList.contains('active')) {
            statusText.textContent = 'ON';
            // Force custom cursor on and clear any emoji
            if (customCursor) {
                customCursor.textContent = '';
                body.classList.add('custom-cursor-active');
                customCursor.style.display = 'block';
            }
        } else {
            statusText.textContent = 'OFF';
            // Revert to user's chosen cursor theme
            const savedCursorTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.CURSOR_THEME) || 'default';
            applyCursorTheme(savedCursorTheme);
        }
    });
}

/**
 * Check if Alex clue has been fully revealed
 */
function checkAlexClueRevealed() {
    // Check if all letters in the Alex clue have been revealed
    const alexClueSpans = document.querySelectorAll('.jumbled-clue[data-clue="Alex"] span');
    if (alexClueSpans.length === 0) return;
    
    let allRevealed = true;
    alexClueSpans.forEach(span => {
        if (!span.classList.contains('revealed')) {
            allRevealed = false;
        }
    });
    
    if (allRevealed && window.gameState && !window.gameState.gameProgress.hasUnjumbledAlexClue) {
        window.gameState.gameProgress.hasUnjumbledAlexClue = true;
        
        // Show notification that Alex clue has been revealed
        showSlideableNotification('Alex clue revealed! You can now contact Alex Chen.', 'success', 4000, 'Clue Discovered');
        
        // Start compose button pulsation after 20 seconds
        setTimeout(() => {
            const composeBtn = document.querySelector('.compose-btn');
            if (composeBtn) {
                composeBtn.classList.add('compose-nudge-active');
            }
        }, 20000);
    }
}
