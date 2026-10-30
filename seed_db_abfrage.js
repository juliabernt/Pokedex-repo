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

//Schittstelle für Autovervollständigung bei Suche
app.get('/api/pokemon/search', (req,res) => {
    const query = req.query.q; //wenn /api/pokemon/search?q=pik, dann wird bei query pik gespeichert
    if (!query) { //wenn query leer, wird eine leere Liste geschickt
        return res.json([]);
    }
    // Sucht in der Pokémon-Tabelle nach Namen, die den Text aus query enthalten
    const statement = pokedexdb.prepare('SELECT id, name FROM pokemon WHERE name LIKE ? LIMIT 10');
    const results = statement.all(`${query}%`); //query% - suchbegriff und dann noch was, ${} um zu signalisieren, dass jetzt Variable kommt

    res.json(results);
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

//Schnittstelle für Filter und allgemeine Route mit QUERY Parameters
app.get('/api/pokemon', (req, res) => {
    //console.log("Empfangene Query-Parameter:", req.query);
    const { type, minHeight, maxHeight, minWeight, maxWeight } = req.query; // Alle möglichen Query-Parameter auslesen
    
    let query = 'SELECT DISTINCT pokemon.* FROM pokemon ';
    const params = [];

    //Filter nach Typ
    if(type) {
        query = query + ' JOIN pokemon_types ON pokemon.id = pokemon_types.pokemon_id JOIN types ON pokemon_types.type_id = types.id WHERE types.name = ?';
        params.push(type); //in den leeren array hinzufügen
    } else {
        query = query + 'WHERE 1=1';
    }

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
        const resultsWithTypes = results.map(pokemon => {
            const typestmt = pokedexdb.prepare('SELECT types.name FROM types JOIN pokemon_types ON types.id = pokemon_types.type_id WHERE pokemon_types.pokemon_id = ?');
            const typesRes = typestmt.all(pokemon.id);
            // Macht aus [{name: 'grass'}, {name: 'poison'}] ein einfaches Array: ['grass', 'poison']
            pokemon.types = typesRes.map(t => t.name);
            return pokemon;
        })
        res.json(resultsWithTypes);
    }
    else {
        res.status(404).json({ error: "Keine Pokémon gefunden, die diesen Kriterien entsprechen" });
    }
})



app.listen(3000, () => { // starte den Server auf Port 3000 und gebe eine Meldung aus, dass er läuft
    console.log("Server läuft auf http://localhost:3000/api/pokemon");
});
