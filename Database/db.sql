-- Table des utilisateurs
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    token VARCHAR(255)
);

-- Table des sujets
CREATE TABLE topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    userLogin VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userLogin) REFERENCES users(login)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Table des réponses
CREATE TABLE replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topicId INT NOT NULL,
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