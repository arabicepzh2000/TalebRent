// 1. Initialize Supabase
const SUPABASE_URL = 'https://aurjrjrjpbgpcnfcnhai.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cmpyanJqcGJncGNuZmNuaGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjc1NzAsImV4cCI6MjA4ODMwMzU3MH0.Lk8wk4wUAYzxQuZ5ToMMfTZl_Z1a7aaYi-wiwrVhOzk';

// Use window.supabase to avoid the 'undefined' error
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.querySelector('.btn button');

    try {
        loginBtn.innerText = "Logging in...";
        loginBtn.disabled = true;

        // 1. Perform Login
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        // 2. Success Logic
        if (data.user) {
            console.log("Login successful, updating timestamp...");

            // IMPORTANT: You must call the function here and AWAIT it
            // so the database has time to save before the page changes
            await updateLastLogin(data.user.id);

            alert("Login successful! Welcome back.");
            window.location.href = "home_page.html";
        }

    } catch (error) {
        console.error("Login Error:", error.message);
        alert("Login failed: " + error.message);
    } finally {
        loginBtn.innerText = "Log in";
        loginBtn.disabled = false;
    }
});

// Update function
async function updateLastLogin(userId) {
    console.log("Updating last_login for user:", userId);
    const { error } = await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId); 
  
    if (error) {
        console.error("Database Update Error:", error.message);
    } else {
        console.log("last_login updated in database.");
    }
}