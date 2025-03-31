import express from "express";
const router = express.Router();

import { pool } from "../db.js";
import jwt from "jsonwebtoken";
router.use(express.json());

import { sendEmail, getVerifyLinkEmailMessage, getResetPasswordMessage } from './shared_function.js';


//bcrypt’s password hashing algorithm combines the password string,
//salt, and the cost to derive a 24-byte hash using base 64 encoding
import bcrypt from "bcryptjs";

import { admin } from "./admin.js";
router.use("/admin", verifyToken, verifyAdminToken, admin);

import { authTourist } from "./auth_tourist.js";
router.use("/auth-tourist", verifyToken, verifyTouristToken, authTourist);

const saltRound=10;

/**
 * @openapi
 * '/user/change-password':
 *  put:
 *     tags:
 *     - Auth user
 *     security:
 *       - BearerAuth: []
 *     summary: Used to change the password
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
 *                  currentPwd:
 *                      type: string
 *                      description: Current password
 *                      example: '#Password1'
 *                  newPwd:
 *                      type: string
 *                      description: New password
 *                      example: '#Password2'
 *     responses:
 *      200:
 *        description: Password successfully updated!
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 *      400:
 *        description: Invalid data provided, The entered current password is wrong. Returns the message 'The entered current password is wrong.'
 */
router.put("/change-password", verifyToken, async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  const user = req.user;
  const actualPwd = req.body.currentPwd;
  const newPwd = req.body.newPwd;

  pool.query(
    "SELECT password FROM userprofile WHERE id=$1",
    [user],
    async (err, result) => {
      if (await validatePassword(actualPwd, result.rows[0].password)) {
        let hashPwd;
        await bcrypt
          .hash(newPwd, saltRound)
          .then((hash) => {
            hashPwd = hash;
            pool.query(
              "UPDATE userprofile SET password=$1 WHERE id=$2",
              [hashPwd, user],
              (err) => {
                if (err) {
                  console.error(err.message);
                  res
                  .status(500)
                  .json("Internal Server Error");
                }
              }
            );
            if (language == "it") {
              res.json("Password aggiornata con successo!");
            } else res.json("Password successfully updated!");
          })
          .catch((err) => {
            console.error(err.message);
            if (language == "it") {
              res
                .status(500)
                .json("Errore durante l'aggiornamento. Riprova più tardi.");
            } else
              res
                .status(500)
                .json("Error while updating. Please try again later.");
          });
      } else {
        if (language == "it") {
          res.status(400).json("La password attuale inserita non è corretta.");
        } else res.status(400).json("The entered current password is wrong.");
      }
    }
  );
});

/**
 * @openapi
 * '/user/change-personal-info':
 *  put:
 *     tags:
 *     - Auth user
 *     security:
 *       - BearerAuth: []
 *     summary: Used to change the user's personal information
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
 *                  info:
 *                      type: object
 *                      description: Updated information
 *                      properties: 
 *                        name:
 *                          type: string
 *                          description: Updated name
 *                          example: 'Mario'
 *                        surname:
 *                          type: string
 *                          description: Updated surname
 *                          example: 'Rossi'
 *                        country:
 *                          type: string
 *                          description: Updated country
 *                          example: 'Italy'
 *                        region:
 *                          type: string
 *                          description: Updated region
 *                          example: 'Europe'
 *                        gender:
 *                          type: string
 *                          description: Updated gender
 *                          example: 'Male'
 *                        date_of_birth:
 *                          type: string
 *                          description: Updated date of birth, the format must be YYYY-MM-GG
 *                          example: '1970-09-01' 
 *     responses:
 *      200:
 *        description: User information updated successfully!
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.put("/change-personal-info", verifyToken, async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  const user = req.user;
  let info = {
    name: null,
    surname: null,
    country: null,
    region: null,
    gender: null,
    date_of_birth: null,
  };

  info = req.body.info;
  if (info.region !== null) await addRegionCountry(info.region, info.country);

  pool.query(
    "UPDATE userprofile SET name=$1, surname=$2, country=$3,  gender=$4, date_of_birth=$5 WHERE id=$6",
    [
      info.name,
      info.surname,
      info.country,
      info.gender,
      info.date_of_birth,
      user,
    ],
    (err) => {
      if (err) {
        console.error(err.message);
        res.status(500).json(err.message);
      }
      if (language == "it") {
        res.json("Informazioni utente aggiornate correttamente");
      } else res.json("User information updated successfully");
    }
  );
});

/**
 * @openapi
 * '/user/send-email-recover-password':
 *  post:
 *     tags:
 *     - No-auth
 *     summary: Used to send an email containing the password recovery token.
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
 *                      description: Email of the user to send the link to.
 *                      example: 'mario.rossi@gmail.com'
 *     responses:
 *      200:
 *        description: An email was sent to your email address. Click on the link to proceed with password recovery!
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.post("/send-email-recover-password", async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";
  const email = req.body.email;
  pool.query(
    `SELECT id, name, is_verified from userprofile WHERE email=$1`,
    [email],
    (err, result) => {
      if (err) {
        res.status(400).json(err.message);
      }
      if (result.rows.length <= 0) {
        if (language == "it") {
          res
            .status(400)
            .json(
              "L'email non esiste ancora nel sistema. Prova a registrarti!"
            );
        } else
          res
            .status(400)
            .json("The email does not yet exist in the system. Try to signup!");
      } else if (!result.rows[0].is_verified) {
        let payload = { user: result.rows[0].id };
        let token = jwt.sign(payload, process.env.SECRET_JWT); 
        sendEmail({
          from: process.env.EMAIL,
          to: email,
          subject: process.env.VerificationEmailLink_title,
          html: getVerifyLinkEmailMessage(result.rows[0].name, token, language),
        }).then((result, err) => {
          if (err || !result) {
            if (language == "it")
              res.status(400).json("Sembra esserci stato qualche problema. Prova a registrarti di nuovo!");
            else
              res.status(400).json("There must have been a problem. Try registering again!");
          }
          if (language == "it")
            res.status(400).json("Sembra che l'email inserita non sia stata verificata. \n\rProva a controllare la casella di posta!");
          else
            res.status(400).json("It appears that the email entered has not been verified. \n\rTry checking your inbox!");
        });  
      } else {
        let payload = { user: result.rows[0].id };
        let token = jwt.sign(payload, process.env.SECRET_JWT, {
          expiresIn: "3600s",
        });

        sendEmail({
          from: process.env.EMAIL,
          to: email,
          subject: process.env.ResetPasswordLink_title,
          html: getResetPasswordMessage(result.rows[0].name, token, language),
        }).then((result, err) => {
          if (err || !result) {
            if (language == "it") {
              res
                .status(400)
                .json(
                  "Sembra esserci stato qualche problema. Prova a registrarti di nuovo!"
                );
            } else
              res
                .status(400)
                .json("There must have been a problem. Try registering again!");
          }

          if (language == "it") {
            res.json(
              "È stata inviata un'email al tuo indirizzo email. Clicca sul link presente per procedere recupero della password!"
            );
          } else
            res.json(
              "An email was sent to your email address. Click on the link to proceed with password recovery!"
            );
        });
      }
    }
  );
});

/**
 * @openapi
 * '/user/recover-password':
 *  put:
 *     tags:
 *     - No-auth
 *     summary: Used for password recovery
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
 *                  token:
 *                      type: string
 *                      description: Token generated for the user to recover the password. It is obtained through send-email-recover-password
 *                  password:
 *                      type: string
 *                      description: New password
 *                      example: '#Password1'
 *     responses:
 *      200:
 *        description: Password updated correctly
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 *      400:
 *        description: The password recovery link has expired. Try again!
 */
router.put("/recover-password", async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  const password = req.body.password;
  const token = req.body.token;

  jwt.verify(token, process.env.SECRET_JWT, (err, subject) => {
    if (err) {
      if (language == "it") {
        res
          .status(400)
          .json("Il link di recupero password è scaduto. Prova di nuovo!");
      } else
        res
          .status(400)
          .json("The password recovery link has expired. Try again!");
    }

    let id = subject.user;

    bcrypt
      .hash(password, saltRound)
      .then((hash) => {
        pool.query(
          `UPDATE userprofile SET password=$1 WHERE id=$2`,
          [hash, id],
          (err) => {
            if (err) res.status(500).json(err.message);
            else {
              if (language == "it") {
                res.json("Password aggiornata correttamente!");
              } else res.json("Password updated correctly");
            }
          }
        );
      })
      .catch((err) => console.error(err.message));
  });
});


/**
 * @openapi
 * '/user/signup':
 *  post:
 *     tags:
 *     - No-auth
 *     summary: Sign up a new user
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
 *               description: Info about the user
 *               properties:
 *                  name:
 *                      type: string
 *                      example: 'Luigi'
 *                  surname:
 *                      type: string
 *                      example: 'Verdi'
 *                  email:
 *                     type: string
 *                     example: 'luigi.verdi@gmail.com'
 *                  pwd:
 *                     type: string
 *                     example: '#Password1' 
 *                  pwdConf:
 *                     type: string
 *                     description: password confirmation
 *                     example: '#Password1' 
 *                  region:
 *                     type: string
 *                     example: 'Europe' 
 *                  country:
 *                     type: string
 *                     example: 'Italy'
 *                  gender:
 *                     type: string
 *                     example: 'Male'
 *                  date_of_birth:
 *                     type: string
 *                     example: '1980-01-01' 
 *     responses:
 *      200:
 *        description: Success. After registration, an email is sent to the email address entered by the user to verify the same.
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *              example: An email was sent to your email address, please check it!
 *      500:
 *        description: Internal Server Error
 *      400:
 *        description: Invalid data provided, the email already exists in the system. Returns the message 'Email already exist! Try to log in'.
 */
router.post("/signup", async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  const user = req.body;
  user.role = "tourist";
  let pwdhash;

  bcrypt
    .hash(user.pwd, saltRound)
    .then((hash) => {
      pwdhash = hash;
    })
    .catch((err) => console.error(err.message));

  if (await addRegionCountry(user.region, user.country)) {
  
    pool.query(
      `SELECT id, email, is_verified from userprofile WHERE email=$1`,
      [user.email],
      (err, result) => {
        if (err) {
          res.status(500).json(err.message);
        }
        
        if (result.rows.length > 0) {
          if (result.rows[0].is_verified) {
            if (language == "it") {
              res
                .status(400)
                .json(
                  "L'email inserita è già presente! Prova ad effettuare il login"
                );
            } else res.status(400).json("Email already exist! Try to log in");
          } else {
            pool.query(
              `UPDATE userprofile SET name=$1, surname=$2, password=$3, date_of_birth=$4, gender=$5, role=$6, country=$7 WHERE id=$8`,
              [
                user.name,
                user.surname,
                pwdhash,
                user.date_of_birth,
                user.gender,
                user.role,
                user.country,
                result.rows[0].id,
              ],
              (err) => {
                if (err) {
                  res.status(500).json(err.message);
                }
                let payload = { user: result.rows[0].id };
                let token = jwt.sign(payload, process.env.SECRET_JWT); 
                
                sendEmail({
                  from: process.env.EMAIL,
                  to: user.email,
                  subject: process.env.VerificationEmailLink_title,
                  html: getVerifyLinkEmailMessage(user.name, token, language),
                }).then((result, err) => {
                  if (err || !result) {
                    if (language == "it")
                      res
                        .status(500)
                        .json(
                          "Sembra esserci stato qualche problema. Prova a registrarti di nuovo!"
                        );
                    else
                      res
                        .status(500)
                        .json(
                          "There must have been a problem. Try registering again!"
                        );
                  }else{
                    if (language == "it")
                      res.json(
                        "È stata inviata un'email al tuo indirizzo email, controllala!"
                      );
                    else
                      res.json(
                        "An email was sent to your email address, please check it!"
                      );
                  }
               
                });
              }
            );
          }
        } else {
          pool.query(
            `INSERT INTO userprofile (id, name, surname, email, password, date_of_birth, gender, role, is_verified, country) VALUES (nextval('userprofile_id_seq') ,$1, $2, $3, $4,$5, $6, $7, $8, $9) RETURNING id`,
            [
              user.name,
              user.surname,
              user.email,
              pwdhash,
              user.date_of_birth,
              user.gender,
              user.role,
              false,
              user.country,
            ],
            (err, result) => {
              if (err) {
                console.log(err.message);
                if (language == "it")
                  res
                    .status(500)
                    .json(
                      "Sembra esserci stato qualche problema. Prova a registrarti di nuovo!"
                    );
                else
                  res
                    .status(500)
                    .json(
                      "There must have been a problem. Try registering again!"
                    );
              }
              let payload = { user: result.rows[0].id };
              let token = jwt.sign(payload, process.env.SECRET_JWT); 
              sendEmail({
                from: process.env.EMAIL,
                to: user.email,
                subject: process.env.VerificationEmailLink_title,
                html: getVerifyLinkEmailMessage(user.name, token, language),
              }).then((result, err) => {
                if (err || !result) {
                  console.log(err)
                  if (language == "it")
                    res
                      .status(500)
                      .json(
                        "Sembra esserci stato qualche problema. Prova a registrarti di nuovo!"
                      );
                  else
                    res
                      .status(500)
                      .json(
                        "There must have been a problem. Try registering again!"
                      );
                }else{
                  if (language == "it") {
                    res.json(
                      "È stata inviata un'email al tuo indirizzo email, controllala!"
                    );
                  } else
                    res.json(
                      "An email was sent to your email address, please check it!"
                    );
                }
                
              });
            }
          );
        }
      }
    );
  }
});

/**
 * @openapi
 * '/user/verify-email/{token}':
 *  get:
 *     tags:
 *     - No-auth
 *     summary: Used to verify the email address. 
 *     parameters:
 *       - name: token
 *         in: path
 *         description: User authentication token
 *         required: true
 *         schema:
 *          type: string
 *       - in: header
 *         name: accept-language
 *         description: The user's preferred response language.
 *         schema:
 *           type: string
 *           default: 'en'
 *           enum: ['en', 'it']
 *     responses:
 *      200:
 *        description: Success.
 *        content:
 *          application/json:
 *            schema:
 *               type: string
 *               example: Successful email verification. Please login
 *      500:
 *        description: Internal Server Error
 *      400:
 *        description: Invalid token

 */
router.get("/verify-email/:token", (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  let token = req.params.token;
  jwt.verify(token, process.env.SECRET_JWT, (err, subject) => {
    if (err) {
      if (language == "it")
        res
          .status(400)
          .json("Sembra esserci stato qualche problema. Prova di nuovo!");
      else
        res
          .status(400)
          .json("There seems to have been some problem. Try again!");
    }

    let id = subject.user;
    pool.query(
      `UPDATE userprofile SET is_verified=$1 WHERE id=$2`,
      [true, id],
      (err) => {
        if (err) res.status(500).json(err.message);
        else {
          if (language == "it")
            res.json(
              "La verifica dell'email è avvenuta con successo. Effettua il login"
            );
          else res.json("Successful email verification. Please login");
        }
      }
    );
  });
});


/**
 * @openapi
 * '/user/login':
 *  post:
 *     tags:
 *     - No-auth
 *     summary: Login
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
 *                  username:
 *                      type: string
 *                      description: user email
 *                      example: 'mario.rossi@gmail.com'
 *                  pwd:
 *                      type: string
 *                      description: user password
 *                      example: '#Password1'
 *     responses:
 *      200:
 *        description: Returns the authentication token
 *        content:
 *          application/json:
 *            schema:
 *              type: string
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized, if email or password is wrong
 */
router.post("/login", async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  const cred = req.body;
  const email = cred.username,
    password = cred.pwd;

  pool.query(
    `SELECT id, role, is_verified, password, name FROM userprofile WHERE email=$1`,
    [email],
    async (err, result) => {
      if (err) {
        console.log(err.message);
        res.status(500).json(err.message);
      }
      if (result.rows.length > 0) {
        if (result.rows[0].is_verified) {
          if (await validatePassword(password, result.rows[0].password)) {
            let token = getToken(result.rows[0].id, result.rows[0].role);
            res.json(token);
          } else {
            if (language == "it")
              return res
                .status(401)
                .json("La password inserita non è corretta.");
            else return res.status(401).json("The password entered is wrong.");
          }
        } else {
          let payload = { user: result.rows[0].id };
          let token = jwt.sign(payload, process.env.SECRET_JWT); 
          sendEmail({
            from: process.env.EMAIL,
            to: email,
            subject: process.env.VerificationEmailLink_title,
            html: getVerifyLinkEmailMessage(result.rows[0].name, token, language),
          }).then((result, err) => {
            if (err || !result) {
              if (language == "it")
                res.status(500).json("Sembra esserci stato qualche problema. Prova a registrarti di nuovo!");
              else
                res.status(500).json("There must have been a problem. Try registering again!");
            }
            if (language == "it")
              res.status(401).json("Sembra che l'email inserita non sia stata verificata. \n\rProva a controllare la casella di posta!");
            else
              res.status(401).json("It appears that the email entered has not been verified. \n\rTry checking your inbox!");
          });
        }
      } else {
        if (language == "it")
          return res
            .status(401)
            .json(
              "Impossibile trovare l'email inserita. \n\nEffettua la registrazione!"
            );
        else
          return res
            .status(401)
            .json("The email entered could not be found. \n\nTry to signup!");
      }
    }
  );
});


/**
 * @openapi
 * '/user/delete-user':
 *  delete:
 *     tags:
 *     - Auth user
 *     security:
 *       - BearerAuth: []
 *     summary: Delete user account.
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
 *        description: Success.
 *        content:
 *          application/json:
 *            schema:
 *               type: string
 *               example: User account deleted
 *      500:
 *        description: Internal Server Error
 *      401:
 *        description: Unauthorized
 */
router.delete("/delete-user", verifyToken, async (req, res) => {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  const id = req.user;

  pool.query(
    `DELETE FROM userprofile WHERE id=$1`,
    [id],
    async (err, result) => {
      if (err) {
        console.log(err.message);
        res.status(500).json(err.message);
      }
      if (language == "it") return res.json("Account utente eliminato.");
      else return res.json("User account deleted");
    }
  );
});

async function addRegionCountry(region, country) {
  const countryExist = await pool.query(
    `SELECT name, region from country WHERE name=$1`,
    [country]
  );
  if (countryExist.rows.length == 0) {
    try {
      await pool.query(`INSERT INTO country(name, region) VALUES ($1, $2)`, [
        country,
        region,
      ]);
      return true;
    } catch (error) {
      console.log(error.message);
      return false;
    }
  }
  return true;
}

async function validatePassword(password, hash) {
  let resp;
  await bcrypt.compare(password, hash).then((match) => {
    resp = match;
  });
  return resp;
}

function getToken(id, role) {
  let payload = { user: id, role: role };
  return jwt.sign(payload, process.env.SECRET_JWT, { expiresIn: "7200s" });
}

function verifyToken(req, res, next) {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  if (!req.headers.authorization) {
    if (language == "it")
      return res
        .status(401)
        .json("Sembra esserci un errore, prova a effettuare il login di nuovo");
    else
      return res
        .status(401)
        .json("There seems to be an error, please try logging in again");
  }
  const token = req.headers.authorization.split(" ")[1];
  if (token === null) {
    if (language == "it")
      return res
        .status(401)
        .json("Sembra esserci un errore, prova a effettuare il login di nuovo");
    else
      return res
        .status(401)
        .json("There seems to be an error, please try logging in again");
  }

  jwt.verify(token, process.env.SECRET_JWT, (err, subject) => {
    if (err) {
      if (language == "it")
        return res
          .status(401)
          .json("Sessione scaduta! Effettua di nuovo il login");
      else
        return res
          .status(401)
          .json("Session expired! Please try logging in again");
    }
    req.user = subject.user;
    req.role = subject.role;
    return next();
  });
  return;
}

function verifyAdminToken(req, res, next) {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  if (req.role == "admin") {
    return next();
  } else {
    if (language == "it") return res.sendStatus(401).json("Accesso negato");
    else return res.sendStatus(401).json("Access denied");
  }
}

function verifyTouristToken(req, res, next) {
  const acceptedLanguages = req.headers["accept-language"];
  const language = acceptedLanguages ? acceptedLanguages.split(",")[0] : "en";

  if (req.role == "tourist") {
    return next();
  } else {
    if (language == "it") return res.sendStatus(401).json("Accesso negato");
    else return res.sendStatus(401).json("Access denied");
  }
}

export { router as user };
