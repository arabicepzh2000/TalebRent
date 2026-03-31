// 1. Initialize Supabase
const SUPABASE_URL = 'https://aurjrjrjpbgpcnfcnhai.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cmpyanJqcGJncGNuZmNuaGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjc1NzAsImV4cCI6MjA4ODMwMzU3MH0.Lk8wk4wUAYzxQuZ5ToMMfTZl_Z1a7aaYi-wiwrVhOzk';

// Check if the library is loaded from the CDN
if (!window.supabase) {
    alert("Supabase library not found! Please check your internet connection.");
}

// FIX: Change 'supabaseClient' to just 'supabase' 
// so it matches the 'supabase.auth' call below
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const signupForm = document.getElementById('signupForm');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get input values (IDs match your HTML: fullname, email, studentId)
    const fullName = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const studentId = document.getElementById('studentId').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters!");
        return;
    }

    try {
        const submitBtn = document.getElementById('submit');
        submitBtn.disabled = true;
        submitBtn.innerText = "Creating account...";

        // Now 'supabase' is defined, so '.auth.signUp' will work!
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    student_id: studentId
                }
            }
        });

        if (authError) throw authError;

        if (authData.user) {
            window.location.href = "home_page.html";
        }

    } catch (error) {
        console.error("Signup error:", error.message);
        alert("Signup failed: " + error.message);
    } finally {
        const submitBtn = document.getElementById('submit');
        submitBtn.disabled = false;
        submitBtn.innerText = "Sign up";
    }
});