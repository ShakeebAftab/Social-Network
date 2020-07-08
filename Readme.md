Social Network API

to use the api create a default.json file in config folder and add
{
"mongoURI": "{Your uri}",
"jwtTokenSecret: "{Your Secret (any string will do)}"
}

if you do not want to do the steps above feel free to handle these variables however you like it.

Swagger Documentation is added
I would suggest to delete the swagger documentation in production environment if you are gonna use it

Disclaimer: Swagger Documentation will not work properly if Config steps arean't done

PS: The Docs folder contain some what rough documentation of the api if you want to look at what the api does without going through all the hastle
