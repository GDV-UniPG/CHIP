import express from "express";
const app = express();
import { pool } from "./db.js";
import dotenv from "dotenv";
dotenv.config();

import fs from 'fs';
import csv from 'csv-parser';

import https from "https";
import cors from "cors";
app.use(cors());

app.use(express.json());

import { user } from "./routes/user.js";
app.use("/user", user);

process.on("uncaughtException", (err) => {
  console.error("uncaughtExeption: ", err.message);
  console.error(err.stack);
  process.exit(1);
});

import swaggerUi from "swagger-ui-express"
import specs from "./swagger.js";

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/", async (req, res) => {
  res.json(true);
});

/**
 * @openapi
 * '/get-tois':
 *  get:
 *     tags:
 *     - No-auth 
 *     summary: Get list of TOIs from db.
 *     parameters:
 *       - in: header
 *         name: accept-language
 *         description: The user's preferred response language.
 *         schema:
 *           type: string
 *           default: 'en'
 *           enum: ['en', 'it']
 *     responses:
 *      200:
 *        description: Returns the list of TOIs 
 *        content:
 *          application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                   id:
 *                       type: integer
 *                       example: 1
 *                   name:
 *                       type: string
 *                       example: 'Paesaggio'
 *             example:
 *              - id: 1
 *                name: 'Paesaggio'
 *              - id: 2
 *                name: 'Cultura'
 *              - id: 3
 *                name: 'Religione'
 *              - id: 4
 *                name: 'Sport'  
 *              - id: 5
 *                name: 'Enogastronimia' 
 *              - id: 6
 *                name: 'Manifattura'                       
 *      500:
 *        description: Internal Server Error
 */
app.get("/get-tois", async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";
  let queryText;
  if (language === "it") {
     queryText = `SELECT DISTINCT(id), nome as name, color FROM toi, poi_toi_score WHERE toi.id=poi_toi_score.id_toi  ORDER BY id`;
  } else {
     queryText = `SELECT DISTINCT(id), name, color FROM toi, poi_toi_score WHERE toi.id=poi_toi_score.id_toi ORDER BY id`;
  }
  pool.query(queryText, (err, result) => {
    if (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
    res.json(result.rows);
  });
});

/**
 * @openapi
 * '/send-ids-for-pois-details':
 *  post:
 *     tags:
 *     - No-auth 
 *     summary: Returns the list of POIs (with all the details) whose id_geo_point is contained in the input array.
 *     parameters:
 *       - in: header
 *         name: accept-language
 *         description: The user's preferred response language.
 *         schema:
 *           type: string
 *           default: 'en'
 *           enum: ['en', 'it']
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *             type: array
 *             description: array of POI ids.
 *             items:
 *               type: integer
 *             example: [170, 44, 618]
 *     responses:
 *      200:
 *        description: Returns the array of POIs details 
 *        content:
 *          application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                   id:
 *                       type: integer
 *                       example: 1
 *                   id_geo_point:
 *                       type: integer
 *                       example: 1 
 *                   name:
 *                       type: string
 *                       example: 'Arco Etrusco di Perugia'
 *                   description:
 *                       type: string
 *                       example: 'Arco Etrusco di Perugia'
 *                   url_primary:
 *                       type: string
 *                       example: 'https://www.umbriatourism.it/it/-/arco-etrusco-di-perugia'
 *                   wiki_url:
 *                       type: string
 *                       example: ''
 *                   latitude:
 *                       type: number
 *                       example: 43.02018356323242
 *                   longitude:
 *                       type: number
 *                       example: 12.38963508605957
 *                   external_links:
 *                       type: array
 *                       items:
 *                          type: string
 *                   image_url:
 *                       type: string
 *                       description: image URL of the POI
 *             example:
 *              - id: 170
 *                id_geo_point: 170
 *                name: 'The Sanctuary of Merciful and Eucharistic Love'
 *                url_primary: null
 *                wiki_url: null
 *                longitude: 12.482267379760742
 *                latitude: 42.747108459472656
 *                external_links: null
 *              - id: 44
 *                id_geo_point: 44
 *                name: 'The Collegiata Church of Michele Arcangelo'
 *                url_primary: 'https://www.umbriatourism.it/it/-/collegiata-di-san-michele-arcangelo'
 *                wiki_url: null
 *                longitude: 12.099006652832031
 *                latitude: 43.02900314331055
 *                external_links: null
 *              - id: 618
 *                id_geo_point: 618
 *                name: 'Chapel of San Severo - Perugia'
 *                url_primary: null
 *                wiki_url: null
 *                longitude: 12.392200469970703
 *                latitude: 43.11287307739258 
 *                external_links: null                        
 *      400:
 *        description: Invalid data provided                       
 *      500:
 *        description: Server Internal Error
 */
app.post("/send-ids-for-pois-details", (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  const poi_ids = req.body;
  let queryText;

  if (language === "it") {
    queryText = `SELECT poi.id,  geo_point.id as id_geo_point, poi.nome AS name, poi.descrizione AS description,
                  url_primary, wiki_url, latitude, longitude, image_url,
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id_toi', toi.id, 
                        'name', toi.nome, 
                        'color', toi.color, 
                        'score', poi_toi_score.score*10
                    ) order by toi.id
                  ) AS toi_scores
              FROM  geo_point LEFT JOIN  poi ON  geo_point.id = poi.id_geo_point
              LEFT JOIN poi_toi_score ON poi.id = poi_toi_score.id_poi
              LEFT JOIN toi ON poi_toi_score.id_toi = toi.id
              WHERE  poi.id = ANY($1)
              GROUP BY poi.id, geo_point.id;`;
  }
  else
    queryText = `SELECT poi.id,  geo_point.id as id_geo_point, poi.name, poi.description_en as description,
                 url_primary, wiki_url, latitude, longitude, image_url,
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id_toi', toi.id, 
                        'name', toi.name, 
                        'color', toi.color, 
                        'score', poi_toi_score.score*10
                    ) order by toi.id
                  ) AS toi_scores
              FROM  geo_point LEFT JOIN  poi ON  geo_point.id = poi.id_geo_point
              LEFT JOIN poi_toi_score ON poi.id = poi_toi_score.id_poi
              LEFT JOIN toi ON poi_toi_score.id_toi = toi.id
              WHERE  poi.id = ANY($1)
              GROUP BY poi.id,  geo_point.id;`;

  pool.query(queryText, [poi_ids], async (err, result) => {
    if (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
    let pois = result.rows
    for (let i = 0; i < pois.length; i++) {
      if (pois[i].name == null) {
        if (language === "it") {
          pois[i].name = "POI rimosso dal sistema"
          pois[i].description = "Questo punto di interesse è stato rimosso dal sistema. I dati relativi non sono più accessibili."
        } else {
          pois[i].name = "POI removed from the system"
          pois[i].description = "This point of interest has been removed from the system. The related data is no longer accessible."
        }
      }
      pois[i] = await getExternalLinks(pois[i])
    }
    res.json(pois);
  });
})

async function getExternalLinks(poi) {
  try {
    let links = await pool.query("SELECT url FROM external_link WHERE id_poi = $1", [poi.id]);
    poi['external_links'] = null
    if (links.rows.length > 0) {
      links = links.rows.map(el => el.url)
      poi['external_links'] = links
    }
    return poi;
  } catch (error) {
    console.error(error.message);

  }

}

/**
 * @openapi
 * '/get-transport-means':
 *  get:
 *     tags:
 *     - No-auth 
 *     summary: Returns the list of possible transport means
 *     responses:
 *      200:
 *        description: Returns the array that contains all possible transport means
 *        content:
 *          application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:   
 *                   name:
 *                       type: string
 *             example:
 *              - name: driving-car
 *              - name: foot-walking
 *              - name: cycling-regular
 *      500:
 *        description: Server Internal Error
 */
app.get("/get-transport-means", (req, res) => {
  pool.query("SELECT name FROM transport_mean", (err, result) => {
    if (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
    res.json(result.rows);
  });
})

/**
 * @openapi
 * '/get-municipality':
 *  get:
 *     tags:
 *     - No-auth 
 *     summary: Returns the list of municipalities with geographic point id
 *     responses:
 *      200:
 *        description: Returns the array that contains all the municipalities
 *        content:
 *          application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:   
 *                   id:
 *                       type: number
 *                   name:
 *                       type: string
 *      500:
 *        description: Server Internal Error
 */
app.get("/get-municipality", (req, res) => {
  pool.query("SELECT id, name FROM municipality ORDER BY name ", (err, result) => {
    if (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
    res.json(result.rows);
  });
})


app.get("/get-poi-min-max-durations", (req, res) => {
  pool.query(`SELECT MIN(duration_min) AS min_duration, MAX(duration_min) AS max_duration
              FROM visit_duration;`, (err, result) => {
    if (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
    res.json(result.rows[0]);
  });
})

app.listen(process.env.PORT_REST, () => {
  console.log(`POI-TOI Manager is listening on port: ` + process.env.PORT_REST);
});



//gRPC SERVER
const PROTO_PATH = "./proto/poi-toi-scores.proto";
import grpc from "grpc";
import protoLoader from "@grpc/proto-loader";

const loaderOptions = {
  keepCase: true,
  defaults: true,
};

var packageDef = protoLoader.loadSync(PROTO_PATH, loaderOptions);
const server = new grpc.Server();
const grpcObj = grpc.loadPackageDefinition(packageDef);

server.addService(grpcObj.poiToiScores.service, {
  getPoiToiScores: async (call, callback) => {
    try {
      let poi_toi_scores = await pool.query(
        `SELECT id_poi, id_toi, score FROM poi_toi_score ORDER BY id_poi, id_toi` //TO-DO: modifica, aggiungi inner Join con tabella toi.
      );
      poi_toi_scores = poi_toi_scores.rows
        .reduce((item, { id_poi, score }) => {
          if (item.get(id_poi)) {
            item.get(id_poi).scores.push(score);
          } else item.set(id_poi, { id_poi, scores: [score] });
          return item;
        }, new Map())
        .values();

      poi_toi_scores = [...poi_toi_scores];
      callback(null, { poi_toi_scores: poi_toi_scores });
    } catch (err) {
      console.error(err.message);
      callback(err, null);
    }
  },

  getPois: async (call, callback) => {
    let poiIds = call.request.poiIds;
    let language = call.request.language;
    let queryText;
    if (language === "it") {
      queryText = `SELECT poi.id, poi.nome AS name, url_primary, longitude, latitude, sentiment.positive,  sentiment.neutral, sentiment.negative, image_url
      FROM poi INNER JOIN geo_point ON poi.id_geo_point=geo_point.id 
      LEFT JOIN sentiment ON sentiment.id_poi =poi.id
      WHERE poi.id=$1`;
    } else {
      queryText = `SELECT poi.id, name, url_primary, longitude, latitude, sentiment.positive, sentiment.neutral, sentiment.negative, image_url
      FROM poi INNER JOIN geo_point ON poi.id_geo_point=geo_point.id 
      LEFT JOIN sentiment ON sentiment.id_poi =poi.id
      WHERE poi.id=$1`;
    }
    let pois = [];
    try {
      for (let i = 0; i < poiIds.length; i++) {
        let poi = await pool.query(queryText, [poiIds[i]]);
        pois.push(poi.rows[0]);
      }
      pois.map(poi => {
        if (poi.positive == null) {
          poi.positive = poi.negative = poi.neutral = -1;
        }
      })

      callback(null, { pois });
    } catch (err) {
      console.error(err.message);
      callback(err, null);
    }
  },
});

server.bindAsync(
  process.env.HOST_GRPC + ":" + process.env.PORT_GRPC,
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log(
      "Server running at http://" +
      process.env.HOST_GRPC +
      ":" +
      process.env.PORT_GRPC
    );
    server.start();
  }
);
