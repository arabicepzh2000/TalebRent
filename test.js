const SUPABASE_URL = 'https://aurjrjrjpbgpcnfcnhai.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cmpyanJqcGJncGNuZmNuaGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjc1NzAsImV4cCI6MjA4ODMwMzU3MH0.Lk8wk4wUAYzxQuZ5ToMMfTZl_Z1a7aaYi-wiwrVhOzk';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function getProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId || productId === "undefined") {
        document.getElementById('productname').innerText = "Product Not Found";
        return;
    }

    // 1. Fetch Product Data
    const { data: product, error } = await _supabase
        .from('listings')
        .select('*')
        .eq('product_id', productId)
        .single();

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (product) {
        // 2. Fetch Owner Name (from profiles table)
        const { data: profile } = await _supabase
            .from('profiles')
            .select('full_name')
            .eq('id', product.user_id)
            .single();

        // 3. Update Text Content
        document.getElementById('username').innerText = profile?.full_name || "Member";
        document.getElementById('productname').innerText = product.product_name;
        document.getElementById('product_status').innerText = product.status || "Status";
        document.getElementById('description_place').innerText = product.description;
        document.getElementById('price_tag').innerText = product.price;
        document.getElementById('wilaya').innerText = product.wilaya || "";
        document.getElementById('uni').innerText = product.university || product.uni || "";
        document.getElementById('period').innerText = product.period || "day";

        // 4. Handle Image Scroll
        const imgContainer = document.getElementById('imageScroll');
        imgContainer.innerHTML = ''; 

        // Check for images array or single image_url
        const images = product.images || (product.image_url ? [product.image_url] : []);

        if (images.length > 0) {
            images.forEach(url => {
                const img = document.createElement('img');
                img.src = url;
                img.className = 'p_img'; // Ensure this class is in your CSS for 100% width
                imgContainer.appendChild(img);
            });
        } else {
            imgContainer.innerHTML = '<p>No images available</p>';
        }
        // ... (inside your if (product) block in product_det.js)

const requestBtn = document.getElementById('requestBtn');
if (requestBtn) {
    requestBtn.onclick = () => {
        // This passes the product_id to the rent_request page
        window.location.href = `rent_request.html?id=${product.product_id}`;
    };
}
    }
}

document.addEventListener('DOMContentLoaded', getProductDetails);