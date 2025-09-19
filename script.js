document.addEventListener('DOMContentLoaded', () => {
    const emailContentDiv = document.querySelector('.email-content');
    const userProfile = document.getElementById('user-profile');
    const emailListDiv = document.querySelector('.email-list');
    const emailListFolderHeader = document.getElementById('email-list-folder-header');
    const deleteEmailBtn = document.getElementById('delete-email-btn');

    let emails = [];
    let currentFolder = 'inbox';

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
        read: false
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
        emailContentDiv.innerHTML = `
            <h3>${email.subject}</h3>
            <p>From: ${email.sender}</p>
            <p>Date: ${email.date}</p>
            <hr>
            <div>${email.body}</div>
        `;

        const welcomeUserNameSpan = emailContentDiv.querySelector('#welcome-user-name');
        if (welcomeUserNameSpan) {
            welcomeUserNameSpan.textContent = localStorage.getItem('outcrookUserName') || 'User';
        }
    }

    function loadEmailsForFolder(folder) {
        emailListDiv.innerHTML = ''; // Clear current emails
        emailContentDiv.innerHTML = '<h3 style="padding: 15px;">Select an email to view its content</h3>';
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

    // Remove old delete email functionality
    // deleteEmailBtn.addEventListener('click', () => {
    //     const emailIdToDelete = deleteEmailBtn.dataset.emailId;
    //     const emailIndex = emails.findIndex(email => email.id === emailIdToDelete);
    //     if (emailIndex > -1) {
    //         emails[emailIndex].folder = 'trash'; // Move to trash
    //         emails[emailIndex].read = true; // Mark as read when moved to trash
    //         loadEmailsForFolder(currentFolder); // Re-load current folder
    //         refreshUnreadCounts();
    //     }
    // });
});
