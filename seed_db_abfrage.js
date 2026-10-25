/*
  Dieser Code startet einen kleinen Server auf Port 3000.
-> zeigt die Webseite aus dem Ordner "public"
-> holt alle Pokémon aus der Datenbank und schickt sie als JSON
*/

const express = require('express'); // lädt das Paket Express, mit dem man einen Webserver baut
const Database = require('better-sqlite3');// lädt das Paket für SQLite-Datenbanken
const pokedexdb = new Database('pokedex.db'); //wird nicht neu erstellt, stellt nur die verbindung her // Claude sagt // öffnet die Datenbankdatei pokedex.db (fehlt sie, wird sie leer neu angelegt)

const app = express() // erstellt den Server und speichert ihn in "app"

const path = require('path'); // Hilfswerkzeug, um Ordnerpfade richtig zu finden 
app.use(express.static(path.join(__dirname, 'public'))); // macht die Webseite im Ordner "public" im Browser abrufbar

app.get('/api/pokemon', function(request, response){ //wird ausgeführt, wenn jemand /api/pokemon aufruft
    const statement = pokedexdb.prepare('SELECT * FROM pokemon'); // bereitet die SQL-Abfrage vor: alle Einträge aus der Tabelle "pokemon"
    const allpokemons = statement.all(); // führt die Abfrage aus und speichert alle Pokémon als Liste
    response.json(allpokemons); // schickt die Liste als JSON an den Browser zurück

})

//Schnittstelle für Detailseiten
app.get('/api/pokemon/:id', (req, res) => {
    const pokemonId = req.params.id;
    const statement = pokedexdb.prepare('SELECT * FROM pokemon WHERE id = ?');
    const pokemon = statement.get(pokemonId);

    if(pokemon != null) {
        res.json(pokemon);
    }
    else {
        res.status(404).json({ error: "Pokémon nicht gefunden" });
    }
})

//Schnittstelle für Filter mit QUERY Params
app.get('/api/pokemon', (req, res) => {
    console.log("Empfangene Query-Parameter:", req.query);
    const { type, search, minHeight, maxHeight, minWeight, maxWeight } = req.query; // Alle möglichen Query-Parameter auslesen
    let query = 'SELECT DISTINCT pokemon.* FROM pokemon JOIN pokemon_types ON pokemon.id = pokemon_types.pokemon_id JOIN types ON pokemon_types.type_id = types.id WHERE 1=1'; //where 1=1, damit man später AND... einfacher hinzufügegt werden kann
    const params = [];
    //Filter nach Typ
    if(type) {
        query = query + ' AND types.name = ?';
        params.push(type); //in den leeren array hinzufügen
    }
    console.log("Generierter SQL-Befehl:", query);
    console.log("Übergebene Parameter:", params);
    //Filter nach Mindestgröße
    if(minHeight) {
        query = query + ' AND pokemon.height >= ?';
        params.push(minHeight); //in den array hinzufügen
    }

    //Filter nach Maximalgröße
    if(maxHeight) {
        query = query + ' AND pokemon.height <= ?';
        params.push(maxHeight); //in den array hinzufügen
    }

    //Filter nach Mindestgewicht
    if(minWeight) {
        query = query + ' AND pokemon.weight >= ?';
        params.push(minWeight); //in den array hinzufügen
    }

    //Filter nach Maximalgewicht
    if(maxWeight) {
        query = query + ' AND pokemon.weight <= ?';
        params.push(maxWeight); //in den array hinzufügen
    }

    const statement = pokedexdb.prepare(query);
    const results = statement.all(...params); //...params packt die Elemente des Arrays nacheinander aus und übergibt sie einzeln an die funktion


    if(results.length > 0) {
        res.json(results);
    }
    else {
        res.status(404).json({ error: "Keine Pokémon gefunden, die diesen Kriterien entsprechen" });
    }
})

app.listen(3000, () => { // starte den Server auf Port 3000 und gebe eine Meldung aus, dass er läuft
    console.log("Server läuft auf http://localhost:3000/api/pokemon");
});
