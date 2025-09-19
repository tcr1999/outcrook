document.addEventListener('DOMContentLoaded', () => {
    const emailItems = document.querySelectorAll('.email-item');
    const emailContent = document.querySelector('.email-content');
    const userProfile = document.getElementById('user-profile');

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

    const welcomeEmail = {
        sender: 'HR/People Officer',
        subject: 'Welcome to Outcrook - Your Onboarding as a Detective',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        body: `
            <h3>Welcome to the Outcrook Team!</h3>
            <p>Dear Detective <span id="welcome-user-name"></span>,</p>
            <p>A warm welcome to Outcrook! We're thrilled to have you join our esteemed team. Your unique skills and perspective are highly valued as we embark on a new era of corporate integrity.</p>
            <p>Your role here will be pivotal in ensuring transparency and uncovering any… anomalies that may arise within our organizational structure. Consider this your first confidential assignment: familiarize yourself with our systems, observe, and report anything that seems out of place.</p>
            <p>Your journey to uncover the truth begins now. We trust you'll uphold our values with the utmost discretion and diligence.</p>
            <p>Best regards,</p>
            <p>The Outcrook HR/People Officer</p>
        `
    };

    const emailListDiv = document.querySelector('.email-list');
    const emailContentDiv = document.querySelector('.email-content');

    function renderEmailItem(email) {
        const emailItem = document.createElement('div');
        emailItem.classList.add('email-item');
        emailItem.innerHTML = `
            <div class="email-sender">${email.sender}</div>
            <div class="email-subject">${email.subject}</div>
            <div class="email-date">${email.date}</div>
        `;
        emailItem.addEventListener('click', () => {
            displayEmailContent(email);
            // Remove 'active' class from all email items and add to clicked one
            document.querySelectorAll('.email-item').forEach(el => el.classList.remove('active'));
            emailItem.classList.add('active');
        });
        return emailItem;
    }

    function displayEmailContent(email) {
        emailContentDiv.innerHTML = email.body;
        const welcomeUserNameSpan = document.getElementById('welcome-user-name');
        if (welcomeUserNameSpan) {
            welcomeUserNameSpan.textContent = localStorage.getItem('outcrookUserName') || 'User';
        }
    }

    // Initial load: Add welcome email
    const welcomeItem = renderEmailItem(welcomeEmail);
    emailListDiv.appendChild(welcomeItem);
    welcomeItem.classList.add('active'); // Select it by default
    displayEmailContent(welcomeEmail);

    // Handle navigation item clicks
    const navItems = document.querySelectorAll('.nav-item');
    const emailListFolderHeader = document.getElementById('email-list-folder-header');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active')); // Remove active from all
            item.classList.add('active'); // Add active to clicked
            emailListFolderHeader.textContent = item.textContent; // Update header

            // For now, we only have the welcome email. In the future, this is where you'd load emails for each folder.
            if (item.id === 'inbox-nav') {
                // Display inbox emails
                emailListDiv.innerHTML = ''; // Clear current emails
                emailListDiv.appendChild(renderEmailItem(welcomeEmail));
                displayEmailContent(welcomeEmail);
            } else {
                // For other folders, clear emails and content for now
                emailListDiv.innerHTML = '<div style="padding: 15px;">No emails in this folder.</div>';
                emailContentDiv.innerHTML = '<h3 style="padding: 15px;">Select an email to view its content</h3>';
            }
        });
    });

    // Original email item click handling (now less relevant as emails are dynamic)
    emailItems.forEach(item => {
        item.addEventListener('click', () => {
            // In a real game, this would load dynamic content based on the email.
            // For now, we'll just update with a generic message.
            emailContent.innerHTML = `
                <h3>Email Subject (Dynamic)</h3>
                <p>This is the content of the email you clicked. Imagine exciting game narrative here!</p>
                <p>From: Sender Name (Dynamic)</p>
                <p>Date: August 15, 2025</p>
            `;

            // Remove 'active' class from all email items
            emailItems.forEach(el => el.classList.remove('active'));
            // Add 'active' class to the clicked email item
            item.classList.add('active');
        });
    });
});
