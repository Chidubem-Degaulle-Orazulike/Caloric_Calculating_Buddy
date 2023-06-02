CREATE DATABASE Recipe_Buddy;
USE Recipe_Buddy;
CREATE TABLE Users (id INT AUTO_INCREMENT,username VARCHAR(50),firstname VARCHAR(50),lastname VARCHAR(50),email VARCHAR(50), hashedPassword VARCHAR(200),PRIMARY KEY(id));
CREATE TABLE FOOD (id INT AUTO_INCREMENT,username VARCHAR(50),Food_Name VARCHAR(50),Typical_values_per DECIMAL(10,2), Unit_of_Typical_Values VARCHAR(50), Carbs DECIMAL(10.2), Fats DECIMAL(10,2), Protein DECIMAL(10,2), Salt DECIMAL(10,2), Sugar DECIMAL(10,2), PRIMARY KEY(id) );
CREATE USER 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2027';
GRANT ALL PRIVILEGES ON myBookshop.* TO 'appuser'@'localhost';
