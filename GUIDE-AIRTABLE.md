# 📋 Configuration n8n - Endpoint Formations Airtable

Ce guide explique comment créer un endpoint n8n pour récupérer vos formations depuis Airtable et les afficher dans JARVIS V2.

---

## 🎯 Objectif

Créer un webhook n8n qui :
1. Se connecte à votre Airtable "Prestations à venir"
2. Récupère les prochaines formations
3. Retourne les données formatées en JSON

---

## 🔧 Configuration n8n

### Étape 1 : Créer un Nouveau Workflow

1. Allez dans n8n : https://n8n.srv846378.hstgr.cloud
2. Cliquez sur **"New workflow"**
3. Nommez-le : **"API Formations Airtable"**

---

### Étape 2 : Ajouter un Nœud Webhook

1. **Ajoutez un nœud "Webhook"**
2. **Configuration** :
   - **HTTP Method** : `GET`
   - **Path** : `formations-airtable`
   - **Response Mode** : `responseNode`
   - **Response Headers** :
     ```
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Headers: Content-Type
     ```

L'URL sera : `https://n8n.srv846378.hstgr.cloud/webhook/formations-airtable`

---

### Étape 3 : Ajouter le Nœud Airtable

1. **Ajoutez un nœud "Airtable"**
2. **Connectez-le au Webhook**
3. **Configuration** :
   - **Operation** : `List`
   - **Base** : Sélectionnez votre base Airtable (celle des formations)
   - **Table** : `Prestations à venir`
   - **Return All** : `true` (ou limitez à 10)
   - **Sort** :
     - **Field** : `Date 1er jour presta` (ou le champ de date)
     - **Direction** : `asc` (du plus proche au plus lointain)
   - **Filter by Formula** (optionnel) :
     ```
     IS_AFTER({Date 1er jour presta}, TODAY())
     ```
     *(Pour ne prendre que les formations futures)*

---

### Étape 4 : Ajouter un Nœud Code (Formatter)

1. **Ajoutez un nœud "Code"**
2. **Connectez-le à Airtable**
3. **Mode** : `Run Once for All Items`
4. **Code JavaScript** :

```javascript
// Récupérer toutes les formations depuis Airtable
const formations = items.map(item => {
  const fields = item.json.fields;

  // Extraire le nom du client
  let client = fields['Nom du client'] || 'Client inconnu';

  // Extraire les dates
  const date1 = fields['Date 1er jour presta'] || '';
  const date2 = fields['Date 2e jour presta'] || '';

  // Formatter la date
  let dateFormatted = '';
  if (date1) {
    const d1 = new Date(date1);
    dateFormatted = d1.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    if (date2) {
      const d2 = new Date(date2);
      const d2Formatted = d2.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      });
      dateFormatted += ` - ${d2Formatted}`;
    }
  }

  return {
    client: client,
    date: dateFormatted,
    timestamp: new Date(date1).getTime() // Pour le tri
  };
});

// Trier par date (du plus proche au plus lointain)
formations.sort((a, b) => a.timestamp - b.timestamp);

// Retourner seulement les 5 prochaines
const prochaines = formations.slice(0, 5);

return [{ json: { formations: prochaines } }];
```

**Adaptez les noms de champs** selon votre Airtable :
- `'Nom du client'` → Votre champ client
- `'Date 1er jour presta'` → Votre champ date début
- `'Date 2e jour presta'` → Votre champ date fin

---

### Étape 5 : Ajouter un Nœud Respond to Webhook

1. **Ajoutez un nœud "Respond to Webhook"**
2. **Connectez-le au nœud Code**
3. **Configuration** :
   - **Respond With** : `JSON`
   - **Response Body** : `={{ $json }}`

---

## 📊 Schéma du Workflow

```
┌──────────────┐
│   Webhook    │
│  (GET)       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Airtable   │
│  List records│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│     Code     │
│   Formatter  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Respond    │
│  to Webhook  │
└──────────────┘
```

---

## 🧪 Tester le Workflow

### 1. Activer le Workflow
- Cliquez sur le bouton **"Active"** (switch en haut à droite)

### 2. Tester dans le Navigateur
Ouvrez l'URL dans votre navigateur :
```
https://n8n.srv846378.hstgr.cloud/webhook/formations-airtable
```

**Réponse attendue** :
```json
{
  "formations": [
    {
      "client": "CNFPT Deuil la Barre",
      "date": "12/01/2026",
      "timestamp": 1736640000000
    },
    {
      "client": "CNFPT Montigny C. Magny",
      "date": "21/01/2026 - 22/01",
      "timestamp": 1737417600000
    }
    // ... jusqu'à 5 formations
  ]
}
```

---

## 🎨 Personnalisation

### Ajouter plus d'informations

Modifiez le nœud **Code** pour ajouter d'autres champs :

```javascript
return {
  client: client,
  date: dateFormatted,
  type: fields['FORMATIONS'] || '',
  lieu: fields['Nom du client'] || '',
  timestamp: new Date(date1).getTime()
};
```

Puis dans **index.html**, modifiez l'affichage :

```javascript
formationsList.innerHTML = formations.map(formation => `
  <div class="formation-item">
    <div class="formation-client">${formation.client}</div>
    <div class="formation-date">📅 ${formation.date}</div>
    <div class="formation-type">${formation.type}</div>
  </div>
`).join('');
```

---

## 🔐 Sécurité (Optionnel)

### Ajouter une Authentification

Si vous voulez sécuriser l'endpoint :

1. **Ajoutez un nœud IF après le Webhook**
2. **Condition** :
   ```javascript
   {{ $json.headers['x-api-key'] === 'VOTRE_CLE_SECRETE' }}
   ```

3. **Si FALSE** → Retourner une erreur 401

4. **Côté frontend (index.html)** :
   ```javascript
   const response = await fetch(FORMATIONS_URL, {
     headers: {
       'X-API-Key': 'VOTRE_CLE_SECRETE'
     }
   });
   ```

---

## 🐛 Dépannage

### Erreur "No data returned"
- Vérifiez que vous avez des formations futures dans Airtable
- Vérifiez le nom des champs dans le nœud Code

### Erreur CORS
- Vérifiez les headers dans le nœud Webhook :
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Headers: Content-Type
  ```

### Dates mal formatées
- Vérifiez le format de date dans Airtable
- Ajustez le code JavaScript selon votre format

---

## ✅ Checklist

- [ ] Workflow créé dans n8n
- [ ] Nœud Webhook configuré
- [ ] Nœud Airtable connecté à votre base
- [ ] Noms de champs adaptés dans le Code
- [ ] Nœud Respond to Webhook ajouté
- [ ] Workflow activé
- [ ] URL testée dans le navigateur
- [ ] Données affichées correctement dans JARVIS

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du workflow dans n8n
2. Testez chaque nœud individuellement
3. Vérifiez la console du navigateur (F12)

---

**Une fois configuré, vos formations s'afficheront automatiquement dans JARVIS ! 🎉**
