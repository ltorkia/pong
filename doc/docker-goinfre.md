GAIN DE PLACE

Forcer Docker à bosser dans /goinfre:
Même si on code dans /home, Docker peut utiliser /goinfre pour son cache:

export DOCKER_CONFIG=/goinfre/ltorkia/.docker
mkdir -p $DOCKER_CONFIG

Ajouter dans ~/.zshrc:
echo 'export DOCKER_CONFIG=/goinfre/ltorkia/.docker' >> ~/.zshrc

Ce dossier peut disparaître après un redémarrage (c’est du temporaire), donc :
si on voit une erreur type "cannot write to .docker", il faut simplement recreer ce dossier:

mkdir -p /goinfre/ltorkia/.docker