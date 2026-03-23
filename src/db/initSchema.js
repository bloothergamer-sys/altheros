const db = require("./connection");

function initSchema() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS jugadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        nombre_personaje TEXT,
        clase TEXT,
        region_origen TEXT,
        oro INTEGER DEFAULT 100,
        experiencia INTEGER DEFAULT 0,
        nivel INTEGER DEFAULT 1,
        salud INTEGER DEFAULT 100,
        energia INTEGER DEFAULT 100,
        prestigio INTEGER DEFAULT 0,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS jugador_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jugador_id INTEGER NOT NULL UNIQUE,
        marcial INTEGER DEFAULT 0,
        diplomacia INTEGER DEFAULT 0,
        conocimiento INTEGER DEFAULT 0,
        intriga INTEGER DEFAULT 0,
        destreza INTEGER DEFAULT 0,
        administracion INTEGER DEFAULT 0,
        FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS jugador_perfil (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jugador_id INTEGER NOT NULL UNIQUE,
        edad INTEGER DEFAULT 18,
        genero TEXT DEFAULT 'Indefinido',
        fertilidad INTEGER DEFAULT 100,
        salud_base INTEGER DEFAULT 100,
        casa_nombre TEXT DEFAULT 'Casa sin nombre',
        cultura TEXT DEFAULT 'Altheros',
        religion TEXT DEFAULT 'Fe del Reino',
        biografia TEXT DEFAULT '',
        FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS trait_catalogo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trait_key TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL,
        descripcion TEXT,
        icono TEXT DEFAULT '◈',
        bonus_marcial INTEGER DEFAULT 0,
        bonus_diplomacia INTEGER DEFAULT 0,
        bonus_conocimiento INTEGER DEFAULT 0,
        bonus_intriga INTEGER DEFAULT 0,
        bonus_destreza INTEGER DEFAULT 0,
        bonus_administracion INTEGER DEFAULT 0,
        bonus_salud INTEGER DEFAULT 0,
        bonus_fertilidad INTEGER DEFAULT 0
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS jugador_traits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jugador_id INTEGER NOT NULL,
        trait_id INTEGER NOT NULL,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE,
        FOREIGN KEY (trait_id) REFERENCES trait_catalogo(id) ON DELETE CASCADE,
        UNIQUE(jugador_id, trait_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS personajes_familia (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jugador_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        parentesco TEXT NOT NULL,
        edad INTEGER DEFAULT 18,
        estado TEXT DEFAULT 'Vivo',
        descripcion TEXT DEFAULT '',
        FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        tipo TEXT NOT NULL,
        slot TEXT NOT NULL,
        material TEXT DEFAULT 'hierro',
        rareza TEXT DEFAULT 'comun',
        valor_base INTEGER DEFAULT 0,
        bonus_marcial INTEGER DEFAULT 0,
        bonus_diplomacia INTEGER DEFAULT 0,
        bonus_conocimiento INTEGER DEFAULT 0,
        bonus_intriga INTEGER DEFAULT 0,
        bonus_destreza INTEGER DEFAULT 0,
        bonus_administracion INTEGER DEFAULT 0,
        descripcion TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS inventario_jugador (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jugador_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        cantidad INTEGER DEFAULT 1,
        equipado INTEGER DEFAULT 0,
        FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        UNIQUE(jugador_id, item_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS mercado_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL UNIQUE,
        stock INTEGER DEFAULT 0,
        precio_compra INTEGER NOT NULL,
        precio_venta INTEGER NOT NULL,
        activo INTEGER DEFAULT 1,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS mercado_publicaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendedor_jugador_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL DEFAULT 1,
        precio_unitario INTEGER NOT NULL,
        activa INTEGER DEFAULT 1,
        creada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendedor_jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      )
    `);

   db.run(`
  CREATE TABLE IF NOT EXISTS territorios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jugador_id INTEGER NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    tipo_territorio TEXT NOT NULL,
    region TEXT NOT NULL,
    casa_gobernante TEXT NOT NULL,
    historia_casa TEXT DEFAULT '',
    historia_territorio TEXT DEFAULT '',
    slots_construccion INTEGER DEFAULT 4,
    ultimo_tick_produccion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_tick_revuelta DATETIME DEFAULT CURRENT_TIMESTAMP,
    riesgo_revuelta INTEGER DEFAULT 0,
    estado_revuelta TEXT DEFAULT 'bajo',
    creada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE
  )
`);

    db.run(`
      CREATE TABLE IF NOT EXISTS territorio_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        territorio_id INTEGER NOT NULL UNIQUE,
        bienestar INTEGER DEFAULT 50,
        salud INTEGER DEFAULT 50,
        educacion INTEGER DEFAULT 50,
        ocio INTEGER DEFAULT 50,
        economia INTEGER DEFAULT 50,
        seguridad INTEGER DEFAULT 50,
        desarrollo INTEGER DEFAULT 50,
        religion INTEGER DEFAULT 50,
        control INTEGER DEFAULT 50,
        produccion INTEGER DEFAULT 50,
        FOREIGN KEY (territorio_id) REFERENCES territorios(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS territorio_recursos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        territorio_id INTEGER NOT NULL UNIQUE,
        madera INTEGER DEFAULT 0,
        piedra INTEGER DEFAULT 0,
        hierro INTEGER DEFAULT 0,
        marmol INTEGER DEFAULT 0,
        FOREIGN KEY (territorio_id) REFERENCES territorios(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS territorio_edificios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        territorio_id INTEGER NOT NULL,
        edificio_key TEXT NOT NULL,
        nivel INTEGER DEFAULT 1,
        FOREIGN KEY (territorio_id) REFERENCES territorios(id) ON DELETE CASCADE,
        UNIQUE(territorio_id, edificio_key)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS catalogo_edificios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        edificio_key TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        descripcion TEXT DEFAULT '',
        costo_oro_base INTEGER DEFAULT 0,
        costo_madera_base INTEGER DEFAULT 0,
        costo_piedra_base INTEGER DEFAULT 0,
        costo_hierro_base INTEGER DEFAULT 0,
        costo_marmol_base INTEGER DEFAULT 0,
        max_nivel INTEGER DEFAULT 3,
        region_requerida TEXT,
        bonus_bienestar INTEGER DEFAULT 0,
        bonus_salud INTEGER DEFAULT 0,
        bonus_educacion INTEGER DEFAULT 0,
        bonus_ocio INTEGER DEFAULT 0,
        bonus_economia INTEGER DEFAULT 0,
        bonus_seguridad INTEGER DEFAULT 0,
        bonus_desarrollo INTEGER DEFAULT 0,
        bonus_religion INTEGER DEFAULT 0,
        bonus_control INTEGER DEFAULT 0,
        bonus_produccion INTEGER DEFAULT 0,
        prod_madera INTEGER DEFAULT 0,
        prod_piedra INTEGER DEFAULT 0,
        prod_hierro INTEGER DEFAULT 0,
        prod_marmol INTEGER DEFAULT 0,
        prod_infanteria INTEGER DEFAULT 0,
        prod_arqueros INTEGER DEFAULT 0,
        prod_caballeria INTEGER DEFAULT 0,
        prod_asedio INTEGER DEFAULT 0
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS territorio_milicia (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        territorio_id INTEGER NOT NULL UNIQUE,
        infanteria INTEGER DEFAULT 0,
        arqueros INTEGER DEFAULT 0,
        caballeria INTEGER DEFAULT 0,
        asedio INTEGER DEFAULT 0,
        FOREIGN KEY (territorio_id) REFERENCES territorios(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS catalogo_region_bonuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region TEXT NOT NULL UNIQUE,
        edificio_unico_key TEXT,
        edificio_unico_nombre TEXT,
        unidad_unica TEXT,
        bonus_texto TEXT
      )
    `);

    db.run(`
  CREATE TABLE IF NOT EXISTS lore_altheros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    orden_visual INTEGER DEFAULT 0
  )
`);

    db.run(`
      CREATE TABLE IF NOT EXISTS misiones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        region TEXT,
        tipo TEXT DEFAULT 'aventura',
        dificultad INTEGER DEFAULT 10,
        recompensa_oro INTEGER DEFAULT 0,
        recompensa_xp INTEGER DEFAULT 0,
        activa INTEGER DEFAULT 1,
        creada_en DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS jugador_misiones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jugador_id INTEGER NOT NULL,
        mision_id INTEGER NOT NULL,
        estado TEXT DEFAULT 'en_curso',
        etapa_actual INTEGER DEFAULT 1,
        resultado_final TEXT,
        iniciada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        completada_en DATETIME,
        FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE,
        FOREIGN KEY (mision_id) REFERENCES misiones(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS heraldo_eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        region TEXT,
        anio_juego INTEGER DEFAULT 1000,
        tipo TEXT DEFAULT 'rumor',
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS mundo (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        anio_actual INTEGER DEFAULT 1000,
        estacion TEXT DEFAULT 'Primavera',
        actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS misiones_generadas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jugador_id INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        region TEXT,
        tipo TEXT DEFAULT 'aventura',
        dificultad INTEGER DEFAULT 10,
        recompensa_oro INTEGER DEFAULT 0,
        recompensa_xp INTEGER DEFAULT 0,
        recompensa_prestigio INTEGER DEFAULT 0,
        estado TEXT DEFAULT 'disponible',
        origen_template TEXT,
        creada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS misiones_generadas_etapas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mision_generada_id INTEGER NOT NULL,
        numero_etapa INTEGER NOT NULL,
        texto TEXT NOT NULL,
        opciones_json TEXT NOT NULL,
        creada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mision_generada_id) REFERENCES misiones_generadas(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS jugador_misiones_generadas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jugador_id INTEGER NOT NULL,
        mision_generada_id INTEGER NOT NULL,
        estado TEXT DEFAULT 'en_curso',
        etapa_actual INTEGER DEFAULT 1,
        resultado_final TEXT,
        iniciada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        completada_en DATETIME,
        FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE,
        FOREIGN KEY (mision_generada_id) REFERENCES misiones_generadas(id) ON DELETE CASCADE,
        UNIQUE(jugador_id, mision_generada_id)
      )
    `);

    db.run(`
      INSERT OR IGNORE INTO mundo (id, anio_actual, estacion)
      VALUES (1, 1000, 'Primavera')
    `);
  });
}

module.exports = initSchema;