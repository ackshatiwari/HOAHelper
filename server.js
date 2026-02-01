import express from "express";
import "dotenv/config";
import path from "path";
import { supabase } from "./client.js";

const app = express();
const port = 3000;

const __dirname = path.resolve();

//middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());


// Serve HTML files
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});
app.get("/homeowner", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "homeowner.html"));
});
app.get("/auth", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "auth.html"));
});


// Request Endpoints
app.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if(error) {
        console.log('Error signing in:', error);
        return res.json({ success: false, message: error.message });
    }
    console.log('User signed in:', data.user);
    return res.json({ success: true, user: data.user });

});
app.post("/signup", async (req, res) => {
    const { email, name, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.json({ success: false, message: "Passwords do not match" });
    }
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    })
    if(signupError) {
        console.log('Error signing up:', signupError);
        return  res.json({ success: false, message: signupError.message });
    }
    console.log('User signed up:', signupData.user);

    //now automatically sign user in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    if(signInError) {
        console.log('Error signing in:', signInError);
        return res.json({ success: false, message: signInError.message });
    }
    console.log('User signed in:', signInData.user);
    return res.json({ success: true, user: signInData.user });
});



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});