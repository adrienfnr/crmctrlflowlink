# MIRO Agenda Sync

Petit projet qui expose une URL `.ics` (calendrier) contenant uniquement les RDV
où `closer.id === 14` (Adrien FOURNIER), lus en lecture seule depuis le CRM MIRO.

## Déploiement (5 minutes)

1. Crée un nouveau repo GitHub (vide) et pousse ce dossier dedans.
2. Va sur https://vercel.com → "Add New Project" → importe ce repo GitHub.
3. Vercel détecte automatiquement que c'est un projet avec un dossier `/api`
   (pas besoin de build, laisse les réglages par défaut).
4. Avant de déployer, va dans "Environment Variables" et ajoute :
   - Nom : `CRM_TOKEN`
   - Valeur : le token Bearer (celui qui commence par `eyJhbGciOi...`)
5. Clique "Deploy".

## Récupérer l'URL du calendrier

Une fois déployé, l'URL sera :
`https://<nom-du-projet>.vercel.app/api/calendar`

## Ajouter dans Apple Calendar

1. App Calendrier → menu **Fichier** → **Nouvel abonnement...**
2. Colle l'URL ci-dessus.
3. Valide. Apple se resynchronisera périodiquement tout seul.

## Quand le token expire

Le token JWT du CRM a une date d'expiration. Quand le calendrier arrête de se
mettre à jour :
1. Récupère un nouveau token (Chrome → Inspecter → Network → une requête
   `all-rdv` → Headers → copier la valeur d'`authorization`, sans le mot
   "Bearer").
2. Vercel → ton projet → Settings → Environment Variables → modifie `CRM_TOKEN`.
3. Vercel → Deployments → "Redeploy" sur le dernier déploiement (ou ça se
   met à jour automatiquement selon la config).
