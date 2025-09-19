document.addEventListener('DOMContentLoaded', () => {
    const emailContentDiv = document.querySelector('.email-content');
    const userProfile = document.getElementById('user-profile');
    const emailListDiv = document.querySelector('.email-list');
    const emailListFolderHeader = document.getElementById('email-list-folder-header');
    const replyEmailBtn = document.getElementById('reply-email-btn');
    const emailBodyContentDiv = document.getElementById('email-body-content');
    const deleteEmailBtn = document.getElementById('delete-email-btn');
    const currentTimeSpan = document.getElementById('current-time');

    let emails = [];
    let currentFolder = 'inbox';

    // Declare sendReplyBtn and sendPromptElement at a higher scope
    let sendReplyBtn;
    let sendPromptElement;

    // Function to get user name
    function getUserName() {
        let userName = localStorage.getItem('outcrookUserName');
        if (!userName) {
            userName = prompt('Welcome to Outcrook! Please enter your name:');
            if (userName) {
                localStorage.setItem('outcrookUserName', userName);
            } else {
                userName = 'User'; // Default name if none is provided
            }
        }
        userProfile.textContent = userName;
    }

    getUserName(); // Call on page load

    // Function to display current time
    function updateCurrentTime() {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        currentTimeSpan.textContent = now.toLocaleTimeString('en-US', options);
    }

    updateCurrentTime(); // Initial call
    setInterval(updateCurrentTime, 1000); // Update every second

    // Initial welcome email
    const welcomeEmail = {
        id: 'welcome-email',
        sender: 'Jane, Director of People',
        subject: 'Welcome to Outcrook - Your Onboarding as a Detective',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Welcome to the Outcrook Team!</h3>
            <p>Dear Detective <span id="welcome-user-name"></span>,</p>
            <p>A warm welcome to Outcrook! We're thrilled to have you join our esteemed team. Your unique skills and perspective are highly valued as we embark on a new era of corporate integrity.</p>
            <p>Your role here will be pivotal in ensuring transparency and uncovering any… anomalies that may arise within our organizational structure. Consider this your first confidential assignment: familiarize yourself with our systems, observe, and report anything that seems out of place.</p>
            <p>Your journey to uncover the truth begins now. We trust you'll uphold our values with the utmost discretion and diligence.</p>
            <p>Best regards,</p>
            <p>Jane, Director of People</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false
    };
    emails.push(welcomeEmail);

    // Creative spam emails
    const spamEmail1 = {
        id: 'spam-email-1',
        sender: 'TotallyLegitBank',
        subject: 'URGENT: Your Account Has Been Compromised - Act NOW!',
        date: new Date(2025, 8, 10).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Attention Valued Customer,</h3>
            <p>We have detected suspicious activity on your Outcrook bank account. To prevent further unauthorized access, please click the link below to verify your details immediately:</p>
            <p><a href="#" onclick="alert('Nice try! This is spam.'); return false;">Verify My Account Now</a></p>
            <p>Failure to do so will result in the permanent suspension of your account.</p>
            <p>Sincerely,</p>
            <p>The Totally Legit Bank Security Team</p>
        `,
        folder: 'spam',
        read: false
    };
    emails.push(spamEmail1);

    const spamEmail2 = {
        id: 'spam-email-2',
        sender: 'Nigerian Prince (via secure channel)',
        subject: 'A Royal Opportunity Awaits You!',
        date: new Date(2025, 8, 8).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Greetings, Esteemed Friend,</h3>
            <p>I am Prince Akeem of Zamunda, and I write to you with a matter of utmost urgency and discretion. I require your assistance in transferring a vast fortune (USD 50,000,000) from my country to a secure foreign account.</p>
            <p>For your kind assistance, I am prepared to offer you 20% of the total sum. All I require is your bank account details and a small processing fee to expedite the transfer.</p>
            <p>Please respond swiftly to this confidential proposition.</p>
            <p>Yours in trust,</p>
            <p>Prince Akeem</p>
        `,
        folder: 'spam',
        read: false
    };
    emails.push(spamEmail2);

    // Unread counts for navigation badges
    const unreadCounts = {
        inbox: 0,
        sent: 0,
        drafts: 0,
        spam: 0,
        trash: 0
    };

    // Function to update notification badge
    function updateNotificationBadge(folderId, count) {
        const badgeElement = document.getElementById(`${folderId}-badge`);
        if (badgeElement) {
            if (count > 0) {
                badgeElement.textContent = `(${count})`;
                badgeElement.style.display = 'inline';
            } else {
                badgeElement.style.display = 'none';
            }
        }
    }

    // Function to update all badges based on current email states
    function refreshUnreadCounts() {
        for (const folder in unreadCounts) {
            unreadCounts[folder] = emails.filter(email => email.folder === folder && !email.read).length;
            updateNotificationBadge(folder, unreadCounts[folder]);
        }
    }

    function renderEmailItem(email) {
        const emailItem = document.createElement('div');
        emailItem.classList.add('email-item');
        if (!email.read) {
            emailItem.classList.add('unread');
        }
        emailItem.dataset.emailId = email.id; // Store email ID for easy lookup
        emailItem.innerHTML = `
            <div class="email-info">
                <div class="email-sender">${email.sender}</div>
                <div class="email-subject">${email.subject}</div>
                <div class="email-date">${email.date}</div>
            </div>
            <button class="delete-email-item-btn" data-email-id="${email.id}">🗑️</button>
        `;
        emailItem.addEventListener('click', () => {
            displayEmailContent(email);
            // Mark as read and update badge
            if (!email.read) {
                email.read = true;
                emailItem.classList.remove('unread');
                refreshUnreadCounts();
            }
            // Remove 'active' class from all email items and add to clicked one
            document.querySelectorAll('.email-item').forEach(el => el.classList.remove('active'));
            emailItem.classList.add('active');
        });

        const deleteButton = emailItem.querySelector('.delete-email-item-btn');
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the email item click event from firing
            const emailIdToDelete = event.target.dataset.emailId;
            const emailIndex = emails.findIndex(email => email.id === emailIdToDelete);
            if (emailIndex > -1) {
                emails[emailIndex].folder = 'trash'; // Move to trash
                emails[emailIndex].read = true; // Mark as read when moved to trash
                loadEmailsForFolder(currentFolder); // Re-load current folder
                refreshUnreadCounts();
            }
        });

        return emailItem;
    }

    function displayEmailContent(email) {
        emailBodyContentDiv.innerHTML = `
            <h3>${email.subject}</h3>
            <p>From: ${email.sender}</p>
            <p>Date: ${email.date}</p>
            <hr>
            <div>${email.body}</div>
        `;
        replyEmailBtn.style.display = 'inline-block'; // Show reply button

        const welcomeUserNameSpan = emailBodyContentDiv.querySelector('#welcome-user-name');
        if (welcomeUserNameSpan) {
            welcomeUserNameSpan.textContent = localStorage.getItem('outcrookUserName') || 'User';
        }
    }

    // Function to generate a reply body
    function generateReplyBody(originalEmail, userName) {
        let replyBodyContent = '';
        const senderFirstName = originalEmail.sender.split(',')[0].trim();

        if (originalEmail.id === 'welcome-email') {
            replyBodyContent = `
Thanks very much for the incredibly warm welcome, ${senderFirstName}.

I'm absolutely fizzing with excitement to dive into this role and contribute to Outcrook's unwavering commitment to... well, you know, corporate integrity! I'm ready to get my detective hat on and start sniffing out any peculiar pings or peculiar patterns.
`;
        } else if (originalEmail.folder === 'spam') {
            const spamResponses = [
                `I'm sorry, my pet parrot ate my bank account details. Perhaps next time? Quawk!`, 
                `My sincere apologies, but my fortune is currently tied up in a very exclusive pigeon racing syndicate. I'll get back to you... maybe.`, 
                `I appreciate the offer, but I'm already assisting a much wealthier monarch with their urgent financial needs. Their camels are much faster, you see.`, 
                `Your email has been flagged for excessive enthusiasm. Please dial down the exclamation marks and try again in 3-5 business centuries.`
            ];
            replyBodyContent = spamResponses[Math.floor(Math.random() * spamResponses.length)];
        } else {
            replyBodyContent = `
Acknowledged.
`;
        }

        return `Hi ${senderFirstName},

${replyBodyContent}
Best, ${userName}, special investigator`;
    }

    // Function to simulate typing
    function simulateTyping(targetElement, fullText, charsPerKey = 8, onComplete) {
        let charIndex = 0;
        let keydownListener;
        let enterListenerAddedForThisTyping = false; // Local flag for this typing instance

        function typeChar() {
            if (charIndex < fullText.length) {
                targetElement.textContent += fullText.substring(charIndex, charIndex + charsPerKey);
                charIndex += charsPerKey;
            } else {
                document.removeEventListener('keydown', keydownListener);
                if (!enterListenerAddedForThisTyping) {
                    const sendPrompt = document.createElement('p');
                    sendPrompt.id = 'send-prompt';
                    sendPrompt.textContent = 'Press Enter to send';
                    targetElement.parentNode.appendChild(sendPrompt);

                    document.addEventListener('keydown', function sendHandler(event) {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            document.removeEventListener('keydown', sendHandler);
                            sendPrompt.remove();
                            if (onComplete) {
                                onComplete();
                            }
                        }
                    });
                    enterListenerAddedForThisTyping = true;
                }
            }
        }

        // Listener for keystroke-driven typing
        keydownListener = function(event) {
            // Only type if we haven't finished and it's not a modifier key
            if (charIndex < fullText.length && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                event.preventDefault(); // Prevent actual typing in the div
                typeChar();
            }
        };

        document.addEventListener('keydown', keydownListener);
    }

    function loadEmailsForFolder(folder) {
        emailListDiv.innerHTML = ''; // Clear current emails
        emailBodyContentDiv.innerHTML = '<h3 style="padding: 15px;">Select an email to view its content</h3>';
        replyEmailBtn.style.display = 'none'; // Hide reply button
        currentFolder = folder;
        emailListFolderHeader.textContent = folder.charAt(0).toUpperCase() + folder.slice(1); // Capitalize first letter

        const filteredEmails = emails.filter(email => email.folder === folder);
        if (filteredEmails.length > 0) {
            filteredEmails.forEach(email => {
                emailListDiv.appendChild(renderEmailItem(email));
            });
            // Select the first unread email, or the first email if all are read
            const firstEmailToSelect = filteredEmails.find(email => !email.read) || filteredEmails[0];
            if (firstEmailToSelect) {
                displayEmailContent(firstEmailToSelect);
                const correspondingEmailItem = emailListDiv.querySelector(`[data-email-id="${firstEmailToSelect.id}"]`);
                if (correspondingEmailItem) {
                    correspondingEmailItem.classList.add('active');
                    if (!firstEmailToSelect.read) {
                        firstEmailToSelect.read = true;
                        correspondingEmailItem.classList.remove('unread');
                        refreshUnreadCounts();
                    }
                }
            }
        } else {
            emailListDiv.innerHTML = '<div style="padding: 15px;">No emails in this folder.</div>';
        }
    }

    // Handle navigation item clicks
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active')); // Remove active from all
            item.classList.add('active'); // Add active to clicked
            const folder = item.id.replace('-nav', ''); // Get folder name from ID
            loadEmailsForFolder(folder);
        });
    });

    // Initial load: Display inbox and refresh unread counts
    loadEmailsForFolder('inbox');
    refreshUnreadCounts();

    // Reply email functionality
    replyEmailBtn.addEventListener('click', () => {
        // Capture the currently displayed email's details from emailBodyContentDiv
        const currentEmailSubject = emailBodyContentDiv.querySelector('h3').textContent;
        const currentEmailSender = emailBodyContentDiv.querySelector('p:nth-of-type(1)').textContent.replace('From: ', '');

        // Find the original email object to get its ID for reply generation
        const originalEmail = emails.find(email => email.subject === currentEmailSubject && email.sender === currentEmailSender);

        if (!originalEmail || originalEmail.replied) {
            alert('You have already replied to this email or it\'s not a valid email to reply to.');
            return;
        }

        const userName = localStorage.getItem('outcrookUserName') || 'User';
        const replyText = generateReplyBody(originalEmail, userName);

        // Clear emailBodyContentDiv and set up reply interface
        emailBodyContentDiv.innerHTML = `
            <h3>Replying to: ${originalEmail.subject}</h3>
            <div id="reply-typing-area" style="border: 1px solid #ccc; padding: 10px; min-height: 100px; white-space: pre-wrap; position: relative; user-select: none;"></div>
        `;
        replyEmailBtn.style.display = 'none'; // Hide reply button while typing

        const replyTypingArea = document.getElementById('reply-typing-area');
        let typingStarted = false;

        // Create and append the type prompt initially
        const typePrompt = document.createElement('p');
        typePrompt.id = 'type-prompt';
        typePrompt.classList.add('flashing-text');
        typePrompt.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);';
        typePrompt.textContent = 'Press any key to start typing...';
        replyTypingArea.appendChild(typePrompt);

        // Create send button and prompt, append to emailBodyContentDiv
        sendReplyBtn = document.createElement('button');
        sendReplyBtn.id = 'send-reply-btn';
        sendReplyBtn.textContent = 'Send';
        sendReplyBtn.style.display = 'none'; // Initially hidden
        emailBodyContentDiv.appendChild(sendReplyBtn);

        sendPromptElement = document.createElement('p');
        sendPromptElement.id = 'send-prompt';
        sendPromptElement.textContent = 'Press Enter to send';
        sendPromptElement.style.display = 'none'; // Initially hidden
        emailBodyContentDiv.appendChild(sendPromptElement);


        const sendReplyHandler = function() {
            sendReplyBtn.removeEventListener('click', sendReplyHandler);
            document.removeEventListener('keydown', enterSendHandler);
            sendReplyBtn.style.display = 'none'; // Hide button
            sendPromptElement.style.display = 'none'; // Hide prompt
            sendReplyBtn.remove(); // Remove button from DOM
            sendPromptElement.remove(); // Remove prompt from DOM

            const sentReply = {
                id: `reply-${originalEmail.id}-${Date.now()}`,
                sender: `${userName}, special investigator`,
                subject: `Re: ${originalEmail.subject}`,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                body: replyText,
                folder: 'sent',
                read: true
            };
            emails.push(sentReply);
            originalEmail.replied = true;
            alert('Reply sent!');
            loadEmailsForFolder('sent');
            refreshUnreadCounts();
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
                
                simulateTyping(replyTypingArea, replyText, 8, () => {
                    console.log('Typing simulation complete. Attempting to show send options.'); // Debugging line
                    sendPromptElement.style.display = 'block'; // Show prompt
                    sendReplyBtn.style.display = 'block'; // Show the Send button

                    sendReplyBtn.addEventListener('click', sendReplyHandler);
                    document.addEventListener('keydown', enterSendHandler);
                });
            }
        };

        document.addEventListener('keydown', startTypingListener);
    });
});

