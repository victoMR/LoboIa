const express = require("express");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const ruta = express.Router();

ruta.get("/", (req, res) => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operation = Math.random() < 0.5 ? "+" : "-";
  const answer = operation === "+" ? num1 + num2 : num1 - num2;

  req.session.captchaQuestion = `${num1} ${operation} ${num2}`;
  req.session.captchaAnswer = answer.toString();

  res.render("home", {
    captchaQuestion: req.session.captchaQuestion,
  });
});

ruta.post("/formok", async (req, res) => {
  const formData = req.body;
  const userAnswer = req.body.captcha;
  const correctAnswer = req.session.captchaAnswer;

  if (userAnswer !== correctAnswer) {
    res.send("Respuesta incorrecta al CAPTCHA matemático");
    return;
  }

  // Elimina los campos especiales del formulario antes de enviar el correo
  const filteredFormData = Object.keys(formData)
    .filter((key) => !key.startsWith("_")) // Filtra campos que empiezan con "_"
    .reduce((obj, key) => {
      obj[key] = formData[key];
      return obj;
    }, {});

  try {
    // Configuración de nodemailer
    const transporter = nodemailer.createTransport({
      service: "Gmail", // Puedes usar otro servicio de correo
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Obtén la dirección IP del remitente
    const senderIP = req.ip;

    // Crea el contenido del correo en formato de tabla HTML
    const tableContent = Object.keys(filteredFormData)
      .map(
        (key) => `
          <tr>
              <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${key}</td>
              <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${filteredFormData[key]}</td>
          </tr>
      `
      )
      .join("");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Nuevo formulario de inscripción",
      html: `
              <div style="font-family: Arial, sans-serif;">
                  <h2 style="color: #007BFF;">Nuevo formulario de inscripción</h2>
                  <p>IP del remitente =  ${senderIP}</p>
                  <table style="border-collapse: collapse; width: 100%;">
                      <thead style="background-color: #f2f2f2;">
                          <tr>
                              <th style="padding: 12px; text-align: left; border: 1px solid #ddd; background-color: #0000FF; color : #FFFFFF">Campo</th>
                              <th style="padding: 12px; text-align: left; border: 1px solid #ddd; background-color: #0000FF; color : #FFFFFF">Valor</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${tableContent}
                      </tbody>
                  </table>
              </div>
          `,
    };

    // Envía el correo
    const info = await transporter.sendMail(mailOptions);

    console.log("Correo enviado:", info.response);
    res.redirect("register");
  } catch (error) {
    console.error("Error al enviar el formulario:", error);
    res.send("Hubo un error al enviar el formulario");
  }
});

ruta.get("/register", (req, res) => {
  res.render("register");
});

module.exports = ruta;
