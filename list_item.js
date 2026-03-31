// 1. Initialize Supabase Safely
const SUPABASE_URL = 'https://aurjrjrjpbgpcnfcnhai.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cmpyanJqcGJncGNuZmNuaGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjc1NzAsImV4cCI6MjA4ODMwMzU3MH0.Lk8wk4wUAYzxQuZ5ToMMfTZl_Z1a7aaYi-wiwrVhOzk';

// Fix: Always use window.supabase when using the CDN
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 1. IMAGE PREVIEW LOGIC ---
const multiInput = document.getElementById('multi-input');
const imageGrid = document.getElementById('image-grid');

multiInput.addEventListener('change', function() {
    const files = Array.from(this.files).slice(0, 10); 
    imageGrid.innerHTML = ''; 
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.innerHTML = `
                <img src="${e.target.result}" style="width:100px; height:100px; object-fit:cover;">
                <span class="remove-btn" style="cursor:pointer;">&times;</span>
            `;
            item.querySelector('.remove-btn').onclick = () => item.remove();
            imageGrid.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
});

// --- 2. WILAYA & UNIVERSITY DATA ---
const uniData = {
        "Adrar": ["University of Adrar"],
        "Chlef": ["University of Chlef"],
        "Laghouat": ["University of Laghouat"],
        "Oum El Bouaghi": ["University of Oum El Bouaghi"],
        "Batna": ["University of Batna 1", "University of Batna 2"],
        "Béjaïa": ["University of Bejaia"],
        "Biskra": ["University of Biskra"],
        "Béchar": ["University of Bechar"],
        "Blida": ["University of Blida 1", "University of Blida 2"],
        "Bouira": ["University of Bouira"],
        "Tamanrasset": ["University Center of Tamanrasset"],
        "Tébessa": ["University of Tebessa"],
        "Tlemcen": ["University of Tlemcen"],
        "Tiaret": ["University of Tiaret"],
        "Tizi Ouzou": ["University of Tizi Ouzou"],
        "Algiers": ["USTHB", "University of Algiers 1", "University of Algiers 2", "University of Algiers 3", "ESI", "ENP"],
        "Djelfa": ["University of Djelfa"],
        "Jijel": ["University of Jijel"],
        "Sétif": ["University of Setif 1", "University of Setif 2"],
        "Saïda": ["University of Saida"],
        "Skikda": ["University of Skikda"],
        "Sidi Bel Abbès": ["University of Sidi Bel Abbes"],
        "Annaba": ["University of Annaba"],
        "Guelma": ["University of Guelma"],
        "Constantine": ["University of Constantine 1", "University of Constantine 2", "University of Constantine 3"],
        "Médéa": ["University of Medea"],
        "Mostaganem": ["University of Mostaganem"],
        "M'Sila": ["University of M'Sila"],
        "Mascara": ["University of Mascara"],
        "Ouargla": ["University of Ouargla"],
        "Oran": ["USTO-MB", "University of Oran 1", "University of Oran 2"],
        "El Bayadh": ["University Center of El Bayadh"],
        "Illizi": ["University Center of Illizi"],
        "Bordj Bou Arréridj": ["University of Bordj Bou Arreridj"],
        "Boumerdès": ["University of Boumerdes"],
        "El Tarf": ["University of El Tarf"],
        "Tindouf": ["University Center of Tindouf"],
        "Tissemsilt": ["University Center of Tissemsilt"],
        "El Oued": ["University of El Oued"],
        "Khenchela": ["University of Khenchela"],
        "Souk Ahras": ["University of Souk Ahras"],
        "Tipaza": ["University Center of Tipaza"],
        "Mila": ["University Center of Mila"],
        "Aïn Defla": ["University of Ain Defla"],
        "Naâma": ["University Center of Naama"],
        "Aïn Témouchent": ["University Center of Ain Temouchent"],
        "Ghardaïa": ["University of Ghardaia"],
        "Relizane": ["University of Relizane"],
        "Timimoun": ["University Center of Timimoun"],
        "Bordj Badji Mokhtar": ["University Center of Bordj Badji Mokhtar"],
        "Ouled Djellal": ["University Center of Ouled Djellal"],
        "Béni Abbès": ["University Center of Beni Abbes"],
        "In Salah": ["University Center of In Salah"],
        "In Guezzam": ["University Center of In Guezzam"],
        "Touggourt": ["University Center of Touggourt"],
        "Djanet": ["University Center of Djanet"],
        "El M'Ghair": ["University Center of El M'Ghair"],
        "El Meniaa": ["University Center of El Meniaa"]
    };


const wilayaSelect = document.getElementById('wilayaSelect');
const uniSelect = document.getElementById('uniSelect');

wilayaSelect.addEventListener('change', function() {
    const selectedWilaya = this.value;
    uniSelect.innerHTML = '<option value="">-- Choose University --</option>';
    if (selectedWilaya && uniData[selectedWilaya]) {
        uniSelect.disabled = false;
        uniData[selectedWilaya].forEach(uni => {
            const option = document.createElement('option');
            option.value = uni;
            option.textContent = uni;
            uniSelect.appendChild(option);
        });
    } else {
        uniSelect.disabled = true;
    }
});

// --- 3. THE SUPABASE OFFER FUNCTION ---
const offerBtn = document.getElementById('offer');

offerBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const productName = document.getElementById('product_name').value;
    const price = document.getElementById('price').value;
    const files = multiInput.files;

    if (!productName || !price) {
        alert("Please fill in the name and price");
        return;
    }

    try {
        offerBtn.disabled = true;
        offerBtn.innerText = "Publishing...";

        const imageUrls = [];

        // A. Upload Images to Supabase Storage
        if (files.length > 0) {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
                const filePath = `product-pics/${fileName}`;

                // Fix: Use 'supabase' variable
                let { error: uploadError } = await supabase.storage
                    .from('products') 
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('products')
                    .getPublicUrl(filePath);
                
                imageUrls.push(data.publicUrl);
            }
        }

        // B. Save Data to Table named 'listings'
        // We do NOT send an 'id' here; let the database generate it automatically.
        const { error: dbError } = await supabase
        .from('listings')
        .insert([{
            product_name: productName,
            price: Number(price),
            used: document.getElementById('used').value,
            description: document.getElementById('description').value,
            aday: document.getElementById('aday').value,
            wilaya: wilayaSelect.value,
            university: uniSelect.value,
            specialization: document.getElementById('specialization').value,
            category:document.getElementById('category').value,
            images: imageUrls// Ensure this column is 'text[]' or 'jsonb' in Supabase
        }]);

        if (dbError) throw dbError;

        alert("Product published successfully!");
        window.location.href = "home_page.html";

    } catch (error) {
        console.error("DETAILED ERROR:", error); 
        alert("Publish Failed: " + error.message);
    } finally {
        offerBtn.disabled = false;
        offerBtn.innerText = "offer";
    }
});