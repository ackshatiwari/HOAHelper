import express from "express";
import "dotenv/config";
import path from "path";
import { supabase } from "./client.js";
import multer from "multer";
import crypto from "crypto";

const app = express();
const port = 3000;

const __dirname = path.resolve();

//middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// use memory storage so we can upload buffers directly to Supabase
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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
    const bucketName = 'Report_Images';
    const form = req.body || {};
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
    console.log('Looking up user for email:', email);
    let userId = null;
    if (email) {
        console.log("Inside user lookup with email:", email);

        const { data: userData, error: userError } = await supabase
            .from('User_Details')
            .select('id')
            .eq('email', email)
        if (userError) {
            console.log('User lookup error:', userError);
            console.log('Email provided for lookup:', email);
            console.log(userData);
        }
        if (userData && userData.length > 0) {
            console.log('User found for email:', email, 'User ID:', userData[0].id);
            userId = userData[0].id;
        } else {
            console.log('No user found for email:', email);
        }
    }

    if (!userId) {
        console.log('User ID not found for email:', email); 
        return res.status(400).json({ success: false, message: 'User not found' });
    }

    // upload files to Supabase storage under a per-user folder (userId/filename)
    const uploadedUrls = [];
    if (userId && images.length) {
        console.log("Ready for uploading files for userId:", userId, "Number of files:", images.length);
        for (const file of images) {
            try {
                console.log("Processing file:", file.originalname);
                const safeName = (file.originalname || 'upload').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
                const filename = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
                const objectPath = `${userId}/${filename}`;

                const storageClient = supabase;
                const { data: uploadData, error: uploadError } = await storageClient.storage
                    .from(bucketName)
                    .upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: false });

                if (uploadError) {
                    console.error('Upload error for', file.originalname, uploadError);
                    continue;
                }

                const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(objectPath);
                if (publicData && publicData.publicUrl) uploadedUrls.push(publicData.publicUrl);
            } catch (err) {
                console.error('Error uploading file:', err);
            }
        }
    }

    const { data, error } = await supabase
        .from('User_Reports')
        .insert([{
            category: category,
            description: description,
            latitude: latitude,
            longitude: longitude,
            complaint_date: complaintDate,
            image_urls: uploadedUrls,
            user_id: userId
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
