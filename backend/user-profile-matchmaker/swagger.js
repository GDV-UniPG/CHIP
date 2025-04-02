const swaggerJsdoc = require('swagger-jsdoc');
const yaml = require('js-yaml');
const fs = require('fs');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User-Profile Matchmaker API',
      version: '1.0.0',
      description: 'API endpoints for user-profile matchmaker services documented on swagger',
    },
    servers: [
      {
        url: 'http://localhost:3200/',
      },
    ],
  },
  apis: ['./index.js'], 
};

const specs = swaggerJsdoc(options);

const swaggerYAML = yaml.dump(specs);

// Salva la documentazione Swagger in formato YAML su un file
fs.writeFileSync('./swagger.yaml', swaggerYAML, 'utf8');

module.exports = specs;