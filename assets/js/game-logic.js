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
    createEVFollowupEmail,
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
    simulateInstallation,
    showSlideableNotification
} from './ui-components.js';
import { soundSystem } from './sound-system.js';

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
        this.coins = 0; // Track player's coins
        this.csoOption2SpamTriggered = false; // Track if spam has been triggered for CSO option 2
        this.csoFollowupTime = null; // Track when CSO follow-up email was sent
        this.gameProgress = {
            hasReceivedWelcome: false,
            hasReceivedCSO: false,
            hasReceivedRD: false,
            hasReceivedIT: false,
            hasReceivedSpam: false,
            hasReceivedAlex: false,
            hasReceivedHR: false,
            hasReceivedCEO: false,
            hasInstalledMicroscope: false,
            hasReceivedEV: false,
            itLogInvestigationAvailable: false,
            hasUnjumbledAlexClue: false
        };
    }

    /**
     * Add email to the game state
     * @param {Object} email - Email to add
     */
    addEmail(email) {
        this.emails.push(email);
        refreshUnreadCounts(this.emails);
        
        // Play email notification sound
        soundSystem.playEmailNotification();
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
        
        // Include Alex Chen only if the user has received the R&D email AND unjumbled the clue
        if (this.gameProgress.hasReceivedRD && this.gameProgress.hasUnjumbledAlexClue) {
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
        
        if (this.gameProgress.hasReceivedCSO && !this.gameProgress.hasInstalledMicroscope) {
            relevantContacts.push({
                name: 'IT Support',
                role: 'Technical Support',
                description: 'Mentioned by CSO for clearance requests',
                priority: 'medium'
            });
        }
        
        // Add IT Support for log investigation after Alex's response
        if (this.gameProgress.itLogInvestigationAvailable) {
            relevantContacts.push({
                name: 'IT Support',
                role: 'Technical Support',
                description: 'Investigate strange system logs and access patterns',
                priority: 'high'
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

    /**
     * Add coins to the player's total
     * @param {number} amount - Amount of coins to add
     * @param {Function} onCoinsUpdated - Callback when coins are updated
     */
    addCoins(amount, onCoinsUpdated) {
        this.coins += amount;
        if (onCoinsUpdated) {
            onCoinsUpdated(this.coins);
        }
    }

    /**
     * Get current coin count
     * @returns {number} Current coin count
     */
    getCoins() {
        return this.coins;
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
                if (templateName === 'csoEmailTemplate') {
                    this.gameState.gameProgress.hasReceivedCSO = true;
                }
                
                if (this.onEmailDelivered) {
                    this.onEmailDelivered();
                }
            }
        }
    }

    /**
     * Start spam cascade - only one spam at a time, limited to 4 spam emails
     * @param {string} lastSpamId - ID of the spam email that triggered the cascade
     */
    startSpamCascade(lastSpamId = null) {
        console.log('startSpamCascade called with lastSpamId:', lastSpamId);
        
        // Stop any existing spam cascade
        if (this.gameState.spamCascadeInterval) {
            clearInterval(this.gameState.spamCascadeInterval);
            this.gameState.spamCascadeInterval = null;
        }

        // Determine which spam to deliver next
        let nextSpamNumber = 1; // Default to spam1
        if (lastSpamId) {
            if (lastSpamId === 'cso-email') {
                // CSO email triggers spam1 (Emissary's message)
                nextSpamNumber = 1;
                console.log('CSO email detected - delivering spam1');
            } else {
                // Extract spam number from ID (e.g., "spam-email-1" -> 1)
                const spamMatch = lastSpamId.match(/spam-email-(\d+)/);
                if (spamMatch) {
                    const currentSpamNumber = parseInt(spamMatch[1]);
                    nextSpamNumber = currentSpamNumber + 1; // Next spam in sequence
                    console.log('Spam email detected - current:', currentSpamNumber, 'next:', nextSpamNumber);
                } else {
                    console.log('No spam match found for ID:', lastSpamId);
                }
            }
        }

        console.log('Final nextSpamNumber:', nextSpamNumber);

        // Only deliver if we haven't exceeded spam limit (4 spam emails max)
        if (nextSpamNumber <= 4) {
            console.log('Delivering spam number:', nextSpamNumber);
            this.deliverSingleSpam(nextSpamNumber);
        } else {
            console.log('Spam limit reached (4), not delivering more spam');
        }
    }

    /**
     * Deliver a single spam email
     * @param {number} spamNumber - The spam number to deliver (1, 2, 3, or 4)
     */
    deliverSingleSpam(spamNumber) {
        const templateName = `spamEmail${spamNumber}Template`;
        console.log('deliverSingleSpam called with spamNumber:', spamNumber, 'templateName:', templateName);
        const newSpamEmail = createSpamEmail(templateName);
        if (newSpamEmail) {
            console.log('Created spam email:', newSpamEmail.id, newSpamEmail.subject);
            this.gameState.addEmail(newSpamEmail);
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
        } else {
            console.log('Failed to create spam email for template:', templateName);
        }
    }

    /**
     * Deliver CSO follow-up email
     */
    async deliverCSOFollowupEmail() {
        const csoFollowupEmail = createEmailFromTemplate('csoFollowupEmailTemplate');
        if (csoFollowupEmail) {
            this.gameState.addEmail(csoFollowupEmail);
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
        }
    }

    /**
     * Deliver IT clearance email
     */
    async deliverITClearanceEmail() {
        const itClearanceEmail = createEmailFromTemplate('itClearanceEmailTemplate');
        if (itClearanceEmail) {
            this.gameState.addEmail(itClearanceEmail);
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
            
            // Show countdown before reset
            this.startResetCountdown();
        }
    }

    /**
     * Start countdown before game reset
     */
    startResetCountdown() {
        let countdown = 15;
        
        // Update countdown every second
        const countdownInterval = setInterval(() => {
            countdown--;
            
            // Update the countdown timer in the email body
            const countdownTimer = document.getElementById('countdown-timer');
            if (countdownTimer) {
                countdownTimer.textContent = countdown;
            }
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                this.resetGame();
            }
        }, 1000);
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
            this.gameState.gameProgress.itLogInvestigationAvailable = true; // Enable IT contact for log investigation
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
            
            // Trigger EV follow-up email after 8 seconds
            setTimeout(() => {
                this.deliverEVFollowupEmail();
            }, CONFIG.TIMING.HR_EMAIL_DELAY);
        }
    }

    /**
     * Deliver EV follow-up email
     */
    async deliverEVFollowupEmail() {
        const evFollowupEmail = createEVFollowupEmail();
        if (evFollowupEmail) {
            this.gameState.addEmail(evFollowupEmail);
            if (this.onEmailDelivered) {
                this.onEmailDelivered();
            }
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
            
            // CEO email is now triggered by EV follow-up response, not HR email
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
     * Deliver IT log investigation email
     */
    async deliverITLogInvestigationEmail() {
        const itLogEmail = createEmailFromTemplate('itLogInvestigationTemplate');
        if (itLogEmail) {
            this.gameState.addEmail(itLogEmail);
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
        this.gameState.coins = 0; // Reset coins
        this.gameState.csoOption2SpamTriggered = false; // Reset CSO option 2 spam tracking
        this.gameState.csoFollowupTime = null; // Reset CSO follow-up time
        this.gameState.gameProgress = {
            hasReceivedWelcome: false,
            hasReceivedCSO: false,
            hasReceivedRD: false,
            hasReceivedIT: false,
            hasReceivedSpam: false,
            hasReceivedAlex: false,
            hasReceivedHR: false,
            hasReceivedCEO: false,
            hasInstalledMicroscope: false,
            hasReceivedEV: false,
            itLogInvestigationAvailable: false,
            hasUnjumbledAlexClue: false
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
            
            // Move emails to appropriate folder based on reply type
            if (selectedOption.consequence === 'reportJunk') {
                // Move spam emails to spam folder when reported as junk
                this.gameState.updateEmail(originalEmail.id, { replied: true, folder: CONFIG.FOLDERS.SPAM });
            } else {
                // Move all other emails to trash when replied to
                this.gameState.updateEmail(originalEmail.id, { replied: true, folder: CONFIG.FOLDERS.TRASH });
            }

            // Show slideable notification for reply sent
            showSlideableNotification('Reply sent successfully!', 'success', 0, 'Message Sent');
            
            // Play reply sent sound
            soundSystem.playReplySent();
            
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
        } else if (originalEmail.id === 'cso-email') {
            console.log('Detected CSO email - calling handleCSOReplyConsequences');
            this.handleCSOReplyConsequences(selectedOption);
        } else {
            console.log('Detected other email - calling handleDefaultReplyConsequences');
            this.handleDefaultReplyConsequences(originalEmail);
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
            // Award coins for reporting junk
            this.gameState.addCoins(100, (newCoinTotal) => {
                // Trigger coin animation in UI
                if (window.updateCoinDisplay) {
                    window.updateCoinDisplay(newCoinTotal, 100);
                }
            });
            
            // Deliver IT email after delay
            setTimeout(() => {
                this.emailDeliverySystem.deliverITSupportEmail('reportJunk');
            }, CONFIG.TIMING.IT_EMAIL_DELAY);
        } else if (selectedOption.consequence === 'scam') {
            // Check if this is spam4 (the last spam)
            const spamMatch = originalEmail.id.match(/spam-email-(\d+)/);
            console.log('User fell for spam - email ID:', originalEmail.id, 'spam match:', spamMatch);
            if (spamMatch && parseInt(spamMatch[1]) === 4) {
                // User fell for spam4 - trigger IT reset email
                console.log('User fell for spam4 - triggering IT reset email');
                setTimeout(() => {
                    this.emailDeliverySystem.deliverITResetEmail();
                }, 2000);
            } else {
                // User fell for spam1, spam2, or spam3 - deliver next spam
                console.log('User fell for spam1, spam2, or spam3 - triggering next spam cascade');
                setTimeout(() => {
                    this.emailDeliverySystem.startSpamCascade(originalEmail.id);
                }, 2000);
            }
        }
    }

    /**
     * Handle CSO reply consequences
     * @param {Object} selectedOption - The selected reply option
     */
    handleCSOReplyConsequences(selectedOption) {
        if (selectedOption.consequence === 'acknowledge') {
            // Option 1: "That's clear. Thanks for the heads up" - 6 second delay
            setTimeout(() => {
                this.emailDeliverySystem.startSpamCascade('cso-email');
            }, 6000);
        } else if (selectedOption.consequence === 'concern') {
            // Option 2: "That sounds like it will hinder..." - special handling
            // Send CSO follow-up email first
            setTimeout(() => {
                this.emailDeliverySystem.deliverCSOFollowupEmail();
                
                // Set up spam delay - either when user contacts IT or 15s after follow-up
                this.gameState.csoOption2SpamTriggered = false;
                this.gameState.csoFollowupTime = Date.now();
                
                // Set timeout for 15 seconds after follow-up email
                setTimeout(() => {
                    if (!this.gameState.csoOption2SpamTriggered) {
                        this.emailDeliverySystem.startSpamCascade('cso-email');
                        this.gameState.csoOption2SpamTriggered = true;
                    }
                }, 15000);
                
            }, 10000); // 10 seconds delay for follow-up email
        } else {
            // Option 3: "I understand the protocol..." - use default delay
            setTimeout(() => {
                this.emailDeliverySystem.startSpamCascade('cso-email');
            }, CONFIG.TIMING.SPAM_CASCADE_DELAY);
        }
    }

    /**
     * Handle EV follow-up reply consequences
     * @param {Object} selectedOption - The selected reply option
     */
    handleEVFollowupReplyConsequences(selectedOption) {
        // All EV responses trigger the same sequence: CEO email after 10s, then HR email after another 10s
        setTimeout(() => {
            this.emailDeliverySystem.deliverCEOEmail();
        }, 10000); // 10 seconds after EV response
        
        setTimeout(() => {
            this.emailDeliverySystem.deliverHREmail();
        }, 20000); // 20 seconds after EV response (10s after CEO email)
        
        if (selectedOption.consequence === 'bureaucracy') {
            console.log('EV follow-up: User reported bureaucratic roadblocks');
        } else if (selectedOption.consequence === 'security') {
            console.log('EV follow-up: User reported security issues');
        } else if (selectedOption.consequence === 'smooth') {
            console.log('EV follow-up: User reported smooth progress');
        } else if (selectedOption.consequence === 'authority') {
            console.log('EV follow-up: User requested more authority');
        }
    }

    /**
     * Handle default reply consequences
     */
    handleDefaultReplyConsequences(originalEmail) {
        // Special handling for EV follow-up email
        if (originalEmail && originalEmail.id === 'ev-followup-email') {
            // All EV responses trigger the same sequence: CEO email after 10s, then HR email after another 10s
            setTimeout(() => {
                this.emailDeliverySystem.deliverCEOEmail();
            }, 10000); // 10 seconds after EV response
            
            setTimeout(() => {
                this.emailDeliverySystem.deliverHREmail();
            }, 20000); // 20 seconds after EV response (10s after CEO email)
        } else {
            // Deliver next story email after delay for other emails
            setTimeout(() => {
                this.emailDeliverySystem.deliverNextStoryEmail();
            }, CONFIG.TIMING.NEXT_STORY_EMAIL_DELAY);
        }
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

            // Show slideable notification for reply sent
            showSlideableNotification('Reply sent successfully!', 'success', 0, 'Message Sent');
            
            if (this.onReplySent) {
                this.onReplySent();
            }

            // Handle specific reply consequences
            if (originalEmail.id === 'welcome-email') {
                setTimeout(() => {
                    this.emailDeliverySystem.deliverNextStoryEmail();
                }, CONFIG.TIMING.NEXT_STORY_EMAIL_DELAY);
            } else if (originalEmail.id === 'ev-followup-email') {
                // EV follow-up email consequences: CEO email after 10s, then enable IT contact for log investigation
                setTimeout(() => {
                    this.emailDeliverySystem.deliverCEOEmail();
                }, 10000); // 10 seconds after EV response
                
                // Enable IT contact for log investigation instead of delivering HR email
                this.gameState.gameProgress.hasReceivedEV = true;
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
                
                // Award coins for emailing Alex for the first time
                this.gameState.addCoins(100, (newCoinTotal) => {
                    // Trigger coin animation in UI
                    if (window.updateCoinDisplay) {
                        window.updateCoinDisplay(newCoinTotal, 100);
                    }
                });
                
                if (this.onEmailSent) {
                    this.onEmailSent();
                }
                
                // Trigger Alex's reply after delay
                setTimeout(() => {
                    this.emailDeliverySystem.deliverAlexReply();
                }, CONFIG.TIMING.ALEX_REPLY_DELAY);
            }
        } else if (to.toLowerCase() === 'it support' && subject) {
            const composedEmail = createComposedEmail(to, subject, body);
            if (composedEmail) {
                this.gameState.addEmail(composedEmail);
                
                // Check if this is for log investigation (after EV response) or clearance (after CSO response)
                if (this.gameState.gameProgress.hasReceivedEV) {
                    // This is for log investigation - deliver IT log investigation email
                    setTimeout(() => {
                        this.emailDeliverySystem.deliverITLogInvestigationEmail();
                    }, 5000); // 5 second delay for IT response
                } else {
                    // This is for clearance - check if this is CSO option 2 scenario
                    if (this.gameState.csoOption2SpamTriggered === false) {
                        // Add 10 second delay when user contacts IT support
                        setTimeout(() => {
                            this.emailDeliverySystem.startSpamCascade('cso-email');
                        }, 10000);
                        this.gameState.csoOption2SpamTriggered = true;
                    }
                    
                    // Deliver IT clearance response after delay
                    setTimeout(() => {
                        this.emailDeliverySystem.deliverITClearanceEmail();
                    }, 5000); // 5 second delay for IT response
                }
                
                if (this.onEmailSent) {
                    this.onEmailSent();
                }
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
            // Mark microscope as installed
            this.gameState.gameProgress.hasInstalledMicroscope = true;
            
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
