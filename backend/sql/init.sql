-- User : comprend les infos persos du user + stats pour le dashboard + situation en cours
CREATE TABLE IF NOT EXISTS User (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT UNIQUE NOT NULL,
	email TEXT UNIQUE NOT NULL,
	registration DATETIME NOT NULL DEFAULT (datetime('now')),																-- 1ere inscription
	lastlog DATETIME,																			-- derniere connection (NULL si jamais connecté)
	password TEXT,																				-- a hascher + tard (NULL si register via Google)
	-- ingame INTEGER DEFAULT 0 NOT NULL CHECK (ingame IN (0, 1)),								-- si actuellement en jeu
	tournament INTEGER DEFAULT 0 NOT NULL,														-- a voir si utile ici, aussi s'il peut participer a plusieurs tournois
	avatar TEXT DEFAULT 'default.png' NOT NULL,													-- facultatif / type TEXT car c'est le chemin de l'image qu'on stocke
	game_played INTEGER DEFAULT 0 NOT NULL,														-- total des parties jouees -> permet d'eviter de recalculer a chaque fois dans la db
	game_win INTEGER DEFAULT 0 NOT NULL,														-- total parties gagnees -> pareil
	game_loose INTEGER DEFAULT 0 NOT NULL,														-- total parties perdues -> pareil
	time_played INTEGER DEFAULT 0 NOT NULL,														-- total temps joue -> a remettre a jour a chaque fin de jeu
	secret_question_number INTEGER NOT NULL DEFAULT 4 CHECK (secret_question_number IN (1, 2, 3, 4)), -- pour moi possibilite de null et a proteger dans les inputs pour si auth google, idem pour answer
	secret_question_answer TEXT DEFAULT 0 NOT NULL,
	n_friends INTEGER DEFAULT 0 NOT NULL,														-- nbre d'amis total -> a mettre a jour a chaque ajout/suppression d'ami
	status TEXT DEFAULT 'offline' NOT NULL CHECK (status IN ('online', 'offline', 'in-game')),
	is_deleted INTEGER DEFAULT 0 NOT NULL CHECK (is_deleted IN (0, 1)),							-- pour savoir si le compte est actif ou non (on garde le user en bdd meme apres desinscription pour garder les stats des jeux pour ses partenaires toujours inscrits), 0 = actif, 1 = pas actif
	register_from TEXT DEFAULT 'local' NOT NULL CHECK (register_from IN ('local', 'google')),	-- pour savoir si le user s'est inscrit via le site ou via Google, utile pour l'authentification
	code_2FA TEXT,
	code_2FA_expire_at INTEGER
);

-- Game -> donnees propre au jeu
CREATE TABLE IF NOT EXISTS Game (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	n_participants INTEGER NOT NULL,
	begin DATETIME NOT NULL DEFAULT (datetime('now')),											-- date et heure de debut du jeu, par defaut quand la table est creee (ouverture du jeu)
	end DATETIME,																				-- date et heure de fin du jeu, NULL si le jeu n'est pas fini
	tournament INTEGER DEFAULT 0 NOT NULL CHECK (tournament IN (0, 1)),							-- pour preciser si c'est un jeu de tournoi ou non, 0 = non, 1 = oui
	status TEXT NOT NULL CHECK (status IN ('waiting', 'in_progress', 'cancelled', 'finished')),	-- pour preciser si en cours, annule ou termine                                                             -- jeu en cours, termine, ou pas encore commence si tournoi ? 
	temporary_result INTEGER DEFAULT 0 NOT NULL													-- au cas ou le serveur plante, possibilite de recuperer le score en cours
);

-- User_Game : resultat entre user et game 
CREATE TABLE IF NOT EXISTS User_Game (
	Game_id INTEGER NOT NULL,												-- necessaire pour ensuite faire les foreign key et relier les tables entre elles
	User_id INTEGER NOT NULL,
	status_win INTEGER DEFAULT 0 NOT NULL CHECK (status_win IN (0, 1)),		-- 0 = perdu 1 = gagne (pas de NULL car on ne peut pas avoir un jeu sans resultat)
	duration INTEGER NOT NULL,												-- Duree du jeu (pas en DATETIME car DATETIME = une date + heure))
	FOREIGN KEY (Game_id) REFERENCES Game(id) ON DELETE CASCADE,			-- ON DELETE CASCADE: si le jeu est supprime on supprime le resultat du jeu
	FOREIGN KEY (User_id) REFERENCES User(id),								-- pas de DELETE CASCADE ici pour garder les stats du user (pour ses partenaires par exemple)
	PRIMARY KEY (Game_id, User_id)											-- un element pour chaque user qui a participe au meme jeu
);

-- Chat -> pour gerer les messages echanges
CREATE TABLE IF NOT EXISTS Chat (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	Sender_id INTEGER NOT NULL,
	Receiver_id INTEGER NOT NULL,                                                   
	time_send DATETIME NOT NULL DEFAULT (datetime('now')),
	message TEXT NOT NULL,													-- si on a bloque la personne
	FOREIGN KEY (Sender_id) REFERENCES User(id),
	FOREIGN KEY (Receiver_id) REFERENCES User(id)
);

-- liste d amis et status
CREATE TABLE IF NOT EXISTS Friends (
	user1_id INTEGER NOT NULL,
	user2_id INTEGER NOT NULL,
	status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),	-- pour checker le status, oui, non, en attente
	is_blocked INTEGER,
	date DATETIME NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (user1_id) REFERENCES User(id) ON DELETE CASCADE,
	FOREIGN KEY (user2_id) REFERENCES User(id) ON DELETE CASCADE,
	CHECK (user1_id < user2_id), 
	PRIMARY KEY (user1_id, user2_id)
);
/*                                                       
-- Chat -> pour gerer les messages echanges
CREATE TABLE IF NOT EXISTS Chat (                                             -- Si on decide de rendre le chat a plus de 1 VS 1 / ou si on veut stocker dans un endroit precis les discussion en solo
	id INTEGER PRIMARY KEY AUTOINCREMENT,                                     -- sur un seul user_chat puis message, a remettre en place
	User_id INTEGER,                                                         -- user qui a envoye le message - pertinent ? 
	time_send DATETIME,
	message TEXT,
	FOREIGN KEY (User_id) REFERENCES User(id)
);
CREATE TABLE IF NOT EXISTS User_Chat (
	Chat_id INTEGER NOT NULL,                                                 
	Sender_id INTEGER NOT NULL,
	Receiver_id INTEGER NOT NULL,
	friend BOOL,
	lock BOOL,
	FOREIGN KEY (Chat_id) REFERENCES Chat(id),
	FOREIGN KEY (Sender_id) REFERENCES User(id),
	FOREIGN KEY (Receiver_id) REFERENCES User(id),
	PRIMARY KEY (Sender_id, Receiver_id)
);
*/

CREATE TABLE IF NOT EXISTS Tournament ( 
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	n_participants INTEGER NOT NULL,
	n_round INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS User_Tournament (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	Tournament_id INTEGER NOT NULL,
	User_id INTEGER NOT NULL,
	Game_id INTEGER,
	alias TEXT NOT NULL,
	FOREIGN KEY (Tournament_id) REFERENCES Tournament(id) ON DELETE CASCADE,
	FOREIGN KEY (User_id) REFERENCES User(id),
	FOREIGN KEY (Game_id) REFERENCES Game(id)
);
