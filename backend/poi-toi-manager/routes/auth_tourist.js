import express from "express";
const router = express.Router();
import { pool } from "../db.js";
router.use(express.json());

/**
 * @openapi
 * '/user/auth-tourist/get-tourist-info':
 *  get:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary: Returns info about user.
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
 *        description: Returns info about user.
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
 *                   date_of_birth:
 *                       type: string
 *                       example: ''
 *                   gender:
 *                       type: string
 *                       example: 'Male'
 *                   country:
 *                       type: string
 *                       example: 'Italy'
 *                   region:
 *                       type: string
 *                       example: 'Europe'
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.get("/get-tourist-info", async (req, res) => {
  pool.query(
    `SELECT name, surname, email, date_of_birth, gender, country FROM userprofile WHERE id=$1`,
    [req.user],
    async (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(500).json("Server Internal Error");
      }
      let user = result.rows[0];
      user.region = await getUserRegion(result.rows[0].country);
      res.json(user);
    }
  );
});

/**
 * @openapi
 * '/user/auth-tourist/save-itinerary-score':
 *  post:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary: Save the score of a new itinerary
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
 *               description: Itinerary to save
 *               properties:
 *                  id:
 *                      type: number (int)
 *                      example: null
 *                      description: id of the itinerary, null if the itinerary is not present in the database
 *                  lat_start:
 *                      type: number (float)
 *                      example: 43.11203539290401
 *                      description: latitude of the custom starting point, null if starting point is a municipality
 *                  long_start:
 *                      type: number (float)
 *                      example: 12.388962521256484
 *                      description: longitude of the custom starting point, null if starting point is a municipality
 *                  score:
 *                      type: number
 *                      example: 5
 *                      minimum: 0
 *                      maximum: 5
 *                  total_duration:
 *                      type: integer
 *                      example: 300
 *                  transport_mean:
 *                      type: string
 *                      example: 'driving-car'
 *                  steps:
 *                      type: array
 *                      description: The first and last step of each day refers to the starting point
 *                      items:
 *                         type: object
 *                         properties:
 *                            day:
 *                              type: integer
 *                              example: 0
 *                            order_step:
 *                              type: integer
 *                              example: 0
 *                              description: when order_step = 0 (or order_step = steps.length -1) it means that it is the start point
 *                            id_geo:
 *                              type: integer
 *                              example: 0
 *                              description: if id_geo = 0 it means that the starter point is a custom position, only the first and the latest step can have id_geo = 0 
 *                            t_end:
 *                              type: number
 *                              description: sum of t_end value of the previous step, travel time from the previous step, visit time of the current step.
 *                              example: 60
 *                            t_visit_min:
 *                              type: number
 *                              example: 30
 *               required:
 *                - score
 *                - total_duration
 *                - transport_mean
 *                - steps
 *     responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: integer
 *              description: itinerary id
 *              example: 1
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.post("/save-itinerary-score", async (req, res) => {
  const itinerary = req.body;
  itinerary.steps = itinerary.steps.sort((a, b) => a.order_step - b.order_step);
  const user = req.user;
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";
  let isItineraryAlreadyIn =
    itinerary.id != undefined ? (itinerary.id != null ? true : false) : false;

  if (isItineraryAlreadyIn) {
    pool.query(
      `UPDATE tour SET score=$1 WHERE id=$2`,
      [itinerary.score, itinerary.id],
      (err, result) => {
        if (err) {
          console.error(err.message);
          res.status(500).json("Server Internal Error");
        } else {
          res.json(itinerary.id);
        }
      }
    );
  } else {
    pool.query(
      `SELECT id FROM transport_mean WHERE name=$1`,
      [itinerary.transport_mean],
      async (err, result) => {
        if (err) {
          console.error(err.message);
          res.status(500).json("Server Internal Error");
        }
        if (result.rows.length == 0) {
          res.status(400).json("Invalid data provided");
        }
        else {
          let idMean = result.rows[0].id;
          let idGeoStart
          if (itinerary.steps[0].id_geo == 0) {
            try {
              idGeoStart = await pool.query(`INSERT INTO geo_point(id, latitude, longitude) VALUES (nextval('geo_point_id_seq'), $1, $2) RETURNING id`,
                [itinerary.lat_start, itinerary.long_start]
              )
              idGeoStart = idGeoStart.rows[0].id
            } catch (error) {
              console.error(error.message)
            }
          } else {
            try {
              idGeoStart = await pool.query(`SELECT id_geo FROM municipality WHERE id=$1`,
                [itinerary.steps[0].id_geo]
              )
              idGeoStart = idGeoStart.rows[0].id_geo; 
            } catch (error) {
              console.error(error.message)
            }
          }
            const groupedByDay = itinerary.steps.reduce((acc, item) => { 
              acc[item.day] = acc[item.day] || []; 
              acc[item.day].push(item);
              return acc;
            }, {});
            const groupedArray = Object.values(groupedByDay);
            for(let day=0;day<groupedArray.length;day++){
              for(let step=0;step<groupedArray[day].length;step++){
                let idGeo;              
                const item = itinerary.steps.find(item => item.day === day && item.order_step === step);
                if(step==0 || step==groupedArray[day].length-1){
                  idGeo=idGeoStart;
                }else{
                  idGeo= await pool.query(`SELECT id_geo_point FROM poi WHERE id=$1`,
                    [item.id_geo]);
                    idGeo=idGeo.rows[0].id_geo_point;
                }
                item.id_geo=idGeo;
              }
            }
          pool.query(
            `INSERT INTO tour(id, score, total_duration, id_mean, id_user) VALUES (nextval('tour_id_seq'), $1, $2, $3, $4) RETURNING id`,
            [itinerary.score, itinerary.total_duration, idMean, user],
            async (err, result) => {
              if (err) {
                console.error(err.message);
                res.status(500).json("Server Internal Error");
              } else {
                let idTour = result.rows[0].id;
                for (let i = 0; i < itinerary.steps.length; i++) {
                    try {
                      await pool.query(
                        `INSERT INTO step_of_tour(id_tour, order_step, id_geo, t_visit_min, t_end, day) VALUES ( $1, $2, $3, $4, $5, $6)`,
                        [
                          idTour,
                          itinerary.steps[i].order_step,
                          itinerary.steps[i].id_geo,
                          itinerary.steps[i].t_visit_min,
                          itinerary.steps[i].t_end,
                          itinerary.steps[i].day,
                        ]
                      );
                    } catch (err) {
                      console.error(err.message);
                      res.status(500).json("Server Internal Error");
                    }
                  }
                  if (language == "it") res.json(idTour);
                  else res.json(idTour);
                }   
            }
          );
        }
      }
    );
  }
});

/**
 * @openapi
 * '/user/auth-tourist/save-itinerary-as-favorite':
 *  post:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary: Save a new itinerary as favorite.
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
 *               description: Itinerary to save
 *               properties:
 *                  id:
 *                      type: number (int)
 *                      example: null
 *                      description: id of the itinerary, null if the itinerary is not present in the database
 *                  lat_start:
 *                      type: number (float)
 *                      example: 43.11203539290401
 *                      description: latitude of the custom starting point, null if starting point is a municipality
 *                  long_start:
 *                      type: number (float)
 *                      example: 12.388962521256484
 *                      description: longitude of the custom starting point, null if starting point is a municipality
 *                  name:
 *                      type: string
 *                      example: 'Perugia'
 *                  description:
 *                      type: string
 *                      example: 'Viaggio a Perugia'
 *                  total_duration:
 *                      type: integer
 *                      example: 300
 *                  transport_mean:
 *                      type: string
 *                      example: 'driving-car'
 *                  steps:
 *                      type: array
 *                      description: The first and the last step of each day refers to the starting point
 *                      items:
 *                         type: object
 *                         properties:
 *                            day:
 *                              type: integer
 *                              example: 0
 *                            order_step:
 *                              type: integer
 *                              example: 0
 *                              description: when order_step = 0 (or order_step = steps.length -1) it means that it is the start point
 *                            id_geo:
 *                              type: integer
 *                              example: 0
 *                              description: if id_geo = 0 it means that the starter point is a custom position, only the first and the latest step can have id_geo = 0 
 *                            t_end:
 *                              type: number
 *                              description: sum of t_end value of the previous step, travel time from the previous step, visit time of the current step.
 *                              example: 60
 *                            t_visit_min:
 *                              type: number
 *                              example: 30
 *               required:
 *                - name
 *                - description
 *                - total_duration
 *                - transport_mean
 *                - steps
 *     responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: integer
 *              description: itinerary id
 *              example: 1
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.post("/save-itinerary-as-favorite", async (req, res) => {
  const itinerary = req.body;
  itinerary.steps = itinerary.steps.sort((a, b) => a.order_step - b.order_step);
  const user = req.user;
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";
  itinerary.favorite = true;
  let isItineraryAlreadyIn =
    itinerary.id != undefined ? (itinerary.id != null ? true : false) : false;
  console.log(isItineraryAlreadyIn)
  if (isItineraryAlreadyIn) {
    pool.query(
      `UPDATE tour SET name=$1, description=$2, favorite=$3 WHERE id=$4`,
      [itinerary.name, itinerary.description, itinerary.favorite, itinerary.id],
      (err, result) => {
        if (err) {
          console.error(err.message);
          res.status(500).json("Server Internal Error");
        } else {
          res.json(itinerary.id);
        }
      }
    );
  } else {
    pool.query(`SELECT id FROM transport_mean WHERE name=$1`,
      [itinerary.transport_mean],
      async (err, result) => {
        if (err) {
          console.error(err.message);
          res.status(500).json("Server Internal Error");
        }
        if (result.rows.length == 0) {
          res.status(400).json("Invalid data provided");
        } else {
          let idMean = result.rows[0].id;
          let idGeoStart
          if (itinerary.steps[0].id_geo == 0) {
            try {
              idGeoStart = await pool.query(`INSERT INTO geo_point(id, latitude, longitude) VALUES (nextval('geo_point_id_seq'), $1, $2) RETURNING id`,
                [itinerary.lat_start, itinerary.long_start]
              )
              idGeoStart = idGeoStart.rows[0].id
              console.log(idGeoStart)
            } catch (error) {
              console.error(error.message)
            }
          }
          else {
            try {
              idGeoStart = await pool.query(`SELECT id_geo FROM municipality WHERE id=$1`,
                [itinerary.steps[0].id_geo]
              )
              idGeoStart = idGeoStart.rows[0].id_geo;
            } catch (error) {
              console.error(error.message)
            }
          }

          const groupedByDay = itinerary.steps.reduce((acc, item) => { 
            acc[item.day] = acc[item.day] || []; 
            acc[item.day].push(item);
            return acc;
          }, {});
          const groupedArray = Object.values(groupedByDay);
          for(let day=0;day<groupedArray.length;day++){
            for(let step=0;step<groupedArray[day].length;step++){
              let idGeo;              
              const item = itinerary.steps.find(item => item.day === day && item.order_step === step);
              if(step==0 || step==groupedArray[day].length-1){
                idGeo=idGeoStart;
              }else{
                idGeo= await pool.query(`SELECT id_geo_point FROM poi WHERE id=$1`,
                  [item.id_geo]);
                  idGeo=idGeo.rows[0].id_geo_point;
              }
              item.id_geo=idGeo;
            }
          }
        
          pool.query(
            `INSERT INTO tour(id, name, description, total_duration, id_mean, id_user, favorite) VALUES (nextval('tour_id_seq'), $1, $2, $3, $4, $5, $6) RETURNING id`,
            [
              itinerary.name,
              itinerary.description,
              itinerary.total_duration,
              idMean,
              user,
              itinerary.favorite
            ],
            async (err, result) => {
              if (err) {
                console.error(err.message);
                res.status(500).json("Server Internal Error");
              } else {
                let idTour = result.rows[0].id;
                for (let i = 0; i < itinerary.steps.length; i++) {
                 
                    try {
                      await pool.query(
                        `INSERT INTO step_of_tour(id_tour, order_step, id_geo, t_visit_min, t_end, day) VALUES ( $1, $2, $3, $4, $5, $6)`,
                        [
                          idTour,
                          itinerary.steps[i].order_step,
                          itinerary.steps[i].id_geo,
                          itinerary.steps[i].t_visit_min,
                          itinerary.steps[i].t_end,
                          itinerary.steps[i].day,
                        ]
                      );
                    } catch (err) {
                      console.error(err.message);
                      res.status(500).json("Server Internal Error");
                    }
                  }
                  if (language == "it") res.json(idTour);
                  else res.json(idTour);
                }
            }
          );
        }
      }
    );
  }
});

/**
 * @openapi
 * '/user/auth-tourist/remove-itinerary-from-favorites/{id}':
 *  delete:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary: Remove the itinerary from favorites.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: itinerary id
 *         required: true
 *         schema:
 *          type: integer
 *     responses:
 *      200:
 *        description: Itinerary removed from favorites.
 *        content:
 *          application/json:
 *            schema:
 *               type: integer
 *               example: 5
 *               description: id of the itinerary. If the itinerary was previously evaluated then the id remains the same, otherwise the itinerary is definitively deleted from the database so the id becomes null.
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.delete("/remove-itinerary-from-favorites/:id", async (req, res) => {
  const itineraryID = req.params.id;
  let idAfter;
  const user = req.user;
  pool.query(
    `SELECT score FROM tour WHERE id=$1 AND id_user=$2`,
    [itineraryID, user],
    async (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(500).json("Server Internal Error");
      } else {
        if (result.rows.length > 0) {
          if (result.rows[0].score == null) {
            try {
              await pool.query(`DELETE FROM tour WHERE id=$1`, [itineraryID]);
              idAfter = null;
            } catch (error) {
              console.error(error.message);
              res.status(500).json("Server Internal Error");
            }
          } else {
            try {
              await pool.query(
                `UPDATE tour SET favorite=false, name=null, description=null WHERE tour.id=$1 RETURNING id`,
                [itineraryID]
              );
              idAfter = itineraryID;
            } catch (error) {
              console.error(error.message);
              res.status(500).json("Server Internal Error");
            }
          }
          return res.json(idAfter);
        } else {
          res.status(401).json("Unauthorized");
        }

      }
    }
  );
});

/**
 * @openapi
 * '/user/auth-tourist/remove-rating-from-itinerary/{id}':
 *  delete:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary: Removes the rating from the itinerary. If the itinerary is not among the favourites, it is completely removed from the system.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: itinerary id
 *         required: true
 *         schema:
 *          type: integer
 *     responses:
 *      200:
 *        description: Rating from the itinerary removed.
 *        content:
 *          application/json:
 *            schema:
 *               type: integer
 *               example: 5
 *               description: id of the itinerary. If the itinerary was previously saved ad favorite then the id remains the same, otherwise the itinerary is definitively deleted from the database so the id becomes null.
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.delete("/remove-rating-from-itinerary/:id", async (req, res) => {
  const itineraryID = req.params.id;
  let idAfter;
  const user = req.user;
  pool.query(
    `SELECT favorite FROM tour WHERE id=$1 AND id_user=$2`,
    [itineraryID, user],
    async (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(500).json("Server Internal Error");
      } else {
        if (result.rows.length > 0) {
          if (!result.rows[0].favorite) {
            try {
              await pool.query(`DELETE FROM tour WHERE id=$1`, [itineraryID]);
              idAfter = null;
            } catch (error) {
              console.error(error.message);
              res.status(500).json("Server Internal Error");
            }
          } else {
            try {
              await pool.query(
                `UPDATE tour SET score=null WHERE tour.id=$1 RETURNING id`,
                [itineraryID]
              );
              idAfter = itineraryID;
            } catch (error) {
              console.error(error.message);
              res.status(500).json("Server Internal Error");
            }
          }
          return res.json(idAfter);
        } else {
          res.status(401).json("Unauthorized");
        }
      }
    }
  );
});

/**
 * @openapi
 * '/user/auth-tourist/update-itinerary-score':
 *  put:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary: Updates the user's score of the itinerary.
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
 *               description: Info to update the itinerary (id and new score value)
 *               properties:
 *                  id:
 *                      type: integer
 *                      description: itinerary id
 *                      example: 1
 *                  score:
 *                      type: number
 *                      example: 3
 *                      minimum: 0
 *                      maximum: 5
 *     responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *              example: "Itinerary successfully updated"
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.put("/update-itinerary-score", async (req, res) => {
  const itinerary = req.body;
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";
  const user = req.user;
  pool.query(`SELECT * from tour WHERE id=$1 AND id_user=$2`,
    [itinerary.id, user],
    (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(500).json("Server Internal Error");
      } else {
        if (result.rows.length > 0) {
          pool.query(
            `UPDATE tour SET score=$2 WHERE id=$1`,
            [itinerary.id, itinerary.score],
            (err) => {
              if (err) {
                console.error(err.message);
                res.status(500).json("Server Internal Error");
              } else {
                if (language == "it") res.json("Itinerario aggiornato correttamente");
                else res.json("Itinerary successfully updated");
              }
            }
          );
        } else {
          res.status(401).json("Unauthorized");
        }
      }
    })

});

/**
 * @openapi
 * '/user/auth-tourist/update-itinerary-info':
 *  put:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary: Updates name and description of the itinerary.
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
 *               description: Info to update the itinerary (id and updated Name and Description for the itinerary)
 *               properties:
 *                  id:
 *                      type: integer
 *                      description: itinerary id
 *                      example: 1
 *                  name:
 *                      type: string
 *                      example: "Terni"
 *                  description:
 *                      type: string
 *                      example: "Itinerario enogastronomico a Terni"   
 *     responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *              example: "Itinerary successfully updated"
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.put("/update-itinerary-info", async (req, res) => {
  const itineraryInfo = req.body;
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";
  const user = req.user;
  pool.query(`SELECT * from tour WHERE id=$1 AND id_user=$2`,
    [itineraryInfo.id, user],
    (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(500).json("Server Internal Error");
      } else {
        if (result.rows.length > 0) {
          pool.query(
            `UPDATE tour SET name=$2, description=$3, favorite=$4 WHERE id=$1`,
            [itineraryInfo.id, itineraryInfo.name, itineraryInfo.description, true],
            (err) => {
              if (err) {
                console.error(err.message);
                res.status(500).json("Server Internal Error");
              } else {
                if (language == "it") res.json("Itinerario aggiornato correttamente");
                else res.json("Itinerary successfully updated");
              }
            }
          );
        } else {
          res.status(401).json("Unauthorized");
        }
      }
    })


});

/**
 * @openapi
 * '/user/auth-tourist/get-favorite-itineraries':
 *  get:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary: Returns the user's favorite itineraries
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
 *        description: Returns the user's favorite itineraries
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
 *                    name:
 *                        type: string
 *                        example: 'Gubbio'
 *                    description:
 *                        type: string
 *                        example: 'Un giorno a Gubbio'
 *                    total_duration:
 *                        type: number
 *                        example: 90
 *                    transport_mean:
 *                        type: string
 *                        example: 'driving-car'
 *                    score:
 *                        type: number
 *                        example: 5
 *                    steps:
 *                       type: array
 *                       items:
 *                          type: object
 *                          properties:
 *                             id_geo:
 *                                 type: integer
 *                                 example: 1
 *                             day:
 *                                 type: integer
 *                                 example: 1
 *                             order_step:
 *                                 type: integer
 *                                 example: 1
 *                             t_visit_min:
 *                                 type: number
 *                                 example: 30
 *                             t_end:
 *                                 type: number
 *                                 example: 50
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.get("/get-favorite-itineraries", async (req, res) => {
  const user = req.user;
  pool.query(
    `SELECT tour.id, tour.name, description, total_duration, score, transport_mean.name as transport_mean
    FROM tour, transport_mean WHERE tour.favorite=true AND tour.id_mean=transport_mean.id AND id_user=$1 ORDER BY tour.id DESC`,
    [user],
    async (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(500).json("Server Internal Error");
      }
      let tours = result.rows;
      for (let i = 0; i < tours.length; i++) {
        tours[i].steps = await getStepOfTour(tours[i].id);
      }
      res.json(tours);
    }
  );
});

/**
 * @openapi
 * '/user/auth-tourist/get-rated-itineraries':
 *  get:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary: Returns the itineraries not saved as favorites by the user but rated.
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
 *        description: Returns the itineraries not saved as favorites by the user but rated.
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
 *                    total_duration:
 *                        type: number
 *                        example: 90
 *                    transport_mean:
 *                        type: string
 *                        example: 'driving-car'
 *                    score:
 *                        type: number
 *                        example: 5 
 *                    steps:
 *                       type: array
 *                       items:
 *                          type: object
 *                          properties:
 *                             id_geo:
 *                                 type: integer
 *                                 example: 1
 *                             day:
 *                                 type: integer
 *                                 example: 1
 *                             order_step:
 *                                 type: integer
 *                                 example: 1
 *                             t_visit_min:
 *                                 type: number
 *                                 example: 30
 *                             t_end:
 *                                 type: number
 *                                 example: 50
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.get("/get-rated-itineraries", async (req, res) => {
  const user = req.user;
  pool.query(
    `SELECT tour.id, total_duration, score, transport_mean.name as transport_mean
    FROM tour, transport_mean WHERE tour.favorite=false AND tour.id_mean=transport_mean.id AND id_user=$1 ORDER BY tour.id DESC`,
    [user],
    async (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(500).json("Server Internal Error");
      }
      let tours = result.rows;
      for (let i = 0; i < tours.length; i++) {
        tours[i].steps = await getStepOfTour(tours[i].id);
      }
      res.json(tours);
    }
  );
});

/**
 * @openapi
 * '/user/auth-tourist/get-itinerary-starter-point-info/{id_start}':
 *  get:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary: Returns info about itinerary starter point.
 *     parameters:
 *       - in: header
 *         name: accept-language
 *         description: The user's preferred response language.
 *         schema:
 *           type: string
 *           default: 'en'
 *           enum: ['en', 'it']
 *       - name: id_start
 *         in: path
 *         description: starter point id
 *         required: true
 *         schema:
 *          type: integer
 *     responses:
 *      200:
 *        description: Returns info about itinerary starter point.
 *        content:
 *          application/json:
 *            schema:
 *                type: object
 *                properties:
 *                    latitude:
 *                        type: number (float)
 *                        example: 43.11203539290401
 *                        description: latitude of the custom starting point, null if starting point is a municipality
 *                    longitude:
 *                        type: number (float)
 *                        example: 12.388962521256484
 *                        description: longitude of the custom starting point, null if starting point is a municipality 
 *                    name:
 *                        type: string
 *                        example: 'Perugia'
 *                        description: name of municipality or null if it is a custom starter point
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.get("/get-itinerary-starter-point-info/:id_start", async (req, res) => {
  const id_start = req.params.id_start;
  let name = null;
  pool.query(
    `SELECT name from municipality WHERE id_geo=$1`,
    [id_start],
    async (err, result) => {
      if (err) {
        console.error(err.message);
        res.status(500).json("Server Internal Error");
      }
      if (result.rows.length > 0) {
        name = result.rows[0].name
      }
      pool.query(`SELECT latitude, longitude from geo_point WHERE id=$1`, [id_start],
        async (err, result) => {
          if (err) {
            console.error(err.message);
            res.status(500).json("Server Internal Error");
          }
          res.json({
            name: name, latitude: result.rows[0].latitude, longitude: result.rows[0].longitude
          });
        })

    }
  );
});


/**
 * @openapi
 * '/user/auth-tourist/update-poi-score':
 *  put:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary: Updates the user's score of the POI.
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
 *               description: Info to update the POI score
 *               properties:
 *                  id:
 *                      type: integer
 *                      example: 1
 *                      description: POI id
 *                  score:
 *                      type: number
 *                      example: 3
 *                      minimum: 0
 *                      maximum: 5
 *     responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *              example: "POI score successfully updated"
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.put("/update-poi-score", async (req, res) => {
  const poi = req.body;
  const user = req.user;
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  pool.query(
    `UPDATE user_poi_feed SET score=$3 WHERE id_poi=$1 AND id_user=$2`,
    [poi.id, user, poi.score],
    (err) => {
      if (err) {
        console.error(err.message);
        res.status(500).json("Server Internal Error");
      } else {
        if (language == "it")
          res.json("Punteggio POI aggiornato correttamente");
        else res.json("POI score successfully updated");
      }
    }
  );
});


/**
 * @openapi
 * '/user/auth-tourist/save-toi-preferences':
 *  post:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary: Save/update the user preferences on different topics.
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
 *             description: array of TOIs preferences.
 *             items:
 *               type: object
 *               properties:
 *                  id_toi:
 *                      type: integer
 *                      example: 1
 *                  preference_score:
 *                      type: number
 *                      example: 5 
 *                      minimum: 0
 *                      maximum: 5
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
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *              example: "Preferences successfully saved"
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.post("/save-toi-preferences", async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  const userPreferences = req.body;

  userPreferences.forEach(async (e) => {
    let userToiScore = await pool.query(
      "SELECT score_preference FROM user_toi_preference WHERE id_toi=$1 AND id_user=$2",
      [e.id_toi, req.user]
    );
    if (e.preference_score == null) e.preference_score = 0
    if (userToiScore.rows.length > 0) {
      pool.query(
        "UPDATE user_toi_preference SET score_preference=$1 WHERE id_toi=$2 AND id_user=$3",
        [e.preference_score, e.id_toi, req.user],
        (err) => {
          if (err) {
            console.error(err.message);
            res.status(500).json("Server Internal Error");
          }
        }
      );
    } else {
      pool.query(
        "INSERT INTO user_toi_preference (id_toi, id_user, score_preference) VALUES($1, $2, $3)",
        [e.id_toi, req.user, e.preference_score],
        (err) => {
          if (err) {
            console.error(err.message);
            res.status(500).json("Server Internal Error");
          }
        }
      );
    }
  });
  if (language == "it")
    res.json("Le preferenze sono state correttamente salvate");
  else res.json("Preferences successfully saved");
});

/**
 * @openapi
 * '/user/auth-tourist/get-user-toi-preference':
 *  get:
 *     tags:
 *     - Auth tourist
 *     security:
 *       - BearerAuth: []
 *     summary:  Returns the user's preferences with respect to the different topics.
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
 *        description: Returns the list of user's preferences.
 *        content:
 *          application/json:
 *            schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                     id:
 *                         type: integer
 *                         example: 1
 *                     name:
 *                         type: string
 *                         example: 'paesaggio'
 *                     score_preference:
 *                         type: number
 *                         example: 0
 *               example:
 *                  - name: 'paesaggio'
 *                    score_preference: 0
 *                  - name: 'cultura'
 *                    score_preference: 0
 *                  - name: 'religione'
 *                    score_preference: 0
 *                  - name: 'sport'
 *                    score_preference: 0
 *                  - name: 'enogastronomia'
 *                    score_preference: 0
 *                  - name: 'manifattura'
 *                    score_preference: 0
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.get("/get-user-toi-preference", async (req, res) => {
  const user = req.user;
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";
  let queryText
  if (language === "it") {
    queryText = `SELECT id, nome as name, score_preference FROM toi, user_toi_preference WHERE toi.id=user_toi_preference.id_toi AND id_user=$1`;
  } else {
    queryText = `SELECT id, name, score_preference FROM toi, user_toi_preference WHERE toi.id=user_toi_preference.id_toi AND id_user=$1`;
  }
  pool.query(
    queryText,
    [user],
    (err, result) => {
      if (err) {
        console.error(err.message);
        res.sendStatus(500).send(err.message);
      }
      res.send(result.rows);
    }
  );
});

async function getUserRegion(country) {
  try {
    const res = await pool.query(`SELECT region FROM country WHERE name=$1`, [
      country,
    ]);
    return res.rows[0].region;
  } catch (err) {
    console.error(err.message);
  }
}

async function getUserToiPreference(userId) {
  try {
    const res = await pool.query(
      `SELECT id, name, score_preference FROM toi, user_toi_preference WHERE toi.id=user_toi_preference.id_toi AND id_user=$1`,
      [userId]
    );
    return res.rows;
  } catch (err) {
    console.error(err.message);
  }
}
async function getUserTours(userId) {
  try {
    const res = await pool.query(
      `SELECT tour.id, tour.name, description, total_duration, score, transport_mean.name FROM tour, transport_mean WHERE tour.id_mean=transport_mean.id AND id_user=$1`,
      [userId]
    );

    return res.rows;
  } catch (err) {
    console.error(err.message);
  }
}

async function getStepOfTour(idTour) {
  try {
    const res = await pool.query(
      `SELECT  poi.id as id_geo, id_geo as geo, day, order_step,t_end, t_visit_min, latitude, longitude
        FROM step_of_tour LEFT JOIN poi ON step_of_tour.id_geo=poi.id_geo_point, geo_point WHERE geo_point.id=step_of_tour.id_geo AND id_tour=$1
			ORDER BY day, order_step`,
      [idTour]
    );
    res.rows[0].id_geo=res.rows[0].geo;
    res.rows[res.rows.length-1].id_geo=res.rows[res.rows.length-1].geo;
    return res.rows;
  } catch (error) {
    console.error(error.message);
  }
}



export { router as authTourist };

