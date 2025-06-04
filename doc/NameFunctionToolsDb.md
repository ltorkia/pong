
--------- initDb() -------------
initialise la Db avec les tables necessaires

--------- getDb() --------------
recupere l integralite de la db

--------- getUser(userId) ------
retourne les infos d un user particulier
userId = le id de l user a afficher
accessible sur '/api/users:id'

--------- getAllUsers() --------
retourne les infos de tous les users pour l authentification sans password
accessible sur '/api/users'

--------- getUserFriends(userId: number) -----------
retourne les potes de l'userID -> pour le moment juste le nom, avatar et lastlog. 
accessible sur '/api/users:id/friends'



