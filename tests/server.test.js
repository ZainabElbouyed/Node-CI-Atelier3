const request = require('supertest');
const app = require('../server');

describe('Tests de l’application Node.js', function () {

    it('GET / doit retourner un message', async function () {
        const res = await request(app).get('/');
        if (res.statusCode !== 200) throw new Error();
    });

    it('GET /hello doit retourner un message', async function () {
        const res = await request(app).get('/hello');
        if (res.statusCode !== 200) throw new Error();
    });

    it('GET /health doit retourner status OK', async function () {
        const res = await request(app).get('/health');
        if (res.body.status !== 'OK') throw new Error();
    });

});