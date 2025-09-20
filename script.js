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
                subject: 'Your Super-Secret Detective Mission Starts NOW!',
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
                receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            };
            emails.push(welcomeEmail);

        } else {
            userProfile.textContent = `Detective ${userName}`;
            loadEmailsForFolder('inbox');
            refreshUnreadCounts();
        }
    }

    // Eleanor Vance's email (initial email)
    const initialLegalEmail = {
        id: 'legal-email',
        sender: 'Eleanor Vance, Chief Legal Officer',
        subject: 'Uh-oh! TasteBuds Stole Our Yummy Secret!',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Emergency! Our Secret Recipe is Out!</h3>
            <p>Dear Detective,</p>
            <p>CODE RED! Our top-secret "TasteBlast" recipe has been SWIPED by those sneaky TasteBuds! They launched an identical product, and we're not happy campers. We need a super sleuth like you to find out WHO, WHAT, and HOW!</p>
            <p>Your mission, should you choose to accept it, is to gather rock-solid evidence. No flimsy theories! We need facts to take them down in court. The fate of FlavorCo's snacks rests on your investigative shoulders!</p>
            <p>Keep your ear to the ground and your magnifying glass handy. Report back with juicy findings!</p>
            <p>Eleanor Vance<br>Chief Legal Officer (and Head of Snack Protection)</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false,
        receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    emails.push(initialLegalEmail);

    getUserName();

    // Function to display current time
    function updateCurrentTime() {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        currentTimeSpan.textContent = now.toLocaleTimeString('en-US', options);
    }

    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // Creative spam emails - these will be dynamically pushed later based on story progression, not on initial load
    const spamEmail1Template = {
        id: 'spam-email-1',
        sender: 'TotallyLegitBank',
        subject: 'Your Bank Account is Doing the Macarena! Fix it NOW!',
        date: new Date(2025, 8, 10).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>URGENT! Your Money is on the Loose!</h3>
            <p>Oh no! We've detected your bank account doing the Macarena with some suspicious characters! To stop it from dancing away with all your coins, click this super safe (pinky swear!) link IMMEDIATELY:</p>
            <p><a href="#" onclick="alert('Nice try! This is spam.'); return false;">Bring My Money Home!</a></p>
            <p>If you don't, your account will be turned into a pumpkin. Don't say we didn't warn you!</p>
            <p>Sincerely,</p>
            <p>The Totally Legit Bank (we're totally not a bunch of squirrels in a trench coat)</p>
        `,
        folder: 'spam',
        read: false,
        receivedTime: new Date(2025, 8, 10, 9, 30).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const spamEmail2Template = {
        id: 'spam-email-2',
        sender: 'Nigerian Prince (via secure channel)',
        subject: 'Prince Needs YOUR Help (and Your Gold Coins!)',
        date: new Date(2025, 8, 8).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Royal Plea from Prince Akeem!</h3>
            <p>Hark, noble friend! Prince Akeem of the Sparkling Sands needs your mighty assistance! I have a colossal pile of shiny gold coins (like, 50 MILLION of them!) that need a new comfy home. And YOU, my friend, are the chosen one!</p>
            <p>Just a teeny-tiny fee (for royal paperwork, you understand) and your bank details, and BAM! You'll be swimming in riches! Don't miss this once-in-a-lifetime chance to be best friends with a prince!</p>
            <p>Your Royal Buddy,</p>
            <p>Prince Akeem (I also have a really fast camel)</p>
        `,
        folder: 'spam',
        read: false,
        receivedTime: new Date(2025, 8, 8, 14, 0).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    // Story emails - Phase 1: Initial Investigation & Departmental Insights - these will be dynamically pushed later
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
        receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const rdEmailTemplate = {
        id: 'rd-email',
        sender: 'Dr. Aris Thorne, Head of R&D',
        subject: 'Our Secret Recipe is GONE! Lab on Lockdown!',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Recipe Heist! R&D is a Mess!</h3>
            <p>Attention All! (Especially Detective!)</p>
            <p>Our precious "TasteBlast" formula has vanished into thin air! TasteBuds' new product is proof! We need a full-scale investigation into our lab. Every beaker, every test tube, every… sniff… must be checked!</p>
            <p>And speaking of sniffs, I recall a certain "Alex" (our junior researcher) grumbling about promotions and secret files. Could it be a clue? Find out who took our delicious secrets!</p>
            <p>Panicked but Scientific,</p>
            <p>Dr. Aris Thorne<br>Head of R&D (currently wearing a tin-foil hat)</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false,
        receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const itSecurityEmailTemplate = {
        id: 'it-security-email',
        sender: 'IT Security Automated Alert',
        subject: 'RED ALERT! Our Data Took a Midnight Sneak-Out!',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Unauthorized Data Fun!</h3>
            <p><strong>System Alert:</strong> FlavorCo Network</p>
            <p><strong>DANGER Level:</strong> HIGH (like, really high!)</p>
            <p><strong>Incident:</strong> Our super-secret "TasteBlast" files went on an unauthorized midnight stroll! Data zoomed out from IP (192.168.1.107) to some shady server during prime dreaming hours (02:30 AM PST)!</p>
            <p><strong>Status:</strong> We've locked the digital doors, but the cat's out of the bag (and the data's out of the server!). Detective, we need you to find the cyber-culprit behind this digital heist!</p>
            <p>Bleep-bloop,</p>
            <p>Automated System Message (and a very worried server rack)</p>
        `,
        folder: 'inbox',
        read: false,
        replied: false,
        receivedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

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

        // Create a new container for the reply interface elements
        const replyInterfaceContainer = document.createElement('div');
        replyInterfaceContainer.id = 'reply-interface-container';
        replyInterfaceContainer.style.display = 'flex'; // Use flex for layout of its children
        replyInterfaceContainer.style.flexDirection = 'column';

        // Clear emailBodyContentDiv and prepare for reply interface
        emailBodyContentDiv.innerHTML = `
            <h3>Replying to: ${originalEmail.subject}</h3>
            <div id="reply-typing-area" style="border: 1px solid #ccc; padding: 10px; min-height: 100px; white-space: pre-wrap; position: relative; user-select: none;"></div>
        `;
        replyEmailBtn.style.display = 'none'; // Hide original reply button

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

        // Append the new reply interface container to emailContentDiv, AFTER emailBodyContentDiv
        emailContentDiv.appendChild(replyInterfaceContainer);


        const sendReplyHandler = function() {
            sendReplyBtn.removeEventListener('click', sendReplyHandler);
            document.removeEventListener('keydown', enterSendHandler);
            
            replyInterfaceContainer.style.display = 'none'; // Hide the entire reply interface
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

    // Cursor theme elements
    const cursorThemeSelect = document.getElementById('cursor-theme-select');

    // Function to apply cursor theme
    function applyCursorTheme(theme) {
        body.classList.remove('cursor-magnifying-glass', 'cursor-fingerprint');
        if (theme === 'magnifying-glass') {
            body.classList.add('cursor-magnifying-glass');
        } else if (theme === 'fingerprint') {
            body.classList.add('cursor-fingerprint');
        }
        localStorage.setItem('cursorTheme', theme);
    }

    // Load dark mode preference from localStorage
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    // Load cursor theme preference from localStorage
    const savedCursorTheme = localStorage.getItem('cursorTheme') || 'default';
    cursorThemeSelect.value = savedCursorTheme;
    applyCursorTheme(savedCursorTheme);

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

    // Change cursor theme
    cursorThemeSelect.addEventListener('change', (event) => {
        applyCursorTheme(event.target.value);
    });
});


