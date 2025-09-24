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
    createITResetEmail,
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
        this.interactedContacts = new Set(); // Track which contacts the user has interacted with
        this.gameProgress = {
            hasReceivedWelcome: false,
            hasReceivedMarketing: false,
            hasReceivedRD: false,
            hasReceivedIT: false,
            hasReceivedSpam: false,
            hasReceivedAlex: false,
            hasReceivedHR: false,
            hasReceivedCEO: false
        };
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
     * Remove email completely from game state
     * @param {string} emailId - Email ID to remove
     */
    removeEmail(emailId) {
        const emailIndex = this.emails.findIndex(email => email.id === emailId);
        if (emailIndex > -1) {
            this.emails.splice(emailIndex, 1);
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

    /**
     * Track that a contact has been interacted with
     * @param {string} contactName - Name of the contact
     */
    addInteractedContact(contactName) {
        this.interactedContacts.add(contactName.toLowerCase());
    }

    /**
     * Get relevant contacts based on game progress
     * @returns {Array} Array of relevant contact objects
     */
    getRelevantContacts() {
        const relevantContacts = [];
        
        // Always include Alex Chen if the user has received the R&D email
        if (this.gameProgress.hasReceivedRD) {
            relevantContacts.push({
                name: 'Alex Chen',
                role: 'Junior Researcher',
                description: 'Mentioned in R&D email as potential lead',
                priority: 'high'
            });
        }
        
        // Add other contacts based on game progress
        if (this.gameProgress.hasReceivedWelcome) {
            relevantContacts.push({
                name: 'Jane Smith',
                role: 'HR Manager',
                description: 'Sent welcome email',
                priority: 'medium'
            });
        }
        
        if (this.gameProgress.hasReceivedMarketing) {
            relevantContacts.push({
                name: 'Sarah Johnson',
                role: 'Marketing Director',
                description: 'Sent marketing email',
                priority: 'medium'
            });
        }
        
        if (this.gameProgress.hasReceivedIT) {
            relevantContacts.push({
                name: 'IT Support',
                role: 'Technical Support',
                description: 'Sent IT support email',
                priority: 'low'
            });
        }
        
        if (this.gameProgress.hasReceivedHR) {
            relevantContacts.push({
                name: 'HR Department',
                role: 'Human Resources',
                description: 'Sent HR notification',
                priority: 'medium'
            });
        }
        
        if (this.gameProgress.hasReceivedCEO) {
            relevantContacts.push({
                name: 'CEO Office',
                role: 'Executive Team',
                description: 'Sent executive communication',
                priority: 'high'
            });
        }
        
        return relevantContacts;
    }
}

/**
 * Email delivery system
 */
export class EmailDeliverySystem {
    constructor(gameState, onEmailDelivered, onGameReset) {
        this.gameState = gameState;
        this.onEmailDelivered = onEmailDelivered;
        this.onGameReset = onGameReset;
    }

    /**
     * Deliver welcome email
     */
    async deliverWelcomeEmail() {
        const welcomeEmail = createEmailFromTemplate('welcomeEmailTemplate');
        if (welcomeEmail) {
            this.gameState.addEmail(welcomeEmail);
            this.gameState.gameProgress.hasReceivedWelcome = true;
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
                
                // Track progress based on email type
                if (templateName === 'marketingEmailTemplate') {
                    this.gameState.gameProgress.hasReceivedMarketing = true;
                }
                
                if (this.onEmailDelivered) {
                    this.onEmailDelivered();
                }
            }
        }
    }

    /**
     * Start spam cascade - only one spam at a time, limited to 3 spam emails
     * @param {string} lastSpamId - ID of the spam email that triggered the cascade
     */
    startSpamCascade(lastSpamId = null) {
        // Stop any existing spam cascade
        if (this.gameState.spamCascadeInterval) {
            clearInterval(this.gameState.spamCascadeInterval);
            this.gameState.spamCascadeInterval = null;
        }

        // Determine which spam to deliver next
        let nextSpamNumber = 1; // Default to spam1
        if (lastSpamId) {
            if (lastSpamId === 'marketing-email') {
                // Marketing email triggers spam1 (Emissary's message)
                nextSpamNumber = 1;
            } else {
                // Extract spam number from ID (e.g., "spam-email-1" -> 1)
                const spamMatch = lastSpamId.match(/spam-email-(\d+)/);
                if (spamMatch) {
                    nextSpamNumber = parseInt(spamMatch[1]) + 1; // Next spam in sequence
                }
            }
        }

        // Only deliver if we haven't exceeded spam limit (3 spam emails max)
        if (nextSpamNumber <= 3) {
            this.deliverSingleSpam(nextSpamNumber);
        }
    }

    /**
     * Deliver a single spam email
     * @param {number} spamNumber - The spam number to deliver (1, 2, or 3)
     */
    deliverSingleSpam(spamNumber) {
        const templateName = `spamEmail${spamNumber}Template`;
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
            this.gameState.gameProgress.hasReceivedIT = true;
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
        }
    }

    /**
     * Deliver IT reset email (game over - reset to beginning)
     */
    async deliverITResetEmail() {
        const itResetEmail = createITResetEmail();
        if (itResetEmail) {
            this.gameState.addEmail(itResetEmail);
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
            
            // Reset the game after a delay
            setTimeout(() => {
                this.resetGame();
            }, 5000); // 5 second delay to let user read the reset email
        }
    }

    /**
     * Deliver R&D email
     */
    async deliverRDEmail() {
        const rdEmail = createEmailFromTemplate('rdEmailTemplate');
        if (rdEmail) {
            this.gameState.addEmail(rdEmail);
            this.gameState.gameProgress.hasReceivedRD = true;
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
            this.gameState.gameProgress.hasReceivedHR = true;
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
            this.gameState.gameProgress.hasReceivedCEO = true;
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
        }
    }

    /**
     * Reset the game to the beginning
     */
    resetGame() {
        // Clear all emails
        this.gameState.emails = [];
        
        // Reset game state
        this.gameState.currentFolder = CONFIG.FOLDERS.INBOX;
        this.gameState.nextStoryEmailIndex = 0;
        this.gameState.spamDeliveryTimer = null;
        this.gameState.itEmailSent = false;
        this.gameState.spamCascadeInterval = null;
        this.gameState.availableSpamTemplates = [];
        this.gameState.storyContacted = false;
        this.gameState.interactedContacts = new Set();
        this.gameState.gameProgress = {
            hasReceivedWelcome: false,
            hasReceivedMarketing: false,
            hasReceivedRD: false,
            hasReceivedIT: false,
            hasReceivedSpam: false,
            hasReceivedAlex: false,
            hasReceivedHR: false,
            hasReceivedCEO: false
        };
        
        // Deliver welcome email to start over
        setTimeout(() => {
            this.deliverWelcomeEmail();
        }, 1000);
        
        // Notify the UI that the game has been reset
        if (this.onGameReset) {
            this.onGameReset();
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
        console.log('handleMultipleChoiceReply called with email ID:', originalEmail.id, 'option:', selectedOption.text);
        const replyEmail = createMultipleChoiceReply(originalEmail, selectedOption);
        if (replyEmail) {
            this.gameState.addEmail(replyEmail);
            
            // Move all emails to trash when replied to
            this.gameState.updateEmail(originalEmail.id, { replied: true, folder: CONFIG.FOLDERS.TRASH });

            showCustomPrompt('Reply sent!', 'alert');
            
            if (this.onReplySent) {
                this.onReplySent();
            }

            // Handle consequences based on email type
            console.log('Calling handleReplyConsequences for email:', originalEmail.id);
            this.handleReplyConsequences(originalEmail, selectedOption);
        }
    }

    /**
     * Handle reply consequences
     * @param {Object} originalEmail - Original email
     * @param {Object} selectedOption - Selected option
     */
    handleReplyConsequences(originalEmail, selectedOption) {
        console.log('handleReplyConsequences called for email ID:', originalEmail.id);
        if (originalEmail.id.startsWith('spam-')) {
            console.log('Detected spam email - calling handleSpamReplyConsequences');
            this.handleSpamReplyConsequences(originalEmail, selectedOption);
        } else if (originalEmail.id === 'marketing-email') {
            console.log('Detected marketing email - calling handleMarketingReplyConsequences');
            this.handleMarketingReplyConsequences();
        } else {
            console.log('Detected other email - calling handleDefaultReplyConsequences');
            this.handleDefaultReplyConsequences();
        }
    }

    /**
     * Handle spam reply consequences
     * @param {Object} originalEmail - Original email
     * @param {Object} selectedOption - Selected option
     */
    handleSpamReplyConsequences(originalEmail, selectedOption) {
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
            // Check if this is spam3 (the last spam)
            const spamMatch = originalEmail.id.match(/spam-email-(\d+)/);
            if (spamMatch && parseInt(spamMatch[1]) === 3) {
                // User fell for spam3 - trigger IT reset email
                setTimeout(() => {
                    this.emailDeliverySystem.deliverITResetEmail();
                }, 2000);
            } else {
                // User fell for spam1 or spam2 - deliver next spam
                setTimeout(() => {
                    this.emailDeliverySystem.startSpamCascade(originalEmail.id);
                }, 2000);
            }
        }
    }

    /**
     * Handle marketing reply consequences
     */
    handleMarketingReplyConsequences() {
        // Marketing reply triggers spam cascade
        // Start spam cascade after delay (this should deliver spam1 - the Emissary's message)
        setTimeout(() => {
            // Start spam cascade
            this.emailDeliverySystem.startSpamCascade('marketing-email'); // Pass marketing email ID to start with spam1
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
     * Get relevant contacts for compose dropdown
     * @returns {Array} Array of relevant contact objects
     */
    getRelevantContacts() {
        return this.gameState.getRelevantContacts();
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
            // Move the IT email to trash immediately
            if (emailToTrash) {
                this.gameState.updateEmail(emailToTrash.id, { folder: CONFIG.FOLDERS.TRASH });
            }
            
            if (this.onInstallationComplete) {
                this.onInstallationComplete();
            }
            
            // Deliver R&D email after installation
            setTimeout(() => {
                this.emailDeliverySystem.deliverRDEmail();
            }, CONFIG.TIMING.RD_EMAIL_DELAY);
        });
    }
}
