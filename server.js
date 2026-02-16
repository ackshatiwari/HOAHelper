import express from "express";
import "dotenv/config";
import path from "path";
import { supabase } from "./client.js";
import multer from "multer";
import crypto from "crypto";
import speechRouter from "./routes/speech.js";

const app = express();
const port = 3000;

const __dirname = path.resolve();

//middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/speech', speechRouter);
// use memory storage so we can upload buffers directly to Supabase
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });



function formatDateTimeHHMM(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}



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



//GET Request Endpoints
app.get("/getComplaints", async (req, res) => {
    const { data, error } = await supabase
        .from('User_Reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
    if (error) {
        console.log('Error fetching complaints:', error);
        return res.json({ success: false, message: error.message });
    }
    //now find the users first name through the foreign key user_id
    const userIds = data.map(complaint => complaint.user_id);
    const { data: userData, error: userError } = await supabase
        .from('User_Details')
        .select('id, full_name')
        .in('id', userIds);
    if (userError) {
        console.log('Error fetching user details:', userError);
        return res.json({ success: false, message: userError.message });
    }
    const userMap = {};
    userData.forEach(user => {
        userMap[user.id] = user.full_name;
    }
    );
    const complaintsWithNames = data.map(complaint => ({
        ...complaint,
        homeowner_name: userMap[complaint.user_id] || 'Unknown'
    }));
    res.json({ success: true, complaints: complaintsWithNames });
});

app.get("/getRecentComplaints", async (req, res) => {

    const email = req.query.email;
    console.log('Fetching recent complaints for email:', email);
    const { data: userData, error: userError } = await supabase
        .from('User_Details')
        .select('id')
        .eq('email', email)
        .single();
    if (userError) {
        console.log('Error fetching user details:', userError);
        return res.json({ success: false, message: userError.message });
    }
    console.log('Found user data:', userData);
    const userId = userData.id;
    const { data, error } = await supabase
        .from('User_Reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
    if (error) {
        console.log('Error fetching recent complaints:', error);
        return res.json({ success: false, message: error.message });
    }
    res.json({ success: true, complaints: data });

});

//Get Endpoints Admin.html
app.get("/api/reports", async (req, res) => {
    const { data, error } = await supabase
        .from('User_Reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
    if (error) {
        console.log('Error fetching reports:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
    return res.status(200).json({ success: true, reports: data });
});


app.get("/api/users/:id", async (req, res) => {
    const userId = req.params.id;
    console.log('Fetching user details for user ID:', userId);
    const { data, error } = await supabase
        .from('User_Details')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) {
        console.log('Error fetching user details for user ID', userId, ':', error);
        return res.status(500).json({ success: false, message: error.message });
    }
    console.log('Fetched user details for user ID', userId, ':', data);
    return res.status(200).json({ success: true, name: data.full_name, address: data.home_address });
});

app.get("/api/images/:userId&:reportId", async (req, res) => {
    const userId = req.params.userId;
    const reportId = req.params.reportId;
    console.log('Received request for images with user ID:', userId, 'and report ID:', reportId);
    console.log('Fetching images for user ID:', userId, 'and report ID:', reportId);
    const bucketName = 'Report_Images';
    try {
        const { data: listData, error: listError } = await supabase
            .storage
            .from(bucketName)
            .list(`${userId}/${reportId}/`, { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } });
        if (listError) {
            console.log('Error listing images for user ID', userId, 'and report ID', reportId, ':', listError);
            return res.status(500).json({ success: false, message: listError.message });
        }
        const imageUrls = listData.map(file => {
            const { data: pub } = supabase.storage.from(bucketName).getPublicUrl(`${userId}/${reportId}/${file.name}`);
            return pub.publicUrl;
        });
        console.log('Fetched image URLs for user ID', userId, 'and report ID', reportId, ':', imageUrls);
        return res.status(200).json({ success: true, images: imageUrls });


    } catch (error) {
        console.error('Error fetching images for user ID', userId, ':', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// POST Request Endpoints

//auth.js
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

    //redirect based on role
    const { data: userDetails, error: detailsError } = await supabase
        .from('User_Details')
        .select('role')
        .eq('id', data.user.id)
        .single();
    if (detailsError) {
        console.log('Error fetching user details:', detailsError);
        return res.json({ success: false, message: detailsError.message });
    }
    console.log('User details:', userDetails);
    return res.json({ success: true, user: data.user, role: userDetails.role, redirectedWebpage: userDetails.role === 'admin' ? '/admin' : '/homeowner' });

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


//homeowner.js

app.post("/submitComplaint", upload.array('images', 5), async (req, res) => {

    console.log("Received complaint submission");
    const bucketName = 'Report_Images';
    const form = req.body || {};
    const images = req.files || [];
    const reportId = crypto.randomUUID(); // Generate a unique ID for this report to use in storage path

    console.log('req.body:', req.body);
    console.log('req.files (images):', req.files);




    const category = form.complaintType || null;
    const description = form.complaintText || null;
    const latitude = form.latitude || null;
    const longitude = form.longitude || null;
    const complaintDate = form.complaintDate ? formatDateTimeHHMM(new Date(form.complaintDate)) : formatDateTimeHHMM(new Date());

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
        for (const file of req.files || []) {
            const safeName = (file.originalname || 'file').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
            const key = `${userId}/${reportId}/${Date.now()}-${safeName}`;
            const { error: upErr } = await supabase.storage.from(bucketName).upload(key, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });
            if (upErr) {
                console.warn('Upload failed for', file.originalname, upErr);
                continue;
            }
            const { data: pub } = supabase.storage.from(bucketName).getPublicUrl(key);
            if (pub?.publicUrl) uploadedUrls.push(pub.publicUrl);
        }

    }

    const { data, error } = await supabase
        .from('User_Reports')
        .insert([{
            created_at: complaintDate,
            category: category,
            description: description,
            latitude: latitude,
            longitude: longitude,
            complaint_date: complaintDate,
            image_urls: uploadedUrls,
            user_id: userId,
            report_id: reportId

        }]);
    if (error) {
        console.log('Error inserting complaint:', error);
        return res.json({ success: false, message: error.message });
    }
    console.log('Complaint inserted:', data);

    res.json({ success: true })
});

//admin.js
app.post('/api/admin/close/:reportId', (req, res) => {
    const reportId = req.params.reportId;
    const { comment } = req.body;
    console.log('Closing report ID:', reportId, 'with comment:', comment);

    const updateReport = async () => {
        const { data, error } = await supabase
            .from('User_Reports')
            .update({ status: 'closed' })
            .eq('report_id', reportId)
            .select();



        const { data: commentInsertData, error: commentInsertError } = await supabase
            .rpc('append_to_text_array', {
                new_value: comment,
                row_id: reportId,
            });

        if (error) {
            console.log('Error updating report status:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
        if (commentInsertError) {
            console.log('Error inserting comment:', commentInsertError);
            return res.status(500).json({ success: false, message: commentInsertError.message });
        }
        console.log('Report status updated to closed for report ID:', data);
        console.log('Comment appended to report ID:', commentInsertData);



        console.log('Report updated to closed:', data);
        return res.status(200).json({ success: true });
    };

    updateReport();
});

app.post('/api/admin/comment/:reportId', (req, res) => {
    const reportId = req.params.reportId;
    const { comment } = req.body;
    console.log('Adding comment to report ID:', reportId, 'Comment:', comment);

    const insertComment = async () => {
        const { data, error } = await supabase
            .rpc('append_to_text_array', {
                new_value: comment,
                row_id: reportId,
            });

        if (error) {
            console.log('Error inserting comment:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
        console.log('Comment inserted:', data);
        return res.status(200).json({ success: true });
    };

    insertComment();
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
