import "dotenv/config";
import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";

const app = express();
const port = Number(process.env.PORT ?? 3000);

interface User {
    id: number;
    email: string;
    name: string;
    passwordHash: string;
}
const users: User[] = [];
let nextUserId = 1;

if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET fehlt in der .env-Datei");
}


app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 30, // 30 Minuten
        },
    }),
);

app.get("/", (_req, res) => {
    res.send("Session-Authentication Demo");
});

app.get("/visits", (req, res) => {
    req.session.visits = (req.session.visits ?? 0) + 1;
    res.json({ sessionId: req.sessionID, visits: req.session.visits });
});

app.post("/register", async (req, res) => {
    const { email, name, password } = req.body ?? {};
    if (!email || !name || !password) {
        return res.status(400).json({ error: "email, name und password sind erforderlich" });
    }
    // TODO: Passwort muss mindestens 8 Zeichen lang sein (Status 400)
    if (password.length < 8) {
        return res.status(400).json({ error: "Passwort muss mindestens 8 Zeichen lang sein" });
    }
    // TODO: E-Mail bereits vergeben -> Status 409
    if (users.some((u) => u.email === email)) {
        return res.status(409).json({ error: "E-Mail bereits vergeben" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = { id: nextUserId++, email, name, passwordHash };
    users.push(user);
    // Der Hash darf nicht an den Client gesendet werden
    res.status(201).json({ id: user.id, email: user.email, name: user.name });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body ?? {};
    const user = users.find((u) => u.email === email);
    // TODO: Passwort mit bcrypt.compare prüfen. Bei unbekannter E-Mail UND bei
    //       falschem Passwort dieselbe Antwort senden: Status 401, { error: "Ungültige Zugangsdaten"}
     if (!user || typeof password !== "string" || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Ungültige Zugangsdaten" });
    }

    // Neue Session-ID nach dem Login verhindert Session Fixation
    req.session.regenerate((err) => {
        if (err) {
            return res.status(500).json({
                error: "Session konnte nicht erstellt werden"
            });
        }
        // TODO: userId in der Session speichern
        req.session.userId = user.id;

        req.session.save((saveErr) => {
            if (saveErr) {
                return res.status(500).json({
                    error: "Session konnte nicht gespeichert werden"
                });
            }
            res.json({ message: "Login erfolgreich", name: user!.name });
        });
    });
});

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});