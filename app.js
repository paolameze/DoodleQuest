// 1. SUPABASE CONNECTION (Global so all functions can use it)
const SUPABASE_URL = 'https://agvjkooyrdvyllwwcnqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndmprb295cmR2eWxsd3djbnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NTc1NTQsImV4cCI6MjEwNzIzMzU1NH0.RSxj5Yzxt0uhZtWsmLga8DWtlY5KlSUv0f-s5X6pmdY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. PAGE LOAD LISTENER (Attaches clicks when the page opens)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(button => {
        button.addEventListener('click', () => {
            const viewName = button.getAttribute('data-view');
            switchView(viewName);
        });
    });

    // Load feed automatically on initial page load
    fetchTickets();
});

// 3. TAB SWITCHING LOGIC
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    if (viewName === 'feed') {
        document.getElementById('feedView').classList.add('active');
        document.getElementById('btn-feed').classList.add('active');
        fetchTickets();
    } else if (viewName === 'tickets') {
        document.getElementById('ticketsView').classList.add('active');
        document.getElementById('btn-tickets').classList.add('active');
        fetchMyTickets();
    } else if (viewName === 'create') {
        document.getElementById('createView').classList.add('active');
        document.getElementById('btn-create').classList.add('active');
    } else if (viewName === 'profile') {
        document.getElementById('profileView').classList.add('active');
        document.getElementById('btn-profile').classList.add('active');
    }
}

// 4. DATABASE FUNCTIONS
async function fetchTickets() {
    const feedContainer = document.getElementById('ticketsFeed');
    feedContainer.innerHTML = '<p style="color: #888; text-align: center;">Loading...</p>';

    let { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        feedContainer.innerHTML = `<p style="color: red; text-align: center;">Error loading database: ${error.message}</p>`;
        return;
    }

    if (tickets.length === 0) {
        feedContainer.innerHTML = '<p style="color: #888; text-align: center;">No tickets found. Create one using the sidebar!</p>';
        return;
    }

    feedContainer.innerHTML = '';
    tickets.forEach(ticket => {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.innerHTML = `
            <div class="card-header">
                <div class="user-info">
                    <img src="avatar.png" alt="Avatar" class="avatar-img">
                    <span>${ticket.creator_name || '@user'}</span>
                </div>
                <span class="difficulty-badge">${ticket.difficulty || 'Easy'}</span>
            </div>
            <div class="card-body">
                <h3 style="font-size: 15px; color: #333; margin-bottom: 5px;">${ticket.title}</h3>
                <p>${ticket.description}</p>
            </div>
            ${ticket.reference_image_url ? `<div class="card-image-box"><img src="${ticket.reference_image_url}" /></div>` : ''}
            <div class="card-actions">
                <span style="font-size: 13px; color: #888;">Open Request</span>
                <button class="btn-join" onclick="alert('Joined ticket: ${ticket.title}!')">Join Ticket ✏️</button>
            </div>
        `;
        feedContainer.appendChild(card);
    });
}

async function fetchMyTickets() {
    const joinedContainer = document.getElementById('joinedTicketsFeed');
    joinedContainer.innerHTML = '<p style="color: #888;">Loading your tickets...</p>';

    let { data: myTickets, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('creator_name', document.getElementById('creatorName').value);

    if (error) {
        joinedContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        return;
    }

    if (!myTickets || myTickets.length === 0) {
        joinedContainer.innerHTML = '<p style="color: #888;">You haven\'t created or joined any tickets yet!</p>';
        return;
    }

    joinedContainer.innerHTML = '';
    myTickets.forEach(ticket => {
        const item = document.createElement('div');
        item.className = 'ticket-card';
        item.style.marginBottom = '15px';
        item.innerHTML = `
            <div class="card-body">
                <h3 style="font-size: 15px; color: #d1496b;">${ticket.title}</h3>
                <p>${ticket.description}</p>
            </div>
        `;
        joinedContainer.appendChild(item);
    });
}

async function publishTicket() {
    const creatorName = document.getElementById('creatorName').value;
    const title = document.getElementById('ticketTitle').value;
    const description = document.getElementById('ticketDesc').value;
    const difficulty = document.getElementById('ticketDifficulty').value;
    const fileInput = document.getElementById('ticketFile').files[0];

    if (!title || !description) {
        alert('Please fill out the title and description!');
        return;
    }

    let imageUrl = '';

    if (fileInput) {
        const fileName = `${Date.now()}_${fileInput.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('drawings')
            .upload(fileName, fileInput);

        if (uploadError) {
            alert('Error uploading image: ' + uploadError.message);
            return;
        }

        const { data: publicUrlData } = supabase.storage
            .from('drawings')
            .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
    }

    const { error: insertError } = await supabase
        .from('tickets')
        .insert([{ creator_name: creatorName, title, description, difficulty, reference_image_url: imageUrl }]);

    if (insertError) {
        alert('Error saving ticket: ' + insertError.message);
    } else {
        alert('Ticket published live to Supabase successfully! 🎉');
        document.getElementById('ticketTitle').value = '';
        document.getElementById('ticketDesc').value = '';
        document.getElementById('ticketFile').value = '';
        switchView('feed');
    }
}
