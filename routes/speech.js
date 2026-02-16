import "dotenv/config";
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import speech from '@google-cloud/speech';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

const client = new speech.SpeechClient({
    keyFilename: process.env.GOOGLE_CLOUD_SPEECH_APPLICATION_CREDENTIALS
});
router.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const fileContent = fs.readFileSync(filePath);

        const audioBytes = fileContent.toString('base64');
        const audio = { content: audioBytes };
        const config = {
            encoding: 'WEBM_OPUS',
            languageCode: 'en-US',
        };
        const request = { audio, config };
        const [response] = await client.recognize(request);
        const transcription = response.results
            .map(result => result
                .alternatives[0].transcript)
            .join('\n');
        console.log(`Transcription: ${transcription}`);
        res.json({ transcription });
    } catch (error) {
        console.error('Error during transcription:', error);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    } finally {
        if (req.file) {
            fs.unlink(req.file.path, err => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
        }
    }
});

export default router;