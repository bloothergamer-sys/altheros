const db = require("./connection");

function seedData() {
  db.serialize(() => {
    const items = [
      {
        nombre: "Espada de Hierro",
        tipo: "arma",
        slot: "arma",
        material: "hierro",
        rareza: "comun",
        valor_base: 30,
        bonus_marcial: 2,
        bonus_destreza: 1,
        descripcion: "Acero honesto. No brillante, pero convence."
      },
      {
        nombre: "Daga Curva",
        tipo: "arma",
        slot: "arma",
        material: "acero oscuro",
        rareza: "raro",
        valor_base: 55,
        bonus_intriga: 2,
        bonus_destreza: 2,
        descripcion: "Pequeña, rápida y llena de malas intenciones."
      },
      {
        nombre: "Espadón de Acero Real",
        tipo: "arma",
        slot: "arma",
        material: "acero real",
        rareza: "epico",
        valor_base: 120,
        bonus_marcial: 4,
        bonus_destreza: 1,
        descripcion: "Una hoja hecha para recordar quién manda."
      },
      {
        nombre: "Cota de Malla",
        tipo: "armadura",
        slot: "armadura",
        material: "hierro",
        rareza: "comun",
        valor_base: 40,
        bonus_marcial: 1,
        descripcion: "Pesa bastante, pero ayuda a seguir respirando."
      },
      {
        nombre: "Armadura de Placas Nobles",
        tipo: "armadura",
        slot: "armadura",
        material: "acero templado",
        rareza: "epico",
        valor_base: 130,
        bonus_marcial: 2,
        bonus_administracion: 1,
        descripcion: "Cuesta moverse. También cuesta ignorarte."
      },
      {
        nombre: "Anillo de la Corte",
        tipo: "accesorio",
        slot: "accesorio",
        material: "oro",
        rareza: "raro",
        valor_base: 60,
        bonus_diplomacia: 2,
        descripcion: "Una joya útil para sonreír mientras conspirás."
      },
      {
        nombre: "Broche de Linaje",
        tipo: "accesorio",
        slot: "accesorio",
        material: "plata",
        rareza: "epico",
        valor_base: 110,
        bonus_diplomacia: 2,
        bonus_administracion: 2,
        descripcion: "Un símbolo familiar que abre puertas y resentimientos."
      },
      {
        nombre: "Manual de Estrategia",
        tipo: "accesorio",
        slot: "objeto_especial",
        material: "pergamino",
        rareza: "raro",
        valor_base: 55,
        bonus_conocimiento: 2,
        bonus_marcial: 1,
        descripcion: "Más útil que varios nobles juntos."
      },
      {
        nombre: "Talismán de Bronce",
        tipo: "accesorio",
        slot: "objeto_especial",
        material: "bronce",
        rareza: "comun",
        valor_base: 35,
        bonus_intriga: 1,
        bonus_administracion: 1,
        descripcion: "No hace milagros, pero ayuda a aparentar control."
      },
      {
        nombre: "Reliquia del Cuervo",
        tipo: "accesorio",
        slot: "objeto_especial",
        material: "obsidiana",
        rareza: "epico",
        valor_base: 140,
        bonus_intriga: 3,
        bonus_conocimiento: 1,
        descripcion: "Un objeto hermoso y un poco demasiado silencioso."
      },
      {
        nombre: "Madera Tratada",
        tipo: "recurso",
        slot: "recurso",
        material: "roble",
        rareza: "comun",
        valor_base: 18,
        descripcion: "Material básico para futuras construcciones."
      },
      {
        nombre: "Piedra Labrada",
        tipo: "recurso",
        slot: "recurso",
        material: "granito",
        rareza: "comun",
        valor_base: 22,
        descripcion: "Bloques resistentes, útiles para levantar algo serio."
      },
      {
        nombre: "Hierro Refinado",
        tipo: "recurso",
        slot: "recurso",
        material: "hierro",
        rareza: "raro",
        valor_base: 34,
        descripcion: "Materia prima valiosa para armas, defensas y mejora estructural."
      },
      {
        nombre: "Mármol Imperial",
        tipo: "recurso",
        slot: "recurso",
        material: "mármol",
        rareza: "epico",
        valor_base: 80,
        descripcion: "Material caro y ostentoso. Perfecto para dejar claro que te sobra todo."
      }
    ];

    const insertItem = db.prepare(`
      INSERT OR IGNORE INTO items (
        nombre, tipo, slot, material, rareza, valor_base,
        bonus_marcial, bonus_diplomacia, bonus_conocimiento,
        bonus_intriga, bonus_destreza, bonus_administracion,
        descripcion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(
        item.nombre,
        item.tipo,
        item.slot,
        item.material,
        item.rareza,
        item.valor_base,
        item.bonus_marcial || 0,
        item.bonus_diplomacia || 0,
        item.bonus_conocimiento || 0,
        item.bonus_intriga || 0,
        item.bonus_destreza || 0,
        item.bonus_administracion || 0,
        item.descripcion
      );
    }

    insertItem.finalize();

    const marketCatalog = [
      { nombre: "Espada de Hierro", stock: 8, precio_compra: 45, precio_venta: 24 },
      { nombre: "Daga Curva", stock: 5, precio_compra: 78, precio_venta: 38 },
      { nombre: "Espadón de Acero Real", stock: 2, precio_compra: 180, precio_venta: 90 },
      { nombre: "Cota de Malla", stock: 6, precio_compra: 60, precio_venta: 30 },
      { nombre: "Armadura de Placas Nobles", stock: 2, precio_compra: 190, precio_venta: 95 },
      { nombre: "Anillo de la Corte", stock: 4, precio_compra: 85, precio_venta: 42 },
      { nombre: "Broche de Linaje", stock: 2, precio_compra: 165, precio_venta: 82 },
      { nombre: "Manual de Estrategia", stock: 3, precio_compra: 82, precio_venta: 40 },
      { nombre: "Talismán de Bronce", stock: 6, precio_compra: 48, precio_venta: 24 },
      { nombre: "Reliquia del Cuervo", stock: 1, precio_compra: 210, precio_venta: 105 },
      { nombre: "Madera Tratada", stock: 25, precio_compra: 24, precio_venta: 12 },
      { nombre: "Piedra Labrada", stock: 20, precio_compra: 28, precio_venta: 14 },
      { nombre: "Hierro Refinado", stock: 12, precio_compra: 44, precio_venta: 22 },
      { nombre: "Mármol Imperial", stock: 5, precio_compra: 105, precio_venta: 52 }
    ];

    const insertMarket = db.prepare(`
      INSERT OR IGNORE INTO mercado_items (
        item_id, stock, precio_compra, precio_venta, activo
      )
      SELECT id, ?, ?, ?, 1
      FROM items
      WHERE nombre = ?
    `);

    for (const entry of marketCatalog) {
      insertMarket.run(
        entry.stock,
        entry.precio_compra,
        entry.precio_venta,
        entry.nombre
      );
    }

    insertMarket.finalize();

    const buildingCatalog = [
      ["aserradero", "Aserradero", "produccion", "Convierte la madera en el primer idioma de la prosperidad.", 70, 20, 10, 0, 0, 4, null, 0, 0, 0, 0, 2, 0, 1, 0, 0, 2, 8, 0, 0, 0, 0, 0, 0],
      ["cantera", "Cantera", "produccion", "Extrae piedra y fortalece el crecimiento estructural.", 85, 15, 20, 0, 0, 4, null, 0, 0, 0, 0, 1, 1, 2, 0, 0, 2, 0, 9, 0, 0, 0, 0, 0, 0],
      ["herreria", "Herrería", "produccion", "Refina hierro y mejora la base militar del territorio.", 95, 10, 12, 12, 0, 4, null, 0, 0, 0, 0, 1, 2, 1, 0, 1, 2, 0, 0, 7, 0, 1, 0, 0, 0],
      ["mercado_local", "Mercado Local", "civil", "Impulsa economía, bienestar y circulación de riqueza.", 100, 20, 12, 0, 0, 4, null, 2, 0, 0, 2, 5, 0, 2, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0],
      ["hospital", "Hospital", "civil", "Reduce el deterioro social y mejora la salud general.", 90, 18, 16, 0, 0, 3, null, 1, 5, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["academia", "Academia", "civil", "Forma escribas, administradores y mentes peligrosamente útiles.", 110, 14, 16, 4, 0, 3, null, 0, 0, 5, 0, 1, 0, 2, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      ["plaza_festiva", "Plaza Festiva", "civil", "El ocio bien gestionado evita problemas bastante caros.", 75, 12, 10, 0, 0, 3, null, 3, 0, 0, 5, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      ["templo", "Templo", "religioso", "Aumenta cohesión espiritual y legitimidad del poder.", 88, 8, 14, 0, 2, 3, null, 0, 1, 0, 0, 0, 1, 0, 5, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["barracones", "Barracones", "militar", "Entrena infantería y endurece la disciplina del territorio.", 105, 12, 18, 10, 0, 4, null, 0, 0, 0, 0, 0, 3, 1, 0, 2, 1, 0, 0, 0, 0, 4, 0, 0, 0],
      ["campo_tiro", "Campo de Tiro", "militar", "Forma arqueros y mejora la respuesta defensiva.", 95, 16, 12, 6, 0, 4, null, 0, 0, 0, 0, 0, 2, 1, 0, 1, 1, 0, 0, 0, 0, 0, 3, 0, 0],
      ["establos", "Establos", "militar", "Permite entrenar caballería y consolidar reacción rápida.", 120, 20, 12, 10, 0, 3, null, 0, 0, 0, 1, 0, 2, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 2, 0],
      ["taller_asedio", "Taller de Asedio", "militar", "Construye máquinas y personal para campañas largas.", 145, 12, 24, 18, 4, 3, null, 0, 0, 0, 0, 0, 2, 2, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1],
      ["murallas", "Murallas", "militar", "No hace feliz a nadie, pero convence bastante.", 130, 10, 28, 10, 0, 4, null, 0, 0, 0, 0, 0, 6, 1, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["foro_central", "Foro Central", "especial", "Centro administrativo que impulsa control y desarrollo del corazón del reino.", 180, 24, 26, 10, 6, 3, "Tierras del Centro", 2, 0, 2, 1, 4, 2, 4, 0, 4, 3, 0, 0, 2, 0, 0, 0, 0, 0],
      ["bastion_sur", "Bastión del Sur", "especial", "Fortificación única pensada para una frontera que no perdona errores.", 190, 12, 34, 14, 0, 3, "Marca del Sur", 0, 0, 0, 0, 0, 8, 2, 0, 6, 2, 0, 0, 2, 0, 3, 0, 0, 0],
      ["puerto_mayor", "Puerto Mayor", "especial", "Centro comercial marítimo que acelera economía y producción portuaria.", 185, 26, 18, 8, 0, 3, "Salmuera", 1, 0, 0, 2, 6, 1, 3, 0, 2, 4, 6, 0, 0, 0, 1, 0, 0, 0],
      ["archivo_arenas", "Archivo de Arenas", "especial", "Concentra saber, memoria y administración del desierto.", 175, 10, 18, 6, 8, 3, "Zahramar", 0, 0, 5, 0, 2, 0, 3, 3, 1, 2, 0, 0, 0, 1, 0, 0, 0, 0],
      ["torre_velmora", "Torre de Vigilancia Oriental", "especial", "Observa rutas, tensiones y peligros antes que el resto.", 170, 12, 20, 12, 0, 3, "Velmora", 0, 0, 0, 0, 1, 5, 2, 0, 5, 2, 0, 0, 3, 0, 0, 2, 1, 0],
      ["puerto_corsario", "Puerto Corsario", "especial", "Riqueza rápida, ocio peligroso y marinos muy discutibles.", 180, 24, 12, 10, 0, 3, "Isla del Gato", 2, 0, 0, 4, 5, 1, 2, 0, 1, 3, 4, 0, 0, 0, 2, 1, 0, 0]
    ];

    const insertBuilding = db.prepare(`
      INSERT OR IGNORE INTO catalogo_edificios (
        edificio_key, nombre, categoria, descripcion,
        costo_oro_base, costo_madera_base, costo_piedra_base, costo_hierro_base, costo_marmol_base,
        max_nivel, region_requerida,
        bonus_bienestar, bonus_salud, bonus_educacion, bonus_ocio, bonus_economia,
        bonus_seguridad, bonus_desarrollo, bonus_religion, bonus_control, bonus_produccion,
        prod_madera, prod_piedra, prod_hierro, prod_marmol,
        prod_infanteria, prod_arqueros, prod_caballeria, prod_asedio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const building of buildingCatalog) {
      insertBuilding.run(...building);
    }

    insertBuilding.finalize();

    const regionBonuses = [
      ["Marca del Sur", "bastion_sur", "Bastión del Sur", "Guardia de Frontera", "+Seguridad, +control y una presencia militar más sólida."],
      ["Salmuera", "puerto_mayor", "Puerto Mayor", "Marinos Armados", "+Economía, +producción y mejor proyección comercial."],
      ["Tierras del Centro", "foro_central", "Foro Central", "Guardia de la Llave", "+Desarrollo y +control administrativo del dominio."],
      ["Zahramar", "archivo_arenas", "Archivo de Arenas", "Hostigadores del Desierto", "+Educación, +religión y mejor gestión del conocimiento."],
      ["Velmora", "torre_velmora", "Torre de Vigilancia Oriental", "Jinetes de Velmora", "+Control, +seguridad y mejor respuesta táctica."],
      ["Isla del Gato", "puerto_corsario", "Puerto Corsario", "Corsarios del Gato", "+Ocio, +economía y movilidad naval ligera."]
    ];

    const insertRegionBonus = db.prepare(`
      INSERT OR IGNORE INTO catalogo_region_bonuses (
        region, edificio_unico_key, edificio_unico_nombre, unidad_unica, bonus_texto
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const loreEntries = [
  [
    "Los Orígenes de Altheros",
    "Altheros nació de pactos rotos, conquistas parciales y casas que entendieron demasiado tarde que el poder no se hereda: se sostiene.",
    1
  ],
  [
    "La Edad de las Casas",
    "Antes de que el reino encontrara una forma estable, las casas nobles gobernaban fragmentos de territorio bajo alianzas temporales, juramentos débiles y guerras muy personales.",
    2
  ],
  [
    "La Corona y el Hierro",
    "La unificación no llegó por consenso sino por desgaste. La corona de Altheros se impuso cuando algunas casas comprendieron que perder todo era peor que obedecer a alguien.",
    3
  ],
  [
    "Un Reino Vivo y Frágil",
    "Hoy Altheros aparenta orden, pero cada territorio bien gestionado lo sostiene y cada territorio mal llevado lo pone en riesgo.",
    4
  ]
];

const insertLore = db.prepare(`
  INSERT OR IGNORE INTO lore_altheros (
    titulo, descripcion, orden_visual
  ) VALUES (?, ?, ?)
`);

for (const lore of loreEntries) {
  insertLore.run(...lore);
}

insertLore.finalize();

    for (const bonus of regionBonuses) {
      insertRegionBonus.run(...bonus);
    }

    insertRegionBonus.finalize();

    const traits = [
      ["justo", "Justo", "personalidad", "Busca equilibrio y detesta abusos.", "⚖️", 0, 1, 0, 0, 0, 1, 0, 0],
      ["cinico", "Cínico", "personalidad", "No cree en ideales; prioriza resultados.", "🦂", 0, 0, 0, 1, 0, 0, 0, 0],
      ["compasivo", "Compasivo", "personalidad", "Protege a los débiles y evita daño innecesario.", "🤍", 0, 2, 0, -1, 0, 0, 0, 0],
      ["cruel", "Cruel", "personalidad", "Disfruta imponer poder y castigo.", "🩸", 1, -2, 0, 1, 0, 0, 0, 0],
      ["calculador", "Calculador", "personalidad", "Piensa antes de actuar.", "♟️", 0, 0, 1, 2, 0, 1, 0, 0],
      ["impulsivo", "Impulsivo", "personalidad", "Actúa rápido y se equivoca rápido también.", "🔥", 1, 0, -1, -1, 1, 0, 0, 0],
      ["paranoico", "Paranoico", "personalidad", "Sospecha de todos.", "👁️", 0, -1, 1, 2, 0, 0, 0, -10],
      ["confiado", "Confiado", "personalidad", "Tiende a creer en otros.", "🤝", 0, 2, 0, -2, 0, 0, 0, 0],
      ["ambicioso", "Ambicioso", "personalidad", "Siempre quiere más.", "👑", 1, 0, 0, 1, 0, 2, 0, 0],
      ["conforme", "Conforme", "personalidad", "Evita riesgos y tensiones innecesarias.", "🌿", 0, 1, 0, 0, 0, 0, 0, 0],
      ["orgulloso", "Orgulloso", "personalidad", "No se somete con facilidad.", "🦚", 1, -1, 0, 1, 0, 0, 0, 0],
      ["humilde", "Humilde", "personalidad", "No busca protagonismo.", "🕊️", 0, 1, 0, 0, 0, 0, 0, 0],

      ["fuerte", "Fuerte", "fisico", "Cuerpo entrenado para el conflicto.", "💪", 3, 0, 0, 0, 0, 0, 5, 0],
      ["agil", "Ágil", "fisico", "Rápido, preciso y escurridizo.", "🏹", 0, 0, 0, 0, 3, 0, 0, 0],
      ["robusto", "Robusto", "fisico", "Resiste más que la media.", "🛡️", 0, 0, 0, 0, 0, 0, 10, 0],
      ["atractivo", "Atractivo", "fisico", "Presencia magnética.", "✨", 0, 3, 0, 0, 0, 0, 0, 10],
      ["fragil", "Frágil", "fisico", "El cuerpo falla antes.", "🫥", 0, 0, 0, 0, 0, 0, -10, 0],
      ["deforme", "Deforme", "fisico", "Genera rechazo y miedo; útil para jugar sucio.", "🕸️", 0, -3, 0, 2, 0, 0, 0, 0],

      ["estratega", "Estratega", "habilidad", "Especialista en conflicto militar.", "🧭", 2, 0, 1, 0, 0, 1, 0, 0],
      ["erudito", "Erudito", "habilidad", "Su fortaleza es el saber.", "📚", 0, 0, 3, 0, 0, 0, 0, 0],
      ["diplomatico", "Diplomático", "habilidad", "Maneja alianzas y acuerdos.", "🤝", 0, 3, 0, 0, 0, 1, 0, 0],
      ["intrigante", "Intrigante", "habilidad", "Conspirar también es un arte.", "🕶️", 0, 0, 0, 3, 0, 0, 0, 0],
      ["administrador", "Administrador", "habilidad", "Sabe ordenar recursos y poder.", "📜", 0, 0, 1, 0, 0, 3, 0, 0],
      ["guerrero", "Guerrero", "habilidad", "Rinde en combate directo.", "⚔️", 3, 0, 0, 0, 1, 0, 0, 0],

      ["alcoholico", "Alcohólico", "negativo", "Pierde control y juicio con facilidad.", "🍷", -1, -1, 0, 0, 0, 0, -5, 0],
      ["codicioso", "Codicioso", "negativo", "El oro manda.", "💰", 0, -1, 0, 1, 0, 1, 0, 0],
      ["cobarde", "Cobarde", "negativo", "Evita el combate y el riesgo.", "🐀", -3, 0, 0, 1, 0, 0, 0, 0],
      ["iracundo", "Iracundo", "negativo", "Reacciona mal y fuerte.", "💥", 1, -2, 0, 1, 0, 0, 0, 0],
      ["perezoso", "Perezoso", "negativo", "Funciona a media máquina.", "🛌", 0, 0, 0, 0, -1, -2, 0, 0],
      ["manipulador", "Manipulador", "negativo", "Gana intriga, pierde confianza.", "🕷️", 0, -2, 0, 3, 0, 0, 0, 0]
    ];

    const insertTrait = db.prepare(`
      INSERT OR IGNORE INTO trait_catalogo (
        trait_key, nombre, tipo, descripcion, icono,
        bonus_marcial, bonus_diplomacia, bonus_conocimiento,
        bonus_intriga, bonus_destreza, bonus_administracion,
        bonus_salud, bonus_fertilidad
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const trait of traits) {
      insertTrait.run(...trait);
    }

    insertTrait.finalize();
  });
}

module.exports = seedData;