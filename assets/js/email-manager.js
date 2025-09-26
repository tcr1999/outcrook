// Email management functions for the Outcrook email detective game

import { CONFIG } from './config.js';
import { 
    getCurrentDateString, 
    getCurrentTimeString, 
    getCurrentTimestamp, 
    generateEmailId, 
    getSenderFirstName, 
    getUserName, 
    getRandomSpamResponse,
    deepCopy 
} from './utils.js';

// Email templates will be loaded from JSON
let emailTemplates = {};

/**
 * Load email templates from JSON file
 * @returns {Promise<Object>} Email templates object
 */
export async function loadEmailTemplates() {
    try {
        const response = await fetch('./assets/data/email-templates.json');
        emailTemplates = await response.json();
        return emailTemplates;
    } catch (error) {
        console.error('Failed to load email templates:', error);
        return {};
    }
}

/**
 * Get email template by name
 * @param {string} templateName - Name of the template
 * @returns {Object} Email template
 */
export function getEmailTemplate(templateName) {
    return emailTemplates[templateName] || {};
}

/**
 * Create a new email from template
 * @param {string} templateName - Name of the template
 * @returns {Object} New email object
 */
export function createEmailFromTemplate(templateName) {
    const template = getEmailTemplate(templateName);
    if (!template) {
        console.error(`Template ${templateName} not found`);
        return null;
    }

    const email = deepCopy(template);
    const now = new Date();
    
    // Set dynamic properties
    email.date = getCurrentDateString();
    email.receivedTime = getCurrentTimeString();
    email.timestamp = getCurrentTimestamp();
    
    return email;
}

/**
 * Create a reply email
 * @param {Object} originalEmail - Original email being replied to
 * @param {string} replyText - Reply text
 * @returns {Object} Reply email object
 */
export function createReplyEmail(originalEmail, replyText) {
    const userName = getUserName();
    const senderFirstName = getSenderFirstName(originalEmail.sender);
    
    return {
        id: generateEmailId(`reply-${originalEmail.id}`),
        sender: `${userName}, Special Investigator`,
        subject: `Re: ${originalEmail.subject}`,
        date: getCurrentDateString(),
        body: `<pre>${replyText}</pre>`,
        folder: CONFIG.FOLDERS.SENT,
        read: true,
        receivedTime: getCurrentTimeString(),
        timestamp: getCurrentTimestamp()
    };
}

/**
 * Generate reply body for different email types
 * @param {Object} originalEmail - Original email
 * @param {string} userName - User name
 * @returns {string} Reply body text
 */
export function generateReplyBody(originalEmail, userName) {
    const senderFirstName = getSenderFirstName(originalEmail.sender);
    let replyBodyContent = '';

    if (originalEmail.id === 'welcome-email') {
        replyBodyContent = `Wow, thanks for the super-secret welcome, ${senderFirstName}! I'm SO ready to put on my detective hat and dive into this mystery. Consider this case... ON!`;
    } else if (originalEmail.id === 'ev-followup-email') {
        replyBodyContent = `Here's my status update: I've been investigating the data leak case and have made contact with several key personnel. Here's what I've found so far:

• Spoke with Alex Chen from R&D - seems cooperative but I'm still gathering information
• Contacted IT support regarding system access and security protocols
• Reviewed personnel files and identified some concerning patterns
• The case is progressing, but I need more time to piece together the full picture

I'll keep you updated as I uncover more details.`;
    } else if (originalEmail.folder === 'spam') {
        replyBodyContent = getRandomSpamResponse();
    } else {
        replyBodyContent = 'Got it! On the case!';
    }

    return `Hi ${senderFirstName},

${replyBodyContent}
Best, ${userName}, Special Investigator`;
}

/**
 * Create multiple choice reply
 * @param {Object} originalEmail - Original email
 * @param {Object} selectedOption - Selected reply option
 * @returns {Object} Reply email object
 */
export function createMultipleChoiceReply(originalEmail, selectedOption) {
    const userName = getUserName();
    const senderFirstName = getSenderFirstName(originalEmail.sender);

    const replyText = `Hi ${senderFirstName},

${selectedOption.text}

Best, ${userName}, Special Investigator`;

    return createReplyEmail(originalEmail, replyText);
}

/**
 * Create composed email
 * @param {string} to - Recipient
 * @param {string} subject - Subject
 * @param {string} body - Body text
 * @returns {Object} Composed email object
 */
export function createComposedEmail(to, subject, body) {
    const userName = getUserName();
    
    return {
        id: generateEmailId('composed'),
        sender: `${userName}, Special Investigator`,
        subject: subject,
        date: getCurrentDateString(),
        body: `<pre>${body}</pre>`,
        folder: CONFIG.FOLDERS.SENT,
        read: true,
        receivedTime: getCurrentTimeString(),
        timestamp: getCurrentTimestamp()
    };
}

/**
 * Create Alex reply email
 * @returns {Object} Alex reply email object
 */
export function createAlexReplyEmail() {
    const template = getEmailTemplate('alexReplyTemplate');
    if (!template) {
        console.error('Alex reply template not found');
        return null;
    }

    const email = deepCopy(template);
    email.date = getCurrentDateString();
    email.receivedTime = getCurrentTimeString();
    email.timestamp = getCurrentTimestamp();
    
    return email;
}

/**
 * Create EV follow-up email
 * @returns {Object} EV follow-up email object
 */
export function createEVFollowupEmail() {
    const template = getEmailTemplate('evFollowupEmailTemplate');
    if (!template) {
        console.error('EV follow-up template not found');
        return null;
    }

    const email = deepCopy(template);
    email.date = getCurrentDateString();
    email.receivedTime = getCurrentTimeString();
    email.timestamp = getCurrentTimestamp();
    
    return email;
}

/**
 * Create HR email
 * @returns {Object} HR email object
 */
export function createHREmail() {
    const template = getEmailTemplate('hrEmailTemplate');
    if (!template) {
        console.error('HR email template not found');
        return null;
    }

    const email = deepCopy(template);
    email.date = getCurrentDateString();
    email.receivedTime = getCurrentTimeString();
    email.timestamp = getCurrentTimestamp();
    
    return email;
}

/**
 * Create CEO email
 * @returns {Object} CEO email object
 */
export function createCEOEmail() {
    const template = getEmailTemplate('ceoEmailTemplate');
    if (!template) {
        console.error('CEO email template not found');
        return null;
    }

    const email = deepCopy(template);
    email.date = getCurrentDateString();
    email.receivedTime = getCurrentTimeString();
    email.timestamp = getCurrentTimestamp();
    
    return email;
}

/**
 * Create spam email from template
 * @param {string} templateName - Template name
 * @returns {Object} Spam email object
 */
export function createSpamEmail(templateName) {
    const template = getEmailTemplate(templateName);
    if (!template) {
        console.error(`Spam template ${templateName} not found`);
        return null;
    }

    const email = deepCopy(template);
    // Keep the original template ID (e.g., "spam-email-1") instead of generating a new one
    // email.id = generateEmailId('spam-cascade'); // This was causing the issue
    email.date = getCurrentDateString();
    email.receivedTime = getCurrentTimeString();
    email.timestamp = getCurrentTimestamp();
    
    return email;
}

/**
 * Get all spam email templates
 * @returns {Array} Array of spam email template names
 */
export function getSpamEmailTemplates() {
    return [
        'spamEmail2Template',
        'spamEmail3Template', 
        'spamEmail4Template',
        'spamEmail5Template'
    ];
}

/**
 * Get story emails queue
 * @returns {Array} Array of story email template names
 */
export function getStoryEmailsQueue() {
    return emailTemplates.storyEmailsQueue || [];
}

/**
 * Get random names for compose
 * @returns {Array} Array of random names
 */
export function getRandomNames() {
    return emailTemplates.randomNames || [];
}

/**
 * Generate IT email body based on consequence
 * @param {string} consequence - Consequence type
 * @returns {string} IT email body HTML
 */
export function generateITEmailBody(consequence) {
    if (consequence === 'reportJunk') {
        return `
            <h3>Great catch, Detective!</h3>
            <p>Thanks for reporting that junk email. Vigilance like yours is key to our security. We've analyzed the threat and taken action.</p>
            <p>To help with your investigation, we've approved the installation of a new "Digital Microscope Tool" for your terminal. This will grant you elevated privileges to uncover hidden data within our systems.</p>
            <p>Please click the button below to begin the installation. It should only take a moment.</p>
            <button id="install-tool-btn" class="install-btn-pulsate">Install Digital Microscope Tool</button>
            <p>Stay sharp,</p>
            <p>IT Support</p>
        `;
    } else { // 'scam' consequence
        return `
            <h3>Action Required: Security Training Mandated</h3>
            <p>Detective,</p>
            <p>We noticed you responded to a recent phishing attempt. While your prompt reporting is appreciated, interacting with such emails is extremely risky and against company policy.</p>
            <p>To prevent future incidents, we are mandating a security refresher course. We have also installed a "Digital Microscope Tool" on your terminal to help you better identify hidden threats in the future. Please use it wisely.</p>
            <p>The installation will begin automatically.</p>
            <p>Be more careful,</p>
            <p>IT Support</p>
        `;
    }
}

/**
 * Create IT support email
 * @param {string} consequence - Consequence type
 * @returns {Object} IT support email object
 */
export function createITSupportEmail(consequence) {
    const template = getEmailTemplate('itSupportEmailTemplate');
    if (!template) {
        console.error('IT support email template not found');
        return null;
    }

    const email = deepCopy(template);
    email.date = getCurrentDateString();
    email.receivedTime = getCurrentTimeString();
    email.timestamp = getCurrentTimestamp();
    email.body = generateITEmailBody(consequence);
    
    return email;
}

/**
 * Create IT reset email
 * @returns {Object} IT reset email object
 */
export function createITResetEmail() {
    const template = emailTemplates.itResetEmailTemplate;
    if (!template) {
        console.error('IT reset email template not found');
        return null;
    }

    const email = deepCopy(template);
    email.date = getCurrentDateString();
    email.receivedTime = getCurrentTimeString();
    email.timestamp = getCurrentTimestamp();
    
    return email;
}
