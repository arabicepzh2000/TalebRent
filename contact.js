const SUPABASE_URL = 'https://aurjrjrjpbgpcnfcnhai.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cmpyanJqcGJncGNuZmNuaGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjc1NzAsImV4cCI6MjA4ODMwMzU3MH0.Lk8wk4wUAYzxQuZ5ToMMfTZl_Z1a7aaYi-wiwrVhOzk';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUserId = null;
let activeConversationId = null;

// 1. INITIALIZE PAGE
async function init() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUserId = user.id;

    const params = new URLSearchParams(window.location.search);
    activeConversationId = params.get('conv_id');

    await loadSidebar();
    
    if (activeConversationId) {
        openChat(activeConversationId);
    }

    setupRealtime();
}

// 2. LOAD LEFT SIDEBAR
// ... existing Supabase init code ...

// 2. LOAD LEFT SIDEBAR (Updated to fetch Owner names)
async function loadSidebar() {
    const listContainer = document.getElementById('contact_list_container');
    if (!listContainer) return;
    
    const { data: contacts, error } = await supabaseClient
        .from('contact')
        .select(`
            *,
            owner_profile:profiles!owner_id (full_name),
            renter_profile:profiles!renter_id (full_name)
        `)
        .or(`owner_id.eq.${currentUserId},renter_id.eq.${currentUserId}`)
        .order('updated_at', { ascending: false });

    if (error) return;

    listContainer.innerHTML = "";

    if (contacts.length === 0) {
        listContainer.innerHTML = "<p class='empty-msg'>No conversations yet.</p>";
        return;
    }

    contacts.forEach(con => {
        const card = document.createElement('div');
        card.className = `contact-card ${activeConversationId == con.id ? 'active' : ''}`;
        
        // Identify the partner name
        const isOwner = String(con.owner_id) === String(currentUserId);
        const chatPartnerName = isOwner 
            ? (con.renter_profile?.full_name || "Student") 
            : (con.owner_profile?.full_name || "Owner");

        // Clean the item name (remove the colon prefix if it exists)
        const itemName = con.product_name.includes(':') 
            ? con.product_name.split(':')[1].trim() 
            : con.product_name;

        const snippet = (con.last_message && con.last_message !== "no text yet") 
            ? con.last_message 
            : "New request...";

        // CLEAN STRUCTURE: "Name: Item" on top, "Last message" on bottom
        card.innerHTML = `
            <div class="card-body">
                <h3 class="contact-title">
                    <span class="partner-name">${chatPartnerName}</span>: 
                    <span class="item-name">${itemName}</span>
                </h3>
                <p class="last-snippet">${snippet}</p>
            </div>
        `;

        card.onclick = () => {
            activeConversationId = con.id;
            openChat(con.id);
            document.querySelectorAll('.contact-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        };

        listContainer.appendChild(card);
    });
}

// 3. OPEN CHAT (Updated Header)
async function openChat(convId) {
    activeConversationId = convId;
    const display = document.getElementById('messages_display');
    const headerName = document.getElementById('target_name');

    const { data: contact } = await supabaseClient
        .from('contact')
        .select(`
            *,
            owner_profile:profiles!owner_id (full_name),
            renter_profile:profiles!renter_id (full_name)
        `)
        .eq('id', convId)
        .single();

    if (contact) {
        const isOwner = String(contact.owner_id) === String(currentUserId);
        const chatPartnerName = isOwner 
            ? contact.renter_profile?.full_name 
            : contact.owner_profile?.full_name;
        
        headerName.innerText = chatPartnerName || "Chat";
    }

    const { data: messages } = await supabaseClient
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

    display.innerHTML = "";

    if (messages) {
        messages.forEach(msg => renderMessage(msg));
        display.scrollTop = display.scrollHeight;
    }

    await markAsRead(convId);
}

// ... rest of your code (renderMessage, sendMessage, markAsRead, setupRealtime) stays the same ...

// 4. RENDER MESSAGE BUBBLE (WITH READ STATUS & REQUEST STYLE)
function renderMessage(msg) {
    const display = document.getElementById('messages_display');
    if (!display) return;

    const div = document.createElement('div');
    const isMe = String(msg.sender_id) === String(currentUserId);
    
    // NEW: Identify if this is the first automated rent request message
    const isRequestMsg = msg.content.includes("wants to rent") && msg.content.includes("from");

    div.className = `message-bubble ${isMe ? 'sent' : 'received'} ${isRequestMsg ? 'system-request' : ''}`;
    
    const time = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // NEW: Read Receipt Logic (Send status)
    const readStatus = msg.is_read ? '✔✔' : '✔';

    div.innerHTML = `
        <div class="content">${msg.content}</div>
        <div class="meta">
            <span class="time">${time}</span>
            ${isMe ? `<span class="status">${readStatus}</span>` : ''}
        </div>
    `;
    
    display.appendChild(div);
    display.scrollTop = display.scrollHeight;
}

// 5. SEND MESSAGE LOGIC
async function sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('message_input');
    const text = input.value.trim();

    if (!text || !activeConversationId) return;
    input.value = ""; 

    const { data: contact } = await supabaseClient
        .from('contact')
        .select('*')
        .eq('id', activeConversationId)
        .single();

    if (!contact) return;
    const receiverId = (String(contact.owner_id) === String(currentUserId)) ? contact.renter_id : contact.owner_id;

    // Optimistic UI update
    renderMessage({
        sender_id: currentUserId,
        content: text,
        created_at: new Date().toISOString(),
        is_read: false
    });

    const { error } = await supabaseClient.from('messages').insert([{
        conversation_id: activeConversationId,
        sender_id: currentUserId,
        receiver_id: receiverId,
        content: text
    }]);

    if (!error) {
        await supabaseClient
            .from('contact')
            .update({ last_message: text, updated_at: new Date() })
            .eq('id', activeConversationId);
        
        loadSidebar();
    }
}

// 6. NEW: MARK AS READ FUNCTION
async function markAsRead(convId) {
    if (!convId || !currentUserId) return;
    await supabaseClient
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .eq('receiver_id', currentUserId)
        .eq('is_read', false);
}

// 7. REALTIME SUBSCRIPTION
function setupRealtime() {
    supabaseClient
        .channel('chat-room')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async payload => {
            const newMsg = payload.new;
            if (newMsg.conversation_id === activeConversationId && newMsg.sender_id !== currentUserId) {
                renderMessage(newMsg);
                await markAsRead(activeConversationId); // Mark incoming as read if chat is open
            }
            loadSidebar(); 
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
            // Refresh to update checkmarks if an "UPDATE" happens
            if (activeConversationId) {
                // You could optionally reload messages here to show the double checkmark
            }
        })
        .subscribe();
}
// Toggle Modal
document.getElementById('request_btn').onclick = () => {
    document.getElementById('request_modal').style.display = 'flex';
};
document.getElementById('close_modal').onclick = () => {
    document.getElementById('request_modal').style.display = 'none';
};

// Submit Proposal
document.getElementById('submit_request').onclick = async () => {
    const start = document.getElementById('start_date').value;
    const end = document.getElementById('end_date').value;
    const pay = document.getElementById('payment_method').value;

    if(!start || !end) return alert("Please select dates");

    // We store the data as a special JSON string inside the message
    const proposalData = {
        type: "PROPOSAL",
        start_date: start,
        end_date: end,
        payment: pay,
        status: "pending"
    };

    const text = JSON.stringify(proposalData);
    
    // Use your existing sendMessage logic but pass the JSON text
    // (You'll need to adapt your sendMessage function to accept a 'text' argument)
    await sendProposalMessage(text); 
    
    document.getElementById('request_modal').style.display = 'none';
};

// Modify your renderMessage to handle Proposals
function renderMessage(msg) {
    const display = document.getElementById('messages_display');
    let contentHTML = msg.content;
    let isProposal = false;

    // Check if message is a JSON proposal
    if (msg.content.startsWith('{"type":"PROPOSAL"')) {
        const data = JSON.parse(msg.content);
        isProposal = true;
        const isOwner = msg.receiver_id === currentUserId; // Owner receives it

        contentHTML = `
            <div class="proposal-header">📜 RENT PROPOSAL</div>
            <div class="proposal-details">
                <b>Start:</b> ${data.start_date}<br>
                <b>End:</b> ${data.end_date}<br>
                <b>Payment:</b> ${data.payment}
            </div>
            ${isOwner && data.status === 'pending' ? `
                <div class="proposal-actions">
                    <button class="btn-accept" onclick="handleProposal('${msg.id}', 'accepted')">Accept</button>
                    <button class="btn-decline" onclick="handleProposal('${msg.id}', 'declined')">Decline</button>
                </div>
            ` : `<div class="status-badge">${data.status.toUpperCase()}</div>`}
        `;
    }

    const div = document.createElement('div');
    const isMe = String(msg.sender_id) === String(currentUserId);
    div.className = `message-bubble ${isMe ? 'sent' : 'received'} ${isProposal ? 'contract-proposal' : ''}`;
    
    div.innerHTML = contentHTML;
    display.appendChild(div);
}

// LISTENERS
document.addEventListener('DOMContentLoaded', init);
const chatForm = document.getElementById('chat_form');
if(chatForm) chatForm.addEventListener('submit', sendMessage);