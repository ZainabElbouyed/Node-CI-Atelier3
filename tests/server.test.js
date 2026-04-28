const assert = require('assert');
const http = require('http');

describe('Tests de l\'application Node.js', function() {
    
    it('GET / doit retourner un message', function(done) {
        http.get('http://localhost:5000/', (res) => {
            assert.strictEqual(res.statusCode, 200);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                assert.ok(json.message);
                console.log('✅ GET / - OK');
                done();
            });
        }).on('error', done);
    });
    
    it('GET /hello doit retourner un message', function(done) {
        http.get('http://localhost:5000/hello', (res) => {
            assert.strictEqual(res.statusCode, 200);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                assert.ok(json.message);
                console.log('✅ GET /hello - OK');
                done();
            });
        }).on('error', done);
    });
    
    it('GET /health doit retourner status OK', function(done) {
        http.get('http://localhost:5000/health', (res) => {
            assert.strictEqual(res.statusCode, 200);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                assert.strictEqual(json.status, 'OK');
                console.log('✅ GET /health - OK');
                done();
            });
        }).on('error', done);
    });
});