import express from "express";
import sql from "mssql";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Serve Vite build files
app.use(express.static("dist"));

const config = {
    user: "sa",
    password: "Etr@2025",
    server: "162.246.16.26\\DEMOSQL", 
    database: "ETRIS-Demo",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// 🔹 LOGIN API
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        await sql.connect(config);

        const result = await sql.query`
            SELECT PasswordHash FROM Users WHERE Username = ${username}
        `;

        if (result.recordset.length === 0) {
            return res.status(401).send("User not found");
        }

        const dbPassword = result.recordset[0].PasswordHash;

        if (dbPassword === password) {
            res.send("Login successful");
        } else {
            res.status(401).send("Invalid password");
        }

    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 🔹 Serve React app for all other routes
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(3000, () => console.log("Server running on port 3000"));