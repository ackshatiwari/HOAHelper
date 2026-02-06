import express from "express";
import "dotenv/config";
import path from "path";
import { supabase } from "./client.js";
import multer from "multer";

const app = express();
const port = 3000;



const __dirname = path.resolve();

//middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
const upload = multer({ dest: 'uploads/' });




// Serve HTML files
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
//only if you are an admin, it will open for you
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});
app.get("/homeowner", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "homeowner.html"));
});
app.get("/auth", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "auth.html"));
});



// (no client-side dataURL helper here)


// Request Endpoints
app.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) {
        console.log('Error signing in:', error);
        return res.json({ success: false, message: error.message });
    }
    console.log('User signed in:', data.user);
    return res.json({ success: true, user: data.user });

});
app.post("/signup", async (req, res) => {
    const { email, name, address, phone_number, gender, race, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.json({ success: false, message: "Passwords do not match" });
    }
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name, address, phone_number, gender, race }
        }
    })
    if (signupError) {
        console.log('Error signing up:', signupError);
        return res.json({ success: false, message: signupError.message });
    }
    console.log('User signed up:', signupData.user);


    const userId = signupData.user.id;

    const { data, error } = await supabase
        .from('User_Details')
        .insert([{
            id: userId,
            full_name: name,
            home_address: address,
            phone_number: phone_number,
            gender: gender,
            race: race,
            role: 'homeowner',
            approved: false,
            email: email
        }]);
    if (error) {
        console.log('Error inserting user details:', error);
        return res.json({ success: false, message: error.message });
    }
    console.log('User details inserted:', data);

    //now automatically sign user in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    if (signInError) {
        console.log('Error signing in:', signInError);
        return res.json({ success: false, message: signInError.message });
    }
    console.log('User signed in:', signInData.user);
    return res.json({ success: true, user: signInData.user });
});


app.post("/submitComplaint", upload.array('images', 5), async (req, res) => {

    console.log("Received complaint submission");
    //Get Supabase Bucket name Report_Images
    const bucketName = 'Report_Images';
    //Extract Form Data
    const form = req.body || {};
    // uploaded images (camera capture + file inputs) are available as an array
    const images = req.files || [];

    console.log('req.body:', req.body);
    console.log('req.files (images):', req.files);

    const category = form.complaintType || null;
    const description = form.complaintText || null;
    const latitude = form.latitude || null;
    const longitude = form.longitude || null;
    const complaintDate = form.complaintDate || null;

    // Look up user id (await the query)
    const email = form.email || null;
    let userId = null;
    if (email) {
        const { data: userData, error: userError } = await supabase
            .from('User_Details')
            .select('id')
            .eq('email', email)
            .single();
        if (userError) console.log('User lookup error:', userError);
        if (userData) userId = userData.id;
    }

    const { data, error } = await supabase
        .from('User_Reports')
        .insert([{
            id: userId,
            category: category,
            description: description,
            latitude: latitude,
            longitude: longitude,
            complaint_date: complaintDate
        }]);
    if (error) {
        console.log('Error inserting complaint:', error);
        return res.json({ success: false, message: error.message });
    }
    console.log('Complaint inserted:', data);

    res.json({ success: true })
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


