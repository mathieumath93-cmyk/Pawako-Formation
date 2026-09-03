#!/usr/bin/env bash
# Script de déploiement automatique pour Alibaba Cloud ECS (Ubuntu 20.04/22.04/24.04)
# PAWAKO FORMATION - Application PDF Sécurisée

set -e

echo "========================================================="
echo "   DEPLOIEMENT PAWAKO FORMATION SUR ALIBABA CLOUD OS    "
echo "========================================================="

# 1. Mise à jour des paquets Ubuntu
echo "[1/4] Mise à jour du système Ubuntu..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

# 2. Installation de Docker et Docker Compose si absent
if ! command -v docker &> /dev/null; then
    echo "[2/4] Installation de Docker Engine..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER || true
    echo "Docker installé avec succès !"
else
    echo "[2/4] Docker est déjà installé."
fi

# 3. Préparation du fichier .env si inexistant
if [ ! -f .env ]; then
    echo "[3/4] Création du fichier d'environnement .env..."
    cp .env.example .env
fi

# 4. Lancement de la pile Docker Compose
echo "[4/4] Construction et lancement du conteneur Docker sur le port 3000..."
sudo docker compose build
sudo docker compose up -d

echo "========================================================="
echo "   DEPLOIEMENT REUSSI !                                 "
echo "   Votre application est en ligne sur le port 3000.      "
echo "   Accès: http://<VOTRE-IP-PUBLIQUE-ALIBABA>:3000        "
echo "========================================================="
