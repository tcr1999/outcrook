// Core game logic for the Outcrook email detective game

import { CONFIG } from './config.js';
import { 
    wait, 
    removeRandomElement,
    getRandomElement 
} from './utils.js';
import { 
    createEmailFromTemplate, 
    createReplyEmail, 
    createMultipleChoiceReply,
    createComposedEmail,
    createAlexReplyEmail,
    createHREmail,
    createCEOEmail,
    createSpamEmail,
    createITSupportEmail,
    getSpamEmailTemplates,
    getStoryEmailsQueue,
    getRandomNames,
    generateReplyBody
} from './email-manager.js';
import { 
    refreshUnreadCounts, 
    showCustomPrompt, 
    simulateInstallation 
} from './ui-components.js';

/**
 * Game state management
 */
export class GameState {
    constructor() {
        this.emails = [];
        this.currentFolder = CONFIG.FOLDERS.INBOX;
        this.nextStoryEmailIndex = 0;
        this.spamDeliveryTimer = null;
        this.itEmailSent = false;
        this.spamCascadeInterval = null;
        this.availableSpamTemplates = [];
        this.storyContacted = false;
    }

    /**
     * Add email to the game state
     * @param {Object} email - Email to add
     */
    addEmail(email) {
        this.emails.push(email);
        refreshUnreadCounts(this.emails);
    }

    /**
     * Update email in the game state
     * @param {string} emailId - ID of email to update
     * @param {Object} updates - Updates to apply
     */
    updateEmail(emailId, updates) {
        const emailIndex = this.emails.findIndex(email => email.id === emailId);
        if (emailIndex > -1) {
            Object.assign(this.emails[emailIndex], updates);
            refreshUnreadCounts(this.emails);
        }
    }

    /**
     * Get emails for a specific folder
     * @param {string} folder - Folder name
     * @returns {Array} Array of emails in the folder
     */
    getEmailsForFolder(folder) {
        return this.emails.filter(email => email.folder === folder);
    }

    /**
     * Get email by ID
     * @param {string} emailId - Email ID
     * @returns {Object|null} Email object or null if not found
     */
    getEmailById(emailId) {
        return this.emails.find(email => email.id === emailId) || null;
    }
}

/**
 * Email delivery system
 */
export class EmailDeliverySystem {
    constructor(gameState, onEmailDelivered) {
        this.gameState = gameState;
        this.onEmailDelivered = onEmailDelivered;
    }

    /**
     * Deliver welcome email
     */
    async deliverWelcomeEmail() {
        const welcomeEmail = createEmailFromTemplate('welcomeEmailTemplate');
        if (welcomeEmail) {
            this.gameState.addEmail(welcomeEmail);
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
        }
    }

    /**
     * Deliver next story email
     */
    async deliverNextStoryEmail() {
        const storyQueue = getStoryEmailsQueue();
        if (this.gameState.nextStoryEmailIndex < storyQueue.length) {
            const templateName = storyQueue[this.gameState.nextStoryEmailIndex];
            const nextEmail = createEmailFromTemplate(templateName);
            if (nextEmail) {
                this.gameState.addEmail(nextEmail);
                this.gameState.nextStoryEmailIndex++;
                if (this.onEmailDelivered) {
                    this.onEmailDelivered();
                }
            }
        }
    }

    /**
     * Start spam cascade
     */
    startSpamCascade() {
        if (this.gameState.spamCascadeInterval) {
            clearInterval(this.gameState.spamCascadeInterval);
        }

        // Deliver the first spam email
        const firstSpam = createSpamEmail('spamEmail1Template');
        if (firstSpam) {
            this.gameState.addEmail(firstSpam);
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
        }

        // Initialize the pool for the rest of the spam
        this.gameState.availableSpamTemplates = [...getSpamEmailTemplates()];

        // Start the interval for subsequent random emails
        this.gameState.spamCascadeInterval = setInterval(() => {
            this.deliverRandomSpam();
        }, CONFIG.TIMING.SPAM_INTERVAL);
    }

    /**
     * Deliver random spam email
     */
    deliverRandomSpam() {
        if (this.gameState.availableSpamTemplates.length === 0) {
            if (this.gameState.spamCascadeInterval) {
                clearInterval(this.gameState.spamCascadeInterval);
                this.gameState.spamCascadeInterval = null;
            }
            return;
        }

        const templateName = removeRandomElement(this.gameState.availableSpamTemplates);
        const newSpamEmail = createSpamEmail(templateName);
        if (newSpamEmail) {
            this.gameState.addEmail(newSpamEmail);
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
        }
    }

    /**
     * Deliver IT support email
     * @param {string} consequence - Consequence type
     */
    async deliverITSupportEmail(consequence) {
        if (this.gameState.itEmailSent) return;

        const itEmail = createITSupportEmail(consequence);
        if (itEmail) {
            this.gameState.addEmail(itEmail);
            this.gameState.itEmailSent = true;
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
        }
    }

    /**
     * Deliver R&D email
     */
    async deliverRDEmail() {
        const rdEmail = createEmailFromTemplate('rdEmailTemplate');
        if (rdEmail) {
            this.gameState.addEmail(rdEmail);
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
        }
    }

    /**
     * Deliver Alex reply email
     */
    async deliverAlexReply() {
        const alexReply = createAlexReplyEmail();
        if (alexReply) {
            this.gameState.addEmail(alexReply);
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
            
            // Trigger HR email after 8 seconds
            setTimeout(() => {
                this.deliverHREmail();
            }, CONFIG.TIMING.HR_EMAIL_DELAY);
        }
    }

    /**
     * Deliver HR email
     */
    async deliverHREmail() {
        const hrEmail = createHREmail();
        if (hrEmail) {
            this.gameState.addEmail(hrEmail);
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
            
            // Trigger CEO email after 5 seconds
            setTimeout(() => {
                this.deliverCEOEmail();
            }, CONFIG.TIMING.CEO_EMAIL_DELAY);
        }
    }

    /**
     * Deliver CEO email
     */
    async deliverCEOEmail() {
        const ceoEmail = createCEOEmail();
        if (ceoEmail) {
            this.gameState.addEmail(ceoEmail);
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
        }
    }
}

/**
 * Reply system
 */
export class ReplySystem {
    constructor(gameState, emailDeliverySystem, onReplySent) {
        this.gameState = gameState;
        this.emailDeliverySystem = emailDeliverySystem;
        this.onReplySent = onReplySent;
    }

    /**
     * Handle multiple choice reply
     * @param {Object} originalEmail - Original email
     * @param {Object} selectedOption - Selected option
     */
    handleMultipleChoiceReply(originalEmail, selectedOption) {
        const replyEmail = createMultipleChoiceReply(originalEmail, selectedOption);
        if (replyEmail) {
            this.gameState.addEmail(replyEmail);
            this.gameState.updateEmail(originalEmail.id, { replied: true, folder: CONFIG.FOLDERS.TRASH });

            showCustomPrompt('Reply sent!', 'alert');
            
            if (this.onReplySent) {
                this.onReplySent();
            }

            // Handle consequences based on email type
            this.handleReplyConsequences(originalEmail, selectedOption);
        }
    }

    /**
     * Handle reply consequences
     * @param {Object} originalEmail - Original email
     * @param {Object} selectedOption - Selected option
     */
    handleReplyConsequences(originalEmail, selectedOption) {
        if (originalEmail.id.startsWith('spam-')) {
            this.handleSpamReplyConsequences(selectedOption);
        } else if (originalEmail.id === 'marketing-email') {
            this.handleMarketingReplyConsequences();
        } else {
            this.handleDefaultReplyConsequences();
        }
    }

    /**
     * Handle spam reply consequences
     * @param {Object} selectedOption - Selected option
     */
    handleSpamReplyConsequences(selectedOption) {
        // Stop spam cascade if active
        if (this.gameState.spamCascadeInterval) {
            clearInterval(this.gameState.spamCascadeInterval);
            this.gameState.spamCascadeInterval = null;
        }

        if (selectedOption.consequence === 'reportJunk') {
            // Deliver IT email after delay
            setTimeout(() => {
                this.emailDeliverySystem.deliverITSupportEmail('reportJunk');
            }, CONFIG.TIMING.IT_EMAIL_DELAY);
        } else if (selectedOption.consequence === 'scam') {
            // Start spam cascade
            this.emailDeliverySystem.startSpamCascade();
        }
    }

    /**
     * Handle marketing reply consequences
     */
    handleMarketingReplyConsequences() {
        // Start spam cascade after delay
        setTimeout(() => {
            this.emailDeliverySystem.startSpamCascade();
        }, CONFIG.TIMING.SPAM_CASCADE_DELAY);
    }

    /**
     * Handle default reply consequences
     */
    handleDefaultReplyConsequences() {
        // Deliver next story email after delay
        setTimeout(() => {
            this.emailDeliverySystem.deliverNextStoryEmail();
        }, CONFIG.TIMING.NEXT_STORY_EMAIL_DELAY);
    }

    /**
     * Handle interactive reply
     * @param {Object} originalEmail - Original email
     * @param {Function} onReplyComplete - Callback when reply is complete
     */
    handleInteractiveReply(originalEmail, onReplyComplete) {
        const userName = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_NAME) || 'User';
        const replyText = generateReplyBody(originalEmail, userName);
        const replyEmail = createReplyEmail(originalEmail, replyText);
        
        if (replyEmail) {
            this.gameState.addEmail(replyEmail);
            this.gameState.updateEmail(originalEmail.id, { replied: true, folder: CONFIG.FOLDERS.TRASH });

            showCustomPrompt('Reply sent!', 'alert');
            
            if (this.onReplySent) {
                this.onReplySent();
            }

            // Handle specific reply consequences
            if (originalEmail.id === 'welcome-email') {
                setTimeout(() => {
                    this.emailDeliverySystem.deliverNextStoryEmail();
                }, CONFIG.TIMING.NEXT_STORY_EMAIL_DELAY);
            }

            if (onReplyComplete) {
                onReplyComplete();
            }
        }
    }
}

/**
 * Compose system
 */
export class ComposeSystem {
    constructor(gameState, emailDeliverySystem, onEmailSent) {
        this.gameState = gameState;
        this.emailDeliverySystem = emailDeliverySystem;
        this.onEmailSent = onEmailSent;
    }

    /**
     * Handle compose email send
     * @param {string} to - Recipient
     * @param {string} subject - Subject
     * @param {string} body - Body text
     */
    handleComposeSend(to, subject, body) {
        if (to.toLowerCase() === 'alex chen' && subject) {
            const composedEmail = createComposedEmail(to, subject, body);
            if (composedEmail) {
                this.gameState.addEmail(composedEmail);
                this.gameState.storyContacted = true;
                
                if (this.onEmailSent) {
                    this.onEmailSent();
                }

                // Trigger Alex's reply after delay
                setTimeout(() => {
                    this.emailDeliverySystem.deliverAlexReply();
                }, CONFIG.TIMING.ALEX_REPLY_DELAY);
            }
        } else {
            showCustomPrompt("Your 'To' field seems incorrect or the subject is empty. Are you contacting the right person?", 'alert');
        }
    }

    /**
     * Get random names for compose dropdown
     * @returns {Array} Array of random names
     */
    getRandomNames() {
        return getRandomNames();
    }

    /**
     * Check if story has been contacted
     * @returns {boolean} True if story has been contacted
     */
    isStoryContacted() {
        return this.gameState.storyContacted;
    }
}

/**
 * Installation system
 */
export class InstallationSystem {
    constructor(gameState, emailDeliverySystem, onInstallationComplete) {
        this.gameState = gameState;
        this.emailDeliverySystem = emailDeliverySystem;
        this.onInstallationComplete = onInstallationComplete;
    }

    /**
     * Handle tool installation
     * @param {Object} emailToTrash - Email to move to trash after installation
     */
    handleInstallation(emailToTrash) {
        simulateInstallation(() => {
            if (this.onInstallationComplete) {
                this.onInstallationComplete();
            }
            
            // Move the IT email to trash
            if (emailToTrash) {
                this.gameState.updateEmail(emailToTrash.id, { folder: CONFIG.FOLDERS.TRASH });
            }
            
            // Deliver R&D email after installation
            setTimeout(() => {
                this.emailDeliverySystem.deliverRDEmail();
            }, CONFIG.TIMING.RD_EMAIL_DELAY);
        });
    }
}
