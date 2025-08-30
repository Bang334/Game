CREATE TABLE IF NOT EXISTS roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  age INT,
  balance DECIMAL(10,2) DEFAULT 0,
  role_id INT NOT NULL,
  CONSTRAINT fk_users_roles FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0
);

INSERT IGNORE INTO roles(name) VALUES ('ADMIN'), ('CUSTOMER');

INSERT INTO users(username, email, password, age, balance, role_id)
SELECT 'admin', 'admin@example.com', 'admin123', 30, 0, role_id FROM roles WHERE name='ADMIN'
ON DUPLICATE KEY UPDATE username=username;

INSERT INTO users(username, email, password, age, balance, role_id)
SELECT 'customer', 'customer@example.com', 'customer123', 25, 100, role_id FROM roles WHERE name='CUSTOMER'
ON DUPLICATE KEY UPDATE username=username;

