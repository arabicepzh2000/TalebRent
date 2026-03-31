const SUPABASE_URL = 'https://aurjrjrjpbgpcnfcnhai.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cmpyanJqcGJncGNuZmNuaGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjc1NzAsImV4cCI6MjA4ODMwMzU3MH0.Lk8wk4wUAYzxQuZ5ToMMfTZl_Z1a7aaYi-wiwrVhOzk';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let productDetails = null;

// 1. INITIALIZATION: Fetch product and setup UI
async function prepareRequestPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        alert("No product selected.");
        window.location.href = 'index.html';
        return;
    }

    const { data: product, error } = await supabaseClient
        .from('listings')
        .select('*')
        .eq('product_id', productId)
        .single();

    if (error || !product) {
        console.error("Error fetching product:", error);
        return;
    }

    productDetails = product;

    // Fill UI elements
    document.getElementById('product_name').innerText = product.product_name;
    document.getElementById('price').innerText = `${product.price} DA`;

    // --- DATE LOGIC ---
    const today = new Date().toISOString().split('T')[0];
    const startInput = document.getElementById('start_date');
    const endInput = document.getElementById('end_date');

    if (startInput && endInput) {
        startInput.setAttribute('min', today);
        endInput.setAttribute('min', today);

        startInput.addEventListener('change', () => {
            endInput.setAttribute('min', startInput.value);
            if (endInput.value && endInput.value < startInput.value) {
                endInput.value = startInput.value;
            }
            calculateTotal();
        });

        endInput.addEventListener('change', calculateTotal);
    }

    // --- PAYMENT TOGGLE & DISABLE LOGIC ---
    const paymentSelect = document.getElementById('payment');
    const cardContainer = document.getElementById('card_selection_container');
    const payCardSelect = document.getElementById('pay_card');

    if (paymentSelect && cardContainer && payCardSelect) {
        // Ensure it starts disabled
        payCardSelect.disabled = true;

        paymentSelect.addEventListener('change', () => {
            if (paymentSelect.value === 'online') {
                // Show container and UNLOCK the dropdown
                cardContainer.style.display = 'block';
                payCardSelect.disabled = false;
                payCardSelect.style.opacity = "1";
            } else {
                // Hide container and LOCK the dropdown
                cardContainer.style.display = 'none';
                payCardSelect.disabled = true;
                payCardSelect.value = ""; // Clear selection
                payCardSelect.style.opacity = "0.5";
            }
        });
    }
}

// 2. CALCULATION: Total Price
function calculateTotal() {
    const startVal = document.getElementById('start_date').value;
    const endVal = document.getElementById('end_date').value;
    const totalDisplay = document.getElementById('total_price');

    if (startVal && endVal && productDetails) {
        const d1 = new Date(startVal);
        const d2 = new Date(endVal);
        
        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays > 0) {
            const total = diffDays * parseFloat(productDetails.price);
            totalDisplay.innerText = `Total: ${total} DA (${diffDays} days)`;
            totalDisplay.dataset.value = total;
        } else {
            totalDisplay.innerText = "Invalid Dates";
            totalDisplay.dataset.value = 0;
        }
    }
}

// 3. SUBMISSION: Create the request
async function sendRentRequest(event) {
    event.preventDefault();

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("Please log in first!");
        return;
    }

    const start = document.getElementById('start_date').value;
    const end = document.getElementById('end_date').value;
    const msg = document.getElementById('request_message').value;
    const payMethod = document.getElementById('payment').value;
    const payCard = document.getElementById('pay_card').value; 
    const total = document.getElementById('total_price').dataset.value;

    // --- VALIDATIONS ---
    if (!start || !end || parseFloat(total) <= 0) {
        alert("Please select a valid date range.");
        return;
    }

    // MANDATORY: If they chose Online, they MUST pick a card
    if (payMethod === 'online' && !payCard) {
        alert("Please select your payment card (CCP, Visa, etc.) to proceed.");
        return;
    }

    if (user.id === productDetails.user_id) {
        alert("You cannot rent your own item!");
        return;
    }

    const requestData = {
        product_id: productDetails.product_id,
        product_name: productDetails.product_name,
        renter_id: user.id,               
        owner_id: productDetails.user_id, 
        from_date: start,                 
        to_date: end,                     
        payment_method: payMethod,
        pay_card: payMethod === 'online' ? payCard : null, // Send NULL if hand-to-hand
        message: msg,
        total_price: parseFloat(total),
        status: 'pending'
    };

    const { error } = await supabaseClient
        .from('rent_request')
        .insert([requestData]);

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("Rent request sent successfully!");
        window.location.href = 'index.html';
    }
}

// LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    prepareRequestPage();
    const form = document.getElementById('rent_request_form');
    if (form) form.addEventListener('submit', sendRentRequest);
});