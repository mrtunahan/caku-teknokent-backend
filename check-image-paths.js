const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
  }
);

async function checkImagePaths() {
  try {
    console.log('\n📊 DATABASE RESIM YOLLARI KONTROL\n');

    // News tablosu
    const newsImages = await sequelize.query(
      `SELECT id, title, image_url FROM news WHERE image_url IS NOT NULL LIMIT 5`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('📰 NEWS (Haberler):');
    newsImages.forEach(n => console.log(`  - ID ${n.id}: ${n.image_url}`));

    // BoardMembers tablosu
    const boardImages = await sequelize.query(
      `SELECT id, name, image_url FROM board_members WHERE image_url IS NOT NULL LIMIT 5`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('\n👔 BOARD MEMBERS (Yönetim Kurulu):');
    boardImages.forEach(b => console.log(`  - ID ${b.id}: ${b.image_url}`));

    // Companies tablosu
    const companyLogos = await sequelize.query(
      `SELECT id, name, logo_url FROM companies WHERE logo_url IS NOT NULL LIMIT 5`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('\n🏢 COMPANIES (Firmalar):');
    companyLogos.forEach(c => console.log(`  - ID ${c.id}: ${c.logo_url}`));

    // Stakeholders tablosu
    const stakeholderLogos = await sequelize.query(
      `SELECT id, name, logo_url FROM stakeholders WHERE logo_url IS NOT NULL LIMIT 5`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('\n🤝 STAKEHOLDERS (Paydaşlar):');
    stakeholderLogos.forEach(s => console.log(`  - ID ${s.id}: ${s.logo_url}`));

    // Team tablosu
    const teamImages = await sequelize.query(
      `SELECT id, name, image FROM team WHERE image IS NOT NULL LIMIT 5`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log('\n👥 TEAM (Ekip):');
    teamImages.forEach(t => console.log(`  - ID ${t.id}: ${t.image}`));

    console.log('\n✅ Kontrol tamamlandı!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

checkImagePaths();
