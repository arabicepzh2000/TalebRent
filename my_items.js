// Initialization
const SUPABASE_URL = 'https://aurjrjrjpbgpcnfcnhai.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cmpyanJqcGJncGNuZmNuaGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjc1NzAsImV4cCI6MjA4ODMwMzU3MH0.Lk8wk4wUAYzxQuZ5ToMMfTZl_Z1a7aaYi-wiwrVhOzk';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchMyItems() {
    const container = document.getElementById('listingsContainer');
    container.innerHTML = '<div class="loader">Loading your items...</div>';

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            container.innerHTML = '<p style="padding:20px;">Please login to see your items.</p>';
            return;
        }

        const { data: myItems, error: dbError } = await supabase
            .from('listings')
            .select('*')
            .eq('user_id', user.id) 
            .order('created_at', { ascending: false });

        if (dbError) throw dbError;

        if (myItems.length === 0) {
            container.innerHTML = '<p style="padding:20px;">You haven\'t listed any items yet.</p>';
            return;
        }

        container.innerHTML = '';
        myItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'product_card';

            const mainImg = (item.images && item.images.length > 0) 
                ? item.images[0] 
                : 'https://via.placeholder.com/300x200?text=No+Image';

            card.innerHTML = `
                <div class="card_img_wrapper">
                    <img src="${mainImg}" alt="${item.product_name}">
                    <button class="delete_icon" onclick="deleteItem('${item.product_id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="card_content">
                    <div class="title_row">
                        <h2 class="product_title">${item.product_name}</h2>
                    </div>
                    <p class="location_text">${item.wilaya || 'Location'}</p>
                    <div class="card_footer">
                        <span class="price_text"><strong>${item.price}DA</strong>/day</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Error:", err.message);
        container.innerHTML = `<p>Error: ${err.message}</p>`;
    }
}

// Function to delete an item
window.deleteItem = async (productId) => {
    if (confirm("Delete this listing permanently?")) {
        // CHANGED: Filtering by 'product_id' column
        const { error } = await supabase
            .from('listings')
            .delete()
            .eq('product_id', productId);

        if (error) alert("Error: " + error.message);
        else fetchMyItems(); 
    }
};

window.onload = fetchMyItems;