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

    // Custom Prompt/Notification Logic
    const customPromptOverlay = document.getElementById('custom-prompt-overlay');
    const customPromptMessage = document.getElementById('custom-prompt-message');
    const customPromptInput = document.getElementById('custom-prompt-input');
    const customPromptOkBtn = document.getElementById('custom-prompt-ok');
    const customPromptCancelBtn = document.getElementById('custom-prompt-cancel');

    function showCustomPrompt(message, type = 'alert', defaultValue = '') {
        return new Promise((resolve) => {
            customPromptMessage.textContent = message;
            customPromptInput.value = defaultValue;

            customPromptOverlay.style.display = 'flex';

            // Define handleOk and keydown listeners here so they can be properly removed.
            let activeKeydownListener = null; // To keep track of the currently active keydown listener

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
                customPromptCancelBtn.style.display = 'none';
                customPromptInput.focus();
                
                customPromptOkBtn.addEventListener('click', okButtonListener);
                document.addEventListener('keydown', promptKeydownListener);
                activeKeydownListener = promptKeydownListener; // Set the active listener
            } else { // 'alert'
                customPromptInput.style.display = 'none';
                customPromptOkBtn.style.display = 'inline-block';
                customPromptCancelBtn.style.display = 'none';
                
                customPromptOkBtn.addEventListener('click', okButtonListener);
                document.addEventListener('keydown', alertKeydownListener);
                activeKeydownListener = alertKeydownListener; // Set the active listener
            }
        });
    }

    // Function to get user name
    async function getUserName() { // Made async to use await
        let userName = localStorage.getItem('outcrookUserName');
        if (!userName) {
            let isValidName = false;
            while (!isValidName) {
                userName = await showCustomPrompt('Welcome to Outcrook! Please input your preferred name', 'prompt', ''); // Removed default 'Detective' and 'at least 1 character' from message
                if (userName && userName.trim().length > 0) {
                    isValidName = true;
                    // Convert to title case
                    userName = userName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
                    localStorage.setItem('outcrookUserName', userName);
                } else { // If user provides empty name (after trim) or cancels
                    // This branch should now only be hit if user hits OK with empty string.
                    // The showCustomPrompt loop handles re-prompting for empty input
                    // For explicit clarity, though, we won't allow progression with empty.
                    await showCustomPrompt('Name cannot be empty. Please input your preferred name.', 'alert');
                }
            }
        }
        if (userName) {
            userProfile.textContent = `Detective ${userName}`;

            // Jane's welcome email (will be added immediately, trigger will be first click)
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
                replied: false,
                storyTriggered: false, // New flag for story progression
                receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            };
            emails.push(welcomeEmail); // Add the welcome email immediately

        } else {
            userProfile.textContent = `Detective ${userName}`;
            // If user already has a name, ensure inbox is loaded with correct emails and counts are refreshed.
            loadEmailsForFolder('inbox');
            refreshUnreadCounts();
        }
    }

    // Eleanor Vance's email (initial email)
    const initialLegalEmail = {
        id: 'legal-email',
        sender: 'Eleanor Vance, Chief Legal Officer',
        subject: 'Confidential: Potential Intellectual Property Breach - Next Steps',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Legal Strategy for "TasteBlast" Leak</h3>
            <p>To the Special Investigator,</p>
            <p>This email is to formally engage your services regarding the egregious intellectual property breach concerning our "TasteBlast" product. The evidence strongly suggests internal malfeasance, and we are preparing for potential litigation against TasteBuds.</p>
            <p>However, for any legal action to be successful, we require concrete, irrefutable evidence. Hearsay and suspicion, while compelling, will not suffice in a court of law. Your investigation must yield actionable intelligence: identify the individual(s) responsible, their method of data exfiltration, and any accomplice networks.</p>
            <p>I understand this is a delicate matter, and discretion is paramount. Keep me updated on any significant breakthroughs. The future of FlavorCo's market position hinges on your findings.</p>
            <p>Eleanor Vance<br>Chief Legal Officer</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false,
        receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    emails.push(initialLegalEmail); // Add Eleanor's email immediately

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
    // const welcomeEmail = { // Moved to be created dynamically after user name input
    //     id: 'welcome-email',
    //     sender: 'Jane, Director of People',
    //     subject: 'Welcome to Outcrook - Your Onboarding as a Detective',
    //     date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    //     body: `
    //         <h3>Welcome to the Outcrook Team!</h3>
    //         <p>Dear Detective <span id="welcome-user-name"></span>,</p>
    //         <p>A warm welcome to Outcrook! We're thrilled to have you join our esteemed team. Your unique skills and perspective are highly valued as we embark on a new era of corporate integrity.</p>
    //         <p>Your role here will be pivotal in ensuring transparency and uncovering any… anomalies that may arise within our organizational structure. Consider this your first confidential assignment: familiarize yourself with our systems, observe, and report anything that seems out of place.</p>
    //         <p>Your journey to uncover the truth begins now. We trust you'll uphold our values with the utmost discretion and diligence.</p>
    //         <p>Best regards,</p>
    //         <p>Jane, Director of People</p>
    //     `,
    //     folder: 'inbox',
    //     read: false,
    //     replied: false
    // };
    // emails.push(welcomeEmail); // Removed: now pushed after a delay

    // Creative spam emails - these will be dynamically pushed later based on story progression, not on initial load
    const spamEmail1Template = {
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
        read: false,
        receivedTime: new Date(2025, 8, 10, 9, 30).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    // emails.push(spamEmail1); // Removed from initial load

    const spamEmail2Template = {
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
        read: false,
        receivedTime: new Date(2025, 8, 8, 14, 0).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    // emails.push(spamEmail2); // Removed from initial load

    // Story emails - Phase 1: Initial Investigation & Departmental Insights - these will be dynamically pushed later
    const marketingEmailTemplate = {
        id: 'marketing-email',
        sender: 'Sarah Chen, Head of Marketing',
        subject: 'URGENT: TasteBuds\' New Product Launch - Identical to Ours!',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Crisis Meeting Follow-Up: TasteBuds' "FlavorFusion"</h3>
            <p>Team,</p>
            <p>As discussed, the launch of TasteBuds' "FlavorFusion" is an absolute nightmare. It's not just similar; it's virtually *identical* to our flagship product, "TasteBlast"! This is a catastrophic blow, especially after all the R&D and market testing we poured into it.</p>
            <p>I'm particularly concerned given the recent, shall we say, *anomalies* in our internal data systems. We had some minor glitches with file access a few weeks back, remember? Coincidence? I'm not so sure. We need to explore every angle to understand how this could have happened.</p>
            <p>Please prepare a comprehensive competitive analysis report by end of day. We need to identify any potential vulnerabilities in our launch strategy and, more importantly, figure out if this was an inside job.</p>
            <p>Regards,</p>
            <p>Sarah Chen<br>Head of Marketing</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false,
        receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    // emails.push(marketingEmail);

    const rdEmailTemplate = {
        id: 'rd-email',
        sender: 'Dr. Aris Thorne, Head of R&D',
        subject: 'Internal Review: TasteBlast Formula Integrity',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Urgent: Review of "TasteBlast" Development Protocols</h3>
            <p>Team,</p>
            <p>In light of recent… *developments*… it is imperative that we conduct an immediate, stringent internal review of all "TasteBlast" formula protocols and access logs. The proprietary nature of this product cannot be overstated, and its replication by TasteBuds is deeply troubling.</p>
            <p>I recall a few weeks prior to the leak, we had that scheduled external vendor visit. While everything appeared routine, I'd appreciate it if everyone could re-verify all sign-in/sign-out procedures and any unusual observations from that period. Also, I'm aware of some dissatisfaction from a junior researcher, Alex, regarding his promotion timeline and restricted access to certain advanced project files. While likely unrelated, all data points are critical now.</p>
            <p>Please forward any relevant security audit reports or access anomalies from the last three months directly to my secure terminal.</p>
            <p>Dr. Aris Thorne<br>Head of R&D</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false,
        receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    // emails.push(rdEmail);

    const itSecurityEmailTemplate = {
        id: 'it-security-email',
        sender: 'IT Security Automated Alert',
        subject: 'SECURITY ALERT: Unusual File Access Detected (Project TasteBlast)',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Automated Security Report - High Alert</h3>
            <p><strong>System:</strong> FlavorCo Internal Network</p>
            <p><strong>Severity:</strong> HIGH</p>
            <p><strong>Incident:</strong> Multiple unauthorized access attempts detected on Project TasteBlast's secure repository. Anomalous data transfer patterns observed from an internal IP address (192.168.1.107) to an external, unverified server during off-hours (approximately 02:30 AM PST).</p>
            <p><strong>Status:</strong> Initial breach contained. Further investigation required to identify source and impact. All relevant logs have been flagged for review by authorized personnel.</p>
            <p><strong>Action Required:</strong> Immediate review by a Special Investigator is recommended to determine the nature of the data transfer and user associated with IP 192.168.1.107.</p>
            <p>Automated System Message</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false,
        receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    // emails.push(itSecurityEmail);

    const legalEmailTemplate = {
        id: 'legal-email',
        sender: 'Eleanor Vance, Chief Legal Officer',
        subject: 'Confidential: Potential Intellectual Property Breach - Next Steps',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Legal Strategy for "TasteBlast" Leak</h3>
            <p>To the Special Investigator,</p>
            <p>This email is to formally engage your services regarding the egregious intellectual property breach concerning our "TasteBlast" product. The evidence strongly suggests internal malfeasance, and we are preparing for potential litigation against TasteBuds.</p>
            <p>However, for any legal action to be successful, we require concrete, irrefutable evidence. Hearsay and suspicion, while compelling, will not suffice in a court of law. Your investigation must yield actionable intelligence: identify the individual(s) responsible, their method of data exfiltration, and any accomplice networks.</p>
            <p>I understand this is a delicate matter, and discretion is paramount. Keep me updated on any significant breakthroughs. The future of FlavorCo's market position hinges on your findings.</p>
            <p>Eleanor Vance<br>Chief Legal Officer</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false,
        receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    // emails.push(legalEmail);

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
        emailItem.classList.add('slide-in'); // Add slide-in animation class
        emailItem.dataset.emailId = email.id; // Store email ID for easy lookup
        emailItem.innerHTML = `
            <div class="email-info">
                <div class="email-sender">${email.sender}</div>
                <div class="email-subject">${email.subject}</div>
                <div class="email-date">${email.date} ${email.receivedTime}</div>
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

            // Trigger next story email after first click on Jane's welcome email
            if (email.id === 'welcome-email' && !email.storyTriggered) {
                email.storyTriggered = true; // Mark as triggered
                const delay = Math.floor(Math.random() * (15 - 10 + 1) + 10) * 1000; // Random delay between 10 and 15 seconds
                setTimeout(() => {
                    deliverNextStoryEmail();
                }, delay);
            }
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

        // Add nudge for important emails (Jane's welcome email)
        if (email.id === 'welcome-email' && !email.replied) {
            replyEmailBtn.classList.add('reply-nudge-active');
        } else {
            replyEmailBtn.classList.remove('reply-nudge-active');
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
Best, ${userName}, Special Investigator`;
    }

    // Function to simulate typing
    function simulateTyping(targetElement, fullText, charsPerKey = 15, onComplete) {
        let charIndex = 0;
        let keydownListener;
        let typingCompleted = false; // Flag to track if typing is fully done

        function typeChar() {
            if (charIndex < fullText.length) {
                targetElement.textContent += fullText.substring(charIndex, charIndex + charsPerKey);
                charIndex += charsPerKey;
                if (charIndex >= fullText.length) { // Check if typing just completed in this step
                    typingCompleted = true;
                    document.removeEventListener('keydown', keydownListener); // Remove typing listener
                    if (onComplete) {
                        onComplete();
                    }
                }
            }
        }

        // Listener for keystroke-driven typing
        keydownListener = function(event) {
            // Only type if we haven't finished and it's not a modifier key
            if (!typingCompleted && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                event.preventDefault(); // Prevent actual typing in the div
                typeChar();
            }
        };

        document.addEventListener('keydown', keydownListener);
    }

    function loadEmailsForFolder(folder) {
        emailListDiv.innerHTML = ''; // Clear current emails
        emailBodyContentDiv.innerHTML = '<h3 class="email-content-placeholder">Select an email to view its content</h3>';
        replyEmailBtn.style.display = 'none'; // Hide reply button
        currentFolder = folder;
        emailListFolderHeader.textContent = folder.charAt(0).toUpperCase() + folder.slice(1); // Capitalize first letter

        const filteredEmails = emails.filter(email => email.folder === folder);
        if (filteredEmails.length > 0) {
            // Sort emails by receivedTime in descending order (latest on top)
            filteredEmails.sort((a, b) => new Date(`2000/01/01 ${b.receivedTime}`) - new Date(`2000/01/01 ${a.receivedTime}`));

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
            emailListDiv.innerHTML = '<div class="email-list-placeholder">No emails in this folder.</div>';
            emailBodyContentDiv.innerHTML = '<div class="email-content-placeholder">Select an email to view its content</div>'; // Ensure content placeholder is always there for empty folder
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

    // Keep track of the next story email to deliver
    let nextStoryEmailIndex = 0; // Start with the first story email after Jane's
    const storyEmailsQueue = [
        marketingEmailTemplate,
        rdEmailTemplate,
        itSecurityEmailTemplate
    ];

    // Function to deliver the next story email after a random delay
    function deliverNextStoryEmail() {
        if (nextStoryEmailIndex < storyEmailsQueue.length) {
            const delay = Math.floor(Math.random() * (15 - 10 + 1) + 10) * 1000; // Random delay between 10 and 15 seconds
            setTimeout(() => {
                const nextEmail = { ...storyEmailsQueue[nextStoryEmailIndex] }; // Create a copy
                nextEmail.receivedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                emails.push(nextEmail);
                refreshUnreadCounts(); // Update notification badge without changing folder
                nextStoryEmailIndex++;
            }, delay);
        }
    }

    // This will track if a special 'story' email is currently displayed and requires a reply.
    // let currentStoryEmailRequiresReply = null; 

    // Reply email functionality
    replyEmailBtn.addEventListener('click', () => {
        // Capture the currently displayed email's details from emailBodyContentDiv
        const currentEmailSubject = emailBodyContentDiv.querySelector('h3').textContent;
        const currentEmailSender = emailBodyContentDiv.querySelector('p:nth-of-type(1)').textContent.replace('From: ', '');

        // Find the original email object to get its ID for reply generation
        const originalEmail = emails.find(email => email.subject === currentEmailSubject && email.sender === currentEmailSender);

        if (!originalEmail || originalEmail.replied) {
            showCustomPrompt('You have already replied to this email or it\'s not a valid email to reply to.', 'alert');
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
                sender: `${userName}, Special Investigator`,
                subject: `Re: ${originalEmail.subject}`,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                body: `<pre>${replyText}</pre>`,
                folder: 'sent',
                read: true,
                receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            };
            emails.push(sentReply);
            originalEmail.replied = true;
            // Move the original email to trash after replying.
            originalEmail.folder = 'trash'; 

            showCustomPrompt('Reply sent!', 'alert'); // Use custom alert
            // Reload the inbox folder to show the original email, not sent
            loadEmailsForFolder('inbox');
            refreshUnreadCounts();

            // Remove nudge after replying
            replyEmailBtn.classList.remove('reply-nudge-active');

            // Re-select the original email item in the inbox to keep it highlighted
            const correspondingEmailItem = emailListDiv.querySelector(`[data-email-id="${originalEmail.id}"]`);
            if (correspondingEmailItem) {
                document.querySelectorAll('.email-item').forEach(el => el.classList.remove('active'));
                correspondingEmailItem.classList.add('active');
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
                
                simulateTyping(replyTypingArea, replyText, 15, () => {
                    sendPromptElement.style.display = 'block'; // Show prompt
                    sendReplyBtn.style.display = 'block'; // Show the Send button

                    sendReplyBtn.addEventListener('click', sendReplyHandler);
                    document.addEventListener('keydown', enterSendHandler);
                });
            }
        };

        document.addEventListener('keydown', startTypingListener);
    });

    // Settings menu and Dark Mode functionality
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    // Load dark mode preference from localStorage
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    // Open settings menu
    settingsBtn.addEventListener('click', () => {
        settingsMenu.style.display = 'flex';
    });

    // Close settings menu
    closeSettingsBtn.addEventListener('click', () => {
        settingsMenu.style.display = 'none';
    });

    // Toggle dark mode
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
        }
    });
});


