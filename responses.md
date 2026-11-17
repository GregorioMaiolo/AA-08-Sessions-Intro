# Antworten: express-session

## Ausgaben der curl-Aufrufe

Die Sitzungs-IDs und signierten Cookie-Werte sind hier aus der Ausgabe gekürzt.

### 1. Ohne Cookie-Speicher

```text
$ curl -i http://localhost:3000/visits
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 59
ETag: W/"3b-lNwsXA/3gHkl6LJFL4+iUm31zMI"
Set-Cookie: connect.sid=s%3AcE5BlVP6PkP7ESiLehXkV1kw2MrTYBX_.858%2F3downqiwgXxK%2FkDu6p0MdoHCroL5XnQr1aqkfHc; Path=/; Expires=Sun, 15 Nov 2026 09:49:37 GMT; HttpOnly
Date: Sun, 15 Nov 2026 09:19:37 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"sessionId":"cE5BlVP6PkP7ESiLehXkV1kw2MrTYBX_","visits":1}
```

Der Server erstellt eine Sitzung und sendet ein Cookie zurück. 
Da curl das Cookie nicht speichert und bei der nächsten Anfrage nicht mitsendet, kann die nächste Anfrage diese Sitzung nicht wiederverwenden. Der Zähler beginnt dann erneut bei `1`.

### 2. Mit Cookie-Speicher

```text
$ curl -i -c cookies.txt -b cookies.txt http://localhost:3000/visits
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 59
ETag: W/"3b-6GueX6IeNzHFhnIGuGEcKhuIdPc"
Set-Cookie: connect.sid=s%3AW2w5P9RsmeiTxI-Fe9zekMAr_jr6XkDu.mllSoQwOjxVE1YkdP%2FvmWkRZMh2v5OjnPODS746EKmE; Path=/; Expires=Sun, 15 Nov 2026 09:50:35 GMT; HttpOnly
Date: Sun, 15 Nov 2026 09:20:35 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"sessionId":"W2w5P9RsmeiTxI-Fe9zekMAr_jr6XkDu","visits":1}
```

`-c cookies.txt` speichert das empfangene Cookie. In diesem ersten Aufruf mit Cookie-Speicher existiert noch keine Sitzung im Cookie-Speicher; daher wird eine neue Sitzung angelegt und der Zähler ist `1`.

### 3. Erneut mit demselben Cookie-Speicher

```text
$ curl -i -c cookies.txt -b cookies.txt http://localhost:3000/visits
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 59
ETag: W/"3b-SJlrjW335xDutbvAp+6tQfX2eNo"
Set-Cookie: connect.sid=s%3AW2w5P9RsmeiTxI-Fe9zekMAr_jr6XkDu.mllSoQwOjxVE1YkdP%2FvmWkRZMh2v5OjnPODS746EKmE; Path=/; Expires=Sun, 15 Nov 2026 09:50:54 GMT; HttpOnly
Date: Sun, 15 Nov 2026 09:20:54 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"sessionId":"W2w5P9RsmeiTxI-Fe9zekMAr_jr6XkDu","visits":2}
```

`-b cookies.txt` sendet das gespeicherte Cookie zurück. Der Server findet damit dieselbe Sitzung und erhöht den Zähler von `1` auf `2`. Da die Sitzung bei der Antwort aktualisiert wird, wird auch die Ablaufzeit erneuert.

## Cookie `connect.sid` in den Browser-Entwicklertools

Nach mehreren Aufrufen von `http://localhost:3000/visits` wurde in Edge unter **DevTools → Application → Cookies → http://localhost:3000** das Cookie `connect.sid` angezeigt. Die Werte der Attribute waren:

| Attribut | Wert |
|---|---|
| HttpOnly | Ja |
| Expires / Max-Age | Läuft etwa 30 Minuten nach dem Setzen ab (`Expires`); kein `Max-Age`-Attribut |
| Secure | Nein (nicht gesetzt) |
| SameSite | Nicht gesetzt |

Der DevTools-Screenshot wurde während dieser Sitzung aufgenommen:

![Cookie connect.sid in den Edge-Entwicklertools](./bild.png)

## Session-Speicher

`express-session` speichert Sitzungsdaten standardmäßig im `MemoryStore`, also im Arbeitsspeicher des Node.js-Prozesses. Dieser Speicher ist laut Dokumentation nicht für den Produktivbetrieb gedacht: Er kann unter typischer Last Speicher verlieren (Memory Leak), wird nicht zwischen mehreren Prozessen geteilt und Sessions gehen beim Neustart des Prozesses verloren. Er eignet sich daher nur für Entwicklung und Debugging.

Zwei Alternativen für persistente Session-Stores:

1. **connect-mongo** – speichert Sessions in MongoDB.
2. **connect-redis** – speichert Sessions in Redis.


## Registrierung und Login mit bcrypt

Die `/register` mit `404` beantwortete. Nach einem Neustart der aktuellen App kann `3001` in den Befehlen durch `3000` ersetzt werden. Die Cookie-Datei wurde für den Test separat gehalten.

Vor den drei Aufrufen wurde `/visits` einmal mit demselben Cookie-Speicher
aufgerufen, um die Session-ID vor dem Login zu vergleichen. Die ID wird hier aus Sicherheitsgründen gekürzt.

### 1. Registrierung

```text
$ curl -i -H "Content-Type: application/json" -d "{\"email\":\"anna@example.com\",\"name\":\"Anna\",\"password\":\"geheim123\"}" http://localhost:3001/register
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 49
ETag: W/"31-jfhEEz0F1eF5S5fGS0cF68JEvRY"
Date: Sun, 15 Nov 2026 10:39:22 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":1,"email":"anna@example.com","name":"Anna"}

```

Die Registrierung war erfolgreich. Der Passwort-Hash wird nicht in der Antwort zurückgegeben.

### 2. Login mit falschem Passwort

```text
$ curl -i -c cookies.txt -b cookies.txt -H "Content-Type: application/json" -d "{\"email\":\"anna@example.com\",\"password\":\"falsch\"}" http://localhost:3001/login
HTTP/1.1 401 Unauthorized
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 35
ETag: W/"23-+tMxT+nKEucsoEMwB5S7lUJ/89Q"
Date: Sun, 15 Nov 2026 10:40:22 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Ungültige Zugangsdaten"}

```

### 3. Login mit richtigem Passwort

```text
$ curl -i -c cookies.txt -b cookies.txt -H "Content-Type: application/json" -d "{\"email\":\"anna@example.com\",\"password\":\"geheim123\"}" http://localhost:3001/login
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 45
ETag: W/"2d-MSwrIJnlbmHZzMwv0pjpxSvskUs"
Set-Cookie: connect.sid=s%3AFi1mkzER-pdfvimFNIyoMSSorgQ2bScW.jUWSAlDIb4kICZ2GJN3YrcUlpHYPZbE5xU4Of7DnHvI; Path=/; Expires=Sun, 15 Nov 2026 11:10:43 GMT; HttpOnly
Date: Sun, 15 Nov 2026 10:40:43 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"message":"Login erfolgreich","name":"Anna"}
```

### Warum ist bcrypt für Passwörter besser geeignet als z. B. SHA-256? Was bedeuten Salt und Cost Factor?
bcrypt speichert kein entschlüsselbares Passwort, sondern berechnet daraus einen Hash, der nur in eine Richtung funktioniert. Das ursprüngliche Passwort kann also nicht zurückgewonnen werden.

Warum bcrypt besser als SHA-256 ist:
- SHA-256 ist sehr schnell. Dadurch können Angreifer sehr viele Passwörter in kurzer Zeit ausprobieren.
- bcrypt ist absichtlich langsam und macht das massenhafte Ausprobieren von Passwörtern deutlich aufwendiger.
- Beim Login prüft bcrypt.compare das eingegebene Passwort mit dem gespeicherten Hash, ohne das ursprüngliche Passwort zurückzugewinnen.

Salt:
Ein Salt ist eine zufällig generierte Zeichenfolge, die beim Hashen hinzugefügt wird. Dadurch erhalten auch zwei Benutzer mit demselben Passwort unterschiedliche Hashes. Das erschwert Angriffe mit vorberechneten Hash-Tabellen (Rainbow Tables).

Cost Factor:
Der Cost Factor bestimmt, wie aufwendig die Hash-Berechnung ist. Je höher er ist, desto länger dauert die Berechnung. Eine Erhöhung um 1 verdoppelt ungefähr den Rechenaufwand. Dadurch wird es für Angreifer schwieriger, viele Passwörter auszuprobieren.


### Warum dieselbe Fehlermeldung
Für eine unbekannte E-Mail-Adresse und für ein falsches Passwort wird dieselbe Fehlermeldung mit Status `401` gesendet. Dadurch verrät die Antwort nicht, ob ein bestimmtes Konto existiert. Das erschwert **Benutzer-/Account-Enumeration**, also das systematische Ermitteln gültiger E-Mail-Adressen durch Ausprobieren von Login-Anfragen.

### Wurde die Set-Cookie-Session-ID beim erfolgreichen Login gegenüber einem vorherigen Aufruf von /visits verändert? Begründen Sie das mit dem Aufruf von regenerate

Beim vorherigen Aufruf von `/visits` war die Session-ID eine andere als die `connect.sid`-ID der erfolgreichen Login-Antwort. Das ist beabsichtigt: `req.session.regenerate()` verwirft die bisherige Session und erzeugt eine neue Session-ID. So wird verhindert, dass nach dem Login dieselbe, möglicherweise bereits bekannte ID weiterverwendet wird (Session Fixation).


## Cookie-Optionen und Gesamttest

 Da die App Benutzer nur im Arbeitsspeicher speichert, wurde Anna in der frischen Serverinstanz erneut registriert (`201 Created`). Die Tests verwendeten eine separate Cookie-Datei.

Die fünf Aufrufe ergaben:

| Aufruf | Ergebnis | Bedeutung |
|---|---|---|
| `curl -i http://localhost:3001/me` | `401 Unauthorized` — `{"error":"Nicht angemeldet"}` | Ohne angemeldete Session darf `/me` die Benutzerdaten nicht liefern. |
| `curl -i -c cookies.txt -b cookies.txt -H "Content-Type: application/json" -d "{\"email\":\"anna@example.com\",\"password\":\"geheim123\"}" http://localhost:3001/login` | `200 OK` — `{"message":"Login erfolgreich","name":"Anna"}` | Die Zugangsdaten stimmen; der Server erstellt eine authentifizierte Session und sendet `connect.sid`. |
| `curl -i -b cookies.txt http://localhost:3001/me` | `200 OK` — `{"id":1,"email":"anna@example.com","name":"Anna"}` | Das Cookie weist die Anmeldung nach; der geschützte Endpunkt gibt öffentliche Benutzerdaten zurück. |
| `curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:3001/logout` | `200 OK` — `{"message":"Logout erfolgreich"}` | Die Session wird serverseitig zerstört und das Cookie im Browser/Cookie-Speicher abgelaufen gesetzt (`Expires=Thu, 01 Jan 1970...`). |
| `curl -i -b cookies.txt http://localhost:3001/me` | `401 Unauthorized` — `{"error":"Nicht angemeldet"}` | Nach dem Logout enthält der Cookie-Speicher kein gültiges Sitzungs-Cookie mehr. |

Zusätzlich wurde eine Kopie des Session-Cookies von vor dem Logout aufbewahrt und nach dem Logout explizit mit `curl -i -b <alte-cookie-datei> .../me` gesendet. Auch das ergab `401 Unauthorized`. Das Cookie enthält lediglich die Session-ID, nicht die Session selbst. Beim Logout löscht `req.session.destroy` die zugehörigen Daten aus dem serverseitigen Store; deshalb kann der Server die alte ID keiner angemeldeten Session mehr zuordnen. Das alte Cookie ist dadurch wertlos, selbst wenn man dessen Zeichenfolge behalten hat.

### Was die Cookie-Optionen schützen

- **`httpOnly: true`** verhindert, dass JavaScript im Browser das Cookie über `document.cookie` ausliest. Das erschwert bei einem **XSS-Angriff** den direkten Diebstahl der Session-ID. Es verhindert XSS selbst nicht: eingeschleustes Skript kann unter Umständen weiterhin Aktionen im Namen der angemeldeten Person ausführen.
- **`sameSite: "lax"`** beschränkt, wann der Browser das Cookie bei
  seitenübergreifenden Anfragen mitsendet. Dadurch wird das Risiko von
  **CSRF-Angriffen** verringert, bei denen eine fremde Webseite den Browser zu einer ungewollten Anfrage an die angemeldete App bringt. SameSite ist eine Schutzschicht, kein Ersatz für CSRF-Tokens und sichere Methoden für zustandsändernde Aktionen.
- **`secure: true`** weist den Browser an, das Cookie nur über **HTTPS** zusenden. So wird verhindert, dass das Cookie bei einer unverschlüsselten HTTP-Verbindung mitgesendet und dort leichter **abgehört** wird. Es schütztnicht vor XSS oder CSRF.

In der lokalen Entwicklung wird die App unter `http://localhost` und nicht
über HTTPS aufgerufen. Ein `Secure`-Cookie soll nur über HTTPS übertragen
werden; bei HTTP sendet der Browser es daher normalerweise nicht, und die
Session funktioniert nicht wie erwartet. Darum verwendet die App
`secure: false` in der Entwicklung und `secure: true`, wenn
`NODE_ENV === "production"` gilt. Im Produktivbetrieb muss die Anwendung über HTTPS erreichbar sein.

## Fragen zu Sessions und Authentifizierung

1. **Warum ist HTTP zustandslos? Wie helfen Sessions und Cookies?**  
   HTTP-Anfragen sind voneinander unabhängig: Der Server merkt sich nicht
   automatisch, dass zwei Anfragen vom selben Browser stammen. Im Test sah man das bei curl ohne Cookie-Datei: `/visits` begann bei jeder neuen Sitzung wieder bei `1`. Mit `-c` und `-b` wurde `connect.sid` gespeichert und zurückgesendet; so konnte der Server dieselbe Session erkennen und den Zähler beim nächsten Aufruf auf `2` erhöhen. Das Cookie verbindet einzelne HTTP-Anfragen mit einer serverseitigen Session.

2. **Was liegt im Cookie und was auf dem Server? Warum nicht alle Daten ins Cookie?**  
   Im Cookie `connect.sid` steht eine signierte Session-ID. Die Sitzungsdaten, zum Beispiel `userId` und `visits`, liegen im Session-Store auf dem Server. Auch die Demo-Benutzer mit ihrem Passwort-Hash liegen derzeit in einer In-Memory-Liste auf dem Server. Würden alle Daten im Cookie liegen, könnte der Client diese Daten bei jeder Anfrage mitliefern und versuchen, sie zu verändern. Ein signiertes Cookie schützt zwar die Integrität, aber nicht die Vertraulichkeit seines Inhalts; außerdem wäre es grösser und müsste bei jeder Anfrage übertragen werden. Serverseitige Daten können geheim bleiben und lassen sich zentral ändern oder widerrufen.

3. **Wozu dient `SESSION_SECRET`? Was könnte ein Angreifer mit dem Wert tun?**  
   `express-session` verwendet das Secret, um das Session-Cookie zu signieren. Der Server kann so erkennen, ob die Cookie-ID manipuliert wurde. Kennt ein Angreifer das Secret, kann er gültige Signaturen für manipulierte Session-Cookies erzeugen und die Vertrauensprüfung untergraben. Das Secret allein verrät ihm nicht automatisch die serverseitigen Session-Daten oder die zufällige Session-ID eines Opfers; zusammen mit einer bekannten oder gestohlenen ID kann es aber die Übernahme einer Session erleichtern. Darum gehört ein langes, zufälliges Secret in eine geschützte Umgebungsvariable und nicht in den Quellcode.

4. **Was bedeuten `resave` und `saveUninitialized`? Warum ist `false` sinnvoll?**  
   `resave: false` bedeutet, dass eine unveränderte Session nicht bei jeder Anfrage erneut vollständig gespeichert wird. `saveUninitialized: false` bedeutet, dass eine neue, noch nicht veränderte Session gar nicht erst im Store gespeichert und kein unnötiges Session-Cookie dafür gesetzt wird. Das spart Speicher und vermeidet, schon für einen blossen Besuch ohne Anmelde- oder Sessionbedarf ein identifizierendes Cookie anzulegen. Das unterstützt Datenminimierung und kann für DSGVO-/Cookie-Banner-Fragen relevant sein, ist aber für sich allein keine rechtliche Beurteilung und ersetzt keine Prüfung der konkreten Einwilligungs- und Informationspflichten. Im Demo-Code wird eine Session beispielsweise beim Zählen in `/visits` oder beim erfolgreichen Login verändert und kann dann gespeichert werden.

5. **Was ist Session Fixation? Wie hilft `req.session.regenerate()`?**  
   Bei Session Fixation bringt ein Angreifer das Opfer dazu, eine Session-ID zu verwenden, die dem Angreifer bereits bekannt ist. Meldet sich das Opfer mit dieser Session an und bleibt die ID gleich, könnte der Angreifer die angemeldete Session übernehmen. Im Login-Code ruft die App nach erfolgreicher Passwortprüfung `req.session.regenerate()` auf. Dadurch wird die alte Session verworfen und eine neue ID erstellt, bevor `userId` in der neuen Session gespeichert wird. Im Test war die ID nach erfolgreichem Login gegenüber der vorherigen ID verschieden.

6. **Was ist CSRF? Wie hilft `sameSite` und warum reicht es nicht immer?**  
   Bei einem Cross-Site Request Forgery (CSRF) bringt eine fremde Webseite den Browser einer angemeldeten Person dazu, ungewollt eine Anfrage an die App zu senden. Der Browser könnte dabei automatisch das Session-Cookie mitschicken. `sameSite: "lax"` schränkt das Mitsenden bei vielen seitenübergreifenden Anfragen ein und verringert damit das Risiko. Es ist aber keine vollständige CSRF-Lösung: Es gibt erlaubte Navigationsfälle, Browser- und Anwendungsspezifika sowie mögliche same-site Angriffe. Zustandsändernde
   Aktionen sollten zusätzlich durch CSRF-Tokens oder geeignete Origin-Prüfungen geschützt und nicht über GET ausgeführt werden.

7. **Session-Authentifizierung und JWT: je zwei Vor- und Nachteile**  
   Bei Sessions speichert der Server den Zustand; der Client schickt bei jeder Anfrage die Session-ID als Cookie. Bei JWT enthält ein vom Server signiertes Token Claims, die der Server prüft; je nach Aufbau muss dafür nicht bei jeder Anfrage ein Session-Eintrag nachgeschlagen werden.

   **Sessions – Vorteile:** 
   - Logout und Sperren sind einfach, weil der Server-Eintrag gelöscht oder geändert werden kann. 
   - Das Cookie enthält nur eine undurchsichtige ID, die Anwendungsdaten bleiben serverseitig.
   
   **Sessions – Nachteile:** 
   - Der Session-Store muss verfügbar sein und bei mehreren Servern gemeinsam genutzt werden. 
   - Cookie-basierte Sessions müssen gegen CSRF abgesichert werden.

   **JWT – Vorteile:** 
   - Ein Server kann ein gültig signiertes Token oft ohne zentralen Session-Lookup prüfen, was verteilte APIs vereinfachen kann.
   - Token lassen sich gut für verschiedene Dienste oder Clients einsetzen, wenn diese ein passendes Token erhalten.
   
   **JWT – Nachteile:** 
   - Ein bereits ausgestelltes Token lässt sich bis zum Ablauf schwer sofort widerrufen; dafür braucht man zum Beispiel kurze Laufzeiten oder eine Sperrliste. 
   - Gestohlene Bearer-Tokens können bis zum Ablauf missbraucht werden, und Claims im signierten JWT sind nicht automatisch geheim. JWTs im Browser müssen ausserdem sicher gespeichert und bei Cookie-Transport gegen CSRF geschützt werden.

8. **Warum ist `MemoryStore` mit Load Balancing problematisch? Wie löst man das?**  
   Jede Node.js-Instanz hat ihren eigenen Arbeitsspeicher. Wenn eine Anfrage mit einer Session bei Server A landet und die nächste wegen Load Balancing bei Server B, kennt B die Session aus As `MemoryStore` nicht und behandelt den Benutzer möglicherweise als abgemeldet. Ein Neustart löscht die gespeicherten Sessions ebenfalls. Die übliche Lösung ist ein gemeinsamer, für alle Instanzen erreichbarer Session-Store, etwa Redis oder MongoDB (zum Beispiel `connect-redis` oder `connect-mongo`). Sticky Sessions können Anfragen vorübergehend an dieselbe Instanz lenken, ersetzen aber keinen gemeinsamen, dauerhaften Store.

9. **Welche weiteren Massnahmen braucht eine produktive Anwendung?**  
   - **HTTPS überall und `Secure`-Cookies:** schützt Zugangsdaten und
     Session-Cookies auf dem Transportweg vor Mitlesen und Manipulation.
   - **Rate Limiting und gegebenenfalls Verzögerungen beim Login:** erschwert
     automatisiertes Ausprobieren vieler Passwörter; zusätzlich sollte es
     Überwachung und angemessene Sperr-/Drosselungsregeln geben.
   - **Persistente Datenbank für Benutzer und gemeinsamer Session-Store:** die
     aktuelle Demo verliert sowohl die Benutzerliste als auch MemoryStore-
     Sessions beim Neustart; produktive Daten müssen dauerhaft und
     instanzübergreifend verfügbar sein.
   - **Session-Timeouts und Erneuerung:** begrenzte Inaktivitäts- und absolute
     Laufzeiten reduzieren das Zeitfenster, in dem ein gestohlenes Cookie
     nutzbar ist. Nach Login und Berechtigungsänderungen sollte die ID erneuert
     werden; Logout muss serverseitig widerrufen.
   - **CSRF-Schutz und sichere Eingabevalidierung:** SameSite allein schützt
     nicht in jedem Fall. CSRF-Tokens/Origin-Prüfungen sowie Prüfung aller
     Eingaben verhindern weitere häufige Angriffswege.
   - **Geheimnisse, Passwörter und Betrieb absichern:** `SESSION_SECRET` sicher
     verwalten und rotieren können, Passwörter nur mit einem geeigneten
     Passwort-Hash speichern, Abhängigkeiten aktualisieren und sicherheits-
     relevante Ereignisse protokollieren, ohne Passwörter oder Session-IDs in
     Logs zu schreiben.
