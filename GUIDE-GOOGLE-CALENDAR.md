# 📅 Guide Workflow n8n - Agenda Google Calendar

Ce guide vous explique comment créer un workflow n8n pour récupérer vos RDV des prochains jours depuis Google Calendar.

---

## 🎯 Objectif

Créer un webhook qui retourne les RDV d'aujourd'hui (J) et de demain (J+1) au format :

```json
{
  "jours": [
    {
      "titre": "Jeudi 18 décembre",
      "rdv": [
        {
          "horaire": "12h-14h",
          "titre": "Repas du Pôle"
        },
        {
          "horaire": "15h-16h",
          "titre": "RDV Caroline Relais"
        }
      ]
    },
    {
      "titre": "Vendredi 19 décembre",
      "rdv": [
        {
          "horaire": "10h-12h",
          "titre": "CODIR"
        }
      ]
    }
  ]
}
```

---

## 🔧 Configuration n8n

### Étape 1 : Créer le Workflow

1. **Créez un nouveau workflow** : "API Agenda RDV"
2. **Path du webhook** : `agenda_rdv`

---

### Étape 2 : Nœud Webhook

**Configuration** :
- **HTTP Method** : `GET`
- **Path** : `agenda_rdv`
- **Response Mode** : **"When Last Node Finishes"** ou **"responseNode"**
- **Response Headers** :
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Headers: Content-Type
  ```

---

### Étape 3 : Nœud Google Calendar (Aujourd'hui)

**Nom** : "Google Calendar - Aujourd'hui"

**Configuration** :
- **Operation** : `Get Many`
- **Calendar** : Sélectionnez votre calendrier
- **Start** (Time du début) :
  ```
  $now.startOf('day').toISO()
  ```
- **End** (Time de fin) :
  ```
  $now.endOf('day').toISO()
  ```
- **Options** :
  - **Order By** : `startTime`
  - **Single Events** : `true`

---

### Étape 4 : Nœud Google Calendar (Demain)

**Nom** : "Google Calendar - Demain"

**Configuration** :
- **Operation** : `Get Many`
- **Calendar** : Sélectionnez votre calendrier
- **Start** :
  ```
  $now.plus({days: 1}).startOf('day').toISO()
  ```
- **End** :
  ```
  $now.plus({days: 1}).endOf('day').toISO()
  ```
- **Options** :
  - **Order By** : `startTime`
  - **Single Events** : `true`

---

### Étape 5 : Nœud Merge (Fusionner les deux)

**Connectez** :
- Google Calendar Aujourd'hui → Merge (Input 1)
- Google Calendar Demain → Merge (Input 2)

**Configuration** :
- **Mode** : `Combine`
- **Combine By** : `Combine All`

---

### Étape 6 : Nœud Code (Formatter)

**Nom** : "Formatter RDV"

**Code JavaScript** :

```javascript
// Récupérer les événements des deux jours
const items = $input.all();

// Fonction pour formater une date en français
function formatJour(dateString) {
  const date = new Date(dateString);
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  const jourNom = jours[date.getDay()];
  const jour = date.getDate();
  const moisNom = mois[date.getMonth()];

  return `${jourNom} ${jour} ${moisNom}`;
}

// Fonction pour formater l'horaire
function formatHoraire(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startH = startDate.getHours();
  const startM = startDate.getMinutes();
  const endH = endDate.getHours();
  const endM = endDate.getMinutes();

  const startTime = `${startH}h${startM > 0 ? startM.toString().padStart(2, '0') : ''}`;
  const endTime = `${endH}h${endM > 0 ? endM.toString().padStart(2, '0') : ''}`;

  return `${startTime}-${endTime}`;
}

// Grouper les événements par jour
const joursMap = {};

for (const item of items) {
  const event = item.json;

  // Récupérer la date de début
  const startDateTime = event.start?.dateTime || event.start?.date;
  if (!startDateTime) continue;

  const dateKey = startDateTime.split('T')[0]; // Format YYYY-MM-DD

  // Initialiser le jour si nécessaire
  if (!joursMap[dateKey]) {
    joursMap[dateKey] = {
      titre: formatJour(startDateTime),
      date: dateKey,
      rdv: []
    };
  }

  // Ajouter le RDV
  joursMap[dateKey].rdv.push({
    horaire: formatHoraire(event.start?.dateTime, event.end?.dateTime),
    titre: event.summary || 'Sans titre'
  });
}

// Convertir en array et trier par date
const jours = Object.values(joursMap).sort((a, b) =>
  new Date(a.date) - new Date(b.date)
);

// Retourner le résultat
return [{ json: { jours } }];
```

---

### Étape 7 : Nœud Respond to Webhook

**Configuration** :
- **Respond With** : `JSON`
- **Response Body** : `$json`

---

## 📊 Schéma du Workflow

```
Webhook (GET)
    ↓
    ├─→ Google Calendar Aujourd'hui ─┐
    │                                 ├─→ Merge
    └─→ Google Calendar Demain ───────┘
                ↓
          Code Formatter
                ↓
       Respond to Webhook
```

---

## 🧪 Tester le Workflow

1. **Activez le workflow** (switch vert)
2. **Testez l'URL** :
   ```
   https://n8n.srv846378.hstgr.cloud/webhook/agenda_rdv
   ```

**Vous devriez voir** :
```json
{
  "jours": [
    {
      "titre": "Mercredi 18 décembre",
      "date": "2024-12-18",
      "rdv": [
        {
          "horaire": "12h-14h",
          "titre": "Repas du Pôle"
        },
        {
          "horaire": "15h-16h",
          "titre": "RDV Caroline Relais"
        }
      ]
    }
  ]
}
```

---

## 🎨 Résultat dans JARVIS

Une fois le workflow activé, votre JARVIS affichera :

```
┌─────────────────────────────┐
│ 📅 Prochains RDV            │
│                             │
│ Jeudi 18 décembre           │
│ ┌─────────────────────┐    │
│ │ 12h-14h             │    │
│ │ Repas du Pôle       │    │
│ └─────────────────────┘    │
│ ┌─────────────────────┐    │
│ │ 15h-16h             │    │
│ │ RDV Caroline Relais │    │
│ └─────────────────────┘    │
│                             │
│ Vendredi 19 décembre        │
│ ┌─────────────────────┐    │
│ │ 10h-12h             │    │
│ │ CODIR               │    │
│ └─────────────────────┘    │
└─────────────────────────────┘
```

---

## 🐛 Dépannage

### Pas de RDV affichés
- Vérifiez que vous avez des événements aujourd'hui ou demain
- Vérifiez les permissions du calendrier dans n8n

### Mauvais format d'heure
- Vérifiez le fuseau horaire dans les paramètres Google Calendar

### Erreur 500
- Vérifiez que tous les nœuds sont connectés
- Vérifiez le code JavaScript (pas d'erreurs de syntaxe)

---

## ✅ Checklist

- [ ] Workflow créé
- [ ] Webhook configuré en mode "responseNode"
- [ ] Deux nœuds Google Calendar (aujourd'hui + demain)
- [ ] Nœud Merge configuré
- [ ] Code JavaScript copié et testé
- [ ] Respond to Webhook ajouté
- [ ] Workflow activé
- [ ] URL testée dans le navigateur
- [ ] JARVIS affiche les RDV

---

**Une fois configuré, vos RDV s'afficheront automatiquement dans JARVIS ! 📅🎉**
