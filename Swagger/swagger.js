const jsDoc = require('swagger-jsdoc');

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'Social Network Api',
            description: 'Backend to Confession App',
            version: '1.0.0',
        },
        servers: ['http://localhost:5000'],
    },
    apis: ['./Swagger/routes/Users/*.yaml', './Swagger/routes/Posts/*.yaml'],
};

const swaggerDocs = jsDoc(swaggerOptions);

module.exports = swaggerDocs;
