console.log('Si está jalandooo');

const http = require('node:http')

const server = http.createServer((req, res) => {
console.log('solicitud recivida')
res.end('Hellouuu, si da')
})

server.listen(7020, () => {
console.log('Servidor escuchando el puerto 7020') 
})

// Funciona el Node.js completamente, sin Express

