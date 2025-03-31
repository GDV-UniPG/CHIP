const express = require("express");
const app = express();
app.use(express.json());
require("dotenv").config();
const cors = require("cors");
app.use(cors());
const math = require("mathjs");
const similarity = require("compute-cosine-similarity");

const PROTO_PATH = "./proto/poi-toi-scores.proto";
const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const loaderOptions = {
  keepCase: true, 
  defaults: true, 
};

var packageDef = protoLoader.loadSync(PROTO_PATH, loaderOptions);
const grpcObj = grpc.loadPackageDefinition(packageDef);

const client = new grpcObj.poiToiScores(
  process.env.GRPC_SERVER_HOST + ":" + process.env.GRPC_SERVER_PORT,
  grpc.credentials.createInsecure()
);

process.on("uncaughtException", (err) => {
  console.error("uncaughtExeption: ", err.message);
  console.error(err.stack);
  process.exit(1);
});


app.get("/", (req, res) => {
  res.json(true);
});


const swaggerUi = require("swagger-ui-express");
const specs = require("./swagger.js");


app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @openapi
 * '/send-preferences':
 *  post:
 *     tags:
 *     - POI
 *     summary: Returns the ranking of the POIs that most closely match the preferences entered by the user.
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
 *             description: The array should contain one element per Topic of Interest (TOI) in the database.
 *             items:
 *               type: object
 *               required:
 *                 - id_toi
 *                 - preference_score
 *               properties:
 *                 id_toi:
 *                   type: integer
 *                   description: The ID of the TOI
 *                   example: 1
 *                 preference_score:
 *                   type: number
 *                   minimun: 0
 *                   maximum: 5
 *                   description: The preference score for the TOI.
 *                   example: 3
 *             example: 
 *              - id_toi: 1
 *                preference_score: 0
 *              - id_toi: 2
 *                preference_score: 0
 *              - id_toi: 3
 *                preference_score: 5
 *              - id_toi: 4
 *                preference_score: 0
 *              - id_toi: 5
 *                preference_score: 0
 *              - id_toi: 6
 *                preference_score: 0 
 *     responses:
 *      200:
 *        description: Returns the ranking of POIs with the associated scores
 *        content:
 *          application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                   id:
 *                       type: integer
 *                       format: int64
 *                       example: 1
 *                   name:
 *                       type: string
 *                       example: 'Arco Etrusco di Perugia'
 *                   url_primary:
 *                       type: string
 *                       example: 'https://www.umbriatourism.it/it/-/arco-etrusco-di-perugia'
 *                   longitude:
 *                       type: number
 *                       example: 12.38963508605957
 *                   latitude:
 *                       type: number
 *                       example: 43.02018356323242
 *                   score:
 *                       type: number
 *                       example: 0.07087106574772951
 *             example:
 *              - id: 170
 *                name: 'The Sanctuary of Merciful and Eucharistic Love'
 *                url_primary: ''
 *                longitude: 12.482267379760742
 *                latitude: 42.747108459472656
 *                score: 1
 *              - id: 44
 *                name: 'The Collegiata Church of Michele Arcangelo'
 *                url_primary: 'https://www.umbriatourism.it/it/-/collegiata-di-san-michele-arcangelo'
 *                longitude: 12.099006652832031
 *                latitude: 43.02900314331055
 *                score: 0.9860989919799498
 *              - id: 618
 *                name: 'Chapel of San Severo - Perugia'
 *                url_primary: ''
 *                longitude: 12.392200469970703
 *                latitude: 43.11287307739258
 *                score: 0.9219783326781442                             
 *      400:
 *        description: Invalid data provided
 */
app.post("/send-preferences", async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  const userPreferences = req.body;
  
  let userScorePreference = userPreferences
    .sort((a, b) => a.id_toi - b.id_toi)
    .map((el) => el.preference_score/5);
    
  client.getPoiToiScores({}, (err, poiScores) => {
    if (err) {
      if (language == "it") res.status(400).send("Formato dati non valido");
      else res.status(400).send("Invalid data provided");
    }
    if (userScorePreference.length!= poiScores.poi_toi_scores[0].scores.length) {
      if (language == "it") res.status(400).send("Formato dati non valido");
      else res.status(400).send("Invalid data provided");
    } else {
      const poiIds_values = matchingPreferencesPois(
        userScorePreference,
        poiScores.poi_toi_scores
      );


      client.getPois( 
        { poiIds: poiIds_values.bestPoiIds, language: language },
        (err, pois) => {
          let scores = poiIds_values.bestPoiValues;
          let max = Math.max(...scores);
          let min = Math.min(...scores);
          scores = scores.map((el) => (el - min) / (max - min)); 
          pois.pois.forEach((el, index)=>el.score=scores[index])
          res.json(pois.pois);
        }
      );
    }
  });
});

function matchingPreferencesPois(userScorePreference, poiScores) {
  let bestPoiValues = new Array(poiScores.length).fill(-1);
  let bestPoiIds = new Array(poiScores.length).fill("");

  poiScores.forEach((poi) => {
    let value = -1;
    let pos = -1;

    value = similarity(poi.scores, userScorePreference);
    pos = searchPosition(bestPoiValues, value, 0, bestPoiValues.length - 1);

    if (pos != -1) {
      for (let j = bestPoiValues.length - 1; j > pos; j--) {
        bestPoiValues[j] = bestPoiValues[j - 1];
        bestPoiIds[j] = bestPoiIds[j - 1];
      }
      bestPoiValues[pos] = value;
      bestPoiIds[pos] = poi.id_poi;
    }
  });
  return { bestPoiIds, bestPoiValues };
}

function searchPosition(arr, value, minIndex, maxIndex) {
  if (minIndex >= maxIndex) {
    if (value < arr[minIndex]) {
      return minIndex + 1;
    } else {
      return minIndex;
    }
  } else var currentIndex = Math.floor((maxIndex + minIndex) / 2);
  if (value < arr[currentIndex]) {
    return searchPosition(arr, value, currentIndex + 1, maxIndex);
  } else if (value > arr[currentIndex]) {
    return searchPosition(arr, value, minIndex, currentIndex - 1);
  } else {
    return currentIndex + 1;
  }
}

app.listen(process.env.PORT, () => {
  console.log(`POI-TOI Manager is listening on port: ` + process.env.PORT);
});
