// 1. NEU: SQLite-Paket laden und Datenbank-Datei öffnen/erstellen
const Database = require('better-sqlite3');
const pokedexdb = new Database('pokedex.db');
pokedexdb.pragma('foreign_keys = ON'); //Fremdschlüssel werden schärfer kontrolliert.

// 2. NEU: Tabellen anlegen
function setupDatabase() {
    pokedexdb.exec(`
        CREATE TABLE IF NOT EXISTS pokemon (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            height INTEGER,
            weight INTEGER,
            image_url TEXT,
            hp INTEGER,
            attack INTEGER,
            defense INTEGER,
            speed INTEGER
        );

        CREATE TABLE IF NOT EXISTS types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS pokemon_types (
            pokemon_id INTEGER,
            type_id INTEGER,
            PRIMARY KEY (pokemon_id, type_id),
            FOREIGN KEY (pokemon_id) REFERENCES pokemon (id),
            FOREIGN KEY (type_id) REFERENCES types (id)
        );
    `);
    console.log("Tabellen überprüft und bereit.");
}
// Hilfsfunktion: Sucht den passenden Zahlenwert aus dem stats-Array der PokéAPI
function getStatValue(statsArray, statName) {
    const entry = statsArray.find(s => s.stat.name === statName);
    return entry ? entry.base_stat : 0;
    //ist entry da?  bei true      bei false
}

//HIER FÄNGT DAS LADEN VON DATEN VON DER API AN UND SPEICHERN IN DER DB
async function loadPokemon() {
    //Tabellen initialisieren
    setupDatabase();

    // Vorbereitete SQL-Befehle wie Funktionen speichern, um sie später auszuführen
    const insertPokemon = pokedexdb.prepare(`
        INSERT OR REPLACE INTO pokemon (id, name, height, weight, image_url, hp, attack, defense, speed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertType = pokedexdb.prepare(`
        INSERT OR IGNORE INTO types (name) VALUES (?)
    `);

    const getType = pokedexdb.prepare(`
        SELECT id FROM types WHERE name = ?
    `);

    const insertPokemonType = pokedexdb.prepare(`
        INSERT OR IGNORE INTO pokemon_types (pokemon_id, type_id) VALUES (?, ?)
    `);

    //Daten laden von der PokéAPI
    console.log("Loading Pokemon data...");
    const url = "https://pokeapi.co/api/v2/pokemon?limit=2000";
    // fetching normal pokemon info
    const output_api = await fetch(url);
    const data = await output_api.json();

    //fetching pokemon details for each pokemon and output in the terminal
    console.log("Data is here, now fetching details and saving to database...");
    for (let i of data.results) {
        const detailed_output_api = await fetch(i.url);
        const detailed_data = await detailed_output_api.json();

        // Stats aus den API-Daten auslesen
        const hp = getStatValue(detailed_data.stats, 'hp');
        const attack = getStatValue(detailed_data.stats, 'attack');
        const defense = getStatValue(detailed_data.stats, 'defense');
        const speed = getStatValue(detailed_data.stats, 'speed');
        const imageUrl = detailed_data.sprites.front_default;

        // In die Tabelle 'pokemon' einfügen und speichern
        insertPokemon.run(
            detailed_data.id,
            detailed_data.name,
            detailed_data.height,
            detailed_data.weight,
            imageUrl,
            hp,
            attack,
            defense,
            speed
        );

        // Types in der Tabelle 'types' speichern und verknüpfen
        for (let t of detailed_data.types) {
            const typeName = t.type.name;
            insertType.run(typeName);
            const savedType = getType.get(typeName);
            insertPokemonType.run(detailed_data.id, savedType.id);
        }
    }
    console.log("All data loaded and saved to the database.");
}
loadPokemon();
// in dem Terminal ausführen: node seed_api_abfrage.js