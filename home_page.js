// 1. Initialization
const SUPABASE_URL = 'https://aurjrjrjpbgpcnfcnhai.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cmpyanJqcGJncGNuZmNuaGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjc1NzAsImV4cCI6MjA4ODMwMzU3MH0.Lk8wk4wUAYzxQuZ5ToMMfTZl_Z1a7aaYi-wiwrVhOzk';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let allListings = []; 

const uniData = {
    "Adrar": ["University of Adrar"], "Chlef": ["University of Chlef"],
    "Laghouat": ["University of Laghouat"], "Oum El Bouaghi": ["University of Oum El Bouaghi"],
    "Batna": ["University of Batna 1", "University of Batna 2"], "Béjaïa": ["University of Bejaia"],
    "Biskra": ["University of Biskra"], "Béchar": ["University of Bechar"],
    "Blida": ["University of Blida 1", "University of Blida 2"], "Bouira": ["University of Bouira"],
    "Tamanrasset": ["University Center of Tamanrasset"], "Tébessa": ["University of Tebessa"],
    "Tlemcen": ["University of Tlemcen"], "Tiaret": ["University of Tiaret"],
    "Tizi Ouzou": ["University of Tizi Ouzou"],
    "Algiers": ["USTHB", "University of Algiers 1", "University of Algiers 2", "University of Algiers 3", "ESI", "ENP"],
    "Oran": ["USTO-MB", "University of Oran 1", "University of Oran 2"],
    "Constantine": ["University of Constantine 1", "University of Constantine 2", "University of Constantine 3"]
};

// --- SELECT ELEMENTS ---
const wilayaSelect = document.getElementById('wilayaSelect');
const uniSelect    = document.getElementById('uniSelect');
const categorySelect = document.getElementById('categorySelect');
const specSelect     = document.getElementById('specialization');
const costSelect     = document.getElementById('costSelect'); 
const availSelect    = document.getElementById('availSelect'); 
const searchInput    = document.getElementById('searchInput');

// --- 1. EVENT LISTENERS ---
if (wilayaSelect) {
    wilayaSelect.addEventListener('change', function () {
        const w = this.value;
        uniSelect.innerHTML = '<option value="">-- Select University --</option>';
        if (w && uniData[w]) {
            uniSelect.disabled = false;
            uniData[w].forEach(uni => {
                const opt = document.createElement('option');
                opt.value = uni;
                opt.textContent = uni;
                uniSelect.appendChild(opt);
            });
        } else {
            uniSelect.disabled = true;
        }
        filterAndRender(); 
    });
}

// Attach all update listeners
[uniSelect, categorySelect, specSelect, costSelect, availSelect].forEach(el => {
    if (el) el.addEventListener('change', filterAndRender);
});
if (searchInput) searchInput.addEventListener('input', filterAndRender);

// --- 2. DATABASE FETCH ---
async function fetchAndRender() {
    const container = document.getElementById('listingsContainer');
    if (!container) return;

    container.innerHTML = '<div class="loader">Loading items...</div>';

    try {
        const { data, error } = await supabase.from('listings').select('*');
        if (error) throw error;

        allListings = data || []; 
        filterAndRender();  
    } catch (err) {
        console.error("Error:", err.message);
        container.innerHTML = `<p style="text-align:center;">Error connecting to database.</p>`;
    }
}

// --- 3. FILTER & DISPLAY LOGIC ---
function filterAndRender() {
    const container = document.getElementById('listingsContainer');
    const template = document.getElementById('productCardTemplate');
    
    if (!container || !template) return;
    
    container.innerHTML = '';

    // Get current values
    const sWilaya = wilayaSelect ? wilayaSelect.value : "";
    const sUni    = uniSelect ? uniSelect.value : "";
    const sCat    = categorySelect ? categorySelect.value : "";
    const sSpec   = specSelect ? specSelect.value : "";
    const sSort   = costSelect ? costSelect.value : "";
    const sAvail  = availSelect ? availSelect.value : "";
    const sSearch = searchInput ? searchInput.value.toLowerCase() : "";

    // A. FILTERING
    let filtered = allListings.filter(item => {
        const matchSearch = !sSearch || item.product_name.toLowerCase().includes(sSearch);
        const matchWilaya = !sWilaya || item.wilaya === sWilaya;
        const matchUni    = !sUni    || item.university === sUni;
        const matchCat    = !sCat    || item.category === sCat;
        const matchSpec   = !sSpec   || item.specialization === sSpec;
        const matchAvai   = !sAvail  || item.aday === sAvail;

        return matchSearch && matchWilaya && matchUni && matchCat && matchSpec && matchAvai;
    });

    // B. SORTING (Price)
    if (sSort === "low-high") {
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sSort === "high-low") {
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    // C. RENDERING WITH TEMPLATE
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; padding:50px;">No items found.</p>';
        return;
    }

    filtered.forEach(item => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.product_card');

        if (card) {
            card.style.cursor = "pointer"; // Makes it look clickable
            card.onclick = () => {
                // FIXED: Changed item.id to item.product_id
                const id = item.product_id;
                // Redirects to test.html and passes the ID in the URL
                window.location.href = `test.html?id=${id}`;
            };
        }
    
        // Map Image
        const img = clone.querySelector('.p-img');
        img.src = (item.images && item.images.length > 0) ? item.images[0] : 'https://via.placeholder.com/300x200';
        img.alt = item.product_name;

        // Map Text
        clone.querySelector('.p-title').textContent = item.product_name;
        clone.querySelector('.p-location').textContent = (item.wilaya || 'Algeria').toUpperCase();
        clone.querySelector('.p-avail-text').textContent = item.available || 'Available';
        clone.querySelector('.p-price').textContent = item.price;
        clone.querySelector('.p-aday').textContent= item.aday;

        // Condition Logic (New vs Used)
        const usedBadge = clone.querySelector('.p-status');

        // 1. Get the raw value
        const rawStatus = item.status;

        // 2. Comprehensive check:
        const isUsed = (rawStatus === true || rawStatus === 1 || (typeof rawStatus === 'string' && rawStatus.toLowerCase().trim() === 'used'));

        if (isUsed) {
            usedBadge.textContent = 'USED';
            usedBadge.className = 'p-status badge-used';
        } else {
            usedBadge.textContent = 'NEW';
            usedBadge.className = 'p-status badge-new';
        }
        container.appendChild(clone);
    });
}

window.addEventListener('DOMContentLoaded', fetchAndRender);


document.getElementById('nav-select').addEventListener('change', function() {
    const destination = this.value;
    if (destination) {
      window.location.href = destination;
    }
  });


  