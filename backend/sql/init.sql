-- User -> comprend les infos persos du user + stats pour le dashboard + situation en cours
CREATE TABLE IF NOT EXISTS User (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT UNIQUE NOT NULL,
	email TEXT UNIQUE NOT NULL,
	registration DATETIME DEFAULT CURRENT_TIMESTAMP,
	begin_log DATETIME,
	end_log DATETIME, 
	password TEXT,
	tournament INTEGER DEFAULT 0,
	avatar TEXT DEFAULT 'default.png',
	game_played INTEGER DEFAULT 0,
	game_win INTEGER DEFAULT 0,
	game_loose INTEGER DEFAULT 0,
	time_played INTEGER DEFAULT 0,
	n_friends INTEGER DEFAULT 0,
	status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'in-game')),
	is_desactivated INTEGER DEFAULT 0 CHECK (is_desactivated IN (0, 1)),
	register_from TEXT DEFAULT 'local' CHECK (register_from IN ('local', 'google')),
	active_2FA TEXT DEFAULT 'disabled' CHECK (active_2FA IN ('disabled', 'email', 'qrcode')),
	code_2FA_email TEXT,
	code_2FA_qrcode TEXT,
	code_2FA_expire_at INTEGER
);

-- Notif -> pour gerer les notifications
CREATE TABLE IF NOT EXISTS Notif (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	"from" INTEGER NOT NULL,
	"to" INTEGER NOT NULL,
	type TEXT NOT NULL CHECK (type IN ('add', 'accept', 'decline', 'unfriend', 'cancel', 'delete', 'block', 'unblock', 'online', 'offline', 'in-game', 'invite', 'invite-accept', 'invite-cancel')),
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	content TEXT,
	read INTEGER DEFAULT 0 CHECK (read IN (0, 1)),													
	FOREIGN KEY ("from") REFERENCES User(id),
	FOREIGN KEY ("to") REFERENCES User(id)
);

-- liste d amis et status
CREATE TABLE IF NOT EXISTS Friends (
	user1_id INTEGER NOT NULL,
	user2_id INTEGER NOT NULL,
	requester_id INTEGER NOT NULL,												-- user qui a fait la demande d'ami
	friend_status TEXT DEFAULT 'pending' CHECK (friend_status IN ('pending', 'accepted', 'blocked')),	-- pour checker le status, oui, non, en attente
	blocked_by INTEGER DEFAULT 0,
	waiting_invite INTEGER DEFAULT 0 CHECK (waiting_invite IN (0, 1)),
	challenged_by INTEGER DEFAULT 0,
	is_challenged INTEGER DEFAULT 0,
	meet_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user1_id) REFERENCES User(id) ON DELETE CASCADE,
	FOREIGN KEY (user2_id) REFERENCES User(id) ON DELETE CASCADE,
	CHECK (user1_id < user2_id), 
	PRIMARY KEY (user1_id, user2_id)
);

-- Game -> donnees propre au jeu
CREATE TABLE IF NOT EXISTS Game (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	n_participants INTEGER NOT NULL DEFAULT 2,
	begin DATETIME DEFAULT CURRENT_TIMESTAMP,
	end DATETIME,
	tournament INTEGER DEFAULT 0 CHECK (tournament IN (0, 1)),
	status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'cancelled', 'finished')),
	looser_result INTEGER DEFAULT 0,
	winner_id INTEGER,
	FOREIGN KEY (winner_id) REFERENCES User(id)
);

-- User_Game -> resultat entre user et game 
CREATE TABLE IF NOT EXISTS User_Game (
	game_id INTEGER NOT NULL,												-- necessaire pour ensuite faire les foreign key et relier les tables entre elles
	user_id INTEGER NOT NULL,
	status_win INTEGER DEFAULT NULL CHECK (status_win IN (0, 1)),			-- 0 = perdu 1 = gagne (pas de NULL car on ne peut pas avoir un jeu sans resultat)
	duration INTEGER DEFAULT 0,												-- Duree du jeu (pas en DATETIME car DATETIME = une date + heure))
	FOREIGN KEY (game_id) REFERENCES Game(id) ON DELETE CASCADE,			-- ON DELETE CASCADE: si le jeu est supprime on supprime le resultat du jeu
	FOREIGN KEY (user_id) REFERENCES User(id),								-- pas de DELETE CASCADE ici pour garder les stats du user (pour ses partenaires par exemple)
	PRIMARY KEY (game_id, user_id)											-- un element pour chaque user qui a participe au meme jeu
);

-- Tournament -> donnees propres au tournoi
CREATE TABLE IF NOT EXISTS Tournament ( 
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	n_participants INTEGER NOT NULL DEFAULT 4,
	n_round INTEGER NOT NULL DEFAULT 2,
	started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	ended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	tournament_status TEXT DEFAULT 'pending' CHECK (tournament_status IN ('pending', 'in_progress', 'cancelled', 'finished'))
);

-- User_Tournament -> resultat entre user et tournoi
CREATE TABLE IF NOT EXISTS User_Tournament (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    game_id INTEGER,
    alias TEXT,
    score INTEGER DEFAULT 0,				-- score cumulé dans le tournoi
    wins INTEGER DEFAULT 0,					-- nombre de victoires
    losses INTEGER DEFAULT 0,   			-- nombre de défaites
    round_reached INTEGER DEFAULT 0,		-- dernier round atteint
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'eliminated', 'finished')),
    registered_at DATETIME DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES Tournament(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(id),
    FOREIGN KEY (game_id) REFERENCES Game(id)
);

-- Chat -> pour gerer les messages echanges
CREATE TABLE IF NOT EXISTS Chat (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	sender_id INTEGER NOT NULL,
	receiver_id INTEGER NOT NULL,                                                   
	time_send DATETIME DEFAULT CURRENT_TIMESTAMP,
	message TEXT NOT NULL,													
	FOREIGN KEY (sender_id) REFERENCES User(id),
	FOREIGN KEY (receiver_id) REFERENCES User(id)
);
/*                                                       
-- Chat -> pour gerer les messages echanges
CREATE TABLE IF NOT EXISTS Chat (                                             -- Si on decide de rendre le chat a plus de 1 VS 1 / ou si on veut stocker dans un endroit precis les discussion en solo
	id INTEGER PRIMARY KEY AUTOINCREMENT,                                     -- sur un seul user_chat puis message, a remettre en place
	user_id INTEGER,                                                         -- user qui a envoye le message - pertinent ? 
	time_send DATETIME,
	message TEXT,
	FOREIGN KEY (user_id) REFERENCES User(id)
);
CREATE TABLE IF NOT EXISTS User_Chat (
	chat_id INTEGER NOT NULL,                                                 
	sender_id INTEGER NOT NULL,
	receiver_id INTEGER NOT NULL,
	friend BOOL,
	lock BOOL,
	FOREIGN KEY (chat_id) REFERENCES Chat(id),
	FOREIGN KEY (sender_id) REFERENCES User(id),
	FOREIGN KEY (receiver_id) REFERENCES User(id),
	PRIMARY KEY (sender_id, receiver_id)
);
*/
