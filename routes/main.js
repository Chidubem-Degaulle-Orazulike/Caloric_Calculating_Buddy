// const { spreadProperty } = require('@babel/types');

module.exports = function(app, RecipeData) {

    //setting the variable to call the bcrypt library
    const bcrypt = require('bcrypt');
    //calling on the express validator to implement all the validations we call 
    const { check, validationResult } = require('express-validator');

    //the variable userLogged will be used to store the username of the individual loggen in
    var userLoggedIn;
    // stores the username associated to the food to be updated and keeps track of it
    var usernameStorage;
    // this is the variable used to keep track of the food name and its entire record to be deleted.
    var deleter;

    //this is to help the user stay on the page where they update food despite having an error
    var updateTracker;

    //this ensures that if the username and password are equivalent to whats stored on the database then the user can progress on the page otherwise
    //they are redirected back to the login page.
    const redirectLogin = (req, res, next) => {
        if (!req.session.userId ) {
            res.redirect('./login')
        } else{
            next (); 
        }
    } 

    // Handle our routes
    //getting the ejs files for each route

    //getting data from the index.ejs
    app.get('/',function(req,res){
        res.render('index.ejs', RecipeData)
    });

    //getting data from the about.ejs
    app.get('/about',function(req,res){
        res.render('about.ejs', RecipeData);
    });

    //creating the route for the login page
    app.get('/login', function (req,res) {
        res.render('login.ejs', RecipeData);                                                                    
    }); 
    
    //function that executes the check to ensure the information typed in by the user matches the information stored on the database
    //and the paths it takes when the information matches or doesn't match with validations ensuring that there is atleast one character in each field
    app.post('/loggedin', [check('username').isLength(1)], [check('password').isLength(1)], function(req,res){
        const errors = validationResult(req);
        //if the validation checks arent met then redirect 
        if (!errors.isEmpty()) {
            res.redirect('./login'); 
        }
        else {

            //this query selects all the usernames that have the same character as though typed
            let sqlquery = "SELECT * FROM Users WHERE username ='" + req.sanitize(req.body.username) + "'";
            
            //extracting everything from the databases related to the username entered in the login box
            db.query(sqlquery, (err, result) => {
               
                if (err) {
                    res.redirect('./'); 
                }
                //if the username typed in exists in the database the following statements within the if statements will be executed 
                if(result[0] != undefined){

                    hashed_Password = result[0].hashedPassword

                    //compare both the hashed password and the password the user types and if its the same say logged in otherwise say logged out
                    bcrypt.compare(req.sanitize(req.body.password), hashed_Password, function(err, result) {
                        if (err) {
                            // TODO: Handle error
                            res.redirect('./'); 
                        }
                        else if (result == true) {
                            //if the result is true then make the user session id equivalent to the username and store the username in a variable to be used
                            //as a tracker 
                            req.session.userId = req.sanitize(req.body.username);
                            userLoggedIn = req.body.username;
                            res.send('Logged in  <a href='+'./'+'>Home</a>');
                        }

                        else {
                            // TODO: Send message
                            res.send('Not Logged in wrong password  <a href='+'./'+'>Home</a>');
                        }

                    });

                }else{
                     // TODO: Send message
                    res.send('Not Logged in  <a href='+'./'+'>Home</a>');
                }
       
            });        

        }

    });

    //creating the route for my register page
    app.get('/register', function (req,res) {
        res.render('register.ejs', RecipeData);                                                                     
    }); 

    //function that ensure the user registers after the validations are passed, and their details are stored on the software in the database
    app.post('/registered', [check('email').isEmail()], [check('email').isLength(5)], [check('username').isLength(5)], [check('username').notEmpty()], [check('password').notEmpty()], [check('password').isStrongPassword()],function (req, res) {
        const errors = validationResult(req);
         //if the validation checks arent met then redirect 
        if (!errors.isEmpty()) {
            res.redirect('./register'); }
        else {
            let usernameQuery = "SELECT * FROM Users WHERE username = '" + req.sanitize(req.body.username) + "'";
            //executing the query that allows it to check if the username is already in the database;
            db.query(usernameQuery, (err, result1) => {
            if (err) {
            return console.error(err.message);
            }
            if(result1[0]!=undefined){
                res.send('The username already exists in the database try another one <a href='+'./'+'>Home</a> ')
            }
            else{
                    //saving data in database
                //establishing the neccessary variables for encrypting the password i.e saltrounds 10 means adding 10 salt characters onto the password
                const saltRounds = 10;
                const plainPassword = req.body.password;
                bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
                    //Store hashed password in your database.
                    //calling the fields to be stored in and the data that is stored in those fields
                    let passwordQuery = "INSERT INTO Users(username,firstname,lastname,email,hashedPassword) VALUES(?,?,?,?,?)";
                    let InputData = [req.sanitize(req.body.username),req.sanitize(req.body.first),req.sanitize(req.body.last),req.sanitize(req.body.email),hashedPassword]
                    //executing the query that allows it to import the data the user used to register and exporting them into the database
                    db.query(passwordQuery, InputData, (err, result) => {
                        if (err) {
                        return console.error(err.message);
                        }
                        else{
                            //if successful then print the following message out
                            result = 'Hello '+ req.sanitize(req.body.first) + ' '+ req.sanitize(req.body.last) +' you are now sregistered! We will send an email to you at ' + req.sanitize(req.body.email);
                            result += 'Your password is: '+ req.sanitize(req.body.password) +' and your hashed passwordis: '+ hashedPassword;
                            res.send(result + '<a href='+'./'+'>Home</a>');
                        }
                            
                    })
                    
                })
            }
        })
    }
                                                   
    }); 

    //creating the route to add food
     app.get('/addFood', redirectLogin, function (req, res) {
        res.render('addFood.ejs', RecipeData);
     });
     
     //creating the functions to add the food and values once the validation principles are met 
     app.post('/foodAdded',[check('Food_Name').isLength(3)],[check('Typical_Values_per').isLength(1)], [check('Typical_Values_per').isInt()], [check('Unit_of_Typical_Values').isLength(1)],[check('Carbs').isLength(1)],[check('Fats').isLength(1)],[check('Protein').isLength(1)],[check('Salt').isLength(1)],[check('Sugar').isLength(1)],[check('Food_Name').isAlpha()], [check('Unit_of_Typical_Values').isAlpha()],[check('Carbs').isDecimal()],[check('Fats').isDecimal()],[check('Protein').isDecimal()],[check('Salt').isDecimal()],[check('Sugar').isDecimal()],  function (req,res) {
        const errors = validationResult(req);
         //if the validation checks arent met then redirect 
        if (!errors.isEmpty()) {
            console.log(errors)
            res.redirect('./addFood'); }
        else {
            // saving data in database
           let sqlquery = "INSERT INTO FOOD(username,Food_Name, Typical_Values_per, Unit_of_Typical_Values, Carbs, Fats, Protein, Salt, Sugar) VALUES (?,?,?,?,?,?,?,?,?)";
           // execute sql query
           let newrecord = [userLoggedIn,req.sanitize(req.body.Food_Name), req.sanitize(req.body.Typical_Values_per), req.sanitize(req.body.Unit_of_Typical_Values), req.sanitize(req.body.Carbs), req.sanitize(req.body.Fats), req.sanitize(req.body.Protein), req.sanitize(req.body.Salt), req.sanitize(req.body.Sugar)];
           db.query(sqlquery, newrecord, (err, result) => {
             if (err) {
                 // TODO: error handling
               return console.error(err.message);
             }
             else{
                //this is a message to inform users that the food filled in the forms for have been added to the database 
                res.send(' This food has added to database <a href='+'./'+'>Home</a> ');
             }
             });
        }
           
      });    

      
    //getting data from the searchFood.ejs
    app.get('/searchFood',  function(req,res){
        res.render("searchFood.ejs", RecipeData);
    });

    //getting the corresponding foods based on the keywords typed in by the user with validation methods
    //to ensure the user is entering atleast one character into the search bar and sanitizing the field to prevent cross site scripting
    app.get('/searchFood-result',[check('keyword').isLength(1)],[check('keyword').isAlpha()],  function (req, res) {
         //if the validation checks arent met then redirect 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./searchFood'); 
        }
        else {
            //sanitized the search field to prevent cross scripting attacks 
            let sqlquery = "SELECT * FROM FOOD WHERE Food_Name  LIKE '%" + req.sanitize(req.query.keyword) + "%'"; // query database to get all the books
            // execute sql query
            db.query(sqlquery, (err, result) => {
                //if there is an error with the search the user will be redirected or if the food doesn't exist then a message saying it doesnt exist will be shown
                // and if the query has no errors then a selection of foods with the same characters will be selected
                if (err) {
                    res.redirect('./'); 
                }
                if(result[0]== undefined){
                    res.send(' This food doesnt exist in the database <a href='+'./'+'>Home</a> ')
                }else{
                    //assigns the data taken from the database and all the information in association with the food to be displayed on the
                    //Display food page
                    let newData = Object.assign({}, RecipeData, {availableFood:result});
                
                    res.render("DisplayFood.ejs", newData)
                }
               
            });        
        }
         
    });

    //getting the updateFood.ejs 
    app.get('/updateFood', redirectLogin,  function(req,res){
        res.render("updateFood.ejs", RecipeData);
    });

    //getting the data and processing it after the user types in a food to be updated once the validation requirments are met.
    app.get('/UpdateFood-result',[check('keyword').isLength(1)],[check('keyword').isAlpha()],  function (req, res) {
         //if the validation checks arent met then redirect 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./updateFood'); 
        }
        else {
            //sanitized the update food search field to prevent cross scripting attacks and asking for the food in the database
            //storing the name of the food in a database to be used a tracker regarding the name of the food the user typed which will be needed
            //when identifying the name of the food's record the user wants deleted.
            let sqlquery = "SELECT * FROM FOOD WHERE Food_Name ='" + req.sanitize(req.query.keyword) + "'";
            updateTracker = req.query.keyword;
            deleter = req.query.keyword;
            // execute sql query
            db.query(sqlquery, (err, result) => {
                //if there is an error with the search the user will be redirected or of the food isnt in the database a message stating that is displayed
                // and if the query has no errors then a selection of foods with the same character will be selected
                if (err) {
                    res.redirect('./'); 
                }
                if(result[0]== undefined){
                    res.send('Food does not exist  <a href='+'./'+'>Home</a>')
                }else{
                    usernameStorage = result[0].username;
                    let newData = Object.assign({}, RecipeData, {availableFood:result});
                   ////console.log(result)
                    res.render("updateFoodforms.ejs", newData)
                }
               
            });        
        }  
    });

    //creating the route that will handle updating the food in the database as long as its the same user that inserted it after
    //the validation requirments are met
    app.post('/UpdateFoodforms-result',[check('Typical_Values_per').isLength(1)], [check('Typical_Values_per').isInt()], [check('Unit_of_Typical_Values').isLength(1)],[check('Carbs').isLength(1)],[check('Fats').isLength(1)],[check('Protein').isLength(1)],[check('Salt').isLength(1)],[check('Sugar').isLength(1)], [check('Unit_of_Typical_Values').isAlpha()],[check('Carbs').isDecimal()],[check('Fats').isDecimal()],[check('Protein').isDecimal()],[check('Salt').isDecimal()],[check('Sugar').isDecimal()],  function (req, res) {
         //if the validation checks arent met then redirect 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('/usr/154/UpdateFood-result?keyword='+updateTracker+''); 
        }
        else {
            //select all the data related to the food where the username is equivalent to the food requested to be updated
            let sqlquery = "SELECT * FROM FOOD WHERE username ='" + usernameStorage + "'";
            //the db query function is used to implement the actions needed for the update page, such as updating the food informatiom
            db.query(sqlquery, (err, result) =>{                                                                                                                                  
                if(err){
                    //if there is an error then the user is redirected
                    res.redirect('./');
                }else{
                    //if the username associated to the food in the database is equivalent to the username of the user who logged in and is 
                    //attempting to the update the information then they can proceed and do so otherwise they are informed only those who 
                    //put the information in the database can update it
                    if(result[0].username == userLoggedIn){
                        let sqlquery2 = "UPDATE FOOD  SET  Typical_Values_per ='" + req.sanitize(req.body.Typical_Values_per) + "',Unit_of_Typical_Values ='" + req.sanitize(req.body.Unit_of_Typical_Values) + "',Carbs = '" + req.sanitize(req.body.Carbs) + "', Fats = '" + req.sanitize(req.body.Fats) + "',Protein = '" + req.sanitize(req.body.Protein) + "', Salt = '" + req.sanitize(req.body.Salt) + "',Sugar = '" + req.sanitize(req.body.Sugar) + "' WHERE username = '" + usernameStorage + "' ";

                        db.query(sqlquery2, (err, result1) =>{                                                                                                                                 
                            if(err){
                                 console.log(err);
                            }else{
                                res.send('Food Database Updated <a href='+'./'+'>Home</a>');
                            }
                                                                                                                                                                          
                        });
                    }else{res.send('Only the users who added this food can update it <a href='+'./'+'>Home</a>')}
                
                }
            });
           
        }

    });

    //creating the function that allows the user to delete records from the database
    app.post('/deleteFoodform',  function (req, res) {
        
            //select all the data related to the food where the username is equivalent to the food requested to be updated
            let sqlquery = "SELECT * FROM FOOD WHERE username ='" + usernameStorage + "'";
            db.query(sqlquery, (err, result) =>{                                                                                                                                  
                if(err){
                    //if there is an error then the user is redirected
                    res.redirect('./updateFood');
                }else{
                    //if the username associated to the food in the database is equivalent to the username of the user who logged in and is 
                    //attempting to the delete the information then they can proceed and do so otherwise they are informed only those who 
                    //put the information in the database can delete it
                    if(result[0].username == userLoggedIn){
                        
                        let sqlquery2 = "DELETE FROM FOOD WHERE Food_Name ='" + deleter + "'";  

                        db.query(sqlquery2, (err, result1) =>{     
                                                                                                                                                      
                            if(err){
                                res.redirect('./updateFood');
                            }else{
                                res.send('Database item Deleted <a href='+'./'+'>Home</a>');
                            }
                                                                                                                                                                          
                        });

                    }else{res.send('Only users who actually added this food to the database can delete it <a href='+'./'+'>Home</a>')}
                  
                }
            });
         
    
    });

     //creating the function to display the list of foods
     app.get('/listFood', function (req, res) {
        let sqlquery = "SELECT * FROM FOOD"; // query database to get all the foods
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./listFood'); 
            }else{
                let newData = Object.assign({}, RecipeData, {availableFood:result});
                res.render("listFood.ejs", newData)
            }
         });
    });

    //creating the function that will calculate the total amount of values for each food parameter 
    //based on the amount the user puts in the sum to calculate box
    app.post('/calculate',[check('Sum_calculate').isLength(1)], [check('Sum_calculate').isNumeric()], function (req, res){
        //if the validation checks arent met then redirect 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./listFood'); 
        }
        else {
            // a request that asks for an sql counter to be made to count the number of rows
            sqlquery = "SELECT COUNT(1) as count FROM FOOD"
            // a request that asks for all the information in the table to be retrieved
            SumofSql = "SELECT * FROM FOOD"
    
            db.query(sqlquery, (err, result) => {
                if(err){
                    //if an error occurs refresh the page
                    res.redirect('./listFood'); 
                }else{
                    db.query(SumofSql, (err, result2) => {
    
                        if(err){
                            //if an error occurs refresh the page
                            res.redirect('./listFood'); 
                        }
    
                        //variables to store the amount of each calorie component for every iteration depending on the foods they want 
                        //calculated and by how much
                        var Total_Amount_of_Carbs = 0;
                        var Total_Amount_of_Protein = 0;
                        var Total_Amount_of_Salt = 0;
                        var Total_Amount_of_Sugar = 0;
                        var Total_Amount_of_Fats = 0;
                        var Total_Typical_Value = 0;
    
                        //counter
                        var j = 0;
                        //while loop to iterate through the bodies containing the amount to be calculated
                        //it also iterates through count of the food and adds the total to the variables while also keeping the previous amount calculated
                        //stored in the variables so the final output is the correct calculation.
                        while(j<result[0].count)
                        {
                                Total_Amount_of_Carbs = result2[j].Carbs*req.body.Sum_calculate[j]+Total_Amount_of_Carbs;
                                Total_Amount_of_Protein = result2[j].Protein*req.body.Sum_calculate[j]+Total_Amount_of_Protein;
                                Total_Amount_of_Fats = result2[j].Fats*req.body.Sum_calculate[j]+Total_Amount_of_Fats;
                                Total_Amount_of_Salt = result2[j].Salt*req.body.Sum_calculate[j]+Total_Amount_of_Salt;
                                Total_Amount_of_Sugar = result2[j].Sugar*req.body.Sum_calculate[j]+Total_Amount_of_Sugar;
                                Total_Typical_Value = result2[j].Typical_values_per*req.body.Sum_calculate[j]+Total_Typical_Value;
                                j +=1;
                        }
    
                        // displaying the full calculation in a table
                        res.send("<style>"+
                        "table, th, td {"+
                          "border:1.8px solid black;"+
                          "text-align: center;"+
                          "background-color: teal;"+ /* gave a neon green background to the table */
                          "font-family: Arial, sans-serif;"+ /* used arial as a modern font */
                          "transition: background-color 0.4s;"+ /* gave it a smooth transition on hover */
                        "}"+
                        "table tr:hover td {"+ /*  this changesthe background color on hover */
                          "background-color: #FFFF00;"+ /*  gave it a yellow background for impact */
                        "}"+
                        "a {"+
                          "color: black;"+
                          "text-decoration: none;"+ /* removes the underline */
                          "transition: color 0.4s;"+ /*  gives a smooth transition on hover on the home link */
                        "}"+
                        "a:hover {"+ /* changes the text color on hover */
                          "color: #FFFF00;"+ /*  gives a yellow text */
                        "}"+
                        "</style>"+"<a href="+'./'+">Home</a>"+"<h1>Total Caloric Intake</h1>"+
                        "<table style='width:30%'>"+
                          "<tr>"+
                            "<th>Carbs:</th>"+
                            "<th>Protein:</th>"+
                            "<th>Fats:</th>"+
                            "<th>Salt:</th>"+
                            "<th>Sugar:</th>"+
                            "<th>Total_Typical_Value:</th>"+
                          "</tr>"+
                          "<tr>"+
                            "<td>"+Total_Amount_of_Carbs+"</td>"+
                            "<td>"+Total_Amount_of_Protein+"</td>"+
                            "<td>"+Total_Amount_of_Fats+"</td>"+
                            "<td>"+Total_Amount_of_Salt+"</td>"+
                            "<td>"+Total_Amount_of_Sugar+"</td>"+
                            "<td>"+Total_Typical_Value+"</td>"+
                          "</tr>"+
                        "</table>"
                        )
                     });
                }
          
               
                
             });
        }   
    })

    //creating the api function that displays all the foods similar to the keyword the user types
    //in json format
    app.get('/api', function (req,res) {
        
        // Query database to get all the foods
        let sqlquery = "SELECT * FROM FOOD WHERE Food_Name LIKE '%" + req.sanitize(req.query.keyword) + "%'";
        // Execute the sql query
        db.query(sqlquery, (err, result) => { 
            
            if (err) {
                res.redirect('./');
            }
            if(result.length == 0){
                let sqlquery2 = "SELECT * FROM FOOD";
                db.query(sqlquery2, (err, result2) => { 
                    if (err) {
                    res.redirect('./');
                    } 
                    // Return results as a JSON object
                    res.json(result2); 
                    });
            }else{
                // Return results as a JSON object
                res.json(result);
            }
            });
    });

    //creating an api that allows the user to add food items to the database via json data
    app.post('/api', function (req,res){
           // saving data in database
           let sqlquery = "INSERT INTO FOOD(username,Food_Name, Typical_Values_per, Unit_of_Typical_Values, Carbs, Fats, Protein, Salt, Sugar) VALUES (?,?,?,?,?,?,?,?,?)";
           // execute sql query
           let newrecord = [req.sanitize(req.body.username),req.sanitize(req.body.Food_Name), req.sanitize(req.body.Typical_Values_per), req.sanitize(req.body.Unit_of_Typical_Values), req.sanitize(req.body.Carbs), req.sanitize(req.body.Fats), req.sanitize(req.body.Protein), req.sanitize(req.body.Salt), req.sanitize(req.body.Sugar)];
           db.query(sqlquery, newrecord, (err, result) => {
             if (err) {
                //Todo error handling
                 console.log(err);
             }
              //confirmation message that the food has been added to the database  sucessfully
             else{res.send(' This food has added to database');}

             });
    })

    //creating an api that allows the user to update food items to the database via json data
    app.put('/api', function (req,res){
        let sqlquery2 = "UPDATE FOOD SET Typical_Values_per ='" + req.sanitize(req.body.Typical_Values_per) + "',Unit_of_Typical_Values ='" + req.sanitize(req.body.Unit_of_Typical_Values) + "',Carbs = '" + req.sanitize(req.body.Carbs) + "', Fats = '" + req.sanitize(req.body.Fats) + "',Protein = '" + req.sanitize(req.body.Protein) + "', Salt = '" + req.sanitize(req.body.Salt) + "',Sugar = '" + req.sanitize(req.body.Sugar) + "' WHERE id = '" + req.body.id + "' ";
        //sql query to update the food database using the json data provided 
        db.query(sqlquery2, (err, result1) =>{     
            //console.log(result1)                                                                                                                             
            if(err){
                //Todo error handling
                 console.log(err);
            }else{
                //confirmation message that the database has been updated sucessfully
                res.send('Food Database Updated');
            }                                                                                                                                        
        });
    })

    //creating an api that allows the user to add food items to the database via json data
    app.delete('/api', function (req,res){
        //check to see if the food exists in the database first
        let sqlquery3 = "SELECT * FROM FOOD WHERE Food_Name ='" + req.body.Food_Name + "'";
        db.query(sqlquery3, (err, result3) =>{                                                                                                                                
            if(err){
                //Todo error handling
                console.log(err);
            }

            if(result3[0] == undefined){
                //confirmation message that the database has been updated sucessfully to delete the required food item
                res.send('The food doesnt exist in the database');
            }else{
                 //sql query to delete the food from the database using the json data provided 
                let sqlquery2 = "DELETE FROM FOOD WHERE Food_Name ='" + req.body.Food_Name + "'";  
                db.query(sqlquery2, (err, result1) =>{                                                                                                                                
                    if(err){
                        //Todo error handling
                        console.log(err);
                    }else{
                        //confirmation message that the database has been updated sucessfully to delete the required food item
                        res.send('Food item Deleted');
                    }                                                                                                                                               
                });
            }                                                                                                                                         
        });

       
    })

    //creating the function that logs the user out 
    app.get('/logout', redirectLogin, (req,res) => {
        //once the link is clicked to logout the session is destroyed hence logging the user out and providing them with a link to the home page
        // else if there is an error then redirect
        req.session.destroy(err => { 
        if (err) {
        return res.redirect('./') 
        }else{
            //Message to indicate the user has logged out
            res.send('you are now logged out. <a href='+'./'+'>Home</a>');
        }

        })
    })

}
