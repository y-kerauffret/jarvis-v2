# 🚀 Guide de Déploiement Rapide - JARVIS V2

Ce guide vous accompagne étape par étape pour déployer JARVIS V2 sur GitHub Pages.

---

## ✅ Prérequis

- Un compte GitHub ([créer un compte](https://github.com/signup))
- Le projet jarvis-v2 est prêt dans `/home/user/jarvis-v2`

---

## 📋 Étapes de Déploiement

### ÉTAPE 1️⃣ : Créer le Repository GitHub

1. Allez sur [github.com](https://github.com) et connectez-vous
2. Cliquez sur le bouton vert **"New"** (ou le **+** en haut à droite → New repository)
3. Remplissez le formulaire :
   - **Repository name** : `jarvis-v2`
   - **Description** : "JARVIS V2 - Assistant IA avec mode vocal"
   - Sélectionnez **Public**
   - ⚠️ **NE COCHEZ PAS** "Add a README file"
4. Cliquez sur **"Create repository"**

---

### ÉTAPE 2️⃣ : Connecter votre Code au Repository

GitHub va vous afficher une page avec des instructions. Vous allez utiliser la section **"…or push an existing repository from the command line"**.

#### Option A : Avec Personal Access Token (Recommandé)

1. **Créer un Personal Access Token** :
   - Allez sur [github.com/settings/tokens](https://github.com/settings/tokens)
   - Cliquez sur **"Generate new token"** → **"Generate new token (classic)"**
   - Donnez-lui un nom : `jarvis-v2-deploy`
   - Cochez la case **"repo"** (accès complet aux repositories)
   - Cliquez sur **"Generate token"**
   - ⚠️ **COPIEZ LE TOKEN** (vous ne pourrez plus le voir après !)

2. **Pousser le code** :
   ```bash
   cd /home/user/jarvis-v2

   # Ajoutez le remote avec votre token
   # Remplacez YOUR_TOKEN et YOUR_USERNAME
   git remote add origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/jarvis-v2.git

   # Poussez le code
   git push -u origin main
   ```

#### Option B : Avec SSH (Si vous avez une clé SSH configurée)

```bash
cd /home/user/jarvis-v2

# Ajoutez le remote SSH
git remote add origin git@github.com:YOUR_USERNAME/jarvis-v2.git

# Poussez le code
git push -u origin main
```

---

### ÉTAPE 3️⃣ : Activer GitHub Pages

1. Sur GitHub, allez dans votre repository `jarvis-v2`
2. Cliquez sur l'onglet **"Settings"** (⚙️ en haut)
3. Dans le menu de gauche, descendez et cliquez sur **"Pages"**
4. Sous **"Build and deployment"** :
   - **Source** : Sélectionnez `Deploy from a branch`
   - **Branch** : Sélectionnez `main` et `/ (root)`
   - Cliquez sur **"Save"**

5. Attendez 2-3 minutes pour le déploiement

---

### ÉTAPE 4️⃣ : Accéder à votre Application

Votre application sera disponible à l'adresse :

```
https://YOUR_USERNAME.github.io/jarvis-v2/
```

Remplacez `YOUR_USERNAME` par votre nom d'utilisateur GitHub.

Par exemple, si votre nom d'utilisateur est `y-kerauffret`, l'URL sera :
```
https://y-kerauffret.github.io/jarvis-v2/
```

---

## 🎤 Configuration n8n pour le Mode Vocal

Pour que le mode vocal fonctionne, vous devez ajouter OpenAI Whisper dans votre workflow n8n.

### Schéma Simple

```
Webhook → IF (audio?) → Whisper → Set → AI Agent → Respond
                ↓
              Message texte → AI Agent → Respond
```

### Configuration Détaillée

1. **Ouvrir votre workflow** : "JARVIS Chat Workflow"

2. **Ajouter un nœud IF** après le Webhook :
   - Condition : `{{ $json.body.audio !== undefined }}`

3. **Si TRUE (audio présent)** :
   - Ajouter un nœud **OpenAI**
   - Type : Audio → Transcribe
   - Model : whisper-1
   - Input : `{{ Buffer.from($json.body.audio, 'base64') }}`
   - Language : `fr`

4. **Ajouter un nœud Set** après Whisper :
   ```json
   {
     "message": "={{ $json.text }}"
   }
   ```

5. **Si FALSE (texte)** :
   - Le message passe directement : `{{ $json.body.message }}`

6. **Les deux branches** convergent vers votre **AI Agent** existant

---

## 🧪 Tester l'Application

### Test Chat Texte
1. Ouvrez l'application dans votre navigateur
2. Tapez "Bonjour JARVIS" dans la zone de texte
3. Appuyez sur Entrée ou cliquez sur le bouton d'envoi
4. Vous devriez recevoir une réponse

### Test Mode Vocal
1. Cliquez sur le bouton **microphone** (bleu)
2. Autorisez l'accès au microphone si demandé
3. Le bouton devient **rouge et pulse** → parlez votre message
4. Cliquez à nouveau pour arrêter
5. L'audio sera transcrit et traité

---

## 📱 Installer sur Mobile

### Sur iPhone/iPad
1. Ouvrez l'app dans **Safari**
2. Appuyez sur le bouton **Partager** (carré avec flèche vers le haut)
3. Descendez et sélectionnez **"Sur l'écran d'accueil"**
4. Appuyez sur **"Ajouter"**

### Sur Android
1. Ouvrez l'app dans **Chrome**
2. Appuyez sur le menu **⋮** (trois points verticaux)
3. Sélectionnez **"Ajouter à l'écran d'accueil"**
4. Appuyez sur **"Ajouter"**

---

## ⚠️ Problèmes Courants

### Le push Git échoue avec "Permission denied"
- Vérifiez que vous avez bien créé un Personal Access Token
- Vérifiez que le token a les permissions "repo"
- Vérifiez que l'URL remote contient bien le token

### GitHub Pages affiche "404 Not Found"
- Attendez 3-5 minutes après l'activation
- Vérifiez que la branche est bien `main`
- Vérifiez que le dossier est bien `/ (root)`
- Actualisez en vidant le cache (Ctrl+Shift+R)

### Le microphone ne fonctionne pas
- Vérifiez que vous êtes en **HTTPS** (requis pour le microphone)
- GitHub Pages fournit automatiquement HTTPS
- Sur iOS, utilisez **Safari** (Chrome iOS ne supporte pas MediaRecorder)

### Pas de réponse de JARVIS
- Vérifiez que votre workflow n8n est **actif** (switch vert en haut)
- Vérifiez les logs du workflow dans n8n
- Vérifiez la console du navigateur (F12 → Console)

---

## 🔄 Mettre à Jour l'Application

Après avoir modifié le code :

```bash
cd /home/user/jarvis-v2

git add .
git commit -m "Description de vos modifications"
git push origin main
```

Les changements seront automatiquement déployés en 2-3 minutes.

---

## 📞 Aide

Si vous avez besoin d'aide :
1. Consultez le **README.md** pour plus de détails
2. Vérifiez la section "Résolution de problèmes"
3. Consultez les logs du navigateur (F12)
4. Vérifiez les logs de votre workflow n8n

---

## ✅ Checklist de Déploiement

- [ ] Compte GitHub créé
- [ ] Repository `jarvis-v2` créé sur GitHub
- [ ] Code poussé avec `git push`
- [ ] GitHub Pages activé dans Settings
- [ ] Application accessible via l'URL GitHub Pages
- [ ] Chat texte fonctionne
- [ ] Mode vocal fonctionne (après config n8n)
- [ ] Application installée sur mobile

---

**Bon déploiement ! 🚀**

*Une fois tout configuré, vous aurez votre propre assistant JARVIS accessible partout !*
