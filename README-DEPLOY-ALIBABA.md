# Guide de Déploiement PAWAKO FORMATION sur Alibaba Cloud (Ubuntu + Docker)

Ce guide décrit la procédure pas à pas pour déployer l'application **PAWAKO FORMATION** sur un serveur virtuel **Alibaba Cloud ECS** exécutant **Ubuntu** (20.04 LTS / 22.04 LTS / 24.04 LTS) avec **Docker** et **Docker Compose**.

---

## 📋 Prérequis sur Alibaba Cloud

1. Une instance **ECS (Elastic Compute Service)** sous **Ubuntu** fonctionnelle.
2. Une **Adresse IP Publique (EIP)** rattachée à l'instance.
3. Dans la console Alibaba Cloud, configurez le **Security Group (Groupe de sécurité)** pour autoriser les ports d'entrée suivants :
   - **Port `22`** (SSH)
   - **Port `3000`** (Application PAWAKO)
   - **Port `80` / `443`** (Si vous utilisez un Reverse Proxy Nginx + SSL HTTPS)

---

## 🚀 Option 1 : Déploiement Automatisé en 1 Clic (Recommandé)

1. **Connectez-vous en SSH à votre serveur Alibaba Cloud Ubuntu :**
   ```bash
   ssh root@<IP_PUBLIQUE_ALIBABA>
   ```

2. **Clonez votre dépôt ou transférez le dossier de l'application sur le serveur :**
   ```bash
   git clone <URL_DE_VOTRE_REPO_GIT> pawako-app
   cd pawako-app
   ```

3. **Rendez le script d'installation exécutable et lancez-le :**
   ```bash
   chmod +x deploy-alibaba.sh
   ./deploy-alibaba.sh
   ```

Le script va automatiquement :
- Mettre à jour les paquets Ubuntu.
- Installer Docker Engine et Docker Compose plugin si nécessaire.
- Configurer le fichier d'environnement `.env`.
- Compiler et démarrer l'application isolée dans son conteneur sur le port `3000`.

---

## 🛠️ Option 2 : Déploiement Manuel avec Docker Compose

Si vous préférez installer manuellement étape par étape :

### Step 1: Installer Docker sur Ubuntu
```bash
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### Step 2: Lancer l'Application
```bash
# Copier .env.example vers .env
cp .env.example .env

# Lancer la pile de conteneurs en arrière-plan
sudo docker compose up -d --build
```

### Step 3: Vérifier l'état du conteneur
```bash
sudo docker compose ps
sudo docker compose logs -f
```

---

## 🔒 Configuration du Groupe de Sécurité Alibaba Cloud (Security Group)

Dans la console Alibaba Cloud ECS :
1. Accédez à **ECS Console > Network & Security > Security Groups**.
2. Cliquez sur votre groupe de sécurité associé à l'instance Ubuntu.
3. Ajoutez une règle **Inbound (Entrante)** :
   - **Action** : Allow
   - **Protocol Type** : Custom TCP
   - **Port Range** : `3000/3000`
   - **Authorization Object** : `0.0.0.0/0` (ou votre IP spécifique)

Accédez ensuite à l'application dans votre navigateur :
`http://<IP_PUBLIQUE_ALIBABA>:3000`

---

## 📁 Persistance des Données et Fichiers Téléversés

Les données JSON et les fichiers PDF/Vidéos téléversés par l'administrateur sont stockés dans des volumes Docker persistants (`pawako_data` et `pawako_uploads`). Même lors d'un redémarrage ou d'une mise à jour du conteneur, aucun fichier ne sera perdu.

---

## 🛡️ Integration Firebase
L'application contient le fichier de configuration `firebase-applet-config.json` et est connectée à la base de données **Firebase Firestore** (`gen-lang-client-0832008958`) pour la gestion des sessions et des cours.
