const SUPABASE_URL = 'https://aurjrjrjpbgpcnfcnhai.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cmpyanJqcGJncGNuZmNuaGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjc1NzAsImV4cCI6MjA4ODMwMzU3MH0.Lk8wk4wUAYzxQuZ5ToMMfTZl_Z1a7aaYi-wiwrVhOzk';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. THE MAIN LOAD FUNCTION
async function loadMyRequests() {
    const container = document.getElementById('requests_container');
    const template = document.getElementById('request_card_template');

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data: requests, error } = await supabaseClient
        .from('rent_request')
        .select(`*, sender:profiles!renter_id (full_name)`)
        .eq('owner_id', user.id) 
        .order('created_at', { ascending: false });

    if (error) { console.error("Fetch Error:", error); return; }

    if (!requests || requests.length === 0) {
        container.innerHTML = "<p>No rent requests yet.</p>";
        return;
    }

    container.innerHTML = ""; 

    requests.forEach(req => {
        const clone = template.content.cloneNode(true);
        
        // Basic Info Display
        clone.querySelector('.renter_name').innerText = req.sender?.full_name || "Student";
        clone.querySelector('.product_name').innerText = req.product_name;
        clone.querySelector('.start_date').innerText = req.from_date;
        clone.querySelector('.end_date').innerText = req.to_date;
        
        // Payment Method & Card Display
        const payMethodEl = clone.querySelector('.payment_method');
        if (payMethodEl) {
            payMethodEl.innerText = req.payment_method || "Not specified";
        }

        // --- NEW: Display pay_card on the UI card ---
        const payCardEl = clone.querySelector('.pay_card');
        if (payCardEl) {
            payCardEl.innerText = req.pay_card ? `Card: ${req.pay_card}` : "";
        }
        
        clone.querySelector('.request_message').innerText = req.message || "No message";

        const messageBtn = clone.querySelector('.message_btn');
        const acceptBtn = clone.querySelector('.accept_btn');
        const declineBtn = clone.querySelector('.decline_btn');

        // 1. Messaging Logic
        if (messageBtn) {
            messageBtn.onclick = async () => {
                const renterId = req.renter_id;
                const renterName = req.sender?.full_name || "Student";
                const ownerId = req.owner_id;
                const productId = req.product_id;
                const productName = req.product_name;
        
                const contactDisplayName = `${renterName}: ${productName}`;
        
                let { data: existingContact } = await supabaseClient
                    .from('contact')
                    .select('id')
                    .eq('owner_id', ownerId)
                    .eq('renter_id', renterId)
                    .eq('product_id', productId)
                    .maybeSingle();
        
                let activeContactId;
        
                if (existingContact) {
                    activeContactId = existingContact.id;
                } else {
                    const { data: newContact, error: insertError } = await supabaseClient
                        .from('contact')
                        .insert([{
                            owner_id: ownerId,
                            renter_id: renterId,
                            product_id: productId,
                            product_name: contactDisplayName
                        }])
                        .select()
                        .single();
        
                    if (insertError) {
                        console.error("Insert Error:", insertError.message);
                        return;
                    }
                    activeContactId = newContact.id;
        
                    // --- FIXED: Build dynamic auto-message including card info ---
                    let paymentDetails = req.payment_method;
                    if (req.payment_method === 'online' && req.pay_card) {
                        paymentDetails += ` (${req.pay_card})`;
                    }

                    const autoMsg = `${renterName} wants to rent your "${productName}" from ${req.from_date} to ${req.to_date} / Payment: ${paymentDetails}`;
                    
                    await supabaseClient.from('messages').insert([{
                        conversation_id: activeContactId,
                        sender_id: renterId,
                        receiver_id: ownerId,
                        content: autoMsg
                    }]);
                }
        
                window.location.href = `contact.html?conv_id=${activeContactId}`;
            };
        }

        if (acceptBtn) {
            acceptBtn.onclick = () => handleRequest(req.rent_id, 'accepted');
        }
        
        if (declineBtn) {
            declineBtn.onclick = () => deleteRequest(req.rent_id);
        }

        container.appendChild(clone);
    });
}

// 2. THE REALTIME SUBSCRIPTION
function setupRealtime() {
    supabaseClient
        .channel('schema-db-changes')
        .on(
            'postgres_changes', 
            { event: '*', schema: 'public', table: 'rent_request' }, 
            () => loadMyRequests() 
        )
        .subscribe();
}

// 3. ACTION FUNCTIONS
async function deleteRequest(rentId) {
    if (!confirm("Decline this request? It will be removed from your list.")) return;
    const { error } = await supabaseClient.from('rent_request').delete().eq('rent_id', rentId);
    if (error) alert(error.message);
}

async function handleRequest(rentId, status) {
    const { error } = await supabaseClient
        .from('rent_request')
        .update({ status: status })
        .eq('rent_id', rentId);

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert(`Request ${status}!`);
    }
}

// 4. INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    loadMyRequests();
    setupRealtime();
});