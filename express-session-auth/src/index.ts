import "dotenv/config";
import express from "express";
import session from "express-session";

const app = express();
const port = Number(process.env.PORT ?? 3000);

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

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});