# 🤖 JARVIS V2 - Assistant IA Personnel

**JARVIS V2** est votre assistant personnel intelligent inspiré du film Iron Man, avec support complet de la **reconnaissance vocale** et une interface moderne.

![Version](https://img.shields.io/badge/version-2.0-blue)
![PWA](https://img.shields.io/badge/PWA-enabled-green)
![Voice](https://img.shields.io/badge/voice-enabled-orange)

---

## ✨ Nouveautés V2

- 🎤 **Mode vocal** avec enregistrement audio
- 🎨 **Design amélioré** avec animations fluides
- 📱 **PWA optimisée** pour mobile et desktop
- ⚡ **Performance accrue** avec Service Worker
- 🔄 **Historique étendu** (3 conversations)
- 🎯 **Interface moderne** avec indicateurs de statut

---

## 🎯 Fonctionnalités

### 💬 Chat Textuel
- Saisie de messages texte
- Effet typewriter pour les réponses
- Historique des 3 dernières conversations
- Support des touches clavier (Entrée pour envoyer)

### 🎤 Mode Vocal
- **Enregistrement audio** haute qualité
- **Transcription automatique** via OpenAI Whisper (n8n)
- **Indicateurs visuels** (bouton qui pulse en rouge pendant l'enregistrement)
- **Feedback en temps réel** avec messages de statut
- Compatible iOS et Android

### 🎨 Design
- **Thème Iron Man** avec effet Arc Reactor
- **Animations fluides** et professionnelles
- **Responsive** : s'adapte à tous les écrans
- **Mode sombre** optimisé pour la nuit

### 📱 PWA (Progressive Web App)
- Installation sur l'écran d'accueil
- Fonctionne hors ligne (interface)
- Icône personnalisée JARVIS
- Expérience native sur mobile

---

## 🚀 Déploiement sur GitHub Pages

### Étape 1 : Créer un nouveau repository

1. Allez sur [GitHub](https://github.com) et connectez-vous
2. Cliquez sur **"New repository"** (bouton vert)
3. Nommez-le : `jarvis-v2` (ou le nom de votre choix)
4. Choisissez **Public**
5. **NE PAS** cocher "Add README" (on en a déjà un)
6. Cliquez sur **"Create repository"**

### Étape 2 : Initialiser Git et pousser le code

Dans votre terminal, exécutez :

```bash
cd /home/user/jarvis-v2

# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Initial commit - JARVIS V2 with voice mode"

# Renommer la branche en 'main'
git branch -M main

# Ajouter votre repository distant (remplacez USERNAME par votre nom d'utilisateur GitHub)
git remote add origin https://github.com/USERNAME/jarvis-v2.git

# Pousser le code
git push -u origin main
```

### Étape 3 : Activer GitHub Pages

1. Sur GitHub, allez dans votre repository `jarvis-v2`
2. Cliquez sur **"Settings"** (engrenage en haut)
3. Dans le menu de gauche, cliquez sur **"Pages"**
4. Sous **"Source"**, sélectionnez :
   - Branch : `main`
   - Folder : `/ (root)`
5. Cliquez sur **"Save"**
6. Attendez 2-3 minutes

### Étape 4 : Accéder à votre application

Votre application sera accessible à :
```
https://USERNAME.github.io/jarvis-v2/
```

Remplacez `USERNAME` par votre nom d'utilisateur GitHub.

---

## ⚙️ Configuration n8n - Transcription Vocale

Pour que le mode vocal fonctionne, vous devez configurer votre workflow n8n avec OpenAI Whisper.

### Architecture du workflow

```
┌─────────────┐
│   Webhook   │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│  IF/Switch   │ ← Détecte si audio présent
│ body.audio ? │
└──┬───────┬───┘
   │       │
   │ Oui   │ Non
   ▼       ▼
┌──────┐  ┌─────────┐
│Whisper│  │ Message │
│ (AI) │  │  Texte  │
└───┬──┘  └────┬────┘
    │          │
    ▼          │
 ┌──────┐      │
 │ Set  │      │
 │Format│      │
 └───┬──┘      │
     └────┬────┘
          ▼
     ┌─────────┐
     │AI Agent │
     └────┬────┘
          ▼
   ┌─────────────┐
   │  Respond to │
   │   Webhook   │
   └─────────────┘
```

### Étape 1 : Ajouter un nœud IF après Webhook

Après votre nœud **Webhook**, ajoutez un nœud **IF** :

**Condition** :
```javascript
{{ $json.body.audio !== undefined }}
```

### Étape 2 : Branche TRUE - Ajouter OpenAI (Whisper)

Si audio détecté, créez un nœud **OpenAI** :

**Configuration** :
- **Resource** : Audio
- **Operation** : Transcribe
- **Model** : whisper-1
- **Input Data** :
  ```javascript
  {{ Buffer.from($json.body.audio, 'base64') }}
  ```
- **Language** : `fr` (français)
- **Response Format** : `json`

### Étape 3 : Reformater la sortie (Set node)

Après Whisper, ajoutez un nœud **Set** :

```json
{
  "message": "={{ $json.text }}"
}
```

### Étape 4 : Branche FALSE - Passer le message texte

Pour la branche FALSE (pas d'audio), le message texte passe directement avec le format :
```json
{
  "message": "{{ $json.body.message }}"
}
```

### Étape 5 : Fusionner vers AI Agent

Les deux branches doivent converger vers votre nœud **AI Agent** existant, qui recevra toujours un objet avec `{ message: "..." }`.

---

## 🔐 Webhook n8n

L'URL du webhook est **préservée** dans le code :

```javascript
const WEBHOOK_URL = "https://n8n.srv846378.hstgr.cloud/webhook/77a6a624-93e6-463e-a1f4-5185239570e2";
```

⚠️ **NE PAS MODIFIER** cette URL sans mettre à jour l'application.

---

## 📱 Installation sur Mobile

### iOS (Safari)
1. Ouvrez l'application dans Safari
2. Appuyez sur l'icône **Partager** (carré avec flèche)
3. Faites défiler et sélectionnez **"Sur l'écran d'accueil"**
4. Appuyez sur **"Ajouter"**

### Android (Chrome)
1. Ouvrez l'application dans Chrome
2. Appuyez sur le menu **⋮** (trois points)
3. Sélectionnez **"Ajouter à l'écran d'accueil"**
4. Appuyez sur **"Ajouter"**

---

## 🛠️ Technologies utilisées

### Frontend
- **HTML5** : Structure sémantique
- **CSS3** : Animations et gradients
- **JavaScript (Vanilla)** : Logique métier
- **MediaRecorder API** : Enregistrement audio
- **Service Worker** : Cache et mode hors ligne

### Backend / IA
- **n8n** : Automation et orchestration
- **OpenAI GPT-4.1-mini** : Agent conversationnel
- **OpenAI Whisper** : Transcription vocale
- **Gmail, Google Calendar, Contacts, Sheets** : Intégrations
- **SerpAPI** : Recherche web

### Déploiement
- **GitHub Pages** : Hébergement gratuit et HTTPS

---

## 📂 Structure du projet

```
jarvis-v2/
├── index.html       # Application principale (HTML + CSS + JS)
├── manifest.json    # Configuration PWA
├── sw.js           # Service Worker (cache)
├── icon.png        # Icône JARVIS Arc Reactor
└── README.md       # Ce fichier
```

---

## 🐛 Résolution de problèmes

### Le microphone ne fonctionne pas
1. Vérifiez les permissions du navigateur
2. Utilisez **HTTPS** (obligatoire pour l'accès micro)
3. Sur iOS : utilisez **Safari** (Chrome iOS ne supporte pas MediaRecorder)

### L'audio n'est pas transcrit
1. Vérifiez que le nœud OpenAI Whisper est configuré dans n8n
2. Vérifiez que votre clé API OpenAI est valide
3. Consultez les logs du workflow n8n

### L'application ne se charge pas
1. Vérifiez que GitHub Pages est activé
2. Attendez 3-5 minutes après l'activation
3. Videz le cache du navigateur (Ctrl+Shift+R)

### Erreur 403 lors du push Git
- Configurez un Personal Access Token GitHub
- Ou utilisez SSH au lieu de HTTPS

---

## 📝 Changelog

### Version 2.0 (Décembre 2024)
- ✅ Ajout du mode vocal avec MediaRecorder
- ✅ Intégration OpenAI Whisper pour transcription
- ✅ Nouveau design avec animations Arc Reactor
- ✅ Historique étendu (3 conversations)
- ✅ Indicateurs de statut en temps réel
- ✅ Amélioration de la PWA
- ✅ Optimisation mobile
- ✅ Service Worker amélioré

### Version 1.0
- Chat texte basique
- Intégration n8n
- PWA simple

---

## 👨‍💻 Développement

### Modifier l'application

```bash
cd /home/user/jarvis-v2
# Modifier les fichiers
git add .
git commit -m "Description des modifications"
git push origin main
```

Les changements seront automatiquement déployés sur GitHub Pages en 2-3 minutes.

### Personnaliser l'URL du webhook

Si vous avez votre propre webhook n8n, modifiez dans `index.html` :

```javascript
const WEBHOOK_URL = "VOTRE_URL_WEBHOOK_ICI";
```

---

## 📄 Licence

© JARVIS — Design by YK
Version 2.0 - Voice Enabled

---

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez la section "Résolution de problèmes"
2. Consultez les logs du navigateur (F12 → Console)
3. Vérifiez les logs de votre workflow n8n

---

**Fait avec ❤️ et ⚡ par Yannick Kerauffret**
