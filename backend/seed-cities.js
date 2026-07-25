require('dotenv').config();
const mongoose = require('mongoose');

const CITIES = {
  "Côte d'Ivoire": [
    "ABENGOUROU", "ABOBO", "ABOISSO", "ADIAKE", "ADJAME", "ADZOPE", "AFFERY",
    "AGBOVILLE", "AGNIBILEKRO", "AGOU", "AKOUPE", "ALEPE", "ANOUMABA", "ANYAMA",
    "ARRAH", "ASSINIE-MAFIA", "ASSUEFRY", "ATTECOUBE", "ATTIEGOUAKRO", "AYAME",
    "AZAGUIE", "BAKO", "BANGOLO", "BASSAWA", "BEDIALA", "BEOUMI", "BETTIE",
    "BIANKOUMA", "BINGERVILLE", "BINHOUYE", "BLOLEQUIN", "BOCANDA", "BODOKRO",
    "BONDOUKOU", "BONGOUANOU", "BONIEREDOUGOU", "BONON", "BONOUA", "BOOKO",
    "BOROTOU", "BOTRO", "BOUAFLE", "BOUAKE", "BOUNA", "BOUNDIALI", "BROBO",
    "BUYO", "COCODY", "DABAKALA", "DABOU", "DALOA", "DANANE", "DAOUKRO",
    "DIABO", "DIANRA", "DIAWALA", "DIDIEVI", "DIEGONEFLA", "DIKODOUGOU",
    "DIMBOKRO", "DIOULATIEDOUGOU", "DIVO", "DJEBONOUA", "DJEKANOU",
    "DJIBROSSO", "DOROPO", "DUALLA", "DUEKOUE", "ETTROKRO", "FACOBLY",
    "FERKESSEDOUGOU", "FOUMBOLO", "FRESCO", "FRONAN", "GAGNOA", "GBELEBAN",
    "GBOGUHE", "GBON", "GBONNE", "GOHITAFLA", "GOULIA", "GRABO", "GRAND LAHOU",
    "GRAND ZATTRY", "GRAND-BASSAM", "GRAND-BEREBY", "GUEYO", "GUIBEROUA",
    "GUIEMBE", "GUIGLO", "GUINTEGUELA", "GUITRY", "HIRE", "ISSIA", "JACQUEVILLE",
    "KANAKONO", "KANI", "KANIASSO", "KARAKORO", "KASSERE", "KATIOLA",
    "KOKOUMBO", "KOLIA", "KOMBORODOUGOU", "KONG", "KONGASSO", "KOONAN",
    "KORHOGO", "KORO", "KOUASSI DATTEKRO", "KOUASSI KOUASSIKRO", "KOUIBLY",
    "KOUMASSI", "KOUMBALA", "KOUN FAO", "KOUNAHIRI", "KOUTO", "LAKOTA",
    "LOGOUALE", "M'BAHIAKRO", "M'BATTO", "M'BENGUE", "MADINANI", "MAFERE",
    "MAN", "MANKONO", "MARCORY", "MASSALA", "MAYO", "MEAGUI", "MINIGNAN",
    "MORONDO", "N'DOUCI", "NAPIE", "NASSIAN", "NIABLE", "NIAKARAMADOUGOU",
    "NIELLE", "NIOFOIN", "ODIENNE", "OUANGOLODOUGOU", "OUANINOU", "OUELLE",
    "OUME", "OURAGAHIO", "PLATEAU", "PORT BOUET", "PRIKRO", "RUBINO",
    "SAIOUA", "SAKASSOU", "SAMATIGUILA", "SAN-PEDRO", "SANDEGUE", "SANGOUINE",
    "SARHALA", "SASSANDRA", "SATAMA SOKORO", "SATAMA SOKOURA", "SEGUELA",
    "SEGUELON", "SEYDOUGOU", "SIFIE", "SIKENSI", "SINEMATIALI", "SINFRA",
    "SIPILOU", "SIRASSO", "SONGON", "SOUBRE", "TAABO", "TABOU", "TAFIRE",
    "TAI", "TANDA", "TEHINI", "TENGRELA", "TIAPOUM", "TIASSALE",
    "TIE N'DIEKRO", "TIEBISSOU", "TIEME", "TIEMELEKRO", "TIENINGBOUE",
    "TIENKO", "TIORONIARADOUGOU", "TORTIYA", "TOUBA", "TOULEPLEU", "TOUMODI",
    "TRANSUA", "TREICHVILLE", "VAVOUA", "WOROFLA", "YAKASSE ATTOBROU",
    "YAMOUSSOUKRO", "YOPOUGON", "ZIKISSO", "ZOUAN HOUNIEN", "ZOUKOUGBEU",
    "ZUENOULA",
  ],
  Benin: ["Cotonou", "Porto-Novo", "Parakou", "Abomey", "Ouidah", "Natitingou"],
  "Burkina Faso": ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", "Kaya", "Fada N'Gourma"],
  Mali: ["Bamako", "Sikasso", "Segou", "Koutiala", "Kayes", "Mopti"],
  Togo: ["Lome", "Kara", "Dapaong", "Sokode", "Atakpame", "Kpalime", "Tsevie", "Anie", "Cinkasse", "Notse", "Tabligbo", "Tchamba"],
  Nigeria: ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City"],
  Ghana: ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast", "Noe"],
  "Guinee Conakry": ["Conakry", "Kankan", "Nzerekore", "Kindia", "Labe", "Boke", "Mamou", "Faranah"],
  Senegal: ["Dakar", "Touba", "Thies", "Saint-Louis", "Ziguinchor", "M'bour"],
  Niger: ["Niamey", "Maradi", "Zinder", "Tahoua", "Agadez", "Arlit", "Birni"],
};

async function seedCities() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  console.log('✓ Connected to MongoDB');

  const Tenant = require('./src/modules/tenants/models/Tenant');
  const City = require('./src/modules/stations/models/City');

  const tenant = await Tenant.findOne();
  if (!tenant) {
    console.error('No tenant found. Run seed.js first.');
    process.exit(1);
  }
  console.log('✓ Using tenant:', tenant.name);

  const countryMeta = {
    "Côte d'Ivoire": { code: "225", lat: 6.85, lng: -5.3 },
    "Benin": { code: "229", lat: 6.5, lng: 2.6 },
    "Burkina Faso": { code: "226", lat: 12.37, lng: -1.53 },
    "Mali": { code: "223", lat: 12.65, lng: -8.0 },
    "Togo": { code: "228", lat: 6.13, lng: 1.22 },
    "Nigeria": { code: "234", lat: 6.52, lng: 3.38 },
    "Ghana": { code: "233", lat: 5.56, lng: -0.2 },
    "Guinee Conakry": { code: "224", lat: 9.53, lng: -13.68 },
    "Senegal": { code: "221", lat: 14.69, lng: -17.45 },
    "Niger": { code: "227", lat: 13.51, lng: 2.11 },
  };

  const streets = [
    "Avenue de la République", "Rue du Commerce", "Boulevard de l'Indépendance",
    "Avenue Kwame Nkrumah", "Rue des Arts", "Boulevard du 13 Janvier",
    "Avenue de la Grande Armée", "Rue Principale", "Avenue Patrice Lumumba",
    "Rue de la Paix", "Boulevard Général de Gaulle", "Avenue de la Liberté",
  ];

  const districts = [
    "Centre-Ville", "Quartier Administratif", "Zone Industrielle",
    "Quartier Résidentiel", "Zone Commerciale", "Plateau",
    "Quartier Populaire", "Zone Portuaire", "Cité Administrative",
  ];

  const allDocs = [];
  let idx = 0;
  for (const [country, cities] of Object.entries(CITIES)) {
    const meta = countryMeta[country];
    for (const name of cities) {
      idx++;
      const street = streets[idx % streets.length];
      const num = 100 + (idx % 900);
      const district = districts[idx % districts.length];
      const cc = meta.code;
      const phone1 = `+${cc} ${20000000 + (idx % 9000000)}`;
      const phone2 = `+${cc} ${30000000 + ((idx + 7) % 9000000)}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const email1 = `contact.${slug}@transport.ci`;
      const email2 = `info.${slug}@transport-group.com`;
      const latOff = ((idx % 21) - 10) * 0.08;
      const lngOff = (((idx * 3) % 21) - 10) * 0.08;

      allDocs.push({
        companyId: tenant._id,
        name,
        country,
        isActive: true,
        address1: `${num} ${street}`,
        address2: district,
        phone1,
        phone2,
        email1,
        email2,
        location: { lat: +(meta.lat + latOff).toFixed(6), lng: +(meta.lng + lngOff).toFixed(6) },
      });
    }
  }

  const bulkOps = allDocs.map(({ companyId, name, country, ...rest }) => ({
    updateOne: {
      filter: { companyId, name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, country },
      update: { $set: rest },
      upsert: true,
    },
  }));

  const result = await City.bulkWrite(bulkOps, { ordered: false });
  console.log(`✓ Inserted ${result.upsertedCount} cities, ${result.modifiedCount} matched, ${result.upsertedIds ? Object.keys(result.upsertedIds).length : 0} upserted`);
  await mongoose.disconnect();
  console.log('✓ Done');
}

seedCities().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
