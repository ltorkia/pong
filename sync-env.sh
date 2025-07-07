#!/bin/sh

SHARED_ENV="./shared/.env"
FRONTEND_ENV="./frontend/.env"
BACKEND_ENV="./backend/.env"

# Crée les fichiers s'ils n'existent pas
touch "$FRONTEND_ENV"
touch "$BACKEND_ENV"

# Parcourt les variables
while IFS='=' read -r key value; do
	# Ignore les lignes vides ou commentaires
	if [ -z "$key" ] || echo "$key" | grep -q '^#'; then
		continue
	fi

	# Ajout dans frontend/.env avec prefixe VITE_
	echo "VITE_$key=$value" >> "$FRONTEND_ENV"

	# Ajout dans backend/.env tel quel
	echo "$key=$value" >> "$BACKEND_ENV"
done < "$SHARED_ENV"

echo "Variables de $SHARED_ENV ont été copiées dans:"
echo "   -> $FRONTEND_ENV (avec préfixe 'VITE_')"
echo "   -> $BACKEND_ENV (telles quelles)"
