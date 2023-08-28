const express = require("express")
const uuid = require("uuid")
const speakeasy = require("speakeasy")
const PORT = process.env.PORT || 5000
const { JsonDB } = require("node-json-db")
const { Config } = require("node-json-db/dist/lib/JsonDBConfig")

const app = express();
app.use(express.json())

const db = new JsonDB(new Config('myDatabase', true, false, '/'));

app.get("/api", (req, res) => {
    res.json({
        message: "Welcome to api"
    })
})

app.post('/api/register', (req, res) => {
    const id = uuid.v4();

    try {
        const path = `/user/${id}`
        const temp_secret = speakeasy.generateSecret()
        db.push(path, { id, temp_secret })
        res.json({ id, secret: temp_secret.base32 })

    } catch(err) {
        console.log(err)
        res.status(500).json({ message: "Error generating secret" })
    }
})

app.post('/api/verify', async (req, res) => {
    const { token, userId } = req.body;

    
    try {
        const path = `/user/${userId}`
        const user = await db.getData(path)
        const { base32:secret } = user.temp_secret

        const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token: token });
    
        if (verified) {
            db.push(path, { id: userId, secret: user.temp_secret});
            res.json({ verified: true })
        } else {
            res.json({ verified: false })
        }

    } catch(err) {
        console.log(err)
        res.status(500).json({ message: "Error finding user" })
    }
})

app.post('/api/validate', async (req, res) => {
    const { token, userId } = req.body;

    
    try {
        const path = `/user/${userId}`
        const user = await db.getData(path)
        const { base32:secret } = user.secret

        const tokenValidate = speakeasy.totp.verify({ secret, encoding: 'base32', token: token, window: 1 });
    
        if (tokenValidate) {
            res.json({ validated: true })
        } else {
            res.json({ validated: false })
        }

    } catch(err) {
        console.log(err)
        res.status(500).json({ message: "Error finding user" })
    }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))