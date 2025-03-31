import swaggerJsdoc from 'swagger-jsdoc';

import yaml from 'js-yaml';
import fs from'fs';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'POI-TOI Manager API',
      version: '1.0.0',
      description: 'API endpoints for POI-TOI Manager services documented on swagger',
    },    
    components:{
      securitySchemes: {
        BearerAuth: {
            type: 'http',
            in: "header",
            name: "Authorization",
            description: "Bearer Token to access Auth API",
            scheme:'bearer',
            bearerFormat: 'JWT',
      }
    }
    },
    servers: [
      {
        url: 'https://mozart.diei.unipg.it/rasta/poitoimanager/',
      },
    ]
  }, 
  apis: ['./index.js', './routes/*.js'], 
};

const specs = swaggerJsdoc(options);

const swaggerYAML = yaml.dump(specs);

fs.writeFileSync('./swagger.yaml', swaggerYAML, 'utf8');

export default specs;