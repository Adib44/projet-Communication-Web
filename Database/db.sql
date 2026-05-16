-- Table des utilisateurs
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    login VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    token VARCHAR(255)
);

-- Table des sujets
CREATE TABLE topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'Général', 
    userLogin VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userLogin) REFERENCES users(login)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Table des réponses
CREATE TABLE replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    topicId INTEGER NOT NULL,             
    userLogin VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (topicId) REFERENCES topics(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    FOREIGN KEY (userLogin) REFERENCES users(login)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);