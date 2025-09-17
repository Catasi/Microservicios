// console.log('Si está jalandooo');

// const http = require('node:http')

// const server = http.createServer((req, res) => {
// console.log('solicitud recivida')
// res.end('Hellouuu, si da')
// })

// server.listen(7020, () => {
// console.log('Servidor escuchando el puerto 7020') 
// })


import express from 'express';

const app = express();
const apiAlumnos = "http://localhost:4003/api/alumnos";
const apiProfesores = "http://localhost:4002/api/profesores";
const apiRH = "http://localhost:3002/api/professors";  // si es esta?
const apiSE = "http://localhost:3001/api/SE";

app.get('/', (req, res) => {
    res.send('Hellouuu, si da con Express');
});

//Inicialización del servidor
app.listen(7020, () => {
    console.log('Servidor escuchando el puerto 7020');
});
