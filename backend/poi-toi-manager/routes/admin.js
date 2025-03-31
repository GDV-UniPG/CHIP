import express from "express";
const router = express.Router();

import { pool } from "../db.js";
router.use(express.json());

import bcrypt from "bcryptjs";

import { sendEmail, getVerifyLinkEmailMessage } from "./shared_function.js";

import jwt from "jsonwebtoken";

const saltRound = 10;

import path from 'path';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: process.env.IMAGES_FOLDER,
  filename: (req, file, cb) => {
    cb(null, `${req.body.poi_id}.jpg`); 
  },
});
const upload = multer({ storage });

router.post('/images-upload', upload.single('image'), async (req, res) => {
  const poiId = parseInt(req.body.poi_id);
  if (!poiId || !req.file) {
    return res.status(400).send({ error: 'ID POI e immagine sono richiesti.' });
  }

  const imageLink = `https://mozart.diei.unipg.it/rasta/images/images/${poiId}.jpg`;

  try {
    const result = await pool.query(
      'SELECT image_url FROM poi WHERE id = $1',
      [poiId]
    );

    if (result.rows[0].image_url !=null) {

      const existingImageLink = result.rows[0].link;
      const filePath = path.join(process.env.IMAGES_FOLDER, `${poiId}.jpg`);
      fs.writeFileSync(filePath, fs.readFileSync(req.file.path));

      return res.status(200).send({
        message: 'Immagine aggiornata con successo.',
        link: existingImageLink,
      });
    } else {
      await pool.query(
        'UPDATE poi SET image_url=$2 WHERE id=$1',
        [poiId, imageLink]
      );
      
      return res.status(201).send({
        message: 'Immagine caricata e aggiunta al database con successo.',
        link: imageLink,
      });
    }
  } catch (err) {
    console.error('Errore durante l\'operazione:', err);
    res.status(500).send({ error: 'Errore del server.' });
  }
});

/**
 * @openapi
 * '/user/admin/get-admin-info':
 *  get:
 *     tags:
 *     - Admin
 *     security:
 *       - BearerAuth: []
 *     summary: Returns info about admin.
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
 *        description: Returns info about admin.
 *        content:
 *          application/json:
 *            schema:
 *               type: object
 *               properties:
 *                   name:
 *                       type: string
 *                       example: 'Mario'
 *                   surname:
 *                       type: string
 *                       example: 'Rossi'
 *                   email:
 *                       type: string
 *                       example: 'mario.rossi@gmail.com'
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.get("/get-admin-info", async (req, res) => {
  pool.query(
    `SELECT name, surname, email FROM userprofile WHERE id=$1`,
    [req.user],
    async (err, result) => {
      if (err) {
        console.log(err.message);
        res.status(400).json(err.message);
      }
      res.json(result.rows[0]);
    }
  );
});

/**
 * @openapi
 * '/user/admin/add-admin':
 *  post:
 *     tags:
 *     - Admin
 *     security:
 *       - BearerAuth: []
 *     summary: Add a new admin.
 *     description: Adds a new admin user to the system. If the email is already registered but unverified, the user's data is updated and a verification email is sent.
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
 *               type: object
 *               properties:
 *                  email:
 *                      type: string
 *                      example: 'luigi.verdi@gmail.com'
 *                      description: Email of the new admin.
 *                  name:
 *                      type: string
 *                      example: 'Luigi'
 *                      description: First name of the new admin.
 *                  surname:
 *                      type: string
 *                      example: 'Verdi'
 *                      description: Last name of the new admin.                          
 *               required:
 *                - email
 *                - name
 *                - surname
 *     responses:
 *      200:
 *         description: Admin added successfully. A verification email is sent to the new admin.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "An email was sent to the email address: luigi.verdi@gmail.com"                
 *      400:
 *        description: Bad request. The email is already registered or an error occurred during the process.
 *      500:
 *        description: Internal Server Error.
 *      401:
 *        description: Unauthorized
 * 
 */
router.post("/add-admin", async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";
  const user = req.body;
  let password = generatePassword();
  let hashPwd;

  await bcrypt.hash(password, saltRound).then((hash) => {
    hashPwd = hash;
  });

  pool.query(
    `SELECT id, is_verified, name FROM userprofile WHERE email=$1`,
    [user.email],
    async (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(400).json(err.message);
      }
      if (result.rows.length > 0) {
        if (!result.rows[0].is_verified) {
          pool.query(
            `UPDATE userprofile SET password=$1, name=$2, surname=$3 WHERE id=$4`,
            [hashPwd, user.name, user.surname, result.rows[0].id],
            (err) => {
              if (err) {
                console.error(err.message);
                res.status(400).json(err.message);
              }
              let payload = { user: result.rows[0].id };
              let token = jwt.sign(payload, process.env.SECRET_JWT);
              sendEmail({
                from: process.env.EMAIL,
                to: user.email,
                subject: process.env.VerificationEmailLink_title,
                html:
                  getVerifyLinkEmailMessage(
                    result.rows[0].name,
                    token,
                    language
                  ) + getPasswordMessage(password, language),
              }).then((result, err) => {
                if (err || !result) {
                  if (language == "it")
                    res
                      .status(400)
                      .json(
                        "Sembra esserci stato qualche problema. Prova a registrarti di nuovo!"
                      );
                  else
                    res
                      .status(400)
                      .json(
                        "There must have been a problem. Try registering again!"
                      );
                }
                if (language == "it")
                  res
                    .status(400)
                    .json(
                      "Sembra che l'email inserita non sia stata verificata. \n\rUna email è stata inviata all'indirizzo email: " +
                      user.email
                    );
                else
                  res
                    .status(400)
                    .json(
                      "It appears that the email entered has not been verified. \n\rAn email was sent to the email address: " +
                      user.email
                    );
              });
            }
          );
        } else {
          if (language == "it") {
            res.status(400).json("L'email è già presente nel sistema.");
          } else
            res.status(400).json("The email is already present in the system.");
        }
      } else {
        pool.query(
          `INSERT INTO userprofile (id, name, surname, email, password, is_verified, role) 
              VALUES (nextval('userprofile_id_seq'),$1, $2, $3,$4, false, 'admin') RETURNING id, name`,
          [user.name, user.surname, user.email, hashPwd],
          async (err, result) => {
            if (err) {
              console.error(err.message);
              res.status(400).json(err.message);
            }
            let payload = { user: result.rows[0].id };
            let token = jwt.sign(payload, process.env.SECRET_JWT);
            sendEmail({
              from: process.env.EMAIL,
              to: user.email,
              subject: process.env.VerificationEmailLink_title,
              html:
                getVerifyLinkEmailMessage(
                  result.rows[0].name,
                  token,
                  language
                ) + getPasswordMessage(password, language),
            }).then((result, err) => {
              if (err || !result) {
                if (language == "it") {
                  res
                    .status(400)
                    .json(
                      "Sembra esserci stato qualche problema. Prova di nuovo!"
                    );
                } else
                  res
                    .status(400)
                    .json("There must have been a problem. Try again!");
              }
            });

            if (language == "it") {
              res.json(
                "Una email è stata inviata all'indirizzo di posta elettronica: " +
                user.email
              );
            } else
              res.json("An email was sent to the email address: " + user.email);
          }
        );
      }
    }
  );
});

/**
 * @openapi
 * '/user/admin/get-pois':
 *  get:
 *     tags:
 *     - Admin
 *     security:
 *       - BearerAuth: []
 *     summary: Returns the complete list of POIs along with detailed information such as names, descriptions, scores, visit durations, and external links.
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
 *        description: A list of POIs with detailed information.
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                    id:
 *                        type: integer
 *                        example: 1
 *                        description: POI id
 *                    name:
 *                        type: string
 *                        example: 'Sanctuary of the Madonna del Transito of Canoscio'
 *                        description: Name of the POI in English.
 *                    nome:
 *                        type: string
 *                        example: 'Santuario della Madonna del Transito di Canoscio'
 *                        description: Name of the POI in Italian.
 *                    description:
 *                        type: string
 *                        example: 'A historic sanctuary located in Città di Castello.'
 *                        description: Description of the POI in English.
 *                    descrizione:
 *                        type: string
 *                        example: 'Un santuario storico situato a Città di Castello.'
 *                        description: Description of the POI in Italian.
 *                    url_primary:
 *                        type: string
 *                        example:  'https://www.santuariocanoscio.it/'
 *                        description: Primary URL of the POI.
 *                    wiki_url:
 *                        type: string
 *                        example: 'https://it.wikipedia.org/wiki/Santuario_della_Madonna_del_Transito'
 *                        description: Wiki URL of the POI.
 *                    latitude:
 *                        type: number
 *                        format: float
 *                        example: 43.4578
 *                        description: Latitude of the POI.
 *                    longitude:
 *                        type: number
 *                        format: float
 *                        example: 12.2367
 *                        description: Longitude of the POI.
 *                    scores:
 *                        type: array
 *                        items:
 *                          type: object
 *                          properties:
 *                            id:
 *                               type: number
 *                               example: 1
 *                               description: TOI id
 *                            name:
 *                               type: string
 *                               example: "Cultural Significance"
 *                               description: Name of the TOI (Topic of Interest) in English.
 *                            nome:
 *                               type: string
 *                               example: "Significato Culturale"
 *                               description: Name of the TOI in Italian.
 *                            score:
 *                               type: number
 *                               example: 0.5
 *                               description: Score associated with the TOI.
 *                    visit_min_durations:
 *                        type: array
 *                        items:
 *                          type: integer
 *                          example: 30
 *                          description: Suggested minimum visit duration for the POI in minutes.
 *                    external_links:
 *                        type: array
 *                        items:
 *                          type: string
 *                          example: "https://www.visitumbria.com"
 *                          description: External links related to the POI.
 *                    has_score_changed:
 *                        type: boolead
 *                        example: false
 *                        description: indicates whether the scores have been modified by the administrator or not. It is used for automatic recalculation of the scores or not
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 *      400:
 *        description: Bad Request. The query failed to execute due to a client error.
 */
router.get("/get-pois", async (req, res) => {
 let queryText = `SELECT poi.id,  name, nome, description, descrizione, url_primary, wiki_url, latitude, longitude, has_score_changed, image_url, has_been_changed,
        (SELECT jsonb_agg(jsonb_build_object('id', toi.id, 'name', toi.name,'nome', toi.nome, 'score', pts.score)  
        ORDER BY toi.id)
          FROM poi_toi_score pts JOIN toi on pts.id_toi=toi.id
          WHERE pts.id_poi = poi.id
        ) AS scores
  FROM poi inner join geo_point  on poi.id_geo_point=geo_point.id 
  ORDER BY poi.id`;

  pool.query(queryText, async (err, result) => {
    if (err) {
      console.error(err.message);
      res.status(400).json(err.message);
    }
    let pois = result.rows;
    for (let poi of pois) {
      const visit_min_durations = await pool.query(
        `SELECT duration_min FROM visit_duration WHERE id_poi=$1 ORDER BY duration_min`,
        [poi.id]
      );
      const external_links = await pool.query(
        `SELECT url FROM external_link WHERE id_poi=$1`,
        [poi.id]
      );
      poi.visit_min_durations = visit_min_durations.rows;
      poi.external_links = external_links.rows;
    }
    res.json(pois);
  });
});

/**
 * @openapi
 * '/user/admin/add-poi':
 *  post:
 *     tags:
 *     - Admin
 *     security:
 *       - BearerAuth: []
 *     summary: Add a new POI.
 *     parameters:
 *       - in: header
 *         name: accept-language
 *         description: The user's preferred response language.
 *         schema:
 *           type: string
 *           default: 'en'
 *           enum: ['en', 'it']
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Topic to add
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Sanctuary of the Madonna del Transito of Canoscio'
 *                 description: Name of the new POI in English
 *               nome:
 *                 type: string
 *                 example: 'Santuario della Madonna del Transito di Canoscio'
 *                 description: Name of the new POI in Italian
 *               description:
 *                 type: string
 *                 example: 'In the Diocese and municipality of Città di Castello (PG), only about 10 km from the city center, there is the Colle di Canoscio on which the Queen Assumed into Heaven reigns in her Temple dedicated to Her. This is the Basilica-Sanctuary of the “Madonna del Transito” built in the second half of the 19th century. It is a place where the body and spirit are restored, but more than 700 years ago it began its history in a small Majesty, naturally destined to last for a short time; and instead it has stretched out over the centuries, to testify to Mary s love for her children and of these, for a long series of generations, for their dear Mother. The Holy Virgin is therefore very happy to welcome souls in need of help, in need of the caresses of the sweetest of mothers, to bestow her infinite and most precious graces for the greatest glory of God and the salvation of us all.'
 *                 description: Description of the POI in English
 *               descrizione:
 *                 type: string
 *                 example: 'Nella Diocesi e comune di Città di Castello (PG), a soli 10 Km circa dal centro urbano, vi è il Colle di Canoscio sul quale regna la Regina Assunta in Cielo nel suo Tempio a Lei dedicato. Si tratta della Basilica-Santuario della “Madonna del Transito” sorta nella seconda metà del 1800. E’ un luogo in cui si ritempra il corpo e lo spirito che però ben più di 700 anni fa iniziava la sua storia in una piccola Maestà, naturalmente destinata a durare per breve tempo; ed invece si è allungata nei secoli, per testimoniare l’amore di Maria verso i suoi figli e di questi, per una lunga serie di generazioni, verso la loro cara Madre. E’ quindi ben lieta, la Vergine Santa, di accogliere anime bisognose di aiuto, bisognose delle carezze della più dolce delle madri, di elargire le sue infinite e preziosissime grazie per la massima gloria di Dio e la salvezza di tutti noi.'
 *                 description: Description of the POI in Italian
 *               url_primary:
 *                 type: string
 *                 example: 'https://www.santuariocanoscio.it/'
 *                 description: Primary URL of the POI
 *               wiki_url:
 *                 type: string
 *                 example: 'https://it.wikipedia.org/wiki/Santuario_della_Madonna_del_Transito'
 *                 description: Wiki URL of the POI
 *               latitude:
 *                 type: number
 *                 example: 43.4578
 *                 description: Latitude of the POI
 *               longitude:
 *                 type: number
 *                 example: 12.2367
 *                 description: Longitude of the POI
 *               external_links:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - 'https://www.visitumbria.com'
 *                   - 'https://www.tripadvisor.com'
 *                 description: External links related to the POI
 *               visit_min_durations:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example:
 *                   - 30
 *                   - 60
 *                 description: Suggested minimum visit durations for the POI in minutes
 *             required:
 *               - name
 *               - nome
 *               - description
 *               - descrizione
 *               - latitude
 *               - longitude
 *     responses:
 *       200:
 *         description: Success message in English or Italian, depending on the language chosen by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: 'Added TOI correctly'
 *       500:
 *         description: Internal Server Error
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Error
 */

router.post("/add-poi", (req, res) => {

  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  const poi = req.body; 
  pool.query(
    `INSERT INTO geo_point (id, latitude, longitude) VALUES (nextval('geo_point_id_seq'),$1, $2) RETURNING id`,
    [poi.latitude, poi.longitude],
    (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(400).json(err.message);
      }
      pool.query(
        `INSERT INTO poi (id, name, nome, description, descrizione, url_primary, wiki_url, id_geo_point,has_been_changed, has_score_changed)
         VALUES (nextval('poi_id_seq'), $1, $2, $3, $4,$5, $6, $7, $8, $9) RETURNING id`,
        [
          poi.name,
          poi.nome,
          poi.description,
          poi.descrizione,
          poi.url_primary,
          poi.wiki_url,
          result.rows[0].id,
          true,
          false
        ],
        (err, result) => {
          if (err) {
            console.error(err.message);
            res.status(400).json(err.message);
          }
          let poiId = result.rows[0].id;

          let durationKeys = Object.keys(poi.visit_min_durations);
          durationKeys.forEach(async (i) => {
            await addVisitDuration(i, poiId, poi.visit_min_durations[i]);
          });

          if (poi.external_links != undefined) {
            let props = Object.keys(poi.external_links);
            if (props.length > 0) {
              props.forEach(async (i) => {
                addExternalLink(poiId, poi.external_links[i]);
              });
            }
          }

          if (language == "it") {
            res.json({message:"POI aggiunto correttamente", id:poiId});
          } else {
            res.json({message:"Added POI correctly", id:poiId});
          }
        }
      );
    }
  );
});

/**
 * @openapi
 * '/user/admin/delete-poi/{id}':
 *  delete:
 *     tags:
 *     - Admin
 *     security:
 *       - BearerAuth: []
 *     summary: Remove POI from system.
 *     parameters:
 *       - in: header
 *         name: accept-language
 *         description: The user's preferred response language.
 *         schema:
 *           type: string
 *           default: 'en'
 *           enum: ['en', 'it']
 *       - name: id
 *         in: path
 *         description: POI id
 *         required: true
 *         schema:
 *          type: integer
 *     responses:
 *      200:
 *        type: string
 *        example: 'Deleted POI correctly'
 *        description: Removal success message based on user's chosen language
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.delete("/delete-poi/:id", (req, res) => {
  const id = req.params.id;
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  pool.query(
    `DELETE FROM poi WHERE id=$1 RETURNING id_geo_point`,
    [id],
    (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(400).json(err.message);
      }
      pool.query(
        `DELETE FROM geo_point WHERE id=$1`,
        [result.rows[0].id_geo_point],
        (err) => {
          if (err) {
            console.error(err.message);
            res.status(400).json(err.message);
          }
          if (language == "it") {
            res.json("POI eliminato correttamente");
          } else res.json("Deleted POI correctly");
        }
      );
    }
  );
});

/*
/**
 * @openapi
 * '/user/admin/update-poi':
 *  put:
 *     tags:
 *     - Admin
 *     security:
 *       - BearerAuth: []
 *     summary: Update a POI.
 *     parameters:
 *       - in: header
 *         name: accept-language
 *         description: The user's preferred response language.
 *         schema:
 *           type: string
 *           default: 'en'
 *           enum: ['en', 'it']
  *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Topic to add
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Sanctuary of the Madonna del Transito of Canoscio'
 *                 description: Name of the new POI in English
 *               nome:
 *                 type: string
 *                 example: 'Santuario della Madonna del Transito di Canoscio'
 *                 description: Name of the new POI in Italian
 *               description:
 *                 type: string
 *                 example: 'In the Diocese and municipality of Città di Castello (PG), only about 10 km from the city center, there is the Colle di Canoscio on which the Queen Assumed into Heaven reigns in her Temple dedicated to Her. This is the Basilica-Sanctuary of the “Madonna del Transito” built in the second half of the 19th century. It is a place where the body and spirit are restored, but more than 700 years ago it began its history in a small Majesty, naturally destined to last for a short time; and instead it has stretched out over the centuries, to testify to Mary s love for her children and of these, for a long series of generations, for their dear Mother. The Holy Virgin is therefore very happy to welcome souls in need of help, in need of the caresses of the sweetest of mothers, to bestow her infinite and most precious graces for the greatest glory of God and the salvation of us all.'
 *                 description: Description of the POI in English
 *               descrizione:
 *                 type: string
 *                 example: 'Nella Diocesi e comune di Città di Castello (PG), a soli 10 Km circa dal centro urbano, vi è il Colle di Canoscio sul quale regna la Regina Assunta in Cielo nel suo Tempio a Lei dedicato. Si tratta della Basilica-Santuario della “Madonna del Transito” sorta nella seconda metà del 1800. E’ un luogo in cui si ritempra il corpo e lo spirito che però ben più di 700 anni fa iniziava la sua storia in una piccola Maestà, naturalmente destinata a durare per breve tempo; ed invece si è allungata nei secoli, per testimoniare l’amore di Maria verso i suoi figli e di questi, per una lunga serie di generazioni, verso la loro cara Madre. E’ quindi ben lieta, la Vergine Santa, di accogliere anime bisognose di aiuto, bisognose delle carezze della più dolce delle madri, di elargire le sue infinite e preziosissime grazie per la massima gloria di Dio e la salvezza di tutti noi.'
 *                 description: Description of the POI in Italian
 *               url_primary:
 *                 type: string
 *                 example: 'https://www.santuariocanoscio.it/'
 *                 description: Primary URL of the POI
 *               wiki_url:
 *                 type: string
 *                 example: 'https://it.wikipedia.org/wiki/Santuario_della_Madonna_del_Transito'
 *                 description: Wiki URL of the POI
 *               latitude:
 *                 type: number
 *                 example: 43.4578
 *                 description: Latitude of the POI
 *               longitude:
 *                 type: number
 *                 example: 12.2367
 *                 description: Longitude of the POI
 *               external_links:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - 'https://www.visitumbria.com'
 *                   - 'https://www.tripadvisor.com'
 *                 description: External links related to the POI
 *               visit_min_durations:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example:
 *                   - 30
 *                   - 60
 *                 description: Suggested minimum visit durations for the POI in minutes      
 *               has_score_changed:
 *                 type: boolead   
 *                 example: false                  
 *               required:
 *                - name
 *                - nome
 *                - description
 *                - descrizione
 *     responses:
 *      200:
 *        description: Success message in English or Italian, depending on the language chosen by the user
 *        type: string 
 *        example: 'Updated TOI correctly'                 
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 *      400:
 *        description: Error
 */
router.put("/update-poi", async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  const updatedPoi = req.body;
  
  let has_been_changed = false;
  let description = await pool.query(
    `SELECT description, has_score_changed FROM poi WHERE poi.id=$1`,
    [updatedPoi.id]
  );
  if (description.rows[0].description !== updatedPoi.description) has_been_changed = true;
  if (description.rows[0].has_score_changed && !updatedPoi.has_score_changed) has_been_changed = true;  

  if (updatedPoi.has_score_changed) {
    updatedPoi.scores.forEach(async (score) => {
      await pool.query(
        `UPDATE poi_toi_score SET score=$1 WHERE id_poi=$2 AND id_toi=$3`,
     
        [score.score, updatedPoi.id, score.id]
      );
    })
    await updateNormalizedScoresForPOI(updatedPoi.id);
  }
  pool.query(
    `UPDATE poi SET name=$1, nome=$2, description=$3, descrizione=$4, url_primary=$5, wiki_url=$6, has_been_changed=$7, has_score_changed=$9 WHERE id=$8`,
    [
      updatedPoi.name,
      updatedPoi.nome,
      updatedPoi.description,
      updatedPoi.descrizione,
      updatedPoi.url_primary,
      updatedPoi.wiki_url,
      has_been_changed,
      updatedPoi.id,
      updatedPoi.has_score_changed
    ],
    async (err) => {
      if (err) {
        console.error(err.message);
        res.status(400).json(err.message);
      }

      pool.query(
        `SELECT id_geo_point FROM poi
        WHERE poi.id=$1`,
        [updatedPoi.id],
        async (err, result) => {
          if (err) {
            console.error(err.message);
            res.status(400).json(err.message);
          }
          let id = result.rows[0].id_geo_point;
          await updateGeoPoint(updatedPoi.latitude, updatedPoi.longitude, id);
        }
      );

      await updateVisitDurations(updatedPoi.id, updatedPoi.visit_min_durations);
      await updateExternalLinks(updatedPoi.id, updatedPoi.external_links);
      if (language == "it") {
        res.json("POI aggiornato correttamente");
      } else res.json("Updated POI correctly");
    }
  );
});

async function addVisitDuration(index, poiId, visit_duration) {
  pool.query(
    `INSERT INTO visit_duration (id_visit, id_poi, duration_min) VALUES ($3 ,$1, $2)`,
    [poiId, visit_duration, index],
    (err) => {
      if (err) {
        console.error(err.message);
        res.status(400).json(err.message);
      }
    }
  );
}

async function deleteVisitDuration(id_visit, id_poi) {
  pool.query(
    `DELETE FROM visit_duration WHERE id_visit=$1 AND id_poi=$2`,
    [id_visit, id_poi],
    (err) => {
      if (err) {
        console.error(err.message);
        res.status(400).json(err.message);
      }
    }
  );
}

async function addExternalLink(poiId, external_link) {
  pool.query(
    `INSERT INTO external_link (id_url, id_poi, url) VALUES (nextval('external_link_id_url_seq') ,$1, $2)`,
    [poiId, external_link],
    (err) => {
      if (err) {
        console.error(err.message);
        res.status(400).json(err.message);
      }
    }
  );
}

async function deleteExternalLink(idUrl) {
  pool.query(`DELETE FROM external_link WHERE id_url=$1`, [idUrl], (err) => {
    if (err) {
      console.error(err.message);
      res.status(400).json(err.message);
    }
  });
}

async function updateGeoPoint(latitude, longitude, id) {
  pool.query(
    `SELECT latitude, longitude FROM geo_point WHERE id=$1`,
    [id],
    (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(400).json(err.message);
      }
      let lat = result.rows[0].latitude;
      let long = result.rows[0].longitude;
      if (lat !== latitude || long !== longitude) { 
        pool.query(
          `UPDATE geo_point SET latitude=$2, longitude=$3 WHERE id=$1`,
          [id, latitude, longitude],
          (err, result) => {
            if (err) {
              console.error(err.message);
              res.status(400).json(err.message);
            }
          }
        );
      }
    }
  );
}

async function updateVisitDurations(id_poi, visit_durations) {
  pool.query(
    `SELECT id_visit, duration_min FROM visit_duration
        WHERE visit_duration.id_poi=$1`,
    [id_poi],
    (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(400).json(err.message);
      }

      let ids_visit = result.rows.map((e) => e.id_visit);
      let updated_ids_visit = Object.keys(visit_durations).map(Number);

      let duration_values = result.rows.map((e) => e.duration_min);
      let updated_duration_values = Object.values(visit_durations);

      if (ids_visit.length > updated_ids_visit.length) {
         updated_ids_visit.forEach((e, i) => {
          pool.query(
            `UPDATE visit_duration SET duration_min=$2  WHERE id_visit=$1 AND id_poi=$3`,
            [ids_visit[i], visit_durations[e], id_poi],
            (err, result) => {
              if (err) {
                console.error(err.message);
                res.status(400).json(err.message);
              }
            }
          );
        });

        let numberOfRowToDelete = ids_visit.length - updated_ids_visit.length;
        for (
          let i = ids_visit.length - 1;
          i >= ids_visit.length - numberOfRowToDelete;
          i--
        ) {
          deleteVisitDuration(ids_visit[i], id_poi);
        }
      } else {
        let changed = false;
        if (ids_visit.length == updated_ids_visit.length) {
          duration_values.forEach((e, i) => {
            if (e != updated_duration_values[i]) {
              changed = true;
            }
          });
        } else {
          changed = true;
        }

        if (changed) {
          updated_ids_visit.forEach((e, i) => {
            pool.query(
              `UPDATE visit_duration SET duration_min=$2  WHERE id_visit=$1 AND id_poi=$3`,
              [e, visit_durations[updated_ids_visit[i]], id_poi],
              (err, result) => {
                if (err) {
                  console.error(err.message);
                  res.status(400).json(err.message);
                }
              }
            );
          });
          if (ids_visit.length < updated_ids_visit.length) {
            const diff_ids = updated_ids_visit.filter(
              (elemento) => !ids_visit.includes(elemento)
            );
            diff_ids.forEach((id) =>
              addVisitDuration(id, id_poi, visit_durations[id])
            );
          }
        }
      }
    }
  );
}

async function updateExternalLinks(id_poi, external_links) {
  pool.query(
    `SELECT id_url FROM external_link
    WHERE id_poi=$1`,
    [id_poi],
    (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(400).json(err.message);
      }

      let ids_urlIntoDb = result.rows.map((e) => e.id_url);
      let urlKeys = Object.keys(external_links);

      if (ids_urlIntoDb.length > urlKeys.length) {
        urlKeys.forEach((e, i) => {
          pool.query(
            `UPDATE external_link SET url=$2  WHERE id_url=$1`,
            [ids_urlIntoDb[i], external_links[e]],
            (err, result) => {
              if (err) {
                console.error(err.message);
                res.status(400).json(err.message);
              }
            }
          );
        });

        let numberOfRowToDelete = ids_urlIntoDb.length - urlKeys.length;

        for (
          let i = ids_urlIntoDb.length - 1;
          i >= ids_urlIntoDb.length - numberOfRowToDelete;
          i--
        ) {
          deleteExternalLink(ids_urlIntoDb[i]);
        }
      } else {
        ids_urlIntoDb.forEach((e, i) => {
          pool.query(
            `UPDATE external_link SET url=$2  WHERE id_url=$1`,
            [e, external_links[urlKeys[i]]],
            (err, result) => {
              if (err) {
                console.error(err.message);
                res.status(400).json(err.message);
              }
            }
          );
        });
        if (ids_urlIntoDb.length < urlKeys.length) {
          let numberOfRowToAdd = urlKeys.length - ids_urlIntoDb.length;
          for (
            let i = urlKeys.length - 1;
            i >= urlKeys.length - numberOfRowToAdd;
            i--
          ) {
            addExternalLink(id_poi, external_links[urlKeys[i]]);
          }
        }
      }
    }
  );
}


import request from "request";
import { DataFrame } from 'dataframe-js'
import fs from "fs";

async function createCsv() {
  let query = `SELECT * FROM geo_point, poi WHERE geo_point.id=poi.id_geo_point ORDER BY geo_point.id`;
  pool.query(query, (err, result) => {
    if (err) {
      console.error(err.message);
    }
    let locations = result.rows.map((el) => [el.longitude, el.latitude]);
    let poi_ids = result.rows.map((el) => [el.id])
    request(
      {
        method: "POST",
        url: "http://localhost:8082/ors/v2/matrix/driving-car",
        body: '{"locations":' + JSON.stringify(locations) + '}',
        headers: {
          Accept:
            "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
          Authorization: "your-api-key",
          "Content-Type": "application/json; charset=utf-8",
        },
      }, (err, response, body) => {
        if (err) console.log(err)
        else {
          let durations_matrix = JSON.parse(body)['durations']
          durations_matrix = durations_matrix.map((el, index) => poi_ids[index].concat(el))
          let columns = [''].concat(poi_ids)
          const df = new DataFrame(durations_matrix, columns)
          const csvData = df.toCSV(true, 'dataframe.csv');
          fs.writeFileSync('dataframe.csv', csvData);
        }

      }
    );
  });
}

//TOI
/**
 * @openapi
 * '/user/admin/get-all-tois':
 *  get:
 *     tags:
 *     - Admin
 *     security:
 *       - BearerAuth: []
 *     summary: Returns the complete list of all TOIs, even those whose score has not yet been associated with the POIs
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
 *        description: List of TOIs
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                    id:
 *                        type: integer
 *                        example: 1
 *                        description: TOI id
 *                    name:
 *                        type: string
 *                        example: 'Landscape'
 *                        description: TOI name in English
 *                    nome:
 *                        type: string
 *                        example: 'Paesaggio'
 *                        description: TOI name in Italian
 *                    description:
 *                        type: string
 *                        example: 'nature natural water mountain river villages park lake landscape city wildlife springs waterfalls valley hill bay skyline gardens'
 *                        description: List of words related to the TOI in English
 *                    descrizione:
 *                        type: string
 *                        example: 'nature natural water mountain river villages park lake landscape city wildlife springs waterfalls valley hill bay skyline gardens'
 *                        description: List of words related to the TOI in Italian
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.get("/get-all-tois", (req, res) => {
  let queryText = `SELECT id, name, nome, description, descrizione, color, has_been_changed FROM toi ORDER BY toi.id`;
  pool.query(queryText, (err, result) => {
    if (err) {
      console.error(err.message);
      res.status(400).json(err.message);
    }
    res.json(result.rows);
  });
});

/**
 * @openapi
 * '/user/admin/add-toi':
 *  post:
 *     tags:
 *     - Admin
 *     security:
 *       - BearerAuth: []
 *     summary: Add a new TOI.
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
 *               type: object
 *               description: Topic to add
 *               properties:
 *                  name:
 *                      type: string
 *                      example: 'Nature'
 *                      description: New topic name in english
 *                  nome:
 *                      type: string
 *                      example: 'Natura'
 *                      description: Name of the new topic in Italian
 *                  description:
 *                      type: string
 *                      example: 'tree mountain see river sky forest plant seed leaf animal bird fish sun wind cloud rain'
 *                      description: List of words related to the topic in English 
 *                  descrizione:
 *                      type: string
 *                      example: 'albero montagna vedere fiume cielo foresta pianta seme foglia animale uccello pesce sole vento nuvola pioggia'
 *                      description: List of words related to the topic in Italian    
 *                  color:
 *                      type: string
 *                      example: "#000"
 *                      description: Color associated with TOI                            
 *               required:
 *                - name
 *                - nome
 *                - description
 *                - descrizione
 *                - color
 *     responses:
 *      200:
 *        description: Success message in English or Italian, depending on the language chosen by the user
 *        type: string 
 *        example: 'Added TOI correctly'                 
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 *      400:
 *        description: Error
 */
router.post("/add-toi", (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";
  const toi = req.body;
  pool.query(
    `INSERT INTO toi (id, name, nome, description,descrizione, has_been_changed, color) VALUES (nextval('toi_id_seq'),$1, $2, $3, $4, $5, $6)`,
    [toi.name, toi.nome, toi.description, toi.descrizione, true, toi.color],
    (err) => {
      if (err) {
        console.error(err.message);
        res.status(400).json(err.message);
      }
      if (language == "it") {
        res.json("TOI aggiunto correttamente");
      } else res.json("Added TOI correctly");
    }
  );
});

/**
 * @openapi
 * '/user/admin/update-toi':
 *  put:
 *     tags:
 *     - Admin
 *     security:
 *       - BearerAuth: []
 *     summary: Update a TOI.
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
 *               type: object
 *               description: Topic to update
 *               properties:
 *                  id:
 *                      type: number
 *                      example: 1
 *                      description: TOI id
 *                  name:
 *                      type: string
 *                      example: 'Landscape'
 *                      description: Topic name updated in English
 *                  nome:
 *                      type: string
 *                      example: 'Paesaggio'
 *                      description: Topic name updated in Italian
 *                  description:
 *                      type: string
 *                      example: 'tree mountain see river sky forest plant seed leaf animal bird fish sun wind cloud rain'
 *                      description: Updated list of words related to the topic in English 
 *                  descrizione:
 *                      type: string
 *                      example: 'albero montagna vedere fiume cielo foresta pianta seme foglia animale uccello pesce sole vento nuvola pioggia'
 *                      description: Updated list of words related to the topic in Italian
 *                  color:
 *                      type: string
 *                      example: '#000'
 *                      description: Color associated with TOI                                
 *               required:
 *                - name
 *                - nome
 *                - description
 *                - descrizione
 *                - color
 *     responses:
 *      200:
 *        description: Success message in English or Italian, depending on the language chosen by the user
 *        type: string 
 *        example: 'Updated TOI correctly'                 
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 *      400:
 *        description: Error
 */
router.put("/update-toi", (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";
  const updatedToi = req.body;
  let hasBeenChanged=false;
   pool.query(
    `SELECT description, has_been_changed FROM toi WHERE id=$1`, [updatedToi.id],    (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(400).json(err.message);
      }
      if(result.rows[0].description!=updatedToi.description || result.rows[0].has_been_changed ){
        hasBeenChanged=true;
      }
      pool.query(
        `UPDATE toi SET name=$1, nome=$2, description=$3, descrizione=$4, color=$7, has_been_changed=$5 WHERE id=$6`,
        [
          updatedToi.name,
          updatedToi.nome,
          updatedToi.description,
          updatedToi.descrizione,
          hasBeenChanged,
          updatedToi.id,
          updatedToi.color
        ],
        (err) => {
          if (err) {
            console.error(err.message);
            res.status(400).json(err.message);
          }
          if (language == "it") {
            res.json("TOI aggiornato correttamente");
          } else res.json("Updated TOI correctly");
        }
      );
    }
    )

  
});

/**
 * @openapi
 * '/user/admin/delete-toi/{id}':
 *  delete:
 *     tags:
 *     - Admin
 *     security:
 *       - BearerAuth: []
 *     summary: Remove TOI from system.
 *     parameters:
 *       - in: header
 *         name: accept-language
 *         description: The user's preferred response language.
 *         schema:
 *           type: string
 *           default: 'en'
 *           enum: ['en', 'it']
 *       - name: id
 *         in: path
 *         description: POI id
 *         required: true
 *         schema:
 *          type: integer
 *     responses:
 *      200:
 *        type: string
 *        example: 'Deleted TOI correctly'
 *        description: Removal success message based on user's chosen language
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.delete("/delete-toi/:id", (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";
  const id = req.params.id;
  pool.query(`DELETE FROM toi WHERE id=$1`, [id], (err) => {
    if (err) {
      console.error(err.message);
      res.status(400).json(err.message);
    }
    pool.query(
      `UPDATE toi SET has_been_changed=$1`, [true], (err) => {
        if (err) {
          console.error(err.message);
          res.status(400).json(err.message);
        }
        if (language == "it") {
          res.json("TOI eliminato correttamente");
        } else res.json("Deleted TOI correctly");
      })

  });
});

function generatePassword() {
  let length = 10;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

function getPasswordMessage(password, language) {
  if (language == "it")
    return (
      "<br> La password generata per il tuo account è: " +
      password +
      '<br> Puoi modificarla nella sezione "Profilo" dopo aver effettuato il login'
    );
  else
    return (
      "<br><br> The password generated for your account is: <i>" +
      password +
      '</i> , you can change it in the "Profile" section after logging in.'
    );
}

router.get('/get-similarity-poi-graph-data', (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";
  let queryText;
  if (language == "it")
    queryText = `SELECT DISTINCT ON(poi.id) poi.id, poi.nome AS name, geo_point.latitude, geo_point.longitude, pts1.id_toi AS toi, scores_vector.scores_vector, scores.scores
                 FROM poi 
                   JOIN geo_point ON poi.id = geo_point.id 
                   JOIN poi_toi_score pts1 ON poi.id = pts1.id_poi
                   JOIN (SELECT id_poi, ARRAY_AGG(normalized_score ORDER BY id_toi) AS scores_vector 
                         FROM poi_toi_score GROUP BY id_poi) AS scores_vector ON poi.id = scores_vector.id_poi
                   JOIN (SELECT id_poi, ARRAY_AGG(score ORDER BY id_toi) AS scores 
                         FROM poi_toi_score  GROUP BY id_poi) AS scores ON poi.id = scores.id_poi
                 ORDER BY poi.id, pts1.score DESC, pts1.normalized_score DESC;`
  else
    queryText = `SELECT DISTINCT ON(poi.id) poi.id, name, geo_point.latitude, geo_point.longitude, pts1.id_toi AS toi, scores_vector.scores_vector, scores.scores
                 FROM poi 
                   JOIN geo_point ON poi.id = geo_point.id 
                   JOIN poi_toi_score pts1 ON poi.id = pts1.id_poi
                   JOIN (SELECT id_poi, ARRAY_AGG(normalized_score ORDER BY id_toi) AS scores_vector 
                         FROM poi_toi_score GROUP BY id_poi) AS scores_vector ON poi.id = scores_vector.id_poi
                   JOIN (SELECT id_poi, ARRAY_AGG(score ORDER BY id_toi) AS scores 
                         FROM poi_toi_score  GROUP BY id_poi) AS scores ON poi.id = scores.id_poi
                 ORDER BY poi.id,  pts1.score DESC, pts1.normalized_score DESC;;`

  pool.query(queryText, async (err, result) => {
    if (err) {
      console.error(err.message);
      res.status(400).json(err.message);
    } else {
      try {
        let nodes = result.rows;
        
        return res.json({
          nodes: nodes
        })
      } catch (err) {
        console.error(err);
        return res.status(500).json(err.message);
      }
    }
  })
});





///gRPC function///

//GRPc client for Scorer: 
const PROTO_PATH = "./proto/poi_toi.proto";
import grpc from "grpc";
import protoLoader from "@grpc/proto-loader";
import parquet from "parquetjs-lite";

const loaderOptions = {
  keepCase: true,
  defaults: true,
};

var packageDef = protoLoader.loadSync(PROTO_PATH, loaderOptions);

const poiToiProto = grpc.loadPackageDefinition(packageDef).poi_toi;

const client = new poiToiProto.PoiToiScorer(
  process.env.GRPC_SERVER_HOST + ":" + process.env.GRPC_SERVER_PORT,
  grpc.credentials.createInsecure()
);


/*
    read pois and tois from POI-TOI-DB and return them to POI-TOI-SCORER 
    write poi-toi-scores in POI-TOI-DB and generate new csv file.
*/


router.get("/start-poi-toi-score-computation", async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  const changedTois = await pool.query(
    `SELECT id  FROM toi WHERE has_been_changed='true'`
  );
  const tois = await pool.query(`SELECT id, name, description FROM toi`);
  let pois;
  let toiChangedIds=changedTois.rows.map(el=> el.id)
  if (changedTois.rows.length > 0) {
    pois = await pool.query(`SELECT id, name, description FROM poi`);
  } else {
   pois = await pool.query(
      `SELECT id, name, description FROM poi WHERE has_been_changed='true' AND has_score_changed='false'`
    );
  }

  if (pois.rows.length > 0) {
    const schema = new parquet.ParquetSchema({
      id: { type: "INT32" },
      name: { type: "UTF8" },
      description: { type: "UTF8" },
    });

    const schemaToi = new parquet.ParquetSchema({
      id: { type: "INT32" },
      name: { type: "UTF8" },
      description: { type: "UTF8" },
    });

    const writer = await parquet.ParquetWriter.openFile(schema, process.env.SHARED_FOLDER + "poi.parquet");
    const writerToi = await parquet.ParquetWriter.openFile(schemaToi, process.env.SHARED_FOLDER + "toi.parquet"
    );


    pois.rows.forEach((poi) => {
      writer.appendRow(poi);
    });

    tois.rows.forEach((toi) => {
      writerToi.appendRow(toi);
    });

    await writer.close((err) => {
      if (err) {
        console.error(err);
      } else {
        console.log("File Parquet POI creato con successo.");
      }
    });

    await writerToi.close((err) => {
      if (err) {
        console.error(err);
      } else {
        console.log("File Parquet TOI creato con successo.");
      }
    });

    client.CalculateScore({ poi_file_path: 'poi.parquet', toi_file_path: 'toi.parquet' },
      async (error, response) => {

        if (error) {
          console.error('Errore:', error);
          res.status(500).send('Errore:', error);
        } else {
          const poi_toi_score_file = response.score_file_path;
          if (!poi_toi_score_file) {
            console.error('Il server gRPC non ha fornito il link al file Parquet');
            return res.status(400).send('File Parquet non trovato nel risultato');
          }
          try {
            const filePath = process.env.SHARED_FOLDER + poi_toi_score_file;
            if (!fs.existsSync(filePath)) {
              console.error('Il file Parquet non esiste:', filePath);
              return res.status(400).send('File Parquet non trovato');
            }

            const reader = await parquet.ParquetReader.openFile(filePath);
            const cursor = reader.getCursor();
            let record;
            while ((record = await cursor.next())) {

              record.score = parseFloat(record.score.toFixed(8));
              let isPOIAlreadyScored = await pool.query(`SELECT id_poi FROM poi_toi_score WHERE id_poi=$1 AND id_toi=$2`, [record.id_poi, record.id_toi])
              
              if(toiChangedIds.includes(parseInt(record.id_toi))){
                await pool.query(
                  `INSERT INTO poi_toi_score (id_poi, id_toi, score)
                  VALUES ($1, $2, $3)
                  ON CONFLICT (id_poi, id_toi)  DO UPDATE SET score = EXCLUDED.score;`,
                  [record.id_poi, record.id_toi, record.score]
                );
              }else if (isPOIAlreadyScored.rows.length > 0 ) {
                await pool.query(
                  `UPDATE poi_toi_score SET score=$3 WHERE id_poi=$1 AND id_toi=$2`,
                  [record.id_poi, record.id_toi, record.score]
                );
              } else {
                await pool.query(
                  `INSERT INTO poi_toi_score (id_poi, id_toi, score) VALUES ($1, $2, $3)`,
                  [record.id_poi, record.id_toi, record.score]
                );
              }
              await pool.query(
                `UPDATE poi SET has_been_changed='false' WHERE id=$1`,
                [record.id_poi]
              );

            }
            if (changedTois.rows.length) {
              await pool.query(
                `UPDATE toi SET has_been_changed='false'`
              );
            }
            await normalizeAllPOITOIScores()
            if (language == "it") {
              res.json("Aggiornamento dei POI completato correttamente.");
            } else res.json("Computation completed successfully");

            await reader.close();

          } catch (err) {
            console.error('Errore durante la lettura o scaricamento del file Parquet:', err);
            res.status(500).send('Errore durante il processamento del file Parquet');
          }
        }
      });
  }
  else {
    if (language == "it") {
      res.json("Aggiornamento dei POI completato correttamente.");
    } else res.json("Computation completed successfully");
  }
});


async function normalizeAllPOITOIScores() {
  try {
    await pool.query(`
      WITH stats AS (
        SELECT 
          id_toi,
          AVG(score) AS mean_score,
          STDDEV(score) AS stddev_score
        FROM poi_toi_score
        GROUP BY id_toi
      )
      UPDATE poi_toi_score 
      SET normalized_score = (score - stats.mean_score) / NULLIF(stats.stddev_score, 0)
      FROM stats
      WHERE poi_toi_score.id_toi = stats.id_toi;
    `);
  } catch (err) {
    console.error("Error while normalizing scores:", err.message);
  }
}



async function updateNormalizedScoresForPOI(id_poi) { 
  try {
    await pool.query(`  WITH stats AS (
        SELECT 
          id_toi,
          AVG(score) AS mean_score,
          STDDEV(score) AS stddev_score
        FROM poi_toi_score
        GROUP BY id_toi
      )
      UPDATE poi_toi_score 
      SET normalized_score = (score - stats.mean_score) / NULLIF(stats.stddev_score, 0)
      FROM stats
      WHERE poi_toi_score.id_toi = stats.id_toi AND id_poi=$1;`, [id_poi]);

  } catch (err) {
    console.error("Error while normalizing scores:", err.message);
  }
}

export { router as admin };
