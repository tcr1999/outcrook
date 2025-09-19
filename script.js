document.addEventListener('DOMContentLoaded', () => {
    const emailItems = document.querySelectorAll('.email-item');
    const emailContent = document.querySelector('.email-content');

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
