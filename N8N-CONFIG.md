# ⚙️ Configuration n8n - Détails Techniques

Ce document explique en détail comment configurer votre workflow n8n pour gérer le mode vocal de JARVIS V2.

---

## 📊 Architecture Complète

```
┌──────────────────────────────────────────────────────────────┐
│                          JARVIS V2                           │
│                      (Frontend Web App)                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ HTTP POST
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                     Webhook n8n                              │
│  https://n8n.srv846378.hstgr.cloud/webhook/77a6a624...      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │   IF Node    │
              │ Audio exists?│
              └──┬────────┬──┘
                 │        │
         TRUE    │        │    FALSE
      (Audio)    │        │    (Text)
                 ▼        ▼
        ┌──────────┐   ┌──────────┐
        │ Whisper  │   │   Pass   │
        │   API    │   │  Message │
        └────┬─────┘   └────┬─────┘
             │              │
             ▼              │
        ┌──────────┐        │
        │   Set    │        │
        │  Format  │        │
        └────┬─────┘        │
             │              │
             └──────┬───────┘
                    ▼
            ┌───────────────┐
            │   AI Agent    │
            │  (GPT-4.1)    │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │   Response    │
            │   to Webhook  │
            └───────────────┘
```

---

## 🔧 Configuration Détaillée des Nœuds

### 1️⃣ Nœud Webhook (Existant)

Vous avez déjà ce nœud configuré. Aucune modification nécessaire.

**Configuration actuelle** :
- Path : `77a6a624-93e6-463e-a1f4-5185239570e2`
- Method : `POST`
- Response Mode : `responseNode`
- Headers : CORS activés

---

### 2️⃣ Nouveau Nœud : IF (Détection Audio)

**Ajouter après le Webhook**

**Nom du nœud** : `Détection Type Message`

**Configuration** :
- **Condition Type** : `Boolean`
- **Value 1** : `{{ $json.body.audio !== undefined }}`
- **Operation** : `Equal`
- **Value 2** : `true`

**Explication** :
- Si `body.audio` existe → Branche TRUE (traiter l'audio)
- Si `body.audio` n'existe pas → Branche FALSE (traiter le texte)

---

### 3️⃣ Nouveau Nœud : OpenAI (Whisper)

**Connecter à la sortie TRUE du nœud IF**

**Nom du nœud** : `Transcription Audio`

**Configuration** :
- **Resource** : `Audio`
- **Operation** : `Transcribe`
- **Model** : `whisper-1`

**Binary Data** :
- **Input Data Field Name** : Laissez vide ou `data`
- **Upload Type** : `Binary Data`

**Options** :
- **Language** : `fr`
- **Response Format** : `json`
- **Temperature** : `0` (pour plus de précision)

**Input Data (Important)** :

Vous devez convertir le base64 en buffer. Utilisez ce code dans un nœud **Code** avant Whisper, ou directement si votre version de n8n le supporte :

```javascript
// Nœud Code avant Whisper
const base64Audio = $json.body.audio;
const buffer = Buffer.from(base64Audio, 'base64');

return {
  json: {
    audioBuffer: buffer,
    mimeType: $json.body.mimeType || 'audio/webm'
  }
};
```

Puis dans Whisper, utilisez `{{ $json.audioBuffer }}`.

**Alternative Simple** :

Si votre version n8n supporte directement, utilisez :
```javascript
{{ Buffer.from($json.body.audio, 'base64') }}
```

---

### 4️⃣ Nouveau Nœud : Set (Reformatage)

**Connecter à la sortie du nœud Whisper**

**Nom du nœud** : `Format Message Audio`

**Configuration** :
- **Keep Only Set** : `false`
- **Values to Set** :

| Field Name | Type   | Value                    |
|------------|--------|--------------------------|
| `message`  | String | `={{ $json.text }}`      |

**Explication** :
Ce nœud prend le texte transcrit par Whisper (`$json.text`) et le reformate en `{ message: "..." }` pour que l'AI Agent puisse le traiter.

---

### 5️⃣ Branche FALSE : Set (Message Texte)

**Connecter à la sortie FALSE du nœud IF**

**Nom du nœud** : `Format Message Texte`

**Configuration** :
- **Keep Only Set** : `false`
- **Values to Set** :

| Field Name | Type   | Value                      |
|------------|--------|----------------------------|
| `message`  | String | `={{ $json.body.message }}`|

**Explication** :
Ce nœud passe simplement le message texte au bon format.

---

### 6️⃣ Connexion à l'AI Agent (Existant)

Les deux nœuds Set (audio et texte) doivent se connecter à votre nœud **AI Agent** existant.

**Rien à modifier dans l'AI Agent**, il reçoit toujours `{ message: "..." }`.

---

## 📝 Exemple de Flux de Données

### Cas 1 : Message Texte

**Frontend envoie** :
```json
{
  "message": "Quelle est la météo aujourd'hui ?",
  "timestamp": "2024-12-10T19:00:00Z"
}
```

**IF Node** : FALSE → Branche texte

**Set Node (texte)** :
```json
{
  "message": "Quelle est la météo aujourd'hui ?"
}
```

**AI Agent** reçoit et traite normalement.

---

### Cas 2 : Message Vocal

**Frontend envoie** :
```json
{
  "audio": "UklGRiQAAABXQVZFZm10IBAAA...",
  "mimeType": "audio/webm;codecs=opus",
  "timestamp": "2024-12-10T19:00:00Z"
}
```

**IF Node** : TRUE → Branche audio

**Whisper Node** transcrit :
```json
{
  "text": "Quelle est la météo aujourd'hui ?"
}
```

**Set Node (audio)** :
```json
{
  "message": "Quelle est la météo aujourd'hui ?"
}
```

**AI Agent** reçoit et traite normalement.

---

## 🔍 Débogage

### Tester le Workflow

1. **Test manuel dans n8n** :
   - Cliquez sur "Execute Workflow"
   - Envoyez un test avec :
   ```json
   {
     "body": {
       "message": "test"
     }
   }
   ```

2. **Logs du Webhook** :
   - Cliquez sur le nœud Webhook
   - Allez dans "Executions"
   - Vérifiez les données reçues

3. **Test avec l'application** :
   - Ouvrez la console du navigateur (F12)
   - Envoyez un message
   - Vérifiez la requête dans l'onglet "Network"

---

## ⚡ Optimisations

### 1. Gestion d'Erreurs

Ajoutez un nœud **Error Trigger** pour capturer les erreurs :

```javascript
// Nœud Set en cas d'erreur
{
  "reply": "❌ Désolé, une erreur est survenue. Pouvez-vous réessayer ?"
}
```

### 2. Cache des Transcriptions

Si vous voulez garder un historique des transcriptions :

Ajoutez un nœud **Google Sheets** après Whisper :
- Sauvegardez `$json.text` et `timestamp` dans une feuille

### 3. Limitation de Taille Audio

Ajoutez un nœud **IF** avant Whisper pour vérifier la taille :

```javascript
{{ $json.body.audio.length < 10000000 }}
```

(10MB en base64 ≈ 7.5MB d'audio)

---

## 📊 Coûts OpenAI Whisper

**Tarification** (Décembre 2024) :
- Whisper : **$0.006 / minute** d'audio

**Exemples** :
- 10 secondes d'audio = $0.001
- 1 minute d'audio = $0.006
- 100 messages vocaux/jour (moyenne 20s) = ~$0.33/jour = $10/mois

---

## 🔐 Sécurité

### Bonnes Pratiques

1. **Rate Limiting** :
   - Limitez le nombre de requêtes par IP
   - Ajoutez un délai entre les requêtes

2. **Validation des Données** :
   - Vérifiez que `audio` est bien du base64
   - Limitez la taille maximale

3. **Logs** :
   - Activez les logs dans n8n
   - Surveillez les erreurs

---

## ✅ Checklist de Configuration

- [ ] Nœud IF ajouté après Webhook
- [ ] Nœud OpenAI (Whisper) configuré
- [ ] Nœud Set (Format Audio) ajouté
- [ ] Nœud Set (Format Texte) ajouté
- [ ] Les deux branches convergent vers AI Agent
- [ ] Workflow testé avec message texte
- [ ] Workflow testé avec message vocal
- [ ] Clé API OpenAI valide et active
- [ ] Logs activés pour débogage

---

## 🆘 Problèmes Fréquents

### Erreur : "Invalid audio format"
- Vérifiez que le base64 est bien décodé en Buffer
- Vérifiez le mimeType de l'audio

### Erreur : "text is undefined"
- Whisper n'a pas pu transcrire (audio trop court ou silence)
- Ajoutez une validation de la durée minimale

### Erreur : "Request Entity Too Large"
- L'audio est trop gros (>25MB)
- Ajoutez une limite côté frontend

### Pas de transcription
- Vérifiez votre quota OpenAI
- Vérifiez que la clé API a accès à Whisper
- Testez directement l'API Whisper

---

## 📚 Ressources

- [Documentation n8n](https://docs.n8n.io/)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

---

**Configuration terminée ! 🎉**

Votre JARVIS V2 est maintenant capable de comprendre vos messages vocaux !
