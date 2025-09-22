document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const container = document.querySelector('.container');
    const introScreen = document.getElementById('intro-screen');
    const nameInput = document.getElementById('name-input');
    const startGameBtn = document.getElementById('start-game-btn');

    const userProfile = document.getElementById('user-profile');
    const emailListDiv = document.querySelector('.email-list');
    const emailListFolderHeader = document.getElementById('email-list-folder-header');
    const replyEmailBtn = document.getElementById('reply-email-btn');
    const emailBodyContentDiv = document.getElementById('email-body-content');
    const currentTimeSpan = document.getElementById('current-time');

    // ---- Game State ----
    let emails = [];
    let currentFolder = 'inbox';
    
    // Make emails global for external functions
    window.emails = emails;
    let nextStoryEmailIndex = 0;
    let spamDeliveryTimer = null;
    let itEmailSent = false;
    let spamCascadeInterval = null;
    let availableSpamTemplates = [];

    // ---- Reply Interface State ----
    let sendReplyBtn;
    let sendPromptElement;
    let storyContacted = false; // Prevents contacting Alex multiple times
    
    // --- Email Templates (including 5 new spam variations) ---
    const welcomeEmailTemplate = {
        id: 'welcome-email',
        sender: 'Jane, Director of People',
        senderIP: '192.168.1.042',
        subject: 'Your Super-Secret Detective Mission Starts NOW!',
        body: `
            <h3>Welcome to the Outcrook Team!</h3>
            <p>Greetings, Detective <span id="welcome-user-name"></span>!</p>
            <p>Your super-secret mission at FlavorCo (a division of Outcrook!) officially begins! We're thrilled to have your keen eyes and sharp mind on board. We suspect foul play, whispers of stolen snack secrets... a real whodunit!</p>
            <p>Your task: sniff out clues, interrogate suspects (figuratively, of course!), and uncover the truth. Your badge and magnifying glass are waiting (metaphorically, for now!). Good luck, agent!</p>
            <p>Best,</p>
            <p>Jane, Director of People (and Head of Secret Squirrel Operations)</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false,
        storyTriggered: false,
        emailType: 'interactiveReply',
    };

    const marketingEmailTemplate = {
        id: 'marketing-email',
        sender: 'Sarah Chen, Head of Marketing',
        subject: 'Panic! TasteBuds Cloned Our Snack!',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Our "TasteBlast" is a Double!</h3>
            <p>Team (and especially you, Detective!),</p>
            <p>This is NOT a drill! TasteBuds just launched "FlavorFusion" and it's basically our "TasteBlast" in a different wrapper! I'm talking identical! My marketing plans are toast!</p>
            <p>Remember those weird computer hiccups last month? Was it a coincidence? Or did someone spill the beans (or the secret spices)? We need to figure out how they copied us! Find the mole, find the truth!</p>
            <p>Frantically yours,</p>
            <p>Sarah Chen<br>Head of Marketing (currently pulling her hair out)</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false,
        emailType: 'multipleChoice', // <-- Set type
        replyOptions: [             // <-- Add reply options
            { text: "Focus on the recipe leak first.", consequence: "logic" },
            { text: "Let's dig into their marketing strategy.", consequence: "creative" },
            { text: "I suspect a mole. Let's watch internally.", consequence: "suspicion" }
        ],
        receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const rdEmailTemplate = {
        id: 'rd-email',
        sender: 'Dr. Aris Thorne, Head of R&D',
        senderIP: '192.168.1.105',
        subject: 'Our Secret Recipe is GONE! Lab on Lockdown!',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Recipe Heist! R&D is a Mess!</h3>
            <p>Detective <span id="rd-user-name"></span>,</p>
            <p>Our precious "TasteBlast" formula has vanished into thin air! TasteBuds' new product is proof! We need a full-scale investigation into our lab. Every beaker, every test tube, every… sniff… must be checked!</p>
            <p>And speaking of sniffs, I recall a certain "<span class="jumbled-clue" data-clue="Alex"></span>" (our junior researcher) grumbling about promotions and secret files. Could it be a clue? Find out who took our delicious secrets!</p>
            <p>Panicked but Scientific,</p>
            <p>Dr. Aris Thorne<br>Head of R&D (currently wearing a tin-foil hat)</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false,
        emailType: 'readOnly',
        receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const itSupportEmailTemplate = {
        id: 'it-support-email',
        sender: 'IT Support',
        subject: 'Thank You for Reporting Suspicious Activity!',
        body: `
            <h3>Great catch, Detective!</h3>
            <p>Thanks for reporting that junk email. Vigilance like yours is key to our security. We've analyzed the threat and taken action.</p>
            <p>To help with your investigation, we've approved the installation of a new "Digital Microscope Tool" for your terminal. This will grant you elevated privileges to uncover hidden data within our systems.</p>
            <p>Please click the button below to begin the installation. It should only take a moment.</p>
            <button id="install-tool-btn" class="install-btn-pulsate">Install Digital Microscope Tool</button>
            <p>Stay sharp,</p>
            <p>IT Support</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false, // Add replied property
        emailType: 'readOnly',
    };

    const spamEmail1Template = {
        id: 'spam-email-1',
        sender: 'Royal Emissary of Atlantis',
        subject: 'URGENT: Sunken Treasure For You',
        body: `
            <h3>Greetings from the Deep!</h3>
            <p>I bring tidings from the lost city of Atlantis! We have discovered a chest of ancient gold with your name on it. To transport it to the surface, we require a small tribute for the royal submersibles.</p>
            <p>Please select an option below to proceed.</p>
        `,
        folder: 'inbox',
        read: false,
        emailType: 'multipleChoice',
        replyOptions: [
            { text: "This sounds legitimate. Send the tribute.", consequence: 'scam' },
            { text: "Report this email to IT.", consequence: 'reportJunk' },
        ]
    };
    const spamEmail2Template = {
        id: 'spam-email-2',
        sender: 'Barnaby, Head of Royal Transport',
        subject: 'Fuel for the Gilded Narwhal',
        body: `
            <h3>A Matter of Nautical Urgency!</h3>
            <p>Further to the Emissary's message, please be advised that the Royal Submersible, the 'Gilded Narwhal', requires a top-up of purified kelp fuel. A small donation from yourself would greatly expedite the treasure's journey!</p>
        `,
        folder: 'inbox',
        read: false,
        emailType: 'multipleChoice',
        replyOptions: [
            { text: "Of course, for the Narwhal! Send donation.", consequence: 'scam' },
            { text: "This is getting fishy. Report to IT.", consequence: 'reportJunk' },
        ]
    };
    const spamEmail3Template = {
        id: 'spam-email-3',
        sender: 'Captain Neptune, Head of Naval Affairs',
        subject: 'A Royal Request for Your Assistance',
        body: `
            <h3>A Royal Request for Your Assistance</h3>
            <p>Your Majesty, the Royal Fleet has encountered a mysterious underwater obstruction. We require a skilled diver to investigate the source. Your presence would be invaluable.</p>
        `,
        folder: 'inbox',
        read: false,
        emailType: 'multipleChoice',
        replyOptions: [
            { text: "I'll dive in! Send me the coordinates.", consequence: 'scam' },
            { text: "This is a trap. Report to IT.", consequence: 'reportJunk' },
        ]
    };
    const spamEmail4Template = {
        id: 'spam-email-4',
        sender: 'Mermaid Queen, Head of Underwater Affairs',
        subject: 'A Royal Invitation to the Deep',
        body: `
            <h3>A Royal Invitation to the Deep</h3>
            <p>Your Majesty, the Mermaid Queen has invited you to a grand underwater banquet. We have prepared the finest Atlantean delicacies and entertainment. Your presence is requested.</p>
        `,
        folder: 'inbox',
        read: false,
        emailType: 'multipleChoice',
        replyOptions: [
            { text: "I'll swim down! Send me the date.", consequence: 'scam' },
            { text: "This is a ruse. Report to IT.", consequence: 'reportJunk' },
        ]
    };
    const spamEmail5Template = {
        id: 'spam-email-5',
        sender: 'Atlantean Ambassador',
        subject: 'A Royal Request for Your Assistance',
        body: `
            <h3>A Royal Request for Your Assistance</h3>
            <p>Your Majesty, the Atlantean Ambassador has requested your presence at a diplomatic meeting. We must discuss the recent tensions with the Surface Kingdom.</p>
        `,
        folder: 'inbox',
        read: false,
        emailType: 'multipleChoice',
        replyOptions: [
            { text: "I'll attend! Send me the location.", consequence: 'scam' },
            { text: "This is a ploy. Report to IT.", consequence: 'reportJunk' },
        ]
    };

    const storyEmailsQueue = [ marketingEmailTemplate ];

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
    async function getUserName() {
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
                } else { 
                    // This branch should now only be hit if user hits OK with empty string.
                    // The showCustomPrompt loop handles re-prompting for empty input
                }
            }
        }
        if (userName) {
            userProfile.textContent = `Detective ${userName}`;
        }
    }

    // Function to display current time
    function updateCurrentTime() {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        currentTimeSpan.textContent = now.toLocaleTimeString('en-US', options);
    }
    
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
            handleEmailDisplay(email, emailItem);
        });

        const deleteButton = emailItem.querySelector('.delete-email-item-btn');
        // Hide delete button in the trash folder or for Jane's email
        if (currentFolder === 'trash' || email.id === 'welcome-email') {
            deleteButton.style.display = 'none';
        }

        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the email item click event from firing
            const emailIdToDelete = event.target.dataset.emailId;
            const emailIndex = emails.findIndex(email => email.id === emailIdToDelete);
            if (emailIndex > -1) {
                emails[emailIndex].folder = 'trash'; // Move to trash
                emails[emailIndex].read = true; // Mark as read when moved to trash
                loadEmailsForFolder(currentFolder); // Re-load current folder
                refreshUnreadCounts();

                // If Eleanor's email is deleted, deliver Jane's email after 3 seconds
                if (emailIdToDelete === 'legal-email') {
                    setTimeout(deliverWelcomeEmail, 3000);
                }
            }
        });

        return emailItem;
    }

    function displayEmailContent(email) {
        emailBodyContentDiv.innerHTML = `
            <h3>${email.subject}</h3>
            <p>From: ${email.senderIP ? `<span class="sender-ip-clue" data-ip="${email.senderIP}">${email.sender}</span>` : email.sender}</p>
            <p>Date: ${email.date}</p>
            <hr>
            <div>${email.body}</div>
        `;
        
        const replyButton = document.getElementById('reply-email-btn');
        const magnifyingGlassIcon = document.getElementById('magnifying-glass-icon');

        // Reset nudge states
        replyButton.classList.remove('reply-nudge-active');
        if (magnifyingGlassIcon) {
            magnifyingGlassIcon.classList.remove('pulse-magnify');
        }

        // Handle button visibility based on email type
        if (email.emailType === 'readOnly' || email.replied) {
            replyButton.style.display = 'none';
        } else if (email.emailType === 'multipleChoice') {
            replyButton.style.display = 'none'; // Hide main reply button
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'reply-options-container';
            email.replyOptions.forEach(option => {
                const optionButton = document.createElement('button');
                optionButton.className = 'reply-option-btn';
                optionButton.textContent = option.text;
                optionButton.addEventListener('click', () => handleMultipleChoiceReply(email, option));
                optionsContainer.appendChild(optionButton);
            });
            emailBodyContentDiv.appendChild(optionsContainer);
        } else {
            replyButton.style.display = 'inline-block';
        }

        // Add nudge for important emails (Jane's welcome email)
        if (email.id === 'welcome-email' && !email.replied) {
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
            }, 2000); // 2 seconds after viewing R&D email
        }

        const welcomeUserNameSpan = emailBodyContentDiv.querySelector('#welcome-user-name');
        if (welcomeUserNameSpan) {
            welcomeUserNameSpan.textContent = localStorage.getItem('outcrookUserName') || 'User';
        }

        const rdUserNameSpan = emailBodyContentDiv.querySelector('#rd-user-name');
        if (rdUserNameSpan) {
            rdUserNameSpan.textContent = localStorage.getItem('outcrookUserName') || 'User';
        }

        const ceoUserNameSpan = emailBodyContentDiv.querySelector('#ceo-user-name');
        if (ceoUserNameSpan) {
            ceoUserNameSpan.textContent = localStorage.getItem('outcrookUserName') || 'User';
        }

        // Add click event listener to install link if it exists
        const installBtn = emailBodyContentDiv.querySelector('#install-tool-btn');
        if (installBtn) {
            installBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Check if the tool is already installed by looking for the visible class
                const microscopeWrapper = document.getElementById('microscope-wrapper');
                if (microscopeWrapper && microscopeWrapper.classList.contains('visible')) {
                    showCustomPrompt('Digital Microscope Tool is already installed.', 'alert');
                    installBtn.textContent = 'Tool Already Installed';
                    installBtn.disabled = true;
                    return;
                }
                installBtn.textContent = 'Installing...';
                installBtn.disabled = true;
                installBtn.classList.remove('install-btn-pulsate');
                email.replied = true; 
                simulateInstallation(email);
            });
        }
    }

    function handleMultipleChoiceReply(originalEmail, selectedOption) {
        const userName = localStorage.getItem('outcrookUserName') || 'User';
        const senderFirstName = originalEmail.sender.split(',')[0].trim();

        const replyText = `Hi ${senderFirstName},

${selectedOption.text}

Best, ${userName}, Special Investigator`;

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
        originalEmail.folder = 'trash';

        showCustomPrompt('Reply sent!', 'alert');
        loadEmailsForFolder('inbox');
        refreshUnreadCounts();

        // If it's a spam email, handle consequences
        if (originalEmail.id.startsWith('spam-')) {
            // Always move spam emails to trash after any interaction
            originalEmail.folder = 'trash';
            
            if (spamCascadeInterval) { // Stop spam cascade if active
                clearInterval(spamCascadeInterval);
                spamCascadeInterval = null;
            }
            // Handle consequences based on choice
            if (selectedOption.consequence === 'reportJunk') {
                // Only deliver the IT email if it hasn't been sent before
                if (!itEmailSent) {
                    setTimeout(() => deliverITSupportEmail(selectedOption.consequence), 5000);
                    itEmailSent = true; // Mark as sent
                }
            } else if (selectedOption.consequence === 'scam') {
                startSpamCascade(); // Start the spam cascade
            }
            
            // Refresh the current folder view to show the email moved to trash
            loadEmailsForFolder(currentFolder);
            refreshUnreadCounts();
        } else if (originalEmail.id === 'marketing-email') {
            // Replying to Sarah starts the spam cascade after 6 seconds
            setTimeout(startSpamCascade, 6000);
        } else {
            // Otherwise, trigger the next main story email after 3 seconds
            setTimeout(deliverNextStoryEmail, 3000);
        }
    }

    function simulateInstallation(emailToTrash) {
        const installOverlay = document.getElementById('install-overlay');
        const progressBar = document.getElementById('progress-bar');
        const installStatus = document.getElementById('install-status');
        installOverlay.style.display = 'flex';

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 100) {
                progress = 100;
            }
            progressBar.style.width = progress + '%';

            if (progress === 100) {
                clearInterval(interval);
                installStatus.textContent = 'Installation Complete!';
                setTimeout(() => {
                    installOverlay.style.display = 'none';
                    addMagnifyingGlassIcon();
                    // Move the IT email to trash
                    if (emailToTrash) {
                        emailToTrash.folder = 'trash';
                        loadEmailsForFolder(currentFolder);
                        refreshUnreadCounts();
                    }
                    // Deliver R&D email 3 seconds after installation
                    setTimeout(deliverRDEmail, 3000);
                }, 1500);
            }
        }, 200);
    }

    function addMagnifyingGlassIcon() {
        const microscopeWrapper = document.getElementById('microscope-wrapper');
        const magnifyingGlass = document.getElementById('magnifying-glass-icon');
        const statusText = document.getElementById('microscope-status');
        
        // Make the whole element visible
        microscopeWrapper.classList.add('visible');
        
        // Add click listener to toggle the microscope state
        magnifyingGlass.addEventListener('click', () => {
            const body = document.body;
            microscopeWrapper.classList.toggle('active');
            body.classList.toggle('microscope-active');

            if (microscopeWrapper.classList.contains('active')) {
                statusText.textContent = 'ON';
                // Force custom cursor on and clear any emoji
                customCursor.textContent = '';
                body.classList.add('custom-cursor-active');
                customCursor.style.display = 'block';
            } else {
                statusText.textContent = 'OFF';
                // Revert to user's chosen cursor theme
                applyCursorTheme(localStorage.getItem('cursorTheme') || 'default');
            }
        });
    }

    // New function to handle jumbling the clue text
    function jumbleClueText() {
        document.querySelectorAll('.jumbled-clue').forEach(clueElement => {
            if (clueElement.hasChildNodes()) return; // Already jumbled

            const clue = clueElement.dataset.clue;
            const letters = clue.split('');
            const jumbleChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';

            clueElement.innerHTML = ''; // Clear it

            letters.forEach(originalChar => {
                const span = document.createElement('span');
                const randomChar = jumbleChars[Math.floor(Math.random() * jumbleChars.length)];
                span.textContent = randomChar;
                span.dataset.char = originalChar; // Store the original character
                span.dataset.jumble = randomChar; // Store the jumbled character
                span.style.setProperty('--rot', `${Math.random() * 40 - 20}deg`);
                span.style.setProperty('--x', `${Math.random() * 6 - 3}px`);
                span.style.setProperty('--y', `${Math.random() * 6 - 3}px`);
                clueElement.appendChild(span);
            });
        });
        
        // Also jumble sender IP clues
        document.querySelectorAll('.sender-ip-clue').forEach(clueElement => {
            if (clueElement.hasChildNodes()) return; // Already jumbled

            const ip = clueElement.dataset.ip;
            const letters = ip.split('');
            const jumbleChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';

            clueElement.innerHTML = ''; // Clear it

            letters.forEach(originalChar => {
                const span = document.createElement('span');
                const randomChar = jumbleChars[Math.floor(Math.random() * jumbleChars.length)];
                span.textContent = randomChar;
                span.dataset.char = originalChar; // Store the original character
                span.dataset.jumble = randomChar; // Store the jumbled character
                span.style.setProperty('--rot', `${Math.random() * 40 - 20}deg`);
                span.style.setProperty('--x', `${Math.random() * 6 - 3}px`);
                span.style.setProperty('--y', `${Math.random() * 6 - 3}px`);
                clueElement.appendChild(span);
            });
        });
    }

    // Function to generate a reply body
    function generateReplyBody(originalEmail, userName) {
        let replyBodyContent = '';
        const senderFirstName = originalEmail.sender.split(',')[0].trim();

        if (originalEmail.id === 'welcome-email') {
            replyBodyContent = `
Wow, thanks for the super-secret welcome, ${senderFirstName}! I'm SO ready to put on my detective hat and dive into this mystery. Consider this case... ON!
`;
        } else if (originalEmail.folder === 'spam') {
            const spamResponses = [
                `My pet squirrel, Nutsy, handles all my banking. He says "Nuts to you!"`,
                `Sorry, I'm currently on a mission to find the world's largest rubber duck. Priorities, you know!`,
                `My fortune is tied up in a cheese-of-the-month club. Top secret stuff, can't discuss!`,
                `Your email caused my teacup pig to faint from excitement. Please send a less enthusiastic email next time.`,
            ];
            replyBodyContent = spamResponses[Math.floor(Math.random() * spamResponses.length)];
        } else {
            replyBodyContent = `
Got it! On the case!
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
        // Update folder header
        emailListFolderHeader.textContent = folder.charAt(0).toUpperCase() + folder.slice(1); // Capitalize first letter

        const filteredEmails = emails.filter(email => email.folder === folder);
        if (filteredEmails.length > 0) {
            // Sort emails by precise timestamp in descending order (latest on top)
            filteredEmails.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            filteredEmails.forEach(email => {
                const emailItem = renderEmailItem(email);
                
                // Always add pulsation to the read legal-email when it's rendered
                if (email.id === 'legal-email' && email.read) {
                    const deleteButton = emailItem.querySelector('.delete-email-item-btn');
                    if (deleteButton) {
                        deleteButton.classList.add('delete-nudge-active');
                    }
                }

                emailListDiv.appendChild(emailItem);
            });

            // Select the first email in the sorted list
            const firstEmailToSelect = filteredEmails.find(email => !email.read) || filteredEmails[0];
            if (firstEmailToSelect) {
                const correspondingEmailItem = emailListDiv.querySelector(`[data-email-id="${firstEmailToSelect.id}"]`);
                if (correspondingEmailItem) {
                    handleEmailDisplay(firstEmailToSelect, correspondingEmailItem);
                }
            }
        } else {
            emailListDiv.innerHTML = '<div class="email-list-placeholder">No emails in this folder.</div>';
            emailBodyContentDiv.innerHTML = '<div class="email-content-placeholder">Select an email to view its content</div>'; // Ensure content placeholder is always there for empty folder
        }
    }

    function handleEmailDisplay(email, emailItem) {
        // Stop any existing pulses when a new email is selected, unless it's for the current read-only email
        document.querySelectorAll('.delete-email-item-btn').forEach(btn => {
            if (btn.dataset.emailId !== email.id) {
                btn.classList.remove('delete-nudge-active');
            }
        });

        displayEmailContent(email);

        // Remove 'active' class from all email items and add to clicked one
        document.querySelectorAll('.email-item').forEach(el => el.classList.remove('active'));
        emailItem.classList.add('active');

        // Start pulsation timer on the first time a read-only email is displayed
        if (email.emailType === 'readOnly' && !email.read) {
            const deleteButton = emailItem.querySelector('.delete-email-item-btn');
            if (deleteButton) {
                setTimeout(() => {
                    deleteButton.classList.add('delete-nudge-active');
                }, 5000);
            }
        }
        // Pulsate install button if it's the IT email and not installed
        if (email.id === 'it-support-email' && !email.replied) {
            const installBtn = document.getElementById('install-tool-btn');
            if (installBtn) {
                installBtn.classList.add('install-btn-pulsate');
            }
        }

        // After displaying, jumble any clues in the email body
        jumbleClueText();

        // Mark as read and update badge (will only run once thanks to the check)
        if (!email.read) {
            email.read = true;
            emailItem.classList.remove('unread');
            refreshUnreadCounts();
        }
    }

    function setActiveFolder(folderId) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(nav => nav.classList.remove('active'));
        const activeNavItem = document.getElementById(`${folderId}-nav`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    }

    // --- Email Delivery Logic ---

    // Function to deliver Jane's welcome email
    function deliverWelcomeEmail() {
        const welcomeEmail = { ...welcomeEmailTemplate };
        const now = new Date();
        welcomeEmail.date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        welcomeEmail.receivedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        welcomeEmail.timestamp = now.getTime(); // Precise timestamp for sorting
        
        emails.push(welcomeEmail);
        refreshUnreadCounts();
        // If user is in inbox (which they will be), refresh the view
        if (currentFolder === 'inbox') {
            loadEmailsForFolder('inbox');
        }
    }

    // Function to deliver the next story email after a random delay
    function deliverNextStoryEmail() {
        if (nextStoryEmailIndex < storyEmailsQueue.length) {
            const nextEmail = { ...storyEmailsQueue[nextStoryEmailIndex] };
            const now = new Date();
            nextEmail.date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            nextEmail.receivedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            nextEmail.timestamp = now.getTime(); // Precise timestamp for sorting
            emails.push(nextEmail);
            refreshUnreadCounts(); // Update notification badge without changing folder
            // If user is currently in the inbox, refresh the view to show the new email
            if (currentFolder === 'inbox') {
                loadEmailsForFolder('inbox');
            }
            nextStoryEmailIndex++;
        }
    }

    function startSpamCascade() {
        if (spamCascadeInterval) clearInterval(spamCascadeInterval); // Stop any existing cascade

        // 1. Deliver the first, non-random spam email.
        const firstSpam = { ...spamEmail1Template };
        const now = new Date();
        firstSpam.id = `spam-cascade-${now.getTime()}`;
        firstSpam.date = now.toLocaleString('en-US', { month: 'short', day: 'numeric' });
        firstSpam.receivedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        firstSpam.timestamp = now.getTime();
        emails.push(firstSpam);
        refreshUnreadCounts();
        if (currentFolder === 'inbox') {
            loadEmailsForFolder('inbox');
        }

        // 2. Initialize the pool for the *rest* of the spam.
        const allSpamTemplates = [spamEmail2Template, spamEmail3Template, spamEmail4Template, spamEmail5Template];
        availableSpamTemplates = [...allSpamTemplates];

        // 3. Start the interval for the subsequent random emails.
        spamCascadeInterval = setInterval(deliverRandomSpam, 15000);
    }
    
    function deliverRandomSpam() {
        // If we've run out of unique spam, stop the cascade.
        if (availableSpamTemplates.length === 0) {
            if (spamCascadeInterval) {
                clearInterval(spamCascadeInterval);
                spamCascadeInterval = null;
            }
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableSpamTemplates.length);
        const [selectedTemplate] = availableSpamTemplates.splice(randomIndex, 1); // Pick and remove from pool

        const newSpamEmail = { ...selectedTemplate };
        const now = new Date();

        newSpamEmail.id = `spam-cascade-${now.getTime()}`; // Unique ID
        newSpamEmail.date = now.toLocaleString('en-US', { month: 'short', day: 'numeric' });
        newSpamEmail.receivedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        newSpamEmail.timestamp = now.getTime();
        
        emails.push(newSpamEmail);
        refreshUnreadCounts();
        if (currentFolder === 'inbox') {
            loadEmailsForFolder('inbox');
        }
    }

    function generateITEmailBody(consequence) {
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
        } else { // 'scam' consequence - this path is currently not taken but kept for future
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

    function deliverITSupportEmail(consequence) {
        const itEmail = { ...itSupportEmailTemplate };
        const now = new Date();
        itEmail.date = now.toLocaleString('en-US', { month: 'short', day: 'numeric' });
        itEmail.receivedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        itEmail.timestamp = now.getTime(); // Precise timestamp for sorting
        itEmail.body = generateITEmailBody(consequence); // Generate body based on user action
        
        emails.push(itEmail);
        refreshUnreadCounts();
        if (currentFolder === 'inbox') {
            loadEmailsForFolder('inbox');
        }
    }

    function deliverRDEmail() {
        const rdEmail = { ...rdEmailTemplate };
        const now = new Date();
        rdEmail.date = now.toLocaleString('en-US', { month: 'short', day: 'numeric' });
        rdEmail.receivedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        rdEmail.timestamp = now.getTime();
        
        emails.push(rdEmail);
        refreshUnreadCounts();
        if (currentFolder === 'inbox') {
            loadEmailsForFolder('inbox');
        }
    }

    // Reply email functionality
    function handleReplyClick() {
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
        sendPromptElement = document.createElement('p');
        sendPromptElement.id = 'send-prompt';
        sendPromptElement.textContent = 'Press Enter to send';
        sendPromptElement.style.display = 'none'; // Initially hidden
        replyInterfaceContainer.appendChild(sendPromptElement);
        
        sendReplyBtn = document.createElement('button');
        sendReplyBtn.id = 'send-reply-btn';
        sendReplyBtn.textContent = 'Send';
        sendReplyBtn.style.display = 'none'; // Initially hidden
        replyInterfaceContainer.appendChild(sendReplyBtn);

        const sendReplyHandler = function() {
            sendReplyBtn.removeEventListener('click', sendReplyHandler);
            document.removeEventListener('keydown', enterSendHandler);
            
            replyInterfaceContainer.remove(); // Remove from DOM after use

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
            
            // Trigger next story email 3 seconds after replying to Jane's welcome email
            if (originalEmail.id === 'welcome-email') {
                setTimeout(deliverNextStoryEmail, 3000);
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
    }

    // Settings menu and Dark Mode functionality
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    // Custom cursor elements
    const cursorOptions = document.querySelectorAll('.cursor-option');
    const customCursor = document.getElementById('custom-cursor');
    let currentCursorTheme = 'default';

    // Cursor theme emojis
    const cursorEmojis = {
        'default': '🖱️',
        'magnifying-glass': '🔍'
    };

    // Function to apply cursor theme
    function applyCursorTheme(theme) {
        // Prevent changing theme while microscope is active to avoid conflicts
        if (document.body.classList.contains('microscope-active')) {
            showCustomPrompt('Deactivate the Digital Microscope to change your cursor.', 'alert');
            return;
        }

        currentCursorTheme = theme;
        
        // Update active state on cursor options
        cursorOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.cursor === theme) {
                option.classList.add('active');
            }
        });

        if (theme === 'default') {
            // Use default cursor
            body.classList.remove('custom-cursor-active');
            customCursor.style.display = 'none';
        } else {
            // Use custom cursor
            body.classList.add('custom-cursor-active');
            customCursor.style.display = 'block';
            customCursor.textContent = cursorEmojis[theme];
        }
        
        localStorage.setItem('cursorTheme', theme);
    }

    // Mouse move handler for custom cursor
    function handleMouseMove(e) {
        // If the custom cursor element is visible for any reason, it should follow the mouse.
        if (customCursor.style.display === 'block') {
            customCursor.style.left = e.clientX + 'px';
            customCursor.style.top = e.clientY + 'px';

            // Handle lens-based reveal effect
            if (document.body.classList.contains('microscope-active')) {
                const lensRadius = 45; // Half of the cursor's width/height
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
                
                // Handle sender IP reveals (letter by letter)
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
            }
        }
    }

    function setupEventListeners() {
        // Handle navigation item clicks
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const folder = item.id.replace('-nav', ''); // Get folder name from ID
                setActiveFolder(folder);
                loadEmailsForFolder(folder);
            });
        });

        // Settings Menu Listeners
        settingsBtn.addEventListener('click', () => settingsMenu.style.display = 'flex');
        closeSettingsBtn.addEventListener('click', () => settingsMenu.style.display = 'none');
        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
            }
        });
        cursorOptions.forEach(option => {
            option.addEventListener('click', () => {
                applyCursorTheme(option.dataset.cursor);
            });
        });

        // Reply button main listener
        replyEmailBtn.addEventListener('click', handleReplyClick);
    }

    function initializeGame(userName) {
        container.style.display = 'grid'; // Show the email client
        introScreen.style.display = 'none'; // Hide the intro letter

        // Set user name
        const formattedName = userName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        localStorage.setItem('outcrookUserName', formattedName);
        userProfile.textContent = `Detective ${formattedName}`;

        // Setup Event Listeners, timers, and initial load
        setInterval(updateCurrentTime, 1000);
        updateCurrentTime();
        
        setupEventListeners();
        
        loadEmailsForFolder(currentFolder); // Load initially empty inbox
        refreshUnreadCounts();

        // Load preferences
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            document.getElementById('dark-mode-toggle').checked = true;
        }
        const savedCursorTheme = localStorage.getItem('cursorTheme') || 'default';
        applyCursorTheme(savedCursorTheme);
        document.addEventListener('mousemove', handleMouseMove);

        // Deliver Jane's email after 3 seconds
        setTimeout(deliverWelcomeEmail, 3000);
    }

    // --- Compose Email Logic ---
    const composeModalOverlay = document.getElementById('compose-modal-overlay');
    const composeBtn = document.querySelector('.compose-btn');
    const closeComposeBtn = document.getElementById('close-compose-btn');
    const sendComposeBtn = document.getElementById('send-compose-btn');
    const composeTo = document.getElementById('compose-to');
    const composeSubject = document.getElementById('compose-subject');
    const composeBody = document.getElementById('compose-body-text');

    function openComposeModal() {
        if (storyContacted) {
            showCustomPrompt("You've already followed up on your lead.", 'alert');
            return;
        }
        
        // Remove pulsation when opening compose
        const composeBtn = document.querySelector('.compose-btn');
        if (composeBtn) {
            composeBtn.classList.remove('compose-nudge-active');
        }
        
        // Populate the dropdown with random names
        composeTo.innerHTML = '<option value="">Select a contact...</option>';
        randomNames.forEach(name => {
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

    function closeComposeModal() {
        composeModalOverlay.style.display = 'none';
    }

    function handleSendCompose() {
        if (composeTo.value.toLowerCase() === 'alex chen' && composeSubject.value) {
            const userName = localStorage.getItem('outcrookUserName') || 'User';
            const sentEmail = {
                id: `composed-${Date.now()}`,
                sender: `${userName}, Special Investigator`,
                subject: composeSubject.value,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                body: `<pre>${composeBody.textContent}</pre>`,
                folder: 'sent',
                read: true,
                receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date().getTime()
            };
            emails.push(sentEmail);
            storyContacted = true; // Mark Alex as contacted
            closeComposeModal();
            loadEmailsForFolder('inbox'); // Stay in inbox instead of switching to sent
            
            // Trigger Alex's reply after a delay
            setTimeout(deliverAlexReply, 4000);
        } else {
            showCustomPrompt("Your 'To' field seems incorrect or the subject is empty. Are you contacting the right person?", 'alert');
        }
    }
    
    // Random names list for compose
    const randomNames = [
        'Alex Chen', 'Sarah Johnson', 'Mike Rodriguez', 'Emma Thompson', 'David Kim',
        'Lisa Wang', 'James Wilson', 'Maria Garcia', 'Robert Brown', 'Jennifer Lee',
        'Christopher Davis', 'Amanda Taylor', 'Michael Anderson', 'Jessica Martinez',
        'Daniel White', 'Ashley Thomas', 'Matthew Jackson', 'Samantha Harris',
        'Andrew Clark', 'Nicole Lewis'
    ];

    // Auto-populate logic for the keyword puzzle
    composeTo.addEventListener('change', () => {
        if (storyContacted) return;

        if (composeTo.value.toLowerCase() === 'alex chen') {
            composeSubject.readOnly = true;
            composeSubject.value = 'A Quick Question';
            
            const userName = localStorage.getItem('outcrookUserName') || 'User';
            const alexEmailBody = `Hi Alex,

I'm the special investigator looking into the recent security incident. I was hoping you could shed some light on the computer hiccups from last month.

Any information would be a great help.

Best,
Detective ${userName}`;

            // Setup interactive typing
            composeBody.innerHTML = ''; // Clear the area
            const typePrompt = document.createElement('p');
            typePrompt.classList.add('flashing-text');
            typePrompt.style.cssText = 'position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); font-size: 0.9em;';
            typePrompt.textContent = 'Press any key to start typing...';
            composeBody.appendChild(typePrompt);

            const startTypingListener = (event) => {
                if (!event.metaKey && !event.ctrlKey) {
                    typePrompt.remove();
                    document.removeEventListener('keydown', startTypingListener);
                    simulateTyping(composeBody, alexEmailBody, 15, () => {
                        sendComposeBtn.disabled = false;
                    });
                }
            };
            document.addEventListener('keydown', startTypingListener);

        } else {
            composeSubject.readOnly = false;
            composeSubject.value = '';
        }
    });

    // A lightweight init function to set up the intro screen listeners
    function init() {
        // ... existing code ...
        // Connect event listeners for the compose modal
        composeBtn.addEventListener('click', openComposeModal);
        closeComposeBtn.addEventListener('click', closeComposeModal);
        sendComposeBtn.addEventListener('click', handleSendCompose);
    }

    init(); // Run the setup

    startGameBtn.addEventListener('click', () => {
        const userName = nameInput.value;
        if (userName && userName.trim().length > 0) {
            initializeGame(userName);
        } else {
            nameInput.classList.add('input-error');
        }
    });

    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            startGameBtn.click();
        }
    });

    nameInput.addEventListener('input', () => {
        if (nameInput.classList.contains('input-error')) {
            nameInput.classList.remove('input-error');
        }

        const placeholder = document.getElementById('placeholder-flash');
        if (nameInput.value.length > 0) {
            placeholder.style.display = 'none';
        } else {
            placeholder.style.display = 'block';
        }
    });

    function deliverAlexReply() {
        const alexReplyTemplate = {
            id: 'alex-reply-email',
            sender: 'Alex Chen, Junior Researcher',
            subject: 'Re: A Quick Question',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            body: `
                <h3>Response to Your Inquiry</h3>
                <p>Detective,</p>
                <p>I received your email about the "computer hiccups" last month. I'm not sure what you're referring to specifically.</p>
                <p>Our systems have been running normally. I haven't noticed any unusual activity or access patterns. I work standard hours and follow all security protocols.</p>
                <p>If there were any issues, I'm sure IT would have documented them properly. I have nothing to hide and nothing to add to your investigation.</p>
                <p>Alex Chen<br>Junior Researcher, R&D</p>
            `,
            folder: 'inbox',
            read: false,
            replied: false,
            emailType: 'multipleChoice',
            replyOptions: [
                { text: "What about the midnight server access on September 15th?", consequence: 'pressure' },
                { text: "Can you explain the unusual login patterns?", consequence: 'technical' },
                { text: "I have evidence of your unauthorized access.", consequence: 'confrontation' }
            ],
            receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().getTime()
        };
        
        emails.push(alexReplyTemplate);
        refreshUnreadCounts();
        if (currentFolder === 'inbox') {
            loadEmailsForFolder('inbox');
        }
        
        // Trigger HR email after 8 seconds
        setTimeout(() => {
            const hrEmail = {
                id: 'hr-email',
                sender: 'Patricia Wells, HR Director',
                subject: 'Personnel Update - Alex Chen',
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                body: `
                    <h3>Internal HR Notice</h3>
                    <p>Detective,</p>
                    <p>Following up on your investigation, I've reviewed Alex Chen's personnel file. Some concerning details emerged:</p>
                    <p>Alex applied for the Senior R&D position three times over the past year. Each time, we promoted someone else. Her last rejection was particularly bitter - she stormed out of my office saying "You'll regret this decision."</p>
                    <p>She's been increasingly vocal about "unfair treatment" in team meetings. Several colleagues have reported her hostile attitude toward management.</p>
                    <p>Given her access to sensitive projects and this pattern of behavior, I thought you should know.</p>
                    <p>Patricia Wells<br>HR Director</p>
                `,
                folder: 'inbox',
                read: false,
                replied: false,
                emailType: 'readOnly',
                receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date().getTime()
            };
            
            emails.push(hrEmail);
            refreshUnreadCounts();
            if (currentFolder === 'inbox') {
                loadEmailsForFolder('inbox');
            }
            
            // Don't pulsate compose button here - will happen after magnifier reveals "Alex"
            
            // Trigger CEO email after 5 seconds
            setTimeout(() => {
                const ceoEmail = {
                    id: 'ceo-email',
                    sender: 'Richard "Dick" Thompson, CEO',
                    subject: 'How\'s the Detective Work Going?',
                    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    body: `
                        <h3>Detective Update Request</h3>
                        <p>Hey Detective <span id="ceo-user-name"></span>!</p>
                        <p>Just checking in on your investigation! Eleanor mentioned you're looking into some "recipe theft" situation? Sounds like quite the mystery!</p>
                        <p>I have to say, I'm not really sure how someone could steal a recipe. I mean, it's just ingredients mixed together, right? How hard can it be to figure out what goes in a snack?</p>
                        <p>Anyway, keep me posted! I'm sure you'll crack this case wide open. Maybe check if anyone's been acting suspiciously? Like, wearing sunglasses indoors or something?</p>
                        <p>Best of luck!</p>
                        <p>Dick Thompson<br>CEO (and amateur detective enthusiast)</p>
                    `,
                    folder: 'inbox',
                    read: false,
                    replied: false,
                    emailType: 'readOnly',
                    receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    timestamp: new Date().getTime()
                };
                
                emails.push(ceoEmail);
                refreshUnreadCounts();
                if (currentFolder === 'inbox') {
                    loadEmailsForFolder('inbox');
                }
            }, 5000);
        }, 8000);
    }

    // Make function global for external access
    window.deliverAlexReply = deliverAlexReply;
});


