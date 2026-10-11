// 1. SUPABASE CONNECTION (Global so all functions can use it)
const SUPABASE_URL = 'https://agvjkooyrdvyllwwcnqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndmprb295cmR2eWxsd3djbnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NTc1NTQsImV4cCI6MjEwNzIzMzU1NH0.RSxj5Yzxt0uhZtWsmLga8DWtlY5KlSUv0f-s5X6pmdY';

// Renamed to supabaseClient to avoid colliding with the global 'supabase' object
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    let { data: tickets, error: ticketsError } = await supabaseClient
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (ticketsError) {
        feedContainer.innerHTML = `<p style="color: red; text-align: center;">Error loading tickets: ${ticketsError.message}</p>`;
        return;
    }

    let { data: submissions, error: subError } = await supabaseClient
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: true });

    if (subError) {
        console.error("Error loading submissions:", subError);
        submissions = []; 
    }

    if (tickets.length === 0) {
        feedContainer.innerHTML = '<p style="color: #888; text-align: center;">No tickets found. Create one using the sidebar!</p>';
        return;
    }

    feedContainer.innerHTML = '';
    
    tickets.forEach(ticket => {
        const ticketSubmissions = submissions.filter(sub => sub.ticket_id === ticket.id);
        
        let submissionsHtml = '';
        if (ticketSubmissions.length > 0) {
            submissionsHtml = `
                <div style="padding: 15px; border-top: 1px solid #f9eeef; background: #fffafb;">
                    <h4 style="font-size: 13px; color: #d1496b; margin-bottom: 10px;">Submitted Artwork (${ticketSubmissions.length}):</h4>
                    <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px;">
                        ${ticketSubmissions.map(sub => `
                            <div style="min-width: 100px; text-align: center; background: white; padding: 5px; border-radius: 8px; border: 1px solid #ffd1dc;">
                                <a href="${sub.artwork_url}" target="_blank">
                                    <img src="${sub.artwork_url}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;" alt="Art">
                                </a>
                                <span style="font-size: 12px; font-weight: bold; color: #d1496b; display: block; margin-top: 5px;">By: ${sub.artist_name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.innerHTML = `
            <div class="card-header">
                <div class="user-info">
                    <img src="avatar.png" alt="Avatar" class="avatar-img">
                    <span>Requested by: ${ticket.creator_name || 'Anonymous'}</span>
                </div>
                <span class="difficulty-badge">${ticket.difficulty || 'Easy'}</span>
            </div>
            <div class="card-body">
                <h3 style="font-size: 15px; color: #333; margin-bottom: 5px;">${ticket.title}</h3>
                <p>${ticket.description}</p>
            </div>
            ${ticket.reference_image_url ? `<div class="card-image-box"><img src="${ticket.reference_image_url}" /></div>` : ''}
            
            ${submissionsHtml}

            <div class="card-actions">
                <span style="font-size: 13px; color: #888;">Open Request</span>
                <button class="btn-join" onclick="openSubmitModal('${ticket.id}')">Join Ticket ✏️</button>
            </div>
        `;
        feedContainer.appendChild(card);
    });
}

async function fetchMyTickets() {
    const joinedContainer = document.getElementById('joinedTicketsFeed');
    joinedContainer.innerHTML = '<p style="color: #888;">Loading your tickets...</p>';

    let { data: myTickets, error } = await supabaseClient
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
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('drawings')
            .upload(fileName, fileInput);

        if (uploadError) {
            alert('Error uploading image: ' + uploadError.message);
            return;
        }

        const { data: publicUrlData } = supabaseClient.storage
            .from('drawings')
            .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
    }

    const { error: insertError } = await supabaseClient
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

// 5. SUBMISSION LOGIC
function openSubmitModal(ticketId) {
    document.getElementById('submitTicketId').value = ticketId;
    document.getElementById('submitModal').style.display = 'flex';
}

function closeSubmitModal() {
    document.getElementById('submitModal').style.display = 'none';
    document.getElementById('submitFile').value = '';
}

async function submitArtwork() {
    const ticketId = document.getElementById('submitTicketId').value;
    const artistName = document.getElementById('submitArtistName').value;
    const fileInput = document.getElementById('submitFile').files[0];

    if (!fileInput) {
        alert('Please select an artwork file to upload!');
        return;
    }

    const fileName = `submission_${Date.now()}_${fileInput.name}`;
    
    // 1. Upload to the drawings bucket
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('drawings')
        .upload(fileName, fileInput);

    if (uploadError) {
        alert('Error uploading artwork: ' + uploadError.message);
        return;
    }

    // 2. Get the public URL
    const { data: publicUrlData } = supabaseClient.storage
        .from('drawings')
        .getPublicUrl(fileName);

    const artworkUrl = publicUrlData.publicUrl;

    // 3. Save to the submissions table
    const { error: insertError } = await supabaseClient
        .from('submissions')
        .insert([{ ticket_id: ticketId, artist_name: artistName, artwork_url: artworkUrl }]);

    if (insertError) {
        alert('Error saving submission to database: ' + insertError.message);
    } else {
        alert('Artwork submitted successfully! 🎨');
        closeSubmitModal();
    }
}
