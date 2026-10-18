const express = require('express')
const Database = require('better-sqlite3');
const pokedexdb = new Database('pokedex.db'); //wird nicht neu erstellt, stellt nur die verbindung her

const app = express()

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/pokemon', function(request, response){
    const statement = pokedexdb.prepare('SELECT * FROM pokemon');
    const allpokemons = statement.all();
    response.json(allpokemons);
})

app.listen(3000, () => {
    console.log("Server läuft auf http://localhost:3000/api/pokemon");
});